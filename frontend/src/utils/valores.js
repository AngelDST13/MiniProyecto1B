// Texto plano del valor de un campo de Administración (para el buscador).
export const textoDeValor = (campo, registro) =>
  campo.tipo === 'ref' ? registro[`${campo.nombre}_etiqueta`] ?? '' : String(registro[campo.nombre] ?? '');
