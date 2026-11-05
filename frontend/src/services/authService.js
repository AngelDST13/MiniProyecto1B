// Endpoints de autenticación. login y register no envían token (auth: false).
import { request } from './api.js';

export const authService = {
  /** @returns {Promise<{ token: string, usuario: object, expiresIn: string }>} */
  login: (correo, password) =>
    request('/auth/login', { method: 'POST', body: { correo, password }, auth: false }),

  register: ({ nombre, correo, password }) =>
    request('/auth/register', { method: 'POST', body: { nombre, correo, password }, auth: false }),

  me: () => request('/auth/me'),
};
