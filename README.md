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

**Hisob va sinxronlash**
- Ilova ochilganda kirish / ro'yxatdan o'tish oynasi; "Meni eslab qol" bilan keyingi safar avtomatik kirish (180 kunlik token, parol saqlanmaydi)
- Progress serverda saqlanadi va qurilmalar o'rtasida sinxronlanadi
- O'tilgan darslar, biletlar va mavzular belgilanadi; test oxirida javoblar tahlili

**Admin panel** (`/admin`, login va parol Vercel env'dan)
- Foydalanuvchilar ro'yxati (IP manzil, qurilma, progress), kirishlar tarixi, bloklash/o'chirish, admin kirishlari jurnali
- Savollar CRUD, rasm yuklash, holatlar: qoralama → tekshiruvda → nashr qilingan → arxiv, versiyalar tarixi va tiklash
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

Server bilan lokal ishlatish (Postgres kerak):

```bash
DATABASE_URL=postgres://... ADMIN_LOGIN=boshliq ADMIN_PASSWORD='kuchli-parol' npm run dev:api   # :3001
npm run dev        # /api so'rovlari :3001 ga yo'naltiriladi
```

## Vercel'ga joylash

1. [vercel.com/new](https://vercel.com/new) → GitHub'dagi `Avtotest` reposini tanlang → **Deploy**.
2. Loyiha → **Storage** → **Create Database** → *Neon (Postgres)* → loyihaga ulang (`DATABASE_URL` avtomatik qo'shiladi).
3. **Settings → Environment Variables**:
   - `ADMIN_LOGIN` — admin login (masalan `boshliq`)
   - `ADMIN_PASSWORD` — kamida 8 belgi, kuchli parol
   - `AUTH_SECRET` — uzun tasodifiy satr (tokenlarni imzolash uchun)
4. **Deployments → Redeploy**. Jadvallar birinchi so'rovda avtomatik yaratiladi.

Xavfsizlik: parollar scrypt bilan xeshlanadi, tokenlar HMAC bilan imzolanadi, 15 daqiqada 5 ta noto'g'ri urinishdan keyin bloklanadi, admin sessiyasi 12 soat.

## Android APK

Ilova serverga ulanishi uchun repo → *Settings → Secrets and variables → Actions → Variables* bo'limida `API_URL` = Vercel manzilingiz (masalan `https://avtotest.vercel.app`) qo'shing.

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
api/          Vercel serverless funksiyalar (auth, progress, content, admin) va Postgres
scripts/      lokal API server
src/
  data/       savollar, mavzular, YHQ bayoni, belgilar, jarimalar
  lib/        imtihon qoidalari, aqlli takrorlash, CSV, kirill transliteratsiya
  store/      lokal holat (localStorage) va tarjimalar
  components/ yo'l belgisi SVG, umumiy UI
  pages/      sahifalar
tests/        unit va API testlar (Vitest; API testlari DATABASE_URL bilan)
```

## Keyingi bosqich (TZ bo'yicha)

TZ ning qolgan qismlari: SMS/Telegram orqali ro'yxatdan o'tish, obuna va to'lovlar (Click, Payme, Uzum), avtomaktab kabineti, server tomonidagi rollar va 2FA, push-xabarlar, Telegram bot, rus/qoraqalpoq tilidagi savollar bazasi.
