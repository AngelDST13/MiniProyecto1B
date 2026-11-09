// Documentos imprimibles: factura y informe técnico del equipo.
// El personal ve cualquiera; un cliente solo los suyos (si no le pertenece, responde 404 para no revelar que existe).
import { pool } from '../config/db.js';
import { FacturaModel } from '../services/facturaService.js';
import { configuracion } from '../services/configuracionService.js';
import { obtenerDetalleOrden } from '../services/informes/detalleOrden.js';
import { AppError } from '../utils/AppError.js';
import { parseId } from '../utils/parseId.js';

const esPersonal = (usuario) => ['admin', 'tecnico'].includes(usuario.rol);

const facturaDelUsuario = (factura, usuario) =>
  factura.usuario_id === usuario.id || (factura.tipo === 'orden' && usuario.cliente_id && factura.cliente_id_orden === usuario.cliente_id);

/** GET /api/documentos/factura/:id */
export const getFacturaDocumento = async (req, res) => {
  const factura = await FacturaModel.findById(parseId(req.params.id));
  if (!factura) throw new AppError('Factura no encontrada', 404, 'NOT_FOUND');
  if (!esPersonal(req.usuario) && !facturaDelUsuario(factura, req.usuario)) throw new AppError('Factura no encontrada', 404, 'NOT_FOUND');
  res.status(200).json({ data: { factura, empresa: await configuracion.empresa() } });
};

/**
 * GET /api/documentos/orden/:id — informe técnico del equipo.
 * El cliente solo lo ve si es su equipo y un administrador ya aprobó su solicitud de informe.
 */
export const getInformeOrden = async (req, res) => {
  const id = parseId(req.params.id);
  const detalle = await obtenerDetalleOrden(id);
  if (!detalle) throw new AppError('Orden no encontrada', 404, 'NOT_FOUND');
  if (!esPersonal(req.usuario)) {
    if (detalle.orden.cliente_id !== req.usuario.cliente_id) throw new AppError('Orden no encontrada', 404, 'NOT_FOUND');
    const [[aprobada]] = await pool.execute(
      "SELECT id FROM solicitudes_informe WHERE orden_id = ? AND usuario_id = ? AND estado = 'Aprobada' LIMIT 1",
      [id, req.usuario.id],
    );
    if (!aprobada) throw new AppError('Solicita el informe desde "Mis equipos": el taller debe aprobarlo primero', 403, 'INFORME_NO_APROBADO');
  }
  res.status(200).json({ data: { ...detalle, empresa: await configuracion.empresa() } });
};
