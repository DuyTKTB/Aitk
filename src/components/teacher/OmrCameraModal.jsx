/* ============================================================
   OmrCameraModal.jsx — Camera Chấm Phiếu A4 Pro Studio (v2 High-Accuracy)
   ------------------------------------------------------------
   Nâng cấp chuẩn ứng dụng chuyên nghiệp (ZipGrade · TNMaker · EvalBee):
   - Quét đa khung 3× (Multi-Frame Burst Consensus): chụp nhanh 3 khung &
     hợp nhất trung vị từng ô tô → triệt tiêu lỗi rung tay / chớp sáng.
   - Ngưỡng thích ứng theo tờ phiếu + 3 mức độ nhạy (Chì 2B nhạt · Chuẩn · Giấy nhiễu).
   - Phản hồi AR trực tiếp: vẽ vòng Xanh (Đúng) / Đỏ (Sai) ngay trên từng ô vừa chấm.
   - Cảm biến chất lượng thời gian thực: Độ nét · Độ nghiêng · Khoảng cách · Ánh sáng.
   - Chạm lấy nét (Tap-to-Focus) + chụm 2 ngón phóng to (Pinch-to-Zoom) trên điện thoại.
   - Âm báo Bíp chuẩn Web Audio + rung Haptic + cảnh báo trùng SBD tức thì.
   ============================================================ */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fitHomography,
  mergeBurstReads,
  probeSheetAlignment,
  readSheet,
  TEMPLATE,
} from '../../lib/omr.js';
import { IMG_LIMITS, measureImageQuality, paperRegionFromCorners } from '../../lib/omrQuality.js';
import { answerKeyFromSheetRead, gradeSheet, maxScore, round2 } from '../../lib/paperGrade.js';

