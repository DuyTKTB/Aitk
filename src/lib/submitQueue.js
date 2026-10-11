/* ============================================================
   submitQueue.js — Hàng đợi nộp bài khi rớt mạng
   ------------------------------------------------------------
   • submitExamSafe(): thử nộp; nếu lỗi mạng → cất vào localStorage
     và trả { ok:false, queued:true } để giao diện báo "đã lưu, sẽ tự nộp".
   • Tự gửi lại khi trình duyệt có mạng (sự kiện 'online') và mỗi lần mở app.
   • Nộp trùng không sao: submitExam dùng ID cố định nên chỉ ghi 1 bài.
   ============================================================ */
import { submitExam } from './classroom.js';

const KEY = 'cs-submit-queue-v1';
const EVT = 'cs-submit-queue';

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const write = (arr) => {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch { /* đầy bộ nhớ */ }
  window.dispatchEvent(new Event(EVT));
};

export const pendingSubmissions = () => read();
export const onQueueChange = (cb) => {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
};

const looksOffline = (r) =>
  (typeof navigator !== 'undefined' && navigator.onLine === false) ||
  /unavailable|network|offline|kết nối|mạng/i.test(String(r?.error || r?.message || ''));

export async function submitExamSafe(payload) {
  let res;
  try {
    res = await submitExam(payload);
  } catch (e) {
    res = { ok: false, error: e?.message || String(e) };
  }
  if (res?.ok) return res;

  if (looksOffline(res)) {
    const q = read().filter((x) => !(x.examId === payload.examId && x.student?.id === payload.student?.id));
    q.push({ ...payload, queuedAt: Date.now() });
    write(q);
    return { ok: false, queued: true, error: 'Mất kết nối. Bài đã được lưu trên máy và sẽ tự nộp khi có mạng.' };
  }
  return res;
}

let flushing = false;
export async function flushSubmitQueue() {
  if (flushing) return { sent: 0 };
  flushing = true;
  let sent = 0;
  try {
    let q = read();
    for (const item of q) {
      // eslint-disable-next-line no-await-in-loop
      const r = await submitExam(item).catch((e) => ({ ok: false, error: e?.message }));
      if (r?.ok) {
        sent += 1;
        q = q.filter((x) => x !== item && !(x.examId === item.examId && x.student?.id === item.student?.id));
        write(q);
      } else if (!looksOffline(r)) {
        // lỗi không phải do mạng (đề đóng, v.v.) → bỏ khỏi hàng đợi để khỏi lặp vô hạn
        q = q.filter((x) => x.examId !== item.examId || x.student?.id !== item.student?.id);
        write(q);
      }
    }
  } finally { flushing = false; }
  return { sent };
}

export function initSubmitQueue() {
  window.addEventListener('online', () => { flushSubmitQueue(); });
  if (navigator.onLine) flushSubmitQueue();
}
