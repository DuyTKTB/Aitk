/* ============================================================
   Orb.jsx — Quả Cầu AI Thở Nhẹ (Ảnh 2 BeeBot & Ảnh 3 App Thở)
   ============================================================ */
import React from 'react';

export default function Orb({
  size = 72,
  pulse = true,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`t-orb ${className}`.trim()}
      style={{
        width: size,
        height: size,
        animationPlayState: pulse ? 'running' : 'paused',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
