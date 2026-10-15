import { useState, useMemo } from 'react';
/* Lõi cân bằng dùng chung với lớp công cụ AI (aiTools.js) — một nguồn sự thật duy nhất */
import { balanceEquation, checkBalance, parseFormula } from '../lib/chemBalance.js';

const EXAMPLES = [
  'Fe + O2 -> Fe2O3',
  'KMnO4 -> K2MnO4 + MnO2 + O2',
  'Al + HCl -> AlCl3 + H2',
  'Cu + AgNO3 -> Cu(NO3)2 + Ag',
  'C3H8 + O2 -> CO2 + H2O',
  'FeS2 + O2 -> Fe2O3 + SO2',
  'NH3 + O2 -> NO + H2O',
  'Na2CO3 + HCl -> NaCl + H2O + CO2',
  'FeCl2 + Cl2 -> FeCl3',
  'Cu + H2SO4 -> CuSO4 + SO2 + H2O',
];

export default function EquationBalancer() {
  const [eq, setEq] = useState('Fe + O2 -> Fe2O3');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const t = eq.trim();
    if (!t) return { empty: true };
    try {
      return { ok: true, ...balanceEquation(t) };
    } catch (e) {
      return { err: e.message };
    }
  }, [eq]);

  /* Bản hiển thị: chỉ số Unicode (H₂O) cho dễ đọc */
  const balancedStr = result.ok ? result.pretty : '';
  const plainStr = result.ok ? result.equation : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const check = useMemo(() => {
    if (!result.ok) return [];
    const tally = {};
    const add = (formula, coef, sign) => {
      const counts = parseFormula(formula);
      for (const el in counts) tally[el] = (tally[el] || 0) + sign * counts[el] * coef;
    };
    for (const t of result.left) add(t.formula, t.coef, 1);
    for (const t of result.right) add(t.formula, t.coef, -1);
    const verified = checkBalance(result).ok;
    return {
      verified,
      rows: result.elements.map((el) => {
        const left = result.left.reduce((s, t) => s + (parseFormula(t.formula)[el] || 0) * t.coef, 0);
        const right = result.right.reduce((s, t) => s + (parseFormula(t.formula)[el] || 0) * t.coef, 0);
        return { el, left, right, ok: left === right };
      }),
    };
  }, [result]);

  return (
    <section className="wrap narrow">
      <h1>Cân bằng PTHH</h1>
      <p className="lead" style={{ fontSize: '1rem' }}>
        Nhập phương trình hóa học (chưa cần hệ số) — hệ được giải chính xác bằng đại số tuyến tính, không làm tròn.
      </p>

      <div className="card">
        <label>
          Phương trình
          <input
            value={eq}
            onChange={(e) => setEq(e.target.value)}
            placeholder="Fe + O2 -> Fe2O3"
            autoComplete="off"
            spellCheck="false"
            className="eqn-input"
          />
        </label>
        <p className="hint">Dùng <b>+</b> giữa các chất, và <b>-&gt;</b> hoặc <b>=</b> giữa 2 vế. Hỗ trợ ngoặc và ngậm nước (CuSO4.5H2O).</p>

        {result.err && (
          <p className="hint" style={{ color: 'var(--acc)' }}>⚠️ {result.err}</p>
        )}

        {result.ok && (
          <>
            <div className="eqn-result">
              <span>PHƯƠNG TRÌNH ĐÃ CÂN BẰNG</span>
              <b>{balancedStr}</b>
              {result.ambiguous && (
                <small style={{ color: 'var(--acc)' }}>
                  ⚠️ Phương trình có thể có nhiều cách cân bằng khác nhau — đây là một nghiệm hợp lệ.
                </small>
              )}
              {check.verified && (
                <small style={{ color: 'var(--ok, #2e9e5b)' }}>
                  ✓ Đã kiểm tra bảo toàn nguyên tố hai vế
                </small>
              )}
            </div>
            <button className="btn" onClick={copy} style={{ marginTop: '.8rem' }}>
              {copied ? '✓ Đã sao chép' : '📋 Sao chép'}
            </button>

            <h3 style={{ marginTop: '1.4rem' }}>Đối chiếu nguyên tố</h3>
            <dl className="eqn-check">
              {check.rows.map((c) => (
                <div key={c.el} className={c.ok ? '' : 'bad'}>
                  <dt>{c.el}</dt>
                  <dd>{c.left} = {c.right}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      <details className="card" style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer' }}>
          <b>⚡ Ví dụ nhanh</b>
        </summary>
        <div className="chips" style={{ marginTop: '.6rem' }}>
          {EXAMPLES.map((ex) => (
            <button key={ex} className="chip" type="button" onClick={() => setEq(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}
