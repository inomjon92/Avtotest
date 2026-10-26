// To'g'ri yo'l bo'lagining yuqoridan ko'rinishi: chiziqlar, qatorlar, bekatlar, temir yo'l, kecha/tuman,
// transport vositalari va ularning harakat yo'nalishi. Biz (pastdan yuqoriga) yo'lning o'ng yarmida harakatlanamiz.
import type { Marking, RoadSpec, RoadVehicle } from '../data/types';
import { signById } from '../data/signs';
import { RoadSign } from './RoadSign';

const W = 300;
const LANE = 34;
const C = 150;

export function laneX(spec: RoadSpec, lane: number, dir: 'up' | 'down' = 'up') {
  if (spec.oneway) {
    const n = spec.lanes ?? 2;
    return C + (n * LANE) / 2 - LANE / 2 - lane * LANE;
  }
  const n = spec.lanes ?? 1;
  // 0 — eng o'ng chetdagi qator (harakat yo'nalishiga nisbatan)
  return dir === 'up' ? C + n * LANE - LANE / 2 - lane * LANE : C - n * LANE + LANE / 2 + lane * LANE;
}

function edges(spec: RoadSpec) {
  const n = spec.lanes ?? 1;
  const half = spec.oneway ? (n * LANE) / 2 : n * LANE;
  return [C - half, C + half] as const;
}

const VEH: Record<NonNullable<RoadVehicle['kind']>, [number, number]> = {
  car: [40, 21], police: [42, 21], ambulance: [46, 23], truck: [58, 25], bus: [62, 25], schoolbus: [62, 25], tram: [86, 27], moto: [24, 10],
};
const COLORS = ['#2563eb', '#16a34a', '#9333ea', '#0891b2', '#ea580c', '#475569'];

function Blinker({ x, y, on = true }: { x: number; y: number; on?: boolean }) {
  if (!on) return null;
  return (
    <circle cx={x} cy={y} r={3.6} fill="#fb923c" stroke="#fff7ed" strokeWidth="1">
      <animate attributeName="opacity" values="1;0.1;1" dur="0.9s" repeatCount="indefinite" />
    </circle>
  );
}