const Svg = ({ size = 16, children, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoX = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
const IcoRotate = (p) => <Svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 10 15 10" /></Svg>;
const IcoBolt = (p) => <Svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>;
const IcoSwitch = (p) => <Svg {...p}><path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /><path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" /><circle cx="12" cy="12" r="3" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoEdit = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;
const IcoTrash = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Svg>;
const IcoVolume = (p) => <Svg {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></Svg>;
const IcoSliders = (p) => <Svg {...p}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="2" y1="14" x2="6" y2="14" /><line x1="10" y1="8" x2="14" y2="8" /><line x1="18" y1="16" x2="22" y2="16" /></Svg>;
const IcoGrid = (p) => <Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>;
const IcoLayers = (p) => <Svg {...p}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></Svg>;
const IcoSpark = (p) => <Svg {...p}><path d="M12 3l1.8 4.4L18 9.2l-4.2 1.8L12 15.4l-1.8-4.4L6 9.2l4.2-1.8L12 3z" /></Svg>;
const IcoAlert = (p) => <Svg {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Svg>;

/** Bộ tổng hợp âm thanh Bíp chuẩn Web Audio (không cần file MP3 ngoài) + rung Haptic */
let sharedAudioCtx = null;
function playScanFeedback(kind = 'ok', enabled = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    if (navigator?.vibrate) {
      if (kind === 'ok') navigator.vibrate(32);
      else if (kind === 'warn') navigator.vibrate([45, 45, 45]);
      else navigator.vibrate(15);
    }
  } catch {}
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume().catch(() => {});
    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    const tone = (freq, start, dur, gainPeak = 0.14) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + start + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };

    if (kind === 'ok') {
      tone(1046.5, 0, 0.09, 0.14);      // C6
      tone(1318.5, 0.075, 0.14, 0.15);  // E6
    } else if (kind === 'warn') {
      tone(440, 0, 0.11, 0.14);         // A4
      tone(349.2, 0.12, 0.14, 0.14);    // F4
    } else {
      tone(880, 0, 0.05, 0.07);
    }
  } catch {}
}

function speakVi(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return;
  try {
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    u.rate = 1.08;
    window.speechSynthesis.speak(u);
  } catch {}
}

const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : String(round2(n)).replace('.', ','));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Khung ngắm vector tinh gọn: 4 ô định vị góc sắc nét + lớp lưới đề mờ thoáng (có thể ẩn/hiện). */
function ExamViewfinderGuide({ counts, lockedCode, landscape, ready, detected, cornerMatched = {}, showGrid = true }) {
  const accent = ready ? '#10b981' : detected ? '#38bdf8' : 'rgba(255,255,255,0.58)';
  const p1Blocks = [148, 708, 1268, 1828];

  return (
    <svg
      className={'pg-cam-guide-svg' + (landscape ? ' landscape' : '')}
      viewBox={landscape ? `0 0 ${TEMPLATE.height} ${TEMPLATE.width}` : `0 0 ${TEMPLATE.width} ${TEMPLATE.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g transform={landscape ? `translate(0, ${TEMPLATE.width}) rotate(-90)` : undefined}>
        {/* 4 ô vuông định vị góc chuẩn giấy A4 (khớp 1:1 với TEMPLATE.corners) */}
        {Object.entries(TEMPLATE.corners).map(([key, [cx, cy]]) => {
          const isHit = Boolean(ready || cornerMatched?.[key]);
          const cColor = isHit ? '#10b981' : 'rgba(255,255,255,0.86)';
          return (
            <g key={key}>
              <rect
                x={cx - 62}
                y={cy - 62}
                width="124"
                height="124"
                rx="18"
                fill={isHit ? 'rgba(16,185,129,0.22)' : 'rgba(6,10,20,0.42)'}
                stroke={cColor}
                strokeWidth="7"
              />
              <rect
                x={cx - 30}
                y={cy - 30}
                width="60"
                height="60"
                rx="8"
                fill={isHit ? '#10b981' : 'rgba(255,255,255,0.16)'}
                fillOpacity={isHit ? '0.92' : '0.42'}
                stroke={isHit ? '#d1fae5' : '#ffffff'}
                strokeWidth="4"
              />
            </g>
          );
        })}

        {showGrid && (
          <g opacity="0.62">
            <rect
              x="1792" y="274" width="298" height="771" rx="14"
              fill="rgba(255,255,255,0.03)"
              stroke={accent}
              strokeWidth="4"
              strokeDasharray="16 12"
            />
            <text x="1941" y="318" textAnchor="middle" fill="rgba(255,255,255,0.86)" fontSize="30" fontWeight="700">
              SBD
            </text>

            <rect
              x="2168" y="274" width="154" height="771" rx="14"
              fill="rgba(56,189,248,0.08)"
              stroke={accent}
              strokeWidth="4"
            />
            <text x="2245" y="318" textAnchor="middle" fill="#bae6fd" fontSize="28" fontWeight="700">
              {lockedCode !== 'auto' ? lockedCode : 'MÃ ĐỀ'}
            </text>

            {p1Blocks.map((fx, b) => {
              const startQ = b * 10 + 1;
              const activeRows = Math.max(0, Math.min(10, (counts.p1 || 0) - b * 10));
              if (activeRows <= 0) return null;
              const activeH = 58 + (activeRows / 10) * 618;
              return (
                <g key={b}>
                  <rect
                    x={fx} y="1170" width="470" height={activeH} rx="12"
                    fill="rgba(16,185,129,0.07)"
                    stroke="#34d399"
                    strokeWidth="4"
                    strokeDasharray="14 10"
                  />
                  <text x={fx + 235} y="1148" textAnchor="middle" fill="#a7f3d0" fontSize="28" fontWeight="700">
                    P.I · {startQ}–{startQ + activeRows - 1}
                  </text>
                </g>
              );
            })}

            {p1Blocks.map((fx, b) => {
              const q1 = b * 2 + 1;
              const activeInBlock = Math.max(0, Math.min(2, (counts.p2 || 0) - b * 2));
              if (activeInBlock <= 0) return null;
              return (
                <g key={`p2-${b}`}>
                  <rect
                    x={fx}
                    y="1940"
                    width={activeInBlock === 1 ? 235 : 470}
                    height="385"
                    rx="12"
                    fill="rgba(56,189,248,0.07)"
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeDasharray="14 10"
                  />
                  <text x={fx + 14} y="1922" fill="#bae6fd" fontSize="26" fontWeight="700">
                    P.II · C.{q1}{activeInBlock === 2 ? `–${q1 + 1}` : ''}
                  </text>
                </g>
              );
            })}

            {[0, 1, 2, 3, 4, 5].map((k) => {
              if (k >= (counts.p3 || 0)) return null;
              const x = 148 + k * 358;
              return (
                <g key={`p3-${k}`}>
                  <rect
                    x={x}
                    y="2424"
                    width="350"
                    height="900"
                    rx="12"
                    fill="rgba(251,191,36,0.06)"
                    stroke="#fbbf24"
                    strokeWidth="4"
                    strokeDasharray="14 10"
                  />
                  <text x={x + 175} y="2406" textAnchor="middle" fill="#fde68a" fontSize="26" fontWeight="700">
                    P.III · {k + 1}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </g>
    </svg>
  );
}

/** Tính hình chữ nhật video hiển thị thực tế (theo clientSize hoặc boundingRect). */
function getContainedVideoRect(videoEl, useLayoutSize = false) {
  const rect = useLayoutSize
    ? { left: 0, top: 0, width: videoEl.clientWidth || 1, height: videoEl.clientHeight || 1 }
    : videoEl.getBoundingClientRect();
  const vw = videoEl.videoWidth || 1920;
  const vh = videoEl.videoHeight || 1080;
  const scale = Math.min(rect.width / vw, rect.height / vh);
  const drawW = vw * scale;
  const drawH = vh * scale;
  const offX = (rect.width - drawW) / 2;
  const offY = (rect.height - drawH) / 2;
  return { vw, vh, rect, scale, drawW, drawH, offX, offY };
}

export default function OmrCameraModal({
  open,
  mode = 'grade', // 'grade' | 'key'
  onClose,
  paper,
  keys = {},
  codeList = [],
  counts,
  scoring,
  vipUnlocked,
  omrRemaining,
  scannedCount = 0,
  onScanned,
  onKeyCaptured = null,
  onRemoveItem,
  onEditItem,
  onQuotaExhausted,
}) {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const viewfinderRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const probeCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const openRef = useRef(open);
  openRef.current = open;
  const streamReqIdRef = useRef(0);
  const busyScanRef = useRef(false);
  const readyStreakRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const lastSignatureRef = useRef({ sig: '', at: 0 });
  const arHoldUntilRef = useRef(0);
  const pinchRef = useRef(null);
  const focusTimerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [capturingBurst, setCapturingBurst] = useState(false);
  const [lockProgress, setLockProgress] = useState(0); // 0 | 50 | 100
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomCap, setZoomCap] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [landscapeGuide, setLandscapeGuide] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [burstMode, setBurstMode] = useState(true);
  const [soundHaptic, setSoundHaptic] = useState(true);
  const [sensitivity, setSensitivity] = useState('normal'); // 'light' | 'normal' | 'strict'
  const [voiceReadback, setVoiceReadback] = useState(false);
  const [showGuideGrid, setShowGuideGrid] = useState(true);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [lockedCode, setLockedCode] = useState('auto');
  const [probe, setProbe] = useState(null);
  const [lastCapture, setLastCapture] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [flashPulse, setFlashPulse] = useState(false);
  const [focusTap, setFocusTap] = useState(null); // { x, y, id }

  const maxPts = useMemo(() => maxScore(counts, scoring), [counts, scoring]);
  const maxZoom = useMemo(() => (zoomCap ? Math.min(3, zoomCap.max) : 2.2), [zoomCap]);
  const zoomPresets = useMemo(() => [1, 1.5, 2].filter((z) => z <= maxZoom + 0.05), [maxZoom]);

  const sessionStats = useMemo(() => {
    const graded = recentHistory.filter((h) => h.grade && typeof h.grade.score10 === 'number');
    const avg = graded.length
      ? graded.reduce((sum, h) => sum + h.grade.score10, 0) / graded.length
      : null;
    const reviewCount = recentHistory.filter((h) => h.needsReview).length;
    return { total: recentHistory.length, avg, reviewCount };
  }, [recentHistory]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const startStream = useCallback(async (deviceId = '') => {
    const reqId = ++streamReqIdRef.current;
    setLoading(true);
    setFeedback(null);
    stopStream();

    const videoConstraint = deviceId
      ? {
        deviceId: { exact: deviceId },
        width: { ideal: 2560 },
        height: { ideal: 1440 },
      }
      : {
        facingMode: { ideal: 'environment' },
        width: { ideal: 2560 },
        height: { ideal: 1440 },
      };

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: false });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
          audio: false,
        });
      }

      if (!openRef.current || reqId !== streamReqIdRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities?.() || {};
        setTorchSupported(Boolean(caps.torch));
        if (caps.zoom && typeof caps.zoom.min === 'number' && typeof caps.zoom.max === 'number') {
          setZoomCap(caps.zoom);
        } else {
          setZoomCap(null);
        }
        const activeId = track.getSettings?.()?.deviceId;
        if (activeId) setSelectedDeviceId(activeId);
        if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
        }
      }

      if (navigator.mediaDevices.enumerateDevices) {
        const all = await navigator.mediaDevices.enumerateDevices();
        if (openRef.current && reqId === streamReqIdRef.current) {
          setDevices(all.filter((d) => d.kind === 'videoinput'));
        }
      }

      if (videoRef.current && openRef.current && reqId === streamReqIdRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play?.().catch(() => {});
      }
    } catch (err) {
      if (openRef.current && reqId === streamReqIdRef.current) {
        setFeedback({ ok: false, msg: `Không thể mở camera: ${err?.message || 'Vui lòng cấp quyền camera.'}` });
      }
    } finally {
      if (reqId === streamReqIdRef.current) {
        setLoading(false);
      }
    }
  }, [stopStream]);

  useEffect(() => {
    if (!open) {
      streamReqIdRef.current += 1;
      stopStream();
      clearTimeout(focusTimerRef.current);
      try { window.speechSynthesis?.cancel?.(); } catch {}
      setProbe(null);
      setZoom(1);
      setLockProgress(0);
      setLastCapture(null);
      setRecentHistory([]);
      setShowHistory(false);
      setShowSettingsSheet(false);
      setFeedback(null);
      setFocusTap(null);
      readyStreakRef.current = 0;
      arHoldUntilRef.current = 0;
      return;
    }
    setLockedCode('auto');
    startStream('');
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showSettingsSheet) setShowSettingsSheet(false);
        else if (showHistory) setShowHistory(false);
        else onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimerRef.current);
      stopStream();
      try { window.speechSynthesis?.cancel?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleToggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track || !torchSupported) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setFeedback({ ok: false, msg: 'Thiết bị không hỗ trợ bật đèn Flash khi đang quay.' });
    }
  };

  const handleZoomChange = useCallback(async (val) => {
    const z = Math.max(1, Math.min(maxZoom, Number(val) || 1));
    setZoom(z);
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (track && zoomCap) {
      try {
        const clamped = Math.max(zoomCap.min, Math.min(zoomCap.max, z));
        await track.applyConstraints({ advanced: [{ zoom: clamped }] });
      } catch {}
    }
  }, [maxZoom, zoomCap]);

  const handleCycleCamera = () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const next = devices[(idx + 1) % devices.length];
    if (next) startStream(next.deviceId);
  };

  /** Chạm vào khung hình để lấy nét (Tap-to-Focus kiểu iOS Camera) */
  const handleStageTap = (e) => {
    if (showSettingsSheet || showHistory) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusTap({ x, y, id: Date.now() });
    clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => setFocusTap(null), 950);

    const track = streamRef.current?.getVideoTracks?.()[0];
    if (track) {
      const caps = track.getCapabilities?.() || {};
      const nx = Math.max(0, Math.min(1, x / Math.max(1, rect.width)));
      const ny = Math.max(0, Math.min(1, y / Math.max(1, rect.height)));
      const adv = {};
      if (Array.isArray(caps.focusMode)) {
        if (caps.focusMode.includes('single-shot')) adv.focusMode = 'single-shot';
        else if (caps.focusMode.includes('continuous')) adv.focusMode = 'continuous';
      }
      if (caps.pointsOfInterest) adv.pointsOfInterest = [{ x: nx, y: ny }];
      if (Object.keys(adv).length) {
        track.applyConstraints({ advanced: [adv] }).catch(() => {});
      }
    }
  };

  /** Chụm 2 ngón phóng to/thu nhỏ mượt trên điện thoại (Pinch-to-Zoom) */
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), startZoom: zoom };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (pinchRef.current.dist > 10) {
        const nextZoom = +(pinchRef.current.startZoom * (dist / pinchRef.current.dist)).toFixed(2);
        handleZoomChange(nextZoom);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  /** Trích tọa độ vùng ROI trong khung ngắm */
  const computeFrameAndRoi = useCallback((video) => {
    const vw = video.videoWidth || 1920;
    const vh = video.videoHeight || 1080;
    const applyDigitalZoom = zoom > 1.02 && !zoomCap;
    const srcW = applyDigitalZoom ? Math.round(vw / zoom) : vw;
    const srcH = applyDigitalZoom ? Math.round(vh / zoom) : vh;
    const srcX = Math.round((vw - srcW) / 2);
    const srcY = Math.round((vh - srcH) / 2);

    let roi = null;
    if (viewfinderRef.current) {
      const box = getContainedVideoRect(video, false);
      const vf = viewfinderRef.current.getBoundingClientRect();
      if (box.drawW > 0 && box.drawH > 0) {
        const relLeft = (vf.left - (box.rect.left + box.offX)) / box.drawW;
        const relTop = (vf.top - (box.rect.top + box.offY)) / box.drawH;
        const relW = vf.width / box.drawW;
        const relH = vf.height / box.drawH;
        const padX = relW * 0.1;
        const padY = relH * 0.1;
        const fullRx = (relLeft - padX) * vw - srcX;
        const fullRy = (relTop - padY) * vh - srcY;
        const rx = Math.max(0, Math.floor(fullRx));
        const ry = Math.max(0, Math.floor(fullRy));
        const rw = Math.min(srcW - rx, Math.ceil((relW + padX * 2) * vw - Math.max(0, -fullRx)));
        const rh = Math.min(srcH - ry, Math.ceil((relH + padY * 2) * vh - Math.max(0, -fullRy)));
        if (rw >= 260 && rh >= 260) roi = { rx, ry, rw, rh };
      }
    }
    return { vw, vh, srcX, srcY, srcW, srcH, roi };
  }, [zoom, zoomCap]);

  /** Vẽ khung AR nhận dạng 4 góc thực tế lên canvas phủ trên video. */
  const drawArOverlay = useCallback((pRes, cropInfo) => {
    if (Date.now() < arHoldUntilRef.current) return;
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const box = getContainedVideoRect(video, true);
    const cw = Math.max(1, Math.round(box.rect.width));
    const ch = Math.max(1, Math.round(box.rect.height));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    if (!pRes?.detected || !pRes.cornersPx) return;

    const toDisplay = ([px, py]) => [
      box.offX + ((px + cropInfo.srcX) / cropInfo.vw) * box.drawW,
      box.offY + ((py + cropInfo.srcY) / cropInfo.vh) * box.drawH,
    ];

    const quad = (pRes.paperQuadPx || [
      pRes.cornersPx.TL,
      pRes.cornersPx.TR,
      pRes.cornersPx.BR,
      pRes.cornersPx.BL,
    ]).map(toDisplay);

    ctx.save();
    ctx.strokeStyle = pRes.ready ? '#10b981' : '#38bdf8';
    ctx.fillStyle = pRes.ready ? 'rgba(16, 185, 129, 0.14)' : 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = pRes.ready ? 3.5 : 2.5;
    ctx.beginPath();
    quad.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    Object.values(pRes.cornersPx).forEach((pt) => {
      const [dx, dy] = toDisplay(pt);
      ctx.beginPath();
      ctx.arc(dx, dy, 6, 0, Math.PI * 2);
      ctx.fillStyle = pRes.ready ? '#10b981' : '#38bdf8';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });
    ctx.restore();
  }, []);

  /** Vẽ hiệu ứng chấm AR trực tiếp kiểu ZipGrade (Xanh = Đúng, Đỏ = Sai) ngay trên từng ô tô vừa chấm */
  const drawGradedArFlash = useCallback((read, grade, info, usedCrop) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const cn = read?.quality?.cornersNorm;
    if (!canvas || !video || !cn || !grade) return;

    const box = getContainedVideoRect(video, true);
    const cw = Math.max(1, Math.round(box.rect.width));
    const ch = Math.max(1, Math.round(box.rect.height));
    canvas.width = cw;
    canvas.height = ch;

    const imgW = usedCrop ? usedCrop.rw : info.srcW;
    const imgH = usedCrop ? usedCrop.rh : info.srcH;
    const offSrcX = info.srcX + (usedCrop ? usedCrop.rx : 0);
    const offSrcY = info.srcY + (usedCrop ? usedCrop.ry : 0);

    const normToDisp = ([nx, ny]) => [
      box.offX + ((offSrcX + nx * imgW) / info.vw) * box.drawW,
      box.offY + ((offSrcY + ny * imgH) / info.vh) * box.drawH,
    ];

    const tc = TEMPLATE.corners;
    const Hdisp = fitHomography(
      [tc.TL, tc.TR, tc.BR, tc.BL],
      [normToDisp(cn.TL), normToDisp(cn.TR), normToDisp(cn.BR), normToDisp(cn.BL)],
    );
    if (!Hdisp) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();

    // Khung xanh báo đã chấm
    const corners = [Hdisp(...tc.TL), Hdisp(...tc.TR), Hdisp(...tc.BR), Hdisp(...tc.BL)];
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    corners.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.stroke();

    const letters = ['A', 'B', 'C', 'D'];
    const p1Detail = grade?.detail?.p1 || [];
    const maxP1 = Math.min(counts?.p1 || 0, p1Detail.length);
    for (let qi = 0; qi < maxP1; qi++) {
      const d = p1Detail[qi];
      const block = Math.floor(qi / 10);
      const row = qi % 10;
      const pickedIdx = letters.indexOf(d.got);
      const keyIdx = letters.indexOf(d.want);
      const tx = pickedIdx >= 0 ? TEMPLATE.p1X[block][pickedIdx] : (keyIdx >= 0 ? TEMPLATE.p1X[block][keyIdx] : null);
      if (tx == null) continue;
      const [dx, dy] = Hdisp(tx, TEMPLATE.p1Y[row]);
      ctx.beginPath();
      ctx.arc(dx, dy, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = d.ok ? 'rgba(16, 185, 129, 0.92)' : 'rgba(239, 68, 68, 0.92)';
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Nếu học sinh tô sai, khoanh viền xanh nhạt ở đáp án đúng để GV thấy ngay!
      if (!d.ok && keyIdx >= 0 && keyIdx !== pickedIdx) {
        const [kx, ky] = Hdisp(TEMPLATE.p1X[block][keyIdx], TEMPLATE.p1Y[row]);
        ctx.beginPath();
        ctx.arc(kx, ky, 6, 0, Math.PI * 2);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#34d399';
        ctx.stroke();
      }
    }
    ctx.restore();
    arHoldUntilRef.current = Date.now() + 1700;
  }, [counts?.p1]);

  const triggerShutterFlash = () => {
    setFlashPulse(true);
    setTimeout(() => setFlashPulse(false), 200);
  };

  /** Chụp 1 khung hình và chạy quét 2 tầng (ROI ưu tiên → toàn khung dự phòng) */
  const readSingleFrame = useCallback((video, info, readOpts) => {
    const canvas = captureCanvasRef.current || document.createElement('canvas');
    captureCanvasRef.current = canvas;
    canvas.width = info.srcW;
    canvas.height = info.srcH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, info.srcX, info.srcY, info.srcW, info.srcH, 0, 0, info.srcW, info.srcH);

    let read = null;
    let camQ = null;
    let usedCrop = null;

    if (info.roi) {
      const { rx, ry, rw, rh } = info.roi;
      const roiImg = ctx.getImageData(rx, ry, rw, rh);
      const roiRead = readSheet(roiImg, readOpts);
      if (roiRead.ok) {
        read = roiRead;
        const isLandscapeRoi = rw > rh;
        const paperBox = paperRegionFromCorners(rw, rh, roiRead.quality?.cornersNorm);
        camQ = measureImageQuality(roiImg, {
          ...IMG_LIMITS,
          minWidth: isLandscapeRoi ? 580 : 460,
          minHeight: isLandscapeRoi ? 460 : 580,
          maxBrightness: 252,
          minSharpness: 7.5,
        }, paperBox);
        usedCrop = info.roi;
      }
    }

    if (!read || !read.ok || (read.quality?.markFit ?? 0) < 0.75) {
      const fullImg = ctx.getImageData(0, 0, info.srcW, info.srcH);
      const fullRead = readSheet(fullImg, readOpts);
      const scoreOf = (r) => (r?.ok ? (r.quality?.markFit ?? 0) + (r.quality?.alignment ?? 0) * 0.5 : -1);
      if (!read || scoreOf(fullRead) > scoreOf(read)) {
        read = fullRead;
        const paperBox = paperRegionFromCorners(info.srcW, info.srcH, fullRead.quality?.cornersNorm);
        camQ = measureImageQuality(fullImg, {
          ...IMG_LIMITS,
          minWidth: 640,
          minHeight: 480,
          maxBrightness: 252,
          minSharpness: 7.5,
        }, paperBox);
        usedCrop = null;
      }
    }

    return { read, camQ, usedCrop, canvas };
  }, []);

  const captureAndScan = useCallback(async (source = 'manual') => {
    if (busyScanRef.current) return;
    if (mode === 'grade' && !vipUnlocked && omrRemaining <= 0) {
      onQuotaExhausted?.();
      return;
    }
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    busyScanRef.current = true;
    setCapturingBurst(burstMode);
    triggerShutterFlash();

    try {
      const readOpts = { sensitivity, adaptive: true, localRefine: true };
      const info = computeFrameAndRoi(video);
      const frameCount = burstMode ? 3 : 1;
      const validReads = [];
      let bestShot = null;

      for (let f = 0; f < frameCount; f++) {
        if (f > 0) await sleep(65);
        if (!openRef.current || !videoRef.current || videoRef.current.readyState < 2) break;
        const shot = readSingleFrame(videoRef.current, info, readOpts);
        if (shot.read?.ok) {
          validReads.push(shot.read);
          const sharpScore = (shot.camQ?.sharpness || 0) + (shot.read.quality?.alignment || 0) * 30;
          if (!bestShot || sharpScore > bestShot.sharpScore) {
            // Lưu ngay snapshot ảnh sắc nét nhất
            let thumbUrl;
            if (shot.usedCrop) {
              const cropCv = document.createElement('canvas');
              cropCv.width = shot.usedCrop.rw;
              cropCv.height = shot.usedCrop.rh;
              cropCv.getContext('2d').drawImage(
                shot.canvas,
                shot.usedCrop.rx, shot.usedCrop.ry, shot.usedCrop.rw, shot.usedCrop.rh,
                0, 0, shot.usedCrop.rw, shot.usedCrop.rh,
              );
              thumbUrl = cropCv.toDataURL('image/jpeg', 0.86);
            } else {
              thumbUrl = shot.canvas.toDataURL('image/jpeg', 0.85);
            }
            bestShot = { ...shot, thumbUrl, sharpScore };
          }
        }
      }

      const read = validReads.length > 1
        ? mergeBurstReads(validReads, readOpts)
        : (validReads[0] || null);
      const camQ = bestShot?.camQ || null;
      const usedCrop = bestShot?.usedCrop || null;

      if (!read || !read.ok) {
        if (source === 'manual') {
          playScanFeedback('warn', soundHaptic);
          setFeedback({
            ok: false,
            msg: 'Chưa nhận đủ 4 ô vuông đen ở 4 góc phiếu A4. Đưa phiếu khít khung hơn!',
          });
        }
        return;
      }

      // Chế độ QUÉT ĐÁP ÁN GỐC
      if (mode === 'key') {
        if (source === 'auto' && read.quality?.warn) return;
        const keyRes = answerKeyFromSheetRead(read, counts);
        const targetCode = keyRes.code || (lockedCode !== 'auto' ? lockedCode : '');
        const resolved = { ...keyRes, code: targetCode };
        cooldownUntilRef.current = Date.now() + 2600;
        readyStreakRef.current = 0;
        setLockProgress(0);
        playScanFeedback(read.quality?.warn ? 'warn' : 'ok', soundHaptic);
        setFeedback({
          ok: !read.quality?.warn,
          msg: read.quality?.warn
            ? `Đã đọc Đáp Án Gốc nhưng ${read.quality.warn} (P.I ${resolved.filledCount.p1} · P.II ${resolved.filledCount.p2} · P.III ${resolved.filledCount.p3})`
            : `Đã đọc Đáp Án Gốc${targetCode ? ` (Mã ${targetCode})` : ''}: P.I ${resolved.filledCount.p1} · P.II ${resolved.filledCount.p2} · P.III ${resolved.filledCount.p3}`,
        });
        if (voiceReadback) speakVi(`Đã nhận đáp án gốc, phần một ${resolved.filledCount.p1} câu`);
        onKeyCaptured?.(resolved);
        return;
      }

      let finalCode = read.code;
      if (lockedCode !== 'auto' && keys[lockedCode]) {
        finalCode = lockedCode;
      } else if (!keys[finalCode] && codeList.length === 1) {
        finalCode = codeList[0];
      }
      const codeKnown = Boolean(keys[finalCode]);

      const sig = `${read.sbd || '?'}|${finalCode || '?'}|${(read.p1 || []).slice(0, 10).join('')}`;
      const now = Date.now();
      if (source === 'auto' && lastSignatureRef.current.sig === sig && now - lastSignatureRef.current.at < 7000) {
        cooldownUntilRef.current = now + 1800;
        setLockProgress(0);
        setFeedback({ ok: true, msg: `Đã lưu SBD ${read.sbd || '---'} — Đặt phiếu tiếp theo vào khung.` });
        return;
      }
      lastSignatureRef.current = { sig, at: now };
      cooldownUntilRef.current = now + 2600;
      readyStreakRef.current = 0;
      setLockProgress(0);

      const grade = codeKnown ? gradeSheet(read, keys[finalCode], counts, scoring) : null;
      const camWarnMsg = read.quality?.warn || (!camQ?.ok ? camQ?.issues?.[0] || 'Chất lượng ảnh chưa đạt chuẩn.' : null);
      const isDuplicateSbd = Boolean(
        read.sbd && !read.sbd.includes('?') && recentHistory.some((h) => h.sbd === read.sbd),
      );

      const item = {
        id: `cam${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        fileName: `camera_${read.sbd || Date.now()}.jpg`,
        url: bestShot.thumbUrl,
        status: 'done',
        sbd: read.sbd,
        code: finalCode,
        readCode: read.code,
        read: { p1: read.p1, p2: read.p2, p3: read.p3 },
        issues: [...(read.issues || []), ...(camQ?.issues || [])],
        quality: { ...(read.quality || {}), image: camQ, warn: camWarnMsg },
        needsReview: !codeKnown || (read.issues && read.issues.length > 0)
          || Boolean(read.quality?.warn) || !read.sbd || read.sbd.includes('?') || !camQ?.ok,
      };

      const matchedStudent = paper?.sbdMap?.[read.sbd];
      const p1Dots = (grade?.detail?.p1 || []).slice(0, counts?.p1 || 0).map((d) => ({ q: d.q, ok: Boolean(d.ok) }));
      const captureSummary = {
        id: item.id,
        thumbUrl: bestShot.thumbUrl,
        sbd: read.sbd,
        studentName: matchedStudent?.name || '',
        code: finalCode,
        codeKnown,
        grade,
        p1Dots,
        markFit: read.quality?.markFit ?? 0,
        burstFrames: read.quality?.burstFrames || 1,
        threshold: read.quality?.threshold,
        duplicateSbd: isDuplicateSbd,
        needsReview: item.needsReview,
      };

      // Flash vòng Xanh/Đỏ trực tiếp trên từng ô tô vừa chấm (kiểu ZipGrade)
      drawGradedArFlash(read, grade, info, usedCrop);
      playScanFeedback(!codeKnown || item.needsReview || isDuplicateSbd ? 'warn' : 'ok', soundHaptic);

      setLastCapture(captureSummary);
      setRecentHistory((cur) => [captureSummary, ...cur].slice(0, 50));

      if (voiceReadback) {
        const spokenName = matchedStudent?.name || (read.sbd && !read.sbd.includes('?') ? `Số báo danh ${read.sbd}` : 'Chưa rõ số báo danh');
        speakVi(codeKnown && grade ? `${spokenName}, ${String(round2(grade.score10)).replace('.', ' phẩy ')} điểm` : `${spokenName}, cần kiểm tra mã đề`);
      }

      setFeedback({
        ok: codeKnown && !isDuplicateSbd,
        msg: isDuplicateSbd
          ? `Cảnh báo: SBD ${read.sbd} vừa được quét trùng trong phiên này!`
          : codeKnown
            ? `Đã chấm · SBD ${read.sbd || '---'} · Mã ${finalCode} · ${fmt(grade?.score10)}đ`
            : `Đã chụp SBD ${read.sbd || '---'} nhưng Mã đề "${read.code || '---'}" chưa có trong bài chấm!`,
      });

      onScanned?.({ item, grade, read, codeKnown });
    } catch (err) {
      playScanFeedback('warn', soundHaptic);
      setFeedback({ ok: false, msg: `Lỗi xử lý ảnh camera: ${err?.message || 'Thử lại'}` });
    } finally {
      busyScanRef.current = false;
      setCapturingBurst(false);
    }
  }, [
    mode, vipUnlocked, omrRemaining, onQuotaExhausted, computeFrameAndRoi, readSingleFrame,
    burstMode, sensitivity, soundHaptic, lockedCode, keys, codeList, counts, scoring,
    paper, voiceReadback, recentHistory, drawGradedArFlash, onScanned, onKeyCaptured,
  ]);

  /* Vòng lặp thăm dò căn chỉnh 4 góc + đo nét/nghiêng/ánh sáng thời gian thực (~3.2 fps) */
  useEffect(() => {
    if (!open || loading) return undefined;
    const timer = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || busyScanRef.current) return;

      const info = computeFrameAndRoi(video);
      const pCanvas = probeCanvasRef.current || document.createElement('canvas');
      probeCanvasRef.current = pCanvas;
      const pCtx = pCanvas.getContext('2d', { willReadFrequently: true });

      const probeRegion = (sx, sy, sw, sh, ox, oy) => {
        const scale = Math.min(1, 820 / Math.max(sw, sh));
        const pw = Math.max(64, Math.round(sw * scale));
        const ph = Math.max(64, Math.round(sh * scale));
        if (pCanvas.width !== pw || pCanvas.height !== ph) {
          pCanvas.width = pw;
          pCanvas.height = ph;
        }
        pCtx.drawImage(video, sx, sy, sw, sh, 0, 0, pw, ph);
        const pImg = pCtx.getImageData(0, 0, pw, ph);
        const res = probeSheetAlignment(pImg, { detectMaxDim: 820 });
        const invS = 1 / scale;
        return {
          ...res,
          cornersPx: res.cornersPx
            ? Object.fromEntries(Object.entries(res.cornersPx).map(([k, [x, y]]) => [k, [ox + x * invS, oy + y * invS]]))
            : null,
          paperQuadPx: res.paperQuadPx
            ? res.paperQuadPx.map(([x, y]) => [ox + x * invS, oy + y * invS])
            : null,
        };
      };

      let scaledRes = info.roi
        ? probeRegion(info.srcX + info.roi.rx, info.srcY + info.roi.ry, info.roi.rw, info.roi.rh, info.roi.rx, info.roi.ry)
        : probeRegion(info.srcX, info.srcY, info.srcW, info.srcH, 0, 0);

      if (info.roi && !scaledRes.ready) {
        const fullRes = probeRegion(info.srcX, info.srcY, info.srcW, info.srcH, 0, 0);
        if (fullRes.ready || (!scaledRes.detected && fullRes.detected) || (fullRes.hits || 0) > (scaledRes.hits || 0) + 4) {
          scaledRes = fullRes;
        }
      }
      setProbe(scaledRes);
      drawArOverlay(scaledRes, info);

      const now = Date.now();
      if (autoCapture && scaledRes.ready && now >= cooldownUntilRef.current) {
        readyStreakRef.current += 1;
        setLockProgress(Math.min(100, readyStreakRef.current * 50));
        if (readyStreakRef.current >= 2) {
          readyStreakRef.current = 0;
          captureAndScan('auto');
        }
      } else if (!scaledRes.ready) {
        if (readyStreakRef.current !== 0) {
          readyStreakRef.current = 0;
          setLockProgress(0);
        }
      }
    }, 320);

    return () => clearInterval(timer);
  }, [open, loading, autoCapture, computeFrameAndRoi, drawArOverlay, captureAndScan]);

  if (!open) return null;

  const cornersCount = probe?.cornersCount || 0;
  const cornerKeys = ['TL', 'TR', 'BL', 'BR'];
  const statusText = capturingBurst
    ? 'Đang hợp nhất 3 khung hình siêu nét…'
    : probe?.ready
      ? (autoCapture ? 'Khóa chuẩn 4 góc — Đang tự chấm…' : 'Khóa chuẩn 4 góc — Bấm chụp ngay!')
      : (probe?.hint || 'Căn 4 ô vuông đen ở 4 góc phiếu vào 4 ô ngắm');

  // Cảnh báo cảm biến thời gian thực (chỉ hiện khi phát hiện yếu tố làm giảm độ chính xác)
  const telemetryAlerts = [];
  if (probe?.lightState === 'dark') {
    telemetryAlerts.push({ id: 'dark', label: 'Thiếu sáng', tone: 'warn', action: torchSupported ? handleToggleTorch : null, cta: torchSupported ? (torchOn ? 'Tắt đèn' : 'Bật Flash') : null });
  } else if (probe?.lightState === 'bright') {
    telemetryAlerts.push({ id: 'bright', label: 'Hơi lóa đèn', tone: 'warn' });
  }
  if (probe?.detected && probe?.blurry) {
    telemetryAlerts.push({ id: 'blur', label: 'Hơi mờ · Giữ yên', tone: 'bad' });
  }
  if (probe?.skewState === 'tilted') {
    telemetryAlerts.push({ id: 'skew', label: `Nghiêng ${probe.skewDeg}°`, tone: 'warn' });
  }
  if (probe?.detected && probe?.distanceState === 'far') {
    telemetryAlerts.push({ id: 'far', label: 'Đưa lại gần hơn', tone: 'info' });
  }

  return (
    <div
      className="pg-cam-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Camera chấm phiếu A4 theo đề"
    >
      <div className="pg-cam-body">
        {loading && (
          <div className="pg-cam-loading">
            <span className="pg-cam-spinner" aria-hidden="true" />
            <span>Đang khởi động camera độ phân giải cao…</span>
          </div>
        )}

        {/* Vùng Video + Tap-to-Focus + Pinch-to-Zoom + AR Overlay */}
        <div
          className="pg-cam-stage"
          style={zoom > 1 && !zoomCap ? { transform: `scale(${zoom.toFixed(2)})` } : undefined}
          onClick={handleStageTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <video
            ref={videoRef}
            className="pg-cam-video"
            playsInline
            autoPlay
            muted
          />
          <canvas ref={overlayCanvasRef} className="pg-cam-ar-canvas" />
        </div>

        {/* Hiệu ứng khung lấy nét khi chạm (Tap-to-Focus Reticle) */}
        {focusTap && (
          <div
            key={focusTap.id}
            className="pg-cam-focus-ring"
            style={{ left: `${focusTap.x}px`, top: `${focusTap.y}px` }}
            aria-hidden="true"
          />
        )}

        {flashPulse && <div className="pg-cam-flash" aria-hidden="true" />}

        {/* ===== TOP FLOATING GLASS BAR ===== */}
        <header className="pg-cam-head">
          <div className="pg-cam-head-left">
            <button
              type="button"
              className="pg-cam-iconbtn is-close"
              onClick={onClose}
              aria-label="Đóng camera"
              title="Đóng (Esc)"
            >
              <IcoX size={18} />
            </button>

            <div className="pg-cam-titlebox">
              <strong>
                {mode === 'key'
                  ? 'Quét phiếu đáp án mẫu'
                  : (paper?.title || 'Camera chấm phiếu A4')}
              </strong>
              <div className="pg-cam-meta-line">
                <span>{counts.p1}·{counts.p2}·{counts.p3}</span>
                {mode === 'grade' && (
                  <>
                    <i aria-hidden="true">•</i>
                    <span>Thang {fmt(maxPts)}đ</span>
                  </>
                )}
                {burstMode && (
                  <>
                    <i aria-hidden="true">•</i>
                    <span className="pg-cam-meta-pro">3× Siêu chuẩn</span>
                  </>
                )}
                {mode === 'grade' && lockedCode !== 'auto' && (
                  <>
                    <i aria-hidden="true">•</i>
                    <span className="pg-cam-meta-accent">Mã {lockedCode}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pg-cam-head-right">
            <div className="pg-cam-desktop-tools">
              {mode === 'grade' && codeList.length > 0 && (
                <label className="pg-cam-code-select" title="Chọn hoặc tự động đọc Mã đề">
                  <span>Mã đề</span>
                  <select value={lockedCode} onChange={(e) => setLockedCode(e.target.value)}>
                    <option value="auto">Tự đọc ({codeList.join(', ')})</option>
                    {codeList.map((c) => (
                      <option key={c} value={c}>Khóa mã {c}</option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="button"
                className={'pg-cam-chipbtn' + (showGuideGrid ? ' on' : '')}
                onClick={() => setShowGuideGrid((v) => !v)}
                title="Bật / tắt lưới cấu trúc đề trên khung ngắm"
              >
                <IcoGrid size={14} />
                <span>Lưới</span>
              </button>

              <button
                type="button"
                className={'pg-cam-chipbtn' + (landscapeGuide ? ' on' : '')}
                onClick={() => setLandscapeGuide((v) => !v)}
                title="Xoay khung ngắm A4 Đứng / Ngang"
              >
                <IcoRotate size={14} />
                <span>{landscapeGuide ? 'A4 Ngang' : 'A4 Đứng'}</span>
              </button>

              <button
                type="button"
                className={'pg-cam-chipbtn' + (voiceReadback ? ' on' : '')}
                onClick={() => setVoiceReadback((v) => !v)}
                title="Đọc to điểm số bằng giọng nói tiếng Việt"
              >
                <IcoVolume size={14} />
                <span>Đọc điểm</span>
              </button>
            </div>

            {torchSupported && (
              <button
                type="button"
                className={'pg-cam-iconbtn' + (torchOn ? ' is-warn' : probe?.lightState === 'dark' ? ' is-pulse' : '')}
                onClick={handleToggleTorch}
                title={torchOn ? 'Tắt đèn Flash' : 'Bật đèn Flash'}
                aria-label="Đèn Flash"
              >
                <IcoBolt size={17} />
              </button>
            )}

            {mode === 'grade' && (
              <button
                type="button"
                className={'pg-cam-count-pill' + (showHistory ? ' is-open' : '')}
                onClick={() => {
                  setShowSettingsSheet(false);
                  setShowHistory((v) => !v);
                }}
                title="Xem thống kê & các phiếu đã quét trong phiên này"
              >
                <IcoLayers size={14} />
                <span>{scannedCount}</span>
                <em className="pg-cam-count-word">phiếu</em>
              </button>
            )}

            {/* Nút Tùy chỉnh Pro (hiện trên cả Desktop & Mobile để chỉnh Độ nhạy, 3× Burst, Âm thanh) */}
            <button
              type="button"
              className={'pg-cam-iconbtn' + (showSettingsSheet ? ' is-active' : '')}
              onClick={() => {
                setShowHistory(false);
                setShowSettingsSheet((v) => !v);
              }}
              aria-label="Cài đặt nâng cao"
              title="Cài đặt nâng cao (Độ nhạy · Quét 3× · Âm báo)"
            >
              <IcoSliders size={17} />
            </button>
          </div>
        </header>

        {/* ===== DYNAMIC ISLAND STATUS PILL + CẢM BIẾN CHẤT LƯỢNG ===== */}
        <div className="pg-cam-status-stack">
          <div className={'pg-cam-status' + (capturingBurst ? ' burst' : probe?.ready ? ' ready' : probe?.detected ? ' warn' : '')}>
            <div className="pg-cam-corner-leds" aria-label={`Đã khóa ${cornersCount}/4 góc`}>
              {cornerKeys.map((k) => {
                const hit = Boolean(probe?.ready || probe?.cornerMatched?.[k]);
                return <i key={k} className={hit ? 'hit' : ''} />;
              })}
            </div>
            <span className="pg-cam-status-text">{statusText}</span>
            {probe && (
              <strong className="pg-cam-fit">{cornersCount}/4</strong>
            )}
          </div>

          {telemetryAlerts.length > 0 && (
            <div className="pg-cam-telemetry-row">
              {telemetryAlerts.map((a) => (
                a.action ? (
                  <button
                    key={a.id}
                    type="button"
                    className={`pg-cam-tele-pill is-${a.tone} is-clickable`}
                    onClick={a.action}
                  >
                    <IcoBolt size={11} />
                    <span>{a.label} · <b>{a.cta}</b></span>
                  </button>
                ) : (
                  <span key={a.id} className={`pg-cam-tele-pill is-${a.tone}`}>
                    {a.label}
                  </span>
                )
              ))}
            </div>
          )}
        </div>

        {/* ===== DESKTOP PRO STUDIO LEFT RAIL: OPTICAL TELEMETRY & CALIBRATION ===== */}
        {!landscapeGuide && (
          <aside className="pg-cam-side-rail is-left" aria-label="Cảm biến & Hiệu chuẩn">
            <div className="pg-cam-rail-card">
              <div className="pg-cam-rail-head">
                <span className="pg-cam-rail-dot" />
                <b>Cảm biến quang học</b>
              </div>

              <div className="pg-cam-meter-list">
                <div className="pg-cam-meter">
                  <div className="pg-cam-meter-top">
                    <span>4 góc định vị</span>
                    <b className={cornersCount === 4 ? 'ok' : cornersCount >= 2 ? 'info' : ''}>
                      {cornersCount}/4
                    </b>
                  </div>
                  <div className="pg-cam-meter-track">
                    <span
                      className={cornersCount === 4 ? 'ok' : 'info'}
                      style={{ width: `${(cornersCount / 4) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pg-cam-meter">
                  <div className="pg-cam-meter-top">
                    <span>Độ sắc nét</span>
                    <b className={!probe ? '' : probe.blurry ? 'bad' : 'ok'}>
                      {!probe ? 'Chờ…' : probe.blurry ? 'Hơi mờ' : 'Sắc nét'}
                    </b>
                  </div>
                  <div className="pg-cam-meter-track">
                    <span
                      className={!probe ? '' : probe.blurry ? 'bad' : 'ok'}
                      style={{ width: `${!probe ? 18 : Math.min(100, Math.max(16, Math.round((probe.sharpness || 0) * 6)))}%` }}
                    />
                  </div>
                </div>

                <div className="pg-cam-meter">
                  <div className="pg-cam-meter-top">
                    <span>Ánh sáng</span>
                    <b className={!probe ? '' : probe.lightState === 'ok' ? 'ok' : 'warn'}>
                      {!probe ? 'Chờ…' : probe.lightState === 'dark' ? 'Thiếu sáng' : probe.lightState === 'bright' ? 'Hơi lóa' : 'Chuẩn'}
                    </b>
                  </div>
                  <div className="pg-cam-meter-track">
                    <span
                      className={!probe ? '' : probe.lightState === 'ok' ? 'ok' : 'warn'}
                      style={{ width: `${!probe ? 20 : Math.min(100, Math.max(12, Math.round(((probe.brightness || 0) / 255) * 100)))}%` }}
                    />
                  </div>
                </div>

                <div className="pg-cam-meter">
                  <div className="pg-cam-meter-top">
                    <span>Độ phẳng giấy</span>
                    <b className={!probe?.detected ? '' : probe.skewState === 'tilted' ? 'warn' : 'ok'}>
                      {!probe?.detected ? '—' : probe.skewState === 'tilted' ? `Nghiêng ${probe.skewDeg}°` : `${probe.skewDeg || 0}° Phẳng`}
                    </b>
                  </div>
                  <div className="pg-cam-meter-track">
                    <span
                      className={!probe?.detected ? '' : probe.skewState === 'tilted' ? 'warn' : 'ok'}
                      style={{ width: `${!probe?.detected ? 12 : Math.max(18, 100 - (probe.skewDeg || 0) * 2.2)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pg-cam-rail-card">
              <div className="pg-cam-rail-head">
                <b>Hiệu chuẩn nhận diện</b>
              </div>

              <div className="pg-cam-rail-sens">
                {[
                  { id: 'light', label: 'Chì nhạt' },
                  { id: 'normal', label: 'Chuẩn' },
                  { id: 'strict', label: 'Photo' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={sensitivity === opt.id ? 'on' : ''}
                    onClick={() => setSensitivity(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="pg-cam-rail-toggles">
                <button
                  type="button"
                  className={'pg-cam-rail-tog' + (burstMode ? ' on' : '')}
                  onClick={() => setBurstMode((v) => !v)}
                >
                  <span>Quét đa khung 3×</span>
                  <i />
                </button>
                <button
                  type="button"
                  className={'pg-cam-rail-tog' + (soundHaptic ? ' on' : '')}
                  onClick={() => setSoundHaptic((v) => !v)}
                >
                  <span>Âm báo Bíp</span>
                  <i />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ===== DESKTOP PRO STUDIO RIGHT RAIL: LIVE GRADED FEED ===== */}
        {!landscapeGuide && mode === 'grade' && (
          <aside className="pg-cam-side-rail is-right" aria-label="Danh sách vừa chấm">
            <div className="pg-cam-rail-card is-feed">
              <div className="pg-cam-rail-head">
                <b>Phiên chấm trực tiếp</b>
                <span className="pg-cam-rail-badge">{scannedCount} phiếu</span>
              </div>

              <div className="pg-cam-rail-kpis">
                <div>
                  <span>Điểm TB</span>
                  <b className="ok">{sessionStats.avg != null ? fmt(sessionStats.avg) : '—'}</b>
                </div>
                <div>
                  <span>Cần xem</span>
                  <b className={sessionStats.reviewCount > 0 ? 'warn' : ''}>{sessionStats.reviewCount}</b>
                </div>
              </div>

              {recentHistory.length === 0 ? (
                <div className="pg-cam-rail-empty">
                  <div className="pg-cam-rail-empty-ico">
                    <IcoSpark size={18} />
                  </div>
                  <b>Sẵn sàng chấm liên tục</b>
                  <p>Đặt phiếu A4 vào khung ngắm — điểm số từng em sẽ hiện tức thì tại đây.</p>
                </div>
              ) : (
                <div className="pg-cam-rail-list">
                  {recentHistory.slice(0, 8).map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className={'pg-cam-rail-item' + (h.duplicateSbd || h.needsReview ? ' warn' : '')}
                      onClick={() => { onClose?.(); onEditItem?.(h.id); }}
                    >
                      {h.thumbUrl && <img src={h.thumbUrl} alt="" />}
                      <div className="pg-cam-rail-item-info">
                        <b>{h.studentName || `SBD ${h.sbd || '---'}`}</b>
                        <small>SBD {h.sbd || '---'} · Mã {h.code || '—'}</small>
                      </div>
                      <strong className="pg-cam-rail-score">
                        {h.grade ? fmt(h.grade.score10) : '—'}
                      </strong>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ===== KHUNG NGẮM A4 TRUNG TÂM ===== */}
        <div className="pg-cam-vf-wrap">
          <div
            ref={viewfinderRef}
            className={'pg-cam-viewfinder' + (landscapeGuide ? ' landscape' : '') + (probe?.ready ? ' ready' : '')}
          >
            <ExamViewfinderGuide
              counts={counts}
              lockedCode={lockedCode}
              landscape={landscapeGuide}
              ready={Boolean(probe?.ready)}
              detected={Boolean(probe?.detected)}
              cornerMatched={probe?.cornerMatched}
              showGrid={showGuideGrid}
            />
            <div className="pg-cam-crosshair" aria-hidden="true" />
            <div className={'pg-cam-corner tl' + (probe?.ready || probe?.cornerMatched?.[landscapeGuide ? 'TR' : 'TL'] ? ' hit' : '')} />
            <div className={'pg-cam-corner tr' + (probe?.ready || probe?.cornerMatched?.[landscapeGuide ? 'BR' : 'TR'] ? ' hit' : '')} />
            <div className={'pg-cam-corner bl' + (probe?.ready || probe?.cornerMatched?.[landscapeGuide ? 'TL' : 'BL'] ? ' hit' : '')} />
            <div className={'pg-cam-corner br' + (probe?.ready || probe?.cornerMatched?.[landscapeGuide ? 'BL' : 'BR'] ? ' hit' : '')} />
            {!probe?.ready && <div className="pg-cam-scanbeam" />}
          </div>
        </div>

        {/* ===== THẺ KẾT QUẢ PRO + THUMBNAIL + CẢNH BÁO TRÙNG SBD ===== */}
        {(lastCapture || feedback) && !showSettingsSheet && !showHistory && (
          <div className="pg-cam-toast-stack">
            {lastCapture && (
              <div className={'pg-cam-result-card' + (!lastCapture.codeKnown || lastCapture.needsReview || lastCapture.duplicateSbd ? ' warn' : '')}>
                {lastCapture.duplicateSbd && (
                  <div className="pg-cam-dup-banner">
                    <IcoAlert size={13} />
                    <span>Trùng SBD {lastCapture.sbd} trong phiên quét — kiểm tra tránh chấm 2 lần!</span>
                  </div>
                )}

                <div className="pg-cam-result-top">
                  {lastCapture.thumbUrl && (
                    <button
                      type="button"
                      className="pg-cam-res-thumb"
                      onClick={() => {
                        const id = lastCapture.id;
                        onClose?.();
                        onEditItem?.(id);
                      }}
                      title="Bấm để xem ảnh phiếu & chỉnh ô tô"
                    >
                      <img src={lastCapture.thumbUrl} alt="Ảnh phiếu vừa chấm" />
                    </button>
                  )}

                  <div className="pg-cam-res-score">
                    <strong>{lastCapture.grade ? fmt(lastCapture.grade.score10) : '—'}</strong>
                    <small>/10</small>
                  </div>

                  <div className="pg-cam-res-info">
                    <span className="pg-cam-res-label">
                      SBD {lastCapture.sbd || '---'} · Mã {lastCapture.code || '---'}
                      {lastCapture.burstFrames > 1 && <em className="pg-cam-burst-tag">{lastCapture.burstFrames}×</em>}
                    </span>
                    <b>{lastCapture.studentName || 'Thí sinh chưa có trong danh sách lớp'}</b>
                  </div>

                  <button
                    type="button"
                    className="pg-cam-res-dismiss"
                    aria-label="Ẩn thẻ điểm"
                    onClick={() => setLastCapture(null)}
                  >
                    <IcoX size={14} />
                  </button>
                </div>

                {lastCapture.grade && (
                  <div className="pg-cam-res-parts">
                    {counts.p1 > 0 && (
                      <span>P.I <b>{lastCapture.grade.correct.p1}/{counts.p1}</b></span>
                    )}
                    {counts.p2 > 0 && (
                      <span>P.II <b>{fmt(lastCapture.grade.parts.p2)}đ</b></span>
                    )}
                    {counts.p3 > 0 && (
                      <span>P.III <b>{lastCapture.grade.correct.p3}/{counts.p3}</b></span>
                    )}
                    <span>Khớp <b>{Math.round((lastCapture.markFit || 0) * 100)}%</b></span>
                  </div>
                )}

                {lastCapture.p1Dots?.length > 0 && (
                  <div className="pg-cam-mini-dots" title="Chi tiết nhanh Phần I (Xanh = Đúng · Đỏ = Sai)">
                    {lastCapture.p1Dots.slice(0, 24).map((d) => (
                      <i key={d.q} className={d.ok ? 'ok' : 'bad'}>{d.q}</i>
                    ))}
                  </div>
                )}

                <div className="pg-cam-res-actions">
                  <button
                    type="button"
                    className="pg-cam-res-btn primary"
                    onClick={() => {
                      const id = lastCapture.id;
                      onClose?.();
                      onEditItem?.(id);
                    }}
                  >
                    <IcoEdit size={13} /> Xem &amp; Sửa ô
                  </button>
                  <button
                    type="button"
                    className="pg-cam-res-btn danger"
                    onClick={() => {
                      onRemoveItem?.(lastCapture.id);
                      setRecentHistory((cur) => cur.filter((x) => x.id !== lastCapture.id));
                      setLastCapture(null);
                      cooldownUntilRef.current = Date.now() + 800;
                      lastSignatureRef.current = { sig: '', at: 0 };
                      setFeedback({ ok: true, msg: 'Đã hủy phiếu vừa chụp — mời đặt lại phiếu vào khung.' });
                    }}
                  >
                    <IcoTrash size={13} /> Chụp lại
                  </button>
                </div>
              </div>
            )}

            {feedback && !lastCapture && (
              <div className={'pg-cam-feedback ' + (feedback.ok ? 'ok' : 'bad')}>
                <span>{feedback.msg}</span>
                <button
                  type="button"
                  className="pg-cam-fb-close"
                  aria-label="Đóng thông báo"
                  onClick={() => setFeedback(null)}
                >
                  <IcoX size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== BOTTOM CAMERA DOCK (MODE DIAL + ZOOM PRESETS + PRO SHUTTER) ===== */}
        <div className="pg-cam-dock">
          <div className="pg-cam-dock-top-strip">
            <div className="pg-cam-mode-dial" role="tablist" aria-label="Chế độ chụp">
              <button
                type="button"
                role="tab"
                aria-selected={autoCapture}
                className={autoCapture ? 'is-active' : ''}
                onClick={() => setAutoCapture(true)}
              >
                <IcoSpark size={12} />
                <span>Tự chụp</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!autoCapture}
                className={!autoCapture ? 'is-active' : ''}
                onClick={() => setAutoCapture(false)}
              >
                <span>Thủ công</span>
              </button>
            </div>

            <div className="pg-cam-zoom-bar">
              <div className="pg-cam-zoom-pills" role="group" aria-label="Mức phóng đại">
                {zoomPresets.map((z) => {
                  const active = Math.abs(zoom - z) < 0.12;
                  return (
                    <button
                      key={z}
                      type="button"
                      className={'pg-cam-zpill' + (active ? ' is-active' : '')}
                      onClick={() => handleZoomChange(z)}
                    >
                      {z === 1 ? '1×' : `${z}×`}
                    </button>
                  );
                })}
              </div>
              <label className="pg-cam-zoom-slider" title="Chỉnh mức thu phóng chi tiết">
                <input
                  type="range"
                  min="1"
                  max={maxZoom.toFixed(1)}
                  step="0.1"
                  value={zoom}
                  onChange={(e) => handleZoomChange(e.target.value)}
                />
                <span>{zoom.toFixed(1)}×</span>
              </label>
            </div>
          </div>

          <div className="pg-cam-shutter-row">
            <div className="pg-cam-dock-side is-left">
              {recentHistory.length > 0 && recentHistory[0].thumbUrl ? (
                <button
                  type="button"
                  className="pg-cam-gallery-thumb"
                  onClick={() => {
                    setShowSettingsSheet(false);
                    setShowHistory(true);
                  }}
                  title="Xem lại các phiếu đã quét"
                >
                  <img src={recentHistory[0].thumbUrl} alt="Phiếu gần nhất" />
                  <span>{recentHistory[0].grade ? fmt(recentHistory[0].grade.score10) : recentHistory.length}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={'pg-cam-circle-act' + (showGuideGrid ? ' on' : '')}
                  onClick={() => setShowGuideGrid((v) => !v)}
                  title={showGuideGrid ? 'Ẩn lưới cấu trúc đề' : 'Hiện lưới cấu trúc đề'}
                  aria-label="Bật tắt lưới"
                >
                  <IcoGrid size={18} />
                </button>
              )}
            </div>

            <div className="pg-cam-shutter-center">
              <button
                type="button"
                className={'pg-cam-shutter-ring' + (probe?.ready ? ' ready' : '') + (capturingBurst ? ' busy' : '')}
                style={lockProgress > 0 ? { '--pg-lock': `${lockProgress}%` } : undefined}
                onClick={() => captureAndScan('manual')}
                aria-label={probe?.ready ? 'Chụp và chấm chuẩn ngay' : 'Chụp thủ công'}
                title={probe?.ready ? 'Chụp & Chấm chuẩn' : 'Chụp thủ công'}
              >
                <span className="pg-cam-shutter-core">
                  {capturingBurst
                    ? <span className="pg-cam-spinner dark" aria-hidden="true" />
                    : (probe?.ready && <IcoCheck size={24} />)}
                </span>
              </button>
              <span className={'pg-cam-shutter-cap' + (probe?.ready ? ' ready' : '')}>
                {capturingBurst ? 'Đang quét 3×…' : probe?.ready ? 'Chụp & chấm' : 'Chụp tay'}
              </span>
            </div>

            <div className="pg-cam-dock-side is-right">
              {devices.length > 1 ? (
                <button
                  type="button"
                  className="pg-cam-circle-act"
                  onClick={handleCycleCamera}
                  title="Đổi camera (Trước / Sau / Webcam)"
                  aria-label="Đổi camera"
                >
                  <IcoSwitch size={19} />
                </button>
              ) : (
                <button
                  type="button"
                  className={'pg-cam-circle-act' + (landscapeGuide ? ' on' : '')}
                  onClick={() => setLandscapeGuide((v) => !v)}
                  title="Xoay khung ngắm A4 Đứng / Ngang"
                  aria-label="Xoay khung ngắm A4"
                >
                  <IcoRotate size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===== PRO SETTINGS BOTTOM SHEET (DESKTOP & MOBILE) ===== */}
        {showSettingsSheet && (
          <div className="pg-cam-sheet-backdrop" onClick={() => setShowSettingsSheet(false)}>
            <div className="pg-cam-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pg-cam-sheet-grip" />
              <div className="pg-cam-sheet-head">
                <strong>Cài đặt Camera chấm phiếu Pro</strong>
                <button type="button" className="pg-cam-iconbtn sm" onClick={() => setShowSettingsSheet(false)} aria-label="Đóng">
                  <IcoX size={16} />
                </button>
              </div>

              <div className="pg-cam-sheet-body">
                {mode === 'grade' && codeList.length > 0 && (
                  <div className="pg-cam-sheet-row">
                    <div>
                      <b>Mã đề áp dụng</b>
                      <small>Tự động đọc trên phiếu hoặc khóa cố định 1 mã</small>
                    </div>
                    <select
                      className="pg-cam-sheet-select"
                      value={lockedCode}
                      onChange={(e) => setLockedCode(e.target.value)}
                    >
                      <option value="auto">Tự đọc ({codeList.join(', ')})</option>
                      {codeList.map((c) => (
                        <option key={c} value={c}>Khóa mã {c}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pg-cam-sheet-row is-col">
                  <div>
                    <b>Độ nhạy nhận diện ô tô (Tự thích ứng)</b>
                    <small>Tối ưu riêng cho bút chì 2B tô nhạt hoặc giấy photo nền xám</small>
                  </div>
                  <div className="pg-cam-seg is-full">
                    <button type="button" className={sensitivity === 'light' ? 'on' : ''} onClick={() => setSensitivity('light')}>Chì 2B nhạt</button>
                    <button type="button" className={sensitivity === 'normal' ? 'on' : ''} onClick={() => setSensitivity('normal')}>Chuẩn (Tự động)</button>
                    <button type="button" className={sensitivity === 'strict' ? 'on' : ''} onClick={() => setSensitivity('strict')}>Giấy photo nhiễu</button>
                  </div>
                </div>

                <div className="pg-cam-sheet-row">
                  <div>
                    <b>Quét đa khung 3× (Siêu chính xác)</b>
                    <small>Chụp liên tiếp 3 ảnh &amp; bỏ phiếu loại nhiễu rung tay, chói đèn</small>
                  </div>
                  <button
                    type="button"
                    className={'pg-cam-switch' + (burstMode ? ' on' : '')}
                    onClick={() => setBurstMode((v) => !v)}
                    aria-pressed={burstMode}
                  >
                    <span />
                  </button>
                </div>

                <div className="pg-cam-sheet-row">
                  <div>
                    <b>Hướng khung ngắm A4</b>
                    <small>Chọn theo chiều đặt tờ giấy trên bàn</small>
                  </div>
                  <div className="pg-cam-seg">
                    <button type="button" className={!landscapeGuide ? 'on' : ''} onClick={() => setLandscapeGuide(false)}>A4 Đứng</button>
                    <button type="button" className={landscapeGuide ? 'on' : ''} onClick={() => setLandscapeGuide(true)}>A4 Ngang</button>
                  </div>
                </div>

                <div className="pg-cam-sheet-row">
                  <div>
                    <b>Lưới cấu trúc đề</b>
                    <small>Hiển thị vùng SBD, Mã đề và P.I–P.III</small>
                  </div>
                  <button
                    type="button"
                    className={'pg-cam-switch' + (showGuideGrid ? ' on' : '')}
                    onClick={() => setShowGuideGrid((v) => !v)}
                    aria-pressed={showGuideGrid}
                  >
                    <span />
                  </button>
                </div>

                <div className="pg-cam-sheet-row">
                  <div>
                    <b>Âm báo Bíp &amp; Rung phản hồi</b>
                    <small>Báo hiệu ngay khi chấm xong 1 bài (chấm liên tục không cần nhìn)</small>
                  </div>
                  <button
                    type="button"
                    className={'pg-cam-switch' + (soundHaptic ? ' on' : '')}
                    onClick={() => setSoundHaptic((v) => !v)}
                    aria-pressed={soundHaptic}
                  >
                    <span />
                  </button>
                </div>

                <div className="pg-cam-sheet-row">
                  <div>
                    <b>Đọc điểm bằng giọng nói</b>
                    <small>Phát loa tiếng Việt tên thí sinh &amp; điểm số sau mỗi bài</small>
                  </div>
                  <button
                    type="button"
                    className={'pg-cam-switch' + (voiceReadback ? ' on' : '')}
                    onClick={() => setVoiceReadback((v) => !v)}
                    aria-pressed={voiceReadback}
                  >
                    <span />
                  </button>
                </div>

                {devices.length > 1 && (
                  <button
                    type="button"
                    className="pg-cam-sheet-fullbtn"
                    onClick={() => {
                      handleCycleCamera();
                      setShowSettingsSheet(false);
                    }}
                  >
                    <IcoSwitch size={16} /> Chuyển đổi ống kính camera
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== SESSION HISTORY & LIVE STATS SHEET ===== */}
        {showHistory && (
          <div className="pg-cam-sheet-backdrop" onClick={() => setShowHistory(false)}>
            <div className="pg-cam-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pg-cam-sheet-grip" />
              <div className="pg-cam-sheet-head">
                <strong>Phiên chấm hiện tại ({recentHistory.length} phiếu)</strong>
                <button type="button" className="pg-cam-iconbtn sm" onClick={() => setShowHistory(false)} aria-label="Đóng">
                  <IcoX size={16} />
                </button>
              </div>

              {recentHistory.length > 0 && (
                <div className="pg-cam-stats-bar">
                  <div className="pg-cam-stat-box">
                    <span>Đã quét</span>
                    <b>{sessionStats.total}</b>
                  </div>
                  <div className="pg-cam-stat-box">
                    <span>Điểm TB</span>
                    <b className="is-em">{sessionStats.avg != null ? `${fmt(sessionStats.avg)}đ` : '—'}</b>
                  </div>
                  <div className="pg-cam-stat-box">
                    <span>Cần xem lại</span>
                    <b className={sessionStats.reviewCount > 0 ? 'is-warn' : ''}>{sessionStats.reviewCount}</b>
                  </div>
                </div>
              )}

              <div className="pg-cam-sheet-body">
                {recentHistory.length === 0 ? (
                  <p className="pg-cam-sheet-empty">
                    Chưa có phiếu nào được quét trong phiên này. Đưa 4 góc đen phiếu A4 vào khung để bắt đầu chấm.
                  </p>
                ) : (
                  <div className="pg-cam-history-list">
                    {recentHistory.map((h) => (
                      <div key={h.id} className="pg-cam-hist-row">
                        {h.thumbUrl && (
                          <img className="pg-cam-hist-thumb" src={h.thumbUrl} alt="" />
                        )}
                        <div className="pg-cam-hist-meta">
                          <b>{h.studentName || `SBD ${h.sbd || '---'}`}</b>
                          <small>
                            SBD {h.sbd || '---'} · Mã {h.code || '—'}
                            {h.duplicateSbd ? ' · Trùng SBD!' : ''}
                          </small>
                        </div>
                        <span className={'pg-cam-hist-score' + (!h.codeKnown || h.needsReview ? ' warn' : '')}>
                          {h.grade ? `${fmt(h.grade.score10)}đ` : '—'}
                        </span>
                        <button
                          type="button"
                          className="pg-cam-hist-edit"
                          onClick={() => { onClose?.(); onEditItem?.(h.id); }}
                        >
                          Sửa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
