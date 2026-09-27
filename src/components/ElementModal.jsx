import { useEffect, useRef } from 'react';
import { CATS } from '../data/elements.js';

const OX_LABEL = (ox) => {
  if (!ox || ox.length === 0) return '—';
  return ox
    .map((n) => (n > 0 ? `+${n}` : `${n}`))
    .join(', ');
};

const MASS_LABEL = (m) =>
  m.endsWith(']') ? `${m} (đồng vị bền nhất)` : m;

export default function ElementModal({ e, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (ev) => ev.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  const catName =
    CATS.find((c) => c[0] === e.category)?.[1] ?? e.category;

  const rows = [
    ['Khối lượng nguyên tử', MASS_LABEL(e.atomicMass)],
    ['Nhóm', e.group ?? '— (khối f)'],
    ['Chu kỳ', e.period],
    ['Phân loại', catName],
    ['Trạng thái (25°C)', e.stateAtRoomTemp],
    ['Electron hóa trị', e.valenceElectrons ?? '—'],
    ['Độ âm điện (Pauling)', e.electronegativity ?? '—'],
    ['Số oxi hóa phổ biến', OX_LABEL(e.oxidationStates)],
  ];

  return (
    <div
      className="backdrop"
      onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={ref}
      >
        <div className="mhead" style={{ background: `var(--${e.category})` }}>
          <span className="mz">{e.atomicNumber}</span>
          <div className="big">{e.symbol}</div>
          <h2 id="modal-title">{e.name}</h2>
          <small>{e.vietnameseName}</small>
        </div>

        <dl>
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <h3>Cấu hình electron đầy đủ</h3>
        <p className="cfg">{e.electronConfiguration}</p>

        <h3>Cấu hình rút gọn</h3>
        <p className="cfg">{e.shortConfiguration}</p>

        <button className="btn" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}