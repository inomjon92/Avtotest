import type { Question } from '../data/types';
import { seeded, shuffle } from './random';

export interface ExamConfig {
  questionCount: number;
  minutes: number;
  /** Ruxsat etilgan xatolar soni; undan oshsa test yiqiladi */
  maxErrors: number;
  ticketSize: number;
  shuffleOptions: boolean;
}

// TZ dagi taxminiy qiymatlar; rasmiy manbadan tasdiqlangach admin paneldan o'zgartiriladi.
export const DEFAULT_EXAM: ExamConfig = { questionCount: 20, minutes: 25, maxErrors: 2, ticketSize: 20, shuffleOptions: true };

export function pickExamQuestions(pool: Question[], count: number, rnd: () => number = Math.random) {
  return shuffle(pool, rnd).slice(0, Math.min(count, pool.length));
}

export type ExamOutcome = 'running' | 'passed' | 'failed';

export function examOutcome(answered: number, errors: number, total: number, cfg: Pick<ExamConfig, 'maxErrors'>, timeUp = false): ExamOutcome {
  if (errors > cfg.maxErrors) return 'failed';
  if (timeUp) return answered >= total ? 'passed' : 'failed';
  return answered >= total ? 'passed' : 'running';
}

/** Biletlarga ajratish: aniq raqamli savollar o'z biletida, qolganlari mavzular aralash taqsimlanadi. */
export function buildTickets(questions: Question[], size: number): Map<number, Question[]> {
  const tickets = new Map<number, Question[]>();
  const fixed = questions.filter((q) => q.ticket);
  const free = shuffle(questions.filter((q) => !q.ticket), seeded(20261026));
  for (const q of fixed) {
    if (!tickets.has(q.ticket!)) tickets.set(q.ticket!, []);
    tickets.get(q.ticket!)!.push(q);
  }
  let n = 1;
  for (const q of free) {
    while ((tickets.get(n)?.length ?? 0) >= size) n++;
    if (!tickets.has(n)) tickets.set(n, []);
    tickets.get(n)!.push(q);
  }
  return new Map([...tickets.entries()].sort((a, b) => a[0] - b[0]));
}

/** Tayyorlik indeksi: oxirgi 10 simulyatsiya bo'yicha, yangi urinishlarga ko'proq vazn. */
export function readinessIndex(history: { passed: boolean; correct: number; total: number }[]): number | null {
  const last = history.slice(-10);
  if (last.length === 0) return null;
  let wSum = 0, score = 0;
  last.forEach((h, i) => {
    const w = i + 1;
    const acc = h.total ? h.correct / h.total : 0;
    score += w * (0.6 * (h.passed ? 1 : 0) + 0.4 * acc);
    wSum += w;
  });
  const confidence = Math.min(1, last.length / 5);
  return Math.round((score / wSum) * 100 * confidence);
}
