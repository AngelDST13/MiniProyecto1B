// Catálogo de la tienda: portada por categorías, filtros laterales, orden, resultados y paginación.
import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PackageOpen, SlidersHorizontal, X } from 'lucide-react';
import { tiendaService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { ICONOS_CATEGORIA, ORDENES_TIENDA } from '../../constants/tienda.js';
import { formatMoney } from '../../utils/format.js';
import { ProductoCard } from '../../components/tienda/ProductoCard.jsx';
import { FiltrosTienda } from '../../components/tienda/FiltrosTienda.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';

const CLAVES = ['q', 'categoria', 'marca', 'precio_min', 'precio_max', 'stock', 'oferta', 'orden', 'pagina'];
const cargarCatalogo = () => tiendaService.catalogo();

const Portada = ({ catalogo, categoriaActiva, onCategoria }) => (
  <section className="relative overflow-hidden bg-ink text-paper">
    <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)', backgroundSize: '44px 44px' }} aria-hidden />
    <div className="pointer-events-none absolute -top-32 right-0 size-96 rounded-full bg-signal/25 blur-3xl" aria-hidden />
    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <p className="animate-rise font-mono text-xs font-bold tracking-[0.2em] text-signal uppercase">Tienda Bancada</p>
      <h1 className="mt-3 max-w-2xl animate-rise text-[clamp(2.2rem,5vw,3.75rem)] leading-[0.98] font-extrabold [animation-delay:60ms]">
        Tecnología con garantía de taller.
      </h1>
      <p className="mt-4 max-w-xl animate-rise text-paper/65 [animation-delay:120ms]">
        Laptops, componentes y accesorios probados por nuestros técnicos. Envío gratis desde {formatMoney(catalogo?.envio.gratisDesde ?? 150)} o retíralo en el taller.
      </p>
      <div className="scrollbar-fino -mx-4 mt-8 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {(catalogo?.categorias ?? []).map((c, i) => {
          const Icono = ICONOS_CATEGORIA[c.icono] ?? ICONOS_CATEGORIA.Package;
          const activa = categoriaActiva === c.slug;
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => onCategoria(activa ? undefined : c.slug)}
              style={{ animationDelay: `${150 + i * 40}ms` }}
              className={`group flex shrink-0 animate-rise items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                activa ? 'border-signal bg-signal text-white' : 'border-white/15 bg-white/5 text-paper hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <Icono className={`size-5 transition-transform duration-300 group-hover:scale-110 ${activa ? '' : 'text-signal'}`} aria-hidden />
              {c.nombre}
            </button>
          );
        })}
      </div>
    </div>
  </section>
);

const Paginacion = ({ pagina, paginas, onIr }) =>
  paginas > 1 ? (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Paginación">
      <button type="button" disabled={pagina <= 1} onClick={() => onIr(pagina - 1)} className="grid size-10 place-items-center rounded-xl border border-line bg-panel transition hover:border-ink disabled:opacity-30" aria-label="Página anterior">
        <ChevronLeft className="size-4" />
      </button>
      {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" onClick={() => onIr(n)} aria-current={n === pagina ? 'page' : undefined}
          className={`size-10 rounded-xl font-mono text-sm font-bold transition ${n === pagina ? 'bg-ink text-paper' : 'border border-line bg-panel hover:border-ink'}`}>
          {n}
        </button>
      ))}
      <button type="button" disabled={pagina >= paginas} onClick={() => onIr(pagina + 1)} className="grid size-10 place-items-center rounded-xl border border-line bg-panel transition hover:border-ink disabled:opacity-30" aria-label="Página siguiente">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  ) : null;

export const Tienda = () => {
  const [parametros, setParametros] = useSearchParams();
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const filtros = useMemo(() => Object.fromEntries(CLAVES.map((k) => [k, parametros.get(k) ?? undefined]).filter(([, v]) => v)), [parametros]);
  const claveFiltros = parametros.toString();

  const { datos: catalogo } = useCargaAsync(cargarCatalogo);
  // Se recarga solo cuando cambia la URL (claveFiltros resume todos los filtros)
  const cargarProductos = useCallback(
    () => tiendaService.productos({ ...Object.fromEntries(new URLSearchParams(claveFiltros)), por_pagina: 12 }),
    [claveFiltros],
  );
  const { datos: resultado, error, cargando, recargar } = useCargaAsync(cargarProductos);

  // Cambiar un filtro vuelve a la página 1
  const cambiar = (cambios) => {
    const siguiente = { ...filtros, ...cambios, pagina: cambios.pagina };
    setParametros(Object.fromEntries(Object.entries(siguiente).filter(([, v]) => v !== undefined && v !== '')));
    if (cambios.pagina) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activos = ['q', 'categoria', 'marca', 'precio_min', 'precio_max', 'stock', 'oferta'].filter((k) => filtros[k]).length;
  const categoria = catalogo?.categorias.find((c) => c.slug === filtros.categoria);

  return (
    <>
      <Portada catalogo={catalogo} categoriaActiva={filtros.categoria} onCategoria={(slug) => cambiar({ categoria: slug })} />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-10">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-24">{catalogo && <FiltrosTienda catalogo={catalogo} filtros={filtros} onCambiar={cambiar} />}</div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-extrabold">{filtros.q ? `“${filtros.q}”` : categoria?.nombre ?? (filtros.oferta ? 'Ofertas' : 'Todos los productos')}</h2>
              <p className="mt-1 text-sm text-muted">{resultado ? `${resultado.total} producto${resultado.total === 1 ? '' : 's'}` : 'Cargando…'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFiltrosAbiertos(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-panel px-3.5 text-sm font-semibold lg:hidden">
                <SlidersHorizontal className="size-4" aria-hidden /> Filtros {activos > 0 && <span className="rounded-full bg-signal px-1.5 font-mono text-[11px] text-white">{activos}</span>}
              </button>
              <label className="sr-only" htmlFor="orden">Ordenar</label>
              <select id="orden" value={filtros.orden ?? 'relevancia'} onChange={(e) => cambiar({ orden: e.target.value })}
                className="h-10 rounded-xl border border-line bg-panel px-3 text-sm font-semibold focus:border-signal focus:outline-none">
                {ORDENES_TIENDA.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
              </select>
            </div>
          </div>

          {activos > 0 && (
            <button type="button" onClick={() => setParametros({})} className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-line">
              <X className="size-3.5" aria-hidden /> Quitar {activos} filtro{activos === 1 ? '' : 's'}
            </button>
          )}

          {error && <ErrorState mensaje={error} onRetry={recargar} />}
          {cargando && !resultado && (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div>
          )}
          {resultado && resultado.data.length === 0 && (
            <EmptyState icono={PackageOpen} titulo="No encontramos productos" texto="Prueba con otra búsqueda o quita algunos filtros."
              accion={<Link to="/tienda" className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper">Ver todo el catálogo</Link>} />
          )}
          {resultado && resultado.data.length > 0 && (
            <div className={`grid grid-cols-2 gap-3 transition-opacity sm:gap-5 xl:grid-cols-3 ${cargando ? 'opacity-50' : ''}`}>
              {resultado.data.map((p, i) => <ProductoCard key={p.id} producto={p} indice={i} />)}
            </div>
          )}
          {resultado && <Paginacion pagina={resultado.pagina} paginas={resultado.paginas} onIr={(n) => cambiar({ pagina: String(n) })} />}
        </div>
      </div>

      {filtrosAbiertos && catalogo && (
        <Modal abierto onClose={() => setFiltrosAbiertos(false)} titulo="Filtros">
          <FiltrosTienda catalogo={catalogo} filtros={filtros} onCambiar={(c) => { cambiar(c); }} />
          <button type="button" onClick={() => setFiltrosAbiertos(false)} className="mt-6 h-12 w-full rounded-xl bg-signal font-semibold text-white">
            Ver {resultado?.total ?? ''} productos
          </button>
        </Modal>
      )}
    </>
  );
};
