/* ============================================================
   LabKit — component nhỏ cho concept "Hồ sơ nhà khoa học"
   Dùng trong ProfilePage. Không phụ thuộc AuthKit.
   ============================================================ */
import { useId } from 'react';

/* ------------------------------------------------------------
   1) FlaskAvatar — avatar trong bình tam giác, có bọt khí
   ------------------------------------------------------------ */
export function FlaskAvatar({
  photoURL,
  initial = '?',
  color = '#ff4d1a',
  size = 180,
  bubbl = true,
}) {
  const id = useId();
  return (
    <svg
      className="lab-flask"
      viewBox="0 0 200 240"
      width={size}
      height={(size * 240) / 200}
      role="img"
      aria-label="Ảnh đại diện"
    >
      <defs>
        <clipPath id={`flask-clip-${id}`}>
          {/* Miệng bình */}
          <path d="M75 20 h50 v40 L165 200 a20 20 0 0 1 -20 20 H55 a20 20 0 0 1 -20 -20 L75 60 z" />
        </clipPath>
        <radialGradient id={`flask-glow-${id}`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Quầng sáng phía sau */}
      <ellipse cx="100" cy="130" rx="70" ry="80" fill={`url(#flask-glow-${id})`} />

      {/* Chất lỏng đáy bình */}
      <path
        d="M55 200 L75 60 h50 L145 200 Z"
        fill={color}
        opacity="0.18"
      />

      {/* Miệng bình (nắp) */}
      <path
        d="M70 8 h60 v14 h-60 z"
        fill="var(--bg)"
        stroke="var(--ink)"
        strokeWidth="2.5"
      />
      {/* Viền miệng */}
      <rect x="70" y="8" width="60" height="14" fill="none" stroke="var(--ink)" strokeWidth="2.5" />

      {/* Thân bình */}
      <path
        d="M75 22 v40 L20 200 a20 20 0 0 0 20 20 h120 a20 20 0 0 0 20 -20 L125 62 V22"
        fill="var(--bg)"
        stroke="var(--ink)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Avatar bên trong — chỉ hiện trong vùng clip */}
      <g clipPath={`url(#flask-clip-${id})`}>
        {photoURL ? (
          <image
            href={photoURL}
            x="20"
            y="30"
            width="160"
            height="190"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <text
            x="100"
            y="145"
            textAnchor="middle"
            fontFamily="var(--sans)"
            fontSize="80"
            fontWeight="700"
            fill={color}
            opacity="0.9"
          >
            {initial}
          </text>
        )}
      </g>

      {/* Vạch chia độ */}
      {[
        { y: 210, w: 60 },
        { y: 190, w: 70 },
        { y: 170, w: 80 },
      ].map((m, i) => (
        <line
          key={i}
          x1={100 - m.w / 2}
          x2={100 + m.w / 2}
          y1={m.y}
          y2={m.y}
          stroke="var(--ink)"
          strokeWidth="1"
          opacity="0.35"
          strokeDasharray="2 4"
        />
      ))}

      {/* Bọt khí animate */}
      {bubbl && (
        <g className="lab-bubbles">
          {[
            { cx: 75, delay: 0, dur: 3.2 },
            { cx: 92, delay: 1.1, dur: 2.8 },
            { cx: 108, delay: 0.6, dur: 3.6 },
            { cx: 124, delay: 1.8, dur: 3.0 },
          ].map((b, i) => (
            <circle key={i} cx={b.cx} cy={215} r={3} fill="var(--ink)" opacity="0.4">
              <animate
                attributeName="cy"
                values="215;75"
                dur={`${b.dur}s`}
                begin={`${b.delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.5;0"
                dur={`${b.dur}s`}
                begin={`${b.delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="2;4;2"
                dur={`${b.dur}s`}
                begin={`${b.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------
   2) ElementStamp — con dấu VIP xoay nhẹ
   ------------------------------------------------------------ */
export function ElementStamp({ show = false, color = '#ffb020' }) {
  if (!show) return null;
  return (
    <div className="lab-stamp" style={{ '--stamp-color': color }} aria-label="Tài khoản VIP">
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
          <path
            id="stamp-arc"
            d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"
          />
        </defs>
        {/* Vòng ngoài đứt nét */}
        <circle cx="60" cy="60" r="56" fill="none" stroke="var(--stamp-color)" strokeWidth="2" strokeDasharray="3 4" />
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--stamp-color)" strokeWidth="1" />
        {/* Chữ vòng cung */}
        <text
          fontFamily="var(--mono)"
          fontSize="9"
          fontWeight="700"
          fill="var(--stamp-color)"
          letterSpacing="1.5"
        >
          <textPath href="#stamp-arc" startOffset="0">
            ★ CUAI · VIP · CHEMISTRY · A7-K60-DTA · 
          </textPath>
        </text>
        {/* Trung tâm */}
        <circle cx="60" cy="60" r="30" fill="var(--stamp-color)" opacity="0.12" />
        <text x="60" y="66" textAnchor="middle" fontFamily="var(--sans)" fontSize="18" fontWeight="800" fill="var(--stamp-color)">
          VIP
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------
   3) ConcentrationMeter — "Nồng độ" 5 vạch dưới avatar
   ------------------------------------------------------------ */
export function ConcentrationMeter({ value = 0, max = 5, label = 'Nồng độ' }) {
  return (
    <div className="lab-conc" title={`${label}: ${value}/${max}`}>
      <span className="lab-conc-label">{label}</span>
      <span className="lab-conc-bar">
        {Array.from({ length: max }).map((_, i) => (
          <i key={i} className={i < value ? 'on' : ''} />
        ))}
      </span>
      <span className="lab-conc-num">
        {value}/{max}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------
   4) MicroscopeField — ô input kiểu kính hiển vi
   ------------------------------------------------------------ */
export function MicroscopeField({
  id,
  label,
  hint,
  right,
  valid,
  locked,
  children,
}) {
  return (
    <div className={'lab-micro' + (valid ? ' valid' : '') + (locked ? ' locked' : '')}>
      <div className="lab-micro-bar">
        <span className="lab-micro-label">{label}</span>
        {locked && <span className="lab-micro-lock">🔒 không thể sửa</span>}
      </div>
      <div className="lab-micro-body">
        {/* Dấu crosshair 4 góc */}
        <span className="lab-crosshair tl" />
        <span className="lab-crosshair tr" />
        <span className="lab-crosshair bl" />
        <span className="lab-crosshair br" />

        <div className="lab-micro-input">
          {children}
          {right && <div className="lab-micro-right">{right}</div>}
        </div>
      </div>
      {hint && <p className="lab-micro-hint">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------
   5) DrawerTab — nút ngăn kéo
   ------------------------------------------------------------ */
export function DrawerTab({ active, icon, label, onClick, badge }) {
  return (
    <button
      type="button"
      className={'lab-drawer-tab' + (active ? ' on' : '')}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="lab-drawer-icon">{icon}</span>
      <span className="lab-drawer-label">{label}</span>
      {badge && <span className="lab-drawer-badge">{badge}</span>}
    </button>
  );
}

/* ------------------------------------------------------------
   6) EmergencyStop — nút đăng xuất kiểu nút dừng khẩn cấp
   ------------------------------------------------------------ */
export function EmergencyStop({ onClick }) {
  return (
    <button type="button" className="lab-stop" onClick={onClick}>
      <span className="lab-stop-ring" aria-hidden="true" />
      <span className="lab-stop-face">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      <span className="lab-stop-text">
        <b>DỪNG KHẨN CẤP</b>
        <small>đăng xuất khỏi thiết bị</small>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------
   7) ReactionArrow — mũi tên phản ứng giữa 2 field
   ------------------------------------------------------------ */
export function ReactionArrow({ label = '' }) {
  return (
    <div className="lab-arrow">
      <svg viewBox="0 0 80 24" width="80" height="24" aria-hidden="true">
        <line x1="4" y1="12" x2="60" y2="12" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M60 6 L74 12 L60 18 Z" fill="var(--ink)" />
      </svg>
      {label && <small>{label}</small>}
    </div>
  );
}

/* ------------------------------------------------------------
   8) LabSection — tiêu đề section có đường kẻ đứt
   ------------------------------------------------------------ */
export function LabSection({ title, subtitle, action, children }) {
  return (
    <section className="lab-section">
      <header className="lab-section-head">
        <div>
          <h2 className="lab-section-title">
            <span className="lab-section-mark" aria-hidden="true">▼</span>
            {title}
          </h2>
          {subtitle && <p className="lab-section-sub">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="lab-section-body">{children}</div>
    </section>
  );
}