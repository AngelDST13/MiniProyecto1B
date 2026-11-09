// Rutas antiguas o alias que apuntan a la ruta vigente.
//   301 → cambio permanente de una lectura (GET)
//   308 → cambio permanente que conserva el método y el cuerpo (POST)
import { Router } from 'express';

const router = Router();

const consultaDe = (req) => {
  const inicio = req.originalUrl.indexOf('?');
  return inicio === -1 ? '' : req.originalUrl.slice(inicio);
};

router.get('/tienda/producto/:slug', (req, res) => {
  res.redirect(301, `/api/tienda/productos/${encodeURIComponent(req.params.slug)}${consultaDe(req)}`);
});
router.get('/tienda/categorias', (req, res) => res.redirect(301, '/api/tienda/catalogo'));

router.post('/auth/registro', (req, res) => res.redirect(308, '/api/auth/register'));
router.post('/auth/iniciar-sesion', (req, res) => res.redirect(308, '/api/auth/login'));

export default router;
