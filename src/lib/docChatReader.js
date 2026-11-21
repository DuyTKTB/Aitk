/* ============================================================
   docChatReader.js — Đọc tài liệu PDF / DOCX / XLSX / TXT cho ELEC AI Chat
   - PDF có text: trích xuất từng trang gắn nhãn [Trang 1], [Trang 2]... để AI
     trích dẫn nguồn chuẩn phong cách Perplexity / NotebookLM
   - PDF scan (không có text): tự động fallback sang base64 PDF để Gemini Vision đọc
   - DOCX / XLSX / TXT / MD / CSV: tái sử dụng src/lib/fileReader.js
   ============================================================ */
import { readFile as readGenericFile, detectKind, FILE_KIND } from './fileReader.js';

const MAX_DOC_CHARS = 18000;
const MAX_PDF_PAGES = 25;

export const DOC_EXT_RE = /\.(pdf|docx|xlsx|xls|txt|md|csv)$/i;

export function isDocumentFile(file) {
  if (!file) return false;
  const kind = detectKind(file);
  return kind === FILE_KIND.PDF || kind === FILE_KIND.DOCX || kind === FILE_KIND.XLSX || kind === FILE_KIND.TEXT;
}

async function extractPdfTextByPage(file) {
  const pdfjs = await import('pdfjs-dist');
  // Dùng worker local hoặc disable worker gọn nhẹ trên browser Vite
  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    try {
      const workerMod = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
    } catch {
      // fallback nếu môi trường không hỗ trợ ?url
    }
  }
  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages || 0;
  const limit = Math.min(totalPages, MAX_PDF_PAGES);
  const pages = [];
  let charCount = 0;

  for (let p = 1; p <= limit; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const line = (tc.items || [])
      .map((it) => (typeof it.str === 'string' ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (line) {
      const chunk = `[Trang ${p}]\n${line}`;
      pages.push(chunk);
      charCount += chunk.length;
      if (charCount >= MAX_DOC_CHARS) break;
    }
  }

  return {
    totalPages,
    extractedPages: pages.length,
    text: pages.join('\n\n').slice(0, MAX_DOC_CHARS),
  };
}

export async function readChatDocument(file) {
  const kind = detectKind(file);
  if (kind === FILE_KIND.PDF) {
    try {
      const pdfRes = await extractPdfTextByPage(file);
      if (pdfRes.text && pdfRes.text.length >= 40) {
        return {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          kind: 'pdf',
          name: file.name,
          size: file.size,
          pages: pdfRes.totalPages,
          text: pdfRes.text,
          metaLabel: `${pdfRes.totalPages} trang`,
        };
      }
    } catch (e) {
      console.warn('[docChatReader] PDF text extraction fallback to native vision:', e?.message);
    }
    // PDF scan ảnh → fallback native base64 để Gemini đọc trực tiếp
    const fallback = await readGenericFile(file);
    return {
      id: fallback.id,
      kind: 'pdf',
      name: fallback.name,
      size: fallback.size,
      base64: fallback.base64,
      mimeType: 'application/pdf',
      metaLabel: 'PDF ảnh scan',
    };
  }

  const parsed = await readGenericFile(file);
  const cleanText = String(parsed.text || '').slice(0, MAX_DOC_CHARS);
  const words = cleanText ? cleanText.split(/\s+/).length : 0;
  return {
    id: parsed.id,
    kind: parsed.kind,
    name: parsed.name,
    size: parsed.size,
    text: cleanText,
    metaLabel: words > 0 ? `~${words.toLocaleString('vi-VN')} từ` : parsed.kind.toUpperCase(),
  };
}

export function formatDocsPromptBlock(docs = []) {
  const textDocs = docs.filter((d) => d.text);
  if (textDocs.length === 0) return '';
  const body = textDocs
    .map((d, idx) => `--- TÀI LIỆU #${idx + 1}: "${d.name}" (${d.metaLabel}) ---\n${d.text}`)
    .join('\n\n');
  return [
    'TÀI LIỆU ĐÍNH KÈM CỦA NGƯỜI HỌC (CHỈ DÙNG LÀM NGUỒN THAM KHẢO & TRÍCH DẪN):',
    body,
    'QUY TẮC TRÍCH DẪN: Khi trả lời dựa trên tài liệu trên, hãy gắn thẻ nguồn gọn dạng `[Trang X]` (nếu là PDF) hoặc `[Tài liệu: tên file]` ngay sau ý quan trọng.',
  ].join('\n\n');
}
