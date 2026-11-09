// Formulario de crear / editar cliente.
import { clienteService } from '../../services/clienteService.js';
import { useFormState } from '../../hooks/useFormState.js';
import { Modal } from '../ui/Modal.jsx';
import { FormError, TextInput } from '../ui/Field.jsx';
import { FormActions } from '../ui/FormActions.jsx';

export const ClienteFormModal = ({ cliente, onClose, onGuardado }) => {
  const esEdicion = Boolean(cliente);
  const { valores, errores, enviando, cambiar, enviar } = useFormState({
    nombre: cliente?.nombre ?? '',
    cedula: cliente?.cedula ?? '',
    telefono: cliente?.telefono ?? '',
    email: cliente?.email ?? '',
  });

  const alEnviar = enviar(async (datos) => {
    const respuesta = esEdicion
      ? await clienteService.update(cliente.id, datos)
      : await clienteService.create(datos);
    onGuardado(respuesta.data, respuesta.message);
  });

  const hayErrorDeCampo = ['nombre', 'cedula', 'telefono', 'email'].some((campo) => errores[campo]);

  return (
    <Modal
      abierto
      onClose={onClose}
      titulo={esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
      descripcion={esEdicion ? `Actualiza los datos de ${cliente.nombre}.` : 'Registra a la persona que deja su equipo en el taller.'}
    >
      <form onSubmit={alEnviar} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextInput id="nombre" name="nombre" label="Nombre completo" placeholder="María Fernanda López"
              value={valores.nombre} onChange={cambiar} error={errores.nombre} autoComplete="off" required />
          </div>
          <TextInput id="cedula" name="cedula" label="Cédula" placeholder="1-0234-0567" inputMode="numeric"
            value={valores.cedula} onChange={cambiar} error={errores.cedula} required />
          <TextInput id="telefono" name="telefono" label="Teléfono" placeholder="8888-8888" type="tel"
            value={valores.telefono} onChange={cambiar} error={errores.telefono} required />
          <div className="sm:col-span-2">
            <TextInput id="email" name="email" label="Email" placeholder="cliente@correo.com" type="email"
              value={valores.email} onChange={cambiar} error={errores.email} required />
          </div>
        </div>
        {!hayErrorDeCampo && <div className="mt-4"><FormError mensaje={errores._form} /></div>}
        <FormActions onCancel={onClose} enviando={enviando} textoGuardar={esEdicion ? 'Guardar cambios' : 'Crear cliente'} />
      </form>
    </Modal>
  );
};
