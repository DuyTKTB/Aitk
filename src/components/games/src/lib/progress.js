/* progress.js — lưu tiến độ học trên máy (localStorage), Home đọc từ đây.
   Các trang khác (Quiz, Cân bằng, CUAI) gọi recordActivity() khi người học
   hoàn thành một việc. Khi có backend thì thay phần read()/write() là xong,
   giao diện không phải sửa. */
import { useSyncExternalStore } from 'react';

const KEY = 'cs-progress-v1';
const EVT = 'cs-progress';

export const TOPICS = [
  { id: 'cau-tao-nt', abbr: 'Cn', name: 'Cấu tạo nguyên tử' },
  { id: 'bang-tuan-hoan', abbr: 'Bt', name: 'Bảng tuần hoàn' },
  { id: 'lien-ket', abbr: 'Lk', name: 'Liên kết hóa học' },
  { id: 'can-bang-pthh', abbr: 'Cb', name: 'Cân bằng PTHH' },
  { id: 'axit-bazo', abbr: 'Ab', name: 'Axit – Bazơ – pH' },
  { id: 'oxi-hoa-khu', abbr: 'Ok', name: 'Oxi hóa – khử' },
  { id: 'hidrocacbon', abbr: 'Hc', name: 'Hiđrocacbon' },
  { id: 'ancol-phenol', abbr: 'Ap', name: 'Ancol – Phenol' },
  { id: 'este-lipit', abbr: 'El', name: 'Este – Lipit' },
  { id: 'kim-loai', abbr: 'Kl', name: 'Kim loại' },
];

const DEFAULT = { goal: 10, days: {}, topics: {}, recent: [] };

export const dayKey = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}
let cache = read();
function write(next) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* đầy bộ nhớ / chế độ riêng tư */ }
  window.dispatchEvent(new Event(EVT));
}

const subscribe = (cb) => {
  const onStorage = (e) => { if (e.key === KEY) { cache = read(); cb(); } };
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', onStorage); };
};

/** Ghi nhận một hoạt động.
 *  type: 'ai' | 'quiz' | 'balance' | 'capture'
 *  topic: id trong TOPICS (tùy chọn); correct/total: kết quả nếu có (quiz) */
export function recordActivity({ type, title, hash, topic, correct, total, count = 1 }) {
  const s = cache;
  const k = dayKey();
  const next = { ...s, days: { ...s.days, [k]: (s.days[k] || 0) + count } };
  if (topic && total > 0) {
    const old = s.topics[topic] || { m: 0, n: 0 };
    const score = correct / total;
    next.topics = { ...s.topics, [topic]: { n: old.n + total, m: old.n ? old.m * 0.65 + score * 0.35 : score } };
  }
  next.recent = [{ id: Date.now(), type, title, hash, topic, t: Date.now() }, ...s.recent].slice(0, 20);
  write(next);
}

export const setGoal = (goal) => write({ ...cache, goal });
export const resetProgress = () => write(DEFAULT);

function streakOf(days) {
  let n = 0;
  const d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1); // hôm nay chưa học thì không mất chuỗi
  while (days[dayKey(d)]) { n += 1; d.setDate(d.getDate() - 1); }
  return n;
}

export function lastSevenDays(days) {
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ key: dayKey(d), dow: d.getDay(), count: days[dayKey(d)] || 0, today: i === 0 });
  }
  return out;
}

export function useProgress() {
  const s = useSyncExternalStore(subscribe, () => cache, () => DEFAULT);
  return {
    ...s,
    today: s.days[dayKey()] || 0,
    streak: streakOf(s.days),
    week: lastSevenDays(s.days),
    isEmpty: s.recent.length === 0,
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
