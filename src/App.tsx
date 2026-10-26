import { useEffect } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Tests from './pages/Tests';
import Quiz from './pages/Quiz';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Gallery from './pages/Gallery';
import { Documents, Fines, GuideHome, RuleDetail, RulesList, SignsCatalog, Tips } from './pages/Guide';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Submit from './pages/Submit';
import { useGuest, useSession, useStore } from './store/store';
import { loadContent, refreshMe, startSync, syncNow } from './store/api';
import { useT } from './store/i18n';

function useAppearance() {
  const theme = useStore((s) => s.settings.theme);
  const scale = useStore((s) => s.settings.fontScale);
  const lang = useStore((s) => s.settings.lang);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    root.style.fontSize = `${16 * scale}px`;
    root.lang = lang === 'ru' ? 'ru' : 'uz';
  }, [theme, scale, lang]);
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function BottomNav() {
  const { t } = useT();
  const { pathname } = useLocation();
  if (pathname.startsWith('/quiz') || pathname.startsWith('/admin')) return null;
  const items: [string, string, string][] = [
    ['/', '🏠', 'Bosh sahifa'], ['/tests', '📝', 'Testlar'], ['/guide', '📖', "Yo'riqnoma"], ['/stats', '📊', 'Statistika'], ['/settings', '⚙️', 'Sozlamalar'],
  ];
  return (
    <nav className="bottom-nav" aria-label="Asosiy menyu">
      {items.map(([to, icon, label]) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span aria-hidden>{icon}</span><span>{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

let started = false;
function useBoot() {
  useEffect(() => {
    if (started) return;
    started = true;
    startSync();
    loadContent();
    refreshMe().then(() => syncNow());
  }, []);
}

export default function App() {
  useAppearance();
  useBoot();
  const session = useSession();
  const guest = useGuest();
  if (!session && !guest && !location.pathname.startsWith('/admin')) return <main className="app"><Login /></main>;
  return (
    <BrowserRouter>
      <ScrollTop />
      <AppMain>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/quiz/:mode/:param?" element={<QuizKeyed />} />
          <Route path="/guide" element={<GuideHome />} />
          <Route path="/guide/rules" element={<RulesList />} />
          <Route path="/guide/rules/:id" element={<RuleDetail />} />
          <Route path="/guide/signs" element={<SignsCatalog />} />
          <Route path="/guide/fines" element={<Fines />} />
          <Route path="/guide/documents" element={<Documents />} />
          <Route path="/guide/tips" element={<Tips />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/rasmlar" element={<Gallery />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </AppMain>
      <BottomNav />
    </BrowserRouter>
  );
}

// Admin panel foydalanuvchi menyusisiz, kengroq maketda ochiladi
function AppMain({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return <main className={pathname.startsWith('/admin') ? 'app admin-app' : 'app'}>{children}</main>;
}

// Bir testdan boshqasiga o'tganda holat yangidan boshlanishi uchun
function QuizKeyed() {
  const { pathname } = useLocation();
  return <Quiz key={pathname} />;
}
