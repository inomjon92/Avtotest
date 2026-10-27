// Avtomaktab kabineti (o'qituvchi guruhlari, taklif kodi) va foydalanuvchilar reytingi.
import { randomInt } from 'node:crypto';
import { assertNotLocked, currentUser, db, handler, HttpError, q, recordFailure, summarize } from './_lib.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');

/** Reytingda ko'rsatiladigan ism: "Akbar Sidikov" → "Akbar S." (login ko'rsatilmaydi) */
export function displayName(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Foydalanuvchi';
  return parts.length > 1 ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : parts[0];
}

type Period = 'week' | 'all';

function rank(rows: { id: number; name: string; state: any }[], period: Period, me: number) {
  const list = rows
    .filter((r) => r.id === me || !r.state?.settings?.hideRating)
    .map((r) => {
      const sm = summarize(r.state);
      return { id: r.id, name: displayName(r.state?.settings?.name || r.name), score: period === 'week' ? sm.weekScore : sm.score,
        mastered: sm.mastered, accuracy: sm.accuracy, examsPassed: sm.examsPassed, streak: sm.streak, me: r.id === me };
    })
    .filter((r) => r.score > 0 || r.me)
    .sort((a, b) => b.score - a.score || b.mastered - a.mastered || a.id - b.id)
    .map((r, i) => ({ ...r, place: i + 1 }));
  const mine = list.find((r) => r.me) ?? null;
  return { top: list.slice(0, 50).map(({ id: _id, ...r }) => r), me: mine && { ...mine, id: undefined }, total: list.length };
}

