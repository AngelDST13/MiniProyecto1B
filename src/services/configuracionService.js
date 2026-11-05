// Configuración editable desde el panel de administración (tabla configuracion).
import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

// Claves permitidas y cómo se validan. Cualquier otra clave se rechaza.
const ESQUEMA = {
  informe_diario_activo: { tipo: 'booleano', etiqueta: 'Enviar informe diario' },
  informe_diario_hora: { tipo: 'hora', etiqueta: 'Hora del informe diario' },
  informe_diario_destinatarios: { tipo: 'correos', etiqueta: 'Destinatarios del informe (vacío = todos los admin)' },
  notificar_inicio_sesion: { tipo: 'booleano', etiqueta: 'Avisar por correo de inicios de sesión desde dispositivos nuevos' },
  tienda_costo_envio: { tipo: 'dinero', etiqueta: 'Costo de envío a domicilio' },
  tienda_envio_gratis_desde: { tipo: 'dinero', etiqueta: 'Envío gratis desde' },
};

const validar = (clave, valor) => {
  const regla = ESQUEMA[clave];
  if (!regla) throw new AppError(`Configuración desconocida: ${clave}`, 400, 'VALIDATION_ERROR');
  const texto = String(valor ?? '').trim();
  switch (regla.tipo) {
    case 'booleano':
      if (!['0', '1', 'true', 'false'].includes(texto)) throw new AppError(`${regla.etiqueta}: debe ser verdadero o falso`, 400, 'VALIDATION_ERROR');
      return texto === '1' || texto === 'true' ? '1' : '0';
    case 'hora':
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)) throw new AppError(`${regla.etiqueta}: usa el formato HH:MM (24 h)`, 400, 'VALIDATION_ERROR');
      return texto;
    case 'dinero': {
      const numero = Number(texto);
      if (!Number.isFinite(numero) || numero < 0) throw new AppError(`${regla.etiqueta}: debe ser un número mayor o igual a 0`, 400, 'VALIDATION_ERROR');
      return numero.toFixed(2);
    }
    case 'correos': {
      const correos = texto.split(/[,;\s]+/).filter(Boolean);
      if (correos.some((c) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c))) throw new AppError(`${regla.etiqueta}: hay un correo con formato inválido`, 400, 'VALIDATION_ERROR');
      return correos.join(', ');
    }
    default:
      return texto;
  }
};

export const configuracion = {
  async todas() {
    const [rows] = await pool.query('SELECT clave, valor, updated_at FROM configuracion');
    const valores = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
    return Object.entries(ESQUEMA).map(([clave, { tipo, etiqueta }]) => ({ clave, tipo, etiqueta, valor: valores[clave] ?? '' }));
  },

  async obtener(clave, porDefecto = '') {
    const [rows] = await pool.execute('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return rows[0]?.valor ?? porDefecto;
  },

  async activo(clave) {
    return (await this.obtener(clave, '0')) === '1';
  },

  async guardar(cambios) {
    const validados = Object.entries(cambios ?? {}).map(([clave, valor]) => [clave, validar(clave, valor)]);
    for (const [clave, valor] of validados) {
      await pool.execute('INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [clave, valor]);
    }
    return this.todas();
  },

  // Valores internos (no editables desde el panel), por ejemplo la fecha del último informe enviado.
  async guardarInterno(clave, valor) {
    await pool.execute('INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [clave, valor]);
  },
};
