/* ============================================================
   examParser.js — Parse đề thi từ file → câu hỏi có cấu trúc
   ------------------------------------------------------------
   Pipeline:
     1. Client extract (pdfjs / mammoth / Tesseract / FileReader)
     2. Regex parser (Câu 1…, A/B/C/D, đáp án)
     3. ≥ 80% OK → preview nhanh; không → AI fallback (batch)
   Hỗ trợ tới 500 trang.
   ============================================================ */

import { callModel, parseJsonLoose } from './examAiUtils.js';

const MAX_PAGES = 500;
const OCR_PAGE_CAP = 40;
const REGEX_OK_RATE = 0.8;
const MIN_STEM = 4;
const MIN_OPTS = 2;

const RE_Q_MARK = /(?:Câu|CÂU|Câu hỏi|Bài)\s*(\d+)\s*[.:)\-–]/gi;
const RE_Q_SPLIT = /(?:^|\n)\s*(?:Câu|CÂU|Câu hỏi|Bài)\s*(\d+)\s*[.:)\-–]\s*/gi;
const RE_NUM_SPLIT = /(?:^|\n)\s*(\d{1,3})\s*[.)]\s+(?=[A-ZÀ-Ỹ0-9$(])/g;
const RE_OPT_LINE = /^\s*([A-Fa-fĐđ])\s*[.:)\]]\s*(.+)$/;
const RE_INLINE_OPT = /(?:^|\s)([A-D])\s*[.)]\s+/g;
const RE_ANSWER_LINE = /(?:Đáp án|ĐA|ĐS|Trả lời)\s*[.:]?\s*([A-FĐ])/i;
const RE_ANSWER_INLINE = /\(?\s*(?:Đáp án|ĐA)\s*[:.]?\s*([A-F])\s*\)?/i;
const RE_EXPLAIN = /^(?:Lời giải|Giải thích|HD giải|Hướng dẫn)\s*[:.]?\s*/i;
const RE_ANSWER_KEY_HEAD = /(?:^|\n)\s*(?:ĐÁP ÁN|Đáp án|BẢNG ĐÁP ÁN|ĐÁP ÁN GỢI Ý)\s*[:.]?\s*\n/i;

function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/[ \u2000-\u200B]+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanOption(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(RE_ANSWER_INLINE, '')
    .replace(/^[.,;:]\s*/, '')
    .trim();
}

function detectLevelFromText(text) {
  const t = (text || '').toLowerCase();
  if (/vận dụng cao|vdc|sáng tạo|tổng hợp|biện luận/.test(t)) return 'vận dụng cao';
  if (/vận dụng|tính toán|áp dụng/.test(t)) return 'vận dụng';
  if (/thông hiểu|hiểu|giải thích/.test(t)) return 'thông hiểu';
  return 'nhận biết';
}

function letterIndex(ch) {
  const c = String(ch || '').toUpperCase();
  if (c === 'Đ') return -2;
  return 'ABCDEF'.indexOf(c);
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    const err = new Error('Đã hủy.');
    err.name = 'AbortError';
    throw err;
  }
}

function countQuestionMarkers(text) {
  const marks = text.match(/(?:Câu|CÂU|Câu hỏi|Bài)\s*\d+\s*[.:)\-–]/gi) || [];
  return new Set(marks.map((m) => m.replace(/\s+/g, ' ').toLowerCase())).size || marks.length;
}

/* ============================================================
   1. ĐỌC TEXT TỪ FILE
   ============================================================ */
