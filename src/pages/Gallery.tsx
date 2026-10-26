// Barcha savollar rasmlari va belgilar bir sahifada (admin tekshiruvi uchun)
import { RoadSign } from '../components/RoadSign';
import { SIGNS } from '../data/signs';
import { allQuestions, useStore } from '../store/store';
import { QuestionMedia } from './Quiz';

export default function Gallery() {
  const s = useStore((x) => x);
  const qs = allQuestions(s);
  return (
    <div className="page gallery">
      <h2>Belgilar</h2>
      <div className="gallery-grid">
        {SIGNS.map((g) => <figure key={g.id}><RoadSign sign={g} size={90} /><figcaption>{g.code} {g.name}</figcaption></figure>)}
      </div>
      <h2>Savollar ({qs.length})</h2>
      <div className="gallery-grid wide">
        {qs.map((q) => (
          <figure key={q.id} id={q.id}>
            <div className="q-media"><QuestionMedia q={q} size={150} /></div>
            <figcaption><b>{q.id}</b> {q.text}<br /><span className="good-text">✓ {q.options[q.correct]}</span></figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
