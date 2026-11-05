// Panel principal: resumen del día del taller (indicadores, flujo, entregas y stock bajo).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Phone, TriangleAlert } from 'lucide-react';
import { ordenService } from '../services/ordenService.js';
import { clienteService } from '../services/clienteService.js';
import { componenteService } from '../services/componenteService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ESTADOS, ESTADO_ESTILO, STOCK_BAJO, TIPO_EQUIPO_ICONO } from '../constants/dominio.js';
import { codigoOrden, formatDate, formatMoney } from '../utils/format.js';
import { PageHeader, ErrorState } from '../components/ui/Feedback.jsx';
import { Skeleton } from '../components/ui/Loader.jsx';
import { EstadoBadge, CategoriaBadge } from '../components/ui/Badges.jsx';

const saludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const fechaLarga = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });

const useResumen = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [ordenes, clientes, componentes] = await Promise.all([
        ordenService.list(),
        clienteService.list(),
        componenteService.list(),
      ]);
      setDatos({ ordenes: ordenes.data, clientes: clientes.data, componentes: componentes.data });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  return { datos, error, recargar: cargar };
};

const Kpi = ({ etiqueta, valor, nota, destacado = false }) => (
  <div className={`rounded-3xl p-5 ${destacado ? 'bg-ink text-paper' : 'border border-line bg-panel shadow-ticket'}`}>
    <p className={`font-mono text-[10px] font-bold tracking-[0.16em] uppercase ${destacado ? 'text-paper/50' : 'text-muted'}`}>{etiqueta}</p>
    <p className={`mt-3 font-display text-5xl leading-none font-extrabold ${destacado ? 'text-signal' : ''}`}>{valor}</p>
    <p className={`mt-2 text-[13px] ${destacado ? 'text-paper/60' : 'text-muted'}`}>{nota}</p>
  </div>
);

