import type { Question, QuestionStatus } from '../data/types';

export const CSV_COLUMNS = ['id', 'ticket', 'topic', 'text', 'option1', 'option2', 'option3', 'option4', 'option5', 'correct', 'explanation', 'rule', 'sign', 'image', 'status'];

const esc = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export function toCSV(questions: Question[]): string {
  const rows = questions.map((q) => {
    const opts = [0, 1, 2, 3, 4].map((i) => q.options[i] ?? '');
    return [q.id, q.ticket ?? '', q.topic, q.text, ...opts, q.correct + 1, q.explanation, q.rule ?? '', q.sign ?? '', q.image ?? '', q.status].map(esc).join(',');
  });
  return [CSV_COLUMNS.join(','), ...rows].join('\n');
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  const delim = detectDelimiter(text);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

function detectDelimiter(text: string) {
  const first = text.split(/\r?\n/, 1)[0] ?? '';
  return (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ',';
}

const STATUSES: QuestionStatus[] = ['draft', 'review', 'published', 'archived'];

export function questionsFromCSV(text: string): { questions: Question[]; errors: string[] } {
  const rows = parseCSV(text.replace(/^﻿/, ''));
  if (rows.length === 0) return { questions: [], errors: ["Fayl bo'sh"] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const errors: string[] = [];
  const questions: Question[] = [];
  if (col('text') < 0 || col('option1') < 0 || col('correct') < 0) {
    return { questions: [], errors: ["Sarlavhada kamida 'text', 'option1', 'correct' ustunlari bo'lishi kerak"] };
  }
  rows.slice(1).forEach((r, idx) => {
    const get = (name: string) => (col(name) >= 0 ? (r[col(name)] ?? '').trim() : '');
    const options = [1, 2, 3, 4, 5].map((i) => get('option' + i)).filter(Boolean);
    const correct = Number(get('correct')) - 1;
    const line = idx + 2;
    if (!get('text')) return errors.push(`${line}-qator: savol matni yo'q`);
    if (options.length < 2) return errors.push(`${line}-qator: kamida 2 ta variant kerak`);
    if (!(correct >= 0 && correct < options.length)) return errors.push(`${line}-qator: 'correct' 1..${options.length} oralig'ida bo'lishi kerak`);
    const status = get('status') as QuestionStatus;
    questions.push({
      id: get('id') || 'imp-' + Date.now().toString(36) + '-' + idx,
      ticket: Number(get('ticket')) || undefined,
      topic: get('topic') || 'umumiy',
      text: get('text'),
      options,
      correct,
      explanation: get('explanation'),
      rule: get('rule') || undefined,
      sign: get('sign') || undefined,
      image: get('image') || undefined,
      status: STATUSES.includes(status) ? status : 'draft',
      version: 1,
      updatedAt: new Date().toISOString(),
    });
  });
  return { questions, errors };
}
