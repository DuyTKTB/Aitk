import { Decimal } from './decimal';
import { Fraction } from './fraction';

/**
 * Dạng căn rút gọn: coefficient × √radicand
 * Ví dụ: √12 = 2√3 → { coefficient: Fraction(2,1), radicand: 3n }
 * FEAT-MTH-03
 */
export interface RadicalForm {
  coefficient: Fraction;  // Hệ số k (luôn dương)
  radicand: bigint;       // m (square-free, không có thừa số bình phương)
}

/**
 * Kiểu định dạng hiển thị số của máy tính Casio
 */
export type DisplayMode = 'NORM1' | 'NORM2' | 'FIX' | 'SCI';

/**
 * Kết quả tính toán đầy đủ của Casio fx-580VN X
 * Lưu giữ cả dạng phân số chính xác (Exact Fraction) và dạng thập phân (Decimal)
 * Hỗ trợ chuyển đổi qua lại bằng phím S<=>D
 */
export class CalculationResult {
  public readonly decimal: Decimal;
  public readonly exactFraction: Fraction | null;
  public readonly hasDecimalInput: boolean;
  public currentView: 'EXACT' | 'DECIMAL';
  /**
   * Dạng căn rút gọn a√b (FEAT-MTH-03). Null nếu không áp dụng được.
   * Chỉ hiển thị khi currentView === 'EXACT'.
   */
  public radicalForm: RadicalForm | null;

  constructor(
    decimal: Decimal,
    exactFraction: Fraction | null = null,
    hasDecimalInput: boolean = false,
    radicalForm: RadicalForm | null = null
  ) {
    this.decimal = decimal;
    this.exactFraction = exactFraction;
    this.hasDecimalInput = hasDecimalInput;
    this.radicalForm = radicalForm;

    // Trong chế độ hiển thị tự nhiên (Natural Display):
    // - Nếu đầu vào chứa số thập phân (ví dụ 0.5 + 1/3) -> mặc định xem DECIMAL
    // - Nếu đầu vào hoàn toàn là số nguyên và phân số -> mặc định xem EXACT
    if (this.exactFraction && !this.hasDecimalInput && !this.exactFraction.isInteger()) {
      this.currentView = 'EXACT';
    } else {
      this.currentView = 'DECIMAL';
    }
  }

  public static fromDecimal(decimal: Decimal, hasDecimalInput: boolean = true): CalculationResult {
    return new CalculationResult(decimal, null, hasDecimalInput);
  }

  public static fromFraction(fraction: Fraction, hasDecimalInput: boolean = false): CalculationResult {
    const decimal = Decimal.fromFraction(fraction);
    return new CalculationResult(decimal, fraction, hasDecimalInput);
  }

  public static zero(): CalculationResult {
    return CalculationResult.fromFraction(Fraction.fromBigInt(0n));
  }

  /**
   * Chuyển đổi qua lại giữa dạng phân số và số thập phân (Phím S<=>D)
   */
  public toggleView(): void {
    if (this.exactFraction && !this.exactFraction.isInteger()) {
      this.currentView = this.currentView === 'EXACT' ? 'DECIMAL' : 'EXACT';
    }
  }

  /**
   * Lấy chuỗi hiển thị tương ứng với trạng thái xem hiện tại
   * Ưu tiên: radicalForm > exactFraction > decimal
   */
  public getDisplayText(mode: DisplayMode = 'NORM1', fixSciDigits?: number): string {
    if (this.currentView === 'EXACT') {
      // Dạng căn rút gọn (FEAT-MTH-03)
      if (this.radicalForm) {
        return this.formatRadical();
      }
      // Phân số chính xác
      if (this.exactFraction) {
        return this.formatFraction() || this.decimal.formatDisplay(mode, fixSciDigits);
      }
    }
    return this.decimal.formatDisplay(mode, fixSciDigits);
  }

  /**
   * Biểu diễn dạng căn rút gọn: "k√m" hoặc "√m" nếu k=1
   */
  public formatRadical(): string {
    if (!this.radicalForm) return this.decimal.formatDisplay('NORM1');
    const { coefficient, radicand } = this.radicalForm;
    const coeffStr = coefficient.toString(); // k là Fraction, luôn dương
    const sqrtStr = `√${radicand}`;
    if (coefficient.num === 1n && coefficient.den === 1n) {
      return sqrtStr;
    }
    if (coefficient.den === 1n) {
      return `${coeffStr}${sqrtStr}`;
    }
    // Phân số nhân với căn: (a/b)√m
    return `(${coeffStr})${sqrtStr}`;
  }

  /**
   * Biểu diễn dạng phân số chính tắc (a/b hoặc số nguyên a)
   */
  public formatFraction(): string | null {
    if (!this.exactFraction) return null;
    return this.exactFraction.toString();
  }

  /**
   * Biểu diễn dạng hỗn số: whole a/b (ví dụ: 1 1/2 cho 3/2)
   */
  public formatMixedFraction(): string | null {
    if (!this.exactFraction || this.exactFraction.isInteger()) return null;
    const mixed = this.exactFraction.toMixedFraction();
    if (mixed.whole === 0n) {
      return `${mixed.num}/${mixed.den}`;
    }
    return `${mixed.whole} ${mixed.num}/${mixed.den}`;
  }

  /**
   * Trả về chuỗi mô tả để debug
   */
  public toString(): string {
    return this.getDisplayText('NORM1');
  }

  public toNumber(): number {
    return this.decimal.toNumber();
  }

  public toDecimal(): Decimal {
    return this.decimal;
  }

  public toFractionString(): string {
    if (this.exactFraction) return this.exactFraction.toFractionString();
    return this.decimal.toNumber().toString();
  }
}
