import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        {title && <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Yopish">✕</button></div>}
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, back = true, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="page-header">
      {back ? <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label="Orqaga">←</button> : <span className="logo">🚗</span>}
      <h1>{title}</h1>
      <div className="page-header-right">{right}</div>
    </header>
  );
}

export function Card({ to, icon, title, subtitle, badge, onClick }: { to?: string; icon?: ReactNode; title: string; subtitle?: string; badge?: ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      {icon && <span className="card-icon">{icon}</span>}
      <span className="card-body"><span className="card-title">{title}</span>{subtitle && <span className="card-sub">{subtitle}</span>}</span>
      {badge !== undefined && <span className="badge">{badge}</span>}
    </>
  );
  if (to) return <Link className="card" to={to}>{inner}</Link>;
  return <button className="card" onClick={onClick}>{inner}</button>;
}

export function Progress({ value, tone }: { value: number; tone?: 'good' | 'warn' | 'bad' }) {
  return <div className="progress"><div className={'progress-bar ' + (tone ?? '')} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export const toneFor = (pct: number): 'good' | 'warn' | 'bad' => (pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad');

/** Parol maydoni: 👁 tugmasi bilan yozilgan parolni ko'rish mumkin */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <span className="pw-field">
      <input {...props} type={show ? 'text' : 'password'} />
      <button type="button" className="pw-eye" onClick={() => setShow(!show)} aria-label={show ? 'Parolni yashirish' : "Parolni ko'rsatish"} title={show ? 'Parolni yashirish' : "Parolni ko'rsatish"}>{show ? '🙈' : '👁'}</button>
    </span>
  );
}
