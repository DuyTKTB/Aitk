/* ============================================================
   Sparkline.jsx — Đường cong SVG Spline mượt mà có chấm phát sáng đầu dòng (Ảnh 3)
   ============================================================ */
import React from 'react';

export default function Sparkline({
  data = [12, 18, 14, 25, 20, 28, 32],
  width = 160,
  height = 44,
  strokeColor = 'var(--t-accent-2)',
  dotColor = 'var(--t-accent-2)',
  strokeWidth = 2.5,
  className = '',
  style = {},
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 6;
  const innerH = height - pad * 2;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((val, idx) => {
    const x = pad + idx * stepX;
    const y = pad + innerH - ((val - min) / range) * innerH;
    return { x, y };
  });

  // Tạo đường cong bezier spline mượt
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const lastPt = points[points.length - 1];

  return (
    <svg
      className={`t-sparkline-svg ${className}`.trim()}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: width, height, ...style }}
      aria-hidden="true"
    >
      <path
        d={d}
        className="t-sparkline-path"
        style={{ stroke: strokeColor, strokeWidth }}
      />
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r={4}
        className="t-sparkline-dot"
        style={{ fill: dotColor }}
      />
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r={7}
        fill="none"
        stroke={dotColor}
        strokeWidth={1.5}
        opacity={0.45}
      />
    </svg>
  );
}
