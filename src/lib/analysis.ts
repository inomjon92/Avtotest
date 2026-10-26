// Natijalarni tahlil qilish: zaif mavzular va keyingi qadam bo'yicha tavsiyalar (internetsiz, bepul).
import type { Question } from '../data/types';
import type { QStat } from './srs';

export interface TopicScore { topic: string; total: number; seen: number; correct: number; wrong: number; accuracy: number; coverage: number; score: number }

export function topicScores(pool: Question[], stats: Record<string, QStat>): TopicScore[] {
  const by = new Map<string, TopicScore>();
  for (const q of pool) {
    const t = by.get(q.topic) ?? { topic: q.topic, total: 0, seen: 0, correct: 0, wrong: 0, accuracy: 0, coverage: 0, score: 0 };
    t.total++;
    const st = stats[q.id];
    if (st) { t.seen++; t.correct += st.correct; t.wrong += st.wrong; }
    by.set(q.topic, t);
  }
  return [...by.values()].map((t) => {
    const answers = t.correct + t.wrong;
    const accuracy = answers ? t.correct / answers : 0;
    const coverage = t.total ? t.seen / t.total : 0;
    // Bilim darajasi: aniqlik va qamrovning birikmasi (ko'rilmagan mavzu — 0)
    return { ...t, accuracy, coverage, score: answers ? accuracy * (0.4 + 0.6 * coverage) : 0 };
  });
}

/** Eng ko'p e'tibor talab qiladigan mavzular (kamida bitta javob berilgan yoki umuman boshlanmagan) */
export function weakTopics(scores: TopicScore[], n = 3) {
  return [...scores].filter((t) => t.score < 0.85).sort((a, b) => a.score - b.score || b.total - a.total).slice(0, n);
}

/** Zaif mavzular bo'yicha mashq: avval xato qilinganlar, keyin ko'rilmaganlar, keyin qolganlari */
export function weakPractice(pool: Question[], stats: Record<string, QStat>, topics: string[], limit = 20) {
  const inTopics = pool.filter((q) => topics.includes(q.topic));
  const rank = (q: Question) => {
    const st = stats[q.id];
    if (!st) return 1;
    if (st.inMistakes || st.lastCorrect === false) return 0;
    return 2 + st.box;
  };
  return [...inTopics].sort((a, b) => rank(a) - rank(b) || Math.random() - 0.5).slice(0, limit);
}

/** Barcha mavzulardan teng taqsimlangan tasodifiy savollar */
export function mixedQuestions(pool: Question[], count = 20) {
  const groups = new Map<string, Question[]>();
  for (const q of pool) groups.set(q.topic, [...(groups.get(q.topic) ?? []), q]);
  const lists = [...groups.values()].map((l) => [...l].sort(() => Math.random() - 0.5));
  const out: Question[] = [];
  while (out.length < count && lists.some((l) => l.length)) {
    for (const l of lists.sort(() => Math.random() - 0.5)) {
      const q = l.pop();
      if (q) out.push(q);
      if (out.length >= count) break;
    }
  }
  return out.sort(() => Math.random() - 0.5);
}

export interface Advice { icon: string; text: string; to?: string; action?: string }

export function advice(scores: TopicScore[], opts: { readiness: number | null; examsTaken: number; mistakes: number; rulesRead: number; rulesTotal: number; topicName: (id: string) => string }): Advice[] {
  const out: Advice[] = [];
  const weak = weakTopics(scores, 2);
  const seenAny = scores.some((t) => t.seen > 0);
  if (!seenAny) {
    out.push({ icon: '👋', text: "Boshlash uchun yo'riqnomadan birinchi darsni o'qing, keyin shu mavzu bo'yicha test yeching.", to: '/guide/rules', action: "Darslarni ochish" });
    return out;
  }
  if (weak.length) {
    const names = weak.map((w) => `${opts.topicName(w.topic)} (${Math.round(w.accuracy * 100)}%)`).join(', ');
    out.push({ icon: '🎯', text: `Eng ko'p e'tibor talab qiladigan mavzular: ${names}. Shu mavzular bo'yicha 20 ta savol tayyorladik.`, to: '/quiz/weak', action: 'Mashq qilish' });
  }
  if (opts.mistakes >= 5) out.push({ icon: '❌', text: `Xatolar ro'yxatida ${opts.mistakes} ta savol bor. Ularni ketma-ket 3 marta to'g'ri yechsangiz, ro'yxatdan chiqadi.`, to: '/quiz/mistakes', action: 'Xatolar ustida ishlash' });
  const unread = opts.rulesTotal - opts.rulesRead;
  if (unread > 0 && weak.length) out.push({ icon: '📚', text: `Yo'riqnomada ${unread} ta dars hali o'qilmagan. Zaif mavzu qoidasini o'qib chiqish natijani tez oshiradi.`, to: '/guide/rules', action: "O'qish" });
  if (opts.examsTaken === 0) out.push({ icon: '🎓', text: "Hali imtihon simulyatorini sinab ko'rmadingiz. Haqiqiy imtihon sharoitida o'zingizni sinang.", to: '/quiz/exam', action: 'Imtihon' });
  else if (opts.readiness !== null && opts.readiness >= 85) out.push({ icon: '🏆', text: `Tayyorlik indeksi ${opts.readiness}%. Imtihonga tayyorsiz, natijani saqlash uchun kuniga bitta simulyatsiya yeching.` });
  else if (opts.readiness !== null) out.push({ icon: '📈', text: `Tayyorlik indeksi ${opts.readiness}%. 85% dan oshganda imtihonga tayyor hisoblanasiz.`, to: '/quiz/mixed', action: 'Aralash test' });
  return out;
}
