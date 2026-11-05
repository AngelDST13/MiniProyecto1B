// Entidad: Cotizaciones presentadas al cliente para una orden de servicio.
export default {
  clave: 'cotizaciones',
  tabla: 'cotizaciones',
  femenino: true,
  singular: 'Cotización',
  plural: 'Cotizaciones',
  descripcion: 'Presupuestos de reparación por orden.',
  grupo: 'Atención y servicio',
  icono: 'FileText',
  etiqueta: (a) => `CONCAT('COT-', LPAD(${a}.id, 4, '0'))`,
  orden: 't.id DESC',
  campos: [
    { nombre: 'orden_id', etiqueta: 'Orden de servicio', tipo: 'ref', ref: 'ordenes', requerido: true, enLista: true, ancho: 'completo' },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', requerido: true, min: 3, max: 255, enLista: true, ancho: 'completo' },
    { nombre: 'monto', etiqueta: 'Monto', tipo: 'decimal', requerido: true, min: 0, max: 99999999.99, moneda: true, enLista: true },
    { nombre: 'valida_hasta', etiqueta: 'Válida hasta', tipo: 'fecha', requerido: true, enLista: true },
    { nombre: 'estado', etiqueta: 'Estado', tipo: 'opcion', opciones: ['Pendiente', 'Aprobada', 'Rechazada'], porDefecto: 'Pendiente', enLista: true },
  ],
};
