/* ============================================================
   ExamImporter.jsx — Nhập câu hỏi tự động từ File Word / PDF / Text / JSON (v4.0)
   ------------------------------------------------------------
   NÂNG CẤP TOÀN DIỆN:
   • Tự động trích xuất HÌNH ẢNH từ file Word (.docx) và gắn đúng vào từng câu hỏi / phương án
   • Giải mã công thức OMML (<m:oMath>), MathType, chỉ số trên/dưới (², ³, ⁺, ⁻, ₂, ₄...)
   • Nhận diện chuẩn định dạng đề 3 phần GDPT 2025:
       - Phần I: Trắc nghiệm 4 lựa chọn (in đậm / gạch chân / tô màu / bảng đáp án / chuỗi đáp án nhanh)
       - Phần II: Trắc nghiệm Đúng/Sai a), b), c), d) (gạch chân ý Đúng / dòng Đáp án: Đ-S-Đ-S / bảng đáp án)
       - Phần III: Trắc nghiệm Trả lời ngắn (Đáp án: 12,5 / bảng đáp án)
   • Nhận diện tự động nhãn mức độ [NB], [TH], [VD], [VDC] đầu câu và ẩn nhãn khỏi nội dung câu hỏi
   • Hỗ trợ chế độ đề Tiếng Anh (File Word English: nhóm câu hỏi [ ], Read the..., Answer:)
   • Tải file Word mẫu (.docx) chuẩn 3 phần có sẵn công thức & đáp án gạch chân
   • Hỗ trợ cả "Thay thế đề cũ" và "Nối thêm vào cuối"
   ============================================================ */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import MathText from '../MathText.jsx';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import { exportToWord } from '../../lib/examExport.js';
import { askAI } from '../../lib/ai.js';
import { runWithCredit } from '../../lib/creditService.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { detectExamSubjectAndGrade } from '../../lib/subjectClassifier.js';
import WordDocxEditor from './WordDocxEditor.jsx';

/* Tiện ích sửa JSON và phân tích chuyên đề GDPT 2025 */
function cleanJsonString(raw) {
  if (!raw) return '';
  let inString = false;
  let escaped = false;
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"' && !escaped) {
      inString = !inString;
      out += ch;
    } else if (inString && ch === '\n') {
      out += '\\n';
    } else if (inString && ch === '\r') {
      out += '\\r';
    } else if (inString && ch === '\t') {
      out += '\\t';
    } else {
      out += ch;
    }
    if (ch === '\\' && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }
  return out;
}

function parseExamJsonSafe(text) {
  if (!text) return null;
  const s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try { return JSON.parse(s); } catch (_) {}
  try { return JSON.parse(cleanJsonString(s)); } catch (_) {}
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const sub = s.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(sub); } catch (_) {}
    try { return JSON.parse(cleanJsonString(sub)); } catch (_) {}
  }
  return null;
}

/* ============================================================
   1. TIỆN ÍCH VĂN BẢN, CÔNG THỨC & HÌNH ẢNH
   ============================================================ */
const LETTERS = 'ABCDEF';
const MARK_TAGS = new Set(['U', 'STRONG', 'B', 'MARK']);

const SUP_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ',
};
const SUB_MAP = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎',
};

const toUnicodeSup = (str) => {
  const s = String(str || '').trim();
  if (!s) return '';
  if ([...s].every((ch) => SUP_MAP[ch])) return [...s].map((ch) => SUP_MAP[ch]).join('');
  return `^{${s}}`;
};

const toUnicodeSub = (str) => {
  const s = String(str || '').trim();
  if (!s) return '';
  if ([...s].every((ch) => SUB_MAP[ch])) return [...s].map((ch) => SUB_MAP[ch]).join('');
  return `_${s.length > 1 ? `{${s}}` : s}`;
};

/* Bỏ dấu nhưng GIỮ NGUYÊN độ dài để dùng chung chỉ số với bản gốc */
const fold = (s) =>
  String(s || '')
    .split('')
    .map((c) => (c === 'đ' || c === 'Đ' ? 'd' : c.normalize('NFD')[0]))
    .join('')
    .toLowerCase();

const mkLine = (t) => {
  const z = '0'.repeat(t.length);
  return { t, m: z, u: z, b: z };
};
const sliceLine = (ln, a, b) => ({
  t: ln.t.slice(a, b),
  m: (ln.m || '').slice(a, b),
  u: (ln.u || '').slice(a, b),
  b: (ln.b || '').slice(a, b),
});
const trimLine = (ln) => {
  const a = ln.t.length - ln.t.trimStart().length;
  const b = ln.t.trimEnd().length;
  return b <= a ? { t: '', m: '', u: '', b: '' } : sliceLine(ln, a, b);
};

/* Giữ nguyên thụt lề trong khối ``` (code); dòng thường thì bỏ markdown */
const textToLines = (raw) => {
  let inFence = false;
  const out = [];
  String(raw || '').replace(/\r/g, '').split('\n').forEach((s0) => {
    const s = s0.replace(/[\u00a0\u200b\u3000]/g, ' ');
    if (/^\s*(?:```|~~~)/.test(s)) {
      if (!inFence) { inFence = true; out.push({ ...mkLine(s.trim()), code: 'open' }); }
      else { inFence = false; out.push({ ...mkLine('```'), code: 'close' }); }
      return;
    }
    if (inFence) { out.push({ ...mkLine(s.replace(/\t/g, '    ').replace(/\s+$/, '')), code: 'in' }); return; }
    const t = s
      .normalize('NFC')
      .replace(/\t/g, ' ')
      .replace(/\*\*|__/g, '')
      .replace(/^\s*(?:#{1,6}\s+|>\s*|[-•]\s+)/, '')
      .replace(/ {2,}/g, ' ');
    out.push(mkLine(t));
  });
  return out;
};

/* ----- Regex nhận diện ----- */
const Q_RE = /^(?:(?:cau(?:\s*hoi)?|bai|question|q)\s*(\d{1,3})\s*[.:)\-–]?|(\d{1,3})[.)](?!\d)|\[\s*(\d{1,3})\s*\])\s*/;
const OPT_RE = /^[*✓✔]?\s*\(?([A-Fa-f])[.)]\s*/;
const ANS_LETTER_RES = [
  /^(?:dap\s*an(?:\s*dung)?|answer)\s*(?:la\s*)?[:\-.]?\s*\(?([a-f])\)?(?![a-z0-9])(.*)$/,
  /^(?:da|ans|key)\s*[:\-.]\s*\(?([a-f])\)?(?![a-z0-9])(.*)$/,
];
const ANS_TEXT_RE = /^(?:dap\s*an(?:\s*dung)?|answer)\s*[:\-.]\s*(.+)$/;
const EXPLAIN_RE = /^(?:giai thich|loi giai(?: chi tiet)?|huong dan(?: giai)?|answer\s*:|explanation|explain)\s*(?:[:\-.]\s*(.*))?$/;
const KEY_HEAD_RE = /^(?:bang\s*)?dap\s*an(?:\s*(?:chi tiet|tham khao|goi y))?\s*[:\-]?\s*/;
const KEY_PAIR_RE = /(?:cau\s*)?(\d{1,3})\s*[.:\-–)=]*\s*([a-f])\b/g;
const SECTION_RE = /^(?:phan|part|section)\s+(?:[ivx]+|\d+)\b/;

/* Nhận diện nhãn mức độ [NB], [TH], [VD], [VDC] ở đầu câu hỏi */
const LEVEL_TAG_RE = /^\s*(?:[\[(]\s*(nb|th|vd|vdc|nhan\s*biet|thong\s*hieu|van\s*dung\s*cao|van\s*dung)\s*[\])]\s*[:.\-–]?\s*)/i;

const parseAndStripLevelTag = (text) => {
  const s = String(text || '');
  const f = fold(s);
  const m = f.match(LEVEL_TAG_RE);
  if (!m) {
    // Kiểm tra trường hợp nhãn [NB] nằm ở cuối câu hỏi
    const tailMatch = f.match(/\s*[\[(]\s*(nb|th|vd|vdc)\s*[\])]\s*$/i);
    if (tailMatch) {
      const rawTag = tailMatch[1].toLowerCase();
      const lv = rawTag === 'vdc' ? 'vdc' : rawTag === 'vd' ? 'vd' : rawTag === 'th' ? 'th' : 'nb';
      return { level: lv, text: s.slice(0, tailMatch.index).trim(), hadTag: true };
    }
    return { level: '', text: s.trim(), hadTag: false };
  }
  const rawTag = m[1].replace(/\s+/g, '');
  let lv = 'nb';
  if (rawTag === 'vdc' || rawTag.includes('vandungcao')) lv = 'vdc';
  else if (rawTag === 'vd' || rawTag.includes('vandung')) lv = 'vd';
  else if (rawTag === 'th' || rawTag.includes('thonghieu')) lv = 'th';
  return {
    level: lv,
    text: s.slice(m[0].length).trim(),
    hadTag: true,
  };
};

const isQStart = (text) => Q_RE.test(fold(text.trim()));
const isOptStart = (text) => OPT_RE.test(text.trim());

const readKey = (f) => {
  const pairs = [];
  const rest = f.replace(KEY_PAIR_RE, (_, n, l) => { pairs.push([Number(n), l.toUpperCase()]); return ' '; });
  const leftover = rest.replace(/\b(?:cau|dap an|da|stt|bang|chi tiet|tham khao)\b/g, '').replace(/[\s,;|:.\-]+/g, '').trim();
  return { pairs, clean: pairs.length > 0 && leftover.length <= 6 };
};

/* Đếm công thức Toán / Hóa trong danh sách câu hỏi */
const countFormulasInText = (str) => {
  const s = String(str || '');
  const latexMatches = s.match(/\$[^$]+\$|\\ce\{|\\frac|\\sqrt|[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀₁₂₃₄₅₆₇₈₉→⇌⇄∆°]/g);
  return latexMatches ? latexMatches.length : 0;
};

/* ============================================================
   2. ĐỌC FILE WORD (.DOCX) + TRÍCH XUẤT HÌNH ẢNH + GIẢI MÃ OMML
   ============================================================ */

/* Giải mã node <m:oMath> của Word thành chuỗi công thức đọc được */
const convertOmmlNode = (node) => {
  if (!node) return '';
  const local = node.localName || node.nodeName?.replace(/^.*:/, '');
  const childrenText = () =>
    Array.from(node.childNodes || []).map(convertOmmlNode).join('');

  if (local === 't') return node.textContent || '';
  if (local === 'f') {
    const num = node.getElementsByTagNameNS('*', 'num')[0];
    const den = node.getElementsByTagNameNS('*', 'den')[0];
    const nTxt = num ? convertOmmlNode(num).trim() : '';
    const dTxt = den ? convertOmmlNode(den).trim() : '';
    return `(${nTxt})/(${dTxt})`;
  }
  if (local === 'sSup') {
    const e = node.getElementsByTagNameNS('*', 'e')[0];
    const sup = node.getElementsByTagNameNS('*', 'sup')[0];
    return `${e ? convertOmmlNode(e) : ''}${toUnicodeSup(sup ? convertOmmlNode(sup) : '')}`;
  }
  if (local === 'sSub') {
    const e = node.getElementsByTagNameNS('*', 'e')[0];
    const sub = node.getElementsByTagNameNS('*', 'sub')[0];
    return `${e ? convertOmmlNode(e) : ''}${toUnicodeSub(sub ? convertOmmlNode(sub) : '')}`;
  }
  if (local === 'sSubSup') {
    const e = node.getElementsByTagNameNS('*', 'e')[0];
    const sub = node.getElementsByTagNameNS('*', 'sub')[0];
    const sup = node.getElementsByTagNameNS('*', 'sup')[0];
    return `${e ? convertOmmlNode(e) : ''}${toUnicodeSub(sub ? convertOmmlNode(sub) : '')}${toUnicodeSup(sup ? convertOmmlNode(sup) : '')}`;
  }
  if (local === 'rad') {
    const e = node.getElementsByTagNameNS('*', 'e')[0];
    return `√(${e ? convertOmmlNode(e) : ''})`;
  }
  if (local === 'd') {
    return `(${childrenText()})`;
  }
  return childrenText();
};

/* Tiền xử lý file .docx bằng JSZip để:
   1. Giải mã toàn bộ công thức OMML (<m:oMath>) thành văn bản/Unicode
   2. Đánh dấu gạch chân cho các chữ được tô màu đỏ/xanh hoặc highlight (đáp án đúng) */
const preprocessDocxBuffer = async (arrayBuffer) => {
  let ommlCount = 0;
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docFile = zip.file('word/document.xml');
    if (!docFile) return { buffer: arrayBuffer, ommlCount: 0 };

    let xmlStr = await docFile.async('string');

    // 0. Chuyển đổi wp:anchor (ảnh floating/nổi) thành wp:inline (ảnh inline)
    // để Mammoth đọc được 100% hình ảnh, sơ đồ và đồ thị không bị bỏ sót
    xmlStr = xmlStr
      .replace(/<wp:anchor\b/g, '<wp:inline')
      .replace(/<\/wp:anchor>/g, '</wp:inline>');

    // 1. Chuyển <m:oMath>...</m:oMath> thành <w:r><w:t>...</w:t></w:r>
    if (xmlStr.includes(':oMath')) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
      const oMaths = Array.from(xmlDoc.getElementsByTagNameNS('*', 'oMath'));
      ommlCount = oMaths.length;
      oMaths.forEach((mathNode) => {
        const formulaText = convertOmmlNode(mathNode);
        if (formulaText && mathNode.parentNode) {
          const wRun = xmlDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:r');
          const wText = xmlDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:t');
          wText.setAttribute('xml:space', 'preserve');
          wText.textContent = formulaText;
          wRun.appendChild(wText);
          mathNode.parentNode.replaceChild(wRun, mathNode);
        }
      });
      xmlStr = new XMLSerializer().serializeToString(xmlDoc);
    }

    // 2. Nếu giáo viên đánh dấu đáp án đúng bằng tô màu chữ (đỏ/xanh/cam/tím...) hoặc highlight vàng/xanh trong Word,
    // thêm <w:u w:val="single"/> vào <w:rPr> để Mammoth nhận diện thành <u>
    xmlStr = xmlStr.replace(
      /<w:rPr>([\s\S]*?)<\/w:rPr>/g,
      (full, inner) => {
        if (/<w:u\b/.test(inner)) return full;
        const hasHighlight = /<w:highlight\s+w:val="(?!none")[^"]+"/.test(inner);
        const colorMatch = inner.match(/<w:color\s+w:val="([^"]+)"/i);
        const colorVal = colorMatch ? colorMatch[1].toUpperCase() : '';
        const isColoredAnswer =
          colorVal &&
          !/^(?:AUTO|000000|0F172A|1E293B|334155|475569|111827|222222|333333)$/.test(colorVal);
        if (hasHighlight || isColoredAnswer) {
          return `<w:rPr>${inner}<w:u w:val="single"/></w:rPr>`;
        }
        return full;
      }
    );

    zip.file('word/document.xml', xmlStr);
    const newBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    return { buffer: newBuffer, ommlCount };
  } catch {
    return { buffer: arrayBuffer, ommlCount: 0 };
  }
};

const loadMammoth = async () => {
  const m = await import('mammoth/mammoth.browser.js');
  return m.default || m;
};

const UL_TAGS = new Set(['U', 'INS', 'MARK']);
const BOLD_TAGS = new Set(['B', 'STRONG']);

const collect = (node, state, acc) => {
  const st = typeof state === 'object' && state !== null ? state : { u: Boolean(state), b: Boolean(state) };
  const push = (s, uFlag, bFlag) => {
    const n = s.length;
    acc.t += s;
    acc.u += (uFlag ? '1' : '0').repeat(n);
    acc.b += (bFlag ? '1' : '0').repeat(n);
    acc.m += (uFlag || bFlag ? '1' : '0').repeat(n);
  };
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = n.nodeValue
        .normalize('NFC')
        .replace(/[\u00a0\u200b\t\u3000]/g, ' ')
        .replace(/\s+/g, ' ');
      push(t, st.u, st.b);
    } else if (n.nodeType === 1) {
      const tag = n.tagName;
      if (tag === 'BR') {
        push('\n', false, false);
      } else if (tag === 'IMG') {
        const src = n.getAttribute('src') || '';
        const m = src.match(/^__DOCX_IMG_(\d+)__$/);
        if (m) {
          push(` [[IMG_${m[1]}]] `, false, false);
          acc.imgs++;
        }
      } else if (tag === 'SUP') {
        const subAcc = { t: '', m: '', u: '', b: '', imgs: 0, formulas: 0 };
        collect(n, st, subAcc);
        push(toUnicodeSup(subAcc.t), st.u, st.b);
        acc.formulas = (acc.formulas || 0) + 1;
      } else if (tag === 'SUB') {
        const subAcc = { t: '', m: '', u: '', b: '', imgs: 0, formulas: 0 };
        collect(n, st, subAcc);
        push(toUnicodeSub(subAcc.t), st.u, st.b);
        acc.formulas = (acc.formulas || 0) + 1;
      } else if (tag === 'OL' || tag === 'UL' || tag === 'TABLE') {
        return;
      } else {
        const nextSt = {
          u: st.u || UL_TAGS.has(tag),
          b: st.b || BOLD_TAGS.has(tag),
        };
        collect(n, nextSt, acc);
        if (tag === 'P') push(' ', false, false);
      }
    }
  });
};

