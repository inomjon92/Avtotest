import { achievementStatus } from '../lib/achievements';
import { useStore } from '../store/store';
import { useT } from '../store/i18n';

export default function Achievements({ limit }: { limit?: number }) {
  const { tc } = useT();
  const s = useStore((x) => x);
  const list = achievementStatus(s);
  // Olinganlar oldinda, keyin eng yaqinlari
  const sorted = [...list].sort((a, b) => Number(b.done) - Number(a.done) || b.cur / (b.target || 1) - a.cur / (a.target || 1));
  const shown = limit ? sorted.slice(0, limit) : sorted;
  return (
    <>
      <p className="muted small">{list.filter((a) => a.done).length} / {list.length} yutuq olingan</p>
      <div className="achievements">
        {shown.map((a) => (
          <div key={a.id} className={'ach ' + (a.done ? 'done' : '')} title={tc(a.hint)}>
            <span>{a.icon}</span>
            <span className="grow">
              <span className="small"><b>{tc(a.title)}</b></span><br />
              <span className="muted tiny">{tc(a.hint)}</span>
              {!a.done && a.target > 1 && <span className="ach-bar"><span style={{ width: `${(a.cur / a.target) * 100}%` }} /></span>}
              {!a.done && a.target > 1 && <span className="muted tiny"> {a.cur}/{a.target}</span>}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
