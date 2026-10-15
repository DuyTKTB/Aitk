import { describe, it, expect } from 'vitest';
import {
  parseFormula, molarMass, prettyFormula, balanceEquation, checkBalance, splitEquation,
} from '../src/lib/chemBalance.js';

describe('parseFormula', () => {
  it('đếm nguyên tử cơ bản', () => {
    expect(parseFormula('H2O')).toEqual({ H: 2, O: 1 });
  });

  it('xử lý ngoặc', () => {
    expect(parseFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(parseFormula('Al2(SO4)3')).toEqual({ Al: 2, S: 3, O: 12 });
  });

  it('xử lý hydrat', () => {
    expect(parseFormula('CuSO4·5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 });
  });

  it('báo lỗi với công thức sai', () => {
    expect(() => parseFormula('Xx2')).toThrow();
    expect(() => parseFormula('H2(O')).toThrow();
  });
});

describe('molarMass', () => {
  it('H2SO4 ≈ 98 g/mol', () => {
    const mm = molarMass('H2SO4');
    expect(mm.value).toBeCloseTo(98.07, 1);
    expect(mm.unknown).toEqual([]);
    expect(mm.breakdown.find((b) => b.symbol === 'O').count).toBe(4);
  });

  it('Fe ≈ 55.845', () => {
    expect(molarMass('Fe').value).toBeCloseTo(55.845, 2);
  });

  it('CaCO3 ≈ 100', () => {
    expect(molarMass('CaCO3').value).toBeCloseTo(100.09, 1);
  });
});

describe('prettyFormula', () => {
  it('đưa chỉ số về Unicode', () => {
    expect(prettyFormula('H2SO4')).toBe('H₂SO₄');
    expect(prettyFormula('Ca(OH)2')).toBe('Ca(OH)₂');
  });
});

describe('balanceEquation', () => {
  it('Fe + O2 -> Fe2O3', () => {
    const r = balanceEquation('Fe + O2 -> Fe2O3');
    expect(r.equation).toBe('4Fe + 3O2 → 2Fe2O3');
    expect(checkBalance(r).ok).toBe(true);
    expect(r.ambiguous).toBe(false);
  });

  it('C3H8 + O2 -> CO2 + H2O', () => {
    const r = balanceEquation('C3H8 + O2 -> CO2 + H2O');
    expect(r.coeffL).toEqual([1, 5]);
    expect(r.coeffR).toEqual([3, 4]);
    expect(checkBalance(r).ok).toBe(true);
  });

  it('bỏ hệ số người dùng gõ sai rồi tự tính lại', () => {
    const r = balanceEquation('2Fe + 3O2 -> Fe2O3');
    expect(r.equation).toBe('4Fe + 3O2 → 2Fe2O3');
  });

  it('giữ mũi tên thuận nghịch', () => {
    const r = balanceEquation('N2 + H2 <=> NH3');
    expect(r.pretty).toContain('⇌');
    expect(r.coeffL).toEqual([1, 3]);
    expect(r.coeffR).toEqual([2]);
  });

  it('báo lỗi khi thiếu mũi tên', () => {
    expect(() => splitEquation('Fe O2')).toThrow();
  });
});

describe('checkBalance', () => {
  it('phát hiện sai lệch nguyên tố', () => {
    const fake = { left: [{ formula: 'Fe', coef: 1 }], right: [{ formula: 'Fe2O3', coef: 1 }] };
    const chk = checkBalance(fake);
    expect(chk.ok).toBe(false);
    expect(chk.diffs.length).toBeGreaterThan(0);
  });
});
