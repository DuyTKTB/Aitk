/* ============================================================
   tts.js — Đọc văn bản Tiếng Việt (Native Web Speech + Gemini Cloud TTS)
   ------------------------------------------------------------
   Đảm bảo MỌI trình duyệt / thiết bị đều đọc 100% giọng Tiếng Việt:
     1. Tự động chờ & cập nhật sự kiện `voiceschanged` (tránh kẹt danh sách en-US).
     2. Ưu tiên giọng Tiếng Việt tự nhiên (HoaiMy / NamMinh / Google Tiếng Việt / Linh / An).
     3. Làm sạch Markdown, LaTeX Toán-Lí-Hóa và công thức hóa học thành tiếng Việt tự nhiên.
     4. Cắt câu <= 220 ký tự để tránh lỗi Chrome ngừng đọc giữa chừng.
     5. Nếu thiết bị KHÔNG có giọng Tiếng Việt (hoặc giọng Web Speech lỗi) ->
        tự động chuyển sang giọng AI Tiếng Việt trên đám mây (Gemini TTS, WAV 24kHz),
        TUYỆT ĐỐI KHÔNG đọc tiếng Việt bằng giọng tiếng Anh.
   ============================================================ */
import { collectEnvKeys, createKeyRing } from './aiRouter.js';

const ENV = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const CLOUD_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const CLOUD_TTS_VOICE = 'Aoede';
const MAX_CACHE_ITEMS = 20;

const VI_VOICE_SCORES = [
  { re: /hoaimy|hoài\s*my/i, score: 120 },
  { re: /namminh|nam\s*minh/i, score: 110 },
  { re: /online.*natural|natural.*vietnamese/i, score: 105 },
  { re: /google\s*tiếng\s*việt|google\s*vietnamese/i, score: 95 },
  { re: /\blinh\b/i, score: 85 },
  { re: /microsoft\s*an\b/i, score: 75 },
  { re: /tiếng\s*việt|tieng\s*viet|vietnamese/i, score: 60 },
];

const SUBSCRIPT_MAP = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

const SUPERSCRIPT_DIGIT_MAP = {
  '⁰': '0', '¹': '1', '⁴': '4', '⁵': '5',
  '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
};

const boundSynths = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
let initialProbeDone = false;
let voiceCache = [];

let playbackToken = 0;
let currentUtterance = null;
let currentAudio = null;
let currentAudioUrl = '';
let activeAbortController = null;
let cloudKeyRing = null;
const cloudAudioCache = new Map();

function getCloudKeyRing() {
  if (!cloudKeyRing) {
    cloudKeyRing = createKeyRing(collectEnvKeys(ENV, 'gemini'));
  }
  return cloudKeyRing;
}

const normLang = (v) => String(v?.lang || '').trim().toLowerCase().replace(/_/g, '-');

export function isVietnameseVoice(v) {
  if (!v) return false;
  const lang = normLang(v);
  const name = String(v.name || '').toLowerCase();
  if (lang === 'vi' || lang.startsWith('vi-')) return true;
  return /tiếng\s*việt|tieng\s*viet|vietnamese|hoaimy|hoài\s*my|namminh|nam\s*minh/.test(name);
}

function scoreVietnameseVoice(v) {
  if (!isVietnameseVoice(v)) return -1;
  const name = String(v.name || '');
  const lang = normLang(v);
  let score = lang === 'vi-vn' ? 20 : 10;
  for (const rule of VI_VOICE_SCORES) {
    if (rule.re.test(name)) {
      score = Math.max(score, rule.score + (lang === 'vi-vn' ? 10 : 0));
    }
  }
  if (/online|natural|neural/i.test(name)) score += 15;
  return score;
}

const getSynth = () => {
  if (typeof window === 'undefined') return null;
  if (!('speechSynthesis' in window)) return null;
  const s = window.speechSynthesis;
  if (!s) return null;
  if (boundSynths && !boundSynths.has(s)) {
    boundSynths.add(s);
    const onVoicesChanged = () => {
      try {
        const latest = s.getVoices() || [];
        if (latest.length > 0) {
          voiceCache = latest;
          if (pickVietnameseVoice(latest)) initialProbeDone = true;
        }
      } catch { /* ignore */ }
    };
    if (typeof s.addEventListener === 'function') {
      s.addEventListener('voiceschanged', onVoicesChanged);
    } else if ('onvoiceschanged' in s) {
      s.onvoiceschanged = onVoicesChanged;
    }
  }
  return s;
};

