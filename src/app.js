// Configuración principal de Express: middlewares globales, rutas y manejo de errores.
// No arranca el servidor (eso lo hace server.js), así la app se puede reutilizar en pruebas.
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// ---------- Middlewares globales ----------
app.use(cors({ origin: env.corsOrigin }));   // Solo el frontend (Vite) puede consumir la API
app.use(express.json({ limit: '100kb' }));    // Convierte el body JSON en req.body

// ---------- Rutas ----------
// Healthcheck: útil para verificar rápidamente que la API está viva
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRoutes);

// ---------- Manejo de errores (siempre al final) ----------
app.use(notFound);
app.use(errorHandler);

export default app;
