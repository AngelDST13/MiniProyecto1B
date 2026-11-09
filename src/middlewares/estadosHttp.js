// Middlewares globales que responden con su propio código de estado:
//   501 método HTTP que la API no implementa
//   415 el cuerpo de la petición no es JSON
//   504 la petición tardó más que el límite
import { AppError } from '../utils/AppError.js';

const METODOS_IMPLEMENTADOS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
const METODOS_CON_CUERPO = new Set(['POST', 'PUT', 'PATCH']);

export const metodoImplementado = (req, res, next) => {
  if (METODOS_IMPLEMENTADOS.has(req.method)) return next();
  return next(new AppError(`El método ${req.method} no está implementado en esta API`, 501, 'NOT_IMPLEMENTED'));
};

// Un POST sin datos llega con Content-Length: 0 y no debe rechazarse.
const traeCuerpo = (req) => Number(req.headers['content-length']) > 0 || Boolean(req.headers['transfer-encoding']);

export const soloJson = (req, res, next) => {
  if (METODOS_CON_CUERPO.has(req.method) && traeCuerpo(req) && !req.is('json')) {
    return next(new AppError('El cuerpo de la petición debe enviarse como application/json', 415, 'UNSUPPORTED_MEDIA_TYPE'));
  }
  return next();
};

// Responde aquí directamente: esta función ya llamó a next() y no puede volver a llamarlo más tarde.
export const limiteTiempo = (milisegundos) => (req, res, next) => {
  const temporizador = setTimeout(() => {
    if (res.headersSent) return;
    res.status(504).json({ error: { code: 'GATEWAY_TIMEOUT', message: 'La operación tardó demasiado. Intenta de nuevo.' } });
  }, milisegundos);
  res.on('close', () => clearTimeout(temporizador));
  next();
};

// Revalidación del catálogo: el navegador pregunta siempre y, si no cambió, recibe 304 sin cuerpo.
// Express calcula el ETag de cada respuesta y compara If-None-Match por su cuenta.
export const revalidarSiempre = (req, res, next) => {
  if (req.method === 'GET') res.set('Cache-Control', 'no-cache');
  next();
};
