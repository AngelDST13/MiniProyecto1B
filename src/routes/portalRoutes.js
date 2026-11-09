// Portal del cliente (cualquier usuario autenticado ve solo lo suyo).
import { Router } from 'express';
import {
  cancelarMiPedido, crearSolicitud, getMisFacturas, getMiPedido, getMisOrdenes, getMisPedidos, getMisSolicitudes,
} from '../controllers/portalController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/pedidos', asyncHandler(getMisPedidos));                         // GET  /api/portal/pedidos
router.get('/pedidos/:id', asyncHandler(getMiPedido));                       // GET  /api/portal/pedidos/:id
router.post('/pedidos/:id/cancelar', asyncHandler(cancelarMiPedido));        // POST /api/portal/pedidos/:id/cancelar
router.get('/ordenes', asyncHandler(getMisOrdenes));                         // GET  /api/portal/ordenes
router.get('/solicitudes', asyncHandler(getMisSolicitudes));                 // GET  /api/portal/solicitudes
router.post('/solicitudes', asyncHandler(crearSolicitud));                   // POST /api/portal/solicitudes

router.get('/facturas', asyncHandler(getMisFacturas));                       // GET  /api/portal/facturas

export default router;
