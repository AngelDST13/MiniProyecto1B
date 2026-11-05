// Entidad: Marcas de herramientas y equipos.
export default {
  clave: 'marcas',
  tabla: 'marcas',
  femenino: true,
  singular: 'Marca',
  plural: 'Marcas',
  descripcion: 'Fabricantes de herramientas y equipos.',
  grupo: 'Catálogos',
  icono: 'Tag',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.nombre',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 2, max: 80, unico: true, enLista: true },
    { nombre: 'pais_origen', etiqueta: 'País de origen', tipo: 'texto', max: 60, enLista: true },
    { nombre: 'sitio_web', etiqueta: 'Sitio web', tipo: 'url', max: 150, enLista: true },
  ],
};
