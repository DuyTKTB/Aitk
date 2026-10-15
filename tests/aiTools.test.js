import { describe, it, expect } from 'vitest';
import {
  desub, extractFormulas, extractQuantities, runTools, verifyToolResults, numbersIn,
} from '../src/lib/aiTools.js';

describe('desub', () => {
  it('đưa chỉ số Unicode về chữ số thường', () => {
    expect(desub('H₂SO₄')).toBe('H2SO4');
    expect(desub('10⁻³')).toBe('10-3');
  });
});

describe('extractFormulas', () => {
  it('tìm được chất trong câu tiếng Việt', () => {
    const fs = extractFormulas('Cho 5,6 gam Fe tác dụng với HCl dư');
    const names = fs.map((f) => f.formula);
    expect(names).toContain('Fe');
    expect(names).toContain('HCl');
  });

  it('không nhận nhầm từ thường', () => {
    const names = extractFormulas('Cho em hỏi bài này với ạ').map((f) => f.formula);
    expect(names).not.toContain('Ch');
    expect(names.length).toBe(0);
  });

  it('hiểu công thức viết bằng chỉ số Unicode', () => {
    const names = extractFormulas('Tính M của H₂SO₄').map((f) => f.formula);
    expect(names).toContain('H2SO4');
  });
});

describe('extractQuantities', () => {
  it('gắn số liệu với chất đứng sau', () => {
    const qs = extractQuantities('Cho 5,6 gam Fe tác dụng với HCl');
    const q = qs.find((x) => x.unit === 'g');
    expect(q.value).toBeCloseTo(5.6, 3);
    expect(q.near).toBe('Fe');
  });

  it('gắn số liệu với chất đứng trước', () => {
    const qs = extractQuantities('Fe: 5,6 gam');
    expect(qs.find((x) => x.unit === 'g').near).toBe('Fe');
  });

  it('đọc nồng độ mol và thể tích', () => {
    const qs = extractQuantities('Hòa tan 0,2 mol NaCl vào 500 ml nước');
    expect(qs.find((x) => x.unit === 'mol').value).toBeCloseTo(0.2, 3);
    expect(qs.find((x) => x.unit === 'ml').value).toBe(500);
  });
});

describe('runTools — khối lượng mol', () => {
  it('tính M(H2SO4)', () => {
    const { hits } = runTools('Tính khối lượng mol của H2SO4');
    const molar = hits.find((h) => h.tool === 'molar');
    expect(molar).toBeTruthy();
    expect(molar.value).toBeCloseTo(98.07, 1);
  });
});

describe('runTools — cân bằng phương trình', () => {
  it('cân bằng Fe + O2 -> Fe2O3', () => {
    const { hits } = runTools('Cân bằng phương trình: Fe + O2 -> Fe2O3');
    const bal = hits.find((h) => h.tool === 'balance');
    expect(bal).toBeTruthy();
    expect(bal.value).toBe('4Fe + 3O2 → 2Fe2O3');
    expect(bal.lines.join(' ')).toContain('ĐÃ KIỂM TRA');
  });
});

describe('runTools — dung dịch', () => {
  it('tính C_M = 0,4 M', () => {
    const { hits } = runTools('Hòa tan 0,2 mol NaCl vào 500 ml nước. Tính nồng độ mol CM');
    const sol = hits.find((h) => h.tool === 'solution');
    expect(sol).toBeTruthy();
    expect(sol.value).toBeCloseTo(0.4, 3);
  });

  it('tính pH dung dịch HCl 0,01 M', () => {
    const { hits } = runTools('Tính pH của dung dịch HCl 0,01 M');
    const sol = hits.find((h) => h.tool === 'solution');
    expect(sol).toBeTruthy();
    expect(sol.lines.join(' ')).toContain('pH ≈ 2');
  });
});

describe('runTools — tính theo phương trình', () => {
  it('5,6 gam Fe + HCl dư → V(H2) = 2,246 lít', () => {
    const { hits } = runTools('Cho 5,6 gam Fe tác dụng với HCl dư, tính thể tích khí H2 thoát ra ở đktc');
    const st = hits.find((h) => h.tool === 'stoich');
    expect(st).toBeTruthy();
    const h2 = st.results.find((r) => r.formula === 'H2');
    expect(h2).toBeTruthy();
    expect(h2.mol).toBeCloseTo(0.1, 2);
    expect(h2.volume).toBeCloseTo(2.246, 1);
  });
});

describe('verifyToolResults', () => {
  it('nhận ra đáp án khớp công cụ', () => {
    const { hits } = runTools('Cho 5,6 gam Fe tác dụng với HCl dư, tính thể tích khí H2 ở đktc');
    const v = verifyToolResults('n(Fe) = 0,1 mol. V(H₂) = 2,246 lít.', hits);
    expect(v.checked).toBeGreaterThan(0);
    expect(v.ok).toBe(true);
  });

  it('cảnh báo khi đáp án không dùng số của công cụ', () => {
    const { hits } = runTools('Cho 5,6 gam Fe tác dụng với HCl dư, tính thể tích khí H2 ở đktc');
    const v = verifyToolResults('Kết quả là 9,99 lít và 7,77 gam.', hits);
    expect(v.ok).toBe(false);
    expect(v.missing.length).toBeGreaterThan(0);
  });
});

describe('numbersIn', () => {
  it('hiểu dấu phẩy thập phân', () => {
    expect(numbersIn('m = 5,6 gam; n = 0,1 mol')).toEqual([5.6, 0.1]);
  });
});
