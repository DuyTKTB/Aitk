/* ============================================================
   useExamGuard.js — v4 STRICT + FORCE FULLSCREEN
   ------------------------------------------------------------
   Sửa v4:
     • Mọi effect gọi recordEvent qua hàm ỔN ĐỊNH (ref) → interval
       kiểm tra fullscreen/DevTools không còn bị huỷ & tạo lại mỗi
       khi finishExam/sessionId/user đổi tham chiếu (nguyên nhân bộ
       đếm vi phạm đứng ở 0/3).
     • onAutoSubmit / onEvent cũng đọc qua ref.
   ============================================================ */
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_LIMIT = 3;
const DEDUP_MS = 800;
const BLUR_GRACE_MS = 800;
const STARTUP_GRACE_MS = 3000;
const FS_CHECK_INTERVAL_MS = 500;
const NO_FS_LIMIT_MS = 5000;
const LONG_BLUR_MS = 15000;
const DEVTOOLS_THRESHOLD = 160;

export function useExamGuard({ active, onAutoSubmit, config, onEvent }) {
  const limit = config?.tabSwitchLimit ?? DEFAULT_LIMIT;
  const fullscreenLock = config?.fullscreenLock ?? true;
  const blockCopyPaste = config?.blockCopyPaste ?? true;
  const strictMode = config?.strictMode ?? false;

  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [events, setEvents] = useState([]);

  const activeRef = useRef(active);
  const limitRef = useRef(limit);
  const strictRef = useRef(strictMode);
  const onEventRef = useRef(onEvent);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const lastEventAtRef = useRef(0);
  const blurTimerRef = useRef(null);
  const autoSubmittedRef = useRef(false);
  const violationsRef = useRef(0);
  const activeSinceRef = useRef(0);
  const lastHiddenAtRef = useRef(0);
  const lastFullscreenAtRef = useRef(0);
  const blurStartRef = useRef(0);
  const devtoolsOpenRef = useRef(false);
  const recordEventRef = useRef(null);

  useEffect(() => {
    activeRef.current = active;
    if (active) {
      activeSinceRef.current = Date.now();
      lastFullscreenAtRef.current = Date.now();
      autoSubmittedRef.current = false;
    }
  }, [active]);
  useEffect(() => { limitRef.current = limit; }, [limit]);
  useEffect(() => { strictRef.current = strictMode; }, [strictMode]);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onAutoSubmitRef.current = onAutoSubmit; }, [onAutoSubmit]);

  const inStartupGrace = () => Date.now() - activeSinceRef.current < STARTUP_GRACE_MS;

  /* ---- Record event (đọc mọi thứ qua ref → identity ổn định) ---- */
  const recordEvent = useCallback((type, severity, meta = {}) => {
    if (!activeRef.current) return;
    if (autoSubmittedRef.current) return;

    const strict = strictRef.current;
    const inGrace = inStartupGrace();
    const now = Date.now();

    if (now - lastEventAtRef.current < DEDUP_MS && severity === 'hard') return;
    if (severity === 'hard' && !inGrace) lastEventAtRef.current = now;

    const evt = {
      type,
      at: now,
      severity: inGrace ? 'soft' : severity,
      meta: { ...(meta || {}), inGrace, strict },
    };
    setEvents((arr) => [...arr, evt]);
    onEventRef.current?.(evt);

    if (inGrace) {
      console.log('[guard] Grace period — bỏ qua:', type);
      return;
    }

    if (severity === 'hard') {
      const next = violationsRef.current + 1;
      violationsRef.current = next;
      setViolations(next);
      console.log('[guard] Vi phạm', next, '/', limitRef.current, '→', type);

      if (strict && next === 1 && limitRef.current > 1) {
        setWarning({
          type: 'violation-strict',
          text: `⚠ NGHIÊM TRỌNG: ${humanReason(type)}. Vi phạm tiếp theo sẽ tự động nộp bài!`,
          eventType: type,
          count: next,
          limit: limitRef.current,
        });
        return;
      }

      if (next >= limitRef.current) {
        if (!autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          setWarning({
            type: 'auto-submit',
            text: `Bạn đã vi phạm ${limitRef.current} lần. Bài sẽ tự động nộp.`,
            eventType: type,
            count: next,
            limit: limitRef.current,
          });
          onAutoSubmitRef.current?.(next);
        }
      } else {
        setWarning({
          type: 'violation',
          text: humanReason(type),
          eventType: type,
          count: next,
          limit: limitRef.current,
        });
      }
    } else {
      setWarning({ type: 'warn-soft', text: humanReason(type), eventType: type });
    }
  }, []);

  recordEventRef.current = recordEvent;
  /* fire: luôn cùng một tham chiếu, các effect chỉ phụ thuộc cái này */
  const fire = useCallback((...args) => recordEventRef.current?.(...args), []);

  /* ---- Fullscreen helpers ---- */
  const checkIsFullscreen = useCallback(() => !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ), []);

  const enterFullscreen = useCallback(async () => {
    try {
      /* Gọi requestFullscreen ĐỒNG BỘ trong tick đầu để còn "user gesture" */
      const el = document.documentElement;
      let p;
      if (el.requestFullscreen) p = el.requestFullscreen();
      else if (el.webkitRequestFullscreen) p = el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) p = el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) p = el.msRequestFullscreen();
      await p;

      setIsFullscreen(true);
      lastFullscreenAtRef.current = Date.now();
      setWarning(null);
      activeSinceRef.current = Date.now();
      console.log('[guard] ✅ Đã vào fullscreen');
      return true;
    } catch (e) {
      console.warn('[guard] ❌ Không vào được fullscreen:', e.message);
      setWarning({
        type: 'warn-soft',
        text: 'Không vào được chế độ toàn màn hình. Nhấn F11 hoặc nút bên dưới.',
      });
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  }, []);

  /* ---- Fullscreen change ---- */
  useEffect(() => {
    if (!active) return undefined;
    const onFsChange = () => {
      const fs = checkIsFullscreen();
      setIsFullscreen(fs);
      if (fs) lastFullscreenAtRef.current = Date.now();
      else if (activeRef.current && fullscreenLock) fire('exit_fullscreen', 'hard', { source: 'event' });
    };
    const evs = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    evs.forEach((e) => document.addEventListener(e, onFsChange));
    return () => evs.forEach((e) => document.removeEventListener(e, onFsChange));
  }, [active, fullscreenLock, fire, checkIsFullscreen]);

  /* ---- Interval: ở exam mà không fullscreen > 5s → vi phạm ---- */
  useEffect(() => {
    if (!active || !fullscreenLock) return undefined;
    const id = setInterval(() => {
      if (!activeRef.current) return;
      const fs = checkIsFullscreen();
      setIsFullscreen(fs);
      if (fs) {
        lastFullscreenAtRef.current = Date.now();
        return;
      }
      const noFsDuration = Date.now() - lastFullscreenAtRef.current;
      if (noFsDuration > NO_FS_LIMIT_MS) {
        fire('exit_fullscreen', 'hard', { source: 'interval', duration: Math.round(noFsDuration / 1000) });
        /* tính lại mốc để mỗi ~5s mới tính 1 lần, không dồn liên tục */
        lastFullscreenAtRef.current = Date.now();
      }
    }, FS_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, fullscreenLock, fire, checkIsFullscreen]);

  /* ---- Escape / F11 ---- */
  useEffect(() => {
    if (!active || !fullscreenLock) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'F11') {
        setTimeout(() => {
          if (!checkIsFullscreen() && activeRef.current) {
            fire('exit_fullscreen', 'hard', { source: 'key', key: e.key });
          }
        }, 250);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [active, fullscreenLock, fire, checkIsFullscreen]);

  /* ---- Tab visibility ---- */
  useEffect(() => {
    if (!active) return undefined;
    const onVis = () => {
      if (document.hidden && activeRef.current) {
        lastHiddenAtRef.current = Date.now();
        fire('tab_hidden', 'hard');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [active, fire]);

  /* ---- Window blur ---- */
  useEffect(() => {
    if (!active) return undefined;
    const onBlur = () => {
      blurStartRef.current = Date.now();
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        if (document.hasFocus()) return;
        if (document.hidden || Date.now() - lastHiddenAtRef.current < 8000) return;
        fire('window_blur', 'hard');
      }, BLUR_GRACE_MS);
    };
    const onFocus = () => {
      clearTimeout(blurTimerRef.current);
      const duration = blurStartRef.current ? Date.now() - blurStartRef.current : 0;
      if (duration > LONG_BLUR_MS && activeRef.current) {
        fire('long_blur', 'hard', { duration: Math.round(duration / 1000) });
      }
      blurStartRef.current = 0;
    };
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      clearTimeout(blurTimerRef.current);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [active, fire]);

  /* ---- DevTools detection ----
     Lưu ý: DevTools mở DẠNG DOCK (như ảnh bạn gửi) làm innerWidth nhỏ hơn
     outerWidth > 160px → sẽ bị tính vi phạm. Đúng ý đồ khi thi thật,
     nhưng khi dev hãy mở DevTools dạng cửa sổ riêng hoặc tắt check này. */
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      if (!activeRef.current) return;
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      const isOpen = wDiff > DEVTOOLS_THRESHOLD || hDiff > DEVTOOLS_THRESHOLD;
      if (isOpen && !devtoolsOpenRef.current) {
        devtoolsOpenRef.current = true;
        fire('devtools_open', 'hard');
      } else if (!isOpen) {
        devtoolsOpenRef.current = false;
      }
    }, 1500);
    return () => clearInterval(id);
  }, [active, fire]);

  /* ---- Phím tắt / copy / paste ---- */
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      const block =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key)) ||
        (e.ctrlKey && ['u', 'p', 's'].includes(e.key.toLowerCase()));
      if (block) {
        e.preventDefault();
        e.stopPropagation();
        fire('devtools_shortcut', 'soft');
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        try { navigator.clipboard.writeText(''); } catch { /* */ }
        fire('screenshot_attempt', 'hard');
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        try { navigator.clipboard.writeText(''); } catch { /* */ }
      }
    };
    const onCtx = (e) => { e.preventDefault(); fire('contextmenu', 'soft'); };
    const onCopy = (e) => { if (blockCopyPaste) { e.preventDefault(); fire('copy', 'soft'); } };
    const onCut = (e) => { if (blockCopyPaste) { e.preventDefault(); fire('cut', 'soft'); } };
    const onPaste = (e) => { if (blockCopyPaste) { e.preventDefault(); fire('paste', 'soft'); } };

    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
    };
  }, [active, blockCopyPaste, fire]);

  /* ---- API ---- */
  const clearWarning = useCallback(() => setWarning(null), []);
  const reset = useCallback(() => {
    violationsRef.current = 0;
    setViolations(0);
    setWarning(null);
    setEvents([]);
    autoSubmittedRef.current = false;
    lastEventAtRef.current = 0;
    activeSinceRef.current = Date.now();
    lastFullscreenAtRef.current = Date.now();
    blurStartRef.current = 0;
    devtoolsOpenRef.current = false;
  }, []);

  const pushEvent = fire;

  return {
    violations,
    violationCount: violations,
    warning,
    events,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    clearWarning,
    reset,
    pushEvent,
    maxViolations: limit,
  };
}

