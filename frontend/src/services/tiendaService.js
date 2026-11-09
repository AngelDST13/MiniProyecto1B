// Tienda en línea, portal del cliente y gestión de administración.
import { TIMEOUT_IA_MS, request } from './api.js';

const consulta = (parametros) => {
  const limpios = Object.entries(parametros).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false);
  return limpios.length ? `?${new URLSearchParams(limpios.map(([k, v]) => [k, v === true ? '1' : String(v)]))}` : '';
};

export const tiendaService = {
  catalogo: () => request('/tienda/catalogo', { auth: false }),
  productos: (filtros) => request(`/tienda/productos${consulta(filtros)}`, { auth: false }),
  producto: (slug) => request(`/tienda/productos/${encodeURIComponent(slug)}`, { auth: false }),
  crearPedido: (pedido) => request('/tienda/pedidos', { method: 'POST', body: pedido }),
  armador: () => request('/tienda/armador', { auth: false }),
  empresa: () => request('/tienda/empresa', { auth: false }),
};

export const portalService = {
  pedidos: () => request('/portal/pedidos'),
  pedido: (id) => request(`/portal/pedidos/${id}`),
  cancelarPedido: (id) => request(`/portal/pedidos/${id}/cancelar`, { method: 'POST' }),
  ordenes: () => request('/portal/ordenes'),
  solicitudes: () => request('/portal/solicitudes'),
  facturas: () => request('/portal/facturas'),
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
  vistaPreviaInforme: (conIA = false) => request(`/gestion/informe-diario/vista-previa${conIA ? '?ia=1' : ''}`, { timeoutMs: TIMEOUT_IA_MS }),
  sugerirNota: (id) => request(`/gestion/solicitudes/${id}/sugerir-nota`, { method: 'POST', timeoutMs: TIMEOUT_IA_MS }),
  facturas: () => request('/gestion/facturas'),
  facturables: () => request('/gestion/facturables'),
  emitirFactura: (tipo, id, enviar = true) => request('/gestion/facturas', { method: 'POST', body: { tipo, id, enviar } }),
  reenviarFactura: (id) => request(`/gestion/facturas/${id}/enviar`, { method: 'POST' }),
  anularFactura: (id) => request(`/gestion/facturas/${id}/anular`, { method: 'PATCH' }),
  analisisIA: (dias) => request('/gestion/ia/analisis', { method: 'POST', body: { dias }, timeoutMs: TIMEOUT_IA_MS }),
  automatizacion: () => request('/gestion/automatizacion'),
  ejecutarAutomatizacion: () => request('/gestion/automatizacion/ejecutar', { method: 'POST' }),
  enviarInforme: () => request('/gestion/informe-diario/enviar', { method: 'POST', timeoutMs: TIMEOUT_IA_MS }),
};

export const documentoService = {
  factura: (id) => request(`/documentos/factura/${id}`),
  informeOrden: (id) => request(`/documentos/orden/${id}`),
};
