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

/* ---------- DÙNG AIMARK CỦA APP ---------- */
import AIMark from './AIMark.jsx';

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
          <stop offset="0" stopColor="var(--ts-accent)" stopOpacity=".25" />
          <stop offset="1" stopColor="var(--ts-accent)" stopOpacity="0" />
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
}) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="t-topbar-slim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
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
          <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
            <h1 style={{
              margin: 0, fontSize: 18, fontWeight: 700,
              color: 'var(--ts-ink)', letterSpacing: '-0.02em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                margin: 0, fontSize: 12, color: 'var(--ts-ink-2)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {onSearch && (
          <div className="t-search-pill">
            <IcoSearch size={14} />
            <input
              ref={searchInputRef}
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
            ) : (
              <span className="t-search-kbd">⌘K</span>
            )}
          </div>
        )}

        {bell && (
          <button
            type="button"
            className="vt-icon-btn"
            onClick={bell.onClick}
            title={bell.title}
            aria-label={bell.title}
            style={{
              background: bell.on ? 'color-mix(in srgb, var(--ts-danger) 15%, transparent)' : 'var(--ts-surface-2)',
              color: bell.on ? 'var(--ts-danger)' : 'var(--ts-ink-2)',
              borderColor: bell.on ? 'color-mix(in srgb, var(--ts-danger) 30%, transparent)' : 'var(--ts-border)',
            }}
          >
            {bell.Icon ? <bell.Icon size={16} /> : <IcoBell size={16} />}
          </button>
        )}

        {onToggleTheme && (
          <button
            type="button"
            className="vt-icon-btn"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Chuyển sang tối' : 'Chuyển sang sáng'}
            aria-label="Đổi giao diện"
          >
            {theme === 'light' ? <IcoMoon size={16} /> : <IcoSun size={16} />}
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
  /* ❗ MỚI: ghim rail (CSS .expanded/.pinned đã có sẵn trong teacher-ds.css nhưng
     JSX chưa nối → trước đây rail chỉ mở khi hover) */
  const [pinned, setPinned] = useState(false);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('elec_teacher_theme', next);
    } catch { /* */ }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const isTopbarElem = (child) =>
    React.isValidElement(child) && (child.type === Topbar || child.type?.isTopbar);

  return (
    <div className={`t-shell ${className}`} data-theme={theme}>
      <aside className={`t-rail-sidebar ${pinned ? 'pinned expanded' : ''}`}>
        {/* Logo AIMark của app — dùng size nhỏ, không có chữ */}
        <div className="t-rail-logo" onClick={onExit} title="ELEC AI">
          <AIMark size={32} animate={false} />
          <span className="t-rail-logo-text">ELEC AI</span>
        </div>

        <nav className="t-rail-nav" aria-label="Điều hướng giáo viên">
          {items.map((it) => {
            const I = it.Icon;
            const on = active === it.key;
            return (
              <button
                key={it.key}
                type="button"
                className={`t-rail-btn ${on ? 'active' : ''}`}
                onClick={() => onChange(it.key)}
                title={it.label}
                aria-current={on ? 'page' : undefined}
              >
                <span className="t-rail-btn-icon">
                  <I size={20} />
                </span>
                <span className="t-rail-btn-label">{it.label}</span>
                {it.badge ? <span className="t-rail-btn-badge">{it.badge}</span> : null}
              </button>
            );
          })}
          {extraNav}
        </nav>

        <div className="t-rail-footer">
          {/* ❗ MỚI: ghim menu — CSS (.expanded/.pinned) có sẵn từ trước nhưng JSX
              chưa từng nối → rail chỉ mở khi hover, tablet/không có hover không bao giờ
              thấy chữ. Nay thêm nút ghim. */}
          <button
            type="button"
            className={`t-rail-btn ${pinned ? 'active' : ''}`}
            onClick={() => setPinned((v) => !v)}
            title={pinned ? 'Thu gọn menu' : 'Ghim menu — luôn hiện chữ'}
            aria-pressed={pinned}
          >
            <span className="t-rail-btn-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 17v5M9 3h6l-1 7 3 2v2H7v-2l3-2-1-7z" />
              </svg>
            </span>
            <span className="t-rail-btn-label">Ghim menu</span>
          </button>
          <button
            type="button"
            className="t-rail-btn"
            onClick={onExit}
            title={exitLabel}
          >
            <span className="t-rail-btn-icon">
              <IcoArrowLeft size={20} />
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
    </div>
  );
}