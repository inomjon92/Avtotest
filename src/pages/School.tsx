// Avtomaktab kabineti: o'quvchi taklif kodi bilan guruhga qo'shiladi; o'qituvchi guruh ochadi va natijalarni kuzatadi.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Empty, Modal, PageHeader, Progress, toneFor } from '../components/ui';
import { topicScores } from '../lib/analysis';
import { topicById } from '../data/topics';
import { RatingTable } from './Rating';
import {
  createGroup, deleteGroup, getRating, groupDetail, joinGroup, kickMember, leaveGroup, memberDetail, mySchool, updateGroup,
  type JoinedGroup, type MemberSummary, type Rating, type SchoolGroup,
} from '../store/api';
import { publishedQuestions, todayKey, useSession, useStore } from '../store/store';
import { useT } from '../store/i18n';

const msg = (e: unknown) => (e instanceof Error ? e.message : 'Xatolik');
const ago = (d: string | null) => {
  if (!d) return '—';
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)} daq. oldin`;
  if (m < 1440) return `${Math.round(m / 60)} soat oldin`;
  return `${Math.round(m / 1440)} kun oldin`;
};

export default function School() {
  const { t } = useT();
  const session = useSession();
  const [data, setData] = useState<{ role: string; joined: JoinedGroup[]; groups: SchoolGroup[] } | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => { mySchool().then(setData).catch((e) => setError(msg(e))); }, []);
  useEffect(() => { if (session) reload(); }, [session, reload]);

  if (!session) return (
    <div className="page"><PageHeader title={t('Avtomaktab')} />
      <Empty>Avtomaktab guruhiga qo'shilish uchun <Link to="/settings">hisob oching</Link>.</Empty>
    </div>
  );
  return (
    <div className="page">
      <PageHeader title={t('Avtomaktab')} />
      {error && <p className="bad-text">{error}</p>}
      {!data ? <p className="muted">Yuklanmoqda…</p> : (<>
        {data.role === 'teacher' && <TeacherPanel groups={data.groups} reload={reload} />}
        <StudentPanel joined={data.joined} reload={reload} teacher={data.role === 'teacher'} />
      </>)}
    </div>
  );
}

// ---------- O'quvchi ----------

function StudentPanel({ joined, reload, teacher }: { joined: JoinedGroup[]; reload: () => void; teacher: boolean }) {
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<{ id: number; data: Rating | null } | null>(null);
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await joinGroup(code); setNote(`«${r.group.name}» guruhiga qo'shildingiz`); setCode(''); reload(); }
    catch (err) { setNote(msg(err)); }
  };
  const openRating = (id: number) => {
    setRating({ id, data: null });
    getRating('all', id).then((data) => setRating({ id, data })).catch((e) => setNote(msg(e)));
  };
  return (
    <section className="panel">
      <h3>🎒 {teacher ? "O'quvchi sifatida" : 'Mening guruhim'}</h3>
      {joined.length === 0 && !teacher && <p className="muted small">Avtomaktab o'qituvchingiz bergan 6 belgili kodni kiriting. O'qituvchi natijalaringizni ko'radi va sizga yordam beradi.</p>}
      {joined.map((g) => (
        <div key={g.id} className="list-item">
          <span className="grow"><b>{g.name}</b><br /><span className="muted small">O'qituvchi: {g.teacher}</span></span>
          <button className="btn ghost small" onClick={() => openRating(g.id)}>🏅 Reyting</button>
          <button className="btn ghost small" onClick={async () => { if (confirm('Guruhdan chiqasizmi? O\'qituvchi natijalaringizni ko\'rmaydi.')) { await leaveGroup(g.id); reload(); } }}>Chiqish</button>
        </div>
      ))}
      <form className="row-wrap" onSubmit={join}>
        <input className="grow code-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} placeholder="Taklif kodi, masalan K7M2QX" aria-label="Taklif kodi" />
        <button className="btn" disabled={code.length !== 6}>Qo'shilish</button>
      </form>
      {note && <p className="small">{note}</p>}
      {rating && (
        <Modal open onClose={() => setRating(null)} title="Guruh reytingi">
          {!rating.data ? <p className="muted">Yuklanmoqda…</p> : <RatingTable rows={rating.data.top} me={rating.data.me} />}
        </Modal>
      )}
    </section>
  );
}

// ---------- O'qituvchi ----------

