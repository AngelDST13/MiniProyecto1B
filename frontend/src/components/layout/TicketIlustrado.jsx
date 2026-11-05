// Ilustración de una orden de servicio (decorativa). Se usa en el acceso y en la página de inicio.
import { ESTADOS, ESTADO_ESTILO } from '../../constants/dominio.js';

export const TicketIlustrado = ({ className = '' }) => (
  <div
    aria-hidden
    className={`relative w-full max-w-sm rotate-[-3deg] rounded-3xl bg-paper p-6 text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] ${className}`}
  >
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-xs font-bold tracking-widest text-muted">ORDEN DE SERVICIO</span>
      <span className="font-mono text-xs font-bold text-signal-deep">OS-0042</span>
    </div>
    <p className="mt-4 font-display text-2xl font-extrabold">ThinkPad T14 Gen 3</p>
    <p className="font-mono text-xs text-muted">S/N PF-4K9X21 · Laptop</p>

    <div className="perforado my-5" />

    <ol className="space-y-3">
      {ESTADOS.map((estado, indice) => {
        const completado = indice <= 2;
        return (
          <li key={estado} className="flex items-center gap-3 text-sm">
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                completado ? `${ESTADO_ESTILO[estado].border} ${ESTADO_ESTILO[estado].dot}` : 'border-line-strong'
              }`}
            >
              {completado && <span className="size-1.5 rounded-full bg-white" />}
            </span>
            <span className={completado ? 'font-semibold' : 'text-muted'}>{estado}</span>
            {indice === 2 && (
              <span className="ml-auto rounded-full bg-st-reparado-soft px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-st-reparado">
                Listo para retirar
              </span>
            )}
          </li>
        );
      })}
    </ol>

    <div className="perforado my-5" />
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-xs text-muted">Repuestos</p>
        <p className="text-sm font-semibold">Pantalla 14" IPS · Pasta térmica</p>
      </div>
      <p className="font-display text-xl font-extrabold">$128.50</p>
    </div>
  </div>
);
