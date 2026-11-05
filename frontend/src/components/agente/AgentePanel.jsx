// Panel de conversación con "Bancada IA".
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Database, RotateCcw, Sparkles, X } from 'lucide-react';
import { agenteService } from '../../services/agenteService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { TextoEnriquecido } from './TextoEnriquecido.jsx';

const SUGERENCIAS = [
  '¿Qué equipos están listos para entregar?',
  '¿Qué repuestos tienen stock bajo?',
  'Resumen de pagos y gastos de este mes',
  '¿Qué citas hay programadas?',
];

const NOMBRE_HERRAMIENTA = {
  resumen_taller: 'Resumen',
  buscar_ordenes: 'Órdenes',
  detalle_orden: 'Detalle de orden',
  buscar_clientes: 'Clientes',
  consultar_inventario: 'Inventario',
  resumen_finanzas: 'Finanzas',
  agenda_citas: 'Citas',
};

const cargarEstado = () => agenteService.estado();

const SinConfigurar = () => (
  <div className="m-4 rounded-2xl border border-dashed border-line-strong p-5 text-sm text-ink-soft">
    <p className="font-display text-base font-bold text-ink">El asistente aún no está activo</p>
    <p className="mt-1 text-muted">Para encenderlo hace falta una API key de Anthropic:</p>
    <ol className="mt-3 list-decimal space-y-1.5 pl-5">
      <li>Crea una clave en <span className="font-mono text-xs">platform.claude.com</span>.</li>
      <li>Pégala en el <span className="font-mono text-xs">.env</span> del backend: <span className="font-mono text-xs break-all">ANTHROPIC_API_KEY=…</span></li>
      <li>Reinicia el backend.</li>
    </ol>
  </div>
);

