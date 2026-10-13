/* ============================================================
   Skeleton.jsx — Hiệu ứng Shimmer Skeleton thay thế Spinner quay tròn
   ============================================================ */
import React from 'react';

export default function Skeleton({
  width = '100%',
  height = 20,
  radius = 'var(--t-r-md)',
  className = '',
  style = {},
}) {
  return (
    <div
      className={`t-skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
