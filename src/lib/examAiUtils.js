/* ============================================================
   examAiUtils.js — Logic AI tạo đề cho MỌI MÔN (v7 FIXED)
   ------------------------------------------------------------
   v7 (fix 404 + gộp câu + hết token):
     • FIX: model mặc định gemini-3.8-flash (model thật, khớp ai.js)
     • FIX: ưu tiên VITE_GEMINI_KEY (key đang chạy ELEC AI Assistant)
     • FIX: maxOutputTokens 16000 → 32000
     • FIX: thêm sanitizeOption() cắt option bị gộp
     • FIX: sanitizeQuestionText() mạnh hơn
     • FIX: thêm responseSchema cho Gemini
     • FIX: log finishReason = MAX_TOKENS
   ============================================================ */
import { buildSubjectGuide, getSubject, SUBJECTS, GENERIC_SUBJECT } from './subjects.js';
import { buildFileContext } from './fileReader.js';
import { useCredit } from './creditService.js';

/* ============ HẰNG SỐ ============ */
export const LEVELS = ['nhận biết', 'thông hiểu', 'vận dụng', 'vận dụng cao'];
export const DIFFICULTIES = [
  { key: 'easy',   label: 'Dễ',         mix: '60% nhận biết, 30% thông hiểu, 10% vận dụng' },
  { key: 'medium', label: 'Trung bình', mix: '30% nhận biết, 40% thông hiểu, 30% vận dụng' },
  { key: 'hard',   label: 'Khó',        mix: '10% nhận biết, 30% thông hiểu, 40% vận dụng, 20% vận dụng cao' },
  { key: 'mixed',  label: 'Phân hóa',   mix: '40% nhận biết, 30% thông hiểu, 20% vận dụng, 10% vận dụng cao' },
];
export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  TRUE_FALSE:    'true_false',
  SHORT_ANSWER:  'short_answer',
};
export const VERIFY_PREFIX = 'AI giải lại';
export const DUP_PREFIX = 'Gần giống';
export const QUALITY_PREFIX = 'Chất lượng';

const BATCH = 15;
const GEN_BATCH = 5;
const GEN_PARALLEL = 3;
const DRAFT_KEY = 'cs-exam-ai-draft:v2';
const RETRY_JSON = 2;

/* ⭐ FIX: tăng max token */
const MAX_OUTPUT_TOKENS = 32000;

/* ============ TIỆN ÍCH ============ */
export const rid = () => Math.random().toString(36).slice(2, 10);
export const letter = (i) => String.fromCharCode(65 + i);
export const gradeLabel = (g) =>
  /^\d+$/.test(String(g ?? '').trim()) ? `Lớp ${String(g).trim()}` : String(g ?? '');

const plain = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

const EXAMPLES = {
  toan: 'Tạo 10 câu về hàm số bậc hai, độ khó trung bình',
  ly:   'Tạo 10 câu về dao động điều hòa, có 3 câu tính toán',
  hoa:  'Tạo 10 câu về axit nitric, độ khó trung bình',
  sinh: 'Tạo 10 câu về quang hợp và hô hấp tế bào',
  van:  'Tạo 8 câu đọc hiểu về một đoạn thơ lục bát',
  anh:  'Tạo 10 câu về thì hiện tại hoàn thành và câu bị động',
  su:   'Tạo 10 câu về cuộc kháng chiến chống Mỹ cứu nước',
  dia:  'Tạo 10 câu về vùng Đồng bằng sông Cửu Long',
  gdcd: 'Tạo 10 câu về quyền và nghĩa vụ của công dân',
  tin:  'Tạo 10 câu về vòng lặp trong Python',
  congnghe: 'Tạo 10 câu về quy trình trồng trọt',
  khtn: 'Tạo 10 câu về lực và chuyển động',
};
export const examplePrompt = (subject) =>
  EXAMPLES[getSubject(subject).id] || `Tạo 10 câu ôn tập môn ${subject || 'bất kỳ'}`;

/* ============================================================
   GỌI AI
   ============================================================ */
/* ⭐ FIX: ưu tiên VITE_GEMINI_KEY (key đang chạy ELEC AI Assistant) */
const API_KEY = import.meta.env?.VITE_GEMINI_KEY || import.meta.env?.VITE_GEMINI_API_KEY;

/* ⭐ FIX: model mặc định gemini-3.8-flash (model thật) */
const MODELS = (import.meta.env?.VITE_GEMINI_MODEL || 'gemini-3.8-flash,gemini-3.7-flash')
  .split(',').map((s) => s.trim()).filter(Boolean);

let goodModelIdx = 0;
let customCaller = null;

let _creditUserId = null;
export function setExamAiUserId(uid) { _creditUserId = uid; }

export function setModelCaller(fn) {
  customCaller = typeof fn === 'function' ? fn : null;
}

/* ⭐ responseSchema cho Gemini */
const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    meta: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        duration: { type: 'number' },
      },
    },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          q: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correct: { type: 'number' },
          statements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                answer: { type: 'boolean' },
              },
            },
          },
          accepted: { type: 'array', items: { type: 'string' } },
          work: { type: 'string' },
          explain: { type: 'string' },
          topic: { type: 'string' },
          level: { type: 'string' },
          points: { type: 'number' },
        },
        required: ['q'],
      },
    },
  },
  required: ['questions'],
};

