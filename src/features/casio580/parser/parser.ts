import { Token } from './tokens';
import {
  ASTNode,
  FunctionCallNode
} from './ast';
import { CasioSyntaxError } from './errors';
import { Lexer } from './lexer';

/**
 * Bảng mức độ ưu tiên toán tử (Binding Power) chuẩn Casio ClassWiz fx-580VN X
 */
export const enum Precedence {
  NONE = 0,
  COMMA = 1,
  ADD_SUB = 2,          // + -
  MUL_DIV = 3,          // × ÷
  IMPLICIT_MUL_B = 4,   // 2(3), (2+3)(4+5) -> Cao hơn ×, ÷
  PERM_COMB = 5,        // nPr, nCr
  IMPLICIT_MUL_A = 6,   // 2π, 2x, 2sin(30) -> Cao hơn nPr/nCr và ×, ÷
  UNARY_PREFIX = 7,     // -x, +x
  POWER = 8,            // ^ (kết hợp phải: 2^3^2 = 2^(3^2))
  POSTFIX = 9,          // !, ², ³, ⁻¹, %, °
  FRACTION = 10,        // Phân số ⌟
  CALL = 11             // Gọi hàm, dấu ngoặc
}

/**
 * Bộ phân tích cú pháp biểu thức toán học (Pratt Parser) cho Casio fx-580VN X
 */
