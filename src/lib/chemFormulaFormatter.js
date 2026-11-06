/**
 * chemFormulaFormatter.js
 * Chuẩn hóa ký hiệu hóa học, toán học, chỉ số dưới (subscript),
 * chỉ số trên (superscript), mũi tên phản ứng, điện tích ion.
 * Dùng cho cả Web UI, KaTeX và Xuất Word (.docx).
 */

const SUB_MAP = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ',
};

const SUP_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ',
};

const LATEX_MAP = [
  // Mũi tên phản ứng
  [/\\rightleftharpoons/g, '⇌'],
  [/\\leftrightharpoons/g, '⇌'],
  [/<=>/g, '⇌'],
  [/<->/g, '⇌'],
  [/\\longleftrightarrow/g, '⇌'],
  [/\\rightarrow/g, '→'],
  [/\\longrightarrow/g, '→'],
  [/\\to\b/g, '→'],
  [/-->/g, '→'],
  [/->/g, '→'],
  [/=>/g, '→'],
  [/\\uparrow/g, '↑'],
  [/\\downarrow/g, '↓'],

  // Ký hiệu Hy Lạp & Khoa học
  [/\\Delta\b/g, 'Δ'],
  [/\\delta\b/g, 'δ'],
  [/\\alpha\b/g, 'α'],
  [/\\beta\b/g, 'β'],
  [/\\gamma\b/g, 'γ'],
  [/\\pi\b/g, 'π'],
  [/\\lambda\b/g, 'λ'],
  [/\\mu\b/g, 'μ'],
  [/\\sigma\b/g, 'σ'],
  [/\\Omega\b/g, 'Ω'],
  [/\\omega\b/g, 'ω'],
  [/\\infty\b/g, '∞'],

  // Toán học & So sánh
  [/\\approx\b/g, '≈'],
  [/\\leq?\b/g, '≤'],
  [/<=/g, '≤'],
  [/\\geq?\b/g, '≥'],
  [/>=/g, '≥'],
  [/\\neq\b/g, '≠'],
  [/!=/g, '≠'],
  [/\\pm\b/g, '±'],
  [/\+-/g, '±'],
  [/\\times\b/g, '×'],
  [/\\cdot\b/g, '·'],
  [/\\bullet\b/g, '•'],

  // Nhiệt độ & Đơn vị
  [/\^\\circ\s*C/g, '°C'],
  [/\^\{\\circ\}\s*C/g, '°C'],
  [/\^o\s*C/g, '°C'],
  [/\^\{\s*°\s*\}\s*C/g, '°C'],
  [/\^°/g, '°'],
  [/\\circ\b/g, '°'],
  [/\\%/g, '%'],
  [/\\ /g, ' '],
];

// Danh sách thay thế trực tiếp các chất hóa học phổ thông
const COMMON_CHEMS = [
  ['H2SO4', 'H₂SO₄'], ['H2SO3', 'H₂SO₃'], ['H2S', 'H₂S'], ['H2CO3', 'H₂CO₃'],
  ['H2O2', 'H₂O₂'], ['H2O', 'H₂O'], ['H2', 'H₂'],
  ['HNO3', 'HNO₃'], ['HNO2', 'HNO₂'], ['NH4', 'NH₄'], ['NH3', 'NH₃'], ['N2', 'N₂'],
  ['CO2', 'CO₂'], ['CO3', 'CO₃'], ['SO4', 'SO₄'], ['SO3', 'SO₃'], ['SO2', 'SO₂'],
  ['NO3', 'NO₃'], ['NO2', 'NO₂'], ['PO4', 'PO₄'], ['PO3', 'PO₃'], ['HCO3', 'HCO₃'],
  ['O2', 'O₂'], ['O3', 'O₃'], ['Cl2', 'Cl₂'], ['Br2', 'Br₂'], ['I2', 'I₂'], ['F2', 'F₂'],
  ['CH4', 'CH₄'], ['C2H6', 'C₂H₆'], ['C2H4', 'C₂H₄'], ['C2H2', 'C₂H₂'],
  ['C3H8', 'C₃H₈'], ['C3H6', 'C₃H₆'], ['C3H4', 'C₃H₄'], ['C4H10', 'C₄H₁₀'],
  ['C6H6', 'C₆H₆'], ['C7H8', 'C₇H₈'], ['C2H5OH', 'C₂H₅OH'], ['CH3COOH', 'CH₃COOH'],
  ['CH3COONa', 'CH₃COONa'], ['HCOOH', 'HCOOH'], ['HCOOCH3', 'HCOOCH₃'], ['CH3COOC2H5', 'CH₃COOC₂H₅'],
  ['C6H12O6', 'C₆H₁₂O₆'], ['C12H22O11', 'C₁₂H₂₂O₁₁'], ['(C6H10O5)n', '(C₆H₁₀O₅)ₙ'],
  ['Ca(OH)2', 'Ca(OH)₂'], ['Ba(OH)2', 'Ba(OH)₂'], ['Mg(OH)2', 'Mg(OH)₂'],
  ['Al(OH)3', 'Al(OH)₃'], ['Fe(OH)2', 'Fe(OH)₂'], ['Fe(OH)3', 'Fe(OH)₃'], ['Cu(OH)2', 'Cu(OH)₂'],
  ['Fe2O3', 'Fe₂O₃'], ['Fe3O4', 'Fe₃O₄'], ['Al2O3', 'Al₂O₃'], ['Cr2O3', 'Cr₂O₃'], ['P2O5', 'P₂O₅'],
  ['CuSO4', 'CuSO₄'], ['ZnSO4', 'ZnSO₄'], ['FeSO4', 'FeSO₄'], ['Fe2(SO4)3', 'Fe₂(SO₄)₃'],
  ['Na2CO3', 'Na₂CO₃'], ['NaHCO3', 'NaHCO₃'], ['Na2SO4', 'Na₂SO₄'], ['K2SO4', 'K₂SO₄'],
  ['CaCO3', 'CaCO₃'], ['CaSO4', 'CaSO₄'], ['BaSO4', 'BaSO₄'], ['BaCl2', 'BaCl₂'],
  ['MgCl2', 'MgCl₂'], ['CaCl2', 'CaCl₂'], ['FeCl2', 'FeCl₂'], ['FeCl3', 'FeCl₃'], ['AlCl3', 'AlCl₃'],
  ['AgNO3', 'AgNO₃'], ['KMnO4', 'KMnO₄'], ['K2Cr2O7', 'K₂Cr₂O₇'], ['Na2S2O3', 'Na₂S₂O₃'],
].sort((a, b) => b[0].length - a[0].length);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CHEM_EXACT_RE = new RegExp(`(^|[^0-9A-Za-z_])(${COMMON_CHEMS.map(([c]) => esc(c)).join('|')})(?![0-9A-Za-z_])`, 'g');
const CHEM_EXACT_MAP = new Map(COMMON_CHEMS);

