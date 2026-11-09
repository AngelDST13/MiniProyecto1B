// Portal del cliente: sus pedidos de la tienda, sus órdenes de reparación y sus solicitudes de informe.
// Todo se filtra por el usuario de la sesión: un cliente nunca ve datos de otro.
import { pool } from '../config/db.js';
import { PedidoModel } from '../models/pedidoModel.js';
import { FacturaModel } from '../services/facturaService.js';
import { AppError } from '../utils/AppError.js';
import { parseId } from '../utils/parseId.js';
import { limpiarTexto } from '../validators/helpers.js';

/** GET /api/portal/pedidos */
export const getMisPedidos = async (req, res) => {
  const pedidos = await PedidoModel.listar({ usuarioId: req.usuario.id });
  res.status(200).json({ total: pedidos.length, data: pedidos });
};

/** GET /api/portal/pedidos/:id */
export const getMiPedido = async (req, res) => {
  const pedido = await PedidoModel.findById(parseId(req.params.id));
  if (!pedido || pedido.usuario_id !== req.usuario.id) throw new AppError('Pedido no encontrado', 404, 'NOT_FOUND');
  res.status(200).json({ data: pedido });
};

/** POST /api/portal/pedidos/:id/cancelar — solo mientras está Pendiente */
export const cancelarMiPedido = async (req, res) => {
  const pedido = await PedidoModel.findById(parseId(req.params.id));
  if (!pedido || pedido.usuario_id !== req.usuario.id) throw new AppError('Pedido no encontrado', 404, 'NOT_FOUND');
  if (pedido.estado !== 'Pendiente') throw new AppError('Solo puedes cancelar pedidos que aún no fueron confirmados', 409, 'NO_CANCELABLE');
  res.status(200).json({ message: 'Pedido cancelado', data: await PedidoModel.cambiarEstado(pedido.id, 'Cancelado') });
};

/** GET /api/portal/ordenes — equipos en reparación vinculados a la cédula del cliente */
export const getMisOrdenes = async (req, res) => {
  if (!req.usuario.cliente_id) return res.status(200).json({ total: 0, data: [], perfilIncompleto: true });
  const [ordenes] = await pool.execute(
    `SELECT o.id, CONCAT('OS-', LPAD(o.id, 4, '0')) AS codigo, o.tipo_equipo, o.marca_modelo, o.serial, o.estado,
            o.fecha_ingreso, o.updated_at,
            (SELECT s.estado FROM solicitudes_informe s WHERE s.orden_id = o.id AND s.usuario_id = ? ORDER BY s.id DESC LIMIT 1) AS ultima_solicitud
     FROM ordenes_servicio o WHERE o.cliente_id = ? ORDER BY o.fecha_ingreso DESC`,
    [req.usuario.id, req.usuario.cliente_id],
  );
  res.status(200).json({ total: ordenes.length, data: ordenes });
};

/** GET /api/portal/solicitudes */
export const getMisSolicitudes = async (req, res) => {
  const [solicitudes] = await pool.execute(
    `SELECT s.id, s.orden_id, CONCAT('OS-', LPAD(s.orden_id, 4, '0')) AS orden, o.marca_modelo, s.mensaje, s.estado,
            s.respuesta_admin, s.created_at, s.revisado_en, s.enviado_en
     FROM solicitudes_informe s JOIN ordenes_servicio o ON o.id = s.orden_id
     WHERE s.usuario_id = ? ORDER BY s.created_at DESC`,
    [req.usuario.id],
  );
  res.status(200).json({ total: solicitudes.length, data: solicitudes });
};

/** POST /api/portal/solicitudes { orden_id, mensaje } — el admin debe aprobarla antes del envío */
export const crearSolicitud = async (req, res) => {
  const ordenId = parseId(req.body?.orden_id, 'orden_id');
  const mensaje = limpiarTexto(req.body?.mensaje).slice(0, 500) || null;

  const [[orden]] = await pool.execute('SELECT id, cliente_id FROM ordenes_servicio WHERE id = ?', [ordenId]);
  if (!orden || !req.usuario.cliente_id || orden.cliente_id !== req.usuario.cliente_id) {
    throw new AppError('Orden no encontrada', 404, 'NOT_FOUND');
  }
  const [[pendiente]] = await pool.execute(
    "SELECT id FROM solicitudes_informe WHERE orden_id = ? AND usuario_id = ? AND estado = 'Pendiente'",
    [ordenId, req.usuario.id],
  );
  if (pendiente) throw new AppError('Ya tienes una solicitud pendiente para esta orden', 409, 'SOLICITUD_PENDIENTE');

  const [resultado] = await pool.execute('INSERT INTO solicitudes_informe (usuario_id, orden_id, mensaje) VALUES (?, ?, ?)', [req.usuario.id, ordenId, mensaje]);
  res.status(201).json({ message: 'Solicitud enviada. El taller la revisará y recibirás el informe por correo.', data: { id: resultado.insertId } });
};

/** GET /api/portal/facturas — facturas de sus compras y de sus equipos reparados */
export const getMisFacturas = async (req, res) => {
  const facturas = await FacturaModel.listar({ usuarioId: req.usuario.id, clienteId: req.usuario.cliente_id });
  res.status(200).json({ total: facturas.length, data: facturas });
};
