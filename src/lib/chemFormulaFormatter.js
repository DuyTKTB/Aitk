/**
 * chemFormulaFormatter.js
 * Chuẩn hóa ký hiệu hóa học, vật lý, sinh học, toán học,
 * chỉ số dưới (subscript), chỉ số trên (superscript), mũi tên phản ứng,
 * điện tích ion, phép lai di truyền học và đơn vị khoa học chuẩn SGK.
 * Dùng cho Web UI, KaTeX, ELEC AI Companion và Xuất Word (.docx).
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
  // Ký hiệu alen di truyền sinh học và chỉ số trên
  'A': 'ᴬ', 'B': 'ᴮ', 'D': 'ᴰ', 'E': 'ᴱ', 'H': 'ᴴ', 'I': 'ᴵ',
  'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'R': 'ᴿ', 'T': 'ᵀ',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ',
  'g': 'ᵍ', 'h': 'ʰ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ',
  'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ',
  'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
};

const LATEX_MAP = [
  // Mũi tên phản ứng Hóa học & Dịch mã ARN
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

  // Ký hiệu Hy Lạp & Khoa học Vật lý / Hóa học
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
  [/\\varphi\b/g, 'φ'],
  [/\\phi\b/g, 'ϕ'],
  [/\\theta\b/g, 'θ'],
  [/\\tau\b/g, 'τ'],
  [/\\rho\b/g, 'ρ'],
  [/\\varepsilon\b/g, 'ε'],
  [/\\eta\b/g, 'η'],
  [/\\nu\b/g, 'ν'],
  [/\\Phi\b/g, 'Φ'],
  [/\\infty\b/g, '∞'],

  // Toán học & So sánh & Căn bậc hai
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
  [/\\sqrt\{([^{}]+)\}/g, '√($1)'],
  [/\\sqrt\b/g, '√'],

  // Nhiệt độ & Đơn vị & Chiều dài phân tử
  [/\^\\circ\s*C/g, '°C'],
  [/\^\{\\circ\}\s*C/g, '°C'],
  [/\^o\s*C/g, '°C'],
  [/\^\{\s*°\s*\}\s*C/g, '°C'],
  [/\^°/g, '°'],
  [/\\circ\b/g, '°'],
  [/\\AA\b/g, 'Å'],
  [/\\degree\b/g, '°'],
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
  ['Al2(SO4)3', 'Al₂(SO₄)₃'], ['(NH4)2SO4', '(NH₄)₂SO₄'], ['Ca(HCO3)2', 'Ca(HCO₃)₂'],
  ['Ba(HCO3)2', 'Ba(HCO₃)₂'], ['Mg(HCO3)2', 'Mg(HCO₃)₂'],
  ['Na2CO3', 'Na₂CO₃'], ['NaHCO3', 'NaHCO₃'], ['Na2SO4', 'Na₂SO₄'], ['K2SO4', 'K₂SO₄'],
  ['CaCO3', 'CaCO₃'], ['CaSO4', 'CaSO₄'], ['BaSO4', 'BaSO₄'], ['BaCl2', 'BaCl₂'],
  ['MgCl2', 'MgCl₂'], ['CaCl2', 'CaCl₂'], ['FeCl2', 'FeCl₂'], ['FeCl3', 'FeCl₃'], ['AlCl3', 'AlCl₃'],
  ['AgNO3', 'AgNO₃'], ['KMnO4', 'KMnO₄'], ['K2Cr2O7', 'K₂Cr₂O₇'], ['Na2S2O3', 'Na₂S₂O₃'],
  ['CnH2n+2', 'CₙH₂ₙ₊₂'], ['CnH2n', 'CₙH₂ₙ'], ['CnH2n-2', 'CₙH₂ₙ₋₂'],
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
 * Chuẩn hóa toàn diện công thức hóa học, vật lý, sinh học, toán học và ký hiệu khoa học
 */
