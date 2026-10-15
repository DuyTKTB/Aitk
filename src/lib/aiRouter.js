/* ============================================================
   aiRouter.js — ĐỊNH TUYẾN TÁC VỤ & CHỌN MODEL CHO ELEC AI
   ------------------------------------------------------------
   Nhiệm vụ:
     1. Phân loại câu hỏi (chat / lý thuyết / bài toán / tạo đề / so sánh / ảnh)
        và ước lượng độ KHÓ → chọn cách trả lời + độ sâu suy luận phù hợp.
     2. Chọn model theo tầng (fast / smart / vision) cho từng provider,
        có thể ghi đè bằng biến môi trường.
     3. Quản lý NHIỀU API KEY (key ring): tự xoay khi key bị 429/hết quota,
        cooldown key hỏng → tăng đáng kể hạn mức miễn phí.
     4. Tự dò danh sách model Gemini thật từ Google (tránh hard-code tên model sai → 404).
   Thuần JS, test được bằng vitest (phần classify/plan).
   ============================================================ */

/* ============ 1. PHÂN LOẠI TÁC VỤ ============ */
const CHEM_CUES = /hóa|hoá|mol|nồng độ|\bph\b|dung dịch|chất|phương trình|phản ứng|oxi|axit|bazơ|este|muối|kim loại|nguyên tố|electron|liên kết|cân bằng|điện phân|hữu cơ|hidro|cacbon|%|gam|ml|lít/i;
const HARD_CUES = /hỗn hợp|hiệu suất|dư|đồng thời|biết rằng|so sánh|điện phân|este|peptit|polymer|chuỗi|sơ đồ|đồ thị|xác định công thức|bảo toàn|tăng giảm|quy đổi|nhiều giai đoạn/i;

const countNumbers = (s) => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).length;

/** Rút nội dung text của message cuối (hỗ trợ cả parts lẫn text). */
export function lastUserText(history) {
  const last = [...(history || [])].reverse().find((m) => m.role === 'user');
  if (!last) return '';
  if (Array.isArray(last.parts)) {
    return last.parts.filter((p) => p && p.text).map((p) => p.text).join(' ');
  }
  return String(last.text || last.content || '');
}

export function hasImage(history) {
  const last = [...(history || [])].reverse().find((m) => m.role === 'user');
  return Boolean(last?.parts?.some((p) => p && p.inlineData));
}

/**
 * coreText(text) — bỏ phần "đuôi boilerplate" mà app tự nối vào mỗi câu hỏi
 * ("Trình độ: Lớp 11. KHÔNG dùng LaTeX.") và các câu yêu cầu chung kiểu
 * "Phân tích ảnh này.". Nhờ đó việc phân loại + truy xuất tri thức không bị nhiễu
 * (trước đây "độ" trong "Trình độ" từng khớp nhầm công thức "Độ rượu").
 */