export async function callModel({ system, parts, temperature = 0.7, signal, creditCost = null, schema = null }) {
  if (_creditUserId) {
    const hasImg = parts?.some((p) => p.inlineData);
    const imgCount = parts?.filter((p) => p.inlineData)?.length || 0;
    const cr = await useCredit(_creditUserId, imgCount, creditCost);
    if (!cr.ok) {
      try { window.dispatchEvent(new CustomEvent('cs-credit-update', { detail: { balance: cr.balance } })); } catch {}
      const needed = cr.needed || (creditCost ?? (1 + imgCount));
      throw new Error(`Hết điểm! Còn ${cr.balance} điểm, cần ${needed}. Nạp thêm tại Trang cá nhân → Gói dùng.`);
    }
    try { window.dispatchEvent(new CustomEvent('cs-credit-update', { detail: { balance: cr.balance } })); } catch {}
  }

  if (customCaller) return customCaller({ system, parts, temperature, signal, schema });

  if (!API_KEY) {
    throw new Error('Chưa cấu hình AI. Thêm VITE_GEMINI_KEY vào .env rồi khởi động lại.');
  }

  let lastErr = null;
  for (let k = goodModelIdx; k < MODELS.length; k++) {
    const model = MODELS[k];
    let res;
    try {
      const generationConfig = {
        temperature,
        responseMimeType: 'application/json',
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      };
      if (schema) generationConfig.responseSchema = schema;

      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts }],
            generationConfig,
          }),
        }
      );
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      lastErr = new Error(`Không kết nối được AI: ${e.message}`);
      continue;
    }

    if (!res.ok) {
      let msg = `Lỗi AI (${res.status})`;
      try {
        const j = await res.json();
        if (j?.error?.message) msg += `: ${j.error.message}`;
      } catch { /* ignore */ }
      lastErr = new Error(msg);
      if ([404, 429, 500, 502, 503, 504].includes(res.status) && k < MODELS.length - 1) continue;
      throw lastErr;
    }

    const data = await res.json();

    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      console.warn(`[examAiUtils] ⚠️ AI bị cắt vì hết token (MAX_TOKENS).`);
    }
    if (finishReason === 'SAFETY' || data?.promptFeedback?.blockReason) {
      throw new Error('AI từ chối nội dung. Hãy đổi cách mô tả hoặc đổi file.');
    }

    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('');

    if (!text) {
      lastErr = new Error('AI không trả về nội dung. Hãy thử lại.');
      if (k < MODELS.length - 1) continue;
      throw lastErr;
    }

    goodModelIdx = k;
    return text;
  }
  throw lastErr || new Error('Không gọi được AI.');
}

/* ============ ĐỌC JSON "LỎNG" ============ */
export function parseJsonLoose(text) {
  const s = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '');
  const attempt = (str) => {
    try { return JSON.parse(str); } catch { return undefined; }
  };
  const repair = (str) =>
    str.replace(/\\(\\|"|\/|u[0-9a-fA-F]{4}|[\s\S])/g, (m, g) =>
      g === '\\' || g === '"' || g === '/' || /^u[0-9a-fA-F]{4}$/.test(g) ? m : '\\\\' + g
    );

  const candidates = [s];
  const a = s.search(/[[{]/);
  if (a >= 0) {
    const closeCh = s[a] === '[' ? ']' : '}';
    const b = s.lastIndexOf(closeCh);
    if (b > a) candidates.push(s.slice(a, b + 1));
  }

  for (const c of candidates) {
    let v = attempt(c);
    if (v !== undefined) return v;
    v = attempt(repair(c));
    if (v !== undefined) return v;
  }
  throw new Error('Không đọc được phản hồi của AI (có thể đề quá dài). Hãy giảm số câu hoặc thử lại.');
}

async function callAndParse(args) {
  let lastErr = null;
  for (let attempt = 0; attempt <= RETRY_JSON; attempt++) {
    try {
      const raw = await callModel({
        ...args,
        temperature: (args.temperature ?? 0.7) + attempt * 0.05,
      });
      return parseJsonLoose(raw);
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      lastErr = e;
      const isJsonErr = /Không đọc được phản hồi/.test(e.message || '');
      if (!isJsonErr || attempt === RETRY_JSON) throw e;
      console.warn(`[examAiUtils] JSON lỗi lần ${attempt + 1}, retry...`);
    }
  }
  throw lastErr || new Error('Không gọi được AI.');
}

/* ============================================================
   CHUẨN HÓA
   ============================================================ */
const fixLatex = (s) =>
  typeof s !== 'string'
    ? s
    : s
        .replace(/\f/g, '\\f')
        .replace(/\t(?=[a-zA-Z]{2,})/g, '\\t')
        .replace(/\x08/g, '\\b')
        .replace(/\r(?=[a-zA-Z]{2,})/g, '\\r')
        .replace(/\n(?=(?:eq|abla|otin)\b)/g, '\\n');

const stripLabel = (s) => s.replace(/^\s*\(?[A-Da-d]\s*[.)]\s+/, '');

const oddDollar = (s) => ((String(s || '').replace(/\$\$/g, '').match(/\$/g) || []).length % 2) === 1;

/* ⭐ sanitize câu hỏi bị gộp */
function sanitizeQuestionText(qText) {
  if (!qText) return qText;
  let s = String(qText);

  const multiPartMatch = s.match(/(?:^|\n)\s*(PHẦN\s+[IVX]+|CÂU\s+HỎI\s+TRẮC\s+NGHIỆM|Phần\s+\d+)/i);
  if (multiPartMatch && multiPartMatch.index > 20) {
    console.warn(`[sanitize] Cắt q gộp tại vị trí ${multiPartMatch.index}`);
    s = s.slice(0, multiPartMatch.index).trim();
  }

  const multiQMatch = s.match(/(?:^|\n|\s)Câu\s+\d+\s*[:.)]\s+/i);
  if (multiQMatch && multiQMatch.index > 20) {
    console.warn(`[sanitize] Cắt q gộp (nhiều Câu N) tại ${multiQMatch.index}`);
    s = s.slice(0, multiQMatch.index).trim();
  }

  if (s.length > 800) {
    console.warn(`[sanitize] q quá dài ${s.length} ký tự, cắt 800`);
    s = s.slice(0, 800).trim();
  }

  return s;
}

/* ⭐ sanitize option bị gộp */
function sanitizeOption(optText) {
  if (!optText) return optText;
  let s = String(optText);

  const multiPartMatch = s.match(/(?:^|\n)\s*(PHẦN\s+[IVX]+|CÂU\s+HỎI\s+TRẮC\s+NGHIỆM|Phần\s+\d+)/i);
  if (multiPartMatch && multiPartMatch.index > 15) {
    console.warn(`[sanitize] Cắt option gộp tại ${multiPartMatch.index}`);
    s = s.slice(0, multiPartMatch.index).trim();
  }

  const multiQMatch = s.match(/(?:^|\n|\s)Câu\s+\d+\s*[:.)]\s+/i);
  if (multiQMatch && multiQMatch.index > 15) {
    console.warn(`[sanitize] Cắt option gộp (nhiều Câu N) tại ${multiQMatch.index}`);
    s = s.slice(0, multiQMatch.index).trim();
  }

  if (s.length > 300) {
    console.warn(`[sanitize] option quá dài ${s.length} ký tự, cắt 300`);
    s = s.slice(0, 300).trim();
  }

  return s;
}

