/* ============================================================
   InteractiveChalkboardCanvas.jsx — Bảng Vẽ Hình Học Tương Tác ELEC AI
   ------------------------------------------------------------
   Chuẩn giao diện Google Gemini Canvas & Apple Glassmorphism:
     1. Khung hiển thị hình vẽ hình học / hàm số tương tác 3D
     2. Diễn hoạt luỹ tiến mượt mà 60fps "Giải đến đâu vẽ tới đó"
     3. Đa AI Engine: Gemini 2.5 Pro, Claude 3.5 Sonnet, GPT-4o, DeepSeek-R1
     4. 100% Icon Vector SVG sắc nét, không dùng Emoji thô sơ
     5. Công cụ nâng cao: Thước đo & Góc tương tác, Xuất ảnh HD, Điều tốc (0.5x, 1x, 2x)
   ============================================================ */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  loadChalkboardWasm,
  ChalkboardSession,
  renderChalkboard,
  exportCanvasImage,
} from '../lib/chalkboardEngine.js';
import MathText from './MathText.jsx';
import { MarkdownLike } from './ChatMarkdown.jsx';
import { findRelatedYouTubeVideos } from '../lib/youtubeService.js';
import { YouTubeVideoSection } from './YouTubeVideoSection.jsx';
import '../styles/interactive-chalkboard.css';

/* ================= ICON VECTOR SVG 100% NÉT MẢNH CHUẨN ELEC AI ================= */
const IconCompass = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="2" />
    <path d="m3 21 8.02-14.26" />
    <path d="m21 21-8.02-14.26" />
    <path d="M6 16h12" />
  </svg>
);

const IconClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const IconShare = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IconExpand = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const IconRotate = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const IconPlay = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconPause = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const IconDownload = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconRuler = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21 21 3" />
    <path d="m14 4 1 1" />
    <path d="m11 7 2 2" />
    <path d="m8 10 1 1" />
    <path d="m5 13 2 2" />
  </svg>
);

const IconGrid = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
);

const IconPalette = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="13.5" cy="6.5" r=".8" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".8" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".8" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".8" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
  </svg>
);

const IconBot = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

const IconSpeed = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 14 4-4" />
    <path d="M3.34 19a10 10 0 1 1 17.32 0" />
  </svg>
);

const IconSparkles = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

const IconRefresh = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

const IconCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Icon3D = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconOrbit = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-30 12 12)" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * Khử triệt để tiền tố "Bước X:" nếu tiêu đề đã chứa sẵn để tránh lỗi hiển thị lặp "Bước 3: Bước 3:"
 */
const cleanStepTitle = (title) => {
  let res = String(title || '').trim();
  while (/^Bước\s*\d+[:.\s\-]*/i.test(res)) {
    res = res.replace(/^Bước\s*\d+[:.\s\-]*/i, '').trim();
  }
  return res;
};

const cleanHeaderTitle = (title) => {
  if (!title) return '';
  let res = String(title).replace(/^#+\s*/, '').replace(/\s*\.\.\.\s*$/, '').trim();
  // Khử các đoạn tọa độ thô ráp nếu có trong tiêu đề (ví dụ: A(-2,-2)...)
  res = res.replace(/:\s*[A-Za-z]\([^)]+\)[^.\n]*/, '').trim();
  if (/^Tính\s+toạ\s+độ\s+K/i.test(res)) {
    return 'Mô phỏng: Hình chóp S.ABC & Thiết diện';
  }
  return res;
};

/* ================= DANH SÁCH CÁC AI MODEL HỖ TRỢ VẼ HÌNH ================= */
const AI_ENGINES = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'Google DeepMind', desc: 'Chuyên gia Không gian & Tọa độ Oxyz' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', badge: 'Anthropic', desc: 'Kiến trúc sư Hình phẳng & Quang học' },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o', badge: 'OpenAI', desc: 'Bậc thầy Điện xoay chiều RLC & Cơ học' },
  { id: 'deepseek-r1', name: 'DeepSeek-R1', badge: 'DeepSeek AI', desc: 'Suy luận logic sâu & Thẩm định thước đo' },
  { id: 'auto-multi', name: 'Đa AI Luân phiên', badge: 'ELEC AI Ensemble', desc: 'Tự động chọn AI tối ưu theo từng bài' },
];

