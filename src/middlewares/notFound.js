// Última parada de una petición que ninguna ruta atendió:
//   405 si la ruta existe pero con otro método (con el encabezado Allow)
//   404 si la ruta no existe
import { AppError } from '../utils/AppError.js';

// Recorre los routers de Express y junta los métodos declarados para esa URL.
const metodosDeLaRuta = (pila, ruta, metodos = new Set()) => {
  for (const capa of pila) {
    if (!capa.match(ruta)) continue;
    if (capa.route) {
      Object.keys(capa.route.methods).forEach((metodo) => metodos.add(metodo.toUpperCase()));
    } else if (capa.handle?.stack) {
      metodosDeLaRuta(capa.handle.stack, ruta.slice(capa.path.length) || '/', metodos);
    }
  }
  return metodos;
};

export const notFound = (req, res, next) => {
  const metodos = metodosDeLaRuta(req.app._router.stack, req.path);
  if (metodos.size > 0) {
    if (metodos.has('GET')) metodos.add('HEAD');
    const permitidos = [...metodos].sort().join(', ');
    res.set('Allow', permitidos);
    return next(new AppError(`El método ${req.method} no está permitido en ${req.originalUrl}. Usa: ${permitidos}`, 405, 'METHOD_NOT_ALLOWED'));
  }
  return next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};
