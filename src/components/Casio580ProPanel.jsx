/* ============================================================
   Casio580ProPanel.jsx — Studio Chế Độ Nâng Cao Casio fx-580VN X
   ------------------------------------------------------------
   Kết nối TRỰC TIẾP vào lõi TypeScript fx-580VN X (zero eval()):
     • EquationMode (Hệ 2–4 ẩn & Đa thức bậc 2–4 + Cực trị)
     • calculus.ts (∫dx Tích phân · d/dx Đạo hàm · SHIFT+SOLVE · CALC)
     • TableMode (Bảng f(x), g(x) + phát hiện Min/Max/Đổi dấu)
     • ComplexNumber (a+bi ⇄ r∠φ cho dao động & mạch RLC xoay chiều)
     • MatrixMode & VectorMode (Ma trận 2×2/3×3 & Véc-tơ 3D)
     • StatisticsMode & BaseNMode (Thống kê 1 biến & DEC/HEX/BIN/OCT)
     • Hằng số KHTN THPT chèn 1 chạm vào LCD + Lịch sử tính toán
   ============================================================ */
import { useMemo, useState } from 'react';
import { EquationMode } from '../features/casio580/modes/equation/EquationMode.ts';
import { TableMode } from '../features/casio580/modes/table/TableMode.ts';
import { MatrixMode } from '../features/casio580/modes/matrix/MatrixMode.ts';
import { VectorMode } from '../features/casio580/modes/vector/VectorMode.ts';
import { StatisticsMode } from '../features/casio580/modes/statistics/StatisticsMode.ts';
import { BaseNMode } from '../features/casio580/modes/baseN/BaseNMode.ts';
import { ComplexNumber } from '../features/casio580/engine/complex.ts';
import { Decimal } from '../features/casio580/engine/decimal.ts';
import {
  numericalDerivative,
  numericalIntegral,
  solveEquationNewton,
  evaluateAtX,
  formatCleanNum,
} from '../features/casio580/engine/calculus.ts';

const PRO_TABS = [
  { id: 'eq', label: 'PT & Hệ', code: 'A' },
  { id: 'calc', label: '∫dx · SOLVE', code: '∫' },
  { id: 'table', label: 'Bảng f(x)', code: '9' },
  { id: 'complex', label: 'Số phức', code: '2' },
  { id: 'matvec', label: 'Ma trận · Véc-tơ', code: '4/5' },
  { id: 'statbase', label: 'Thống kê · Cơ số', code: '3/6' },
  { id: 'khtn', label: 'Hằng số · Lịch sử', code: 'KHTN' },
];

const KHTN_CONSTANTS = [
  { label: 'Vₘ (đkc)', value: '24.79', unit: 'L/mol · 25°C, 1 bar' },
  { label: 'Vₘ (đktc)', value: '22.4', unit: 'L/mol · 0°C, 1 atm' },
  { label: 'R (khí lý tưởng)', value: '8.314', unit: 'J/(mol·K)' },
  { label: 'Nₐ (Avogadro)', value: '6.022*10^23', unit: 'hạt/mol' },
  { label: 'F (Faraday)', value: '96500', unit: 'C/mol' },
  { label: 'g (trọng trường)', value: '9.8', unit: 'm/s²' },
  { label: 'c (ánh sáng)', value: '3*10^8', unit: 'm/s' },
  { label: 'h (Planck)', value: '6.626*10^(-34)', unit: 'J·s' },
  { label: 'e (điện tích e)', value: '1.6*10^(-19)', unit: 'C' },
  { label: 'k (Coulomb)', value: '9*10^9', unit: 'N·m²/C²' },
  { label: '1 u (KL nguyên tử)', value: '931.5', unit: 'MeV/c²' },
  { label: 'π (Pi)', value: 'pi', unit: '3.1415926536' },
];

