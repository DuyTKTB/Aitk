/**
 * Abstract Syntax Tree (AST) definitions for Casio fx-580VN X expressions
 * Cấu trúc cây cú pháp trừu tượng chuẩn hóa cho biểu thức máy tính Casio
 */

export interface SourceLocation {
  start: number; // Chỉ số ký tự bắt đầu (0-based)
  end: number;   // Chỉ số ký tự kết thúc (exclusive)
}

export type ASTNode =
  | NumberNode
  | VariableNode
  | ConstantNode
  | UnaryOpNode
  | PostfixOpNode
  | BinaryOpNode
  | ImplicitMulNode
  | FractionNode
  | FunctionCallNode
  | ParenthesisNode;

/**
 * Nút số (nguyên, thập phân, hoặc ký pháp khoa học ×10^)
 */
export interface NumberNode {
  type: 'Number';
  value: string; // Chuỗi giá trị gốc (ví dụ: "3.14", "10", "3×10^8")
  loc: SourceLocation;
}

/**
 * Nút biến nhớ (A, B, C, D, E, F, x, y, z, M, Ans)
 */
export interface VariableNode {
  type: 'Variable';
  name: string;
  loc: SourceLocation;
}

/**
 * Nút hằng số toán học (π, e)
 */
export interface ConstantNode {
  type: 'Constant';
  name: 'π' | 'e';
  loc: SourceLocation;
}

/**
 * Toán tử tiền tố một ngôi (+, -)
 */
export interface UnaryOpNode {
  type: 'UnaryOp';
  op: '+' | '-';
  argument: ASTNode;
  loc: SourceLocation;
}

/**
 * Toán tử hậu tố một ngôi (!, ², ³, ⁻¹, %, °)
 */
export interface PostfixOpNode {
  type: 'PostfixOp';
  op: '!' | '²' | '³' | '⁻¹' | '%' | '°';
  argument: ASTNode;
  loc: SourceLocation;
}

/**
 * Toán tử hai ngôi (+, -, ×, ÷, ^, P, C)
 */
export interface BinaryOpNode {
  type: 'BinaryOp';
  op: '+' | '-' | '×' | '÷' | '^' | 'P' | 'C';
  left: ASTNode;
  right: ASTNode;
  loc: SourceLocation;
}

/**
 * Phép nhân ngầm định (Implicit Multiplication)
 * - TYPE_A: Nhân ngầm trước biến, hằng số hoặc hàm (độ ưu tiên cao hơn nPr/nCr và ×, ÷). Ví dụ: 2π, 2x, 2sin(30)
 * - TYPE_B: Nhân ngầm trước dấu ngoặc mở (độ ưu tiên cao hơn ×, ÷ nhưng thấp hơn Type A). Ví dụ: 2(1+2), (2+3)(4+5)
 */
export interface ImplicitMulNode {
  type: 'ImplicitMul';
  mulType: 'TYPE_A' | 'TYPE_B';
  left: ASTNode;
  right: ASTNode;
  loc: SourceLocation;
}

/**
 * Nút phân số (tử số / mẫu số)
 */
export interface FractionNode {
  type: 'Fraction';
  numerator: ASTNode;
  denominator: ASTNode;
  loc: SourceLocation;
}

/**
 * Nút gọi hàm toán học (sin, cos, tan, ln, log, √, abs, v.v.)
 */
export interface FunctionCallNode {
  type: 'FunctionCall';
  name: string;
  args: ASTNode[];
  loc: SourceLocation;
}

/**
 * Nút biểu thức trong dấu ngoặc đơn ( expr )
 */
export interface ParenthesisNode {
  type: 'Parenthesis';
  content: ASTNode;
  loc: SourceLocation;
}
