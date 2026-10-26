import { currentUser, db, handler, HttpError } from './_lib.js';

const MAX_BYTES = 2_000_000;

export default handler(async (req) => {
  const u = await currentUser(req);
  const s = await db();
  if (req.method === 'GET') {
    const [row] = await s<{ state: unknown; updated_at: Date }[]>`select state, updated_at from progress where user_id = ${u.id}`;
    return { state: row?.state ?? null, updatedAt: row ? row.updated_at.getTime() : 0 };
  }
  if (req.method === 'PUT') {
    const state = req.body?.state;
    if (!state || typeof state !== 'object') throw new HttpError(400, "Ma'lumot yo'q");
    if (JSON.stringify(state).length > MAX_BYTES) throw new HttpError(413, "Ma'lumot juda katta");
    await s`insert into progress (user_id, state, updated_at) values (${u.id}, ${s.json(state)}, now())
            on conflict (user_id) do update set state = excluded.state, updated_at = now()`;
    return { ok: true };
  }
  throw new HttpError(405, "Noto'g'ri so'rov");
});
