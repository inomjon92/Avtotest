// To'rtinchi to'plamning vaziyatli savollari va ularning chizmalari (yo'l bo'lagi va chorrahalar).
// To'g'ri javob birinchi yoziladi; oxirgi element — qiyinlik.
import type { Raw2 } from './questions2';
import type { RoadSpec, RoadVehicle, SceneSpec } from './types';

const Y = (y: number, extra: Partial<RoadVehicle> = {}): RoadVehicle => ({ y, you: true, ...extra });
const A = (y: number, extra: Partial<RoadVehicle> = {}): RoadVehicle => ({ y, label: 'A', ...extra });
const B = (y: number, extra: Partial<RoadVehicle> = {}): RoadVehicle => ({ y, label: 'B', ...extra });
const road = (s: Omit<RoadSpec, 'kind'>): RoadSpec => ({ kind: 'road', ...s });
const q = (x: number, y: number) => ({ x, y, text: '?' });
const you = (turn: 'straight' | 'left' | 'right' | 'uturn' | 'stop' = 'straight') => ({ from: 's' as const, you: true, turn });

export const SCENES4: Record<string, SceneSpec | RoadSpec> = {};
export const RAW4B: Raw2[] = [];

/** Savol va uning chizmasini birga qo'shish */
function add(raw: Raw2, scene: SceneSpec | RoadSpec) {
  RAW4B.push(raw);
  SCENES4[raw[0]] = scene;
}

// ---------- Yo'l chiziqlari ----------
add(['q263', 'chiziqlar', 'chiziqlar-1', '', "Siz 1.11 chizig'ining uzluksiz tomonidasiz. Quvib o'tish uchun uni kesib o'tish mumkinmi?",
  ["Yo'q, uzluksiz tomondan kesib o'tish taqiqlanadi", "Ha, yo'l bo'sh bo'lsa", "Ha, signal berib", "Faqat aholi punktidan tashqarida"],
  "1.11 chizig'ini faqat uzuq chiziq tomonidan kesib o'tish mumkin. Uzluksiz tomondan — faqat quvib o'tish yoki aylanib o'tishni tugatishda.", 2],
  road({ center: 'dashed-solid', vehicles: [A(130, { kind: 'truck' }), Y(235, { blink: 'left' })], notes: [q(105, 175)] }));
add(['q264', 'chiziqlar', 'chiziqlar-1', '', "Chorraha ichidagi qisqa shtrixli uzuq chiziqlar nimani bildiradi?",
  ["Chorraha ichida harakat qatorlari chegarasini ko'rsatadi", "To'xtash joyini", "Piyodalar o'tish joyini", "Quvib o'tish taqiqlanganini"],
  "1.7 chizig'i (qisqa shtrixli uzuq chiziq) chorraha ichida harakat qatorlarini belgilaydi.", 2],
  road({ lanes: 2, cross: 70, crossMarking: 'dashed', vehicles: [Y(250, { lane: 1, path: 'straight' })] }));
add(['q265', 'chiziqlar', 'chiziqlar-1', '', "Ikki qator uzluksiz chiziq (1.3) bilan ajratilgan yo'lda qayrilib olish mumkinmi?",
  ["Yo'q, 1.3 chizig'ini kesib o'tish taqiqlanadi", "Ha, yo'l bo'sh bo'lsa", "Ha, avariya chiroqlari bilan", "Faqat kechasi"],
  "1.3 chizig'i to'rt va undan ortiq qatorli yo'llarda qarama-qarshi oqimlarni ajratadi va uni kesib o'tish taqiqlanadi.", 1],
  road({ lanes: 2, center: 'double', vehicles: [Y(200, { lane: 1, blink: 'left', path: 'uturn' })], notes: [q(60, 200)] }));
add(['q266', 'chiziqlar', 'chiziqlar-1', '', "Qator chegarasidagi uzluksiz chiziqni kesib o'tib, qo'shni qatorga o'tish mumkinmi?",
  ["Yo'q, uzluksiz chiziq qatorni o'zgartirishni taqiqlaydi", "Ha, signal bersangiz", "Ha, qo'shni qator bo'sh bo'lsa", "Faqat o'ng tomonga"],
  "Bir yo'nalishdagi qatorlar orasidagi 1.1 chiziq ham kesib o'tilmaydi: qatorni o'zgartirish taqiqlanadi.", 2],
  road({ lanes: 2, laneMarking: 'solid', vehicles: [Y(220, { lane: 0, blink: 'left', path: 'change-left' })], notes: [q(250, 150)] }));
add(['q267', 'chiziqlar', 'chiziqlar-1', '', "Qatordagi \"to'g'riga\" strelkasi bor qatordan chapga burilish mumkinmi?",
  ["Yo'q, faqat strelka ko'rsatgan yo'nalishda harakatlanish mumkin", "Ha, chap qator band bo'lsa", "Ha, chorraha bo'sh bo'lsa", "Faqat tartibga soluvchi bo'lmasa"],
  "Qatordagi yo'nalish strelkalari (1.18) shu qatordan qaysi yo'nalishda harakatlanish mumkinligini ko'rsatadi.", 2],
  road({ lanes: 2, cross: 50, stopLine: 112, arrows: [{ lane: 0, y: 160, dirs: ['r'] }, { lane: 1, y: 160, dirs: ['s'] }], vehicles: [Y(235, { lane: 1, blink: 'left' })], notes: [q(60, 120)] }));
add(['q268', 'chiziqlar', 'chiziqlar-1', '', "Quvib o'tishni tugatish uchun 1.1 chiziqni kesib o'z qatoringizga qaytish mumkinmi?",
  ["Ha, quvib o'tish uzuq chiziqda boshlangan bo'lsa, tugatish mumkin", "Yo'q, hech qachon", "Faqat to'xtab", "Faqat signal bermasdan"],
  "Quvib o'tish ruxsat etilgan joyda boshlangan bo'lsa, uni tugatish uchun o'z qatoriga qaytish 1.1 chizig'i paydo bo'lganda ham kerak va mumkin.", 3],
  road({ center: 'dashed', centerTo: { y: 150, marking: 'solid' }, vehicles: [A(185, { kind: 'truck' }), Y(115, { x: 133, blink: 'right', path: 'change-right' })], notes: [q(60, 115)] }));
add(['q269', 'chiziqlar', 'chiziqlar-1', '', "Qatordagi strelka faqat to'g'riga va o'ngga ko'rsatmoqda. Shu qatordan qayrilib olish mumkinmi?",
  ["Yo'q, qatordagi strelkalar ruxsat bergan yo'nalishlardagina harakatlanish mumkin", "Ha, chorraha bo'sh bo'lsa", "Ha, signal berib", "Faqat tartibga soluvchi bo'lmasa"],
  "Yo'nalish strelkalari (1.18) qatordan qaysi yo'nalishlarda harakatlanish mumkinligini ko'rsatadi; qayrilib olishga ruxsat chap strelka bilan beriladi.", 2],
  road({ lanes: 2, cross: 50, stopLine: 112, arrows: [{ lane: 0, y: 160, dirs: ['s', 'r'] }, { lane: 1, y: 160, dirs: ['s', 'r'] }], vehicles: [Y(240, { lane: 1, blink: 'left' })], notes: [q(60, 120)] }));
add(['q270', 'manevr', 'manevr-1', '', "Yo'l chetidan harakatni boshlayapsiz, orqadan A kelmoqda. Kim yo'l beradi?",
  ["Siz A ga yo'l berasiz", "A sizga yo'l beradi", "Kim oldin signal bersa", "Siz, chunki o'ngdasiz"],
  "Harakatni boshlayotgan haydovchi yo'lda harakatlanayotgan TV ga yo'l berishi shart.", 1],
  road({ vehicles: [Y(130, { x: 178, blink: 'left', path: 'straight', dist: -30 }), A(250, { path: 'straight' })] }));
add(['q271', 'manevr', 'manevr-1', '', "Qatorni o'zgartirmoqchisiz. Burilish signalini qachon o'chirish kerak?",
  ["Manevr tugashi bilan darhol", "Signalni o'chirish shart emas", "100 m yurgandan keyin", "Keyingi chorrahada"],
  "Signal manevr boshlanishidan oldin beriladi va tugashi bilan darhol o'chiriladi, boshqa qatnashchilarni chalg'itmaslik uchun.", 1],
  road({ lanes: 2, vehicles: [Y(190, { lane: 0, blink: 'left', path: 'change-left' })], notes: [q(250, 110)] }));
add(['q272', 'manevr', 'manevr-1', '', "Chapga burilish uchun qaysi holatni egallash kerak (ikki tomonlama yo'l, tramvay yo'q)?",
  ["Shu yo'nalishdagi eng chap qatorni", "Eng o'ng qatorni", "Qarama-qarshi qatorni", "Istalgan qatorni"],
  "Chapga burilish va qayrilib olishdan oldin oldindan shu yo'nalishdagi qatnov qismining eng chap holatini egallash kerak.", 1],
  road({ lanes: 2, cross: 70, vehicles: [Y(240, { lane: 0, blink: 'left' })], notes: [q(250, 160)] }));
add(['q273', 'manevr', 'manevr-1', '', "Chapga burilayotganda A ham chapga burilmoqda (qarama-qarshidan). Qanday o'tiladi?",
  ["Bir-birining chap tomonidan aylanib o'tib", "Bir-birining o'ng tomonidan", "Kim birinchi kelsa, shu o'tadi", "Ikkalasi to'xtaydi"],
  "Qarama-qarshi yo'nalishdan chapga burilayotgan TV lar, agar boshqa tartib belgilanmagan bo'lsa, bir-birining chap tomonidan aylanib o'tadi.", 2],
  { kind: 'cross', cars: [you('left'), { from: 'n', turn: 'left', label: 'A' }] });
add(['q274', 'manevr', 'manevr-1', '', "O'ngga burilganda burilishdan keyin qaysi qatorga chiqish kerak?",
  ["Imkon qadar o'ng chekka qatorga", "Istalgan qatorga", "Chap qatorga", "Qarama-qarshi qatorga"],
  "Burilish shunday bajariladiki, kesishgan qatnov qismidan chiqishda TV qarama-qarshi harakat qatorida qolmasin; o'ngga burilishda imkon qadar o'ng chekkada harakatlaniladi.", 1],
  road({ lanes: 2, cross: 70, vehicles: [Y(220, { lane: 0, blink: 'right', path: 'turn-right' })], notes: [q(270, 50)] }));
add(['q275', 'manevr', 'manevr-1', '', "Uzun avtobus o'ng chekkadan burila olmayapti. Haydovchi nima qilishi mumkin?",
  ["Boshqalarga xalaqit bermasa va xavfsizlik ta'minlansa, chetdan chekinish mumkin", "Faqat o'ng chekkadan", "Burilmasdan to'g'riga ketishi kerak", "Orqaga yurib burilishi kerak"],
  "Gabariti yoki boshqa sabablarga ko'ra burilishni chekka holatdan bajara olmaydigan TV xavfsizlik ta'minlansa va boshqalarga xalaqit bermasa, chekinishi mumkin.", 3],
  road({ lanes: 2, cross: 70, vehicles: [Y(230, { lane: 1, kind: 'bus', blink: 'right', path: 'turn-right' })], notes: [q(60, 200)] }));
add(['q276', 'manevr', 'manevr-1', '', "Tormozlanish bo'lagi (tezlikni pasaytirish qatori) bo'lsa, undan qanday foydalaniladi?",
  ["Asosiy yo'ldan chiqishda darhol shu bo'lakka o'tib, unda tezlik pasaytiriladi", "Asosiy yo'lda tezlikni pasaytirib keyin o'tiladi", "Undan foydalanish shart emas", "Faqat yuk avtomobillari foydalanadi"],
  "Tormozlanish bo'lagi bo'lsa, boshqa yo'lga burilish uchun darhol unga o'tish va tezlikni unda pasaytirish kerak.", 2],
  road({ lanes: 2, oneway: true, vehicles: [Y(220, { lane: 0, blink: 'right', path: 'change-right' })], notes: [q(250, 140)] }));
