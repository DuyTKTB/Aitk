import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

/* ============================================================
   ToolsKit — tiện ích dùng chung cho ToolsPage + PromptLibrary
   ============================================================ */

// ---------- Lưu localStorage an toàn ----------
export function useStored(key, init) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : init;
    } catch { return init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* bị chặn */ }
  }, [key, v]);
  return [v, setV];
}

// ---------- Chuẩn hóa tìm không dấu ----------
export const norm = (s) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

export const stripLead = (s) => String(s).replace(/^[^\p{L}\p{N}\s]+\s*/u, '');

// ---------- Sao chép ----------
export async function copyText(t) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

// ---------- Toast ----------
export function useToast() {
  const [msg, setMsg] = useState('');
  const t = useRef(0);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(''), 2200);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  const node = <div className={'tk-toast' + (msg ? ' on' : '')} role="status" aria-live="polite">{msg}</div>;
  return [show, node];
}

// ---------- Icon nhỏ ----------
const svg = (children, size = 18, fill = 'none') => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
export const IcoCopy = ({ size }) => svg(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>, size);
export const IcoCheck = ({ size }) => svg(<path d="M5 12.5l4.5 4.5L19 7.5" />, size);
export const IcoClose = ({ size }) => svg(<path d="M6 6l12 12M18 6L6 18" />, size);
export const IcoShuffle = ({ size }) => svg(<><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></>, size);
export const IcoStar = ({ size, on }) =>
  svg(<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5z" />, size, on ? 'currentColor' : 'none');
export const IcoSpark = ({ size }) => svg(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />, size);
export const IcoImage = ({ size }) => svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-9 9" /></>, size);
export const IcoCompare = ({ size }) => svg(<><path d="M3 6h7M14 6h7M3 18h7M14 18h7" /><path d="M10 3v18M14 3v18" /></>, size);
export const IcoShare = ({ size }) => svg(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="10.7" x2="15.4" y2="6.3" /><line x1="8.6" y1="13.3" x2="15.4" y2="17.7" /></>, size);
export const IcoSort = ({ size }) => svg(<><path d="M3 6h18M6 12h12M10 18h4" /></>, size);

// ---------- Màu + kiểu hình mẫu ----------
export const CAT_ART = {
  chat: [235, 'bubbles'], write: [330, 'lines'], image: [40, 'scene'], video: [215, 'scene'],
  audio: [280, 'chart'], study: [145, 'molecule'], code: [200, 'code'], trans: [50, 'bubbles'],
  search: [170, 'lines'], work: [25, 'chart'], biz: [8, 'chart'], agent: [245, 'molecule'],
  model: [95, 'molecule'], fun: [320, 'blobs'], game: [265, 'blobs'],
};

// ---------- Hình mẫu SVG ----------
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
const rng = (seed) => {
  let a = hash(String(seed));
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const hsl = (h, s, l, a = 1) => `hsla(${Math.round(h) % 360}, ${s}%, ${l}%, ${a})`;

function shapes(kind, r, h1, h2) {
  const o = [];
  switch (kind) {
    case 'scene': {
      o.push(<circle key="sun" cx={70 + r() * 190} cy={48 + r() * 22} r={20 + r() * 10} fill={hsl(h2, 100, 82, 0.95)} />);
      for (let i = 0; i < 3; i += 1) {
        const b = 104 + r() * 14 + i * 22;
        o.push(<path key={'h' + i} d={`M0 180V${b}Q${60 + r() * 60} ${b - 36 - r() * 14} 160 ${b - 6}T320 ${b - 10}V180Z`} fill={hsl(h1 + i * 14, 55, 27 - i * 6, 0.96)} />);
      }
      break;
    }
    case 'molecule': {
      const pts = Array.from({ length: 7 }, () => [38 + r() * 244, 28 + r() * 124]);
      pts.forEach((p, i) => {
        const q = pts[i ? i - 1 : 6];
        o.push(<line key={'e' + i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="rgba(255,255,255,.5)" strokeWidth="2.5" />);
      });
      o.push(<line key="ex" x1={pts[1][0]} y1={pts[1][1]} x2={pts[4][0]} y2={pts[4][1]} stroke="rgba(255,255,255,.35)" strokeWidth="2" />);
      pts.forEach((p, i) => o.push(<circle key={'n' + i} cx={p[0]} cy={p[1]} r={7 + r() * 9} fill={hsl(h2 + i * 9, 85, i % 2 ? 80 : 66, 0.96)} />));
      break;
    }
    case 'code': {
      for (let i = 0; i < 7; i += 1) {
        const ind = (i % 3) * 14 * (r() > 0.35 ? 1 : 0);
        o.push(<rect key={'c' + i} x={24 + ind} y={24 + i * 20} width={50 + r() * 150} height="9" rx="4.5"
          fill={i % 3 === 0 ? hsl(h2, 85, 76, 0.9) : hsl(h1 + 24, 40, 92, 0.72)} />);
      }
      break;
    }
    case 'chart': {
      let d = '';
      for (let i = 0; i < 8; i += 1) {
        const h = 22 + (i / 8) * 76 + r() * 34;
        o.push(<rect key={'b' + i} x={26 + i * 35} y={162 - h} width="22" height={h} rx="5" fill="rgba(255,255,255,.72)" />);
        d += `${i ? 'L' : 'M'}${37 + i * 35} ${150 - h}`;
      }
      o.push(<path key="tr" d={d} fill="none" stroke={hsl(h2, 100, 80)} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />);
      break;
    }
    case 'lines': {
      o.push(<rect key="t" x="26" y="26" width={90 + r() * 70} height="14" rx="7" fill="rgba(255,255,255,.92)" />);
      for (let i = 0; i < 6; i += 1) {
        o.push(<rect key={'l' + i} x="26" y={58 + i * 17} width={i === 5 ? 90 : 190 + r() * 80} height="8" rx="4" fill="rgba(255,255,255,.5)" />);
      }
      break;
    }
    case 'bubbles': {
      o.push(<rect key="a" x="24" y="26" width="176" height="52" rx="16" fill="rgba(255,255,255,.88)" />);
      o.push(<rect key="a1" x="40" y="44" width={90 + r() * 40} height="8" rx="4" fill={hsl(h1, 40, 45, 0.55)} />);
      o.push(<rect key="b" x="120" y="98" width="176" height="52" rx="16" fill={hsl(h2, 90, 64, 0.95)} />);
      o.push(<rect key="b1" x="138" y="116" width={80 + r() * 50} height="8" rx="4" fill="rgba(255,255,255,.75)" />);
      break;
    }
    default: {
      for (let i = 0; i < 4; i += 1) {
        o.push(<circle key={'r' + i} cx={60 + r() * 200} cy={30 + r() * 120} r={16 + r() * 34} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2.5" />);
      }
    }
  }
  return o;
}

export function Art({ seed, hue, kind = 'blobs', src, ratio = '16 / 9', className = '', children }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [bad, setBad] = useState(false);
  const art = useMemo(() => {
    const r = rng(seed);
    const h1 = hue ?? hash(String(seed)) % 360;
    const h2 = h1 + 38 + Math.floor(r() * 40);
    return (
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={'g' + uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={hsl(h1, 70, 19)} />
            <stop offset="1" stopColor={hsl(h2, 75, 35)} />
          </linearGradient>
          <filter id={'b' + uid} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <rect width="320" height="180" fill={`url(#g${uid})`} />
        <g filter={`url(#b${uid})`}>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={r() * 320} cy={r() * 180} r={50 + r() * 40} fill={hsl(h1 + i * 30, 95, 58, 0.5)} />
          ))}
        </g>
        {shapes(kind, r, h1, h2)}
      </svg>
    );
  }, [seed, hue, kind, uid]);

  return (
    <div className={'tk-art ' + className} style={{ aspectRatio: ratio }}>
      {art}
      {src && !bad && <img src={src} alt="" loading="lazy" onError={() => setBad(true)} />}
      {children && <div className="tk-art-over">{children}</div>}
    </div>
  );
}

// ============================================================
// LOGO — favicon cho web thường, AIMark cho CUAI
// ============================================================
export function Logo({ domain, Fallback, size = 44, CuaiLogo }) {
  const [bad, setBad] = useState(false);
  const host = String(domain).split('/')[0];

  // CUAI → dùng logo AI sống động của web
  if (domain === 'A7 K60 DTA' && CuaiLogo) {
    return (
      <span className="tk-logo tk-logo-cuai" style={{ width: size, height: size }}>
        <CuaiLogo size={Math.round(size * 0.72)} animate={false} mode="idle" />
      </span>
    );
  }

  return (
    <span className="tk-logo" style={{ width: size, height: size }}>
      {!bad ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
          alt="" loading="lazy" width={Math.round(size * 0.58)} height={Math.round(size * 0.58)}
          onError={() => setBad(true)}
        />
      ) : Fallback ? <Fallback size={Math.round(size * 0.5)} /> : null}
    </span>
  );
}

// ============================================================
// RATING
// ============================================================
export function Rating({ value = 0, size = 'md', showNumber = false }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(value));
  return (
    <span className={`rating rating-${size}`} title={`${value}/5 sao`}>
      <span className="rating-stars">
        {stars.map((filled, i) => (
          <svg key={i} width={size === 'sm' ? 12 : 14} height={size === 'sm' ? 12 : 14} viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5z" />
          </svg>
        ))}
      </span>
      {showNumber && <span className="rating-num">{value.toFixed(1)}</span>}
    </span>
  );
}

