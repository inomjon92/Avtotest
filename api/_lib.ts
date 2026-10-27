// Server uchun umumiy yordamchilar: ma'lumotlar bazasi, parol xeshlash, tokenlar, CORS.
import postgres from 'postgres';
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

type Sql = ReturnType<typeof postgres>;
let sql: Sql | null = null;
let schemaReady: Promise<void> | null = null;

export function dbUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

export async function db(): Promise<Sql> {
  if (!sql) {
    const url = dbUrl();
    if (!url) throw new HttpError(503, "Ma'lumotlar bazasi ulanmagan (DATABASE_URL yo'q)");
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || url.includes('host=/');
    sql = postgres(url, { ssl: local ? false : 'require', max: 1, idle_timeout: 20, onnotice: () => {} });
  }
  if (!schemaReady) schemaReady = migrate(sql).catch((e) => { schemaReady = null; throw e; });
  await schemaReady;
  return sql;
}

async function migrate(s: Sql) {
  await s`create table if not exists users (
    id serial primary key,
    login text unique not null,
    name text not null default '',
    pass_hash text not null,
    role text not null default 'student',
    blocked boolean not null default false,
    created_at timestamptz not null default now(),
    last_seen timestamptz,
    login_count int not null default 0
  )`;
  await s`create table if not exists logins (
    id bigserial primary key,
    user_id int not null references users(id) on delete cascade,
    at timestamptz not null default now(),
    kind text not null default 'login',
    agent text not null default ''
  )`;
  await s`create table if not exists progress (
    user_id int primary key references users(id) on delete cascade,
    state jsonb not null,
    updated_at timestamptz not null default now()
  )`;
  await s`create table if not exists settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
  )`;
  await s`alter table users add column if not exists last_ip text not null default ''`;
  await s`alter table users add column if not exists last_agent text not null default ''`;
  // Parol almashtirilganda eski tokenlar (boshqa qurilmalardagi) bekor bo'lishi uchun
  await s`alter table users add column if not exists token_ver int not null default 0`;
  await s`alter table logins add column if not exists ip text not null default ''`;
  await s`create table if not exists auth_failures (
    id bigserial primary key,
    key text not null,
    at timestamptz not null default now()
  )`;
  await s`create index if not exists auth_failures_key_at on auth_failures (key, at)`;
  // Rasmlar alohida saqlanadi (savollar/belgilar JSON ida faqat havola) — so'rovlar hajmi kichik bo'lib qoladi
  await s`create table if not exists images (
    id text primary key,
    mime text not null,
    data bytea not null,
    created_at timestamptz not null default now()
  )`;
  await s`create table if not exists admin_logins (
    id bigserial primary key,
    at timestamptz not null default now(),
    ip text not null default '',
    agent text not null default '',
    ok boolean not null
  )`;
  await s`create table if not exists reports (
    id bigserial primary key,
    user_id int references users(id) on delete set null,
    qid text not null,
    reason text not null,
    comment text not null default '',
    status text not null default 'new',
    at timestamptz not null default now()
  )`;
  // Foydalanuvchilar yuborgan savollar (admin tasdiqlagach hammaga chiqadi)
  await s`create table if not exists submissions (
    id bigserial primary key,
    user_id int not null references users(id) on delete cascade,
    question jsonb not null,
    status text not null default 'pending',
    note text not null default '',
    created_at timestamptz not null default now(),
    reviewed_at timestamptz
  )`;
  // Chat-bot javob topa olmagan savollar va admin javoblari
  await s`create table if not exists messages (
    id bigserial primary key,
    user_id int not null references users(id) on delete cascade,
    text text not null,
    answer text,
    created_at timestamptz not null default now(),
    answered_at timestamptz,
    seen boolean not null default false
  )`;
  // Avtomaktab guruhlari: o'qituvchi guruh ochadi, o'quvchilar taklif kodi bilan qo'shiladi
  await s`create table if not exists groups (
    id serial primary key,
    teacher_id int not null references users(id) on delete cascade,
    name text not null,
    code text unique not null,
    created_at timestamptz not null default now()
  )`;
  await s`create table if not exists group_members (
    group_id int not null references groups(id) on delete cascade,
    user_id int not null references users(id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (group_id, user_id)
  )`;
  await s`create index if not exists group_members_user on group_members (user_id)`;
  // Xato xabariga rasm va foydalanuvchining tuzatish taklifi
  await s`alter table reports add column if not exists image text`;
  await s`alter table reports add column if not exists proposal jsonb`;
  await s`create index if not exists logins_at on logins (at)`;
  await s`create index if not exists logins_user_at on logins (user_id, at)`;
}

