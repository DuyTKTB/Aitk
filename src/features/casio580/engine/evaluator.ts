import {
  ASTNode,
  BinaryOpNode,
  ConstantNode,
  FractionNode,
  FunctionCallNode,
  ImplicitMulNode,
  NumberNode,
  PostfixOpNode,
  UnaryOpNode,
  VariableNode
} from '../parser/ast';
import { parseExpression } from '../parser/index';
import { Decimal } from './decimal';
import { Fraction } from './fraction';
import { CalculationResult, DisplayMode, RadicalForm } from './result';
import { MathError } from './errors';
import { AngleUnit, evalTrig } from './trig';
import { evalLogarithm } from './logarithm';

export interface EvaluationContext {
  variables?: Map<string, CalculationResult>;
  ans?: CalculationResult;
  displayMode?: DisplayMode;
  fixSciDigits?: number;
  angleUnit?: AngleUnit;
}

/**
 * Thuật toán tính căn bậc hai số nguyên chính xác (Integer Square Root) cho BigInt
 */
function isqrt(n: bigint): bigint {
  if (n < 0n) return -1n;
  if (n === 0n) return 0n;
  let x0 = n / 2n;
  if (x0 === 0n) x0 = 1n;
  let x1 = (x0 + n / x0) / 2n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + n / x0) / 2n;
  }
  return x0;
}

/**
 * Rút gọn căn bậc hai số nguyên: √n = coefficient × √radicand
 * Thuật toán: tách thừa số bình phương lớn nhất k² sao cho n = k² × m, m square-free
 * Ví dụ: √12 = √(4×3) = 2√3 → { coefficient: 2n, radicand: 3n }
 * FEAT-MTH-03
 */
function simplifyRadical(n: bigint): { coefficient: bigint; radicand: bigint } {
  if (n <= 0n) return { coefficient: 1n, radicand: n };

  let coefficient = 1n;
  let radicand = n;

  // Thử chia cho các thừa số nguyên tố p² từ nhỏ đến lớn
  // Giới hạn đến sqrt(n) để hiệu quả
  let p = 2n;
  while (p * p <= radicand) {
    while (radicand % (p * p) === 0n) {
      coefficient *= p;
      radicand /= (p * p);
    }
    p++;
  }

  // Kiểm tra xem radicand có phải là bình phương không
  const sqr = isqrt(radicand);
  if (sqr * sqr === radicand) {
    coefficient *= sqr;
    radicand = 1n;
  }

  return { coefficient, radicand };
}

/**
 * Tính giai thừa n! bằng BigInt
 */
function factorial(n: number): bigint {
  if (n < 0 || n > 69) {
    throw new MathError({
      code: 'INVALID_FACTORIAL',
      message: 'Giai thừa chỉ hợp lệ cho số nguyên n với 0 ≤ n ≤ 69'
    });
  }
  let res = 1n;
  for (let i = 2n; i <= BigInt(n); i++) {
    res *= i;
  }
  return res;
}

/**
 * Bộ máy đánh giá và tính toán biểu thức lõi (Core Math Evaluation Engine)
 * Tái tạo độ chính xác số học của Casio ClassWiz fx-580VN X
 */
export class CoreMathEngine {
  private variables: Map<string, CalculationResult> = new Map();
  private ans: CalculationResult = CalculationResult.zero();
  private displayMode: DisplayMode = 'NORM1';
  private angleUnit: AngleUnit = 'DEG';

  constructor(context?: EvaluationContext) {
    if (context?.variables) {
      this.variables = new Map(context.variables);
    }
    if (context?.ans) {
      this.ans = context.ans;
    }
    if (context?.displayMode) {
      this.displayMode = context.displayMode;
    }
    if (context?.angleUnit) {
      this.angleUnit = context.angleUnit;
    }
  }

  public setVariable(name: string, value: CalculationResult): void {
    this.variables.set(name.toUpperCase(), value);
  }

