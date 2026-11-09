// Gráfico de líneas en SVG (sin librerías): un solo eje en dólares, leyenda, líneas de 2 px,
// y al pasar el cursor una línea guía con el detalle de ese día.
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatMoney } from '../../utils/format.js';

const ALTO = 260;
const MARGEN = { arriba: 12, derecha: 12, abajo: 28, izquierda: 56 };
const fechaCorta = new Intl.DateTimeFormat('es-CR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const etiquetaDia = (dia) => fechaCorta.format(new Date(`${dia}T12:00:00Z`));

// Escala "bonita" para el eje Y: 0 y 4 divisiones redondas
const escalaY = (maximo) => {
  if (maximo <= 0) return { tope: 100, paso: 25 };
  const crudo = maximo / 4;
  const magnitud = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * magnitud).find((p) => p >= crudo);
  return { tope: paso * 4, paso };
};

const dineroCorto = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `$${Math.round(v)}`);

export const GraficoLineas = ({ datos, series }) => {
  const contenedor = useRef(null);
  const [ancho, setAncho] = useState(640);
  const [activo, setActivo] = useState(null);

  useEffect(() => {
    const observador = new ResizeObserver(([entrada]) => setAncho(Math.max(280, entrada.contentRect.width)));
    observador.observe(contenedor.current);
    return () => observador.disconnect();
  }, []);

  const { x, y, ticks } = useMemo(() => {
    const maximo = Math.max(0, ...datos.flatMap((d) => series.map((s) => d[s.clave])));
    const { tope, paso } = escalaY(maximo);
    const anchoUtil = ancho - MARGEN.izquierda - MARGEN.derecha;
    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    return {
      x: (i) => MARGEN.izquierda + (datos.length <= 1 ? anchoUtil / 2 : (i / (datos.length - 1)) * anchoUtil),
      y: (v) => MARGEN.arriba + altoUtil - (v / tope) * altoUtil,
      ticks: [0, 1, 2, 3, 4].map((n) => n * paso),
    };
  }, [datos, series, ancho]);

  const camino = (clave) => datos.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[clave]).toFixed(1)}`).join(' ');
  const cadaN = Math.ceil(datos.length / Math.max(2, Math.floor(ancho / 90)));

  const alMover = (evento) => {
    const caja = evento.currentTarget.getBoundingClientRect();
    const posicion = evento.clientX - caja.left;
    let cercano = 0;
    datos.forEach((_, i) => { if (Math.abs(x(i) - posicion) < Math.abs(x(cercano) - posicion)) cercano = i; });
    setActivo(cercano);
  };

  const dato = activo !== null ? datos[activo] : null;

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft" aria-label="Leyenda">
        {series.map((s) => (
          <li key={s.clave} className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} aria-hidden /> {s.etiqueta}
          </li>
        ))}
      </ul>
      <div ref={contenedor} className="relative">
        <svg width={ancho} height={ALTO} role="img" aria-label={`Gráfico de ${series.map((s) => s.etiqueta).join(', ')} por día`}
          onMouseMove={alMover} onMouseLeave={() => setActivo(null)} className="block touch-none select-none">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t ? '3 4' : undefined} />
              <text x={MARGEN.izquierda - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[11px]">{dineroCorto(t)}</text>
            </g>
          ))}
          {datos.map((d, i) => (i % cadaN === 0 || i === datos.length - 1) && (
            <text key={d.dia} x={x(i)} y={ALTO - 8} textAnchor={i === 0 ? 'start' : i === datos.length - 1 ? 'end' : 'middle'} className="fill-muted font-mono text-[11px]">{etiquetaDia(d.dia)}</text>
          ))}
          {dato && <line x1={x(activo)} x2={x(activo)} y1={MARGEN.arriba} y2={ALTO - MARGEN.abajo} stroke="var(--color-ink)" strokeOpacity="0.25" />}
          {series.map((s) => (
            <path key={s.clave} d={camino(s.clave)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {dato && series.map((s) => (
            <circle key={s.clave} cx={x(activo)} cy={y(dato[s.clave])} r="4.5" fill={s.color} stroke="var(--color-panel)" strokeWidth="2" />
          ))}
        </svg>
        {dato && (
          <div className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-xl bg-ink px-3 py-2.5 text-xs text-paper shadow-lift"
            style={{ left: Math.min(Math.max(x(activo) - 88, 0), ancho - 180) }}>
            <p className="mb-1.5 font-mono text-paper/60">{etiquetaDia(dato.dia)}</p>
            {series.map((s) => (
              <p key={s.clave} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />{s.etiqueta}</span>
                <span className="font-mono font-bold">{formatMoney(dato[s.clave])}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
