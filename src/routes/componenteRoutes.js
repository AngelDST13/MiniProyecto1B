// Rutas de ComponenteRepuesto. Se montan en /api/componentes.
import { Router } from 'express';
import {
  createComponente,
  deleteComponente,
  getComponenteById,
  getComponentes,
  updateComponente,
} from '../controllers/componenteController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getComponentes));          // GET    /api/componentes
router.get('/:id', asyncHandler(getComponenteById));    // GET    /api/componentes/:id
router.post('/', asyncHandler(createComponente));       // POST   /api/componentes
router.put('/:id', asyncHandler(updateComponente));     // PUT    /api/componentes/:id
router.delete('/:id', asyncHandler(deleteComponente));  // DELETE /api/componentes/:id

export default router;