export async function extractTextFromFile(file, onProgress, signal) {
  if (!file) throw new Error('Không có file.');
  throwIfAborted(signal);
  const name = (file.name || '').toLowerCase();
  const type = file.type || '';

  if (type.startsWith('text/') || /\.(txt|md)$/i.test(name)) {
    onProgress?.({ stage: 'reading', percent: 10 });
    const text = await file.text();
    onProgress?.({ stage: 'reading', percent: 45 });
    return { kind: 'text', text: normalizeText(text), pages: 1, imagePages: 0 };
  }

  if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
    return extractFromPDF(file, onProgress, signal);
  }

  if (/\.docx$/i.test(name)) {
    return extractFromWord(file, onProgress, signal);
  }
  if (/\.doc$/i.test(name)) {
    throw new Error('File .doc cũ không hỗ trợ. Hãy lưu lại thành .docx rồi tải lên.');
  }

  if (type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(name)) {
    return extractFromImage(file, onProgress, signal);
  }

  throw new Error(`Định dạng không hỗ trợ: ${file.name}`);
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  try {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

function itemsToText(items) {
  if (!items?.length) return '';
  let lastY = null;
  const lines = [];
  let line = '';
  for (const it of items) {
    const str = String(it.str || '');
    if (!str) continue;
    const y = it.transform ? it.transform[5] : 0;
    if (lastY != null && Math.abs(y - lastY) > 3.5) {
      if (line.trim()) lines.push(line.trim());
      line = str;
    } else {
      const needSpace = line && !/\s$/.test(line) && !/^\s/.test(str);
      line += (needSpace ? ' ' : '') + str;
    }
    lastY = y;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n');
}

async function pageToCanvas(page, scale = 1.6) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(viewport.width, 1600);
  canvas.height = Math.round(viewport.height * (canvas.width / viewport.width));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const fit = page.getViewport({ scale: canvas.width / viewport.width * scale });
  canvas.height = Math.round(fit.height);
  await page.render({ canvasContext: ctx, viewport: fit }).promise;
  return canvas;
}

async function extractFromPDF(file, onProgress, signal) {
  onProgress?.({ stage: 'reading', percent: 5 });
  const pdfjs = await loadPdfJs();
  throwIfAborted(signal);
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;
  if (totalPages > MAX_PAGES) {
    throw new Error(`PDF có ${totalPages} trang (tối đa ${MAX_PAGES}). Hãy chia file nhỏ hơn.`);
  }

  onProgress?.({ stage: 'reading', percent: 8, totalPages });

  let fullText = '';
  let imagePages = 0;
  const scanIndexes = [];

  for (let i = 1; i <= totalPages; i++) {
    throwIfAborted(signal);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = itemsToText(content.items);
    if (text.replace(/\s/g, '').length < 25) {
      imagePages++;
      scanIndexes.push(i);
    }
    fullText += (text ? text : '') + '\n\n';
    if (i % 3 === 0 || i === totalPages) {
      onProgress?.({
        stage: 'reading',
        percent: 8 + Math.round((i / totalPages) * 32),
        current: i,
        totalPages,
      });
    }
  }

  const scannedHeavy = imagePages > totalPages * 0.45 || fullText.replace(/\s/g, '').length < 80;
  if (scannedHeavy && scanIndexes.length) {
    const toOcr = scanIndexes.slice(0, OCR_PAGE_CAP);
    let ocrText = '';
    for (let n = 0; n < toOcr.length; n++) {
      throwIfAborted(signal);
      onProgress?.({
        stage: 'reading',
        percent: 40 + Math.round((n / toOcr.length) * 15),
        message: `OCR trang ${toOcr[n]}/${totalPages}...`,
      });
      try {
        const page = await pdf.getPage(toOcr[n]);
        const canvas = await pageToCanvas(page);
        ocrText += '\n' + await ocrSource(canvas, null);
      } catch (e) {
        console.warn('[examParser] OCR page fail', toOcr[n], e);
      }
    }
    if (ocrText.trim().length > fullText.trim().length) fullText = ocrText;
    else fullText += '\n' + ocrText;
    if (scanIndexes.length > OCR_PAGE_CAP) {
      fullText += `\n\n[Chỉ OCR ${OCR_PAGE_CAP}/${scanIndexes.length} trang scan. Phần còn lại dùng AI nếu cần.]`;
    }
  }

  return {
    kind: scannedHeavy ? 'scanned-pdf' : 'text',
    text: normalizeText(fullText),
    pages: totalPages,
    imagePages,
  };
}

async function extractFromWord(file, onProgress, signal) {
  onProgress?.({ stage: 'reading', percent: 18 });
  throwIfAborted(signal);
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  onProgress?.({ stage: 'reading', percent: 45 });
  return { kind: 'text', text: normalizeText(result.value), pages: 1, imagePages: 0 };
}

async function ocrSource(source, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('vie+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress({ stage: 'reading', percent: 22 + Math.round((m.progress || 0) * 28) });
      }
    },
  });
  try {
    const { data } = await worker.recognize(source);
    return String(data?.text || '');
  } finally {
    await worker.terminate();
  }
}

