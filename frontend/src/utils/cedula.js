// Validación de cédula ecuatoriana en el navegador (para avisar al instante).
// El backend la valida de nuevo: esta es solo una ayuda para el usuario.
export const cedulaValida = (cedula) => {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = Number(cedula.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30) || Number(cedula[2]) >= 6) return false;
  const suma = [...cedula.slice(0, 9)].reduce((total, digito, i) => {
    let valor = Number(digito) * (i % 2 === 0 ? 2 : 1);
    if (valor > 9) valor -= 9;
    return total + valor;
  }, 0);
  return (10 - (suma % 10)) % 10 === Number(cedula[9]);
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
