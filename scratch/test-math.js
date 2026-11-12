import katex from 'katex';
import { formatMathAndChemSymbols } from '../src/lib/chemFormulaFormatter.js';

const MATH_RE = /(\$\$[\s\S]+?\$\$|\$(?:\\\$|[^$])+\$)/g;
const str = 'Một máy bay bay ngang ở độ cao $H = 500\\text{ m}$ với tốc độ không đổi $v_0 = 180\\text{ km/h}$ thả một kiện hàng cứu trợ. Lấy $g = 9{,}8\\text{ m/s}^2$, bỏ qua lực cản không khí.';
const parts = str.split(MATH_RE);

for (const p of parts) {
  const isMath = p.startsWith('$') && p.endsWith('$');
  if (isMath) {
    const src = p.slice(1, -1).trim();
    try {
      const html = katex.renderToString(src, { displayMode: false, throwOnError: false });
      console.log('Math rendered OK:', src);
    } catch (e) {
      console.log('Math ERROR:', src, e.message);
    }
  } else {
    console.log('Text part:', JSON.stringify(p));
  }
}
