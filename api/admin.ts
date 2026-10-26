// Administrator: foydalanuvchilar, kirishlar tarixi, umumiy statistika, xato xabarlari.
import { db, handler, HttpError, q, requireAdmin } from './_lib.js';

interface Stat { correct: number; wrong: number; lastCorrect?: boolean; box: number }
interface Attempt { mode: string; passed?: boolean; correct: number; total: number; finishedAt: number }

function summarize(state: any) {
  const stats: Record<string, Stat> = state?.stats ?? {};
  const values = Object.values(stats);
  const attempts: Attempt[] = state?.attempts ?? [];
  const exams = attempts.filter((a) => a.mode === 'exam');
  const answers = values.reduce((n, x) => n + x.correct + x.wrong, 0);
  const correct = values.reduce((n, x) => n + x.correct, 0);
  return {
    answers,
    accuracy: answers ? Math.round((correct / answers) * 100) : 0,
    mastered: values.filter((x) => x.lastCorrect && x.box >= 2).length,
    seen: values.length,
    exams: exams.length,
    examsPassed: exams.filter((a) => a.passed).length,
    lastExam: exams.length ? exams[exams.length - 1] : null,
    rulesRead: Object.keys(state?.rulesRead ?? {}).length,
    examDate: state?.settings?.examDate || null,
  };
}

export default handler(async (req) => {
  await requireAdmin(req);
  const s = await db();
  const action = q(req, 'action') ?? 'users';

  if (req.method === 'GET' && action === 'users') {
    const rows = await s`
      select u.id, u.login, u.name, u.role, u.blocked, u.created_at, u.last_seen, u.login_count, u.last_ip, u.last_agent, p.state, p.updated_at as synced_at
      from users u left join progress p on p.user_id = u.id
      order by u.last_seen desc nulls last`;
    return {
      users: rows.map((r: any) => ({
        id: r.id, login: r.login, name: r.name, role: r.role, blocked: r.blocked,
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

  if (req.method === 'GET' && action === 'overview') {
    const [counts] = await s`
      select
        (select count(*)::int from users) as users,
        (select count(*)::int from users where last_seen > now() - interval '1 day') as active_day,
        (select count(*)::int from users where last_seen > now() - interval '7 days') as active_week,
        (select count(*)::int from users where created_at > now() - interval '7 days') as new_week,
        (select count(*)::int from logins where at > now() - interval '1 day') as logins_day,
        (select count(*)::int from reports where status = 'new') as reports_new`;
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
    const st = row.state ?? {};
    return { user: { id: row.id, login: row.login, name: row.name, role: row.role, blocked: row.blocked, createdAt: row.created_at, lastSeen: row.last_seen, loginCount: row.login_count, ip: row.last_ip, agent: row.last_agent, ...summarize(st) },
      attempts: (st.attempts ?? []).slice(-30).reverse().map((a: any) => ({ title: a.title, mode: a.mode, correct: a.correct, total: a.total, passed: a.passed, finishedAt: a.finishedAt })),
      rulesRead: st.rulesRead ?? {}, logins };
  }

  if (req.method === 'POST' && action === 'update-user') {
    const { id, blocked } = req.body ?? {};
    if (blocked !== undefined) await s`update users set blocked = ${!!blocked} where id = ${id}`;
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
    const rows = await s`select r.id, r.qid, r.reason, r.comment, r.status, r.at, u.login from reports r left join users u on u.id = r.user_id order by r.at desc limit 300`;
    return { reports: rows };
  }

  if (req.method === 'POST' && action === 'report-status') {
    const { id, status } = req.body ?? {};
    if (!['new', 'resolved'].includes(status)) throw new HttpError(400, "Noto'g'ri holat");
    await s`update reports set status = ${status} where id = ${id}`;
    return { ok: true };
  }

  throw new HttpError(400, "Noma'lum amal");
});
