import { useState, useMemo } from 'react';
import { ELEMENTS } from '../data/elements.js';

// ===== Số hữu tỉ chính xác (BigInt) — tránh sai số dấu phẩy động =====
function babs(a) { return a < 0n ? -a : a; }
function bgcd(a, b) { a = babs(a); b = babs(b); while (b) { [a, b] = [b, a % b]; } return a === 0n ? 1n : a; }

class Frac {
  constructor(n, d = 1n) {
    if (typeof n === 'number') n = BigInt(n);
    if (typeof d === 'number') d = BigInt(d);
    if (d === 0n) throw new Error('Chia cho 0');
    if (d < 0n) { n = -n; d = -d; }
    const g = bgcd(n, d);
    this.n = n / g; this.d = d / g;
  }
  add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  isZero() { return this.n === 0n; }
}
const F0 = new Frac(0n), F1 = new Frac(1n);

// ===== Parser công thức hóa học: H2O, Ca(OH)2, Al2(SO4)3, CuSO4.5H2O... =====
const SYMSET = new Set(ELEMENTS.map((e) => e.symbol));
const isValidSymbol = (s) => SYMSET.has(s);

function parseFormula(f) {
  const stack = [{}];
  let i = 0;
  const readNumber = () => {
    let s = '';
    while (i < f.length && /\d/.test(f[i])) s += f[i++];
    return s ? parseInt(s, 10) : 1;
  };
  const add = (group, sym, n) => { group[sym] = (group[sym] || 0) + n; };
  const mergeIntoParent = (child, mult) => {
    const parent = stack[stack.length - 1];
    for (const k in child) add(parent, k, child[k] * mult);
  };
  while (i < f.length) {
    const c = f[i];
    if (c === '(' || c === '[') { stack.push({}); i++; continue; }
    if (c === ')' || c === ']') {
      if (stack.length < 2) throw new Error('Ngoặc không cân đối'); // check BEFORE popping
      i++;
      const top = stack.pop();
      const mult = readNumber();
      mergeIntoParent(top, mult);
      continue;
    }
    if (c === '·' || c === '.' || c === '*') {
      i++;
      const mult = readNumber();
      const rest = f.slice(i);
      const sub = parseFormula(rest);
      for (const k in sub) add(stack[stack.length - 1], k, sub[k] * mult);
      return stack[0];
    }
    if (!/[A-Za-z]/.test(c)) throw new Error(`Ký tự không hợp lệ: "${c}" trong "${f}"`);
    const two = f.slice(i, i + 2);
    const one = f[i];
    let sym;
    if (two.length === 2 && /^[A-Z][a-z]$/.test(two) && isValidSymbol(two)) { sym = two; i += 2; }
    else if (isValidSymbol(one)) { sym = one; i += 1; }
    else throw new Error(`Nguyên tố không tồn tại: "${/^[A-Z][a-z]$/.test(two) ? two : one}"`);
    const n = readNumber();
    add(stack[stack.length - 1], sym, n);
  }
  if (stack.length !== 1) throw new Error('Ngoặc không cân đối');
  return stack[0];
}

// ===== Tách phương trình thành 2 vế, mỗi vế thành các chất =====
function splitEquation(raw) {
  const arrowMatch = raw.match(/(<->|<=>|->|=>|→|⇌|=)/);
  if (!arrowMatch) throw new Error('Thiếu mũi tên phản ứng. Dùng "->", "=" hoặc "→" để ngăn cách 2 vế.');
  const left = raw.slice(0, arrowMatch.index);
  const right = raw.slice(arrowMatch.index + arrowMatch[0].length);
  const side = (s) =>
    s.split('+').map((t) => t.trim()).filter(Boolean).map((t) => {
      const noCoef = t.replace(/^\d+\s*/, ''); // bỏ hệ số người dùng gõ sẵn (sẽ tự tính lại)
      if (!noCoef) throw new Error(`Thiếu công thức trong cụm "${t}"`);
      return { formula: noCoef, counts: parseFormula(noCoef.replace(/\s/g, '')) };
    });
  const L = side(left), R = side(right);
  if (!L.length || !R.length) throw new Error('Cả hai vế phải có ít nhất một chất.');
  return { L, R };
}

// ===== Rút gọn ma trận về dạng bậc thang rút gọn (RREF) trên trường hữu tỉ =====
function rref(M) {
  const rows = M.length, cols = M[0].length;
  let lead = 0;
  const pivots = [];
  for (let r = 0; r < rows; r++) {
    if (lead >= cols) break;
    let i = r;
    while (M[i][lead].isZero()) {
      i++;
      if (i === rows) { i = r; lead++; if (lead === cols) return pivots; }
    }
    [M[i], M[r]] = [M[r], M[i]];
    const lv = M[r][lead];
    M[r] = M[r].map((v) => v.div(lv));
    for (let k = 0; k < rows; k++) {
      if (k === r) continue;
      const f = M[k][lead];
      if (!f.isZero()) M[k] = M[k].map((v, j) => v.sub(f.mul(M[r][j])));
    }
    pivots.push(lead);
    lead++;
  }
  return pivots;
}

