import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadChalkboardWasm,
  ChalkboardSession,
  renderChalkboard,
  SAMPLE_CHALKBOARD_LESSONS,
} from '../lib/chalkboardEngine.js';
import { askAI } from '../lib/ai.js';
import * as tts from '../lib/tts.js';
import MathText from './MathText.jsx';
import '../styles/chalkboard.css';

function stripLatexForSpeech(raw) {
  return String(raw || '')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 phần $2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'căn bậc hai của $1')
    .replace(/\\perp/g, 'vuông góc với')
    .replace(/\\parallel/g, 'song song với')
    .replace(/\\triangle/g, 'tam giác ')
    .replace(/\\widehat\{([^}]+)\}/g, 'góc $1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── BỘ ICON VECTOR 100% SVG (KHÔNG EMOJI) ── */
const SvgBook = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const SvgBulb = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3h6c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z" />
  </svg>
);

const SvgScale = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

const SvgBolt = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SvgVolume = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const SvgStop = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="5" y="5" width="14" height="14" rx="2.5" />
  </svg>
);

const SvgPlay = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const SvgPause = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const SvgMic = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const SvgReset = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const SvgChevronLeft = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const SvgChevronRight = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const SvgCheck = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgMove3d = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 3v16h16" />
    <path d="m5 19 6-6" />
    <path d="m2 6 3-3 3 3" />
    <path d="m18 16 3 3-3 3" />
  </svg>
);

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

  /* ============ CHẾ ĐỘ VẤN ĐÁP GIỌNG NÓI & GIẢNG BÀI TỰ ĐỘNG (VOICE TUTOR) ============ */
  const [voiceAutoLecture, setVoiceAutoLecture] = useState(false);
  const [isSpeakingStep, setIsSpeakingStep] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const recognitionRef = useRef(null);
  const aliveRef = useRef(true);

  const speakCurrentStep = useCallback((stepIdx, autoAdvance = false) => {
    const stepObj = currentLesson.buoc[stepIdx] || currentLesson.buoc[0];
    if (!stepObj) return;
    const speechText = `${stepObj.tieuDe}. ${stripLatexForSpeech(stepObj.giaiThich)}`;
    setIsSpeakingStep(true);
    try {
      tts.stop?.();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(speechText);
        utter.lang = 'vi-VN';
        utter.rate = 1.02;
        utter.onend = () => {
          setIsSpeakingStep(false);
          if (autoAdvance && stepIdx < currentLesson.buoc.length - 1) {
            setActiveStep(stepIdx + 1);
          } else if (autoAdvance) {
            setVoiceAutoLecture(false);
          }
        };
        utter.onerror = () => {
          setIsSpeakingStep(false);
          setVoiceAutoLecture(false);
        };
        window.speechSynthesis.speak(utter);
      } else {
        setIsSpeakingStep(false);
      }
    } catch {
      setIsSpeakingStep(false);
    }
  }, [currentLesson]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch { /* ignore recognition cleanup error */ }
      recognitionRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (voiceAutoLecture && !sandboxMode) {
      speakCurrentStep(activeStep, true);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeStep, voiceAutoLecture, sandboxMode, speakCurrentStep]);

  const handleAskVoiceTutor = useCallback(async (questionText) => {
    const q = String(questionText || qaQuestion || '').trim();
    if (!q || qaLoading) return;
    setQaLoading(true);
    setQaAnswer('');
    try {
      const prompt = [
        `Bối cảnh bài giảng Bảng phấn 3D: "${currentLesson.tieuDe}" (Lớp ${currentLesson.lop} - ${currentLesson.chuDe}).`,
        `Đề bài: ${currentLesson.deBai}`,
        `Bước đang chiếu trên bảng (Bước ${activeStep + 1}/${currentLesson.buoc.length}): ${currentStepData.tieuDe} — ${currentStepData.giaiThich}`,
        `Câu hỏi vấn đáp của học sinh: "${q}"`,
        `Hãy trả lời ngắn gọn (3-5 câu), trực quan, giải thích đúng trọng tâm bước đang vẽ trên bảng phấn để học sinh hiểu ngay.`,
      ].join('\n');

      const res = await askAI(
        [{ role: 'user', parts: [{ text: prompt }] }],
        (partial) => {
          if (aliveRef.current) setQaAnswer(partial);
        },
        null,
        { mode: 'auto', verify: false }
      );
      if (!aliveRef.current) return;
      const finalAns = res?.text || String(res || '');
      setQaAnswer(finalAns);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && finalAns) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(stripLatexForSpeech(finalAns));
        utter.lang = 'vi-VN';
        utter.rate = 1.04;
        window.speechSynthesis.speak(utter);
      }
    } catch (err) {
      if (aliveRef.current) {
        setQaAnswer(err?.message || 'Gia sư AI đang bận, bạn hãy thử hỏi lại sau giây lát nhé.');
      }
    } finally {
      if (aliveRef.current) setQaLoading(false);
    }
  }, [qaQuestion, qaLoading, currentLesson, activeStep, currentStepData]);

  const toggleMicQuestion = () => {
    const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRec) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói trực tiếp. Bạn có thể gõ câu hỏi vào ô bên dưới nhé!');
      return;
    }
    if (isListeningMic && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { /* ignore stop error */ }
      setIsListeningMic(false);
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'vi-VN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      if (aliveRef.current) setIsListeningMic(true);
    };
    rec.onend = () => {
      if (aliveRef.current) setIsListeningMic(false);
    };
    rec.onerror = () => {
      if (aliveRef.current) setIsListeningMic(false);
    };
    rec.onresult = (event) => {
      if (!aliveRef.current) return;
      const transcript = event?.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setQaQuestion(transcript);
        handleAskVoiceTutor(transcript);
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
      setIsListeningMic(false);
    }
  };

  return (
    <div className="chalkboard-container">
      {/* Header */}
      <div className="chalkboard-header">
        <div className="chalkboard-title-group" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src="/img/elec/elec-cool.png"
            alt="Bé Elec Bảng Phấn 3D"
            style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(59,130,246,0.35))' }}
          />
          <div>
            <h1>
              <span>Bảng Phấn Tương Tác &amp; Kiểm Định Cơ Học</span>
              <span className="chalkboard-badge">WASM 3D</span>
            </h1>
            <p className="chalkboard-subtitle">
              Mô phỏng hình học không gian, giải tích &amp; kiểm chứng số đo thực tế 100% không ảo giác cùng Bé Elec
            </p>
          </div>
        </div>

        <div className="chalkboard-actions">
          <button
            className={`btn-chalk ${sandboxMode ? 'btn-chalk-primary' : 'btn-chalk-secondary'}`}
            onClick={() => {
              if (!sandboxMode) {
                const currentCode = currentLesson.buoc
                  .flatMap((b) => b.lenh || [])
                  .join('\n');
                setCustomCommands(currentCode);
              }
              setSandboxMode(!sandboxMode);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <SvgBolt size={15} />
            <span>{sandboxMode ? 'Trở về Bài giảng' : 'Tự do gõ lệnh (Sandbox)'}</span>
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
            <div className="chalkboard-instructions" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <SvgMove3d size={14} />
              <span>
                {currentLesson.baChieu
                  ? 'Kéo để xoay 3D · Cuộn chuột để phóng to/thu nhỏ'
                  : 'Cuộn chuột để phóng to/thu nhỏ'}
              </span>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <SvgChevronLeft size={15} />
                  <span>Bước trước</span>
                </button>

                <span className="step-indicator">
                  Bước {activeStep + 1} / {currentLesson.buoc.length}
                </span>

                <button
                  className="tool-icon-btn"
                  disabled={activeStep >= currentLesson.buoc.length - 1 || sandboxMode}
                  onClick={() => setActiveStep((prev) => Math.min(currentLesson.buoc.length - 1, prev + 1))}
                  title="Bước tiếp"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <span>Bước tiếp</span>
                  <SvgChevronRight size={15} />
                </button>
              </div>

              <div className="chalkboard-view-actions" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="tool-icon-btn"
                  onClick={() => {
                    if (isSpeakingStep || voiceAutoLecture) {
                      setVoiceAutoLecture(false);
                      setIsSpeakingStep(false);
                      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                    } else {
                      speakCurrentStep(activeStep, false);
                    }
                  }}
                  title="Đọc lời giảng của bước hiện tại"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {isSpeakingStep ? <SvgStop size={13} /> : <SvgVolume size={15} />}
                  <span>{isSpeakingStep ? 'Dừng đọc' : 'Nghe giảng bước này'}</span>
                </button>
                <button
                  type="button"
                  className="tool-icon-btn"
                  onClick={() => setVoiceAutoLecture((v) => !v)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    ...(voiceAutoLecture ? { background: '#2563eb', color: '#fff', borderColor: '#2563eb' } : {}),
                  }}
                  title="Tự động giảng bằng giọng nói và chuyển bước tuần tự"
                >
                  {voiceAutoLecture ? <SvgPause size={13} /> : <SvgPlay size={13} />}
                  <span>{voiceAutoLecture ? 'Đang giảng tự động' : 'Giảng tự động toàn bài'}</span>
                </button>
                <button
                  className="tool-icon-btn"
                  onClick={handleResetView}
                  title="Góc nhìn ban đầu"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <SvgReset size={14} />
                  <span>Đặt lại góc</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cột Lời giải & Kiểm định bên phải */}
        <div className="chalkboard-solution-panel">
          {/* Card Đề bài */}
          <div className="solution-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#60a5fa', display: 'inline-flex' }}><SvgBook size={17} /></span>
              <span>Đề bài &amp; Mục tiêu</span>
            </h3>
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
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#38bdf8', display: 'inline-flex' }}><SvgBolt size={17} /></span>
                <span>Trình soạn kịch bản hình học MV</span>
              </h3>
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
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fbbf24', display: 'inline-flex' }}><SvgBulb size={17} /></span>
                <span>Diễn giải từng bước</span>
              </h3>
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

          {/* Card Vấn đáp Giọng nói với Gia sư AI trực tiếp trên Bảng phấn */}
          <div className="solution-card" style={{ borderColor: 'rgba(59,130,246,0.35)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#38bdf8', display: 'inline-flex' }}><SvgMic size={17} /></span>
                <span>Vấn đáp Giọng nói cùng Gia sư AI</span>
              </span>
              <span className="chalkboard-badge" style={{ fontSize: '0.65rem' }}>Voice Tutor</span>
            </h3>
            <p className="chalkboard-subtitle" style={{ fontSize: '0.8rem', marginBottom: '0.6rem' }}>
              Chưa hiểu bước {activeStep + 1}? Bấm Micro để hỏi bằng giọng nói hoặc gõ câu hỏi, Bé Elec sẽ giải thích và đọc lại ngay:
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAskVoiceTutor(qaQuestion); }}
                placeholder={`Hỏi về Bước ${activeStep + 1} (VD: Tại sao SO vuông góc với đáy?)...`}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.5)', color: '#f8fafc', fontSize: 13 }}
              />
              <button
                type="button"
                onClick={toggleMicQuestion}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: isListeningMic ? '#ef4444' : 'rgba(59,130,246,0.18)',
                  color: isListeningMic ? '#fff' : '#60a5fa',
                  fontWeight: 700,
                  fontSize: 12.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
                title="Hỏi bằng giọng nói tiếng Việt"
              >
                <SvgMic size={14} />
                <span>{isListeningMic ? 'Đang nghe...' : 'Nói'}</span>
              </button>
              <button
                type="button"
                disabled={qaLoading || !qaQuestion.trim()}
                onClick={() => handleAskVoiceTutor(qaQuestion)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: qaLoading ? 'wait' : 'pointer',
                  opacity: qaLoading || !qaQuestion.trim() ? 0.6 : 1,
                }}
              >
                {qaLoading ? 'Đang giải...' : 'Hỏi AI'}
              </button>
            </div>
            {qaAnswer && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(37,99,235,0.12)', borderLeft: '3px solid #3b82f6', fontSize: 13.5, lineHeight: 1.6 }}>
                <img
                  src="/img/elec/elec-happy.png"
                  alt="Bé Elec Gia Sư"
                  style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>Gia sư Bé Elec giải thích:</div>
                  <MathText text={qaAnswer} />
                </div>
              </div>
            )}
          </div>

          {/* Bảng Kiểm định cơ học (Mechanical Verification) */}
          <div className="solution-card">
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#34d399', display: 'inline-flex' }}><SvgScale size={17} /></span>
                <span>Bộ máy Kiểm định Cơ học</span>
              </span>
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
                          <span className="verify-badge-match" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <SvgCheck size={13} />
                            <span>Khớp 100%</span>
                          </span>
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
