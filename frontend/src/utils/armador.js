// Reglas de compatibilidad del armador de PC.
// Cada producto trae: pc_socket, pc_memoria (DDR4/DDR5), pc_formato (ATX/mATX/ITX) y pc_consumo_w
// (consumo en CPU y GPU; capacidad en fuentes). Los disipadores listan sus sockets separados por coma.

export const PASOS = [
  { clave: 'cpu', titulo: 'Procesador', corto: 'CPU', requerido: true },
  { clave: 'motherboard', titulo: 'Tarjeta madre', corto: 'Placa', requerido: true },
  { clave: 'ram', titulo: 'Memoria RAM', corto: 'RAM', requerido: true },
  { clave: 'gpu', titulo: 'Tarjeta de video', corto: 'GPU', requerido: false, nota: 'Opcional si tu procesador trae gráficos integrados.' },
  { clave: 'almacenamiento', titulo: 'Almacenamiento', corto: 'Disco', requerido: true },
  { clave: 'fuente', titulo: 'Fuente de poder', corto: 'Fuente', requerido: true },
  { clave: 'gabinete', titulo: 'Gabinete', corto: 'Case', requerido: true },
  { clave: 'enfriamiento', titulo: 'Enfriamiento', corto: 'Cooler', requerido: false, nota: 'Opcional: muchos procesadores incluyen disipador.' },
];

const TAMANO_FORMATO = { ITX: 1, mATX: 2, ATX: 3 };
const BASE_SISTEMA_W = 75; // placa, RAM, discos y ventiladores
const MARGEN_FUENTE = 1.3;

export const consumoEstimado = (sel) => BASE_SISTEMA_W + (sel.cpu?.pc_consumo_w ?? 0) + (sel.gpu?.pc_consumo_w ?? 0);

// Potencia mínima recomendada: consumo × 1,3 redondeado a los 50 W siguientes
export const fuenteRecomendada = (sel) => Math.ceil((consumoEstimado(sel) * MARGEN_FUENTE) / 50) * 50;

const socketsDe = (producto) => String(producto?.pc_socket ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * ¿Por qué este producto no combina con lo ya elegido? null si es compatible.
 * @param {string} tipo  paso del armador
 * @param {object} producto
 * @param {Record<string, object>} sel  selección actual (el propio paso se ignora)
 */
export const motivoIncompatible = (tipo, producto, sel) => {
  const { cpu, motherboard: placa, ram, gabinete, enfriamiento: cooler } = sel;
  switch (tipo) {
    case 'cpu':
      if (placa && placa.pc_socket !== producto.pc_socket) return `Socket ${producto.pc_socket}: tu tarjeta madre es ${placa.pc_socket}`;
      if (cooler && !socketsDe(cooler).includes(producto.pc_socket)) return `Tu disipador no admite ${producto.pc_socket}`;
      if (producto.pc_memoria && ram && ram.pc_memoria !== producto.pc_memoria) return `Solo usa ${producto.pc_memoria}`;
      return null;
    case 'motherboard':
      if (cpu && cpu.pc_socket !== producto.pc_socket) return `Socket ${producto.pc_socket}: tu procesador es ${cpu.pc_socket}`;
      if (cpu?.pc_memoria && producto.pc_memoria !== cpu.pc_memoria) return `Usa ${producto.pc_memoria}; tu procesador requiere ${cpu.pc_memoria}`;
      if (ram && ram.pc_memoria !== producto.pc_memoria) return `Usa ${producto.pc_memoria}; tu memoria es ${ram.pc_memoria}`;
      if (gabinete && TAMANO_FORMATO[producto.pc_formato] > TAMANO_FORMATO[gabinete.pc_formato]) return `Formato ${producto.pc_formato}: no cabe en un gabinete ${gabinete.pc_formato}`;
      return null;
    case 'ram':
      if (placa && placa.pc_memoria !== producto.pc_memoria) return `Tu tarjeta madre usa ${placa.pc_memoria}`;
      if (!placa && cpu?.pc_memoria && cpu.pc_memoria !== producto.pc_memoria) return `Tu procesador usa ${cpu.pc_memoria}`;
      return null;
    case 'fuente': {
      const minimo = fuenteRecomendada(sel);
      return producto.pc_consumo_w < minimo ? `Insuficiente: tu equipo necesita ${minimo} W o más` : null;
    }
    case 'gpu': {
      const fuente = sel.fuente;
      if (!fuente) return null;
      const minimo = fuenteRecomendada({ ...sel, gpu: producto });
      return fuente.pc_consumo_w < minimo ? `Tu fuente de ${fuente.pc_consumo_w} W se queda corta (necesitas ${minimo} W)` : null;
    }
    case 'gabinete':
      if (placa && TAMANO_FORMATO[placa.pc_formato] > TAMANO_FORMATO[producto.pc_formato]) return `Admite hasta ${producto.pc_formato}; tu placa es ${placa.pc_formato}`;
      return null;
    case 'enfriamiento':
      if (cpu && !socketsDe(producto).includes(cpu.pc_socket)) return `No es compatible con el socket ${cpu.pc_socket}`;
      return null;
    default:
      return null;
  }
};

/** Problemas de la selección completa (por ejemplo, si se cambió un paso anterior). */
export const problemasSeleccion = (sel) =>
  PASOS.flatMap(({ clave, titulo }) => {
    const producto = sel[clave];
    if (!producto) return [];
    const resto = { ...sel, [clave]: undefined };
    const motivo = motivoIncompatible(clave, producto, resto);
    return motivo ? [{ clave, titulo, motivo }] : [];
  });

export const faltantes = (sel) => PASOS.filter((p) => p.requerido && !sel[p.clave]);

export const totalSeleccion = (sel) => PASOS.reduce((s, p) => s + Number(sel[p.clave]?.precio ?? 0), 0);

// La selección se guarda en la URL (?cpu=12&ram=30…) para poder compartirla.
export const seleccionDesdeParams = (params, componentes) =>
  Object.fromEntries(
    PASOS.map(({ clave }) => {
      const id = Number(params.get(clave));
      return [clave, id ? componentes?.[clave]?.find((c) => c.id === id) : undefined];
    }).filter(([, producto]) => producto),
  );

export const paramsDesdeSeleccion = (sel) =>
  new URLSearchParams(PASOS.filter((p) => sel[p.clave]).map((p) => [p.clave, String(sel[p.clave].id)]));

export const esNvme = (producto) => /nvme/i.test(producto?.nombre ?? '');
