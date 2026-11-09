// Formulario de crear / editar repuesto.
import { componenteService } from '../../services/componenteService.js';
import { useFormState } from '../../hooks/useFormState.js';
import { CATEGORIAS, CATEGORIA_ICONO } from '../../constants/dominio.js';
import { Modal } from '../ui/Modal.jsx';
import { FormError, TextInput } from '../ui/Field.jsx';
import { ChoiceGroup } from '../ui/ChoiceGroup.jsx';
import { FormActions } from '../ui/FormActions.jsx';

export const ComponenteFormModal = ({ componente, onClose, onGuardado }) => {
  const esEdicion = Boolean(componente);
  const { valores, errores, enviando, cambiar, asignar, enviar } = useFormState({
    nombre: componente?.nombre ?? '',
    categoria: componente?.categoria ?? 'RAM',
    precio_unitario: componente?.precio_unitario ?? '',
    stock: componente?.stock ?? '',
  });

  const alEnviar = enviar(async (datos) => {
    const respuesta = esEdicion
      ? await componenteService.update(componente.id, datos)
      : await componenteService.create(datos);
    onGuardado(respuesta.data, respuesta.message);
  });

  const hayErrorDeCampo = ['nombre', 'categoria', 'precio_unitario', 'stock'].some((campo) => errores[campo]);

  return (
    <Modal
      abierto
      onClose={onClose}
      titulo={esEdicion ? 'Editar repuesto' : 'Nuevo repuesto'}
      descripcion="Componentes disponibles en el inventario del taller."
    >
      <form onSubmit={alEnviar} noValidate className="space-y-4">
        <TextInput id="nombre" name="nombre" label="Nombre del repuesto" placeholder="SSD NVMe 1TB Samsung 980"
          value={valores.nombre} onChange={cambiar} error={errores.nombre} autoComplete="off" required />

        <ChoiceGroup
          name="categoria"
          label="Categoría"
          opciones={CATEGORIAS}
          iconos={CATEGORIA_ICONO}
          valor={valores.categoria}
          onChange={(valor) => asignar('categoria', valor)}
          error={errores.categoria}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextInput id="precio_unitario" name="precio_unitario" label="Precio unitario (₡)" type="number"
            min="0" step="0.01" inputMode="decimal" placeholder="0.00"
            value={valores.precio_unitario} onChange={cambiar} error={errores.precio_unitario} required />
          <TextInput id="stock" name="stock" label="Stock (unidades)" type="number" min="0" step="1"
            inputMode="numeric" placeholder="0"
            value={valores.stock} onChange={cambiar} error={errores.stock} required />
        </div>

        {!hayErrorDeCampo && <FormError mensaje={errores._form} />}
        <FormActions onCancel={onClose} enviando={enviando} textoGuardar={esEdicion ? 'Guardar cambios' : 'Crear repuesto'} />
      </form>
    </Modal>
  );
};
