/* progress.js — cầu nối giữa Home và dữ liệu học THẬT của app.
   ĐỌC (do Quiz.jsx ghi, không ghi trùng):
     cs-xp            tổng XP            → cấp độ qua getLevel() của data/achievements.js
     cs-streak-v2     chuỗi ngày         → liveStreak() của hooks.js
     cs-quiz-stats    đúng/sai tổng      → độ chính xác, tổng câu
     cs-srs-v2        bản ghi SRS        → số nguyên tố đã thành thạo (stats() của lib/srs.js)
     cs-wrong-bank    nguyên tố từng sai → thẻ "Nên ôn"
   GHI (mới, chỉ để Home có dữ liệu theo ngày): cs-progress-v1 { goal, days, recent }
     Quiz gọi recordActivity() mỗi lần trả lời → biểu đồ 7 ngày + mục "Học tiếp". */
import { useMemo, useSyncExternalStore } from 'react';
import { ELEMENTS } from '../data/elements.js';
import { getLevel } from '../data/achievements.js';
import { liveStreak } from '../hooks.js';
import { stats as srsStats } from './srs.js';

const KEY = 'cs-progress-v1';
const EVT = 'cs-progress';
const DEFAULT = { goal: 10, days: {}, recent: [] };

export const dayKey = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

function readJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; }
}

let cache = { ...DEFAULT, ...readJSON(KEY, {}) };
function write(next) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* đầy bộ nhớ / chế độ riêng tư */ }
  window.dispatchEvent(new Event(EVT));
}
const subscribe = (cb) => {
  const onStorage = (e) => { if (e.key === KEY) { cache = { ...DEFAULT, ...readJSON(KEY, {}) }; cb(); } };
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', onStorage); };
};

/** Gọi mỗi khi người học làm xong MỘT việc (1 câu quiz, 1 thẻ ôn, 1 phương trình…).
 *  Các lần cùng loại trong 30 phút gộp thành một dòng "Học tiếp". */
export function recordActivity({ type, title, hash, count = 1 }) {
  const s = cache;
  const now = Date.now();
  const k = dayKey();
  const days = { ...s.days, [k]: (s.days[k] || 0) + count };
  const head = s.recent[0];
  const recent = head && head.type === type && head.title === title && now - head.t < 30 * 60e3
    ? [{ ...head, t: now, n: (head.n || 1) + count }, ...s.recent.slice(1)]
    : [{ id: now, type, title, hash, t: now, n: count }, ...s.recent].slice(0, 20);
  write({ ...s, days, recent });
}

export const setGoal = (goal) => write({ ...cache, goal });

/** Xóa phần Home tự lưu. Dữ liệu của Quiz (XP, SRS…) KHÔNG bị xóa ở đây. */
export const resetProgress = () => write(DEFAULT);

export function lastSevenDays(days) {
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ key: dayKey(d), dow: d.getDay(), count: days[dayKey(d)] || 0, today: i === 0 });
  }
  return out;
}

function readStudy() {
  const xp = Number(readJSON('cs-xp', 0)) || 0;
  const gs = readJSON('cs-quiz-stats', {});
  const ok = gs.totalCorrect || 0;
  const bad = gs.totalWrong || 0;
  const { current, next, progress } = getLevel(xp);
  let mastered = 0;
  try { mastered = srsStats(readJSON('cs-srs-v2', {}), ELEMENTS).mastered || 0; } catch { /* srs.js khác dự kiến */ }
  let streak = 0;
  try { streak = liveStreak(readJSON('cs-streak-v2', { last: '', n: 0, total: 0 })); } catch { /* */ }
  const wrongBank = readJSON('cs-wrong-bank', []);
  return {
    xp, streak, mastered, totalElements: ELEMENTS.length,
    answered: ok + bad,
    accuracy: ok + bad ? Math.round((ok / (ok + bad)) * 100) : null,
    wrongCount: Array.isArray(wrongBank) ? wrongBank.length : 0,
    lv: { lvl: current.lvl, title: current.title, next, progress: Math.round(progress) },
  };
}

export function useProgress() {
  const s = useSyncExternalStore(subscribe, () => cache, () => DEFAULT);
  const study = useMemo(readStudy, [s]);
  return {
    ...s, ...study,
    today: s.days[dayKey()] || 0,
    week: lastSevenDays(s.days),
    isEmpty: s.recent.length === 0 && study.answered === 0,
  };
}

export function timeAgo(t) {
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) return 'vừa xong';
  if (m < 60) return m + ' phút trước';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' giờ trước';
  const d = Math.round(h / 24);
  return d === 1 ? 'hôm qua' : d + ' ngày trước';
}