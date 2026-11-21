import { CalculationResult } from '../engine/result';
import { Decimal } from '../engine/decimal';
import { Fraction } from '../engine/fraction';
import { sanitizeUserExpression } from './security';

export const VALID_VARIABLE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M', 'ANS'] as const;
export type VariableName = typeof VALID_VARIABLE_NAMES[number];

/**
 * Quản lý bộ nhớ tính toán độc lập của máy tính Casio fx-580VN X
 * Tách biệt hoàn toàn khỏi trạng thái giao diện UI
 * Quản lý 9 biến nhớ (A, B, C, D, E, F, x, y, M) và biến Ans
 */
export class MemoryStore {
  private variables: Map<VariableName, CalculationResult> = new Map();

  constructor() {
    this.resetAll();
  }

  public resetAll(): void {
    this.variables.clear();
    for (const name of VALID_VARIABLE_NAMES) {
      this.variables.set(name, CalculationResult.zero());
    }
  }

  public resetVariablesOnly(): void {
    const ans = this.getVariable('ANS');
    for (const name of VALID_VARIABLE_NAMES) {
      if (name !== 'ANS') {
        this.variables.set(name, CalculationResult.zero());
      }
    }
    this.variables.set('ANS', ans);
  }

  public setVariable(name: string, value: CalculationResult | number | string): void {
    const upper = name.toUpperCase() as VariableName;
    if (!VALID_VARIABLE_NAMES.includes(upper)) {
      return;
    }

    let calcResult: CalculationResult;
    if (value instanceof CalculationResult) {
      calcResult = value;
    } else if (typeof value === 'number') {
      calcResult = CalculationResult.fromDecimal(Decimal.fromNumber(value));
    } else {
      const cleanStr = sanitizeUserExpression(value);
      try {
        const frac = Fraction.fromNumberString(cleanStr);
        calcResult = CalculationResult.fromFraction(frac, cleanStr.includes('.'));
      } catch {
        calcResult = CalculationResult.zero();
      }
    }

    this.variables.set(upper, calcResult);
  }

  public getVariable(name: string): CalculationResult {
    const upper = name.toUpperCase() as VariableName;
    return this.variables.get(upper) || CalculationResult.zero();
  }

  public getVariableString(name: string): string {
    return this.getVariable(name).getDisplayText();
  }

  /**
   * Phím M+: Cộng giá trị vào biến M (M = M + value)
   */
  public addToM(value: CalculationResult): CalculationResult {
    const currentM = this.getVariable('M');
    const newDec = currentM.decimal.add(value.decimal);

    let newFrac: Fraction | null = null;
    if (currentM.exactFraction && value.exactFraction) {
      newFrac = currentM.exactFraction.add(value.exactFraction);
    }

    const res = newFrac
      ? CalculationResult.fromFraction(newFrac, currentM.hasDecimalInput || value.hasDecimalInput)
      : CalculationResult.fromDecimal(newDec, currentM.hasDecimalInput || value.hasDecimalInput);

    this.variables.set('M', res);
    return res;
  }

  /**
   * Phím M- (SHIFT M+): Trừ giá trị khỏi biến M (M = M - value)
   */
  public subtractFromM(value: CalculationResult): CalculationResult {
    const currentM = this.getVariable('M');
    const newDec = currentM.decimal.sub(value.decimal);

    let newFrac: Fraction | null = null;
    if (currentM.exactFraction && value.exactFraction) {
      newFrac = currentM.exactFraction.sub(value.exactFraction);
    }

    const res = newFrac
      ? CalculationResult.fromFraction(newFrac, currentM.hasDecimalInput || value.hasDecimalInput)
      : CalculationResult.fromDecimal(newDec, currentM.hasDecimalInput || value.hasDecimalInput);

    this.variables.set('M', res);
    return res;
  }

  /**
   * Kiểm tra biến M có khác 0 hay không (điều khiển biểu tượng 'M' trên thanh trạng thái)
   */
  public hasMemory(): boolean {
    const m = this.getVariable('M');
    return !m.decimal.isZero();
  }

  /**
   * Xuất toàn bộ biến sang định dạng record chuỗi có thể serialize
   */
  public exportRecord(): Record<string, string> {
    const rec: Record<string, string> = {};
    for (const name of VALID_VARIABLE_NAMES) {
      const val = this.variables.get(name);
      if (val && !val.decimal.isZero()) {
        rec[name] = val.getDisplayText();
      }
    }
    return rec;
  }

  /**
   * Khôi phục toàn bộ biến từ record đã serialize
   */
  public importRecord(record: Record<string, string>): void {
    this.resetAll();
    if (!record || typeof record !== 'object') return;

    for (const [key, val] of Object.entries(record)) {
      const upper = key.toUpperCase();
      if (VALID_VARIABLE_NAMES.includes(upper as VariableName) && typeof val === 'string') {
        this.setVariable(upper, val);
      }
    }
  }

  /**
   * Trả về bản sao Map để sử dụng trực tiếp trong EvaluationContext
   */
  public toMap(): Map<string, CalculationResult> {
    const map = new Map<string, CalculationResult>();
    for (const [key, val] of this.variables.entries()) {
      map.set(key, val);
    }
    return map;
  }
}
