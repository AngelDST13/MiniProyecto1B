// Códigos y tokens de un solo uso (confirmar correo, recuperar contraseña, verificación en dos pasos).
// En la base se guarda solo su hash SHA-256: si alguien lee la tabla, no puede usarlos.
import crypto from 'node:crypto';

// Token largo para enlaces (43 caracteres, seguro para URLs)
export const generarTokenEnlace = () => crypto.randomBytes(32).toString('base64url');

// Código numérico de 6 dígitos (para escribirlo a mano)
export const generarCodigo = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

export const hashToken = (valor) => crypto.createHash('sha256').update(String(valor)).digest('hex');

// Comparación en tiempo constante (evita ataques de temporización)
export const hashesIguales = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
