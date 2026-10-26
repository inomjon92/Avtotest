import type { RoadSign } from './types';

// Raqamlash va tavsiflar namunaviy; rasmiy YHQ ilovasi bilan solishtirilishi kerak.
export const SIGN_GROUPS: Record<number, string> = {
  1: 'Ogohlantiruvchi belgilar',
  2: 'Imtiyoz belgilari',
  3: 'Taqiqlovchi belgilar',
  4: 'Buyuruvchi belgilar',
  5: "Axborot-ko'rsatkich belgilari",
  6: 'Servis belgilari',
  7: "Qo'shimcha axborot belgilari (lavhalar)",
};

export const SIGNS: RoadSign[] = [
  { id: '1.1', group: 1, code: '1.1', shape: 'warning', symbol: '🚧', name: "Shlagbaumli temir yo'l kesishmasi", description: "Shlagbaum bilan jihozlangan temir yo'l kesishmasiga yaqinlashilayotganini bildiradi." },
  { id: '1.2', group: 1, code: '1.2', shape: 'warning', symbol: '🚂', name: "Shlagbaumsiz temir yo'l kesishmasi", description: "Shlagbaumsiz temir yo'l kesishmasi oldidan o'rnatiladi. Haydovchi ayniqsa ehtiyot bo'lishi kerak." },
  { id: '1.8', group: 1, code: '1.8', shape: 'warning', symbol: '🚦', name: 'Svetofor bilan tartibga solish', description: "Svetofor bilan tartibga solinadigan chorraha, piyodalar o'tish joyi yoki yo'l qismi oldidan." },
  { id: '1.11', group: 1, code: '1.11', shape: 'warning', symbol: '↱', name: 'Xavfli burilish', description: "Ko'rinish cheklangan, kichik radiusli burilish." },
  { id: '1.17', group: 1, code: '1.17', shape: 'warning', symbol: '〰', name: "Notekis yo'l", description: "Qatnov qismida notekisliklar (to'lqinsimon joylar, chuqurlar) bor." },
  { id: '1.20', group: 1, code: '1.20', shape: 'warning', symbol: '🚶', name: "Piyodalar o'tish joyi", description: "Tartibga solinmaydigan piyodalar o'tish joyiga yaqinlashilayotganini bildiradi." },
  { id: '1.21', group: 1, code: '1.21', shape: 'warning', symbol: '🚸', name: 'Bolalar', description: "Bolalar muassasalari (maktab, bog'cha) yaqinidagi yo'l qismi; bolalar yo'lga chiqib qolishi mumkin." },
  { id: '1.25', group: 1, code: '1.25', shape: 'warning', symbol: '👷', name: "Yo'l ishlari", description: "Yo'lda ta'mirlash ishlari olib borilmoqda." },
  { id: '1.30', group: 1, code: '1.30', shape: 'warning', symbol: '❗', name: 'Boshqa xavflar', description: "Boshqa ogohlantiruvchi belgilarda ko'rsatilmagan xavfli yo'l qismi." },

  { id: '2.1', group: 2, code: '2.1', shape: 'main', name: "Asosiy yo'l", description: "Tartibga solinmaydigan chorrahalardan o'tishda imtiyoz beriladigan yo'l." },
  { id: '2.2', group: 2, code: '2.2', shape: 'mainEnd', name: "Asosiy yo'lning oxiri", description: "Asosiy yo'l imtiyozi shu yerda tugaydi." },
  { id: '2.4', group: 2, code: '2.4', shape: 'giveway', name: "Yo'l bering", description: "Haydovchi kesib o'tilayotgan yo'ldagi transport vositalariga, asosiy yo'l bo'lsa unga yo'l berishi shart." },
  { id: '2.5', group: 2, code: '2.5', shape: 'stop', name: "To'xtamasdan harakatlanish taqiqlanadi", description: "To'xtash chizig'i oldida, u bo'lmasa kesishma chetida to'xtab, so'ng kesib o'tilayotgan yo'ldagilarga yo'l berish shart." },
  { id: '2.6', group: 2, code: '2.6', shape: 'prohibit', symbol: '⇅', name: 'Qarama-qarshi harakatga imtiyoz berish', description: "Yo'lning tor qismida qarama-qarshi yo'nalishdan kelayotganlarga yo'l berish kerak." },

  { id: '3.1', group: 3, code: '3.1', shape: 'noentry', name: 'Kirish taqiqlangan', description: "Shu yo'nalishda barcha transport vositalarining kirishi taqiqlanadi." },
  { id: '3.2', group: 3, code: '3.2', shape: 'prohibit', name: 'Harakatlanish taqiqlangan', description: 'Barcha transport vositalarining harakatlanishi taqiqlanadi.' },
  { id: '3.4', group: 3, code: '3.4', shape: 'prohibit', symbol: '🚚', name: 'Yuk avtomobillari harakati taqiqlangan', description: "Belgida ko'rsatilgan massadan og'ir yuk avtomobillari harakati taqiqlanadi." },
  { id: '3.18.1', group: 3, code: '3.18.1', shape: 'prohibit', symbol: 'arrow-right', slash: true, name: "O'ngga burilish taqiqlangan", description: "Belgi o'rnatilgan chorrahada o'ngga burilish taqiqlanadi." },
  { id: '3.18.2', group: 3, code: '3.18.2', shape: 'prohibit', symbol: 'arrow-left', slash: true, name: 'Chapga burilish taqiqlangan', description: "Chapga burilish taqiqlanadi; qayrilib olishga ruxsat beriladi." },
  { id: '3.19', group: 3, code: '3.19', shape: 'prohibit', symbol: 'arrow-uturn', slash: true, name: 'Qayrilib olish taqiqlangan', description: 'Qayrilib olish taqiqlanadi; chapga burilish mumkin.' },
  { id: '3.20', group: 3, code: '3.20', shape: 'prohibit', symbol: '🚗🚘', name: "Quvib o'tish taqiqlangan", description: "Sekin harakatlanuvchi TV, otli arava, moped va yon tirkamasiz ikki g'ildirakli mototsikllardan boshqa barcha TV ni quvib o'tish taqiqlanadi." },
  { id: '3.24', group: 3, code: '3.24', shape: 'prohibit', symbol: '40', name: 'Maksimal tezlik cheklangan', description: "Belgida ko'rsatilgan tezlikdan (km/soat) oshib harakatlanish taqiqlanadi." },
  { id: '3.27', group: 3, code: '3.27', shape: 'nostop', symbol: 'x', name: "To'xtash taqiqlangan", description: "To'xtash ham, to'xtab turish ham taqiqlanadi." },
  { id: '3.28', group: 3, code: '3.28', shape: 'nostop', symbol: '/', name: "To'xtab turish taqiqlangan", description: "To'xtab turish taqiqlanadi, yo'lovchi tushirish yoki yuk ortish uchun to'xtashga ruxsat." },

  { id: '4.1.1', group: 4, code: '4.1.1', shape: 'mandatory', symbol: 'arrow-up', name: "To'g'riga harakatlanish", description: "Faqat to'g'riga harakatlanishga ruxsat beriladi." },
  { id: '4.1.2', group: 4, code: '4.1.2', shape: 'mandatory', symbol: 'arrow-right', name: "O'ngga harakatlanish", description: "Faqat o'ngga harakatlanishga ruxsat beriladi." },
  { id: '4.1.3', group: 4, code: '4.1.3', shape: 'mandatory', symbol: 'arrow-left', name: 'Chapga harakatlanish', description: 'Faqat chapga harakatlanishga (va qayrilib olishga) ruxsat beriladi.' },
  { id: '4.3', group: 4, code: '4.3', shape: 'mandatory', symbol: '⟳', name: 'Aylanma harakat', description: "Strelkalar ko'rsatgan yo'nalishda aylanma harakat." },
  { id: '4.5', group: 4, code: '4.5', shape: 'mandatory', symbol: '🚶', name: "Piyodalar yo'lkasi", description: 'Faqat piyodalar harakatlanishiga ruxsat.' },

  { id: '5.5', group: 5, code: '5.5', shape: 'square', symbol: 'arrow-up', name: "Bir tomonlama harakatlanadigan yo'l", description: "Butun kengligi bo'yicha transport vositalari bir yo'nalishda harakatlanadigan yo'l." },
  { id: '5.16', group: 5, code: '5.16', shape: 'square', symbol: '🚶', name: "Piyodalar o'tish joyi", description: "Piyodalar o'tish joyi chegarasini ko'rsatadi." },
  { id: '5.12', group: 5, code: '5.12', shape: 'square', symbol: '🚌', name: "Avtobus bekati", description: "Avtobus yoki trolleybus to'xtash joyi." },
  { id: '5.20', group: 5, code: '5.20', shape: 'square', symbol: 'P', name: 'Avtoturargoh', description: "Transport vositalarini to'xtab turish joyi." },

  { id: '6.1', group: 6, code: '6.1', shape: 'square', symbol: '⛑️', name: 'Birinchi tibbiy yordam punkti', description: "Yaqin atrofda tibbiy yordam punkti bor." },
  { id: '6.6', group: 6, code: '6.6', shape: 'square', symbol: '⛽', name: "Yonilg'i quyish shoxobchasi", description: "Yonilg'i quyish shoxobchasi." },

  { id: '7.1', group: 7, code: '7.1', shape: 'plate', symbol: '150 m', name: 'Obyektgacha masofa', description: "Belgidan xavfli joy yoki obyektgacha bo'lgan masofani ko'rsatadi." },
];

export const signById = (id?: string) => (id ? SIGNS.find((s) => s.id === id) : undefined);
