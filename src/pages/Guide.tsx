import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Empty, Modal, PageHeader } from '../components/ui';
import { RoadSign } from '../components/RoadSign';
import { RULES, RULES_VERSION, ruleById } from '../data/rules';
import { SIGNS, SIGN_GROUPS } from '../data/signs';
import { DOCUMENTS, EXAM_TIPS, FINES } from '../data/extra';
import type { RoadSign as Sign } from '../data/types';
import { addLocalReport, markRuleRead, publishedQuestions, useStore } from '../store/store';
import { ApiError, getAdminToken, saveSignImage, sendReport } from '../store/api';
import { IMAGE_ACCEPT, IMAGE_FORMATS, resizeImage } from '../lib/image';
import { useT } from '../store/i18n';

export function GuideHome() {
  const { t } = useT();
  const read = useStore((s) => s.rulesRead);
  const done = RULES.filter((r) => read[r.id]).length;
  const next = RULES.find((r) => !read[r.id]);
  return (
    <div className="page">
      <PageHeader title={t("Yo'riqnoma")} back={false} />
      <section className="panel">
        <b>📚 {t("O'qilgan bo'limlar")}: {done} / {RULES.length}</b>
        <div className="progress"><div className={'progress-bar ' + (done === RULES.length ? 'good' : '')} style={{ width: `${(done / RULES.length) * 100}%` }} /></div>
        {next ? <Link to={`/guide/rules/${next.id}`} className="small">{t('Keyingi dars')}: {next.title} →</Link> : <span className="good-text small">Barcha bo'limlar o'qilgan ✓</span>}
      </section>
      <div className="grid">
        <Card to="/guide/rules" icon="📕" title={t("Yo'l harakati qoidalari")} />
        <Card to="/guide/signs" icon="⚠️" title={t("Yo'l belgilari")} subtitle={`${SIGNS.length} ta`} />
        <Card to="/guide/rules/chiziqlar-1" icon="〰️" title="Yo'l chiziqlari" />
        <Card to="/guide/rules/svetofor-1" icon="🚦" title="Svetofor va ishoralar" />
        <Card to="/guide/fines" icon="💸" title={t('Jarimalar')} />
        <Card to="/guide/rules/yordam-1" icon="⛑️" title={t('Birinchi tibbiy yordam')} />
        <Card to="/guide/documents" icon="📄" title={t('Hujjatlar')} />
        <Card to="/guide/tips" icon="💡" title={t('Imtihon maslahatlari')} />
      </div>
    </div>
  );
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

export function RulesList() {
  const { t, tc } = useT();
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return RULES.map((r) => ({ r, items: [] as string[] }));
    return RULES.map((r) => ({ r, items: r.items.filter((i) => tc(i).toLowerCase().includes(needle)) }))
      .filter(({ r, items }) => items.length > 0 || tc(r.title).toLowerCase().includes(needle));
  }, [q, tc]);
  const chapters = [...new Set(results.map((x) => x.r.chapter))];
  const read = useStore((s) => s.rulesRead);
  return (
    <div className="page">
      <PageHeader title={t("Yo'l harakati qoidalari")} />
      <input className="search" type="search" placeholder={`🔍 ${t('Qidirish')}…`} value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="muted small">Versiya: {RULES_VERSION}. Qoidalar o'quv maqsadida soddalashtirilgan; rasmiy matn — lex.uz.</p>
      {results.length === 0 && <Empty>Hech narsa topilmadi</Empty>}
      {chapters.map((ch) => (
        <section key={ch}>
          <h3 className="section-title">{tc(ch)}</h3>
          <div className="list">
            {results.filter((x) => x.r.chapter === ch).map(({ r, items }) => (
              <Link key={r.id} to={`/guide/rules/${r.id}`} className={'list-item column' + (read[r.id] ? ' done' : '')}>
                <span className="card-title">{read[r.id] ? '✓ ' : ''}{tc(r.title)}</span>
                {items.slice(0, 2).map((i, k) => <span key={k} className="muted small">{highlight(tc(i), q.trim())}</span>)}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function RuleDetail() {
  const { id } = useParams();
  const { t, tc } = useT();
  const rule = ruleById(id);
  const s = useStore((x) => x);
  useEffect(() => { if (rule) markRuleRead(rule.id); }, [rule]);
  if (!rule) return <div className="page"><PageHeader title="—" /><Empty>Bo'lim topilmadi</Empty></div>;
  const related = publishedQuestions(s).filter((q) => q.rule === rule.id);
  const siblings = RULES.filter((r) => r.topic === rule.topic && r.id !== rule.id);
  const nextRule = RULES[RULES.indexOf(rule) + 1];
  return (
    <div className="page">
      <PageHeader title={tc(rule.title)} />
      <p className="muted">{tc(rule.chapter)}</p>
      <ol className="rule-items">
        {rule.items.map((i, k) => <li key={k} id={`${rule.id}-${k + 1}`}>{tc(i)}</li>)}
      </ol>
      <p className="good-text small center">✓ {t("Bo'lim o'qilgan deb belgilandi")}</p>
      <div className="row-center">
        <Link className="btn" to={`/quiz/topic/${rule.topic}`}>📝 {t("Shu mavzu bo'yicha test")}</Link>
        {nextRule && <Link className="btn ghost" to={`/guide/rules/${nextRule.id}`}>{t('Keyingi dars')} →</Link>}
      </div>
      {related.length > 0 && (
        <section className="panel">
          <h3>Shu bandga oid savollar ({related.length})</h3>
          <ul className="plain">{related.map((q) => <li key={q.id}>• {tc(q.text)}</li>)}</ul>
        </section>
      )}
      {siblings.length > 0 && (
        <section><h3 className="section-title">Shu mavzuda</h3>
          <div className="list">{siblings.map((r) => <Link key={r.id} to={`/guide/rules/${r.id}`} className="list-item">{tc(r.title)}</Link>)}</div>
        </section>
      )}
    </div>
  );
}

export function SignsCatalog() {
  const { t, tc } = useT();
  const [group, setGroup] = useState<number | 0>(0);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Sign | null>(null);
  const [report, setReport] = useState<Sign | null>(null);
  const s = useStore((x) => x);
  const list = SIGNS.filter((x) => (!group || x.group === group) && (!q || (x.code + ' ' + tc(x.name)).toLowerCase().includes(q.toLowerCase())));
  const related = open ? publishedQuestions(s).filter((x) => x.sign === open.id) : [];
  return (
    <div className="page">
      <PageHeader title={t("Yo'l belgilari")} />
      <input className="search" type="search" placeholder={`🔍 ${t('Qidirish')}…`} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        <button className={'chip ' + (group === 0 ? 'active' : '')} onClick={() => setGroup(0)}>{t('Barchasi')}</button>
        {Object.entries(SIGN_GROUPS).map(([g, name]) => (
          <button key={g} className={'chip ' + (group === Number(g) ? 'active' : '')} onClick={() => setGroup(Number(g))}>{g}. {tc(name)}</button>
        ))}
      </div>
      <div className="sign-grid">
        {list.map((x) => (
          <button key={x.id} className="sign-card" onClick={() => setOpen(x)}>
            <RoadSign sign={x} size={72} />
            <span className="small"><b>{x.code}</b> {tc(x.name)}</span>
          </button>
        ))}
      </div>
      {list.length === 0 && <Empty>Hech narsa topilmadi</Empty>}
      <p className="muted small">Belgilar raqamlari va tasvirlari namunaviy; rasmiy YHQ ilovasi bilan tekshiriladi.</p>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.code} ${tc(open.name)}` : ''}>
        {open && (<>
          <div className="zoom"><RoadSign sign={open} size={200} /></div>
          <p className="muted small">{tc(SIGN_GROUPS[open.group])}</p>
          <p>{tc(open.description)}</p>
          {related.length > 0 && <p className="small">Bu belgi {related.length} ta savolda uchraydi.</p>}
          <div className="row-center">
            <Link className="btn" to="/quiz/topic/belgilar" onClick={() => setOpen(null)}>📝 {t("Shu mavzu bo'yicha test")}</Link>
            <button className="btn ghost report-btn" onClick={() => { setReport(open); setOpen(null); }}>⚠️ {t("Belgi xato?")}</button>
          </div>
          {getAdminToken() && <AdminSignImage id={open.id} />}
        </>)}
      </Modal>
      <SignReportModal sign={report} onClose={() => setReport(null)} />
    </div>
  );
}

/** Admin belgining rasmini o'zi yuklashi yoki asl chizmaga qaytarishi mumkin */
function AdminSignImage({ id }: { id: string }) {
  const current = useStore((s) => s.signImages[id]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  return (
    <div className="row-center">
      <button className="btn ghost small" onClick={() => fileRef.current?.click()}>🖼 Rasm yuklash (admin)</button>
      {current && <button className="btn ghost small" onClick={async () => { try { await saveSignImage(id); } catch (e) { setMsg(e instanceof Error ? e.message : 'Xatolik'); } }}>↺ Asl chizmaga qaytarish</button>}
      <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = '';
        if (f) try { await saveSignImage(id, await resizeImage(f, 400, { keepAlpha: true, maxBytes: 300_000 })); setMsg(''); } catch (er) { setMsg(er instanceof Error ? er.message : 'Xatolik'); }
      }} />
      {msg && <p className="bad-text small">{msg}</p>}
    </div>
  );
}

const SIGN_REASONS = ["Belgi rasmi noto'g'ri", "Belgi nomi yoki raqami noto'g'ri", "Tavsif noto'g'ri", 'Boshqa'];

/** Yo'l belgisida xato: foydalanuvchi to'g'ri belgining rasmini yuklab moderatorga yuboradi */
function SignReportModal({ sign, onClose }: { sign: Sign | null; onClose: () => void }) {
  const { tc } = useT();
  const [reason, setReason] = useState(SIGN_REASONS[0]);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<string>();
  const [state, setState] = useState<'form' | 'sending' | 'sent'>('form');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!sign) return;
    setReason(SIGN_REASONS[0]); setComment(''); setImage(undefined); setState('form'); setError('');
  }, [sign]);
  if (!sign) return null;
  const qid = 'sign:' + sign.id;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image && comment.trim().length < 5) return setError("To'g'ri belgining rasmini yuklang yoki nima xatoligini yozing (kamida 5 belgi)");
    setState('sending'); setError('');
    try { await sendReport({ qid, reason, comment: comment.trim(), image }); setState('sent'); }
    catch (err) {
      if (err instanceof ApiError && err.status === 0) { addLocalReport({ qid, reason, comment: comment.trim() }); setState('sent'); }
      else { setError(err instanceof Error ? err.message : 'Xatolik'); setState('form'); }
    }
  };
  return (
    <Modal open onClose={onClose} title={`${sign.code} ${tc(sign.name)}: xato bormi?`}>
      {state === 'sent' ? (<>
        <p>Rahmat! Moderator tekshirib, to'g'ri bo'lsa belgini hamma uchun almashtiradi.</p>
        <div className="row-end"><button className="btn" onClick={onClose}>Yopish</button></div>
      </>) : (
        <form className="form" onSubmit={submit}>
          <div className="sign-compare">
            <figure><RoadSign sign={sign} size={90} /><figcaption className="tiny muted">Hozirgi</figcaption></figure>
            <figure>{image ? <img src={image} alt="Yuklangan belgi" /> : <div className="sign-empty">?</div>}<figcaption className="tiny muted">Siz yuborgan</figcaption></figure>
          </div>
          <div className="radio-list">
            {SIGN_REASONS.map((r) => <label key={r}><input type="radio" name="sreason" checked={reason === r} onChange={() => setReason(r)} /> {r}</label>)}
          </div>
          <div className="row-wrap">
            <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>📷 {image ? 'Rasmni almashtirish' : "To'g'ri belgining rasmini yuklash"}</button>
            {image && <button type="button" className="btn ghost small" onClick={() => setImage(undefined)}>✕ Olib tashlash</button>}
            <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} hidden onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = '';
              if (f) try { setImage(await resizeImage(f, 400, { keepAlpha: true, maxBytes: 300_000 })); setError(''); } catch (er) { setError(er instanceof Error ? er.message : "Rasmni o'qib bo'lmadi"); }
            }} />
          </div>
          <p className="muted tiny">{IMAGE_FORMATS}. Rasm avtomatik kichraytiriladi. Belgini yaqindan, faqat o'zini kesib oling.</p>
          <label>Izoh <span className="muted small">(ixtiyoriy, rasm yuklasangiz)</span>
            <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="Masalan: bu belgi 3.20 emas, 3.21 bo'lishi kerak" />
          </label>
          {error && <p className="bad-text small">{error}</p>}
          <div className="row-end">
            <button type="button" className="btn ghost" onClick={onClose}>Bekor qilish</button>
            <button className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Yuborilmoqda…' : 'Moderatorga yuborish'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";

export function Fines() {
  const { t, tc } = useT();
  const bhm = useStore((s) => s.settings.bhm);
  const [q, setQ] = useState('');
  const list = FINES.filter((f) => tc(f.violation).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page">
      <PageHeader title={t('Jarimalar')} />
      <p className="notice small">Miqdorlar namunaviy va BHM ({fmt(bhm)}) asosida avtomatik hisoblanadi. Amaldagi miqdorlarni Ma'muriy javobgarlik to'g'risidagi kodeksdan (lex.uz) tekshiring. BHM qiymati <Link to="/settings">sozlamalarda</Link>.</p>
      <input className="search" type="search" placeholder={`🔍 ${t('Qidirish')}…`} value={q} onChange={(e) => setQ(e.target.value)} />
      <table className="table">
        <thead><tr><th>Qoidabuzarlik</th><th>BHM</th><th>{t('Jarima')}</th></tr></thead>
        <tbody>
          {list.map((f) => (
            <tr key={f.id}><td>{tc(f.violation)}{f.note && <div className="muted small">{tc(f.note)}</div>}</td><td>{f.bhm || '—'}</td><td className="nowrap">{f.bhm ? fmt(f.bhm * bhm) : '—'}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Documents() {
  const { t, tc } = useT();
  return (
    <div className="page">
      <PageHeader title={t('Hujjatlar')} />
      <p className="muted">Haydovchilik guvohnomasini olish uchun odatda talab qilinadigan hujjatlar (ro'yxatni my.gov.uz da tekshiring):</p>
      <ol className="rule-items">{DOCUMENTS.map((d) => <li key={d.title}><b>{tc(d.title)}</b><br /><span className="muted">{tc(d.text)}</span></li>)}</ol>
      <a className="btn" href="https://my.gov.uz" target="_blank" rel="noreferrer">my.gov.uz →</a>
    </div>
  );
}

export function Tips() {
  const { t, tc } = useT();
  return (
    <div className="page">
      <PageHeader title={t('Imtihon maslahatlari')} />
      <ol className="rule-items">{EXAM_TIPS.map((x) => <li key={x}>{tc(x)}</li>)}</ol>
      <Link className="btn" to="/quiz/exam">{t('Imtihon simulyatori')} →</Link>
    </div>
  );
}
