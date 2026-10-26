// Server API integratsion testlari. DATABASE_URL berilganda ishlaydi (CI da Postgres servisi bilan).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { startApiServer } from '../scripts/dev-api';

const enabled = !!process.env.DATABASE_URL;
process.env.ADMIN_LOGIN = 'boshliq';
process.env.ADMIN_PASSWORD = 'Admin-parol-2026';
let server: Server;
const PORT = 3999;
const base = `http://localhost:${PORT}/api`;

async function call(path: string, opts: { method?: string; body?: unknown; token?: string; ip?: string } = {}) {
  const r = await fetch(base + path, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': opts.ip ?? '10.0.0.1', 'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-A515F) Mobile', ...(opts.token ? { Authorization: 'Bearer ' + opts.token } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: r.status, data: await r.json() };
}

describe.skipIf(!enabled)('server API', () => {
  const suffix = Date.now().toString(36);
  let adminToken = '', userToken = '';

  beforeAll(async () => {
    server = await startApiServer(PORT);
    const { default: postgres } = await import('postgres');
    const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
    await sql`drop table if exists logins, progress, settings, reports, auth_failures, admin_logins, users cascade`;
    await sql.end();
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));

  it("admin alohida login-parol bilan kiradi, noto'g'risi rad etiladi", async () => {
    expect((await call('/auth?action=admin-login', { body: { login: 'boshliq', password: 'xato' }, ip: '10.9.9.9' })).status).toBe(401);
    const r = await call('/auth?action=admin-login', { body: { login: 'Boshliq', password: 'Admin-parol-2026' } });
    expect(r.status).toBe(200);
    adminToken = r.data.token;
  });

  it("admin loginini oddiy foydalanuvchi egallay olmaydi, kuchsiz parol rad etiladi", async () => {
    expect((await call('/auth?action=register', { body: { login: 'boshliq', password: 'secret123', name: 'X' } })).status).toBe(409);
    expect((await call('/auth?action=register', { body: { login: 'zaif' + suffix, password: 'qisqa', name: 'X' } })).status).toBe(400);
    expect((await call('/auth?action=register', { body: { login: 'zaif' + suffix, password: 'faqatharflar', name: 'X' } })).status).toBe(400);
  });

  it("ro'yxatdan o'tgan foydalanuvchi o'quvchi, login band bo'lsa rad etiladi", async () => {
    const r = await call('/auth?action=register', { body: { login: 'ali' + suffix, password: 'secret12', name: 'Ali' } });
    expect(r.data.user.role).toBe('student');
    userToken = r.data.token;
    const dup = await call('/auth?action=register', { body: { login: 'ali' + suffix, password: 'secret12', name: 'Ali' } });
    expect(dup.status).toBe(409);
  });

  it("noto'g'ri parol bilan kirib bo'lmaydi, to'g'risi bilan kiradi", async () => {
    expect((await call('/auth?action=login', { body: { login: 'ali' + suffix, password: 'xato123' } })).status).toBe(401);
    const ok = await call('/auth?action=login', { body: { login: 'ALI' + suffix, password: 'secret12' } });
    expect(ok.status).toBe(200);
    expect((await call('/auth?action=me', { token: ok.data.token })).data.user.login).toBe('ali' + suffix);
  });

  it('progress saqlanadi va qaytariladi', async () => {
    const state = { v: 1, stats: { q1: { correct: 2, wrong: 1, box: 2, lastCorrect: true } }, attempts: [{ mode: 'exam', passed: true, correct: 19, total: 20, finishedAt: 1 }], rulesRead: { 'tezlik-1': 1 } };
    expect((await call('/progress', { method: 'PUT', body: { state }, token: userToken })).status).toBe(200);
    const r = await call('/progress', { token: userToken });
    expect(r.data.state).toEqual(state);
  });

  it("o'quvchi admin bo'limiga kira olmaydi", async () => {
    expect((await call('/admin?action=users', { token: userToken })).status).toBe(401);
    expect((await call('/admin?action=users')).status).toBe(401);
  });

  it("admin foydalanuvchilar, kirishlar va natijalarni ko'radi", async () => {
    const r = await call('/admin?action=users', { token: adminToken });
    const ali = r.data.users.find((u: any) => u.login === 'ali' + suffix);
    expect(ali.loginCount).toBe(2);
    expect(ali.ip).toBe('10.0.0.1');
    expect(ali.agent).toContain('SM-A515F');
    expect(ali.examsPassed).toBe(1);
    expect(ali.mastered).toBe(1);
    const l = await call('/admin?action=logins', { token: adminToken });
    expect(l.data.logins.filter((x: any) => x.login === 'ali' + suffix)).toHaveLength(2);
    const o = await call('/admin?action=overview', { token: adminToken });
    expect(o.data.counts.users).toBe(1);
    expect(o.data.questions.q1.wrong).toBe(1);
  });

  it('admin savollarni saqlaydi, hamma ularni oladi', async () => {
    const questions = { n1: { id: 'n1', topic: 'umumiy', text: 'Yangi?', options: ['Ha', "Yo'q"], correct: 0, explanation: '', status: 'published', version: 1 } };
    expect((await call('/content?action=questions', { method: 'PUT', body: { questions }, token: userToken })).status).toBe(401);
    expect((await call('/content?action=questions', { method: 'PUT', body: { questions }, token: adminToken })).status).toBe(200);
    expect((await call('/content')).data.questions).toEqual(questions);
  });

  it('xato xabari yuboriladi va admin uni ko\'radi', async () => {
    await call('/content?action=report', { body: { qid: 'q1', reason: 'Boshqa', comment: 'test' }, token: userToken });
    const r = await call('/admin?action=reports', { token: adminToken });
    expect(r.data.reports[0].login).toBe('ali' + suffix);
  });

  it("oddiy foydalanuvchi tokeni admin sifatida ishlamaydi, admin tokeni foydalanuvchi sifatida ishlamaydi", async () => {
    expect((await call('/admin?action=overview', { token: userToken })).status).toBe(401);
    expect((await call('/progress', { token: adminToken })).status).toBe(401);
  });

  it("5 marta noto'g'ri paroldan keyin vaqtincha bloklanadi", async () => {
    for (let i = 0; i < 5; i++) expect((await call('/auth?action=login', { body: { login: 'ali' + suffix, password: 'notogri1' }, ip: '10.7.7.7' })).status).toBe(401);
    expect((await call('/auth?action=login', { body: { login: 'ali' + suffix, password: 'secret12' }, ip: '10.7.7.7' })).status).toBe(429);
    expect((await call('/auth?action=login', { body: { login: 'ali' + suffix, password: 'secret12' }, ip: '10.0.0.2' })).status).toBe(200);
  });

  it('bloklangan foydalanuvchi kira olmaydi', async () => {
    const users = (await call('/admin?action=users', { token: adminToken })).data.users;
    const ali = users.find((u: any) => u.login === 'ali' + suffix);
    await call('/admin?action=update-user', { body: { id: ali.id, blocked: true }, token: adminToken });
    expect((await call('/auth?action=login', { body: { login: 'ali' + suffix, password: 'secret12' } })).status).toBe(403);
  });
});
