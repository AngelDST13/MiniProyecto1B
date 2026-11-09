// Informe diario automático para los administradores.
import { pool } from '../../config/db.js';
import { env } from '../../config/env.js';
import { UsuarioModel } from '../../models/usuarioModel.js';
import { configuracion } from '../configuracionService.js';
import { enviarCorreo } from '../correo/correoService.js';
import { correoInformeDiario } from '../correo/plantillas.js';
import { iaDisponible, resumirDia } from '../agente/iaService.js';

const ESTADOS = ['Recibido', 'En Diagnóstico', 'Reparado', 'Entregado'];
const uno = async (sql, valores = []) => Object.values((await pool.execute(sql, valores))[0][0])[0];

/** Recopila las cifras del día (fecha YYYY-MM-DD; por defecto hoy) */
export const recopilarDatosDelDia = async (fecha) => {
  const dia = fecha ?? (await uno('SELECT CURDATE()'));
  const [porEstado] = await pool.execute("SELECT estado, COUNT(*) AS total FROM ordenes_servicio WHERE estado <> 'Entregado' GROUP BY estado");
  const [stockBajo] = await pool.query(
    `(SELECT nombre, stock FROM componentes_repuesto WHERE stock <= 3)
     UNION ALL (SELECT nombre, stock FROM productos WHERE activo = 1 AND stock <= 3) ORDER BY stock LIMIT 15`,
  );
  return {
    fecha: dia,
    ordenesIngresadas: Number(await uno('SELECT COUNT(*) FROM ordenes_servicio WHERE DATE(fecha_ingreso) = ?', [dia])),
    ordenesEntregadas: Number(await uno("SELECT COUNT(*) FROM ordenes_servicio WHERE estado = 'Entregado' AND DATE(updated_at) = ?", [dia])),
    ordenesPorEstado: Object.fromEntries(ESTADOS.filter((e) => e !== 'Entregado').map((e) => [e, porEstado.find((f) => f.estado === e)?.total ?? 0])),
    pagosTaller: Number(await uno('SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE DATE(fecha_pago) = ?', [dia])),
    ventasTienda: Number(await uno("SELECT COALESCE(SUM(total), 0) FROM pedidos WHERE estado <> 'Cancelado' AND DATE(created_at) = ?", [dia])),
    pedidosHoy: Number(await uno("SELECT COUNT(*) FROM pedidos WHERE estado <> 'Cancelado' AND DATE(created_at) = ?", [dia])),
    gastos: Number(await uno('SELECT COALESCE(SUM(monto), 0) FROM gastos WHERE fecha = ?', [dia])),
    pedidosPendientes: Number(await uno("SELECT COUNT(*) FROM pedidos WHERE estado = 'Pendiente'")),
    solicitudesPendientes: Number(await uno("SELECT COUNT(*) FROM solicitudes_informe WHERE estado = 'Pendiente'")),
    citasManana: Number(await uno("SELECT COUNT(*) FROM citas WHERE estado = 'Programada' AND DATE(fecha_hora) = DATE_ADD(?, INTERVAL 1 DAY)", [dia])),
    clientesNuevos: Number(await uno("SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente' AND DATE(fecha_creacion) = ?", [dia])),
    loginsFallidos: Number(await uno('SELECT COUNT(*) FROM inicios_sesion WHERE exito = 0 AND DATE(fecha) = ?', [dia])),
    stockBajo,
  };
};

const fechaLegible = (dia) =>
  new Intl.DateTimeFormat('es-CR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${dia}T12:00:00Z`));

// Párrafo de IA opcional: si falla (sin saldo, sin conexión) el informe sale igual, sin esa sección.
const analisisDelDia = async (datos) => {
  if (!iaDisponible() || !(await configuracion.activo('informe_diario_ia'))) return null;
  try {
    return await resumirDia(datos);
  } catch (error) {
    console.warn('[informe diario] sin análisis de IA:', error.message);
    return null;
  }
};

export const generarInformeDiario = async (fecha, { conIA = true } = {}) => {
  const datos = await recopilarDatosDelDia(fecha);
  const analisisIA = conIA ? await analisisDelDia(datos) : null;
  return { datos, analisisIA, ...correoInformeDiario({ fecha: fechaLegible(datos.fecha), datos, analisisIA }) };
};

const destinatarios = async () => {
  const configurados = await configuracion.obtener('informe_diario_destinatarios');
  if (configurados.trim()) return configurados.split(',').map((c) => c.trim()).filter(Boolean);
  return (await UsuarioModel.admins()).map((a) => a.correo);
};

export const enviarInformeDiario = async (fecha) => {
  const para = await destinatarios();
  if (!para.length) return { estado: 'Sin destinatarios', para };
  const { asunto, html } = await generarInformeDiario(fecha);
  const estado = await enviarCorreo({ para, asunto, html, tipo: 'informe_diario' });
  return { estado, para };
};

// Hora actual "HH:MM" en la zona horaria del taller
export const horaLocal = () =>
  new Intl.DateTimeFormat('es-CR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: env.zonaHoraria }).format(new Date());
