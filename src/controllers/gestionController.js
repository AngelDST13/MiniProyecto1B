// Gestión (solo administradores): dashboard, pedidos de la tienda, solicitudes de informe,
// correos enviados, configuración y el informe diario.
import { pool } from '../config/db.js';
import { ESTADOS_PEDIDO, PedidoModel } from '../models/pedidoModel.js';
import { datosDashboard } from '../services/informes/dashboardService.js';
import { obtenerDetalleOrden } from '../services/informes/detalleOrden.js';
import { enviarInformeDiario, generarInformeDiario } from '../services/informes/informeDiarioService.js';
import { configuracion } from '../services/configuracionService.js';
import { correoConfigurado, enviarCorreo, probarConexion } from '../services/correo/correoService.js';
import { correoInformeOrden, correoPedidoEstado, correoSolicitudRechazada } from '../services/correo/plantillas.js';
import { AppError } from '../utils/AppError.js';
import { parseId } from '../utils/parseId.js';
import { limpiarTexto } from '../validators/helpers.js';
import { FacturaModel, emitirFacturaOrden, emitirFacturaPedido, enviarFactura, facturarAutomaticamente } from '../services/facturaService.js';
import { analizarDashboard, redactarNotaInforme } from '../services/agente/iaService.js';
import { ejecutarReglasPeriodicas, estadoAutomatizaciones, recordarCitas } from '../jobs/automatizaciones.js';

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------
/** GET /api/gestion/dashboard?dias=30 */
export const getDashboard = async (req, res) => {
  const dias = [7, 30, 90].includes(Number(req.query.dias)) ? Number(req.query.dias) : 30;
  res.status(200).json({ data: await datosDashboard(dias) });
};

// ---------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------
/** GET /api/gestion/pedidos?estado=&q= */
export const getPedidos = async (req, res) => {
  const estado = ESTADOS_PEDIDO.includes(req.query.estado) ? req.query.estado : undefined;
  const pedidos = await PedidoModel.listar({ estado, q: limpiarTexto(req.query.q).slice(0, 80) });
  res.status(200).json({ total: pedidos.length, data: pedidos, estados: ESTADOS_PEDIDO });
};

/** GET /api/gestion/pedidos/:id */
export const getPedido = async (req, res) => {
  const pedido = await PedidoModel.findById(parseId(req.params.id));
  if (!pedido) throw new AppError('Pedido no encontrado', 404, 'NOT_FOUND');
  res.status(200).json({ data: pedido });
};

/** PATCH /api/gestion/pedidos/:id/estado { estado } — avisa al cliente por correo */
export const cambiarEstadoPedido = async (req, res) => {
  const estado = req.body?.estado;
  if (!ESTADOS_PEDIDO.includes(estado)) throw new AppError(`Estado no válido. Opciones: ${ESTADOS_PEDIDO.join(', ')}`, 400, 'VALIDATION_ERROR');
  const pedido = await PedidoModel.cambiarEstado(parseId(req.params.id), estado);
  enviarCorreo({ para: pedido.correo, tipo: 'pedido_estado', ...correoPedidoEstado({ nombre: pedido.cliente, pedido }) });
  if (estado === 'Entregado') facturarAutomaticamente('pedido', pedido.id);
  res.status(200).json({ message: `Pedido ${pedido.codigo}: ${estado}. Se avisó al cliente por correo.`, data: pedido });
};

// ---------------------------------------------------------------------
// Solicitudes de informe (el cliente pide, el admin aprueba o rechaza)
// ---------------------------------------------------------------------
const SELECT_SOLICITUD = `
  SELECT s.*, CONCAT('OS-', LPAD(s.orden_id, 4, '0')) AS orden, o.marca_modelo, o.estado AS estado_orden,
         u.nombre AS cliente, u.correo, r.nombre AS revisor
  FROM solicitudes_informe s
  JOIN ordenes_servicio o ON o.id = s.orden_id
  JOIN usuarios u ON u.id = s.usuario_id
  LEFT JOIN usuarios r ON r.id = s.revisado_por`;

