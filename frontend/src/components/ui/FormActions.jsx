// Botones al pie de los formularios en modal.
import { Button } from './Button.jsx';

export const FormActions = ({ onCancel, enviando, textoGuardar = 'Guardar' }) => (
  <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
    <Button variante="borde" onClick={onCancel} disabled={enviando}>Cancelar</Button>
    <Button type="submit" variante="senal" cargando={enviando}>{textoGuardar}</Button>
  </div>
);
