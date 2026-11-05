// Capa de acceso a datos de ComponenteRepuesto (inventario).
import { pool } from '../config/db.js';

// Incluye en cuántas órdenes se ha usado cada repuesto.
const SELECT_COMPONENTE = `
  SELECT cr.id, cr.nombre, cr.categoria, cr.precio_unitario, cr.stock, cr.created_at, cr.updated_at,
         (SELECT COUNT(*) FROM orden_componentes oc WHERE oc.componente_id = cr.id) AS veces_usado
  FROM componentes_repuesto cr`;

export const ComponenteModel = {
  async findAll({ categoria } = {}) {
    if (categoria) {
      const [rows] = await pool.execute(`${SELECT_COMPONENTE} WHERE cr.categoria = ? ORDER BY cr.nombre`, [categoria]);
      return rows;
    }
    const [rows] = await pool.execute(`${SELECT_COMPONENTE} ORDER BY cr.categoria, cr.nombre`);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(`${SELECT_COMPONENTE} WHERE cr.id = ?`, [id]);
    return rows[0] ?? null;
  },

  async create({ nombre, categoria, precio_unitario, stock }) {
    const [result] = await pool.execute(
      'INSERT INTO componentes_repuesto (nombre, categoria, precio_unitario, stock) VALUES (?, ?, ?, ?)',
      [nombre, categoria, precio_unitario, stock],
    );
    return this.findById(result.insertId);
  },

  async update(id, { nombre, categoria, precio_unitario, stock }) {
    await pool.execute(
      'UPDATE componentes_repuesto SET nombre = ?, categoria = ?, precio_unitario = ?, stock = ? WHERE id = ?',
      [nombre, categoria, precio_unitario, stock, id],
    );
    return this.findById(id);
  },

  async remove(id) {
    const [result] = await pool.execute('DELETE FROM componentes_repuesto WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};
