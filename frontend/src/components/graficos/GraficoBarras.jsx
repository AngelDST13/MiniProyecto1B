// Barras horizontales de una sola serie (un solo color), con el valor al final de cada barra
// y resaltado al pasar el cursor.
import { useState } from 'react';

export const GraficoBarras = ({ datos, formato = (v) => v, color = '#e8520f', vacio = 'Sin datos en este período' }) => {
  const [activa, setActiva] = useState(null);
  if (!datos.length) return <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">{vacio}</p>;
  const maximo = Math.max(...datos.map((d) => d.valor), 1);

  return (
    <ul className="space-y-3" onMouseLeave={() => setActiva(null)}>
      {datos.map((d, i) => (
        <li key={d.etiqueta} onMouseEnter={() => setActiva(i)} className={`transition-opacity duration-200 ${activa !== null && activa !== i ? 'opacity-45' : ''}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-soft">{d.etiqueta}</span>
            <span className="shrink-0 font-mono font-bold">{formato(d.valor)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-paper-deep">
            <div className="h-full origin-left animate-crecer rounded-full" style={{ width: `${(d.valor / maximo) * 100}%`, background: color, animationDelay: `${i * 60}ms` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};
