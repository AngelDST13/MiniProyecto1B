// Facturas (comprobantes de venta) de pedidos de la tienda y de órdenes del taller.
// Los precios ya incluyen IVA: subtotal = total / (1 + IVA), IVA = total − subtotal.
// Cada pedido u orden tiene como máximo una factura (UNIQUE en la tabla); emitir dos veces devuelve la misma.
import { pool } from '../config/db.js';
import { configuracion } from './configuracionService.js';
import { enviarCorreo } from './correo/correoService.js';
import { correoFactura } from './correo/plantillas.js';
import { obtenerDetalleOrden } from './informes/detalleOrden.js';
import { AppError } from '../utils/AppError.js';

const SELECT = `SELECT f.*, e.nombre AS emisor, o.cliente_id AS cliente_id_orden
  FROM facturas f LEFT JOIN usuarios e ON e.id = f.emitida_por LEFT JOIN ordenes_servicio o ON o.id = f.orden_id`;

const mapear = (fila) =>
  fila && {
    ...fila,
    lineas: typeof fila.lineas === 'string' ? JSON.parse(fila.lineas) : fila.lineas,
    subtotal: Number(fila.subtotal),
    iva: Number(fila.iva),
    total: Number(fila.total),
  };

const redondear = (n) => Math.round(n * 100) / 100;

export const FacturaModel = {
  async findById(id) {
    const [[fila]] = await pool.execute(`${SELECT} WHERE f.id = ?`, [id]);
    return mapear(fila) ?? null;
  },

  async listar({ usuarioId, clienteId } = {}) {
    if (usuarioId) {
      // Facturas del cliente: sus pedidos y las órdenes del taller vinculadas a su cédula
      const [filas] = await pool.execute(
        `${SELECT} WHERE f.usuario_id = ? OR o.cliente_id = ?
         ORDER BY f.created_at DESC`,
        [usuarioId, clienteId ?? 0],
      );
      return filas.map(mapear);
    }
    const [filas] = await pool.query(`${SELECT} ORDER BY f.created_at DESC, f.id DESC LIMIT 300`);
    return filas.map(mapear);
  },

  async anular(id) {
    const [resultado] = await pool.execute("UPDATE facturas SET estado = 'Anulada' WHERE id = ? AND estado = 'Emitida'", [id]);
    if (!resultado.affectedRows) throw new AppError('La factura no existe o ya estaba anulada', 409, 'NO_ANULABLE');
    return this.findById(id);
  },
};