/* Refresh live voice list from browser */
const refreshVoices = () => {
  const s = getSynth();
  if (!s) return [];
  try {
    const voices = s.getVoices() || [];
    if (voices.length > 0) {
      voiceCache = voices;
    }
    return voices;
  } catch {
    return voiceCache;
  }
};

/* Lấy danh sách voices (luôn refresh nếu chưa tìm thấy giọng Tiếng Việt) */
export function getVoices(timeoutMs = 700) {
  const live = refreshVoices();
  if (pickVietnameseVoice(live)) {
    initialProbeDone = true;
    return Promise.resolve(live);
  }
  const s = getSynth();
  if (!s) return Promise.resolve([]);
  if (initialProbeDone && live.length > 0) return Promise.resolve(live);

  return new Promise((resolve) => {
    let settled = false;
    let timer = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      initialProbeDone = true;
      if (timer) clearTimeout(timer);
      if (typeof s.removeEventListener === 'function') {
        s.removeEventListener('voiceschanged', onChange);
      }
      resolve(refreshVoices());
    };

    const onChange = () => {
      const updated = refreshVoices();
      if (pickVietnameseVoice(updated)) finish();
    };

    if (typeof s.addEventListener === 'function') {
      s.addEventListener('voiceschanged', onChange);
    } else {
      s.onvoiceschanged = onChange;
    }
    timer = setTimeout(finish, Math.max(50, timeoutMs));
  });
}

/* Tìm tất cả giọng Tiếng Việt có sẵn, sắp xếp theo độ tự nhiên */
export function getVietnameseVoices(voices) {
  const list = Array.isArray(voices) ? voices : refreshVoices();
  return [...list]
    .filter(isVietnameseVoice)
    .sort((a, b) => scoreVietnameseVoice(b) - scoreVietnameseVoice(a));
}

/* Tìm giọng Tiếng Việt tốt nhất — trả null nếu trình duyệt không có giọng Việt */
export function pickVietnameseVoice(voices) {
  const list = Array.isArray(voices) ? voices : refreshVoices();
  if (!list || list.length === 0) return null;
  const sorted = getVietnameseVoices(list);
  return sorted[0] || null;
}

export function hasBrowserVietnameseVoice() {
  return Boolean(pickVietnameseVoice(refreshVoices()));
}