function TeacherPanel({ groups, reload }: { groups: SchoolGroup[]; reload: () => void }) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState<number | null>(groups.length === 1 ? groups[0].id : null);
  const [note, setNote] = useState('');
  return (
    <section className="panel">
      <h3>👨‍🏫 O'qituvchi kabineti</h3>
      <p className="muted small">Guruh oching va taklif kodini o'quvchilarga bering. Ular ilovada «Avtomaktab» bo'limida kodni kiritadi.</p>
      <form className="row-wrap" onSubmit={async (e) => {
        e.preventDefault();
        try { const r = await createGroup(name); setName(''); setOpen(r.group.id); reload(); } catch (err) { setNote(msg(err)); }
      }}>
        <input className="grow" value={name} onChange={(e) => setName(e.target.value)} placeholder="Guruh nomi, masalan B-12 (kechki)" maxLength={80} />
        <button className="btn" disabled={name.trim().length < 2}>+ Guruh ochish</button>
      </form>
      {note && <p className="bad-text small">{note}</p>}
      {groups.length === 0 && <p className="muted small">Hali guruh yo'q.</p>}
      <div className="chips">
        {groups.map((g) => <button key={g.id} className={'chip ' + (open === g.id ? 'active' : '')} onClick={() => setOpen(g.id)}>{g.name} · {g.members}</button>)}
      </div>
      {open !== null && groups.some((g) => g.id === open) && <GroupView key={open} id={open} reload={reload} onDeleted={() => setOpen(null)} />}
    </section>
  );
}

type SortKey = 'name' | 'progress' | 'accuracy' | 'week' | 'exams' | 'seen';

