// Firma y verificación de tokens JWT.
// El payload solo lleva el id del usuario (sub): nunca contraseñas ni datos sensibles.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ALGORITMO = 'HS256';

export const firmarToken = (usuario) =>
  jwt.sign({ sub: String(usuario.id) }, env.jwt.secret, {
    algorithm: ALGORITMO,
    expiresIn: env.jwt.expiresIn,
  });

// Lanza un error si el token es inválido, fue alterado o ya venció.
export const verificarToken = (token) =>
  jwt.verify(token, env.jwt.secret, { algorithms: [ALGORITMO] });
