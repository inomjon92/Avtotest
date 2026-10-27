// Foydalanuvchilar hissasi: savol yuborish va chat-botdan adminga savol berish.
import { cleanImage, currentUser, IMG_URL_RE, storeImage, db, handler, HttpError, q } from './_lib.js';

const TOPICS = ['umumiy', 'belgilar', 'chiziqlar', 'svetofor', 'chorraha', 'manevr', 'tezlik', 'quvib', 'toxtash', 'piyoda', 'temiryol', 'chiroqlar', 'xavfsizlik', 'yordam'];
const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/** Yuborilgan savolni tekshirib, xavfsiz shaklga keltiradi */
export function cleanQuestion(raw: any) {
  const text = str(raw?.text, 500);
  if (text.length < 10) throw new HttpError(400, "Savol matni juda qisqa (kamida 10 belgi)");
  const options = (Array.isArray(raw?.options) ? raw.options : []).map((o: unknown) => str(o, 200)).filter(Boolean);
  if (options.length < 2 || options.length > 5) throw new HttpError(400, "2 tadan 5 tagacha variant kerak");
  const correct = Number(raw?.correct);
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) throw new HttpError(400, "To'g'ri javobni belgilang");
  const topic = TOPICS.includes(raw?.topic) ? raw.topic : 'umumiy';
  const image = typeof raw?.image === 'string' && IMG_URL_RE.test(raw.image) ? raw.image : cleanImage(raw?.image) ?? undefined;
  if (raw?.image && !image) throw new HttpError(400, "Rasm faqat JPEG, PNG yoki WebP bo'lishi kerak (1 MB gacha)");
  return { text, options, correct, topic, explanation: str(raw?.explanation, 1000), image };
}

export default handler(async (req) => {
  const user = await currentUser(req);
  const s = await db();
  const action = q(req, 'action');

  if (req.method === 'GET' && action === 'submissions') {
    const rows = await s`select id, question, status, note, created_at, reviewed_at from submissions where user_id = ${user.id} order by created_at desc limit 100`;
    return { submissions: rows };
  }

  if (req.method === 'POST' && action === 'submit') {
    const question = cleanQuestion(req.body?.question);
    question.image = await storeImage(question.image);
    const [{ pending, today }] = await s`
      select count(*) filter (where status = 'pending')::int as pending,
             count(*) filter (where created_at > now() - interval '1 day')::int as today
      from submissions where user_id = ${user.id}`;
    if (pending >= 10) throw new HttpError(429, "Tekshiruvda 10 ta savolingiz bor. Admin ko'rib chiqqach yana yuboring");
    if (today >= 20) throw new HttpError(429, "Bir kunda 20 tadan ortiq savol yuborib bo'lmaydi");
    const [row] = await s`insert into submissions (user_id, question) values (${user.id}, ${s.json(question)}) returning id`;
    return { ok: true, id: row.id };
  }

  if (req.method === 'GET' && action === 'messages') {
    const rows = await s`select id, text, answer, created_at, answered_at from messages where user_id = ${user.id} order by created_at desc limit 50`;
    await s`update messages set seen = true where user_id = ${user.id} and answer is not null and not seen`;
    return { messages: rows };
  }

  if (req.method === 'POST' && action === 'ask') {
    const text = str(req.body?.text, 1000);
    if (text.length < 2) throw new HttpError(400, 'Savol matni bo\'sh');
    const [{ n }] = await s`select count(*)::int as n from messages where user_id = ${user.id} and created_at > now() - interval '1 day'`;
    if (n >= 10) throw new HttpError(429, "Bir kunda 10 tadan ortiq savol yuborib bo'lmaydi");
    await s`insert into messages (user_id, text) values (${user.id}, ${text})`;
    return { ok: true };
  }

  if (req.method === 'GET' && action === 'unread') {
    const [{ n }] = await s`select count(*)::int as n from messages where user_id = ${user.id} and answer is not null and not seen`;
    return { unread: n };
  }

  throw new HttpError(400, "Noma'lum amal");
});