/* Chuẩn bị text cho TTS Tiếng Việt — bỏ markdown, chuyển LaTeX & ký hiệu hóa/toán sang tiếng Việt */
export function cleanForSpeech(text) {
  if (!text) return '';
  let s = String(text);

  // Code & Markdown
  s = s
    .replace(/```[\s\S]*?```/g, ' (có đoạn mã) ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/g, '$1$2')
    .replace(/__(.+?)__/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '');

  // LaTeX delimiters & wrappers
  s = s
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]+)\$/g, ' $1 ')
    .replace(/\\\[([\s\S]*?)\\\]/g, ' $1 ')
    .replace(/\\\(([\s\S]*?)\\\)/g, ' $1 ')
    .replace(/\\(?:text|mathrm|mathbf|textbf|mathit|operatorname|ce)\{([^{}]+)\}/g, '$1');

  // Phân số (lặp 2 lượt cho trường hợp lồng đơn giản)
  for (let i = 0; i < 2; i++) {
    s = s.replace(/\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g, ' $1 phần $2 ');
  }

  // Căn thức & Hình học & LaTeX phổ biến
  s = s
    .replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, ' căn bậc $1 của $2 ')
    .replace(/\\sqrt\{([^{}]+)\}/g, ' căn bậc hai của $1 ')
    .replace(/\\widehat\{([^{}]+)\}/g, ' góc $1 ')
    .replace(/\\overline\{([^{}]+)\}/g, ' đoạn $1 ')
    .replace(/\\(?:vec|overrightarrow)\{([^{}]+)\}/g, ' véc-tơ $1 ')
    .replace(/\\xrightarrow(?:\[[^\]]*\])?\{([^{}]+)\}/g, ' tạo thành với điều kiện $1 ')
    .replace(/\\(?:perp)\b/g, ' vuông góc với ')
    .replace(/\\(?:parallel)\b/g, ' song song với ')
    .replace(/\\(?:triangle)\b/g, ' tam giác ')
    .replace(/\\(?:angle)\b/g, ' góc ')
    .replace(/\\(?:Delta)\s*([A-Z]{2,4})\b/g, ' tam giác $1 ')
    .replace(/\\(?:Delta)\s*([a-zA-Z])\b/g, ' đen-ta $1 ')
    .replace(/\\(?:Delta)\b/g, ' đen-ta ')
    .replace(/\\(?:Rightarrow|implies)\b/g, ' suy ra ')
    .replace(/\\(?:Leftrightarrow|iff)\b/g, ' tương đương ')
    .replace(/\\(?:rightarrow|longrightarrow|to)\b/g, ' tạo thành ')
    .replace(/\\(?:rightleftharpoons)\b/g, ' thuận nghịch ')
    .replace(/\\(?:uparrow)\b/g, ' bay lên ')
    .replace(/\\(?:downarrow)\b/g, ' kết tủa ')
    .replace(/\\(?:approx)\b/g, ' xấp xỉ ')
    .replace(/\\(?:neq|ne)\b/g, ' khác ')
    .replace(/\\(?:leq|le)\b/g, ' nhỏ hơn hoặc bằng ')
    .replace(/\\(?:geq|ge)\b/g, ' lớn hơn hoặc bằng ')
    .replace(/\\(?:pm)\b/g, ' cộng trừ ')
    .replace(/\\(?:times|cdot)\b/g, ' nhân ')
    .replace(/\\(?:div)\b/g, ' chia ')
    .replace(/\\(?:infty)\b/g, ' vô cùng ')
    .replace(/\\(?:pi)\b/g, ' pi ')
    .replace(/\\(?:alpha)\b/g, ' an-pha ')
    .replace(/\\(?:beta)\b/g, ' bê-ta ')
    .replace(/\\(?:gamma)\b/g, ' gam-ma ')
    .replace(/\\(?:Omega)\b/g, ' ôm ')
    .replace(/\\(?:mu)\b/g, ' mi-crô ')
    .replace(/\\(?:lambda)\b/g, ' lam-đa ')
    .replace(/\\(?:in)\b/g, ' thuộc ')
    .replace(/\\(?:notin)\b/g, ' không thuộc ')
    .replace(/\\(?:subset(?:eq)?)\b/g, ' là tập con của ')
    .replace(/\\(?:cup)\b/g, ' hợp ')
    .replace(/\\(?:cap)\b/g, ' giao ');

  // Độ, số mũ, chỉ số dưới
  s = s
    .replace(/\^\{\\circ\}\s*C/g, ' độ C ')
    .replace(/\^\{\\circ\}/g, ' độ ')
    .replace(/°\s*C/g, ' độ C ')
    .replace(/°/g, ' độ ')
    .replace(/²|\^\{2\}|\^2(?![0-9])/g, ' bình phương ')
    .replace(/³|\^\{3\}|\^3(?![0-9])/g, ' lập phương ')
    .replace(/\^\{([^{}]+)\}/g, ' mũ $1 ')
    .replace(/\^([a-zA-Z0-9]+)/g, ' mũ $1 ')
    .replace(/_\{([^{}]+)\}/g, '$1')
    .replace(/_([a-zA-Z0-9])/g, '$1')
    .replace(/[₀-₉]/g, (ch) => SUBSCRIPT_MAP[ch] || ch)
    .replace(/[⁰¹⁴-⁹]/g, (ch) => SUPERSCRIPT_DIGIT_MAP[ch] || ch);

  // Ký hiệu Unicode còn lại
  s = s
    .replace(/Δ\s*([A-Z]{2,4})\b/g, ' tam giác $1 ')
    .replace(/Δ\s*([a-zA-Z])\b/g, ' đen-ta $1 ')
    .replace(/⇒/g, ' suy ra ')
    .replace(/⇔/g, ' tương đương ')
    .replace(/→/g, ' tạo thành ')
    .replace(/⇌/g, ' thuận nghịch ')
    .replace(/↑/g, ' bay lên ')
    .replace(/↓/g, ' kết tủa ')
    .replace(/Δ/g, ' đun nóng ')
    .replace(/≈/g, ' xấp xỉ ')
    .replace(/≠/g, ' khác ')
    .replace(/≤/g, ' nhỏ hơn hoặc bằng ')
    .replace(/≥/g, ' lớn hơn hoặc bằng ')
    .replace(/±/g, ' cộng trừ ')
    .replace(/×/g, ' nhân ')
    .replace(/·/g, ' nhân ')
    .replace(/÷/g, ' chia ')
    .replace(/(\d)\s*%/g, '$1 phần trăm');

  // Bỏ lệnh LaTeX chưa khớp, ngoặc nhọn, tag HTML và emoji
  s = s
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

