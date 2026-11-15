/* ============================================================
   useAudioGuard — Giám sát âm thanh bất thường cục bộ (Zero-Upload)
   ------------------------------------------------------------
   • Phân tích phổ tần số giọng nói (300Hz – 3400Hz) ngay trên trình duyệt.
   • KHÔNG ghi âm, KHÔNG lưu file, KHÔNG gửi âm thanh lên server.
   • Tự hiệu chỉnh mức nền phòng yên tĩnh trong 3 giây đầu.
   • Cảnh báo 'voice_detected' khi phát hiện tiếng nói kéo dài >= 1.75s.
   ============================================================ */
import { useEffect, useRef, useState } from 'react';

const SAMPLE_MS = 250;
const CALIBRATION_TICKS = 12; // ~3 giây hiệu chỉnh tiếng ồn nền
const SPEECH_MIN_HZ = 300;
const SPEECH_MAX_HZ = 3400;
const SUSTAINED_TICKS = 7; // 1.75 giây nói liên tục mới báo
const COOLDOWN_MS = 12000;
const MIN_ABS_LEVEL = 0.055; // Ngưỡng tối thiểu tránh mic nhiễu tĩnh
const FLOOR_MULTIPLIER = 2.8;

/**
 * Giám sát tiếng nói / trao đổi cục bộ bằng Web Audio AnalyserNode.
 */
export function useAudioGuard({ active, enabled, onViolation }) {
  const [status, setStatus] = useState('off'); // 'off' | 'starting' | 'listening' | 'denied' | 'unsupported'
  const [level, setLevel] = useState(0);

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  useEffect(() => {
    if (!active || !enabled) {
      setStatus('off');
      setLevel(0);
      return undefined;
    }

    const mediaApi = navigator?.mediaDevices?.getUserMedia;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!mediaApi || !AudioCtx) {
      setStatus('unsupported');
      return undefined;
    }

    let cancelled = false;
    let stream = null;
    let ctx = null;
    let timer = null;

    setStatus('starting');

    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    }).then((micStream) => {
      if (cancelled) {
        micStream.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = micStream;

      const track = micStream.getAudioTracks()[0];
      if (track) {
        track.onended = () => {
          if (!cancelled) setStatus('denied');
        };
      }

      ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(micStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.45;
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const hzPerBin = (ctx.sampleRate || 48000) / analyser.fftSize;
      const startBin = Math.max(1, Math.floor(SPEECH_MIN_HZ / hzPerBin));
      const endBin = Math.min(analyser.frequencyBinCount - 1, Math.ceil(SPEECH_MAX_HZ / hzPerBin));

      let ticks = 0;
      let floorAccum = 0;
      let noiseFloor = 0.03;
      let speechStreak = 0;
      let lastAlertAt = 0;

      setStatus('listening');

      timer = setInterval(() => {
        if (cancelled) return;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        analyser.getByteFrequencyData(freqData);

        let sumSq = 0;
        let count = 0;
        for (let i = startBin; i <= endBin; i++) {
          const norm = freqData[i] / 255;
          sumSq += norm * norm;
          count += 1;
        }
        const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
        setLevel(Math.min(100, Math.round(rms * 240)));

        ticks += 1;
        if (ticks <= CALIBRATION_TICKS) {
          floorAccum += rms;
          noiseFloor = Math.min(0.18, Math.max(0.015, floorAccum / ticks));
          return;
        }

        const threshold = Math.max(MIN_ABS_LEVEL, noiseFloor * FLOOR_MULTIPLIER);
        if (rms >= threshold) {
          speechStreak += 1;
          if (speechStreak >= SUSTAINED_TICKS) {
            const now = Date.now();
            if (now - lastAlertAt >= COOLDOWN_MS) {
              lastAlertAt = now;
              speechStreak = 0;
              onViolationRef.current?.('voice_detected', 'soft', {
                level: Math.round(rms * 100),
                baseline: Math.round(noiseFloor * 100),
              });
            }
          }
        } else {
          speechStreak = Math.max(0, speechStreak - 1);
          // Thích nghi rất chậm với tiếng ồn quạt/điều hoà ổn định
          noiseFloor = noiseFloor * 0.985 + rms * 0.015;
        }
      }, SAMPLE_MS);
    }).catch(() => {
      if (!cancelled) setStatus('denied');
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (ctx) ctx.close().catch(() => {});
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setLevel(0);
    };
  }, [active, enabled]);

  return { status, level };
}
