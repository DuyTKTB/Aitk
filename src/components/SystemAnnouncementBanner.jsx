/* ============================================================
   SystemAnnouncementBanner.jsx — Poster Popup Bo Tròn, Banner & Floating Card
   ------------------------------------------------------------
   • 4 chế độ hiển thị:
     - `poster`  : Popup Poster ảnh full màn giữa bo tròn 28px trên nền mờ kính (kiểu sự kiện/kỳ thi)
     - `banner`  : Dải băng cố định trên cùng (tự đẩy Navbar .dn / .lp-nav / .mhead-bar xuống)
     - `modal`   : Dải băng + Hộp thoại Spotlight Popup kèm tiêu đề & nút bấm
     - `floating`: Thẻ Banner nổi góc dưới trái (không vướng Pet/Chat góc phải)
   • Hỗ trợ `previewOverride` để Admin bấm xem thử trực tiếp trên màn hình thật.
   ============================================================ */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { isAdmin } from '../lib/isAdmin.js';
import { getUserRole } from '../lib/userRole.js';
import { resolveEntitlements } from '../lib/entitlements.js';
import {
  resolveAnnouncementTheme,
  evaluateAnnouncementVisibility,
  formatCountdownLabel,
  getAnnouncementDismissKey,
  sanitizeAnnouncementImage,
} from '../lib/announcementEngine.js';
import './system-announcement-banner.css';

const DISMISS_STORE_KEY = 'elec_dismissed_announcement_v2';
const MODAL_SEEN_KEY = 'elec_seen_announcement_modal_v2';

