// Pedidos de la tienda. Crear y cancelar mueven stock dentro de una transacción.
import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export const ESTADOS_PEDIDO = ['Pendiente', 'Confirmado', 'Preparando', 'Listo para retirar', 'Enviado', 'Entregado', 'Cancelado'];

const SELECT_PEDIDO = `
  SELECT pe.*, CONCAT('PED-', LPAD(pe.id, 5, '0')) AS codigo, u.nombre AS cliente, u.correo, u.cedula,
         (SELECT COALESCE(SUM(cantidad), 0) FROM pedido_items WHERE pedido_id = pe.id) AS unidades
  FROM pedidos pe JOIN usuarios u ON u.id = pe.usuario_id`;

const conItems = async (pedido) => {
  if (!pedido) return null;
  const [items] = await pool.execute(
    `SELECT pi.producto_id, pi.nombre_producto, pi.cantidad, pi.precio_unitario, p.slug, p.imagen_url, c.icono AS categoria_icono
     FROM pedido_items pi JOIN productos p ON p.id = pi.producto_id JOIN categorias_producto c ON c.id = p.categoria_id
     WHERE pi.pedido_id = ?`,
    [pedido.id],
  );
  return { ...pedido, items };
};

// Devuelve las unidades al inventario
const reponerStock = (conn, pedidoId) =>
  conn.execute(
    'UPDATE productos p JOIN pedido_items pi ON pi.producto_id = p.id SET p.stock = p.stock + pi.cantidad WHERE pi.pedido_id = ?',
    [pedidoId],
  );

export const PedidoModel = {
  async findById(id) {
    const [filas] = await pool.execute(`${SELECT_PEDIDO} WHERE pe.id = ?`, [id]);
    return conItems(filas[0]);
  },

  async listar({ usuarioId, estado, q } = {}) {
    const condiciones = [];
    const valores = [];
    if (usuarioId) {
      condiciones.push('pe.usuario_id = ?');
      valores.push(usuarioId);
    }
    if (estado) {
      condiciones.push('pe.estado = ?');
      valores.push(estado);
    }
    if (q) {
      condiciones.push("(u.nombre LIKE ? OR u.correo LIKE ? OR u.cedula LIKE ? OR CONCAT('PED-', LPAD(pe.id, 5, '0')) LIKE ?)");
      valores.push(...Array(4).fill(`%${q}%`));
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [filas] = await pool.execute(`${SELECT_PEDIDO} ${where} ORDER BY pe.created_at DESC, pe.id DESC LIMIT 200`, valores);
    return filas;
  },

  /**
   * Crea el pedido, verifica y descuenta el stock en una sola transacción.
   * FOR UPDATE bloquea los productos: dos clientes no pueden comprar la última unidad a la vez.
   */
  async crear(usuarioId, { items, metodo_pago, tipo_entrega, direccion, ciudad, telefono, notas }, { costoEnvio, envioGratisDesde }) {
    const id = await withTransaction(async (conn) => {
      const ids = items.map((i) => i.producto_id);
      const [productos] = await conn.execute(
        `SELECT id, nombre, precio, stock, activo FROM productos WHERE id IN (${ids.map(() => '?').join(', ')}) FOR UPDATE`,
        ids,
      );
      const porId = new Map(productos.map((p) => [p.id, p]));
      const problemas = {};
      for (const item of items) {
        const producto = porId.get(item.producto_id);
        if (!producto || !producto.activo) problemas[item.producto_id] = 'El producto ya no está disponible';
        else if (producto.stock < item.cantidad) problemas[item.producto_id] = `Solo quedan ${producto.stock} unidad(es) de "${producto.nombre}"`;
      }
      if (Object.keys(problemas).length) {
        throw new AppError('Algunos productos no tienen stock suficiente. Revisa tu carrito.', 409, 'STOCK_INSUFICIENTE', problemas);
      }

      const subtotal = items.reduce((suma, i) => suma + Number(porId.get(i.producto_id).precio) * i.cantidad, 0);
      const envio = tipo_entrega === 'Envío a domicilio' && subtotal < envioGratisDesde ? costoEnvio : 0;
      const [resultado] = await conn.execute(
        `INSERT INTO pedidos (usuario_id, metodo_pago, tipo_entrega, direccion, ciudad, telefono, notas, subtotal, costo_envio, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [usuarioId, metodo_pago, tipo_entrega, direccion, ciudad, telefono, notas, subtotal.toFixed(2), envio.toFixed(2), (subtotal + envio).toFixed(2)],
      );
      for (const item of items) {
        const producto = porId.get(item.producto_id);
        await conn.execute(
          'INSERT INTO pedido_items (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
          [resultado.insertId, producto.id, producto.nombre, item.cantidad, producto.precio],
        );
        await conn.execute('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, producto.id]);
      }
      return resultado.insertId;
    });
    return this.findById(id);
  },

  /** Cambia el estado. Al cancelar, el stock regresa al inventario. Un pedido cancelado no se reactiva. */
  async cambiarEstado(id, estado) {
    await withTransaction(async (conn) => {
      const [[pedido]] = await conn.execute('SELECT estado FROM pedidos WHERE id = ? FOR UPDATE', [id]);
      if (!pedido) throw new AppError(`No existe el pedido ${id}`, 404, 'NOT_FOUND');
      if (pedido.estado === 'Cancelado') throw new AppError('El pedido ya está cancelado y no se puede reactivar', 409, 'PEDIDO_CANCELADO');
      if (pedido.estado === 'Entregado' && estado === 'Cancelado') throw new AppError('Un pedido entregado no se puede cancelar', 409, 'PEDIDO_ENTREGADO');
      if (estado === 'Cancelado') await reponerStock(conn, id);
      await conn.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    });
    return this.findById(id);
  },
};