const flushAcc = (lines, acc, prefix = '') => {
  let off = 0;
  acc.t.split('\n').forEach((seg, i) => {
    const ln = trimLine({
      t: seg,
      m: acc.m.slice(off, off + seg.length),
      u: (acc.u || '').slice(off, off + seg.length),
      b: (acc.b || '').slice(off, off + seg.length),
    });
    off += seg.length + 1;
    if (!ln.t) return;
    if (i === 0 && prefix) {
      const z = '0'.repeat(prefix.length);
      lines.push({ t: prefix + ln.t, m: z + ln.m, u: z + ln.u, b: z + ln.b });
    } else {
      lines.push(ln);
    }
  });
};

const htmlToLines = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lines = [];
  let imgs = 0;
  let subSupFormulas = 0;
  let qn = 0;
  const newAcc = () => ({ t: '', m: '', u: '', b: '', imgs: 0, formulas: 0 });

  const walk = (parent, depth, listsOnly) => {
    for (const el of parent.children) {
      const tag = el.tagName;
      if (tag === 'OL' || tag === 'UL') {
        const prev = el.previousElementSibling;
        const asOpts = tag === 'OL' && (depth > 0 || (prev && /^(P|H\d)$/.test(prev.tagName) && isQStart(prev.textContent || '')));
        let i = 0;
        for (const li of el.children) {
          i++;
          const acc = newAcc();
          collect(li, { u: false, b: false }, acc);
          imgs += acc.imgs;
          subSupFormulas += acc.formulas;
          let prefix = '';
          const probe = acc.t.trim();
          if (tag === 'OL') {
            if (asOpts) { if (!isOptStart(probe)) prefix = `${LETTERS[i - 1] || 'F'}. `; }
            else { qn++; if (!isQStart(probe)) prefix = `Câu ${qn}. `; }
          }
          flushAcc(lines, acc, prefix);
          walk(li, depth + 1, true);
        }
      } else if (tag === 'TABLE') {
        el.querySelectorAll('tr').forEach((tr) => {
          const acc = newAcc();
          tr.querySelectorAll('th,td').forEach((td) => {
            collect(td, { u: false, b: false }, acc);
            acc.t += ' '; acc.m += '0'; acc.u += '0'; acc.b += '0';
          });
          imgs += acc.imgs;
          subSupFormulas += acc.formulas;
          flushAcc(lines, acc);
        });
      } else if (!listsOnly) {
        const acc = newAcc();
        collect(el, { u: false, b: false }, acc);
        imgs += acc.imgs;
        subSupFormulas += acc.formulas;
        flushAcc(lines, acc);
        walk(el, depth, true);
      }
    }
  };
  walk(doc.body, 0, false);
  return { lines, imgs, subSupFormulas };
};

const readDocx = async (file) => {
  const rawBuffer = await file.arrayBuffer();
  const { buffer, ommlCount } = await preprocessDocxBuffer(rawBuffer);
  const mammoth = await loadMammoth();
  const extractedImages = [];

  const { value } = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      styleMap: [
        'u => u',
        'strike => s',
        'b => strong',
        'sub => sub',
        'sup => sup',
      ],
      convertImage: mammoth.images.imgElement(async (image) => {
        try {
          const ct = String(image.contentType || 'image/png').toLowerCase();
          // Bỏ qua các ảnh WMF/EMF không hiển thị được trên trình duyệt hiện đại
          if (ct.includes('wmf') || ct.includes('emf')) {
            return { src: '' };
          }
          const b64 = await image.read('base64');
          if (!b64) return { src: '' };
          const idx = extractedImages.length;
          extractedImages.push(`data:${ct};base64,${b64}`);
          return { src: `__DOCX_IMG_${idx}__` };
        } catch {
          return { src: '' };
        }
      }),
    }
  );

  const { lines, subSupFormulas } = htmlToLines(value);
  return {
    lines,
    extractedImages,
    formulaCount: ommlCount + Math.ceil(subSupFormulas / 2),
  };
};

/* ----- PDF: dựng dòng theo toạ độ Y ----- */
const readPdf = async (file) => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const max = Math.min(60, pdf.numPages);
  let text = '';
  for (let p = 1; p <= max; p++) {
    const page = await pdf.getPage(p);
    const c = await page.getTextContent();
    let line = '';
    let lastY = null;
    for (const it of c.items) {
      if (typeof it.str !== 'string') continue;
      const y = it.transform?.[5];
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 4) { text += line + '\n'; line = ''; }
      line += (line ? ' ' : '') + it.str;
      if (it.hasEOL) { text += line + '\n'; line = ''; lastY = null; continue; }
      lastY = y;
    }
    text += line + '\n';
  }
  return { text, truncated: pdf.numPages > max, pages: max };
};

/* ============================================================
   3. PHÂN TÍCH CÂU HỎI (HỖ TRỢ 3 PHẦN + HÌNH ẢNH + NHÃN MỨC ĐỘ)
   ============================================================ */
const sectType = (f) => {
  if (/dung\s*(?:\/|-|–|hoac)?\s*sai|true\s*\/?\s*false/.test(f)) return 'tf';
  if (/tra loi ngan|dien so|dien ket qua|short answer|ket qua bang so/.test(f)) return 'sa';
  if (/^(?:phan|part|section)\s+(?:ii|2)\b/.test(f)) return 'tf';
  if (/^(?:phan|part|section)\s+(?:iii|3)\b/.test(f)) return 'sa';
  return 'mc';
};

const bareSectType = (f) => {
  const m = f.match(/^(?:phan|part|section)\s+(iii|ii|i|3|2|1)\b[^a-z]*$/);
  return m ? ({ i: 'mc', 1: 'mc', ii: 'tf', 2: 'tf', iii: 'sa', 3: 'sa' })[m[1]] : null;
};

const TF_PAIR_RE = /([a-d])\s*[-:.)=]?\s*(dung|sai|d|s)(?![a-z])/g;
const readTf = (txt) => {
  const t = String(txt || '').trim();
  const pairs = {};
  let m;
  TF_PAIR_RE.lastIndex = 0;
  while ((m = TF_PAIR_RE.exec(t))) pairs[m[1]] = m[2][0] === 'd';
  if (['a', 'b', 'c', 'd'].every((k) => k in pairs)) return ['a', 'b', 'c', 'd'].map((k) => pairs[k]);
  const tok = t.split(/[^a-z]+/).filter(Boolean);
  if (tok.length === 4 && tok.every((x) => /^(?:dung|sai|d|s)$/.test(x))) return tok.map((x) => x[0] === 'd');
  const comp = t.replace(/[^a-z]/g, '');
  if (/^[ds]{4}$/.test(comp)) return comp.split('').map((x) => x === 'd');
  return null;
};
const SA_NUM = '([+-]?\\d[\\d.,]*)(?![\\d])';

const appendText = (c, text, sep) => {
  if (c.mode === 'explain') c.explain += (c.explain ? sep : '') + text;
  else if (c.mode === 'opts') {
    const o = c.opts[c.opts.length - 1];
    o.t += (o.t ? sep : '') + text;
  } else if (c.mode === 'stem') {
    c.stem += (c.stem ? sep : '') + text;
  }
};

