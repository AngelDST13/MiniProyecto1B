// Servicios del módulo de Administración.
import { request } from './api.js';

// El esquema de las entidades casi no cambia: se guarda en memoria durante la sesión.
let esquemaEnCache = null;

export const adminService = {
  /** Lista de los 20 módulos con sus campos y conteo de registros. */
  entidades: async ({ refrescar = false } = {}) => {
    if (!esquemaEnCache || refrescar) esquemaEnCache = await request('/admin/entidades');
    return esquemaEnCache;
  },

  /** [{ id, etiqueta }] para un selector de llave foránea. */
  opciones: (ref) => request(`/admin/opciones/${ref}`),

  /** CRUD genérico: /api/<clave> */
  list: (clave) => request(`/${clave}`),
  create: (clave, datos) => request(`/${clave}`, { method: 'POST', body: datos }),
  update: (clave, id, datos) => request(`/${clave}/${id}`, { method: 'PUT', body: datos }),
  remove: (clave, id) => request(`/${clave}/${id}`, { method: 'DELETE' }),
};