/**
 * Chuyển một chuỗi ký tự thành chỉ số dưới Unicode
 */
export function toSubscript(str) {
  return String(str || '').split('').map((ch) => SUB_MAP[ch] || ch).join('');
}

/**
 * Chuyển một chuỗi ký tự thành chỉ số trên Unicode
 */
export function toSuperscript(str) {
  return String(str || '').split('').map((ch) => SUP_MAP[ch] || ch).join('');
}

/**
 * Chuẩn hóa toàn diện công thức hóa học, toán học và ký hiệu khoa học
 */
export function formatMathAndChemSymbols(text) {
  if (!text || typeof text !== 'string') return text ?? '';

  let s = text;

  // 1. Loại bỏ các lệnh bọc LaTeX không cần thiết: \text{...}, \mathrm{...}, \ce{...}
  for (let iter = 0; iter < 3; iter++) {
    s = s.replace(/\\(?:text|mathrm|mathbf|mathit|ce|textbf|textit)\{([^{}]*)\}/g, '$1');
  }

  // 2. Chuyển đổi các ký hiệu LaTeX cơ bản
  for (const [re, rep] of LATEX_MAP) {
    s = s.replace(re, rep);
  }

  // 3. Xử lý lũy thừa 10: 10^5, 10^-3, 10^{-3}
  s = s.replace(/\b10\^\{([+-]?\d+)\}/g, (_, d) => '10' + toSuperscript(d));
  s = s.replace(/\b10\^([+-]?\d+)/g, (_, d) => '10' + toSuperscript(d));

  // 4. Xử lý LaTeX subscript: _{...} hoặc _(\d+)
  s = s.replace(/_\{([^{}]+)\}/g, (_, sub) => toSubscript(sub));
  s = s.replace(/([A-Za-z)\]°])_(\d+)/g, (_, lead, digits) => lead + toSubscript(digits));

  // 5. Xử lý LaTeX superscript: ^{...}
  s = s.replace(/\^\{([^{}]+)\}/g, (_, sup) => toSuperscript(sup));

  // 6. Xử lý điện tích ion phổ biến: 2+, 3+, 2-, 3-, +, -
  // Cu^2+ -> Cu²⁺, SO4^2- -> SO4²⁻, Fe3+ -> Fe³⁺, Al3+ -> Al³⁺, Na+ -> Na⁺, Cl- -> Cl⁻
  s = s.replace(/\^([1-4]?)([+-])/g, (_, n, sign) => toSuperscript(n + sign));
  s = s.replace(/([A-Za-z)\]])\^([1-4]?[+-])/g, (_, lead, ion) => lead + toSuperscript(ion));

  // 7. Thay thế các công thức hóa học phổ thông
  s = s.replace(CHEM_EXACT_RE, (m, prefix, chem) => prefix + (CHEM_EXACT_MAP.get(chem) || chem));

  // 8. Chuyển số trong công thức hóa học hữu cơ/vô cơ đơn lẻ: VD Fe2(SO4)3 -> Fe₂(SO₄)₃
  s = s.replace(/([A-Z][a-z]?|\))(\d+)(?![0-9\p{L}])/gu, (_, elem, digits) => elem + toSubscript(digits));

  // 9. Dọn dẹp dấu $ bao quanh công thức nếu không chứa biểu thức KaTeX phức tạp (phân số, tích phân)
  // Nếu chỉ bọc $H2O$ hay $H_2SO_4$ hay $⇌$ hay $→$ thì bỏ $ để hiển thị chữ đẹp tự nhiên
  s = s.replace(/\$([A-Za-z0-9₀-₉⁰-⁹⁺⁻⇌→Δ·\s,()]+)\$/g, '$1');

  // 10. Dọn dẹp khoảng trắng dư
  return s.trim();
}

export default formatMathAndChemSymbols;
