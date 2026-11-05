// Ventana modal accesible. En móvil se muestra como hoja inferior (bottom sheet).
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ abierto, onClose, titulo, descripcion, children, pie, ancho = 'sm:max-w-lg' }) => {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const tituloId = useId();

  // Se guarda la última versión de onClose sin re-ejecutar el efecto de apertura
  // (si no, el foco saltaría al primer campo en cada render).
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!abierto) return undefined;

    const alPresionar = (evento) => {
      if (evento.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', alPresionar);

    // Bloquea el scroll del fondo mientras el modal está abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Lleva el foco al primer campo del formulario (o al panel).
    const primerCampo = panelRef.current?.querySelector('input, select, textarea');
    (primerCampo ?? panelRef.current)?.focus();

    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto]);

  if (!abierto) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-ink/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full animate-sheet flex-col rounded-t-3xl bg-panel shadow-lift outline-none sm:rounded-3xl ${ancho}`}
      >
        <span className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 sm:px-6 sm:pt-6">
          <div>
            <h2 id={tituloId} className="text-xl font-bold">{titulo}</h2>
            {descripcion && <p className="mt-1 text-sm text-muted">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-lg p-1.5 text-muted transition hover:bg-paper hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="scrollbar-fino flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
        {pie && <footer className="border-t border-line px-5 py-4 sm:px-6">{pie}</footer>}
      </div>
    </div>,
    document.body,
  );
};
