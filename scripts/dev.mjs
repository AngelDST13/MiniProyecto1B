// Levanta backend y frontend con un solo comando:  npm run dev:all
// Muestra la salida de ambos con un prefijo de color y los detiene juntos con Ctrl+C.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontend = path.join(raiz, 'frontend');

const procesos = [
  { nombre: 'API  ', color: '\x1b[36m', comando: 'node --watch src/server.js', cwd: raiz },
  { nombre: 'WEB  ', color: '\x1b[35m', comando: 'npx vite', cwd: frontend },
];

if (!existsSync(path.join(raiz, '.env'))) {
  console.error('Falta el archivo .env en la raíz. Copia .env.example como .env y completa tus datos.');
  process.exit(1);
}
if (!existsSync(path.join(frontend, 'node_modules'))) {
  console.error('Faltan las dependencias del frontend. Ejecuta:  cd frontend && npm install');
  process.exit(1);
}

const hijos = procesos.map(({ nombre, color, comando, cwd }) => {
  const hijo = spawn(comando, { cwd, shell: true, env: { ...process.env, FORCE_COLOR: '1' } });
  const imprimir = (datos) =>
    String(datos)
      .split(/\r?\n/)
      .filter((linea) => linea.trim())
      .forEach((linea) => console.log(`${color}[${nombre}]\x1b[0m ${linea}`));
  hijo.stdout.on('data', imprimir);
  hijo.stderr.on('data', imprimir);
  hijo.on('exit', (codigo) => console.log(`${color}[${nombre}]\x1b[0m terminó (código ${codigo})`));
  return hijo;
});

console.log('\n  Bancada → abre http://localhost:5173  ·  cuenta demo: demo@bancada.com / Demo12345\n');

const detener = () => {
  hijos.forEach((hijo) => hijo.kill());
  process.exit(0);
};
process.on('SIGINT', detener);
process.on('SIGTERM', detener);
