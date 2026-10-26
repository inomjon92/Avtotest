import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { getState, initialState, replaceState, setGuest, updateSettings, useSession, useStore, type Lang } from '../store/store';
import { api, logout } from '../store/api';
import { useT } from '../store/i18n';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'uz', label: "O'zbekcha (lotin)" },
  { id: 'uzc', label: 'Ўзбекча (кирилл)' },
  { id: 'ru', label: 'Русский (интерфейс)' },
];

export function download(name: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function Settings() {
  const { t } = useT();
  const st = useStore((s) => s.settings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const session = useSession();

  const importData = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (data?.v !== 1 || typeof data.settings !== 'object') throw new Error('format');
      replaceState({ ...initialState(), ...data });
      setMsg("Ma'lumotlar tiklandi");
    } catch {
      setMsg("Fayl formati noto'g'ri");
    }
  };

  return (
    <div className="page">
      <PageHeader title={t('Sozlamalar')} back={false} />
      <section className="panel">
        {session ? (<>
          <div className="account">
            <span className="avatar">{(session.user.name || session.user.login)[0]?.toUpperCase()}</span>
            <span className="grow"><b>{session.user.name}</b><br /><span className="muted small">@{session.user.login}</span></span>
            <button className="btn ghost small" onClick={() => { if (confirm('Hisobdan chiqasizmi?')) logout(); }}>{t('Chiqish')}</button>
          </div>
          <p className="muted small">Progressingiz serverda saqlanadi: boshqa telefon yoki kompyuterdan shu login bilan kirsangiz, davom ettirasiz.</p>
          <ChangePassword />
        </>) : (<>
          <p><b>Mehmon rejimi</b></p>
          <p className="muted small">Progress faqat shu qurilmada. Hisob ochsangiz, natijalaringiz saqlanadi va boshqa qurilmadan ham ko'rinadi.</p>
          <button className="btn" onClick={() => setGuest(false)}>{t('Kirish')} / {t("Ro'yxatdan o'tish")}</button>
        </>)}
      </section>

      <section className="panel form">
        <label>{t('Ism')}<input value={st.name} onChange={(e) => updateSettings({ name: e.target.value })} placeholder="Ismingiz" /></label>
        <label>{t('Imtihon sanasi')}<input type="date" value={st.examDate} onChange={(e) => updateSettings({ examDate: e.target.value })} /></label>
        <label>{t('Kunlik maqsad')} ({st.dailyGoal} {t('savol')})
          <input type="range" min={10} max={200} step={10} value={st.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })} />
        </label>
      </section>

      <section className="panel form">
        <label>{t('Til')}
          <select value={st.lang} onChange={(e) => updateSettings({ lang: e.target.value as Lang })}>
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        {st.lang === 'ru' && <p className="muted small">Savollar hozircha o'zbek tilida. Rus va qoraqalpoq tilidagi baza admin panel orqali import qilinadi.</p>}
        <label>{t("Ko'rinish")}
          <select value={st.theme} onChange={(e) => updateSettings({ theme: e.target.value as typeof st.theme })}>
            <option value="system">{t('Tizim')}</option><option value="light">{t("Yorug'")}</option><option value="dark">{t("Qorong'i")}</option>
          </select>
        </label>
        <label>{t("Shrift o'lchami")} ({Math.round(st.fontScale * 100)}%)
          <input type="range" min={0.85} max={1.4} step={0.05} value={st.fontScale} onChange={(e) => updateSettings({ fontScale: Number(e.target.value) })} />
        </label>
        <label>BHM (bazaviy hisoblash miqdori), so'm
          <input type="number" min={0} step={1000} value={st.bhm} onChange={(e) => updateSettings({ bhm: Number(e.target.value) || 0 })} />
        </label>
      </section>

      <section className="panel">
        <h3>Ma'lumotlar</h3>
        <p className="muted small">Progress shu qurilmada saqlanadi va internetsiz ishlaydi. Boshqa qurilmaga o'tkazish uchun eksport qiling.</p>
        <div className="row-wrap">
          <button className="btn ghost" onClick={() => download(`avtotest-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(getState()))}>⬇ {t("Ma'lumotlarni eksport qilish")}</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>⬆ {t("Ma'lumotlarni import qilish")}</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          <button className="btn danger" onClick={() => { if (confirm("Barcha progress o'chiriladi. Davom etasizmi?")) replaceState(initialState()); }}>{t('Hammasini tozalash')}</button>
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>

      <section className="panel">
        <Link to="/admin" className="list-item">🛠 {t('Admin panel')} <span className="muted small">(administrator kirishi)</span></Link>
        <p className="muted small">Avtotest v1.0 · Savollar bazasi namunaviy, rasmiy biletlar emas.</p>
      </section>
    </div>
  );
}

function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  if (!open) return <button className="btn ghost small" onClick={() => setOpen(true)}>Parolni o'zgartirish</button>;
  return (
    <form className="form" onSubmit={async (e) => {
      e.preventDefault();
      try { await api('/auth?action=password', { body: { password: cur, newPassword: next } }); setMsg("Parol o'zgartirildi"); setCur(''); setNext(''); }
      catch (err) { setMsg(err instanceof Error ? err.message : 'Xatolik'); }
    }}>
      <label>Joriy parol<input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required /></label>
      <label>Yangi parol<input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required /></label>
      {msg && <p className="small">{msg}</p>}
      <div className="row-wrap"><button className="btn small">Saqlash</button><button type="button" className="btn ghost small" onClick={() => setOpen(false)}>Yopish</button></div>
    </form>
  );
}
