// Entidad: Pagos recibidos por una orden de servicio.
export default {
  clave: 'pagos',
  tabla: 'pagos',
  singular: 'Pago',
  plural: 'Pagos',
  descripcion: 'Abonos y pagos de los clientes por cada orden.',
  grupo: 'Finanzas',
  icono: 'Wallet',
  etiqueta: (a) => `CONCAT('PAG-', LPAD(${a}.id, 4, '0'))`,
  orden: 't.fecha_pago DESC',
  campos: [
    { nombre: 'orden_id', etiqueta: 'Orden de servicio', tipo: 'ref', ref: 'ordenes', requerido: true, enLista: true, ancho: 'completo' },
    { nombre: 'metodo_pago_id', etiqueta: 'Método de pago', tipo: 'ref', ref: 'metodos-pago', requerido: true, enLista: true },
    { nombre: 'monto', etiqueta: 'Monto', tipo: 'decimal', requerido: true, min: 0.01, max: 99999999.99, moneda: true, enLista: true },
    { nombre: 'fecha_pago', etiqueta: 'Fecha de pago', tipo: 'fechaHora', requerido: true, enLista: true },
    { nombre: 'referencia', etiqueta: 'Referencia', tipo: 'texto', max: 80, enLista: true, mono: true },
  ],
};
