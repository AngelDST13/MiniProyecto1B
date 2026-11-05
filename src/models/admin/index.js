// Registro de las entidades del módulo de Administración.
// Cada archivo de esta carpeta describe una tabla: sus campos, reglas y relaciones.
// El motor CRUD (crudModel, crudValidator, crudController, crudRoutes) genera
// a partir de esa descripción los 5 endpoints REST de cada entidad.
import sucursales from './sucursales.js';
import especialidades from './especialidades.js';
import tecnicos from './tecnicos.js';
import usuarios from './usuarios.js';
import marcas from './marcas.js';
import servicios from './servicios.js';
import metodosPago from './metodosPago.js';
import categoriasGasto from './categoriasGasto.js';
import proveedores from './proveedores.js';
import compras from './compras.js';
import herramientas from './herramientas.js';
import citas from './citas.js';
import cotizaciones from './cotizaciones.js';
import seguimientos from './seguimientos.js';
import garantias from './garantias.js';
import pagos from './pagos.js';
import gastos from './gastos.js';

export const ENTIDADES = [
  citas, cotizaciones, seguimientos, garantias,
  proveedores, compras, herramientas,
  tecnicos, especialidades, sucursales,
  pagos, metodosPago, gastos, categoriasGasto,
  servicios, marcas,
  usuarios,
];

// Módulos con página propia (CRUD a medida del Día 1 y 2). Se listan en el panel de
// Administración junto con los genéricos: 3 + 17 = 20 CRUDs.
export const MODULOS_PERSONALIZADOS = [
  {
    clave: 'ordenes', tabla: 'ordenes_servicio', plural: 'Órdenes de servicio', singular: 'Orden de servicio',
    descripcion: 'Equipos ingresados y su flujo de reparación.', grupo: 'Atención y servicio',
    icono: 'ClipboardList', rutaFrontend: '/ordenes',
  },
  {
    clave: 'clientes', tabla: 'clientes', plural: 'Clientes', singular: 'Cliente',
    descripcion: 'Directorio de personas y empresas.', grupo: 'Atención y servicio',
    icono: 'Users', rutaFrontend: '/clientes',
  },
  {
    clave: 'componentes', tabla: 'componentes_repuesto', plural: 'Repuestos', singular: 'Repuesto',
    descripcion: 'Inventario de componentes con stock.', grupo: 'Compras e inventario',
    icono: 'Cpu', rutaFrontend: '/repuestos',
  },
];

// Tablas que no usan el motor genérico pero sí pueden ser referenciadas (llaves foráneas).
const REFERENCIAS_EXTERNAS = {
  clientes: {
    tabla: 'clientes',
    etiqueta: (a) => `CONCAT(${a}.nombre, ' · CI ', ${a}.cedula)`,
    orden: 't.nombre',
  },
  ordenes: {
    tabla: 'ordenes_servicio',
    etiqueta: (a) => `CONCAT('OS-', LPAD(${a}.id, 4, '0'), ' · ', ${a}.marca_modelo)`,
    orden: 't.id DESC',
  },
};

const POR_CLAVE = Object.fromEntries(ENTIDADES.map((entidad) => [entidad.clave, entidad]));

export const buscarEntidad = (clave) => POR_CLAVE[clave] ?? null;

// Devuelve { tabla, etiqueta, orden } de cualquier entidad que se pueda referenciar.
export const resolverReferencia = (clave) => {
  if (REFERENCIAS_EXTERNAS[clave]) return REFERENCIAS_EXTERNAS[clave];
  const entidad = POR_CLAVE[clave];
  if (!entidad) return null;
  return { tabla: entidad.tabla, etiqueta: entidad.etiqueta, orden: entidad.orden };
};

// Qué tablas apuntan a una entidad (para responder 409 con un mensaje claro al eliminar).
export const dependientesDe = (clave) =>
  ENTIDADES.flatMap((entidad) =>
    entidad.campos
      .filter((campo) => campo.tipo === 'ref' && campo.ref === clave)
      .map((campo) => ({ tabla: entidad.tabla, columna: campo.nombre, plural: entidad.plural })),
  );

// Verificación al arrancar: una referencia mal escrita debe fallar de inmediato, no en producción.
for (const entidad of ENTIDADES) {
  for (const campo of entidad.campos) {
    if (campo.tipo === 'ref' && !resolverReferencia(campo.ref)) {
      throw new Error(`[admin] ${entidad.clave}.${campo.nombre} referencia una entidad desconocida: "${campo.ref}"`);
    }
  }
}
