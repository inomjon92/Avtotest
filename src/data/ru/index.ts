// Rus tilidagi kontent: savollar, variantlar, izohlar, belgilar va mavzular.
// Matnlar savol/belgi id si bo'yicha saqlanadi va o'zbekcha asl matn bilan juftlanadi —
// shuning uchun admin tahrirlagan (o'zgargan) savol tarjimasi eskirsa, asl o'zbekcha matn ko'rinadi.
import q0 from './q0.txt?raw';
import q1 from './q1.txt?raw';
import q2 from './q2.txt?raw';
import q3 from './q3.txt?raw';
import q4 from './q4.txt?raw';
import q5 from './q5.txt?raw';
import q6 from './q6.txt?raw';
import q7 from './q7.txt?raw';
import q8 from './q8.txt?raw';
import signsRaw from './signs.txt?raw';
import { BASE_QUESTIONS } from '../questions';
import { SIGNS } from '../signs';
import { TOPICS } from '../topics';

export interface RuBlock { title: string; options: string[]; explanation: string }

/** "#id / matn / - variant / = izoh" formatidagi faylni o'qiydi */
export function parseBlocks(raw: string) {
  const out = new Map<string, RuBlock>();
  let cur: RuBlock | null = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('#')) { cur = { title: '', options: [], explanation: '' }; out.set(line.slice(1).trim(), cur); }
    else if (!cur) continue;
    else if (line.startsWith('- ')) cur.options.push(line.slice(2).trim());
    else if (line.startsWith('= ')) cur.explanation = line.slice(2).trim();
    else if (line.trim() && !cur.title) cur.title = line.trim();
  }
  return out;
}

export const RU_QUESTIONS = parseBlocks([q0, q1, q2, q3, q4, q5, q6, q7, q8].join('\n'));
export const RU_SIGNS = parseBlocks(signsRaw);
export const RU_TOPICS = new Map(signsRaw.split('\n').filter((l) => l.startsWith('@')).map((l) => l.slice(1).split('|') as [string, string]));

/** O'zbekcha matn → ruscha tarjima lug'ati */
export function buildRuMap() {
  const map = new Map<string, string>();
  const put = (uz: string | undefined, ru: string | undefined) => { if (uz && ru && !map.has(uz)) map.set(uz, ru); };
  for (const q of BASE_QUESTIONS) {
    const r = RU_QUESTIONS.get(q.id);
    if (!r || r.options.length !== q.options.length) continue;
    put(q.text, r.title);
    q.options.forEach((o, i) => put(o, r.options[i]));
    put(q.explanation, r.explanation);
  }
  for (const s of SIGNS) {
    const r = RU_SIGNS.get(s.id);
    if (r) { put(s.name, r.title); put(s.description, r.explanation); }
  }
  for (const t of TOPICS) put(t.name, RU_TOPICS.get(t.id));
  return map;
}
