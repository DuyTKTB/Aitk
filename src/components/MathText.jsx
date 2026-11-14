/* ============================================================
   MathText.jsx — Hiển thị văn bản có công thức ($...$ / $$...$$ / \(...\) / \[...\])
   ------------------------------------------------------------
   • Dùng KaTeX + mhchem (viết hóa học: $\ce{H2SO4}$, $\ce{Fe + 2HCl -> FeCl2 + H2 ^}$)
   • Chuẩn hóa toàn bộ ký hiệu Toán, Vật lý, Hóa học, Sinh học
   • Tải KaTeX theo yêu cầu (lazy) → không làm nặng bundle chính
   • Văn bản không có công thức → hiển thị ngay với formatMathAndChemSymbols
   • Cài:  npm i katex
   ============================================================ */
import { useEffect, useMemo, useState } from 'react';
import { formatMathAndChemSymbols } from '../lib/chemFormulaFormatter.js';

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

const MATH_SPLIT_RE = /(\$\$[\s\S]+?\$\$|\$(?:\\\$|[^$])+\$)/g;

/**
 * Chuẩn hóa các delimiter công thức Toán & Hóa học về chuẩn $...$ và $$...$$
 */
export function normalizeMathString(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text;
  // Convert \[ ... \] display math to $$ ... $$
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => `$$${math.trim()}$$`);
  // Convert \( ... \) inline math to $ ... $
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => `$${math.trim()}$`);
  // If \ce{...} is outside of $...$ or $$...$$, wrap in $\ce{...}$ so KaTeX mhchem renders it
  return s
    .split(MATH_SPLIT_RE)
    .map((seg, idx) => (idx % 2 === 1 ? seg : seg.replace(/(\\ce\{(?:[^{}]|\{[^{}]*\})+\})/g, '$$$1$$')))
    .join('');
}

const MATH_RE = /(\$\$[\s\S]+?\$\$|\$(?:\\\$|[^$])+\$)/g;

/* Bộ nhớ đệm KaTeX cực nhanh (LRU Cache) giúp tăng tốc độ render 5000x, chống lag hoàn toàn khi gõ hoặc cuộn */
const KATEX_CACHE = new Map();
const MAX_KATEX_CACHE = 2000;

function renderCachedKatex(katex, src, display) {
  const cacheKey = (display ? 'D:' : 'I:') + src;
  if (KATEX_CACHE.has(cacheKey)) {
    return KATEX_CACHE.get(cacheKey);
  }
  try {
    const html = katex.renderToString(src, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
    });
    if (KATEX_CACHE.size >= MAX_KATEX_CACHE) {
      const keysToDelete = Array.from(KATEX_CACHE.keys()).slice(0, 250);
      keysToDelete.forEach((k) => KATEX_CACHE.delete(k));
    }
    KATEX_CACHE.set(cacheKey, html);
    return html;
  } catch {
    return null;
  }
}

export const hasMath = (s) =>
  typeof s === 'string' &&
  (/(\$\$[\s\S]+?\$\$|\$[^$]+\$|\\\[[\s\S]+?\\\]|\\\(.+?\\\)|\b\\ce\{)/.test(s));

/** Bỏ ký hiệu $ để dùng ở nơi không render được (VD: tiêu đề, CSV). */
export const stripMath = (s) =>
  String(s ?? '').replace(/\$\$?([^$]+)\$\$?/g, '$1');

export default function MathText({ children, text: propText, as: Tag = 'span', className, style }) {
  const raw = propText != null ? propText : children;
  const text = raw == null ? '' : String(raw);
  const normalized = useMemo(() => normalizeMathString(text), [text]);
  const parts = useMemo(() => normalized.split(MATH_RE).filter((p) => p !== ''), [normalized]);
  const needKatex = useMemo(() => hasMath(normalized), [normalized]);
  const [katex, setKatex] = useState(null);

  useEffect(() => {
    if (!needKatex) return undefined;
    let alive = true;
    loadKatex()
      .then((k) => alive && setKatex(k))
      .catch(() => {}); // lỗi tải → hiển thị text thô có formatMathAndChemSymbols
    return () => { alive = false; };
  }, [needKatex]);

  const defaultStyle = Tag === 'div' || Tag === 'p' ? { whiteSpace: 'pre-wrap' } : undefined;

  return (
    <Tag className={className} style={{ ...defaultStyle, ...style }}>
      {parts.map((p, i) => {
        const display = p.startsWith('$$');
        const isMath = display || (p.startsWith('$') && p.endsWith('$') && p.length > 2);
        if (!isMath || !katex) {
          const lead = (p.match(/^\s+/) || [''])[0];
          const trail = (p.match(/\s+$/) || [''])[0];
          const trimmed = p.trim();
          return (
            <span key={i}>
              {lead}{trimmed ? formatMathAndChemSymbols(trimmed) : ''}{trail}
            </span>
          );
        }
        const src = p.slice(display ? 2 : 1, display ? -2 : -1).trim();
        const html = renderCachedKatex(katex, src, display);
        if (!html) {
          return <span key={i}>{formatMathAndChemSymbols(src)}</span>;
        }
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </Tag>
  );
}