async function extractFromImage(file, onProgress, signal) {
  onProgress?.({ stage: 'reading', percent: 12 });
  throwIfAborted(signal);
  try {
    const text = await ocrSource(file, onProgress);
    if (text.replace(/\s/g, '').length >= 20) {
      return { kind: 'text', text: normalizeText(text), pages: 1, imagePages: 1 };
    }
  } catch (e) {
    console.warn('[examParser] Tesseract fail, AI OCR', e);
  }

  onProgress?.({ stage: 'ai', percent: 55 });
  const { compressImage } = await import('./ai.js');
  const compressed = await compressImage(file);
  const raw = await callModel({
    system: `Bạn là OCR đề thi Việt Nam. Trả JSON {"text":"..."} gồm TOÀN BỘ chữ trong ảnh.
Giữ nguyên format Câu 1 / A. B. C. D. / Đáp án.`,
    parts: [{ inlineData: { mimeType: compressed.mimeType, data: compressed.base64 } }],
    temperature: 0.1,
    signal,
  });
  const parsed = parseJsonLoose(raw);
  const text = typeof parsed === 'string' ? parsed : (parsed?.text || raw);
  return { kind: 'text', text: normalizeText(text), pages: 1, imagePages: 1 };
}

/* ============================================================
   2. REGEX PARSER
   ============================================================ */
function splitAnswerKey(text) {
  const m = text.match(RE_ANSWER_KEY_HEAD);
  if (!m || m.index < 40) return { body: text, answerMap: {} };
  const body = text.slice(0, m.index);
  const keyPart = text.slice(m.index);
  const answerMap = {};
  const re = /(\d{1,3})\s*[.:)\-–]\s*([A-FĐ])/gi;
  let hit;
  while ((hit = re.exec(keyPart))) {
    answerMap[Number(hit[1])] = hit[2].toUpperCase();
  }
  return { body, answerMap };
}

function parseOptionsFromBlock(block) {
  const options = [];
  let leftoverExplain = '';
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const lineOpts = [];
  const rest = [];

  for (const line of lines) {
    const om = line.match(RE_OPT_LINE);
    if (om) {
      const idx = letterIndex(om[1]);
      if (idx >= 0 && idx < 6) {
        lineOpts[idx] = cleanOption(om[2]);
        continue;
      }
    }
    if (lineOpts.filter(Boolean).length >= 2) rest.push(line);
    else rest.push(line);
  }

  if (lineOpts.filter(Boolean).length >= MIN_OPTS) {
    for (let i = 0; i < 6; i++) {
      if (lineOpts[i]) options.push(lineOpts[i]);
      else if (lineOpts.slice(i).some(Boolean)) options.push('');
    }
    leftoverExplain = rest.join(' ');
    return { options: options.filter((o, i) => o || i < 2), leftoverExplain, stemLines: [] };
  }

  const joined = lines.join(' ');
  const positions = [];
  RE_INLINE_OPT.lastIndex = 0;
  let im;
  while ((im = RE_INLINE_OPT.exec(joined))) {
    positions.push({ letter: im[1].toUpperCase(), index: im.index, end: im.index + im[0].length });
  }
  if (positions.length >= MIN_OPTS) {
    const stem = joined.slice(0, positions[0].index).trim();
    positions.forEach((p, i) => {
      const end = i + 1 < positions.length ? positions[i + 1].index : joined.length;
      const idx = letterIndex(p.letter);
      if (idx >= 0) options[idx] = cleanOption(joined.slice(p.end, end));
    });
    return {
      options: options.filter(Boolean),
      leftoverExplain: '',
      stemLines: stem ? [stem] : [],
    };
  }

  return { options: [], leftoverExplain: '', stemLines: lines };
}