add(['q277', 'manevr', 'manevr-1', '', "Tezlanish bo'lagidan asosiy yo'lga chiqyapsiz. Kimga yo'l berasiz?",
  ["Asosiy yo'ldagi qatorda harakatlanayotgan A ga", "Hech kimga, siz imtiyozdasiz", "Faqat yuk avtomobillariga", "A sizga yo'l beradi"],
  "Tezlanish bo'lagidan asosiy yo'lga qo'shilayotgan haydovchi shu yo'ldagi TV ga yo'l beradi.", 2],
  road({ lanes: 2, oneway: true, vehicles: [Y(170, { lane: 0, blink: 'left', path: 'change-left' }), A(250, { lane: 1, path: 'straight' })] }));
add(['q278', 'manevr', 'manevr-1', '', "Yo'lda qayrilib olishda qatnov qismi kengligi yetmayapti. Nima qilish mumkin?",
  ["Yo'l chetidan yoki yondosh hududdan foydalanib, xavfsiz bo'lsa", "Orqaga yurib, chorraha ichida", "Piyodalar o'tish joyida", "Uzluksiz chiziqni kesib"],
  "Qatnov qismi kengligi qayrilib olish uchun yetmasa, uni o'ng tomondagi yo'l chetidan yoki chekkadan (xavfsizlik ta'minlanganda) bajarish mumkin.", 3],
  road({ vehicles: [Y(170, { blink: 'left', path: 'uturn' })], notes: [q(250, 170)] }));
add(['q279', 'manevr', 'manevr-1', '', "Burilish ko'rsatkichi ishlamasa, manevr haqida qanday ogohlantirish mumkin?",
  ["Qo'l bilan ishora berib", "Ovozli signal bilan", "Faralarni miltillatib", "Ogohlantirish shart emas"],
  "Burilish ko'rsatkichlari bo'lmasa yoki nosoz bo'lsa, signal qo'l bilan beriladi.", 1],
  road({ vehicles: [Y(200, { path: 'turn-left' })], notes: [q(250, 200)] }));
add(['q280', 'manevr', 'manevr-1', '', "Qo'l ishorasida chap qo'l yon tomonga cho'zilgan. Bu nimani bildiradi?",
  ['Chapga burilish yoki chap qatorga o\'tish', "O'ngga burilish", "To'xtash", 'Quvib o\'tishga ruxsat'],
  "Chapga burilish signali — chap qo'lni yon tomonga cho'zish yoki o'ng qo'lni tirsakdan yuqoriga bukib ko'tarish.", 1],
  road({ vehicles: [Y(160, { blink: 'left' })], notes: [{ x: 90, y: 160, text: "qo'l ←" }] }));
add(['q281', 'manevr', 'manevr-1', '', "Siz va A bir vaqtda qatorni o'zgartirib, bitta qatorga o'tmoqdasiz. Kim yo'l beradi?",
  ["Siz — chunki A sizning o'ng tomoningizda", "A sizga yo'l beradi", "Kim tezroq bo'lsa", "Ikkalasi ham to'xtaydi"],
  "Bir vaqtda qatorni o'zgartirishda chap tomondagi haydovchi o'ngdagiga yo'l beradi.", 2],
  road({ lanes: 3, oneway: true, vehicles: [Y(200, { lane: 2, blink: 'right', path: 'change-right' }), A(205, { lane: 0, blink: 'left', path: 'change-left' })] }));
add(['q282', 'manevr', 'manevr-1', '', "Hovli hududidan chiqishda piyodalar yo'lkasini kesib o'tyapsiz. Kimga yo'l berasiz?",
  ["Piyodalarga va yo'ldagi transport vositalariga", "Faqat transportga", "Hech kimga", "Faqat bolalarga"],
  "Yondosh hududdan yo'lga chiqishda haydovchi yo'lda harakatlanayotgan piyodalar va TV ga yo'l beradi.", 1],
  road({ side: [{ y: 120, kind: 'driveway' }], vehicles: [Y(120, { x: 250, rot: -90, path: 'straight', dist: -20 })], peds: [{ x: 197, y: 92, angle: 180 }] }));
add(['q283', 'manevr', 'manevr-1', '', "Tunnel ichida qayrilib olish mumkinmi?",
  ["Yo'q, tunnellarda qayrilib olish taqiqlanadi", "Ha, tunnel keng bo'lsa", "Ha, avariya chiroqlari bilan", "Faqat kechasi"],
  "Qayrilib olish tunnel, ko'prik, estakada, temir yo'l kesishmalari va piyodalar o'tish joylarida taqiqlanadi.", 1],
  road({ center: 'solid', notes: [{ x: 150, y: 30, text: 'TUNNEL' }], vehicles: [Y(200, { blink: 'left', path: 'uturn' })] }));
add(['q284', 'manevr', 'manevr-1', '', "Orqaga harakatlanishda ko'rinish yetarli emas. Nima qilish kerak?",
  ["Boshqa shaxslarning yordamidan foydalanish", "Ovozli signal berib harakatlanish", "Tezroq harakatlanish", "Avariya chiroqlarini yoqib harakatlanish"],
  "Orqaga harakatlanish xavfsiz bo'lishi kerak; zarur bo'lsa haydovchi boshqa shaxslar yordamidan foydalanadi.", 1],
  road({ side: [{ y: 150, kind: 'house' }], vehicles: [Y(130, { path: 'back' })], notes: [q(80, 200)] }));

// ---------- Tezlik va masofa ----------
add(['q285', 'tezlik', 'tezlik-1', '', "Tezlikni tanlashda haydovchi nimalarni hisobga olishi kerak?",
  ["Yo'l, ob-havo, ko'rinish, TV holati va yuk xususiyatlarini", "Faqat belgilardagi raqamni", "Faqat boshqa avtomobillar tezligini", "Faqat o'z tajribasini"],
  "Haydovchi tezlikni harakat jadalligi, TV va yuk xususiyati, yo'l va meteorologik sharoit, ko'rinishni hisobga olib tanlaydi.", 1],
  road({ env: 'rain', vehicles: [A(100), Y(230, { path: 'straight' })], notes: [{ x: 70, y: 40, text: '? km/soat' }] }));
add(['q286', 'tezlik', 'tezlik-1', '', "Yomg'irda tormozlash yo'li quruq yo'lga nisbatan qanday o'zgaradi?",
  ["Uzayadi", "Qisqaradi", "O'zgarmaydi", "Faqat yuk avtomobillarida uzayadi"],
  "Ho'l yo'lda g'ildiraklarning ilashuvi kamayadi, shuning uchun tormozlash yo'li uzayadi va masofani oshirish kerak.", 1],
  road({ env: 'rain', vehicles: [A(110), Y(220, { brake: true })], dims: [{ x1: 205, y1: 132, x2: 205, y2: 198, label: '?' }] }));
add(['q287', 'tezlik', 'tezlik-1', '', "Qarama-qarshi kelayotgan TV ning yon tomonidagi interval qanday bo'lishi kerak?",
  ["Harakat xavfsizligini ta'minlaydigan darajada", "Kamida 3 m", "Kamida 50 sm", "Interval talab qilinmaydi"],
  "Yon interval (oraliq) xavfsizlikni ta'minlaydigan bo'lishi kerak: tezlik, yo'l kengligi va TV o'lchamiga qarab tanlanadi.", 2],
  road({ vehicles: [A(110, { dir: 'down', kind: 'truck', path: 'straight' }), Y(200, { path: 'straight' })], dims: [{ x1: 140, y1: 155, x2: 160, y2: 155, label: '?' }] }));
add(['q288', 'tezlik', 'tezlik-1', '', "Oldinda xavf paydo bo'ldi. Haydovchi nima qilishi kerak?",
  ["TV to'xtaguncha tezlikni pasaytirish choralarini ko'rish", "Faqat ovozli signal berish", "Chetga burilib aylanib o'tish", "Tezlikni oshirib o'tib ketish"],
  "Haydovchi aniqlay oladigan xavf paydo bo'lganda, TV to'xtaguncha tezlikni pasaytirish choralarini ko'rishi shart.", 1],
  road({ vehicles: [Y(235, { brake: true })], peds: [{ x: 160, y: 120, kind: 'child', angle: 90 }], notes: [q(80, 235)] }));
add(['q289', 'tezlik', 'tezlik-1', '', "Kechasi qarama-qarshi TV faralari ko'zingizni qamashtirdi. Qanday harakat qilasiz?",
  ["Avariya chiroqlarini yoqib, qatorni o'zgartirmasdan tezlikni pasaytirib to'xtayman", "Uzoq yorug'likni yoqaman", "Chetga burilaman", "Tezlikni oshiraman"],
  "Ko'z qamashganda avariya signalizatsiyasini yoqib, qatorni o'zgartirmasdan sekinlash va to'xtash kerak.", 2],
  road({ env: 'night', vehicles: [A(80, { dir: 'down', beams: 'high' }), Y(230, { beams: 'low' })], notes: [q(80, 230)] }));
add(['q290', 'tezlik', 'tezlik-1', '', "Tezlikni oshirib, orqadagilarni ortda qoldirmoqchi bo'lgan A haydovchisi quvib o'tishga xalaqit bermoqda. Bu mumkinmi?",
  ["Yo'q, quvib o'tilayotgan haydovchiga tezlikni oshirish taqiqlanadi", "Ha, yo'l bo'sh bo'lsa", "Ha, aholi punktidan tashqarida", "Faqat 90 km/soatgacha"],
  "Quvib o'tilayotgan TV haydovchisiga tezlikni oshirish yoki boshqa harakatlar bilan quvib o'tishga to'sqinlik qilish taqiqlanadi.", 1],
  road({ vehicles: [A(170, { path: 'straight', dist: 40 }), Y(170, { x: 133, path: 'straight' })], notes: [{ x: 230, y: 170, text: 'A: +20' }] }));
add(['q291', 'tezlik', 'tezlik-2', '', "Oldingi avtomobil bilan masofani qanday tekshirish oson?",
  ["\"Ikki soniya\" qoidasi: oldingi TV o'tgan nuqtaga kamida 2 soniyadan keyin yetib kelish", "Kamida 5 metr", "Avtomobil uzunligiga teng", "Ko'z bilan chamalash shart emas"],
  "Amaliy usul: oldingi TV biror belgidan o'tgandan keyin kamida 2 soniya o'tib siz o'sha joyga yetishingiz kerak; yomon sharoitda 3–4 soniya.", 2],
  road({ vehicles: [A(110), Y(220, { path: 'straight' })], dims: [{ x1: 205, y1: 132, x2: 205, y2: 198, label: '2 s' }] }));
add(['q292', 'tezlik', 'tezlik-1', '', "Bolalar guruhi yo'l chetida turibdi. Qanday harakat qilasiz?",
  ["Tezlikni pasaytirib, to'xtashga tayyor holda harakatlanaman", "Ovozli signal berib o'taman", "Tezlikni oshiraman", "Qarama-qarshi qatorga chiqaman"],
  "Bolalar to'satdan yo'lga chiqishi mumkin, shuning uchun tezlikni pasaytirib, ehtiyot bo'lish kerak.", 1],
  road({ vehicles: [Y(240, { path: 'straight' })], peds: [{ x: 194, y: 110, kind: 'child' }, { x: 205, y: 126, kind: 'child' }, { x: 196, y: 142, kind: 'child' }] }));
add(['q293', 'tezlik', 'tezlik-1', '', "Muzli yo'lda tormozlashning eng xavfsiz usuli qaysi?",
  ["Tormoz pedalini bir necha marta bosib-qo'yib (impulsli) yoki ABS bilan ravon", "Pedalni keskin oxirigacha bosish", "Qo'l tormozini keskin tortish", "Rulni keskin burish bilan"],
  "Sirpanchiq yo'lda g'ildiraklar bloklanmasligi kerak: ravon yoki impulsli tormozlash, keskin manevrlardan qochish.", 2],
  road({ env: 'ice', vehicles: [A(100, { brake: true }), Y(210, { brake: true })], notes: [q(80, 210)] }));
