// Muestra el valor de un campo en tablas y tarjetas, con formato según su tipo.
import { formatDate, formatDateTime, formatMoney } from '../../utils/format.js';
import { tonoDeOpcion } from '../../constants/admin.js';

const Vacio = () => <span className="text-muted">—</span>;

export const ValorCelda = ({ campo, registro }) => {
  const valor = registro[campo.nombre];

  switch (campo.tipo) {
    case 'ref':
      return registro[`${campo.nombre}_etiqueta`] ? <span>{registro[`${campo.nombre}_etiqueta`]}</span> : <Vacio />;

    case 'booleano':
      return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${valor ? 'bg-st-reparado-soft text-st-reparado' : 'bg-paper-deep text-muted'}`}>
          {valor ? 'Sí' : 'No'}
        </span>
      );

    case 'opcion':
      return valor ? (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tonoDeOpcion(valor)}`}>{valor}</span>
      ) : <Vacio />;

    case 'decimal':
    case 'entero':
      if (valor === null || valor === undefined) return <Vacio />;
      return <span className="font-mono text-sm font-bold">{campo.moneda ? formatMoney(valor) : valor}</span>;

    case 'fecha':
      return valor ? <span className="font-mono text-sm whitespace-nowrap">{formatDate(valor)}</span> : <Vacio />;

    case 'fechaHora':
      return valor ? <span className="font-mono text-sm whitespace-nowrap">{formatDateTime(valor)}</span> : <Vacio />;

    case 'url':
      return valor ? (
        <a href={valor} target="_blank" rel="noopener noreferrer" className="text-signal-deep underline-offset-4 hover:underline">
          {valor.replace(/^https?:\/\//, '')}
        </a>
      ) : <Vacio />;

    case 'textoLargo':
      return valor ? <span className="line-clamp-2">{valor}</span> : <Vacio />;

    default:
      if (valor === null || valor === undefined || valor === '') return <Vacio />;
      return <span className={campo.mono ? 'font-mono text-sm' : ''}>{valor}</span>;
  }
};

// Texto plano del valor (para el buscador).
export const textoDeValor = (campo, registro) =>
  campo.tipo === 'ref' ? registro[`${campo.nombre}_etiqueta`] ?? '' : String(registro[campo.nombre] ?? '');
