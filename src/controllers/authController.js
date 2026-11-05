// Autenticación: registro con cédula y confirmación de correo, inicio de sesión con bloqueo por
// intentos fallidos, verificación en dos pasos, recuperación de contraseña y acceso con Google.
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { UsuarioModel } from '../models/usuarioModel.js';
import { TokenModel } from '../models/tokenModel.js';
import { validarLogin, validarNuevaPassword, validarPerfil, validarRegistro } from '../validators/usuarioValidator.js';
import { AppError } from '../utils/AppError.js';
import { assertValido } from '../utils/assertValido.js';
import { firmarDesafio2fa, verificarToken } from '../utils/jwt.js';
import { crearLimitador } from '../utils/limitador.js';
import { emitirSesion, registrarInicio } from '../services/sesionService.js';
import { enviarCorreo } from '../services/correo/correoService.js';
import { correoCodigo, correoCuentaBloqueada, correoRecuperacion, correoVerificacion } from '../services/correo/plantillas.js';

const SALT_ROUNDS = 10;
const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

// Hash "señuelo": si el correo no existe se compara igual, así la respuesta tarda lo mismo
// y no se revela qué correos están registrados.
const HASH_SENUELO = bcrypt.hashSync('contraseña-que-nadie-usa-1', SALT_ROUNDS);

// Evita que alguien use estos endpoints para llenar de correos a otra persona.
const limitarCorreos = crearLimitador({ maximo: 5, ventanaMs: 15 * 60 * 1000, mensaje: 'Demasiadas solicitudes. Espera unos minutos.' });

const enviarVerificacion = async (usuario) => {
  const token = await TokenModel.crear(usuario.id, 'verificacion', 24 * 60);
  const enlace = `${env.appUrl}/verificar-correo?token=${token}`;
  return enviarCorreo({ para: usuario.correo, tipo: 'verificacion', ...correoVerificacion({ nombre: usuario.nombre, enlace }) });
};

// Vincula la cuenta con la ficha de cliente del taller (por cédula o correo) o crea una nueva,
// así el cliente ve en su portal las órdenes que el taller ya le había registrado.
const vincularCliente = async ({ nombre, correo, cedula, telefono }) => {
  const [existentes] = await pool.execute('SELECT id FROM clientes WHERE cedula = ? OR email = ? LIMIT 1', [cedula, correo]);
  if (existentes[0]) return existentes[0].id;
  const [resultado] = await pool.execute(
    'INSERT INTO clientes (nombre, telefono, email, cedula) VALUES (?, ?, ?, ?)',
    [nombre, telefono, correo, cedula],
  );
  return resultado.insertId;
};

/** GET /api/auth/config — datos públicos que necesita la pantalla de acceso */
export const config = (req, res) => {
  res.status(200).json({ googleClientId: env.googleClientId || null });
};

/** POST /api/auth/register — crea una cuenta de cliente y envía el correo de confirmación */
export const register = async (req, res) => {
  const { datos, errores } = validarRegistro(req.body);
  assertValido(errores, 'Datos de registro inválidos');

  const detalles = {};
  if (await UsuarioModel.existeCorreo(datos.correo)) detalles.correo = 'Este correo ya está registrado';
  if (await UsuarioModel.existeCedula(datos.cedula)) detalles.cedula = 'Esta cédula ya tiene una cuenta';
  if (Object.keys(detalles).length) throw new AppError('Ya existe una cuenta con esos datos', 400, 'CUENTA_EXISTENTE', detalles);

  const usuario = await UsuarioModel.create({
    nombre: datos.nombre,
    correo: datos.correo,
    passwordHash: await bcrypt.hash(datos.password, SALT_ROUNDS),
    cedula: datos.cedula,
    telefono: datos.telefono,
    clienteId: await vincularCliente(datos),
  });
  const envio = await enviarVerificacion(usuario);

  res.status(201).json({
    message: 'Cuenta creada. Te enviamos un correo para confirmarla.',
    correoSimulado: envio === 'Simulado',
    data: usuario,
  });
};

