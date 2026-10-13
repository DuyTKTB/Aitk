/* ============================================================
   SchedulePill.jsx — Thanh lịch "Your Schedule" dạng capsule
   (Ảnh 1 HubSpot: vạch thời gian + avatar chồng nhau)
   ============================================================ */
import React from 'react';
import AvatarStack from './AvatarStack.jsx';

const IcoClock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function SchedulePill({
  title = '',
  time = '',
  users = [],
  live = false,
  badge = '',
  onClick,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`t-schedule-pill ${live ? 'live' : ''} ${className}`.trim()}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
      onClick={onClick}
    >
      {users.length > 0 && <AvatarStack users={users} max={2} size={26} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <b style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          {title}
        </b>
        {time && (
          <span style={{ fontSize: '0.74rem', opacity: 0.85, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IcoClock size={11} /> {time}
          </span>
        )}
      </div>

      {badge && (
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '0.15rem 0.5rem',
            borderRadius: 999,
            background: live ? '#0e0e10' : 'var(--t-surface-2)',
            color: live ? 'var(--t-accent)' : 'var(--t-ink)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginLeft: 'auto',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
