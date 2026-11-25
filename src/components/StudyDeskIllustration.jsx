/* ============================================================
   StudyDeskIllustration.jsx — Minh họa Góc Bàn Học Tập Trung Cao Cấp
   - Đang học (isActive=true): Cửa sổ vòm ấm + Đèn kiến trúc bật sáng vàng +
     Vệt sáng phản chiếu mặt bàn + Sổ mở + Cốc trà bốc khói + Bàn gỗ sồi có ngăn kéo
   - Vắng / Chờ phiên (isActive=false): Tông xám thanh lịch + Đèn tắt dịu mắt
   - Bé Elec ngồi tự nhiên không khung vuông phía sau mặt bàn
   ============================================================ */

import { useId } from 'react';

export default function StudyDeskIllustration({
  isActive = false,
  mascotSrc = '/img/elec/elec-fighting.png',
  photoURL = null,
  name = 'Bạn',
  preferMascot = true,
  size = 'md', // 'lg' (hero) | 'md' (grid card)
}) {
  const uid = useId().replace(/:/g, '');
  const showAvatar = !preferMascot && Boolean(photoURL);
  const initial = (name || 'B').trim().charAt(0).toUpperCase();

  return (
    <div className={`fs9-desk-scene is-${size} ${isActive ? 'is-lit' : 'is-dim'}`}>
      {/* Cửa sổ vòm góc học tập phía sau Bé Elec */}
      <div className="fs9-desk-arch" aria-hidden="true">
        {isActive && (
          <svg viewBox="0 0 120 84" className="fs9-desk-arch-stars" fill="none">
            <circle cx="24" cy="22" r="1.8" fill="#fef08a" fillOpacity="0.9" />
            <circle cx="94" cy="18" r="1.4" fill="#fde68a" fillOpacity="0.85" />
            <circle cx="84" cy="34" r="1.2" fill="#ffffff" fillOpacity="0.7" />
            <circle cx="34" cy="38" r="1.1" fill="#fde68a" fillOpacity="0.65" />
          </svg>
        )}
      </div>

      {/* Người học / Linh vật Bé Elec ngồi sau bàn học */}
      <div className="fs9-desk-sitter">
        {showAvatar ? (
          <img src={photoURL} alt={name} className="fs9-desk-avatar" draggable={false} />
        ) : mascotSrc ? (
          <img src={mascotSrc} alt={name} className="fs9-desk-elec-img" draggable={false} />
        ) : (
          <span className="fs9-desk-initial">{initial}</span>
        )}
      </div>

      {/* Bàn học gỗ sồi + Đèn bàn kiến trúc + Sổ mở + Cốc nước + Ngăn kéo */}
      <svg
        viewBox="0 0 240 124"
        className="fs9-desk-svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`lampBeam-${uid}`} x1="60" y1="26" x2="88" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.72" />
            <stop offset="60%" stopColor="#fde68a" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`woodTop-${uid}`} x1="16" y1="74" x2="224" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf77" />
            <stop offset="50%" stopColor="#ea8c44" />
            <stop offset="100%" stopColor="#d9722d" />
          </linearGradient>
          <linearGradient id={`woodFront-${uid}`} x1="16" y1="86" x2="224" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c96424" />
            <stop offset="100%" stopColor="#9c4314" />
          </linearGradient>
          <linearGradient id={`greyTop-${uid}`} x1="16" y1="74" x2="224" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id={`greyFront-${uid}`} x1="16" y1="86" x2="224" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>

        {/* Vệt sáng ấm từ đèn bàn chiếu xuống mặt bàn */}
        {isActive && (
          <>
            <polygon points="61,30 112,79 34,79" fill={`url(#lampBeam-${uid})`} />
            <ellipse cx="74" cy="78" rx="32" ry="4.5" fill="#fef08a" fillOpacity="0.45" />
          </>
        )}

        {/* Đèn học kiến trúc bên trái */}
        <path
          d="M42 75 L38 51 L55 27"
          stroke={isActive ? '#d97706' : '#64748b'}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="38" cy="51" r="2.8" fill={isActive ? '#fbbf24' : '#94a3b8'} />
        <ellipse cx="42" cy="76" rx="12" ry="3.4" fill={isActive ? '#b45309' : '#64748b'} />
        <path
          d="M49 21 L65 29 L58 37 L44 29 Z"
          fill={isActive ? '#f59e0b' : '#94a3b8'}
        />
        <circle cx="60" cy="31" r="3.4" fill={isActive ? '#fef9c3' : '#cbd5e1'} />

        {/* Cốc bút bên trái */}
        <rect
          x="64"
          y="63"
          width="11"
          height="13"
          rx="3"
          fill={isActive ? '#3b82f6' : '#94a3b8'}
        />
        <line x1="67.5" y1="63" x2="66" y2="56" stroke={isActive ? '#fbbf24' : '#64748b'} strokeWidth="2" strokeLinecap="round" />
        <line x1="71.5" y1="63" x2="73" y2="57" stroke={isActive ? '#f43f5e' : '#64748b'} strokeWidth="2" strokeLinecap="round" />

        {/* Cuốn sổ mở giữa mặt bàn */}
        <path
          d="M92 75 Q106 71 120 75 Q134 71 148 75 L146 79 L94 79 Z"
          fill={isActive ? '#fffbeb' : '#e2e8f0'}
          stroke={isActive ? '#d97706' : '#94a3b8'}
          strokeWidth="1.2"
        />
        <line x1="120" y1="74" x2="120" y2="79" stroke={isActive ? '#b45309' : '#64748b'} strokeWidth="1" />

        {/* Chồng sách giáo khoa bên phải */}
        <rect x="157" y="67" width="36" height="8" rx="2.5" fill={isActive ? '#e11d48' : '#94a3b8'} />
        <rect x="160" y="60" width="31" height="7" rx="2.2" fill={isActive ? '#f59e0b' : '#cbd5e1'} />
        <rect x="162" y="69" width="26" height="2" rx="1" fill="#ffffff" fillOpacity="0.65" />

        {/* Cốc trà / cà phê nhỏ bốc khói ấm bên góc phải */}
        <rect x="197" y="66" width="12" height="10" rx="3" fill={isActive ? '#ffffff' : '#cbd5e1'} />
        <path
          d="M209 68 C213 68 213 73 209 73"
          stroke={isActive ? '#ffffff' : '#cbd5e1'}
          strokeWidth="2"
          fill="none"
        />
        {isActive && (
          <g className="fs9-desk-steam" stroke="#fde68a" strokeWidth="1.4" strokeLinecap="round" opacity="0.8">
            <path d="M201 63 Q200 59 202 56" />
            <path d="M205 62 Q206 58 204 55" />
          </g>
        )}

        {/* Bóng đổ dưới chân bàn */}
        <ellipse cx="120" cy="117" rx="94" ry="5" fill="#0f172a" fillOpacity={isActive ? '0.18' : '0.11'} />

        {/* Hai chân bàn thuôn gọn */}
        <path d="M38 92 L49 92 L47 115 Q47 117 44 117 L41 117 Q39 117 39 115 Z" fill={isActive ? '#8c3b11' : '#64748b'} />
        <path d="M191 92 L202 92 L201 115 Q201 117 199 117 L196 117 Q193 117 193 115 Z" fill={isActive ? '#8c3b11' : '#64748b'} />

        {/* Thanh ngăn kéo giữa dưới bàn */}
        <rect x="64" y="92" width="112" height="11" rx="3.5" fill={isActive ? '#a84b19' : '#7c8ca1'} />
        <rect x="108" y="96.5" width="24" height="2.6" rx="1.3" fill={isActive ? '#fde68a' : '#cbd5e1'} />

        {/* Mặt bàn gỗ sồi chính */}
        <rect
          x="16"
          y="75"
          width="208"
          height="13"
          rx="6.5"
          fill={isActive ? `url(#woodTop-${uid})` : `url(#greyTop-${uid})`}
        />
        {/* Cạnh trước mặt bàn */}
        <rect
          x="20"
          y="85"
          width="200"
          height="9"
          rx="4.2"
          fill={isActive ? `url(#woodFront-${uid})` : `url(#greyFront-${uid})`}
        />
        {/* Đường phản chiếu mép bàn */}
        <rect
          x="28"
          y="77.5"
          width="184"
          height="2.2"
          rx="1.1"
          fill="#ffffff"
          fillOpacity={isActive ? '0.36' : '0.32'}
        />
      </svg>
    </div>
  );
}
