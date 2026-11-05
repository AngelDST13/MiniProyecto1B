// Medidor de stock en segmentos (como un indicador de batería del banco de trabajo).
import { STOCK_BAJO } from '../../constants/dominio.js';

const SEGMENTOS = 10;

export const StockMeter = ({ stock }) => {
  const llenos = Math.min(stock, SEGMENTOS);
  const agotado = stock === 0;
  const bajo = !agotado && stock <= STOCK_BAJO;
  const color = agotado ? 'bg-danger' : bajo ? 'bg-st-diagnostico' : 'bg-ink';

  let etiqueta = `${stock} en stock`;
  if (agotado) etiqueta = 'Agotado';
  else if (bajo) etiqueta = `Stock bajo · ${stock}`;

  return (
    <div>
      <div className="flex gap-0.75" role="meter" aria-valuenow={stock} aria-valuemin={0} aria-label="Stock disponible">
        {Array.from({ length: SEGMENTOS }, (_, indice) => (
          <span key={indice} className={`h-2 flex-1 rounded-xs ${indice < llenos ? color : 'bg-paper-deep'}`} />
        ))}
      </div>
      <p className={`mt-1.5 text-xs font-semibold ${agotado ? 'text-danger' : bajo ? 'text-[#8a5d00]' : 'text-muted'}`}>
        {etiqueta}
      </p>
    </div>
  );
};
