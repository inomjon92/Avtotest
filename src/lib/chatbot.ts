// Oddiy qoidaga asoslangan yordamchi: tayyor javoblar (admin tahrirlaydi), belgi kodlari,
// jarimalar va yo'riqnoma bo'yicha qidiruv. Pullik sun'iy intellekt ishlatilmaydi.
import { FINES } from '../data/extra';
import { RULES } from '../data/rules';
import { SIGNS } from '../data/signs';

export interface FaqItem {
  id: string;
  /** Kalit so'zlar vergul bilan: "salom, assalomu alaykum" */
  keys: string;
  answer: string;
  link?: string;
  linkText?: string;
}

export interface BotReply {
  text: string;
  links?: { to: string; label: string }[];
  /** Javob topilmadi — adminga yuborishni taklif qilamiz */
  unknown?: boolean;
}

export const DEFAULT_FAQ: FaqItem[] = [
  { id: 'salom', keys: "salom, assalomu alaykum, assalom, hello, hi, привет, салом, ассалому алайкум", answer: "Va alaykum assalom! Sizni ko'rganimdan xursandman 😊 Men Avtotest yordamchisiman. Belgi kodi (masalan 2.4), jarima yoki qoida haqida so'rang." },
  { id: 'rahmat', keys: "rahmat, raxmat, tashakkur, спасибо, рахмат", answer: "Arzimaydi! Imtihonda omad tilayman 🚗" },
  { id: 'xayr', keys: "xayr, hayr, ko'rishguncha, пока", answer: "Xayr! Har kuni ozgina mashq qilsangiz, imtihonni albatta topshirasiz." },
  { id: 'qandaysiz', keys: "qalaysiz, qandaysiz, yaxshimisiz, ishlar qalay, как дела", answer: "Rahmat, yaxshi! O'zingiz qalaysiz? Bugun nechta savol yechdingiz?" },
  { id: 'kim', keys: "sen kimsan, siz kimsiz, bot, yordamchi", answer: "Men Avtotest ilovasining yordamchisiman. Oddiy savollarga o'zim javob beraman, bilmaganimni administratorga yuboraman." },
  { id: 'imtihon', keys: "imtihon, ekzamen, nechta savol, necha daqiqa, necha xato, экзамен", answer: "{exam}", link: '/quiz/exam', linkText: 'Imtihon simulyatori' },
  { id: 'hujjat', keys: "hujjat, hujjatlar, nima kerak, документы, tibbiy, spravka", answer: "Imtihon uchun avtomaktab guvohnomasi, tibbiy ma'lumotnoma, pasport yoki ID-karta va davlat boji to'lovi kerak.", link: '/guide/documents', linkText: 'Hujjatlar' },
  { id: 'bilet', keys: "bilet, biletlar, билет", answer: "Biletlar bo'limida savollar 20 tadan biletlarga bo'lingan. Har bir biletni xatosiz yechishga harakat qiling.", link: '/tests#tickets', linkText: 'Biletlar' },
  { id: 'xato', keys: "xatolarim, xatolar, adashgan, ошибки", answer: "Xato qilgan savollaringiz alohida ro'yxatga tushadi. Ketma-ket 3 marta to'g'ri yechsangiz, ro'yxatdan chiqadi.", link: '/quiz/mistakes', linkText: 'Xatolar ustida ishlash' },
  { id: 'aralash', keys: "aralash, random, tasodifiy, микс", answer: "Aralash test barcha mavzulardan tasodifiy 20 ta savol beradi.", link: '/quiz/mixed', linkText: 'Aralash savollar' },
  { id: 'marafon', keys: "marafon, hamma savol, barcha savollar", answer: "Marafonda barcha savollarni ketma-ket yechasiz, to'xtagan joyingizdan davom etadi.", link: '/quiz/marathon', linkText: 'Marafon' },
  { id: 'belgilar', keys: "belgilar, yo'l belgilari, belgi, знаки", answer: "Barcha yo'l belgilari rasmlari va izohi bilan katalogda. Belgi kodini yozsangiz (masalan 3.20), izohini shu yerda beraman.", link: '/guide/signs', linkText: "Yo'l belgilari" },
  { id: 'jarima', keys: "jarima, jarimalar, штраф, bhm", answer: "Asosiy jarimalar ro'yxati yo'riqnomada. Masalan \"tezlik jarimasi\" yoki \"kamar jarima\" deb yozing.", link: '/guide/fines', linkText: 'Jarimalar' },
  { id: 'qoida', keys: "qoida, qoidalar, yo'riqnoma, dars, darslar, правила", answer: "Yo'l harakati qoidalari darslarga bo'lingan. Har bir darsdan keyin shu mavzu bo'yicha test bor.", link: '/guide/rules', linkText: 'Darslar' },
  { id: 'parol', keys: "parol, parolni unutdim, parolni o'zgartirish, пароль", answer: "Parolni Sozlamalar bo'limida o'zgartirasiz. Unutgan bo'lsangiz, \"Adminga yuborish\" tugmasi orqali yozing.", link: '/settings', linkText: 'Sozlamalar' },
  { id: 'oflayn', keys: "oflayn, offline, internetsiz, internet yo'q", answer: "Ilova internetsiz ham ishlaydi. Internet ulanganda natijalaringiz o'zi serverga yuboriladi va boshqa qurilmalar bilan birlashadi." },
  { id: 'apk', keys: "apk, android, yuklab olish, ilova, telefon", answer: "Android ilovani sozlamalardagi havoladan yuklab olasiz yoki saytni brauzerda \"Bosh ekranga qo'shish\" orqali o'rnatasiz.", link: '/settings', linkText: 'Sozlamalar' },
  { id: 'savol', keys: "savol qo'shish, savol yuborish, o'z savolim, savol taklif", answer: "O'zingiz savol tuzib yuborishingiz mumkin. Administrator tekshirib tasdiqlasa, hamma uchun chiqadi.", link: '/submit', linkText: 'Savol yuborish' },
  { id: 'tayyormi', keys: "tayyormanmi, natijam, progress, zaif, qayerda ortdaman, nima o'qiy", answer: "{progress}", link: '/stats', linkText: 'Statistika' },
];

