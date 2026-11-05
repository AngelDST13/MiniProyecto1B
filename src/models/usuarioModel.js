// Capa de acceso a datos de Usuario.
// Las consultas públicas NUNCA devuelven password_hash; solo findByCorreoConPassword lo hace (para el login).
import { pool } from '../config/db.js';

const COLUMNAS_PUBLICAS = 'id, nombre, correo, fecha_creacion';

export const UsuarioModel = {
  async findById(id) {
    const [rows] = await pool.execute(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = ?`, [id]);
    return rows[0] ?? null;
  },

  async existeCorreo(correo) {
    const [rows] = await pool.execute('SELECT id FROM usuarios WHERE correo = ? LIMIT 1', [correo]);
    return rows.length > 0;
  },

  // Solo para el login: incluye el hash para compararlo con bcrypt.
  async findByCorreoConPassword(correo) {
    const [rows] = await pool.execute(
      `SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM usuarios WHERE correo = ?`,
      [correo],
    );
    return rows[0] ?? null;
  },

  async create({ nombre, correo, passwordHash }) {
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, correo, password_hash) VALUES (?, ?, ?)',
      [nombre, correo, passwordHash],
    );
    return this.findById(result.insertId);
  },
};
