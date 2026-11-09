// Plantillas HTML de los correos con la identidad de Bancada.
// Los estilos van en línea porque la mayoría de clientes de correo ignoran <style>.
// TODO valor dinámico pasa por esc() para que nadie pueda inyectar HTML en un correo.
import { env } from '../../config/env.js';

export const esc = (valor) =>
  String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

// Montos en colones costarricenses: ₡659 900,00
export const dinero = (valor) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(Number(valor ?? 0));
const fechaLarga = (fecha) =>
  new Intl.DateTimeFormat('es-CR', { dateStyle: 'long', timeStyle: 'short', timeZone: env.zonaHoraria }).format(
    fecha ? new Date(String(fecha).replace(' ', 'T')) : new Date(),
  );
export const codigoOrden = (id) => `OS-${String(id).padStart(4, '0')}`;
export const codigoPedido = (id) => `PED-${String(id).padStart(5, '0')}`;

const C = { tinta: '#15171c', papel: '#f3f0e8', senal: '#ff5a1f', linea: '#ddd7ca', suave: '#676b75' };

const boton = (texto, url) =>
  `<a href="${esc(url)}" style="display:inline-block;background:${C.senal};color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:12px">${esc(texto)}</a>`;

const tabla = (filas) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">${filas
    .map(
      ([a, b], i) =>
        `<tr><td style="padding:9px 0;color:${C.suave};${i ? `border-top:1px solid ${C.linea}` : ''}">${a}</td><td style="padding:9px 0;text-align:right;font-weight:600;${i ? `border-top:1px solid ${C.linea}` : ''}">${b}</td></tr>`,
    )
    .join('')}</table>`;

const bloque = (titulo, contenido) =>
  `<h3 style="margin:26px 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${C.suave}">${esc(titulo)}</h3>${contenido}`;

const vacio = (texto) => `<p style="margin:0;color:${C.suave};font-size:14px">${esc(texto)}</p>`;

// Estructura común: encabezado oscuro con la marca, tarjeta blanca y pie.
const plantilla = ({ titulo, previo = '', contenido }) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title></head>
<body style="margin:0;background:${C.papel};font-family:Segoe UI,Helvetica,Arial,sans-serif;color:${C.tinta}">
<span style="display:none;max-height:0;overflow:hidden">${esc(previo)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">
<tr><td style="background:${C.tinta};border-radius:20px 20px 0 0;padding:22px 28px">
<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${C.senal};margin-right:8px"></span>
<span style="color:#fff;font-size:19px;font-weight:800">Bancada</span>
<span style="color:#ffffff80;font-size:11px;letter-spacing:.18em;margin-left:6px">SERVICIO TÉCNICO</span>
</td></tr>
<tr><td style="background:#fff;border-radius:0 0 20px 20px;padding:30px 28px">
<h1 style="margin:0 0 14px;font-size:24px;line-height:1.2">${esc(titulo)}</h1>
${contenido}
</td></tr>
<tr><td style="padding:18px 8px;text-align:center;font-size:12px;color:${C.suave}">
Bancada · Taller de computación y tecnología<br>Este es un mensaje automático, por favor no respondas a este correo.
</td></tr></table></td></tr></table></body></html>`;

