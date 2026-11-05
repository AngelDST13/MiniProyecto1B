// Campos de formulario con etiqueta, ayuda y mensaje de error accesibles.

const BASE =
  'w-full rounded-xl border bg-panel px-3.5 text-[15px] text-ink placeholder:text-muted/60 transition focus:outline-none focus:ring-4 focus:ring-signal/15 focus:border-signal disabled:bg-paper';

const borde = (error) => (error ? 'border-danger' : 'border-line hover:border-line-strong');

const Campo = ({ id, label, error, hint, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[13px] font-semibold text-ink-soft">
      {label}
    </label>
    {children}
    {error ? (
      <p id={`${id}-msg`} className="text-[13px] text-danger">{error}</p>
    ) : (
      hint && <p id={`${id}-msg`} className="text-[13px] text-muted">{hint}</p>
    )}
  </div>
);

const ariaProps = (id, error, hint) => ({
  'aria-invalid': Boolean(error),
  'aria-describedby': error || hint ? `${id}-msg` : undefined,
});

export const TextInput = ({ id, label, error, hint, className = '', ...props }) => (
  <Campo id={id} label={label} error={error} hint={hint}>
    <input id={id} className={`${BASE} h-11 ${borde(error)} ${className}`} {...ariaProps(id, error, hint)} {...props} />
  </Campo>
);

export const SelectInput = ({ id, label, error, hint, children, className = '', ...props }) => (
  <Campo id={id} label={label} error={error} hint={hint}>
    <select id={id} className={`${BASE} h-11 pr-9 ${borde(error)} ${className}`} {...ariaProps(id, error, hint)} {...props}>
      {children}
    </select>
  </Campo>
);

export const TextArea = ({ id, label, error, hint, className = '', ...props }) => (
  <Campo id={id} label={label} error={error} hint={hint}>
    <textarea
      id={id}
      className={`${BASE} min-h-24 resize-y py-2.5 ${borde(error)} ${className}`}
      {...ariaProps(id, error, hint)}
      {...props}
    />
  </Campo>
);

// Error general del formulario (cuando la API no devuelve detalle por campo).
export const FormError = ({ mensaje }) =>
  mensaje ? (
    <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
      {mensaje}
    </p>
  ) : null;
