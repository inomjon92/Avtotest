// Yo'l sahnasi bilan ko'rsatib bo'lmaydigan savollar uchun chizmalar: svetofor, haydovchi ishoralari,
// birinchi yordam, avtomobil jihozlari va boshqalar. Rasm vaziyatni ko'rsatadi, javobni emas.
import type { ReactNode } from 'react';

const K = '#0f172a';
const SKIN = '#f5c99b';
const BG = '#e8eef6';

function Frame({ children, label, size }: { children: ReactNode; label: string; size: number }) {
  return (
    <svg viewBox="0 0 300 220" width={size} height={(size * 220) / 300} role="img" aria-label={label} className="scene art">
      <rect width="300" height="220" rx="12" fill={BG} />
      {children}
    </svg>
  );
}

// ---- svetofor ----
function Light({ x, y, on, flash, scale = 1 }: { x: number; y: number; on: ('r' | 'y' | 'g')[]; flash?: 'g' | 'y'; scale?: number }) {
  const col = { r: '#ef4444', y: '#facc15', g: '#22c55e' };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-6} y={150} width={12} height={60} fill="#475569" />
      <rect x={-30} y={0} width={60} height={156} rx={12} fill="#111827" />
      {(['r', 'y', 'g'] as const).map((c, i) => (
        <g key={c}>
          <circle cx={0} cy={28 + i * 50} r={20} fill={on.includes(c) ? col[c] : '#334155'} />
          {on.includes(c) && <circle cx={0} cy={28 + i * 50} r={27} fill={col[c]} opacity=".25" />}
          {flash === c && <animate xlinkHref={`#fl-${c}`} />}
          {flash === c && (
            <circle cx={0} cy={28 + i * 50} r={20} fill="#334155">
              <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.45;.5;.95;1" dur="1s" repeatCount="indefinite" />
            </circle>
          )}
        </g>
      ))}
    </g>
  );
}

function Rays({ x, y, color }: { x: number; y: number; color: string }) {
  return <g stroke={color} strokeWidth="4" strokeLinecap="round">{[-50, -25, 0, 25, 50].map((a) => <line key={a} x1={x} y1={y} x2={x + 16} y2={y} transform={`rotate(${a} ${x - 30} ${y})`} />)}</g>;
}