add(['q294', 'tezlik', 'tezlik-1', '', "Sababsiz juda sekin harakatlanish va keskin tormozlash nima uchun taqiqlanadi?",
  ["Boshqa TV ga xalaqit beradi va to'qnashuvga sabab bo'lishi mumkin", "Yonilg'i ko'p sarflanadi", "Dvigatel buziladi", "Taqiqlanmaydi"],
  "Haydovchiga sababsiz juda past tezlikda harakatlanish va YTH oldini olishdan tashqari keskin tormozlash taqiqlanadi.", 1],
  road({ vehicles: [Y(130, { brake: true }), A(195), B(260)], notes: [q(80, 130)] }));

// ---------- Quvib o'tish ----------
add(['q295', 'quvib', 'quvib-1', '', "Ko'prikda quvib o'tish mumkinmi?",
  ["Yo'q, ko'prik, estakada va tunnellarda quvib o'tish taqiqlanadi", "Ha, ko'rinish yaxshi bo'lsa", "Faqat aholi punktida", "Faqat kunduzi"],
  "Quvib o'tish ko'priklarda, estakadalarda, ularning ostida va tunnellarda taqiqlanadi.", 1],
  road({ notes: [{ x: 60, y: 150, text: "KO'PRIK" }, { x: 240, y: 150, text: "KO'PRIK" }], vehicles: [A(150, { kind: 'truck' }), Y(240, { blink: 'left' })] }));
add(['q296', 'quvib', 'quvib-1', '', "Orqangizdagi B quvib o'tishni boshladi. Siz ham oldingi A ni quvib o'tishni boshlay olasizmi?",
  ["Yo'q, orqadagi TV quvib o'tishni boshlagan bo'lsa, quvib o'tish taqiqlanadi", "Ha, birinchi bo'lib", "Ha, tezroq bo'lsangiz", "Faqat signal bersangiz"],
  "Quvib o'tishni boshlashdan oldin orqadan kelayotgan TV quvib o'tishni boshlamaganiga ishonch hosil qilish kerak.", 2],
  road({ vehicles: [A(110, { kind: 'truck' }), Y(190, { blink: 'left' }), B(240, { x: 133, path: 'straight', blink: 'left' })] }));
add(['q297', 'quvib', 'quvib-1', '', "Qayerda o'ng tomondan quvib o'tish mumkin?",
  ["Chapga burilish signali bergan va chap holatni egallagan TV ni", "Har doim mumkin", "Hech qachon", "Faqat yuk avtomobilini"],
  "Quvib o'tish chap tomondan bajariladi; chapga burilish signali berib, chapga burilayotgan TV esa o'ng tomondan quvib o'tiladi.", 2],
  road({ cross: 70, vehicles: [A(160, { x: 146, blink: 'left' }), Y(250, { x: 176, path: 'straight' })], notes: [q(232, 200)] }));
add(['q298', 'quvib', 'quvib-1', '', "Aholi punktidan tashqarida sizni quvib o'tish qiyin (sekin harakatlanuvchi katta TV). Nima qilish kerak?",
  ["Imkon qadar o'ngga surilish, kerak bo'lsa to'xtab, orqada to'planganlarni o'tkazish", "Tezlikni oshirish", "Qarama-qarshi qatorga chiqish", "Avariya chiroqlarini yoqish"],
  "Quvib o'tish qiyin bo'lgan joylarda sekin yoki katta gabaritli TV haydovchisi imkon qadar o'ngga surilishi, kerak bo'lsa to'xtab, to'planganlarni o'tkazishi kerak.", 2],
  road({ vehicles: [Y(140, { kind: 'truck', path: 'park', blink: 'right' }), A(220), B(270)] }));
add(['q299', 'quvib', 'quvib-1', '', "Oldingi avtomobil piyodalar o'tish joyi oldida to'xtadi. Uni aylanib o'tish mumkinmi?",
  ["Faqat to'xtab, piyodalar yo'qligiga ishonch hosil qilgandan keyin", "Ha, sekinlab", "Ha, ovozli signal berib", "Hech qachon"],
  "O'tish joyi oldida to'xtagan TV ni aylanib o'tish faqat to'xtab, piyodalar yo'qligiga ishonch hosil qilgach mumkin.", 2],
  road({ lanes: 2, zebra: 110, signs: [{ x: 252, y: 86, id: '5.16' }], vehicles: [A(150, { lane: 0, brake: true }), Y(230, { lane: 1 })] }));
add(['q300', 'quvib', 'quvib-1', '', "Ko'rinish cheklangan burilishda quvib o'tish mumkinmi?",
  ["Yo'q, ko'rinish cheklangan xavfli burilishlarda taqiqlanadi", "Ha, signal berib", "Ha, tezlik yuqori bo'lsa", "Faqat kunduzi"],
  "Quvib o'tish ko'rinish cheklangan xavfli burilishlarda va ko'tarilish oxirida taqiqlanadi, chunki qarama-qarshi TV ko'rinmaydi.", 1],
  road({ signs: [{ x: 218, y: 60, id: '1.11' }], vehicles: [A(150), Y(240, { blink: 'left' })], notes: [q(105, 120)] }));
add(['q301', 'quvib', 'quvib-1', '', "Quvib o'tishda qarama-qarshi qatorda A paydo bo'ldi va masofa yetmaydi. Nima qilasiz?",
  ["Quvib o'tishdan voz kechib, o'z qatorimga qaytaman", "Tezlikni oshirib ulguraman", "Ovozli signal beraman", "Faralarni miltillataman"],
  "Quvib o'tishni xavfsiz tugatish imkoni bo'lmasa, undan voz kechib o'z qatoriga qaytish kerak.", 1],
  road({ vehicles: [{ y: 60, x: 133, dir: 'down', label: 'A', path: 'straight' }, B(170, { kind: 'truck' }), Y(200, { x: 133, blink: 'right' })], notes: [q(60, 200)] }));
add(['q302', 'quvib', 'quvib-1', '', "Bir yo'nalishda uch qatorli yo'lda o'rta qatordan chap qatorga quvib o'tish uchun chiqish mumkinmi?",
  ["Ha, bir tomonlama yoki ko'p qatorli yo'lda bu odatiy quvib o'tish", "Yo'q, taqiqlangan", "Faqat yuk avtomobillari uchun", "Faqat aholi punktidan tashqarida"],
  "Bir yo'nalishli ko'p qatorli yo'lda qarama-qarshi qatorga chiqmasdan chap qator orqali quvib o'tish mumkin.", 2],
  road({ lanes: 3, oneway: true, vehicles: [A(140, { lane: 1, kind: 'truck' }), Y(230, { lane: 1, blink: 'left', path: 'overtake' })] }));
add(['q303', 'quvib', 'quvib-1', '', "Maxsus signallarni yoqqan A ni quvib o'tish mumkinmi?",
  ["Yo'q, maxsus signallari yoqilgan TV ni quvib o'tish taqiqlanadi", "Ha, signal berib", "Ha, sekin harakatlansa", "Faqat kunduzi"],
  "Ko'k mayoqchali va maxsus tovush signali yoqilgan TV ni quvib o'tish taqiqlanadi.", 2],
  road({ vehicles: [A(150, { kind: 'police' }), Y(240, { blink: 'left' })], notes: [q(105, 190)] }));
add(['q304', 'quvib', 'quvib-1', '', "Kolonnada (tashkiliy guruhda) harakatlanayotgan TV lar orasiga kirish mumkinmi?",
  ["Yo'q, tashkiliy kolonnani kesib o'tish yoki unga qo'shilish taqiqlanadi", "Ha, signal berib", "Ha, oraliq yetarli bo'lsa", "Faqat aholi punktida"],
  "Tashkiliy transport kolonnasini kesib o'tish va uning tarkibiga kirish taqiqlanadi.", 2],
  road({ vehicles: [{ y: 60, kind: 'bus', hazard: true }, { y: 140, kind: 'bus', hazard: true }, Y(220, { x: 133, blink: 'right', path: 'change-right' })], notes: [q(60, 220)] }));

// ---------- To'xtash va to'xtab turish ----------
add(['q305', 'toxtash', 'toxtash-1', '', "Tramvay yo'llarida to'xtash mumkinmi?",
  ["Yo'q, tramvay yo'llarida va ularning yaqinida (tramvayga xalaqit beradigan) to'xtash taqiqlanadi", "Ha, qisqa vaqtga", "Ha, avariya chiroqlari bilan", "Faqat kechasi"],
  "Tramvay yo'llarida, shuningdek ular yaqinida tramvay harakatiga xalaqit beradigan joyda to'xtash taqiqlanadi.", 1],
  road({ lanes: 2, tramLane: 1, vehicles: [Y(150, { lane: 1, hazard: true }), { y: 260, lane: 1, kind: 'tram', label: 'T' }], notes: [q(250, 150)] }));
add(['q306', 'toxtash', 'toxtash-1', '', "Ko'rinish 100 m dan kam bo'lgan joyda (tepalik ortida) to'xtash mumkinmi?",
  ["Yo'q, taqiqlanadi", "Ha, avariya chiroqlari bilan", "Ha, 5 daqiqagacha", "Faqat aholi punktida"],
  "Biror yo'nalishda ko'rinish 100 m dan kam bo'lgan joylarda (tepalik, xavfli burilish) to'xtash taqiqlanadi.", 2],
  road({ signs: [{ x: 218, y: 70, id: '1.14' }], vehicles: [Y(160, { x: 172, hazard: true })], notes: [q(80, 160)] }));
add(['q307', 'toxtash', 'toxtash-1', '', "Qatnov qismi chetida ikkinchi qator bo'lib to'xtash mumkinmi?",
  ["Ikki g'ildirakli TV dan tashqari, yo'q", "Ha, 5 daqiqagacha", "Ha, avariya chiroqlarini yoqsangiz", "Ha, yuk tushirish uchun"],
  "Qatnov qismi chetida to'xtagan TV yonida ikkinchi qator bo'lib to'xtash taqiqlanadi (yon tirkamasiz ikki g'ildirakli TV bundan mustasno).", 2],
  road({ lanes: 2, vehicles: [A(120, { x: 210 }), Y(120, { lane: 1, hazard: true })], notes: [q(40, 120)] }));
add(['q308', 'toxtash', 'toxtash-1', '', "Majburiy to'xtash taqiqlangan joyda yuz berdi. Haydovchi nima qiladi?",
  ["Avariya chiroqlarini yoqib, imkon qadar tezroq TV ni olib chiqish choralarini ko'radi", "Hech narsa qilmaydi", "Faqat triangle qo'yadi", "TV ni qoldirib ketadi"],
  "Majburiy to'xtashda avariya signalizatsiyasi yoqiladi, to'xtash belgisi qo'yiladi va TV ni u yerdan olib chiqish choralari ko'riladi.", 2],
  road({ zebra: 100, vehicles: [Y(140, { hazard: true })], triangle: { y: 250 }, notes: [q(80, 140)] }));
add(['q309', 'toxtash', 'toxtash-1', '', "Aholi punktidan tashqarida to'xtash uchun qayerni tanlash kerak?",
  ["Iloji bo'lsa qatnov qismidan tashqarini (yo'l yoqasini)", "Qatnov qismining o'rtasini", "Chap tomondagi yo'l yoqasini", "Ko'prikni"],
  "Aholi punktidan tashqarida to'xtash va to'xtab turish imkon qadar qatnov qismidan tashqarida amalga oshiriladi.", 1],
  road({ vehicles: [Y(200, { blink: 'right', path: 'park' })], notes: [q(240, 120)] }));
add(['q310', 'toxtash', 'toxtash-1', '', "Piyodalar o'tish joyidan keyin (undan chiqqach) darhol to'xtash mumkinmi?",
  ["Ha, o'tish joyidan keyin to'xtash taqiqlanmagan", "Yo'q, 5 m keyin ham taqiqlanadi", "Yo'q, 15 m keyin ham", "Faqat taksiga"],
  "Taqiq piyodalar o'tish joyida va undan 5 m oldin amal qiladi; o'tish joyidan keyin to'xtash mumkin (boshqa taqiq bo'lmasa).", 3],
  road({ zebra: 170, signs: [{ x: 218, y: 196, id: '5.16' }], vehicles: [Y(125, { x: 172, path: 'park' })], notes: [q(240, 120)] }));
