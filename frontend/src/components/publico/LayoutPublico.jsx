// Estructura de las páginas públicas (tienda, carrito, checkout y portal del cliente):
// barra superior con buscador, carrito y cuenta; pie de página; panel del carrito.
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Search, ShoppingCart, UserRound, Wrench } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useCarrito } from '../../hooks/useCarrito.js';
import { esPersonal, rutaInicio } from '../../utils/roles.js';
import { iniciales } from '../../utils/format.js';
import { Logo } from '../layout/Logo.jsx';
import { CarritoPanel } from '../tienda/CarritoPanel.jsx';

const Buscador = ({ className = '' }) => {
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/tienda?q=${encodeURIComponent(texto.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar laptops, monitores, SSD…"
        aria-label="Buscar productos"
        className="h-11 w-full rounded-full border border-line bg-paper pr-4 pl-10 text-sm transition placeholder:text-muted/70 hover:border-line-strong focus:border-signal focus:bg-panel focus:ring-4 focus:ring-signal/15 focus:outline-none"
      />
    </form>
  );
};

const enlace = ({ isActive }) =>
  `relative px-1 py-2 text-sm font-semibold transition after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-signal after:transition-transform after:duration-300 ${
    isActive ? 'text-ink after:scale-x-100' : 'text-ink-soft after:scale-x-0 hover:text-ink hover:after:scale-x-100'
  }`;

const NavPublica = () => {
  const { usuario, logout } = useAuth();
  const { unidades, abrir } = useCarrito();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/" aria-label="Bancada · inicio"><Logo /></Link>
        <nav className="ml-4 hidden items-center gap-6 lg:flex" aria-label="Principal">
          <NavLink to="/tienda" className={enlace} end>Tienda</NavLink>
          <NavLink to="/tienda?oferta=1" className={() => enlace({ isActive: false })}>Ofertas</NavLink>
          <a href="/#flujo" className={enlace({ isActive: false })}>Servicio técnico</a>
        </nav>
        <Buscador className="ml-auto hidden w-full max-w-sm md:block" />

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button
            type="button"
            onClick={abrir}
            className="relative grid size-11 place-items-center rounded-xl border border-line bg-panel transition hover:-translate-y-0.5 hover:border-ink"
            aria-label={`Abrir carrito (${unidades} productos)`}
          >
            <ShoppingCart className="size-5" aria-hidden />
            {unidades > 0 && (
              <span key={unidades} className="absolute -top-1.5 -right-1.5 grid min-w-5 animate-pop place-items-center rounded-full bg-signal px-1 font-mono text-[11px] font-bold text-white">
                {unidades}
              </span>
            )}
          </button>
          {usuario ? (
            <>
              <Link
                to={rutaInicio(usuario)}
                className="flex h-11 items-center gap-2 rounded-xl border border-line bg-panel pr-3 pl-1.5 transition hover:border-ink"
                title={esPersonal(usuario) ? 'Ir al panel' : 'Mi cuenta'}
              >
                <span className="grid size-8 place-items-center rounded-lg bg-ink font-display text-xs font-bold text-paper">{iniciales(usuario.nombre)}</span>
                <span className="hidden text-sm font-semibold sm:inline">{esPersonal(usuario) ? 'Panel' : 'Mi cuenta'}</span>
              </Link>
              <button
                type="button"
                onClick={() => { logout(); navigate('/'); }}
                className="hidden size-11 place-items-center rounded-xl text-muted transition hover:bg-paper-deep hover:text-ink sm:grid"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="flex h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-paper transition hover:bg-ink-soft">
              <UserRound className="size-4" aria-hidden /> <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden"><Buscador /></div>
    </header>
  );
};

const Pie = () => (
  <footer className="mt-20 bg-ink text-paper">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-10">
      <div className="md:col-span-2">
        <Logo claro />
        <p className="mt-4 max-w-sm text-sm text-paper/60">
          Tienda de tecnología con el respaldo de un taller de reparación. Todo lo que vendemos lo probamos y lo atendemos en garantía.
        </p>
      </div>
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-paper/50 uppercase">Tienda</p>
        <ul className="mt-3 space-y-2 text-sm text-paper/75">
          <li><Link to="/tienda?categoria=laptops" className="hover:text-signal">Laptops</Link></li>
          <li><Link to="/tienda?categoria=componentes" className="hover:text-signal">Componentes</Link></li>
          <li><Link to="/tienda?oferta=1" className="hover:text-signal">Ofertas</Link></li>
        </ul>
      </div>
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-paper/50 uppercase">Servicio técnico</p>
        <ul className="mt-3 space-y-2 text-sm text-paper/75">
          <li className="flex items-center gap-2"><Wrench className="size-3.5" aria-hidden /> Diagnóstico y reparación</li>
          <li>Lun a sáb · 9:00 a 19:00</li>
          <li><Link to="/mi-cuenta/equipos" className="hover:text-signal">Seguir mi equipo</Link></li>
        </ul>
      </div>
    </div>
    <p className="border-t border-white/10 py-5 text-center font-mono text-[11px] text-paper/40">Bancada · Mini Proyecto 1 · Node.js + React</p>
  </footer>
);

export const LayoutPublico = () => (
  <div className="flex min-h-dvh flex-col">
    <NavPublica />
    <main className="flex-1"><Outlet /></main>
    <Pie />
    <CarritoPanel />
  </div>
);
