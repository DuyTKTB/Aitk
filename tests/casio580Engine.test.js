import { describe, it, expect } from 'vitest';
import { InputDispatcher } from '../src/features/casio580/input/InputDispatcher.ts';
import { parseExpression } from '../src/features/casio580/parser/index.ts';
import { CoreMathEngine } from '../src/features/casio580/engine/evaluator.ts';
import { EquationMode } from '../src/features/casio580/modes/equation/EquationMode.ts';
import { BaseNMode } from '../src/features/casio580/modes/baseN/BaseNMode.ts';
import { TableMode } from '../src/features/casio580/modes/table/TableMode.ts';
import { MatrixMode } from '../src/features/casio580/modes/matrix/MatrixMode.ts';
import { VectorMode } from '../src/features/casio580/modes/vector/VectorMode.ts';
import { StatisticsMode } from '../src/features/casio580/modes/statistics/StatisticsMode.ts';
import { ComplexNumber } from '../src/features/casio580/engine/complex.ts';
import { Decimal } from '../src/features/casio580/engine/decimal.ts';
import {
  numericalDerivative,
  numericalIntegral,
  solveEquationNewton,
  evaluateAtX,
} from '../src/features/casio580/engine/calculus.ts';

describe('Casio fx-580VN X ClassWiz Studio Pro Engine', () => {
  it('tính toán chính xác phân số, chèn hằng số & đổi đơn vị góc qua InputDispatcher', () => {
    const dispatcher = new InputDispatcher();
    for (const keyId of ['KEY_1', 'KEY_DIV', 'KEY_2', 'KEY_ADD', 'KEY_1', 'KEY_DIV', 'KEY_3', 'KEY_EQUALS']) {
      dispatcher.dispatchKeyId(keyId);
    }
    expect(String(dispatcher.getState().result)).toMatch(/5\/6|0\.8333/);

    dispatcher.setAngleUnit('RAD');
    expect(dispatcher.getState().statusFlags.angleUnit).toBe('R');

    dispatcher.insertText('24.79');
    expect(dispatcher.getState().expression).toBe('24.79');
  });

  it('tính toán biểu thức khoa học bằng Lexer → Pratt Parser → CoreMathEngine (zero eval)', () => {
    const engine = new CoreMathEngine();
    const res = engine.evaluate(parseExpression('2+3*4'));
    expect(res.getDisplayText()).toBe('14');
    expect(res.toNumber()).toBe(14);
  });

  it('giải phương trình bậc 2 & hệ phương trình tuyến tính 2 ẩn (Hóa/Lý)', () => {
    const eq = new EquationMode();
    const poly = eq.solvePolynomial([1, -5, 6]);
    const roots = poly.roots
      .map((r) => Math.round(r.real.toNumber() * 1000) / 1000)
      .sort((a, b) => a - b);
    expect(roots).toEqual([2, 3]);

    const sys = eq.solveSystem(
      [
        [1, 1],
        [24, 27],
      ],
      [0.5, 12.6]
    );
    expect(sys.status).toBe('UNIQUE');
    expect(sys.solutions[0].value.toNumber()).toBeCloseTo(0.3, 6);
    expect(sys.solutions[1].value.toNumber()).toBeCloseTo(0.2, 6);
  });

  it('tính Tích phân ∫dx, Đạo hàm d/dx, SOLVE Newton-Raphson & CALC f(x)', () => {
    // ∫_0^3 (x^2 + 2x) dx = [x^3/3 + x^2]_0^3 = 9 + 9 = 18
    expect(numericalIntegral('x^2 + 2*x', 0, 3, 'RAD')).toBeCloseTo(18, 7);

    // d/dx (x^3) tại x = 2 => 3*4 = 12
    expect(numericalDerivative('x^3', 2, 'RAD')).toBeCloseTo(12, 7);

    // SOLVE: 2^x = 16 => x = 4
    const solved = solveEquationNewton('2^x = 16', 2, 'RAD');
    expect(solved.root).toBeCloseTo(4, 7);

    // CALC f(5) với f(x) = 3*x - 7 => 8
    expect(evaluateAtX('3*x - 7', 5, 'DEG')).toBeCloseTo(8, 9);
  });

  it('tổng hợp số phức dạng cực (Vật lý 12), Ma trận, Véc-tơ 3D, Bảng f(x), Thống kê & BASE-N', () => {
    // Tổng hợp 2 dao động: 4∠30° + 4∠(-30°) = 4√3 ∠ 0°
    const z1 = ComplexNumber.fromPolar(Decimal.fromNumber(4), Decimal.fromNumber(30), 'DEG');
    const z2 = ComplexNumber.fromPolar(Decimal.fromNumber(4), Decimal.fromNumber(-30), 'DEG');
    const zSum = z1.add(z2);
    expect(zSum.abs().toNumber()).toBeCloseTo(4 * Math.sqrt(3), 5);
    expect(zSum.arg('DEG').toNumber()).toBeCloseTo(0, 5);

    // Ma trận 2x2: det([[2,1],[5,3]]) = 1
    const mm = new MatrixMode();
    mm.defineMatrix('MatA', [[2, 1], [5, 3]]);
    expect(mm.det('MatA').toNumber()).toBeCloseTo(1, 8);

    // Véc-tơ 3D: (1,0,0) · (0,1,0) = 0, góc = 90°
    const vm = new VectorMode();
    vm.defineVector('VctA', [1, 0, 0]);
    vm.defineVector('VctB', [0, 1, 0]);
    expect(vm.dot('VctA', 'VctB').toNumber()).toBe(0);
    expect(vm.angle('VctA', 'VctB', 'DEG').toNumber()).toBeCloseTo(90, 5);

    // TableMode
    const tm = new TableMode();
    tm.setFunctionF('x^2');
    tm.setTableType('F_ONLY');
    tm.setRange({ start: 1, end: 3, step: 1 });
    expect(tm.generate().rows.map((r) => r.f.value.toNumber())).toEqual([1, 4, 9]);

    // StatisticsMode
    const sm = new StatisticsMode();
    sm.setData1Var([{ x: 6, freq: 1 }, { x: 8, freq: 1 }, { x: 10, freq: 1 }]);
    const st1 = sm.calculate1Var();
    expect(st1.meanX).toBeCloseTo(8, 8);
    expect(st1.med).toBeCloseTo(8, 8);

    // BaseNMode
    const base = new BaseNMode();
    const val = base.parse('255', 'DEC');
    expect(base.format(val, 'HEX').replace(/^0+/, '').toUpperCase()).toBe('FF');
    expect(base.format(val, 'BIN').replace(/^0+/, '')).toBe('11111111');
  });
});
