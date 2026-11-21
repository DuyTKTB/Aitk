import { MathError } from '../../engine/errors';
import { StatDataPoint1Var, StatResult1Var } from './types';

function calcMedian(arr: number[]): number {
  const m = arr.length;
  if (m === 0) return 0;
  const mid = Math.floor(m / 2);
  if (m % 2 === 1) {
    return arr[mid];
  } else {
    return (arr[mid - 1] + arr[mid]) / 2;
  }
}

/**
 * Tính toán trung vị và tứ phân vị (Q1, Med, Q3) theo chuẩn Casio ClassWiz fx-580VN X
 */
function calcQuartiles(sortedArr: number[]): { q1: number; med: number; q3: number } {
  const n = sortedArr.length;
  const med = calcMedian(sortedArr);
  const mid = Math.floor(n / 2);

  let lowerHalf: number[];
  let upperHalf: number[];

  if (n % 2 === 0) {
    lowerHalf = sortedArr.slice(0, mid);
    upperHalf = sortedArr.slice(mid);
  } else {
    // Chuẩn Casio ClassWiz: khi n lẻ, loại bỏ phần tử trung vị khỏi 2 nửa
    lowerHalf = sortedArr.slice(0, mid);
    upperHalf = sortedArr.slice(mid + 1);
  }

  const q1 = calcMedian(lowerHalf);
  const q3 = calcMedian(upperHalf);

  return { q1, med, q3 };
}

/**
 * Tính toán thống kê mô tả 1 biến (1-Variable Statistics)
 */
export function computeStat1Var(data: StatDataPoint1Var[]): StatResult1Var {
  // Lọc các điểm dữ liệu hợp lệ (tần số > 0)
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

  const expandedList: number[] = [];

  for (const point of validData) {
    const f = Math.round(point.freq);
    n += f;
    sumX += f * point.x;
    sumX2 += f * point.x * point.x;

    for (let k = 0; k < f; k++) {
      expandedList.push(point.x);
    }
  }

  if (n === 0) {
    throw new MathError({
      code: 'MATH_ERROR',
      message: 'Cỡ mẫu bằng 0 (tổng tần số = 0)'
    });
  }

  expandedList.sort((a, b) => a - b);

  const meanX = sumX / n;

  // Phương sai tổng thể: σ²_x = (∑ x² - n * x̄²) / n
  let sumDiffSq = 0;
  for (const val of expandedList) {
    const diff = val - meanX;
    sumDiffSq += diff * diff;
  }
  const sigmaX2 = sumDiffSq / n;
  const sigmaX = Math.sqrt(Math.max(0, sigmaX2));

  // Phương sai và độ lệch chuẩn mẫu (chỉ xác định khi n ≥ 2)
  let sX2: number | null = null;
  let sX: number | null = null;
  if (n >= 2) {
    sX2 = sumDiffSq / (n - 1);
    sX = Math.sqrt(Math.max(0, sX2));
  }

  const minX = expandedList[0];
  const maxX = expandedList[expandedList.length - 1];

  const { q1, med, q3 } = calcQuartiles(expandedList);

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
    q1,
    med,
    q3,
    maxX
  };
}
