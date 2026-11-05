// Pool de conexiones a MySQL (mysql2 con promesas).
// Un pool reutiliza conexiones en vez de abrir una nueva por cada petición.
import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,     // Fechas como texto "YYYY-MM-DD HH:mm:ss" (evita líos de zona horaria)
  decimalNumbers: true,  // DECIMAL llega como número (45.5) y no como texto ("45.50")
});

// Verifica la conexión al arrancar; si falla, el servidor no inicia.
export const testConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

// Ejecuta varias consultas como una sola unidad: o se guardan todas o ninguna.
export const withTransaction = async (trabajo) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const resultado = await trabajo(connection);
    await connection.commit();
    return resultado;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
