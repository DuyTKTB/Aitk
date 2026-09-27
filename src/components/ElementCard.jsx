import { memo } from 'react';

function ElementCard({ e, on, onSelect }) {
  return (
    <button
      className={'el' + (on ? '' : ' off')}
      style={{ gridRow: e.row, gridColumn: e.col, background: `var(--${e.category})` }}
      data-tip={`${e.name}\n${e.symbol}\nSố hiệu: ${e.atomicNumber}`}
      onClick={() => onSelect(e)}
      aria-label={`${e.vietnameseName}, ký hiệu ${e.symbol}, số hiệu ${e.atomicNumber}`}
    >
      <span className="n">{e.atomicNumber}</span>
      <b>{e.symbol}</b>
      <span className="nm">{e.name}</span>
      <span className="ms">{e.atomicMass}</span>
    </button>
  );
}

export default memo(ElementCard);