function finalizeQuestion(raw, answerMap) {
  const options = [];
  let newCorrect = -1;
  (raw.options || []).forEach((opt, i) => {
    if (opt && String(opt).trim()) {
      if (i === raw.correct) newCorrect = options.length;
      options.push(String(opt).trim());
    }
  });

  if (newCorrect < 0 && raw.num && answerMap[raw.num]) {
    const idx = letterIndex(answerMap[raw.num]);
    if (idx >= 0 && idx < options.length) newCorrect = idx;
  }

  const needsAnswer = newCorrect < 0;
  if (needsAnswer && options.length) newCorrect = 0;

  return {
    q: String(raw.q || '').trim(),
    options,
    correct: newCorrect < 0 ? 0 : newCorrect,
    explain: String(raw.explain || '').trim(),
    level: raw.level || detectLevelFromText(raw.q),
    num: raw.num,
    points: 1,
    _source: 'regex',
    _needsAnswer: needsAnswer,
    _ok: String(raw.q || '').trim().length >= MIN_STEM && options.length >= MIN_OPTS,
  };
}

function parseBySplit(text, splitRe, answerMap) {
  const questions = [];
  const matches = [];
  const re = new RegExp(splitRe.source, splitRe.flags);
  let m;
  while ((m = re.exec(text))) {
    matches.push({ num: parseInt(m[1], 10), index: m.index, end: m.index + m[0].length });
  }
  if (matches.length < 1) return questions;

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const stop = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const chunk = text.slice(start, stop).trim();
    if (!chunk) continue;

    let correct = -1;
    let explain = '';
    const ans = chunk.match(RE_ANSWER_LINE);
    const inline = chunk.match(RE_ANSWER_INLINE);
    if (ans) correct = letterIndex(ans[1]);
    else if (inline) correct = letterIndex(inline[1]);

    const { options, leftoverExplain, stemLines } = parseOptionsFromBlock(
      chunk.replace(RE_ANSWER_LINE, '').replace(RE_EXPLAIN, '')
    );
    let stem = stemLines.join(' ').trim();
    if (!stem) {
      const firstOptAt = chunk.search(/(?:^|\n)\s*[A-Da-d]\s*[.:)\]]\s+/);
      stem = (firstOptAt > 0 ? chunk.slice(0, firstOptAt) : chunk.split('\n')[0] || '').trim();
    }
    if (leftoverExplain && RE_EXPLAIN.test(leftoverExplain)) {
      explain = leftoverExplain.replace(RE_EXPLAIN, '').trim();
    } else if (leftoverExplain && leftoverExplain.length < 400 && options.length >= MIN_OPTS) {
      const maybeExp = leftoverExplain.match(RE_EXPLAIN);
      if (maybeExp) explain = leftoverExplain.replace(RE_EXPLAIN, '').trim();
    }

    const q = finalizeQuestion({
      num: matches[i].num,
      q: stem,
      options,
      correct,
      explain,
      level: '',
    }, answerMap);
    if (q.q) questions.push(q);
  }
  return questions;
}

export function parseQuestionsFromText(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const { body, answerMap } = splitAnswerKey(normalized);

  let questions = parseBySplit(body, RE_Q_SPLIT, answerMap);
  const ok = questions.filter((q) => q._ok).length;
  if (ok < 2) {
    const numbered = parseBySplit(body, RE_NUM_SPLIT, answerMap);
    if (numbered.filter((q) => q._ok).length > ok) questions = numbered;
  }

  return questions.filter((q) => q.q);
}

/* ============================================================
   3. AI FALLBACK — chia batch
   ============================================================ */