export default handler(async (req) => {
  const user = await currentUser(req);
  const s = await db();
  const action = q(req, 'action');
  const isTeacher = user.role === 'teacher';

  async function ownGroup(id: unknown) {
    const [g] = await s`select id, name, code, teacher_id from groups where id = ${Number(id) || 0}`;
    if (!g || g.teacher_id !== user.id) throw new HttpError(404, 'Guruh topilmadi');
    return g;
  }

  if (req.method === 'GET' && action === 'rating') {
    const period: Period = q(req, 'period') === 'week' ? 'week' : 'all';
    const groupId = Number(q(req, 'group')) || 0;
    if (groupId) {
      const [ok] = await s`select 1 from groups g where g.id = ${groupId} and (g.teacher_id = ${user.id} or exists (select 1 from group_members m where m.group_id = g.id and m.user_id = ${user.id}))`;
      if (!ok) throw new HttpError(404, 'Guruh topilmadi');
      const rows = await s<{ id: number; name: string; state: any }[]>`
        select u.id, u.name, p.state from group_members m join users u on u.id = m.user_id left join progress p on p.user_id = u.id
        where m.group_id = ${groupId} and not u.blocked`;
      // Guruh ichida hamma ko'rinadi (o'qituvchi va guruhdoshlar)
      return rank(rows.map((r) => ({ ...r, state: r.state && { ...r.state, settings: { ...r.state.settings, hideRating: false } } })), period, user.id);
    }
    const rows = await s<{ id: number; name: string; state: any }[]>`
      select u.id, u.name, p.state from users u join progress p on p.user_id = u.id where not u.blocked and u.role = 'student'`;
    return rank(rows, period, user.id);
  }

  if (req.method === 'GET' && action === 'mine') {
    const joined = await s`select g.id, g.name, t.name as teacher, m.joined_at from group_members m join groups g on g.id = m.group_id join users t on t.id = g.teacher_id where m.user_id = ${user.id} order by m.joined_at`;
    const groups = isTeacher
      ? await s`select g.id, g.name, g.code, g.created_at, (select count(*)::int from group_members m where m.group_id = g.id) as members from groups g where g.teacher_id = ${user.id} order by g.created_at`
      : [];
    return { role: user.role, joined, groups };
  }

  if (req.method === 'POST' && action === 'join') {
    const code = String(req.body?.code ?? '').trim().toUpperCase().slice(0, 16);
    // Kodlarni tanlab topishga qarshi: 15 daqiqada 10 ta noto'g'ri kod
    const fkey = [`join:${user.id}`];
    await assertNotLocked(fkey, [10]);
    const [g] = await s`select id, name, teacher_id from groups where code = ${code}`;
    if (!g) {
      await recordFailure(fkey);
      throw new HttpError(404, "Bunday kodli guruh topilmadi");
    }
    if (g.teacher_id === user.id) throw new HttpError(400, "Bu sizning guruhingiz");
    const [{ n }] = await s`select count(*)::int as n from group_members where user_id = ${user.id}`;
    if (n >= 5) throw new HttpError(400, "5 tadan ortiq guruhga qo'shilib bo'lmaydi");
    await s`insert into group_members (group_id, user_id) values (${g.id}, ${user.id}) on conflict do nothing`;
    return { ok: true, group: { id: g.id, name: g.name } };
  }

  if (req.method === 'POST' && action === 'leave') {
    await s`delete from group_members where group_id = ${Number(req.body?.id) || 0} and user_id = ${user.id}`;
    return { ok: true };
  }

  // ---- Faqat o'qituvchi ----
  if (!isTeacher) throw new HttpError(403, "Bu bo'lim faqat o'qituvchilar uchun. Administratorga murojaat qiling");

  if (req.method === 'POST' && action === 'create') {
    const name = String(req.body?.name ?? '').trim().slice(0, 80);
    if (name.length < 2) throw new HttpError(400, 'Guruh nomini kiriting');
    const [{ n }] = await s`select count(*)::int as n from groups where teacher_id = ${user.id}`;
    if (n >= 30) throw new HttpError(400, "30 tadan ortiq guruh ochib bo'lmaydi");
    for (let i = 0; i < 5; i++) {
      const rows = await s`insert into groups (teacher_id, name, code) values (${user.id}, ${name}, ${newCode()}) on conflict (code) do nothing returning id, name, code`;
      if (rows[0]) return { group: rows[0] };
    }
    throw new HttpError(500, 'Kod yaratib bo\'lmadi, qayta urinib ko\'ring');
  }

  if (req.method === 'POST' && action === 'update') {
    const g = await ownGroup(req.body?.id);
    if (req.body?.name) await s`update groups set name = ${String(req.body.name).trim().slice(0, 80)} where id = ${g.id}`;
    if (req.body?.newCode) {
      for (let i = 0; i < 5; i++) {
        const code = newCode();
        const [taken] = await s`select 1 from groups where code = ${code}`;
        if (taken) continue;
        await s`update groups set code = ${code} where id = ${g.id}`;
        return { ok: true, code };
      }
    }
    return { ok: true };
  }

  if (req.method === 'POST' && action === 'delete') {
    const g = await ownGroup(req.body?.id);
    await s`delete from groups where id = ${g.id}`;
    return { ok: true };
  }

  if (req.method === 'POST' && action === 'kick') {
    const g = await ownGroup(req.body?.id);
    await s`delete from group_members where group_id = ${g.id} and user_id = ${Number(req.body?.user) || 0}`;
    return { ok: true };
  }

  if (req.method === 'GET' && action === 'group') {
    const g = await ownGroup(q(req, 'id'));
    const rows = await s`
      select u.id, u.login, u.name, u.last_seen, m.joined_at, p.state, p.updated_at as synced_at
      from group_members m join users u on u.id = m.user_id left join progress p on p.user_id = u.id
      where m.group_id = ${g.id} order by u.name`;
    return {
      group: { id: g.id, name: g.name, code: g.code },
      members: rows.map((r: any) => ({ id: r.id, login: r.login, name: r.name, lastSeen: r.last_seen, joinedAt: r.joined_at, syncedAt: r.synced_at, ...summarize(r.state) })),
    };
  }

  if (req.method === 'GET' && action === 'member') {
    const g = await ownGroup(q(req, 'id'));
    const uid = Number(q(req, 'user')) || 0;
    const [row] = await s`select u.id, u.login, u.name, u.last_seen, p.state from group_members m join users u on u.id = m.user_id left join progress p on p.user_id = u.id where m.group_id = ${g.id} and u.id = ${uid}`;
    if (!row) throw new HttpError(404, "O'quvchi topilmadi");
    const st = row.state ?? {};
    // Mavzular bo'yicha tahlil ilovada hisoblanadi — faqat kerakli maydonlarni beramiz
    const stats: Record<string, { correct: number; wrong: number; box: number; lastCorrect?: boolean; inMistakes?: boolean }> = {};
    for (const [qid, x] of Object.entries<any>(st.stats ?? {})) stats[qid] = { correct: x.correct, wrong: x.wrong, box: x.box, lastCorrect: x.lastCorrect, inMistakes: x.inMistakes };
    return {
      member: { id: row.id, login: row.login, name: row.name, lastSeen: row.last_seen, ...summarize(st) },
      stats,
      activity: st.activity ?? {},
      attempts: (st.attempts ?? []).slice(-30).reverse().map((a: any) => ({ title: a.title, mode: a.mode, correct: a.correct, total: a.total, passed: a.passed, finishedAt: a.finishedAt })),
    };
  }

  throw new HttpError(400, "Noma'lum amal");
});
