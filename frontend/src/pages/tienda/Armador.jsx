// "Arma tu PC": elige pieza por pieza con compatibilidad en vivo, mira cómo queda y llévala al carrito.
// La selección vive en la URL (?cpu=12&ram=30…), así se puede compartir o imprimir como cotización.
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Check, CircleCheck, Gauge, Printer, RotateCcw, Share2, ShoppingCart, X, Zap,
} from 'lucide-react';
import { tiendaService } from '../../services/tiendaService.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { useCarrito } from '../../hooks/useCarrito.js';
import { useToast } from '../../hooks/useToast.js';
import { formatMoney } from '../../utils/format.js';
import {
  PASOS, consumoEstimado, faltantes, fuenteRecomendada, motivoIncompatible, paramsDesdeSeleccion, problemasSeleccion,
  seleccionDesdeParams, totalSeleccion,
} from '../../utils/armador.js';
import { ICONOS_CATEGORIA } from '../../constants/tienda.js';
import { VisualPC } from '../../components/armador/VisualPC.jsx';
import { ProductoImagen } from '../../components/tienda/ProductoImagen.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ErrorState } from '../../components/ui/Feedback.jsx';
import { Skeleton } from '../../components/ui/Loader.jsx';

const cargarArmador = () => tiendaService.armador();

const ICONO_PASO = { cpu: 'Cpu', motherboard: 'CircuitBoard', ram: 'MemoryStick', gpu: 'Gpu', almacenamiento: 'HardDrive', fuente: 'PlugZap', gabinete: 'Box', enfriamiento: 'Fan' };

// Datos técnicos que se muestran en cada tarjeta según el tipo de pieza
const etiquetasTecnicas = (p) =>
  [p.pc_socket && !p.pc_socket.includes(',') && p.pc_socket, p.pc_memoria, p.pc_formato,
    p.pc_tipo === 'fuente' ? `${p.pc_consumo_w} W` : p.pc_consumo_w && `${p.pc_consumo_w} W de consumo`].filter(Boolean);

const OpcionPieza = ({ producto, elegida, motivo, onElegir }) => {
  const agotado = producto.stock <= 0;
  const bloqueada = Boolean(motivo) || agotado;
  return (
    <li>
      <button
        type="button"
        onClick={() => onElegir(producto)}
        disabled={bloqueada && !elegida}
        aria-pressed={elegida}
        className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-200 ${
          elegida ? 'border-ink bg-ink text-paper shadow-lift'
            : bloqueada ? 'cursor-not-allowed border-dashed border-line bg-paper opacity-60'
              : 'border-line bg-panel hover:-translate-y-0.5 hover:border-line-strong hover:shadow-ticket'
        }`}
      >
        <ProductoImagen producto={producto} tamano="sm" className="size-14 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm leading-snug font-semibold">{producto.nombre}</span>
          <span className="mt-1 flex flex-wrap gap-1">
            {etiquetasTecnicas(producto).map((e) => (
              <span key={e} className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${elegida ? 'bg-white/10 text-paper/80' : 'bg-paper-deep text-ink-soft'}`}>{e}</span>
            ))}
          </span>
          {motivo && !elegida && <span className="mt-1 flex items-center gap-1 text-xs text-danger"><X className="size-3" aria-hidden />{motivo}</span>}
          {agotado && !motivo && <span className="mt-1 block text-xs text-muted">Agotado</span>}
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-sm font-bold">{formatMoney(producto.precio)}</span>
          {elegida ? <Check className="ml-auto mt-1 size-4 text-signal" aria-hidden /> : null}
        </span>
      </button>
    </li>
  );
};

const MedidorEnergia = ({ sel }) => {
  const consumo = consumoEstimado(sel);
  const recomendado = fuenteRecomendada(sel);
  const capacidad = sel.fuente?.pc_consumo_w;
  const porcentaje = capacidad ? Math.min(100, Math.round((consumo / capacidad) * 100)) : 0;
  const suficiente = !capacidad || capacidad >= recomendado;
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-paper/70"><Zap className="size-4 text-[#e0a106]" aria-hidden /> Consumo estimado</span>
        <span className="font-mono font-bold">{consumo} W</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Uso de la fuente">
        <div className={`h-full rounded-full transition-all duration-500 ${suficiente ? 'bg-st-reparado' : 'bg-danger'}`} style={{ width: `${capacidad ? porcentaje : 0}%` }} />
      </div>
      <p className="mt-2 text-xs text-paper/55">
        {capacidad ? `${porcentaje}% de tu fuente de ${capacidad} W · ` : ''}Recomendado: {recomendado} W o más
      </p>
    </div>
  );
};

