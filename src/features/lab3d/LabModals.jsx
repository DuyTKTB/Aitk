/* ============================================================
   LabModals.jsx — Biểu đồ Chuẩn độ pH/Nhiệt độ, Thị kính Hiển vi 4x–100x
   & Gia sư Đa AI Bé Elec đọc trực tiếp trạng thái bàn Lab 3D
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import { askAI, getActiveAIProviders } from '../../lib/ai.js';
import { MarkdownLike } from '../../components/ChatMarkdown.jsx';

/* ---------- 1. BIỂU ĐỒ ĐƯỜNG CONG CHUẨN ĐỘ pH & NHIỆT ĐỘ (SVG) ---------- */
export function LiveTelemetryChart({ points = [] }) {
  const data = points.length >= 2
    ? points.slice(-24)
    : [{ idx: 0, pH: 7, temp: 25 }, { idx: 1, pH: 7, temp: 25 }];

  const W = 252;
  const H = 96;
  const padX = 22;
  const padY = 10;
  const innerW = W - padX - 8;
  const innerH = H - padY * 2;

  const phCoords = data.map((pt, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * innerW;
    const y = padY + (1 - Math.max(0, Math.min(14, pt.pH ?? 7)) / 14) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const tempCoords = data.map((pt, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * innerW;
    const y = padY + (1 - Math.max(0, Math.min(100, pt.temp ?? 25)) / 100) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const last = data[data.length - 1];

  return (
    <div className="lab-telemetry-card">
      <div className="lab-telemetry-head">
        <b>Đồ thị chuẩn độ pH & Nhiệt độ</b>
        <div className="lab-telemetry-legend">
          <span className="is-ph">pH {Number(last?.pH ?? 7).toFixed(1)}</span>
          <span className="is-temp">{Math.round(last?.temp ?? 25)}°C</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="lab-telemetry-svg" role="img" aria-label="Biểu đồ pH và nhiệt độ theo thời gian">
        {/* Lưới ngang pH 14, 7, 0 */}
        <line x1={padX} y1={padY} x2={W - 8} y2={padY} stroke="rgba(148,163,184,0.18)" strokeDasharray="3 3" />
        <line x1={padX} y1={padY + innerH / 2} x2={W - 8} y2={padY + innerH / 2} stroke="rgba(34,197,94,0.38)" strokeDasharray="3 3" />
        <line x1={padX} y1={padY + innerH} x2={W - 8} y2={padY + innerH} stroke="rgba(148,163,184,0.18)" />
        <text x="4" y={padY + 4} fill="#94a3b8" fontSize="8">14</text>
        <text x="8" y={padY + innerH / 2 + 3} fill="#4ade80" fontSize="8">7</text>
        <text x="8" y={padY + innerH + 2} fill="#94a3b8" fontSize="8">0</text>

        {/* Đường nhiệt độ */}
        <polyline fill="none" stroke="#fb923c" strokeWidth="1.6" strokeDasharray="3 2" points={tempCoords} />
        {/* Đường pH chuẩn độ */}
        <polyline fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={phCoords} />
      </svg>
    </div>
  );
}

/* ---------- 2. THỊ KÍNH KÍNH HIỂN VI QUANG HỌC 4× – 100× ---------- */
const SLIDES = [
  { id: 'onion', name: 'Tế bào biểu bì hành tây', desc: 'Thành tế bào xenlulozơ hình đa giác xếp khít nhau, nhân bắt màu tím đậm.', stain: '#d8b4fe' },
  { id: 'blood', name: 'Hồng cầu máu người', desc: 'Tế bào hình đĩa lõm 2 mặt màu đỏ hồng, không nhân, vận chuyển O2.', stain: '#fca5a5' },
  { id: 'bacteria', name: 'Trực khuẩn E. coli (Gram âm)', desc: 'Vi khuẩn hình que nhỏ, chuyển động nhẹ trong môi trường lỏng.', stain: '#93c5fd' },
  { id: 'crystal', name: 'Tinh thể muối NaCl', desc: 'Các khối lập phương trong suốt đối xứng tinh thể học bậc cao.', stain: '#e0f2fe' },
];

export function MicroscopeOverlay({ open, onClose }) {
  const [slideId, setSlideId] = useState('onion');
  const [zoom, setZoom] = useState(40);
  const [focus, setFocus] = useState(52); // Điểm nét chuẩn = 50
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;

    const draw = (time) => {
      const t = time * 0.001;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Nền ánh sáng tụ quang
      const bg = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
      bg.addColorStop(0, '#f8fafc');
      bg.addColorStop(0.78, '#e2e8f0');
      bg.addColorStop(1, '#94a3b8');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const scale = zoom === 4 ? 0.55 : zoom === 10 ? 0.85 : zoom === 40 ? 1.35 : 2.1;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);

      if (slideId === 'onion') {
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 2.4;
        for (let r = -4; r <= 4; r++) {
          for (let c = -3; c <= 3; c++) {
            const x = c * 74 + (r % 2) * 36;
            const y = r * 36;
            ctx.fillStyle = 'rgba(216, 180, 254, 0.32)';
            ctx.beginPath();
            ctx.roundRect(x - 35, y - 16, 70, 32, 6);
            ctx.fill();
            ctx.stroke();
            // Nhân tế bào
            ctx.fillStyle = '#581c87';
            ctx.beginPath();
            ctx.arc(x + ((r * 7 + c * 11) % 14), y + ((r + c) % 4), 5.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (slideId === 'blood') {
        for (let i = 0; i < 36; i++) {
          const ang = i * 2.39996;
          const rad = Math.sqrt(i) * 26;
          const x = Math.cos(ang) * rad + Math.sin(t + i) * 1.8;
          const y = Math.sin(ang) * rad + Math.cos(t * 0.9 + i) * 1.8;
          ctx.fillStyle = 'rgba(220, 38, 38, 0.78)';
          ctx.beginPath();
          ctx.arc(x, y, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(254, 202, 202, 0.65)';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (slideId === 'bacteria') {
        ctx.fillStyle = '#2563eb';
        for (let i = 0; i < 42; i++) {
          const x = Math.sin(i * 19.3 + t * 0.45) * 130;
          const y = Math.cos(i * 13.7 + t * 0.35) * 130;
          const rot = i * 1.2 + Math.sin(t + i) * 0.3;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.roundRect(-9, -3, 18, 6, 3);
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Tinh thể lập phương NaCl
        for (let i = 0; i < 16; i++) {
          const x = ((i % 4) - 1.5) * 68 + Math.sin(i) * 12;
          const y = (Math.floor(i / 4) - 1.5) * 68 + Math.cos(i) * 12;
          const sz = 26 + (i % 3) * 10;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((i * 0.4) % 1.2);
          ctx.fillStyle = 'rgba(186, 230, 253, 0.48)';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
          ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.strokeRect(-sz / 2 + 5, -sz / 2 + 5, sz - 10, sz - 10);
          ctx.restore();
        }
      }
      ctx.restore();

      // Vạch chia thị kính (reticle)
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 90, h / 2); ctx.lineTo(w / 2 + 90, h / 2);
      ctx.moveTo(w / 2, h / 2 - 90); ctx.lineTo(w / 2, h / 2 + 90);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open, slideId, zoom]);

  if (!open) return null;
  const slide = SLIDES.find((s) => s.id === slideId) || SLIDES[0];
  const blurPx = Math.abs(focus - 50) * 0.22;

  return (
    <div className="lab-modal-backdrop" onClick={onClose}>
      <div className="lab-scope-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lab-scope-head">
          <div>
            <b>Kính hiển vi quang học ELEC Scope</b>
            <small>{slide.name} · Độ phóng đại {zoom * 10}× (Vật kính {zoom}× · Thị kính 10×)</small>
          </div>
          <button type="button" className="lab-ib" onClick={onClose}>Đóng</button>
        </div>

        <div className="lab-scope-body">
          <div className="lab-scope-lens">
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              style={{ filter: `blur(${blurPx.toFixed(1)}px)` }}
            />
            <span className="lab-scope-badge">{blurPx < 0.8 ? 'ĐÃ LẤY NÉT CHUẨN' : 'Chỉnh ốc vi cấp để rõ nét'}</span>
          </div>

          <div className="lab-scope-controls">
            <div className="lab-scope-group">
              <label>Chọn tiêu bản mẫu vật</label>
              <div className="lab-scope-pills">
                {SLIDES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={'lab-cat-chip' + (slideId === s.id ? ' on' : '')}
                    onClick={() => setSlideId(s.id)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <p className="lab-scope-desc">{slide.desc}</p>
            </div>

            <div className="lab-scope-group">
              <label>Mâm vật kính</label>
              <div className="lab-scope-pills">
                {[4, 10, 40, 100].map((z) => (
                  <button
                    key={z}
                    type="button"
                    className={'lab-cat-chip' + (zoom === z ? ' on' : '')}
                    onClick={() => setZoom(z)}
                  >
                    {z}×
                  </button>
                ))}
              </div>
            </div>

            <div className="lab-scope-group">
              <label>Ốc vi cấp chỉnh tiêu cự ({focus}/100)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. GIA SƯ ĐA AI BÉ ELEC TRONG PHÒNG LAB 3D ---------- */
export function LabAiTutorDrawer({ open, onClose, labContextText }) {
  const [provider, setProvider] = useState('auto');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const providers = getActiveAIProviders();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  if (!open) return null;

  const sendPrompt = async (questionText) => {
    const q = String(questionText || '').trim();
    if (!q || loading) return;
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const fullPrompt =
        `Bạn là Bé Elec — trợ lý phòng thí nghiệm 3D STEM (Hóa học · Vật lý · Sinh học) chuẩn GDPT 2018.\n` +
        `Dưới đây là TRẠNG THÁI THỰC TẾ trên bàn thí nghiệm 3D của học sinh:\n${labContextText}\n\n` +
        `Yêu cầu học sinh: ${q}\n` +
        `Hãy giải thích rõ ràng, viết đúng phương trình hóa học/vật lý, chỉ ra hiện tượng quan sát được và 1 mẹo nhớ thi THPT QG.`;

      const res = await askAI(fullPrompt, null, null, {
        preferredProvider: provider,
        hedgeMs: provider === 'auto' ? 2400 : 0,
      });
      const reply = typeof res === 'string' ? res : (res?.text || '');
      const model = typeof res === 'object' ? (res?.model || '') : '';
      setMessages((prev) => [...prev, { role: 'ai', text: reply, model }]);
    } catch (e) {
      setError(e?.message || 'Không thể kết nối AI lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    'Giải thích phản ứng đang xảy ra trên bàn thí nghiệm',
    'Viết phương trình ion rút gọn & cân bằng',
    'Tại sao lại đổi màu / tạo kết tủa như vậy?',
    'Cho mình 2 câu trắc nghiệm từ thí nghiệm này',
  ];

  return (
    <div className="lab-ai-drawer">
      <div className="lab-ai-head">
        <div className="lab-ai-brand">
          <img
            src={loading ? '/img/elec/elec-think.png' : '/img/elec/elec-happy.png'}
            alt="Bé Elec"
            className="lab-ai-avatar"
            draggable={false}
          />
          <div>
            <b>Gia sư Phòng Lab 3D · Đa AI</b>
            <small>Đọc trực tiếp dụng cụ, pH, nhiệt độ & trạm 3D</small>
          </div>
        </div>
        <button type="button" className="lab-ib" onClick={onClose}>Đóng</button>
      </div>

      <div className="lab-ai-providers">
        <button
          type="button"
          className={'lab-cat-chip' + (provider === 'auto' ? ' on' : '')}
          onClick={() => setProvider('auto')}
        >
          Đa AI (3)
        </button>
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            className={'lab-cat-chip' + (provider === p.id ? ' on' : '')}
            onClick={() => setProvider(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="lab-ai-body" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="lab-ai-welcome">
            <p>Chào bạn! Bé Elec đang theo dõi trực tiếp bàn thí nghiệm 3D của bạn. Bấm một gợi ý nhanh bên dưới hoặc hỏi bất kỳ hiện tượng nào nhé:</p>
            <div className="lab-ai-chips">
              {quickChips.map((c) => (
                <button key={c} type="button" className="lab-suggest-item" onClick={() => sendPrompt(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={'lab-ai-msg ' + (m.role === 'user' ? 'is-user' : 'is-ai')}>
            {m.role === 'ai' && m.model && (
              <span className="lab-ai-model">{m.model.replace(/^server\//, '')}</span>
            )}
            {m.role === 'user' ? (
              <span>{m.text}</span>
            ) : (
              <MarkdownLike text={m.text} />
            )}
          </div>
        ))}

        {loading && <div className="lab-ai-loading">Bé Elec đang phân tích dữ liệu phòng thí nghiệm...</div>}
        {error && <div className="lab-ai-error">{error}</div>}
      </div>

      <form
        className="lab-ai-form"
        onSubmit={(e) => { e.preventDefault(); sendPrompt(input); }}
      >
        <input
          className="lab-search"
          placeholder="Hỏi Bé Elec về phản ứng, điện phân, quang phổ..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="lab-btn" disabled={loading || !input.trim()}>Gửi</button>
      </form>
    </div>
  );
}
