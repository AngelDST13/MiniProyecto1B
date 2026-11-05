// Formulario de crear / editar orden de servicio.
// El cliente se elige con un <select> cargado desde la API de clientes (relación).
import { Link } from 'react-router-dom';
import { ordenService } from '../../services/ordenService.js';
import { useFormState } from '../../hooks/useFormState.js';
import { ESTADOS, TIPOS_EQUIPO, TIPO_EQUIPO_ICONO } from '../../constants/dominio.js';
import { nowDateTimeInput, toDateTimeInput } from '../../utils/format.js';
import { Modal } from '../ui/Modal.jsx';
import { FormError, SelectInput, TextArea, TextInput } from '../ui/Field.jsx';
import { ChoiceGroup } from '../ui/ChoiceGroup.jsx';
import { FormActions } from '../ui/FormActions.jsx';

const CAMPOS = ['cliente_id', 'tipo_equipo', 'marca_modelo', 'serial', 'fecha_ingreso', 'estado', 'diagnostico'];

export const OrdenFormModal = ({ orden, clientes, onClose, onGuardado }) => {
  const esEdicion = Boolean(orden);
  const { valores, errores, enviando, cambiar, asignar, enviar } = useFormState({
    cliente_id: orden?.cliente_id ?? '',
    tipo_equipo: orden?.tipo_equipo ?? 'Laptop',
    marca_modelo: orden?.marca_modelo ?? '',
    serial: orden?.serial ?? '',
    fecha_ingreso: orden ? toDateTimeInput(orden.fecha_ingreso) : nowDateTimeInput(),
    estado: orden?.estado ?? 'Recibido',
    diagnostico: orden?.diagnostico ?? '',
  });

  const alEnviar = enviar(async (datos) => {
    const cuerpo = { ...datos, cliente_id: Number(datos.cliente_id) || datos.cliente_id };
    const respuesta = esEdicion ? await ordenService.update(orden.id, cuerpo) : await ordenService.create(cuerpo);
    onGuardado(respuesta.data, respuesta.message);
  });

  const hayErrorDeCampo = CAMPOS.some((campo) => errores[campo]);

  return (
    <Modal
      abierto
      onClose={onClose}
      ancho="sm:max-w-2xl"
      titulo={esEdicion ? 'Editar orden de servicio' : 'Nueva orden de servicio'}
      descripcion="Registra el equipo que ingresa al taller y su diagnóstico inicial."
    >
      {clientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong p-6 text-center">
          <p className="font-semibold">Primero necesitas un cliente</p>
          <p className="mt-1 text-sm text-muted">Toda orden pertenece a un cliente registrado.</p>
          <Link to="/clientes" className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-paper">
            Ir a Clientes
          </Link>
        </div>
      ) : (
        <form onSubmit={alEnviar} noValidate className="space-y-4">
          <SelectInput id="cliente_id" name="cliente_id" label="Cliente" value={valores.cliente_id}
            onChange={cambiar} error={errores.cliente_id} required>
            <option value="" disabled>Selecciona un cliente…</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.nombre} · CI {cliente.cedula}</option>
            ))}
          </SelectInput>

          <ChoiceGroup name="tipo_equipo" label="Tipo de equipo" opciones={TIPOS_EQUIPO} iconos={TIPO_EQUIPO_ICONO}
            valor={valores.tipo_equipo} onChange={(valor) => asignar('tipo_equipo', valor)} error={errores.tipo_equipo} />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput id="marca_modelo" name="marca_modelo" label="Marca y modelo" placeholder="Lenovo IdeaPad 3"
              value={valores.marca_modelo} onChange={cambiar} error={errores.marca_modelo} autoComplete="off" required />
            <TextInput id="serial" name="serial" label="Número de serie" placeholder="PF3K9X21" className="font-mono"
              value={valores.serial} onChange={cambiar} error={errores.serial} autoComplete="off" required />
            <TextInput id="fecha_ingreso" name="fecha_ingreso" label="Fecha de ingreso" type="datetime-local"
              value={valores.fecha_ingreso} onChange={cambiar} error={errores.fecha_ingreso} />
            <SelectInput id="estado" name="estado" label="Estado" value={valores.estado} onChange={cambiar} error={errores.estado}>
              {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </SelectInput>
          </div>

          <TextArea id="diagnostico" name="diagnostico" label="Diagnóstico" hint="Opcional. Falla reportada o hallazgos del técnico."
            placeholder="No enciende; posible falla en la fuente de poder."
            value={valores.diagnostico} onChange={cambiar} error={errores.diagnostico} />

          {!hayErrorDeCampo && <FormError mensaje={errores._form} />}
          <FormActions onCancel={onClose} enviando={enviando} textoGuardar={esEdicion ? 'Guardar cambios' : 'Abrir orden'} />
        </form>
      )}
    </Modal>
  );
};
