// Validador genérico: revisa el body según la definición de campos de la entidad.
// Devuelve { datos, errores } con SOLO los campos declarados (cualquier otro se ignora).
import { aNumero, estaVacio, limpiarTexto } from './helpers.js';

const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  telefono: /^\+?[0-9\s-]{7,15}$/,
  cedula: /^[0-9]{9,12}$/,
  url: /^https?:\/\/[^\s]+\.[^\s]+$/i,
  fecha: /^\d{4}-\d{2}-\d{2}$/,
  fechaHora: /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?$/,
};

const MENSAJES = {
  email: 'El email no tiene un formato válido',
  telefono: 'El teléfono debe tener entre 7 y 15 dígitos',
  cedula: 'Identificación no válida: física (9 dígitos), jurídica (10) o DIMEX (11-12)',
  url: 'La URL debe empezar con http:// o https://',
};

const TIPOS_TEXTO = ['texto', 'textoLargo', 'email', 'telefono', 'cedula', 'url'];

const fechaValida = (texto) => !Number.isNaN(new Date(`${texto}T00:00:00`).getTime());

const validarTexto = (campo, valor) => {
  const { etiqueta, min, max, tipo } = campo;
  if (min && valor.length < min) return `${etiqueta} debe tener al menos ${min} caracteres`;
  if (max && valor.length > max) return `${etiqueta} admite máximo ${max} caracteres`;
  if (REGEX[tipo] && MENSAJES[tipo] && !REGEX[tipo].test(valor)) return MENSAJES[tipo];
  if (campo.patron && !new RegExp(campo.patron).test(valor)) return campo.mensajePatron ?? `${etiqueta} no tiene un formato válido`;
  return null;
};

const validarNumero = (campo, valor) => {
  const { etiqueta, min, max, tipo } = campo;
  if (!Number.isFinite(valor)) return `${etiqueta} debe ser un número`;
  if (tipo === 'entero' && !Number.isInteger(valor)) return `${etiqueta} debe ser un número entero`;
  if (min !== undefined && valor < min) return `${etiqueta} debe ser mayor o igual a ${min}`;
  if (max !== undefined && valor > max) return `${etiqueta} debe ser menor o igual a ${max}`;
  return null;
};

const aBooleano = (valor) => {
  if (typeof valor === 'boolean') return valor;
  if (valor === 1 || valor === '1' || valor === 'true') return true;
  if (valor === 0 || valor === '0' || valor === 'false') return false;
  return null;
};

/**
 * Valida y limpia un valor según su tipo.
 * @returns {{ valor: unknown, error: string | null }}
 */
const procesarCampo = (campo, original) => {
  const { tipo, etiqueta } = campo;

  if (TIPOS_TEXTO.includes(tipo)) {
    let valor = limpiarTexto(original);
    if (tipo === 'email') valor = valor.toLowerCase();
    if (tipo === 'cedula') valor = valor.replace(/[\s-]/g, ''); // "1-0234-0567" → "102340567"
    return { valor, error: valor ? validarTexto(campo, valor) : null };
  }

  if (tipo === 'password') {
    const valor = typeof original === 'string' ? original : '';
    return { valor, error: valor ? validarTexto(campo, valor) : null };
  }

  if (tipo === 'entero' || tipo === 'decimal') {
    const valor = aNumero(original);
    const error = validarNumero(campo, valor);
    return { valor: tipo === 'decimal' && !error ? Math.round(valor * 100) / 100 : valor, error };
  }

  if (tipo === 'ref') {
    const valor = aNumero(original);
    const valido = Number.isInteger(valor) && valor > 0;
    return { valor, error: valido ? null : `Selecciona un valor válido para ${etiqueta}` };
  }

  if (tipo === 'booleano') {
    const valor = aBooleano(original);
    return { valor, error: valor === null ? `${etiqueta} debe ser verdadero o falso` : null };
  }

  if (tipo === 'opcion') {
    const valor = limpiarTexto(original);
    const valido = campo.opciones.includes(valor);
    return { valor, error: valido ? null : `Valor no permitido. Opciones: ${campo.opciones.join(', ')}` };
  }

  if (tipo === 'fecha') {
    const valor = limpiarTexto(original).slice(0, 10);
    const valido = REGEX.fecha.test(valor) && fechaValida(valor);
    return { valor, error: valido ? null : `${etiqueta} debe tener el formato AAAA-MM-DD` };
  }

  if (tipo === 'fechaHora') {
    const match = REGEX.fechaHora.exec(limpiarTexto(original));
    if (!match || !fechaValida(match[1])) {
      return { valor: null, error: `${etiqueta} debe tener el formato AAAA-MM-DD HH:mm` };
    }
    return { valor: `${match[1]} ${match[2]}:${match[3] ?? '00'}`, error: null };
  }

  return { valor: original, error: `Tipo de campo no soportado: ${tipo}` };
};

/**
 * @param {object} entidad  Definición de la entidad (src/models/admin/*.js)
 * @param {object} body     Datos recibidos
 * @param {{ esCreacion: boolean }} opciones
 */
export const validarEntidad = (entidad, body = {}, { esCreacion }) => {
  const datos = {};
  const errores = {};

  for (const campo of entidad.campos) {
    const original = body[campo.nombre];
    const vacio = estaVacio(original) || (typeof original === 'string' && original.trim() === '' && campo.tipo !== 'password');

    if (vacio) {
      // La contraseña solo es obligatoria al crear; al editar, vacía = se conserva.
      if (campo.tipo === 'password' && !esCreacion) continue;
      if (campo.requerido) {
        errores[campo.nombre] = `${campo.etiqueta} es obligatorio`;
      } else {
        datos[campo.nombre] = campo.porDefecto ?? null;
      }
      continue;
    }

    const { valor, error } = procesarCampo(campo, original);
    if (error) errores[campo.nombre] = error;
    else datos[campo.nombre] = valor;
  }

  // Reglas entre campos definidas en la entidad (por ejemplo, rangos de fechas).
  entidad.validar?.(datos, errores);

  return { datos, errores };
};
