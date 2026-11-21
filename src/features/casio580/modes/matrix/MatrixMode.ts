import { Matrix, MatrixValue } from './Matrix';
import { MatrixId } from './types';
import { Decimal } from '../../engine/decimal';
import { MathError } from '../../engine/errors';

/**
 * Quản lý chế độ tính toán Ma trận (Mode 4: Matrix) chuẩn Casio fx-580VN X
 */
export class MatrixMode {
  private matrices: Map<MatrixId, Matrix> = new Map();

  constructor() {
    // Khởi tạo các ma trận rỗng
  }

  public defineMatrix(
    id: MatrixId,
    rowsOrData: number | MatrixValue[][],
    cols?: number,
    initialData?: MatrixValue[][]
  ): Matrix {
    if (Array.isArray(rowsOrData)) {
      const mat = Matrix.fromArray(rowsOrData);
      this.matrices.set(id, mat);
      return mat;
    }

    if (initialData) {
      const mat = Matrix.fromArray(initialData);
      this.matrices.set(id, mat);
      return mat;
    }

    const c = cols ?? rowsOrData;
    const mat = Matrix.zeros(rowsOrData, c);
    this.matrices.set(id, mat);
    return mat;
  }

  public setMatrix(id: MatrixId, matrix: Matrix): void {
    this.matrices.set(id, matrix);
  }

  public getMatrix(id: MatrixId): Matrix {
    const mat = this.matrices.get(id);
    if (!mat) {
      throw new MathError({
        code: 'UNDEFINED_VARIABLE',
        message: `Ma trận ${id} chưa được định nghĩa`
      });
    }
    return mat;
  }

  public hasMatrix(id: MatrixId): boolean {
    return this.matrices.has(id);
  }

  public setCell(id: MatrixId, row: number, col: number, value: MatrixValue): void {
    const current = this.getMatrix(id);
    const updated = current.set(row, col, value);
    this.matrices.set(id, updated);
  }

  public add(id1: MatrixId, id2: MatrixId): Matrix {
    const m1 = this.getMatrix(id1);
    const m2 = this.getMatrix(id2);
    const result = m1.add(m2);
    this.matrices.set('MatAns', result);
    return result;
  }

  public sub(id1: MatrixId, id2: MatrixId): Matrix {
    const m1 = this.getMatrix(id1);
    const m2 = this.getMatrix(id2);
    const result = m1.sub(m2);
    this.matrices.set('MatAns', result);
    return result;
  }

  public mul(id1: MatrixId, id2: MatrixId): Matrix {
    const m1 = this.getMatrix(id1);
    const m2 = this.getMatrix(id2);
    const result = m1.mul(m2);
    this.matrices.set('MatAns', result);
    return result;
  }

  public mulScalar(id: MatrixId, scalar: MatrixValue): Matrix {
    const m = this.getMatrix(id);
    const result = m.mulScalar(scalar);
    this.matrices.set('MatAns', result);
    return result;
  }

  public transpose(id: MatrixId): Matrix {
    const m = this.getMatrix(id);
    const result = m.transpose();
    this.matrices.set('MatAns', result);
    return result;
  }

  public det(id: MatrixId): Decimal {
    const m = this.getMatrix(id);
    return m.det();
  }

  public inv(id: MatrixId): Matrix {
    const m = this.getMatrix(id);
    const result = m.inv();
    this.matrices.set('MatAns', result);
    return result;
  }

  public pow(id: MatrixId, exp: number): Matrix {
    const m = this.getMatrix(id);
    const result = m.pow(exp);
    this.matrices.set('MatAns', result);
    return result;
  }
}