// ===== Cân bằng: giải hệ thuần nhất A·x = 0, chọn nghiệm nguyên dương nhỏ nhất =====
function solveCoeffs(raw) {
  const { L, R } = splitEquation(raw);
  const terms = [...L.map((t) => ({ ...t, side: 1 })), ...R.map((t) => ({ ...t, side: -1 }))];
  const elements = [];
  for (const t of terms) for (const el in t.counts) if (!elements.includes(el)) elements.push(el);
  const nCols = terms.length;

  // Ma trận sâu, mỗi ô là Frac độc lập
  const M = elements.map((el) => terms.map((t) => new Frac((t.counts[el] || 0) * t.side)));
  const pivots = rref(M);

  const freeCols = [];
  for (let c = 0; c < nCols; c++) if (!pivots.includes(c)) freeCols.push(c);
  if (freeCols.length === 0) throw new Error('Không tìm được cách cân bằng — số ẩn số ít hơn số ràng buộc độc lập.');

  const chosen = freeCols[freeCols.length - 1];
  const x = new Array(nCols).fill(F0);
  x[chosen] = F1;
  for (let r = 0; r < pivots.length; r++) {
    const pc = pivots[r];
    x[pc] = M[r][chosen].neg();
  }

  // Quy đồng mẫu số chung rồi rút gọn về số nguyên nhỏ nhất
  let lcm = 1n;
  for (const f of x) lcm = (lcm * f.d) / bgcd(lcm, f.d);
  let ints = x.map((f) => (f.n * (lcm / f.d)));
  let g = 0n;
  for (const v of ints) g = bgcd(g, v);
  if (g === 0n) throw new Error('Không tìm được nghiệm hợp lệ.');
  ints = ints.map((v) => v / g);

  // Chuẩn hoá dấu: tất cả phải cùng dấu (dương)
  const nonZero = ints.filter((v) => v !== 0n);
  if (nonZero.some((v) => v < 0n) && nonZero.some((v) => v > 0n)) {
    throw new Error('Phương trình không thể cân bằng với các chất đã cho — kiểm tra lại chất tham gia/sản phẩm.');
  }
  if (nonZero.some((v) => v < 0n)) ints = ints.map((v) => -v);
  if (ints.some((v) => v === 0n)) {
    throw new Error('Có chất không tham gia phản ứng theo nghiệm tìm được — kiểm tra lại phương trình.');
  }

  const nLeft = terms.filter((t) => t.side === 1).length;
  const coeffL = ints.slice(0, nLeft).map((v) => Number(v));
  const coeffR = ints.slice(nLeft).map((v) => Number(v));
  const ambiguous = freeCols.length > 1;

  return { L, R, coeffL, coeffR, elements, ambiguous };
}

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

function formatSide(terms, coeffs) {
  return terms.map((t, i) => (coeffs[i] === 1 ? t.formula : `${coeffs[i]}${t.formula}`)).join(' + ');
}

export default function EquationBalancer() {
  const [eq, setEq] = useState('Fe + O2 -> Fe2O3');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const t = eq.trim();
    if (!t) return { empty: true };
    try {
      return { ok: true, ...solveCoeffs(t) };
    } catch (e) {
      return { err: e.message };
    }
  }, [eq]);

  const balancedStr = result.ok
    ? `${formatSide(result.L, result.coeffL)} → ${formatSide(result.R, result.coeffR)}`
    : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(balancedStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Bảng đối chiếu số nguyên tử mỗi nguyên tố ở 2 vế
  const check = result.ok
    ? result.elements.map((el) => {
        const left = result.L.reduce((s, t, i) => s + (t.counts[el] || 0) * result.coeffL[i], 0);
        const right = result.R.reduce((s, t, i) => s + (t.counts[el] || 0) * result.coeffR[i], 0);
        return { el, left, right, ok: left === right };
      })
    : [];

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
            </div>
            <button className="btn" onClick={copy} style={{ marginTop: '.8rem' }}>
              {copied ? '✓ Đã sao chép' : '📋 Sao chép'}
            </button>

            <h3 style={{ marginTop: '1.4rem' }}>Đối chiếu nguyên tố</h3>
            <dl className="eqn-check">
              {check.map((c) => (
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