add(['q311', 'toxtash', 'toxtash-1', '', "Avtomobilni qiyalikda qoldirganda qo'shimcha nima qilish kerak?",
  ["Qo'l tormozini tortish va g'ildiraklarni yo'l chetiga burib qo'yish", "Faqat dvigatelni o'chirish", "Avariya chiroqlarini yoqib qo'yish", "Hech narsa"],
  "TV o'z-o'zidan harakatlanib ketmasligi uchun to'xtab turish tormozi qo'llanadi, qiyalikda g'ildiraklar chetga buriladi yoki tirgak qo'yiladi.", 2],
  road({ signs: [{ x: 218, y: 70, id: '1.13' }], vehicles: [Y(170, { x: 172 })], notes: [q(80, 170)] }));
add(['q312', 'toxtash', 'toxtash-1', '', "Avtoturargohda (5.20) yo'lovchilarni kutib 2 soat turish mumkinmi?",
  ["Ha, avtoturargohda to'xtab turish mumkin", "Yo'q, 5 daqiqagacha", "Faqat taksi uchun", "Yo'q, umuman mumkin emas"],
  "5.20 \"Avtoturargoh\" belgisi to'xtab turish uchun ajratilgan joyni bildiradi.", 1],
  road({ signs: [{ x: 218, y: 90, id: '5.20' }], vehicles: [Y(150, { x: 175 }), A(210, { x: 175 })] }));

// ---------- Piyodalar ----------
add(['q313', 'piyoda', 'piyoda-1', '', "Tartibga solinadigan o'tish joyida sizga yashil signal yondi, lekin piyoda hali o'tib ulgurmagan. Nima qilasiz?",
  ["Piyodaga o'tishni tugatishiga imkon beraman", "Ovozli signal berib o'taman", "Uni aylanib o'taman", "Harakatni boshlayman, menda yashil"],
  "Signal almashganda haydovchi o'tishni tugatayotgan piyodalarga yo'l berishi shart.", 1],
  road({ zebra: 110, light: { x: 196, y: 140, color: 'green' }, peds: [{ x: 160, y: 110, angle: 90 }], vehicles: [Y(220, { path: 'straight', dist: -10 })] }));
add(['q314', 'piyoda', 'piyoda-1', '', "Trotuardan o'tib hovliga kiryapsiz, trotuarda piyoda bor. Kim birinchi o'tadi?",
  ['Piyoda', 'Siz', "Kim tezroq bo'lsa", "Signal bergan"],
  "Yo'ldan yondosh hududga burilishda trotuar yoki piyodalar yo'lkasini kesib o'tilganda piyodalarga yo'l beriladi.", 1],
  road({ side: [{ y: 120, kind: 'driveway' }], vehicles: [Y(180, { blink: 'right', path: 'turn-right' })], peds: [{ x: 196, y: 125, angle: 0 }] }));
add(['q315', 'piyoda', 'piyoda-1', '', "Qo'shni qatordagi avtobus to'xtab turibdi, uning old tomonidan piyoda chiqishi mumkin. Qanday harakatlanasiz?",
  ["Tezlikni pasaytirib, ehtiyot bo'lib", "Tezlikni oshirib", "Ovozli signal bilan", "Odatdagidek"],
  "Bekatda turgan avtobus ko'rinishni to'sadi; piyoda to'satdan chiqishi mumkin, shuning uchun sekinlash kerak.", 1],
  road({ lanes: 2, side: [{ y: 110, kind: 'busstop' }], vehicles: [{ y: 110, lane: 0, kind: 'bus' }, Y(240, { lane: 1, path: 'straight' })], peds: [{ x: 196, y: 70, angle: 180 }] }));
add(['q316', 'piyoda', 'piyoda-1', '', "Tartibga solinmaydigan o'tish joyida piyoda qarama-qarshi qatorda yo'lga chiqdi. Nima qilasiz?",
  ["To'xtab, unga yo'l beraman", "U mening qatorimga yetguncha o'tib ketaman", "Ovozli signal beraman", "Qarama-qarshi qatordagilar yo'l bersin"],
  "Tartibga solinmaydigan o'tish joyida yo'lni kesib o'tayotgan yoki o'tishga chiqqan piyodalarga yo'l beriladi.", 2],
  road({ zebra: 110, signs: [{ x: 218, y: 86, id: '5.16' }], peds: [{ x: 128, y: 110, angle: 90 }], vehicles: [Y(225, { path: 'straight', dist: -10 })] }));
add(['q317', 'piyoda', 'piyoda-1', '', "Yo'l chetida bolalarni tashuvchi avtobus to'xtab, avariya chiroqlarini yoqdi. Qarama-qarshi qatordasiz. Nima qilasiz?",
  ["Tezlikni pasaytirib, kerak bo'lsa to'xtab, bolalarga yo'l beraman", "Odatdagidek o'tib ketaman", "Ovozli signal beraman", "Tezlikni oshiraman"],
  "\"Bolalar tashish\" belgisi va avariya chiroqlari yoqilgan avtobusga yaqinlashganda tezlikni pasaytirish, kerak bo'lsa to'xtab bolalarni o'tkazish kerak.", 2],
  road({ vehicles: [{ y: 110, kind: 'schoolbus', hazard: true, x: 131, dir: 'down' }, Y(250, { path: 'straight' })], peds: [{ x: 160, y: 140, kind: 'child', angle: 0 }] }));
add(['q318', 'piyoda', 'piyoda-1', '', "Tramvay bekatida (orolchali) tramvayga odamlar chiqmoqda. To'xtash shartmi?",
  ["Yo'q, orolcha bo'lsa ehtiyotkorlik bilan o'tish mumkin", "Ha, har doim to'xtash kerak", "Faqat kechasi", "Ha, tramvay ketguncha"],
  "Orolcha bo'lmagan bekatda haydovchi tramvayga chiquvchi va tushuvchilarga yo'l beradi. Orolcha bo'lsa, ehtiyotkorlik bilan o'tish mumkin.", 3],
  road({ lanes: 2, tramLane: 1, side: [{ y: 110, x: 167, kind: 'busstop' }], vehicles: [{ y: 100, lane: 1, kind: 'tram', label: 'T' }, Y(245, { lane: 0, path: 'straight' })], peds: [{ x: 150, y: 120 }] }));
add(['q319', 'piyoda', 'piyoda-1', '', "Piyodalar o'tish joyida transport tiqilib qoldi. O'tish joyiga kirish mumkinmi?",
  ["Yo'q, o'tish joyida to'xtashga majbur bo'ladigan bo'lsangiz, kirish taqiqlanadi", "Ha, piyodalar aylanib o'tadi", "Ha, signal berib", "Faqat yashil signalda"],
  "Tiqilinch bo'lsa va TV o'tish joyida to'xtashga majbur bo'lsa, haydovchi o'tish joyiga chiqmasligi kerak.", 2],
  road({ zebra: 140, vehicles: [A(80), B(30), Y(220, { path: 'straight', dist: -10 })] }));

// ---------- Temir yo'l ----------
add(['q320', 'temiryol', 'temiryol-1', '', "Temir yo'l kesishmasida svetoforning oq-oy rang miltillovchi signali nimani bildiradi?",
  ["Harakatlanish mumkin, lekin ehtiyotkorlik bilan", "Harakatlanish taqiqlangan", "Poyezd yaqinlashmoqda", "Kesishma ishlamayapti, to'xtash kerak"],
  "Oq-oy rang miltillovchi signal kesishmaning signalizatsiyasi ishlayotganini va harakatlanish mumkinligini bildiradi.", 3],
  road({ rails: 100, light: { x: 196, y: 150, color: 'flash' }, vehicles: [Y(240, { path: 'straight', dist: 20 })], notes: [{ x: 240, y: 150, text: 'oq' }] }));
add(['q321', 'temiryol', 'temiryol-1', '', "Shlagbaum ko'tarila boshladi. Kesishmaga kirish mumkinmi?",
  ["Yo'q, shlagbaum to'liq ko'tarilib, signal o'chguncha kutish kerak", "Ha, darhol", "Ha, shlagbaum yarmigacha ko'tarilganda", "Faqat yengil avtomobilga"],
  "Shlagbaum yopiq yoki yopila (ochila) boshlagan bo'lsa, kesishmaga chiqish taqiqlanadi.", 2],
  road({ rails: 110, barrier: 'closed', signs: [{ x: 218, y: 220, id: '1.1' }], vehicles: [Y(240)], notes: [q(80, 160)] }));
add(['q322', 'temiryol', 'temiryol-1', '', "Kesishmaga yaqinlashganda navbatchi qizil bayroqni ko'tardi. Nima qilasiz?",
  ["To'xtayman", "Ehtiyotkorlik bilan o'taman", "Poyezd ko'rinmasa o'taman", "Ovozli signal beraman"],
  "Kesishma navbatchisi taqiqlovchi ishora (ko'tarilgan qizil bayroq yoki chiroq) bersa, harakatlanish taqiqlanadi.", 2],
  road({ rails: 110, peds: [{ x: 200, y: 140 }], vehicles: [Y(230, { path: 'straight' })], notes: [{ x: 240, y: 140, text: '🚩' }] }));
add(['q323', 'temiryol', 'temiryol-1', '', "Temir yo'l kesishmasi oldida bir necha avtomobil turibdi. Ularni chapdan aylanib o'tib oldinga chiqish mumkinmi?",
  ["Yo'q, kesishma oldida turgan TV larni aylanib o'tish taqiqlanadi", "Ha, qarama-qarshi qator bo'sh bo'lsa", "Ha, shlagbaum ochiq bo'lsa", "Faqat yengil avtomobilga"],
  "Kesishma oldida turgan TV larni qarama-qarshi qatorga chiqib aylanib o'tish taqiqlanadi.", 2],
  road({ rails: 70, barrier: 'closed', vehicles: [A(130), B(180), Y(240, { x: 133, path: 'straight' })] }));
add(['q324', 'temiryol', 'temiryol-1', '', "Kesishmada poyezd yaqinlashmoqda, avtomobilingiz o'chib qoldi va yo'lovchilar bor. Birinchi navbatda nima qilasiz?",
  ["Yo'lovchilarni darhol tushirib, xavfsiz joyga olib chiqaman", "Avtomobilni yurgizishga harakat qilaman", "Yordam kutaman", "Avariya chiroqlarini yoqib o'tiraman"],
  "Odamlar hayoti birinchi o'rinda: yo'lovchilarni tushirish, keyin kesishmani bo'shatish va poyezdga to'xtash signali berish choralarini ko'rish kerak.", 2],
  road({ rails: 140, train: 'right', vehicles: [Y(140, { hazard: true })], peds: [{ x: 200, y: 150, angle: 0 }] }));
add(['q325', 'temiryol', 'temiryol-1', '', "Temir yo'l kesishmasidan oldin \"STOP\" belgisi bor. Qayerda to'xtaysiz?",
  ["To'xtash chizig'i oldida, u bo'lmasa belgi oldida", "Relslar ustida", "Shlagbaumdan keyin", "To'xtash shart emas"],
  "2.5 belgisi oldida to'xtash majburiy: to'xtash chizig'i oldida, u bo'lmasa belgi oldida to'xtab, poyezd yo'qligiga ishonch hosil qilinadi.", 2],
  road({ rails: 90, stopLine: 150, signs: [{ x: 218, y: 170, id: '2.5' }], vehicles: [Y(240, { path: 'straight', dist: -30 })] }));