  public getVariable(name: string): CalculationResult {
    const key = name.toUpperCase();
    if (key === 'ANS') {
      return this.ans;
    }
    return this.variables.get(key) || CalculationResult.zero();
  }

  public setAns(result: CalculationResult): void {
    this.ans = result;
  }

  public getAns(): CalculationResult {
    return this.ans;
  }

  public setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
  }

  public setAngleUnit(unit: AngleUnit): void {
    this.angleUnit = unit;
  }

  public getAngleUnit(): AngleUnit {
    return this.angleUnit;
  }

  /**
   * Tính toán trực tiếp từ chuỗi biểu thức toán học
   */
  public evaluateExpression(expr: string, context?: EvaluationContext): CalculationResult {
    const ast = parseExpression(expr);
    return this.evaluate(ast, context);
  }

  /**
   * Tính toán cây cú pháp AST đã được phân tích
   */
  public evaluate(ast: ASTNode, context?: EvaluationContext): CalculationResult {
    const ctx = context || {
      variables: this.variables,
      ans: this.ans,
      displayMode: this.displayMode,
      angleUnit: this.angleUnit
    };

    const res = this.evalNode(ast, ctx);

    // Cập nhật biến Ans cho lần tính sau
    this.ans = res;
    return res;
  }

  private evalNode(node: ASTNode, ctx: EvaluationContext): CalculationResult {
    switch (node.type) {
      case 'Number':
        return this.evalNumber(node);
      case 'Variable':
        return this.evalVariable(node, ctx);
      case 'Constant':
        return this.evalConstant(node);
      case 'UnaryOp':
        return this.evalUnaryOp(node, ctx);
      case 'PostfixOp':
        return this.evalPostfixOp(node, ctx);
      case 'BinaryOp':
        return this.evalBinaryOp(node, ctx);
      case 'ImplicitMul':
        return this.evalImplicitMul(node, ctx);
      case 'Fraction':
        return this.evalFraction(node, ctx);
      case 'Parenthesis':
        return this.evalNode(node.content, ctx);
      case 'FunctionCall':
        return this.evalFunctionCall(node, ctx);
      default:
        throw new MathError({
          code: 'MATH_ERROR',
          message: `Nút AST không được hỗ trợ trong phiên bản hiện tại: ${(node as any).type}`
        });
    }
  }

  private evalNumber(node: NumberNode): CalculationResult {
    const raw = node.value;
    const hasDecimal = raw.includes('.');
    const frac = Fraction.fromNumberString(raw);
    return CalculationResult.fromFraction(frac, hasDecimal);
  }

  private evalVariable(node: VariableNode, ctx: EvaluationContext): CalculationResult {
    const key = node.name.toUpperCase();
    if (key === 'ANS') {
      return ctx.ans || this.ans;
    }
    const vars = ctx.variables || this.variables;
    return vars.get(key) || CalculationResult.zero();
  }

  private evalConstant(node: ConstantNode): CalculationResult {
    if (node.name === 'π') {
      // Giá trị pi với 20 chữ số bảo vệ
      const piDecimal = Decimal.fromString('3.14159265358979323846');
      return CalculationResult.fromDecimal(piDecimal, true);
    }
    if (node.name === 'e') {
      // Hằng số Euler e với 20 chữ số bảo vệ
      const eDecimal = Decimal.fromString('2.71828182845904523536');
      return CalculationResult.fromDecimal(eDecimal, true);
    }
    throw new MathError({
      code: 'MATH_ERROR',
      message: `Hằng số chưa biết: ${node.name}`,
      loc: node.loc
    });
  }

  private evalUnaryOp(node: UnaryOpNode, ctx: EvaluationContext): CalculationResult {
    const arg = this.evalNode(node.argument, ctx);

    if (node.op === '+') {
      return arg;
    }

    if (node.op === '-') {
      if (arg.exactFraction) {
        return new CalculationResult(
          arg.decimal.neg(),
          arg.exactFraction.neg(),
          arg.hasDecimalInput
        );
      }
      return CalculationResult.fromDecimal(arg.decimal.neg(), arg.hasDecimalInput);
    }

    throw new MathError({
      code: 'MATH_ERROR',
      message: `Toán tử một ngôi không hỗ trợ: ${node.op}`,
      loc: node.loc
    });
  }

  private evalPostfixOp(node: PostfixOpNode, ctx: EvaluationContext): CalculationResult {
    const arg = this.evalNode(node.argument, ctx);

    switch (node.op) {
      // 1. Bình phương x²
      case '²': {
        if (arg.exactFraction) {
          const frac = arg.exactFraction.pow(2n);
          return CalculationResult.fromFraction(frac, arg.hasDecimalInput);
        }
        const dec = arg.decimal.pow(Decimal.fromNumber(2));
        return CalculationResult.fromDecimal(dec, arg.hasDecimalInput);
      }

      // 2. Lập phương x³
      case '³': {
        if (arg.exactFraction) {
          const frac = arg.exactFraction.pow(3n);
          return CalculationResult.fromFraction(frac, arg.hasDecimalInput);
        }
        const dec = arg.decimal.pow(Decimal.fromNumber(3));
        return CalculationResult.fromDecimal(dec, arg.hasDecimalInput);
      }

      // 3. Nghịch đảo x⁻¹ (1/x)
      case '⁻¹': {
        if (arg.decimal.isZero()) {
          throw new MathError({
            code: 'DIVISION_BY_ZERO',
            message: 'Phép chia cho 0 khi tính nghịch đảo',
            loc: node.loc
          });
        }
        if (arg.exactFraction) {
          const frac = arg.exactFraction.pow(-1n);
          return CalculationResult.fromFraction(frac, arg.hasDecimalInput);
        }
        const dec = Decimal.one().div(arg.decimal);
        return CalculationResult.fromDecimal(dec, arg.hasDecimalInput);
      }

      // 4. Phần trăm % (x / 100)
      case '%': {
        const hundred = Fraction.fromBigInt(100n);
        if (arg.exactFraction) {
          const frac = arg.exactFraction.div(hundred);
          return CalculationResult.fromFraction(frac, arg.hasDecimalInput);
        }
        const dec = arg.decimal.div(Decimal.fromNumber(100));
        return CalculationResult.fromDecimal(dec, arg.hasDecimalInput);
      }

      // 5. Giai thừa n!
      case '!': {
        if (!arg.decimal.isInteger() || arg.decimal.isNegative()) {
          throw new MathError({
            code: 'INVALID_FACTORIAL',
            message: 'Giai thừa chỉ áp dụng cho số tự nhiên không âm (0, 1, 2, ...)',
            loc: node.loc
          });
        }
        const n = Number(arg.decimal.toBigInt());
        const factVal = factorial(n);
        return CalculationResult.fromFraction(Fraction.fromBigInt(factVal), false);
      }

      // 6. Ký hiệu độ °
      case '°': {
        return arg;
      }

      default:
        throw new MathError({
          code: 'MATH_ERROR',
          message: `Toán tử hậu tố không được hỗ trợ: ${node.op}`,
          loc: node.loc
        });
    }
  }

  private evalBinaryOp(node: BinaryOpNode, ctx: EvaluationContext): CalculationResult {
    const left = this.evalNode(node.left, ctx);
    const right = this.evalNode(node.right, ctx);
    const hasDecimal = left.hasDecimalInput || right.hasDecimalInput;

    switch (node.op) {
      // 1. Phép cộng
      case '+': {
        if (left.exactFraction && right.exactFraction) {
          const frac = left.exactFraction.add(right.exactFraction);
          return CalculationResult.fromFraction(frac, hasDecimal);
        }
        return CalculationResult.fromDecimal(left.decimal.add(right.decimal), hasDecimal);
      }

      // 2. Phép trừ
      case '-': {
        if (left.exactFraction && right.exactFraction) {
          const frac = left.exactFraction.sub(right.exactFraction);
          return CalculationResult.fromFraction(frac, hasDecimal);
        }
        return CalculationResult.fromDecimal(left.decimal.sub(right.decimal), hasDecimal);
      }

      // 3. Phép nhân
      case '×': {
        if (left.exactFraction && right.exactFraction) {
          const frac = left.exactFraction.mul(right.exactFraction);
          return CalculationResult.fromFraction(frac, hasDecimal);
        }
        return CalculationResult.fromDecimal(left.decimal.mul(right.decimal), hasDecimal);
      }

      // 4. Phép chia
      case '÷': {
        if (right.decimal.isZero()) {
          throw new MathError({
            code: 'DIVISION_BY_ZERO',
            message: 'Phép chia cho 0',
            loc: node.loc
          });
        }
        if (left.exactFraction && right.exactFraction) {
          const frac = left.exactFraction.div(right.exactFraction);
          return CalculationResult.fromFraction(frac, hasDecimal);
        }
        return CalculationResult.fromDecimal(left.decimal.div(right.decimal), hasDecimal);
      }

      // 5. Phép lũy thừa x^y
      case '^': {
        return this.evalPower(left, right, node);
      }

      // 6. Chỉnh hợp nPr = n! / (n - r)!
      case 'P': {
        return this.evalPermutation(left, right, node);
      }

      // 7. Tổ hợp nCr = n! / (r! * (n - r)!)
      case 'C': {
        return this.evalCombination(left, right, node);
      }

      default:
        throw new MathError({
          code: 'MATH_ERROR',
          message: `Toán tử hai ngôi chưa được hỗ trợ: ${node.op}`,
          loc: node.loc
        });
    }
  }

  private evalImplicitMul(node: ImplicitMulNode, ctx: EvaluationContext): CalculationResult {
    const left = this.evalNode(node.left, ctx);
    const right = this.evalNode(node.right, ctx);
    const hasDecimal = left.hasDecimalInput || right.hasDecimalInput;

    if (left.exactFraction && right.exactFraction) {
      const frac = left.exactFraction.mul(right.exactFraction);
      return CalculationResult.fromFraction(frac, hasDecimal);
    }
    return CalculationResult.fromDecimal(left.decimal.mul(right.decimal), hasDecimal);
  }

  private evalFraction(node: FractionNode, ctx: EvaluationContext): CalculationResult {
    const num = this.evalNode(node.numerator, ctx);
    const den = this.evalNode(node.denominator, ctx);

    if (den.decimal.isZero()) {
      throw new MathError({
        code: 'DIVISION_BY_ZERO',
        message: 'Mẫu số của phân số không thể bằng 0',
        loc: node.loc
      });
    }

    const hasDecimal = num.hasDecimalInput || den.hasDecimalInput;
    if (num.exactFraction && den.exactFraction) {
      const frac = num.exactFraction.div(den.exactFraction);
      return CalculationResult.fromFraction(frac, hasDecimal);
    }

    return CalculationResult.fromDecimal(num.decimal.div(den.decimal), hasDecimal);
  }

  private evalPower(left: CalculationResult, right: CalculationResult, node: BinaryOpNode): CalculationResult {
    // 0^0 không xác định trên Casio fx-580VN X -> Math ERROR
    if (left.decimal.isZero() && right.decimal.isZero()) {
      throw new MathError({
        code: 'INVALID_POWER',
        message: '0^0 không xác định trên máy tính Casio fx-580VN X',
        loc: node.loc
      });
    }

    // 0^-n -> chia cho 0 -> Math ERROR
    if (left.decimal.isZero() && right.decimal.isNegative()) {
      throw new MathError({
        code: 'DIVISION_BY_ZERO',
        message: '0 không thể có số mũ âm',
        loc: node.loc
      });
    }

    const hasDecimal = left.hasDecimalInput || right.hasDecimalInput;

    // Nếu số mũ là số nguyên nhỏ và cơ số là phân số chính xác
    if (left.exactFraction && right.decimal.isInteger()) {
      const expInt = Number(right.decimal.toBigInt());
      if (Math.abs(expInt) <= 100) {
        const frac = left.exactFraction.pow(BigInt(expInt));
        return CalculationResult.fromFraction(frac, hasDecimal);
      }
    }

    // Cơ số âm với số mũ không nguyên
    if (left.decimal.isNegative() && !right.decimal.isInteger()) {
      throw new MathError({
        code: 'INVALID_POWER',
        message: 'Cơ số âm không thể có số mũ không nguyên trong tập số thực',
        loc: node.loc
      });
    }

    const dec = left.decimal.pow(right.decimal);
    return CalculationResult.fromDecimal(dec, hasDecimal);
  }

  private evalPermutation(left: CalculationResult, right: CalculationResult, node: BinaryOpNode): CalculationResult {
    if (!left.decimal.isInteger() || !right.decimal.isInteger() || left.decimal.isNegative() || right.decimal.isNegative()) {
      throw new MathError({
        code: 'INVALID_PERM_COMB',
        message: 'Chỉnh hợp nPr yêu cầu n và r là các số tự nhiên',
        loc: node.loc
      });
    }

    const n = Number(left.decimal.toBigInt());
    const r = Number(right.decimal.toBigInt());

    if (n < r || n > 69) {
      throw new MathError({
        code: 'INVALID_PERM_COMB',
        message: 'Chỉnh hợp nPr yêu cầu 0 ≤ r ≤ n ≤ 69',
        loc: node.loc
      });
    }

    const val = factorial(n) / factorial(n - r);
    return CalculationResult.fromFraction(Fraction.fromBigInt(val), false);
  }

  private evalCombination(left: CalculationResult, right: CalculationResult, node: BinaryOpNode): CalculationResult {
    if (!left.decimal.isInteger() || !right.decimal.isInteger() || left.decimal.isNegative() || right.decimal.isNegative()) {
      throw new MathError({
        code: 'INVALID_PERM_COMB',
        message: 'Tổ hợp nCr yêu cầu n và r là các số tự nhiên',
        loc: node.loc
      });
    }

    const n = Number(left.decimal.toBigInt());
    const r = Number(right.decimal.toBigInt());

    if (n < r || n > 69) {
      throw new MathError({
        code: 'INVALID_PERM_COMB',
        message: 'Tổ hợp nCr yêu cầu 0 ≤ r ≤ n ≤ 69',
        loc: node.loc
      });
    }

    const val = factorial(n) / (factorial(r) * factorial(n - r));
    return CalculationResult.fromFraction(Fraction.fromBigInt(val), false);
  }

  private evalFunctionCall(node: FunctionCallNode, ctx: EvaluationContext): CalculationResult {
    const fnName = node.name;
    // Đơn vị góc từ context hoặc engine
    const angleUnit: AngleUnit = ctx.angleUnit ?? this.angleUnit;

    // 1. Căn bậc hai: √(x) hoặc sqrt(x)
    if (fnName === '√' || fnName === 'sqrt') {
      if (node.args.length !== 1) {
        throw new MathError({ code: 'MATH_ERROR', message: 'Hàm căn bậc hai nhận 1 đối số', loc: node.loc });
      }
      const arg = this.evalNode(node.args[0], ctx);

      if (arg.decimal.isNegative()) {
        throw new MathError({
          code: 'MATH_ERROR',
          message: 'Căn bậc hai của số âm không xác định trong tập số thực',
          loc: node.loc
        });
      }

      if (arg.decimal.isZero()) {
        return CalculationResult.zero();
      }

      // Kiểm tra căn chính xác nếu là phân số và cả tử lẫn mẫu đều là số chính phương
      if (arg.exactFraction && !arg.hasDecimalInput) {
        const sqNum = isqrt(arg.exactFraction.num);
        const sqDen = isqrt(arg.exactFraction.den);
        if (sqNum * sqNum === arg.exactFraction.num && sqDen * sqDen === arg.exactFraction.den) {
          return CalculationResult.fromFraction(new Fraction(sqNum, sqDen), arg.hasDecimalInput);
        }

        // FEAT-MTH-03: Rút gọn dạng k√m với m square-free
        // Chỉ áp dụng khi là số nguyên dương (mẫu = 1)
        if (arg.exactFraction.den === 1n && arg.exactFraction.num > 0n) {
          const radical = simplifyRadical(arg.exactFraction.num);
          if (radical.radicand !== arg.exactFraction.num) {
            // Đã rút gọn được: √n = k√m
            const rootNum = Math.sqrt(arg.decimal.toNumber());
            const decResult = CalculationResult.fromDecimal(Decimal.fromNumber(rootNum), false);
            const radForm: RadicalForm = {
              coefficient: new Fraction(radical.coefficient, 1n),
              radicand: radical.radicand
            };
            decResult.radicalForm = radForm;
            decResult.currentView = 'EXACT';
            return decResult;
          }
          // m = n (square-free, coefficient = 1): √m hiển thị dạng "√m"
          if (radical.radicand > 1n) {
            const rootNum = Math.sqrt(arg.decimal.toNumber());
            const decResult = CalculationResult.fromDecimal(Decimal.fromNumber(rootNum), false);
            const radForm: RadicalForm = {
              coefficient: new Fraction(1n, 1n),
              radicand: radical.radicand
            };
            decResult.radicalForm = radForm;
            decResult.currentView = 'EXACT';
            return decResult;
          }
        }
      }

      // Căn số thực
      const rootNum = Math.sqrt(arg.decimal.toNumber());
      return CalculationResult.fromDecimal(Decimal.fromNumber(rootNum), true);
    }

    // 2. Trị tuyệt đối: abs(x)
    if (fnName === 'abs') {
      if (node.args.length !== 1) {
        throw new MathError({ code: 'MATH_ERROR', message: 'Hàm abs nhận 1 đối số', loc: node.loc });
      }
      const arg = this.evalNode(node.args[0], ctx);
      if (arg.exactFraction) {
        return CalculationResult.fromFraction(arg.exactFraction.abs(), arg.hasDecimalInput);
      }
      return CalculationResult.fromDecimal(arg.decimal.abs(), arg.hasDecimalInput);
    }

    // 3. Căn bậc n: root(n, x)
    if (fnName === 'root') {
      if (node.args.length !== 2) {
        throw new MathError({ code: 'MATH_ERROR', message: 'Hàm root(n, x) yêu cầu 2 đối số', loc: node.loc });
      }
      const nResult = this.evalNode(node.args[0], ctx);
      const xResult = this.evalNode(node.args[1], ctx);

      // x^(1/n)
      const expDecimal = Decimal.one().div(nResult.decimal);
      const rootDec = xResult.decimal.pow(expDecimal);
      return CalculationResult.fromDecimal(rootDec, true);
    }

    // 4. Hàm lượng giác (FEAT-MTH-06, FEAT-MTH-07)
    if (
      fnName === 'sin' || fnName === 'cos' || fnName === 'tan' ||
      fnName === 'sin⁻¹' || fnName === 'cos⁻¹' || fnName === 'tan⁻¹' ||
      fnName === 'arcsin' || fnName === 'arccos' || fnName === 'arctan'
    ) {
      const args = node.args.map(a => this.evalNode(a, ctx));
      return evalTrig(fnName, args, angleUnit);
    }

    // 5. Logarit và số mũ tự nhiên (FEAT-MTH-05)
    if (fnName === 'ln' || fnName === 'log' || fnName === 'e^') {
      const args = node.args.map(a => this.evalNode(a, ctx));
      return evalLogarithm(fnName, args);
    }

    throw new MathError({
      code: 'MATH_ERROR',
      message: `Hàm toán học '${fnName}' thuộc giai đoạn tiếp theo (T11+)`,
      loc: node.loc
    });
  }
}
