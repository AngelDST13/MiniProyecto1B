// Reglas automáticas del negocio. Cada una se puede activar o desactivar en Gestión → Automatización
// y deja registrado cuándo corrió por última vez y qué hizo.
import { pool, withTransaction } from '../config/db.js';
import { configuracion } from '../services/configuracionService.js';
import { enviarCorreo } from '../services/correo/correoService.js';
import { correoAlertaStock, correoPedidoCanceladoAuto, correoRecordatorioCita } from '../services/correo/plantillas.js';
import { UsuarioModel } from '../models/usuarioModel.js';

const registrar = (clave, resultado) =>
  configuracion.guardarInterno(`ultima_${clave}`, JSON.stringify({ fecha: new Date().toISOString(), resultado }));

/** Garantías vigentes cuya fecha de fin ya pasó → "Vencida". */
export const vencerGarantias = async () => {
  if (!(await configuracion.activo('auto_vencer_garantias'))) return null;
  const [r] = await pool.execute("UPDATE garantias SET estado = 'Vencida' WHERE estado = 'Vigente' AND fecha_fin < CURDATE()");
  await registrar('auto_vencer_garantias', `${r.affectedRows} garantía(s) marcadas como vencidas`);
  return r.affectedRows;
};

/** Pedidos "Pendiente" más viejos que N horas → "Cancelado", el stock regresa y se avisa al cliente. */
export const cancelarPedidosVencidos = async () => {
  const horas = Number(await configuracion.obtener('auto_cancelar_pedidos_horas', '0'));
  if (!horas) return null;
  const [vencidos] = await pool.execute(
    `SELECT pe.id, u.nombre, u.correo FROM pedidos pe JOIN usuarios u ON u.id = pe.usuario_id
     WHERE pe.estado = 'Pendiente' AND pe.created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
    [horas],
  );
  for (const pedido of vencidos) {
    await withTransaction(async (conn) => {
      await conn.execute('UPDATE productos p JOIN pedido_items pi ON pi.producto_id = p.id SET p.stock = p.stock + pi.cantidad WHERE pi.pedido_id = ?', [pedido.id]);
      await conn.execute("UPDATE pedidos SET estado = 'Cancelado', notas = CONCAT(COALESCE(notas, ''), ' [Cancelado automáticamente por falta de pago]') WHERE id = ?", [pedido.id]);
    });
    enviarCorreo({ para: pedido.correo, tipo: 'pedido_cancelado_auto', ...correoPedidoCanceladoAuto({ nombre: pedido.nombre, pedido, horas }) });
  }
  await registrar('auto_cancelar_pedidos_horas', `${vencidos.length} pedido(s) cancelados por falta de pago`);
  return vencidos.length;
};

/** Correo a cada cliente con cita programada para mañana (una vez al día). */
export const recordarCitas = async () => {
  if (!(await configuracion.activo('auto_recordatorio_citas'))) return null;
  const [citas] = await pool.execute(
    `SELECT ci.fecha_hora, ci.motivo, c.nombre, c.email, s.nombre AS sucursal
     FROM citas ci JOIN clientes c ON c.id = ci.cliente_id LEFT JOIN sucursales s ON s.id = ci.sucursal_id
     WHERE ci.estado = 'Programada' AND DATE(ci.fecha_hora) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)`,
  );
  const empresa = await configuracion.empresa();
  for (const cita of citas) {
    enviarCorreo({ para: cita.email, tipo: 'recordatorio_cita', ...correoRecordatorioCita({ nombre: cita.nombre, cita, empresa }) });
  }
  await registrar('auto_recordatorio_citas', `${citas.length} recordatorio(s) enviados`);
  return citas.length;
};

/** Después de una venta: avisa a los administradores si algún producto quedó agotado o con 2 o menos. */
export const alertarStock = async (productoIds) => {
  try {
    if (!productoIds.length || !(await configuracion.activo('auto_alerta_stock'))) return;
    const [productos] = await pool.execute(
      `SELECT nombre, stock FROM productos WHERE id IN (${productoIds.map(() => '?').join(', ')}) AND stock <= 2`,
      productoIds,
    );
    if (!productos.length) return;
    const admins = (await UsuarioModel.admins()).map((a) => a.correo);
    if (admins.length) await enviarCorreo({ para: admins, tipo: 'alerta_stock', ...correoAlertaStock({ productos }) });
    await registrar('auto_alerta_stock', `Aviso de ${productos.length} producto(s) con stock crítico`);
  } catch (error) {
    console.error('[alerta de stock]', error.message);
  }
};

/** Estado de cada regla para el panel. */
export const estadoAutomatizaciones = async () => {
  const [filas] = await pool.query("SELECT clave, valor FROM configuracion WHERE clave LIKE 'ultima\\_%'");
  return Object.fromEntries(filas.map((f) => {
    try {
      return [f.clave.replace('ultima_', ''), JSON.parse(f.valor)];
    } catch {
      return [f.clave.replace('ultima_', ''), null];
    }
  }));
};

/** Ejecuta las reglas periódicas (se llama cada hora y al iniciar). */
export const ejecutarReglasPeriodicas = async () => {
  const resultados = {};
  for (const [nombre, regla] of Object.entries({ vencerGarantias, cancelarPedidosVencidos })) {
    try {
      resultados[nombre] = await regla();
    } catch (error) {
      console.error(`[automatización ${nombre}]`, error.message);
    }
  }
  return resultados;
};
