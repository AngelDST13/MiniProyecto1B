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

/**
 * Valida una cédula ecuatoriana: 10 dígitos, provincia 01-24 (o 30 para extranjeros),
 * tercer dígito menor a 6 y dígito verificador con el algoritmo módulo 10 del Registro Civil.
 */
export const cedulaEcuatorianaValida = (cedula) => {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = Number(cedula.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;
  if (Number(cedula[2]) >= 6) return false;
  const suma = [...cedula.slice(0, 9)].reduce((total, digito, i) => {
    let valor = Number(digito) * (i % 2 === 0 ? 2 : 1);
    if (valor > 9) valor -= 9;
    return total + valor;
  }, 0);
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === Number(cedula[9]);
};

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
