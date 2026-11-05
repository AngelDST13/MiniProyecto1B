// Validación de entrada para registro e inicio de sesión.
import { limpiarTexto, validarTextoObligatorio } from './helpers.js';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // bcrypt solo usa los primeros 72 bytes

export const validarRegistro = (body = {}) => {
  const datos = {
    nombre: limpiarTexto(body.nombre),
    correo: limpiarTexto(body.correo).toLowerCase(),
    // La contraseña NO se recorta: los espacios forman parte de ella.
    password: typeof body.password === 'string' ? body.password : '',
  };

  const errores = {};

  validarTextoObligatorio(errores, 'nombre', datos.nombre, { min: 3, max: 100 });
  validarTextoObligatorio(errores, 'correo', datos.correo, { max: 120 });
  if (!errores.correo && !REGEX_CORREO.test(datos.correo)) {
    errores.correo = 'El correo no tiene un formato válido';
  }

  if (!datos.password) {
    errores.password = 'El campo "password" es obligatorio';
  } else if (datos.password.length < PASSWORD_MIN) {
    errores.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  } else if (datos.password.length > PASSWORD_MAX) {
    errores.password = `La contraseña admite máximo ${PASSWORD_MAX} caracteres`;
  }

  return { datos, errores };
};

export const validarLogin = (body = {}) => {
  const datos = {
    correo: limpiarTexto(body.correo).toLowerCase(),
    password: typeof body.password === 'string' ? body.password : '',
  };

  const errores = {};
  if (!datos.correo) errores.correo = 'El campo "correo" es obligatorio';
  if (!datos.password) errores.password = 'El campo "password" es obligatorio';

  return { datos, errores };
};
