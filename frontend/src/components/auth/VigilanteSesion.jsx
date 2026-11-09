// Cierre de sesión por inactividad.
//  - Mientras el usuario usa la app, el token (válido 15 min) se renueva en segundo plano.
//  - Al minuto 14 sin actividad aparece un aviso con cuenta regresiva.
//  - Al minuto 15 se cierra la sesión. Funciona entre pestañas: la actividad en una cuenta para todas.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { tokenStorage } from '../../services/api.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

const CLAVE_ACTIVIDAD = 'bancada.ultima-actividad';
const EVENTOS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
const RENOVAR_CADA_MS = 4 * 60_000;
const AVISO_ANTES_MS = 60_000;
const REVISAR_CADA_MS = 5_000;

const leerActividad = () => {
  try {
    return Number(localStorage.getItem(CLAVE_ACTIVIDAD)) || Date.now();
  } catch {
    return Date.now();
  }
};
const guardarActividad = (momento) => {
  try {
    localStorage.setItem(CLAVE_ACTIVIDAD, String(momento));
  } catch { /* sin almacenamiento: se usa solo la referencia en memoria */ }
};

export const VigilanteSesion = ({ minutos = 15, onCerrar }) => {
  const limiteMs = minutos * 60_000;
  const ultimaActividad = useRef(0); // se inicializa al montar (efecto)
  const ultimaRenovacion = useRef(0); // 0 = renovar con la primera actividad (p. ej. tras recargar la página)
  const renovando = useRef(false);
  const avisoVisible = useRef(false);
  const [restante, setRestante] = useState(null); // segundos para el cierre mientras se muestra el aviso

  const renovar = useCallback(async () => {
    if (renovando.current) return;
    renovando.current = true;
    try {
      const { token } = await authService.renovar();
      tokenStorage.set(token);
      ultimaRenovacion.current = Date.now();
    } catch {
      // Si falla por 401, el cliente HTTP ya avisa y se cierra la sesión.
    } finally {
      renovando.current = false;
    }
  }, []);

  const registrarActividad = useCallback(() => {
    if (avisoVisible.current) return; // con el aviso abierto, solo cuenta el botón "Seguir conectado"
    const ahora = Date.now();
    if (ahora - ultimaActividad.current < 1000) return; // evita escribir en cada movimiento del mouse
    ultimaActividad.current = ahora;
    guardarActividad(ahora);
    if (ahora - ultimaRenovacion.current > RENOVAR_CADA_MS) renovar();
  }, [renovar]);

  useEffect(() => {
    ultimaActividad.current = Date.now();
    guardarActividad(ultimaActividad.current);
    EVENTOS.forEach((e) => window.addEventListener(e, registrarActividad, { passive: true }));

    const revisar = () => {
      const actividad = Math.max(ultimaActividad.current, leerActividad());
      ultimaActividad.current = actividad;
      const inactivo = Date.now() - actividad;
      if (inactivo >= limiteMs) {
        onCerrar();
        return;
      }
      const mostrar = inactivo >= limiteMs - AVISO_ANTES_MS;
      avisoVisible.current = mostrar;
      setRestante(mostrar ? Math.ceil((limiteMs - inactivo) / 1000) : null);
    };
    const intervalo = window.setInterval(revisar, REVISAR_CADA_MS);
    // Otra pestaña registró actividad: se oculta el aviso aquí también
    const alCambiarOtraPestana = (e) => e.key === CLAVE_ACTIVIDAD && revisar();
    window.addEventListener('storage', alCambiarOtraPestana);

    return () => {
      EVENTOS.forEach((e) => window.removeEventListener(e, registrarActividad));
      window.clearInterval(intervalo);
      window.removeEventListener('storage', alCambiarOtraPestana);
    };
  }, [limiteMs, onCerrar, registrarActividad]);

  // Cuenta regresiva de segundo en segundo mientras el aviso está visible
  useEffect(() => {
    if (restante === null) return undefined;
    const t = window.setTimeout(() => setRestante((s) => (s > 1 ? s - 1 : s)), 1000);
    return () => window.clearTimeout(t);
  }, [restante]);

  const seguir = () => {
    avisoVisible.current = false;
    ultimaActividad.current = Date.now();
    guardarActividad(ultimaActividad.current);
    setRestante(null);
    renovar();
  };

  return (
    <Modal
      abierto={restante !== null}
      onClose={seguir}
      titulo="¿Sigues ahí?"
      descripcion="Por seguridad, la sesión se cierra tras 15 minutos sin actividad."
      pie={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variante="borde" onClick={onCerrar}>Cerrar sesión</Button>
          <Button variante="senal" onClick={seguir}>Seguir conectado</Button>
        </div>
      }
    >
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-st-diagnostico-soft text-[#7a5200]"><Clock className="size-7" aria-hidden /></span>
        <p className="text-ink-soft" aria-live="polite">
          Tu sesión se cerrará en <strong className="font-mono text-2xl text-ink">{restante ?? 0}</strong> segundos.
        </p>
      </div>
    </Modal>
  );
};
