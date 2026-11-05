// Punto de entrada: verifica la base de datos y luego arranca el servidor HTTP.
import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';

try {
  await testConnection();
  console.log(`Conectado a MySQL: ${env.db.database}@${env.db.host}:${env.db.port}`);
} catch (error) {
  console.error('No se pudo conectar a MySQL:', error.message);
  console.error('Revisa que el servicio de MySQL esté encendido y los datos DB_* del archivo .env');
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`API del Taller de Servicio Técnico escuchando en http://localhost:${env.port}`);
});
