// Tarjeta de producto del catálogo, con efectos al pasar el cursor.
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCarrito } from '../../hooks/useCarrito.js';
import { descuento } from '../../constants/tienda.js';
import { formatMoney } from '../../utils/format.js';
import { ProductoImagen } from './ProductoImagen.jsx';

export const Precio = ({ producto, grande = false }) => (
  <div className="flex flex-wrap items-baseline gap-x-2">
    <span className={`font-display font-extrabold ${grande ? 'text-4xl' : 'text-xl'}`}>{formatMoney(producto.precio)}</span>
    {descuento(producto) > 0 && (
      <span className={`text-muted line-through ${grande ? 'text-lg' : 'text-sm'}`}>{formatMoney(producto.precio_anterior)}</span>
    )}
  </div>
);

export const ProductoCard = ({ producto, indice = 0 }) => {
  const { agregar } = useCarrito();
  const porcentaje = descuento(producto);
  const agotado = producto.stock <= 0;

  return (
    <article
      className="group relative flex animate-rise flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-ticket transition duration-300 ease-out hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
      style={{ animationDelay: `${Math.min(indice, 11) * 40}ms` }}
    >
      <Link to={`/tienda/producto/${producto.slug}`} className="block" aria-label={producto.nombre} tabIndex={-1}>
        <ProductoImagen producto={producto} className="aspect-4/3" />
      </Link>

      <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
        {porcentaje > 0 && <span className="rounded-full bg-signal px-2.5 py-1 text-xs font-bold text-white shadow">-{porcentaje}%</span>}
        {producto.destacado && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink shadow backdrop-blur">Destacado</span>}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-muted uppercase">{producto.marca ?? producto.categoria}</p>
        <h3 className="mt-1 line-clamp-2 min-h-11 text-[15px] leading-snug font-bold">
          <Link to={`/tienda/producto/${producto.slug}`} className="after:absolute after:inset-0 hover:text-signal-deep">{producto.nombre}</Link>
        </h3>
        <div className="mt-auto pt-3">
          <Precio producto={producto} />
          <p className={`mt-1 text-xs font-semibold ${agotado ? 'text-danger' : producto.stock <= 3 ? 'text-[#8a5d00]' : 'text-st-reparado'}`}>
            {agotado ? 'Agotado' : producto.stock <= 3 ? `¡Últimas ${producto.stock} unidades!` : 'En stock'}
          </p>
        </div>
      </div>

      {/* Botón rápido: aparece al pasar el cursor en escritorio y siempre en táctil */}
      <button
        type="button"
        disabled={agotado}
        onClick={() => agregar(producto)}
        aria-label={`Agregar ${producto.nombre} al carrito`}
        className="relative z-10 mx-4 mb-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-paper transition duration-300 hover:bg-signal active:scale-[0.97] disabled:bg-line-strong disabled:text-muted md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100"
      >
        <ShoppingCart className="size-4" aria-hidden /> {agotado ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </article>
  );
};