// ---------- Chiroqlar va signallar ----------
add(['q326', 'chiroqlar', 'chiroqlar-1', '', "Yaqin yorug'lik chiroqlari kunduzi qachon yoqiladi?",
  ["Tunnelda, tumanda, yomg'irda va ko'rinish yetarli bo'lmaganda", "Hech qachon", "Faqat aholi punktida", "Faqat quvib o'tishda"],
  "Ko'rinish yetarli bo'lmaganda, tunnellarda va tashkiliy kolonnada kunduzi ham yaqin yorug'lik yoqiladi.", 2],
  road({ notes: [{ x: 150, y: 30, text: 'TUNNEL' }], vehicles: [Y(220, { beams: 'low', path: 'straight' })] }));
add(['q327', 'chiroqlar', 'chiroqlar-1', '', "Yoritilgan shahar ko'chasida kechasi uzoq yorug'likdan foydalanish mumkinmi?",
  ["Yo'q, yoritilgan yo'lda faqat yaqin yorug'lik", "Ha, har doim", "Ha, qarama-qarshi TV bo'lmasa", "Faqat chorrahalarda"],
  "Aholi punktidagi yoritilgan yo'llarda uzoq yorug'likdan foydalanilmaydi, yaqin yorug'lik yoqiladi.", 1],
  road({ env: 'night', side: [{ y: 90, kind: 'house' }], vehicles: [Y(230, { beams: 'high' })], notes: [q(80, 230)] }));
add(['q328', 'chiroqlar', 'chiroqlar-1', '', "Kechasi yoritilmagan yo'lda to'xtab turish kerak bo'ldi. Qaysi chiroqlar yoqiladi?",
  ["Gabarit (to'xtab turish) chiroqlari", "Uzoq yorug'lik", "Tumanga qarshi chiroqlar", "Hech qaysi"],
  "Kechasi yoritilmagan yo'l qismlarida to'xtash va to'xtab turishda gabarit chiroqlar yoqiladi.", 1],
  road({ env: 'night', vehicles: [Y(150, { x: 172, parkLights: true }), A(40, { dir: 'down', beams: 'low', path: 'straight' })] }));
add(['q329', 'chiroqlar', 'chiroqlar-1', '', "Quvib o'tishdan oldin kunduzi oldingi haydovchini qanday ogohlantirish mumkin (aholi punktidan tashqarida)?",
  ["Ovozli signal bilan", "Faralarni yoqib-o'chirib", "Avariya chiroqlari bilan", "Qo'l bilan"],
  "Aholi punktidan tashqarida quvib o'tish haqida ovozli signal bilan, kechasi esa faralarni almashlab yoqish bilan ogohlantirish mumkin.", 2],
  road({ signs: [{ x: 228, y: 40, id: '5.24', size: 62 }], vehicles: [A(150), Y(240, { horn: true, blink: 'left' })] }));
add(['q330', 'chiroqlar', 'chiroqlar-1', '', "Orqa tumanga qarshi chiroqni qachon yoqish mumkin?",
  ["Faqat ko'rinish yetarli bo'lmaganda (tuman va h.k.)", "Har doim kechasi", "Shaharda kunduzi", "Hech qachon"],
  "Orqa tumanga qarshi chiroq faqat ko'rinish yetarli bo'lmaganda yoqiladi; uni tormoz chiroqlariga ulash taqiqlanadi.", 2],
  road({ env: 'fog', vehicles: [Y(160, { brake: true }), A(260)], notes: [q(80, 160)] }));
add(['q331', 'chiroqlar', 'chiroqlar-1', '', "Shatakka olingan avtomobilda kunduzi qaysi signal yoqiladi?",
  ["Avariya yorug'lik signalizatsiyasi", "Uzoq yorug'lik", "Tumanga qarshi chiroqlar", "Hech qaysi"],
  "Shatakka olinayotgan TV da avariya signalizatsiyasi, u nosoz bo'lsa orqasida avariya to'xtash belgisi o'rnatiladi.", 2],
  road({ vehicles: [A(110), Y(185, { hazard: true })], tow: [0, 1] }));
add(['q332', 'chiroqlar', 'chiroqlar-1', '', "Siz \"ko'r\" bo'lib qolgan burilish oldidasiz (aholi punktidan tashqarida, kunduz). Qanday signal berish mumkin?",
  ["Ovozli signal — YTH ning oldini olish uchun", "Avariya chiroqlarini yoqish", "Uzoq yorug'likni miltillatish", "Signal berish taqiqlangan"],
  "Ovozli signaldan aholi punktidan tashqarida quvib o'tish haqida ogohlantirish va YTH ning oldini olish uchun foydalanish mumkin.", 2],
  road({ signs: [{ x: 218, y: 70, id: '1.11' }], vehicles: [Y(220, { horn: true })], notes: [q(80, 220)] }));

// ---------- Umumiy va xavfsizlik ----------
add(['q333', 'umumiy', 'umumiy-2', '', "YTH sodir bo'ldi, jabrlanuvchini kasalxonaga yetkazdingiz. Keyin nima qilish kerak?",
  ["Voqea joyiga qaytish", "Uyga ketish", "Avtomobilni ta'mirlashga berish", "Hech narsa"],
  "Jabrlanuvchini o'z TV ingizda yetkazgan bo'lsangiz, ism-familiyangiz va TV raqamini qoldirib, voqea joyiga qaytishingiz kerak.", 2],
  road({ vehicles: [A(120, { x: 160, rot: 25, hazard: true }), Y(170, { x: 168, rot: -12, hazard: true })], triangle: { y: 262 }, notes: [{ x: 240, y: 120, text: 'YTH' }] }));
add(['q334', 'umumiy', 'umumiy-2', '', "YTH joyida izlar va buyumlarni nima qilish kerak?",
  ["Saqlab qolish, ularni o'zgartirmaslik", "Yo'lni tozalash", "Buyumlarni yig'ib olish", "Avtomobillarni darhol surish"],
  "YTH ga aloqador buyumlar va izlarni saqlash, kerak bo'lsa ularning holatini qayd qilish kerak.", 2],
  road({ vehicles: [A(120, { x: 158, rot: 25 }), Y(168, { x: 166, rot: -10, hazard: true })], triangle: { y: 262 }, notes: [{ x: 60, y: 140, text: 'YTH' }] }));
add(['q335', 'umumiy', 'umumiy-2', '', "Yo'l harakati xavfsizligi xodimi to'xtashni talab qildi. Qanday harakat qilasiz?",
  ["Ko'rsatilgan joyda to'xtayman", "Harakatni davom ettiraman", "Tezlikni oshiraman", "Faqat hujjat so'rasa to'xtayman"],
  "Haydovchi politsiya xodimi talabi bilan to'xtashi va hujjatlarni tekshirishga berishi shart.", 1],
  road({ vehicles: [A(80, { kind: 'police', hazard: true, x: 172 }), Y(220, { blink: 'right', path: 'park' })], peds: [{ x: 200, y: 140, angle: 180 }] }));
add(['q336', 'umumiy', 'umumiy-2', '', "Ko'k mayoqchali TV kuzatuvida ketayotgan (tashkiliy) kolonna yaqinlashmoqda. Nima qilasiz?",
  ["Yo'l chetiga surilib, kerak bo'lsa to'xtab, kolonnani o'tkazaman", "Kolonnaga qo'shilaman", "Kolonnani quvib o'taman", "Hech narsa"],
  "Maxsus signal bilan kuzatilayotgan TV va kolonnaga yo'l berish, ularni o'tkazib yuborish kerak.", 2],
  road({ vehicles: [{ y: 40, kind: 'police', label: 'A', dir: 'down', path: 'straight' }, { y: 100, kind: 'bus', dir: 'down' }, Y(230, { path: 'park', blink: 'right' })] }));
add(['q337', 'xavfsizlik', 'xavfsizlik-1', '', "Shatakka olishda qattiq shatak bilan avtomobillar orasidagi masofa qancha bo'lishi kerak?",
  ["4 m dan oshmasligi kerak", "4–6 m", "10 m", "1 m dan kam"],
  "Qattiq shatakda TV lar orasidagi masofa 4 m dan oshmasligi, egiluvchan shatakda 4–6 m bo'lishi kerak.", 2],
  road({ vehicles: [A(95), Y(185)], tow: [0, 1], towRigid: true, dims: [{ x1: 205, y1: 117, x2: 205, y2: 163, label: '? m' }] }));
add(['q338', 'xavfsizlik', 'xavfsizlik-1', '', "Egiluvchan shatakda shatakka olinayotgan avtomobilni kim boshqarishi kerak?",
  ["Haydovchi (shatakda faqat haydovchi o'tiradi)", "Hech kim", "Har qanday yo'lovchi", "Faqat ikki kishi"],
  "Egiluvchan va qattiq shatakda shatakka olinuvchi TV ni haydovchi boshqaradi (qattiq shatakda rul yetarli ishlasa boshqarmasa ham bo'ladi).", 3],
  road({ vehicles: [A(110), Y(185, { hazard: true })], tow: [0, 1], notes: [q(80, 185)] }));
add(['q339', 'xavfsizlik', 'xavfsizlik-1', '', "Shatakka olinayotgan avtobusda yo'lovchilar bo'lishi mumkinmi?",
  ["Yo'q, shatakka olinayotgan avtobus va yuk avtomobili kuzovida odam tashish taqiqlanadi", "Ha, istalgancha", "Faqat kunduzi", "Faqat 5 kishigacha"],
  "Shatakka olinayotgan avtobus, trolleybus va yuk avtomobili kuzovida odamlar bo'lishi taqiqlanadi.", 2],
  road({ vehicles: [A(100, { kind: 'truck' }), Y(200, { kind: 'bus', hazard: true })], tow: [0, 1], notes: [q(80, 200)] }));
add(['q340', 'umumiy', 'umumiy-1', '', "\"Yo'l bermoq\" talabi nimani bildiradi?",
  ["Imtiyozga ega qatnashchini yo'nalish yoki tezlikni o'zgartirishga majbur qilmaslik", "Har doim to'xtash", "Ovozli signal berish", "Faqat piyodalarni o'tkazish"],
  "Yo'l bering — imtiyozga ega qatnashchilarni yo'nalishi yoki tezligini o'zgartirishga majbur qiladigan harakatni boshlamaslik yoki davom ettirmaslik.", 2],
  road({ cross: 90, signs: [{ x: 218, y: 150, id: '2.4' }], vehicles: [Y(210, { path: 'straight', dist: -20 }), A(107, { x: 40, rot: 90, path: 'straight' })] }));
add(['q341', 'umumiy', 'umumiy-1', '', "\"Yo'l\" tushunchasiga nimalar kiradi?",
  ["Qatnov qismi, yo'l yoqasi, trotuarlar va ajratuvchi bo'laklar", "Faqat qatnov qismi", "Faqat asfalt qism", "Faqat trotuar"],
  "Yo'l — bir yoki bir nechta qatnov qismi, tramvay yo'llari, trotuarlar, yo'l yoqalari va ajratuvchi bo'laklarni o'z ichiga oladi.", 1],
  road({ vehicles: [Y(200)], peds: [{ x: 196, y: 100 }], notes: [{ x: 40, y: 150, text: '?' }] }));
add(['q342', 'umumiy', 'umumiy-1', '', "Hovlidan chiqib kelayotgan A va asosiy yo'ldagi siz. Kim yo'l beradi?",
  ["A sizga yo'l beradi", "Siz A ga yo'l berasiz", "O'ng qo'l qoidasi bo'yicha", "Kim oldin kelsa"],
  "Yondosh hududdan chiqish chorraha emas: chiqayotgan haydovchi yo'ldagi barcha TV ga yo'l beradi.", 1],
  road({ side: [{ y: 120, kind: 'driveway' }], vehicles: [A(120, { x: 250, rot: -90, path: 'straight', dist: -20 }), Y(240, { path: 'straight' })] }));
add(['q343', 'umumiy', 'umumiy-1', '', "\"Yetarli ko'rinmaydigan sharoit\" — bu qanday sharoit?",
  ["Tuman, yomg'ir, qor sababli yo'l 300 m dan kam masofada ko'rinadigan sharoit", "Faqat kechasi", "Ko'rinish 1 km dan kam", "Faqat qorong'i tunnel"],
  "Tuman, yomg'ir, qor va hokazo, shuningdek g'ira-shira vaqtda yo'lning ko'rinishi 300 m dan kam bo'lsa, ko'rinish yetarli emas hisoblanadi.", 2],
  road({ env: 'fog', vehicles: [Y(230, { beams: 'low' })], dims: [{ x1: 220, y1: 40, x2: 220, y2: 210, label: '< 300 m' }] }));
