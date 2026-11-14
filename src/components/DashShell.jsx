/* ============================================================
   DashShell.jsx — Bộ khung Studio cho Giáo viên (v5)
   ------------------------------------------------------------
   v5:
     • Nav rail 56px, chỉ icon, giống SuperGrok
     • Tooltip khi hover
     • Dùng AIMark của app (không phải logo giả)
     • Import React đầy đủ   ============================================================ */
import React, { useEffect, useId, useRef, useState } from 'react';
import { IcoArrowLeft, IcoSearch, IcoClose, IcoBell } from '../lib/sessionIcons.jsx';
import '../styles/dash-vitality.css';
import '../styles/teacher-ds.css';
import '../styles/teacher-studio-v2.css';

/* ---------- LOGOMARK SVG CỦA APP ---------- */
import { ElecFlaskBrandSvg } from './teacher/ElecBrandMark.jsx';

const IcoSun = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const IcoMoon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IcoSparkles = ({ size = 16 }) => (
  <ElecFlaskBrandSvg size={size} variant="duo" />
);

export const tsMs = (t) => {
  if (!t) return 0;
  if (typeof t === 'number') return t;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (t.seconds) return t.seconds * 1000;
  const n = new Date(t).getTime();
  return Number.isNaN(n) ? 0 : n;
};

export const fmtMMSS = (seconds) => {
  const s0 = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s0 / 60);
  const s = s0 % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const fmtClock = (ms) => {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function downloadCsv(filename, rows) {
  const esc = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Avatar({ name = '?', size = 44 }) {
  const str = String(name || '?');
  const ch = (str.trim().split(/\s+/).pop() || '?')[0].toUpperCase();
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360;
  const hue = 195 + (h % 90);
  return (
    <span
      className="vt-avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `linear-gradient(145deg, hsl(${hue} 70% 55%), hsl(${hue + 18} 65% 42%))`,
      }}
      aria-hidden="true"
    >
      {ch}
    </span>
  );
}

export function Donut({ value = 0, max = 100, size = 120, stroke = 12, tone = 'acc', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className="vt-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="vt-donut-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className={'vt-donut-fg ' + tone}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="vt-donut-in">{children}</div>
    </div>
  );
}

export function TrendChart({ points = [], mode = 'line', max = 100, unit = '%', height = 140 }) {
  const gid = useId().replace(/:/g, '');
  const W = 360;
  const H = height;
  const pad = 16;
  if (!points.length) {
    return <div className="vt-chart-empty">Chưa có dữ liệu để vẽ</div>;
  }
  const n = points.length;
  const top = Math.max(max, 1);
  const xy = points.map((p, i) => [
    n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1),
    H - pad - (Math.min(p.value, top) / top) * (H - 2 * pad),
  ]);
  const line = xy.reduce((acc, [x, y], i, arr) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = arr[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');
  const area = `${line} L${xy[n - 1][0]},${H - pad} L${xy[0][0]},${H - pad} Z`;
  const bw = Math.min(28, ((W - 2 * pad) / n) * 0.55);

  return (
    <svg className="vt-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Biểu đồ">
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--acc, #2563eb)" stopOpacity=".25" />
          <stop offset="1" stopColor="var(--acc, #2563eb)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pad}
          x2={W - pad}
          y1={H - pad - f * (H - 2 * pad)}
          y2={H - pad - f * (H - 2 * pad)}
          className="vt-chart-grid"
        />
      ))}
      {mode === 'bar' ? (
        xy.map(([x, y], i) => (
          <rect
            key={i}
            x={x - bw / 2}
            y={y}
            width={bw}
            height={Math.max(2, H - pad - y)}
            rx={bw / 2.4}
            className="vt-chart-bar"
          >
            <title>{`${points[i].label}: ${points[i].value}${unit}`}</title>
          </rect>
        ))
      ) : (
        <>
          <path d={area} fill={`url(#g${gid})`} />
          <path d={line} className="vt-chart-line" fill="none" />
          {xy.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" className="vt-chart-dot">
              <title>{`${points[i].label}: ${points[i].value}${unit}`}</title>
            </circle>
          ))}
        </>
      )}
    </svg>
  );
}

const modalStack = [];

