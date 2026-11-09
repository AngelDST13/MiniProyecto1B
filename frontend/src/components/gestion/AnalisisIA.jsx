// Tarjeta del dashboard: Claude lee las cifras del período y propone hallazgos y acciones.
// Solo se genera cuando el administrador lo pide (cada análisis consume créditos de la API).
import { useState } from 'react';
import { Sparkles, TriangleAlert } from 'lucide-react';
import { gestionService } from '../../services/tiendaService.js';
import { formatDateTime } from '../../utils/format.js';
import { Button } from '../ui/Button.jsx';
import { TextoEnriquecido } from '../agente/TextoEnriquecido.jsx';

export const AnalisisIA = ({ dias }) => {
  const [estado, setEstado] = useState({ cargando: false, resultado: null, error: null });

  const analizar = async () => {
    setEstado({ cargando: true, resultado: null, error: null });
    try {
      const { data } = await gestionService.analisisIA(dias);
      setEstado({ cargando: false, resultado: data, error: null });
    } catch (e) {
      setEstado({ cargando: false, resultado: null, error: e.message });
    }
  };

  const vigente = estado.resultado?.dias === dias;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-ink p-5 text-paper shadow-lift sm:p-6" aria-live="polite">
      <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-signal/25 blur-3xl" aria-hidden />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-signal"><Sparkles className="size-5" aria-hidden /></span>
          <div>
            <h2 className="text-lg font-bold">Análisis con IA</h2>
            <p className="text-sm text-paper/55">Claude revisa las cifras de los últimos {dias} días y te dice qué hacer esta semana.</p>
          </div>
        </div>
        <Button variante="senal" icono={Sparkles} cargando={estado.cargando} onClick={analizar}>
          {estado.resultado ? 'Analizar de nuevo' : 'Analizar período'}
        </Button>
      </div>

      <div className="relative mt-4">
        {estado.cargando && <div className="space-y-2" aria-hidden>{[90, 75, 82].map((w) => <div key={w} className="h-4 animate-pulse rounded-full bg-white/10" style={{ width: `${w}%` }} />)}</div>}
        {estado.error && (
          <p className="flex items-start gap-2 rounded-2xl bg-white/5 p-4 text-sm text-paper/80">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#e0a106]" aria-hidden />{estado.error}
          </p>
        )}
        {estado.resultado && (
          <div className="animate-rise rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-paper/85 [&_strong]:text-paper">
            <TextoEnriquecido texto={estado.resultado.texto} />
            <p className="mt-3 font-mono text-[11px] text-paper/40">
              Generado {formatDateTime(estado.resultado.generado.slice(0, 19).replace('T', ' '))}{vigente ? '' : ` · corresponde a ${estado.resultado.dias} días`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
