// Error de aplicación con código HTTP.
// Los controladores lanzan AppError y el middleware errorHandler responde en JSON.
export class AppError extends Error {
  /**
   * @param {string} message  Mensaje legible para el cliente.
   * @param {number} statusCode Código HTTP (400, 404, 409...).
   * @param {string} code     Código corto para el frontend (VALIDATION_ERROR, NOT_FOUND...).
   * @param {object} [details] Información extra (por ejemplo, errores por campo).
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
