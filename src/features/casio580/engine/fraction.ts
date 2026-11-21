import { MathError } from './errors';
import { Decimal } from './decimal';

/**
 * Tìm ước chung lớn nhất (Greatest Common Divisor - GCD) của 2 số nguyên BigInt
 */
export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Cấu trúc phân số chính xác tuyệt đối (Exact Fraction)
 * Sử dụng BigInt bản địa của JavaScript để tránh sai số dấu chấm động
 */
export class Fraction {
  public readonly num: bigint; // Tử số (có dấu)
  public readonly den: bigint; // Mẫu số (luôn dương, tối giản với num)

  constructor(numerator: bigint, denominator: bigint = 1n) {
    if (denominator === 0n) {
      throw new MathError({
        code: 'DIVISION_BY_ZERO',
        message: 'Mẫu số của phân số không thể bằng 0'
      });
    }

    if (numerator === 0n) {
      this.num = 0n;
      this.den = 1n;
      return;
    }

    // Đảm bảo mẫu số luôn dương
    let n = denominator < 0n ? -numerator : numerator;
    let d = denominator < 0n ? -denominator : denominator;

    // Tối giản phân số bằng ước số chung lớn nhất
    const divisor = gcd(n, d);
    this.num = n / divisor;
    this.den = d / divisor;
  }

  public static fromBigInt(n: bigint): Fraction {
    return new Fraction(n, 1n);
  }

  /**
   * Tạo phân số từ chuỗi biểu diễn số (nguyên, thập phân, hoặc ký pháp khoa học)
   * Ví dụ: "123" -> 123/1; "0.5" -> 1/2; "2.5×10^-4" -> 1/4000; "3×10^8" -> 300000000/1
   */
  public static fromNumberString(raw: string): Fraction {
    let str = raw.trim();

    // 0. Hỗ trợ phân số dạng "a/b"
    if (str.includes('/')) {
      const slashIndex = str.indexOf('/');
      const topStr = str.slice(0, slashIndex);
      const botStr = str.slice(slashIndex + 1);
      const top = Fraction.fromNumberString(topStr);
      const bot = Fraction.fromNumberString(botStr);
      return top.div(bot);
    }

    // 1. Chuẩn hóa ký pháp khoa học Casio (×10^ hoặc *10^) và ký pháp e/E
    let mantissaStr = str;
    let expVal = 0n;

    const sciMatch = str.match(/^(.*?)(?:×10\^|\*10\^|[eE])([+-]?\d+)$/);
    if (sciMatch) {
      mantissaStr = sciMatch[1];
      if (mantissaStr === '' || mantissaStr === '+') mantissaStr = '1';
      if (mantissaStr === '-') mantissaStr = '-1';
      expVal = BigInt(sciMatch[2]);
    }

    // 2. Tách dấu âm nếu có
    let isNeg = false;
    if (mantissaStr.startsWith('-') || mantissaStr.startsWith('−')) {
      isNeg = true;
      mantissaStr = mantissaStr.slice(1);
    } else if (mantissaStr.startsWith('+')) {
      mantissaStr = mantissaStr.slice(1);
    }

    // 3. Phân tích phần nguyên và phần thập phân
    let num: bigint;
    let den: bigint = 1n;

    const dotIndex = mantissaStr.indexOf('.');
    if (dotIndex === -1) {
      num = BigInt(mantissaStr || '0');
    } else {
      const wholePart = mantissaStr.slice(0, dotIndex);
      const fracPart = mantissaStr.slice(dotIndex + 1);
      const digitsCount = fracPart.length;

      num = BigInt((wholePart || '0') + fracPart);
      den = 10n ** BigInt(digitsCount);
    }

    if (isNeg) {
      num = -num;
    }

    // 4. Áp dụng số mũ 10^exp
    if (expVal > 0n) {
      num = num * (10n ** expVal);
    } else if (expVal < 0n) {
      den = den * (10n ** (-expVal));
    }

    return new Fraction(num, den);
  }

  public add(other: Fraction): Fraction {
    // a/b + c/d = (a*d + c*b) / (b*d)
    const n = this.num * other.den + other.num * this.den;
    const d = this.den * other.den;
    return new Fraction(n, d);
  }

  public sub(other: Fraction): Fraction {
    // a/b - c/d = (a*d - c*b) / (b*d)
    const n = this.num * other.den - other.num * this.den;
    const d = this.den * other.den;
    return new Fraction(n, d);
  }

  public mul(other: Fraction): Fraction {
    // a/b * c/d = (a*c) / (b*d)
    const n = this.num * other.num;
    const d = this.den * other.den;
    return new Fraction(n, d);
  }

