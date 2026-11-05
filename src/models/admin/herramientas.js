// Entidad: Herramientas del taller (inventario de equipos de trabajo).
export default {
  clave: 'herramientas',
  tabla: 'herramientas',
  femenino: true,
  singular: 'Herramienta',
  plural: 'Herramientas',
  descripcion: 'Equipos de trabajo y su estado.',
  grupo: 'Compras e inventario',
  icono: 'Hammer',
  etiqueta: (a) => `CONCAT(${a}.codigo, ' · ', ${a}.nombre)`,
  orden: 't.codigo',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 2, max: 120, enLista: true },
    { nombre: 'codigo', etiqueta: 'Código', tipo: 'texto', requerido: true, max: 30, unico: true, enLista: true, mono: true },
    { nombre: 'marca_id', etiqueta: 'Marca', tipo: 'ref', ref: 'marcas', enLista: true },
    { nombre: 'sucursal_id', etiqueta: 'Sucursal', tipo: 'ref', ref: 'sucursales', enLista: true },
    { nombre: 'estado', etiqueta: 'Estado', tipo: 'opcion', opciones: ['Operativa', 'En mantenimiento', 'Dañada'], porDefecto: 'Operativa', enLista: true },
    { nombre: 'fecha_adquisicion', etiqueta: 'Fecha de adquisición', tipo: 'fecha' },
  ],
};
