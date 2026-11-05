// Utilidades compartidas por todos los validadores.

// Devuelve el texto sin espacios a los lados ('' si no es texto).
export const limpiarTexto = (valor) => {
  if (typeof valor === 'string') return valor.trim();
  if (typeof valor === 'number') return String(valor);
  return '';
};

// Convierte a número aceptando 12 o "12". Devuelve NaN si no es numérico.
export const aNumero = (valor) => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && valor.trim() !== '') return Number(valor);
  return Number.NaN;
};

export const estaVacio = (valor) => valor === undefined || valor === null || valor === '';

export const tieneErrores = (errores) => Object.keys(errores).length > 0;

// Valida un texto obligatorio con longitud mínima y máxima.
export const validarTextoObligatorio = (errores, campo, valor, { min = 1, max }) => {
  if (!valor) {
    errores[campo] = `El campo "${campo}" es obligatorio`;
  } else if (valor.length < min) {
    errores[campo] = `El campo "${campo}" debe tener al menos ${min} caracteres`;
  } else if (max && valor.length > max) {
    errores[campo] = `El campo "${campo}" admite máximo ${max} caracteres`;
  }
};

// Valida que el valor pertenezca a una lista de opciones permitidas.
export const validarOpcion = (errores, campo, valor, opciones) => {
  if (!valor) {
    errores[campo] = `El campo "${campo}" es obligatorio`;
  } else if (!opciones.includes(valor)) {
    errores[campo] = `Valor no permitido. Opciones: ${opciones.join(', ')}`;
  }
};
