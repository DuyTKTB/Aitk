/* ============================================================
   ExamImporter.jsx — Nhập đề từ file (v2)
   Props giữ nguyên: variant, classInfo, classes, allowBank,
   allowSoftExam, onCreateSoftExam

   NÂNG CẤP:
   • Hỗ trợ Word (.docx) qua `mammoth` (cài: npm i mammoth)
   • Đọc PDF theo dòng (dựa vào toạ độ Y) thay vì dính một cục
   • Nhận diện nhiều kiểu đánh số: "Câu 1.", "Câu 1:", "Bài 1",
     "Question 1", "1.", "1)", "[1]"; hỗ trợ cả danh sách tự đánh
     số của Word
   • Lựa chọn A–F, cả khi nằm chung một dòng "A. … B. … C. … D. …"
   • Nhận diện đáp án đúng từ:
       - dòng "Đáp án: B" / "ĐA: B" / "Answer: B" / "Đáp án: <nội dung>"
       - PHẦN II (đúng/sai): nhận định a) b) c) d) + "Đáp án: a-Đ, b-S, c-S, d-Đ" (hoặc ĐSSĐ)
       - PHẦN III (trả lời ngắn): "Đáp án: 8,8"; bảng đáp án cuối đề cũng được nhận
       - BẢNG ĐÁP ÁN cuối đề ("1.A 2.B …", "1-A, 2-B", bảng ngang/dọc)
       - đáp án được IN ĐẬM / GẠCH CHÂN trong Word
       - đáp án có dấu * hoặc ✓
   • Nhận diện dòng "Giải thích / Lời giải"
   • Bản xem trước: sửa nội dung, chọn lại đáp án, xoá câu,
     cảnh báo câu có vấn đề; chỉ tạo các câu hợp lệ
   • NHẬP JSON: dán JSON (từ AI hoặc tự viết) → tự thành đề, có hướng
     dẫn, prompt mẫu, JSON mẫu, tự sửa lỗi JSON thường gặp
   • NHẬP CODE → tự nhảy sang chế độ "Sinh đề từ code": tạo sẵn
     prompt (kèm code, số câu, mức độ, dạng câu) để dán vào chat AI;
     dán kết quả AI trả về là đọc thành đề, hỗ trợ câu hỏi có
     khối code (```), tự bỏ định dạng markdown (**, #, -)
   ============================================================ */
import { Fragment, useEffect, useRef, useState } from 'react';

/* ============================================================
   1. TIỆN ÍCH VĂN BẢN
   Mỗi dòng là { t: text, m: mask } — mask cùng độ dài với text,
   '1' = ký tự đang in đậm/gạch chân (dùng để đoán đáp án đúng).
   ============================================================ */
const LETTERS = 'ABCDEF';
const MARK_TAGS = new Set(['U', 'STRONG', 'B']);

/* Bỏ dấu nhưng GIỮ NGUYÊN độ dài để dùng chung chỉ số với bản gốc */
const fold = (s) =>
  s.split('').map((c) => (c === 'đ' || c === 'Đ' ? 'd' : c.normalize('NFD')[0])).join('').toLowerCase();

const mkLine = (t) => ({ t, m: '0'.repeat(t.length) });
const sliceLine = (ln, a, b) => ({ t: ln.t.slice(a, b), m: ln.m.slice(a, b) });
const trimLine = (ln) => {
  const a = ln.t.length - ln.t.trimStart().length;
  const b = ln.t.trimEnd().length;
  return b <= a ? { t: '', m: '' } : sliceLine(ln, a, b);
};

/* Giữ nguyên thụt lề trong khối ``` (code); dòng thường thì bỏ markdown */
const textToLines = (raw) => {
  let inFence = false;
  const out = [];
  raw.replace(/\r/g, '').split('\n').forEach((s0) => {
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

const appendText = (c, text, sep) => {
  if (c.mode === 'explain') c.explain += (c.explain ? sep : '') + text;
  else if (c.mode === 'opts') { const o = c.opts[c.opts.length - 1]; o.t += (o.t ? sep : '') + text; }
  else if (c.mode === 'stem') c.stem += (c.stem ? sep : '') + text;
};

/* ----- Regex nhận diện (chạy trên bản đã bỏ dấu, chữ thường) ----- */
const Q_RE = /^(?:(?:cau(?:\s*hoi)?|bai|question|q)\s*(\d{1,3})\s*[.:)\-–]?|(\d{1,3})[.)](?!\d)|\[\s*(\d{1,3})\s*\])\s*/;
const OPT_RE = /^[*✓✔]?\s*\(?([A-Fa-f])[.)]\s*/;
const ANS_LETTER_RES = [
  /^(?:dap\s*an(?:\s*dung)?|answer)\s*(?:la\s*)?[:\-.]?\s*\(?([a-f])\)?(?![a-z0-9])(.*)$/,
  /^(?:da|ans|key)\s*[:\-.]\s*\(?([a-f])\)?(?![a-z0-9])(.*)$/,
];
const ANS_TEXT_RE = /^(?:dap\s*an(?:\s*dung)?|answer)\s*[:\-.]\s*(.+)$/;
const EXPLAIN_RE = /^(?:giai thich|loi giai(?: chi tiet)?|huong dan giai|explanation|explain)\s*(?:[:\-.]\s*(.*))?$/;
const KEY_HEAD_RE = /^(?:bang\s*)?dap\s*an(?:\s*(?:chi tiet|tham khao|goi y))?\s*[:\-]?\s*/;
const KEY_PAIR_RE = /(?:cau\s*)?(\d{1,3})\s*[.:\-–)=]*\s*([a-f])\b/g;
const SECTION_RE = /^(?:phan|part|section)\s+(?:[ivx]+|\d+)\b/;

const isQStart = (text) => Q_RE.test(fold(text.trim()));
const isOptStart = (text) => OPT_RE.test(text.trim());

const readKey = (f) => {
  const pairs = [];
  const rest = f.replace(KEY_PAIR_RE, (_, n, l) => { pairs.push([Number(n), l.toUpperCase()]); return ' '; });
  const leftover = rest.replace(/\b(?:cau|dap an|da|stt|bang|chi tiet|tham khao)\b/g, '').replace(/[\s,;|:.\-]+/g, '').trim();
  return { pairs, clean: pairs.length > 0 && leftover.length <= 6 };
};

/* ============================================================
   2. ĐỌC FILE → DÒNG
   ============================================================ */

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

/* ----- Word: .docx → HTML (mammoth) → dòng có mask in đậm/gạch chân ----- */
const loadMammoth = async () => {
  const m = await import('mammoth/mammoth.browser.js');
  return m.default || m;
};

const collect = (node, marked, acc) => {
  const push = (s, mk) => { acc.t += s; acc.m += (mk ? '1' : '0').repeat(s.length); };
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) {
      const t = n.nodeValue.normalize('NFC').replace(/[\u00a0\u200b\t\u3000]/g, ' ').replace(/\s+/g, ' ');
      push(t, marked);
    } else if (n.nodeType === 1) {
      const tag = n.tagName;
      if (tag === 'BR') push('\n', false);
      else if (tag === 'IMG') { push('[hình]', false); acc.imgs++; }
      else if (tag === 'OL' || tag === 'UL' || tag === 'TABLE') return;
      else {
        collect(n, marked || MARK_TAGS.has(tag), acc);
        if (tag === 'P') push(' ', false);
      }
    }
  });
};

const flushAcc = (lines, acc, prefix = '') => {
  let off = 0;
  acc.t.split('\n').forEach((seg, i) => {
    const ln = trimLine({ t: seg, m: acc.m.slice(off, off + seg.length) });
    off += seg.length + 1;
    if (!ln.t) return;
    lines.push(i === 0 && prefix ? { t: prefix + ln.t, m: '0'.repeat(prefix.length) + ln.m } : ln);
  });
};

const htmlToLines = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const lines = [];
  let imgs = 0;
  let qn = 0;
  const newAcc = () => ({ t: '', m: '', imgs: 0 });

  const walk = (parent, depth, listsOnly) => {
    for (const el of parent.children) {
      const tag = el.tagName;
      if (tag === 'OL' || tag === 'UL') {
        const prev = el.previousElementSibling;
        /* Danh sách tự đánh số: cấp 1 = câu hỏi, cấp 2 (hoặc ngay sau 1 dòng "Câu…") = A/B/C/D */
        const asOpts = tag === 'OL' && (depth > 0 || (prev && /^(P|H\d)$/.test(prev.tagName) && isQStart(prev.textContent || '')));
        let i = 0;
        for (const li of el.children) {
          i++;
          const acc = newAcc();
          collect(li, false, acc);
          imgs += acc.imgs;
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
          tr.querySelectorAll('th,td').forEach((td) => { collect(td, false, acc); acc.t += ' '; acc.m += '0'; });
          imgs += acc.imgs;
          flushAcc(lines, acc);
        });
      } else if (!listsOnly) {
        const acc = newAcc();
        collect(el, false, acc);
        imgs += acc.imgs;
        flushAcc(lines, acc);
        walk(el, depth, true);
      }
    }
  };
  walk(doc.body, 0, false);
  return { lines, imgs };
};

const readDocx = async (file) => {
  const mammoth = await loadMammoth();
  const { value } = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    {
      styleMap: ['u => u', 'strike => s'],
      convertImage: mammoth.images.imgElement(async () => ({ src: '' })),
    },
  );
  return htmlToLines(value);
};

/* ============================================================
   3. PHÂN TÍCH CÂU HỎI
   ============================================================ */
/* Dạng câu theo tiêu đề phần: "PHẦN II. Câu trắc nghiệm đúng sai…" / "PHẦN III. Trả lời ngắn" */
const sectType = (f) => {
  if (/dung\s*(?:\/|-|hoac)?\s*sai|true\s*\/?\s*false/.test(f)) return 'tf';
  if (/tra loi ngan|dien so|dien ket qua|short answer|ket qua bang so/.test(f)) return 'sa';
  return 'mc';
};
/* Phần chỉ ghi số La Mã (dùng trong bảng đáp án cuối đề): I → trắc nghiệm, II → đúng/sai, III → trả lời ngắn */
const bareSectType = (f) => {
  const m = f.match(/^(?:phan|part|section)\s+(iii|ii|i|3|2|1)\b[^a-z]*$/);
  return m ? ({ i: 'mc', 1: 'mc', ii: 'tf', 2: 'tf', iii: 'sa', 3: 'sa' })[m[1]] : null;
};
const TF_PAIR_RE = /([a-d])\s*[-:.)=]?\s*(dung|sai|d|s)(?![a-z])/g;
/* "a-Đ b-S c-Đ d-S" | "a) đúng b) sai …" | "ĐSĐS" | "Đúng Sai Đúng Sai" → [true,false,true,false] | null */
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

