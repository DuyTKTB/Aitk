import { Decimal } from '../../engine/decimal';
import { Fraction } from '../../engine/fraction';
import { CalculationResult } from '../../engine/result';
import { MathError } from '../../engine/errors';
import { PolynomialResult, PolynomialRoot, ExtremumPoint } from './types';

export type PolyCoeff = number | bigint | string | Fraction;

function toNum(c: PolyCoeff): number {
  if (c instanceof Fraction) return c.toDecimalString(15).includes('.') ? parseFloat(c.toDecimalString(15)) : Number(c.num) / Number(c.den);
  if (typeof c === 'bigint') return Number(c);
  if (typeof c === 'number') return c;
  return parseFloat(c.trim());
}

function toCalcResult(val: number): CalculationResult {
  if (Math.abs(val) < 1e-13) {
    return CalculationResult.zero();
  }
  return CalculationResult.fromDecimal(Decimal.fromNumber(val), true);
}

function formatComplexRoot(realVal: number, imagVal: number): string {
  const rStr = toCalcResult(realVal).getDisplayText();
  const absI = Math.abs(imagVal);
  const iStr = toCalcResult(absI).getDisplayText();
  const iPart = iStr === '1' ? 'i' : `${iStr}i`;

  if (Math.abs(realVal) < 1e-13) {
    return imagVal < 0 ? `-${iPart}` : iPart;
  }
  return imagVal < 0 ? `${rStr}-${iPart}` : `${rStr}+${iPart}`;
}

function makeRealRoot(val: number): PolynomialRoot {
  const cleanVal = Math.abs(val) < 1e-13 ? 0 : val;
  const res = toCalcResult(cleanVal);
  return {
    real: res,
    isReal: true,
    isComplex: false,
    displayText: res.getDisplayText()
  };
}

function makeComplexRoot(realVal: number, imagVal: number): PolynomialRoot {
  const cleanRe = Math.abs(realVal) < 1e-13 ? 0 : realVal;
  const cleanIm = Math.abs(imagVal) < 1e-13 ? 0 : imagVal;
  return {
    real: toCalcResult(cleanRe),
    imag: toCalcResult(cleanIm),
    isReal: false,
    isComplex: true,
    displayText: formatComplexRoot(cleanRe, cleanIm)
  };
}

/**
 * Thuật toán tính căn bậc ba có dấu (Cube root preserving sign)
 */
function cbrt(x: number): number {
  return x < 0 ? -Math.cbrt(-x) : Math.cbrt(x);
}

/**
 * Giải phương trình bậc 2: ax² + bx + c = 0 (a ≠ 0)
 * Tính 2 nghiệm (thực hoặc phức) và điểm cực trị của parabol (Min/Max)
 */
export function solveQuadratic(
  aIn: PolyCoeff,
  bIn: PolyCoeff,
  cIn: PolyCoeff
): PolynomialResult {
  const a = toNum(aIn);
  const b = toNum(bIn);
  const c = toNum(cIn);

  if (Math.abs(a) < 1e-15) {
    throw new MathError({
      code: 'MATH_ERROR',
      message: 'Hệ số a của phương trình bậc 2 phải khác 0'
    });
  }

  const delta = b * b - 4 * a * c;
  const roots: PolynomialRoot[] = [];

  if (delta > 1e-14) {
    // 2 nghiệm thực phân biệt
    const sqrtD = Math.sqrt(delta);
    const x1 = (-b + sqrtD) / (2 * a);
    const x2 = (-b - sqrtD) / (2 * a);

    roots.push(makeRealRoot(x1));
    roots.push(makeRealRoot(x2));
  } else if (Math.abs(delta) <= 1e-14) {
    // Nghiệm kép (trả về 2 nghiệm theo chuẩn đa thức bậc 2)
    const x = -b / (2 * a);
    roots.push(makeRealRoot(x));
    roots.push(makeRealRoot(x));
  } else {
    // 2 nghiệm phức liên hợp: u ± vi
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-delta) / Math.abs(2 * a);

    roots.push(makeComplexRoot(realPart, imagPart));
    roots.push(makeComplexRoot(realPart, -imagPart));
  }

  // Điểm cực trị của Parabol (Vertex)
  const xv = -b / (2 * a);
  const yv = c - (b * b) / (4 * a);
  const extType = a > 0 ? 'MINIMUM' : 'MAXIMUM';
  const extrema: ExtremumPoint[] = [
    {
      type: extType,
      x: toCalcResult(xv),
      y: toCalcResult(yv),
      label: extType === 'MINIMUM' ? 'Min of y' : 'Max of y',
      labelX: extType === 'MINIMUM' ? 'x-Value of Min' : 'x-Value of Max',
      labelY: extType === 'MINIMUM' ? 'Min of y' : 'Max of y'
    }
  ];

  return {
    degree: 2,
    roots,
    extrema
  };
}

