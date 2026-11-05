// Página de Repuestos (inventario): filtros por categoría, búsqueda y CRUD.
import { useMemo, useState } from 'react';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { componenteService } from '../services/componenteService.js';
import { useCollection } from '../hooks/useCollection.js';
import { useCrudDialogs } from '../hooks/useCrudDialogs.js';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORIAS, CATEGORIA_ICONO } from '../constants/dominio.js';
import { coincide, formatMoney } from '../utils/format.js';
import { PageHeader, EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import { Skeleton } from '../components/ui/Loader.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { CategoriaBadge } from '../components/ui/Badges.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { StockMeter } from '../components/componentes/StockMeter.jsx';
import { ComponenteFormModal } from '../components/componentes/ComponenteFormModal.jsx';

const TODAS = 'Todas';

const FiltroCategorias = ({ componentes, activa, onChange }) => {
  const conteo = (categoria) =>
    categoria === TODAS ? componentes.length : componentes.filter((c) => c.categoria === categoria).length;

  return (
    <div className="scrollbar-fino -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por categoría">
      {[TODAS, ...CATEGORIAS].map((categoria) => {
        const Icono = CATEGORIA_ICONO[categoria];
        const seleccionada = activa === categoria;
        return (
          <button
            key={categoria}
            type="button"
            aria-pressed={seleccionada}
            onClick={() => onChange(categoria)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              seleccionada ? 'border-ink bg-ink text-paper' : 'border-line bg-panel text-ink-soft hover:border-line-strong'
            }`}
          >
            {Icono && <Icono className={`size-4 ${seleccionada ? 'text-signal' : ''}`} aria-hidden />}
            {categoria}
            <span className={`font-mono text-xs ${seleccionada ? 'text-paper/60' : 'text-muted'}`}>{conteo(categoria)}</span>
          </button>
        );
      })}
    </div>
  );
};

const TarjetaRepuesto = ({ componente, onEditar, onEliminar }) => (
  <article className="group flex flex-col rounded-3xl border border-line bg-panel p-5 shadow-ticket transition hover:-translate-y-0.5 hover:shadow-lift">
    <div className="flex items-start justify-between gap-2">
      <CategoriaBadge categoria={componente.categoria} />
      <div className="-mt-1.5 -mr-2 flex">
        <IconButton icono={Pencil} etiqueta={`Editar ${componente.nombre}`} onClick={() => onEditar(componente)} />
        <IconButton icono={Trash2} etiqueta={`Eliminar ${componente.nombre}`} className="hover:bg-danger-soft! hover:text-danger!" onClick={() => onEliminar(componente)} />
      </div>
    </div>
    <h3 className="mt-3 text-lg leading-snug font-bold">{componente.nombre}</h3>
    <p className="mt-1 font-mono text-xs text-muted">
      REF-{String(componente.id).padStart(3, '0')} · usado en {componente.veces_usado} {componente.veces_usado === 1 ? 'orden' : 'órdenes'}
    </p>
    <div className="mt-auto pt-5">
      <p className="font-display text-[28px] leading-none font-extrabold">{formatMoney(componente.precio_unitario)}</p>
      <div className="mt-4"><StockMeter stock={componente.stock} /></div>
    </div>
  </article>
);

export const Componentes = () => {
  const toast = useToast();
  const { items: componentes, cargando, error, recargar } = useCollection(componenteService.list);
  const [categoria, setCategoria] = useState(TODAS);
  const [busqueda, setBusqueda] = useState('');
  const dialogos = useCrudDialogs(componenteService.remove, recargar);

  const filtrados = useMemo(
    () =>
      componentes.filter(
        (c) => (categoria === TODAS || c.categoria === categoria) && coincide(busqueda, c.nombre, c.categoria),
      ),
    [componentes, categoria, busqueda],
  );

  const valorInventario = componentes.reduce((total, c) => total + c.precio_unitario * c.stock, 0);

  const alGuardar = (_componente, mensaje) => {
    toast.exito(mensaje);
    dialogos.cerrarFormulario();
    recargar();
  };

  const renderContenido = () => {
    if (cargando) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => <Skeleton key={n} className="h-56" />)}
        </div>
      );
    }
    if (error) return <ErrorState mensaje={error} onRetry={recargar} />;
    if (componentes.length === 0) {
      return (
        <EmptyState
          icono={Package}
          titulo="El inventario está vacío"
          texto="Agrega memorias, discos, fuentes y demás repuestos para usarlos en las órdenes."
          accion={<Button variante="senal" icono={Plus} onClick={dialogos.abrirCrear}>Nuevo repuesto</Button>}
        />
      );
    }
    if (filtrados.length === 0) {
      return <EmptyState icono={Package} titulo="Sin coincidencias" texto="Prueba con otra categoría o término de búsqueda." />;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((componente) => (
          <TarjetaRepuesto
            key={componente.id}
            componente={componente}
            onEditar={dialogos.abrirEditar}
            onEliminar={dialogos.pedirEliminar}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="animate-rise">
      <PageHeader
        etiqueta={`Inventario · valor ${formatMoney(valorInventario)}`}
        titulo="Repuestos"
        descripcion="Componentes disponibles para las reparaciones. El stock se descuenta al usarlos en una orden."
        acciones={<Button variante="senal" icono={Plus} onClick={dialogos.abrirCrear}>Nuevo repuesto</Button>}
      />

      {componentes.length > 0 && (
        <>
          <FiltroCategorias componentes={componentes} activa={categoria} onChange={setCategoria} />
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar repuesto" etiqueta="Buscar repuestos" className="mb-5 max-w-md" />
        </>
      )}

      {renderContenido()}

      {dialogos.formulario && (
        <ComponenteFormModal componente={dialogos.formulario.registro} onClose={dialogos.cerrarFormulario} onGuardado={alGuardar} />
      )}

      <ConfirmDialog
        abierto={Boolean(dialogos.porEliminar)}
        onCancel={dialogos.cancelarEliminar}
        onConfirm={dialogos.confirmarEliminar}
        cargando={dialogos.eliminando}
        titulo="¿Eliminar repuesto?"
        mensaje={<p>Se eliminará <strong>{dialogos.porEliminar?.nombre}</strong> del inventario.</p>}
      />
    </div>
  );
};