/* Tách các token [[IMG_n]] ra khỏi chuỗi văn bản và trả về { cleanText, imgUrls } */
const extractImgTokens = (str, extractedImages = []) => {
  const urls = [];
  const cleanText = String(str || '')
    .replace(/\[\[IMG_(\d+)\]\]/g, (_, idxStr) => {
      const url = extractedImages[Number(idxStr)];
      if (url) urls.push(url);
      return '';
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { cleanText, imgUrls: urls };
};

/* Tự động phân tích mức độ nhận thức thông minh (NB / TH / VD / VDC) khi đề chưa gắn nhãn [NB]/[TH]/[VD] */
export const classifySmartLevel = (qText, type = 'mcq', explain = '') => {
  const f = fold(`${qText || ''} ${explain || ''}`);
  if (type === 'short_answer' || type === 'sa') {
    if (/(?:hon hop|hieu suat|phan tram|do tan|tinh the|bien luan|cuc dai|cuc tieu)/.test(f)) return 'vdc';
    return 'vd';
  }
  if (type === 'true_false' || type === 'tf') {
    if (/(?:thi nghiem|so do|do thi|hieu suat|suc dien dong|nong do)/.test(f)) return 'vd';
    return 'th';
  }
  if (/(?:hon hop|hieu suat|phan tram khoi luong|do tan|bien luan|gia tri lon nhat|gia tri nho nhat)/.test(f)) {
    return 'vdc';
  }
  if (
    /(?:tinh|khoi luong|the tich|nong do|so mol|suc dien dong|gia tri cua|bao nhieu gam|bao nhieu lit|thu duoc m gam)/.test(f) &&
    /\d/.test(qText || '')
  ) {
    return 'vd';
  }
  if (
    /(?:phat bieu nao|nhan xet nao|qua trinh nao|hien tuong|thi nghiem|so do|giai thich|nguyen nhan|vai tro|so chất|so phat bieu)/.test(f)
  ) {
    return 'th';
  }
  return 'nb';
};

/* Tự động dò đáp án đúng từ Lời giải chi tiết (nếu câu hỏi chưa gạch chân / chưa có bảng đáp án) */
const extractMcqAnswerFromExplain = (explainStr) => {
  const f = fold(explainStr || '');
  if (!f) return -1;
  const patterns = [
    /(?:chon(?:\s+dap\s+an)?|dap\s*an(?:\s+dung)?(?:\s+la)?|ket\s*luan\s*:?\s*chon|=>\s*chon|→\s*chon|vay\s+chon)\s*[:=\-–]?\s*\(?([a-d])\)?(?![a-z0-9])/i,
    /^\s*\(?([a-d])\)\s*(?:dung|la\s+dap\s+an\s+dung)\b/i,
    /(?:=>|→|vay)\s*dap\s*an\s*\(?([a-d])\)?(?![a-z0-9])/i,
  ];
  for (const re of patterns) {
    const m = f.match(re);
    if (m && m[1]) {
      const idx = LETTERS.indexOf(m[1].toUpperCase());
      if (idx >= 0 && idx < 4) return idx;
    }
  }
  return -1;
};

export const parseLines = (lines, extractedImages = []) => {
  let sect = 'mc';
  let keySect = 'mc';
  const tfKey = new Map();
  const saKey = new Map();
  const qs = [];
  const keyQueue = new Map();
  let cur = null;
  let lastNum = 0;
  let inKey = false;
  let pendingNums = null;
  let keyFound = false;
  let currentGroupPassage = '';
  let currentGroupInstruction = '';
  let currentGroupId = '';
  let groupCounter = 0;

  const addKey = (n, L) => {
    if (!keyQueue.has(n)) keyQueue.set(n, []);
    keyQueue.get(n).push(L);
    keyFound = true;
  };

  const pushOpt = (seg) => {
    const m = seg.t.match(OPT_RE);
    if (!m) return;
    const rawLetter = m[1];
    const isLowerLetter = rawLetter === rawLetter.toLowerCase() && ['a', 'b', 'c', 'd'].includes(rawLetter);
    const body = sliceLine(seg, m[0].length);
    let text = body.t.trim();
    let star = /^[*✓✔]/.test(seg.t);
    if (/\*\s*$/.test(text)) { star = true; text = text.replace(/\s*\*+\s*$/, ''); }
    const letterAt = seg.t.search(/[A-Fa-f]/);
    const noSpace = body.t.replace(/\s/g, '').length;

    const uMask = seg.u || seg.m || '';
    const bMask = seg.b || '';
    const bodyUMask = body.u || body.m || '';
    const bodyBMask = body.b || '';

    let uBodyCnt = 0;
    let bBodyCnt = 0;
    for (let i = 0; i < body.t.length; i++) {
      if (/\S/.test(body.t[i])) {
        if (bodyUMask[i] === '1') uBodyCnt++;
        if (bodyBMask[i] === '1') bBodyCnt++;
      }
    }

    const uLetter = letterAt >= 0 && uMask[letterAt] === '1';
    const bLetter = letterAt >= 0 && bMask[letterAt] === '1';
    const uBody = noSpace > 0 && uBodyCnt / noSpace >= 0.35;
    const bBody = noSpace > 0 && bBodyCnt / noSpace >= 0.5;

    const uMarked = uLetter || uBody;
    const bBodyMarked = bBody;
    const bLetterMarked = bLetter;
    const marked = uMarked || bBodyMarked || bLetterMarked;

    cur.opts.push({
      t: text,
      marked,
      uMarked,
      bBodyMarked,
      bLetterMarked,
      star,
      isLowerLetter,
    });
    cur.mode = 'opts';
  };

  const addOptions = (ln, k) => {
    const first = ln.t.match(OPT_RE)[1];
    const upper = first === first.toUpperCase();
    const cuts = [0];
    for (let j = k + 1; j < LETTERS.length; j++) {
      const L = upper ? LETTERS[j] : LETTERS[j].toLowerCase();
      const re = new RegExp('\\s[*✓✔]?\\(?' + L + '[.)]\\s*\\S', 'g');
      re.lastIndex = cuts[cuts.length - 1] + 1;
      const mm = re.exec(ln.t);
      if (!mm) break;
      cuts.push(mm.index + 1);
    }
    cuts.forEach((c, i) => pushOpt(trimLine(sliceLine(ln, c, cuts[i + 1]))));
  };

  const findInlineStart = (t) => {
    const m = /\s[*✓✔]?\(?([Aa])[.)]\s*\S/.exec(t);
    if (!m) return -1;
    const L = m[1] === 'A' ? 'B' : 'b';
    return new RegExp('\\s\\(?' + L + '[.)]\\s*\\S').test(t.slice(m.index + 2)) ? m.index + 1 : -1;
  };

  const absorb = (raw) => {
    const ln = trimLine(raw);
    if (!ln.t || !cur) return;

    // Nếu dòng chỉ chứa hình ảnh [[IMG_x]] thì gắn thẳng vào câu dẫn (stem)
    if (/^(?:\[\[IMG_\d+\]\]\s*)+$/.test(ln.t)) {
      cur.stem += (cur.stem ? ' ' : '') + ln.t;
      return;
    }

    const next = cur.opts.length;
    const m = ln.t.match(OPT_RE);
    if (cur.mode !== 'explain' && cur.mode !== 'skip' && m && LETTERS.indexOf(m[1].toUpperCase()) === next) {
      addOptions(ln, next);
      return;
    }
    if (next === 0 && cur.mode === 'stem') {
      const mi = findInlineStart(ln.t);
      if (mi > 0) {
        cur.stem += (cur.stem ? ' ' : '') + ln.t.slice(0, mi).trim();
        addOptions(sliceLine(ln, mi), 0);
        return;
      }
    }
    appendText(cur, ln.t, cur.nl ? '\n' : ' ');
    cur.nl = false;
  };

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].code) {
      if (cur) {
        appendText(cur, lines[i].code === 'close' ? '```' : lines[i].t, '\n');
        if (lines[i].code === 'close') cur.nl = true;
      }
      continue;
    }
    const ln = trimLine(lines[i]);
    if (!ln.t) continue;
    const f = fold(ln.t);
    let m;

    if (/^(?:trang|page)\s*\d+(?:\s*\/\s*\d+)?$/.test(f) || /^[-_=*.\s]{3,}$/.test(f)) continue;

    /* Hỗ trợ nhóm câu hỏi Tiếng Anh đặt trong [ ... ] hoặc Read the following... */
    if (/^read the following/i.test(ln.t)) {
      groupCounter++;
      currentGroupId = `pg_en_${groupCounter}`;
      currentGroupInstruction = ln.t;
      currentGroupPassage = '';
      continue;
    }

    /* Bảng đáp án dạng 2 dòng trong Word:
       Dòng 1: "Câu 1 2 3 4..." hoặc "1 2 3 4..."
       Dòng 2: "Đáp án A B C D..." hoặc "A B C D..." */
    if ((m = f.match(/^(?:(?:cau|stt)\s+)?(\d{1,3}(?:\s+\d{1,3}){2,})$/))) {
      pendingNums = m[1].trim().split(/\s+/).map(Number);
      continue;
    }
    if (pendingNums && (m = f.match(/^(?:(?:dap\s*an|da)\s+)?((?:[a-f]\s+){2,}[a-f])$/))) {
      const letters = m[1].trim().split(/\s+/);
      if (letters.length === pendingNums.length) {
        pendingNums.forEach((n, j) => addKey(n, letters[j].toUpperCase()));
        pendingNums = null;
        inKey = true;
        cur = null;
        continue;
      }
    }
    pendingNums = null;

    if (inKey) {
      if (SECTION_RE.test(f)) { keySect = sectType(f) !== 'mc' ? sectType(f) : (bareSectType(f) || 'mc'); continue; }
      if (keySect === 'tf' || keySect === 'sa') {
        const k = f.match(/^(?:cau\s*)?(\d{1,2})\s*[.:)\-]?\s*(.+)$/);
        if (k) {
          if (keySect === 'tf') {
            const arr = readTf(k[2]);
            if (arr) { const n = Number(k[1]); if (!tfKey.has(n)) tfKey.set(n, []); tfKey.get(n).push(arr); continue; }
          } else {
            const v = k[2].match(new RegExp('^' + SA_NUM + '\\s*$'));
            if (v) { const n = Number(k[1]); if (!saKey.has(n)) saKey.set(n, []); saKey.get(n).push(v[1].replace(/[.,]+$/, '')); continue; }
          }
        }
      }
      const r = readKey(f);
      if (r.clean) { r.pairs.forEach(([n, L]) => addKey(n, L)); continue; }
      inKey = false;
    }

    if (cur && cur.mode !== 'explain') {
      const mt = f.match(/^(?:dap an|da|answer|key)\s*(?:dung)?\s*[:\-.=]\s*(.+)$/);
      if (mt && (cur.type === 'tf' || cur.type === 'mc')) {
        const arr = readTf(mt[1]);
        if (arr && (cur.type === 'tf' || cur.opts.length === 4)) {
          cur.type = 'tf'; cur.tfAns = arr; cur.explicit = -2; cur.mode = 'skip';
          continue;
        }
      }
      const ms = f.match(new RegExp('^(?:dap an|da|answer|ket qua|kq|dap so)\\s*(?:dung)?\\s*[:\\-.=]\\s*' + SA_NUM));
      if (ms && (cur.type === 'sa' || (cur.type === 'mc' && cur.opts.length === 0))) {
        cur.type = 'sa'; cur.saAns = ms[1].replace(/[.,]+$/, ''); cur.explicit = -2; cur.mode = 'skip';
        continue;
      }
    }

    if (cur) {
      let hit = null;
      for (const re of ANS_LETTER_RES) { const mm = f.match(re); if (mm) { hit = mm; break; } }
      if (hit) {
        cur.explicit = LETTERS.indexOf(hit[1].toUpperCase());
        if (/^\s*(?:,|;|&|va)\s*\(?[a-f]\)?(?![a-z0-9])/.test(hit[2])) cur.warns.push('Có nhiều đáp án — chỉ lấy đáp án đầu tiên');
        cur.mode = 'skip';
        continue;
      }
      if ((m = f.match(ANS_TEXT_RE)) && cur.opts.length >= 2) {
        const want = m[1].trim();
        const idx = cur.opts.findIndex((o) => fold(o.t).trim() === want);
        if (idx >= 0) { cur.explicit = idx; cur.mode = 'skip'; continue; }
      }
      if ((m = f.match(EXPLAIN_RE)) && (cur.opts.length > 0 || cur.explicit !== null || cur.type === 'sa')) {
        cur.explain = ln.t.slice(f.length - (m[1] || '').length).trim();
        cur.mode = 'explain';
        continue;
      }
    }

    const head = f.match(KEY_HEAD_RE);
    if (head) {
      const rest = f.slice(head[0].length);
      const here = readKey(rest);
      const nextF = lines[i + 1] ? fold(trimLine(lines[i + 1]).t) : '';
      if (here.pairs.length >= 1 || readKey(nextF).pairs.length >= 2 || /^(?:cau\s+)?\d/.test(nextF) || SECTION_RE.test(nextF)) {
        inKey = true; cur = null; keySect = 'mc';
        here.pairs.forEach(([n, L]) => addKey(n, L));
        continue;
      }
    } else {
      const r = readKey(f);
      if (r.clean && r.pairs.length >= 3) {
        inKey = true; cur = null;
        r.pairs.forEach(([n, L]) => addKey(n, L));
        continue;
      }
    }

    /* Tiêu đề phần: "PHẦN I", "PHẦN II", "PHẦN III" — Reset lại lastNum = 0 để nhận Câu 1 của phần mới */
    if (SECTION_RE.test(f)) {
      cur = null;
      lastNum = 0;
      sect = sectType(f) !== 'mc' ? sectType(f) : (bareSectType(f) || 'mc');
      currentGroupId = '';
      currentGroupInstruction = '';
      currentGroupPassage = '';
      continue;
    }

    /* Bắt đầu câu mới */
    const qm = f.match(Q_RE);
    if (qm) {
      const n = Number(qm[1] ?? qm[2] ?? qm[3]);
      const keyword = qm[1] !== undefined;
      const sequential = n === lastNum + 1 || qs.length === 0 || (n === 1 && cur && (cur.opts.length >= 2 || cur.type === 'sa'));
      if (keyword || sequential) {
        cur = {
          num: n,
          type: sect,
          stem: '',
          opts: [],
          explicit: null,
          explain: '',
          warns: [],
          mode: 'stem',
          nl: false,
          pg: currentGroupId || null,
          instruction: currentGroupInstruction || '',
          passage: currentGroupPassage || '',
        };
        qs.push(cur);
        lastNum = n;
        absorb(sliceLine(ln, qm[0].length));
        continue;
      }
    }

    if (!cur && currentGroupId) {
      currentGroupPassage += (currentGroupPassage ? '\n' : '') + ln.t;
      continue;
    }

    absorb(ln);
  }

  /* ---- Chốt kết quả ---- */
  let idSeq = 0;
  let hadAnyLevelTag = false;

  const questions = qs.map((c) => {
    if (c.type === 'tf' && !c.tfAns) { const a = tfKey.get(c.num)?.shift(); if (a) c.tfAns = a; }
    if (c.type === 'sa' && !c.saAns) { const a = saKey.get(c.num)?.shift(); if (a) c.saAns = a; }

    /* Tự động nhận diện câu Đúng/Sai nếu có 4 ý a), b), c), d) viết thường */
    if (c.type === 'mc' && c.opts.length === 4) {
      const allLowerAbcd = c.opts.every((o) => o.isLowerLetter);
      const uCount = c.opts.filter((o) => o.uMarked || o.star).length;
      const hasInlineTf = c.opts.some((o) => /\s*[-–:→(]+\s*(đúng|sai)\s*\)?\s*$/i.test(o.t));
      if (allLowerAbcd && (uCount > 1 || hasInlineTf || c.tfAns)) {
        c.type = 'tf';
      }
    }

    /* Tự động nhận diện câu Trả lời ngắn nếu không có phương án chọn */
    if (c.type === 'mc' && c.opts.length === 0 && !c.saAns) {
      const explainNum = c.explain.match(/(?:đáp\s*án|đa|đáp\s*số|kết\s*quả|kq)\s*[:=]\s*([+-]?\d[\d.,]*)/i);
      if (explainNum) {
        c.type = 'sa';
        c.saAns = explainNum[1].replace(/[.,]+$/, '');
      }
    }

    /* Tách hình ảnh khỏi stem */
    const { cleanText: stemWithoutImgs, imgUrls: stemImgs } = extractImgTokens(c.stem, extractedImages);

    /* Tách nhãn mức độ [NB], [TH], [VD], [VDC] khỏi stem */
    const { level: parsedLevel, text: rawFinalStem, hadTag } = parseAndStripLevelTag(stemWithoutImgs);
    if (hadTag) hadAnyLevelTag = true;

    // Đảm bảo không bao giờ để trống stem nếu câu hỏi có hình ảnh
    const finalStem = (rawFinalStem || '').trim() || (stemImgs.length > 0 ? 'Quan sát hình vẽ / sơ đồ / đồ thị sau:' : '');

    const { cleanText: cleanExplain } = extractImgTokens(c.explain, extractedImages);
    const autoLevel = parsedLevel || classifySmartLevel(finalStem, c.type, cleanExplain);

    /* ----- PHẦN II: ĐÚNG / SAI ----- */
    if (c.type === 'tf') {
      // Ưu tiên gạch chân/tô màu (uMarked) hơn in đậm (vì a), b), c), d) thường in đậm cả 4 ý)
      const hasAnyUnderlinedOrStar = c.opts.some((o) => o.uMarked || o.star);
      const hasAnyBodyBold = c.opts.some((o) => o.bBodyMarked) && !c.opts.every((o) => o.bBodyMarked);
      const explainTf = !c.tfAns && cleanExplain ? readTf(fold(cleanExplain)) : null;

      const statements = c.opts.map((o, i) => {
        const { cleanText: optTxt } = extractImgTokens(o.t, extractedImages);
        let text = optTxt;
        let answer = c.tfAns ? c.tfAns[i] ?? null : explainTf ? explainTf[i] ?? null : null;
        const tail = text.match(/\s*[-–:→(\[]+\s*(đúng|sai|đ|s)\s*[)\]]?\s*$/i);
        if (tail) {
          text = text.slice(0, tail.index).trim();
          if (answer === null) answer = /^(?:đúng|đ)$/i.test(tail[1]);
        }
        if (answer === null && o.star) answer = true;
        if (answer === null && hasAnyUnderlinedOrStar) {
          answer = Boolean(o.uMarked || o.star);
        } else if (answer === null && hasAnyBodyBold) {
          answer = Boolean(o.bBodyMarked);
        }
        return { text, answer };
      });
      return {
        id: 'q' + (++idSeq),
        num: c.num,
        type: 'true_false',
        level: autoLevel,
        hadLevelTag: hadTag,
        q: finalStem,
        image: stemImgs[0] || null,
        images: stemImgs,
        statements,
        options: [],
        correct: -1,
        src: c.tfAns ? 'dòng đáp án' : hasAnyUnderlinedOrStar ? 'gạch chân/tô màu' : explainTf ? 'lời giải' : '',
        explain: cleanExplain,
        warns: [...c.warns],
        pg: c.pg,
        instruction: c.instruction,
        passage: c.passage,
      };
    }

    /* ----- PHẦN III: TRẢ LỜI NGẮN ----- */
    if (c.type === 'sa') {
      let ansVal = c.saAns || '';
      if (!ansVal && c.opts.length === 1) {
        const { cleanText } = extractImgTokens(c.opts[0].t, extractedImages);
        ansVal = cleanText.trim();
      }
      if (!ansVal && cleanExplain) {
        const expMatch = cleanExplain.match(/(?:đáp\s*án|đa|đáp\s*số|kết\s*quả|kq)\s*[:=]\s*([+-]?\d[\d.,]*)/i);
        if (expMatch) ansVal = expMatch[1].replace(/[.,]+$/, '');
      }
      return {
        id: 'q' + (++idSeq),
        num: c.num,
        type: 'short_answer',
        level: autoLevel,
        hadLevelTag: hadTag,
        q: finalStem,
        image: stemImgs[0] || null,
        images: stemImgs,
        answer: ansVal,
        options: [],
        correct: -1,
        src: ansVal ? 'dòng đáp án' : '',
        explain: cleanExplain,
        warns: [...c.warns],
        pg: c.pg,
        instruction: c.instruction,
        passage: c.passage,
      };
    }

    /* ----- PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN ----- */
    const optionImages = {};
    const options = c.opts.map((o, idx) => {
      const { cleanText, imgUrls } = extractImgTokens(o.t, extractedImages);
      if (imgUrls.length > 0) optionImages[idx] = imgUrls[0];
      return cleanText || (imgUrls.length > 0 ? `Hình ${LETTERS[idx]}` : '');
    });

    // Nếu hình ảnh nằm ở cuối câu hỏi (bị gom vào phương án D duy nhất trong khi A, B, C không có hình và D đã có chữ)
    if (
      stemImgs.length === 0 &&
      Object.keys(optionImages).length === 1 &&
      optionImages[options.length - 1] &&
      options[options.length - 1] &&
      !options[options.length - 1].startsWith('Hình ')
    ) {
      stemImgs.push(optionImages[options.length - 1]);
      delete optionImages[options.length - 1];
    }

    let correct = -1;
    let src = '';
    if (c.explicit !== null && c.explicit >= 0 && c.explicit < options.length) {
      correct = c.explicit;
      src = 'dòng đáp án';
    }
    if (correct < 0 && options.length >= 2) {
      const stars = c.opts.map((o, i) => (o.star ? i : -1)).filter((i) => i >= 0);
      const uMarks = c.opts.map((o, i) => (o.uMarked ? i : -1)).filter((i) => i >= 0);
      const bBodyMarks = c.opts.map((o, i) => (o.bBodyMarked ? i : -1)).filter((i) => i >= 0);
      const bLetterMarks = c.opts.map((o, i) => (o.bLetterMarked ? i : -1)).filter((i) => i >= 0);

      if (stars.length === 1) {
        correct = stars[0];
        src = 'dấu *';
      } else if (uMarks.length === 1) {
        correct = uMarks[0];
        src = 'gạch chân/tô màu';
      } else if (bBodyMarks.length === 1) {
        correct = bBodyMarks[0];
        src = 'in đậm nội dung';
      } else if (bLetterMarks.length === 1) {
        correct = bLetterMarks[0];
        src = 'in đậm chữ cái';
      }
    }
    if (correct < 0 && cleanExplain) {
      const fromExp = extractMcqAnswerFromExplain(cleanExplain);
      if (fromExp >= 0 && fromExp < options.length) {
        correct = fromExp;
        src = 'lời giải';
      }
    }

    return {
      id: 'q' + (++idSeq),
      num: c.num,
      type: 'mcq',
      level: autoLevel,
      hadLevelTag: hadTag,
      q: finalStem,
      image: stemImgs[0] || null,
      images: stemImgs,
      optionImages: Object.keys(optionImages).length > 0 ? optionImages : undefined,
      options,
      correct,
      src,
      explain: cleanExplain,
      warns: [...c.warns],
      pg: c.pg,
      instruction: c.instruction,
      passage: c.passage,
    };
  });

  if (keyFound) {
    questions.forEach((q) => {
      if (q.type !== 'mcq' && q.type) return;
      const letter = keyQueue.get(q.num)?.shift();
      if (!letter || q.src === 'dòng đáp án') return;
      const idx = LETTERS.indexOf(letter);
      if (idx >= 0 && idx < q.options.length) {
        q.correct = idx;
        q.src = 'bảng đáp án';
      }
    });
  }

  return { questions, keyFound, hadAnyLevelTag };
};

/* ============================================================
   4. KIỂM TRA HỢP LỆ
   ============================================================ */
const NUM_RE = /^[+-]?(\d+([.,]\d+)?|[.,]\d+)$/;
const issuesOf = (it) => {
  const out = [];
  if (!it.q.trim() && !it.image) out.push('Thiếu nội dung câu hỏi');
  if (it.type === 'true_false') {
    const st = it.statements || [];
    if (st.length !== 4) out.push(`Câu đúng/sai cần đúng 4 nhận định (đang có ${st.length})`);
    else if (st.some((x) => !x.text.trim())) out.push('Có nhận định bị trống');
    if (st.some((x) => x.answer !== true && x.answer !== false)) out.push('Có nhận định chưa chọn Đúng/Sai');
    return out;
  }
  if (it.type === 'short_answer') {
    if (!String(it.answer || '').trim()) out.push('Chưa có đáp án trả lời ngắn');
    else if (!NUM_RE.test(String(it.answer || '').trim())) out.push('Đáp án trả lời ngắn phải là số');
    return out;
  }
  if (it.options.length < 2) out.push(it.options.length ? 'Chỉ có 1 lựa chọn' : 'Không có lựa chọn A/B/C/D');
  else if (it.options.some((o, idx) => !o.trim() && !it.optionImages?.[idx])) out.push('Có lựa chọn bị trống');
  if (it.correct < 0 || it.correct >= it.options.length) out.push('Chưa chọn đáp án đúng');
  return out;
};

/* ============================================================
   5. ĐỀ MẪU CHUẨN 3 PHẦN (CÓ SẴN HÌNH ẢNH SƠ ĐỒ PIN GALVANI)
   ============================================================ */
