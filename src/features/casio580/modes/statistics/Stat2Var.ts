import { MathError } from '../../engine/errors';
import { StatDataPoint2Var, StatResult2Var } from './types';

/**
 * Tính toán thống kê 2 biến và hồi quy tuyến tính (2-Variable Statistics & Linear Regression: y = a + bx)
 */
export function computeStat2Var(data: StatDataPoint2Var[]): StatResult2Var {
  const validData = data.filter((d) => d.freq > 0);

  if (validData.length === 0) {
    throw new MathError({
      code: 'MATH_ERROR',
      message: 'Không có dữ liệu để tính toán thống kê (bảng dữ liệu rỗng)'
    });
  }

  let n = 0;
  let sumX = 0;
  let sumX2 = 0;
  let sumY = 0;
  let sumY2 = 0;
  let sumXY = 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of validData) {
    const f = Math.round(point.freq);
    n += f;
    sumX += f * point.x;
    sumX2 += f * point.x * point.x;
    sumY += f * point.y;
    sumY2 += f * point.y * point.y;
    sumXY += f * point.x * point.y;

    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  if (n === 0) {
    throw new MathError({
      code: 'MATH_ERROR',
      message: 'Cỡ mẫu bằng 0 (tổng tần số = 0)'
    });
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  // Tính tổng độ lệch bình phương
  let Sxx = 0;
  let Syy = 0;
  let Sxy = 0;

  for (const point of validData) {
    const f = Math.round(point.freq);
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    Sxx += f * dx * dx;
    Syy += f * dy * dy;
    Sxy += f * dx * dy;
  }

  const sigmaX2 = Sxx / n;
  const sigmaX = Math.sqrt(Math.max(0, sigmaX2));

  const sigmaY2 = Syy / n;
  const sigmaY = Math.sqrt(Math.max(0, sigmaY2));

  let sX2: number | null = null;
  let sX: number | null = null;
  let sY2: number | null = null;
  let sY: number | null = null;

  if (n >= 2) {
    sX2 = Sxx / (n - 1);
    sX = Math.sqrt(Math.max(0, sX2));
    sY2 = Syy / (n - 1);
    sY = Math.sqrt(Math.max(0, sY2));
  }

  // Hồi quy tuyến tính: y = a + bx
  // b = Sxy / Sxx
  // a = ȳ - b * x̄
  // r = Sxy / √(Sxx * Syy)
  if (Math.abs(Sxx) < 1e-15) {
    throw new MathError({
      code: 'MATH_ERROR',
      message: 'Hệ số hồi quy b không xác định: toàn bộ các điểm x có giá trị như nhau (Sxx = 0)'
    });
  }

  const b = Sxy / Sxx;
  const a = meanY - b * meanX;

  let r: number;
  if (Math.abs(Syy) < 1e-15) {
    // Toàn bộ y có cùng giá trị: đường nằm ngang y = c
    r = 0;
  } else {
    r = Sxy / Math.sqrt(Sxx * Syy);
    r = Math.max(-1, Math.min(1, r));
  }

  return {
    n,
    sumX,
    sumX2,
    meanX,
    sigmaX2,
    sigmaX,
    sX2,
    sX,
    minX,
    maxX,

    sumY,
    sumY2,
    meanY,
    sigmaY2,
    sigmaY,
    sY2,
    sY,
    minY,
    maxY,

    sumXY,
    a,
    b,
    r
  };
}
