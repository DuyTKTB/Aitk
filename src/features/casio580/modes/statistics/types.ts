/**
 * Điểm dữ liệu thống kê 1 biến (1-Variable)
 */
export interface StatDataPoint1Var {
  x: number;
  freq: number;
}

/**
 * Điểm dữ liệu thống kê 2 biến (2-Variable)
 */
export interface StatDataPoint2Var {
  x: number;
  y: number;
  freq: number;
}

/**
 * Kết quả tính toán thống kê 1 biến (1-Var Summary Statistics)
 */
export interface StatResult1Var {
  n: number;        // Cỡ mẫu: ∑ freq
  sumX: number;     // Tổng các giá trị: ∑ x
  sumX2: number;    // Tổng bình phương: ∑ x²
  meanX: number;    // Giá trị trung bình: x̄ = ∑ x / n
  sigmaX2: number;  // Phương sai tổng thể: σ²_x
  sigmaX: number;   // Độ lệch chuẩn tổng thể: σ_x
  sX2: number | null; // Phương sai mẫu: s²_x (chỉ tính khi n ≥ 2)
  sX: number | null;  // Độ lệch chuẩn mẫu: s_x (chỉ tính khi n ≥ 2)
  minX: number;     // Giá trị nhỏ nhất: min(x)
  q1: number;       // Tứ phân vị thứ nhất: Q1
  med: number;      // Trung vị: Med
  q3: number;       // Tứ phân vị thứ ba: Q3
  maxX: number;     // Giá trị lớn nhất: max(x)
}

/**
 * Kết quả tính toán thống kê 2 biến và hồi quy tuyến tính (2-Var & Linear Regression: y = a + bx)
 */
export interface StatResult2Var {
  n: number;
  sumX: number;
  sumX2: number;
  meanX: number;
  sigmaX2: number;
  sigmaX: number;
  sX2: number | null;
  sX: number | null;
  minX: number;
  maxX: number;

  sumY: number;
  sumY2: number;
  meanY: number;
  sigmaY2: number;
  sigmaY: number;
  sY2: number | null;
  sY: number | null;
  minY: number;
  maxY: number;

  sumXY: number;    // Tổng tích: ∑ xy

  // Hệ số mô hình hồi quy tuyến tính: y = a + bx
  a: number;        // Hệ số tự do (Intercept)
  b: number;        // Hệ số góc (Slope)
  r: number;        // Hệ số tương quan Pearson
}
