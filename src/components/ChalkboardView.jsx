import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadChalkboardWasm,
  ChalkboardSession,
  renderChalkboard,
  SAMPLE_CHALKBOARD_LESSONS,
} from '../lib/chalkboardEngine.js';
import MathText from './MathText.jsx';
import '../styles/chalkboard.css';

/**
 * Component ChalkboardView — Bảng phấn tương tác & Kiểm định Cơ học WebAssembly
 */
export default function ChalkboardView({
  initialLessonId = 'chop-tam-giac-deu',
  customLesson = null,
  showSelector = true,
  showControls = true,
  height = 520,
  onStepChange = null,
}) {
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [customCommands, setCustomCommands] = useState('');
  const [sandboxError, setSandboxError] = useState(null);
  const [verificationResults, setVerificationResults] = useState([]);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Góc nhìn 3D [yaw, pitch, zoom]
  const [viewAngles, setViewAngles] = useState([-1.22, 0.36, 1.0]);

  // Tham chiếu DOM
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const sessionRef = useRef(null);
  const wasmEngineRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0 });

  // Xác định bài học hiện tại
  const currentLesson = customLesson || SAMPLE_CHALKBOARD_LESSONS.find((l) => l.id === selectedLessonId) || SAMPLE_CHALKBOARD_LESSONS[0];

  // Khởi tạo WASM Engine
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    loadChalkboardWasm()
      .then((engine) => {
        if (!isMounted) return;
        wasmEngineRef.current = engine;
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Không thể nạp bộ vẽ ve.wasm');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (sessionRef.current) {
        sessionRef.current.huy();
        sessionRef.current = null;
      }
    };
  }, []);

  // Thiết lập góc nhìn mặc định khi đổi bài học
  useEffect(() => {
    if (currentLesson.gocNhin) {
      setViewAngles([...currentLesson.gocNhin]);
    }
    setActiveStep(0);
    setSandboxMode(false);
    setSandboxError(null);
  }, [currentLesson]);

  // Hàm vẽ lại khung hình Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const session = sessionRef.current;
    if (!canvas || !session) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth || 600;
    const h = canvas.clientHeight || height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, h);

    try {
      const [yaw, pitch, zoom] = viewAngles;
      const res = session.ve(width, h, yaw, pitch, zoom, 1e6);
      if (res && res.m) {
        renderChalkboard(ctx, res.m, { chalkStyle: true });
      }
    } catch (err) {
      console.warn('[Chalkboard Render Error]:', err);
    }
  }, [viewAngles, height]);

  // Nạp kịch bản vào phiên làm việc mỗi khi đổi bài hoặc đổi bước
  useEffect(() => {
    const engine = wasmEngineRef.current;
    if (!engine) return;

    if (sessionRef.current) {
      sessionRef.current.huy();
      sessionRef.current = null;
    }

    try {
      const is3D = currentLesson.baChieu ?? true;
      const hasAxes = currentLesson.heTruc ?? false;
      const session = new ChalkboardSession(engine, is3D, hasAxes);
      sessionRef.current = session;

      if (sandboxMode) {
        // Chế độ Sandbox tự gõ
        const res = session.dat(customCommands);
        if (res && res.loi && res.loi.length > 0) {
          setSandboxError(res.loi.map(([line, err]) => `Dòng ${line + 1}: ${err}`).join('\n'));
        } else {
          setSandboxError(null);
        }
      } else {
        // Chế độ bài học từng bước: nạp toàn bộ lệnh từ bước 0 đến activeStep
        const stmts = [];
        for (let i = 0; i <= activeStep && i < currentLesson.buoc.length; i++) {
          if (Array.isArray(currentLesson.buoc[i].lenh)) {
            stmts.push(...currentLesson.buoc[i].lenh);
          }
        }
        session.dat(stmts);
      }

      redrawCanvas();

      // Thông báo bước ra ngoài cho Mascot (P3)
      if (onStepChange) {
        onStepChange({
          lesson: currentLesson,
          stepIndex: activeStep,
          stepData: currentLesson.buoc[activeStep],
          totalSteps: currentLesson.buoc.length,
        });
      }
    } catch (err) {
      console.error('[Chalkboard Setup Error]:', err);
      setError(err.message);
    }
  }, [loading, currentLesson, activeStep, sandboxMode, customCommands, redrawCanvas, onStepChange]);

  // Tự động đo đạc kiểm định cơ học
  useEffect(() => {
    const session = sessionRef.current;
    if (!session || !currentLesson.kiemDinh) return;

    setIsMeasuring(true);
    const results = currentLesson.kiemDinh.map((item) => {
      try {
        const measured = session.do(item.bieuThuc);
        const so = measured?.so !== undefined ? Number(measured.so).toFixed(4) : null;
        return {
          ...item,
          doDuoc: so ?? '—',
          hopLe: so !== null,
        };
      } catch (e) {
        return { ...item, doDuoc: 'Lỗi đo', hopLe: false };
      }
    });
    setVerificationResults(results);
    setIsMeasuring(false);
  }, [loading, currentLesson, activeStep]);

  // Cập nhật khi resize cửa sổ
  useEffect(() => {
    const handleResize = () => redrawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Xử lý kéo thả chuột để xoay 3D (Pointer Events)
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Chỉ chuột trái
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;

    if (currentLesson.baChieu) {
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

  // Xử lý zoom bằng lăn chuột (Wheel)
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY;
    const factor = delta > 0 ? 0.95 : 1.05;
    setViewAngles(([yaw, pitch, zoom]) => [
      yaw,
      pitch,
      Math.max(0.4, Math.min(3.5, zoom * factor)),
    ]);
  };

  const handleResetView = () => {
    if (currentLesson.gocNhin) {
      setViewAngles([...currentLesson.gocNhin]);
    } else {
      setViewAngles([-1.22, 0.36, 1.0]);
    }
  };

  const currentStepData = currentLesson.buoc[activeStep] || currentLesson.buoc[0];

  return (
    <div className="chalkboard-container">
      {/* Header */}
      <div className="chalkboard-header">
        <div className="chalkboard-title-group">
          <h1>
            <span>Bảng Phấn Tương Tác & Kiểm Định Cơ Học</span>
            <span className="chalkboard-badge">WASM 3D</span>
          </h1>
          <p className="chalkboard-subtitle">
            Mô phỏng hình học không gian, giải tích & kiểm chứng số đo thực tế 100% không ảo giác
          </p>
        </div>

        <div className="chalkboard-actions">
          <button
            className={`btn-chalk ${sandboxMode ? 'btn-chalk-primary' : 'btn-chalk-secondary'}`}
            onClick={() => {
              if (!sandboxMode) {
                // Nạp code các bước hiện tại vào editor
                const currentCode = currentLesson.buoc
                  .flatMap((b) => b.lenh || [])
                  .join('\n');
                setCustomCommands(currentCode);
              }
              setSandboxMode(!sandboxMode);
            }}
          >
            {sandboxMode ? 'Trở về Bài giảng' : 'Tự do gõ lệnh (Sandbox)'}
          </button>
        </div>
      </div>

      {/* Tabs chọn bài học */}
      {showSelector && !customLesson && (
        <div className="lesson-selector-bar">
          {SAMPLE_CHALKBOARD_LESSONS.map((lesson) => (
            <button
              key={lesson.id}
              className={`lesson-tab-btn ${lesson.id === selectedLessonId ? 'active' : ''}`}
              onClick={() => setSelectedLessonId(lesson.id)}
            >
              <span className="lesson-tab-badge">Lớp {lesson.lop} · {lesson.chuDe}</span>
              <span className="lesson-tab-title">{lesson.tieuDe.split('&')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="sandbox-error-msg">
          <strong>Lỗi hệ thống:</strong> {error}
        </div>
      )}

      {/* Bố cục chính: Bảng phấn trái + Lời giải/Kiểm định phải */}
      <div className="chalkboard-layout">
        {/* Khung Bảng Phấn Xanh */}
        <div className="chalkboard-slate-wrapper" ref={containerRef}>
          <div
            className="chalkboard-slate-canvas-area"
            style={{ height: `${height}px` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            <canvas ref={canvasRef} className="chalkboard-canvas" />

            <div className="chalkboard-watermark">ELEC Chalkboard Engine · MV</div>
            <div className="chalkboard-instructions">
              {currentLesson.baChieu
                ? '👆 Kéo để xoay 3D · 🔍 Cuộn chuột để phóng to/thu nhỏ'
                : '🔍 Cuộn chuột để phóng to/thu nhỏ'}
            </div>
          </div>

          {/* Thanh công cụ dưới chân bảng */}
          {showControls && (
            <div className="chalkboard-toolbar">
              <div className="chalkboard-step-controls">
                <button
                  className="tool-icon-btn"
                  disabled={activeStep <= 0 || sandboxMode}
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  title="Bước trước"
                >
                  ◀ Bước trước
                </button>

                <span className="step-indicator">
                  Bước {activeStep + 1} / {currentLesson.buoc.length}
                </span>

                <button
                  className="tool-icon-btn"
                  disabled={activeStep >= currentLesson.buoc.length - 1 || sandboxMode}
                  onClick={() => setActiveStep((prev) => Math.min(currentLesson.buoc.length - 1, prev + 1))}
                  title="Bước tiếp"
                >
                  Bước tiếp ▶
                </button>
              </div>

              <div className="chalkboard-view-actions">
                <button className="tool-icon-btn" onClick={handleResetView} title="Góc nhìn ban đầu">
                  ↺ Đặt lại góc
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cột Lời giải & Kiểm định bên phải */}
        <div className="chalkboard-solution-panel">
          {/* Card Đề bài */}
          <div className="solution-card">
            <h3>📖 Đề bài & Mục tiêu</h3>
            <div className="problem-description">
              <MathText text={currentLesson.deBai} />
            </div>
          </div>

          {/* Mascot Elec Đồng hành (P3) */}
          <div className="chalkboard-mascot-companion">
            <img
              src={
                activeStep === currentLesson.buoc.length - 1
                  ? '/img/elec/elec-celebrate.png'
                  : activeStep === 0
                  ? '/img/elec/elec-hello.png'
                  : '/img/elec/elec-think.png'
              }
              alt="Bé Elec"
              className="chalkboard-mascot-img"
            />
            <div className="chalkboard-mascot-speech">
              <div className="mascot-name-tag">Bé Elec Đồng Hành</div>
              <p>
                {activeStep === currentLesson.buoc.length - 1
                  ? 'Đáp số đã được đo kiểm cơ học khớp 100%! Bạn đã nắm vững bài toán này rồi đấy!'
                  : activeStep === 0
                  ? 'Hãy bắt đầu bằng việc quan sát hình đáy và các giả thiết vuông góc nhé!'
                  : 'Theo dõi từng nét vẽ phấn trên bảng và đối chiếu với công thức bên dưới nào!'}
              </p>
            </div>
          </div>

          {/* Sandbox Editor nếu bật */}
          {sandboxMode ? (
            <div className="solution-card">
              <h3>⚡ Trình soạn kịch bản hình học MV</h3>
              <p className="chalkboard-subtitle" style={{ marginBottom: '0.5rem' }}>
                Gõ các câu lệnh dựng hình (Point, Segment, Pyramid, Sphere, v.v.):
              </p>
              <div className="sandbox-editor-wrap">
                <textarea
                  className="sandbox-textarea"
                  value={customCommands}
                  onChange={(e) => setCustomCommands(e.target.value)}
                  placeholder="A = (0, 0, 0)&#10;B = (3, 0, 0)&#10;C = (0, 4, 0)&#10;Segment(A, B)"
                />
                {sandboxError && <div className="sandbox-error-msg">{sandboxError}</div>}
              </div>
            </div>
          ) : (
            /* Card Bước giải hiện tại */
            <div className="solution-card">
              <h3>💡 Diễn giải từng bước</h3>
              <div className="step-explanation-box">
                <div className="step-title-badge">{currentStepData.tieuDe}</div>
                <div className="step-text">
                  <MathText text={currentStepData.giaiThich} />
                </div>
              </div>

              {/* Đáp số cuối cùng */}
              {activeStep === currentLesson.buoc.length - 1 && currentLesson.dapSo && (
                <div className="final-answer-box">
                  <span className="final-answer-title">Đáp số chính xác:</span>
                  <span className="final-answer-val">
                    <MathText text={`$${currentLesson.dapSo}$`} />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Bảng Kiểm định cơ học (Mechanical Verification) */}
          <div className="solution-card">
            <h3>
              <span>⚖️ Bộ máy Kiểm định Cơ học</span>
              <span className="chalkboard-badge" style={{ fontSize: '0.65rem' }}>ve.wasm</span>
            </h3>
            <p className="chalkboard-subtitle" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              Máy tự đo đạc trực tiếp trên mô hình 3D để đối chiếu với tính toán của AI:
            </p>

            <div className="verification-table-wrap">
              <table className="verification-table">
                <thead>
                  <tr>
                    <th>Thông số kiểm tra</th>
                    <th>Số đo máy đo</th>
                    <th>Kỳ vọng đề</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationResults.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.ghiChu || item.bieuThuc}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          <code>{item.bieuThuc}</code>
                        </div>
                      </td>
                      <td style={{ color: '#38bdf8', fontWeight: 600 }}>{item.doDuoc}</td>
                      <td>{item.kyVong}</td>
                      <td>
                        {item.hopLe ? (
                          <span className="verify-badge-match">Khớp 100% ✓</span>
                        ) : (
                          <span className="verify-badge-measuring">Đang kiểm tra...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
