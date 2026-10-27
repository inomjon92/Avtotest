import type { RoadSign as Sign } from '../data/types';
import { useStore } from '../store/store';
import { mediaUrl } from '../store/api';

const ARROWS: Record<string, string> = {
  'arrow-up': 'M50 18 L68 40 H57 V82 H43 V40 H32 Z',
  'arrow-right': 'M82 50 L60 32 V43 H22 V57 H60 V68 Z',
  'arrow-left': 'M18 50 L40 32 V43 H78 V57 H40 V68 Z',
  'arrow-uturn': 'M64 82 V42 A14 14 0 0 0 36 42 V56 H26 L42 74 L58 56 H48 V42 A2 2 0 0 1 52 42 V82 Z',
  'arrow-up-right': 'M36 18 L52 36 H43 V84 H29 V36 H20 Z M43 66 Q43 52 60 52 H64 V43 L82 57 L64 71 V64 H60 Q55 64 55 70 V84 H43 Z',
  'arrow-up-left': 'M64 18 L80 36 H71 V84 H57 V36 H48 Z M57 66 Q57 52 40 52 H36 V43 L18 57 L36 71 V64 H40 Q45 64 45 70 V84 H57 Z',
  'arrow-keep-right': 'M24 34 L34 24 L66 56 L72 50 L76 76 L50 72 L56 66 Z',
  'arrow-keep-left': 'M76 34 L66 24 L34 56 L28 50 L24 76 L50 72 L44 66 Z',
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
  tram: (c) => (
    <g fill={c}>
      <path d="M36 22 H64 M50 22 V30" stroke={c} strokeWidth="3" />
      <rect x={32} y={30} width={36} height={40} rx={6} />
      <rect x={37} y={36} width={26} height={14} rx={2} fill="#fff" />
      <circle cx={40} cy={62} r={3} fill="#fff" /><circle cx={60} cy={62} r={3} fill="#fff" />
      <rect x={26} y={74} width={48} height={4} />
    </g>
  ),
  crossroad: (c) => <path d="M50 20 V80 M22 50 H78" stroke={c} strokeWidth="10" />,
  curves: (c) => <path d="M36 80 V66 Q36 56 46 54 L56 52 Q64 50 64 42 V36 M56 40 L64 26 L72 40" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />,
  descent: (c) => <g><path d="M20 30 L80 74 H20 Z" fill={c} /><text x={62} y={44} textAnchor="middle" fontSize="18" fontWeight={800} fill={c} fontFamily="Arial, sans-serif">10%</text></g>,
  ascent: (c) => <g><path d="M80 30 L20 74 H80 Z" fill={c} /><text x={38} y={44} textAnchor="middle" fontSize="18" fontWeight={800} fill={c} fontFamily="Arial, sans-serif">10%</text></g>,
  slippery: (c) => (
    <g>
      <g transform="translate(34 22) rotate(18 16 10)"><Car x={0} y={0} fill={c} /></g>
      <path d="M30 80 Q40 62 50 72 Q60 82 66 64 M44 82 Q54 66 62 76 Q70 84 76 70" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  narrow: (c) => <path d="M34 82 V58 L42 42 V20 M66 82 V58 L58 42 V20" fill="none" stroke={c} strokeWidth="7" strokeLinejoin="round" />,
  twoway: (c) => (
    <g fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M38 80 V30 M30 40 L38 28 L46 40" /><path d="M62 22 V72 M54 62 L62 74 L70 62" />
    </g>
  ),
  bike: (c) => (
    <g fill="none" stroke={c} strokeWidth="4.5" strokeLinejoin="round">
      <circle cx={30} cy={62} r={13} /><circle cx={72} cy={62} r={13} />
      <path d="M30 62 L44 40 H64 L72 62 M44 40 L54 62 L64 40 M40 34 H50 M64 40 L62 32 H70" strokeLinecap="round" />
    </g>
  ),
  secondary: (c) => <g><path d="M50 18 V82" stroke={c} strokeWidth="12" /><path d="M24 50 H76" stroke={c} strokeWidth="5" /></g>,
  adjright: (c) => <g><path d="M44 18 V82" stroke={c} strokeWidth="12" /><path d="M44 54 H78" stroke={c} strokeWidth="5" /></g>,
  adjleft: (c) => <g><path d="M56 18 V82" stroke={c} strokeWidth="12" /><path d="M56 54 H22" stroke={c} strokeWidth="5" /></g>,
  priority: () => (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none" strokeWidth="7">
      <path d="M38 78 V30 M30 40 L38 28 L46 40" stroke="#fff" />
      <path d="M62 22 V70 M54 60 L62 72 L70 60" stroke="#dc2626" />
    </g>
  ),
  car: (c) => <g transform="translate(26 36) scale(1.5)"><Car x={0} y={0} fill={c} /></g>,
  horn: (c) => (
    <g fill={c}>
      <path d="M24 44 H38 L66 28 V72 L38 56 H24 Z" />
      <path d="M72 38 Q80 50 72 62 M78 32 Q90 50 78 68" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  wrench: (c) => (
    <g transform="rotate(45 50 50)" fill={c}>
      <rect x={45} y={36} width={10} height={44} rx={4} />
      <path d="M38 22 Q38 38 50 38 Q62 38 62 22 L56 22 V30 H44 V22 Z" />
      <circle cx={50} cy={78} r={7} />
    </g>
  ),
  food: (c) => (
    <g fill="none" stroke={c} strokeWidth="5" strokeLinecap="round">
      <path d="M36 22 V44 Q36 52 42 52 V80 M42 52 Q48 52 48 44 V22 M42 22 V42" />
      <path d="M62 80 V22 Q72 30 72 48 H62" fill={c} />
    </g>
  ),
  phone: (c) => <path d="M30 30 Q34 22 42 28 L48 36 Q50 42 44 46 Q48 58 56 64 Q60 58 66 62 L74 70 Q78 78 70 80 Q50 82 36 64 Q24 48 30 30 Z" fill={c} />,
  cow: (c) => (
    <g fill={c}>
      <rect x={28} y={40} width={44} height={22} rx={6} />
      <path d="M72 44 L82 38 L84 50 L74 54 Z" />
      <rect x={30} y={60} width={6} height={18} /><rect x={42} y={60} width={6} height={18} /><rect x={56} y={60} width={6} height={18} /><rect x={66} y={60} width={6} height={18} />
      <path d="M28 44 L20 58" stroke={c} strokeWidth="3" />
    </g>
  ),
  rocks: (c) => (
    <g fill={c}>
      <path d="M30 22 V80 H36 V30 Z" />
      <circle cx={54} cy={36} r={6} /><circle cx={64} cy={52} r={5} /><circle cx={52} cy={62} r={7} /><circle cx={68} cy={74} r={6} /><circle cx={50} cy={78} r={4} />
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

export function RoadSign({ sign, size = 96, title, bg, drawn }: { sign: Sign; size?: number; title?: string; bg?: string; drawn?: boolean }) {
  const label = title ?? `${sign.code} ${sign.name}`;
  // Admin tasdiqlagan haqiqiy rasm bo'lsa, chizma o'rniga o'sha ko'rsatiladi
  const photo = useStore((s) => (drawn ? undefined : s.signImages?.[sign.id]));
  if (photo) {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} className="road-sign">
        <title>{label}</title>
         <image href={mediaUrl(photo)} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" />
      </svg>
    );
  }
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
        {sign.slash && <path d="M22 78 L78 22" stroke="#dc2626" strokeWidth="7" />}
      </>);
      break;
    case 'square':
      body = (<>
        <rect x="6" y="6" width="88" height="88" rx="8" fill="#2563eb" />
        <rect x="16" y="16" width="68" height="68" rx="4" fill={sign.group === 6 ? '#fff' : '#2563eb'} />
        <Symbol symbol={sign.symbol} color={sign.group === 6 ? '#111827' : '#fff'} size={40} />
        {sign.slash && <path d="M18 82 L82 18" stroke="#dc2626" strokeWidth="7" />}
      </>);
      break;
    case 'endzone':
      body = (<>
        <circle cx="50" cy="50" r="45" fill="#fff" stroke="#111827" strokeWidth="2" />
        <g opacity=".45"><Symbol symbol={sign.symbol} color="#111827" size={34} /></g>
        <g stroke="#111827" strokeWidth="2.5">{[-12, -6, 0, 6, 12].map((d) => <path key={d} d={`M${22 + d} ${78 + d} L${78 + d} ${22 + d}`} />)}</g>
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
