// Portal del cliente: resumen, pedidos de la tienda, equipos en reparación y seguridad de la cuenta.
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Laptop, Receipt, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { iniciales } from '../../utils/format.js';

const PESTANAS = [
  { to: '/mi-cuenta', texto: 'Resumen', icono: LayoutDashboard, end: true },
  { to: '/mi-cuenta/pedidos', texto: 'Mis pedidos', icono: ShoppingBag },
  { to: '/mi-cuenta/equipos', texto: 'Mis equipos', icono: Laptop },
  { to: '/mi-cuenta/facturas', texto: 'Facturas', icono: Receipt },
  { to: '/mi-cuenta/seguridad', texto: 'Cuenta y seguridad', icono: ShieldCheck },
];

export const MiCuenta = () => {
  const { usuario } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <header className="flex animate-rise items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-ink font-display text-lg font-bold text-paper">{iniciales(usuario.nombre)}</span>
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-signal-deep uppercase">Mi cuenta</p>
          <h1 className="text-3xl font-extrabold">Hola, {usuario.nombre.split(' ')[0]}</h1>
        </div>
      </header>
      <nav className="scrollbar-fino -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Secciones de mi cuenta">
        {PESTANAS.map(({ to, texto, icono: Icono, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-ink text-paper' : 'border border-line bg-panel text-ink-soft hover:border-ink hover:text-ink'}`}>
            <Icono className="size-4" aria-hidden /> {texto}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8"><Outlet /></div>
    </div>
  );
};
