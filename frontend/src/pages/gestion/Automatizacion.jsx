// Automatización: configuración del informe diario y avisos, estado del correo (Gmail),
// vista previa del informe y registro de todos los correos enviados.
import { useCallback, useState } from 'react';
import { CircleCheck, Eye, Mail, PlugZap, Send, Sparkles, TriangleAlert } from 'lucide-react';
import { gestionService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useToast } from '../../hooks/useToast.js';
import { formatDateTime } from '../../utils/format.js';
import { PageHeader, ErrorState } from '../../components/ui/Feedback.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { TextInput } from '../../components/ui/Field.jsx';
import { Toggle } from '../../components/ui/Toggle.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { VistaCorreo } from '../../components/gestion/VistaCorreo.jsx';
import { ReglasAutomaticas } from '../../components/gestion/ReglasAutomaticas.jsx';

const cargarConfig = () => gestionService.configuracion();
const TIPOS = { verificacion: 'Confirmar correo', recuperacion: 'Recuperar clave', codigo_2fa: 'Código 2FA', nuevo_inicio: 'Nuevo inicio', cuenta_bloqueada: 'Cuenta bloqueada', pedido_recibido: 'Pedido recibido', pedido_estado: 'Estado de pedido', informe_cliente: 'Informe a cliente', solicitud_rechazada: 'Solicitud rechazada', informe_diario: 'Informe diario', factura: 'Factura', recordatorio_cita: 'Recordatorio de cita', alerta_stock: 'Alerta de stock', pedido_cancelado_auto: 'Pedido cancelado' };
const ESTILO_ESTADO = { Enviado: 'bg-st-reparado-soft text-st-reparado', Simulado: 'bg-st-recibido-soft text-st-recibido', Error: 'bg-danger-soft text-danger' };

