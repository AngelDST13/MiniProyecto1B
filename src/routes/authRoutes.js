// Rutas de autenticación. register y login son públicas; me requiere token.
import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(register));        // POST /api/auth/register
router.post('/login', asyncHandler(login));              // POST /api/auth/login
router.get('/me', authMiddleware, asyncHandler(me));     // GET  /api/auth/me

export default router;
