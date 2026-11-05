// Controlador de autenticación: registro, inicio de sesión y perfil actual.
import bcrypt from 'bcryptjs';
import { UsuarioModel } from '../models/usuarioModel.js';
import { validarLogin, validarRegistro } from '../validators/usuarioValidator.js';
import { AppError } from '../utils/AppError.js';
import { assertValido } from '../utils/assertValido.js';
import { firmarToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;

// Hash "señuelo": si el correo no existe se compara igual contra él,
// así la respuesta tarda lo mismo y no se revela qué correos están registrados.
const HASH_SENUELO = bcrypt.hashSync('contraseña-que-nadie-usa', SALT_ROUNDS);

/** POST /api/auth/register */
export const register = async (req, res) => {
  const { datos, errores } = validarRegistro(req.body);
  assertValido(errores, 'Datos de registro inválidos');

  if (await UsuarioModel.existeCorreo(datos.correo)) {
    throw new AppError('Ya existe una cuenta con ese correo', 400, 'CORREO_EN_USO', {
      correo: 'Este correo ya está registrado',
    });
  }

  const passwordHash = await bcrypt.hash(datos.password, SALT_ROUNDS);
  const usuario = await UsuarioModel.create({ nombre: datos.nombre, correo: datos.correo, passwordHash });

  res.status(201).json({ message: 'Usuario registrado correctamente', data: usuario });
};

/** POST /api/auth/login */
export const login = async (req, res) => {
  const { datos, errores } = validarLogin(req.body);
  assertValido(errores, 'Correo y contraseña son obligatorios');

  const usuario = await UsuarioModel.findByCorreoConPassword(datos.correo);
  const passwordCorrecta = await bcrypt.compare(datos.password, usuario?.password_hash ?? HASH_SENUELO);

  if (!usuario || !passwordCorrecta) {
    throw new AppError('Correo o contraseña incorrectos', 401, 'CREDENCIALES_INVALIDAS');
  }

  const { password_hash: _omitido, ...usuarioPublico } = usuario;
  res.status(200).json({
    token: firmarToken(usuarioPublico),
    expiresIn: env.jwt.expiresIn,
    usuario: usuarioPublico,
  });
};

/** GET /api/auth/me (requiere token) */
export const me = async (req, res) => {
  const usuario = await UsuarioModel.findById(req.usuarioId);
  // El token puede ser válido pero el usuario ya no existir.
  if (!usuario) return res.status(401).json({ error: 'No autorizado' });

  res.status(200).json({ data: usuario });
};
