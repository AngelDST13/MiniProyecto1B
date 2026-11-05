// Cliente HTTP base. TODAS las llamadas a la API pasan por aquí:
// agrega el token, maneja timeouts, normaliza errores y detecta sesiones vencidas (401).

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TIMEOUT_MS = 15_000;
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
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details; // errores por campo: { nombre: '...', email: '...' }
  }
}

// El backend responde { error: "texto" } (401) o { error: { message, details } } (resto).
const leerError = (cuerpo) => {
  const error = cuerpo?.error;
  if (typeof error === 'string') return { message: error };
  return { message: error?.message ?? 'Ocurrió un error inesperado', details: error?.details };
};

/**
 * @param {string} path  Ruta relativa: '/clientes', '/ordenes/3'
 * @param {{ method?: string, body?: unknown, auth?: boolean }} [opciones]
 */
export const request = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = tokenStorage.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
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
    const { message, details } = leerError(cuerpo);
    throw new ApiError(message, respuesta.status, details);
  }

  return cuerpo;
};
