// Confirmación antes de eliminar (reemplaza a window.confirm con algo propio y accesible).
import { TriangleAlert } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

export const ConfirmDialog = ({
  abierto,
  onCancel,
  onConfirm,
  titulo = '¿Eliminar registro?',
  mensaje,
  textoConfirmar = 'Sí, eliminar',
  cargando = false,
}) => (
  <Modal abierto={abierto} onClose={onCancel} titulo={titulo} ancho="sm:max-w-md">
    <div className="flex gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-danger-soft text-danger">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <div className="text-[15px] leading-relaxed text-ink-soft">
        {mensaje}
        <p className="mt-2 text-sm text-muted">Esta acción no se puede deshacer.</p>
      </div>
    </div>
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variante="borde" onClick={onCancel} disabled={cargando}>Cancelar</Button>
      <Button variante="peligro" onClick={onConfirm} cargando={cargando}>{textoConfirmar}</Button>
    </div>
  </Modal>
);
