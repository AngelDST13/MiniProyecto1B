// Etiquetas visuales: estado de una orden y categoría de un repuesto.
import { CATEGORIA_ICONO, ESTADO_ESTILO } from '../../constants/dominio.js';

export const EstadoBadge = ({ estado, className = '' }) => {
  const estilo = ESTADO_ESTILO[estado] ?? ESTADO_ESTILO.Recibido;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${estilo.soft} ${estilo.text} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${estilo.dot}`} aria-hidden />
      {estado}
    </span>
  );
};

export const CategoriaBadge = ({ categoria }) => {
  const Icono = CATEGORIA_ICONO[categoria];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-ink-soft uppercase">
      {Icono && <Icono className="size-3.5" aria-hidden />}
      {categoria}
    </span>
  );
};
