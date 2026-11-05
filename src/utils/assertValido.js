// Lanza un 400 con el detalle por campo si el validador encontró errores.
import { AppError } from './AppError.js';

export const assertValido = (errores, mensaje = 'Datos inválidos') => {
  if (Object.keys(errores).length > 0) {
    throw new AppError(mensaje, 400, 'VALIDATION_ERROR', errores);
  }
};
