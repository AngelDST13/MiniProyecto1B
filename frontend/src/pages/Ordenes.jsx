// Página de Órdenes de servicio: tablero por estado (kanban) o lista, filtros y CRUD.
import { useMemo, useState } from 'react';
import { ClipboardList, Columns3, List, Plus } from 'lucide-react';
import { ordenService } from '../services/ordenService.js';
import { clienteService } from '../services/clienteService.js';
import { useCollection } from '../hooks/useCollection.js';
import { useCrudDialogs } from '../hooks/useCrudDialogs.js';
import { useToast } from '../hooks/useToast.js';
import { ESTADOS, ESTADO_ESTILO, TIPOS_EQUIPO, TIPO_EQUIPO_ICONO } from '../constants/dominio.js';
import { codigoOrden, coincide } from '../utils/format.js';
import { PageHeader, EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import { Skeleton } from '../components/ui/Loader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { OrdenCard } from '../components/ordenes/OrdenCard.jsx';
import { OrdenesTabla } from '../components/ordenes/OrdenesTabla.jsx';
import { OrdenFormModal } from '../components/ordenes/OrdenFormModal.jsx';
import { OrdenDetalleModal } from '../components/ordenes/OrdenDetalleModal.jsx';

const TODOS = 'Todos';
const CLAVE_VISTA = 'bancada.vista-ordenes';

const leerVista = () => {
  try { return localStorage.getItem(CLAVE_VISTA) ?? 'tablero'; } catch { return 'tablero'; }
};
const guardarVista = (vista) => {
  try { localStorage.setItem(CLAVE_VISTA, vista); } catch { /* sin almacenamiento */ }
};

const SelectorVista = ({ vista, onChange }) => (
  <div className="inline-flex rounded-xl border border-line bg-panel p-1" role="group" aria-label="Tipo de vista">
    {[
      { id: 'tablero', etiqueta: 'Tablero', icono: Columns3 },
      { id: 'lista', etiqueta: 'Lista', icono: List },
    ].map(({ id, etiqueta, icono: Icono }) => (
      <button
        key={id}
        type="button"
        aria-pressed={vista === id}
        onClick={() => onChange(id)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition ${
          vista === id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
        }`}
      >
        <Icono className="size-4" aria-hidden /> {etiqueta}
      </button>
    ))}
  </div>
);

const FiltroTipo = ({ activo, onChange }) => (
  <div className="flex gap-1.5" role="group" aria-label="Filtrar por tipo de equipo">
    {[TODOS, ...TIPOS_EQUIPO].map((tipo) => {
      const Icono = TIPO_EQUIPO_ICONO[tipo];
      return (
        <button
          key={tipo}
          type="button"
          aria-pressed={activo === tipo}
          onClick={() => onChange(tipo)}
          className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition ${
            activo === tipo ? 'border-ink bg-ink text-paper' : 'border-line bg-panel text-ink-soft hover:border-line-strong'
          }`}
        >
          {Icono && <Icono className={`size-4 ${activo === tipo ? 'text-signal' : ''}`} aria-hidden />}
          {tipo}
        </button>
      );
    })}
  </div>
);

const Tablero = ({ ordenes, acciones, avanzandoId }) => (
  <div className="scrollbar-fino -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
    {ESTADOS.map((estado) => {
      const estilo = ESTADO_ESTILO[estado];
      const columna = ordenes.filter((orden) => orden.estado === estado);
      return (
        <section key={estado} aria-label={estado} className="w-[84%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
          <header className="mb-3 flex items-center gap-2 px-1">
            <span className={`size-2.5 rounded-full ${estilo.dot}`} aria-hidden />
            <h2 className="font-display text-[15px] font-bold">{estado}</h2>
            <span className="ml-auto rounded-full bg-panel px-2 py-0.5 font-mono text-xs font-bold text-ink-soft ring-1 ring-line">
              {columna.length}
            </span>
          </header>
          <div className="min-h-40 space-y-3 rounded-3xl bg-paper-deep/50 p-2">
            {columna.length === 0 ? (
              <p className="grid h-36 place-items-center rounded-2xl border border-dashed border-line-strong px-4 text-center text-[13px] text-muted">
                {estilo.descripcion}
              </p>
            ) : (
              columna.map((orden) => (
                <OrdenCard key={orden.id} orden={orden} avanzando={avanzandoId === orden.id} {...acciones} />
              ))
            )}
          </div>
        </section>
      );
    })}
  </div>
);

