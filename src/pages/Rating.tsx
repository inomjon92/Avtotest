import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Achievements from '../components/Achievements';
import { Empty, PageHeader } from '../components/ui';
import { getRating, mySchool, type JoinedGroup, type Rating as RatingData, type RatingRow } from '../store/api';
import { syncNow } from '../store/api';
import { updateSettings, useSession, useStore } from '../store/store';
import { useT } from '../store/i18n';

const MEDAL = ['🥇', '🥈', '🥉'];

export function RatingTable({ rows, me }: { rows: RatingRow[]; me: RatingRow | null }) {
  if (!rows.length) return <Empty>Hali reytingda hech kim yo'q. Birinchi bo'ling!</Empty>;
  const meOutside = me && !rows.some((r) => r.me);
  return (
    <table className="table rating">
      <thead><tr><th>#</th><th>Ism</th><th>Ball</th><th>O'zl.</th><th>Aniqlik</th><th>🎓</th></tr></thead>
      <tbody>
        {rows.map((r) => <Row key={r.place} r={r} />)}
        {meOutside && <><tr><td colSpan={6} className="muted center">…</td></tr><Row r={me} /></>}
      </tbody>
    </table>
  );
}

function Row({ r }: { r: RatingRow }) {
  return (
    <tr className={r.me ? 'me' : ''}>
      <td className="nowrap">{MEDAL[r.place - 1] ?? r.place}</td>
      <td>{r.name}{r.me && <span className="muted small"> (siz)</span>}{r.streak >= 3 && <span className="small"> 🔥{r.streak}</span>}</td>
      <td><b>{r.score}</b></td>
      <td>{r.mastered}</td>
      <td>{r.accuracy}%</td>
      <td>{r.examsPassed}</td>
    </tr>
  );
}

export default function Rating() {
  const { t } = useT();
  const session = useSession();
  const hide = useStore((s) => !!s.settings.hideRating);
  const [period, setPeriod] = useState<'week' | 'all'>('week');
  const [scope, setScope] = useState<number>(0);
  const [groups, setGroups] = useState<JoinedGroup[]>([]);
  const [data, setData] = useState<RatingData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { if (session) mySchool().then((r) => setGroups(r.joined)).catch(() => {}); }, [session]);
  useEffect(() => {
    if (!session) return;
    setData(null); setError('');
    // Avval o'z natijalarimizni serverga yuboramiz, keyin reytingni olamiz
    syncNow().then(() => getRating(period, scope || undefined)).then(setData).catch((e) => setError(e.message));
  }, [session, period, scope, hide]);

  return (
    <div className="page">
      <PageHeader title={t('Reyting')} />
      {!session ? (
        <Empty>Reytingda qatnashish uchun <Link to="/settings">hisob oching</Link>. Yutuqlaringiz pastda.</Empty>
      ) : (<>
        <div className="segmented">
          <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>{t('Shu hafta')}</button>
          <button className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>{t('Umumiy')}</button>
        </div>
        {groups.length > 0 && (
          <div className="chips">
            <button className={'chip ' + (scope === 0 ? 'active' : '')} onClick={() => setScope(0)}>🌍 Hamma</button>
            {groups.map((g) => <button key={g.id} className={'chip ' + (scope === g.id ? 'active' : '')} onClick={() => setScope(g.id)}>👥 {g.name}</button>)}
          </div>
        )}
        {error && <p className="bad-text">{error}</p>}
        {!data && !error && <p className="muted">Yuklanmoqda…</p>}
        {data && (<>
          {data.me && <p className="notice small">Sizning o'rningiz: <b>{data.me.place}</b> / {data.total} · {data.me.score} ball</p>}
          <RatingTable rows={data.top} me={data.me} />
        </>)}
        <p className="muted tiny">
          {period === 'week' ? "Haftalik ball: oxirgi 7 kundagi javoblar soni + har bir o'tilgan imtihon uchun 20 ball." : "Umumiy ball: o'zlashtirilgan savol 5 ball, to'g'ri javob 1 ball, o'tilgan imtihon 20 ball."}
          {' '}Reytingda faqat ism va familiyaning birinchi harfi ko'rinadi.
        </p>
        <label className="check small">
          <input type="checkbox" checked={hide} onChange={(e) => updateSettings({ hideRating: e.target.checked })} /> Umumiy reytingda meni ko'rsatmang
        </label>
        <p className="small"><Link to="/school">👥 Avtomaktab guruhiga qo'shilish →</Link></p>
      </>)}

      <h3 className="section-title">{t('Yutuqlar')}</h3>
      <Achievements />
    </div>
  );
}
