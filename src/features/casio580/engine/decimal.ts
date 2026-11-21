import { MathError } from './errors';
import { Fraction } from './fraction';

/**
 * Số chữ số có nghĩa nội bộ của Casio fx-580VN X:
 * 15 chữ số tính toán bên trong + 5 chữ số bảo vệ (Guard digits) = 20 chữ số
 */
const INTERNAL_PRECISION = 20;

/**
 * Số chữ số có nghĩa hiển thị chuẩn: 10 chữ số
 */
const DISPLAY_PRECISION = 10;

/**
 * Lớp biểu diễn số thập phân độ chính xác cao (Arbitrary Precision Decimal)
 * Tái tạo kiến trúc tính toán BCD của Casio ClassWiz:
 * Giá trị = sign * mantissa * 10^(exponent)
 */
export class Decimal {
  public readonly sign: -1 | 0 | 1;
  public readonly mantissa: bigint; // Mantissa nguyên không dấu
  public readonly exponent: number; // Số mũ cơ số 10

  constructor(sign: -1 | 0 | 1, mantissa: bigint, exponent: number) {
    if (mantissa === 0n || sign === 0) {
      this.sign = 0;
      this.mantissa = 0n;
      this.exponent = 0;
      return;
    }

    // Bỏ các số 0 thừa ở cuối mantissa để chuẩn hóa
    let m = mantissa;
    let exp = exponent;
    while (m > 0n && m % 10n === 0n) {
      m /= 10n;
      exp++;
    }

    this.sign = sign;
    this.mantissa = m;
    this.exponent = exp;

    // Kiểm tra giới hạn phạm vi số học của Casio ClassWiz:
    // Dải biểu diễn: 1.0 × 10^-99 đến 9.999999999 × 10^99
    this.checkCasioLimits();
  }

  public static zero(): Decimal {
    return new Decimal(0, 0n, 0);
  }

  public static one(): Decimal {
    return new Decimal(1, 1n, 0);
  }

  /**
   * Khởi tạo từ chuỗi số (ví dụ: "123", "0.005", "3×10^8", "-2.5e-4")
   */
  public static fromString(raw: string): Decimal {
    const f = Fraction.fromNumberString(raw);
    return Decimal.fromFraction(f);
  }

  /**
   * Chuyển đổi chính xác từ phân số sang Decimal với 20 chữ số có nghĩa
   */
  public static fromFraction(f: Fraction, precision: number = INTERNAL_PRECISION): Decimal {
    if (f.num === 0n) {
      return Decimal.zero();
    }

    const sign: -1 | 1 = f.num < 0n ? -1 : 1;
    const absNum = f.num < 0n ? -f.num : f.num;
    const den = f.den;

    // Ước lượng số mũ: log10(absNum / den)
    const numDigits = absNum.toString().length;
    const denDigits = den.toString().length;
    let expEstimate = numDigits - denDigits;

    // Nhân với 10^precision để lấy đủ chữ số
    const targetScale = precision + 5;
    let scale = targetScale - expEstimate;
    let scaledNum = absNum;

    if (scale >= 0) {
      scaledNum = absNum * (10n ** BigInt(scale));
    } else {
      scaledNum = absNum / (10n ** BigInt(-scale));
    }

    let quotient = scaledNum / den;
    let exp = -scale;

    return new Decimal(sign, quotient, exp);
  }

  public static fromNumber(n: number): Decimal {
    if (n === 0 || !Number.isFinite(n)) {
      if (Number.isNaN(n) || !Number.isFinite(n)) {
        throw new MathError({ code: 'MATH_ERROR', message: 'Giá trị số không hợp lệ' });
      }
      return Decimal.zero();
    }
    return Decimal.fromString(n.toString());
  }

  public isZero(): boolean {
    return this.sign === 0;
  }

  public isNegative(): boolean {
    return this.sign === -1;
  }

  public neg(): Decimal {
    return new Decimal(this.sign === 0 ? 0 : (this.sign === 1 ? -1 : 1), this.mantissa, this.exponent);
  }

  public abs(): Decimal {
    return new Decimal(this.sign === 0 ? 0 : 1, this.mantissa, this.exponent);
  }

