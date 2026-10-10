/* ============================================================
   DashShell.jsx — Bộ khung dùng chung cho Quản lý lớp học + Giám sát + Admin
   ------------------------------------------------------------
   Kiểu "Vitality": khung trắng bo tròn, sidebar gradient có
   tab nổi, thẻ bo lớn, nút dạng pill — nhưng dùng đúng màu
   chủ đạo --acc của web (xanh #2f6bff).

   Hỗ trợ:
     • items       mảng { key, label, Icon, badge, live }
     • active      key đang chọn
     • onChange    callback đổi tab
     • onExit      callback thoát (về trang chủ)
     • exitLabel   nhãn nút thoát
     • sideNote    JSX phụ trong sidebar (VD: tên lớp đang xem)
     • extraNav    JSX thêm vào nav (VD: nút "Sang quản trị")
   ============================================================ */
import { useEffect, useId } from 'react';
import { IcoArrowLeft, IcoSearch, IcoClose, IcoBell } from '../lib/sessionIcons.jsx';
import '../styles/dash-vitality.css';

/* ---------- LOGO: tự lấy AIMark của web (đổi đường dẫn nếu khác) ---------- */
const markMods = import.meta.glob('./AIMark*.jsx', { eager: true });
const AIMarkComp = (() => {
  const m = Object.values(markMods)[0];
  return m ? (m.default || m.AIMark || null) : null;
})();

export function BrandMark({ size = 34 }) {
  return (
    <div className="vt-brand">
      <span className="vt-brand-mark" aria-hidden="true">
        {AIMarkComp ? <AIMarkComp size={size} /> : <i className="vt-brand-fallback" />}
      </span>
      <span className="vt-brand-text">
        <b>Chem Study</b>
        <small>Góc giáo viên</small>
      </span>
    </div>
  );
}

/* ---------- HELPERS ---------- */
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
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- AVATAR ---------- */
export function Avatar({ name = '?', size = 44 }) {
  const str = String(name || '?');
  const ch = (str.trim().split(/\s+/).pop() || '?')[0].toUpperCase();
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360;
  const hue = 195 + (h % 90); // dải xanh → tím, hợp tông màu chủ đạo
  return (
    <span
      className="vt-avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `linear-gradient(145deg, hsl(${hue} 88% 70%), hsl(${hue + 18} 80% 52%))`,
      }}
      aria-hidden="true"
    >
      {ch}
    </span>
  );
}

/* ---------- DONUT ---------- */
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

/* ---------- BIỂU ĐỒ XU HƯỚNG (line / bar) — vẽ trên nền gradient ---------- */
export function TrendChart({ points = [], mode = 'line', max = 100, unit = '%', height = 130 }) {
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
          <stop offset="0" stopColor="#fff" stopOpacity=".38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
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

/* ---------- MODAL ---------- */
export function Modal({ title, onClose, size = 'md', children, foot }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="vt-backdrop" onClick={onClose}>
      <div
        className={'vt-modal ' + size}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Hộp thoại'}
        onClick={(e) => e.stopPropagation()}
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
      <p className="vt-confirm-text">{body}</p>
    </Modal>
  );
}

/* ---------- THANH TRÊN: tab nghiêng + search + chuông ---------- */
export function Topbar({
  title, subtitle, tabs, active, onTab, search, onSearch,
  placeholder = 'Tìm kiếm…', bell,
}) {
  return (
    <header className="vt-top">
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
        <div className="vt-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}

      {onSearch && (
        <label className="vt-search">
          <IcoSearch size={16} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
          {search && (
            <button type="button" onClick={() => onSearch('')} aria-label="Xóa tìm kiếm">
              <IcoClose size={12} />
            </button>
          )}
        </label>
      )}

      {bell && (
        <button
          type="button"
          className={'vt-bell' + (bell.on ? ' on' : '')}
          onClick={bell.onClick}
          title={bell.title}
          aria-label={bell.title}
          aria-pressed={bell.pressed}
        >
          {bell.Icon ? <bell.Icon size={19} /> : <IcoBell size={19} />}
        </button>
      )}
    </header>
  );
}

/* ---------- KHUNG CHÍNH ---------- */
export function DashFrame({
  items,
  active,
  onChange,
  onExit,
  exitLabel = 'Về trang chủ',
  sideNote,
  extraNav,
  children,
}) {
  return (
    <div className="vt">
      <div className="vt-frame">
        <aside className="vt-side">
          <BrandMark />
          <nav className="vt-nav" aria-label="Điều hướng">
            {items.map((it) => {
              const I = it.Icon;
              const on = active === it.key;
              return (
                <button
                  key={it.key}
                  type="button"
                  className={'vt-nav-item' + (on ? ' on' : '')}
                  onClick={() => onChange(it.key)}
                  aria-current={on ? 'page' : undefined}
                >
                  <I size={18} />
                  <span>{it.label}</span>
                  {it.badge ? <i className={'vt-nav-badge' + (it.live ? ' live' : '')}>{it.badge}</i> : null}
                </button>
              );
            })}
            {extraNav}
          </nav>
          {sideNote}
          <button type="button" className="vt-exit" onClick={onExit}>
            <IcoArrowLeft size={14} />
            <span>{exitLabel}</span>
          </button>
        </aside>
        <section className="vt-main">{children}</section>
      </div>
    </div>
  );
}