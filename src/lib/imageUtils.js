/* ============================================================
   IMAGE UTILS — Nén ảnh base64/File an toàn trước khi lưu Firestore
   ------------------------------------------------------------
   Firestore giới hạn mỗi document tối đa 1 MiB. Ảnh nhúng trong file
   Word (.docx) hoặc upload trực tiếp thường rất lớn (500 KB - 3 MB),
   nên cần nén nhẹ về JPEG/WebP phù hợp trước khi lưu.
   ============================================================ */

export const isUnsupportedVectorDataUrl = (url = '') =>
  /^data:image\/(?:x-)?(?:wmf|emf)\b/i.test(String(url || '').trim());

export const estimateDataUrlBytes = (url = '') => {
  const s = String(url || '');
  const idx = s.indexOf('base64,');
  if (idx === -1) return s.length;
  const b64 = s.slice(idx + 7).trim();
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - pad);
};

/**
 * Nén một chuỗi data:image/... sang JPEG <= maxW (giữ nguyên SVG, bỏ WMF/EMF).
 * Trả nguyên gốc nếu môi trường không có DOM/Canvas hoặc ảnh đã nhỏ.
 */
export const compressImageDataUrl = (
  dataUrl,
  { maxW = 900, quality = 0.74, skipSmallBytes = 38 * 1024 } = {}
) => {
  if (!dataUrl || typeof dataUrl !== 'string') return Promise.resolve('');
  const trimmed = dataUrl.trim();
  if (!trimmed.startsWith('data:image/')) return Promise.resolve(trimmed);
  if (isUnsupportedVectorDataUrl(trimmed)) return Promise.resolve('');
  if (/^data:image\/svg\+xml\b/i.test(trimmed)) return Promise.resolve(trimmed);
  if (estimateDataUrlBytes(trimmed) <= skipSmallBytes) return Promise.resolve(trimmed);

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(trimmed);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w0 = img.naturalWidth || img.width || 0;
        const h0 = img.naturalHeight || img.height || 0;
        if (!w0 || !h0) {
          resolve(trimmed);
          return;
        }
        const ratio = Math.min(1, maxW / w0);
        const w = Math.max(1, Math.round(w0 * ratio));
        const h = Math.max(1, Math.round(h0 * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(trimmed);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed.length < trimmed.length ? compressed : trimmed);
      } catch {
        resolve(trimmed);
      }
    };
    img.onerror = () => resolve(trimmed);
    img.src = trimmed;
  });
};

/**
 * Đọc File ảnh và nén về JPEG nhẹ (tối đa maxBytes đầu vào).
 */
export const fileToCompressedDataUrl = (
  file,
  { maxW = 1000, quality = 0.76, maxInputBytes = 10 * 1024 * 1024 } = {}
) =>
  new Promise((resolve, reject) => {
    if (!file || !/^image\//i.test(file.type || '')) {
      reject(new Error('File không phải là ảnh hợp lệ.'));
      return;
    }
    if (file.size > maxInputBytes) {
      reject(new Error(`Ảnh quá lớn (tối đa ${Math.round(maxInputBytes / 1024 / 1024)} MB).`));
      return;
    }
    if (typeof FileReader === 'undefined') {
      reject(new Error('Trình duyệt không hỗ trợ đọc file ảnh.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = String(reader.result || '');
        const out = await compressImageDataUrl(raw, { maxW, quality, skipSmallBytes: 24 * 1024 });
        resolve(out || raw);
      } catch {
        resolve(String(reader.result || ''));
      }
    };
    reader.onerror = () => reject(new Error('Không đọc được ảnh này.'));
    reader.readAsDataURL(file);
  });
