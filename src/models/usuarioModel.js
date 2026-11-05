// Capa de acceso a datos de Usuario.
// Las consultas públicas NUNCA devuelven password_hash; solo findByCorreoConPassword lo hace (para el login).
import { pool } from '../config/db.js';

const COLUMNAS_PUBLICAS = `id, nombre, correo, rol, cedula, telefono, cliente_id, correo_verificado, dos_pasos,
  (google_id IS NOT NULL) AS con_google, fecha_creacion, ultimo_acceso`;

// MySQL devuelve 0/1: se convierten a booleanos para la API.
const mapear = (fila) =>
  fila && {
    ...fila,
    correo_verificado: Boolean(fila.correo_verificado),
    dos_pasos: Boolean(fila.dos_pasos),
    con_google: Boolean(fila.con_google),
    perfil_completo: Boolean(fila.cedula) || fila.rol !== 'cliente',
  };

export const UsuarioModel = {
  async findById(id) {
    const [rows] = await pool.execute(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = ?`, [id]);
    return mapear(rows[0]) ?? null;
  },

  async findByCorreo(correo) {
    const [rows] = await pool.execute(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE correo = ?`, [correo]);
    return mapear(rows[0]) ?? null;
  },

  async findByGoogleId(googleId) {
    const [rows] = await pool.execute(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE google_id = ?`, [googleId]);
    return mapear(rows[0]) ?? null;
  },

  async existeCorreo(correo) {
    const [rows] = await pool.execute('SELECT id FROM usuarios WHERE correo = ? LIMIT 1', [correo]);
    return rows.length > 0;
  },

  async existeCedula(cedula, excluirId = 0) {
    const [rows] = await pool.execute('SELECT id FROM usuarios WHERE cedula = ? AND id <> ? LIMIT 1', [cedula, excluirId]);
    return rows.length > 0;
  },

  // Solo para el login: incluye el hash y el estado de bloqueo.
  async findByCorreoConPassword(correo) {
    const [rows] = await pool.execute(
      `SELECT ${COLUMNAS_PUBLICAS}, password_hash, intentos_fallidos, bloqueado_hasta,
              (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()) AS bloqueado,
              CEIL(TIMESTAMPDIFF(SECOND, NOW(), bloqueado_hasta) / 60) AS minutos_bloqueo
       FROM usuarios WHERE correo = ?`,
      [correo],
    );
    return rows[0] ? { ...mapear(rows[0]), bloqueado: Boolean(rows[0].bloqueado) } : null;
  },

  async create({ nombre, correo, passwordHash = null, rol = 'cliente', cedula = null, telefono = null, clienteId = null, correoVerificado = false, googleId = null }) {
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol, cedula, telefono, cliente_id, correo_verificado, google_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, correo, passwordHash, rol, cedula, telefono, clienteId, correoVerificado ? 1 : 0, googleId],
    );
    return this.findById(result.insertId);
  },

  async actualizar(id, campos) {
    const columnas = Object.keys(campos);
    if (!columnas.length) return this.findById(id);
    await pool.execute(`UPDATE usuarios SET ${columnas.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [...Object.values(campos), id]);
    return this.findById(id);
  },

  // Suma un intento fallido; al llegar al máximo bloquea la cuenta y reinicia el contador.
  async registrarFallo(id, { maxIntentos, minutosBloqueo }) {
    await pool.execute(
      `UPDATE usuarios
       SET intentos_fallidos = intentos_fallidos + 1,
           bloqueado_hasta = IF(intentos_fallidos >= ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), bloqueado_hasta),
           intentos_fallidos = IF(bloqueado_hasta > NOW(), 0, intentos_fallidos)
       WHERE id = ?`,
      [maxIntentos, minutosBloqueo, id],
    );
    const [rows] = await pool.execute('SELECT intentos_fallidos, (bloqueado_hasta > NOW()) AS bloqueado FROM usuarios WHERE id = ?', [id]);
    return { intentos: rows[0].intentos_fallidos, bloqueado: Boolean(rows[0].bloqueado) };
  },

  async registrarAccesoExitoso(id) {
    await pool.execute('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW() WHERE id = ?', [id]);
  },

  async admins() {
    const [rows] = await pool.execute("SELECT nombre, correo FROM usuarios WHERE rol = 'admin' AND correo_verificado = 1");
    return rows;
  },
};
