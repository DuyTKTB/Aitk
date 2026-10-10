/* ============================================================
   ViolationOverlay.jsx — Overlay đỏ toàn màn hình khi vi phạm
   ------------------------------------------------------------
   Props:
     - warning: { type, text, eventType, count, limit }
     - onDismiss: callback khi HS bấm "Quay lại thi"
     - strict: boolean — nếu true, vi phạm 1 lần đã cảnh báo đỏ
   ------------------------------------------------------------
   Các loại:
     - warn-soft: toast nhỏ (không phải overlay)
     - violation: overlay đỏ + đếm ngược 5s + beep
     - violation-strict: overlay đỏ mạnh hơn, đếm ngược 10s
     - auto-submit: overlay đen + không cho quay lại
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import '../styles/violation-overlay.css';

/* ============================================================
   SVG ICONS
   ============================================================ */
const Svg = ({ size = 24, sw = 2, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const IconAlert = (p) => (
  <Svg {...p}>
    <path d="M12 4l10 18H2z" />
    <path d="M12 10v5" />
    <circle cx="12" cy="19" r=".8" fill="currentColor" />
  </Svg>
);

const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    <path d="M12 11v3" />
    <circle cx="12" cy="16.5" r=".6" fill="currentColor" />
  </Svg>
);

const IconStop = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" stroke="none" />
  </Svg>
);

/* ============================================================
   BEEP SOUND — Web Audio API
   ============================================================ */
let audioCtx = null;
function playBeep(intensity = 'normal') {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const freq = intensity === 'hard' ? 660 : 880;
    const duration = intensity === 'hard' ? 0.35 : 0.18;
    const volume = intensity === 'hard' ? 0.25 : 0.15;

    const play = (delay = 0) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(volume, audioCtx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + delay);
      o.stop(audioCtx.currentTime + delay + duration);
    };

    play(0);
    play(duration + 0.05);
    if (intensity === 'hard') play(duration * 2 + 0.1);
  } catch {
    // ignore
  }
}

/* ============================================================
   MAIN
   ============================================================ */
export default function ViolationOverlay({ warning, onDismiss, strict = false }) {
  const [countdown, setCountdown] = useState(0);
  const [canDismiss, setCanDismiss] = useState(false);
  const beepIntervalRef = useRef(null);
  const countdownRef = useRef(null);

  const isViolation = warning?.type === 'violation' || warning?.type === 'violation-strict';
  const isAutoSubmit = warning?.type === 'auto-submit';
  const isSoft = warning?.type === 'warn-soft';

  /* ===== Setup khi có vi phạm ===== */
  useEffect(() => {
    if (!warning) {
      setCountdown(0);
      setCanDismiss(false);
      clearInterval(beepIntervalRef.current);
      clearInterval(countdownRef.current);
      return undefined;
    }

    if (isSoft) {
      // Soft không có overlay
      return undefined;
    }

    // Beep ngay
    const intensity = isAutoSubmit || warning?.type === 'violation-strict' ? 'hard' : 'normal';
    playBeep(intensity);

    // Beep lặp mỗi 1.2s (chỉ khi chưa bấm quay lại)
    if (!isAutoSubmit) {
      beepIntervalRef.current = setInterval(() => {
        playBeep(intensity);
      }, 1200);
    }

    // Đếm ngược
    const initialDelay = isAutoSubmit ? 5 : strict ? 10 : 5;
    setCountdown(initialDelay);
    setCanDismiss(false);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          setCanDismiss(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearInterval(beepIntervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [warning, isSoft, isAutoSubmit, strict]);

  /* ===== Không render gì cho soft ===== */
  if (!warning || isSoft) return null;

  /* ===== Đóng khi bấm ===== */
  const handleDismiss = () => {
    if (!canDismiss) return;
    clearInterval(beepIntervalRef.current);
    onDismiss?.();
  };

  /* ===== Render ===== */
  const isStrict = warning?.type === 'violation-strict' || strict;
  const Icon = isAutoSubmit ? IconStop : isStrict ? IconShield : IconAlert;

  return (
    <div
      className={
        'ep-violation-overlay' +
        (isAutoSubmit ? ' auto-submit' : '') +
        (isStrict ? ' strict' : '')
      }
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
    >
      <div className="ep-violation-content">
        <div className="ep-violation-icon">
          <Icon size={72} sw={2.2} />
        </div>

        <h1 className="ep-violation-title">
          {isAutoSubmit ? 'BÀI ĐÃ TỰ ĐỘNG NỘP' : isStrict ? 'CẢNH BÁO NGHIÊM TRỌNG' : 'CẢNH BÁO VI PHẠM'}
        </h1>

        <p className="ep-violation-text">{warning.text}</p>

        {!isAutoSubmit && warning.count && warning.limit && (
          <>
            <div className="ep-violation-counter">
              <span className="ep-violation-counter-label">Vi phạm</span>
              <span className="ep-violation-counter-num">
                <b>{warning.count}</b>
                <em>/ {warning.limit}</em>
              </span>
            </div>

            <div className="ep-violation-bar" role="progressbar" aria-valuenow={warning.count} aria-valuemin={0} aria-valuemax={warning.limit}>
              <div
                className="ep-violation-bar-fill"
                style={{ width: `${(warning.count / warning.limit) * 100}%` }}
              />
            </div>
          </>
        )}

        {!isAutoSubmit && (
          <p className="ep-violation-note">
            {isStrict && warning.count === 1
              ? '⚠ Vi phạm thêm 1 lần nữa sẽ tự động nộp bài.'
              : warning.count >= warning.limit - 1
                ? '⚠ Vi phạm thêm 1 lần nữa sẽ tự động nộp bài.'
                : `Còn ${warning.limit - warning.count} lần nữa trước khi tự động nộp.`}
          </p>
        )}

        {isAutoSubmit ? (
          <div className="ep-violation-final">
            <p>Bài làm đã được gửi cho giáo viên.</p>
            <p className="ep-violation-final-sub">
              Vui lòng chờ giáo viên xem xét và liên hệ nếu cần.
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="ep-violation-btn"
            onClick={handleDismiss}
            disabled={!canDismiss}
          >
            {canDismiss ? (
              <>
                <IconShield size={18} /> Quay lại thi
              </>
            ) : (
              <>Chờ {countdown}s…</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}