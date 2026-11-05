// Capa de acceso a datos de OrdenServicio y de los repuestos usados en cada orden.
import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

// Cada orden incluye los datos de su cliente y el total gastado en repuestos.
const SELECT_ORDEN = `
  SELECT o.id, o.cliente_id, o.tipo_equipo, o.marca_modelo, o.serial, o.diagnostico,
         o.estado, o.fecha_ingreso, o.created_at, o.updated_at,
         c.nombre AS cliente_nombre, c.cedula AS cliente_cedula, c.telefono AS cliente_telefono,
         COALESCE((SELECT SUM(oc.cantidad * oc.precio_unitario)
                   FROM orden_componentes oc WHERE oc.orden_id = o.id), 0) AS total_repuestos
  FROM ordenes_servicio o
  JOIN clientes c ON c.id = o.cliente_id`;

// Convierte la fila plana de SQL en un objeto con el cliente anidado.
const mapOrden = ({ cliente_nombre, cliente_cedula, cliente_telefono, ...orden }) => ({
  ...orden,
  cliente: { id: orden.cliente_id, nombre: cliente_nombre, cedula: cliente_cedula, telefono: cliente_telefono },
});

const findComponentesDeOrden = async (ordenId) => {
  const [rows] = await pool.execute(
    `SELECT oc.componente_id, cr.nombre, cr.categoria, oc.cantidad, oc.precio_unitario,
            (oc.cantidad * oc.precio_unitario) AS subtotal
     FROM orden_componentes oc
     JOIN componentes_repuesto cr ON cr.id = oc.componente_id
     WHERE oc.orden_id = ?
     ORDER BY cr.nombre`,
    [ordenId],
  );
  return rows;
};

export const OrdenModel = {
  async findAll({ estado, clienteId } = {}) {
    const condiciones = [];
    const valores = [];
    if (estado) {
      condiciones.push('o.estado = ?');
      valores.push(estado);
    }
    if (clienteId) {
      condiciones.push('o.cliente_id = ?');
      valores.push(clienteId);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await pool.execute(`${SELECT_ORDEN} ${where} ORDER BY o.fecha_ingreso DESC, o.id DESC`, valores);
    return rows.map(mapOrden);
  },

  // Devuelve la orden con el detalle de repuestos usados.
  async findById(id) {
    const [rows] = await pool.execute(`${SELECT_ORDEN} WHERE o.id = ?`, [id]);
    if (!rows[0]) return null;
    return { ...mapOrden(rows[0]), componentes: await findComponentesDeOrden(id) };
  },

  async countByCliente(clienteId) {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM ordenes_servicio WHERE cliente_id = ?', [clienteId]);
    return rows[0].total;
  },

  async countByComponente(componenteId) {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM orden_componentes WHERE componente_id = ?', [componenteId]);
    return rows[0].total;
  },

  async create({ cliente_id, tipo_equipo, marca_modelo, serial, diagnostico, estado, fecha_ingreso }) {
    const [result] = await pool.execute(
      `INSERT INTO ordenes_servicio (cliente_id, tipo_equipo, marca_modelo, serial, diagnostico, estado, fecha_ingreso)
       VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, NOW()))`,
      [cliente_id, tipo_equipo, marca_modelo, serial, diagnostico, estado ?? 'Recibido', fecha_ingreso],
    );
    return this.findById(result.insertId);
  },

  // Si estado o fecha_ingreso llegan en null, se conservan los valores actuales.
  async update(id, { cliente_id, tipo_equipo, marca_modelo, serial, diagnostico, estado, fecha_ingreso }) {
    await pool.execute(
      `UPDATE ordenes_servicio
       SET cliente_id = ?, tipo_equipo = ?, marca_modelo = ?, serial = ?, diagnostico = ?,
           estado = COALESCE(?, estado), fecha_ingreso = COALESCE(?, fecha_ingreso)
       WHERE id = ?`,
      [cliente_id, tipo_equipo, marca_modelo, serial, diagnostico, estado, fecha_ingreso, id],
    );
    return this.findById(id);
  },

  async updateEstado(id, estado) {
    await pool.execute('UPDATE ordenes_servicio SET estado = ? WHERE id = ?', [estado, id]);
    return this.findById(id);
  },

  // Al eliminar la orden, los repuestos que tenía asignados regresan al inventario.
  async remove(id) {
    return withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE componentes_repuesto cr
         JOIN orden_componentes oc ON oc.componente_id = cr.id
         SET cr.stock = cr.stock + oc.cantidad
         WHERE oc.orden_id = ?`,
        [id],
      );
      const [result] = await conn.execute('DELETE FROM ordenes_servicio WHERE id = ?', [id]);
      return result.affectedRows > 0;
    });
  },

  /**
   * Agrega un repuesto a la orden y descuenta el stock, todo en una transacción.
   * Si el repuesto ya estaba en la orden, suma la cantidad.
   */
  async addComponente(ordenId, { componente_id, cantidad }) {
    await withTransaction(async (conn) => {
      // FOR UPDATE bloquea la fila: dos técnicos no pueden tomar la última unidad a la vez.
      const [rows] = await conn.execute(
        'SELECT id, nombre, precio_unitario, stock FROM componentes_repuesto WHERE id = ? FOR UPDATE',
        [componente_id],
      );
      const componente = rows[0];
      if (!componente) {
        throw new AppError(`El repuesto con id ${componente_id} no existe`, 404, 'COMPONENTE_NOT_FOUND');
      }
      if (componente.stock < cantidad) {
        throw new AppError(
          `Stock insuficiente de "${componente.nombre}": quedan ${componente.stock} unidades`,
          409,
          'STOCK_INSUFICIENTE',
        );
      }

      await conn.execute(
        `INSERT INTO orden_componentes (orden_id, componente_id, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`,
        [ordenId, componente_id, cantidad, componente.precio_unitario],
      );
      await conn.execute('UPDATE componentes_repuesto SET stock = stock - ? WHERE id = ?', [cantidad, componente_id]);
    });
    return this.findById(ordenId);
  },

  // Quita un repuesto de la orden y devuelve sus unidades al inventario.
  async removeComponente(ordenId, componenteId) {
    const eliminado = await withTransaction(async (conn) => {
      const [rows] = await conn.execute(
        'SELECT cantidad FROM orden_componentes WHERE orden_id = ? AND componente_id = ? FOR UPDATE',
        [ordenId, componenteId],
      );
      if (!rows[0]) return false;

      await conn.execute('DELETE FROM orden_componentes WHERE orden_id = ? AND componente_id = ?', [ordenId, componenteId]);
      await conn.execute('UPDATE componentes_repuesto SET stock = stock + ? WHERE id = ?', [rows[0].cantidad, componenteId]);
      return true;
    });
    return eliminado ? this.findById(ordenId) : null;
  },
};
