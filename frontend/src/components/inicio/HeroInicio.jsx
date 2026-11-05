// Portada: composición asimétrica 7/5 sobre fondo grafito, con el ticket rompiendo la grilla.
import { Link } from 'react-router-dom';
import { ArrowRight, TriangleAlert, Wallet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { esPersonal, rutaInicio } from '../../utils/roles.js';
import { TicketIlustrado } from '../layout/TicketIlustrado.jsx';

const CIFRAS = [
  { valor: '20', texto: 'módulos CRUD' },
  { valor: '21', texto: 'tablas en MySQL' },
  { valor: '4', texto: 'estados de reparación' },
  { valor: '8 h', texto: 'de sesión con JWT' },
];

// Tarjetas flotantes que acompañan al ticket (decorativas).
const AvisoFlotante = ({ icono: Icono, color, titulo, detalle, className }) => (
  <div aria-hidden className={`absolute hidden items-center gap-3 rounded-2xl bg-panel px-4 py-3 text-ink shadow-lift sm:flex ${className}`}>
    <span className={`grid size-9 place-items-center rounded-xl ${color}`}>
      <Icono className="size-4" />
    </span>
    <div className="leading-tight">
      <p className="text-[13px] font-bold">{titulo}</p>
      <p className="font-mono text-[11px] text-muted">{detalle}</p>
    </div>
  </div>
);

export const HeroInicio = () => {
  const { usuario } = useAuth();

  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute top-1/3 -right-40 size-136 rounded-full bg-signal/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pt-32 pb-16 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-10 lg:pt-40 lg:pb-24">
        <div className="lg:col-span-7">
          <p className="animate-rise font-mono text-xs font-bold tracking-[0.22em] text-signal uppercase">
            Gestión para talleres de computación
          </p>
          <h1 className="mt-5 animate-rise text-[clamp(2.75rem,7.5vw,5.75rem)] leading-[0.92] font-extrabold [animation-delay:60ms]">
            El taller entero, sobre una sola <span className="text-signal">bancada.</span>
          </h1>
          <p className="mt-7 max-w-xl animate-rise text-lg leading-relaxed text-paper/65 [animation-delay:120ms]">
            Registra cada laptop, PC o tarjeta gráfica que entra, sigue su reparación paso a paso, descuenta los repuestos
            del inventario y entrega con garantía.
          </p>
          <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:180ms]">
            <Link
              to={usuario ? rutaInicio(usuario) : '/registro'}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-signal px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgb(255_90_31/0.9)] transition hover:bg-[#f04c12] active:scale-[0.98]"
            >
              {usuario ? (esPersonal(usuario) ? 'Ir al panel' : 'Mi cuenta') : 'Crear cuenta'} <ArrowRight className="size-4" aria-hidden />
            </Link>
            {!usuario && (
              <Link
                to="/login"
                className="inline-flex h-12 items-center rounded-xl border border-white/20 px-6 text-[15px] font-semibold text-paper transition hover:border-white/50 hover:bg-white/5"
              >
                Probar con la cuenta demo
              </Link>
            )}
          </div>
        </div>

        <div className="relative flex animate-rise items-center justify-center [animation-delay:200ms] lg:col-span-5 lg:justify-end">
          <TicketIlustrado className="lg:translate-x-6" />
          <AvisoFlotante
            icono={TriangleAlert}
            color="bg-st-diagnostico-soft text-st-diagnostico"
            titulo="Stock bajo"
            detalle="RTX 4060 8GB · 3 u."
            className="-top-6 -left-2 rotate-2 lg:-left-10"
          />
          <AvisoFlotante
            icono={Wallet}
            color="bg-st-reparado-soft text-st-reparado"
            titulo="Pago recibido"
            detalle="$70,00 · Transferencia"
            className="right-0 -bottom-8 -rotate-2 lg:-right-4"
          />
        </div>
      </div>

      <dl className="relative mx-auto grid max-w-7xl grid-cols-2 border-t border-white/10 px-4 sm:px-6 lg:grid-cols-4 lg:px-10">
        {CIFRAS.map(({ valor, texto }, indice) => (
          <div key={texto} className={`py-7 ${indice % 2 ? 'pl-5' : ''} ${indice > 0 ? 'lg:border-l lg:border-white/10 lg:pl-8' : ''}`}>
            <dt className="sr-only">{texto}</dt>
            <dd>
              <span className="font-display text-4xl font-extrabold text-paper">{valor}</span>
              <span className="mt-1 block font-mono text-[11px] tracking-wider text-paper/50 uppercase">{texto}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