const buscarSolicitudPendiente = async (id) => {
  const [[solicitud]] = await pool.execute(`${SELECT_SOLICITUD} WHERE s.id = ?`, [id]);
  if (!solicitud) throw new AppError('Solicitud no encontrada', 404, 'NOT_FOUND');
  if (solicitud.estado !== 'Pendiente') throw new AppError(`La solicitud ya fue ${solicitud.estado.toLowerCase()}`, 409, 'YA_REVISADA');
  return solicitud;
};

/** GET /api/gestion/solicitudes?estado= */
export const getSolicitudes = async (req, res) => {
  const estado = ['Pendiente', 'Aprobada', 'Rechazada'].includes(req.query.estado) ? req.query.estado : null;
  const [solicitudes] = await pool.execute(
    `${SELECT_SOLICITUD} ${estado ? 'WHERE s.estado = ?' : ''} ORDER BY s.estado = 'Pendiente' DESC, s.created_at DESC`,
    estado ? [estado] : [],
  );
  res.status(200).json({ total: solicitudes.length, data: solicitudes });
};

/** GET /api/gestion/solicitudes/:id/vista-previa — HTML del informe que recibiría el cliente */
export const vistaPreviaSolicitud = async (req, res) => {
  const [[solicitud]] = await pool.execute(`${SELECT_SOLICITUD} WHERE s.id = ?`, [parseId(req.params.id)]);
  if (!solicitud) throw new AppError('Solicitud no encontrada', 404, 'NOT_FOUND');
  const detalle = await obtenerDetalleOrden(solicitud.orden_id);
  res.status(200).json({ data: correoInformeOrden({ nombre: solicitud.cliente, detalle, nota: null }) });
};

/** PATCH /api/gestion/solicitudes/:id/aprobar { nota? } — envía el informe al cliente */
export const aprobarSolicitud = async (req, res) => {
  const solicitud = await buscarSolicitudPendiente(parseId(req.params.id));
  const nota = limpiarTexto(req.body?.nota).slice(0, 500) || null;
  const detalle = await obtenerDetalleOrden(solicitud.orden_id);
  const estadoEnvio = await enviarCorreo({ para: solicitud.correo, tipo: 'informe_cliente', ...correoInformeOrden({ nombre: solicitud.cliente, detalle, nota }) });
  if (estadoEnvio === 'Error') throw new AppError('No se pudo enviar el correo al cliente. Revisa la configuración de correo.', 502, 'CORREO_ERROR');

  await pool.execute(
    "UPDATE solicitudes_informe SET estado = 'Aprobada', respuesta_admin = ?, revisado_por = ?, revisado_en = NOW(), enviado_en = NOW() WHERE id = ?",
    [nota, req.usuario.id, solicitud.id],
  );
  res.status(200).json({ message: `Informe enviado a ${solicitud.correo}${estadoEnvio === 'Simulado' ? ' (correo simulado)' : ''}` });
};

/** PATCH /api/gestion/solicitudes/:id/rechazar { motivo } */
export const rechazarSolicitud = async (req, res) => {
  const solicitud = await buscarSolicitudPendiente(parseId(req.params.id));
  const motivo = limpiarTexto(req.body?.motivo).slice(0, 500);
  if (motivo.length < 5) throw new AppError('Explica brevemente el motivo del rechazo', 400, 'VALIDATION_ERROR', { motivo: 'Escribe el motivo (mínimo 5 caracteres)' });

  await pool.execute(
    "UPDATE solicitudes_informe SET estado = 'Rechazada', respuesta_admin = ?, revisado_por = ?, revisado_en = NOW() WHERE id = ?",
    [motivo, req.usuario.id, solicitud.id],
  );
  enviarCorreo({ para: solicitud.correo, tipo: 'solicitud_rechazada', ...correoSolicitudRechazada({ nombre: solicitud.cliente, orden: solicitud.orden_id, motivo }) });
  res.status(200).json({ message: 'Solicitud rechazada. Se avisó al cliente.' });
};

