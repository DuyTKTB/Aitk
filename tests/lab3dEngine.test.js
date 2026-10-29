import { describe, it, expect } from 'vitest';
import {
  createContainer,
  addChemical,
  transferLiquid,
  applyHeatReactions,
  volumeOf,
  solidMassOf,
  computePH,
  suggestReactionsFor,
} from '../src/features/lab3d/engine.js';

describe('Lab3D Chemistry Engine v2', () => {
  it('cho phép thả chất rắn vào cốc trống trước rồi mới rót axit để phản ứng', () => {
    const beaker = createContainer('beaker1', 250);
    const r1 = addChemical(beaker, 'CaCO3', 5);
    expect(r1.ok).toBe(true);
    expect(volumeOf(beaker)).toBe(0);
    expect(solidMassOf(beaker)).toBeGreaterThan(0);

    const r2 = addChemical(beaker, 'HCl', 30);
    expect(r2.ok).toBe(true);
    expect(r2.events.some((e) => e.eq?.includes('CaCO3 + 2HCl'))).toBe(true);
    expect(beaker.gas?.gas).toBe('CO2');
  });

  it('mô phỏng đúng tính lưỡng tính của Al(OH)3: tạo tủa keo trắng rồi tan trong NaOH dư', () => {
    const beaker = createContainer('beaker1', 250);
    addChemical(beaker, 'AlCl3', 20);
    const rPrecip = addChemical(beaker, 'NaOH', 15);
    expect(rPrecip.events.some((e) => e.eq?.includes('AlCl3 + 3NaOH'))).toBe(true);
    expect(beaker.precipitates.some((p) => p.formula === 'Al(OH)3')).toBe(true);

    // Rót tiếp NaOH dư -> kết tủa keo trắng tan
    const rDissolve = addChemical(beaker, 'NaOH', 35);
    expect(rDissolve.events.some((e) => e.type === 'hoa-tan-kettua')).toBe(true);
    expect(beaker.precipitates.some((p) => p.formula === 'Al(OH)3')).toBe(false);
  });

  it('mô phỏng tạo phức đồng [Cu(NH3)4](OH)2 khi rót NH3 dư vào CuSO4', () => {
    const tube = createContainer('tube1', 100);
    addChemical(tube, 'CuSO4', 15);
    const r1 = addChemical(tube, 'NH3', 10);
    expect(r1.events.some((e) => e.eq?.includes('CuSO4 + 2NH3'))).toBe(true);

    const r2 = addChemical(tube, 'NH3', 30);
    expect(r2.events.some((e) => e.type === 'tao-phuc')).toBe(true);
    expect(tube.precipitates.length).toBe(0);
  });

  it('nhiệt phân kết tủa xanh Cu(OH)2 thành CuO đen khi đun nóng >= 65°C', () => {
    const beaker = createContainer('beaker1', 250);
    addChemical(beaker, 'CuSO4', 20);
    addChemical(beaker, 'NaOH', 20);
    expect(beaker.precipitates.some((p) => p.formula === 'Cu(OH)2')).toBe(true);

    beaker.temp = 72;
    const evs = applyHeatReactions(beaker);
    expect(evs.some((e) => e.type === 'nhiet-phan')).toBe(true);
    expect(beaker.precipitates.some((p) => p.formula === 'CuO')).toBe(true);
  });

  it('san dung dịch giữa 2 dụng cụ (transferLiquid) và kích hoạt phản ứng ở dụng cụ đích', () => {
    const beaker = createContainer('beaker1', 250);
    const flask = { ...createContainer('erlenmeyer1', 250), name: 'Bình tam giác' };

    addChemical(beaker, 'BaCl2', 30);
    addChemical(flask, 'H2SO4', 20);

    const res = transferLiquid(beaker, flask, 20);
    expect(res.ok).toBe(true);
    expect(res.movedMl).toBe(20);
    expect(volumeOf(beaker)).toBeCloseTo(10, 0);
    expect(res.events.some((e) => e.eq?.includes('BaCl2 + H2SO4'))).toBe(true);
    expect(flask.precipitates.some((p) => p.formula === 'BaSO4')).toBe(true);
  });

  it('gợi ý chất phản ứng thông minh dựa trên chất hiện có trong cốc', () => {
    const beaker = createContainer('beaker1', 250);
    addChemical(beaker, 'AgNO3', 20);
    const suggestions = suggestReactionsFor(beaker);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.chemId === 'NaCl' || s.chemId === 'KI' || s.chemId === 'HCl')).toBe(true);
  });

  it('tính pH chính xác cho axit mạnh, bazơ mạnh và bazơ yếu NH3', () => {
    const cAcid = createContainer('c1', 250);
    addChemical(cAcid, 'HCl', 20);
    expect(computePH(cAcid)).toBeLessThan(3);

    const cWeakBase = createContainer('c2', 250);
    addChemical(cWeakBase, 'NH3', 20);
    const phNH3 = computePH(cWeakBase);
    expect(phNH3).toBeGreaterThan(9);
    expect(phNH3).toBeLessThan(13);
  });
});
