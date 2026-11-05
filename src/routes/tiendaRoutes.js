// Tienda: el catálogo es público; comprar requiere sesión.
import { Router } from 'express';
import { crearPedido, getCatalogo, getProducto, getProductos } from '../controllers/tiendaController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/catalogo', asyncHandler(getCatalogo));                      // GET  /api/tienda/catalogo
router.get('/productos', asyncHandler(getProductos));                    // GET  /api/tienda/productos
router.get('/productos/:slug', asyncHandler(getProducto));               // GET  /api/tienda/productos/:slug
router.post('/pedidos', authMiddleware, asyncHandler(crearPedido));      // POST /api/tienda/pedidos

export default router;
