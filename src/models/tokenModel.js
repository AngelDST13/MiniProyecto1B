// Códigos de un solo uso por usuario: confirmar correo, recuperar contraseña, verificación en dos pasos.
import { pool } from '../config/db.js';
import { generarCodigo, generarTokenEnlace, hashToken, hashesIguales } from '../utils/tokens.js';

const MAX_INTENTOS_CODIGO = 5;

export const TokenModel = {
  /**
   * Crea un código nuevo e invalida los anteriores del mismo tipo.
   * @returns {Promise<string>} el valor en claro (solo se usa para enviarlo por correo)
   */
  async crear(usuarioId, tipo, minutos) {
    const valor = tipo === 'dos_pasos' ? generarCodigo() : generarTokenEnlace();
    await pool.execute('UPDATE tokens_usuario SET usado_en = NOW() WHERE usuario_id = ? AND tipo = ? AND usado_en IS NULL', [usuarioId, tipo]);
    await pool.execute(
      'INSERT INTO tokens_usuario (usuario_id, tipo, token_hash, expira_en) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))',
      [usuarioId, tipo, hashToken(valor), minutos],
    );
    return valor;
  },

  // Token de enlace: lo busca por hash, verifica vigencia y lo marca como usado. Devuelve el usuario_id o null.
  async consumirEnlace(tipo, valor) {
    if (typeof valor !== 'string' || valor.length < 20) return null;
    const [rows] = await pool.execute(
      'SELECT id, usuario_id FROM tokens_usuario WHERE tipo = ? AND token_hash = ? AND usado_en IS NULL AND expira_en > NOW()',
      [tipo, hashToken(valor)],
    );
    if (!rows[0]) return null;
    await pool.execute('UPDATE tokens_usuario SET usado_en = NOW() WHERE id = ?', [rows[0].id]);
    return rows[0].usuario_id;
  },

  // Código de 6 dígitos de un usuario concreto, con límite de intentos.
  async verificarCodigo(usuarioId, codigo) {
    const [rows] = await pool.execute(
      `SELECT id, token_hash, intentos FROM tokens_usuario
       WHERE usuario_id = ? AND tipo = 'dos_pasos' AND usado_en IS NULL AND expira_en > NOW()
       ORDER BY id DESC LIMIT 1`,
      [usuarioId],
    );
    const token = rows[0];
    if (!token) return { ok: false, motivo: 'El código venció. Inicia sesión de nuevo para recibir otro.' };
    if (token.intentos >= MAX_INTENTOS_CODIGO) return { ok: false, motivo: 'Demasiados intentos. Inicia sesión de nuevo.' };

    if (!hashesIguales(hashToken(String(codigo ?? '').trim()), token.token_hash)) {
      await pool.execute('UPDATE tokens_usuario SET intentos = intentos + 1 WHERE id = ?', [token.id]);
      const restantes = MAX_INTENTOS_CODIGO - token.intentos - 1;
      return { ok: false, motivo: restantes > 0 ? `Código incorrecto. Te quedan ${restantes} intentos.` : 'Demasiados intentos. Inicia sesión de nuevo.' };
    }
    await pool.execute('UPDATE tokens_usuario SET usado_en = NOW() WHERE id = ?', [token.id]);
    return { ok: true };
  },
};