export function coreText(text) {
  let s = String(text || '');
  s = s.replace(/Trình độ:[^.\n]*\.?/gi, ' ');
  s = s.replace(/KHÔNG dùng LaTeX\.?/gi, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/^(phân tích|đọc|giải|giúp mình|xem|xử lý)\s+(các\s+)?(ảnh|hình|file|đề)(\s+(này|trên|dưới|sau))?\.?$/gi, '');
  s = s.replace(/^(ảnh|hình)(\s+(này|trên|dưới))?\.?$/gi, '');
  // Bỏ các nhãn thay thế ảnh do app/động cơ chèn vào
  s = s.replace(/\[ảnh[^\]]*\]/gi, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/** Nội dung có thật sự đủ để truy xuất tri thức / chạy công cụ hay không. */
export const isSubstantive = (text) => coreText(text).length >= 12;

/**
 * reasoningParamFor(model, effort) — tham số độ sâu suy luận theo model.
 * Groq/gpt-oss và các model họ Qwen/DeepSeek nhận `reasoning_effort`;
 * provider khác (vd Agnes) không hỗ trợ nên trả null.
 */
export function reasoningParamFor(model, effort) {
  if (!effort) return null;
  if (/gpt-oss|qwen|deepseek|glm|reasoning/i.test(String(model || ''))) {
    return { reasoning_effort: effort };
  }
  return null;
}

/**
 * classifyTask(history) → {
 *   kind, hard, hardScore, temperature, maxTokens, reasoningEffort,
 *   thinkingBudget, needTools, needKnowledge, label
 * }
 */
export function classifyTask(history) {
  const rawText = lastUserText(history);
  const text = coreText(rawText) || rawText;
  const v = text.toLowerCase();
  const image = hasImage(history);

  if (image) {
    return {
      kind: 'vision',
      hard: true,
      hardScore: 3,
      temperature: 0.1,
      maxTokens: 8192,
      reasoningEffort: 'high',
      thinkingBudget: 8192,
      needTools: true,
      needKnowledge: true,
      label: 'Đọc ảnh đề bài',
    };
  }

  const nums = countNumbers(text);
  const multiQuestion = /(câu\s*\d|^|\s)(\d\s*[).]|[a-d]\s*[).])/i.test(text) || (text.match(/\?/g) || []).length >= 2;
  const long = text.length > 220;

  let hardScore = 0;
  if (HARD_CUES.test(v)) hardScore += 1;
  if (nums >= 3) hardScore += 1;
  if (nums >= 6) hardScore += 1;
  if (multiQuestion) hardScore += 1;
  if (long) hardScore += 1;
  if (/lớp 12|đại học|chuyên đề|vận dụng cao|học sinh giỏi/i.test(v)) hardScore += 1;

  const isQuizGen = /tạo\s*(đề|câu hỏi|bài tập|quiz|trắc nghiệm)|sinh\s*(đề|câu hỏi|bài tập)|ra đề|ma trận đề/i.test(v);
  const isCompare = /so sánh|nên dùng|chọn cái nào/i.test(v) && /ai|app|tool|công cụ|model|chatgpt|gemini/i.test(v);
  // "giải thích / tại sao" là LÝ THUYẾT, không phải bài toán — tách khỏi MATH_CUES ("giải")
  const isTheory = /giải thích|lý thuyết|lí thuyết|bản chất|tại sao|vì sao|cơ chế|phân biệt|nhận biết|trình bày|khái niệm|định nghĩa/i.test(v);
  const wantsSolve = /tính|tìm|xác định|chứng minh|giải bài|giải giúp|bao nhiêu|hãy giải|làm bài/i.test(v);
  const isChemistry = CHEM_CUES.test(v);
  const isProblem = image
    ? true
    : (wantsSolve && !isTheory && (isChemistry || nums >= 2)) || (isChemistry && nums >= 3);

  let kind = 'chat';
  if (isCompare) kind = 'compare';
  else if (isQuizGen) kind = 'generate';
  else if (isProblem) kind = 'problem';
  else if (isTheory) kind = 'theory';

  const hard = kind === 'problem' && hardScore >= 2;

  const temperature = kind === 'problem' ? 0.1 : kind === 'compare' ? 0.5 : kind === 'generate' ? 0.4 : kind === 'theory' ? 0.2 : 0.3;
  const maxTokens = kind === 'problem' ? 8192
    : kind === 'generate' ? 8192
      : kind === 'theory' ? 4096
        : kind === 'compare' ? 3072 : 2048;

  const reasoningEffort = hard ? 'high' : kind === 'problem' ? 'medium' : 'low';
  const thinkingBudget = hard ? 8192 : kind === 'problem' ? 3072 : kind === 'theory' ? 1024 : 0;

  const needTools = (kind === 'problem' || kind === 'theory' || image) && (isChemistry || nums >= 1);
  /* Chat thường và so sánh công cụ không cần dữ liệu Hóa học của app */
  const needKnowledge = kind !== 'chat' && kind !== 'compare';

  return {
    kind,
    hard,
    hardScore,
    temperature,
    maxTokens,
    reasoningEffort,
    thinkingBudget,
    needTools,
    needKnowledge,
    label: hard ? 'Bài toán khó (suy luận sâu)' : kind,
  };
}

