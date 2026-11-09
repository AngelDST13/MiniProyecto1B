// Dashboard de administración: indicadores con variación, ingresos vs gastos por día,
// ventas por categoría, órdenes por estado, top de productos y actividad reciente.
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, FileCheck, Lock, Send, ShoppingCart, TriangleAlert } from 'lucide-react';
import { gestionService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useToast } from '../../hooks/useToast.js';
import { ESTADOS, ESTADO_ESTILO } from '../../constants/dominio.js';
import { formatDateTime, formatMoney } from '../../utils/format.js';
import { PageHeader, ErrorState } from '../../components/ui/Feedback.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { GraficoLineas } from '../../components/graficos/GraficoLineas.jsx';
import { GraficoBarras } from '../../components/graficos/GraficoBarras.jsx';
import { EstadoPedido } from '../cuenta/SeccionesCuenta.jsx';
import { AnalisisIA } from '../../components/gestion/AnalisisIA.jsx';

// Colores de las series validados (contraste y daltonismo) con la guía de visualización
const SERIES = [
  { clave: 'ventas', etiqueta: 'Ventas de la tienda', color: '#e8520f' },
  { clave: 'cobros', etiqueta: 'Cobros del taller', color: '#3d6be0' },
  { clave: 'gastos', etiqueta: 'Gastos', color: '#b58a00' },
];
const PERIODOS = [7, 30, 90];
const porcentaje = new Intl.NumberFormat('es-CR', { style: 'percent', maximumFractionDigits: 0 });

const Variacion = ({ valor, invertir = false }) => {
  if (valor === null || valor === undefined) return <span className="text-xs text-muted">sin período previo</span>;
  const sube = valor >= 0;
  const bueno = invertir ? !sube : sube;
  const Icono = sube ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-xs font-bold ${bueno ? 'bg-st-reparado-soft text-st-reparado' : 'bg-danger-soft text-danger'}`}>
      <Icono className="size-3.5" aria-hidden />{porcentaje.format(Math.abs(valor))}
    </span>
  );
};

const Kpi = ({ etiqueta, valor, variacion, invertir, destacado, indice }) => (
  <div style={{ animationDelay: `${indice * 50}ms` }}
    className={`group animate-rise rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5 ${destacado ? 'bg-ink text-paper shadow-lift' : 'border border-line bg-panel shadow-ticket hover:shadow-lift'}`}>
    <p className={`font-mono text-[10px] font-bold tracking-[0.16em] uppercase ${destacado ? 'text-paper/55' : 'text-muted'}`}>{etiqueta}</p>
    <p className={`mt-3 font-display text-[clamp(1.6rem,2.6vw,2.25rem)] leading-none font-extrabold ${destacado ? 'text-signal' : ''}`}>{valor}</p>
    {variacion !== undefined && (
      <div className="mt-3 flex items-center gap-2">
        {variacion === null ? (
          <span className={`text-xs ${destacado ? 'text-paper/50' : 'text-muted'}`}>Sin datos del período anterior</span>
        ) : (
          <><Variacion valor={variacion} invertir={invertir} /><span className={`text-xs ${destacado ? 'text-paper/50' : 'text-muted'}`}>vs. período anterior</span></>
        )}
      </div>
    )}
  </div>
);

const Alerta = ({ a, icono: Icono, valor, texto, tono }) => (
  <Link to={a} className={`group flex items-center gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lift ${valor ? tono : 'border-line bg-panel'}`}>
    <Icono className="size-5 shrink-0" aria-hidden />
    <span className="flex-1 text-sm font-semibold">{texto}</span>
    <span className="font-display text-2xl font-extrabold">{valor}</span>
    <ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" aria-hidden />
  </Link>
);

const Tarjeta = ({ titulo, accion, children, className = '' }) => (
  <section className={`rounded-3xl border border-line bg-panel p-5 shadow-ticket sm:p-6 ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{titulo}</h2>{accion}</div>
    {children}
  </section>
);

