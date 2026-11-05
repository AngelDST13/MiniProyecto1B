// Autorización por rol. Se usa DESPUÉS de authMiddleware.
// El rol se lee de la base en cada petición: si un admin cambia el rol de alguien, aplica de inmediato.
import { pool } from '../config/db.js';

/**
 * @param {...('admin' | 'tecnico' | 'cliente')} roles  Roles que pueden acceder
 */
export const requireRol = (...roles) => async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre, correo, rol, cliente_id FROM usuarios WHERE id = ?', [req.usuarioId]);
    const usuario = rows[0];
    if (!usuario) return res.status(401).json({ error: 'No autorizado' });
    if (!roles.includes(usuario.rol)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción' } });
    }
    req.usuario = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const soloPersonal = requireRol('admin', 'tecnico');
export const soloAdmin = requireRol('admin');