// ============================================================
// PRICE BADGE
// ============================================================
export function PriceBadge({ price = 'freemium' }) {
  const META = {
    free: { label: 'Miễn phí', cls: 'free' },
    freemium: { label: 'Freemium', cls: 'freemium' },
    paid: { label: 'Trả phí', cls: 'paid' },
    vip: { label: '👑 Siêu VIP', cls: 'vip' },
  };
  const m = META[price] || META.freemium;
  return <span className={'price-badge ' + m.cls}>{m.label}</span>;
}

// ============================================================
// COMPARE BAR
// ============================================================
export function CompareBar({ items = [], onRemove, onClear, onOpen }) {
  if (items.length === 0) return null;
  return (
    <div className="compare-bar-v2" role="region" aria-label="So sánh công cụ">
      <div className="compare-bar-items">
        {items.map((t) => (
          <div key={t.id} className="compare-bar-item">
            <span>{t.name}</span>
            <button type="button" onClick={() => onRemove(t.id)} aria-label={`Bỏ ${t.name}`}>×</button>
          </div>
        ))}
        {items.length < 2 && <span className="compare-bar-hint">Chọn thêm để so sánh</span>}
      </div>
      <div className="compare-bar-actions">
        <button type="button" className="compare-btn ghost" onClick={onClear}>Xóa hết</button>
        <button type="button" className="compare-btn primary" onClick={() => onOpen(items)} disabled={items.length < 2}>
          So sánh ({items.length})
        </button>
      </div>
    </div>
  );
}

