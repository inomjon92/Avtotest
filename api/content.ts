// Umumiy kontent: admin tahrirlagan savollar, imtihon sozlamalari va xato xabarlari.
import { currentUser, db, handler, HttpError, q, readToken, requireAdmin } from './_lib.js';

const MAX_BYTES = 8_000_000;
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

function cleanProposal(raw: any) {
  const text = str(raw?.text, 500);
  const options = (Array.isArray(raw?.options) ? raw.options : []).map((o: unknown) => str(o, 200));
  const correct = Number(raw?.correct);
  if (text.length < 5 || options.length < 2 || options.length > 5 || options.some((o: string) => !o)) throw new HttpError(400, "Tuzatilgan savolda matn va barcha variantlar to'ldirilishi kerak");
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) throw new HttpError(400, "To'g'ri javobni belgilang");
  return { text, options, correct, explanation: str(raw?.explanation, 1000) };
}

export default handler(async (req) => {
  const s = await db();
  const action = q(req, 'action');

  if (req.method === 'GET' && !action) {
    const rows = await s<{ key: string; value: unknown; updated_at: Date }[]>`select key, value, updated_at from settings where key in ('questions', 'exam', 'faq')`;
    const get = (k: string) => rows.find((r) => r.key === k);
    return {
      questions: get('questions')?.value ?? {},
      exam: get('exam')?.value ?? null,
      faq: get('faq')?.value ?? null,
      updatedAt: Math.max(0, ...rows.map((r) => r.updated_at.getTime())),
      build: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7),
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

  if (req.method === 'PUT' && action === 'faq') {
    await requireAdmin(req);
    const faq = req.body?.faq;
    if (!Array.isArray(faq) || JSON.stringify(faq).length > 300_000) throw new HttpError(400, "Noto'g'ri ma'lumot");
    await s`insert into settings (key, value) values ('faq', ${s.json(faq)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return { ok: true };
  }

  if (req.method === 'POST' && action === 'report') {
    const auth = String(req.headers['authorization'] ?? '').replace(/^Bearer\s+/i, '');
    const uid = readToken(auth);
    const { qid, reason } = req.body ?? {};
    const comment = String(req.body?.comment ?? '').trim();
    if (!qid || !reason) throw new HttpError(400, "Xatolik sababini tanlang");
    // Tuzatish taklifi (savol matni, variantlar, to'g'ri javob) — ixtiyoriy
    const proposal = req.body?.proposal ? cleanProposal(req.body.proposal) : null;
    if (comment.length < 5 && !proposal) throw new HttpError(400, "Xatolik sababini yozing (kamida 5 belgi) yoki savolni tuzatib yuboring");
    const image = typeof req.body?.image === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(req.body.image) && req.body.image.length < 1_500_000 ? req.body.image : null;
    if (uid) {
      const [{ n }] = await s`select count(*)::int as n from reports where user_id = ${uid} and at > now() - interval '1 day'`;
      if (n >= 30) throw new HttpError(429, "Bir kunda 30 tadan ortiq xabar yuborib bo'lmaydi");
    }
    await s`insert into reports (user_id, qid, reason, comment, image, proposal)
      values (${uid}, ${String(qid).slice(0, 64)}, ${String(reason).slice(0, 100)}, ${comment.slice(0, 1000)}, ${image}, ${proposal ? s.json(proposal) : null})`;
    return { ok: true };
  }

  if (action === 'me') { await currentUser(req); return { ok: true }; }
  throw new HttpError(400, "Noma'lum amal");
});
