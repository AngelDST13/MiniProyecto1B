// Barra que muestra qué tan segura es la contraseña mientras se escribe.
import { fuerzaPassword } from '../../utils/cedula.js';

const COLORES = ['bg-line', 'bg-danger', 'bg-st-diagnostico', 'bg-st-recibido', 'bg-st-reparado'];

export const MedidorPassword = ({ password }) => {
  const { nivel, texto } = fuerzaPassword(password);
  if (!password) return null;
  return (
    <div className="-mt-1" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= nivel ? COLORES[nivel] : 'bg-paper-deep'}`} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">
        Seguridad: <span className="font-semibold text-ink-soft">{texto}</span>
        {nivel < 3 && ' · usa 12+ caracteres, mayúsculas y símbolos'}
      </p>
    </div>
  );
};
