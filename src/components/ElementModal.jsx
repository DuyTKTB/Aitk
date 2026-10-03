import { useEffect, useRef, useState } from 'react';
import { CATS } from '../data/elements.js';
import AiPanel from './AiPanel.jsx';
import Icon from './Icon.jsx';

const OX_LABEL = (ox) => {
  if (!ox || ox.length === 0) return '—';
  return ox.map((n) => (n > 0 ? `+${n}` : `${n}`)).join(', ');
};
const MASS_LABEL = (m) => (m.endsWith(']') ? `${m} (đồng vị bền nhất)` : m);
const catNameOf = (e) => CATS.find((c) => c[0] === e.category)?.[1] ?? e.category;

/* ---------- Mô hình Bohr ---------- */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SHELL = 'KLMNOPQ';
function shellsOf(cfg) {
  const s = [];
  for (const m of cfg.matchAll(/(\d)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)) {
    const count = +[...m[3]].map((c) => SUP.indexOf(c)).join('');
    s[m[1] - 1] = (s[m[1] - 1] || 0) + count;
  }
  return Array.from(s, (v) => v || 0);
}

function Bohr({ e }) {
  const shells = shellsOf(e.electronConfiguration);
  const R = (i) => 24 + i * 10.5;
  const gid = `emb-g-${e.atomicNumber}`;
  return (
    <div>
      <svg className="emb" viewBox="0 0 200 200" role="img" aria-label={`Số electron mỗi lớp: ${shells.join(', ')}`}>
        <defs>
          <radialGradient id={gid}>
            <stop offset="0%" style={{ stopColor: 'var(--pt-accent)', stopOpacity: 0.35 }} />
            <stop offset="100%" style={{ stopColor: 'var(--pt-accent)', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="34" fill={`url(#${gid})`} />
        {shells.map((_, i) => <circle key={'r' + i} cx="100" cy="100" r={R(i)} className="emb-ring" />)}
        {shells.map((c, i) => (
          <g key={i} className="emb-orbit"
            style={{ animationDuration: `${16 + i * 7}s`, animationDirection: i % 2 ? 'reverse' : 'normal', transformOrigin: '100px 100px' }}>
            {Array.from({ length: c }, (_, k) => {
              const a = (2 * Math.PI * k) / c - Math.PI / 2;
              return <circle key={k} cx={100 + R(i) * Math.cos(a)} cy={100 + R(i) * Math.sin(a)} r="2.6" className="emb-e" />;
            })}
          </g>
        ))}
        <circle cx="100" cy="100" r="14" className="emb-nuc" />
        <text x="100" y="100" className="emb-nuc-t">{e.symbol}</text>
      </svg>
      <div className="emb-pills">
        {shells.map((c, i) => <span key={i} className="emb-pill"><b>{SHELL[i]}</b>{c}</span>)}
      </div>
    </div>
  );
}

/* ---------- Dữ liệu hàng ---------- */
const ROWS = (e) => [
  ['Khối lượng', MASS_LABEL(e.atomicMass)],
  ['Nhóm', e.group ?? '— (khối f)'],
  ['Chu kỳ', e.period],
  ['Phân loại', catNameOf(e)],
  ['Trạng thái (25°C)', e.stateAtRoomTemp],
  ['Electron hóa trị', e.valenceElectrons ?? '—'],
  ['Độ âm điện', e.electronegativity ?? '—'],
  ['Số oxi hóa', OX_LABEL(e.oxidationStates)],
  ['Bán kính (pm)', e.atomicRadius ?? '—'],
  ['Nóng chảy (K)', e.meltingPoint ?? '—'],
];

export default function ElementModal({ e, compare, onClose, vip, fav, onToggleFav }) {
  const ref = useRef(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const onKey = (ev) => ev.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  const backdropClose = (ev) => ev.target === ev.currentTarget && onClose();

  /* ===== SO SÁNH 2 NGUYÊN TỐ ===== */
  if (compare && compare.length === 2) {
    const [a, b] = compare;
    const rowsA = ROWS(a), rowsB = ROWS(b);
    return (
      <div className="backdrop" onMouseDown={backdropClose}>
        <div className="emodal" role="dialog" aria-modal="true" aria-label="So sánh nguyên tố" tabIndex={-1} ref={ref}>
          <header className="em-head">
            <button className="em-pill em-back" onClick={onClose}><Icon name="back" /><span>Quay lại</span></button>
            <h2 className="em-title">So sánh {a.vietnameseName} ({a.symbol}) và {b.vietnameseName} ({b.symbol})</h2>
            <button className="em-pill em-x" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
          </header>
          <div className="em-grid two">
            <section className="em-col">
              <div className="cmp-heroes">
                {[a, b].map((x) => (
                  <div key={x.atomicNumber} className="em-card sm" style={{ '--cat': `var(--${x.category})` }}>
                    <span className="em-z">{x.atomicNumber}</span>
                    <div className="em-sym">{x.symbol}</div>
                    <div className="em-name">{x.vietnameseName}</div>
                    <div className="em-en">{x.name}</div>
                  </div>
                ))}
              </div>
              <table className="compare-table">
                <tbody>
                  {rowsA.map((r, i) => {
                    const va = r[1], vb = rowsB[i][1];
                    const na = parseFloat(va), nb = parseFloat(vb);
                    const aWin = !isNaN(na) && !isNaN(nb) && na > nb;
                    const bWin = !isNaN(na) && !isNaN(nb) && nb > na;
                    return (
                      <tr key={r[0]}>
                        <td className={aWin ? 'win' : ''}>{va}</td>
                        <th>{r[0]}</th>
                        <td className={bWin ? 'win' : ''}>{vb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="cmp-cfgs">
                {[a, b].map((x) => (
                  <div key={x.atomicNumber}><h3>Cấu hình {x.symbol}</h3><p className="em-cfg">{x.shortConfiguration}</p></div>
                ))}
              </div>
            </section>
            <section className="em-col em-right">
              <AiPanel elements={[a, b]} vip={vip} />
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* ===== 1 NGUYÊN TỐ ===== */
  const rows = ROWS(e).filter(([k]) => k !== 'Electron hóa trị');
  return (
    <div className="backdrop" onMouseDown={backdropClose}>
      <div className="emodal" role="dialog" aria-modal="true" aria-label={e.vietnameseName} tabIndex={-1} ref={ref}
        style={{ '--cat': `var(--${e.category})` }}>
        <header className="em-head">
          <button className="em-pill em-back" onClick={onClose}><Icon name="back" /><span>Quay lại</span></button>
          <h2 className="em-title">{e.vietnameseName} ({e.symbol}) · Z={e.atomicNumber}</h2>
          <button className={'em-pill em-fav' + (fav ? ' on' : '')} onClick={onToggleFav} aria-pressed={!!fav}>
            <Icon name="star" fill={!!fav} /><span>{fav ? 'Đã yêu thích' : 'Yêu thích'}</span>
          </button>
          <button className="em-pill em-x" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
        </header>

        <div className="em-grid">
          <section className="em-col em-left">
            <div className="em-card">
              <span className="em-z">{e.atomicNumber}</span>
              <span className="em-mass">{e.atomicMass}</span>
              <div className="em-sym">{e.symbol}</div>
              <div className="em-name">{e.vietnameseName}</div>
              <div className="em-en">{e.name}</div>
            </div>
            <div>
              <h3>Mô hình Bohr</h3>
              <Bohr e={e} />
            </div>
          </section>

          <section className="em-col em-mid">
            <h3>Thông tin chi tiết</h3>
            <dl className="em-dl">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {k === 'Phân loại' && <i className="em-dot" style={{ background: `var(--${e.category})` }} />}
                    {v}
                  </dd>
                </div>
              ))}
              <div><dt>Cấu hình rút gọn</dt><dd className="mono">{e.shortConfiguration}</dd></div>
              {more && (
                <>
                  <div><dt>Electron hóa trị</dt><dd>{e.valenceElectrons ?? '—'}</dd></div>
                  <div className="stack"><dt>Cấu hình đầy đủ</dt><dd className="mono">{e.electronConfiguration}</dd></div>
                </>
              )}
            </dl>
            <button className={'em-more' + (more ? ' open' : '')} onClick={() => setMore(!more)} aria-expanded={more}>
              {more ? 'Thu gọn' : 'Xem thêm'} <Icon name="arrowRight" size={16} />
            </button>
          </section>

          <section className="em-col em-right">
            <AiPanel elements={[e]} vip={vip} />
          </section>
        </div>
      </div>
    </div>
  );
}