import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadChalkboardWasm,
  ChalkboardSession,
  renderChalkboard,
} from '../lib/chalkboardEngine.js';
import MathText from './MathText.jsx';
import '../styles/chalkboard-solver.css';

/**
 * Component ChalkboardSolverStage
 * Khớp 100% giao diện Bài giảng Bảng phấn tương tác chia 2 cột như Măng Non
 * Tự động diễn hoạt "Giải đến đâu vẽ tới đó"
 */
export default function ChalkboardSolverStage({
  lesson,
  onClose,
  initialAutoPlay = true,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(initialAutoPlay);
  const [theme, setTheme] = useState('paper'); // 'paper' (nền trắng như ảnh) | 'chalkboard' (bảng xanh)
  const [viewAngles, setViewAngles] = useState(lesson.gocNhin || [-1.22, 0.36, 1.0]);
  const [loadingWasm, setLoadingWasm] = useState(true);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const wasmEngineRef = useRef(null);
  const stepCardRefs = useRef([]);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0 });

  const totalSteps = lesson?.buoc?.length || 1;

  // 1. Tải WASM engine
  useEffect(() => {
    let isMounted = true;
    loadChalkboardWasm()
      .then((engine) => {
        if (!isMounted) return;
        wasmEngineRef.current = engine;
        setLoadingWasm(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Không thể nạp ve.wasm');
        setLoadingWasm(false);
      });

    return () => {
      isMounted = false;
      if (sessionRef.current) {
        sessionRef.current.huy();
        sessionRef.current = null;
      }
    };
  }, []);

  // 2. Chế độ "Giải đến đâu vẽ tới đó" (Auto-Play)
  useEffect(() => {
    if (!autoPlay || loadingWasm) return;

    if (activeStep < totalSteps - 1) {
      const timer = setTimeout(() => {
        setActiveStep((prev) => prev + 1);
      }, 2500); // 2.5s mỗi bước để người học kịp đọc và nhìn hình vẽ
      return () => clearTimeout(timer);
    } else {
      setAutoPlay(false);
    }
  }, [autoPlay, activeStep, totalSteps, loadingWasm]);

  // Cuộn đến bước đang kích hoạt ở cột phải
  useEffect(() => {
    const el = stepCardRefs.current[activeStep];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeStep]);

  // 3. Hàm vẽ Canvas bằng WASM
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const session = sessionRef.current;
    if (!canvas || !session) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth || 600;
    const height = canvas.clientHeight || 500;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    try {
      const [yaw, pitch, zoom] = viewAngles;
      const res = session.ve(width, height, yaw, pitch, zoom, 1e6);
      if (res && res.m) {
        renderChalkboard(ctx, res.m, {
          chalkStyle: theme === 'chalkboard',
          showLabels: true,
        });
      }
    } catch (e) {
      console.warn('[ChalkboardSolverStage Render Error]:', e);
    }
  }, [viewAngles, theme]);

  // 4. Nạp lệnh vẽ luỹ tiến theo bước ("Giải đến đâu vẽ tới đó")
  useEffect(() => {
    const engine = wasmEngineRef.current;
    if (!engine || !lesson) return;

    if (sessionRef.current) {
      sessionRef.current.huy();
      sessionRef.current = null;
    }

    try {
      const session = new ChalkboardSession(engine, lesson.baChieu, lesson.heTruc);
      sessionRef.current = session;

      // Gom toàn bộ lệnh vẽ từ bước 0 đến activeStep
      const stmts = [];
      for (let i = 0; i <= activeStep && i < totalSteps; i++) {
        const step = lesson.buoc[i];
        if (Array.isArray(step.lenh)) {
          stmts.push(...step.lenh);
        }
      }

      session.dat(stmts);
      redraw();
    } catch (e) {
      console.error('[ChalkboardSolverStage Session Error]:', e);
    }
  }, [lesson, activeStep, totalSteps, redraw]);

  // Cập nhật khi resize
  useEffect(() => {
    const handleResize = () => redraw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw]);

  // 5. Xử lý chuột xoay 3D
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setAutoPlay(false); // Dừng auto-play khi người dùng tương tác tay
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;

    if (lesson.baChieu) {
      setViewAngles(([yaw, pitch, zoom]) => [
        yaw - dx * 0.008,
        Math.max(-1.45, Math.min(1.45, pitch + dy * 0.008)),
        zoom,
      ]);
    }
  };

  const handlePointerUp = (e) => {
    dragRef.current.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setAutoPlay(false);
    const factor = e.deltaY > 0 ? 0.95 : 1.05;
    setViewAngles(([yaw, pitch, zoom]) => [
      yaw,
      pitch,
      Math.max(0.4, Math.min(3.5, zoom * factor)),
    ]);
  };

  const resetView = () => {
    setViewAngles(lesson.gocNhin || [-1.22, 0.36, 1.0]);
  };

  return (
    <div className="cb-solver-overlay">
      {/* 1. THANH TIÊU ĐỀ TRÊN CÙNG (KHỚP ẢNH MĂNG NON) */}
      <header className="cb-solver-topbar">
        <div className="cb-solver-brand">
          <div className="cb-solver-logo">
            <span>ELEC AI</span>
          </div>
          <span className="cb-solver-tag">Toán · Giải bài tập</span>
          <div className="cb-solver-title" title={lesson.tieuDe}>
            {lesson.tieuDe}
          </div>
        </div>

        <div className="cb-solver-controls">
          {/* Các nút tròn số bước (1) (2) (3)... */}
          <div className="cb-step-pills">
            {lesson.buoc.map((b, idx) => (
              <button
                key={idx}
                type="button"
                className={`cb-step-pill ${idx === activeStep ? 'is-active' : idx < activeStep ? 'is-done' : ''}`}
                onClick={() => {
                  setAutoPlay(false);
                  setActiveStep(idx);
                }}
                title={b.tieuDe}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Nút Tự động vẽ / Tạm dừng */}
          <button
            type="button"
            className="cb-btn-tool"
            onClick={() => setAutoPlay(!autoPlay)}
            title="Giải đến đâu vẽ tới đó"
          >
            {autoPlay ? '⏸ Tạm dừng' : '▶ Tự động vẽ'}
          </button>

          {/* Nút Đóng / Quay lại chat */}
          <button
            type="button"
            className="cb-btn-close"
            onClick={onClose}
            title="Đóng bảng vẽ & Quay lại Chat"
          >
            ✕
          </button>
        </div>
      </header>

      {/* 2. KHUNG NỘI DUNG CHIA ĐÔI 2 BÊN */}
      <div className="cb-solver-body">
        {/* CỘT TRÁI: CANVAS VẼ HÌNH */}
        <div
          className={`cb-canvas-pane theme-${theme}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Huy hiệu góc trái */}
          <div className="cb-step-badge-float">
            <span>Bước vẽ: {activeStep + 1} / {totalSteps}</span>
          </div>

          {/* Canvas chính */}
          {loadingWasm ? (
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Đang nạp bộ máy vẽ ve.wasm...</div>
          ) : error ? (
            <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>
          ) : (
            <canvas ref={canvasRef} className="cb-canvas-element" />
          )}

          {/* Nút tiện ích góc dưới */}
          <div className="cb-canvas-floating-tools">
            <button type="button" className="cb-floating-btn" onClick={resetView}>
              ↺ Đặt lại góc
            </button>
            <button
              type="button"
              className="cb-floating-btn"
              onClick={() => setTheme(theme === 'paper' ? 'chalkboard' : 'paper')}
            >
              {theme === 'paper' ? '🌲 Bảng phấn xanh' : '📄 Giấy trắng'}
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: LỜI GIẢI TỪNG BƯỚC + ĐÁP SỐ + MẸO BÉ ELEC */}
        <div className="cb-explanation-pane">
          {lesson.buoc.map((step, idx) => (
            <div
              key={idx}
              ref={(el) => (stepCardRefs.current[idx] = el)}
              className={`cb-step-card ${idx === activeStep ? 'is-active' : ''}`}
              onClick={() => {
                setAutoPlay(false);
                setActiveStep(idx);
              }}
            >
              <div className="cb-step-card-header">
                <div className="cb-step-number-bullet">{idx + 1}</div>
                <div className="cb-step-title">{step.tieuDe}</div>
              </div>
              <div className="cb-step-body">
                <MathText text={step.giaiThich} />
              </div>
            </div>
          ))}

          {/* Khối ĐÁP SỐ màu xanh lá đậm chuẩn Măng Non */}
          {lesson.dapSo && (
            <div className="cb-final-answer-banner">
              <div className="cb-final-answer-label">ĐÁP SỐ</div>
              <div className="cb-final-answer-content">
                <MathText text={lesson.dapSo} />
              </div>
            </div>
          )}

          {/* Khối BÉ ELEC TỔNG KẾT & MẸO NHỚ */}
          <div className="cb-mascot-summary-box">
            <img
              src="/img/elec/elec-wink.png"
              alt="Bé Elec"
              className="cb-mascot-avatar"
            />
            <div className="cb-mascot-summary-text">
              <div className="cb-mascot-summary-title">BÉ ELEC TỔNG KẾT</div>
              <p className="cb-mascot-summary-p">
                {lesson.meo || 'Mẹo giải nhanh: Hãy bấm vào từng số bước ở thanh trên cùng để quan sát hình vẽ được dựng dần từng nét!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
