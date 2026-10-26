// Chorraha va yo'l vaziyatlarining SVG chizmasi. Barcha transport vositalari "pastdan kelayotgan"
// kanonik holatda chiziladi va kelish tomoniga qarab markaz atrofida aylantiriladi.
import type { Dir, RoadSpec, SceneCar, SceneSpec } from '../data/types';
import { signById } from '../data/signs';
import { RoadSign } from './RoadSign';
import { Ped, RoadScene } from './RoadScene';

const C = 150;
const R = 40;
const ANGLE: Record<Dir, number> = { s: 0, w: 90, n: 180, e: 270 };
const ALL: Dir[] = ['n', 'e', 's', 'w'];

function rot(x: number, y: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  const dx = x - C, dy = y - C;
  return [C + dx * Math.cos(a) - dy * Math.sin(a), C + dx * Math.sin(a) + dy * Math.cos(a)];
}

const CAR_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#0891b2', '#ca8a04'];

function Vehicle({ car, cx, cy, idx }: { car: SceneCar; cx: number; cy: number; idx: number }) {
  const kind = car.kind ?? 'car';
  const len = kind === 'tram' ? 70 : kind === 'bus' || kind === 'truck' ? 50 : 36;
  const w = kind === 'tram' || kind === 'bus' || kind === 'truck' ? 24 : 20;
  const fill = car.you ? '#dc2626' : kind === 'tram' ? '#f59e0b' : kind === 'police' ? '#f8fafc' : CAR_COLORS[idx % CAR_COLORS.length];
  return (
    <g>
      <rect x={cx - w / 2} y={cy - len / 2} width={w} height={len} rx={kind === 'tram' ? 4 : 6} fill={fill} stroke="#0f172a" strokeWidth="1.5" />
      <rect x={cx - w / 2 + 3} y={cy - len / 2 + 5} width={w - 6} height={8} rx={2} fill="#bfdbfe" opacity=".9" />
      {kind === 'police' && <rect x={cx - 5} y={cy - 2} width={10} height={5} fill="#2563eb" />}
    </g>
  );
}

function canonicalPath(turn: SceneCar['turn'], fx: number, fy: number) {
  switch (turn) {
    case 'right': return `M${fx} ${fy} Q${fx} ${C + 20} ${292} ${C + 20}`;
    case 'left': return `M${fx} ${fy} Q${fx} ${C - 20} ${8} ${C - 20}`;
    case 'uturn': return `M${fx} ${fy} C${fx} ${C - 30} ${C - 20} ${C - 30} ${C - 20} ${C + 60}`;
    case 'stop': return '';
    default: return `M${fx} ${fy} L${fx} 10`;
  }
}

function Light({ x, y, color, arrow }: { x: number; y: number; color: NonNullable<SceneSpec['light']>['color']; arrow?: 'left' | 'right' }) {
  const on = (c: string) => {
    if (c === 'red') return color === 'red' || color === 'redyellow';
    if (c === 'yellow') return color === 'yellow' || color === 'flash' || color === 'redyellow';
    return color === 'green';
  };
  const col: Record<string, string> = { red: '#ef4444', yellow: '#facc15', green: '#22c55e' };
  return (
    <g>
      <rect x={x} y={y} width={16} height={44} rx={4} fill="#111827" />
      {(['red', 'yellow', 'green'] as const).map((c, i) => (
        <circle key={c} cx={x + 8} cy={y + 8 + i * 14} r={5} fill={on(c) ? col[c] : '#374151'}>
          {color === 'flash' && c === 'yellow' && <animate attributeName="opacity" values="1;0.15;1" dur="1s" repeatCount="indefinite" />}
        </circle>
      ))}
      {arrow && (<>
        <rect x={arrow === 'right' ? x + 16 : x - 16} y={y + 30} width={16} height={14} rx={3} fill="#111827" />
        <text x={arrow === 'right' ? x + 24 : x - 8} y={y + 41} fontSize="11" textAnchor="middle" fill="#22c55e" fontWeight={700}>{arrow === 'right' ? '→' : '←'}</text>
      </>)}
    </g>
  );
}

function Regulator({ pose, facing }: NonNullable<SceneSpec['regulator']>) {
  const a = ANGLE[facing]; // yuzi qaragan tomon (kanonik: pastga, +y)
  // kanonik holatda o'ng qo'l -x tomonda, chap qo'l +x tomonda
  const arm = (x1: number, y1: number, x2: number, y2: number, k: string) => (
    <g key={k}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
      <circle cx={x2} cy={y2} r={4} fill="#fde68a" stroke="#0f172a" strokeWidth="1" />
    </g>
  );
  return (
    <g transform={`rotate(${a} ${C} ${C})`}>
      <ellipse cx={C} cy={C} rx={18} ry={11} fill="#1e3a8a" stroke="#f8fafc" strokeWidth="2" />
      {pose === 'side' && [arm(C - 14, C, C - 38, C, 'r'), arm(C + 14, C, C + 38, C, 'l')]}
      {pose === 'forward' && arm(C - 12, C + 2, C - 12, C + 30, 'f')}
      {pose === 'up' && <circle cx={C - 13} cy={C - 2} r={6} fill="#fde68a" stroke="#0f172a" strokeWidth="1.5" />}
      <circle cx={C} cy={C} r={8} fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />
      <circle cx={C} cy={C} r={5} fill="#1e3a8a" />
      {/* yuz tomoni */}
      <path d={`M${C - 5} ${C + 12} L${C} ${C + 18} L${C + 5} ${C + 12}`} fill="#facc15" stroke="#0f172a" strokeWidth="1" />
    </g>
  );
}