const parseLines = (lines) => {
  let sect = 'mc'; // dạng câu của phần đang đọc
  let keySect = 'mc'; // dạng câu của phần trong bảng đáp án cuối đề
  const tfKey = new Map();
  const saKey = new Map();
  const qs = [];
  const keyQueue = new Map(); // số câu → [chữ cái…]
  let cur = null;
  let lastNum = 0;
  let inKey = false;
  let pendingNums = null;
  let keyFound = false;

  const addKey = (n, L) => { if (!keyQueue.has(n)) keyQueue.set(n, []); keyQueue.get(n).push(L); keyFound = true; };

  /* ---- thêm 1 lựa chọn từ đoạn đã cắt ---- */
  const pushOpt = (seg) => {
    const m = seg.t.match(OPT_RE);
    if (!m) return;
    const body = sliceLine(seg, m[0].length);
    let text = body.t.trim();
    let star = /^[*✓✔]/.test(seg.t);
    if (/\*\s*$/.test(text)) { star = true; text = text.replace(/\s*\*+\s*$/, ''); }
    const letterAt = seg.t.search(/[A-Fa-f]/);
    const noSpace = body.t.replace(/\s/g, '').length;
    let markedCnt = 0;
    for (let i = 0; i < body.t.length; i++) if (body.m[i] === '1' && /\S/.test(body.t[i])) markedCnt++;
    const marked = (noSpace > 0 && markedCnt / noSpace >= 0.6) || (letterAt >= 0 && seg.m[letterAt] === '1');
    cur.opts.push({ t: text, marked, star });
    cur.mode = 'opts';
  };

  /* ---- "A. … B. … C. … D. …" nằm chung 1 dòng ---- */
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

  /* ---- nạp 1 dòng vào câu hiện tại ---- */
  const absorb = (raw) => {
    const ln = trimLine(raw);
    if (!ln.t || !cur) return;
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
    /* Khối code ``` : giữ nguyên, không đem đi so khớp "Câu", "A.", "Đáp án"… */
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

    /* Rác: số trang, đường kẻ */
    if (/^(?:trang|page)\s*\d+(?:\s*\/\s*\d+)?$/.test(f) || /^[-_=*.\s]{3,}$/.test(f)) continue;

    /* Bảng đáp án dạng ngang: "Câu 1 2 3 4" + "Đáp án A B C D" */
    if ((m = f.match(/^(?:cau|stt)\s+(\d{1,3}(?:\s+\d{1,3})+)$/))) {
      pendingNums = m[1].split(/\s+/).map(Number);
      continue;
    }
    if (pendingNums && (m = f.match(/^(?:dap an|da)\s+((?:[a-f]\s+)*[a-f])$/))) {
      const letters = m[1].split(/\s+/);
      if (letters.length === pendingNums.length) pendingNums.forEach((n, j) => addKey(n, letters[j].toUpperCase()));
      pendingNums = null;
      inKey = true; cur = null;
      continue;
    }
    pendingNums = null;

    /* Đang trong phần bảng đáp án */
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

    /* Câu đúng/sai và trả lời ngắn: dòng đáp án riêng */
    if (cur && cur.mode !== 'explain') {
      const mt = f.match(/^(?:dap an|da|answer|key)\s*(?:dung)?\s*[:\-.=]\s*(.+)$/);
      if (mt && (cur.type === 'tf' || cur.type === 'mc')) {
        const arr = readTf(mt[1]);
        if (arr && (cur.type === 'tf' || cur.opts.length === 4)) {
          cur.type = 'tf'; cur.tfAns = arr; cur.explicit = -2; cur.mode = 'skip';
          continue;
        }
      }
      const ms = f.match(new RegExp('^(?:dap an|da|answer|ket qua|kq)\\s*(?:dung)?\\s*[:\\-.=]\\s*' + SA_NUM));
      if (ms && (cur.type === 'sa' || (cur.type === 'mc' && cur.opts.length === 0))) {
        cur.type = 'sa'; cur.saAns = ms[1].replace(/[.,]+$/, ''); cur.explicit = -2; cur.mode = 'skip';
        continue;
      }
    }

    /* Dòng "Đáp án: B" của câu hiện tại */
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
      if ((m = f.match(EXPLAIN_RE)) && (cur.opts.length > 0 || cur.explicit !== null)) {
        cur.explain = ln.t.slice(f.length - (m[1] || '').length).trim();
        cur.mode = 'explain';
        continue;
      }
    }

    /* Mở đầu phần bảng đáp án (có tiêu đề hoặc cả dòng toàn "1.A 2.B …") */
    const head = f.match(KEY_HEAD_RE);
    if (head) {
      const rest = f.slice(head[0].length);
      const here = readKey(rest);
      const nextF = lines[i + 1] ? fold(trimLine(lines[i + 1]).t) : '';
      if (here.pairs.length >= 1 || readKey(nextF).pairs.length >= 2 || /^cau\s+\d/.test(nextF) || SECTION_RE.test(nextF)) {
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

    /* Tiêu đề phần: "PHẦN II" … */
    if (SECTION_RE.test(f)) { cur = null; sect = sectType(f); continue; }

    /* Bắt đầu câu mới */
    const qm = f.match(Q_RE);
    if (qm) {
      const n = Number(qm[1] ?? qm[2] ?? qm[3]);
      const keyword = qm[1] !== undefined;
      const sequential = n === lastNum + 1 || qs.length === 0 || (n === 1 && cur && cur.opts.length >= 2);
      if (keyword || sequential) {
        cur = { num: n, type: sect, stem: '', opts: [], explicit: null, explain: '', warns: [], mode: 'stem', nl: false };
        qs.push(cur);
        lastNum = n;
        absorb(sliceLine(ln, qm[0].length));
        continue;
      }
    }

    absorb(ln);
  }

  /* ---- Chốt kết quả ---- */
  let idSeq = 0;
  const questions = qs.map((c) => {
    /* Đáp án đúng/sai & trả lời ngắn lấy từ bảng đáp án cuối đề nếu dòng đáp án không có */
    if (c.type === 'tf' && !c.tfAns) { const a = tfKey.get(c.num)?.shift(); if (a) c.tfAns = a; }
    if (c.type === 'sa' && !c.saAns) { const a = saKey.get(c.num)?.shift(); if (a) c.saAns = a; }
    if (c.type === 'tf') {
      const statements = c.opts.map((o, i) => {
        let text = o.t;
        let answer = c.tfAns ? c.tfAns[i] ?? null : null;
        const tail = text.match(/\s*[-–:→(]+\s*(đúng|sai)\s*\)?\s*$/i);
        if (tail) { text = text.slice(0, tail.index).trim(); if (answer === null) answer = /đúng/i.test(tail[1]); }
        if (answer === null && o.star) answer = true;
        return { text, answer };
      });
      return {
        id: 'q' + (++idSeq), num: c.num, type: 'true_false', q: c.stem.trim(), statements, options: [], correct: -1,
        src: c.tfAns ? 'dòng đáp án' : '', explain: c.explain.trim(), warns: [...c.warns],
      };
    }
    if (c.type === 'sa') {
      return {
        id: 'q' + (++idSeq), num: c.num, type: 'short_answer', q: c.stem.trim(), answer: c.saAns || '', options: [], correct: -1,
        src: c.saAns ? 'dòng đáp án' : '', explain: c.explain.trim(), warns: [...c.warns],
      };
    }
    const options = c.opts.map((o) => o.t);
    let correct = -1;
    let src = '';
    if (c.explicit !== null && c.explicit >= 0 && c.explicit < options.length) { correct = c.explicit; src = 'dòng đáp án'; }
    if (correct < 0) {
      const stars = c.opts.map((o, i) => (o.star ? i : -1)).filter((i) => i >= 0);
      const marks = c.opts.map((o, i) => (o.marked ? i : -1)).filter((i) => i >= 0);
      if (stars.length === 1) { correct = stars[0]; src = 'dấu *'; }
      else if (marks.length === 1 && options.length >= 2) { correct = marks[0]; src = 'in đậm/gạch chân'; }
    }
    const warns = [...c.warns];
    if (/\[hình\]/.test(c.stem + options.join(' '))) warns.push('Câu có hình ảnh — hình chưa được nhập, hãy kiểm tra lại');
    return { id: 'q' + ++idSeq, num: c.num, q: c.stem.trim(), options, correct, src, explain: c.explain.trim(), warns };
  });

  /* Bảng đáp án cuối đề: không ghi đè đáp án đã có từ dòng "Đáp án:" */
  if (keyFound) {
    questions.forEach((q) => {
      const letter = keyQueue.get(q.num)?.shift();
      if (!letter || q.src === 'dòng đáp án') return;
      const idx = LETTERS.indexOf(letter);
      if (idx >= 0 && idx < q.options.length) { q.correct = idx; q.src = 'bảng đáp án'; }
    });
  }
  return { questions, keyFound };
};

/* ============================================================
   4. KIỂM TRA HỢP LỆ
   ============================================================ */
const NUM_RE = /^[+-]?(\d+([.,]\d+)?|[.,]\d+)$/;
const issuesOf = (it) => {
  const out = [];
  if (!it.q.trim()) out.push('Thiếu nội dung câu hỏi');
  if (it.type === 'true_false') {
    const st = it.statements || [];
    if (st.length !== 4) out.push(`Câu đúng/sai cần đúng 4 nhận định (đang có ${st.length})`);
    else if (st.some((x) => !x.text.trim())) out.push('Có nhận định bị trống');
    if (st.some((x) => x.answer !== true && x.answer !== false)) out.push('Có nhận định chưa chọn Đúng/Sai');
    return out;
  }
  if (it.type === 'short_answer') {
    if (!NUM_RE.test(String(it.answer || '').trim())) out.push('Đáp án trả lời ngắn phải là một số');
    return out;
  }
  if (it.options.length < 2) out.push(it.options.length ? 'Chỉ có 1 lựa chọn' : 'Không có lựa chọn (tự luận?)');
  else if (it.options.some((o) => !o.trim())) out.push('Có lựa chọn trống (hình/công thức?)');
  if (it.correct < 0 || it.correct >= it.options.length) out.push('Chưa có đáp án đúng');
  return out;
};

/* ============================================================
   5. GIAO DIỆN
   ============================================================ */
/* ============================================================
   NHẬP BẰNG JSON
   ============================================================ */
const JSON_SAMPLE = {
  title: 'Kiểm tra 15 phút — Este',
  duration: 15,
  questions: [
    {
      q: 'Chất nào sau đây là este?',
      options: ['$\\ce{CH3COOH}$', '$\\ce{CH3COOC2H5}$', '$\\ce{C2H5OH}$', '$\\ce{CH3CHO}$'],
      correct: 'B',
      explain: 'Este có nhóm -COO- liên kết với gốc hiđrocacbon, chỉ có $\\ce{CH3COOC2H5}$ thỏa mãn.',
      points: 0.5,
    },
    {
      q: 'Thủy phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH dư, khối lượng muối thu được là',
      options: ['8,2 gam', '4,1 gam', '6,8 gam', '9,6 gam'],
      correct: 'A',
      explain: '$n_{este} = 8{,}8/88 = 0{,}1$ mol → $n_{\\ce{CH3COONa}} = 0{,}1$ mol → $m = 0{,}1 \\times 82 = 8{,}2$ gam.',
    },
    {
      q: 'Số đồng phân este ứng với công thức phân tử $\\ce{C4H8O2}$ là',
      options: ['2', '3', '4', '5'],
      correct: 'C',
      explain: 'Gồm: HCOOCH2CH2CH3, HCOOCH(CH3)2, CH3COOC2H5, C2H5COOCH3.',
    },
    {
      type: 'true_false',
      q: 'Thủy phân este X ($\\ce{C4H8O2}$) trong dung dịch NaOH, thu được ancol Y và muối Z. Biết Y bị oxi hóa thành anđehit.',
      statements: [
        { text: 'X là este no, đơn chức, mạch hở.', answer: true },
        { text: 'Muối Z có thể là $\\ce{HCOONa}$.', answer: true },
        { text: 'Y có thể là ancol bậc hai.', answer: false },
        { text: 'X có đúng 4 đồng phân este.', answer: true },
      ],
      explain: 'a) Đúng. b) Đúng nếu X = HCOOC3H7. c) Sai: ancol bậc hai bị oxi hóa thành xeton. d) Đúng.',
      points: 1,
    },
    {
      type: 'short_answer',
      q: 'Xà phòng hóa hoàn toàn 17,8 gam tristearin bằng NaOH dư. Khối lượng muối thu được là bao nhiêu gam? (làm tròn đến hàng phần mười)',
      answer: '18,4',
      explain: '$n = 17{,}8/890 = 0{,}02$ mol → muối $\\ce{C17H35COONa}$ (306): $0{,}06 \\times 306 = 18{,}4$ gam.',
      points: 0.25,
    },
  ],
};
const JSON_SAMPLE_TEXT = JSON.stringify(JSON_SAMPLE, null, 2);

const JSON_SCHEMA_TEXT = `{
  "title": "Tên đề",
  "duration": 15,
  "questions": [
    {
      "q": "Nội dung câu hỏi",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
      "correct": "B",
      "explain": "Lời giải ngắn gọn",
      "points": 1
    }
  ]
}`;

const JSON_SCHEMA_CODE = `{
  "title": "Tên đề",
  "duration": 15,
  "questions": [
    {
      "q": "Nội dung câu hỏi",
      "code": "(tuỳ chọn) đoạn code, xuống dòng bằng \\n",
      "lang": "(tuỳ chọn) python | cpp | java | javascript ...",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
      "correct": "B",
      "explain": "Lời giải ngắn gọn",
      "points": 1
    }
  ]
}`;

/* Mức độ → tỉ lệ NB / TH / VD / VDC */
const PROMPT_LEVELS = {
  basic: { label: 'Cơ bản (ôn tập, kiểm tra 15 phút)', w: [50, 35, 15, 0] },
  standard: { label: 'Chuẩn (kiểm tra 1 tiết, giữa/cuối kì)', w: [30, 30, 30, 10] },
  adv: { label: 'Phân hóa (có nhiều câu vận dụng cao)', w: [15, 25, 35, 25] },
  thithu: { label: 'Thi thử tốt nghiệp THPT', w: [25, 30, 30, 15] },
};

const splitByWeights = (n, w) => {
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  const raw = w.map((x) => (n * x) / sum);
  const out = raw.map(Math.floor);
  let rem = n - out.reduce((a, b) => a + b, 0);
  raw.map((x, i) => ({ i, f: x - Math.floor(x) })).filter((o) => w[o.i] > 0).sort((a, b) => b.f - a.f)
    .forEach((o) => { if (rem > 0) { out[o.i] += 1; rem -= 1; } });
  return out;
};

const CHEM_BLOCK = [
  'QUY ƯỚC MÔN HÓA HỌC (bắt buộc):',
  '- Nguyên tử khối: H=1; C=12; N=14; O=16; Na=23; Mg=24; Al=27; P=31; S=32; Cl=35,5; K=39; Ca=40; Fe=56; Cu=64; Zn=65; Br=80; Ag=108; Ba=137.',
  '- Thể tích mol chất khí ở điều kiện chuẩn (25 °C, 1 bar) là 24,79 L/mol.',
  '- Phương trình hóa học phải cân bằng, ghi đúng điều kiện phản ứng; số liệu tính toán phải cho kết quả khớp CHÍNH XÁC một lựa chọn (làm tròn theo yêu cầu ghi trong đề).',
  '- Công thức, phương trình, ion viết bằng LaTeX trong $...$, dùng \\ce{...}. Ví dụ: $\\ce{CH3COOH + C2H5OH <=> CH3COOC2H5 + H2O}$, ion $\\ce{Fe^{3+}}$, nồng độ $C_M$.',
];

/* Chia 3 phần chuẩn thi tốt nghiệp THPT 2025: 28 câu = 18 trắc nghiệm + 4 đúng/sai + 6 trả lời ngắn */
const gdpt2025Split = (n) => {
  if (n === 28) return { p1: 18, p2: 4, p3: 6 };
  const p2 = Math.max(1, Math.round((n * 4) / 28));
  const p3 = Math.max(1, Math.round((n * 6) / 28));
  return { p1: Math.max(1, n - p2 - p3), p2, p3 };
};

const buildMasterPrompt = ({ subject, grade, topic, n, level, minutes, extra, structure = 'mcq', explain = true, withCode = false }) => {
  const sj = (subject || 'Hóa học').trim();
  const gr = String(grade || '12').replace(/^lớp\s*/i, '');
  const num = Math.min(60, Math.max(4, Number(n) || 20));
  const lv = PROMPT_LEVELS[level] || PROMPT_LEVELS.standard;
  const isChem = /hóa|hoa|chem/i.test(sj);
  const adv = level === 'adv';
  const mins = Number(minutes) > 0 ? Number(minutes) : Math.max(15, num * 2);
  const topicLine = (topic || '').trim() || '[ĐIỀN CHỦ ĐỀ / BÀI HỌC]';
  const vn = (x) => String(x).replace('.', ',');
  const lvLines = (cnt, w) => {
    const [nb, th, vd, vdc] = splitByWeights(cnt, w);
    return [nb && `${nb} Nhận biết`, th && `${th} Thông hiểu`, vd && `${vd} Vận dụng`, vdc && `${vdc} Vận dụng cao`].filter(Boolean).join(', ');
  };

  const gdpt = structure === 'gdpt2025';
  let structBlock;
  let schema;
  let pointsRule;
  if (gdpt) {
    const { p1, p2, p3 } = gdpt2025Split(num);
    const unit = 10 / (p1 + p2 * 4 + p3);
    const ptMc = Math.round(unit * 100) / 100;
    const ptTf = Math.round(unit * 4 * 100) / 100;
    structBlock = [
      `- Số câu: ${num} câu theo cấu trúc đề thi tốt nghiệp THPT 2025, thời gian ${mins} phút, tổng 10 điểm:`,
      `  • PHẦN I — ${p1} câu trắc nghiệm nhiều lựa chọn (4 phương án, 1 đáp án đúng), mỗi câu ${vn(ptMc)} điểm. Phân bổ: ${lvLines(p1, adv ? [20, 30, 35, 15] : [40, 35, 25, 0])}.`,
      `  • PHẦN II — ${p2} câu đúng/sai: mỗi câu có 1 đoạn dẫn (tình huống, thí nghiệm, số liệu) và ĐÚNG 4 nhận định a, b, c, d; học sinh xác định từng nhận định đúng hay sai; mỗi câu ${vn(ptTf)} điểm. Phân bổ: ${lvLines(p2, adv ? [0, 0, 50, 50] : [0, 25, 50, 25])}.`,
      `  • PHẦN III — ${p3} câu trả lời ngắn: đáp án là MỘT SỐ (tối đa 4 ký tự, dấu phẩy thập phân), mỗi câu ${vn(ptMc)} điểm. Phân bổ: ${lvLines(p3, adv ? [0, 0, 40, 60] : [0, 15, 50, 35])}.`,
      '- Xuất các câu theo đúng thứ tự Phần I → II → III; trong mỗi phần sắp xếp từ dễ đến khó.',
    ].join('\n');
    pointsRule = `Điểm: câu trắc nghiệm và trả lời ngắn ${vn(ptMc)}, câu đúng/sai ${vn(ptTf)} (tổng đúng 10 điểm).`;
    schema = `{
  "title": "Tên đề",
  "duration": ${mins},
  "questions": [
    {
      "type": "multiple_choice",
      "level": "Nhận biết",
      "topic": "Dạng bài cụ thể",
      "q": "Nội dung câu hỏi",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
      "correct": "B",
      "explain": "Lời giải ngắn gọn",
      "points": ${ptMc}
    },
    {
      "type": "true_false",
      "level": "Vận dụng",
      "topic": "Dạng bài cụ thể",
      "q": "Đoạn dẫn / tình huống / số liệu dùng chung cho 4 nhận định",
      "statements": [
        { "text": "Nhận định a", "answer": true },
        { "text": "Nhận định b", "answer": false },
        { "text": "Nhận định c", "answer": true },
        { "text": "Nhận định d", "answer": false }
      ],
      "explain": "Giải thích lần lượt từng ý a, b, c, d",
      "points": ${ptTf}
    },
    {
      "type": "short_answer",
      "level": "Vận dụng cao",
      "topic": "Dạng bài cụ thể",
      "q": "Nội dung câu hỏi, ghi rõ yêu cầu làm tròn và đơn vị cần tính",
      "answer": "12,5",
      "explain": "Lời giải ngắn gọn có phép tính",
      "points": ${ptMc}
    }
  ]
}`;
  } else {
    const [nb, th, vd, vdc] = splitByWeights(num, lv.w);
    const levelLine = [nb && `${nb} câu Nhận biết`, th && `${th} câu Thông hiểu`, vd && `${vd} câu Vận dụng`, vdc && `${vdc} câu Vận dụng cao`].filter(Boolean).join(' · ');
    structBlock = [
      `- Số câu: ${num} câu trắc nghiệm 4 lựa chọn, chỉ 1 đáp án đúng · Thời gian: ${mins} phút`,
      `- Mức độ: ${lv.label}. Phân bổ: ${levelLine}. Sắp xếp từ dễ đến khó.`,
    ].join('\n');
    pointsRule = `Điểm: mỗi câu ${vn(Math.round((10 / num) * 100) / 100)} (tổng 10 điểm).`;
    schema = withCode ? JSON_SCHEMA_CODE : JSON_SCHEMA_TEXT;
  }

  const rules = [
    `Đúng chương trình lớp ${gr} (GDPT 2018); không ra kiến thức ngoài chương trình, không ra câu cần nhìn hình vẽ (nếu cần số liệu thì cho bằng chữ hoặc bảng văn bản).`,
    'Mỗi câu chỉ kiểm tra MỘT ý chính; câu hỏi rõ ràng, không đánh đố bằng câu chữ, tránh phủ định kép. Câu Vận dụng / Vận dụng cao nên đặt trong bối cảnh thực tiễn hoặc thí nghiệm cụ thể.',
    'Ba đáp án sai của câu trắc nghiệm phải là sai lầm thật của học sinh (nhầm công thức, quên đổi đơn vị, nhầm tỉ lệ mol, nhầm khái niệm); bốn phương án cùng dạng, độ dài tương đương. TUYỆT ĐỐI không dùng "Cả A và B", "Tất cả đều đúng", "Không có đáp án nào đúng".',
    `Vị trí đáp án đúng của câu trắc nghiệm phân bố đều A/B/C/D, không theo quy luật.`,
    ...(gdpt ? [
      'Câu đúng/sai: 4 nhận định độc lập (không suy ra lẫn nhau), xếp từ dễ đến khó, có cả nhận định đúng lẫn sai; không dùng từ tuyệt đối gợi ý như "luôn", "chỉ", "không bao giờ" một cách máy móc.',
      'Câu trả lời ngắn: kết quả là MỘT số duy nhất, làm tròn theo yêu cầu ghi rõ trong đề; "answer" chỉ chứa số (vd "12,5"), không kèm đơn vị hay chữ.',
    ] : []),
    'Các câu không trùng ý, không trùng dạng; phủ đều chủ đề.',
    'TỰ KIỂM TRA: trước khi xuất, giải lại TỪNG câu từ đầu và đối chiếu với đáp án. Chỉ xuất câu bạn chắc chắn đúng; nếu số liệu không khớp thì sửa đề cho đến khi khớp. Rà lại lần cuối: đúng số câu, đúng cấu trúc, đúng tổng điểm.',
    explain ? '"explain": lời giải 1–3 câu nêu cách làm hoặc lý do loại các đáp án nhiễu (câu đúng/sai giải thích từng ý).' : 'Có thể bỏ trường "explain".',
  ].map((t, i) => `${i + 1}. ${t}`);

  return [
    '# VAI TRÒ',
    `Bạn là giáo viên ${sj} THPT nhiều năm kinh nghiệm, từng ra đề kiểm tra và đề thi tốt nghiệp THPT, nắm chắc chương trình GDPT 2018.`,
    '',
    '# YÊU CẦU ĐỀ',
    `- Môn: ${sj} · Lớp: ${gr} · Chủ đề: ${topicLine}`,
    structBlock,
    extra && extra.trim() ? `- Yêu cầu thêm của giáo viên: ${extra.trim()}` : null,
    '- Nếu tôi đính kèm tài liệu / ảnh / nội dung bài học: chỉ ra câu hỏi trong phạm vi tài liệu đó, bám sát số liệu và thuật ngữ trong tài liệu.',
    `- ${pointsRule}`,
    '',
    '# NGUYÊN TẮC RA ĐỀ',
    ...rules,
    '',
    ...(isChem ? [...CHEM_BLOCK, ''] : ['QUY ƯỚC CÔNG THỨC: công thức, ký hiệu toán/lý viết bằng LaTeX trong $...$.', '']),
    '# ĐỊNH DẠNG ĐẦU RA',
    'CHỈ trả về MỘT khối JSON hợp lệ đặt trong khối code ```json, không viết lời dẫn hay kết luận, theo đúng cấu trúc:',
    schema,
    '',
    '# QUY TẮC JSON',
    '- Dùng dấu nháy kép " cho mọi khóa và chuỗi; không có dấu phẩy thừa ở cuối; "answer" của nhận định đúng/sai là true hoặc false (không có nháy).',
    '- Xuống dòng trong chuỗi viết là \\n; dấu " bên trong chuỗi viết là \\".',
    '- Mọi dấu gạch chéo ngược của LaTeX phải viết GẤP ĐÔI trong JSON, ví dụ \\\\ce{H2O}, \\\\frac{a}{b}.',
    '- "correct" của câu trắc nghiệm là chữ cái A, B, C hoặc D. Không ghi sẵn "A.", "B." ở đầu các lựa chọn hay "a)", "b)" ở đầu nhận định.',
    '- Nếu bị giới hạn độ dài, hãy dừng ở câu hoàn chỉnh cuối cùng và đóng đủ dấu ] và }; tôi sẽ nhắn "tiếp tục" để bạn xuất phần còn lại.',
  ].filter((x) => x !== undefined && x !== null).join('\n').replace(/\n{3,}/g, '\n\n');
};

/* Giữ tên cũ cho chỗ khác còn gọi */
const buildJsonGuidePrompt = ({ subject, grade }) => buildMasterPrompt({ subject, grade, topic: '', n: 28, level: 'standard', minutes: 50, structure: 'gdpt2025' });

/* Chuyển file đề có sẵn (Word/PDF) → JSON, dùng cho mọi môn */
const buildConvertGeneralPrompt = ({ subject } = {}) => [
  `Tôi đính kèm một file đề thi môn ${subject || 'Hóa học'} (Word/PDF). Hãy chuyển TOÀN BỘ đề thành JSON để nhập vào phần mềm: giữ đúng thứ tự câu, không bỏ sót, không tự ý sửa nội dung câu hỏi.`,
  '',
  'CẤU TRÚC:',
  JSON_SCHEMA_TEXT,
  '',
  'QUY TẮC:',
  '- Mỗi câu là MỘT phần tử trong "questions"; không gộp nhiều câu vào một.',
  '- "options" chỉ chứa nội dung, không kèm "A.", "B.". Đề có hơn 4 lựa chọn thì giữ nguyên số lựa chọn.',
  '- Đáp án đúng: lấy theo chữ cái được in đậm / tô màu / gạch chân hoặc bảng đáp án cuối đề. Nếu file không đánh dấu thì tự giải và điền, đồng thời ghi "(AI tự giải)" ở đầu "explain" để tôi kiểm tra lại.',
  '- Công thức, phương trình viết bằng LaTeX trong $...$ (hóa học dùng \\ce{...}); trong JSON mọi dấu \\ phải viết gấp đôi: \\\\ce{H2O}.',
  '- Câu có hình vẽ / bảng số liệu: mô tả ngắn bằng chữ trong "q" và thêm "[CÓ HÌNH]" ở cuối để tôi bổ sung.',
  '- Ghi chú, lời giải của giáo viên trong file KHÔNG đưa vào "options" — đưa vào "explain".',
  '- JSON hợp lệ: nháy kép, không dấu phẩy thừa, xuống dòng trong chuỗi viết là \\n. CHỈ trả về một khối JSON, không lời dẫn.',
].join('\n');

const TEXT_SAMPLE = `Câu 1. Chất nào sau đây là este?
A. CH3COOH
B. CH3COOC2H5
C. C2H5OH
D. CH3CHO
Đáp án: B
Giải thích: Este có nhóm -COO- liên kết với gốc hiđrocacbon.

Câu 2. Thủy phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH dư, khối lượng muối thu được là
A. 8,2 gam
B. 4,1 gam
C. 6,8 gam
D. 9,6 gam
Đáp án: A

Câu 3. Số đồng phân este ứng với công thức C4H8O2 là
A. 2
B. 3
C. 4
D. 5
Đáp án: C

PHẦN II. Câu trắc nghiệm đúng sai
Câu 1. Cho các phát biểu về este:
a) Este no, đơn chức có công thức chung CnH2nO2.
b) Este tan tốt trong nước.
c) Phản ứng xà phòng hóa là phản ứng thuận nghịch.
d) Etyl axetat có mùi thơm.
Đáp án: a-Đ, b-S, c-S, d-Đ

PHẦN III. Câu trắc nghiệm trả lời ngắn
Câu 1. Đốt cháy hoàn toàn 0,1 mol este no, đơn chức thu được bao nhiêu gam CO2 (làm tròn 1 chữ số thập phân)?
Đáp án: 8,8`;

/* ---------- ĐỀ TIẾNG ANH: bài đọc / đoạn văn dùng chung nhiều câu ---------- */
const JSON_SAMPLE_EN = {
  title: 'TEST 6 – Cities of the future',
  duration: 50,
  questions: [
    {
      instruction: 'Read the following passage and mark the letter A, B, C, or D to indicate the option that best fits each of the numbered blanks.',
      passage: 'Are you ready to discover the future (1)_____ urban life? The EcoSmart Scooter 3000 is the ideal choice for people who want comfort and style. It (2)_____ modern, feels light, and is simple to use.\n(Adapted from https://www.robertdyas.co.uk)',
      q: 'Chọn đáp án phù hợp cho chỗ trống (1) trong đoạn văn.',
      options: ['of', 'in', 'on', 'by'],
      correct: 'A',
      explain: 'the future of + danh từ.',
    },
    {
      instruction: 'Read the following passage and mark the letter A, B, C, or D to indicate the option that best fits each of the numbered blanks.',
      passage: 'Are you ready to discover the future (1)_____ urban life? The EcoSmart Scooter 3000 is the ideal choice for people who want comfort and style. It (2)_____ modern, feels light, and is simple to use.\n(Adapted from https://www.robertdyas.co.uk)',
      q: 'Chọn đáp án phù hợp cho chỗ trống (2) trong đoạn văn.',
      options: ['looks', 'is looking', 'look', 'looking'],
      correct: 'A',
      explain: 'look + tính từ.',
    },
    {
      q: 'Sắp xếp các câu sau thành một đoạn hội thoại có nghĩa:\na. Tom: I think they will have smart buildings.\nb. Anna: What do you think cities will look like in the future?\nc. Anna: That sounds exciting!',
      options: ['a – b – c', 'a – c – b', 'b – c – a', 'b – a – c'],
      correct: 'D',
    },
    {
      q: 'In the future, advanced technology will help residents ________ with the effects of climate change.',
      options: ['cope', 'pay', 'make', 'take'],
      correct: 'A',
      explain: 'cope with: đối phó với.',
    },
  ],
};
const JSON_SAMPLE_EN_TEXT = JSON.stringify(JSON_SAMPLE_EN, null, 2);

const JSON_SCHEMA_EN = `{
  "title": "Tên đề",
  "duration": 50,
  "questions": [
    {
      "instruction": "(tuỳ chọn) dòng hướng dẫn, VD: Read the following passage and mark the letter A, B, C or D...",
      "passage": "(tuỳ chọn) bài đọc / đoạn văn dùng chung — lặp lại y hệt ở MỌI câu thuộc bài đó; xuống dòng bằng \\n",
      "q": "Nội dung câu hỏi (với câu sắp xếp: chép các câu a., b., c. vào đây, mỗi câu một dòng \\n)",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
      "correct": "B",
      "explain": "Giải thích ngắn (tiếng Việt)"
    }
  ]
}`;

const buildEnglishPrompt = ({ grade }) => [
  `Bạn là giáo viên tiếng Anh giàu kinh nghiệm. Hãy soạn đề trắc nghiệm tiếng Anh dành cho học sinh ${grade || '[LỚP]'}, chủ đề: [CHỦ ĐỀ], thời gian [SỐ] phút, theo cấu trúc: [VD: 2 bài điền chỗ trống (6 câu/bài) + 5 câu sắp xếp + 15 câu ngữ pháp/từ vựng + 1 bài đọc hiểu 8 câu].`,
  '',
  'CHỈ TRẢ VỀ MỘT KHỐI JSON HỢP LỆ, không viết lời dẫn hay kết luận, theo đúng cấu trúc:',
  JSON_SCHEMA_EN,
  '',
  'Quy tắc:',
  '- Mỗi câu trắc nghiệm có 4 lựa chọn, chỉ 1 đáp án đúng; đáp án sai phải hợp lý; vị trí đáp án đúng phân bố đều.',
  '- Bài đọc / đoạn văn điền chỗ trống: viết NGUYÊN VĂN vào "passage" của MỌI câu thuộc bài đó (lặp lại y hệt). Chỗ trống đánh số dạng (1)_____ ; mỗi chỗ trống là một câu có q: "Chọn đáp án phù hợp cho chỗ trống (1) trong đoạn văn." Câu không dùng bài đọc thì bỏ trường "passage".',
  '- Câu sắp xếp: chép các câu a., b., c.… vào "q" (mỗi câu một dòng \\n); "options" là các thứ tự, VD "b – a – c".',
  '- "options" chỉ chứa nội dung, không ghi sẵn "A.", "B.". "correct" là chữ cái A, B, C hoặc D.',
  '- Các câu theo đúng thứ tự trong đề; JSON hợp lệ: nháy kép, không dấu phẩy thừa, xuống dòng trong chuỗi viết là \\n.',
].join('\n');

const buildConvertPrompt = () => [
  'Tôi đính kèm một file đề thi (Word/PDF). Hãy chuyển TOÀN BỘ đề thành JSON để nhập vào phần mềm, giữ đúng thứ tự câu, không bỏ sót câu nào.',
  '',
  'CẤU TRÚC:',
  JSON_SCHEMA_EN,
  '',
  'QUY TẮC:',
  '- Mỗi câu hỏi là MỘT phần tử trong "questions"; không gộp nhiều câu vào một.',
  '- Bài đọc / đoạn văn điền chỗ trống: chép NGUYÊN VĂN vào "passage" của MỌI câu thuộc bài đó (lặp lại y hệt, giữ nguyên chỗ trống như (1)_____ và dòng (Adapted from …)). Câu không có bài đọc thì bỏ "passage".',
  '- Dòng hướng dẫn ("Read the following passage…", "Mark the letter A, B, C or D…") đặt vào "instruction" của các câu thuộc phần đó.',
  '- Câu điền chỗ trống: "q" ghi "Chọn đáp án phù hợp cho chỗ trống (n) trong đoạn văn."',
  '- Câu sắp xếp: chép các câu a., b., c.… vào "q" (mỗi câu một dòng \\n); "options" là các thứ tự như "b – a – c". Nếu có thư/đoạn mở đầu thì để ở đầu "q".',
  '- "options" chỉ chứa nội dung, không kèm "A.", "B.".',
  '- Đáp án đúng: lấy theo chữ cái được tô vàng / in đỏ / có đáp án cuối đề; nếu file không đánh dấu thì tự giải và điền.',
  '- Ghi chú của giáo viên trong file (dẫn chứng, nghĩa tiếng Việt, dấu "=", giải thích) KHÔNG đưa vào "options" — đưa vào "explain".',
  '- JSON hợp lệ: nháy kép, không dấu phẩy thừa, xuống dòng trong chuỗi viết là \\n. CHỈ trả về một khối JSON, không lời dẫn.',
].join('\n');

/* Sửa các lỗi JSON hay gặp khi copy từ chat: xuống dòng thật trong chuỗi, dấu phẩy thừa, nháy cong */
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

/* → null (không phải JSON) | { value } | { error } */
const extractJson = (raw) => {
  const t = raw.trim();
  if (!t) return null;
  const cands = [];
  const fence = !/^[[{]/.test(t) ? t.match(/```(?:json|JSON)?[ \t]*\n([\s\S]*?)```/) : null;
  if (fence) cands.push(fence[1]);
  cands.push(t);
  let firstErr = '';
  for (const c of cands) {
    const sl = sliceBrackets(c);
    if (!sl) continue;
    if (typeof sl === 'object') { firstErr = firstErr || `JSON chưa đầy đủ — thiếu dấu đóng "${sl.incomplete}" (AI có thể bị cắt giữa chừng).`; continue; }
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

/* JSON → { meta, questions } (chấp nhận nhiều tên khoá: q/question/cauhoi…, correct/answer/dapan…) */
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

  /* Cho phép lồng nhóm: { passage, instruction, questions: [ … ] } — câu con thừa hưởng bài đọc của nhóm */
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
    const code = pickK(o, ['code', 'snippet', 'source', 'codeblock']);
    const lang = String(pickK(o, ['lang', 'language', 'ngonngu']) ?? '').toLowerCase().replace(/[^a-z+#]/g, '');
    if (code) q += (q ? '\n' : '') + '```' + lang + '\n' + String(code).replace(/\s+$/, '') + '\n```';

    /* lựa chọn */
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

    /* đáp án đúng */
    let correct = -1;
    let numeric = false;
    const idxK = pickK(o, ['correctindex', 'answerindex']);
    let c = pickK(o, ['correct', 'correctanswer', 'answer', 'dapan', 'dapandung', 'correctoption', 'right', 'key']);
    if (flagged >= 0) correct = flagged;
    else if (idxK !== undefined && Number.isInteger(Number(idxK))) correct = Number(idxK);
    else if (c !== undefined) {
      if (Array.isArray(c)) { if (c.length > 1) warns.push('Có nhiều đáp án — chỉ lấy đáp án đầu tiên'); c = c[0]; }
      if (typeof c === 'number') { correct = c; numeric = true; }
      else {
        const t = String(c).trim();
        const m = t.match(/^\(?([A-Fa-f])\)?(?:[.):]|$)/);
        if (m) correct = LETTERS.indexOf(m[1].toUpperCase());
        else if (/^\d+$/.test(t)) { correct = Number(t); numeric = true; }
        else correct = options.findIndex((op) => fold(op) === fold(t));
      }
    }
    if (numeric && correct === options.length && correct > 0) correct -= 1; // AI hay đánh số từ 1
    if (correct < 0 || correct >= options.length) correct = -1;

    /* Ghi chú giáo viên lọt vào lựa chọn (dẫn chứng, "= nghĩa tiếng Việt") */
    const VI = /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i;
    if (options.some((t) => fold(t).includes('dan chung') || (/\s=\s/.test(t) && VI.test(t.split('=').slice(1).join('=')))))
      warns.push('Lựa chọn có kèm ghi chú (dẫn chứng / nghĩa tiếng Việt) — nên xoá khỏi đáp án');

    /* Dạng câu: trắc nghiệm | đúng/sai | trả lời ngắn */
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
          return { text: String(pickK(xo, ['text', 'content', 'statement', 'noidung', 'nhandinh', 'claim']) ?? '').replace(/^\s*[a-dA-D][.)]\s+/, '').trim(), answer: toB(pickK(xo, ['answer', 'correct', 'dung', 'dapan', 'value', 'isTrue'.toLowerCase()])) };
        }
        return { text: String(x), answer: null };
      });
    }
    let answer = '';
    if (type === 'short_answer') {
      const av = pickK(o, ['answer', 'dapan', 'correct', 'correctanswer', 'key', 'result', 'ketqua']);
      answer = String(Array.isArray(av) ? av[0] : av ?? '').trim().replace(/\s/g, '');
      if (answer.replace(/[^0-9,.\-]/g, '').length > 4) warns.push('Đáp án dài hơn 4 ký tự (đề thi chuẩn chỉ cho tối đa 4 ký tự)');
    }

    const pts = Number(pickK(o, ['points', 'score', 'diem']));
    const topicV = String(pickK(o, ['topic', 'chude', 'dangbai']) ?? '').trim();
    const levelV = String(pickK(o, ['level', 'mucdo', 'bloom']) ?? '').trim();
    return {
      id: 'j' + (i + 1), num: i + 1, type, statements, answer, topic: topicV, level: levelV,
      q, options, correct, src: 'JSON',
      passage: asText(ctx.passage), instruction: asText(ctx.instruction),
      explain: String(pickK(o, ['explain', 'explanation', 'giaithich', 'loigiai', 'solution', 'reason']) ?? '').trim(),
      warns, points: pts > 0 ? pts : undefined,
    };
  });
  if (!questions.some((x) => x.q)) return null;
  /* Các câu liền nhau có cùng bài đọc → cùng một nhóm (pg) */
  let pgN = 0;
  let prevP = null;
  questions.forEach((x) => {
    if (!x.passage) { prevP = null; x.pg = null; return; }
    if (x.passage !== prevP) { pgN++; prevP = x.passage; }
    x.pg = 'pg' + pgN;
  });
  return { meta, questions };
};

