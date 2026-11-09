// Firma y verificación de tokens JWT.
// El payload solo lleva el id del usuario (sub) y datos de la sesión: nunca contraseñas ni datos sensibles.
//  - "sesion": da acceso a la API. Vence a los 15 minutos (INACTIVIDAD_MINUTOS); el frontend lo renueva
//    mientras el usuario está activo. Si deja de usar la app 15 minutos, la sesión se cierra sola.
//    "inicio" marca cuándo empezó: ninguna sesión dura más de 8 h (o 30 días con "Recordarme").
//  - "desafio_2fa": solo sirve para enviar el código de verificación en dos pasos (5 minutos).
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ALGORITMO = 'HS256';

export const duracionSesion = () => `${env.jwt.inactividadMinutos}m`;

export const firmarToken = (usuario, { recordar = false, inicio = Math.floor(Date.now() / 1000) } = {}) =>
  jwt.sign({ sub: String(usuario.id), tipo: 'sesion', recordar: Boolean(recordar), inicio }, env.jwt.secret, {
    algorithm: ALGORITMO,
    expiresIn: duracionSesion(),
  });

// ¿La sesión todavía está dentro de su duración máxima?
export const sesionVigente = (payload) => {
  const maximoHoras = payload.recordar ? env.jwt.maximoHorasRecordar : env.jwt.maximoHoras;
  return Date.now() / 1000 - (payload.inicio ?? payload.iat) < maximoHoras * 3600;
};

export const firmarDesafio2fa = (usuarioId, recordar) =>
  jwt.sign({ sub: String(usuarioId), tipo: 'desafio_2fa', recordar: Boolean(recordar) }, env.jwt.secret, {
    algorithm: ALGORITMO,
    expiresIn: '5m',
  });

// Lanza un error si el token es inválido, fue alterado, venció o no es del tipo esperado.
export const verificarToken = (token, tipoEsperado = 'sesion') => {
  const payload = jwt.verify(token, env.jwt.secret, { algorithms: [ALGORITMO] });
  if (payload.tipo !== tipoEsperado) throw new Error('Tipo de token no válido');
  return payload;
};
