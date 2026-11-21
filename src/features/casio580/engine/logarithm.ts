import { Decimal } from './decimal';
import { CalculationResult } from './result';
import { MathError } from './errors';

/**
 * Tính toán các hàm logarit và số mũ tự nhiên
 * Tuân thủ chuẩn Casio fx-580VN X (FEAT-MTH-05)
 *
 * @param fnName Tên hàm: 'ln', 'log', 'e^'
 * @param args Danh sách đối số đã tính toán
 */
export function evalLogarithm(
  fnName: string,
  args: CalculationResult[]
): CalculationResult {
  switch (fnName) {
    // ln(x) - logarit tự nhiên, miền x > 0
    case 'ln': {
      if (args.length !== 1) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'Hàm ln nhận đúng 1 đối số'
        });
      }
      const x = args[0].decimal.toNumber();
      if (x <= 0) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'ln(x) yêu cầu x > 0'
        });
      }
      const result = Math.log(x);
      return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
    }

    // log(x) - log cơ số 10, hoặc log(a, b) - log cơ số a của b
    case 'log': {
      if (args.length === 1) {
        // log cơ số 10
        const x = args[0].decimal.toNumber();
        if (x <= 0) {
          throw new MathError({
            code: 'MATH_ERROR',
            message: 'log(x) yêu cầu x > 0'
          });
        }
        const result = Math.log10(x);
        return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
      }

      if (args.length === 2) {
        // log(a, b) = ln(b) / ln(a)
        const a = args[0].decimal.toNumber(); // cơ số
        const b = args[1].decimal.toNumber(); // đối số

        if (a <= 0) {
          throw new MathError({
            code: 'MATH_ERROR',
            message: 'log(a, b) yêu cầu cơ số a > 0'
          });
        }
        if (Math.abs(a - 1) < 1e-15) {
          throw new MathError({
            code: 'MATH_ERROR',
            message: 'log(a, b) với cơ số a = 1 không xác định'
          });
        }
        if (b <= 0) {
          throw new MathError({
            code: 'MATH_ERROR',
            message: 'log(a, b) yêu cầu đối số b > 0'
          });
        }

        const result = Math.log(b) / Math.log(a);
        return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
      }

      throw new MathError({
        code: 'MATH_ERROR',
        message: 'Hàm log nhận 1 hoặc 2 đối số: log(x) hoặc log(cơ số, đối số)'
      });
    }

    // e^(x) - hàm mũ tự nhiên
    case 'e^': {
      if (args.length !== 1) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'Hàm e^ nhận đúng 1 đối số'
        });
      }
      const x = args[0].decimal.toNumber();
      const result = Math.exp(x);
      if (!Number.isFinite(result)) {
        throw new MathError({
          code: 'OVERFLOW',
          message: 'e^x vượt ngưỡng biểu diễn'
        });
      }
      return CalculationResult.fromDecimal(Decimal.fromNumber(result), true);
    }

    default:
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Hàm logarit không được hỗ trợ: ${fnName}`
      });
  }
}
