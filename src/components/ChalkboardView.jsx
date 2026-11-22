import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadChalkboardWasm,
  ChalkboardSession,
  renderChalkboard,
  SAMPLE_CHALKBOARD_LESSONS,
} from '../lib/chalkboardEngine.js';
import { askAI } from '../lib/ai.js';
import * as tts from '../lib/tts.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { resolveEntitlements } from '../lib/entitlements.js';
import { runWithCredit, CREDIT_TARIFF } from '../lib/creditService.js';
import MathText from './MathText.jsx';
import '../styles/chalkboard.css';

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
  const { user, tier } = useAuth();
  const pro = useTeacherPro();
  const isVip = resolveEntitlements({ user, pro, tier }).hasVipAccess;
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

  // Cập nhật khi resize cửa sổ hoặc canvas thay đổi kích thước
  useEffect(() => {
    const handleResize = () => redrawCanvas();
    window.addEventListener('resize', handleResize);
    const el = canvasRef.current || containerRef.current;
    let observer = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => redrawCanvas());
      observer.observe(el);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
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
  const lectureTokenRef = useRef(0);

  const stopChalkboardSpeech = useCallback(() => {
    lectureTokenRef.current += 1;
    tts.stop?.();
    setIsSpeakingStep(false);
  }, []);

  const speakCurrentStep = useCallback(async (stepIdx, autoAdvance = false) => {
    const stepObj = currentLesson.buoc[stepIdx] || currentLesson.buoc[0];
    if (!stepObj) return;
    const speechText = `${stepObj.tieuDe}. ${stepObj.giaiThich || ''}`;
    const token = ++lectureTokenRef.current;
    setIsSpeakingStep(true);
    try {
      const res = await tts.speak(speechText, { rate: 1.02 });
      if (!aliveRef.current || token !== lectureTokenRef.current) return;
      setIsSpeakingStep(false);
      if (res?.canceled) return;
      if (autoAdvance && stepIdx < currentLesson.buoc.length - 1) {
        setActiveStep(stepIdx + 1);
      } else if (autoAdvance) {
        setVoiceAutoLecture(false);
      }
    } catch {
      if (!aliveRef.current || token !== lectureTokenRef.current) return;
      setIsSpeakingStep(false);
      if (autoAdvance) setVoiceAutoLecture(false);
    }
  }, [currentLesson]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      lectureTokenRef.current += 1;
      try {
        recognitionRef.current?.stop();
      } catch { /* ignore recognition cleanup error */ }
      recognitionRef.current = null;
      tts.stop?.();
    };
  }, []);

  useEffect(() => {
    if (voiceAutoLecture && !sandboxMode) {
      speakCurrentStep(activeStep, true);
    }
    return () => {
      lectureTokenRef.current += 1;
      tts.stop?.();
    };
  }, [activeStep, voiceAutoLecture, sandboxMode, speakCurrentStep]);

  const handleAskVoiceTutor = useCallback(async (questionText) => {
    if (!isVip) {
      setQaAnswer('Tính năng Vấn đáp Giọng nói cùng Gia sư AI dành riêng cho tài khoản VIP. Vui lòng nâng cấp để sử dụng.');
      return;
    }
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

      const finalAns = await runWithCredit(
        {
          userId: user?.uid,
          cost: CREDIT_TARIFF.CHAT_FAST,
          actionType: 'ai_tutor',
          reason: 'Vấn đáp AI Bảng phấn 3D',
        },
        async () => {
          const res = await askAI(
            [{ role: 'user', parts: [{ text: prompt }] }],
            (partial) => {
              if (aliveRef.current) setQaAnswer(partial);
            },
            null,
            { mode: 'auto', verify: false }
          );
          const ans = String(res?.text || (typeof res === 'string' ? res : '') || '').trim();
          if (!ans) {
            throw new Error('AI chưa trả về câu trả lời (ELEC Credit đã được hoàn trả).');
          }
          return ans;
        }
      );
      if (!aliveRef.current) return;
      setQaAnswer(finalAns);
      if (finalAns) {
        const speakToken = ++lectureTokenRef.current;
        setIsSpeakingStep(true);
        tts.speak(finalAns, { rate: 1.04 })
          .catch(() => {})
          .finally(() => {
            if (aliveRef.current && lectureTokenRef.current === speakToken) {
              setIsSpeakingStep(false);
            }
          });
      }
    } catch (err) {
      if (aliveRef.current) {
        setQaAnswer(err?.message || 'Gia sư AI đang bận, bạn hãy thử hỏi lại sau giây lát nhé.');
      }
    } finally {
      if (aliveRef.current) setQaLoading(false);
    }
  }, [isVip, qaQuestion, qaLoading, currentLesson, activeStep, currentStepData]);

  const toggleMicQuestion = () => {
    if (!isVip) {
      setQaAnswer('Tính năng Vấn đáp Giọng nói cùng Gia sư AI dành riêng cho tài khoản VIP. Vui lòng nâng cấp để sử dụng.');
      return;
    }
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
        <div className="chalkboard-title-group">
          <img
            src="/img/elec/elec-cool.png"
            alt="Bé Elec Bảng Phấn 3D"
            className="chalkboard-hero-mascot"
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
            style={height !== 520 ? { '--cb-canvas-h': `${height}px` } : undefined}
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

              <div className="chalkboard-view-actions">
                <button
                  type="button"
                  className={`tool-icon-btn ${isSpeakingStep ? 'is-speaking' : ''}`}
                  onClick={() => {
                    if (isSpeakingStep || voiceAutoLecture) {
                      setVoiceAutoLecture(false);
                      stopChalkboardSpeech();
                    } else {
                      speakCurrentStep(activeStep, false);
                    }
                  }}
                  title="Đọc lời giảng bước hiện tại bằng giọng Tiếng Việt"
                >
                  {isSpeakingStep ? <SvgStop size={13} /> : <SvgVolume size={15} />}
                  <span>{isSpeakingStep ? 'Dừng đọc' : 'Nghe giảng bước này'}</span>
                </button>
                <button
                  type="button"
                  className={`tool-icon-btn ${voiceAutoLecture ? 'is-active' : ''}`}
                  onClick={() => setVoiceAutoLecture((v) => !v)}
                  title="Tự động giảng bằng giọng Tiếng Việt và chuyển bước tuần tự"
                >
                  {voiceAutoLecture ? <SvgPause size={13} /> : <SvgPlay size={13} />}
                  <span>{voiceAutoLecture ? 'Đang giảng tự động' : 'Giảng tự động toàn bài'}</span>
                </button>
                <button
                  className="tool-icon-btn"
                  onClick={handleResetView}
                  title="Góc nhìn ban đầu"
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
            <h3>
              <span className="solution-card-title">
                <span style={{ color: '#059669', display: 'inline-flex' }}><SvgBook size={17} /></span>
                <span>Đề bài &amp; Mục tiêu</span>
              </span>
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
              <h3>
                <span className="solution-card-title">
                  <span style={{ color: '#0284c7', display: 'inline-flex' }}><SvgBolt size={17} /></span>
                  <span>Trình soạn kịch bản hình học MV</span>
                </span>
              </h3>
              <p className="solution-card-hint">
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
              <h3>
                <span className="solution-card-title">
                  <span style={{ color: '#f59e0b', display: 'inline-flex' }}><SvgBulb size={17} /></span>
                  <span>Diễn giải từng bước</span>
                </span>
                <div className="step-pills-row" role="tablist" aria-label="Chọn bước giải">
                  {currentLesson.buoc.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`step-pill-dot ${idx === activeStep ? 'active' : ''}`}
                      onClick={() => setActiveStep(idx)}
                      title={`Xem Bước ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
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
          <div className="solution-card voice-tutor-card">
            <h3>
              <span className="solution-card-title">
                <span style={{ color: '#2563eb', display: 'inline-flex' }}><SvgMic size={17} /></span>
                <span>Vấn đáp Giọng nói cùng Gia sư AI</span>
              </span>
              <span className="chalkboard-badge">{isVip ? 'Giọng Việt AI' : 'VIP'}</span>
            </h3>
            {isVip ? (
              <>
                <p className="solution-card-hint">
                  Chưa hiểu bước {activeStep + 1}? Bấm Micro để hỏi bằng giọng nói hoặc gõ câu hỏi, Bé Elec sẽ giải thích và đọc lại ngay:
                </p>
                <div className="voice-tutor-row">
                  <input
                    type="text"
                    className="voice-tutor-input"
                    value={qaQuestion}
                    onChange={(e) => setQaQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAskVoiceTutor(qaQuestion); }}
                    placeholder={`Hỏi về Bước ${activeStep + 1} (VD: Tại sao SO vuông góc với đáy?)...`}
                  />
                  <button
                    type="button"
                    className={`voice-tutor-mic-btn ${isListeningMic ? 'is-listening' : ''}`}
                    onClick={toggleMicQuestion}
                    title="Hỏi bằng giọng nói Tiếng Việt"
                  >
                    <SvgMic size={14} />
                    <span>{isListeningMic ? 'Đang nghe...' : 'Nói'}</span>
                  </button>
                  <button
                    type="button"
                    className="voice-tutor-ask-btn"
                    disabled={qaLoading || !qaQuestion.trim()}
                    onClick={() => handleAskVoiceTutor(qaQuestion)}
                  >
                    {qaLoading ? 'Đang giải...' : 'Hỏi AI'}
                  </button>
                </div>
                {qaAnswer && (
                  <div className="voice-tutor-answer">
                    <img
                      src="/img/elec/elec-happy.png"
                      alt="Bé Elec Gia Sư"
                      style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="voice-tutor-answer-head">Gia sư Bé Elec giải thích:</div>
                      <MathText text={qaAnswer} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <p className="solution-card-hint" style={{ margin: 0, flex: '1 1 220px' }}>
                  Mô hình 3D &amp; lời giải từng bước miễn phí trọn đời. Nâng cấp tài khoản <b>VIP</b> để hỏi bài trực tiếp bằng giọng nói cùng Gia sư Bé Elec.
                </p>
                <a className="voice-tutor-ask-btn" href="#profile?tab=vip" style={{ textDecoration: 'none' }}>
                  Nâng cấp VIP
                </a>
              </div>
            )}
          </div>

          {/* Bảng Kiểm định cơ học (Mechanical Verification) */}
          <div className="solution-card">
            <h3>
              <span className="solution-card-title">
                <span style={{ color: '#059669', display: 'inline-flex' }}><SvgScale size={17} /></span>
                <span>Bộ máy Kiểm định Cơ học</span>
              </span>
              <span className="chalkboard-badge">ve.wasm</span>
            </h3>
            <p className="solution-card-hint">
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
                        <div className="verify-expr-code">
                          <code>{item.bieuThuc}</code>
                        </div>
                      </td>
                      <td className="verify-measured-val">{item.doDuoc}</td>
                      <td>{item.kyVong}</td>
                      <td>
                        {item.hopLe ? (
                          <span className="verify-badge-match">
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
