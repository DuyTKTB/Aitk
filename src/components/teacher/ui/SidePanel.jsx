/* ============================================================
   SidePanel.jsx — Thẻ Summary/Chi tiết trượt từ phải (Ảnh 1 HubSpot)
   Dùng thay thế modal che giữa màn hình khi xem chi tiết lớp, học sinh, đề
   ============================================================ */
import React, { useEffect } from 'react';

const IcoClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function SidePanel({
  open = false,
  onClose,
  title = '',
  subtitle = '',
  headerAction,
  footer,
  width = 480,
  children,
  className = '',
}) {
  // Lắng nghe phím Escape để đóng
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Khóa cuộn trang khi mở
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div
        className={`t-side-panel-backdrop ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`t-side-panel ${open ? 'open' : ''} ${className}`.trim()}
        style={{ width: `min(${width}px, 94vw)` }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <header className="t-side-panel-head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--t-ink)', letterSpacing: '-0.02em' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--t-ink-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {headerAction}
            <button
              type="button"
              className="t-card-notch-btn"
              style={{ position: 'static', width: 34, height: 34 }}
              onClick={onClose}
              title="Đóng panel"
              aria-label="Đóng panel"
            >
              <IcoClose size={16} />
            </button>
          </div>
        </header>

        <div className="t-side-panel-body">
          {children}
        </div>

        {footer && (
          <footer
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--t-border-subtle)',
              background: 'var(--t-surface-0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.65rem',
            }}
          >
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}