// ============================================================
// QUICK VIEW
// ============================================================
export function QuickView({ tool, meta, compare, onClose, onFav, isFav, onCopy, onShare, CuaiLogo }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  if (!tool) return null;

  const isCuai = tool.id === 'cuai' || tool.internal;

  const handleOpen = (e) => {
    if (isCuai) {
      e.preventDefault();
      window.location.hash = 'ai';
      ref.current?.close();
    }
  };

  return (
    <dialog
      ref={ref}
      className="quickview-dialog"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className={'quickview' + (isCuai ? ' quickview-cuai' : '')}>
        <button type="button" className="quickview-x" onClick={() => ref.current.close()} aria-label="Đóng">×</button>

        <header className="quickview-head">
          <div className="quickview-logo">
            <Logo domain={tool.domain} size={56} CuaiLogo={CuaiLogo} />
          </div>
          <div className="quickview-title">
            <h2>
              {tool.name}
              {isCuai && <span className="cuai-badge-inline">👑 Siêu VIP</span>}
            </h2>
            <span className="quickview-domain">{tool.domain}</span>
            {meta?.rating && <Rating value={meta.rating} showNumber />}
          </div>
        </header>

        <p className="quickview-desc">{tool.desc}</p>

        {meta && (
          <>
            {meta.why && (
              <div className="quickview-section">
                <b>Vì sao nên dùng</b>
                <p>{meta.why}</p>
              </div>
            )}

            {meta.bestFor?.length > 0 && (
              <div className="quickview-section">
                <b>Phù hợp với</b>
                <ul>{meta.bestFor.map((b, i) => <li key={i}>{b}</li>)}</ul>
              </div>
            )}

            <div className="quickview-meta-row">
              <PriceBadge price={meta.price} />
              {meta.freeTier && <span className="hot-tag free">Có bản free</span>}
              {meta.vnSupport && <span className="hot-tag vn">Tiếng Việt tốt</span>}
              {isCuai && <span className="hot-tag official">Chính chủ</span>}
            </div>

            {meta.pros?.length > 0 && (
              <div className="quickview-pros-cons">
                <div>
                  <b className="pros-label">Ưu điểm</b>
                  <ul>{meta.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
                {meta.cons?.length > 0 && (
                  <div>
                    <b className="cons-label">Nhược điểm</b>
                    <ul>{meta.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {compare && compare.length > 1 && (
              <div className="quickview-compare">
                <b>Đang so sánh với</b>
                <div className="quickview-compare-list">
                  {compare.filter((c) => c.id !== tool.id).map((c) => (
                    <span key={c.id}>{c.name}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="quickview-actions">
          <a
            href={isCuai ? '#ai' : tool.url}
            target={isCuai ? undefined : '_blank'}
            rel={isCuai ? undefined : 'noopener noreferrer'}
            className="quickview-btn primary"
            onClick={handleOpen}
          >
            {isCuai ? 'Dùng ngay →' : 'Mở công cụ ↗'}
          </a>
          <button type="button" className={'quickview-btn' + (isFav ? ' on' : '')} onClick={onFav}>
            {isFav ? '★ Đã lưu' : '☆ Lưu'}
          </button>
          <button type="button" className="quickview-btn" onClick={onCopy}>Sao chép link</button>
          <button type="button" className="quickview-btn" onClick={onShare}>Chia sẻ</button>
        </div>
      </div>
    </dialog>
  );
}