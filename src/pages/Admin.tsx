import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Empty, Modal, PageHeader } from '../components/ui';
import { RoadSign } from '../components/RoadSign';
import type { Question, QuestionStatus } from '../data/types';
import { TOPICS, topicById } from '../data/topics';
import { RULES } from '../data/rules';
import { SIGNS, signById } from '../data/signs';
import { questionsFromCSV, toCSV } from '../lib/csv';
import type { ExamConfig } from '../lib/exam';
import { allQuestions, getState, recordVersion, useStore } from '../store/store';
import { adminLogin, api, getAdminToken, saveContentQuestions, saveExamConfig, setAdminToken, subscribeAdmin } from '../store/api';
import { QuestionMedia } from './Quiz';
import { download } from './Settings';
import { resizeImage } from '../lib/image';
import Gallery from './Gallery';
import { DEFAULT_FAQ, type FaqItem } from '../lib/chatbot';
import { loadContent, saveFaq } from '../store/api';

const NO_VERSIONS: Question[] = [];
const STATUS_LABEL: Record<QuestionStatus, string> = { draft: 'Qoralama', review: 'Tekshiruvda', published: 'Nashr qilingan', archived: 'Arxiv' };
type Tab = 'overview' | 'users' | 'activity' | 'logins' | 'questions' | 'submissions' | 'reports' | 'chatbot' | 'gallery' | 'import' | 'stats' | 'exam' | 'security';

const TABS: [Tab, string][] = [
  ['overview', 'Umumiy'], ['users', 'Foydalanuvchilar'], ['activity', 'Eng faollar'], ['logins', 'Kirishlar tarixi'], ['questions', 'Savollar'],
  ['submissions', 'Yuborilgan savollar'], ['reports', 'Xato xabarlari'], ['chatbot', 'Chat-bot'], ['gallery', 'Rasmlar'],
  ['import', 'Import / eksport'], ['stats', 'Savol statistikasi'], ['exam', 'Imtihon formati'], ['security', 'Admin kirishlari'],
];
const KIND_LABEL: Record<string, string> = { register: "Ro'yxatdan o'tdi", login: 'Kirdi (parol bilan)', open: 'Ilovani ochdi' };

const fmtDate = (v?: string | number | null) => (v ? new Date(v).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

function ago(v?: string | null) {
  if (!v) return 'hech qachon';
  const m = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (m < 2) return 'hozir';
  if (m < 60) return `${m} daqiqa oldin`;
  if (m < 60 * 24) return `${Math.round(m / 60)} soat oldin`;
  return `${Math.round(m / 1440)} kun oldin`;
}

/** User-Agent dan qurilma va brauzerni aniqlash (masalan "Android 13 · SM-A515F · ilova") */
export function device(agent: string) {
  if (!agent) return '—';
  const android = agent.match(/Android ([\d.]+)(?:;[^;)]*)*?;\s*([^;)]+?)(?:\s+Build[^;)]*)?\)/);
  if (android) {
    const model = android[2] && !/^(K|wv|Mobile)$/i.test(android[2].trim()) ? ' · ' + android[2].trim() : '';
    return `Android ${android[1]}${model}${/; wv\)/.test(agent) ? ' · ilova' : ''}`;
  }
  const ios = agent.match(/(iPhone|iPad).*?OS ([\d_]+)/);
  if (ios) return `${ios[1]} iOS ${ios[2].replace(/_/g, '.')}`;
  const os = /Windows NT 10/.test(agent) ? 'Windows 10/11' : /Windows/.test(agent) ? 'Windows' : /Mac OS X/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : 'Boshqa';
  const br = /Edg\//.test(agent) ? 'Edge' : /OPR\//.test(agent) ? 'Opera' : /YaBrowser/.test(agent) ? 'Yandex' : /Chrome\//.test(agent) ? 'Chrome' : /Firefox\//.test(agent) ? 'Firefox' : /Safari\//.test(agent) ? 'Safari' : '';
  return br ? `${os} · ${br}` : os;
}

/** Server so'rovini yuklash va xatoni ko'rsatish uchun kichik yordamchi */
function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    setError('');
    api<T>(path, { admin: true }).then(setData).catch((e) => setError(e.message));
  }, [path]);
  useEffect(reload, [reload]);
  return { data, error, reload };
}

function AdminLoginForm() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="page">
      <PageHeader title="Administrator kirishi" />
      <form className="panel form" onSubmit={async (e) => {
        e.preventDefault(); setError(''); setBusy(true);
        try { await adminLogin(login, password); } catch (err) { setError(err instanceof Error ? err.message : 'Xatolik'); } finally { setBusy(false); }
      }}>
        <p className="muted small">Administrator login va paroli oddiy foydalanuvchilarnikidan alohida. Sessiya 12 soat amal qiladi.</p>
        <label>Admin login<input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoCapitalize="none" required /></label>
        <label>Parol<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="bad-text small">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? '…' : 'Kirish'}</button>
      </form>
    </div>
  );
}