/* Cắt câu tự nhiên <= maxLen ký tự để Chrome Web Speech & Cloud TTS không bị ngắt giữa chừng */
export function splitSpeechChunks(text, maxLen = 220) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const chunks = [];
  const sentences = clean.split(/(?<=[.!?\n;])\s+/);
  let buf = '';

  const flushBuf = () => {
    if (buf.trim()) {
      chunks.push(buf.trim());
      buf = '';
    }
  };

  for (const sent of sentences) {
    if (!sent) continue;
    if ((buf + ' ' + sent).trim().length <= maxLen) {
      buf = buf ? `${buf} ${sent}` : sent;
      continue;
    }
    flushBuf();
    if (sent.length <= maxLen) {
      buf = sent;
      continue;
    }
    // Câu quá dài -> cắt tiếp theo dấu phẩy / khoảng trắng
    const words = sent.split(/\s+/);
    let sub = '';
    for (const w of words) {
      if ((sub + ' ' + w).trim().length <= maxLen) {
        sub = sub ? `${sub} ${w}` : w;
      } else {
        if (sub) chunks.push(sub.trim());
        sub = w.length > maxLen ? w.slice(0, maxLen) : w;
      }
    }
    if (sub) buf = sub;
  }
  flushBuf();
  return chunks;
}

function decodeBase64ToBytes(base64) {
  const norm = String(base64 || '').replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(norm, 'base64'));
  }
  const binary = atob(norm);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/* Gói PCM 16-bit mono (mặc định 24kHz của Gemini TTS) thành file WAV chuẩn */
export function pcm16ToWavBlob(pcmBytes, sampleRate = 24000, channels = 1) {
  const bytes = pcmBytes instanceof Uint8Array ? pcmBytes : new Uint8Array(pcmBytes || 0);
  const dataLen = bytes.byteLength;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // Linear PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // Bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);

  return new Blob([header, bytes], { type: 'audio/wav' });
}

function inlineAudioToBlob(inlineData) {
  const b64 = inlineData?.data;
  const mime = String(inlineData?.mimeType || inlineData?.mime_type || 'audio/L16;rate=24000');
  if (!b64) throw new Error('Không có dữ liệu âm thanh trả về từ AI.');
  const rawBytes = decodeBase64ToBytes(b64);
  if (/audio\/(wav|mpeg|mp3|ogg|webm)/i.test(mime)) {
    return new Blob([rawBytes], { type: mime });
  }
  const rateMatch = /rate=(\d+)/i.exec(mime);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  return pcm16ToWavBlob(rawBytes, sampleRate, 1);
}

async function fetchGeminiTtsJson(payload, signal) {
  const proxyRes = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'gemini',
      model: CLOUD_TTS_MODEL,
      payload,
    }),
    signal,
  }).catch(() => null);

  if (proxyRes && proxyRes.ok) {
    return await proxyRes.json();
  }

  // Fallback sang key phía client nếu môi trường static preview chưa mount /api/ai-chat
  const ring = getCloudKeyRing();
  const attempts = Math.min(3, Math.max(0, ring.size));
  for (let i = 0; i < attempts; i++) {
    const key = ring.get();
    if (!key) break;
    const url = `${GEMINI_BASE}/models/${encodeURIComponent(CLOUD_TTS_MODEL)}:generateContent?key=${encodeURIComponent(key)}`;
    const directRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }).catch(() => null);

    if (directRes && directRes.ok) {
      ring.reportGood(key);
      return await directRes.json();
    }
    if (directRes && (directRes.status === 429 || directRes.status === 401 || directRes.status === 403)) {
      ring.reportBad(key, 5 * 60 * 1000, `HTTP ${directRes.status}`);
      continue;
    }
    break;
  }

  throw new Error('Không kết nối được dịch vụ giọng đọc AI Tiếng Việt.');
}