/* ---------- Chế độ SINH ĐỀ TỪ CODE ---------- */
const LANGS = ['Python', 'C++', 'C', 'Java', 'JavaScript', 'C#', 'PHP', 'Pascal', 'HTML/CSS', 'SQL', 'Khác'];
const FENCE_LANG = { Python: 'python', 'C++': 'cpp', C: 'c', Java: 'java', JavaScript: 'javascript', 'C#': 'csharp', PHP: 'php', Pascal: 'pascal', 'HTML/CSS': 'html', SQL: 'sql' };
const EXT_LANG = { py: 'Python', cpp: 'C++', cc: 'C++', c: 'C', java: 'Java', js: 'JavaScript', ts: 'JavaScript', cs: 'C#', php: 'PHP', pas: 'Pascal', html: 'HTML/CSS', css: 'HTML/CSS', sql: 'SQL' };
const LEVELS = ['Dễ', 'Trung bình', 'Khó', 'Hỗn hợp (dễ → khó)'];
const KINDS = [
  { id: 'output', label: 'Dự đoán kết quả', desc: 'Dự đoán kết quả (output / giá trị biến) khi chạy một đoạn code, có thể là code mới hoặc biến thể của code gốc' },
  { id: 'bug', label: 'Tìm lỗi', desc: 'Tìm lỗi cú pháp hoặc lỗi logic trong đoạn code cho sẵn và chọn cách sửa đúng' },
  { id: 'fill', label: 'Điền chỗ trống', desc: 'Điền vào chỗ trống (____) để đoạn code chạy đúng yêu cầu' },
  { id: 'concept', label: 'Khái niệm & cú pháp', desc: 'Hiểu khái niệm, cú pháp, từ khoá, kiểu dữ liệu xuất hiện trong code' },
  { id: 'trace', label: 'Theo dõi vòng lặp', desc: 'Theo dõi giá trị biến / số lần lặp / luồng điều kiện qua từng bước' },
  { id: 'improve', label: 'Cải tiến code', desc: 'Chọn cách viết lại hoặc tối ưu code tốt nhất (ngắn gọn, đúng, hiệu quả hơn)' },
];