// ---- odamlar ----
/** Yotgan odam (yon tomondan): boshi chapda */
function Lying({ x, y, color = '#2563eb', legsUp = false, onSide = false, pale = false }: { x: number; y: number; color?: string; legsUp?: boolean; onSide?: boolean; pale?: boolean }) {
  const skin = pale ? '#e5e7eb' : SKIN;
  if (onSide) {
    return (
      <g transform={`translate(${x} ${y}) scale(1.35)`}>
        <circle cx={0} cy={-14} r={13} fill={skin} stroke={K} strokeWidth="1.5" />
        <rect x={12} y={-30} width={72} height={30} rx={14} fill={color} stroke={K} strokeWidth="1.5" />
        <path d="M84 -10 L120 -4 L150 -6" stroke="#1e293b" strokeWidth="13" strokeLinecap="round" fill="none" />
        <path d="M84 -20 L106 -30 L118 -6" stroke="#1e293b" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M22 -10 L8 4" stroke={color} strokeWidth="10" strokeLinecap="round" />
        <path d="M40 -30 L52 -46 L34 -48" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(1.35)`}>
      <circle cx={0} cy={-13} r={13} fill={skin} stroke={K} strokeWidth="1.5" />
      <rect x={12} y={-26} width={74} height={26} rx={12} fill={color} stroke={K} strokeWidth="1.5" />
      <path d="M26 -6 L60 -2" stroke={color} strokeWidth="9" strokeLinecap="round" />
      {legsUp
        ? <path d="M84 -14 L124 -44 L150 -44" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        : <path d="M84 -12 L150 -10" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" fill="none" />}
    </g>
  );
}

function Floor({ y = 182 }: { y?: number }) {
  return <rect x={0} y={y} width={300} height={220 - y} fill="#cbd5e1" />;
}

function Blood({ x, y, spurt }: { x: number; y: number; spurt?: boolean }) {
  return spurt ? (
    <g fill="#dc2626">
      <path d={`M${x} ${y} q 10 -26 26 -30 q -8 14 -20 32 z`}><animate attributeName="opacity" values="1;.35;1" dur=".8s" repeatCount="indefinite" /></path>
      <circle cx={x + 30} cy={y - 34} r={4} /><circle cx={x + 40} cy={y - 24} r={3} /><circle cx={x + 18} cy={y + 8} r={6} />
    </g>
  ) : (
    <g fill="#7f1d1d"><path d={`M${x - 4} ${y} q 4 12 0 24 q 10 -2 8 -24 z`} /><ellipse cx={x + 2} cy={y + 28} rx={14} ry={4} /></g>
  );
}

function Arm({ x, y, w = 170 }: { x: number; y: number; w?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={36} rx={18} fill={SKIN} stroke={K} strokeWidth="1.5" />
      <rect x={x + w - 14} y={y - 4} width={44} height={44} rx={20} fill={SKIN} stroke={K} strokeWidth="1.5" />
      <path d={`M${x + w + 4} ${y - 2} q 6 -16 18 -12 q 4 6 -6 16`} fill={SKIN} stroke={K} strokeWidth="1.5" />
      <path d={`M${x + w + 26} ${y + 8} h6 M${x + w + 27} ${y + 18} h6 M${x + w + 26} ${y + 28} h6`} stroke={K} strokeWidth="1.2" />
      <rect x={x - 30} y={y - 6} width={40} height={48} rx={14} fill="#2563eb" stroke={K} strokeWidth="1.5" />
    </g>
  );
}

// ---- avtomobil (orqadan) ----
function CarRear({ arm }: { arm: 'right' | 'stop' | 'left' }) {
  return (
    <g>
      <rect x={0} y={170} width={300} height={50} fill="#4b5563" />
      <path d="M70 170 L84 98 Q90 80 110 80 H190 Q210 80 216 98 L230 170 Z" fill="#dc2626" stroke={K} strokeWidth="2" />
      <path d="M96 100 Q100 90 112 90 H188 Q200 90 204 100 L210 128 H90 Z" fill="#bfdbfe" stroke={K} strokeWidth="1.5" />
      {/* haydovchi (chapda) */}
      <circle cx={122} cy={110} r={12} fill="#1e293b" />
      <rect x={60} y={140} width={180} height={34} rx={6} fill="#b91c1c" stroke={K} strokeWidth="2" />
      <rect x={70} y={146} width={26} height={12} rx={3} fill="#fca5a5" /><rect x={204} y={146} width={26} height={12} rx={3} fill="#fca5a5" />
      <rect x={128} y={150} width={44} height={14} fill="#f8fafc" stroke={K} />
      <rect x={70} y={174} width={22} height={18} rx={3} fill="#111827" /><rect x={208} y={174} width={22} height={18} rx={3} fill="#111827" />
      {/* qo'l chap oynadan */}
      {arm === 'right' && <><path d="M86 112 L44 112 L44 60" stroke={SKIN} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx={44} cy={56} r={8} fill={SKIN} stroke={K} /></>}
      {arm === 'stop' && <><path d="M86 112 L60 104 L56 28" stroke={SKIN} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" /><circle cx={56} cy={24} r={8} fill={SKIN} stroke={K} /></>}
      {arm === 'left' && <><path d="M86 112 L14 112" stroke={SKIN} strokeWidth="12" strokeLinecap="round" fill="none" /><circle cx={12} cy={112} r={8} fill={SKIN} stroke={K} /></>}
    </g>
  );
}

function Question({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={16} fill="#fde047" stroke={K} strokeWidth="2" />
      <text x={x} y={y + 7} textAnchor="middle" fontSize="20" fontWeight={900} fill={K}>?</text>
    </g>
  );
}

function Steering({ x, y, r = 46 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#1e293b" strokeWidth="11" />
      <circle cx={x} cy={y} r={12} fill="#1e293b" />
      <path d={`M${x - r} ${y} H${x + r} M${x} ${y} V${y + r}`} stroke="#1e293b" strokeWidth="9" />
    </g>
  );
}

function Dashboard() {
  return (
    <g>
      <path d="M0 120 Q150 90 300 120 V220 H0 Z" fill="#1f2937" />
      <rect x={0} y={0} width={300} height={110} fill="#93c5fd" />
      <rect x={0} y={84} width={300} height={30} fill="#86a95b" />
      <path d="M120 114 L140 84 H160 L180 114 Z" fill="#6b7280" />
    </g>
  );
}

const ARTS: Record<string, { label: string; draw: () => ReactNode }> = {
  'light-green-flash': {
    label: 'Yashil signal miltillamoqda',
    draw: () => (<>
      <Light x={150} y={20} on={['g']} flash="g" scale={0.95} />
      <Rays x={215} y={148} color="#22c55e" />
      <g transform="translate(-130 0)"><Rays x={215} y={148} color="#22c55e" /></g>
    </>),
  },
  'light-yellow': {
    label: 'Sariq signal yondi',
    draw: () => (<>
      <Light x={110} y={20} on={['y']} scale={0.95} />
      <rect x={170} y={150} width={130} height={70} fill="#4b5563" />
      <rect x={170} y={150} width={8} height={70} fill="#f8fafc" />
      <g transform="translate(236 182) rotate(-90)">
        <rect x={-14} y={-26} width={28} height={52} rx={8} fill="#dc2626" stroke={K} strokeWidth="1.5" />
        <rect x={-10} y={-16} width={20} height={10} rx={2} fill="#bfdbfe" />
      </g>
      <text x={236} y={140} textAnchor="middle" fontSize="14" fontWeight={800} fill={K}>Siz</text>
    </>),
  },
  'light-arrow-off': {
    label: "Asosiy yashil signal, qo'shimcha seksiya o'chiq",
    draw: () => (<>
      <Light x={130} y={14} on={['g']} scale={0.95} />
      <g transform="translate(160 118)">
        <rect x={0} y={0} width={58} height={58} rx={10} fill="#111827" />
        <circle cx={29} cy={29} r={20} fill="#334155" />
        <path d="M16 29 H40 M32 20 L41 29 L32 38" stroke="#475569" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Question x={250} y={146} />
    </>),
  },
  reversible: {
    label: 'Reversiv svetofor',
    draw: () => (<>
      <path d="M30 220 L120 70 H180 L270 220 Z" fill="#4b5563" />
      <path d="M150 80 V100 M150 120 V145 M150 168 V200" stroke="#f8fafc" strokeWidth="4" />
      <path d="M90 220 L135 70 M210 220 L165 70" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10 8" />
      <rect x={20} y={22} width={260} height={10} fill="#64748b" />
      {[[70, 'x'], [150, 'down'], [230, 'down']].map(([x, t]) => (
        <g key={x as number} transform={`translate(${(x as number) - 26} 34)`}>
          <rect width={52} height={52} rx={6} fill="#111827" />
          {t === 'x'
            ? <path d="M14 14 L38 38 M38 14 L14 38" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" />
            : <path d="M26 10 V40 M14 28 L26 41 L38 28" stroke="#22c55e" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
      ))}
      <g transform="translate(90 178)">
        <rect x={-15} y={-26} width={30} height={52} rx={8} fill="#dc2626" stroke={K} strokeWidth="1.5" />
        <rect x={-11} y={-17} width={22} height={10} rx={2} fill="#bfdbfe" />
      </g>
      <text x={90} y={150} textAnchor="middle" fontSize="13" fontWeight={800} fill="#f8fafc">Siz</text>
    </>),
  },
  'light-red': { label: 'Svetoforda qizil signal', draw: () => (<><Light x={150} y={20} on={['r']} scale={0.95} /><Rays x={215} y={48} color="#ef4444" /></>) },
  'light-green': { label: 'Svetoforda yashil signal', draw: () => (<><Light x={150} y={20} on={['g']} scale={0.95} /><Rays x={215} y={148} color="#22c55e" /></>) },
  'light-ped': {
    label: 'Piyodalar svetofori',
    draw: () => (<>
      <rect x={144} y={170} width={12} height={50} fill="#475569" />
      <rect x={110} y={14} width={80} height={160} rx={10} fill="#111827" />
      <g transform="translate(150 54)" opacity=".35"><circle cx={0} cy={-18} r={7} fill="#ef4444" /><rect x={-7} y={-10} width={14} height={30} rx={4} fill="#ef4444" /></g>
      <g transform="translate(150 132)" stroke="#22c55e" strokeWidth="7" strokeLinecap="round" fill="none">
        <circle cx={2} cy={-26} r={7} fill="#22c55e" stroke="none" /><path d="M1 -17 L-3 4 M-3 4 L-12 22 M-3 4 L9 21 M0 -12 L-12 -2 M0 -12 L12 -4" />
      </g>
    </>),
  },
  'light-tram': {
    label: "Oq-oy rangli signallar T shaklida joylashgan svetofor",
    draw: () => (<>
      <rect x={144} y={170} width={12} height={50} fill="#475569" />
      <rect x={70} y={20} width={160} height={60} rx={12} fill="#111827" />
      <rect x={120} y={80} width={60} height={60} rx={10} fill="#111827" />
      {[100, 150, 200].map((x) => <circle key={x} cx={x} cy={50} r={18} fill={x === 150 ? '#f8fafc' : '#334155'} />)}
      <circle cx={150} cy={112} r={18} fill="#f8fafc" />
      <circle cx={150} cy={50} r={26} fill="#f8fafc" opacity=".2" /><circle cx={150} cy={112} r={26} fill="#f8fafc" opacity=".2" />
    </>),
  },
  'hand-left': { label: "Haydovchi chap qo'lini yon tomonga cho'zdi", draw: () => <CarRear arm="left" /> },
  tire: {
    label: "Shina protektori",
    draw: () => (<>
      <circle cx={110} cy={110} r={92} fill="#1f2937" />
      <circle cx={110} cy={110} r={46} fill="#94a3b8" stroke="#475569" strokeWidth="6" />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={106} y={20} width={8} height={18} fill="#4b5563" transform={`rotate(${i * 22.5} 110 110)`} />)}
      <g transform="translate(212 60)">
        <rect width={70} height={100} rx={8} fill="#f8fafc" stroke={K} strokeWidth="2" />
        <path d="M10 30 H60 V44 H50 V36 H40 V44 H30 V36 H20 V44 H10 Z" fill="#334155" />
        <path d="M66 36 V44" stroke="#dc2626" strokeWidth="3" />
        <text x={35} y={76} textAnchor="middle" fontSize="16" fontWeight={800} fill="#dc2626">? mm</text>
      </g>
    </>),
  },
  mirror: {
    label: "Orqani ko'rish ko'zgusi",
    draw: () => (<>
      <Dashboard />
      <rect x={90} y={14} width={120} height={44} rx={14} fill="#334155" stroke={K} strokeWidth="3" />
      <rect x={98} y={20} width={104} height={32} rx={10} fill="#bfdbfe" />
      <g transform="translate(150 40)"><rect x={-14} y={-8} width={28} height={16} rx={4} fill="#2563eb" /><rect x={-10} y={-6} width={20} height={6} fill="#e0f2fe" /></g>
      <rect x={146} y={58} width={8} height={14} fill="#334155" />
      <Steering x={110} y={190} r={40} />
      <Question x={250} y={150} />
    </>),
  },
  'steering-play': {
    label: "Rul chambaragining lyufti (bo'sh aylanishi)",
    draw: () => (<>
      <Steering x={150} y={120} r={70} />
      <path d="M150 30 A90 90 0 0 1 182 36" stroke="#dc2626" strokeWidth="5" fill="none" />
      <path d="M150 30 A90 90 0 0 0 118 36" stroke="#dc2626" strokeWidth="5" fill="none" />
      <path d="M150 26 V50" stroke="#dc2626" strokeWidth="3" />
      <text x={150} y={20} textAnchor="middle" fontSize="16" fontWeight={900} fill="#dc2626">?°</text>
    </>),
  },
  headlight: {
    label: "Kechasi faralardan biri ishlamayapti",
    draw: () => (<>
      <rect width={300} height={220} rx={12} fill="#0f172a" />
      <path d="M40 200 L60 120 Q66 100 90 100 H210 Q234 100 240 120 L260 200 Z" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
      <path d="M80 104 L94 70 H206 L220 104 Z" fill="#1e3a8a" />
      <ellipse cx={86} cy={152} rx={22} ry={13} fill="#fef9c3" /><path d="M64 152 L0 120 V190 Z" fill="#fef9c3" opacity=".25" />
      <ellipse cx={214} cy={152} rx={22} ry={13} fill="#1f2937" stroke="#94a3b8" />
      <path d="M200 140 l28 24 M228 140 l-28 24" stroke="#dc2626" strokeWidth="4" />
      <rect x={120} y={164} width={60} height={20} fill="#f8fafc" />
    </>),
  },
  oil: {
    label: "Avtomobil ostidan moy oqmoqda",
    draw: () => (<>
      <rect x={0} y={170} width={300} height={50} fill="#9ca3af" />
      <path d="M30 160 V128 Q30 114 50 110 L90 80 H190 L230 110 Q262 114 262 138 V160 Z" fill="#16a34a" stroke={K} strokeWidth="2" />
      <path d="M98 88 H142 V110 H70 Z M150 88 H186 L214 110 H150 Z" fill="#bfdbfe" />
      <circle cx={70} cy={168} r={18} fill="#111827" /><circle cx={222} cy={168} r={18} fill="#111827" />
      <path d="M232 160 q4 10 0 18" stroke="#111827" strokeWidth="5" />
      <ellipse cx={236} cy={196} rx={40} ry={9} fill="#111827" opacity=".85" />
      <Question x={140} y={40} />
    </>),
  },
  exhaust: {
    label: "Yopiq garajda dvigatel ishlab turibdi",
    draw: () => (<>
      <path d="M10 210 V60 L150 14 L290 60 V210 Z" fill="#cbd5e1" stroke={K} strokeWidth="2" />
      <rect x={30} y={70} width={240} height={140} fill="#94a3b8" />
      <path d="M60 180 V150 Q60 136 80 132 L110 108 H190 L220 132 Q240 136 240 156 V180 Z" fill="#dc2626" stroke={K} strokeWidth="2" />
      <circle cx={92} cy={186} r={14} fill="#111827" /><circle cx={210} cy={186} r={14} fill="#111827" />
      {[0, 1, 2].map((i) => <circle key={i} cx={40 + i * 6} cy={170 - i * 24} r={10 + i * 6} fill="#475569" opacity={0.5 - i * 0.1} />)}
      <text x={60} y={92} fontSize="26" fontWeight={900} fill="#334155">CO</text>
      <Question x={250} y={100} />
    </>),
  },
  'aid-choke': {
    label: "Odam bo'g'ilmoqda (nafas yo'liga ovqat tiqildi)",
    draw: () => (<>
      <Floor />
      <g transform="translate(150 0)">
        <circle cx={0} cy={50} r={22} fill={SKIN} stroke={K} strokeWidth="1.5" />
        <ellipse cx={0} cy={60} rx={6} ry={5} fill="#7f1d1d" />
        <rect x={-30} y={74} width={60} height={80} rx={18} fill="#16a34a" stroke={K} strokeWidth="1.5" />
        <path d="M-26 86 L-8 74 M26 86 L8 74" stroke={SKIN} strokeWidth="11" strokeLinecap="round" />
        <path d="M-14 154 V184 M14 154 V184" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
      </g>
      <text x={210} y={50} fontSize="26" fontWeight={900} fill="#dc2626">!</text>
    </>),
  },
  'aid-heat': {
    label: "Quyosh urishi",
    draw: () => (<>
      <rect width={300} height={220} rx={12} fill="#fef3c7" />
      <circle cx={240} cy={50} r={28} fill="#f59e0b" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d="M240 6 V14" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" transform={`rotate(${i * 45} 240 50)`} />)}
      <Floor y={186} />
      <Lying x={40} y={186} color="#ea580c" />
      <text x={70} y={120} fontSize="20" fill="#0ea5e9">💧</text>
    </>),
  },
  'aid-cold': {
    label: "Sovuq urishi (qo'l barmoqlari oqarib qolgan)",
    draw: () => (<>
      <rect width={300} height={220} rx={12} fill="#e0f2fe" />
      <g transform="translate(-20 30)"><Arm x={60} y={92} w={140} /></g>
      <g fill="#f8fafc" stroke="#94a3b8"><rect x={196} y={112} width={28} height={10} rx={5} /><rect x={196} y={124} width={30} height={10} rx={5} /><rect x={196} y={136} width={28} height={10} rx={5} /></g>
      <g stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" transform="translate(240 50)">
        {[0, 60, 120].map((a) => <path key={a} d="M0 -26 V26" transform={`rotate(${a})`} />)}
      </g>
    </>),
  },
  'aid-eye': {
    label: "Ko'z jarohati",
    draw: () => (<>
      <circle cx={150} cy={110} r={74} fill={SKIN} stroke={K} strokeWidth="2" />
      <ellipse cx={120} cy={96} rx={14} ry={9} fill="#fff" stroke={K} /><circle cx={120} cy={96} r={5} fill={K} />
      <ellipse cx={180} cy={96} rx={16} ry={11} fill="#fecaca" stroke="#dc2626" strokeWidth="2" />
      <path d="M170 90 l20 12 M174 104 l14 -16" stroke="#dc2626" strokeWidth="2" />
      <path d="M126 150 Q150 140 174 150" stroke={K} strokeWidth="3" fill="none" />
      <Question x={260} y={40} />
    </>),
  },
  'aid-head': {
    label: "Bosh jarohati",
    draw: () => (<>
      <Floor />
      <circle cx={150} cy={90} r={56} fill={SKIN} stroke={K} strokeWidth="2" />
      <path d="M110 60 Q150 30 190 60" stroke="#dc2626" strokeWidth="6" fill="none" />
      <path d="M124 70 q 4 12 0 22" stroke="#dc2626" strokeWidth="4" fill="none" />
      <circle cx={130} cy={96} r={5} fill={K} /><circle cx={170} cy={96} r={5} fill={K} />
      <path d="M134 122 Q150 116 166 122" stroke={K} strokeWidth="3" fill="none" />
      <rect x={110} y={146} width={80} height={36} rx={10} fill="#2563eb" />
    </>),
  },
  'aid-chest': {
    label: "Ko'krak qafasidagi ochiq jarohat",
    draw: () => (<>
      <Floor />
      <rect x={80} y={40} width={140} height={142} rx={30} fill={SKIN} stroke={K} strokeWidth="2" />
      <path d="M150 50 V170" stroke="#e8b48a" strokeWidth="2" />
      <ellipse cx={120} cy={100} rx={10} ry={7} fill="#dc2626" />
      <circle cx={112} cy={86} r={4} fill="#93c5fd" opacity=".9" /><circle cx={128} cy={84} r={3} fill="#93c5fd" opacity=".9" />
      <Question x={250} y={60} />
    </>),
  },
  'aid-call': {
    label: "Tez yordamni chaqirish",
    draw: () => (<>
      <g transform="translate(110 20)">
        <rect width={80} height={160} rx={12} fill="#111827" />
        <rect x={6} y={14} width={68} height={120} rx={4} fill="#e0f2fe" />
        <text x={40} y={60} textAnchor="middle" fontSize="26" fontWeight={900} fill="#dc2626">?</text>
        <rect x={20} y={90} width={40} height={24} rx={12} fill="#16a34a" />
      </g>
      <path d="M230 60 q14 20 0 40 M246 50 q24 30 0 60" stroke="#16a34a" strokeWidth="5" fill="none" strokeLinecap="round" />
    </>),
  },
  'aid-car-victim': {
    label: "YTH dan keyin jabrlanuvchi avtomobil ichida",
    draw: () => (<>
      <rect x={0} y={170} width={300} height={50} fill="#4b5563" />
      <path d="M30 170 V130 Q30 116 50 112 L90 80 H190 L230 112 Q262 116 262 140 V170 Z" fill="#2563eb" stroke={K} strokeWidth="2" />
      <path d="M200 112 L230 112 Q262 116 262 140 L250 150 L232 128 Z" fill="#1e3a8a" />
      <path d="M98 88 H142 V112 H70 Z M150 88 H186 L214 112 H150 Z" fill="#bfdbfe" />
      <circle cx={120} cy={104} r={9} fill={SKIN} stroke={K} /><path d="M112 96 q8 -6 16 0" stroke="#dc2626" strokeWidth="3" fill="none" />
      <circle cx={70} cy={180} r={16} fill="#111827" /><circle cx={222} cy={180} r={16} fill="#111827" />
      <Question x={160} y={40} />
    </>),
  },
  'aid-gloves': {
    label: "Birinchi yordam ko'rsatishdan oldin",
    draw: () => (<>
      <g transform="translate(40 40)"><rect width={100} height={80} rx={10} fill="#f8fafc" stroke={K} strokeWidth="2" /><rect x={42} y={16} width={16} height={48} fill="#dc2626" /><rect x={26} y={32} width={48} height={16} fill="#dc2626" /></g>
      <g transform="translate(180 40)" fill="#93c5fd" stroke="#1e40af" strokeWidth="2">
        <path d="M10 140 V60 Q10 50 18 50 V20 Q18 12 26 12 Q34 12 34 20 V50 V12 Q34 4 42 4 Q50 4 50 12 V50 V16 Q50 8 58 8 Q66 8 66 16 V54 V30 Q66 22 74 22 Q82 22 82 30 V100 Q82 140 50 140 Z" />
      </g>
      <Lying x={30} y={196} />
    </>),
  },
  license: {
    label: "Haydovchilik guvohnomasi",
    draw: () => (<>
      <g transform="translate(40 40)">
        <rect width={220} height={140} rx={14} fill="#fce7f3" stroke={K} strokeWidth="2" />
        <rect x={14} y={30} width={60} height={76} rx={6} fill="#cbd5e1" />
        <circle cx={44} cy={58} r={14} fill="#94a3b8" /><rect x={26} y={76} width={36} height={24} rx={10} fill="#94a3b8" />
        <text x={110} y={21} textAnchor="middle" fontSize="11" fontWeight={800} fill="#9d174d">HAYDOVCHILIK GUVOHNOMASI</text>
        {[40, 58, 76].map((y) => <rect key={y} x={88} y={y} width={110} height={8} rx={4} fill="#f9a8d4" />)}
        <rect x={150} y={96} width={52} height={32} rx={6} fill="#2563eb" />
        <text x={176} y={120} textAnchor="middle" fontSize="22" fontWeight={900} fill="#fff">B</text>
      </g>
    </>),
  },
  insurance: {
    label: "Majburiy sug'urta polisi",
    draw: () => (<>
      <g transform="translate(60 20)">
        <rect width={180} height={180} rx={8} fill="#f8fafc" stroke={K} strokeWidth="2" />
        <text x={90} y={30} textAnchor="middle" fontSize="15" fontWeight={900} fill="#1e3a8a">SUG'URTA POLISI</text>
        {[50, 68, 86, 104, 122].map((y) => <rect key={y} x={20} y={y} width={140} height={7} rx={3} fill="#cbd5e1" />)}
        <circle cx={130} cy={152} r={18} fill="none" stroke="#1d4ed8" strokeWidth="3" />
      </g>
    </>),
  },
  'hand-right': { label: "Haydovchi chap qo'lini tirsakdan yuqoriga bukib ko'tardi", draw: () => <CarRear arm="right" /> },
  'hand-stop': { label: "Haydovchi qo'lini yuqoriga ko'tardi", draw: () => <CarRear arm="stop" /> },
  hill: {
    label: "Tepalik oldida quvib o'tish",
    draw: () => (<>
      <rect width={300} height={220} rx={12} fill="#bfdbfe" />
      <path d="M0 200 Q150 40 300 200 V220 H0 Z" fill="#86a95b" />
      <path d="M0 200 Q150 52 300 200" stroke="#4b5563" strokeWidth="12" fill="none" />
      <g transform="translate(70 142) rotate(-38)">
        <rect x={-22} y={-14} width={44} height={14} rx={4} fill="#dc2626" stroke={K} />
        <circle cx={-12} cy={2} r={5} fill={K} /><circle cx={12} cy={2} r={5} fill={K} />
      </g>
      <text x={52} y={112} fontSize="13" fontWeight={800} fill={K}>Siz</text>
      <g transform="translate(118 100) rotate(-22)">
        <rect x={-26} y={-22} width={40} height={22} fill="#e5e7eb" stroke={K} /><rect x={14} y={-16} width={14} height={16} rx={3} fill="#2563eb" stroke={K} />
        <circle cx={-16} cy={2} r={5} fill={K} /><circle cx={18} cy={2} r={5} fill={K} />
      </g>
      <g transform="translate(206 104) rotate(28)" opacity=".55">
        <rect x={-22} y={-14} width={44} height={14} rx={4} fill="none" stroke={K} strokeWidth="2" strokeDasharray="4 3" />
      </g>
      <Question x={210} y={60} />
    </>),
  },
  // ---- birinchi yordam ----
  'aid-arterial': { label: 'Qo\'ldan och-qizil qon otilib chiqmoqda', draw: () => (<><Arm x={60} y={92} /><Blood x={150} y={96} spurt /></>) },
  'aid-venous': { label: 'Qo\'ldan to\'q qizil qon bir tekis oqmoqda', draw: () => (<><Arm x={60} y={92} /><Blood x={150} y={128} /></>) },
  'aid-unconscious': {
    label: 'Hushsiz, nafas olayotgan jabrlanuvchi',
    draw: () => (<><Floor /><Lying x={70} y={182} /><g stroke="#64748b" strokeWidth="3" fill="none" strokeLinecap="round"><path d="M40 150 q -10 -8 0 -16" /><path d="M30 148 q -12 -10 0 -22" /></g><Question x={250} y={50} /></>),
  },
  'aid-burn': {
    label: 'Kuygan qo\'l',
    draw: () => (<><Arm x={60} y={92} /><ellipse cx={170} cy={110} rx={36} ry={14} fill="#f87171" opacity=".8" /><circle cx={160} cy={106} r={6} fill="#fef3c7" stroke="#f59e0b" /><circle cx={178} cy={112} r={5} fill="#fef3c7" stroke="#f59e0b" /><path d="M150 70 q 6 -12 0 -24 M170 66 q 6 -12 0 -24 M190 70 q 6 -12 0 -24" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" /></>),
  },
  'aid-fracture': {
    label: 'Oyoq suyagi singan',
    draw: () => (<>
      <Floor />
      <Lying x={40} y={182} />
      <path d="M192 168 l8 -10 l6 12 l8 -12" stroke="#dc2626" strokeWidth="4" fill="none" strokeLinejoin="round" />
      <circle cx={204} cy={166} r={22} fill="none" stroke="#dc2626" strokeWidth="3" strokeDasharray="5 4" />
    </>),
  },
  'aid-cpr': {
    label: 'Yurak-o\'pka reanimatsiyasi',
    draw: () => (<>
      <Floor />
      <Lying x={40} y={182} />
      <circle cx={112} cy={62} r={14} fill={SKIN} stroke={K} strokeWidth="1.5" />
      <path d="M114 76 L118 120 L150 128 L160 180" stroke="#16a34a" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M114 86 L96 140" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />
      <path d="M96 104 V122 M90 116 L96 124 L102 116" stroke="#dc2626" strokeWidth="3" fill="none" />
    </>),
  },
  'aid-nose': {
    label: 'Burundan qon ketmoqda',
    draw: () => (<>
      <path d="M120 200 V160 Q120 140 150 140 Q180 140 180 160 V200 Z" fill="#2563eb" />
      <circle cx={150} cy={96} r={40} fill={SKIN} stroke={K} strokeWidth="1.5" />
      <path d="M186 92 L198 110 L184 112" fill={SKIN} stroke={K} strokeWidth="1.5" />
      <path d="M188 114 q 4 10 0 18 q 8 -4 4 -18 z" fill="#dc2626" />
      <circle cx={190} cy={142} r={3} fill="#dc2626" />
      <circle cx={168} cy={84} r={4} fill={K} />
    </>),
  },
  'aid-spine': {
    label: 'Umurtqa pog\'onasi shikastlangan bo\'lishi mumkin',
    draw: () => (<>
      <Floor />
      <Lying x={60} y={182} />
      <path d="M82 160 H176" stroke="#dc2626" strokeWidth="5" strokeDasharray="6 4" />
      <g transform="translate(200 40)"><rect x={0} y={20} width={80} height={30} rx={8} fill="#64748b" /><path d="M10 20 L24 4 H60 L72 20" fill="#94a3b8" /><path d="M30 0 L22 -10 M44 -2 V-14 M58 0 L66 -10" stroke="#f97316" strokeWidth="3" /></g>
    </>),
  },
  'aid-faint': { label: 'Odam hushidan ketdi', draw: () => (<><Floor /><Lying x={70} y={182} pale /><text x={40} y={130} fontSize="22" fontWeight={800} fill="#64748b">z z</text><Question x={250} y={50} /></>) },
  'aid-shock': {
    label: 'Shok holati: rangi oqargan, terlagan',
    draw: () => (<>
      <Floor />
      <Lying x={70} y={182} pale />
      <g fill="#7dd3fc"><path d="M60 140 q 4 8 0 12 q -4 -4 0 -12z" /><path d="M78 136 q 4 8 0 12 q -4 -4 0 -12z" /></g>
      <g transform="translate(230 50)"><path d="M0 20 h12 l6 -14 l8 28 l6 -14 h14" stroke="#dc2626" strokeWidth="4" fill="none" strokeLinejoin="round" /></g>
      <Question x={250} y={120} />
    </>),
  },
  // ---- avtomobil va haydovchi ----
  phone: {
    label: "Harakatlanish vaqtida telefonni qo'lda ushlab gaplashish",
    draw: () => (<>
      <Dashboard />
      <Steering x={110} y={176} />
      <g transform="translate(206 104)"><rect x={0} y={0} width={34} height={60} rx={6} fill="#111827" /><rect x={4} y={6} width={26} height={44} rx={2} fill="#38bdf8" /></g>
      <path d="M240 220 L232 160" stroke={SKIN} strokeWidth="20" strokeLinecap="round" />
      <g stroke="#f97316" strokeWidth="3" fill="none"><path d="M250 96 q 10 -8 0 -20" /><path d="M260 100 q 16 -14 0 -32" /></g>
    </>),
  },
  belts: {
    label: 'Avtomobildagi haydovchi va yo\'lovchilar',
    draw: () => (<>
      <rect x={70} y={10} width={160} height={200} rx={40} fill="#dc2626" stroke={K} strokeWidth="2" />
      <rect x={84} y={30} width={132} height={160} rx={20} fill="#fde68a" />
      {[[115, 80], [185, 80], [105, 150], [150, 150], [195, 150]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 18} y={y - 20} width={36} height={40} rx={8} fill="#475569" />
          <circle cx={x} cy={y - 6} r={10} fill={SKIN} stroke={K} />
          {i < 2 && <path d={`M${x - 14} ${y - 16} L${x + 14} ${y + 16}`} stroke="#111827" strokeWidth="4" />}
        </g>
      ))}
      <Question x={258} y={110} />
    </>),
  },
  docs: {
    label: 'Haydovchi hujjatlari',
    draw: () => (<>
      {[['#f472b6', 'GUVOHNOMA', 22, 36], ['#a3e635', 'TEXPASPORT', 112, 36], ['#60a5fa', "SUG'URTA", 202, 36], ['#78350f', 'PASPORT', 112, 126]].map(([c, t, x, y]) => (
        <g key={t as string} transform={`translate(${x} ${y})`}>
          <rect width={78} height={56} rx={6} fill={c as string} stroke={K} strokeWidth="1.5" />
          <rect x={6} y={10} width={18} height={22} fill="#fff" opacity=".8" />
          <path d="M30 14 H70 M30 22 H64 M30 30 H70" stroke="#fff" strokeWidth="3" opacity=".8" />
          <text x={39} y={48} fontSize="8.5" fontWeight={800} textAnchor="middle" fill="#fff">{t}</text>
        </g>
      ))}
    </>),
  },
  brake: {
    label: 'Ishchi tormoz tizimi nosoz',
    draw: () => (<>
      <rect x={20} y={20} width={260} height={100} rx={50} fill="#111827" />
      <circle cx={150} cy={70} r={30} fill="none" stroke="#ef4444" strokeWidth="6" />
      <path d="M116 46 q -10 24 0 48 M184 46 q 10 24 0 48" stroke="#ef4444" strokeWidth="6" fill="none" />
      <text x={150} y={82} textAnchor="middle" fontSize="34" fontWeight={900} fill="#ef4444">!</text>
      <g transform="translate(120 140)"><rect x={0} y={0} width={60} height={20} rx={6} fill="#475569" /><rect x={24} y={20} width={12} height={40} fill="#64748b" /></g>
    </>),
  },
  wiper: {
    label: 'Yomg\'irda haydovchi tomonidagi oyna tozalagich ishlamayapti',
    draw: () => (<>
      <path d="M20 190 L50 30 H250 L280 190 Z" fill="#93c5fd" stroke={K} strokeWidth="3" />
      {Array.from({ length: 34 }, (_, i) => <circle key={i} cx={40 + ((i * 53) % 220)} cy={40 + ((i * 37) % 140)} r={3 + (i % 3)} fill="#e0f2fe" opacity=".9" />)}
      <path d="M150 188 L250 110" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <path d="M70 188 L60 120" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
      <path d="M48 112 l10 -10 l6 8 l10 -12" stroke="#dc2626" strokeWidth="4" fill="none" />
      <Steering x={80} y={214} r={34} />
    </>),
  },
  kit: {
    label: 'Avtomobil jihozlari',
    draw: () => (<>
      <g transform="translate(24 60)"><rect width={70} height={56} rx={8} fill="#f8fafc" stroke={K} strokeWidth="2" /><rect x={29} y={12} width={12} height={32} fill="#dc2626" /><rect x={19} y={22} width={32} height={12} fill="#dc2626" /></g>
      <g transform="translate(116 34)"><rect x={8} y={20} width={30} height={92} rx={12} fill="#dc2626" stroke={K} strokeWidth="2" /><rect x={14} y={6} width={18} height={16} fill="#111827" /><path d="M32 12 H50 V30" stroke="#111827" strokeWidth="5" fill="none" /></g>
      <g transform="translate(190 50)"><path d="M40 0 L80 70 H0 Z" fill="none" stroke="#dc2626" strokeWidth="10" strokeLinejoin="round" /></g>
      <g transform="translate(46 150)"><circle cx={24} cy={24} r={24} fill="#1f2937" /><circle cx={24} cy={24} r={10} fill="#94a3b8" /></g>
      <g transform="translate(200 156)"><rect width={56} height={34} rx={6} fill="#111827" /><circle cx={28} cy={17} r={10} fill="#334155" stroke="#94a3b8" strokeWidth="3" /></g>
    </>),
  },
  childseat: {
    label: 'Kichik yoshdagi bolani tashish',
    draw: () => (<>
      <path d="M20 200 V110 Q20 70 70 60 L130 30 H230 Q270 30 280 80 V200 Z" fill="#cbd5e1" stroke={K} strokeWidth="2" />
      <path d="M140 44 H226 Q256 44 262 84 H140 Z" fill="#bfdbfe" />
      <path d="M170 200 V110 Q170 92 188 92 H210 V200" fill="#475569" />
      <circle cx={232} cy={130} r={14} fill={SKIN} stroke={K} />
      <rect x={220} y={144} width={26} height={34} rx={8} fill="#f97316" />
      <Question x={110} y={130} />
    </>),
  },
  alcohol: {
    label: 'Spirtli ichimlik va avtomobil kaliti',
    draw: () => (<>
      <path d="M90 40 H150 L144 120 Q140 150 120 150 Q100 150 96 120 Z" fill="#fde68a" stroke={K} strokeWidth="2" />
      <path d="M93 70 H147" stroke="#f59e0b" strokeWidth="3" />
      <rect x={116} y={150} width={8} height={30} fill={K} /><rect x={96} y={180} width={48} height={8} rx={4} fill={K} />
      <g transform="translate(190 80)"><rect x={0} y={0} width={44} height={60} rx={14} fill="#111827" /><rect x={16} y={60} width={12} height={50} fill="#94a3b8" /><path d="M28 74 h8 M28 88 h6 M28 100 h8" stroke="#94a3b8" strokeWidth="5" /></g>
    </>),
  },
  pills: {
    label: 'Reaksiyani susaytiruvchi dori',
    draw: () => (<>
      <g transform="translate(40 50)"><rect width={120} height={80} rx={10} fill="#e2e8f0" stroke={K} strokeWidth="2" />{[0, 1, 2, 3, 4, 5].map((i) => <ellipse key={i} cx={24 + (i % 3) * 36} cy={24 + Math.floor(i / 3) * 32} rx={12} ry={9} fill="#f8fafc" stroke="#94a3b8" />)}</g>
      <g transform="translate(40 146)"><rect width={150} height={40} rx={6} fill="#fef9c3" stroke="#ca8a04" /><text x={75} y={17} textAnchor="middle" fontSize="11" fontWeight={800} fill="#a16207">DIQQAT!</text><text x={75} y={32} textAnchor="middle" fontSize="10" fill="#a16207">Reaksiyani susaytiradi</text></g>
      <g transform="translate(206 70)"><rect x={0} y={0} width={44} height={60} rx={14} fill="#111827" /><rect x={16} y={60} width={12} height={50} fill="#94a3b8" /></g>
    </>),
  },
  tired: {
    label: 'Haydovchi qattiq charchagan',
    draw: () => (<>
      <Dashboard />
      <Steering x={150} y={178} />
      <circle cx={150} cy={118} r={30} fill={SKIN} stroke={K} strokeWidth="1.5" />
      <path d="M136 114 q 6 4 12 0 M154 114 q 6 4 12 0" stroke={K} strokeWidth="2.5" fill="none" />
      <ellipse cx={151} cy={132} rx={7} ry={5} fill="#7f1d1d" />
      <text x={190} y={70} fontSize="22" fontWeight={900} fill="#1e3a8a">Z</text><text x={212} y={50} fontSize="28" fontWeight={900} fill="#1e3a8a">Z</text><text x={240} y={30} fontSize="34" fontWeight={900} fill="#1e3a8a">Z</text>
    </>),
  },
  passenger: {
    label: 'Haydovchi va yo\'lovchilar',
    draw: () => (<>
      <rect x={0} y={190} width={300} height={30} fill="#4b5563" />
      <path d="M30 170 V130 Q30 116 50 112 L90 80 H190 L230 112 Q262 116 262 140 V170 Z" fill="#2563eb" stroke={K} strokeWidth="2" />
      <path d="M98 88 H142 V112 H70 Z M150 88 H186 L214 112 H150 Z" fill="#bfdbfe" />
      <circle cx={120} cy={100} r={9} fill={SKIN} stroke={K} /><circle cx={176} cy={100} r={9} fill={SKIN} stroke={K} />
      <circle cx={70} cy={180} r={16} fill="#111827" /><circle cx={222} cy={180} r={16} fill="#111827" />
      <g transform="translate(272 128)"><circle cx={0} cy={-10} r={9} fill={SKIN} stroke={K} /><path d="M0 0 V36 M0 36 L-8 60 M0 36 L8 60 M0 10 L-14 24" stroke="#7c3aed" strokeWidth="7" strokeLinecap="round" /></g>
      <text x={120} y={74} textAnchor="middle" fontSize="12" fontWeight={800} fill={K}>A</text>
      <text x={176} y={74} textAnchor="middle" fontSize="12" fontWeight={800} fill={K}>B</text>
      <text x={272} y={104} textAnchor="middle" fontSize="12" fontWeight={800} fill={K}>C</text>
    </>),
  },
};

export const ART_KEYS = Object.keys(ARTS);

export function Art({ name, size = 260 }: { name: string; size?: number }) {
  const a = ARTS[name];
  if (!a) return null;
  return <Frame label={a.label} size={size}>{a.draw()}</Frame>;
}