function normalizeLevel(v) {
  const t = plain(v);
  if (!t) return '';
  if (t.includes('cao')) return 'vận dụng cao';
  if (t.includes('van dung')) return 'vận dụng';
  if (t.includes('thong hieu')) return 'thông hiểu';
  if (t.includes('nhan biet')) return 'nhận biết';
  return '';
}

function normalizeType(v) {
  const t = String(v || '').toLowerCase().trim();
  if (t === 'true_false' || t === 'tf' || t === 'true-false' || t === 'dung_sai') return QUESTION_TYPES.TRUE_FALSE;
  if (t === 'short_answer' || t === 'sa' || t === 'short-answer' || t === 'tra_loi_ngan') return QUESTION_TYPES.SHORT_ANSWER;
  return QUESTION_TYPES.SINGLE_CHOICE;
}

/* ============================================================
   normalizeQuestion
   ============================================================ */
export function normalizeQuestion(raw, { optionsCount = 4, wantExplain = true, type: forceType } = {}) {
  const r = raw || {};
  const warns = [];

  const type = forceType || normalizeType(r.type);
  const rawQ = String(r.q ?? r.question ?? r.content ?? '').trim();
  const q = fixLatex(sanitizeQuestionText(rawQ));
  const explain = wantExplain ? fixLatex(String(r.explain ?? r.explanation ?? '').trim()) : '';
  const topic = String(r.topic || '').trim().slice(0, 80);
  const level = normalizeLevel(r.level);

  if (!q) warns.push('Thiếu nội dung câu hỏi');
  if (wantExplain && !explain) warns.push('Chưa có lời giải');
  if (typeof r.flag === 'string' && r.flag.trim()) warns.push(`AI lưu ý: ${r.flag.trim()}`);

  /* true_false */
  if (type === QUESTION_TYPES.TRUE_FALSE) {
    let statements = r.statements || r.subquestions || [];
    if (!Array.isArray(statements)) statements = [];
    statements = statements.map((s) => ({
      text: fixLatex(sanitizeOption(String(s?.text ?? s?.content ?? s?.q ?? '').trim())),
      answer: typeof s?.answer === 'boolean'
        ? s.answer
        : ['true', 'đúng', 'd'].includes(String(s?.answer ?? '').toLowerCase().trim()),
    }));
    if (statements.length !== 4) warns.push(`Cần đúng 4 ý a-d, có ${statements.length}`);
    if (statements.some((s) => !s.text)) warns.push('Có ý để trống');
    if ([q, explain, ...statements.map((s) => s.text)].some(oddDollar)) warns.push('Công thức ($) chưa đóng đủ');
    return {
      id: rid(), type, q, statements,
      points: Number(r.points) > 0 ? Number(r.points) : 1,
      explain, topic, level, warns,
    };
  }

  /* short_answer */
  if (type === QUESTION_TYPES.SHORT_ANSWER) {
    let accepted = r.accepted || r.answers || r.correct_answers || [];
    if (!Array.isArray(accepted)) accepted = [accepted];
    accepted = accepted.map((a) => fixLatex(String(a ?? '').trim())).filter(Boolean);
    if (!accepted.length) warns.push('Chưa có đáp án chấp nhận');
    if ([q, explain, ...accepted].some(oddDollar)) warns.push('Công thức ($) chưa đóng đủ');
    return {
      id: rid(), type, q, accepted,
      points: Number(r.points) > 0 ? Number(r.points) : 1,
      explain, topic, level, warns,
    };
  }

  /* single_choice */
  let opts = r.options ?? r.choices ?? r.answers ?? [];
  if (opts && !Array.isArray(opts) && typeof opts === 'object') opts = Object.values(opts);

  opts = (Array.isArray(opts) ? opts : []).map((o) =>
    fixLatex(sanitizeOption(stripLabel(String(o ?? '').trim())))
  );

  let correct = -1;
  const c = r.correct ?? r.answer ?? r.correctAnswer ?? r.correct_index;
  if (typeof c === 'number' && Number.isInteger(c)) correct = c;
  else if (typeof c === 'string') {
    const t = c.trim();
    if (/^[A-Ea-e]$/.test(t)) correct = t.toUpperCase().charCodeAt(0) - 65;
    else if (/^\d+$/.test(t)) correct = Number(t);
  }
  if (correct < 0 || correct >= opts.length) correct = -1;

  if (opts.length < 2) warns.push('Thiếu đáp án');
  else {
    if (opts.length !== optionsCount) warns.push(`Có ${opts.length} đáp án (yêu cầu ${optionsCount})`);
    if (opts.some((o) => !o)) warns.push('Có đáp án để trống');
    if (new Set(opts.map(plain)).size < opts.length) warns.push('Có đáp án trùng nhau');
  }
  if ([q, explain, ...opts].some(oddDollar)) warns.push('Công thức ($) chưa đóng đủ');

  return {
    id: rid(), type: QUESTION_TYPES.SINGLE_CHOICE, q, options: opts, correct,
    points: Number(r.points) > 0 ? Number(r.points) : 1,
    explain, topic, level, warns,
  };
}

