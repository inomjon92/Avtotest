import type { RoadSign as Sign } from '../data/types';

const ARROWS: Record<string, string> = {
  'arrow-up': 'M50 18 L68 40 H57 V82 H43 V40 H32 Z',
  'arrow-right': 'M82 50 L60 32 V43 H22 V57 H60 V68 Z',
  'arrow-left': 'M18 50 L40 32 V43 H78 V57 H40 V68 Z',
  'arrow-uturn': 'M64 82 V42 A14 14 0 0 0 36 42 V56 H26 L42 74 L58 56 H48 V42 A2 2 0 0 1 52 42 V82 Z',
};


// Belgilardagi piktogrammalar (100x100 koordinatada, markaz 50,50)
const K = '#111827';
function Car({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 10 L3 3 Q5 -2 10 -2 H22 Q27 -2 29 3 L32 10 V16 H0 Z" fill={fill} />
      <circle cx={7} cy={16} r={3.5} fill={fill} /><circle cx={25} cy={16} r={3.5} fill={fill} />
      <path d="M6 3 H26 L28 8 H4 Z" fill="#fff" opacity=".85" />
    </g>
  );
}
function Person({ x, y, s = 1, c = K }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={c} strokeWidth="5" strokeLinecap="round" fill="none">
      <circle cx={2} cy={-24} r={5} fill={c} stroke="none" />
      <path d="M1 -17 L-2 2 M-2 2 L-9 18 M-2 2 L7 17 M0 -13 L-10 -4 M0 -13 L9 -6" />
    </g>
  );
}
const PICTO: Record<string, (c: string) => React.ReactNode> = {
  barrier: (c) => <g fill="none" stroke={c} strokeWidth="5" strokeLinejoin="round"><path d="M28 64 V40 H72 V64 M28 52 H72 M40 40 V64 M52 40 V64 M64 40 V64" /></g>,
  train: (c) => (
    <g fill={c}>
      <path d="M26 64 V44 H46 V34 H70 V64 Z" />
      <rect x={30} y={36} width={6} height={8} />
      <rect x={52} y={39} width={12} height={9} fill="#fff" />
      <circle cx={34} cy={68} r={5} /><circle cx={48} cy={68} r={5} /><circle cx={62} cy={68} r={5} />
    </g>
  ),
  light: () => (
    <g>
      <rect x={40} y={26} width={20} height={48} rx={5} fill={K} />
      <circle cx={50} cy={35} r={5.5} fill="#ef4444" /><circle cx={50} cy={50} r={5.5} fill="#facc15" /><circle cx={50} cy={65} r={5.5} fill="#22c55e" />
    </g>
  ),
  curve: (c) => <g fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"><path d="M42 74 V50 Q42 38 54 38 H58" /><path d="M54 28 L66 38 L54 48" /></g>,
  bumps: (c) => <path d="M22 66 H30 Q38 46 46 66 H54 Q62 46 70 66 H78" fill="none" stroke={c} strokeWidth="6" strokeLinejoin="round" />,
  ped: (c) => <Person x={50} y={60} s={1.15} c={c} />,
  children: (c) => <g><Person x={40} y={60} s={1.05} c={c} /><Person x={62} y={64} s={0.8} c={c} /></g>,
  worker: (c) => (
    <g>
      <Person x={42} y={60} s={1} c={c} />
      <path d="M52 46 L66 66" stroke={c} strokeWidth="4" strokeLinecap="round" />
      <path d="M60 70 Q68 56 78 70 Z" fill={c} />
    </g>
  ),
  oncoming: () => (
    <g>
      <path d="M38 76 V36 M30 44 L38 32 L46 44" fill="none" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M62 24 V64 M54 56 L62 68 L70 56" fill="none" stroke={K} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  truck: (c) => (
    <g fill={c}>
      <rect x={24} y={38} width={34} height={22} />
      <path d="M60 46 H70 L76 53 V60 H60 Z" />
      <circle cx={33} cy={62} r={5} /><circle cx={68} cy={62} r={5} />
    </g>
  ),
  cars: () => <g><Car x={18} y={46} fill="#dc2626" /><Car x={52} y={46} fill={K} /></g>,
  round: (c) => (
    <g transform="translate(100 0) scale(-1 1)" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round">
      {[0, 120, 240].map((a) => (
        <g key={a} transform={`rotate(${a} 50 50)`}>
          <path d="M41 25.6 A26 26 0 0 1 72 37" />
          <path d="M78.5 36 L77 47.5 L67.5 41.5 Z" fill={c} stroke={c} strokeWidth="2" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  ),
  bus: (c) => (
    <g fill={c}>
      <rect x={30} y={26} width={40} height={46} rx={6} />
      <rect x={35} y={32} width={30} height={16} rx={2} fill="#2563eb" />
      <circle cx={38} cy={62} r={3} fill="#2563eb" /><circle cx={62} cy={62} r={3} fill="#2563eb" />
      <rect x={33} y={72} width={8} height={6} /><rect x={59} y={72} width={8} height={6} />
    </g>
  ),
  aid: () => <g fill="#dc2626"><rect x={42} y={28} width={16} height={44} /><rect x={28} y={42} width={44} height={16} /></g>,
  fuel: (c) => (
    <g fill={c}>
      <rect x={32} y={30} width={24} height={44} rx={3} />
      <rect x={36} y={35} width={16} height={12} fill="#fff" />
      <path d="M56 40 H62 Q66 40 66 44 V62 Q66 66 70 66 Q72 66 72 62 V42 L66 36" fill="none" stroke={c} strokeWidth="4" />
    </g>
  ),
  highway: () => (
    <g>
      <path d="M44 30 L30 76 H70 L56 30 Z" fill="#fff" />
      <path d="M50 34 V44 M50 52 V62 M50 68 V74" stroke="#2563eb" strokeWidth="3" />
      <rect x={24} y={38} width={52} height={8} fill="#fff" />
      <rect x={24} y={46} width={6} height={10} fill="#fff" /><rect x={70} y={46} width={6} height={10} fill="#fff" />
    </g>
  ),
  yard: () => (
    <g>
      <path d="M22 50 L40 34 L58 50 V72 H22 Z" fill="#fff" />
      <rect x={34} y={58} width={10} height={14} fill="#2563eb" />
      <Person x={66} y={66} s={0.8} c="#fff" />
    </g>
  ),
  maindir: () => (
    <g fill="none" strokeLinecap="square">
      <path d="M50 66 V50 H20" stroke={K} strokeWidth="7" />
      <path d="M50 50 H80 M50 50 V34" stroke={K} strokeWidth="2.5" />
    </g>
  ),
};

function Symbol({ symbol, color = '#111827', size = 40 }: { symbol?: string; color?: string; size?: number }) {
  if (!symbol) return null;
  if (ARROWS[symbol]) return <path d={ARROWS[symbol]} fill={color} />;
  if (symbol.startsWith('p:')) return <>{PICTO[symbol.slice(2)]?.(color)}</>;
  return (
    <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontSize={symbol.length > 2 ? size * 0.6 : size}
      fontWeight={700} fontFamily="Arial, Helvetica, sans-serif" fill={color}>{symbol}</text>
  );
}

export function RoadSign({ sign, size = 96, title, bg }: { sign: Sign; size?: number; title?: string; bg?: string }) {
  const label = title ?? `${sign.code} ${sign.name}`;
  let body: React.ReactNode;
  switch (sign.shape) {
    case 'warning':
      body = (<>
        <path d="M50 6 L95 88 H5 Z" fill="#fff" stroke="#dc2626" strokeWidth="8" strokeLinejoin="round" />
        <g transform={sign.symbol?.startsWith('p:') ? 'translate(13 26) scale(.74)' : 'translate(0 12)'}><Symbol symbol={sign.symbol} size={30} /></g>
      </>);
      break;
    case 'giveway':
      body = <path d="M5 10 H95 L50 92 Z" fill="#fff" stroke="#dc2626" strokeWidth="9" strokeLinejoin="round" />;
      break;
    case 'stop':
      body = (<>
        <path d="M30 3 H70 L97 30 V70 L70 97 H30 L3 70 V30 Z" fill="#dc2626" stroke="#fff" strokeWidth="3" />
        <text x="50" y="51" textAnchor="middle" dominantBaseline="central" fontSize="27" fontWeight={800} fill="#fff" fontFamily="Arial, Helvetica, sans-serif">STOP</text>
      </>);
      break;
    case 'main':
    case 'mainEnd':
      body = (<>
        <path d="M50 3 L97 50 L50 97 L3 50 Z" fill="#fff" stroke="#9ca3af" strokeWidth="2" />
        <path d="M50 18 L82 50 L50 82 L18 50 Z" fill="#facc15" stroke="#111827" strokeWidth="2" />
        {sign.shape === 'mainEnd' && <path d="M30 70 L70 30" stroke="#111827" strokeWidth="6" />}
      </>);
      break;
    case 'noentry':
      body = (<>
        <circle cx="50" cy="50" r="46" fill="#dc2626" />
        <rect x="18" y="41" width="64" height="18" fill="#fff" />
      </>);
      break;
    case 'prohibit':
      body = (<>
        <circle cx="50" cy="50" r="42" fill={bg ?? '#fff'} stroke="#dc2626" strokeWidth="9" />
        <Symbol symbol={sign.symbol} size={34} />
        {sign.slash && <path d="M22 22 L78 78" stroke="#dc2626" strokeWidth="8" />}
      </>);
      break;
    case 'nostop':
      body = (<>
        <circle cx="50" cy="50" r="42" fill="#2563eb" stroke="#dc2626" strokeWidth="9" />
        <path d="M22 22 L78 78" stroke="#dc2626" strokeWidth="8" />
        {sign.symbol === 'x' && <path d="M78 22 L22 78" stroke="#dc2626" strokeWidth="8" />}
      </>);
      break;
    case 'mandatory':
      body = (<>
        <circle cx="50" cy="50" r="46" fill="#2563eb" />
        <Symbol symbol={sign.symbol} color="#fff" size={40} />
      </>);
      break;
    case 'square':
      body = (<>
        <rect x="6" y="6" width="88" height="88" rx="8" fill="#2563eb" />
        <rect x="16" y="16" width="68" height="68" rx="4" fill={sign.group === 6 ? '#fff' : '#2563eb'} />
        <Symbol symbol={sign.symbol} color={sign.group === 6 ? '#111827' : '#fff'} size={40} />
      </>);
      break;
    case 'town':
    case 'townEnd':
      body = (<>
        <rect x="3" y="26" width="94" height="48" rx="4" fill="#fff" stroke="#111827" strokeWidth="3" />
        <text x="50" y="51" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight={800} fill="#111827" fontFamily="Arial, Helvetica, sans-serif">{sign.symbol}</text>
        {sign.shape === 'townEnd' && <path d="M8 70 L92 30" stroke="#dc2626" strokeWidth="5" />}
      </>);
      break;
    case 'plate':
      body = (<>
        <rect x="4" y="28" width="92" height="44" rx="4" fill="#fff" stroke="#111827" strokeWidth="3" />
        <Symbol symbol={sign.symbol} size={30} />
      </>);
      break;
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} className="road-sign">
      <title>{label}</title>
      {body}
    </svg>
  );
}
