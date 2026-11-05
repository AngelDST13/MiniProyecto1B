// Buscador con icono y botón para limpiar.
import { Search, X } from 'lucide-react';

export const SearchInput = ({ value, onChange, placeholder = 'Buscar…', etiqueta = 'Buscar', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
    <input
      type="search"
      value={value}
      onChange={(evento) => onChange(evento.target.value)}
      placeholder={placeholder}
      aria-label={etiqueta}
      className="h-11 w-full rounded-xl border border-line bg-panel pr-10 pl-10 text-[15px] transition placeholder:text-muted/60 hover:border-line-strong focus:border-signal focus:ring-4 focus:ring-signal/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted hover:text-ink"
        aria-label="Limpiar búsqueda"
      >
        <X className="size-4" />
      </button>
    )}
  </div>
);
