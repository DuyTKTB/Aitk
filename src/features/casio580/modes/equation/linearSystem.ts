import { Fraction } from '../../engine/fraction';
import { CalculationResult } from '../../engine/result';
import { MathError, DimensionError } from '../../engine/errors';
import { LinearSystemResult, LinearSolutionItem } from './types';

export type CoefficientInput = number | bigint | string | Fraction;

const VAR_NAMES = ['x', 'y', 'z', 'w'];

/**
 * Chuyển đổi đầu vào đa dạng thành Fraction chuẩn xác
 */
function toFraction(val: CoefficientInput): { frac: Fraction; isDecimal: boolean } {
  if (val instanceof Fraction) {
    return { frac: val, isDecimal: false };
  }
  if (typeof val === 'bigint') {
    return { frac: Fraction.fromBigInt(val), isDecimal: false };
  }
  if (typeof val === 'number') {
    const s = val.toString();
    return { frac: Fraction.fromNumberString(s), isDecimal: s.includes('.') };
  }
  const str = val.trim();
  return { frac: Fraction.fromNumberString(str), isDecimal: str.includes('.') };
}

/**
 * Giải hệ phương trình tuyến tính bậc nhất n ẩn (n = 2, 3, hoặc 4)
 * Bằng phương pháp khử Gauss-Jordan trên phân số chính xác (Exact Fraction)
 * Tái tạo chuẩn Casio fx-580VN X: phân biệt rõ UNIQUE, NO_SOLUTION, INFINITE
 */
export function solveLinearSystem(
  unknownsOrCoeffs: 2 | 3 | 4 | CoefficientInput[][],
  coeffsOrConstants: CoefficientInput[][] | CoefficientInput[],
  maybeConstants?: CoefficientInput[]
): LinearSystemResult {
  let n: number;
  let coefficients: CoefficientInput[][];
  let constants: CoefficientInput[];

  if (typeof unknownsOrCoeffs === 'number') {
    n = unknownsOrCoeffs;
    if (n !== 2 && n !== 3 && n !== 4) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Casio fx-580VN X chỉ hỗ trợ hệ phương trình 2, 3 hoặc 4 ẩn (nhận được ${n})`
      });
    }
    coefficients = coeffsOrConstants as CoefficientInput[][];
    constants = maybeConstants as CoefficientInput[];
    if (!coefficients || coefficients.length !== n) {
      throw new DimensionError(`Số phương trình không khớp với số ẩn: yêu cầu ${n}`);
    }
    if (!constants || constants.length !== n) {
      throw new DimensionError(`Số lượng hằng số vế phải không khớp với số phương trình: yêu cầu ${n}`);
    }
  } else {
    coefficients = unknownsOrCoeffs;
    constants = coeffsOrConstants as CoefficientInput[];
    n = coefficients.length;
    if (n !== 2 && n !== 3 && n !== 4) {
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Casio fx-580VN X chỉ hỗ trợ hệ phương trình 2, 3 hoặc 4 ẩn (nhận được ${n})`
      });
    }
    if (constants.length !== n) {
      throw new DimensionError('Số lượng hằng số vế phải không khớp với số phương trình');
    }
  }

  let hasAnyDecimal = false;

  // Xây dựng ma trận mở rộng [A | B] kích thước n × (n + 1)
  const M: Fraction[][] = [];
  for (let i = 0; i < n; i++) {
    if (coefficients[i].length !== n) {
      throw new DimensionError(
        `Phương trình ${i + 1} có ${coefficients[i].length} hệ số, yêu cầu ${n}`
      );
    }
    const row: Fraction[] = [];
    for (let j = 0; j < n; j++) {
      const parsed = toFraction(coefficients[i][j]);
      row.push(parsed.frac);
      if (parsed.isDecimal) hasAnyDecimal = true;
    }
    const constParsed = toFraction(constants[i]);
    row.push(constParsed.frac);
    if (constParsed.isDecimal) hasAnyDecimal = true;

    M.push(row);
  }

  // Khử Gauss-Jordan để đưa về ma trận bậc thang thu gọn (RREF)
  for (let col = 0; col < n; col++) {
    // 1. Tìm pivot khác 0 từ hàng col trở xuống
    let pivotRow = -1;
    for (let r = col; r < n; r++) {
      if (!M[r][col].isZero()) {
        pivotRow = r;
        break;
      }
    }

    if (pivotRow === -1) {
      // Cột này toàn số 0, tiếp tục tìm pivot ở cột kế
      continue;
    }

    // Hoán đổi hàng pivotRow lên vị trí hàng col
    if (pivotRow !== col) {
      const temp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = temp;
    }

    // 2. Chuẩn hóa phần tử pivot về 1
    const pivotVal = M[col][col];
    for (let c = col; c <= n; c++) {
      M[col][c] = M[col][c].div(pivotVal);
    }

    // 3. Khử tất cả các hàng khác tại cột col về 0
    for (let r = 0; r < n; r++) {
      if (r !== col && !M[r][col].isZero()) {
        const factor = M[r][col];
        for (let c = col; c <= n; c++) {
          M[r][c] = M[r][c].sub(factor.mul(M[col][c]));
        }
      }
    }
  }

  // Phân tích trạng thái nghiệm theo định lý Rouché–Capelli:
  // rank(A) vs rank([A|B])
  for (let i = 0; i < n; i++) {
    let allZerosA = true;
    for (let j = 0; j < n; j++) {
      if (!M[i][j].isZero()) {
        allZerosA = false;
        break;
      }
    }

    const bNonZero = !M[i][n].isZero();

    // Hàng có 0x + 0y + ... = b với b ≠ 0 => Vô nghiệm (No Solution)
    if (allZerosA && bNonZero) {
      return {
        status: 'NO_SOLUTION',
        solutions: [],
        rawSolutions: [],
        unknowns: n as 2 | 3 | 4,
        message: 'No Solution'
      };
    }
  }

  // Đếm hạng ma trận hệ số để phát hiện vô số nghiệm (Infinite Solutions)
  let rank = 0;
  for (let i = 0; i < n; i++) {
    let hasNonZero = false;
    for (let j = 0; j < n; j++) {
      if (!M[i][j].isZero()) {
        hasNonZero = true;
        break;
      }
    }
    if (hasNonZero) rank++;
  }

  if (rank < n) {
    return {
      status: 'INFINITE',
      solutions: [],
      rawSolutions: [],
      unknowns: n as 2 | 3 | 4,
      message: 'Infinite Solutions'
    };
  }

  // Nghiệm duy nhất (Unique Solution)
  const solutions: LinearSolutionItem[] = [];
  const rawSolutions: CalculationResult[] = [];
  for (let i = 0; i < n; i++) {
    const fracSol = M[i][n];
    const calcRes = CalculationResult.fromFraction(fracSol, hasAnyDecimal);
    rawSolutions.push(calcRes);
    solutions.push({
      variable: VAR_NAMES[i],
      value: calcRes
    });
  }

  return {
    status: 'UNIQUE',
    solutions,
    rawSolutions,
    unknowns: n as 2 | 3 | 4
  };
}
