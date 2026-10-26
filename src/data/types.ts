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
