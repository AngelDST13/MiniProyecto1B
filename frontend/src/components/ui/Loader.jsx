// Indicadores de carga: spinner con texto y bloques "esqueleto".

export const Loader = ({ texto = 'Cargando…' }) => (
  <div role="status" className="flex flex-col items-center gap-3 py-16 text-sm text-muted">
    <span className="relative flex size-9">
      <span className="absolute inset-0 animate-ping rounded-full bg-signal/30" />
      <span className="relative m-auto size-3 rounded-full bg-signal" />
    </span>
    {texto}
  </div>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-paper-deep ${className}`} aria-hidden />
);
