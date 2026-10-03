import { useState, useEffect, useRef, memo } from 'react';
import { inlineFormat } from '../lib/chemText.js';
import { IcoCopy, IcoCheck } from './Icons.jsx';

const html = (s) => ({ __html: inlineFormat(s) });
const UL = /^\s*[-*•]\s+/;
const OL = /^\s*\d+[.)]\s+/;
const isRow = (l) => /^\s*\|.*\|\s*$/.test(l || '');
const isSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l || '') && /-/.test(l || '');
const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

function MarkdownBase({ text }) {
  if (!text) return null;
  const clean = text
    .replace(/(User|Response|System) Safety:\s*\w+/gi, '')
    .trim();
  if (!clean) return null;

  const lines = clean.split('\n');
  const blocks = [];
  let list = null;
  let code = null;

  const flushList = () => {
    if (!list) return;
    const Tag = list.type;
    blocks.push(
      <Tag key={blocks.length} className="ds-list" start={Tag === 'ol' ? list.start : undefined}>
        {list.items.map((it, i) => <li key={i} dangerouslySetInnerHTML={html(it)} />)}
      </Tag>
    );
    list = null;
  };
  const nextNonEmpty = (from) => {
    for (let j = from; j < lines.length; j++) if (lines[j].trim()) return lines[j];
    return '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    if (/^```/.test(t)) {
      if (code) {
        blocks.push(<CodeBlock key={blocks.length} lang={code.lang} code={code.buf.join('\n')} />);
        code = null;
      } else {
        flushList();
        code = { lang: t.slice(3).trim(), buf: [] };
      }
      continue;
    }
    if (code) { code.buf.push(line); continue; }

    const ul = UL.exec(line);
    const ol = OL.exec(line);
    if (ul || ol) {
      const type = ol ? 'ol' : 'ul';
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [], start: ol ? parseInt(ol[0], 10) : 1 };
      list.items.push(line.replace(ul || ol, ''));
      continue;
    }

    if (t === '' && list) {
      const nx = nextNonEmpty(i + 1);
      if ((list.type === 'ul' && UL.test(nx)) || (list.type === 'ol' && OL.test(nx))) continue;
    }

    if (isRow(line) && isSep(lines[i + 1])) {
      flushList();
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && isRow(lines[i])) { rows.push(cells(lines[i])); i++; }
      i--;
      blocks.push(
        <div key={blocks.length} className="ds-table-wrap">
          <table>
            <thead><tr>{head.map((h, j) => <th key={j} dangerouslySetInnerHTML={html(h)} />)}</tr></thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, cj) => <td key={cj} dangerouslySetInnerHTML={html(c)} />)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    flushList();
    if (t === '') {
      if (blocks.length && blocks[blocks.length - 1].props?.className !== 'ds-gap') {
        blocks.push(<div key={blocks.length} className="ds-gap" />);
      }
    } else if (/^#{1,4}\s/.test(t)) {
      const level = t.match(/^#+/)[0].length;
      const Tag = 'h' + Math.min(4, level + 2);
      blocks.push(<Tag key={blocks.length} dangerouslySetInnerHTML={html(t.replace(/^#+\s/, ''))} />);
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      blocks.push(<hr key={blocks.length} />);
    } else if (/^>\s?/.test(t)) {
      blocks.push(<blockquote key={blocks.length} dangerouslySetInnerHTML={html(t.replace(/^>\s?/, ''))} />);
    } else {
      blocks.push(<p key={blocks.length} dangerouslySetInnerHTML={html(line)} />);
    }
  }
  flushList();
  if (code) blocks.push(<CodeBlock key={blocks.length} lang={code.lang} code={code.buf.join('\n')} />);
  return <>{blocks}</>;
}

export const MarkdownLike = memo(MarkdownBase);

export function CodeBlock({ lang, code }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch { /* trình duyệt chặn clipboard */ }
  };
  return (
    <div className="ds-codeblock">
      <div className="ds-code-head">
        <span>{lang || 'code'}</span>
        <button className="ds-code-copy" onClick={copy} type="button">
          {ok ? <IcoCheck size={12} /> : <IcoCopy size={12} />}
          {ok ? 'Đã chép' : 'Sao chép'}
        </button>
      </div>
      <pre className="ds-code"><code>{code}</code></pre>
    </div>
  );
}

/* Thu gọn câu trả lời dài. FIX: chỉ measure 1 lần để tránh re-render liên tục */
export function CollapsibleText({ children, collapsedHeight = 420, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [needs, setNeeds] = useState(false);
  const ref = useRef(null);
  const measured = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || measured.current) return undefined;
    measured.current = true;

    const measure = () => {
      if (!el) return;
      const shouldNeed = el.scrollHeight > collapsedHeight + 60;
      setNeeds((prev) => (prev === shouldNeed ? prev : shouldNeed));
    };
    const raf = requestAnimationFrame(measure);

    if (typeof ResizeObserver === 'undefined') {
      return () => cancelAnimationFrame(raf);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [collapsedHeight]);

  const collapsed = needs && !open;
  return (
    <>
      <div
        ref={ref}
        className={'ds-msg-collapsible' + (collapsed ? ' collapsed' : '')}
        style={{ '--ds-collapse': collapsedHeight + 'px' }}
      >
        {children}
      </div>
      {needs && (
        <button
          type="button"
          className={'ds-msg-more' + (open ? ' open' : '')}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {open ? 'Thu gọn' : 'Xem thêm'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </>
  );
}

/* Reasoning steps — hiển thị từng bước với timeline */
export function ReasoningSteps({ text }) {
  if (!text) return null;

  const lines = text.split('\n').filter((l) => l.trim());

  return (
    <ol className="ds-reasoning-steps">
      {lines.map((line, i) => (
        <li key={i} style={{ '--i': i }}>
          <span className="ds-reasoning-dot" aria-hidden="true" />
          <MarkdownLike text={line} />
        </li>
      ))}
    </ol>
  );
}