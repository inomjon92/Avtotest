import {
  assertNotLocked, checkAdminCredentials, adminConfigured, clearFailures, clientAgent, clientIp, currentUser, db, handler,
  hashPassword, HttpError, q, recordFailure, signAdminToken, signToken, verifyPassword, type UserRow,
} from './_lib.js';

const LOGIN_RE = /^[a-z0-9_.]{3,32}$/;

const publicUser = (u: UserRow) => ({ id: u.id, login: u.login, name: u.name, role: (u.role === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher' });

function checkPassword(pw: string) {
  if (pw.length < 5) throw new HttpError(400, "Parol kamida 5 belgidan iborat bo'lishi kerak");
  if (pw.length > 128) throw new HttpError(400, 'Parol juda uzun');
}

export default handler(async (req) => {
  const action = q(req, 'action');
  const s = await db();
  const ip = clientIp(req);
  const agent = clientAgent(req);

  if (req.method === 'GET' && action === 'me') {
    const u = await currentUser(req);
    // Ilovani ochish ham "kirish" sifatida yoziladi (10 daqiqada ko'pi bilan bir marta)
    await s`insert into logins (user_id, kind, agent, ip)
      select ${u.id}, 'open', ${agent}, ${ip}
      where not exists (select 1 from logins where user_id = ${u.id} and at > now() - interval '10 minutes')`;
    return { user: publicUser(u) };
  }
  if (req.method !== 'POST') throw new HttpError(405, "Noto'g'ri so'rov");

  const login = String(req.body?.login ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (action === 'register') {
    const name = String(req.body?.name ?? '').trim().slice(0, 60);
    if (!LOGIN_RE.test(login)) throw new HttpError(400, "Login 3–32 belgi: lotin harflari, raqamlar, _ yoki .");
    if (process.env.ADMIN_LOGIN && login === process.env.ADMIN_LOGIN.trim().toLowerCase()) throw new HttpError(409, 'Bu login band, boshqasini tanlang');
    checkPassword(password);
    if (!name) throw new HttpError(400, 'Ismingizni kiriting');
    await assertNotLocked([`reg:${ip}`], [20]);
    const rows = await s<UserRow[]>`
      insert into users (login, name, pass_hash, role, last_seen, login_count, last_ip, last_agent)
      values (${login}, ${name}, ${hashPassword(password)}, 'student', now(), 1, ${ip}, ${agent})
      on conflict (login) do nothing
      returning id, login, name, role, blocked`;
    if (!rows[0]) throw new HttpError(409, 'Bu login band, boshqasini tanlang');
    // Bir IP dan juda ko'p hisob ochilishini cheklash uchun ham hisoblaymiz
    await recordFailure([`reg:${ip}`]);
    await s`insert into logins (user_id, kind, agent, ip) values (${rows[0].id}, 'register', ${agent}, ${ip})`;
    return { token: signToken(rows[0].id), user: publicUser(rows[0]) };
  }

  if (action === 'login') {
    // IP+login: 5, butun IP: 30, bitta hisobga turli IP lardan: 20 (botnet bilan parol tanlashga qarshi)
    const keys = [`login:${ip}:${login}`, `ip:${ip}`, `acct:${login}`];
    await assertNotLocked(keys, [5, 30, 20]);
    const [u] = await s<(UserRow & { pass_hash: string; token_ver: number })[]>`select id, login, name, role, blocked, pass_hash, token_ver from users where login = ${login}`;
    if (!u || !verifyPassword(password, u.pass_hash)) {
      await recordFailure(keys);
      throw new HttpError(401, "Login yoki parol noto'g'ri");
    }
    if (u.blocked) throw new HttpError(403, 'Hisob bloklangan. Administratorga murojaat qiling');
    await clearFailures([keys[0]]);
    await s`update users set last_seen = now(), login_count = login_count + 1, last_ip = ${ip}, last_agent = ${agent} where id = ${u.id}`;
    await s`insert into logins (user_id, kind, agent, ip) values (${u.id}, 'login', ${agent}, ${ip})`;
    return { token: signToken(u.id, u.token_ver), user: publicUser(u) };
  }

  if (action === 'admin-login') {
    if (!adminConfigured()) throw new HttpError(503, "Admin hisobi sozlanmagan (Vercel'da ADMIN_LOGIN va ADMIN_PASSWORD kiriting)");
    const keys = [`admin:${ip}`, 'admin:all'];
    // Bitta IP: 5; hammasi bo'lib (turli IP lardan): 50 — kuchli parol bilan ham qo'shimcha to'siq
    await assertNotLocked(keys, [5, 50]);
    const ok = checkAdminCredentials(login, password);
    await s`insert into admin_logins (ip, agent, ok) values (${ip}, ${agent}, ${ok})`;
    if (!ok) {
      await recordFailure(keys);
      throw new HttpError(401, "Login yoki parol noto'g'ri");
    }
    await clearFailures([keys[0]]);
    return { token: signAdminToken() };
  }

  if (action === 'password') {
    const u = await currentUser(req);
    const next = String(req.body?.newPassword ?? '');
    const fkey = [`pw:${u.id}`];
    await assertNotLocked(fkey);
    const [row] = await s<{ pass_hash: string }[]>`select pass_hash from users where id = ${u.id}`;
    if (!verifyPassword(password, row.pass_hash)) {
      await recordFailure(fkey);
      throw new HttpError(401, "Joriy parol noto'g'ri");
    }
    checkPassword(next);
    // token_ver oshadi: boshqa qurilmalardagi eski sessiyalar chiqib ketadi, shu qurilmaga yangi token beriladi
    const [r] = await s<{ token_ver: number }[]>`update users set pass_hash = ${hashPassword(next)}, token_ver = token_ver + 1 where id = ${u.id} returning token_ver`;
    await clearFailures(fkey);
    return { ok: true, token: signToken(u.id, r.token_ver) };
  }

  throw new HttpError(400, "Noma'lum amal");
});
