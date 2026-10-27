// Administrator: foydalanuvchilar, kirishlar tarixi, umumiy statistika, xato xabarlari.
import { db, handler, hashPassword, storeImage, HttpError, q, requireAdmin, summarize, type Stat } from './_lib.js';
import { cleanQuestion } from './community.js';

export default handler(async (req) => {
  await requireAdmin(req);
  const s = await db();
  const action = q(req, 'action') ?? 'users';

  if (req.method === 'GET' && action === 'users') {
    const rows = await s`
      select u.id, u.login, u.name, u.role, u.blocked, u.created_at, u.last_seen, u.login_count, u.last_ip, u.last_agent, p.state, p.updated_at as synced_at
      from users u left join progress p on p.user_id = u.id
      order by u.last_seen desc nulls last`;
    // Noto'g'ri parol tufayli hozir vaqtincha qulflangan loginlar
    const fails = await s<{ key: string; n: number }[]>`select key, count(*)::int as n from auth_failures
      where (key like 'acct:%' or key like 'login:%') and at > now() - interval '15 minutes' group by key`;
    const locked = new Set(fails.filter((f) => f.n >= (f.key.startsWith('acct:') ? 20 : 5)).map((f) => f.key.split(':').pop()));
    return {
      users: rows.map((r: any) => ({
        id: r.id, login: r.login, name: r.name, role: r.role, blocked: r.blocked, locked: locked.has(r.login),
        createdAt: r.created_at, lastSeen: r.last_seen, loginCount: r.login_count, syncedAt: r.synced_at, ip: r.last_ip, agent: r.last_agent,
        ...summarize(r.state),
      })),
    };
  }

  if (req.method === 'GET' && action === 'logins') {
    const rows = await s`
      select l.id, l.at, l.kind, l.agent, l.ip, u.login, u.name
      from logins l join users u on u.id = l.user_id
      order by l.at desc limit 300`;
    return { logins: rows };
  }

  if (req.method === 'GET' && action === 'activity') {
    // Eng faol foydalanuvchilar: 1 soat / 24 soat / 7 kun / 30 kundagi kirishlar va qaysi soatlarda kirgani (Toshkent vaqti)
    const rows = await s`
      with l as (select user_id, at, extract(hour from at at time zone 'Asia/Tashkent')::int as h from logins where at > now() - interval '30 days')
      select u.id, u.login, u.name, u.last_seen,
        count(*) filter (where l.at > now() - interval '1 hour')::int as h1,
        count(*) filter (where l.at > now() - interval '1 day')::int as d1,
        count(*) filter (where l.at > now() - interval '7 days')::int as d7,
        count(*)::int as d30,
        max(l.at) as last_at,
        array(select coalesce(sum(case when l2.h = g then 1 else 0 end), 0)::int from generate_series(0, 23) g
              left join l l2 on l2.user_id = u.id and l2.h = g group by g order by g) as hours
      from users u join l on l.user_id = u.id
      group by u.id order by d1 desc, d7 desc, d30 desc limit 200`;
    const [{ hours }] = await s`select array(select count(l.at)::int from generate_series(0, 23) g
      left join logins l on extract(hour from l.at at time zone 'Asia/Tashkent')::int = g and l.at > now() - interval '30 days' group by g order by g) as hours`;
    return { users: rows, hours };
  }

  if (req.method === 'GET' && action === 'overview') {
    const [counts] = await s`
      select
        (select count(*)::int from users) as users,
        (select count(*)::int from users where last_seen > now() - interval '1 day') as active_day,
        (select count(*)::int from users where last_seen > now() - interval '7 days') as active_week,
        (select count(*)::int from users where created_at > now() - interval '7 days') as new_week,
        (select count(*)::int from logins where at > now() - interval '1 day') as logins_day,
        (select count(*)::int from reports where status = 'new') as reports_new,
        (select count(*)::int from submissions where status = 'pending') as submissions_pending,
        (select count(*)::int from messages where answer is null) as messages_new`;
    // Barcha foydalanuvchilar bo'yicha savollardagi xatolar
    const rows = await s<{ state: any }[]>`select state from progress`;
    const perQ: Record<string, { correct: number; wrong: number; users: number }> = {};
    for (const r of rows) {
      for (const [qid, st] of Object.entries<Stat>(r.state?.stats ?? {})) {
        const p = (perQ[qid] ??= { correct: 0, wrong: 0, users: 0 });
        p.correct += st.correct; p.wrong += st.wrong; p.users++;
      }
    }
    return { counts, questions: perQ };
  }

  if (req.method === 'GET' && action === 'user') {
    const id = Number(q(req, 'id'));
    const [row] = await s`select u.id, u.login, u.name, u.role, u.blocked, u.created_at, u.last_seen, u.login_count, u.last_ip, u.last_agent, p.state from users u left join progress p on p.user_id = u.id where u.id = ${id}`;
    if (!row) throw new HttpError(404, 'Topilmadi');
    const logins = await s`select at, kind, agent, ip from logins where user_id = ${id} order by at desc limit 50`;
    // Oxirgi 15 daqiqadagi noto'g'ri parol urinishlari (5 tasi bitta IP dan yoki 20 tasi jami bo'lsa hisob vaqtincha qulflanadi)
    const fails = await s<{ key: string; n: number }[]>`select key, count(*)::int as n from auth_failures
      where (key = ${'acct:' + row.login} or key like ${'login:%:' + row.login}) and at > now() - interval '15 minutes' group by key`;
    const failed = fails.find((f) => f.key.startsWith('acct:'))?.n ?? 0;
    const locked = failed >= 20 || fails.some((f) => f.key.startsWith('login:') && f.n >= 5);
    const st = row.state ?? {};
    return { user: { id: row.id, login: row.login, name: row.name, role: row.role, blocked: row.blocked, failed, locked, createdAt: row.created_at, lastSeen: row.last_seen, loginCount: row.login_count, ip: row.last_ip, agent: row.last_agent, ...summarize(st) },
      attempts: (st.attempts ?? []).slice(-30).reverse().map((a: any) => ({ title: a.title, mode: a.mode, correct: a.correct, total: a.total, passed: a.passed, finishedAt: a.finishedAt })),
      rulesRead: st.rulesRead ?? {}, logins };
  }

  if (req.method === 'POST' && action === 'update-user') {
    const { id, blocked, role } = req.body ?? {};
    if (blocked !== undefined) await s`update users set blocked = ${!!blocked} where id = ${id}`;
    if (role !== undefined) {
      if (!['student', 'teacher'].includes(role)) throw new HttpError(400, "Noto'g'ri rol");
      await s`update users set role = ${role} where id = ${id}`;
    }
    return { ok: true };
  }

  // Foydalanuvchi og'zaki murojaat qilganda: noto'g'ri urinishlar qulfini ochish
  if (req.method === 'POST' && action === 'unlock-user') {
    const [u] = await s<{ login: string }[]>`select login from users where id = ${Number(req.body?.id) || 0}`;
    if (!u) throw new HttpError(404, 'Topilmadi');
    await s`delete from auth_failures where key = ${'acct:' + u.login} or key like ${'login:%:' + u.login} or key = ${'pw:' + req.body.id}`;
    await s`update users set blocked = false where id = ${req.body.id}`;
    return { ok: true };
  }

  // Admin yangi parol o'rnatadi; foydalanuvchining barcha qurilmalardagi eski kirishlari bekor bo'ladi
  if (req.method === 'POST' && action === 'set-password') {
    const id = Number(req.body?.id) || 0;
    const pw = String(req.body?.password ?? '');
    if (pw.length < 5) throw new HttpError(400, "Parol kamida 5 belgidan iborat bo'lishi kerak");
    if (pw.length > 128) throw new HttpError(400, 'Parol juda uzun');
    const [u] = await s<{ login: string }[]>`update users set pass_hash = ${hashPassword(pw)}, token_ver = token_ver + 1 where id = ${id} returning login`;
    if (!u) throw new HttpError(404, 'Topilmadi');
    await s`delete from auth_failures where key = ${'acct:' + u.login} or key like ${'login:%:' + u.login}`;
    return { ok: true };
  }

  if (req.method === 'POST' && action === 'delete-user') {
    const { id } = req.body ?? {};
    await s`delete from users where id = ${id}`;
    return { ok: true };
  }

  if (req.method === 'GET' && action === 'admin-logins') {
    const rows = await s`select at, ip, agent, ok from admin_logins order by at desc limit 100`;
    return { logins: rows };
  }

  if (req.method === 'GET' && action === 'reports') {
    const rows = await s`select r.id, r.qid, r.reason, r.comment, r.status, r.at, r.image, r.proposal, u.login, u.name from reports r left join users u on u.id = r.user_id order by r.at desc limit 300`;
    return { reports: rows };
  }

  if (req.method === 'POST' && action === 'report-status') {
    const { id, status } = req.body ?? {};
    if (!['new', 'resolved'].includes(status)) throw new HttpError(400, "Noto'g'ri holat");
    await s`update reports set status = ${status} where id = ${id}`;
    return { ok: true };
  }

  if (req.method === 'GET' && action === 'submissions') {
    const rows = await s`select sb.id, sb.question, sb.status, sb.note, sb.created_at, sb.reviewed_at, u.login, u.name
      from submissions sb join users u on u.id = sb.user_id order by (sb.status = 'pending') desc, sb.created_at desc limit 300`;
    return { submissions: rows };
  }

  if (req.method === 'POST' && action === 'review-submission') {
    const { id, status, note } = req.body ?? {};
    if (!['approved', 'rejected', 'pending'].includes(status)) throw new HttpError(400, "Noto'g'ri holat");
    const [sub] = await s`select sb.*, u.login from submissions sb join users u on u.id = sb.user_id where sb.id = ${id}`;
    if (!sub) throw new HttpError(404, 'Topilmadi');
    // Admin tahrirlagan variant bo'lsa, shuni olamiz
    const question = req.body?.question ? cleanQuestion(req.body.question) : sub.question;
    if (question.image) question.image = await storeImage(question.image);
    await s.begin(async (t: any) => {
      await t`update submissions set status = ${status}, note = ${String(note ?? '').slice(0, 500)}, question = ${t.json(question)}, reviewed_at = now() where id = ${id}`;
      const [row] = await t`select value from settings where key = 'questions' for update`;
      const all = { ...(row?.value ?? {}) };
      const qid = 'u' + id;
      if (status === 'approved') {
        all[qid] = { ...question, id: qid, status: 'published', version: (all[qid]?.version ?? 0) + 1, difficulty: 2, author: sub.login, updatedAt: new Date().toISOString() };
      } else if (all[qid]) {
        all[qid] = { ...all[qid], status: 'archived' };
      }
      await t`insert into settings (key, value) values ('questions', ${t.json(all)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    });
    return { ok: true };
  }

  if (req.method === 'GET' && action === 'messages') {
    const rows = await s`select m.id, m.text, m.answer, m.created_at, m.answered_at, u.login, u.name
      from messages m join users u on u.id = m.user_id order by (m.answer is null) desc, m.created_at desc limit 300`;
    return { messages: rows };
  }

  if (req.method === 'POST' && action === 'answer-message') {
    const { id, answer } = req.body ?? {};
    const text = String(answer ?? '').trim().slice(0, 2000);
    if (!text) throw new HttpError(400, "Javob bo'sh");
    await s`update messages set answer = ${text}, answered_at = now(), seen = false where id = ${id}`;
    return { ok: true };
  }

  throw new HttpError(400, "Noma'lum amal");
});