const parrafo = (texto) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${texto}</p>`;

// ---------------------------------------------------------------------
// Cuentas
// ---------------------------------------------------------------------
export const correoVerificacion = ({ nombre, enlace }) => ({
  asunto: 'Confirma tu correo · Bancada',
  html: plantilla({
    titulo: 'Confirma tu correo',
    previo: 'Un paso más para activar tu cuenta',
    contenido:
      parrafo(`Hola, ${esc(nombre)}. Gracias por crear tu cuenta en Bancada.`) +
      parrafo('Para activarla, confirma que este correo es tuyo:') +
      `<p style="margin:24px 0">${boton('Confirmar mi correo', enlace)}</p>` +
      parrafo(`<span style="color:${C.suave};font-size:13px">El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este mensaje.</span>`),
  }),
});

export const correoRecuperacion = ({ nombre, enlace }) => ({
  asunto: 'Restablece tu contraseña · Bancada',
  html: plantilla({
    titulo: 'Restablece tu contraseña',
    previo: 'Recibimos una solicitud para cambiar tu contraseña',
    contenido:
      parrafo(`Hola, ${esc(nombre)}. Recibimos una solicitud para restablecer la contraseña de tu cuenta.`) +
      `<p style="margin:24px 0">${boton('Crear una nueva contraseña', enlace)}</p>` +
      parrafo(`<span style="color:${C.suave};font-size:13px">El enlace vence en 30 minutos y solo funciona una vez. Si no lo pediste tú, ignora este correo: tu contraseña actual sigue siendo válida.</span>`),
  }),
});

export const correoCodigo = ({ nombre, codigo }) => ({
  asunto: `${codigo} es tu código de verificación · Bancada`,
  html: plantilla({
    titulo: 'Tu código de verificación',
    previo: `Código: ${codigo}`,
    contenido:
      parrafo(`Hola, ${esc(nombre)}. Usa este código para terminar de iniciar sesión:`) +
      `<p style="margin:22px 0;font-family:Consolas,monospace;font-size:34px;font-weight:800;letter-spacing:.35em;color:${C.tinta}">${esc(codigo)}</p>` +
      parrafo(`<span style="color:${C.suave};font-size:13px">Vence en 10 minutos. Si no estás intentando entrar, cambia tu contraseña de inmediato.</span>`),
  }),
});

export const correoNuevoInicio = ({ nombre, ip, agente, fecha }) => ({
  asunto: 'Nuevo inicio de sesión en tu cuenta · Bancada',
  html: plantilla({
    titulo: 'Nuevo inicio de sesión',
    previo: 'Detectamos un acceso desde un dispositivo nuevo',
    contenido:
      parrafo(`Hola, ${esc(nombre)}. Se inició sesión en tu cuenta desde un dispositivo o red que no habíamos visto antes.`) +
      tabla([['Fecha', esc(fechaLarga(fecha))], ['Dirección IP', esc(ip || 'desconocida')], ['Navegador', esc((agente || 'desconocido').slice(0, 80))]]) +
      parrafo(`<br><span style="color:${C.suave};font-size:13px">Si fuiste tú, no tienes que hacer nada. Si no, cambia tu contraseña y activa la verificación en dos pasos.</span>`),
  }),
});

export const correoCuentaBloqueada = ({ nombre, minutos }) => ({
  asunto: 'Bloqueamos temporalmente tu cuenta · Bancada',
  html: plantilla({
    titulo: 'Cuenta bloqueada temporalmente',
    contenido:
      parrafo(`Hola, ${esc(nombre)}. Hubo varios intentos fallidos de iniciar sesión en tu cuenta, así que la bloqueamos ${esc(minutos)} minutos por seguridad.`) +
      parrafo('Si no fuiste tú, te recomendamos restablecer tu contraseña.') +
      `<p style="margin:24px 0">${boton('Restablecer contraseña', `${env.appUrl}/olvide-contrasena`)}</p>`,
  }),
});

// ---------------------------------------------------------------------
// Tienda
// ---------------------------------------------------------------------
const filasPedido = (pedido) =>
  pedido.items
    .map(
      (item) =>
        `<tr><td style="padding:10px 0;border-top:1px solid ${C.linea};font-size:14px">${esc(item.nombre_producto)}<br><span style="color:${C.suave};font-size:12px">${esc(item.cantidad)} × ${dinero(item.precio_unitario)}</span></td><td style="padding:10px 0;border-top:1px solid ${C.linea};text-align:right;font-weight:600;font-size:14px">${dinero(item.cantidad * item.precio_unitario)}</td></tr>`,
    )
    .join('');

export const correoPedidoRecibido = ({ nombre, pedido, empresa }) => ({
  asunto: `Recibimos tu pedido ${codigoPedido(pedido.id)} · Bancada`,
  html: plantilla({
    titulo: '¡Gracias por tu compra!',
    previo: `Pedido ${codigoPedido(pedido.id)} por ${dinero(pedido.total)}`,
    contenido:
      parrafo(`Hola, ${esc(nombre)}. Recibimos tu pedido <strong>${codigoPedido(pedido.id)}</strong>. Te avisaremos por correo cada vez que cambie de estado.`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${filasPedido(pedido)}</table>` +
      tabla([
        ['Subtotal', dinero(pedido.subtotal)],
        ['Envío', Number(pedido.costo_envio) ? dinero(pedido.costo_envio) : 'Gratis'],
        ['<strong>Total</strong>', `<strong>${dinero(pedido.total)}</strong>`],
      ]) +
      bloque('Pago y entrega', tabla([['Método de pago', esc(pedido.metodo_pago)], ['Entrega', esc(pedido.tipo_entrega)], ...(pedido.direccion ? [['Dirección', esc(`${pedido.direccion}, ${pedido.ciudad ?? ''}`)]] : [])])) +
      (pedido.metodo_pago === 'SINPE Móvil'
        ? bloque('Paga por SINPE Móvil', parrafo(`Envía <strong>${dinero(pedido.total)}</strong> al número <strong>${esc(empresa.sinpe)}</strong> (${esc(empresa.nombre)}) con el detalle <strong>${codigoPedido(pedido.id)}</strong>.`))
        : '') +
      (pedido.metodo_pago === 'Transferencia'
        ? bloque('Datos para la transferencia', parrafo(`${esc(empresa.nombre)} · Cédula jurídica ${esc(empresa.cedulaJuridica)}<br>IBAN <strong>${esc(empresa.iban)}</strong><br>Usa <strong>${codigoPedido(pedido.id)}</strong> como referencia.`))
        : '') +
      `<p style="margin:24px 0 0">${boton('Ver mi pedido', `${env.appUrl}/mi-cuenta/pedidos`)}</p>`,
  }),
});

