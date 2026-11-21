import { MathError } from '../../engine/errors';
import { NumberBase, BaseNResult } from './types';

export const MIN_INT32 = -2147483648n;
export const MAX_INT32 = 2147483647n;
export const MASK_32 = 0xFFFFFFFFn;
export const TWO_POW_32 = 0x100000000n;
export const SIGN_BIT_32 = 0x80000000n;

/**
 * Chuyển đổi số nguyên 32-bit không dấu sang có dấu (Two's complement)
 */
export function toSigned32(val: bigint): bigint {
  const masked = val & MASK_32;
  if ((masked & SIGN_BIT_32) !== 0n) {
    return masked - TWO_POW_32;
  }
  return masked;
}

/**
 * Chuyển đổi số nguyên 32-bit có dấu sang không dấu
 */
export function toUnsigned32(val: bigint): bigint {
  return val & MASK_32;
}

/**
 * Kiểm tra tính hợp lệ của ký tự nhập vào theo hệ cơ số
 */
export function validateBaseString(str: string, base: NumberBase): void {
  const trimmed = str.trim();
  if (trimmed === '' || trimmed === '-') {
    throw new MathError({
      code: 'MATH_ERROR',
      message: 'Chuỗi nhập rỗng hoặc không hợp lệ'
    });
  }

  const s = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;

  switch (base) {
    case 'BIN':
      if (!/^[01]+$/.test(s)) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'Ký tự không hợp lệ cho hệ nhị phân (chỉ chấp nhận 0, 1)'
        });
      }
      break;
    case 'OCT':
      if (!/^[0-7]+$/.test(s)) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'Ký tự không hợp lệ cho hệ bát phân (chỉ chấp nhận 0-7)'
        });
      }
      break;
    case 'DEC':
      if (!/^\d+$/.test(s)) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'Ký tự không hợp lệ cho hệ thập phân (chỉ chấp nhận 0-9)'
        });
      }
      break;
    case 'HEX':
      if (!/^[0-9A-Fa-f]+$/.test(s)) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'Ký tự không hợp lệ cho hệ thập lục phân (chỉ chấp nhận 0-9, A-F)'
        });
      }
      break;
  }
}

/**
 * Chuyển đổi chuỗi ký tự theo cơ số thành giá trị số nguyên 32-bit có dấu
 */
export function parseBase(raw: string, base: NumberBase): bigint {
  validateBaseString(raw, base);
  const trimmed = raw.trim();
  const isNeg = trimmed.startsWith('-');
  const unsignedStr = isNeg ? trimmed.slice(1) : trimmed;

  let rawBig: bigint;
  if (base === 'BIN') {
    rawBig = BigInt(`0b${unsignedStr}`);
  } else if (base === 'OCT') {
    rawBig = BigInt(`0o${unsignedStr}`);
  } else if (base === 'HEX') {
    rawBig = BigInt(`0x${unsignedStr}`);
  } else {
    rawBig = BigInt(unsignedStr);
  }

  let finalVal: bigint;
  if (base === 'DEC') {
    finalVal = isNeg ? -rawBig : rawBig;
    if (finalVal < MIN_INT32 || finalVal > MAX_INT32) {
      throw new MathError({
        code: 'OVERFLOW',
        message: 'Tràn số Base-N (vượt quá khoảng biểu diễn 32-bit: -2^31 đến 2^31 - 1)'
      });
    }
  } else {
    // Với HEX, BIN, OCT: Casio fx-580VN X xử lý trực tiếp bit pattern 32-bit
    if (rawBig > MASK_32) {
      throw new MathError({
        code: 'OVERFLOW',
        message: 'Tràn số Base-N: vượt quá độ dài 32-bit'
      });
    }
    // Chuyển bit pattern 32-bit sang signed int32
    finalVal = toSigned32(rawBig);
    if (isNeg) {
      finalVal = toSigned32(-finalVal);
    }
  }

  return finalVal;
}

/**
 * Định dạng số nguyên 32-bit thành chuỗi hiển thị theo hệ cơ số
 */
export function formatBase(val: bigint, base: NumberBase): string {
  const boundedVal = toSigned32(val);
  const unsignedVal = toUnsigned32(boundedVal);

  switch (base) {
    case 'DEC':
      return boundedVal.toString();
    case 'HEX':
      return unsignedVal.toString(16).toUpperCase();
    case 'BIN':
      return unsignedVal.toString(2);
    case 'OCT':
      return unsignedVal.toString(8);
  }
}

/**
 * Tạo kết quả BaseNResult đầy đủ
 */
export function createBaseNResult(val: bigint, base: NumberBase): BaseNResult {
  const boundedVal = toSigned32(val);
  return {
    value: boundedVal,
    currentBase: base,
    displayText: formatBase(boundedVal, base),
    representations: {
      dec: formatBase(boundedVal, 'DEC'),
      hex: formatBase(boundedVal, 'HEX'),
      bin: formatBase(boundedVal, 'BIN'),
      oct: formatBase(boundedVal, 'OCT')
    }
  };
}
