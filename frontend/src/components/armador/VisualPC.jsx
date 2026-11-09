// Vista lateral del gabinete (panel de vidrio). Cada pieza aparece al elegirla;
// mientras no está elegida se dibuja su silueta punteada. Pasar el cursor sobre una pieza la resalta.
import { esNvme } from '../../utils/armador.js';

const ALTO_PLACA = { ATX: 236, mATX: 196, ITX: 150 };

const Ventilador = ({ cx, cy, r, girando }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} className="fill-ink stroke-white/25" strokeWidth="1.5" />
    <g className={girando ? 'ventilador' : ''}>
      <circle cx={cx} cy={cy} r={r} fill="transparent" />
      {[0, 72, 144, 216, 288].map((angulo) => (
        <path
          key={angulo}
          d={`M ${cx} ${cy} q ${r * 0.55} ${-r * 0.2} ${r * 0.8} ${-r * 0.62}`}
          transform={`rotate(${angulo} ${cx} ${cy})`}
          className="fill-none stroke-white/55"
          strokeWidth={r > 20 ? 5 : 3.5}
          strokeLinecap="round"
        />
      ))}
    </g>
    <circle cx={cx} cy={cy} r={r * 0.2} className="fill-ink-soft stroke-white/30" />
  </g>
);

// Pieza con dos estados: silueta (sin elegir) o real (elegida). `resaltar` enfoca la pieza del paso activo.
const Pieza = ({ elegida, activa, titulo, children, silueta }) => (
  <g className={`transition-opacity duration-300 ${activa ? 'opacity-100' : 'opacity-95'}`}>
    <title>{titulo}</title>
    {elegida ? <g key="real" className="animate-fade">{children}</g> : silueta}
  </g>
);

const Silueta = ({ x, y, w, h, rx = 6, activa }) => (
  <rect x={x} y={y} width={w} height={h} rx={rx}
    className={`fill-white/3 ${activa ? 'stroke-signal' : 'stroke-white/25'}`} strokeWidth={activa ? 2 : 1.25} strokeDasharray="6 5" />
);