async function getCloudTtsBlob(chunk, options, signal) {
  const voiceName = options.cloudVoice || CLOUD_TTS_VOICE;
  const cacheKey = `${voiceName}:${chunk}`;
  if (cloudAudioCache.has(cacheKey)) {
    return cloudAudioCache.get(cacheKey);
  }

  const payload = {
    contents: [{ role: 'user', parts: [{ text: chunk }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };

  const json = await fetchGeminiTtsJson(payload, signal);
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const audioPart = parts.find((p) => p?.inlineData?.data || p?.inline_data?.data);
  const inlineData = audioPart?.inlineData || audioPart?.inline_data;
  if (!inlineData?.data) {
    throw new Error('Máy chủ chưa trả về tệp âm thanh Tiếng Việt.');
  }

  const blob = inlineAudioToBlob(inlineData);
  if (cloudAudioCache.size >= MAX_CACHE_ITEMS) {
    const oldest = cloudAudioCache.keys().next().value;
    if (oldest !== undefined) cloudAudioCache.delete(oldest);
  }
  cloudAudioCache.set(cacheKey, blob);
  return blob;
}

function playBlob(blob, options, token) {
  if (typeof Audio === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ phát âm thanh WAV.'));
  }

  return new Promise((resolve, reject) => {
    if (token !== playbackToken) {
      resolve({ canceled: true });
      return;
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = Math.min(2.0, Math.max(0.5, options.rate ?? 1.0));
    audio.volume = Math.min(1.0, Math.max(0.0, options.volume ?? 1.0));
    currentAudio = audio;
    currentAudioUrl = url;

    const cleanup = () => {
      if (currentAudio === audio) currentAudio = null;
      if (currentAudioUrl === url) {
        currentAudioUrl = '';
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      }
    };

    audio.onended = () => {
      cleanup();
      resolve({ canceled: token !== playbackToken });
    };
    audio.onerror = () => {
      cleanup();
      if (token !== playbackToken) {
        resolve({ canceled: true });
      } else {
        reject(new Error('Không thể phát âm thanh Tiếng Việt.'));
      }
    };

    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err) => {
        cleanup();
        if (token !== playbackToken) resolve({ canceled: true });
        else reject(err || new Error('Trình duyệt chặn tự động phát âm thanh.'));
      });
    }
  });
}

async function speakChunksViaCloud(chunks, options, token) {
  if (typeof fetch !== 'function' || typeof Audio === 'undefined') {
    throw new Error('Thiết bị chưa cài giọng đọc Tiếng Việt và không hỗ trợ phát audio trực tuyến.');
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  activeAbortController = controller;

  try {
    for (const chunk of chunks) {
      if (token !== playbackToken) return { canceled: true, engine: 'gemini-tts' };
      const blob = await getCloudTtsBlob(chunk, options, controller?.signal);
      if (token !== playbackToken) return { canceled: true, engine: 'gemini-tts' };
      const res = await playBlob(blob, options, token);
      if (res?.canceled || token !== playbackToken) return { canceled: true, engine: 'gemini-tts' };
    }
    return { canceled: false, engine: 'gemini-tts', voiceName: options.cloudVoice || CLOUD_TTS_VOICE };
  } catch (err) {
    if (token !== playbackToken || err?.name === 'AbortError') {
      return { canceled: true, engine: 'gemini-tts' };
    }
    throw err;
  } finally {
    if (activeAbortController === controller) activeAbortController = null;
  }
}

function speakSingleWebSpeechChunk(s, chunk, viVoice, options, token) {
  return new Promise((resolve, reject) => {
    if (token !== playbackToken) {
      resolve({ canceled: true });
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = (viVoice.lang && viVoice.lang.replace(/_/g, '-')) || 'vi-VN';
    utterance.voice = viVoice;
    utterance.rate = Math.min(2.0, Math.max(0.5, options.rate ?? 1.0));
    utterance.pitch = Math.min(2.0, Math.max(0.0, options.pitch ?? 1.0));
    utterance.volume = Math.min(1.0, Math.max(0.0, options.volume ?? 1.0));

    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
      resolve({ canceled: token !== playbackToken });
    };
    utterance.onerror = (e) => {
      if (currentUtterance === utterance) currentUtterance = null;
      const code = e?.error || '';
      if (token !== playbackToken || code === 'interrupted' || code === 'canceled') {
        resolve({ canceled: true });
      } else {
        const err = new Error(`Lỗi đọc Web Speech: ${code || 'unknown'}`);
        err.code = code;
        reject(err);
      }
    };

    currentUtterance = utterance;
    s.speak(utterance);
  });
}

/* Đọc text bằng giọng Tiếng Việt (ưu tiên giọng Việt trên máy, dự phòng giọng AI Tiếng Việt) */
export async function speak(text, options = {}) {
  const clean = cleanForSpeech(text);
  if (!clean) throw new Error('Không có nội dung để đọc.');

  const s = getSynth();
  const wasBusy = Boolean(s && (s.speaking || s.pending));
  stop();
  const token = playbackToken;

  // Nhả nhẹ 35ms nếu vừa hủy câu đọc cũ để Chrome không nuốt mất câu mới
  if (wasBusy) {
    await new Promise((r) => setTimeout(r, 35));
    if (token !== playbackToken) return { canceled: true };
  }

  const chunks = splitSpeechChunks(clean, options.maxChunkLength || 220);
  if (chunks.length === 0) throw new Error('Không có nội dung để đọc.');

  if (options.preferCloud) {
    return await speakChunksViaCloud(chunks, options, token);
  }

  let viVoice = null;
  if (s && typeof SpeechSynthesisUtterance !== 'undefined') {
    const voices = await getVoices();
    if (token !== playbackToken) return { canceled: true };
    viVoice = pickVietnameseVoice(voices);
  }

  // Không có giọng Tiếng Việt trên trình duyệt/OS -> dùng giọng AI Tiếng Việt đám mây (KHÔNG rơi về tiếng Anh)
  if (!viVoice || !s) {
    return await speakChunksViaCloud(chunks, options, token);
  }

  for (let i = 0; i < chunks.length; i++) {
    if (token !== playbackToken) return { canceled: true, engine: 'webspeech', voiceName: viVoice.name };
    try {
      const res = await speakSingleWebSpeechChunk(s, chunks[i], viVoice, options, token);
      if (res?.canceled || token !== playbackToken) {
        return { canceled: true, engine: 'webspeech', voiceName: viVoice.name };
      }
    } catch {
      if (token !== playbackToken) return { canceled: true, engine: 'webspeech', voiceName: viVoice.name };
      // Giọng Web Speech (vd Google Tiếng Việt online) gặp lỗi mạng -> chuyển nốt phần còn lại sang Cloud Tiếng Việt
      return await speakChunksViaCloud(chunks.slice(i), options, token);
    }
  }

  return { canceled: false, engine: 'webspeech', voiceName: viVoice.name };
}

/* Dừng mọi âm thanh đang đọc */
export function stop() {
  playbackToken += 1;
  if (activeAbortController) {
    try { activeAbortController.abort(); } catch { /* ignore */ }
    activeAbortController = null;
  }
  const s = getSynth();
  if (s) {
    try { s.cancel(); } catch { /* ignore */ }
  }
  currentUtterance = null;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.removeAttribute?.('src');
    } catch { /* ignore */ }
    currentAudio = null;
  }
  if (currentAudioUrl) {
    try { URL.revokeObjectURL(currentAudioUrl); } catch { /* ignore */ }
    currentAudioUrl = '';
  }
}

/* Đang đọc? */
export function isSpeaking() {
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) return true;
  const s = getSynth();
  if (!s) return false;
  return Boolean(s.speaking && !s.paused);
}

/* Tạm dừng */
export function pause() {
  if (currentAudio && !currentAudio.paused) {
    try { currentAudio.pause(); } catch { /* ignore */ }
  }
  const s = getSynth();
  if (s) {
    try { s.pause(); } catch { /* ignore */ }
  }
}

/* Tiếp tục */
export function resume() {
  if (currentAudio && currentAudio.paused) {
    try { currentAudio.play(); } catch { /* ignore */ }
  }
  const s = getSynth();
  if (s) {
    try { s.resume(); } catch { /* ignore */ }
  }
}

/* Có hỗ trợ đọc giọng Tiếng Việt không? */
export function isSupported() {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window || (typeof Audio !== 'undefined' && typeof fetch === 'function');
}

/* Preload voices sớm (an toàn, không đóng băng khi Chrome/Edge chưa nạp giọng online) */
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  setTimeout(() => { refreshVoices(); }, 250);
}
