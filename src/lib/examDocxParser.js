/* ============================================================
   examDocxParser.js — Bộ giải mã chuyên sâu File Word (.docx), OMML & Hình ảnh
   Chuẩn cấu trúc đề thi 3 phần GDPT 2025 (Bộ Giáo dục và Đào tạo)
   ============================================================ */

import { detectExamSubjectAndGrade } from './subjectClassifier.js';

const LETTERS = 'ABCDEF';
const UL_TAGS = new Set(['U', 'INS', 'MARK']);
const BOLD_TAGS = new Set(['B', 'STRONG']);

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

export const toUnicodeSup = (str) => {
  const s = String(str || '').trim();
  if (!s) return '';
  if ([...s].every((ch) => SUP_MAP[ch])) return [...s].map((ch) => SUP_MAP[ch]).join('');
  return `^{${s}}`;
};

export const toUnicodeSub = (str) => {
  const s = String(str || '').trim();
  if (!s) return '';
  if ([...s].every((ch) => SUB_MAP[ch])) return [...s].map((ch) => SUB_MAP[ch]).join('');
  return `_${s.length > 1 ? `{${s}}` : s}`;
};

export const fold = (s) =>
  String(s || '')
    .split('')
    .map((c) => (c === 'đ' || c === 'Đ' ? 'd' : c.normalize('NFD')[0]))
    .join('')
    .toLowerCase();

export const mkLine = (t) => {
  const z = '0'.repeat(t.length);
  return { t, m: z, u: z, b: z };
};

export const sliceLine = (ln, a, b) => ({
  t: ln.t.slice(a, b),
  m: (ln.m || '').slice(a, b),
  u: (ln.u || '').slice(a, b),
  b: (ln.b || '').slice(a, b),
});

export const trimLine = (ln) => {
  const a = ln.t.length - ln.t.trimStart().length;
  const b = ln.t.trimEnd().length;
  return b <= a ? { t: '', m: '', u: '', b: '' } : sliceLine(ln, a, b);
};

export const textToLines = (raw) => {
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
const LEVEL_TAG_RE = /^\s*(?:[\[(]\s*(nb|th|vd|vdc|nhan\s*biet|thong\s*hieu|van\s*dung\s*cao|van\s*dung)\s*[\])]\s*[:.\-–]?\s*)/i;
const SA_NUM = '([+-]?\\d[\\d.,]*)(?![\\d])';
const TF_PAIR_RE = /([a-d])\s*[-:.)=]?\s*(dung|sai|d|s)(?![a-z])/g;

export const parseAndStripLevelTag = (text) => {
  const s = String(text || '');
  const f = fold(s);
  const m = f.match(LEVEL_TAG_RE);
  if (!m) {
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

export const isQStart = (text) => Q_RE.test(fold(text.trim()));
export const isOptStart = (text) => OPT_RE.test(text.trim());

export const countFormulasInText = (str) => {
  const s = String(str || '');
  const latexMatches = s.match(/\$[^$]+\$|\\ce\{|\\frac|\\sqrt|[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀₁₂₃₄₅₆₇₈₉→⇌⇄∆°]/g);
  return latexMatches ? latexMatches.length : 0;
};

/* Giải mã node <m:oMath> của Word thành công thức đọc được */
export const convertOmmlNode = (node) => {
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

/* Tiền xử lý buffer docx bằng JSZip để giải mã OMML và biến Floating/Anchored image thành Inline */
export const preprocessDocxBuffer = async (arrayBuffer) => {
  let ommlCount = 0;
  const mediaImages = {};

  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Thu thập toàn bộ hình ảnh có sẵn trong thư mục word/media/
    for (const [relPath, fileObj] of Object.entries(zip.files)) {
      if (relPath.startsWith('word/media/') && !fileObj.dir) {
        try {
          const b64 = await fileObj.async('base64');
          const ext = relPath.split('.').pop().toLowerCase();
          const mime = ext === 'png' ? 'image/png' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
          mediaImages[relPath.replace('word/', '')] = `data:${mime};base64,${b64}`;
        } catch (_) {}
      }
    }

    const docFile = zip.file('word/document.xml');
    if (!docFile) return { buffer: arrayBuffer, ommlCount: 0, mediaImages };

    let xmlStr = await docFile.async('string');

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

    // 2. Chuyển đổi toàn bộ <wp:anchor> thành <wp:inline> và VML <w:pict> thành <w:drawing> để Mammoth nhận diện đầy đủ 100% hình ảnh sơ đồ
    xmlStr = xmlStr.replace(/<wp:anchor\b/g, '<wp:inline').replace(/<\/wp:anchor>/g, '</wp:inline>');
    xmlStr = xmlStr.replace(
      /<w:pict\b[\s\S]*?<v:imagedata[^>]*?r:id="([^"]+)"[\s\S]*?<\/w:pict>/gi,
      (_, rId) => `<w:drawing><wp:inline><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`
    );

    // 3. Đánh dấu gạch chân cho đáp án được tô màu hoặc highlight
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
    return { buffer: newBuffer, ommlCount, mediaImages };
  } catch {
    return { buffer: arrayBuffer, ommlCount: 0, mediaImages };
  }
};

export const loadMammoth = async () => {
  const m = await import('mammoth/mammoth.browser.js');
  return m.default || m;
};

export const collect = (node, state, acc) => {
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

export const flushAcc = (lines, acc, prefix = '') => {
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

export const htmlToLines = (html) => {
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

export const readDocx = async (file) => {
  const rawBuffer = await file.arrayBuffer();
  const { buffer, ommlCount, mediaImages } = await preprocessDocxBuffer(rawBuffer);
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
          const b64 = await image.read('base64');
          if (b64) {
            const idx = extractedImages.length;
            extractedImages.push(`data:${ct};base64,${b64}`);
            return { src: `__DOCX_IMG_${idx}__` };
          }
          return { src: '' };
        } catch {
          return { src: '' };
        }
      }),
    }
  );

  // Nếu trong zip có ảnh media mà Mammoth bỏ sót, bổ sung thêm để không bao giờ mất ảnh
  if (mediaImages) {
    Object.values(mediaImages).forEach((dataUrl) => {
      if (!extractedImages.includes(dataUrl)) {
        extractedImages.push(dataUrl);
      }
    });
  }

  const { lines, subSupFormulas } = htmlToLines(value);
  return {
    lines,
    extractedImages,
    formulaCount: ommlCount + Math.ceil(subSupFormulas / 2),
  };
};

