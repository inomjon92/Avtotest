// O'zbek lotin yozuvidan kirill yozuviga o'girish.
const MULTI: [string, string][] = [
  ["yo'", 'йў'], ['yoʻ', 'йў'], ['yo‘', 'йў'],
  ["o'", 'ў'], ['oʻ', 'ў'], ['o‘', 'ў'], ["g'", 'ғ'], ['gʻ', 'ғ'], ['g‘', 'ғ'],
  ['sh', 'ш'], ['ch', 'ч'], ['yo', 'ё'], ['yu', 'ю'], ['ya', 'я'], ['ye', 'е'], ['ng', 'нг'],
];
const SINGLE: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м',
  n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', c: 'с', w: 'в',
  "'": 'ъ', 'ʼ': 'ъ', '’': 'ъ',
};

const isLetter = (ch: string | undefined) => !!ch && /[a-zA-Zʻ‘'’]/.test(ch);

export function toCyrillic(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i).toLowerCase();
    const multi = MULTI.find(([lat]) => rest.startsWith(lat));
    const src = multi ? text.slice(i, i + multi[0].length) : text[i];
    let cyr: string | undefined = multi ? multi[1] : SINGLE[text[i].toLowerCase()];
    if (cyr === undefined) { out += text[i]; i++; continue; }
    // So'z boshidagi "e" -> "э"
    if (!multi && text[i].toLowerCase() === 'e' && !isLetter(text[i - 1])) cyr = 'э';
    // So'z ichidagi apostrof (tutuq belgisi) faqat harflar orasida "ъ" bo'ladi
    if (!multi && SINGLE[text[i]] === 'ъ' && !(isLetter(text[i - 1]) && isLetter(text[i + 1]))) { out += text[i]; i++; continue; }
    const upper = src[0] !== src[0].toLowerCase();
    if (upper) {
      const allUpper = src.length > 1 && src === src.toUpperCase();
      cyr = allUpper ? cyr.toUpperCase() : cyr[0].toUpperCase() + cyr.slice(1);
    }
    out += cyr;
    i += src.length;
  }
  return out;
}
