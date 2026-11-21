import { Decimal } from './decimal';
import { CalculationResult } from './result';
import { MathError } from './errors';

/**
 * Đơn vị góc: Degree (Độ), Radian, Gradian
 */
export type AngleUnit = 'DEG' | 'RAD' | 'GRA';

/**
 * Chuyển đổi giá trị góc sang radian để tính toán
 */
function toRad(value: number, unit: AngleUnit): number {
  if (unit === 'DEG') return value * Math.PI / 180;
  if (unit === 'GRA') return value * Math.PI / 200;
  return value; // RAD
}

/**
 * Chuyển đổi kết quả radian sang đơn vị góc đang dùng
 */
function fromRad(rad: number, unit: AngleUnit): number {
  if (unit === 'DEG') return rad * 180 / Math.PI;
  if (unit === 'GRA') return rad * 200 / Math.PI;
  return rad; // RAD
}

/**
 * Làm sạch kết quả cực gần 0 (lỗi floating point)
 * Tuân thủ quy tắc Casio: nếu |x| < 1e-14 thì gán về 0
 */
function cleanNearZero(value: number): number {
  if (Math.abs(value) < 1e-14) return 0;
  return value;
}

/**
 * Kiểm tra xem góc (theo đơn vị) có phải là bội số lẻ của 90° (π/2) không
 * Dùng để phát hiện tan(90°), tan(270°), v.v. → Math ERROR
 */
function isTanUndefined(value: number, unit: AngleUnit): boolean {
  let degEquiv: number;
  if (unit === 'DEG') {
    degEquiv = value;
  } else if (unit === 'GRA') {
    degEquiv = value * 0.9; // GRA * 0.9 = DEG
  } else {
    // RAD: kiểm tra xem có gần π/2 + k*π không
    // cos(x) ≈ 0 khi x = π/2 + k*π
    const cosVal = Math.cos(value);
    return Math.abs(cosVal) < 1e-14;
  }
  // Chuẩn hóa về [0, 360)
  const normalized = ((degEquiv % 360) + 360) % 360;
  // tan không xác định tại 90° và 270°
  return Math.abs(normalized - 90) < 1e-10 || Math.abs(normalized - 270) < 1e-10;
}

/**
 * Chuyển đổi Độ-Phút-Giây sang số thập phân độ
 * Quy tắc: D + M/60 + S/3600
 *
 * TODO: Chưa có cú pháp `D°M'S"` trong Lexer/Parser.
 * Hàm này được export để dùng sau khi Lexer hỗ trợ token phút/giây.
 */
export function dmsToDecimalDegrees(d: number, m: number, s: number): number {
  return d + m / 60 + s / 3600;
}

/**
 * Tính toán các hàm lượng giác và nghịch đảo
 * Tuân thủ chuẩn Casio fx-580VN X
 *
 * @param fnName Tên hàm: 'sin', 'cos', 'tan', 'sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'arcsin', 'arccos', 'arctan'
 * @param args Danh sách đối số đã tính toán
 * @param angleUnit Đơn vị góc hiện tại
 */
export function evalTrig(
  fnName: string,
  args: CalculationResult[],
  angleUnit: AngleUnit
): CalculationResult {
  if (args.length !== 1) {
    throw new MathError({
      code: 'MATH_ERROR',
      message: `Hàm ${fnName} nhận đúng 1 đối số`
    });
  }

  const x = args[0].decimal.toNumber();

  switch (fnName) {
    case 'sin': {
      const rad = toRad(x, angleUnit);
      const result = cleanNearZero(Math.sin(rad));
      return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
    }

    case 'cos': {
      const rad = toRad(x, angleUnit);
      const result = cleanNearZero(Math.cos(rad));
      return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
    }

    case 'tan': {
      if (isTanUndefined(x, angleUnit)) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'tan không xác định tại góc 90° + k×180° (hoặc tương đương)'
        });
      }
      const rad = toRad(x, angleUnit);
      const result = cleanNearZero(Math.tan(rad));
      return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
    }

    case 'sin⁻¹':
    case 'arcsin': {
      if (x < -1 || x > 1) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'arcsin(x) yêu cầu -1 ≤ x ≤ 1'
        });
      }
      const radResult = Math.asin(x);
      const result = fromRad(radResult, angleUnit);
      return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
    }

    case 'cos⁻¹':
    case 'arccos': {
      if (x < -1 || x > 1) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'arccos(x) yêu cầu -1 ≤ x ≤ 1'
        });
      }
      const radResult = Math.acos(x);
      const result = fromRad(radResult, angleUnit);
      return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
    }

    case 'tan⁻¹':
    case 'arctan': {
      const radResult = Math.atan(x);
      const result = fromRad(radResult, angleUnit);
      return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
    }

    default:
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Hàm lượng giác không được hỗ trợ: ${fnName}`
      });
  }
}
