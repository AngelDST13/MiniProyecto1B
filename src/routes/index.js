// Punto central de rutas de la API.
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import clienteRoutes from './clienteRoutes.js';
import ordenRoutes from './ordenRoutes.js';
import componenteRoutes from './componenteRoutes.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Públicas
router.use('/auth', authRoutes);

// Protegidas: todo lo que se registra debajo exige un token válido (401 si no lo tiene)
router.use('/clientes', authMiddleware, clienteRoutes);
router.use('/ordenes', authMiddleware, ordenRoutes);
router.use('/componentes', authMiddleware, componenteRoutes);

export default router;
