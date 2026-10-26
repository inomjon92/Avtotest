// Aqlli takrorlash (Leitner tizimi) va xatolar ro'yxati qoidalari.
export interface QStat {
  correct: number;
  wrong: number;
  /** Ketma-ket to'g'ri javoblar soni */
  streak: number;
  /** Leitner qutisi 0..5 */
  box: number;
  /** Keyingi takrorlash vaqti (ms) */
  due: number;
  last?: number;
  lastCorrect?: boolean;
  inMistakes?: boolean;
}

export const BOX_DAYS = [0, 1, 2, 4, 7, 15];
export const MISTAKE_EXIT_STREAK = 3;
const DAY = 86400000;

export const emptyStat = (): QStat => ({ correct: 0, wrong: 0, streak: 0, box: 0, due: 0 });

export function applyAnswer(prev: QStat | undefined, isCorrect: boolean, now = Date.now()): QStat {
  const s = { ...(prev ?? emptyStat()) };
  s.last = now;
  s.lastCorrect = isCorrect;
  if (isCorrect) {
    s.correct++;
    s.streak++;
    s.box = Math.min(s.box + 1, BOX_DAYS.length - 1);
    if (s.inMistakes && s.streak >= MISTAKE_EXIT_STREAK) s.inMistakes = false;
  } else {
    s.wrong++;
    s.streak = 0;
    s.box = 0;
    s.inMistakes = true;
  }
  s.due = now + BOX_DAYS[s.box] * DAY;
  return s;
}

export const isMastered = (s?: QStat) => !!s && s.lastCorrect === true && s.box >= 2;
export const isDue = (s: QStat | undefined, now = Date.now()) => !!s && s.due <= now;