  /**
   * Phép cộng hai số Decimal
   */
  public add(other: Decimal): Decimal {
    if (this.isZero()) return other;
    if (other.isZero()) return this;

    // Đưa hai số về cùng số mũ nhỏ hơn
    const minExp = Math.min(this.exponent, other.exponent);
    const m1 = this.sign === 1 ? this.mantissa * (10n ** BigInt(this.exponent - minExp)) : -this.mantissa * (10n ** BigInt(this.exponent - minExp));
    const m2 = other.sign === 1 ? other.mantissa * (10n ** BigInt(other.exponent - minExp)) : -other.mantissa * (10n ** BigInt(other.exponent - minExp));

    const sum = m1 + m2;
    if (sum === 0n) return Decimal.zero();

    const sign: -1 | 1 = sum < 0n ? -1 : 1;
    const absSum = sum < 0n ? -sum : sum;

    return new Decimal(sign, absSum, minExp);
  }

  /**
   * Phép trừ hai số Decimal
   */
  public sub(other: Decimal): Decimal {
    return this.add(other.neg());
  }

  /**
   * Phép nhân hai số Decimal
   */
  public mul(other: Decimal): Decimal {
    if (this.isZero() || other.isZero()) return Decimal.zero();

    const sign: -1 | 1 = this.sign === other.sign ? 1 : -1;
    const mantissa = this.mantissa * other.mantissa;
    const exponent = this.exponent + other.exponent;

    return new Decimal(sign, mantissa, exponent);
  }

  /**
   * Phép chia hai số Decimal
   */
  public div(other: Decimal): Decimal {
    if (other.isZero()) {
      throw new MathError({
        code: 'DIVISION_BY_ZERO',
        message: 'Phép chia cho 0'
      });
    }
    if (this.isZero()) return Decimal.zero();

    // Scale tử số để giữ ít nhất 25 chữ số có nghĩa
    const scale = INTERNAL_PRECISION + 10;
    const scaledNum = this.mantissa * (10n ** BigInt(scale));
    const quotient = scaledNum / other.mantissa;
    const sign: -1 | 1 = this.sign === other.sign ? 1 : -1;
    const exponent = this.exponent - other.exponent - scale;

    return new Decimal(sign, quotient, exponent);
  }

  /**
   * Phép lũy thừa x^y
   */
  public pow(expDecimal: Decimal): Decimal {
    if (this.isZero()) {
      if (expDecimal.isZero()) {
        throw new MathError({
          code: 'INVALID_POWER',
          message: '0^0 không xác định trên máy tính Casio'
        });
      }
      if (expDecimal.isNegative()) {
        throw new MathError({
          code: 'DIVISION_BY_ZERO',
          message: '0 không thể có số mũ âm'
        });
      }
      return Decimal.zero();
    }

    if (expDecimal.isZero()) {
      return Decimal.one();
    }

    // Nếu số mũ là số nguyên
    if (expDecimal.isInteger()) {
      const expInt = Number(expDecimal.toBigInt());
      if (Math.abs(expInt) > 1000) {
        if (this.abs().toNumber() > 1) {
          throw new MathError({ code: 'OVERFLOW', message: 'Tràn số lũy thừa (|x| ≥ 10^100)' });
        } else {
          return Decimal.zero();
        }
      }

      if (expInt > 0) {
        let res = Decimal.one();
        let base: Decimal = this;
        let e = expInt;
        while (e > 0) {
          if (e % 2 === 1) res = res.mul(base);
          base = base.mul(base);
          e = Math.floor(e / 2);
        }
        return res;
      } else {
        const posPow = this.pow(expDecimal.neg());
        return Decimal.one().div(posPow);
      }
    }

    // Nếu cơ số âm và số mũ không nguyên -> Math ERROR ở Mode thực
    if (this.isNegative()) {
      throw new MathError({
        code: 'INVALID_POWER',
        message: 'Cơ số âm không thể nâng lên số mũ không nguyên trong tập số thực'
      });
    }

    // Tính lũy thừa số thực thông qua exp(y * ln(x))
    const xNum = this.toNumber();
    const yNum = expDecimal.toNumber();
    const resNum = Math.pow(xNum, yNum);

    if (!Number.isFinite(resNum) || isNaN(resNum)) {
      throw new MathError({ code: 'OVERFLOW', message: 'Lũy thừa vượt ngưỡng biểu diễn' });
    }

    return Decimal.fromNumber(resNum);
  }

