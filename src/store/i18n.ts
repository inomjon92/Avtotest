import { toCyrillic } from '../lib/translit';
import { useStore, type Lang } from './store';

// Interfeys matnlari: kalit — o'zbek lotin matni. Kirill avtomatik o'giriladi, rus tili lug'atdan.
const RU: Record<string, string> = {
  'Bosh sahifa': 'Главная', 'Testlar': 'Тесты', "Yo'riqnoma": 'Справочник', 'Statistika': 'Статистика', 'Sozlamalar': 'Настройки',
  'Biletlar': 'Билеты', 'Mavzular': 'Темы', 'Imtihon': 'Экзамен', 'Imtihon simulyatori': 'Симулятор экзамена',
  'Xatolar ustida ishlash': 'Работа над ошибками', 'Saralanganlar': 'Избранное', 'Marafon': 'Марафон', 'Aqlli takrorlash': 'Умное повторение',
  'Bilet': 'Билет', 'Savol': 'Вопрос', 'Keyingi': 'Далее', 'Oldingi': 'Назад', 'Yakunlash': 'Завершить', 'Izoh': 'Пояснение',
  "Qoidani o'qish": 'Читать правило', "To'g'ri": 'Верно', "Noto'g'ri": 'Неверно', 'Natija': 'Результат',
  "Imtihondan o'tdingiz!": 'Экзамен сдан!', "Imtihondan o'ta olmadingiz": 'Экзамен не сдан', 'Vaqt tugadi': 'Время вышло',
  "Qayta urinish": 'Попробовать снова', 'Xatolarni ko\'rish': 'Посмотреть ошибки', 'Bosh sahifaga': 'На главную',
  "Boshlash": 'Начать', 'Davom ettirish': 'Продолжить', "Hozircha bo'sh": 'Пока пусто', 'xato': 'ошибок', 'daqiqa': 'минут', 'savol': 'вопросов',
  "Yo'l harakati qoidalari": 'Правила дорожного движения', "Yo'l belgilari": 'Дорожные знаки', 'Jarimalar': 'Штрафы',
  'Birinchi tibbiy yordam': 'Первая помощь', 'Hujjatlar': 'Документы', 'Imtihon maslahatlari': 'Советы к экзамену', 'Qidirish': 'Поиск',
  "Shu mavzu bo'yicha test": 'Тест по этой теме', 'Umumiy progress': 'Общий прогресс', "O'zlashtirilgan": 'Освоено',
  'Tayyorlik indeksi': 'Индекс готовности', 'Kunlik seriya': 'Серия дней', 'kun': 'дн.', 'Bugun': 'Сегодня', 'Kunlik maqsad': 'Цель на день',
  'Zaif mavzular xaritasi': 'Карта слабых тем', 'Imtihonlar tarixi': 'История экзаменов', 'Til': 'Язык', 'Mavzu': 'Тема',
  "Ko'rinish": 'Оформление', 'Tizim': 'Системная', "Yorug'": 'Светлая', "Qorong'i": 'Тёмная', 'Shrift o\'lchami': 'Размер шрифта',
  'Ism': 'Имя', 'Imtihon sanasi': 'Дата экзамена', 'Admin panel': 'Админ-панель', 'Xato haqida xabar berish': 'Сообщить об ошибке',
  'Yuborish': 'Отправить', 'Bekor qilish': 'Отмена', 'Ovozli o\'qish': 'Озвучить', 'Saqlash': 'Сохранить', 'Saralash': 'В избранное',
  'Ma\'lumotlarni eksport qilish': 'Экспорт данных', 'Ma\'lumotlarni import qilish': 'Импорт данных', 'Hammasini tozalash': 'Сбросить всё',
  'Shaxsiy o\'quv reja': 'Личный план', 'Takrorlash kerak': 'К повторению', "Javob berilgan": 'Отвечено', 'Qolgan vaqt': 'Осталось',
  'Ruxsat etilgan xato': 'Допустимо ошибок', 'Imtihon kuni rejimi': 'Режим дня экзамена', 'Belgi': 'Знак', 'Jarima': 'Штраф',
  'Salom': 'Привет', 'Imtihongacha': 'До экзамена', 'Har kuni kamida': 'Решайте каждый день не менее', 'ta savol ishlang': 'вопросов', 'Maslahat': 'Совет',
  'Kirish': 'Вход', "Ro'yxatdan o'tish": 'Регистрация', "Ro'yxatdan o'ting": 'Зарегистрируйтесь', 'Login': 'Логин', 'Parol': 'Пароль',
  'Parolni takrorlang': 'Повторите пароль', 'Meni eslab qol': 'Запомнить меня', 'Mehmon sifatida davom etish': 'Продолжить как гость', 'Chiqish': 'Выйти',
  "O'tilganlar": 'Пройдено', 'Darslar': 'Уроки', 'Oxirgi test': 'Последний тест', 'Qayta ishlash': 'Пройти снова', 'Keyingi dars': 'Следующий урок',
  'Keyingi bilet': 'Следующий билет', 'Xatolar': 'Ошибки', "O'qilgan bo'limlar": 'Прочитанные разделы', "Bo'lim o'qilgan deb belgilandi": 'Раздел отмечен как прочитанный',
  'Qiyin savollar': 'Сложные вопросы', 'Murakkab vaziyatlar va xatolaringiz': 'Сложные ситуации и ваши ошибки', "o'tilgan": 'пройдено',
  'Javoblar tahlili': 'Разбор ответов', 'Sizning javobingiz': 'Ваш ответ', "To'g'ri javob": 'Правильный ответ', 'Javob berilmagan': 'Нет ответа',
  'Kontent tili': 'Язык контента', 'Natijalar': 'Результаты', "Barchasi": 'Все', 'Yangi': 'Новые', 'Hal qilindi': 'Решено',
};

export function translate(lang: Lang, s: string) {
  if (lang === 'ru') return RU[s] ?? s;
  if (lang === 'uzc') return toCyrillic(s);
  return s;
}

/** Kontent (savollar, qoidalar) hozircha o'zbek tilida; kirill rejimida o'giriladi. */
export function translateContent(lang: Lang, s: string) {
  return lang === 'uzc' ? toCyrillic(s) : s;
}

export function useT() {
  const lang = useStore((s) => s.settings.lang);
  const t = (s: string) => translate(lang, s);
  const tc = (s: string) => translateContent(lang, s);
  return { t, tc, lang };
}
