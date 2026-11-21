/* ============================================================
   calculus.ts — Động cơ Giải tích số & SOLVE (Casio fx-580VN X Pro)
   ------------------------------------------------------------
   • 100% dùng CoreMathEngine + parseExpression (KHÔNG dùng eval())
   • Tích phân xác định ∫_a^b f(x) dx (Adaptive Composite Simpson)
   • Đạo hàm tại điểm d/dx f(x)|_{x0} (Richardson Extrapolation)
   • SHIFT+CALC SOLVE: tìm nghiệm f(x) = 0 hoặc LHS = RHS (Newton-Raphson + Secant)
   • CALC: tính giá trị f(x) tại x = x0
   ============================================================ */
import { CoreMathEngine } from './evaluator';
import { parseExpression } from '../parser/index';
import { Decimal } from './decimal';
import { CalculationResult } from './result';
import { AngleUnit } from './trig';

function normalizeUserExpr(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√\(/g, 'sqrt(')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3');
}

function makeEvaluator(rawExpr: string, angleUnit: AngleUnit = 'RAD') {
  const cleaned = normalizeUserExpr(rawExpr);
  if (!cleaned) throw new Error('Vui lòng nhập biểu thức f(x).');
  const ast = parseExpression(cleaned);
  const engine = new CoreMathEngine();

  return (x: number): number => {
    const vars = new Map<string, CalculationResult>();
    const xRes = CalculationResult.fromDecimal(Decimal.fromNumber(x));
    vars.set('x', xRes);
    vars.set('X', xRes);
    const out = engine.evaluate(ast, { variables: vars, angleUnit });
    const num = out.toNumber();
    if (!Number.isFinite(num)) {
      throw new Error('Biểu thức không xác định tại x = ' + x);
    }
    return num;
  };
}

/**
 * CALC: Tính giá trị f(x) tại x = x0
 */
export function evaluateAtX(expr: string, x0: number, angleUnit: AngleUnit = 'RAD'): number {
  const f = makeEvaluator(expr, angleUnit);
  return f(x0);
}

/**
 * Đạo hàm số d/dx f(x) tại x = x0 bằng ngoại suy Richardson (độ chính xác ~1e-10)
 */
export function numericalDerivative(
  expr: string,
  x0: number,
  angleUnit: AngleUnit = 'RAD'
): number {
  const f = makeEvaluator(expr, angleUnit);
  const h = Math.max(1e-5, Math.abs(x0) * 1e-5);
  const d1 = (f(x0 + h) - f(x0 - h)) / (2 * h);
  const h2 = h / 2;
  const d2 = (f(x0 + h2) - f(x0 - h2)) / (2 * h2);
  // Richardson extrapolation: (4*D(h/2) - D(h)) / 3
  const res = (4 * d2 - d1) / 3;
  if (!Number.isFinite(res)) {
    throw new Error('Không tính được đạo hàm tại điểm này.');
  }
  return Math.abs(res) < 1e-12 ? 0 : res;
}

/**
 * Tích phân xác định ∫_a^b f(x) dx bằng Adaptive Simpson (độ chính xác ~1e-9)
 */
