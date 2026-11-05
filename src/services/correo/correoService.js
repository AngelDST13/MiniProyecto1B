// Envío de correos con Nodemailer (Gmail + contraseña de aplicación).
// Si no hay credenciales SMTP, el correo se "simula": no sale, pero queda guardado en
// correos_enviados con su HTML para revisarlo desde Administración → Correos.
// Nunca lanza errores: devuelve el estado para que el flujo principal no se rompa.
import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { pool } from '../../config/db.js';

export const correoConfigurado = () => Boolean(env.correo.usuario && env.correo.clave);

let transporte = null;
const obtenerTransporte = () => {
  transporte ??= nodemailer.createTransport({
    host: env.correo.host,
    port: env.correo.port,
    secure: env.correo.port === 465,
    auth: { user: env.correo.usuario, pass: env.correo.clave },
  });
  return transporte;
};

const registrar = async ({ para, asunto, tipo, estado, error, html }) => {
  try {
    await pool.execute(
      'INSERT INTO correos_enviados (destinatario, asunto, tipo, estado, error, html) VALUES (?, ?, ?, ?, ?, ?)',
      [para, asunto.slice(0, 255), tipo, estado, error?.slice(0, 500) ?? null, html],
    );
  } catch (err) {
    console.error('[correo] no se pudo registrar el envío:', err.message);
  }
};

/**
 * @param {{ para: string | string[], asunto: string, html: string, tipo: string }} correo
 * @returns {Promise<'Enviado' | 'Simulado' | 'Error'>}
 */
export const enviarCorreo = async ({ para, asunto, html, tipo }) => {
  const destinatarios = Array.isArray(para) ? para.join(', ') : para;

  if (!correoConfigurado()) {
    await registrar({ para: destinatarios, asunto, tipo, estado: 'Simulado', html });
    console.log(`[correo simulado] ${tipo} → ${destinatarios}: ${asunto}`);
    return 'Simulado';
  }

  try {
    await obtenerTransporte().sendMail({ from: env.correo.remitente, to: destinatarios, subject: asunto, html });
    await registrar({ para: destinatarios, asunto, tipo, estado: 'Enviado', html });
    return 'Enviado';
  } catch (error) {
    console.error(`[correo] error enviando ${tipo} a ${destinatarios}:`, error.message);
    await registrar({ para: destinatarios, asunto, tipo, estado: 'Error', error: error.message, html });
    return 'Error';
  }
};

// Verifica la conexión con el servidor SMTP (botón "Probar conexión" del panel).
export const probarConexion = async () => {
  if (!correoConfigurado()) return { ok: false, mensaje: 'Faltan SMTP_USER y SMTP_PASS en el .env' };
  try {
    await obtenerTransporte().verify();
    return { ok: true, mensaje: `Conectado a ${env.correo.host} como ${env.correo.usuario}` };
  } catch (error) {
    return { ok: false, mensaje: error.message };
  }
};