function GroupView({ id, reload, onDeleted }: { id: number; reload: () => void; onDeleted: () => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof groupDetail>> | null>(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortKey>('progress');
  const [member, setMember] = useState<number | null>(null);
  const total = useStore((s) => publishedQuestions(s).length);
  const load = useCallback(() => { groupDetail(id).then(setData).catch((e) => setError(msg(e))); }, [id]);
  useEffect(load, [load]);
  if (error) return <p className="bad-text">{error}</p>;
  if (!data) return <p className="muted">Yuklanmoqda…</p>;

  const pct = (m: MemberSummary) => (total ? Math.round((m.mastered / total) * 100) : 0);
  const key: Record<SortKey, (m: MemberSummary) => number | string> = {
    name: (m) => m.name.toLowerCase(), progress: (m) => -pct(m), accuracy: (m) => -m.accuracy, week: (m) => -m.weekAnswers,
    exams: (m) => -m.examsPassed, seen: (m) => -(m.lastSeen ? new Date(m.lastSeen).getTime() : 0),
  };
  const members = [...data.members].sort((a, b) => (key[sort](a) < key[sort](b) ? -1 : key[sort](a) > key[sort](b) ? 1 : 0));
  const avg = (f: (m: MemberSummary) => number) => (members.length ? Math.round(members.reduce((n, m) => n + f(m), 0) / members.length) : 0);
  const ready = members.filter((m) => m.lastExam?.passed && pct(m) >= 80).length;
  const inactive = members.filter((m) => !m.lastSeen || Date.now() - new Date(m.lastSeen).getTime() > 3 * 86400000).length;
  const share = `Avtotest ilovasida «Avtomaktab» bo'limiga kiring va guruh kodini kiriting: ${data.group.code}`;

  const th = (k: SortKey, label: string) => <th className="clickable" onClick={() => setSort(k)}>{label}{sort === k ? ' ▾' : ''}</th>;
  return (
    <div className="group-view">
      <div className="invite">
        <span className="muted small">Taklif kodi</span>
        <b className="code">{data.group.code}</b>
        <button className="btn ghost small" onClick={() => { navigator.clipboard?.writeText(share); }}>📋 Nusxa</button>
        {'share' in navigator && <button className="btn ghost small" onClick={() => navigator.share({ text: share }).catch(() => {})}>↗ Ulashish</button>}
        <button className="btn ghost small" onClick={async () => { if (confirm("Yangi kod yaratilsinmi? Eski kod ishlamay qoladi (qo'shilganlar guruhda qoladi).")) { await updateGroup(id, { newCode: true }); load(); } }}>↻ Yangi kod</button>
      </div>

      <div className="stat-tiles">
        <div className="tile"><span>O'quvchilar</span><b>{members.length}</b></div>
        <div className="tile"><span>O'rtacha progress</span><b>{avg(pct)}%</b></div>
        <div className="tile"><span>O'rtacha aniqlik</span><b>{avg((m) => m.accuracy)}%</b></div>
        <div className="tile"><span>Imtihonga tayyor</span><b>{ready}</b></div>
      </div>
      {inactive > 0 && <p className="notice small">⚠️ {inactive} ta o'quvchi 3 kundan beri mashq qilmagan.</p>}

      {members.length === 0 ? <Empty>Guruhda hali o'quvchi yo'q. Kodni o'quvchilarga yuboring.</Empty> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr>{th('name', "O'quvchi")}{th('progress', 'Progress')}{th('accuracy', 'Aniqlik')}{th('week', '7 kun')}{th('exams', 'Imtihon')}{th('seen', 'Oxirgi faollik')}</tr></thead>
            <tbody>{members.map((m) => (
              <tr key={m.id} className="clickable" onClick={() => setMember(m.id)}>
                <td><b>{m.name}</b><br /><span className="muted small">@{m.login}</span></td>
                <td className="nowrap"><Progress value={pct(m)} tone={toneFor(pct(m))} /><span className="small">{pct(m)}% · {m.mastered}/{total}</span></td>
                <td className={m.answers ? (m.accuracy >= 80 ? 'good-text' : m.accuracy < 60 ? 'bad-text' : '') : 'muted'}>{m.answers ? m.accuracy + '%' : '—'}</td>
                <td>{m.weekAnswers}{m.streak >= 2 && <span className="small"> 🔥{m.streak}</span>}</td>
                <td className="nowrap">{m.examsPassed}/{m.exams}{m.lastExam && <><br /><span className={'small ' + (m.lastExam.passed ? 'good-text' : 'bad-text')}>oxirgi: {m.lastExam.correct}/{m.lastExam.total}</span></>}</td>
                <td className="nowrap small">{ago(m.lastSeen)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <div className="row-wrap">
        <button className="btn ghost small" onClick={load}>↻ Yangilash</button>
        <button className="btn ghost small" onClick={async () => { const n = prompt('Yangi nom', data.group.name); if (n?.trim()) { await updateGroup(id, { name: n }); load(); reload(); } }}>✏️ Nomini o'zgartirish</button>
        <button className="btn danger small" onClick={async () => { if (confirm("Guruh o'chirilsinmi? O'quvchilar hisoblari va natijalari saqlanib qoladi.")) { await deleteGroup(id); onDeleted(); reload(); } }}>Guruhni o'chirish</button>
      </div>
      {member !== null && <MemberModal group={id} user={member} onClose={() => setMember(null)} onKicked={() => { setMember(null); load(); reload(); }} />}
    </div>
  );
}

function MemberModal({ group, user, onClose, onKicked }: { group: number; user: number; onClose: () => void; onKicked: () => void }) {
  const { tc } = useT();
  const [data, setData] = useState<Awaited<ReturnType<typeof memberDetail>> | null>(null);
  const [error, setError] = useState('');
  const pool = publishedQuestions(useStore((s) => s));
  useEffect(() => { memberDetail(group, user).then(setData).catch((e) => setError(msg(e))); }, [group, user]);
  const scores = data ? topicScores(pool, data.stats).sort((a, b) => a.score - b.score) : [];
  const mistakes = data ? Object.values(data.stats).filter((x) => x.inMistakes).length : 0;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const k = todayKey(d);
    return { k, n: data?.activity[k] ?? 0 };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.n));
  return (
    <Modal open onClose={onClose} title={data ? data.member.name : "O'quvchi"}>
      {error && <p className="bad-text">{error}</p>}
      {!data ? <p className="muted">Yuklanmoqda…</p> : (
        <div className="form">
          <div className="stat-tiles">
            <div className="tile"><span>O'zlashtirilgan</span><b>{data.member.mastered}/{pool.length}</b></div>
            <div className="tile"><span>Javoblar / aniqlik</span><b>{data.member.answers} · {data.member.accuracy}%</b></div>
            <div className="tile"><span>Imtihonlar</span><b>{data.member.examsPassed}/{data.member.exams}</b></div>
            <div className="tile"><span>Xatolar ro'yxati</span><b>{mistakes}</b></div>
          </div>
          {data.member.examDate && <p className="small">Imtihon sanasi: <b>{data.member.examDate}</b></p>}
          <h4>Faollik (14 kun)</h4>
          <div className="activity small-act">{days.map((d) => <div key={d.k} className="act-cell" title={`${d.k}: ${d.n}`} style={{ opacity: d.n ? 0.25 + 0.75 * (d.n / maxDay) : 0.08 }} />)}</div>
          <h4>Mavzular (zaifdan kuchliga)</h4>
          <table className="table small">
            <thead><tr><th>Mavzu</th><th>Ko'rilgan</th><th>Aniqlik</th></tr></thead>
            <tbody>{scores.map((t) => (
              <tr key={t.topic}><td>{topicById(t.topic)?.icon} {tc(topicById(t.topic)?.name ?? t.topic)}</td><td>{t.seen}/{t.total}</td>
                <td className={t.seen ? (t.accuracy >= 0.8 ? 'good-text' : t.accuracy < 0.6 ? 'bad-text' : '') : 'muted'}>{t.seen ? Math.round(t.accuracy * 100) + '%' : '—'}</td></tr>
            ))}</tbody>
          </table>
          <h4>Oxirgi testlar</h4>
          {data.attempts.length === 0 ? <p className="muted small">Hali test ishlamagan</p> : (
            <ul className="plain small">{data.attempts.slice(0, 15).map((a, i) => (
              <li key={i}>{new Date(a.finishedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {a.title} · <span className={a.passed === false ? 'bad-text' : a.passed ? 'good-text' : ''}>{a.correct}/{a.total}</span></li>
            ))}</ul>
          )}
          <button className="btn danger small" onClick={async () => { if (confirm("O'quvchi guruhdan chiqarilsinmi?")) { await kickMember(group, user); onKicked(); } }}>Guruhdan chiqarish</button>
        </div>
      )}
    </Modal>
  );
}
