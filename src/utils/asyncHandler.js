// Express 4 no captura errores de funciones async por sí solo.
// Este envoltorio manda cualquier error al middleware errorHandler.
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