/* ============================================================
   XÁO VỊ TRÍ ĐÁP ÁN
   ============================================================ */
const STEM_REF = /(?:đáp án|phương án|mệnh đề|ý)\s*[A-E]\b|\bcả\s+[A-E]\b/i;
const OPT_REF = /(?:đáp án|phương án|mệnh đề|ý)\s*[A-E]\b|\bcả\s+[A-E]\b|\b[A-E]\s*(?:và|,|&)\s*[A-E]\b|tất cả|cả hai|không có đáp án/i;
const EXPLAIN_REF = /(?:đáp án|phương án|chọn|ý)\s*[A-E]\b|\b[A-E]\s*(?:đúng|sai)\b/i;

export function shuffleOptions(q, rng = Math.random) {
  if (q.type && q.type !== QUESTION_TYPES.SINGLE_CHOICE) return q;
  if (q.correct < 0 || !Array.isArray(q.options) || q.options.length < 2) return q;
  if (EXPLAIN_REF.test(q.explain || '') || STEM_REF.test(q.q) || q.options.some((o) => OPT_REF.test(o))) return q;
  const idx = q.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { ...q, options: idx.map((i) => q.options[i]), correct: idx.indexOf(q.correct) };
}
export const shuffleAllOptions = (qs) => qs.map((q) => shuffleOptions(q));

export function shuffleSingleChoiceOnly(qs) {
  return qs.map((q) => (q.type === QUESTION_TYPES.SINGLE_CHOICE || !q.type ? shuffleOptions(q) : q));
}

export function shuffleQuestionOrder(qs) {
  const a = [...qs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return markDuplicates(a);
}

/* ============================================================
   BẮT CÂU TRÙNG
   ============================================================ */
function textOf(q) {
  if (q.type === QUESTION_TYPES.TRUE_FALSE) {
    return `${q.q} ${(q.statements || []).map((s) => s.text).join(' ')}`;
  }
  if (q.type === QUESTION_TYPES.SHORT_ANSWER) {
    return `${q.q} ${(q.accepted || []).join(' ')}`;
  }
  return `${q.q} ${(q.options || []).join(' ')}`;
}

export function markDuplicates(qs) {
  const toks = qs.map((q) => new Set(plain(textOf(q)).split(/[^a-z0-9]+/).filter((w) => w.length > 1)));
  return qs.map((q, i) => {
    const warns = (q.warns || []).filter((w) => !w.startsWith(DUP_PREFIX));
    for (let j = 0; j < i; j++) {
      if (toks[i].size < 4 || toks[j].size < 4) continue;
      let inter = 0;
      toks[i].forEach((w) => { if (toks[j].has(w)) inter++; });
      const uni = toks[i].size + toks[j].size - inter;
      if (inter / uni >= 0.85) {
        warns.push(`${DUP_PREFIX} câu ${j + 1} — có thể trùng ý`);
        break;
      }
    }
    return { ...q, warns };
  });
}

function finalize(list, opts, { shuffle }) {
  let qs = list.filter(Boolean).map((r) => normalizeQuestion(r, opts));
  if (shuffle) qs = shuffleSingleChoiceOnly(qs);
  return markDuplicates(qs);
}

function normalizeMeta(m, fb = {}) {
  const d = Number(m?.duration);
  return {
    title: String(m?.title || fb.title || '').trim().slice(0, 120),
    description: String(m?.description ?? fb.description ?? '').trim().slice(0, 500),
    duration: d > 0 ? d : fb.duration || 45,
  };
}

const listOf = (p) => (Array.isArray(p) ? p : p?.questions || p?.data || []);

/* ============================================================
   CẢNH BÁO / THỐNG KÊ
   ============================================================ */
export function getFlags(q) {
  const f = [...(q.warns || [])];
  if (q.type === QUESTION_TYPES.SINGLE_CHOICE || !q.type) {
    if (q.correct < 0) f.unshift('Chưa chọn đáp án đúng');
  } else if (q.type === QUESTION_TYPES.TRUE_FALSE) {
    if (!q.statements?.length) f.unshift('Chưa có ý đúng/sai');
  } else if (q.type === QUESTION_TYPES.SHORT_ANSWER) {
    if (!q.accepted?.length) f.unshift('Chưa có đáp án chấp nhận');
  }
  return f;
}

export const collectWarnings = (qs) =>
  qs.map((q, i) => ({ index: i, messages: getFlags(q) })).filter((w) => w.messages.length);

export const countUnanswered = (qs) =>
  qs.filter((q) => {
    if (q.type === QUESTION_TYPES.TRUE_FALSE) return !q.statements?.length;
    if (q.type === QUESTION_TYPES.SHORT_ANSWER) return !q.accepted?.length;
    return q.correct < 0;
  }).length;

export function summarizeDraft(qs) {
  const levels = {};
  const types = { single_choice: 0, true_false: 0, short_answer: 0 };
  let points = 0;
  qs.forEach((q) => {
    if (q.level) levels[q.level] = (levels[q.level] || 0) + 1;
    points += q.points || 1;
    const t = q.type || QUESTION_TYPES.SINGLE_CHOICE;
    types[t] = (types[t] || 0) + 1;
  });
  return {
    total: qs.length,
    unanswered: countUnanswered(qs),
    flagged: qs.filter((q) => getFlags(q).length > 0).length,
    levels, types, points,
  };
}

export function saveDraft(d) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: Date.now() })); } catch { /* */ }
}
export function loadDraft() {
  try {
    const v = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    return v?.questions?.length ? v : null;
  } catch { return null; }
}
export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }
}

