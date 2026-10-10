/* ============================================================
   examAiUtils.js — Logic AI tạo đề cho MỌI MÔN (v3)
   ------------------------------------------------------------
   Chức năng:
     • generateExam      tạo đề mới (tự chia đợt nếu > 15 câu)
     • digitizeExam      số hóa đề có sẵn từ ảnh/PDF/Word/Excel
     • refineExam        chỉnh đề hiện tại theo lời nhắn
     • regenerateQuestion viết lại 1 câu
     • verifyExam        AI giải lại độc lập để bắt đáp án sai
   Chuẩn hóa/kiểm tra:
     • sửa LaTeX bị hỏng trong JSON (\frac, \text, \beta…)
     • xáo vị trí đáp án (AI hay đặt đáp án đúng ở B/C)
     • bắt câu trùng, thiếu đáp án, công thức chưa đóng $
   Kết nối AI: mặc định gọi Gemini bằng VITE_GEMINI_API_KEY (chỉ nên
   dùng khi chạy thử). Muốn dùng hàm AI có sẵn của app, gọi:
       setModelCaller(async ({ system, parts, temperature, signal }) => text)
   — hàm phải trả về CHUỖI JSON do AI sinh ra.
   ============================================================ */
import { buildSubjectGuide, getSubject } from './subjects.js';
import { buildFileContext } from './fileReader.js';

/* ============ HẰNG SỐ ============ */
export const LEVELS = ['nhận biết', 'thông hiểu', 'vận dụng', 'vận dụng cao'];
export const DIFFICULTIES = [
  { key: 'easy', label: 'Dễ', mix: '60% nhận biết, 30% thông hiểu, 10% vận dụng' },
  { key: 'medium', label: 'Trung bình', mix: '30% nhận biết, 40% thông hiểu, 30% vận dụng' },
  { key: 'hard', label: 'Khó', mix: '10% nhận biết, 30% thông hiểu, 40% vận dụng, 20% vận dụng cao' },
  { key: 'mixed', label: 'Phân hóa', mix: '40% nhận biết, 30% thông hiểu, 20% vận dụng, 10% vận dụng cao' },
];
export const VERIFY_PREFIX = 'AI giải lại';
export const DUP_PREFIX = 'Gần giống';
const BATCH = 15;        // số câu mỗi lượt kiểm tra đáp án
const GEN_BATCH = 8;     // tối đa số câu mỗi lượt soạn (soạn song song nhiều lượt)
const GEN_PARALLEL = 3;  // số lượt soạn chạy cùng lúc
const DRAFT_KEY = 'cs-exam-ai-draft:v2';

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
  ly: 'Tạo 10 câu về dao động điều hòa, có 3 câu tính toán',
  hoa: 'Tạo 10 câu về axit nitric, độ khó trung bình',
  sinh: 'Tạo 10 câu về quang hợp và hô hấp tế bào',
  van: 'Tạo 8 câu đọc hiểu về một đoạn thơ lục bát',
  anh: 'Tạo 10 câu về thì hiện tại hoàn thành và câu bị động',
  su: 'Tạo 10 câu về cuộc kháng chiến chống Mỹ cứu nước',
  dia: 'Tạo 10 câu về vùng Đồng bằng sông Cửu Long',
  gdcd: 'Tạo 10 câu về quyền và nghĩa vụ của công dân',
  tin: 'Tạo 10 câu về vòng lặp trong Python',
  congnghe: 'Tạo 10 câu về quy trình trồng trọt',
  khtn: 'Tạo 10 câu về lực và chuyển động',
};
export const examplePrompt = (subject) =>
  EXAMPLES[getSubject(subject).id] || `Tạo 10 câu ôn tập môn ${subject || 'bất kỳ'}`;

/* ============================================================
   GỌI AI
   ============================================================ */
// Chấp nhận cả VITE_GEMINI_API_KEY và VITE_GEMINI_KEY (tên đang dùng trong .env của app)
const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_KEY;
// gemini-2.5-flash đã bị Google khóa với người dùng mới → dùng cùng danh sách model với ai.js.
// Có thể ghi đè trong .env: VITE_GEMINI_MODEL=gemini-3.8-flash,gemini-3.7-flash (thứ tự ưu tiên)
const MODELS = (import.meta.env?.VITE_GEMINI_MODEL || 'gemini-3.8-flash,gemini-3.7-flash')
  .split(',').map((s) => s.trim()).filter(Boolean);
