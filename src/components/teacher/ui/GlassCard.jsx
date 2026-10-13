/* ============================================================
   GlassCard.jsx — Thẻ Kính Đục Nhẹ Bo Lớn (Ảnh 3: App Thở)
   ============================================================ */
import React from 'react';

export default function GlassCard({
  children,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div className={`t-glass-card ${className}`.trim()} style={style} {...props}>
      {children}
    </div>
  );
}