const OrdenesPorEstado = ({ filas }) => {
  const total = filas.reduce((s, f) => s + f.total, 0) || 1;
  return (
    <>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-paper-deep" role="img" aria-label="Órdenes por estado">
        {ESTADOS.map((e) => {
          const n = filas.find((f) => f.estado === e)?.total ?? 0;
          return n ? <span key={e} className={`${ESTADO_ESTILO[e].dot} animate-crecer origin-left`} style={{ width: `${(n / total) * 100}%` }} title={`${e}: ${n}`} /> : null;
        })}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {ESTADOS.map((e) => (
          <li key={e} className={`rounded-xl p-3 ${ESTADO_ESTILO[e].soft}`}>
            <p className={`flex items-center gap-1.5 text-xs font-semibold ${ESTADO_ESTILO[e].text}`}><span className={`size-1.5 rounded-full ${ESTADO_ESTILO[e].dot}`} />{e}</p>
            <p className="mt-0.5 font-display text-2xl font-extrabold">{filas.find((f) => f.estado === e)?.total ?? 0}</p>
          </li>
        ))}
      </ul>
    </>
  );
};

export const Dashboard = () => {
  const toast = useToast();
  const [dias, setDias] = useState(30);
  const [enviando, setEnviando] = useState(false);
  const cargar = useCallback(async () => (await gestionService.dashboard(dias)).data, [dias]);
  const { datos, error, recargar } = useCargaAsync(cargar);

  const enviarInforme = async () => {
    setEnviando(true);
    try {
      toast.exito((await gestionService.enviarInforme()).message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const k = datos?.kpis;
  return (
    <div className="animate-rise">
      <PageHeader
        etiqueta="Administración · tiempo real"
        titulo="Dashboard"
        descripcion="Cómo van la tienda y el taller, comparado con el período anterior."
        acciones={
          <>
            <div className="inline-flex rounded-xl border border-line bg-panel p-1" role="group" aria-label="Período">
              {PERIODOS.map((p) => (
                <button key={p} type="button" aria-pressed={dias === p} onClick={() => setDias(p)}
                  className={`h-9 rounded-lg px-3 text-sm font-semibold transition ${dias === p ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>{p} días</button>
              ))}
            </div>
            <Button variante="borde" icono={Send} cargando={enviando} onClick={enviarInforme}>Enviar informe de hoy</Button>
          </>
        }
      />

      {error && <ErrorState mensaje={error} onRetry={recargar} />}
      {!datos && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-36" />)}</div>
      )}

      {datos && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi indice={0} destacado etiqueta="Ventas de la tienda" valor={formatMoney(k.ventas.valor)} variacion={k.ventas.variacion} />
            <Kpi indice={1} etiqueta="Cobros del taller" valor={formatMoney(k.cobrosTaller.valor)} variacion={k.cobrosTaller.variacion} />
            <Kpi indice={2} etiqueta="Gastos" valor={formatMoney(k.gastos.valor)} variacion={k.gastos.variacion} invertir />
            <Kpi indice={3} etiqueta="Resultado" valor={formatMoney(k.ventas.valor + k.cobrosTaller.valor - k.gastos.valor)} />
            <Kpi indice={4} etiqueta="Pedidos" valor={k.pedidos.valor} variacion={k.pedidos.variacion} />
            <Kpi indice={5} etiqueta="Ticket promedio" valor={formatMoney(k.ticketPromedio.valor)} />
            <Kpi indice={6} etiqueta="Equipos ingresados" valor={k.equiposIngresados.valor} variacion={k.equiposIngresados.variacion} />
            <Kpi indice={7} etiqueta="Clientes nuevos" valor={k.clientesNuevos.valor} variacion={k.clientesNuevos.variacion} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Alerta a="/gestion/pedidos?estado=Pendiente" icono={ShoppingCart} valor={k.pedidosPendientes.valor} texto="Pedidos por confirmar" tono="border-st-diagnostico/40 bg-st-diagnostico-soft text-[#7a5200]" />
            <Alerta a="/gestion/solicitudes" icono={FileCheck} valor={k.solicitudesPendientes.valor} texto="Informes por aprobar" tono="border-st-recibido/40 bg-st-recibido-soft text-st-recibido" />
            <Alerta a="/gestion/automatizacion" icono={Lock} valor={k.loginsFallidos.valor} texto={`Accesos fallidos (${dias} d)`} tono="border-danger/30 bg-danger-soft text-danger" />
          </div>

          <AnalisisIA dias={dias} />

          <Tarjeta titulo="Ingresos y gastos por día">
            <GraficoLineas datos={datos.serie} series={SERIES} />
          </Tarjeta>

          <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta titulo="Ventas por categoría">
              <GraficoBarras datos={datos.ventasPorCategoria.map((c) => ({ etiqueta: c.categoria, valor: Number(c.total) }))} formato={formatMoney} />
            </Tarjeta>
            <Tarjeta titulo="Órdenes del taller" accion={<Link to="/ordenes" className="text-sm font-semibold text-signal-deep hover:underline">Tablero →</Link>}>
              <OrdenesPorEstado filas={datos.ordenesPorEstado} />
            </Tarjeta>
            <Tarjeta titulo="Productos más vendidos">
              <GraficoBarras color="#3d6be0" datos={datos.topProductos.map((p) => ({ etiqueta: `${p.nombre} · ${p.unidades} u.`, valor: Number(p.total) }))} formato={formatMoney} />
            </Tarjeta>
            <Tarjeta titulo="Últimos pedidos" accion={<Link to="/gestion/pedidos" className="text-sm font-semibold text-signal-deep hover:underline">Ver todos →</Link>}>
              {datos.ultimosPedidos.length ? (
                <ul className="divide-y divide-line">
                  {datos.ultimosPedidos.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="font-mono font-bold text-signal-deep">{p.codigo}</span>
                      <span className="min-w-0 flex-1 truncate">{p.cliente}</span>
                      <span className="font-mono">{formatMoney(p.total)}</span>
                      <EstadoPedido estado={p.estado} />
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">Todavía no hay pedidos.</p>}
            </Tarjeta>
            <Tarjeta titulo="Actividad de inicio de sesión">
              <ul className="divide-y divide-line">
                {datos.accesos.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className={`size-2 shrink-0 rounded-full ${a.exito ? 'bg-st-reparado' : 'bg-danger'}`} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{a.nombre ?? a.correo}</span>
                    <span className={`text-xs ${a.exito ? 'text-muted' : 'font-semibold text-danger'}`}>{a.exito ? 'Correcto' : ({ credenciales: 'Clave incorrecta', bloqueado: 'Bloqueada', codigo_2fa: 'Código incorrecto', correo_sin_confirmar: 'Sin confirmar' }[a.motivo] ?? 'Fallido')}</span>
                    <span className="hidden font-mono text-xs text-muted sm:inline">{formatDateTime(a.fecha)}</span>
                  </li>
                ))}
              </ul>
            </Tarjeta>
            <Tarjeta titulo="Stock bajo en la tienda" accion={<Link to="/admin/productos" className="text-sm font-semibold text-signal-deep hover:underline">Productos →</Link>}>
              {datos.stockBajo.length ? (
                <ul className="divide-y divide-line">
                  {datos.stockBajo.map((p) => (
                    <li key={p.slug} className="flex items-center gap-3 py-2.5 text-sm">
                      <TriangleAlert className={`size-4 shrink-0 ${p.stock ? 'text-st-diagnostico' : 'text-danger'}`} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
                      <span className={`font-mono font-bold ${p.stock ? '' : 'text-danger'}`}>{p.stock ? `${p.stock} u.` : 'Agotado'}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">Todo el catálogo tiene stock suficiente.</p>}
            </Tarjeta>
          </div>
        </div>
      )}
    </div>
  );
};
