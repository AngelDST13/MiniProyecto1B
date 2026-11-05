// Marco de las pantallas de acceso (login y registro).
// Escritorio: panel oscuro con una "orden de servicio" ilustrada + formulario.
// Móvil: solo el formulario.
import { Logo } from './Logo.jsx';
import { ESTADOS, ESTADO_ESTILO } from '../../constants/dominio.js';

const TicketIlustrado = () => (
  <div className="relative w-full max-w-sm rotate-[-3deg] rounded-3xl bg-paper p-6 text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)]">
    <div className="flex items-center justify-between">
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
              className={`grid size-5 place-items-center rounded-full border-2 ${
                completado ? `${ESTADO_ESTILO[estado].border} ${ESTADO_ESTILO[estado].dot}` : 'border-line-strong'
              }`}
            >
              {completado && <span className="size-1.5 rounded-full bg-white" />}
            </span>
            <span className={completado ? 'font-semibold' : 'text-muted'}>{estado}</span>
            {indice === 2 && (
              <span className="ml-auto rounded-full bg-st-reparado-soft px-2 py-0.5 text-[11px] font-bold text-st-reparado">
                Listo para retirar
              </span>
            )}
          </li>
        );
      })}
    </ol>

    <div className="perforado my-5" />
    <div className="flex items-end justify-between">
      <div>
        <p className="text-xs text-muted">Repuestos</p>
        <p className="text-sm font-semibold">Pantalla 14" IPS · Pasta térmica</p>
      </div>
      <p className="font-display text-xl font-extrabold">$128.50</p>
    </div>
  </div>
);

export const AuthShell = ({ titulo, subtitulo, children }) => (
  <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
    <section className="relative hidden overflow-hidden bg-ink px-12 py-10 text-paper lg:flex lg:flex-col">
      {/* Retícula de banco de trabajo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-signal/25 blur-3xl" aria-hidden />

      <div className="relative">
        <Logo claro />
      </div>

      <div className="relative my-auto grid gap-12 py-12 xl:grid-cols-[1fr_auto] xl:items-center">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-signal uppercase">Taller de computación</p>
          <h2 className="mt-4 max-w-md text-5xl leading-[0.98] font-extrabold xl:text-6xl">
            Cada equipo, de la recepción a la entrega.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] text-paper/60">
            Clientes, órdenes de servicio y repuestos en un mismo lugar. Sin papeles perdidos.
          </p>
        </div>
        <TicketIlustrado />
      </div>

      <p className="relative font-mono text-[11px] text-paper/40">Mini Proyecto 1 · Node.js + React</p>
    </section>

    <section className="flex flex-col px-5 py-8 sm:px-10">
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="mx-auto my-auto w-full max-w-sm animate-rise py-10">
        <h1 className="text-4xl font-extrabold">{titulo}</h1>
        <p className="mt-2 text-[15px] text-muted">{subtitulo}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  </div>
);
