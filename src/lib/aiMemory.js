/* ============================================================
   aiMemory.js — BỘ NHỚ DÀI HẠN CHO ELEC AI
   ------------------------------------------------------------
   Trước đây ai.js chỉ gửi 12 tin nhắn gần nhất → mất ngữ cảnh dài
   (bài tập ở đầu cuộc trò chuyện bị quên). Module này:
     1. Nén các tin nhắn CŨ thành một bản tóm tắt cục bộ (không tốn lượt AI).
     2. Lưu HỒ SƠ HỌC TẬP theo uid: khối lớp, chủ đề yếu, sở thích giải thích.
   Thuần JS, test được bằng vitest.
   ============================================================ */
import { extractFormulas } from './aiTools.js';

const PROFILE_PREFIX = 'cs-ai-memory:';
const MAX_WEAK_TOPICS = 8;

/* ============ HỒ SƠ HỌC TẬP ============ */
const safeParse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

const hasStorage = () => {
  try { return typeof localStorage !== 'undefined' && localStorage != null; } catch { return false; }
};

export function loadProfile(uid) {
  if (!uid || !hasStorage()) {
    return {
      grade: '',
      weakTopics: [],
      lastSeen: 0,
      notes: '',
      role: '',
      goal: '',
      subjects: [],
      examBlock: '',
      currentLevel: '',
      aiStyle: '',
      dailyMinutes: 0,
    };
  }
  const p = safeParse(localStorage.getItem(PROFILE_PREFIX + uid), null);
  return {
    grade: p?.grade || '',
    weakTopics: Array.isArray(p?.weakTopics) ? p.weakTopics : [],
    notes: p?.notes || '',
    lastSeen: p?.lastSeen || 0,
    role: p?.role || '',
    goal: p?.goal || '',
    subjects: Array.isArray(p?.subjects) ? p.subjects : [],
    examBlock: p?.examBlock || '',
    currentLevel: p?.currentLevel || '',
    aiStyle: p?.aiStyle || '',
    dailyMinutes: Number(p?.dailyMinutes) || 0,
  };
}

export function saveProfile(uid, patch) {
  if (!uid || !hasStorage()) return null;
  const next = { ...loadProfile(uid), ...patch, lastSeen: Date.now() };
  try { localStorage.setItem(PROFILE_PREFIX + uid, JSON.stringify(next)); } catch { /* quota */ }
  return next;
}

/** Ghi nhận một chủ đề người học còn yếu (gọi khi quiz sai / AI phát hiện lỗi hổng). */
export function noteWeakTopic(uid, topic) {
  const name = String(topic || '').trim();
  if (!uid || name.length < 3) return null;
  const p = loadProfile(uid);
  const list = p.weakTopics.filter((t) => t.topic !== name);
  list.unshift({ topic: name, count: (p.weakTopics.find((t) => t.topic === name)?.count || 0) + 1, at: Date.now() });
  return saveProfile(uid, { weakTopics: list.slice(0, MAX_WEAK_TOPICS) });
}

/* ============ NÉN NGỮ CẢNH HỘI THOẠI ============ */
const textOf = (m) => {
  if (!m) return '';
  if (Array.isArray(m.parts)) return m.parts.filter((p) => p && p.text).map((p) => p.text).join(' ');
  return String(m.text || m.content || '');
};

const clip = (s, n) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

/**
 * summarizeMessages(messages) → chuỗi tóm tắt ngắn (tiếng Việt).
 * Trích: câu hỏi chính, công thức/khái niệm đã bàn, kết luận cuối của AI.
 */
export function summarizeMessages(messages) {
  const list = Array.isArray(messages) ? messages : [];
  if (!list.length) return '';

  const questions = [];
  const formulas = new Set();
  const keywords = new Set();
  const KEY_RE = /(nguyên tử|bảng tuần hoàn|liên kết|oxi hóa|oxi hoá|redox|cân bằng|tốc độ|halogen|kim loại|phi kim|nitrogen|sulfur|hữu cơ|hydrocarbon|alcohol|phenol|carbonyl|carboxylic|este|lipid|cacbohidrat|amin|amino axit|peptit|protein|polymer|điện phân|pin|pH|dung dịch|nồng độ|mol|hiệu suất|đồng phân|danh pháp|nhận biết)/gi;

  for (const m of list) {
    const t = textOf(m);
    if (!t) continue;
    if (m.role === 'user') {
      const q = clip(t, 90);
      if (q && !/^\[.*\]$/.test(q)) questions.push(q);
      for (const f of extractFormulas(t)) formulas.add(f.formula);
      for (const k of t.match(KEY_RE) || []) keywords.add(k.toLowerCase());
    }
  }

  const parts = [];
  if (questions.length) {
    parts.push(`Các câu hỏi/ý chính đã trao đổi: ${questions.slice(-6).map((q) => `"${q}"`).join('; ')}.`);
  }
  const lastModel = [...list].reverse().find((m) => m.role !== 'user' && textOf(m));
  if (lastModel) parts.push(`Kết luận gần nhất của trợ lý: ${clip(textOf(lastModel), 200)}`);
  if (formulas.size) parts.push(`Chất/công thức đã nhắc: ${[...formulas].slice(0, 12).join(', ')}.`);
  if (keywords.size) parts.push(`Chủ đề liên quan: ${[...keywords].slice(0, 8).join(', ')}.`);

  return parts.join(' ');
}

