// Identificación de Costa Rica en el navegador (para avisar al instante).
// El backend la valida de nuevo: esta es solo una ayuda para el usuario.
//  - Cédula física: 9 dígitos (1-0234-0567)
//  - Cédula jurídica: 10 dígitos que empiezan en 2-5 (3-101-845210)
//  - DIMEX: 11 o 12 dígitos que empiezan en 1
export const normalizarCedula = (valor) => String(valor ?? '').replace(/[\s-]/g, '');

export const tipoCedula = (valor) => {
  const cedula = normalizarCedula(valor);
  if (/^[1-9]\d{8}$/.test(cedula)) return 'Cédula física';
  if (/^[2-5]\d{9}$/.test(cedula)) return 'Cédula jurídica';
  if (/^1\d{10,11}$/.test(cedula)) return 'DIMEX';
  return null;
};

export const cedulaValida = (valor) => tipoCedula(valor) !== null;

// Formato legible: 102340567 → 1-0234-0567 · 3101845210 → 3-101-845210
export const formatearCedula = (valor) => {
  const c = normalizarCedula(valor);
  if (/^\d{9}$/.test(c)) return `${c[0]}-${c.slice(1, 5)}-${c.slice(5)}`;
  if (/^\d{10}$/.test(c)) return `${c[0]}-${c.slice(1, 4)}-${c.slice(4)}`;
  return c;
};

// Nivel de una contraseña de 0 a 4 con su descripción.
export const fuerzaPassword = (password) => {
  if (!password) return { nivel: 0, texto: '' };
  let puntos = 0;
  if (password.length >= 8) puntos += 1;
  if (password.length >= 12) puntos += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntos += 1;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) puntos += 1;
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) puntos = Math.min(puntos, 1);
  return { nivel: puntos, texto: ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'][puntos] };
};