/**
 * Giải phương trình bậc 3: ax³ + bx² + cx + d = 0 (a ≠ 0)
 * Bằng phương pháp lượng giác Viète và đại số Cardano
 * Kèm điểm cực đại và cực tiểu nếu có
 */
export function solveCubic(
  aIn: PolyCoeff,
  bIn: PolyCoeff,
  cIn: PolyCoeff,
  dIn: PolyCoeff
): PolynomialResult {
  const a = toNum(aIn);
  const b = toNum(bIn);
  const c = toNum(cIn);
  const d = toNum(dIn);

  if (Math.abs(a) < 1e-15) {
    throw new MathError({
      code: 'MATH_ERROR',
      message: 'Hệ số a của phương trình bậc 3 phải khác 0'
    });
  }

  // Đưa về phương trình bậc 3 thu gọn: t³ + pt + q = 0 với x = t - b/(3a)
  const p = (3 * a * c - b * b) / (3 * a * a);
  const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
  const delta = (q * q) / 4 + (p * p * p) / 27;

  const roots: PolynomialRoot[] = [];
  const shift = -b / (3 * a);

  if (delta < -1e-14) {
    // 3 nghiệm thực phân biệt (Viète Trigonometric Method)
    const m = 2 * Math.sqrt(-p / 3);
    const argVal = Math.max(-1, Math.min(1, (3 * q) / (2 * p * Math.sqrt(-p / 3))));
    const theta = Math.acos(argVal) / 3;

    const rawRoots = [
      m * Math.cos(theta) + shift,
      m * Math.cos(theta - (2 * Math.PI) / 3) + shift,
      m * Math.cos(theta - (4 * Math.PI) / 3) + shift
    ].sort((x, y) => y - x); // Sắp xếp giảm dần như Casio

    for (const r of rawRoots) {
      roots.push(makeRealRoot(r));
    }
  } else if (Math.abs(delta) <= 1e-14) {
    // Nghiệm bội
    const u = cbrt(-q / 2);
    const r1 = 2 * u + shift;
    const r2 = -u + shift;

    if (Math.abs(r1 - r2) < 1e-10) {
      // Nghiệm bội 3
      roots.push(makeRealRoot(r1));
      roots.push(makeRealRoot(r1));
      roots.push(makeRealRoot(r1));
    } else {
      // 1 nghiệm đơn r1 và 1 nghiệm kép r2
      const allR = [r1, r2, r2].sort((x, y) => y - x);
      for (const r of allR) {
        roots.push(makeRealRoot(r));
      }
    }
  } else {
    // 1 nghiệm thực và 2 nghiệm phức liên hợp (Cardano Method)
    const sqrtDelta = Math.sqrt(delta);
    const u = cbrt(-q / 2 + sqrtDelta);
    const v = cbrt(-q / 2 - sqrtDelta);

    const realRoot = u + v + shift;
    roots.push(makeRealRoot(realRoot));

    const realPart = -(u + v) / 2 + shift;
    const imagPart = ((u - v) * Math.sqrt(3)) / 2;

    roots.push(makeComplexRoot(realPart, Math.abs(imagPart)));
    roots.push(makeComplexRoot(realPart, -Math.abs(imagPart)));
  }

  // Điểm cực trị hàm bậc 3: y' = 3ax² + 2bx + c = 0
  const extrema: ExtremumPoint[] = [];
  const deltaPrime = 4 * (b * b - 3 * a * c);

  if (deltaPrime > 1e-14) {
    const sqrtDPrime = Math.sqrt(deltaPrime);
    const x1 = (-2 * b + sqrtDPrime) / (6 * a);
    const x2 = (-2 * b - sqrtDPrime) / (6 * a);

    const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
    const y1 = f(x1);
    const y2 = f(x2);

    // Đạo hàm cấp 2: y'' = 6ax + 2b
    const d2_1 = 6 * a * x1 + 2 * b;
    const type1 = d2_1 < 0 ? 'MAXIMUM' : 'MINIMUM';
    const type2 = d2_1 < 0 ? 'MINIMUM' : 'MAXIMUM';

    extrema.push({
      type: type1,
      x: toCalcResult(x1),
      y: toCalcResult(y1),
      label: type1 === 'MAXIMUM' ? 'Max of y' : 'Min of y',
      labelX: type1 === 'MAXIMUM' ? 'x-Value of Max' : 'x-Value of Min',
      labelY: type1 === 'MAXIMUM' ? 'Local Max of y' : 'Local Min of y'
    });
    extrema.push({
      type: type2,
      x: toCalcResult(x2),
      y: toCalcResult(y2),
      label: type2 === 'MAXIMUM' ? 'Max of y' : 'Min of y',
      labelX: type2 === 'MAXIMUM' ? 'x-Value of Max' : 'x-Value of Min',
      labelY: type2 === 'MAXIMUM' ? 'Local Max of y' : 'Local Min of y'
    });
  }

  return {
    degree: 3,
    roots,
    extrema: extrema.length > 0 ? extrema : undefined
  };
}

