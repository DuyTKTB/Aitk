/* ============================================================
   OmrCameraModal.jsx — Camera Chấm Phiếu A4 Theo Đề Chuẩn Bộ GD&ĐT
   ------------------------------------------------------------
   Tính năng:
   - Khung ngắm A4 hiển thị trực tiếp cấu trúc đề đang chấm (P.I, P.II, P.III).
   - Nhận dạng vạch định vị thời gian thực (probeSheetAlignment) + vẽ khung AR 4 góc.
   - Chế độ Tự Chụp Khi Khóa Chuẩn 4 góc (Auto-Capture) + chống quét trùng liên tiếp.
   - Quét 2 tầng: toàn khung hình + vùng cắt gọn trong khung ngắm để loại nhiễu bàn.
   - Chọn camera (sau / doc-cam / webcam), bật Flash/Torch, zoom, khóa Mã đề nhanh.
   ============================================================ */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { probeSheetAlignment, readSheet, TEMPLATE } from '../../lib/omr.js';
import { IMG_LIMITS, measureImageQuality } from '../../lib/omrQuality.js';
import { answerKeyFromSheetRead, gradeSheet, maxScore, round2 } from '../../lib/paperGrade.js';

const Svg = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcoCamera = (p) => <Svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></Svg>;
const IcoX = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
const IcoRotate = (p) => <Svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 10 15 10" /></Svg>;
const IcoBolt = (p) => <Svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>;
const IcoSwitch = (p) => <Svg {...p}><path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /><path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" /><circle cx="12" cy="12" r="3" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoEdit = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>;
const IcoTrash = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Svg>;
const IcoVolume = (p) => <Svg {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></Svg>;

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

/** Hình khung ngắm vector đồng bộ 100% với cấu trúc đề đang chấm + 4 ô định vị góc kiểu TNMaker. */
function ExamViewfinderGuide({ counts, lockedCode, landscape, ready, detected, cornerMatched = {} }) {
  const accent = ready ? '#10b981' : detected ? '#38bdf8' : 'rgba(255,255,255,0.65)';
  const dimOpacity = 0.2;
  const p1Blocks = [148, 708, 1268, 1828];

  return (
    <svg
      className={'pg-cam-guide-svg' + (landscape ? ' landscape' : '')}
      viewBox={landscape ? `0 0 ${TEMPLATE.height} ${TEMPLATE.width}` : `0 0 ${TEMPLATE.width} ${TEMPLATE.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g transform={landscape ? `translate(0, ${TEMPLATE.width}) rotate(-90)` : undefined}>
      {/* 4 ô vuông định vị góc kiểu TNMaker (khớp 1:1 với 4 ô đen 56x56 trên giấy A4) */}
      {Object.entries(TEMPLATE.corners).map(([key, [cx, cy]]) => {
        const isHit = Boolean(ready || cornerMatched?.[key]);
        const cColor = isHit ? '#10b981' : '#38bdf8';
        return (
          <g key={key}>
            {/* Vòng ngắm vuông ngoài */}
            <rect
              x={cx - 64}
              y={cy - 64}
              width="128"
              height="128"
              rx="14"
              fill={isHit ? 'rgba(16,185,129,0.22)' : 'rgba(15,23,42,0.52)'}
              stroke={cColor}
              strokeWidth="6"
            />
            {/* Khung ô đen 56x56 chuẩn giấy đặt lọt vào giữa */}
            <rect
              x={cx - 32}
              y={cy - 32}
              width="64"
              height="64"
              rx="6"
              fill={isHit ? '#10b981' : 'rgba(255,255,255,0.16)'}
              fillOpacity={isHit ? '0.9' : '0.45'}
              stroke="#ffffff"
              strokeWidth="4"
            />
          </g>
        );
      })}

      {/* Khung SBD & Mã đề góc trên phải */}
      <rect x="1792" y="260" width="298" height="785" rx="12" fill="none" stroke={accent} strokeWidth="5" strokeDasharray="16 10" />
      <text x="1941" y="242" textAnchor="middle" fill="#ffffff" fontSize="34" fontWeight="800">7. SBD</text>

      <rect x="2168" y="260" width="154" height="785" rx="12" fill="rgba(56,189,248,0.12)" stroke={accent} strokeWidth="5" />
      <text x="2245" y="242" textAnchor="middle" fill="#ffffff" fontSize="32" fontWeight="800">
        {lockedCode !== 'auto' ? `MÃ ${lockedCode}` : '8. MÃ ĐỀ'}
      </text>

      {/* PHẦN I theo đúng số câu của đề */}
      {p1Blocks.map((fx, b) => {
        const startQ = b * 10 + 1;
        const activeRows = Math.max(0, Math.min(10, (counts.p1 || 0) - b * 10));
        const activeH = activeRows > 0 ? 58 + (activeRows / 10) * 618 : 0;
        return (
          <g key={b} opacity={activeRows > 0 ? 0.92 : dimOpacity}>
            <rect x={fx} y="1170" width="470" height="676" rx="10" fill="none" stroke={accent} strokeWidth="4" strokeDasharray="14 10" />
            {activeRows > 0 && (
              <rect x={fx} y="1170" width="470" height={activeH} rx="10" fill="rgba(16,185,129,0.12)" stroke="#34d399" strokeWidth="5" />
            )}
            <text x={fx + 235} y="1152" textAnchor="middle" fill="#e2e8f0" fontSize="28" fontWeight="800">
              {activeRows > 0 ? `P.I: Câu ${startQ}–${startQ + activeRows - 1}` : `Khối ${startQ}–${startQ + 9} (trống)`}
            </text>
          </g>
        );
      })}

      {/* PHẦN II theo số câu Đúng/Sai của đề */}
      {p1Blocks.map((fx, b) => {
        const q1 = b * 2 + 1;
        const activeInBlock = Math.max(0, Math.min(2, (counts.p2 || 0) - b * 2));
        return (
          <g key={`p2-${b}`} opacity={activeInBlock > 0 ? 0.92 : dimOpacity}>
            <rect
              x={fx}
              y="1940"
              width={activeInBlock === 1 ? 235 : 470}
              height="385"
              rx="10"
              fill={activeInBlock > 0 ? 'rgba(56,189,248,0.12)' : 'none'}
              stroke={activeInBlock > 0 ? '#38bdf8' : accent}
              strokeWidth="4"
            />
            {activeInBlock > 0 && (
              <text x={fx + 16} y="1928" fill="#bae6fd" fontSize="26" fontWeight="800">
                P.II C.{q1}{activeInBlock === 2 ? `–${q1 + 1}` : ''}
              </text>
            )}
          </g>
        );
      })}

      {/* PHẦN III theo số câu Trả lời ngắn của đề */}
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const x = 148 + k * 358;
        const active = k < (counts.p3 || 0);
        return (
          <g key={`p3-${k}`} opacity={active ? 0.92 : dimOpacity}>
            <rect
              x={x}
              y="2424"
              width="350"
              height="900"
              rx="10"
              fill={active ? 'rgba(245,158,11,0.10)' : 'none'}
              stroke={active ? '#fbbf24' : accent}
              strokeWidth="4"
            />
            <text x={x + 175} y="2412" textAnchor="middle" fill={active ? '#fde68a' : '#94a3b8'} fontSize="26" fontWeight="800">
              {active ? `P.III C.${k + 1}` : '—'}
            </text>
          </g>
        );
      })}
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
  const [lockedCode, setLockedCode] = useState('auto');
  const [probe, setProbe] = useState(null);
  const [lastCapture, setLastCapture] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const maxPts = useMemo(() => maxScore(counts, scoring), [counts, scoring]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const startStream = useCallback(async (deviceId = '') => {
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
        // Kích hoạt lấy nét liên tục nếu phần cứng hỗ trợ
        if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
        }
      }

      if (navigator.mediaDevices.enumerateDevices) {
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((d) => d.kind === 'videoinput'));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play?.().catch(() => {});
      }
    } catch (err) {
      setFeedback({ ok: false, msg: `Không thể mở camera: ${err?.message || 'Vui lòng cấp quyền camera.'}` });
    } finally {
      setLoading(false);
    }
  }, [stopStream]);

  useEffect(() => {
    if (!open) {
      stopStream();
      setProbe(null);
      setLastCapture(null);
      setRecentHistory([]);
      setShowHistory(false);
      setFeedback(null);
      readyStreakRef.current = 0;
      return;
    }
    setLockedCode(codeList.length === 1 ? 'auto' : 'auto');
    startStream('');
    return () => {
      stopStream();
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

  /** Trích tọa độ vùng ROI trong khung ngắm (có mở rộng nhẹ 7% để không cắt mất vạch đen ở mép). */
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
    ctx.fillStyle = pRes.ready ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.08)';
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

  const captureAndScan = useCallback(async (source = 'manual') => {
    if (busyScanRef.current) return;
    if (mode === 'grade' && !vipUnlocked && omrRemaining <= 0) {
      onQuotaExhausted?.();
      return;
    }
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    busyScanRef.current = true;
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

      // Tầng 1 (Ưu tiên): cắt gọn trong khung ngắm A4 để loại bỏ đồ vật trên bàn và giữ 4 ô góc rõ nhất
      if (info.roi) {
        const { rx, ry, rw, rh } = info.roi;
        const roiImg = ctx.getImageData(rx, ry, rw, rh);
        const roiRead = readSheet(roiImg);
        if (roiRead.ok) {
          read = roiRead;
          camQ = measureImageQuality(roiImg, { ...IMG_LIMITS, minWidth: 460, minHeight: 580, maxBrightness: 252 });
          usedCrop = info.roi;
        }
      }

      // Tầng 2: Nếu khung ngắm chưa khớp >= 75%, thử thêm toàn khung hình và chọn bản có độ khớp cao hơn
      if (!read || !read.ok || (read.quality?.markFit ?? 0) < 0.75) {
        const fullImg = ctx.getImageData(0, 0, info.srcW, info.srcH);
        const fullRead = readSheet(fullImg);
        const scoreOf = (r) => (r?.ok ? (r.quality?.markFit ?? 0) + (r.quality?.alignment ?? 0) * 0.5 : -1);
        if (scoreOf(fullRead) > scoreOf(read)) {
          read = fullRead;
          camQ = measureImageQuality(fullImg, { ...IMG_LIMITS, minWidth: 640, minHeight: 480, maxBrightness: 250 });
          usedCrop = null;
        }
      }

      if (!read.ok) {
        if (source === 'manual') {
          setFeedback({
            ok: false,
            msg: read.error || 'Chưa nhận đủ 4 góc & vạch mép phiếu A4. Hãy đưa phiếu khít khung hơn!',
          });
        }
        return;
      }

      // Chế độ QUÉT ĐÁP ÁN GỐC (nhập đáp án bằng cách quét tờ tô chuẩn của giáo viên)
      if (mode === 'key') {
        const keyRes = answerKeyFromSheetRead(read, counts);
        const targetCode = keyRes.code || (lockedCode !== 'auto' ? lockedCode : '');
        const resolved = { ...keyRes, code: targetCode };
        cooldownUntilRef.current = Date.now() + 2600;
        readyStreakRef.current = 0;
        setFeedback({
          ok: true,
          msg: `Đã đọc Phiếu Đáp Án Gốc${targetCode ? ` (Mã ${targetCode})` : ''}: P.I ${resolved.filledCount.p1} câu · P.II ${resolved.filledCount.p2} câu · P.III ${resolved.filledCount.p3} câu`,
        });
        if (voiceReadback) speakVi(`Đã nhận đáp án gốc, phần một ${resolved.filledCount.p1} câu`);
        onKeyCaptured?.(resolved);
        return;
      }

      // Khóa Mã đề nếu giáo viên chọn sẵn trên Camera, hoặc dùng mã đọc từ phiếu
      let finalCode = read.code;
      if (lockedCode !== 'auto' && keys[lockedCode]) {
        finalCode = lockedCode;
      } else if (!keys[finalCode] && codeList.length === 1) {
        finalCode = codeList[0];
      }
      const codeKnown = Boolean(keys[finalCode]);

      // Chống tự chụp trùng đúng 1 tờ đang để nguyên trên bàn trong 7 giây
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

      // Ảnh xem lại: cắt đúng khung nếu chụp thành công từ ROI
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
      const item = {
        id: `cam${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
        fileName: `camera_${read.sbd || Date.now()}.jpg`,
        url: thumbUrl,
        status: 'done',
        sbd: read.sbd,
        code: finalCode,
        readCode: read.code,
        read: { p1: read.p1, p2: read.p2, p3: read.p3 },
        issues: [...(read.issues || []), ...camQ.issues],
        quality: { ...(read.quality || {}), image: camQ, warn: read.quality?.warn || !camQ.ok },
        needsReview: !codeKnown || (read.issues && read.issues.length > 0)
          || !read.sbd || read.sbd.includes('?') || !camQ.ok,
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
          ? `Đã chấm (${source === 'auto' ? 'Tự chụp' : 'Thủ công'}) · SBD ${read.sbd || '---'} · Mã ${finalCode} · ${fmt(grade?.score10)} điểm`
          : `Đã chụp SBD ${read.sbd || '---'} nhưng Mã đề "${read.code || '---'}" chưa có trong bài chấm — cần kiểm tra!`,
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
        const scale = Math.min(1, 680 / Math.max(sw, sh));
        const pw = Math.max(64, Math.round(sw * scale));
        const ph = Math.max(64, Math.round(sh * scale));
        if (pCanvas.width !== pw || pCanvas.height !== ph) {
          pCanvas.width = pw;
          pCanvas.height = ph;
        }
        pCtx.drawImage(video, sx, sy, sw, sh, 0, 0, pw, ph);
        const pImg = pCtx.getImageData(0, 0, pw, ph);
        const res = probeSheetAlignment(pImg, { detectMaxDim: 680 });
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

      // Ưu tiên thăm dò vùng khung ngắm A4 (giữ độ phân giải cao cho 4 ô vuông góc dù cam 16:9);
      // nếu chưa thấy đủ, mở rộng quét toàn khung hình.
      let scaledRes = info.roi
        ? probeRegion(info.srcX + info.roi.rx, info.srcY + info.roi.ry, info.roi.rw, info.roi.rh, info.roi.rx, info.roi.ry)
        : probeRegion(info.srcX, info.srcY, info.srcW, info.srcH, 0, 0);

      if (info.roi && !scaledRes.ready && !scaledRes.detected) {
        const fullRes = probeRegion(info.srcX, info.srcY, info.srcW, info.srcH, 0, 0);
        if (fullRes.ready || fullRes.detected || (fullRes.hits || 0) > (scaledRes.hits || 0)) {
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

  return (
    <div
      className="pg-cam-modal animate-pop"
      role="dialog"
      aria-modal="true"
      aria-label="Camera chấm phiếu A4 theo đề"
    >
      {/* Header theo đề thi hiện tại */}
      <header className="pg-cam-head">
        <div className="pg-cam-titlebox">
          <IcoCamera size={21} color={mode === 'key' ? '#f59e0b' : '#38bdf8'} />
          <div>
            <strong>
              {mode === 'key'
                ? 'QUÉT PHIẾU ĐÁP ÁN MẪU (Tạo đáp án tự động)'
                : (paper?.title || 'Camera Chấm Phiếu OMR Theo Đề')}
            </strong>
            <div className="pg-cam-exam-pills">
              <span className="pg-cam-pill">Cấu trúc {counts.p1}·{counts.p2}·{counts.p3}</span>
              {mode === 'grade' && <span className="pg-cam-pill">Thang {fmt(maxPts)}đ</span>}
              {mode === 'grade' && (
                <button
                  type="button"
                  className="pg-cam-pill ok"
                  style={{ cursor: 'pointer', border: '1px solid rgba(16,185,129,0.5)' }}
                  onClick={() => setShowHistory((v) => !v)}
                  title="Xem nhanh các phiếu vừa quét trong phiên này"
                >
                  Đã quét: {scannedCount} phiếu {recentHistory.length > 0 ? (showHistory ? '▲' : '▼') : ''}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pg-cam-head-tools">
          {mode === 'grade' && codeList.length > 0 && (
            <label className="pg-cam-code-select">
              <span>Mã đề:</span>
              <select value={lockedCode} onChange={(e) => setLockedCode(e.target.value)}>
                <option value="auto">Tự đọc từ phiếu ({codeList.join(', ')})</option>
                {codeList.map((c) => (
                  <option key={c} value={c}>Khóa cố định Mã {c}</option>
                ))}
              </select>
            </label>
          )}

          {devices.length > 1 && (
            <button type="button" className="pg-cam-toolbtn" onClick={handleCycleCamera} title="Đổi camera (Trước / Sau / Webcam)">
              <IcoSwitch size={15} /> Đổi Cam
            </button>
          )}
          {torchSupported && (
            <button type="button" className={'pg-cam-toolbtn' + (torchOn ? ' on' : '')} onClick={handleToggleTorch} title="Bật / tắt đèn Flash">
              <IcoBolt size={15} /> {torchOn ? 'Tắt Đèn' : 'Đèn'}
            </button>
          )}
          <button
            type="button"
            className={'pg-cam-toolbtn' + (landscapeGuide ? ' on' : '')}
            onClick={() => setLandscapeGuide((v) => !v)}
            title="Xoay khung ngắm A4 Đứng / Ngang"
          >
            <IcoRotate size={15} /> {landscapeGuide ? 'A4 Ngang' : 'A4 Đứng'}
          </button>
          <button
            type="button"
            className={'pg-cam-toolbtn' + (voiceReadback ? ' on' : '')}
            onClick={() => setVoiceReadback((v) => !v)}
            title="Đọc to điểm số bằng giọng nói tiếng Việt sau mỗi bài chấm"
          >
            <IcoVolume size={15} /> {voiceReadback ? 'Đọc điểm: BẬT' : 'Đọc điểm'}
          </button>
          <button
            type="button"
            className={'pg-cam-toolbtn' + (autoCapture ? ' on' : '')}
            onClick={() => setAutoCapture((v) => !v)}
            title="Tự động chụp & chấm ngay khi 4 góc A4 khớp chuẩn"
          >
            <IcoCheck size={15} /> {autoCapture ? 'Tự chụp: BẬT' : 'Tự chụp: TẮT'}
          </button>
          <button type="button" className="vt-btn sm" onClick={onClose}>
            Đóng <IcoX size={13} />
          </button>
        </div>
      </header>

      {/* Thân Camera + Khung A4 theo đề + AR Overlay */}
      <div className="pg-cam-body">
        {loading && (
          <div className="pg-cam-loading">
            Đang khởi động camera độ phân giải cao…
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
          {/* Canvas vẽ 4 góc định vị & tứ giác nhận dạng thời gian thực */}
          <canvas ref={overlayCanvasRef} className="pg-cam-ar-canvas" />
        </div>

        {/* Thanh trạng thái căn chỉnh trực tiếp phía trên khung ngắm */}
        <div className={'pg-cam-status' + (probe?.ready ? ' ready' : probe?.detected ? ' warn' : '')}>
          <span className="pg-cam-dot" />
          <span>{probe?.hint || 'Đưa 4 ô vuông đen ở 4 góc phiếu khít vào 4 ô ngắm…'}</span>
          {probe && (
            <strong className="pg-cam-fit">{probe.cornersCount || 0}/4 ô góc · {probe.hits}/{probe.totalMarks}</strong>
          )}
        </div>

        {/* Khung ngắm A4 khớp tỷ lệ đề thi + 4 ô định vị góc TNMaker (không bị thanh trên/dưới che) */}
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
            />
            <div className={'pg-cam-corner tl' + (probe?.ready || probe?.cornerMatched?.TL ? ' hit' : '')} />
            <div className={'pg-cam-corner tr' + (probe?.ready || probe?.cornerMatched?.TR ? ' hit' : '')} />
            <div className={'pg-cam-corner bl' + (probe?.ready || probe?.cornerMatched?.BL ? ' hit' : '')} />
            <div className={'pg-cam-corner br' + (probe?.ready || probe?.cornerMatched?.BR ? ' hit' : '')} />
            {!probe?.ready && <div className="pg-cam-scanline" />}
          </div>
        </div>

        {/* Điều khiển đáy: Zoom & Chụp thủ công */}
        <div className="pg-cam-hud">
          <label className="pg-cam-zoom" title="Phóng to khung hình">
            <span>{zoom.toFixed(1)}×</span>
            <input
              type="range"
              min="1"
              max={zoomCap ? Math.min(3, zoomCap.max).toFixed(1) : '2.2'}
              step="0.1"
              value={zoom}
              onChange={(e) => handleZoomChange(e.target.value)}
            />
          </label>

          <button
            type="button"
            className={'pg-cam-shutter' + (probe?.ready ? ' ready' : '')}
            onClick={() => captureAndScan('manual')}
          >
            <IcoCamera size={18} />
            <span>{probe?.ready ? 'Chụp & Chấm Chuẩn' : 'Chụp Thủ Công'}</span>
          </button>
        </div>
      </div>

      {/* Thẻ Kết Quả Tức Thì Theo Từng Phần Của Đề */}
      {(lastCapture || feedback) && (
        <div className="pg-cam-footer">
          {lastCapture && (
            <div className={'pg-cam-result-card' + (!lastCapture.codeKnown || lastCapture.needsReview ? ' warn' : '')}>
              <div className="pg-cam-result-main">
                <div>
                  <span className="pg-cam-res-label">SBD {lastCapture.sbd || '---'} · Mã {lastCapture.code || '---'}</span>
                  <b>{lastCapture.studentName || 'Thí sinh chưa có trong danh sách lớp'}</b>
                </div>
                <div className="pg-cam-res-score">
                  <strong>{lastCapture.grade ? fmt(lastCapture.grade.score10) : '—'}</strong>
                  <small>/ 10đ</small>
                </div>
              </div>

              {lastCapture.grade && (
                <div className="pg-cam-res-parts">
                  {counts.p1 > 0 && (
                    <span>P.I: <b>{lastCapture.grade.correct.p1}/{counts.p1}</b> ({fmt(lastCapture.grade.parts.p1)}đ)</span>
                  )}
                  {counts.p2 > 0 && (
                    <span>P.II: <b>{fmt(lastCapture.grade.parts.p2)}đ</b></span>
                  )}
                  {counts.p3 > 0 && (
                    <span>P.III: <b>{lastCapture.grade.correct.p3}/{counts.p3}</b> ({fmt(lastCapture.grade.parts.p3)}đ)</span>
                  )}
                  <span>Khớp vạch: <b>{Math.round((lastCapture.markFit || 0) * 100)}%</b></span>
                  {lastCapture.p1Dots?.length > 0 && (
                    <span className="pg-cam-dots" title="Chi tiết từng câu Phần I (Xanh = Đúng · Đỏ = Sai)">
                      {lastCapture.p1Dots.map((d) => (
                        <i key={d.q} className={d.ok ? 'ok' : 'bad'}>{d.q}</i>
                      ))}
                    </span>
                  )}
                </div>
              )}

              <div className="pg-cam-res-actions">
                <button
                  type="button"
                  className="vt-btn sm"
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
                  className="vt-btn sm danger"
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

          {showHistory && recentHistory.length > 0 && (
            <div className="pg-cam-history">
              {recentHistory.map((h) => (
                <div key={h.id} className="pg-cam-hist-chip">
                  <span>{h.studentName || `SBD ${h.sbd || '---'}`} · Mã {h.code || '—'}</span>
                  <b>{h.grade ? `${fmt(h.grade.score10)}đ` : '—'}</b>
                  <button
                    type="button"
                    onClick={() => { onClose?.(); onEditItem?.(h.id); }}
                    title="Mở chi tiết phiếu này"
                  >
                    Sửa
                  </button>
                </div>
              ))}
            </div>
          )}

          {feedback && (
            <div className={'pg-cam-feedback ' + (feedback.ok ? 'ok' : 'bad')}>
              {feedback.msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