/** Kanonik holatda (old tomoni yuqoriga) transport vositasi */
export function VehicleTop({ v, cx, cy, idx = 0 }: { v: RoadVehicle; cx: number; cy: number; idx?: number }) {
  const kind = v.kind ?? 'car';
  const [len, w] = VEH[kind];
  const x = cx - w / 2, y = cy - len / 2;
  const base = v.you ? '#dc2626' : v.color ?? (kind === 'police' || kind === 'ambulance' ? '#f8fafc' : kind === 'schoolbus' ? '#facc15' : kind === 'tram' ? '#f59e0b' : kind === 'bus' ? '#0ea5e9' : COLORS[idx % COLORS.length]);
  if (kind === 'moto') {
    return (
      <g>
        <rect x={cx - 2} y={y} width={4} height={len} rx={2} fill="#111827" />
        <rect x={x} y={cy - 6} width={w} height={12} rx={4} fill={base} stroke="#0f172a" />
        <circle cx={cx} cy={cy + 1} r={4.5} fill="#f8fafc" stroke="#0f172a" />
      </g>
    );
  }
  const glass = '#bfdbfe';
  return (
    <g>
      {/* soya */}
      <rect x={x + 2} y={y + 3} width={w} height={len} rx={7} fill="rgba(0,0,0,.25)" />
      {kind === 'truck' ? (<>
        <rect x={x} y={y + 16} width={w} height={len - 16} rx={2} fill="#e5e7eb" stroke="#0f172a" strokeWidth="1.5" />
        <rect x={x + 1} y={y} width={w - 2} height={17} rx={5} fill={base} stroke="#0f172a" strokeWidth="1.5" />
        <rect x={x + 4} y={y + 3} width={w - 8} height={6} rx={2} fill={glass} />
      </>) : (
        <rect x={x} y={y} width={w} height={len} rx={kind === 'tram' || kind === 'bus' || kind === 'schoolbus' ? 5 : 8} fill={base} stroke="#0f172a" strokeWidth="1.5" />
      )}
      {(kind === 'car' || kind === 'police' || kind === 'ambulance') && (<>
        <path d={`M${x + 3} ${y + 9} Q${cx} ${y + 4} ${x + w - 3} ${y + 9} L${x + w - 4} ${y + 15} L${x + 4} ${y + 15} Z`} fill={glass} />
        <rect x={x + 3.5} y={y + 16} width={w - 7} height={len * 0.38} rx={3} fill="rgba(0,0,0,.14)" />
        <path d={`M${x + 4} ${y + len - 9} L${x + w - 4} ${y + len - 9} L${x + w - 5} ${y + len - 4} L${x + 5} ${y + len - 4} Z`} fill={glass} opacity=".85" />
      </>)}
      {(kind === 'bus' || kind === 'schoolbus' || kind === 'tram') && (<>
        <rect x={x + 3} y={y + 3} width={w - 6} height={6} rx={2} fill={glass} />
        {Array.from({ length: Math.floor((len - 16) / 11) }, (_, i) => (
          <g key={i}>
            <rect x={x + 1.5} y={y + 13 + i * 11} width={3} height={8} fill={glass} />
            <rect x={x + w - 4.5} y={y + 13 + i * 11} width={3} height={8} fill={glass} />
          </g>
        ))}
      </>)}
      {kind === 'schoolbus' && (<>
        <rect x={cx - 8} y={y + len - 18} width={16} height={14} fill="#fff" stroke="#dc2626" strokeWidth="1.5" />
        <circle cx={cx - 3} cy={y + len - 14} r={1.8} fill="#111827" />
        <circle cx={cx + 3} cy={y + len - 13} r={1.6} fill="#111827" />
        <path d={`M${cx - 3} ${y + len - 12} v5 M${cx + 3} ${y + len - 11} v4`} stroke="#111827" strokeWidth="1.6" />
      </>)}
      {kind === 'tram' && <path d={`M${cx - 6} ${cy - 10} L${cx} ${cy - 18} L${cx + 6} ${cy - 10}`} stroke="#111827" strokeWidth="1.5" fill="none" />}
      {kind === 'police' && (<>
        <rect x={x} y={cy - 2} width={w} height={6} fill="#2563eb" />
        <rect x={cx - 7} y={cy - 9} width={6} height={4} fill="#2563eb"><animate attributeName="opacity" values="1;.2;1" dur=".6s" repeatCount="indefinite" /></rect>
        <rect x={cx + 1} y={cy - 9} width={6} height={4} fill="#dc2626"><animate attributeName="opacity" values=".2;1;.2" dur=".6s" repeatCount="indefinite" /></rect>
      </>)}
      {kind === 'ambulance' && (<>
        <rect x={cx - 3} y={cy - 2} width={6} height={16} fill="#dc2626" />
        <rect x={cx - 8} y={cy + 3} width={16} height={6} fill="#dc2626" />
        <rect x={cx - 8} y={y + 16} width={16} height={4} rx={1} fill="#2563eb"><animate attributeName="opacity" values="1;.2;1" dur=".5s" repeatCount="indefinite" /></rect>
      </>)}
      {/* faralar va orqa chiroqlar */}
      <rect x={x + 2} y={y} width={4} height={2.5} fill="#fef9c3" />
      <rect x={x + w - 6} y={y} width={4} height={2.5} fill="#fef9c3" />
      <rect x={x + 2} y={y + len - 2.5} width={4} height={2.5} fill={v.brake ? '#ff1f1f' : '#991b1b'} />
      <rect x={x + w - 6} y={y + len - 2.5} width={4} height={2.5} fill={v.brake ? '#ff1f1f' : '#991b1b'} />
      {v.brake && (<><circle cx={x + 4} cy={y + len + 1} r={5} fill="#ef4444" opacity=".45" /><circle cx={x + w - 4} cy={y + len + 1} r={5} fill="#ef4444" opacity=".45" /></>)}
      {v.door && <rect x={v.door === 'left' ? x - 12 : x + w} y={y + 14} width={12} height={3} rx={1} fill={base} stroke="#0f172a" transform={`rotate(${v.door === 'left' ? -35 : 35} ${v.door === 'left' ? x : x + w} ${y + 14})`} />}
      {(v.hazard || v.blink === 'left') && (<><Blinker x={x + 1} y={y + 2} /><Blinker x={x + 1} y={y + len - 2} /></>)}
      {(v.hazard || v.blink === 'right') && (<><Blinker x={x + w - 1} y={y + 2} /><Blinker x={x + w - 1} y={y + len - 2} /></>)}
    </g>
  );
}

