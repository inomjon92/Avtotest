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
function CarRear({ arm }: { arm: 'right' | 'stop' }) {
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
      {arm === 'right'
        ? <path d="M86 112 L44 112 L44 60" stroke={SKIN} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        : <path d="M86 112 L60 104 L56 28" stroke={SKIN} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      {arm === 'right'
        ? <circle cx={44} cy={56} r={8} fill={SKIN} stroke={K} />
        : <circle cx={56} cy={24} r={8} fill={SKIN} stroke={K} />}
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
