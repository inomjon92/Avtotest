import { Link } from 'react-router-dom';
import { Empty, PageHeader, Progress, toneFor } from '../components/ui';
import { TOPICS } from '../data/topics';
import { readinessIndex } from '../lib/exam';
import { isMastered } from '../lib/srs';
import { dayStreak, publishedQuestions, todayKey, useStore, type AppState } from '../store/store';
import { useT } from '../store/i18n';

interface Achievement { id: string; icon: string; title: string; done: (s: AppState) => boolean }

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', icon: '🚀', title: 'Birinchi qadam — 1 ta savol', done: (s) => Object.keys(s.stats).length > 0 },
  { id: 'hundred', icon: '💯', title: '100 ta javob', done: (s) => Object.values(s.stats).reduce((a, x) => a + x.correct + x.wrong, 0) >= 100 },
  { id: 'exam1', icon: '🎓', title: "Birinchi imtihondan o'tish", done: (s) => s.attempts.some((a) => a.mode === 'exam' && a.passed) },
  { id: 'perfect', icon: '🏆', title: 'Xatosiz imtihon', done: (s) => s.attempts.some((a) => a.mode === 'exam' && a.passed && a.errors === 0) },
  { id: 'streak7', icon: '🔥', title: '7 kunlik seriya', done: (s) => dayStreak(s.activity) >= 7 },
  { id: 'signs', icon: '⚠️', title: 'Belgilar ustasi — barcha belgi savollari', done: (s) => {
    const qs = publishedQuestions(s).filter((q) => q.topic === 'belgilar');
    return qs.length > 0 && qs.every((q) => isMastered(s.stats[q.id]));
  } },
  { id: 'marathon', icon: '🏃', title: 'Marafonni tugatish', done: (s) => s.attempts.some((a) => a.mode === 'marathon' && a.answered >= a.total) },
];

export default function Stats() {
  const { t, tc } = useT();
  const s = useStore((x) => x);
  const pool = publishedQuestions(s);
  const mastered = pool.filter((q) => isMastered(s.stats[q.id])).length;
  const totalAnswers = Object.values(s.stats).reduce((a, x) => a + x.correct + x.wrong, 0);
  const totalCorrect = Object.values(s.stats).reduce((a, x) => a + x.correct, 0);
  const exams = s.attempts.filter((a) => a.mode === 'exam');
  const readiness = readinessIndex(exams.map((a) => ({ passed: !!a.passed, correct: a.correct, total: a.total })));

  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (27 - i));
    return { key: todayKey(d), n: s.activity[todayKey(d)] ?? 0 };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.n));

  return (
    <div className="page">
      <PageHeader title={t('Statistika')} back={false} />
      <div className="stat-tiles">
        <div className="tile"><span>{t('Umumiy progress')}</span><b>{pool.length ? Math.round((mastered / pool.length) * 100) : 0}%</b></div>
        <div className="tile"><span>{t('Tayyorlik indeksi')}</span><b>{readiness === null ? '—' : readiness + '%'}</b></div>
        <div className="tile"><span>Aniqlik</span><b>{totalAnswers ? Math.round((totalCorrect / totalAnswers) * 100) : 0}%</b></div>
        <div className="tile"><span>{t('Kunlik seriya')}</span><b>🔥 {dayStreak(s.activity)}</b></div>
      </div>
      {readiness === null && <p className="muted small">Tayyorlik indeksi kamida bitta imtihon simulyatsiyasidan keyin hisoblanadi (oxirgi 10 ta bo'yicha).</p>}

      <h3 className="section-title">{t('Zaif mavzular xaritasi')}</h3>
      <div className="heatmap">
        {TOPICS.map((tp) => {
          const qs = pool.filter((q) => q.topic === tp.id);
          if (!qs.length) return null;
          const seen = qs.filter((q) => s.stats[q.id]);
          const acc = seen.length ? Math.round((seen.reduce((a, q) => a + s.stats[q.id]!.correct, 0) / seen.reduce((a, q) => a + s.stats[q.id]!.correct + s.stats[q.id]!.wrong, 0)) * 100) : -1;
          const cls = acc < 0 ? 'none' : toneFor(acc);
          return (
            <Link key={tp.id} to={`/quiz/topic/${tp.id}`} className={'heat ' + cls} title={tc(tp.name)}>
              <span>{tp.icon}</span>
              <span className="small">{tc(tp.name)}</span>
              <b>{acc < 0 ? '—' : acc + '%'}</b>
            </Link>
          );
        })}
      </div>

      <h3 className="section-title">Faollik (28 kun)</h3>
      <div className="activity">
        {days.map((d) => <div key={d.key} className="act-cell" title={`${d.key}: ${d.n}`} style={{ opacity: d.n ? 0.25 + 0.75 * (d.n / maxDay) : 0.08 }} />)}
      </div>

      <h3 className="section-title">{t('Imtihonlar tarixi')}</h3>
      {exams.length === 0 ? <Empty>Hali imtihon topshirilmagan. <Link to="/quiz/exam">Boshlash →</Link></Empty> : (
        <table className="table">
          <thead><tr><th>Sana</th><th>Ball</th><th>Vaqt</th><th>{t('Natija')}</th></tr></thead>
          <tbody>
            {[...exams].reverse().slice(0, 20).map((a) => {
              const sec = Math.round((a.finishedAt - a.startedAt) / 1000);
              return (
                <tr key={a.id}>
                  <td>{new Date(a.startedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{a.correct}/{a.total}</td>
                  <td>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</td>
                  <td className={a.passed ? 'good-text' : 'bad-text'}>{a.passed ? "O'tdi" : "Yiqildi"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3 className="section-title">Yutuqlar</h3>
      <div className="achievements">
        {ACHIEVEMENTS.map((a) => {
          const done = a.done(s);
          return <div key={a.id} className={'ach ' + (done ? 'done' : '')}><span>{a.icon}</span><span className="small">{tc(a.title)}</span></div>;
        })}
      </div>

      <h3 className="section-title">Savollar bo'yicha</h3>
      <Progress value={pool.length ? (mastered / pool.length) * 100 : 0} tone="good" />
      <p className="muted small">{mastered} o'zlashtirilgan · {pool.filter((q) => s.stats[q.id] && !isMastered(s.stats[q.id])).length} jarayonda · {pool.filter((q) => !s.stats[q.id]).length} hali ochilmagan</p>
    </div>
  );
}