export function applyBloomIntent(mix, count) {
  const total = Math.max(1, Number(count) || 10);
  const keys = ['nb', 'th', 'vd', 'vdc'];
  const out = {};
  let sum = 0;
  keys.forEach((k) => {
    out[k] = Math.round((mix?.[k] || 0) * total);
    sum += out[k];
  });
  let diff = total - sum;
  const order = keys.slice().sort((a, b) => (mix?.[b] || 0) - (mix?.[a] || 0));
  let i = 0;
  while (diff !== 0 && i < 200) {
    const k = order[i % order.length];
    if (diff > 0) { out[k] += 1; diff -= 1; }
    else if (out[k] > 0) { out[k] -= 1; diff += 1; }
    i += 1;
  }
  return out;
}

export function detectRequestType(history) {
  const lastUser = [...(history || [])].reverse().find((m) => m.role === 'user');
  if (!lastUser) return 'general';

  let text = '';
  if (lastUser.parts) {
    text = lastUser.parts.filter((p) => p.text).map((p) => p.text).join(' ');
  } else {
    text = lastUser.text || '';
  }
  const value = text.toLowerCase();
  const hasImage = Boolean(lastUser.parts?.some((p) => p.inlineData));

  if (hasImage) return 'problem';
  if (/giải|tính|mol|nồng độ|\bph\b|khối lượng|thể tích|phương trình|cân bằng|oxi hóa|oxi hoá|khử|điện phân|hiệu suất|bảo toàn|hỗn hợp|đốt cháy|thủy phân|thuỷ phân|xác định|bao nhiêu|tìm|\d+\s?(g|gam|ml|lít|l|m)\b/.test(value)) return 'problem';
  if (/tạo.*câu hỏi|trắc nghiệm|quiz|trả lời ngắn|đúng sai|đề kiểm tra|đề thi/.test(value)) return 'quiz';
  if (/giải thích|lý thuyết|lí thuyết|bản chất|tại sao|vì sao|so sánh|khác nhau|cơ chế|phân biệt|nhận biết|đặc điểm|đặc trưng|nêu|trình bày|khái niệm|định nghĩa/.test(value)) return 'theory';
  if (/đọc hiểu|doc hieu|phân tích|phân tich|cảm nhận|nghị luận|nghi luan|biện pháp tu từ|nhân vật/.test(value)) return 'reading';
  return 'general';
}

function getTemperature(type) {
  switch (type) {
    case 'problem': return 0.1;
    case 'quiz':    return 0.2;
    case 'theory':  return 0.2;
    case 'reading': return 0.3;
    default:        return 0.3;
  }
}

const maxTokensFor = (type) =>
  type === 'problem' ? 8192 : type === 'theory' || type === 'reading' ? 4096 : 2048;

/* ============================================================
   PROMPT — ĐA MÔN
   ============================================================ */
const JSON_FORMAT = `ĐỊNH DẠNG TRẢ VỀ: chỉ MỘT đối tượng JSON, không markdown, không văn bản ngoài JSON:
{"meta":{"title":"...","description":"...","duration":45},"questions":[{"type":"single_choice","q":"...","options":["...","...","...","..."],"work":"...","correct":0,"explain":"...","topic":"...","level":"nhận biết|thông hiểu|vận dụng|vận dụng cao","points":1}]}

⚠️ QUY TẮC BẮT BUỘC (KHÔNG ĐƯỢC VI PHẠM):
1. Mỗi phần tử trong "questions" CHỈ chứa MỘT câu hỏi duy nhất.
2. TUYỆT ĐỐI KHÔNG gộp nhiều câu vào 1 phần tử.
3. TUYỆT ĐỐI KHÔNG chèn tiêu đề "PHẦN I/II/III", "Câu 1:", "Câu 2:" vào trong "q" hoặc "options".
4. "correct" là SỐ NGUYÊN 0-3 (0=A, 1=B, 2=C, 3=D). KHÔNG để null/undefined/-1.
5. Mỗi câu có ĐÚNG 4 phương án (options).

- "type" có thể là: single_choice | true_false | short_answer.
- Với "true_false": dùng "statements": [{"text":"...","answer":true|false}, ...] đúng 4 ý.
- Với "short_answer": dùng "accepted": ["0,5","0.5"] — danh sách đáp án chấp nhận.
- "work": bản nháp giải NGẮN (≤ 200 ký tự), CHỈ cho câu tính toán.
- "options" KHÔNG có tiền tố A./B./C./D.
- Trong JSON, mỗi dấu gạch chéo ngược LaTeX phải viết thành HAI dấu: "\\\\frac{1}{2}", "\\\\ce{H2O}".`;

