// Facturas: lo facturado, lo pendiente de facturar (entregado sin factura) y acciones por factura.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, ExternalLink, FilePlus2, Receipt, Send } from 'lucide-react';
import { gestionService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useToast } from '../../hooks/useToast.js';
import { coincide, formatDateTime, formatMoney } from '../../utils/format.js';
import { formatearCedula } from '../../utils/cedula.js';
import { EmptyState, ErrorState, PageHeader } from '../../components/ui/Feedback.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';

const cargar = () => Promise.all([gestionService.facturas(), gestionService.facturables()]);

const Cifra = ({ etiqueta, valor, destacado }) => (
  <div className={`rounded-3xl p-5 ${destacado ? 'bg-ink text-paper shadow-lift' : 'border border-line bg-panel shadow-ticket'}`}>
    <p className={`font-mono text-[10px] font-bold tracking-[0.16em] uppercase ${destacado ? 'text-paper/55' : 'text-muted'}`}>{etiqueta}</p>
    <p className={`mt-3 font-display text-3xl leading-none font-extrabold ${destacado ? 'text-signal' : ''}`}>{valor}</p>
  </div>
);

export const FacturasGestion = () => {
  const toast = useToast();
  const { datos, error, recargar } = useCargaAsync(cargar);
  const [busqueda, setBusqueda] = useState('');
  const [ocupado, setOcupado] = useState(null);
  const [anular, setAnular] = useState(null);

  const accion = async (clave, fn) => {
    setOcupado(clave);
    try {
      toast.exito((await fn()).message);
      recargar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setOcupado(null);
    }
  };

  if (error) return <ErrorState mensaje={error} onRetry={recargar} />;

  const [facturas, facturables] = datos ?? [];
  const lista = (facturas?.data ?? []).filter((f) => coincide(busqueda, f.consecutivo, f.cliente_nombre, f.cliente_identificacion, f.notas));
  const pendientes = facturables ? [...facturables.data.pedidos.map((p) => ({ ...p, tipo: 'pedido' })), ...facturables.data.ordenes.map((o) => ({ ...o, tipo: 'orden' }))] : [];

  return (
    <div className="animate-rise">
      <PageHeader etiqueta="Gestión" titulo="Facturas" descripcion="Comprobantes de la tienda y del taller. Se emiten solos al entregar (si la regla está activa) o desde aquí." />

      {!datos ? <Skeleton className="h-96" /> : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Cifra destacado etiqueta="Total facturado" valor={formatMoney(facturas.resumen.monto)} />
            <Cifra etiqueta="IVA cobrado" valor={formatMoney(Math.round(facturas.resumen.iva))} />
            <Cifra etiqueta="Facturas vigentes" valor={facturas.resumen.emitidas} />
          </div>

          {pendientes.length > 0 && (
            <section className="rounded-3xl border border-st-diagnostico/40 bg-st-diagnostico-soft/60 p-5 sm:p-6">
              <h2 className="text-lg font-bold">Entregados sin factura <span className="font-mono text-sm text-muted">· {pendientes.length}</span></h2>
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {pendientes.map((p) => (
                  <li key={`${p.tipo}-${p.id}`} className="flex items-center gap-3 rounded-2xl bg-panel p-3 text-sm">
                    <span className="font-mono font-bold text-signal-deep">{p.codigo}</span>
                    <span className="min-w-0 flex-1 truncate">{p.cliente}{p.marca_modelo ? ` · ${p.marca_modelo}` : ''}</span>
                    {p.total && <span className="font-mono">{formatMoney(p.total)}</span>}
                    <Button tamano="sm" variante="senal" icono={FilePlus2} cargando={ocupado === `emitir-${p.tipo}-${p.id}`}
                      onClick={() => accion(`emitir-${p.tipo}-${p.id}`, () => gestionService.emitirFactura(p.tipo, p.id))}>Facturar</Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-3xl border border-line bg-panel p-5 shadow-ticket sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold">Facturas emitidas</h2>
              <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Consecutivo, cliente o cédula" etiqueta="Buscar facturas" className="sm:w-80" />
            </div>
            {lista.length === 0 ? (
              <EmptyState icono={Receipt} titulo="Sin facturas" texto={busqueda ? 'Nada coincide con la búsqueda.' : 'Cuando entregues un pedido o un equipo, la factura aparecerá aquí.'} />
            ) : (
              <ul className="divide-y divide-line">
                {lista.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
                    <span className="w-32 font-mono font-bold">{f.consecutivo}</span>
                    <span className="min-w-40 flex-1">
                      <span className="block font-medium">{f.cliente_nombre}</span>
                      <span className="block text-xs text-muted">
                        {f.cliente_identificacion ? formatearCedula(f.cliente_identificacion) : 'Consumidor final'} · {f.tipo === 'pedido' ? 'Tienda' : 'Taller'} · {formatDateTime(f.created_at)}
                      </span>
                    </span>
                    <span className="font-mono font-semibold">{formatMoney(f.total)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${f.estado === 'Emitida' ? 'bg-st-reparado-soft text-st-reparado' : 'bg-danger-soft text-danger'}`}>{f.estado}</span>
                    <span className="flex gap-1">
                      <Link to={`/documentos/factura/${f.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-ink-soft hover:bg-paper-deep">
                        <ExternalLink className="size-3.5" aria-hidden /> Ver
                      </Link>
                      {f.estado === 'Emitida' && (
                        <>
                          <Button tamano="sm" variante="fantasma" icono={Send} cargando={ocupado === `enviar-${f.id}`} onClick={() => accion(`enviar-${f.id}`, () => gestionService.reenviarFactura(f.id))}>Enviar</Button>
                          <Button tamano="sm" variante="fantasma" icono={Ban} onClick={() => setAnular(f)}>Anular</Button>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        abierto={Boolean(anular)}
        titulo={`¿Anular la factura ${anular?.consecutivo}?`}
        mensaje="La factura queda marcada como anulada (no se borra) y deja de contar en lo facturado. Esta acción no se puede deshacer."
        textoConfirmar="Sí, anular"
        cargando={ocupado === 'anular'}
        onCancel={() => setAnular(null)}
        onConfirm={async () => { await accion('anular', () => gestionService.anularFactura(anular.id)); setAnular(null); }}
      />
    </div>
  );
};
