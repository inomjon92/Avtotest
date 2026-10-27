/** Rasmlarni brauzerda tekshirib, kichraytirib, data URL ga aylantiradi (server hajmini tejash uchun). */

/** Qabul qilinadigan rasm turlari (fayl tanlash oynasi uchun) */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
export const IMAGE_FORMATS = 'JPEG, PNG yoki WebP';
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT = /\.(jpe?g|png|webp)$/i;
const MAX_INPUT = 15 * 1024 * 1024;

/** Fayl turini tekshiradi; mos kelmasa tushunarli xato qaytaradi */
export function checkImageFile(file: File) {
  const okType = file.type ? TYPES.includes(file.type.toLowerCase()) : EXT.test(file.name);
  if (!okType) throw new Error(`Faqat ${IMAGE_FORMATS} rasm yuklash mumkin`);
  if (file.size > MAX_INPUT) throw new Error('Rasm juda katta (15 MB dan oshmasin)');
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(img.src); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("Rasmni o'qib bo'lmadi. " + IMAGE_FORMATS + ' fayl tanlang')); };
    img.src = URL.createObjectURL(file);
  });
}

const bytes = (dataUrl: string) => Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);

/**
 * Rasmni `max` pikselgacha kichraytiradi va hajmini `maxBytes` dan oshirmaydi.
 * Oddiy rasmlar JPEG (oq fon bilan), `keepAlpha` bo'lsa (yo'l belgilari) — shaffof fon saqlanadi (WebP yoki PNG).
 */
export async function resizeImage(file: File, max = 900, opts: { maxBytes?: number; keepAlpha?: boolean } = {}): Promise<string> {
  checkImageFile(file);
  const img = await loadImage(file);
  const maxBytes = opts.maxBytes ?? 300_000;
  let side = max;
  for (let attempt = 0; attempt < 6; attempt++) {
    const k = Math.min(1, side / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * k));
    canvas.height = Math.max(1, Math.round(img.height * k));
    const ctx = canvas.getContext('2d')!;
    if (!opts.keepAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (opts.keepAlpha) {
      // WebP ni qo'llamaydigan brauzerlar PNG qaytaradi
      const url = canvas.toDataURL('image/webp', 0.85);
      const out = url.startsWith('data:image/webp') ? url : canvas.toDataURL('image/png');
      if (bytes(out) <= maxBytes) return out;
    } else {
      for (const quality of [0.82, 0.7, 0.55]) {
        const out = canvas.toDataURL('image/jpeg', quality);
        if (bytes(out) <= maxBytes) return out;
      }
    }
    side = Math.round(Math.min(side, Math.max(img.width, img.height)) * 0.75);
  }
  throw new Error("Rasmni yetarlicha kichraytirib bo'lmadi, boshqa rasm tanlang");
}
