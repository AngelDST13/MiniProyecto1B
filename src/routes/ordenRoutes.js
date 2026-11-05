// Rutas de OrdenServicio. Se montan en /api/ordenes.
import { Router } from 'express';
import {
  addComponenteAOrden,
  createOrden,
  deleteOrden,
  getOrdenById,
  getOrdenes,
  removeComponenteDeOrden,
  updateEstadoOrden,
  updateOrden,
} from '../controllers/ordenController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// CRUD principal
router.get('/', asyncHandler(getOrdenes));           // GET    /api/ordenes
router.get('/:id', asyncHandler(getOrdenById));      // GET    /api/ordenes/:id
router.post('/', asyncHandler(createOrden));         // POST   /api/ordenes
router.put('/:id', asyncHandler(updateOrden));       // PUT    /api/ordenes/:id
router.delete('/:id', asyncHandler(deleteOrden));    // DELETE /api/ordenes/:id

// Cambio rápido de estado (tablero)
router.patch('/:id/estado', asyncHandler(updateEstadoOrden));  // PATCH /api/ordenes/:id/estado

// Repuestos usados en la orden (relación muchos a muchos)
router.post('/:id/componentes', asyncHandler(addComponenteAOrden));                     // POST
router.delete('/:id/componentes/:componenteId', asyncHandler(removeComponenteDeOrden)); // DELETE

export default router;
