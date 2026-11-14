/* ============================================================
   examParser.js — Parse đề thi từ file → câu hỏi có cấu trúc
   ------------------------------------------------------------
   v4 (tối ưu tốc độ + độ chính xác):
     • Regex đa dạng: 1/, 1-, 1), 1., 1:, Câu, Bài, Question
     • Merge multi-line options (A. wrap dòng).
     • AI fallback chạy SONG SONG (parallel) — nhanh gấp 3-5 lần.
     • Chỉ gọi AI khi THỰC SỰ cần (successRate < 50% hoặc >3 câu lỗi).
     • AI chỉ nhận phần text CHƯA parse được — tiết kiệm token.
     • Merge thông minh: giữ regex nếu tốt, bổ sung AI nếu thiếu.
     • Timeout 45s/call AI — không treo UI.
   Hỗ trợ tới 500 trang.
   ============================================================ */

import { callModel, parseJsonLoose } from './examAiUtils.js';
import { parseExamDocxFile, parseLines, textToLines } from './examDocxParser.js';
import { readExamPdfFile } from './pdfExamReader.js';
import { detectExamSubjectAndGrade } from './subjectClassifier.js';

const MAX_PAGES = 500;
const OCR_PAGE_CAP = 40;
const REGEX_OK_RATE = 0.8;        // >= 80% coi là OK, không gọi AI
const REGEX_FALLBACK_RATE = 0.5;  // < 50% gọi AI toàn bộ
const AI_TIMEOUT_MS = 45000;      // 45s cho mỗi call AI
const MIN_STEM = 4;
const MIN_OPTS = 2;

/* ============================================================
   REGEX PATTERNS
   ============================================================ */
const RE_Q_MARK = /(?:Câu|CÂU|Câu hỏi|Bài|BÀI|Question|QUESTION)\s*(\d+)\s*[.:)\-–]/gi;

const RE_Q_SPLIT = /(?:^|\n)\s*(?:Câu|CÂU|Câu hỏi|Bài|BÀI|Question|QUESTION)\s*(\d+)\s*[.:)\-–]\s*/g;

const RE_NUM_SPLIT = /(?:^|\n)\s*(\d{1,3})\s*[.):\-/]\s+(?=[A-ZÀ-ỸĐ0-9$(])/g;

const RE_OPT_LINE = /^\s*\(?([A-Fa-fĐđ])\)?\s*[.:)\-\]]\s*(.+)$/;

const RE_INLINE_OPT = /(?:^|\s)([A-D])\s*[.)]\s+/g;

const RE_ANSWER_LINE = /(?:Đáp\s*án(?:\s*đúng)?|ĐA|ĐS|Đ\/A|Trả\s*lời)\s*[:.\-]?\s*([A-FĐ])/i;
const RE_ANSWER_INLINE = /\(?\s*(?:Đáp\s*án(?:\s*đúng)?|ĐA|Đ\/A)\s*[:.]?\s*([A-FĐ])\s*\)?/i;

const RE_EXPLAIN = /^(?:Lời\s*giải|Giải\s*thích|HD\s*giải|Hướng\s*dẫn\s*giải|Hướng\s*dẫn|HD)\s*[:.]?\s*/i;

const RE_ANSWER_KEY_HEAD = /(?:^|\n)\s*(?:ĐÁP\s*ÁN|Đáp\s*án|BẢNG\s*ĐÁP\s*ÁN|ĐÁP\s*ÁN\s*GỢI\s*Ý|ANSWER\s*KEY)\s*[:.]?\s*\n/i;

/* ============================================================
   NORMALIZE
   ============================================================ */
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
  const marks1 = text.match(/(?:Câu|CÂU|Câu hỏi|Bài|BÀI)\s*\d+\s*[.:)\-–]/gi) || [];
  const marks2 = text.match(/(?:^|\n)\s*\d{1,3}\s*[.):\-/]\s+(?=[A-ZÀ-ỸĐ0-9$(])/g) || [];
  const set = new Set();
  marks1.forEach((m) => set.add(m.trim().toLowerCase()));
  marks2.forEach((m) => set.add(m.trim().toLowerCase()));
  return Math.max(set.size, marks1.length, marks2.length);
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