add(['q344', 'tezlik', 'tezlik-1', '', "Tuman tushdi, ko'rinish 30 m. Qanday tezlik xavfsiz?",
  ["Ko'rinish masofasida to'xtay oladigan darajada past tezlik", "Ruxsat etilgan maksimal tezlik", "Tezlikni o'zgartirmaslik", "60 km/soat"],
  "Tezlik shunday tanlanadiki, haydovchi ko'rish masofasi ichida to'xtay olishi kerak.", 2],
  road({ env: 'fog', vehicles: [A(100), Y(230, { beams: 'low' })], dims: [{ x1: 220, y1: 125, x2: 220, y2: 208, label: '30 m' }] }));
add(['q345', 'manevr', 'manevr-1', '', "Bir tomonlama yo'lda o'ngdan chapga qayrilib olish mumkinmi?",
  ["Yo'q, bir tomonlama yo'lda qayrilib olish qarama-qarshi yo'nalishga chiqishni anglatadi va taqiqlanadi", "Ha, signal berib", "Ha, bo'sh bo'lsa", "Faqat kechasi"],
  "Bir tomonlama yo'lda qayrilib olish qarshi yo'nalishda harakatlanishga olib keladi, bu taqiqlanadi.", 2],
  road({ lanes: 2, oneway: true, signs: [{ x: 218, y: 60, id: '5.5' }], vehicles: [Y(200, { lane: 1, blink: 'left', path: 'uturn' })], notes: [q(60, 200)] }));
add(['q346', 'toxtash', 'toxtash-1', '', "To'xtagan avtomobildan tushayotganda kimga xalaqit bermaslik kerak?",
  ["Boshqa yo'l harakati qatnashchilariga", "Hech kimga", "Faqat piyodalarga", "Faqat avtobuslarga"],
  "Eshikni ochish, uni uzoq ochiq qoldirish va tushish boshqa yo'l harakati qatnashchilariga xalaqit bermasligi kerak.", 1],
  road({ vehicles: [Y(150, { x: 172, door: 'left' }), A(250, { path: 'straight' })] }));
add(['q347', 'chiroqlar', 'chiroqlar-1', '', "Kechasi yoritilmagan yo'lda uzoq yorug'lik bilan harakatlanyapsiz, oldingizda bir yo'nalishda A ketmoqda. Nima qilish kerak?",
  ["Yaqin yorug'likka o'tish, uni ko'zni qamashtirmaslik uchun", "Uzoq yorug'likni qoldirish", "Faralarni o'chirish", "Tumanga qarshi chiroqlarni yoqish"],
  "Uzoq yorug'lik oldingi haydovchini oyna orqali ko'r qilishi mumkin bo'lsa, yaqin yorug'likka o'tiladi.", 2],
  road({ env: 'night', vehicles: [A(110), Y(240, { beams: 'high' })], notes: [q(80, 240)] }));

// ---------- Chorrahalar ----------
const X = (a: SceneSpec) => a;
add(['q348', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahada siz chapga burilyapsiz, o'ngdan A to'g'riga kelmoqda. Kim birinchi o'tadi?",
  ['A', 'Siz', 'Ikkalasi bir vaqtda', "Kim oldin kelsa"],
  "Teng ahamiyatli chorrahada o'ng tomondan kelayotgan TV ga yo'l beriladi.", 1],
  X({ kind: 'cross', cars: [you('left'), { from: 'e', turn: 'straight', label: 'A' }] }));
add(['q349', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahada siz to'g'riga ketyapsiz, chapdan A o'ngga burilmoqda. Qanday o'tiladi?",
  ["Bir vaqtda — yo'llari kesishmaydi", 'Avval A', 'Avval siz, keyin A', "Kim tezroq bo'lsa"],
  "A siz kelgan yo'lga o'ngga buriladi, siz to'g'riga ketasiz: harakat traektoriyalari kesishmaydi, shuning uchun bir-biriga xalaqit bermay o'tiladi.", 2],
  X({ kind: 'cross', cars: [you(), { from: 'w', turn: 'right', label: 'A' }] }));
add(['q350', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahada siz o'ngga, qarama-qarshidan A chapga burilmoqda. Kim birinchi o'tadi?",
  ["Siz — A chapga burilishda qarama-qarshidan kelayotganlarga yo'l beradi", 'A', 'Ikkalasi bir vaqtda', "Kim oldin kelsa"],
  "Chapga burilayotgan TV qarama-qarshidan to'g'riga yoki o'ngga harakatlanayotgan TV ga yo'l beradi.", 2],
  X({ kind: 'cross', cars: [you('right'), { from: 'n', turn: 'left', label: 'A' }] }));
add(['q351', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahaga to'rt tomondan avtomobillar bir vaqtda keldi. Qanday o'tiladi?",
  ["Haydovchilar o'zaro kelishib o'tadi (hamma o'ngdagiga yo'l beradi)", "Eng kattasi birinchi", "Shimoldan kelgan birinchi", "Hamma bir vaqtda"],
  "Hammaning o'ngida TV bo'lsa, qoida bilan navbatni aniqlab bo'lmaydi: haydovchilar o'zaro kelishib harakatlanadi.", 3],
  X({ kind: 'cross', cars: [you(), { from: 'e', turn: 'straight', label: 'A' }, { from: 'n', turn: 'straight', label: 'B' }, { from: 'w', turn: 'straight', label: 'C' }] }));
