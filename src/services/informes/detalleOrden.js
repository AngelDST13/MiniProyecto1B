// Detalle completo de una orden de servicio. Lo usan el informe que se envía al cliente
// y la herramienta "detalle_orden" del agente de IA.
import { pool } from '../../config/db.js';

const consultar = async (sql, valores) => (await pool.execute(sql, valores))[0];

/** @returns {Promise<null | { orden, repuestos, pagos, cotizaciones, garantias, seguimientos }>} */
export const obtenerDetalleOrden = async (id) => {
  const [orden] = await consultar(
    `SELECT o.id, CONCAT('OS-', LPAD(o.id, 4, '0')) AS codigo, o.cliente_id, o.tipo_equipo, o.marca_modelo, o.serial,
            o.diagnostico, o.estado, o.fecha_ingreso, c.nombre AS cliente, c.cedula, c.telefono, c.email
     FROM ordenes_servicio o JOIN clientes c ON c.id = o.cliente_id WHERE o.id = ?`,
    [id],
  );
  if (!orden) return null;

  const [repuestos, pagos, cotizaciones, garantias, seguimientos] = await Promise.all([
    consultar(
      `SELECT cr.nombre, cr.categoria, oc.cantidad, oc.precio_unitario, oc.cantidad * oc.precio_unitario AS subtotal
       FROM orden_componentes oc JOIN componentes_repuesto cr ON cr.id = oc.componente_id WHERE oc.orden_id = ?`,
      [id],
    ),
    consultar(
      `SELECT p.monto, p.fecha_pago, p.referencia, mp.nombre AS metodo
       FROM pagos p JOIN metodos_pago mp ON mp.id = p.metodo_pago_id WHERE p.orden_id = ? ORDER BY p.fecha_pago`,
      [id],
    ),
    consultar('SELECT descripcion, monto, valida_hasta, estado FROM cotizaciones WHERE orden_id = ?', [id]),
    consultar('SELECT fecha_inicio, fecha_fin, cobertura, estado FROM garantias WHERE orden_id = ?', [id]),
    consultar(
      `SELECT s.fecha, t.nombres AS tecnico, s.nota
       FROM seguimientos s JOIN tecnicos t ON t.id = s.tecnico_id WHERE s.orden_id = ? ORDER BY s.fecha`,
      [id],
    ),
  ]);
  return { orden, repuestos, pagos, cotizaciones, garantias, seguimientos };
};
