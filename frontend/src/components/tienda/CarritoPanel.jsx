// Panel lateral del carrito (se abre al agregar un producto).
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCarrito } from '../../hooks/useCarrito.js';
import { formatMoney } from '../../utils/format.js';
import { ProductoImagen } from './ProductoImagen.jsx';

export const Cantidad = ({ valor, maximo, onCambiar, pequeno = false }) => (
  <div className={`inline-flex items-center rounded-xl border border-line bg-panel ${pequeno ? 'h-8' : 'h-11'}`}>
    <button type="button" onClick={() => onCambiar(valor - 1)} disabled={valor <= 1} className="grid h-full w-9 place-items-center rounded-l-xl text-ink-soft transition hover:bg-paper disabled:opacity-30" aria-label="Quitar una unidad">
      <Minus className="size-3.5" />
    </button>
    <span className={`w-8 text-center font-mono font-bold ${pequeno ? 'text-sm' : ''}`} aria-live="polite">{valor}</span>
    <button type="button" onClick={() => onCambiar(valor + 1)} disabled={valor >= maximo} className="grid h-full w-9 place-items-center rounded-r-xl text-ink-soft transition hover:bg-paper disabled:opacity-30" aria-label="Agregar una unidad">
      <Plus className="size-3.5" />
    </button>
  </div>
);

export const LineaCarrito = ({ item, pequeno = false }) => {
  const { cambiarCantidad, quitar } = useCarrito();
  return (
    <li className="flex gap-3 py-3">
      <Link to={`/tienda/producto/${item.slug}`} className="group shrink-0">
        <ProductoImagen producto={item} tamano="sm" className={`rounded-xl ${pequeno ? 'size-16' : 'size-20'}`} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/tienda/producto/${item.slug}`} className="line-clamp-2 text-sm leading-snug font-semibold hover:text-signal-deep">{item.nombre}</Link>
        <p className="mt-0.5 font-mono text-xs text-muted">{formatMoney(item.precio)} c/u</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Cantidad pequeno valor={item.cantidad} maximo={Math.min(20, item.stock ?? 20)} onCambiar={(n) => cambiarCantidad(item.producto_id, n)} />
          <span className="font-mono text-sm font-bold">{formatMoney(item.precio * item.cantidad)}</span>
        </div>
      </div>
      <button type="button" onClick={() => quitar(item.producto_id)} className="self-start rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger" aria-label={`Quitar ${item.nombre}`}>
        <Trash2 className="size-4" />
      </button>
    </li>
  );
};

export const CarritoPanel = () => {
  const { items, unidades, subtotal, abierto, cerrar } = useCarrito();

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (e) => e.key === 'Escape' && cerrar();
    document.addEventListener('keydown', alPresionar);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = previo;
    };
  }, [abierto, cerrar]);

  if (!abierto) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade bg-ink/45 backdrop-blur-[2px]" onClick={cerrar} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label="Carrito de compras" className="absolute inset-y-0 right-0 flex w-full max-w-md animate-deslizar flex-col bg-panel shadow-lift">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-xl font-bold">Tu carrito <span className="font-mono text-sm font-normal text-muted">· {unidades} u.</span></h2>
          <button type="button" onClick={cerrar} className="rounded-lg p-1.5 text-muted transition hover:bg-paper hover:text-ink" aria-label="Cerrar carrito">
            <X className="size-5" />
          </button>
        </header>
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <ShoppingBag className="mx-auto size-12 text-line-strong" aria-hidden />
              <p className="mt-4 font-semibold">Tu carrito está vacío</p>
              <Link to="/tienda" onClick={cerrar} className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper">Explorar la tienda</Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="scrollbar-fino flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => <LineaCarrito key={item.producto_id} item={item} pequeno />)}
            </ul>
            <footer className="space-y-3 border-t border-line p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-display text-2xl font-extrabold">{formatMoney(subtotal)}</span>
              </div>
              <Link to="/checkout" onClick={cerrar} className="flex h-12 items-center justify-center rounded-xl bg-signal font-semibold text-white transition hover:bg-[#f04c12] active:scale-[0.98]">Finalizar compra</Link>
              <Link to="/carrito" onClick={cerrar} className="flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-ink-soft transition hover:bg-paper">Ver carrito completo</Link>
            </footer>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
};