/** POST /api/auth/verificar-correo { token } */
export const verificarCorreo = async (req, res) => {
  const usuarioId = await TokenModel.consumirEnlace('verificacion', req.body?.token);
  if (!usuarioId) throw new AppError('El enlace no es válido o ya venció. Pide uno nuevo desde el inicio de sesión.', 400, 'TOKEN_INVALIDO');
  await UsuarioModel.actualizar(usuarioId, { correo_verificado: 1 });
  res.status(200).json({ message: 'Correo confirmado. Ya puedes iniciar sesión.' });
};

/** POST /api/auth/reenviar-verificacion { correo } — responde igual exista o no la cuenta */
export const reenviarVerificacion = async (req, res) => {
  limitarCorreos(`verif:${req.ip}`);
  const usuario = await UsuarioModel.findByCorreo(String(req.body?.correo ?? '').trim().toLowerCase());
  if (usuario && !usuario.correo_verificado) await enviarVerificacion(usuario);
  res.status(200).json({ message: 'Si la cuenta existe y no está confirmada, te enviamos un nuevo enlace.' });
};

/** POST /api/auth/login { correo, password, recordar } */
export const login = async (req, res) => {
  const { datos, errores } = validarLogin(req.body);
  assertValido(errores, 'Correo y contraseña son obligatorios');

  const usuario = await UsuarioModel.findByCorreoConPassword(datos.correo);

  if (usuario?.bloqueado) {
    await registrarInicio(req, { usuarioId: usuario.id, correo: datos.correo, exito: false, motivo: 'bloqueado' });
    throw new AppError(
      `Tu cuenta está bloqueada por intentos fallidos. Intenta de nuevo en ${usuario.minutos_bloqueo} minuto(s) o restablece tu contraseña.`,
      423,
      'CUENTA_BLOQUEADA',
    );
  }

  const passwordCorrecta = await bcrypt.compare(datos.password, usuario?.password_hash ?? HASH_SENUELO);

  if (!usuario || !passwordCorrecta) {
    await registrarInicio(req, { usuarioId: usuario?.id, correo: datos.correo, exito: false, motivo: 'credenciales' });
    if (usuario) {
      const { intentos, bloqueado } = await UsuarioModel.registrarFallo(usuario.id, { maxIntentos: MAX_INTENTOS, minutosBloqueo: MINUTOS_BLOQUEO });
      if (bloqueado) {
        enviarCorreo({ para: usuario.correo, tipo: 'cuenta_bloqueada', ...correoCuentaBloqueada({ nombre: usuario.nombre, minutos: MINUTOS_BLOQUEO }) });
        throw new AppError(`Demasiados intentos fallidos. Bloqueamos la cuenta ${MINUTOS_BLOQUEO} minutos por seguridad.`, 423, 'CUENTA_BLOQUEADA');
      }
      const restantes = MAX_INTENTOS - intentos;
      if (restantes <= 2) {
        throw new AppError(`Correo o contraseña incorrectos. Te quedan ${restantes} intento(s) antes del bloqueo.`, 401, 'CREDENCIALES_INVALIDAS');
      }
    }
    throw new AppError('Correo o contraseña incorrectos', 401, 'CREDENCIALES_INVALIDAS');
  }

  if (!usuario.correo_verificado) {
    await registrarInicio(req, { usuarioId: usuario.id, correo: datos.correo, exito: false, motivo: 'correo_sin_confirmar' });
    throw new AppError('Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.', 403, 'CORREO_NO_VERIFICADO');
  }

  // Verificación en dos pasos: se envía un código y se devuelve un "desafío" en lugar de la sesión.
  if (usuario.dos_pasos) {
    const codigo = await TokenModel.crear(usuario.id, 'dos_pasos', 10);
    const envio = await enviarCorreo({ para: usuario.correo, tipo: 'codigo_2fa', ...correoCodigo({ nombre: usuario.nombre, codigo }) });
    return res.status(200).json({
      requiere2fa: true,
      desafio: firmarDesafio2fa(usuario.id, datos.recordar),
      correo: usuario.correo.replace(/^(.{2}).*(@.*)$/, '$1•••$2'),
      correoSimulado: envio === 'Simulado',
    });
  }

  res.status(200).json(await emitirSesion(req, usuario, { recordar: datos.recordar }));
};

