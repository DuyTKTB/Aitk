import { memo, useState } from 'react';

function getInitials(rawName = '') {
  const clean = String(rawName || '').trim();
  if (!clean) return 'E';
  const base = clean.includes('@') ? clean.split('@')[0] : clean;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

/**
 * UserAvatar — Ảnh đại diện người dùng.
 * Ưu tiên ảnh thật (Google photoURL / ảnh đã tải lên); nếu chưa có ảnh thì hiển thị
 * chữ cái đầu theo đúng tên/email của người dùng hiện tại.
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

  const label = title || user?.displayName || user?.email || 'Thành viên ELEC AI';

  if (customPhoto) {
    return (
      <img
        src={customPhoto}
        alt={label}
        title={label}
        referrerPolicy="no-referrer"
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

  const initials = getInitials(title || user?.displayName || user?.email);
  const isDark = variant === 'dark';
  const isGold = variant === 'gold';
  const bg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : isGold
      ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
      : 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)';
  const border = isDark ? '1.5px solid #fbbf24' : 'none';
  const fontSize = Math.max(11, Math.round(size * 0.38));

  return (
    <div
      className={`ns9-user-logo-avatar ${variant} ${className}`}
      title={label}
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
        color: '#ffffff',
        fontWeight: 800,
        fontSize,
        letterSpacing: '0.02em',
        lineHeight: 1,
        ...style,
      }}
      onClick={onClick}
      aria-label={label}
    >
      {initials}
    </div>
  );
}

export default memo(UserAvatar);
