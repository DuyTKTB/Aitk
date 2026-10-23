/* ============================================================
   schedule.js — dùng chung cho trang Thời khóa biểu và Home
   Đặt tại: src/lib/schedule.js
   ============================================================ */
import { useLocalStorage } from '../hooks.js';

export const COLORS = [
  { key: 'blue', label: 'Xanh dương', rgb: '10,132,255' },
  { key: 'purple', label: 'Tím', rgb: '175,82,222' },
  { key: 'pink', label: 'Hồng', rgb: '255,45,85' },
  { key: 'orange', label: 'Cam', rgb: '255,149,0' },
  { key: 'yellow', label: 'Vàng', rgb: '255,204,0' },
  { key: 'green', label: 'Xanh lá', rgb: '52,199,89' },
  { key: 'teal', label: 'Ngọc', rgb: '48,176,199' },
];
export const colorOf = (k) => COLORS.find((c) => c.key === k) || COLORS[0];

/* Thứ tự hiển thị T2 → CN, giá trị là Date.getDay() */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const DAY_SHORT = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN' };
export const DAY_LONG = {
  1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm', 5: 'Thứ Sáu', 6: 'Thứ Bảy', 0: 'Chủ Nhật',
};

const pad2 = (n) => String(n).padStart(2, '0');
export const toMin = (s) => {
  const [h, m] = String(s || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const minToStr = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const fmtDur = (min) => {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} giờ ${r} phút` : `${h} giờ`;
};

/* Sự kiện lặp hàng tuần (days) hoặc chỉ một ngày (date) */
export const occursOn = (ev, date) =>
  ev.date ? ev.date === dateKey(date) : (ev.days || []).includes(date.getDay());

export const eventsOn = (list, date) =>
  list.filter((e) => occursOn(e, date)).sort((a, b) => toMin(a.start) - toMin(b.start));

export const doneKey = (id, date) => `${id}@${dateKey(date)}`;

export function useSchedule() {
  const [events, setEvents] = useLocalStorage('cs-schedule', []);
  const [done, setDone] = useLocalStorage('cs-schedule-done', {});

  const toggleDone = (id, date = new Date()) => {
    const k = doneKey(id, date);
    setDone((d) => {
      const n = { ...d };
      if (n[k]) delete n[k];
      else n[k] = 1;
      return n;
    });
  };

  return { events, setEvents, done, toggleDone };
}
