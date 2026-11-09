// Protege las rutas: exige el encabezado  Authorization: Bearer <token>
// Si falta, está mal formado, fue alterado, venció (15 min sin actividad) o la sesión superó
// su duración máxima → 401 { "error": "No autorizado" }
import { sesionVigente, verificarToken } from '../utils/jwt.js';

const noAutorizado = (res) => res.set('WWW-Authenticate', 'Bearer').status(401).json({ error: 'No autorizado' });

export const authMiddleware = (req, res, next) => {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');

  if (tipo !== 'Bearer' || !token) return noAutorizado(res);

  try {
    const payload = verificarToken(token);
    if (!sesionVigente(payload)) return noAutorizado(res);
    req.usuarioId = Number(payload.sub); // disponible para los controladores
    req.sesion = payload;                // inicio y "recordarme", para renovar el token
    return next();
  } catch {
    return noAutorizado(res);
  }
};
