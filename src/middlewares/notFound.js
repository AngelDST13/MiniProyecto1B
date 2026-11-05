// Responde 404 en JSON para cualquier ruta que no exista.
import { AppError } from '../utils/AppError.js';

export const notFound = (req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};
