import Icon from './Icon.jsx';

export default function CompareBar({ elements, onOpen, onClear }) {
  return (
    <div className="compare-bar" role="region" aria-label="So sánh nguyên tố">
      {elements.map((e) => (
        <div key={e.atomicNumber} className="compare-mini" style={{ background: `var(--${e.category})` }}>
          <b>{e.symbol}</b>
          <small>{e.vietnameseName}</small>
        </div>
      ))}
      <button className="btn primary" onClick={onOpen}>So sánh</button>
      <button className="btn" onClick={onClear} aria-label="Bỏ chọn"><Icon name="close" size={16} /></button>
    </div>
  );
}