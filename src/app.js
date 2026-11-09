// Configuración principal de Express: middlewares globales, rutas y manejo de errores.
// No arranca el servidor (eso lo hace server.js), así la app se puede reutilizar en pruebas.
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import apiRoutes from './routes/index.js';
import redireccionesRoutes from './routes/redireccionesRoutes.js';
import { limiteTiempo, metodoImplementado, revalidarSiempre, soloJson } from './middlewares/estadosHttp.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// ---------- Middlewares globales ----------
app.use(cors({ origin: env.corsOrigins }));  // Solo el frontend (Vite) puede consumir la API
app.use(metodoImplementado);                  // 501 si el método HTTP no existe en esta API
app.use(limiteTiempo(env.solicitudTimeoutMs)); // 504 si una petición tarda demasiado
app.use('/api', soloJson);                    // 415 si el body no es JSON
app.use(express.json({ limit: '100kb' }));    // Convierte el body JSON en req.body

// ---------- Rutas ----------
app.get('/', (req, res) => res.redirect(302, '/health'));

// Healthcheck: 200 si la API y la base de datos responden, 503 si la base no está disponible
app.get('/health', async (req, res) => {
  const timestamp = new Date().toISOString();
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok', timestamp });
  } catch {
    res.set('Retry-After', '30').status(503).json({ status: 'degradado', db: 'sin conexión', timestamp });
  }
});

app.use('/api', redireccionesRoutes);
app.use('/api/tienda', revalidarSiempre);     // 304 cuando el catálogo no cambió
app.use('/api', apiRoutes);

// ---------- Manejo de errores (siempre al final) ----------
app.use(notFound);
app.use(errorHandler);

export default app;
