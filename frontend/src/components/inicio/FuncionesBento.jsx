// Sección "Funciones": rejilla asimétrica (bento) con piezas de distinto tamaño y peso.
import { KeyRound, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { ESTADOS, ESTADO_ESTILO } from '../../constants/dominio.js';

const MiniTablero = () => (
  <div className="mt-8 grid flex-1 grid-cols-4 items-start gap-2" aria-hidden>
    {ESTADOS.map((estado, columna) => (
      <div key={estado} className="space-y-2 rounded-2xl bg-paper p-2">
        <span className={`block h-1.5 w-8 rounded-full ${ESTADO_ESTILO[estado].dot}`} />
        {Array.from({ length: [4, 3, 3, 2][columna] }, (_, n) => (
          <div key={n} className="rounded-lg border border-line bg-panel p-2.5">
            <span className="block h-1.5 w-3/4 rounded bg-ink/80" />
            <span className="mt-1.5 block h-1 w-1/2 rounded bg-line-strong" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

const MedidorStock = () => (
  <div className="mt-8 space-y-4" aria-hidden>
    {[
      { nombre: 'RAM DDR4 16GB', stock: 10, color: 'bg-ink' },
      { nombre: 'Pantalla 15.6"', stock: 5, color: 'bg-ink' },
      { nombre: 'RTX 4060 8GB', stock: 3, color: 'bg-st-diagnostico' },
    ].map(({ nombre, stock, color }) => (
      <div key={nombre}>
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold">{nombre}</span>
          <span className="font-mono text-muted">{stock} u.</span>
        </div>
        <div className="mt-1.5 flex gap-0.75">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-xs ${i < stock ? color : 'bg-paper-deep'}`} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const FuncionesBento = () => (
  <section id="funciones" className="scroll-mt-20 bg-paper-deep/60 py-24 lg:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
      <div className="revelar flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-signal-deep uppercase">02 · Funciones</p>
          <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] leading-none font-extrabold">Pensado para el mostrador y la mesa de trabajo.</h2>
        </div>
        <p className="max-w-sm text-[15px] text-muted">Lo que se repite todos los días en un taller, resuelto en pocos clics.</p>
      </div>

      <div className="mt-14 grid gap-4 lg:grid-cols-12">
        <article className="revelar flex flex-col rounded-4xl border border-line bg-panel p-7 shadow-ticket lg:col-span-7 lg:row-span-2 lg:p-9">
          <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted uppercase">Tablero de órdenes</p>
          <h3 className="mt-3 max-w-md text-3xl leading-tight font-extrabold">Mueve cada equipo de columna con un clic.</h3>
          <p className="mt-3 max-w-md text-[15px] text-muted">
            Cada orden es un ticket con el cliente, el número de serie, el diagnóstico y el total en repuestos. Búscalas por código,
            equipo o cliente.
          </p>
          <MiniTablero />
        </article>

        <article className="revelar rounded-4xl border border-line bg-panel p-7 shadow-ticket lg:col-span-5" style={{ '--retraso': '80ms' }}>
          <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted uppercase">Inventario</p>
          <h3 className="mt-3 text-2xl leading-tight font-extrabold">El stock se descuenta solo.</h3>
          <p className="mt-2 text-[15px] text-muted">Al usar un repuesto en una orden; si se retira, las unidades regresan.</p>
          <MedidorStock />
        </article>

        <article className="revelar relative overflow-hidden rounded-4xl bg-signal p-7 text-white lg:col-span-5" style={{ '--retraso': '140ms' }}>
          <ShieldCheck className="absolute -right-6 -bottom-6 size-40 text-white/15" aria-hidden />
          <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-white/70 uppercase">Seguridad</p>
          <h3 className="mt-3 text-2xl leading-tight font-extrabold">Solo entra quien tiene cuenta.</h3>
          <ul className="relative mt-5 space-y-2.5 text-[15px]">
            <li className="flex items-center gap-2.5"><Lock className="size-4" aria-hidden /> Contraseñas cifradas con bcrypt</li>
            <li className="flex items-center gap-2.5"><KeyRound className="size-4" aria-hidden /> Sesión con token JWT de 8 horas</li>
            <li className="flex items-center gap-2.5"><ShieldCheck className="size-4" aria-hidden /> Toda la API protegida (401)</li>
          </ul>
        </article>

        <article className="revelar flex items-start gap-5 rounded-4xl border border-line bg-panel p-7 shadow-ticket lg:col-span-12" style={{ '--retraso': '60ms' }}>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-signal">
            <Smartphone className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-xl font-extrabold">También desde el celular.</h3>
            <p className="mt-1 max-w-2xl text-[15px] text-muted">
              Navegación inferior, tablas que se convierten en tarjetas y formularios que se abren desde abajo. Consulta una orden
              sin dejar la mesa de trabajo.
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>
);