// ---------------------------------------------------------------------
// Correos, configuración e informe diario
// ---------------------------------------------------------------------
/** GET /api/gestion/correos?tipo= */
export const getCorreos = async (req, res) => {
  const tipo = limpiarTexto(req.query.tipo).slice(0, 40);
  const [correos] = await pool.execute(
    `SELECT id, destinatario, asunto, tipo, estado, error, fecha FROM correos_enviados ${tipo ? 'WHERE tipo = ?' : ''} ORDER BY fecha DESC, id DESC LIMIT 200`,
    tipo ? [tipo] : [],
  );
  res.status(200).json({ total: correos.length, data: correos, smtpConfigurado: correoConfigurado() });
};

/** GET /api/gestion/correos/:id — incluye el HTML para la vista previa */
export const getCorreo = async (req, res) => {
  const [[correo]] = await pool.execute('SELECT * FROM correos_enviados WHERE id = ?', [parseId(req.params.id)]);
  if (!correo) throw new AppError('Correo no encontrado', 404, 'NOT_FOUND');
  res.status(200).json({ data: correo });
};

/** POST /api/gestion/correos/probar */
export const probarCorreo = async (req, res) => {
  res.status(200).json({ data: await probarConexion() });
};

/** GET /api/gestion/configuracion */
export const getConfiguracion = async (req, res) => {
  res.status(200).json({ data: await configuracion.todas(), smtpConfigurado: correoConfigurado() });
};

/** PUT /api/gestion/configuracion { clave: valor, ... } */
export const putConfiguracion = async (req, res) => {
  res.status(200).json({ message: 'Configuración guardada', data: await configuracion.guardar(req.body) });
};

/** GET /api/gestion/informe-diario/vista-previa */
export const vistaPreviaInforme = async (req, res) => {
  const { datos, asunto, html, analisisIA } = await generarInformeDiario(undefined, { conIA: req.query.ia === '1' });
  res.status(200).json({ data: { asunto, html, datos, analisisIA } });
};

/** POST /api/gestion/informe-diario/enviar — envía el informe de hoy ahora mismo */
export const enviarInformeAhora = async (req, res) => {
  const { estado, para } = await enviarInformeDiario();
  if (!para.length) throw new AppError('No hay destinatarios: agrega correos en la configuración o verifica un administrador', 400, 'SIN_DESTINATARIOS');
  res.status(200).json({ message: `Informe ${estado === 'Simulado' ? 'generado (correo simulado)' : estado.toLowerCase()} para ${para.join(', ')}`, data: { estado, para } });
};

// ---------------------------------------------------------------------
// Facturas
// ---------------------------------------------------------------------
/** GET /api/gestion/facturas */
export const getFacturas = async (req, res) => {
  const facturas = await FacturaModel.listar();
  const emitidas = facturas.filter((f) => f.estado === 'Emitida');
  res.status(200).json({
    total: facturas.length,
    data: facturas,
    resumen: { emitidas: emitidas.length, monto: emitidas.reduce((s, f) => s + f.total, 0), iva: emitidas.reduce((s, f) => s + f.iva, 0) },
  });
};

/** POST /api/gestion/facturas { tipo: 'pedido' | 'orden', id, enviar? } — idempotente */
export const emitirFactura = async (req, res) => {
  const tipo = req.body?.tipo;
  if (!['pedido', 'orden'].includes(tipo)) throw new AppError('Indica si la factura es de un pedido o de una orden', 400, 'VALIDATION_ERROR');
  const id = parseId(req.body?.id, 'id');
  const opciones = { emitidaPor: req.usuario.id };
  const { factura, nueva } = tipo === 'pedido' ? await emitirFacturaPedido(id, opciones) : await emitirFacturaOrden(id, opciones);
  const envio = req.body?.enviar && nueva ? await enviarFactura(factura) : null;
  res.status(nueva ? 201 : 200).json({
    message: nueva ? `Factura ${factura.consecutivo} emitida${envio ? ` (correo: ${envio.toLowerCase()})` : ''}` : `Ya existía la factura ${factura.consecutivo}`,
    data: factura,
  });
};

/** POST /api/gestion/facturas/:id/enviar */
export const reenviarFactura = async (req, res) => {
  const factura = await FacturaModel.findById(parseId(req.params.id));
  if (!factura) throw new AppError('Factura no encontrada', 404, 'NOT_FOUND');
  const estado = await enviarFactura(factura);
  if (estado === 'Sin correo') throw new AppError('El cliente de esta factura no tiene correo registrado', 409, 'SIN_CORREO');
  res.status(200).json({ message: `Factura enviada a ${factura.cliente_correo} (${estado.toLowerCase()})` });
};

