/* chemText.js — định dạng inline cho câu trả lời AI (an toàn XSS, tự viết công thức hóa học đẹp)
   H2O → H₂O · Fe3+ → Fe³⁺ · SO4^2- → SO₄²⁻ · -> → → · <=> → ⇌ */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ELEMENTS = new Set(
  ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr').split(' ')
);
const DIATOMIC = new Set(['H2', 'N2', 'O2', 'F2', 'Cl2', 'Br2', 'I2', 'O3', 'P4', 'S8']);

// (tiền tố)(công thức)(điện tích ^2- hoặc + / -) — không dùng lookbehind để chạy được trên Safari cũ
const FORMULA_RE = /(^|[^A-Za-z])((?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+)(?:\^(\d*[+-])|([+-]))?(?![A-Za-z0-9])/g;

export function chemify(s) {
  return s.replace(FORMULA_RE, (m, pre, f, caret, bare) => {
    const syms = f.match(/[A-Z][a-z]?/g) || [];
    if (!syms.length || !syms.every((x) => ELEMENTS.has(x))) return m;
    const charge = caret || bare || '';
    const single = syms.length === 1 && !f.includes('(');

    if (single) {
      const base = f.match(/^[A-Z][a-z]?/)[0];
      const digits = f.slice(base.length);
      if (charge) return `${pre}${base}<sup>${caret ? caret : digits + charge}</sup>`;
      if (DIATOMIC.has(f)) return `${pre}${base}<sub>${digits}</sub>`;
      return m;
    }
    if (!/\d/.test(f) && !charge) return m; // NaCl, CO… giữ nguyên
    const body = f.replace(/(\d+)/g, '<sub>$1</sub>');
    return `${pre}${body}${charge ? `<sup>${charge}</sup>` : ''}`;
  });
}

export function inlineFormat(text) {
  return String(text)
    .split(/(`[^`\n]+`)/g)
    .map((seg, i) => {
      if (i % 2 === 1) return `<code class="ds-inline-code">${esc(seg.slice(1, -1))}</code>`;
      let s = esc(seg)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/g, '$1<em>$2</em>')
        .replace(/&lt;=&gt;/g, '⇌')
        .replace(/-&gt;/g, '→');
      return chemify(s);
    })
    .join('');
}
