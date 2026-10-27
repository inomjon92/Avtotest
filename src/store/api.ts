// Server bilan aloqa: kirish, progressni sinxronlash, umumiy kontent.
import { Capacitor } from '@capacitor/core';
import type { Question } from '../data/types';
import type { ExamConfig } from '../lib/exam';
import type { FaqItem } from '../lib/chatbot';
import { differs, mergeProgress } from '../lib/merge';
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

/** Serverdagi progressni olib, mahalliy (shu jumladan oflayn yechilgan) natijalar bilan birlashtiradi va qaytaradi. */
export async function pullProgress() {
  if (!getSession()) return;
  const r = await api<{ state: Partial<AppState> | null; updatedAt: number }>('/progress');
  const local = getState();
  const remote = r.state ? { ...r.state, updatedAt: r.state.updatedAt ?? r.updatedAt } : null;
  if (!remote) {
    if (local.updatedAt > 0) await pushProgress();
    return;
  }
  const merged = mergeProgress(local, remote);
  setStateQuiet((s) => ({ ...s, ...merged }));
  // Mahalliyda serverda yo'q natijalar bo'lsa, serverga yuboramiz
  if (differs(merged, remote)) await pushProgress();
  else lastPushed = merged.updatedAt;
}

let syncing: Promise<void> | null = null;
/** Internet qaytganda yoki ilova ochilganda: olish + birlashtirish + yuborish */
export function syncNow() {
  if (!getSession()) return Promise.resolve();
  syncing ??= pullProgress().catch(() => {}).finally(() => { syncing = null; });
  return syncing;
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushing = false;
let lastPushed = 0;

export async function pushProgress() {
  if (!getSession() || pushing) return;
  pushing = true;
  try {
    const s = getState();
    await api('/progress', { method: 'PUT', body: { state: { ...pickProgress(s), v: 1, updatedAt: s.updatedAt } } });
    lastPushed = s.updatedAt;
  } catch { /* keyingi o'zgarishda yana urinamiz */ } finally {
    pushing = false;
  }
}

export function startSync() {
  onProgressChange(() => {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushProgress, 2500);
  });
  window.addEventListener('online', () => { syncNow(); loadContent(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pushProgress(); else { refreshMe(); syncNow(); } });
  // Oflayn paytda yuborilmay qolgan natijalarni vaqti-vaqti bilan qayta urinib ko'ramiz
  setInterval(() => { if (navigator.onLine && getState().updatedAt > lastPushed) syncNow(); }, 60_000);
}

// ---- Umumiy kontent ----

/** Serverdagi (eng yangi) ilova versiyasi; Android ilova eski bo'lsa, yangilashni taklif qilamiz */
let serverBuild = '';
const buildListeners = new Set<() => void>();
export const getServerBuild = () => serverBuild;
export function subscribeBuild(l: () => void) { buildListeners.add(l); return () => { buildListeners.delete(l); }; }
export const APK_URL = 'https://github.com/inomjon92/Avtotest/releases/download/apk-latest/avtotest.apk';

export async function loadContent() {
  try {
    const r = await api<{ questions: Record<string, Question>; exam: ExamConfig | null; faq: FaqItem[] | null; build?: string }>('/content', { auth: false });
    setContent(r.questions ?? {}, r.exam, r.faq ?? null);
    serverBuild = r.build ?? '';
    buildListeners.forEach((l) => l());
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

export async function sendReport(r: { qid: string; reason: string; comment: string; image?: string; proposal?: { text: string; options: string[]; correct: number; explanation: string } }) {
  await api('/content?action=report', { body: r });
}

export async function saveFaq(faq: FaqItem[]) {
  await api('/content?action=faq', { method: 'PUT', body: { faq }, admin: true });
  setContent(getState().customQuestions, null, faq);
}

// ---- Foydalanuvchi hissasi: savol yuborish va adminga savol ----

export interface SubmittedQuestion { text: string; options: string[]; correct: number; topic: string; explanation: string; image?: string }
export interface Submission { id: number; question: SubmittedQuestion; status: 'pending' | 'approved' | 'rejected'; note: string; created_at: string; reviewed_at: string | null }
export interface ChatMessage { id: number; text: string; answer: string | null; created_at: string; answered_at: string | null; seen?: boolean }

export const submitQuestion = (question: SubmittedQuestion) => api<{ ok: true; id: number }>('/community?action=submit', { body: { question } });
export const mySubmissions = () => api<{ submissions: Submission[] }>('/community?action=submissions').then((r) => r.submissions);
export const askAdmin = (text: string) => api<{ ok: true }>('/community?action=ask', { body: { text } });
export const myMessages = () => api<{ messages: ChatMessage[] }>('/community?action=messages').then((r) => r.messages);
export const unreadCount = () => api<{ unread: number }>('/community?action=unread').then((r) => r.unread);

// ---- Reyting va avtomaktab ----

export interface RatingRow { place: number; name: string; score: number; mastered: number; accuracy: number; examsPassed: number; streak: number; me: boolean }
export interface Rating { top: RatingRow[]; me: RatingRow | null; total: number }
export interface MemberSummary {
  id: number; login: string; name: string; lastSeen: string | null; joinedAt?: string; syncedAt?: string | null;
  answers: number; accuracy: number; mastered: number; seen: number; exams: number; examsPassed: number; rulesRead: number;
  examDate: string | null; weekAnswers: number; weekPassed: number; streak: number; score: number;
  lastExam: { correct: number; total: number; passed?: boolean; finishedAt: number } | null;
}
export interface SchoolGroup { id: number; name: string; code: string; members: number; created_at: string }
export interface JoinedGroup { id: number; name: string; teacher: string; joined_at: string }

export const getRating = (period: 'week' | 'all', group?: number) => api<Rating>(`/school?action=rating&period=${period}${group ? `&group=${group}` : ''}`);
export const mySchool = () => api<{ role: string; joined: JoinedGroup[]; groups: SchoolGroup[] }>('/school?action=mine');
export const joinGroup = (code: string) => api<{ group: { id: number; name: string } }>('/school?action=join', { body: { code } });
export const leaveGroup = (id: number) => api('/school?action=leave', { body: { id } });
export const createGroup = (name: string) => api<{ group: SchoolGroup }>('/school?action=create', { body: { name } });
export const updateGroup = (id: number, patch: { name?: string; newCode?: boolean }) => api<{ code?: string }>('/school?action=update', { body: { id, ...patch } });
export const deleteGroup = (id: number) => api('/school?action=delete', { body: { id } });
export const kickMember = (id: number, user: number) => api('/school?action=kick', { body: { id, user } });
export const groupDetail = (id: number) => api<{ group: { id: number; name: string; code: string }; members: MemberSummary[] }>(`/school?action=group&id=${id}`);
export const memberDetail = (id: number, user: number) => api<{
  member: MemberSummary; stats: Record<string, import('../lib/srs').QStat>; activity: Record<string, number>;
  attempts: { title: string; mode: string; correct: number; total: number; passed?: boolean; finishedAt: number }[];
}>(`/school?action=member&id=${id}&user=${user}`);
