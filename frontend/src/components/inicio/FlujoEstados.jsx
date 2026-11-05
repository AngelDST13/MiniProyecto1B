// Sección "Flujo": los 4 estados de una orden, en orden simétrico (es información para decidir).
import { ESTADOS, ESTADO_ESTILO } from '../../constants/dominio.js';

const DETALLE = {
  Recibido: 'Se registra el equipo, su número de serie y el cliente al momento de dejarlo en el taller.',
  'En Diagnóstico': 'El técnico anota sus hallazgos en la bitácora y prepara la cotización.',
  Reparado: 'Los repuestos usados se descuentan del inventario y el cliente recibe el aviso.',
  Entregado: 'Se registra el pago, se emite la garantía y la orden queda cerrada.',
};

export const FlujoEstados = () => (
  <section id="flujo" className="scroll-mt-20 py-24 lg:py-32">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
      <div className="revelar max-w-2xl">
        <p className="font-mono text-xs font-bold tracking-[0.2em] text-signal-deep uppercase">01 · Flujo de trabajo</p>
        <h2 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1] font-extrabold">Cuatro estados. Ningún equipo se pierde.</h2>
      </div>

      <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
        {/* Línea que une los pasos (solo en escritorio) */}
        <span className="absolute top-[26px] right-[12%] left-[12%] hidden h-px bg-line-strong md:block" aria-hidden />
        {ESTADOS.map((estado, indice) => {
          const estilo = ESTADO_ESTILO[estado];
          return (
            <li key={estado} className="revelar relative" style={{ '--retraso': `${indice * 90}ms` }}>
              <span className={`relative grid size-[52px] place-items-center rounded-2xl font-mono text-lg font-bold text-white ${estilo.dot}`}>
                {String(indice + 1).padStart(2, '0')}
              </span>
              <h3 className={`mt-6 text-xl font-bold ${estilo.text}`}>{estado}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{DETALLE[estado]}</p>
            </li>
          );
        })}
      </ol>
    </div>
  </section>
);
