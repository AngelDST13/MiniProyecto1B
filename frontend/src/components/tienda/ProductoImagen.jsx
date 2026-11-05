// Imagen del producto. Si no tiene foto (o falla), muestra una ilustración de su categoría.
import { useState } from 'react';
import { FONDO_CATEGORIA, ICONOS_CATEGORIA } from '../../constants/tienda.js';

export const ProductoImagen = ({ producto, tamano = 'md', className = '' }) => {
  const [fallo, setFallo] = useState(false);
  const icono = producto.categoria_icono ?? 'Package';
  const Icono = ICONOS_CATEGORIA[icono] ?? ICONOS_CATEGORIA.Package;
  const tamanoIcono = { sm: 'size-7', md: 'size-16', lg: 'size-28' }[tamano];

  if (producto.imagen_url && !fallo) {
    return (
      <div className={`overflow-hidden bg-white ${className}`}>
        <img
          src={producto.imagen_url}
          alt={producto.nombre}
          loading="lazy"
          onError={() => setFallo(true)}
          className="size-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-linear-to-br ${FONDO_CATEGORIA[icono] ?? FONDO_CATEGORIA.Package} ${className}`} role="img" aria-label={producto.nombre}>
      {/* Retícula y brillo decorativos */}
      <div
        className="absolute inset-0 opacity-15"
        style={{ backgroundImage: 'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        aria-hidden
      />
      <div className="absolute -top-1/3 -right-1/4 size-2/3 rounded-full bg-white/20 blur-2xl" aria-hidden />
      <div className="relative grid size-full place-items-center">
        <Icono className={`${tamanoIcono} text-white/90 drop-shadow-lg transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3`} strokeWidth={1.25} aria-hidden />
      </div>
      {producto.marca && tamano !== 'sm' && (
        <span className="absolute bottom-3 left-3 font-mono text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">{producto.marca}</span>
      )}
    </div>
  );
};
