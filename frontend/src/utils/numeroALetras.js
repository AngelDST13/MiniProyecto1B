// Monto en letras para facturas: 659900 → "SEISCIENTOS CINCUENTA Y NUEVE MIL NOVECIENTOS COLONES CON 00/100"
const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
  'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
const DECENAS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

const menorQueMil = (n) => {
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto = CENTENAS[c];
  if (resto) {
    const parte = resto < 30 ? UNIDADES[resto] : `${DECENAS[Math.floor(resto / 10)]}${resto % 10 ? ` Y ${UNIDADES[resto % 10]}` : ''}`;
    texto = texto ? `${texto} ${parte}` : parte;
  }
  return texto;
};

const enteroALetras = (n) => {
  if (n === 0) return 'CERO';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes = [];
  if (millones) partes.push(millones === 1 ? 'UN MILLÓN' : `${enteroALetras(millones)} MILLONES`);
  if (miles) partes.push(miles === 1 ? 'MIL' : `${menorQueMil(miles)} MIL`);
  if (resto) partes.push(menorQueMil(resto));
  return partes.join(' ');
};

export const montoEnLetras = (monto) => {
  const total = Math.round(Number(monto ?? 0) * 100);
  const entero = Math.floor(total / 100);
  const centimos = String(total % 100).padStart(2, '0');
  const letras = enteroALetras(entero);
  // "UN MILLÓN DE COLONES", pero "DOS MILLONES CIEN COLONES"
  const de = /MILL(ÓN|ONES)$/.test(letras) ? ' DE' : '';
  return `${letras}${de} ${entero === 1 ? 'COLÓN' : 'COLONES'} CON ${centimos}/100`;
};
