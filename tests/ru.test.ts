import { describe, expect, it } from 'vitest';
import { BASE_QUESTIONS } from '../src/data/questions';
import { SIGNS } from '../src/data/signs';
import { TOPICS } from '../src/data/topics';
import { buildRuMap, RU_QUESTIONS, RU_SIGNS, RU_TOPICS } from '../src/data/ru';

describe('rus tilidagi savollar bazasi', () => {
  it("har bir savol tarjima qilingan, variantlar soni mos", () => {
    const missing = BASE_QUESTIONS.filter((q) => !RU_QUESTIONS.has(q.id)).map((q) => q.id);
    expect(missing).toEqual([]);
    for (const q of BASE_QUESTIONS) {
      const r = RU_QUESTIONS.get(q.id)!;
      expect(r.options.length, q.id).toBe(q.options.length);
      expect(r.title.length, q.id).toBeGreaterThan(5);
      expect(new Set(r.options).size, q.id).toBe(r.options.length);
      if (q.explanation) expect(r.explanation.length, q.id).toBeGreaterThan(5);
    }
    expect([...RU_QUESTIONS.keys()].filter((id) => !BASE_QUESTIONS.some((q) => q.id === id))).toEqual([]);
  });

  it('belgilar va mavzular tarjima qilingan', () => {
    expect(SIGNS.filter((s) => !RU_SIGNS.get(s.id)?.title || !RU_SIGNS.get(s.id)?.explanation).map((s) => s.id)).toEqual([]);
    expect(TOPICS.filter((t) => !RU_TOPICS.get(t.id)).map((t) => t.id)).toEqual([]);
  });

  it("lug'at o'zbekcha matnni ruschaga o'giradi", () => {
    const map = buildRuMap();
    const q1 = BASE_QUESTIONS.find((q) => q.id === 'q1')!;
    expect(map.get(q1.text)).toBe('Что означает этот знак?');
    expect(map.get(q1.options[q1.correct])).toContain('Въезд');
  });
});
