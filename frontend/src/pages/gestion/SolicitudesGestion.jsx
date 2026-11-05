// Solicitudes de informe de los clientes: el admin revisa la vista previa y aprueba
// (se envía por correo) o rechaza con un motivo.
import { useCallback, useState } from 'react';
import { Check, Eye, FileCheck, X } from 'lucide-react';
import { gestionService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useToast } from '../../hooks/useToast.js';
import { formatDateTime } from '../../utils/format.js';
import { PageHeader, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { TextArea } from '../../components/ui/Field.jsx';
import { EstadoBadge } from '../../components/ui/Badges.jsx';
import { VistaCorreo } from '../../components/gestion/VistaCorreo.jsx';

const ESTILO = { Pendiente: 'bg-st-diagnostico-soft text-[#8a5d00]', Aprobada: 'bg-st-reparado-soft text-st-reparado', Rechazada: 'bg-danger-soft text-danger' };

const Revisar = ({ solicitud, onCerrar, onListo }) => {
  const toast = useToast();
  const cargar = useCallback(async () => (await gestionService.vistaPreviaSolicitud(solicitud.id)).data, [solicitud.id]);
  const { datos: vista } = useCargaAsync(cargar);
  const [modo, setModo] = useState('aprobar');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    setEnviando(true);
    try {
      const r = modo === 'aprobar' ? await gestionService.aprobarSolicitud(solicitud.id, texto) : await gestionService.rechazarSolicitud(solicitud.id, texto);
      toast.exito(r.message);
      onListo();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto onClose={onCerrar} ancho="sm:max-w-3xl" titulo={`Informe ${solicitud.orden} · ${solicitud.cliente}`} descripcion={solicitud.mensaje ? `“${solicitud.mensaje}”` : 'Sin mensaje del cliente'}>
      <div className="space-y-4">
        {vista ? <VistaCorreo html={vista.html} titulo="Vista previa del informe" /> : <Skeleton className="h-96" />}
        {solicitud.estado === 'Pendiente' && (
          <>
            <div className="inline-flex rounded-xl border border-line bg-panel p-1">
              {[['aprobar', 'Aprobar y enviar'], ['rechazar', 'Rechazar']].map(([id, t]) => (
                <button key={id} type="button" aria-pressed={modo === id} onClick={() => setModo(id)}
                  className={`h-9 rounded-lg px-3 text-sm font-semibold transition ${modo === id ? 'bg-ink text-paper' : 'text-ink-soft'}`}>{t}</button>
              ))}
            </div>
            <TextArea id="texto-revision" label={modo === 'aprobar' ? 'Nota para el cliente (opcional)' : 'Motivo del rechazo'} maxLength={500}
              hint={modo === 'aprobar' ? 'Se incluye al inicio del informe.' : 'El cliente lo recibe por correo.'} value={texto} onChange={(e) => setTexto(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variante="borde" onClick={onCerrar}>Cancelar</Button>
              <Button variante={modo === 'aprobar' ? 'senal' : 'peligro'} icono={modo === 'aprobar' ? Check : X} cargando={enviando} onClick={confirmar}
                disabled={modo === 'rechazar' && texto.trim().length < 5}>
                {modo === 'aprobar' ? `Enviar a ${solicitud.correo}` : 'Rechazar solicitud'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export const SolicitudesGestion = () => {
  const [filtro, setFiltro] = useState('Pendiente');
  const [revisando, setRevisando] = useState(null);
  const cargar = useCallback(() => gestionService.solicitudes(filtro || undefined), [filtro]);
  const { datos, error, recargar } = useCargaAsync(cargar);

  return (
    <div className="animate-rise">
      <PageHeader etiqueta="Portal de clientes" titulo="Solicitudes de informe" descripcion="Los clientes piden el informe de su equipo; tú decides si se envía. Revisa la vista previa antes de aprobar." />
      <div className="mb-5 inline-flex rounded-xl border border-line bg-panel p-1">
        {['Pendiente', 'Aprobada', 'Rechazada', ''].map((f) => (
          <button key={f || 'todas'} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)}
            className={`h-9 rounded-lg px-3 text-sm font-semibold transition ${filtro === f ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>{f ? `${f}s` : 'Todas'}</button>
        ))}
      </div>

      {error && <ErrorState mensaje={error} onRetry={recargar} />}
      {!datos && !error && <Skeleton className="h-48" />}
      {datos && datos.data.length === 0 && <EmptyState icono={FileCheck} titulo="Sin solicitudes" texto={filtro === 'Pendiente' ? 'No hay informes esperando tu aprobación.' : 'No hay solicitudes en este filtro.'} />}
      {datos && datos.data.length > 0 && (
        <ul className="space-y-3">
          {datos.data.map((s, i) => (
            <li key={s.id} style={{ animationDelay: `${i * 40}ms` }} className="flex animate-rise flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-panel p-4 shadow-ticket transition hover:shadow-lift">
              <span className="font-mono font-bold text-signal-deep">{s.orden}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.cliente} <span className="font-normal text-muted">· {s.marca_modelo}</span></p>
                <p className="truncate text-sm text-muted">{s.mensaje ? `“${s.mensaje}”` : 'Sin mensaje'} · {formatDateTime(s.created_at)}</p>
                {s.respuesta_admin && <p className="text-sm text-ink-soft">Respuesta: {s.respuesta_admin}{s.revisor ? ` (${s.revisor})` : ''}</p>}
              </div>
              <EstadoBadge estado={s.estado_orden} />
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO[s.estado]}`}>{s.estado}</span>
              <Button tamano="sm" variante={s.estado === 'Pendiente' ? 'senal' : 'borde'} icono={Eye} onClick={() => setRevisando(s)}>{s.estado === 'Pendiente' ? 'Revisar' : 'Ver informe'}</Button>
            </li>
          ))}
        </ul>
      )}
      {revisando && <Revisar solicitud={revisando} onCerrar={() => setRevisando(null)} onListo={() => { setRevisando(null); recargar(); }} />}
    </div>
  );
};
