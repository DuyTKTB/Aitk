const ITEMS = ['⚗️', '🧪', '⚛️', 'H₂O', 'Au', '🫧', 'NaCl', '🔬', 'C', '🫧', 'Fe', '🧬'];
export default function Deco() {
  return (
    <div className="deco" aria-hidden="true">
      <i className="blob b1" /><i className="blob b2" /><i className="blob b3" />
      {ITEMS.map((t, i) => (
        <span key={i} style={{ left: (i * 8.3 + 3) % 96 + '%', animationDuration: 16 + (i * 7) % 14 + 's', animationDelay: -i * 2.3 + 's', fontSize: 16 + (i * 5) % 18 + 'px' }}>{t}</span>
      ))}
    </div>
  );
}
