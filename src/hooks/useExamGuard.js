/* ============================================================
   useExamGuard.js — v4 (sửa lỗi + nâng cấp)
   ------------------------------------------------------------
   Sửa so với v3:
     1. Trả thêm `fsSupported` + `fullscreenLock` (ExamJoin dùng guard.fsSupported
        nhưng hook chỉ trả fullscreenSupported → banner/nút "Vào lại" không bao giờ chạy)
     2. recordEvent ổn định (đọc config qua ref) → không còn hủy timer blur /
        gắn lại listener mỗi lần ExamJoin render
     3. Cảnh báo "soft" KHÔNG còn đè mất overlay đỏ đang đếm ngược;
        vào lại fullscreen KHÔNG còn xoá overlay đỏ (trước đây bỏ qua được countdown)
     4. Thoát fullscreen CHỦ ĐỘNG (nộp bài / bị mời ra) không bị tính vi phạm; thêm stop()
     5. long_blur không còn tính đôi với tab_hidden / window_blur của cùng một lần rời tab
     6. Cửa sổ chờ quyền camera có TRẦN thời gian (trước đây không trả lời hộp thoại = thoát
        được mọi vi phạm vô hạn; Safari/Firefox được miễn 45s)
     7. e.key có thể undefined (autofill) → trước đây ném lỗi; hỗ trợ phím Cmd (Mac)
     8. PrintScreen trên Windows chỉ có keyup → trước đây không bị ghi nhận
     9. Các công tắc blockDevTools / blockPrintScreen / blockLongBlur trong "Chỉnh sửa đề"
        trước đây KHÔNG có tác dụng → nay được nối vào
    10. strictMode + giới hạn = 1 không còn bỏ qua việc tự nộp bài
   Nâng cấp:
     • Giới hạn tần suất sự kiện nhẹ cùng loại (chống spam Ctrl+C làm phình dữ liệu)
     • Leo thang: tích lũy `softToHard` (mặc định 8) vi phạm nhẹ → 1 vi phạm nặng
     • Phát hiện in (beforeprint), chụp màn hình Mac (Cmd+Shift+3/4/5)
     • Đồng hồ / sự kiện lịch sử sự kiện giới hạn 200 bản ghi
   ============================================================ */
import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_LIMIT = 3;
const DEFAULT_SOFT_TO_HARD = 5;
const TOUCH_SOFT_TO_HARD = 3;   // điện thoại/máy tính bảng
const DEDUP_MS = 800;
const BLUR_GRACE_STRICT_MS = 250;
const BLUR_GRACE_NORMAL_MS = 600;
const STARTUP_GRACE_MS = 1500;
const FS_CHECK_INTERVAL_MS = 400;
const FS_REPEAT_STRICT_MS = 8000;
const FS_REPEAT_NORMAL_MS = 12000;
const NO_FS_LIMIT_MS = 3500;
const FS_SETTLE_MS = 1200;
const INTENTIONAL_EXIT_MS = 2000;
const LONG_BLUR_MS = 12000;
const DEVTOOLS_THRESHOLD = 160;
const SOFT_THROTTLE_MS = 2000;
const PASTE_SPIKE_CHARS = 45;
const CAMERA_SETTLE_MS = 5000;
const CAMERA_PENDING_MAX_MS = 20000;   // trần chờ học sinh bấm Cho phép/Chặn
const CAMERA_FALLBACK_GRACE_MS = 12000; // trình duyệt không hỏi được quyền camera
const MAX_EVENTS = 250;

const CAMERA_TYPES = new Set([
  'no_face', 'multi_face', 'look_away', 'hand_raise', 'phone_like', 'phone_detected',
  'camera_lost', 'camera_covered', 'camera_frozen',
]);
const FOCUS_TYPES = new Set(['window_blur', 'tab_hidden', 'long_blur', 'exit_fullscreen']);

/* Thiết bị KHÔNG có Fullscreen API (iPhone Safari): dùng các dấu hiệu này
   thay cho "thoát toàn màn hình" và tính là vi phạm NẶNG.
   window_blur bị loại vì trên mobile nó bắn cả khi hộp thoại quyền hiện ra. */
