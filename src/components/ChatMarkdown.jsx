import { useState, useMemo, memo } from 'react';
import { IcoChevron } from './Icons.jsx';
import MathText, { normalizeMathString } from './MathText.jsx';
import { formatMathAndChemSymbols } from '../lib/chemFormulaFormatter.js';
import ChatChalkboardBlock from './ChatChalkboardBlock.jsx';

/* ============================================================
   ChatMarkdown.jsx — Render câu trả lời AI với công thức chuẩn
   Khoa học Tự nhiên: Hóa học (mhchem / Unicode), Vật lý (KaTeX),
   Sinh học (di truyền học, alen, NST), Toán học và Markdown.
   ============================================================ */

/**
 * Render một dòng phương trình hóa học hoặc công thức khoa học + nút chép 1 chạm
 */
function EquationBlock({ line }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(String(line || '').trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };
  return (
    <div className="ds-eq-card elec-copyable-block">
      <MathText text={line} />
      <button
        type="button"
        className={`elec-block-copy-btn ${copied ? 'is-copied' : ''}`}
        onClick={handleCopy}
        title="Sao chép phương trình / công thức"
        aria-label="Sao chép phương trình"
      >
        {copied ? 'Đã chép' : 'Chép'}
      </button>
    </div>
  );
}

function CodeBlockWithCopy({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };
  return (
    <div className="elec-code-wrap elec-copyable-block">
      <div className="elec-code-bar">
        <span>{lang || 'CODE'}</span>
        <button
          type="button"
          className={`elec-block-copy-btn ${copied ? 'is-copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? 'Đã chép' : 'Sao chép'}
        </button>
      </div>
      <pre className="ds-code-block" data-lang={lang}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Xử lý inline markdown: Math ($...$, $$...$$, \(...\)), **bold**, *italic*, `code`
 */
function renderInline(text) {
  if (!text) return [];
  // FAST-PATH CỰC NHANH: Nếu văn bản không chứa ký tự markdown hay math, trả về trực tiếp không chạy 7 vòng lặp Regex
  if (!/[$*_`\[\\]/.test(text)) {
    return [<MathText key={0} as="span">{text}</MathText>];
  }

  const parts = [];
  let rest = String(text);
  let key = 0;

  // Regex nhận diện các token đặc biệt theo thứ tự xuất hiện
  const displayMathRegex = /\$\$[\s\S]+?\$\$/;
  const inlineMathRegex = /\$(?:\\\$|[^$\n])+\$/;
  const parenMathRegex = /\\\([\s\S]+?\\\)/;
  const linkRegex = /\[([^\]]+)\]\((#[^)]+|https?:\/\/[^)]+)\)/;
  const citeRegex = /\[(Trang\s*\d+|Tài\s*liệu:[^\]]+)\]/i;
  const boldRegex = /\*\*(.+?)\*\*/;
  const italicRegex = /\*(.+?)\*/;
  const codeRegex = /`(.+?)`/;

  while (rest.length > 0) {
    const dispMatch = rest.match(displayMathRegex);
    const inlineMatch = rest.match(inlineMathRegex);
    const parenMatch = rest.match(parenMathRegex);
    const linkMatch = rest.match(linkRegex);
    const citeMatch = rest.match(citeRegex);
    const boldMatch = rest.match(boldRegex);
    const italicMatch = rest.match(italicRegex);
    const codeMatch = rest.match(codeRegex);

    let earliest = null;
    let type = null;

    if (dispMatch && (!earliest || dispMatch.index < earliest.index)) {
      earliest = dispMatch;
      type = 'math';
    }
    if (inlineMatch && (!earliest || inlineMatch.index < earliest.index)) {
      earliest = inlineMatch;
      type = 'math';
    }
    if (parenMatch && (!earliest || parenMatch.index < earliest.index)) {
      earliest = parenMatch;
      type = 'math';
    }
    if (linkMatch && (!earliest || linkMatch.index < earliest.index)) {
      earliest = linkMatch;
      type = 'link';
    }
    if (citeMatch && (!earliest || citeMatch.index < earliest.index)) {
      earliest = citeMatch;
      type = 'cite';
    }
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
      parts.push(<MathText key={key++} as="span">{rest}</MathText>);
      break;
    }

    if (earliest.index > 0) {
      parts.push(<MathText key={key++} as="span">{rest.slice(0, earliest.index)}</MathText>);
    }

    const fullMatched = earliest[0];
    const innerContent = earliest[1] !== undefined ? earliest[1] : fullMatched;

    if (type === 'math') {
      parts.push(<MathText key={key++} as="span">{fullMatched}</MathText>);
    } else if (type === 'cite') {
      parts.push(
        <span key={key++} className="elec-cite-tag" title="Trích dẫn từ tài liệu đính kèm">
          {innerContent}
        </span>
      );
    } else if (type === 'link') {
      const label = earliest[1];
      const url = earliest[2];
      const isHash = url.startsWith('#');
      parts.push(
        <a
          key={key++}
          href={url}
          className={`ds-chat-nav-link ${isHash ? 'is-hash' : ''}`}
          onClick={(e) => {
            if (isHash) {
              e.preventDefault();
              window.location.hash = url.replace(/^#/, '');
            }
          }}
          target={isHash ? undefined : '_blank'}
          rel={isHash ? undefined : 'noopener noreferrer'}
          title={isHash ? `Chuyển tới ${label}` : url}
        >
          <span>{label}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 3, verticalAlign: 'middle', display: 'inline-block' }}>
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </a>
      );
    } else if (type === 'bold') {
      parts.push(<strong key={key++}>{renderInline(innerContent)}</strong>);
    } else if (type === 'italic') {
      parts.push(<em key={key++}>{renderInline(innerContent)}</em>);
    } else if (type === 'code') {
      parts.push(<code key={key++} className="ds-inline-code">{innerContent}</code>);
    }

    rest = rest.slice(earliest.index + fullMatched.length);
  }

  return parts;
}