export const VisualPC = ({ sel, pasoActivo }) => {
  const { cpu, motherboard: placa, ram, gpu, almacenamiento: disco, fuente, gabinete, enfriamiento: cooler } = sel;
  const altoPlaca = ALTO_PLACA[placa?.pc_formato ?? 'ATX'];
  const placaY = 42;
  const gpuY = placaY + altoPlaca * 0.66;
  const ddr5 = ram?.pc_memoria === 'DDR5';
  const activa = (clave) => pasoActivo === clave;

  return (
    <svg viewBox="0 0 340 430" className="h-auto w-full" role="img" aria-label="Vista previa de tu PC">
      <defs>
        <linearGradient id="vidrio" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.07" />
        </linearGradient>
        <linearGradient id="rgb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff5a1f" />
          <stop offset="0.5" stopColor="#c43d7a" />
          <stop offset="1" stopColor="#3d6be0" />
        </linearGradient>
        <filter id="brillo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Gabinete */}
      <rect x="8" y="8" width="324" height="414" rx="22" className={`fill-[#101217] ${gabinete ? 'stroke-signal' : 'stroke-white/30'}`}
        strokeWidth={gabinete ? 3 : 1.5} strokeDasharray={gabinete ? undefined : '8 6'}>
        <title>{gabinete ? `Gabinete: ${gabinete.nombre}` : 'Gabinete (sin elegir)'}</title>
      </rect>
      {gabinete && <rect x="14" y="410" width="312" height="5" rx="2.5" fill="url(#rgb)" opacity="0.8" />}
      {/* Ventiladores frontales del gabinete */}
      {gabinete && [92, 176, 260].map((cy) => <Ventilador key={cy} cx={306} cy={cy} r={16} girando />)}

      {/* Tarjeta madre */}
      <Pieza elegida={placa} activa={activa('motherboard')} titulo={placa ? `Tarjeta madre: ${placa.nombre}` : 'Tarjeta madre'}
        silueta={<Silueta x={34} y={placaY} w={244} h={altoPlaca} activa={activa('motherboard')} />}>
        <rect x="34" y={placaY} width="244" height={altoPlaca} rx="8" className="fill-[#1d2a24] stroke-[#2f9e6a]/60" strokeWidth="1.5" />
        {/* pistas decorativas */}
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M 46 ${placaY + 20 + i * 9} h 60 l 10 10 h 40`} className="fill-none stroke-[#2f9e6a]/35" strokeWidth="1" />
        ))}
        <rect x="44" y={placaY + altoPlaca - 30} width="70" height="16" rx="3" className="fill-[#0f1a15] stroke-[#2f9e6a]/40" />
        <text x="270" y={placaY + altoPlaca - 10} textAnchor="end" className="fill-white/45 font-mono text-[9px]">{placa?.pc_formato} · {placa?.pc_socket}</text>
      </Pieza>

      {/* Procesador / disipador */}
      <Pieza elegida={cpu} activa={activa('cpu')} titulo={cpu ? `Procesador: ${cpu.nombre}` : 'Procesador'}
        silueta={<Silueta x={126} y={placaY + 34} w={52} h={52} activa={activa('cpu')} />}>
        <rect x="126" y={placaY + 34} width="52" height="52" rx="5" className="fill-line-strong stroke-white/50" />
        <rect x="136" y={placaY + 44} width="32" height="32" rx="3" className="fill-[#8f8a80]" />
        <text x="152" y={placaY + 64} textAnchor="middle" className="fill-ink font-mono text-[8px] font-bold">{cpu?.pc_socket}</text>
      </Pieza>
      {cooler && cpu && (
        <g className="animate-fade">
          <title>{`Enfriamiento: ${cooler.nombre}`}</title>
          <rect x="110" y={placaY + 18} width="84" height="84" rx="10" className="fill-[#1b2a33] stroke-[#1fa4c4]/60" strokeWidth="1.5" />
          <Ventilador cx={152} cy={placaY + 60} r={34} girando />
        </g>
      )}
      {!cooler && activa('enfriamiento') && <Silueta x={110} y={placaY + 18} w={84} h={84} rx={10} activa />}

      {/* Memoria RAM */}
      <Pieza elegida={ram} activa={activa('ram')} titulo={ram ? `RAM: ${ram.nombre}` : 'Memoria RAM'}
        silueta={<Silueta x={210} y={placaY + 22} w={40} h={96} rx={3} activa={activa('ram')} />}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={210 + i * 11} y={placaY + 22} width="7" height="96" rx="2" className={i % 2 === 0 ? 'fill-[#2b2550]' : 'fill-[#2b2550]/40'} />
            {i % 2 === 0 && ddr5 && <rect x={210 + i * 11} y={placaY + 22} width="7" height="10" rx="2" fill="url(#rgb)" />}
          </g>
        ))}
      </Pieza>

      {/* Almacenamiento: NVMe sobre la placa o disco en la bahía inferior */}
      <Pieza elegida={disco} activa={activa('almacenamiento')} titulo={disco ? `Almacenamiento: ${disco.nombre}` : 'Almacenamiento'}
        silueta={<Silueta x={196} y={334} w={110} h={60} activa={activa('almacenamiento')} />}>
        {esNvme(disco) ? (
          <g>
            <rect x="122" y={gpuY - 26} width="70" height="14" rx="3" className="fill-ink stroke-white/40" />
            <rect x="128" y={gpuY - 23} width="18" height="8" rx="1" className="fill-[#8f8a80]" />
          </g>
        ) : (
          <g>
            <rect x="196" y="334" width="110" height="60" rx="6" className="fill-[#1a2f28] stroke-st-reparado/60" strokeWidth="1.5" />
            <circle cx="232" cy="364" r="16" className="fill-none stroke-white/20" strokeWidth="3" />
          </g>
        )}
      </Pieza>

      {/* Tarjeta de video */}
      <Pieza elegida={gpu} activa={activa('gpu')} titulo={gpu ? `Tarjeta de video: ${gpu.nombre}` : 'Tarjeta de video (opcional)'}
        silueta={<Silueta x={34} y={gpuY} w={232} h={44} activa={activa('gpu')} />}>
        <rect x="34" y={gpuY} width="232" height="44" rx="8" className="fill-[#1a1d29] stroke-st-recibido/70" strokeWidth="1.5" />
        <rect x="34" y={gpuY + 40} width="232" height="4" rx="2" fill="url(#rgb)" opacity="0.9" />
        <Ventilador cx={92} cy={gpuY + 22} r={17} girando />
        <Ventilador cx={160} cy={gpuY + 22} r={17} girando />
        <text x="256" y={gpuY + 26} textAnchor="end" className="fill-white/55 font-mono text-[8px]">{gpu?.marca}</text>
      </Pieza>

      {/* Cubierta y fuente de poder */}
      <rect x="20" y="318" width="300" height="2" className="fill-white/10" />
      <Pieza elegida={fuente} activa={activa('fuente')} titulo={fuente ? `Fuente: ${fuente.nombre}` : 'Fuente de poder'}
        silueta={<Silueta x={30} y={334} w={150} h={70} activa={activa('fuente')} />}>
        <rect x="30" y="334" width="150" height="70" rx="6" className="fill-[#2a2412] stroke-[#e0a106]/60" strokeWidth="1.5" />
        <Ventilador cx={80} cy={369} r={24} />
        <text x="170" y="374" textAnchor="end" className="fill-[#e0a106] font-mono text-[12px] font-bold">{fuente?.pc_consumo_w} W</text>
      </Pieza>

      {/* Reflejo del vidrio */}
      <rect x="8" y="8" width="324" height="414" rx="22" fill="url(#vidrio)" pointerEvents="none" />
      {gabinete && gpu && <ellipse cx="150" cy={gpuY + 44} rx="110" ry="10" fill="#ff5a1f" opacity="0.18" filter="url(#brillo)" />}
    </svg>
  );
};