/** POST /api/auth/dos-pasos { desafio, codigo } */
export const verificarDosPasos = async (req, res) => {
  let desafio;
  try {
    desafio = verificarToken(req.body?.desafio, 'desafio_2fa');
  } catch {
    throw new AppError('La verificación venció. Inicia sesión de nuevo.', 401, 'DESAFIO_INVALIDO');
  }
  const usuarioId = Number(desafio.sub);
  const resultado = await TokenModel.verificarCodigo(usuarioId, req.body?.codigo);
  const usuario = await UsuarioModel.findById(usuarioId);
  if (!resultado.ok) {
    await registrarInicio(req, { usuarioId, correo: usuario?.correo, exito: false, motivo: 'codigo_2fa' });
    throw new AppError(resultado.motivo, 401, 'CODIGO_INVALIDO');
  }
  res.status(200).json(await emitirSesion(req, usuario, { recordar: desafio.recordar }));
};

/** POST /api/auth/olvide-contrasena { correo } — responde igual exista o no la cuenta */
export const olvideContrasena = async (req, res) => {
  limitarCorreos(`recup:${req.ip}`);
  const usuario = await UsuarioModel.findByCorreo(String(req.body?.correo ?? '').trim().toLowerCase());
  let correoSimulado = false;
  if (usuario) {
    const token = await TokenModel.crear(usuario.id, 'recuperacion', 30);
    const enlace = `${env.appUrl}/restablecer-contrasena?token=${token}`;
    const envio = await enviarCorreo({ para: usuario.correo, tipo: 'recuperacion', ...correoRecuperacion({ nombre: usuario.nombre, enlace }) });
    correoSimulado = envio === 'Simulado';
  }
  res.status(200).json({ message: 'Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.', correoSimulado });
};

/** POST /api/auth/restablecer-contrasena { token, password } */
export const restablecerContrasena = async (req, res) => {
  const { password, errores } = validarNuevaPassword(req.body);
  assertValido(errores, 'Contraseña inválida');
  const usuarioId = await TokenModel.consumirEnlace('recuperacion', req.body?.token);
  if (!usuarioId) throw new AppError('El enlace no es válido o ya venció. Solicita uno nuevo.', 400, 'TOKEN_INVALIDO');

  // Restablecer también demuestra que el correo es del usuario y quita el bloqueo.
  await UsuarioModel.actualizar(usuarioId, {
    password_hash: await bcrypt.hash(password, SALT_ROUNDS),
    correo_verificado: 1,
    intentos_fallidos: 0,
    bloqueado_hasta: null,
  });
  res.status(200).json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
};

