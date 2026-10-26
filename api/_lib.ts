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
  await s`alter table logins add column if not exists ip text not null default ''`;
  await s`create table if not exists auth_failures (
    id bigserial primary key,
    key text not null,
    at timestamptz not null default now()
  )`;
  await s`create index if not exists auth_failures_key_at on auth_failures (key, at)`;
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
}

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
interface TokenPayload { uid: number; adm?: boolean; exp: number }

function sign(payload: TokenPayload) {
  const body = b64(JSON.stringify(payload));
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function signToken(uid: number) {
  return sign({ uid, exp: Date.now() + TOKEN_DAYS * 86400000 });
}
export function signAdminToken() {
  return sign({ uid: 0, adm: true, exp: Date.now() + ADMIN_TOKEN_HOURS * 3600000 });
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
  const fwd = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return (fwd || String(req.headers['x-real-ip'] ?? '') || '').slice(0, 64);
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
  const uid = readToken(bearer(req));
  if (!uid) throw new HttpError(401, 'Tizimga kiring');
  const s = await db();
  const [u] = await s<UserRow[]>`update users set last_seen = now() where id = ${uid} returning id, login, name, role, blocked`;
  if (!u) throw new HttpError(401, 'Foydalanuvchi topilmadi');
  if (u.blocked) throw new HttpError(403, 'Hisob bloklangan');
  return u;
}

export async function requireAdmin(req: Req) {
  const p = readPayload(bearer(req));
  if (!p?.adm || !adminConfigured()) throw new HttpError(401, 'Administrator sifatida kiring');
  await db();
}

// ---- HTTP ----
export interface Req { method?: string; headers: Record<string, string | string[] | undefined>; body?: any; query?: Record<string, string | string[]> }
export interface Res { status(code: number): Res; json(body: unknown): void; setHeader(k: string, v: string): void; end(): void }

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
