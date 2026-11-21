import { CoreMathEngine, EvaluationContext } from '../../engine/evaluator';
import { Decimal } from '../../engine/decimal';
import { CalculationResult } from '../../engine/result';
import { MathError } from '../../engine/errors';
import { TableType, TableRange, TableRow, TableCell, TableResult } from './types';

export const MAX_ROWS_F_ONLY = 45;
export const MAX_ROWS_F_AND_G = 30;

/**
 * Thuật toán sinh bảng giá trị hàm số cho Mode 9 (TABLE)
 * Phục vụ chuẩn Casio fx-580VN X:
 * - Hỗ trợ f(x) độc lập (tối đa 45 dòng) hoặc f(x) và g(x) đồng thời (tối đa 30 dòng)
 * - Tự động bắt lỗi cục bộ từng ô (hiển thị ERROR) không làm crash toàn bảng
 * - Sử dụng Decimal để khử trôi sai số điểm trôi nổi trong các bước nhảy thập phân
 */
export class TableGenerator {
  private engine: CoreMathEngine;

  constructor(engine?: CoreMathEngine) {
    this.engine = engine || new CoreMathEngine();
  }

  public generateTable(
    functionF: string,
    range: TableRange,
    functionG?: string,
    type: TableType = functionG && functionG.trim().length > 0 ? 'F_AND_G' : 'F_ONLY'
  ): TableResult {
    const { start, end, step } = range;

    if (step <= 0) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: 'Bước nhảy (Step) phải lớn hơn 0'
      });
    }

    if (end < start) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: 'Giá trị End phải lớn hơn hoặc bằng Start'
      });
    }

    // Tính số dòng: floor((end - start) / step + 1e-9) + 1
    const totalRows = Math.floor((end - start) / step + 1e-9) + 1;
    const maxRows = type === 'F_ONLY' ? MAX_ROWS_F_ONLY : MAX_ROWS_F_AND_G;

    if (totalRows > maxRows) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Số lượng dòng trong bảng (${totalRows}) vượt quá giới hạn cho phép (${maxRows})`
      });
    }

    const rows: TableRow[] = [];
    const hasG = type === 'F_AND_G' && functionG !== undefined && functionG.trim().length > 0;

    const startDec = Decimal.fromNumber(start);
    const stepDec = Decimal.fromNumber(step);

    for (let i = 0; i < totalRows; i++) {
      // Tính x_i chính xác bằng Decimal: start + i * step
      const iDec = Decimal.fromNumber(i);
      const xDec = startDec.add(iDec.mul(stepDec));
      const xVal = CalculationResult.fromDecimal(xDec, startDec.toNumber() % 1 !== 0 || stepDec.toNumber() % 1 !== 0);

      const xCell: TableCell = {
        value: xVal,
        displayText: xVal.getDisplayText(),
        isError: false
      };

      // Đánh giá f(x) tại x_i
      const fCell = this.evaluateAt(functionF, xVal);

      // Đánh giá g(x) tại x_i nếu có
      let gCell: TableCell | undefined = undefined;
      if (hasG) {
        gCell = this.evaluateAt(functionG!, xVal);
      }

      rows.push({
        rowNumber: i + 1,
        x: xCell,
        f: fCell,
        g: gCell
      });
    }

    return {
      rows,
      totalRows,
      tableType: type,
      functionF,
      functionG: hasG ? functionG : undefined,
      range
    };
  }

  private evaluateAt(expr: string, xVal: CalculationResult): TableCell {
    if (!expr || expr.trim() === '') {
      return {
        value: null,
        displayText: '',
        isError: false
      };
    }

    try {
      const vars = new Map<string, CalculationResult>();
      vars.set('X', xVal);

      const ctx: EvaluationContext = {
        variables: vars,
        angleUnit: this.engine.getAngleUnit()
      };

      const res = this.engine.evaluateExpression(expr, ctx);
      return {
        value: res,
        displayText: res.getDisplayText(),
        isError: false
      };
    } catch {
      // Casio fx-580VN X hiển thị "ERROR" tại ô gặp lỗi miền xác định hoặc chia cho 0
      return {
        value: null,
        displayText: 'ERROR',
        isError: true
      };
    }
  }
}
