/* ============================================================
   chemBalance.js — LÕI HÓA HỌC THUẦN (không React, không DOM)
   ------------------------------------------------------------
   Nguồn sự thật duy nhất cho:
     • parse công thức hóa học (kể cả ngoặc, hydrat: CuSO4·5H2O)
     • khối lượng mol (dùng bảng 118 nguyên tố, fallback SGK)
     • cân bằng phương trình bằng đại số tuyến tính (RREF, bigint)
     • kiểm tra bảo toàn nguyên tố sau khi cân bằng
   Được dùng bởi: EquationBalancer, MolarMass và lớp công cụ AI (aiTools.js).
   ============================================================ */
import { ELEMENTS, SGK_MASS } from '../data/elements.js';

/* ============ BẢNG KHỐI LƯỢNG NGUYÊN TỬ ============ */
const MASS = new Map();
for (const e of ELEMENTS) {
  const raw = String(e.atomicMass ?? '').trim();
  const num = parseFloat(raw.replace(/[^\d.]/g, ''));
  const value = Number.isFinite(num) && num > 0 ? num : (SGK_MASS[e.symbol] ?? null);
  MASS.set(e.symbol, value);
}
const SYMSET = new Set(ELEMENTS.map((e) => e.symbol));
const NAME_BY_SYM = new Map(ELEMENTS.map((e) => [e.symbol, e.name || e.symbol]));

export const isValidSymbol = (s) => SYMSET.has(s);
export const atomicMassOf = (symbol) => MASS.get(symbol) ?? null;
export const elementName = (symbol) => NAME_BY_SYM.get(symbol) ?? symbol;

/* ============ HIỂN THỊ: CHỈ SỐ DƯỚI / TRÊN ============ */
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const subN = (n) => String(n).split('').map((d) => SUB[+d] ?? d).join('');
const supN = (n) => String(n).split('').map((d) => SUP[+d] ?? d).join('');

/** SO4 -> SO₄ ; Ca(OH)2 -> Ca(OH)₂ ; SO4(2-) -> SO₄²⁻ */
export function prettyFormula(formula) {
  let s = String(formula || '').trim().replace(/\s+/g, '');
  // Đuôi điện tích: (2-), (3+), 2-, 3+
  s = s.replace(/\((?:(\d)([+-])|([+-]))\)$/g, (m, d, sign, lone) => {
    const n = d ? Number(d) : 1;
    return (n === 1 ? '' : supN(n)) + ((sign || lone) === '-' ? '⁻' : '⁺');
  });
  s = s.replace(/([A-Za-z)\]])(\d+)/g, (m, a, d) => a + subN(Number(d)));
  return s;
}

/* ============ PARSE CÔNG THỨC ============ */
/**
 * parseFormula('Ca(OH)2') → { Ca: 1, O: 2, H: 2 }
 * Hỗ trợ: ngoặc ( ) [ ], hydrat bằng · . * (vd: CuSO4·5H2O), hệ số đầu cụm.
 * @returns {Record<string, number>} số nguyên tử theo ký hiệu nguyên tố
 */
export function parseFormula(input) {
  const f = String(input || '').trim().replace(/\s+/g, '');
  if (!f) throw new Error('Công thức rỗng');

  let i = 0;
  const stack = [{}];

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

  // Hệ số đầu cụm (vd "5H2O")
  const lead = readNumber();

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
      const rest = f.slice(i);
      if (!rest) throw new Error('Thiếu công thức sau dấu chấm hydrat');
      const sub = parseFormula(rest);
      for (const k in sub) add(stack[0], k, sub[k] * mult);
      break;
    }

    if (!/[A-Za-z]/.test(c)) throw new Error(`Ký tự không hợp lệ: "${c}" trong "${input}"`);

    const two = f.slice(i, i + 2);
    const one = f[i];
    let sym;
    if (two.length === 2 && /^[A-Z][a-z]$/.test(two) && isValidSymbol(two)) { sym = two; i += 2; }
    else if (isValidSymbol(one)) { sym = one; i += 1; }
    else throw new Error(`Nguyên tố không tồn tại: "${/^[A-Z][a-z]$/.test(two) ? two : one}"`);

    add(stack[stack.length - 1], sym, readNumber());
  }

  if (stack.length !== 1) throw new Error('Ngoặc không cân đối');

  const out = stack[0];
  if (lead !== 1) for (const k in out) out[k] *= lead;
  if (!Object.keys(out).length) throw new Error('Công thức không có nguyên tố nào');
  return out;
}

/* ============ KHỐI LƯỢNG MOL ============ */
/**
 * molarMass('H2SO4') → { value: 98, breakdown: [...], unknown: [] }
 * Làm tròn 3 chữ số thập phân.
 * @param {{ sgk?: boolean }} opts sgk: dùng số liệu làm tròn của SGK phổ thông VN.
 */
export function molarMass(formula, opts = {}) {
  const counts = parseFormula(formula);
  const breakdown = [];
  const unknown = [];
  let total = 0;
  const useSgk = opts.sgk === true;

  for (const sym of Object.keys(counts)) {
    const m = useSgk && SGK_MASS[sym] !== undefined ? SGK_MASS[sym] : MASS.get(sym);
    if (m == null) { unknown.push(sym); continue; }
    const subtotal = m * counts[sym];
    total += subtotal;
    breakdown.push({ symbol: sym, name: elementName(sym), count: counts[sym], mass: m, subtotal });
  }

  breakdown.sort((a, b) => b.subtotal - a.subtotal);
  return {
    formula: String(formula),
    pretty: prettyFormula(formula),
    value: Math.round(total * 1000) / 1000,
    breakdown,
    unknown,
    counts,
  };
}

