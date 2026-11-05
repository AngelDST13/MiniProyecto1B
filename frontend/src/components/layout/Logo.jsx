// Marca "Bancada": una B trazada como pieza de banco de trabajo + punto de señal.
export const LogoMark = ({ className = 'size-9' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect width="32" height="32" rx="9" fill="currentColor" />
    <path
      d="M9 8h9a5 5 0 0 1 2.6 9.3A5.5 5.5 0 0 1 18.5 24H9z"
      fill="none"
      stroke="#FF5A1F"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <circle cx="23.5" cy="8.5" r="2" fill="#FF5A1F" />
  </svg>
);

export const Logo = ({ claro = false }) => (
  <span className="flex items-center gap-2.5">
    <LogoMark className={`size-9 ${claro ? 'text-white/10' : 'text-ink'}`} />
    <span className="leading-none">
      <span className={`block font-display text-[19px] font-extrabold tracking-tight ${claro ? 'text-paper' : 'text-ink'}`}>
        Bancada
      </span>
      <span className={`mt-0.5 block font-mono text-[9.5px] font-bold tracking-[0.2em] uppercase ${claro ? 'text-paper/50' : 'text-muted'}`}>
        Servicio técnico
      </span>
    </span>
  </span>
);