export const correoPedidoEstado = ({ nombre, pedido }) => ({
  asunto: `Tu pedido ${codigoPedido(pedido.id)} está: ${pedido.estado} · Bancada`,
  html: plantilla({
    titulo: `Pedido ${codigoPedido(pedido.id)}: ${pedido.estado}`,
    contenido:
      parrafo(`Hola, ${esc(nombre)}. El estado de tu pedido cambió a <strong>${esc(pedido.estado)}</strong>.`) +
      (pedido.estado === 'Listo para retirar' ? parrafo('Puedes retirarlo en nuestra tienda de lunes a sábado, de 9:00 a 19:00. Lleva tu cédula.') : '') +
      (pedido.estado === 'Cancelado' ? parrafo('Si tienes dudas sobre la cancelación, comunícate con nosotros.') : '') +
      `<p style="margin:24px 0 0">${boton('Ver mi pedido', `${env.appUrl}/mi-cuenta/pedidos`)}</p>`,
  }),
});

// ---------------------------------------------------------------------
// Informes para el cliente (requieren aprobación del administrador)
// ---------------------------------------------------------------------
export const correoInformeOrden = ({ nombre, detalle, nota }) => {
  const { orden, repuestos, pagos, garantias, seguimientos } = detalle;
  const totalRepuestos = repuestos.reduce((s, r) => s + Number(r.subtotal), 0);
  const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0);
  return {
    asunto: `Informe de tu equipo ${codigoOrden(orden.id)} · Bancada`,
    html: plantilla({
      titulo: `Informe de servicio ${codigoOrden(orden.id)}`,
      previo: `${orden.marca_modelo} · ${orden.estado}`,
      contenido:
        parrafo(`Hola, ${esc(nombre)}. Este es el informe que solicitaste sobre tu equipo.`) +
        (nota ? parrafo(`<em style="color:${C.suave}">Nota del taller: ${esc(nota)}</em>`) : '') +
        tabla([
          ['Equipo', esc(`${orden.tipo_equipo} · ${orden.marca_modelo}`)],
          ['Número de serie', esc(orden.serial)],
          ['Ingreso', esc(fechaLarga(orden.fecha_ingreso))],
          ['Estado actual', `<span style="color:${C.senal}">${esc(orden.estado)}</span>`],
        ]) +
        bloque('Diagnóstico', parrafo(esc(orden.diagnostico || 'Aún sin diagnóstico registrado.'))) +
        bloque(
          'Repuestos utilizados',
          repuestos.length
            ? tabla([...repuestos.map((r) => [esc(`${r.cantidad} × ${r.nombre}`), dinero(r.subtotal)]), ['<strong>Total repuestos</strong>', `<strong>${dinero(totalRepuestos)}</strong>`]])
            : vacio('No se han utilizado repuestos.'),
        ) +
        bloque('Pagos registrados', pagos.length ? tabla([...pagos.map((p) => [esc(`${fechaLarga(p.fecha_pago)} · ${p.metodo}`), dinero(p.monto)]), ['<strong>Total pagado</strong>', `<strong>${dinero(totalPagado)}</strong>`]]) : vacio('Sin pagos registrados.')) +
        bloque('Avances del técnico', seguimientos.length ? seguimientos.map((s) => parrafo(`<span style="color:${C.suave};font-size:13px">${esc(fechaLarga(s.fecha))} · ${esc(s.tecnico)}</span><br>${esc(s.nota)}`)).join('') : vacio('Sin notas registradas.')) +
        (garantias.length ? bloque('Garantía', tabla(garantias.map((g) => [esc(g.cobertura), esc(`${g.estado} hasta ${g.fecha_fin}`)]))) : ''),
    }),
  };
};

