/* ============================================================
   HexStat.jsx — Ô Thống Kê Hình Lục Giác / Viên Sỏi (Ảnh 3: App Thở)
   ============================================================ */
import React from 'react';

export default function HexStat({
  value = '',
  label = '',
  sub = '',
  icon,
  tone = 'purple',
  className = '',
  style = {},
}) {
  return (
    <div className={`t-hex-stat tone-${tone} ${className}`.trim()} style={style}>
      {icon && <span style={{ color: 'var(--t-accent-2)' }}>{icon}</span>}
      <div className="t-hex-stat-val t-tabular">{value}</div>
      <div className="t-hex-stat-label">{label}</div>
      {sub && <span style={{ fontSize: '0.7rem', color: 'var(--t-ink-faint)' }}>{sub}</span>}
    </div>
  );
}
