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
  if (!uid || !hasStorage()) return { grade: '', weakTopics: [], lastSeen: 0, notes: '' };
  const p = safeParse(localStorage.getItem(PROFILE_PREFIX + uid), null);
  return {
    grade: p?.grade || '',
    weakTopics: Array.isArray(p?.weakTopics) ? p.weakTopics : [],
    notes: p?.notes || '',
    lastSeen: p?.lastSeen || 0,
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

/* ============ KHỐI NGỮ CẢNH CHO PROMPT ============ */
export function buildMemoryBlock({ profile, olderSummary } = {}) {
  const parts = [];
  if (profile?.grade) parts.push(`Người học đang ở ${profile.grade}.`);
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
