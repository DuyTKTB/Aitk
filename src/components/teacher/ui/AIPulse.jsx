/* ============================================================
   AIPulse.jsx — Viền Sóng Phát Sáng Trạng Thái AI Đang Phân Tích
   ============================================================ */
import React from 'react';

export default function AIPulse({
  active = true,
  color = 'var(--t-accent-2)',
  children,
  className = '',
  style = {},
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        borderRadius: 'inherit',
        ...style,
      }}
      className={className}
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 'inherit',
            background: color,
            opacity: 0.35,
            filter: 'blur(8px)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
