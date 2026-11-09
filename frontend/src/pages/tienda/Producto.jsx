// Detalle de producto: imagen, precio, stock, cantidad, especificaciones y relacionados.
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ShieldCheck, ShoppingCart, Store, Truck, Zap } from 'lucide-react';
import { tiendaService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useCarrito } from '../../hooks/useCarrito.js';
import { descuento } from '../../constants/tienda.js';
import { formatMoney } from '../../utils/format.js';
import { ProductoImagen } from '../../components/tienda/ProductoImagen.jsx';
import { Precio, ProductoCard } from '../../components/tienda/ProductoCard.jsx';
import { Cantidad } from '../../components/tienda/CarritoPanel.jsx';
import { ErrorState } from '../../components/ui/Feedback.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';
import { NotFound } from '../NotFound.jsx';

const Beneficio = ({ icono: Icono, titulo, texto }) => (
  <li className="flex gap-3 rounded-2xl border border-line bg-panel p-3.5 transition hover:border-line-strong">
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-paper-deep text-signal-deep"><Icono className="size-4" aria-hidden /></span>
    <div>
      <p className="text-sm font-semibold">{titulo}</p>
      <p className="text-xs text-muted">{texto}</p>
    </div>
  </li>
);

const Detalle = ({ producto, relacionados }) => {
  const { agregar } = useCarrito();
  const navigate = useNavigate();
  const [cantidad, setCantidad] = useState(1);
  const [pestana, setPestana] = useState(producto.especificaciones.length ? 'especificaciones' : 'descripcion');
  const agotado = producto.stock <= 0;
  const porcentaje = descuento(producto);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted" aria-label="Ruta">
        <Link to="/tienda" className="hover:text-ink">Tienda</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link to={`/tienda?categoria=${producto.categoria_slug}`} className="hover:text-ink">{producto.categoria}</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate text-ink-soft">{producto.nombre}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="group relative animate-rise">
          <ProductoImagen producto={producto} tamano="lg" className="aspect-square rounded-4xl shadow-ticket" />
          {porcentaje > 0 && <span className="absolute top-5 left-5 rounded-full bg-signal px-3 py-1.5 font-bold text-white shadow-lg">-{porcentaje}%</span>}
        </div>

        <div className="animate-rise [animation-delay:80ms]">
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-signal-deep uppercase">{producto.marca ?? producto.categoria}</p>
          <h1 className="mt-2 text-[clamp(1.8rem,3.5vw,2.75rem)] leading-tight font-extrabold">{producto.nombre}</h1>
          <p className="mt-2 font-mono text-xs text-muted">SKU {producto.sku}</p>

          <div className="mt-6"><Precio producto={producto} grande /></div>
          {porcentaje > 0 && <p className="mt-1 text-sm font-semibold text-st-reparado">Ahorras {formatMoney(producto.precio_anterior - producto.precio)}</p>}

          <p className={`mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${agotado ? 'bg-danger-soft text-danger' : producto.stock <= 3 ? 'bg-st-diagnostico-soft text-[#8a5d00]' : 'bg-st-reparado-soft text-st-reparado'}`}>
            <span className={`size-2 rounded-full ${agotado ? 'bg-danger' : producto.stock <= 3 ? 'bg-st-diagnostico' : 'animate-pulse bg-st-reparado'}`} aria-hidden />
            {agotado ? 'Agotado' : producto.stock <= 3 ? `Últimas ${producto.stock} unidades` : `${producto.stock} disponibles`}
          </p>

          {!agotado && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Cantidad valor={cantidad} maximo={Math.min(20, producto.stock)} onCambiar={setCantidad} />
              <button type="button" onClick={() => agregar(producto, cantidad)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-5 font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-ink-soft active:scale-[0.98]">
                <ShoppingCart className="size-4" aria-hidden /> Agregar al carrito
              </button>
              <button type="button" onClick={() => { agregar(producto, cantidad); navigate('/checkout'); }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-signal px-5 font-semibold text-white shadow-[0_10px_30px_-12px_rgb(255_90_31/0.9)] transition hover:-translate-y-0.5 hover:bg-[#f04c12] active:scale-[0.98] sm:w-auto">
                <Zap className="size-4" aria-hidden /> Comprar ahora
              </button>
            </div>
          )}

          <ul className="mt-7 grid gap-2.5 sm:grid-cols-3">
            <Beneficio icono={ShieldCheck} titulo={`${producto.garantia_meses} meses de garantía`} texto="Atendida en nuestro taller" />
            <Beneficio icono={Truck} titulo="Envío a domicilio" texto="Gratis en compras grandes" />
            <Beneficio icono={Store} titulo="Retiro en tienda" texto="Sin costo, en 24 h" />
          </ul>

          <div className="mt-8">
            <div className="flex gap-1 border-b border-line" role="tablist">
              {[['especificaciones', 'Especificaciones'], ['descripcion', 'Descripción']].map(([id, texto]) => (
                <button key={id} type="button" role="tab" aria-selected={pestana === id} onClick={() => setPestana(id)}
                  className={`relative px-4 py-2.5 text-sm font-semibold transition ${pestana === id ? 'text-ink' : 'text-muted hover:text-ink'}`}>
                  {texto}
                  <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-signal transition-transform duration-300 ${pestana === id ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>
              ))}
            </div>
            <div className="pt-4" role="tabpanel">
              {pestana === 'descripcion' ? (
                <p className="leading-relaxed text-ink-soft">{producto.descripcion || 'Sin descripción.'}</p>
              ) : (
                <dl className="divide-y divide-line rounded-2xl border border-line bg-panel">
                  {producto.especificaciones.map((e) => (
                    <div key={e.clave} className="grid grid-cols-[40%_1fr] gap-3 px-4 py-2.5 text-sm">
                      <dt className="text-muted">{e.clave}</dt>
                      <dd className="font-medium">{e.valor}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-2xl font-extrabold">También te puede interesar</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {relacionados.map((p, i) => <ProductoCard key={p.id} producto={p} indice={i} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export const Producto = () => {
  const { slug } = useParams();
  const cargar = useCallback(() => tiendaService.producto(slug), [slug]);
  const { datos, error, recargar } = useCargaAsync(cargar);

  if (error?.includes('no encontrado')) return <NotFound embebida />;
  if (error) return <div className="mx-auto max-w-3xl p-8"><ErrorState mensaje={error} onRetry={recargar} /></div>;
  if (!datos) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-10">
        <Skeleton className="aspect-square" />
        <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-16" /><Skeleton className="h-40" /></div>
      </div>
    );
  }
  return <Detalle key={datos.data.id} producto={datos.data} relacionados={datos.relacionados} />;
};
