// Catálogo público de la tienda (solo productos activos).
import { pool } from '../config/db.js';

const SELECT_PRODUCTO = `
  SELECT p.id, p.nombre, p.slug, p.sku, p.descripcion, p.especificaciones, p.precio, p.precio_anterior, p.stock,
         p.imagen_url, p.garantia_meses, p.destacado, p.created_at,
         c.id AS categoria_id, c.nombre AS categoria, c.slug AS categoria_slug, c.icono AS categoria_icono,
         m.id AS marca_id, m.nombre AS marca
  FROM productos p
  JOIN categorias_producto c ON c.id = p.categoria_id
  LEFT JOIN marcas m ON m.id = p.marca_id`;

const ORDENES = {
  relevancia: 'p.destacado DESC, (p.stock > 0) DESC, p.nombre',
  precio_asc: 'p.precio ASC',
  precio_desc: 'p.precio DESC',
  nuevos: 'p.created_at DESC, p.id DESC',
  descuento: '(p.precio_anterior IS NOT NULL) DESC, (p.precio_anterior - p.precio) DESC',
  nombre: 'p.nombre ASC',
};
export const ORDENES_VALIDOS = Object.keys(ORDENES);

const mapear = (fila) => ({
  ...fila,
  destacado: Boolean(fila.destacado),
  especificaciones: (fila.especificaciones ?? '')
    .split('\n')
    .map((linea) => linea.split(':'))
    .filter((partes) => partes.length >= 2)
    .map(([clave, ...resto]) => ({ clave: clave.trim(), valor: resto.join(':').trim() })),
});

export const ProductoModel = {
  /**
   * @param {{ q?: string, categoria?: string, marcas?: number[], precioMin?: number, precioMax?: number,
   *           soloStock?: boolean, enOferta?: boolean, orden?: string, pagina: number, porPagina: number }} filtros
   */
  async buscar({ q, categoria, marcas = [], precioMin, precioMax, soloStock, enOferta, orden = 'relevancia', pagina, porPagina }) {
    const condiciones = ['p.activo = 1'];
    const valores = [];
    if (q) {
      condiciones.push('(p.nombre LIKE ? OR p.descripcion LIKE ? OR m.nombre LIKE ? OR p.sku LIKE ?)');
      valores.push(...Array(4).fill(`%${q}%`));
    }
    if (categoria) {
      condiciones.push('c.slug = ?');
      valores.push(categoria);
    }
    if (marcas.length) {
      condiciones.push(`p.marca_id IN (${marcas.map(() => '?').join(', ')})`);
      valores.push(...marcas);
    }
    if (precioMin !== undefined) {
      condiciones.push('p.precio >= ?');
      valores.push(precioMin);
    }
    if (precioMax !== undefined) {
      condiciones.push('p.precio <= ?');
      valores.push(precioMax);
    }
    if (soloStock) condiciones.push('p.stock > 0');
    if (enOferta) condiciones.push('p.precio_anterior IS NOT NULL AND p.precio_anterior > p.precio');

    const where = `WHERE ${condiciones.join(' AND ')}`;
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM productos p JOIN categorias_producto c ON c.id = p.categoria_id LEFT JOIN marcas m ON m.id = p.marca_id ${where}`,
      valores,
    );
    // porPagina y el desplazamiento son enteros ya validados: seguros de interpolar.
    const [filas] = await pool.execute(
      `${SELECT_PRODUCTO} ${where} ORDER BY ${ORDENES[orden] ?? ORDENES.relevancia} LIMIT ${porPagina} OFFSET ${(pagina - 1) * porPagina}`,
      valores,
    );
    return { total, pagina, paginas: Math.max(1, Math.ceil(total / porPagina)), data: filas.map(mapear) };
  },

  async porSlug(slug) {
    const [filas] = await pool.execute(`${SELECT_PRODUCTO} WHERE p.slug = ? AND p.activo = 1`, [slug]);
    return filas[0] ? mapear(filas[0]) : null;
  },

  async relacionados(producto, limite = 4) {
    const [filas] = await pool.execute(
      `${SELECT_PRODUCTO} WHERE p.activo = 1 AND p.categoria_id = ? AND p.id <> ? ORDER BY p.destacado DESC, p.stock > 0 DESC LIMIT ${limite}`,
      [producto.categoria_id, producto.id],
    );
    return filas.map(mapear);
  },

  async categorias() {
    const [filas] = await pool.query(
      `SELECT c.id, c.nombre, c.slug, c.descripcion, c.icono,
              (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id AND p.activo = 1) AS total
       FROM categorias_producto c ORDER BY c.orden, c.nombre`,
    );
    return filas;
  },

  async marcas() {
    const [filas] = await pool.query(
      `SELECT m.id, m.nombre, COUNT(p.id) AS total
       FROM marcas m JOIN productos p ON p.marca_id = m.id AND p.activo = 1
       GROUP BY m.id, m.nombre ORDER BY m.nombre`,
    );
    return filas;
  },

  async rangoPrecios() {
    const [[fila]] = await pool.query('SELECT MIN(precio) AS minimo, MAX(precio) AS maximo FROM productos WHERE activo = 1');
    return fila;
  },
};
