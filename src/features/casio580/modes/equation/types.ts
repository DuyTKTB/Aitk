import { CalculationResult } from '../../engine/result';

/**
 * Trạng thái nghiệm của hệ phương trình tuyến tính
 */
export type LinearSystemStatus = 'UNIQUE' | 'NO_SOLUTION' | 'INFINITE';

export interface LinearSolutionItem {
  variable: string;
  value: CalculationResult;
}

/**
 * Kết quả giải hệ phương trình tuyến tính (2, 3 hoặc 4 ẩn)
 */
export interface LinearSystemResult {
  status: LinearSystemStatus;
  /** Danh sách nghiệm tương ứng x, y, (z, t) nếu có nghiệm duy nhất */
  solutions: LinearSolutionItem[];
  rawSolutions?: CalculationResult[];
  unknowns: 2 | 3 | 4;
  /** Thông điệp hiển thị trạng thái ("No Solution", "Infinite Solutions") */
  message?: string;
}

/**
 * Nghiệm của phương trình đa thức (thực hoặc phức)
 */
export interface PolynomialRoot {
  real: CalculationResult;
  imag?: CalculationResult;
  isReal: boolean;
  isComplex: boolean;
  displayText: string;
}

/**
 * Điểm cực trị của đồ thị hàm số đa thức (Parabol bậc 2 hoặc uốn bậc 3)
 */
export interface ExtremumPoint {
  type: 'MINIMUM' | 'MAXIMUM';
  x: CalculationResult;
  y: CalculationResult;
  label: string;
  labelX: string;
  labelY: string;
}

/**
 * Kết quả giải phương trình đa thức (bậc 2, 3 hoặc 4)
 */
export interface PolynomialResult {
  degree: 2 | 3 | 4;
  roots: PolynomialRoot[];
  extrema?: ExtremumPoint[];
}
