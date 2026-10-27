import { useSyncExternalStore } from 'react';
import type { Question } from '../data/types';
import { BASE_QUESTIONS } from '../data/questions';
import { DEFAULT_BHM } from '../data/extra';
import { DEFAULT_EXAM, type ExamConfig } from '../lib/exam';
import type { FaqItem } from '../lib/chatbot';
import { applyAnswer, type QStat } from '../lib/srs';

export type Lang = 'uz' | 'uzc' | 'ru';
export type Mode = 'ticket' | 'topic' | 'exam' | 'mistakes' | 'favorites' | 'marathon' | 'review' | 'hard' | 'mixed' | 'weak' | 'custom';

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
  /** Test qayta ochilishi uchun manzil (masalan /quiz/ticket/3) */
  path?: string;
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
  /** Umumiy reytingda ko'rinmaslik */
  hideRating?: boolean;
}

export interface AppState {
  v: 1;
  /** Progress oxirgi o'zgargan vaqt (server bilan sinxronlash uchun) */
  updatedAt: number;
  settings: Settings;
  exam: ExamConfig;
  stats: Record<string, QStat>;
  favorites: string[];
  attempts: Attempt[];
  marathon: { index: number; answers: Record<string, number> };
  activity: Record<string, number>;
  /** O'qilgan yo'riqnoma bo'limlari: id -> vaqt */
  rulesRead: Record<string, number>;
  reports: Report[];
  /** Admin tahrirlagan/qo'shgan savollar (serverdan keladi) */
  customQuestions: Record<string, Question>;
  /** Admin tahrirlagan chat-bot javoblari (serverdan keladi) */
  faq: FaqItem[] | null;
  /** Admin tasdiqlagan yo'l belgisi rasmlari: belgi id -> data URL (serverdan keladi) */
  signImages: Record<string, string>;
  versions: Record<string, Question[]>;
}

/** Serverga yuboriladigan (foydalanuvchiga tegishli) maydonlar */
export const PROGRESS_KEYS = ['settings', 'stats', 'favorites', 'attempts', 'marathon', 'activity', 'rulesRead'] as const;

export const initialState = (): AppState => ({
  v: 1,
  updatedAt: 0,
  settings: { lang: 'uz', theme: 'system', fontScale: 1, name: '', examDate: '', dailyGoal: 40, bhm: DEFAULT_BHM },
  exam: { ...DEFAULT_EXAM },
  stats: {},
  favorites: [],
  attempts: [],
  marathon: { index: 0, answers: {} },
  activity: {},
  rulesRead: {},
  reports: [],
  customQuestions: {},
  faq: null,
  signImages: {},
  versions: {},
});

// ---- Sessiya (kim kirgan) ----

export interface SessionUser { id: number; login: string; name: string; role: 'student' | 'teacher' }
export interface Session { token: string; user: SessionUser }

const SESSION_KEY = 'avtotest:session';
const GUEST_KEY = 'avtotest:guest';

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

let session: Session | null = typeof localStorage === 'undefined' ? null : readSession();
let guest = typeof localStorage === 'undefined' ? false : localStorage.getItem(GUEST_KEY) === '1';

const stateKey = () => (session ? `avtotest:v1:u${session.user.id}` : 'avtotest:v1');

function load(): AppState {
  const base = initialState();
  try {
    const raw = localStorage.getItem(stateKey());
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings }, exam: { ...base.exam, ...parsed.exam } };
  } catch {
    return base;
  }
}

let state: AppState = typeof localStorage === 'undefined' ? initialState() : load();
const listeners = new Set<() => void>();
const changeHooks = new Set<(s: AppState) => void>();

function emit() { listeners.forEach((l) => l()); }
function persist() {
  try { localStorage.setItem(stateKey(), JSON.stringify(state)); } catch { /* xotira to'lgan yoki taqiqlangan */ }
}

export function getState() { return state; }

/** Foydalanuvchi progressini o'zgartiradi (updatedAt yangilanadi, server bilan sinxronlanadi). */
export function setState(fn: (s: AppState) => AppState) {
  state = { ...fn(state), updatedAt: Date.now() };
  persist();
  emit();
  changeHooks.forEach((h) => h(state));
}

/** Sinxronlashni qo'zg'atmasdan holatni almashtirish (serverdan kelgan ma'lumot uchun). */
export function setStateQuiet(fn: (s: AppState) => AppState) {
  state = fn(state);
  persist();
  emit();
}

export function onProgressChange(h: (s: AppState) => void) { changeHooks.add(h); return () => changeHooks.delete(h); }

export function replaceState(next: AppState) { setState(() => next); }

function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function getSession() { return session; }
export function isGuest() { return guest; }

/** Parol almashtirilgandan keyin yangi tokenni saqlash (progress qayta yuklanmaydi) */
export function replaceSessionToken(token: string) {
  if (!session) return;
  session = { ...session, token };
  try {
    const store = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* */ }
}

export function setSession(next: Session | null, remember = true) {
  const content = { customQuestions: state.customQuestions, exam: state.exam, faq: state.faq, signImages: state.signImages };
  session = next;
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (next) (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(next));
  } catch { /* */ }
  if (next) setGuest(false);
  // Foydalanuvchi almashganda uning o'z progressini yuklaymiz; umumiy kontent saqlanadi
  state = { ...load(), ...content };
  emit();
}

export function setGuest(v: boolean) {
  guest = v;
  try { v ? localStorage.setItem(GUEST_KEY, '1') : localStorage.removeItem(GUEST_KEY); } catch { /* */ }
  emit();
}

export function useSession() {
  return useSyncExternalStore(subscribe, () => session, () => session);
}
export function useGuest() {
  return useSyncExternalStore(subscribe, () => guest, () => guest);
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

export function markRuleRead(id: string) {
  if (state.rulesRead[id]) return;
  setState((s) => ({ ...s, rulesRead: { ...s.rulesRead, [id]: Date.now() } }));
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function setMarathon(m: AppState['marathon']) {
  setState((s) => ({ ...s, marathon: m }));
}

// Kontent (savollar, imtihon formati) — barcha foydalanuvchilar uchun umumiy, serverdan keladi
export function setContent(customQuestions: Record<string, Question>, exam?: ExamConfig | null, faq?: FaqItem[] | null) {
  setStateQuiet((s) => ({ ...s, customQuestions, exam: exam ? { ...DEFAULT_EXAM, ...exam } : s.exam, faq: faq === undefined ? s.faq : faq }));
}

export function setSignImages(signImages: Record<string, string>) {
  setStateQuiet((s) => ({ ...s, signImages }));
}

export function addLocalReport(r: Omit<Report, 'id' | 'at' | 'status'>) {
  setStateQuiet((s) => ({ ...s, reports: [...s.reports, { ...r, id: 'r' + Date.now().toString(36), at: Date.now(), status: 'new' }] }));
}

export function recordVersion(prev: Question) {
  setStateQuiet((s) => ({ ...s, versions: { ...s.versions, [prev.id]: [...(s.versions[prev.id] ?? []), prev].slice(-20) } }));
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
