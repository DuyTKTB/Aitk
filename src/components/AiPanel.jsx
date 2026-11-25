/* ============================================================
   AiPanel.jsx — Khung Chat Gia Sư ELEC AI Chính Chủ cho Bảng Tuần Hoàn
   - Đồng bộ ngôn ngữ thiết kế với Trợ lý ELEC AI 3 cột (Bé Elec tách nền, không khung vuông)
   - Bơm đầy đủ dữ liệu lượng tử, cấu hình, nhiệt độ nc/sôi, màu ngọn lửa, ứng dụng & GDPT 2018
   - Hỗ trợ Markdown + KaTeX, hội thoại nhiều lượt & sao chép nhanh
   ============================================================ */

import { useState, useEffect, useRef, useMemo } from 'react';
import useAsk from '../hooks/useAsk.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { getActiveAIProviders } from '../lib/ai.js';
import VipGate from './VipGate.jsx';
import { MarkdownLike } from './ChatMarkdown.jsx';

function formatModelBadge(rawModel) {
  const m = String(rawModel || '').replace(/^server\//, '');
  if (!m) return 'ELEC AI';
  const [prov, ...rest] = m.split('/');
  const modelName = rest.join('/');
  const label = prov === 'gemini' ? 'Gemini' : prov === 'groq' ? 'Groq' : prov === 'agnes' ? 'Agnes' : prov;
  return modelName ? `${label} · ${modelName}` : label;
}

const describe = (e) => [
  `Nguyên tố: ${e.name} (${e.symbol}), Z=${e.atomicNumber}, nguyên tử khối=${e.atomicMass}`,
  `Vị trí: Chu kỳ ${e.period}, Nhóm ${e.group ?? 'khối f'}, phân lớp khối ${e.block || '?'}`,
  `Cấu hình e: ${e.shortConfiguration} (đầy đủ: ${e.electronConfiguration})`,
  `Tính chất: Độ âm điện=${e.electronegativity ?? 'không có'}, Năng lượng ion hóa I1=${e.ionizationEnergy ?? '?'} kJ/mol, Bán kính=${e.atomicRadius ?? '?'} pm`,
  `Số oxi hóa: ${e.oxidationStates?.join(', ') || '0'}; Trạng thái 25°C: ${e.stateAtRoomTemp}; Nóng chảy=${e.meltingPoint ?? '?'} K, Sôi=${e.boilingPoint ?? '?'} K, Khối lượng riêng=${e.density ?? '?'} g/cm³`,
  e.flame ? `Màu ngọn lửa đặc trưng: ${e.flame.label}` : '',
  e.uses ? `Ứng dụng thực tế: ${e.uses}` : '',
].filter(Boolean).join('\n');

const SINGLE_PROMPTS = [
  {
    dot: '#2563eb',
    label: 'Phân tích A–Z & điểm bẫy đề thi THPT QG',
    task: 'Phân tích súc tích theo chương trình Hóa học GDPT 2018 (THPT QG): (1) Vị trí & cấu hình electron (chỉ rõ ngoại lệ nếu có), (2) Tính chất hóa học đặc trưng, (3) 1 điểm bẫy học sinh hay sai trong đề thi.',
  },
  {
    dot: '#10b981',
    label: 'Các PTHH trọng tâm & hiện tượng nhận biết',
    task: 'Liệt kê 4–5 phương trình hóa học tiêu biểu nhất của nguyên tố này (cân bằng chuẩn, ghi rõ điều kiện phản ứng và hiện tượng quan sát được như màu kết tủa, khí thoát ra, màu dung dịch).',
  },
  {
    dot: '#8b5cf6',
    label: 'Giải thích số oxi hóa & cấu hình e hóa trị',
    task: 'Giải thích dựa trên cấu hình electron hóa trị vì sao nguyên tố có các số oxi hóa phổ biến trên, kèm ví dụ hợp chất điển hình ứng với từng mức oxi hóa.',
  },
  {
    dot: '#f59e0b',
    label: 'Ứng dụng đời sống & mẹo ghi nhớ siêu tốc',
    task: 'Nêu 3 ứng dụng thực tế thú vị nhất kèm 1 mẹo ghi nhớ cực dễ thuộc (câu vè hoặc liên tưởng) về vị trí và tính chất nguyên tố này.',
  },
  {
    dot: '#ec4899',
    label: 'Ra nhanh 3 câu trắc nghiệm luyện thi kèm đáp án',
    task: 'Ra nhanh 3 câu trắc nghiệm Hóa học mức độ Nhận biết – Thông hiểu – Vận dụng về nguyên tố này chuẩn GDPT 2018, kèm đáp án đúng và giải thích ngắn gọn.',
  },
];

const PAIR_PROMPTS = [
  {
    dot: '#2563eb',
    label: 'So sánh bán kính, độ âm điện & tính kim loại/phi kim',
    task: 'So sánh chi tiết hai nguyên tố về bán kính nguyên tử, độ âm điện, năng lượng ion hóa I1, tính kim loại/phi kim và giải thích rõ theo quy luật biến đổi tuần hoàn.',
  },
  {
    dot: '#10b981',
    label: 'Khác biệt cấu hình e, số oxi hóa & oxit/hiđroxit',
    task: 'Lập bảng so sánh nhanh sự khác biệt về cấu hình electron hóa trị, số oxi hóa đặc trưng, tính chất oxit & hiđroxit của hai nguyên tố này.',
  },
  {
    dot: '#f59e0b',
    label: 'Phản ứng giữa hai nguyên tố & loại liên kết hóa học',
    task: 'Hai nguyên tố này có phản ứng trực tiếp với nhau không? Viết PTHH (nếu có), xác định loại liên kết hóa học theo hiệu độ âm điện.',
  },
  {
    dot: '#ec4899',
    label: 'Tạo 2 câu trắc nghiệm so sánh chuẩn THPT QG',
    task: 'Tạo 2 câu hỏi trắc nghiệm dạng đề thi THPT QG yêu cầu so sánh tính chất hai nguyên tố này kèm lời giải chi tiết.',
  },
];

export default function AiPanel({ elements, vip }) {
  const { user } = useAuth();
  const { loading, error, vipNeeded, ask } = useAsk();
  const [q, setQ] = useState('');
  const [provider, setProvider] = useState('auto'); // 'auto' | 'gemini' | 'groq' | 'agnes'
  const [history, setHistory] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const scrollRef = useRef(null);

  const activeProviders = useMemo(() => getActiveAIProviders(), []);
  const readyCount = activeProviders.filter((p) => p.ready).length;

  const elemKey = elements.map((e) => e.atomicNumber).join('-');
  useEffect(() => {
    setHistory([]);
    setQ('');
  }, [elemKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  if (!vip || vipNeeded) return <VipGate />;

  const ctx = elements.map(describe).join('\n---\n');
  const prompts = elements.length === 2 ? PAIR_PROMPTS : SINGLE_PROMPTS;
  const studentName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'bạn');
  const elemNames = elements.map((x) => `${x.name} (${x.symbol})`).join(' và ');

  const run = async (task, displayLabel) => {
    if (loading) return;
    const shownQ = displayLabel || task;
    setHistory((prev) => [...prev, { role: 'user', content: shownQ }]);

    const prompt =
      `Bạn là Bé Elec — gia sư Hóa học ELEC AI thân thiện, chuẩn xác, chuyên luyện thi THPT Quốc gia GDPT 2018.\n` +
      `Trả lời bằng tiếng Việt rõ ràng, khoa học, dùng gạch đầu dòng gọn gàng, viết đúng công thức hóa học.\n\n` +
      `DỮ LIỆU NGUYÊN TỐ:\n${ctx}\n\nYÊU CẦU:\n${task}`;

    const res = await ask(prompt, {
      preferredProvider: provider,
      hedgeMs: provider === 'auto' ? 2400 : 0,
      returnMeta: true,
    });
    if (res?.text) {
      setHistory((prev) => [...prev, { role: 'ai', content: res.text, model: res.model || '' }]);
    }
  };

  const send = () => {
    if (q.trim() && !loading) {
      const textQ = q.trim();
      setQ('');
      run(textQ, textQ);
    }
  };

  const handleCopy = (content, idx) => {
    try {
      navigator.clipboard?.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(-1), 1800);
    } catch { /* ignore */ }
  };

  const mascotSrc = loading
    ? '/img/elec/elec-think.png'
    : history.length > 0
      ? '/img/elec/elec-happy.png'
      : '/img/elec/elec-cool.png';

  return (
    <div className="elec-pt-chat">
      {/* Header đồng bộ phong cách Khung Chat ELEC AI */}
      <div className="elec-pt-chat-head">
        <div className="elec-pt-chat-brand">
          <img src={mascotSrc} alt="Bé Elec" className="elec-pt-chat-mascot" draggable={false} />
          <div className="elec-pt-chat-titles">
            <div className="elec-pt-chat-row">
              <strong>ELEC AI</strong>
              <span className="elec-pt-chat-tag">Gia sư Hóa học</span>
            </div>
            <span className="elec-pt-chat-sub">
              <i className={`elec-pt-status-dot ${loading ? 'is-busy' : ''}`} />
              {loading ? 'Bé Elec đang phân tích...' : `Chuyên sâu về ${elements.map((x) => x.symbol).join(' & ')}`}
            </span>
          </div>
        </div>
        {history.length > 0 && !loading && (
          <button
            type="button"
            className="elec-pt-chat-reset"
            onClick={() => setHistory([])}
            title="Bắt đầu đoạn chat mới"
          >
            Chat mới
          </button>
        )}
      </div>

      {/* Thanh chọn đa AI (Tự động xoay vòng & đua song song Gemini · Groq · Agnes) */}
      <div className="elec-pt-ai-bar" role="group" aria-label="Chọn bộ máy AI">
        <button
          type="button"
          className={`elec-pt-ai-pill ${provider === 'auto' ? 'is-on' : ''}`}
          onClick={() => setProvider('auto')}
          title="Tự động chạy song song & dự phòng giữa tất cả các AI (Gemini, Groq, Agnes)"
        >
          <i className="elec-pt-ai-dot is-auto" />
          Đa AI ({Math.max(readyCount, 3)})
        </button>
        {activeProviders.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`elec-pt-ai-pill ${provider === p.id ? 'is-on' : ''}`}
            onClick={() => setProvider(p.id)}
            title={`Ưu tiên dùng ${p.label} (vẫn tự động dự phòng sang AI khác nếu quá tải)`}
          >
            <i className={`elec-pt-ai-dot ${p.ready ? 'is-ok' : ''}`} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Luồng tin nhắn giống Cột 3 ELEC AI */}
      <div className="elec-pt-chat-body" ref={scrollRef}>
        {/* Lời chào đầu tiên từ Bé Elec */}
        <div className="elec-pt-ai-turn">
          <img src="/img/elec/elec-hello.png" alt="Bé Elec" className="elec-pt-turn-avatar" draggable={false} />
          <div className="elec-pt-ai-bubble">
            <p className="elec-pt-greet">
              Chào <b>{studentName}</b>! Mình đã nạp sẵn cấu hình e, mô hình 3D, quang phổ và dữ liệu thi THPT QG của <b>{elemNames}</b>. Bạn chọn nhanh một chủ đề hoặc gõ câu hỏi bên dưới nhé!
            </p>
          </div>
        </div>

        {/* Danh sách gợi ý dạng thẻ chấm màu chuẩn ELEC AI */}
        {history.length === 0 && !loading && (
          <div className="elec-pt-quick-list">
            {prompts.map((item) => (
              <button
                key={item.label}
                type="button"
                className="elec-pt-quick-pill"
                disabled={loading}
                onClick={() => run(item.task, item.label)}
              >
                <i className="elec-pt-qdot" style={{ background: item.dot }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Các lượt hỏi - đáp */}
        {history.map((msg, idx) => (
          msg.role === 'user' ? (
            <div key={idx} className="elec-pt-user-turn">
              <div className="elec-pt-user-bubble">{msg.content}</div>
            </div>
          ) : (
            <div key={idx} className="elec-pt-ai-turn">
              <img src="/img/elec/elec-happy.png" alt="Bé Elec" className="elec-pt-turn-avatar" draggable={false} />
              <div className="elec-pt-ai-bubble is-answer">
                <div className="elec-pt-ans-top">
                  <span>{formatModelBadge(msg.model)}</span>
                  <button
                    type="button"
                    className="elec-pt-copy-btn"
                    onClick={() => handleCopy(msg.content, idx)}
                  >
                    {copiedIdx === idx ? 'Đã chép!' : 'Sao chép'}
                  </button>
                </div>
                <div className="elec-pt-md">
                  <MarkdownLike text={msg.content} />
                </div>
              </div>
            </div>
          )
        ))}

        {/* Gợi ý hỏi tiếp gọn gàng sau khi đã có câu trả lời */}
        {history.length > 0 && !loading && (
          <div className="elec-pt-followup-chips">
            {prompts.slice(0, 3).map((item) => (
              <button
                key={item.label}
                type="button"
                className="elec-pt-fchip"
                onClick={() => run(item.task, item.label)}
              >
                <i className="elec-pt-qdot" style={{ background: item.dot }} />
                <span>{item.label.split('&')[0].trim()}</span>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="elec-pt-ai-turn">
            <img src="/img/elec/elec-think.png" alt="Bé Elec đang nghĩ" className="elec-pt-turn-avatar" draggable={false} />
            <div className="elec-pt-ai-bubble is-thinking">
              <span className="ai-loading-dot" />
              <span className="ai-loading-dot" />
              <span className="ai-loading-dot" />
              <span>Bé Elec đang soạn lời giải...</span>
            </div>
          </div>
        )}

        {error && <div className="elec-pt-err">{error}</div>}
      </div>

      {/* Thanh nhập chat chuẩn ELEC AI (nút mũi tên tròn xanh nổi bật) */}
      <form
        className="elec-pt-composer"
        onSubmit={(ev) => {
          ev.preventDefault();
          send();
        }}
      >
        <input
          value={q}
          placeholder={`Hỏi Bé Elec về ${elements.map((x) => x.symbol).join(' & ')}...`}
          aria-label="Câu hỏi cho Bé Elec AI"
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="submit"
          className="elec-pt-send-btn"
          aria-label="Gửi câu hỏi"
          disabled={loading || !q.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </form>
    </div>
  );
}
