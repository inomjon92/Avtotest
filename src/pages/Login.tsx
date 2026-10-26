import { useState } from 'react';
import { apiAvailable, login, register } from '../store/api';
import { setGuest } from '../store/store';
import { useT } from '../store/i18n';

export default function Login() {
  const { t } = useT();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ login: '', password: '', password2: '', name: '' });
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const online = apiAvailable();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && form.password !== form.password2) return setError('Parollar mos emas');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.login.trim(), form.password, remember);
      else await register(form.login.trim(), form.password, form.name.trim(), remember);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🚗</div>
        <h1>Avtotest · B</h1>
        <p className="muted">Haydovchilik guvohnomasi nazariy imtihoniga tayyorlaning</p>

        {online ? (<>
          <div className="segmented">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>{t('Kirish')}</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>{t("Ro'yxatdan o'tish")}</button>
          </div>
          <form className="form" onSubmit={submit}>
            {mode === 'register' && <label>{t('Ism')}<input value={form.name} onChange={set('name')} autoComplete="name" required placeholder="Ism Familiya" /></label>}
            <label>{t('Login')}<input value={form.login} onChange={set('login')} autoComplete="username" autoCapitalize="none" required placeholder="masalan: akbar" /></label>
            <label>{t('Parol')}<input type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : 1} /></label>
            {mode === 'register' && <label>{t('Parolni takrorlang')}<input type="password" value={form.password2} onChange={set('password2')} autoComplete="new-password" required /></label>}
            <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> {t('Meni eslab qol')}</label>
            {error && <p className="bad-text small">{error}</p>}
            <button className="btn" disabled={busy}>{busy ? '…' : mode === 'login' ? t('Kirish') : t("Ro'yxatdan o'tish")}</button>
          </form>
          {mode === 'register' && <p className="muted small">Login: lotin harflari, raqamlar, _ yoki . (3–32 belgi). Parol kamida 8 belgi, harf va raqam bilan.</p>}
          {mode === 'login' && <p className="muted small">Hisobingiz yo'qmi? <button className="link-btn" onClick={() => setMode('register')}>{t("Ro'yxatdan o'ting")}</button></p>}
        </>) : (<>
          <p className="notice small">Server manzili sozlanmagan, shuning uchun hisobga kirib bo'lmaydi. Ilovadan mehmon sifatida foydalanishingiz mumkin.</p>
          <button className="btn ghost full" onClick={() => setGuest(true)}>{t('Mehmon sifatida davom etish')}</button>
        </>)}
        <a className="muted small" href="/admin">Administrator kirishi</a>
      </div>
    </div>
  );
}
