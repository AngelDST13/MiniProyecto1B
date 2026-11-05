// Validación de entrada para OrdenServicio y para los repuestos usados en una orden.
import { aNumero, estaVacio, limpiarTexto, validarOpcion, validarTextoObligatorio } from './helpers.js';

export const TIPOS_EQUIPO = ['Laptop', 'Desktop', 'GPU'];
export const ESTADOS = ['Recibido', 'En Diagnóstico', 'Reparado', 'Entregado'];

// Acepta "2026-11-05", "2026-11-05T10:30" o "2026-11-05 10:30:00"
const REGEX_FECHA = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?)?$/;

// Devuelve la fecha normalizada para MySQL ("YYYY-MM-DD HH:mm:ss") o null si es inválida.
const normalizarFecha = (texto) => {
  const match = REGEX_FECHA.exec(texto);
  if (!match) return null;
  const [, dia, hora = '00:00', segundos = '00'] = match;
  const normalizada = `${dia} ${hora}:${segundos}`;
  return Number.isNaN(new Date(normalizada.replace(' ', 'T')).getTime()) ? null : normalizada;
};

const validarEnteroPositivo = (errores, campo, valor, original) => {
  if (estaVacio(original)) {
    errores[campo] = `El campo "${campo}" es obligatorio`;
  } else if (!Number.isInteger(valor) || valor <= 0) {
    errores[campo] = `El campo "${campo}" debe ser un número entero positivo`;
  }
};

/**
 * Valida una orden completa (POST y PUT).
 * estado y fecha_ingreso son opcionales: si no llegan, quedan en null y el modelo
 * usa el valor por defecto (al crear) o conserva el actual (al actualizar).
 */
export const validarOrden = (body = {}) => {
  const datos = {
    cliente_id: aNumero(body.cliente_id),
    tipo_equipo: limpiarTexto(body.tipo_equipo),
    marca_modelo: limpiarTexto(body.marca_modelo),
    serial: limpiarTexto(body.serial),
    diagnostico: limpiarTexto(body.diagnostico) || null,
    estado: limpiarTexto(body.estado) || null,
    fecha_ingreso: null,
  };

  const errores = {};

  validarEnteroPositivo(errores, 'cliente_id', datos.cliente_id, body.cliente_id);
  validarOpcion(errores, 'tipo_equipo', datos.tipo_equipo, TIPOS_EQUIPO);
  validarTextoObligatorio(errores, 'marca_modelo', datos.marca_modelo, { min: 2, max: 120 });
  validarTextoObligatorio(errores, 'serial', datos.serial, { max: 80 });

  if (datos.diagnostico && datos.diagnostico.length > 2000) {
    errores.diagnostico = 'El diagnóstico admite máximo 2000 caracteres';
  }
  if (datos.estado && !ESTADOS.includes(datos.estado)) {
    errores.estado = `Valor no permitido. Opciones: ${ESTADOS.join(', ')}`;
  }

  const fechaTexto = limpiarTexto(body.fecha_ingreso);
  if (fechaTexto) {
    datos.fecha_ingreso = normalizarFecha(fechaTexto);
    if (!datos.fecha_ingreso) {
      errores.fecha_ingreso = 'La fecha debe tener el formato YYYY-MM-DD o YYYY-MM-DDTHH:mm';
    }
  }

  return { datos, errores };
};

// Valida el cambio de estado (PATCH /api/ordenes/:id/estado).
export const validarEstado = (body = {}) => {
  const estado = limpiarTexto(body.estado);
  const errores = {};
  validarOpcion(errores, 'estado', estado, ESTADOS);
  return { datos: { estado }, errores };
};

// Valida un repuesto agregado a una orden (POST /api/ordenes/:id/componentes).
export const validarComponenteDeOrden = (body = {}) => {
  const datos = {
    componente_id: aNumero(body.componente_id),
    cantidad: estaVacio(body.cantidad) ? 1 : aNumero(body.cantidad),
  };
  const errores = {};

  validarEnteroPositivo(errores, 'componente_id', datos.componente_id, body.componente_id);
  if (!Number.isInteger(datos.cantidad) || datos.cantidad <= 0 || datos.cantidad > 1000) {
    errores.cantidad = 'La cantidad debe ser un número entero entre 1 y 1000';
  }

  return { datos, errores };
};
