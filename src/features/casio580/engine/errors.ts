import { SourceLocation } from '../parser/ast';

/**
 * Các mã lỗi toán học (Math ERROR) chuẩn Casio fx-580VN X
 */
export type MathErrorCode =
  | 'DIVISION_BY_ZERO'    // Chia cho 0 (x ÷ 0)
  | 'OVERFLOW'            // Tràn số (|x| ≥ 10^100)
  | 'UNDERFLOW'           // Dưới ngưỡng biểu diễn (|x| < 10^-99, được coi là 0)
  | 'INVALID_POWER'       // Lũy thừa không xác định (0^0, (-x)^y với y không nguyên)
  | 'INVALID_FACTORIAL'   // Giai thừa số âm, số thực, hoặc > 69 (tràn 10^100)
  | 'INVALID_PERM_COMB'   // Chỉnh hợp / tổ hợp n < r hoặc số âm hoặc không nguyên
  | 'UNDEFINED_VARIABLE'  // Biến nhớ chưa được gán giá trị
  | 'DIMENSION_ERROR'     // Kích thước không tương thích trong ma trận / véc-tơ
  | 'MATH_ERROR';         // Lỗi toán học nói chung

export interface MathErrorDetails {
  code: MathErrorCode;
  message: string;
  loc?: SourceLocation;
}

/**
 * Lớp lỗi toán học có cấu trúc
 * Không bao giờ làm crash ứng dụng, trả về thông điệp và mã lỗi rõ ràng cho UI
 */
export class MathError extends Error {
  public readonly code: MathErrorCode;
  public readonly loc?: SourceLocation;

  constructor(details: MathErrorDetails) {
    super(`Math ERROR: ${details.message}`);
    this.name = 'MathError';
    this.code = details.code;
    this.loc = details.loc;

    Object.setPrototypeOf(this, MathError.prototype);
  }
}

/**
 * Lỗi kích thước không tương thích (Dimension ERROR)
 * Dùng cho ma trận và véc-tơ khi số hàng/cột không khớp
 */
export class DimensionError extends MathError {
  constructor(message: string = 'Kích thước không tương thích (Dimension ERROR)', loc?: SourceLocation) {
    super({ code: 'DIMENSION_ERROR', message, loc });
    this.name = 'DimensionError';
    Object.setPrototypeOf(this, DimensionError.prototype);
  }
}
