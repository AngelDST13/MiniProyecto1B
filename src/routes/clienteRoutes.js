// Rutas de Cliente. Se montan en /api/clientes (protegidas por token en routes/index.js).
import { Router } from 'express';
import {
  createCliente,
  deleteCliente,
  getClienteById,
  getClientes,
  updateCliente,
} from '../controllers/clienteController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getClientes));          // GET    /api/clientes
router.get('/:id', asyncHandler(getClienteById));    // GET    /api/clientes/:id
router.post('/', asyncHandler(createCliente));       // POST   /api/clientes
router.put('/:id', asyncHandler(updateCliente));     // PUT    /api/clientes/:id
router.delete('/:id', asyncHandler(deleteCliente));  // DELETE /api/clientes/:id

export default router;
