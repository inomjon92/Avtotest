import { useMemo, useRef, useState } from 'react';
import { Empty, Modal, PageHeader } from '../components/ui';
import { RoadSign } from '../components/RoadSign';
import type { Question, QuestionStatus } from '../data/types';
import { TOPICS, topicById } from '../data/topics';
import { RULES } from '../data/rules';
import { SIGNS, signById } from '../data/signs';
import { questionsFromCSV, toCSV } from '../lib/csv';
import {
  allQuestions, importQuestions, saveQuestion, setReportStatus, updateExamConfig, updateSettings, useStore,
} from '../store/store';
import { download } from './Settings';

const NO_VERSIONS: Question[] = [];
const STATUS_LABEL: Record<QuestionStatus, string> = { draft: 'Qoralama', review: 'Tekshiruvda', published: 'Nashr qilingan', archived: 'Arxiv' };
type Tab = 'questions' | 'import' | 'stats' | 'reports' | 'exam';

export default function Admin() {
  const pin = useStore((s) => s.settings.adminPin);
  const [ok, setOk] = useState(() => sessionStorage.getItem('admin') === '1');
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('questions');

  if (!ok) {
    return (
      <div className="page">
        <PageHeader title="Admin panel" />
        <form className="panel form" onSubmit={(e) => { e.preventDefault(); if (input === pin) { sessionStorage.setItem('admin', '1'); setOk(true); } else setInput(''); }}>
          <label>PIN kod<input type="password" inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} autoFocus /></label>
          <button className="btn">Kirish</button>
          <p className="muted small">Standart PIN: 1234 — kirgandan so'ng "Imtihon" bo'limida o'zgartiring. Bu lokal moderator rejimi; server va rollar (2FA bilan) backend bosqichida qo'shiladi.</p>
        </form>
      </div>
    );
  }

  return (
    <div className="page wide">
      <PageHeader title="Admin panel" />
      <div className="chips">
        {([['questions', 'Savollar'], ['import', 'Import / eksport'], ['stats', 'Savol statistikasi'], ['reports', 'Xato xabarlari'], ['exam', 'Imtihon sozlamalari']] as [Tab, string][])
          .map(([id, l]) => <button key={id} className={'chip ' + (tab === id ? 'active' : '')} onClick={() => setTab(id)}>{l}</button>)}
      </div>
      {tab === 'questions' && <QuestionsTab />}
      {tab === 'import' && <ImportTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'exam' && <ExamTab />}
    </div>
  );
}