export const Armador = () => {
  const { datos, error, cargando, recargar } = useCargaAsync(cargarArmador);
  const [params, setParams] = useSearchParams();
  const [pasoActivo, setPasoActivo] = useState('cpu');
  const { agregar } = useCarrito();
  const toast = useToast();

  const componentes = datos?.data;
  const sel = useMemo(() => seleccionDesdeParams(params, componentes), [params, componentes]);
  const problemas = problemasSeleccion(sel);
  const pendientes = faltantes(sel);
  const total = totalSeleccion(sel);
  const completo = pendientes.length === 0 && problemas.length === 0;
  const indice = PASOS.findIndex((p) => p.clave === pasoActivo);
  const paso = PASOS[indice];

  const actualizar = (nueva) => setParams(paramsDesdeSeleccion(nueva), { replace: true });

  const elegir = (producto) => {
    const yaElegida = sel[pasoActivo]?.id === producto.id;
    actualizar({ ...sel, [pasoActivo]: yaElegida ? undefined : producto });
    // Avanza al siguiente paso sin elegir
    if (!yaElegida) {
      const siguiente = PASOS.slice(indice + 1).find((p) => !sel[p.clave]);
      if (siguiente) window.setTimeout(() => setPasoActivo(siguiente.clave), 220);
    }
  };

  const agregarTodo = () => {
    PASOS.forEach(({ clave }) => sel[clave] && agregar(sel[clave], 1));
    toast.exito(`Se agregaron ${Object.keys(sel).length} piezas al carrito`);
  };

  const compartir = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'Mi PC en Bancada', url });
      else {
        await navigator.clipboard.writeText(url);
        toast.exito('Enlace copiado: compártelo con quien quieras');
      }
    } catch { /* el usuario cerró el diálogo de compartir */ }
  };

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState mensaje={error} onRetry={recargar} /></div>;

  const opciones = componentes?.[pasoActivo] ?? [];
  const IconoPaso = ICONOS_CATEGORIA[ICONO_PASO[pasoActivo]];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      {/* Encabezado asimétrico */}
      <header className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-signal-deep uppercase">Armador de PC</p>
          <h1 className="mt-2 text-4xl leading-[0.95] font-extrabold sm:text-6xl">Arma tu PC,<br className="hidden sm:block" /> pieza por pieza.</h1>
        </div>
        <p className="text-ink-soft lg:col-span-4">
          Revisamos que todo encaje: socket, memoria, formato y potencia. Si algo no combina, te decimos por qué antes de comprar.
        </p>
      </header>

      {/* Pasos */}
      <nav className="scrollbar-fino -mx-4 mt-8 overflow-x-auto px-4 pb-2" aria-label="Pasos del armado">
        <ol className="flex min-w-max gap-2">
          {PASOS.map((p, i) => {
            const Icono = ICONOS_CATEGORIA[ICONO_PASO[p.clave]];
            const elegido = sel[p.clave];
            const conProblema = problemas.some((x) => x.clave === p.clave);
            return (
              <li key={p.clave}>
                <button type="button" onClick={() => setPasoActivo(p.clave)} aria-current={p.clave === pasoActivo ? 'step' : undefined}
                  className={`flex h-12 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                    p.clave === pasoActivo ? 'border-ink bg-ink text-paper' : 'border-line bg-panel hover:border-line-strong'}`}>
                  <span className={`grid size-7 place-items-center rounded-lg ${conProblema ? 'bg-danger text-white' : elegido ? 'bg-st-reparado text-white' : p.clave === pasoActivo ? 'bg-white/10' : 'bg-paper-deep'}`}>
                    {conProblema ? <AlertTriangle className="size-3.5" aria-hidden /> : elegido ? <Check className="size-3.5" aria-hidden /> : <Icono className="size-3.5" aria-hidden />}
                  </span>
                  <span className="font-mono text-[10px] opacity-50">{i + 1}</span> {p.corto}
                  {!p.requerido && <span className="text-[10px] font-normal opacity-60">opcional</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Opciones del paso */}
        <section className="min-w-0 lg:col-span-7" aria-labelledby="titulo-paso">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-signal-soft text-signal-deep"><IconoPaso className="size-5" aria-hidden /></span>
              <div>
                <h2 id="titulo-paso" className="text-xl font-bold">{paso.titulo}</h2>
                <p className="text-sm text-muted">{paso.nota ?? `${opciones.length} opciones · elige una`}</p>
              </div>
            </div>
            {sel[pasoActivo] && (
              <button type="button" onClick={() => actualizar({ ...sel, [pasoActivo]: undefined })} className="text-sm font-semibold text-ink-soft underline-offset-4 hover:underline">Quitar</button>
            )}
          </div>

          {cargando ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (
            <ul key={pasoActivo} className="animate-rise space-y-2.5">
              {opciones.map((producto) => (
                <OpcionPieza key={producto.id} producto={producto} elegida={sel[pasoActivo]?.id === producto.id}
                  motivo={motivoIncompatible(pasoActivo, producto, { ...sel, [pasoActivo]: undefined })} onElegir={elegir} />
              ))}
            </ul>
          )}

          <div className="mt-5 flex justify-between">
            <Button variante="fantasma" disabled={indice === 0} onClick={() => setPasoActivo(PASOS[indice - 1].clave)}>← Anterior</Button>
            <Button variante="borde" disabled={indice === PASOS.length - 1} onClick={() => setPasoActivo(PASOS[indice + 1].clave)}>Siguiente →</Button>
          </div>
        </section>

        {/* Vista previa, energía y resumen */}
        <aside className="min-w-0 lg:col-span-5">
          <div className="space-y-4 rounded-4xl bg-ink p-5 text-paper shadow-lift lg:sticky lg:top-24">
            <div className="mx-auto max-w-xs"><VisualPC sel={sel} pasoActivo={pasoActivo} /></div>
            <MedidorEnergia sel={sel} />

            {problemas.length > 0 && (
              <ul className="space-y-1.5 rounded-2xl bg-danger/15 p-3 text-sm" aria-live="polite">
                {problemas.map((p) => (
                  <li key={p.clave} className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#ff8a80]" aria-hidden /><span><strong>{p.titulo}:</strong> {p.motivo}</span></li>
                ))}
              </ul>
            )}

            <dl className="space-y-1.5 text-sm">
              {PASOS.map((p) => (
                <div key={p.clave} className="flex justify-between gap-3">
                  <dt className="text-paper/50">{p.corto}</dt>
                  <dd className="truncate text-right">{sel[p.clave] ? <><span className="text-paper/80">{sel[p.clave].nombre}</span> <span className="font-mono text-paper">{formatMoney(sel[p.clave].precio)}</span></> : <span className="text-paper/30">—</span>}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-end justify-between border-t border-white/10 pt-4">
              <span className="text-sm text-paper/60">Total · IVA incluido</span>
              <span className="font-display text-3xl font-extrabold">{formatMoney(total)}</span>
            </div>

            {completo ? (
              <p className="flex items-center gap-2 text-sm text-[#7fe0b5]"><CircleCheck className="size-4" aria-hidden /> Todo es compatible. ¡Lista para armar!</p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-paper/60"><Gauge className="size-4" aria-hidden />
                {pendientes.length ? `Falta: ${pendientes.map((p) => p.corto).join(', ')}` : 'Corrige las piezas marcadas'}
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button variante="senal" tamano="lg" className="sm:col-span-2" disabled={!completo} onClick={agregarTodo}>
                <ShoppingCart className="size-4" aria-hidden /> Agregar todo al carrito
              </Button>
              <Link to={`/documentos/cotizacion?${params}`} target="_blank"
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 text-sm font-semibold transition hover:border-white/50 ${Object.keys(sel).length ? '' : 'pointer-events-none opacity-40'}`}>
                <Printer className="size-4" aria-hidden /> Cotización
              </Link>
              <button type="button" onClick={compartir} disabled={!Object.keys(sel).length}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 text-sm font-semibold transition hover:border-white/50 disabled:opacity-40">
                <Share2 className="size-4" aria-hidden /> Compartir
              </button>
            </div>
            {Object.keys(sel).length > 0 && (
              <button type="button" onClick={() => { actualizar({}); setPasoActivo('cpu'); }} className="mx-auto flex items-center gap-1.5 text-xs text-paper/50 hover:text-paper">
                <RotateCcw className="size-3" aria-hidden /> Empezar de nuevo
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
