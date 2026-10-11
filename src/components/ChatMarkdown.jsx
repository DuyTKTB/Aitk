import { useState, useMemo } from 'react';
import { IcoChevron } from './Icons.jsx';

/* ============================================================
   ChatMarkdown.jsx — Render câu trả lời AI với công thức hóa học
   - Hỗ trợ H₂O, SO₄²⁻, Fe³⁺, phương trình hóa học
   - CollapsibleText: thu gọn câu trả lời dài
   - ReasoningSteps: hiển thị các bước phân tích
   ============================================================ */

/* Bảng chuyển đổi số sang subscript/superscript */
const SUBSCRIPT_MAP = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
};

const SUPERSCRIPT_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
};

const toSub = (str) => str.split('').map((c) => SUBSCRIPT_MAP[c] || c).join('');
const toSup = (str) => str.split('').map((c) => SUPERSCRIPT_MAP[c] || c).join('');

/* Regex nhận diện công thức hóa học đơn giản */
/* Ví dụ: H2O, H2SO4, Ca(OH)2, SO4(2-), Fe(3+), Na+ */
const FORMULA_REGEX = /\b([A-Z][a-z]?(?:\d+)?(?:[A-Z][a-z]?(?:\d+)?)*(?:\([A-Z][a-z]?(?:\d+)?\)(?:\d+)?)*)(?:\((\d*[+-])\)|\b(\d+[+-]))?\b/g;

/**
 * Chuyển đổi công thức hóa học dạng text sang dạng đẹp (subscript/superscript)
 */
function prettifyFormula(text) {
  if (!text) return text;

  return text.replace(FORMULA_REGEX, (match, base, chargeParen, chargeSimple) => {
    // Base: H2O → H₂O
    let result = base.replace(/(\d+)/g, (n) => toSub(n));

    // Charge
    const charge = chargeParen || chargeSimple;
    if (charge) {
      result += toSup(charge);
    }

    return result;
  });
}

/**
 * Nhận diện dòng có phương trình hóa học
 */
function isEquationLine(line) {
  if (!line) return false;
  // Có mũi tên phản ứng
  return /(?:->|→|⟶|=+>)/.test(line) &&
    // Và có ít nhất 2 chất (có dấu + hoặc 2 công thức)
    (/\+/.test(line) || /[A-Z][a-z]?\d/.test(line));
}

/**
 * Render một dòng phương trình hóa học
 */
function EquationBlock({ line }) {
  const formatted = prettifyFormula(line);
  // Tách theo mũi tên để tô màu
  const parts = formatted.split(/\s*(?:->|→|⟶|=+>)\s*/);
  if (parts.length < 2) {
    return <div className="ds-eq-card">{formatted}</div>;
  }
  return (
    <div className="ds-eq-card">
      {parts.map((part, i) => (
        <span key={i}>
          {part.trim()}
          {i < parts.length - 1 && <span className="ds-eq-arrow">→</span>}
        </span>
      ))}
    </div>
  );
}

/**
 * Xử lý inline markdown đơn giản: **bold**, *italic*, `code`
 */
function renderInline(text) {
  const parts = [];
  let rest = text;
  let key = 0;

  // **bold**
  const boldRegex = /\*\*(.+?)\*\*/;
  // *italic*
  const italicRegex = /\*(.+?)\*/;
  // `code`
  const codeRegex = /`(.+?)`/;

  while (rest.length > 0) {
    const boldMatch = rest.match(boldRegex);
    const italicMatch = rest.match(italicRegex);
    const codeMatch = rest.match(codeRegex);

    let earliest = null;
    let type = null;

    if (boldMatch && (!earliest || boldMatch.index < earliest.index)) {
      earliest = boldMatch;
      type = 'bold';
    }
    if (italicMatch && (!earliest || italicMatch.index < earliest.index)) {
      earliest = italicMatch;
      type = 'italic';
    }
    if (codeMatch && (!earliest || codeMatch.index < earliest.index)) {
      earliest = codeMatch;
      type = 'code';
    }

    if (!earliest) {
      parts.push(prettifyFormula(rest));
      break;
    }

    if (earliest.index > 0) {
      parts.push(prettifyFormula(rest.slice(0, earliest.index)));
    }

    const content = earliest[1];
    if (type === 'bold') {
      parts.push(<strong key={key++}>{prettifyFormula(content)}</strong>);
    } else if (type === 'italic') {
      parts.push(<em key={key++}>{prettifyFormula(content)}</em>);
    } else if (type === 'code') {
      parts.push(<code key={key++} className="ds-inline-code">{content}</code>);
    }

    rest = rest.slice(earliest.index + earliest[0].length);
  }

  return parts;
}

/**
 * MarkdownLike — render câu trả lời với markdown cơ bản + công thức hóa học
 */
export function MarkdownLike({ text }) {
  const lines = useMemo(() => (text || '').split('\n'), [text]);

  const elements = [];
  let key = 0;
  let listBuffer = [];
  let listType = null;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      <Tag key={`list-${key++}`} className="ds-list">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Dòng trống
    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading ###
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      if (level <= 2) {
        elements.push(<h3 key={key++}>{renderInline(content)}</h3>);
      } else {
        elements.push(<h4 key={key++}>{renderInline(content)}</h4>);
      }
      continue;
    }

    // Phương trình hóa học
    if (isEquationLine(trimmed)) {
      flushList();
      elements.push(<EquationBlock key={key++} line={trimmed} />);
      continue;
    }

    // Danh sách có số: 1. 2. 3.
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(olMatch[2]);
      continue;
    }

    // Danh sách gạch đầu dòng: - * •
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(ulMatch[1]);
      continue;
    }

    // Đoạn văn thường
    flushList();
    elements.push(<p key={key++}>{renderInline(trimmed)}</p>);
  }

  flushList();

  return <>{elements}</>;
}

/**
 * CollapsibleText — thu gọn câu trả lời dài, có nút "Xem thêm"
 */
export function CollapsibleText({ children, defaultOpen = true, maxHeight = '6.5rem' }) {
  const [open, setOpen] = useState(defaultOpen);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const ref = useState(() => ({ current: null }))[0];

  const measureRef = (el) => {
    if (!el) return;
    ref.current = el;
    if (el.scrollHeight > el.clientHeight + 20) {
      setNeedsCollapse(true);
    }
  };

  return (
    <div>
      <div
        ref={measureRef}
        className={`ds-msg-collapsible${!open && needsCollapse ? ' collapsed' : ''}`}
        style={!open && needsCollapse ? { maxHeight } : undefined}
      >
        {children}
      </div>
      {needsCollapse && (
        <button
          type="button"
          className={'ds-msg-more' + (open ? ' open' : '')}
          onClick={() => setOpen((v) => !v)}
        >
          <IcoChevron size={12} />
          <span>{open ? 'Thu gọn' : 'Xem thêm'}</span>
        </button>
      )}
    </div>
  );
}

/**
 * ReasoningSteps — hiển thị các bước phân tích của AI
 */
export function ReasoningSteps({ text }) {
  const steps = useMemo(() => {
    if (!text) return [];
    return text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [text]);

  return (
    <ol className="ds-reasoning-steps">
      {steps.map((step, i) => (
        <li key={i} style={{ '--i': i }}>
          <span className="ds-reasoning-dot" aria-hidden="true" />
          <span>{renderInline(step)}</span>
        </li>
      ))}
    </ol>
  );
}