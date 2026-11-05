// Herramientas del agente de IA: consultas de SOLO LECTURA a la base de datos.
// El agente no puede crear, modificar ni eliminar nada. Todas las consultas van parametrizadas
// y cada entrada se valida aquí, aunque venga del modelo.
import { pool } from '../../config/db.js';
import { ESTADOS } from '../../validators/ordenValidator.js';
import { CATEGORIAS } from '../../validators/componenteValidator.js';
import { obtenerDetalleOrden } from '../informes/detalleOrden.js';

const STOCK_BAJO = 3;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ESTADOS_CITA = ['Programada', 'Atendida', 'Cancelada'];

// ---------- Validación de entradas ----------
const texto = (valor, max = 100) => (typeof valor === 'string' ? valor.trim().slice(0, max) : '');
const entero = (valor, { min = 1, max = 50, porDefecto }) => {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : porDefecto;
};
const fecha = (valor) => (typeof valor === 'string' && REGEX_FECHA.test(valor) ? valor : null);
const opcion = (valor, opciones) => (opciones.includes(valor) ? valor : null);

const hoy = () => new Date().toISOString().slice(0, 10);
const inicioDeMes = () => `${hoy().slice(0, 8)}01`;

// ---------- Definiciones que ve el modelo ----------
export const DEFINICIONES = [
  {
    name: 'resumen_taller',
    description:
      'Resumen general del taller en este momento: cantidad de órdenes por estado, número de clientes y repuestos con stock bajo. Úsala para preguntas generales como "¿cómo va el taller?".',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'buscar_ordenes',
    description:
      'Lista órdenes de servicio con su cliente, equipo, estado, fecha de ingreso y total en repuestos. Filtra por estado y/o por un texto que busca en el equipo, el número de serie y el nombre o cédula del cliente.',
    input_schema: {
      type: 'object',
      properties: {
        estado: { type: 'string', enum: ESTADOS, description: 'Estado de la orden' },
        texto: { type: 'string', description: 'Texto a buscar (equipo, serie, cliente o cédula)' },
        limite: { type: 'integer', minimum: 1, maximum: 50, description: 'Máximo de resultados (por defecto 20)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'detalle_orden',
    description:
      'Detalle completo de una orden: cliente, equipo, diagnóstico, repuestos usados, pagos, cotizaciones, garantías y bitácora de seguimiento. El código OS-0007 corresponde al id 7.',
    input_schema: {
      type: 'object',
      properties: { orden_id: { type: 'integer', minimum: 1, description: 'Id numérico de la orden' } },
      required: ['orden_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'buscar_clientes',
    description: 'Busca clientes por nombre, cédula, email o teléfono. Incluye cuántas órdenes tiene cada uno.',
    input_schema: {
      type: 'object',
      properties: { texto: { type: 'string', description: 'Texto a buscar. Vacío lista los más recientes.' } },
      additionalProperties: false,
    },
  },
  {
    name: 'consultar_inventario',
    description: `Consulta los repuestos del inventario con precio y stock. Se considera stock bajo ${STOCK_BAJO} unidades o menos.`,
    input_schema: {
      type: 'object',
      properties: {
        categoria: { type: 'string', enum: CATEGORIAS },
        solo_stock_bajo: { type: 'boolean', description: 'Solo repuestos con stock bajo o agotados' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'resumen_finanzas',
    description:
      'Totales de dinero en un rango de fechas: pagos recibidos (por método de pago), gastos (por categoría) y compras a proveedores. Por defecto, el mes actual.',
    input_schema: {
      type: 'object',
      properties: {
        desde: { type: 'string', description: 'Fecha inicial AAAA-MM-DD' },
        hasta: { type: 'string', description: 'Fecha final AAAA-MM-DD (incluida)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'agenda_citas',
    description: 'Citas agendadas con clientes en un rango de fechas. Por defecto, desde hoy en adelante.',
    input_schema: {
      type: 'object',
      properties: {
        desde: { type: 'string', description: 'Fecha inicial AAAA-MM-DD' },
        hasta: { type: 'string', description: 'Fecha final AAAA-MM-DD (incluida)' },
        estado: { type: 'string', enum: ESTADOS_CITA },
      },
      additionalProperties: false,
    },
  },
];

// ---------- Implementaciones ----------
const consultar = async (sql, valores = []) => (await pool.execute(sql, valores))[0];

const IMPLEMENTACIONES = {
  async resumen_taller() {
    const porEstado = await consultar('SELECT estado, COUNT(*) AS total FROM ordenes_servicio GROUP BY estado');
    const [{ clientes }] = await consultar('SELECT COUNT(*) AS clientes FROM clientes');
    const stockBajo = await consultar(
      'SELECT nombre, categoria, stock FROM componentes_repuesto WHERE stock <= ? ORDER BY stock',
      [STOCK_BAJO],
    );
    return {
      ordenes_por_estado: Object.fromEntries(ESTADOS.map((e) => [e, porEstado.find((f) => f.estado === e)?.total ?? 0])),
      total_clientes: clientes,
      repuestos_stock_bajo: stockBajo,
    };
  },

  async buscar_ordenes(entrada) {
    const condiciones = [];
    const valores = [];
    const estado = opcion(entrada.estado, ESTADOS);
    if (estado) {
      condiciones.push('o.estado = ?');
      valores.push(estado);
    }
    const busqueda = texto(entrada.texto);
    if (busqueda) {
      condiciones.push('(o.marca_modelo LIKE ? OR o.serial LIKE ? OR c.nombre LIKE ? OR c.cedula LIKE ?)');
      valores.push(...Array(4).fill(`%${busqueda}%`));
    }
    const limite = entero(entrada.limite, { porDefecto: 20 }); // entero validado: seguro de interpolar
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    return consultar(
      `SELECT CONCAT('OS-', LPAD(o.id, 4, '0')) AS codigo, o.id, o.tipo_equipo, o.marca_modelo, o.serial,
              o.estado, o.fecha_ingreso, c.nombre AS cliente, c.telefono AS telefono_cliente,
              COALESCE((SELECT SUM(oc.cantidad * oc.precio_unitario) FROM orden_componentes oc WHERE oc.orden_id = o.id), 0) AS total_repuestos
       FROM ordenes_servicio o JOIN clientes c ON c.id = o.cliente_id
       ${where} ORDER BY o.fecha_ingreso DESC LIMIT ${limite}`,
      valores,
    );
  },

  async detalle_orden(entrada) {
    const id = entero(entrada.orden_id, { max: 1e9 });
    if (!id) throw new Error('orden_id debe ser un entero positivo');
    const detalle = await obtenerDetalleOrden(id);
    if (!detalle) return { error: `No existe la orden OS-${String(id).padStart(4, '0')}` };

    const totalRepuestos = detalle.repuestos.reduce((suma, r) => suma + Number(r.subtotal), 0);
    const totalPagado = detalle.pagos.reduce((suma, p) => suma + Number(p.monto), 0);
    return { ...detalle, total_repuestos: totalRepuestos, total_pagado: totalPagado };
  },

  async buscar_clientes(entrada) {
    const busqueda = texto(entrada.texto);
    const filtro = busqueda ? 'WHERE c.nombre LIKE ? OR c.cedula LIKE ? OR c.email LIKE ? OR c.telefono LIKE ?' : '';
    return consultar(
      `SELECT c.id, c.nombre, c.cedula, c.telefono, c.email,
              (SELECT COUNT(*) FROM ordenes_servicio o WHERE o.cliente_id = c.id) AS total_ordenes
       FROM clientes c ${filtro} ORDER BY c.id DESC LIMIT 25`,
      busqueda ? Array(4).fill(`%${busqueda}%`) : [],
    );
  },

  async consultar_inventario(entrada) {
    const condiciones = [];
    const valores = [];
    const categoria = opcion(entrada.categoria, CATEGORIAS);
    if (categoria) {
      condiciones.push('categoria = ?');
      valores.push(categoria);
    }
    if (entrada.solo_stock_bajo === true) {
      condiciones.push('stock <= ?');
      valores.push(STOCK_BAJO);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    return consultar(
      `SELECT nombre, categoria, precio_unitario, stock FROM componentes_repuesto ${where} ORDER BY categoria, nombre`,
      valores,
    );
  },

  async resumen_finanzas(entrada) {
    const desde = fecha(entrada.desde) ?? inicioDeMes();
    const hasta = fecha(entrada.hasta) ?? hoy();
    const [pagos, gastos, compras] = await Promise.all([
      consultar(
        `SELECT mp.nombre AS metodo, COUNT(*) AS cantidad, SUM(p.monto) AS total
         FROM pagos p JOIN metodos_pago mp ON mp.id = p.metodo_pago_id
         WHERE DATE(p.fecha_pago) BETWEEN ? AND ? GROUP BY mp.nombre`,
        [desde, hasta],
      ),
      consultar(
        `SELECT cg.nombre AS categoria, COUNT(*) AS cantidad, SUM(g.monto) AS total
         FROM gastos g JOIN categorias_gasto cg ON cg.id = g.categoria_gasto_id
         WHERE g.fecha BETWEEN ? AND ? GROUP BY cg.nombre`,
        [desde, hasta],
      ),
      consultar(
        `SELECT estado, COUNT(*) AS cantidad, SUM(total) AS total FROM compras
         WHERE fecha_compra BETWEEN ? AND ? GROUP BY estado`,
        [desde, hasta],
      ),
    ]);
    const suma = (filas) => filas.reduce((total, f) => total + Number(f.total), 0);
    return {
      periodo: { desde, hasta },
      ingresos_por_pagos: { total: suma(pagos), por_metodo: pagos },
      gastos: { total: suma(gastos), por_categoria: gastos },
      compras_a_proveedores: { total: suma(compras.filter((c) => c.estado !== 'Anulada')), por_estado: compras },
    };
  },

  async agenda_citas(entrada) {
    const desde = fecha(entrada.desde) ?? hoy();
    const hasta = fecha(entrada.hasta) ?? '9999-12-31';
    const estado = opcion(entrada.estado, ESTADOS_CITA);
    return consultar(
      `SELECT ci.fecha_hora, ci.motivo, ci.estado, c.nombre AS cliente, c.telefono, s.nombre AS sucursal
       FROM citas ci JOIN clientes c ON c.id = ci.cliente_id LEFT JOIN sucursales s ON s.id = ci.sucursal_id
       WHERE DATE(ci.fecha_hora) BETWEEN ? AND ? ${estado ? 'AND ci.estado = ?' : ''}
       ORDER BY ci.fecha_hora LIMIT 50`,
      estado ? [desde, hasta, estado] : [desde, hasta],
    );
  },
};

/**
 * Ejecuta una herramienta y devuelve el resultado como texto JSON para el modelo.
 * @param {string} nombre
 * @param {unknown} entrada  Argumentos que propuso el modelo (se validan en cada implementación)
 */
export const ejecutarHerramienta = async (nombre, entrada) => {
  const implementacion = IMPLEMENTACIONES[nombre];
  if (!implementacion) throw new Error(`Herramienta desconocida: ${nombre}`);
  const argumentos = entrada && typeof entrada === 'object' ? entrada : {};
  return JSON.stringify(await implementacion(argumentos));
};
