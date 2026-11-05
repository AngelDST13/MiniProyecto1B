// CRUD de componentes / repuestos.
import { request } from './api.js';

export const componenteService = {
  list: () => request('/componentes'),
  get: (id) => request(`/componentes/${id}`),
  create: (datos) => request('/componentes', { method: 'POST', body: datos }),
  update: (id, datos) => request(`/componentes/${id}`, { method: 'PUT', body: datos }),
  remove: (id) => request(`/componentes/${id}`, { method: 'DELETE' }),
};
