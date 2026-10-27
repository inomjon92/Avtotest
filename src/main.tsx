import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

// Android ilovada fayllar allaqachon qurilmada, service worker faqat veb uchun
// Yangi versiya chiqqanini har soatda va ilova qayta ochilganda tekshiramiz (autoUpdate o'zi qayta yuklaydi)
if (!Capacitor.isNativePlatform()) registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    setInterval(() => reg.update(), 3600_000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update(); });
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