/* ============ 2. KHO MODEL + GHI ĐÈ BẰNG ENV ============ */
const envList = (v) => String(v || '').split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);

const DEFAULTS = {
  gemini: {
    // Giữ tên model đang chạy của dự án ở đầu chuỗi, thêm phương án dự phòng phổ biến.
    fast: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    smart: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    vision: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
  },
  groq: {
    fast: ['openai/gpt-oss-20b'],
    smart: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
    vision: [],
  },
  agnes: {
    fast: ['agnes-3.0-flash', 'agnes-2.5-flash'],
    smart: ['agnes-3.0-flash', 'agnes-2.5-pro-beta'],
    vision: [],
  },
};

const ENV = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

/** Danh sách model cho provider/tầng, có thể ghi đè bằng VITE_AI_MODEL_FAST|SMART|VISION. */
export function modelsFor(provider, tier = 'smart') {
  const override = envList(ENV[
    tier === 'vision' ? 'VITE_AI_MODEL_VISION' : tier === 'fast' ? 'VITE_AI_MODEL_FAST' : 'VITE_AI_MODEL_SMART'
  ]);
  const base = DEFAULTS[provider]?.[tier] || [];
  const list = override.length ? override : base;
  // Với tier smart, cho phép ghép thêm model fast làm phương án dự phòng
  if (tier === 'smart' && override.length === 0) {
    return [...list, ...(DEFAULTS[provider]?.fast || []).filter((m) => !list.includes(m))];
  }
  return list;
}

/** Tầng model phù hợp với tác vụ (hard → smart). */
export function tierFor(task) {
  if (!task) return 'smart';
  if (task.kind === 'vision') return 'vision';
  if (task.kind === 'chat') return 'fast';
  return 'smart';
}

/* ============ 3. DÒ MODEL GEMINI THẬT (tránh 404 do tên model sai) ============ */
const DISCO_CACHE_KEY = 'cs-ai-gemini-models-v1';
const DISCO_TTL_MS = 12 * 60 * 60 * 1000;
const discovered = { gemini: null, at: 0 };

const readDiscoCache = () => {
  try {
    const raw = sessionStorage.getItem(DISCO_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.models?.length || Date.now() - (data.at || 0) > DISCO_TTL_MS) return null;
    return data;
  } catch { return null; }
};

function rankGemini(names) {
  const score = (n) => {
    let s = 0;
    if (/pro/.test(n)) s += 30;
    if (/flash/.test(n)) s += 20;
    if (/lite/.test(n)) s += 5;
    if (/thinking|exp/.test(n)) s += 8;
    if (/embedding|aqa|tts|image|veo|imagen|learnlm/.test(n)) s -= 100;
    const ver = /(\d+)\.(\d+)/.exec(n);
    if (ver) s += (Number(ver[1]) * 10 + Number(ver[2]));
    return s;
  };
  return [...names].sort((a, b) => score(b) - score(a));
}

/**
 * discoverGeminiModels(key) — gọi models.list, lọc model dùng được cho generateContent.
 * Trả về { vision: [...], text: [...] } hoặc null nếu lỗi.
 */