function baseSystem({ subject, grade, optionsCount, explain }) {
  const subjectInfo = getSubject(subject);
  const mathRule = subjectInfo.math
    ? 'Công thức viết bằng LaTeX đặt trong $...$ (VD: $\\frac{a}{b}$, $\\sqrt{3}$, $\\ce{H2SO4}$).'
    : 'KHÔNG dùng LaTeX. Viết văn bản thuần, không ký hiệu $...$.';

  return [
    `Bạn là giáo viên giàu kinh nghiệm, chuyên ra đề kiểm tra theo chương trình giáo dục phổ thông Việt Nam.`,
    `MÔN: ${subject}. KHỐI LỚP: ${gradeLabel(grade)}.`,
    `Mỗi câu trắc nghiệm có đúng ${optionsCount} đáp án và đúng 1 đáp án đúng.`,
    subjectInfo.id === 'anh'
      ? 'Câu hỏi và đáp án viết bằng tiếng Anh, lời giải bằng tiếng Việt.'
      : 'Dùng tiếng Việt.',
    buildSubjectGuide(subject),
    [
      'CHẤT LƯỢNG ĐỀ:',
      '- Với câu tính toán: giải xong (trong "work") rồi mới viết đáp án.',
      '- Đáp án nhiễu = sai lầm THƯỜNG GẶP của học sinh.',
      '- Mỗi câu kiểm tra một kỹ năng/ý khác nhau.',
      '- Lời giải chỉ ra vì sao đáp án đúng, KHÔNG nhắc chữ cái A/B/C/D.',
    ].join('\n'),
    mathRule,
    explain ? 'Mỗi câu phải có "explain" (lời giải 1–4 câu).' : 'Để "explain" là chuỗi rỗng.',
    JSON_FORMAT,
  ].filter(Boolean).join('\n\n');
}

const slim = (q) => {
  const base = {
    type: q.type, q: q.q, explain: q.explain, topic: q.topic, level: q.level, points: q.points,
    ...(getFlags(q).length ? { warns: getFlags(q) } : {}),
  };
  if (q.type === QUESTION_TYPES.TRUE_FALSE) return { ...base, statements: q.statements };
  if (q.type === QUESTION_TYPES.SHORT_ANSWER) return { ...base, accepted: q.accepted };
  return { ...base, options: q.options, correct: q.correct };
};

export function calcExamCreditCost(questionCount) {
  const n = Math.max(1, Number(questionCount) || 10);
  if (n <= 10) return 5;
  if (n <= 20) return 10;
  if (n <= 40) return 20;
  return 30;
}

/* ============================================================
   1) TẠO ĐỀ MỚI
   ============================================================ */
export async function generateExam({
  subject, grade, difficulty = 'medium', count = 10, optionsCount = 4,
  duration = 45, explain = true, prompt = '', files = [], signal, onProgress,
  questionTypes = ['single_choice'],
}) {
  const diff = DIFFICULTIES.find((d) => d.key === difficulty) || DIFFICULTIES[1];
  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);
  const system = baseSystem({ subject, grade, optionsCount, explain });
  const total = Math.max(1, Math.min(60, Number(count) || 10));
  const nBatches = Math.ceil(total / GEN_BATCH);
  const sizes = Array.from({ length: nBatches }, (_, b) =>
    Math.floor(total / nBatches) + (b < total % nBatches ? 1 : 0));

  const totalCreditCost = calcExamCreditCost(total);
  const creditPerBatch = Math.max(1, Math.round(totalCreditCost / nBatches));

  const raws = [];
  let meta = null;
  let firstErr = null;
  const results = new Array(nBatches).fill(null);
  let done = 0;
  onProgress?.(0, nBatches);

  const subjectInfo = getSubject(subject);

  const runBatch = async (b) => {
    /* ⭐ chỉ 2000 ký tự tài liệu */
    const safeText = textParts.length
      ? `Tài liệu tham khảo (CHỈ để tham khảo nội dung, TUYỆT ĐỐI KHÔNG chèn vào câu hỏi):\n${textParts.join('\n').slice(0, 2000)}`
      : '';

    const userText = [
      `Hãy soạn ĐÚNG ${sizes[b]} câu môn ${subject}, ${gradeLabel(grade)}. Mỗi câu là 1 phần tử riêng biệt trong mảng.`,
      `Độ khó: ${diff.label} (${diff.mix}).`,
      questionTypes.length > 1
        ? `ĐA DẠNG LOẠI CÂU: ${questionTypes.join(', ')}. Trộn tỷ lệ hợp lý.`
        : `Loại câu hỏi: ${questionTypes[0] || 'single_choice'}.`,
      prompt ? `Yêu cầu của giáo viên: ${prompt}` : 'Giáo viên không nêu chủ đề cụ thể: hãy bao quát các nội dung trọng tâm của chương trình.',
      nBatches > 1
        ? `Đề được chia thành ${nBatches} phần soạn độc lập. Bạn soạn PHẦN ${b + 1}/${nBatches}: chỉ chọn nhóm kiến thức thứ ${b + 1}/${nBatches}, để không trùng các phần khác.`
        : '',
      safeText,
      `⚠️ NHẮC LẠI: Trả về JSON có ĐÚNG ${sizes[b]} phần tử trong mảng "questions", mỗi phần tử = 1 câu hỏi riêng biệt. KHÔNG gộp nhiều câu vào 1 phần tử.`,
      `Thời gian làm bài ${duration} phút; đặt "meta.title" ngắn gọn.`,
    ].filter(Boolean).join('\n');
    try {
      results[b] = await callAndParse({
        system,
        parts: [...imageParts, ...pdfParts, { text: userText }],
        temperature: subjectInfo.math ? 0.5 : 0.75,
        signal,
        creditCost: creditPerBatch,
        schema: QUESTION_SCHEMA,
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      firstErr = firstErr || e;
    }
    onProgress?.(++done, nBatches);
  };

  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(GEN_PARALLEL, nBatches) }, async () => {
      while (next < nBatches) await runBatch(next++);
    })
  );

  results.forEach((p) => {
    if (!p) return;
    if (!meta && p?.meta) meta = p.meta;
    listOf(p).forEach((r) => raws.push(r));
  });
  if (!raws.length && firstErr) throw firstErr;
  if (!raws.length) throw new Error('AI không tạo được câu hỏi nào. Hãy mô tả cụ thể hơn.');

  return {
    meta: normalizeMeta(meta, { title: `Đề ${subject} ${gradeLabel(grade)}`, duration }),
    questions: finalize(raws.slice(0, total), { optionsCount, wantExplain: explain }, { shuffle: true }),
  };
}

