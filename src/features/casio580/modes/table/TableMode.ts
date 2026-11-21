import { TableGenerator } from './TableGenerator';
import { TableType, TableRange, TableResult, TableRow } from './types';
import { CoreMathEngine } from '../../engine/evaluator';

/**
 * Bộ điều khiển chế độ Bảng giá trị (Mode 9: TABLE) chuẩn Casio fx-580VN X
 */
export class TableMode {
  private generator: TableGenerator;
  private functionF: string = '';
  private functionG: string = '';
  private tableType: TableType = 'F_AND_G';
  private range: TableRange = { start: 1, end: 5, step: 1 };
  private lastResult: TableResult | null = null;

  constructor(engine?: CoreMathEngine) {
    this.generator = new TableGenerator(engine);
  }

  public setTableType(type: TableType): void {
    this.tableType = type;
  }

  public getTableType(): TableType {
    return this.tableType;
  }

  public setFunctionF(expr: string): void {
    this.functionF = expr;
  }

  public getFunctionF(): string {
    return this.functionF;
  }

  public setFunctionG(expr: string): void {
    this.functionG = expr;
  }

  public getFunctionG(): string {
    return this.functionG;
  }

  public setRange(range: TableRange): void {
    this.range = { ...range };
  }

  public getRange(): TableRange {
    return { ...this.range };
  }

  public generate(): TableResult {
    const res = this.generator.generateTable(
      this.functionF,
      this.range,
      this.functionG,
      this.tableType
    );
    this.lastResult = res;
    return res;
  }

  public getLastResult(): TableResult | null {
    return this.lastResult;
  }

  public getRows(): TableRow[] {
    return this.lastResult?.rows || [];
  }
}
