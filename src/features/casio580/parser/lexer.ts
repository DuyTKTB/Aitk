import { Token } from './tokens';
import { CasioSyntaxError } from './errors';

/**
 * Danh sách tên hàm khoa học được hỗ trợ trên Casio fx-580VN X
 */
const KNOWN_FUNCTIONS: Record<string, string> = {
  'sin⁻¹': 'sin⁻¹',
  'asin': 'sin⁻¹',
  'cos⁻¹': 'cos⁻¹',
  'acos': 'cos⁻¹',
  'tan⁻¹': 'tan⁻¹',
  'atan': 'tan⁻¹',
  'sinh': 'sinh',
  'cosh': 'cosh',
  'tanh': 'tanh',
  'sin': 'sin',
  'cos': 'cos',
  'tan': 'tan',
  'ln': 'ln',
  'log10': 'log',
  'log': 'log',
  'sqrt': '√',
  'root': 'root',
  'cbrt': 'cbrt',
  'abs': 'abs',
  'diff': 'diff',
  'd/dx': 'diff',
  '∫': '∫',
  'integral': '∫',
  'sum': 'sum',
  'Σ': 'sum'
};

/**
 * Bộ phân tích từ vựng (Lexer) cho Casio fx-580VN X
 */
export class Lexer {
  private input: string;
  private pos: number = 0;
  private length: number;

  constructor(input: string) {
    this.input = input;
    this.length = input.length;
  }