/* ============================================================
   2) SỐ HÓA ĐỀ CÓ SẴN
   ============================================================ */
export async function digitizeExam({
  files, subject, grade, optionsCount = 4, duration = 45, explain = true, note = '', signal,
}) {
  if (!files?.length) throw new Error('Chưa có file để số hóa.');
  const { textParts, imageParts, pdfParts } = buildFileContext(files);
  const system = [
    baseSystem({ subject, grade, optionsCount, explain }),
    `NHIỆM VỤ SỐ HÓA:
- Chuyển ĐÚNG NGUYÊN VĂN các câu trong tài liệu sang JSON; không sáng tác thêm, không bỏ sót, giữ nguyên thứ tự.
- Nếu tài liệu có đáp án → dùng đáp án đó.
- Nếu KHÔNG có đáp án → tự giải và thêm "flag": "Tài liệu không có đáp án, AI tự giải".
- Công thức trong ảnh phải chuyển sang LaTeX ($...$) nếu là môn tự nhiên.
- Câu tự luận hoặc không đủ đáp án → bỏ qua.`,
  ].join('\n\n');

  const userText = [
    `Số hóa đề môn ${subject}, ${gradeLabel(grade)} từ tài liệu đính kèm.`,
    note ? `Ghi chú: ${note}` : '',
    `Thời gian: ${duration} phút.`,
  ].filter(Boolean).join('\n');

  const p = await callAndParse({
    system,
    parts: [...imageParts, ...pdfParts, { text: [...textParts, userText].join('\n\n') }],
    temperature: 0.2,
    signal,
    schema: QUESTION_SCHEMA,
  });
  const list = listOf(p);
  if (!list.length) throw new Error('Không tìm thấy câu nào trong file. Hãy thử file rõ nét hơn.');
  return {
    meta: normalizeMeta(p?.meta, { title: `Đề ${subject} ${gradeLabel(grade)}`, duration }),
    questions: finalize(list, { optionsCount, wantExplain: explain }, { shuffle: false }),
  };
}

/* ============================================================
   3) CHỈNH ĐỀ HIỆN TẠI
   ============================================================ */
export async function refineExam({ draft, instruction, subject, grade, optionsCount = 4, explain = true, signal }) {
  const system = [
    baseSystem({ subject, grade, optionsCount, explain }),
    `NHIỆM VỤ CHỈNH SỬA:
- Áp dụng yêu cầu của giáo viên lên đề hiện tại, trả về TOÀN BỘ danh sách câu hỏi sau chỉnh sửa.
- Câu không bị ảnh hưởng thì GIỮ NGUYÊN y hệt và đúng thứ tự.
- Nếu yêu cầu thêm câu → thêm vào cuối.`,
  ].join('\n\n');

  const p = await callAndParse({
    system,
    parts: [{
      text: `Yêu cầu: ${instruction}\n\nĐề hiện tại:\n${JSON.stringify({
        meta: draft.meta,
        questions: draft.questions.map(slim),
      })}`,
    }],
    temperature: 0.4,
    signal,
    schema: QUESTION_SCHEMA,
  });
  const list = listOf(p);
  if (!list.length) throw new Error('AI không trả về câu hỏi nào. Hãy nói rõ hơn.');
  return {
    meta: normalizeMeta(p?.meta, draft.meta),
    questions: finalize(list, { optionsCount, wantExplain: explain }, { shuffle: false }),
  };
}

/* ============================================================
   4) VIẾT LẠI 1 CÂU
   ============================================================ */