let goodModelIdx = 0; // nhớ model đang chạy tốt để lần sau khỏi thử lại model hỏng
let customCaller = null;

/** Gắn hàm gọi AI có sẵn của app (khuyên dùng khi lên production). */
export function setModelCaller(fn) {
  customCaller = typeof fn === 'function' ? fn : null;
}

export async function callModel({ system, parts, temperature = 0.7, signal }) {
  if (customCaller) return customCaller({ system, parts, temperature, signal });
  if (!API_KEY) {
    throw new Error('Chưa cấu hình AI. Thêm VITE_GEMINI_API_KEY (hoặc VITE_GEMINI_KEY) vào file .env rồi khởi động lại npm run dev (hoặc dùng setModelCaller).');
  }
  let lastErr = null;
  for (let k = goodModelIdx; k < MODELS.length; k++) {
    const model = MODELS[k];
    let res;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature,
              responseMimeType: 'application/json',
              maxOutputTokens: 16000,
            },
          }),
        }
      );
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      lastErr = new Error(`Không kết nối được AI: ${e.message}`);
      continue; // lỗi mạng → thử model kế
    }
    if (!res.ok) {
      let msg = `Lỗi AI (${res.status})`;
      try {
        const j = await res.json();
        if (j?.error?.message) msg += `: ${j.error.message}`;
      } catch { /* bỏ qua */ }
      lastErr = new Error(msg);
      // 404 (model bị khóa/không tồn tại), 429, 5xx → thử model kế tiếp; lỗi khác (400, 403 key sai) dừng luôn
      if ([404, 429, 500, 502, 503, 504].includes(res.status) && k < MODELS.length - 1) continue;
      throw lastErr;
    }
    const data = await res.json();
    if (data?.promptFeedback?.blockReason) {
      throw new Error('AI từ chối nội dung yêu cầu. Hãy đổi cách mô tả hoặc đổi file.');
    }
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
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
  // Nhân đôi dấu \ không hợp lệ (\sqrt, \ce…) nhưng giữ các cặp \\ , \" , \/ , \uXXXX
  const repair = (str) =>
    str.replace(/\\(\\|"|\/|u[0-9a-fA-F]{4}|[\s\S])/g, (m, g) =>
      g === '\\' || g === '"' || g === '/' || /^u[0-9a-fA-F]{4}$/.test(g) ? m : '\\\\' + g
    );

  const candidates = [s];
  const a = s.search(/[[{]/);
  const closeCh = s[a] === '[' ? ']' : '}';
  const b = s.lastIndexOf(closeCh);
  if (a >= 0 && b > a) candidates.push(s.slice(a, b + 1));

  for (const c of candidates) {
    let v = attempt(c);
    if (v !== undefined) return v;
    v = attempt(repair(c));
    if (v !== undefined) return v;
  }
  throw new Error('Không đọc được phản hồi của AI (có thể đề quá dài). Hãy giảm số câu hoặc thử lại.');
}

async function callAndParse(args) {
  return parseJsonLoose(await callModel(args));
}

/* ============================================================
   CHUẨN HÓA CÂU HỎI
   ============================================================ */
/* JSON.parse biến "\frac" thành [form feed]+"rac", "\text" thành [tab]+"ext"… → sửa lại */
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

function normalizeLevel(v) {
  const t = plain(v);
  if (!t) return '';
  if (t.includes('cao')) return 'vận dụng cao';
  if (t.includes('van dung')) return 'vận dụng';
  if (t.includes('thong hieu')) return 'thông hiểu';
  if (t.includes('nhan biet')) return 'nhận biết';
  return '';
}

export function normalizeQuestion(raw, { optionsCount = 4, wantExplain = true } = {}) {
  const r = raw || {};
  const warns = [];

  const q = fixLatex(String(r.q ?? r.question ?? r.content ?? '').trim());

  let opts = r.options ?? r.choices ?? r.answers ?? [];
  if (opts && !Array.isArray(opts) && typeof opts === 'object') opts = Object.values(opts);
  opts = (Array.isArray(opts) ? opts : []).map((o) =>
    fixLatex(stripLabel(String(o ?? '').trim()))
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

  const explain = wantExplain ? fixLatex(String(r.explain ?? r.explanation ?? '').trim()) : '';

  if (!q) warns.push('Thiếu nội dung câu hỏi');
  if (opts.length < 2) warns.push('Thiếu đáp án');
  else {
    if (opts.length !== optionsCount) warns.push(`Có ${opts.length} đáp án (yêu cầu ${optionsCount})`);
    if (opts.some((o) => !o)) warns.push('Có đáp án để trống');
    if (new Set(opts.map(plain)).size < opts.length) warns.push('Có đáp án trùng nhau');
  }
  if ([q, explain, ...opts].some(oddDollar)) warns.push('Công thức ($) chưa đóng đủ');
  if (wantExplain && !explain) warns.push('Chưa có lời giải');
  if (typeof r.flag === 'string' && r.flag.trim()) warns.push(`AI lưu ý: ${r.flag.trim()}`);

  return {
    id: rid(),
    q,
    options: opts,
    correct,
    points: Number(r.points) > 0 ? Number(r.points) : 1,
    explain,
    topic: String(r.topic || '').trim().slice(0, 80),
    level: normalizeLevel(r.level),
    warns,
  };
}

/* ---------- Xáo vị trí đáp án ---------- */
const STEM_REF = /(?:đáp án|phương án|mệnh đề|ý)\s*[A-E]\b|\bcả\s+[A-E]\b/i;
const OPT_REF = /(?:đáp án|phương án|mệnh đề|ý)\s*[A-E]\b|\bcả\s+[A-E]\b|\b[A-E]\s*(?:và|,|&)\s*[A-E]\b|tất cả|cả hai|không có đáp án/i;

const EXPLAIN_REF = /(?:đáp án|phương án|chọn|ý)\s*[A-E]\b|\b[A-E]\s*(?:đúng|sai)\b/i;

export function shuffleOptions(q, rng = Math.random) {
  if (q.correct < 0 || q.options.length < 2) return q;
  // Lời giải nhắc chữ cái ("Chọn B…") → trộn sẽ làm lời giải sai, nên giữ nguyên
  if (EXPLAIN_REF.test(q.explain || '') || STEM_REF.test(q.q) || q.options.some((o) => OPT_REF.test(o))) return q;
  const idx = q.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { ...q, options: idx.map((i) => q.options[i]), correct: idx.indexOf(q.correct) };
}
export const shuffleAllOptions = (qs) => qs.map((q) => shuffleOptions(q));

export function shuffleQuestionOrder(qs) {
  const a = [...qs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return markDuplicates(a);
}

/* ---------- Bắt câu trùng ---------- */
export function markDuplicates(qs) {
  const toks = qs.map((q) => new Set(plain(q.q).split(/[^a-z0-9]+/).filter((w) => w.length > 1)));
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
  if (shuffle) qs = qs.map((q) => shuffleOptions(q));
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
   CẢNH BÁO / THỐNG KÊ BẢN NHÁP
   ============================================================ */
export function getFlags(q) {
  const f = [...(q.warns || [])];
  if (q.correct < 0) f.unshift('Chưa chọn đáp án đúng');
  return f;
}
export const collectWarnings = (qs) =>
  qs.map((q, i) => ({ index: i, messages: getFlags(q) })).filter((w) => w.messages.length);
export const countUnanswered = (qs) => qs.filter((q) => q.correct < 0).length;

export function summarizeDraft(qs) {
  const levels = {};
  let points = 0;
  qs.forEach((q) => {
    if (q.level) levels[q.level] = (levels[q.level] || 0) + 1;
    points += q.points || 1;
  });
  return {
    total: qs.length,
    unanswered: countUnanswered(qs),
    flagged: qs.filter((q) => getFlags(q).length > 0).length,
    levels,
    points,
  };
}

/* ---------- Lưu nháp (khôi phục khi tải lại trang) ---------- */
export function saveDraft(d) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: Date.now() })); } catch { /* đầy bộ nhớ */ }
}
export function loadDraft() {
  try {
    const v = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    return v?.questions?.length ? v : null;
  } catch { return null; }
}
export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* bỏ qua */ }
}