function humanReason(type) {
  switch (type) {
    case 'exit_fullscreen': return 'Bạn đã thoát chế độ toàn màn hình';
    case 'tab_hidden': return 'Bạn đã chuyển sang tab khác';
    case 'window_blur': return 'Cửa sổ làm bài bị mất tiêu điểm';
    case 'long_blur': return 'Bạn đã rời khỏi màn hình thi quá lâu';
    case 'devtools_open': return 'Bạn đã mở công cụ nhà phát triển';
    case 'devtools_shortcut': return 'Không mở công cụ nhà phát triển';
    case 'screenshot_attempt': return 'Không chụp màn hình trong giờ thi';
    case 'contextmenu': return 'Không dùng chuột phải trong giờ thi';
    case 'copy': return 'Không sao chép nội dung trong giờ thi';
    case 'cut': return 'Không cắt nội dung trong giờ thi';
    case 'paste': return 'Không dán nội dung trong giờ thi';
    case 'no_face': return 'Không thấy khuôn mặt của bạn';
    case 'multi_face': return 'Phát hiện nhiều khuôn mặt trong khung hình';
    case 'look_away': return 'Bạn đang nhìn ra ngoài màn hình';
    case 'hand_raise': return 'Phát hiện cử chỉ tay bất thường';
    case 'phone_like': return 'Phát hiện vật thể lạ trước mặt';
    case 'camera_lost': return 'Camera bị ngắt kết nối hoặc chưa được bật';
    default: return 'Phát hiện hành vi bất thường';
  }
}