// Notificaciones breves ("toasts") para confirmar acciones o mostrar errores.
import { useCallback, useMemo, useRef, useState } from 'react';
import { ToastContext } from './contextos.js';
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';

const DURACION_MS = 4000;

const ESTILO = {
  exito: { icono: CircleCheck, color: 'text-st-reparado' },
  error: { icono: TriangleAlert, color: 'text-danger' },
  info: { icono: Info, color: 'text-st-recibido' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const siguienteId = useRef(1);

  const cerrar = useCallback((id) => {
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo, mensaje) => {
      const id = siguienteId.current++;
      setToasts((actuales) => [...actuales.slice(-2), { id, tipo, mensaje }]);
      setTimeout(() => cerrar(id), DURACION_MS);
    },
    [cerrar],
  );

  const toast = useMemo(
    () => ({
      exito: (mensaje) => mostrar('exito', mensaje),
      error: (mensaje) => mostrar('error', mensaje),
      info: (mensaje) => mostrar('info', mensaje),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-60 flex flex-col items-center gap-2 lg:inset-x-auto lg:top-auto lg:right-6 lg:bottom-24 lg:items-end"
      >
        {toasts.map(({ id, tipo, mensaje }) => {
          const { icono: Icono, color } = ESTILO[tipo];
          return (
            <div
              key={id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-paper shadow-lift"
            >
              <Icono className={`mt-0.5 size-4 shrink-0 ${color}`} aria-hidden />
              <p className="flex-1 leading-snug">{mensaje}</p>
              <button
                type="button"
                onClick={() => cerrar(id)}
                className="rounded-md p-0.5 text-paper/60 hover:text-paper"
                aria-label="Cerrar notificación"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
