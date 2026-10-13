/* ============================================================
   StatBig.jsx — Thẻ thống kê số lớn với count-up animation
   (HubSpot: "34 Deals / 20 won / 3 lost" -> "Đề đã giao / Bài đã nộp")
   ============================================================ */
import React, { useState, useEffect } from 'react';

export default function StatBig({
  value = 0,
  label = '',
  sub = '',
  prefix = '',
  suffix = '',
  duration = 800,
  tone = 'default',
  className = '',
  style = {},
}) {
  const numTarget = typeof value === 'number' ? value : parseFloat(value) || 0;
  const isNumeric = !Number.isNaN(numTarget) && typeof value === 'number';
  const [displayVal, setDisplayVal] = useState(isNumeric ? 0 : value);

  useEffect(() => {
    if (!isNumeric) {
      setDisplayVal(value);
      return;
    }

    // Tôn trọng reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayVal(numTarget);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (numTarget - start) * ease);
      setDisplayVal(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayVal(numTarget);
      }
    };

    const req = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(req);
  }, [numTarget, isNumeric, value, duration]);

  return (
    <div className={`t-stat-big ${className}`.trim()} style={style}>
      <div className="t-stat-big-value">
        {prefix}
        <span className="t-tabular">{displayVal}</span>
        {suffix}
      </div>
      {label && <div className="t-stat-big-label">{label}</div>}
      {sub && (
        <div style={{ fontSize: '0.76rem', color: 'var(--t-ink-faint)', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