function SignAt({ at, id, offset }: { at: Dir; id: string; offset: number }) {
  const sign = signById(id);
  if (!sign) return null;
  const [x, y] = rot(C + R + 22, C + R + 22 + offset, ANGLE[at]);
  return <g transform={`translate(${x - 14} ${y - 14})`}><RoadSign sign={sign} size={28} /></g>;
}

function Intersection({ s }: { s: SceneSpec }) {
  const arms = s.kind === 'tee' ? (['e', 's', 'w'] as Dir[]) : ALL;
  const asphalt = '#4b5563';
  return (
    <g>
      {ALL.map((d) => {
        if (!arms.includes(d)) return null;
        const dirt = s.dirt?.includes(d);
        const [x, y, w, h] = d === 'n' ? [C - R, 0, 2 * R, C] : d === 's' ? [C - R, C, 2 * R, C] : d === 'w' ? [0, C - R, C, 2 * R] : [C, C - R, C, 2 * R];
        return <rect key={d} x={x} y={y} width={w} height={h} fill={dirt ? '#a16207' : asphalt} />;
      })}
      <rect x={C - R} y={C - R} width={2 * R} height={2 * R} fill={asphalt} />
      {s.kind === 'roundabout' && (<>
        <circle cx={C} cy={C} r={R + 18} fill={asphalt} />
        <circle cx={C} cy={C} r={24} fill="#4d7c0f" stroke="#e5e7eb" strokeWidth="3" />
      </>)}
      {/* o'rta chiziqlar */}
      {arms.map((d) => {
        if (s.dirt?.includes(d)) return null;
        const [x1, y1] = rot(C, C + R + 4, ANGLE[d]);
        const [x2, y2] = rot(C, 300, ANGLE[d]);
        return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f8fafc" strokeWidth="2" strokeDasharray="10 8" />;
      })}
      {s.rails && (
        <g stroke="#cbd5e1" strokeWidth="2.5">
          {s.rails === 'ns' ? (<><line x1={C - 6} y1={0} x2={C - 6} y2={300} /><line x1={C + 6} y1={0} x2={C + 6} y2={300} /></>)
            : (<><line x1={0} y1={C - 6} x2={300} y2={C - 6} /><line x1={0} y1={C + 6} x2={300} y2={C + 6} /></>)}
        </g>
      )}
    </g>
  );
}

function StraightRoad({ s }: { s: SceneSpec }) {
  const L = s.lanes ?? 1;
  const half = L * 30;
  const center = s.marking ?? 'dashed';
  const line = (x: number, dashed: boolean, key: string) => <line key={key} x1={x} y1={0} x2={x} y2={300} stroke="#f8fafc" strokeWidth="2.5" strokeDasharray={dashed ? '14 10' : undefined} />;
  return (
    <g>
      <rect x={C - half} y={0} width={2 * half} height={300} fill="#4b5563" />
      {center === 'double' ? [line(C - 3, false, 'a'), line(C + 3, false, 'b')]
        : center === 'solid-dashed' ? [line(C - 3, false, 'a'), line(C + 3, true, 'b')]
        : line(C, center === 'dashed', 'c')}
      {L === 2 && [line(C - 30, true, 'l'), line(C + 30, true, 'r')]}
    </g>
  );
}

function Rail({ s }: { s: SceneSpec }) {
  return (
    <g>
      <rect x={C - R} y={0} width={2 * R} height={300} fill="#4b5563" />
      <line x1={C} y1={0} x2={C} y2={300} stroke="#f8fafc" strokeWidth="2" strokeDasharray="10 8" />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={i * 20} y={C - 12} width={6} height={24} fill="#78350f" />)}
      <line x1={0} y1={C - 7} x2={300} y2={C - 7} stroke="#cbd5e1" strokeWidth="3" />
      <line x1={0} y1={C + 7} x2={300} y2={C + 7} stroke="#cbd5e1" strokeWidth="3" />
      {/* shlagbaum */}
      {s.barrier && (s.barrier === 'closed'
        ? <g><rect x={C + R + 2} y={C + 32} width={10} height={10} fill="#111827" /><rect x={C - 2} y={C + 34} width={R + 6} height={6} fill="url(#stripes)" stroke="#991b1b" strokeWidth="1" /></g>
        : <g><rect x={C + R + 2} y={C + 32} width={10} height={10} fill="#111827" /><rect x={C + R + 4} y={C - 10} width={6} height={44} fill="url(#stripes)" /></g>)}
    </g>
  );
}