const parseNum = (v, fallback = 0) => {
  const n = Number(String(v ?? '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : fallback;
};

const VAR_NAMES = ['x', 'y', 'z', 't'];
const POLY_LABELS = ['a', 'b', 'c', 'd', 'e'];

export default function Casio580ProPanel({
  activeTab: controlledTab,
  onTabChange,
  angleUnit = 'DEG',
  history = [],
  onInsertToLcd,
  onLoadHistory,
}) {
  const [innerTab, setInnerTab] = useState('eq');
  const tab = controlledTab || innerTab;
  const setTab = (next) => {
    setInnerTab(next);
    onTabChange?.(next);
  };

  /* ── 1. EQUATION & LINEAR SYSTEM ── */
  const [eqType, setEqType] = useState('sys'); // 'sys' | 'poly'
  const [sysN, setSysN] = useState(2);
  const [sysGrid, setSysGrid] = useState([
    ['1', '1', '0.5'],
    ['24', '27', '12.6'],
  ]);
  const [sysOut, setSysOut] = useState(null);
  const [sysErr, setSysErr] = useState('');

  const [polyDeg, setPolyDeg] = useState(2);
  const [polyCoeffs, setPolyCoeffs] = useState(['1', '-5', '6']);
  const [polyOut, setPolyOut] = useState(null);
  const [polyErr, setPolyErr] = useState('');

  const resizeSys = (n) => {
    setSysN(n);
    setSysOut(null);
    setSysErr('');
    const next = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n + 1 }, (_, c) => (c === r ? '1' : c === n ? String(r + 1) : '0'))
    );
    setSysGrid(next);
  };

  const resizePoly = (deg) => {
    setPolyDeg(deg);
    setPolyOut(null);
    setPolyErr('');
    if (deg === 2) setPolyCoeffs(['1', '-5', '6']);
    else if (deg === 3) setPolyCoeffs(['1', '-6', '11', '-6']);
    else setPolyCoeffs(['1', '0', '-5', '0', '4']);
  };

  const solveSys = () => {
    setSysErr('');
    try {
      const eq = new EquationMode();
      const A = sysGrid.map((row) => row.slice(0, sysN).map((v) => parseNum(v)));
      const B = sysGrid.map((row) => parseNum(row[sysN]));
      const res = eq.solveSystem(A, B);
      setSysOut(res);
    } catch (e) {
      setSysOut(null);
      setSysErr(e?.message || 'Không giải được hệ phương trình.');
    }
  };

  const solvePoly = () => {
    setPolyErr('');
    try {
      const eq = new EquationMode();
      const c = polyCoeffs.slice(0, polyDeg + 1).map((v) => parseNum(v));
      if (c[0] === 0) throw new Error('Hệ số bậc cao nhất (a) phải khác 0.');
      const res = eq.solvePolynomial(c);
      setPolyOut(res);
    } catch (e) {
      setPolyOut(null);
      setPolyErr(e?.message || 'Không giải được phương trình.');
    }
  };

  /* ── 2. CALCULUS: ∫dx · d/dx · SOLVE · CALC ── */
  const [calcSub, setCalcSub] = useState('integral'); // 'integral' | 'deriv' | 'solve' | 'eval'
  const [calcFn, setCalcFn] = useState('x^2 + 2*x');
  const [calcA, setCalcA] = useState('0');
  const [calcB, setCalcB] = useState('3');
  const [calcX0, setCalcX0] = useState('2');
  const [calcOut, setCalcOut] = useState(null);
  const [calcErr, setCalcErr] = useState('');

  const runCalculus = () => {
    setCalcErr('');
    setCalcOut(null);
    try {
      if (calcSub === 'integral') {
        const val = numericalIntegral(calcFn, parseNum(calcA), parseNum(calcB), angleUnit);
        setCalcOut({ title: `∫[${calcA} → ${calcB}] (${calcFn}) dx`, value: formatCleanNum(val, 10) });
      } else if (calcSub === 'deriv') {
        const val = numericalDerivative(calcFn, parseNum(calcX0), angleUnit);
        setCalcOut({ title: `d/dx (${calcFn}) tại x = ${calcX0}`, value: formatCleanNum(val, 10) });
      } else if (calcSub === 'solve') {
        const res = solveEquationNewton(calcFn, parseNum(calcX0, 1), angleUnit);
        setCalcOut({
          title: `Nghiệm x gần x₀ = ${calcX0}`,
          value: `x = ${formatCleanNum(res.root, 10)}`,
          sub: `Sai số |L−R| ≈ ${res.residual.toExponential(2)} (${res.iterations} vòng lặp)`,
        });
      } else {
        const val = evaluateAtX(calcFn, parseNum(calcX0), angleUnit);
        setCalcOut({ title: `Giá trị f(${calcX0})`, value: formatCleanNum(val, 10) });
      }
    } catch (e) {
      setCalcErr(e?.message || 'Biểu thức không hợp lệ.');
    }
  };

  /* ── 3. TABLE f(x), g(x) ── */
  const [tblF, setTblF] = useState('x^2 - 4*x + 3');
  const [tblG, setTblG] = useState('');
  const [tblStart, setTblStart] = useState('0');
  const [tblEnd, setTblEnd] = useState('5');
  const [tblStep, setTblStep] = useState('0.5');
  const [tblRows, setTblRows] = useState([]);
  const [tblErr, setTblErr] = useState('');

  const runTable = () => {
    setTblErr('');
    try {
      const tm = new TableMode();
      tm.setFunctionF(tblF);
      tm.setFunctionG(tblG.trim());
      tm.setTableType(tblG.trim() ? 'F_AND_G' : 'F_ONLY');
      tm.setRange({
        start: parseNum(tblStart, 0),
        end: parseNum(tblEnd, 5),
        step: Math.max(1e-6, parseNum(tblStep, 1)),
      });
      const res = tm.generate();
      setTblRows(res.rows || []);
    } catch (e) {
      setTblRows([]);
      setTblErr(e?.message || 'Không tạo được bảng giá trị.');
    }
  };

  const tblStats = useMemo(() => {
    const valid = tblRows
      .map((r, i) => ({ i, v: r.f?.value ? r.f.value.toNumber() : NaN }))
      .filter((x) => Number.isFinite(x.v));
    if (!valid.length) return { minIdx: -1, maxIdx: -1 };
    let min = valid[0];
    let max = valid[0];
    for (const x of valid) {
      if (x.v < min.v) min = x;
      if (x.v > max.v) max = x;
    }
    return { minIdx: min.i, maxIdx: max.i };
  }, [tblRows]);

  /* ── 4. COMPLEX (a+bi & r∠φ — Vật lý 12 Dao động & Xoay chiều) ── */
  const [cForm, setCForm] = useState('polar'); // 'rect' | 'polar'
  const [z1A, setZ1A] = useState('4');
  const [z1B, setZ1B] = useState('30');
  const [z2A, setZ2A] = useState('4');
  const [z2B, setZ2B] = useState('-30');
  const [cOp, setCOp] = useState('+');
  const [cOut, setCOut] = useState(null);
  const [cErr, setCErr] = useState('');

  const runComplex = () => {
    setCErr('');
    try {
      const mk = (a, b) =>
        cForm === 'polar'
          ? ComplexNumber.fromPolar(Decimal.fromNumber(parseNum(a)), Decimal.fromNumber(parseNum(b)), angleUnit)
          : new ComplexNumber(Decimal.fromNumber(parseNum(a)), Decimal.fromNumber(parseNum(b)));
      const z1 = mk(z1A, z1B);
      const z2 = mk(z2A, z2B);
      const res =
        cOp === '+' ? z1.add(z2)
          : cOp === '-' ? z1.sub(z2)
            : cOp === '*' ? z1.mul(z2)
              : z1.div(z2);
      setCOut({
        rect: res.toString(angleUnit),
        r: formatCleanNum(res.abs().toNumber(), 6),
        phi: formatCleanNum(res.arg(angleUnit).toNumber(), 5),
        unitLabel: angleUnit === 'DEG' ? '°' : angleUnit === 'RAD' ? ' rad' : ' grad',
      });
    } catch (e) {
      setCOut(null);
      setCErr(e?.message || 'Lỗi phép tính số phức.');
    }
  };

  /* ── 5. MATRIX & VECTOR ── */
  const [mvSub, setMvSub] = useState('vec'); // 'vec' | 'mat'
  const [vecA, setVecA] = useState(['1', '2', '3']);
  const [vecB, setVecB] = useState(['4', '-1', '2']);
  const [vecOut, setVecOut] = useState(null);

  const [matSize, setMatSize] = useState(2);
  const [matA, setMatA] = useState([['2', '1'], ['5', '3']]);
  const [matB, setMatB] = useState([['1', '0'], ['2', '4']]);
  const [matOut, setMatOut] = useState(null);
  const [matErr, setMatErr] = useState('');

  const runVector = () => {
    const vm = new VectorMode();
    vm.defineVector('VctA', vecA.map((v) => parseNum(v)));
    vm.defineVector('VctB', vecB.map((v) => parseNum(v)));
    setVecOut({
      dot: formatCleanNum(vm.dot('VctA', 'VctB').toNumber(), 8),
      cross: `(${vm.cross('VctA', 'VctB').toStringArray().join(', ')})`,
      magA: formatCleanNum(vm.magnitude('VctA').toNumber(), 6),
      magB: formatCleanNum(vm.magnitude('VctB').toNumber(), 6),
      angle: formatCleanNum(vm.angle('VctA', 'VctB', angleUnit).toNumber(), 4),
    });
  };

  const resizeMat = (n) => {
    setMatSize(n);
    setMatOut(null);
    setMatErr('');
    const mk = (seed) => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r === c ? String(seed) : '0')));
    setMatA(mk(2));
    setMatB(mk(1));
  };

  const runMatrixOp = (op) => {
    setMatErr('');
    try {
      const mm = new MatrixMode();
      mm.defineMatrix('MatA', matA.map((row) => row.map((v) => parseNum(v))));
      mm.defineMatrix('MatB', matB.map((row) => row.map((v) => parseNum(v))));
      if (op === 'det') {
        setMatOut({ kind: 'scalar', label: 'det(MatA)', value: formatCleanNum(mm.det('MatA').toNumber(), 8) });
      } else if (op === 'inv') {
        setMatOut({ kind: 'matrix', label: 'MatA⁻¹', rows: mm.inv('MatA').toStringArray() });
      } else if (op === 'trn') {
        setMatOut({ kind: 'matrix', label: 'MatAᵀ', rows: mm.transpose('MatA').toStringArray() });
      } else if (op === 'add') {
        setMatOut({ kind: 'matrix', label: 'MatA + MatB', rows: mm.add('MatA', 'MatB').toStringArray() });
      } else if (op === 'mul') {
        setMatOut({ kind: 'matrix', label: 'MatA × MatB', rows: mm.mul('MatA', 'MatB').toStringArray() });
      }
    } catch (e) {
      setMatOut(null);
      setMatErr(e?.message || 'Lỗi phép toán ma trận.');
    }
  };

  /* ── 6. STATISTICS & BASE-N ── */
  const [statInput, setStatInput] = useState('7.5, 8.0, 8.5, 9.0, 7.0, 8.5, 9.5');
  const [statOut, setStatOut] = useState(null);
  const [statErr, setStatErr] = useState('');

  const [baseIn, setBaseIn] = useState('255');
  const [baseType, setBaseType] = useState('DEC');

  const runStat = () => {
    setStatErr('');
    try {
      const nums = statInput
        .split(/[\s,;]+/)
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isFinite(x));
      if (nums.length === 0) throw new Error('Hãy nhập ít nhất 1 số liệu.');
      const sm = new StatisticsMode();
      sm.setData1Var(nums.map((x) => ({ x, freq: 1 })));
      setStatOut(sm.calculate1Var());
    } catch (e) {
      setStatOut(null);
      setStatErr(e?.message || 'Dữ liệu thống kê không hợp lệ.');
    }
  };

  const baseValues = useMemo(() => {
    try {
      const bm = new BaseNMode();
      const val = bm.parse(baseIn.trim() || '0', baseType);
      return {
        ok: true,
        DEC: bm.format(val, 'DEC'),
        HEX: bm.format(val, 'HEX').replace(/^0+(?=.)/, '').toUpperCase(),
        BIN: bm.format(val, 'BIN').replace(/^0+(?=.)/, ''),
        OCT: bm.format(val, 'OCT').replace(/^0+(?=.)/, ''),
      };
    } catch {
      return { ok: false, error: `Số "${baseIn}" không hợp lệ ở hệ ${baseType}` };
    }
  }, [baseIn, baseType]);

  return (
    <div className="elec-cpro">
      <div className="elec-cpro-tabs" role="tablist" aria-label="Chế độ nâng cao Casio fx-580VN X">
        {PRO_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={'elec-cpro-tab' + (tab === t.id ? ' on' : '')}
            onClick={() => setTab(t.id)}
          >
            <em>{t.code}</em>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="elec-cpro-body">
        {/* 1. EQUATION & LINEAR SYSTEM */}
        {tab === 'eq' && (
          <div className="elec-cpro-pane">
            <div className="elec-cpro-seg">
              <button type="button" className={eqType === 'sys' ? 'on' : ''} onClick={() => setEqType('sys')}>
                Hệ phương trình (2–4 ẩn)
              </button>
              <button type="button" className={eqType === 'poly' ? 'on' : ''} onClick={() => setEqType('poly')}>
                Đa thức bậc 2–4 &amp; Cực trị
              </button>
            </div>

            {eqType === 'sys' ? (
              <>
                <div className="elec-cpro-row">
                  <span className="elec-cpro-lbl">Số ẩn:</span>
                  {[2, 3, 4].map((n) => (
                    <button key={n} type="button" className={'elec-cpro-pill' + (sysN === n ? ' on' : '')} onClick={() => resizeSys(n)}>
                      {n} ẩn
                    </button>
                  ))}
                  <button
                    type="button"
                    className="elec-cpro-pill ghost"
                    onClick={() => {
                      setSysN(2);
                      setSysGrid([['1', '1', '0.5'], ['24', '27', '12.6']]);
                      setSysOut(null);
                    }}
                  >
                    Mẫu Hóa học (Mg, Al)
                  </button>
                </div>

                <div className="elec-cpro-matrix" style={{ '--cols': sysN + 1 }}>
                  {sysGrid.map((row, r) => (
                    <div className="elec-cpro-eq-row" key={r}>
                      {row.map((cell, c) => (
                        <label className="elec-cpro-cell" key={c}>
                          <span>{c < sysN ? VAR_NAMES[c] : '= c'}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={cell}
                            onChange={(e) => {
                              const next = sysGrid.map((rr) => [...rr]);
                              next[r][c] = e.target.value;
                              setSysGrid(next);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>

                <button type="button" className="elec-cpro-run" onClick={solveSys}>
                  Giải hệ phương trình
                </button>
                {sysErr && <p className="elec-cpro-err">{sysErr}</p>}
                {sysOut && (
                  <div className="elec-cpro-result">
                    {sysOut.status === 'UNIQUE' ? (
                      <div className="elec-cpro-sol-grid">
                        {sysOut.solutions.map((s) => (
                          <button
                            key={s.variable}
                            type="button"
                            className="elec-cpro-sol-chip"
                            onClick={() => onInsertToLcd?.(String(s.value.toNumber()))}
                            title="Nhấn để chèn vào màn hình Casio"
                          >
                            <span>{s.variable} =</span>
                            <b>{s.value.getDisplayText()}</b>
                            <small>{formatCleanNum(s.value.toNumber(), 6)}</small>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="elec-cpro-msg">{sysOut.message || sysOut.status}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="elec-cpro-row">
                  <span className="elec-cpro-lbl">Bậc đa thức:</span>
                  {[2, 3, 4].map((d) => (
                    <button key={d} type="button" className={'elec-cpro-pill' + (polyDeg === d ? ' on' : '')} onClick={() => resizePoly(d)}>
                      Bậc {d}
                    </button>
                  ))}
                </div>
                <div className="elec-cpro-eq-row">
                  {Array.from({ length: polyDeg + 1 }, (_, i) => {
                    const pow = polyDeg - i;
                    const label = pow > 1 ? `${POLY_LABELS[i]}x^${pow}` : pow === 1 ? `${POLY_LABELS[i]}x` : POLY_LABELS[i];
                    return (
                      <label className="elec-cpro-cell" key={i}>
                        <span>{label}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={polyCoeffs[i] ?? '0'}
                          onChange={(e) => {
                            const next = [...polyCoeffs];
                            next[i] = e.target.value;
                            setPolyCoeffs(next);
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
                <button type="button" className="elec-cpro-run" onClick={solvePoly}>
                  Giải phương trình &amp; Tìm cực trị
                </button>
                {polyErr && <p className="elec-cpro-err">{polyErr}</p>}
                {polyOut && (
                  <div className="elec-cpro-result">
                    <div className="elec-cpro-sol-grid">
                      {polyOut.roots.map((r, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="elec-cpro-sol-chip"
                          onClick={() => r.isReal && onInsertToLcd?.(String(r.real.toNumber()))}
                          title={r.isReal ? 'Nhấn để chèn nghiệm vào LCD' : 'Nghiệm phức'}
                        >
                          <span>x{idx + 1} =</span>
                          <b>{r.displayText}</b>
                        </button>
                      ))}
                    </div>
                    {polyOut.extrema?.length > 0 && (
                      <div className="elec-cpro-extrema">
                        {polyOut.extrema.map((ex, i) => (
                          <div key={i}>
                            <b>{ex.type === 'MINIMUM' ? 'Cực tiểu' : 'Cực đại'}:</b>{' '}
                            x = {ex.x.getDisplayText()} · y = {ex.y.getDisplayText()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 2. CALCULUS: ∫dx · d/dx · SOLVE · CALC */}
        {tab === 'calc' && (
          <div className="elec-cpro-pane">
            <div className="elec-cpro-seg">
              {[
                ['integral', '∫dx Tích phân'],
                ['deriv', 'd/dx Đạo hàm'],
                ['solve', 'SHIFT+SOLVE'],
                ['eval', 'CALC f(x)'],
              ].map(([id, lbl]) => (
                <button
                  key={id}
                  type="button"
                  className={calcSub === id ? 'on' : ''}
                  onClick={() => {
                    setCalcSub(id);
                    setCalcOut(null);
                    setCalcErr('');
                    if (id === 'solve' && !calcFn.includes('=')) setCalcFn('2^x = 10');
                    if (id !== 'solve' && calcFn.includes('=')) setCalcFn('x^2 + 2*x');
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <label className="elec-cpro-field">
              <span>{calcSub === 'solve' ? 'Phương trình ẩn x (dùng dấu =)' : 'Biểu thức f(x) (đơn vị góc: ' + angleUnit + ')'}</span>
              <input
                type="text"
                value={calcFn}
                onChange={(e) => setCalcFn(e.target.value)}
                placeholder={calcSub === 'solve' ? 'VD: 2^x = 10 hoặc x^3 - 3*x - 1 = 0' : 'VD: sin(x) + x^2'}
              />
            </label>

            {calcSub === 'integral' ? (
              <div className="elec-cpro-two">
                <label className="elec-cpro-field">
                  <span>Cận dưới a</span>
                  <input type="text" inputMode="decimal" value={calcA} onChange={(e) => setCalcA(e.target.value)} />
                </label>
                <label className="elec-cpro-field">
                  <span>Cận trên b</span>
                  <input type="text" inputMode="decimal" value={calcB} onChange={(e) => setCalcB(e.target.value)} />
                </label>
              </div>
            ) : (
              <label className="elec-cpro-field">
                <span>{calcSub === 'solve' ? 'Giá trị đoán ban đầu x₀' : 'Tại điểm x₀'}</span>
                <input type="text" inputMode="decimal" value={calcX0} onChange={(e) => setCalcX0(e.target.value)} />
              </label>
            )}

            <button type="button" className="elec-cpro-run" onClick={runCalculus}>
              {calcSub === 'integral' ? 'Tính tích phân ∫dx' : calcSub === 'deriv' ? 'Tính đạo hàm d/dx' : calcSub === 'solve' ? 'Giải nghiệm SOLVE' : 'Tính CALC'}
            </button>
            {calcErr && <p className="elec-cpro-err">{calcErr}</p>}
            {calcOut && (
              <div className="elec-cpro-result">
                <small className="elec-cpro-res-title">{calcOut.title}</small>
                <div className="elec-cpro-res-big">{calcOut.value}</div>
                {calcOut.sub && <small className="elec-cpro-res-sub">{calcOut.sub}</small>}
              </div>
            )}
          </div>
        )}

        {/* 3. TABLE f(x), g(x) */}
        {tab === 'table' && (
          <div className="elec-cpro-pane">
            <div className="elec-cpro-two">
              <label className="elec-cpro-field">
                <span>Hàm f(x)</span>
                <input type="text" value={tblF} onChange={(e) => setTblF(e.target.value)} placeholder="x^2 - 4*x + 3" />
              </label>
              <label className="elec-cpro-field">
                <span>Hàm g(x) (tùy chọn)</span>
                <input type="text" value={tblG} onChange={(e) => setTblG(e.target.value)} placeholder="Để trống nếu 1 hàm" />
              </label>
            </div>
            <div className="elec-cpro-three">
              <label className="elec-cpro-field">
                <span>Start</span>
                <input type="text" inputMode="decimal" value={tblStart} onChange={(e) => setTblStart(e.target.value)} />
              </label>
              <label className="elec-cpro-field">
                <span>End</span>
                <input type="text" inputMode="decimal" value={tblEnd} onChange={(e) => setTblEnd(e.target.value)} />
              </label>
              <label className="elec-cpro-field">
                <span>Step</span>
                <input type="text" inputMode="decimal" value={tblStep} onChange={(e) => setTblStep(e.target.value)} />
              </label>
            </div>
            <button type="button" className="elec-cpro-run" onClick={runTable}>
              Lập bảng giá trị (MENU 9)
            </button>
            {tblErr && <p className="elec-cpro-err">{tblErr}</p>}
            {tblRows.length > 0 && (
              <div className="elec-cpro-table-wrap">
                <table className="elec-cpro-table">
                  <thead>
                    <tr>
                      <th>x</th>
                      <th>f(x)</th>
                      {tblG.trim() && <th>g(x)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tblRows.map((r, i) => {
                      const tag = i === tblStats.minIdx ? 'MIN' : i === tblStats.maxIdx ? 'MAX' : null;
                      return (
                        <tr key={i} className={tag ? 'is-ext' : ''}>
                          <td>{r.x?.displayText ?? ''}</td>
                          <td>
                            {r.f?.isError ? <em className="err">ERROR</em> : (r.f?.displayText ?? '—')}
                            {tag && <span className="elec-cpro-ext-tag">{tag}</span>}
                          </td>
                          {tblG.trim() && <td>{r.g?.isError ? <em className="err">ERROR</em> : (r.g?.displayText ?? '—')}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. COMPLEX (Dao động & Điện xoay chiều) */}
        {tab === 'complex' && (
          <div className="elec-cpro-pane">
            <div className="elec-cpro-seg">
              <button type="button" className={cForm === 'polar' ? 'on' : ''} onClick={() => setCForm('polar')}>
                Dạng cực r ∠ φ ({angleUnit})
              </button>
              <button type="button" className={cForm === 'rect' ? 'on' : ''} onClick={() => setCForm('rect')}>
                Dạng đại số a + bi
              </button>
            </div>
            <div className="elec-cpro-two">
              <label className="elec-cpro-field">
                <span>{cForm === 'polar' ? 'z₁: Biên độ r₁' : 'z₁: Phần thực a₁'}</span>
                <input type="text" inputMode="decimal" value={z1A} onChange={(e) => setZ1A(e.target.value)} />
              </label>
              <label className="elec-cpro-field">
                <span>{cForm === 'polar' ? `z₁: Pha φ₁ (${angleUnit})` : 'z₁: Phần ảo b₁'}</span>
                <input type="text" inputMode="decimal" value={z1B} onChange={(e) => setZ1B(e.target.value)} />
              </label>
            </div>
            <div className="elec-cpro-row">
              <span className="elec-cpro-lbl">Phép tính:</span>
              {['+', '-', '*', '/'].map((op) => (
                <button key={op} type="button" className={'elec-cpro-pill' + (cOp === op ? ' on' : '')} onClick={() => setCOp(op)}>
                  {op === '*' ? '×' : op === '/' ? '÷' : op}
                </button>
              ))}
            </div>
            <div className="elec-cpro-two">
              <label className="elec-cpro-field">
                <span>{cForm === 'polar' ? 'z₂: Biên độ r₂' : 'z₂: Phần thực a₂'}</span>
                <input type="text" inputMode="decimal" value={z2A} onChange={(e) => setZ2A(e.target.value)} />
              </label>
              <label className="elec-cpro-field">
                <span>{cForm === 'polar' ? `z₂: Pha φ₂ (${angleUnit})` : 'z₂: Phần ảo b₂'}</span>
                <input type="text" inputMode="decimal" value={z2B} onChange={(e) => setZ2B(e.target.value)} />
              </label>
            </div>
            <button type="button" className="elec-cpro-run" onClick={runComplex}>
              Tính số phức (MENU 2)
            </button>
            {cErr && <p className="elec-cpro-err">{cErr}</p>}
            {cOut && (
              <div className="elec-cpro-result">
                <div className="elec-cpro-sol-grid">
                  <div className="elec-cpro-sol-chip">
                    <span>Dạng a + bi</span>
                    <b>{cOut.rect}</b>
                  </div>
                  <div className="elec-cpro-sol-chip">
                    <span>Dạng r ∠ φ</span>
                    <b>{cOut.r} ∠ {cOut.phi}{cOut.unitLabel}</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. MATRIX & VECTOR */}
        {tab === 'matvec' && (
          <div className="elec-cpro-pane">
            <div className="elec-cpro-seg">
              <button type="button" className={mvSub === 'vec' ? 'on' : ''} onClick={() => setMvSub('vec')}>
                Véc-tơ 3D (MENU 5)
              </button>
              <button type="button" className={mvSub === 'mat' ? 'on' : ''} onClick={() => setMvSub('mat')}>
                Ma trận vuông (MENU 4)
              </button>
            </div>

            {mvSub === 'vec' ? (
              <>
                <div className="elec-cpro-eq-row">
                  {['x', 'y', 'z'].map((ax, i) => (
                    <label className="elec-cpro-cell" key={ax}>
                      <span>a.{ax}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={vecA[i]}
                        onChange={(e) => {
                          const next = [...vecA];
                          next[i] = e.target.value;
                          setVecA(next);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <div className="elec-cpro-eq-row">
                  {['x', 'y', 'z'].map((ax, i) => (
                    <label className="elec-cpro-cell" key={ax}>
                      <span>b.{ax}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={vecB[i]}
                        onChange={(e) => {
                          const next = [...vecB];
                          next[i] = e.target.value;
                          setVecB(next);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <button type="button" className="elec-cpro-run" onClick={runVector}>
                  Tính tích vô hướng, có hướng &amp; góc
                </button>
                {vecOut && (
                  <div className="elec-cpro-result">
                    <div className="elec-cpro-sol-grid">
                      <div className="elec-cpro-sol-chip"><span>a · b</span><b>{vecOut.dot}</b></div>
                      <div className="elec-cpro-sol-chip"><span>[a, b]</span><b>{vecOut.cross}</b></div>
                      <div className="elec-cpro-sol-chip"><span>|a| / |b|</span><b>{vecOut.magA} / {vecOut.magB}</b></div>
                      <div className="elec-cpro-sol-chip"><span>Góc ({angleUnit})</span><b>{vecOut.angle}</b></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="elec-cpro-row">
                  <span className="elec-cpro-lbl">Cỡ ma trận:</span>
                  {[2, 3].map((n) => (
                    <button key={n} type="button" className={'elec-cpro-pill' + (matSize === n ? ' on' : '')} onClick={() => resizeMat(n)}>
                      {n}×{n}
                    </button>
                  ))}
                </div>
                <div className="elec-cpro-two">
                  <div>
                    <small className="elec-cpro-lbl">Ma trận A</small>
                    {matA.map((row, r) => (
                      <div className="elec-cpro-eq-row" key={r}>
                        {row.map((val, c) => (
                          <input
                            key={c}
                            className="elec-cpro-mini-in"
                            type="text"
                            inputMode="decimal"
                            value={val}
                            onChange={(e) => {
                              const next = matA.map((rr) => [...rr]);
                              next[r][c] = e.target.value;
                              setMatA(next);
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div>
                    <small className="elec-cpro-lbl">Ma trận B</small>
                    {matB.map((row, r) => (
                      <div className="elec-cpro-eq-row" key={r}>
                        {row.map((val, c) => (
                          <input
                            key={c}
                            className="elec-cpro-mini-in"
                            type="text"
                            inputMode="decimal"
                            value={val}
                            onChange={(e) => {
                              const next = matB.map((rr) => [...rr]);
                              next[r][c] = e.target.value;
                              setMatB(next);
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="elec-cpro-row">
                  {[
                    ['det', 'det(A)'],
                    ['inv', 'A⁻¹'],
                    ['trn', 'Aᵀ'],
                    ['add', 'A + B'],
                    ['mul', 'A × B'],
                  ].map(([op, lbl]) => (
                    <button key={op} type="button" className="elec-cpro-pill on" onClick={() => runMatrixOp(op)}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {matErr && <p className="elec-cpro-err">{matErr}</p>}
                {matOut && (
                  <div className="elec-cpro-result">
                    <small className="elec-cpro-res-title">{matOut.label}</small>
                    {matOut.kind === 'scalar' ? (
                      <div className="elec-cpro-res-big">{matOut.value}</div>
                    ) : (
                      <div className="elec-cpro-mat-out">
                        {matOut.rows.map((row, r) => (
                          <div key={r} className="elec-cpro-mat-out-row">
                            {row.map((v, c) => <span key={c}>{v}</span>)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 6. STATISTICS & BASE-N */}
        {tab === 'statbase' && (
          <div className="elec-cpro-pane">
            <label className="elec-cpro-field">
              <span>Thống kê 1 biến (MENU 6) — nhập dãy số cách nhau bằng dấu phẩy hoặc khoảng trắng</span>
              <input type="text" value={statInput} onChange={(e) => setStatInput(e.target.value)} />
            </label>
            <button type="button" className="elec-cpro-run" onClick={runStat}>
              Phân tích thống kê 1-VAR
            </button>
            {statErr && <p className="elec-cpro-err">{statErr}</p>}
            {statOut && (
              <div className="elec-cpro-result">
                <div className="elec-cpro-sol-grid">
                  <div className="elec-cpro-sol-chip"><span>Trung bình x̄</span><b>{formatCleanNum(statOut.meanX, 6)}</b></div>
                  <div className="elec-cpro-sol-chip"><span>Tổng Σx (n={statOut.n})</span><b>{formatCleanNum(statOut.sumX, 6)}</b></div>
                  <div className="elec-cpro-sol-chip"><span>Độ lệch chuẩn σx</span><b>{formatCleanNum(statOut.sigmaX, 6)}</b></div>
                  <div className="elec-cpro-sol-chip"><span>Trung vị Med</span><b>{formatCleanNum(statOut.med, 6)}</b></div>
                  <div className="elec-cpro-sol-chip"><span>Tứ phân vị Q₁ / Q₃</span><b>{formatCleanNum(statOut.q1, 5)} / {formatCleanNum(statOut.q3, 5)}</b></div>
                  <div className="elec-cpro-sol-chip"><span>Min / Max</span><b>{statOut.minX} / {statOut.maxX}</b></div>
                </div>
              </div>
            )}

            <hr className="elec-cpro-hr" />

            <div className="elec-cpro-row">
              <span className="elec-cpro-lbl">Đổi hệ cơ số (MENU 3):</span>
              {['DEC', 'HEX', 'BIN', 'OCT'].map((b) => (
                <button key={b} type="button" className={'elec-cpro-pill' + (baseType === b ? ' on' : '')} onClick={() => setBaseType(b)}>
                  {b}
                </button>
              ))}
            </div>
            <label className="elec-cpro-field">
              <span>Nhập số nguyên ({baseType})</span>
              <input type="text" value={baseIn} onChange={(e) => setBaseIn(e.target.value)} />
            </label>
            {baseValues.ok ? (
              <div className="elec-cpro-sol-grid">
                {['DEC', 'HEX', 'BIN', 'OCT'].map((b) => (
                  <div key={b} className="elec-cpro-sol-chip">
                    <span>{b}</span>
                    <b>{baseValues[b]}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="elec-cpro-err">{baseValues.error}</p>
            )}
          </div>
        )}

        {/* 7. KHTN CONSTANTS & HISTORY TAPE */}
        {tab === 'khtn' && (
          <div className="elec-cpro-pane">
            <small className="elec-cpro-lbl">Chèn nhanh hằng số Hóa – Lý vào màn hình Casio (1 chạm)</small>
            <div className="elec-cpro-const-grid">
              {KHTN_CONSTANTS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  className="elec-cpro-const-btn"
                  onClick={() => onInsertToLcd?.(c.value)}
                >
                  <b>{c.label}</b>
                  <span>{c.value}</span>
                  <small>{c.unit}</small>
                </button>
              ))}
            </div>

            <hr className="elec-cpro-hr" />
            <small className="elec-cpro-lbl">Lịch sử bấm máy gần đây ({history.length} mục)</small>
            {history.length === 0 ? (
              <p className="elec-cpro-empty">Chưa có phép tính nào. Bấm phép tính trên máy Casio bên cạnh để tự lưu lịch sử.</p>
            ) : (
              <div className="elec-cpro-hist-list">
                {[...history].reverse().slice(0, 12).map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    className="elec-cpro-hist-item"
                    onClick={() => onLoadHistory?.(h.expression, h.result)}
                    title="Nhấn để nạp lại vào màn hình LCD"
                  >
                    <span>{h.expression}</span>
                    <b>= {h.result}</b>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
