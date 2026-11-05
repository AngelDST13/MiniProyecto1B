// Formulario genérico de crear / editar para cualquier entidad de Administración.
import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';
import { useFormState } from '../../hooks/useFormState.js';
import { nowDateTimeInput, toDateTimeInput } from '../../utils/format.js';
import { Modal } from '../ui/Modal.jsx';
import { FormError } from '../ui/Field.jsx';
import { FormActions } from '../ui/FormActions.jsx';
import { Loader } from '../ui/Loader.jsx';
import { CampoDinamico } from './CampoDinamico.jsx';

// Valor inicial de cada campo: el del registro (al editar) o el valor por defecto (al crear).
const valorInicial = (campo, registro) => {
  if (registro) {
    const actual = registro[campo.nombre];
    if (campo.tipo === 'password') return '';
    if (campo.tipo === 'fechaHora') return toDateTimeInput(actual);
    if (campo.tipo === 'fecha') return actual ? String(actual).slice(0, 10) : '';
    if (campo.tipo === 'booleano') return Boolean(actual);
    return actual ?? '';
  }
  if (campo.porDefecto !== undefined) return campo.porDefecto;
  if (campo.tipo === 'fechaHora') return nowDateTimeInput();
  if (campo.tipo === 'fecha' && campo.requerido) return nowDateTimeInput().slice(0, 10);
  return '';
};

// Carga las opciones de todos los selectores de llaves foráneas del formulario.
const useOpcionesDeReferencias = (campos) => {
  const [opciones, setOpciones] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const referencias = [...new Set(campos.filter((c) => c.tipo === 'ref').map((c) => c.ref))];
    let activo = true;
    Promise.all(referencias.map((ref) => adminService.opciones(ref).then((r) => [ref, r.data])))
      .then((pares) => activo && setOpciones(Object.fromEntries(pares)))
      .catch((err) => activo && setError(err.message));
    return () => { activo = false; };
  }, [campos]);

  return { opciones, error };
};

export const RegistroFormModal = ({ entidad, registro, onClose, onGuardado }) => {
  const esEdicion = Boolean(registro);
  const { opciones, error: errorOpciones } = useOpcionesDeReferencias(entidad.campos);
  const { valores, errores, enviando, asignar, enviar } = useFormState(
    Object.fromEntries(entidad.campos.map((campo) => [campo.nombre, valorInicial(campo, registro)])),
  );

  const alEnviar = enviar(async (datos) => {
    const respuesta = esEdicion
      ? await adminService.update(entidad.clave, registro.id, datos)
      : await adminService.create(entidad.clave, datos);
    onGuardado(respuesta.data, respuesta.message);
  });

  const hayErrorDeCampo = entidad.campos.some((campo) => errores[campo.nombre]);
  const verbo = esEdicion ? 'Editar' : 'Nuevo';

  return (
    <Modal
      abierto
      onClose={onClose}
      ancho="sm:max-w-2xl"
      titulo={`${verbo} · ${entidad.singular}`}
      descripcion={entidad.descripcion}
    >
      {errorOpciones && <FormError mensaje={errorOpciones} />}
      {!opciones && !errorOpciones && <Loader texto="Preparando formulario…" />}

      {opciones && (
        <form onSubmit={alEnviar} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {entidad.campos.map((campo) => (
              <div key={campo.nombre} className={campo.ancho === 'completo' || campo.tipo === 'textoLargo' || campo.tipo === 'opcion' ? 'sm:col-span-2' : ''}>
                <CampoDinamico
                  campo={campo}
                  valor={valores[campo.nombre]}
                  error={errores[campo.nombre]}
                  opciones={opciones[campo.ref]}
                  esEdicion={esEdicion}
                  onCambiar={asignar}
                />
              </div>
            ))}
          </div>
          {!hayErrorDeCampo && <div className="mt-4"><FormError mensaje={errores._form} /></div>}
          <p className="mt-4 text-xs text-muted">* Campos obligatorios</p>
          <FormActions onCancel={onClose} enviando={enviando} textoGuardar={esEdicion ? 'Guardar cambios' : 'Crear registro'} />
        </form>
      )}
    </Modal>
  );
};
