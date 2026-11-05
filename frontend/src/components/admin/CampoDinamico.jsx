// Dibuja el control adecuado según el tipo de campo que describe el backend.
import { SelectInput, TextArea, TextInput } from '../ui/Field.jsx';
import { PasswordInput } from '../ui/PasswordInput.jsx';
import { ChoiceGroup } from '../ui/ChoiceGroup.jsx';
import { Toggle } from '../ui/Toggle.jsx';

const ATRIBUTOS_TEXTO = {
  texto: {},
  email: { type: 'email', autoComplete: 'off' },
  telefono: { type: 'tel', inputMode: 'tel' },
  cedula: { inputMode: 'numeric', maxLength: 10 },
  url: { type: 'url', placeholder: 'https://' },
};

export const CampoDinamico = ({ campo, valor, error, onCambiar, opciones = [], esEdicion }) => {
  const id = `campo-${campo.nombre}`;
  const etiqueta = campo.requerido && !(campo.tipo === 'password' && esEdicion) ? `${campo.etiqueta} *` : campo.etiqueta;
  const comun = {
    id,
    name: campo.nombre,
    label: etiqueta,
    error,
    hint: campo.ayuda,
    value: valor ?? '',
    onChange: (evento) => onCambiar(campo.nombre, evento.target.value),
  };

  switch (campo.tipo) {
    case 'textoLargo':
      return <TextArea {...comun} maxLength={campo.max} />;

    case 'password':
      return <PasswordInput {...comun} autoComplete="new-password" placeholder={esEdicion ? 'Sin cambios' : ''} />;

    case 'entero':
    case 'decimal':
      return (
        <TextInput
          {...comun}
          type="number"
          inputMode="decimal"
          step={campo.tipo === 'entero' ? '1' : '0.01'}
          min={campo.min}
          max={campo.max}
        />
      );

    case 'fecha':
      return <TextInput {...comun} type="date" />;

    case 'fechaHora':
      return <TextInput {...comun} type="datetime-local" />;

    case 'booleano':
      return <Toggle id={id} label={campo.etiqueta} checked={Boolean(valor)} onChange={(v) => onCambiar(campo.nombre, v)} />;

    case 'opcion':
      return (
        <ChoiceGroup
          name={campo.nombre}
          label={etiqueta}
          opciones={campo.opciones}
          valor={valor}
          error={error}
          onChange={(v) => onCambiar(campo.nombre, v)}
        />
      );

    case 'ref':
      return (
        <SelectInput {...comun}>
          <option value="" disabled={campo.requerido}>
            {campo.requerido ? 'Selecciona una opción…' : 'Ninguna'}
          </option>
          {opciones.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>{opcion.etiqueta}</option>
          ))}
        </SelectInput>
      );

    default:
      return (
        <TextInput
          {...comun}
          {...ATRIBUTOS_TEXTO[campo.tipo]}
          maxLength={campo.max}
          className={campo.mono ? 'font-mono' : ''}
        />
      );
  }
};
