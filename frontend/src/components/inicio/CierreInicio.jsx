// Llamado final y pie de página.
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { esPersonal, rutaInicio } from '../../utils/roles.js';
import { Logo } from '../layout/Logo.jsx';

const REPOSITORIO = 'https://github.com/AngelDST13/MiniProyecto1B';

export const CierreInicio = () => {
  const { usuario } = useAuth();

  return (
    <>
      <section className="px-4 pb-24 sm:px-6 lg:px-10">
        <div className="revelar relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-paper sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-signal/25 blur-3xl" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
            <h2 className="text-[clamp(2.25rem,5vw,4rem)] leading-[0.98] font-extrabold lg:col-span-8">
              Abre tu primera orden en menos de un minuto.
            </h2>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <Link
                to={usuario ? rutaInicio(usuario) : '/registro'}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-signal px-6 text-[15px] font-semibold text-white transition hover:bg-[#f04c12]"
              >
                {usuario ? (esPersonal(usuario) ? 'Ir al panel' : 'Mi cuenta') : 'Crear cuenta'} <ArrowRight className="size-4" aria-hidden />
              </Link>
              {!usuario && (
                <Link to="/login" className="inline-flex h-12 items-center rounded-xl border border-white/20 px-6 text-[15px] font-semibold hover:border-white/50">
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <Logo />
          <p className="font-mono text-xs">Mini Proyecto 1 · Node.js + Express + MySQL · React + Vite + Tailwind</p>
          <a href={REPOSITORIO} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline-offset-4 hover:underline">
            Código en GitHub
          </a>
        </div>
      </footer>
    </>
  );
};
