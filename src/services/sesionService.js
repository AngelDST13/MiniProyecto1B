// Emisión de sesiones e historial de inicios de sesión.
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { UsuarioModel } from '../models/usuarioModel.js';
import { DURACION_RECORDARME, firmarToken } from '../utils/jwt.js';
import { configuracion } from './configuracionService.js';
import { enviarCorreo } from './correo/correoService.js';
import { correoNuevoInicio } from './correo/plantillas.js';

const datosCliente = (req) => ({
  ip: (req.ip ?? '').replace('::ffff:', '').slice(0, 45),
  agente: (req.headers['user-agent'] ?? '').slice(0, 255),
});

export const registrarInicio = async (req, { usuarioId = null, correo, exito, motivo = null }) => {
  const { ip, agente } = datosCliente(req);
  await pool.execute(
    'INSERT INTO inicios_sesion (usuario_id, correo, exito, motivo, ip, agente_usuario) VALUES (?, ?, ?, ?, ?, ?)',
    [usuarioId, String(correo ?? '').slice(0, 120), exito ? 1 : 0, motivo, ip, agente],
  );
};

// ¿Es la primera vez que este usuario entra desde esta IP + navegador? (sin contar su primer acceso)
const esDispositivoNuevo = async (usuarioId, { ip, agente }) => {
  const [[{ previos, conocidos }]] = await pool.execute(
    `SELECT COUNT(*) AS previos, SUM(ip = ? AND agente_usuario = ?) AS conocidos
     FROM inicios_sesion WHERE usuario_id = ? AND exito = 1 AND fecha > DATE_SUB(NOW(), INTERVAL 90 DAY)`,
    [ip, agente, usuarioId],
  );
  return Number(previos) > 0 && Number(conocidos ?? 0) === 0;
};

/**
 * Último paso de cualquier inicio de sesión (contraseña, código 2FA o Google):
 * avisa si es un dispositivo nuevo, registra el acceso y devuelve el token.
 */
export const emitirSesion = async (req, usuario, { recordar = false } = {}) => {
  const cliente = datosCliente(req);

  if ((await esDispositivoNuevo(usuario.id, cliente)) && (await configuracion.activo('notificar_inicio_sesion'))) {
    // Sin await: el aviso no debe retrasar el inicio de sesión
    enviarCorreo({ para: usuario.correo, tipo: 'nuevo_inicio', ...correoNuevoInicio({ nombre: usuario.nombre, ...cliente }) });
  }

  await UsuarioModel.registrarAccesoExitoso(usuario.id);
  await registrarInicio(req, { usuarioId: usuario.id, correo: usuario.correo, exito: true });

  return {
    token: firmarToken(usuario, { recordar }),
    expiresIn: recordar ? DURACION_RECORDARME : env.jwt.expiresIn,
    usuario: await UsuarioModel.findById(usuario.id),
  };
};
