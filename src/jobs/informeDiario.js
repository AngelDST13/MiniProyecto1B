// Tarea programada: cada minuto revisa si es la hora configurada del informe diario y,
// si todavía no se envió hoy, lo envía. Revisar cada minuto (en lugar de programar una sola
// hora fija) permite cambiar la hora desde el panel sin reiniciar el servidor.
import cron from 'node-cron';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { configuracion } from '../services/configuracionService.js';
import { enviarInformeDiario, horaLocal } from '../services/informes/informeDiarioService.js';
import { ejecutarReglasPeriodicas, recordarCitas } from './automatizaciones.js';

let ejecutando = false;

const revisar = async () => {
  if (ejecutando) return;
  ejecutando = true;
  try {
    if (!(await configuracion.activo('informe_diario_activo'))) return;
    const hora = await configuracion.obtener('informe_diario_hora', '19:00');
    if (horaLocal() !== hora) return;

    const [[{ hoy }]] = await pool.query('SELECT CURDATE() AS hoy');
    const hoyTexto = hoy instanceof Date ? hoy.toISOString().slice(0, 10) : String(hoy);
    if ((await configuracion.obtener('informe_diario_ultimo_envio')) === hoyTexto) return;

    const { estado, para } = await enviarInformeDiario();
    await configuracion.guardarInterno('informe_diario_ultimo_envio', hoyTexto);
    console.log(`[informe diario] ${estado} → ${para.join(', ') || 'sin destinatarios'}`);
  } catch (error) {
    console.error('[informe diario] error:', error.message);
  } finally {
    ejecutando = false;
  }
};

// Recordatorio de citas: una vez al día a las 08:00 (hora del taller)
const recordarUnaVez = async () => {
  try {
    const [[{ hoy }]] = await pool.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy");
    if ((await configuracion.obtener('recordatorio_citas_ultimo_envio')) === hoy) return;
    await recordarCitas();
    await configuracion.guardarInterno('recordatorio_citas_ultimo_envio', hoy);
  } catch (error) {
    console.error('[recordatorio de citas] error:', error.message);
  }
};

export const iniciarTareasProgramadas = () => {
  cron.schedule('* * * * *', revisar, { timezone: env.zonaHoraria });
  cron.schedule('5 * * * *', ejecutarReglasPeriodicas, { timezone: env.zonaHoraria }); // cada hora
  cron.schedule('0 8 * * *', recordarUnaVez, { timezone: env.zonaHoraria });
  setTimeout(ejecutarReglasPeriodicas, 5000); // también al iniciar
  console.log(`Tareas programadas activas (informe diario, reglas automáticas, zona ${env.zonaHoraria})`);
};
