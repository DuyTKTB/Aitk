/* ============================================================
   HighlightableMathText.jsx — Bút dạ quang nhấn-từ chuẩn SAT Bluebook
   ------------------------------------------------------------
   • Giữ nguyên 100% KaTeX math ($...$, $$...$$, \ce{...}) qua MathText
   • Không cần bật user-select (bảo toàn chống copy/paste anti-cheat)
   • Hoạt động mượt 1 chạm trên cả chuột Desktop và màn hình cảm ứng Mobile
   ============================================================ */
import { memo, useMemo } from 'react';
import MathText, { normalizeMathString } from '../MathText.jsx';

const MATH_SPLIT_RE = /(\$\$[\s\S]+?\$\$|\$(?:\\\$|[^$])+\$)/g;

/**
 * Tách văn bản thành các đoạn giữ nguyên biểu thức toán ($...$ / $$...$$)
 * và tách phần chữ thường thành từng từ (word) + khoảng trắng để có thể nhấn tô sáng.
 */
export function tokenizeForHighlight(rawText) {
  const normalized = normalizeMathString(rawText == null ? '' : String(rawText));
  if (!normalized) return [];
  const segments = normalized.split(MATH_SPLIT_RE).filter((s) => s !== '');
  const tokens = [];
  let wordIdx = 0;

  for (const seg of segments) {
    const isDisplay = seg.startsWith('$$') && seg.endsWith('$$') && seg.length > 4;
    const isInline = seg.startsWith('$') && seg.endsWith('$') && seg.length > 2;
    if (isDisplay || isInline) {
      tokens.push({ type: 'math', value: seg, key: `m-${tokens.length}` });
      continue;
    }
    // Tách theo khoảng trắng / xuống dòng, giữ nguyên khoảng trắng gốc
    const parts = seg.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        tokens.push({ type: 'space', value: part, key: `s-${tokens.length}` });
      } else {
        tokens.push({ type: 'word', value: part, idx: wordIdx++, key: `w-${wordIdx}` });
      }
    }
  }
  return tokens;
}

const HighlightableMathText = memo(function HighlightableMathText({
  text,
  className = 'ep-q-text',
  active = false,
  highlightedMap,
  onToggleWord,
}) {
  const hasAnyLit = highlightedMap && Object.values(highlightedMap).some(Boolean);
  const tokens = useMemo(
    () => (active || hasAnyLit ? tokenizeForHighlight(text) : null),
    [text, active, hasAnyLit]
  );

  // Chế độ thường chưa tô từ nào → render thẳng MathText cho tốc độ tối đa
  if (!tokens) {
    return <MathText as="p" className={className}>{text}</MathText>;
  }

  return (
    <p className={className + (active ? ' is-hl-mode' : '')}>
      {tokens.map((tk) => {
        if (tk.type === 'space') {
          return <span key={tk.key}>{tk.value}</span>;
        }
        if (tk.type === 'math') {
          return <MathText key={tk.key}>{tk.value}</MathText>;
        }
        const lit = !!highlightedMap?.[tk.idx];
        if (!active) {
          return lit ? (
            <mark key={tk.key} className="ep-hl-mark">
              <MathText>{tk.value}</MathText>
            </mark>
          ) : (
            <MathText key={tk.key}>{tk.value}</MathText>
          );
        }
        return (
          <span
            key={tk.key}
            role="button"
            tabIndex={0}
            aria-pressed={lit}
            className={'ep-hl-word' + (lit ? ' is-lit' : '')}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWord?.(tk.idx);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleWord?.(tk.idx);
              }
            }}
          >
            <MathText>{tk.value}</MathText>
          </span>
        );
      })}
    </p>
  );
});

export default HighlightableMathText;
