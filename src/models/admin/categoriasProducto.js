// Entidad: Categorías de la tienda en línea.
import { slugify } from '../../utils/slug.js';

export default {
  clave: 'categorias-producto',
  tabla: 'categorias_producto',
  femenino: true,
  singular: 'Categoría de producto',
  plural: 'Categorías de producto',
  descripcion: 'Secciones del catálogo de la tienda.',
  grupo: 'Tienda',
  icono: 'LayoutGrid',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.orden, t.nombre',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 2, max: 80, unico: true, enLista: true },
    {
      nombre: 'slug', etiqueta: 'URL (slug)', tipo: 'texto', max: 80, unico: true, mono: true, enLista: true,
      patron: '^[a-z0-9]+(-[a-z0-9]+)*$', mensajePatron: 'Solo minúsculas, números y guiones',
      ayuda: 'Opcional: si lo dejas vacío se genera a partir del nombre.',
    },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', max: 255, enLista: true, ancho: 'completo' },
    {
      nombre: 'icono', etiqueta: 'Icono', tipo: 'opcion', porDefecto: 'Package',
      opciones: ['Laptop', 'Monitor', 'Cpu', 'HardDrive', 'MonitorSmartphone', 'Keyboard', 'Headphones', 'Wifi', 'CircuitBoard', 'MemoryStick', 'Gpu', 'PlugZap', 'Box', 'Fan', 'Package'],
    },
    { nombre: 'orden', etiqueta: 'Orden en el menú', tipo: 'entero', requerido: true, min: 0, max: 999, porDefecto: 0, enLista: true },
  ],
  preparar: (datos) => {
    if (!datos.slug) datos.slug = slugify(datos.nombre);
  },
};
