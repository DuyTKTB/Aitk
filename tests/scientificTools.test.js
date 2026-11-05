import { describe, it, expect } from 'vitest';
import {
  solveQuadratic,
  analyzeRationalFunction,
  vector3D,
  combinatorics,
  harmonicOscillation,
  acCircuits,
  dnaMolecular,
  runScientificTools,
} from '../src/lib/scientificTools.js';
import { runTools } from '../src/lib/aiTools.js';

describe('Scientific Tools — Mathematics Engine', () => {
  it('giải đúng phương trình bậc hai với delta dương', () => {
    // x^2 - 5x + 6 = 0 -> nghiệm x = 2, x = 3
    const res = solveQuadratic(1, -5, 6);
    expect(res).not.toBeNull();
    expect(res.type).toBe('two_distinct');
    expect(res.delta).toBe(1);
    expect(res.roots).toEqual([2, 3]);
    expect(res.vertex).toEqual({ x: 2.5, y: -0.25 });
  });

  it('giải đúng phương trình bậc hai có nghiệm kép', () => {
    // x^2 - 4x + 4 = 0 -> x = 2
    const res = solveQuadratic(1, -4, 4);
    expect(res.type).toBe('double');
    expect(res.delta).toBe(0);
    expect(res.roots).toEqual([2]);
  });

  it('phát hiện phương trình bậc hai vô nghiệm thực', () => {
    // x^2 + x + 5 = 0 -> delta = -19 < 0
    const res = solveQuadratic(1, 1, 5);
    expect(res.type).toBe('none');
    expect(res.roots).toEqual([]);
  });

  it('khảo sát chuẩn xác hàm phân thức nhất biến y = (2x+1)/(x-1)', () => {
    const res = analyzeRationalFunction(2, 1, 1, -1);
    expect(res).not.toBeNull();
    expect(res.verticalAsymptote).toBe(1); // x = 1
    expect(res.horizontalAsymptote).toBe(2); // y = 2
    expect(res.centerOfSymmetry).toEqual({ x: 1, y: 2 });
    expect(res.det).toBe(-3); // y' = -3 / (x-1)^2 < 0 -> nghịch biến
    expect(res.isDecreasing).toBe(true);
  });

  it('tính toán vectơ không gian Oxyz và diện tích tam giác', () => {
    const u = [1, 2, 3];
    const v = [2, 4, 6]; // cùng phương
    const res = vector3D(u, v);
    expect(res.isParallel).toBe(true);

    const a = [1, 0, 0];
    const b = [0, 1, 0]; // vuông góc
    const resPerp = vector3D(a, b);
    expect(resPerp.isPerpendicular).toBe(true);
    expect(resPerp.angleDeg).toBe(90);
    expect(resPerp.triangleArea).toBe(0.5);
  });

  it('tính đại số tổ hợp C(n, k), A(n, k)', () => {
    const res = combinatorics(5, 2);
    expect(res.combinations).toBe(10); // C(5, 2) = 10
    expect(res.arrangements).toBe(20); // A(5, 2) = 20
    expect(res.permutations).toBe(120); // 5! = 120
  });
});

describe('Scientific Tools — Physics Engine', () => {
  it('tính toán chu kỳ và tần số dao động con lắc lò xo', () => {
    // k = 100 N/m, m = 0.25 kg -> omega = sqrt(100/0.25) = 20 rad/s
    const res = harmonicOscillation({ k: 100, m: 0.25, A: 5 });
    expect(res.omega).toBe(20);
    expect(res.frequencyF).toBeCloseTo(3.1831, 2);
    expect(res.vMax).toBe(100); // 20 * 5 = 100 cm/s
  });

  it('tính tổng trở và hệ số công suất mạch xoay chiều RLC', () => {
    // R = 40, Z_L = 50, Z_C = 20 -> Z = sqrt(40^2 + 30^2) = 50
    const res = acCircuits({ R: 40, L: 0.159155, C: 0.000159155, f: 50 });
    expect(res.totalImpedanceZ).toBeCloseTo(50, 0);
    expect(res.powerFactorCosPhi).toBeCloseTo(0.8, 1);
  });
});

describe('Scientific Tools — Biology Molecular Engine', () => {
  it('tính cấu trúc gen ADN từ chiều dài', () => {
    // L = 4080 A -> N = (4080 / 3.4) * 2 = 2400 nu
    const res = dnaMolecular({ L: 4080, H: 3120 });
    expect(res.totalNucleotides).toBe(2400);
    expect(res.nucleotides.G).toBe(720); // G = H - N = 3120 - 2400 = 720
    expect(res.nucleotides.A).toBe(480); // A = 1200 - 720 = 480
    expect(res.coils).toBe(120);
  });
});

describe('Scientific Tools — Dispatcher & Integration with aiTools', () => {
  it('tự động bắt bài toán phương trình bậc hai từ câu hỏi người dùng', () => {
    const { hits } = runTools('Giải phương trình bậc hai x^2 - 5x + 6 = 0');
    const quad = hits.find((h) => h.tool === 'quadratic_equation');
    expect(quad).toBeTruthy();
    expect(quad.lines.some((l) => l.includes('x = 2, x = 3'))).toBe(true);
  });

  it('tự động bắt bài toán con lắc lò xo từ câu hỏi người dùng', () => {
    const { hits } = runTools('Một con lắc lò xo có độ cứng k = 100 N/m, khối lượng m = 250 gam dao động điều hòa');
    const osc = hits.find((h) => h.tool === 'harmonic_oscillation');
    expect(osc).toBeTruthy();
    expect(osc.lines.some((l) => l.includes('omega = 20 rad/s'))).toBe(true);
  });
});