export function Scene({ scene, size = 260 }: { scene: SceneSpec | RoadSpec; size?: number }) {
  if (scene.kind === 'road') return <RoadScene spec={scene} size={size} />;
  const isStraight = scene.kind === 'straight';
  const isRail = scene.kind === 'rail';
  const cars = scene.cars ?? [];
  return (
    <svg viewBox="0 0 300 300" width={size} height={size} role="img" aria-label="Yo'l vaziyati chizmasi" className="scene">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#facc15" /></marker>
        <pattern id="stripes" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#fff" /><rect width="6" height="12" fill="#dc2626" /></pattern>
      </defs>
      <rect width="300" height="300" fill="#86a95b" />
      {isStraight ? <StraightRoad s={scene} /> : isRail ? <Rail s={scene} /> : <Intersection s={scene} />}

      {(scene.zebra ?? []).map((d) => (
        <g key={d} transform={`rotate(${ANGLE[d]} ${C} ${C})`}>
          {Array.from({ length: 7 }, (_, i) => <rect key={i} x={C - R + 3 + i * 11.5} y={isStraight ? C - 12 : C + R + 6} width={6} height={22} fill="#f8fafc" />)}
        </g>
      ))}
      {(scene.peds ?? []).map((d, i) => {
        const [x, y] = rot(C - 12 + i * 6, isStraight ? C : C + R + 17, ANGLE[d]);
        return <Ped key={d + i} x={x} y={y} angle={ANGLE[d] + 90} />;
      })}

      {cars.map((car, i) => {
        if (isStraight) {
          const lane = car.lane ?? 0;
          const north = car.from === 's';
          const x = north ? C + 15 + lane * 30 : C - 15 - lane * 30;
          const y = car.pos ?? (north ? 220 : 80);
          const dir = north ? -1 : 1;
          const fy = y + dir * 20;
          const path = car.turn === 'left' ? `M${x} ${fy} Q${x} ${fy + dir * 40} ${x + (north ? -30 : 30)} ${fy + dir * 70}` : car.turn === 'stop' ? '' : `M${x} ${fy} L${x} ${fy + dir * 60}`;
          return (
            <g key={i}>
              {path && <path d={path} stroke="#facc15" strokeWidth="4" fill="none" markerEnd="url(#arrowhead)" />}
              <g transform={north ? undefined : `rotate(180 ${x} ${y})`}><Vehicle car={car} cx={x} cy={y} idx={i} /></g>
              <CarLabel car={car} x={x} y={y} />
            </g>
          );
        }
        const angle = ANGLE[car.from];
        const dist = car.pos ?? (car.kind === 'tram' ? 115 : 90);
        const cx = C + 20, cy = C + dist;
        const half = (car.kind === 'tram' ? 70 : car.kind === 'bus' || car.kind === 'truck' ? 50 : 36) / 2;
        const path = canonicalPath(car.turn, cx, cy - half - 2);
        const [lx, ly] = rot(cx, cy, angle);
        return (
          <g key={i}>
            <g transform={`rotate(${angle} ${C} ${C})`}>
              {path && <path d={path} stroke={car.you ? '#facc15' : '#e5e7eb'} strokeWidth="4" fill="none" strokeDasharray={car.you ? undefined : '6 5'} markerEnd="url(#arrowhead)" />}
              <Vehicle car={car} cx={cx} cy={cy} idx={i} />
            </g>
            <CarLabel car={car} x={lx} y={ly} />
          </g>
        );
      })}

      {(scene.signs ?? []).map((sg, i) => <SignAt key={i} at={sg.at} id={sg.id} offset={(scene.signs ?? []).slice(0, i).filter((x) => x.at === sg.at).length * 32} />)}
      {scene.light && (() => {
        const [x, y] = rot(C + R + 10, C + R + (scene.signs?.some((sg) => sg.at === scene.light!.at) ? 62 : 8), ANGLE[scene.light.at]);
        return <Light x={x - 8} y={y} color={scene.light.color} arrow={scene.light.arrow} />;
      })()}
      {scene.regulator && <Regulator {...scene.regulator} />}
    </svg>
  );
}

function CarLabel({ car, x, y }: { car: SceneCar; x: number; y: number }) {
  const text = car.you ? 'Siz' : car.label;
  if (!text) return null;
  return (
    <g>
      <rect x={x - 15} y={y - 9} width={30} height={18} rx={9} fill={car.you ? '#fef08a' : '#fff'} stroke="#0f172a" strokeWidth="1" />
      <text x={x} y={y + 4.5} fontSize="12" fontWeight={800} textAnchor="middle" fill="#0f172a">{text}</text>
    </g>
  );
}