/* Tách các token [[IMG_n]] ra khỏi chuỗi văn bản và trả về { cleanText, imgUrls } */
export const extractImgTokens = (str, extractedImages = []) => {
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

const appendText = (c, text, sep) => {
  if (c.mode === 'explain') c.explain += (c.explain ? sep : '') + text;
  else if (c.mode === 'opts') {
    const o = c.opts[c.opts.length - 1];
    o.t += (o.t ? sep : '') + text;
  } else if (c.mode === 'stem') {
    c.stem += (c.stem ? sep : '') + text;
  }
};

const readKey = (f) => {
  const pairs = [];
  const rest = f.replace(KEY_PAIR_RE, (_, n, l) => { pairs.push([Number(n), l.toUpperCase()]); return ' '; });
  const leftover = rest.replace(/\b(?:cau|dap an|da|stt|bang|chi tiet|tham khao)\b/g, '').replace(/[\s,;|:.\-]+/g, '').trim();
  return { pairs, clean: pairs.length > 0 && leftover.length <= 6 };
};

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

/* Phân tích cấu trúc các dòng thành câu hỏi 3 phần chuẩn GDPT 2025 */
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

    // Dòng chứa hình ảnh gắn thẳng vào câu dẫn
    if (ln.t.includes('[[IMG_') || /^(?:\[\[IMG_\d+\]\]\s*)+$/.test(ln.t)) {
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

    if (/^read the following/i.test(ln.t)) {
      groupCounter++;
      currentGroupId = `pg_en_${groupCounter}`;
      currentGroupInstruction = ln.t;
      currentGroupPassage = '';
      continue;
    }

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

    if (SECTION_RE.test(f)) {
      cur = null;
      lastNum = 0;
      sect = sectType(f) !== 'mc' ? sectType(f) : (bareSectType(f) || 'mc');
      currentGroupId = '';
      currentGroupInstruction = '';
      currentGroupPassage = '';
      continue;
    }

    const qm = f.match(Q_RE);
    if (qm) {
      const n = Number(qm[1] ?? qm[2] ?? qm[3]);
      const keyword = qm[1] !== undefined;
      const sequential = n === lastNum + 1 || qs.length === 0 || (n === 1 && cur && (cur.opts.length >= 2 || cur.type === 'sa' || cur.type === 'tf'));
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

  let idSeq = 0;
  let hadAnyLevelTag = false;

  const questions = qs.map((c) => {
    if (c.type === 'tf' && !c.tfAns) { const a = tfKey.get(c.num)?.shift(); if (a) c.tfAns = a; }
    if (c.type === 'sa' && !c.saAns) { const a = saKey.get(c.num)?.shift(); if (a) c.saAns = a; }

    if (c.type === 'mc' && c.opts.length === 4) {
      const allLowerAbcd = c.opts.every((o) => o.isLowerLetter);
      const uCount = c.opts.filter((o) => o.uMarked || o.star).length;
      const hasInlineTf = c.opts.some((o) => /\s*[-–:→(]+\s*(đúng|sai)\s*\)?\s*$/i.test(o.t));
      if (allLowerAbcd && (uCount > 1 || hasInlineTf || c.tfAns)) {
        c.type = 'tf';
      }
    }

    if (c.type === 'mc' && c.opts.length === 0 && !c.saAns) {
      const explainNum = c.explain.match(/(?:đáp\s*án|đa|đáp\s*số|kết\s*quả|kq)\s*[:=]\s*([+-]?\d[\d.,]*)/i);
      if (explainNum) {
        c.type = 'sa';
        c.saAns = explainNum[1].replace(/[.,]+$/, '');
      }
    }

    const { cleanText: stemWithoutImgs, imgUrls: stemImgs } = extractImgTokens(c.stem, extractedImages);
    const { level: parsedLevel, text: rawFinalStem, hadTag } = parseAndStripLevelTag(stemWithoutImgs);
    if (hadTag) hadAnyLevelTag = true;

    // Đảm bảo không bao giờ để trống stem nếu câu hỏi có hình ảnh
    const finalStem = rawFinalStem.trim() || (stemImgs.length > 0 ? 'Quan sát hình vẽ / sơ đồ / đồ thị sau:' : '');

    const { cleanText: cleanExplain } = extractImgTokens(c.explain, extractedImages);
    const autoLevel = parsedLevel || classifySmartLevel(finalStem, c.type, cleanExplain);

    /* ----- PHẦN II: ĐÚNG / SAI ----- */
    if (c.type === 'tf') {
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
        part: 2,
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
        part: 3,
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
      type: 'single_choice',
      part: 1,
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
      if (q.type !== 'single_choice' && q.type !== 'mcq') return;
      const letter = keyQueue.get(q.num)?.shift();
      if (!letter || q.src === 'dòng đáp án') return;
      const idx = LETTERS.indexOf(letter);
      if (idx >= 0 && idx < q.options.length) {
        q.correct = idx;
        q.src = 'bảng đáp án';
      }
    });
  }

  // BẢO TOÀN HÌNH ẢNH: Phân bổ hình ảnh trích xuất chưa được gán cho các câu hỏi đề cập đến hình vẽ / đồ thị
  if (Array.isArray(extractedImages) && extractedImages.length > 0) {
    const assignedUrls = new Set();
    questions.forEach((q) => {
      if (q.image) assignedUrls.add(q.image);
      if (Array.isArray(q.images)) q.images.forEach((img) => assignedUrls.add(img));
      if (q.optionImages) Object.values(q.optionImages).forEach((img) => assignedUrls.add(img));
    });

    const unassignedImgs = extractedImages.filter((img) => !assignedUrls.has(img));

    if (unassignedImgs.length > 0) {
      const needsImgRegex = /(?:h[ìi]nh\s*(?:vẽ|bên|dưới|sau|trên|\d+)|sơ\s*đồ|đồ\s*thị|bảng\s*(?:biến\s*thiên|số\s*liệu)|quan\s*sát\s*hình)/i;
      questions.forEach((q) => {
        if (!q.image && unassignedImgs.length > 0 && needsImgRegex.test(q.q || '')) {
          const matchedImg = unassignedImgs.shift();
          q.image = matchedImg;
          q.images = [matchedImg];
        }
      });

      questions.forEach((q) => {
        if (!q.image && unassignedImgs.length > 0 && (!q.q || q.q.trim().length < 20)) {
          const matchedImg = unassignedImgs.shift();
          q.image = matchedImg;
          q.images = [matchedImg];
          if (!q.q || !q.q.trim()) {
            q.q = 'Quan sát hình vẽ sau và chọn phương án đúng:';
          }
        }
      });
    }
  }

  return { questions, keyFound, hadAnyLevelTag };
};

/* ============================================================
   HÀM CHÍNH CHO FILE DOCX: parseExamDocxFile
   ============================================================ */
export async function parseExamDocxFile(file) {
  const { lines, extractedImages, formulaCount } = await readDocx(file);
  const parsed = parseLines(lines, extractedImages);

  const fullText = (lines || []).map((l) => l.t).join('\n');
  const detected = detectExamSubjectAndGrade({
    fileName: file.name,
    text: fullText,
    questions: parsed.questions,
  });

  const part1 = parsed.questions.filter((q) => q.part === 1 || q.type === 'single_choice').length;
  const part2 = parsed.questions.filter((q) => q.part === 2 || q.type === 'true_false').length;
  const part3 = parsed.questions.filter((q) => q.part === 3 || q.type === 'short_answer').length;

  return {
    questions: parsed.questions,
    subject: detected.subject,
    grade: detected.grade,
    extractedImages,
    formulaCount,
    text: fullText,
    stats: {
      total: parsed.questions.length,
      part1,
      part2,
      part3,
      imageCount: extractedImages.length,
      successRate: 100,
    },
  };
}