function markingLines(m: Marking, x: number, y1: number, y2: number, color = '#f8fafc', key = '') {
  const L = (dx: number, dash?: string, k = '') => (
    <line key={key + k} x1={x + dx} y1={y1} x2={x + dx} y2={y2} stroke={color} strokeWidth="2.6" strokeDasharray={dash} />
  );
  switch (m) {
    case 'none': return null;
    case 'solid': return L(0);
    case 'dashed': return L(0, '12 10');
    case 'approach': return L(0, '26 8');
    case 'double': return [L(-3, undefined, 'a'), L(3, undefined, 'b')];
    case 'solid-dashed': return [L(-3, undefined, 'a'), L(3, '12 10', 'b')];
    case 'dashed-solid': return [L(-3, '12 10', 'a'), L(3, undefined, 'b')];
  }
}

const ARROW_PATHS: Record<string, string> = {
  s: 'M0 14 V-8 M-5 -3 L0 -10 L5 -3',
  l: 'M0 14 V2 Q0 -6 -8 -6 M-4 -10 L-9 -6 L-4 -2',
  r: 'M0 14 V2 Q0 -6 8 -6 M4 -10 L9 -6 L4 -2',
};

function vehiclePath(v: RoadVehicle, spec: RoadSpec, x: number, y: number, len: number) {
  const f = y - len / 2 - 3;
  const crossY = spec.cross ?? 60;
  const d = v.dist ?? 0;
  switch (v.path) {
    case 'straight': return `M${x} ${f} L${x} ${f - 55 - d}`;
    case 'change-left': return `M${x} ${f} C${x} ${f - 35} ${x - LANE} ${f - 30} ${x - LANE} ${f - 70 - d}`;
    case 'change-right': return `M${x} ${f} C${x} ${f - 35} ${x + LANE} ${f - 30} ${x + LANE} ${f - 70 - d}`;
    case 'overtake': return `M${x} ${f} C${x} ${f - 28} ${x - LANE} ${f - 25} ${x - LANE} ${f - 55} L${x - LANE} ${f - 105 - d} C${x - LANE} ${f - 135 - d} ${x} ${f - 130 - d} ${x} ${f - 160 - d}`;
    case 'back': return `M${x} ${y + len / 2 + 3} L${x} ${y + len / 2 + 50}`;
    case 'uturn': { const t = 2 * C - x; return `M${x} ${f} C${x} ${f - 60} ${t} ${f - 60} ${t} ${f + 15}`; }
    case 'turn-left': return `M${x} ${f} L${x} ${crossY + 22} Q${x} ${crossY - 17} ${x - 40} ${crossY - 17} L20 ${crossY - 17}`;
    case 'turn-right': return `M${x} ${f} L${x} ${crossY + 40} Q${x} ${crossY + 17} ${x + 30} ${crossY + 17} L280 ${crossY + 17}`;
    case 'park': return `M${x} ${f} C${x} ${f - 30} ${x + LANE * 0.7} ${f - 25} ${x + LANE * 0.7} ${f - 60}`;
    default: return '';
  }
}