export const correoSolicitudRechazada = ({ nombre, orden, motivo }) => ({
  asunto: `Sobre tu solicitud de informe ${codigoOrden(orden)} · Bancada`,
  html: plantilla({
    titulo: 'No pudimos enviar tu informe',
    contenido:
      parrafo(`Hola, ${esc(nombre)}. Revisamos tu solicitud de informe de la orden <strong>${codigoOrden(orden)}</strong> y por ahora no podemos enviarlo.`) +
      (motivo ? parrafo(`<strong>Motivo:</strong> ${esc(motivo)}`) : '') +
      parrafo('Si necesitas más información, comunícate con el taller.'),
  }),
});

// ---------------------------------------------------------------------
// Informe diario para administradores
// ---------------------------------------------------------------------
export const correoInformeDiario = ({ fecha, datos, analisisIA = null }) => {
  const kpi = (valor, etiqueta) =>
    `<td width="50%" style="padding:6px"><div style="background:${C.papel};border-radius:14px;padding:14px"><div style="font-size:24px;font-weight:800">${valor}</div><div style="font-size:12px;color:${C.suave}">${esc(etiqueta)}</div></div></td>`;
  return {
    asunto: `Informe diario · ${fecha} · Bancada`,
    html: plantilla({
      titulo: `Informe del ${fecha}`,
      previo: `${datos.ordenesIngresadas} ingresos · ${dinero(datos.ventasTienda)} en la tienda · ${dinero(datos.pagosTaller)} cobrados en el taller`,
      contenido:
        parrafo('Resumen automático de la actividad de hoy en el taller y la tienda.') +
        (analisisIA
          ? bloque('Análisis de la IA', `<div style="background:#fff7f2;border-left:3px solid ${C.senal};border-radius:10px;padding:12px 14px;font-size:14px;line-height:1.6">${esc(analisisIA).replaceAll('\n', '<br>')}</div>`)
          : '') +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${kpi(datos.ordenesIngresadas, 'equipos ingresados')}${kpi(datos.ordenesEntregadas, 'equipos entregados')}</tr><tr>${kpi(dinero(datos.pagosTaller), 'cobrado en el taller')}${kpi(dinero(datos.ventasTienda), `vendido en la tienda (${datos.pedidosHoy} pedidos)`)}</tr></table>` +
        bloque('Órdenes en curso', tabla(Object.entries(datos.ordenesPorEstado).map(([estado, total]) => [esc(estado), esc(total)]))) +
        bloque('Pendientes de atender', tabla([
          ['Pedidos de la tienda sin confirmar', esc(datos.pedidosPendientes)],
          ['Solicitudes de informe por revisar', esc(datos.solicitudesPendientes)],
          ['Citas para mañana', esc(datos.citasManana)],
        ])) +
        bloque('Finanzas del día', tabla([['Cobrado en el taller', dinero(datos.pagosTaller)], ['Ventas de la tienda', dinero(datos.ventasTienda)], ['Gastos', dinero(datos.gastos)], ['<strong>Resultado</strong>', `<strong>${dinero(datos.pagosTaller + datos.ventasTienda - datos.gastos)}</strong>`]])) +
        bloque('Stock bajo', datos.stockBajo.length ? tabla(datos.stockBajo.map((p) => [esc(p.nombre), `${esc(p.stock)} u.`])) : vacio('Todo el inventario tiene stock suficiente.')) +
        bloque('Seguridad', tabla([['Clientes nuevos', esc(datos.clientesNuevos)], ['Inicios de sesión fallidos', esc(datos.loginsFallidos)]])) +
        `<p style="margin:26px 0 0">${boton('Abrir el dashboard', `${env.appUrl}/gestion`)}</p>`,
    }),
  };
};

// ---------------------------------------------------------------------
// Facturas y automatizaciones
// ---------------------------------------------------------------------
export const correoFactura = ({ factura, empresa }) => ({
  asunto: `Factura ${factura.consecutivo} · ${empresa.nombre}`,
  html: plantilla({
    titulo: `Factura ${factura.consecutivo}`,
    previo: `Total ${dinero(factura.total)}`,
    contenido:
      parrafo(`Hola, ${esc(factura.cliente_nombre)}. Gracias por tu compra. Este es el detalle de tu factura.`) +
      tabla([
        ['Emitida', esc(fechaLarga(factura.created_at))],
        ['Emisor', esc(`${empresa.nombre} · Céd. jurídica ${empresa.cedulaJuridica}`)],
        ['Método de pago', esc(factura.metodo_pago ?? '—')],
      ]) +
      bloque('Detalle', tabla(factura.lineas.map((l) => [esc(`${l.cantidad} × ${l.descripcion}`), dinero(l.cantidad * l.precio_unitario)]))) +
      tabla([
        ['Subtotal (sin IVA)', dinero(factura.subtotal)],
        [`IVA ${esc(empresa.iva)} %`, dinero(factura.iva)],
        ['<strong>Total</strong>', `<strong>${dinero(factura.total)}</strong>`],
      ]) +
      `<p style="margin:24px 0 0">${boton('Ver e imprimir la factura', `${env.appUrl}/documentos/factura/${factura.id}`)}</p>`,
  }),
});

export const correoRecordatorioCita = ({ nombre, cita, empresa }) => ({
  asunto: `Recordatorio: tu cita es mañana · ${empresa.nombre}`,
  html: plantilla({
    titulo: 'Te esperamos mañana',
    contenido:
      parrafo(`Hola, ${esc(nombre)}. Te recordamos tu cita en el taller.`) +
      tabla([['Fecha y hora', esc(fechaLarga(cita.fecha_hora))], ['Motivo', esc(cita.motivo)], ['Sucursal', esc(cita.sucursal ?? 'Principal')]]) +
      parrafo(`<br>Si no puedes asistir, llámanos al ${esc(empresa.telefono)}.`),
  }),
});

export const correoAlertaStock = ({ productos }) => ({
  asunto: `Alerta de stock: ${productos.length} producto(s) agotados o por agotarse`,
  html: plantilla({
    titulo: 'Productos por reponer',
    contenido:
      parrafo('Estos productos de la tienda se agotaron o están por agotarse después de la última venta:') +
      tabla(productos.map((p) => [esc(p.nombre), p.stock ? `${esc(p.stock)} u.` : '<strong style="color:#d1352b">Agotado</strong>'])) +
      `<p style="margin:24px 0 0">${boton('Reponer en el panel', `${env.appUrl}/admin/productos`)}</p>`,
  }),
});

export const correoPedidoCanceladoAuto = ({ nombre, pedido, horas }) => ({
  asunto: `Cancelamos tu pedido ${codigoPedido(pedido.id)} · Bancada`,
  html: plantilla({
    titulo: 'Tu pedido fue cancelado',
    contenido:
      parrafo(`Hola, ${esc(nombre)}. El pedido <strong>${codigoPedido(pedido.id)}</strong> estuvo pendiente de pago más de ${esc(horas)} horas, así que lo cancelamos y liberamos los productos.`) +
      parrafo('Si todavía lo quieres, puedes volver a hacer el pedido en la tienda.') +
      `<p style="margin:24px 0 0">${boton('Ir a la tienda', `${env.appUrl}/tienda`)}</p>`,
  }),
});
