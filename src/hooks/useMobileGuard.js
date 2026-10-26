/* useMobileGuard.js — chống gian lận bổ sung cho ĐIỆN THOẠI / MÁY TÍNH BẢNG
   Đặt tại: src/hooks/useMobileGuard.js
   --------------------------------------------------------------------------
   Dùng cùng useExamGuard (không thay thế). Mọi sự kiện đi qua pushEvent(type, severity, meta)
   nên tự vào hàng đợi lưu + reportViolation + chụp burst như các vi phạm khác.

   Phát hiện:
   - Xoay màn hình (orientationchange)            → soft
   - Thu nhỏ cửa sổ / Split View / cửa sổ nổi     → hard (viewport nhỏ hẳn so với lúc bắt đầu)
   - Zoom 2 ngón (visualViewport.scale > 1.05)    → soft + tự chặn
   - Chạm ≥ 3 ngón (cử chỉ chuyển app iPad)       → soft
   - Bấm nút Back / vuốt Back                      → soft + giữ học sinh ở lại trang thi
   - Giữ-chạm / bôi đen / copy / kéo thả           → chặn, soft
   - Rời app / khoá màn hình (pagehide, freeze)   → hard
   - (tuỳ chọn) trackHidden: ghi thời gian rời tab nếu useExamGuard CHƯA bắt visibilitychange
   - Giữ màn hình luôn sáng (Wake Lock) để không bị khoá máy giữa bài
   -------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react';

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) || // iPad desktop-mode
    window.matchMedia?.('(pointer: coarse)').matches
  );
};

export default function useMobileGuard({ active, pushEvent, trackHidden = false, lockBack = true }) {
  const pushRef = useRef(pushEvent);
  useEffect(() => { pushRef.current = pushEvent; }, [pushEvent]);

  useEffect(() => {
    if (!active || !isTouchDevice()) return undefined;

    const last = {};
    const fire = (type, severity, meta = {}) => {
      const now = Date.now();
      if (now - (last[type] || 0) < 3000) return; // chống bắn trùng
      last[type] = now;
      try { pushRef.current?.(type, severity, { ...meta, mobile: true }); } catch { /* */ }
    };

    const vv = window.visualViewport;
    const base = {
      w: window.innerWidth,
      h: window.innerHeight,
      portrait: window.innerHeight >= window.innerWidth,
    };

    /* ----- 1. Xoay màn hình ----- */
    const onOrient = () => {
      setTimeout(() => {
        const portrait = window.innerHeight >= window.innerWidth;
        if (portrait !== base.portrait) {
          fire('orientation_change', 'soft', { portrait });
          base.portrait = portrait;
          base.w = window.innerWidth;
          base.h = window.innerHeight;
        }
      }, 350);
    };
    window.addEventListener('orientationchange', onOrient);
    // iOS mới bỏ dần 'orientationchange' → nghe thêm screen.orientation
    try { window.screen?.orientation?.addEventListener?.('change', onOrient); } catch { /* */ }

    /* ----- 2. Split View / cửa sổ nổi / zoom ----- */
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Bàn phím ảo mở (đang gõ vào ô nhập) làm viewport co lại → KHÔNG phải gian lận
      const ae = document.activeElement;
      if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;
      const sameOrient = (h >= w) === base.portrait;
      // Thanh địa chỉ co giãn chỉ đổi chiều cao < ~20%; split view đổi chiều rộng hoặc cao rất nhiều
      if (sameOrient && (w < base.w * 0.8 || h < base.h * 0.6)) {
        fire('window_shrunk', 'hard', { w, h, baseW: base.w, baseH: base.h });
      }
      if (vv && vv.scale > 1.05) {
        fire('pinch_zoom', 'soft', { scale: Number(vv.scale.toFixed(2)) });
      }
    };
    window.addEventListener('resize', onResize);
    vv?.addEventListener('resize', onResize);

    /* ----- 3. Cử chỉ nhiều ngón + chặn zoom ----- */
    const onTouchStart = (e) => {
      if (e.touches.length >= 3) fire('multi_touch', 'soft', { fingers: e.touches.length });
      if (e.touches.length >= 2 && e.cancelable) e.preventDefault(); // chặn pinch
    };
    const onGesture = (e) => { e.preventDefault(); }; // iOS Safari gesturestart/change
    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('gesturestart', onGesture);
    document.addEventListener('gesturechange', onGesture);

    /* ----- 4. Chặn giữ-chạm / chọn chữ / copy / kéo ----- */
    const stopEditable = (e) => !e.target?.closest?.('input, textarea');
    const block = (type) => (e) => {
      if (!stopEditable(e)) return;
      e.preventDefault();
      fire(type, 'soft');
    };
    const onCtx = block('context_menu');
    const onCopy = block('copy_attempt');
    const onSel = (e) => { if (stopEditable(e)) e.preventDefault(); };
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('selectstart', onSel);
    document.addEventListener('dragstart', onSel);

    /* ----- 5. Nút Back / vuốt Back ----- */
    let backGuard = false;
    const onPop = () => {
      fire('back_pressed', 'soft');
      try { window.history.pushState({ exam: 1 }, '', window.location.href); } catch { /* */ }
    };
    if (lockBack) {
      try {
        window.history.pushState({ exam: 1 }, '', window.location.href);
        window.addEventListener('popstate', onPop);
        backGuard = true;
      } catch { /* */ }
    }

    /* ----- 6. Rời app / khoá màn hình ----- */
    const onPageHide = () => fire('page_hide', 'hard', { reason: 'pagehide' });
    const onFreeze = () => fire('page_hide', 'hard', { reason: 'freeze' });
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('freeze', onFreeze);

    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt) {
        const secs = Math.round((Date.now() - hiddenAt) / 1000);
        hiddenAt = 0;
        if (trackHidden) fire('app_switch', 'hard', { awaySeconds: secs });
      }
    };
    document.addEventListener('visibilitychange', onVis);

    /* ----- 7. Giữ màn hình sáng ----- */
    let wake = null;
    let wakeStopped = false;
    const getWake = async () => {
      try {
        if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
        wake = await navigator.wakeLock.request('screen');
        if (wakeStopped) wake.release?.().catch(() => {});
      } catch { /* trình duyệt không hỗ trợ / bị từ chối */ }
    };
    const reWake = () => { if (document.visibilityState === 'visible') getWake(); };
    getWake();
    document.addEventListener('visibilitychange', reWake);

    return () => {
      wakeStopped = true;
      wake?.release?.().catch(() => {});
      window.removeEventListener('orientationchange', onOrient);
      try { window.screen?.orientation?.removeEventListener?.('change', onOrient); } catch { /* */ }
      window.removeEventListener('resize', onResize);
      vv?.removeEventListener('resize', onResize);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('gesturestart', onGesture);
      document.removeEventListener('gesturechange', onGesture);
      document.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('selectstart', onSel);
      document.removeEventListener('dragstart', onSel);
      if (backGuard) window.removeEventListener('popstate', onPop);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('freeze', onFreeze);
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('visibilitychange', reWake);
    };
  }, [active, trackHidden, lockBack]);
}