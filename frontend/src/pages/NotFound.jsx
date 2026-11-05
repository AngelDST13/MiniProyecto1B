import { Link } from 'react-router-dom';
import { LogoMark } from '../components/layout/Logo.jsx';

export const NotFound = () => (
  <div className="grid min-h-dvh place-items-center px-6 text-center">
    <div className="animate-rise">
      <LogoMark className="mx-auto size-14 text-ink" />
      <p className="mt-6 font-mono text-sm font-bold tracking-widest text-signal-deep">ERROR 404</p>
      <h1 className="mt-2 text-4xl font-extrabold">Esta pieza no está en la bancada</h1>
      <p className="mt-2 text-muted">La página que buscas no existe o fue movida.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-paper hover:bg-ink-soft"
      >
        Volver al panel
      </Link>
    </div>
  </div>
);
