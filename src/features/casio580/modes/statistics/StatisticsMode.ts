import { computeStat1Var } from './Stat1Var';
import { computeStat2Var } from './Stat2Var';
import {
  StatDataPoint1Var,
  StatDataPoint2Var,
  StatResult1Var,
  StatResult2Var
} from './types';
import { MathError } from '../../engine/errors';

export type StatisticsSubMode = '1-VAR' | '2-VAR';

/**
 * Bộ điều khiển chế độ Thống kê (Mode 6: STATISTICS) chuẩn Casio fx-580VN X
 */
export class StatisticsMode {
  private subMode: StatisticsSubMode = '1-VAR';
  private data1Var: StatDataPoint1Var[] = [];
  private data2Var: StatDataPoint2Var[] = [];
  private lastResult1Var: StatResult1Var | null = null;
  private lastResult2Var: StatResult2Var | null = null;

  public setSubMode(mode: StatisticsSubMode): void {
    this.subMode = mode;
    this.clear();
  }

  public getSubMode(): StatisticsSubMode {
    return this.subMode;
  }

  public clear(): void {
    this.data1Var = [];
    this.data2Var = [];
    this.lastResult1Var = null;
    this.lastResult2Var = null;
  }

  // --- Dành cho 1-Variable ---
  public addDataPoint1Var(x: number, freq: number = 1): void {
    this.data1Var.push({ x, freq });
  }

  public setData1Var(data: StatDataPoint1Var[]): void {
    this.data1Var = [...data];
  }

  public getData1Var(): StatDataPoint1Var[] {
    return [...this.data1Var];
  }

  public calculate1Var(): StatResult1Var {
    const res = computeStat1Var(this.data1Var);
    this.lastResult1Var = res;
    return res;
  }

  public getLastResult1Var(): StatResult1Var | null {
    return this.lastResult1Var;
  }

  // --- Dành cho 2-Variable (Linear Regression: y = a + bx) ---
  public addDataPoint2Var(x: number, y: number, freq: number = 1): void {
    this.data2Var.push({ x, y, freq });
  }

  public setData2Var(data: StatDataPoint2Var[]): void {
    this.data2Var = [...data];
  }

  public getData2Var(): StatDataPoint2Var[] {
    return [...this.data2Var];
  }

  public calculate2Var(): StatResult2Var {
    const res = computeStat2Var(this.data2Var);
    this.lastResult2Var = res;
    return res;
  }

  public getLastResult2Var(): StatResult2Var | null {
    return this.lastResult2Var;
  }

  /**
   * Dự đoán y theo x: ŷ = a + bx
   */
  public estimateY(x: number): number {
    const res = this.lastResult2Var || this.calculate2Var();
    return res.a + res.b * x;
  }

  /**
   * Dự đoán x theo y: x̂ = (y - a) / b
   */
  public estimateX(y: number): number {
    const res = this.lastResult2Var || this.calculate2Var();
    if (Math.abs(res.b) < 1e-15) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: 'Không thể ước lượng x: hệ số góc b = 0'
      });
    }
    return (y - res.a) / res.b;
  }
}