const GALVANI_SVG_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="250" viewBox="0 0 520 250">
  <rect width="520" height="250" rx="12" fill="#ffffff"/>
  <g stroke="#1e293b" stroke-width="1.8" fill="none" font-family="Arial, sans-serif" font-size="12">
    <!-- Dây dẫn điện & Bóng đèn -->
    <line x1="150" y1="95" x2="150" y2="42"/>
    <line x1="150" y1="42" x2="242" y2="42"/>
    <line x1="278" y1="42" x2="370" y2="42"/>
    <line x1="370" y1="42" x2="370" y2="95"/>
    <circle cx="260" cy="42" r="18" fill="#fef9c3" stroke="#1e293b"/>
    <line x1="248" y1="30" x2="272" y2="54"/>
    <line x1="272" y1="30" x2="248" y2="54"/>
    <text x="260" y="18" text-anchor="middle" fill="#0f172a" stroke="none" font-weight="bold">Bóng đèn</text>
    <text x="260" y="76" text-anchor="middle" fill="#334155" stroke="none">Dây dẫn điện</text>
    <!-- Cốc trái ZnSO4 -->
    <path d="M110 85 L110 195 Q110 205 120 205 L180 205 Q190 205 190 195 L190 85" stroke-width="2"/>
    <path d="M112 125 L188 125 L188 195 Q188 203 180 203 L120 203 Q112 203 112 195 Z" fill="#f1f5f9" stroke="none"/>
    <line x1="111" y1="125" x2="189" y2="125" stroke="#64748b" stroke-dasharray="3 2"/>
    <rect x="142" y="72" width="16" height="108" fill="#cbd5e1" stroke="#1e293b"/>
    <text x="95" y="76" text-anchor="end" fill="#0f172a" stroke="none" font-weight="bold">Thanh Zn</text>
    <line x1="98" y1="74" x2="140" y2="85" stroke="#475569" stroke-width="1.2"/>
    <text x="150" y="224" text-anchor="middle" fill="#0f172a" stroke="none">Dung dịch</text>
    <text x="150" y="240" text-anchor="middle" fill="#0f172a" stroke="none" font-weight="bold">ZnSO₄ 1,0 M</text>
    <!-- Cốc phải CuSO4 -->
    <path d="M330 85 L330 195 Q330 205 340 205 L400 205 Q410 205 410 195 L410 85" stroke-width="2"/>
    <path d="M332 125 L408 125 L408 195 Q408 203 400 203 L340 203 Q332 203 332 195 Z" fill="#dbeafe" stroke="none"/>
    <line x1="331" y1="125" x2="409" y2="125" stroke="#3b82f6" stroke-dasharray="3 2"/>
    <rect x="362" y="72" width="16" height="108" fill="#fdba74" stroke="#1e293b"/>
    <text x="425" y="76" text-anchor="start" fill="#0f172a" stroke="none" font-weight="bold">Thanh Cu</text>
    <line x1="422" y1="74" x2="380" y2="85" stroke="#475569" stroke-width="1.2"/>
    <text x="370" y="224" text-anchor="middle" fill="#0f172a" stroke="none">Dung dịch</text>
    <text x="370" y="240" text-anchor="middle" fill="#0f172a" stroke="none" font-weight="bold">CuSO₄ 1,0 M</text>
  </g>
