/* ============================================================
   ExamImporter.jsx — Nhập đề từ file (v2 - Theo HD)
   ============================================================ */
import { Fragment, useEffect, useRef, useState } from 'react';

const LETTERS = 'ABCDEF';
const MARK_TAGS = new Set(['U', 'STRONG', 'B']);

const fold = (s) =>
  s.split('').map((c) => (c === 'đ' || c === 'Đ' ? 'd' : c.normalize('NFD')[0])).join('').toLowerCase();

const mkLine = (t) => ({ t, m: '0'.repeat(t.length) });
const sliceLine = (ln, a, b) => ({ t: ln.t.slice(a, b), m: ln.m.slice(a, b) });
const trimLine = (ln) => {
  const a = ln.t.length - ln.t.trimStart().length;
  const b = ln.t.trimEnd().length;
  return b <= a ? { t: '', m: '' } : sliceLine(ln, a, b);
};

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

const parseLines = (lines) => {
  const qs = [];
  const keyQueue = new Map();
  let cur = null;
  let lastNum = 0;
  let inKey = false;
  let pendingNums = null;
  let keyFound = false;

  const addKey = (n, L) => { if (!keyQueue.has(n)) keyQueue.set(n, []); keyQueue.get(n).push(L); keyFound = true; };

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

    if (inKey) {
      const r = readKey(f);
      if (r.clean) { r.pairs.forEach(([n, L]) => addKey(n, L)); continue; }
      inKey = false;
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
      if ((m = f.match(EXPLAIN_RE)) && (cur.opts.length > 0 || cur.explicit !== null)) {
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
      if (here.pairs.length >= 1 || readKey(nextF).pairs.length >= 2 || /^cau\s+\d/.test(nextF)) {
        inKey = true; cur = null;
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

    if (SECTION_RE.test(f)) { cur = null; continue; }

    const qm = f.match(Q_RE);
    if (qm) {
      const n = Number(qm[1] ?? qm[2] ?? qm[3]);
      const keyword = qm[1] !== undefined;
      const sequential = n === lastNum + 1 || qs.length === 0 || (n === 1 && cur && cur.opts.length >= 2);
      if (keyword || sequential) {
        cur = { num: n, stem: '', opts: [], explicit: null, explain: '', warns: [], mode: 'stem', nl: false };
        qs.push(cur);
        lastNum = n;
        absorb(sliceLine(ln, qm[0].length));
        continue;
      }
    }

    absorb(ln);
  }

  let idSeq = 0;
  const questions = qs.map((c) => {
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

const issuesOf = (it) => {
  const out = [];
  if (!it.q.trim()) out.push('Thiếu nội dung câu hỏi');
  if (it.options.length < 2) out.push(it.options.length ? 'Chỉ có 1 lựa chọn' : 'Không có lựa chọn (tự luận?)');
  else if (it.options.some((o) => !o.trim())) out.push('Có lựa chọn trống (hình/công thức?)');
  if (it.correct < 0 || it.correct >= it.options.length) out.push('Chưa có đáp án đúng');
  return out;
};

const JSON_SAMPLE = {
  title: 'Kiểm tra 15 phút — Vòng lặp for',
  duration: 15,
  questions: [
    {
      q: 'Đoạn code sau in ra màn hình những giá trị nào?',
      code: 'for i in range(3):\n    print(i)',
      lang: 'python',
      options: ['0 1 2', '1 2 3', '0 1 2 3', 'Báo lỗi'],
      correct: 'A',
      explain: 'range(3) sinh ra các số 0, 1, 2.',
      points: 1,
    },
    {
      q: 'Từ khoá nào dùng để định nghĩa một hàm trong Python?',
      options: ['func', 'def', 'function', 'define'],
      correct: 'B',
      explain: 'Python dùng từ khoá def.',
    },
    {
      q: 'Đoạn code sau có lỗi gì?',
      code: 'x = 5\nif x > 3\n    print(x)',
      lang: 'python',
      options: ['Thiếu dấu hai chấm sau điều kiện if', 'Sai thụt lề', 'print sai cú pháp', 'Không có lỗi'],
      correct: 'A',
      explain: 'Câu lệnh if phải kết thúc bằng dấu hai chấm.',
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
      "code": "(tuỳ chọn) đoạn code, xuống dòng bằng \\n",
      "lang": "(tuỳ chọn) python | cpp | java | javascript ...",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
      "correct": "B",
      "explain": "Giải thích ngắn",
      "points": 1
    }
  ]
}`;

const JSON_RULES = [
  '- Dùng dấu nháy kép " cho mọi khoá và chuỗi; không có dấu phẩy thừa ở cuối.',
  '- Xuống dòng trong chuỗi viết là \\n; dấu " bên trong chuỗi viết là \\".',
  '- "correct" là chữ cái A, B, C hoặc D (chữ cái đứng đầu lựa chọn đúng).',
  '- Không ghi sẵn "A.", "B." ở đầu các lựa chọn; công thức viết dạng chữ (vd: x^2).',
  '- Chỉ thêm "code" và "lang" khi câu hỏi thật sự có đoạn code.',
];

const buildJsonGuidePrompt = ({ subject, grade }) => [
  `Bạn là giáo viên ${subject || '[MÔN HỌC]'} giàu kinh nghiệm. Hãy soạn đề trắc nghiệm gồm [SỐ CÂU] câu về: [CHỦ ĐỀ — hoặc dán nội dung bài học / đoạn code vào đây], mức độ [dễ / trung bình / khó], dành cho học sinh ${grade || '[LỚP]'}.`,
  '',
  'Mỗi câu có 4 lựa chọn và chỉ 1 đáp án đúng; các đáp án sai phải hợp lý (là lỗi học sinh hay mắc); vị trí đáp án đúng phân bố đều; các câu không trùng ý.',
  '',
  'CHỈ TRẢ VỀ MỘT KHỐI JSON HỢP LỆ, không viết lời dẫn hay kết luận, theo đúng cấu trúc:',
  JSON_SCHEMA_TEXT,
  '',
  'Quy tắc JSON:',
  ...JSON_RULES,
].join('\n');

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
    const code = pickK(o, ['code', 'snippet', 'source', 'codeblock']);
    const lang = String(pickK(o, ['lang', 'language', 'ngonngu']) ?? '').toLowerCase().replace(/[^a-z+#]/g, '');
    if (code) q += (q ? '\n' : '') + '```' + lang + '\n' + String(code).replace(/\s+$/, '') + '\n```';

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
    if (numeric && correct === options.length && correct > 0) correct -= 1;
    if (correct < 0 || correct >= options.length) correct = -1;

    const VI = /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i;
    if (options.some((t) => fold(t).includes('dan chung') || (/\s=\s/.test(t) && VI.test(t.split('=').slice(1).join('=')))))
      warns.push('Lựa chọn có kèm ghi chú (dẫn chứng / nghĩa tiếng Việt) — nên xoá khỏi đáp án');

    const pts = Number(pickK(o, ['points', 'score', 'diem']));
    return {
      id: 'j' + (i + 1), num: i + 1, q, options, correct, src: 'JSON',
      passage: asText(ctx.passage), instruction: asText(ctx.instruction),
      explain: String(pickK(o, ['explain', 'explanation', 'giaithich', 'loigiai', 'solution', 'reason']) ?? '').trim(),
      warns, points: pts > 0 ? pts : undefined,
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

// ... (CSS giữ nguyên)
const EI_CSS = `...`; // (Bạn tự giữ nguyên đoạn CSS này từ file cũ nhé, nó dài quá)


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
  const [fileLines, setFileLines] = useState(null);
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
  const [jsonInfo, setJsonInfo] = useState(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [copiedKey, setCopiedKey] = useState('');

  // [3] SỬA LỖI QUAN TRỌNG: Mặc định không ghép bài đọc vào câu hỏi
  const [embedPassage, setEmbedPassage] = useState(false);

  useEffect(() => {
    if (!raw.trim()) { setItems([]); setKeyFound(false); setJsonInfo(null); codeDismissed.current = false; return; }

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

    const res = parseLines(fileLines || textToLines(raw));
    setItems(res.questions);
    setKeyFound(res.keyFound);
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
          const base = { type: 'mcq', options: it.options, correct: it.correct, points: it.points || 1, explain: it.explain };
          if (!it.passage && !it.instruction) return { ...base, q: it.q };
          if (embedPassage) {
            const head = [it.instruction, it.passage].filter(Boolean).join('\n\n');
            return { ...base, q: head + '\n\n———\n' + it.q };
          }
          return { ...base, q: it.q, passage: it.passage || undefined, instruction: it.instruction || undefined, passageId: it.pg || undefined };
        }),
        sourceFile: fileName || null,
        // [3] Thêm displayMode: paper nếu có bài đọc
        displayMode: valid.some((it) => it.passage || it.instruction) ? 'paper' : 'auto'
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

      <details className="ei2-ai" open={guideOpen} onToggle={(e) => setGuideOpen(e.currentTarget.open)}>
        <summary>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--acc,#0071e3)' }}><path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" /></svg>
          Chưa có đề? Nhờ AI soạn rồi dán vào
          <span className="ei2-ai-sub">Claude, ChatGPT, Gemini…</span>
          <svg className="ei2-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </summary>
        <div className="ei2-ai-body">
          <div className="ei2-steps">
            <div className="ei2-step"><span className="ei2-num">1</span><span>Bấm <b>Sao chép prompt</b>, thay phần trong <code>[ngoặc vuông]</code> bằng chủ đề, số câu, mức độ.</span></div>
            <div className="ei2-step"><span className="ei2-num">2</span><span>Dán vào chat AI, rồi copy toàn bộ khối JSON AI trả về.</span></div>
            <div className="ei2-step"><span className="ei2-num">3</span><span>Dán vào ô <b>bước 2</b> phía trên, kiểm tra và bấm <b>Tạo đề</b>.</span></div>
          </div>
          <div className="ei2-actions">
            <button type="button" className="ei2-btn pri"
              onClick={() => copyAny(buildJsonGuidePrompt({ subject: classInfo?.subject, grade: classInfo?.grade }), 'prompt')}>
              {copiedKey === 'prompt' ? 'Đã sao chép ✓' : 'Sao chép prompt cho AI'}
            </button>
            {sampleBtns}
          </div>

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
                <code>q</code> nội dung câu (bắt buộc) · <code>options</code> mảng 2–6 lựa chọn (bắt buộc) ·
                <code> correct</code> chữ cái <code>"A"</code>–<code>"F"</code>, số thứ tự từ 0, hoặc đúng nội dung lựa chọn ·
                <code> explain</code> giải thích · <code>code</code> + <code>lang</code> đoạn code · <code>points</code> điểm ·
                <code> passage</code> bài đọc (các câu liền nhau cùng <code>passage</code> được gom một bài) · <code>instruction</code> dòng hướng dẫn.
                Cũng nhận <code>question</code>, <code>choices</code>, <code>answer</code>, <code>cau_hoi</code>, <code>dap_an</code>, <code>giai_thich</code>.
                JSON có thể là mảng <code>[ … ]</code> hoặc object có khóa <code>questions</code>, bọc trong <code>```json</code> cũng được.
              </div>
              <pre className="ei2-pre">{JSON_SAMPLE_TEXT}</pre>
            </div>
          </details>
        </div>
      </details>

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
                    {it.options.map((o, i) => (
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