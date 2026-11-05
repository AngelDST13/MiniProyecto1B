// Entidad: Categorías para clasificar los gastos.
export default {
  clave: 'categorias-gasto',
  tabla: 'categorias_gasto',
  femenino: true,
  singular: 'Categoría de gasto',
  plural: 'Categorías de gasto',
  descripcion: 'Clasificación contable de los gastos.',
  grupo: 'Finanzas',
  icono: 'Tags',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.nombre',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 2, max: 80, unico: true, enLista: true },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', max: 255, enLista: true, ancho: 'completo' },
  ],
};
