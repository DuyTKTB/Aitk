/* ============================================================
   ai.js — ĐỘNG CƠ AI CỦA ELEC AI (v4)
   ------------------------------------------------------------
   Nâng cấp so với v3:
     1. STREAM SUY LUẬN THẬT: Gemini thinkingConfig (includeThoughts) và
        Groq reasoning_effort → đẩy ra onReasoning để UI hiển thị.
     2. ĐỊNH TUYẾN TÁC VỤ: classifyTask() chọn model/tầng + độ sâu suy luận
        (chat nhanh, bài toán khó suy luận sâu).
     3. GROUNDING: truy xuất dữ liệu chuẩn của app (công thức, hợp chất,
        118 nguyên tố, phản ứng, chuyên đề) → nhét vào system prompt.
     4. CÔNG CỤ TÍNH CHÍNH XÁC: khối lượng mol, cân bằng PTHH, số mol,
        thể tích, pH, tính theo phương trình → đáp án số không còn sai.
     5. TỰ KIỂM TRA: đối chiếu đáp án với kết quả công cụ (+ verifier tuỳ chọn).
     6. BỘ NHỚ: nén hội thoại cũ + hồ sơ học tập (khối lớp, chủ đề yếu).
     7. NHIỀU API KEY: xoay key khi 429 → hạn mức cao hơn, ít bị chặn.
     8. OCR DỰ PHÒNG: không có Gemini vision vẫn giải được ảnh đề bài.
     9. Cache bền (sessionStorage) + đua first-token tuỳ chọn (hedging).

   GIỮ TƯƠNG THÍCH: askAI(history, onChunk, onReasoning, systemPrompt)
   Thêm tuỳ chọn: askAI(history, onChunk, onReasoning, { mode, grade, uid, ... })
   ============================================================ */
import { trackRequest } from './apiTracker.js';
import {
  classifyTask, createKeyRing, buildProviderChain, modelsFor,
  warmUpGemini, lastUserText, discoveredGemini, coreText, reasoningParamFor,
} from './aiRouter.js';
import { buildSystemPrompt, VERIFY_SYSTEM_PROMPT } from './aiPrompts.js';
import { runTools, verifyToolResults } from './aiTools.js';
import { retrieve, formatContext, citationsOf } from './aiKnowledge.js';
import { loadProfile, buildMemoryBlock, compressHistory } from './aiMemory.js';
import { ocrImages } from './aiOcr.js';

const ENV = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

/* ============================================================
   API KEYS — hỗ trợ NHIỀU key mỗi provider (cách nhau bởi , ; | hoặc xuống dòng)
   ============================================================ */
const RINGS = {
  gemini: createKeyRing(ENV.VITE_GEMINI_KEY),
  groq: createKeyRing(ENV.VITE_GROQ_API_KEY),
  agnes: createKeyRing(ENV.VITE_AGNES_API_KEY),
};

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GROQ_BASE = 'https://api.groq.com/openai/v1';
const AGNES_BASE = 'https://apihub.agnes-ai.com/v1';

/* ============================================================
   THỜI GIAN & GIỚI HẠN
   ============================================================ */
const FIRST_TOKEN_MS = 45000;   // model có suy luận cần lâu hơn để ra token đầu
const STREAM_IDLE_MS = 20000;
const TOTAL_MS = 180000;
const RETRY_DELAY_MS = 900;
const MAX_RETRIES_PER_MODEL = 2;
const BACKOFF_DELAYS_MS = [800, 2200];

/** Hedging: bật bằng VITE_AI_HEDGE_MS=1400 hoặc options.hedgeMs */
const HEDGE_MS = Number(ENV.VITE_AI_HEDGE_MS || 0);
const MAX_PARALLEL = 2;

const THINKING_ENABLED = ENV.VITE_AI_THINKING !== '0';
const SAFETY_LEVEL = ENV.VITE_AI_SAFETY || 'educational';

/* ============================================================
   CACHE RESPONSE (30 phút, bền trong tab)
   ============================================================ */
const CACHE_ENABLED = ENV.VITE_AI_CACHE !== '0';
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 60;
const CACHE_STORE = 'cs-ai-cache-v1';
const responseCache = new Map(); // key → { text, model, timestamp }

(function loadCache() {
  if (!CACHE_ENABLED) return;
  try {
    const raw = sessionStorage.getItem(CACHE_STORE);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    for (const [k, v] of arr) {
      if (v && Date.now() - (v.timestamp || 0) < CACHE_TTL_MS) responseCache.set(k, v);
    }
  } catch { /* */ }
})();

let cacheSaveTimer = 0;
function persistCache() {
  if (!CACHE_ENABLED) return;
  clearTimeout(cacheSaveTimer);
  cacheSaveTimer = setTimeout(() => {
    try {
      sessionStorage.setItem(CACHE_STORE, JSON.stringify([...responseCache.entries()]));
    } catch { /* quota */ }
  }, 400);
}

