// Comprueba los códigos de estado de la API. Uso: npm run test:estados (requiere MySQL encendido).
// Levanta la app en un puerto libre, así no depende de que el backend ya esté corriendo.
import http from 'node:http';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { limiteTiempo } from '../src/middlewares/estadosHttp.js';
import { mapearErrorIA } from '../src/services/agente/iaService.js';
import { firmarToken } from '../src/utils/jwt.js';
import { AppError } from '../src/utils/AppError.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';

let fallos = 0;
const comprobar = (nombre, esperado, recibido, extra = true) => {
  const correcto = esperado === recibido && extra;
  if (!correcto) fallos += 1;
  console.log(`${correcto ? 'OK   ' : 'FALLA'} ${String(esperado)} ${nombre}${correcto ? '' : ` (recibido: ${recibido})`}`);
};

const escuchar = (aplicacion) => new Promise((resolve) => {
  const servidor = aplicacion.listen(0, () => resolve({ servidor, base: `http://127.0.0.1:${servidor.address().port}` }));
});

const { servidor, base } = await escuchar(app);

const pedir = (ruta, { method = 'GET', token, body, headers = {} } = {}) => fetch(base + ruta, {
  method,
  redirect: 'manual',
  headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
  body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
});

// Sin fetch: no permite ciertos métodos y agrega Cache-Control: no-cache a los GET condicionales.
const pedirCrudo = (ruta, method, headers = {}) => new Promise((resolve, reject) => {
  const { hostname, port } = new URL(base);
  http.request({ hostname, port, path: ruta, method, headers }, (r) => { r.resume(); resolve(r.statusCode); }).on('error', reject).end();
});

// Usuarios temporales: con el token basta para probar permisos, sin pasar por el inicio de sesión.
const [creado] = await pool.execute(
  "INSERT INTO usuarios (nombre, correo, rol, correo_verificado) VALUES ('Prueba HTTP', ?, 'cliente', 1)",
  [`prueba.http.${Date.now()}@correo.com`],
);
const tokenCliente = firmarToken({ id: creado.insertId });
const [[admin]] = await pool.query("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
const tokenAdmin = firmarToken({ id: admin.id });

try {
  let r;
  console.log('--- 2xx');
  comprobar('GET /health', 200, (await pedir('/health')).status);

  console.log('--- 3xx');
  r = await pedir('/');
  comprobar('GET / redirige a /health', 302, r.status, r.headers.get('location') === '/health');
  r = await pedir('/api/tienda/producto/mi-producto?x=1');
  comprobar('ruta antigua de producto', 301, r.status, r.headers.get('location') === '/api/tienda/productos/mi-producto?x=1');
  r = await pedir('/api/tienda/categorias');
  comprobar('ruta antigua de categorías', 301, r.status, r.headers.get('location') === '/api/tienda/catalogo');
  r = await pedir('/api/auth/iniciar-sesion', { method: 'POST', body: {} });
  comprobar('alias de login conserva el POST', 308, r.status, r.headers.get('location') === '/api/auth/login');
  r = await pedir('/api/tienda/catalogo');
  const etag = r.headers.get('etag');
  await r.arrayBuffer();
  comprobar('catálogo con ETag', 200, r.status, Boolean(etag));
  comprobar('catálogo sin cambios', 304, await pedirCrudo('/api/tienda/catalogo', 'GET', { 'If-None-Match': etag }));

  console.log('--- 4xx');
  comprobar('datos inválidos', 400, (await pedir('/api/clientes', { method: 'POST', token: tokenAdmin, body: {} })).status);
  comprobar('JSON mal formado', 400, (await pedir('/api/auth/login', { method: 'POST', body: '{mal' })).status);
  comprobar('URL mal codificada', 400, (await pedir('/api/tienda/productos/%E0%A4%A')).status);
  r = await pedir('/api/clientes');
  comprobar('sin token', 401, r.status, r.headers.get('www-authenticate') === 'Bearer');
  comprobar('rol sin permiso', 403, (await pedir('/api/gestion/dashboard', { token: tokenCliente })).status);
  comprobar('registro inexistente', 404, (await pedir('/api/clientes/999999999', { token: tokenAdmin })).status);
  comprobar('ruta inexistente', 404, (await pedir('/api/no-existe')).status);
  r = await pedir('/api/tienda/catalogo', { method: 'DELETE' });
  comprobar('método equivocado', 405, r.status, r.headers.get('allow') === 'GET, HEAD');
  r = await pedir('/api/clientes/1', { method: 'POST', token: tokenAdmin });
  comprobar('método equivocado con id', 405, r.status, r.headers.get('allow')?.includes('PUT'));
  comprobar('conflicto de estado', 409, (await pedir('/api/gestion/facturas/999999999/anular', { method: 'PATCH', token: tokenAdmin })).status);
  comprobar('body demasiado grande', 413, (await pedir('/api/auth/login', { method: 'POST', body: JSON.stringify({ relleno: 'x'.repeat(150_000) }) })).status);
  comprobar('POST sin cuerpo no es 415', 401, (await pedir('/api/auth/renovar', { method: 'POST' })).status);
  comprobar('body que no es JSON', 415, (await pedir('/api/auth/login', { method: 'POST', body: 'correo=a', headers: { 'Content-Type': 'text/plain' } })).status);

  console.log('--- 5xx');
  comprobar('método no implementado', 501, await pedirCrudo('/health', 'PROPFIND'));

  // Fallos que no se pueden provocar sin romper algo: se simulan en una app mínima con los mismos middlewares.
  const simulada = express();
  const fallar = (ruta, error) => simulada.get(ruta, (req, res, next) => next(error));
  fallar('/500', new Error('fallo inesperado'));
  fallar('/502', new AppError('externo', 502, 'IA_ERROR'));
  fallar('/503', Object.assign(new Error('sin base'), { code: 'ECONNREFUSED' }));
  fallar('/429', new AppError('espera', 429, 'RATE_LIMIT'));
  simulada.get('/504', limiteTiempo(50), asyncHandler(async (req, res) => {
    await new Promise((resolve) => { setTimeout(resolve, 150); });
    res.json({ tarde: true }); // llega después del 504: no debe tumbar el servidor
  }));
  simulada.use(errorHandler);
  const prueba = await escuchar(simulada);
  const simular = (ruta) => fetch(prueba.base + ruta);

  const silenciar = console.error;
  console.error = () => {};
  comprobar('error inesperado', 500, (await simular('/500')).status);
  comprobar('servicio externo falló', 502, (await simular('/502')).status);
  r = await simular('/503');
  comprobar('base de datos caída', 503, r.status, r.headers.get('retry-after') === '30');
  r = await simular('/429');
  comprobar('demasiadas peticiones', 429, r.status, r.headers.get('retry-after') === '60');
  comprobar('petición demasiado lenta', 504, (await simular('/504')).status);
  await new Promise((resolve) => { setTimeout(resolve, 200); });
  console.error = silenciar;
  prueba.servidor.close();

  comprobar('IA sin respuesta a tiempo', 504, mapearErrorIA(new Anthropic.APIConnectionTimeoutError()).statusCode);
} finally {
  await pool.execute('DELETE FROM usuarios WHERE id = ?', [creado.insertId]);
  servidor.closeAllConnections();
  servidor.close();
  await pool.end();
}

console.log(fallos ? `\n${fallos} comprobaciones fallaron` : '\nTodas las comprobaciones pasaron');
process.exit(fallos ? 1 : 0);
