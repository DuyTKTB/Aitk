/* ============================================================
   Chip.jsx — Chip lọc bo tròn (All / Hot / Due Today...)
   ============================================================ */
import React from 'react';

export default function Chip({
  active = false,
  onClick,
  icon,
  children,
  className = '',
  style = {},
  ...props
}) {
  return (
    <button
      type="button"
      className={`t-chip ${active ? 'active' : ''} ${className}`.trim()}
      onClick={onClick}
      style={style}
      aria-pressed={active}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
