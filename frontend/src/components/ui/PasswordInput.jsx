// Campo de contraseña con botón para mostrar/ocultar.
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextInput } from './Field.jsx';

export const PasswordInput = (props) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} type={visible ? 'text' : 'password'} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-[29px] right-1.5 grid size-8 place-items-center rounded-lg text-muted hover:text-ink"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
};
