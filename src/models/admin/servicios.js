// Entidad: Catálogo de servicios que ofrece el taller (con precio base).
export default {
  clave: 'servicios',
  tabla: 'servicios',
  singular: 'Servicio',
  plural: 'Servicios',
  descripcion: 'Catálogo de servicios con precio y duración estimada.',
  grupo: 'Catálogos',
  icono: 'Wrench',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.nombre',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 3, max: 120, unico: true, enLista: true },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', max: 255, ancho: 'completo' },
    { nombre: 'precio_base', etiqueta: 'Precio base', tipo: 'decimal', requerido: true, min: 0, max: 99999999.99, moneda: true, enLista: true },
    { nombre: 'duracion_horas', etiqueta: 'Duración (horas)', tipo: 'decimal', requerido: true, min: 0.25, max: 999, enLista: true },
    { nombre: 'activo', etiqueta: 'Activo', tipo: 'booleano', porDefecto: true, enLista: true },
  ],
};
