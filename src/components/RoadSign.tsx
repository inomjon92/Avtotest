import type { RoadSign as Sign } from '../data/types';

const ARROWS: Record<string, string> = {
  'arrow-up': 'M50 18 L68 40 H57 V82 H43 V40 H32 Z',
  'arrow-right': 'M82 50 L60 32 V43 H22 V57 H60 V68 Z',
  'arrow-left': 'M18 50 L40 32 V43 H78 V57 H40 V68 Z',
  'arrow-uturn': 'M64 82 V42 A14 14 0 0 0 36 42 V56 H26 L42 74 L58 56 H48 V42 A2 2 0 0 1 52 42 V82 Z',
};

function Symbol({ symbol, color = '#111827', size = 40 }: { symbol?: string; color?: string; size?: number }) {
  if (!symbol) return null;
  if (ARROWS[symbol]) return <path d={ARROWS[symbol]} fill={color} />;
  return (
    <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontSize={symbol.length > 2 ? size * 0.6 : size}
      fontWeight={700} fontFamily="Arial, Helvetica, sans-serif" fill={color}>{symbol}</text>
  );
}

export function RoadSign({ sign, size = 96, title }: { sign: Sign; size?: number; title?: string }) {
  const label = title ?? `${sign.code} ${sign.name}`;
  let body: React.ReactNode;
  switch (sign.shape) {
    case 'warning':
      body = (<>
        <path d="M50 6 L95 88 H5 Z" fill="#fff" stroke="#dc2626" strokeWidth="8" strokeLinejoin="round" />
        <g transform="translate(0 12) scale(1)"><Symbol symbol={sign.symbol} size={30} /></g>
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
        <circle cx="50" cy="50" r="42" fill="#fff" stroke="#dc2626" strokeWidth="9" />
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