export default function SystemAnnouncementBanner({ previewOverride = null, onPreviewClose = null } = {}) {
  const { settings: ctxSettings } = useSettings();
  const { user, tier } = useAuth();
  const pro = useTeacherPro();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const barRef = useRef(null);

  const isPreview = Boolean(previewOverride);
  const settings = isPreview ? { ...ctxSettings, ...previewOverride, announcementEnabled: true } : ctxSettings;

  const ent = useMemo(() => resolveEntitlements({ user, pro, tier }), [user, pro, tier]);
  const viewer = useMemo(() => ({
    role: pro?.isPro && pro?.isTeacherPro !== false ? 'teacher' : getUserRole(user),
    isVip: Boolean(ent.hasVipAccess || pro?.isPro),
    isAdmin: isPreview || isAdmin(user),
  }), [user, pro, ent.hasVipAccess, isPreview]);

  const safeImage = sanitizeAnnouncementImage(settings.announcementImage);

  const evalRes = useMemo(() => {
    if (isPreview) {
      const hasAny = Boolean(String(settings.announcementText || '').trim() || safeImage);
      const endMs = settings.announcementEndAt ? new Date(settings.announcementEndAt).getTime() : 0;
      const rem = Number.isFinite(endMs) && endMs > nowMs ? endMs - nowMs : (settings.announcementShowCountdown ? 7920000 : 0);
      return { visible: hasAny, reason: 'preview', remainingMs: rem };
    }
    return evaluateAnnouncementVisibility(settings, viewer, nowMs);
  }, [settings, viewer, nowMs, isPreview, safeImage]);

  const dismissKey = useMemo(() => getAnnouncementDismissKey(settings), [settings]);
  const theme = resolveAnnouncementTheme(settings.announcementTheme);
  const dismissible = settings.announcementDismissible !== false;
  const showCountdown = Boolean(settings.announcementShowCountdown && evalRes.remainingMs > 0);
  const displayMode = settings.announcementDisplay || 'banner';
  const isPosterMode = displayMode === 'poster';
  const isModalMode = displayMode === 'modal';
  const isFloatingMode = displayMode === 'floating';
  const showTopBar = evalRes.visible && !dismissed && !isFloatingMode && !isPosterMode;

  // Tick đồng hồ đếm ngược hoặc mốc lịch mỗi giây
  useEffect(() => {
    if (!settings.announcementEnabled) return undefined;
    if (!settings.announcementShowCountdown && !settings.announcementStartAt && !settings.announcementEndAt) {
      return undefined;
    }
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [settings.announcementEnabled, settings.announcementShowCountdown, settings.announcementStartAt, settings.announcementEndAt]);

  // Kiểm tra trạng thái dismiss / modal seen theo phiên bản phát sóng
  useEffect(() => {
    if (!evalRes.visible) {
      setModalOpen(false);
      return;
    }
    if (isPreview) {
      setDismissed(false);
      setModalOpen(isModalMode || isPosterMode);
      return;
    }
    try {
      const storedDismiss = localStorage.getItem(DISMISS_STORE_KEY);
      setDismissed(dismissible && storedDismiss === dismissKey);

      if (isModalMode || isPosterMode) {
        if (!dismissible) {
          // Thông báo bắt buộc (đã khóa nút X) → LUÔN hiện, không bị chặn bởi lịch sử đã đóng trước đó
          setModalOpen(true);
        } else {
          const seenModal = localStorage.getItem(MODAL_SEEN_KEY);
          setModalOpen(seenModal !== dismissKey);
        }
      } else {
        setModalOpen(false);
      }
    } catch {
      setDismissed(false);
      setModalOpen(isModalMode || isPosterMode);
    }
  }, [dismissKey, dismissible, evalRes.visible, isModalMode, isPosterMode, isPreview]);

  // Hỗ trợ phím Esc để đóng Popup Poster / Modal (CHỈ khi cho phép đóng)
  useEffect(() => {
    if (!modalOpen || !dismissible) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        if (isPreview) onPreviewClose?.();
        else { try { localStorage.setItem(MODAL_SEEN_KEY, dismissKey); } catch { /* noop */ } }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, dismissible, isPreview, onPreviewClose, dismissKey]);

  // Đo chiều cao thực của dải băng đầu trang và đẩy Navbar (.dn / .lp-nav / .mhead-bar) xuống
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    const clearOffset = () => {
      document.body.classList.remove('has-sys-ann');
      root.style.setProperty('--sys-ann-h', '0px');
    };
    if (!showTopBar || !barRef.current) {
      clearOffset();
      return undefined;
    }
    const syncHeight = () => {
      const h = barRef.current ? Math.ceil(barRef.current.getBoundingClientRect().height) : 0;
      if (h > 0) {
        root.style.setProperty('--sys-ann-h', `${h}px`);
        document.body.classList.add('has-sys-ann');
      } else {
        clearOffset();
      }
    };
    syncHeight();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncHeight);
      ro.observe(barRef.current);
    }
    window.addEventListener('resize', syncHeight);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', syncHeight);
      clearOffset();
    };
  }, [showTopBar, settings.announcementText, settings.announcementBadge, settings.announcementImage]);

  if (!evalRes.visible) return null;

  const countdownLabel = showCountdown ? formatCountdownLabel(evalRes.remainingMs) : '';
  const ctaText = String(settings.announcementCtaText || 'Khám phá ngay').trim();
  const linkHref = String(settings.announcementLink || '').trim();
  const imgContain = settings.announcementImageFit === 'contain' || safeImage.startsWith('/img/elec/');

  const handleDismissBanner = () => {
    if (!dismissible) return;
    setDismissed(true);
    if (isPreview) {
      onPreviewClose?.();
      return;
    }
    try { localStorage.setItem(DISMISS_STORE_KEY, dismissKey); } catch { /* noop */ }
  };

  const handleCloseModal = () => {
    if (!dismissible) return;
    setModalOpen(false);
    if (isPreview) {
      onPreviewClose?.();
      return;
    }
    try { localStorage.setItem(MODAL_SEEN_KEY, dismissKey); } catch { /* noop */ }
  };

  const handleNavigateLink = (e) => {
    if (isPreview) {
      e.preventDefault();
      onPreviewClose?.();
      return;
    }
    if (linkHref.startsWith('#')) {
      e.preventDefault();
      window.location.hash = linkHref.replace(/^#/, '');
    }
    if (modalOpen && dismissible) handleCloseModal();
  };

  return (
    <>
      {/* 1. DẢI BĂNG CỐ ĐỊNH TRÊN CÙNG */}
      {showTopBar && (
        <div
          ref={barRef}
          className="sys-ann-bar"
          role="alert"
          style={{ background: theme.bg }}
        >
          <div className="sys-ann-shimmer" aria-hidden="true" />
          <div className="sys-ann-inner">
            {safeImage && (
              <img
                src={safeImage}
                alt=""
                className={`sys-ann-thumb${imgContain ? ' contain' : ''}`}
              />
            )}
            <span className="sys-ann-badge">{settings.announcementBadge || '📢 Thông báo'}</span>
            <span className="sys-ann-text">{settings.announcementText}</span>
            {countdownLabel && (
              <span className="sys-ann-timer" title="Thời gian còn lại">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {countdownLabel}
              </span>
            )}
            {linkHref && (
              <a
                href={linkHref}
                className="sys-ann-cta"
                target={linkHref.startsWith('http') ? '_blank' : undefined}
                rel={linkHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={handleNavigateLink}
              >
                {ctaText || 'Xem ngay'} →
              </a>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              className="sys-ann-close"
              onClick={handleDismissBanner}
              aria-label="Đóng thông báo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 2. THẺ BANNER NỔI GÓC DƯỚI TRÁI (FLOATING CARD) */}
      {isFloatingMode && !dismissed && (
        <aside className="sys-ann-float" role="region" aria-label="Thông báo nổi bật">
          <div className="sys-ann-float-head" style={{ background: theme.bg }}>
            <span className="sys-ann-badge">{settings.announcementBadge || '🔥 Nổi bật'}</span>
            {countdownLabel && <span className="sys-ann-timer">{countdownLabel}</span>}
            {dismissible && (
              <button type="button" className="sys-ann-float-x" onClick={handleDismissBanner} aria-label="Đóng thẻ thông báo">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {safeImage && (
            <div className="sys-ann-float-img-wrap">
              <img src={safeImage} alt="Ảnh thông báo ELEC AI" className={`sys-ann-float-img${imgContain ? ' contain' : ''}`} />
            </div>
          )}
          <div className="sys-ann-float-body">
            {settings.announcementText && <p>{settings.announcementText}</p>}
            {linkHref && (
              <a
                href={linkHref}
                className="sys-ann-modal-btn primary"
                style={{ background: theme.bg, width: '100%' }}
                target={linkHref.startsWith('http') ? '_blank' : undefined}
                rel={linkHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={handleNavigateLink}
              >
                {ctaText || 'Khám phá ngay'} →
              </a>
            )}
          </div>
        </aside>
      )}

      {/* 3. POPUP POSTER ẢNH FULL BO TRÒN (KIỂU SỰ KIỆN / KỲ THI) */}
      {isPosterMode && modalOpen && (
        <div
          className="sys-ann-modal-bg"
          role="dialog"
          aria-modal="true"
          aria-label={settings.announcementText || 'Thông báo sự kiện'}
          onClick={dismissible ? handleCloseModal : undefined}
        >
          <div className="sys-ann-poster" onClick={(e) => e.stopPropagation()}>
            {dismissible && (
              <button type="button" className="sys-ann-poster-x" onClick={handleCloseModal} aria-label="Đóng poster">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}

            {countdownLabel && (
              <span className="sys-ann-poster-timer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                Còn {countdownLabel}
              </span>
            )}

            {safeImage ? (
              linkHref ? (
                <a
                  href={linkHref}
                  className="sys-ann-poster-link"
                  target={linkHref.startsWith('http') ? '_blank' : undefined}
                  rel={linkHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={handleNavigateLink}
                  title={settings.announcementText || ctaText}
                >
                  <img src={safeImage} alt={settings.announcementText || 'Poster thông báo ELEC AI'} className="sys-ann-poster-img" />
                </a>
              ) : (
                <img src={safeImage} alt={settings.announcementText || 'Poster thông báo ELEC AI'} className="sys-ann-poster-img" />
              )
            ) : (
              /* Fallback poster gradient bo tròn đẹp khi Admin chưa tải ảnh */
              <div className="sys-ann-poster-fallback" style={{ background: theme.bg }}>
                <span className="sys-ann-badge lg">{settings.announcementBadge || '🔥 Sự kiện mới'}</span>
                <h3>{settings.announcementText}</h3>
                {linkHref && (
                  <a
                    href={linkHref}
                    className="sys-ann-cta lg"
                    target={linkHref.startsWith('http') ? '_blank' : undefined}
                    rel={linkHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={handleNavigateLink}
                  >
                    {ctaText || 'Khám phá ngay'} →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. HỘP THOẠI SPOTLIGHT POPUP CÓ KHUNG NỘI DUNG */}
      {isModalMode && modalOpen && (
        <div
          className="sys-ann-modal-bg"
          role="dialog"
          aria-modal="true"
          onClick={dismissible ? handleCloseModal : undefined}
        >
          <div className="sys-ann-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sys-ann-modal-hero" style={{ background: theme.bg }}>
              <span className="sys-ann-badge lg">{settings.announcementBadge || '🔥 Nổi bật'}</span>
              {countdownLabel && (
                <span className="sys-ann-timer lg">Còn {countdownLabel}</span>
              )}
              {dismissible && (
                <button type="button" className="sys-ann-modal-x" onClick={handleCloseModal} aria-label="Đóng">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            {safeImage && (
              <div className="sys-ann-modal-img-wrap">
                <img
                  src={safeImage}
                  alt="Ảnh thông báo ELEC AI"
                  className={`sys-ann-modal-img${imgContain ? ' contain' : ''}`}
                />
              </div>
            )}
            <div className="sys-ann-modal-body">
              {settings.announcementText && <p className="sys-ann-modal-msg">{settings.announcementText}</p>}
              {(linkHref || dismissible) && (
                <div className="sys-ann-modal-actions">
                  {linkHref && (
                    <a
                      href={linkHref}
                      className="sys-ann-modal-btn primary"
                      style={{ background: theme.bg }}
                      target={linkHref.startsWith('http') ? '_blank' : undefined}
                      rel={linkHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={handleNavigateLink}
                    >
                      {ctaText || 'Khám phá ngay'} →
                    </a>
                  )}
                  {dismissible && (
                    <button type="button" className="sys-ann-modal-btn ghost" onClick={handleCloseModal}>
                      Đã hiểu
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nút thoát riêng cho chế độ Xem thử của Admin khi đang tắt nút X */}
      {isPreview && !dismissible && (
        <button
          type="button"
          onClick={() => onPreviewClose?.()}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 22,
            transform: 'translateX(-50%)',
            zIndex: 10099,
            padding: '9px 18px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.28)',
            background: 'rgba(15,23,42,0.9)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(0,0,0,0.4)',
          }}
        >
          Chế độ Xem thử Admin (đã khóa nút X) · Bấm để thoát xem thử
        </button>
      )}
    </>
  );
}
