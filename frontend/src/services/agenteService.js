// Agente de IA del taller.
import { TIMEOUT_IA_MS, request } from './api.js';

export const agenteService = {
  /** @returns {Promise<{ disponible: boolean, modelo: string | null }>} */
  estado: () => request('/agente/estado'),

  /**
   * @param {{ rol: 'usuario' | 'asistente', texto: string }[]} mensajes  Conversación (termina en "usuario")
   * @returns {Promise<{ data: { texto: string, herramientas: string[], modelo: string } }>}
   */
  conversar: (mensajes) => request('/agente/chat', { method: 'POST', body: { mensajes }, timeoutMs: TIMEOUT_IA_MS }),
};
