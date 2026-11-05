// Entidad: Compras realizadas a proveedores.
export default {
  clave: 'compras',
  tabla: 'compras',
  femenino: true,
  singular: 'Compra',
  plural: 'Compras',
  descripcion: 'Facturas de compra a proveedores.',
  grupo: 'Compras e inventario',
  icono: 'ShoppingCart',
  etiqueta: (a) => `${a}.numero_factura`,
  orden: 't.fecha_compra DESC, t.id DESC',
  campos: [
    { nombre: 'proveedor_id', etiqueta: 'Proveedor', tipo: 'ref', ref: 'proveedores', requerido: true, enLista: true, ancho: 'completo' },
    { nombre: 'numero_factura', etiqueta: 'N.º de factura', tipo: 'texto', requerido: true, max: 40, unico: true, enLista: true, mono: true },
    { nombre: 'fecha_compra', etiqueta: 'Fecha de compra', tipo: 'fecha', requerido: true, enLista: true },
    { nombre: 'total', etiqueta: 'Total', tipo: 'decimal', requerido: true, min: 0, max: 9999999999.99, moneda: true, enLista: true },
    { nombre: 'estado', etiqueta: 'Estado', tipo: 'opcion', opciones: ['Pendiente', 'Recibida', 'Anulada'], porDefecto: 'Pendiente', enLista: true },
    { nombre: 'observaciones', etiqueta: 'Observaciones', tipo: 'texto', max: 255, ancho: 'completo' },
  ],
};