export const Ordenes = () => {
  const toast = useToast();
  const { items: ordenes, setItems: setOrdenes, cargando, error, recargar } = useCollection(ordenService.list);
  const { items: clientes } = useCollection(clienteService.list);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState(TODOS);
  const [vista, setVista] = useState(leerVista);
  const [detalleId, setDetalleId] = useState(null);
  const [avanzandoId, setAvanzandoId] = useState(null);
  const dialogos = useCrudDialogs(ordenService.remove, recargar);

  const filtradas = useMemo(
    () =>
      ordenes.filter(
        (o) =>
          (tipo === TODOS || o.tipo_equipo === tipo) &&
          coincide(busqueda, codigoOrden(o.id), o.marca_modelo, o.serial, o.cliente.nombre, o.cliente.cedula),
      ),
    [ordenes, tipo, busqueda],
  );

  const reemplazar = (actualizada) =>
    setOrdenes((actuales) => actuales.map((o) => (o.id === actualizada.id ? actualizada : o)));

  const cambiarVista = (nueva) => {
    setVista(nueva);
    guardarVista(nueva);
  };

  const avanzar = async (orden, estado) => {
    setAvanzandoId(orden.id);
    try {
      const respuesta = await ordenService.updateEstado(orden.id, estado);
      reemplazar(respuesta.data);
      toast.exito(`${codigoOrden(orden.id)} → ${estado}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAvanzandoId(null);
    }
  };

  const alGuardar = (_orden, mensaje) => {
    toast.exito(mensaje);
    dialogos.cerrarFormulario();
    recargar();
  };

  // Desde el detalle se cierra primero el modal y luego se abre el siguiente.
  const acciones = {
    onAbrir: (orden) => setDetalleId(orden.id),
    onAvanzar: avanzar,
    onEditar: (orden) => { setDetalleId(null); dialogos.abrirEditar(orden); },
    onEliminar: (orden) => { setDetalleId(null); dialogos.pedirEliminar(orden); },
  };

  const renderContenido = () => {
    if (cargando) {
      return (
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-72" />)}
        </div>
      );
    }
    if (error) return <ErrorState mensaje={error} onRetry={recargar} />;
    if (ordenes.length === 0) {
      return (
        <EmptyState
          icono={ClipboardList}
          titulo="No hay órdenes abiertas"
          texto="Cuando un cliente deje su equipo, regístralo aquí para seguir su reparación."
          accion={<Button variante="senal" icono={Plus} onClick={dialogos.abrirCrear}>Nueva orden</Button>}
        />
      );
    }
    if (filtradas.length === 0) {
      return <EmptyState icono={ClipboardList} titulo="Sin coincidencias" texto="Ninguna orden coincide con los filtros aplicados." />;
    }
    if (vista === 'lista') {
      return (
        <>
          <div className="hidden md:block"><OrdenesTabla ordenes={filtradas} {...acciones} /></div>
          <div className="space-y-3 md:hidden">
            {filtradas.map((orden) => <OrdenCard key={orden.id} orden={orden} avanzando={avanzandoId === orden.id} {...acciones} />)}
          </div>
        </>
      );
    }
    return <Tablero ordenes={filtradas} acciones={acciones} avanzandoId={avanzandoId} />;
  };

  const activas = ordenes.filter((o) => o.estado !== 'Entregado').length;

  return (
    <div className="animate-rise">
      <PageHeader
        etiqueta={`Flujo de trabajo · ${activas} activas`}
        titulo="Órdenes de servicio"
        descripcion="Sigue cada equipo desde que entra al taller hasta que vuelve a manos de su dueño."
        acciones={<Button variante="senal" icono={Plus} onClick={dialogos.abrirCrear}>Nueva orden</Button>}
      />

      {ordenes.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center">
          <SearchInput
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar por código, equipo, serie o cliente"
            etiqueta="Buscar órdenes"
            className="xl:w-96"
          />
          <div className="scrollbar-fino -mx-4 flex items-center gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0 xl:flex-1">
            <FiltroTipo activo={tipo} onChange={setTipo} />
            <div className="ml-auto"><SelectorVista vista={vista} onChange={cambiarVista} /></div>
          </div>
        </div>
      )}

      {renderContenido()}

      {detalleId && (
        <OrdenDetalleModal
          ordenId={detalleId}
          onClose={() => setDetalleId(null)}
          onActualizada={reemplazar}
          onEditar={acciones.onEditar}
          onEliminar={acciones.onEliminar}
        />
      )}

      {dialogos.formulario && (
        <OrdenFormModal
          orden={dialogos.formulario.registro}
          clientes={clientes}
          onClose={dialogos.cerrarFormulario}
          onGuardado={alGuardar}
        />
      )}

      <ConfirmDialog
        abierto={Boolean(dialogos.porEliminar)}
        onCancel={dialogos.cancelarEliminar}
        onConfirm={dialogos.confirmarEliminar}
        cargando={dialogos.eliminando}
        titulo="¿Eliminar orden de servicio?"
        mensaje={
          <p>
            Se eliminará <strong>{dialogos.porEliminar && codigoOrden(dialogos.porEliminar.id)}</strong> ({dialogos.porEliminar?.marca_modelo}).
            Los repuestos asignados regresarán al inventario.
          </p>
        }
      />
    </div>
  );
};
