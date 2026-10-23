/* ============================================================
   perf.js — bật "chế độ nhẹ" (html.perf-lite) cho máy yếu
   ------------------------------------------------------------
   Máy yếu = iPhone 8 trở xuống, iPad cũ, Android RAM thấp, hoặc máy
   đo được FPS thấp. Chế độ này chỉ tắt hiệu ứng tốn GPU (xem
   src/perf-lite.css), KHÔNG đổi bố cục hay màu sắc.

   Bật/tắt thủ công trong console trình duyệt:
     csPerf('lite')   // luôn nhẹ
     csPerf('full')   // luôn đầy đủ hiệu ứng
     csPerf()         // xoá lựa chọn, để tự phát hiện lại
   ============================================================ */

const KEY = 'cs-perf';
const LITE_CLASS = 'perf-lite';

function readSaved() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'lite' || v === 'full' ? v : null;
  } catch {
    return null;
  }
}

function save(v) {
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch { /* private mode */ }
}

/* iOS/iPadOS cũ: Safari < 16.4 thiếu nhiều thứ và GPU yếu hơn hẳn */
function isOldIOS() {
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!iOS) return false;
  const m = ua.match(/OS (\d+)_/);
  if (!m) return false;
  return Number(m[1]) < 16;
}

export function shouldUseLite() {
  const saved = readSaved();
  if (saved) return saved === 'lite';

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  if (navigator.connection?.saveData) return true;
  if (isOldIOS()) return true;

  // Chrome/Android có deviceMemory; Safari thì không
  const mem = navigator.deviceMemory;
  if (typeof mem === 'number' && mem > 0 && mem <= 4) return true;

  const cores = navigator.hardwareConcurrency || 0;
  if (cores && cores <= 4) return true;

  return false;
}

export function isLite() {
  return document.documentElement.classList.contains(LITE_CLASS);
}

export function enableLite() {
  document.documentElement.classList.add(LITE_CLASS);
}

/* Đo FPS thật: máy yếu thường tụt dưới 45fps ngay ở trang đầu.
   Chỉ chạy 1 lần/phiên, sau khi trang đã ổn định, và bỏ qua nếu tab bị ẩn. */
function probeFps(cb) {
  if (document.hidden) return;
  let frames = 0;
  const t0 = performance.now();
  const tick = () => {
    frames += 1;
    const dt = performance.now() - t0;
    if (dt < 700) {
      requestAnimationFrame(tick);
    } else {
      cb((frames * 1000) / dt, document.hidden);
    }
  };
  requestAnimationFrame(tick);
}

export function applyPerfMode() {
  if (shouldUseLite()) {
    enableLite();
    return true;
  }
  if (readSaved() === 'full') return false;

  // Chưa kết luận được từ thông số máy → đo FPS sau khi trang tải xong
  const run = () => probeFps((fps, hidden) => {
    if (hidden || isLite()) return;
    if (fps < 45) {
      enableLite();
      save('lite');
      console.info(`[perf] FPS ${fps.toFixed(0)} → bật chế độ nhẹ cho lần sau`);
    }
  });

  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2500);

  return false;
}

/* Công tắc thủ công */
export function setPerfMode(mode) {
  if (mode !== 'lite' && mode !== 'full') save(null);
  else save(mode);
  location.reload();
}

if (typeof window !== 'undefined') {
  window.csPerf = setPerfMode;
}