function QuestionsTab() {
  const s = useStore((x) => x);
  const all = allQuestions(s);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<QuestionStatus | ''>('');
  const [topic, setTopic] = useState('');
  const [edit, setEdit] = useState<Question | null>(null);
  const list = all.filter((x) => (!status || x.status === status) && (!topic || x.topic === topic) && (!q || (x.id + ' ' + x.text).toLowerCase().includes(q.toLowerCase())));
  const blank = (): Question => ({ id: 'n' + Date.now().toString(36), topic: TOPICS[0].id, text: '', options: ['', ''], correct: 0, explanation: '', status: 'draft', version: 0 });
  return (
    <>
      <div className="row-wrap">
        <input className="search grow" type="search" placeholder="🔍 Qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as QuestionStatus | '')}><option value="">Barcha holatlar</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">Barcha mavzular</option>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <button className="btn" onClick={() => setEdit(blank())}>+ Yangi savol</button>
      </div>
      <p className="muted small">{list.length} ta savol · foydalanuvchilarga faqat "Nashr qilingan" holatidagilar ko'rinadi</p>
      <table className="table">
        <thead><tr><th>ID</th><th>Savol</th><th>Mavzu</th><th>Holat</th><th>v</th></tr></thead>
        <tbody>
          {list.map((x) => (
            <tr key={x.id} className="clickable" onClick={() => setEdit(x)}>
              <td className="nowrap">{x.id}</td><td>{x.text}</td><td>{topicById(x.topic)?.name ?? x.topic}</td>
              <td><span className={'status ' + x.status}>{STATUS_LABEL[x.status]}</span></td><td>{x.version}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <QuestionEditor initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function QuestionEditor({ initial, onClose }: { initial: Question; onClose: () => void }) {
  const versions = useStore((s) => s.versions[initial.id] ?? NO_VERSIONS);
  const [q, setQ] = useState<Question>({ ...initial, options: [...initial.options] });
  const [err, setErr] = useState('');
  const set = (patch: Partial<Question>) => setQ((p) => ({ ...p, ...patch }));
  const sign = signById(q.sign);
  const save = (status?: QuestionStatus) => {
    const opts = q.options.map((o) => o.trim());
    if (!q.text.trim()) return setErr('Savol matnini kiriting');
    if (opts.filter(Boolean).length < 2 || opts.some((o) => !o)) return setErr("Kamida 2 ta to'ldirilgan variant kerak (bo'shlarini o'chiring)");
    saveQuestion({ ...q, options: opts, status: status ?? q.status });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial.version ? `Tahrirlash: ${initial.id}` : 'Yangi savol'}>
      <div className="form">
        <label>Savol matni<textarea rows={3} value={q.text} onChange={(e) => set({ text: e.target.value })} /></label>
        <fieldset>
          <legend>Variantlar (to'g'risini belgilang)</legend>
          {q.options.map((o, i) => (
            <div key={i} className="opt-edit">
              <input type="radio" name="correct" checked={q.correct === i} onChange={() => set({ correct: i })} aria-label="To'g'ri javob" />
              <input value={o} onChange={(e) => { const opts = [...q.options]; opts[i] = e.target.value; set({ options: opts }); }} placeholder={`Variant ${i + 1}`} />
              {q.options.length > 2 && <button type="button" className="icon-btn" onClick={() => { const opts = q.options.filter((_, k) => k !== i); set({ options: opts, correct: q.correct === i ? 0 : q.correct > i ? q.correct - 1 : q.correct }); }}>✕</button>}
            </div>
          ))}
          {q.options.length < 5 && <button type="button" className="btn ghost small" onClick={() => set({ options: [...q.options, ''] })}>+ Variant</button>}
        </fieldset>
        <label>Izoh<textarea rows={3} value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} /></label>
        <div className="row-wrap">
          <label className="grow">Mavzu<select value={q.topic} onChange={(e) => set({ topic: e.target.value })}>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="grow">Bilet raqami<input type="number" min={1} value={q.ticket ?? ''} onChange={(e) => set({ ticket: Number(e.target.value) || undefined })} placeholder="avto" /></label>
        </div>
        <label>YHQ bandi<select value={q.rule ?? ''} onChange={(e) => set({ rule: e.target.value || undefined })}><option value="">—</option>{RULES.map((r) => <option key={r.id} value={r.id}>{r.chapter} · {r.title}</option>)}</select></label>
        <div className="row-wrap">
          <label className="grow">Yo'l belgisi<select value={q.sign ?? ''} onChange={(e) => set({ sign: e.target.value || undefined })}><option value="">—</option>{SIGNS.map((x) => <option key={x.id} value={x.id}>{x.code} {x.name}</option>)}</select></label>
          {sign && <RoadSign sign={sign} size={56} />}
        </div>
        <label>Rasm URL (ixtiyoriy)<input value={q.image ?? ''} onChange={(e) => set({ image: e.target.value || undefined })} placeholder="https://…" /></label>
        <label>Holat<select value={q.status} onChange={(e) => set({ status: e.target.value as QuestionStatus })}>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        {err && <p className="bad-text small">{err}</p>}
        <div className="row-end">
          <button className="btn ghost" onClick={onClose}>Bekor qilish</button>
          <button className="btn ghost" onClick={() => save('review')}>Tekshiruvga</button>
          <button className="btn" onClick={() => save()}>Saqlash</button>
        </div>
        {versions.length > 0 && (
          <details>
            <summary>Versiyalar tarixi ({versions.length})</summary>
            <ul className="plain small">
              {[...versions].reverse().map((v, i) => (
                <li key={i}>v{v.version} · {STATUS_LABEL[v.status]} · {v.updatedAt ? new Date(v.updatedAt).toLocaleString() : 'asl nusxa'}
                  <button className="btn ghost small" onClick={() => setQ({ ...v, options: [...v.options] })}>Tiklash</button></li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Modal>
  );
}

function ImportTab() {
  const s = useStore((x) => x);
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);
  const onFile = async (f: File) => {
    const { questions, errors } = questionsFromCSV(await f.text());
    if (questions.length) importQuestions(questions);
    setResult({ ok: questions.length, errors });
  };
  return (
    <section className="panel">
      <h3>CSV import / eksport</h3>
      <p className="muted small">Excel'dan "CSV UTF-8" sifatida saqlang. Ustunlar: id, ticket, topic, text, option1…option5, correct (1 dan boshlab), explanation, rule, sign, image, status (draft/review/published/archived). Bir xil id li savol yangilanadi.</p>
      <div className="row-wrap">
        <button className="btn" onClick={() => fileRef.current?.click()}>⬆ CSV import</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ''; }} />
        <button className="btn ghost" onClick={() => download('avtotest-savollar.csv', '﻿' + toCSV(allQuestions(s)), 'text/csv')}>⬇ Barcha savollarni eksport</button>
        <button className="btn ghost" onClick={() => download('shablon.csv', '﻿' + toCSV([]), 'text/csv')}>⬇ Bo'sh shablon</button>
      </div>
      {result && (
        <div className="notice small">
          <p>{result.ok} ta savol import qilindi (holati CSV dagi kabi; ko'rsatilmagan bo'lsa — qoralama).</p>
          {result.errors.length > 0 && <ul className="plain">{result.errors.slice(0, 20).map((e) => <li key={e} className="bad-text">{e}</li>)}</ul>}
        </div>
      )}
    </section>
  );
}

function StatsTab() {
  const s = useStore((x) => x);
  const rows = useMemo(() => allQuestions(s)
    .map((q) => ({ q, st: s.stats[q.id] }))
    .filter((r) => r.st && r.st.correct + r.st.wrong > 0)
    .map((r) => ({ ...r, rate: r.st!.wrong / (r.st!.correct + r.st!.wrong) }))
    .sort((a, b) => b.rate - a.rate || b.st!.wrong - a.st!.wrong), [s]);
  if (!rows.length) return <Empty>Hali javoblar yo'q. Statistika foydalanuvchilar javob bergandan keyin to'planadi.</Empty>;
  return (
    <table className="table">
      <thead><tr><th>Savol</th><th>Javoblar</th><th>Xato %</th></tr></thead>
      <tbody>{rows.slice(0, 50).map(({ q, st, rate }) => (
        <tr key={q.id}><td>{q.text}</td><td>{st!.correct + st!.wrong}</td><td className={rate > 0.5 ? 'bad-text' : ''}>{Math.round(rate * 100)}%</td></tr>
      ))}</tbody>
    </table>
  );
}

function ReportsTab() {
  const s = useStore((x) => x);
  const [filter, setFilter] = useState<'new' | 'resolved' | ''>('new');
  const list = [...s.reports].reverse().filter((r) => !filter || r.status === filter);
  const byId = new Map(allQuestions(s).map((q) => [q.id, q]));
  return (
    <>
      <div className="chips">
        {([['new', 'Yangi'], ['resolved', 'Hal qilindi'], ['', 'Barchasi']] as const).map(([k, l]) => <button key={k} className={'chip ' + (filter === k ? 'active' : '')} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {list.length === 0 ? <Empty>Xabarlar yo'q</Empty> : list.map((r) => (
        <div key={r.id} className="review-item">
          <p><b>{r.reason}</b> · <span className="muted small">{new Date(r.at).toLocaleString()}</span></p>
          <p className="small">{byId.get(r.qid)?.text ?? r.qid}</p>
          {r.comment && <p className="muted small">“{r.comment}”</p>}
          <button className="btn ghost small" onClick={() => setReportStatus(r.id, r.status === 'new' ? 'resolved' : 'new')}>{r.status === 'new' ? '✓ Hal qilindi' : 'Qayta ochish'}</button>
        </div>
      ))}
    </>
  );
}

function ExamTab() {
  const exam = useStore((s) => s.exam);
  const pin = useStore((s) => s.settings.adminPin);
  const [newPin, setNewPin] = useState('');
  const num = (v: string, min: number) => Math.max(min, Number(v) || min);
  return (
    <section className="panel form">
      <p className="notice small">Imtihon formati (20 savol / 25 daqiqa / 2 xato) taxminiy. Rasmiy manbadan tasdiqlangach shu yerda o'zgartiring.</p>
      <label>Savollar soni<input type="number" min={1} value={exam.questionCount} onChange={(e) => updateExamConfig({ questionCount: num(e.target.value, 1) })} /></label>
      <label>Vaqt (daqiqa)<input type="number" min={1} value={exam.minutes} onChange={(e) => updateExamConfig({ minutes: num(e.target.value, 1) })} /></label>
      <label>Ruxsat etilgan xatolar<input type="number" min={0} value={exam.maxErrors} onChange={(e) => updateExamConfig({ maxErrors: Math.max(0, Number(e.target.value) || 0) })} /></label>
      <label>Biletdagi savollar soni<input type="number" min={1} value={exam.ticketSize} onChange={(e) => updateExamConfig({ ticketSize: num(e.target.value, 1) })} /></label>
      <label className="check"><input type="checkbox" checked={exam.shuffleOptions} onChange={(e) => updateExamConfig({ shuffleOptions: e.target.checked })} /> Variantlarni aralashtirish</label>
      <hr />
      <label>Yangi admin PIN<input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder={pin === '1234' ? 'Standart PIN ishlatilmoqda' : ''} /></label>
      <button className="btn ghost" disabled={newPin.length < 4} onClick={() => { updateSettings({ adminPin: newPin }); setNewPin(''); }}>PIN ni o'zgartirish</button>
    </section>
  );
}
