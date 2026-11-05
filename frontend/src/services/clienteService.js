// CRUD de clientes.
import { request } from './api.js';

export const clienteService = {
  list: () => request('/clientes'),
  get: (id) => request(`/clientes/${id}`),
  create: (datos) => request('/clientes', { method: 'POST', body: datos }),
  update: (id, datos) => request(`/clientes/${id}`, { method: 'PUT', body: datos }),
  remove: (id) => request(`/clientes/${id}`, { method: 'DELETE' }),
};
