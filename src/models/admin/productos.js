// Entidad: Productos de la tienda en línea.
import { slugify } from '../../utils/slug.js';

export default {
  clave: 'productos',
  tabla: 'productos',
  singular: 'Producto',
  plural: 'Productos',
  descripcion: 'Catálogo de la tienda en línea: precios, stock y fotos.',
  grupo: 'Tienda',
  icono: 'ShoppingBag',
  etiqueta: (a) => `${a}.nombre`,
  orden: 't.destacado DESC, t.nombre',
  campos: [
    { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, min: 3, max: 160, enLista: true, ancho: 'completo' },
    { nombre: 'sku', etiqueta: 'SKU', tipo: 'texto', requerido: true, max: 40, unico: true, enLista: true, mono: true },
    {
      nombre: 'slug', etiqueta: 'URL (slug)', tipo: 'texto', max: 180, unico: true, mono: true,
      patron: '^[a-z0-9]+(-[a-z0-9]+)*$', mensajePatron: 'Solo minúsculas, números y guiones',
      ayuda: 'Opcional: si lo dejas vacío se genera a partir del nombre.',
    },
    { nombre: 'categoria_id', etiqueta: 'Categoría', tipo: 'ref', ref: 'categorias-producto', requerido: true, enLista: true },
    { nombre: 'marca_id', etiqueta: 'Marca', tipo: 'ref', ref: 'marcas' },
    { nombre: 'precio', etiqueta: 'Precio', tipo: 'decimal', requerido: true, min: 0, max: 99999999.99, moneda: true, enLista: true },
    { nombre: 'precio_anterior', etiqueta: 'Precio anterior (oferta)', tipo: 'decimal', min: 0, max: 99999999.99, moneda: true, ayuda: 'Si es mayor al precio, el producto aparece en oferta.' },
    { nombre: 'stock', etiqueta: 'Stock', tipo: 'entero', requerido: true, min: 0, max: 1000000, enLista: true },
    { nombre: 'garantia_meses', etiqueta: 'Garantía (meses)', tipo: 'entero', requerido: true, min: 0, max: 120, porDefecto: 12 },
    { nombre: 'imagen_url', etiqueta: 'URL de la imagen', tipo: 'url', max: 500, ancho: 'completo', ayuda: 'Opcional. Sin imagen se muestra una ilustración de la categoría.' },
    { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textoLargo', max: 2000 },
    { nombre: 'especificaciones', etiqueta: 'Especificaciones', tipo: 'textoLargo', max: 4000, ayuda: 'Una por línea, con el formato "Clave: valor".' },
    { nombre: 'destacado', etiqueta: 'Destacado en la portada', tipo: 'booleano', porDefecto: false, enLista: true },
    { nombre: 'activo', etiqueta: 'Visible en la tienda', tipo: 'booleano', porDefecto: true, enLista: true },
  ],
  // Antes de guardar: genera el slug si viene vacío.
  preparar: (datos) => {
    if (!datos.slug) datos.slug = slugify(datos.nombre);
  },
  validar: (datos, errores) => {
    if (datos.precio_anterior !== null && datos.precio_anterior !== undefined && datos.precio_anterior <= datos.precio) {
      errores.precio_anterior = 'El precio anterior debe ser mayor al precio actual (o déjalo vacío)';
    }
  },
};
