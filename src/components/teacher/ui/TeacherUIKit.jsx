/* ============================================================
   TeacherUIKit.jsx — Bộ Component Dùng Lại Khu Vực Giáo Viên
   ------------------------------------------------------------
   Chuẩn thiết kế thống nhất (Mục C):
   • Font: Be Vietnam Pro (--t-font)
   • Bo góc: 18px thẻ lớn, 10–12px nút
   • Icon SVG nét mảnh 18px (strokeWidth 1.75)
   • Khoảng cách theo bội số 4px (4, 8, 12, 16, 20, 24px)
   • Gồm: Button, Card, Chip/Badge, Table, Tabs, Modal, Drawer,
     Toast (kèm nút Hoàn tác), EmptyState, Skeleton, Tooltip
   ============================================================ */
import { useEffect } from 'react';

export function TButton({
  variant = 'default', // default | primary | ghost | danger | subtle
  size = 'md',         // sm | md | lg
  icon = null,
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...rest
}) {
  const sizeCls = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : '';
  const varCls = variant === 'default' ? '' : variant;
  return (
    <button
      type={type}
      disabled={disabled}
      className={['vt-btn', sizeCls, varCls, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function TCard({
  icon = null,
  title,
  subtitle,
  badge = null,
  menu = null,
  footer = null,
  onClick,
  className = '',
  children,
}) {
  return (
    <article
      className={['vt-card-std', onClick ? 'is-clickable' : '', className].filter(Boolean).join(' ')}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
    >
      {(icon || title || badge || menu) && (
        <header className="vt-card-std-head">
          <div className="vt-card-std-id">
            {icon && <span className="vt-card-std-ico">{icon}</span>}
            <div className="vt-card-std-titles">
              {title && <h3 className="vt-card-std-title">{title}</h3>}
              {subtitle && <p className="vt-card-std-sub">{subtitle}</p>}
            </div>
          </div>
          <div className="vt-card-std-actions" onClick={(e) => e.stopPropagation()}>
            {badge}
            {menu}
          </div>
        </header>
      )}
      <div className="vt-card-std-body">{children}</div>
      {footer && (
        <footer className="vt-card-std-foot" onClick={(e) => e.stopPropagation()}>
          {footer}
        </footer>
      )}
    </article>
  );
}

export function TBadge({ tone = 'neutral', dot = false, children, className = '' }) {
  return (
    <span className={['vt-chip', `tone-${tone}`, className].filter(Boolean).join(' ')}>
      {dot && <span className="vt-chip-dot" />}
      {children}
    </span>
  );
}

export function TTabs({ items = [], value, onChange, ariaLabel = 'Chuyển tab' }) {
  return (
    <div className="vt-tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((it) => {
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`vt-tab${active ? ' on' : ''}`}
            onClick={() => onChange?.(it.id)}
          >
            {it.icon}
            <span>{it.label}</span>
            {it.count !== undefined && <span className="vt-tab-cnt">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TTable({ columns = [], rows = [], keyField = 'id', emptyText = 'Chưa có dữ liệu', onRowClick }) {
  if (!rows.length) {
    return <div className="vt-table-empty">{emptyText}</div>;
  }
  return (
    <div className="vt-table-wrap">
      <table className="vt-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'right' ? 'num' : ''}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r[keyField] ?? idx}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={onRowClick ? 'is-clickable' : ''}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.align === 'right' ? 'num' : ''} data-label={c.label}>
                  {c.render ? c.render(r, idx) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TModal({ open = true, title, subtitle, size = 'md', onClose, footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="vt-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`vt-modal vt-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Hộp thoại'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="vt-modal-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" className="vt-icon-btn" onClick={onClose} aria-label="Đóng">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </header>
        <div className="vt-modal-body">{children}</div>
        {footer && <footer className="vt-modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function TDrawer({ open = false, title, subtitle, onClose, footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="vt-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="vt-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Ngăn chi tiết'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="vt-drawer-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" className="vt-icon-btn" onClick={onClose} aria-label="Đóng">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </header>
        <div className="vt-drawer-body">{children}</div>
        {footer && <footer className="vt-drawer-foot">{footer}</footer>}
      </aside>
    </div>
  );
}

export function TToast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className={`vt-toast ${toast.tone || 'info'}`} role="status" aria-live="polite">
      <span className="vt-toast-dot" />
      <span className="vt-toast-msg">{toast.msg}</span>
      {toast.onUndo && (
        <button
          type="button"
          className="vt-toast-undo"
          onClick={() => {
            toast.onUndo();
            onDismiss?.();
          }}
        >
          {toast.undoLabel || 'Hoàn tác'}
        </button>
      )}
      {onDismiss && (
        <button type="button" className="vt-toast-close" onClick={onDismiss} aria-label="Đóng thông báo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function TEmptyState({ icon, title, description, actionLabel, onAction, secondaryAction }) {
  return (
    <div className="vt-empty">
      {icon && <div className="vt-empty-ico">{icon}</div>}
      <b>{title}</b>
      {description && <p>{description}</p>}
      {(actionLabel || secondaryAction) && (
        <div className="vt-empty-actions">
          {actionLabel && onAction && (
            <button type="button" className="vt-btn primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function TTooltip({ label, children }) {
  return (
    <span className="vt-tooltip-wrap" data-tooltip={label} title={label}>
      {children}
    </span>
  );
}

export function TViewToggle({ mode = 'grid', onChange }) {
  return (
    <div className="vt-view-toggle" role="group" aria-label="Chế độ hiển thị">
      <button
        type="button"
        className={`vt-view-btn${mode === 'grid' ? ' on' : ''}`}
        onClick={() => onChange?.('grid')}
        aria-label="Chế độ lưới"
        title="Chế độ lưới"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </button>
      <button
        type="button"
        className={`vt-view-btn${mode === 'list' ? ' on' : ''}`}
        onClick={() => onChange?.('list')}
        aria-label="Chế độ danh sách"
        title="Chế độ danh sách"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1" />
          <circle cx="4" cy="12" r="1" />
          <circle cx="4" cy="18" r="1" />
        </svg>
      </button>
    </div>
  );
}
