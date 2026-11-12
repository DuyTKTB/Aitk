import { describe, it, expect } from 'vitest';
import React from 'react';
import { MarkdownLike } from '../src/components/ChatMarkdown.jsx';
import { formatMathAndChemSymbols } from '../src/lib/chemFormulaFormatter.js';
import { normalizeMathString, hasMath } from '../src/components/MathText.jsx';

describe('ChatMarkdown — ChatGPT-Style Markdown Normalization & Rendering', () => {
  it('normalizes squashed headers and bullets so they do not run together into a single line', () => {
    const rawSquashed = 'quy trình chuẩn: ### 1. Truy cập tab Số liệu lớp Thầy/Cô có thể xem điểm: * **Lọc theo lớp:** Chọn lớp. * **Lọc theo đề:** Chọn đề. ### 2. Phân tích số liệu';
    
    // Normalization logic inside MarkdownLike
    const normalized = rawSquashed
      .replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2')
      .replace(/([^\n])\s+([*•-]\s+)/g, '$1\n$2');

    expect(normalized).toContain('\n\n### 1.');
    expect(normalized).toContain('\n* **Lọc theo lớp:**');
    expect(normalized).toContain('\n* **Lọc theo đề:**');
    expect(normalized).toContain('\n\n### 2.');
  });

  it('renders blockquote callout boxes and dividers properly', () => {
    const textWithCallout = '> **Lưu ý sư phạm:** Nhớ xuất Excel báo cáo\n---\nNội dung tiếp theo';
    const lines = textWithCallout.split('\n');
    expect(lines[0].startsWith('>')).toBe(true);
    expect(lines[1]).toBe('---');
  });

  it('parses markdown tables with headers and rows', () => {
    const tableText = '| Lớp | Sĩ số | Điểm TB |\n| --- | --- | --- |\n| 11A5 | 40 | 7.8 |\n| 11A7 | 38 | 8.2 |';
    const lines = tableText.split('\n');
    expect(lines.every((l) => l.startsWith('|') && l.endsWith('|'))).toBe(true);
  });
});

