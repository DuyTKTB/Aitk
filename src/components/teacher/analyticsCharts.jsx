/* ============================================================
   analyticsCharts.jsx — Biểu đồ SVG cho trung tâm phân tích
   ------------------------------------------------------------
   Không dùng thư viện ngoài (giữ đúng phụ thuộc hiện có).
   Mọi biểu đồ đều:
     • nhận dữ liệu đã tính từ learningAnalytics.js
     • có <title> để rê chuột xem số
     • có nhãn trục rút gọn, tự ẩn khi quá nhiều cột
     • không vẽ khi không có dữ liệu hợp lệ (nơi gọi đã chặn)
   ============================================================ */

/** Cột dọc: dùng cho "số đề theo thời gian", "phân bố điểm". */
export function BarChart({
  data = [], unit = '', height = 150, tone = 'acc', showValues = true, ariaLabel = 'Biểu đồ cột',
}) {
  const rows = (data || []).filter((d) => d && Number.isFinite(Number(d.value)));
  if (!rows.length) return null;

  const W = 420;
  const H = height;
  const padX = 10;
  const padTop = 18;
  const padBottom = 26;
  const max = Math.max(1, ...rows.map((d) => Number(d.value)));
  const slot = (W - padX * 2) / rows.length;
  const bw = Math.min(34, Math.max(6, slot * 0.62));
  const labelEvery = rows.length > 12 ? Math.ceil(rows.length / 8) : 1;

  return (
    <svg
      className={`la-chart la-chart-${tone}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={W - padX}
          y1={H - padBottom - f * (H - padBottom - padTop)}
          y2={H - padBottom - f * (H - padBottom - padTop)}
          className="la-grid"
        />
      ))}
      {rows.map((d, i) => {
        const value = Number(d.value);
        const h = Math.max(2, (value / max) * (H - padBottom - padTop));
        const x = padX + slot * i + (slot - bw) / 2;
        const y = H - padBottom - h;
        return (
          <g key={d.key || d.label || i}>
            <rect x={x} y={y} width={bw} height={h} rx={Math.min(5, bw / 3)} className="la-bar">
              <title>{`${d.label}: ${value}${unit}`}</title>
            </rect>
            {showValues && value > 0 && rows.length <= 14 && (
              <text x={x + bw / 2} y={y - 5} textAnchor="middle" className="la-bar-val">{value}</text>
            )}
            {i % labelEvery === 0 && (
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="la-axis">{d.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Thanh ngang: dùng cho "số đề theo môn", "điểm TB theo môn", "tỷ lệ đúng theo chủ đề". */
export function HBarChart({
  data = [], unit = '%', max = 100, tone = 'acc', ariaLabel = 'Biểu đồ thanh ngang', valueLabel,
}) {
  const rows = (data || []).filter((d) => d && Number.isFinite(Number(d.value)));
  if (!rows.length) return null;
  const top = Math.max(1, Number(max) || 100);

  return (
    <ul className={`la-hbars la-hbars-${tone}`} aria-label={ariaLabel}>
      {rows.map((d, i) => {
        const value = Number(d.value);
        const w = Math.max(2, Math.min(100, (value / top) * 100));
        return (
          <li key={d.key || d.label || i}>
            <span className="la-hbar-label" title={d.label}>{d.label}</span>
            <span className="la-hbar-track">
              <span className="la-hbar-fill" style={{ width: `${w}%` }} />
            </span>
            <b className="la-hbar-val">{valueLabel ? valueLabel(value, d) : `${value}${unit}`}</b>
          </li>
        );
      })}
    </ul>
  );
}

/** Số lớn + nhãn phụ, dùng trong thẻ KPI. */
export function StatValue({ value, unit = '', empty = '—' }) {
  const v = value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value);
  if (v === null) return <b className="la-kpi-empty">{empty}</b>;
  return <b>{v.toLocaleString('vi-VN')}<sup>{unit}</sup></b>;
}
