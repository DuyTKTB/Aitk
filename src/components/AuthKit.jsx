/* ============================================================
   AuthKit — bộ SVG inline dùng chung cho LoginPage / ProfilePage
   Không dùng emoji, không dùng icon font.
   ============================================================ */

const P = {
  /* ===== MẶT / HIỂN THỊ ===== */
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.5 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),

  /* ===== TRẠNG THÁI ===== */
  check: <path className="gl-draw" pathLength="1" d="M4 12.5l5 5L20 6.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  alert: (
    <>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5M12 18.2v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v6M12 7.5v.1" />
    </>
  ),
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,

  /* ===== NGƯỜI DÙNG / BẢO MẬT ===== */
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 20v-1a5 5 0 0 0-4-4.9" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2L21 2M17 6l2 2M14 9l2 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 21.5s8-3.8 8-10V5l-8-2.5L4 5v6.5c0 6.2 8 10 8 10z" />
      <path d="M8.5 12l2.5 2.5L16 9.5" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 3a9 9 0 0 0-9 9M21 12a9 9 0 0 0-4.5-7.8" />
      <path d="M5 12a7 7 0 0 1 14 0v2M8 12a4 4 0 0 1 8 0v3M11 12a1 1 0 0 1 2 0v5" />
      <path d="M5 15v1M19 15v2" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),

  /* ===== THƯ / EMAIL ===== */
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7l8.5 6.5L20.5 7" />
    </>
  ),

  /* ===== VIP / GÓI ===== */
  crown: <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />,
  star: <polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5 12 2" />,
  gem: (
    <>
      <path d="M6 3h12l3 6-9 12L3 9l3-6z" />
      <path d="M3 9h18M9 3l-1 6 4 12 4-12-1-6" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 2s4 3 4 9-4 11-4 11-4-5-4-11 4-9 4-9z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M6 16c-2 1-3 3-3 5 2 0 4-1 5-3M18 16c2 1 3 3 3 5-2 0-4-1-5-3" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v5M9 21h6M10 18h4" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" />
      <path d="M4 12v9h16v-9M12 8v13" />
      <path d="M12 8s-1-5-4-5a2.5 2.5 0 0 0 0 5h4zM12 8s1-5 4-5a2.5 2.5 0 0 1 0 5h-4z" />
    </>
  ),
  creditCard: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M7 15h3" />
    </>
  ),

  /* ===== HÓA HỌC ===== */
  flask: (
    <>
      <path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  beaker: (
    <>
      <path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  atom: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </>
  ),
  microscope: (
    <>
      <path d="M6 21h12M9 21v-3M15 21v-3" />
      <path d="M12 18a6 6 0 0 0 0-12" />
      <path d="M9 6l3-3 3 3-3 3z" />
      <path d="M15 12l3 3-2 2" />
    </>
  ),
  robot: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 7V3M8 12h.01M16 12h.01M9 16h6" />
      <circle cx="12" cy="3" r="1.5" />
    </>
  ),

  /* ===== HÀNH ĐỘNG ===== */
  refresh: <path d="M20 11a8 8 0 0 0-14.3-4.5L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.5l1.7-2M20 20v-4.5h-4.5" />,
  download: <path d="M12 3v12M7 10.5l5 5 5-5M4 20h16" />,
  upload: <path d="M12 16V4M7 8.5l5-5 5 5M4 20h16" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.5-2h5L16 6h2.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-9z" />
      <circle cx="12" cy="13" r="3.8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11A1.7 1.7 0 0 0 8.97 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11A1.7 1.7 0 0 0 4.7 8.97a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.11A1.7 1.7 0 0 0 15.03 4.7a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.11A1.7 1.7 0 0 0 19.4 15z" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),

  /* ===== ẢNH / CHỈNH SỬA ===== */
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  verified: (
    <>
      <path d="M12 1.5l2.9 2.3 3.7-.3 1 3.6 3 2.2-1.3 3.5 1.3 3.5-3 2.2-1 3.6-3.7-.3L12 22.5l-2.9-2.3-3.7.3-1-3.6-3-2.2 1.3-3.5-1.3-3.5 3-2.2 1-3.6 3.7.3L12 1.5z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),

  /* ===== ĐIỀU HƯỚNG ===== */
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5c2.5 2.7 2.5 16.3 0 19M12 2.5c-2.5 2.7-2.5 16.3 0 19" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  facebook: <path d="M14 8.5V7c0-.8.6-1.5 1.5-1.5H17V2.5h-2.5A4.5 4.5 0 0 0 10 7v1.5H7V12h3v10h4V12h2.7l.3-3.5H14z" />,

  /* ===== THỜI GIAN ===== */
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),

  /* ===== GIAO DIỆN ===== */
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 15.5A8 8 0 0 1 8.5 4a8 8 0 1 0 11.5 11.5z" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  drawer: (
    <>
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <rect x="3" y="11" width="18" height="5" rx="1" />
      <rect x="3" y="18" width="18" height="3" rx="1" />
    </>
  ),
  stop: (
    <>
      <circle cx="12" cy="12" r="10" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
    </>
  ),

  /* ===== DỮ LIỆU ===== */
  database: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21h18" />
      <rect x="5" y="12" width="3.5" height="7" />
      <rect x="10.5" y="8" width="3.5" height="11" />
      <rect x="16" y="4" width="3.5" height="15" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  flame: <path d="M12 22c4 0 7-2.8 7-6.8 0-3.3-2-5.3-3.5-7-.4 1.6-1.3 2.6-2.3 3 .3-3.4-1.3-6.4-4.2-8.2.2 3.3-1.2 5-2.6 6.8C5 11.5 5 13.2 5 15.2 5 19.2 8 22 12 22z" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  warning: (
    <>
      <path d="M10.3 3.9l-8 13.8A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.3l-8-13.8a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17.2v.1" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <path d="M12 17.2v.1" />
    </>
  ),
};

export default function Glyph({ name, size = 18, className = '', title, strokeWidth = 2, ...rest }) {
  return (
    <svg
      className={'gl ' + className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      {...rest}
    >
      {title && <title>{title}</title>}
      {P[name] || null}
    </svg>
  );
}

/* Logo Google nhiều màu — dùng riêng cho nút "Đăng nhập Google" */
export function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/* Logo Facebook xanh — dùng riêng cho nút "Đăng nhập Facebook" */
export function FacebookMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07Z" />
    </svg>
  );
}

/* Độ mạnh mật khẩu: 0 (quá ngắn) → 4 (mạnh) */
export function pwStrength(pw = '') {
  if (pw.length < 6) return 0;
  let s = 1;
  if (pw.length >= 10) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
export const STRENGTH_LABELS = ['Quá ngắn', 'Yếu', 'Tạm được', 'Khá tốt', 'Mạnh'];

/* Thanh độ mạnh mật khẩu */
export function PasswordStrength({ strength }) {
  return (
    <div className="lx-strength">
      <div className="lx-meter" data-s={strength}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < strength ? 'on' : ''} />
        ))}
      </div>
      <span className="lx-meter-label">{STRENGTH_LABELS[strength]}</span>
    </div>
  );
}

/* Field input có floating label + slot phải */
export function Field({ id, label, type = 'text', value, onChange, right, valid, tab = 0, ...rest }) {
  return (
    <div className={'lx-field' + (valid ? ' valid' : '')}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        tabIndex={tab}
        {...rest}
      />
      <label htmlFor={id}>{label}</label>
      {right && <div className="lx-right">{right}</div>}
    </div>
  );
}