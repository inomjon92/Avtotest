import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { Question } from '../data/types';
import { signById } from '../data/signs';
import { ruleById } from '../data/rules';
import { topicById } from '../data/topics';
import { RoadSign } from '../components/RoadSign';
import { Scene } from '../components/Scene';
import { Art } from '../components/Art';
import { Modal, PageHeader, Empty } from '../components/ui';
import { buildTickets, examOutcome, pickExamQuestions } from '../lib/exam';
import { hashString, seeded, shuffle } from '../lib/random';
import { isDue } from '../lib/srs';
import {
  addLocalReport, getState, publishedQuestions, recordAnswer, saveAttempt, setMarathon, toggleFavorite, useStore,
  type AppState, type Attempt, type Mode,
} from '../store/store';
import { useT } from '../store/i18n';
import { sendReport } from '../store/api';

interface QuizSpec { title: string; questions: Question[]; mode: Mode }

export function resolveQuiz(s: AppState, mode: Mode, param?: string): QuizSpec {
  const pool = publishedQuestions(s);
  switch (mode) {
    case 'ticket': {
      const n = Number(param);
      return { mode, title: `Bilet ${n}`, questions: buildTickets(pool, s.exam.ticketSize).get(n) ?? [] };
    }
    case 'topic':
      return { mode, title: topicById(param ?? '')?.name ?? 'Mavzu', questions: pool.filter((q) => q.topic === param) };
    case 'exam':
      return { mode, title: 'Imtihon simulyatori', questions: pickExamQuestions(pool, s.exam.questionCount) };
    case 'mistakes':
      return { mode, title: 'Xatolar ustida ishlash', questions: pool.filter((q) => s.stats[q.id]?.inMistakes) };
    case 'favorites':
      return { mode, title: 'Saralanganlar', questions: pool.filter((q) => s.favorites.includes(q.id)) };
    case 'marathon':
      return { mode, title: 'Marafon', questions: pool };
    case 'review': {
      const now = Date.now();
      const due = pool.filter((q) => isDue(s.stats[q.id], now)).sort((a, b) => (s.stats[a.id]?.box ?? 0) - (s.stats[b.id]?.box ?? 0));
      const fresh = pool.filter((q) => !s.stats[q.id]);
      return { mode, title: 'Aqlli takrorlash', questions: [...due, ...fresh].slice(0, Math.max(10, s.settings.dailyGoal)) };
    }
    case 'hard': {
      const rate = (id: string) => { const st = s.stats[id]; return st ? st.wrong / Math.max(1, st.correct + st.wrong) : 0; };
      const hard = pool.filter((q) => (q.difficulty ?? 1) >= 3 || rate(q.id) >= 0.5);
      return { mode, title: 'Qiyin savollar', questions: shuffle(hard).slice(0, 30) };
    }
    default:
      return { mode, title: 'Test', questions: [] };
  }
}

const REPORT_REASONS = ["Javob noto'g'ri", "Savol matnida xato", 'Izoh tushunarsiz', 'Rasm mos emas', 'Boshqa'];

