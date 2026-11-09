// Cliente HTTP base. TODAS las llamadas a la API pasan por aquí:
// agrega el token, maneja timeouts, normaliza errores y detecta sesiones vencidas (401).

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TIMEOUT_MS = 15_000;
// Las respuestas de la IA tardan más; el backend corta a los 120 s con un 504.
export const TIMEOUT_IA_MS = 125_000;
const TOKEN_KEY = 'bancada.token';

// Evento global que escucha el AuthContext para cerrar la sesión.
export const EVENTO_SESION_VENCIDA = 'bancada:sesion-vencida';

// localStorage puede fallar (modo privado, almacenamiento bloqueado): siempre con try/catch.
export const tokenStorage = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* sin almacenamiento disponible */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento disponible */ }
  },
};

export class ApiError extends Error {
  constructor(message, status, details, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details; // errores por campo: { nombre: '...', email: '...' }
    this.code = code; // código del backend, por ejemplo CORREO_NO_VERIFICADO
  }
}

// El backend responde { error: "texto" } (401) o { error: { message, details } } (resto).
// Si la respuesta no trae mensaje (por ejemplo, un proxy devolvió HTML) se usa el del código de estado.
const MENSAJE_POR_ESTADO = {
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  405: 'Esta acción no está disponible.',
  413: 'El contenido enviado es demasiado grande.',
  415: 'El formato de los datos enviados no es compatible.',
  429: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  500: 'Ocurrió un error en el servidor. Intenta de nuevo.',
  502: 'Un servicio externo no respondió correctamente. Intenta de nuevo.',
  503: 'El servicio no está disponible en este momento. Intenta en unos segundos.',
  504: 'La operación tardó demasiado. Intenta de nuevo.',
};

const leerError = (cuerpo, status) => {
  const error = cuerpo?.error;
  if (typeof error === 'string') return { message: error };
  return { message: error?.message ?? MENSAJE_POR_ESTADO[status] ?? 'Ocurrió un error inesperado', details: error?.details, code: error?.code };
};

/**
 * @param {string} path  Ruta relativa: '/clientes', '/ordenes/3'
 * @param {{ method?: string, body?: unknown, auth?: boolean, timeoutMs?: number }} [opciones]
 */
export const request = async (path, { method = 'GET', body, auth = true, timeoutMs = TIMEOUT_MS } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = tokenStorage.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError(MENSAJE_POR_ESTADO[504], 0, undefined, 'TIMEOUT');
    throw new ApiError('No se pudo conectar con el servidor. Verifica que el backend esté encendido.', 0);
  } finally {
    clearTimeout(timeout);
  }

  if (respuesta.status === 204) return null;
  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    // Token vencido o inválido en una ruta protegida → cerrar sesión.
    if (respuesta.status === 401 && auth) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(EVENTO_SESION_VENCIDA));
    }
    const { message, details, code } = leerError(cuerpo, respuesta.status);
    throw new ApiError(message, respuesta.status, details, code);
  }

  return cuerpo;
};