export async function discoverGeminiModels(key, { timeoutMs = 6000 } = {}) {
  if (!key || ENV.VITE_AI_DISCOVER_MODELS === '0') return null;
  const cached = readDiscoCache();
  if (cached) return cached.models;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const usable = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter(Boolean);
    if (!usable.length) return null;

    const ranked = rankGemini(usable);
    const models = {
      text: ranked.filter((n) => !/embedding|aqa|tts|imagen|veo/i.test(n)).slice(0, 6),
      vision: ranked.filter((n) => /flash|pro/i.test(n) && !/embedding|aqa|tts|imagen|veo/i.test(n)).slice(0, 4),
    };
    try { sessionStorage.setItem(DISCO_CACHE_KEY, JSON.stringify({ at: Date.now(), models })); } catch { /* */ }
    return models;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Trả về danh sách model đã dò được (nếu đã dò) — dùng để nối thêm vào chuỗi dự phòng. */
export function discoveredGemini(which = 'text') {
  return readDiscoCache()?.models?.[which] || [];
}

/** Kích hoạt dò model trong nền (không chặn luồng chat). */
export function warmUpGemini(key) {
  if (discovered.at && Date.now() - discovered.at < DISCO_TTL_MS) return;
  discovered.at = Date.now();
  discoverGeminiModels(key).catch(() => {});
}

/* ============ 4. KEY RING — XOAY NHIỀU API KEY ============ */
/**
 * parseKeys('k1,k2;k3\naa') → ['k1','k2','k3','aa']
 */
export function parseKeys(raw) {
  return String(raw || '').split(/[\s,;|]+/).map((s) => s.trim()).filter((s) => s.length > 8);
}

/**
 * createKeyRing('k1,k2') → ring
 * ring.get()             → key đang dùng được (bỏ qua key đang cooldown)
 * ring.reportBad(key)    → đưa key vào cooldown, xoay sang key khác
 * ring.reportGood(key)   → xóa cooldown
 */
export function createKeyRing(raw, { cooldownMs = 10 * 60 * 1000 } = {}) {
  const keys = parseKeys(raw);
  const bad = new Map();          // key → { until, fails }
  let cursor = 0;

  const usable = () => keys.filter((k) => {
    const b = bad.get(k);
    return !b || Date.now() > b.until;
  });

  return {
    size: keys.length,
    all: () => [...keys],
    get() {
      const list = usable();
      if (!list.length) return null;              // tất cả đang cooldown
      const key = list[cursor % list.length];
      cursor = (cursor + 1) % Math.max(1, list.length);
      return key;
    },
    reportBad(key, ms = cooldownMs) {
      if (!key) return;
      const prev = bad.get(key);
      bad.set(key, { until: Date.now() + ms, fails: (prev?.fails || 0) + 1 });
    },
    reportGood(key) { if (key) bad.delete(key); },
    hasUsable() { return usable().length > 0; },
    badCount: () => [...bad.values()].filter((b) => Date.now() <= b.until).length,
    stats: () => ({ total: keys.length, cooling: [...bad.entries()].map(([k, v]) => ({ key: k.slice(-4), until: v.until, fails: v.fails })) }),
  };
}

/** Chuỗi provider ưu tiên theo tác vụ + tầng model (đã lọc key rỗng). */
export function buildProviderChain({ task, rings, keys }) {
  const tier = tierFor(task);
  const vision = task?.kind === 'vision';
  const chain = [];

  const push = (id, models) => {
    const ring = rings[id];
    const available = Boolean(ring && ring.size > 0 && ring.hasUsable());
    const list = (models || []).filter(Boolean);
    if (!available || !list.length) return;
    chain.push({ id, models: list, type: vision ? 'vision' : 'text' });
  };

  // Ảnh: Gemini có vision. Nếu không có Gemini → OCR fallback do tầng gọi xử lý.
  if (vision) {
    push('gemini', [...modelsFor('gemini', 'vision'), ...discoveredGemini('vision')]);
    return chain;
  }

  // Chat thường: ưu tiên model nhanh để giảm độ trễ.
  if (task?.kind === 'chat') {
    push('groq', modelsFor('groq', 'fast'));
    push('gemini', [...modelsFor('gemini', 'fast'), ...discoveredGemini('text')]);
    push('agnes', modelsFor('agnes', 'fast'));
    return chain;
  }

  // Bài toán/lý thuyết/tạo đề: ưu tiên model mạnh.
  push('agnes', modelsFor('agnes', tier === 'fast' ? 'fast' : 'smart'));
  push('gemini', [...modelsFor('gemini', 'smart'), ...discoveredGemini('text')]);
  push('groq', modelsFor('groq', 'smart'));
  return chain;
}

export const ROUTER_DEFAULTS = DEFAULTS;
