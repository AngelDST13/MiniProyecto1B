// Botón base con variantes, tamaños y estado de carga.
import { LoaderCircle } from 'lucide-react';

const VARIANTES = {
  primario: 'bg-ink text-paper hover:bg-ink-soft',
  senal: 'bg-signal text-white hover:bg-[#f04c12] shadow-[0_8px_20px_-10px_rgb(255_90_31/0.9)]',
  borde: 'border border-line-strong bg-panel text-ink hover:border-ink',
  fantasma: 'text-ink-soft hover:bg-paper-deep hover:text-ink',
  peligro: 'bg-danger text-white hover:bg-[#b52a21]',
};

const TAMANOS = {
  sm: 'h-8 rounded-lg px-3 text-[13px] gap-1.5',
  md: 'h-10 rounded-xl px-4 text-sm gap-2',
  lg: 'h-12 rounded-xl px-5 text-[15px] gap-2',
};

export const Button = ({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  icono: Icono,
  type = 'button',
  className = '',
  disabled,
  children,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || cargando}
    className={`inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
    {...props}
  >
    {cargando ? (
      <LoaderCircle className="size-4 animate-spin" aria-hidden />
    ) : (
      Icono && <Icono className="size-4" aria-hidden />
    )}
    {children}
  </button>
);

// Botón cuadrado solo con icono (requiere etiqueta accesible).
export const IconButton = ({ icono: Icono, etiqueta, variante = 'fantasma', className = '', ...props }) => (
  <button
    type="button"
    aria-label={etiqueta}
    title={etiqueta}
    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition active:scale-95 disabled:opacity-40 ${VARIANTES[variante]} ${className}`}
    {...props}
  >
    <Icono className="size-4" aria-hidden />
  </button>
);
