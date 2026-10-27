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
    await sql`drop table if exists logins, progress, settings, reports, auth_failures, admin_logins, submissions, messages, group_members, groups, users cascade`;
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
    expect((await call('/auth?action=register', { body: { login: 'zaif' + suffix, password: '1234', name: 'X' } })).status).toBe(400);
    expect((await call('/auth?action=register', { body: { login: 'raqam' + suffix, password: '12345', name: 'X' } })).status).toBe(200);
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
    expect(o.data.counts.users).toBe(2);
    expect(o.data.questions.q1.wrong).toBe(1);
  });

  it('admin savollarni saqlaydi, hamma ularni oladi', async () => {
    const questions = { n1: { id: 'n1', topic: 'umumiy', text: 'Yangi?', options: ['Ha', "Yo'q"], correct: 0, explanation: '', status: 'published', version: 1 } };
    expect((await call('/content?action=questions', { method: 'PUT', body: { questions }, token: userToken })).status).toBe(401);
    expect((await call('/content?action=questions', { method: 'PUT', body: { questions }, token: adminToken })).status).toBe(200);
    expect((await call('/content')).data.questions).toEqual(questions);
  });

  it('xato xabari yuboriladi va admin uni ko\'radi', async () => {
    // Sababi yozilmagan xabar qabul qilinmaydi
    expect((await call('/content?action=report', { body: { qid: 'q1', reason: 'Boshqa', comment: '' }, token: userToken })).status).toBe(400);
    expect((await call('/content?action=report', { body: { qid: 'q1', reason: 'Boshqa', comment: 'test izoh' }, token: userToken })).status).toBe(200);
    // Tuzatish taklifi rasm bilan
    const proposal = { text: 'Tuzatilgan savol matni', options: ['A javob', 'B javob'], correct: 1, explanation: 'izoh' };
    const img = 'data:image/png;base64,iVBORw0KGgo=';
    expect((await call('/content?action=report', { body: { qid: 'q2', reason: "Javob noto'g'ri", comment: '', proposal, image: img }, token: userToken })).status).toBe(200);
    expect((await call('/content?action=report', { body: { qid: 'q2', reason: 'Boshqa', proposal: { ...proposal, options: ['A', ''] } }, token: userToken })).status).toBe(400);
    const withFix = (await call('/admin?action=reports', { token: adminToken })).data.reports.find((x: any) => x.qid === 'q2');
    expect(withFix.proposal.correct).toBe(1);
    expect(withFix.image).toBe(img);
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

  it("foydalanuvchi savol yuboradi, admin tasdiqlasa hammaga chiqadi", async () => {
    const question = { text: "Qor yog'ayotganda nima qilish kerak?", options: ['Sekinlash', 'Tezlashish'], correct: 0, topic: 'xavfsizlik', explanation: 'Tormoz yo\'li uzayadi' };
    expect((await call('/community?action=submit', { body: { question } })).status).toBe(401);
    expect((await call('/community?action=submit', { body: { question: { ...question, text: 'qisqa' } }, token: userToken })).status).toBe(400);
    const r = await call('/community?action=submit', { body: { question }, token: userToken });
    expect(r.status).toBe(200);
    expect((await call('/admin?action=overview', { token: adminToken })).data.counts.submissions_pending).toBe(1);
    const subs = (await call('/admin?action=submissions', { token: adminToken })).data.submissions;
    expect(subs[0].login).toBe('ali' + suffix);
    expect((await call('/admin?action=review-submission', { body: { id: r.data.id, status: 'approved', note: 'Rahmat' }, token: adminToken })).status).toBe(200);
    const content = (await call('/content')).data.questions;
    expect(content['u' + r.data.id]).toMatchObject({ text: question.text, status: 'published', author: 'ali' + suffix });
    expect(content.n1).toBeTruthy();
    const mine = (await call('/community?action=submissions', { token: userToken })).data.submissions;
    expect(mine[0]).toMatchObject({ status: 'approved', note: 'Rahmat' });
  });

  it('chat-bot savoli adminga boradi, javob foydalanuvchiga qaytadi', async () => {
    expect((await call('/community?action=ask', { body: { text: 'Guvohnoma qachon beriladi?' }, token: userToken })).status).toBe(200);
    expect((await call('/admin?action=overview', { token: adminToken })).data.counts.messages_new).toBe(1);
    const m = (await call('/admin?action=messages', { token: adminToken })).data.messages[0];
    await call('/admin?action=answer-message', { body: { id: m.id, answer: '10 kun ichida' }, token: adminToken });
    expect((await call('/community?action=unread', { token: userToken })).data.unread).toBe(1);
    expect((await call('/community?action=messages', { token: userToken })).data.messages[0].answer).toBe('10 kun ichida');
    expect((await call('/community?action=unread', { token: userToken })).data.unread).toBe(0);
  });

  it('admin chat-bot javoblarini tahrirlaydi', async () => {
    const faq = [{ id: 'x', keys: 'salom', answer: 'Salom!' }];
    expect((await call('/content?action=faq', { method: 'PUT', body: { faq }, token: userToken })).status).toBe(401);
    expect((await call('/content?action=faq', { method: 'PUT', body: { faq }, token: adminToken })).status).toBe(200);
    expect((await call('/content')).data.faq).toEqual(faq);
  });

  it("eng faol foydalanuvchilar ro'yxati", async () => {
    const r = await call('/admin?action=activity', { token: adminToken });
    expect(r.status).toBe(200);
    expect(r.data.hours).toHaveLength(24);
    const ali = r.data.users.find((u: any) => u.login === 'ali' + suffix);
    expect(ali.h1).toBeGreaterThanOrEqual(2);
    expect(ali.d1).toBe(ali.h1);
    expect(ali.hours.reduce((a: number, b: number) => a + b, 0)).toBe(ali.d30);
  });

  it("avtomaktab: o'qituvchi guruh ochadi, o'quvchi kod bilan qo'shiladi, o'qituvchi natijalarni ko'radi", async () => {
    const t = await call('/auth?action=register', { body: { login: 'ustoz' + suffix, password: 'secret12', name: 'Ustoz Karimov' } });
    const tTok = t.data.token;
    // Oddiy foydalanuvchi guruh ocholmaydi
    expect((await call('/school?action=create', { body: { name: 'B-1' }, token: tTok })).status).toBe(403);
    await call('/admin?action=update-user', { body: { id: t.data.user.id, role: 'teacher' }, token: adminToken });
    expect((await call('/auth?action=me', { token: tTok })).data.user.role).toBe('teacher');
    const g = await call('/school?action=create', { body: { name: 'B-1 guruh' }, token: tTok });
    expect(g.status).toBe(200);
    expect(g.data.group.code).toMatch(/^[A-Z2-9]{6}$/);
    expect((await call('/school?action=join', { body: { code: 'XXXXXX' }, token: userToken })).status).toBe(404);
    expect((await call('/school?action=join', { body: { code: g.data.group.code.toLowerCase() }, token: userToken })).status).toBe(200);
    const mine = await call('/school?action=mine', { token: userToken });
    expect(mine.data.joined[0].name).toBe('B-1 guruh');
    expect(mine.data.joined[0].teacher).toBe('Ustoz Karimov');
    const grp = await call('/school?action=group&id=' + g.data.group.id, { token: tTok });
    expect(grp.data.members).toHaveLength(1);
    expect(grp.data.members[0].mastered).toBe(1);
    expect(grp.data.members[0].examsPassed).toBe(1);
    const mem = await call(`/school?action=member&id=${g.data.group.id}&user=${grp.data.members[0].id}`, { token: tTok });
    expect(mem.data.stats.q1.correct).toBe(2);
    // Boshqa o'quvchi o'qituvchi bo'limini ko'ra olmaydi
    expect((await call('/school?action=group&id=' + g.data.group.id, { token: userToken })).status).toBe(403);
    const rating = await call(`/school?action=rating&group=${g.data.group.id}`, { token: userToken });
    expect(rating.data.top[0].name).toBe('Ali');
    expect(rating.data.me.place).toBe(1);
    expect(rating.data.top[0].id).toBeUndefined();
    const nc = await call('/school?action=update', { body: { id: g.data.group.id, newCode: true }, token: tTok });
    expect(nc.data.code).not.toBe(g.data.group.code);
    expect((await call('/school?action=kick', { body: { id: g.data.group.id, user: grp.data.members[0].id }, token: tTok })).status).toBe(200);
    expect((await call('/school?action=mine', { token: userToken })).data.joined).toHaveLength(0);
  });

  it("reyting: ball bo'yicha tartiblanadi, yashirishni tanlagan ko'rinmaydi", async () => {
    const b = await call('/auth?action=register', { body: { login: 'bek' + suffix, password: 'secret12', name: 'Bek Aliyev' } });
    const state = { v: 1, stats: { q1: { correct: 5, wrong: 0, box: 3, lastCorrect: true }, q2: { correct: 3, wrong: 0, box: 2, lastCorrect: true } }, attempts: [{ id: 'e1', mode: 'exam', passed: true, correct: 20, total: 20, finishedAt: Date.now() }], settings: { name: 'Bek Aliyev' } };
    await call('/progress', { method: 'PUT', body: { state }, token: b.data.token });
    let r = await call('/school?action=rating', { token: userToken });
    expect(r.data.top[0].name).toBe('Bek A.');
    expect(r.data.me.place).toBe(2);
    await call('/progress', { method: 'PUT', body: { state: { ...state, settings: { name: 'Bek Aliyev', hideRating: true } } }, token: b.data.token });
    r = await call('/school?action=rating', { token: userToken });
    expect(r.data.top.some((x: any) => x.name === 'Bek A.')).toBe(false);
    // O'zi o'z o'rnini baribir ko'radi
    expect((await call('/school?action=rating', { token: b.data.token })).data.me.name).toBe('Bek A.');
  });

  it("parol almashtirilsa eski tokenlar bekor bo'ladi, yangi token ishlaydi", async () => {
    const r = await call('/auth?action=register', { body: { login: 'pw' + suffix, password: 'eski-parol', name: 'Pw' } });
    const old = r.data.token;
    const other = (await call('/auth?action=login', { body: { login: 'pw' + suffix, password: 'eski-parol' } })).data.token;
    for (let i = 0; i < 5; i++) expect((await call('/auth?action=password', { body: { password: 'xato-' + i, newPassword: 'yangi-parol' }, token: old })).status).toBe(401);
    expect((await call('/auth?action=password', { body: { password: 'eski-parol', newPassword: 'yangi-parol' }, token: old })).status).toBe(429);
    const { default: postgres } = await import('postgres');
    const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
    await sql`delete from auth_failures where key like 'pw:%'`;
    await sql.end();
    const ch = await call('/auth?action=password', { body: { password: 'eski-parol', newPassword: 'yangi-parol' }, token: old });
    expect(ch.status).toBe(200);
    expect((await call('/auth?action=me', { token: old })).status).toBe(401);
    expect((await call('/auth?action=me', { token: other })).status).toBe(401);
    expect((await call('/auth?action=me', { token: ch.data.token })).status).toBe(200);
    const again = await call('/auth?action=login', { body: { login: 'pw' + suffix, password: 'yangi-parol' } });
    expect((await call('/auth?action=me', { token: again.data.token })).status).toBe(200);
  });

  it("bitta hisobga turli IP lardan ko'p urinishda hisob vaqtincha qulflanadi", async () => {
    await call('/auth?action=register', { body: { login: 'acc' + suffix, password: 'secret12', name: 'Acc' } });
    for (let i = 0; i < 20; i++) await call('/auth?action=login', { body: { login: 'acc' + suffix, password: 'xato' + i }, ip: `10.50.0.${i}` });
    expect((await call('/auth?action=login', { body: { login: 'acc' + suffix, password: 'secret12' }, ip: '10.60.0.1' })).status).toBe(429);
  });

  it("guruh kodini tanlab topishga urinish cheklanadi", async () => {
    const r = await call('/auth?action=register', { body: { login: 'kod' + suffix, password: 'secret12', name: 'Kod' } });
    for (let i = 0; i < 10; i++) expect((await call('/school?action=join', { body: { code: 'ZZZZZ' + i }, token: r.data.token })).status).toBe(404);
    expect((await call('/school?action=join', { body: { code: 'ZZZZZZ' }, token: r.data.token })).status).toBe(429);
  });

  it("ADMIN_PASSWORD almashtirilsa eski admin tokeni ishlamaydi", async () => {
    const tok = (await call('/auth?action=admin-login', { body: { login: 'boshliq', password: 'Admin-parol-2026' }, ip: '10.8.8.8' })).data.token;
    expect((await call('/admin?action=users', { token: tok })).status).toBe(200);
    process.env.ADMIN_PASSWORD = 'Boshqa-parol-2026';
    expect((await call('/admin?action=users', { token: tok })).status).toBe(401);
    process.env.ADMIN_PASSWORD = 'Admin-parol-2026';
    expect((await call('/admin?action=users', { token: tok })).status).toBe(200);
  });

  it("yo'l belgisi xatosi rasm bilan yuboriladi, admin rasmni qabul qiladi; noto'g'ri format rad etiladi", async () => {
    const png = 'data:image/png;base64,' + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');
    const fake = 'data:image/png;base64,' + Buffer.from('<svg onload=alert(1)>').toString('base64');
    expect((await call('/content?action=report', { body: { qid: 'sign:1.1', reason: "Belgi rasmi noto'g'ri", comment: '', image: fake }, token: userToken })).status).toBe(400);
    expect((await call('/content?action=report', { body: { qid: 'sign:1.1', reason: "Belgi rasmi noto'g'ri", comment: '' }, token: userToken })).status).toBe(400);
    expect((await call('/content?action=report', { body: { qid: 'sign:1.1', reason: "Belgi rasmi noto'g'ri", comment: '', image: png }, token: userToken })).status).toBe(200);
    const reps = (await call('/admin?action=reports', { token: adminToken })).data.reports;
    expect(reps.find((r: any) => r.qid === 'sign:1.1').image).toBe(png);
    expect((await call('/content?action=signs', { method: 'PUT', body: { signs: { '1.1': png } }, token: userToken })).status).toBe(401);
    expect((await call('/content?action=signs', { method: 'PUT', body: { signs: { '1.1': fake } }, token: adminToken })).status).toBe(400);
    expect((await call('/content?action=signs', { method: 'PUT', body: { signs: { '1.1': png } }, token: adminToken })).status).toBe(200);
    expect((await call('/content')).data.signs['1.1']).toBe(png);
  });

  it("admin qulflangan hisobni ochadi va yangi parol o'rnatadi", async () => {
    const r = await call('/auth?action=register', { body: { login: 'qulf' + suffix, password: 'secret12', name: 'Qulf' } });
    for (let i = 0; i < 5; i++) await call('/auth?action=login', { body: { login: 'qulf' + suffix, password: 'xato' + i }, ip: '10.70.0.1' });
    expect((await call('/auth?action=login', { body: { login: 'qulf' + suffix, password: 'secret12' }, ip: '10.70.0.1' })).status).toBe(429);
    const id = r.data.user.id;
    expect((await call('/admin?action=user&id=' + id, { token: adminToken })).data.user.locked).toBe(true);
    expect((await call('/admin?action=users', { token: adminToken })).data.users.find((u: any) => u.id === id).locked).toBe(true);
    expect((await call('/admin?action=unlock-user', { body: { id }, token: userToken })).status).toBe(401);
    expect((await call('/admin?action=unlock-user', { body: { id }, token: adminToken })).status).toBe(200);
    expect((await call('/auth?action=login', { body: { login: 'qulf' + suffix, password: 'secret12' }, ip: '10.70.0.1' })).status).toBe(200);
    expect((await call('/admin?action=set-password', { body: { id, password: '123' }, token: adminToken })).status).toBe(400);
    expect((await call('/admin?action=set-password', { body: { id, password: '654321' }, token: adminToken })).status).toBe(200);
    expect((await call('/auth?action=me', { token: r.data.token })).status).toBe(401);
    expect((await call('/auth?action=login', { body: { login: 'qulf' + suffix, password: 'secret12' } })).status).toBe(401);
    expect((await call('/auth?action=login', { body: { login: 'qulf' + suffix, password: '654321' } })).status).toBe(200);
  });

  it('bloklangan foydalanuvchi kira olmaydi', async () => {
    const users = (await call('/admin?action=users', { token: adminToken })).data.users;
    const ali = users.find((u: any) => u.login === 'ali' + suffix);
    await call('/admin?action=update-user', { body: { id: ali.id, blocked: true }, token: adminToken });
    expect((await call('/auth?action=login', { body: { login: 'ali' + suffix, password: 'secret12' } })).status).toBe(403);
  });
});
