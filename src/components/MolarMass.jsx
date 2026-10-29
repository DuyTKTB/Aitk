import { useState, useMemo } from 'react';
/* Lõi tính toán dùng chung với lớp công cụ AI (aiTools.js) — một nguồn sự thật duy nhất */
import { parseFormula, molarMass } from '../lib/chemBalance.js';
import { IconAlert } from './Icons.jsx';

const fmt = (n, digits = 4) => {
  if (isNaN(n) || !isFinite(n)) return '—';
  if (n === 0) return '0';
  if (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e6) return n.toPrecision(digits);
  return +n.toFixed(digits);
};

export default function MolarMass() {
  const [f, setF] = useState('Ca(OH)2');
  const [v, setV] = useState('1');
  const [unit, setUnit] = useState('mol');
  const [useSGK, setUseSGK] = useState(false);

  const result = useMemo(() => {
    const t = f.replace(/\s/g, '');
    if (!t) return { ok: false, empty: true };
    try {
      const mm = molarMass(t, { sgk: useSGK });
      if (mm.unknown.length) {
        return { ok: false, err: `Chưa có khối lượng nguyên tử cho: ${mm.unknown.join(', ')}` };
      }
      if (!mm.value) return { ok: false, err: 'Không tính được khối lượng mol.' };
      return { ok: true, parts: parseFormula(t), M: mm.value, breakdown: mm.breakdown };
    } catch (err) {
      return { ok: false, err: err.message };
    }
  }, [f, useSGK]);

  const { ok, M, err, empty, breakdown } = result;
  const x = parseFloat(v);
  const mol =
    !ok || isNaN(x)
      ? NaN
      : unit === 'mol'
        ? x
        : unit === 'g'
          ? x / M
          : x / 22.4; // đktc: 0°C, 1 atm (theo SGK VN)

  return (
    <section className="wrap narrow">
      <h1>Máy tính khối lượng mol</h1>
      <div className="card">
        <label>
          Công thức (vd: H2SO4, Ca(OH)2, Al2(SO4)3, CuSO4.5H2O)
          <input
            value={f}
            onChange={(e) => setF(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </label>

        {empty && <p className="hint">Nhập công thức để bắt đầu.</p>}
        {err && (
          <p className="hint" style={{ color: 'var(--acc)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <IconAlert size={14} /> {err}
          </p>
        )}

        {ok && (
          <>
            <p className="result">
              <span>M</span>
              <b>{fmt(M)}</b>
              <small>g/mol</small>
            </p>
            <p className="hint center">
              {breakdown.map((b) => `${b.symbol}×${b.count} (${b.mass})`).join(' + ')}
            </p>

            <label className="row" style={{ marginTop: '.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useSGK}
                onChange={(e) => setUseSGK(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span style={{ textTransform: 'none', letterSpacing: 0 }}>
                Dùng số liệu SGK phổ thông VN (làm tròn)
              </span>
            </label>

            <div className="row" style={{ marginTop: '1rem' }}>
              <label style={{ flex: 1 }}>
                Giá trị
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={v}
                  onChange={(e) => setV(e.target.value)}
                />
              </label>
              <label>
                Đơn vị
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="mol">mol</option>
                  <option value="g">gam</option>
                  <option value="l">lít khí (đktc)</option>
                </select>
              </label>
            </div>

            <dl>
              <div>
                <dt>Số mol</dt>
                <dd>{fmt(mol)} mol</dd>
              </div>
              <div>
                <dt>Khối lượng</dt>
                <dd>{fmt(mol * M)} g</dd>
              </div>
              <div>
                <dt>Thể tích khí (đktc)</dt>
                <dd>{fmt(mol * 22.4)} lít</dd>
              </div>
            </dl>
            <p className="hint" style={{ marginTop: '.4rem' }}>
              * Đktc = 0°C, 1 atm → 22.4 L/mol (theo SGK VN).
            </p>
          </>
        )}
      </div>
    </section>
  );
}
