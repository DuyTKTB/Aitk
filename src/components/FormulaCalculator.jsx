import { useState, useMemo, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks.js';
import { ELEMENTS, SGK_MASS } from '../data/elements.js';
import './FormulaCalculator.css';

/* ========================================================================
   Tiện ích
   ==================================================================== */
const fmt = (n, d = 4) => {
  if (n === null || n === undefined || Number.isNaN(n) || !isFinite(n)) return '—';
  if (Math.abs(n) < 1e-9) return '0';
  if (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e6) return n.toPrecision(d);
  return +n.toFixed(d);
};
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
const eq = (a, b) => Math.abs(a - b) < 1e-9;
const I = (k, label, unit = '', x = {}) => ({ k, label, unit, ...x });
const S = (k, label, options, def) => ({ k, label, options, def });

const ToastCtx = createContext(() => {});
const TouchCtx = createContext(() => {});
const useCopy = () => {
  const notify = useContext(ToastCtx);
  return async (text) => {
    try { await navigator.clipboard.writeText(String(text)); notify('Đã sao chép'); }
    catch { notify('Không sao chép được'); }
  };
};

/* Giải phương trình: ô nào để trống (đúng 1 ô) sẽ được tính */
const solve = (v, rules) => {
  const bl = Object.keys(rules).filter((k) => Number.isNaN(v[k]));
  if (bl.length !== 1) return [{ l: 'Cách dùng', v: 'Để trống đúng 1 ô — ô đó sẽ được tính', warn: true }];
  const [label, unit, fn, d] = rules[bl[0]];
  return [{ l: label, v: fn(v), u: unit, main: true, d }];
};

/* Máy tính biểu thức (không dùng eval) */
const CONSTS = { R: 0.082, NA: 6.022e23, F: 96500, Kw: 1e-14, pi: Math.PI };
const FUNCS = { sqrt: Math.sqrt, log: Math.log10, lg: Math.log10, ln: Math.log, exp: Math.exp, abs: Math.abs };
function evalExpr(src) {
  const s = src.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
  if (!s) return null;
  const t = s.match(/\d*\.?\d+(?:e[+-]?\d+)?|[a-z]+|[-+*/^()]/gi);
  if (!t || t.join('') !== s) throw new Error('Ký tự không hợp lệ');
  let p = 0;
  const peek = () => t[p];
  const next = () => t[p++];
  const expr = () => {
    let v = term();
    while (peek() === '+' || peek() === '-') { const o = next(); const r = term(); v = o === '+' ? v + r : v - r; }
    return v;
  };
  const term = () => {
    let v = unary();
    while (peek() === '*' || peek() === '/') { const o = next(); const r = unary(); v = o === '*' ? v * r : v / r; }
    return v;
  };
  const unary = () => {
    if (peek() === '-') { next(); return -unary(); }
    if (peek() === '+') { next(); return unary(); }
    const b = atom();
    if (peek() === '^') { next(); return b ** unary(); }
    return b;
  };
  const atom = () => {
    const x = next();
    if (x === undefined) throw new Error('Thiếu số hạng');
    if (/^[\d.]/.test(x)) return parseFloat(x);
    if (x === '(') { const v = expr(); if (next() !== ')') throw new Error('Thiếu ngoặc'); return v; }
    if (/^[a-z]/i.test(x)) {
      if (peek() === '(') {
        const f = FUNCS[x.toLowerCase()];
        if (!f) throw new Error(`Hàm không có: ${x}`);
        next(); const v = expr(); if (next() !== ')') throw new Error('Thiếu ngoặc');
        return f(v);
      }
      if (x in CONSTS) return CONSTS[x];
      throw new Error(`Không biết "${x}"`);
    }
    throw new Error('Biểu thức sai');
  };
  const out = expr();
  if (p < t.length) throw new Error('Biểu thức sai');
  return out;
}

/* ========================================================================
   Khung thẻ dùng chung
   ==================================================================== */
function CardShell({ def, fav, onFav, tag, wide, children, footer }) {
  const touch = useContext(TouchCtx);
  return (
    <article className={'fc-card' + (wide ? ' fc-wide' : '')} id={'fc-' + def.id} onFocusCapture={() => touch(def.id)}>
      <header className="fc-card-h">
        <h3>
          {tag && <small className="fc-tag">{tag}</small>}
          {def.title}
        </h3>
        <button
          type="button" className="fc-star" aria-pressed={fav}
          aria-label={fav ? 'Bỏ ghim' : 'Ghim công thức'} title={fav ? 'Bỏ ghim' : 'Ghim lên đầu'}
          onClick={onFav}
        >
          {fav ? '★' : '☆'}
        </button>
      </header>
      {def.f && <p className="fc-formula">{def.f}</p>}
      {def.hint && <p className="fc-hint">{def.hint}</p>}
      {children}
      {footer && <footer className="fc-foot">{footer}</footer>}
    </article>
  );
}

function CalcCard({ def, fav, onFav, tag }) {
  const copy = useCopy();
  const initRaw = () => Object.fromEntries(def.inputs.map((i) => [i.k, i.def ?? '']));
  const initSel = () => Object.fromEntries((def.selects || []).map((s) => [s.k, s.def ?? s.options[0][0]]));
  const [raw, setRaw] = useState(initRaw);
  const [sel, setSel] = useState(initSel);

  const shown = def.inputs.filter((i) => !i.show || i.show(sel));
  const filled = shown.filter((i) => raw[i.k] !== '');
  const ready = def.partial || (shown.filter((i) => !i.opt).every((i) => raw[i.k] !== '') && filled.length > 0);

  const v = {};
  for (const i of def.inputs) {
    const r = raw[i.k];
    v[i.k] = r === '' ? (i.opt === undefined ? NaN : typeof i.opt === 'number' ? i.opt : 0) : parseFloat(r);
  }
  const outs = ready ? def.calc(v, sel) : [];
  const show = (o) => (typeof o.v === 'number' ? fmt(o.v, o.d ?? 4) : o.v);

  const copyAll = () =>
    copy(
      [def.title, ...filled.map((i) => `${typeof i.label === 'function' ? i.label(sel) : i.label} = ${raw[i.k]} ${i.unit}`),
        '→ ' + outs.map((o) => `${o.l} = ${show(o)} ${o.u || ''}`.trim()).join('; ')].join('\n')
    );

  return (
    <CardShell
      def={def} fav={fav} onFav={onFav} tag={tag}
      footer={
        <>
          <button type="button" className="fc-mini" onClick={copyAll} disabled={!outs.length}>Sao chép lời giải</button>
          <button type="button" className="fc-mini" onClick={() => { setRaw(initRaw()); setSel(initSel()); }}>Đặt lại</button>
        </>
      }
    >
      <div className="fc-body">
        {def.selects?.map((s) => (
          <label key={s.k} className="fc-field">
            <span>{s.label}</span>
            <span className="fc-inp">
              <select value={sel[s.k]} onChange={(e) => setSel({ ...sel, [s.k]: e.target.value })}>
                {s.options.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
              </select>
            </span>
          </label>
        ))}
        <div className="fc-inputs">
          {shown.map((i) => (
            <label key={i.k} className="fc-field">
              <span>{typeof i.label === 'function' ? i.label(sel) : i.label}</span>
              <span className="fc-inp">
                <input
                  type="number" inputMode="decimal" step="any" value={raw[i.k]}
                  placeholder={i.opt ? '0' : ''}
                  onChange={(e) => setRaw({ ...raw, [i.k]: e.target.value })}
                />
                {i.unit && <em>{i.unit}</em>}
              </span>
            </label>
          ))}
        </div>
        {ready ? (
          <div className="fc-outs" aria-live="polite">
            {outs.map((o, idx) => (
              <p key={idx} className={'fc-out' + (o.main ? ' main' : '') + (o.bad ? ' bad' : '') + (o.warn ? ' warn' : '')}>
                <span>{o.l}</span>
                <b>{show(o)}{o.u && <small>{o.u}</small>}</b>
              </p>
            ))}
          </div>
        ) : (
          <p className="fc-empty">Nhập số liệu để xem kết quả</p>
        )}
      </div>
    </CardShell>
  );
}

/* ========================================================================
   Khối lượng mol & thành phần % (bộ phân tích công thức)
   ==================================================================== */
const MASS = Object.fromEntries(
  ELEMENTS.map((e) => [e.symbol, parseFloat(e.atomicMass.replace(/[[\]]/g, ''))])
);
const isValidSymbol = (s) => s in MASS;

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
      if (stack.length < 2) throw new Error('Ngoặc không cân đối');
      i++;
      const top = stack.pop();
      mergeIntoParent(top, readNumber());
      continue;
    }
    if (c === '·' || c === '.' || c === '*') {
      i++;
      const mult = readNumber();
      const sub = parseFormula(f.slice(i));
      for (const k in sub) add(stack[stack.length - 1], k, sub[k] * mult);
      return stack[0];
    }
    if (!/[A-Za-z]/.test(c)) throw new Error(`Ký tự không hợp lệ: "${c}"`);
    const two = f.slice(i, i + 2);
    const one = f[i];
    let sym;
    if (two.length === 2 && /^[A-Z][a-z]$/.test(two) && isValidSymbol(two)) { sym = two; i += 2; }
    else if (isValidSymbol(one)) { sym = one; i += 1; }
    else throw new Error(`Nguyên tố không tồn tại: "${/^[A-Z][a-z]$/.test(two) ? two : one}"`);
    add(stack[stack.length - 1], sym, readNumber());
  }
  if (stack.length !== 1) throw new Error('Ngoặc không cân đối');
  return stack[0];
}

const SWATCH = ['--alkali', '--alkaline', '--transition', '--post', '--metalloid', '--nonmetal', '--halogen', '--noble'];
const EXAMPLES = ['H2SO4', 'Ca(OH)2', 'Al2(SO4)3', 'CuSO4.5H2O', 'KMnO4', 'C6H12O6', 'NH4NO3'];

const MOL_DEF = {
  id: 'molcalc',
  title: 'Khối lượng mol & thành phần %',
  f: 'M = Σ (nguyên tử khối × số nguyên tử)   ·   n = m/M = V/22,4',
  hint: 'Gõ công thức hóa học (hỗ trợ ngoặc và muối ngậm nước dùng dấu chấm).',
};

