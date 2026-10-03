import { useState } from 'react';
import useAsk from '../hooks/useAsk.js';
import VipGate from './VipGate.jsx';
import AIMark from './AIMark.jsx';
import Icon from './Icon.jsx';

const describe = (e) =>
  `${e.name} (${e.vietnameseName}), Z=${e.atomicNumber}, ký hiệu ${e.symbol}, nhóm ${e.group ?? 'khối f'}, chu kỳ ${e.period}, ` +
  `cấu hình ${e.shortConfiguration}, độ âm điện ${e.electronegativity ?? 'không có'}, ` +
  `số oxi hóa ${e.oxidationStates?.join(', ') || 'không có'}, bán kính ${e.atomicRadius ?? '?'} pm, nóng chảy ${e.meltingPoint ?? '?'} K`;

const SINGLE = [
  ['atom', 'Cấu hình e', 'Giải thích từng bước cách viết cấu hình electron của nguyên tố này, nêu rõ nếu có ngoại lệ.'],
  ['plusminus', 'Số oxi hóa', 'Giải thích vì sao nguyên tố có các số oxi hóa trên, kèm ví dụ hợp chất.'],
  ['flask', 'Ứng dụng', 'Nêu tính chất nổi bật và 3 ứng dụng thực tế của nguyên tố.'],
  ['bulb', 'Mẹo nhớ', 'Cho một mẹo ghi nhớ vị trí và tính chất của nguyên tố cho học sinh.'],
];

const PAIR = [
  ['trend', 'Xu hướng', 'So sánh hai nguyên tố về bán kính, độ âm điện, nhiệt độ nóng chảy và giải thích theo xu hướng trong bảng tuần hoàn.'],
  ['scale', 'Khác biệt', 'Nêu những khác biệt chính về cấu hình electron và tính chất hóa học.'],
  ['link', 'Phản ứng', 'Hai nguyên tố này có thể tạo hợp chất không? Cho ví dụ và loại liên kết.'],
];

/* ============================================================
   Format markdown → JSX
   ============================================================ */
function formatMarkdown(text) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split('\n');
  const result = [];

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      result.push(<div key={`empty-${lineIdx}`} style={{ height: '6px' }} />);
      return;
    }

    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    const isBullet = bulletMatch && !trimmed.startsWith('**');
    const content = isBullet ? bulletMatch[1] : line;

    const parts = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={`b-${lineIdx}-${keyCounter++}`}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={`i-${lineIdx}-${keyCounter++}`}>{match[3]}</em>);
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    if (isBullet) {
      result.push(
        <div key={`line-${lineIdx}`} className="ai-answer-bullet">
          <span className="ai-answer-bullet-dot">•</span>
          <span>{parts.length > 0 ? parts : content}</span>
        </div>
      );
    } else {
      result.push(
        <div key={`line-${lineIdx}`} className="ai-answer-line">
          {parts.length > 0 ? parts : content}
        </div>
      );
    }
  });

  return result;
}

/* ============================================================
   AiPanel
   ============================================================ */
export default function AiPanel({ elements, vip }) {
  const { text, loading, error, vipNeeded, ask } = useAsk();
  const [q, setQ] = useState('');

  if (!vip || vipNeeded) return <VipGate />;

  const ctx = elements.map(describe).join('\n');
  const run = (task) => ask(`Dữ liệu nguyên tố:\n${ctx}\n\nYêu cầu: ${task}`);
  const presets = elements.length === 2 ? PAIR : SINGLE;
  const send = () => {
    if (q.trim() && !loading) {
      run(q.trim());
      setQ('');
    }
  };

  // Mode cho AIMark: think khi loading, talk khi đang trả lời, idle khi chờ
  const aiMode = loading ? 'think' : text ? 'talk' : 'idle';

  return (
    <div className="ai-panel">
      {/* ===== HEADER với AIMark ===== */}
      <div className="ai-panel-head">
        <div className="ai-panel-logo">
          <AIMark
            size={48}
            mode={aiMode}
            look
            animate
          />
        </div>
        <div className="ai-panel-head-text">
          <h3 className="ai-panel-title">
            Hỏi AI
            <span className="vip-badge">VIP</span>
          </h3>
          <p className="ai-panel-sub">
            {loading ? 'Đang suy nghĩ…' : 'Trợ lý Hóa học của bạn'}
          </p>
        </div>
      </div>

      {/* ===== Ô hỏi ===== */}
      <div className="ai-ask">
        <div className="ai-input">
          <Icon name="sparkle" size={16} />
          <input
            value={q}
            placeholder="Hỏi AI về nguyên tố này..."
            aria-label="Câu hỏi cho AI"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
        </div>
        <button
          type="button"
          className="btn primary send"
          aria-label="Gửi câu hỏi"
          title="Hỏi AI"
          disabled={loading || !q.trim()}
          onClick={send}
        >
          <Icon name="send" size={18} />
        </button>
      </div>

      {/* ===== CHIPS hành động ===== */}
      <div className="ai-chips">
        {presets.map(([icon, label, task]) => (
          <button
            key={label}
            type="button"
            className="chip"
            disabled={loading}
            onClick={() => run(task)}
          >
            <Icon name={icon} size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ===== Trạng thái ===== */}
      {loading && (
        <div className="ai-loading-row">
          <span className="ai-loading-dot" />
          <span className="ai-loading-dot" />
          <span className="ai-loading-dot" />
          <span className="ai-state">AI đang suy nghĩ…</span>
        </div>
      )}
      {error && <p className="ai-state err">{error}</p>}

      {/* ===== Câu trả lời ===== */}
      {text && !loading && (
        <div className="ai-answer">
          {formatMarkdown(text)}
        </div>
      )}
    </div>
  );
}