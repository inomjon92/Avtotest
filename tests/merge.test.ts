import { describe, expect, it } from 'vitest';
import { mergeProgress, differs } from '../src/lib/merge';
import { initialState } from '../src/store/store';

const att = (id: string, t: number) => ({ id, mode: 'ticket' as const, title: id, startedAt: t, finishedAt: t, total: 1, answered: 1, correct: 1, errors: 0, answers: [] });

describe('progress merge', () => {
  it('oflayn yechilgan testlar ham, boshqa qurilmadagilar ham saqlanadi', () => {
    const local = { ...initialState(), updatedAt: 200, attempts: [att('a', 1), att('offline', 150)], stats: { q1: { correct: 2, wrong: 0, streak: 2, box: 2, due: 0, last: 150 } }, rulesRead: { r1: 10 } };
    const remote = { ...initialState(), updatedAt: 300, attempts: [att('a', 1), att('phone', 250)], stats: { q1: { correct: 1, wrong: 1, streak: 0, box: 0, due: 0, last: 100 }, q2: { correct: 1, wrong: 0, streak: 1, box: 1, due: 0, last: 260 } }, rulesRead: { r2: 20 } };
    const m = mergeProgress(local, remote);
    expect(m.attempts.map((a) => a.id)).toEqual(['a', 'offline', 'phone']);
    expect(m.stats.q1).toMatchObject({ box: 2, correct: 2, wrong: 1 });
    expect(m.stats.q2.box).toBe(1);
    expect(Object.keys(m.rulesRead).sort()).toEqual(['r1', 'r2']);
    expect(m.updatedAt).toBe(300);
    expect(differs(m, remote)).toBe(true);
    expect(differs(mergeProgress(m, m), m)).toBe(false);
  });
});
