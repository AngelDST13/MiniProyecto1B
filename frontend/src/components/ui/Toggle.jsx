// Interruptor accesible para campos verdadero / falso.
export const Toggle = ({ id, label, checked, onChange, ayuda }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel px-3.5 py-2.5">
    <div>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-soft">{label}</label>
      {ayuda && <p className="text-xs text-muted">{ayuda}</p>}
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-st-reparado' : 'bg-line-strong'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
      <span className="sr-only">{checked ? 'Sí' : 'No'}</span>
    </button>
  </div>
);