function hashForCache(history, systemPrompt, requestType) {
  const str = JSON.stringify({
    s: (systemPrompt || '').length,
    t: requestType,
    h: history.map((m) => {
      const text = m.parts?.filter((p) => p.text).map((p) => p.text).join(' ') || m.text || m.content || '';
      const hasImg = m.parts?.some((p) => p.inlineData) || false;
      return { r: m.role, t: text, i: hasImg ? 'Y' : 'N' };
    }),
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `cache_${hash}_${str.length}`;
}

function getCached(history, systemPrompt, requestType) {
  if (!CACHE_ENABLED) return null;
  const key = hashForCache(history, systemPrompt, requestType);
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return entry;
}

function setCache(history, systemPrompt, requestType, text, model) {
  if (!CACHE_ENABLED || !text) return;
  const key = hashForCache(history, systemPrompt, requestType);
  responseCache.set(key, { text, model, timestamp: Date.now() });
  if (responseCache.size > CACHE_MAX) {
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
  persistCache();
}

/* ============================================================
   SỨC KHOẺ MODEL — tự bỏ qua model hết quota
   ============================================================ */
const modelHealth = new Map(); // "provider/model" → { exhaustedUntil, failCount }

function markModelExhausted(providerId, model, retryAfterMs = 60 * 60 * 1000) {
  const key = `${providerId}/${model}`;
  modelHealth.set(key, {
    exhaustedUntil: Date.now() + retryAfterMs,
    failCount: (modelHealth.get(key)?.failCount || 0) + 1,
  });
  console.warn(`[ELEC AI] ⚠️ ${key} cooldown ${Math.round(retryAfterMs / 1000)}s`);
}

function isModelAvailable(providerId, model) {
  const key = `${providerId}/${model}`;
  const st = modelHealth.get(key);
  if (!st) return true;
  if (Date.now() > st.exhaustedUntil) { modelHealth.delete(key); return true; }
  return false;
}

function parseRetryAfterMs(errorMessage) {
  const str = String(errorMessage || '');
  let total = 0;
  const h = str.match(/([\d.]+)\s*h/);
  const m = str.match(/([\d.]+)\s*m(?!odel|s)/);
  const s = str.match(/([\d.]+)\s*s/);
  if (h) total += parseFloat(h[1]) * 3600000;
  if (m) total += parseFloat(m[1]) * 60000;
  if (s) total += parseFloat(s[1]) * 1000;
  return total > 0 ? total : null;
}

/* ============================================================
   THÔNG ĐIỆP LỖI
   ============================================================ */
/* Thông điệp hệ thống: KHÔNG dùng emoji — icon trong UI là SVG. */
export const MSG_OUT_OF_QUOTA =
  'Bạn đã hết quyền sử dụng AI miễn phí hôm nay.\n\n' +
  'Để được cấp thêm lượt, vui lòng liên hệ Admin:\n' +
  'Facebook: https://www.facebook.com/nguyentheduytk\n\n' +
  'Xin lỗi vì sự bất tiện. Hẹn gặp bạn vào ngày mai!';

export const MSG_RATE_LIMIT =
  'Hệ thống AI đang quá tải do nhiều người dùng cùng lúc.\n\n' +
  'Bạn chưa bị trừ lượt. Hãy đợi vài giây rồi thử lại nhé.';

const MSG_API_KEY_ERROR =
  'API key không hợp lệ hoặc đã bị thu hồi.\n\n' +
  'Vui lòng liên hệ Admin để được hỗ trợ:\n' +
  'Facebook: https://www.facebook.com/nguyentheduytk';

class OutOfQuotaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OutOfQuotaError';
    this.isQuota = true;
    this.isRateLimit = message === MSG_RATE_LIMIT;
  }
}

class AbortError extends Error {
  constructor() { super('Đã dừng'); this.name = 'AbortError'; this.isAbort = true; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
   CHUẨN HÓA HÓA HỌC (Unicode, không LaTeX)
   ============================================================ */
const SUB_MAP = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
};

const SUP_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ',
};

const LATEX_SYMBOLS = {
  Delta: 'Δ', delta: 'δ', alpha: 'α', beta: 'β', gamma: 'γ',
  lambda: 'λ', mu: 'μ', pi: 'π', sigma: 'σ', theta: 'θ',
  omega: 'ω', Omega: 'Ω', circ: '°', degree: '°',
  rightarrow: '→', longrightarrow: '→', Rightarrow: '→', to: '→',
  rightleftharpoons: '⇌', leftrightharpoons: '⇌', leftrightarrow: '⇌',
  uparrow: '↑', downarrow: '↓', times: '×', cdot: '·', pm: '±',
  approx: '≈', neq: '≠', ne: '≠', leq: '≤', le: '≤', geq: '≥', ge: '≥',
  lt: '<', gt: '>', infty: '∞', ldots: '…', dots: '…',
  left: '', right: '', quad: ' ', qquad: ' ',
};

const NO_SPACE_AFTER = new Set([
  'Delta', 'delta', 'alpha', 'beta', 'gamma', 'lambda', 'mu',
  'pi', 'sigma', 'theta', 'omega', 'Omega', 'circ', 'degree', 'left', 'right',
]);

function mapChars(str, map) {
  const t = str.replace(/\s/g, '');
  if (!t) return '';
  const chars = [...t];
  return chars.every((c) => map[c]) ? chars.map((c) => map[c]).join('') : null;
}

function latexToUnicode(text) {
  if (!text || !/[\\$^_]/.test(text)) return text;
  let s = text;
  s = s.replace(/\$\$/g, '');
  s = s.replace(/\\[()[\]]/g, '');
  s = s.replace(/\$/g, '');
  for (let i = 0; i < 2; i++) {
    s = s.replace(
      /([ \t]*)\\(?:text|textbf|textit|mathrm|mathbf|mathit|operatorname|boldsymbol|ce)\s*\{([ \t]*)([^{}]*)\}/g,
      (m, pre, lead, x) => (pre || lead ? ' ' : '') + x
    );
  }
  s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');
  s = s.replace(/\\([A-Za-z]+)( ?)/g, (m, name, sp) => {
    if (!Object.prototype.hasOwnProperty.call(LATEX_SYMBOLS, name)) return m;
    return LATEX_SYMBOLS[name] + (NO_SPACE_AFTER.has(name) ? '' : sp);
  });
  s = s.replace(/\\[,;:!]/g, ' ');
  s = s.replace(/\\%/g, '%');
  s = s.replace(/\\ /g, ' ');
  s = s.replace(/\b10\^([+-]?\d+)/g, (m, d) => '10' + (mapChars(d, SUP_MAP) ?? '^' + d));
  s = s.replace(/\^\s*\{\s*°\s*\}/g, '°').replace(/\^°/g, '°');
  s = s.replace(/_\{([^{}]*)\}/g, (m, x) => {
    const r = mapChars(x, SUB_MAP);
    return r !== null ? r : '_' + x.trim();
  });
  s = s.replace(/\^\{([^{}]*)\}/g, (m, x) => {
    const r = mapChars(x, SUP_MAP);
    return r !== null ? r : '^(' + x.trim() + ')';
  });
  s = s.replace(/([A-Za-z)\]°])_(\d+)/g, (m, a, d) => a + mapChars(d, SUB_MAP));
  return s;
}

