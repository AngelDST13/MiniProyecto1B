// Gestión exclusiva de administradores (protegida con soloAdmin en routes/index.js).
import { Router } from 'express';
import {
  aprobarSolicitud, cambiarEstadoPedido, enviarInformeAhora, getConfiguracion, getCorreo, getCorreos, getDashboard,
  getPedido, getPedidos, getSolicitudes, probarCorreo, putConfiguracion, rechazarSolicitud, vistaPreviaInforme,
  vistaPreviaSolicitud,
} from '../controllers/gestionController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/dashboard', asyncHandler(getDashboard));

router.get('/pedidos', asyncHandler(getPedidos));
router.get('/pedidos/:id', asyncHandler(getPedido));
router.patch('/pedidos/:id/estado', asyncHandler(cambiarEstadoPedido));

router.get('/solicitudes', asyncHandler(getSolicitudes));
router.get('/solicitudes/:id/vista-previa', asyncHandler(vistaPreviaSolicitud));
router.patch('/solicitudes/:id/aprobar', asyncHandler(aprobarSolicitud));
router.patch('/solicitudes/:id/rechazar', asyncHandler(rechazarSolicitud));

router.get('/correos', asyncHandler(getCorreos));
router.post('/correos/probar', asyncHandler(probarCorreo));
router.get('/correos/:id', asyncHandler(getCorreo));

router.get('/configuracion', asyncHandler(getConfiguracion));
router.put('/configuracion', asyncHandler(putConfiguracion));

router.get('/informe-diario/vista-previa', asyncHandler(vistaPreviaInforme));
router.post('/informe-diario/enviar', asyncHandler(enviarInformeAhora));

export default router;
