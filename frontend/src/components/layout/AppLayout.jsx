// Estructura de la app autenticada: barra lateral (escritorio) o barra inferior (móvil).
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { iniciales } from '../../utils/format.js';
import { Logo } from './Logo.jsx';
import { SECCIONES } from './navegacion.js';

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

const Sidebar = () => {
  const { usuario } = useAuth();
  const cerrarSesion = useCerrarSesion();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-paper lg:flex">
      <div className="px-6 pt-7 pb-8">
        <Logo claro />
      </div>

      <p className="px-6 pb-2 font-mono text-[10px] font-bold tracking-[0.2em] text-paper/40 uppercase">
        Turno · {fechaTurno.format(new Date())}
      </p>

      <nav aria-label="Principal" className="flex-1 space-y-1 px-3">
        {SECCIONES.map(({ to, etiqueta, icono: Icono, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
                isActive ? 'bg-white/[0.07] text-paper' : 'text-paper/60 hover:bg-white/[0.04] hover:text-paper'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-signal transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden
                />
                <Icono className={`size-[18px] ${isActive ? 'text-signal' : ''}`} aria-hidden />
                {etiqueta}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-signal font-display text-sm font-bold text-white">
          {iniciales(usuario?.nombre)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{usuario?.nombre}</p>
          <p className="truncate text-xs text-paper/50">{usuario?.correo}</p>
        </div>
        <button
          type="button"
          onClick={cerrarSesion}
          className="rounded-lg p-2 text-paper/60 transition hover:bg-white/10 hover:text-paper"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
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
      <Logo />
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-ink font-display text-xs font-bold text-paper" title={usuario?.nombre}>
          {iniciales(usuario?.nombre)}
        </span>
        <button
          type="button"
          onClick={cerrarSesion}
          className="grid size-9 place-items-center rounded-xl border border-line bg-panel text-ink-soft"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
};

const NavegacionMovil = () => (
  <nav
    aria-label="Principal"
    className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl bg-ink p-1.5 shadow-lift lg:hidden"
    style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
  >
    {SECCIONES.map(({ to, etiqueta, icono: Icono, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition ${
            isActive ? 'bg-white/10 text-paper' : 'text-paper/55'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icono className={`size-5 ${isActive ? 'text-signal' : ''}`} aria-hidden />
            {etiqueta}
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export const AppLayout = () => (
  <div className="min-h-dvh lg:pl-64">
    <Sidebar />
    <TopbarMovil />
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-32 sm:px-6 lg:px-10 lg:pt-10 lg:pb-14">
      <Outlet />
    </main>
    <NavegacionMovil />
  </div>
);