const norm = (s: string) => s.toLowerCase().replace(/[ʻʼ‘’`´]/g, "'").replace(/\s+/g, ' ').trim();
const words = (s: string) => norm(s).split(/[^a-zа-яёўқғҳ0-9'.]+/i).filter((w) => w.length > 1);

export interface BotContext {
  faq: FaqItem[];
  exam: { questionCount: number; minutes: number; maxErrors: number };
  bhm: number;
  progressText: () => string;
}

function fill(item: FaqItem, ctx: BotContext): BotReply {
  const text = item.answer
    .replace('{exam}', `Imtihonda ${ctx.exam.questionCount} ta savol, ${ctx.exam.minutes} daqiqa vaqt beriladi va ko'pi bilan ${ctx.exam.maxErrors} ta xato qilish mumkin.`)
    .replace('{progress}', ctx.progressText());
  return { text, links: item.link ? [{ to: item.link, label: item.linkText || "Ochish" }] : undefined };
}

/** Kalit so'z xabarda qatnashgan bo'lsa, uning uzunligiga qarab ball beramiz */
function faqScore(item: FaqItem, msg: string) {
  let best = 0;
  for (const raw of item.keys.split(',')) {
    const k = norm(raw);
    if (!k) continue;
    const re = new RegExp(`(^|[^a-zа-я0-9'])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (re.test(msg)) best = Math.max(best, k.length + (msg === k ? 50 : 0));
  }
  return best;
}

export function reply(input: string, ctx: BotContext): BotReply {
  const msg = norm(input);
  if (!msg) return { text: "Savolingizni yozing 🙂" };

  // 1. Belgi kodi: "2.4", "3.20 belgisi"
  const code = msg.match(/\b(\d{1,2}\.\d{1,2}(?:\.\d)?)\b/);
  if (code) {
    const sign = SIGNS.find((s) => s.code === code[1] || s.id === code[1]);
    if (sign) return { text: `${sign.code} «${sign.name}». ${sign.description}`, links: [{ to: '/guide/signs', label: "Belgilar katalogi" }] };
  }

  // 2. Jarima: "tezlik jarimasi", "kamar uchun jarima qancha"
  if (/jarim|штраф/.test(msg)) {
    const ws = words(msg).filter((w) => !/jarim|qancha|uchun|necha|bo'ladi|nima/.test(w));
    const hits = FINES.filter((f) => ws.some((w) => norm(f.violation).includes(w.slice(0, Math.max(4, w.length - 2)))));
    if (hits.length) {
      const fmt = (n: number) => (n * ctx.bhm).toLocaleString('ru-RU') + " so'm";
      return { text: hits.slice(0, 4).map((f) => `• ${f.violation}: ${f.bhm ? `${f.bhm} BHM (${fmt(f.bhm)})` : f.note}`).join('\n') + "\n\nMa'lumot namunaviy, rasmiy manbadan tekshiring.", links: [{ to: '/guide/fines', label: 'Barcha jarimalar' }] };
    }
  }

  // 3. Tayyor javoblar (avval admin qo'shganlari, keyin standart)
  let top: { item: FaqItem; score: number } | null = null;
  for (const item of ctx.faq) {
    const score = faqScore(item, msg);
    if (score > (top?.score ?? 0)) top = { item, score };
  }
  if (top) return fill(top.item, ctx);

  // 4. Yo'riqnoma bo'yicha qidiruv
  const ws = words(msg).filter((w) => w.length > 3);
  if (ws.length) {
    let best: { score: number; rule: (typeof RULES)[number]; line: string } | null = null;
    for (const rule of RULES) {
      for (const line of [rule.title, ...rule.items]) {
        const l = norm(line);
        const score = ws.filter((w) => l.includes(w.slice(0, Math.max(4, w.length - 2)))).length;
        if (score > (best?.score ?? 0)) best = { score, rule, line };
      }
    }
    if (best && best.score >= Math.min(2, ws.length)) {
      return { text: `Yo'riqnomada shunday yozilgan:\n«${best.line}»`, links: [{ to: `/guide/rules/${best.rule.id}`, label: best.rule.title }] };
    }
  }

  return { text: "Bu savolga hozircha javob bera olmayman. Uni administratorga yuborishim mumkin, javobi shu chatda chiqadi.", unknown: true };
}
