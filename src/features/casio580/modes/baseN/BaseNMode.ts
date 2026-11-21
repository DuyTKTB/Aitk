import { BaseNEngine } from './BaseNEngine';
import {
  parseBase,
  formatBase,
  createBaseNResult
} from './BaseNConverter';
import { NumberBase, BaseNResult } from './types';
import { MathError } from '../../engine/errors';

/**
 * Bộ điều khiển chế độ tính toán hệ đếm (Mode 3: Base-N)
 * Phục vụ chuẩn Casio fx-580VN X:
 * - Quản lý 4 hệ cơ số DEC, HEX, BIN, OCT
 * - Hỗ trợ các phép toán số học (+, -, ×, ÷) và các toán tử logic (and, or, xor, xnor, not, neg)
 * - Tự động chuyển đổi hiển thị giữa các cơ số khi người dùng chuyển mode
 */
export class BaseNMode {
  private engine: BaseNEngine;
  private currentBase: NumberBase = 'DEC';
  private lastResult: BaseNResult | null = null;

  constructor() {
    this.engine = new BaseNEngine();
  }

  public getBase(): NumberBase {
    return this.currentBase;
  }

  public setBase(base: NumberBase): BaseNResult | null {
    this.currentBase = base;
    if (this.lastResult) {
      this.lastResult = createBaseNResult(this.lastResult.value, base);
      return this.lastResult;
    }
    return null;
  }

  public parse(str: string, base?: NumberBase): bigint {
    return parseBase(str, base || this.currentBase);
  }

  public format(val: bigint, base?: NumberBase): string {
    return formatBase(val, base || this.currentBase);
  }

  public evaluateBinary(
    op: '+' | '-' | '*' | '/' | 'and' | 'or' | 'xor' | 'xnor',
    rawA: string | bigint,
    rawB: string | bigint
  ): BaseNResult {
    const a = typeof rawA === 'bigint' ? rawA : this.parse(rawA);
    const b = typeof rawB === 'bigint' ? rawB : this.parse(rawB);

    let res: bigint;
    switch (op) {
      case '+':
        res = this.engine.add(a, b);
        break;
      case '-':
        res = this.engine.sub(a, b);
        break;
      case '*':
        res = this.engine.mul(a, b);
        break;
      case '/':
        res = this.engine.div(a, b);
        break;
      case 'and':
        res = this.engine.and(a, b);
        break;
      case 'or':
        res = this.engine.or(a, b);
        break;
      case 'xor':
        res = this.engine.xor(a, b);
        break;
      case 'xnor':
        res = this.engine.xnor(a, b);
        break;
      default:
        throw new MathError({
          code: 'MATH_ERROR',
          message: `Toán tử nhị phân không hợp lệ: ${op}`
        });
    }

    const result = createBaseNResult(res, this.currentBase);
    this.lastResult = result;
    return result;
  }

  public evaluateUnary(
    op: 'not' | 'neg',
    rawA: string | bigint
  ): BaseNResult {
    const a = typeof rawA === 'bigint' ? rawA : this.parse(rawA);

    let res: bigint;
    switch (op) {
      case 'not':
        res = this.engine.not(a);
        break;
      case 'neg':
        res = this.engine.neg(a);
        break;
      default:
        throw new MathError({
          code: 'MATH_ERROR',
          message: `Toán tử một ngôi không hợp lệ: ${op}`
        });
    }

    const result = createBaseNResult(res, this.currentBase);
    this.lastResult = result;
    return result;
  }

  public setValue(val: bigint | string): BaseNResult {
    const bigVal = typeof val === 'bigint' ? val : this.parse(val);
    const result = createBaseNResult(bigVal, this.currentBase);
    this.lastResult = result;
    return result;
  }

  public getLastResult(): BaseNResult | null {
    return this.lastResult;
  }
}
