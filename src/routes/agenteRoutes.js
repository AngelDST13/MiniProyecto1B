// Rutas del agente de IA (protegidas con token en routes/index.js).
import { Router } from 'express';
import { getEstado, postChat } from '../controllers/agenteController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/estado', getEstado);                // GET  /api/agente/estado
router.post('/chat', asyncHandler(postChat));    // POST /api/agente/chat

export default router;