  /**
   * Phân tích toàn bộ chuỗi đầu vào thành danh sách các Token
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.length) {
      const ch = this.input[this.pos];

      // 1. Bỏ qua khoảng trắng
      if (/\s/.test(ch)) {
        this.pos++;
        continue;
      }

      // 2. Chữ số hoặc dấu chấm bắt đầu một số (.5, 0.5, 123)
      if (this.isDigit(ch) || (ch === '.' && this.isDigit(this.peekNext()))) {
        tokens.push(this.readNumber());
        continue;
      }

      // 3. Tiền tố ký pháp khoa học đứng đầu: ×10^ hoặc *10^ (ví dụ người dùng bấm phím [*10^x] ngay từ đầu)
      if (this.matchPrefix('×10^') || this.matchPrefix('*10^')) {
        tokens.push(this.readScientificNotationWithoutBase());
        continue;
      }

      // 4. Ký hiệu căn thức '√'
      if (ch === '√') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'FUNCTION', value: '√', start, end: this.pos });
        continue;
      }

      // 5. Hằng số π
      if (ch === 'π') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'CONSTANT', value: 'π', start, end: this.pos });
        continue;
      }

      // 6. Toán tử hậu tố lũy thừa mũ đặc biệt: ², ³, ⁻¹
      if (ch === '²') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'SQUARE', value: '²', start, end: this.pos });
        continue;
      }
      if (ch === '³') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'CUBE', value: '³', start, end: this.pos });
        continue;
      }
      if (this.matchPrefix('⁻¹')) {
        const start = this.pos;
        this.pos += 2;
        tokens.push({ type: 'RECIPROCAL', value: '⁻¹', start, end: this.pos });
        continue;
      }

      // 7. Toán tử hậu tố: !, %, °
      if (ch === '!') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'FACTORIAL', value: '!', start, end: this.pos });
        continue;
      }
      if (ch === '%') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'PERCENT', value: '%', start, end: this.pos });
        continue;
      }
      if (ch === '°') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'DEGREE', value: '°', start, end: this.pos });
        continue;
      }

      // 8. Toán tử số học cơ bản
      if (ch === '+') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'PLUS', value: '+', start, end: this.pos });
        continue;
      }
      if (ch === '-' || ch === '−') { // Hỗ trợ cả ASCII '-' và Unicode minus '−' (U+2212)
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'MINUS', value: '-', start, end: this.pos });
        continue;
      }
      if (ch === '×' || ch === '*') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'MULTIPLY', value: '×', start, end: this.pos });
        continue;
      }
      if (ch === '÷' || ch === '/') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'DIVIDE', value: '÷', start, end: this.pos });
        continue;
      }
      if (ch === '^') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'POWER', value: '^', start, end: this.pos });
        continue;
      }
      if (ch === '⌟') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'FRAC', value: '⌟', start, end: this.pos });
        continue;
      }

      // 9. Dấu ngoặc và dấu phẩy
      if (ch === '(') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'LPAREN', value: '(', start, end: this.pos });
        continue;
      }
      if (ch === ')') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'RPAREN', value: ')', start, end: this.pos });
        continue;
      }
      if (ch === ',') {
        const start = this.pos;
        this.pos++;
        tokens.push({ type: 'COMMA', value: ',', start, end: this.pos });
        continue;
      }

      // 10. Từ khóa, tên hàm, biến hoặc hằng số chữ (chữ cái Latinh và ký tự toán học)
      if (this.isLetter(ch) || ch === '∫' || ch === 'Σ') {
        tokens.push(this.readIdentifierOrKeyword(tokens));
        continue;
      }

      // 11. Ký tự không xác định -> Syntax ERROR
      throw new CasioSyntaxError({
        code: 'UNEXPECTED_TOKEN',
        message: `Ký tự không hợp lệ '${ch}'`,
        position: this.pos,
        length: 1,
        rawExpression: this.input
      });
    }

    tokens.push({
      type: 'EOF',
      value: '',
      start: this.length,
      end: this.length
    });

    return tokens;
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isLetter(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  private peekNext(): string {
    return this.pos + 1 < this.length ? this.input[this.pos + 1] : '';
  }

  private matchPrefix(prefix: string): boolean {
    return this.input.startsWith(prefix, this.pos);
  }

  /**
   * Đọc số nguyên, số thực và ký pháp khoa học liên kết (ví dụ: 123, 3.14, 3×10^8, 2.5E-4)
   */
  private readNumber(): Token {
    const start = this.pos;
    let dotSeen = false;

    while (this.pos < this.length) {
      const ch = this.input[this.pos];
      if (this.isDigit(ch)) {
        this.pos++;
      } else if (ch === '.') {
        if (dotSeen) {
          throw new CasioSyntaxError({
            code: 'INVALID_NUMBER',
            message: 'Định dạng số không hợp lệ: chứa nhiều dấu chấm thập phân',
            position: this.pos,
            length: 1,
            rawExpression: this.input
          });
        }
        dotSeen = true;
        this.pos++;
      } else {
        break;
      }
    }

    // Kiểm tra ký pháp khoa học gắn liền: ×10^... hoặc *10^... hoặc e... / E...
    if (this.matchPrefix('×10^') || this.matchPrefix('*10^')) {
      this.pos += 4;
      this.readExponentDigits();
    } else if (this.pos < this.length && (this.input[this.pos] === 'e' || this.input[this.pos] === 'E')) {
      // Chỉ xem là ký pháp khoa học nếu sau e/E là chữ số hoặc dấu + / - và chữ số
      const nextChar = this.peekNext();
      if (this.isDigit(nextChar) || ((nextChar === '+' || nextChar === '-' || nextChar === '−') && this.isDigit(this.peekCharAt(this.pos + 2)))) {
        this.pos++;
        if (this.input[this.pos] === '+' || this.input[this.pos] === '-' || this.input[this.pos] === '−') {
          this.pos++;
        }
        this.readDigitsOnly();
      }
    }

    return {
      type: 'NUMBER',
      value: this.input.slice(start, this.pos),
      start,
      end: this.pos
    };
  }

  private readScientificNotationWithoutBase(): Token {
    const start = this.pos;
    this.pos += 4; // Bỏ qua '×10^' hoặc '*10^'
    this.readExponentDigits();
    return {
      type: 'NUMBER',
      value: this.input.slice(start, this.pos),
      start,
      end: this.pos
    };
  }

  private readExponentDigits(): void {
    if (this.pos < this.length && (this.input[this.pos] === '-' || this.input[this.pos] === '−' || this.input[this.pos] === '+')) {
      this.pos++;
    }
    if (this.pos >= this.length || !this.isDigit(this.input[this.pos])) {
      throw new CasioSyntaxError({
        code: 'UNEXPECTED_EOF',
        message: 'Thiếu số mũ sau ×10^',
        position: this.pos,
        length: 1,
        rawExpression: this.input
      });
    }
    this.readDigitsOnly();
  }

  private readDigitsOnly(): void {
    while (this.pos < this.length && this.isDigit(this.input[this.pos])) {
      this.pos++;
    }
  }

