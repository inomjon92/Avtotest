import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/ui';
import { TOPICS, topicById } from '../data/topics';
import { resizeImage } from '../lib/image';
import { mySubmissions, submitQuestion, type Submission, type SubmittedQuestion } from '../store/api';
import { setGuest, useSession } from '../store/store';

const EMPTY: SubmittedQuestion = { text: '', options: ['', '', ''], correct: 0, topic: 'umumiy', explanation: '' };
const STATUS: Record<Submission['status'], [string, string]> = {
  pending: ['Tekshiruvda', 'review'], approved: ['Tasdiqlandi — hammaga ko\'rinadi', 'published'], rejected: ['Rad etildi', 'archived'],
};

export default function Submit() {
  const session = useSession();
  const [q, setQ] = useState<SubmittedQuestion>(EMPTY);
  const [list, setList] = useState<Submission[] | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<SubmittedQuestion>) => setQ((p) => ({ ...p, ...patch }));
  const reload = () => mySubmissions().then(setList).catch(() => setList([]));
  useEffect(() => { if (session) reload(); }, [session]);

  if (!session) {
    return (
      <div className="page">
        <PageHeader title="Savol yuborish" />
        <div className="panel">
          <p>Savol yuborish uchun hisobingizga kiring. Yuborgan savollaringizni administrator tekshiradi va tasdiqlasa, hamma foydalanuvchilarga chiqadi.</p>
          <button className="btn" onClick={() => setGuest(false)}>Kirish / Ro'yxatdan o'tish</button>
        </div>
      </div>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    const options = q.options.map((o) => o.trim());
    if (options.some((o) => !o)) return setMsg({ ok: false, text: "Bo'sh variantlarni to'ldiring yoki o'chiring" });
    setBusy(true);
    try {
      await submitQuestion({ ...q, options });
      setQ(EMPTY);
      setMsg({ ok: true, text: "Rahmat! Savolingiz administratorga yuborildi. Tasdiqlansa, hamma uchun chiqadi." });
      reload();
    } catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : 'Xatolik' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="page">
      <PageHeader title="Savol yuborish" />
      <p className="muted small">O'zingiz bilgan qiziq vaziyat yoki qoida bo'yicha savol tuzing. Administrator tekshirib, kerak bo'lsa tuzatadi va tasdiqlaydi.</p>
      <form className="panel form" onSubmit={send}>
        <label>Savol matni<textarea rows={3} value={q.text} onChange={(e) => set({ text: e.target.value })} maxLength={500} required minLength={10} /></label>
        <div className="row-wrap">
          <button type="button" className="btn ghost small" onClick={() => fileRef.current?.click()}>🖼 Rasm qo'shish (ixtiyoriy)</button>
          {q.image && <><img src={q.image} alt="" className="q-img" style={{ maxHeight: 80 }} /><button type="button" className="btn ghost small" onClick={() => set({ image: undefined })}>Olib tashlash</button></>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = '';
            if (f) try { set({ image: await resizeImage(f, 800) }); } catch { setMsg({ ok: false, text: "Rasmni o'qib bo'lmadi" }); }
          }} />
        </div>
        <fieldset>
          <legend>Javob variantlari (to'g'risini belgilang)</legend>
          {q.options.map((o, i) => (
            <div key={i} className="opt-edit">
              <input type="radio" name="correct" checked={q.correct === i} onChange={() => set({ correct: i })} aria-label="To'g'ri javob" />
              <input value={o} maxLength={200} onChange={(e) => { const options = [...q.options]; options[i] = e.target.value; set({ options }); }} placeholder={`Variant ${i + 1}`} />
              {q.options.length > 2 && <button type="button" className="icon-btn" onClick={() => set({ options: q.options.filter((_, k) => k !== i), correct: q.correct === i ? 0 : q.correct > i ? q.correct - 1 : q.correct })}>✕</button>}
            </div>
          ))}
          {q.options.length < 5 && <button type="button" className="btn ghost small" onClick={() => set({ options: [...q.options, ''] })}>+ Variant</button>}
        </fieldset>
        <label>Mavzu<select value={q.topic} onChange={(e) => set({ topic: e.target.value })}>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label>Izoh (nega shu javob to'g'ri)<textarea rows={2} value={q.explanation} maxLength={1000} onChange={(e) => set({ explanation: e.target.value })} /></label>
        {msg && <p className={(msg.ok ? 'good-text' : 'bad-text') + ' small'}>{msg.text}</p>}
        <button className="btn" disabled={busy}>{busy ? '…' : 'Yuborish'}</button>
      </form>

      <h2 className="section-title">Mening savollarim</h2>
      {list === null ? <p className="muted">Yuklanmoqda…</p> : list.length === 0 ? <p className="muted small">Hali savol yubormagansiz.</p> : (
        <div className="list">
          {list.map((x) => (
            <div key={x.id} className="review-item">
              <div className="row-wrap"><span className={'status ' + STATUS[x.status][1]}>{STATUS[x.status][0]}</span><span className="muted small">{new Date(x.created_at).toLocaleDateString('ru-RU')} · {topicById(x.question.topic)?.name}</span></div>
              <b>{x.question.text}</b>
              <ol className="small">{x.question.options.map((o, i) => <li key={i} className={i === x.question.correct ? 'good-text' : ''}>{o}</li>)}</ol>
              {x.note && <p className="small"><b>Admin izohi:</b> {x.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
