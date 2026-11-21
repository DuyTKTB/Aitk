/**
 * Định nghĩa Token cho bộ phân tích từ vựng (Lexer) của Casio fx-580VN X
 */

export type TokenType =
  | 'NUMBER'       // Số nguyên, số thập phân hoặc ký pháp khoa học (123, 3.14, .5, 3×10^8)
  | 'VARIABLE'     // Biến nhớ (A, B, C, D, E, F, x, y, z, M, Ans)
  | 'CONSTANT'     // Hằng số toán học (π, e)
  | 'PLUS'         // Dấu cộng (+)
  | 'MINUS'        // Dấu trừ (-, −)
  | 'MULTIPLY'     // Phép nhân (×, *)
  | 'DIVIDE'       // Phép chia (÷, /)
  | 'POWER'        // Phép nâng lũy thừa (^)
  | 'FRAC'         // Phép phân số (⌟)
  | 'FACTORIAL'    // Giai thừa (!)
  | 'SQUARE'       // Bình phương (²)
  | 'CUBE'         // Lập phương (³)
  | 'RECIPROCAL'   // Nghịch đảo (⁻¹)
  | 'PERCENT'      // Phần trăm (%)
  | 'DEGREE'       // Độ, phút, giây (°)
  | 'NPR'          // Chỉnh hợp (P)
  | 'NCR'          // Tổ hợp (C)
  | 'FUNCTION'     // Tên hàm toán học (sin, cos, tan, ln, log, √, abs, v.v.)
  | 'LPAREN'       // Dấu mở ngoặc đơn (()
  | 'RPAREN'       // Dấu đóng ngoặc đơn ())
  | 'COMMA'        // Dấu phẩy ngăn cách tham số (,)
  | 'EOF';         // Ký hiệu kết thúc biểu thức

export interface Token {
  type: TokenType;
  value: string;
  start: number; // Vị trí ký tự bắt đầu trong chuỗi gốc
  end: number;   // Vị trí ký tự kết thúc trong chuỗi gốc (exclusive)
}
