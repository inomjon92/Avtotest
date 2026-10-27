// Umumiy kontent: admin tahrirlagan savollar, imtihon sozlamalari va xato xabarlari.
import { assertNotLocked, cleanImage, clientIp, HANDLED, storeImage, currentUser, db, handler, HttpError, q, readToken, recordFailure, requireAdmin } from './_lib.js';

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

export default handler(async (req, res) => {
  const s = await db();
  const action = q(req, 'action');

  if (req.method === 'GET' && !action) {
    const rows = await s<{ key: string; value: unknown; updated_at: Date }[]>`select key, value, updated_at from settings where key in ('questions', 'exam', 'faq', 'signs')`;
    const get = (k: string) => rows.find((r) => r.key === k);
    return {
      questions: get('questions')?.value ?? {},
      exam: get('exam')?.value ?? null,
      faq: get('faq')?.value ?? null,
      signs: get('signs')?.value ?? {},
      updatedAt: Math.max(0, ...rows.map((r) => r.updated_at.getTime())),
      build: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7),
    };
  }

  // Saqlangan rasmni berish (savol, belgi va xabar rasmlari). Id tasodifiy, kesh uzoq muddatli
  if (req.method === 'GET' && action === 'img') {
    const [img] = await s<{ mime: string; data: Buffer }[]>`select mime, data from images where id = ${q(req, 'id') ?? ''}`;
    if (!img) throw new HttpError(404, 'Rasm topilmadi');
    res.setHeader('Content-Type', img.mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).end(img.data);
    return HANDLED;
  }

  if (req.method === 'PUT' && action === 'questions') {
    await requireAdmin(req);
    const questions = req.body?.questions;
    if (!questions || typeof questions !== 'object') throw new HttpError(400, "Savollar yo'q");
    // Yangi yuklangan rasmlar (data URL) alohida saqlanib, savolda faqat havola qoladi
    for (const qq of Object.values(questions) as any[]) {
      if (qq && typeof qq === 'object' && qq.image) qq.image = await storeImage(qq.image);
    }
    if (JSON.stringify(questions).length > MAX_BYTES) throw new HttpError(413, 'Savollar hajmi juda katta (rasmlarni kichraytiring)');
    await s`insert into settings (key, value) values ('questions', ${s.json(questions)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return { ok: true, questions };
  }

  if (req.method === 'PUT' && action === 'exam') {
    await requireAdmin(req);
    await s`insert into settings (key, value) values ('exam', ${s.json(req.body?.exam ?? {})})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return { ok: true };
  }

  // Admin tasdiqlagan yo'l belgisi rasmlari: { [belgi id]: data URL } — chizilgan belgining o'rniga ko'rsatiladi
  if (req.method === 'PUT' && action === 'signs') {
    await requireAdmin(req);
    const raw = req.body?.signs;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400, "Noto'g'ri ma'lumot");
    const signs: Record<string, string> = {};
    for (const [id, img] of Object.entries(raw)) {
      if (!/^[\w.-]{1,40}$/.test(id)) throw new HttpError(400, `Belgi noto'g'ri: ${id.slice(0, 40)}`);
      const url = await storeImage(img);
      if (url) signs[id] = url;
    }
    if (JSON.stringify(signs).length > MAX_BYTES) throw new HttpError(413, 'Belgi rasmlari hajmi juda katta');
    await s`insert into settings (key, value) values ('signs', ${s.json(signs)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
    return { ok: true, signs };
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
    const rawImage = req.body?.image;
    if (rawImage && !cleanImage(rawImage)) throw new HttpError(400, "Rasm faqat JPEG, PNG yoki WebP bo'lishi kerak (1 MB gacha)");
    if (String(qid).startsWith('sign:')) {
      if (!rawImage && comment.length < 5) throw new HttpError(400, "Belgining to'g'ri rasmini biriktiring yoki nima xatoligini yozing");
    } else if (comment.length < 5 && !proposal) throw new HttpError(400, "Xatolik sababini yozing (kamida 5 belgi) yoki savolni tuzatib yuboring");
    if (uid) {
      const [{ n }] = await s`select count(*)::int as n from reports where user_id = ${uid} and at > now() - interval '1 day'`;
      if (n >= 30) throw new HttpError(429, "Bir kunda 30 tadan ortiq xabar yuborib bo'lmaydi");
    } else {
      // Mehmonlar uchun IP bo'yicha: 15 daqiqada 10 ta xabar
      const key = [`report:${clientIp(req)}`];
      await assertNotLocked(key, [10]);
      await recordFailure(key);
    }
    const image = (await storeImage(rawImage)) ?? null;
    await s`insert into reports (user_id, qid, reason, comment, image, proposal)
      values (${uid}, ${String(qid).slice(0, 64)}, ${String(reason).slice(0, 100)}, ${comment.slice(0, 1000)}, ${image}, ${proposal ? s.json(proposal) : null})`;
    return { ok: true };
  }

  if (action === 'me') { await currentUser(req); return { ok: true }; }
  throw new HttpError(400, "Noma'lum amal");
});
