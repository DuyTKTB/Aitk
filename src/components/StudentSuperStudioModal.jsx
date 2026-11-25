/* ============================================================
   StudentSuperStudioModal.jsx — Studio Học Tập Chủ Động Cho Học Sinh
   Tổng hợp 4 siêu công cụ chọn lọc từ các dự án GitHub hàng đầu:
     1. Kỹ thuật Feynman (ptah23/feynman-ai) — Tự giảng & chấm hiểu bản chất
     2. Cloze Active Recall (Anki 33K★) — Tự đục lỗ điền khuyết & xuất Anki
     3. Đồ thị Hàm số & Tiếp tuyến 60fps (Desmos / feynman-technique)
     4. Trộn Âm thanh Tập trung Đa lớp (Moodist 10K★ — 8 kênh WebAudio offline)
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FEYNMAN_PROMPTS,
  evaluateFeynmanLocally,
  autoGenerateCloze,
  parseClozeText,
  gradeClozeAnswers,
  compileSafeMathFn,
  analyzeMathFunction,
} from '../lib/studentStudyStudio.js';
import {
  focusAudio,
  FOCUS_SOUND_TRACKS,
  FOCUS_MIX_PRESETS,
} from '../lib/focusAudioEngine.js';
import '../styles/teacher-pro-studio.css';

const GRAPH_COLORS = ['#2563eb', '#ef4444', '#10b981'];

const GRAPH_PRESETS = [
  { label: 'Bậc ba (x³ − 3x)', expr: 'x^3 - 3*x' },
  { label: 'Dao động tắt dần', expr: '3*e^(-0.25*x)*cos(2.5*x)' },
  { label: 'Lượng giác sin(2x)', expr: '2*sin(2*x) + cos(x)' },
  { label: 'Parabol (x² − 4)', expr: 'x^2 - 4' },
  { label: 'Phân thức (2x+1)/(x-1)', expr: '(2*x + 1)/(x - 1)' },
];

export default function StudentSuperStudioModal({ initialTab = 'feynman', onClose }) {
  const [tab, setTab] = useState(initialTab); // 'feynman' | 'cloze' | 'graph' | 'moodist'
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }, []);

  /* --- 1. FEYNMAN TECHNIQUE --- */
  const [feynmanId, setFeynmanId] = useState(FEYNMAN_PROMPTS[0].id);
  const [customConcept, setCustomConcept] = useState('');
  const [feynmanText, setFeynmanText] = useState('');
  const [feynmanResult, setFeynmanResult] = useState(null);
  const [showFeynmanRef, setShowFeynmanRef] = useState(false);

  const activeFeynman = useMemo(
    () => FEYNMAN_PROMPTS.find((p) => p.id === feynmanId) || FEYNMAN_PROMPTS[0],
    [feynmanId]
  );

  const handleGradeFeynman = () => {
    const res = evaluateFeynmanLocally({
      explanation: feynmanText,
      keywords: customConcept.trim() ? [] : activeFeynman.keywords,
    });
    setFeynmanResult(res);
  };

  /* --- 2. CLOZE ACTIVE RECALL (ANKI STYLE) --- */
  const [clozeSource, setClozeSource] = useState(
    'Phản ứng este hóa giữa axit cacboxylic và ancol có xúc tác {{c1::H2SO4 đặc}} và đun nóng là phản ứng {{c2::thuận nghịch}}, tạo thành {{c3::este}} và {{c4::nước}}.'
  );
  const [clozeMode, setClozeMode] = useState('practice'); // 'edit' | 'practice'
  const [clozeInputs, setClozeInputs] = useState({});
  const [clozeGrade, setClozeGrade] = useState(null);

  const parsedCloze = useMemo(() => parseClozeText(clozeSource), [clozeSource]);

  const handleAutoCloze = () => {
    const gen = autoGenerateCloze(clozeSource, 5);
    setClozeSource(gen);
    setClozeInputs({});
    setClozeGrade(null);
    setClozeMode('practice');
    showToast('Đã tự động đục lỗ các từ khóa & công thức quan trọng!');
  };

  const handleExportClozeAnki = () => {
    if (!parsedCloze.blanks.length) return;
    const tsv = [
      '#separator:tab',
      '#html:true',
      `${clozeSource.replace(/\t/g, ' ').replace(/\r?\n/g, '<br>')}\tELEC_AI_Cloze`,
    ].join('\n');
    const blob = new Blob([tsv], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ELEC-AI-Cloze-Anki.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Đã xuất thẻ Cloze chuẩn Anki (.txt)!');
  };

  /* --- 3. INTERACTIVE FUNCTION GRAPHER (60FPS CANVAS) --- */
  const [graphExprs, setGraphExprs] = useState(['x^3 - 3*x', '2*sin(x)']);
  const [viewBox, setViewBox] = useState({ cx: 0, cy: 0, scale: 38 }); // px per unit
  const [hoverX, setHoverX] = useState(null);
  const [showTangent, setShowTangent] = useState(true);
  const graphCanvasRef = useRef(null);
  const dragRef = useRef(null);

  const compiledFns = useMemo(
    () =>
      graphExprs.map((expr, idx) => ({
        expr,
        color: GRAPH_COLORS[idx % GRAPH_COLORS.length],
        fn: compileSafeMathFn(expr),
      })),
    [graphExprs]
  );

  const primaryAnalysis = useMemo(() => {
    const primary = compiledFns[0]?.fn;
    if (!primary) return { roots: [], extrema: [] };
    const halfSpan = Math.max(4, Math.min(20, 320 / viewBox.scale));
    return analyzeMathFunction(primary, viewBox.cx - halfSpan, viewBox.cx + halfSpan, 360);
  }, [compiledFns, viewBox.cx, viewBox.scale]);

  const drawGraph = useCallback(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(320, canvas.clientWidth || 640);
    const H = 310;
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = isDark ? '#0b1220' : '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const toPxX = (x) => W / 2 + (x - viewBox.cx) * viewBox.scale;
    const toPxY = (y) => H / 2 - (y - viewBox.cy) * viewBox.scale;
    const toMathX = (px) => viewBox.cx + (px - W / 2) / viewBox.scale;

    // Grid lines
    const step = viewBox.scale < 18 ? 5 : viewBox.scale < 30 ? 2 : 1;
    const xStart = Math.floor(toMathX(0) / step) * step;
    const xEnd = Math.ceil(toMathX(W) / step) * step;
    const yStart = Math.floor((viewBox.cy - H / (2 * viewBox.scale)) / step) * step;
    const yEnd = Math.ceil((viewBox.cy + H / (2 * viewBox.scale)) / step) * step;

    ctx.strokeStyle = isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)';
    ctx.lineWidth = 1;
    for (let gx = xStart; gx <= xEnd; gx += step) {
      const px = toPxX(gx);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    for (let gy = yStart; gy <= yEnd; gy += step) {
      const py = toPxY(gy);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }

    // Axes
    const ox = toPxX(0);
    const oy = toPxY(0);
    ctx.strokeStyle = isDark ? 'rgba(248,250,252,0.45)' : 'rgba(15,23,42,0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(W, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, H);
    ctx.stroke();

    // Axis ticks
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '600 10px system-ui, sans-serif';
    for (let gx = xStart; gx <= xEnd; gx += step) {
      if (gx === 0) continue;
      const px = toPxX(gx);
      ctx.fillText(String(gx), px + 3, Math.max(12, Math.min(H - 6, oy + 12)));
    }
    for (let gy = yStart; gy <= yEnd; gy += step) {
      if (gy === 0) continue;
      const py = toPxY(gy);
      ctx.fillText(String(gy), Math.max(6, Math.min(W - 22, ox + 5)), py - 3);
    }

    // Plot curves
    compiledFns.forEach(({ fn, color }) => {
      if (!fn) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      let started = false;
      let prevPy = null;
      for (let px = 0; px <= W; px += 1.5) {
        const x = toMathX(px);
        const y = fn(x);
        if (!Number.isFinite(y) || Math.abs(y) > 500) {
          started = false;
          prevPy = null;
          continue;
        }
        const py = toPxY(y);
        if (prevPy !== null && Math.abs(py - prevPy) > H * 0.85) {
          started = false;
        }
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
        prevPy = py;
      }
      ctx.stroke();
    });

    // Roots & extrema markers on primary function
    primaryAnalysis.roots.forEach((r) => {
      ctx.beginPath();
      ctx.arc(toPxX(r.x), toPxY(0), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#059669';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    primaryAnalysis.extrema.forEach((ex) => {
      ctx.beginPath();
      ctx.arc(toPxX(ex.x), toPxY(ex.y), 4.8, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Hover point + live tangent line f'(x0)
    const primaryFn = compiledFns[0]?.fn;
    if (hoverX !== null && primaryFn) {
      const y0 = primaryFn(hoverX);
      if (Number.isFinite(y0)) {
        const h = 1e-4;
        const slope = (primaryFn(hoverX + h) - primaryFn(hoverX - h)) / (2 * h);
        if (showTangent && Number.isFinite(slope)) {
          const span = 3.2;
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(toPxX(hoverX - span), toPxY(y0 - slope * span));
          ctx.lineTo(toPxX(hoverX + span), toPxY(y0 + slope * span));
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.arc(toPxX(hoverX), toPxY(y0), 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [compiledFns, viewBox, primaryAnalysis, hoverX, showTangent]);

  useEffect(() => {
    if (tab === 'graph') drawGraph();
  }, [tab, drawGraph]);

  const hoverReadout = useMemo(() => {
    const primaryFn = compiledFns[0]?.fn;
    if (hoverX === null || !primaryFn) return null;
    const y0 = primaryFn(hoverX);
    if (!Number.isFinite(y0)) return null;
    const h = 1e-4;
    const slope = (primaryFn(hoverX + h) - primaryFn(hoverX - h)) / (2 * h);
    return {
      x: hoverX.toFixed(2),
      y: y0.toFixed(2),
      slope: Number.isFinite(slope) ? slope.toFixed(2) : '∞',
    };
  }, [compiledFns, hoverX]);

  /* --- 4. MOODIST MULTI-LAYER AMBIENT MIXER --- */
  const [activeLayers, setActiveLayers] = useState(() => focusAudio.getActiveLayers());
  const syncLayers = () => setActiveLayers(focusAudio.getActiveLayers());

  const layerVolOf = (id) => activeLayers.find((l) => l.id === id)?.volume ?? 0;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="tps-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="tps-modal" role="dialog" aria-modal="true" aria-label="Studio Học Tập Chủ Động ELEC AI">
        <header className="tps-head">
          <div className="tps-head-l">
            <div className="emm-hero-mascot sm is-violet" aria-hidden="true">
              <img src="/img/elec/elec-super-saiyan.png" alt="Bé Elec Studio Học Tập Chủ Động" draggable={false} />
            </div>
            <div>
              <h2>Studio Học Tập Chủ Động (Feynman · Cloze · Đồ thị · Moodist)</h2>
              <p>4 công cụ khoa học ghi nhớ &amp; tư duy STEM mạnh nhất cho học sinh tự học — chạy 100% tức thì</p>
            </div>
          </div>
          <button type="button" className="tps-btn" onClick={onClose}>Đóng</button>
        </header>

        <div className="tps-tabs" role="tablist">
          {[
            { id: 'feynman', label: 'Kỹ thuật Feynman', mascot: '/img/elec/elec-think.png' },
            { id: 'cloze', label: 'Đục lỗ Active Recall', mascot: '/img/elec/elec-fighting.png' },
            { id: 'graph', label: 'Đồ thị Hàm số & Tiếp tuyến', mascot: '/img/elec/elec-cool.png' },
            { id: 'moodist', label: `Âm thanh Moodist (${activeLayers.length})`, mascot: '/img/elec/elec-happy.png' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`tps-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <img src={t.mascot} alt="" className="emm-tab-mascot" aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {toast && <div className="tps-toast" role="status">{toast}</div>}

        {/* TAB 1: FEYNMAN TECHNIQUE */}
        {tab === 'feynman' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FEYNMAN_PROMPTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`tps-btn${!customConcept && feynmanId === p.id ? ' primary' : ''}`}
                  style={{ height: 32, fontSize: '0.78rem' }}
                  onClick={() => {
                    setFeynmanId(p.id);
                    setCustomConcept('');
                    setFeynmanResult(null);
                    setShowFeynmanRef(false);
                  }}
                >
                  {p.subject}: {p.concept}
                </button>
              ))}
            </div>

            <input
              value={customConcept}
              onChange={(e) => { setCustomConcept(e.target.value); setFeynmanResult(null); }}
              placeholder="Hoặc tự nhập 1 khái niệm/định luật bất kỳ bạn muốn tự giảng lại..."
              className="tps-select"
              style={{ width: '100%' }}
            />

            <textarea
              rows={5}
              value={feynmanText}
              onChange={(e) => setFeynmanText(e.target.value)}
              placeholder={`Hãy tự giải thích "${customConcept.trim() || activeFeynman.concept}" bằng lời của chính bạn như đang giảng cho một bạn lớp 6 (có thể thêm ví dụ thực tế)...`}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 14,
                border: '1px solid var(--t-border-strong, rgba(15,23,42,0.14))',
                background: 'var(--t-surface-1, #f8fafc)',
                color: 'inherit',
                font: '500 0.88rem system-ui, sans-serif',
                lineHeight: 1.55,
              }}
            />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="tps-btn primary" onClick={handleGradeFeynman}>
                Chấm điểm hiểu bản chất (0 credit)
              </button>
              {!customConcept.trim() && (
                <button type="button" className="tps-btn" onClick={() => setShowFeynmanRef((v) => !v)}>
                  {showFeynmanRef ? 'Ẩn lời giải chuẩn' : 'Xem cách giải thích chuẩn 10/10'}
                </button>
              )}
            </div>

            {feynmanResult && (
              <div className="tps-studio-card" style={{ alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <strong style={{ fontSize: '1rem', color: feynmanResult.score >= 70 ? '#059669' : '#d97706' }}>
                    Điểm hiểu bản chất: {feynmanResult.score}/100 · {feynmanResult.grade}
                  </strong>
                  {feynmanResult.hasExample && (
                    <span style={{ padding: '2px 9px', borderRadius: 99, background: 'rgba(16,185,129,0.14)', color: '#059669', fontSize: '0.74rem', fontWeight: 800 }}>
                      Có ví dụ / liên hệ thực tế (+15đ)
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>{feynmanResult.feedback}</p>
                {feynmanResult.matchedKeywords.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    {feynmanResult.matchedKeywords.map((k) => (
                      <span key={k} style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.14)', color: '#059669', fontWeight: 700 }}>✓ {k}</span>
                    ))}
                    {feynmanResult.missingKeywords.map((k) => (
                      <span key={k} style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', color: '#b45309', fontWeight: 700 }}>Thiếu: {k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showFeynmanRef && !customConcept.trim() && (
              <div className="tps-toast" style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'rgba(37,99,235,0.24)', color: 'inherit' }}>
                <strong>Gợi ý chuẩn 10/10:</strong> {activeFeynman.reference}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLOZE ACTIVE RECALL */}
        {tab === 'cloze' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className={`tps-btn${clozeMode === 'practice' ? ' primary' : ''}`} onClick={() => setClozeMode('practice')}>
                  Luyện điền khuyết ({parsedCloze.blanks.length} ô)
                </button>
                <button type="button" className={`tps-btn${clozeMode === 'edit' ? ' primary' : ''}`} onClick={() => setClozeMode('edit')}>
                  Dán / Sửa đoạn văn
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" className="tps-btn" onClick={handleAutoCloze}>Tự động đục lỗ (Auto-Cloze)</button>
                <button type="button" className="tps-btn" onClick={handleExportClozeAnki} disabled={!parsedCloze.blanks.length}>
                  Xuất Anki (.txt)
                </button>
              </div>
            </div>

            {clozeMode === 'edit' ? (
              <textarea
                rows={5}
                value={clozeSource}
                onChange={(e) => { setClozeSource(e.target.value); setClozeGrade(null); }}
                placeholder="Dán đoạn ghi chú bài học bất kỳ rồi bấm 'Tự động đục lỗ', hoặc tự bọc từ khóa bằng cú pháp {{c1::từ khóa}}..."
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid var(--t-border-strong, rgba(15,23,42,0.14))',
                  background: 'var(--t-surface-1, #f8fafc)',
                  color: 'inherit',
                  font: '500 0.88rem system-ui, sans-serif',
                  lineHeight: 1.6,
                }}
              />
            ) : (
              <div className="tps-studio-card" style={{ alignItems: 'stretch', gap: 14 }}>
                <div style={{ fontSize: '0.96rem', lineHeight: 2.15 }}>
                  {parsedCloze.segments.map((seg, i) => {
                    if (seg.type === 'text') return <span key={i}>{seg.value}</span>;
                    const g = clozeGrade?.details?.[seg.index];
                    return (
                      <input
                        key={i}
                        value={clozeInputs[seg.index] || ''}
                        onChange={(e) => setClozeInputs((prev) => ({ ...prev, [seg.index]: e.target.value }))}
                        placeholder={seg.hint || `Ô #${seg.index + 1}`}
                        style={{
                          width: Math.max(88, seg.answer.length * 10 + 20),
                          height: 30,
                          margin: '0 4px',
                          padding: '0 8px',
                          borderRadius: 8,
                          border: g
                            ? `1.5px solid ${g.ok ? '#10b981' : '#ef4444'}`
                            : '1.5px solid #2563eb',
                          background: g
                            ? g.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)'
                            : 'var(--t-surface-0, #ffffff)',
                          color: 'inherit',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          textAlign: 'center',
                        }}
                      />
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="tps-btn primary"
                    onClick={() =>
                      setClozeGrade(
                        gradeClozeAnswers(
                          parsedCloze.blanks,
                          parsedCloze.blanks.map((_, idx) => clozeInputs[idx] || '')
                        )
                      )
                    }
                  >
                    Kiểm tra đáp án
                  </button>
                  <button
                    type="button"
                    className="tps-btn"
                    onClick={() => { setClozeInputs({}); setClozeGrade(null); }}
                  >
                    Làm lại
                  </button>
                  {clozeGrade && (
                    <strong style={{ color: clozeGrade.pct === 100 ? '#059669' : '#d97706', fontSize: '0.88rem' }}>
                      Đúng {clozeGrade.correct}/{clozeGrade.total} ô ({clozeGrade.pct}%)
                    </strong>
                  )}
                </div>

                {clozeGrade && clozeGrade.details.some((d) => !d.ok) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--t-ink-3, #64748b)' }}>
                    Đáp án đúng:{' '}
                    {clozeGrade.details.map((d) => (
                      <span key={d.index} style={{ marginRight: 10 }}>
                        Ô #{d.index + 1}: <strong style={{ color: '#059669' }}>{d.expected}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INTERACTIVE FUNCTION GRAPHER */}
        {tab === 'graph' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {GRAPH_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="tps-btn"
                  style={{ height: 30, fontSize: '0.76rem', padding: '0 10px' }}
                  onClick={() => setGraphExprs((arr) => [p.expr, ...arr.slice(1)])}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {graphExprs.map((expr, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: GRAPH_COLORS[idx % GRAPH_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>f{idx + 1}(x) =</span>
                  <input
                    value={expr}
                    onChange={(e) => setGraphExprs((arr) => arr.map((v, i) => (i === idx ? e.target.value : v)))}
                    className="tps-select"
                    style={{ flex: 1, height: 34, fontFamily: 'monospace' }}
                    placeholder="VD: x^2 - 3*x + 2"
                  />
                </div>
              ))}
            </div>

            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--t-border-strong, rgba(15,23,42,0.14))' }}>
              <canvas
                ref={graphCanvasRef}
                style={{ width: '100%', height: 310, display: 'block', cursor: 'crosshair' }}
                onMouseDown={(e) => {
                  dragRef.current = { x: e.clientX, y: e.clientY, cx: viewBox.cx, cy: viewBox.cy };
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const px = e.clientX - rect.left;
                  const mathX = viewBox.cx + (px - rect.width / 2) / viewBox.scale;
                  setHoverX(mathX);
                  if (dragRef.current) {
                    const dx = (e.clientX - dragRef.current.x) / viewBox.scale;
                    const dy = (e.clientY - dragRef.current.y) / viewBox.scale;
                    setViewBox((v) => ({ ...v, cx: dragRef.current.cx - dx, cy: dragRef.current.cy + dy }));
                  }
                }}
                onMouseUp={() => { dragRef.current = null; }}
                onMouseLeave={() => { dragRef.current = null; setHoverX(null); }}
                onWheel={(e) => {
                  e.preventDefault();
                  const factor = e.deltaY < 0 ? 1.14 : 0.88;
                  setViewBox((v) => ({ ...v, scale: Math.max(10, Math.min(180, v.scale * factor)) }));
                }}
              />
              {hoverReadout && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    padding: '5px 10px',
                    borderRadius: 9,
                    background: 'rgba(15,23,42,0.82)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    pointerEvents: 'none',
                  }}
                >
                  x = {hoverReadout.x} · f₁(x) = {hoverReadout.y} · f₁&apos;(x) = {hoverReadout.slope}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>
                  ● Nghiệm f₁(x)=0: {primaryAnalysis.roots.length ? primaryAnalysis.roots.map((r) => r.x).join(', ') : 'không thấy trong khung'}
                </span>
                <span style={{ color: '#d97706', fontWeight: 700 }}>
                  ● Cực trị: {primaryAnalysis.extrema.length ? primaryAnalysis.extrema.map((e) => `${e.kind === 'max' ? 'CĐ' : 'CT'}(${e.x}; ${e.y})`).join(', ') : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={showTangent} onChange={(e) => setShowTangent(e.target.checked)} style={{ accentColor: '#ec4899' }} />
                  Vẽ tiếp tuyến
                </label>
                <button type="button" className="tps-btn" style={{ height: 30 }} onClick={() => setViewBox({ cx: 0, cy: 0, scale: 38 })}>
                  Về tâm (0,0)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MOODIST MULTI-LAYER SOUND MIXER */}
        {tab === 'moodist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FOCUS_MIX_PRESETS.map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    className="tps-btn primary"
                    style={{ height: 32, fontSize: '0.78rem' }}
                    onClick={() => {
                      focusAudio.applyPreset(pr.id);
                      syncLayers();
                      showToast(`Đã bật combo âm thanh "${pr.label}"!`);
                    }}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="tps-btn danger"
                style={{ height: 32 }}
                onClick={() => { focusAudio.stop(); syncLayers(); }}
              >
                Tắt tất cả âm thanh
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
              {FOCUS_SOUND_TRACKS.filter((t) => t.id !== 'none').map((tr) => {
                const vol = layerVolOf(tr.id);
                const on = vol > 0;
                return (
                  <div
                    key={tr.id}
                    className="tps-studio-card"
                    style={{
                      alignItems: 'stretch',
                      padding: '12px 14px',
                      gap: 10,
                      borderColor: on ? '#2563eb' : undefined,
                      boxShadow: on ? '0 0 0 2px rgba(37,99,235,0.16)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.86rem' }}>{tr.label}</strong>
                      <button
                        type="button"
                        className={`tps-btn${on ? ' primary' : ''}`}
                        style={{ height: 28, padding: '0 10px', fontSize: '0.74rem' }}
                        onClick={() => {
                          focusAudio.toggleLayer(tr.id, 0.45);
                          syncLayers();
                        }}
                      >
                        {on ? 'Đang bật' : 'Bật'}
                      </button>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={on ? Math.round(vol * 100) : 45}
                      disabled={!on}
                      onChange={(e) => {
                        const v = Number(e.target.value) / 100;
                        focusAudio.setLayerVolume(tr.id, v);
                        syncLayers();
                      }}
                      style={{ width: '100%', accentColor: '#2563eb' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
