import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, PageHeader, Progress, toneFor } from '../components/ui';
import { TOPICS } from '../data/topics';
import { buildTickets } from '../lib/exam';
import { publishedQuestions, useStore } from '../store/store';
import { useT } from '../store/i18n';

export default function Tests() {
  const { t, tc } = useT();
  const s = useStore((x) => x);
  const loc = useLocation();
  const pool = publishedQuestions(s);
  const tickets = buildTickets(pool, s.exam.ticketSize);

  useEffect(() => {
    if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [loc.hash]);

  const lastTicketResult = (n: number) => [...s.attempts].reverse().find((a) => a.mode === 'ticket' && a.title === `Bilet ${n}`);
  const ticketPassed = (n: number) => s.attempts.some((a) => a.mode === 'ticket' && a.title === `Bilet ${n}` && a.passed);
  const passedCount = [...tickets.keys()].filter(ticketPassed).length;

  return (
    <div className="page">
      <PageHeader title={t('Testlar')} back={false} />
      <div className="grid">
        <Card to="/quiz/exam" icon="🎓" title={t('Imtihon simulyatori')} subtitle={`${s.exam.questionCount} ${t('savol')} · ${s.exam.minutes} ${t('daqiqa')}`} />
        <Card to="/quiz/review" icon="🧠" title={t('Aqlli takrorlash')} />
        <Card to="/quiz/mistakes" icon="❌" title={t('Xatolar ustida ishlash')} />
        <Card to="/quiz/favorites" icon="★" title={t('Saralanganlar')} />
        <Card to="/quiz/marathon" icon="🏃" title={t('Marafon')} subtitle={`${pool.length} ${t('savol')}`} />
        <Card to="/quiz/hard" icon="💪" title={t('Qiyin savollar')} subtitle={t('Murakkab vaziyatlar va xatolaringiz')} />
      </div>

      <h2 id="tickets" className="section-title">{t('Biletlar')} <span className="muted small">· {t("o'tilgan")}: {passedCount}/{tickets.size}</span></h2>
      <div className="tickets">
        {[...tickets.entries()].map(([n, qs]) => {
          const r = lastTicketResult(n);
          const cls = ticketPassed(n) ? 'ok' : r ? 'bad' : '';
          return (
            <Link key={n} to={`/quiz/ticket/${n}`} className={'ticket ' + cls} title={`${qs.length} ${t('savol')}`}>
              <b>{ticketPassed(n) ? '✓' : ''}{n}</b>
              <small>{r ? `${r.correct}/${r.total}` : `${qs.length} s.`}</small>
            </Link>
          );
        })}
      </div>

      <h2 id="topics" className="section-title">{t('Mavzular')}</h2>
      <div className="list">
        {TOPICS.map((tp) => {
          const qs = pool.filter((q) => q.topic === tp.id);
          if (qs.length === 0) return null;
          const answered = qs.filter((q) => s.stats[q.id]);
          const acc = answered.length ? Math.round((answered.filter((q) => s.stats[q.id]!.lastCorrect).length / qs.length) * 100) : 0;
          const done = acc === 100;
          return (
            <Link key={tp.id} to={`/quiz/topic/${tp.id}`} className="list-item">
              <span className="card-icon">{tp.icon}</span>
              <span className="grow">
                <span className="card-title">{done ? '✓ ' : ''}{tc(tp.name)}</span>
                <Progress value={acc} tone={toneFor(acc)} />
              </span>
              <span className="muted small nowrap">{answered.length}/{qs.length}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