/**
 * Giải phương trình bậc 4: ax⁴ + bx³ + cx² + dx + e = 0 (a ≠ 0)
 * Bằng phương pháp Ferrari phân rã thành tích 2 đa thức bậc 2
 */
export function solveQuartic(
  aIn: PolyCoeff,
  bIn: PolyCoeff,
  cIn: PolyCoeff,
  dIn: PolyCoeff,
  eIn: PolyCoeff
): PolynomialResult {
  const a = toNum(aIn);
  const b = toNum(bIn);
  const c = toNum(cIn);
  const d = toNum(dIn);
  const e = toNum(eIn);

  if (Math.abs(a) < 1e-15) {
    throw new MathError({
      code: 'MATH_ERROR',
      message: 'Hệ số a của phương trình bậc 4 phải khác 0'
    });
  }

  // Đưa về dạng monic: x⁴ + A x³ + B x² + C x + D = 0
  const A = b / a;
  const B = c / a;
  const C = d / a;
  const D = e / a;

  // Dạng rút gọn: t⁴ + p t² + q t + r = 0 với x = t - A/4
  const p = B - (3 * A * A) / 8;
  const q = C - (A * B) / 2 + (A * A * A) / 8;
  const r = D - (A * C) / 4 + (A * A * B) / 16 - (3 * A * A * A * A) / 256;
  const shift = -A / 4;

  const allRoots: PolynomialRoot[] = [];

  if (Math.abs(q) < 1e-12) {
    // Phương trình trùng phương: t⁴ + p t² + r = 0 -> u² + p u + r = 0
    const quad = solveQuadratic(1, p, r);
    for (const uRoot of quad.roots) {
      if (!uRoot.isComplex) {
        const uVal = uRoot.real.decimal.toNumber();
        if (uVal >= 0) {
          const s = Math.sqrt(uVal);
          allRoots.push(makeRealRoot(s + shift));
          allRoots.push(makeRealRoot(-s + shift));
        } else {
          const s = Math.sqrt(-uVal);
          allRoots.push(makeComplexRoot(shift, s));
          allRoots.push(makeComplexRoot(shift, -s));
        }
      } else {
        // Căn bậc hai của số phức
        const uRe = uRoot.real.decimal.toNumber();
        const uIm = uRoot.imag!.decimal.toNumber();
        const mod = Math.sqrt(uRe * uRe + uIm * uIm);
        const rePart = Math.sqrt((mod + uRe) / 2);
        const imPart = (uIm >= 0 ? 1 : -1) * Math.sqrt((mod - uRe) / 2);

        allRoots.push(makeComplexRoot(rePart + shift, imPart));
        allRoots.push(makeComplexRoot(-rePart + shift, -imPart));
      }
    }
  } else {
    // Phương pháp Ferrari: Resolvent cubic: 8 m³ + 8 p m² + (2 p² - 8 r) m - q² = 0
    const cubicRes = solveCubic(8, 8 * p, 2 * p * p - 8 * r, -q * q);
    // Chọn nghiệm thực dương m > 0
    let m = 0;
    for (const cr of cubicRes.roots) {
      if (!cr.isComplex && cr.real.decimal.toNumber() > 0) {
        m = cr.real.decimal.toNumber();
        break;
      }
    }
    if (m <= 0) {
      // Fallback lấy nghiệm thực lớn nhất
      for (const cr of cubicRes.roots) {
        if (!cr.isComplex) {
          m = Math.max(m, cr.real.decimal.toNumber());
        }
      }
    }

    const sqrt2m = Math.sqrt(Math.max(0, 2 * m));
    const term1 = p / 2 + m;
    const term2 = q / (2 * sqrt2m);

    // Hai phương trình bậc 2:
    // t² + sqrt(2m) t + (term1 - term2) = 0
    // t² - sqrt(2m) t + (term1 + term2) = 0
    const quad1 = solveQuadratic(1, sqrt2m, term1 - term2);
    const quad2 = solveQuadratic(1, -sqrt2m, term1 + term2);

    for (const r1 of quad1.roots) {
      if (!r1.isComplex) {
        const val = r1.real.decimal.toNumber() + shift;
        allRoots.push(makeRealRoot(val));
      } else {
        const re = r1.real.decimal.toNumber() + shift;
        const im = r1.imag!.decimal.toNumber();
        allRoots.push(makeComplexRoot(re, im));
      }
    }

    for (const r2 of quad2.roots) {
      if (!r2.isComplex) {
        const val = r2.real.decimal.toNumber() + shift;
        allRoots.push(makeRealRoot(val));
      } else {
        const re = r2.real.decimal.toNumber() + shift;
        const im = r2.imag!.decimal.toNumber();
        allRoots.push(makeComplexRoot(re, im));
      }
    }
  }

  // Loại bỏ các nghiệm thừa nếu trùng phương tính 2 lần (chỉ lấy 4 nghiệm đầu)
  return {
    degree: 4,
    roots: allRoots.slice(0, 4)
  };
}

