// Controlador del agente de IA.
import Anthropic from '@anthropic-ai/sdk';
import { agenteDisponible, conversar } from '../services/agente/agenteService.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const MAX_MENSAJES = 20;
const MAX_CARACTERES = 2000;

// Límite simple por usuario para controlar el costo: 20 preguntas cada 10 minutos.
const VENTANA_MS = 10 * 60 * 1000;
const MAX_PREGUNTAS = 20;
const historialUso = new Map();

const verificarLimite = (usuarioId) => {
  const ahora = Date.now();
  const recientes = (historialUso.get(usuarioId) ?? []).filter((marca) => ahora - marca < VENTANA_MS);
  if (recientes.length >= MAX_PREGUNTAS) {
    throw new AppError('Hiciste muchas preguntas seguidas. Espera unos minutos e inténtalo de nuevo.', 429, 'RATE_LIMIT');
  }
  recientes.push(ahora);
  historialUso.set(usuarioId, recientes);
};

// Valida la conversación que envía el frontend: [{ rol, texto }]
const validarMensajes = (mensajes) => {
  if (!Array.isArray(mensajes) || mensajes.length === 0) {
    throw new AppError('Envía al menos un mensaje', 400, 'VALIDATION_ERROR');
  }
  const limpios = mensajes.slice(-MAX_MENSAJES).map((m) => ({
    rol: m?.rol === 'asistente' ? 'asistente' : 'usuario',
    texto: typeof m?.texto === 'string' ? m.texto.trim() : '',
  }));
  if (limpios.some((m) => !m.texto)) throw new AppError('Hay mensajes vacíos', 400, 'VALIDATION_ERROR');
  if (limpios.some((m) => m.texto.length > MAX_CARACTERES)) {
    throw new AppError(`Cada mensaje admite máximo ${MAX_CARACTERES} caracteres`, 400, 'VALIDATION_ERROR');
  }
  if (limpios.at(-1).rol !== 'usuario') throw new AppError('El último mensaje debe ser del usuario', 400, 'VALIDATION_ERROR');
  // La conversación debe empezar con un mensaje del usuario.
  while (limpios[0].rol !== 'usuario') limpios.shift();
  return limpios;
};

/** GET /api/agente/estado */
export const getEstado = (req, res) => {
  res.status(200).json({ disponible: agenteDisponible(), modelo: agenteDisponible() ? env.agente.modelo : null });
};

/** POST /api/agente/chat  { mensajes: [{ rol: 'usuario' | 'asistente', texto }] } */
export const postChat = async (req, res) => {
  if (!agenteDisponible()) {
    throw new AppError(
      'El asistente de IA no está configurado. Agrega ANTHROPIC_API_KEY en el archivo .env del backend y reinícialo.',
      503,
      'AGENTE_NO_CONFIGURADO',
    );
  }
  const mensajes = validarMensajes(req.body?.mensajes);
  verificarLimite(req.usuarioId);

  try {
    const respuesta = await conversar(mensajes);
    res.status(200).json({ data: respuesta });
  } catch (error) {
    // Errores de la API de Anthropic, del más específico al más general
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AppError('La API key de Anthropic no es válida. Revisa ANTHROPIC_API_KEY en el .env.', 503, 'AGENTE_CREDENCIALES');
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AppError('El servicio de IA está ocupado. Intenta de nuevo en un momento.', 429, 'AGENTE_OCUPADO');
    }
    if (error instanceof Anthropic.APIConnectionError) {
      throw new AppError('No se pudo conectar con el servicio de IA. Revisa la conexión a internet.', 502, 'AGENTE_SIN_CONEXION');
    }
    if (error instanceof Anthropic.APIError) {
      console.error('[agente]', error.status, error.message);
      throw new AppError('El servicio de IA respondió con un error. Intenta de nuevo.', 502, 'AGENTE_ERROR');
    }
    throw error;
  }
};
