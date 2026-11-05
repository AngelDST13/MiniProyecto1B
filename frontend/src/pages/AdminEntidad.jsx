// Página CRUD genérica: tabla, búsqueda, crear, editar y eliminar para cualquier
// entidad de Administración. Las columnas y el formulario salen del esquema del backend.
import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminService } from '../services/adminService.js';
import { useCrudDialogs } from '../hooks/useCrudDialogs.js';
import { useToast } from '../hooks/useToast.js';
import { useCargaAsync } from '../hooks/useCargaAsync.js';
import { ICONOS } from '../constants/admin.js';
import { coincide } from '../utils/format.js';
import { PageHeader, EmptyState, ErrorState } from '../components/ui/Feedback.jsx';
import { Skeleton } from '../components/ui/Loader.jsx';
import { Button, IconButton } from '../components/ui/Button.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { RegistroFormModal } from '../components/admin/RegistroFormModal.jsx';
import { ValorCelda } from '../components/admin/ValorCelda.jsx';
import { textoDeValor } from '../utils/valores.js';
import { NotFound } from './NotFound.jsx';

const MAX_COLUMNAS = 6;

// entidad: undefined = cargando · null = no existe · objeto = esquema de la entidad
const useEntidad = (clave) => {
  const cargar = useCallback(async () => {
    try {
      const [esquema, lista] = await Promise.all([adminService.entidades(), adminService.list(clave)]);
      return {
        entidad: esquema.data.find((m) => m.clave === clave && !m.personalizado) ?? null,
        registros: lista.data,
      };
    } catch (err) {
      if (err.status === 404) return { entidad: null, registros: [] };
      throw err;
    }
  }, [clave]);

  const { datos, error, recargar } = useCargaAsync(cargar);
  return { entidad: datos?.entidad, registros: datos?.registros ?? [], error, recargar };
};

// Al cambiar de entidad (/admin/tecnicos → /admin/pagos) la "key" reinicia todo el estado.
export const AdminEntidad = () => {
  const { clave } = useParams();
  return <ContenidoEntidad key={clave} clave={clave} />;
};

const ContenidoEntidad = ({ clave }) => {
  const toast = useToast();
  const { entidad, registros, error, recargar } = useEntidad(clave);
  const [busqueda, setBusqueda] = useState('');
  const dialogos = useCrudDialogs((id) => adminService.remove(clave, id), recargar);

  const columnas = useMemo(() => entidad?.campos.filter((c) => c.enLista).slice(0, MAX_COLUMNAS) ?? [], [entidad]);
  const filtrados = useMemo(
    () => registros.filter((r) => coincide(busqueda, ...columnas.map((c) => textoDeValor(c, r)))),
    [registros, columnas, busqueda],
  );

  if (entidad === null) return <NotFound />;

  const Icono = entidad ? ICONOS[entidad.icono] : null;
  const [principal, ...secundarias] = columnas;

  const alGuardar = (_registro, mensaje) => {
    toast.exito(mensaje);
    dialogos.cerrarFormulario();
    recargar();
  };

  const acciones = (registro) => (
    <div className="flex justify-end gap-1">
      <IconButton icono={Pencil} etiqueta={`Editar registro ${registro.id}`} onClick={() => dialogos.abrirEditar(registro)} />
      <IconButton icono={Trash2} etiqueta={`Eliminar registro ${registro.id}`} className="hover:bg-danger-soft! hover:text-danger!" onClick={() => dialogos.pedirEliminar(registro)} />
    </div>
  );

  const renderContenido = () => {
    if (error) return <ErrorState mensaje={error} onRetry={recargar} />;
    if (!entidad) return <div className="space-y-3">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-16" />)}</div>;
    if (registros.length === 0) {
      return (
        <EmptyState
          icono={Icono}
          titulo={`Aún no hay ${entidad.plural.toLowerCase()}`}
          texto={entidad.descripcion}
          accion={<Button variante="senal" icono={Plus} onClick={dialogos.abrirCrear}>Crear el primero</Button>}
        />
      );
    }
    if (filtrados.length === 0) return <EmptyState icono={Icono} titulo="Sin coincidencias" texto={`Nada coincide con "${busqueda}".`} />;

    return (
      <>
        {/* Pantallas anchas (≥1280 px): tabla */}
        <div className="scrollbar-fino relative hidden overflow-x-auto rounded-3xl border border-line bg-panel shadow-ticket xl:block">
          <table className="w-full text-left text-[15px]">
            <thead className="border-b border-line bg-paper/60 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              <tr>
                <th className="w-16 px-5 py-3.5 font-bold">#</th>
                {columnas.map((c) => <th key={c.nombre} className="px-4 py-3.5 font-bold whitespace-nowrap">{c.etiqueta}</th>)}
                <th className="px-5 py-3.5"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtrados.map((registro) => (
                <tr key={registro.id} className="transition hover:bg-paper/50">
                  <td className="px-5 py-3 font-mono text-xs text-muted">{registro.id}</td>
                  {columnas.map((c, i) => (
                    <td key={c.nombre} className={`max-w-72 px-4 py-3 ${i === 0 ? 'font-semibold' : 'text-ink-soft'}`}>
                      <ValorCelda campo={c} registro={registro} />
                    </td>
                  ))}
                  <td className="px-5 py-3">{acciones(registro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Móvil, tablet y laptop pequeña: tarjetas */}
        <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
          {filtrados.map((registro) => (
            <li key={registro.id} className="rounded-2xl border border-line bg-panel p-4 shadow-ticket">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] text-muted">#{registro.id}</p>
                  <p className="font-semibold">{principal && <ValorCelda campo={principal} registro={registro} />}</p>
                </div>
                {acciones(registro)}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                {secundarias.map((c) => (
                  <div key={c.nombre} className="min-w-0">
                    <dt className="font-mono text-[10px] font-bold tracking-wider text-muted uppercase">{c.etiqueta}</dt>
                    <dd className="mt-0.5 truncate text-ink-soft"><ValorCelda campo={c} registro={registro} /></dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="animate-rise">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Administración
      </Link>

      <PageHeader
        etiqueta={entidad ? `${entidad.grupo} · ${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}` : 'Cargando…'}
        titulo={entidad?.plural ?? ' '}
        descripcion={entidad?.descripcion}
        acciones={entidad && <Button variante="senal" icono={Plus} onClick={dialogos.abrirCrear}>Nuevo · {entidad.singular}</Button>}
      />

      {registros.length > 0 && (
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder={`Buscar en ${entidad?.plural.toLowerCase() ?? ''}`} etiqueta="Buscar registros" className="mb-5 max-w-md" />
      )}

      {renderContenido()}

      {dialogos.formulario && entidad && (
        <RegistroFormModal entidad={entidad} registro={dialogos.formulario.registro} onClose={dialogos.cerrarFormulario} onGuardado={alGuardar} />
      )}

      <ConfirmDialog
        abierto={Boolean(dialogos.porEliminar)}
        onCancel={dialogos.cancelarEliminar}
        onConfirm={dialogos.confirmarEliminar}
        cargando={dialogos.eliminando}
        titulo={`¿Eliminar ${entidad?.singular.toLowerCase() ?? 'registro'}?`}
        mensaje={
          <p>
            Se eliminará el registro <strong>#{dialogos.porEliminar?.id}</strong>
            {principal && dialogos.porEliminar && <> · {textoDeValor(principal, dialogos.porEliminar)}</>}.
          </p>
        }
      />
    </div>
  );
};
