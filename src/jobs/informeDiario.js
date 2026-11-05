// Tarea programada: cada minuto revisa si es la hora configurada del informe diario y,
// si todavía no se envió hoy, lo envía. Revisar cada minuto (en lugar de programar una sola
// hora fija) permite cambiar la hora desde el panel sin reiniciar el servidor.
import cron from 'node-cron';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { configuracion } from '../services/configuracionService.js';
import { enviarInformeDiario, horaLocal } from '../services/informes/informeDiarioService.js';

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

export const iniciarTareasProgramadas = () => {
  cron.schedule('* * * * *', revisar, { timezone: env.zonaHoraria });
  console.log(`Tareas programadas activas (informe diario, zona ${env.zonaHoraria})`);
};