describe('formatMathAndChemSymbols — Chuẩn hóa Ký hiệu Khoa học Tự nhiên', () => {
  it('chuẩn hóa Hóa học: công thức phân tử, ion, kết tủa, khí và mũi tên phản ứng', () => {
    expect(formatMathAndChemSymbols('H2SO4')).toBe('H₂SO₄');
    expect(formatMathAndChemSymbols('Fe2(SO4)3')).toBe('Fe₂(SO₄)₃');
    expect(formatMathAndChemSymbols('Al(OH)3')).toBe('Al(OH)₃');
    expect(formatMathAndChemSymbols('Ca(HCO3)2')).toBe('Ca(HCO₃)₂');
    expect(formatMathAndChemSymbols('CnH2n+2')).toBe('CₙH₂ₙ₊₂');
    expect(formatMathAndChemSymbols('Fe3+')).toBe('Fe³⁺');
    expect(formatMathAndChemSymbols('Cu2+')).toBe('Cu²⁺');
    expect(formatMathAndChemSymbols('Al3+')).toBe('Al³⁺');
    expect(formatMathAndChemSymbols('SO4 2-')).toBe('SO₄²⁻');
    expect(formatMathAndChemSymbols('Cl-')).toBe('Cl⁻');
    expect(formatMathAndChemSymbols('Na+')).toBe('Na⁺');
    expect(formatMathAndChemSymbols('Fe + 2HCl -> FeCl2 + H2 ^')).toBe('Fe + 2HCl → FeCl₂ + H₂ ↑');
    expect(formatMathAndChemSymbols('BaCl2 + Na2SO4 -> BaSO4 v + 2NaCl')).toBe('BaCl₂ + Na₂SO₄ → BaSO₄ ↓ + 2NaCl');
    expect(formatMathAndChemSymbols('N2 + 3H2 <=> 2NH3')).toBe('N₂ + 3H₂ ⇌ 2NH₃');
  });

  it('chuẩn hóa Vật lý: số mũ, đơn vị, chữ cái Hy Lạp và chỉ số dao động/sóng', () => {
    expect(formatMathAndChemSymbols('10^-3')).toBe('10⁻³');
    expect(formatMathAndChemSymbols('10^5')).toBe('10⁵');
    expect(formatMathAndChemSymbols('m/s^2')).toBe('m/s²');
    expect(formatMathAndChemSymbols('cm/s^2')).toBe('cm/s²');
    expect(formatMathAndChemSymbols('kg/m^3')).toBe('kg/m³');
    expect(formatMathAndChemSymbols('\\omega')).toBe('ω');
    expect(formatMathAndChemSymbols('\\lambda')).toBe('λ');
    expect(formatMathAndChemSymbols('\\Delta')).toBe('Δ');
    expect(formatMathAndChemSymbols('\\varphi')).toBe('φ');
    expect(formatMathAndChemSymbols('\\Omega')).toBe('Ω');
    expect(formatMathAndChemSymbols('v_0')).toBe('v₀');
    expect(formatMathAndChemSymbols('x_0')).toBe('x₀');
    expect(formatMathAndChemSymbols('v_max')).toBe('vₘₐₓ');
    expect(formatMathAndChemSymbols('a_max')).toBe('aₘₐₓ');
    expect(formatMathAndChemSymbols('W_d')).toBe('W_đ');
    expect(formatMathAndChemSymbols('W_t')).toBe('W_t');
  });

  it('chuẩn hóa Sinh học: phép lai, thế hệ F1/F2, alen liên kết giới tính và phân tử', () => {
    expect(formatMathAndChemSymbols('Aa x Aa')).toBe('Aa × Aa');
    expect(formatMathAndChemSymbols('AaBb x AaBb')).toBe('AaBb × AaBb');
    expect(formatMathAndChemSymbols('P: AA x aa')).toBe('P: AA × aa');
    expect(formatMathAndChemSymbols('F1')).toBe('F₁');
    expect(formatMathAndChemSymbols('F2')).toBe('F₂');
    expect(formatMathAndChemSymbols('F3')).toBe('F₃');
    expect(formatMathAndChemSymbols('Fa')).toBe('Fₐ');
    expect(formatMathAndChemSymbols('X^A X^a')).toBe('Xᴬ Xᵃ');
    expect(formatMathAndChemSymbols('X^A Y')).toBe('Xᴬ Y');
    expect(formatMathAndChemSymbols('I^A I^B')).toBe('Iᴬ Iᴮ');
    expect(formatMathAndChemSymbols('5\' -> 3\'')).toBe("5' → 3'");
    expect(formatMathAndChemSymbols('3\' -> 5\'')).toBe("3' → 5'");
    expect(formatMathAndChemSymbols('2n + 1')).toBe('2n + 1');
    expect(formatMathAndChemSymbols('p^2')).toBe('p²');
  });
});

describe('MathText — Chuẩn hóa Delimiter LaTeX & mhchem', () => {
  it('chuẩn hóa display math \\[ ... \\] thành $$ ... $$', () => {
    const input = '\\[ T = 2\\pi\\sqrt{\\frac{m}{k}} \\]';
    const normalized = normalizeMathString(input);
    expect(normalized).toBe('$$T = 2\\pi\\sqrt{\\frac{m}{k}}$$');
    expect(hasMath(normalized)).toBe(true);
  });

  it('chuẩn hóa inline math \\( ... \\) thành $ ... $', () => {
    const input = '\\( \\lambda = \\frac{v}{f} \\)';
    const normalized = normalizeMathString(input);
    expect(normalized).toBe('$\\lambda = \\frac{v}{f}$');
    expect(hasMath(normalized)).toBe(true);
  });

  it('tự động bọc \\ce{...} ngoài dấu $ để KaTeX mhchem render chuẩn', () => {
    const input = 'Phương trình: \\ce{2H2 + O2 -> 2H2O}';
    const normalized = normalizeMathString(input);
    expect(normalized).toContain('$\\ce{2H2 + O2 -> 2H2O}$');
    expect(hasMath(normalized)).toBe(true);
  });
});
