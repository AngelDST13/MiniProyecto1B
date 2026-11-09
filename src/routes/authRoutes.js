// Rutas de autenticación. Las de acceso son públicas; las de la cuenta requieren token.
import { Router } from 'express';
import {
  actualizarPerfil, cambiarPassword, config, configurarDosPasos, login, loginGoogle, me, olvideContrasena, renovarSesion,
  reenviarVerificacion, register, restablecerContrasena, verificarCorreo, verificarDosPasos,
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Públicas
router.get('/config', config);                                                  // GET  /api/auth/config
router.post('/register', asyncHandler(register));                               // POST /api/auth/register
router.post('/login', asyncHandler(login));                                     // POST /api/auth/login
router.post('/dos-pasos', asyncHandler(verificarDosPasos));                     // POST /api/auth/dos-pasos
router.post('/google', asyncHandler(loginGoogle));                              // POST /api/auth/google
router.post('/verificar-correo', asyncHandler(verificarCorreo));                // POST /api/auth/verificar-correo
router.post('/reenviar-verificacion', asyncHandler(reenviarVerificacion));      // POST /api/auth/reenviar-verificacion
router.post('/olvide-contrasena', asyncHandler(olvideContrasena));              // POST /api/auth/olvide-contrasena
router.post('/restablecer-contrasena', asyncHandler(restablecerContrasena));    // POST /api/auth/restablecer-contrasena

// Cuenta del usuario autenticado
router.get('/me', authMiddleware, asyncHandler(me));                            // GET  /api/auth/me
router.post('/renovar', authMiddleware, asyncHandler(renovarSesion));           // POST /api/auth/renovar
router.put('/perfil', authMiddleware, asyncHandler(actualizarPerfil));          // PUT  /api/auth/perfil
router.put('/password', authMiddleware, asyncHandler(cambiarPassword));         // PUT  /api/auth/password
router.put('/dos-pasos', authMiddleware, asyncHandler(configurarDosPasos));     // PUT  /api/auth/dos-pasos

export default router;
