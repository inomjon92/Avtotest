import { describe, expect, it } from 'vitest';
import { applyAnswer, MISTAKE_EXIT_STREAK } from '../src/lib/srs';
import { buildTickets, examOutcome, readinessIndex } from '../src/lib/exam';
import { questionsFromCSV, toCSV } from '../src/lib/csv';
import { toCyrillic } from '../src/lib/translit';
import { BASE_QUESTIONS } from '../src/data/questions';
import { RULES } from '../src/data/rules';
import { SIGNS } from '../src/data/signs';
import { TOPICS } from '../src/data/topics';

describe('imtihon qoidalari', () => {
  const cfg = { maxErrors: 2 };
  it('3-xatoda yiqiladi', () => {
    expect(examOutcome(5, 2, 20, cfg)).toBe('running');
    expect(examOutcome(5, 3, 20, cfg)).toBe('failed');
  });
  it('hamma savolga 2 tagacha xato bilan javob — o\'tdi', () => {
    expect(examOutcome(20, 2, 20, cfg)).toBe('passed');
  });
  it('vaqt tugaganda javobsiz savol qolsa — yiqildi', () => {
    expect(examOutcome(15, 0, 20, cfg, true)).toBe('failed');
  });
});

describe('xatolar ro\'yxati va takrorlash', () => {
  it('xato javobdan keyin ro\'yxatga tushadi va 3 marta ketma-ket to\'g\'ridan keyin chiqadi', () => {
    let s = applyAnswer(undefined, false, 0);
    expect(s.inMistakes).toBe(true);
    for (let i = 0; i < MISTAKE_EXIT_STREAK - 1; i++) s = applyAnswer(s, true, 0);
    expect(s.inMistakes).toBe(true);
    s = applyAnswer(s, false, 0);
    for (let i = 0; i < MISTAKE_EXIT_STREAK; i++) s = applyAnswer(s, true, 0);
    expect(s.inMistakes).toBe(false);
  });
  it('to\'g\'ri javob keyingi takrorlashni kechiktiradi', () => {
    const s = applyAnswer(applyAnswer(undefined, true, 0), true, 0);
    expect(s.box).toBe(2);
    expect(s.due).toBe(2 * 86400000);
  });
});

describe('biletlar', () => {
  it('har bir savol aynan bitta biletga tushadi va bilet hajmi oshmaydi', () => {
    const t = buildTickets(BASE_QUESTIONS, 20);
    const ids = [...t.values()].flat().map((q) => q.id);
    expect(new Set(ids).size).toBe(BASE_QUESTIONS.length);
    for (const qs of t.values()) expect(qs.length).toBeLessThanOrEqual(20);
  });
  it('taqsimot barqaror', () => {
    const a = [...buildTickets(BASE_QUESTIONS, 20).get(1)!].map((q) => q.id);
    const b = [...buildTickets(BASE_QUESTIONS, 20).get(1)!].map((q) => q.id);
    expect(a).toEqual(b);
  });
});

describe('tayyorlik indeksi', () => {
  it('ma\'lumot bo\'lmasa null', () => expect(readinessIndex([])).toBeNull());
  it('ketma-ket muvaffaqiyatli imtihonlar yuqori indeks beradi', () => {
    const h = Array.from({ length: 10 }, () => ({ passed: true, correct: 20, total: 20 }));
    expect(readinessIndex(h)).toBe(100);
  });
});

describe('CSV', () => {
  it('eksport → import aylanmasi savollarni saqlaydi', () => {
    const { questions, errors } = questionsFromCSV(toCSV(BASE_QUESTIONS.slice(0, 5)));
    expect(errors).toEqual([]);
    expect(questions.map((q) => [q.id, q.text, q.options, q.correct])).toEqual(BASE_QUESTIONS.slice(0, 5).map((q) => [q.id, q.text, q.options, q.correct]));
  });
  it('nuqtali vergul bilan ajratilgan Excel CSV ni o\'qiydi va xatolarni ko\'rsatadi', () => {
    const csv = 'text;option1;option2;correct\n"Savol; bir";A;B;2\n;A;B;1\nSavol;A;B;5';
    const { questions, errors } = questionsFromCSV(csv);
    expect(questions).toHaveLength(1);
    expect(questions[0].text).toBe('Savol; bir');
    expect(questions[0].correct).toBe(1);
    expect(errors).toHaveLength(2);
  });
});

describe('kirill yozuvi', () => {
  it('asosiy harflar', () => {
    expect(toCyrillic("O'zbekiston")).toBe('Ўзбекистон');
    expect(toCyrillic("Yo'l harakati qoidalari")).toBe('Йўл ҳаракати қоидалари');
    expect(toCyrillic('Shahar, choyxona, eshik')).toBe('Шаҳар, чойхона, эшик');
    expect(toCyrillic("ma'lumot")).toBe('маълумот');
  });
});

describe('kontent yaxlitligi', () => {
  const topicIds = new Set(TOPICS.map((t) => t.id));
  const ruleIds = new Set(RULES.map((r) => r.id));
  const signIds = new Set(SIGNS.map((s) => s.id));
  it.each(BASE_QUESTIONS.map((q) => [q.id, q]))('%s', (_, q) => {
    expect(topicIds.has(q.topic)).toBe(true);
    if (q.rule) expect(ruleIds.has(q.rule)).toBe(true);
    if (q.sign) expect(signIds.has(q.sign)).toBe(true);
    expect(q.options.length).toBeGreaterThanOrEqual(2);
    expect(q.options.length).toBeLessThanOrEqual(5);
    expect(new Set(q.options).size).toBe(q.options.length);
  });
  it('savol ID lari takrorlanmaydi', () => {
    expect(new Set(BASE_QUESTIONS.map((q) => q.id)).size).toBe(BASE_QUESTIONS.length);
  });
});