export function Ped({ x, y, kind = 'adult', angle = 0 }: { x: number; y: number; kind?: 'adult' | 'child' | 'blind'; angle?: number }) {
  const s = kind === 'child' ? 1.05 : 1.4;
  const col = kind === 'child' ? '#f97316' : kind === 'blind' ? '#334155' : '#7c3aed';
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={9} ry={5.5} fill={col} stroke="#0f172a" strokeWidth="1" />
      <circle cx={0} cy={-1} r={4.6} fill="#fcd34d" stroke="#0f172a" strokeWidth="1" />
      {kind === 'blind' && <line x1={6} y1={2} x2={13} y2={-14} stroke="#f8fafc" strokeWidth="2.2" strokeLinecap="round" />}
      {kind === 'blind' && <line x1={11} y1={-10} x2={13} y2={-14} stroke="#dc2626" strokeWidth="2.2" />}
    </g>
  );
}

function Label({ x, y, text, you }: { x: number; y: number; text: string; you?: boolean }) {
  const w = Math.max(28, text.length * 8 + 12);
  return (
    <g>
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={9} fill={you ? '#fef08a' : '#fff'} stroke="#0f172a" strokeWidth="1" />
      <text x={x} y={y + 4.5} fontSize="12" fontWeight={800} textAnchor="middle" fill="#0f172a">{text}</text>
    </g>
  );
}