/** PATCH /api/gestion/facturas/:id/anular */
export const anularFactura = async (req, res) => {
  const factura = await FacturaModel.anular(parseId(req.params.id));
  res.status(200).json({ message: `Factura ${factura.consecutivo} anulada`, data: factura });
};

/** GET /api/gestion/facturables — pedidos y órdenes entregados que aún no tienen factura */
export const getFacturables = async (req, res) => {
  const [pedidos] = await pool.query(
    `SELECT pe.id, CONCAT('PED-', LPAD(pe.id, 5, '0')) AS codigo, u.nombre AS cliente, pe.total, pe.updated_at
     FROM pedidos pe JOIN usuarios u ON u.id = pe.usuario_id
     WHERE pe.estado = 'Entregado' AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.pedido_id = pe.id) ORDER BY pe.updated_at DESC LIMIT 50`,
  );
  const [ordenes] = await pool.query(
    `SELECT o.id, CONCAT('OS-', LPAD(o.id, 4, '0')) AS codigo, c.nombre AS cliente, o.marca_modelo, o.updated_at
     FROM ordenes_servicio o JOIN clientes c ON c.id = o.cliente_id
     WHERE o.estado = 'Entregado' AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.orden_id = o.id) ORDER BY o.updated_at DESC LIMIT 50`,
  );
  res.status(200).json({ data: { pedidos, ordenes } });
};

// ---------------------------------------------------------------------
// Inteligencia artificial
// ---------------------------------------------------------------------
/** POST /api/gestion/ia/analisis { dias } — hallazgos y recomendaciones sobre el dashboard */
export const analisisIA = async (req, res) => {
  const dias = [7, 30, 90].includes(Number(req.body?.dias)) ? Number(req.body.dias) : 30;
  const texto = await analizarDashboard(await datosDashboard(dias));
  res.status(200).json({ data: { texto, dias, generado: new Date().toISOString() } });
};

/** POST /api/gestion/solicitudes/:id/sugerir-nota — borrador de nota para el cliente */
export const sugerirNota = async (req, res) => {
  const [[solicitud]] = await pool.execute('SELECT orden_id FROM solicitudes_informe WHERE id = ?', [parseId(req.params.id)]);
  if (!solicitud) throw new AppError('Solicitud no encontrada', 404, 'NOT_FOUND');
  const detalle = await obtenerDetalleOrden(solicitud.orden_id);
  res.status(200).json({ data: { nota: (await redactarNotaInforme(detalle)).slice(0, 500) } });
};

// ---------------------------------------------------------------------
// Automatización
// ---------------------------------------------------------------------
/** GET /api/gestion/automatizacion — reglas, su configuración y la última ejecución */
export const getAutomatizacion = async (req, res) => {
  res.status(200).json({ data: { configuracion: await configuracion.todas(), ultimas: await estadoAutomatizaciones() } });
};

/** POST /api/gestion/automatizacion/ejecutar — corre ahora las reglas y factura los entregados pendientes */
export const ejecutarAutomatizacion = async (req, res) => {
  const resultados = await ejecutarReglasPeriodicas();
  resultados.recordarCitas = await recordarCitas();
  if (await configuracion.activo('auto_factura')) {
    const [pendientes] = await pool.query(
      `(SELECT 'pedido' AS tipo, pe.id FROM pedidos pe WHERE pe.estado = 'Entregado' AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.pedido_id = pe.id))
       UNION ALL
       (SELECT 'orden' AS tipo, o.id FROM ordenes_servicio o WHERE o.estado = 'Entregado' AND NOT EXISTS (SELECT 1 FROM facturas f WHERE f.orden_id = o.id))
       LIMIT 50`,
    );
    for (const { tipo, id } of pendientes) await facturarAutomaticamente(tipo, id);
    resultados.facturas = pendientes.length;
  }
  res.status(200).json({ message: 'Reglas ejecutadas', data: { resultados, ultimas: await estadoAutomatizaciones() } });
};
