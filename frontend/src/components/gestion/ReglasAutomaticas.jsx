// Reglas automáticas (facturación, garantías, pedidos sin pago, recordatorios, stock, IA)
// y los datos de la empresa que salen en facturas, informes y correos.
import { useCallback, useState } from 'react';
import { Building2, CalendarClock, Clock3, FileText, PackageX, Play, ShieldCheck, Sparkles, Timer } from 'lucide-react';
import { gestionService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useToast } from '../../hooks/useToast.js';
import { formatDateTime } from '../../utils/format.js';
import { Button } from '../ui/Button.jsx';
import { TextInput } from '../ui/Field.jsx';
import { Skeleton } from '../ui/Loader.jsx';

const REGLAS = [
  { clave: 'auto_factura', icono: FileText, titulo: 'Facturación automática', texto: 'Al marcar un pedido o un equipo como "Entregado" se emite la factura y se envía al cliente.' },
  { clave: 'auto_cancelar_pedidos_horas', icono: Timer, titulo: 'Pedidos sin pago', texto: 'Los pedidos pendientes se cancelan y el stock regresa al inventario después de estas horas.', numero: true },
  { clave: 'auto_vencer_garantias', icono: ShieldCheck, titulo: 'Vencimiento de garantías', texto: 'Cada hora marca como vencidas las garantías cuya fecha de fin ya pasó.' },
  { clave: 'auto_recordatorio_citas', icono: CalendarClock, titulo: 'Recordatorio de citas', texto: 'A las 8:00 se escribe a cada cliente con cita programada para el día siguiente.' },
  { clave: 'auto_alerta_stock', icono: PackageX, titulo: 'Alerta de stock', texto: 'Después de cada venta, avisa a los administradores si un producto quedó con 2 unidades o menos.' },
  { clave: 'informe_diario_ia', icono: Sparkles, titulo: 'Resumen con IA en el informe diario', texto: 'Agrega un párrafo de análisis escrito por Claude. Si la IA no está disponible, el informe sale igual.' },
];

const EMPRESA = [
  ['empresa_nombre', 'Razón social', 'sm:col-span-2'],
  ['empresa_cedula_juridica', 'Cédula jurídica'],
  ['empresa_telefono', 'Teléfono'],
  ['empresa_correo', 'Correo de facturación'],
  ['empresa_sinpe', 'SINPE Móvil'],
  ['empresa_iban', 'Cuenta IBAN', 'sm:col-span-2'],
  ['empresa_direccion', 'Dirección', 'sm:col-span-2'],
  ['iva_porcentaje', 'IVA (%)'],
];

const cargarEstado = () => gestionService.automatizacion();

const Interruptor = ({ activo, onCambiar, etiqueta }) => (
  <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} onClick={() => onCambiar(!activo)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition ${activo ? 'bg-st-reparado' : 'bg-line-strong'}`}>
    <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-5' : ''}`} />
  </button>
);

