// Botón flotante que abre el asistente. La conversación se conserva al cambiar de página.
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AgentePanel } from './AgentePanel.jsx';

export const AgenteFlotante = () => {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);

  // Escape cierra el panel
  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => evento.key === 'Escape' && setAbierto(false);
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [abierto]);

  if (abierto) {
    return <AgentePanel onCerrar={() => setAbierto(false)} mensajes={mensajes} setMensajes={setMensajes} />;
  }

  return (
    <button
      type="button"
      onClick={() => setAbierto(true)}
      className="group fixed right-4 bottom-24 z-40 flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-ink px-4 text-paper sm:pr-5 shadow-lift transition hover:-translate-y-0.5 active:scale-95 lg:right-6 lg:bottom-6"
      aria-label="Abrir asistente Bancada IA"
    >
      <Sparkles className="size-5 text-signal transition group-hover:rotate-12" aria-hidden />
      <span className="hidden text-sm font-semibold sm:inline">Bancada IA</span>
    </button>
  );
};
