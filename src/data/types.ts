export type QuestionStatus = 'draft' | 'review' | 'published' | 'archived';

export interface Question {
  id: string;
  topic: string;
  /** Bilet raqami; berilmasa avtomatik taqsimlanadi */
  ticket?: number;
  text: string;
  /** Variantlar; `correct` — to'g'ri variant indeksi */
  options: string[];
  correct: number;
  explanation: string;
  /** Yo'riqnomadagi qoida bo'limi (rules.ts dagi id) */
  rule?: string;
  /** Yo'l belgisi kodi (signs.ts dagi id) yoki rasm URL */
  sign?: string;
  image?: string;
  /** Vaziyat chizmasi (chorraha, yo'l) */
  scene?: SceneSpec | RoadSpec;
  /** Piktogramma (Art.tsx dagi kalit) */
  art?: string;
  /** 1 — oson, 2 — o'rta, 3 — qiyin */
  difficulty?: 1 | 2 | 3;
  status: QuestionStatus;
  version: number;
  updatedAt?: string;
  /** Foydalanuvchi yuborgan savol bo'lsa, uning logini */
  author?: string;
}

export interface Topic {
  id: string;
  name: string;
  icon: string;
}

export interface RuleSection {
  id: string;
  topic: string;
  chapter: string;
  title: string;
  items: string[];
}

export type SignShape =
  | 'warning'
  | 'prohibit'
  | 'noentry'
  | 'nostop'
  | 'mandatory'
  | 'square'
  | 'giveway'
  | 'stop'
  | 'main'
  | 'mainEnd'
  | 'plate'
  | 'town'
  | 'townEnd';

export interface RoadSign {
  id: string;
  group: number;
  code: string;
  name: string;
  description: string;
  shape: SignShape;
  /** Belgidagi piktogramma: matn, emoji yoki maxsus kalit (arrow-up, arrow-left ...) */
  symbol?: string;
  /** Taqiqlovchi belgilarda diagonal chiziq */
  slash?: boolean;
}

export type Dir = 'n' | 's' | 'e' | 'w';

export interface SceneCar {
  /** Qaysi tomondan kelmoqda (s — pastdan yuqoriga) */
  from: Dir;
  turn?: 'straight' | 'left' | 'right' | 'uturn' | 'stop';
  label?: string;
  you?: boolean;
  kind?: 'car' | 'tram' | 'bus' | 'truck' | 'police';
  /** To'g'ri yo'l sahnasida: qator (0 — o'ng chekka) va chorrahagacha masofa */
  lane?: number;
  pos?: number;
}

export interface SceneSpec {
  kind: 'cross' | 'tee' | 'straight' | 'rail' | 'roundabout';
  signs?: { at: Dir; id: string }[];
  light?: { at: Dir; color: 'red' | 'yellow' | 'green' | 'flash' | 'redyellow'; arrow?: 'left' | 'right' };
  cars?: SceneCar[];
  peds?: Dir[];
  zebra?: Dir[];
  regulator?: { pose: 'side' | 'forward' | 'up'; facing: Dir };
  rails?: 'ns' | 'ew';
  dirt?: Dir[];
  barrier?: 'closed' | 'open';
  /** To'g'ri yo'l: har yo'nalishdagi qatorlar soni va o'rta chiziq */
  lanes?: 1 | 2;
  marking?: 'solid' | 'dashed' | 'double' | 'solid-dashed';
}

export type Marking = 'none' | 'solid' | 'dashed' | 'approach' | 'double' | 'solid-dashed' | 'dashed-solid';

export interface RoadVehicle {
  lane?: number;
  dir?: 'up' | 'down';
  x?: number;
  y: number;
  rot?: number;
  kind?: 'car' | 'police' | 'ambulance' | 'truck' | 'bus' | 'schoolbus' | 'tram' | 'moto';
  color?: string;
  you?: boolean;
  label?: string;
  path?: 'straight' | 'change-left' | 'change-right' | 'overtake' | 'back' | 'uturn' | 'turn-left' | 'turn-right' | 'park';
  /** Yo'l chizig'ini uzaytirish (px) */
  dist?: number;
  hazard?: boolean;
  blink?: 'left' | 'right';
  brake?: boolean;
  beams?: 'low' | 'high';
  parkLights?: boolean;
  horn?: boolean;
  door?: 'left' | 'right';
}

/** To'g'ri yo'l bo'lagi (yuqoridan ko'rinish) */
export interface RoadSpec {
  kind: 'road';
  lanes?: 1 | 2 | 3;
  oneway?: boolean;
  center?: Marking;
  /** y dan yuqorida o'rta chiziq boshqacha */
  centerTo?: { y: number; marking: Marking };
  laneMarking?: Marking;
  yellow?: { dx?: number; dashed?: boolean };
  stopLine?: number;
  zebra?: number;
  arrows?: { lane: number; y: number; dirs: ('l' | 's' | 'r')[] }[];
  cross?: number;
  crossMarking?: 'none' | 'dashed';
  rails?: number;
  barrier?: 'closed' | 'open';
  train?: 'left' | 'right';
  tramLane?: number;
  side?: { y: number; x?: number; kind: 'busstop' | 'driveway' | 'house' | 'playground' }[];
  vehicles?: RoadVehicle[];
  peds?: { x: number; y: number; kind?: 'adult' | 'child' | 'blind'; angle?: number }[];
  signs?: { x: number; y: number; id: string; size?: number; temp?: boolean; text?: string }[];
  light?: { x: number; y: number; color: 'red' | 'yellow' | 'green' | 'flash' | 'redyellow'; arrow?: 'on' | 'off' };
  triangle?: { y: number; lane?: number };
  dims?: { x1: number; y1: number; x2: number; y2: number; label: string }[];
  notes?: { x: number; y: number; text: string }[];
  env?: 'night' | 'fog' | 'ice' | 'rain';
  tow?: [number, number];
  towRigid?: boolean;
  yard?: boolean;
}
