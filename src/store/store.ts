import { useSyncExternalStore } from 'react';
import type { Question } from '../data/types';
import { BASE_QUESTIONS } from '../data/questions';
import { DEFAULT_BHM } from '../data/extra';
import { DEFAULT_EXAM, type ExamConfig } from '../lib/exam';
import { applyAnswer, type QStat } from '../lib/srs';

export type Lang = 'uz' | 'uzc' | 'ru';
export type Mode = 'ticket' | 'topic' | 'exam' | 'mistakes' | 'favorites' | 'marathon' | 'review' | 'custom';

export interface Attempt {
  id: string;
  mode: Mode;
  title: string;
  startedAt: number;
  finishedAt: number;
  total: number;
  answered: number;
  correct: number;
  errors: number;
  passed?: boolean;
  answers: { qid: string; chosen: number; correct: boolean; ms: number }[];
}

export interface Report {
  id: string;
  qid: string;
  reason: string;
  comment: string;
  at: number;
  status: 'new' | 'resolved';
}

export interface Settings {
  lang: Lang;
  theme: 'system' | 'light' | 'dark';
  fontScale: number;
  name: string;
  examDate: string;
  dailyGoal: number;
  bhm: number;
  adminPin: string;
  onboarded: boolean;
}

export interface AppState {
  v: 1;
  settings: Settings;
  exam: ExamConfig;
  stats: Record<string, QStat>;
  favorites: string[];
  attempts: Attempt[];
  marathon: { index: number; answers: Record<string, number> };
  activity: Record<string, number>;
  reports: Report[];
  customQuestions: Record<string, Question>;
  versions: Record<string, Question[]>;
}

const KEY = 'avtotest:v1';

export const initialState = (): AppState => ({
  v: 1,
  settings: { lang: 'uz', theme: 'system', fontScale: 1, name: '', examDate: '', dailyGoal: 40, bhm: DEFAULT_BHM, adminPin: '1234', onboarded: false },
  exam: { ...DEFAULT_EXAM },
  stats: {},
  favorites: [],
  attempts: [],
  marathon: { index: 0, answers: {} },
  activity: {},
  reports: [],
  customQuestions: {},
  versions: {},
});

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    const base = initialState();
    return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings }, exam: { ...base.exam, ...parsed.exam } };
  } catch {
    return initialState();
  }
}

let state: AppState = typeof localStorage === 'undefined' ? initialState() : load();
const listeners = new Set<() => void>();

export function getState() { return state; }

export function setState(fn: (s: AppState) => AppState) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* xotira to'lgan yoki taqiqlangan */ }
  listeners.forEach((l) => l());
}

export function replaceState(next: AppState) { setState(() => next); }

function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export const todayKey = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

// ---- Amallar ----

export function recordAnswer(qid: string, isCorrect: boolean) {
  setState((s) => {
    const day = todayKey();
    return {
      ...s,
      stats: { ...s.stats, [qid]: applyAnswer(s.stats[qid], isCorrect) },
      activity: { ...s.activity, [day]: (s.activity[day] ?? 0) + 1 },
    };
  });
}

export function toggleFavorite(qid: string) {
  setState((s) => ({ ...s, favorites: s.favorites.includes(qid) ? s.favorites.filter((x) => x !== qid) : [...s.favorites, qid] }));
}

export function saveAttempt(a: Attempt) {
  setState((s) => ({ ...s, attempts: [...s.attempts, a].slice(-200) }));
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function updateExamConfig(patch: Partial<ExamConfig>) {
  setState((s) => ({ ...s, exam: { ...s.exam, ...patch } }));
}

export function addReport(r: Omit<Report, 'id' | 'at' | 'status'>) {
  setState((s) => ({ ...s, reports: [...s.reports, { ...r, id: 'r' + Date.now().toString(36), at: Date.now(), status: 'new' }] }));
}

export function setReportStatus(id: string, status: Report['status']) {
  setState((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, status } : r)) }));
}

export function saveQuestion(q: Question) {
  setState((s) => {
    const prev = s.customQuestions[q.id] ?? BASE_QUESTIONS.find((b) => b.id === q.id);
    const versions = prev ? { ...s.versions, [q.id]: [...(s.versions[q.id] ?? []), prev].slice(-20) } : s.versions;
    const next = { ...q, version: (prev?.version ?? 0) + 1, updatedAt: new Date().toISOString() };
    return { ...s, customQuestions: { ...s.customQuestions, [q.id]: next }, versions };
  });
}

export function importQuestions(qs: Question[]) {
  setState((s) => {
    const custom = { ...s.customQuestions };
    for (const q of qs) custom[q.id] = q;
    return { ...s, customQuestions: custom };
  });
}

export function setMarathon(m: AppState['marathon']) {
  setState((s) => ({ ...s, marathon: m }));
}

// ---- Hosilalar ----

let cacheKey: unknown = null;
let cacheAll: Question[] = [];
export function allQuestions(s: AppState): Question[] {
  if (cacheKey === s.customQuestions) return cacheAll;
  const map = new Map(BASE_QUESTIONS.map((q) => [q.id, q]));
  for (const q of Object.values(s.customQuestions)) map.set(q.id, q);
  cacheKey = s.customQuestions;
  cacheAll = [...map.values()];
  return cacheAll;
}

export const publishedQuestions = (s: AppState) => allQuestions(s).filter((q) => q.status === 'published');

export function dayStreak(activity: Record<string, number>, now = new Date()): number {
  let n = 0;
  const d = new Date(now);
  if (!activity[todayKey(d)]) d.setDate(d.getDate() - 1);
  while (activity[todayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
