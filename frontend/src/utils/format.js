// Formateadores de datos para mostrar en pantalla.
// Colones costarricenses: ₡659 900 (los céntimos solo se muestran cuando existen).
export const LOCALE = 'es-CR';
const MONEDA = 'CRC';

const formatoMoneda = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: MONEDA, maximumFractionDigits: 0 });
const formatoMonedaExacto = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: MONEDA, minimumFractionDigits: 2 });
const formatoFecha = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
const formatoFechaHora = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

// El backend envía "YYYY-MM-DD HH:mm:ss" (hora local del taller).
const aFecha = (texto) => (texto ? new Date(String(texto).replace(' ', 'T')) : null);

export const formatMoney = (valor) => {
  const numero = Number(valor ?? 0);
  return Number.isInteger(numero) ? formatoMoneda.format(numero) : formatoMonedaExacto.format(numero);
};

// Siempre con dos decimales (facturas)
export const formatMoneyExacto = (valor) => formatoMonedaExacto.format(Number(valor ?? 0));

export const formatDate = (texto) => {
  const fecha = aFecha(texto);
  return fecha && !Number.isNaN(fecha.getTime()) ? formatoFecha.format(fecha) : '—';
};

export const formatDateTime = (texto) => {
  const fecha = aFecha(texto);
  return fecha && !Number.isNaN(fecha.getTime()) ? formatoFechaHora.format(fecha) : '—';
};

// Valor para <input type="datetime-local">: "YYYY-MM-DDTHH:mm"
export const toDateTimeInput = (texto) => (texto ? String(texto).replace(' ', 'T').slice(0, 16) : '');

export const nowDateTimeInput = () => {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora.toISOString().slice(0, 16);
};

// Código visible de la orden: OS-0007
export const codigoOrden = (id) => `OS-${String(id).padStart(4, '0')}`;

export const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');

// Búsqueda sin importar mayúsculas ni tildes.
export const normalizar = (texto = '') =>
  String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const coincide = (busqueda, ...campos) => {
  const termino = normalizar(busqueda.trim());
  return !termino || campos.some((campo) => normalizar(campo).includes(termino));
};
