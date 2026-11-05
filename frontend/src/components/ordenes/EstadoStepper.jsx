// Línea de progreso del estado de una orden. Cada paso se puede seleccionar.
import { Check } from 'lucide-react';
import { ESTADOS, ESTADO_ESTILO } from '../../constants/dominio.js';

export const EstadoStepper = ({ estado, onCambiar, deshabilitado = false }) => {
  const indiceActual = ESTADOS.indexOf(estado);

  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label="Estado de la orden">
      {ESTADOS.map((paso, indice) => {
        const estilo = ESTADO_ESTILO[paso];
        const completado = indice < indiceActual;
        const actual = indice === indiceActual;
        return (
          <li key={paso}>
            <button
              type="button"
              disabled={deshabilitado || actual}
              onClick={() => onCambiar(paso)}
              aria-current={actual ? 'step' : undefined}
              className={`group flex w-full flex-col gap-2 rounded-xl p-2 text-left transition enabled:hover:bg-paper ${actual ? estilo.soft : ''}`}
            >
              <span className={`h-1.5 w-full rounded-full ${indice <= indiceActual ? estilo.dot : 'bg-paper-deep'}`} />
              <span className="flex items-center gap-1 text-[11px] leading-tight font-semibold sm:text-xs">
                {completado && <Check className={`size-3.5 shrink-0 ${estilo.text}`} aria-hidden />}
                <span className={actual ? estilo.text : completado ? 'text-ink-soft' : 'text-muted'}>{paso}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};
