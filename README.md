# Avtotest — B toifa

B toifali haydovchilik guvohnomasi nazariy imtihoniga tayyorlanish uchun veb-ilova (PWA) va Android ilova. Texnik topshiriqning MVP qismi asosida yozilgan: test moduli, imtihon simulyatori, YHQ yo'riqnomasi, statistika va admin panel.

> ⚠️ Savollar bazasi, YHQ bayoni, belgi raqamlari va jarima miqdorlari **namunaviy**. Rasmiy biletlar va qoidalar matni litsenziya masalasi hal qilingach admin panel orqali (CSV) kiritiladi. Imtihon formati (20 savol / 25 daqiqa / 2 xato) ham taxminiy va admin paneldan o'zgartiriladi.

## Imkoniyatlar

**Test moduli**
- Biletlar (avtomatik yoki aniq bilet raqami bo'yicha), mavzular bo'yicha testlar
- Imtihon simulyatori: tasodifiy savollar, taymer, ruxsat etilgan xatodan oshganda test to'xtaydi, natija oynasi
- Xatolar ustida ishlash: xato savol ro'yxatga tushadi, 3 marta ketma-ket to'g'ri javobdan keyin chiqadi
- Saralanganlar, marafon (progress saqlanadi), aqlli takrorlash (Leitner tizimi)
- Har bir savolda: rasm/belgi (kattalashtirish), izoh, YHQ bandiga havola, ovozli o'qish (TTS), xato haqida xabar berish
- Klaviatura: `1–5` javob, `Enter`/`→` keyingi, `←` oldingi

**Yo'riqnoma**
- YHQ bo'limlari qidiruv bilan, har bir bo'limdan "Shu mavzu bo'yicha test"
- Yo'l belgilari katalogi (SVG, guruhlar, qidiruv), chiziqlar, svetofor, birinchi yordam
- Jarimalar jadvali (BHM asosida avtomatik hisoblanadi), hujjatlar ro'yxati, imtihon maslahatlari

**Profil va statistika**
- Umumiy progress, zaif mavzular xaritasi, imtihonlar tarixi, tayyorlik indeksi (oxirgi 10 simulyatsiya)
- Kunlik seriya, 28 kunlik faollik, yutuqlar, imtihon sanasi bo'yicha shaxsiy kunlik reja, imtihon kuni rejimi

**Admin panel** (`/admin`, standart PIN `1234`)
- Savollar CRUD, holatlar: qoralama → tekshiruvda → nashr qilingan → arxiv, versiyalar tarixi va tiklash
- CSV import/eksport (Excel "CSV UTF-8", `,` yoki `;`), savollar bo'yicha xato statistikasi, xato xabarlari
- Imtihon formatini sozlash

**Boshqa**: oflayn ishlaydi (service worker), qorong'i rejim, shrift o'lchami, o'zbek lotin / kirill (avtomatik) / rus interfeysi, ma'lumotlarni JSON eksport/import.

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit testlar
npm run build      # dist/ papkaga
```

## Vercel'ga joylash

1. [vercel.com/new](https://vercel.com/new) → GitHub'dagi `Avtotest` reposini tanlang.
2. Framework avtomatik "Vite" aniqlanadi (`vercel.json` tayyor). **Deploy** tugmasini bosing.

## Android APK

**Avtomatik (tavsiya):** `main` ga har push'da GitHub Actions APK yig'adi. Telefondan yuklab olish: repo → *Releases* → **Avtotest APK (oxirgi versiya)** → `avtotest.apk`. Yoki *Actions* → oxirgi ish → *Artifacts*.

**Qo'lda** (Node 22+, JDK 21, Android SDK kerak):

```bash
npm run build
npx cap add android     # bir marta
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Play Market uchun imzolangan `release` APK/AAB kerak bo'ladi (keystore bilan `./gradlew bundleRelease`).

## Tuzilma

```
src/
  data/       savollar, mavzular, YHQ bayoni, belgilar, jarimalar
  lib/        imtihon qoidalari, aqlli takrorlash, CSV, kirill transliteratsiya
  store/      lokal holat (localStorage) va tarjimalar
  components/ yo'l belgisi SVG, umumiy UI
  pages/      sahifalar
tests/        unit testlar (Vitest)
```

## Keyingi bosqich (TZ bo'yicha)

Hozirgi versiya serversiz ishlaydi: barcha ma'lumot qurilmada saqlanadi. TZ ning qolgan qismlari backend talab qiladi: SMS/Telegram orqali ro'yxatdan o'tish, qurilmalar o'rtasida sinxronlash, obuna va to'lovlar (Click, Payme, Uzum), avtomaktab kabineti, server tomonidagi rollar va 2FA, push-xabarlar, Telegram bot, rus/qoraqalpoq tilidagi savollar bazasi.
