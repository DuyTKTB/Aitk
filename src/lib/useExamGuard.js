/* ============================================================
   useExamGuard.js — v3 STRICT + FORCE FULLSCREEN
   ------------------------------------------------------------
   Sửa v3:
     1. Bắt thoát fullscreen KỂ CẢ khi chưa vào (nếu stage exam > 5s)
     2. Interval check fullscreen mỗi 500ms
     3. Auto-enter fullscreen khi mất focus (nếu bật)
     4. Phát hiện DevTools
     5. Đếm blur liên tục
   ============================================================ */
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_LIMIT = 3;
const DEDUP_MS = 800;
const BLUR_GRACE_MS = 800;
const STARTUP_GRACE_MS = 3000;
const FS_CHECK_INTERVAL_MS = 500;      // check fullscreen mỗi 500ms
const FS_REPEAT_MS = 20000;            // tối thiểu giữa 2 lần ghi vi phạm fullscreen
const NO_FS_LIMIT_MS = 5000;           // ở exam mà không fullscreen > 5s → vi phạm
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
  const onEventRef = useRef(onEvent);
  const lastEventAtRef = useRef(0);
  const blurTimerRef = useRef(null);
  const autoSubmittedRef = useRef(false);
  const violationsRef = useRef(0);
  const activeSinceRef = useRef(0);
  const lastHiddenAtRef = useRef(0);
  const lastFullscreenAtRef = useRef(0);
  const blurStartRef = useRef(0);
  const devtoolsOpenRef = useRef(false);
  const fsRecordedAtRef = useRef(0); // lần ghi vi phạm fullscreen gần nhất (0 = đang ổn)

  useEffect(() => {
    activeRef.current = active;
    if (active) {
      activeSinceRef.current = Date.now();
      lastFullscreenAtRef.current = Date.now();
      autoSubmittedRef.current = false;
    }
  }, [active]);
  useEffect(() => { limitRef.current = limit; }, [limit]);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  const inStartupGrace = () => Date.now() - activeSinceRef.current < STARTUP_GRACE_MS;

  /* ---- Record event ---- */
  const recordEvent = useCallback((type, severity, meta = {}) => {
    if (!activeRef.current) return;
    if (autoSubmittedRef.current) return;

    const inGrace = inStartupGrace();
    const now = Date.now();

    if (now - lastEventAtRef.current < DEDUP_MS && severity === 'hard') return;
    if (severity === 'hard' && !inGrace) lastEventAtRef.current = now;

    const evt = {
      type,
      at: now,
      severity: inGrace ? 'soft' : severity,
      meta: { ...(meta || {}), inGrace, strict: strictMode },
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

      if (strictMode && next === 1) {
        setWarning({
          type: 'violation-strict',
          text: `⚠ NGHIÊM TRỌNG: ${humanReason(type)}. Còn ${Math.max(0, limitRef.current - next)} lần vi phạm nữa sẽ tự động nộp bài!`,
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
          onAutoSubmit?.(next);
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
      setWarning({
        type: 'warn-soft',
        text: humanReason(type),
        eventType: type,
      });
    }
  }, [onAutoSubmit, strictMode]);

  /* ---- Fullscreen helpers ---- */
  const checkIsFullscreen = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();

      setIsFullscreen(true);
      lastFullscreenAtRef.current = Date.now();
      fsRecordedAtRef.current = 0;
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

  /* ---- Fullscreen event listeners ---- */
  useEffect(() => {
    if (!active) return undefined;
    const onFsChange = () => {
      const fs = checkIsFullscreen();
      console.log('[guard] fullscreenchange →', fs);
      setIsFullscreen(fs);
      if (fs) {
        lastFullscreenAtRef.current = Date.now();
        fsRecordedAtRef.current = 0;
      } else if (activeRef.current && fullscreenLock) {
        fsRecordedAtRef.current = Date.now();
        recordEvent('exit_fullscreen', 'hard', { source: 'event' });
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    document.addEventListener('MSFullscreenChange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
      document.removeEventListener('MSFullscreenChange', onFsChange);
    };
  }, [active, fullscreenLock, recordEvent, checkIsFullscreen]);

  /* ---- Interval check: nếu ở exam mà không fullscreen quá 5s → vi phạm ---- */
  useEffect(() => {
    if (!active || !fullscreenLock) return undefined;
    const id = setInterval(() => {
      if (!activeRef.current) return;
      const fs = checkIsFullscreen();
      setIsFullscreen(fs);
      if (fs) {
        lastFullscreenAtRef.current = Date.now();
        fsRecordedAtRef.current = 0;
      } else {
        // Không fullscreen > NO_FS_LIMIT_MS và đã quá FS_REPEAT_MS kể từ lần ghi trước → vi phạm
        // (tránh ghi liên tục mỗi giây trong lúc overlay đang bắt chờ)
        const noFsDuration = Date.now() - lastFullscreenAtRef.current;
        if (noFsDuration > NO_FS_LIMIT_MS && Date.now() - fsRecordedAtRef.current > FS_REPEAT_MS) {
          fsRecordedAtRef.current = Date.now();
          recordEvent('exit_fullscreen', 'hard', {
            source: 'interval',
            duration: Math.round(noFsDuration / 1000),
          });
        }
      }
    }, FS_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, fullscreenLock, recordEvent, checkIsFullscreen]);

  /* ---- Keydown Escape/F11 ---- */
  useEffect(() => {
    if (!active || !fullscreenLock) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'F11') {
        console.log('[guard] Bấm', e.key);
        setTimeout(() => {
          const fs = checkIsFullscreen();
          if (!fs && activeRef.current && Date.now() - fsRecordedAtRef.current > FS_REPEAT_MS) {
            fsRecordedAtRef.current = Date.now();
            recordEvent('exit_fullscreen', 'hard', { source: 'key', key: e.key });
          }
        }, 250);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [active, fullscreenLock, recordEvent, checkIsFullscreen]);

  /* ---- Tab visibility ---- */
  useEffect(() => {
    if (!active) return undefined;
    const onVis = () => {
      if (document.hidden && activeRef.current) {
        lastHiddenAtRef.current = Date.now();
        recordEvent('tab_hidden', 'hard');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [active, recordEvent]);

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
        recordEvent('window_blur', 'hard');
      }, BLUR_GRACE_MS);
    };
    const onFocus = () => {
      clearTimeout(blurTimerRef.current);
      const duration = blurStartRef.current ? Date.now() - blurStartRef.current : 0;
      if (duration > LONG_BLUR_MS && activeRef.current) {
        recordEvent('long_blur', 'hard', { duration: Math.round(duration / 1000) });
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
  }, [active, recordEvent]);

  /* ---- DevTools detection ---- */
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      if (!activeRef.current) return;
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      const isOpen = wDiff > DEVTOOLS_THRESHOLD || hDiff > DEVTOOLS_THRESHOLD;
      if (isOpen && !devtoolsOpenRef.current) {
        devtoolsOpenRef.current = true;
        recordEvent('devtools_open', 'hard');
      } else if (!isOpen) {
        devtoolsOpenRef.current = false;
      }
    }, 1500);
    return () => clearInterval(id);
  }, [active, recordEvent]);

  /* ---- Keyboard shortcuts ---- */
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
        recordEvent('devtools_shortcut', 'soft');
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        try { navigator.clipboard.writeText(''); } catch { /* */ }
        recordEvent('screenshot_attempt', 'hard');
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        try { navigator.clipboard.writeText(''); } catch { /* */ }
      }
    };
    const onCtx = (e) => { e.preventDefault(); recordEvent('contextmenu', 'soft'); };
    const onCopy = (e) => { if (blockCopyPaste) { e.preventDefault(); recordEvent('copy', 'soft'); } };
    const onCut = (e) => { if (blockCopyPaste) { e.preventDefault(); recordEvent('cut', 'soft'); } };
    const onPaste = (e) => { if (blockCopyPaste) { e.preventDefault(); recordEvent('paste', 'soft'); } };

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
  }, [active, blockCopyPaste, recordEvent]);

  /* ---- API ---- */
  const clearWarning = () => setWarning(null);
  const reset = () => {
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
    fsRecordedAtRef.current = 0;
  };

  const pushEvent = useCallback((type, severity, meta) => {
    recordEvent(type, severity, meta);
  }, [recordEvent]);

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