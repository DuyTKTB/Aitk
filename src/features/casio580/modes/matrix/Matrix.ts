import { Fraction } from '../../engine/fraction';
import { Decimal } from '../../engine/decimal';
import { MathError, DimensionError } from '../../engine/errors';

export type MatrixValue = number | bigint | string | Fraction;

function toFraction(v: MatrixValue): Fraction {
  if (v instanceof Fraction) return v;
  if (typeof v === 'bigint') return Fraction.fromBigInt(v);
  if (typeof v === 'number') return Fraction.fromNumberString(v.toString());
  return Fraction.fromNumberString(v);
}

/**
 * Lớp đại diện Ma trận số học độ chính xác cao (Exact Fraction)
 * Hỗ trợ kích thước từ 1x1 đến 4x4 chuẩn Casio fx-580VN X (FEAT-MOD-04)
 */
export class Matrix {
  public readonly rows: number;
  public readonly cols: number;
  private readonly data: Fraction[][];

  constructor(rows: number, cols: number, initialData?: Fraction[][]) {
    if (rows < 1 || rows > 4 || cols < 1 || cols > 4) {
      throw new DimensionError(`Kích thước ma trận không hợp lệ (${rows}x${cols}). Casio chỉ hỗ trợ từ 1x1 đến 4x4`);
    }
    this.rows = rows;
    this.cols = cols;

    if (initialData) {
      this.data = initialData.map((row) => row.slice(0, cols));
    } else {
      this.data = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Fraction.fromBigInt(0n))
      );
    }
  }

  public static zeros(rows: number, cols: number): Matrix {
    return new Matrix(rows, cols);
  }

  public static identity(n: number): Matrix {
    if (n < 1 || n > 4) {
      throw new DimensionError(`Ma trận đơn vị yêu cầu cấp từ 1 đến 4 (nhận ${n})`);
    }
    const mat = new Matrix(n, n);
    for (let i = 0; i < n; i++) {
      mat.data[i][i] = Fraction.fromBigInt(1n);
    }
    return mat;
  }

  public static fromArray(arr: MatrixValue[][]): Matrix {
    const rows = arr.length;
    if (rows < 1 || rows > 4) {
      throw new DimensionError(`Số hàng ma trận ${rows} vượt giới hạn [1, 4]`);
    }
    const cols = arr[0].length;
    if (cols < 1 || cols > 4) {
      throw new DimensionError(`Số cột ma trận ${cols} vượt giới hạn [1, 4]`);
    }

    const data: Fraction[][] = [];
    for (let r = 0; r < rows; r++) {
      if (arr[r].length !== cols) {
        throw new DimensionError(`Hàng ${r} có số phần tử không đồng nhất`);
      }
      data.push(arr[r].map(toFraction));
    }

    return new Matrix(rows, cols, data);
  }

  public get(r: number, c: number): Fraction {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
      throw new DimensionError(`Vị trí (${r}, ${c}) nằm ngoài kích thước ma trận (${this.rows}x${this.cols})`);
    }
    return this.data[r][c];
  }

  public set(r: number, c: number, value: MatrixValue): Matrix {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
      throw new DimensionError(`Vị trí (${r}, ${c}) nằm ngoài kích thước ma trận`);
    }
    const copy = this.cloneData();
    copy[r][c] = toFraction(value);
    return new Matrix(this.rows, this.cols, copy);
  }

  public add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new DimensionError(`Phép cộng ma trận yêu cầu cùng kích thước: (${this.rows}x${this.cols}) + (${other.rows}x${other.cols})`);
    }
    const res: Fraction[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Fraction[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.data[r][c].add(other.data[r][c]));
      }
      res.push(row);
    }
    return new Matrix(this.rows, this.cols, res);
  }

  public sub(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new DimensionError(`Phép trừ ma trận yêu cầu cùng kích thước: (${this.rows}x${this.cols}) - (${other.rows}x${other.cols})`);
    }
    const res: Fraction[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Fraction[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.data[r][c].sub(other.data[r][c]));
      }
      res.push(row);
    }
    return new Matrix(this.rows, this.cols, res);
  }

  public mulScalar(k: MatrixValue): Matrix {
    const kFrac = toFraction(k);
    const res: Fraction[][] = [];
    for (let r = 0; r < this.rows; r++) {
      res.push(this.data[r].map((v) => v.mul(kFrac)));
    }
    return new Matrix(this.rows, this.cols, res);
  }

  public mul(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new DimensionError(`Phép nhân ma trận yêu cầu số cột ma trận 1 (${this.cols}) bằng số hàng ma trận 2 (${other.rows})`);
    }

    const res: Fraction[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Fraction[] = [];
      for (let c = 0; c < other.cols; c++) {
        let sum = Fraction.fromBigInt(0n);
        for (let k = 0; k < this.cols; k++) {
          sum = sum.add(this.data[r][k].mul(other.data[k][c]));
        }
        row.push(sum);
      }
      res.push(row);
    }
    return new Matrix(this.rows, other.cols, res);
  }

  public transpose(): Matrix {
    const res: Fraction[][] = [];
    for (let c = 0; c < this.cols; c++) {
      const row: Fraction[] = [];
      for (let r = 0; r < this.rows; r++) {
        row.push(this.data[r][c]);
      }
      res.push(row);
    }
    return new Matrix(this.cols, this.rows, res);
  }

  public isSquare(): boolean {
    return this.rows === this.cols;
  }

  public pow(exp: number): Matrix {
    if (!this.isSquare()) {
      throw new DimensionError(`Lũy thừa ma trận yêu cầu ma trận vuông (nhận ${this.rows}x${this.cols})`);
    }
    if (exp < 1 || exp > 3) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: 'Casio fx-580VN X chỉ hỗ trợ lũy thừa ma trận cấp 2 và 3 (A², A³)'
      });
    }

    if (exp === 1) return this;
    if (exp === 2) return this.mul(this);
    return this.mul(this).mul(this);
  }

  public detFraction(): Fraction {
    if (!this.isSquare()) {
      throw new DimensionError(`Định thức chỉ xác định cho ma trận vuông (nhận ${this.rows}x${this.cols})`);
    }

    const n = this.rows;
    if (n === 1) return this.data[0][0];

    if (n === 2) {
      // ad - bc
      return this.data[0][0].mul(this.data[1][1]).sub(this.data[0][1].mul(this.data[1][0]));
    }

    if (n === 3) {
      // Sarrus rule
      const a = this.data;
      const term1 = a[0][0].mul(a[1][1]).mul(a[2][2]);
      const term2 = a[0][1].mul(a[1][2]).mul(a[2][0]);
      const term3 = a[0][2].mul(a[1][0]).mul(a[2][1]);
      const term4 = a[0][2].mul(a[1][1]).mul(a[2][0]);
      const term5 = a[0][0].mul(a[1][2]).mul(a[2][1]);
      const term6 = a[0][1].mul(a[1][0]).mul(a[2][2]);
      return term1.add(term2).add(term3).sub(term4).sub(term5).sub(term6);
    }

    // n = 4: Khử Gauss trên phân số chính xác
    const copy = this.cloneData();
    let det = Fraction.fromBigInt(1n);

    for (let col = 0; col < n; col++) {
      let pivotRow = col;
      while (pivotRow < n && copy[pivotRow][col].isZero()) {
        pivotRow++;
      }

      if (pivotRow === n) {
        return Fraction.fromBigInt(0n);
      }

      if (pivotRow !== col) {
        const temp = copy[col];
        copy[col] = copy[pivotRow];
        copy[pivotRow] = temp;
        det = det.neg(); // Đổi dấu định thức khi hoán vị 2 hàng
      }

      const pivot = copy[col][col];
      det = det.mul(pivot);

      for (let r = col + 1; r < n; r++) {
        const factor = copy[r][col].div(pivot);
        if (!factor.isZero()) {
          for (let c = col; c < n; c++) {
            copy[r][c] = copy[r][c].sub(factor.mul(copy[col][c]));
          }
        }
      }
    }

    return det;
  }

  public det(): Decimal {
    return Decimal.fromFraction(this.detFraction());
  }

  public inv(): Matrix {
    if (!this.isSquare()) {
      throw new DimensionError(`Nghịch đảo chỉ xác định cho ma trận vuông (nhận ${this.rows}x${this.cols})`);
    }

    const n = this.rows;
    const det = this.detFraction();

    if (det.isZero()) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: 'Ma trận suy biến có định thức bằng 0, không có ma trận nghịch đảo'
      });
    }

    // Tìm nghịch đảo bằng Gauss-Jordan mở rộng [A | I]
    const aug: Fraction[][] = [];
    for (let r = 0; r < n; r++) {
      const row: Fraction[] = [...this.data[r]];
      for (let c = 0; c < n; c++) {
        row.push(r === c ? Fraction.fromBigInt(1n) : Fraction.fromBigInt(0n));
      }
      aug.push(row);
    }

    for (let col = 0; col < n; col++) {
      let pivotRow = col;
      while (pivotRow < n && aug[pivotRow][col].isZero()) {
        pivotRow++;
      }

      if (pivotRow !== col) {
        const temp = aug[col];
        aug[col] = aug[pivotRow];
        aug[pivotRow] = temp;
      }

      const pivot = aug[col][col];
      for (let c = 0; c < 2 * n; c++) {
        aug[col][c] = aug[col][c].div(pivot);
      }

      for (let r = 0; r < n; r++) {
        if (r !== col) {
          const factor = aug[r][col];
          if (!factor.isZero()) {
            for (let c = 0; c < 2 * n; c++) {
              aug[r][c] = aug[r][c].sub(factor.mul(aug[col][c]));
            }
          }
        }
      }
    }

    const invData: Fraction[][] = [];
    for (let r = 0; r < n; r++) {
      invData.push(aug[r].slice(n, 2 * n));
    }

    return new Matrix(n, n, invData);
  }

  public toArray(): number[][] {
    return this.data.map((row) => row.map((f) => f.toNumber()));
  }

  public toStringArray(): string[][] {
    return this.data.map((row) => row.map((f) => f.toString()));
  }

  public toDecimalArray(): number[][] {
    return this.toArray();
  }

  private cloneData(): Fraction[][] {
    return this.data.map((row) => [...row]);
  }
}
