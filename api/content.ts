// Umumiy kontent: admin tahrirlagan savollar, imtihon sozlamalari va xato xabarlari.
import { currentUser, db, handler, HttpError, q, readToken, requireAdmin } from './_lib.js';

const MAX_BYTES = 8_000_000;

export default handler(async (req) => {
  const s = await db();
  const action = q(req, 'action');

  if (req.method === 'GET' && !action) {
    const rows = await s<{ key: string; value: unknown; updated_at: Date }[]>`select key, value, updated_at from settings where key in ('questions', 'exam')`;
    const get = (k: string) => rows.find((r) => r.key === k);
    return {
      questions: get('questions')?.value ?? {},
      exam: get('exam')?.value ?? null,
      updatedAt: Math.max(0, ...rows.map((r) => r.updated_at.getTime())),
    };
  }

  if (req.method === 'PUT' && action === 'questions') {
    await requireAdmin(req);
    const questions = req.body?.questions;
    if (!questions || typeof questions !== 'object') throw new HttpError(400, "Savollar yo'q");
    if (JSON.stringify(questions).length > MAX_BYTES) throw new HttpError(413, 'Savollar hajmi juda katta (rasmlarni kichraytiring)');
    await s`insert into settings (key, value) values ('questions', ${s.json(questions)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return { ok: true };
  }

  if (req.method === 'PUT' && action === 'exam') {
    await requireAdmin(req);
    await s`insert into settings (key, value) values ('exam', ${s.json(req.body?.exam ?? {})})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return { ok: true };
  }

  if (req.method === 'POST' && action === 'report') {
    const auth = String(req.headers['authorization'] ?? '').replace(/^Bearer\s+/i, '');
    const uid = readToken(auth);
    const { qid, reason, comment } = req.body ?? {};
    if (!qid || !reason) throw new HttpError(400, "Ma'lumot yetarli emas");
    await s`insert into reports (user_id, qid, reason, comment) values (${uid}, ${String(qid).slice(0, 64)}, ${String(reason).slice(0, 100)}, ${String(comment ?? '').slice(0, 1000)})`;
    return { ok: true };
  }

  if (action === 'me') { await currentUser(req); return { ok: true }; }
  throw new HttpError(400, "Noma'lum amal");
});
