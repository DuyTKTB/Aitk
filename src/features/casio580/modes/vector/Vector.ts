import { Fraction } from '../../engine/fraction';
import { Decimal } from '../../engine/decimal';
import { MathError, DimensionError } from '../../engine/errors';
import { AngleUnit } from '../../engine/trig';
import { VectorDimension } from './types';

export type VectorValue = number | bigint | string | Fraction;

function toFraction(v: VectorValue): Fraction {
  if (v instanceof Fraction) return v;
  if (typeof v === 'bigint') return Fraction.fromBigInt(v);
  if (typeof v === 'number') return Fraction.fromNumberString(v.toString());
  return Fraction.fromNumberString(v);
}

/**
 * Lớp đại diện Véc-tơ số học 2D/3D (FEAT-MOD-05)
 * Dùng phân số chính xác (Exact Fraction) để không bị trôi sai số dấu chấm động
 */
export class Vector {
  public readonly dimension: VectorDimension;
  private readonly data: Fraction[];

  constructor(dimension: VectorDimension, initialData?: Fraction[]) {
    this.dimension = dimension;
    if (initialData) {
      this.data = initialData.slice(0, dimension);
    } else {
      this.data = Array.from({ length: dimension }, () => Fraction.fromBigInt(0n));
    }
  }

  public static fromArray(arr: VectorValue[]): Vector {
    const dim = arr.length;
    if (dim !== 2 && dim !== 3) {
      throw new DimensionError(`Casio fx-580VN X chỉ hỗ trợ véc-tơ 2 chiều hoặc 3 chiều (nhận ${dim} chiều)`);
    }
    const data = arr.map(toFraction);
    return new Vector(dim as VectorDimension, data);
  }

  public get(index: number): Fraction {
    if (index < 0 || index >= this.dimension) {
      throw new DimensionError(`Chỉ số phần tử véc-tơ ${index} vượt ngoài kích thước ${this.dimension}`);
    }
    return this.data[index];
  }

  public set(index: number, value: VectorValue): Vector {
    if (index < 0 || index >= this.dimension) {
      throw new DimensionError(`Chỉ số phần tử véc-tơ ${index} vượt ngoài kích thước`);
    }
    const copy = [...this.data];
    copy[index] = toFraction(value);
    return new Vector(this.dimension, copy);
  }

  public add(other: Vector): Vector {
    if (this.dimension !== other.dimension) {
      throw new DimensionError(`Phép cộng véc-tơ yêu cầu cùng số chiều: ${this.dimension}D + ${other.dimension}D`);
    }
    const res = this.data.map((v, i) => v.add(other.data[i]));
    return new Vector(this.dimension, res);
  }

  public sub(other: Vector): Vector {
    if (this.dimension !== other.dimension) {
      throw new DimensionError(`Phép trừ véc-tơ yêu cầu cùng số chiều: ${this.dimension}D - ${other.dimension}D`);
    }
    const res = this.data.map((v, i) => v.sub(other.data[i]));
    return new Vector(this.dimension, res);
  }

  public mulScalar(k: VectorValue): Vector {
    const kFrac = toFraction(k);
    const res = this.data.map((v) => v.mul(kFrac));
    return new Vector(this.dimension, res);
  }

  /**
   * Tích vô hướng (Dot Product): u • v = ∑ u_i * v_i
   */
  public dotFraction(other: Vector): Fraction {
    if (this.dimension !== other.dimension) {
      throw new DimensionError(`Tích vô hướng yêu cầu cùng số chiều: ${this.dimension}D • ${other.dimension}D`);
    }
    let sum = Fraction.fromBigInt(0n);
    for (let i = 0; i < this.dimension; i++) {
      sum = sum.add(this.data[i].mul(other.data[i]));
    }
    return sum;
  }

  public dot(other: Vector): Decimal {
    return Decimal.fromFraction(this.dotFraction(other));
  }

