// Jarimalar va hujjatlar — namunaviy ma'lumot. Ma'muriy javobgarlik kodeksi va rasmiy manbalar
// bo'yicha kontent moderatori tasdiqlashi kerak. BHM qiymati sozlamalarda o'zgartiriladi.
export const DEFAULT_BHM = 412000;

export interface Fine {
  id: string;
  violation: string;
  /** BHM ga karrali miqdor */
  bhm: number;
  note?: string;
}

export const FINES: Fine[] = [
  { id: 'f1', violation: "Tezlikni 10–20 km/soatgacha oshirish", bhm: 1 },
  { id: 'f2', violation: "Tezlikni 20–40 km/soatgacha oshirish", bhm: 2 },
  { id: 'f3', violation: "Tezlikni 40 km/soatdan ortiq oshirish", bhm: 5 },
  { id: 'f4', violation: "Svetoforning taqiqlovchi signalida o'tish", bhm: 5 },
  { id: 'f5', violation: 'Xavfsizlik kamarini taqmaslik', bhm: 1 },
  { id: 'f6', violation: "Harakatlanish vaqtida telefondan qo'lda foydalanish", bhm: 2 },
  { id: 'f7', violation: "Piyodaga yo'l bermaslik", bhm: 3 },
  { id: 'f8', violation: "To'xtash yoki to'xtab turish qoidalarini buzish", bhm: 1 },
  { id: 'f9', violation: "Qarama-qarshi harakat qatoriga chiqish", bhm: 7 },
  { id: 'f10', violation: "Hujjatlarsiz transport vositasini boshqarish", bhm: 1 },
  { id: 'f11', violation: "Mast holatda boshqarish", bhm: 0, note: "Katta miqdorda jarima va guvohnomadan mahrum qilish; jinoiy javobgarlik ham bo'lishi mumkin" },
];

export const DOCUMENTS: { title: string; text: string }[] = [
  { title: "Avtomaktabni tamomlaganlik to'g'risidagi hujjat", text: "Litsenziyaga ega avtomaktabda B toifa bo'yicha o'qishni tamomlaganlik guvohnomasi." },
  { title: "Tibbiy ma'lumotnoma", text: "Haydovchilik uchun yaroqlilik to'g'risidagi tibbiy ko'rik xulosasi (narkolog va psixonevrolog ko'rigi bilan)." },
  { title: "Shaxsni tasdiqlovchi hujjat", text: "Pasport yoki ID-karta." },
  { title: "Davlat boji", text: "Imtihon va guvohnoma uchun to'lov kvitansiyasi (my.gov.uz orqali to'lash mumkin)." },
  { title: 'Ariza', text: "Imtihon topshirish uchun ariza davlat xizmatlari markazi yoki my.gov.uz orqali beriladi." },
];

export const EXAM_TIPS: string[] = [
  "Imtihondan oldingi kuni yangi mavzu o'rganmang — faqat xatolar ro'yxatini takrorlang.",
  "Savolni oxirigacha o'qing: \"mumkin emas\", \"faqat\" kabi so'zlar javobni o'zgartiradi.",
  "Ishonchingiz komil bo'lmagan savolni o'tkazib yuboring va oxirida qayting.",
  "Belgilarni shakli bo'yicha ajrating: uchburchak — ogohlantirish, qizil doira — taqiq, ko'k doira — buyruq.",
  "Yaxshi uxlang va imtihonga 20 daqiqa oldin boring.",
];
