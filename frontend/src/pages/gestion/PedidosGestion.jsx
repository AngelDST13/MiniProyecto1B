// Gestión de pedidos de la tienda: filtro por estado, búsqueda, detalle y cambio de estado
// (cada cambio avisa al cliente por correo).
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import { gestionService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useToast } from '../../hooks/useToast.js';
import { formatDateTime, formatMoney } from '../../utils/format.js';
import { PageHeader, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ProductoImagen } from '../../components/tienda/ProductoImagen.jsx';
import { EstadoPedido } from '../cuenta/SeccionesCuenta.jsx';

const ESTADOS = ['Pendiente', 'Confirmado', 'Preparando', 'Listo para retirar', 'Enviado', 'Entregado', 'Cancelado'];

const DetallePedido = ({ id, onCerrar, onCambio }) => {
  const toast = useToast();
  const cargar = useCallback(async () => (await gestionService.pedido(id)).data, [id]);
  const { datos: pedido, setDatos } = useCargaAsync(cargar);
  const [guardando, setGuardando] = useState(null);

  const cambiar = async (estado) => {
    setGuardando(estado);
    try {
      const r = await gestionService.cambiarEstadoPedido(id, estado);
      setDatos(r.data);
      onCambio();
      toast.exito(r.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <Modal abierto onClose={onCerrar} ancho="sm:max-w-2xl" titulo={pedido ? `Pedido ${pedido.codigo}` : 'Pedido'} descripcion={pedido ? `${pedido.cliente} · ${pedido.correo}` : undefined}>
      {!pedido ? <Skeleton className="h-60" /> : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-soft">Estado (el cliente recibe un correo en cada cambio)</p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS.map((e) => (
                <button key={e} type="button" disabled={pedido.estado === 'Cancelado' || e === pedido.estado || guardando !== null} onClick={() => cambiar(e)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${e === pedido.estado ? 'border-ink bg-ink text-paper' : 'border-line bg-panel hover:border-ink disabled:opacity-40'} ${guardando === e ? 'animate-pulse' : ''}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {pedido.items.map((it) => (
              <li key={it.producto_id} className="flex items-center gap-3 p-3">
                <ProductoImagen producto={it} tamano="sm" className="size-12 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1 text-sm"><span className="line-clamp-1 font-medium">{it.nombre_producto}</span><span className="font-mono text-xs text-muted">{it.cantidad} × {formatMoney(it.precio_unitario)}</span></span>
                <span className="font-mono text-sm font-bold">{formatMoney(it.cantidad * it.precio_unitario)}</span>
              </li>
            ))}
          </ul>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Cliente</dt><dd className="font-medium">{pedido.cliente} · CI {pedido.cedula ?? '—'}</dd></div>
            <div><dt className="text-muted">Teléfono</dt><dd className="font-medium"><a href={`tel:${pedido.telefono}`} className="text-signal-deep hover:underline">{pedido.telefono}</a></dd></div>
            <div><dt className="text-muted">Entrega</dt><dd className="font-medium">{pedido.tipo_entrega}{pedido.direccion ? ` · ${pedido.direccion}, ${pedido.ciudad}` : ''}</dd></div>
            <div><dt className="text-muted">Pago</dt><dd className="font-medium">{pedido.metodo_pago}</dd></div>
            {pedido.notas && <div className="sm:col-span-2"><dt className="text-muted">Notas</dt><dd>{pedido.notas}</dd></div>}
            <div><dt className="text-muted">Envío</dt><dd className="font-mono">{Number(pedido.costo_envio) ? formatMoney(pedido.costo_envio) : 'Gratis'}</dd></div>
            <div><dt className="text-muted">Total</dt><dd className="font-display text-2xl font-extrabold">{formatMoney(pedido.total)}</dd></div>
          </dl>
        </div>
      )}
    </Modal>
  );
};

export const PedidosGestion = () => {
  const [parametros, setParametros] = useSearchParams();
  const estado = parametros.get('estado') ?? '';
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(null);
  const cargar = useCallback(() => gestionService.pedidos({ estado }), [estado]);
  const { datos, error, recargar } = useCargaAsync(cargar);

  const filtrados = (datos?.data ?? []).filter((p) => {
    const t = busqueda.trim().toLowerCase();
    return !t || [p.codigo, p.cliente, p.correo, p.cedula].some((v) => String(v ?? '').toLowerCase().includes(t));
  });

  return (
    <div className="animate-rise">
      <PageHeader etiqueta="Tienda" titulo="Pedidos" descripcion="Confirma, prepara y entrega las compras en línea. El cliente recibe un aviso por correo en cada cambio." />
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por código, cliente o cédula" etiqueta="Buscar pedidos" className="xl:w-96" />
        <div className="scrollbar-fino -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {['', ...ESTADOS].map((e) => (
            <button key={e || 'todos'} type="button" aria-pressed={estado === e} onClick={() => setParametros(e ? { estado: e } : {})}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${estado === e ? 'border-ink bg-ink text-paper' : 'border-line bg-panel text-ink-soft hover:border-ink'}`}>
              {e || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState mensaje={error} onRetry={recargar} />}
      {!datos && !error && <Skeleton className="h-64" />}
      {datos && filtrados.length === 0 && <EmptyState icono={PackageOpen} titulo="No hay pedidos" texto={estado ? `Ningún pedido en estado "${estado}".` : 'Cuando los clientes compren, aparecerán aquí.'} />}
      {filtrados.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtrados.map((p, i) => (
            <li key={p.id} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }} className="animate-rise">
              <button type="button" onClick={() => setAbierto(p.id)} className="w-full rounded-2xl border border-line bg-panel p-4 text-left shadow-ticket transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-signal-deep">{p.codigo}</span>
                  <EstadoPedido estado={p.estado} />
                </div>
                <p className="mt-2 font-semibold">{p.cliente}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                  <span>{formatDateTime(p.created_at)}</span><span>{p.unidades} u.</span><span>{p.tipo_entrega}</span>
                  <span className="ml-auto font-display text-lg font-extrabold text-ink">{formatMoney(p.total)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {abierto && <DetallePedido id={abierto} onCerrar={() => setAbierto(null)} onCambio={recargar} />}
    </div>
  );
};
