// Grupo de opciones tipo "pastillas" (radio buttons accesibles).
export const ChoiceGroup = ({ name, label, opciones, valor, onChange, error, iconos = {} }) => (
  <fieldset className="space-y-1.5">
    <legend className="mb-1.5 text-[13px] font-semibold text-ink-soft">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {opciones.map((opcion) => {
        const Icono = iconos[opcion];
        const activo = valor === opcion;
        return (
          <label
            key={opcion}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-signal/20 ${
              activo ? 'border-ink bg-ink text-paper' : 'border-line bg-panel text-ink-soft hover:border-line-strong'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opcion}
              checked={activo}
              onChange={() => onChange(opcion)}
              className="sr-only"
            />
            {Icono && <Icono className={`size-4 ${activo ? 'text-signal' : ''}`} aria-hidden />}
            {opcion}
          </label>
        );
      })}
    </div>
    {error && <p className="text-[13px] text-danger">{error}</p>}
  </fieldset>
);