export const ReglasAutomaticas = () => {
  const toast = useToast();
  const { datos, error, recargar, setDatos } = useCargaAsync(cargarEstado);
  const [ejecutando, setEjecutando] = useState(false);
  const [guardandoEmpresa, setGuardandoEmpresa] = useState(false);
  const [empresa, setEmpresa] = useState(null); // borrador del formulario (null = usa lo guardado)

  const valores = Object.fromEntries((datos?.data.configuracion ?? []).map((c) => [c.clave, c.valor]));
  const ultimas = datos?.data.ultimas ?? {};

  const guardar = useCallback(async (cambios) => {
    try {
      const { data } = await gestionService.guardarConfiguracion(cambios);
      setDatos((previo) => ({ ...previo, data: { ...previo.data, configuracion: data } }));
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    }
  }, [setDatos, toast]);

  const cambiarRegla = async (clave, valor) => {
    if (await guardar({ [clave]: valor })) toast.exito('Regla actualizada');
  };

  const ejecutar = async () => {
    setEjecutando(true);
    try {
      const { data } = await gestionService.ejecutarAutomatizacion();
      setDatos((previo) => ({ ...previo, data: { ...previo.data, ultimas: data.ultimas } }));
      const r = data.resultados;
      toast.exito(`Listo: ${r.vencerGarantias ?? 0} garantías, ${r.cancelarPedidosVencidos ?? 0} pedidos, ${r.recordarCitas ?? 0} recordatorios${r.facturas !== undefined ? `, ${r.facturas} facturas` : ''}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEjecutando(false);
    }
  };

  const guardarEmpresa = async (e) => {
    e.preventDefault();
    setGuardandoEmpresa(true);
    if (await guardar(empresa)) {
      toast.exito('Datos de la empresa guardados');
      setEmpresa(null);
    }
    setGuardandoEmpresa(false);
  };

  if (error) return <p className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">{error} <button type="button" className="underline" onClick={recargar}>Reintentar</button></p>;
  if (!datos) return <Skeleton className="h-96" />;

  const borrador = empresa ?? Object.fromEntries(EMPRESA.map(([clave]) => [clave, valores[clave] ?? '']));

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <section className="rounded-3xl border border-line bg-panel p-5 shadow-ticket sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Reglas automáticas</h2>
            <p className="text-sm text-muted">Corren solas cada hora. Puedes ejecutarlas ahora para probarlas.</p>
          </div>
          <Button variante="borde" icono={Play} cargando={ejecutando} onClick={ejecutar}>Ejecutar ahora</Button>
        </div>
        <ul className="divide-y divide-line">
          {REGLAS.map(({ clave, icono: Icono, titulo, texto, numero }) => {
            const ultima = ultimas[clave];
            const activa = numero ? Number(valores[clave]) > 0 : valores[clave] === '1';
            return (
              <li key={clave} className="flex gap-3 py-4">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition ${activa ? 'bg-signal-soft text-signal-deep' : 'bg-paper-deep text-muted'}`}><Icono className="size-5" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{titulo}</p>
                  <p className="text-sm text-muted">{texto}</p>
                  {ultima && <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-ink-soft"><Clock3 className="size-3" aria-hidden />{formatDateTime(ultima.fecha.slice(0, 19).replace('T', ' '))} · {ultima.resultado}</p>}
                </div>
                {numero ? (
                  <label className="flex items-center gap-2 self-center text-sm">
                    <span className="sr-only">{titulo} (horas)</span>
                    <input type="number" min="0" max="720" defaultValue={valores[clave]} key={valores[clave]}
                      onBlur={(e) => e.target.value !== valores[clave] && cambiarRegla(clave, e.target.value)}
                      className="h-10 w-20 rounded-xl border border-line bg-panel px-2 text-right font-mono" />
                    <span className="text-muted">h</span>
                  </label>
                ) : (
                  <span className="self-center"><Interruptor activo={activa} etiqueta={titulo} onCambiar={(v) => cambiarRegla(clave, v ? '1' : '0')} /></span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-3xl border border-line bg-panel p-5 shadow-ticket sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-paper-deep"><Building2 className="size-5" aria-hidden /></span>
          <div>
            <h2 className="text-lg font-bold">Datos de la empresa</h2>
            <p className="text-sm text-muted">Aparecen en facturas, informes, cotizaciones y correos.</p>
          </div>
        </div>
        <form onSubmit={guardarEmpresa} className="grid gap-3 sm:grid-cols-2">
          {EMPRESA.map(([clave, etiqueta, ancho = '']) => (
            <div key={clave} className={ancho}>
              <TextInput id={`emp-${clave}`} label={etiqueta} value={borrador[clave]} type={clave === 'iva_porcentaje' ? 'number' : 'text'}
                onChange={(e) => setEmpresa({ ...borrador, [clave]: e.target.value })} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" cargando={guardandoEmpresa} disabled={!empresa}>Guardar datos</Button>
          </div>
        </form>
      </section>
    </div>
  );
};