function Dim({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const vertical = Math.abs(x1 - x2) < Math.abs(y1 - y2);
  const tick = (x: number, y: number) => vertical ? <line x1={x - 6} y1={y} x2={x + 6} y2={y} /> : <line x1={x} y1={y - 6} x2={x} y2={y + 6} />;
  const w = label.length * 7 + 12;
  if (!label) return <g stroke="#fde047" strokeWidth="2"><line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="4 3" />{tick(x1, y1)}{tick(x2, y2)}</g>;
  return (
    <g stroke="#fde047" strokeWidth="2">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="4 3" />
      {tick(x1, y1)}{tick(x2, y2)}
      <rect x={mx - w / 2} y={my - 9} width={w} height={18} rx={4} fill="#111827" stroke="#fde047" strokeWidth="1.2" />
      <text x={mx} y={my + 4.5} fontSize="12" fontWeight={700} textAnchor="middle" fill="#fde047" stroke="none">{label}</text>
    </g>
  );
}

function TrafficLight({ x, y, color, arrow }: NonNullable<RoadSpec['light']>) {
  const on = (c: string) => (c === 'red' ? color === 'red' || color === 'redyellow' : c === 'yellow' ? color === 'yellow' || color === 'flash' || color === 'redyellow' : color === 'green');
  const col: Record<string, string> = { red: '#ef4444', yellow: '#facc15', green: '#22c55e' };
  return (
    <g>
      <line x1={x + 8} y1={y + 44} x2={x + 8} y2={y + 58} stroke="#374151" strokeWidth="3" />
      <rect x={x} y={y} width={16} height={44} rx={4} fill="#111827" />
      {(['red', 'yellow', 'green'] as const).map((c, i) => (
        <circle key={c} cx={x + 8} cy={y + 8 + i * 14} r={5} fill={on(c) ? col[c] : '#374151'}>
          {color === 'flash' && c === 'yellow' && <animate attributeName="opacity" values="1;0.15;1" dur="1s" repeatCount="indefinite" />}
        </circle>
      ))}
      {arrow && (<>
        <rect x={x + 16} y={y + 30} width={16} height={14} rx={3} fill="#111827" />
        <text x={x + 24} y={y + 41} fontSize="11" textAnchor="middle" fill={arrow === 'off' ? '#374151' : '#22c55e'} fontWeight={700}>→</text>
      </>)}
    </g>
  );
}

export function RoadScene({ spec, size = 260 }: { spec: RoadSpec; size?: number }) {
  const [l, r] = edges(spec);
  const vehicles = spec.vehicles ?? [];
  const posOf = (v: RoadVehicle) => ({ x: v.x ?? laneX(spec, v.lane ?? 0, v.dir), y: v.y });
  const center = spec.center ?? (spec.oneway ? 'none' : 'dashed');
  const night = spec.env === 'night';
  return (
    <svg viewBox={`0 0 ${W} 300`} width={size} height={size} role="img" aria-label="Yo'l vaziyati chizmasi" className="scene">
      <defs>
        <marker id="rs-arrow" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#facc15" /></marker>
        <marker id="rs-arrow-w" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#f8fafc" /></marker>
        <pattern id="rs-stripes" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#fff" /><rect width="6" height="12" fill="#dc2626" /></pattern>
        <linearGradient id="rs-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1f5f9" stopOpacity=".97" /><stop offset=".55" stopColor="#e2e8f0" stopOpacity=".75" /><stop offset="1" stopColor="#e2e8f0" stopOpacity=".1" /></linearGradient>
        <radialGradient id="rs-beam" cx=".5" cy="1" r="1"><stop offset="0" stopColor="#fef9c3" stopOpacity=".85" /><stop offset="1" stopColor="#fef9c3" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height="300" fill={spec.yard ? '#d6d3d1' : '#86a95b'} />
      {/* trotuarlar */}
      {!spec.yard && (<>
        <rect x={l - 16} y={0} width={16} height={300} fill="#cbd5e1" />
        <rect x={r} y={0} width={16} height={300} fill="#cbd5e1" />
      </>)}
      {/* kesishuvchi yo'l */}
      {spec.cross !== undefined && (<>
        <rect x={0} y={spec.cross - LANE - 16} width={W} height={2 * LANE + 32} fill="#cbd5e1" />
        <rect x={0} y={spec.cross - LANE} width={W} height={2 * LANE} fill="#4b5563" />
        {spec.crossMarking !== 'none' && <line x1={0} y1={spec.cross} x2={l - 8} y2={spec.cross} stroke="#f8fafc" strokeWidth="2.6" strokeDasharray="12 10" />}
        {spec.crossMarking !== 'none' && <line x1={r + 8} y1={spec.cross} x2={W} y2={spec.cross} stroke="#f8fafc" strokeWidth="2.6" strokeDasharray="12 10" />}
      </>)}
      {/* hovlidan chiqish */}
      {(spec.side ?? []).filter((s) => s.kind === 'driveway').map((s, i) => (
        <g key={'dw' + i}>
          <rect x={r} y={s.y - 22} width={W - r} height={44} fill="#a8a29e" />
          <rect x={r + 40} y={s.y - 60} width={W - r - 40} height={34} fill="#fca5a5" stroke="#7f1d1d" />
          <rect x={r + 40} y={s.y + 26} width={W - r - 40} height={34} fill="#fde68a" stroke="#78350f" />
        </g>
      ))}
      <rect x={l} y={0} width={r - l} height={300} fill={spec.yard ? '#a8a29e' : '#4b5563'} />
      {spec.cross !== undefined && <rect x={l} y={spec.cross - LANE} width={r - l} height={2 * LANE} fill="#4b5563" />}
      {/* muz */}
      {spec.env === 'ice' && [[l + 10, 40, 60], [l + 30, 150, 80], [C + 5, 90, 70], [C + 10, 220, 50]].map(([x, y, w], i) => (
        <ellipse key={i} cx={x + w / 2} cy={y} rx={w / 2} ry={14} fill="#e0f2fe" opacity=".75" />
      ))}
      {/* temir yo'l */}
      {spec.rails !== undefined && (
        <g>
          {Array.from({ length: 16 }, (_, i) => <rect key={i} x={i * 20} y={spec.rails! - 13} width={6} height={26} fill="#78350f" />)}
          <line x1={0} y1={spec.rails - 7} x2={W} y2={spec.rails - 7} stroke="#cbd5e1" strokeWidth="3" />
          <line x1={0} y1={spec.rails + 7} x2={W} y2={spec.rails + 7} stroke="#cbd5e1" strokeWidth="3" />
          {spec.barrier && (
            <g>
              <rect x={r + 2} y={spec.rails + 26} width={10} height={10} fill="#111827" />
              {spec.barrier === 'closed'
                ? <rect x={C - 2} y={spec.rails + 28} width={r - C + 8} height={6} fill="url(#rs-stripes)" stroke="#991b1b" />
                : <rect x={r + 4} y={spec.rails - 16} width={6} height={44} fill="url(#rs-stripes)" />}
            </g>
          )}
          {spec.train && (
            <g>
              <rect x={spec.train === 'left' ? -40 : 210} y={spec.rails - 14} width={130} height={28} rx={5} fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
              <rect x={spec.train === 'left' ? 82 : 212} y={spec.rails - 10} width={6} height={20} fill="#fde047" />
            </g>
          )}
        </g>
      )}
      {/* tramvay yo'li */}
      {spec.tramLane !== undefined && (() => {
        const tx = laneX(spec, spec.tramLane);
        return <g stroke="#cbd5e1" strokeWidth="2.5"><line x1={tx - 7} y1={0} x2={tx - 7} y2={300} /><line x1={tx + 7} y1={0} x2={tx + 7} y2={300} /></g>;
      })()}
      {/* o'rta chiziq (kesishma qismida uzilib qoladi) */}
      {(() => {
        const segs: [number, number][] = spec.cross !== undefined ? [[0, spec.cross - LANE], [spec.cross + LANE, 300]] : [[0, 300]];
        const parts: React.ReactNode[] = [];
        segs.forEach(([a, b], si) => {
          if (spec.centerTo && spec.centerTo.y > a && spec.centerTo.y < b) {
            parts.push(markingLines(spec.centerTo.marking, C, a, spec.centerTo.y, undefined, 'ct' + si));
            parts.push(markingLines(center, C, spec.centerTo.y, b, undefined, 'cb' + si));
          } else parts.push(markingLines(spec.centerTo && b <= spec.centerTo.y ? spec.centerTo.marking : center, C, a, b, undefined, 'c' + si));
          // qatorlar orasidagi chiziqlar
          const n = spec.lanes ?? 1;
          for (let i = 1; i < n; i++) {
            if (spec.oneway) parts.push(markingLines(spec.laneMarking ?? 'dashed', l + i * LANE, a, b, undefined, `o${si}${i}`));
            else {
              parts.push(markingLines(spec.laneMarking ?? 'dashed', C + i * LANE, a, b, undefined, `r${si}${i}`));
              parts.push(markingLines(spec.laneMarking ?? 'dashed', C - i * LANE, a, b, undefined, `l${si}${i}`));
            }
          }
          if (spec.oneway && center !== 'none') parts.push(markingLines(center, C, a, b, undefined, 'oc' + si));
        });
        return parts;
      })()}
      {spec.yellow && markingLines(spec.yellow.dashed ? 'dashed' : 'solid', C + (spec.yellow.dx ?? 12), 0, 300, '#facc15', 'y')}
      {/* to'xtash chizig'i */}
      {spec.stopLine !== undefined && <rect x={spec.oneway ? l : C + 2} y={spec.stopLine - 3} width={spec.oneway ? r - l : r - C - 2} height={6} fill="#f8fafc" />}
      {/* piyodalar o'tish joyi */}
      {spec.zebra !== undefined && Array.from({ length: Math.round((r - l) / 12) }, (_, i) => (
        <rect key={i} x={l + 3 + i * 12} y={spec.zebra! - 14} width={7} height={28} fill="#f8fafc" />
      ))}
      {/* qatordagi yo'nalish strelkalari */}
      {(spec.arrows ?? []).map((a, i) => {
        const x = laneX(spec, a.lane);
        return <g key={i} transform={`translate(${x} ${a.y}) scale(1.7)`} stroke="#f8fafc" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">{a.dirs.map((d) => <path key={d} d={ARROW_PATHS[d]} />)}</g>;
      })}
      {/* bekatlar */}
      {(spec.side ?? []).map((s, i) => {
        if (s.kind === 'busstop') return (
          <g key={i}>
            <rect x={r + 2} y={s.y - 20} width={12} height={40} fill="#0ea5e9" stroke="#075985" />
            <text x={r + 8} y={s.y + 4} fontSize="9" fontWeight={800} fill="#fff" textAnchor="middle">A</text>
            <path d={`M${r} ${s.y - 34} H${r - 8} M${r} ${s.y + 34} H${r - 8}`} stroke="#facc15" strokeWidth="3" />
            {[-26, -14, -2, 10, 22].map((dy) => <line key={dy} x1={r - 1} y1={s.y + dy} x2={r - 9} y2={s.y + dy + 8} stroke="#facc15" strokeWidth="2" />)}
          </g>
        );
        if (s.kind === 'house') return <rect key={i} x={r + 22} y={s.y - 30} width={W - r - 26} height={60} fill="#fde68a" stroke="#78350f" />;
        if (s.kind === 'playground') return (
          <g key={i}><rect x={s.x ?? 10} y={s.y - 28} width={70} height={56} rx={6} fill="#bbf7d0" stroke="#15803d" /><circle cx={(s.x ?? 10) + 22} cy={s.y} r={9} fill="#fde047" stroke="#a16207" /><rect x={(s.x ?? 10) + 40} y={s.y - 14} width={18} height={28} fill="#f97316" /></g>
        );
        return null;
      })}

      {/* transport vositalari */}
      {vehicles.map((v, i) => {
        const { x, y } = posOf(v);
        const [len] = VEH[v.kind ?? 'car'];
        const down = v.dir === 'down';
        const rot = v.rot ?? (down ? 180 : 0);
        const path = vehiclePath(v, spec, x, y, len);
        return (
          <g key={i}>
            <g transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
              {path && <path d={path} stroke={v.you ? '#facc15' : '#f8fafc'} strokeWidth="4" fill="none" strokeDasharray={v.you ? undefined : '7 5'} markerEnd={v.you ? 'url(#rs-arrow)' : 'url(#rs-arrow-w)'} />}
              <VehicleTop v={v} cx={x} cy={y} idx={i} />
            </g>
          </g>
        );
      })}
      {/* shatak trosi */}
      {spec.tow && (() => {
        const a = posOf(vehicles[spec.tow[0]]), b = posOf(vehicles[spec.tow[1]]);
        const la = VEH[vehicles[spec.tow[0]].kind ?? 'car'][0], lb = VEH[vehicles[spec.tow[1]].kind ?? 'car'][0];
        return <line x1={a.x} y1={a.y + la / 2} x2={b.x} y2={b.y - lb / 2} stroke="#fbbf24" strokeWidth="2" strokeDasharray={spec.towRigid ? undefined : '3 2'} />;
      })()}
      {(spec.peds ?? []).map((p, i) => <Ped key={i} {...p} />)}
      {spec.triangle && (() => {
        const tx = laneX(spec, spec.triangle.lane ?? 0);
        const ty = spec.triangle.y;
        return <path d={`M${tx} ${ty - 14} L${tx + 14} ${ty + 11} L${tx - 14} ${ty + 11} Z`} fill="#fff" stroke="#dc2626" strokeWidth="5" strokeLinejoin="round" />;
      })()}
      {(spec.signs ?? []).map((s, i) => {
        const sign = signById(s.id);
        if (!sign) return null;
        const sz = s.size ?? 40;
        return (
          <g key={i}>
            <line x1={s.x} y1={s.y + sz / 2 - 2} x2={s.x} y2={s.y + sz / 2 + 12} stroke="#374151" strokeWidth="2.5" />
            <g transform={`translate(${s.x - sz / 2} ${s.y - sz / 2})`}><RoadSign sign={s.text ? { ...sign, symbol: s.text } : sign} size={sz} bg={s.temp ? '#fde047' : undefined} /></g>
          </g>
        );
      })}
      {spec.light && <TrafficLight {...spec.light} />}

      {/* kecha */}
      {night && <rect width={W} height="300" fill="#020617" opacity=".62" />}
      {vehicles.map((v, i) => {
        if (!v.beams) return null;
        const { x, y } = posOf(v);
        const [len, w] = VEH[v.kind ?? 'car'];
        const reach = v.beams === 'high' ? 150 : 70;
        const spread = v.beams === 'high' ? 30 : 22;
        const rot = v.rot ?? (v.dir === 'down' ? 180 : 0);
        const f = y - len / 2;
        return (
          <g key={'b' + i} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
            <path d={`M${x - w / 2 + 3} ${f} L${x - w / 2 - spread} ${f - reach} L${x + w / 2 + spread} ${f - reach} L${x + w / 2 - 3} ${f} Z`} fill="url(#rs-beam)" />
            {night && <VehicleTop v={{ ...v, beams: undefined }} cx={x} cy={y} idx={i} />}
          </g>
        );
      })}
      {night && vehicles.map((v, i) => {
        if (v.beams || !v.parkLights) return null;
        const { x, y } = posOf(v);
        const [len, w] = VEH[v.kind ?? 'car'];
        return (
          <g key={'p' + i} transform={v.dir === 'down' ? `rotate(180 ${x} ${y})` : undefined}>
            {[[x - w / 2 + 3, y - len / 2 + 1, '#fef9c3'], [x + w / 2 - 3, y - len / 2 + 1, '#fef9c3'], [x - w / 2 + 3, y + len / 2 - 1, '#f87171'], [x + w / 2 - 3, y + len / 2 - 1, '#f87171']].map(([cx, cy, c], k) => (
              <circle key={k} cx={cx as number} cy={cy as number} r={3.5} fill={c as string} />
            ))}
          </g>
        );
      })}
      {night && vehicles.map((v, i) => (v.hazard ? (() => {
        const { x, y } = posOf(v);
        const [len, w] = VEH[v.kind ?? 'car'];
        return <g key={'h' + i}><Blinker x={x - w / 2 + 1} y={y - len / 2 + 2} /><Blinker x={x + w / 2 - 1} y={y - len / 2 + 2} /><Blinker x={x - w / 2 + 1} y={y + len / 2 - 2} /><Blinker x={x + w / 2 - 1} y={y + len / 2 - 2} /></g>;
      })() : null))}
      {/* ovozli signal */}
      {vehicles.map((v, i) => {
        if (!v.horn) return null;
        const { x, y } = posOf(v);
        const f = y - VEH[v.kind ?? 'car'][0] / 2;
        return <g key={'hn' + i} stroke="#facc15" strokeWidth="2.5" fill="none">{[10, 18, 26].map((rr) => <path key={rr} d={`M${x - rr} ${f - rr * 0.6} Q${x} ${f - rr * 1.3} ${x + rr} ${f - rr * 0.6}`} />)}</g>;
      })}
      {spec.env === 'fog' && <rect width={W} height="300" fill="url(#rs-fog)" />}
      {spec.env === 'rain' && Array.from({ length: 40 }, (_, i) => <line key={i} x1={(i * 37) % 300} y1={(i * 53) % 300} x2={(i * 37) % 300 - 5} y2={(i * 53) % 300 + 12} stroke="#bfdbfe" strokeWidth="1.5" opacity=".8" />)}

      {(spec.dims ?? []).map((d, i) => <Dim key={i} {...d} />)}
      {vehicles.map((v, i) => {
        const text = v.you ? 'Siz' : v.label;
        if (!text) return null;
        const { x, y } = posOf(v);
        return <Label key={'l' + i} x={x} y={y} text={text} you={v.you} />;
      })}
      {(spec.notes ?? []).filter((n) => n.text).map((n, i) => <Label key={'n' + i} x={n.x} y={n.y} text={n.text} />)}
    </svg>
  );
}
