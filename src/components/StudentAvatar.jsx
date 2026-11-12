import { memo } from 'react';
import UserAvatar from './UserAvatar.jsx';

/**
 * StudentAvatar — Avatar hình nhân vật học sinh vector SVG cao cấp
 * Dành cho người dùng khác trong cộng đồng và lớp học khi chưa tải ảnh chân dung riêng:
 * - 100% SVG thuần, không phụ thuộc tài nguyên ngoài
 * - Tự động tạo kiểu tóc, khuôn mặt, biểu cảm học sinh sinh động theo tên / uid
 * - Nếu là tài khoản Admin/User TK hoặc Duy -> tự động dùng UserAvatar (Logo Vương miện TK)
 * - Nếu có photoURL hợp lệ -> hiển thị ảnh chân dung thật
 */
function hashStr(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

const PALETTES = [
  ['#ec4899', '#f43f5e'], // Hồng hoa đào
  ['#f97316', '#fbbf24'], // Cam nắng ấm
  ['#0284c7', '#38bdf8'], // Xanh biển
  ['#8b5cf6', '#a855f7'], // Tím thạch anh
  ['#10b981', '#14b8a6'], // Xanh ngọc
  ['#6366f1', '#8b5cf6'], // Lam đậm
  ['#d97706', '#f59e0b'], // Vàng mật
  ['#059669', '#34d399'], // Xanh lá
];

function StudentAvatar({
  name = '',
  uid = '',
  photoURL = null,
  size = 32,
  className = '',
  style = {},
  onClick = undefined,
  title = '',
}) {
  const normName = String(name || '').trim();
  const upper = normName.toUpperCase();

  // 1. Nếu là tài khoản của bạn (ADMIN TK, Duy, TK, hoặc người dùng hiện tại) -> Dùng UserAvatar logo vương miện TK
  const isMe =
    upper.includes('TK') ||
    upper.includes('DUY') ||
    upper.startsWith('ADMIN') ||
    normName === 'Bạn' ||
    (typeof window !== 'undefined' && uid && uid === (window.__elecAuthUid || localStorage.getItem('elec_auth_uid')));

  if (isMe) {
    return (
      <UserAvatar
        photoURL={photoURL}
        size={size}
        className={className}
        style={style}
        onClick={onClick}
        title={title || normName}
      />
    );
  }

  // 2. Nếu người dùng có ảnh chân dung riêng đã tải lên
  if (photoURL && typeof photoURL === 'string' && !photoURL.includes('placeholder')) {
    return (
      <img
        src={photoURL}
        alt={title || normName || 'Học sinh'}
        title={title || normName || 'Học sinh'}
        className={`ns9-student-avatar-img ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
          ...style,
        }}
        onClick={onClick}
      />
    );
  }

  // 3. Avatar nhân vật học sinh chuẩn Vector SVG sắc nét
  const seed = String(uid || normName || 'student');
  const h = hashStr(seed);
  const [bg1, bg2] = PALETTES[h % PALETTES.length];
  const preset = h % 4;
  const hasGlasses = (h >> 2) % 3 === 0;

  return (
    <div
      className={`ns9-student-svg-avatar ${className}`}
      title={title || normName || 'Học sinh'}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        ...style,
      }}
      onClick={onClick}
      aria-label={title || normName || 'Avatar học sinh'}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        {/* Vai & Áo đồng phục học sinh */}
        <path d="M14 62 C16 48, 24 44, 32 44 C40 44, 48 48, 50 62 Z" fill="#ffffff" opacity="0.95" />
        <path d="M28 44 L32 50 L36 44 Z" fill="#e2e8f0" />

        {/* Cổ áo */}
        <rect x="28" y="38" width="8" height="8" rx="2" fill="#ffd1b3" />

        {/* Khuôn mặt */}
        <circle cx="32" cy="27" r="13" fill="#ffe0cc" />

        {/* Má hồng hào tươi tắn */}
        <circle cx="23" cy="29" r="2.2" fill="#fca5a5" opacity="0.65" />
        <circle cx="41" cy="29" r="2.2" fill="#fca5a5" opacity="0.65" />

        {/* Mắt hoặc Kính trí tuệ */}
        {hasGlasses ? (
          <g>
            <circle cx="26" cy="26" r="4.2" stroke="#1e293b" strokeWidth="1.3" fill="none" />
            <circle cx="38" cy="26" r="4.2" stroke="#1e293b" strokeWidth="1.3" fill="none" />
            <line x1="30.2" y1="26" x2="33.8" y2="26" stroke="#1e293b" strokeWidth="1.3" />
            <circle cx="26" cy="26" r="1.5" fill="#1e293b" />
            <circle cx="38" cy="26" r="1.5" fill="#1e293b" />
          </g>
        ) : (
          <g>
            <circle cx="26" cy="26" r="1.8" fill="#1e293b" />
            <circle cx="38" cy="26" r="1.8" fill="#1e293b" />
          </g>
        )}

        {/* Nụ cười vui tươi */}
        <path d="M29 32 Q32 35 35 32" stroke="#1e293b" strokeWidth="1.4" strokeLinecap="round" fill="none" />

        {/* Kiểu tóc học sinh đa dạng */}
        {preset === 0 && (
          <g>
            <path d="M19 25 C19 14, 45 14, 45 25 C45 32, 42 34, 42 34 C42 34, 41 20, 32 20 C23 20, 22 34, 22 34 C22 34, 19 32, 19 25 Z" fill="#33241b" />
            <path d="M20 22 C24 16, 40 16, 44 22 C41 18, 35 18, 32 20 C29 18, 23 18, 20 22 Z" fill="#4a3528" />
            <circle cx="41" cy="21" r="2.2" fill="#fbbf24" />
          </g>
        )}

        {preset === 1 && (
          <g>
            <path d="M19 24 C19 15, 26 13, 33 14 C40 15, 45 18, 45 24 C45 24, 43 19, 36 18 C28 17, 21 21, 19 24 Z" fill="#1e293b" />
            <path d="M18 24 C18 19, 21 16, 27 15 C23 18, 21 21, 20 26 Z" fill="#334155" />
          </g>
        )}

        {preset === 2 && (
          <g>
            <path d="M19 25 C18 16, 28 13, 38 15 C45 17, 46 25, 46 27 C44 22, 38 18, 32 19 C25 20, 21 23, 19 25 Z" fill="#451a03" />
            <path d="M18 27 C17 21, 20 17, 25 15 C21 18, 19 22, 19 28 Z" fill="#78350f" />
          </g>
        )}

        {preset === 3 && (
          <g>
            <path d="M18 23 C19 14, 45 14, 46 23 C44 18, 38 17, 32 17 C26 17, 20 18, 18 23 Z" fill="#0f172a" />
            <path d="M19 23 L45 23 L43 25 L21 25 Z" fill="#38bdf8" opacity="0.9" />
          </g>
        )}
      </svg>
    </div>
  );
}

export default memo(StudentAvatar);
