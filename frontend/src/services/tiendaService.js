// Tienda en línea, portal del cliente y gestión de administración.
import { request } from './api.js';

const consulta = (parametros) => {
  const limpios = Object.entries(parametros).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false);
  return limpios.length ? `?${new URLSearchParams(limpios.map(([k, v]) => [k, v === true ? '1' : String(v)]))}` : '';
};

export const tiendaService = {
  catalogo: () => request('/tienda/catalogo', { auth: false }),
  productos: (filtros) => request(`/tienda/productos${consulta(filtros)}`, { auth: false }),
  producto: (slug) => request(`/tienda/productos/${encodeURIComponent(slug)}`, { auth: false }),
  crearPedido: (pedido) => request('/tienda/pedidos', { method: 'POST', body: pedido }),
};

export const portalService = {
  pedidos: () => request('/portal/pedidos'),
  pedido: (id) => request(`/portal/pedidos/${id}`),
  cancelarPedido: (id) => request(`/portal/pedidos/${id}/cancelar`, { method: 'POST' }),
  ordenes: () => request('/portal/ordenes'),
  solicitudes: () => request('/portal/solicitudes'),
  solicitarInforme: (ordenId, mensaje) => request('/portal/solicitudes', { method: 'POST', body: { orden_id: ordenId, mensaje } }),
};

export const gestionService = {
  dashboard: (dias) => request(`/gestion/dashboard?dias=${dias}`),
  pedidos: (filtros = {}) => request(`/gestion/pedidos${consulta(filtros)}`),
  pedido: (id) => request(`/gestion/pedidos/${id}`),
  cambiarEstadoPedido: (id, estado) => request(`/gestion/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } }),
  solicitudes: (estado) => request(`/gestion/solicitudes${consulta({ estado })}`),
  vistaPreviaSolicitud: (id) => request(`/gestion/solicitudes/${id}/vista-previa`),
  aprobarSolicitud: (id, nota) => request(`/gestion/solicitudes/${id}/aprobar`, { method: 'PATCH', body: { nota } }),
  rechazarSolicitud: (id, motivo) => request(`/gestion/solicitudes/${id}/rechazar`, { method: 'PATCH', body: { motivo } }),
  correos: (tipo) => request(`/gestion/correos${consulta({ tipo })}`),
  correo: (id) => request(`/gestion/correos/${id}`),
  probarCorreo: () => request('/gestion/correos/probar', { method: 'POST' }),
  configuracion: () => request('/gestion/configuracion'),
  guardarConfiguracion: (cambios) => request('/gestion/configuracion', { method: 'PUT', body: cambios }),
  vistaPreviaInforme: () => request('/gestion/informe-diario/vista-previa'),
  enviarInforme: () => request('/gestion/informe-diario/enviar', { method: 'POST' }),
};
