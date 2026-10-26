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
  scene?: SceneSpec;
  /** 1 — oson, 2 — o'rta, 3 — qiyin */
  difficulty?: 1 | 2 | 3;
  status: QuestionStatus;
  version: number;
  updatedAt?: string;
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
  | 'plate';

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
