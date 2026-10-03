import { memo } from 'react';
import Icon from './Icon.jsx';

function ElementCard({ e, on, onSelect, trend, trendInfo, study, revealed, selected, cursor, fav }) {
  let style = { gridRow: e.row, gridColumn: e.col, background: `var(--${e.category})` };
  let dark = false;
  let nodata = false;
  if (trend && trendInfo) {
    const v = e[trend];
    if (typeof v === 'number' && trendInfo.max > trendInfo.min) {
      const t = (v - trendInfo.min) / (trendInfo.max - trendInfo.min);
      style.background = `hsl(215 90% ${92 - t * 52}%)`;
      dark = t > 0.5;
    } else {
      nodata = true;
    }
  }
  const quiz = study && !revealed;
  const off = !on && !study;
  const cls = ['el', off && 'off', dark && 'dark', nodata && 'nodata', selected && 'sel', cursor && 'cur', quiz && 'quiz']
    .filter(Boolean).join(' ');

  return (
    <button
      className={cls}
      style={style}
      data-tip={`${e.name}\n${e.symbol}\nSố hiệu: ${e.atomicNumber}`}
      onClick={(ev) => onSelect(e, ev)}
      aria-label={`${e.vietnameseName}, ký hiệu ${e.symbol}, số hiệu ${e.atomicNumber}${fav ? ', đã yêu thích' : ''}`}
      aria-pressed={selected || undefined}
    >
      <span className="n">{e.atomicNumber}</span>
      {fav && <span className="fav" aria-hidden="true"><Icon name="star" size={10} fill /></span>}
      <b>{e.symbol}</b>
      <span className="nm">{e.name}</span>
      <span className="ms">{e.atomicMass}</span>
    </button>
  );
}

export default memo(ElementCard);