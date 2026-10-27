// Yutuqlar: har biri uchun joriy natija va maqsad (progress chizig'i uchun).
import { RULES } from '../data/rules';
import { TOPICS } from '../data/topics';
import { dayStreak, publishedQuestions, type AppState } from '../store/store';
import { isMastered } from './srs';

export interface Achievement { id: string; icon: string; title: string; hint: string; progress: (s: AppState) => [number, number] }

const answers = (s: AppState) => Object.values(s.stats).reduce((a, x) => a + x.correct + x.wrong, 0);
const mastered = (s: AppState) => publishedQuestions(s).filter((q) => isMastered(s.stats[q.id])).length;
const passedExams = (s: AppState) => s.attempts.filter((a) => a.mode === 'exam' && a.passed);
const topicMastered = (s: AppState, topic: string): [number, number] => {
  const qs = publishedQuestions(s).filter((q) => q.topic === topic);
  return [qs.filter((q) => isMastered(s.stats[q.id])).length, qs.length];
};
const maxDay = (s: AppState) => Math.max(0, ...Object.values(s.activity));
/** Eng uzun seriya: kunlar ketma-ketligi bo'yicha */
function bestStreak(s: AppState) {
  const days = Object.keys(s.activity).filter((d) => s.activity[d] > 0).sort();
  let best = 0, cur = 0, prev = 0;
  for (const d of days) {
    const t = Date.parse(d + 'T00:00:00Z');
    cur = prev && t - prev === 86400000 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = t;
  }
  return Math.max(best, dayStreak(s.activity));
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', icon: '🚀', title: 'Birinchi qadam', hint: '1 ta savolga javob bering', progress: (s) => [Math.min(1, answers(s)), 1] },
  { id: 'hundred', icon: '💯', title: '100 ta javob', hint: 'Jami 100 ta savolga javob bering', progress: (s) => [Math.min(100, answers(s)), 100] },
  { id: 'thousand', icon: '🧮', title: '1000 ta javob', hint: 'Jami 1000 ta savolga javob bering', progress: (s) => [Math.min(1000, answers(s)), 1000] },
  { id: 'day50', icon: '⚡', title: 'Faol kun', hint: 'Bir kunda 50 ta savol yeching', progress: (s) => [Math.min(50, maxDay(s)), 50] },
  { id: 'streak3', icon: '🔥', title: '3 kunlik seriya', hint: '3 kun ketma-ket mashq qiling', progress: (s) => [Math.min(3, bestStreak(s)), 3] },
  { id: 'streak7', icon: '🔥', title: '7 kunlik seriya', hint: '7 kun ketma-ket mashq qiling', progress: (s) => [Math.min(7, bestStreak(s)), 7] },
  { id: 'streak30', icon: '🌋', title: '30 kunlik seriya', hint: '30 kun ketma-ket mashq qiling', progress: (s) => [Math.min(30, bestStreak(s)), 30] },
  { id: 'exam1', icon: '🎓', title: "Birinchi imtihon", hint: "Imtihon simulyatoridan o'ting", progress: (s) => [Math.min(1, passedExams(s).length), 1] },
  { id: 'exam10', icon: '🎖', title: "10 ta imtihon", hint: "Imtihon simulyatoridan 10 marta o'ting", progress: (s) => [Math.min(10, passedExams(s).length), 10] },
  { id: 'perfect', icon: '🏆', title: 'Xatosiz imtihon', hint: "Imtihonni birorta xatosiz topshiring", progress: (s) => [passedExams(s).some((a) => a.errors === 0) ? 1 : 0, 1] },
  { id: 'fast', icon: '⏱', title: 'Tezkor', hint: "Imtihondan 10 daqiqada o'ting", progress: (s) => [passedExams(s).some((a) => a.finishedAt - a.startedAt <= 600000) ? 1 : 0, 1] },
  { id: 'half', icon: '📈', title: 'Yarim yo\'l', hint: "Savollarning yarmini o'zlashtiring", progress: (s) => { const n = publishedQuestions(s).length; return [Math.min(Math.ceil(n / 2), mastered(s)), Math.ceil(n / 2)]; } },
  { id: 'all', icon: '👑', title: 'Hammasini bilaman', hint: "Barcha savollarni o'zlashtiring", progress: (s) => [mastered(s), publishedQuestions(s).length] },
  { id: 'signs', icon: '⚠️', title: 'Belgilar ustasi', hint: "Yo'l belgilari mavzusidagi barcha savollar", progress: (s) => topicMastered(s, 'belgilar') },
  { id: 'cross', icon: '🚦', title: 'Chorraha ustasi', hint: "Chorrahalar mavzusidagi barcha savollar", progress: (s) => topicMastered(s, 'chorraha') },
  { id: 'aid', icon: '⛑', title: 'Hayot qutqaruvchi', hint: "Birinchi tibbiy yordam mavzusidagi barcha savollar", progress: (s) => topicMastered(s, 'yordam') },
  { id: 'topics', icon: '🗂', title: 'Har tomonlama', hint: "Har bir mavzudan kamida bitta savolni o'zlashtiring", progress: (s) => {
    const pool = publishedQuestions(s);
    const ids = TOPICS.filter((t) => pool.some((q) => q.topic === t.id));
    return [ids.filter((t) => pool.some((q) => q.topic === t.id && isMastered(s.stats[q.id]))).length, ids.length];
  } },
  { id: 'reader', icon: '📚', title: "Kitobxon", hint: "Yo'riqnomaning barcha darslarini o'qing", progress: (s) => [RULES.filter((r) => s.rulesRead[r.id]).length, RULES.length] },
  { id: 'marathon', icon: '🏃', title: 'Marafonchi', hint: 'Marafonni oxirigacha tugating', progress: (s) => [s.attempts.some((a) => a.mode === 'marathon' && a.answered >= a.total) ? 1 : 0, 1] },
  { id: 'fixer', icon: '🛠', title: "Xatolar ustida", hint: "Xatolar ro'yxatidan 20 ta savolni chiqaring", progress: (s) => [Math.min(20, Object.values(s.stats).filter((x) => x.wrong > 0 && !x.inMistakes && x.lastCorrect).length), 20] },
];

export function achievementStatus(s: AppState) {
  return ACHIEVEMENTS.map((a) => {
    const [cur, target] = a.progress(s);
    return { ...a, cur, target, done: target > 0 && cur >= target };
  });
}