/* ============================================================
   PROMPT
   ============================================================ */
const JSON_FORMAT = `ĐỊNH DẠNG TRẢ VỀ: chỉ MỘT đối tượng JSON, không markdown, không văn bản ngoài JSON:
{"meta":{"title":"...","description":"...","duration":45},"questions":[{"q":"...","options":["...","...","...","..."],"work":"...","correct":0,"explain":"...","topic":"...","level":"nhận biết|thông hiểu|vận dụng|vận dụng cao","points":1}]}
- "work": bản nháp giải NGẮN (≤ 200 ký tự), CHỈ cho câu tính toán (giải từng bước rồi đối chiếu đáp án); câu lý thuyết để "". Phải điền "work" TRƯỚC khi chốt "correct".
- "correct" là chỉ số BẮT ĐẦU TỪ 0 của đáp án đúng trong "options".
- "options" KHÔNG có tiền tố A./B./C./D.
- Trong JSON, mỗi dấu gạch chéo ngược của LaTeX phải viết thành HAI dấu: "\\\\frac{1}{2}", "\\\\ce{H2O}", "\\\\text{m/s}".
- Thêm trường "flag" (chuỗi ngắn) CHỈ khi bạn không chắc chắn về đề hoặc đáp án của câu đó; nếu chắc chắn thì bỏ trường này.`;

