// Estructura de la app interna (admin y técnicos): barra lateral (escritorio) o barra inferior (móvil).
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { iniciales } from '../../utils/format.js';
import { NOMBRE_ROL } from '../../utils/roles.js';
import { Logo } from './Logo.jsx';
import { seccionesMovil, seccionesPara } from './navegacion.js';
import { AgenteFlotante } from '../agente/AgenteFlotante.jsx';

const fechaTurno = new Intl.DateTimeFormat('es-EC', { weekday: 'short', day: '2-digit', month: 'short' });

const useCerrarSesion = () => {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  return () => {
    logout();
    toast.info('Sesión cerrada. ¡Hasta pronto!');
    navigate('/login', { replace: true });
  };
};

const EnlaceLateral = ({ to, etiqueta, etiquetaLarga, icono: Icono, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition duration-200 ${
        isActive ? 'bg-white/[0.07] text-paper' : 'text-paper/60 hover:translate-x-0.5 hover:bg-white/4 hover:text-paper'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span className={`absolute top-2 bottom-2 left-0 w-0.75 rounded-full bg-signal transition-all duration-300 ${isActive ? 'opacity-100' : 'scale-y-0 opacity-0'}`} aria-hidden />
        <Icono className={`size-4.5 transition-colors ${isActive ? 'text-signal' : 'group-hover:text-signal'}`} aria-hidden />
        {etiquetaLarga ?? etiqueta}
      </>
    )}
  </NavLink>
);

const Sidebar = () => {
  const { usuario } = useAuth();
  const cerrarSesion = useCerrarSesion();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-paper lg:flex">
      <Link to="/" className="px-6 pt-7 pb-6" aria-label="Ir a la página de inicio"><Logo claro /></Link>

      <nav aria-label="Principal" className="scrollbar-fino flex-1 space-y-6 overflow-y-auto px-3">
        {seccionesPara(usuario?.rol).map((grupo) => (
          <div key={grupo.titulo}>
            <p className="px-3 pb-2 font-mono text-[10px] font-bold tracking-[0.2em] text-paper/40 uppercase">
              {grupo.titulo === 'Taller' ? `Turno · ${fechaTurno.format(new Date())}` : grupo.titulo}
            </p>
            <div className="space-y-0.5">{grupo.items.map((item) => <EnlaceLateral key={item.to} {...item} />)}</div>
          </div>
        ))}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3 transition hover:bg-white/8">
        <Link to="/mi-cuenta/seguridad" className="flex min-w-0 flex-1 items-center gap-3" title="Mi cuenta y seguridad">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-signal font-display text-sm font-bold text-white">{iniciales(usuario?.nombre)}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{usuario?.nombre}</span>
            <span className="block truncate text-xs text-paper/50">{NOMBRE_ROL[usuario?.rol]}</span>
          </span>
        </Link>
        <button type="button" onClick={cerrarSesion} className="rounded-lg p-2 text-paper/60 transition hover:bg-white/10 hover:text-paper" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
};

const TopbarMovil = () => {
  const { usuario } = useAuth();
  const cerrarSesion = useCerrarSesion();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md lg:hidden">
      <Link to="/" aria-label="Ir a la página de inicio"><Logo /></Link>
      <div className="flex items-center gap-2">
        <Link to="/mi-cuenta/seguridad" className="grid size-9 place-items-center rounded-xl bg-ink font-display text-xs font-bold text-paper" title="Mi cuenta">
          {iniciales(usuario?.nombre)}
        </Link>
        <button type="button" onClick={cerrarSesion} className="grid size-9 place-items-center rounded-xl border border-line bg-panel text-ink-soft" aria-label="Cerrar sesión">
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
};

const NavegacionMovil = () => {
  const { usuario } = useAuth();
  const items = seccionesMovil(usuario?.rol);
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-3 bottom-3 z-30 grid rounded-2xl bg-ink p-1.5 shadow-lift lg:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      {items.map(({ to, etiqueta, icono: Icono, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition ${isActive ? 'bg-white/10 text-paper' : 'text-paper/55'}`}>
          {({ isActive }) => (
            <>
              <Icono className={`size-5 transition-transform ${isActive ? 'scale-110 text-signal' : ''}`} aria-hidden />
              {etiqueta}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export const AppLayout = () => (
  <div className="min-h-dvh lg:pl-64">
    <Sidebar />
    <TopbarMovil />
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-32 sm:px-6 lg:px-10 lg:pt-10 lg:pb-14">
      <Outlet />
    </main>
    <NavegacionMovil />
    <AgenteFlotante />
  </div>
);