const Tarjeta = ({ titulo, enlace, textoEnlace = 'Ver todo', children, className = '' }) => (
  <section className={`rounded-3xl border border-line bg-panel p-5 shadow-ticket sm:p-6 ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{titulo}</h2>
      {enlace && (
        <Link to={enlace} className="inline-flex items-center gap-1 text-sm font-semibold text-signal-deep hover:underline">
          {textoEnlace} <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
    {children}
  </section>
);

const FlujoOrdenes = ({ ordenes }) => {
  const total = ordenes.length || 1;
  return (
    <>
      <div className="flex h-4 overflow-hidden rounded-full bg-paper-deep" role="img" aria-label="Distribución de órdenes por estado">
        {ESTADOS.map((estado) => {
          const cantidad = ordenes.filter((o) => o.estado === estado).length;
          return cantidad > 0 ? (
            <span key={estado} className={`${ESTADO_ESTILO[estado].dot} border-r-2 border-panel last:border-r-0`} style={{ width: `${(cantidad / total) * 100}%` }} />
          ) : null;
        })}
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ESTADOS.map((estado) => {
          const cantidad = ordenes.filter((o) => o.estado === estado).length;
          return (
            <li key={estado} className={`rounded-2xl p-3 ${ESTADO_ESTILO[estado].soft}`}>
              <p className={`flex items-center gap-1.5 text-xs font-semibold ${ESTADO_ESTILO[estado].text}`}>
                <span className={`size-1.5 rounded-full ${ESTADO_ESTILO[estado].dot}`} aria-hidden /> {estado}
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold">{cantidad}</p>
            </li>
          );
        })}
      </ul>
    </>
  );
};

const ListaVacia = ({ texto }) => <p className="rounded-2xl bg-paper px-4 py-6 text-center text-sm text-muted">{texto}</p>;

export const Panel = () => {
  const { usuario } = useAuth();
  const { datos, error, recargar } = useResumen();

  const encabezado = (
    <PageHeader
      etiqueta={fechaLarga.format(new Date())}
      titulo={`${saludo()}, ${usuario?.nombre.split(' ')[0] ?? ''}.`}
      descripcion="Así está la bancada hoy."
    />
  );

  if (error) return <div className="animate-rise">{encabezado}<ErrorState mensaje={error} onRetry={recargar} /></div>;

  if (!datos) {
    return (
      <div>
        {encabezado}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-36" />)}</div>
        <Skeleton className="mt-4 h-48" />
      </div>
    );
  }

  const { ordenes, clientes, componentes } = datos;
  const activas = ordenes.filter((o) => o.estado !== 'Entregado');
  const porEntregar = ordenes.filter((o) => o.estado === 'Reparado');
  const enDiagnostico = ordenes.filter((o) => o.estado === 'En Diagnóstico');
  const stockBajo = componentes.filter((c) => c.stock <= STOCK_BAJO).sort((a, b) => a.stock - b.stock);
  const recientes = ordenes.slice(0, 5);

  return (
    <div className="animate-rise">
      {encabezado}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi destacado etiqueta="Órdenes activas" valor={activas.length} nota={`${ordenes.length} registradas en total`} />
        <Kpi etiqueta="En diagnóstico" valor={enDiagnostico.length} nota="Equipos en revisión" />
        <Kpi etiqueta="Por entregar" valor={porEntregar.length} nota="Reparados, esperando al cliente" />
        <Kpi etiqueta="Clientes" valor={clientes.length} nota="En el directorio" />
      </div>

      <Tarjeta titulo="Flujo de órdenes" enlace="/ordenes" textoEnlace="Abrir tablero" className="mt-4">
        <FlujoOrdenes ordenes={ordenes} />
      </Tarjeta>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Listos para entregar" enlace="/ordenes">
          {porEntregar.length === 0 ? (
            <ListaVacia texto="No hay equipos reparados pendientes de entrega." />
          ) : (
            <ul className="divide-y divide-line">
              {porEntregar.map((orden) => (
                <li key={orden.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="font-mono text-xs font-bold text-signal-deep">{codigoOrden(orden.id)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{orden.marca_modelo}</p>
                    <p className="truncate text-xs text-muted">{orden.cliente.nombre}</p>
                  </div>
                  <a href={`tel:${orden.cliente.telefono}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold hover:border-ink">
                    <Phone className="size-3.5" aria-hidden /> Avisar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta titulo="Stock bajo" enlace="/repuestos" textoEnlace="Inventario">
          {stockBajo.length === 0 ? (
            <ListaVacia texto={`Todos los repuestos tienen más de ${STOCK_BAJO} unidades.`} />
          ) : (
            <ul className="divide-y divide-line">
              {stockBajo.map((componente) => (
                <li key={componente.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <TriangleAlert className={`size-4 shrink-0 ${componente.stock === 0 ? 'text-danger' : 'text-st-diagnostico'}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{componente.nombre}</p>
                    <div className="mt-1"><CategoriaBadge categoria={componente.categoria} /></div>
                  </div>
                  <span className={`font-mono text-sm font-bold ${componente.stock === 0 ? 'text-danger' : ''}`}>
                    {componente.stock === 0 ? 'Agotado' : `${componente.stock} u.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <Tarjeta titulo="Ingresos recientes" enlace="/ordenes" className="mt-4">
        {recientes.length === 0 ? (
          <ListaVacia texto="Todavía no se ha registrado ninguna orden." />
        ) : (
          <ul className="divide-y divide-line">
            {recientes.map((orden) => {
              const Icono = TIPO_EQUIPO_ICONO[orden.tipo_equipo] ?? ClipboardList;
              return (
                <li key={orden.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                  <span className="grid size-10 place-items-center rounded-xl bg-paper text-ink-soft"><Icono className="size-4" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{orden.marca_modelo}</p>
                    <p className="truncate font-mono text-xs text-muted">{codigoOrden(orden.id)} · {orden.cliente.nombre} · {formatDate(orden.fecha_ingreso)}</p>
                  </div>
                  <span className="hidden font-mono text-sm font-bold sm:block">{orden.total_repuestos > 0 ? formatMoney(orden.total_repuestos) : ''}</span>
                  <EstadoBadge estado={orden.estado} />
                </li>
              );
            })}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
};