function baseSystem({ subject, grade, optionsCount, explain }) {
  return [
    'Bạn là giáo viên giàu kinh nghiệm, chuyên ra đề kiểm tra trắc nghiệm theo chương trình giáo dục phổ thông Việt Nam.',
    `Mỗi câu có đúng ${optionsCount} đáp án và đúng 1 đáp án đúng. Dùng tiếng Việt (trừ nội dung môn ngoại ngữ).`,
    grade ? `Khối lớp: ${gradeLabel(grade)}.` : '',
    buildSubjectGuide(subject),
    [
      'CHẤT LƯỢNG ĐỀ:',
      '- Giải câu hỏi xong (trong "work") rồi mới viết đáp án; không chọn đáp án đúng trước rồi chế số cho khớp.',
      '- Đáp án nhiễu phải là kết quả của sai lầm THƯỜNG GẶP (nhầm công thức, sai dấu, quên đổi đơn vị, nhầm khái niệm gần giống), độ dài và hình thức tương đương đáp án đúng.',
      '- Mỗi câu kiểm tra một kỹ năng/ý khác nhau; phân bố vị trí đáp án đúng đều; không để đáp án đúng dài hơn hẳn các đáp án khác.',
      '- Lời giải chỉ ra vì sao đáp án đúng, KHÔNG nhắc chữ cái đáp án (A/B/C/D) vì đáp án sẽ được trộn thứ tự.',
    ].join('\n'),
    explain
      ? 'Mỗi câu phải có "explain" (lời giải 1–4 câu).'
      : 'Để "explain" là chuỗi rỗng.',
    JSON_FORMAT,
  ].filter(Boolean).join('\n\n');
}

const slim = (q) => ({
  q: q.q, options: q.options, correct: q.correct, explain: q.explain,
  topic: q.topic, level: q.level, points: q.points,
  ...(getFlags(q).length ? { warns: getFlags(q) } : {}),
});

/* ============================================================
   1) TẠO ĐỀ MỚI
   ============================================================ */
