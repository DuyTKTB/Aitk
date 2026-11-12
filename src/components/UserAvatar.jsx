import { memo, useState } from 'react';

/**
 * UserAvatar — Avatar logo chuẩn nhận diện thương hiệu học viên (Vương miện + Monogram TK)
 * Phù hợp 100% với mẫu thực tế của người dùng:
 *  - Navbar góc phải
 *  - Thẻ người dùng Home Hero
 *  - Thẻ học sinh cột 1 & cột 3 Chat (PetWidget)
 *  - Menu Hồ sơ cá nhân (UserProfileNavDropdown)
 *  - Chat cộng đồng (ChatWidget)
 */
function UserAvatar({
  user = null,
  photoURL = null,
  size = 32,
  variant = 'blue', // 'blue' | 'dark' | 'gold'
  className = '',
  title = '',
  style = {},
  onClick = undefined,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const rawPhoto = photoURL ?? user?.photoURL ?? null;
  const customPhoto = (!imgFailed && rawPhoto && typeof rawPhoto === 'string' && rawPhoto.trim().length > 6 && !rawPhoto.includes('placeholder') && rawPhoto !== 'null' && rawPhoto !== 'undefined') ? rawPhoto.trim() : null;

  // Nếu người dùng đã tự upload ảnh chân dung riêng (không phải ảnh trống), hiển thị ảnh đó
  if (customPhoto) {
    return (
      <img
        src={customPhoto}
        alt={title || user?.displayName || 'User'}
        title={title || user?.displayName || 'User'}
        className={`ns9-user-avatar-img ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
          ...style,
        }}
        onError={() => setImgFailed(true)}
        onClick={onClick}
      />
    );
  }

  const isDark = variant === 'dark';
  const bg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)';
  const border = isDark ? '1.5px solid #fbbf24' : 'none';

  return (
    <div
      className={`ns9-user-logo-avatar ${variant} ${className}`}
      title={title || user?.displayName || 'Bạn'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        border,
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(37,99,235,0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        userSelect: 'none',
        ...style,
      }}
      onClick={onClick}
      aria-label={title || user?.displayName || 'User Logo'}
    >
      <svg
        viewBox="0 0 64 64"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        {/* Crown */}
        <g fill="#ffffff">
          <path d="M19 21 L22 13.5 L27 18 L32 9 L37 18 L42 13.5 L45 21 Z" />
          <circle cx="22" cy="12.5" r="1.5" />
          <circle cx="32" cy="8" r="1.8" />
          <circle cx="42" cy="12.5" r="1.5" />
          <rect x="20" y="22" width="24" height="2" rx="0.8" opacity="0.9" />
        </g>

        {/* Monogram T & K */}
        <g fill="#ffffff">
          {/* T top bar with serifs */}
          <rect x="18" y="26.5" width="28" height="3.2" rx="0.5" />
          <path d="M18 26.5 v5 h2 l-0.5 -3.5 h1 Z" />
          <path d="M46 26.5 v5 h-2 l0.5 -3.5 h-1 Z" />

          {/* T stem */}
          <rect x="29.5" y="29.7" width="5" height="21" />

          {/* T base serif */}
          <rect x="26.5" y="49.5" width="11" height="2.2" rx="0.5" />

          {/* K upper diagonal */}
          <path d="M33.5 37.5 L44 28 h3.8 L36 39 Z" />

          {/* K lower diagonal */}
          <path d="M34 37 L46.5 50.5 h-4.2 L32 39.5 Z" />
          {/* K lower foot serif */}
          <rect x="43.5" y="49.5" width="5.5" height="2.2" rx="0.5" />
        </g>
      </svg>
    </div>
  );
}

export default memo(UserAvatar);
