import { Decimal } from './decimal';
import { MathError } from './errors';
import { AngleUnit } from './trig';

/**
 * Lớp biểu diễn số phức a + bi
 * Chỉ dùng trong Mode 2 (Complex Mode) - FEAT-MOD-02
 *
 * Lưu ý: Chỉ định nghĩa type và phép toán cơ bản.
 * Chưa tích hợp vào Mode Manager vì Mode 2 chưa được triển khai.
 */
export class ComplexNumber {
  public readonly re: Decimal; // Phần thực
  public readonly im: Decimal; // Phần ảo

  constructor(re: Decimal, im: Decimal) {
    this.re = re;
    this.im = im;
  }

  /**
   * Tạo số phức từ phần thực, phần ảo = 0
   */
  public static fromReal(re: Decimal): ComplexNumber {
    return new ComplexNumber(re, Decimal.zero());
  }

  /**
   * Tạo số phức từ tọa độ cực (r, θ)
   * re = r × cos(θ), im = r × sin(θ)
   */
  public static fromPolar(r: Decimal, theta: Decimal, angleUnit: AngleUnit): ComplexNumber {
    let thetaRad: number;
    const thetaNum = theta.toNumber();

    if (angleUnit === 'DEG') {
      thetaRad = thetaNum * Math.PI / 180;
    } else if (angleUnit === 'GRA') {
      thetaRad = thetaNum * Math.PI / 200;
    } else {
      thetaRad = thetaNum;
    }

    const rNum = r.toNumber();
    const re = Decimal.fromNumber(rNum * Math.cos(thetaRad));
    const im = Decimal.fromNumber(rNum * Math.sin(thetaRad));
    return new ComplexNumber(re, im);
  }

  /**
   * Phép cộng: (a+bi) + (c+di) = (a+c) + (b+d)i
   */
  public add(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(this.re.add(other.re), this.im.add(other.im));
  }

  /**
   * Phép trừ: (a+bi) - (c+di) = (a-c) + (b-d)i
   */
  public sub(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(this.re.sub(other.re), this.im.sub(other.im));
  }

  /**
   * Phép nhân: (a+bi)(c+di) = (ac-bd) + (ad+bc)i
   */
  public mul(other: ComplexNumber): ComplexNumber {
    const re = this.re.mul(other.re).sub(this.im.mul(other.im));
    const im = this.re.mul(other.im).add(this.im.mul(other.re));
    return new ComplexNumber(re, im);
  }

  /**
   * Phép chia: (a+bi)/(c+di) = ((ac+bd) + (bc-ad)i) / (c²+d²)
   */
  public div(other: ComplexNumber): ComplexNumber {
    const denom = other.re.mul(other.re).add(other.im.mul(other.im));
    if (denom.isZero()) {
      throw new MathError({
        code: 'DIVISION_BY_ZERO',
        message: 'Phép chia số phức cho 0'
      });
    }
    const re = this.re.mul(other.re).add(this.im.mul(other.im)).div(denom);
    const im = this.im.mul(other.re).sub(this.re.mul(other.im)).div(denom);
    return new ComplexNumber(re, im);
  }

  /**
   * Modulus (Mô-đun): |a+bi| = √(a²+b²)
   */
  public abs(): Decimal {
    const sumSq = this.re.mul(this.re).add(this.im.mul(this.im));
    return Decimal.fromNumber(Math.sqrt(sumSq.toNumber()));
  }

  /**
   * Argument (Góc pha): arg(a+bi) = atan2(b, a), kết quả theo đơn vị góc
   */
  public arg(angleUnit: AngleUnit): Decimal {
    const radResult = Math.atan2(this.im.toNumber(), this.re.toNumber());
    let result: number;

    if (angleUnit === 'DEG') {
      result = radResult * 180 / Math.PI;
    } else if (angleUnit === 'GRA') {
      result = radResult * 200 / Math.PI;
    } else {
      result = radResult;
    }

    return Decimal.fromNumber(result);
  }

  /**
   * Liên hợp phức: conj(a+bi) = a-bi
   */
  public conj(): ComplexNumber {
    return new ComplexNumber(this.re, this.im.neg());
  }

  /**
   * Kiểm tra xem số phức có phải là số thực không (phần ảo = 0)
   */
  public isReal(): boolean {
    return this.im.isZero();
  }

  /**
   * Biểu diễn dạng chữ nhật: "a+bi" hoặc "a-bi"
   */
  public toString(_angleUnit?: AngleUnit): string {
    const reStr = this.re.formatDisplay('NORM1');
    const imNum = this.im.toNumber();

    if (this.im.isZero()) {
      return reStr;
    }

    if (this.re.isZero()) {
      if (imNum === 1) return 'i';
      if (imNum === -1) return '-i';
      return `${this.im.formatDisplay('NORM1')}i`;
    }

    if (imNum === 1) return `${reStr}+i`;
    if (imNum === -1) return `${reStr}-i`;

    const imStr = this.im.formatDisplay('NORM1');
    if (this.im.isNegative()) {
      return `${reStr}${imStr}i`;
    }
    return `${reStr}+${imStr}i`;
  }

  /**
   * Biểu diễn dạng cực: "r∠θ"
   */
  public toPolarString(angleUnit: AngleUnit): string {
    const r = this.abs().formatDisplay('NORM1');
    const theta = this.arg(angleUnit).formatDisplay('NORM1');
    return `${r}∠${theta}`;
  }
}

/**
 * Kết quả số phức với hỗ trợ chuyển đổi chế độ hiển thị
 */
export class ComplexResult {
  public readonly complex: ComplexNumber;
  public currentView: 'RECT' | 'POLAR';

  constructor(complex: ComplexNumber, view: 'RECT' | 'POLAR' = 'RECT') {
    this.complex = complex;
    this.currentView = view;
  }

  /**
   * Lấy chuỗi hiển thị theo chế độ hiện tại
   */
  public getDisplayText(angleUnit: AngleUnit): string {
    if (this.currentView === 'POLAR') {
      return this.complex.toPolarString(angleUnit);
    }
    return this.complex.toString(angleUnit);
  }

  /**
   * Chuyển đổi giữa chế độ hiển thị RECT và POLAR
   */
  public toggleView(): void {
    this.currentView = this.currentView === 'RECT' ? 'POLAR' : 'RECT';
  }
}
