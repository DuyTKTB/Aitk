export default function TrendLegend({ trend, min, max }) {
  if (!trend) return null;
  return (
    <div className="trend-legend">
      <span className="trend-name">{trend.label}</span>
      <div className="trend-bar" />
      <span className="trend-val">{trend.fmt(min)}</span>
      <span className="trend-sep">→</span>
      <span className="trend-val">{trend.fmt(max)} {trend.unit}</span>
    </div>
  );
}