// ---- Progress xulosasi (admin, o'qituvchi va reyting uchun) ----
export interface Stat { correct: number; wrong: number; lastCorrect?: boolean; box: number }
interface Attempt { mode: string; passed?: boolean; correct: number; total: number; finishedAt: number; errors?: number }

// Faollik kunlari foydalanuvchi qurilmasidagi sana bilan yoziladi — Toshkent vaqtini olamiz
const dayKey = (d: Date) => new Date(d.getTime() + 5 * 3600000).toISOString().slice(0, 10);

export function summarize(state: any, now = new Date()) {
  const stats: Record<string, Stat> = state?.stats ?? {};
  const values = Object.values(stats);
  const attempts: Attempt[] = state?.attempts ?? [];
  const exams = attempts.filter((a) => a.mode === 'exam');
  const answers = values.reduce((n, x) => n + (x.correct || 0) + (x.wrong || 0), 0);
  const correct = values.reduce((n, x) => n + (x.correct || 0), 0);
  const mastered = values.filter((x) => x.lastCorrect && x.box >= 2).length;
  const examsPassed = exams.filter((a) => a.passed).length;
  // Oxirgi 7 kun: faollik (javoblar soni) va o'tilgan imtihonlar
  const activity: Record<string, number> = state?.activity ?? {};
  const weekAgo = new Date(now.getTime() - 6 * 86400000);
  const weekAnswers = Object.entries(activity).filter(([d]) => d >= dayKey(weekAgo)).reduce((n, [, v]) => n + (Number(v) || 0), 0);
  const weekPassed = exams.filter((a) => a.passed && a.finishedAt >= now.getTime() - 7 * 86400000).length;
  let streak = 0;
  const d = new Date(now);
  if (!activity[dayKey(d)]) d.setUTCDate(d.getUTCDate() - 1);
  while (activity[dayKey(d)]) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
  return {
    answers,
    accuracy: answers ? Math.round((correct / answers) * 100) : 0,
    mastered,
    seen: values.length,
    exams: exams.length,
    examsPassed,
    lastExam: exams.length ? exams[exams.length - 1] : null,
    rulesRead: Object.keys(state?.rulesRead ?? {}).length,
    examDate: state?.settings?.examDate || null,
    weekAnswers,
    weekPassed,
    streak,
    // Reyting ballari: o'zlashtirilgan savol 5, to'g'ri javob 1, o'tilgan imtihon 20
    score: mastered * 5 + correct + examsPassed * 20,
    weekScore: weekAnswers + weekPassed * 20,
  };
}

/**
 * Rasm faqat JPEG, PNG yoki WebP data URL bo'lsa qabul qilinadi (fayl boshidagi baytlar ham tekshiriladi).
 * Rasm ilovada oldindan kichraytiriladi; bu yerda chegaradan katta bo'lsa rad etiladi.
 */
export function cleanImage(v: unknown, maxBytes = 1_000_000): string | null {
  if (typeof v !== 'string') return null;
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) return null;
  if (m[2].length * 0.75 > maxBytes) return null;
  const head = Buffer.from(m[2].slice(0, 24), 'base64');
  const ok = m[1] === 'jpeg' ? head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
    : m[1] === 'png' ? head.subarray(0, 4).toString('hex') === '89504e47'
    : head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WEBP';
  return ok ? v : null;
}

