import { Capacitor } from '@capacitor/core';
import { APK_URL } from '../store/api';
import { useT } from '../store/i18n';

/** Saytda (brauzerda) Android ilovasini yuklab olish havolasi; ilovaning o'zida ko'rsatilmaydi */
export function ApkLink() {
  const { t } = useT();
  if (Capacitor.isNativePlatform()) return null;
  return (
    <a className="apk-link" href={APK_URL} download rel="noreferrer">
      <span aria-hidden>📱</span>
      <span><b>{t('Android ilovasini yuklab olish')}</b><br /><span className="tiny muted">{t('APK fayl, internetsiz ham ishlaydi')}</span></span>
    </a>
  );
}