  /**
   * Kiểm tra xem số này có phải là số nguyên hay không
   */
  public isInteger(): boolean {
    if (this.isZero()) return true;
    if (this.exponent >= 0) return true;
    // Nếu exponent < 0, kiểm tra xem mantissa có chia hết cho 10^(-exponent) không
    const div = 10n ** BigInt(-this.exponent);
    return this.mantissa % div === 0n;
  }

  public toBigInt(): bigint {
    if (this.isZero()) return 0n;
    if (this.exponent >= 0) {
      return (this.sign === 1 ? this.mantissa : -this.mantissa) * (10n ** BigInt(this.exponent));
    }
    const div = 10n ** BigInt(-this.exponent);
    const res = this.mantissa / div;
    return this.sign === 1 ? res : -res;
  }

  public toNumber(): number {
    if (this.isZero()) return 0;
    const str = (this.sign === -1 ? '-' : '') + this.mantissa.toString() + 'e' + this.exponent;
    return parseFloat(str);
  }

  public toDecimal(): Decimal {
    return this;
  }

  /**
   * Lấy số chữ số của phần nguyên khi viết dưới dạng khoa học: a × 10^b với 1 <= a < 10
   */
  public getOrderOfMagnitude(): number {
    if (this.isZero()) return 0;
    return this.mantissa.toString().length - 1 + this.exponent;
  }

  /**
   * Định dạng kết quả hiển thị chuẩn Casio ClassWiz fx-580VN X
   * - Norm 1 (Mặc định): Số mũ nếu |x| < 0.01 (10^-2) hoặc |x| >= 10^10
   * - Norm 2: Số mũ nếu |x| < 10^-9 hoặc |x| >= 10^10
   * - Fix: Cố định n chữ số thập phân
   * - Sci: Ký pháp khoa học n chữ số có nghĩa
   */
  public formatDisplay(mode: 'NORM1' | 'NORM2' | 'FIX' | 'SCI' = 'NORM1', digits?: number): string {
    if (this.isZero()) return '0';

    const order = this.getOrderOfMagnitude();

    // 1. Chế độ FIX: Cố định số chữ số sau dấu chấm
    if (mode === 'FIX') {
      const fixDigits = Math.max(0, Math.min(9, digits ?? 2));
      return this.toFixedString(fixDigits);
    }

    // 2. Chế độ SCI: Ký pháp khoa học với n chữ số có nghĩa
    if (mode === 'SCI') {
      const sciDigits = Math.max(1, Math.min(10, digits ?? DISPLAY_PRECISION));
      return this.toScientificString(sciDigits);
    }

    // 3. Chế độ Norm 1 và Norm 2
    const useSci =
      mode === 'NORM1'
        ? order < -2 || order >= 10 // < 0.01 hoặc >= 10^10
        : order < -9 || order >= 10; // < 10^-9 hoặc >= 10^10

    if (useSci) {
      return this.toScientificString(DISPLAY_PRECISION);
    } else {
      return this.toStandardDecimalString(DISPLAY_PRECISION);
    }
  }

  /**
   * Biểu diễn dạng ký pháp khoa học Casio: a × 10^b
   * Ví dụ: "1.23×10^4", "5×10^-3"
   */
  public toScientificString(maxSigDigits: number = DISPLAY_PRECISION): string {
    if (this.isZero()) return '0';

    const mStr = this.mantissa.toString();
    const order = mStr.length - 1 + this.exponent;

    // Lấy maxSigDigits chữ số đầu tiên và làm tròn half-up
    const rounded = this.roundMantissa(mStr, maxSigDigits);
    let digits = rounded.digits;
    let actualOrder = order + rounded.orderShift;

    // Đặt dấu chấm sau chữ số đầu tiên
    let mantissaFormatted = digits[0];
    const rest = digits.slice(1).replace(/0+$/, ''); // Bỏ số 0 vô nghĩa cuối
    if (rest.length > 0) {
      mantissaFormatted += '.' + rest;
    }

    const signStr = this.sign === -1 ? '-' : '';
    if (actualOrder === 0) {
      return `${signStr}${mantissaFormatted}`;
    }
    return `${signStr}${mantissaFormatted}×10^${actualOrder}`;
  }

