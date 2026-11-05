// Marco de las pantallas de acceso (login y registro).
// La pantalla ocupa exactamente el alto de la ventana: la página nunca se desplaza.
// Si el formulario no cabe (pantallas muy bajas), solo su columna se desplaza por dentro.
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { TicketIlustrado } from './TicketIlustrado.jsx';

const PanelIlustrado = () => (
  <section className="relative hidden h-dvh flex-col overflow-hidden bg-ink px-12 py-10 text-paper lg:flex bajo:py-7">
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

    <Link to="/" className="relative w-fit" aria-label="Ir a la página de inicio">
      <Logo claro />
    </Link>

    <div className="relative grid min-h-0 flex-1 items-center gap-10 py-8 xl:grid-cols-[1fr_auto]">
      <div>
        <p className="font-mono text-xs font-bold tracking-[0.2em] text-signal uppercase">Taller de computación</p>
        {/* El tamaño depende de la altura de la ventana para que siempre quepa */}
        <h2 className="mt-4 max-w-md text-[clamp(2.25rem,6.4vh,3.75rem)] leading-[0.98] font-extrabold">
          Cada equipo, de la recepción a la entrega.
        </h2>
        <p className="mt-5 max-w-sm text-[15px] text-paper/60 bajo:mt-3">
          Clientes, órdenes de servicio y repuestos en un mismo lugar. Sin papeles perdidos.
        </p>
      </div>
      {/* El ticket solo aparece cuando hay espacio de sobra */}
      <TicketIlustrado className="hidden xl:block bajo:hidden" />
    </div>

    <p className="relative font-mono text-[11px] text-paper/40">Mini Proyecto 1 · Node.js + React</p>
  </section>
);

export const AuthShell = ({ titulo, subtitulo, children }) => (
  <div className="grid h-dvh overflow-hidden lg:grid-cols-[1.05fr_1fr]">
    <PanelIlustrado />

    <section className="scrollbar-fino h-dvh overflow-y-auto overscroll-contain">
      <div className="flex min-h-full flex-col px-5 py-6 sm:px-10 sm:py-8 bajo:py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden" aria-label="Ir a la página de inicio">
            <Logo />
          </Link>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden /> Inicio
          </Link>
        </div>
        <div className="mx-auto my-auto w-full max-w-sm animate-rise py-8 bajo:py-4">
          <h1 className="text-4xl font-extrabold bajo:text-3xl">{titulo}</h1>
          <p className="mt-2 text-[15px] text-muted">{subtitulo}</p>
          <div className="mt-8 bajo:mt-5">{children}</div>
        </div>
      </div>
    </section>
  </div>
);
