// Barra superior de la página de inicio. Cambia según haya o no sesión iniciada.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { esPersonal, rutaInicio } from '../../utils/roles.js';
import { Logo } from '../layout/Logo.jsx';

const ENLACES = [
  { href: '/tienda', texto: 'Tienda' },
  { href: '#flujo', texto: 'Flujo' },
  { href: '#funciones', texto: 'Funciones' },
  { href: '#modulos', texto: 'Módulos' },
];

export const NavInicio = () => {
  const { usuario } = useAuth();
  const [conFondo, setConFondo] = useState(false);

  // Al bajar, la barra pasa de transparente (sobre el hero oscuro) a papel con desenfoque.
  useEffect(() => {
    const alDesplazar = () => setConFondo(window.scrollY > 40);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        conFondo ? 'border-b border-line bg-paper/85 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-10" aria-label="Principal">
        <Link to="/" aria-label="Bancada · inicio">
          <Logo claro={!conFondo} />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {ENLACES.map(({ href, texto }) => (
            <li key={href}>
              <a
                href={href}
                className={`text-sm font-semibold transition ${conFondo ? 'text-ink-soft hover:text-ink' : 'text-paper/70 hover:text-paper'}`}
              >
                {texto}
              </a>
            </li>
          ))}
        </ul>

        {usuario ? (
          <Link to={rutaInicio(usuario)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-signal px-4 text-sm font-semibold text-white transition hover:bg-[#f04c12]">
            {esPersonal(usuario) ? 'Ir al panel' : 'Mi cuenta'} <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className={`inline-flex h-10 items-center rounded-xl px-3.5 text-sm font-semibold transition ${
                conFondo ? 'text-ink hover:bg-paper-deep' : 'text-paper hover:bg-white/10'
              }`}
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="hidden h-10 items-center rounded-xl bg-signal px-4 text-sm font-semibold text-white transition hover:bg-[#f04c12] sm:inline-flex"
            >
              Crear cuenta
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};
