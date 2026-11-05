// Firma y verificación de tokens JWT.
// El payload solo lleva el id del usuario (sub) y el tipo de token: nunca contraseñas ni datos sensibles.
//  - "sesion": da acceso a la API (8 h, o 30 días con "Recordarme").
//  - "desafio_2fa": solo sirve para enviar el código de verificación en dos pasos (5 minutos).
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ALGORITMO = 'HS256';
export const DURACION_RECORDARME = '30d';

export const firmarToken = (usuario, { recordar = false } = {}) =>
  jwt.sign({ sub: String(usuario.id), tipo: 'sesion' }, env.jwt.secret, {
    algorithm: ALGORITMO,
    expiresIn: recordar ? DURACION_RECORDARME : env.jwt.expiresIn,
  });

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
