// Estado compartido por las páginas CRUD: formulario (crear/editar) y confirmación de borrado.
import { useCallback, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';

/**
 * @param {(id: number) => Promise<{ message: string }>} eliminarFn  Servicio que elimina por id.
 * @param {() => void} alEliminar  Se ejecuta después de eliminar (por ejemplo, recargar la lista).
 */
export const useCrudDialogs = (eliminarFn, alEliminar) => {
  const toast = useToast();
  // null = cerrado · { registro: null } = crear · { registro: {...} } = editar
  const [formulario, setFormulario] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirCrear = useCallback(() => setFormulario({ registro: null }), []);
  const abrirEditar = useCallback((registro) => setFormulario({ registro }), []);
  const cerrarFormulario = useCallback(() => setFormulario(null), []);

  const confirmarEliminar = async () => {
    setEliminando(true);
    try {
      const respuesta = await eliminarFn(porEliminar.id);
      toast.exito(respuesta?.message ?? 'Registro eliminado');
      alEliminar(porEliminar);
    } catch (error) {
      // 409: otros registros dependen de este (el mensaje del backend explica por qué)
      toast.error(error.message);
    } finally {
      setEliminando(false);
      setPorEliminar(null);
    }
  };

  return {
    formulario,
    abrirCrear,
    abrirEditar,
    cerrarFormulario,
    porEliminar,
    pedirEliminar: setPorEliminar,
    cancelarEliminar: () => setPorEliminar(null),
    confirmarEliminar,
    eliminando,
  };
};
