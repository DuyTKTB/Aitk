import { describe, it, expect } from 'vitest';
import {
  calcProjectile,
  solveDcCircuit,
  solveThinLens,
  solveSnell,
  calcWaveInterference,
  stepDoublePendulum,
  calcDoublePendulumEnergy,
  calcArchimedes,
  calcLinearRegression,
  PHYSICS_OPEN_REPOS,
} from '../src/features/physics/physicsEngine.js';
import {
  INQUIRY_LAB_CONFIGS,
  evaluateInquiryTrials,
  gradeCerReport,
} from '../src/features/physics/PhysicsInquiryWorkbench.jsx';

describe('ELEC Physics Studio Engine — Kiểm thử chính xác 7 phân hệ Vật lí', () => {
  it('1. Chuyển động ném xiên: nghiệm giải tích chuẩn & góc 30°/60° cùng tầm xa khi h0=0', () => {
    const r45 = calcProjectile({ v0: 20, angleDeg: 45, h0: 0, g: 10, drag: 0 });
    expect(r45.range).toBeCloseTo(40, 2);
    expect(r45.maxHeight).toBeCloseTo(10, 2);
    expect(r45.flightTime).toBeCloseTo(Math.sqrt(8), 2);

    const r30 = calcProjectile({ v0: 30, angleDeg: 30, h0: 0, g: 9.81, drag: 0 });
    const r60 = calcProjectile({ v0: 30, angleDeg: 60, h0: 0, g: 9.81, drag: 0 });
    expect(r30.range).toBeCloseTo(r60.range, 2);

    const rDrag = calcProjectile({ v0: 30, angleDeg: 45, h0: 0, g: 9.81, drag: 0.01 });
    expect(rDrag.range).toBeLessThan(calcProjectile({ v0: 30, angleDeg: 45, h0: 0, g: 9.81, drag: 0 }).range);
  });

  it('2. Mạch điện DC: tính đúng nối tiếp, song song, hỗn hợp & Định luật Ôm toàn mạch', () => {
    const mixed = solveDcCircuit({ topology: 'mixed', E: 12, r: 1, R1: 3, R2: 6, R3: 12, closed: true });
    // R23 = 4 -> Req = 7 -> I = 12/8 = 1.5A, Uext = 10.5V
    expect(mixed.Req).toBeCloseTo(7, 4);
    expect(mixed.Itotal).toBeCloseTo(1.5, 4);
    expect(mixed.Uext).toBeCloseTo(10.5, 4);
    // Kiểm định định luật nút Kirchhoff: I2 + I3 = I1
    expect(mixed.branches[1].I + mixed.branches[2].I).toBeCloseTo(mixed.branches[0].I, 4);

    const open = solveDcCircuit({ topology: 'series', E: 12, r: 1, R1: 2, R2: 3, R3: 5, closed: false });
    expect(open.Itotal).toBe(0);
    expect(open.Uext).toBe(12);
  });

  it('3. Quang hình học: Thấu kính mỏng (ảnh thật/ảnh ảo) & Khúc xạ Snell / PXTP', () => {
    const realImg = solveThinLens({ f: 15, d: 30, h: 4 });
    expect(realImg.dPrime).toBeCloseTo(30, 3);
    expect(realImg.k).toBeCloseTo(-1, 3);
    expect(realImg.isVirtual).toBe(false);

    const virtualImg = solveThinLens({ f: 15, d: 10, h: 4 });
    expect(virtualImg.dPrime).toBeCloseTo(-30, 3);
    expect(virtualImg.k).toBeCloseTo(3, 3);
    expect(virtualImg.isVirtual).toBe(true);

    const snell = solveSnell({ n1: 1.0, n2: 1.5, iDeg: 30 });
    expect(snell.isTIR).toBe(false);
    expect(snell.rDeg).toBeCloseTo((Math.asin(0.5 / 1.5) * 180) / Math.PI, 3);

    const tir = solveSnell({ n1: 1.5, n2: 1.0, iDeg: 50 });
    expect(tir.isTIR).toBe(true);
    expect(tir.criticalDeg).toBeCloseTo(41.81, 1);
  });

  it('4. Giao thoa sóng cơ 2 nguồn: đếm đúng cực đại & cực tiểu cùng pha / ngược pha', () => {
    const same = calcWaveInterference({ lam: 2, dist: 10, samePhase: true });
    // -5 < k < 5 -> k = -4..4 -> 9 cực đại; -5 < k+0.5 < 5 -> 10 cực tiểu
    expect(same.maxima).toBe(9);
    expect(same.minima).toBe(10);

    const opp = calcWaveInterference({ lam: 2, dist: 10, samePhase: false });
    expect(opp.maxima).toBe(10);
    expect(opp.minima).toBe(9);
  });

  it('5. Con lắc kép RK4: bảo toàn cơ năng chính xác trong nhiều bước tích phân', () => {
    const params = { m1: 2, m2: 1.5, L1: 1.0, L2: 1.0, g: 9.81 };
    let state = [Math.PI / 2, 0, Math.PI / 3, 0];
    const e0 = calcDoublePendulumEnergy(state, params).total;
    for (let i = 0; i < 200; i++) {
      state = stepDoublePendulum(state, params, 0.005);
    }
    const e1 = calcDoublePendulumEnergy(state, params).total;
    expect(Math.abs(e1 - e0)).toBeLessThan(0.01);
  });

  it('6. Lực đẩy Archimedes & Hồi quy tuyến tính OLS Olympiad + đủ 10 kho tham khảo', () => {
    const woodInWater = calcArchimedes({ objDensity: 600, fluidDensity: 1000, volumeCm3: 500, g: 10 });
    expect(woodInWater.floats).toBe(true);
    expect(woodInWater.submergedFraction).toBeCloseTo(0.6, 4);
    expect(woodInWater.apparentWeightN).toBeCloseTo(0, 4);

    const reg = calcLinearRegression([
      { x: 0.4, y: 1.61 },
      { x: 0.6, y: 2.415 },
      { x: 0.8, y: 3.22 },
      { x: 1.0, y: 4.025 },
    ]);
    expect(reg.slope).toBeCloseTo(4.025, 3);
    expect(reg.r2).toBeCloseTo(1, 5);
    expect(PHYSICS_OPEN_REPOS).toHaveLength(10);
  });

  it('7. Inq-ITS Rex Telemetry & CER Rubric Grader: kiểm định Kiểm soát biến & chấm báo cáo CER 10đ', () => {
    const simIds = Object.keys(INQUIRY_LAB_CONFIGS);
    expect(simIds).toHaveLength(7);

    const projCfg = INQUIRY_LAB_CONFIGS.projectile;
    expect(projCfg.missions).toHaveLength(3);

    const fairEval = evaluateInquiryTrials(projCfg.defaultTrials);
    expect(fairEval.status).toBe('verified');
    expect(fairEval.score).toBe(100);

    const confoundedEval = evaluateInquiryTrials(projCfg.flawedTrials);
    expect(confoundedEval.status).toBe('confounded');
    expect(confoundedEval.score).toBeLessThan(60);

    const cerRes = gradeCerReport({
      claim: projCfg.cerPresets.claim,
      evidence: 'Lần 1: góc 30° -> L = 35,35 m; Lần 2: góc 45° -> L = 40,82 m; Lần 3: góc 60° -> L = 35,35 m.',
      reasoning: projCfg.cerPresets.reasoning,
      config: projCfg,
    });
    expect(cerRes.total).toBeGreaterThanOrEqual(9.0);
  });
});
