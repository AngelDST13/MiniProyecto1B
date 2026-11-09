// Punto central de rutas de la API y permisos por rol.
//   público          → auth (acceso), catálogo de la tienda
//   cualquier sesión → comprar, portal del cliente
//   personal         → admin + técnico: taller, administración, agente de IA
//   solo admin       → gestión (dashboard, pedidos, solicitudes, correos, configuración) y usuarios
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import tiendaRoutes from './tiendaRoutes.js';
import portalRoutes from './portalRoutes.js';
import gestionRoutes from './gestionRoutes.js';
import documentoRoutes from './documentoRoutes.js';
import clienteRoutes from './clienteRoutes.js';
import ordenRoutes from './ordenRoutes.js';
import componenteRoutes from './componenteRoutes.js';
import adminRoutes from './adminRoutes.js';
import agenteRoutes from './agenteRoutes.js';
import { crearRutasCrud } from './crudRoutes.js';
import { ENTIDADES } from '../models/admin/index.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRol, soloAdmin, soloPersonal } from '../middlewares/rolMiddleware.js';

const router = Router();

// Públicas
router.use('/auth', authRoutes);
router.use('/tienda', tiendaRoutes);

// Cualquier usuario con sesión (lo usan sobre todo los clientes)
router.use('/portal', authMiddleware, requireRol('admin', 'tecnico', 'cliente'), portalRoutes);
router.use('/documentos', authMiddleware, requireRol('admin', 'tecnico', 'cliente'), documentoRoutes);

// Personal del taller
router.use('/clientes', authMiddleware, soloPersonal, clienteRoutes);
router.use('/ordenes', authMiddleware, soloPersonal, ordenRoutes);
router.use('/componentes', authMiddleware, soloPersonal, componenteRoutes);
router.use('/agente', authMiddleware, soloPersonal, agenteRoutes);
router.use('/admin', authMiddleware, soloPersonal, adminRoutes);

// Solo administradores
router.use('/gestion', authMiddleware, soloAdmin, gestionRoutes);

// Módulo de Administración: CRUDs generados desde src/models/admin/*.js
// Cada entidad puede restringir sus roles (por ejemplo, Usuarios es solo para admin).
for (const entidad of ENTIDADES) {
  const roles = entidad.roles ?? ['admin', 'tecnico'];
  router.use(`/${entidad.clave}`, authMiddleware, requireRol(...roles), crearRutasCrud(entidad));
}

export default router;
