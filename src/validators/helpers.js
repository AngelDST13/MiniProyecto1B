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

// Quita guiones y espacios: "1-0234-0567" → "102340567"
export const normalizarCedula = (valor) => String(valor ?? '').replace(/[\s-]/g, '');

/**
 * Identificación de Costa Rica (ya normalizada, solo dígitos):
 *  - Cédula física: 9 dígitos (formato 1-0234-0567), primer dígito de 1 a 9.
 *  - Cédula jurídica / institucional / NITE: 10 dígitos que empiezan en 2, 3, 4 o 5 (3-101-845210).
 *  - DIMEX (residentes extranjeros): 11 o 12 dígitos que empiezan en 1.
 * @returns {'fisica' | 'juridica' | 'dimex' | null}
 */
export const tipoIdentificacionCR = (cedula) => {
  if (/^[1-9]\d{8}$/.test(cedula)) return 'fisica';
  if (/^[2-5]\d{9}$/.test(cedula)) return 'juridica';
  if (/^1\d{10,11}$/.test(cedula)) return 'dimex';
  return null;
};

export const cedulaCostaRicaValida = (cedula) => tipoIdentificacionCR(cedula) !== null;


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
