// Datos del dashboard de administración: indicadores con comparación contra el período anterior,
// series diarias para los gráficos y listas de actividad reciente.
import { pool } from '../../config/db.js';

const filas = async (sql, valores = []) => (await pool.execute(sql, valores))[0];
const valor = async (sql, valores = []) => Number(Object.values((await filas(sql, valores))[0])[0] ?? 0);

// Período actual [desde, hoy] y el anterior de la misma duración, para calcular la variación.
const rango = (dias) => ({
  actual: `BETWEEN DATE_SUB(CURDATE(), INTERVAL ${dias - 1} DAY) AND CURDATE()`,
  anterior: `BETWEEN DATE_SUB(CURDATE(), INTERVAL ${2 * dias - 1} DAY) AND DATE_SUB(CURDATE(), INTERVAL ${dias} DAY)`,
});

const conVariacion = async (consulta, dias) => {
  const { actual, anterior } = rango(dias);
  const [ahora, antes] = await Promise.all([valor(consulta(actual)), valor(consulta(anterior))]);
  return { valor: ahora, anterior: antes, variacion: antes ? (ahora - antes) / antes : null };
};

/** @param {number} dias  7, 30 o 90 */
export const datosDashboard = async (dias) => {
  const ventas = (r) => `SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE estado <> 'Cancelado' AND DATE(created_at) ${r}`;
  const pedidos = (r) => `SELECT COUNT(*) FROM pedidos WHERE estado <> 'Cancelado' AND DATE(created_at) ${r}`;
  const cobros = (r) => `SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE DATE(fecha_pago) ${r}`;
  const gastos = (r) => `SELECT COALESCE(SUM(monto), 0) FROM gastos WHERE fecha ${r}`;
  const ingresos = (r) => `SELECT COUNT(*) FROM ordenes_servicio WHERE DATE(fecha_ingreso) ${r}`;
  const clientes = (r) => `SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente' AND DATE(fecha_creacion) ${r}`;

  const [kVentas, kPedidos, kCobros, kGastos, kIngresos, kClientes] = await Promise.all(
    [ventas, pedidos, cobros, gastos, ingresos, clientes].map((c) => conVariacion(c, dias)),
  );

  // Serie diaria con todos los días del período (los días sin movimiento quedan en 0)
  const { actual } = rango(dias);
  const [serieVentas, serieCobros, serieGastos] = await Promise.all([
    filas(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS dia, SUM(total) AS total FROM pedidos WHERE estado <> 'Cancelado' AND DATE(created_at) ${actual} GROUP BY dia`),
    filas(`SELECT DATE_FORMAT(fecha_pago, '%Y-%m-%d') AS dia, SUM(monto) AS total FROM pagos WHERE DATE(fecha_pago) ${actual} GROUP BY dia`),
    filas(`SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS dia, SUM(monto) AS total FROM gastos WHERE fecha ${actual} GROUP BY dia`),
  ]);
  const [[{ hoy }]] = await pool.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy");
  const mapa = (lista) => new Map(lista.map((f) => [f.dia, Number(f.total)]));
  const [mV, mC, mG] = [mapa(serieVentas), mapa(serieCobros), mapa(serieGastos)];
  const serie = Array.from({ length: dias }, (_, i) => {
    const fecha = new Date(`${hoy}T12:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() - (dias - 1 - i));
    const dia = fecha.toISOString().slice(0, 10);
    return { dia, ventas: mV.get(dia) ?? 0, cobros: mC.get(dia) ?? 0, gastos: mG.get(dia) ?? 0 };
  });

  const [ordenesPorEstado, pedidosPorEstado, topProductos, ultimosPedidos, accesos, stockBajo, ventasPorCategoria] = await Promise.all([
    filas('SELECT estado, COUNT(*) AS total FROM ordenes_servicio GROUP BY estado'),
    filas('SELECT estado, COUNT(*) AS total FROM pedidos GROUP BY estado'),
    filas(
      `SELECT pi.nombre_producto AS nombre, SUM(pi.cantidad) AS unidades, SUM(pi.cantidad * pi.precio_unitario) AS total
       FROM pedido_items pi JOIN pedidos pe ON pe.id = pi.pedido_id
       WHERE pe.estado <> 'Cancelado' AND DATE(pe.created_at) ${actual}
       GROUP BY pi.nombre_producto ORDER BY total DESC LIMIT 5`,
    ),
    filas(
      `SELECT pe.id, CONCAT('PED-', LPAD(pe.id, 5, '0')) AS codigo, u.nombre AS cliente, pe.total, pe.estado, pe.created_at
       FROM pedidos pe JOIN usuarios u ON u.id = pe.usuario_id ORDER BY pe.created_at DESC LIMIT 6`,
    ),
    filas(
      `SELECT i.correo, i.exito, i.motivo, i.ip, i.fecha, u.nombre, u.rol
       FROM inicios_sesion i LEFT JOIN usuarios u ON u.id = i.usuario_id ORDER BY i.fecha DESC LIMIT 8`,
    ),
    filas('SELECT nombre, slug, stock FROM productos WHERE activo = 1 AND stock <= 3 ORDER BY stock, nombre LIMIT 8'),
    filas(
      `SELECT c.nombre AS categoria, SUM(pi.cantidad * pi.precio_unitario) AS total
       FROM pedido_items pi JOIN pedidos pe ON pe.id = pi.pedido_id JOIN productos p ON p.id = pi.producto_id
       JOIN categorias_producto c ON c.id = p.categoria_id
       WHERE pe.estado <> 'Cancelado' AND DATE(pe.created_at) ${actual}
       GROUP BY c.nombre ORDER BY total DESC`,
    ),
  ]);

  return {
    dias,
    kpis: {
      ventas: kVentas,
      pedidos: kPedidos,
      ticketPromedio: { valor: kPedidos.valor ? kVentas.valor / kPedidos.valor : 0 },
      cobrosTaller: kCobros,
      gastos: kGastos,
      equiposIngresados: kIngresos,
      clientesNuevos: kClientes,
      ordenesActivas: { valor: await valor("SELECT COUNT(*) FROM ordenes_servicio WHERE estado <> 'Entregado'") },
      solicitudesPendientes: { valor: await valor("SELECT COUNT(*) FROM solicitudes_informe WHERE estado = 'Pendiente'") },
      pedidosPendientes: { valor: await valor("SELECT COUNT(*) FROM pedidos WHERE estado = 'Pendiente'") },
      loginsFallidos: await conVariacion((r) => `SELECT COUNT(*) FROM inicios_sesion WHERE exito = 0 AND DATE(fecha) ${r}`, dias),
    },
    serie,
    ordenesPorEstado,
    pedidosPorEstado,
    topProductos,
    ventasPorCategoria,
    ultimosPedidos,
    accesos,
    stockBajo,
  };
};
