// Filtros del catálogo: categoría, marcas, rango de precio, disponibilidad y ofertas.
// Todo vive en la URL (?categoria=laptops&marca=1,2…) para poder compartir o volver atrás.
import { useState } from 'react';
import { Check } from 'lucide-react';
import { ICONOS_CATEGORIA } from '../../constants/tienda.js';

const Titulo = ({ children }) => <h3 className="mb-2.5 font-mono text-[11px] font-bold tracking-[0.16em] text-muted uppercase">{children}</h3>;

const Casilla = ({ activo, onClick, children, total }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={activo}
    onClick={onClick}
    className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-paper-deep"
  >
    <span className={`grid size-4.5 shrink-0 place-items-center rounded-md border transition ${activo ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-panel group-hover:border-ink'}`}>
      {activo && <Check className="size-3" strokeWidth={3} aria-hidden />}
    </span>
    <span className={`flex-1 ${activo ? 'font-semibold' : 'text-ink-soft'}`}>{children}</span>
    {total !== undefined && <span className="font-mono text-xs text-muted">{total}</span>}
  </button>
);

export const FiltrosTienda = ({ catalogo, filtros, onCambiar }) => {
  const marcasActivas = filtros.marca ? filtros.marca.split(',') : [];
  const [precio, setPrecio] = useState({ min: filtros.precio_min ?? '', max: filtros.precio_max ?? '' });

  const alternarMarca = (id) => {
    const texto = String(id);
    const nuevas = marcasActivas.includes(texto) ? marcasActivas.filter((m) => m !== texto) : [...marcasActivas, texto];
    onCambiar({ marca: nuevas.join(',') || undefined });
  };

  return (
    <div className="space-y-7">
      <section>
        <Titulo>Categorías</Titulo>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => onCambiar({ categoria: undefined })}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition ${!filtros.categoria ? 'bg-ink font-semibold text-paper' : 'text-ink-soft hover:bg-paper-deep'}`}
          >
            Todas
          </button>
          {catalogo.categorias.map((c) => {
            const Icono = ICONOS_CATEGORIA[c.icono] ?? ICONOS_CATEGORIA.Package;
            const activa = filtros.categoria === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => onCambiar({ categoria: activa ? undefined : c.slug })}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition ${activa ? 'bg-ink font-semibold text-paper' : 'text-ink-soft hover:bg-paper-deep hover:text-ink'}`}
              >
                <Icono className={`size-4 ${activa ? 'text-signal' : ''}`} aria-hidden />
                <span className="flex-1">{c.nombre}</span>
                <span className={`font-mono text-xs ${activa ? 'text-paper/60' : 'text-muted'}`}>{c.total}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <Titulo>Precio</Titulo>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onCambiar({ precio_min: precio.min || undefined, precio_max: precio.max || undefined });
          }}
        >
          <label className="sr-only" htmlFor="precio-min">Precio mínimo</label>
          <input id="precio-min" type="number" min="0" inputMode="numeric" placeholder={`$${Math.floor(catalogo.precios?.minimo ?? 0)}`} value={precio.min}
            onChange={(e) => setPrecio((p) => ({ ...p, min: e.target.value }))}
            className="h-10 w-full min-w-0 rounded-lg border border-line bg-panel px-2.5 text-sm focus:border-signal focus:outline-none" />
          <span className="text-muted">–</span>
          <label className="sr-only" htmlFor="precio-max">Precio máximo</label>
          <input id="precio-max" type="number" min="0" inputMode="numeric" placeholder={`$${Math.ceil(catalogo.precios?.maximo ?? 0)}`} value={precio.max}
            onChange={(e) => setPrecio((p) => ({ ...p, max: e.target.value }))}
            className="h-10 w-full min-w-0 rounded-lg border border-line bg-panel px-2.5 text-sm focus:border-signal focus:outline-none" />
          <button type="submit" className="h-10 shrink-0 rounded-lg bg-ink px-3 text-sm font-semibold text-paper hover:bg-ink-soft">OK</button>
        </form>
      </section>

      <section>
        <Titulo>Disponibilidad</Titulo>
        <Casilla activo={filtros.stock === '1'} onClick={() => onCambiar({ stock: filtros.stock === '1' ? undefined : '1' })}>Solo con stock</Casilla>
        <Casilla activo={filtros.oferta === '1'} onClick={() => onCambiar({ oferta: filtros.oferta === '1' ? undefined : '1' })}>En oferta</Casilla>
      </section>

      <section>
        <Titulo>Marcas</Titulo>
        <div className="scrollbar-fino max-h-64 overflow-y-auto pr-1">
          {catalogo.marcas.map((m) => (
            <Casilla key={m.id} activo={marcasActivas.includes(String(m.id))} onClick={() => alternarMarca(m.id)} total={m.total}>
              {m.nombre}
            </Casilla>
          ))}
        </div>
      </section>
    </div>
  );
};
