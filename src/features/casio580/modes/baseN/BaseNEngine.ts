import { MathError } from '../../engine/errors';
import {
  MIN_INT32,
  MAX_INT32,
  MASK_32,
  toSigned32,
  toUnsigned32
} from './BaseNConverter';

/**
 * Động cơ tính toán đại số và logic nhị phân cho Mode 3 (Base-N)
 * Thực thi chính xác theo kiến trúc 32-bit signed Two's Complement
 */
export class BaseNEngine {
  /**
   * Phép cộng (+): a + b
   */
  public add(a: bigint, b: bigint): bigint {
    const res = a + b;
    this.checkOverflow(res);
    return res;
  }

  /**
   * Phép trừ (-): a - b
   */
  public sub(a: bigint, b: bigint): bigint {
    const res = a - b;
    this.checkOverflow(res);
    return res;
  }

  /**
   * Phép nhân (×): a * b
   */
  public mul(a: bigint, b: bigint): bigint {
    const res = a * b;
    this.checkOverflow(res);
    return res;
  }

  /**
   * Phép chia nguyên (÷): a / b (lấy phần nguyên, làm tròn về 0)
   */
  public div(a: bigint, b: bigint): bigint {
    if (b === 0n) {
      throw new MathError({
        code: 'DIVISION_BY_ZERO',
        message: 'Lỗi chia cho 0 trong Base-N'
      });
    }
    const res = a / b;
    this.checkOverflow(res);
    return res;
  }

  /**
   * Phép AND bitwise: a and b
   */
  public and(a: bigint, b: bigint): bigint {
    const ua = toUnsigned32(a);
    const ub = toUnsigned32(b);
    return toSigned32(ua & ub);
  }

  /**
   * Phép OR bitwise: a or b
   */
  public or(a: bigint, b: bigint): bigint {
    const ua = toUnsigned32(a);
    const ub = toUnsigned32(b);
    return toSigned32(ua | ub);
  }

  /**
   * Phép XOR bitwise: a xor b
   */
  public xor(a: bigint, b: bigint): bigint {
    const ua = toUnsigned32(a);
    const ub = toUnsigned32(b);
    return toSigned32(ua ^ ub);
  }

  /**
   * Phép XNOR bitwise: not (a xor b)
   */
  public xnor(a: bigint, b: bigint): bigint {
    const ua = toUnsigned32(a);
    const ub = toUnsigned32(b);
    const xorRes = ua ^ ub;
    const notXor = (~xorRes) & MASK_32;
    return toSigned32(notXor);
  }

  /**
   * Phép đảo bit NOT bitwise: not a
   */
  public not(a: bigint): bigint {
    const ua = toUnsigned32(a);
    const inverted = (~ua) & MASK_32;
    return toSigned32(inverted);
  }

  /**
   * Phép đảo dấu số học NEG: -a (Two's complement negation)
   */
  public neg(a: bigint): bigint {
    if (a === MIN_INT32) {
      throw new MathError({
        code: 'OVERFLOW',
        message: 'Tràn số: -( -2^31 ) vượt quá giới hạn số nguyên 32-bit'
      });
    }
    return -a;
  }

  private checkOverflow(val: bigint): void {
    if (val < MIN_INT32 || val > MAX_INT32) {
      throw new MathError({
        code: 'OVERFLOW',
        message: 'Tràn số Base-N (kết quả vượt khỏi phạm vi biểu diễn 32-bit)'
      });
    }
  }
}