const CHEM_REPLACEMENTS = [
  ['H2SO4', 'H₂SO₄'], ['H2CO3', 'H₂CO₃'], ['H2S', 'H₂S'], ['H2O2', 'H₂O₂'], ['H2O', 'H₂O'],
  ['HNO3', 'HNO₃'], ['HNO2', 'HNO₂'], ['NH4', 'NH₄'], ['NH3', 'NH₃'],
  ['CO2', 'CO₂'], ['CO3', 'CO₃'], ['SO4', 'SO₄'], ['SO3', 'SO₃'], ['SO2', 'SO₂'],
  ['NO3', 'NO₃'], ['NO2', 'NO₂'], ['PO4', 'PO₄'], ['PO3', 'PO₃'], ['HCO3', 'HCO₃'],
  ['CH4', 'CH₄'], ['C2H6', 'C₂H₆'], ['C2H4', 'C₂H₄'], ['C2H2', 'C₂H₂'],
  ['C3H8', 'C₃H₈'], ['C3H6', 'C₃H₆'], ['C3H4', 'C₃H₄'], ['C6H6', 'C₆H₆'],
  ['C6H12O6', 'C₆H₁₂O₆'],
  ['CaOH2', 'Ca(OH)₂'], ['Ca(OH)2', 'Ca(OH)₂'],
  ['Fe2O3', 'Fe₂O₃'], ['Fe3O4', 'Fe₃O₄'], ['Al2O3', 'Al₂O₃'], ['AlOH3', 'Al(OH)₃'],
  ['CuSO4', 'CuSO₄'], ['ZnSO4', 'ZnSO₄'],
  ['Na2CO3', 'Na₂CO₃'], ['NaHCO3', 'NaHCO₃'], ['Na2SO4', 'Na₂SO₄'],
  ['CaCO3', 'CaCO₃'], ['CaSO4', 'CaSO₄'], ['MgCl2', 'MgCl₂'],
  ['BaSO4', 'BaSO₄'], ['BaCl2', 'BaCl₂'],
  ['AgNO3', 'AgNO₃'], ['KMnO4', 'KMnO₄'], ['K2Cr2O7', 'K₂Cr₂O₇'], ['Na2S2O3', 'Na₂S₂O₃'],
].sort((a, b) => b[0].length - a[0].length);

const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* KHÔNG dùng lookbehind (?<!...) ở đây: Safari/iOS < 16.4 (iPhone 8 trở xuống)
   ném "Invalid regular expression: invalid group specifier name" ngay khi nạp
   module → cả trang AI trắng. Thay bằng cách bắt ký tự đứng trước vào group 1
   rồi ghép lại khi thay thế. */
const CHEM_RE = new RegExp(`(^|[^0-9])(${CHEM_REPLACEMENTS.map(([f]) => escRe(f)).join('|')})(?![0-9a-z])`, 'g');
const CHEM_MAP = new Map(CHEM_REPLACEMENTS);

function normalizeChemTextOnly(text) {
  let result = latexToUnicode(text)
    .replace(/\^3\+/g, '³⁺').replace(/\^2\+/g, '²⁺').replace(/\^1\+/g, '⁺')
    .replace(/\^\+/g, '⁺').replace(/\^3-/g, '³⁻').replace(/\^2-/g, '²⁻')
    .replace(/\^1-/g, '⁻').replace(/\^-/g, '⁻');
  result = result.replace(CHEM_RE, (m, prefix, chem) => prefix + (CHEM_MAP.get(chem) ?? chem));
  return result
    .replace(/<=>/g, '⇌').replace(/<->/g, '⇌')
    .replace(/-->/g, '→').replace(/->/g, '→').replace(/=>/g, '→')
    .replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/\+-/g, '±');
}

export function normalizeChemistryText(text) {
  if (!text) return '';
  return String(text)
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) => (i % 2 === 1 ? part : normalizeChemTextOnly(part)))
    .join('');
}

/* ============================================================
   CHUẨN BỊ NỘI DUNG GỬI MODEL
   ============================================================ */
function prepareGeminiContents(history) {
  return history.map((message) => {
    if (message.role === 'model') {
      return { role: 'model', parts: [{ text: message.parts?.[0]?.text || message.text || '' }] };
    }
    const parts = message.parts || [];
    const textParts = parts.filter((p) => p.text).map((p) => p.text);
    const text = textParts.join('\n') || message.text || '';
    const imageParts = parts.filter((p) => p.inlineData);

    const geminiParts = [];
    if (text) geminiParts.push({ text });
    for (const img of imageParts) {
      geminiParts.push({ inline_data: { mime_type: img.inlineData.mimeType, data: img.inlineData.data } });
    }
    if (geminiParts.length === 0) geminiParts.push({ text: '' });
    return { role: 'user', parts: geminiParts };
  });
}

function prepareOpenAIMessages(history, systemPrompt) {
  const messages = [{ role: 'system', content: systemPrompt }];
  for (const message of history) {
    const role = message.role === 'model' ? 'assistant' : 'user';
    if (role === 'assistant') {
      let text = '';
      if (typeof message.content === 'string') text = message.content;
      else if (Array.isArray(message.parts)) text = message.parts.filter((p) => p.text).map((p) => p.text).join('\n');
      else if (typeof message.text === 'string') text = message.text;
      messages.push({ role, content: text || '' });
      continue;
    }
    const parts = Array.isArray(message.parts) ? message.parts : [];
    const text = parts.filter((p) => p.text).map((p) => p.text).join('\n') || message.text || '';
    messages.push({ role, content: text || '' });
  }
  return messages;
}

/* ============================================================
   SAFETY SETTINGS
   - Giáo dục: cho phép nội dung hóa học nhạy cảm (chất độc, phản ứng mạnh)
     nhưng vẫn chặn nội dung nguy hiểm rõ ràng; system prompt đã có quy tắc an toàn.
   ============================================================ */
function geminiSafetySettings() {
  const strict = SAFETY_LEVEL === 'strict';
  const none = (c) => ({ category: c, threshold: 'BLOCK_NONE' });
  return [
    none('HARM_CATEGORY_HARASSMENT'),
    none('HARM_CATEGORY_HATE_SPEECH'),
    none('HARM_CATEGORY_SEXUALLY_EXPLICIT'),
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: strict ? 'BLOCK_MEDIUM_AND_ABOVE' : 'BLOCK_ONLY_HIGH' },
  ];
}

/* ============================================================
   STREAM GEMINI (có thinking)
   ============================================================ */