/**
 * compressHistory(history, { keep = 8 })
 * → { recent, olderSummary }
 * `recent` giữ nguyên các message cuối; các message cũ được nén thành `olderSummary`
 * (nhét vào system prompt, không tốn token cho từng message).
 */
export function compressHistory(history, { keep = 8 } = {}) {
  const list = Array.isArray(history) ? history : [];
  if (list.length <= keep + 2) return { recent: list, olderSummary: '' };
  const cut = list.length - keep;
  const older = list.slice(0, cut);
  return { recent: list.slice(cut), olderSummary: summarizeMessages(older) };
}

const GOAL_LABELS = {
  thptqg: 'Ôn thi THPT Quốc gia',
  dgnl: 'Ôn thi ĐGNL / ĐGTD',
  hoc_tot: 'Củng cố kiến thức trên lớp & nâng GPA',
  hsg: 'Ôn thi Học sinh giỏi / chuyên sâu',
  giang_day: 'Giảng dạy, soạn đề & hỗ trợ lớp học',
};

const LEVEL_LABELS = {
  mat_goc: 'Cần lấy lại nền tảng cơ bản (hãy giải thích chậm, rõ từng khái niệm)',
  trung_binh: 'Trung bình – khá (mục tiêu 6.5–7.5đ, ưu tiên chắc câu nhận biết & thông hiểu)',
  kha_gioi: 'Khá – giỏi (mục tiêu 8.0–8.75đ, chú trọng vận dụng & tránh bẫy)',
  thu_khoa: 'Mục tiêu 9+ / Thủ khoa (ưu tiên bài vận dụng cao, giải nhanh & tối ưu)',
};

const AI_STYLE_LABELS = {
  step_by_step: 'Giải chi tiết từng bước từ công thức đến đáp số',
  socratic: 'Gợi mở tư duy Socratic (hướng dẫn từng gợi ý để người học tự tìm ra bước tiếp theo trước khi chốt)',
  concise: 'Ngắn gọn, súc tích, tập trung công thức cốt lõi và mẹo giải nhanh',
  friendly: 'Thân thiện, gần gũi, khích lệ tinh thần học tập',
};

const SUBJECT_LABELS = {
  vat_ly: 'Vật lí',
  hoa_hoc: 'Hóa học',
  sinh_hoc: 'Sinh học',
  toan: 'Toán học',
};

/* ============ KHỐI NGỮ CẢNH CHO PROMPT ============ */
export function buildMemoryBlock({ profile, olderSummary } = {}) {
  const parts = [];
  if (profile?.role === 'teacher') parts.push('Vai trò người dùng: Giáo viên.');
  if (profile?.grade) parts.push(`Người học đang ở ${profile.grade}.`);
  if (profile?.goal) {
    parts.push(`Mục tiêu chính: ${GOAL_LABELS[profile.goal] || profile.goal}.`);
  }
  if (Array.isArray(profile?.subjects) && profile.subjects.length) {
    const subjText = profile.subjects.map((s) => SUBJECT_LABELS[s] || s).join(', ');
    const blockText = profile.examBlock && profile.examBlock !== 'other' ? ` (Khối ${profile.examBlock})` : '';
    parts.push(`Môn quan tâm: ${subjText}${blockText}.`);
  }
  if (profile?.currentLevel) {
    parts.push(`Trình độ hiện tại: ${LEVEL_LABELS[profile.currentLevel] || profile.currentLevel}.`);
  }
  if (profile?.aiStyle) {
    parts.push(`Phong cách hướng dẫn mong muốn: ${AI_STYLE_LABELS[profile.aiStyle] || profile.aiStyle}.`);
  }
  if (profile?.weakTopics?.length) {
    parts.push(
      `Chủ đề người học còn yếu (cần chú ý, giải thích kỹ hơn): ${profile.weakTopics
        .slice(0, 4).map((t) => t.topic).join('; ')}.`
    );
  }
  if (profile?.notes) parts.push(`Ghi chú về người học: ${clip(profile.notes, 200)}`);
  if (olderSummary) parts.push(`Ngữ cảnh cuộc trò chuyện trước đó: ${olderSummary}`);
  if (!parts.length) return '';
  return `HỒ SƠ & NGỮ CẢNH NGƯỜI HỌC (dùng để cá nhân hóa, không nhắc lại máy móc)\n- ${parts.join('\n- ')}`;
}
