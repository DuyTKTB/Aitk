
/* Danh sách giọng đọc tiếng Việt ưu tiên */
const VI_VOICES = [
  { lang: 'vi-VN', name: 'Google Tiếng Việt' },
  { lang: 'vi-VN', name: 'Microsoft An' },
  { lang: 'vi-VN', name: 'Linh' },
  { lang: 'vi-VN', name: 'Vietnamese' },
];

let synth = null;
let currentUtterance = null;
let voicesLoaded = false;
let voiceCache = [];

const getSynth = () => {
  if (typeof window === 'undefined') return null;
  if (!('speechSynthesis' in window)) return null;
  if (!synth) synth = window.speechSynthesis;
  return synth;
};

/* Load voices — lần đầu có thể mất vài trăm ms */
const loadVoices = () => {
  const s = getSynth();
  if (!s) return [];
  const voices = s.getVoices();
  if (voices.length > 0) {
    voicesLoaded = true;
    voiceCache = voices;
  }
  return voices;
};

/* Lấy voices (async nếu chưa load) */
export function getVoices() {
  if (voicesLoaded && voiceCache.length > 0) return Promise.resolve(voiceCache);
  const s = getSynth();
  if (!s) return Promise.resolve([]);

  return new Promise((resolve) => {
    const initial = s.getVoices();
    if (initial.length > 0) {
      voicesLoaded = true;
      voiceCache = initial;
      resolve(initial);
      return;
    }
    let resolved = false;
    const onVoices = () => {
      if (resolved) return;
      resolved = true;
      voicesLoaded = true;
      voiceCache = s.getVoices();
      resolve(voiceCache);
    };
    s.onvoiceschanged = onVoices;
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        voiceCache = s.getVoices();
        resolve(voiceCache);
      }
    }, 1000);
  });
}

/* Tìm giọng tiếng Việt tốt nhất */
function pickVietnameseVoice(voices) {
  if (!voices || voices.length === 0) return null;
  for (const pref of VI_VOICES) {
    const found = voices.find(
      (v) => v.lang.startsWith('vi') && v.name.includes(pref.name)
    );
    if (found) return found;
  }
  return voices.find((v) => v.lang.startsWith('vi')) || null;
}

/* Chuẩn bị text cho TTS — bỏ markdown, ký hiệu không đọc được */
function cleanForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/g, '$1$2')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '(có đoạn code)')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/→/g, ' tạo thành ')
    .replace(/⇌/g, ' thuận nghịch ')
    .replace(/↑/g, ' bay lên ')
    .replace(/↓/g, ' kết tủa ')
    .replace(/Δ/g, ' đun nóng ')
    .replace(/≈/g, ' xấp xỉ ')
    .replace(/≤/g, ' nhỏ hơn hoặc bằng ')
    .replace(/≥/g, ' lớn hơn hoặc bằng ')
    .replace(/±/g, ' cộng trừ ')
    .replace(/×/g, ' nhân ')
    .replace(/·/g, ' nhân ')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Đọc text */
export function speak(text, options = {}) {
  const s = getSynth();
  if (!s) return Promise.reject(new Error('Trình duyệt không hỗ trợ đọc văn bản.'));
  stop();

  const clean = cleanForSpeech(text);
  if (!clean) return Promise.reject(new Error('Không có nội dung để đọc.'));

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = options.lang || 'vi-VN';
  utterance.rate = options.rate ?? 1.0;      // 0.5 - 2.0
  utterance.pitch = options.pitch ?? 1.0;    // 0 - 2
  utterance.volume = options.volume ?? 1.0;  // 0 - 1
  const voices = voicesLoaded ? voiceCache : s.getVoices();
  const viVoice = pickVietnameseVoice(voices);
  if (viVoice) utterance.voice = viVoice;

  return new Promise((resolve, reject) => {
    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };
    utterance.onerror = (e) => {
      currentUtterance = null;
      if (e.error === 'interrupted' || e.error === 'canceled') {
        resolve();
      } else {
        reject(new Error(`Lỗi đọc: ${e.error}`));
      }
    };
    currentUtterance = utterance;
    s.speak(utterance);
  });
}

/* Dừng đọc */
export function stop() {
  const s = getSynth();
  if (!s) return;
  try {
    s.cancel();
  } catch {}
  currentUtterance = null;
}

/* Đang đọc? */
export function isSpeaking() {
  const s = getSynth();
  if (!s) return false;
  return s.speaking && !s.paused;
}

/* Tạm dừng */
export function pause() {
  const s = getSynth();
  if (!s) return;
  try { s.pause(); } catch {}
}

/* Tiếp tục */
export function resume() {
  const s = getSynth();
  if (!s) return;
  try { s.resume(); } catch {}
}

/* Có hỗ trợ không? */
export function isSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/* Preload voices khi idle */
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  setTimeout(() => { loadVoices(); }, 2000);
}