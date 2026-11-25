import { memo } from 'react';
import { getStateAtTemp } from '../data/elementMedia.js';
import Icon from './Icon.jsx';

const BLOCK_BG = {
  s: 'var(--pt-blk-s)',
  p: 'var(--pt-blk-p)',
  d: 'var(--pt-blk-d)',
  f: 'var(--pt-blk-f)',
};

const STATE_BG = {
  'Rắn': 'var(--pt-st-solid)',
  'Lỏng': 'var(--pt-st-liquid)',
  'Khí': 'var(--pt-st-gas)',
};

function ElementCard({
  e,
  on,
  onSelect,
  onHover,
  trend,
  trendInfo,
  viewMode,
  tempK,
  study,
  revealed,
  selected,
  cursor,
  fav,
}) {
  const style = { gridRow: e.row, gridColumn: e.col, background: `var(--${e.category})` };
  let dark = false;
  let nodata = false;
  let phaseTag = null;

  if (viewMode === 'blocks') {
    style.background = BLOCK_BG[e.block] || style.background;
    phaseTag = e.block;
  } else if (viewMode === 'temp') {
    const st = getStateAtTemp(e, tempK);
    style.background = STATE_BG[st] || style.background;
    phaseTag = st === 'Rắn' ? 'R' : st === 'Lỏng' ? 'L' : 'K';
    if (st === 'Lỏng' || st === 'Khí') dark = true;
  } else if (trend && trendInfo) {
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
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={cls}
      style={style}
      onMouseEnter={() => onHover?.(e)}
      onFocus={() => onHover?.(e)}
      onClick={(ev) => onSelect(e, ev)}
      aria-label={`${e.name}, ký hiệu ${e.symbol}, số hiệu ${e.atomicNumber}${fav ? ', đã yêu thích' : ''}`}
      aria-pressed={selected || undefined}
    >
      <span className="n">{e.atomicNumber}</span>
      {fav && <span className="fav" aria-hidden="true"><Icon name="star" size={10} fill /></span>}
      {!fav && phaseTag && <span className="el-tag" aria-hidden="true">{phaseTag}</span>}
      <b>{e.symbol}</b>
      <span className="nm">{e.name}</span>
      <span className="ms">{e.atomicMass}</span>
    </button>
  );
}

export default memo(ElementCard);