/** POST /api/auth/google { credential } — credencial (ID token) del botón de Google */
export const loginGoogle = async (req, res) => {
  if (!env.googleClientId) throw new AppError('El inicio de sesión con Google no está configurado', 503, 'GOOGLE_NO_CONFIGURADO');

  let datosGoogle;
  try {
    const ticket = await new OAuth2Client(env.googleClientId).verifyIdToken({ idToken: req.body?.credential, audience: env.googleClientId });
    datosGoogle = ticket.getPayload();
  } catch {
    throw new AppError('No se pudo verificar tu cuenta de Google. Intenta de nuevo.', 401, 'GOOGLE_INVALIDO');
  }
  if (!datosGoogle?.email_verified) throw new AppError('Tu correo de Google no está verificado', 401, 'GOOGLE_INVALIDO');

  const correo = datosGoogle.email.toLowerCase();
  let usuario = (await UsuarioModel.findByGoogleId(datosGoogle.sub)) ?? (await UsuarioModel.findByCorreo(correo));

  if (usuario) {
    // Cuenta existente con el mismo correo: se vincula a Google (Google ya verificó ese correo).
    usuario = await UsuarioModel.actualizar(usuario.id, { google_id: datosGoogle.sub, correo_verificado: 1 });
  } else {
    // Cuenta nueva de cliente: sin cédula todavía; el frontend pedirá completarla.
    usuario = await UsuarioModel.create({ nombre: datosGoogle.name ?? correo, correo, googleId: datosGoogle.sub, correoVerificado: true });
  }
  if (usuario.dos_pasos) {
    const codigo = await TokenModel.crear(usuario.id, 'dos_pasos', 10);
    const envio = await enviarCorreo({ para: usuario.correo, tipo: 'codigo_2fa', ...correoCodigo({ nombre: usuario.nombre, codigo }) });
    return res.status(200).json({ requiere2fa: true, desafio: firmarDesafio2fa(usuario.id, false), correoSimulado: envio === 'Simulado' });
  }
  res.status(200).json(await emitirSesion(req, usuario));
};

/** GET /api/auth/me */
export const me = async (req, res) => {
  const usuario = await UsuarioModel.findById(req.usuarioId);
  if (!usuario) return res.status(401).json({ error: 'No autorizado' });
  res.status(200).json({ data: usuario });
};

/** PUT /api/auth/perfil { nombre, telefono, cedula? } */
export const actualizarPerfil = async (req, res) => {
  const actual = await UsuarioModel.findById(req.usuarioId);
  const { datos, errores } = validarPerfil(req.body, { cedulaActual: actual.cedula });
  assertValido(errores, 'Datos del perfil inválidos');
  if (datos.cedula && (await UsuarioModel.existeCedula(datos.cedula, actual.id))) {
    throw new AppError('Esta cédula ya está registrada en otra cuenta', 400, 'CEDULA_EN_USO', { cedula: 'Esta cédula ya tiene una cuenta' });
  }
  const cambios = { nombre: datos.nombre, telefono: datos.telefono };
  if (datos.cedula) {
    cambios.cedula = datos.cedula;
    if (actual.rol === 'cliente' && !actual.cliente_id) {
      cambios.cliente_id = await vincularCliente({ ...datos, correo: actual.correo });
    }
  }
  res.status(200).json({ message: 'Perfil actualizado', data: await UsuarioModel.actualizar(actual.id, cambios) });
};

/** PUT /api/auth/password { actual, nueva } */
export const cambiarPassword = async (req, res) => {
  const { password: nueva, errores } = validarNuevaPassword(req.body, 'nueva');
  assertValido(errores, 'Contraseña inválida');
  const usuario = await UsuarioModel.findById(req.usuarioId);
  const conHash = await UsuarioModel.findByCorreoConPassword(usuario.correo);
  // Las cuentas creadas con Google no tienen contraseña: pueden crear una sin la anterior.
  if (conHash.password_hash && !(await bcrypt.compare(String(req.body?.actual ?? ''), conHash.password_hash))) {
    throw new AppError('La contraseña actual no es correcta', 400, 'VALIDATION_ERROR', { actual: 'La contraseña actual no es correcta' });
  }
  await UsuarioModel.actualizar(usuario.id, { password_hash: await bcrypt.hash(nueva, SALT_ROUNDS) });
  res.status(200).json({ message: 'Contraseña actualizada' });
};

/** PUT /api/auth/dos-pasos { activo } */
export const configurarDosPasos = async (req, res) => {
  if (typeof req.body?.activo !== 'boolean') throw new AppError('Indica activo: true o false', 400, 'VALIDATION_ERROR');
  const usuario = await UsuarioModel.actualizar(req.usuarioId, { dos_pasos: req.body.activo ? 1 : 0 });
  res.status(200).json({
    message: req.body.activo ? 'Verificación en dos pasos activada' : 'Verificación en dos pasos desactivada',
    data: usuario,
  });
};