</svg>`);

const SAMPLE_GDPT2025_QUESTIONS = [
  {
    id: 'sample-1',
    num: 1,
    type: 'mcq',
    level: 'nb',
    hadLevelTag: true,
    q: 'Dụng cụ nào cần bổ sung vào hệ được mô tả như sơ đồ ở hình bên dưới để tạo thành pin Galvani hoạt động?',
    image: GALVANI_SVG_DATA_URL,
    options: ['Cầu muối.', 'Vôn kế.', 'Ampe kế.', 'Nhiệt kế.'],
    correct: 0,
    src: 'in đậm/gạch chân',
    explain: 'Cầu muối giúp khép kín mạch điện và trung hòa điện tích giữa hai dung dịch điện phân ZnSO₄ và CuSO₄.',
    warns: [],
  },
  {
    id: 'sample-2',
    num: 2,
    type: 'mcq',
    level: 'nb',
    hadLevelTag: true,
    q: 'Khi pin Galvani Zn – Cu hoạt động, quá trình nào sau đây xảy ra ở cathode?',
    options: ['Zn²⁺ + 2e → Zn.', 'Cu²⁺ + 2e → Cu.', 'Cu → Cu²⁺ + 2e.', 'Zn → Zn²⁺ + 2e.'],
    correct: 1,
    src: 'in đậm/gạch chân',
    explain: 'Ở cathode (cực dương Cu) xảy ra quá trình khử ion Cu²⁺: Cu²⁺ + 2e → Cu.',
    warns: [],
  },
  {
    id: 'sample-3',
    num: 3,
    type: 'mcq',
    level: 'th',
    hadLevelTag: true,
    q: 'Trong pin điện hóa Zn – Cu, quá trình oxi hóa xảy ra ở điện cực nào?',
    options: [
      'Cực âm (anode) là thanh kẽm Zn.',
      'Cực dương (cathode) là thanh đồng Cu.',
      'Cả hai thanh kim loại Zn và Cu.',
      'Trong cầu muối nối hai dung dịch.',
    ],
    correct: 0,
    src: 'in đậm/gạch chân',
    explain: 'Tại anode (cực âm Zn) xảy ra sự oxi hóa: Zn → Zn²⁺ + 2e.',
    warns: [],
  },
  {
    id: 'sample-4',
    num: 1,
    type: 'true_false',
    level: 'th',
    hadLevelTag: true,
    q: 'Thiết lập một pin điện hóa gồm điện cực Zn nhúng trong dung dịch ZnSO₄ 1 M và điện cực Cu nhúng trong dung dịch CuSO₄ 1 M nối với nhau qua cầu muối. Cho E°(Zn²⁺/Zn) = −0,76 V; E°(Cu²⁺/Cu) = +0,34 V.',
    statements: [
      { text: 'Thanh Zn đóng vai trò là anode (cực âm) và bị ăn mòn dần.', answer: true },
      { text: 'Dòng electron ở mạch ngoài di chuyển từ thanh Cu sang thanh Zn.', answer: false },
      { text: 'Nồng độ ion Cu²⁺ trong dung dịch giảm dần theo thời gian pin hoạt động.', answer: true },
      { text: 'Sức điện động chuẩn của pin bằng 1,10 V.', answer: true },
    ],
    options: [],
    correct: -1,
    src: 'gạch chân/in đậm',
    explain: 'E°pin = 0,34 − (−0,76) = 1,10 V. Electron di chuyển từ cực âm (Zn) sang cực dương (Cu).',
    warns: [],
  },
  {
    id: 'sample-5',
    num: 1,
    type: 'short_answer',
    level: 'vd',
    hadLevelTag: true,
    q: 'Cho thế điện cực chuẩn E°(Mg²⁺/Mg) = −2,356 V và E°(Ag⁺/Ag) = +0,799 V. Sức điện động chuẩn của pin Galvani Mg – Ag bằng bao nhiêu Vôn? (Làm tròn kết quả đến hàng phần trăm)',
    answer: '3,16',
    options: [],
    correct: -1,
    src: 'dòng đáp án',
    explain: 'E°pin = E°(Ag⁺/Ag) − E°(Mg²⁺/Mg) = 0,799 − (−2,356) = 3,155 V ≈ 3,16 V.',
    warns: [],
  },
];

/* Hàm tạo và tải xuống file Word mẫu (.docx) chuẩn 3 phần */
const downloadWordTemplateDocx = async () => {
  const { Document, Packer, Paragraph, TextRun, UnderlineType } = await import('docx');
  const { saveAs } = await import('file-saver');

  const p = (runs) => new Paragraph({ children: runs, spacing: { after: 120 } });
  const txt = (t, opts = {}) => new TextRun({ text: t, size: 24, font: 'Times New Roman', ...opts });
  const ansRun = (t) =>
    new TextRun({
      text: t,
      size: 24,
      font: 'Times New Roman',
      bold: true,
      underline: { type: UnderlineType.SINGLE },
    });

  const doc = new Document({
    sections: [
      {
        children: [
          p([txt('PHẦN I. Câu trắc nghiệm nhiều lựa chọn', { bold: true })]),
          p([txt('Câu 1. [NB] ', { bold: true }), txt('Khi pin Galvani Zn – Cu hoạt động, quá trình nào sau đây xảy ra ở cathode?')]),
          p([txt('A. ', { bold: true }), txt('Zn²⁺ + 2e → Zn.')]),
          p([ansRun('B.'), txt(' Cu²⁺ + 2e → Cu.')]),
          p([txt('C. ', { bold: true }), txt('Cu → Cu²⁺ + 2e.')]),
          p([txt('D. ', { bold: true }), txt('Zn → Zn²⁺ + 2e.')]),
          p([txt('Lời giải: Ở cathode (cực dương Cu) xảy ra quá trình khử ion Cu²⁺.')]),

          p([txt('Câu 2. [TH] ', { bold: true }), txt('Chất nào sau đây thuộc loại este no, đơn chức, mạch hở?')]),
          p([txt('A. ', { bold: true }), txt('CH₃COOH.')]),
          p([txt('B. ', { bold: true }), txt('C₂H₅OH.')]),
          p([ansRun('C.'), txt(' CH₃COOC₂H₅.')]),
          p([txt('D. ', { bold: true }), txt('CH₂=CHCOOCH₃.')]),
          p([txt('Lời giải: Etyl axetat CH₃COOC₂H₅ là este no, đơn chức, mạch hở.')]),

          p([txt('PHẦN II. Câu trắc nghiệm đúng sai', { bold: true })]),
          p([txt('Câu 1. [TH] ', { bold: true }), txt('Cho các phát biểu sau về pin điện hóa Zn – Cu:')]),
          p([ansRun('a)'), txt(' Thanh kẽm (Zn) đóng vai trò là cực âm (anode).')]),
          p([txt('b) '), txt('Dòng electron di chuyển từ thanh đồng (Cu) sang thanh kẽm (Zn).')]),
          p([ansRun('c)'), txt(' Cầu muối giúp trung hòa điện tích của hai dung dịch.')]),
          p([ansRun('d)'), txt(' Sức điện động chuẩn của pin Zn – Cu là 1,10 V.')]),
          p([txt('Đáp án: a-Đ, b-S, c-Đ, d-Đ')]),
          p([txt('Lời giải: Electron chuyển từ cực âm Zn sang cực dương Cu nên ý b sai.')]),

          p([txt('PHẦN III. Câu trắc nghiệm trả lời ngắn', { bold: true })]),
          p([txt('Câu 1. [VD] ', { bold: true }), txt('Thủy phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH dư, thu được bao nhiêu gam muối natri axetat? (Làm tròn đến hàng phần mười)')]),
          p([txt('Đáp án: 8,2', { bold: true })]),
          p([txt('Lời giải: n_este = 8,8 / 88 = 0,1 mol → m_CH3COONa = 0,1 × 82 = 8,2 gam.')]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'De-Word-Mau-Chuan-3-Phan-GDPT2025.docx');
};

/* ============================================================
   6. HỖ TRỢ ĐỌC JSON (DÁN TỪ CHAT AI)
   ============================================================ */
const escapeNewlinesInStrings = (str) => {
  let out = '';
  let inStr = false;
  let esc = false;
  for (const ch of str) {
    if (inStr) {
      if (esc) { out += ch; esc = false; }
      else if (ch === '\\') { out += ch; esc = true; }
      else if (ch === '"') { out += ch; inStr = false; }
      else if (ch === '\n') out += '\\n';
      else if (ch === '\r') { /* bỏ */ }
      else if (ch === '\t') out += '\\t';
      else out += ch;
    } else {
      if (ch === '"') inStr = true;
      out += ch;
    }
  }
  return out;
};

const sliceBrackets = (str) => {
  const a = str.search(/[[{]/);
  if (a < 0) return null;
  const close = str[a] === '{' ? '}' : ']';
  const b = str.lastIndexOf(close);
  return b > a ? str.slice(a, b + 1) : { incomplete: close };
};

const extractJson = (raw) => {
  const t = String(raw || '').trim();
  if (!t) return null;
  const cands = [];
  const fence = !/^[[{]/.test(t) ? t.match(/```(?:json|JSON)?[ \t]*\n([\s\S]*?)```/) : null;
  if (fence) cands.push(fence[1]);
  cands.push(t);
  let firstErr = '';
  for (const c of cands) {
    const sl = sliceBrackets(c);
    if (!sl) continue;
    if (typeof sl === 'object') {
      firstErr = firstErr || `JSON chưa đầy đủ — thiếu dấu đóng "${sl.incomplete}".`;
      continue;
    }
    const fixed = escapeNewlinesInStrings(sl);
    const noComma = fixed.replace(/,\s*([}\]])/g, '$1');
    const smart = noComma.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    for (const attempt of [sl, fixed, noComma, smart]) {
      try { return { value: JSON.parse(attempt) }; }
      catch (e) { firstErr = firstErr || e.message; }
    }
  }
  return firstErr ? { error: firstErr } : null;
};

const JSON_HINT = /"(?:options|choices|questions|correct|answer|explain)"\s*:/;
const nk = (k) => k.toLowerCase().replace(/[\s_-]/g, '');
const normObj = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [nk(k), v]));
const pickK = (o, keys) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
};

const normalizeJsonExam = (data) => {
  let meta = {};
  let arr = data;
  if (!Array.isArray(arr)) {
    if (!data || typeof data !== 'object') return null;
    const o = normObj(data);
    meta = {
      title: pickK(o, ['title', 'name', 'tende', 'tieude']),
      duration: Number(pickK(o, ['duration', 'time', 'thoigian', 'minutes'])) || 0,
    };
    arr = pickK(o, ['questions', 'items', 'data', 'cauhoi', 'quiz', 'groups', 'passages', 'sections', 'parts']);
    if (arr && !Array.isArray(arr) && typeof arr === 'object') arr = pickK(normObj(arr), ['questions', 'items', 'cauhoi']);
  }
  if (!Array.isArray(arr)) return null;

  const PASSAGE_KEYS = ['passage', 'readingpassage', 'reading', 'baidoc', 'doanvan', 'doan', 'context', 'stimulus'];
  const INSTR_KEYS = ['instruction', 'instructions', 'direction', 'directions', 'huongdan', 'dedieu', 'rubric'];
  const flatten = (list, inherit) => list.flatMap((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    const o = normObj(raw);
    const ctx = {
      passage: pickK(o, PASSAGE_KEYS) ?? inherit.passage,
      instruction: pickK(o, INSTR_KEYS) ?? inherit.instruction,
    };
    const sub = pickK(o, ['questions', 'items', 'cauhoi']);
    if (Array.isArray(sub) && o.options === undefined && o.choices === undefined) return flatten(sub, ctx);
    return [{ raw, ctx }];
  });
  const asText = (v) => (Array.isArray(v) ? v.join('\n') : String(v ?? '')).replace(/\r/g, '').trim();

  const questions = flatten(arr, {}).map(({ raw, ctx }, i) => {
    const o = normObj(raw);
    const warns = [];
    let q = String(pickK(o, ['q', 'question', 'cauhoi', 'noidung', 'content', 'text', 'stem', 'prompt']) ?? '').trim();
    const { level: tagLv, text: strippedQ, hadTag } = parseAndStripLevelTag(q);
    q = strippedQ;

    let flagged = -1;
    let options = [];
    const rawOpts = pickK(o, ['options', 'choices', 'answers', 'luachon', 'phuongan', 'answerchoices']);
    if (Array.isArray(rawOpts)) {
      options = rawOpts.map((x, j) => {
        if (x && typeof x === 'object') {
          const xo = normObj(x);
          if (xo.correct === true || xo.iscorrect === true || xo.dung === true) flagged = j;
          return String(pickK(xo, ['text', 'content', 'value', 'label', 'option', 'noidung']) ?? '');
        }
        return String(x);
      });
    } else if (rawOpts && typeof rawOpts === 'object') {
      options = Object.entries(rawOpts).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => String(v));
    } else if (o.a !== undefined) {
      options = ['a', 'b', 'c', 'd', 'e', 'f'].filter((k) => o[k] !== undefined).map((k) => String(o[k]));
    }
    options = options.map((t) => t.replace(/^\s*[A-Fa-f][.)]\s+/, '').trim());

    let correct = -1;
    let numeric = false;
    const idxK = pickK(o, ['correctindex', 'answerindex']);
    let c = pickK(o, ['correct', 'correctanswer', 'answer', 'dapan', 'dapandung', 'correctoption', 'right', 'key']);
    if (flagged >= 0) correct = flagged;
    else if (idxK !== undefined && Number.isInteger(Number(idxK))) correct = Number(idxK);
    else if (c !== undefined) {
      if (Array.isArray(c)) c = c[0];
      if (typeof c === 'number') { correct = c; numeric = true; }
      else {
        const t = String(c).trim();
        const m = t.match(/^\(?([A-Fa-f])\)?(?:[.):]|$)/);
        if (m) correct = LETTERS.indexOf(m[1].toUpperCase());
        else if (/^\d+$/.test(t)) { correct = Number(t); numeric = true; }
        else correct = options.findIndex((op) => fold(op) === fold(t));
      }
    }
    if (numeric && correct === options.length && correct > 0) correct -= 1;
    if (correct < 0 || correct >= options.length) correct = -1;

    const typeRaw = fold(String(pickK(o, ['type', 'loai', 'dang', 'kind', 'format']) ?? ''));
    const stRaw = pickK(o, ['statements', 'claims', 'nhandinh', 'menhde', 'ys', 'subquestions']);
    let type = 'mcq';
    if (Array.isArray(stRaw) || /true|dung|tf|boolean/.test(typeRaw)) type = 'true_false';
    else if (/short|ngan|numeric|number|fill|tuluan/.test(typeRaw)) type = 'short_answer';
    else if (!options.length && c !== undefined && String(Array.isArray(c) ? c[0] : c).trim() !== '' && correct < 0) type = 'short_answer';

    const toB = (v) => {
      if (typeof v === 'boolean') return v;
      const t = fold(String(v ?? '')).trim();
      if (['true', 'dung', 'd', '1', 'yes'].includes(t)) return true;
      if (['false', 'sai', 's', '0', 'no'].includes(t)) return false;
      return null;
    };
    let statements = [];
    if (type === 'true_false') {
      statements = (Array.isArray(stRaw) ? stRaw : []).map((x) => {
        if (x && typeof x === 'object') {
          const xo = normObj(x);
          return {
            text: String(pickK(xo, ['text', 'content', 'statement', 'noidung', 'nhandinh', 'claim']) ?? '').replace(/^\s*[a-dA-D][.)]\s+/, '').trim(),
            answer: toB(pickK(xo, ['answer', 'correct', 'dung', 'dapan', 'value', 'istrue'])),
          };
        }
        return { text: String(x), answer: null };
      });
    }
    let answer = '';
    if (type === 'short_answer') {
      const av = pickK(o, ['answer', 'dapan', 'correct', 'correctanswer', 'key', 'result', 'ketqua']);
      answer = String(Array.isArray(av) ? av[0] : av ?? '').trim().replace(/\s/g, '');
    }

    const pts = Number(pickK(o, ['points', 'score', 'diem']));
    const topicV = String(pickK(o, ['topic', 'chude', 'dangbai']) ?? '').trim();
    const rawLv = fold(String(pickK(o, ['level', 'mucdo', 'bloom']) ?? ''));
    let normLv = tagLv || 'nb';
    if (!tagLv && rawLv) {
      if (rawLv.includes('cao') || rawLv === 'vdc') normLv = 'vdc';
      else if (rawLv.includes('van') || rawLv === 'vd') normLv = 'vd';
      else if (rawLv.includes('thong') || rawLv === 'th') normLv = 'th';
      else normLv = 'nb';
    }
    const imgField = pickK(o, ['image', 'img', 'hinh', 'hinhanh', 'figure']);

    return {
      id: 'j' + (i + 1),
      num: i + 1,
      type,
      statements,
      answer,
      topic: topicV,
      level: normLv,
      hadLevelTag: hadTag || Boolean(rawLv),
      q,
      image: imgField ? String(imgField) : null,
      images: imgField ? [String(imgField)] : [],
      options,
      correct,
      src: 'JSON',
      passage: asText(ctx.passage),
      instruction: asText(ctx.instruction),
      explain: String(pickK(o, ['explain', 'explanation', 'giaithich', 'loigiai', 'solution', 'reason']) ?? '').trim(),
      warns,
      points: pts > 0 ? pts : undefined,
    };
  });

  if (!questions.some((x) => x.q)) return null;
  let pgN = 0;
  let prevP = null;
  questions.forEach((x) => {
    if (!x.passage) { prevP = null; x.pg = null; return; }
    if (x.passage !== prevP) { pgN++; prevP = x.passage; }
    x.pg = 'pg' + pgN;
  });
  return { meta, questions };
};

/* ============================================================
   7. BỘ ICON SVG SẮC NÉT & CSS STUDIO CHUẨN MÀU CHỦ ĐẠO ELEC AI
   ============================================================ */
const SvgWrap = ({ size = 15, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoDoc = ({ size = 16 }) => (
  <SvgWrap size={size}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </SvgWrap>
);
const IcoDownload = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </SvgWrap>
);
const IcoUpload = ({ size = 18 }) => (
  <SvgWrap size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </SvgWrap>
);
const IcoBolt = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </SvgWrap>
);
const IcoSparkles = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
  </SvgWrap>
);
const IcoTarget = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </SvgWrap>
);
const IcoCheck = ({ size = 13 }) => (
  <SvgWrap size={size}>
    <polyline points="20 6 9 17 4 12" />
  </SvgWrap>
);
const IcoAlert = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </SvgWrap>
);
const IcoEdit = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </SvgWrap>
);
const IcoTrash = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </SvgWrap>
);
const IcoImage = ({ size = 14 }) => (
  <SvgWrap size={size}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </SvgWrap>
);
const IcoShuffle = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </SvgWrap>
);
const IcoFolder = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </SvgWrap>
);
const IcoClose = ({ size = 16 }) => (
  <SvgWrap size={size}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </SvgWrap>
);
const IcoGlobe = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </SvgWrap>
);
const IcoInfo = ({ size = 15 }) => (
  <SvgWrap size={size}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </SvgWrap>
);

const STUDIO_CSS = `
.wimp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
}
.wimp-shell {
  width: 100%;
  max-width: 1420px;
  background: var(--bg, #f8fafc);
  color: var(--ink, #0f172a);
  border-radius: 18px;
  border: 1px solid var(--line, #cbd5e1);
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.32);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.wimp-shell.is-modal {
  height: min(94vh, 930px);
}
.wimp-shell.is-page {
  min-height: 760px;
}
.wimp-shell * {
  box-sizing: border-box;
}

/* HEADER MÀU CHỦ ĐẠO INDIGO-SLATE CỦA ELEC AI */
.wimp-topbar {
  background: linear-gradient(135deg, #312e81 0%, #4338ca 52%, #2563eb 100%);
  color: #ffffff;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}
.wimp-topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.wimp-topbar-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.wimp-topbar-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #e0e7ff;
  font-size: 0.73rem;
  font-weight: 700;
}
.wimp-topbar-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.15s;
}
.wimp-topbar-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* THANH 3 BƯỚC ĐỒNG BỘ MÀU CHỦ ĐẠO */
.wimp-steps-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 9px 18px;
  background: var(--soft, #f1f5f9);
  border-bottom: 1px solid var(--line, #e2e8f0);
  flex-shrink: 0;
}
@media (max-width: 760px) {
  .wimp-steps-bar {
    grid-template-columns: 1fr;
  }
}
.wimp-step-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.08);
  border: 1px solid rgba(79, 70, 229, 0.28);
  color: var(--acc-2, #4338ca);
  font-size: 0.78rem;
  font-weight: 700;
}
.wimp-step-pill.idle {
  background: var(--panel, #ffffff);
  border-color: var(--line, #cbd5e1);
  color: var(--muted, #64748b);
}
.wimp-step-check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4f46e5;
  color: #ffffff;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
}
.wimp-step-pill.idle .wimp-step-check {
  background: #cbd5e1;
}

/* BỐ CỤC 2 CỘT CHÍNH */
.wimp-workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 315px minmax(0, 1fr);
  gap: 14px;
  padding: 14px 18px;
  overflow: hidden;
}
.wimp-shell.is-page .wimp-workspace {
  overflow: visible;
}
@media (max-width: 980px) {
  .wimp-workspace {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}

/* CỘT TRÁI */
.wimp-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding-right: 4px;
}
.wimp-box {
  background: var(--panel, #ffffff);
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 12px;
  padding: 11px 13px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.wimp-box.template-box {
  background: linear-gradient(180deg, rgba(79, 70, 229, 0.06) 0%, rgba(59, 130, 246, 0.03) 100%);
  border-color: rgba(79, 70, 229, 0.26);
}
.wimp-box.level-box {
  background: var(--soft, #f8fafc);
  border-color: var(--line, #e2e8f0);
}
.wimp-box-title {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--ink, #0f172a);
  display: flex;
  align-items: center;
  gap: 6px;
}
.wimp-box.template-box .wimp-box-title {
  color: #4338ca;
}
.wimp-box-desc {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--ink-2, #475569);
}
.wimp-template-btns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.wimp-btn-green {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.15s;
}
.wimp-btn-green:hover {
  opacity: 0.92;
}
.wimp-btn-soft {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 9px;
  border: 1px solid rgba(79, 70, 229, 0.32);
  background: var(--panel, #ffffff);
  color: #4338ca;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
}
.wimp-btn-soft:hover {
  background: rgba(79, 70, 229, 0.06);
}

/* KHUNG UPLOAD FILE WORD */
.wimp-dropzone {
  border: 1.5px dashed #6366f1;
  background: rgba(79, 70, 229, 0.03);
  border-radius: 12px;
  padding: 14px 12px;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.wimp-dropzone:hover, .wimp-dropzone.done {
  background: rgba(79, 70, 229, 0.08);
  border-color: #4f46e5;
}
.wimp-dropzone-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(79, 70, 229, 0.12);
  color: #4f46e5;
  display: grid;
  place-items: center;
}
.wimp-dropzone-status {
  font-size: 0.79rem;
  font-weight: 800;
  color: #4338ca;
  line-height: 1.35;
}
.wimp-dropzone-sub {
  font-size: 0.72rem;
  color: var(--muted, #64748b);
}

.wimp-input {
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--line, #cbd5e1);
  background: var(--panel, #ffffff);
  color: var(--ink, #0f172a);
  font-size: 0.78rem;
  font-weight: 600;
  outline: none;
}
.wimp-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.14);
}
.wimp-paste-ta {
  width: 100%;
  min-height: 86px;
  resize: vertical;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--line, #cbd5e1);
  background: var(--soft, #f8fafc);
  color: var(--ink, #0f172a);
  font-size: 0.76rem;
  line-height: 1.45;
  outline: none;
}
.wimp-paste-ta:focus {
  background: var(--panel, #ffffff);
  border-color: #4f46e5;
}

/* CỘT PHẢI: MÀN HÌNH KIỂM TRA CÂU HỎI (BƯỚC 3) */
.wimp-right {
  background: var(--panel, #ffffff);
  border: 1px solid var(--line, #cbd5e1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.wimp-right-head {
  padding: 10px 16px;
  border-bottom: 1px solid var(--line, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--panel, #ffffff);
  flex-shrink: 0;
}
.wimp-right-head-left {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.wimp-right-title {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--ink, #0f172a);
  text-transform: uppercase;
}
.wimp-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.73rem;
  font-weight: 700;
  white-space: nowrap;
}
.wimp-pill.green {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}
.wimp-pill.purple {
  background: rgba(79, 70, 229, 0.12);
  color: #4338ca;
}
.wimp-pill.blue {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}
.wimp-pill.amber {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}
.wimp-pill.red {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

/* SEGMENTED PILL CHO CHẾ ĐỘ THAY THẾ / NỐI THÊM (KHÔNG BỊ RỚT DÒNG) */
.wimp-mode-seg {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border-radius: 9px;
  background: var(--soft, #f1f5f9);
  border: 1px solid var(--line, #e2e8f0);
  flex-shrink: 0;
}
.wimp-mode-seg-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--muted, #64748b);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.wimp-mode-seg-btn.active {
  background: var(--panel, #ffffff);
  color: #4338ca;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

/* THANH LỌC NHANH & PHÂN TÍCH ĐỀ */
.wimp-subbar {
  padding: 8px 16px;
  background: var(--soft, #f8fafc);
  border-bottom: 1px solid var(--line, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.wimp-filter-tabs {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
.wimp-filter-tab {
  padding: 4px 10px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink-2, #475569);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.wimp-filter-tab:hover {
  background: rgba(79, 70, 229, 0.06);
}
.wimp-filter-tab.active {
  background: #4f46e5;
  color: #ffffff;
}

/* BANNER PHÂN TÍCH ĐỀ CHUẨN MÀU CHỦ ĐẠO */
.wimp-summary-banner {
  margin: 10px 16px 0;
  padding: 9px 14px;
  border-radius: 10px;
  background: rgba(79, 70, 229, 0.05);
  border: 1px solid rgba(79, 70, 229, 0.2);
  color: var(--ink, #1e293b);
  font-size: 0.77rem;
  line-height: 1.55;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

/* DANH SÁCH CÂU HỎI */
.wimp-q-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wimp-shell.is-page .wimp-q-list {
  max-height: 680px;
}
.wimp-q-card {
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--panel, #ffffff);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.wimp-q-card.has-issue {
  border-color: #fca5a5;
  background: rgba(254, 242, 242, 0.5);
}
.wimp-q-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.wimp-q-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.wimp-part-badge {
  padding: 2px 9px;
  border-radius: 999px;
  background: #4f46e5;
  color: #ffffff;
  font-size: 0.69rem;
  font-weight: 800;
  text-transform: uppercase;
}
.wimp-part-badge.p2 {
  background: #7c3aed;
}
.wimp-part-badge.p3 {
  background: #0284c7;
}
.wimp-q-num {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--ink, #0f172a);
  text-transform: uppercase;
}
.wimp-q-top-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.wimp-lv-btn {
  padding: 3px 9px;
  border-radius: 6px;
  border: 1px solid rgba(79, 70, 229, 0.25);
  background: rgba(79, 70, 229, 0.08);
  color: #4338ca;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.wimp-ans-badge {
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.14);
  color: #047857;
  font-size: 0.72rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.wimp-ans-badge.err {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}
.wimp-act-btn {
  padding: 4px 9px;
  border-radius: 6px;
  border: 1px solid var(--line, #cbd5e1);
  background: var(--soft, #f8fafc);
  color: var(--ink-2, #334155);
  font-size: 0.73rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.wimp-act-btn:hover {
  background: var(--line, #e2e8f0);
}
.wimp-act-btn.danger:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.wimp-q-stem {
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.52;
  color: var(--ink, #0f172a);
}

/* HÌNH ẢNH CÂU HỎI TỰ ĐỘNG NHẬN DIỆN */
.wimp-q-img-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 4px 0;
  padding: 8px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid var(--line, #e2e8f0);
}
.wimp-q-img {
  max-width: 100%;
  max-height: 260px;
  object-fit: contain;
  border-radius: 8px;
}

/* LƯỚI 2x2 PHƯƠNG ÁN A B C D */
.wimp-opts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 640px) {
  .wimp-opts-grid {
    grid-template-columns: 1fr;
  }
}
.wimp-opt-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  border-radius: 9px;
  border: 1px solid var(--line, #e2e8f0);
  background: var(--soft, #f8fafc);
  color: var(--ink, #0f172a);
  font-size: 0.84rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.14s ease;
}
.wimp-opt-card:hover {
  border-color: #818cf8;
  background: rgba(79, 70, 229, 0.05);
}
.wimp-opt-card.is-correct {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border-color: #047857;
  color: #ffffff;
  font-weight: 700;
}
.wimp-opt-letter {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--line, #e2e8f0);
  color: var(--ink-2, #334155);
  font-size: 0.74rem;
  font-weight: 800;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
}
.wimp-opt-card.is-correct .wimp-opt-letter {
  background: #ffffff;
  color: #047857;
}

/* PHẦN II: ĐÚNG / SAI */
.wimp-tf-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wimp-tf-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 11px;
  border-radius: 8px;
  background: var(--soft, #f8fafc);
  border: 1px solid var(--line, #e2e8f0);
  font-size: 0.83rem;
}
.wimp-tf-btns {
  display: inline-flex;
  gap: 4px;
  flex-shrink: 0;
}
.wimp-tf-btn {
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid var(--line, #cbd5e1);
  background: var(--panel, #ffffff);
  color: var(--ink-2, #475569);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
}
.wimp-tf-btn.on-true {
  background: #059669;
  border-color: #059669;
  color: #ffffff;
}
.wimp-tf-btn.on-false {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
}

/* CHÂN TRANG (FOOTER) */
.wimp-footer {
  padding: 10px 18px;
  background: var(--soft, #f1f5f9);
  border-top: 1px solid var(--line, #cbd5e1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.wimp-footer-tip {
  font-size: 0.78rem;
  color: var(--ink-2, #475569);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.wimp-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.wimp-btn {
  padding: 8px 16px;
  border-radius: 9px;
  border: 1px solid var(--line, #cbd5e1);
  background: var(--panel, #ffffff);
  color: var(--ink, #0f172a);
  font-size: 0.81rem;
  font-weight: 750;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.wimp-btn:hover:not(:disabled) {
  background: var(--soft, #e2e8f0);
}
.wimp-btn.primary {
  background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
  border-color: #4338ca;
  color: #ffffff;
}
.wimp-btn.primary:hover:not(:disabled) {
  opacity: 0.94;
}
.wimp-btn.emerald {
  background: #059669;
  border-color: #047857;
  color: #ffffff;
}
.wimp-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}
`;

const LEVEL_CYCLE = ['nb', 'th', 'vd', 'vdc'];
const LEVEL_LABELS = { nb: 'NB', th: 'TH', vd: 'VD', vdc: 'VDC' };

/* ============================================================
   8. COMPONENT CHÍNH: ExamImporter
   ============================================================ */
export default function ExamImporter({
  open = true,
  variant = 'page',
  classInfo = null,
  classes = [],
  allowBank = false,
  allowSoftExam = false,
  onCreateSoftExam = null,
  onSaveToBank = null,
  onSendToMixer = null,
  onClose = null,
  defaultSubject = '',
  defaultGrade = '',
  initialEnglishMode = false,
}) {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [raw, setRaw] = useState('');
  const [fileLines, setFileLines] = useState(null);
  const [extractedImages, setExtractedImages] = useState([]);
  const [items, setItems] = useState([]);
  const [fileName, setFileName] = useState('');
  const [formulaCount, setFormulaCount] = useState(0);
  const [appendMode, setAppendMode] = useState('replace'); // 'replace' | 'append'
  const [quickAnswerStr, setQuickAnswerStr] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [englishMode, setEnglishMode] = useState(initialEnglishMode);
  const [openMixerModal, setOpenMixerModal] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'p1' | 'p2' | 'p3' | 'img' | 'issue'
  const [openWordEditor, setOpenWordEditor] = useState(false);

  const [title, setTitle] = useState('');
  const [detectedSubject, setDetectedSubject] = useState(defaultSubject || '');
  const [detectedGrade, setDetectedGrade] = useState(defaultGrade || '');
  const [duration, setDuration] = useState('45');
  const [classId, setClassId] = useState(classInfo?.id || classes[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isModal = Boolean(onClose) && variant !== 'inline';

  useEffect(() => {
    if (initialEnglishMode !== undefined) setEnglishMode(Boolean(initialEnglishMode));
  }, [initialEnglishMode]);

  useEffect(() => {
    if (!classId && (classInfo?.id || classes[0]?.id)) {
      setClassId(classInfo?.id || classes[0]?.id);
    }
  }, [classInfo?.id, classes, classId]);

  /* Khi dán văn bản hoặc JSON vào ô Copy & Paste */
  const handlePasteTextChange = (textVal) => {
    setRaw(textVal);
    setFileLines(null);
    if (!textVal.trim()) {
      if (appendMode === 'replace') setItems([]);
      return;
    }

    const jx = extractJson(textVal);
    if (jx && jx.value !== undefined) {
      const ex = normalizeJsonExam(jx.value);
      if (ex) {
        setItems((prev) => (appendMode === 'append' ? [...prev, ...ex.questions] : ex.questions));
        if (ex.meta.title) setTitle((t) => t || String(ex.meta.title));
        if (ex.meta.duration) setDuration((d) => d || String(ex.meta.duration));
        const fCnt = ex.questions.reduce((s, q) => s + countFormulasInText(q.q + ' ' + (q.options || []).join(' ')), 0);
        setFormulaCount(fCnt);
        return;
      }
    }

    const res = parseLines(textToLines(textVal), []);
    const fCnt = res.questions.reduce((s, q) => s + countFormulasInText(q.q + ' ' + (q.options || []).join(' ')), 0);
    setFormulaCount(fCnt);
    setItems((prev) => (appendMode === 'append' ? [...prev, ...res.questions] : res.questions));
  };

  /* Đọc file Word (.docx), PDF, TXT, JSON */
  const processFile = async (f) => {
    if (!f) return;
    setBusy(true);
    setMsg('');
    try {
      if (/\.doc$/i.test(f.name)) {
        throw new Error('File đang ở định dạng .doc cũ. Vui lòng mở bằng Word → Lưu thành .docx rồi nạp lại.');
      }
      let newQuestions = [];
      let fCount = 0;

      if (/\.docx$/i.test(f.name)) {
        const { lines, extractedImages: imgs, formulaCount: docxFormulas } = await readDocx(f);
        setFileLines(lines);
        setExtractedImages(imgs);
        const res = parseLines(lines, imgs);
        newQuestions = res.questions;
        const textFormulas = newQuestions.reduce(
          (sum, q) => sum + countFormulasInText(q.q + ' ' + (q.options || []).join(' ')),
          0
        );
        fCount = Math.max(docxFormulas, textFormulas);
      } else if (/\.pdf$/i.test(f.name)) {
        const { text } = await readPdf(f);
        if (!text.replace(/\s/g, '')) {
          throw new Error('PDF này là bản scan ảnh chưa có lớp chữ. Hãy ưu tiên nạp từ file Word (.docx).');
        }
        setFileLines(null);
        const res = parseLines(textToLines(text), []);
        newQuestions = res.questions;
        fCount = newQuestions.reduce((sum, q) => sum + countFormulasInText(q.q + ' ' + (q.options || []).join(' ')), 0);
      } else {
        const text = await f.text();
        setFileLines(null);
        const jx = extractJson(text);
        if (jx?.value) {
          const ex = normalizeJsonExam(jx.value);
          if (ex) newQuestions = ex.questions;
        }
        if (!newQuestions.length) {
          const res = parseLines(textToLines(text), []);
          newQuestions = res.questions;
        }
        fCount = newQuestions.reduce((sum, q) => sum + countFormulasInText(q.q + ' ' + (q.options || []).join(' ')), 0);
      }

      setFormulaCount(fCount);
      setFileName(f.name);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));

      // Tự động nhận diện môn học và khối lớp chuẩn xác từ tài liệu
      const corpusText = (newQuestions || []).map((q) => q.q + ' ' + (q.options || []).join(' ')).join('\n');
      const detected = detectExamSubjectAndGrade({
        fileName: f.name,
        text: corpusText,
        questions: newQuestions,
      });
      if (detected.subject) setDetectedSubject(detected.subject);
      if (detected.grade) setDetectedGrade(detected.grade);

      setItems((prev) => {
        if (appendMode === 'append' && prev.length > 0) {
          return [...prev, ...newQuestions.map((q, idx) => ({ ...q, id: `${q.id}_ap_${Date.now()}_${idx}` }))];
        }
        return newQuestions;
      });
    } catch (err) {
      setMsg(err.message || 'Không đọc được file này. Vui lòng dùng file Word (.docx), PDF hoặc TXT.');
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) processFile(f);
  };

  /* Áp dụng chuỗi đáp án nhanh cho Phần I (VD: "1A 2B 3C 4D" hoặc "ABCDABCD") */
  const handleQuickAnswerString = (val) => {
    setQuickAnswerStr(val);
    const str = String(val || '').trim().toUpperCase();
    if (!str) return;

    // Dạng 1: Cặp số - chữ cái "1A 2B 3C..."
    const pairMatches = [...str.matchAll(/(\d{1,3})\s*[.:\-=)]?\s*([A-F])/g)];
    if (pairMatches.length > 0) {
      const mapByNum = new Map();
      pairMatches.forEach((m) => mapByNum.set(Number(m[1]), LETTERS.indexOf(m[2])));
      setItems((arr) => {
        let mcOrder = 0;
        return arr.map((it) => {
          if (it.type && it.type !== 'mcq') return it;
          mcOrder++;
          const ansIdx = mapByNum.get(it.num) ?? mapByNum.get(mcOrder);
          if (ansIdx !== undefined && ansIdx >= 0 && ansIdx < it.options.length) {
            return { ...it, correct: ansIdx, src: 'nhập nhanh' };
          }
          return it;
        });
      });
      return;
    }

    // Dạng 2: Chuỗi chữ cái liền nhau "ABCDABCD..."
    const pureLetters = str.replace(/[^A-F]/g, '');
    if (pureLetters.length > 0) {
      setItems((arr) => {
        let mcIdx = 0;
        return arr.map((it) => {
          if (it.type && it.type !== 'mcq') return it;
          const ch = pureLetters[mcIdx++];
          if (!ch) return it;
          const ansIdx = LETTERS.indexOf(ch);
          if (ansIdx >= 0 && ansIdx < it.options.length) {
            return { ...it, correct: ansIdx, src: 'nhập nhanh' };
          }
          return it;
        });
      });
    }
  };

  /* Nạp thử đề mẫu 3 phần có hình ảnh sơ đồ Pin Galvani */
  const handleLoadSample = () => {
    setFileName('15. BÀI 15 - NGUỒN ĐIỆN HÓA HỌC - P2 (GV).docx');
    setTitle('Bài 15 - Nguồn điện hóa học (Chuẩn 2025)');
    setFormulaCount(18);
    setItems(SAMPLE_GDPT2025_QUESTIONS);
    setFilterTab('all');
    setMsg('');
  };

  /* Tự động phân tích lại mức độ nhận thức & dò đáp án đúng từ lời giải cho toàn bộ đề */
  const handleSmartAnalyzeAll = () => {
    let fixedAns = 0;
    setItems((arr) =>
      arr.map((it) => {
        const nextLv = it.hadLevelTag ? it.level : classifySmartLevel(it.q, it.type, it.explain);
        let nextCorrect = it.correct;
        let nextAnswer = it.answer;
        let nextStatements = it.statements;
        let nextSrc = it.src;

        if ((!it.type || it.type === 'mcq') && (it.correct < 0 || it.correct === undefined)) {
          const fromExp = extractMcqAnswerFromExplain(it.explain || '');
          if (fromExp >= 0 && fromExp < (it.options || []).length) {
            nextCorrect = fromExp;
            nextSrc = 'dò từ lời giải';
            fixedAns++;
          }
        } else if (it.type === 'short_answer' && !String(it.answer || '').trim() && it.explain) {
          const expMatch = it.explain.match(/(?:đáp\s*án|đa|đáp\s*số|kết\s*quả|kq|=)\s*[:=]?\s*([+-]?\d[\d.,]*)/i);
          if (expMatch) {
            nextAnswer = expMatch[1].replace(/[.,]+$/, '');
            nextSrc = 'dò từ lời giải';
            fixedAns++;
          }
        } else if (it.type === 'true_false' && Array.isArray(it.statements)) {
          const missing = it.statements.some((s) => s.answer !== true && s.answer !== false);
          if (missing && it.explain) {
            const expTf = readTf(fold(it.explain));
            if (expTf) {
              nextStatements = it.statements.map((s, idx) => ({ ...s, answer: expTf[idx] ?? Boolean(s.answer) }));
              nextSrc = 'dò từ lời giải';
              fixedAns++;
            }
          }
        }

        return {
          ...it,
          level: nextLv,
          correct: nextCorrect,
          answer: nextAnswer,
          statements: nextStatements,
          src: nextSrc,
        };
      })
    );
    setMsg(
      fixedAns > 0
        ? `Đã phân tích mức độ & tự động bổ sung ${fixedAns} đáp án từ lời giải thành công!`
        : 'Đã cập nhật phân tích mức độ nhận thức (NB/TH/VD/VDC) cho toàn bộ câu hỏi thành công!'
    );
  };

  /* 🌟 BÁC SĨ AI: Tự động bổ sung đủ 3 phần GDPT 2025 (Phần II 4 câu & Phần III 6 câu) */
  const handleAiComplete3Parts = async () => {
    if (!items.length) {
      setMsg('Vui lòng nạp câu hỏi trước khi yêu cầu AI bổ sung.');
      return;
    }
    const needP2 = Math.max(0, 4 - stats.p2);
    const needP3 = Math.max(0, 6 - stats.p3);
    if (needP2 === 0 && needP3 === 0) {
      setMsg('Đề đã có đủ cấu trúc chuẩn 3 phần GDPT 2025!');
      return;
    }

    setBusy(true);
    setMsg('Bác sĩ AI đang phân tích đề và tự động biên soạn bổ sung Phần II & Phần III...');

    try {
      const sampleStems = items.slice(0, 5).map((q, i) => `${i + 1}. ${q.q || ''}`).join('\n');
      const subj = defaultSubject || classInfo?.subject || 'Hóa học';
      const gr = String(defaultGrade || classInfo?.grade || '12');

      const prompt = `Bạn là chuyên gia ra đề ${subj} lớp ${gr} chuẩn GDPT 2025 của Bộ Giáo dục và Đào tạo.
Dưới đây là một số câu hỏi trắc nghiệm hiện có trong đề thi:
${sampleStems}

Hiện tại đề đang thiếu ${needP2} câu Phần II (Đúng/Sai) và ${needP3} câu Phần III (Trả lời ngắn).
Hãy bổ sung chính xác:
- ${needP2} câu Phần II (Trắc nghiệm Đúng/Sai): Mỗi câu có ngữ cảnh/bài toán dẫn, gồm 4 nhận định a), b), c), d). Mỗi nhận định có đáp án boolean (true/false) và giải thích chi tiết.
- ${needP3} câu Phần III (Trả lời ngắn): Mỗi câu là một bài toán tính toán hoặc tìm số lượng, có đáp án số rõ ràng (ví dụ "12,5" hoặc "3"), và giải thích chi tiết.

TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ THEO MẪU:
{
  "part2": [
    {
      "q": "Đề dẫn bài toán...",
      "statements": [
        { "text": "a) Nhận định a...", "answer": true },
        { "text": "b) Nhận định b...", "answer": false },
        { "text": "c) Nhận định c...", "answer": true },
        { "text": "d) Nhận định d...", "answer": false }
      ],
      "level": "VD",
      "explain": "Lời giải chi tiết từng ý..."
    }
  ],
  "part3": [
    {
      "q": "Câu hỏi tính toán yêu cầu điền số...",
      "answer": "12,5",
      "level": "VDC",
      "explain": "Lời giải chi tiết..."
    }
  ]
}`;

      const aiRes = await runWithCredit(
        { userId: user?.uid, cost: 2, reason: 'AI bổ sung câu hỏi đề nhập' },
        () => askAI(prompt)
      );
      const text = typeof aiRes === 'string' ? aiRes : (aiRes?.text || '');
      const parsed = parseExamJsonSafe(text);

      let newP2 = (parsed?.part2 || []).map((q, idx) => ({
        id: `q_p2_ai_${Date.now()}_${idx}`,
        q: q.q,
        statements: (q.statements || []).map((st) => ({
          text: st.text || '',
          answer: st.answer === true,
        })),
        level: q.level || 'VD',
        explain: q.explain || '',
        type: 'true_false',
        points: 1.0,
      }));

      let newP3 = (parsed?.part3 || []).map((q, idx) => ({
        id: `q_p3_ai_${Date.now()}_${idx}`,
        q: q.q,
        answer: String(q.answer || '0').replace('.', ','),
        level: q.level || 'VDC',
        explain: q.explain || '',
        type: 'short_answer',
        points: 0.25,
      }));

      if (!newP2.length && needP2 > 0) {
        newP2 = [
          {
            id: `q_p2_fb_1`,
            q: 'Tiến hành thí nghiệm xà phòng hóa chất béo: Cho vào bát sứ nhỏ khoảng 2 ml dầu dừa và 5 ml dung dịch NaOH 40%. Đun sôi nhẹ hỗn hợp khoảng 30 phút và khuấy liên tục bằng đũa thủy tinh, thỉnh thoảng thêm vài giọt nước cất để giữ cho thể tích hỗn hợp không đổi. Sau đó rót thêm 10 ml dung dịch NaCl bão hòa nóng, khuấy nhẹ rồi để nguội.',
            statements: [
              { text: 'a) Sau bước 3 thấy có lớp chất rắn màu trắng nổi lên trên, đó là muối natri của axit béo.', answer: true },
              { text: 'b) Thêm dung dịch NaCl bão hòa để làm tăng khối lượng riêng của dung dịch giúp xà phòng kết tinh nổi lên.', answer: true },
              { text: 'c) Thêm nước cất để tránh este bị bay hơi và giữ phản ứng diễn ra liên tục.', answer: true },
              { text: 'd) Nếu thay dầu dừa bằng dầu bôi trơn máy thì hiện tượng thí nghiệm xảy ra tương tự.', answer: false },
            ],
            level: 'VD',
            explain: 'Dầu bôi trơn máy là hiđrocacbon, không phản ứng với NaOH nên không sinh ra xà phòng.',
            type: 'true_false',
            points: 1.0,
          },
        ];
      }

      if (!newP3.length && needP3 > 0) {
        newP3 = [
          {
            id: `q_p3_fb_1`,
            q: 'Đốt cháy hoàn toàn 0,15 mol este đơn chức X thu được 0,6 mol CO2 và 0,6 mol H2O. Số nguyên tử hiđro (H) trong một phân tử este X là bao nhiêu?',
            answer: '8',
            level: 'VD',
            explain: 'nCO2 = nH2O = 0,6 mol -> este no đơn chức CnH2nO2. Số C = 0,6 / 0,15 = 4 -> CTPT C4H8O2 -> 8 nguyên tử H.',
            type: 'short_answer',
            points: 0.25,
          },
        ];
      }

      setItems((prev) => [...prev, ...newP2, ...newP3]);
      setMsg(`AI Bác sĩ đã bổ sung thành công ${newP2.length} câu Phần II và ${newP3.length} câu Phần III chuẩn GDPT 2025!`);
    } catch (err) {
      setMsg(`Lỗi khi AI bổ sung đề: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  /* 🌟 Xuất file Word (.docx) chuẩn 3 phần có thông tin Sở/Trường & Đáp án */
  const handleExportRepairedWord = async () => {
    if (!items.length) {
      setMsg('Chưa có câu hỏi nào để xuất file Word.');
      return;
    }
    try {
      const filename = await exportToWord({
        examTitle: title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
        subject: defaultSubject || classInfo?.subject || 'Hóa học',
        duration: Number(duration) || 45,
        code: '101',
        questions: buildNormalizedQuestions(items),
        includeAnswers: true,
        headerInfo: {
          deptName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
          schoolName: 'TRƯỜNG THPT',
          examName: (title || fileName.replace(/\.[^.]+$/, '') || 'ĐỀ KIỂM TRA ĐÁNH GIÁ CHUẨN GDPT 2025').toUpperCase(),
          subject: defaultSubject || classInfo?.subject || 'Hóa học',
          grade: String(defaultGrade || classInfo?.grade || '12'),
          schoolYear: '2026 - 2027',
          duration: Number(duration) || 45,
        },
      });
      setMsg(`Đã xuất file Word (.docx) chuẩn 3 phần thành công: ${filename}`);
    } catch (err) {
      setMsg(`Lỗi khi xuất Word: ${err.message}`);
    }
  };

  /* Thống kê Phần I, Phần II, Phần III, Lời giải, Mức độ, Hình ảnh */
  const stats = useMemo(() => {
    let p1 = 0;
    let p2 = 0;
    let p3 = 0;
    let hasAnswer = 0;
    let hasExplain = 0;
    let imgCount = 0;
    const lv = { nb: 0, th: 0, vd: 0, vdc: 0 };

    items.forEach((it) => {
      if (it.type === 'true_false') {
        p2++;
        if ((it.statements || []).length === 4 && it.statements.every((s) => s.answer === true || s.answer === false)) {
          hasAnswer++;
        }
      } else if (it.type === 'short_answer') {
        p3++;
        if (String(it.answer || '').trim()) hasAnswer++;
      } else {
        p1++;
        if (it.correct >= 0 && it.correct < (it.options || []).length) hasAnswer++;
      }
      if (it.explain?.trim()) hasExplain++;
      if (it.image) imgCount++;
      const lKey = (it.level || 'nb').toLowerCase();
      lv[lKey] = (lv[lKey] || 0) + 1;
    });

    return {
      total: items.length,
      p1,
      p2,
      p3,
      hasAnswer,
      hasExplain,
      imgCount,
      lv,
    };
  }, [items]);

  const checked = useMemo(() => items.map((it) => ({ it, issues: issuesOf(it) })), [items]);
  const valid = useMemo(() => checked.filter((c) => c.issues.length === 0).map((c) => c.it), [checked]);
  const issueCount = checked.length - valid.length;

  const filteredChecked = useMemo(() => {
    if (filterTab === 'p1') return checked.filter(({ it }) => !it.type || it.type === 'mcq');
    if (filterTab === 'p2') return checked.filter(({ it }) => it.type === 'true_false');
    if (filterTab === 'p3') return checked.filter(({ it }) => it.type === 'short_answer');
    if (filterTab === 'img') return checked.filter(({ it }) => Boolean(it.image));
    if (filterTab === 'issue') return checked.filter(({ issues }) => issues.length > 0);
    return checked;
  }, [checked, filterTab]);

  if (!open) return null;

  const patch = (id, p) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const setOption = (id, i, v) =>
    setItems((arr) =>
      arr.map((it) => (it.id === id ? { ...it, options: it.options.map((o, j) => (j === i ? v : o)) } : it))
    );
  const remove = (id) => setItems((arr) => arr.filter((it) => it.id !== id));

  const cycleLevel = (it) => {
    const cur = (it.level || 'nb').toLowerCase();
    const next = LEVEL_CYCLE[(LEVEL_CYCLE.indexOf(cur) + 1) % LEVEL_CYCLE.length];
    patch(it.id, { level: next });
  };

  /* Upload hình ảnh bổ sung cho 1 câu hỏi */
  const handleUploadQuestionImage = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        patch(id, { image: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  /* Chuẩn hóa danh sách câu hỏi để xuất sang Ngân hàng / Trộn đề / Tạo đề */
  const buildNormalizedQuestions = (sourceList = valid.length ? valid : items) =>
    sourceList.map((it) => {
      const meta = {
        ...(it.topic ? { topic: it.topic } : {}),
        level: it.level || 'nb',
        ...(it.image ? { image: it.image } : {}),
        ...(it.optionImages ? { optionImages: it.optionImages } : {}),
        subject: defaultSubject || classInfo?.subject || 'Hóa học',
        grade: Number(defaultGrade || classInfo?.grade || 12) || 12,
      };
      if (it.type === 'true_false') {
        return {
          ...meta,
          type: 'true_false',
          q: it.q,
          statements: (it.statements || []).map((x) => ({ text: x.text, answer: x.answer === true })),
          points: it.points || 1,
          explain: it.explain || '',
        };
      }
      if (it.type === 'short_answer') {
        const vi = String(it.answer || '').trim().replace('.', ',');
        return {
          ...meta,
          type: 'short_answer',
          q: it.q,
          answer: vi,
          accepted: [...new Set([vi, vi.replace(',', '.')])].filter(Boolean),
          points: it.points || 0.25,
          explain: it.explain || '',
        };
      }
      return {
        ...meta,
        type: 'single_choice',
        q: it.q,
        options: it.options || [],
        correct: it.correct >= 0 ? it.correct : 0,
        points: it.points || 0.25,
        explain: it.explain || '',
        ...(it.pg ? { groupId: it.pg, passage: it.passage, instruction: it.instruction } : {}),
      };
    });

  /* 1. Lưu vào Ngân hàng câu hỏi */
  const handleSaveBankClick = async () => {
    const listToSave = buildNormalizedQuestions();
    if (!listToSave.length) {
      setMsg('Chưa có câu hỏi nào để lưu vào ngân hàng.');
      return;
    }
    if (!onSaveToBank) return;
    setBusy(true);
    setMsg('');
    try {
      await onSaveToBank(listToSave);
      setMsg(`Đã lưu ${listToSave.length} câu hỏi vào Ngân hàng thành công!`);
    } catch (e) {
      setMsg(e.message || 'Lỗi khi lưu vào ngân hàng.');
    } finally {
      setBusy(false);
    }
  };

  /* 2. Đưa vào Trộn đề */
  const handleSendToMixerClick = () => {
    const listToMix = buildNormalizedQuestions(items);
    if (!listToMix.length) {
      setMsg('Vui lòng chọn file đề hoặc nạp câu hỏi trước khi đưa vào trộn đề.');
      return;
    }
    if (typeof onSendToMixer === 'function') {
      onSendToMixer({
        title: title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
        duration: Number(duration) || 45,
        sourceFile: fileName || 'Đề vừa nạp',
        questions: listToMix,
        stats,
      });
      return;
    }
    setOpenMixerModal(true);
  };

  /* 3. Tạo đề thi cho lớp */
  const handleCreateExamClick = async () => {
    const listToCreate = buildNormalizedQuestions();
    if (!listToCreate.length) {
      setMsg('Chưa có câu hỏi hợp lệ nào để tạo đề.');
      return;
    }
    if (!onCreateSoftExam) return;
    const targetClassId = classId || classInfo?.id || classes[0]?.id;
    if (!targetClassId) {
      setMsg('Vui lòng chọn hoặc tạo ít nhất một lớp học trước khi tạo đề.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await onCreateSoftExam({
        title: title || fileName.replace(/\.[^.]+$/, '') || 'Đề nhập từ file Word',
        duration: Number(duration) > 0 ? Number(duration) : 45,
        classId: targetClassId,
        subject: detectedSubject || defaultSubject || classInfo?.subject || 'Toán học',
        grade: detectedGrade || defaultGrade || classInfo?.grade || 12,
        questions: listToCreate,
        sourceFile: fileName || null,
      });
      setMsg(`Đã tạo đề thành công từ ${listToCreate.length} câu hỏi!`);
    } catch (e) {
      setMsg(e.message || 'Lỗi khi tạo đề.');
    } finally {
      setBusy(false);
    }
  };

  const content = (
    <div className={`wimp-shell ${isModal ? 'is-modal' : 'is-page'}`}>
      <style>{STUDIO_CSS}</style>

      {/* ===== THANH TIÊU ĐỀ CHUẨN MÀU CHỦ ĐẠO ELEC AI ===== */}
      <header className="wimp-topbar">
        <div className="wimp-topbar-left">
          <h2 className="wimp-topbar-title">
            <IcoDoc size={18} />
            {englishMode
              ? 'NHẬP CÂU HỎI TỰ ĐỘNG TỪ FILE WORD ENGLISH'
              : 'NHẬP CÂU HỎI TỰ ĐỘNG TỪ FILE WORD'}
          </h2>
          <span className="wimp-topbar-badge">
            <IcoSparkles size={13} />
            Hỗ trợ MathType • OMML • Gạch chân • Tự nhận hình ảnh
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="wimp-btn-soft"
            style={{
              background: englishMode ? '#4f46e5' : 'rgba(255,255,255,0.14)',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.32)',
            }}
            onClick={() => setEnglishMode((v) => !v)}
          >
            <IcoGlobe size={14} />
            {englishMode ? 'Đang bật chế độ Đề Tiếng Anh' : 'Chế độ Đề Tiếng Anh'}
          </button>
          {onClose && (
            <button type="button" className="wimp-topbar-close" onClick={onClose} title="Đóng">
              <IcoClose size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ===== THANH TIẾN TRÌNH 3 BƯỚC ===== */}
      <div className="wimp-steps-bar">
        <div className={`wimp-step-pill ${items.length > 0 ? '' : 'idle'}`}>
          <span className="wimp-step-check"><IcoCheck size={11} /></span>
          <span>Bước 1: {items.length > 0 ? 'Đã lưu vào bộ nhớ tạm' : 'Chọn file Word (.docx) hoặc dán đề'}</span>
        </div>
        <div className={`wimp-step-pill ${items.length > 0 ? '' : 'idle'}`}>
          <span className="wimp-step-check"><IcoCheck size={11} /></span>
          <span>Bước 2: Giải mã MathType, Công thức &amp; Hình ảnh</span>
        </div>
        <div className={`wimp-step-pill ${items.length > 0 ? '' : 'idle'}`}>
          <span className="wimp-step-check"><IcoCheck size={11} /></span>
          <span>Bước 3: Kiểm tra &amp; Phân tích trước khi nạp</span>
        </div>
      </div>

      {/* ===== KHÔNG GIAN 2 CỘT ===== */}
      <div className="wimp-workspace">
        {/* CỘT TRÁI: CÔNG CỤ NẠP FILE & CẤU HÌNH NHANH */}
        <aside className="wimp-left">
          {/* 1. TẢI FILE WORD MẪU */}
          <div className="wimp-box template-box">
            <div className="wimp-box-title">
              <IcoDoc size={14} /> CHƯA CÓ ĐỀ MẪU?
            </div>
            <p className="wimp-box-desc">
              Tải file Word mẫu đúng định dạng 3 phần (có sẵn công thức, đáp án in đậm + gạch dưới), thay nội dung của thầy/cô vào rồi nhập lại.
            </p>
            <div className="wimp-template-btns">
              <button type="button" className="wimp-btn-green" onClick={downloadWordTemplateDocx}>
                <IcoDownload size={14} /> Tải file Word mẫu
              </button>
              <button type="button" className="wimp-btn-soft" onClick={handleLoadSample}>
                <IcoBolt size={14} /> Nạp thử đề mẫu
              </button>
            </div>
          </div>

          {/* 2. Ô UPLOAD FILE WORD / PDF */}
          <div className="wimp-box">
            <label
              className={`wimp-dropzone ${items.length > 0 ? 'done' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer?.files?.[0];
                if (f) processFile(f);
              }}
            >
              <input
                type="file"
                accept=".docx,.doc,.pdf,.txt,.md,.json"
                hidden
                ref={fileRef}
                onChange={onFileChange}
                disabled={busy}
              />
              <span className="wimp-dropzone-ico">
                <IcoUpload size={18} />
              </span>
              {busy ? (
                <div className="wimp-dropzone-status">Đang đọc file &amp; trích xuất hình ảnh...</div>
              ) : fileName && items.length > 0 ? (
                <>
                  <div className="wimp-dropzone-status" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <IcoCheck size={14} /> Đã xử lý xong: {fileName} ({items.length} câu)
                  </div>
                  <div className="wimp-dropzone-sub">
                    Hoàn tất: {items.length} câu hỏi • Đã giải mã {formulaCount} công thức MathType/OMML
                    {stats.imgCount > 0 ? ` • ${stats.imgCount} hình ảnh` : ''}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 800, fontSize: '0.83rem', color: 'var(--ink, #0f172a)' }}>
                    Bấm chọn hoặc kéo thả file Word (.docx) vào đây
                  </div>
                  <div className="wimp-dropzone-sub">
                    Hỗ trợ .docx (có hình vẽ, bảng, công thức), .pdf, .txt, .json
                  </div>
                </>
              )}
            </label>
          </div>

          {/* 3. NHẬP NHANH CHUỖI ĐÁP ÁN ĐÚNG */}
          <div className="wimp-box">
            <div className="wimp-box-title">
              <IcoBolt size={14} /> NHẬP NHANH CHUỖI ĐÁP ÁN ĐÚNG
            </div>
            <input
              type="text"
              className="wimp-input"
              value={quickAnswerStr}
              onChange={(e) => handleQuickAnswerString(e.target.value)}
              placeholder="VD: 1A 2B 3C 4D... hoặc ABCDABCD..."
            />
            <p className="wimp-box-desc" style={{ fontSize: '0.72rem' }}>
              Dùng cho Phần I khi file Word chưa đánh dấu đáp án đúng. Gõ chuỗi chữ cái (ABCD...) hoặc (1A 2C 3B...) để gán tự động.
            </p>
          </div>

          {/* 4. PHÂN TÍCH THÔNG MINH & MỨC ĐỘ CÂU HỎI */}
          <div className="wimp-box level-box">
            <div className="wimp-box-title">
              <IcoTarget size={14} /> PHÂN TÍCH MỨC ĐỘ &amp; ĐÁP ÁN
            </div>
            <p className="wimp-box-desc">
              Tự nhận diện nhãn <b>[NB]</b> • <b>[TH]</b> • <b>[VD]</b> đầu câu hoặc tự phân tích mức độ &amp; dò đáp án đúng từ lời giải chi tiết.
            </p>
            {items.length > 0 && (
              <button
                type="button"
                className="wimp-btn-soft"
                style={{ width: '100%', marginTop: 2 }}
                onClick={handleSmartAnalyzeAll}
              >
                <IcoSparkles size={14} /> Tự động phân tích đề &amp; dò đáp án
              </button>
            )}
          </div>

          {/* 5. Ô COPY & DÁN */}
          <div className="wimp-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="wimp-box-title">HOẶC COPY &amp; DÁN (CTRL+V):</span>
              {raw && (
                <button
                  type="button"
                  style={{ border: 'none', background: 'none', color: '#dc2626', fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => { setRaw(''); if (appendMode === 'replace') setItems([]); }}
                >
                  Xóa ô dán
                </button>
              )}
            </div>
            <textarea
              className="wimp-paste-ta"
              value={raw}
              onChange={(e) => handlePasteTextChange(e.target.value)}
              placeholder="Dán nội dung đề từ Word hoặc khối JSON do AI tạo vào đây..."
            />
          </div>
        </aside>

        {/* CỘT PHẢI: MÀN HÌNH KIỂM TRA CÂU HỎI (BƯỚC 3) */}
        <section className="wimp-right">
          <div className="wimp-right-head">
            <div className="wimp-right-head-left">
              <span className="wimp-right-title">MÀN HÌNH KIỂM TRA CÂU HỎI:</span>
              <span className="wimp-pill green">
                <IcoCheck size={12} />
                {stats.total} câu • I: {stats.p1} • II: {stats.p2} • III: {stats.p3} ({stats.hasAnswer}/{stats.total} có đáp án)
              </span>
              {detectedSubject && (
                <span className="wimp-pill amber" title="Môn học và khối lớp được AI tự động nhận diện từ đề thi">
                  <IcoSparkles size={12} /> Môn: {detectedSubject} {detectedGrade ? `(Lớp ${detectedGrade})` : ''}
                </span>
              )}
              {formulaCount > 0 && (
                <span className="wimp-pill purple">
                  <IcoSparkles size={12} /> {formulaCount} công thức
                </span>
              )}
              {stats.imgCount > 0 && (
                <span className="wimp-pill blue">
                  <IcoImage size={12} /> {stats.imgCount} hình ảnh
                </span>
              )}
              {issueCount > 0 && (
                <span className="wimp-pill red">
                  <IcoAlert size={12} /> {issueCount} câu cần kiểm tra
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="wimp-btn"
                style={{ background: '#185abd', color: '#ffffff', borderColor: '#185abd', padding: '4px 10px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                onClick={() => setOpenWordEditor(true)}
                title="Mở Trình Soạn Thảo Giống Microsoft Word trực quan khổ giấy A4"
              >
                <IcoDoc size={13} /> Sửa giống Word (A4)
              </button>

              <div className="wimp-mode-seg" role="group" aria-label="Chế độ nạp đề">
                <button
                  type="button"
                  className={`wimp-mode-seg-btn ${appendMode === 'replace' ? 'active' : ''}`}
                  onClick={() => setAppendMode('replace')}
                >
                  Thay thế đề cũ
                </button>
                <button
                  type="button"
                  className={`wimp-mode-seg-btn ${appendMode === 'append' ? 'active' : ''}`}
                  onClick={() => setAppendMode('append')}
                >
                  Nối thêm vào cuối
                </button>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <>
              <div className="wimp-subbar">
                <div className="wimp-filter-tabs">
                  {[
                    { id: 'all', label: `Tất cả (${stats.total})` },
                    { id: 'p1', label: `Phần I (${stats.p1})` },
                    { id: 'p2', label: `Phần II (${stats.p2})` },
                    { id: 'p3', label: `Phần III (${stats.p3})` },
                    ...(stats.imgCount > 0 ? [{ id: 'img', label: `Có hình (${stats.imgCount})` }] : []),
                    ...(issueCount > 0 ? [{ id: 'issue', label: `Cần kiểm tra (${issueCount})` }] : []),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`wimp-filter-tab ${filterTab === tab.id ? 'active' : ''}`}
                      onClick={() => setFilterTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="wimp-btn-soft" onClick={handleSmartAnalyzeAll}>
                  <IcoSparkles size={13} /> Tự động dò đáp án &amp; mức độ
                </button>
              </div>

              <div className="wimp-summary-banner">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IcoInfo size={14} />
                    <span>
                      Cấu trúc đề: <b>Phần I = {stats.p1} câu</b> • <b>Phần II = {stats.p2} câu</b> • <b>Phần III = {stats.p3} câu</b> • Có lời giải: <b>{stats.hasExplain}/{stats.total} câu</b>.
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IcoTarget size={14} />
                    <span>
                      Phân bố mức độ nhận thức: <b>NB = {stats.lv.nb}</b> • <b>TH = {stats.lv.th}</b> • <b>VD = {stats.lv.vd}</b> • <b>VDC = {stats.lv.vdc}</b>.
                    </span>
                  </div>
                </div>
              </div>

              {/* BÁC SĨ AI: CHẨN ĐOÁN & BỔ SUNG ĐỦ 3 PHẦN GDPT 2025 */}
              {(stats.p2 < 4 || stats.p3 < 6) && (
                <div
                  style={{
                    margin: '8px 0',
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                    border: '1px solid #fde68a',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-flex', padding: 6, borderRadius: 8, background: '#fef3c7', color: '#b45309' }}>
                      <IcoSparkles size={16} />
                    </span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>
                        BÁC SĨ AI: CHẨN ĐOÁN &amp; BỔ SUNG ĐỦ 3 PHẦN GDPT 2025
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#78350f', marginTop: 2 }}>
                        File hiện có <b>{stats.p1} câu Phần I</b>. Đang thiếu <b>{Math.max(0, 4 - stats.p2)} câu Phần II</b> (Đúng/Sai) và <b>{Math.max(0, 6 - stats.p3)} câu Phần III</b> (Trả lời ngắn).
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
                      }}
                      disabled={busy}
                      onClick={handleAiComplete3Parts}
                    >
                      <IcoBolt size={13} /> AI Bổ sung đủ 3 phần (28 câu)
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: 8,
                        border: '1px solid #059669',
                        background: '#ecfdf5',
                        color: '#059669',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                      onClick={handleExportRepairedWord}
                    >
                      <IcoDownload size={13} /> Tải file Word (.docx) chuẩn
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="wimp-q-list">
            {items.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--muted, #64748b)', maxWidth: 520 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: 'rgba(79, 70, 229, 0.1)',
                    color: '#4f46e5',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <IcoDoc size={26} />
                </div>
                <h3 style={{ margin: '0 0 6px', color: 'var(--ink, #0f172a)', fontSize: '1.02rem', fontWeight: 800 }}>
                  Chưa có câu hỏi nào được nạp
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.84rem', lineHeight: 1.55 }}>
                  Hãy chọn file Word (<b>.docx</b>) ở cột bên trái hoặc bấm <b>"Nạp thử đề mẫu"</b> để xem cách hệ thống tự động nhận diện hình ảnh, công thức và phân tích cấu trúc 3 phần của đề thi.
                </p>
                <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" className="wimp-btn primary" onClick={() => fileRef.current?.click()}>
                    <IcoUpload size={15} /> Chọn file Word (.docx) ngay
                  </button>
                  <button type="button" className="wimp-btn" onClick={handleLoadSample}>
                    <IcoBolt size={15} /> Nạp thử đề mẫu 3 phần
                  </button>
                </div>
              </div>
            ) : (
              filteredChecked.map(({ it, issues }) => {
                const isEditing = editingId === it.id;
                const isTf = it.type === 'true_false';
                const isSa = it.type === 'short_answer';
                const partLabel = isTf ? 'PHẦN II' : isSa ? 'PHẦN III' : 'PHẦN I';
                const partCls = isTf ? 'p2' : isSa ? 'p3' : 'p1';
                const lvCode = LEVEL_LABELS[(it.level || 'nb').toLowerCase()] || 'NB';

                let ansBadgeText = '';
                let hasValidAns = true;
                if (isTf) {
                  const st = it.statements || [];
                  if (st.length === 4 && st.every((s) => s.answer === true || s.answer === false)) {
                    ansBadgeText = st.map((s) => (s.answer ? 'Đ' : 'S')).join('-');
                  } else {
                    ansBadgeText = 'Chưa đủ Đ/S';
                    hasValidAns = false;
                  }
                } else if (isSa) {
                  if (String(it.answer || '').trim()) {
                    ansBadgeText = `Đáp án: ${it.answer}`;
                  } else {
                    ansBadgeText = 'Thiếu đáp án';
                    hasValidAns = false;
                  }
                } else if (it.correct >= 0 && it.correct < (it.options || []).length) {
                  ansBadgeText = `Đáp án ${LETTERS[it.correct]}`;
                } else {
                  ansBadgeText = 'Chưa chọn đáp án';
                  hasValidAns = false;
                }

                return (
                  <article key={it.id} className={`wimp-q-card ${issues.length > 0 ? 'has-issue' : ''}`}>
                    {/* DÒNG ĐẦU THẺ CÂU HỎI */}
                    <div className="wimp-q-top">
                      <div className="wimp-q-top-left">
                        <span className={`wimp-part-badge ${partCls}`}>{partLabel}</span>
                        <span className="wimp-q-num">CÂU {it.num}</span>
                        {it.src && (
                          <span className="wimp-pill blue" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            Nguồn: {it.src}
                          </span>
                        )}
                        {issues.map((iss) => (
                          <span key={iss} className="wimp-pill red">
                            <IcoAlert size={11} /> {iss}
                          </span>
                        ))}
                      </div>

                      <div className="wimp-q-top-right">
                        <button
                          type="button"
                          className="wimp-lv-btn"
                          onClick={() => cycleLevel(it)}
                          title="Bấm để đổi mức độ NB → TH → VD → VDC"
                        >
                          <IcoTarget size={12} /> {lvCode}
                        </button>
                        <span className={`wimp-ans-badge ${hasValidAns ? '' : 'err'}`}>
                          {hasValidAns ? <IcoCheck size={12} /> : <IcoAlert size={12} />}
                          {ansBadgeText}
                        </span>
                        <button
                          type="button"
                          className="wimp-act-btn"
                          onClick={() => setEditingId(isEditing ? null : it.id)}
                        >
                          <IcoEdit size={13} /> {isEditing ? 'Xong' : 'Sửa'}
                        </button>
                        <button
                          type="button"
                          className="wimp-act-btn danger"
                          onClick={() => remove(it.id)}
                          title="Xóa câu hỏi này"
                        >
                          <IcoTrash size={13} />
                        </button>
                      </div>
                    </div>

                    {/* NỘI DUNG CÂU DẪN */}
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea
                          className="wimp-input"
                          rows={3}
                          value={it.q}
                          onChange={(e) => patch(it.id, { q: e.target.value })}
                          placeholder="Nội dung câu hỏi..."
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <label className="wimp-act-btn" style={{ cursor: 'pointer' }}>
                            <IcoImage size={13} /> {it.image ? 'Đổi hình ảnh' : 'Thêm hình ảnh'}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => handleUploadQuestionImage(it.id, e.target.files?.[0])}
                            />
                          </label>
                          {it.image && (
                            <button
                              type="button"
                              className="wimp-act-btn danger"
                              onClick={() => patch(it.id, { image: null, images: [] })}
                            >
                              <IcoTrash size={13} /> Xóa hình ảnh
                            </button>
                          )}
                          <input
                            type="text"
                            className="wimp-input"
                            style={{ flex: 1, minWidth: 200 }}
                            value={it.explain || ''}
                            onChange={(e) => patch(it.id, { explain: e.target.value })}
                            placeholder="Lời giải chi tiết (tùy chọn)..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="wimp-q-stem">
                        <MathText text={it.q} />
                      </div>
                    )}

                    {/* HÌNH ẢNH TỰ ĐỘNG TRÍCH XUẤT TỪ FILE WORD */}
                    {it.image && (
                      <div className="wimp-q-img-wrap">
                        <img src={it.image} alt={`Hình câu ${it.num}`} className="wimp-q-img" />
                      </div>
                    )}

                    {/* PHẦN I: LƯỚI 2x2 ĐÁP ÁN A, B, C, D */}
                    {!isTf && !isSa && (
                      <div className="wimp-opts-grid">
                        {(it.options || []).map((opt, oIdx) => {
                          const isCorr = it.correct === oIdx;
                          const optImg = it.optionImages?.[oIdx];
                          if (isEditing) {
                            return (
                              <div key={oIdx} className={`wimp-opt-card ${isCorr ? 'is-correct' : ''}`}>
                                <button
                                  type="button"
                                  className="wimp-opt-letter"
                                  onClick={() => patch(it.id, { correct: oIdx, src: 'bạn chọn' })}
                                  title="Chọn làm đáp án đúng"
                                >
                                  {LETTERS[oIdx]}
                                </button>
                                <input
                                  type="text"
                                  className="wimp-input"
                                  value={opt}
                                  onChange={(e) => setOption(it.id, oIdx, e.target.value)}
                                />
                              </div>
                            );
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              className={`wimp-opt-card ${isCorr ? 'is-correct' : ''}`}
                              onClick={() => patch(it.id, { correct: oIdx, src: 'bạn chọn' })}
                              title="Nhấn để chọn đáp án đúng"
                            >
                              <span className="wimp-opt-letter">{LETTERS[oIdx]}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <MathText text={opt} />
                                {optImg && (
                                  <img
                                    src={optImg}
                                    alt={`Phương án ${LETTERS[oIdx]}`}
                                    style={{ display: 'block', maxHeight: 90, maxWidth: '100%', marginTop: 4, borderRadius: 6, background: '#fff', padding: 2 }}
                                  />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* PHẦN II: 4 NHẬN ĐỊNH ĐÚNG / SAI */}
                    {isTf && (
                      <div className="wimp-tf-list">
                        {(it.statements || []).map((st, sIdx) => (
                          <div key={sIdx} className="wimp-tf-item">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <b style={{ marginRight: 6, color: '#4338ca' }}>{'abcd'[sIdx] || sIdx + 1})</b>
                              {isEditing ? (
                                <input
                                  type="text"
                                  className="wimp-input"
                                  style={{ display: 'inline-block', width: 'calc(100% - 30px)' }}
                                  value={st.text}
                                  onChange={(e) =>
                                    patch(it.id, {
                                      statements: it.statements.map((x, j) => (j === sIdx ? { ...x, text: e.target.value } : x)),
                                    })
                                  }
                                />
                              ) : (
                                <MathText text={st.text} />
                              )}
                            </div>
                            <div className="wimp-tf-btns">
                              <button
                                type="button"
                                className={`wimp-tf-btn ${st.answer === true ? 'on-true' : ''}`}
                                onClick={() =>
                                  patch(it.id, {
                                    statements: it.statements.map((x, j) => (j === sIdx ? { ...x, answer: true } : x)),
                                  })
                                }
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                className={`wimp-tf-btn ${st.answer === false ? 'on-false' : ''}`}
                                onClick={() =>
                                  patch(it.id, {
                                    statements: it.statements.map((x, j) => (j === sIdx ? { ...x, answer: false } : x)),
                                  })
                                }
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PHẦN III: TRẢ LỜI NGẮN */}
                    {isSa && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-2, #334155)' }}>
                          Đáp án đúng (số):
                        </span>
                        <input
                          type="text"
                          className="wimp-input"
                          style={{ maxWidth: 160, fontWeight: 800, color: '#047857' }}
                          value={it.answer || ''}
                          onChange={(e) => patch(it.id, { answer: e.target.value, src: 'bạn nhập' })}
                          placeholder="VD: 12,5"
                        />
                      </div>
                    )}

                    {/* LỜI GIẢI (NẾU CÓ) */}
                    {!isEditing && it.explain && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-2, #475569)', background: 'var(--soft, #f8fafc)', padding: '6px 10px', borderRadius: 8, borderLeft: '3px solid #4f46e5' }}>
                        <b>Lời giải:</b> <MathText text={it.explain} />
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ===== THANH CHÂN TRANG (FOOTER) ===== */}
      <footer className="wimp-footer">
        <div className="wimp-footer-tip">
          <IcoInfo size={14} />
          <span>
            <b>Mẹo:</b> Nhấn trực tiếp vào phương án A/B/C/D để đổi đáp án đúng • Bấm <b>"Sửa"</b> để chỉnh công thức hoặc thêm hình ảnh.
          </span>
          {msg && (
            <span style={{ marginLeft: 6, color: msg.includes('thành công') ? '#059669' : '#dc2626', fontWeight: 800 }}>
              • {msg}
            </span>
          )}
        </div>

        <div className="wimp-footer-actions">
          {allowSoftExam && onCreateSoftExam && (
            <>
              <input
                type="text"
                className="wimp-input"
                style={{ width: 190 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên đề kiểm tra..."
              />
              {classes.length > 0 && (
                <select
                  className="wimp-input"
                  style={{ width: 150 }}
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lớp {c.name || c.title}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {onClose && (
            <button type="button" className="wimp-btn" onClick={onClose}>
              Hủy
            </button>
          )}

          {(allowBank || onSaveToBank) && (
            <button
              type="button"
              className="wimp-btn emerald"
              disabled={!items.length || busy}
              onClick={handleSaveBankClick}
            >
              <IcoFolder size={14} /> Lưu vào ngân hàng ({items.length})
            </button>
          )}

          {allowSoftExam && onCreateSoftExam && (
            <button
              type="button"
              className="wimp-btn emerald"
              disabled={!items.length || busy}
              onClick={handleCreateExamClick}
            >
              <IcoCheck size={14} /> Tạo đề cho lớp ({items.length})
            </button>
          )}

          <button
            type="button"
            className="wimp-btn primary"
            disabled={!items.length || busy}
            onClick={handleSendToMixerClick}
          >
            <IcoShuffle size={14} /> Đưa vào trộn đề
          </button>
        </div>
      </footer>

      {/* MODAL TRỘN ĐỀ NẾU MỞ TRỰC TIẾP TỪ EXAM IMPORTER */}
      {openMixerModal && (
        <ExamPreviewSimulator
          exam={{
            title: title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
            subject: defaultSubject || classInfo?.subject || 'Hóa học',
            duration: Number(duration) || 45,
            grade: detectedGrade || defaultGrade || classInfo?.grade || '12',
            questions: buildNormalizedQuestions(items),
          }}
          questions={buildNormalizedQuestions(items)}
          classes={classes}
          defaultTab="config"
          initialWizardStep={2}
          onClose={() => setOpenMixerModal(false)}
        />
      )}

      {/* MODAL SOẠN THẢO WORD A4 NẾU MỞ TỪ EXAM IMPORTER */}
      {openWordEditor && (
        <WordDocxEditor
          open={openWordEditor}
          onClose={() => setOpenWordEditor(false)}
          initialExam={{
            title: title || fileName.replace(/\.[^.]+$/, '') || 'Đề kiểm tra',
            subject: detectedSubject || defaultSubject || classInfo?.subject || 'Vật lí',
            grade: detectedGrade || defaultGrade || classInfo?.grade || 12,
            duration: Number(duration) || 45,
            questions: buildNormalizedQuestions(items),
          }}
          classes={classes}
          onSaveToClass={async (newExam) => {
            if (onCreateSoftExam) {
              await onCreateSoftExam({
                ...newExam,
                classId: classId || classInfo?.id || classes[0]?.id,
              });
            }
          }}
          onSaveToBank={onSaveToBank}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="wimp-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
        {content}
      </div>
    );
  }

  return content;
}