const Tarjeta = ({ titulo, descripcion, children, className = '' }) => (
  <section className={`rounded-3xl border border-line bg-panel p-5 shadow-ticket sm:p-6 ${className}`}>
    <h2 className="text-lg font-bold">{titulo}</h2>
    {descripcion && <p className="mt-1 text-sm text-muted">{descripcion}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const Configuracion = ({ inicial, onGuardado }) => {
  const toast = useToast();
  const [valores, setValores] = useState(() => Object.fromEntries(inicial.map((c) => [c.clave, c.valor])));
  const [guardando, setGuardando] = useState(false);
  const campos = Object.fromEntries(inicial.map((c) => [c.clave, c]));
  const poner = (clave, valor) => setValores((v) => ({ ...v, [clave]: valor }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await gestionService.guardarConfiguracion(valores);
      toast.exito('Configuración guardada');
      onGuardado();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-4">
      <Toggle id="cfg-activo" label={campos.informe_diario_activo.etiqueta} checked={valores.informe_diario_activo === '1'} onChange={(v) => poner('informe_diario_activo', v ? '1' : '0')} />
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <TextInput id="cfg-hora" type="time" label="Hora de envío" value={valores.informe_diario_hora} onChange={(e) => poner('informe_diario_hora', e.target.value)} />
        <TextInput id="cfg-dest" label="Destinatarios" placeholder="vacío = todos los administradores" hint="Separa varios correos con comas."
          value={valores.informe_diario_destinatarios} onChange={(e) => poner('informe_diario_destinatarios', e.target.value)} />
      </div>
      <Toggle id="cfg-aviso" label={campos.notificar_inicio_sesion.etiqueta} checked={valores.notificar_inicio_sesion === '1'} onChange={(v) => poner('notificar_inicio_sesion', v ? '1' : '0')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput id="cfg-envio" type="number" min="0" step="100" label="Costo de envío (₡)" value={valores.tienda_costo_envio} onChange={(e) => poner('tienda_costo_envio', e.target.value)} />
        <TextInput id="cfg-gratis" type="number" min="0" step="1000" label="Envío gratis desde (₡)" value={valores.tienda_envio_gratis_desde} onChange={(e) => poner('tienda_envio_gratis_desde', e.target.value)} />
      </div>
      <Button type="submit" cargando={guardando}>Guardar configuración</Button>
    </form>
  );
};

export const Automatizacion = () => {
  const toast = useToast();
  const config = useCargaAsync(cargarConfig);
  const [tipo, setTipo] = useState('');
  const cargarCorreos = useCallback(() => gestionService.correos(tipo || undefined), [tipo]);
  const correos = useCargaAsync(cargarCorreos);
  const [vista, setVista] = useState(null);
  const [ocupado, setOcupado] = useState(null);

  const accion = async (nombre, fn) => {
    setOcupado(nombre);
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setOcupado(null);
    }
  };

  const probar = () => accion('probar', async () => {
    const { data } = await gestionService.probarCorreo();
    if (data.ok) toast.exito(data.mensaje);
    else toast.error(data.mensaje);
  });
  const previa = (conIA = false) => accion(conIA ? 'previa-ia' : 'previa', async () => {
    const { data } = await gestionService.vistaPreviaInforme(conIA);
    if (conIA && !data.analisisIA) toast.error('La IA no está disponible ahora mismo (revisa la API key o el saldo). El informe se envía sin esa sección.');
    setVista({ titulo: 'Informe diario (vista previa)', html: data.html });
  });
  const enviarAhora = () => accion('enviar', async () => { toast.exito((await gestionService.enviarInforme()).message); correos.recargar(); });
  const abrirCorreo = (id) => accion(`correo-${id}`, async () => {
    const { data } = await gestionService.correo(id);
    setVista({ titulo: data.asunto, html: data.html ?? '<p>Sin contenido</p>' });
  });

  const smtp = config.datos?.smtpConfigurado;

  return (
    <div className="animate-rise">
      <PageHeader etiqueta="Gestión" titulo="Automatización" descripcion="Reglas que trabajan solas, informes diarios, avisos por correo y el registro de cada mensaje que envía el sistema." />

      <div className="mb-4"><ReglasAutomaticas /></div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Tarjeta titulo="Informe diario y avisos" descripcion="Se envía solo a la hora configurada (zona horaria del taller).">
          {config.error && <ErrorState mensaje={config.error} onRetry={config.recargar} />}
          {!config.datos && !config.error && <Skeleton className="h-64" />}
          {config.datos && <Configuracion inicial={config.datos.data} onGuardado={config.recargar} />}
        </Tarjeta>

        <div className="space-y-4">
          <Tarjeta titulo="Servidor de correo">
            {config.datos && (
              <div className={`flex items-start gap-3 rounded-2xl p-4 ${smtp ? 'bg-st-reparado-soft text-st-reparado' : 'bg-st-diagnostico-soft text-[#7a5200]'}`}>
                {smtp ? <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden /> : <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />}
                <p className="text-sm">
                  {smtp ? 'Gmail configurado: los correos se envían de verdad.' : (
                    <>Modo de prueba: los correos <strong>no salen</strong>, solo se registran aquí. Para activarlos, agrega <code className="font-mono">SMTP_USER</code> y <code className="font-mono">SMTP_PASS</code> (contraseña de aplicación de Google) al <code className="font-mono">.env</code>.</>
                  )}
                </p>
              </div>
            )}
            <Button variante="borde" icono={PlugZap} className="mt-4" cargando={ocupado === 'probar'} onClick={probar}>Probar conexión</Button>
          </Tarjeta>
          <Tarjeta titulo="Informe de hoy" descripcion="Revísalo o envíalo ahora sin esperar la hora programada.">
            <div className="flex flex-wrap gap-2">
              <Button variante="borde" icono={Eye} cargando={ocupado === 'previa'} onClick={() => previa(false)}>Vista previa</Button>
              <Button variante="borde" icono={Sparkles} cargando={ocupado === 'previa-ia'} onClick={() => previa(true)}>Con análisis IA</Button>
              <Button variante="senal" icono={Send} cargando={ocupado === 'enviar'} onClick={enviarAhora}>Enviar ahora</Button>
            </div>
          </Tarjeta>
        </div>
      </div>

      <section className="mt-4 rounded-3xl border border-line bg-panel p-5 shadow-ticket sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Correos enviados</h2>
          <label className="sr-only" htmlFor="tipo-correo">Tipo</label>
          <select id="tipo-correo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-10 rounded-xl border border-line bg-panel px-3 text-sm font-semibold">
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
        {!correos.datos ? <Skeleton className="h-40" /> : correos.datos.data.length === 0 ? (
          <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted">Todavía no se han enviado correos.</p>
        ) : (
          <ul className="divide-y divide-line">
            {correos.datos.data.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm">
                <Mail className="size-4 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.asunto}</span>
                  <span className="block truncate text-xs text-muted">{c.destinatario} · {formatDateTime(c.fecha)}{c.error ? ` · ${c.error}` : ''}</span>
                </span>
                <span className="rounded-md bg-paper-deep px-2 py-0.5 font-mono text-[11px]">{TIPOS[c.tipo] ?? c.tipo}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTILO_ESTADO[c.estado]}`}>{c.estado}</span>
                <Button variante="fantasma" tamano="sm" icono={Eye} cargando={ocupado === `correo-${c.id}`} onClick={() => abrirCorreo(c.id)}>Ver</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {vista && (
        <Modal abierto onClose={() => setVista(null)} ancho="sm:max-w-3xl" titulo={vista.titulo}>
          <VistaCorreo html={vista.html} />
        </Modal>
      )}
    </div>
  );
};
