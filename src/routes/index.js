// Punto central de rutas de la API.
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import clienteRoutes from './clienteRoutes.js';
import ordenRoutes from './ordenRoutes.js';
import componenteRoutes from './componenteRoutes.js';
import adminRoutes from './adminRoutes.js';
import agenteRoutes from './agenteRoutes.js';
import { crearRutasCrud } from './crudRoutes.js';
import { ENTIDADES } from '../models/admin/index.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Públicas
router.use('/auth', authRoutes);

// Protegidas: todo lo que se registra debajo exige un token válido (401 si no lo tiene)
// CRUDs con lógica propia (Día 1 y 2)
router.use('/clientes', authMiddleware, clienteRoutes);
router.use('/ordenes', authMiddleware, ordenRoutes);
router.use('/componentes', authMiddleware, componenteRoutes);

// Agente de IA (consultas de solo lectura)
router.use('/agente', authMiddleware, agenteRoutes);

// Módulo de Administración: 17 CRUDs generados desde src/models/admin/*.js
router.use('/admin', authMiddleware, adminRoutes);
for (const entidad of ENTIDADES) {
  router.use(`/${entidad.clave}`, authMiddleware, crearRutasCrud(entidad));
}

export default router;