export async function generateExam({
  subject, grade, difficulty = 'medium', count = 10, optionsCount = 4,
  duration = 45, explain = true, prompt = '', files = [], signal, onProgress,
}) {
  const diff = DIFFICULTIES.find((d) => d.key === difficulty) || DIFFICULTIES[1];
  const { textParts, imageParts, pdfParts } = buildFileContext(files);
  const system = baseSystem({ subject, grade, optionsCount, explain });
  const total = Math.max(1, Math.min(60, Number(count) || 10));
  // Chia đều thành các lượt nhỏ rồi chạy SONG SONG: thời gian chờ ≈ 1 lượt thay vì cộng dồn
  const nBatches = Math.ceil(total / GEN_BATCH);
  const sizes = Array.from({ length: nBatches }, (_, b) =>
    Math.floor(total / nBatches) + (b < total % nBatches ? 1 : 0));

  const raws = [];
  let meta = null;
  let firstErr = null;
  const results = new Array(nBatches).fill(null);
  let done = 0;
  onProgress?.(0, nBatches);

  const runBatch = async (b) => {
    const userText = [
      `Hãy soạn ${sizes[b]} câu trắc nghiệm môn ${subject}, ${gradeLabel(grade)}.`,
      `Độ khó: ${diff.label} (${diff.mix}).`,
      prompt
        ? `Yêu cầu của giáo viên: ${prompt}`
        : 'Giáo viên không nêu chủ đề cụ thể: hãy bao quát các nội dung trọng tâm của chương trình.',
      nBatches > 1
        ? `Đề được chia thành ${nBatches} phần soạn độc lập cùng lúc. Bạn soạn PHẦN ${b + 1}/${nBatches}: chỉ chọn các nội dung/dạng bài thuộc nhóm kiến thức thứ ${b + 1} trên ${nBatches} của phạm vi yêu cầu, để không trùng với các phần khác.`
        : '',
      files.length ? 'Dùng tài liệu đính kèm làm căn cứ nội dung.' : '',
      `Thời gian làm bài ${duration} phút; đặt "meta.title" ngắn gọn.`,
    ].filter(Boolean).join('\n');
    try {
      results[b] = await callAndParse({
        system,
        parts: [...imageParts, ...pdfParts, { text: [...textParts, userText].join('\n\n') }],
        temperature: getSubject(subject).math ? 0.5 : 0.8,
        signal,
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      firstErr = firstErr || e; // một lượt lỗi → vẫn giữ các lượt còn lại
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
   2) SỐ HÓA ĐỀ CÓ SẴN (ảnh / PDF / Word / Excel)
   ============================================================ */
export async function digitizeExam({
  files, subject, grade, optionsCount = 4, duration = 45, explain = true, note = '', signal,
}) {
  if (!files?.length) throw new Error('Chưa có file để số hóa.');
  const { textParts, imageParts, pdfParts } = buildFileContext(files);
  const system = [
    baseSystem({ subject, grade, optionsCount, explain }),
    `NHIỆM VỤ SỐ HÓA:
- Chuyển ĐÚNG NGUYÊN VĂN các câu trắc nghiệm có trong tài liệu sang JSON; không sáng tác thêm, không bỏ sót, giữ nguyên thứ tự.
- Nếu tài liệu có đáp án (bảng đáp án, in đậm, gạch chân, tô màu) thì dùng đáp án đó.
- Nếu tài liệu KHÔNG có đáp án: tự giải để chọn đáp án và thêm "flag": "Tài liệu không có đáp án, AI tự giải".
- Công thức/ký hiệu trong ảnh phải chuyển sang LaTeX ($...$).
- Câu tự luận hoặc câu không đủ 2 đáp án thì bỏ qua và ghi số thứ tự các câu bỏ qua vào "meta.description".`,
  ].join('\n\n');

  const userText = [
    `Số hóa đề môn ${subject}, ${gradeLabel(grade)} từ tài liệu đính kèm.`,
    note ? `Ghi chú của giáo viên: ${note}` : '',
    `Thời gian làm bài ${duration} phút.`,
  ].filter(Boolean).join('\n');

  const p = await callAndParse({
    system,
    parts: [...imageParts, ...pdfParts, { text: [...textParts, userText].join('\n\n') }],
    temperature: 0.2,
    signal,
  });
  const list = listOf(p);
  if (!list.length) throw new Error('Không tìm thấy câu trắc nghiệm nào trong file. Hãy thử file rõ nét hơn.');
  return {
    meta: normalizeMeta(p?.meta, { title: `Đề ${subject} ${gradeLabel(grade)}`, duration }),
    questions: finalize(list, { optionsCount, wantExplain: explain }, { shuffle: false }),
  };
}

/* ============================================================
   3) CHỈNH ĐỀ HIỆN TẠI THEO LỜI NHẮN
   ============================================================ */
export async function refineExam({ draft, instruction, subject, grade, optionsCount = 4, explain = true, signal }) {
  const system = [
    baseSystem({ subject, grade, optionsCount, explain }),
    `NHIỆM VỤ CHỈNH SỬA:
- Áp dụng yêu cầu của giáo viên lên đề hiện tại, rồi trả về TOÀN BỘ danh sách câu hỏi sau chỉnh sửa.
- Câu không bị yêu cầu ảnh hưởng thì GIỮ NGUYÊN y hệt và đúng thứ tự.
- Nếu yêu cầu thêm câu, thêm vào cuối. Nếu có "warns" trên câu nào, hãy xem xét sửa các lỗi đó.`,
  ].join('\n\n');

  const p = await callAndParse({
    system,
    parts: [{
      text: `Yêu cầu chỉnh sửa: ${instruction}\n\nĐề hiện tại (JSON):\n${JSON.stringify({
        meta: draft.meta,
        questions: draft.questions.map(slim),
      })}`,
    }],
    temperature: 0.4,
    signal,
  });
  const list = listOf(p);
  if (!list.length) throw new Error('AI không trả về câu hỏi nào. Hãy nói rõ hơn yêu cầu chỉnh sửa.');
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
    `Giữ cùng chủ đề (${question.topic || 'như cũ'}) và mức độ (${question.level || 'như cũ'}) nếu giáo viên không yêu cầu khác.`,
    `Yêu cầu: ${instruction.trim() || 'Viết câu mới khác hoàn toàn nhưng cùng chủ đề và mức độ.'}`,
    `Câu hiện tại: ${JSON.stringify(slim(question))}`,
  ].join('\n');

  const p = await callAndParse({ system, parts: [{ text }], temperature: 0.8, signal });
  const first = listOf(p)[0];
  if (!first) throw new Error('AI không viết lại được câu này. Hãy thử lại.');
  const [nq] = finalize([first], { optionsCount, wantExplain: explain }, { shuffle: true });
  return { ...nq, points: question.points || nq.points };
}

/* ============================================================
   5) KIỂM TRA ĐÁP ÁN — AI tự giải lại độc lập
   ============================================================ */
export async function verifyExam({ questions, subject, signal, onProgress }) {
  const system = [
    `Môn học: ${subject}. Bạn là giáo viên thẩm định đề.`,
    'Với mỗi câu trắc nghiệm, hãy TỰ GIẢI ĐỘC LẬP từng bước rồi chọn đáp án đúng.',
    'Trả về JSON: {"answers":[{"i":0,"answer":2,"note":""}]}.',
    '"i" là số thứ tự được cho; "answer" là chỉ số đáp án đúng bắt đầu từ 0; đặt -1 nếu câu thiếu dữ kiện, không có đáp án đúng hoặc có nhiều đáp án đúng, và ghi lý do ngắn vào "note".',
  ].join('\n');

  const answers = new Map();
  const batches = chunk(questions.map((q, i) => ({ i, q: q.q, options: q.options })), BATCH);
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

  /* Phản biện lần 2: câu nào lệch đáp án thì giải lại bằng cách khác để tránh báo động giả */
  const disputed = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => {
      const a = answers.get(i);
      return a && Number.isInteger(a.answer) && a.answer >= 0 && q.correct >= 0 && a.answer !== q.correct;
    });
  if (disputed.length) {
    try {
      const p2 = await callAndParse({
        system: system + '\nĐây là lượt phản biện: hãy giải bằng MỘT CÁCH KHÁC với cách thông thường (thử thế ngược từng đáp án, hoặc dùng phương pháp khác), đối chiếu kỹ rồi mới trả lời.',
        parts: [{ text: `Các câu cần giải:\n${JSON.stringify(disputed.map(({ q, i }) => ({ i, q: q.q, options: q.options })))}` }],
        temperature: 0.3,
        signal,
      });
      const list2 = Array.isArray(p2) ? p2 : p2?.answers || [];
      list2.forEach((a2) => {
        if (!a2 || !Number.isInteger(a2.i)) return;
        const orig = questions[a2.i];
        // Lần 2 đồng ý với đáp án gốc của đề → coi là đúng (lần 1 là nhầm)
        if (orig && a2.answer === orig.correct) answers.set(a2.i, { ...a2, answer: orig.correct });
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw e; // lỗi khác: giữ kết quả lần 1
    }
  }

  let ok = 0, diff = 0, unsure = 0;
  const out = questions.map((q, i) => {
    const base = { ...q, warns: (q.warns || []).filter((w) => !w.startsWith(VERIFY_PREFIX)) };
    const a = answers.get(i);
    if (!a) return { ...base, verified: undefined };
    const ans = Number.isInteger(a.answer) ? a.answer : -1;
    if (ans < 0 || ans >= q.options.length) {
      unsure++;
      const why = a.note ? ` (${String(a.note).slice(0, 120)})` : '';
      return { ...base, verified: 'unsure', warns: [...base.warns, `${VERIFY_PREFIX}: không xác định được đáp án duy nhất${why}`] };
    }
    if (q.correct < 0) {
      return { ...base, verified: 'unsure', warns: [...base.warns, `${VERIFY_PREFIX} gợi ý đáp án ${letter(ans)}`] };
    }
    if (ans !== q.correct) {
      diff++;
      return {
        ...base,
        verified: 'diff',
        warns: [...base.warns, `${VERIFY_PREFIX} ra đáp án ${letter(ans)}, khác đáp án đang chọn (${letter(q.correct)}) — hãy kiểm tra`],
      };
    }
    ok++;
    return { ...base, verified: 'ok' };
  });
  return { questions: out, ok, diff, unsure };
}