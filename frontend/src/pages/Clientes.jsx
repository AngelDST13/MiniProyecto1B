// Página de Clientes: tabla (escritorio) / tarjetas (móvil), búsqueda y CRUD.
import { useMemo, useState } from 'react';
import { Mail, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react';
import { clienteService } from '../services/clienteService.js';
import { useCollection } from '../hooks/useCollection.js';
import { useCrudDialogs } from '../hooks/useCrudDialogs.js';
import { useToast } from '../context/ToastContext.jsx';
import { coincide, iniciales } from '../utils/format.js';
import { PageHeader, EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import { Skeleton } from '../components/ui/Loader.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { ClienteFormModal } from '../components/clientes/ClienteFormModal.jsx';

const Avatar = ({ nombre }) => (
  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper-deep font-display text-sm font-bold text-ink-soft">
    {iniciales(nombre)}
  </span>
);

const OrdenesChip = ({ total }) => (
  <span
    className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 font-mono text-xs font-bold ${
      total > 0 ? 'bg-signal-soft text-signal-deep' : 'bg-paper text-muted'
    }`}
  >
    {total}
  </span>
);

export const Clientes = () => {
  const toast = useToast();
  const { items: clientes, cargando, error, recargar } = useCollection(clienteService.list);
  const [busqueda, setBusqueda] = useState('');
  const dialogos = useCrudDialogs(clienteService.remove, recargar);

  const filtrados = useMemo(
    () => clientes.filter((c) => coincide(busqueda, c.nombre, c.cedula, c.email, c.telefono)),
    [clientes, busqueda],
  );

  const alGuardar = (_cliente, mensaje) => {
    toast.exito(mensaje);
    dialogos.cerrarFormulario();
    recargar();
  };

  const acciones = (cliente) => (
    <div className="flex justify-end gap-1">
      <IconButton icono={Pencil} etiqueta={`Editar a ${cliente.nombre}`} onClick={() => dialogos.abrirEditar(cliente)} />
      <IconButton
        icono={Trash2}
        etiqueta={`Eliminar a ${cliente.nombre}`}
        className="hover:bg-danger-soft! hover:text-danger!"
        onClick={() => dialogos.pedirEliminar(cliente)}
      />
    </div>
  );

  const renderContenido = () => {
    if (cargando) return <div className="space-y-3">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-20" />)}</div>;
    if (error) return <ErrorState mensaje={error} onRetry={recargar} />;
    if (clientes.length === 0) {
      return (
        <EmptyState
          icono={Users}
          titulo="Aún no hay clientes"
          texto="Registra al primer cliente para poder abrir órdenes de servicio a su nombre."
          accion={<Button variante="senal" icono={Plus} onClick={dialogos.abrirCrear}>Nuevo cliente</Button>}
        />
      );
    }
    if (filtrados.length === 0) {
      return <EmptyState icono={Users} titulo="Sin coincidencias" texto={`Ningún cliente coincide con "${busqueda}".`} />;
    }

    return (
      <>
        {/* Escritorio: tabla */}
        <div className="hidden overflow-hidden rounded-3xl border border-line bg-panel shadow-ticket md:block">
          <table className="w-full text-left text-[15px]">
            <thead className="border-b border-line bg-paper/60 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              <tr>
                <th className="px-5 py-3.5 font-bold">Cliente</th>
                <th className="px-5 py-3.5 font-bold">Cédula</th>
                <th className="px-5 py-3.5 font-bold">Teléfono</th>
                <th className="px-5 py-3.5 text-center font-bold">Órdenes</th>
                <th className="px-5 py-3.5"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtrados.map((cliente) => (
                <tr key={cliente.id} className="transition hover:bg-paper/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={cliente.nombre} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{cliente.nombre}</p>
                        <p className="truncate text-sm text-muted">{cliente.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm">{cliente.cedula}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{cliente.telefono}</td>
                  <td className="px-5 py-3.5 text-center"><OrdenesChip total={cliente.total_ordenes} /></td>
                  <td className="px-5 py-3.5">{acciones(cliente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Móvil: tarjetas */}
        <ul className="space-y-3 md:hidden">
          {filtrados.map((cliente) => (
            <li key={cliente.id} className="rounded-2xl border border-line bg-panel p-4 shadow-ticket">
              <div className="flex items-start gap-3">
                <Avatar nombre={cliente.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{cliente.nombre}</p>
                  <p className="font-mono text-xs text-muted">CI {cliente.cedula}</p>
                </div>
                {acciones(cliente)}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-soft">
                <a href={`tel:${cliente.telefono}`} className="inline-flex items-center gap-1.5"><Phone className="size-3.5" aria-hidden />{cliente.telefono}</a>
                <span className="inline-flex min-w-0 items-center gap-1.5"><Mail className="size-3.5 shrink-0" aria-hidden /><span className="truncate">{cliente.email}</span></span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted">Órdenes <OrdenesChip total={cliente.total_ordenes} /></span>
              </div>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="animate-rise">
      <PageHeader
        etiqueta={`Directorio · ${clientes.length} registrados`}
        titulo="Clientes"
        descripcion="Las personas y empresas que confían sus equipos al taller."
        acciones={<Button variante="senal" icono={Plus} onClick={dialogos.abrirCrear}>Nuevo cliente</Button>}
      />

      {clientes.length > 0 && (
        <SearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre, cédula, email o teléfono"
          etiqueta="Buscar clientes"
          className="mb-5 max-w-md"
        />
      )}

      {renderContenido()}

      {dialogos.formulario && (
        <ClienteFormModal cliente={dialogos.formulario.registro} onClose={dialogos.cerrarFormulario} onGuardado={alGuardar} />
      )}

      <ConfirmDialog
        abierto={Boolean(dialogos.porEliminar)}
        onCancel={dialogos.cancelarEliminar}
        onConfirm={dialogos.confirmarEliminar}
        cargando={dialogos.eliminando}
        titulo="¿Eliminar cliente?"
        mensaje={<p>Se eliminará a <strong>{dialogos.porEliminar?.nombre}</strong> del directorio.</p>}
      />
    </div>
  );
};
