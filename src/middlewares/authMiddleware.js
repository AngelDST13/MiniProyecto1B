// Protege las rutas: exige el encabezado  Authorization: Bearer <token>
// Si falta, está mal formado, fue alterado o venció → 401 { "error": "No autorizado" }
import { verificarToken } from '../utils/jwt.js';

const noAutorizado = (res) => res.status(401).json({ error: 'No autorizado' });

export const authMiddleware = (req, res, next) => {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');

  if (tipo !== 'Bearer' || !token) return noAutorizado(res);

  try {
    const payload = verificarToken(token);
    req.usuarioId = Number(payload.sub); // disponible para los controladores
    return next();
  } catch {
    return noAutorizado(res);
  }
};
