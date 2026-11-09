// Página 404: la ruta perdida llega al taller como una orden de servicio sin arreglo posible.
// `embebida`: se muestra dentro de un layout que ya tiene su encabezado (por ejemplo, un producto que no existe).
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Cpu, Store, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { rutaInicio } from '../utils/roles.js';
import { Logo } from '../components/layout/Logo.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';

const ASPAS = [0, 72, 144, 216, 288];

// El cero del 404 es un ventilador que gira con desgano.
const CeroVentilador = () => (
  <svg viewBox="0 0 100 100" className="mx-[0.02em] inline-block size-[0.74em] shrink-0" aria-hidden>
    <circle cx="50" cy="50" r="43" className="fill-none stroke-ink" strokeWidth="13" />
    <g className="ventilador" style={{ animationDuration: '4s' }}>
      <circle cx="50" cy="50" r="31" fill="transparent" />
      {ASPAS.map((angulo) => (
        <path key={angulo} d="M50 50 C58 40 66 32 62 22 C52 20 46 34 50 50Z" transform={`rotate(${angulo} 50 50)`} className="fill-signal" />
      ))}
    </g>
    <circle cx="50" cy="50" r="7" className="fill-ink" />
  </svg>
);

const PASOS = [
  { texto: 'Recibido', estado: 'hecho' },
  { texto: 'En diagnóstico', estado: 'hecho' },
  { texto: 'Reparado', estado: 'fallo', nota: 'Sin arreglo' },
  { texto: 'Entregado', estado: 'pendiente' },
];

const ESTILO_PASO = {
  hecho: 'border-st-reparado bg-st-reparado text-white',
  fallo: 'border-danger bg-danger text-white',
  pendiente: 'border-line-strong',
};

const OrdenPerdida = ({ ruta }) => (
  <div className="animate-rise rounded-3xl bg-panel p-6 shadow-lift [animation-delay:120ms] lg:rotate-2">
    <div className="flex items-center justify-between gap-3 font-mono text-xs font-bold tracking-widest">
      <span className="text-muted">ORDEN DE SERVICIO</span>
      <span className="text-signal-deep">OS-0404</span>
    </div>
    <p className="mt-4 font-display text-2xl leading-tight font-extrabold">Página sin localizar</p>
    <p className="mt-1 line-clamp-2 font-mono text-xs break-all text-muted">Ruta: {ruta}</p>

    <div className="perforado my-5" />

    <ol className="space-y-3 text-sm">
      {PASOS.map(({ texto, estado, nota }) => (
        <li key={texto} className="flex items-center gap-3">
          <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${ESTILO_PASO[estado]}`}>
            {estado === 'hecho' && <Check className="size-3" strokeWidth={3} aria-hidden />}
            {estado === 'fallo' && <X className="size-3" strokeWidth={3} aria-hidden />}
          </span>
          <span className={estado === 'pendiente' ? 'text-muted' : 'font-semibold'}>{texto}</span>
          {nota && <span className="ml-auto rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-danger">{nota}</span>}
        </li>
      ))}
    </ol>

    <div className="perforado my-5" />

    <p className="text-xs text-muted">Diagnóstico del técnico</p>
    <p className="mt-0.5 text-sm font-semibold">El enlace está roto o la página cambió de lugar. No se cobra la revisión.</p>
  </div>
);

export const NotFound = ({ embebida = false }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const Contenido = embebida ? 'div' : 'main'; // el layout ya aporta su propio <main>

  const buscar = (evento) => {
    evento.preventDefault();
    const texto = busqueda.trim();
    navigate(texto ? `/tienda?q=${encodeURIComponent(texto)}` : '/tienda');
  };

  return (
    <div className={`mx-auto flex max-w-6xl flex-col px-4 sm:px-6 lg:px-10 ${embebida ? 'py-10 lg:py-16' : 'min-h-dvh py-6'}`}>
      <title>Página no encontrada · Bancada</title>
      {!embebida && <Link to="/" aria-label="Bancada · inicio" className="w-fit"><Logo /></Link>}

      <Contenido className="my-auto grid grid-cols-1 items-center gap-10 py-10 lg:grid-cols-12 lg:gap-14">
        <div className="min-w-0 animate-rise lg:col-span-7">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-signal-deep uppercase">Error 404</p>
          <p className="-ml-1 flex items-center font-display text-[clamp(7rem,24vw,14.5rem)] leading-[0.95] font-extrabold tracking-tighter" aria-hidden>
            4<CeroVentilador />4
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-extrabold sm:text-4xl">Esta pieza no está en la bancada</h1>
          <p className="mt-3 max-w-lg text-ink-soft">
            Revisamos los estantes y la página que buscas no aparece. Puedes buscar lo que necesitabas en la tienda o volver a un lugar conocido.
          </p>

          <form onSubmit={buscar} role="search" className="mt-6 max-w-lg">
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar laptops, monitores, SSD…" etiqueta="Buscar en la tienda" />
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={rutaInicio(usuario) === '/login' ? '/' : rutaInicio(usuario)}
              className="inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink-soft active:scale-[0.98]">
              {usuario ? 'Ir a mi panel' : 'Volver al inicio'}
            </Link>
            <Link to="/tienda" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-panel px-4 text-sm font-semibold transition hover:border-ink active:scale-[0.98]">
              <Store className="size-4" aria-hidden /> Tienda
            </Link>
            <Link to="/tienda/arma-tu-pc" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-panel px-4 text-sm font-semibold transition hover:border-ink active:scale-[0.98]">
              <Cpu className="size-4" aria-hidden /> Arma tu PC
            </Link>
            <button type="button" onClick={() => navigate(-1)} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink-soft transition hover:bg-paper-deep hover:text-ink">
              <ArrowLeft className="size-4" aria-hidden /> Regresar
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm lg:col-span-5 lg:mx-0 lg:justify-self-end">
          <OrdenPerdida ruta={pathname} />
        </div>
      </Contenido>
    </div>
  );
};
