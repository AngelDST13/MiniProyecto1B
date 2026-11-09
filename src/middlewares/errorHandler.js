// Middleware final de errores: las respuestas de error salen con el mismo formato:
// { "error": { "code": "...", "message": "...", "details": { ... } } }
// (La única excepción es el 401 del authMiddleware, que responde { "error": "No autorizado" }.)
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

// Errores de mysql2 cuando la base de datos no está disponible
const BASE_NO_DISPONIBLE = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR', 'ER_LOCK_WAIT_TIMEOUT',
]);
const ESPERA_SEGUNDOS = { 429: '60', 503: '30' };

const responder = (res, status, code, message, details) => {
  if (ESPERA_SEGUNDOS[status]) res.set('Retry-After', ESPERA_SEGUNDOS[status]);
  return res.status(status).json({ error: { code, message, details } });
};

export const errorHandler = (err, req, res, next) => {
  // La respuesta ya salió (por ejemplo, el 504 del límite de tiempo): el controlador llegó tarde.
  if (res.headersSent) {
    return err.code === 'ERR_HTTP_HEADERS_SENT' ? undefined : next(err);
  }

  // URL con una secuencia % inválida (por ejemplo /api/clientes/%E0)
  if (err instanceof URIError) {
    return responder(res, 400, 'INVALID_URL', 'La dirección de la petición no es válida');
  }
  // Body mayor al límite o con codificación que express.json no entiende
  if (err.type === 'entity.too.large') {
    return responder(res, 413, 'PAYLOAD_TOO_LARGE', 'El contenido enviado supera el máximo permitido (100 KB)');
  }
  if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') {
    return responder(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'La codificación del contenido no es compatible');
  }

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

  if (BASE_NO_DISPONIBLE.has(err.code)) {
    console.error('[BASE DE DATOS]', err.code, err.message);
    return responder(res, 503, 'DB_UNAVAILABLE', 'El servicio no está disponible en este momento. Intenta de nuevo en unos segundos.');
  }

  // Error inesperado: se registra en consola, pero no se exponen detalles internos.
  console.error('[ERROR]', err);
  return responder(res, 500, 'INTERNAL_ERROR', env.isProduction ? 'Error interno del servidor' : err.message);
};