export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private rawInput: string;
  private openParensCount: number = 0;

  constructor(tokensOrInput: Token[] | string) {
    if (typeof tokensOrInput === 'string') {
      this.rawInput = tokensOrInput;
      const lexer = new Lexer(tokensOrInput);
      this.tokens = lexer.tokenize();
    } else {
      this.tokens = tokensOrInput;
      this.rawInput = tokensOrInput.map((t) => t.value).join('');
    }
  }

  /**
   * Phương thức chính: Phân tích biểu thức và trả về cây AST hoàn chỉnh
   */
  public parse(): ASTNode {
    // 1. Kiểm tra biểu thức rỗng
    if (this.isAtEnd() || (this.tokens.length === 1 && this.tokens[0].type === 'EOF')) {
      throw new CasioSyntaxError({
        code: 'EMPTY_EXPRESSION',
        message: 'Biểu thức rỗng, không có dữ liệu để tính toán',
        position: 0,
        length: 0,
        rawExpression: this.rawInput
      });
    }

    const ast = this.parseExpression(Precedence.NONE);

    // Nếu còn token chưa xử lý mà không phải EOF
    if (!this.isAtEnd()) {
      const extraToken = this.peek();
      if (extraToken.type === 'RPAREN') {
        throw new CasioSyntaxError({
          code: 'UNMATCHED_RPAREN',
          message: "Dấu đóng ngoặc ')' thừa không có dấu mở tương ứng",
          position: extraToken.start,
          length: extraToken.end - extraToken.start,
          rawExpression: this.rawInput
        });
      }

      throw new CasioSyntaxError({
        code: 'UNEXPECTED_TOKEN',
        message: `Ký tự hoặc toán tử không mong đợi: '${extraToken.value}'`,
        position: extraToken.start,
        length: extraToken.end - extraToken.start,
        rawExpression: this.rawInput
      });
    }

    return ast;
  }

  /**
   * Phân tích biểu thức dựa trên thuật toán Pratt Parser với ngưỡng ưu tiên tối thiểu
   */
  private parseExpression(minPrecedence: Precedence): ASTNode {
    let left = this.parsePrefix();

    while (!this.isAtEnd()) {
      const nextToken = this.peek();

      // 1. Kiểm tra điều kiện phép nhân ngầm định (Implicit Multiplication)
      const implicitType = this.shouldInsertImplicitMul(left, nextToken);
      if (implicitType !== null) {
        const prec = implicitType === 'TYPE_A' ? Precedence.IMPLICIT_MUL_A : Precedence.IMPLICIT_MUL_B;
        if (minPrecedence >= prec) {
          break;
        }

        const right = this.parseExpression(prec);
        left = {
          type: 'ImplicitMul',
          mulType: implicitType,
          left,
          right,
          loc: { start: left.loc.start, end: right.loc.end }
        };
        continue;
      }

      // 2. Kiểm tra độ ưu tiên của toán tử trung tố / hậu tố tiếp theo
      const infixPrec = this.getInfixPrecedence(nextToken);
      if (minPrecedence >= infixPrec) {
        break;
      }

      // 3. Phân tích toán tử trung tố hoặc hậu tố
      left = this.parseInfix(left);
    }

    return left;
  }

  /**
   * Phân tích các toán hạng hoặc toán tử tiền tố (Prefix / Nud)
   */
  private parsePrefix(): ASTNode {
    const token = this.advance();

    switch (token.type) {
      // 1. Số
      case 'NUMBER': {
        return {
          type: 'Number',
          value: token.value,
          loc: { start: token.start, end: token.end }
        };
      }

      // 2. Biến nhớ
      case 'VARIABLE': {
        return {
          type: 'Variable',
          name: token.value,
          loc: { start: token.start, end: token.end }
        };
      }

      // 3. Hằng số toán học
      case 'CONSTANT': {
        return {
          type: 'Constant',
          name: token.value as 'π' | 'e',
          loc: { start: token.start, end: token.end }
        };
      }

      // 4. Dấu cộng tiền tố (+x)
      case 'PLUS': {
        const right = this.parseExpression(Precedence.UNARY_PREFIX);
        return {
          type: 'UnaryOp',
          op: '+',
          argument: right,
          loc: { start: token.start, end: right.loc.end }
        };
      }

      // 5. Dấu trừ âm tiền tố (-x)
      case 'MINUS': {
        const right = this.parseExpression(Precedence.UNARY_PREFIX);
        return {
          type: 'UnaryOp',
          op: '-',
          argument: right,
          loc: { start: token.start, end: right.loc.end }
        };
      }

      // 6. Dấu mở ngoặc đơn ( expr )
      case 'LPAREN': {
        const start = token.start;

        // Báo lỗi nếu gặp ngoặc rỗng ()
        if (this.peek().type === 'RPAREN') {
          throw new CasioSyntaxError({
            code: 'EMPTY_PARENTHESES',
            message: 'Dấu ngoặc đơn rỗng không chứa biểu thức',
            position: start,
            length: this.peek().end - start,
            rawExpression: this.rawInput
          });
        }

        this.openParensCount++;
        const inner = this.parseExpression(Precedence.NONE);

        let end = inner.loc.end;
        if (this.peek().type === 'RPAREN') {
          end = this.advance().end;
          this.openParensCount--;
        } else if (this.isAtEnd()) {
          // Tính năng Casio: Tự động đóng ngoặc ở cuối biểu thức
          this.openParensCount--;
          end = this.rawInput.length;
        } else {
          throw new CasioSyntaxError({
            code: 'UNMATCHED_LPAREN',
            message: "Thiếu dấu đóng ngoặc ')' tương ứng",
            position: start,
            length: 1,
            rawExpression: this.rawInput
          });
        }

        return {
          type: 'Parenthesis',
          content: inner,
          loc: { start, end }
        };
      }

      // 7. Gọi hàm toán học (sin, cos, tan, ln, log, √, abs, v.v.)
      case 'FUNCTION': {
        return this.parseFunctionCall(token);
      }

      // 8. Dấu đóng ngoặc bất ngờ khi đang mong đợi toán hạng
      case 'RPAREN': {
        throw new CasioSyntaxError({
          code: 'UNMATCHED_RPAREN',
          message: "Dấu đóng ngoặc ')' không mong đợi",
          position: token.start,
          length: token.end - token.start,
          rawExpression: this.rawInput
        });
      }

      // 9. Biểu thức kết thúc đột ngột
      case 'EOF': {
        throw new CasioSyntaxError({
          code: 'UNEXPECTED_EOF',
          message: 'Biểu thức kết thúc đột ngột, thiếu toán hạng',
          position: token.start,
          length: 0,
          rawExpression: this.rawInput
        });
      }

      // 10. Các toán tử hai ngôi đứng đầu biểu thức (trừ + và - đã xử lý ở trên)
      case 'MULTIPLY':
      case 'DIVIDE':
      case 'POWER':
      case 'NPR':
      case 'NCR':
      case 'FRAC':
      case 'COMMA': {
        throw new CasioSyntaxError({
          code: 'INVALID_OPERATOR_SEQUENCE',
          message: `Toán tử '${token.value}' không thể đứng ở vị trí này`,
          position: token.start,
          length: token.end - token.start,
          rawExpression: this.rawInput
        });
      }

      // 11. Các toán tử hậu tố đứng đầu biểu thức
      case 'FACTORIAL':
      case 'SQUARE':
      case 'CUBE':
      case 'RECIPROCAL':
      case 'PERCENT':
      case 'DEGREE': {
        throw new CasioSyntaxError({
          code: 'UNEXPECTED_TOKEN',
          message: `Toán tử hậu tố '${token.value}' không có toán hạng đứng trước`,
          position: token.start,
          length: token.end - token.start,
          rawExpression: this.rawInput
        });
      }

      default: {
        throw new CasioSyntaxError({
          code: 'UNEXPECTED_TOKEN',
          message: `Ký tự không mong đợi: '${token.value}'`,
          position: token.start,
          length: token.end - token.start,
          rawExpression: this.rawInput
        });
      }
    }
  }

  /**
   * Phân tích toán tử trung tố và hậu tố (Infix / Led)
   */
  private parseInfix(left: ASTNode): ASTNode {
    const token = this.advance();

    switch (token.type) {
      // 1. Phép cộng hai ngôi
      case 'PLUS': {
        const right = this.parseExpression(Precedence.ADD_SUB);
        return {
          type: 'BinaryOp',
          op: '+',
          left,
          right,
          loc: { start: left.loc.start, end: right.loc.end }
        };
      }

      // 2. Phép trừ hai ngôi
      case 'MINUS': {
        const right = this.parseExpression(Precedence.ADD_SUB);
        return {
          type: 'BinaryOp',
          op: '-',
          left,
          right,
          loc: { start: left.loc.start, end: right.loc.end }
        };
      }

      // 3. Phép nhân hai ngôi tường minh
      case 'MULTIPLY': {
        const right = this.parseExpression(Precedence.MUL_DIV);
        return {
          type: 'BinaryOp',
          op: '×',
          left,
          right,
          loc: { start: left.loc.start, end: right.loc.end }
        };
      }

      // 4. Phép chia hai ngôi tường minh
      case 'DIVIDE': {
        const right = this.parseExpression(Precedence.MUL_DIV);
        return {
          type: 'BinaryOp',
          op: '÷',
          left,
          right,
          loc: { start: left.loc.start, end: right.loc.end }
        };
      }

      // 5. Phép lũy thừa (kết hợp phải: Power - 1)
      case 'POWER': {
        const right = this.parseExpression(Precedence.POWER - 1);
        return {
          type: 'BinaryOp',
          op: '^',
          left,
          right,
          loc: { start: left.loc.start, end: right.loc.end }
        };
      }

      // 6. Phân số (⌟)
      case 'FRAC': {
        const denominator = this.parseExpression(Precedence.FRACTION);
        return {
          type: 'Fraction',
          numerator: left,
          denominator,
          loc: { start: left.loc.start, end: denominator.loc.end }
        };
      }

      // 7. Chỉnh hợp P (nPr)
      case 'NPR': {
        const right = this.parseExpression(Precedence.PERM_COMB);
        return {
          type: 'BinaryOp',
          op: 'P',
          left,
          right,
          loc: { start: left.loc.start, end: right.loc.end }
        };
      }

      // 8. Tổ hợp C (nCr)
      case 'NCR': {
        const right = this.parseExpression(Precedence.PERM_COMB);
        return {
          type: 'BinaryOp',
          op: 'C',
          left,
          right,
          loc: { start: left.loc.start, end: right.loc.end }
        };
      }

      // 9. Toán tử hậu tố: Giai thừa (!), Bình phương (²), Lập phương (³), Nghịch đảo (⁻¹), Phần trăm (%), Độ (°)
      case 'FACTORIAL':
      case 'SQUARE':
      case 'CUBE':
      case 'RECIPROCAL':
      case 'PERCENT':
      case 'DEGREE': {
        return {
          type: 'PostfixOp',
          op: token.value as '!' | '²' | '³' | '⁻¹' | '%' | '°',
          argument: left,
          loc: { start: left.loc.start, end: token.end }
        };
      }

      default: {
        throw new CasioSyntaxError({
          code: 'UNEXPECTED_TOKEN',
          message: `Toán tử trung tố không mong đợi: '${token.value}'`,
          position: token.start,
          length: token.end - token.start,
          rawExpression: this.rawInput
        });
      }
    }
  }

  /**
   * Phân tích hàm toán học và danh sách đối số
   */
  private parseFunctionCall(funcToken: Token): FunctionCallNode {
    const start = funcToken.start;
    const args: ASTNode[] = [];

    // Nếu hàm được theo sau bởi dấu ngoặc đơn mở (hoặc tự động nhận diện)
    if (this.peek().type === 'LPAREN') {
      this.advance(); // Bỏ qua '('
      this.openParensCount++;

      // Kiểm tra hàm rỗng không có đối số: sin()
      if (this.peek().type === 'RPAREN') {
        throw new CasioSyntaxError({
          code: 'EMPTY_PARENTHESES',
          message: `Hàm '${funcToken.value}' yêu cầu ít nhất một đối số`,
          position: start,
          length: this.peek().end - start,
          rawExpression: this.rawInput
        });
      }

      // Đọc các đối số phân tách bởi dấu phẩy
      while (!this.isAtEnd()) {
        args.push(this.parseExpression(Precedence.NONE));

        if (this.peek().type === 'COMMA') {
          this.advance(); // Bỏ qua ','
        } else {
          break;
        }
      }

      let end = this.peek().start;
      if (this.peek().type === 'RPAREN') {
        end = this.advance().end;
        this.openParensCount--;
      } else if (this.isAtEnd()) {
        // Tự động đóng ngoặc ở cuối biểu thức
        this.openParensCount--;
        end = this.rawInput.length;
      } else {
        throw new CasioSyntaxError({
          code: 'UNMATCHED_LPAREN',
          message: `Thiếu dấu đóng ngoặc ')' cho hàm '${funcToken.value}'`,
          position: start,
          length: 1,
          rawExpression: this.rawInput
        });
      }

      return {
        type: 'FunctionCall',
        name: funcToken.value,
        args,
        loc: { start, end }
      };
    }

    // Nếu hàm không có dấu ngoặc (ví dụ: √4 khi nhập văn bản tự do)
    // Phân tích toán hạng đơn tiếp theo với mức ưu tiên cao
    const arg = this.parseExpression(Precedence.CALL);
    args.push(arg);

    return {
      type: 'FunctionCall',
      name: funcToken.value,
      args,
      loc: { start, end: arg.loc.end }
    };
  }

  /**
   * Xác định xem giữa nút bên trái và token tiếp theo có xảy ra phép nhân ngầm hay không
   */
  private shouldInsertImplicitMul(left: ASTNode, next: Token): 'TYPE_A' | 'TYPE_B' | null {
    // Không nhân ngầm nếu token tiếp theo là toán tử rõ ràng hoặc kết thúc
    if (
      next.type === 'PLUS' ||
      next.type === 'MINUS' ||
      next.type === 'MULTIPLY' ||
      next.type === 'DIVIDE' ||
      next.type === 'POWER' ||
      next.type === 'FRAC' ||
      next.type === 'NPR' ||
      next.type === 'NCR' ||
      next.type === 'COMMA' ||
      next.type === 'RPAREN' ||
      next.type === 'FACTORIAL' ||
      next.type === 'SQUARE' ||
      next.type === 'CUBE' ||
      next.type === 'RECIPROCAL' ||
      next.type === 'PERCENT' ||
      next.type === 'DEGREE' ||
      next.type === 'EOF'
    ) {
      return null;
    }

    // Quy tắc Type A: Nhân ngầm ngay trước Biến, Hằng số (π, e) hoặc Hàm (sin, √, ln)
    // Ví dụ: 2π, 2x, 2sin(30), (2+3)π, 5!x
    if (next.type === 'VARIABLE' || next.type === 'CONSTANT' || next.type === 'FUNCTION') {
      return 'TYPE_A';
    }

    // Quy tắc Type B: Nhân ngầm ngay trước dấu ngoặc đơn mở '('
    // Ví dụ: 2(1+2), (2+3)(4+5), 5!(2+3)
    if (next.type === 'LPAREN') {
      return 'TYPE_B';
    }

    // Nếu token tiếp theo là NUMBER:
    // Chỉ được phép nhân ngầm nếu nút bên trái là ParenthesisNode hoặc PostfixOpNode
    // Ví dụ: (2+3)4 -> (5) * 4; 5! 2 -> 120 * 2
    // KHÔNG cho phép nếu bên trái là NumberNode (ví dụ 2 3 là lỗi cú pháp hai số liền nhau)
    if (next.type === 'NUMBER') {
      if (left.type === 'Parenthesis' || left.type === 'PostfixOp' || left.type === 'Variable' || left.type === 'Constant') {
        return 'TYPE_B';
      }
      // Hai số liền nhau không có toán tử -> Báo lỗi cú pháp
      throw new CasioSyntaxError({
        code: 'UNEXPECTED_TOKEN',
        message: `Số '${next.value}' đứng liền sau số trước đó mà không có toán tử`,
        position: next.start,
        length: next.end - next.start,
        rawExpression: this.rawInput
      });
    }

    return null;
  }

  /**
   * Lấy mức độ ưu tiên của toán tử trung tố / hậu tố
   */
  private getInfixPrecedence(token: Token): Precedence {
    switch (token.type) {
      case 'PLUS':
      case 'MINUS':
        return Precedence.ADD_SUB;
      case 'MULTIPLY':
      case 'DIVIDE':
        return Precedence.MUL_DIV;
      case 'NPR':
      case 'NCR':
        return Precedence.PERM_COMB;
      case 'POWER':
        return Precedence.POWER;
      case 'FRAC':
        return Precedence.FRACTION;
      case 'FACTORIAL':
      case 'SQUARE':
      case 'CUBE':
      case 'RECIPROCAL':
      case 'PERCENT':
      case 'DEGREE':
        return Precedence.POSTFIX;
      default:
        return Precedence.NONE;
    }
  }

  private peek(): Token {
    if (this.current < this.tokens.length) {
      return this.tokens[this.current];
    }
    return this.tokens[this.tokens.length - 1];
  }

  private advance(): Token {
    if (this.current < this.tokens.length) {
      this.current++;
    }
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length || this.tokens[this.current].type === 'EOF';
  }
}
