// Detalle completo de una orden: estado, datos del cliente y del equipo, repuestos usados.
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Pencil, Phone, Trash2 } from 'lucide-react';
import { ordenService } from '../../services/ordenService.js';
import { componenteService } from '../../services/componenteService.js';
import { useToast } from '../../hooks/useToast.js';
import { useCargaAsync } from '../../hooks/useCargaAsync.js';
import { TIPO_EQUIPO_ICONO } from '../../constants/dominio.js';
import { codigoOrden, formatDateTime } from '../../utils/format.js';
import { Modal } from '../ui/Modal.jsx';
import { Loader } from '../ui/Loader.jsx';
import { Button } from '../ui/Button.jsx';
import { ErrorState } from '../ui/Feedback.jsx';
import { EstadoStepper } from './EstadoStepper.jsx';
import { RepuestosDeOrden } from './RepuestosDeOrden.jsx';

const Dato = ({ etiqueta, children }) => (
  <div>
    <dt className="font-mono text-[10px] font-bold tracking-[0.16em] text-muted uppercase">{etiqueta}</dt>
    <dd className="mt-1 text-[15px]">{children}</dd>
  </div>
);

export const OrdenDetalleModal = ({ ordenId, onClose, onActualizada, onEditar, onEliminar }) => {
  const toast = useToast();
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    const [respuestaOrden, respuestaInventario] = await Promise.all([
      ordenService.get(ordenId),
      componenteService.list(),
    ]);
    return { orden: respuestaOrden.data, inventario: respuestaInventario.data };
  }, [ordenId]);

  const { datos, error, recargar, setDatos } = useCargaAsync(cargar);
  const orden = datos?.orden ?? null;
  const inventario = datos?.inventario ?? [];

  // Ejecuta una acción sobre la orden, refresca el detalle y avisa a la lista.
  const ejecutar = async (accion, mensajeExito) => {
    setOcupado(true);
    try {
      const respuesta = await accion();
      onActualizada(respuesta.data);
      const inventarioActual = await componenteService.list();
      setDatos({ orden: respuesta.data, inventario: inventarioActual.data });
      toast.exito(mensajeExito ?? respuesta.message);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const titulo = orden ? `${codigoOrden(orden.id)} · ${orden.marca_modelo}` : 'Orden de servicio';
  const IconoEquipo = orden ? TIPO_EQUIPO_ICONO[orden.tipo_equipo] : null;

  return (
    <Modal
      abierto
      onClose={onClose}
      ancho="sm:max-w-2xl"
      titulo={titulo}
      descripcion={orden ? `Ingresó el ${formatDateTime(orden.fecha_ingreso)}` : undefined}
      pie={
        orden && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variante="fantasma" icono={Trash2} className="text-danger hover:bg-danger-soft!" onClick={() => onEliminar(orden)}>
              Eliminar orden
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to={`/documentos/orden/${orden.id}`} target="_blank"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line-strong bg-panel px-4 text-sm font-semibold transition hover:border-ink">
                <FileText className="size-4" aria-hidden /> Informe técnico
              </Link>
              <Button variante="borde" icono={Pencil} onClick={() => onEditar(orden)}>Editar datos</Button>
            </div>
          </div>
        )
      }
    >
      {error && <ErrorState mensaje={error} onRetry={recargar} />}
      {!orden && !error && <Loader texto="Cargando orden…" />}

      {orden && (
        <div className="space-y-6">
          <EstadoStepper
            estado={orden.estado}
            deshabilitado={ocupado}
            onCambiar={(estado) => ejecutar(() => ordenService.updateEstado(orden.id, estado))}
          />

          <dl className="grid gap-5 rounded-2xl border border-line p-4 sm:grid-cols-2">
            <Dato etiqueta="Cliente">
              <span className="font-semibold">{orden.cliente.nombre}</span>
              <span className="block font-mono text-xs text-muted">CI {orden.cliente.cedula}</span>
              <a href={`tel:${orden.cliente.telefono}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-signal-deep hover:underline">
                <Phone className="size-3.5" aria-hidden /> {orden.cliente.telefono}
              </a>
            </Dato>
            <Dato etiqueta="Equipo">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                {IconoEquipo && <IconoEquipo className="size-4" aria-hidden />} {orden.tipo_equipo}
              </span>
              <span className="block font-mono text-xs text-muted">S/N {orden.serial}</span>
            </Dato>
            <div className="sm:col-span-2">
              <Dato etiqueta="Diagnóstico">
                {orden.diagnostico ? (
                  <span className="whitespace-pre-line text-ink-soft">{orden.diagnostico}</span>
                ) : (
                  <span className="text-muted italic">Sin diagnóstico registrado todavía.</span>
                )}
              </Dato>
            </div>
          </dl>

          <RepuestosDeOrden
            orden={orden}
            inventario={inventario}
            ocupado={ocupado}
            onAgregar={(componenteId, cantidad) =>
              ejecutar(() => ordenService.addComponente(orden.id, componenteId, cantidad))
            }
            onQuitar={(item) =>
              ejecutar(() => ordenService.removeComponente(orden.id, item.componente_id), `${item.nombre} retirado; el stock fue repuesto.`)
            }
          />
        </div>
      )}
    </Modal>
  );
};