/** Saqlangan rasm havolasi: /api/content?action=img&id=... */
export const IMG_URL_RE = /^\/api\/content\?action=img&id=[A-Za-z0-9_-]{8,40}$/;

/**
 * Rasmni images jadvaliga yozib, havolasini qaytaradi. Allaqachon saqlangan rasm havolasi o'zgarishsiz qaytadi.
 * Rasm bo'lmasa undefined; noto'g'ri format bo'lsa xato.
 */
export async function storeImage(v: unknown, maxBytes = 1_000_000): Promise<string | undefined> {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'string' && IMG_URL_RE.test(v)) return v;
  const clean = cleanImage(v, maxBytes);
  if (!clean) throw new HttpError(400, "Rasm faqat JPEG, PNG yoki WebP bo'lishi kerak (1 MB gacha)");
  const [, mime, b64] = /^data:(image\/\w+);base64,(.+)$/.exec(clean)!;
  const id = randomBytes(12).toString('base64url');
  const s = await db();
  await s`insert into images (id, mime, data) values (${id}, ${mime}, ${Buffer.from(b64, 'base64')})`;
  return `/api/content?action=img&id=${id}`;
}

/** Javobni handler o'zi yozib bo'lganini bildiradi (masalan, rasm yuborilganda) */
export const HANDLED = Symbol('handled');

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ---- Parollar ----
export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(pw, salt, 64).toString('hex')}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---- Tokenlar (HMAC imzoli) ----
const TOKEN_DAYS = 180;
const ADMIN_TOKEN_HOURS = 12;
function secret() {
  return process.env.AUTH_SECRET || createHash('sha256').update('avtotest:' + dbUrl()).digest('hex');
}
const b64 = (s: string) => Buffer.from(s).toString('base64url');
interface TokenPayload { uid: number; adm?: boolean; exp: number; v?: number; k?: string }

function sign(payload: TokenPayload) {
  const body = b64(JSON.stringify(payload));
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function signToken(uid: number, ver = 0) {
  return sign({ uid, v: ver, exp: Date.now() + TOKEN_DAYS * 86400000 });
}
// Admin tokeni parolga bog'langan: Vercel'da ADMIN_PASSWORD almashtirilsa, eski admin tokenlari ishlamay qoladi
const adminKey = () => createHash('sha256').update('adm:' + (process.env.ADMIN_LOGIN ?? '') + ':' + (process.env.ADMIN_PASSWORD ?? '')).digest('base64url').slice(0, 16);
export function signAdminToken() {
  return sign({ uid: 0, adm: true, k: adminKey(), exp: Date.now() + ADMIN_TOKEN_HOURS * 3600000 });
}
function readPayload(token?: string): TokenPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    return p.exp > Date.now() && Number.isInteger(p.uid) ? p : null;
  } catch { return null; }
}
/** Oddiy foydalanuvchi tokeni bo'lsa uning id si, aks holda null */
export function readToken(token?: string): number | null {
  const p = readPayload(token);
  return p && !p.adm && p.uid > 0 ? p.uid : null;
}
const tokenVer = (token?: string) => readPayload(token)?.v ?? 0;
const bearer = (req: Req) => String(req.headers['authorization'] ?? '').replace(/^Bearer\s+/i, '');

// ---- Admin hisob (Vercel muhit o'zgaruvchilarida: ADMIN_LOGIN, ADMIN_PASSWORD) ----
export function adminConfigured() {
  return !!process.env.ADMIN_LOGIN && (process.env.ADMIN_PASSWORD ?? '').length >= 8;
}
function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
export function checkAdminCredentials(login: string, password: string) {
  if (!adminConfigured()) return false;
  const okLogin = safeEqual(login.trim().toLowerCase(), process.env.ADMIN_LOGIN!.trim().toLowerCase());
  const okPass = safeEqual(password, process.env.ADMIN_PASSWORD!);
  return okLogin && okPass;
}