  private peekCharAt(idx: number): string {
    return idx < this.length ? this.input[idx] : '';
  }

  /**
   * Đọc tên hàm, hằng số 'e', biến (A-F, x, y, z, M, Ans) hoặc toán tử tổ hợp/chỉnh hợp P/C
   */
  private readIdentifierOrKeyword(tokensSoFar: Token[]): Token {
    const start = this.pos;

    // 1. Kiểm tra các hàm có ký tự đặc biệt như sin⁻¹, cos⁻¹, tan⁻¹, d/dx
    for (const [kw, normalized] of Object.entries(KNOWN_FUNCTIONS)) {
      if (this.matchPrefix(kw)) {
        this.pos += kw.length;
        return {
          type: 'FUNCTION',
          value: normalized,
          start,
          end: this.pos
        };
      }
    }

    // 2. Đọc từ chữ cái liên tiếp (không ngấu nghiến chữ số)
    while (this.pos < this.length && this.isLetter(this.input[this.pos])) {
      this.pos++;
    }
    const rawWord = this.input.slice(start, this.pos);

    // 3. Kiểm tra 'Ans' hoặc 'ans'
    if (rawWord.toLowerCase() === 'ans') {
      return { type: 'VARIABLE', value: 'Ans', start, end: this.pos };
    }

    // 4. Kiểm tra hằng số Euler 'e'
    if (rawWord === 'e') {
      return { type: 'CONSTANT', value: 'e', start, end: this.pos };
    }

    // 5. Kiểm tra hàm toán học thông dụng (sin, cos, tan, ln, log, sqrt, abs, diff, sum)
    const lower = rawWord.toLowerCase();
    if (KNOWN_FUNCTIONS[lower]) {
      return {
        type: 'FUNCTION',
        value: KNOWN_FUNCTIONS[lower],
        start,
        end: this.pos
      };
    }

    // 6. Kiểm tra Chỉnh hợp P (nPr) hoặc Tổ hợp C (nCr)
    // Nếu là 'P' hoặc 'C' đơn lẻ đứng sau toán hạng số/ngoặc/hậu tố -> Toán tử NPR / NCR
    if (rawWord === 'P' || rawWord === 'C') {
      const lastToken = tokensSoFar.length > 0 ? tokensSoFar[tokensSoFar.length - 1] : null;
      const canFollowExpression = lastToken && (
        lastToken.type === 'NUMBER' ||
        lastToken.type === 'RPAREN' ||
        lastToken.type === 'SQUARE' ||
        lastToken.type === 'CUBE' ||
        lastToken.type === 'RECIPROCAL' ||
        lastToken.type === 'FACTORIAL' ||
        lastToken.type === 'PERCENT'
      );

      if (canFollowExpression) {
        return {
          type: rawWord === 'P' ? 'NPR' : 'NCR',
          value: rawWord,
          start,
          end: this.pos
        };
      }
    }

    // 7. Biến đơn lẻ (A, B, C, D, E, F, x, y, z, M, hoặc ký tự viết thường tương ứng)
    if (rawWord.length === 1) {
      const varChar = rawWord.toUpperCase();
      const validVars = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'Z', 'M'];
      if (validVars.includes(varChar)) {
        return {
          type: 'VARIABLE',
          value: rawWord === 'x' ? 'x' : varChar, // Giữ 'x' quen thuộc hoặc chữ hoa
          start,
          end: this.pos
        };
      }
    }

    // 8. Nếu là nhiều biến viết liền nhau (ví dụ: xy, 2abc), tách biến đầu tiên
    if (rawWord.length > 1) {
      // Đặt lại con trỏ chỉ lấy 1 ký tự
      this.pos = start + 1;
      const firstChar = rawWord[0];
      const varChar = firstChar.toUpperCase();
      const validVars = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'Z', 'M'];
      if (validVars.includes(varChar)) {
        return {
          type: 'VARIABLE',
          value: firstChar === 'x' ? 'x' : varChar,
          start,
          end: this.pos
        };
      }
    }

    // Không nhận dạng được định danh
    throw new CasioSyntaxError({
      code: 'UNEXPECTED_TOKEN',
      message: `Định danh không nhận dạng được: '${rawWord}'`,
      position: start,
      length: rawWord.length,
      rawExpression: this.input
    });
  }
}
