/* ============================================================
   fileReader.js — Đọc file (ảnh/PDF/DOCX/XLSX/TXT) → text + ảnh
   ------------------------------------------------------------
   • Ảnh (JPG/PNG/WebP/GIF): trả về base64 để Gemini đọc
   • PDF: trả về base64 để Gemini đọc (native vision)
   • DOCX: dùng mammoth → extract text
   • XLSX/XLS: dùng xlsx → extract text từ mọi sheet
   • TXT/CSV/MD: đọc trực tiếp
   ============================================================ */

const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_IMG_MB = 5;
const MAX_FILE_MB = 20;

const EXT = (name) => (name || '').toLowerCase().split('.').pop();

export const FILE_KIND = {
  IMAGE: 'image',
  PDF: 'pdf',
  DOCX: 'docx',
  XLSX: 'xlsx',
  TEXT: 'text',
  UNKNOWN: 'unknown',
};

export function detectKind(file) {
  const ext = EXT(file?.name);
  if (file?.type?.startsWith('image/') || ['jpg','jpeg','png','webp','gif','heic','heif'].includes(ext)) return FILE_KIND.IMAGE;
  if (file?.type === 'application/pdf' || ext === 'pdf') return FILE_KIND.PDF;
  if (ext === 'docx') return FILE_KIND.DOCX;
  if (ext === 'doc') return FILE_KIND.UNKNOWN; // .doc cũ không hỗ trợ
  if (['xlsx','xls'].includes(ext)) return FILE_KIND.XLSX;
  if (['txt','md','csv'].includes(ext)) return FILE_KIND.TEXT;
  return FILE_KIND.UNKNOWN;
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      const base64 = s.includes(',') ? s.split(',')[1] : s;
      resolve(base64);
    };
    r.onerror = () => reject(new Error('Không đọc được file.'));
    r.readAsDataURL(file);
  });

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Không đọc được file.'));
    r.readAsDataURL(file);
  });

const fileToText = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Không đọc được file.'));
    r.readAsText(file, 'utf-8');
  });

/* ============================================================
   ĐỌC FILE — trả về { kind, name, size, ... }
   ------------------------------------------------------------
   Ảnh:  { kind:'image',  dataUrl, base64, mimeType, width, height }
   PDF:  { kind:'pdf',    base64, mimeType:'application/pdf' }
   DOCX: { kind:'docx',   text, html? }
   XLSX: { kind:'xlsx',   text }
   TEXT: { kind:'text',   text }
   ============================================================ */
export async function readFile(file) {
  if (!file) throw new Error('Không có file.');
  const kind = detectKind(file);
  const base = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: file.size,
    kind,
  };

  if (kind === FILE_KIND.UNKNOWN) {
    throw new Error(`Định dạng file không hỗ trợ: ${file.name}`);
  }

  /* ---- Ảnh ---- */
  if (kind === FILE_KIND.IMAGE) {
    if (file.size > MAX_IMG_MB * 1024 * 1024) {
      throw new Error(`Ảnh "${file.name}" quá lớn (tối đa ${MAX_IMG_MB} MB).`);
    }
    const dataUrl = await fileToDataUrl(file);
    const base64 = dataUrl.split(',')[1];
    const mimeType = (dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg';
    const dims = await imageDimensions(dataUrl);
    return { ...base, dataUrl, base64, mimeType, width: dims.width, height: dims.height };
  }

  /* ---- PDF ---- */
  if (kind === FILE_KIND.PDF) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      throw new Error(`File "${file.name}" quá lớn (tối đa ${MAX_FILE_MB} MB).`);
    }
    const base64 = await fileToBase64(file);
    return { ...base, base64, mimeType: 'application/pdf' };
  }

  /* ---- DOCX ---- */
  if (kind === FILE_KIND.DOCX) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      throw new Error(`File "${file.name}" quá lớn (tối đa ${MAX_FILE_MB} MB).`);
    }
    const mammoth = await import('mammoth/mammoth.browser.js');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = String(result?.value || '').trim();
    if (!text) throw new Error(`File "${file.name}" không có nội dung text.`);
    return { ...base, text };
  }

  /* ---- XLSX ---- */
  if (kind === FILE_KIND.XLSX) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      throw new Error(`File "${file.name}" quá lớn (tối đa ${MAX_FILE_MB} MB).`);
    }
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const parts = [];
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      if (csv.trim()) {
        parts.push(`### Sheet: ${sheetName}\n${csv.trim()}`);
      }
    }
    const text = parts.join('\n\n');
    if (!text) throw new Error(`File "${file.name}" không có dữ liệu.`);
    return { ...base, text };
  }

  /* ---- TEXT ---- */
  if (kind === FILE_KIND.TEXT) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      throw new Error(`File "${file.name}" quá lớn (tối đa ${MAX_FILE_MB} MB).`);
    }
    const text = (await fileToText(file)).trim();
    if (!text) throw new Error(`File "${file.name}" rỗng.`);
    return { ...base, text };
  }

  throw new Error(`Không xử lý được file: ${file.name}`);
}

const imageDimensions = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });

/* ============================================================
   VALIDATE — kiểm tra số lượng + tổng kích thước
   ============================================================ */
export function validateFiles(files, { maxImages = 10, maxFiles = 3 } = {}) {
  const imgs = files.filter((f) => detectKind(f) === FILE_KIND.IMAGE);
  const others = files.filter((f) => detectKind(f) !== FILE_KIND.IMAGE);
  const errors = [];
  if (imgs.length > maxImages) errors.push(`Chỉ nhận tối đa ${maxImages} ảnh (bạn chọn ${imgs.length}).`);
  if (others.length > maxFiles) errors.push(`Chỉ nhận tối đa ${maxFiles} file PDF/DOCX/XLSX (bạn chọn ${others.length}).`);
  const bad = files.find((f) => detectKind(f) === FILE_KIND.UNKNOWN);
  if (bad) errors.push(`"${bad.name}" không phải ảnh/PDF/DOCX/XLSX/TXT.`);
  return errors;
}

/* ============================================================
   FORMAT SIZE — hiển thị KB/MB
   ============================================================ */
export const fmtSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
};

/* ============================================================
   BUILD PROMPT CONTEXT — gộp text + ảnh để gửi Gemini
   ============================================================ */
export function buildFileContext(files) {
  const textParts = [];
  const imageParts = [];
  const pdfParts = [];

  files.forEach((f) => {
    if (f.kind === FILE_KIND.IMAGE) {
      imageParts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } });
    } else if (f.kind === FILE_KIND.PDF) {
      pdfParts.push({ inlineData: { mimeType: 'application/pdf', data: f.base64 } });
    } else if (f.text) {
      textParts.push(`### File: ${f.name}\n${f.text}`);
    }
  });

  return { textParts, imageParts, pdfParts };
}