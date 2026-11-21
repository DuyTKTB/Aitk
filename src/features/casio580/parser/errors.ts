/**
 * Cấu trúc lỗi cú pháp (Syntax ERROR) của Casio fx-580VN X
 */

export type SyntaxErrorCode =
  | 'EMPTY_EXPRESSION'           // Biểu thức rỗng
  | 'UNEXPECTED_TOKEN'           // Ký tự hoặc toán tử không mong đợi
  | 'UNEXPECTED_EOF'             // Biểu thức kết thúc đột ngột (thiếu toán hạng)
  | 'UNMATCHED_LPAREN'           // Dấu ngoặc mở không được đóng đúng cách
  | 'UNMATCHED_RPAREN'           // Thừa dấu ngoặc đóng không có dấu mở tương ứng
  | 'EMPTY_PARENTHESES'          // Dấu ngoặc rỗng () hoặc hàm không có đối số
  | 'INVALID_NUMBER'             // Định dạng số không hợp lệ (ví dụ: nhiều dấu chấm 1.2.3)
  | 'INVALID_OPERATOR_SEQUENCE'  // Chuỗi toán tử liên tiếp không hợp lệ (ví dụ: 2 + × 3)
  | 'INVALID_ARGUMENT_COUNT'     // Hàm nhận số lượng tham số không hợp lệ
  | 'UNSUPPORTED_SYNTAX';        // Cú pháp chưa được hỗ trợ trong phạm vi hiện tại

export interface SyntaxErrorDetails {
  code: SyntaxErrorCode;
  message: string;
  position: number; // Chỉ số ký tự lỗi (0-based)
  length: number;   // Độ dài của token gây lỗi
  rawExpression?: string;
}

export class CasioSyntaxError extends Error {
  public readonly code: SyntaxErrorCode;
  public readonly position: number;
  public readonly length: number;
  public readonly rawExpression?: string;

  constructor(details: SyntaxErrorDetails) {
    super(`Syntax ERROR at position ${details.position}: ${details.message}`);
    this.name = 'CasioSyntaxError';
    this.code = details.code;
    this.position = details.position;
    this.length = details.length;
    this.rawExpression = details.rawExpression;

    // Giữ nguyên prototype chain cho instanceof
    Object.setPrototypeOf(this, CasioSyntaxError.prototype);
  }
}