/**
 * Hàm điều phối giải phương trình đa thức bậc 2, 3, 4
 */
export function solvePolynomial(
  degreeOrCoeffs: 2 | 3 | 4 | PolyCoeff[],
  maybeCoeffs?: PolyCoeff[]
): PolynomialResult {
  let degree: 2 | 3 | 4;
  let coeffs: PolyCoeff[];

  if (typeof degreeOrCoeffs === 'number') {
    degree = degreeOrCoeffs;
    if (degree !== 2 && degree !== 3 && degree !== 4) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Bậc đa thức ${degree} không được hỗ trợ (chỉ hỗ trợ bậc 2, 3, 4)`
      });
    }
    coeffs = maybeCoeffs as PolyCoeff[];
    if (!coeffs || coeffs.length !== degree + 1) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Đa thức bậc ${degree} yêu cầu ${degree + 1} hệ số`
      });
    }
  } else {
    coeffs = degreeOrCoeffs;
    const deg = coeffs.length - 1;
    if (deg !== 2 && deg !== 3 && deg !== 4) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Bậc đa thức ${deg} không được hỗ trợ (chỉ hỗ trợ bậc 2, 3, 4)`
      });
    }
    degree = deg as 2 | 3 | 4;
  }

  if (degree === 2) {
    return solveQuadratic(coeffs[0], coeffs[1], coeffs[2]);
  } else if (degree === 3) {
    return solveCubic(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);
  } else {
    return solveQuartic(coeffs[0], coeffs[1], coeffs[2], coeffs[3], coeffs[4]);
  }
}
