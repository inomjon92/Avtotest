import { ApkLink } from '../components/ApkLink';
import { ContactLink } from '../components/ContactLink';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { advice, topicScores } from '../lib/analysis';
import { ACHIEVEMENTS, achievementStatus } from '../lib/achievements';
import { topicById } from '../data/topics';
import { unreadCount } from '../store/api';
import { PageHeader, Progress, toneFor } from '../components/ui';
import { EXAM_TIPS } from '../data/extra';
import { buildTickets, readinessIndex } from '../lib/exam';
import { RULES } from '../data/rules';
import { TOPICS } from '../data/topics';
import { isDue, isMastered } from '../lib/srs';
import { dayStreak, publishedQuestions, todayKey, useSession, useStore } from '../store/store';
import { useT } from '../store/i18n';

export default function Home() {
  const { t, tc } = useT();
  const s = useStore((x) => x);
  const pool = publishedQuestions(s);
  const mastered = pool.filter((q) => isMastered(s.stats[q.id])).length;
  const pct = pool.length ? Math.round((mastered / pool.length) * 100) : 0;
  const mistakes = pool.filter((q) => s.stats[q.id]?.inMistakes).length;
  const due = pool.filter((q) => isDue(s.stats[q.id])).length;
  const exams = s.attempts.filter((a) => a.mode === 'exam');
  const readiness = readinessIndex(exams.map((a) => ({ passed: !!a.passed, correct: a.correct, total: a.total })));
  const streak = dayStreak(s.activity);
  const today = s.activity[todayKey()] ?? 0;

  const daysLeft = s.settings.examDate ? Math.ceil((new Date(s.settings.examDate).getTime() - Date.now()) / 86400000) : null;
  const left = pool.length - mastered;
  const planPerDay = daysLeft && daysLeft > 0 ? Math.max(10, Math.ceil((left * 2) / daysLeft)) : s.settings.dailyGoal;
  const goal = planPerDay;
  const examDay = daysLeft !== null && daysLeft >= 0 && daysLeft <= 1;
  const session = useSession();
  const name = session?.user.name || s.settings.name;

  // O'tilganlar va keyingi qadam
  const tickets = buildTickets(pool, s.exam.ticketSize);
  const passedTicket = (n: number) => s.attempts.some((a) => a.mode === 'ticket' && a.title === `Bilet ${n}` && a.passed);
  const ticketsDone = [...tickets.keys()].filter(passedTicket).length;
  const nextTicket = [...tickets.keys()].find((n) => !passedTicket(n));
  const rulesDone = RULES.filter((r) => s.rulesRead[r.id]).length;
  const nextRule = RULES.find((r) => !s.rulesRead[r.id]);
  const topicsDone = TOPICS.filter((tp) => {
    const qs = pool.filter((q) => q.topic === tp.id);
    return qs.length > 0 && qs.every((q) => s.stats[q.id]?.lastCorrect);
  }).length;
  const last = s.attempts[s.attempts.length - 1];
  const tips = advice(topicScores(pool, s.stats), {
    readiness, examsTaken: exams.length, mistakes, rulesRead: rulesDone, rulesTotal: RULES.length, topicName: (id) => tc(topicById(id)?.name ?? id),
  });
  const earned = achievementStatus(s).filter((a) => a.done).length;
  const [unread, setUnread] = useState(0);
  useEffect(() => { if (session) unreadCount().then(setUnread).catch(() => {}); }, [session]);

  const teacher = session?.user.role === 'teacher';
  // Bosh sahifa menyusi: maqsad bo'yicha guruhlangan
  const menu: { title: string; items: { to: string; icon: string; label: string; color: string; sub?: string; badge?: number }[] }[] = [
    { title: 'Mashq qilish', items: [
      { to: '/tests#tickets', icon: '🎫', label: 'Biletlar', color: '#2563eb', sub: `${ticketsDone}/${tickets.size}` },
      { to: '/tests#topics', icon: '📚', label: 'Mavzular', color: '#7c3aed', sub: `${topicsDone}/${TOPICS.length}` },
      { to: '/quiz/marathon', icon: '🏃', label: 'Marafon', color: '#0891b2', sub: s.marathon.index ? `${s.marathon.index + 1}-savol` : undefined },
    ] },
    { title: 'Takrorlash', items: [
      { to: '/quiz/review', icon: '🧠', label: 'Aqlli takrorlash', color: '#db2777', badge: due },
      { to: '/quiz/mistakes', icon: '❌', label: 'Xatolar', color: '#dc2626', badge: mistakes },
      { to: '/quiz/favorites', icon: '⭐', label: 'Saralanganlar', color: '#d97706', badge: s.favorites.length },
    ] },
    { title: "O'rganish", items: [
      { to: '/guide/signs', icon: '⚠️', label: "Yo'l belgilari", color: '#ea580c' },
      { to: '/guide', icon: '📖', label: "Yo'riqnoma", color: '#16a34a', sub: `${rulesDone}/${RULES.length}` },
      { to: '/chat', icon: '💬', label: 'Yordamchi', color: '#0d9488', badge: unread },
    ] },
    { title: 'Hamjamiyat', items: [
      { to: '/rating', icon: '🏅', label: 'Reyting', color: '#ca8a04', sub: `${earned}/${ACHIEVEMENTS.length}` },
      { to: '/school', icon: teacher ? '👨‍🏫' : '👥', label: 'Avtomaktab', color: '#4f46e5' },
      { to: '/submit', icon: '✍️', label: 'Savol yuborish', color: '#64748b' },
    ] },
  ];

  return (
    <div className="page">
      <PageHeader title="Avtotest · B" back={false} right={<Link to="/settings" className="icon-btn" aria-label={t('Sozlamalar')}>⚙️</Link>} />

      <section className="hero">
        <div>
          <p className="muted">{t('Salom')}{name ? `, ${name}` : ''}!</p>
          <h2>{t('Umumiy progress')}: {pct}%</h2>
          <Progress value={pct} tone={toneFor(pct)} />
          <p className="muted small">{t("O'zlashtirilgan")}: {mastered} / {pool.length} {t('savol')}</p>
        </div>
        <div className="hero-stats">
          <div><b>🔥 {streak}</b><span>{t('Kunlik seriya')}</span></div>
          <div><b>{readiness === null ? '—' : readiness + '%'}</b><span>{t('Tayyorlik indeksi')}</span></div>
          <div><b>{today}/{goal}</b><span>{t('Bugun')}</span></div>
        </div>
      </section>

      {examDay && (
        <section className="notice">
          <b>🗓 {t('Imtihon kuni rejimi')}</b>
          <p>{daysLeft === 0 ? 'Imtihon bugun!' : 'Imtihon ertaga!'} Faqat xatolaringizni takrorlang va dam oling.</p>
          <Link className="btn" to="/quiz/mistakes">{t('Xatolar ustida ishlash')} ({mistakes})</Link>
        </section>
      )}
      <Link to="/quiz/exam" className="cta">
        <span className="cta-icon">🎓</span>
        <span><b>{t('Imtihon simulyatori')}</b><br /><small>{s.exam.questionCount} {t('savol')} · {s.exam.minutes} {t('daqiqa')} · {s.exam.maxErrors} {t('xato')}</small></span>
        <span>→</span>
      </Link>
      <nav className="home-menu" aria-label={t('Menyu')}>
        {menu.map((g) => (
          <section key={g.title} className="menu-group">
            <h3 className="menu-title">{t(g.title)}</h3>
            <div className="tiles">
              {g.items.map((it) => (
                <Link key={it.to} to={it.to} className="tile-link" style={{ '--tile': it.color } as React.CSSProperties}>
                  <span className="tile-icon" aria-hidden>{it.icon}</span>
                  <span className="tile-label">{t(it.label)}</span>
                  {it.sub && <span className="tile-sub">{it.sub}</span>}
                  {!!it.badge && <span className="badge tile-badge">{it.badge}</span>}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </nav>
      <section className="panel">
        <h3>📌 {t("O'tilganlar")}</h3>
        <div className="done-grid">
          <Link to="/tests#tickets"><b>{ticketsDone}/{tickets.size}</b><span>{t('Biletlar')}</span></Link>
          <Link to="/guide"><b>{rulesDone}/{RULES.length}</b><span>{t('Darslar')}</span></Link>
          <Link to="/tests#topics"><b>{topicsDone}/{TOPICS.length}</b><span>{t('Mavzular')}</span></Link>
        </div>
        {last && (
          <p className="small">{t('Oxirgi test')}: <b>{last.title}</b> — {last.correct}/{last.total}{last.passed !== undefined && (last.passed ? ' ✓' : ' ✗')} · <span className="muted">{new Date(last.finishedAt).toLocaleDateString('ru-RU')}</span>
            {last.path && <> · <Link to={last.path}>{t('Qayta ishlash')}</Link></>}</p>
        )}
        <div className="row-wrap">
          {nextRule && <Link className="btn ghost small" to={`/guide/rules/${nextRule.id}`}>📖 {t('Keyingi dars')}: {tc(nextRule.title)}</Link>}
          {nextTicket && <Link className="btn ghost small" to={`/quiz/ticket/${nextTicket}`}>🎫 {t('Keyingi bilet')}: {nextTicket}</Link>}
          {mistakes > 0 && <Link className="btn ghost small" to="/quiz/mistakes">❌ {t('Xatolar')}: {mistakes}</Link>}
        </div>
      </section>
      {tips.length > 0 && (
        <section className="panel">
          <h3>🧭 {t('Siz uchun tavsiyalar')}</h3>
          <div className="advice">
            {tips.map((a, i) => (
              <div key={i} className="advice-item">
                <span className="card-icon">{a.icon}</span>
                <span className="grow small">{a.text}</span>
                {a.to && <Link className="btn ghost small" to={a.to}>{a.action ?? 'Ochish'}</Link>}
              </div>
            ))}
          </div>
        </section>
      )}

      {daysLeft !== null && daysLeft > 1 && (
        <section className="panel">
          <h3>{t("Shaxsiy o'quv reja")}</h3>
          <p>{t('Imtihongacha')} <b>{daysLeft}</b> {t('kun')}. {t('Har kuni kamida')} <b>{planPerDay}</b> {t('ta savol ishlang')}.</p>
          <Progress value={(today / planPerDay) * 100} tone={today >= planPerDay ? 'good' : 'warn'} />
        </section>
      )}
      {!s.settings.examDate && <p className="muted small center"><Link to="/settings">Imtihon sanasini kiriting</Link> — shaxsiy kunlik reja tuziladi.</p>}

      <section className="panel">
        <h3>💡 {t('Maslahat')}</h3>
        <p>{tc(EXAM_TIPS[new Date().getDate() % EXAM_TIPS.length])}</p>
      </section>
      <ContactLink />
      <ApkLink />
    </div>
  );
}
