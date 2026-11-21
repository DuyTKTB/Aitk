import { solveLinearSystem, CoefficientInput } from './linearSystem';
import { solveQuadratic, solveCubic, solveQuartic, PolyCoeff } from './polynomial';
import { LinearSystemResult, PolynomialResult } from './types';
import { MathError } from '../../engine/errors';

export type EquationSubMode = 'SIMULTANEOUS' | 'POLYNOMIAL';

/**
 * Quản lý chế độ Phương trình / Hệ phương trình (Mode A: Equation/Func)
 * Chuẩn Casio fx-580VN X (FEAT-MOD-10)
 */
export class EquationMode {
  private subMode: EquationSubMode = 'POLYNOMIAL';
  private simultaneousUnknowns: 2 | 3 | 4 = 2;
  private polynomialDegree: 2 | 3 | 4 = 2;

  private linearResult: LinearSystemResult | null = null;
  private polynomialResult: PolynomialResult | null = null;

  public setSubMode(subMode: EquationSubMode): void {
    this.subMode = subMode;
    this.linearResult = null;
    this.polynomialResult = null;
  }

  public getSubMode(): EquationSubMode {
    return this.subMode;
  }

  public setSimultaneousUnknowns(unknowns: 2 | 3 | 4): void {
    this.simultaneousUnknowns = unknowns;
    this.subMode = 'SIMULTANEOUS';
    this.linearResult = null;
  }

  public getSimultaneousUnknowns(): 2 | 3 | 4 {
    return this.simultaneousUnknowns;
  }

  public setPolynomialDegree(degree: 2 | 3 | 4): void {
    this.polynomialDegree = degree;
    this.subMode = 'POLYNOMIAL';
    this.polynomialResult = null;
  }

  public getPolynomialDegree(): 2 | 3 | 4 {
    return this.polynomialDegree;
  }

  /**
   * Giải hệ phương trình tuyến tính hiện tại
   */
  public solveSimultaneous(
    unknownsOrCoeffs: 2 | 3 | 4 | CoefficientInput[][],
    coeffsOrConstants: CoefficientInput[][] | CoefficientInput[],
    maybeConstants?: CoefficientInput[]
  ): LinearSystemResult {
    this.subMode = 'SIMULTANEOUS';
    const result = solveLinearSystem(unknownsOrCoeffs as any, coeffsOrConstants as any, maybeConstants);
    this.simultaneousUnknowns = result.unknowns;
    this.linearResult = result;
    return result;
  }

  public solveSystem(
    coefficients: CoefficientInput[][],
    constants: CoefficientInput[]
  ): LinearSystemResult {
    return this.solveSimultaneous(coefficients, constants);
  }

  /**
   * Giải phương trình đa thức hiện tại
   */
  public solvePolynomial(coeffs: PolyCoeff[]): PolynomialResult {
    this.subMode = 'POLYNOMIAL';
    const degree = coeffs.length - 1;

    let result: PolynomialResult;
    if (degree === 2) {
      this.polynomialDegree = 2;
      result = solveQuadratic(coeffs[0], coeffs[1], coeffs[2]);
    } else if (degree === 3) {
      this.polynomialDegree = 3;
      result = solveCubic(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);
    } else if (degree === 4) {
      this.polynomialDegree = 4;
      result = solveQuartic(coeffs[0], coeffs[1], coeffs[2], coeffs[3], coeffs[4]);
    } else {
      throw new MathError({
        code: 'MATH_ERROR',
        message: `Bậc đa thức ${degree} không được hỗ trợ (chỉ hỗ trợ bậc 2, 3, 4)`
      });
    }

    this.polynomialResult = result;
    return result;
  }

  public getLinearResult(): LinearSystemResult | null {
    return this.linearResult;
  }

  public getPolynomialResult(): PolynomialResult | null {
    return this.polynomialResult;
  }
}
