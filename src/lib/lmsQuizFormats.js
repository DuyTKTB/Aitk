/* ============================================================
   lmsQuizFormats.js — Nhập & Xuất Ngân hàng đề chuẩn LMS Quốc tế
   Lấy cảm hứng từ Moodle XML, Aiken, GIFT & ai-question-paper-generator:
     • parseMoodleXml(xmlText) — Nhập trực tiếp file Moodle XML (.xml)
     • parseGiftText(giftText) — Nhập định dạng Moodle GIFT (.gift)
     • parseAikenText(aikenText) — Nhập định dạng Aiken (.txt / .aiken)
     • parseSpreadsheetQuestions(rows) — Nhập đề từ file Excel/CSV bảng chuẩn
     • exportToMoodleXml(exam) — Xuất chuẩn Moodle XML 4.x (nhập thẳng vào Moodle/LMS)
   ============================================================ */

const LETTERS = 'ABCDEF';

function stripHtmlKeepText(html) {
  return String(html || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeXmlCdata(str) {
  return String(str || '').replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function escapeXmlAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTagContent(xml, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const m = String(xml || '').match(re);
  return m ? m[1] : '';
}

function getNestedText(block) {
  const inner = getTagContent(block, 'text');
  return stripHtmlKeepText(inner || block);
}

/**
 * Nhận diện nhanh chuỗi văn bản có phải Moodle XML hay GIFT hay Aiken không.
 */
export function detectLmsFormat(text, fileName = '') {
  const lower = String(fileName || '').toLowerCase();
  const s = String(text || '').trim();
  if (lower.endsWith('.xml') || (/<quiz\b/i.test(s) && /<question\b/i.test(s))) {
    return 'moodle_xml';
  }
  if (lower.endsWith('.gift') || /(?:^|\n)\s*(?:::[^:\n]+::\s*)?[^\n]+\{\s*(?:=[^}]+|~[^}]+|T|F|TRUE|FALSE)/m.test(s)) {
    return 'gift';
  }
  if (lower.endsWith('.aiken') || /(?:^|\n)ANSWER:\s*[A-F]\s*(?:\r?\n|$)/i.test(s)) {
    return 'aiken';
  }
  return null;
}

/**
 * Giải mã Moodle XML (<quiz><question type="...">...</question></quiz>).
 * Hỗ trợ: multichoice, truefalse, shortanswer, numerical, essay.
 */
export function parseMoodleXml(xmlText) {
  const raw = String(xmlText || '');
  const qRegex = /<question\b([^>]*)>([\s\S]*?)<\/question>/gi;
  const out = [];
  let match;
  let idx = 0;

  while ((match = qRegex.exec(raw)) !== null) {
    const attrs = match[1] || '';
    const body = match[2] || '';
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
    const mType = (typeMatch?.[1] || '').toLowerCase();
    if (!mType || mType === 'category' || mType === 'description') continue;

    const qText = getNestedText(getTagContent(body, 'questiontext'));
    if (!qText) continue;

    const generalFeedback = getNestedText(getTagContent(body, 'generalfeedback'));
    const pointsRaw = parseFloat(getTagContent(body, 'defaultgrade'));
    const points = Number.isFinite(pointsRaw) && pointsRaw > 0 ? pointsRaw : undefined;

    // Trích toàn bộ <answer fraction="...">...</answer>
    const ansRegex = /<answer\b([^>]*)>([\s\S]*?)<\/answer>/gi;
    const answers = [];
    let aMatch;
    while ((aMatch = ansRegex.exec(body)) !== null) {
      const aAttrs = aMatch[1] || '';
      const fracM = aAttrs.match(/\bfraction\s*=\s*["']([^"']+)["']/i);
      const fraction = fracM ? parseFloat(fracM[1]) : 0;
      const text = getNestedText(aMatch[2]);
      if (text) answers.push({ text, fraction });
    }

    idx += 1;
    if (mType === 'multichoice' && answers.length >= 2) {
      let correct = answers.findIndex((a) => a.fraction >= 99);
      if (correct < 0) correct = answers.findIndex((a) => a.fraction > 0);
      out.push({
        num: idx,
        type: 'single_choice',
        q: qText,
        options: answers.slice(0, 6).map((a) => a.text),
        correct: correct >= 0 ? Math.min(correct, 5) : 0,
        explain: generalFeedback,
        points: points ?? 0.25,
        src: 'Moodle XML',
      });
    } else if (mType === 'truefalse') {
      const trueAns = answers.find((a) => /^true$/i.test(a.text.trim()));
      const isTrue = trueAns ? trueAns.fraction > 0 : true;
      out.push({
        num: idx,
        type: 'single_choice',
        q: qText,
        options: ['Đúng', 'Sai'],
        correct: isTrue ? 0 : 1,
        explain: generalFeedback,
        points: points ?? 0.25,
        src: 'Moodle XML',
      });
    } else if (mType === 'shortanswer' || mType === 'numerical') {
      const best = answers.find((a) => a.fraction > 0) || answers[0];
      out.push({
        num: idx,
        type: 'short_answer',
        q: qText,
        answer: best ? best.text : '',
        explain: generalFeedback,
        points: points ?? 0.5,
        src: 'Moodle XML',
      });
    } else if (mType === 'essay') {
      out.push({
        num: idx,
        type: 'essay',
        q: qText,
        sampleAnswer: generalFeedback,
        explain: generalFeedback,
        points: points ?? 1,
        src: 'Moodle XML',
      });
    }
  }

  return out;
}

/**
 * Giải mã định dạng Aiken (phổ biến trên Moodle / ngân hàng câu hỏi văn bản):
 *   Câu hỏi...
 *   A. Đáp án 1
 *   B. Đáp án 2
 *   ANSWER: B
 */
export function parseAikenText(rawText) {
  const blocks = String(rawText || '')
    .replace(/\r/g, '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const out = [];
  let idx = 0;

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const ansLineIdx = lines.findIndex((l) => /^ANSWER:\s*[A-F]\b/i.test(l));
    if (ansLineIdx < 0) continue;

    const ansLetter = lines[ansLineIdx].match(/^ANSWER:\s*([A-F])/i)?.[1]?.toUpperCase();
    const correct = ansLetter ? LETTERS.indexOf(ansLetter) : -1;

    const qLines = [];
    const options = [];
    for (let i = 0; i < ansLineIdx; i++) {
      const optM = lines[i].match(/^([A-F])[.)]\s+(.+)$/);
      if (optM) {
        options.push(optM[2].trim());
      } else if (options.length === 0) {
        qLines.push(lines[i].replace(/^(?:Câu\s*\d+[.:)]\s*)/i, ''));
      } else {
        options[options.length - 1] += ' ' + lines[i];
      }
    }

    if (qLines.length > 0 && options.length >= 2) {
      idx += 1;
      out.push({
        num: idx,
        type: 'single_choice',
        q: qLines.join('\n').trim(),
        options: options.slice(0, 6),
        correct: correct >= 0 && correct < options.length ? correct : 0,
        explain: '',
        points: 0.25,
        src: 'Aiken',
      });
    }
  }

  return out;
}

