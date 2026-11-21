/**
 * Tên định danh ma trận Casio ClassWiz (FEAT-MOD-04)
 */
export type MatrixId = 'MatA' | 'MatB' | 'MatC' | 'MatD' | 'MatAns';

/**
 * Kích thước ma trận (Số hàng m, số cột n: từ 1 đến 4)
 */
export interface MatrixDimensions {
  rows: number; // 1 <= rows <= 4
  cols: number; // 1 <= cols <= 4
}