const FALLBACK_HARD_TYPES = new Set(['tab_hidden', 'page_hide', 'orientation_change', 'long_blur']);

export const supportsFullscreen = () => {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen);
};

const isTouch = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches;

export function useExamGuard({ active, onAutoSubmit, config, onEvent }) {
  const limit = config?.tabSwitchLimit ?? DEFAULT_LIMIT;
  const fsOk = supportsFullscreen();
  const fullscreenLock = (config?.fullscreenLock ?? true) && fsOk;
  /* Bật giám sát nhưng thiết bị không hỗ trợ fullscreen (iPhone) → chế độ thay thế */
  const noFsFallback = (config?.fullscreenLock ?? true) && !fsOk;
  const blockCopyPaste = config?.blockCopyPaste ?? true;
  const strictMode = config?.strictMode ?? false;
  const lockdown = config?.lockdown ?? false;
  const blockDevTools = config?.blockDevTools ?? true;
  const blockPrintScreen = config?.blockPrintScreen ?? true;
  const blockLongBlur = config?.blockLongBlur ?? true;
  const blockMultiScreen = config?.blockMultiScreen ?? true;
  /* Máy cảm ứng: 3 vi phạm nhẹ là tính 1 nặng */
  const softToHard = config?.softToHard ?? (isTouch() ? TOUCH_SOFT_TO_HARD : DEFAULT_SOFT_TO_HARD);

  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowFocused, setWindowFocused] = useState(() => (
    typeof document !== 'undefined' ? (!document.hidden && (document.hasFocus?.() ?? true)) : true
  ));
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);
  const [multiScreen, setMultiScreen] = useState(false);
  const [events, setEvents] = useState([]);

  const cfgRef = useRef({});
  cfgRef.current = {
    limit,
    strictMode,
    lockdown,
    softToHard,
    camera: config?.camera ?? 'off',
    noFsFallback,
    fsRepeatMs: (strictMode || lockdown) ? FS_REPEAT_STRICT_MS : FS_REPEAT_NORMAL_MS,
    blurGraceMs: (strictMode || lockdown) ? BLUR_GRACE_STRICT_MS : BLUR_GRACE_NORMAL_MS,
  };

  const activeRef = useRef(active);
  const onEventRef = useRef(onEvent);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const lastEventAtRef = useRef(0);
  const lastSoftAtRef = useRef({});
  const softCountRef = useRef(0);
  const blurTimerRef = useRef(null);
  const autoSubmittedRef = useRef(false);
  const violationsRef = useRef(0);
  const activeSinceRef = useRef(0);
  const lastHiddenAtRef = useRef(0);
  const lastFullscreenAtRef = useRef(0);
  const fsRecordedAtRef = useRef(0);
  const fsSettleUntilRef = useRef(0);
  const intentionalExitRef = useRef(0);
  const blurStartRef = useRef(0);
  const absenceRecordedRef = useRef(false);
  const printAtRef = useRef(0);
  const devtoolsOpenRef = useRef(false);
  const devtoolsStreakRef = useRef(0);
  const cameraPendingRef = useRef(false);
  const cameraPendingSinceRef = useRef(0);
  const cameraSettleUntilRef = useRef(0);
  const cameraFallbackRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
    if (active) {
      activeSinceRef.current = Date.now();
      lastFullscreenAtRef.current = Date.now();
      autoSubmittedRef.current = false;
    }
  }, [active]);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onAutoSubmitRef.current = onAutoSubmit; }, [onAutoSubmit]);

  /* ---- Theo dõi quyền camera: 'prompt' = đang hỏi → hoãn phát hiện (CÓ TRẦN thời gian) ---- */
  useEffect(() => {
    const wantCamera = (config?.camera ?? 'off') !== 'off';
    if (!active || !wantCamera) { cameraPendingRef.current = false; return undefined; }
    let alive = true;
    let status = null;
    const apply = () => {
      if (!alive || !status) return;
      if (status.state === 'prompt') {
        if (!cameraPendingRef.current) cameraPendingSinceRef.current = Date.now();
        cameraPendingRef.current = true;
      } else {
        if (cameraPendingRef.current) {
          cameraSettleUntilRef.current = Date.now() + CAMERA_SETTLE_MS;
          lastFullscreenAtRef.current = Date.now() + CAMERA_SETTLE_MS;
        }
        cameraPendingRef.current = false;
      }
    };
    const fallback = () => {
      cameraFallbackRef.current = true;
      cameraSettleUntilRef.current = Date.now() + CAMERA_FALLBACK_GRACE_MS;
    };
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'camera' })
        .then((st) => { status = st; st.onchange = apply; apply(); })
        .catch(fallback);
    } else {
      fallback();
    }
    return () => { alive = false; if (status) status.onchange = null; };
  }, [active, config?.camera]);

  /* Camera đã chạy ổn → rút ngắn thời gian miễn trừ của chế độ dự phòng */
  useEffect(() => {
    if (config?.cameraReady === true && cameraFallbackRef.current) {
      cameraFallbackRef.current = false;
      cameraSettleUntilRef.current = Date.now() + CAMERA_SETTLE_MS;
    }
  }, [config?.cameraReady]);

  /* ---- Cảnh báo: soft KHÔNG được đè overlay đỏ ---- */
  const pushWarning = useCallback((w) => {
    setWarning((prev) => (w.type === 'warn-soft' && prev && prev.type !== 'warn-soft' ? prev : w));
  }, []);

  /* ---- Ghi 1 vi phạm NẶNG ---- */
  const registerHard = useCallback((type) => {
    const cfg = cfgRef.current;
    const next = violationsRef.current + 1;
    violationsRef.current = next;
    setViolations(next);

    if (next >= cfg.limit) {
      if (autoSubmittedRef.current) return;
      autoSubmittedRef.current = true;
      setWarning({
        type: 'auto-submit',
        text: `Bạn đã vi phạm ${cfg.limit} lần. Bài sẽ tự động nộp.`,
        eventType: type, count: next, limit: cfg.limit,
      });
      onAutoSubmitRef.current?.(next);
      return;
    }
    if (cfg.strictMode && next === 1) {
      pushWarning({
        type: 'violation-strict',
        text: `⚠ NGHIÊM TRỌNG: ${humanReason(type)}. Còn ${Math.max(0, cfg.limit - next)} lần vi phạm nữa sẽ tự động nộp bài!`,
        eventType: type, count: next, limit: cfg.limit,
      });
      return;
    }
    pushWarning({ type: 'violation', text: humanReason(type), eventType: type, count: next, limit: cfg.limit });
  }, [pushWarning]);

  /* ---- Record event ---- */
  const recordEvent = useCallback((type, severity, meta = {}) => {
    if (!activeRef.current || autoSubmittedRef.current) return;
    const cfg = cfgRef.current;
    const now = Date.now();

    // Thoát fullscreen do chính app yêu cầu (nộp bài / bị mời ra) → không phải gian lận
    if (type === 'exit_fullscreen' && now - intentionalExitRef.current < INTENTIONAL_EXIT_MS) return;

    // Đang chờ quyền camera / vừa vào fullscreen: cửa sổ mất tiêu điểm tạm thời — KHÔNG phải gian lận.
    const camWait =
      (cameraPendingRef.current && now - cameraPendingSinceRef.current < CAMERA_PENDING_MAX_MS) ||
      now < cameraSettleUntilRef.current;
    if (camWait && (CAMERA_TYPES.has(type) || FOCUS_TYPES.has(type))) return;
    if (now < fsSettleUntilRef.current && (type === 'window_blur' || type === 'long_blur')) return;

    const inGrace = now - activeSinceRef.current < STARTUP_GRACE_MS;

    /* Không có fullscreen (iPhone) → nâng các dấu hiệu rời màn hình lên mức nặng,
       nếu không trên iPhone sẽ gần như không phát hiện được gì. */
    const sev = (cfg.noFsFallback && FALLBACK_HARD_TYPES.has(type)) ? 'hard' : severity;

    if (sev === 'hard') {
      if (now - lastEventAtRef.current < DEDUP_MS) return;
      if (!inGrace) lastEventAtRef.current = now;
    } else {
      // Chống spam: cùng loại sự kiện nhẹ chỉ ghi 1 lần / 2 giây
      if (now - (lastSoftAtRef.current[type] || 0) < SOFT_THROTTLE_MS) return;
      lastSoftAtRef.current[type] = now;
    }

    const evt = {
      type,
      at: now,
      severity: inGrace ? 'soft' : sev,
      meta: { ...(meta || {}), inGrace, strict: cfg.strictMode },
    };
    setEvents((arr) => [...arr.slice(-(MAX_EVENTS - 1)), evt]);
    onEventRef.current?.(evt);

    if (inGrace) return;

    if (sev === 'hard') {
      registerHard(type);
      return;
    }

    pushWarning({ type: 'warn-soft', text: humanReason(type), eventType: type });

    // Leo thang: nhiều vi phạm nhẹ (không tính camera — dễ nhận nhầm) → 1 vi phạm nặng
    if (!CAMERA_TYPES.has(type) && cfg.softToHard > 0) {
      softCountRef.current += 1;
      if (softCountRef.current >= cfg.softToHard) {
        const n = softCountRef.current;
        softCountRef.current = 0;
        onEventRef.current?.({
          type: 'soft_escalation', at: Date.now(), severity: 'hard',
          meta: { softCount: n, inGrace: false, strict: cfg.strictMode },
        });
        registerHard('soft_escalation');
      }
    }
  }, [registerHard, pushWarning]);

  /* ---- Fullscreen helpers ---- */
  const checkIsFullscreen = useCallback(() => !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ), []);

  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();

      setIsFullscreen(true);
      lastFullscreenAtRef.current = Date.now();
      fsSettleUntilRef.current = Date.now() + FS_SETTLE_MS;
      fsRecordedAtRef.current = 0;
      // Chỉ xoá cảnh báo nhẹ — KHÔNG xoá overlay đỏ đang đếm ngược
      setWarning((prev) => (prev && prev.type === 'warn-soft' ? null : prev));
      return true;
    } catch (e) {
      console.warn('[guard] Không vào được fullscreen:', e?.message);
      pushWarning({ type: 'warn-soft', text: 'Không vào được chế độ toàn màn hình. Nhấn F11 hoặc nút bên dưới.' });
      return false;
    }
  }, [pushWarning]);

  const exitFullscreen = useCallback(() => {
    intentionalExitRef.current = Date.now();
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch { /* */ }
    setIsFullscreen(false);
  }, []);

  /* Dừng ghi nhận mọi vi phạm (đã nộp bài / bị mời ra) */
  const stop = useCallback(() => {
    autoSubmittedRef.current = true;
    intentionalExitRef.current = Date.now();
    clearTimeout(blurTimerRef.current);
  }, []);

  /* ---- Fullscreen event listeners ---- */
  useEffect(() => {
    if (!active) return undefined;
    const onFsChange = () => {
      const fs = checkIsFullscreen();
      setIsFullscreen(fs);
      if (fs) {
        lastFullscreenAtRef.current = Date.now();
        fsRecordedAtRef.current = 0;
      } else if (activeRef.current && fullscreenLock) {
        if (Date.now() - intentionalExitRef.current < INTENTIONAL_EXIT_MS) return;
        fsRecordedAtRef.current = Date.now();
        recordEvent('exit_fullscreen', 'hard', { source: 'event' });
      }
    };
    const names = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    names.forEach((n) => document.addEventListener(n, onFsChange));
    return () => names.forEach((n) => document.removeEventListener(n, onFsChange));
  }, [active, fullscreenLock, recordEvent, checkIsFullscreen]);

  /* ---- Interval: ở phòng thi mà không fullscreen quá 5s → vi phạm ---- */
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
        const noFsDuration = Date.now() - lastFullscreenAtRef.current;
        if (noFsDuration > NO_FS_LIMIT_MS && Date.now() - fsRecordedAtRef.current > cfgRef.current.fsRepeatMs) {
          fsRecordedAtRef.current = Date.now();
          recordEvent('exit_fullscreen', 'hard', { source: 'interval', duration: Math.round(noFsDuration / 1000) });
        }
      }
    }, FS_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, fullscreenLock, recordEvent, checkIsFullscreen]);

  /* ---- Escape / F11 ---- */
  useEffect(() => {
    if (!active || !fullscreenLock) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'F11') {
        setTimeout(() => {
          if (!checkIsFullscreen() && activeRef.current && Date.now() - fsRecordedAtRef.current > cfgRef.current.fsRepeatMs) {
            fsRecordedAtRef.current = Date.now();
            recordEvent('exit_fullscreen', 'hard', { source: 'key', key: e.key });
          }
        }, 250);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [active, fullscreenLock, recordEvent, checkIsFullscreen]);

  /* ---- Rời tab / mất tiêu điểm + cập nhật ngay cờ làm mờ đề ---- */
  useEffect(() => {
    if (!active) {
      setWindowFocused(true);
      return undefined;
    }

    const syncFocusState = () => {
      const camPrompting = cameraPendingRef.current && (Date.now() - cameraPendingSinceRef.current < CAMERA_PENDING_MAX_MS);
      const focusedNow = !document.hidden && (document.hasFocus?.() ?? true);
      setWindowFocused(focusedNow || camPrompting);
    };
    syncFocusState();

    const beginAbsence = () => { if (!blurStartRef.current) blurStartRef.current = Date.now(); };
    const endAbsence = () => {
      clearTimeout(blurTimerRef.current);
      const started = blurStartRef.current;
      blurStartRef.current = 0;
      const duration = started ? Date.now() - started : 0;
      if (duration > LONG_BLUR_MS && activeRef.current && blockLongBlur) {
        recordEvent('long_blur', absenceRecordedRef.current ? 'soft' : 'hard', { duration: Math.round(duration / 1000) });
      }
      absenceRecordedRef.current = false;
      syncFocusState();
    };

    const onVis = () => {
      if (document.hidden) {
        setWindowFocused(false);
        beginAbsence();
        if (!activeRef.current) return;
        lastHiddenAtRef.current = Date.now();
        absenceRecordedRef.current = true;
        recordEvent('tab_hidden', 'hard');
      } else {
        endAbsence();
      }
    };
    const onBlur = () => {
      syncFocusState();
      beginAbsence();
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => {
        if (!activeRef.current) return;
        if (document.hasFocus()) return;
        if (document.hidden || Date.now() - lastHiddenAtRef.current < 8000) return;
        absenceRecordedRef.current = true;
        recordEvent('window_blur', 'hard');
      }, cfgRef.current.blurGraceMs);
    };
    const onFocus = () => endAbsence();

    const onPageHide = () => {
      setWindowFocused(false);
      if (!activeRef.current) return;
      recordEvent('page_hide', 'hard');
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      clearTimeout(blurTimerRef.current);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [active, blockLongBlur, recordEvent]);

  /* ---- DevTools detection (docked dimension delta + console getter cho chế độ nghiêm ngặt) ---- */
  useEffect(() => {
    if (!active || !blockDevTools || isTouch()) {
      setDevtoolsOpen(false);
      return undefined;
    }
    const checkConsoleProbe = () => {
      try {
        let tripped = false;
        const probe = new Image();
        Object.defineProperty(probe, 'id', {
          get() {
            tripped = true;
            return 'ep';
          },
        });
        // eslint-disable-next-line no-console
        console.debug?.('%c', probe);
        return tripped;
      } catch {
        return false;
      }
    };
    const id = setInterval(() => {
      if (!activeRef.current) return;
      const bySize =
        window.outerWidth - window.innerWidth > DEVTOOLS_THRESHOLD ||
        window.outerHeight - window.innerHeight > DEVTOOLS_THRESHOLD;
      const byConsole = (cfgRef.current.strictMode || cfgRef.current.lockdown) && checkConsoleProbe();
      const isOpen = bySize || byConsole;
      if (isOpen) {
        devtoolsStreakRef.current += 1;
        if (devtoolsStreakRef.current >= 2 && !devtoolsOpenRef.current) {
          devtoolsOpenRef.current = true;
          setDevtoolsOpen(true);
          const sev = (cfgRef.current.strictMode || cfgRef.current.lockdown) ? 'hard' : 'soft';
          recordEvent('devtools_open', sev, { bySize, byConsole });
        }
      } else {
        devtoolsStreakRef.current = 0;
        if (devtoolsOpenRef.current) {
          devtoolsOpenRef.current = false;
          setDevtoolsOpen(false);
        }
      }
    }, 1500);
    return () => clearInterval(id);
  }, [active, blockDevTools, recordEvent]);

  /* ---- Phát hiện chia đôi màn hình (Desktop) & đa màn hình mở rộng ---- */
  useEffect(() => {
    if (!active) {
      setMultiScreen(false);
      return undefined;
    }

    let lastShrinkAt = 0;
    let lastMultiAt = 0;

    const checkScreen = () => {
      if (!activeRef.current) return;
      if (blockMultiScreen && window.screen?.isExtended === true) {
        setMultiScreen(true);
        const now = Date.now();
        if (now - lastMultiAt > 15000) {
          lastMultiAt = now;
          recordEvent('multi_screen', (cfgRef.current.strictMode || cfgRef.current.lockdown) ? 'hard' : 'soft');
        }
      } else {
        setMultiScreen(false);
      }

      if (!isTouch() && (fullscreenLock || cfgRef.current.lockdown || cfgRef.current.strictMode)) {
        const sw = window.screen?.availWidth || window.innerWidth;
        const sh = window.screen?.availHeight || window.innerHeight;
        if (sw >= 900 && sh >= 600) {
          const wRatio = window.innerWidth / sw;
          const hRatio = window.innerHeight / sh;
          if ((wRatio < 0.65 || hRatio < 0.65) && !checkIsFullscreen()) {
            const now = Date.now();
            if (now - activeSinceRef.current > 2500 && now - lastShrinkAt > 10000) {
              lastShrinkAt = now;
              recordEvent('window_shrunk', (cfgRef.current.strictMode || cfgRef.current.lockdown) ? 'hard' : 'soft', {
                wRatio: Number(wRatio.toFixed(2)),
                hRatio: Number(hRatio.toFixed(2)),
              });
            }
          }
        }
      }
    };

    const t0 = setTimeout(checkScreen, 1200);
    const id = setInterval(checkScreen, 2500);
    window.addEventListener('resize', checkScreen);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
      window.removeEventListener('resize', checkScreen);
    };
  }, [active, blockMultiScreen, fullscreenLock, recordEvent, checkIsFullscreen]);

  /* ---- Phím tắt / sao chép / kéo-thả / dán bất thường / in ---- */
  useEffect(() => {
    if (!active) return undefined;
    const isEditableTarget = (el) => {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };
    const clearClip = () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: 'clipboard-write' }).then((perm) => {
            if (perm.state === 'granted') {
              navigator.clipboard?.writeText?.('').catch(() => {});
            }
          }).catch(() => {});
        }
      } catch { /* */ }
    };

    const onKey = (e) => {
      const key = String(e.key || '');
      const code = String(e.code || '');
      const letter = code.startsWith('Key') ? code.slice(3).toLowerCase() : key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      if (blockDevTools) {
        const block =
          key === 'F12' ||
          (mod && e.shiftKey && ['i', 'j', 'c', 'k'].includes(letter)) ||
          (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(letter)) ||
          (mod && ['u', 'p', 's'].includes(letter));
        if (block) {
          e.preventDefault();
          e.stopPropagation();
          recordEvent('devtools_shortcut', 'soft');
        }
      }
      if (blockCopyPaste) {
        if ((mod && (letter === 'f' || letter === 'g')) || key === 'F3') {
          e.preventDefault();
          recordEvent('copy_attempt', 'soft', { key: 'find' });
        } else if (mod && letter === 'a' && !isEditableTarget(e.target)) {
          e.preventDefault();
          recordEvent('copy_attempt', 'soft', { key: 'select_all' });
        }
      }
      if (blockPrintScreen) {
        if (key === 'PrintScreen') {
          e.preventDefault();
          clearClip();
          printAtRef.current = Date.now();
          recordEvent('screenshot_attempt', 'hard');
        } else if (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(letter || key.toLowerCase())) {
          printAtRef.current = Date.now();
          recordEvent('screenshot_attempt', 'hard', { combo: 'meta-shift' });
        }
      }
    };
    const onKeyUp = (e) => {
      if (!blockPrintScreen || e.key !== 'PrintScreen') return;
      clearClip();
      if (Date.now() - printAtRef.current > 1500) {
        printAtRef.current = Date.now();
        recordEvent('screenshot_attempt', 'hard');
      }
    };
    const onCtx = (e) => { e.preventDefault(); recordEvent('contextmenu', 'soft'); };
    const onCopy = (e) => { if (blockCopyPaste) { e.preventDefault(); recordEvent('copy', 'soft'); } };
    const onCut = (e) => { if (blockCopyPaste) { e.preventDefault(); recordEvent('cut', 'soft'); } };
    const onPaste = (e) => {
      if (!blockCopyPaste) return;
      const text = e.clipboardData?.getData?.('text') || '';
      e.preventDefault();
      if (text.length >= PASTE_SPIKE_CHARS) {
        recordEvent('paste_spike', (cfgRef.current.strictMode || cfgRef.current.lockdown) ? 'hard' : 'soft', {
          chars: text.length,
        });
      } else {
        recordEvent('paste', 'soft');
      }
    };
    const onSelectStart = (e) => {
      if (blockCopyPaste && !isEditableTarget(e.target)) e.preventDefault();
    };
    const onDragStart = (e) => {
      if (blockCopyPaste) {
        e.preventDefault();
        recordEvent('copy_attempt', 'soft', { source: 'drag' });
      }
    };
    const onInput = (e) => {
      if (!blockCopyPaste) return;
      const dataLen = typeof e.data === 'string' ? e.data.length : 0;
      if (e.inputType === 'insertFromPaste' || dataLen >= PASTE_SPIKE_CHARS) {
        recordEvent('paste_spike', (cfgRef.current.strictMode || cfgRef.current.lockdown) ? 'hard' : 'soft', {
          chars: dataLen,
        });
      }
    };
    const onPrint = () => { if (blockPrintScreen) recordEvent('print_attempt', 'hard'); };

    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    document.addEventListener('selectstart', onSelectStart);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('input', onInput, true);
    window.addEventListener('beforeprint', onPrint);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('input', onInput, true);
      window.removeEventListener('beforeprint', onPrint);
    };
  }, [active, blockCopyPaste, blockDevTools, blockPrintScreen, recordEvent]);

  /* ---- API ---- */
  const clearWarning = useCallback(() => setWarning(null), []);
  const reset = useCallback(() => {
    violationsRef.current = 0;
    softCountRef.current = 0;
    lastSoftAtRef.current = {};
    setViolations(0);
    setWarning(null);
    setEvents([]);
    autoSubmittedRef.current = false;
    lastEventAtRef.current = 0;
    activeSinceRef.current = Date.now();
    lastFullscreenAtRef.current = Date.now();
    blurStartRef.current = 0;
    absenceRecordedRef.current = false;
    devtoolsOpenRef.current = false;
    devtoolsStreakRef.current = 0;
    fsRecordedAtRef.current = 0;
    setDevtoolsOpen(false);
    setMultiScreen(false);
    setWindowFocused(true);
  }, []);

  /** Khôi phục số vi phạm đã ghi từ Firestore (chống F5 reset về 0) */
  const hydrateState = useCallback((count = 0, priorEvents = []) => {
    const safeCount = Math.max(violationsRef.current, Number(count) || 0);
    violationsRef.current = safeCount;
    setViolations(safeCount);
    if (Array.isArray(priorEvents) && priorEvents.length > 0) {
      setEvents((prev) => (prev.length >= priorEvents.length ? prev : priorEvents.slice(-MAX_EVENTS)));
    }
    const cfg = cfgRef.current;
    if (cfg.limit > 0 && safeCount >= cfg.limit && activeRef.current && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      setWarning({
        type: 'auto-submit',
        text: `Bạn đã tích luỹ ${safeCount}/${cfg.limit} vi phạm. Bài sẽ tự động nộp.`,
        eventType: 'soft_escalation',
        count: safeCount,
        limit: cfg.limit,
      });
      onAutoSubmitRef.current?.(safeCount);
    }
  }, []);

  const pushEvent = useCallback((type, severity, meta) => {
    recordEvent(type, severity, meta);
  }, [recordEvent]);

  return {
    violations,
    violationCount: violations,
    warning,
    events,
    isFullscreen,
    windowFocused,
    devtoolsOpen,
    multiScreen,
    fullscreenSupported: fsOk,
    fsSupported: fsOk,
    fullscreenLock,
    /* true = thiết bị không hỗ trợ fullscreen, đang giám sát bằng chế độ thay thế */
    noFullscreenFallback: noFsFallback,
    softToHard,
    touchDevice: isTouch(),
    humanReason,
    enterFullscreen,
    exitFullscreen,
    stop,
    clearWarning,
    reset,
    hydrateState,
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
    case 'devtools_open': return 'Phát hiện mở công cụ nhà phát triển (DevTools)';
    case 'devtools_shortcut': return 'Không mở công cụ nhà phát triển';
    case 'screenshot_attempt': return 'Không chụp màn hình trong giờ thi';
    case 'print_attempt': return 'Không in bài trong giờ thi';
    case 'contextmenu': return 'Không dùng chuột phải trong giờ thi';
    case 'copy': return 'Không sao chép nội dung trong giờ thi';
    case 'cut': return 'Không cắt nội dung trong giờ thi';
    case 'paste': return 'Không dán nội dung trong giờ thi';
    case 'paste_spike': return 'Phát hiện thao tác dán lượng văn bản bất thường';
    case 'no_face': return 'Không thấy khuôn mặt của bạn';
    case 'multi_face': return 'Phát hiện nhiều khuôn mặt trong khung hình';
    case 'look_away': return 'Bạn đang nhìn ra ngoài màn hình';
    case 'hand_raise': return 'Phát hiện cử chỉ tay bất thường';
    case 'phone_like': return 'Phát hiện vật thể lạ trước mặt';
    case 'phone_detected': return 'Phát hiện điện thoại trong khung hình camera';
    case 'camera_lost': return 'Camera bị ngắt kết nối hoặc chưa được bật';
    case 'camera_covered': return 'Ống kính camera đang bị che hoặc tối bất thường';
    case 'camera_frozen': return 'Hình ảnh camera bị đứng hình hoặc dùng nguồn tĩnh giả lập';
    case 'voice_detected': return 'Phát hiện tiếng nói / âm thanh trao đổi bất thường';
    case 'multi_device': return 'Phát hiện đăng nhập hoặc mở đề thi trên nhiều tab/thiết bị';
    case 'multi_screen': return 'Phát hiện đang kết nối nhiều màn hình mở rộng';
    case 'device_lifted': return 'Phát hiện bạn nhấc / lắc thiết bị';
    case 'window_shrunk': return 'Cửa sổ làm bài bị thu nhỏ hoặc chia đôi màn hình';
    case 'orientation_change': return 'Bạn đã xoay màn hình';
    case 'pinch_zoom': return 'Không phóng to / thu nhỏ màn hình trong giờ thi';
    case 'multi_touch': return 'Không dùng cử chỉ nhiều ngón tay trong giờ thi';
    case 'back_pressed': return 'Không bấm nút Quay lại trong giờ thi';
    case 'page_hide': return 'Bạn đã rời khỏi ứng dụng / khoá màn hình';
    case 'app_switch': return 'Bạn đã chuyển sang ứng dụng khác';
    case 'context_menu': return 'Không giữ-chạm để mở menu trong giờ thi';
    case 'copy_attempt': return 'Không chọn, kéo hoặc sao chép nội dung trong giờ thi';
    case 'soft_escalation': return 'Bạn đã có quá nhiều hành vi bất thường liên tiếp';
    case 'force_submit': return 'Giáo viên đã kích hoạt thu bài ngay';
    default: return 'Phát hiện hành vi bất thường';
  }
}