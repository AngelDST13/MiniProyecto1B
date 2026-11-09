// Documentos imprimibles (cualquier sesión; el controlador comprueba que el documento sea del usuario).
import { Router } from 'express';
import { getFacturaDocumento, getInformeOrden } from '../controllers/documentoController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/factura/:id', asyncHandler(getFacturaDocumento));   // GET /api/documentos/factura/:id
router.get('/orden/:id', asyncHandler(getInformeOrden));         // GET /api/documentos/orden/:id

export default router;