// ---- So'rov ma'lumotlari ----
export function clientIp(req: Req) {
  // Vercel bu sarlavhalarni o'zi qo'yadi (mijoz yuborganini almashtiradi)
  const h = (k: string) => String(req.headers[k] ?? '').split(',')[0].trim();
  return (h('x-vercel-forwarded-for') || h('x-real-ip') || h('x-forwarded-for')).slice(0, 64);
}
export const clientAgent = (req: Req) => String(req.headers['user-agent'] ?? '').slice(0, 300);

// ---- Parol tanlashga qarshi himoya: 15 daqiqada 5 ta xato urinish ----
const FAIL_WINDOW_MIN = 15;
const FAIL_LIMIT = 5;
export async function assertNotLocked(keys: string[], limits: number[] = []) {
  const s = await db();
  const rows = await s<{ key: string; n: number }[]>`select key, count(*)::int as n from auth_failures where key = any(${keys}) and at > now() - ${FAIL_WINDOW_MIN + ' minutes'}::interval group by key`;
  // Har bir kalitning o'z chegarasi bor (masalan, butun IP uchun kengroq — bir tarmoqda ko'p o'quvchi bo'lishi mumkin)
  if (rows.some((r) => r.n >= (limits[keys.indexOf(r.key)] ?? FAIL_LIMIT))) {
    throw new HttpError(429, `Juda ko'p noto'g'ri urinish. ${FAIL_WINDOW_MIN} daqiqadan keyin qayta urinib ko'ring`);
  }
}
export async function recordFailure(keys: string[]) {
  const s = await db();
  for (const k of keys) await s`insert into auth_failures (key) values (${k})`;
  await s`delete from auth_failures where at < now() - interval '1 day'`;
}
export async function clearFailures(keys: string[]) {
  const s = await db();
  await s`delete from auth_failures where key = any(${keys})`;
}

export interface UserRow { id: number; login: string; name: string; role: string; blocked: boolean }

export async function currentUser(req: Req): Promise<UserRow> {
  const token = bearer(req);
  const uid = readToken(token);
  if (!uid) throw new HttpError(401, 'Tizimga kiring');
  const s = await db();
  const [u] = await s<(UserRow & { token_ver: number })[]>`update users set last_seen = now() where id = ${uid} returning id, login, name, role, blocked, token_ver`;
  if (!u) throw new HttpError(401, 'Foydalanuvchi topilmadi');
  if (u.token_ver !== tokenVer(token)) throw new HttpError(401, 'Sessiya tugagan, qayta kiring');
  if (u.blocked) throw new HttpError(403, 'Hisob bloklangan');
  return u;
}

export async function requireAdmin(req: Req) {
  const p = readPayload(bearer(req));
  if (!p?.adm || !adminConfigured() || p.k !== adminKey()) throw new HttpError(401, 'Administrator sifatida kiring');
  await db();
}

// ---- HTTP ----
export interface Req { method?: string; headers: Record<string, string | string[] | undefined>; body?: any; query?: Record<string, string | string[]> }
export interface Res { status(code: number): Res; json(body: unknown): void; setHeader(k: string, v: string): void; end(data?: Buffer): void }

export function handler(fn: (req: Req, res: Res) => Promise<unknown>) {
  return async (req: Req, res: Res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'OPTIONS') return res.status(204).end();
    try {
      if (typeof req.body === 'string' && req.body) req.body = JSON.parse(req.body);
      const out = await fn(req, res);
      if (out === HANDLED) return;
      res.status(200).json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
      console.error(e);
      res.status(500).json({ error: 'Server xatosi' });
    }
  };
}

export const q = (req: Req, k: string) => {
  const v = req.query?.[k];
  return Array.isArray(v) ? v[0] : v;
};