const Bienvenida = ({ onElegir }) => (
  <div className="px-4 pt-6 pb-2">
    <span className="grid size-11 place-items-center rounded-2xl bg-ink text-signal">
      <Sparkles className="size-5" aria-hidden />
    </span>
    <p className="mt-4 font-display text-xl font-bold">¿En qué te ayudo?</p>
    <p className="mt-1 text-sm text-muted">Consulto órdenes, clientes, inventario, pagos y citas en tiempo real. Solo leo datos: no modifico nada.</p>
    <div className="mt-5 flex flex-col gap-2">
      {SUGERENCIAS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onElegir(s)}
          className="rounded-xl border border-line bg-panel px-3.5 py-2.5 text-left text-sm font-medium transition hover:border-ink"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

const Burbuja = ({ mensaje }) =>
  mensaje.rol === 'usuario' ? (
    <div className="ml-10 self-end rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-sm text-paper">{mensaje.texto}</div>
  ) : (
    <div className="mr-6 self-start">
      <div className={`rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed ${mensaje.error ? 'bg-danger-soft text-danger' : 'bg-paper text-ink-soft'}`}>
        <TextoEnriquecido texto={mensaje.texto} />
      </div>
      {mensaje.herramientas?.length > 0 && (
        <p className="mt-1.5 flex flex-wrap items-center gap-1 pl-1 font-mono text-[10px] text-muted">
          <Database className="size-3" aria-hidden /> Consultó:
          {mensaje.herramientas.map((h) => <span key={h} className="rounded bg-paper-deep px-1.5 py-0.5">{NOMBRE_HERRAMIENTA[h] ?? h}</span>)}
        </p>
      )}
    </div>
  );

export const AgentePanel = ({ onCerrar, mensajes, setMensajes }) => {
  const { datos: estado, error: errorEstado } = useCargaAsync(cargarEstado);
  const [borrador, setBorrador] = useState('');
  const [pensando, setPensando] = useState(false);
  const finRef = useRef(null);
  const entradaRef = useRef(null);
  const disponible = estado?.disponible;

  // Desplaza hasta el último mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, pensando]);

  useEffect(() => {
    if (disponible) entradaRef.current?.focus();
  }, [disponible]);

  const enviar = async (texto) => {
    const pregunta = texto.trim();
    if (!pregunta || pensando) return;
    const conversacion = [...mensajes.filter((m) => !m.error), { rol: 'usuario', texto: pregunta }];
    setMensajes((actuales) => [...actuales, { rol: 'usuario', texto: pregunta }]);
    setBorrador('');
    setPensando(true);
    try {
      const { data } = await agenteService.conversar(conversacion.map(({ rol, texto: t }) => ({ rol, texto: t })));
      setMensajes((actuales) => [...actuales, { rol: 'asistente', texto: data.texto, herramientas: data.herramientas }]);
    } catch (error) {
      setMensajes((actuales) => [...actuales, { rol: 'asistente', texto: error.message, error: true }]);
    } finally {
      setPensando(false);
    }
  };

  const alPresionar = (evento) => {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      enviar(borrador);
    }
  };

  return (
    <section
      role="dialog"
      aria-label="Asistente Bancada IA"
      className="fixed inset-0 z-50 flex animate-sheet flex-col bg-panel sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-100 sm:rounded-3xl sm:border sm:border-line sm:shadow-lift"
    >
      <header className="flex items-center gap-3 bg-ink px-4 py-3.5 text-paper sm:rounded-t-3xl">
        <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-signal">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-display font-bold">Bancada IA</p>
          <p className="truncate font-mono text-[10px] text-paper/50">
            {disponible ? `Asistente · ${estado.modelo}` : 'Asistente del taller'}
          </p>
        </div>
        {mensajes.length > 0 && (
          <button type="button" onClick={() => setMensajes([])} className="rounded-lg p-2 text-paper/60 transition hover:bg-white/10 hover:text-paper" aria-label="Nueva conversación" title="Nueva conversación">
            <RotateCcw className="size-4" />
          </button>
        )}
        <button type="button" onClick={onCerrar} className="rounded-lg p-2 text-paper/60 transition hover:bg-white/10 hover:text-paper" aria-label="Cerrar asistente">
          <X className="size-5" />
        </button>
      </header>

      <div className="scrollbar-fino flex-1 overflow-y-auto overscroll-contain">
        {errorEstado && <p className="m-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">{errorEstado}</p>}
        {estado && !disponible && <SinConfigurar />}
        {disponible && mensajes.length === 0 && <Bienvenida onElegir={enviar} />}
        {mensajes.length > 0 && (
          <div className="flex flex-col gap-3 p-4" aria-live="polite">
            {mensajes.map((mensaje, i) => <Burbuja key={i} mensaje={mensaje} />)}
            {pensando && (
              <div className="flex items-center gap-2 self-start rounded-2xl bg-paper px-3.5 py-3 text-xs text-muted">
                <span className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((n) => <span key={n} className="size-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${n * 120}ms` }} />)}
                </span>
                Consultando los datos del taller…
              </div>
            )}
          </div>
        )}
        <div ref={finRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); enviar(borrador); }}
        className="border-t border-line p-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-paper p-1.5 focus-within:border-signal focus-within:ring-4 focus-within:ring-signal/15">
          <label htmlFor="pregunta-agente" className="sr-only">Escribe tu pregunta</label>
          <textarea
            id="pregunta-agente"
            ref={entradaRef}
            rows={1}
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={alPresionar}
            disabled={!disponible}
            maxLength={2000}
            placeholder={disponible ? 'Pregunta sobre órdenes, stock, pagos…' : 'Asistente no disponible'}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] outline-none field-sizing-content placeholder:text-muted/60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!disponible || !borrador.trim() || pensando}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-signal text-white transition hover:bg-[#f04c12] disabled:bg-line-strong"
            aria-label="Enviar pregunta"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-center text-[10px] text-muted">La IA puede equivocarse. Verifica los datos importantes.</p>
      </form>
    </section>
  );
};