  public div(other: Fraction): Fraction {
    if (other.num === 0n) {
      throw new MathError({
        code: 'DIVISION_BY_ZERO',
        message: 'Không thể chia cho 0'
      });
    }
    // a/b / c/d = (a*d) / (b*c)
    const n = this.num * other.den;
    const d = this.den * other.num;
    return new Fraction(n, d);
  }

  public pow(exp: bigint): Fraction {
    if (exp === 0n) {
      if (this.num === 0n) {
        throw new MathError({
          code: 'INVALID_POWER',
          message: '0^0 không xác định'
        });
      }
      return new Fraction(1n, 1n);
    }

    if (this.num === 0n) {
      if (exp < 0n) {
        throw new MathError({
          code: 'DIVISION_BY_ZERO',
          message: '0 không thể có số mũ âm'
        });
      }
      return new Fraction(0n, 1n);
    }

    if (exp > 0n) {
      return new Fraction(this.num ** exp, this.den ** exp);
    }

    // exp < 0: nghịch đảo phân số
    const posExp = -exp;
    return new Fraction(this.den ** posExp, this.num ** posExp);
  }

  public neg(): Fraction {
    return new Fraction(-this.num, this.den);
  }

  public abs(): Fraction {
    return new Fraction(this.num < 0n ? -this.num : this.num, this.den);
  }

  public isZero(): boolean {
    return this.num === 0n;
  }

  public isInteger(): boolean {
    return this.den === 1n;
  }

  public isNegative(): boolean {
    return this.num < 0n;
  }

  /**
   * Biểu diễn dạng chuỗi phân số tối giản (ví dụ: "5/6", "-1/2", "3")
   */
  public toString(): string {
    if (this.den === 1n) {
      return this.num.toString();
    }
    return `${this.num}/${this.den}`;
  }

  public toFractionString(): string {
    return this.toString();
  }

  public toNumber(): number {
    return Number(this.num) / Number(this.den);
  }

  public toDecimal(): Decimal {
    return Decimal.fromFraction(this);
  }

  /**
   * Tách thành hỗn số: whole a b/c
   * Ví dụ: 7/2 -> 3 + 1/2
   */
  public toMixedFraction(): { whole: bigint; num: bigint; den: bigint } {
    const isNeg = this.num < 0n;
    const absNum = isNeg ? -this.num : this.num;
    const whole = absNum / this.den;
    const rem = absNum % this.den;

    return {
      whole: isNeg ? -whole : whole,
      num: rem,
      den: this.den
    };
  }

  /**
   * Chuyển đổi sang số thực thập phân với số chữ số có nghĩa và làm tròn nửa lên (Half-up)
   */
  public toDecimalString(precision: number = 15): string {
    if (this.num === 0n) return '0';

    const isNeg = this.num < 0n;
    const absNum = isNeg ? -this.num : this.num;

    // Chia lấy phần nguyên và phần thập phân chính xác
    const whole = absNum / this.den;
    const rem = absNum % this.den;

    if (rem === 0n) {
      return (isNeg ? '-' : '') + whole.toString();
    }

    // Tính chính xác từng chữ số thập phân
    let currentRem = rem;
    let fracDigits = '';

    // Lấy dư thêm 1 chữ số để làm tròn
    for (let i = 0; i <= precision; i++) {
      currentRem *= 10n;
      const digit = currentRem / this.den;
      fracDigits += digit.toString();
      currentRem = currentRem % this.den;
    }

    // Làm tròn half-up ở vị trí precision
    const mainDigits = fracDigits.slice(0, precision);
    const roundDigit = parseInt(fracDigits[precision], 10);

    if (roundDigit >= 5) {
      // Làm tròn lên
      const carry = 1n;
      let roundedStr = (BigInt(mainDigits) + carry).toString();
      let displayWhole = whole;
      if (roundedStr.length > mainDigits.length) {
        // Tràn hàng phần nguyên
        displayWhole = whole + 1n;
        roundedStr = roundedStr.slice(1);
      }
      // Bỏ số 0 vô nghĩa ở đuôi
      let trimmed = roundedStr.replace(/0+$/, '');
      if (trimmed === '') {
        return (isNeg ? '-' : '') + displayWhole.toString();
      }
      return (isNeg ? '-' : '') + displayWhole.toString() + '.' + trimmed;
    } else {
      let trimmed = mainDigits.replace(/0+$/, '');
      if (trimmed === '') {
        return (isNeg ? '-' : '') + whole.toString();
      }
      return (isNeg ? '-' : '') + whole.toString() + '.' + trimmed;
    }
  }
}
