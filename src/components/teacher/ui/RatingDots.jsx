/* ============================================================
   RatingDots.jsx — Chấm đánh giá 5 nấc (●●●●○ Ảnh 1 HubSpot)
   Dùng để biểu thị độ khó đề hoặc mức độ nắm bài của lớp/học sinh
   Props:
     - value: number (0 -> max)
     - max: number (default 5)
     - tone: 'lime' | 'amber' | 'purple'
   ============================================================ */
import React from 'react';

export default function RatingDots({
  value = 0,
  max = 5,
  tone = 'lime',
  size = 8,
  title,
  className = '',
  style = {},
}) {
  const safeVal = Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
  const dots = Array.from({ length: max }, (_, i) => i < safeVal);

  return (
    <div
      className={`t-rating-dots ${className}`.trim()}
      title={title || `Đánh giá: ${safeVal}/${max}`}
      aria-label={title || `Đánh giá: ${safeVal}/${max}`}
      style={style}
    >
      {dots.map((filled, idx) => (
        <span
          key={idx}
          className={`t-rating-dot ${filled ? `filled tone-${tone}` : ''}`}
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