async function extractFromPDF(file, onProgress, signal) {
  onProgress?.({ stage: 'reading', percent: 5 });
  throwIfAborted(signal);
  const res = await readExamPdfFile(file, {
    maxPages: MAX_PAGES,
    ocrFallback: true,
    ocrPageCap: OCR_PAGE_CAP,
    onProgress: (p) => {
      onProgress?.({
        stage: 'reading',
        percent: Math.min(48, Math.round((p?.percent || 10) * 0.48)),
        current: p?.page,
        totalPages: p?.total,
      });
    },
    signal,
  });

  if (res.totalPdfPages > MAX_PAGES) {
    throw new Error(`PDF có ${res.totalPdfPages} trang (tối đa ${MAX_PAGES}). Hãy chia file nhỏ hơn.`);
  }

  return {
    kind: res.usedOcr ? 'scanned-pdf' : 'pdf',
    text: normalizeText(res.text),
    lines: res.lines || [],
    pages: res.pages,
    imagePages: res.scannedPages.length + res.garbledPages.length,
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
  const raw = await callModelWithTimeout({
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
   AI HELPER — Timeout
   ============================================================ */
async function callModelWithTimeout(params, timeoutMs = AI_TIMEOUT_MS) {
  let timeoutId;
  try {
    return await Promise.race([
      callModel(params),
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`AI timeout sau ${Math.round(timeoutMs / 1000)}s`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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
  const re = /(\d{1,3})\s*[.:)\-–\s]\s*([A-FĐ])/gi;
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

  // Bước 1: Parse option theo dòng
  const lineOpts = [];
  let lastOptIdx = -1;
  const restLines = [];

  for (const line of lines) {
    const om = line.match(RE_OPT_LINE);
    if (om) {
      const idx = letterIndex(om[1]);
      if (idx >= 0 && idx < 6) {
        lineOpts[idx] = cleanOption(om[2]);
        lastOptIdx = idx;
        continue;
      }
    }
    if (lastOptIdx >= 0 && lineOpts[lastOptIdx] !== undefined) {
      lineOpts[lastOptIdx] += ' ' + line;
      continue;
    }
    restLines.push(line);
  }

  const filledOpts = lineOpts.filter(Boolean);
  if (filledOpts.length >= MIN_OPTS) {
    for (let i = 0; i < 6; i++) {
      if (lineOpts[i] !== undefined) options.push(lineOpts[i]);
    }
    leftoverExplain = restLines.join(' ');
    return { options, leftoverExplain, stemLines: [] };
  }

  // Bước 2: Fallback — option inline
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

  const qSplits = parseBySplit(body, RE_Q_SPLIT, answerMap);
  const ok1 = qSplits.filter((q) => q._ok).length;

  const numSplits = parseBySplit(body, RE_NUM_SPLIT, answerMap);
  const ok2 = numSplits.filter((q) => q._ok).length;

  const questions = ok2 > ok1 ? numSplits : qSplits;
  return questions.filter((q) => q.q);
}

/* ============================================================
   2b. LỌC TEXT CHƯA PARSE ĐƯỢC
   ============================================================ */
function extractUnparsedText(fullText, parsedQuestions) {
  if (!parsedQuestions.length) return fullText;

  const parsedNums = new Set(parsedQuestions.map((q) => q.num).filter(Boolean));
  const lines = fullText.split('\n');
  const unparsedLines = [];
  let inParsedBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(/(?:^|\s)(?:Câu|Bài|Câu hỏi)?\s*(\d{1,3})\s*[.:)\-–]/);
    const num = m ? parseInt(m[1], 10) : null;

    if (num !== null && parsedNums.has(num)) {
      inParsedBlock = true;
      continue;
    }

    if (inParsedBlock) {
      const nextM = line.match(/(?:^|\s)(?:Câu|Bài|Câu hỏi)?\s*(\d{1,3})\s*[.:)\-–]/);
      const nextNum = nextM ? parseInt(nextM[1], 10) : null;
      if (nextNum !== null && !parsedNums.has(nextNum)) {
        inParsedBlock = false;
        unparsedLines.push(line);
      }
      continue;
    }

    unparsedLines.push(line);
  }

  return unparsedLines.join('\n').trim();
}

/* ============================================================
   3. AI FALLBACK — SONG SONG
   ============================================================ */
export async function parseQuestionsWithAI(text, { onProgress, signal, existingQuestions = [] } = {}) {
  const MAX_CHUNK = 11000;

  const textToParse = existingQuestions.length
    ? extractUnparsedText(text, existingQuestions)
    : text;

  if (!textToParse || textToParse.trim().length < 20) {
    return [];
  }

  const chunks = [];
  let remaining = textToParse;
  while (remaining.length > 0) {
    let chunk = remaining.slice(0, MAX_CHUNK);
    if (remaining.length > MAX_CHUNK) {
      const lastQ = Math.max(chunk.lastIndexOf('Câu '), chunk.lastIndexOf('\nCâu'));
      if (lastQ > MAX_CHUNK * 0.45) chunk = chunk.slice(0, lastQ);
    }
    chunks.push(chunk);
    remaining = remaining.slice(chunk.length);
  }

  // ⭐ Chạy SONG SONG với Promise.all
  let done = 0;
  const existingNums = existingQuestions.map((q) => q.num).filter(Boolean).join(', ');

  onProgress?.({
    stage: 'ai',
    percent: 62,
    current: 0,
    total: chunks.length,
    message: `Đang gọi AI song song ${chunks.length} chunks...`,
  });

  const results = await Promise.all(
    chunks.map(async (chunk, i) => {
      throwIfAborted(signal);
      try {
        const raw = await callModelWithTimeout({
          system: `Bạn parse đề thi Việt Nam thành JSON array.
Mỗi phần tử:
{"num":1,"q":"nội dung","options":["A","B","C","D"],"correct":0,"explain":"","level":"nhận biết"}
correct là chỉ số 0-3.
${existingNums ? `Các câu sau ĐÃ TÁCH ĐƯỢC, KHÔNG trả lại: ${existingNums}` : ''}
Chỉ trả về JSON array, không markdown. Nếu không có câu hỏi trả về [].`,
          parts: [{ text: chunk }],
          temperature: 0.15,
          signal,
        });
        const parsed = parseJsonLoose(raw);
        const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.questions) ? parsed.questions : []);

        done++;
        onProgress?.({
          stage: 'ai',
          percent: 62 + Math.round((done / chunks.length) * 32),
          current: done,
          total: chunks.length,
          message: `AI đã xong ${done}/${chunks.length} chunks`,
        });

        return list
          .filter((q) => q?.q && Array.isArray(q.options) && q.options.length >= MIN_OPTS)
          .map((q) => ({
            q: String(q.q).trim(),
            options: q.options.map((o) => String(o || '').trim()).filter(Boolean),
             /* ❗ KHÔNG mặc định 0: mặc định 0 nghĩa là "đáp án A", khiến mọi
                đề nhập từ file mà không đọc được đáp án đều chấm sai toàn bộ
                (học sinh chọn B/C/D đúng vẫn 0 điểm). -1 = chưa xác định,
                ExamCreateForm sẽ bắt giáo viên chọn đáp án trước khi lưu. */
             correct: (() => {
               if (Number.isInteger(q.correct) && q.correct >= 0) return q.correct;
               const raw = typeof q.correct === 'string' ? q.correct : q.answer;
               if (typeof raw === 'string') {
                 const idx = 'ABCDEF'.indexOf(raw.trim().toUpperCase()[0] || '');
                 if (idx >= 0) return idx;
               }
               return -1;
             })(),
            explain: String(q.explain || ''),
            level: q.level || detectLevelFromText(q.q),
            num: Number.isInteger(q.num) ? q.num : undefined,
            points: 1,
            _source: 'ai',
            _ok: true,
             _needsAnswer: !(Number.isInteger(q.correct) && q.correct >= 0)
               && !(typeof q.answer === 'string' && 'ABCDEF'.indexOf(q.answer.trim().toUpperCase()[0] || '') >= 0),
          }));
      } catch (e) {
        if (e?.name === 'AbortError') throw e;
        console.warn(`[examParser] AI chunk ${i + 1} fail:`, e.message);
        done++;
        onProgress?.({
          stage: 'ai',
          percent: 62 + Math.round((done / chunks.length) * 32),
          current: done,
          total: chunks.length,
          message: `AI lỗi chunk ${i + 1}, tiếp tục...`,
        });
        return [];
      }
    })
  );

  return results.flat();
}

/* ============================================================
   4. MERGE
   ============================================================ */
function mergeQuestions(regexQ, aiQ) {
  const byNum = new Map();

  for (const q of regexQ) {
    if (q.num) byNum.set(q.num, q);
  }

  for (const aq of aiQ) {
    if (!aq.num || !byNum.has(aq.num)) {
      if (!aq.num) byNum.set(`ai-${byNum.size}`, aq);
      else byNum.set(aq.num, aq);
      continue;
    }
    const existing = byNum.get(aq.num);
    const existingScore = (existing.options?.length || 0) * 10 + (existing._needsAnswer ? 0 : 5) + (existing.q?.length || 0);
    const aiScore = (aq.options?.length || 0) * 10 + (aq._needsAnswer ? 0 : 5) + (aq.q?.length || 0);
    if (aiScore > existingScore) {
      byNum.set(aq.num, aq);
    }
  }

  return [...byNum.values()].sort((a, b) => {
    const an = a.num ?? 9999;
    const bn = b.num ?? 9999;
    return an - bn;
  });
}

function qualityRate(questions, expected) {
  const ok = (questions || []).filter((q) => {
    if (q._ok === false) return false;
    const hasStem = (q.q || '').trim().length >= MIN_STEM || Boolean(q.image) || (q.images && q.images.length > 0);
    const isP1 = (q.options || []).length >= MIN_OPTS;
    const isP2 = q.part === 2 || q.type === 'true_false' || (Array.isArray(q.statements) && q.statements.length > 0);
    const isP3 = q.part === 3 || q.type === 'short_answer' || Boolean(q.answer);
    return hasStem && (isP1 || isP2 || isP3);
  }).length;
  const denom = Math.max(expected, questions.length, 1);
  if (expected > 0) return ok / expected;
  return questions.length ? ok / denom : 0;
}

/* ============================================================
   5. HYBRID — MAIN PIPELINE
   ============================================================ */
export async function parseExamFile(file, { onProgress, signal } = {}) {
  const t0 = performance.now();
  if (!file) throw new Error('Không có file.');
  throwIfAborted(signal);

  const fileName = (file.name || '').toLowerCase();

  // NÂNG CẤP V4: Với file .docx, ưu tiên bộ parser chuyên sâu examDocxParser
  // Trích xuất 100% hình ảnh (kể cả ảnh nổi wp:anchor), công thức OMML và chuẩn 3 phần GDPT 2025
  if (/\.docx$/i.test(fileName)) {
    onProgress?.({ stage: 'reading', percent: 25 });
    const docxResult = await parseExamDocxFile(file);
    onProgress?.({ stage: 'done', percent: 100 });
    const elapsedMs = Math.round(performance.now() - t0);
    return {
      questions: (docxResult.questions || []).map((q, i) => ({
        ...q,
        num: q.num || i + 1,
        part: q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1),
        type: q.type || (q.part === 2 ? 'true_false' : q.part === 3 ? 'short_answer' : 'single_choice'),
        points: q.points || (q.part === 2 ? 1.0 : q.part === 3 ? 0.25 : 0.25),
      })),
      subject: docxResult.subject,
      grade: docxResult.grade,
      text: docxResult.text,
      extractedImages: docxResult.extractedImages || [],
      formulaCount: docxResult.formulaCount || 0,
      stats: {
        ...docxResult.stats,
        usedAI: false,
        elapsedMs,
      },
    };
  }

  onProgress?.({ stage: 'extracting', percent: 4 });
  const { text, lines: pdfLines, pages, imagePages, kind } = await extractTextFromFile(file, onProgress, signal);

  if (!text || text.replace(/\s/g, '').length < 10) {
    throw new Error('Không đọc được nội dung trong file. Thử file khác hoặc ảnh rõ hơn.');
  }

  onProgress?.({ stage: 'regex', percent: 52 });
  // Ưu tiên bộ parser GDPT 2025 thống nhất (3 phần + gạch chân/màu PDF + bảng 2 cột)
  let regexQuestions = [];
  try {
    const docLines = pdfLines?.length ? pdfLines : textToLines(text);
    const parsedDoc = parseLines(docLines, []);
    if (parsedDoc?.questions?.length) {
      regexQuestions = parsedDoc.questions.map((q, idx) => {
        const type = q.type === 'true_false' || q.type === 'tf'
          ? 'true_false'
          : q.type === 'short_answer' || q.type === 'sa'
            ? 'short_answer'
            : 'single_choice';
        const part = type === 'true_false' ? 2 : type === 'short_answer' ? 3 : 1;
        const ok =
          type === 'true_false'
            ? Boolean(q.q && q.statements?.length >= 2)
            : type === 'short_answer'
              ? Boolean(q.q)
              : Boolean(q.q && (q.options || []).length >= MIN_OPTS);
        const needsAnswer =
          type === 'true_false'
            ? !q.statements?.some((s) => s.answer !== null)
            : type === 'short_answer'
              ? !q.answer
              : q.correct == null || q.correct < 0;
        return {
          ...q,
          num: q.num || idx + 1,
          part,
          type,
          options: q.options || [],
          correct: typeof q.correct === 'number' ? q.correct : -1,
          points: q.points || (part === 2 ? 1.0 : 0.25),
          _ok: ok,
          _needsAnswer: needsAnswer,
        };
      });
    }
  } catch { /* fallback bên dưới */ }

  if (!regexQuestions.length) {
    regexQuestions = parseQuestionsFromText(text);
  }
  const expectedCount = Math.max(countQuestionMarkers(text), regexQuestions.length);
  const successRate = qualityRate(regexQuestions, expectedCount);

  let finalQuestions = regexQuestions;
  let usedAI = false;
  let warning = '';

  const lowQuality = regexQuestions.filter((q) => {
    if (q.type === 'true_false') return !q.statements?.length || q.statements.every((s) => s.answer === null);
    if (q.type === 'short_answer') return !q.answer;
    return q._needsAnswer || (q.options || []).length < 4;
  });

  const needAI =
    successRate < REGEX_FALLBACK_RATE ||
    regexQuestions.filter((q) => q._ok).length === 0 ||
    lowQuality.length > 3 ||
    (kind === 'scanned-pdf' && successRate < 0.9);

  if (needAI) {
    onProgress?.({ stage: 'ai', percent: 62 });
    try {
      const aiQuestions = await parseQuestionsWithAI(text, {
        onProgress,
        signal,
        existingQuestions: regexQuestions,
      });
      usedAI = aiQuestions.length > 0;

      finalQuestions = mergeQuestions(regexQuestions, aiQuestions);

      if (aiQuestions.length === 0 && regexQuestions.length > 0) {
        warning = `Regex tách được ${regexQuestions.length}/${expectedCount} câu, AI không tìm thêm.`;
      } else if (aiQuestions.length > 0) {
        warning = `Regex tách ${regexQuestions.length} câu, AI bổ sung ${aiQuestions.length} câu. Tổng: ${finalQuestions.length}/${expectedCount}.`;
      }
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      warning = regexQuestions.length
        ? `Regex tách được một phần; AI không chạy được: ${e.message}`
        : e.message;
      if (!regexQuestions.length) throw e;
    }
  }

  // Bảo vệ không làm mất câu hỏi Phần II, Phần III, hoặc câu chỉ có hình ảnh
  const cleaned = finalQuestions.filter((q) => {
    const hasStem = (q.q || '').trim().length > 0 || Boolean(q.image) || (q.images && q.images.length > 0);
    const isPart1 = (q.options || []).length >= MIN_OPTS;
    const isPart2 = q.part === 2 || q.type === 'true_false' || (Array.isArray(q.statements) && q.statements.length > 0);
    const isPart3 = q.part === 3 || q.type === 'short_answer' || Boolean(q.answer);
    return hasStem && (isPart1 || isPart2 || isPart3);
  });

  onProgress?.({ stage: 'done', percent: 100 });

  if (!cleaned.length) {
    throw new Error('Không tách được câu hỏi. File nên có dạng: Câu 1: ... / A. ... / B. ... / Đáp án: A');
  }

  const detected = detectExamSubjectAndGrade({
    fileName: file.name,
    text,
    questions: cleaned,
  });

  const elapsedMs = Math.round(performance.now() - t0);
  console.log(`[examParser] Xử lý xong trong ${elapsedMs}ms: ${cleaned.length}/${expectedCount} câu (${detected.subject} - Lớp ${detected.grade})`);

  return {
    questions: cleaned.map((q, i) => ({ ...q, num: q.num || i + 1 })),
    subject: detected.subject,
    grade: detected.grade,
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
      elapsedMs,
    },
  };
}