  /**
   * Biểu diễn dạng số thập phân thông thường tối đa maxDigits chữ số
   */
  public toStandardDecimalString(maxSigDigits: number = DISPLAY_PRECISION): string {
    if (this.isZero()) return '0';

    const order = this.getOrderOfMagnitude();
    const mStr = this.mantissa.toString();

    // Làm tròn số chữ số có nghĩa
    const rounded = this.roundMantissa(mStr, maxSigDigits);
    const digits = rounded.digits;
    const actualOrder = order + rounded.orderShift;

    const signStr = this.sign === -1 ? '-' : '';

    if (actualOrder >= 0) {
      const wholeLen = actualOrder + 1;
      if (digits.length <= wholeLen) {
        // Số nguyên hoàn toàn
        return signStr + digits + '0'.repeat(wholeLen - digits.length);
      } else {
        const whole = digits.slice(0, wholeLen);
        const frac = digits.slice(wholeLen).replace(/0+$/, '');
        return frac.length > 0 ? `${signStr}${whole}.${frac}` : `${signStr}${whole}`;
      }
    } else {
      // actualOrder < 0: số dạng 0.00...
      const leadingZeros = -actualOrder - 1;
      const frac = ('0'.repeat(leadingZeros) + digits).replace(/0+$/, '');
      return frac.length > 0 ? `${signStr}0.${frac}` : `${signStr}0`;
    }
  }

  /**
   * Định dạng cố định n chữ số sau dấu chấm
   */
  public toFixedString(fixDigits: number): string {
    if (this.isZero()) {
      return fixDigits > 0 ? '0.' + '0'.repeat(fixDigits) : '0';
    }

    // Scale mantissa để vị trí chữ số thập phân nằm ở fixDigits
    const scale = fixDigits + this.exponent;
    let scaled: bigint;
    if (scale >= 0) {
      scaled = this.mantissa * (10n ** BigInt(scale));
    } else {
      // Làm tròn
      const div = 10n ** BigInt(-scale);
      const rem = this.mantissa % div;
      const half = div / 2n;
      scaled = this.mantissa / div;
      if (rem >= half) scaled++;
    }

    const s = scaled.toString();
    const signStr = this.sign === -1 ? '-' : '';

    if (fixDigits === 0) {
      return signStr + (s || '0');
    }

    if (s.length <= fixDigits) {
      const padded = '0'.repeat(fixDigits - s.length + 1) + s;
      return `${signStr}${padded.slice(0, padded.length - fixDigits)}.${padded.slice(padded.length - fixDigits)}`;
    } else {
      return `${signStr}${s.slice(0, s.length - fixDigits)}.${s.slice(s.length - fixDigits)}`;
    }
  }

  /**
   * Thuật toán làm tròn nửa lên (Half-up Rounding) cho chuỗi chữ số mantissa
   */
  private roundMantissa(digits: string, targetLen: number): { digits: string; orderShift: number } {
    if (digits.length <= targetLen) {
      return { digits, orderShift: 0 };
    }

    const main = digits.slice(0, targetLen);
    const nextDigit = parseInt(digits[targetLen], 10);

    if (nextDigit >= 5) {
      const incremented = (BigInt(main) + 1n).toString();
      if (incremented.length > main.length) {
        // Tràn số hàng chục (ví dụ 999 -> 1000)
        return { digits: incremented.slice(0, targetLen), orderShift: 1 };
      }
      return { digits: incremented, orderShift: 0 };
    }

    return { digits: main, orderShift: 0 };
  }

  /**
   * Kiểm tra giới hạn máy tính Casio ClassWiz:
   * Overflow nếu |x| >= 10^100
   * Underflow nếu 0 < |x| < 10^-99
   */
  private checkCasioLimits(): void {
    const order = this.getOrderOfMagnitude();
    if (order >= 100) {
      throw new MathError({
        code: 'OVERFLOW',
        message: 'Tràn số: kết quả vượt quá giới hạn 10^100 của Casio fx-580VN X'
      });
    }

    if (order < -99) {
      // Underflow: tự động đưa về 0 theo quy chuẩn Casio
      (this as any).sign = 0;
      (this as any).mantissa = 0n;
      (this as any).exponent = 0;
    }
  }
}