function MolCard({ fav, onFav, tag }) {
  const copy = useCopy();
  const [f, setF] = useState('Ca(OH)2');
  const [v, setV] = useState('1');
  const [unit, setUnit] = useState('mol');
  const [useSGK, setUseSGK] = useState(false);

  const getMass = (sym) => (useSGK && SGK_MASS[sym] !== undefined ? SGK_MASS[sym] : MASS[sym]);

  const result = useMemo(() => {
    const t = f.replace(/\s/g, '');
    if (!t) return { ok: false, empty: true };
    let parts;
    try { parts = parseFormula(t); } catch (err) { return { ok: false, err: err.message }; }
    const rows = Object.entries(parts).map(([k, n]) => ({ k, n, m: getMass(k), tot: getMass(k) * n }));
    const M = rows.reduce((a, r) => a + r.tot, 0);
    return { ok: true, rows, M };
  }, [f, useSGK]);

  const { ok, rows, M, err, empty } = result;
  const x = parseFloat(v);
  const mol = !ok || isNaN(x) ? NaN : unit === 'mol' ? x : unit === 'g' ? x / M : unit === 'l' ? x / 22.4 : x / 6.022e23;

  return (
    <CardShell
      def={MOL_DEF} fav={fav} onFav={onFav} tag={tag} wide
      footer={ok && <button type="button" className="fc-mini" onClick={() => copy(`M(${f}) = ${fmt(M)} g/mol`)}>Sao chép M</button>}
    >
      <div className="fc-mol">
        <div>
          <input
            className="fc-mol-in" value={f} onChange={(e) => setF(e.target.value)}
            autoComplete="off" spellCheck="false" aria-label="Công thức hóa học"
          />
          <div className="fc-ex">
            {EXAMPLES.map((e) => (
              <button type="button" key={e} className="fc-const" onClick={() => setF(e)}>{e}</button>
            ))}
          </div>
          {empty && <p className="fc-empty">Nhập công thức để bắt đầu.</p>}
          {err && <p className="fc-out bad"><span>Lỗi</span><b>{err}</b></p>}
          {ok && (
            <>
              <p className="fc-hero"><b>{fmt(M)}</b><span>g/mol</span></p>
              <label className="fc-check">
                <input type="checkbox" checked={useSGK} onChange={(e) => setUseSGK(e.target.checked)} />
                <span>Dùng số liệu SGK phổ thông VN (làm tròn)</span>
              </label>
            </>
          )}
        </div>

        {ok && (
          <div>
            <p className="fc-sub">Thành phần khối lượng</p>
            <div className="fc-bar" role="img" aria-label="Thành phần phần trăm khối lượng">
              {rows.map((r, i) => (
                <i key={r.k} style={{ flex: r.tot, background: `var(${SWATCH[i % SWATCH.length]})` }} title={r.k} />
              ))}
            </div>
            <div className="fc-legend">
              {rows.map((r, i) => (
                <p key={r.k}>
                  <i style={{ background: `var(${SWATCH[i % SWATCH.length]})` }} />
                  <b>{r.k}×{r.n}</b>
                  <span>{r.m} g/mol</span>
                  <em>{fmt((r.tot / M) * 100, 2)}%</em>
                </p>
              ))}
            </div>

            <div className="fc-inputs" style={{ marginTop: '1rem' }}>
              <label className="fc-field">
                <span>Giá trị</span>
                <span className="fc-inp"><input type="number" min="0" step="any" value={v} onChange={(e) => setV(e.target.value)} /></span>
              </label>
              <label className="fc-field">
                <span>Đơn vị</span>
                <span className="fc-inp">
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="mol">mol</option>
                    <option value="g">gam</option>
                    <option value="l">lít khí (đktc)</option>
                    <option value="p">số phân tử</option>
                  </select>
                </span>
              </label>
            </div>
            <dl>
              <div><dt>Số mol</dt><dd>{fmt(mol)} mol</dd></div>
              <div><dt>Khối lượng</dt><dd>{fmt(mol * M)} g</dd></div>
              <div><dt>Thể tích khí (đktc)</dt><dd>{fmt(mol * 22.4)} lít</dd></div>
              <div><dt>Số phân tử</dt><dd>{fmt(mol * 6.022e23, 3)}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </CardShell>
  );
}

/* ========================================================================
   DANH SÁCH CÔNG THỨC
   ==================================================================== */
function simplifyRatio(vals) {
  const nz = vals.filter((v) => v > 1e-9);
  if (!nz.length) return vals.map(() => 0);
  const m = Math.min(...nz);
  const r = vals.map((v) => v / m);
  for (let k = 1; k <= 6; k++) {
    const scaled = r.map((v) => v * k);
    if (scaled.every((v) => Math.abs(v - Math.round(v)) < 0.08)) return scaled.map((v) => Math.round(v));
  }
  return r.map((v) => Math.round(v));
}

const ISO = {
  ankan: ['Ankan', (n) => 2 ** (n - 4) + 1, '3 < n < 7', (n) => n > 3 && n < 7],
  ancol: ['Ancol no, đơn chức', (n) => 2 ** (n - 2), '2 ≤ n ≤ 5', (n) => n >= 2 && n <= 5],
  andehit: ['Anđehit no, đơn chức', (n) => 2 ** (n - 3), '3 ≤ n ≤ 6', (n) => n >= 3 && n <= 6],
  axit: ['Axit no, đơn chức', (n) => 2 ** (n - 3), '3 ≤ n ≤ 6', (n) => n >= 3 && n <= 6],
  este: ['Este no, đơn chức', (n) => 2 ** (n - 2), '2 ≤ n ≤ 4', (n) => n >= 2 && n <= 4],
  ete: ['Ete no, đơn chức', (n) => ((n - 1) * (n - 2)) / 2, '3 ≤ n ≤ 5', (n) => n >= 3 && n <= 5],
};

const saltRange = (T, a, b, low, mid, high, t1, t2) => {
  if (T < 1 - 1e-9) return { p: `${low} (axit còn dư)` };
  if (eq(T, 1)) return { p: `Chỉ tạo ${low}` };
  if (T < 2) return { p: `Tạo 2 muối: ${low} và ${mid}`, x: [[low, 2 * a - b], [mid, b - a]] };
  if (eq(T, 2)) return { p: `Chỉ tạo ${mid}` };
  if (high && T < 3) return { p: `Tạo 2 muối: ${mid} và ${high}`, x: [[mid, 3 * a - b], [high, b - 2 * a]] };
  return { p: `Chỉ tạo ${high || mid}${high && T > 3 + 1e-9 ? ' (OH⁻ còn dư)' : ''}` };
};

const formulaStr = (c, h, o) => `C${c > 1 ? c : ''}H${h > 1 ? h : ''}${o > 0 ? 'O' + (o > 1 ? o : '') : ''}`;

const CARDS = [
  /* ---------------- MOL & KHÍ ---------------- */
  { id: 'molcalc', tab: 'mol', title: MOL_DEF.title, kw: 'phan tu khoi luong mol thanh phan phan tram cong thuc hoa hoc so mol', custom: true },
  {
    id: 'gas', tab: 'mol', title: 'Phương trình khí lý tưởng', f: 'P·V = n·R·T   (R = 0,082)', partial: true,
    kw: 'ap suat the tich nhiet do clapeyron',
    hint: 'Để trống 1 ô cần tìm. Nhiệt độ nhập °C (tự đổi sang K = °C + 273).',
    inputs: [I('P', 'Áp suất P', 'atm'), I('V', 'Thể tích V', 'lít'), I('n', 'Số mol n', 'mol'), I('T', 'Nhiệt độ', '°C')],
    calc: (v) => {
      const R = 0.082, K = v.T + 273;
      return solve(v, {
        P: ['P', 'atm', (x) => x.n * R * K / x.V],
        V: ['V', 'lít', (x) => x.n * R * K / x.P],
        n: ['n', 'mol', (x) => x.P * x.V / (R * K)],
        T: ['Nhiệt độ', '°C', (x) => x.P * x.V / (x.n * R) - 273],
      });
    },
  },
  {
    id: 'dtk', tab: 'mol', title: 'Tỉ khối chất khí', f: 'd(A/B) = M_A / M_B', partial: true, kw: 'ti khoi',
    hint: 'Không khí: M ≈ 29 · H₂: M = 2. Để trống 1 ô cần tìm.',
    inputs: [I('d', 'Tỉ khối d'), I('MA', 'M của A', 'g/mol'), I('MB', 'M của B', 'g/mol', { def: '29' })],
    calc: (v) => solve(v, {
      d: ['d(A/B)', '', (x) => x.MA / x.MB, 3],
      MA: ['M_A', 'g/mol', (x) => x.d * x.MB],
      MB: ['M_B', 'g/mol', (x) => x.MA / x.d],
    }),
  },
  {
    id: 'mtb', tab: 'mol', title: 'Khối lượng mol trung bình (hỗn hợp 2 khí)', f: 'M̄ = (M₁·n₁ + M₂·n₂) / (n₁ + n₂)', kw: 'hon hop khi trung binh',
    hint: 'Có thể nhập %V thay cho số mol (cùng điều kiện T, P).',
    inputs: [I('M1', 'M₁', 'g/mol'), I('n1', 'n₁ (hoặc %V)', 'mol'), I('M2', 'M₂', 'g/mol'), I('n2', 'n₂ (hoặc %V)', 'mol')],
    calc: (v) => {
      const Mb = (v.M1 * v.n1 + v.M2 * v.n2) / (v.n1 + v.n2);
      return [
        { l: 'M trung bình', v: Mb, u: 'g/mol', main: true },
        { l: 'd so với H₂', v: Mb / 2, d: 3 },
        { l: 'd so với không khí', v: Mb / 29, d: 3 },
      ];
    },
  },
  {
    id: 'hh2', tab: 'mol', title: 'Hỗn hợp 2 chất (giải hệ 2 ẩn)', f: 'n₁ + n₂ = n  ;  M₁·n₁ + M₂·n₂ = m', kw: 'hon hop phan tram khoi luong he phuong trinh',
    inputs: [I('M1', 'M chất 1', 'g/mol'), I('M2', 'M chất 2', 'g/mol'), I('n', 'Tổng số mol', 'mol'), I('m', 'Tổng khối lượng', 'g')],
    calc: (v) => {
      const n1 = (v.m - v.M2 * v.n) / (v.M1 - v.M2), n2 = v.n - n1;
      const bad = n1 < -1e-9 || n2 < -1e-9;
      return [
        { l: 'n chất 1', v: n1, u: 'mol', main: true, bad },
        { l: 'n chất 2', v: n2, u: 'mol', bad },
        { l: '%m chất 1', v: (v.M1 * n1 / v.m) * 100, u: '%', d: 2 },
        { l: '%n chất 1', v: (n1 / v.n) * 100, u: '%', d: 2 },
      ];
    },
  },
  {
    id: 'hs', tab: 'mol', title: 'Hiệu suất phản ứng', f: 'H% = (lượng thực tế / lượng lý thuyết) × 100', partial: true, kw: 'hieu suat',
    hint: 'Để trống 1 ô. Lượng nhập cùng đơn vị (mol hoặc gam).',
    inputs: [I('LT', 'Lý thuyết'), I('TT', 'Thực tế'), I('H', 'Hiệu suất H', '%')],
    calc: (v) => solve(v, {
      H: ['H%', '%', (x) => x.TT / x.LT * 100, 2],
      TT: ['Lượng thực tế', '', (x) => x.LT * x.H / 100],
      LT: ['Lượng lý thuyết', '', (x) => x.TT * 100 / x.H],
    }),
  },
  {
    id: 'du', tab: 'mol', title: 'Chất hết – chất dư', f: 'aA + bB → …   so sánh nA/a với nB/b', kw: 'chat du het gioi han',
    inputs: [I('nA', 'n(A)', 'mol'), I('a', 'Hệ số a', '', { def: '1' }), I('nB', 'n(B)', 'mol'), I('b', 'Hệ số b', '', { def: '1' })],
    calc: (v) => {
      const rA = v.nA / v.a, rB = v.nB / v.b;
      if (eq(rA, rB)) return [{ l: 'Kết luận', v: '✅ Vừa đủ', main: true }];
      const lim = rA < rB ? 'A' : 'B';
      const dư = rA < rB ? v.nB - rA * v.b : v.nA - rB * v.a;
      return [
        { l: 'Chất phản ứng hết', v: lim, main: true },
        { l: `n(${lim === 'A' ? 'B' : 'A'}) dư`, v: dư, u: 'mol' },
        { l: 'n phản ứng tối đa (tính theo hệ số 1)', v: Math.min(rA, rB), u: 'mol' },
      ];
    },
  },

  /* ---------------- DUNG DỊCH & pH ---------------- */
  {
    id: 'ph', tab: 'dd', title: 'pH ⇄ nồng độ ion', f: 'pH = −lg[H⁺]  ;  [H⁺]·[OH⁻] = 10⁻¹⁴  (25°C)', kw: 'ph axit bazo kiem moi truong poh',
    selects: [S('mode', 'Bạn nhập', [['ph', 'pH'], ['h', '[H⁺] (mol/l)']])],
    inputs: [I('x', 'Giá trị', '', { def: '7' })],
    calc: (v, o) => {
      const pH = o.mode === 'ph' ? v.x : -Math.log10(v.x);
      const H = o.mode === 'ph' ? 10 ** -v.x : v.x;
      return [
        { l: 'pH', v: pH, d: 3, main: true },
        { l: '[H⁺]', v: H, u: 'mol/l', d: 6 },
        { l: '[OH⁻]', v: 1e-14 / H, u: 'mol/l', d: 6 },
        { l: 'pOH', v: 14 - pH, d: 3 },
        { l: 'Môi trường', v: isNaN(pH) ? '—' : eq(pH, 7) ? 'Trung tính' : pH < 7 ? 'Axit' : 'Kiềm' },
      ];
    },
  },
  {
    id: 'alpha', tab: 'dd', title: 'Độ điện li α & hằng số Ka', f: 'α = [H⁺]/C₀  ;  Ka = [H⁺]² / (C₀ − [H⁺])', kw: 'do dien li axit yeu',
    hint: 'Axit yếu HA ⇌ H⁺ + A⁻ (1 nấc).',
    inputs: [I('c0', 'C₀ ban đầu', 'mol/l', { def: '0.1' }), I('h', '[H⁺] cân bằng', 'mol/l', { def: '0.0013' })],
    calc: (v) => [
      { l: 'Độ điện li α', v: (v.h / v.c0) * 100, u: '%', d: 3, main: true },
      { l: 'Ka', v: v.c0 - v.h > 0 ? (v.h * v.h) / (v.c0 - v.h) : NaN, d: 6 },
      { l: 'pKa', v: -Math.log10(v.c0 - v.h > 0 ? (v.h * v.h) / (v.c0 - v.h) : NaN), d: 3 },
      { l: 'pH', v: -Math.log10(v.h), d: 3 },
    ],
  },
  {
    id: 'phweak', tab: 'dd', title: 'pH axit yếu / bazơ yếu', f: 'x² + K·x − K·C = 0   →   x = [H⁺] (axit) hoặc [OH⁻] (bazơ)', kw: 'ka kb ph axit yeu bazo yeu ch3cooh nh3',
    selects: [S('t', 'Loại', [['a', 'Axit yếu (Ka)'], ['b', 'Bazơ yếu (Kb)']])],
    inputs: [I('K', (o) => (o.t === 'a' ? 'Ka' : 'Kb'), '', { def: '1.8e-5' }), I('C', 'Nồng độ C₀', 'mol/l', { def: '0.1' })],
    calc: (v, o) => {
      const x = (-v.K + Math.sqrt(v.K * v.K + 4 * v.K * v.C)) / 2;
      const pH = o.t === 'a' ? -Math.log10(x) : 14 + Math.log10(x);
      return [
        { l: 'pH', v: pH, d: 3, main: true },
        { l: o.t === 'a' ? '[H⁺]' : '[OH⁻]', v: x, u: 'mol/l', d: 5 },
        { l: 'Độ điện li α', v: (x / v.C) * 100, u: '%', d: 3 },
      ];
    },
  },
  {
    id: 'buf', tab: 'dd', title: 'Dung dịch đệm (Henderson)', f: 'pH = pKa + lg( [A⁻] / [HA] )', kw: 'dem buffer henderson',
    inputs: [I('pKa', 'pKa'), I('A', '[A⁻] (muối)', 'mol/l'), I('HA', '[HA] (axit)', 'mol/l')],
    calc: (v) => [{ l: 'pH', v: v.pKa + Math.log10(v.A / v.HA), d: 3, main: true }],
  },
  {
    id: 'neut', tab: 'dd', title: 'Trung hòa axit – bazơ (theo mol)', f: 'nH⁺ = nHCl + nHNO₃ + 2nH₂SO₄  ;  nOH⁻ = nNaOH + nKOH + 2nBa(OH)₂', kw: 'trung hoa dung dich pha tron',
    hint: 'Nhập tổng thể tích (lít) để tính thêm pH sau phản ứng.',
    inputs: [I('hcl', 'n(HCl)', 'mol', { opt: true }), I('h2so4', 'n(H₂SO₄)', 'mol', { opt: true }), I('hno3', 'n(HNO₃)', 'mol', { opt: true }),
      I('naoh', 'n(NaOH)', 'mol', { opt: true }), I('koh', 'n(KOH)', 'mol', { opt: true }), I('baoh2', 'n(Ba(OH)₂)', 'mol', { opt: true }),
      I('V', 'V dung dịch sau', 'lít', { opt: true })],
    calc: (v) => {
      const nH = v.hcl + 2 * v.h2so4 + v.hno3, nOH = v.naoh + v.koh + 2 * v.baoh2, d = nH - nOH;
      const out = [
        { l: 'Tổng nH⁺', v: nH, u: 'mol' },
        { l: 'Tổng nOH⁻', v: nOH, u: 'mol' },
        { l: 'Kết luận', main: true, bad: !eq(d, 0),
          v: eq(d, 0) ? '✅ Trung hòa vừa đủ' : d > 0 ? `Dư axit — thừa ${fmt(d)} mol H⁺` : `Dư bazơ — thừa ${fmt(-d)} mol OH⁻` },
      ];
      if (v.V > 0) out.push({ l: 'pH sau phản ứng', v: eq(d, 0) ? 7 : d > 0 ? -Math.log10(d / v.V) : 14 + Math.log10(-d / v.V), d: 3 });
      return out;
    },
  },
  {
    id: 'phmix', tab: 'dd', title: 'pH sau khi trộn axit mạnh + bazơ mạnh', f: 'n dư = |CH·VH − COH·VOH|  →  [ ] = n dư / V tổng', kw: 'tron dung dich ph',
    hint: 'CH = nồng độ H⁺ (axit 2 nấc: nhân đôi), COH = nồng độ OH⁻ (Ba(OH)₂: nhân đôi).',
    inputs: [I('CH', 'Nồng độ H⁺', 'mol/l'), I('VH', 'V axit', 'ml'), I('COH', 'Nồng độ OH⁻', 'mol/l'), I('VOH', 'V bazơ', 'ml')],
    calc: (v) => {
      const Vt = (v.VH + v.VOH) / 1000, d = (v.CH * v.VH - v.COH * v.VOH) / 1000;
      const pH = eq(d, 0) ? 7 : d > 0 ? -Math.log10(d / Vt) : 14 + Math.log10(-d / Vt);
      return [
        { l: 'pH', v: pH, d: 3, main: true },
        { l: eq(d, 0) ? 'Kết luận' : d > 0 ? 'H⁺ dư' : 'OH⁻ dư', v: eq(d, 0) ? 'Vừa đủ' : Math.abs(d), u: eq(d, 0) ? '' : 'mol', d: 5 },
        { l: 'V dung dịch sau', v: Vt * 1000, u: 'ml' },
      ];
    },
  },
  {
    id: 'dilph', tab: 'dd', title: 'pH khi pha loãng axit / bazơ mạnh', f: 'C′ = C/k  (có tính cả sự điện li của nước)', kw: 'pha loang ph',
    selects: [S('t', 'Loại', [['a', 'Axit mạnh'], ['b', 'Bazơ mạnh']])],
    inputs: [I('pH1', 'pH ban đầu'), I('k', 'Pha loãng k lần', '×', { def: '10' })],
    calc: (v, o) => {
      const c = (o.t === 'a' ? 10 ** -v.pH1 : 10 ** (v.pH1 - 14)) / v.k;
      const x = (c + Math.sqrt(c * c + 4e-14)) / 2;
      return [{ l: 'pH sau khi pha loãng', v: o.t === 'a' ? -Math.log10(x) : 14 + Math.log10(x), d: 3, main: true }];
    },
  },
  {
    id: 'cmc', tab: 'dd', title: 'Nồng độ C% ⇄ C_M', f: 'C_M = 10·D·C% / M', partial: true, kw: 'nong do phan tram mol lit khoi luong rieng',
    hint: 'Để trống 1 ô. D là khối lượng riêng dung dịch (g/ml).',
    inputs: [I('C', 'C%', '%'), I('D', 'D', 'g/ml', { def: '1' }), I('M', 'M chất tan', 'g/mol'), I('CM', 'C_M', 'mol/l')],
    calc: (v) => solve(v, {
      CM: ['C_M', 'mol/l', (x) => 10 * x.D * x.C / x.M],
      C: ['C%', '%', (x) => x.CM * x.M / (10 * x.D), 3],
      D: ['D', 'g/ml', (x) => x.CM * x.M / (10 * x.C)],
      M: ['M', 'g/mol', (x) => 10 * x.D * x.C / x.CM],
    }),
  },
  {
    id: 'dil', tab: 'dd', title: 'Pha loãng dung dịch', f: 'C₁·V₁ = C₂·V₂', partial: true, kw: 'pha loang nong do the tich nuoc',
    hint: 'Để trống 1 ô. Nếu biết V₁ và V₂ sẽ tính thêm lượng nước cần thêm.',
    inputs: [I('C1', 'C₁', 'mol/l'), I('V1', 'V₁'), I('C2', 'C₂', 'mol/l'), I('V2', 'V₂')],
    calc: (v) => {
      const r = solve(v, {
        C1: ['C₁', 'mol/l', (x) => x.C2 * x.V2 / x.V1],
        V1: ['V₁', '', (x) => x.C2 * x.V2 / x.C1],
        C2: ['C₂', 'mol/l', (x) => x.C1 * x.V1 / x.V2],
        V2: ['V₂', '', (x) => x.C1 * x.V1 / x.C2],
      });
      if (!r[0].main) return r;
      const V1 = isNaN(v.V1) ? r[0].v : v.V1, V2 = isNaN(v.V2) ? r[0].v : v.V2;
      return [...r, { l: 'V nước cần thêm', v: V2 - V1, bad: V2 < V1 }];
    },
  },
  {
    id: 'mix', tab: 'dd', title: 'Trộn 2 dung dịch cùng chất tan', f: 'C = (C₁V₁ + C₂V₂) / (V₁ + V₂)', kw: 'tron dung dich nong do',
    inputs: [I('C1', 'C₁', 'mol/l'), I('V1', 'V₁'), I('C2', 'C₂', 'mol/l'), I('V2', 'V₂')],
    calc: (v) => [
      { l: 'Nồng độ sau trộn', v: (v.C1 * v.V1 + v.C2 * v.V2) / (v.V1 + v.V2), u: 'mol/l', main: true },
      { l: 'V sau trộn (coi như cộng)', v: v.V1 + v.V2 },
    ],
  },
  {
    id: 'diag', tab: 'dd', title: 'Quy tắc đường chéo', f: 'V₁/V₂ = (C₂ − C) / (C − C₁)', kw: 'duong cheo pha che',
    hint: 'C₁ < C < C₂ (C là nồng độ cần pha).',
    inputs: [I('C1', 'C₁ (loãng)'), I('C2', 'C₂ (đặc)'), I('C', 'C cần pha')],
    calc: (v) => {
      const bad = !(v.C > Math.min(v.C1, v.C2) && v.C < Math.max(v.C1, v.C2));
      const a = Math.abs(v.C2 - v.C), b = Math.abs(v.C - v.C1);
      return [
        { l: 'V₁ / V₂', v: a / b, d: 4, main: true, bad },
        { l: 'Tỉ lệ V₁ : V₂', v: `${fmt(a)} : ${fmt(b)}`, bad },
      ];
    },
  },
  {
    id: 'sol', tab: 'dd', title: 'Độ tan S ⇄ C%', f: 'C% = 100·S / (100 + S)', partial: true, kw: 'do tan bao hoa',
    inputs: [I('S', 'Độ tan S', 'g/100g H₂O'), I('C', 'C% bão hòa', '%')],
    calc: (v) => solve(v, {
      C: ['C% bão hòa', '%', (x) => 100 * x.S / (100 + x.S), 3],
      S: ['Độ tan S', 'g/100g', (x) => 100 * x.C / (100 - x.C), 3],
    }),
  },
  {
    id: 'titr', tab: 'dd', title: 'Chuẩn độ axit – bazơ', f: 'a·C_A·V_A = b·C_B·V_B', partial: true, kw: 'chuan do',
    hint: 'a = số H⁺ của axit, b = số OH⁻ của bazơ. Để trống 1 ô cần tìm.',
    inputs: [I('CA', 'C axit', 'mol/l'), I('VA', 'V axit', 'ml'), I('CB', 'C bazơ', 'mol/l'), I('VB', 'V bazơ', 'ml'),
      I('a', 'a', '', { def: '1' }), I('b', 'b', '', { def: '1' })],
    calc: (v) => solve(v, {
      CA: ['C axit', 'mol/l', (x) => x.b * x.CB * x.VB / (x.a * x.VA), 5],
      VA: ['V axit', 'ml', (x) => x.b * x.CB * x.VB / (x.a * x.CA)],
      CB: ['C bazơ', 'mol/l', (x) => x.a * x.CA * x.VA / (x.b * x.VB), 5],
      VB: ['V bazơ', 'ml', (x) => x.a * x.CA * x.VA / (x.b * x.CB)],
    }),
  },

  /* ---------------- VÔ CƠ ---------------- */
  {
    id: 'hno3', tab: 'vc', title: 'Kim loại + HNO₃', kw: 'axit nitric no no2 n2o n2 muoi nitrat bao toan electron',
    f: 'nHNO₃ = 4nNO + 2nNO₂ + 10nN₂O + 12nN₂ + 10nNH₄NO₃',
    hint: 'm muối = m KL + 62·(3nNO + nNO₂ + 8nN₂O + 10nN₂) + 80·nNH₄NO₃.',
    inputs: [I('mkl', 'm kim loại', 'g', { opt: true }), I('no', 'n(NO)', 'mol', { opt: true }), I('no2', 'n(NO₂)', 'mol', { opt: true }),
      I('n2o', 'n(N₂O)', 'mol', { opt: true }), I('n2', 'n(N₂)', 'mol', { opt: true }), I('nh4', 'n(NH₄NO₃)', 'mol', { opt: true })],
    calc: (v) => [
      { l: 'n HNO₃ phản ứng', v: 4 * v.no + 2 * v.no2 + 10 * v.n2o + 12 * v.n2 + 10 * v.nh4, u: 'mol', main: true },
      { l: 'm muối', v: v.mkl + 62 * (3 * v.no + v.no2 + 8 * v.n2o + 10 * v.n2) + 80 * v.nh4, u: 'g' },
      { l: 'n e nhận', v: 3 * v.no + v.no2 + 8 * v.n2o + 10 * v.n2 + 8 * v.nh4, u: 'mol' },
    ],
  },
  {
    id: 'h2so4d', tab: 'vc', title: 'Kim loại + H₂SO₄ đặc, nóng', kw: 'axit sunfuric dac so2 s h2s muoi sunfat',
    f: 'nH₂SO₄ = 2nSO₂ + 4nS + 5nH₂S',
    hint: 'm muối = m KL + 96·(nSO₂ + 3nS + 4nH₂S).',
    inputs: [I('mkl', 'm kim loại', 'g', { opt: true }), I('so2', 'n(SO₂)', 'mol', { opt: true }), I('s', 'n(S)', 'mol', { opt: true }), I('h2s', 'n(H₂S)', 'mol', { opt: true })],
    calc: (v) => [
      { l: 'n H₂SO₄ phản ứng', v: 2 * v.so2 + 4 * v.s + 5 * v.h2s, u: 'mol', main: true },
      { l: 'm muối sunfat', v: v.mkl + 96 * (v.so2 + 3 * v.s + 4 * v.h2s), u: 'g' },
      { l: 'n e nhận', v: 2 * v.so2 + 6 * v.s + 8 * v.h2s, u: 'mol' },
    ],
  },
  {
    id: 'be', tab: 'vc', title: 'Bảo toàn electron (kim loại → khí)', f: 'n e = (m/M)·hóa trị  ;  V(NO) = n e/3 · 22,4  ;  V(NO₂) = n e · 22,4', kw: 'bao toan e electron the tich khi no no2',
    inputs: [I('m', 'm kim loại', 'g'), I('M', 'M kim loại', 'g/mol'), I('z', 'Hóa trị (số e nhường)', '', { def: '3' })],
    calc: (v) => {
      const ne = (v.m / v.M) * v.z;
      return [
        { l: 'n e nhường', v: ne, u: 'mol', main: true },
        { l: 'V NO (đktc)', v: (ne / 3) * 22.4, u: 'lít' },
        { l: 'V NO₂ (đktc)', v: ne * 22.4, u: 'lít' },
        { l: 'V SO₂ (đktc)', v: (ne / 2) * 22.4, u: 'lít' },
        { l: 'V H₂ (đktc)', v: (ne / 2) * 22.4, u: 'lít' },
      ];
    },
  },
  {
    id: 'klaxit', tab: 'vc', title: 'Kim loại + axit loãng (HCl, H₂SO₄) → H₂', kw: 'hcl h2so4 loang muoi clorua sunfat hidro',
    f: 'm muối = m KL + 71·nH₂ (HCl)  |  + 96·nH₂ (H₂SO₄)',
    selects: [S('a', 'Axit', [['hcl', 'HCl'], ['h2so4', 'H₂SO₄ loãng']])],
    inputs: [I('m', 'm kim loại', 'g'), I('h2', 'n(H₂)', 'mol')],
    calc: (v, o) => [
      { l: 'm muối', v: v.m + (o.a === 'hcl' ? 71 : 96) * v.h2, u: 'g', main: true },
      { l: o.a === 'hcl' ? 'n HCl phản ứng' : 'n H₂SO₄ phản ứng', v: o.a === 'hcl' ? 2 * v.h2 : v.h2, u: 'mol' },
      { l: 'V H₂ (đktc)', v: v.h2 * 22.4, u: 'lít' },
    ],
  },
  {
    id: 'oxitaxit', tab: 'vc', title: 'Oxit kim loại + axit → muối', kw: 'oxit bazo hcl h2so4 khoi luong muoi tang giam',
    f: 'm muối = m oxit + 27,5·nHCl  |  + 80·nH₂SO₄',
    selects: [S('a', 'Axit', [['hcl', 'HCl'], ['h2so4', 'H₂SO₄ loãng']])],
    inputs: [I('m', 'm oxit', 'g'), I('n', (o) => (o.a === 'hcl' ? 'n(HCl)' : 'n(H₂SO₄)'), 'mol')],
    calc: (v, o) => [
      { l: 'm muối', v: v.m + (o.a === 'hcl' ? 27.5 : 80) * v.n, u: 'g', main: true },
      { l: 'n H₂O tạo thành', v: o.a === 'hcl' ? v.n / 2 : v.n, u: 'mol' },
    ],
  },
  {
    id: 'nh3', tab: 'vc', title: 'Hiệu suất tổng hợp NH₃', f: 'H% = (2 − 2·Mx/My) × 100', kw: 'amoniac hieu suat n2 h2',
    hint: 'N₂ + 3H₂ ⇌ 2NH₃, tỉ lệ đầu N₂ : H₂ = 1 : 3.',
    inputs: [I('mx', 'Mx (trước phản ứng)', 'g/mol'), I('my', 'My (sau phản ứng)', 'g/mol')],
    calc: (v) => {
      const H = (2 - 2 * (v.mx / v.my)) * 100;
      return [{ l: 'Hiệu suất H%', v: H, u: '%', d: 2, main: true, bad: H < 0 || H > 100 }];
    },
  },
  {
    id: 'h3po4', tab: 'vc', title: 'H₃PO₄ / P₂O₅ + dung dịch kiềm', f: 'T = nOH⁻ / nH₃PO₄   (nH₃PO₄ = 2·nP₂O₅)', kw: 'axit photphoric p2o5 muoi photphat',
    selects: [S('m', 'Chất đã cho', [['h3po4', 'n(H₃PO₄)'], ['p2o5', 'n(P₂O₅)']])],
    inputs: [I('p', (o) => (o.m === 'h3po4' ? 'n(H₃PO₄)' : 'n(P₂O₅)'), 'mol'), I('oh', 'n(OH⁻)', 'mol')],
    calc: (v, o) => {
      const a = o.m === 'h3po4' ? v.p : 2 * v.p, T = v.oh / a;
      const r = saltRange(T, a, v.oh, 'H₂PO₄⁻', 'HPO₄²⁻', 'PO₄³⁻');
      return [
        { l: 'Tỉ lệ T', v: T, d: 3 },
        { l: 'Sản phẩm', v: r.p, main: true },
        ...(r.x || []).map(([n, val]) => ({ l: `n(${n})`, v: val, u: 'mol' })),
      ];
    },
  },
  {
    id: 'co2koh', tab: 'vc', title: 'CO₂ + dung dịch kiềm', f: 'T = nOH⁻ / nCO₂   ·   1 < T < 2: nCO₃²⁻ = nOH⁻ − nCO₂', kw: 'cacbonic muoi cacbonat hidrocacbonat',
    inputs: [I('oh', 'n(OH⁻)', 'mol'), I('co2', 'n(CO₂)', 'mol')],
    calc: (v) => {
      const T = v.oh / v.co2;
      const r = saltRange(T, v.co2, v.oh, 'HCO₃⁻', 'CO₃²⁻', null);
      return [
        { l: 'Tỉ lệ T', v: T, d: 3 },
        { l: 'Sản phẩm', v: r.p, main: true },
        ...(r.x || []).map(([n, val]) => ({ l: `n(${n})`, v: val, u: 'mol' })),
      ];
    },
  },
  {
    id: 'co2ppt', tab: 'vc', title: 'CO₂ + Ca(OH)₂ / Ba(OH)₂ → kết tủa', kw: 'ket tua caco3 baco3 dung dich nuoc voi trong',
    f: 'nCO₂ ≤ nBase: n↓ = nCO₂   ·   nCO₂ > nBase: n↓ = 2nBase − nCO₂',
    selects: [S('b', 'Bazơ', [['100', 'Ca(OH)₂ → CaCO₃ (100)'], ['197', 'Ba(OH)₂ → BaCO₃ (197)']])],
    inputs: [I('co2', 'n(CO₂)', 'mol'), I('base', 'n(Base)', 'mol')],
    calc: (v, o) => {
      const n = v.co2 <= v.base ? v.co2 : Math.max(0, 2 * v.base - v.co2);
      return [
        { l: 'n kết tủa', v: n, u: 'mol', main: true },
        { l: 'm kết tủa', v: n * +o.b, u: 'g' },
        { l: 'Kết tủa tan hết khi nCO₂ ≥', v: 2 * v.base, u: 'mol' },
      ];
    },
  },
  {
    id: 'co3h', tab: 'vc', title: 'Nhỏ từ từ H⁺ vào CO₃²⁻ / HCO₃⁻', kw: 'nho tu tu axit muoi cacbonat khi co2',
    f: 'H⁺ + CO₃²⁻ → HCO₃⁻   rồi   H⁺ + HCO₃⁻ → CO₂ + H₂O',
    hint: 'Với H⁺ thêm từ từ: nCO₂ = nH⁺ − nCO₃²⁻ (khi nH⁺ > nCO₃²⁻).',
    inputs: [I('h', 'n(H⁺)', 'mol'), I('co3', 'n(CO₃²⁻)', 'mol', { opt: true }), I('hco3', 'n(HCO₃⁻)', 'mol', { opt: true })],
    calc: (v) => {
      const used = Math.min(v.h, v.co3), rem = v.h - used, co2 = Math.min(rem, v.co3 + v.hco3);
      return [
        { l: 'n CO₂ thoát ra', v: co2, u: 'mol', main: true },
        { l: 'V CO₂ (đktc)', v: co2 * 22.4, u: 'lít' },
        { l: 'H⁺ còn dư', v: rem - co2, u: 'mol' },
      ];
    },
  },
  {
    id: 'phan', tab: 'vc', title: 'Độ dinh dưỡng phân bón', kw: 'phan lan kali p2o5 k2o dam nitrogen',
    f: 'Phân lân: %P₂O₅ = %P × 142/62  ·  Phân kali: %K₂O = %K × 94/78',
    selects: [S('t', 'Loại phân', [['p', 'Phân lân (từ %P)'], ['k', 'Phân kali (từ %K)']])],
    inputs: [I('x', (o) => (o.t === 'p' ? '%P trong phân' : '%K trong phân'), '%')],
    calc: (v, o) => [{ l: o.t === 'p' ? 'Độ dinh dưỡng %P₂O₅' : 'Độ dinh dưỡng %K₂O', v: v.x * (o.t === 'p' ? 142 / 62 : 94 / 78), u: '%', d: 3, main: true }],
  },

  /* ---------------- HỮU CƠ ---------------- */
  {
    id: 'k', tab: 'hc', title: 'Độ bất bão hòa k', f: 'k = (2x + 2 + t − y − v) / 2', kw: 'pi vong do bat bao hoa',
    hint: 'Hợp chất CxHyOzNtXv (X là halogen). Oxi không ảnh hưởng.',
    inputs: [I('x', 'x (số C)'), I('y', 'y (số H)'), I('t', 't (số N)', '', { opt: true }), I('v', 'v (halogen)', '', { opt: true })],
    calc: (v) => {
      const k = (2 * v.x + 2 + v.t - v.y - v.v) / 2;
      return [{ l: 'k (π + vòng)', v: k, d: 2, main: true, bad: k < 0 || !Number.isInteger(k) }];
    },
  },
  {
    id: 'ctpt', tab: 'hc', title: 'Lập CTĐGN từ % khối lượng', f: 'x : y : z : t = %C/12 : %H/1 : %O/16 : %N/14', kw: 'cong thuc don gian nhat phan tram khoi luong',
    hint: 'Nếu đề không cho %O: %O = 100 − %C − %H (− %N).',
    inputs: [I('c', '%C', '%', { opt: true }), I('h', '%H', '%', { opt: true }), I('o', '%O', '%', { opt: true }), I('n', '%N', '%', { opt: true })],
    calc: (v) => {
      const [x, y, z, t] = simplifyRatio([v.c / 12, v.h, v.o / 16, v.n / 14]);
      const sum = v.c + v.h + v.o + v.n;
      return [
        { l: 'Công thức đơn giản nhất', v: `C${x}H${y}${z ? 'O' + z : ''}${t ? 'N' + t : ''}`.replace(/([A-Z])1(?!\d)/g, '$1'), main: true },
        { l: 'Tổng %', v: sum, u: '%', d: 2, warn: sum > 100.5 },
      ];
    },
  },
  {
    id: 'ctdgn', tab: 'hc', title: 'Từ CTĐGN và M → CTPT', f: '(CxHyOz)ₙ  →  n = M / (12x + y + 16z)', kw: 'cong thuc phan tu khoi luong mol',
    inputs: [I('x', 'x (C)'), I('y', 'y (H)'), I('z', 'z (O)', '', { opt: true }), I('M', 'M của chất', 'g/mol')],
    calc: (v) => {
      const Md = 12 * v.x + v.y + 16 * v.z, n = v.M / Md, ok = Math.abs(n - Math.round(n)) < 0.05 && n >= 1;
      const r = Math.round(n);
      return [
        { l: 'M công thức đơn giản', v: Md, u: 'g/mol' },
        { l: 'Hệ số n', v: n, d: 3, warn: !ok },
        { l: 'Công thức phân tử', v: ok ? `C${v.x * r}H${v.y * r}${v.z ? 'O' + v.z * r : ''}` : 'n không nguyên — kiểm tra lại đề', main: true, bad: !ok },
      ];
    },
  },
  {
    id: 'hcdot', tab: 'hc', title: 'Đốt cháy hydrocarbon', kw: 'ankan anken ankin ankadien dot chay co2 h2o brom',
    f: 'Ankan: nHC = nH₂O − nCO₂  ·  Anken: nHC = nBr₂  ·  Ankin/ankađien: nHC = nCO₂ − nH₂O',
    selects: [S('t', 'Loại', [['ankan', 'Ankan (no)'], ['anken', 'Anken'], ['ankin', 'Ankin / Ankađien']])],
    inputs: [I('co2', 'n(CO₂)', 'mol'), I('h2o', 'n(H₂O)', 'mol'), I('br2', 'n(Br₂)', 'mol', { show: (o) => o.t === 'anken' })],
    calc: (v, o) => {
      const n = o.t === 'ankan' ? v.h2o - v.co2 : o.t === 'anken' ? v.br2 : v.co2 - v.h2o;
      const out = [
        { l: 'n hydrocarbon', v: n, u: 'mol', main: true, bad: n <= 0 },
        { l: 'Số nguyên tử C', v: v.co2 / n, d: 2 },
      ];
      if (o.t === 'anken' && Math.abs(v.co2 - v.h2o) > 1e-6) out.push({ l: 'Lưu ý', v: 'nCO₂ nên bằng nH₂O với anken', warn: true });
      return out;
    },
  },
  {
    id: 'ctb', tab: 'hc', title: 'Số C, H trung bình của hỗn hợp', f: 'C̄ = nCO₂ / nhh   ;   H̄ = 2·nH₂O / nhh', kw: 'trung binh hon hop dot chay',
    inputs: [I('co2', 'n(CO₂)', 'mol'), I('h2o', 'n(H₂O)', 'mol'), I('hh', 'n hỗn hợp', 'mol')],
    calc: (v) => [
      { l: 'C trung bình', v: v.co2 / v.hh, d: 3, main: true },
      { l: 'H trung bình', v: (2 * v.h2o) / v.hh, d: 3 },
    ],
  },
  {
    id: 'dotO', tab: 'hc', title: 'Đốt hợp chất hữu cơ (bảo toàn O)', kw: 'bao toan oxi khoi luong hop chat huu co',
    f: 'nO(hc) = 2nCO₂ + nH₂O − 2nO₂   ;   m = 12nCO₂ + 2nH₂O + 16nO',
    inputs: [I('co2', 'n(CO₂)', 'mol'), I('h2o', 'n(H₂O)', 'mol'), I('o2', 'n(O₂) phản ứng', 'mol')],
    calc: (v) => {
      const nO = 2 * v.co2 + v.h2o - 2 * v.o2;
      return [
        { l: 'n O trong hợp chất', v: nO, u: 'mol', main: true, bad: nO < -1e-9 },
        { l: 'm hợp chất', v: 12 * v.co2 + 2 * v.h2o + 16 * nO, u: 'g' },
        { l: 'Tỉ lệ C : H : O', v: nO > 1e-9 ? simplifyRatio([v.co2, 2 * v.h2o, nO]).join(' : ') : `${simplifyRatio([v.co2, 2 * v.h2o]).join(' : ')} : 0` },
      ];
    },
  },
  {
    id: 'ancolna', tab: 'hc', title: 'Ancol / axit + Na', f: 'n(−OH hoặc −COOH) = 2·nH₂', kw: 'natri hidro ancol axit',
    hint: 'Ancol đơn chức: n ancol = 2nH₂.',
    inputs: [I('h2', 'n(H₂) sinh ra', 'mol')],
    calc: (v) => [{ l: 'n nhóm −OH / −COOH', v: 2 * v.h2, u: 'mol', main: true }, { l: 'V H₂ (đktc)', v: v.h2 * 22.4, u: 'lít' }],
  },
  {
    id: 'dehy', tab: 'hc', title: 'Ancol tách nước', kw: 'ete anken h2so4 dac 140 170',
    f: '140°C: nAncol = 2nEte = 2nH₂O  ·  170°C: nAncol = nAnken = nH₂O',
    selects: [S('t', 'Điều kiện', [['ete', '140°C — tạo ete'], ['anken', '170°C — tạo anken']])],
    inputs: [I('h2o', 'n(H₂O) tách ra', 'mol')],
    calc: (v, o) => [
      { l: 'n ancol', v: o.t === 'ete' ? 2 * v.h2o : v.h2o, u: 'mol', main: true },
      { l: o.t === 'ete' ? 'n ete' : 'n anken', v: v.h2o, u: 'mol' },
    ],
  },
  {
    id: 'ag', tab: 'hc', title: 'Phản ứng tráng bạc', f: 'HCHO → 4Ag  ·  RCHO, glucozơ, HCOOH → 2Ag', kw: 'trang guong andehit glucozo fructozo ag',
    selects: [S('t', 'Chất', [['2', 'RCHO / glucozơ / HCOOR'], ['4', 'HCHO']])],
    inputs: [I('n', 'n chất', 'mol')],
    calc: (v, o) => [{ l: 'n Ag↓', v: +o.t * v.n, u: 'mol', main: true }, { l: 'm Ag↓', v: +o.t * v.n * 108, u: 'g' }],
  },
  {
    id: 'cooh', tab: 'hc', title: 'Axit cacboxylic + NaHCO₃', f: 'nCOOH = nNaHCO₃ = nCO₂', kw: 'nhom cooh khi co2',
    inputs: [I('n', 'n(NaHCO₃) phản ứng', 'mol')],
    calc: (v) => [{ l: 'n nhóm −COOH', v: v.n, u: 'mol', main: true }, { l: 'V CO₂ (đktc)', v: v.n * 22.4, u: 'lít' }],
  },
  {
    id: 'iso', tab: 'hc', title: 'Số đồng phân (công thức nhanh)', f: 'Ankan 2ⁿ⁻⁴+1 · Ancol 2ⁿ⁻² · Anđehit/Axit 2ⁿ⁻³ · Este 2ⁿ⁻² · Ete (n−1)(n−2)/2', kw: 'dong phan ankan ancol andehit axit este ete',
    selects: [S('t', 'Loại hợp chất', Object.entries(ISO).map(([k, x]) => [k, x[0]]))],
    inputs: [I('n', 'n (số nguyên tử C)')],
    calc: (v, o) => {
      const [, fn, range, test] = ISO[o.t], ok = test(v.n);
      return [
        { l: 'Số đồng phân', v: Math.round(fn(v.n)), main: true, bad: !ok },
        { l: 'Phạm vi công thức đúng', v: range, warn: !ok },
      ];
    },
  },
  {
    id: 'este', tab: 'hc', title: 'Este + NaOH (xà phòng hóa)', f: 'm muối = m este + 40·nNaOH − M(ancol)·nNaOH', kw: 'xa phong hoa muoi ancol rcoor',
    hint: 'Este đơn chức RCOOR′ + NaOH → RCOONa + R′OH, este phản ứng vừa đủ.',
    inputs: [I('m', 'm este', 'g'), I('n', 'n(NaOH)', 'mol'), I('M', 'M ancol R′OH', 'g/mol')],
    calc: (v) => [
      { l: 'm muối', v: v.m + 40 * v.n - v.M * v.n, u: 'g', main: true },
      { l: 'm ancol', v: v.M * v.n, u: 'g' },
      { l: 'M este', v: v.m / v.n, u: 'g/mol' },
    ],
  },
  {
    id: 'beo', tab: 'hc', title: 'Chất béo + NaOH (xà phòng)', f: 'm xà phòng = m chất béo + 40·nNaOH − 92·nC₃H₅(OH)₃', kw: 'xa phong chat beo trieste glixerol',
    hint: 'Triglixerit + 3NaOH → muối + C₃H₅(OH)₃ (nglixerol = nNaOH/3).',
    inputs: [I('m', 'm chất béo', 'g'), I('n', 'n(NaOH)', 'mol')],
    calc: (v) => [
      { l: 'm xà phòng', v: v.m + 40 * v.n - 92 * (v.n / 3), u: 'g', main: true },
      { l: 'm glixerol', v: 92 * (v.n / 3), u: 'g' },
      { l: 'n chất béo', v: v.n / 3, u: 'mol' },
    ],
  },
  {
    id: 'amin', tab: 'hc', title: 'Amin / amino axit + HCl hoặc NaOH', f: 'm muối = m + 36,5·nHCl   |   m + 22·nNaOH', kw: 'amin amino axit aminoaxit muoi',
    selects: [S('t', 'Tác dụng với', [['hcl', 'HCl'], ['naoh', 'NaOH (amino axit)']])],
    inputs: [I('m', 'm chất', 'g'), I('n', 'n phản ứng', 'mol')],
    calc: (v, o) => [{ l: 'm muối', v: v.m + (o.t === 'hcl' ? 36.5 : 22) * v.n, u: 'g', main: true }],
  },
  {
    id: 'glu', tab: 'hc', title: 'Lên men glucozơ', f: 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂', kw: 'len men ancol etylic glucozo',
    inputs: [I('m', 'm glucozơ', 'g'), I('H', 'Hiệu suất', '%', { def: '100' })],
    calc: (v) => {
      const n = (v.m / 180) * 2 * (v.H / 100);
      return [
        { l: 'm C₂H₅OH', v: n * 46, u: 'g', main: true },
        { l: 'n C₂H₅OH = n CO₂', v: n, u: 'mol' },
        { l: 'V CO₂ (đktc)', v: n * 22.4, u: 'lít' },
      ];
    },
  },
  {
    id: 'tinhbot', tab: 'hc', title: 'Thủy phân tinh bột / xenlulozơ', f: '(C₆H₁₀O₅)ₙ + nH₂O → nC₆H₁₂O₆   (162 → 180)', kw: 'tinh bot xenlulozo thuy phan glucozo',
    inputs: [I('m', 'm tinh bột / xenlulozơ', 'g'), I('H', 'Hiệu suất', '%', { def: '100' })],
    calc: (v) => [
      { l: 'm glucozơ', v: (v.m / 162) * 180 * (v.H / 100), u: 'g', main: true },
      { l: 'n glucozơ', v: (v.m / 162) * (v.H / 100), u: 'mol' },
    ],
  },
  {
    id: 'h2n', tab: 'hc', title: 'Hiđro hóa (theo số mol)', f: 'nH₂ phản ứng = n trước − n sau', kw: 'cong h2 ni hidro hoa',
    inputs: [I('nx', 'n hỗn hợp trước', 'mol'), I('ny', 'n hỗn hợp sau', 'mol')],
    calc: (v) => [{ l: 'n H₂ phản ứng', v: v.nx - v.ny, u: 'mol', main: true, bad: v.nx < v.ny }],
  },
  {
    id: 'h2m', tab: 'hc', title: 'Hiđro hóa (theo M trung bình)', f: 'nY = nX·Mx / My   ;   nH₂ pư = nX − nY', kw: 'cong h2 ni hidro hoa khoi luong mol trung binh',
    inputs: [I('nx', 'n hỗn hợp X', 'mol'), I('mx', 'Mx', 'g/mol'), I('my', 'My', 'g/mol')],
    calc: (v) => [
      { l: 'n H₂ phản ứng', v: v.nx - (v.nx * v.mx) / v.my, u: 'mol', main: true, bad: v.my < v.mx },
      { l: 'n hỗn hợp Y', v: (v.nx * v.mx) / v.my, u: 'mol' },
    ],
  },
  {
    id: 'dorượu', tab: 'hc', title: 'Độ rượu', f: 'Độ rượu = V(C₂H₅OH nguyên chất) / V(dung dịch) × 100', kw: 'do ruou etanol ancol etylic',
    hint: 'D(C₂H₅OH) = 0,8 g/ml.',
    inputs: [I('V', 'V dung dịch rượu', 'ml'), I('d', 'Độ rượu', '°')],
    calc: (v) => {
      const Vr = (v.V * v.d) / 100;
      return [
        { l: 'V C₂H₅OH nguyên chất', v: Vr, u: 'ml', main: true },
        { l: 'm C₂H₅OH', v: Vr * 0.8, u: 'g' },
        { l: 'n C₂H₅OH', v: (Vr * 0.8) / 46, u: 'mol' },
      ];
    },
  },

  /* ---------------- NHIỆT · CÂN BẰNG · ĐIỆN HÓA ---------------- */
  {
    id: 'kc', tab: 'nhiet', title: 'Hằng số cân bằng Kc', f: 'Kc = [C]ᶜ·[D]ᵈ / ([A]ᵃ·[B]ᵇ)', kw: 'can bang hoa hoc hang so',
    hint: 'Chất không có thì để trống (tính như 1). Không đưa chất rắn vào biểu thức.',
    inputs: [I('A', '[A]', 'M'), I('B', '[B]', 'M', { opt: 1 }), I('C', '[C]', 'M'), I('D', '[D]', 'M', { opt: 1 }),
      I('a', 'a', '', { def: '1' }), I('b', 'b', '', { def: '1' }), I('c', 'c', '', { def: '1' }), I('d', 'd', '', { def: '1' })],
    calc: (v) => [{ l: 'Kc', v: (v.C ** v.c * v.D ** v.d) / (v.A ** v.a * v.B ** v.b), d: 5, main: true }],
  },
  {
    id: 'kp', tab: 'nhiet', title: 'Liên hệ Kp và Kc', f: 'Kp = Kc·(R·T)^Δn   (R = 0,082)', kw: 'kp ap suat rieng phan',
    hint: 'Δn = Σ hệ số khí sản phẩm − Σ hệ số khí chất đầu.',
    inputs: [I('Kc', 'Kc'), I('dn', 'Δn', '', { def: '0' }), I('T', 'Nhiệt độ', 'K')],
    calc: (v) => [{ l: 'Kp', v: v.Kc * (0.082 * v.T) ** v.dn, d: 5, main: true }],
  },
  {
    id: 'qk', tab: 'nhiet', title: 'Chiều chuyển dịch cân bằng (Q so với K)', f: 'Q < K: thuận  ·  Q = K: cân bằng  ·  Q > K: nghịch', kw: 'chuyen dich chieu phan ung thương nghich',
    inputs: [I('Q', 'Q (thương số phản ứng)'), I('K', 'K (hằng số cân bằng)')],
    calc: (v) => [{ l: 'Kết luận', v: eq(v.Q, v.K) ? 'Đang cân bằng' : v.Q < v.K ? 'Phản ứng diễn ra theo chiều thuận' : 'Phản ứng diễn ra theo chiều nghịch', main: true }],
  },
  {
    id: 'vtb', tab: 'nhiet', title: 'Tốc độ phản ứng trung bình', f: 'v = |C₂ − C₁| / Δt', kw: 'toc do phan ung',
    inputs: [I('C1', 'C₁ (đầu)', 'mol/l'), I('C2', 'C₂ (sau)', 'mol/l'), I('t', 'Thời gian Δt', 's')],
    calc: (v) => [{ l: 'v trung bình', v: Math.abs(v.C2 - v.C1) / v.t, u: 'mol/(l·s)', d: 5, main: true }, { l: 'Tính theo phút', v: (Math.abs(v.C2 - v.C1) / v.t) * 60, u: 'mol/(l·phút)', d: 5 }],
  },
  {
    id: 'gamma', tab: 'nhiet', title: 'Hệ số nhiệt độ (Van’t Hoff)', f: 'v₂/v₁ = γ^((T₂ − T₁)/10)', kw: 'nhiet do toc do van hoff',
    inputs: [I('g', 'Hệ số γ', '', { def: '2' }), I('T1', 'T₁', '°C'), I('T2', 'T₂', '°C')],
    calc: (v) => {
      const r = v.g ** ((v.T2 - v.T1) / 10);
      return [{ l: 'Tốc độ tăng', v: r, u: 'lần', d: 4, main: true }, { l: 'Thời gian giảm', v: r, u: 'lần', d: 4 }];
    },
  },
  {
    id: 'q', tab: 'nhiet', title: 'Nhiệt lượng (nhiệt dung)', f: 'Q = m·c·ΔT   (c nước = 4,18 J/g·K)', kw: 'nhiet luong nhiet dung rieng',
    inputs: [I('m', 'Khối lượng', 'g'), I('c', 'c', 'J/g·K', { def: '4.18' }), I('T1', 'T đầu', '°C'), I('T2', 'T cuối', '°C')],
    calc: (v) => { const Q = v.m * v.c * (v.T2 - v.T1); return [{ l: 'Q', v: Q, u: 'J', main: true }, { l: 'Q', v: Q / 1000, u: 'kJ' }]; },
  },
  {
    id: 'dh', tab: 'nhiet', title: 'Biến thiên enthalpy ΔH', kw: 'enthalpy nhiet phan ung tao thanh nang luong lien ket toa thu',
    f: 'ΔH = ΣΔHf(sản phẩm) − ΣΔHf(chất đầu)   |   ΔH = ΣEb(chất đầu) − ΣEb(sản phẩm)',
    hint: 'Nhớ nhân với hệ số cân bằng trước khi cộng.',
    selects: [S('m', 'Dữ kiện đề cho', [['f', 'Nhiệt tạo thành ΔHf'], ['b', 'Năng lượng liên kết Eb']])],
    inputs: [I('sp', (o) => (o.m === 'f' ? 'ΣΔHf sản phẩm' : 'ΣEb chất đầu'), 'kJ'), I('cd', (o) => (o.m === 'f' ? 'ΣΔHf chất đầu' : 'ΣEb sản phẩm'), 'kJ')],
    calc: (v) => {
      const d = v.sp - v.cd;
      return [{ l: 'ΔH', v: d, u: 'kJ', main: true }, { l: 'Loại phản ứng', v: eq(d, 0) ? '—' : d < 0 ? 'Tỏa nhiệt (ΔH < 0)' : 'Thu nhiệt (ΔH > 0)' }];
    },
  },
  {
    id: 'pin', tab: 'nhiet', title: 'Sức điện động pin điện hóa', f: 'E°pin = E°(cực dương) − E°(cực âm)', kw: 'pin dien hoa the dien cuc chuan',
    inputs: [I('p', 'E° cực dương', 'V'), I('n', 'E° cực âm', 'V')],
    calc: (v) => { const E = v.p - v.n; return [{ l: 'E°pin', v: E, u: 'V', d: 3, main: true, bad: E < 0 }, ...(E < 0 ? [{ l: 'Lưu ý', v: 'Đổi vai trò 2 cực (cực có E° lớn hơn là cực dương)', warn: true }] : [])]; },
  },
  {
    id: 'faraday', tab: 'nhiet', title: 'Định luật Faraday (điện phân)', f: 'm = A·I·t / (n·F)   (F = 96500)', kw: 'dien phan faraday khoi luong bam',
    inputs: [I('A', 'A (khối lượng mol)', 'g/mol'), I('n', 'n (số e trao đổi)', '', { def: '2' }), I('I', 'Cường độ I', 'A'), I('t', 'Thời gian t', 's')],
    calc: (v) => [
      { l: 'm chất thoát ra', v: (v.A * v.I * v.t) / (v.n * 96500), u: 'g', d: 4, main: true },
      { l: 'n e trao đổi', v: (v.I * v.t) / 96500, u: 'mol', d: 5 },
      { l: 'Thời gian', v: v.t / 3600, u: 'giờ', d: 3 },
    ],
  },

  /* ================= CÔNG THỨC MỚI ================= */
  { id: 'v25', tab: 'mol', title: 'Thể tích khí ở 25°C, 1 bar', f: 'V = n × 24,79 (lít)', partial: true, kw: 'the tich mol khi dieu kien chuan 24,79 25 do',
    hint: 'Chương trình 2018 dùng 24,79 L/mol. Để trống 1 ô.',
    inputs: [I('n', 'Số mol n', 'mol'), I('V', 'Thể tích V', 'lít')],
    calc: (v) => solve(v, { n: ['n', 'mol', (x) => x.V / 24.79], V: ['V', 'lít', (x) => x.n * 24.79] }) },
  { id: 'bktl', tab: 'mol', title: 'Bảo toàn khối lượng', f: 'Σm tham gia = Σm sản phẩm', partial: true, kw: 'dinh luat bao toan khoi luong lavoisier',
    hint: 'Chất nào không có thì nhập 0. Để trống đúng 1 ô.',
    inputs: [I('a', 'm chất A', 'g'), I('b', 'm chất B', 'g'), I('c', 'm sản phẩm C', 'g'), I('d', 'm sản phẩm D', 'g')],
    calc: (v) => solve(v, {
      a: ['m chất A', 'g', (x) => x.c + x.d - x.b], b: ['m chất B', 'g', (x) => x.c + x.d - x.a],
      c: ['m sản phẩm C', 'g', (x) => x.a + x.b - x.d], d: ['m sản phẩm D', 'g', (x) => x.a + x.b - x.c] }) },
  { id: 'rho', tab: 'mol', title: 'Khối lượng riêng', f: 'D = m / V', partial: true, kw: 'khoi luong rieng',
    inputs: [I('D', 'D', 'g/ml'), I('m', 'm', 'g'), I('V', 'V', 'ml')],
    calc: (v) => solve(v, { D: ['D', 'g/ml', (x) => x.m / x.V], m: ['m', 'g', (x) => x.D * x.V], V: ['V', 'ml', (x) => x.m / x.D] }) },
  { id: 'tlpt', tab: 'mol', title: 'Tỉ lệ mol theo phương trình', f: 'nA / a = nB / b', partial: true, kw: 'he so ti le mol phuong trinh tinh theo',
    hint: 'a, b là hệ số cân bằng. Để trống n(A) hoặc n(B).',
    inputs: [I('nA', 'n(A)', 'mol'), I('a', 'Hệ số a', '', { def: '1' }), I('nB', 'n(B)', 'mol'), I('b', 'Hệ số b', '', { def: '1' })],
    calc: (v) => solve(v, { nA: ['n(A)', 'mol', (x) => x.nB * x.a / x.b], nB: ['n(B)', 'mol', (x) => x.nA * x.b / x.a] }) },

  { id: 'cpct', tab: 'dd', title: 'Nồng độ phần trăm C%', f: 'C% = m chất tan / m dung dịch × 100', partial: true, kw: 'nong do phan tram khoi luong chat tan',
    hint: 'm dung dịch = m chất tan + m dung môi. Để trống 1 ô.',
    inputs: [I('C', 'C%', '%'), I('ct', 'm chất tan', 'g'), I('dd', 'm dung dịch', 'g')],
    calc: (v) => solve(v, { C: ['C%', '%', (x) => x.ct / x.dd * 100, 3], ct: ['m chất tan', 'g', (x) => x.C * x.dd / 100], dd: ['m dung dịch', 'g', (x) => x.ct * 100 / x.C] }) },
  { id: 'cmn', tab: 'dd', title: 'Nồng độ mol C_M', f: 'C_M = n / V', partial: true, kw: 'nong do mol lit',
    inputs: [I('C', 'C_M', 'mol/l'), I('n', 'n', 'mol'), I('V', 'V', 'lít')],
    calc: (v) => solve(v, { C: ['C_M', 'mol/l', (x) => x.n / x.V, 5], n: ['n', 'mol', (x) => x.C * x.V], V: ['V', 'lít', (x) => x.n / x.C] }) },
  { id: 'phmanh', tab: 'dd', title: 'pH axit mạnh / bazơ mạnh', f: '[H⁺] = k·C (axit)  ;  [OH⁻] = k·C (bazơ)', kw: 'ph hcl h2so4 naoh koh ba(oh)2 axit manh bazo manh',
    hint: 'k = số H⁺ (hoặc OH⁻) mỗi phân tử: HCl k=1, H₂SO₄ k=2, Ba(OH)₂ k=2.',
    selects: [S('t', 'Loại', [['a', 'Axit mạnh'], ['b', 'Bazơ mạnh']])],
    inputs: [I('C', 'Nồng độ C', 'mol/l'), I('k', 'Hệ số k', '', { def: '1' })],
    calc: (v, o) => {
      const x = v.C * v.k, pH = o.t === 'a' ? -Math.log10(x) : 14 + Math.log10(x);
      return [{ l: 'pH', v: pH, d: 3, main: true }, { l: o.t === 'a' ? '[H⁺]' : '[OH⁻]', v: x, u: 'mol/l', d: 5 },
        { l: 'Môi trường', v: eq(pH, 7) ? 'Trung tính' : pH < 7 ? 'Axit' : 'Kiềm' }];
    } },
  { id: 'kakb', tab: 'dd', title: 'Ka ⇄ Kb của cặp liên hợp', f: 'Ka·Kb = Kw = 10⁻¹⁴   ;   pKa + pKb = 14', partial: true, kw: 'ka kb pka pkb lien hop',
    inputs: [I('Ka', 'Ka'), I('Kb', 'Kb')],
    calc: (v) => solve(v, { Ka: ['Ka', '', (x) => 1e-14 / x.Kb, 4], Kb: ['Kb', '', (x) => 1e-14 / x.Ka, 4] }) },
  { id: 'ksp', tab: 'dd', title: 'Tích số tan Ksp & điều kiện kết tủa', f: 'Q = [Aᵐ⁺]ᵐ·[Bⁿ⁻]ⁿ   →   Q > Ksp: có kết tủa', kw: 'ksp tich so tan ket tua bao hoa',
    inputs: [I('K', 'Ksp'), I('A', '[Aᵐ⁺]', 'mol/l'), I('m', 'm', '', { def: '1' }), I('B', '[Bⁿ⁻]', 'mol/l'), I('n', 'n', '', { def: '1' })],
    calc: (v) => {
      const Q = v.A ** v.m * v.B ** v.n, s = (v.K / (v.m ** v.m * v.n ** v.n)) ** (1 / (v.m + v.n));
      return [{ l: 'Q', v: Q, d: 4 }, { l: 'Kết luận', main: true, v: eq(Q, v.K) ? 'Dung dịch vừa bão hòa' : Q > v.K ? 'Có kết tủa' : 'Chưa kết tủa' },
        { l: 'Độ tan s trong nước nguyên chất', v: s, u: 'mol/l', d: 4 }];
    } },
  { id: 'btdt', tab: 'dd', title: 'Bảo toàn điện tích trong dung dịch', f: 'Σ(n·z) cation = Σ(n·z) anion', kw: 'bao toan dien tich ion muoi dung dich',
    hint: 'Nhập cation và anion đã biết. Ô trống được bỏ qua; chênh lệch cho biết ion còn thiếu.',
    inputs: [I('n1', 'n cation 1', 'mol', { opt: true }), I('z1', 'z₁', '', { def: '1' }), I('n2', 'n cation 2', 'mol', { opt: true }), I('z2', 'z₂', '', { def: '1' }),
      I('m1', 'n anion 1', 'mol', { opt: true }), I('y1', 'z₁', '', { def: '1' }), I('m2', 'n anion 2', 'mol', { opt: true }), I('y2', 'z₂', '', { def: '1' })],
    calc: (v) => {
      const p = v.n1 * v.z1 + v.n2 * v.z2, a = v.m1 * v.y1 + v.m2 * v.y2, d = p - a;
      return [{ l: 'Tổng điện tích dương', v: p, u: 'mol' }, { l: 'Tổng điện tích âm', v: a, u: 'mol' },
        { l: 'Kết luận', main: true, bad: !eq(d, 0), v: eq(d, 0) ? '✅ Cân bằng điện tích' : d > 0 ? `Còn thiếu ${fmt(d)} mol điện tích âm` : `Còn thiếu ${fmt(-d)} mol điện tích dương` }];
    } },

  { id: 'feno3', tab: 'vc', title: 'Fe + HNO₃ loãng (sản phẩm khử NO)', f: 'T = nHNO₃/nFe   ·   T ≥ 4: Fe³⁺   ·   8/3 < T < 4: cả hai   ·   T ≤ 8/3: Fe²⁺', kw: 'sat axit nitric muoi fe2+ fe3+ no',
    inputs: [I('fe', 'n(Fe)', 'mol'), I('hno3', 'n(HNO₃)', 'mol')],
    calc: (v) => {
      const T = v.hno3 / v.fe;
      if (T >= 4 - 1e-9) return [{ l: 'Sản phẩm', main: true, v: 'Chỉ Fe(NO₃)₃' + (T > 4 + 1e-9 ? ' (HNO₃ còn dư)' : '') }, { l: 'n NO', v: v.fe, u: 'mol' }];
      if (T <= 8 / 3 + 1e-9) return [{ l: 'Sản phẩm', main: true, v: 'Fe(NO₃)₂' + (T < 8 / 3 - 1e-9 ? ' (Fe còn dư)' : '') },
        { l: 'n Fe dư', v: v.fe - (3 / 8) * v.hno3, u: 'mol' }, { l: 'n NO', v: v.hno3 / 4, u: 'mol' }];
      const a = 0.75 * (v.hno3 - (8 * v.fe) / 3);
      return [{ l: 'Sản phẩm', main: true, v: 'Hỗn hợp Fe(NO₃)₃ và Fe(NO₃)₂' }, { l: 'n Fe³⁺', v: a, u: 'mol' }, { l: 'n Fe²⁺', v: v.fe - a, u: 'mol' }, { l: 'n NO', v: v.hno3 / 4, u: 'mol' }];
    } },
  { id: 'khu', tab: 'vc', title: 'Khử oxit kim loại bằng CO / H₂', f: 'm rắn = m oxit − 16·nO   (nO = nCO₂ = nH₂O)', kw: 'khu oxit co h2 khoi luong chat ran',
    hint: 'nO bị lấy đi bằng số mol CO₂ (hoặc H₂O) tạo thành.',
    inputs: [I('m', 'm oxit ban đầu', 'g'), I('n', 'n(CO₂) hoặc n(H₂O)', 'mol')],
    calc: (v) => [{ l: 'm chất rắn sau', v: v.m - 16 * v.n, u: 'g', main: true, bad: v.m - 16 * v.n < 0 }, { l: 'n O bị lấy', v: v.n, u: 'mol' }, { l: 'V CO₂ / H₂O(k) (đktc)', v: v.n * 22.4, u: 'lít' }] },
  { id: 'alnaoh', tab: 'vc', title: 'Al + NaOH → H₂', f: '2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂   ·   nAl = 2/3·nH₂', kw: 'nhom kiem hidro',
    inputs: [I('h2', 'n(H₂)', 'mol')],
    calc: (v) => [{ l: 'n Al', v: (2 / 3) * v.h2, u: 'mol', main: true }, { l: 'm Al', v: (2 / 3) * v.h2 * 27, u: 'g' }, { l: 'n NaOH tối thiểu', v: (2 / 3) * v.h2, u: 'mol' }] },

  { id: 'peptit', tab: 'hc', title: 'Thủy phân peptit', f: 'm peptit = m amino axit − 18·(k − 1)·n peptit', kw: 'peptit protein amino axit thuy phan',
    hint: 'k = số mắt xích amino axit trong 1 phân tử peptit.',
    inputs: [I('m', 'm amino axit', 'g'), I('k', 'k (số mắt xích)'), I('n', 'n peptit', 'mol')],
    calc: (v) => [{ l: 'm peptit', v: v.m - 18 * (v.k - 1) * v.n, u: 'g', main: true }, { l: 'n H₂O tham gia', v: (v.k - 1) * v.n, u: 'mol' }, { l: 'n amino axit', v: v.k * v.n, u: 'mol' }] },
  { id: 'chiso', tab: 'hc', title: 'Chỉ số axit / xà phòng hóa', f: 'Chỉ số = m KOH (mg) / m chất béo (g)', partial: true, kw: 'chi so axit xa phong hoa chat beo koh',
    hint: 'Để trống 1 ô cần tìm.',
    inputs: [I('CS', 'Chỉ số'), I('k', 'm KOH', 'mg'), I('m', 'm chất béo', 'g')],
    calc: (v) => solve(v, { CS: ['Chỉ số', '', (x) => x.k / x.m], k: ['m KOH', 'mg', (x) => x.CS * x.m], m: ['m chất béo', 'g', (x) => x.k / x.CS] }) },
  { id: 'amindot', tab: 'hc', title: 'Đốt amin no, đơn chức, mạch hở', f: 'n amin = (nH₂O − nCO₂) / 1,5   ;   nN₂ = n amin / 2', kw: 'amin dot chay cnh2n+3n',
    inputs: [I('co2', 'n(CO₂)', 'mol'), I('h2o', 'n(H₂O)', 'mol')],
    calc: (v) => { const n = (v.h2o - v.co2) / 1.5; return [{ l: 'n amin', v: n, u: 'mol', main: true, bad: n <= 0 }, { l: 'n N₂', v: n / 2, u: 'mol' }, { l: 'Số C trung bình', v: v.co2 / n, d: 3 }]; } },
  { id: 'polime', tab: 'hc', title: 'Hệ số polime hóa', f: 'n = M polime / M mắt xích', partial: true, kw: 'polime trung hop trung ngung he so',
    inputs: [I('n', 'Hệ số n'), I('P', 'M polime', 'g/mol'), I('M', 'M mắt xích', 'g/mol')],
    calc: (v) => solve(v, { n: ['n', '', (x) => x.P / x.M, 1], P: ['M polime', 'g/mol', (x) => x.n * x.M], M: ['M mắt xích', 'g/mol', (x) => x.P / x.n] }) },
  { id: 'disac', tab: 'hc', title: 'Thủy phân saccarozơ / mantozơ', f: 'C₁₂H₂₂O₁₁ + H₂O → 2C₆H₁₂O₆   (342 → 360)', kw: 'saccarozo mantozo glucozo fructozo thuy phan',
    selects: [S('t', 'Chất', [['sac', 'Saccarozơ → glucozơ + fructozơ'], ['man', 'Mantozơ → 2 glucozơ']])],
    inputs: [I('m', 'm đisaccarit', 'g'), I('H', 'Hiệu suất', '%', { def: '100' })],
    calc: (v, o) => { const n = (v.m / 342) * (v.H / 100); return [{ l: o.t === 'sac' ? 'n glucozơ = n fructozơ' : 'n glucozơ', v: o.t === 'sac' ? n : 2 * n, u: 'mol', main: true }, { l: 'm monosaccarit', v: n * 360, u: 'g' }]; } },
  { id: 'brom', tab: 'hc', title: 'Cộng Br₂ vào hydrocarbon không no', f: 'số liên kết π = nBr₂ / nHC', partial: true, kw: 'brom cong pi anken ankin',
    inputs: [I('k', 'Số π (k)'), I('br', 'n(Br₂)', 'mol'), I('hc', 'n hydrocarbon', 'mol')],
    calc: (v) => solve(v, { k: ['Số liên kết π', '', (x) => x.br / x.hc, 2], br: ['n Br₂', 'mol', (x) => x.k * x.hc], hc: ['n hydrocarbon', 'mol', (x) => x.br / x.k] }) },
  { id: 'ctptdot', tab: 'hc', title: 'Lập CTPT từ sản phẩm cháy', f: 'x = nCO₂/nA  ;  y = 2nH₂O/nA  ;  z = (M − 12x − y)/16', partial: true, kw: 'cong thuc phan tu dot chay co2 h2o khoi luong mol',
    hint: 'Nhập M để tính cả số O.',
    inputs: [I('a', 'n chất A', 'mol'), I('co2', 'n(CO₂)', 'mol'), I('h2o', 'n(H₂O)', 'mol'), I('M', 'M chất A', 'g/mol')],
    calc: (v) => {
      const x = v.co2 / v.a, y = (2 * v.h2o) / v.a, z = (v.M - 12 * x - y) / 16, ok = [x, y, z].every((t) => Math.abs(t - Math.round(t)) < 0.06);
      return [{ l: 'C : H : O', v: `${fmt(x, 2)} : ${fmt(y, 2)} : ${fmt(z, 2)}` },
        { l: 'Công thức phân tử', main: true, bad: !ok, v: ok ? formulaStr(Math.round(x), Math.round(y), Math.round(z)) : 'Chưa nguyên — kiểm tra lại đề' }];
    } },

  { id: 'nernst', tab: 'nhiet', title: 'Phương trình Nernst', f: 'E = E° − (0,0592 / n)·lg Q   (25°C)', kw: 'nernst the dien cuc pin nong do',
    inputs: [I('E0', 'E°', 'V'), I('n', 'n (số e)', '', { def: '2' }), I('Q', 'Q (thương số phản ứng)')],
    calc: (v) => { const E = v.E0 - (0.0592 / v.n) * Math.log10(v.Q); return [{ l: 'E', v: E, u: 'V', d: 4, main: true }, { l: 'ΔG = −nFE', v: (-v.n * 96500 * E) / 1000, u: 'kJ' }]; } },
  { id: 'gibbs', tab: 'nhiet', title: 'Năng lượng tự do Gibbs', f: 'ΔG = ΔH − T·ΔS', kw: 'gibbs entropy tu phat tu xay ra',
    inputs: [I('dH', 'ΔH', 'kJ'), I('T', 'Nhiệt độ T', 'K', { def: '298' }), I('dS', 'ΔS', 'J/K')],
    calc: (v) => { const G = v.dH - (v.T * v.dS) / 1000; return [{ l: 'ΔG', v: G, u: 'kJ', main: true }, { l: 'Tự diễn ra?', v: eq(G, 0) ? 'Đang cân bằng' : G < 0 ? 'Có (ΔG < 0)' : 'Không (ΔG > 0)' }, { l: 'T cân bằng', v: v.dH / (v.dS / 1000), u: 'K', d: 1 }]; } },
  { id: 'arrh', tab: 'nhiet', title: 'Năng lượng hoạt hóa (Arrhenius)', f: 'ln(k₂/k₁) = (Ea/R)·(1/T₁ − 1/T₂)   (R = 8,314)', kw: 'arrhenius nang luong hoat hoa toc do',
    inputs: [I('k1', 'k₁'), I('T1', 'T₁', 'K'), I('k2', 'k₂'), I('T2', 'T₂', 'K')],
    calc: (v) => [{ l: 'Ea', v: (8.314 * Math.log(v.k2 / v.k1)) / (1 / v.T1 - 1 / v.T2) / 1000, u: 'kJ/mol', d: 3, main: true }, { l: 'k₂ / k₁', v: v.k2 / v.k1, d: 4 }] },
  { id: 'half', tab: 'nhiet', title: 'Chu kì bán hủy (bậc 1)', f: 't½ = ln2 / k   ;   còn lại = e^(−k·t)', kw: 'ban huy bac 1 phan huy',
    inputs: [I('k', 'Hằng số k', '1/đơn vị t'), I('t', 'Thời gian t')],
    calc: (v) => [{ l: 't½', v: Math.LN2 / v.k, d: 4, main: true }, { l: 'Lượng còn lại', v: 100 * Math.exp(-v.k * v.t), u: '%', d: 3 }] },
  { id: 'qpu', tab: 'nhiet', title: 'Nhiệt tỏa / thu theo số mol', f: 'Q = n·|ΔH| / a', kw: 'nhiet luong phan ung toa thu delta h',
    hint: 'a = hệ số của chất đang xét trong phương trình nhiệt hóa học.',
    inputs: [I('n', 'n chất phản ứng', 'mol'), I('dH', 'ΔH của phương trình', 'kJ'), I('a', 'Hệ số a', '', { def: '1' })],
    calc: (v) => [{ l: 'Nhiệt lượng', v: (v.n * Math.abs(v.dH)) / v.a, u: 'kJ', main: true }, { l: 'Loại', v: v.dH < 0 ? 'Tỏa nhiệt' : 'Thu nhiệt' }] },
  { id: 'vk', tab: 'nhiet', title: 'Định luật tốc độ phản ứng', f: 'v = k·[A]ᵃ·[B]ᵇ   ;   [A] tăng x lần → v tăng xᵃ lần', kw: 'toc do phan ung bac phan ung nong do hang so k',
    inputs: [I('k', 'k'), I('A', '[A]', 'mol/l'), I('a', 'Bậc a', '', { def: '1' }), I('B', '[B]', 'mol/l', { def: '1' }), I('b', 'Bậc b', '', { def: '0' }), I('x', 'Tăng [A] x lần', '×', { def: '1' })],
    calc: (v) => [{ l: 'v', v: v.k * v.A ** v.a * v.B ** v.b, u: 'mol/(l·s)', d: 5, main: true }, { l: 'v tăng', v: v.x ** v.a, u: 'lần', d: 4 }] },
];

/* ========================================================================
   Máy tính nhanh + hằng số
   ==================================================================== */
const QUICK = [
  ['R', '0,082', 'L·atm/mol·K', '0.082'], ['R', '8,314', 'J/mol·K', '8.314'], ['Vₘ', '22,4', 'L/mol (đktc)', '22.4'],
  ['F', '96500', 'C/mol', '96500'], ['Nₐ', '6,022×10²³', '', '6.022e23'], ['Kw', '10⁻¹⁴', '25°C', '1e-14'],
  ['c H₂O', '4,18', 'J/g·K', '4.18'], ['Vₘ', '24,79', 'L/mol (25°C, 1 bar)', '24.79'], ['1 atm', '760', 'mmHg', '760'],
  ['D H₂O', '1', 'g/ml', '1'], ['e', '1,602×10⁻¹⁹', 'C', '1.602e-19'], ['ln2', '0,693', 'bán hủy', '0.693'],
];

const UNITS = {
  'Áp suất': { atm: 1, mmHg: 1 / 760, Pa: 1 / 101325, kPa: 1 / 101.325, bar: 1 / 1.01325 },
  'Thể tích': { lít: 1, ml: 1e-3, 'm³': 1e3, 'cm³': 1e-3 },
  'Năng lượng': { J: 1, kJ: 1e3, cal: 4.184, kcal: 4184 },
  'Khối lượng': { mg: 1e-3, g: 1, kg: 1e3, tấn: 1e6 },
};
const TEMP = { '°C': [(c) => c, (c) => c], K: [(k) => k - 273.15, (c) => c + 273.15], '°F': [(f) => ((f - 32) * 5) / 9, (c) => (c * 9) / 5 + 32] };
const CATS = [...Object.keys(UNITS), 'Nhiệt độ'];
const unitsOf = (c) => (c === 'Nhiệt độ' ? Object.keys(TEMP) : Object.keys(UNITS[c]));

function UnitConv() {
  const copy = useCopy();
  const [cat, setCat] = useState(CATS[0]);
  const [from, setFrom] = useState('atm');
  const [to, setTo] = useState('mmHg');
  const [x, setX] = useState('1');
  const list = unitsOf(cat);
  const changeCat = (c) => { const l = unitsOf(c); setCat(c); setFrom(l[0]); setTo(l[1]); };
  const n = parseFloat(x);
  const out = isNaN(n) ? NaN : cat === 'Nhiệt độ' ? TEMP[to][1](TEMP[from][0](n)) : (n * UNITS[cat][from]) / UNITS[cat][to];
  const text = isNaN(out) ? '' : String(fmt(out, 6));
  return (
    <section className="fc-panel">
      <p className="fc-sub">Đổi đơn vị</p>
      <div className="fc-uc">
        <select value={cat} onChange={(e) => changeCat(e.target.value)} aria-label="Đại lượng">
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="number" step="any" value={x} onChange={(e) => setX(e.target.value)} aria-label="Giá trị" />
        <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Từ">{list.map((u) => <option key={u}>{u}</option>)}</select>
        <span aria-hidden="true">→</span>
        <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Sang">{list.map((u) => <option key={u}>{u}</option>)}</select>
      </div>
      <button type="button" className={'fc-qc-res fc-uc-res' + (text ? '' : ' off')} disabled={!text} onClick={() => copy(text)} title="Nhấn để sao chép">
        {text ? `${text} ${to}` : '='}
      </button>
    </section>
  );
}

function QuickCalc() {
  const copy = useCopy();
  const [q, setQ] = useState('');
  const [hist, setHist] = useState([]);
  let res = null, err = '';
  try { res = evalExpr(q); } catch (e) { err = e.message; }
  const text = res === null ? '' : fmt(res, 6);
  return (
    <div className="fc-tools">
      <section className="fc-panel">
        <p className="fc-sub">Máy tính nhanh</p>
        <div className="fc-qc">
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="vd: 0.5*22.4 + sqrt(16)/2   ·   lg(2e-5)   ·   R*(273+25)"
            spellCheck="false" autoComplete="off" aria-label="Máy tính biểu thức"
            onKeyDown={(e) => { if (e.key === 'Enter' && text) { copy(text); setHist((h) => [{ q, text }, ...h.filter((x) => x.q !== q)].slice(0, 5)); } }}
          />
          <button type="button" className={'fc-qc-res' + (res === null || err ? ' off' : '')} onClick={() => text && copy(text)} title="Nhấn để sao chép" disabled={!text}>
            {err ? '?' : res === null ? '=' : `= ${text}`}
          </button>
        </div>
        <p className="fc-hint" style={{ margin: '.5rem 0 0' }}>{err || 'Hỗ trợ + − × ÷ ^ ( ) sqrt lg ln exp và hằng số R, F, NA, Kw, pi.'}</p>
        {hist.length > 0 && (
          <div className="fc-hist">
            {hist.map((h) => <button type="button" key={h.q} className="fc-const" onClick={() => setQ(h.q)} title="Dùng lại biểu thức">{h.q} = <b>{h.text}</b></button>)}
          </div>
        )}
      </section>
      <section className="fc-panel">
        <p className="fc-sub">Hằng số thường dùng (nhấn để sao chép)</p>
        <div className="fc-consts">
          {QUICK.map(([n, shown, u, raw]) => (
            <button type="button" key={n + shown} className="fc-const" onClick={() => copy(raw)} title={u}>
              {n} = <b>{shown}</b>
            </button>
          ))}
        </div>
      </section>
      <UnitConv />
    </div>
  );
}

/* ========================================================================
   Component chính
   ==================================================================== */
const TABS = [
  ['fav', '★ Đã ghim'],
  ['recent', '🕘 Gần đây'],
  ['mol', 'Mol & Khí'],
  ['dd', 'Dung dịch & pH'],
  ['vc', 'Vô cơ'],
  ['hc', 'Hữu cơ'],
  ['nhiet', 'Nhiệt · Cân bằng · Điện'],
];
const TAB_NAME = Object.fromEntries(TABS);

export default function FormulaCalculator() {
  const [tabSaved, setTab] = useLocalStorage('cs-fc-tab', 'mol');
  const [fav, setFav] = useLocalStorage('cs-fc-fav', []);
  const [q, setQ] = useState('');
  const [toast, setToast] = useState('');
  const searchRef = useRef(null);
  const timer = useRef(0);

  const tab = TABS.some((t) => t[0] === tabSaved) ? tabSaved : 'mol';
  const favList = Array.isArray(fav) ? fav : [];
  const [recent, setRecent] = useLocalStorage('cs-fc-recent', []);
  const recentList = (Array.isArray(recent) ? recent : []).filter((id) => CARDS.some((c) => c.id === id));
  const touch = (id) => {
    if (tab === 'recent' || recentList[0] === id) return;
    setRecent([id, ...recentList.filter((x) => x !== id)].slice(0, 8));
  };

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 1500);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer.current); };
  }, []);

  const toggleFav = (id) => setFav(favList.includes(id) ? favList.filter((x) => x !== id) : [...favList, id]);

  const query = norm(q.trim());
  const list = useMemo(() => {
    if (query) {
      const words = query.split(/\s+/);
      return CARDS.filter((c) => {
        const hay = norm([c.title, c.f, c.hint, c.kw].filter(Boolean).join(' '));
        return words.every((w) => hay.includes(w));
      });
    }
    if (tab === 'fav') return CARDS.filter((c) => favList.includes(c.id));
    if (tab === 'recent') return recentList.map((id) => CARDS.find((c) => c.id === id));
    return CARDS.filter((c) => c.tab === tab);
  }, [query, tab, favList.join('|'), recentList.join('|')]);

  const counts = useMemo(() => {
    const m = { fav: favList.filter((id) => CARDS.some((c) => c.id === id)).length, recent: recentList.length };
    for (const c of CARDS) m[c.tab] = (m[c.tab] || 0) + 1;
    return m;
  }, [favList.join('|'), recentList.join('|')]);

  return (
    <ToastCtx.Provider value={notify}>
      <TouchCtx.Provider value={touch}>
      <section className="wrap fc">
        <h1>Công thức nhanh</h1>
        <p className="fc-lead">
          {CARDS.length} công thức Hóa 10 – 12: nhập số, kết quả hiện ngay. Ghim công thức hay dùng, xem lại các thẻ vừa dùng, đổi đơn vị và tìm kiếm không cần gõ dấu.
        </p>

        <div className="fc-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} type="search"
            placeholder="Tìm công thức: hieu suat, ph, este, faraday, đồng phân…" aria-label="Tìm công thức"
          />
          {!q && <kbd>/</kbd>}
        </div>

        <QuickCalc />

        <div className="fc-tabs" role="tablist">
          {TABS.map(([k, l]) => (
            <button
              key={k} role="tab" aria-selected={!query && tab === k}
              className={'chip' + (!query && tab === k ? ' on' : '')}
              onClick={() => { setQ(''); setTab(k); }}
            >
              {l}<span className="fc-n">{counts[k] || 0}</span>
            </button>
          ))}
        </div>

        {query && <p className="fc-count">{list.length} kết quả cho “{q.trim()}” — tìm trong tất cả các nhóm</p>}

        {list.length === 0 ? (
          <p className="fc-empty big">
            {query ? 'Không tìm thấy công thức phù hợp. Thử từ khóa ngắn hơn (vd: “mol”, “ph”, “este”).'
              : tab === 'recent' ? 'Chưa có công thức nào được dùng. Bấm vào ô nhập của một thẻ để lưu vào đây.' : 'Chưa có công thức nào được ghim. Nhấn ☆ trên thẻ để ghim.'}
          </p>
        ) : (
          <div className="fc-grid">
            {list.map((c) => {
              const common = { fav: favList.includes(c.id), onFav: () => toggleFav(c.id), tag: query || tab === 'fav' || tab === 'recent' ? TAB_NAME[c.tab] : null };
              return c.custom ? <MolCard key={c.id} {...common} /> : <CalcCard key={c.id} def={c} {...common} />;
            })}
          </div>
        )}
      </section>
      <div className={'fc-toast' + (toast ? ' on' : '')} role="status">{toast}</div>
      </TouchCtx.Provider>
    </ToastCtx.Provider>
  );
}