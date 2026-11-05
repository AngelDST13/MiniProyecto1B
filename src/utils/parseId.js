// Convierte un parámetro de la URL (/:id) en entero positivo o responde 400.
import { AppError } from './AppError.js';

export const parseId = (valor, nombre = 'id') => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`El ${nombre} debe ser un número entero positivo`, 400, 'INVALID_ID');
  }
  return id;
};