export async function regenerateQuestion({
  question, instruction = '', subject, grade, optionsCount = 4, explain = true, signal,
}) {
  const system = baseSystem({ subject, grade, optionsCount, explain });
  const text = [
    'Viết lại DUY NHẤT câu hỏi sau và trả về {"questions":[câu mới]}.',
    `Giữ cùng chủ đề (${question.topic || 'như cũ'}) và mức độ (${question.level || 'như cũ'}).`,
    `Giữ cùng loại câu hỏi (${question.type || 'single_choice'}).`,
    `Yêu cầu: ${instruction.trim() || 'Viết câu mới khác hoàn toàn nhưng cùng chủ đề và mức độ.'}`,
    `Câu hiện tại: ${JSON.stringify(slim(question))}`,
  ].join('\n');

  const p = await callAndParse({ system, parts: [{ text }], temperature: 0.8, signal, schema: QUESTION_SCHEMA });
  const first = listOf(p)[0];
  if (!first) throw new Error('AI không viết lại được câu này.');
  const [nq] = finalize([first], { optionsCount, wantExplain: explain }, { shuffle: true });
  return { ...nq, points: question.points || nq.points };
}

/* ============================================================
   5) KIỂM TRA ĐÁP ÁN
   ============================================================ */
export async function verifyExam({ questions, subject, signal, onProgress }) {
  const system = [
    `Môn: ${subject}. Bạn là giáo viên thẩm định đề.`,
    'Với mỗi câu, TỰ GIẢI ĐỘC LẬP từng bước rồi chọn đáp án.',
    'Trả JSON: {"answers":[{"i":0,"answer":2,"note":""}]}.',
  ].join('\n');

  const answers = new Map();
  const batches = chunk(questions.map((q, i) => ({
    i, q: q.q, type: q.type || 'single_choice', options: q.options, statements: q.statements,
  })), BATCH);
  let vDone = 0;
  await Promise.all(batches.map(async (bt) => {
    const p = await callAndParse({
      system,
      parts: [{ text: `Các câu cần giải:\n${JSON.stringify(bt)}` }],
      temperature: 0.1,
      signal,
    });
    const list = Array.isArray(p) ? p : p?.answers || [];
    list.forEach((a) => { if (a && Number.isInteger(a.i)) answers.set(a.i, a); });
    onProgress?.(++vDone, batches.length);
  }));

  let ok = 0, diff = 0, unsure = 0;
  const out = questions.map((q, i) => {
    const base = { ...q, warns: (q.warns || []).filter((w) => !w.startsWith(VERIFY_PREFIX)) };
    const a = answers.get(i);
    if (!a) return { ...base, verified: undefined };
    const t = q.type || 'single_choice';
    if (t === 'single_choice') {
      const ans = Number.isInteger(a.answer) ? a.answer : -1;
      if (ans < 0 || ans >= (q.options || []).length) {
        unsure++;
        return { ...base, verified: 'unsure', warns: [...base.warns, `${VERIFY_PREFIX}: không xác định được đáp án`] };
      }
      if (q.correct < 0) return { ...base, verified: 'unsure', warns: [...base.warns, `${VERIFY_PREFIX} gợi ý đáp án ${letter(ans)}`] };
      if (ans !== q.correct) {
        diff++;
        return { ...base, verified: 'diff', warns: [...base.warns, `${VERIFY_PREFIX} ra đáp án ${letter(ans)}, khác đáp án đang chọn (${letter(q.correct)})`] };
      }
      ok++;
      return { ...base, verified: 'ok' };
    }
    ok++;
    return { ...base, verified: 'ok' };
  });
  return { questions: out, ok, diff, unsure };
}

/* ============================================================
   6) suggestExamFromClass
   ============================================================ */
export function suggestExamFromClass({ insights, exams = [], subject = 'Hóa học' } = {}) {
  const out = [];
  if (insights?.weakestTopics?.length > 0) {
    const weak = insights.weakestTopics[0];
    out.push({
      icon: 'target',
      title: `Ôn bù: ${weak.topic}`,
      sub: `Lớp chỉ đạt ${weak.rate}% · Đề xuất 10 câu củng cố`,
      prompt: `Đề ôn bù chuyên đề "${weak.topic}" môn ${subject} 10 câu, 70% nhận biết + 30% thông hiểu`,
      priority: 'high', intent: 'basic',
    });
  }
  if (insights?.hardest?.length >= 3) {
    out.push({
      icon: 'warn',
      title: `Luyện dạng câu sai nhiều`,
      sub: `${insights.hardest.length} câu có tỷ lệ đúng thấp`,
      prompt: `Tạo 12 câu cùng dạng với: "${insights.hardest[0].text.slice(0, 80)}", môn ${subject}`,
      priority: 'high', intent: 'practice',
    });
  }
  if (exams.length >= 3) {
    const recent = exams[0];
    out.push({
      icon: 'repeat',
      title: `Đề tương tự: ${recent.title?.slice(0, 40)}`,
      sub: 'Cùng chủ đề, câu mới 100%',
      prompt: `Tạo đề tương tự "${recent.title}" môn ${subject} nhưng câu hỏi hoàn toàn mới`,
      priority: 'medium', intent: 'practice',
    });
  }
  if (insights?.passRate >= 80) {
    out.push({
      icon: 'star',
      title: 'Thử thách nâng cao',
      sub: `Lớp đạt ${insights.passRate}% — sẵn sàng cho VDC`,
      prompt: `Tạo đề phân hóa nâng cao môn ${subject}, 15 câu, 50% vận dụng + 30% vận dụng cao`,
      priority: 'low', intent: 'rank',
    });
  }
  return out.slice(0, 4);
}

export { callAndParse as _callAndParse };
export { SUBJECTS, GENERIC_SUBJECT };