const guessLang = (text, name = '') => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (EXT_LANG[ext]) return EXT_LANG[ext];
  const t = text;
  if (/<\?php/.test(t)) return 'PHP';
  if (/^\s*#include\s*[<"]/m.test(t) || /\bstd::|cout\s*<<|cin\s*>>|using namespace/.test(t)) {
    return /\b(?:printf|scanf)\s*\(/.test(t) && !/cout|cin|std::/.test(t) ? 'C' : 'C++';
  }
  if (/\bpublic\s+static\s+void\s+main|System\.out\.print|\bimport\s+java\./.test(t)) return 'Java';
  if (/\busing\s+System\b|Console\.Write/.test(t)) return 'C#';
  if (/\bbegin\b[\s\S]*\bend[.;]/i.test(t) && /\b(?:writeln|readln|program)\b/i.test(t)) return 'Pascal';
  if (/\bSELECT\b[\s\S]*\bFROM\b|\bINSERT\s+INTO\b|\bCREATE\s+TABLE\b/i.test(t)) return 'SQL';
  if (/<\/?(?:html|div|body|head|span|ul|li|h\d)\b/i.test(t)) return 'HTML/CSS';
  if (/^\s*(?:def\s+\w+\(|from\s+\w+\s+import|elif\b|print\s*\()/m.test(t) && !/[;{}]\s*$/m.test(t)) return 'Python';
  if (/\b(?:console\.log|document\.)|=>|\b(?:const|let)\s+\w+\s*=|function\s+\w+\s*\(/.test(t)) return 'JavaScript';
  if (/\bint\s+main\s*\(|\b(?:printf|scanf)\s*\(/.test(t)) return 'C';
  if (/^\s*(?:import\s+\w+|\w+\s*=\s*input\()/m.test(t)) return 'Python';
  return 'Khác';
};

const KW_START = /^\s*(?:def|class|import|from|return|if|elif|else|for|while|do|function|const|let|var|public|private|protected|static|void|int|float|double|char|bool|string|using|namespace|try|catch|switch|case|print|printf|scanf|cout|cin|writeln|readln|begin|end|program|uses|SELECT|INSERT|UPDATE|DELETE|CREATE|#include|#define)\b/;
const CODE_OPS = /(?:==|!=|<=|>=|=>|->|\+\+|--|&&|\|\||:=|::)/;
const isCodeLine = (l) =>
  /[;{}]\s*$/.test(l) || KW_START.test(l) || CODE_OPS.test(l) ||
  /^\s*(?:\/\/|\/\*|\*\/|#\s)/.test(l) ||
  (/^( {2,}|\t)\S/.test(l) && /[()=[\]{};:]/.test(l)) ||
  /^\s*[A-Za-z_]\w*\s*\(.*\)\s*:?\s*$/.test(l);

/* Văn bản "giống code" và KHÔNG giống một đề thi */
const looksLikeCode = (text) => {
  const ls = text.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim());
  if (ls.length < 3) return false;
  if (/(?:^|\n)\s*(?:cau|question)\s*\d+/.test(fold(text))) return false;
  return ls.filter(isCodeLine).length / ls.length >= 0.35;
};

const buildPrompt = ({ code, lang, n, level, kinds, extra, subject, grade, format = 'json' }) => {
  const fl = FENCE_LANG[lang] || '';
  let fence = '```';
  while (code.includes(fence)) fence += '`';
  const L = lang === 'Khác' ? 'lập trình' : lang;
  const kindText = kinds.length
    ? kinds.map((k) => '- ' + KINDS.find((x) => x.id === k).desc).join('\n')
    : '- Kết hợp nhiều dạng câu hỏi phù hợp với đoạn code';
  const textOut = [
    'ĐỊNH DẠNG ĐẦU RA (bắt buộc, để phần mềm đọc tự động):',
    '- Không viết lời dẫn hay kết luận, không dùng bảng, không in đậm (**), không tự đánh số lại.',
    '- Mỗi câu theo đúng mẫu sau, các câu cách nhau 1 dòng trống:',
    '',
    'Câu 1. <nội dung câu hỏi>',
    '```' + (fl || 'ngôn-ngữ'),
    '<code nếu câu có code, nếu không thì bỏ cả khối này>',
    '```',
    'A. <lựa chọn>',
    'B. <lựa chọn>',
    'C. <lựa chọn>',
    'D. <lựa chọn>',
    'Đáp án: <một chữ cái A, B, C hoặc D>',
    'Giải thích: <1–3 câu>',
    '',
    '- Chỉ dùng khối ``` cho đoạn code bên trong câu hỏi; KHÔNG bọc toàn bộ câu trả lời trong một khối code.',
  ];
  const jsonOut = [
    'ĐỊNH DẠNG ĐẦU RA (bắt buộc, để phần mềm đọc tự động):',
    '- CHỈ trả về MỘT khối JSON hợp lệ, không viết lời dẫn hay kết luận, có đúng ' + n + ' câu, theo cấu trúc:',
    JSON_SCHEMA_TEXT,
    '',
    'Quy tắc JSON:',
    ...JSON_RULES,
  ];
  return [
    `Bạn là giáo viên ${subject || 'Tin học'} giàu kinh nghiệm${grade ? `, đang soạn đề kiểm tra cho học sinh ${grade}` : ''}. Dựa trên đoạn code ${L} ở cuối tin nhắn này, hãy soạn đúng ${n} câu hỏi trắc nghiệm, mỗi câu có 4 lựa chọn A, B, C, D và chỉ có 1 đáp án đúng. Mức độ: ${level}.`,
    '',
    'DẠNG CÂU HỎI CẦN CÓ (phân bổ đều giữa các dạng):',
    kindText,
    '',
    'YÊU CẦU VỀ CODE:',
    `- Bạn được viết thêm đoạn code mới hoặc biến thể ngắn của code gốc (đổi vài dòng, đổi dữ liệu đầu vào) để đặt câu hỏi. Mọi đoạn code trong câu hỏi phải đúng cú pháp ${L}, giữ nguyên thụt lề.`,
    format === 'json'
      ? '- Đoạn code của mỗi câu đặt trong trường "code" (xuống dòng bằng \\n, giữ nguyên thụt lề) và ghi tên ngôn ngữ vào trường "lang".'
      : '- Mỗi đoạn code đặt trong khối ``` có ghi tên ngôn ngữ, nằm ngay dưới dòng "Câu N." và trước các lựa chọn.',
    '- Trước khi chốt đáp án, hãy tự chạy thử từng bước để chắc chắn đáp án đúng 100%.',
    '',
    'QUY TẮC:',
    '- Chỉ 1 đáp án đúng; 3 phương án nhiễu phải hợp lý (là lỗi học sinh hay mắc), không lộ liễu.',
    '- Vị trí đáp án đúng phân bố đều giữa A, B, C, D; các câu không trùng ý nhau.',
    '- Viết bằng tiếng Việt, giữ nguyên từ khoá và thuật ngữ lập trình bằng tiếng Anh.',
    extra.trim() ? `- Yêu cầu thêm: ${extra.trim()}` : null,
    '',
    ...(format === 'json' ? jsonOut : textOut),
    '',
    `ĐOẠN CODE GỐC (${L}):`,
    fence + fl,
    code.replace(/\s+$/, ''),
    fence,
  ].filter((x) => x !== null).join('\n');
};

const EI_CSS = `
.ei-root .ei-opt{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;width:100%!important;margin:0!important;padding:0!important;background:none!important;border:0!important;}
.ei-root .ei-opt>*{margin:0!important;}
.ei-root .ei-opt input[type=radio]{order:0!important;appearance:auto!important;-webkit-appearance:radio!important;width:16px!important;height:16px!important;min-width:16px!important;max-width:16px!important;flex:none!important;padding:0!important;border-radius:50%!important;background:none!important;box-shadow:none!important;position:static!important;cursor:pointer!important;accent-color:var(--acc,#0071e3);}
.ei-root .ei-opt input[type=radio]::before,.ei-root .ei-opt input[type=radio]::after{content:none!important;display:none!important;}
.ei-root .ei-opt b{order:1!important;width:18px!important;flex:none!important;text-align:center!important;}
.ei-root .ei-opt input:not([type=radio]),.ei-root .ei-opt textarea{order:2!important;flex:1 1 auto!important;min-width:0!important;width:auto!important;height:auto!important;min-height:34px!important;padding:.4rem .65rem!important;box-sizing:border-box!important;opacity:1!important;visibility:visible!important;color:var(--ink,#1d1d1f)!important;background:var(--bg,#fff)!important;border:1px solid var(--edge,rgba(0,0,0,.18))!important;border-radius:10px!important;}

/* ===== v3 · giao diện mới ===== */
.ei-root{--ei-r:16px;max-width:1100px;width:100%;margin:0 auto;box-sizing:border-box;color:var(--ink,#1d1d1f);}
.ei-root *{box-sizing:border-box;}
.ei2-head h3{margin:0;font:800 1.35rem/1.2 var(--sans,sans-serif);letter-spacing:-.02em;}
.ei2-head p{margin:.3rem 0 0;font:500 .9rem/1.5 var(--sans,sans-serif);color:var(--mut,#6e6e73);}
.ei2-grid{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:1rem;align-items:stretch;}
@media(max-width:860px){.ei2-grid{grid-template-columns:1fr;}}
.ei2-card{display:flex;flex-direction:column;gap:.7rem;padding:1.1rem 1.2rem;border-radius:var(--ei-r);background:var(--panel,#fff);border:1px solid var(--soft,#e8e8ed);}
.ei2-card-t{display:flex;align-items:center;gap:.6rem;font:700 .95rem var(--sans,sans-serif);}
.ei2-num{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--acc,#0071e3);color:var(--acc-ink,#fff);font:800 .74rem var(--sans,sans-serif);flex:none;}
.ei2-drop{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;min-height:200px;padding:1.2rem;border-radius:14px;border:2px dashed color-mix(in srgb,var(--acc,#0071e3) 40%,transparent);background:color-mix(in srgb,var(--acc,#0071e3) 4%,var(--panel,#fff));text-align:center;cursor:pointer;transition:border-color .15s,background .15s;}
.ei2-drop:hover,.ei2-drop.on{border-color:var(--acc,#0071e3);background:color-mix(in srgb,var(--acc,#0071e3) 9%,var(--panel,#fff));}
.ei2-drop-ico{display:grid;place-items:center;width:52px;height:52px;border-radius:14px;background:color-mix(in srgb,var(--acc,#0071e3) 12%,transparent);color:var(--acc,#0071e3);}
.ei2-drop b{font:700 .95rem var(--sans,sans-serif);}
.ei2-drop small{font:500 .78rem var(--sans,sans-serif);color:var(--mut,#6e6e73);}
.ei2-file{display:inline-flex;align-items:center;gap:.4rem;max-width:100%;padding:.3rem .7rem;border-radius:999px;background:color-mix(in srgb,#22c55e 14%,transparent);color:#15803d;font:700 .78rem var(--sans,sans-serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ei2-ta{flex:1;width:100%;min-height:200px;resize:vertical;padding:.8rem .9rem;border-radius:14px;border:1.5px solid var(--soft,#e8e8ed);background:var(--bg,#fff);color:var(--ink,#1d1d1f);font:500 .84rem/1.55 var(--mono,monospace);outline:0;transition:border-color .15s;}
.ei2-ta:focus{border-color:var(--acc,#0071e3);}
.ei2-status{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;min-height:1.6rem;font:600 .8rem var(--sans,sans-serif);color:var(--mut,#6e6e73);}
.ei2-pill{display:inline-flex;align-items:center;gap:.35rem;padding:.22rem .65rem;border-radius:999px;font:700 .74rem var(--sans,sans-serif);}
.ei2-pill.ok{background:color-mix(in srgb,#22c55e 14%,transparent);color:#15803d;}
.ei2-pill.err{background:color-mix(in srgb,#dc2626 12%,transparent);color:#dc2626;}
.ei2-pill.warn{background:color-mix(in srgb,#f59e0b 16%,transparent);color:#b45309;}
.ei2-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.55rem 1.1rem;border-radius:999px;border:1.5px solid var(--soft,#e0e0e6);background:var(--panel,#fff);color:var(--ink,#1d1d1f);font:700 .82rem var(--sans,sans-serif);cursor:pointer;transition:all .15s;}
.ei2-btn:hover{border-color:var(--ink,#1d1d1f);}
.ei2-btn.pri{background:var(--acc,#0071e3);border-color:var(--acc,#0071e3);color:var(--acc-ink,#fff);}
.ei2-btn.pri:hover{opacity:.92;}
.ei2-btn.sm{padding:.38rem .85rem;font-size:.76rem;}
.ei2-btn:disabled{opacity:.45;cursor:not-allowed;}
.ei2-ai{border-radius:var(--ei-r);border:1px solid var(--soft,#e8e8ed);background:var(--panel,#fff);overflow:hidden;}
.ei2-ai>summary{display:flex;align-items:center;gap:.6rem;padding:.9rem 1.2rem;cursor:pointer;list-style:none;font:700 .92rem var(--sans,sans-serif);}
.ei2-ai>summary::-webkit-details-marker{display:none;}
.ei2-ai>summary .ei2-chev{margin-left:auto;transition:transform .2s;color:var(--mut,#6e6e73);}
.ei2-ai[open]>summary .ei2-chev{transform:rotate(180deg);}
.ei2-ai-sub{font:500 .8rem var(--sans,sans-serif);color:var(--mut,#6e6e73);font-weight:500;}
.ei2-ai-body{display:grid;gap:.9rem;padding:0 1.2rem 1.2rem;}
.ei2-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem;}
@media(max-width:700px){.ei2-steps{grid-template-columns:1fr;}}
.ei2-step{display:flex;gap:.6rem;align-items:flex-start;padding:.7rem .8rem;border-radius:12px;background:var(--soft,#f5f5f7);font:500 .82rem/1.45 var(--sans,sans-serif);}
.ei2-actions{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;}
.ei2-more{border-top:1px dashed var(--soft,#e0e0e6);padding-top:.7rem;}
.ei2-more>summary{cursor:pointer;font:700 .8rem var(--sans,sans-serif);color:var(--mut,#6e6e73);list-style:none;}
.ei2-more>summary::-webkit-details-marker{display:none;}
.ei2-more>summary:hover{color:var(--ink,#1d1d1f);}
.ei2-more-body{display:grid;gap:.7rem;margin-top:.7rem;}
.ei2-lbl{font:700 .7rem var(--sans,sans-serif);text-transform:uppercase;letter-spacing:.04em;color:var(--mut,#6e6e73);}
.ei2-fields{font:500 .8rem/1.7 var(--sans,sans-serif);color:var(--mut,#6e6e73);}
.ei2-fields code,.ei2-step code{padding:.05rem .35rem;border-radius:6px;background:var(--soft,#f0f0f3);font:600 .74rem var(--mono,monospace);color:var(--ink,#1d1d1f);}
.ei2-pre{margin:0;padding:.7rem .85rem;border-radius:12px;background:var(--soft,#f5f5f7);overflow:auto;max-height:220px;font:500 .74rem/1.55 var(--mono,monospace);}
.ei2-in{width:100%;padding:.55rem .75rem;border-radius:10px;border:1.5px solid var(--soft,#e0e0e6);background:var(--bg,#fff);color:var(--ink,#1d1d1f);font:500 .85rem var(--sans,sans-serif);outline:0;}
.ei2-in:focus{border-color:var(--acc,#0071e3);}
.ei2-field{display:grid;gap:.3rem;min-width:0;}
.ei2-row{display:flex;gap:.7rem;flex-wrap:wrap;}
.ei2-codebox{display:grid;gap:.8rem;padding:1rem 1.2rem;border-radius:var(--ei-r);border:1.5px solid var(--acc,#0071e3);background:color-mix(in srgb,var(--acc,#0071e3) 4%,var(--panel,#fff));}
.ei2-prev{display:grid;gap:.8rem;}
.ei2-prev-bar{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;}
.ei2-list{display:grid;gap:.7rem;max-height:560px;overflow-y:auto;padding-right:4px;}
.ei2-q{display:grid;gap:.5rem;padding:.9rem 1rem;border-radius:14px;border:1.5px solid var(--soft,#e8e8ed);background:var(--panel,#fff);}
.ei2-q.bad{border-color:color-mix(in srgb,#dc2626 45%,transparent);}
.ei2-q-h{display:flex;gap:.45rem;align-items:center;flex-wrap:wrap;}
.ei2-x{margin-left:auto;display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--mut,#6e6e73);cursor:pointer;}
.ei2-x:hover{background:#dc2626;color:#fff;}
.ei2-group{border:1.5px solid var(--acc,#0071e3);border-radius:14px;padding:.7rem .9rem;background:var(--soft,#f5f5f7);}
.ei2-group>summary{cursor:pointer;font:700 .82rem var(--sans,sans-serif);}
.ei2-foot{position:sticky;bottom:0;z-index:5;display:grid;gap:.6rem;padding:.9rem 1.1rem;border-radius:var(--ei-r);background:var(--panel,#fff);border:1px solid var(--soft,#e8e8ed);box-shadow:0 -8px 24px -16px rgba(0,0,0,.25);}
.ei2-foot-row{display:flex;gap:.7rem;flex-wrap:wrap;align-items:flex-end;}
.ei2-msg{margin:0;font:600 .8rem var(--sans,sans-serif);}
.ei2-stmt{display:flex;gap:.5rem;align-items:center;}
.ei2-stmt>b{flex:none;width:22px;font:700 .8rem var(--sans,sans-serif);}
.ei2-stmt>input.ei2-in{flex:1;}
.ei2-sel{width:92px!important;flex:none;font-weight:700!important;}
.ei2-sel.ok{color:#15803d;border-color:#22c55e;}
.ei2-sel.no{color:#dc2626;border-color:#f87171;}
.ei2-pbox{display:grid;gap:.8rem;padding:1rem 1.1rem;border-radius:14px;border:1.5px solid color-mix(in srgb,var(--acc,#0071e3) 35%,var(--soft,#e8e8ed));background:color-mix(in srgb,var(--acc,#0071e3) 3%,var(--panel,#fff));}
.ei2-pgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.7rem;}
.ei2-pgrid .ei2-wide{grid-column:span 2;}
@media(max-width:860px){.ei2-pgrid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:520px){.ei2-pgrid{grid-template-columns:1fr;}.ei2-pgrid .ei2-wide{grid-column:auto;}}
.ei2-seg{display:flex;border:1.5px solid var(--soft,#e0e0e6);border-radius:10px;overflow:hidden;background:var(--bg,#fff);}
.ei2-seg button{flex:1;padding:.5rem .6rem;border:0;background:transparent;color:var(--mut,#6e6e73);font:700 .76rem var(--sans,sans-serif);cursor:pointer;}
.ei2-seg button.on{background:var(--acc,#0071e3);color:var(--acc-ink,#fff);}
.ei2-tips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;}
@media(max-width:760px){.ei2-tips{grid-template-columns:1fr;}}
.ei2-tip{padding:.8rem 1rem;border-radius:12px;background:var(--soft,#f5f5f7);font:500 .8rem/1.55 var(--sans,sans-serif);}
.ei2-tip ul{margin:.4rem 0 0;padding-left:1.1rem;display:grid;gap:.3rem;}
.ei2-msg.ok{color:#16a34a;}.ei2-msg.err{color:#dc2626;}
`;



export default function ExamImporter({
  variant = 'page',
  classInfo = null,
  classes = [],
  allowBank = false,
  allowSoftExam = false,
  onCreateSoftExam = null,
}) {
  const fileRef = useRef(null);
  const [raw, setRaw] = useState('');
  const [fileLines, setFileLines] = useState(null); // dòng có mask (chỉ khi nhập từ Word)
  const [items, setItems] = useState([]);
  const [keyFound, setKeyFound] = useState(false);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [classId, setClassId] = useState(classInfo?.id || classes[0]?.id || '');
  const [onlyWarn, setOnlyWarn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  /* Chế độ sinh đề từ code */
  const codeDismissed = useRef(false);
  const [codeMode, setCodeMode] = useState(false);
  const [codeOpen, setCodeOpen] = useState(true);
  const [codeSrc, setCodeSrc] = useState('');
  const [lang, setLang] = useState('Python');
  const [nQ, setNQ] = useState(10);
  const [level, setLevel] = useState(LEVELS[3]);
  const [kinds, setKinds] = useState(['output', 'bug', 'concept']);
  const [extra, setExtra] = useState('');
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState('json');
  const [jsonInfo, setJsonInfo] = useState(null); // { count } | { error }
  const [guideOpen, setGuideOpen] = useState(true);
  const [copiedKey, setCopiedKey] = useState('');
  const [embedPassage, setEmbedPassage] = useState(true); // ghép bài đọc vào đầu mỗi câu
  const gradeInit = String(classInfo?.grade || '').replace(/\D/g, '');
  const [pb, setPb] = useState({
    subject: classInfo?.subject || 'Hóa học',
    grade: ['10', '11', '12'].includes(gradeInit) ? gradeInit : '12',
    topic: '', n: 28, minutes: 50, level: 'standard', structure: 'gdpt2025', extra: '',
  });
  const setPbv = (p) => setPb((o) => ({ ...o, ...p }));
  const pbPrompt = buildMasterPrompt({ ...pb });
  const pbSplit = gdpt2025Split(Math.min(60, Math.max(4, Number(pb.n) || 28)));

  /* Phân tích lại mỗi khi nội dung thay đổi */
  useEffect(() => {
    if (!raw.trim()) { setItems([]); setKeyFound(false); setJsonInfo(null); codeDismissed.current = false; return; }

    /* 1) JSON → tự thành đề */
    const jx = fileLines ? null : extractJson(raw);
    if (jx && jx.value !== undefined) {
      const ex = normalizeJsonExam(jx.value);
      if (ex) {
        setItems(ex.questions);
        setKeyFound(false);
        setJsonInfo({ count: ex.questions.length });
        if (ex.meta.title) setTitle((t) => t || String(ex.meta.title));
        if (ex.meta.duration) setDuration((d) => d || String(ex.meta.duration));
        if (codeMode) setCodeOpen(false);
        return;
      }
    }
    if (jx && jx.error && JSON_HINT.test(raw)) {
      setItems([]);
      setJsonInfo({ error: jx.error });
      return;
    }
    setJsonInfo(null);

    /* 2) Văn bản thường */
    const res = parseLines(fileLines || textToLines(raw));
    setItems(res.questions);
    setKeyFound(res.keyFound);
    /* Dán code (không phải đề) → tự nhảy sang chế độ tạo prompt */
    if (!codeMode && !codeDismissed.current && res.questions.length === 0 && !fileLines && looksLikeCode(raw)) {
      setCodeSrc(raw);
      setLang(guessLang(raw, fileName));
      setCodeMode(true);
      setCodeOpen(true);
      setRaw('');
      return;
    }
    if (codeMode && res.questions.length > 0) setCodeOpen(false);
  }, [raw, fileLines, codeMode, fileName]);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true); setMsg(''); setNote(''); codeDismissed.current = false;
    try {
      if (/\.doc$/i.test(f.name)) {
        throw new Error('Chưa hỗ trợ file .doc đời cũ. Mở bằng Word → Lưu thành .docx rồi nhập lại.');
      }
      if (/\.docx$/i.test(f.name)) {
        const { lines, imgs } = await readDocx(f);
        setFileLines(lines);
        setRaw(lines.map((l) => l.t).join('\n'));
        if (imgs) setNote(`File có ${imgs} hình ảnh — hình chưa được nhập, các câu có hình sẽ được đánh dấu cảnh báo.`);
      } else if (/\.pdf$/i.test(f.name)) {
        const { text, truncated, pages } = await readPdf(f);
        if (!text.replace(/\s/g, '')) throw new Error('PDF này là bản scan (ảnh), chưa có chữ để đọc. Hãy dùng PDF có chữ hoặc file Word.');
        setFileLines(null);
        setRaw(text);
        if (truncated) setNote(`Chỉ đọc ${pages} trang đầu của PDF.`);
      } else {
        setFileLines(null);
        setRaw(await f.text());
      }
      setFileName(f.name);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setMsg(err.message || 'Không đọc được file này. Dùng Word (.docx), PDF có chữ hoặc TXT.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (items.length > 0) setGuideOpen(false); }, [items.length > 0]);

  const copyAny = async (text, key) => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* */ }
      ta.remove();
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };
  const tryJsonSample = () => {
    codeDismissed.current = false;
    setFileName('');
    setFileLines(null);
    setRaw(JSON_SAMPLE_TEXT);
  };

  const tryJsonSampleEn = () => {
    codeDismissed.current = false;
    setFileName('');
    setFileLines(null);
    setRaw(JSON_SAMPLE_EN_TEXT);
  };

  const leaveCodeMode = () => {
    codeDismissed.current = true;
    setCodeMode(false);
    setRaw(codeSrc);
    setCodeSrc('');
  };
  const prompt = codeMode
    ? buildPrompt({
      code: codeSrc, lang, n: Math.min(40, Math.max(1, Number(nQ) || 10)), level, kinds, extra,
      subject: classInfo?.subject || '', grade: classInfo?.grade || '', format,
    })
    : '';
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(prompt); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = prompt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const patch = (id, p) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const setOption = (id, i, v) =>
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, options: it.options.map((o, j) => (j === i ? v : o)) } : it)));
  const remove = (id) => setItems((arr) => arr.filter((it) => it.id !== id));
  /* Sửa bài đọc / hướng dẫn: áp dụng cho cả nhóm */
  const setGroup = (pg, p) => setItems((arr) => arr.map((it) => (it.pg === pg ? { ...it, ...p } : it)));

  const checked = items.map((it) => ({ it, issues: issuesOf(it) }));
  const valid = checked.filter((c) => c.issues.length === 0).map((c) => c.it);
  const needFix = checked.filter((c) => c.issues.length > 0 || c.it.warns.length > 0).length;
  const shown = onlyWarn ? checked.filter((c) => c.issues.length || c.it.warns.length) : checked;

  const handleCreate = async () => {
    if (!valid.length) { setMsg('Chưa có câu hợp lệ nào để tạo.'); return; }
    if (!onCreateSoftExam) { setMsg('Tính năng nhập đang không khả dụng ở nơi này.'); return; }
    try {
      await onCreateSoftExam({
        title: title || fileName || 'Đề nhập từ file',
        duration: Number(duration) > 0 ? Number(duration) : Math.max(15, valid.length * 2),
        classId,
        subject: classInfo?.subject || '',
        grade: classInfo?.grade || '',
        questions: valid.map((it) => {
          const meta = { ...(it.topic ? { topic: it.topic } : {}), ...(it.level ? { level: it.level } : {}) };
          if (it.type === 'true_false') {
            return { ...meta, type: 'true_false', q: it.q, statements: it.statements.map((x) => ({ text: x.text, answer: x.answer === true })), points: it.points || 1, explain: it.explain };
          }
          if (it.type === 'short_answer') {
            const vi = String(it.answer).trim().replace('.', ',');
            return { ...meta, type: 'short_answer', q: it.q, answer: vi, accepted: [...new Set([vi, vi.replace(',', '.')])], points: it.points || 0.25, explain: it.explain };
          }
          const base = { ...meta, type: 'single_choice', options: it.options, correct: it.correct, points: it.points || 1, explain: it.explain };
          if (!it.passage && !it.instruction) return { ...base, q: it.q };
          /* Ghép bài đọc vào đầu câu hỏi → màn làm bài nào cũng hiển thị được */
          if (embedPassage) {
            const head = [it.instruction, it.passage].filter(Boolean).join('\n\n');
            return { ...base, q: head + '\n\n———\n' + it.q };
          }
          /* Gửi riêng: màn làm bài cần đọc q.passage / q.instruction / q.passageId */
          return { ...base, q: it.q, passage: it.passage || undefined, instruction: it.instruction || undefined, passageId: it.pg || undefined };
        }),
        sourceFile: fileName || null,
      });
      const skipped = items.length - valid.length;
      setMsg(`Đã tạo đề từ file thành công!${skipped ? ` (bỏ qua ${skipped} câu chưa hợp lệ)` : ''}`);
    } catch (e) {
      setMsg(e.message || 'Lỗi khi tạo đề.');
    }
  };

  const sampleBtns = (
    <>
      <button type="button" className="ei2-btn sm" onClick={() => copyAny(JSON_SAMPLE_TEXT, 'sample')}>
        {copiedKey === 'sample' ? 'Đã sao chép ✓' : 'Sao chép JSON mẫu'}
      </button>
      <button type="button" className="ei2-btn sm" onClick={tryJsonSample}>Dán thử JSON mẫu</button>
    </>
  );
  const groupCount = new Set(items.map((x) => x.pg).filter(Boolean)).size;

  return (
    <div className="ei-root" style={{ padding: '1.2rem 1.3rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{EI_CSS}</style>

      <div className="ei2-head">
        <h3>Nhập đề từ file</h3>
        <p>Tải file Word, PDF, TXT hoặc dán JSON do AI soạn. Đáp án đúng được nhận diện tự động, thầy/cô chỉ cần xem lại rồi tạo đề.</p>
      </div>

      {/* ===== BƯỚC 1 + 2: FILE | DÁN ===== */}
      <div className="ei2-grid">
        <div className="ei2-card">
          <div className="ei2-card-t"><span className="ei2-num">1</span>Tải file lên</div>
          <label className="ei2-drop" style={{ cursor: busy ? 'wait' : 'pointer' }}>
            <input type="file" accept=".docx,.doc,.pdf,.txt,.md,.py,.js,.ts,.java,.cpp,.cc,.c,.cs,.php,.html,.css,.sql,.pas,.json" hidden ref={fileRef} onChange={onFile} disabled={busy} />
            <span className="ei2-drop-ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </span>
            <b>{busy ? 'Đang đọc file…' : 'Chọn file để nhập'}</b>
            {fileName ? <span className="ei2-file">{fileName}</span> : <small>Word (.docx) · PDF · TXT · MD · file code</small>}
          </label>
        </div>

        <div className="ei2-card">
          <div className="ei2-card-t"><span className="ei2-num">2</span>{codeMode ? 'Dán kết quả AI trả về' : 'Hoặc dán nội dung / JSON'}</div>
          <textarea
            className="ei2-ta"
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setFileLines(null); }}
            rows={codeMode ? 8 : 8}
            placeholder={codeMode
              ? 'Dán toàn bộ câu trả lời của AI (JSON, hoặc dạng Câu 1. … A. … Đáp án: B)'
              : 'Dán JSON hoặc nội dung đề (Câu 1. … A. … Đáp án: B). Dán code sẽ tự tạo prompt nhờ AI sinh câu hỏi.'}
          />
          <div className="ei2-status">
            {jsonInfo?.count > 0 && <span className="ei2-pill ok">Nhận diện JSON · {jsonInfo.count} câu</span>}
            {jsonInfo?.error && <span className="ei2-pill err">JSON chưa hợp lệ</span>}
            {!jsonInfo && items.length > 0 && <span className="ei2-pill ok">Nhận diện {items.length} câu</span>}
            {!jsonInfo && !items.length && !raw.trim() && <span>Chưa có nội dung.</span>}
            {fileLines && <span>Sửa ô này sẽ phân tích lại từ đầu (mất in đậm/gạch chân của Word).</span>}
            {note && <span className="ei2-pill warn">{note}</span>}
          </div>
          {jsonInfo?.error && (
            <div className="ei-jsonerr" style={{ font: '500 .8rem/1.55 var(--sans, sans-serif)', color: 'var(--mut, #6e6e73)' }}>
              <b style={{ color: '#dc2626' }}>Lỗi:</b> {jsonInfo.error}
              <div>Copy lại <b>toàn bộ</b> khối JSON (đủ dấu <code>{'}'}</code> / <code>]</code> ở cuối), hoặc nhắn AI: “Trả lại đúng JSON hợp lệ, không giải thích thêm”.</div>
            </div>
          )}
        </div>
      </div>

      {/* ===== NHỜ AI SOẠN ĐỀ ===== */}
      <details className="ei2-ai" open={guideOpen} onToggle={(e) => setGuideOpen(e.currentTarget.open)}>
        <summary>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--acc,#0071e3)' }}><path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" /></svg>
          Chưa có đề? Nhờ AI soạn đề chuẩn THPT rồi dán vào
          <span className="ei2-ai-sub">Claude, ChatGPT, Gemini…</span>
          <svg className="ei2-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </summary>
        <div className="ei2-ai-body">
          {/* --- BƯỚC 1: FORM TẠO PROMPT --- */}
          <div className="ei2-pbox">
            <div className="ei2-card-t"><span className="ei2-num">1</span>Điền thông tin đề — prompt tự cập nhật theo</div>
            <div className="ei2-pgrid">
              <label className="ei2-field"><span className="ei2-lbl">Môn</span>
                <input className="ei2-in" value={pb.subject} onChange={(e) => setPbv({ subject: e.target.value })} /></label>
              <label className="ei2-field"><span className="ei2-lbl">Lớp</span>
                <select className="ei2-in" value={pb.grade} onChange={(e) => setPbv({ grade: e.target.value })}>
                  {['10', '11', '12'].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
                </select></label>
              <label className="ei2-field ei2-wide"><span className="ei2-lbl">Chủ đề / bài học</span>
                <input className="ei2-in" value={pb.topic} placeholder="VD: Este – Lipit (Hóa 12, chương 1)" onChange={(e) => setPbv({ topic: e.target.value })} /></label>
              <label className="ei2-field"><span className="ei2-lbl">Số câu</span>
                <input className="ei2-in" type="number" min={4} max={60} value={pb.n} onChange={(e) => setPbv({ n: e.target.value })} /></label>
              <label className="ei2-field"><span className="ei2-lbl">Thời gian (phút)</span>
                <input className="ei2-in" type="number" min={5} value={pb.minutes} onChange={(e) => setPbv({ minutes: e.target.value })} /></label>
              <label className="ei2-field"><span className="ei2-lbl">Mức độ</span>
                <select className="ei2-in" value={pb.level} onChange={(e) => setPbv({ level: e.target.value })}>
                  {Object.entries(PROMPT_LEVELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select></label>
              <div className="ei2-field"><span className="ei2-lbl">Cấu trúc đề</span>
                <div className="ei2-seg">
                  <button type="button" className={pb.structure === 'gdpt2025' ? 'on' : ''} onClick={() => setPbv({ structure: 'gdpt2025', n: 28, minutes: 50 })}>Chuẩn thi 2025 (3 phần)</button>
                  <button type="button" className={pb.structure === 'mcq' ? 'on' : ''} onClick={() => setPbv({ structure: 'mcq', n: 20, minutes: 45 })}>100% trắc nghiệm</button>
                </div></div>
              <label className="ei2-field ei2-wide"><span className="ei2-lbl">Yêu cầu thêm (tùy chọn)</span>
                <input className="ei2-in" value={pb.extra} placeholder="VD: nhiều câu thực tiễn, ưu tiên bài toán hỗn hợp, tránh dạng đã ra ở đề trước…" onChange={(e) => setPbv({ extra: e.target.value })} /></label>
            </div>
            <div className="ei2-actions">
              <button type="button" className="ei2-btn pri" onClick={() => copyAny(pbPrompt, 'prompt')}>
                {copiedKey === 'prompt' ? 'Đã sao chép ✓' : 'Sao chép prompt'}
              </button>
              {!pb.topic.trim() && <span className="ei2-pill warn">Nên điền chủ đề trước khi sao chép</span>}
              {pb.structure === 'gdpt2025' && (
                <span className="ei2-pill ok">{pbSplit.p1} trắc nghiệm · {pbSplit.p2} đúng/sai · {pbSplit.p3} trả lời ngắn</span>
              )}
            </div>
            <details className="ei2-more">
              <summary>Xem nội dung prompt ({pbPrompt.length.toLocaleString('vi-VN')} ký tự)</summary>
              <textarea className="ei2-ta" style={{ minHeight: 220, marginTop: '.6rem', fontSize: '.76rem' }} readOnly value={pbPrompt} onFocus={(e) => e.target.select()} />
            </details>
          </div>

          {/* --- CÁC BƯỚC CÒN LẠI --- */}
          <div className="ei2-steps">
            <div className="ei2-step"><span className="ei2-num">2</span>
              <div><b>Dán vào chat AI</b><br />Mở Claude, ChatGPT hoặc Gemini, dán prompt vào <i>tin nhắn mới</i>. Có tài liệu thì <b>đính kèm cùng lúc</b> (PDF, ảnh đề cương, trang SGK) để AI bám đúng số liệu.</div></div>
            <div className="ei2-step"><span className="ei2-num">3</span>
              <div><b>Chờ AI trả khối JSON</b><br />Bấm nút <b>Copy</b> ở góc khối code, hoặc bôi đen toàn bộ từ <code>{'{'}</code> đến <code>{'}'}</code>. AI có viết thêm lời dẫn cũng không sao, phần mềm tự cắt lấy khối JSON.</div></div>
            <div className="ei2-step"><span className="ei2-num">4</span>
              <div><b>Dán vào ô "bước 2" phía trên</b><br />Đề hiện ngay bên dưới. Các câu <span style={{ color: '#dc2626', fontWeight: 700 }}>cảnh báo đỏ</span> là câu thiếu đáp án hoặc sai cấu trúc; sửa trực tiếp rồi bấm <b>Tạo đề</b>.</div></div>
          </div>

          <div className="ei2-tips">
            <div className="ei2-tip">
              <b>Mẹo để AI ra đề chuẩn</b>
              <ul>
                <li>Dùng mô hình mạnh và bật chế độ <b>suy nghĩ (Thinking / Extended thinking)</b> nếu có — bài tính toán Hóa chính xác hơn rõ rệt.</li>
                <li>Chủ đề càng cụ thể càng tốt: "Este – Lipit, Hóa 12" tốt hơn "Hóa hữu cơ".</li>
                <li>Đề trên 30 câu hay bị cắt giữa chừng: tạo 2 đề nhỏ (VD 15 + 15 câu) hoặc nhắn AI “Xuất lại toàn bộ JSON, rút lời giải còn 1 câu”.</li>
                <li>Luôn tự giải thử 2–3 câu Vận dụng cao: AI vẫn có thể sai số liệu. Câu sai thì bấm chọn lại đáp án ngay trong phần xem lại.</li>
              </ul>
            </div>
            <div className="ei2-tip">
              <b>Gặp lỗi?</b>
              <ul>
                <li><b>"JSON chưa hợp lệ"</b>: copy thiếu phần cuối. Copy lại cả khối, hoặc nhắn AI “Trả lại đúng JSON hợp lệ, không giải thích thêm”.</li>
                <li><b>Công thức hiện lỗi $\ce…</b>: AI quên viết gấp đôi dấu gạch chéo. Nhắn “Viết gấp đôi mọi dấu \ trong JSON”.</li>
                <li><b>Thiếu câu / sai số câu</b>: nhắn “Đề đang có N câu, cần đúng M câu, bổ sung phần thiếu và xuất lại toàn bộ”.</li>
                <li><b>Đã có file Word/PDF đề sẵn</b>: dùng mục “Thêm” bên dưới để chuyển thẳng sang JSON.</li>
              </ul>
            </div>
          </div>

          <div className="ei2-actions">{sampleBtns}</div>

          <details className="ei2-more">
            <summary>Thêm: đề tiếng Anh có bài đọc, chuyển đề có sẵn sang JSON</summary>
            <div className="ei2-more-body">
              <div className="ei2-actions">
                <button type="button" className="ei2-btn sm" onClick={() => copyAny(buildConvertPrompt(), 'convert')}>
                  {copiedKey === 'convert' ? 'Đã sao chép ✓' : 'Prompt: chuyển file đề có sẵn → JSON'}
                </button>
                <button type="button" className="ei2-btn sm" onClick={() => copyAny(buildEnglishPrompt({ grade: classInfo?.grade }), 'en')}>
                  {copiedKey === 'en' ? 'Đã sao chép ✓' : 'Prompt: AI soạn đề tiếng Anh'}
                </button>
                <button type="button" className="ei2-btn sm" onClick={() => copyAny(JSON_SAMPLE_EN_TEXT, 'sampleEn')}>
                  {copiedKey === 'sampleEn' ? 'Đã sao chép ✓' : 'Sao chép JSON mẫu (Anh)'}
                </button>
                <button type="button" className="ei2-btn sm" onClick={tryJsonSampleEn}>Dán thử JSON đề tiếng Anh</button>
              </div>
            </div>
          </details>

          <details className="ei2-more">
            <summary>Xem định dạng JSON và các trường được hỗ trợ</summary>
            <div className="ei2-more-body">
              <div className="ei2-fields">
                <code>type</code> <code>multiple_choice</code> | <code>true_false</code> | <code>short_answer</code> (bỏ trống = trắc nghiệm) ·
                <code> q</code> nội dung câu (bắt buộc) · <code>options</code> mảng 2–6 lựa chọn (trắc nghiệm) ·
                <code> correct</code> chữ cái <code>"A"</code>–<code>"F"</code>, số thứ tự từ 0, hoặc đúng nội dung lựa chọn ·
                <code> statements</code> đúng 4 nhận định <code>{'{ text, answer: true/false }'}</code> (đúng/sai) ·
                <code> answer</code> một số, tối đa 4 ký tự (trả lời ngắn) ·
                <code> level</code> mức độ · <code>topic</code> dạng bài · <code>explain</code> giải thích · <code>points</code> điểm ·
                <code> code</code> + <code>lang</code> đoạn code · <code>passage</code> bài đọc dùng chung · <code>instruction</code> dòng hướng dẫn.
                Cũng nhận <code>question</code>, <code>choices</code>, <code>cau_hoi</code>, <code>dap_an</code>, <code>giai_thich</code>.
                JSON có thể là mảng <code>[ … ]</code> hoặc object có khóa <code>questions</code>, bọc trong <code>```json</code> cũng được.
                Điểm tính theo từng câu; đề chuẩn 2025: 0,25 / 1 / 0,25 cho trắc nghiệm / đúng-sai / trả lời ngắn.
              </div>
              <pre className="ei2-pre">{JSON_SAMPLE_TEXT}</pre>
            </div>
          </details>
        </div>
      </details>

      {/* ===== CHẾ ĐỘ CODE ===== */}
      {codeMode && (
        <div className="ei2-codebox">
          <div className="ei2-actions">
            <b style={{ font: '700 .9rem var(--sans, sans-serif)' }}>Đã nhận diện code {lang === 'Khác' ? '' : lang} — tạo prompt để AI sinh câu hỏi</b>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button type="button" className="ei2-btn sm" onClick={() => setCodeOpen((v) => !v)}>{codeOpen ? 'Thu gọn' : 'Mở prompt'}</button>
              <button type="button" className="ei2-btn sm" onClick={leaveCodeMode}>Đây là đề, không phải code</button>
            </span>
          </div>

          {codeOpen && (
            <>
              <div className="ei2-field">
                <span className="ei2-lbl">Code gốc ({codeSrc.split('\n').length} dòng)</span>
                <textarea className="ei2-ta" style={{ minHeight: 140 }} value={codeSrc} onChange={(e) => setCodeSrc(e.target.value)} rows={7} />
              </div>
              {codeSrc.length > 12000 && (
                <span className="ei2-pill warn">Code khá dài — nên rút gọn để AI trả lời chính xác hơn.</span>
              )}

              <div className="ei2-row">
                <label className="ei2-field" style={{ flex: '1 1 130px' }}>
                  <span className="ei2-lbl">Ngôn ngữ</span>
                  <select className="ei2-in" value={lang} onChange={(e) => setLang(e.target.value)}>
                    {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="ei2-field" style={{ flex: '0 1 100px' }}>
                  <span className="ei2-lbl">Số câu</span>
                  <input className="ei2-in" type="number" min={1} max={40} value={nQ} onChange={(e) => setNQ(e.target.value)} />
                </label>
                <label className="ei2-field" style={{ flex: '1 1 160px' }}>
                  <span className="ei2-lbl">Mức độ</span>
                  <select className="ei2-in" value={level} onChange={(e) => setLevel(e.target.value)}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="ei2-field" style={{ flex: '1 1 170px' }}>
                  <span className="ei2-lbl">AI trả về dạng</span>
                  <select className="ei2-in" value={format} onChange={(e) => setFormat(e.target.value)}>
                    <option value="json">JSON (khuyên dùng)</option>
                    <option value="text">Văn bản Câu 1… A… Đáp án</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '.35rem .9rem', flexWrap: 'wrap' }}>
                {KINDS.map((k) => (
                  <label key={k.id} style={{ display: 'flex', gap: 6, alignItems: 'center', font: '500 .82rem var(--sans, sans-serif)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={kinds.includes(k.id)}
                      onChange={(e) => setKinds((arr) => (e.target.checked ? [...arr, k.id] : arr.filter((x) => x !== k.id)))} />
                    {k.label}
                  </label>
                ))}
              </div>

              <input className="ei2-in" value={extra} onChange={(e) => setExtra(e.target.value)}
                placeholder="Yêu cầu thêm (tùy chọn), VD: chỉ dùng vòng lặp for, dữ liệu là số nguyên…" />

              <div className="ei2-field">
                <span className="ei2-lbl">Prompt (dán vào chat AI)</span>
                <textarea className="ei2-ta" style={{ minHeight: 130, fontSize: '.76rem' }} readOnly value={prompt} rows={8} onFocus={(e) => e.target.select()} />
              </div>
              <div>
                <button type="button" className="ei2-btn pri" onClick={copyPrompt}>{copied ? 'Đã sao chép ✓' : 'Sao chép prompt'}</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== XEM TRƯỚC ===== */}
      {items.length > 0 && (
        <div className="ei2-prev">
          <div className="ei2-prev-bar">
            <b style={{ font: '800 1.05rem var(--sans, sans-serif)' }}>Xem lại trước khi tạo</b>
            <span className="ei2-pill ok">{valid.length} hợp lệ</span>
            {needFix > 0 && <span className="ei2-pill err">{needFix} cần xem lại</span>}
            {keyFound && <span className="ei2-pill warn">đã dùng bảng đáp án</span>}
            {groupCount > 0 && <span className="ei2-pill warn">{groupCount} bài đọc</span>}
            <label style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', font: '600 .8rem var(--sans, sans-serif)', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyWarn} onChange={(e) => setOnlyWarn(e.target.checked)} />
              Chỉ hiện câu cần xem lại
            </label>
          </div>

          <div className="ei2-list">
            {shown.map(({ it, issues }, idx) => {
              const prevIt = shown[idx - 1]?.it;
              const firstOfGroup = it.pg && (!prevIt || prevIt.pg !== it.pg);
              const grp = firstOfGroup ? items.filter((x) => x.pg === it.pg) : [];
              return (
                <Fragment key={it.id}>
                  {firstOfGroup && (
                    <details open className="ei2-group">
                      <summary>Bài đọc / đoạn văn dùng chung — câu {grp[0].num}–{grp[grp.length - 1].num} ({grp.length} câu)</summary>
                      <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                        <input className="ei2-in" value={it.instruction} placeholder="Hướng dẫn (tùy chọn), VD: Read the following passage and mark the letter A, B, C or D…"
                          onChange={(e) => setGroup(it.pg, { instruction: e.target.value })} style={{ fontStyle: 'italic' }} />
                        <textarea className="ei2-in" value={it.passage} rows={Math.min(16, Math.max(4, it.passage.split('\n').length + 2))}
                          onChange={(e) => setGroup(it.pg, { passage: e.target.value })}
                          style={{ resize: 'vertical', lineHeight: 1.55 }} />
                        <small style={{ color: 'var(--mut, #6e6e73)', fontSize: '.74rem' }}>Sửa ở đây áp dụng cho cả {grp.length} câu thuộc bài này.</small>
                      </div>
                    </details>
                  )}
                  <div className={'ei2-q' + (issues.length ? ' bad' : '')}>
                    <div className="ei2-q-h">
                      <b style={{ fontSize: '.85rem' }}>Câu {it.num}</b>
                      {it.type === 'true_false' && <span className="ei2-pill warn">Đúng/Sai</span>}
                      {it.type === 'short_answer' && <span className="ei2-pill warn">Trả lời ngắn</span>}
                      {it.level && <span className="ei2-pill ok">{it.level}</span>}
                      {issues.map((s) => <span key={s} className="ei2-pill err">{s}</span>)}
                      {it.warns.map((s) => <span key={s} className="ei2-pill warn">{s}</span>)}
                      {it.src && !issues.length && (
                        <span style={{ fontSize: '.72rem', color: 'var(--mut, #6e6e73)' }}>đáp án từ {it.src}</span>
                      )}
                      <button type="button" className="ei2-x" onClick={() => remove(it.id)} title="Xóa câu này" aria-label="Xóa câu này">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                    <textarea className="ei2-in" value={it.q} rows={Math.min(14, Math.max(2, it.q.split('\n').length + 1))}
                      onChange={(e) => patch(it.id, { q: e.target.value })}
                      style={{ resize: 'vertical', ...(it.q.includes('```') ? { font: '500 .78rem/1.5 var(--mono, monospace)' } : {}) }} />
                    {it.type === 'true_false' && (it.statements || []).map((st, k) => (
                      <div key={k} className="ei2-stmt">
                        <b>{'abcd'[k] || k + 1})</b>
                        <input className="ei2-in" value={st.text}
                          onChange={(e) => patch(it.id, { statements: it.statements.map((x, j) => (j === k ? { ...x, text: e.target.value } : x)) })} />
                        <select className={'ei2-in ei2-sel ' + (st.answer === true ? 'ok' : st.answer === false ? 'no' : '')}
                          value={st.answer === true ? 'Đ' : st.answer === false ? 'S' : ''}
                          onChange={(e) => patch(it.id, { statements: it.statements.map((x, j) => (j === k ? { ...x, answer: e.target.value === 'Đ' ? true : e.target.value === 'S' ? false : null } : x)) })}>
                          <option value="">Chọn</option>
                          <option value="Đ">Đúng</option>
                          <option value="S">Sai</option>
                        </select>
                      </div>
                    ))}
                    {it.type === 'short_answer' && (
                      <div className="ei2-stmt">
                        <b style={{ whiteSpace: 'nowrap' }}>Đáp án</b>
                        <input className="ei2-in" style={{ maxWidth: 160 }} value={it.answer} placeholder="vd 12,5"
                          onChange={(e) => patch(it.id, { answer: e.target.value, src: 'bạn sửa' })} />
                        <small style={{ color: 'var(--mut, #6e6e73)' }}>một số, dấu phẩy thập phân</small>
                      </div>
                    )}
                    {(it.type === 'mcq' || !it.type) && it.options.map((o, i) => (
                      <div key={i} className="ei-opt">
                        <input type="radio" name={'ans-' + it.id} checked={it.correct === i}
                          onChange={() => patch(it.id, { correct: i, src: 'bạn chọn' })} title="Đặt làm đáp án đúng" />
                        <b style={{ fontSize: '.78rem', width: 16 }}>{LETTERS[i]}</b>
                        {o.includes('\n') ? (
                          <textarea value={o} rows={Math.min(8, o.split('\n').length + 1)} onChange={(e) => setOption(it.id, i, e.target.value)}
                            style={{ flex: 1, font: '500 .78rem/1.5 var(--mono, monospace)' }} />
                        ) : (
                          <input value={o} onChange={(e) => setOption(it.id, i, e.target.value)} style={{ flex: 1 }} />
                        )}
                      </div>
                    ))}
                    {it.explain && (
                      <small style={{ color: 'var(--mut, #6e6e73)', fontSize: '.76rem' }}>Giải thích: {it.explain}</small>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      {items.some((x) => x.passage) && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', font: '500 .8rem/1.5 var(--sans, sans-serif)', cursor: 'pointer' }}>
          <input type="checkbox" checked={embedPassage} onChange={(e) => setEmbedPassage(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            Ghép bài đọc vào đầu mỗi câu khi tạo đề <span style={{ color: 'var(--mut, #6e6e73)' }}>(bật nếu màn làm bài chưa hiển thị riêng bài đọc;
            tắt thì mỗi câu gửi kèm <code>passage</code>, <code>instruction</code>, <code>passageId</code>)</span>
          </span>
        </label>
      )}

      {/* ===== BƯỚC 3: TẠO ĐỀ ===== */}
      <div className="ei2-foot">
        <div className="ei2-foot-row">
          <label className="ei2-field" style={{ flex: '1 1 220px' }}>
            <span className="ei2-lbl">Tên đề</span>
            <input className="ei2-in" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Kiểm tra 15 phút Chương 2" />
          </label>
          <label className="ei2-field" style={{ flex: '0 1 120px' }}>
            <span className="ei2-lbl">Thời gian (phút)</span>
            <input className="ei2-in" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)}
              placeholder={String(Math.max(15, valid.length * 2))} />
          </label>
          {classes.length > 0 && (
            <label className="ei2-field" style={{ flex: '1 1 180px' }}>
              <span className="ei2-lbl">Lớp</span>
              <select className="ei2-in" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name || c.title || c.id}</option>)}
              </select>
            </label>
          )}
          <button type="button" className="ei2-btn pri" onClick={handleCreate}
            disabled={!valid.length || !allowSoftExam || busy} style={{ padding: '.7rem 1.4rem' }}>
            {valid.length ? `Tạo đề từ ${valid.length} câu hợp lệ` : 'Tạo đề'}
          </button>
        </div>
        {msg && <p className={'ei2-msg ' + (msg.includes('thành công') ? 'ok' : 'err')}>{msg}</p>}
      </div>
    </div>
  );
}