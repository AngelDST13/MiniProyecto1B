// Botón oficial "Continuar con Google" (Google Identity Services).
// Solo aparece si el backend tiene configurado GOOGLE_CLIENT_ID.
import { useEffect, useRef, useState } from 'react';
import { authService } from '../../services/authService.js';

const SCRIPT_GOOGLE = 'https://accounts.google.com/gsi/client';

const cargarScript = () =>
  new Promise((resolver, rechazar) => {
    if (window.google?.accounts?.id) return resolver();
    const existente = document.querySelector(`script[src="${SCRIPT_GOOGLE}"]`);
    const script = existente ?? Object.assign(document.createElement('script'), { src: SCRIPT_GOOGLE, async: true, defer: true });
    script.addEventListener('load', () => resolver());
    script.addEventListener('error', () => rechazar(new Error('No se pudo cargar Google')));
    if (!existente) document.head.appendChild(script);
  });

export const BotonGoogle = ({ onCredencial, texto = 'continue_with' }) => {
  const contenedor = useRef(null);
  const callbackRef = useRef(onCredencial);
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredencial;
  }, [onCredencial]);

  useEffect(() => {
    let activo = true;
    authService
      .config()
      .then(async ({ googleClientId }) => {
        if (!googleClientId || !activo) return;
        await cargarScript();
        if (!activo || !contenedor.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (respuesta) => callbackRef.current(respuesta.credential),
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(contenedor.current, {
          theme: 'outline', size: 'large', shape: 'pill', text: texto, width: contenedor.current.offsetWidth || 360, locale: 'es',
        });
        setDisponible(true);
      })
      .catch(() => {}); // Sin Google configurado (o sin conexión) simplemente no se muestra el botón
    return () => { activo = false; };
  }, [texto]);

  return (
    <div className={disponible ? '' : 'hidden'}>
      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> o <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={contenedor} className="flex min-h-11 w-full justify-center" />
    </div>
  );
};