export function formatMathAndChemSymbols(text) {
  if (!text || typeof text !== 'string') return text ?? '';

  let s = text;

  // 1. Loại bỏ các lệnh bọc LaTeX không cần thiết khi hiển thị text thuần
  for (let iter = 0; iter < 3; iter++) {
    s = s.replace(/\\(?:text|mathrm|mathbf|mathit|ce|textbf|textit|operatorname)\{([^{}]*)\}/g, '$1');
  }
  s = s.replace(/\\vec\{([^{}]+)\}/g, '$1');

  // 2. Chuyển đổi các ký hiệu LaTeX cơ bản
  for (const [re, rep] of LATEX_MAP) {
    s = s.replace(re, rep);
  }

  // 3. Xử lý lũy thừa 10 và số mũ: 10^5, 10^-3, 10^{-3}, 10^{-34}
  s = s.replace(/\b10\^\{([+-]?\d+)\}/g, (_, d) => '10' + toSuperscript(d));
  s = s.replace(/\b10\^([+-]?\d+)/g, (_, d) => '10' + toSuperscript(d));

  // 4. Xử lý đơn vị Vật lý có số mũ: m/s^2, cm/s^2, rad/s^2, kg/m^3, g/cm^3
  s = s.replace(/\b(m|cm|rad|km)\/s\^?2\b/gi, '$1/s²');
  s = s.replace(/\b(kg|g)\/(m|cm|dm)\^?3\b/gi, '$1/$2³');

  // 5. Xử lý chỉ số dưới Vật lý phổ biến: v_0, x_0, t_0, a_0, N_0, m_0, f_0, U_0, I_0, \lambda_0
  s = s.replace(/\b([vxtamNfUIλ])_0\b/g, (_, sym) => sym + '₀');
  s = s.replace(/\b([vxaF])_max\b/gi, (_, sym) => sym + 'ₘₐₓ');
  s = s.replace(/\b([va])_min\b/gi, (_, sym) => sym + 'ₘᵢₙ');
  s = s.replace(/\bW_d\b/gi, 'W_đ');
  s = s.replace(/\bW_t\b/gi, 'W_t');

  // 6. Xử lý Sinh học: Thế hệ F1, F2, F3, Fn, Fa, P_tc
  s = s.replace(/\bF([1-9]|n|a|b)\b/g, (_, gen) => 'F' + toSubscript(gen));
  s = s.replace(/\bP_tc\b/gi, 'P_{t/c}');
  s = s.replace(/\bPt\/c\b/gi, 'P_{t/c}');
  s = s.replace(/\b(5|3)'\s*(?:->|→)\s*(3|5)'/g, "$1' → $2'");
  s = s.replace(/\bp\^2\b/g, 'p²').replace(/\bq\^2\b/g, 'q²');
  s = s.replace(/\b2n\s*\+\s*1\b/g, '2n + 1').replace(/\b2n\s*-\s*1\b/g, '2n - 1');

  // 7. Xử lý Sinh học: Phép lai x -> × (Aa x Aa -> Aa × Aa, AaBb x AaBb -> AaBb × AaBb)
  s = s.replace(/\b([A-Za-z]{2,8})\s+[xX]\s+([A-Za-z]{2,8})\b/g, '$1 × $2');

  // 8. Xử lý Sinh học: Alen liên kết giới tính và nhóm máu có số mũ: X^A, X^a, X^B, X^b, I^A, I^B, I^O
  s = s.replace(/\b([XI])\^([ABDEHIMNOPRTabcdefgklmoprstuvwxyzo])\b/g, (_, lead, sup) => lead + toSuperscript(sup));

  // 9. Xử lý LaTeX superscript: ^{...} và ^(số/dấu)
  s = s.replace(/\^\{([^{}]+)\}/g, (_, sup) => toSuperscript(sup));
  s = s.replace(/\^([0-9\+\-]+)/g, (_, sup) => toSuperscript(sup));

  // 10. Xử lý LaTeX subscript: _{...} hoặc _(\d+)
  s = s.replace(/_\{([^{}]+)\}/g, (_, sub) => toSubscript(sub));
  s = s.replace(/([A-Za-z)\]°\p{L}])_(\d+)/gu, (_, lead, digits) => lead + toSubscript(digits));

  // 11. Xử lý điện tích ion phổ biến: 2+, 3+, 2-, 3-, +, -
  // Ion có số hóa trị (2+, 3+, 2-, 3-): Fe3+, Cu2+, Al3+, SO4 2-, SO4^2-, CO3^2-, PO4^3-
  s = s.replace(/\^([1-4][+-])/g, (_, ion) => toSuperscript(ion));
  s = s.replace(/([A-Za-z)\]])\^([1-4]?[+-])/g, (_, lead, ion) => lead + toSuperscript(ion));
  s = s.replace(/\b(Fe|Cu|Al|Ca|Ba|Mg|Zn|Pb|Cr|Mn)\s*\^?([1-4][+-])(?![A-Za-z0-9])/g, (_, elem, charge) => elem + toSuperscript(charge));
  s = s.replace(/\b(SO4|CO3|SO3|PO4)\s*\^?([1-4][+-])(?![A-Za-z0-9])/g, (_, elem, charge) => elem + toSuperscript(charge));
  // Ion đơn điện tích (+ hoặc -): Na+, K+, H+, Ag+, Li+, NH4+, OH-, Cl-, Br-, I-, NO3-, MnO4- (không cách trước dấu + / -)
  s = s.replace(/\b(Na|K|H|Li|Ag|NH4)\^?([+-])(?![A-Za-z0-9])/g, (_, elem, charge) => elem + toSuperscript(charge));
  s = s.replace(/\b(OH|Cl|Br|I|NO3|MnO4)\^?([+-])(?![A-Za-z0-9])/g, (_, elem, charge) => elem + toSuperscript(charge));
  // Điện tích ion gắn trực tiếp sau ký tự có chỉ số (VD: Fe³⁺, Al³⁺, SO₄²⁻, NO₃⁻)
  s = s.replace(/([A-Za-z₀-₉)\]])([1-4][+-])(?![A-Za-z0-9])/g, (_, elem, charge) => elem + toSuperscript(charge));
  s = s.replace(/([₀-₉)\]])([+-])(?![A-Za-z0-9])/g, (_, elem, charge) => elem + toSuperscript(charge));

  // 12. Thay thế các công thức hóa học phổ thông
  s = s.replace(CHEM_EXACT_RE, (m, prefix, chem) => prefix + (CHEM_EXACT_MAP.get(chem) || chem));

  // 13. Chuyển số trong công thức hóa học hữu cơ/vô cơ đơn lẻ: VD Fe2(SO4)3 -> Fe₂(SO₄)₃
  s = s.replace(/([A-Z][a-z]?|\))(\d+)(?![0-9\p{L}])/gu, (_, elem, digits) => elem + toSubscript(digits));

  // 14. Ký hiệu kết tủa và bay hơi trong phương trình Hóa học
  // e.g. CO2 ^ -> CO2 ↑, BaSO4 v -> BaSO4 ↓
  s = s.replace(/([A-Za-z₀-₉)\]])\s*\^(\s|$|[.,;!])/g, '$1 ↑$2');
  s = s.replace(/([A-Za-z₀-₉)\]])\s*v(\s|$|[.,;!])/g, '$1 ↓$2');

  // 15. Dọn dẹp dấu $ bao quanh công thức nếu không chứa biểu thức KaTeX phức tạp (phân số, tích phân)
  // Nếu chỉ bọc $H2O$ hay $H_2SO_4$ hay $⇌$ hay $→$ thì bỏ $ để hiển thị chữ đẹp tự nhiên
  s = s.replace(/\$([^$\\]+)\$/g, '$1');
  s = s.replace(/\$([A-Za-z0-9\s₀-₉⁰-⁹⁺⁻⇌→Δ·,()\-+=_]+)\$/g, '$1');
  // Dọn dẹp dấu $ đơn lẻ sót lại trước/sau các công thức
  s = s.replace(/\$([A-Za-z0-9₀-₉⁰-⁹⁺⁻]+)/g, '$1').replace(/([A-Za-z0-9₀-₉⁰-⁹⁺⁻]+)\$/g, '$1');

  // 16. Dọn dẹp khoảng trắng dư
  return s.trim();
}

export default formatMathAndChemSymbols;
