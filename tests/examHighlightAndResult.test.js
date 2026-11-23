import { describe, it, expect } from 'vitest';
import { tokenizeForHighlight } from '../src/components/exam/HighlightableMathText.jsx';
import { formatMathAndChemSymbols } from '../src/lib/chemFormulaFormatter.js';

describe('HighlightableMathText — tokenizeForHighlight', () => {
  it('giữ nguyên công thức inline/display KaTeX và tách từ tiếng Việt chuẩn', () => {
    const tokens = tokenizeForHighlight('Tính pH của dung dịch $\\ce{H2SO4}$ $0,05M$ ở đkc.');
    const mathTokens = tokens.filter((t) => t.type === 'math').map((t) => t.value);
    const words = tokens.filter((t) => t.type === 'word').map((t) => t.value);

    expect(mathTokens).toEqual(['$\\ce{H2SO4}$', '$0,05M$']);
    expect(words).toContain('Tính');
    expect(words).toContain('pH');
    expect(words).toContain('đkc.');
    // Bảo toàn nguyên văn khi ghép lại
    expect(tokens.map((t) => t.value).join('')).toBe('Tính pH của dung dịch $\\ce{H2SO4}$ $0,05M$ ở đkc.');
  });

  it('tự bọc \\ce{...} bên ngoài $...$ thành token math an toàn', () => {
    const tokens = tokenizeForHighlight('Phản ứng \\ce{Fe + 2HCl -> FeCl2 + H2} tạo khí.');
    const mathTokens = tokens.filter((t) => t.type === 'math');
    expect(mathTokens.length).toBe(1);
    expect(mathTokens[0].value).toContain('\\ce{Fe + 2HCl -> FeCl2 + H2}');
  });

  it('giữ nguyên khối code Tin học và giá tiền $15..$25 trong Tiếng Anh không bị biến thành KaTeX', () => {
    const codeText = 'Xem đoạn lệnh:\n```python\nprice = "$10"\nif x > 0:\n    print(x)\n```\nvà biểu thức `a + b` cùng công thức $x^2 + 1$.';
    const tokens = tokenizeForHighlight(codeText);
    const codeTokens = tokens.filter((t) => t.type === 'code').map((t) => t.value);
    const mathTokens = tokens.filter((t) => t.type === 'math').map((t) => t.value);

    expect(codeTokens.some((c) => c.includes('print(x)'))).toBe(true);
    expect(codeTokens).toContain('`a + b`');
    expect(mathTokens).toEqual(['$x^2 + 1$']);
    expect(tokens.map((t) => t.value).join('')).toBe(codeText);

    const priceTokens = tokenizeForHighlight('The ticket costs between $15 and $25 per person.');
    expect(priceTokens.some((t) => t.type === 'math')).toBe(false);
    expect(priceTokens.map((t) => t.value).join('')).toBe('The ticket costs between $15 and $25 per person.');
  });

  it('trả mảng rỗng an toàn khi chuỗi trống hoặc null', () => {
    expect(tokenizeForHighlight('')).toEqual([]);
    expect(tokenizeForHighlight(null)).toEqual([]);
    expect(tokenizeForHighlight(undefined)).toEqual([]);
  });
});

describe('chemFormulaFormatter — dọn ngoặc rỗng từ OCR/Word', () => {
  it('xóa sạch _{} và ^{} không để lại khoảng trắng kép', () => {
    expect(formatMathAndChemSymbols('hơn thú là do _{} Hình 2')).toBe('hơn thú là do Hình 2');
    expect(formatMathAndChemSymbols('năng lượng ^{} cao')).toBe('năng lượng cao');
  });

  it('vẫn giữ đúng công thức hóa học và lũy thừa hợp lệ', () => {
    expect(formatMathAndChemSymbols('H_{2}O + CO_{2} -> H_{2}CO_{3}')).toBe('H₂O + CO₂ → H₂CO₃');
    expect(formatMathAndChemSymbols('10^{-3} mol')).toBe('10⁻³ mol');
  });
});
