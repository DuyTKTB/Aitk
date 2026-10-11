/* ============================================================
   serverClock.js — Đồng hồ theo GIỜ MÁY CHỦ
   ------------------------------------------------------------
   Đồng hồ thi dựa vào Date.now() của máy học sinh nên chỉnh giờ máy là kéo dài được giờ thi.
   Ở đây ước lượng độ lệch (offset) giữa máy và server qua header `Date` của một request HEAD
   (không tốn lượt đọc Firestore), rồi dùng serverNow() thay cho Date.now().
   ============================================================ */
let offsetMs = 0;
let synced = false;
let inflight = null;

export const serverNow = () => Date.now() + offsetMs;
export const clockSynced = () => synced;
export const clockOffset = () => offsetMs;

export function syncServerClock(url = '/') {
  if (inflight) return inflight;
  inflight = (async () => {
    // lấy mẫu 3 lần, chọn lần có độ trễ mạng thấp nhất cho chính xác
    let best = null;
    for (let i = 0; i < 3; i++) {
      const t0 = Date.now();
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        const t1 = Date.now();
        const h = res.headers.get('date');
        if (!h) continue;
        const server = new Date(h).getTime();
        if (Number.isNaN(server)) continue;
        const rtt = t1 - t0;
        // header Date chỉ chính xác tới giây → cộng nửa giây bù làm tròn xuống
        const off = server + 500 + rtt / 2 - t1;
        if (!best || rtt < best.rtt) best = { rtt, off };
      } catch { /* mất mạng: giữ offset cũ */ }
    }
    if (best) { offsetMs = Math.round(best.off); synced = true; }
    inflight = null;
    return offsetMs;
  })();
  return inflight;
}

export function initServerClock() {
  syncServerClock();
  window.addEventListener('online', () => syncServerClock());
  setInterval(() => syncServerClock(), 10 * 60 * 1000); // chỉnh lại mỗi 10 phút
}
