/* ============================================================
   AvatarStack.jsx — Avatar chồng nhau dạng Capsule (Ảnh 1 HubSpot)
   ============================================================ */
import React from 'react';

export default function AvatarStack({
  users = [],
  max = 3,
  size = 28,
  className = '',
  style = {},
}) {
  const visible = users.slice(0, max);
  const remaining = Math.max(0, users.length - max);

  return (
    <div className={`t-avatar-stack ${className}`.trim()} style={style}>
      {visible.map((u, i) => {
        const name = typeof u === 'string' ? u : u.name || '?';
        const ch = (name.trim().split(/\s+/).pop() || '?')[0].toUpperCase();
        return (
          <div
            key={i}
            className="t-avatar-stack-item"
            style={{ width: size, height: size }}
            title={name}
          >
            {u.avatar ? (
              <img
                src={u.avatar}
                alt={name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: Math.round(size * 0.42) }}>{ch}</span>
            )}
          </div>
        );
      })}
      {remaining > 0 && (
        <div
          className="t-avatar-stack-item"
          style={{ width: size, height: size, background: 'var(--t-surface-3)', color: 'var(--t-ink-muted)' }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