export default function Admin() {
  const token = useSyncExternalStore(subscribeAdmin, getAdminToken, getAdminToken);
  const [tab, setTab] = useState<Tab>('overview');
  const [counts, setCounts] = useState<Overview['counts'] | null>(null);
  // Yangi xabarlar sonini (belgilar) har daqiqada yangilab turamiz
  const refreshCounts = useCallback(() => { if (getAdminToken()) api<Overview>('/admin?action=overview', { admin: true }).then((r) => setCounts(r.counts)).catch(() => {}); }, []);
  useEffect(() => {
    if (!token) return;
    refreshCounts();
    const id = setInterval(refreshCounts, 60_000);
    return () => clearInterval(id);
  }, [token, refreshCounts]);
  useEffect(refreshCounts, [tab, refreshCounts]);

  if (!token) return <AdminLoginForm />;
  const badge: Partial<Record<Tab, number>> = { reports: counts?.reports_new, submissions: counts?.submissions_pending, chatbot: counts?.messages_new };

  return (
    <div className="page wide">
      <PageHeader title="Admin panel" back={false} right={<button className="btn ghost small" onClick={() => setAdminToken(null)}>Chiqish</button>} />
      <div className="chips">
        {TABS.map(([id, l]) => (
          <button key={id} className={'chip ' + (tab === id ? 'active' : '')} onClick={() => setTab(id)}>
            {l}{!!badge[id] && <span className="badge tab-badge">{badge[id]}</span>}
          </button>
        ))}
      </div>
      {tab === 'overview' && <OverviewTab go={setTab} />}
      {tab === 'users' && <UsersTab />}
      {tab === 'activity' && <ActivityTab />}
      {tab === 'logins' && <LoginsTab />}
      {tab === 'questions' && <QuestionsTab />}
      {tab === 'submissions' && <SubmissionsTab onChange={refreshCounts} />}
      {tab === 'reports' && <ReportsTab onChange={refreshCounts} />}
      {tab === 'chatbot' && <ChatbotTab onChange={refreshCounts} />}
      {tab === 'gallery' && <Gallery />}
      {tab === 'import' && <ImportTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'exam' && <ExamTab />}
      {tab === 'security' && <SecurityTab />}
    </div>
  );
}

// ---------- Umumiy ----------

interface Overview {
  counts: { users: number; active_day: number; active_week: number; new_week: number; logins_day: number; reports_new: number; submissions_pending: number; messages_new: number };
  questions: Record<string, { correct: number; wrong: number; users: number }>;
}

function OverviewTab({ go }: { go: (t: Tab) => void }) {
  const { data, error } = useApi<Overview>('/admin?action=overview');
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;
  const c = data.counts;
  const answers = Object.values(data.questions).reduce((n, x) => n + x.correct + x.wrong, 0);
  return (
    <>
      <div className="stat-tiles">
        <button className="tile" onClick={() => go('users')}><span>Foydalanuvchilar</span><b>{c.users}</b></button>
        <button className="tile" onClick={() => go('users')}><span>Bugun faol</span><b>{c.active_day}</b></button>
        <button className="tile" onClick={() => go('users')}><span>7 kunda faol</span><b>{c.active_week}</b></button>
        <button className="tile" onClick={() => go('users')}><span>7 kunda yangi</span><b>{c.new_week}</b></button>
        <button className="tile" onClick={() => go('logins')}><span>Bugungi kirishlar</span><b>{c.logins_day}</b></button>
        <button className="tile" onClick={() => go('reports')}><span>Yangi xato xabarlari</span><b className={c.reports_new ? 'bad-text' : ''}>{c.reports_new}</b></button>
        <button className="tile" onClick={() => go('submissions')}><span>Tekshiruvdagi savollar</span><b className={c.submissions_pending ? 'bad-text' : ''}>{c.submissions_pending}</b></button>
        <button className="tile" onClick={() => go('chatbot')}><span>Javobsiz chat savollari</span><b className={c.messages_new ? 'bad-text' : ''}>{c.messages_new}</b></button>
        <button className="tile" onClick={() => go('activity')}><span>Eng faol foydalanuvchilar</span><b>→</b></button>
      </div>
      <p className="muted small">Jami berilgan javoblar: {answers}. Ma'lumotlar foydalanuvchilar ilovani ochganda va javob berganda yangilanadi.</p>
    </>
  );
}

// ---------- Foydalanuvchilar ----------

interface AdminUser {
  id: number; login: string; name: string; role: string; blocked: boolean; createdAt: string; lastSeen: string | null; loginCount: number; ip: string; agent: string;
  answers: number; accuracy: number; mastered: number; seen: number; exams: number; examsPassed: number; rulesRead: number; examDate: string | null;
}

function UsersTab() {
  const { data, error, reload } = useApi<{ users: AdminUser[] }>('/admin?action=users');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const total = useStore((s) => allQuestions(s).filter((x) => x.status === 'published').length);
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;
  const list = data.users.filter((u) => !q || (u.login + ' ' + u.name).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="row-wrap">
        <input className="search grow" type="search" placeholder="🔍 Ism yoki login" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn ghost" onClick={reload}>↻ Yangilash</button>
        <button className="btn ghost" onClick={() => download('foydalanuvchilar.csv', '﻿' + usersCsv(data.users), 'text/csv')}>⬇ CSV</button>
      </div>
      <p className="muted small">{list.length} ta foydalanuvchi · oxirgi faollik bo'yicha tartiblangan</p>
      <table className="table">
        <thead><tr><th>Foydalanuvchi</th><th>Oxirgi kirish</th><th>IP / qurilma</th><th>Kirishlar</th><th>Progress</th><th>Imtihon</th></tr></thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.id} className="clickable" onClick={() => setOpen(u.id)}>
              <td><b>{u.name || '—'}</b>{u.blocked && <span className="status"> bloklangan</span>}<br /><span className="muted small">@{u.login}</span></td>
              <td className="nowrap">{ago(u.lastSeen)}<br /><span className="muted small">{fmtDate(u.lastSeen)}</span></td>
              <td><span className="mono small">{u.ip || '—'}</span><br /><span className="muted small">{device(u.agent)}</span></td>
              <td>{u.loginCount}</td>
              <td className="nowrap">{total ? Math.round((u.mastered / total) * 100) : 0}%<br /><span className="muted small">{u.answers} javob · {u.accuracy}% aniq</span></td>
              <td className="nowrap">{u.examsPassed}/{u.exams}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {open !== null && <UserModal id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </>
  );
}

