// Límite de peticiones en memoria por clave (IP o usuario). Suficiente para un solo servidor.
import { AppError } from './AppError.js';

/**
 * @param {{ maximo: number, ventanaMs: number, mensaje: string }} opciones
 * @returns {(clave: string) => void}  Lanza 429 si se supera el límite
 */
export const crearLimitador = ({ maximo, ventanaMs, mensaje }) => {
  const registros = new Map();
  return (clave) => {
    const ahora = Date.now();
    const recientes = (registros.get(clave) ?? []).filter((marca) => ahora - marca < ventanaMs);
    if (recientes.length >= maximo) throw new AppError(mensaje, 429, 'RATE_LIMIT');
    recientes.push(ahora);
    registros.set(clave, recientes);
  };
};