/**
 * Giải mã định dạng Moodle GIFT (.gift):
 *   ::Q1:: Thủ đô Việt Nam là? { =Hà Nội ~TP.HCM ~Đà Nẵng ~Huế }
 *   ::Q2:: 2 + 2 = 4 {TRUE}
 *   ::Q3:: Kết quả của 3*5 là { =15 }
 */
export function parseGiftText(rawText) {
  const cleaned = String(rawText || '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

  const blocks = cleaned
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const out = [];
  let idx = 0;

  for (const block of blocks) {
    if (block.startsWith('$CATEGORY:')) continue;
    const braceStart = block.indexOf('{');
    const braceEnd = block.lastIndexOf('}');
    if (braceStart < 0 || braceEnd <= braceStart) continue;

    let stem = block
      .slice(0, braceStart)
      .replace(/^::[^:]+::\s*/, '')
      .trim();
    const tail = block.slice(braceEnd + 1).trim();
    if (tail) stem = `${stem} _____ ${tail}`.trim();
    const inner = block.slice(braceStart + 1, braceEnd).trim();
    if (!stem) continue;

    idx += 1;
    // Essay: {}
    if (!inner) {
      out.push({
        num: idx,
        type: 'essay',
        q: stem,
        points: 1,
        src: 'GIFT',
      });
      continue;
    }

    // True/False: {T}, {F}, {TRUE}, {FALSE}
    if (/^(?:T|F|TRUE|FALSE)(?:#[\s\S]*)?$/i.test(inner)) {
      const isTrue = /^T/i.test(inner);
      const fb = inner.includes('#') ? inner.split('#').slice(1).join('#').trim() : '';
      out.push({
        num: idx,
        type: 'single_choice',
        q: stem,
        options: ['Đúng', 'Sai'],
        correct: isTrue ? 0 : 1,
        explain: fb,
        points: 0.25,
        src: 'GIFT',
      });
      continue;
    }

    // Numerical {#15:0.1} or Short answer {=15}
    if (inner.startsWith('#')) {
      const numVal = inner.slice(1).split(/[:=#]/)[0].trim();
      out.push({
        num: idx,
        type: 'short_answer',
        q: stem,
        answer: numVal,
        points: 0.5,
        src: 'GIFT',
      });
      continue;
    }

    // Multiple choice or short answer (= / ~)
    const parts = inner.match(/[=~][^=~]+/g) || [];
    const hasDistractor = parts.some((p) => p.trim().startsWith('~'));
    if (!hasDistractor && parts.length >= 1) {
      const first = parts[0].slice(1).split('#')[0].trim();
      out.push({
        num: idx,
        type: 'short_answer',
        q: stem,
        answer: first,
        points: 0.5,
        src: 'GIFT',
      });
      continue;
    }

    const options = [];
    let correct = 0;
    let explain = '';
    parts.forEach((p) => {
      const isRight = p.startsWith('=');
      const [optText, ...fbParts] = p.slice(1).split('#');
      const cleanedOpt = optText.replace(/^%-?\d+(?:\.\d+)?%/, '').trim();
      if (!cleanedOpt) return;
      if (isRight) {
        correct = options.length;
        if (fbParts.length) explain = fbParts.join('#').trim();
      }
      options.push(cleanedOpt);
    });

    if (options.length >= 2) {
      out.push({
        num: idx,
        type: 'single_choice',
        q: stem,
        options: options.slice(0, 6),
        correct,
        explain,
        points: 0.25,
        src: 'GIFT',
      });
    }
  }

  return out;
}

/**
 * Giải mã câu hỏi từ mảng dòng bảng tính Excel/CSV.
 * Tự nhận diện cột theo tên tiêu đề tiếng Việt hoặc tiếng Anh:
 *   Câu hỏi / Question | A | B | C | D | Đáp án / Answer | Giải thích / Explain | Mức độ / Level | Chủ đề / Topic
 */
export function parseSpreadsheetQuestions(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const normHeader = (h) =>
    String(h || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .trim();

  const headers = rows[0].map(normHeader);
  const findCol = (patterns) =>
    headers.findIndex((h) => patterns.some((p) => (p instanceof RegExp ? p.test(h) : h === p)));

  const qCol = findCol([/^cau\s*hoi/, /^noi\s*dung/, /^question/, /^de\s*bai/, /^stem/]);
  const aCol = findCol([/^a$/, /^dap\s*an\s*a/, /^phuong\s*an\s*a/, /^option\s*a/, /^opt\s*a/]);
  const bCol = findCol([/^b$/, /^dap\s*an\s*b/, /^phuong\s*an\s*b/, /^option\s*b/, /^opt\s*b/]);
  const cCol = findCol([/^c$/, /^dap\s*an\s*c/, /^phuong\s*an\s*c/, /^option\s*c/, /^opt\s*c/]);
  const dCol = findCol([/^d$/, /^dap\s*an\s*d/, /^phuong\s*an\s*d/, /^option\s*d/, /^opt\s*d/]);
  const ansCol = findCol([/^dap\s*an(\s*dung)?$/, /^answer$/, /^key$/, /^ket\s*qua$/]);
  const expCol = findCol([/^giai\s*thich/, /^loi\s*giai/, /^explain/, /^feedback/]);
  const lvCol = findCol([/^muc\s*do/, /^level/, /^bloom/]);
  const topicCol = findCol([/^chu\s*de/, /^chuong/, /^topic/]);
  const typeCol = findCol([/^loai/, /^dang/, /^type/]);

  if (qCol < 0) return [];

  const out = [];
  let num = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const qText = String(r[qCol] ?? '').trim();
    if (!qText) continue;

    num += 1;
    const opts = [aCol, bCol, cCol, dCol]
      .filter((ci) => ci >= 0)
      .map((ci) => String(r[ci] ?? '').trim())
      .filter(Boolean);

    const rawAns = ansCol >= 0 ? String(r[ansCol] ?? '').trim() : '';
    const rawExplain = expCol >= 0 ? String(r[expCol] ?? '').trim() : '';
    const rawLv = lvCol >= 0 ? normHeader(r[lvCol]) : '';
    const rawTopic = topicCol >= 0 ? String(r[topicCol] ?? '').trim() : '';
    const rawType = typeCol >= 0 ? normHeader(r[typeCol]) : '';

    let level = 'nb';
    if (/vdc|van dung cao/.test(rawLv)) level = 'vdc';
    else if (/vd|van dung/.test(rawLv)) level = 'vd';
    else if (/th|thong hieu/.test(rawLv)) level = 'th';

    if (opts.length >= 2 && !/ngan|short|tu luan|essay/.test(rawType)) {
      const upper = rawAns.toUpperCase().replace(/[^A-F]/g, '');
      let correct = upper ? LETTERS.indexOf(upper[0]) : -1;
      if (correct < 0 && rawAns) {
        correct = opts.findIndex((o) => o.toLowerCase() === rawAns.toLowerCase());
      }
      out.push({
        num,
        type: 'single_choice',
        q: qText,
        options: opts,
        correct: correct >= 0 && correct < opts.length ? correct : 0,
        explain: rawExplain,
        level,
        topic: rawTopic,
        points: 0.25,
        src: 'Excel/CSV',
      });
    } else if (/tu luan|essay/.test(rawType)) {
      out.push({
        num,
        type: 'essay',
        q: qText,
        sampleAnswer: rawAns || rawExplain,
        explain: rawExplain,
        level,
        topic: rawTopic,
        points: 1,
        src: 'Excel/CSV',
      });
    } else {
      out.push({
        num,
        type: 'short_answer',
        q: qText,
        answer: rawAns,
        explain: rawExplain,
        level,
        topic: rawTopic,
        points: 0.5,
        src: 'Excel/CSV',
      });
    }
  }

  return out;
}

/**
 * Xuất bộ câu hỏi sang chuẩn Moodle XML 4.x (.xml) để nhập vào Moodle / LMS khác.
 */
export function exportToMoodleXml({ title = 'De-kiem-tra-ELEC-AI', subject = '', questions = [] } = {}) {
  const safeCategory = escapeXmlCdata(
    subject ? `$course$/ELEC-AI/${subject}/${title}` : `$course$/ELEC-AI/${title}`
  );
  const chunks = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<quiz>',
    '  <question type="category">',
    `    <category><text><![CDATA[${safeCategory}]]></text></category>`,
    '  </question>',
  ];

  (Array.isArray(questions) ? questions : []).forEach((q, idx) => {
    const qNum = q.num || idx + 1;
    const stem = [q.passage ? `<p>${escapeXmlAttr(q.passage)}</p>` : '', `<p>${escapeXmlAttr(q.q || q.text || '')}</p>`]
      .filter(Boolean)
      .join('\n');
    const explain = q.explain || q.sampleAnswer || '';
    const grade = Number(q.points) > 0 ? Number(q.points) : (q.type === 'essay' || q.type === 'true_false' ? 1 : 0.25);

    if (q.type === 'short_answer') {
      chunks.push(
        '  <question type="shortanswer">',
        `    <name><text>Cau ${qNum}</text></name>`,
        `    <questiontext format="html"><text><![CDATA[${escapeXmlCdata(stem)}]]></text></questiontext>`,
        `    <generalfeedback format="html"><text><![CDATA[${escapeXmlCdata(explain)}]]></text></generalfeedback>`,
        `    <defaultgrade>${grade}</defaultgrade>`,
        `    <answer fraction="100" format="moodle_auto_format"><text><![CDATA[${escapeXmlCdata(String(q.answer ?? ''))}]]></text></answer>`,
        '  </question>'
      );
      return;
    }

    if (q.type === 'essay') {
      chunks.push(
        '  <question type="essay">',
        `    <name><text>Cau ${qNum}</text></name>`,
        `    <questiontext format="html"><text><![CDATA[${escapeXmlCdata(stem)}]]></text></questiontext>`,
        `    <generalfeedback format="html"><text><![CDATA[${escapeXmlCdata(explain)}]]></text></generalfeedback>`,
        `    <defaultgrade>${grade}</defaultgrade>`,
        '    <responseformat>editor</responseformat>',
        '  </question>'
      );
      return;
    }

    if (q.type === 'true_false' && Array.isArray(q.statements) && q.statements.length > 0) {
      const subItems = q.statements
        .map((st, si) => `<p>${String.fromCharCode(97 + si)}) ${escapeXmlAttr(st.text || '')} (${st.answer === true ? 'Đúng' : st.answer === false ? 'Sai' : '—'})</p>`)
        .join('\n');
      chunks.push(
        '  <question type="essay">',
        `    <name><text>Cau ${qNum} (Dung/Sai)</text></name>`,
        `    <questiontext format="html"><text><![CDATA[${escapeXmlCdata(stem + '\n' + subItems)}]]></text></questiontext>`,
        `    <generalfeedback format="html"><text><![CDATA[${escapeXmlCdata(explain)}]]></text></generalfeedback>`,
        `    <defaultgrade>${grade}</defaultgrade>`,
        '  </question>'
      );
      return;
    }

    // Mặc định: multichoice (Trắc nghiệm nhiều lựa chọn)
    const opts = Array.isArray(q.options) ? q.options : [];
    const correctIdx = typeof q.correct === 'number' ? q.correct : 0;
    chunks.push(
      '  <question type="multichoice">',
      `    <name><text>Cau ${qNum}</text></name>`,
      `    <questiontext format="html"><text><![CDATA[${escapeXmlCdata(stem)}]]></text></questiontext>`,
      `    <generalfeedback format="html"><text><![CDATA[${escapeXmlCdata(explain)}]]></text></generalfeedback>`,
      `    <defaultgrade>${grade}</defaultgrade>`,
      '    <single>true</single>',
      '    <shuffleanswers>true</shuffleanswers>',
      '    <answernumbering>ABCD</answernumbering>'
    );
    opts.forEach((opt, oi) => {
      const frac = oi === correctIdx ? 100 : 0;
      chunks.push(
        `    <answer fraction="${frac}" format="html"><text><![CDATA[${escapeXmlCdata(opt)}]]></text></answer>`
      );
    });
    chunks.push('  </question>');
  });

  chunks.push('</quiz>');
  return chunks.join('\n');
}

/**
 * Xuất bộ câu hỏi sang định dạng Anki Flashcard TSV (.txt) chuẩn Anki / AnkiDroid 33K★.
 * Import vào Anki: File → Import → Chọn tab-separated + Allow HTML in fields.
 */
export function exportToAnkiDeckTsv({ title = 'ELEC-AI-Deck', subject = '', questions = [] } = {}) {
  const cleanCell = (s) =>
    String(s || '')
      .replace(/\t/g, ' ')
      .replace(/\r?\n/g, '<br>')
      .trim();

  const tagSlug = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_|_$/g, '');

  const baseTag = ['ELEC_AI', tagSlug(subject), tagSlug(title)].filter(Boolean).join(' ');
  const lines = [
    '#separator:tab',
    '#html:true',
    '#tags column:3',
  ];

  (Array.isArray(questions) ? questions : []).forEach((q, idx) => {
    const num = q.num || idx + 1;
    let front = `<b>Câu ${num}:</b> ${cleanCell(q.q || q.text || '')}`;
    let back = '';

    if (q.type === 'true_false' && Array.isArray(q.statements)) {
      front += '<br>' + q.statements.map((st, i) => `${String.fromCharCode(97 + i)}) ${cleanCell(st.text)}`).join('<br>');
      back = '<b>Đáp án:</b> ' + q.statements.map((st, i) => `${String.fromCharCode(97 + i)}) ${st.answer === true ? 'Đúng' : st.answer === false ? 'Sai' : '—'}`).join(' · ');
    } else if (q.type === 'short_answer') {
      back = `<b>Đáp án:</b> ${cleanCell(q.answer ?? '')}`;
    } else if (q.type === 'essay') {
      back = `<b>Hướng dẫn / Đáp án mẫu:</b><br>${cleanCell(q.sampleAnswer || q.explain || '')}`;
    } else {
      const opts = Array.isArray(q.options) ? q.options : [];
      if (opts.length) {
        front += '<br>' + opts.map((o, i) => `${LETTERS[i]}. ${cleanCell(o)}`).join('<br>');
      }
      const cIdx = typeof q.correct === 'number' ? q.correct : -1;
      const rightTxt = cIdx >= 0 && opts[cIdx] ? `${LETTERS[cIdx]}. ${cleanCell(opts[cIdx])}` : '—';
      back = `<b>Đáp án đúng:</b> ${rightTxt}`;
    }

    if (q.explain && q.type !== 'essay') {
      back += `<br><br><i>Giải thích:</i> ${cleanCell(q.explain)}`;
    }
    const qTags = [baseTag, tagSlug(q.topic), tagSlug(q.level)].filter(Boolean).join(' ');
    lines.push(`${front}\t${back}\t${qTags}`);
  });

  return lines.join('\n');
}

/**
 * Chuẩn bị dữ liệu xuất sang file Excel chuẩn Kahoot! Quiz Import Template.
 * Cột chuẩn Kahoot: Question (max 120) | Answer 1..4 (max 75) | Time limit (sec) | Correct answer(s) (1-4)
 */
export function buildKahootSpreadsheetRows(questions = [], defaultTimeSec = 30) {
  const header = [
    'Question - max 120 characters',
    'Answer 1 - max 75 characters',
    'Answer 2 - max 75 characters',
    'Answer 3 - max 75 characters',
    'Answer 4 - max 75 characters',
    'Time limit (sec) – 5, 10, 20, 30, 60, 90, 120, or 240 secs',
    'Correct answer(s) - choose at least one',
  ];
  const rows = [header];
  const mcqs = (Array.isArray(questions) ? questions : []).filter(
    (q) => (q?.type === 'single_choice' || !q?.type) && Array.isArray(q?.options) && q.options.length >= 2
  );

  mcqs.forEach((q) => {
    const opts = q.options.slice(0, 4);
    const correct1Based = typeof q.correct === 'number' && q.correct >= 0 && q.correct < opts.length ? q.correct + 1 : 1;
    rows.push([
      String(q.q || q.text || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      String(opts[0] || '').trim().slice(0, 75),
      String(opts[1] || '').trim().slice(0, 75),
      String(opts[2] || '').trim().slice(0, 75),
      String(opts[3] || '').trim().slice(0, 75),
      defaultTimeSec,
      correct1Based,
    ]);
  });

  return rows;
}
