// Server bilan aloqa: kirish, progressni sinxronlash, umumiy kontent.
import { Capacitor } from '@capacitor/core';
import type { Question } from '../data/types';
import type { ExamConfig } from '../lib/exam';
import {
  getSession, getState, onProgressChange, PROGRESS_KEYS, setContent, setSession, setStateQuiet,
  type AppState, type Session,
} from './store';

const envBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
/** Veb-versiyada API shu saytning o'zida; Android ilovada VITE_API_URL orqali beriladi. */
export const API_BASE = envBase;
export const apiAvailable = () => !!envBase || !Capacitor.isNativePlatform();

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; auth?: boolean; admin?: boolean } = {}): Promise<T> {
  if (!apiAvailable()) throw new ApiError(0, 'Server manzili sozlanmagan');
  const token = opts.admin ? getAdminToken() : getSession()?.token;
  let r: Response;
  try {
    r = await fetch(`${API_BASE}/api${path}`, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers: {
        'Content-Type': 'application/json',
        ...(opts.auth !== false && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Internetga ulanib bo'lmadi");
  }
  let data: any = null;
  try { data = await r.json(); } catch { /* */ }
  if (!r.ok) {
    if (r.status === 401 && opts.admin) setAdminToken(null);
    else if (r.status === 401 && getSession() && opts.auth !== false) setSession(null);
    throw new ApiError(r.status, data?.error ?? `Server xatosi (${r.status})`);
  }
  return data as T;
}

// ---- Administrator sessiyasi (oddiy foydalanuvchidan alohida, 12 soat) ----

const ADMIN_KEY = 'avtotest:admin';
const adminListeners = new Set<() => void>();
export function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_KEY); } catch { return null; }
}
export function setAdminToken(token: string | null) {
  try { token ? localStorage.setItem(ADMIN_KEY, token) : localStorage.removeItem(ADMIN_KEY); } catch { /* */ }
  adminListeners.forEach((l) => l());
}
export function subscribeAdmin(l: () => void) { adminListeners.add(l); return () => { adminListeners.delete(l); }; }

export async function adminLogin(loginName: string, password: string) {
  const r = await api<{ token: string }>('/auth?action=admin-login', { body: { login: loginName, password }, auth: false });
  setAdminToken(r.token);
}

// ---- Kirish ----

export async function login(loginName: string, password: string, remember: boolean) {
  const r = await api<Session>('/auth?action=login', { body: { login: loginName, password }, auth: false });
  setSession(r, remember);
  await pullProgress();
  return r;
}

export async function register(loginName: string, password: string, name: string, remember: boolean) {
  const local = getState();
  const r = await api<Session>('/auth?action=register', { body: { login: loginName, password, name }, auth: false });
  setSession(r, remember);
  // Mehmon sifatida to'plangan progressni yangi hisobga o'tkazamiz
  const hasGuestProgress = Object.keys(local.stats).length > 0;
  setStateQuiet((s) => ({ ...s, ...(hasGuestProgress ? pickProgress(local) : {}), settings: { ...s.settings, ...local.settings, name } , updatedAt: Date.now() }));
  await pushProgress();
  return r;
}

export function logout() {
  setSession(null);
}

export async function refreshMe() {
  if (!getSession()) return;
  try {
    const r = await api<{ user: Session['user'] }>('/auth?action=me');
    const s = getSession();
    if (s) setSession({ ...s, user: r.user }, !!localStorage.getItem('avtotest:session'));
  } catch { /* internet yo'q — saqlangan sessiya bilan davom etamiz */ }
}

// ---- Progress sinxronlash ----

function pickProgress(s: AppState) {
  const out: Partial<AppState> = {};
  for (const k of PROGRESS_KEYS) (out as any)[k] = s[k];
  return out;
}

export async function pullProgress() {
  if (!getSession()) return;
  const r = await api<{ state: Partial<AppState> | null; updatedAt: number }>('/progress');
  const local = getState();
  if (r.state && (r.state.updatedAt ?? r.updatedAt) > local.updatedAt) {
    setStateQuiet((s) => ({ ...s, ...r.state, settings: { ...s.settings, ...r.state!.settings }, updatedAt: r.state!.updatedAt ?? r.updatedAt }));
  } else if (local.updatedAt > 0) {
    await pushProgress();
  }
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushing = false;

export async function pushProgress() {
  if (!getSession() || pushing) return;
  pushing = true;
  try {
    const s = getState();
    await api('/progress', { method: 'PUT', body: { state: { ...pickProgress(s), v: 1, updatedAt: s.updatedAt } } });
  } catch { /* keyingi o'zgarishda yana urinamiz */ } finally {
    pushing = false;
  }
}

export function startSync() {
  onProgressChange(() => {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushProgress, 2500);
  });
  window.addEventListener('online', () => { pushProgress(); loadContent(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pushProgress(); });
}

// ---- Umumiy kontent ----

export async function loadContent() {
  try {
    const r = await api<{ questions: Record<string, Question>; exam: ExamConfig | null }>('/content', { auth: false });
    setContent(r.questions ?? {}, r.exam);
  } catch { /* oflayn — saqlangan kontent bilan ishlaymiz */ }
}

export async function saveContentQuestions(questions: Record<string, Question>) {
  await api('/content?action=questions', { method: 'PUT', body: { questions }, admin: true });
  setContent(questions);
}

export async function saveExamConfig(exam: ExamConfig) {
  await api('/content?action=exam', { method: 'PUT', body: { exam }, admin: true });
  setContent(getState().customQuestions, exam);
}

export async function sendReport(r: { qid: string; reason: string; comment: string }) {
  await api('/content?action=report', { body: r });
}
