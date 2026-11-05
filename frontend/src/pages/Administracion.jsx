// Panel de Administración: los 20 módulos CRUD agrupados por área del negocio.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { adminService } from '../services/adminService.js';
import { useCargaAsync } from '../hooks/useCargaAsync.js';
import { ICONOS, ORDEN_GRUPOS, rutaModulo } from '../constants/admin.js';
import { coincide } from '../utils/format.js';
import { PageHeader, ErrorState } from '../components/ui/Feedback.jsx';
import { Skeleton } from '../components/ui/Loader.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';

const TarjetaModulo = ({ modulo, indice }) => {
  const Icono = ICONOS[modulo.icono];
  return (
    <Link
      to={rutaModulo(modulo)}
      style={{ animationDelay: `${indice * 30}ms` }}
      className="group relative flex animate-rise flex-col rounded-3xl border border-line bg-panel p-5 shadow-ticket transition hover:-translate-y-0.5 hover:border-ink hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-2xl bg-paper-deep text-ink transition group-hover:bg-ink group-hover:text-signal">
          {Icono && <Icono className="size-5" aria-hidden />}
        </span>
        <ArrowUpRight className="size-5 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" aria-hidden />
      </div>
      <h3 className="mt-4 text-lg leading-tight font-bold">{modulo.plural}</h3>
      <p className="mt-1 text-[13px] leading-snug text-muted">{modulo.descripcion}</p>
      <div className="mt-auto flex items-end justify-between pt-4">
        <p className="font-display text-3xl leading-none font-extrabold">{modulo.total}</p>
        {modulo.personalizado && (
          <span className="rounded-full bg-signal-soft px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-signal-deep uppercase">
            Flujo propio
          </span>
        )}
      </div>
    </Link>
  );
};

// Siempre se refresca: los conteos cambian al crear o eliminar registros.
const cargarModulos = async () => (await adminService.entidades({ refrescar: true })).data;

export const Administracion = () => {
  const { datos: modulos, error, recargar: cargar } = useCargaAsync(cargarModulos);
  const [busqueda, setBusqueda] = useState('');

  const grupos = useMemo(() => {
    if (!modulos) return [];
    const filtrados = modulos.filter((m) => coincide(busqueda, m.plural, m.descripcion, m.grupo));
    return ORDEN_GRUPOS.map((grupo) => ({ grupo, modulos: filtrados.filter((m) => m.grupo === grupo) })).filter((g) => g.modulos.length);
  }, [modulos, busqueda]);

  const totalRegistros = modulos?.reduce((suma, m) => suma + m.total, 0) ?? 0;
  let indice = 0;

  return (
    <div className="animate-rise">
      <PageHeader
        etiqueta={modulos ? `${modulos.length} módulos · ${totalRegistros} registros` : 'Cargando módulos'}
        titulo="Administración"
        descripcion="Todos los catálogos y registros del taller. Cada módulo permite crear, consultar, editar y eliminar."
      />

      {error && <ErrorState mensaje={error} onRetry={cargar} />}

      {!modulos && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, n) => <Skeleton key={n} className="h-48" />)}
        </div>
      )}

      {modulos && (
        <>
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar módulo" etiqueta="Buscar módulo" className="mb-8 max-w-md" />
          <div className="space-y-10">
            {grupos.map(({ grupo, modulos: delGrupo }) => (
              <section key={grupo} aria-labelledby={`grupo-${grupo}`}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 id={`grupo-${grupo}`} className="font-mono text-[11px] font-bold tracking-[0.18em] text-ink-soft uppercase">{grupo}</h2>
                  <span className="h-px flex-1 bg-line" aria-hidden />
                  <span className="font-mono text-[11px] text-muted">{delGrupo.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {delGrupo.map((modulo) => <TarjetaModulo key={modulo.clave} modulo={modulo} indice={indice++} />)}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
