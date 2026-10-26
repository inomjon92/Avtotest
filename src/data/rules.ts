import type { RuleSection } from './types';

// Yo'l harakati qoidalarining soddalashtirilgan bayoni (o'quv maqsadida).
// Rasmiy matn va band raqamlari kontent moderatori tomonidan rasmiy manba bilan almashtiriladi.
export const RULES_VERSION = '2026-10-26 (namunaviy bayon)';

export const RULES: RuleSection[] = [
  {
    id: 'umumiy-1', topic: 'umumiy', chapter: '1. Umumiy qoidalar', title: 'Asosiy atamalar',
    items: [
      "Yo'l — transport vositalari harakati uchun jihozlangan yoki moslashtirilgan yuza; u qatnov qismi, yo'l yoqasi, trotuar va ajratuvchi bo'lakdan iborat.",
      "Qatnov qismi — yo'lning relssiz transport vositalari harakatlanishi uchun mo'ljallangan qismi.",
      "Chorraha — yo'llar bir sathda kesishgan, tutashgan yoki tarmoqlangan joy. Hovlidan yoki yondosh hududdan chiqish chorraha hisoblanmaydi.",
      "Yo'lovchi — haydovchidan tashqari transport vositasida bo'lgan yoki unga chiqayotgan (tushayotgan) shaxs.",
      "Yo'l bering — harakat qatnashchisi imtiyozga ega bo'lganlarni harakat yo'nalishi yoki tezligini o'zgartirishga majbur qiladigan holatda harakatni boshlamasligi yoki davom ettirmasligi talabi.",
    ],
  },
  {
    id: 'umumiy-2', topic: 'umumiy', chapter: '2. Haydovchining majburiyatlari', title: 'Haydovchining umumiy majburiyatlari',
    items: [
      "Haydovchi o'zi bilan haydovchilik guvohnomasini, transport vositasini ro'yxatdan o'tkazish hujjatini va majburiy sug'urta polisini olib yurishi shart.",
      "Haydovchi va yo'lovchilar xavfsizlik kamarini taqishi shart.",
      "Mast holatda, giyohvandlik yoki boshqa vositalar ta'sirida, shuningdek charchagan yoki kasal holatda transport vositasini boshqarish taqiqlanadi.",
      "Harakatlanish vaqtida telefondan qo'lda ushlab foydalanish taqiqlanadi (qo'llarni band qilmaydigan moslamalar bundan mustasno).",
      "Ko'k (ko'k va qizil) mayoqcha va maxsus tovush signali yoqilgan transport vositalariga yo'l berish shart.",
    ],
  },
  {
    id: 'umumiy-3', topic: 'umumiy', chapter: "2. Haydovchining majburiyatlari", title: "Yo'l-transport hodisasida",
    items: [
      "Darhol to'xtash, avariya yorug'lik signalizatsiyasini yoqish va avariya to'xtash belgisini qo'yish.",
      "Jabrlanuvchilarga birinchi yordam ko'rsatish, tez yordam va militsiyani chaqirish.",
      "Hodisaga aloqador narsalarning joyini o'zgartirmaslik, guvohlarni yozib olish.",
    ],
  },
  {
    id: 'belgilar-1', topic: 'belgilar', chapter: "3. Yo'l belgilari", title: 'Belgilar guruhlari',
    items: [
      "Ogohlantiruvchi belgilar haydovchini xavfli yo'l qismiga yaqinlashayotgani haqida xabardor qiladi (qizil hoshiyali uchburchak).",
      "Imtiyoz belgilari chorrahalar va yo'lning tor qismlaridan o'tish navbatini belgilaydi.",
      "Taqiqlovchi belgilar muayyan harakatni taqiqlaydi yoki bekor qiladi (qizil hoshiyali doira).",
      "Buyuruvchi belgilar majburiy harakat yo'nalishini belgilaydi (ko'k doira).",
      "Axborot-ko'rsatkich belgilari harakatning alohida tartibini joriy etadi yoki bekor qiladi.",
      "Vaqtincha (sariq fonli) belgilar doimiy belgilarga zid bo'lsa, vaqtincha belgilarga amal qilinadi.",
    ],
  },
  {
    id: 'belgilar-2', topic: 'belgilar', chapter: "3. Yo'l belgilari", title: 'Taqiqlovchi belgilar amal qilish hududi',
    items: [
      "Taqiqlovchi belgilar o'rnatilgan joydan to eng yaqin chorrahagacha amal qiladi; aholi punktida chorraha bo'lmasa — aholi punkti oxirigacha.",
      "Belgining amal qilish hududi 'Amal qilish hududi' lavhasi bilan qisqartirilishi yoki 'Barcha cheklovlar hududining oxiri' belgisi bilan bekor qilinishi mumkin.",
      "Yo'l chetidagi hovlilardan chiqish joylarida taqiqlovchi belgilar amal qilishi to'xtamaydi.",
    ],
  },
  {
    id: 'chiziqlar-1', topic: 'chiziqlar', chapter: "4. Yo'l chiziqlari", title: 'Gorizontal chiziqlar',
    items: [
      "1.1 uzluksiz chiziq — qarama-qarshi oqimlarni ajratadi; uni kesib o'tish taqiqlanadi.",
      "1.3 ikki qator uzluksiz chiziq — to'rt va undan ortiq qatorli yo'llarda qarama-qarshi oqimlarni ajratadi; kesib o'tish taqiqlanadi.",
      "1.5 uzuq chiziq — qatorlarni ajratadi; har ikki tomondan kesib o'tish mumkin.",
      "1.11 uzluksiz va uzuq chiziq — uzuq chiziq tomondan kesib o'tish mumkin; uzluksiz tomondan faqat quvib o'tish yoki aylanib o'tishni tugatishda.",
      "1.12 to'xtash chizig'i — taqiqlovchi signal yoki 2.5 belgi bo'lganda haydovchi to'xtashi kerak bo'lgan joyni ko'rsatadi.",
      "1.14 'zebra' — piyodalar o'tish joyi.",
    ],
  },
  {
    id: 'svetofor-1', topic: 'svetofor', chapter: '5. Svetofor signallari', title: 'Svetofor signallarining ma\'nosi',
    items: [
      "Yashil signal harakatlanishga ruxsat beradi; yashil miltillovchi signal ruxsat vaqti tugab, tez orada taqiqlovchi signal yonishini bildiradi.",
      "Sariq signal harakatni taqiqlaydi (favqulodda tormozlanmasdan to'xtab bo'lmaydigan hollardan tashqari) va signallar almashishidan ogohlantiradi.",
      "Sariq miltillovchi signal harakatlanishga ruxsat beradi va tartibga solinmaydigan chorraha yoki piyodalar o'tish joyi borligini bildiradi.",
      "Qizil signal, shu jumladan miltillovchi, harakatni taqiqlaydi.",
      "Qo'shimcha seksiyadagi yashil strelka yoqilganda, boshqa yo'nalishlardan kelayotganlarga yo'l berib, strelka yo'nalishida harakatlanish mumkin.",
    ],
  },
  {
    id: 'svetofor-2', topic: 'svetofor', chapter: '5. Svetofor signallari', title: 'Tartibga soluvchining ishoralari',
    items: [
      "Qo'llar yon tomonga cho'zilgan yoki tushirilgan: chap va o'ng yon tomondan tramvayga to'g'riga, relssiz TV ga to'g'riga va o'ngga ruxsat; ko'krak va orqa tomondan harakat taqiqlanadi.",
      "O'ng qo'l oldinga cho'zilgan: chap yon tomondan barcha yo'nalishlarda, ko'krak tomondan faqat o'ngga ruxsat; orqa va o'ng yon tomondan taqiqlanadi.",
      "Qo'l yuqoriga ko'tarilgan: barcha yo'nalishlarda harakat taqiqlanadi (chorrahadagilar harakatni tugatadi).",
      "Tartibga soluvchining ishoralari svetofor signallari va yo'l belgilaridan ustun turadi.",
    ],
  },
  {
    id: 'chorraha-1', topic: 'chorraha', chapter: "6. Chorrahalardan o'tish", title: 'Tartibga solinadigan chorrahalar',
    items: [
      "Ruxsat beruvchi signal bilan chapga burilishda yoki qayrilib olishda haydovchi qarama-qarshi yo'nalishdan to'g'riga va o'ngga harakatlanayotgan TV ga yo'l berishi shart.",
      "Burilishda haydovchi o'zi burilayotgan qatnov qismini kesib o'tayotgan piyodalarga yo'l berishi shart.",
      "Chorrahada tirbandlik bo'lsa va u yerda to'xtab qolib ko'ndalang harakatga to'siq bo'lish ehtimoli bo'lsa, chorrahaga kirish taqiqlanadi.",
    ],
  },
  {
    id: 'chorraha-2', topic: 'chorraha', chapter: "6. Chorrahalardan o'tish", title: 'Tartibga solinmaydigan chorrahalar',
    items: [
      "Teng ahamiyatli yo'llar chorrahasida relssiz TV haydovchisi o'ng tomondan yaqinlashayotgan TV ga yo'l berishi shart.",
      "Teng ahamiyatli yo'llar chorrahasida tramvay harakat yo'nalishidan qat'i nazar relssiz TV ga nisbatan imtiyozga ega.",
      "Ikkinchi darajali yo'ldan kelayotgan haydovchi asosiy yo'ldagi TV ga yo'l berishi shart.",
    ],
  },
  {
    id: 'manevr-1', topic: 'manevr', chapter: '7. Harakatni boshlash va manevrlar', title: 'Manevrlar',
    items: [
      "Harakatni boshlash, qatorni o'zgartirish, burilish va to'xtashdan oldin burilish ko'rsatkichi bilan signal berish shart; signal manevrga imtiyoz bermaydi.",
      "Qatorni o'zgartirishda yo'nalishini o'zgartirmasdan harakatlanayotgan TV ga yo'l berish kerak.",
      "Hovli yoki yondosh hududdan chiqishda yo'ldagi piyodalar va transport vositalariga yo'l berish shart.",
      "Qayrilib olish piyodalar o'tish joylarida, tunnellarda, ko'priklarda, temir yo'l kesishmalarida, ko'rinish 100 m dan kam joylarda taqiqlanadi.",
      "Orqaga harakatlanish chorrahalarda va qayrilib olish taqiqlangan joylarda taqiqlanadi.",
    ],
  },
  {
    id: 'tezlik-1', topic: 'tezlik', chapter: '8. Harakat tezligi', title: 'Ruxsat etilgan tezlik',
    items: [
      "Aholi punktlarida — 70 km/soatdan oshmasligi kerak.",
      "Aholi punktlaridan tashqarida yengil avtomobillar uchun — 100 km/soatgacha.",
      "Turar-joy dahalari va hovli hududlarida — 20 km/soatdan oshmasligi kerak.",
      "Shatakka olib harakatlanishda — 50 km/soatdan oshmasligi kerak.",
      "Haydovchi tezlikni harakat jadalligi, yo'l va ob-havo sharoiti, ko'rinishni hisobga olib tanlashi kerak.",
    ],
  },
  {
    id: 'tezlik-2', topic: 'tezlik', chapter: '8. Harakat tezligi', title: 'Oraliq masofa va interval',
    items: [
      "Haydovchi oldindagi TV gacha uning to'satdan tormozlanganida to'qnashuvning oldini oladigan masofani saqlashi kerak.",
      "Yon tomondan harakat xavfsizligini ta'minlaydigan interval saqlanishi kerak.",
    ],
  },
  {
    id: 'quvib-1', topic: 'quvib', chapter: "9. Quvib o'tish", title: "Quvib o'tish qoidalari",
    items: [
      "Quvib o'tishdan oldin haydovchi qarama-qarshi qator yetarli masofada bo'shligiga, oldingi TV chapga burilish signali bermaganiga va uni orqadan hech kim quvib o'tishni boshlamaganiga ishonch hosil qilishi kerak.",
      "Quvib o'tish tartibga solinadigan chorrahalarda, piyodalar o'tish joylarida, temir yo'l kesishmalarida va ulardan 100 m oldin, ko'priklar va tunnellarda, ko'rinish cheklangan joylarda taqiqlanadi.",
      "Quvib o'tilayotgan TV haydovchisiga tezlikni oshirish yoki boshqa harakatlar bilan to'sqinlik qilish taqiqlanadi.",
    ],
  },
  {
    id: 'toxtash-1', topic: 'toxtash', chapter: "10. To'xtash va to'xtab turish", title: "To'xtash taqiqlangan joylar",
    items: [
      "Piyodalar o'tish joylarida va ulardan 5 m oldin.",
      "Temir yo'l kesishmalarida, tunnellarda, ko'priklarda va ularning ostida.",
      "Chorrahalarda va kesishiluvchi qatnov qismi chetidan 5 m yaqinda.",
      "Yo'nalishli TV bekatlaridan 15 m yaqinda (yo'lovchi tushirish holatlaridan tashqari).",
      "Temir yo'l kesishmalaridan 50 m yaqinda to'xtab turish taqiqlanadi.",
      "Eshikni boshqa harakat qatnashchilariga xavf tug'dirmagan holda ochish kerak.",
    ],
  },
  {
    id: 'piyoda-1', topic: 'piyoda', chapter: "11. Piyodalar o'tish joylari", title: "Piyodalarga yo'l berish",
    items: [
      "Tartibga solinmaydigan piyodalar o'tish joyiga yaqinlashganda haydovchi sekinlashishi yoki to'xtab, o'tayotgan piyodalarga yo'l berishi shart.",
      "Ko'zi ojiz piyoda oq hassa bilan ishora bersa, haydovchi unga yo'l berishi shart.",
      "Avariya chiroqlari yoqilgan va 'Bolalar tashish' belgisi o'rnatilgan TV yonidan o'tishda sekinlashish, kerak bo'lsa to'xtab bolalarga yo'l berish kerak.",
    ],
  },
  {
    id: 'temiryol-1', topic: 'temiryol', chapter: "12. Temir yo'l kesishmalari", title: "Kesishmadan o'tish",
    items: [
      "Shlagbaum yopiq yoki yopila boshlaganda, svetoforning taqiqlovchi signali yoki navbatchining taqiqlovchi ishorasi bo'lganda kesishmaga kirish taqiqlanadi.",
      "Kesishmada majburiy to'xtab qolinganda darhol odamlarni tushirish va kesishmani bo'shatish choralarini ko'rish kerak; poyezd ko'rinsa, unga qarshi yugurib to'xtash ishorasini berish kerak.",
      "Kesishmada quvib o'tish, to'xtash va orqaga harakatlanish taqiqlanadi.",
    ],
  },
  {
    id: 'chiroqlar-1', topic: 'chiroqlar', chapter: '13. Tashqi yoritish va signallar', title: 'Chiroqlardan foydalanish',
    items: [
      "Qarama-qarshi TV gacha kamida 150 m qolganda uzoq yorug'lik yaqinga almashtirilishi kerak.",
      "Ko'z qamashganda haydovchi avariya signalizatsiyasini yoqib, qatorini o'zgartirmasdan sekinlashishi va to'xtashi kerak.",
      "Avariya yorug'lik signalizatsiyasi YTH, majburiy to'xtash, ko'z qamashishi va shatakka olinganda yoqiladi.",
      "Avariya to'xtash belgisi aholi punktida TV dan kamida 15 m, aholi punktidan tashqarida kamida 30 m masofaga qo'yiladi.",
    ],
  },
  {
    id: 'xavfsizlik-1', topic: 'xavfsizlik', chapter: '14. Texnik holat', title: 'Ekspluatatsiya taqiqlanadigan nosozliklar',
    items: [
      "Ishchi tormoz tizimi yoki rul boshqaruvi nosoz bo'lsa, harakatlanish taqiqlanadi.",
      "Qorong'i vaqtda faralar yoki orqa gabarit chiroqlari ishlamasa harakatlanish taqiqlanadi.",
      "Shinalar protektori me'yordan kam yeyilgan bo'lsa ekspluatatsiya taqiqlanadi.",
    ],
  },
  {
    id: 'yordam-1', topic: 'yordam', chapter: '15. Birinchi tibbiy yordam', title: "Asosiy harakatlar",
    items: [
      "Xavfsizlikka ishonch hosil qiling, 103 (tez yordam) raqamiga qo'ng'iroq qiling.",
      "Arterial qon ketishida (qon to'q qizil emas, och qizil, otilib chiqadi) jarohatdan yuqoriga jgut qo'yiladi va qo'yilgan vaqt yozib qo'yiladi.",
      "Hushsiz, ammo nafas olayotgan jabrlanuvchi barqaror yonbosh holatga yotqiziladi.",
      "Suyak singanda shikastlangan joy shina bilan qimirlamaydigan qilib mahkamlanadi.",
      "Kuyganda kuygan joy toza sovuq suv bilan sovutiladi, pufaklar yorilmaydi.",
    ],
  },
];

export const ruleById = (id?: string) => (id ? RULES.find((r) => r.id === id) : undefined);