  /**
   * Tích có hướng (Cross Product): u × v
   * CHỈ XÁC ĐỊNH CHO VÉC-TƠ 3D TRÊN CASIO FX-580VN X
   */
  public cross(other: Vector): Vector {
    if (this.dimension !== 3 || other.dimension !== 3) {
      throw new DimensionError('Tích có hướng (Cross Product) chỉ xác định cho véc-tơ 3 chiều (3D)');
    }

    const u0 = this.data[0];
    const u1 = this.data[1];
    const u2 = this.data[2];

    const v0 = other.data[0];
    const v1 = other.data[1];
    const v2 = other.data[2];

    // (u1*v2 - u2*v1, u2*v0 - u0*v2, u0*v1 - u1*v0)
    const c0 = u1.mul(v2).sub(u2.mul(v1));
    const c1 = u2.mul(v0).sub(u0.mul(v2));
    const c2 = u0.mul(v1).sub(u1.mul(v0));

    return new Vector(3, [c0, c1, c2]);
  }

  /**
   * Bình phương độ dài: |u|² = ∑ u_i²
   */
  public magnitudeSquaredFraction(): Fraction {
    let sum = Fraction.fromBigInt(0n);
    for (let i = 0; i < this.dimension; i++) {
      sum = sum.add(this.data[i].mul(this.data[i]));
    }
    return sum;
  }

  /**
   * Độ dài véc-tơ (Magnitude / Abs): |u| = √(∑ u_i²)
   */
  public magnitude(): Decimal {
    const sumSqFrac = this.magnitudeSquaredFraction();
    const sumSqNum = Decimal.fromFraction(sumSqFrac).toNumber();
    return Decimal.fromNumber(Math.sqrt(sumSqNum));
  }

  /**
   * Góc giữa hai véc-tơ: θ = arccos((u • v) / (|u| * |v|))
   * Trả về giá trị theo AngleUnit (mặc định DEG)
   */
  public angle(other: Vector, unit: AngleUnit = 'DEG'): Decimal {
    if (this.dimension !== other.dimension) {
      throw new DimensionError(`Tính góc yêu cầu hai véc-tơ cùng số chiều: ${this.dimension}D và ${other.dimension}D`);
    }

    const mag1 = this.magnitude().toNumber();
    const mag2 = other.magnitude().toNumber();

    if (mag1 === 0 || mag2 === 0) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: 'Không thể tính góc với véc-tơ không (độ dài bằng 0)'
      });
    }

    const dotVal = this.dot(other).toNumber();
    let cosTheta = dotVal / (mag1 * mag2);
    // Kẹp trong khoảng [-1, 1] và làm sạch sai số xấp xỉ 1 hoặc -1 (cùng hướng/ngược hướng)
    if (Math.abs(cosTheta - 1) < 1e-11) {
      cosTheta = 1;
    } else if (Math.abs(cosTheta - (-1)) < 1e-11) {
      cosTheta = -1;
    } else {
      cosTheta = Math.max(-1, Math.min(1, cosTheta));
    }

    const rad = Math.acos(cosTheta);
    let resultAngle: number;
    if (unit === 'DEG') {
      resultAngle = (rad * 180) / Math.PI;
    } else if (unit === 'GRA') {
      resultAngle = (rad * 200) / Math.PI;
    } else {
      resultAngle = rad;
    }

    // Làm sạch sai số gần 0
    if (Math.abs(resultAngle) < 1e-13) resultAngle = 0;
    return Decimal.fromNumber(resultAngle);
  }

  /**
   * Véc-tơ đơn vị (Unit Vector): u / |u|
   */
  public unitVector(): Vector {
    const magFrac = this.magnitudeSquaredFraction();
    if (magFrac.isZero()) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: 'Véc-tơ không không thể chuẩn hóa thành véc-tơ đơn vị'
      });
    }

    const magNum = Math.sqrt(Decimal.fromFraction(magFrac).toNumber());
    const invMag = 1 / magNum;

    // Chuyển đổi sang phân số hoặc số thập phân
    const resData: Fraction[] = [];
    for (let i = 0; i < this.dimension; i++) {
      const val = this.data[i].mul(Fraction.fromNumberString(invMag.toString()));
      resData.push(val);
    }
    return new Vector(this.dimension, resData);
  }

  public toArray(): number[] {
    return this.data.map((f) => f.toNumber());
  }

  public toStringArray(): string[] {
    return this.data.map((f) => f.toString());
  }

  public toDecimalArray(): number[] {
    return this.toArray();
  }
}
