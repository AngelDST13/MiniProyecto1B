// Validación de entrada para Cliente.
// Devuelve { datos, errores }: "datos" contiene SOLO los campos permitidos, ya limpios.
// Cualquier campo extra que envíe el cliente (por ejemplo "id") se ignora.
import { limpiarTexto, validarTextoObligatorio } from './helpers.js';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^\+?[0-9\s-]{7,15}$/;
const REGEX_CEDULA = /^[0-9]{6,13}$/;

export const validarCliente = (body = {}) => {
  const datos = {
    nombre: limpiarTexto(body.nombre),
    telefono: limpiarTexto(body.telefono),
    email: limpiarTexto(body.email).toLowerCase(),
    cedula: limpiarTexto(body.cedula),
  };

  const errores = {};

  validarTextoObligatorio(errores, 'nombre', datos.nombre, { min: 3, max: 100 });
  validarTextoObligatorio(errores, 'telefono', datos.telefono, { max: 20 });
  validarTextoObligatorio(errores, 'email', datos.email, { max: 120 });
  validarTextoObligatorio(errores, 'cedula', datos.cedula, { max: 13 });

  // Formatos: solo se revisan si el campo pasó la validación anterior.
  if (!errores.telefono && !REGEX_TELEFONO.test(datos.telefono)) {
    errores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos (se permite +, espacios y guiones)';
  }
  if (!errores.email && !REGEX_EMAIL.test(datos.email)) {
    errores.email = 'El email no tiene un formato válido';
  }
  if (!errores.cedula && !REGEX_CEDULA.test(datos.cedula)) {
    errores.cedula = 'La cédula debe contener solo números (entre 6 y 13 dígitos)';
  }

  return { datos, errores };
};