/**
 * Nhận diện dòng có phương trình hóa học độc lập
 */
function isEquationLine(line) {
  if (!line || line.length > 160) return false;
  if (/[*`[\]#?!]/.test(line) || /^(?:[-*•]|\d+\.)\s/.test(line)) return false;
  if (!/(?:->|→|⟶|=+>|⇌|<=>)/.test(line)) return false;
  if (!(/\+/.test(line) || /[A-Z][a-z]?\d/.test(line))) return false;
  const words = line.match(/\b[a-zà-ỹ]{3,}\b/gi) || [];
  const allowedChemWords = new Set(['dư', 'đktc', 'đkc', 'nhiệt', 'đun', 'nóng', 'lạnh', 'đặc', 'loãng', 'tạo', 'mol', 'khí', 'rắn', 'lỏng', 'chậm', 'nhanh', 'hoặc']);
  const proseCount = words.filter((w) => !allowedChemWords.has(w.toLowerCase()) && /[a-zà-ỹ]/.test(w[0])).length;
  return proseCount <= 1;
}

/**
 * MarkdownLike — render câu trả lời với Markdown đầy đủ + KaTeX + Khoa học chuẩn
 * Được memoized để chống re-render khi gõ tin nhắn hoặc cuộn trang
 */
export const MarkdownLike = memo(function MarkdownLike({ text }) {
  const lines = useMemo(() => {
    const raw = String(text || '');
    // Tự động ngắt dòng chuẩn nếu các tiêu đề ### hoặc bullet bị dính liền trên 1 dòng (tránh tách dấu - / * trong biểu thức toán)
    const normalized = raw
      .replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2')
      .replace(/([.:;!?)\]])\s+([*•-]\s+)/g, '$1\n$2')
      .replace(/([^\n])\s+(•\s+)/g, '$1\n$2');
    return normalized.split('\n');
  }, [text]);

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

    // Code block ```
    if (trimmed.startsWith('```')) {
      flushList();
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('```')) {
        i++;
        codeLines.push(lines[i]);
      }
      if (i + 1 < lines.length) {
        i++; // bỏ qua dòng đóng ```
      }

      const normalizedLang = lang.toLowerCase();
      if (['chalkboard', 'mv', 'chalkboard-mv', 'mangve'].includes(normalizedLang)) {
        elements.push(
          <ChatChalkboardBlock
            key={key++}
            code={codeLines.join('\n')}
            title="Bảng phấn 3D tương tác"
          />
        );
        continue;
      }

      elements.push(
        <CodeBlockWithCopy key={key++} code={codeLines.join('\n')} lang={lang} />
      );
      continue;
    }

    // Khối Math Display riêng biệt: $$ ... $$ hoặc \[ ... \]
    if (trimmed.startsWith('$$') || trimmed.startsWith('\\[')) {
      flushList();
      const endMarker = trimmed.startsWith('$$') ? '$$' : '\\]';
      if ((trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) ||
          (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 2)) {
        elements.push(
          <div key={key++} className="ds-math-block">
            <MathText as="div" text={trimmed} />
          </div>
        );
        continue;
      }
      // Khối math nhiều dòng
      const mathLines = [line];
      while (i + 1 < lines.length && !lines[i + 1].trim().endsWith(endMarker)) {
        i++;
        mathLines.push(lines[i]);
      }
      if (i + 1 < lines.length) {
        i++;
        mathLines.push(lines[i]);
      }
      elements.push(
        <div key={key++} className="ds-math-block">
          <MathText as="div" text={mathLines.join('\n')} />
        </div>
      );
      continue;
    }

    // Đường kẻ ngang --- hoặc ***
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={key++} className="ds-divider" />);
      continue;
    }

    // Callout / Trích dẫn >
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteContent = trimmed.replace(/^>\s*/, '');

      // Nếu là Bẫy đề thi / Cảnh báo sai lầm
      if (/(⚠️|bẫy\s*(?:đề|thường|kinh\s*điển)|cảnh\s*báo\s*sai|tránh\s*nhầm)/i.test(quoteContent)) {
        const cleanTrap = quoteContent
          .replace(/^[⚠️🚨\s*]*(?:BẪY\s*(?:ĐỀ\s*THI|THƯỜNG\s*GẶP|KINH\s*ĐIỂN)|CẢNH\s*BÁO\s*BẪY|LƯU\s*Ý\s*BẪY)[:\s*\-]*/i, '')
          .replace(/^\*+\s*/, '');
        elements.push(
          <div key={key++} className="elec-callout-card is-trap">
            <img src="/img/elec/elec-plead.png" alt="" aria-hidden="true" className="elec-callout-mascot" width="36" height="36" />
            <div className="elec-callout-body">
              <span className="elec-callout-badge">BẪY ĐỀ THI CẦN TRÁNH</span>
              <div className="elec-callout-text">{renderInline(cleanTrap || quoteContent)}</div>
            </div>
          </div>
        );
        continue;
      }

      // Nếu là Mẹo nhớ hoặc Ghi chú trọng tâm (ELEC Mascot Pro Tip Card)
      if (/(💡|bé\s*elec\s*mẹo|mẹo\s*nhớ|mẹo|tip|ghi\s*chú|lưu\s*ý)/i.test(quoteContent)) {
        const cleanTip = quoteContent
          .replace(/^[💡✨\s*]*(?:BÉ\s*ELEC\s*MẸO\s*NHỚ|MẸO\s*NHỚ|MẸO|TIP|GHI\s*CHÚ|LƯU\s*Ý)[:\s*\-]*/i, '')
          .replace(/^\*+\s*/, '');
        elements.push(
          <div key={key++} className="elec-callout-card is-tip">
            <img src="/img/elec/elec-wink.png" alt="" aria-hidden="true" className="elec-callout-mascot" width="36" height="36" />
            <div className="elec-callout-body">
              <span className="elec-callout-badge">BÉ ELEC MẸO NHỚ</span>
              <div className="elec-callout-text">{renderInline(cleanTip || quoteContent)}</div>
            </div>
          </div>
        );
        continue;
      }

      elements.push(
        <div key={key++} className="ds-callout-box">
          {renderInline(quoteContent.replace(/^[📺💡]\s*/, ''))}
        </div>
      );
      continue;
    }

    // Nhận diện tiêu đề / dòng độc lập "### 💡 BÉ ELEC MẸO NHỚ:" hoặc "💡 **BÉ ELEC MẸO NHỚ:**"
    if (/^[#*\s💡✨🔥📌👉•\-]*(?:BÉ\s*ELEC\s*MẸO\s*NHỚ|MẸO\s*NHỚ\s*NHANH|MẸO\s*GIẢI\s*NHANH|BẪY\s*ĐỀ\s*THI\s*CẦN\s*TRÁNH)(?=$|[\s:*\-—–])/i.test(trimmed)) {
      flushList();
      const isTrap = /BẪY\s*ĐỀ\s*THI/i.test(trimmed);
      const restOfLine = trimmed
        .replace(/^[#*\s💡✨🔥📌👉•\-]*(?:BÉ\s*ELEC\s*MẸO\s*NHỚ|MẸO\s*NHỚ\s*NHANH|MẸO\s*GIẢI\s*NHANH|BẪY\s*ĐỀ\s*THI\s*CẦN\s*TRÁNH)[\s:*\-—–]*/i, '')
        .replace(/^\*+\s*/, '')
        .replace(/\*+$/, '')
        .trim();

      // Gom các dòng danh sách ngay sau tiêu đề Mẹo nhớ vào cùng 1 thẻ đẹp (bỏ qua tối đa 1 dòng trống giữa tiêu đề và list)
      const tipItems = [];
      let blankSkipped = false;
      while (i + 1 < lines.length) {
        const peek = lines[i + 1].trim();
        if (!peek) {
          if (!blankSkipped && i + 2 < lines.length && /^(?:\d+\.\s+|[-*•]\s+)/.test(lines[i + 2].trim())) {
            i++;
            blankSkipped = true;
            continue;
          }
          break;
        }
        const itemMatch = peek.match(/^(?:\d+\.\s+|[-*•]\s+)(.+)$/);
        if (itemMatch) {
          i++;
          blankSkipped = false;
          tipItems.push(itemMatch[1]);
        } else {
          break;
        }
      }

      elements.push(
        <div key={key++} className={`elec-callout-card ${isTrap ? 'is-trap' : 'is-tip'}`}>
          <img
            src={isTrap ? '/img/elec/elec-plead.png' : '/img/elec/elec-wink.png'}
            alt=""
            aria-hidden="true"
            className="elec-callout-mascot"
            width="38"
            height="38"
          />
          <div className="elec-callout-body">
            <span className="elec-callout-badge">{isTrap ? 'BẪY ĐỀ THI CẦN TRÁNH' : 'BÉ ELEC MẸO NHỚ'}</span>
            {restOfLine && <div className="elec-callout-text">{renderInline(restOfLine)}</div>}
            {tipItems.length > 0 && (
              <ul className="elec-callout-list">
                {tipItems.map((it, tIdx) => (
                  <li key={tIdx}>{renderInline(it)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
      continue;
    }

    // Bảng Markdown: | Cột 1 | Cột 2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const tableLines = [trimmed];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
        i++;
        tableLines.push(lines[i].trim());
      }

      const parseRow = (rowStr) =>
        rowStr
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

      const headerRow = parseRow(tableLines[0]);
      const bodyRows = tableLines
        .slice(1)
        .filter((r) => !/^\|[\s\-:|]+\|$/.test(r))
        .map(parseRow);

      elements.push(
        <div key={key++} className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                {headerRow.map((h, hIdx) => (
                  <th key={hIdx}>{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((r, rIdx) => (
                <tr key={rIdx}>
                  {r.map((cell, cIdx) => (
                    <td key={cIdx}>{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Heading ###
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = headingMatch[2];

      // 1. Thẻ Tiêu đề Bước: "### Bước 1: Tìm giao tuyến..."
      const stepMatch = content.match(/^Bước\s*(\d+)[:\s\-]*(.+)$/i);
      if (stepMatch) {
        const stepNum = stepMatch[1];
        const stepText = stepMatch[2].trim();
        elements.push(
          <div key={key++} className="ds-step-header-card">
            <span className="ds-step-badge-pill">
              <span className="ds-step-badge-num">{stepNum}</span>
              <span className="ds-step-badge-txt">BƯỚC</span>
            </span>
            <div className="ds-step-header-title">{renderInline(stepText)}</div>
          </div>
        );
        continue;
      }

      // 2. Thẻ Tiêu đề Phần La Mã: "### I. Phân tích giả thiết..."
      const sectionMatch = content.match(/^(?:Phần\s*)?([IVXLCDM]+|[1-9])\.\s*(.+)$/i);
      if (sectionMatch) {
        const secNum = sectionMatch[1];
        const secText = sectionMatch[2].trim();
        elements.push(
          <div key={key++} className="ds-section-header-card">
            <span className="ds-section-badge-roman">{secNum}</span>
            <div className="ds-section-header-title">{renderInline(secText)}</div>
          </div>
        );
        continue;
      }

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

    // Nhận diện dòng Đáp số hoặc Kết luận cuối cùng để hiển thị Thẻ Đáp Số Nổi Bật (Hero Card)
    const ansMatch = trimmed.match(/^(?:\*\*)?(?:ĐÁP SỐ|ĐÁP ÁN|KẾT LUẬN|VẬY ĐÁP ÁN LÀ|KẾT QUẢ CUỐI CÙNG)\s*[:=]\s*(.+?)(?:\*\*)?$/i);
    if (ansMatch) {
      flushList();
      elements.push(
        <div key={key++} className="ds-final-answer-card">
          <div className="ds-final-answer-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>ĐÁP SỐ CHUẨN XÁC</span>
          </div>
          <div className="ds-final-answer-text">
            {renderInline(ansMatch[1])}
          </div>
        </div>
      );
      continue;
    }

    // Đoạn văn thường
    flushList();
    elements.push(<p key={key++}>{renderInline(trimmed)}</p>);
  }

  flushList();

  return <>{elements}</>;
});

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

export default MarkdownLike;
