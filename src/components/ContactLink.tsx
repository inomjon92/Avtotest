import { useT } from '../store/i18n';

/** Moderator bilan bog'lanish (Telegram, telefon raqami orqali) */
export const MODERATOR_PHONE = '+998975212151';
export const MODERATOR_TG = `https://t.me/${MODERATOR_PHONE}`;
const pretty = '+998 97 521 21 51';

export function ContactLink({ compact }: { compact?: boolean }) {
  const { t } = useT();
  if (compact) {
    // Bosh ekranning tepasida doim ko'rinadigan ixcham qator
    return (
      <a className="contact-bar" href={MODERATOR_TG} target="_blank" rel="noreferrer">
        <span className="contact-bar-icon" aria-hidden>✈️</span>
        <span className="grow"><b>{t("Moderator bilan bog'lanish")}</b> <span className="muted">· {t('muammo, savol va takliflar uchun')}</span></span>
        <span className="contact-bar-go">Telegram →</span>
      </a>
    );
  }
  return (
    <a className="apk-link contact-link" href={MODERATOR_TG} target="_blank" rel="noreferrer">
      <span aria-hidden>✈️</span>
      <span><b>{t("Moderator bilan bog'lanish")}</b><br /><span className="tiny muted">Telegram: {pretty} · {t('muammo, savol va takliflar uchun')}</span></span>
    </a>
  );
}