add(['q352', 'chorraha', 'chorraha-2', '', "Siz asosiy yo'ldan o'ngga buriliyapsiz, burilgan yo'lni piyoda kesib o'tmoqda. Nima qilasiz?",
  ["Piyodaga yo'l beraman", "Imtiyozdaman, o'taman", "Ovozli signal beraman", "Uni aylanib o'taman"],
  "Burilishda haydovchi o'zi burilayotgan qatnov qismini kesib o'tayotgan piyodalarga yo'l berishi shart.", 1],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.1' }], zebra: ['e'], peds: ['e'], cars: [you('right')] }));
add(['q353', 'chorraha', 'chorraha-2', '', "Ikkinchi darajali yo'ldan to'g'riga chiqyapsiz, asosiy yo'lda chapdan A kelmoqda. Kim birinchi o'tadi?",
  ['A', 'Siz', "Kim o'ngda bo'lsa", 'Ikkalasi bir vaqtda'],
  "Ikkinchi darajali yo'ldagi haydovchi asosiy yo'ldagi barcha TV ga (chap va o'ngdan) yo'l beradi.", 1],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.4' }, { at: 'w', id: '2.1' }, { at: 'e', id: '2.1' }], cars: [you(), { from: 'w', turn: 'straight', label: 'A' }] }));
add(['q354', 'chorraha', 'chorraha-2', '', "Asosiy yo'lda to'g'riga ketyapsiz. Ikkinchi darajali yo'ldan o'ngdan A to'g'riga chiqmoqda. Kim birinchi o'tadi?",
  ['Siz', 'A', "O'ng qo'l qoidasi bo'yicha A", 'Ikkalasi bir vaqtda'],
  "Asosiy yo'ldagi haydovchi imtiyozga ega; o'ng qo'l qoidasi bu yerda qo'llanmaydi.", 1],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.1' }, { at: 'e', id: '2.4' }], cars: [you(), { from: 'e', turn: 'straight', label: 'A' }] }));
add(['q355', 'chorraha', 'chorraha-2', '', "Ikkinchi darajali yo'ldan siz va qarama-qarshidan A chiqmoqda. Siz chapga, A to'g'riga. Asosiy yo'l bo'sh. Kim birinchi?",
  ["A — chapga burilayotgan siz unga yo'l berasiz", 'Siz', "Kim oldin kelsa", "Ikkalasi bir vaqtda"],
  "Bir xil darajadagi yo'llardan kelayotganlar orasida navbat teng ahamiyatli chorraha qoidalari bilan aniqlanadi: chapga buriluvchi qarama-qarshidan to'g'riga kelayotganga yo'l beradi.", 2],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.4' }, { at: 'n', id: '2.4' }, { at: 'w', id: '2.1' }, { at: 'e', id: '2.1' }], cars: [you('left'), { from: 'n', turn: 'straight', label: 'A' }] }));
add(['q356', 'chorraha', 'chorraha-2', '', "Siz asosiy yo'ldan chapga burilyapsiz, qarama-qarshidan asosiy yo'lda A to'g'riga kelmoqda. Kim birinchi?",
  ['A', 'Siz', "Kim o'ngda bo'lsa", "Ikkalasi bir vaqtda"],
  "Ikkalangiz ham asosiy yo'ldasiz: chapga burilayotgan siz qarama-qarshidan to'g'riga kelayotgan A ga yo'l berasiz.", 2],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.1' }, { at: 'n', id: '2.1' }, { at: 'e', id: '2.4' }, { at: 'w', id: '2.4' }], cars: [you('left'), { from: 'n', turn: 'straight', label: 'A' }] }));
add(['q357', 'chorraha', 'chorraha-2', '', "T shaklidagi teng ahamiyatli chorrahada to'g'riga ketyapsiz (yo'lingiz davom etadi). Chapdagi yo'ldan A chiqmoqda. Kim birinchi?",
  ["Siz — A uchun siz o'ngdasiz", 'A', "Kim tezroq bo'lsa", "Ikkalasi bir vaqtda"],
  "T shaklidagi teng ahamiyatli chorrahada ham o'ng qo'l qoidasi amal qiladi: A uchun siz o'ngdan kelyapsiz.", 2],
  X({ kind: 'tee', cars: [{ from: 'e', you: true, turn: 'straight' }, { from: 's', turn: 'left', label: 'A' }] }));
add(['q358', 'chorraha', 'chorraha-2', '', "T shaklidagi teng ahamiyatli chorrahada o'ngga burilyapsiz, chapdan A to'g'riga kelmoqda. Kim birinchi?",
  ["Siz — A uchun siz o'ngdasiz", 'A', "Ikkalasi bir vaqtda", "Kim oldin kelsa"],
  "O'ng qo'l qoidasi: chapdan kelayotgan A uchun siz o'ng tomondasiz.", 2],
  X({ kind: 'tee', cars: [you('right'), { from: 'w', turn: 'straight', label: 'A' }] }));
add(['q359', 'chorraha', 'chorraha-2', '', "Aylanma harakatli chorrahaga kiryapsiz (2.4 bilan), aylanada A harakatlanmoqda. Kim birinchi?",
  ['A', 'Siz', "Kim o'ngda bo'lsa", 'Ikkalasi bir vaqtda'],
  "4.3 va 2.4 belgilari o'rnatilgan aylanma chorrahada aylanada harakatlanayotgan TV imtiyozga ega.", 1],
  X({ kind: 'roundabout', signs: [{ at: 's', id: '2.4' }], cars: [you(), { from: 'w', turn: 'left', label: 'A' }] }));
add(['q360', 'chorraha', 'chorraha-2', '', "Aylanma chorrahadan chiqyapsiz. Chiqishdagi o'tish joyida piyoda bor. Nima qilasiz?",
  ["Piyodaga yo'l beraman", "Aylanada imtiyozdaman, o'taman", "Ovozli signal beraman", "Yana bir aylana qilaman"],
  "Chorrahadan chiqishda burilayotgan qatnov qismini kesib o'tayotgan piyodalarga yo'l beriladi.", 1],
  X({ kind: 'roundabout', zebra: ['e'], peds: ['e'], cars: [you('right')] }));
add(['q361', 'chorraha', 'chorraha-1', '', "Svetoforda yashil signalda to'g'riga ketyapsiz, qarama-qarshidan A o'ngga burilmoqda. Kim birinchi?",
  ["Ikkalasi bir vaqtda — yo'llari kesishmaydi", 'Siz', 'A', "Kim oldin kelsa"],
  "To'g'riga ketayotgan siz va qarama-qarshidan o'ngga burilayotgan A ning traektoriyalari kesishmaydi.", 2],
  X({ kind: 'cross', light: { at: 's', color: 'green' }, cars: [you(), { from: 'n', turn: 'right', label: 'A' }] }));
add(['q362', 'chorraha', 'chorraha-1', '', "Yashil signalda chorrahaga kirib, chapga burilish uchun to'xtadingiz. Signal qizilga o'zgardi. Nima qilasiz?",
  ["Chorrahadan belgilangan yo'nalishda chiqib ketaman", "Qizil signal tugaguncha kutaman", "Orqaga qaytaman", "To'g'riga ketaman"],
  "Chorrahaga ruxsat beruvchi signalda kirgan haydovchi, signaldan qat'i nazar, mo'ljallangan yo'nalishda chorrahadan chiqishi kerak.", 2],
  X({ kind: 'cross', light: { at: 's', color: 'red' }, cars: [you('left'), { from: 'n', turn: 'stop', label: 'A' }] }));
add(['q363', 'chorraha', 'chorraha-1', '', "Yashil signal yondi, lekin chorrahada chapdan A chiqib ulgurmagan. Nima qilasiz?",
  ["A ga chorrahadan chiqishiga imkon beraman", "Yashil signal menda, o'taman", "Ovozli signal beraman", "A orqasidan aylanib o'taman"],
  "Ruxsat beruvchi signal yonganda haydovchi chorrahadan harakatni tugatayotgan TV va piyodalarga yo'l berishi kerak.", 1],
  X({ kind: 'cross', light: { at: 's', color: 'green' }, cars: [you(), { from: 'w', turn: 'straight', label: 'A' }] }));
add(['q364', 'chorraha', 'chorraha-1', '', "Qo'shimcha seksiyada yashil strelka bilan o'ngga burilyapsiz. Chapdan A yashil signalda to'g'riga kelmoqda. Kim birinchi?",
  ["A — strelka bo'yicha harakatlanuvchi boshqa yo'nalishdagilarga yo'l beradi", 'Siz', "Ikkalasi bir vaqtda", "Kim oldin kelsa"],
  "Qo'shimcha seksiyadagi strelka bo'yicha harakatlanayotgan haydovchi boshqa yo'nalishlardan harakatlanayotgan TV ga yo'l beradi.", 3],
  X({ kind: 'cross', light: { at: 's', color: 'red', arrow: 'right' }, cars: [you('right'), { from: 'w', turn: 'straight', label: 'A' }] }));
add(['q365', 'chorraha', 'chorraha-1', '', "Qizil signalda o'ngga burilish uchun strelka yo'q. Chorraha bo'sh. O'ngga burilish mumkinmi?",
  ["Yo'q, qizil signalda harakatlanish taqiqlanadi", "Ha, chorraha bo'sh bo'lsa", "Ha, signal berib", "Faqat kechasi"],
  "Qo'shimcha seksiyada yashil strelka bo'lmasa, qizil signalda o'ngga burilish ham taqiqlanadi.", 1],
  X({ kind: 'cross', light: { at: 's', color: 'red' }, cars: [you('right')] }));
add(['q366', 'chorraha', 'chorraha-1', '', "Sariq signal yondi, siz to'xtash chizig'iga juda yaqinsiz va keskin tormozlash kerak bo'ladi. Nima qilasiz?",
  ["Harakatni davom ettiraman", "Keskin tormozlayman", "Orqaga yuraman", "Tezlikni oshirib qizilda o'taman"],
  "Sariq signal yonganda keskin tormozlamasdan to'xtay olmaydigan haydovchiga harakatni davom ettirishga ruxsat beriladi.", 2],
  X({ kind: 'cross', light: { at: 's', color: 'yellow' }, cars: [you()] }));
add(['q367', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahada chapga burilyapsiz, qarama-qarshidan tramvay to'g'riga kelmoqda. Kim birinchi?",
  ["Tramvay", 'Siz', "Kim o'ngda bo'lsa", "Ikkalasi bir vaqtda"],
  "Teng ahamiyatli chorrahada tramvay relssiz TV ga nisbatan imtiyozga ega; bundan tashqari chapga buriluvchi qarama-qarshidan kelayotganga yo'l beradi.", 1],
  X({ kind: 'cross', rails: 'ns', cars: [you('left'), { from: 'n', turn: 'straight', kind: 'tram', label: 'T' }] }));
add(['q368', 'chorraha', 'chorraha-2', '', "Asosiy yo'l bo'ylab tramvay yo'li bor. Ikkinchi darajali yo'ldan chiqyapsiz, chapdan tramvay kelmoqda. Kim birinchi?",
  ['Tramvay', 'Siz', "O'ng qo'l qoidasi bo'yicha siz", "Ikkalasi bir vaqtda"],
  "Ikkinchi darajali yo'ldan chiqayotgan haydovchi asosiy yo'ldagi barcha transportga, jumladan tramvayga yo'l beradi.", 1],
  X({ kind: 'cross', rails: 'ew', signs: [{ at: 's', id: '2.4' }], cars: [you(), { from: 'w', turn: 'straight', kind: 'tram', label: 'T' }] }));
add(['q369', 'chorraha', 'chorraha-2', '', "Belgisiz chorrahada qaysi yo'l asosiy hisoblanadi: asfaltlangan yoki gruntli?",
  ["Qattiq qoplamali (asfalt) yo'l gruntli yo'lga nisbatan asosiy", "Gruntli yo'l", "Ikkalasi teng", "Kengroq yo'l"],
  "Belgilar bo'lmaganda qattiq qoplamali yo'l gruntli yo'lga nisbatan asosiy hisoblanadi.", 1],
  X({ kind: 'cross', dirt: ['n', 's'], cars: [you(), { from: 'w', turn: 'straight', label: 'A' }] }));
add(['q370', 'chorraha', 'chorraha-2', '', "Asosiy yo'lda chapga burilyapsiz (asosiy yo'l to'g'riga davom etadi). O'ngdan ikkinchi darajali yo'ldan A chiqmoqda. Kim birinchi?",
  ['Siz', 'A', "Ikkalasi bir vaqtda", "Kim oldin kelsa"],
  "Siz asosiy yo'ldasiz, ikkinchi darajali yo'ldagi A sizga yo'l beradi.", 2],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.1' }, { at: 'n', id: '2.1' }, { at: 'e', id: '2.4' }], cars: [you('left'), { from: 'e', turn: 'straight', label: 'A' }] }));
add(['q371', 'chorraha', 'chorraha-1', '', "Tartibga soluvchining qaysi ishorasi barcha yo'nalishlarda harakatni taqiqlaydi?",
  ["Qo'lni yuqoriga ko'tarish", "Qo'llarni yon tomonga cho'zish", "O'ng qo'lni oldinga cho'zish", "Qo'llarni tushirish"],
  "Qo'l yuqoriga ko'tarilgan — barcha qatnashchilar uchun harakat taqiqlanadi (chorrahadagilar uni tark etadi).", 1],
  X({ kind: 'cross', regulator: { pose: 'up', facing: 'e' }, cars: [you(), { from: 'e', turn: 'stop', label: 'A' }] }));
add(['q372', 'chorraha', 'chorraha-1', '', "Tartibga soluvchi o'ng qo'lini oldinga cho'zgan, siz uning o'ng yon tomonidasiz. Nima qilasiz?",
  ["To'xtayman — o'ng tomondan harakatlanish taqiqlangan", "Faqat o'ngga buriliman", "Hamma yo'nalishga ketishim mumkin", "Faqat to'g'riga ketaman"],
  "O'ng qo'l oldinga cho'zilganda o'ng yon tomondan va orqa tomondan harakatlanish taqiqlanadi.", 3],
  X({ kind: 'cross', regulator: { pose: 'forward', facing: 'e' }, cars: [you()] }));
add(['q373', 'chorraha', 'chorraha-1', '', "Tartibga soluvchi qo'llarini yon tomonga cho'zgan. Siz uning ko'kragi tomonidan yaqinlashyapsiz. Qayerga harakatlanish mumkin?",
  ["Hech qayerga — to'xtash kerak", "To'g'riga va o'ngga", "Faqat chapga", "Istalgan tomonga"],
  "Qo'llar yon tomonga cho'zilganda ko'krak va orqa tomondan harakatlanish taqiqlanadi.", 2],
  X({ kind: 'cross', regulator: { pose: 'side', facing: 's' }, cars: [you(), { from: 'w', turn: 'straight', label: 'A' }] }));
add(['q374', 'chorraha', 'chorraha-1', '', "Tartibga soluvchi o'ng qo'lini oldinga cho'zgan, siz uning chap yon tomonidasiz. Qayerga harakatlanish mumkin?",
  ["Barcha yo'nalishlarda", "Faqat o'ngga", "Faqat to'g'riga", "Hech qayerga"],
  "O'ng qo'l oldinga cho'zilganda chap yon tomondan barcha yo'nalishlarda harakatlanish mumkin.", 2],
  X({ kind: 'cross', regulator: { pose: 'forward', facing: 'w' }, cars: [you('left')] }));
add(['q375', 'chorraha', 'chorraha-1', '', "Svetofor sariq miltillamoqda, belgilar yo'q. Siz to'g'riga, o'ngdan A kelmoqda. Kim birinchi?",
  ['A', 'Siz', "Kim tezroq bo'lsa", "Ikkalasi bir vaqtda"],
  "Sariq miltillovchi signalda chorraha tartibga solinmaydigan hisoblanadi; belgilar bo'lmasa o'ngdan kelayotganga yo'l beriladi.", 2],
  X({ kind: 'cross', light: { at: 's', color: 'flash' }, cars: [you(), { from: 'e', turn: 'straight', label: 'A' }] }));
add(['q376', 'chorraha', 'chorraha-2', '', "Chorrahada qayrilib olyapsiz (teng ahamiyatli), qarama-qarshidan A to'g'riga kelmoqda. Kim birinchi?",
  ['A', 'Siz', "Ikkalasi bir vaqtda", "Kim oldin kelsa"],
  "Qayrilib olish chapga burilish kabi: qarama-qarshidan to'g'riga va o'ngga harakatlanayotganlarga yo'l beriladi.", 2],
  X({ kind: 'cross', cars: [you('uturn'), { from: 'n', turn: 'straight', label: 'A' }] }));
add(['q377', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahada A (o'ngdan) chapga, B (qarama-qarshidan) to'g'riga ketmoqda. Siz to'g'riga. Navbat qanday?",
  ["B, keyin A, keyin siz", "Siz, A, B", "A, siz, B", "Hammasi bir vaqtda"],
  "Siz o'ngdagi A ga yo'l berasiz. A chapga burilayotgani uchun qarama-qarshidan kelayotgan (va A uchun o'ngdagi) B ga yo'l beradi. B uchun o'ngda hech kim yo'q: B birinchi, keyin A, oxirida siz.", 3],
  X({ kind: 'cross', cars: [you(), { from: 'e', turn: 'left', label: 'A' }, { from: 'n', turn: 'straight', label: 'B' }] }));
add(['q378', 'chorraha', 'chorraha-1', '', "Tartibga solinadigan chorrahada chapga burilyapsiz, qarama-qarshidan avtobus to'g'riga kelmoqda. Kim birinchi?",
  ['Avtobus', 'Siz', "Kim tezroq bo'lsa", "Ikkalasi bir vaqtda"],
  "Yashil signalda chapga burilayotgan haydovchi qarama-qarshidan to'g'riga va o'ngga harakatlanayotgan TV ga yo'l beradi.", 1],
  X({ kind: 'cross', light: { at: 's', color: 'green' }, cars: [you('left'), { from: 'n', turn: 'straight', kind: 'bus', label: 'A' }] }));
add(['q379', 'chorraha', 'chorraha-2', '', "Ikkinchi darajali yo'ldan o'ngga burilyapsiz. Asosiy yo'lda chapdan A kelmoqda. Kim birinchi?",
  ['A', 'Siz', "Yo'llari kesishmaydi, ikkalasi", "Kim oldin kelsa"],
  "O'ngga burilganda siz A harakatlanayotgan qatnov qismiga chiqasiz: ikkinchi darajali yo'ldan chiquvchi asosiy yo'ldagiga yo'l beradi.", 1],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.4' }, { at: 'w', id: '2.1' }, { at: 'e', id: '2.1' }], cars: [you('right'), { from: 'w', turn: 'straight', label: 'A' }] }));
add(['q380', 'chorraha', 'chorraha-1', '', "Chorrahada svetofor yashil, siz to'g'riga ketyapsiz. Chorrahadan keyin piyodalar o'tish joyida piyoda bor. Nima qilasiz?",
  ["Tezlikni pasaytirib, piyodaga yo'l beraman", "Yashil signal menda, o'taman", "Ovozli signal beraman", "Qatorni o'zgartiraman"],
  "Tartibga solinmaydigan o'tish joyida piyodalarga yo'l berish majburiyati chorrahadagi signaldan qat'i nazar amal qiladi.", 1],
  X({ kind: 'cross', light: { at: 's', color: 'green' }, zebra: ['n'], peds: ['n'], cars: [you()] }));
add(['q381', 'chorraha', 'chorraha-2', '', "Asosiy yo'l chapga buriladi. Siz asosiy yo'l bo'ylab chapga, qarama-qarshidan ikkinchi darajali yo'ldan A to'g'riga ketmoqda. Kim birinchi?",
  ["Siz", "A", "Kim oldin kelsa", "Ikkalasi bir vaqtda"],
  "Asosiy yo'l yo'nalishini o'zgartirsa ham siz asosiy yo'ldasiz; ikkinchi darajali yo'ldagi A yo'l beradi.", 2],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.1' }, { at: 's', id: '8.13' }, { at: 'w', id: '2.1' }, { at: 'n', id: '2.4' }, { at: 'e', id: '2.4' }], cars: [you('left'), { from: 'n', turn: 'straight', label: 'A' }] }));
add(['q382', 'chorraha', 'chorraha-2', '', "\"STOP\" belgisi oldida to'xtadingiz, asosiy yo'lda hech kim yo'q. Endi qanday harakatlanasiz?",
  ["Asosiy yo'ldagilarga yo'l berish talabiga rioya qilib harakatni boshlayman", "Qizil signal kutaman", "Orqaga qaytaman", "Ovozli signal berib o'taman"],
  "2.5 belgisida to'xtash majburiy, keyin 2.4 dagi kabi asosiy yo'ldagilarga yo'l berib harakatlaniladi.", 1],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.5' }, { at: 'w', id: '2.1' }, { at: 'e', id: '2.1' }], cars: [you()] }));
add(['q383', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahada siz to'g'riga, chapdan A to'g'riga, qarama-qarshidan B chapga burilmoqda. Navbat qanday?",
  ["Siz, keyin A, keyin B", "A, siz, B", "B, A, siz", "Hammasi bir vaqtda"],
  "A uchun siz o'ngdasiz — A yo'l beradi. B chapga burilishda qarama-qarshidan to'g'riga kelayotgan sizga va o'ngidagi A ga yo'l beradi. Navbat: siz, A, B.", 3],
  X({ kind: 'cross', cars: [you(), { from: 'w', turn: 'straight', label: 'A' }, { from: 'n', turn: 'left', label: 'B' }] }));
add(['q384', 'chorraha', 'chorraha-1', '', "Chorrahada svetofor qizil, lekin tartibga soluvchi sizga yo'l ochib berdi. Nima qilasiz?",
  ["Tartibga soluvchining ishorasiga amal qilib harakatlanaman", "Qizil signalni kutaman", "Orqaga qaytaman", "Ovozli signal beraman"],
  "Tartibga soluvchining ishoralari svetofor signallari va belgilardan ustun.", 1],
  X({ kind: 'cross', light: { at: 's', color: 'red' }, regulator: { pose: 'side', facing: 'w' }, cars: [you()] }));
add(['q385', 'chorraha', 'chorraha-2', '', "Chorrahaga kirmoqchisiz, lekin undan keyin tirbandlik. Svetofor yo'q. Kirishingiz mumkinmi?",
  ["Yo'q, chorrahada to'xtab qolib, boshqalarga xalaqit beradigan bo'lsam kirmayman", "Ha, imtiyozdaman", "Ha, ovozli signal berib", "Faqat o'ng qatorga"],
  "Tiqilinch tufayli chorrahada to'xtab, ko'ndalang harakatga xalaqit beradigan bo'lsa, chorrahaga chiqish taqiqlanadi.", 2],
  road({ cross: 150, vehicles: [A(85, { brake: true }), B(35), Y(250, { path: 'straight', dist: -10 })], notes: [q(80, 200)] }));
add(['q386', 'chorraha', 'chorraha-2', '', "Siz ikkinchi darajali yo'ldan chapga, A asosiy yo'lda o'ngdan chapga (siz tomon) burilmoqda. Kim birinchi?",
  ['A', 'Siz', "Ikkalasi bir vaqtda", "Kim oldin kelsa"],
  "A asosiy yo'lda; siz ikkinchi darajali yo'ldan chiqayotganingiz uchun barcha asosiy yo'ldagilarga yo'l berasiz.", 2],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.4' }, { at: 'e', id: '2.1' }, { at: 'w', id: '2.1' }], cars: [you('left'), { from: 'e', turn: 'left', label: 'A' }] }));
add(['q387', 'chorraha', 'chorraha-2', '', "Siz T chorrahada to'g'riga ketyapsiz (asosiy yo'lda). Ikkinchi darajali yo'ldan A chapga burilmoqda. Kim birinchi?",
  ['Siz', 'A', "Kim o'ngda bo'lsa", "Ikkalasi bir vaqtda"],
  "Asosiy yo'ldagi haydovchi imtiyozga ega, ikkinchi darajali yo'ldan chiqayotgan A yo'l beradi.", 1],
  X({ kind: 'tee', signs: [{ at: 'e', id: '2.1' }, { at: 's', id: '2.4' }], cars: [{ from: 'e', you: true, turn: 'straight' }, { from: 's', turn: 'left', label: 'A' }] }));
add(['q388', 'chorraha', 'chorraha-1', '', "Svetoforning qo'shimcha seksiyasidagi chap strelka yashil, asosiy signal qizil. Qarama-qarshidan avtomobillar to'xtab turibdi. Chapga burilish mumkinmi?",
  ["Ha, boshqa yo'nalishlardagilarga yo'l berib", "Yo'q, asosiy signal qizil", "Faqat qayrilib olish mumkin", "Faqat tramvay uchun"],
  "Qo'shimcha seksiyadagi yashil strelka shu yo'nalishda harakatlanishga ruxsat beradi.", 2],
  X({ kind: 'cross', light: { at: 's', color: 'red', arrow: 'left' }, cars: [you('left'), { from: 'n', turn: 'stop', label: 'A' }] }));
add(['q389', 'chorraha', 'chorraha-2', '', "Aylanma chorrahada (kirishlarda 2.4 belgisi bor) siz aylanada harakatlanyapsiz, A aylanaga kirmoqda. Kim birinchi?",
  ['Siz', 'A', "O'ng qo'l qoidasi bo'yicha A", "Ikkalasi bir vaqtda"],
  "Kirishlarda 2.4 belgisi o'rnatilgan aylanma chorrahada aylana bo'ylab harakatlanayotgan TV imtiyozga ega.", 2],
  X({ kind: 'roundabout', signs: [{ at: 's', id: '2.4' }, { at: 'w', id: '2.4' }, { at: 'n', id: '2.4' }, { at: 'e', id: '2.4' }], cars: [{ from: 'w', you: true, turn: 'left' }, { from: 's', turn: 'straight', label: 'A' }] }));
add(['q390', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahada siz to'g'riga, chapdan esa ko'k mayoqchali va tovush signali yoqilgan A kelmoqda. Kim birinchi?",
  ['A', 'Siz', "O'ng qo'l qoidasi bo'yicha siz", "Ikkalasi bir vaqtda"],
  "Maxsus signallari yoqilgan TV ga har qanday chorrahada yo'l beriladi.", 1],
  X({ kind: 'cross', cars: [you(), { from: 'w', turn: 'straight', kind: 'police', label: 'A' }] }));
add(['q391', 'chorraha', 'chorraha-1', '', "Chorrahadagi svetofor o'chiq, siz \"Asosiy yo'l\" belgisi bo'yicha ketyapsiz. O'ngdan A ikkinchi darajali yo'ldan chiqmoqda. Kim birinchi?",
  ['Siz', 'A', "O'ng qo'l qoidasi bo'yicha A", "Ikkalasi bir vaqtda"],
  "Svetofor ishlamasa, imtiyoz belgilari bo'yicha harakatlaniladi: siz asosiy yo'ldasiz.", 2],
  X({ kind: 'cross', signs: [{ at: 's', id: '2.1' }, { at: 'e', id: '2.4' }], cars: [you(), { from: 'e', turn: 'straight', label: 'A' }] }));
add(['q392', 'chorraha', 'chorraha-2', '', "Teng ahamiyatli chorrahada A (qarama-qarshidan) chapga, B (o'ngdan) o'ngga burilmoqda. Siz to'g'riga. Navbat qanday?",
  ["B, keyin siz, keyin A", "Siz, B, A", "A, B, siz", "Hammasi bir vaqtda"],
  "B ham, siz ham bir yo'lga (shimolga) chiqasiz va B sizning o'ngingizda — siz B ga yo'l berasiz. A chapga burilishda qarama-qarshidan to'g'riga kelayotgan sizga yo'l beradi.", 3],
  X({ kind: 'cross', cars: [you(), { from: 'n', turn: 'left', label: 'A' }, { from: 'e', turn: 'right', label: 'B' }] }));
add(['q393', 'chorraha', 'chorraha-1', '', "Svetofor yashil, siz to'g'riga ketyapsiz. Chorrahada qarama-qarshidan chapga burilish uchun A to'xtab turibdi. Ehtiyot bo'lish kerakmi?",
  ["Ha, A sizni ko'rmagan bo'lishi mumkin — e'tiborli bo'laman", "Yo'q, menda imtiyoz", "Tezlikni oshiraman", "Ovozli signal beraman"],
  "Imtiyozga ega bo'lsangiz ham, boshqa haydovchining xatosiga tayyor turish xavfsiz haydashning asosi.", 1],
  X({ kind: 'cross', light: { at: 's', color: 'green' }, cars: [you(), { from: 'n', turn: 'left', label: 'A' }] }));
add(['q394', 'chorraha', 'chorraha-2', '', "T shaklidagi chorrahada ikkinchi darajali yo'ldan chapga burilyapsiz. Asosiy yo'lda o'ngdan A, chapdan B kelmoqda. Kim birinchi?",
  ["A va B, keyin siz", "Siz birinchi", "A, siz, B", "B, siz, A"],
  "Ikkinchi darajali yo'ldan chiquvchi asosiy yo'ldagi barcha TV ga yo'l beradi.", 2],
  X({ kind: 'tee', signs: [{ at: 's', id: '2.4' }], cars: [you('left'), { from: 'e', turn: 'straight', label: 'A' }, { from: 'w', turn: 'straight', label: 'B' }] }));
add(['q395', 'chorraha', 'chorraha-1', '', "Qizil va sariq signal bir vaqtda yondi. Harakatni boshlash mumkinmi?",
  ["Yo'q, tez orada yashil yonadi — tayyorlanish kerak", "Ha, darhol", "Faqat o'ngga", "Ha, chorraha bo'sh bo'lsa"],
  "Qizil va sariq signal birga — harakatlanish taqiqlanadi, tez orada yashil yonishi haqida axborot beradi.", 1],
  X({ kind: 'cross', light: { at: 's', color: 'redyellow' }, cars: [you(), { from: 'w', turn: 'straight', label: 'A' }] }));
