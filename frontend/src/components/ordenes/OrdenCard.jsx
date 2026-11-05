// Tarjeta de orden con estilo de "ticket" de taller (talón perforado).
import { ArrowRight, Pencil, Trash2, UserRound } from 'lucide-react';
import { ESTADO_ESTILO, TIPO_EQUIPO_ICONO, siguienteEstado } from '../../constants/dominio.js';
import { codigoOrden, formatDate, formatMoney } from '../../utils/format.js';
import { IconButton } from '../ui/Button.jsx';

export const OrdenCard = ({ orden, onAbrir, onAvanzar, onEditar, onEliminar, avanzando = false }) => {
  const estilo = ESTADO_ESTILO[orden.estado];
  const IconoEquipo = TIPO_EQUIPO_ICONO[orden.tipo_equipo];
  const proximo = siguienteEstado(orden.estado);

  return (
    <article className="relative animate-rise overflow-hidden rounded-2xl border border-line bg-panel shadow-ticket transition hover:shadow-lift">
      <span className={`absolute inset-y-0 left-0 w-1 ${estilo.dot}`} aria-hidden />

      <div className="p-4 pl-5">
        <div className="-mt-1.5 -mr-2 flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold tracking-wide text-signal-deep">{codigoOrden(orden.id)}</span>
          <div className="flex">
            <IconButton icono={Pencil} etiqueta={`Editar ${codigoOrden(orden.id)}`} onClick={() => onEditar(orden)} />
            <IconButton
              icono={Trash2}
              etiqueta={`Eliminar ${codigoOrden(orden.id)}`}
              className="hover:bg-danger-soft! hover:text-danger!"
              onClick={() => onEliminar(orden)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAbrir(orden)}
          className="mt-1 block text-left font-display text-[17px] leading-snug font-bold underline-offset-4 hover:underline"
        >
          {orden.marca_modelo}
        </button>
        <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[11px] text-muted">
          {IconoEquipo && <IconoEquipo className="size-3.5 shrink-0" aria-hidden />}
          {orden.tipo_equipo} · S/N {orden.serial}
        </p>

        {orden.diagnostico && <p className="mt-2 line-clamp-2 text-[13px] text-ink-soft">{orden.diagnostico}</p>}
      </div>

      {/* Talón perforado con muescas laterales */}
      <div className="relative">
        <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full border border-line bg-paper" aria-hidden />
        <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full border border-line bg-paper" aria-hidden />
        <div className="perforado mx-4" />
      </div>

      <div className="flex items-center gap-2 px-4 pt-3 pb-2 pl-5 text-[13px]">
        <UserRound className="size-3.5 shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{orden.cliente.nombre}</span>
        <span className="font-mono text-[11px] text-muted">{formatDate(orden.fecha_ingreso)}</span>
      </div>

      <div className="flex min-h-11 items-center justify-between gap-2 px-3 pb-3 pl-5">
        <span className="font-mono text-xs font-bold text-ink-soft" title="Total en repuestos">
          {orden.total_repuestos > 0 ? formatMoney(orden.total_repuestos) : 'Sin repuestos'}
        </span>
        {proximo && (
          <button
            type="button"
            disabled={avanzando}
            onClick={() => onAvanzar(orden, proximo)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-ink px-2.5 text-xs font-semibold text-paper transition hover:bg-ink-soft disabled:opacity-50"
            title={`Mover a "${proximo}"`}
          >
            {proximo === 'En Diagnóstico' ? 'Diagnosticar' : proximo === 'Reparado' ? 'Marcar reparado' : 'Entregar'}
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
};