export function Modal({ title, onClose, size = 'md', children, foot }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const token = Symbol('modal');
    modalStack.push(token);
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const h = (e) => {
      if (e.key === 'Escape' && modalStack[modalStack.length - 1] === token) closeRef.current?.();
    };
    window.addEventListener('keydown', h);
    return () => {
      window.removeEventListener('keydown', h);
      const i = modalStack.indexOf(token);
      if (i >= 0) modalStack.splice(i, 1);
      document.body.style.overflow = prevOverflow;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, []);

  return (
    <div
      className="vt-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      role="presentation"
    >
      <div
        className={'vt-modal ' + size}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Hộp thoại'}
      >
        <header className="vt-modal-head">
          <h3>{title}</h3>
          <button type="button" className="vt-icon-btn" onClick={onClose} aria-label="Đóng">
            <IcoClose size={16} />
          </button>
        </header>
        <div className="vt-modal-body">{children}</div>
        {foot && <footer className="vt-modal-foot">{foot}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, okLabel = 'Xác nhận', danger, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      foot={
        <>
          <button type="button" className="vt-btn" onClick={onCancel}>Hủy</button>
          <button type="button" className={'vt-btn ' + (danger ? 'danger' : 'primary')} onClick={onConfirm}>
            {okLabel}
          </button>
        </>
      }
    >
      <p className="vt-muted">{body}</p>
    </Modal>
  );
}

export function Topbar({
  title, subtitle, tabs, active, onTab, search, onSearch,
  placeholder = 'Tìm kiếm...', bell, theme, onToggleTheme,
  onOpenCommandPalette, onOpenAiCopilot,
  user = null, roleLabel = '', quickAction = null,
  onGoOverview = null, isOverview = false, onOpenProfile = null,
}) {
  const searchInputRef = useRef(null);
  const now = new Date();
  const dowLabels = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayChip = `${dowLabels[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const displayName = user?.displayName || user?.email?.split('@')?.[0] || 'Giáo viên';

  return (
    <header className="t-topbar-slim">
      <div className="t-top-left">
        {tabs && tabs.length > 0 ? (
          <div className="vt-tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active === t.key}
                className={'vt-tab' + (active === t.key ? ' on' : '')}
                onClick={() => onTab(t.key)}
              >
                {t.label}
                {typeof t.count === 'number' && <em>{t.count}</em>}
              </button>
            ))}
          </div>
        ) : (
          <div className="t-top-heading">
            <h1 className="t-top-title">{title}</h1>
            {subtitle && <p className="t-top-sub">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="t-top-right">
        {(onGoOverview || quickAction) && (
          <div className="t-top-seg-pill" role="group" aria-label="Thao tác nhanh">
            {onGoOverview && (
              <button
                type="button"
                className={`t-top-seg-btn ${isOverview ? 'active' : ''}`}
                onClick={onGoOverview}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
                </svg>
                Tổng quan
              </button>
            )}
            {quickAction && (
              <button
                type="button"
                className="t-top-seg-btn accent"
                onClick={quickAction.onClick}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {quickAction.label}
              </button>
            )}
          </div>
        )}

        {onSearch && (
          <div className="t-search-pill">
            <IcoSearch size={14} />
            <input
              ref={searchInputRef}
              className="vt-search-input"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearch('')}
                style={{ border: 0, background: 'none', color: 'var(--ts-ink-3)', cursor: 'pointer', padding: 0 }}
                aria-label="Xóa tìm kiếm"
              >
                <IcoClose size={11} />
              </button>
            ) : null}
          </div>
        )}

        <span className="t-top-date-pill" title="Ngày làm việc hiện tại">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {todayChip}
        </span>

        {onOpenAiCopilot && (
          <button
            type="button"
            className="t-top-ai-btn"
            onClick={onOpenAiCopilot}
            title="Mở AI Trợ lý Toàn năng (Sửa đề, Phân tích học sinh, Giám thị)"
            aria-label="Mở AI Trợ lý Toàn năng"
          >
            <IcoSparkles size={15} />
            <span>ELEC Agent</span>
          </button>
        )}

        {onOpenCommandPalette && (
          <button
            type="button"
            className="t-top-action-btn"
            onClick={onOpenCommandPalette}
            title="Tìm nhanh lớp, đề thi, học sinh & chức năng (Ctrl + K)"
            aria-label="Mở bảng tìm kiếm và lệnh nhanh (Ctrl K)"
          >
            <IcoSearch size={16} />
          </button>
        )}

        {bell && (
          <button
            type="button"
            className={`t-top-action-btn ${bell.on ? 'has-notice' : ''}`}
            onClick={bell.onClick}
            title={bell.title || 'Thông báo lớp học'}
            aria-label={bell.title || 'Thông báo lớp học'}
          >
            {bell.Icon ? <bell.Icon size={16} /> : <IcoBell size={16} />}
          </button>
        )}

        {onToggleTheme && (
          <button
            type="button"
            className="t-top-action-btn"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
            aria-label="Đổi giao diện sáng tối"
          >
            {theme === 'light' ? <IcoMoon size={16} /> : <IcoSun size={16} />}
          </button>
        )}

        {user && (
          <button
            type="button"
            className="t-top-profile-chip"
            onClick={onOpenProfile}
            title={`${displayName}${roleLabel ? ` · ${roleLabel}` : ''} — Bấm để mở Hồ sơ giáo viên`}
          >
            <Avatar name={displayName} size={28} />
            <span className="t-top-profile-meta">
              <b>{displayName}</b>
              {roleLabel ? <small>{roleLabel}</small> : null}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
Topbar.isTopbar = true;

export function DashFrame({
  items,
  active,
  onChange,
  onExit,
  exitLabel = 'Về trang chủ',
  sideNote,
  extraNav,
  fullscreen = false,
  onOpenCommandPalette,
  onOpenAiCopilot,
  user = null,
  roleLabel = '',
  quickAction = null,
  onOpenProfile = null,
  className = '',
  children,
}) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('elec_teacher_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [railCollapsed, setRailCollapsed] = useState(() => {
    try {
      return localStorage.getItem('elec_teacher_rail_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('elec_teacher_theme', next);
    } catch { /* */ }
  };

  const handleToggleRail = () => {
    setRailCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('elec_teacher_rail_collapsed', next ? '1' : '0');
      } catch { /* */ }
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.removeItem('elec_teacher_nav_pinned');
      localStorage.removeItem('elec_teacher_nav_hidden');
    } catch { /* */ }
  }, []);

  const isTopbarElem = (child) =>
    React.isValidElement(child) && (child.type === Topbar || child.type?.isTopbar);

  /* Chọn 5 mục chính cho thanh đáy di động + nút Menu */
  const mobilePrimaryKeys = ['overview', 'classes', 'exams', 'sessions', 'analytics'];
  const matchedTeacherItems = mobilePrimaryKeys
    .map((k) => items.find((it) => it.key === k || (it.matchKeys && it.matchKeys.includes(k))))
    .filter(Boolean);
  const mobilePrimaryItems = matchedTeacherItems.length >= 3
    ? matchedTeacherItems
    : items.slice(0, 5);
  const isAdminScope = className.includes('ad-scope') || items.some((it) => it.key === 'dashboard');
  const displayName = user?.displayName || user?.email?.split('@')?.[0] || 'Giáo viên';

  return (
    <div className={`t-root t-shell ${className}`} data-theme={theme}>
      <aside className={`t-rail-sidebar ${railCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="t-rail-header">
          <div className="t-rail-logo" onClick={onExit} title="Về trang chủ ELEC AI">
            <ElecFlaskBrandSvg size={34} variant="gradient" />
            <span className="t-rail-logo-text">ELEC AI</span>
          </div>
          <button
            type="button"
            className="t-rail-collapse-btn"
            onClick={handleToggleRail}
            title={railCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            aria-label={railCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M9 3v18" />
              {railCollapsed ? <path d="M14 9l3 3-3 3" /> : <path d="M16 9l-3 3 3 3" />}
            </svg>
          </button>
        </div>

        <nav className="t-rail-nav" aria-label="Điều hướng giáo viên">
          {items.map((it, idx) => {
            const I = it.Icon;
            const on = it.matchKeys ? it.matchKeys.includes(active) : (active === it.key);
            const prevGroup = idx > 0 ? items[idx - 1].group : null;
            const showGroup = it.group && it.group !== prevGroup;
            return (
              <React.Fragment key={it.key}>
                {showGroup && (
                  <>
                    {idx > 0 && <div className="t-rail-group-divider" />}
                    <div className="t-rail-group-label">{it.group}</div>
                  </>
                )}
                <button
                  type="button"
                  className={`t-rail-btn ${on ? 'active' : ''}`}
                  onClick={() => {
                    if (it.onClick) it.onClick();
                    else onChange(it.key);
                  }}
                  title={it.label}
                  aria-current={on ? 'page' : undefined}
                >
                  <span className="t-rail-btn-icon">
                    <I size={19} />
                  </span>
                  <span className="t-rail-btn-label">{it.label}</span>
                  {it.badge ? <span className="t-rail-btn-badge">{it.badge}</span> : null}
                  {!it.badge && it.count !== undefined && it.count !== null ? (
                    <span className="t-rail-btn-count">{it.count}</span>
                  ) : null}
                </button>
              </React.Fragment>
            );
          })}
          {extraNav}
        </nav>

        <div className="t-rail-footer">
          {user && (
            <button
              type="button"
              className="t-rail-user-card"
              onClick={() => (onOpenProfile ? onOpenProfile() : onChange('profile'))}
              title={`${displayName}${roleLabel ? ` · ${roleLabel}` : ''}`}
            >
              <Avatar name={displayName} size={30} />
              <span className="t-rail-user-meta">
                <b>{displayName}</b>
                <small>{roleLabel || 'Giáo viên ELEC'}</small>
              </span>
            </button>
          )}
          <button
            type="button"
            className="t-rail-btn"
            onClick={onExit}
            title={exitLabel}
          >
            <span className="t-rail-btn-icon">
              <IcoArrowLeft size={19} />
            </span>
            <span className="t-rail-btn-label">{exitLabel}</span>
          </button>
        </div>
      </aside>

      <section className="t-main-area">
        {React.Children.map(children, (child) => {
          if (isTopbarElem(child)) {
            return React.cloneElement(child, {
              theme,
              onToggleTheme: handleToggleTheme,
              onOpenCommandPalette,
              onOpenAiCopilot,
              user,
              roleLabel,
              quickAction,
              onGoOverview: !isAdminScope ? () => onChange('overview') : null,
              isOverview: active === 'overview',
              onOpenProfile: onOpenProfile || (() => onChange('profile')),
            });
          }
          return null;
        })}
        <div className="t-viewport">
          {React.Children.map(children, (child) => {
            if (isTopbarElem(child)) {
              return null;
            }
            return child;
          })}
        </div>
      </section>

      {/* Thanh Điều Hướng Đáy Di Động (< 768px) kiểu Apple Floating Pill */}
      <nav className="t-mobile-bottom-nav" aria-label="Điều hướng nhanh trên di động">
        {mobilePrimaryItems.map((it) => {
          const I = it.Icon;
          const on = it.matchKeys ? it.matchKeys.includes(active) : (active === it.key);
          return (
            <button
              key={it.key}
              type="button"
              className={`t-mobile-nav-btn ${on ? 'active' : ''}`}
              onClick={() => {
                setMobileMenuOpen(false);
                onChange(it.key);
              }}
              aria-current={on ? 'page' : undefined}
            >
              <span className="t-mobile-nav-icon">
                <I size={19} />
                {it.badge ? <span className="t-mobile-nav-badge">{it.badge}</span> : null}
              </span>
              <span className="t-mobile-nav-label">{it.shortLabel || it.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`t-mobile-nav-btn ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-expanded={mobileMenuOpen}
          aria-label="Xem tất cả chức năng"
        >
          <span className="t-mobile-nav-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="2" />
              <rect x="14" y="3.5" width="6.5" height="6.5" rx="2" />
              <rect x="14" y="14" width="6.5" height="6.5" rx="2" />
              <rect x="3.5" y="14" width="6.5" height="6.5" rx="2" />
            </svg>
          </span>
          <span className="t-mobile-nav-label">Thêm</span>
        </button>
      </nav>

      {/* Bottom Sheet Menu Giáo viên trên Di Động */}
      {mobileMenuOpen && (
        <div className="t-mobile-sheet-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="t-mobile-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Menu Khu vực Giáo viên"
          >
            <div className="t-mobile-sheet-grip" aria-hidden="true" />

            <div className="t-mobile-sheet-head">
              <div className="t-mobile-sheet-title">
                <strong>{isAdminScope ? 'Trung tâm Quản trị Admin' : 'Khu vực Giáo viên'}</strong>
                <small>{isAdminScope ? 'Hệ thống quản trị, đề thi, câu hỏi & thành viên' : 'Hệ thống quản lý lớp, ngân hàng đề & khảo thí'}</small>
              </div>
              <button
                type="button"
                className="t-mobile-sheet-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
              >
                <IcoClose size={16} />
              </button>
            </div>

            <div className="t-mobile-sheet-grid">
              {items.map((it) => {
                const I = it.Icon;
                const on = it.matchKeys ? it.matchKeys.includes(active) : (active === it.key);
                return (
                  <button
                    key={it.key}
                    type="button"
                    className={`t-sheet-item ${on ? 'active' : ''}`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (it.onClick) it.onClick();
                      else onChange(it.key);
                    }}
                  >
                    <span className="t-sheet-item-ico">
                      <I size={18} />
                    </span>
                    <span className="t-sheet-item-label">{it.label}</span>
                    {it.badge ? (
                      <span className="t-sheet-item-badge">{it.badge}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="t-mobile-sheet-foot">
              <button
                type="button"
                className="t-sheet-action-btn"
                onClick={handleToggleTheme}
              >
                {theme === 'light' ? (
                  <>
                    <IcoMoon size={15} /> <span>Giao diện Tối</span>
                  </>
                ) : (
                  <>
                    <IcoSun size={15} /> <span>Giao diện Sáng</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="t-sheet-action-btn danger"
                onClick={onExit}
              >
                <IcoArrowLeft size={15} />
                <span>{exitLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}