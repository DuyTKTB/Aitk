/* feedback.js — gửi phản hồi THẬT tới backend, có hàng đợi khi mất mạng.
   Hợp đồng API (backend cần làm):
     POST {VITE_FEEDBACK_URL || '/api/feedback'}   Content-Type: application/json
     body: { kind: 'bug'|'idea'|'content', message, contact?, context?, clientId, sentAt }
     201/200 → đã nhận.   4xx → dữ liệu sai (không gửi lại).   5xx/mạng → gửi lại sau. */

const URL_ = import.meta.env?.VITE_FEEDBACK_URL || '/api/feedback';
const QUEUE = 'cs-feedback-queue';
const LAST = 'cs-feedback-last';

const readQ = () => { try { return JSON.parse(localStorage.getItem(QUEUE) || '[]'); } catch { return []; } };
const writeQ = (q) => { try { localStorage.setItem(QUEUE, JSON.stringify(q)); } catch { /* */ } };

function clientId() {
  let id = localStorage.getItem('cs-client-id');
  if (!id) { id = crypto.randomUUID?.() || String(Date.now()) + Math.random(); try { localStorage.setItem('cs-client-id', id); } catch { /* */ } }
  return id;
}

export const collectContext = () => ({
  page: location.hash || '#home',
  ua: navigator.userAgent,
  viewport: innerWidth + 'x' + innerHeight,
  theme: document.documentElement.getAttribute('data-theme'),
  online: navigator.onLine,
});

async function post(item) {
  const res = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  if (res.ok) return 'sent';
  if (res.status >= 400 && res.status < 500) throw Object.assign(new Error('rejected'), { status: res.status });
  return 'retry';
}

/** @returns 'sent' | 'queued' ; ném lỗi nếu server từ chối (4xx) hoặc gửi quá nhanh */
export async function sendFeedback({ kind, message, contact, withContext }) {
  if (Date.now() - Number(localStorage.getItem(LAST) || 0) < 30000) throw Object.assign(new Error('rate'), { code: 'rate' });
  const item = { kind, message: message.trim(), contact: contact?.trim() || undefined, context: withContext ? collectContext() : undefined, clientId: clientId(), sentAt: new Date().toISOString() };
  try { localStorage.setItem(LAST, String(Date.now())); } catch { /* */ }
  try {
    if ((await post(item)) === 'sent') return 'sent';
  } catch (e) {
    if (e.status) throw e;           // 4xx: báo lỗi cho người dùng
  }
  writeQ([...readQ(), item].slice(-20)); // mạng/5xx: giữ lại, gửi sau
  return 'queued';
}

export async function flushFeedbackQueue() {
  const q = readQ();
  if (!q.length || !navigator.onLine) return 0;
  const left = [];
  let sent = 0;
  for (const item of q) {
    try { if ((await post(item)) === 'sent') sent += 1; else left.push(item); }
    catch (e) { if (!e.status) left.push(item); } // 4xx thì bỏ hẳn
  }
  writeQ(left);
  return sent;
}

export function initFeedbackQueue() {
  flushFeedbackQueue();
  window.addEventListener('online', flushFeedbackQueue);
}