export default function Quiz() {
  const { mode = 'exam', param } = useParams();
  const { pathname } = useLocation();
  const { t, tc, lang } = useT();
  const cfg = useStore((s) => s.exam);
  const favorites = useStore((s) => s.favorites);
  const isExam = mode === 'exam';

  const [spec, setSpec] = useState<QuizSpec>(() => resolveQuiz(getState(), mode as Mode, param));
  const [seed, setSeed] = useState(() => Date.now());
  const [index, setIndex] = useState(() => (mode === 'marathon' ? Math.min(getState().marathon.index, Math.max(0, spec.questions.length - 1)) : 0));
  const [answers, setAnswers] = useState<Record<string, number>>(() => (mode === 'marathon' ? { ...getState().marathon.answers } : {}));
  const [times, setTimes] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState<Attempt | null>(null);
  const [zoom, setZoom] = useState(false);
  const [report, setReport] = useState(false);
  const startedAt = useRef(Date.now());
  const shownAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());

  const q = spec.questions[index];
  const order = useMemo(() => {
    if (!q) return [];
    const idx = q.options.map((_, i) => i);
    return cfg.shuffleOptions ? shuffle(idx, seeded(hashString(q.id) ^ seed)) : idx;
  }, [q, seed, cfg.shuffleOptions]);

  const answeredCount = Object.keys(answers).filter((id) => spec.questions.some((x) => x.id === id)).length;
  const errors = spec.questions.filter((x) => answers[x.id] !== undefined && answers[x.id] !== x.correct).length;
  const deadline = startedAt.current + cfg.minutes * 60000;
  const remaining = Math.max(0, deadline - now);

  const finish = useCallback((timeUp = false) => {
    const qs = spec.questions;
    const answered = qs.filter((x) => answers[x.id] !== undefined);
    const correct = answered.filter((x) => answers[x.id] === x.correct).length;
    const errs = answered.length - correct;
    const outcome = examOutcome(answered.length, errs, qs.length, cfg, timeUp || isExam);
    const a: Attempt = {
      id: 'a' + Date.now().toString(36), mode: spec.mode, title: spec.title,
      path: pathname, startedAt: startedAt.current, finishedAt: Date.now(), total: qs.length, answered: answered.length, correct, errors: errs,
      passed: spec.mode === 'exam' || spec.mode === 'ticket' ? outcome === 'passed' : undefined,
      answers: answered.map((x) => ({ qid: x.id, chosen: answers[x.id], correct: answers[x.id] === x.correct, ms: times[x.id] ?? 0 })),
    };
    if (answered.length > 0) saveAttempt(a);
    if (spec.mode === 'marathon') setMarathon({ index: 0, answers: {} });
    setFinished(a);
  }, [spec, answers, times, cfg, isExam, pathname]);

  // Taymer (faqat imtihonda)
  useEffect(() => {
    if (!isExam || finished) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [isExam, finished]);
  useEffect(() => {
    if (isExam && !finished && remaining <= 0) finish(true);
  }, [isExam, finished, remaining, finish]);

  useEffect(() => { shownAt.current = Date.now(); window.speechSynthesis?.cancel(); }, [index]);

  const choose = (opt: number) => {
    if (!q || answers[q.id] !== undefined || finished) return;
    const ok = opt === q.correct;
    const nextAnswers = { ...answers, [q.id]: opt };
    setAnswers(nextAnswers);
    setTimes((t0) => ({ ...t0, [q.id]: Date.now() - shownAt.current }));
    recordAnswer(q.id, ok);
    if (spec.mode === 'marathon') setMarathon({ index, answers: nextAnswers });
    if (isExam) {
      const errs = spec.questions.filter((x) => nextAnswers[x.id] !== undefined && nextAnswers[x.id] !== x.correct).length;
      if (errs > cfg.maxErrors) setTimeout(() => finishRef.current(), 900);
    }
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const next = () => {
    const nextUnanswered = spec.questions.findIndex((x, i) => i > index && answers[x.id] === undefined);
    const anyUnanswered = spec.questions.findIndex((x) => answers[x.id] === undefined);
    if (index < spec.questions.length - 1) {
      const target = isExam && nextUnanswered >= 0 ? nextUnanswered : index + 1;
      setIndex(target);
      if (spec.mode === 'marathon') setMarathon({ index: target, answers });
    } else if (anyUnanswered >= 0 && anyUnanswered !== index) setIndex(anyUnanswered);
    else finish();
  };

  // Klaviatura: 1–5 javob, Enter/→ keyingi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || zoom || report) return;
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) choose(order[n - 1]);
      else if ((e.key === 'Enter' || e.key === 'ArrowRight') && q && answers[q.id] !== undefined) next();
      else if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const speak = () => {
    if (!q || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance([tc(q.text), ...order.map((o, i) => `${i + 1}. ${tc(q.options[o])}`)].join('. '));
    u.lang = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const restart = () => {
    const s = resolveQuiz(getState(), mode as Mode, param);
    setSpec(s); setSeed(Date.now()); setIndex(0); setAnswers({}); setTimes({}); setFinished(null);
    startedAt.current = Date.now(); setNow(Date.now());
  };

  if (spec.questions.length === 0) {
    return (<div className="page"><PageHeader title={t(spec.title)} />
      <Empty>{t("Hozircha bo'sh")}. {mode === 'mistakes' ? "Xato qilingan savollar shu yerga tushadi." : mode === 'favorites' ? "Savollardagi ☆ tugmasi bilan saralang." : ''}<br /><Link className="btn" to="/tests">{t('Testlar')}</Link></Empty>
    </div>);
  }

  if (finished) return <Result attempt={finished} questions={spec.questions} answers={answers} isExam={isExam} onRestart={restart} />;

  const chosen = answers[q.id];
  const answered = chosen !== undefined;
  const sign = signById(q.sign);
  const rule = ruleById(q.rule);
  const mm = Math.floor(remaining / 60000), ss = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="page quiz">
      <PageHeader title={tc(spec.title)} right={isExam
        ? <span className={'timer' + (remaining < 60000 ? ' danger' : '')} aria-label={t('Qolgan vaqt')}>⏱ {mm}:{String(ss).padStart(2, '0')}</span>
        : <button className="icon-btn" onClick={() => finish()} title={t('Yakunlash')}>⏹</button>} />

      <nav className="qnav" aria-label="Savollar">
        {spec.questions.map((x, i) => {
          const a = answers[x.id];
          const cls = a === undefined ? '' : a === x.correct ? 'ok' : 'bad';
          return <button key={x.id} className={`qdot ${cls} ${i === index ? 'cur' : ''}`} onClick={() => setIndex(i)} aria-label={`${t('Savol')} ${i + 1}`}>{i + 1}</button>;
        })}
      </nav>

      {isExam && <div className="exam-bar"><span>{t("Javob berilgan")}: {answeredCount}/{spec.questions.length}</span><span className={errors > 0 ? 'bad-text' : ''}>{t('xato')}: {errors}/{cfg.maxErrors}</span></div>}

      <article className="question">
        <div className="q-media">
          <button className="sign-btn" onClick={() => setZoom(true)} aria-label="Kattalashtirish"><QuestionMedia q={q} size={150} /></button>
        </div>
        <div className="q-meta">
          <span>{t('Savol')} {index + 1} / {spec.questions.length}</span>
          <span className="q-tools">
            <button className="icon-btn" onClick={speak} title={t("Ovozli o'qish")} aria-label={t("Ovozli o'qish")}>🔊</button>
            <button className="icon-btn" onClick={() => toggleFavorite(q.id)} title={t('Saralash')} aria-pressed={favorites.includes(q.id)}>{favorites.includes(q.id) ? '★' : '☆'}</button>
            <button className="icon-btn" onClick={() => setReport(true)} title={t('Xato haqida xabar berish')}>⚑</button>
          </span>
        </div>
        <h2 className="q-text">{tc(q.text)}</h2>
        <ol className="options">
          {order.map((o, i) => {
            let cls = '';
            if (answered) {
              if (o === q.correct) cls = 'correct';
              else if (o === chosen) cls = 'wrong';
            }
            return (
              <li key={o}>
                <button className={'option ' + cls} onClick={() => choose(o)} disabled={answered}>
                  <span className="opt-n">{i + 1}</span><span>{tc(q.options[o])}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {answered && !isExam && (
          <div className={'explain ' + (chosen === q.correct ? 'ok' : 'bad')}>
            <strong>{chosen === q.correct ? '✓ ' + t("To'g'ri") : '✗ ' + t("Noto'g'ri")}</strong>
            {q.explanation && <p>{tc(q.explanation)}</p>}
            {rule && <Link to={`/guide/rules/${rule.id}`} className="rule-link">📖 {tc(rule.chapter)} — {tc(rule.title)}</Link>}
          </div>
        )}
        {answered && isExam && <div className={'explain ' + (chosen === q.correct ? 'ok' : 'bad')}><strong>{chosen === q.correct ? '✓ ' + t("To'g'ri") : '✗ ' + t("Noto'g'ri")}</strong></div>}
      </article>

      <div className="quiz-actions">
        <button className="btn ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>← {t('Oldingi')}</button>
        {answeredCount === spec.questions.length
          ? <button className="btn" onClick={() => finish()}>{t('Yakunlash')}</button>
          : <button className="btn" onClick={next} disabled={!answered && isExam}>{t('Keyingi')} →</button>}
      </div>

      <Modal open={zoom} onClose={() => setZoom(false)} title={sign && !q.scene ? `${sign.code} ${tc(sign.name)}` : tc(q.text)}>
        <div className="zoom"><QuestionMedia q={q} size={320} /></div>
        {sign && <p>{sign.code} {tc(sign.name)}: {tc(sign.description)}</p>}
      </Modal>
      <ReportModal open={report} onClose={() => setReport(false)} qid={q.id} />
    </div>
  );
}

function ReportModal({ open, onClose, qid }: { open: boolean; onClose: () => void; qid: string }) {
  const { t } = useT();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  useEffect(() => { if (open) { setSent(false); setComment(''); } }, [open]);
  return (
    <Modal open={open} onClose={onClose} title={t('Xato haqida xabar berish')}>
      {sent ? <p>Rahmat! Xabaringiz moderatorga yuborildi.</p> : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          try { await sendReport({ qid, reason, comment }); } catch { addLocalReport({ qid, reason, comment }); }
          setSent(true);
        }}>
          <div className="radio-list">
            {REPORT_REASONS.map((r) => <label key={r}><input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} /> {r}</label>)}
          </div>
          <textarea placeholder="Izoh (ixtiyoriy)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          <div className="row-end"><button type="button" className="btn ghost" onClick={onClose}>{t('Bekor qilish')}</button><button className="btn">{t('Yuborish')}</button></div>
        </form>
      )}
    </Modal>
  );
}

function Result({ attempt, questions, answers, isExam, onRestart }: { attempt: Attempt; questions: Question[]; answers: Record<string, number>; isExam: boolean; onRestart: () => void }) {
  const { t, tc } = useT();
  const cfg = useStore((s) => s.exam);
  const wrong = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== q.correct);
  const [filter, setFilter] = useState<'all' | 'wrong'>(wrong.length ? 'wrong' : 'all');
  const shown = filter === 'all' ? questions : wrong;
  const timeUp = isExam && attempt.finishedAt - attempt.startedAt >= cfg.minutes * 60000 - 1000;
  const pct = attempt.total ? Math.round((attempt.correct / attempt.total) * 100) : 0;
  const secs = Math.round((attempt.finishedAt - attempt.startedAt) / 1000);
  return (
    <div className="page">
      <PageHeader title={t('Natija')} />
      <section className={'result ' + (attempt.passed === false ? 'fail' : 'pass')}>
        <div className="result-icon">{attempt.passed === false ? '😕' : '🎉'}</div>
        <h2>{attempt.passed === undefined ? `${attempt.correct} / ${attempt.total}` : attempt.passed ? t("Imtihondan o'tdingiz!") : t("Imtihondan o'ta olmadingiz")}</h2>
        {timeUp && <p className="bad-text">{t('Vaqt tugadi')}</p>}
        <div className="result-stats">
          <div><b>{attempt.correct}</b><span>{t("To'g'ri")}</span></div>
          <div><b>{attempt.errors}</b><span>{t("Noto'g'ri")}</span></div>
          <div><b>{pct}%</b><span>ball</span></div>
          <div><b>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</b><span>vaqt</span></div>
        </div>
        <div className="row-center">
          <button className="btn" onClick={onRestart}>{t('Qayta urinish')}</button>
          {wrong.length > 0 && <Link className="btn ghost" to="/quiz/mistakes">{t("Xatolar ustida ishlash")}</Link>}
          <Link className="btn ghost" to="/">{t('Bosh sahifaga')}</Link>
        </div>
      </section>
      <section>
        <div className="review-head">
          <h3>{t("Javoblar tahlili")}</h3>
          <div className="chips">
            <button className={'chip ' + (filter === 'all' ? 'active' : '')} onClick={() => setFilter('all')}>{t('Barchasi')} ({questions.length})</button>
            <button className={'chip ' + (filter === 'wrong' ? 'active' : '')} onClick={() => setFilter('wrong')}>{t("Noto'g'ri")} ({wrong.length})</button>
          </div>
        </div>
        {shown.map((q) => {
          const rule = ruleById(q.rule);
          const a = answers[q.id];
          const state = a === undefined ? 'skip' : a === q.correct ? 'ok' : 'bad';
          return (
            <div key={q.id} className={'review-item ' + state}>
              <div className="review-row">
                <span className="review-n">{questions.indexOf(q) + 1}</span>
                <p className="q-text small">{tc(q.text)}</p>
                {(q.scene || q.sign || q.image) && <span className="review-thumb"><QuestionMedia q={q} size={64} /></span>}
              </div>
              {state === 'bad' && <p className="bad-text">✗ {t('Sizning javobingiz')}: {tc(q.options[a])}</p>}
              {state === 'skip' && <p className="muted">— {t('Javob berilmagan')}</p>}
              <p className="good-text">✓ {t("To'g'ri javob")}: {tc(q.options[q.correct])}</p>
              {q.explanation && <p className="muted small">{tc(q.explanation)}</p>}
              {rule && <Link to={`/guide/rules/${rule.id}`} className="rule-link">📖 {tc(rule.title)}</Link>}
            </div>
          );
        })}
      </section>
    </div>
  );
}

export function QuestionMedia({ q, size }: { q: Question; size: number }) {
  const sign = signById(q.sign);
  if (q.scene) return <Scene scene={q.scene} size={size * 1.6} />;
  if (q.image) return <img src={q.image} alt="" className="q-img" style={{ maxHeight: size * 1.8 }} />;
  if (q.art) return <Art name={q.art} size={size * 1.8} />;
  if (sign) return <RoadSign sign={sign} size={size} />;
  return <div className="q-placeholder" style={{ fontSize: size / 3 }}>{topicById(q.topic)?.icon ?? '🚗'}</div>;
}
