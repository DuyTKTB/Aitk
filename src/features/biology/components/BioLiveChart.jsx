import React, { useId, useState } from 'react';

/**
 * BioLiveChart — Biểu đồ khoa học SVG cao cấp cho Phòng Lab Sinh học 2.0:
 *  • Hỗ trợ cả miền giá trị âm (VD: Điện thế hoạt động -70 mV → +30 mV)
 *  • Đổ bóng Area Gradient mịn dưới từng chuỗi dữ liệu
 *  • Tương tác rê chuột / chạm: đường gióng dọc (crosshair), chấm phát sáng & tooltip số liệu chính xác
 */
export default function BioLiveChart({
  data = [],
  xKey = 't',
  xLabel = 'Thời gian',
  yLabel = 'Giá trị',
  series = [],
  height = 220,
  minY: explicitMinY = null,
  maxY: explicitMaxY = null,
}) {
  const uid = useId().replace(/:/g, '');
  const [hoverIdx, setHoverIdx] = useState(null);

  const w = 540;
  const h = height;
  const padL = 48;
  const padR = 20;
  const padT = 18;
  const padB = 32;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  if (!Array.isArray(data) || data.length < 2 || !series.length) {
    return (
      <div className="bl-chart-empty" style={{ height }}>
        Chưa có đủ dữ liệu để vẽ đồ thị.
      </div>
    );
  }

  const xs = data.map((d) => Number(d[xKey]) || 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs) || 1;
  const spanX = maxX - minX || 1;

  let dataMinY = Infinity;
  let dataMaxY = -Infinity;
  data.forEach((row) => {
    series.forEach((s) => {
      const v = Number(row[s.key]) || 0;
      if (v < dataMinY) dataMinY = v;
      if (v > dataMaxY) dataMaxY = v;
    });
  });
  if (!Number.isFinite(dataMinY)) dataMinY = 0;
  if (!Number.isFinite(dataMaxY)) dataMaxY = 1;

  const minY = explicitMinY != null ? explicitMinY : (dataMinY < 0 ? Math.floor(dataMinY * 1.15) : 0);
  let maxY = explicitMaxY != null ? explicitMaxY : (dataMaxY > 0 ? dataMaxY * 1.12 : 1);
  if (maxY <= minY) maxY = minY + 1;
  const spanY = maxY - minY;

  const toX = (x) => padL + ((x - minX) / spanX) * plotW;
  const toY = (y) => {
    const clamped = Math.max(minY, Math.min(maxY, y));
    return padT + plotH - ((clamped - minY) / spanY) * plotH;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    val: Math.round((minY + spanY * f) * 10) / 10,
    y: padT + plotH * (1 - f),
  }));
  const showZeroLine = minY < 0 && maxY > 0;
  const baseLineY = showZeroLine ? toY(0) : padT + plotH;

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * w;
    if (svgX < padL - 6 || svgX > w - padR + 6) {
      setHoverIdx(null);
      return;
    }
    const targetX = minX + ((svgX - padL) / plotW) * spanX;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < xs.length; i++) {
      const d = Math.abs(xs[i] - targetX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setHoverIdx(best);
  };

  const hoverRow = hoverIdx != null ? data[hoverIdx] : null;
  const hoverX = hoverRow ? toX(Number(hoverRow[xKey]) || 0) : 0;
  const tooltipOnLeft = hoverX > padL + plotW * 0.62;
  const tooltipW = 152;
  const tooltipH = 24 + series.length * 16;
  const tooltipX = tooltipOnLeft ? Math.max(padL + 6, hoverX - tooltipW - 10) : Math.min(w - padR - tooltipW - 4, hoverX + 10);

  return (
    <div className="bl-chart-wrap">
      <div className="bl-chart-legend">
        {series.map((s) => (
          <span key={s.key} className="bl-chart-leg-item">
            <i style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
            {s.label}
          </span>
        ))}
        <span className="bl-chart-hint">Rê chuột lên đồ thị để đọc số liệu</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="bl-chart-svg"
        role="img"
        aria-label={`${yLabel} theo ${xLabel}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        <defs>
          {series.map((s, idx) => (
            <linearGradient key={s.key} id={`blg_${uid}_${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal grid + Y labels */}
        {yTicks.map((tk, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={tk.y}
              x2={w - padR}
              y2={tk.y}
              stroke="currentColor"
              strokeOpacity="0.09"
              strokeDasharray="3 3"
            />
            <text x={padL - 7} y={tk.y + 3.5} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.62">
              {tk.val}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={padL} y1={padT + plotH} x2={w - padR} y2={padT + plotH} stroke="currentColor" strokeOpacity="0.24" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="currentColor" strokeOpacity="0.24" />
        {showZeroLine && (
          <line
            x1={padL}
            y1={toY(0)}
            x2={w - padR}
            y2={toY(0)}
            stroke="#64748b"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            strokeOpacity="0.72"
          />
        )}

        {/* Area fills + Polylines */}
        {series.map((s, idx) => {
          const coords = data.map((row) => [
            toX(Number(row[xKey]) || 0),
            toY(Number(row[s.key]) || 0),
          ]);
          const pts = coords.map(([cx, cy]) => `${cx.toFixed(1)},${cy.toFixed(1)}`).join(' ');
          const firstX = coords[0][0].toFixed(1);
          const lastX = coords[coords.length - 1][0].toFixed(1);
          const areaPath = `M ${firstX},${baseLineY.toFixed(1)} L ${coords
            .map(([cx, cy]) => `${cx.toFixed(1)},${cy.toFixed(1)}`)
            .join(' L ')} L ${lastX},${baseLineY.toFixed(1)} Z`;

          return (
            <g key={s.key}>
              {series.length <= 3 && (
                <path d={areaPath} fill={`url(#blg_${uid}_${idx})`} />
              )}
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth="2.6"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pts}
              />
            </g>
          );
        })}

        {/* Interactive Crosshair + Active Points + Glass Tooltip */}
        {hoverRow && (
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1={hoverX}
              y1={padT}
              x2={hoverX}
              y2={padT + plotH}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            {series.map((s) => {
              const cy = toY(Number(hoverRow[s.key]) || 0);
              return (
                <g key={s.key}>
                  <circle cx={hoverX} cy={cy} r="6.5" fill={s.color} fillOpacity="0.22" />
                  <circle cx={hoverX} cy={cy} r="3.8" fill={s.color} stroke="#ffffff" strokeWidth="1.6" />
                </g>
              );
            })}
            <g transform={`translate(${tooltipX}, ${padT + 4})`}>
              <rect
                width={tooltipW}
                height={tooltipH}
                rx="8"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="rgba(148, 163, 184, 0.35)"
                strokeWidth="1"
              />
              <text x="9" y="15" fontSize="9.5" fontWeight="700" fill="#94a3b8">
                {xLabel}: {hoverRow[xKey]}
              </text>
              {series.map((s, si) => (
                <g key={s.key} transform={`translate(9, ${30 + si * 15})`}>
                  <circle cx="3" cy="-3" r="3" fill={s.color} />
                  <text x="11" y="0" fontSize="9.8" fontWeight="700" fill="#f8fafc">
                    {s.label.slice(0, 15)}: {hoverRow[s.key]}
                  </text>
                </g>
              ))}
            </g>
          </g>
        )}

        {/* Axis Titles */}
        <text x={padL + plotW / 2} y={h - 7} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="currentColor" opacity="0.72">
          {xLabel} ({minX} → {maxX})
        </text>
        <text
          x={13}
          y={padT + plotH / 2}
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="600"
          fill="currentColor"
          opacity="0.72"
          transform={`rotate(-90 13 ${padT + plotH / 2})`}
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
}
