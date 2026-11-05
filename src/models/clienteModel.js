// Capa de acceso a datos de Cliente (MySQL).
// Siempre se usan consultas parametrizadas (?) para evitar inyección SQL.
import { pool } from '../config/db.js';

// Incluye cuántas órdenes tiene cada cliente (útil en la tabla del frontend).
const SELECT_CLIENTE = `
  SELECT c.id, c.nombre, c.telefono, c.email, c.cedula, c.created_at, c.updated_at,
         (SELECT COUNT(*) FROM ordenes_servicio o WHERE o.cliente_id = c.id) AS total_ordenes
  FROM clientes c`;

export const ClienteModel = {
  async findAll() {
    const [rows] = await pool.execute(`${SELECT_CLIENTE} ORDER BY c.id DESC`);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(`${SELECT_CLIENTE} WHERE c.id = ?`, [id]);
    return rows[0] ?? null;
  },

  // Busca otro cliente con la misma cédula o email (excluyendo al propio en una actualización).
  async findDuplicado({ cedula, email }, excluirId = 0) {
    const [rows] = await pool.execute(
      'SELECT id, cedula, email FROM clientes WHERE (cedula = ? OR email = ?) AND id <> ? LIMIT 1',
      [cedula, email, excluirId],
    );
    return rows[0] ?? null;
  },

  async create({ nombre, telefono, email, cedula }) {
    const [result] = await pool.execute(
      'INSERT INTO clientes (nombre, telefono, email, cedula) VALUES (?, ?, ?, ?)',
      [nombre, telefono, email, cedula],
    );
    return this.findById(result.insertId);
  },

  async update(id, { nombre, telefono, email, cedula }) {
    await pool.execute(
      'UPDATE clientes SET nombre = ?, telefono = ?, email = ?, cedula = ? WHERE id = ?',
      [nombre, telefono, email, cedula, id],
    );
    return this.findById(id);
  },

  async remove(id) {
    const [result] = await pool.execute('DELETE FROM clientes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};
