// Carrito completo con resumen y cálculo de envío.
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCarrito } from '../../hooks/useCarrito.js';
import { formatMoney } from '../../utils/format.js';
import { LineaCarrito } from '../../components/tienda/CarritoPanel.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';

export const Carrito = () => {
  const { items, subtotal, unidades, vaciar } = useCarrito();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="mb-8 text-4xl font-extrabold">Tu carrito</h1>
      {items.length === 0 ? (
        <EmptyState icono={ShoppingBag} titulo="Tu carrito está vacío" texto="Agrega productos desde la tienda."
          accion={<Link to="/tienda" className="inline-flex h-11 items-center rounded-xl bg-ink px-5 font-semibold text-paper">Ir a la tienda</Link>} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-line bg-panel px-5 shadow-ticket">
            <ul className="divide-y divide-line">{items.map((item) => <LineaCarrito key={item.producto_id} item={item} />)}</ul>
            <div className="border-t border-line py-4 text-right">
              <button type="button" onClick={vaciar} className="text-sm font-semibold text-muted transition hover:text-danger">Vaciar carrito</button>
            </div>
          </div>
          <aside className="h-fit rounded-3xl border border-line bg-panel p-6 shadow-ticket lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">Resumen</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Productos ({unidades})</dt><dd className="font-mono">{formatMoney(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd className="text-muted">Se calcula al finalizar</dd></div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-semibold">Total</span>
              <span className="font-display text-3xl font-extrabold">{formatMoney(subtotal)}</span>
            </div>
            <Link to="/checkout" className="mt-5 flex h-12 items-center justify-center rounded-xl bg-signal font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#f04c12]">Finalizar compra</Link>
            <Link to="/tienda" className="mt-2 flex h-10 items-center justify-center text-sm font-semibold text-ink-soft hover:text-ink">Seguir comprando</Link>
          </aside>
        </div>
      )}
    </div>
  );
};