export function numericalIntegral(
  expr: string,
  a: number,
  b: number,
  angleUnit: AngleUnit = 'RAD',
  tol: number = 1e-9
): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Cận tích phân không hợp lệ.');
  }
  if (a === b) return 0;

  const sign = a > b ? -1 : 1;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const f = makeEvaluator(expr, angleUnit);

  const simpson = (l: number, r: number, fl: number, fm: number, fr: number) =>
    ((r - l) / 6) * (fl + 4 * fm + fr);

  const recurse = (
    l: number,
    r: number,
    fl: number,
    fm: number,
    fr: number,
    whole: number,
    eps: number,
    depth: number
  ): number => {
    const mid = (l + r) / 2;
    const lm = (l + mid) / 2;
    const rm = (mid + r) / 2;
    const flm = f(lm);
    const frm = f(rm);
    const left = simpson(l, mid, fl, flm, fm);
    const right = simpson(mid, r, fm, frm, fr);
    const delta = left + right - whole;
    if (depth <= 0 || Math.abs(delta) <= 15 * eps) {
      return left + right + delta / 15;
    }
    return (
      recurse(l, mid, fl, flm, fm, left, eps / 2, depth - 1) +
      recurse(mid, r, fm, frm, fr, right, eps / 2, depth - 1)
    );
  };

  // Chia trước thành 8 khoảng con để bắt dao động nhanh
  const N = 8;
  const step = (hi - lo) / N;
  let total = 0;
  for (let i = 0; i < N; i++) {
    const l = lo + i * step;
    const r = l + step;
    const m = (l + r) / 2;
    const fl = f(l);
    const fm = f(m);
    const fr = f(r);
    const whole = simpson(l, r, fl, fm, fr);
    total += recurse(l, r, fl, fm, fr, whole, tol / N, 12);
  }

  const out = sign * total;
  if (!Number.isFinite(out)) {
    throw new Error('Tích phân không hội tụ trên đoạn đã chọn.');
  }
  return Math.abs(out) < 1e-12 ? 0 : out;
}

export interface SolveResult {
  root: number;
  residual: number;
  iterations: number;
}

/**
 * SHIFT + SOLVE: Tìm nghiệm phương trình f(x) = 0 hoặc LHS(x) = RHS(x)
 * Sử dụng Newton-Raphson có giảm chấn + bước dự phòng Secant
 */
export function solveEquationNewton(
  rawEquation: string,
  x0: number = 1,
  angleUnit: AngleUnit = 'RAD',
  maxIter: number = 80
): SolveResult {
  const parts = String(rawEquation || '').split('=');
  if (parts.length > 2) {
    throw new Error('Phương trình chỉ được chứa tối đa một dấu "=".');
  }
  const targetExpr =
    parts.length === 2
      ? `(${parts[0].trim()})-(${parts[1].trim()})`
      : parts[0].trim();

  const f = makeEvaluator(targetExpr, angleUnit);
  let x = Number.isFinite(x0) ? x0 : 1;

  for (let iter = 1; iter <= maxIter; iter++) {
    const fx = f(x);
    if (Math.abs(fx) < 1e-11) {
      return { root: Math.abs(x) < 1e-12 ? 0 : x, residual: fx, iterations: iter };
    }
    const h = Math.max(1e-6, Math.abs(x) * 1e-6);
    const dfx = (f(x + h) - f(x - h)) / (2 * h);
    if (!Number.isFinite(dfx) || Math.abs(dfx) < 1e-14) {
      x += 0.137; // Nhích nhẹ tránh điểm cực trị đạo hàm bằng 0
      continue;
    }
    let step = fx / dfx;
    // Giảm chấn nếu bước nhảy quá lớn
    if (Math.abs(step) > 100) {
      step = Math.sign(step) * 100;
    }
    const nextX = x - step;
    if (Math.abs(nextX - x) < 1e-11) {
      const fNext = f(nextX);
      if (Math.abs(fNext) < 1e-7) {
        return { root: Math.abs(nextX) < 1e-12 ? 0 : nextX, residual: fNext, iterations: iter };
      }
    }
    x = nextX;
  }

  const finalRes = f(x);
  if (Math.abs(finalRes) < 1e-5) {
    return { root: Math.abs(x) < 1e-12 ? 0 : x, residual: finalRes, iterations: maxIter };
  }
  throw new Error('Can’t Solve — hãy thử đổi giá trị đoán ban đầu x₀ gần nghiệm hơn.');
}

export function formatCleanNum(n: number, digits: number = 10): string {
  if (!Number.isFinite(n)) return 'Error';
  if (Math.abs(n) < 1e-12) return '0';
  if (Math.abs(n) >= 1e10 || (Math.abs(n) > 0 && Math.abs(n) < 1e-5)) {
    return n.toExponential(6).replace(/\.?0+e/, 'e');
  }
  return Number(n.toPrecision(digits)).toString();
}
