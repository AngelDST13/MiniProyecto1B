// Entidad: Gastos operativos del taller.
export default {
  clave: 'gastos',
  tabla: 'gastos',
  singular: 'Gasto',
  plural: 'Gastos',
  descripcion: 'Egresos operativos por categoría y sucursal.',
  grupo: 'Finanzas',
  icono: 'Receipt',
  etiqueta: (a) => `${a}.concepto`,
  orden: 't.fecha DESC, t.id DESC',
  campos: [
    { nombre: 'concepto', etiqueta: 'Concepto', tipo: 'texto', requerido: true, min: 3, max: 150, enLista: true, ancho: 'completo' },
    { nombre: 'categoria_gasto_id', etiqueta: 'Categoría', tipo: 'ref', ref: 'categorias-gasto', requerido: true, enLista: true },
    { nombre: 'sucursal_id', etiqueta: 'Sucursal', tipo: 'ref', ref: 'sucursales', enLista: true },
    { nombre: 'monto', etiqueta: 'Monto', tipo: 'decimal', requerido: true, min: 0.01, max: 99999999.99, moneda: true, enLista: true },
    { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true, enLista: true },
  ],
};
