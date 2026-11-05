// Estados de la interfaz: vacío, error y encabezado de página.
import { RotateCw } from 'lucide-react';
import { Button } from './Button.jsx';

export const EmptyState = ({ icono: Icono, titulo, texto, accion }) => (
  <div className="flex flex-col items-center rounded-3xl border border-dashed border-line-strong bg-panel/60 px-6 py-14 text-center">
    {Icono && (
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-paper-deep text-ink-soft">
        <Icono className="size-6" aria-hidden />
      </span>
    )}
    <h3 className="text-lg font-bold">{titulo}</h3>
    {texto && <p className="mt-1 max-w-sm text-sm text-muted">{texto}</p>}
    {accion && <div className="mt-5">{accion}</div>}
  </div>
);

export const ErrorState = ({ mensaje, onRetry }) => (
  <div role="alert" className="flex flex-col items-center rounded-3xl border border-danger/25 bg-danger-soft/60 px-6 py-12 text-center">
    <h3 className="text-lg font-bold text-danger">No se pudo cargar la información</h3>
    <p className="mt-1 max-w-md text-sm text-ink-soft">{mensaje}</p>
    {onRetry && (
      <Button variante="borde" icono={RotateCw} className="mt-5" onClick={onRetry}>
        Reintentar
      </Button>
    )}
  </div>
);

// Encabezado de cada página: etiqueta técnica, título, descripción y acciones.
export const PageHeader = ({ etiqueta, titulo, descripcion, acciones }) => (
  <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-9">
    <div>
      {etiqueta && (
        <p className="mb-2 font-mono text-[11px] font-bold tracking-[0.18em] text-signal-deep uppercase">{etiqueta}</p>
      )}
      <h1 className="text-[32px] leading-[1.05] font-extrabold sm:text-[40px]">{titulo}</h1>
      {descripcion && <p className="mt-2 max-w-xl text-[15px] text-muted">{descripcion}</p>}
    </div>
    {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
  </header>
);
