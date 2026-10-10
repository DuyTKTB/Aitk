/* ============================================================
   MathText.jsx — Hiển thị văn bản có công thức ($...$ / $$...$$)
   ------------------------------------------------------------
   • Dùng KaTeX + mhchem (viết hóa học: $\ce{H2SO4}$)
   • Tải KaTeX theo yêu cầu (lazy) → không làm nặng bundle chính
   • Văn bản không có công thức → hiển thị ngay, không tải gì
   • Cài:  npm i katex
   ============================================================ */
import { useEffect, useMemo, useState } from 'react';

let katexPromise = null;
const loadKatex = () => {
  if (!katexPromise) {
    katexPromise = Promise.all([
      import('katex'),
      import('katex/contrib/mhchem'),
      import('katex/dist/katex.min.css'),
    ]).then(([m]) => m.default || m);
  }
  return katexPromise;
};

const MATH_RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export const hasMath = (s) => typeof s === 'string' && /\$[^$]+\$/.test(s);

/** Bỏ ký hiệu $ để dùng ở nơi không render được (VD: tiêu đề, CSV). */
export const stripMath = (s) =>
  String(s ?? '').replace(/\$\$?([^$]+)\$\$?/g, '$1');

export default function MathText({ children, as: Tag = 'span', className }) {
  const text = children == null ? '' : String(children);
  const parts = useMemo(() => text.split(MATH_RE).filter((p) => p !== ''), [text]);
  const needKatex = useMemo(() => hasMath(text), [text]);
  const [katex, setKatex] = useState(null);

  useEffect(() => {
    if (!needKatex) return undefined;
    let alive = true;
    loadKatex()
      .then((k) => alive && setKatex(k))
      .catch(() => {}); // lỗi tải → hiển thị text thô
    return () => { alive = false; };
  }, [needKatex]);

  return (
    <Tag className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((p, i) => {
        const display = p.startsWith('$$');
        const isMath = display || (p.startsWith('$') && p.endsWith('$') && p.length > 2);
        if (!isMath || !katex) return <span key={i}>{p}</span>;
        const src = p.slice(display ? 2 : 1, display ? -2 : -1);
        let html;
        try {
          html = katex.renderToString(src, {
            displayMode: display,
            throwOnError: false,
            strict: 'ignore',
          });
        } catch {
          return <span key={i}>{p}</span>;
        }
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </Tag>
  );
}
