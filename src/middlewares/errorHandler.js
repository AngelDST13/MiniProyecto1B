// Middleware final de errores: las respuestas de error salen con el mismo formato:
// { "error": { "code": "...", "message": "...", "details": { ... } } }
// (La única excepción es el 401 del authMiddleware, que responde { "error": "No autorizado" }.)
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const responder = (res, status, code, message, details) =>
  res.status(status).json({ error: { code, message, details } });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // JSON mal formado en el body (lo lanza express.json)
  if (err.type === 'entity.parse.failed') {
    return responder(res, 400, 'INVALID_JSON', 'El cuerpo de la petición no es un JSON válido');
  }

  if (err instanceof AppError) {
    return responder(res, err.statusCode, err.code, err.message, err.details);
  }

  // Respaldos de la base de datos (por si dos peticiones llegan al mismo tiempo)
  if (err.code === 'ER_DUP_ENTRY') {
    return responder(res, 409, 'DUPLICATE_ENTRY', 'Ya existe un registro con esos datos');
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return responder(res, 409, 'HAS_DEPENDENCIES', 'No se puede eliminar: otros registros dependen de este');
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return responder(res, 400, 'INVALID_REFERENCE', 'El registro relacionado no existe');
  }

  // Error inesperado: se registra en consola, pero no se exponen detalles internos.
  console.error('[ERROR]', err);
  return responder(res, 500, 'INTERNAL_ERROR', env.isProduction ? 'Error interno del servidor' : err.message);
};
