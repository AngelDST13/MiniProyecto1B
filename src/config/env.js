// Carga y valida las variables de entorno UNA sola vez al arrancar.
// Si una variable es inválida o falta, el servidor no inicia (falla rápido y con mensaje claro).
import 'dotenv/config';

const VARIABLES_OBLIGATORIAS = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

const faltantes = VARIABLES_OBLIGATORIAS.filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  throw new Error(`Faltan variables de entorno en .env: ${faltantes.join(', ')}`);
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres (usa una clave larga y aleatoria)');
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`La variable PORT no es válida: "${process.env.PORT}"`);
}

export const env = {
  port,
  // Lista de URLs del frontend que pueden llamar a la API (separadas por coma en .env)
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === 'production',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },
  // URL pública del frontend: se usa en los enlaces de los correos (confirmar correo, restablecer contraseña…)
  appUrl: (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, ''),
  zonaHoraria: process.env.ZONA_HORARIA || 'America/Guayaquil',
  // Correo (Gmail con contraseña de aplicación). Sin SMTP_USER/SMTP_PASS los correos se
  // "simulan": se guardan en el registro de correos para verlos en el panel, sin enviarse.
  correo: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 465),
    usuario: process.env.SMTP_USER ?? '',
    clave: (process.env.SMTP_PASS ?? '').replaceAll(' ', ''), // Google muestra la clave con espacios
    remitente: process.env.MAIL_FROM || (process.env.SMTP_USER ? `Bancada <${process.env.SMTP_USER}>` : 'Bancada <no-responder@bancada.local>'),
  },
  // Inicio de sesión con Google (opcional)
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  // Agente de IA (opcional): sin ANTHROPIC_API_KEY el resto del sistema funciona igual.
  agente: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    modelo: process.env.AGENTE_MODELO || 'claude-opus-5-5',
    esfuerzo: process.env.AGENTE_ESFUERZO || 'low',
  },
};
