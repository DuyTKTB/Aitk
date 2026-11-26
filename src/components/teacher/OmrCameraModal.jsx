/* ============================================================
   OmrCameraModal.jsx — Camera Chấm Phiếu A4 Chuẩn Studio (Desktop & Mobile)
   ------------------------------------------------------------
   Tính năng:
   - Toàn màn hình chuẩn Camera Pro (HUD nổi kính mờ, tối ưu thao tác 1 tay trên điện thoại).
   - Khung ngắm A4 đồng bộ 100% cấu trúc đề (P.I, P.II, P.III) + chế độ lưới tinh gọn.
   - Nhận dạng 4 ô định vị góc thời gian thực (probeSheetAlignment) + vẽ khung AR 4 góc.
   - Chế độ Tự Chụp Khi Khóa Chuẩn 4 góc (Auto-Capture) + chống quét trùng liên tiếp.
   - Quét 2 tầng: vùng cắt gọn trong khung ngắm + toàn khung hình để loại nhiễu bàn.
   - Chọn camera, bật Flash/Torch, zoom nhanh (1x / 1.5x / 2x), khóa Mã đề, đọc điểm giọng nói.
   ============================================================ */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { probeSheetAlignment, readSheet, TEMPLATE } from '../../lib/omr.js';
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
              {/* Vòng định vị ngoài */}
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
              {/* Ô vuông mục tiêu ở tâm */}
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
            {/* Khung SBD & Mã đề góc trên phải */}
            <rect
              x="1792" y="260" width="298" height="785" rx="14"
              fill="rgba(255,255,255,0.03)"
              stroke={accent}
              strokeWidth="4"
              strokeDasharray="16 12"
            />
            <text x="1941" y="236" textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize="34" fontWeight="700">
              SBD
            </text>

            <rect
              x="2168" y="260" width="154" height="785" rx="14"
              fill="rgba(56,189,248,0.08)"
              stroke={accent}
              strokeWidth="4"
            />
            <text x="2245" y="236" textAnchor="middle" fill="#bae6fd" fontSize="32" fontWeight="700">
              {lockedCode !== 'auto' ? `MÃ ${lockedCode}` : 'MÃ ĐỀ'}
            </text>

            {/* PHẦN I: chỉ hiển thị các khối có câu hỏi để màn hình thoáng sạch */}
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

            {/* PHẦN II: chỉ hiển thị các khối có câu Đúng/Sai */}
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

            {/* PHẦN III: chỉ hiển thị các cột có câu Trả lời ngắn */}
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
  mode = 'grade', // 'grade' (chấm bài HS) | 'key' (quét phiếu đáp án gốc của giáo viên)
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

  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomCap, setZoomCap] = useState(null); // { min, max, step } | null
  const [zoom, setZoom] = useState(1);
  const [landscapeGuide, setLandscapeGuide] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
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

  const maxPts = useMemo(() => maxScore(counts, scoring), [counts, scoring]);
  const maxZoom = useMemo(() => (zoomCap ? Math.min(3, zoomCap.max) : 2.2), [zoomCap]);
  const zoomPresets = useMemo(() => {
    const base = [1, 1.5, 2];
    return base.filter((z) => z <= maxZoom + 0.05);
  }, [maxZoom]);

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
      try { window.speechSynthesis?.cancel?.(); } catch {}
      setProbe(null);
      setZoom(1);
      setLastCapture(null);
      setRecentHistory([]);
      setShowHistory(false);
      setShowSettingsSheet(false);
      setFeedback(null);
      readyStreakRef.current = 0;
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

  const handleZoomChange = async (val) => {
    const z = Number(val) || 1;
    setZoom(z);
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (track && zoomCap) {
      try {
        const clamped = Math.max(zoomCap.min, Math.min(zoomCap.max, z));
        await track.applyConstraints({ advanced: [{ zoom: clamped }] });
      } catch {}
    }
  };

  const handleCycleCamera = () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === selectedDeviceId);
    const next = devices[(idx + 1) % devices.length];
    if (next) startStream(next.deviceId);
  };

  /** Trích tọa độ vùng ROI trong khung ngắm (có mở rộng nhẹ 10% để không cắt mất vạch đen ở mép). */
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

  const triggerShutterFlash = () => {
    setFlashPulse(true);
    setTimeout(() => setFlashPulse(false), 220);
  };

  const captureAndScan = useCallback(async (source = 'manual') => {
    if (busyScanRef.current) return;
    if (mode === 'grade' && !vipUnlocked && omrRemaining <= 0) {
      onQuotaExhausted?.();
      return;
    }
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    busyScanRef.current = true;
    triggerShutterFlash();
    try {
      const info = computeFrameAndRoi(video);
      const canvas = captureCanvasRef.current || document.createElement('canvas');
      captureCanvasRef.current = canvas;
      canvas.width = info.srcW;
      canvas.height = info.srcH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, info.srcX, info.srcY, info.srcW, info.srcH, 0, 0, info.srcW, info.srcH);

      let read = null;
      let camQ = null;
      let usedCrop = null;

      // Tầng 1 (Ưu tiên): cắt gọn trong khung ngắm A4 để loại bỏ đồ vật trên bàn
      if (info.roi) {
        const { rx, ry, rw, rh } = info.roi;
        const roiImg = ctx.getImageData(rx, ry, rw, rh);
        const roiRead = readSheet(roiImg);
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

      // Tầng 2: Nếu khung ngắm chưa khớp >= 75%, thử thêm toàn khung hình và chọn bản tốt hơn
      if (!read || !read.ok || (read.quality?.markFit ?? 0) < 0.75) {
        const fullImg = ctx.getImageData(0, 0, info.srcW, info.srcH);
        const fullRead = readSheet(fullImg);
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

      if (!read || !read.ok) {
        if (source === 'manual') {
          setFeedback({
            ok: false,
            msg: read?.error || 'Chưa nhận đủ 4 ô vuông đen ở 4 góc phiếu A4. Đưa phiếu khít khung hơn!',
          });
        }
        return;
      }

      // Chế độ QUÉT ĐÁP ÁN GỐC
      if (mode === 'key') {
        if (source === 'auto' && read.quality?.warn) {
          return;
        }
        const keyRes = answerKeyFromSheetRead(read, counts);
        const targetCode = keyRes.code || (lockedCode !== 'auto' ? lockedCode : '');
        const resolved = { ...keyRes, code: targetCode };
        cooldownUntilRef.current = Date.now() + 2600;
        readyStreakRef.current = 0;
        setFeedback({
          ok: !read.quality?.warn,
          msg: read.quality?.warn
            ? `Đã đọc Phiếu Đáp Án Gốc nhưng ${read.quality.warn} (P.I ${resolved.filledCount.p1} · P.II ${resolved.filledCount.p2} · P.III ${resolved.filledCount.p3})`
            : `Đã đọc Phiếu Đáp Án Gốc${targetCode ? ` (Mã ${targetCode})` : ''}: P.I ${resolved.filledCount.p1} · P.II ${resolved.filledCount.p2} · P.III ${resolved.filledCount.p3}`,
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
        setFeedback({ ok: true, msg: `Đã lưu SBD ${read.sbd || '---'} — Đặt phiếu tiếp theo vào khung để tự chấm.` });
        return;
      }
      lastSignatureRef.current = { sig, at: now };
      cooldownUntilRef.current = now + 2600;
      readyStreakRef.current = 0;

      let thumbUrl;
      if (usedCrop) {
        const cropCv = document.createElement('canvas');
        cropCv.width = usedCrop.rw;
        cropCv.height = usedCrop.rh;
        cropCv.getContext('2d').drawImage(canvas, usedCrop.rx, usedCrop.ry, usedCrop.rw, usedCrop.rh, 0, 0, usedCrop.rw, usedCrop.rh);
        thumbUrl = cropCv.toDataURL('image/jpeg', 0.86);
      } else {
        thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
      }

      const grade = codeKnown ? gradeSheet(read, keys[finalCode], counts, scoring) : null;
      const camWarnMsg = read.quality?.warn || (!camQ?.ok ? camQ?.issues?.[0] || 'Chất lượng ảnh chưa đạt chuẩn.' : null);
      const item = {
        id: `cam${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        fileName: `camera_${read.sbd || Date.now()}.jpg`,
        url: thumbUrl,
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
        sbd: read.sbd,
        studentName: matchedStudent?.name || '',
        code: finalCode,
        codeKnown,
        grade,
        p1Dots,
        markFit: read.quality?.markFit ?? 0,
        needsReview: item.needsReview,
      };
      setLastCapture(captureSummary);
      setRecentHistory((cur) => [captureSummary, ...cur].slice(0, 40));

      if (voiceReadback) {
        const spokenName = matchedStudent?.name || (read.sbd && !read.sbd.includes('?') ? `Số báo danh ${read.sbd}` : 'Chưa rõ số báo danh');
        speakVi(codeKnown && grade ? `${spokenName}, ${String(round2(grade.score10)).replace('.', ' phẩy ')} điểm` : `${spokenName}, cần kiểm tra mã đề`);
      }

      setFeedback({
        ok: codeKnown,
        msg: codeKnown
          ? `Đã chấm (${source === 'auto' ? 'Tự chụp' : 'Thủ công'}) · SBD ${read.sbd || '---'} · Mã ${finalCode} · ${fmt(grade?.score10)}đ`
          : `Đã chụp SBD ${read.sbd || '---'} nhưng Mã đề "${read.code || '---'}" chưa có trong bài chấm!`,
      });

      onScanned?.({ item, grade, read, codeKnown });
    } catch (err) {
      setFeedback({ ok: false, msg: `Lỗi xử lý ảnh camera: ${err?.message || 'Thử lại'}` });
    } finally {
      busyScanRef.current = false;
    }
  }, [
    mode, vipUnlocked, omrRemaining, onQuotaExhausted, computeFrameAndRoi,
    lockedCode, keys, codeList, counts, scoring, paper, voiceReadback, onScanned, onKeyCaptured,
  ]);

  /* Vòng lặp thăm dò căn chỉnh 4 góc thời gian thực (~3.2 fps) */
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
        if (readyStreakRef.current >= 2) {
          readyStreakRef.current = 0;
          captureAndScan('auto');
        }
      } else if (!scaledRes.ready) {
        readyStreakRef.current = 0;
      }
    }, 320);

    return () => clearInterval(timer);
  }, [open, loading, autoCapture, computeFrameAndRoi, drawArOverlay, captureAndScan]);

  if (!open) return null;

  const cornersCount = probe?.cornersCount || 0;
  const cornerKeys = ['TL', 'TR', 'BL', 'BR'];
  const statusText = probe?.ready
    ? (autoCapture ? 'Khóa chuẩn 4 góc — Đang tự chấm…' : 'Khóa chuẩn 4 góc — Bấm chụp ngay!')
    : (probe?.hint || 'Căn 4 ô vuông đen ở 4 góc phiếu vào 4 ô ngắm');

  return (
    <div
      className="pg-cam-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Camera chấm phiếu A4 theo đề"
    >
      {/* Toàn màn hình Camera + AR Overlay */}
      <div className="pg-cam-body">
        {loading && (
          <div className="pg-cam-loading">
            <span className="pg-cam-spinner" aria-hidden="true" />
            <span>Đang khởi động camera…</span>
          </div>
        )}

        <div
          className="pg-cam-stage"
          style={zoom > 1 && !zoomCap ? { transform: `scale(${zoom.toFixed(2)})` } : undefined}
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
            {/* Bộ công cụ nhanh trên Desktop (ẩn trên mobile nhỏ để gom vào bảng Cài đặt) */}
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
                className={'pg-cam-iconbtn' + (torchOn ? ' is-warn' : '')}
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
                title="Xem các phiếu đã quét trong phiên này"
              >
                <IcoLayers size={14} />
                <span>{scannedCount}</span>
                <em className="pg-cam-count-word">phiếu</em>
              </button>
            )}

            {/* Nút mở Bảng Cài Đặt Nhanh trên Mobile */}
            <button
              type="button"
              className={'pg-cam-iconbtn pg-cam-mobile-only' + (showSettingsSheet ? ' is-active' : '')}
              onClick={() => {
                setShowHistory(false);
                setShowSettingsSheet((v) => !v);
              }}
              aria-label="Tùy chỉnh camera"
              title="Tùy chỉnh camera"
            >
              <IcoSliders size={17} />
            </button>
          </div>
        </header>

        {/* ===== DYNAMIC ISLAND STATUS PILL ===== */}
        <div className="pg-cam-status-row">
          <div className={'pg-cam-status' + (probe?.ready ? ' ready' : probe?.detected ? ' warn' : '')}>
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
        </div>

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
            <div className={'pg-cam-corner tl' + (probe?.ready || probe?.cornerMatched?.[landscapeGuide ? 'TR' : 'TL'] ? ' hit' : '')} />
            <div className={'pg-cam-corner tr' + (probe?.ready || probe?.cornerMatched?.[landscapeGuide ? 'BR' : 'TR'] ? ' hit' : '')} />
            <div className={'pg-cam-corner bl' + (probe?.ready || probe?.cornerMatched?.[landscapeGuide ? 'TL' : 'BL'] ? ' hit' : '')} />
            <div className={'pg-cam-corner br' + (probe?.ready || probe?.cornerMatched?.[landscapeGuide ? 'BL' : 'BR'] ? ' hit' : '')} />
            {!probe?.ready && <div className="pg-cam-scanline" />}
          </div>
        </div>

        {/* ===== THẺ KẾT QUẢ / FEEDBACK NỔI GỌN TRÊN THANH CHỤP ===== */}
        {(lastCapture || feedback) && !showSettingsSheet && !showHistory && (
          <div className="pg-cam-toast-stack">
            {lastCapture && (
              <div className={'pg-cam-result-card' + (!lastCapture.codeKnown || lastCapture.needsReview ? ' warn' : '')}>
                <div className="pg-cam-result-top">
                  <div className="pg-cam-res-score">
                    <strong>{lastCapture.grade ? fmt(lastCapture.grade.score10) : '—'}</strong>
                    <small>/10</small>
                  </div>

                  <div className="pg-cam-res-info">
                    <span className="pg-cam-res-label">
                      SBD {lastCapture.sbd || '---'} · Mã {lastCapture.code || '---'}
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

        {/* ===== BOTTOM CAMERA DOCK (PRO SHUTTER + ZOOM PRESETS) ===== */}
        <div className="pg-cam-dock">
          {/* Hàng Zoom nhanh 1× · 1.5× · 2× + thanh trượt mịn trên Desktop */}
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

          {/* Hàng Shutter chính: [Tự chụp] — [NÚT CHỤP TRÒN PRO] — [Đổi Cam / Xoay A4] */}
          <div className="pg-cam-shutter-row">
            <div className="pg-cam-dock-side is-left">
              <button
                type="button"
                className={'pg-cam-auto-pill' + (autoCapture ? ' on' : '')}
                onClick={() => setAutoCapture((v) => !v)}
                title="Tự động chụp & chấm ngay khi khóa đủ 4 góc phiếu"
              >
                <span className="pg-cam-auto-dot" aria-hidden="true" />
                <IcoSpark size={14} />
                <span>{autoCapture ? 'Tự chụp' : 'Thủ công'}</span>
              </button>
            </div>

            <div className="pg-cam-shutter-center">
              <button
                type="button"
                className={'pg-cam-shutter-ring' + (probe?.ready ? ' ready' : '')}
                onClick={() => captureAndScan('manual')}
                aria-label={probe?.ready ? 'Chụp và chấm chuẩn ngay' : 'Chụp thủ công'}
                title={probe?.ready ? 'Chụp & Chấm chuẩn' : 'Chụp thủ công'}
              >
                <span className="pg-cam-shutter-core">
                  {probe?.ready && <IcoCheck size={24} />}
                </span>
              </button>
              <span className={'pg-cam-shutter-cap' + (probe?.ready ? ' ready' : '')}>
                {probe?.ready ? 'Chụp & chấm' : 'Chụp tay'}
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

        {/* ===== MOBILE / QUICK SETTINGS BOTTOM SHEET ===== */}
        {showSettingsSheet && (
          <div className="pg-cam-sheet-backdrop" onClick={() => setShowSettingsSheet(false)}>
            <div className="pg-cam-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pg-cam-sheet-grip" />
              <div className="pg-cam-sheet-head">
                <strong>Tùy chỉnh Camera chấm phiếu</strong>
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
                    <b>Đọc điểm bằng giọng nói</b>
                    <small>Phát loa tiếng Việt ngay sau mỗi bài chấm</small>
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

        {/* ===== SESSION HISTORY SHEET ===== */}
        {showHistory && (
          <div className="pg-cam-sheet-backdrop" onClick={() => setShowHistory(false)}>
            <div className="pg-cam-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="pg-cam-sheet-grip" />
              <div className="pg-cam-sheet-head">
                <strong>Phiếu đã quét phiên này ({recentHistory.length})</strong>
                <button type="button" className="pg-cam-iconbtn sm" onClick={() => setShowHistory(false)} aria-label="Đóng">
                  <IcoX size={16} />
                </button>
              </div>
              <div className="pg-cam-sheet-body">
                {recentHistory.length === 0 ? (
                  <p className="pg-cam-sheet-empty">
                    Chưa có phiếu nào được quét trong phiên này. Đưa 4 góc đen phiếu A4 vào khung để bắt đầu chấm.
                  </p>
                ) : (
                  <div className="pg-cam-history-list">
                    {recentHistory.map((h) => (
                      <div key={h.id} className="pg-cam-hist-row">
                        <div className="pg-cam-hist-meta">
                          <b>{h.studentName || `SBD ${h.sbd || '---'}`}</b>
                          <small>SBD {h.sbd || '---'} · Mã {h.code || '—'}</small>
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
