import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { RULES } from '../data/rules';
import { topicById } from '../data/topics';
import { advice, topicScores } from '../lib/analysis';
import { DEFAULT_FAQ, reply, type BotReply } from '../lib/chatbot';
import { readinessIndex } from '../lib/exam';
import { askAdmin, myMessages, type ChatMessage } from '../store/api';
import { publishedQuestions, setGuest, useSession, useStore } from '../store/store';

interface Line { from: 'me' | 'bot' | 'admin'; text: string; links?: BotReply['links']; ask?: string; at?: number }

const QUICK = ['Imtihon qanday?', 'Jarimalar', '2.4 belgisi', 'Qayerda ortdaman?', 'Savol yuborish'];

export default function Chat() {
  const s = useStore((x) => x);
  const session = useSession();
  const name = session?.user.name || s.settings.name;
  const [lines, setLines] = useState<Line[]>([{ from: 'bot', text: `Salom${name ? ', ' + name : ''}! Sizni ko'rganimdan xursandman 😊 Men Avtotest yordamchisiman. Savolingizni yozing yoki pastdagi tugmalardan birini tanlang.` }]);
  const [text, setText] = useState('');
  const [admin, setAdmin] = useState<ChatMessage[]>([]);
  const [sent, setSent] = useState<Record<string, 'busy' | 'ok' | string>>({});
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (session) myMessages().then(setAdmin).catch(() => {}); }, [session]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines, admin]);

  const ctx = useMemo(() => ({
    faq: s.faq?.length ? s.faq : DEFAULT_FAQ,
    exam: s.exam,
    bhm: s.settings.bhm,
    progressText: () => {
      const pool = publishedQuestions(s);
      const exams = s.attempts.filter((a) => a.mode === 'exam');
      const tips = advice(topicScores(pool, s.stats), {
        readiness: readinessIndex(exams.map((a) => ({ passed: !!a.passed, correct: a.correct, total: a.total }))),
        examsTaken: exams.length, mistakes: pool.filter((q) => s.stats[q.id]?.inMistakes).length,
        rulesRead: Object.keys(s.rulesRead).length, rulesTotal: RULES.length, topicName: (id) => topicById(id)?.name ?? id,
      });
      return tips.map((t) => `${t.icon} ${t.text}`).join('\n');
    },
  }), [s]);

  const send = (q: string) => {
    const msg = q.trim();
    if (!msg) return;
    const r = reply(msg, ctx);
    setLines((l) => [...l, { from: 'me', text: msg }, { from: 'bot', text: r.text, links: r.links, ask: r.unknown ? msg : undefined }]);
    setText('');
  };

  const toAdmin = async (q: string) => {
    setSent((x) => ({ ...x, [q]: 'busy' }));
    try {
      await askAdmin(q);
      setSent((x) => ({ ...x, [q]: 'ok' }));
      myMessages().then(setAdmin).catch(() => {});
    } catch (e) { setSent((x) => ({ ...x, [q]: e instanceof Error ? e.message : 'Xatolik' })); }
  };

  return (
    <div className="page chat-page">
      <PageHeader title="Yordamchi" />
      {admin.length > 0 && (
        <details className="panel" open={admin.some((m) => m.answer && !m.seen)}>
          <summary><b>Administratorga yozganlarim</b> <span className="muted small">({admin.length})</span></summary>
          <div className="chat-log">
            {[...admin].reverse().map((m) => (
              <div key={m.id}>
                <div className="bubble me">{m.text}</div>
                <div className={'bubble ' + (m.answer ? 'admin' : 'bot muted')}>{m.answer ? <><b>Admin:</b> {m.answer}</> : 'Javob kutilmoqda…'}</div>
              </div>
            ))}
          </div>
        </details>
      )}
      <div className="chat-log">
        {lines.map((l, i) => (
          <div key={i} className={'bubble ' + l.from}>
            <span className="pre">{l.text}</span>
            {l.links && <div className="row-wrap chat-links">{l.links.map((x) => <Link key={x.to} className="btn ghost small" to={x.to}>{x.label} →</Link>)}</div>}
            {l.ask && (
              session
                ? sent[l.ask] === 'ok' ? <p className="good-text small">✓ Administratorga yuborildi. Javob shu sahifada chiqadi.</p>
                  : <div className="chat-links"><button className="btn small" disabled={sent[l.ask] === 'busy'} onClick={() => toAdmin(l.ask!)}>📨 Adminga yuborish</button>
                    {sent[l.ask] && sent[l.ask] !== 'busy' && <p className="bad-text small">{sent[l.ask]}</p>}</div>
                : <p className="small"><button className="btn ghost small" onClick={() => setGuest(false)}>Kirish</button> Hisobga kirsangiz, savolni administratorga yubora olasiz.</p>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="chips">{QUICK.map((q) => <button key={q} className="chip" onClick={() => send(q)}>{q}</button>)}</div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Savolingizni yozing…" maxLength={1000} />
        <button className="btn" disabled={!text.trim()}>➤</button>
      </form>
    </div>
  );
}
