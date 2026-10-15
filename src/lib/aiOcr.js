/* ============================================================
   aiOcr.js — OCR DỰ PHÒNG CHO ẢNH ĐỀ BÀI
   ------------------------------------------------------------
   Gemini là provider duy nhất đọc được ảnh. Nếu key Gemini hết quota
   hoặc lỗi, ảnh đề bài sẽ "chết". Module này OCR ảnh ngay trên máy
   (tesseract.js đã có trong dependencies) rồi chuyển thành văn bản để
   các model text (Groq / Agnes) vẫn giải được bài.

   Tải tesseract theo kiểu lazy → không ảnh hưởng bundle khởi động.
   ============================================================ */

let workerPromise = null;

async function getWorker() {
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    const mod = await import('tesseract.js');
    const createWorker = mod.createWorker || mod.default?.createWorker;
    if (!createWorker) throw new Error('Không nạp được tesseract');
    // vie+eng: đề Hóa Việt Nam thường lẫn ký hiệu tiếng Anh
    return createWorker(['vie', 'eng']);
  })().catch((e) => { workerPromise = null; throw e; });
  return workerPromise;
}

/**
 * ocrImages(dataUrls) → { text, perImage: [text], ok }
 * dataUrls: mảng data URL (data:image/...;base64,...)
 */
export async function ocrImages(dataUrls, { onProgress } = {}) {
  const list = (dataUrls || []).filter(Boolean).slice(0, 5);
  if (!list.length) return { text: '', perImage: [], ok: false };

  try {
    const worker = await getWorker();
    const perImage = [];
    for (let i = 0; i < list.length; i++) {
      try {
        const { data } = await worker.recognize(list[i]);
        const t = String(data?.text || '').replace(/\n{3,}/g, '\n\n').trim();
        perImage.push(t);
        onProgress?.(Math.round(((i + 1) / list.length) * 100));
      } catch {
        perImage.push('');
      }
    }
    const merged = perImage
      .map((t, i) => (list.length > 1 ? `— Ảnh ${i + 1} —\n${t}` : t))
      .filter((t) => t.replace(/—.*—/, '').trim().length > 0)
      .join('\n\n');

    return { text: merged, perImage, ok: merged.length > 8 };
  } catch (e) {
    console.warn('[ELEC AI] OCR không khả dụng:', e?.message || e);
    return { text: '', perImage: [], ok: false };
  }
}

/** Giải phóng worker (gọi khi cần tiết kiệm RAM; tự nạp lại khi dùng tiếp). */
export async function releaseOcr() {
  try {
    const worker = await workerPromise;
    await worker?.terminate?.();
  } catch { /* */ }
  workerPromise = null;
}