const insertar = async (datos) => {
  const { iva: ivaPorcentaje } = await configuracion.empresa();
  const total = redondear(datos.lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0));
  const subtotal = redondear(total / (1 + ivaPorcentaje / 100));
  const [resultado] = await pool.execute(
    `INSERT INTO facturas (consecutivo, tipo, pedido_id, orden_id, usuario_id, emitida_por, cliente_nombre, cliente_identificacion,
                           cliente_correo, cliente_telefono, cliente_direccion, lineas, subtotal, iva, total, metodo_pago, notas)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.tipo, datos.pedidoId ?? null, datos.ordenId ?? null, datos.usuarioId ?? null, datos.emitidaPor ?? null,
      datos.cliente.nombre, datos.cliente.identificacion ?? null, datos.cliente.correo ?? null, datos.cliente.telefono ?? null,
      datos.cliente.direccion ?? null, JSON.stringify(datos.lineas), subtotal, redondear(total - subtotal), total,
      datos.metodoPago ?? null, datos.notas ?? null,
    ],
  );
  // Consecutivo legible y único: FAC-00000001
  await pool.execute("UPDATE facturas SET consecutivo = CONCAT('FAC-', LPAD(id, 8, '0')) WHERE id = ?", [resultado.insertId]);
  return FacturaModel.findById(resultado.insertId);
};

const existente = async (columna, id) => {
  const [[fila]] = await pool.execute(`SELECT id FROM facturas WHERE ${columna} = ?`, [id]);
  return fila ? FacturaModel.findById(fila.id) : null;
};

/** Factura de un pedido de la tienda (una línea por producto + envío). */
export const emitirFacturaPedido = async (pedidoId, { emitidaPor = null } = {}) => {
  const previa = await existente('pedido_id', pedidoId);
  if (previa) return { factura: previa, nueva: false };

  const [[pedido]] = await pool.execute(
    `SELECT pe.*, u.nombre, u.correo, u.cedula FROM pedidos pe JOIN usuarios u ON u.id = pe.usuario_id WHERE pe.id = ?`,
    [pedidoId],
  );
  if (!pedido) throw new AppError('Pedido no encontrado', 404, 'NOT_FOUND');
  if (pedido.estado === 'Cancelado') throw new AppError('No se factura un pedido cancelado', 409, 'PEDIDO_CANCELADO');

  const [items] = await pool.execute(
    'SELECT pi.nombre_producto, pi.cantidad, pi.precio_unitario, p.sku FROM pedido_items pi JOIN productos p ON p.id = pi.producto_id WHERE pi.pedido_id = ?',
    [pedidoId],
  );
  const lineas = items.map((i) => ({ codigo: i.sku, descripcion: i.nombre_producto, cantidad: i.cantidad, precio_unitario: Number(i.precio_unitario) }));
  if (Number(pedido.costo_envio) > 0) lineas.push({ codigo: 'ENVIO', descripcion: 'Envío a domicilio', cantidad: 1, precio_unitario: Number(pedido.costo_envio) });

  const factura = await insertar({
    tipo: 'pedido', pedidoId, usuarioId: pedido.usuario_id, emitidaPor, lineas, metodoPago: pedido.metodo_pago,
    cliente: { nombre: pedido.nombre, identificacion: pedido.cedula, correo: pedido.correo, telefono: pedido.telefono, direccion: pedido.direccion ? `${pedido.direccion}, ${pedido.ciudad}` : null },
    notas: `Pedido PED-${String(pedidoId).padStart(5, '0')}`,
  });
  return { factura, nueva: true };
};

/**
 * Factura de una orden del taller: repuestos usados + servicio técnico.
 * El servicio es el monto de la cotización aprobada menos los repuestos; sin cotización, el diagnóstico general.
 */
export const emitirFacturaOrden = async (ordenId, { emitidaPor = null } = {}) => {
  const previa = await existente('orden_id', ordenId);
  if (previa) return { factura: previa, nueva: false };

  const detalle = await obtenerDetalleOrden(ordenId);
  if (!detalle) throw new AppError('Orden no encontrada', 404, 'NOT_FOUND');
  const { orden, repuestos, cotizaciones, pagos } = detalle;

  const lineas = repuestos.map((r) => ({ codigo: 'REP', descripcion: r.nombre, cantidad: r.cantidad, precio_unitario: Number(r.precio_unitario) }));
  const totalRepuestos = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0);
  const aprobada = cotizaciones.find((c) => c.estado === 'Aprobada');
  const [[diagnostico]] = await pool.query("SELECT precio_base FROM servicios WHERE nombre = 'Diagnóstico general' LIMIT 1");
  const manoDeObra = aprobada ? Number(aprobada.monto) - totalRepuestos : Number(diagnostico?.precio_base ?? 0);
  if (manoDeObra > 0) {
    lineas.push({ codigo: 'SERV', descripcion: aprobada ? `Servicio técnico: ${aprobada.descripcion}` : 'Diagnóstico general', cantidad: 1, precio_unitario: redondear(manoDeObra) });
  }
  if (!lineas.length) throw new AppError('La orden no tiene repuestos ni servicios para facturar', 409, 'SIN_LINEAS');

  const [[usuario]] = await pool.execute("SELECT id FROM usuarios WHERE cliente_id = ? AND rol = 'cliente' LIMIT 1", [orden.cliente_id]);
  const factura = await insertar({
    tipo: 'orden', ordenId, usuarioId: usuario?.id ?? null, emitidaPor, lineas,
    metodoPago: [...new Set(pagos.map((p) => p.metodo))].join(', ') || null,
    cliente: { nombre: orden.cliente, identificacion: orden.cedula, correo: orden.email, telefono: orden.telefono },
    notas: `Orden ${orden.codigo} · ${orden.tipo_equipo} ${orden.marca_modelo} · S/N ${orden.serial}`,
  });
  return { factura, nueva: true };
};

export const enviarFactura = async (factura) => {
  if (!factura.cliente_correo) return 'Sin correo';
  const empresa = await configuracion.empresa();
  return enviarCorreo({ para: factura.cliente_correo, tipo: 'factura', ...correoFactura({ factura, empresa }) });
};

/** Emisión automática (al entregar). Nunca interrumpe el flujo principal. */
export const facturarAutomaticamente = async (tipo, id) => {
  try {
    if (!(await configuracion.activo('auto_factura'))) return;
    const { factura, nueva } = tipo === 'pedido' ? await emitirFacturaPedido(id) : await emitirFacturaOrden(id);
    if (nueva) await enviarFactura(factura);
  } catch (error) {
    console.error(`[factura automática] ${tipo} ${id}:`, error.message);
  }
};
