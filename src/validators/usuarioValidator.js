// Validación de entrada para las cuentas: registro, inicio de sesión, perfil y contraseñas.
import { cedulaCostaRicaValida, limpiarTexto, normalizarCedula, validarTextoObligatorio } from './helpers.js';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^\+?[0-9\s-]{7,15}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72; // bcrypt solo usa los primeros 72 bytes

const leerPassword = (valor) => (typeof valor === 'string' ? valor : '');

// Contraseña robusta: 8+ caracteres con letras y números.
export const validarPassword = (errores, campo, password) => {
  if (!password) errores[campo] = 'La contraseña es obligatoria';
  else if (password.length < PASSWORD_MIN) errores[campo] = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  else if (password.length > PASSWORD_MAX) errores[campo] = `La contraseña admite máximo ${PASSWORD_MAX} caracteres`;
  else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) errores[campo] = 'La contraseña debe combinar letras y números';
};

const validarCedula = (errores, cedula) => {
  if (!cedula) errores.cedula = 'La cédula es obligatoria';
  else if (!cedulaCostaRicaValida(cedula)) errores.cedula = 'Identificación no válida: cédula física (9 dígitos), jurídica (10) o DIMEX (11-12)';
};

const validarTelefono = (errores, telefono) => {
  if (!telefono) errores.telefono = 'El teléfono es obligatorio';
  else if (!REGEX_TELEFONO.test(telefono)) errores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos';
};

export const validarRegistro = (body = {}) => {
  const datos = {
    nombre: limpiarTexto(body.nombre),
    correo: limpiarTexto(body.correo).toLowerCase(),
    cedula: normalizarCedula(limpiarTexto(body.cedula)),
    telefono: limpiarTexto(body.telefono),
    // La contraseña NO se recorta: los espacios forman parte de ella.
    password: leerPassword(body.password),
  };
  const errores = {};
  validarTextoObligatorio(errores, 'nombre', datos.nombre, { min: 3, max: 100 });
  validarTextoObligatorio(errores, 'correo', datos.correo, { max: 120 });
  if (!errores.correo && !REGEX_CORREO.test(datos.correo)) errores.correo = 'El correo no tiene un formato válido';
  validarCedula(errores, datos.cedula);
  validarTelefono(errores, datos.telefono);
  validarPassword(errores, 'password', datos.password);
  return { datos, errores };
};

export const validarLogin = (body = {}) => {
  const datos = {
    correo: limpiarTexto(body.correo).toLowerCase(),
    password: leerPassword(body.password),
    recordar: body.recordar === true,
  };
  const errores = {};
  if (!datos.correo) errores.correo = 'El campo "correo" es obligatorio';
  if (!datos.password) errores.password = 'El campo "password" es obligatorio';
  return { datos, errores };
};

export const validarPerfil = (body = {}, { cedulaActual }) => {
  const datos = { nombre: limpiarTexto(body.nombre), telefono: limpiarTexto(body.telefono) };
  const errores = {};
  validarTextoObligatorio(errores, 'nombre', datos.nombre, { min: 3, max: 100 });
  validarTelefono(errores, datos.telefono);
  // La cédula solo se puede registrar una vez (por ejemplo, cuentas creadas con Google).
  if (!cedulaActual) {
    datos.cedula = normalizarCedula(limpiarTexto(body.cedula));
    validarCedula(errores, datos.cedula);
  }
  return { datos, errores };
};

export const validarNuevaPassword = (body = {}, campo = 'password') => {
  const password = leerPassword(body[campo]);
  const errores = {};
  validarPassword(errores, campo, password);
  return { password, errores };
};