export async function parseQuestionsWithAI(text, { onProgress, signal } = {}) {
  const MAX_CHUNK = 11000;
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    let chunk = remaining.slice(0, MAX_CHUNK);
    if (remaining.length > MAX_CHUNK) {
      const lastQ = Math.max(chunk.lastIndexOf('Câu '), chunk.lastIndexOf('\nCâu'));
      if (lastQ > MAX_CHUNK * 0.45) chunk = chunk.slice(0, lastQ);
    }
    chunks.push(chunk);
    remaining = remaining.slice(chunk.length);
  }

  const allQuestions = [];
  for (let i = 0; i < chunks.length; i++) {
    throwIfAborted(signal);
    onProgress?.({
      stage: 'ai',
      percent: 62 + Math.round((i / Math.max(chunks.length, 1)) * 32),
      current: i + 1,
      total: chunks.length,
    });
    try {
      const raw = await callModel({
        system: `Bạn parse đề thi Việt Nam thành JSON array.
Mỗi phần tử:
{"q":"nội dung","options":["A","B","C","D"],"correct":0,"explain":"","level":"nhận biết"}
correct là chỉ số 0-3. Không markdown. Nếu không có câu hỏi trả về [].`,
        parts: [{ text: chunks[i] }],
        temperature: 0.15,
        signal,
      });
      const parsed = parseJsonLoose(raw);
      const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.questions) ? parsed.questions : []);
      list.forEach((q) => {
        if (q?.q && Array.isArray(q.options) && q.options.length >= MIN_OPTS) {
          allQuestions.push({
            q: String(q.q).trim(),
            options: q.options.map((o) => String(o || '').trim()).filter(Boolean),
            correct: Number.isInteger(q.correct) ? q.correct : 0,
            explain: String(q.explain || ''),
            level: q.level || detectLevelFromText(q.q),
            points: 1,
            _source: 'ai',
            _ok: true,
            _needsAnswer: !Number.isInteger(q.correct),
          });
        }
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      console.warn(`[examParser] AI chunk ${i + 1} fail:`, e.message);
    }
  }
  return allQuestions;
}

function qualityRate(questions, expected) {
  const ok = (questions || []).filter((q) => q._ok !== false && (q.options || []).length >= MIN_OPTS && (q.q || '').trim().length >= MIN_STEM).length;
  const denom = Math.max(expected, questions.length, 1);
  if (expected > 0) return ok / expected;
  return questions.length ? ok / denom : 0;
}

/* ============================================================
   4. HYBRID
   ============================================================ */
export async function parseExamFile(file, { onProgress, signal } = {}) {
  onProgress?.({ stage: 'extracting', percent: 4 });
  const { text, pages, imagePages, kind } = await extractTextFromFile(file, onProgress, signal);

  if (!text || text.replace(/\s/g, '').length < 10) {
    throw new Error('Không đọc được nội dung trong file. Thử file khác hoặc ảnh rõ hơn.');
  }

  onProgress?.({ stage: 'regex', percent: 52 });
  const regexQuestions = parseQuestionsFromText(text);
  const expectedCount = countQuestionMarkers(text);
  const successRate = qualityRate(regexQuestions, expectedCount);

  let finalQuestions = regexQuestions;
  let usedAI = false;
  let warning = '';

  const needAI = successRate < REGEX_OK_RATE || regexQuestions.filter((q) => q._ok).length === 0 || kind === 'scanned-pdf' && successRate < 0.9;

  if (needAI) {
    onProgress?.({ stage: 'ai', percent: 62 });
    try {
      const aiQuestions = await parseQuestionsWithAI(text, { onProgress, signal });
      usedAI = aiQuestions.length > 0;
      if (aiQuestions.length > regexQuestions.filter((q) => q._ok).length) {
        finalQuestions = aiQuestions;
      } else if (regexQuestions.length) {
        const nums = new Set(regexQuestions.map((q) => q.num).filter(Boolean));
        aiQuestions.forEach((q, idx) => {
          if (q.num ? !nums.has(q.num) : !nums.has(idx + 1)) finalQuestions.push(q);
        });
      } else {
        finalQuestions = aiQuestions;
      }
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      warning = regexQuestions.length
        ? `Regex tách được một phần; AI không chạy được: ${e.message}`
        : e.message;
      if (!regexQuestions.length) throw e;
    }
  }

  const cleaned = finalQuestions.filter((q) => (q.q || '').trim() && (q.options || []).length >= MIN_OPTS);
  onProgress?.({ stage: 'done', percent: 100 });

  if (!cleaned.length) {
    throw new Error('Không tách được câu hỏi. File nên có dạng: Câu 1: ... / A. ... / B. ... / Đáp án: A');
  }

  return {
    questions: cleaned.map((q, i) => ({ ...q, num: q.num || i + 1 })),
    stats: {
      total: cleaned.length,
      expected: expectedCount,
      successRate: Math.round(qualityRate(cleaned, expectedCount) * 100),
      fromRegex: cleaned.filter((q) => q._source === 'regex').length,
      fromAI: cleaned.filter((q) => q._source === 'ai').length,
      usedAI,
      pages,
      imagePages,
      warning,
      kind,
    },
  };
}
