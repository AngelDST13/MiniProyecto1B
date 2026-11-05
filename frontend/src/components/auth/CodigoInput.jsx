// Seis casillas para el código de verificación. Avanza solo, permite pegar el código completo
// y retroceder con Backspace.
import { useRef } from 'react';

const LARGO = 6;

export const CodigoInput = ({ valor, onChange, onCompleto, deshabilitado, error }) => {
  const refs = useRef([]);
  const digitos = valor.padEnd(LARGO, ' ').slice(0, LARGO).split('');

  const actualizar = (nuevo) => {
    const limpio = nuevo.replace(/\D/g, '').slice(0, LARGO);
    onChange(limpio);
    if (limpio.length === LARGO) onCompleto?.(limpio);
    return limpio;
  };

  const alEscribir = (indice, evento) => {
    const tecla = evento.target.value.replace(/\D/g, '');
    if (!tecla) return;
    const arreglo = valor.split('');
    arreglo[indice] = tecla.at(-1);
    const limpio = actualizar(arreglo.join(''));
    refs.current[Math.min(limpio.length, LARGO - 1)]?.focus();
  };

  const alPresionar = (indice, evento) => {
    if (evento.key === 'Backspace') {
      evento.preventDefault();
      actualizar(valor.slice(0, Math.max(0, valor[indice] ? indice : indice - 1)));
      refs.current[Math.max(0, indice - (valor[indice] ? 0 : 1))]?.focus();
    }
    if (evento.key === 'ArrowLeft') refs.current[Math.max(0, indice - 1)]?.focus();
    if (evento.key === 'ArrowRight') refs.current[Math.min(LARGO - 1, indice + 1)]?.focus();
  };

  const alPegar = (evento) => {
    evento.preventDefault();
    const limpio = actualizar(evento.clipboardData.getData('text'));
    refs.current[Math.min(limpio.length, LARGO - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Código de verificación de 6 dígitos">
      {digitos.map((digito, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Dígito ${i + 1}`}
          maxLength={2}
          value={digito.trim()}
          disabled={deshabilitado}
          autoFocus={i === 0}
          onChange={(e) => alEscribir(i, e)}
          onKeyDown={(e) => alPresionar(i, e)}
          onPaste={alPegar}
          onFocus={(e) => e.target.select()}
          className={`h-14 w-full min-w-0 rounded-xl border bg-panel text-center font-mono text-2xl font-bold transition focus:border-signal focus:ring-4 focus:ring-signal/15 focus:outline-none ${
            error ? 'border-danger' : digito.trim() ? 'border-ink' : 'border-line'
          }`}
        />
      ))}
    </div>
  );
};
