// Endpoints de autenticación y de la cuenta del usuario.
import { request } from './api.js';

const publico = (ruta, body) => request(ruta, { method: 'POST', body, auth: false });

export const authService = {
  config: () => request('/auth/config', { auth: false }),

  /** @returns {Promise<{ token, usuario, expiresIn } | { requiere2fa: true, desafio, correo }>} */
  login: (correo, password, recordar) => publico('/auth/login', { correo, password, recordar }),
  dosPasos: (desafio, codigo) => publico('/auth/dos-pasos', { desafio, codigo }),
  google: (credential) => publico('/auth/google', { credential }),

  register: (datos) => publico('/auth/register', datos),
  verificarCorreo: (token) => publico('/auth/verificar-correo', { token }),
  reenviarVerificacion: (correo) => publico('/auth/reenviar-verificacion', { correo }),
  olvideContrasena: (correo) => publico('/auth/olvide-contrasena', { correo }),
  restablecerContrasena: (token, password) => publico('/auth/restablecer-contrasena', { token, password }),

  me: () => request('/auth/me'),
  actualizarPerfil: (datos) => request('/auth/perfil', { method: 'PUT', body: datos }),
  cambiarPassword: (actual, nueva) => request('/auth/password', { method: 'PUT', body: { actual, nueva } }),
  configurarDosPasos: (activo) => request('/auth/dos-pasos', { method: 'PUT', body: { activo } }),
};