function usersCsv(users: AdminUser[]) {
  const head = ['login', 'ism', "ro'yxatdan o'tgan", 'oxirgi kirish', 'IP', 'qurilma', 'kirishlar', 'javoblar', 'aniqlik %', "o'zlashtirilgan", 'imtihonlar', "o'tgan imtihonlar", "o'qilgan bo'limlar", 'bloklangan'];
  const rows = users.map((u) => [u.login, u.name, fmtDate(u.createdAt), fmtDate(u.lastSeen), u.ip, device(u.agent), u.loginCount, u.answers, u.accuracy, u.mastered, u.exams, u.examsPassed, u.rulesRead, u.blocked ? 'ha' : "yo'q"]);
  return [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
}

interface UserDetail {
  user: AdminUser;
  attempts: { title: string; mode: string; correct: number; total: number; passed?: boolean; finishedAt: number }[];
  rulesRead: Record<string, number>;
  logins: { at: string; kind: string; agent: string; ip: string }[];
}

function UserModal({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const { data, error, reload } = useApi<UserDetail>(`/admin?action=user&id=${id}`);
  const act = async (action: string, body: object, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    try { await api(`/admin?action=${action}`, { body: { id, ...body }, admin: true }); onChanged(); action === 'delete-user' ? onClose() : reload(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
  };
  return (
    <Modal open onClose={onClose} title={data ? `${data.user.name} (@${data.user.login})` : 'Foydalanuvchi'}>
      {error && <p className="bad-text">{error}</p>}
      {!data ? <p className="muted">Yuklanmoqda…</p> : (
        <div className="form">
          <div className="stat-tiles">
            <div className="tile"><span>Ro'yxatdan o'tgan</span><b className="small">{fmtDate(data.user.createdAt)}</b></div>
            <div className="tile"><span>Oxirgi faollik</span><b className="small">{ago(data.user.lastSeen)}</b></div>
            <div className="tile"><span>Javoblar / aniqlik</span><b>{data.user.answers} · {data.user.accuracy}%</b></div>
            <div className="tile"><span>O'qilgan bo'limlar</span><b>{data.user.rulesRead} / {RULES.length}</b></div>
          </div>
          <p className="small">Oxirgi IP: <span className="mono">{data.user.ip || '—'}</span> · Qurilma: <b>{device(data.user.agent)}</b> · Kirishlar soni: {data.user.loginCount}</p>
          {data.user.examDate && <p className="small">Imtihon sanasi: <b>{data.user.examDate}</b></p>}

          <h4>Oxirgi testlar</h4>
          {data.attempts.length === 0 ? <p className="muted small">Hali test ishlamagan</p> : (
            <table className="table small">
              <thead><tr><th>Test</th><th>Natija</th><th>Sana</th></tr></thead>
              <tbody>{data.attempts.map((a, i) => (
                <tr key={i}><td>{a.title}</td><td className={a.passed === false ? 'bad-text' : a.passed ? 'good-text' : ''}>{a.correct}/{a.total}{a.passed !== undefined && (a.passed ? " ✓" : ' ✗')}</td><td className="nowrap">{fmtDate(a.finishedAt)}</td></tr>
              ))}</tbody>
            </table>
          )}

          <h4>O'qilgan bo'limlar</h4>
          <ul className="plain small">
            {RULES.filter((r) => data.rulesRead[r.id]).map((r) => <li key={r.id}>✓ {r.chapter} — {r.title}</li>)}
            {Object.keys(data.rulesRead).length === 0 && <li className="muted">Hali yo'q</li>}
          </ul>

          <h4>Kirishlar tarixi</h4>
          <ul className="plain small">
            {data.logins.map((l, i) => <li key={i}>{fmtDate(l.at)} · {(KIND_LABEL[l.kind] ?? l.kind).toLowerCase()} · <span className="mono">{l.ip || '—'}</span> · {device(l.agent)}</li>)}
          </ul>

          <div className="row-wrap">
            <button className="btn ghost small" onClick={() => act('update-user', { blocked: !data.user.blocked }, data.user.blocked ? undefined : 'Foydalanuvchi bloklansinmi? U ilovaga kira olmaydi.')}>{data.user.blocked ? 'Blokdan chiqarish' : 'Bloklash'}</button>
            <button className="btn danger small" onClick={() => act('delete-user', {}, "Foydalanuvchi va uning barcha natijalari o'chiriladi. Davom etasizmi?")}>O'chirish</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------- Kirishlar ----------

function LoginsTab() {
  const { data, error, reload } = useApi<{ logins: { id: number; at: string; kind: string; agent: string; ip: string; login: string; name: string }[] }>('/admin?action=logins');
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;
  return (
    <>
      <div className="row-wrap"><span className="muted small grow">Oxirgi {data.logins.length} ta kirish</span><button className="btn ghost" onClick={reload}>↻ Yangilash</button></div>
      {data.logins.length === 0 ? <Empty>Hali hech kim kirmagan</Empty> : (
        <table className="table">
          <thead><tr><th>Vaqt</th><th>Foydalanuvchi</th><th>Amal</th><th>IP</th><th>Qurilma</th></tr></thead>
          <tbody>{data.logins.map((l) => (
            <tr key={l.id}><td className="nowrap">{fmtDate(l.at)}</td><td>{l.name}<br /><span className="muted small">@{l.login}</span></td><td>{KIND_LABEL[l.kind] ?? l.kind}</td><td className="mono small">{l.ip || '—'}</td><td className="small">{device(l.agent)}</td></tr>
          ))}</tbody>
        </table>
      )}
    </>
  );
}

// ---------- Savollar ----------

async function persistQuestion(q: Question) {
  const s = getState();
  const prev = s.customQuestions[q.id] ?? allQuestions(s).find((x) => x.id === q.id);
  if (prev) recordVersion(prev);
  const next = { ...q, version: (prev?.version ?? 0) + 1, updatedAt: new Date().toISOString() };
  await saveContentQuestions({ ...s.customQuestions, [q.id]: next });
}

function QuestionsTab() {
  const s = useStore((x) => x);
  const all = allQuestions(s);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<QuestionStatus | ''>('');
  const [topic, setTopic] = useState('');
  const [edit, setEdit] = useState<Question | null>(null);
  const list = all.filter((x) => (!status || x.status === status) && (!topic || x.topic === topic) && (!q || (x.id + ' ' + x.text).toLowerCase().includes(q.toLowerCase())));
  const blank = (): Question => ({ id: 'n' + Date.now().toString(36), topic: TOPICS[0].id, text: '', options: ['', ''], correct: 0, explanation: '', status: 'draft', version: 0, difficulty: 2 });
  return (
    <>
      <div className="row-wrap">
        <input className="search grow" type="search" placeholder="🔍 Qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as QuestionStatus | '')}><option value="">Barcha holatlar</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">Barcha mavzular</option>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <button className="btn" onClick={() => setEdit(blank())}>+ Yangi savol</button>
      </div>
      <p className="muted small">{list.length} ta savol · o'zgarishlar serverga saqlanadi va barcha foydalanuvchilarga ko'rinadi (faqat "Nashr qilingan" holatidagilar)</p>
      <table className="table">
        <thead><tr><th>ID</th><th>Savol</th><th>Mavzu</th><th>Holat</th><th>v</th></tr></thead>
        <tbody>
          {list.map((x) => (
            <tr key={x.id} className="clickable" onClick={() => setEdit(x)}>
              <td className="nowrap">{x.id}{(x.scene || x.image) && ' 🖼'}</td><td>{x.text}</td><td>{topicById(x.topic)?.name ?? x.topic}</td>
              <td><span className={'status ' + x.status}>{STATUS_LABEL[x.status]}</span></td><td>{x.version}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <QuestionEditor initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function QuestionEditor({ initial, onClose, onSaved }: { initial: Question; onClose: () => void; onSaved?: () => void }) {
  const versions = useStore((s) => s.versions[initial.id] ?? NO_VERSIONS);
  const [q, setQ] = useState<Question>({ ...initial, options: [...initial.options] });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Question>) => setQ((p) => ({ ...p, ...patch }));
  const sign = signById(q.sign);
  const save = async (status?: QuestionStatus) => {
    const opts = q.options.map((o) => o.trim());
    if (!q.text.trim()) return setErr('Savol matnini kiriting');
    if (opts.filter(Boolean).length < 2 || opts.some((o) => !o)) return setErr("Kamida 2 ta to'ldirilgan variant kerak (bo'shlarini o'chiring)");
    setBusy(true);
    try { await persistQuestion({ ...q, options: opts, status: status ?? q.status }); onSaved?.(); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Saqlab bo\'lmadi'); }
    finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={initial.version ? `Tahrirlash: ${initial.id}` : 'Yangi savol'}>
      <div className="form">
        {(q.image || q.scene || q.art || sign) && <div className="zoom"><QuestionMedia q={q} size={150} /></div>}
        <div className="row-wrap">
          <button type="button" className="btn ghost small" onClick={() => fileRef.current?.click()}>🖼 Rasm yuklash</button>
          {q.image && <button type="button" className="btn ghost small" onClick={() => set({ image: undefined })}>Rasmni olib tashlash</button>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = '';
            if (!f) return;
            try { set({ image: await resizeImage(f) }); } catch (er) { setErr(er instanceof Error ? er.message : 'Xatolik'); }
          }} />
        </div>
        <label>Savol matni<textarea rows={3} value={q.text} onChange={(e) => set({ text: e.target.value })} /></label>
        <fieldset>
          <legend>Variantlar (to'g'risini belgilang)</legend>
          {q.options.map((o, i) => (
            <div key={i} className="opt-edit">
              <input type="radio" name="correct" checked={q.correct === i} onChange={() => set({ correct: i })} aria-label="To'g'ri javob" />
              <input value={o} onChange={(e) => { const opts = [...q.options]; opts[i] = e.target.value; set({ options: opts }); }} placeholder={`Variant ${i + 1}`} />
              {q.options.length > 2 && <button type="button" className="icon-btn" onClick={() => { const opts = q.options.filter((_, k) => k !== i); set({ options: opts, correct: q.correct === i ? 0 : q.correct > i ? q.correct - 1 : q.correct }); }}>✕</button>}
            </div>
          ))}
          {q.options.length < 5 && <button type="button" className="btn ghost small" onClick={() => set({ options: [...q.options, ''] })}>+ Variant</button>}
        </fieldset>
        <label>Izoh<textarea rows={3} value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} /></label>
        <div className="row-wrap">
          <label className="grow">Mavzu<select value={q.topic} onChange={(e) => set({ topic: e.target.value })}>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="grow">Bilet raqami<input type="number" min={1} value={q.ticket ?? ''} onChange={(e) => set({ ticket: Number(e.target.value) || undefined })} placeholder="avto" /></label>
          <label className="grow">Qiyinlik<select value={q.difficulty ?? 1} onChange={(e) => set({ difficulty: Number(e.target.value) as 1 | 2 | 3 })}><option value={1}>Oson</option><option value={2}>O'rta</option><option value={3}>Qiyin</option></select></label>
        </div>
        <label>YHQ bandi<select value={q.rule ?? ''} onChange={(e) => set({ rule: e.target.value || undefined })}><option value="">—</option>{RULES.map((r) => <option key={r.id} value={r.id}>{r.chapter} · {r.title}</option>)}</select></label>
        <div className="row-wrap">
          <label className="grow">Yo'l belgisi<select value={q.sign ?? ''} onChange={(e) => set({ sign: e.target.value || undefined })}><option value="">—</option>{SIGNS.map((x) => <option key={x.id} value={x.id}>{x.code} {x.name}</option>)}</select></label>
          {sign && <RoadSign sign={sign} size={56} />}
        </div>
        <label>Holat<select value={q.status} onChange={(e) => set({ status: e.target.value as QuestionStatus })}>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        {err && <p className="bad-text small">{err}</p>}
        <div className="row-end">
          <button className="btn ghost" onClick={onClose}>Bekor qilish</button>
          <button className="btn ghost" disabled={busy} onClick={() => save('review')}>Tekshiruvga</button>
          <button className="btn" disabled={busy} onClick={() => save()}>{busy ? '…' : 'Saqlash'}</button>
        </div>
        {versions.length > 0 && (
          <details>
            <summary>Versiyalar tarixi ({versions.length})</summary>
            <ul className="plain small">
              {[...versions].reverse().map((v, i) => (
                <li key={i}>v{v.version} · {STATUS_LABEL[v.status]} · {v.updatedAt ? new Date(v.updatedAt).toLocaleString() : 'asl nusxa'}
                  <button className="btn ghost small" onClick={() => setQ({ ...v, options: [...v.options] })}>Tiklash</button></li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Modal>
  );
}

// ---------- Import ----------

function ImportTab() {
  const s = useStore((x) => x);
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (f: File) => {
    const { questions, errors } = questionsFromCSV(await f.text());
    setBusy(true);
    try {
      if (questions.length) {
        const merged = { ...getState().customQuestions };
        for (const q of questions) merged[q.id] = q;
        await saveContentQuestions(merged);
      }
      setResult({ ok: questions.length, errors });
    } catch (e) {
      setResult({ ok: 0, errors: [e instanceof Error ? e.message : 'Saqlab bo\'lmadi'] });
    } finally { setBusy(false); }
  };
  return (
    <section className="panel">
      <h3>CSV import / eksport</h3>
      <p className="muted small">Excel'dan "CSV UTF-8" sifatida saqlang. Ustunlar: id, ticket, topic, text, option1…option5, correct (1 dan boshlab), explanation, rule, sign, image, status (draft/review/published/archived). Bir xil id li savol yangilanadi.</p>
      <div className="row-wrap">
        <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? 'Saqlanmoqda…' : '⬆ CSV import'}</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ''; }} />
        <button className="btn ghost" onClick={() => download('avtotest-savollar.csv', '﻿' + toCSV(allQuestions(s)), 'text/csv')}>⬇ Barcha savollarni eksport</button>
        <button className="btn ghost" onClick={() => download('shablon.csv', '﻿' + toCSV([]), 'text/csv')}>⬇ Bo'sh shablon</button>
      </div>
      {result && (
        <div className="notice small">
          <p>{result.ok} ta savol import qilindi (holati CSV dagi kabi; ko'rsatilmagan bo'lsa — qoralama).</p>
          {result.errors.length > 0 && <ul className="plain">{result.errors.slice(0, 20).map((e) => <li key={e} className="bad-text">{e}</li>)}</ul>}
        </div>
      )}
    </section>
  );
}

// ---------- Statistika ----------

function StatsTab() {
  const s = useStore((x) => x);
  const { data, error } = useApi<Overview>('/admin?action=overview');
  const rows = useMemo(() => {
    if (!data) return [];
    const byId = new Map(allQuestions(s).map((q) => [q.id, q]));
    return Object.entries(data.questions)
      .map(([id, st]) => ({ q: byId.get(id), id, ...st, rate: st.wrong / Math.max(1, st.correct + st.wrong) }))
      .filter((r) => r.q)
      .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong);
  }, [data, s]);
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;
  if (!rows.length) return <Empty>Hali javoblar yo'q. Statistika foydalanuvchilar javob bergandan keyin to'planadi.</Empty>;
  return (
    <>
      <p className="muted small">Barcha foydalanuvchilar bo'yicha. Xato foizi yuqori savollarning izohini yaxshilash tavsiya etiladi.</p>
      <table className="table">
        <thead><tr><th>Savol</th><th>Foydalanuvchi</th><th>Javob</th><th>Xato %</th></tr></thead>
        <tbody>{rows.slice(0, 60).map((r) => (
          <tr key={r.id}><td>{r.q!.text}</td><td>{r.users}</td><td>{r.correct + r.wrong}</td><td className={r.rate > 0.5 ? 'bad-text' : ''}>{Math.round(r.rate * 100)}%</td></tr>
        ))}</tbody>
      </table>
    </>
  );
}

// ---------- Xato xabarlari ----------

function ReportsTab({ onChange }: { onChange: () => void }) {
  const s = useStore((x) => x);
  const { data, error, reload } = useApi<{ reports: { id: number; qid: string; reason: string; comment: string; status: string; at: string; login: string | null }[] }>('/admin?action=reports');
  const [filter, setFilter] = useState<'new' | 'resolved' | ''>('new');
  const [fix, setFix] = useState<{ q: Question; report: number } | null>(null);
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;
  const byId = new Map(allQuestions(s).map((q) => [q.id, q]));
  const list = data.reports.filter((r) => !filter || r.status === filter);
  const setStatus = async (id: number, status: string) => { await api('/admin?action=report-status', { body: { id, status }, admin: true }); reload(); onChange(); };
  return (
    <>
      <div className="chips">
        {([['new', 'Yangi'], ['resolved', 'Hal qilindi'], ['', 'Barchasi']] as const).map(([k, l]) => <button key={k} className={'chip ' + (filter === k ? 'active' : '')} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {list.length === 0 ? <Empty>Xabarlar yo'q</Empty> : list.map((r) => (
        <div key={r.id} className="review-item">
          <p><b>{r.reason}</b> · <span className="muted small">{fmtDate(r.at)} · {r.login ? '@' + r.login : 'mehmon'}</span></p>
          <p className="small"><span className="mono muted">{r.qid}</span> · {byId.get(r.qid)?.text ?? "savol topilmadi (o'chirilgan bo'lishi mumkin)"}</p>
          {r.comment && <p className="muted small">“{r.comment}”</p>}
          <div className="row-wrap">
            {byId.get(r.qid) && <button className="btn small" onClick={() => setFix({ q: byId.get(r.qid)!, report: r.id })}>✏️ Savolni tuzatish</button>}
            <button className="btn ghost small" onClick={() => setStatus(r.id, r.status === 'new' ? 'resolved' : 'new')}>{r.status === 'new' ? '✓ Hal qilindi' : 'Qayta ochish'}</button>
          </div>
        </div>
      ))}
      {fix && <QuestionEditor initial={fix.q} onClose={() => setFix(null)} onSaved={() => setStatus(fix.report, 'resolved')} />}
    </>
  );
}

// ---------- Imtihon formati ----------

function ExamTab() {
  const exam = useStore((s) => s.exam);
  const [cfg, setCfg] = useState<ExamConfig>(exam);
  const [msg, setMsg] = useState('');
  const num = (v: string, min: number) => Math.max(min, Number(v) || min);
  return (
    <section className="panel form">
      <p className="notice small">Imtihon formati (20 savol / 25 daqiqa / 2 xato) taxminiy. Rasmiy manbadan tasdiqlangach shu yerda o'zgartiring — barcha foydalanuvchilarga qo'llanadi.</p>
      <label>Savollar soni<input type="number" min={1} value={cfg.questionCount} onChange={(e) => setCfg({ ...cfg, questionCount: num(e.target.value, 1) })} /></label>
      <label>Vaqt (daqiqa)<input type="number" min={1} value={cfg.minutes} onChange={(e) => setCfg({ ...cfg, minutes: num(e.target.value, 1) })} /></label>
      <label>Ruxsat etilgan xatolar<input type="number" min={0} value={cfg.maxErrors} onChange={(e) => setCfg({ ...cfg, maxErrors: Math.max(0, Number(e.target.value) || 0) })} /></label>
      <label>Biletdagi savollar soni<input type="number" min={1} value={cfg.ticketSize} onChange={(e) => setCfg({ ...cfg, ticketSize: num(e.target.value, 1) })} /></label>
      <label className="check"><input type="checkbox" checked={cfg.shuffleOptions} onChange={(e) => setCfg({ ...cfg, shuffleOptions: e.target.checked })} /> Variantlarni aralashtirish</label>
      <button className="btn" onClick={async () => { try { await saveExamConfig(cfg); setMsg('Saqlandi'); } catch (e) { setMsg(e instanceof Error ? e.message : 'Xatolik'); } }}>Saqlash</button>
      {msg && <p className="small">{msg}</p>}
    </section>
  );
}

// ---------- Admin kirishlari (xavfsizlik) ----------

function SecurityTab() {
  const { data, error, reload } = useApi<{ logins: { at: string; ip: string; agent: string; ok: boolean }[] }>('/admin?action=admin-logins');
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;
  const failed = data.logins.filter((l) => !l.ok).length;
  return (
    <>
      <p className="muted small">Admin panelga kirish urinishlari. Bir IP dan 5 ta xato urinishdan keyin u 15 daqiqaga bloklanadi. Notanish IP dan muvaffaqiyatli kirish ko'rsangiz, Vercel'da ADMIN_PASSWORD ni darhol almashtiring.</p>
      <div className="row-wrap"><span className="grow small">{failed > 0 ? <span className="bad-text">{failed} ta muvaffaqiyatsiz urinish</span> : 'Muvaffaqiyatsiz urinishlar yo\'q'}</span><button className="btn ghost" onClick={reload}>↻ Yangilash</button></div>
      <table className="table">
        <thead><tr><th>Vaqt</th><th>Natija</th><th>IP</th><th>Qurilma</th></tr></thead>
        <tbody>{data.logins.map((l, i) => (
          <tr key={i}><td className="nowrap">{fmtDate(l.at)}</td><td className={l.ok ? 'good-text' : 'bad-text'}>{l.ok ? 'Kirdi' : "Noto'g'ri parol"}</td><td className="mono small">{l.ip || '—'}</td><td className="small">{device(l.agent)}</td></tr>
        ))}</tbody>
      </table>
    </>
  );
}

// ---------- Eng faol foydalanuvchilar ----------

interface ActivityRow { id: number; login: string; name: string; last_seen: string | null; h1: number; d1: number; d7: number; d30: number; last_at: string; hours: number[] }

function HourBars({ hours, mini }: { hours: number[]; mini?: boolean }) {
  const max = Math.max(1, ...hours);
  if (mini) return <span className="mini-hours" title={hours.map((n, h) => `${h}:00 — ${n}`).join('\n')}>{hours.map((n, h) => <i key={h} style={{ height: `${(n / max) * 100}%`, opacity: n ? 1 : 0.2 }} />)}</span>;
  return (
    <>
      <div className="hours">{hours.map((n, h) => <div key={h} style={{ height: `${(n / max) * 100}%` }} title={`${h}:00–${h}:59 — ${n} ta kirish`} />)}</div>
      <div className="hours-axis">{hours.map((_, h) => <span key={h}>{h % 3 === 0 ? h : ''}</span>)}</div>
    </>
  );
}

function ActivityTab() {
  const { data, error, reload } = useApi<{ users: ActivityRow[]; hours: number[] }>('/admin?action=activity');
  const [sort, setSort] = useState<'h1' | 'd1' | 'd7' | 'd30'>('d1');
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;
  const list = [...data.users].sort((a, b) => b[sort] - a[sort] || b.d30 - a.d30);
  const peak = (h: number[]) => { const m = Math.max(...h); return m ? h.indexOf(m) : -1; };
  const top = peak(data.hours);
  return (
    <>
      <section className="panel">
        <h3>Qaysi soatlarda kirishadi (oxirgi 30 kun, Toshkent vaqti)</h3>
        <HourBars hours={data.hours} />
        {top >= 0 && <p className="small">Eng gavjum vaqt: <b>{top}:00–{top}:59</b> ({data.hours[top]} ta kirish)</p>}
      </section>
      <div className="row-wrap">
        <span className="small">Saralash:</span>
        {([['h1', '1 soatda'], ['d1', '24 soatda'], ['d7', '7 kunda'], ['d30', '30 kunda']] as const).map(([k, l]) => <button key={k} className={'chip ' + (sort === k ? 'active' : '')} onClick={() => setSort(k)}>{l}</button>)}
        <span className="grow" />
        <button className="btn ghost" onClick={reload}>↻ Yangilash</button>
      </div>
      <p className="muted small">"Kirish" — parol bilan kirish yoki ilovani ochish (10 daqiqada ko'pi bilan bir marta hisoblanadi).</p>
      {list.length === 0 ? <Empty>Oxirgi 30 kunda kirishlar yo'q</Empty> : (
        <table className="table">
          <thead><tr><th>#</th><th>Foydalanuvchi</th><th>1 soat</th><th>24 soat</th><th>7 kun</th><th>30 kun</th><th>Qaysi soatlarda</th><th>Oxirgi kirish</th></tr></thead>
          <tbody>{list.map((u, i) => {
            const p = peak(u.hours);
            return (
              <tr key={u.id}>
                <td>{i + 1}</td>
                <td><b>{u.name || '—'}</b><br /><span className="muted small">@{u.login}</span></td>
                <td className={sort === 'h1' ? 'good-text' : ''}><b>{u.h1}</b></td>
                <td className={sort === 'd1' ? 'good-text' : ''}><b>{u.d1}</b></td>
                <td className={sort === 'd7' ? 'good-text' : ''}>{u.d7}</td>
                <td className={sort === 'd30' ? 'good-text' : ''}>{u.d30}</td>
                <td className="nowrap"><HourBars hours={u.hours} mini />{p >= 0 && <span className="small muted"> ko'pincha {p}:00</span>}</td>
                <td className="nowrap small">{fmtDate(u.last_at)}</td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </>
  );
}

// ---------- Foydalanuvchilar yuborgan savollar ----------

interface AdminSubmission {
  id: number; status: 'pending' | 'approved' | 'rejected'; note: string; created_at: string; reviewed_at: string | null; login: string; name: string;
  question: { text: string; options: string[]; correct: number; topic: string; explanation: string; image?: string };
}

function SubmissionsTab({ onChange }: { onChange: () => void }) {
  const { data, error, reload } = useApi<{ submissions: AdminSubmission[] }>('/admin?action=submissions');
  const [filter, setFilter] = useState<AdminSubmission['status'] | ''>('pending');
  const [open, setOpen] = useState<AdminSubmission | null>(null);
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;
  const list = data.submissions.filter((x) => !filter || x.status === filter);
  const LABEL = { pending: 'Tekshiruvda', approved: 'Tasdiqlangan', rejected: 'Rad etilgan' };
  return (
    <>
      <p className="muted small">Foydalanuvchilar tuzgan savollar. Tasdiqlangan savol barcha foydalanuvchilarga chiqadi (id: u + raqam), muallif va admin izohi foydalanuvchiga ko'rinadi.</p>
      <div className="chips">
        {([['pending', 'Tekshiruvda'], ['approved', 'Tasdiqlangan'], ['rejected', 'Rad etilgan'], ['', 'Barchasi']] as const).map(([k, l]) => <button key={k} className={'chip ' + (filter === k ? 'active' : '')} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {list.length === 0 ? <Empty>Savollar yo'q</Empty> : list.map((x) => (
        <div key={x.id} className="review-item">
          <div className="row-wrap"><span className={'status ' + (x.status === 'pending' ? 'review' : x.status === 'approved' ? 'published' : 'archived')}>{LABEL[x.status]}</span>
            <span className="muted small">{fmtDate(x.created_at)} · {x.name} @{x.login} · {topicById(x.question.topic)?.name}</span></div>
          <b>{x.question.text}</b>
          {x.question.image && <div><img src={x.question.image} alt="" className="q-img" style={{ maxHeight: 120 }} /></div>}
          <ol className="small">{x.question.options.map((o, i) => <li key={i} className={i === x.question.correct ? 'good-text' : ''}>{o}{i === x.question.correct && ' ✓'}</li>)}</ol>
          {x.question.explanation && <p className="muted small">Izoh: {x.question.explanation}</p>}
          {x.note && <p className="small"><b>Sizning izohingiz:</b> {x.note}</p>}
          <button className="btn small" onClick={() => setOpen(x)}>Ko'rib chiqish</button>
        </div>
      ))}
      {open && <ReviewModal sub={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload(); onChange(); loadContent(); }} />}
    </>
  );
}

function ReviewModal({ sub, onClose, onDone }: { sub: AdminSubmission; onClose: () => void; onDone: () => void }) {
  const [q, setQ] = useState({ ...sub.question, options: [...sub.question.options] });
  const [note, setNote] = useState(sub.note);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof q>) => setQ((p) => ({ ...p, ...patch }));
  const review = async (status: 'approved' | 'rejected') => {
    setBusy(true); setErr('');
    try { await api('/admin?action=review-submission', { body: { id: sub.id, status, note, question: q }, admin: true }); onDone(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik'); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Savol #${sub.id} · @${sub.login}`}>
      <div className="form">
        <p className="muted small">Kerak bo'lsa matnni tuzating, keyin tasdiqlang yoki rad eting.</p>
        <label>Savol matni<textarea rows={3} value={q.text} onChange={(e) => set({ text: e.target.value })} /></label>
        {q.image && <div className="row-wrap"><img src={q.image} alt="" className="q-img" style={{ maxHeight: 140 }} /><button className="btn ghost small" onClick={() => set({ image: undefined })}>Rasmni olib tashlash</button></div>}
        <fieldset>
          <legend>Variantlar</legend>
          {q.options.map((o, i) => (
            <div key={i} className="opt-edit">
              <input type="radio" name="sub-correct" checked={q.correct === i} onChange={() => set({ correct: i })} />
              <input value={o} onChange={(e) => { const options = [...q.options]; options[i] = e.target.value; set({ options }); }} />
            </div>
          ))}
        </fieldset>
        <label>Mavzu<select value={q.topic} onChange={(e) => set({ topic: e.target.value })}>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label>Izoh<textarea rows={2} value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} /></label>
        <label>Muallifga izoh (ixtiyoriy)<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: rahmat, savol qo'shildi / variantlar noaniq" /></label>
        {err && <p className="bad-text small">{err}</p>}
        <div className="row-end">
          <button className="btn danger" disabled={busy} onClick={() => review('rejected')}>Rad etish</button>
          <button className="btn" disabled={busy} onClick={() => review('approved')}>{sub.status === 'approved' ? 'Saqlash' : '✓ Tasdiqlash (hammaga chiqadi)'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Chat-bot: tayyor javoblar va adminga kelgan savollar ----------

interface AdminMessage { id: number; text: string; answer: string | null; created_at: string; answered_at: string | null; login: string; name: string }

function ChatbotTab({ onChange }: { onChange: () => void }) {
  const { data, error, reload } = useApi<{ messages: AdminMessage[] }>('/admin?action=messages');
  const stored = useStore((s) => s.faq);
  const [faq, setFaq] = useState<FaqItem[]>(() => stored?.length ? stored : DEFAULT_FAQ);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState('');
  const setItem = (i: number, patch: Partial<FaqItem>) => setFaq((f) => f.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const answer = async (m: AdminMessage, addToFaq: boolean) => {
    const text = (answers[m.id] ?? m.answer ?? '').trim();
    if (!text) return;
    try {
      await api('/admin?action=answer-message', { body: { id: m.id, answer: text }, admin: true });
      if (addToFaq) setFaq((f) => [...f, { id: 'a' + m.id, keys: m.text.toLowerCase().slice(0, 80), answer: text }]);
      reload(); onChange();
    } catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
  };
  return (
    <>
      <section className="panel">
        <h3>Foydalanuvchilar savollari</h3>
        <p className="muted small">Bot javob topa olmagan savollar shu yerga keladi. Javobingiz foydalanuvchining chatida chiqadi.</p>
        {error && <p className="bad-text">{error}</p>}
        {!data ? <p className="muted">Yuklanmoqda…</p> : data.messages.length === 0 ? <p className="muted small">Hali savollar yo'q</p> : data.messages.map((m) => (
          <div key={m.id} className="review-item">
            <p className="small"><b>{m.name}</b> <span className="muted">@{m.login} · {fmtDate(m.created_at)}</span>{!m.answer && <span className="badge tab-badge">yangi</span>}</p>
            <p>{m.text}</p>
            <textarea rows={2} className="search" value={answers[m.id] ?? m.answer ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [m.id]: e.target.value }))} placeholder="Javobingiz…" />
            <div className="row-wrap">
              <button className="btn small" onClick={() => answer(m, false)}>{m.answer ? 'Javobni yangilash' : 'Javob berish'}</button>
              <button className="btn ghost small" onClick={() => answer(m, true)}>Javob berish + tayyor javoblarga qo'shish</button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel form">
        <h3>Tayyor javoblar</h3>
        <p className="muted small">Bot foydalanuvchi xabarida kalit so'zlardan birini topsa, shu javobni beradi. Kalit so'zlarni vergul bilan yozing. Maxsus: {'{exam}'} — imtihon formati, {'{progress}'} — foydalanuvchiga shaxsiy tavsiyalar. Havola: /quiz/mixed, /guide/signs va h.k.</p>
        {faq.map((f, i) => (
          <div key={f.id} className="review-item form">
            <label>Kalit so'zlar<input value={f.keys} onChange={(e) => setItem(i, { keys: e.target.value })} /></label>
            <label>Javob<textarea rows={2} value={f.answer} onChange={(e) => setItem(i, { answer: e.target.value })} /></label>
            <div className="row-wrap">
              <label className="grow">Havola (ixtiyoriy)<input value={f.link ?? ''} onChange={(e) => setItem(i, { link: e.target.value || undefined })} placeholder="/quiz/exam" /></label>
              <label className="grow">Tugma matni<input value={f.linkText ?? ''} onChange={(e) => setItem(i, { linkText: e.target.value || undefined })} /></label>
              <button className="btn danger small" onClick={() => setFaq((x) => x.filter((_, k) => k !== i))}>O'chirish</button>
            </div>
          </div>
        ))}
        <div className="row-wrap">
          <button className="btn ghost" onClick={() => setFaq((x) => [...x, { id: 'f' + Date.now().toString(36), keys: '', answer: '' }])}>+ Javob qo'shish</button>
          <button className="btn ghost" onClick={() => confirm("Standart javoblar tiklansinmi? O'zgarishlaringiz yo'qoladi.") && setFaq(DEFAULT_FAQ)}>Standartni tiklash</button>
          <span className="grow" />
          <button className="btn" onClick={async () => {
            setMsg('');
            try { await saveFaq(faq.filter((f) => f.keys.trim() && f.answer.trim())); setMsg('Saqlandi — barcha foydalanuvchilarga qo\'llanadi'); } catch (e) { setMsg(e instanceof Error ? e.message : 'Xatolik'); }
          }}>Saqlash</button>
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>
    </>
  );
}
