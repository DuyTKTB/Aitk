import { useEffect, useRef } from 'react';
import { CATS } from '../data/elements.js';

const OX_LABEL = (ox) => {
  if (!ox || ox.length === 0) return '—';
  return ox.map((n) => (n > 0 ? `+${n}` : `${n}`)).join(', ');
};
const MASS_LABEL = (m) => (m.endsWith(']') ? `${m} (đồng vị bền nhất)` : m);

const ROWS = (e) => {
  if (!e) return [];
  const catName = CATS.find((c) => c[0] === e.category)?.[1] ?? e.category;
  return [
    ['Khối lượng', MASS_LABEL(e.atomicMass)],
    ['Nhóm', e.group ?? '— (khối f)'],
    ['Chu kỳ', e.period],
    ['Phân loại', catName],
    ['Trạng thái (25°C)', e.stateAtRoomTemp],
    ['Electron hóa trị', e.valenceElectrons ?? '—'],
    ['Độ âm điện', e.electronegativity ?? '—'],
    ['Số oxi hóa', OX_LABEL(e.oxidationStates)],
    ['Bán kính (pm)', e.atomicRadius ?? '—'],
    ['Nóng chảy (K)', e.meltingPoint ?? '—'],
  ];
};

export default function ElementModal({ e, compare, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (ev) => ev.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);
  if (compare && compare.length === 2) {
    const [a, b] = compare;
    const rowsA = ROWS(a), rowsB = ROWS(b);
    return (
      <div className="backdrop" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
        <div className="modal modal-compare" role="dialog" aria-modal="true" tabIndex={-1} ref={ref}>
          <div className="compare-head">
            {[a, b].map((x) => (
              <div key={x.atomicNumber} className="compare-hero" style={{ background: `var(--${x.category})` }}>
                <span className="mz">{x.atomicNumber}</span>
                <div className="big">{x.symbol}</div>
                <h2>{x.name}</h2>
                <small>{x.vietnameseName}</small>
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
          <div className="compare-configs">
            <div><h3>Cấu hình e</h3><p className="cfg">{a.shortConfiguration}</p></div>
            <div><h3>Cấu hình e</h3><p className="cfg">{b.shortConfiguration}</p></div>
          </div>
          <button className="btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }
  const catName = CATS.find((c) => c[0] === e.category)?.[1] ?? e.category;
  const rows = [
    ['Khối lượng nguyên tử', MASS_LABEL(e.atomicMass)],
    ['Nhóm', e.group ?? '— (khối f)'],
    ['Chu kỳ', e.period],
    ['Phân loại', catName],
    ['Trạng thái (25°C)', e.stateAtRoomTemp],
    ['Electron hóa trị', e.valenceElectrons ?? '—'],
    ['Độ âm điện (Pauling)', e.electronegativity ?? '—'],
    ['Số oxi hóa phổ biến', OX_LABEL(e.oxidationStates)],
    ['Bán kính nguyên tử (pm)', e.atomicRadius ?? '—'],
    ['Nhiệt độ nóng chảy (K)', e.meltingPoint ?? '—'],
  ];
  return (
    <div className="backdrop" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" tabIndex={-1} ref={ref}>
        <div className="mhead" style={{ background: `var(--${e.category})` }}>
          <span className="mz">{e.atomicNumber}</span>
          <div className="big">{e.symbol}</div>
          <h2>{e.name}</h2>
          <small>{e.vietnameseName}</small>
        </div>
        <dl>
          {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <h3>Cấu hình electron đầy đủ</h3>
        <p className="cfg">{e.electronConfiguration}</p>
        <h3>Cấu hình rút gọn</h3>
        <p className="cfg">{e.shortConfiguration}</p>
        <button className="btn" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}