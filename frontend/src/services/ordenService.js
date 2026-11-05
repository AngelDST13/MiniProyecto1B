// CRUD de órdenes de servicio + cambio de estado + repuestos usados.
import { request } from './api.js';

export const ordenService = {
  list: () => request('/ordenes'),
  get: (id) => request(`/ordenes/${id}`),
  create: (datos) => request('/ordenes', { method: 'POST', body: datos }),
  update: (id, datos) => request(`/ordenes/${id}`, { method: 'PUT', body: datos }),
  updateEstado: (id, estado) => request(`/ordenes/${id}/estado`, { method: 'PATCH', body: { estado } }),
  remove: (id) => request(`/ordenes/${id}`, { method: 'DELETE' }),

  addComponente: (id, componenteId, cantidad) =>
    request(`/ordenes/${id}/componentes`, {
      method: 'POST',
      body: { componente_id: componenteId, cantidad },
    }),
  removeComponente: (id, componenteId) =>
    request(`/ordenes/${id}/componentes/${componenteId}`, { method: 'DELETE' }),
};