/* ============ SỐ HỌC PHÂN SỐ (bigint) ============ */
const babs = (a) => (a < 0n ? -a : a);
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
const F0 = new Frac(0n);
const F1 = new Frac(1n);

/* ============ TÁCH PHƯƠNG TRÌNH ============ */
const ARROW_RE = /\s*(<->|<=>|->|=>|→|⇌|⟶|=)\s*/;

export function splitEquation(raw) {
  const str = String(raw || '').trim();
  const arrowMatch = str.match(ARROW_RE);
  if (!arrowMatch) {
    throw new Error('Thiếu mũi tên phản ứng. Dùng "->", "=" hoặc "→" để ngăn cách 2 vế.');
  }
  const arrow = arrowMatch[1];
  const reversible = /⇌|<=>|<->/.test(arrow);
  const left = str.slice(0, arrowMatch.index);
  const right = str.slice(arrowMatch.index + arrowMatch[0].length);

  const side = (s) => s
    .split('+')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const noCoef = t.replace(/^\d+\s*/, ''); // bỏ hệ số người dùng gõ sẵn, sẽ tự tính lại
      if (!noCoef) throw new Error(`Thiếu công thức trong cụm "${t}"`);
      const clean = noCoef.replace(/\s/g, '');
      return { formula: clean, counts: parseFormula(clean) };
    });

  const L = side(left);
  const R = side(right);
  if (!L.length || !R.length) throw new Error('Cả hai vế phải có ít nhất một chất.');
  return { L, R, arrow: reversible ? '⇌' : '→', reversible };
}

/* ============ RREF ============ */
function rref(M) {
  const rows = M.length;
  const cols = M[0].length;
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

/* ============ CÂN BẰNG PHƯƠNG TRÌNH ============ */
/**
 * balanceEquation('Fe + O2 -> Fe2O3')
 * → { equation, pretty, left:[{formula,coef}], right:[...], coeffL, coeffR, elements, ambiguous }
 */
export function balanceEquation(raw) {
  const { L, R, arrow, reversible } = splitEquation(raw);
  const terms = [...L.map((t) => ({ ...t, side: 1 })), ...R.map((t) => ({ ...t, side: -1 }))];

  const elements = [];
  for (const t of terms) for (const el in t.counts) if (!elements.includes(el)) elements.push(el);

  const nCols = terms.length;
  const M = elements.map((el) => terms.map((t) => new Frac((t.counts[el] || 0) * t.side)));
  const pivots = rref(M);

  const freeCols = [];
  for (let c = 0; c < nCols; c++) if (!pivots.includes(c)) freeCols.push(c);
  if (freeCols.length === 0) {
    throw new Error('Không tìm được cách cân bằng — số ẩn số ít hơn số ràng buộc độc lập.');
  }

  const chosen = freeCols[freeCols.length - 1];
  const x = new Array(nCols).fill(F0);
  x[chosen] = F1;
  for (let r = 0; r < pivots.length; r++) {
    const pc = pivots[r];
    x[pc] = M[r][chosen].neg();
  }

  let lcm = 1n;
  for (const f of x) lcm = (lcm * f.d) / bgcd(lcm, f.d);
  let ints = x.map((f) => f.n * (lcm / f.d));

  let g = 0n;
  for (const v of ints) g = bgcd(g, v);
  if (g === 0n) throw new Error('Không tìm được nghiệm hợp lệ.');
  ints = ints.map((v) => v / g);

  const nonZero = ints.filter((v) => v !== 0n);
  if (nonZero.some((v) => v < 0n) && nonZero.some((v) => v > 0n)) {
    throw new Error('Phương trình không thể cân bằng với các chất đã cho — kiểm tra lại chất tham gia/sản phẩm.');
  }
  if (nonZero.some((v) => v < 0n)) ints = ints.map((v) => -v);
  if (ints.some((v) => v === 0n)) {
    throw new Error('Có chất không tham gia phản ứng theo nghiệm tìm được — kiểm tra lại phương trình.');
  }

  const nLeft = L.length;
  const coeffL = ints.slice(0, nLeft).map((v) => Number(v));
  const coeffR = ints.slice(nLeft).map((v) => Number(v));
  const left = L.map((t, i) => ({ formula: t.formula, coef: coeffL[i] }));
  const right = R.map((t, i) => ({ formula: t.formula, coef: coeffR[i] }));

  const plain = (list) => list.map((t) => (t.coef === 1 ? t.formula : `${t.coef}${t.formula}`)).join(' + ');
  const uni = (list) => list.map((t) => (t.coef === 1 ? '' : t.coef) + prettyFormula(t.formula)).join(' + ');

  return {
    equation: `${plain(left)} ${arrow} ${plain(right)}`,
    pretty: `${uni(left)} ${arrow} ${uni(right)}`,
    left,
    right,
    coeffL,
    coeffR,
    elements,
    ambiguous: freeCols.length > 1,
    reversible,
  };
}

/* ============ KIỂM TRA BẢO TOÀN NGUYÊN TỐ ============ */
/** Trả về { ok, diffs } — kiểm chứng kết quả cân bằng (dùng cho lớp tự kiểm tra của AI). */
export function checkBalance(result) {
  const tally = {};
  const add = (formula, coef, sign) => {
    let counts;
    try { counts = parseFormula(formula); } catch { return; }
    for (const el in counts) tally[el] = (tally[el] || 0) + sign * counts[el] * coef;
  };
  for (const t of result.left) add(t.formula, t.coef, 1);
  for (const t of result.right) add(t.formula, t.coef, -1);

  const diffs = Object.entries(tally).filter(([, v]) => v !== 0).map(([el, v]) => ({ element: el, diff: v }));
  return { ok: diffs.length === 0, diffs };
}
