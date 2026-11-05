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

const servidor = app.listen(env.port, () => {
  console.log(`API del Taller de Servicio Técnico escuchando en http://localhost:${env.port}`);
  console.log(`Frontend permitido (CORS): ${env.corsOrigins.join(', ')}`);
});

// Mensaje claro si el puerto ya está ocupado (por ejemplo, el backend ya está abierto en otra terminal).
servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nEl puerto ${env.port} ya está en uso: probablemente el backend YA está encendido en otra terminal.`);
    console.error(`Compruébalo abriendo http://localhost:${env.port}/health — o cambia PORT en el archivo .env.\n`);
  } else {
    console.error('Error al iniciar el servidor:', error.message);
  }
  process.exit(1);
});