async function streamGemini({
  model, contents, temperature, maxTokens, systemPrompt, ctrl, claim, onChunk, onReasoning,
  thinkingBudget = 0, key, safety = true,
}) {
  let stall;
  let reader;
  const arm = (ms) => { clearTimeout(stall); stall = setTimeout(() => ctrl.abort(), ms); };
  const wantThinking = THINKING_ENABLED && thinkingBudget > 0 && !/gpt-oss/i.test(model);

  const buildBody = (useThinking) => {
    const body = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature, maxOutputTokens: maxTokens, topP: 0.9 },
    };
    if (useThinking) {
      body.generationConfig.thinkingConfig = { includeThoughts: true, thinkingBudget };
    }
    if (safety) body.safetySettings = geminiSafetySettings();
    return body;
  };

  try {
    arm(FIRST_TOKEN_MS);
    let useThinking = wantThinking;
    let res = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const url = `${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
      trackRequest('gemini');
      res = await fetch(url, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(useThinking)),
      });

      if (res.ok) break;

      const status = res.status;
      const bodyText = await res.text().catch(() => '');
      console.warn(`[ELEC AI] ✗ Gemini/${model} → ${status}`, bodyText.slice(0, 200));

      // Model không hỗ trợ thinkingConfig → thử lại không suy luận
      if (useThinking && status === 400 && /thinking|thought|unknown field|invalid/i.test(bodyText)) {
        useThinking = false;
        continue;
      }

      if (status === 429 || status === 503 || status === 500) trackRequest('gemini', true);

      if (status === 429) {
        const err = new OutOfQuotaError(MSG_RATE_LIMIT);
        err.rawBody = bodyText;
        err.perKey = /quota|quotaexceeded|free_tier|per.?day|billing/i.test(bodyText);
        throw err;
      }
      if (status === 503 || status === 502 || status === 504) {
        const err = new Error(`${model} quá tải (${status})`);
        err.status = status; err.isOverload = true; throw err;
      }
      if (status === 404) {
        const err = new Error(`${model} không tồn tại`);
        err.status = 404; err.isNotFound = true; throw err;
      }
      if (status === 401 || status === 403 || /API[_ ]KEY/i.test(bodyText)) {
        const err = new Error(MSG_API_KEY_ERROR);
        err.isAuth = true;
        throw err;
      }
      const err = new Error(`Gemini ${model} lỗi ${status}`);
      err.status = status;
      throw err;
    }

    reader = res.body.getReader();
    const dec = new TextDecoder('utf-8');
    let buf = '';
    let text = '';
    let reasoning = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += dec.decode(value, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || '';

      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const data = t.slice(5).trim();
        if (!data) continue;

        let parsed;
        try { parsed = JSON.parse(data); } catch { continue; }
        if (parsed.error) {
          console.warn('[ELEC AI] Gemini stream error:', parsed.error.message);
          continue;
        }

        const parts = parsed.candidates?.[0]?.content?.parts || [];
        const thoughts = parts.filter((p) => p.thought && p.text).map((p) => p.text).join('');
        const answers = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('');

        if (thoughts) {
          if (onReasoning) {
            reasoning += thoughts;
            if (!claim()) return null;
            arm(STREAM_IDLE_MS);
            onReasoning(normalizeChemistryText(reasoning));
          }
        }
        if (!answers) continue;
        if (!claim()) return null;

        text += answers;
        arm(STREAM_IDLE_MS);
        onChunk(normalizeChemistryText(text));
      }
    }

    return { text: normalizeChemistryText(text.trim()), reasoning: normalizeChemistryText(reasoning.trim()), model };
  } finally {
    clearTimeout(stall);
    reader?.cancel().catch(() => {});
  }
}

/* ============================================================
   STREAM OPENAI-COMPATIBLE (Groq / Agnes) — có reasoning_effort
   ============================================================ */
async function streamOpenAICompat({
  providerId, base, key, model, messages, temperature, maxTokens, ctrl, claim, onChunk, onReasoning, reasoningEffort,
}) {
  let stall;
  let reader;
  const arm = (ms) => { clearTimeout(stall); stall = setTimeout(() => ctrl.abort(), ms); };

  const body = { model, messages, stream: true, temperature, max_tokens: maxTokens, top_p: 0.9 };
  const reasoningParam = reasoningParamFor(model, reasoningEffort);
  if (reasoningParam) Object.assign(body, reasoningParam);

  try {
    arm(FIRST_TOKEN_MS);
    trackRequest(providerId);

    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const status = res.status;
      const bodyText = await res.text().catch(() => '');
      console.warn(`[ELEC AI] ✗ ${providerId}/${model} → ${status}`, bodyText.slice(0, 200));
      if (status === 429 || status === 503 || status === 500) trackRequest(providerId, true);

      if (status === 429) {
        const err = new OutOfQuotaError(MSG_RATE_LIMIT);
        err.rawBody = bodyText;
        err.perKey = /rate.?limit|tokens per|quota/i.test(bodyText);
        throw err;
      }
      if (status === 503 || status === 502 || status === 504 || status === 500) {
        const err = new Error(`${model} quá tải (${status})`);
        err.status = status; err.isOverload = true; throw err;
      }
      if (status === 401 || status === 403) {
        const err = new Error(MSG_API_KEY_ERROR);
        err.isAuth = true;
        throw err;
      }
      if (status === 404) {
        const err = new Error(`${model} không tồn tại`);
        err.status = 404; err.isNotFound = true; throw err;
      }
      const err = new Error(`${providerId} ${model} lỗi ${status}`);
      err.status = status;
      throw err;
    }

    reader = res.body.getReader();
    const dec = new TextDecoder('utf-8');
    let buf = '';
    let text = '';
    let reasoning = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += dec.decode(value, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || '';

      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const data = t.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        let parsed;
        try { parsed = JSON.parse(data); } catch { continue; }
        const delta = parsed.choices?.[0]?.delta || {};

        const think = delta.reasoning || delta.reasoning_content || '';
        if (think && onReasoning) {
          reasoning += think;
          if (!claim()) return null;
          arm(STREAM_IDLE_MS);
          onReasoning(normalizeChemistryText(reasoning));
        }

        const chunk = delta.content || '';
        if (!chunk) continue;
        if (!claim()) return null;

        text += chunk;
        arm(STREAM_IDLE_MS);
        onChunk(normalizeChemistryText(text));
      }
    }

    return { text: normalizeChemistryText(text.trim()), reasoning: normalizeChemistryText(reasoning.trim()), model };
  } finally {
    clearTimeout(stall);
    reader?.cancel().catch(() => {});
  }
}

/* ============================================================
   XÂY KẾ HOẠCH REQUEST (tách riêng để test + debug được)
   ============================================================ */
const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

/**
 * buildRequestPlan(history, opts) → { task, systemPrompt, knowledge, toolBlock,
 *                                     toolHits, citations, recentHistory, profile, olderSummary }
 * Không gọi mạng — dùng được cho test/UI preview.
 */
export function buildRequestPlan(history, opts = {}) {
  const historyArr = Array.isArray(history) ? history : [];
  const task = opts.task || classifyTask(historyArr);

  const lastText = coreText(lastUserText(historyArr));
  const prevUserText = (() => {
    const users = historyArr.filter((m) => m.role === 'user');
    return users.length > 1 ? coreText(lastUserText(users.slice(0, -1))) : '';
  })();
  // Đề bài có thể nằm ở lượt TRƯỚC (ảnh gửi trước rồi mới hỏi) → ghép lại để truy xuất
  const contextText = lastText.length < 60 && prevUserText ? `${prevUserText} ${lastText}` : lastText;
  const substantive = contextText.length >= 12;

  const customSystemPrompt = typeof opts.systemPrompt === 'string' ? opts.systemPrompt : null;
  const useContext = opts.useContext !== false && !customSystemPrompt;

  let knowledge = '';
  let citations = [];
  if (useContext && substantive && task.needKnowledge && opts.useKnowledge !== false) {
    const hits = retrieve(contextText, { k: 4, grade: opts.grade });
    knowledge = formatContext(hits);
    citations = citationsOf(hits);
  }

  let toolBlock = '';
  let toolHits = [];
  if (useContext && substantive && task.needTools && opts.useTools !== false) {
    const r = runTools(contextText, { grade: opts.grade });
    toolHits = r.hits;
    toolBlock = r.summary;
  }

  const profile = opts.uid ? loadProfile(opts.uid) : null;
  const keep = opts.keepTurns || 8;
  const { recent, olderSummary } = compressHistory(historyArr, { keep });
  const memoryBlock = buildMemoryBlock({ profile, olderSummary });

  const systemPrompt = customSystemPrompt
    ? [customSystemPrompt, memoryBlock].filter(Boolean).join('\n\n')
    : buildSystemPrompt({
      mode: opts.mode || 'auto',
      grade: opts.grade || profile?.grade || '',
      hard: task.hard,
      knowledge,
      toolResults: toolBlock,
      hasImage: task.kind === 'vision',
      extra: memoryBlock,
    });

  return {
    task,
    systemPrompt,
    knowledge,
    toolBlock,
    toolHits,
    citations,
    recentHistory: recent,
    olderSummary,
    profile,
    contextText,
  };
}

/* ============================================================
   LƯỢT TỰ KIỂM TRA BẰNG AI KHÁC (tuỳ chọn, tốn thêm 1 request)
   ============================================================ */
async function runVerifierPass({ providers, chain, toolBlock, question, answer, excludeId }) {
  const target = chain.find((p) => p.id !== excludeId && RINGS[p.id]?.size) || chain[0];
  if (!target) return '';
  const key = RINGS[target.id]?.get();
  if (!key) return '';
  const model = target.models[0];
  if (!model) return '';

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  const userText =
    `CÂU HỎI/ĐỀ BÀI:\n${clip(question, 1500)}\n\n` +
    (toolBlock ? `KẾT QUẢ ĐÃ TÍNH BẰNG CÔNG CỤ NỘI BỘ:\n${clip(toolBlock, 1200)}\n\n` : '') +
    `LỜI GIẢI CẦN THẨM ĐỊNH:\n${clip(answer, 3000)}`;

  try {
    let out = '';
    const onChunk = (t) => { out = t; };
    const claim = () => true;
    if (target.id === 'gemini') {
      await streamGemini({
        model, contents: [{ role: 'user', parts: [{ text: userText }] }],
        temperature: 0.1, maxTokens: 700, systemPrompt: VERIFY_SYSTEM_PROMPT,
        ctrl, claim, onChunk, thinkingBudget: 0, key, safety: true,
      });
    } else {
      const base = target.id === 'groq' ? GROQ_BASE : AGNES_BASE;
      await streamOpenAICompat({
        providerId: target.id, base, key, model,
        messages: [{ role: 'system', content: VERIFY_SYSTEM_PROMPT }, { role: 'user', content: userText }],
        temperature: 0.1, maxTokens: 700, ctrl, claim, onChunk, reasoningEffort: 'low',
      });
    }
    return out.trim();
  } catch (e) {
    console.warn('[ELEC AI] Verifier bỏ qua:', e?.message || e);
    return '';
  } finally {
    clearTimeout(timer);
  }
}

/* ============================================================
   HÀM CHÍNH — askAI
   ============================================================ */
export function askAI(history, onChunk, onReasoning, systemPromptOrOptions = null, maybeOptions = null) {
  /* ---- Tương thích chữ ký cũ: askAI(h, onChunk, onReasoning, systemPrompt) ---- */
  const options = (typeof systemPromptOrOptions === 'object' && systemPromptOrOptions !== null)
    ? systemPromptOrOptions
    : { ...(maybeOptions || {}), systemPrompt: typeof systemPromptOrOptions === 'string' ? systemPromptOrOptions : undefined };

  const historyArr = Array.isArray(history) ? history : [];
  if (!historyArr.length) return Promise.reject(new Error('Không có nội dung câu hỏi.'));

  const anyKey = RINGS.gemini.size + RINGS.groq.size + RINGS.agnes.size;
  if (!anyKey) return Promise.reject(new Error('Chưa cấu hình API key nào trong .env'));

  /* ---- Kế hoạch: phân loại tác vụ + grounding + công cụ + bộ nhớ ---- */
  const plan = buildRequestPlan(historyArr, options);
  const { task } = plan;
  let { systemPrompt, toolBlock, toolHits, citations } = plan;

  /* ---- Gom ảnh để kiểm tra khả năng vision ---- */
  const lastUser = [...historyArr].reverse().find((m) => m.role === 'user');
  const imageParts = (lastUser?.parts || []).filter((p) => p.inlineData);
  const hasImg = imageParts.length > 0;

  /* ---- Cache tức thời (không tốn request) ---- */
  if (CACHE_ENABLED && !hasImg && options.noCache !== true) {
    const cached = getCached(plan.recentHistory, systemPrompt, task.kind);
    if (cached) {
      console.log(`[ELEC AI] ✓ Cache hit (${cached.model})`);
      setTimeout(() => onChunk?.(cached.text), 30);
      // Đáp án lấy từ cache vẫn được tự kiểm tra (miễn phí, chỉ so số)
      const verification = toolHits.length && options.verify !== false
        ? verifyToolResults(cached.text, toolHits)
        : null;
      const p = Promise.resolve({
        text: cached.text,
        reasoning: '',
        model: `${cached.model} (cache)`,
        kind: task.kind,
        citations,
        toolHits,
        verification,
        fromCache: true,
      });
      p.abort = () => {};
      return p;
    }
  }

  let promiseAbort = null;
  const promise = new Promise((resolve, reject) => {
    let finished = false;
    let aborted = false;
    let lastError = null;
    let winner = null;
    const ctrls = [];
    let attempts = [];        // [{id, model}]
    const keyTries = new Map();
    let activeCount = 0;

    const finish = (fn, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(totalTimer);
      fn(value);
    };
    const totalTimer = setTimeout(() => {
      ctrls.forEach((c) => { try { c.abort(); } catch { /* */ } });
      finish(reject, lastError || new Error('AI phản hồi quá chậm, bạn thử lại nhé.'));
    }, options.timeoutMs || TOTAL_MS);

    const abortAll = () => { ctrls.forEach((c) => { try { c.abort(); } catch { /* */ } }); };

    /* ---- Chuẩn bị chuỗi provider (đổi được khi phải OCR dự phòng) ---- */
    let effectiveTask = task;
    const buildChain = () => buildProviderChain({ task: effectiveTask, rings: RINGS }).map((p) => ({
      ...p,
      models: p.models.filter((m) => isModelAvailable(p.id, m)),
    })).filter((p) => p.models.length);
    let chain = buildChain();

    const buildAttempts = () => {
      const list = [];
      for (const p of chain) for (const m of p.models) list.push({ id: p.id, model: m });
      return list;
    };

    const hedgeMs = Number(options.hedgeMs ?? HEDGE_MS) || 0;

    const abortFn = () => {
      if (finished) return;
      aborted = true;
      abortAll();
      finish(reject, new AbortError());
    };

    /* ---- Xử lý khi hết ảnh mà không có vision → OCR dự phòng ---- */
    const proceed = () => {
      attempts = buildAttempts();
      if (!attempts.length) {
        finish(reject, lastError || new Error('Tất cả AI đều đang bận hoặc hết quota. Bạn thử lại sau ít phút nhé.'));
        return;
      }
      launchNext();
    };

    const launchNext = (reason) => {
      if (finished || aborted || winner !== null) return;
      if (!attempts.length) {
        if (activeCount === 0) {
          finish(reject, lastError || new Error('Tất cả AI đều thất bại. Thử lại sau.'));
        }
        return;
      }
      const { id, model } = attempts.shift();
      const ring = RINGS[id];
      const key = ring?.get();
      if (!key) {
        // Key đang cooldown hết → nhảy attempt kế tiếp
        lastError = lastError || new Error(`${id} tạm thời hết hạn mức`);
        setTimeout(launchNext, 60);
        return;
      }

      const i = ctrls.length;
      const ctrl = new AbortController();
      ctrls[i] = ctrl;
      activeCount++;

      let gotFirst = false;
      let hedgeTimer = 0;
      const clearHedge = () => { if (hedgeTimer) { clearTimeout(hedgeTimer); hedgeTimer = 0; } };

      const claim = () => {
        if (aborted) return false;
        if (!gotFirst) {
          gotFirst = true;
          clearHedge();
          keyTries.delete(id);
          ring.reportGood(key);
        }
        if (winner === null) {
          winner = i;
          ctrls.forEach((c, j) => { if (j !== i) { try { c.abort(); } catch { /* */ } } });
          if (reason === 'hedge') console.log(`[ELEC AI] ✓ (đua song song) ${id}/${model}`);
          else console.log(`[ELEC AI] ✓ ${id}/${model}`);
        }
        return winner === i;
      };

      const wrappedChunk = (partial) => { if (claim()) onChunk?.(partial); };
      const wrappedReason = (partial) => { if (claim()) onReasoning?.(partial); };

      const callOnce = () => {
        if (id === 'gemini') {
          return streamGemini({
            model,
            contents: prepareGeminiContents(plan.recentHistory),
            temperature: task.temperature,
            maxTokens: task.maxTokens,
            systemPrompt,
            ctrl, claim: () => true, onChunk: wrappedChunk, onReasoning: wrappedReason,
            thinkingBudget: task.thinkingBudget, key, safety: true,
          });
        }
        const base = id === 'groq' ? GROQ_BASE : AGNES_BASE;
        return streamOpenAICompat({
          providerId: id, base, key, model,
          messages: prepareOpenAIMessages(plan.recentHistory, systemPrompt),
          temperature: task.temperature,
          maxTokens: task.maxTokens,
          ctrl, claim: () => true, onChunk: wrappedChunk, onReasoning: wrappedReason,
          reasoningEffort: task.reasoningEffort,
        });
      };

      const runAttempt = async () => {
        let attempt = 0;
        while (true) {
          try {
            return await callOnce();
          } catch (err) {
            if (err?.isAbort || aborted) throw err;
            if (err?.isOverload && attempt < MAX_RETRIES_PER_MODEL) {
              const delay = BACKOFF_DELAYS_MS[attempt] || 2500;
              await sleep(delay);
              attempt++;
              if (ctrl.signal.aborted) return null;
              continue;
            }
            throw err;
          }
        }
      };

      if (hedgeMs > 0) {
        hedgeTimer = setTimeout(() => {
          if (!finished && !aborted && winner === null && activeCount < MAX_PARALLEL) {
            launchNext('hedge');
          }
        }, hedgeMs);
      }

      runAttempt()
        .then((r) => {
          activeCount--;
          clearHedge();
          if (aborted) return;
          if (winner === i && r?.text) {
            onChunk?.(r.text);
            if (!hasImg) setCache(plan.recentHistory, systemPrompt, task.kind, r.text, `${id}/${model}`);
            finish(resolve, {
              text: r.text,
              reasoning: r.reasoning || '',
              model: `${id}/${model}`,
              kind: task.kind,
              hard: task.hard,
              citations,
              toolHits,
              fromCache: false,
            });
          } else if (winner === i) {
            finish(reject, new Error(`${id}/${model} không trả nội dung`));
          } else if (winner === null) {
            lastError = lastError || new Error(`${id}/${model} không trả nội dung`);
            setTimeout(launchNext, 120);
          }
        })
        .catch((err) => {
          activeCount--;
          clearHedge();
          if (err?.isAbort || err?.name === 'AbortError' || aborted) return;

          if (err?.isQuota) {
            const retryAfter = parseRetryAfterMs(err.rawBody || err.message);
            const tries = keyTries.get(id) || 0;
            /* Hết quota thường là theo TÀI KHOẢN/provider → bỏ luôn các model còn lại
               của provider này, tránh bắt người dùng chờ qua nhiều lượt thử vô ích */
            const dropProviderModels = () => {
              attempts = attempts.filter((a) => a.id !== id);
            };
            if (ring.size > 1 && tries < ring.size - 1 && ring.badCount() < ring.size) {
              // Còn key khác → đổi key, thử lại cùng provider/model
              ring.reportBad(key, retryAfter || 5 * 60 * 1000);
              keyTries.set(id, tries + 1);
              console.warn(`[ELEC AI] ↻ Xoay API key cho ${id} (lần ${tries + 1})`);
              setTimeout(() => {
                if (finished || aborted || winner !== null) return;
                attempts.unshift({ id, model });
                launchNext();
              }, 200);
              return;
            }
            if (/quota|exceeded|exhaust/i.test(err.rawBody || '') || !err.isRateLimit) {
              markModelExhausted(id, model, retryAfter || 60 * 60 * 1000);
              dropProviderModels();
            }
            if (winner === null) { lastError = err; setTimeout(launchNext, 150); }
            return;
          }

          if (err?.isAuth) {
            ring.reportBad(key, 30 * 60 * 1000);
            if (winner === null) { lastError = lastError || err; setTimeout(launchNext, 120); }
            return;
          }

          if (err?.isNotFound) {
            markModelExhausted(id, model, 6 * 60 * 60 * 1000);
            if (winner === null) { lastError = lastError || err; setTimeout(launchNext, 120); }
            return;
          }

          if (err?.isOverload) {
            if (winner === null) { lastError = err; setTimeout(launchNext, RETRY_DELAY_MS); }
            return;
          }

          if (winner === i) finish(reject, err instanceof Error ? err : new Error(String(err)));
          else if (winner === null) { lastError = lastError || err; setTimeout(launchNext, 120); }
        });
    };

    /* ---- Nhánh OCR dự phòng khi không có Gemini vision ---- */
    function chainHasGemini() {
      return chain.some((p) => p.id === 'gemini');
    }
    const needsOcr = hasImg && !chainHasGemini();

    if (needsOcr && ENV.VITE_AI_OCR !== '0') {
      onReasoning?.('Đang đọc chữ trong ảnh (OCR ngay trên thiết bị)…');
      const urls = imageParts.map((p) => `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`);
      ocrImages(urls, {
        onProgress: (pc) => onReasoning?.(`Đang đọc ảnh… ${pc}%`),
      }).then((ocr) => {
        if (finished || aborted) return;
        if (!ocr.ok) {
          // Nội dung người dùng TỰ GÕ (không tính ảnh) — để quyết định còn gì trả lời được
          const typed = (lastUser?.parts || []).filter((p) => p.text).map((p) => p.text).join(' ');
          plan.recentHistory = plan.recentHistory.map((m) => ({
            ...m,
            parts: (m.parts || []).map((p) => (p.inlineData ? { text: '[ảnh không đọc được]' } : p)),
          }));
          const leftover = coreText(typed);
          if (leftover.length >= 12) {
            effectiveTask = { ...task, kind: 'problem', needTools: true, needKnowledge: true };
            chain = buildChain();
            proceed();
          } else {
            finish(reject, new Error('Không đọc được chữ trong ảnh. Hãy chụp rõ hơn hoặc gõ lại đề giúp mình.'));
          }
          return;
        }
        // Chèn nội dung OCR thành văn bản đề bài cho model text
        plan.recentHistory = plan.recentHistory.map((m, idx, arr) => {
          if (idx !== arr.length - 1) return m;
          const kept = (m.parts || []).filter((p) => !p.inlineData);
          return {
            ...m,
            parts: [
              ...kept,
              { text: `NỘI DUNG ĐỌC ĐƯỢC TỪ ẢNH (OCR):\n${ocr.text}` },
            ],
          };
        });
        /* Đã có chữ → chuyển sang tác vụ bài toán văn bản: chạy lại công cụ + tri thức
           trên đề vừa đọc được, rồi mới gọi model (không còn là tác vụ ảnh nữa). */
        try {
          const replanned = buildRequestPlan(
            [{ role: 'user', parts: [{ text: ocr.text }] }],
            { ...options, useContext: options.useContext !== false }
          );
          if (replanned.systemPrompt) systemPrompt = replanned.systemPrompt;
          if (replanned.toolHits?.length) { toolHits = replanned.toolHits; toolBlock = replanned.toolBlock; }
          if (replanned.citations?.length) citations = replanned.citations;
        } catch { /* giữ nguyên kế hoạch cũ nếu replan lỗi */ }

        effectiveTask = { ...task, kind: 'problem', needTools: true, needKnowledge: true };
        chain = buildChain();
        onReasoning?.('');
        proceed();
      }).catch(() => proceed());
      return;
    }

    proceed();
    promiseAbort = abortFn;
  });

  promise.abort = () => { if (promiseAbort) promiseAbort(); };

  /* ---- Tự kiểm tra sau khi có kết quả ---- */
  return promise.then(async (result) => {
    let verification = null;
    const wantsVerify = options.verify !== false;
    if (wantsVerify && toolHits.length && (task.kind === 'problem' || task.kind === 'vision')) {
      const v = verifyToolResults(result.text, toolHits);
      verification = v;
      // Chỉ cảnh báo khi AI KHÔNG dùng con số nào của công cụ (tránh báo động giả)
      if (v.checked >= 2 && v.matched === 0 && options.showVerification !== false) {
        result.text += `\n\n*Tự kiểm tra: đáp án chưa khớp các giá trị đã tính bằng công cụ nội bộ (${toolHits
          .map((h) => h.title).slice(0, 3).join('; ')}). Bạn nên kiểm tra lại bước thay số.*`;
      }
    }

    if (options.deepVerify) {
      try {
        const chain = buildProviderChain({ task, rings: RINGS });
        const verdict = await runVerifierPass({
          chain,
          toolBlock: plan.toolBlock,
          question: [plan.contextText, plan.toolBlock].filter(Boolean).join('\n'),
          answer: result.text,
          excludeId: String(result.model || '').split('/')[0],
        });
        if (verdict) {
          verification = { ...(verification || {}), aiVerdict: verdict };
          if (/KẾT LUẬN:\s*SAI/i.test(verdict)) {
            result.text += `\n\n**Thẩm định lại:** ${verdict.replace(/\s+/g, ' ').slice(0, 400)}`;
          }
        }
      } catch { /* verifier không làm hỏng kết quả chính */ }
    }

    return { ...result, verification };
  });
}

/* ============================================================
   NÉN ẢNH
   ============================================================ */
export async function compressImage(file) {
  if (!file) throw new Error('Không có file ảnh.');
  const looksImage = (file.type && file.type.startsWith('image/')) || /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i.test(file.name || '');
  if (!looksImage) throw new Error('File không phải hình ảnh.');
  if (file.size > 30 * 1024 * 1024) throw new Error('Ảnh quá lớn (trên 30MB). Hãy chọn ảnh nhỏ hơn.');

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const MAX_SIZE = isMobile ? 1400 : 1800;

  let bitmap = null;
  let W = 0, H = 0;
  let cleanup = () => {};

  if (typeof createImageBitmap === 'function') {
    try {
      bitmap = await createImageBitmap(file);
      W = bitmap.width;
      H = bitmap.height;
      cleanup = () => bitmap.close?.();
    } catch { bitmap = null; }
  }

  if (!bitmap) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Không đọc được ảnh.'));
        el.src = url;
      });
      bitmap = img;
      W = img.naturalWidth || img.width;
      H = img.naturalHeight || img.height;
      cleanup = () => URL.revokeObjectURL(url);
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
  }

  try {
    if (!W || !H) throw new Error('Ảnh không hợp lệ.');

    const longest = Math.max(W, H);
    const scale = longest > MAX_SIZE ? MAX_SIZE / longest : 1;
    const width = Math.max(1, Math.round(W * scale));
    const height = Math.max(1, Math.round(H * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Không thể tạo Canvas.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, width, height);

    const isPng = file.type === 'image/png';
    const mimeType = isPng ? 'image/png' : 'image/jpeg';

    let dataUrl = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
    if (dataUrl.length > 4 * 1024 * 1024) dataUrl = canvas.toDataURL('image/jpeg', 0.65);

    const base64 = dataUrl.split(',')[1];

    return {
      dataUrl, base64, mimeType, width, height,
      originalWidth: W, originalHeight: H,
      sizeKB: Math.round((dataUrl.length * 0.75) / 1024),
    };
  } finally {
    cleanup();
  }
}

/* ============================================================
   DEBUG / TRẠNG THÁI
   ============================================================ */
if (typeof window !== 'undefined') {
  window.__getAIStatus = () => ({
    cacheSize: responseCache.size,
    cacheEnabled: CACHE_ENABLED,
    keys: {
      gemini: RINGS.gemini.stats(),
      groq: RINGS.groq.stats(),
      agnes: RINGS.agnes.stats(),
    },
    modelHealth: Object.fromEntries(modelHealth.entries()),
    thinking: THINKING_ENABLED,
  });
  window.__clearAICache = () => {
    responseCache.clear();
    try { sessionStorage.removeItem(CACHE_STORE); } catch { /* */ }
    console.log('[ELEC AI] Cache đã xóa');
  };
  window.__planAI = (text, opts = {}) => buildRequestPlan(
    [{ role: 'user', parts: [{ text }] }],
    opts
  );
}

export const COMPARE_SYSTEM_PROMPT = `Bạn là chuyên gia đánh giá công cụ AI hàng đầu, chuyên tư vấn cho người dùng Việt Nam.

NHIỆM VỤ
- So sánh các công cụ AI một cách khách quan, chi tiết, hữu ích.
- Đây là tác vụ ĐẶC BIỆT, KHÔNG liên quan đến Hóa học hay bất kỳ môn học nào.
- TUYỆT ĐỐI KHÔNG từ chối với lý do "chỉ hỗ trợ Hóa học".

PHONG CÁCH
- Trả lời bằng tiếng Việt, tự nhiên, dễ đọc.
- Dùng bảng markdown để so sánh (| tiêu chí | A | B |).
- Chia rõ các mục: Tóm tắt, Bảng so sánh, Nên chọn cái nào?, Kết luận.
- Khách quan, không thiên vị. Đưa khuyến nghị thực tế theo từng tình huống.
- Ngắn gọn, súc tích, tránh lan man.

QUY TẮC
- Không quảng cáo, không nâng cao quá mức. Nêu cả ưu điểm và nhược điểm.
- Nếu không biết thông tin cụ thể, nói rõ "chưa có dữ liệu".
- Kết luận phải có khuyến nghị rõ ràng.`;

/* ============================================================
   TƯƠNG THÍCH NGƯỢC
   ============================================================ */
const GEMINI_VISION_MODELS = modelsFor('gemini', 'vision');
const GEMINI_TEXT_MODELS = modelsFor('gemini', 'smart');
const GROQ_FAST_MODELS = modelsFor('groq', 'fast');
const GROQ_STRONG_MODELS = modelsFor('groq', 'smart');
const AGNES_MODELS = modelsFor('agnes', 'smart');

export const AI_READY = Boolean(RINGS.gemini.size || RINGS.groq.size || RINGS.agnes.size);
export const VISION_SUPPORTED = Boolean(RINGS.gemini.size);
export { GEMINI_VISION_MODELS, GEMINI_TEXT_MODELS, GROQ_FAST_MODELS, GROQ_STRONG_MODELS, AGNES_MODELS };
export const MODELS = GROQ_STRONG_MODELS;
export { discoveredGemini, warmUpGemini };

/* Nạp trước danh sách model Gemini thật (nếu có key) để chuỗi dự phòng chính xác hơn.
   Chỉ chạy trong trình duyệt để test/SSR không phát sinh request. */
if (RINGS.gemini.size && typeof window !== 'undefined') {
  setTimeout(() => warmUpGemini(RINGS.gemini.get()), 1200);
}