export default function InteractiveChalkboardCanvas({
  lesson,
  onClose,
  initialAutoPlay = true,
}) {
  const steps = useMemo(() => lesson?.buoc || [], [lesson]);
  const totalSteps = steps.length || 1;

  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(initialAutoPlay);
  const [viewAngles, setViewAngles] = useState(lesson?.gocNhin || [-1.22, 0.36, 1.0]);
  const [loadingWasm, setLoadingWasm] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Nhận biết dark mode hiện tại của ELEC AI
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const [useChalkTheme, setUseChalkTheme] = useState(isDarkMode);
  const [showGrid, setShowGrid] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Tốc độ diễn hoạt (0.5x, 1x, 2x)
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [animProgress, setAnimProgress] = useState(1.0);

  // Mô hình AI đang phụ trách vẽ
  const [selectedAi, setSelectedAi] = useState('gemini-2.5-pro');
  const [showAiPicker, setShowAiPicker] = useState(false);

  // Chế độ Thước đo tương tác (Interactive Measure Tool)
  const [measureMode, setMeasureMode] = useState(false);
  const [measuredPoints, setMeasuredPoints] = useState([]);
  const [measureResult, setMeasureResult] = useState(null);

  // Chế độ Không gian 3D (ưu tiên nhận diện từ bài toán, hỗ trợ chuyển đổi thủ công)
  const [override3D, setOverride3D] = useState(null);
  const is3D = override3D !== null ? override3D : (lesson?.baChieu !== false);

  // Chế độ Xoay 3D Tự Động (Auto-Orbit 360°) & Soi tọa độ điểm
  const [isAutoOrbit, setIsAutoOrbit] = useState(false);
  const [hoveredPointInfo, setHoveredPointInfo] = useState(null);

  // Danh sách video bài giảng YouTube liên quan được tìm kiếm tự động
  const relatedVideos = useMemo(() => {
    const queryText = `${lesson?.chuDe || ''} ${lesson?.tieuDe || ''} ${lesson?.deBai || ''}`;
    return findRelatedYouTubeVideos(queryText, 3);
  }, [lesson]);

  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const wasmEngineRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0 });
  const contentBodyRef = useRef(null);
  const animReqRef = useRef(null);
  const lastElementsRef = useRef([]);

  const curStep = steps[activeStep] || steps[0];
  const curAi = AI_ENGINES.find((m) => m.id === selectedAi) || AI_ENGINES[0];

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
      if (animReqRef.current) cancelAnimationFrame(animReqRef.current);
    };
  }, []);

  // Vòng lặp xoay 3D tự động liên tục 360° (Auto-Orbit Loop)
  useEffect(() => {
    if (!isAutoOrbit || !is3D) return;
    let frameId;
    const tick = () => {
      setViewAngles(([yaw, pitch, zoom]) => [(yaw + 0.007) % (Math.PI * 2), pitch, zoom]);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isAutoOrbit, is3D]);

  // 2. Diễn hoạt nét vẽ từng nét mượt mà (Smooth Progressive Stroke Animation)
  const triggerStrokeAnimation = useCallback(() => {
    if (animReqRef.current) cancelAnimationFrame(animReqRef.current);
    const duration = 750 / playbackSpeed;
    const startTime = performance.now();

    const frame = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1.0, elapsed / duration);
      // easeOutCubic
      const p = 1 - Math.pow(1 - t, 3);
      setAnimProgress(p);

      if (t < 1.0) {
        animReqRef.current = requestAnimationFrame(frame);
      } else {
        setAnimProgress(1.0);
        animReqRef.current = null;
      }
    };
    animReqRef.current = requestAnimationFrame(frame);
  }, [playbackSpeed]);

  // Kích hoạt diễn hoạt mượt mỗi khi chuyển bước
  useEffect(() => {
    triggerStrokeAnimation();
  }, [activeStep, triggerStrokeAnimation]);

  // 3. Chế độ Tự động vẽ luỹ tiến: "Giải đến đâu vẽ tới đó"
  useEffect(() => {
    if (!autoPlay || loadingWasm) return;

    if (activeStep < totalSteps - 1) {
      const timer = setTimeout(() => {
        setActiveStep((prev) => prev + 1);
      }, 3500 / playbackSpeed);
      return () => clearTimeout(timer);
    } else {
      setAutoPlay(false);
    }
  }, [autoPlay, activeStep, totalSteps, loadingWasm, playbackSpeed]);

  // Cuộn nhẹ lên trên khi đổi bước
  useEffect(() => {
    if (contentBodyRef.current) {
      contentBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStep]);

  // 4. Hàm vẽ hình lên Canvas với độ phân giải cao và diễn hoạt mượt
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const session = sessionRef.current;
    if (!canvas || !session) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || (isExpanded ? 420 : 330);
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
        lastElementsRef.current = res.m;
        renderChalkboard(ctx, res.m, {
          chalkStyle: useChalkTheme,
          paperTheme: !useChalkTheme,
          showLabels: true,
          showGrid,
          progress: animProgress,
        });

        // Vẽ đường thước đo nếu đang trong chế độ đo đạc
        if (measureMode && measuredPoints.length > 0) {
          ctx.save();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          measuredPoints.forEach((pt, i) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            if (i > 0) {
              ctx.beginPath();
              ctx.moveTo(measuredPoints[i - 1].x, measuredPoints[i - 1].y);
              ctx.lineTo(pt.x, pt.y);
              ctx.stroke();
            }
          });
          ctx.restore();
        }
      }
    } catch (e) {
      console.warn('[InteractiveChalkboardCanvas Render Error]:', e);
    }
  }, [viewAngles, useChalkTheme, showGrid, isExpanded, animProgress, measureMode, measuredPoints]);

  // 5. Cập nhật câu lệnh vẽ tích luỹ từ bước 0 -> activeStep ("Giải đến đâu vẽ tới đó")
  useEffect(() => {
    const engine = wasmEngineRef.current;
    if (!engine || !lesson) return;

    if (sessionRef.current) {
      sessionRef.current.huy();
      sessionRef.current = null;
    }

    try {
      const session = new ChalkboardSession(engine, is3D, !!lesson.heTruc);
      sessionRef.current = session;

      // Thu thập câu lệnh từ bước 0 đến activeStep ("Giải đến đâu vẽ tới đó")
      const rawStmts = [];
      for (let i = 0; i <= activeStep && i < totalSteps; i++) {
        const step = steps[i];
        if (Array.isArray(step?.lenh)) {
          rawStmts.push(...step.lenh);
        }
      }

      // Khử lặp định nghĩa điểm (đảm bảo mỗi điểm A, B, C, S, G, H, P, E, I, M, K... chỉ có 1 định nghĩa tọa độ mới nhất)
      const pointDefs = new Map();
      const otherStmts = [];
      for (const line of rawStmts) {
        const trimmed = String(line || '').trim();
        if (!trimmed) continue;
        const ptMatch = trimmed.match(/^([A-Za-z0-9_']+)\s*=\s*\(([^)]+)\)/);
        if (ptMatch) {
          const ptName = ptMatch[1];
          pointDefs.set(ptName, trimmed);
        } else {
          otherStmts.push(trimmed);
        }
      }

      // Đưa định nghĩa điểm lên đầu, tiếp theo là các đoạn thẳng, đa giác
      const stmts = [...pointDefs.values(), ...otherStmts];

      session.dat(stmts);
      redraw();
    } catch (e) {
      console.error('[InteractiveChalkboardCanvas Session Error]:', e);
    }
  }, [lesson, is3D, activeStep, totalSteps, steps, redraw]);

  // Cập nhật khi kích thước cửa sổ đổi hoặc tiến trình animation đổi
  useEffect(() => {
    redraw();
  }, [redraw, animProgress]);

  useEffect(() => {
    const handleResize = () => redraw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw]);

  // 6. Xử lý chuột & Chế độ Thước đo tương tác
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;

    if (measureMode) {
      // Tìm điểm gần nhất được click
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const pts = (lastElementsRef.current || []).filter((el) => el.t === 'p' && typeof el.x === 'number');
      let nearest = null;
      let minDist = 24; // Bán kính bắt điểm

      pts.forEach((p) => {
        const d = Math.hypot(p.x - clickX, p.y - clickY);
        if (d < minDist) {
          minDist = d;
          nearest = p;
        }
      });

      const chosen = nearest || { x: clickX, y: clickY, s: `Điểm ${measuredPoints.length + 1}` };
      const next = [...measuredPoints, chosen].slice(-3);
      setMeasuredPoints(next);

      if (next.length === 2) {
        const distPx = Math.hypot(next[1].x - next[0].x, next[1].y - next[0].y);
        setMeasureResult(`Khoảng cách ước lượng: ~${(distPx / 35).toFixed(2)} đơn vị`);
      } else if (next.length === 3) {
        const a = Math.hypot(next[1].x - next[0].x, next[1].y - next[0].y);
        const b = Math.hypot(next[2].x - next[1].x, next[2].y - next[1].y);
        const c = Math.hypot(next[2].x - next[0].x, next[2].y - next[0].y);
        const cosAngle = (a * a + b * b - c * c) / (2 * a * b || 1);
        const deg = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
        setMeasureResult(`Góc giữa 3 điểm: ~${deg.toFixed(1)}°`);
      }
      return;
    }

    dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setAutoPlay(false);
    if (isAutoOrbit) setIsAutoOrbit(false);
  };

  const handlePointerMove = (e) => {
    if (dragRef.current.isDragging) {
      if (measureMode) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;

      if (is3D) {
        setViewAngles(([yaw, pitch, zoom]) => [
          yaw - dx * 0.008,
          Math.max(-1.45, Math.min(1.45, pitch + dy * 0.008)),
          zoom,
        ]);
      }
      return;
    }

    // Soi tọa độ điểm khi rê chuột qua (Point Inspector HUD)
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const pts = (lastElementsRef.current || []).filter((el) => el.t === 'p' && typeof el.x === 'number');
    let found = null;
    for (const p of pts) {
      if (Math.hypot(p.x - mouseX, p.y - mouseY) < 18) {
        found = p;
        break;
      }
    }
    if (found) {
      setHoveredPointInfo({ name: found.s || 'Điểm', x: found.x, y: found.y });
    } else {
      setHoveredPointInfo(null);
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
    setViewAngles(lesson?.gocNhin || (is3D ? [-1.22, 0.36, 1.0] : [0, 0, 1.0]));
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(
        `Bài giảng hình học ELEC AI: ${lesson?.tieuDe || 'Hình học tương tác'}\n` +
        `Lời giải: ${steps.map((s, idx) => `Bước ${idx + 1}: ${cleanStepTitle(s.tieuDe)} - ${s.giaiThich}`).join('\n')}\n` +
        `Đáp số: ${lesson?.dapSo || ''}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handleExportImage = () => {
    exportCanvasImage(
      canvasRef.current,
      `elec-ai-${(lesson?.tieuDe || 'hinh-ve').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`,
      useChalkTheme
    );
  };

  return (
    <div className="ds-quiz-canvas ds-geo-canvas-wrap" role="region" aria-label="Bảng vẽ hình học tương tác">
      {/* 1. HEADER CANVAS — CHUẨN ELEC AI GỌN GÀNG, KHÔNG RỐI MÁY MÓC */}
      <div className="ds-qc-header">
        <div className="ds-geo-header-title-box">
          <span className="ds-geo-header-compass-icon" aria-hidden="true">
            <IconCompass size={17} />
          </span>
          <h2 className="ds-qc-title" title={lesson?.tieuDe}>
            {cleanHeaderTitle(lesson?.tieuDe) || 'Mô phỏng hình học tương tác'}
          </h2>
        </div>

        <div className="ds-qc-actions">
          {/* Nút phóng to / thu gọn chiều cao khung vẽ */}
          <button
            type="button"
            className="ds-qc-btn-icon"
            onClick={() => setIsExpanded((v) => !v)}
            title={isExpanded ? 'Thu gọn chiều cao' : 'Mở rộng chiều cao'}
            aria-label="Phóng to"
          >
            <IconExpand size={15} />
          </button>

          {/* Nút xuất ảnh HD tải về máy */}
          <button
            type="button"
            className="ds-qc-btn-icon"
            onClick={handleExportImage}
            title="Tải ảnh hình vẽ HD về máy (PNG)"
            aria-label="Tải ảnh"
          >
            <IconDownload size={15} />
          </button>

          {/* Nút chia sẻ */}
          <button
            type="button"
            className="ds-qc-btn-icon"
            onClick={handleShare}
            title={copied ? 'Đã sao chép!' : 'Sao chép nội dung bài giải'}
            aria-label="Chia sẻ"
            style={{ color: copied ? '#10b981' : undefined }}
          >
            <IconShare size={15} />
          </button>

          {/* Nút đóng */}
          <button
            type="button"
            className="ds-qc-btn-icon"
            onClick={onClose}
            title="Đóng canvas và quay lại trò chuyện"
            aria-label="Đóng"
          >
            <IconClose size={18} />
          </button>
        </div>
      </div>

      {/* 2. THANH TIẾN TRÌNH THEO PHONG CÁCH TRẮC NGHIỆM ELEC AI (ẢNH 2 CỦA BẠN) */}
      <div className="ds-qc-subbar">
        <div className="ds-qc-progress-track">
          <div
            className="ds-qc-progress-fill"
            style={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="ds-qc-step-counter">
          <span>{activeStep + 1}/{totalSteps}</span>
          {autoPlay && (
            <span className="ds-qc-live-dot" title="Đang tự động vẽ">
              ● Đang vẽ...
            </span>
          )}
        </div>
      </div>

      {/* 3. NỘI DUNG CHÍNH: KHUNG CANVAS HÌNH HỌC + LỜI GIẢI TỪNG BƯỚC */}
      <div className="ds-qc-body" ref={contentBodyRef}>
        <div key={activeStep} className="ds-qc-q-fade">
          {/* KHUNG CANVAS VẼ HÌNH BẰNG VE.WASM */}
          <div className={`ds-geo-render-box ${useChalkTheme ? 'theme-chalk' : ''} ${isExpanded ? 'is-expanded' : ''} ${measureMode ? 'is-measuring' : ''}`}>
            {loadingWasm && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                Đang nạp bộ dựng hình học ve.wasm...
              </div>
            )}
            {error && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '13px', padding: '1rem' }}>
                Lỗi nạp mô-đun: {error}
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="ds-geo-canvas-el"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              title={measureMode ? 'Click 2 hoặc 3 điểm để đo khoảng cách và góc' : (lesson?.baChieu ? 'Kéo chuột để xoay 3D, cuộn để phóng to/thu nhỏ' : 'Hình vẽ tương tác')}
            />

            {/* Tag bước nổi trên canvas */}
            <div className="ds-geo-step-tag">
              Bước {activeStep + 1}: {cleanStepTitle(curStep?.tieuDe) || 'Dựng hình'}
            </div>

            {/* Thông báo kết quả Thước đo trực tiếp */}
            {measureMode && (
              <div className="ds-geo-measure-hud">
                <IconRuler size={14} />
                <span>{measureResult || 'Click 2 điểm để đo khoảng cách, 3 điểm để đo góc'}</span>
                {measuredPoints.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMeasuredPoints([]);
                      setMeasureResult(null);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontWeight: 700 }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            )}

            {/* Tooltip soi tọa độ điểm khi di chuột (Point Inspector HUD) */}
            {hoveredPointInfo && (
              <div
                className="ds-geo-point-tooltip"
                style={{
                  left: Math.max(12, Math.min(hoveredPointInfo.x + 12, (canvasRef.current?.clientWidth || 320) - 120)),
                  top: Math.max(12, hoveredPointInfo.y - 32)
                }}
              >
                <span className="ds-geo-point-tooltip-dot" />
                <span className="ds-geo-point-tooltip-text">Điểm <strong>{hoveredPointInfo.name}</strong></span>
              </div>
            )}

            {/* Thanh điều khiển nổi góc dưới (100% SVG ICONS) */}
            <div className="ds-geo-floating-bar">
              {/* Cụm Phóng to / Thu nhỏ */}
              <div className="ds-geo-fbtn-group" title="Phóng to / Thu nhỏ">
                <button
                  type="button"
                  onClick={() => {
                    setAutoPlay(false);
                    setViewAngles(([y, p, z]) => [y, p, Math.min(3.5, z * 1.22)]);
                  }}
                  title="Phóng to"
                  aria-label="Phóng to"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAutoPlay(false);
                    setViewAngles(([y, p, z]) => [y, p, Math.max(0.35, z * 0.82)]);
                  }}
                  title="Thu nhỏ"
                  aria-label="Thu nhỏ"
                >
                  −
                </button>
              </div>

              {/* Bật / Tắt Thước đo tương tác */}
              <button
                type="button"
                className={`ds-geo-fbtn ${measureMode ? 'is-active' : ''}`}
                onClick={() => {
                  setMeasureMode((v) => !v);
                  setMeasuredPoints([]);
                  setMeasureResult(null);
                }}
                title="Bật thước đo tương tác khoảng cách & góc giữa các điểm"
              >
                <IconRuler size={13} />
                <span>Thước đo</span>
              </button>

              {/* Bật / Tắt Lưới tọa độ */}
              <button
                type="button"
                className={`ds-geo-fbtn ${showGrid ? 'is-active' : ''}`}
                onClick={() => setShowGrid((v) => !v)}
                title="Bật/tắt lưới tọa độ toán học"
              >
                <IconGrid size={13} />
                <span>Lưới</span>
              </button>

              {/* Chuyển nền Giấy / Bảng */}
              <button
                type="button"
                className="ds-geo-fbtn"
                onClick={() => setUseChalkTheme((v) => !v)}
                title="Đổi màu nền Giấy trắng / Bảng phấn"
              >
                <IconPalette size={13} />
                <span>{useChalkTheme ? 'Nền giấy' : 'Bảng phấn'}</span>
              </button>

              {/* Nút vẽ lại bước hiện tại */}
              <button
                type="button"
                className="ds-geo-fbtn"
                onClick={triggerStrokeAnimation}
                title="Vẽ lại bước này từng nét"
              >
                <IconRefresh size={13} />
                <span>Vẽ lại</span>
              </button>

              {/* Đặt lại góc nhìn */}
              <button
                type="button"
                className="ds-geo-fbtn"
                onClick={resetView}
                title="Đặt lại góc nhìn và tỉ lệ ban đầu"
              >
                <IconRotate size={13} />
                <span>Góc nhìn</span>
              </button>

              {/* Chế độ Tự động Xoay 360° (Auto-Orbit) cho Không gian 3D */}
              {is3D && (
                <button
                  type="button"
                  className={`ds-geo-fbtn ${isAutoOrbit ? 'is-active' : ''}`}
                  onClick={() => setIsAutoOrbit((v) => !v)}
                  title={isAutoOrbit ? 'Dừng xoay 360° tự động' : 'Bật xoay 360° tự động toàn cảnh'}
                >
                  <IconOrbit size={13} />
                  <span>{isAutoOrbit ? 'Dừng xoay' : 'Xoay 360°'}</span>
                </button>
              )}

              {/* Chế độ Không gian 3D / Mặt phẳng 2D */}
              <button
                type="button"
                className={`ds-geo-fbtn ${is3D ? 'is-active' : ''}`}
                onClick={() => {
                  const next3D = !is3D;
                  setOverride3D(next3D);
                  setViewAngles(next3D ? [-1.22, 0.36, 1.0] : [0, 0, 1.0]);
                }}
                title={is3D ? 'Đang ở chế độ Không gian 3D (Click để chuyển 2D)' : 'Đang ở chế độ 2D (Click để chuyển 3D)'}
              >
                <Icon3D size={13} />
                <span>{is3D ? '3D' : '2D'}</span>
              </button>
            </div>
          </div>

          {/* LỜI GIẢI TOÁN & HƯỚNG DẪN TỪNG BƯỚC VỚI KATEX */}
          <div className="ds-geo-step-content">
            <h3 className="ds-geo-step-heading">
              <span className="ds-geo-step-badge">{activeStep + 1}</span>
              <span>{cleanStepTitle(curStep?.tieuDe) || `Bước ${activeStep + 1}`}</span>
            </h3>

            <div className="ds-geo-step-desc">
              <MarkdownLike text={curStep?.giaiThich || ''} />
            </div>

            {/* KẾT LUẬN & ĐÁP SỐ KHI ĐẾN BƯỚC CUỐI CÙNG (PHONG CÁCH MĂNG NON) */}
            {activeStep === totalSteps - 1 && lesson?.dapSo && (
              <div className="ds-geo-final-box">
                <span className="ds-geo-final-badge">ĐÁP SỐ</span>
                <div className="ds-geo-final-val">
                  <MathText text={lesson.dapSo} />
                </div>
              </div>
            )}

            {/* BÉ ELEC MẸO NHỚ KHI ĐẾN BƯỚC CUỐI CÙNG */}
            {activeStep === totalSteps - 1 && lesson?.meoNho && (
              <div className="ds-geo-mascot-tip">
                <img
                  src="/elec.svg"
                  alt="Bé Elec"
                  className="ds-geo-mascot-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="ds-geo-tip-content">
                  <div className="ds-geo-tip-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconSparkles size={14} />
                    <span>BÉ ELEC LƯU Ý</span>
                  </div>
                  <p className="ds-geo-tip-text">
                    <MathText text={lesson.meoNho} />
                  </p>
                </div>
              </div>
            )}

            {/* DANH SÁCH BÀI GIẢNG VIDEO YOUTUBE LIÊN QUAN */}
            <YouTubeVideoSection videos={relatedVideos} />
          </div>
        </div>
      </div>

      {/* 4. FOOTER ĐIỀU HƯỚNG — CHUẨN 100% GIAO DIỆN ELEC AI (ẢNH 2 CỦA BẠN) */}
      <div className="ds-qc-footer">
        <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Nút Tự động vẽ */}
          <button
            type="button"
            className="ds-qc-btn secondary"
            onClick={() => setAutoPlay((v) => !v)}
            style={{ padding: '7px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {autoPlay ? <IconPause size={13} /> : <IconPlay size={13} />}
            <span>{autoPlay ? 'Tạm dừng' : 'Tự động vẽ'}</span>
          </button>

          {/* Điều chỉnh tốc độ diễn hoạt: 0.5x, 1x, 2x */}
          <button
            type="button"
            className="ds-geo-speed-btn"
            onClick={() => {
              const speeds = [0.5, 1, 2];
              const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
              setPlaybackSpeed(speeds[nextIdx]);
            }}
            title="Đổi tốc độ diễn hoạt nét vẽ (0.5x, 1x, 2x)"
          >
            <IconSpeed size={12} />
            <span>{playbackSpeed}x</span>
          </button>
        </div>

        <div className="ds-qc-footer-right">
          <button
            type="button"
            className="ds-qc-btn ghost"
            onClick={() => {
              if (activeStep > 0) {
                setActiveStep(activeStep - 1);
                setAutoPlay(false);
              }
            }}
            disabled={activeStep === 0}
          >
            Quay lại
          </button>

          {activeStep < totalSteps - 1 ? (
            <button
              type="button"
              className="ds-qc-btn solid-blue"
              onClick={() => {
                setActiveStep(activeStep + 1);
                setAutoPlay(false);
              }}
            >
              Tiếp theo
            </button>
          ) : (
            <button
              type="button"
              className="ds-qc-btn solid-blue"
              onClick={() => {
                setActiveStep(0);
                setAutoPlay(true);
              }}
            >
              Vẽ lại từ đầu
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
