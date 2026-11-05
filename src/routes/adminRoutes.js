// Rutas de apoyo del panel de Administración (protegidas en routes/index.js).
import { Router } from 'express';
import { getEntidades, getOpciones } from '../controllers/adminController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/entidades', asyncHandler(getEntidades));      // GET /api/admin/entidades
router.get('/opciones/:ref', asyncHandler(getOpciones));   // GET /api/admin/opciones/:ref

export default router;
