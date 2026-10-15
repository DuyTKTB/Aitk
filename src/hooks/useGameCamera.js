/* ============================================================
   useGameCamera — Camera cho TRÒ CHƠI TƯƠNG TÁC (MediaPipe)
   ------------------------------------------------------------
   Khác useProctorCamera (giám sát thi): hook này xuất TÍN HIỆU thời gian thực
   để game đọc và biến thành lệnh chơi:
     faces      : số mặt trong khung
     noseX      : -1..1 (không gian MIRROR — trái/ng phải như người dùng thấy)
     smile      : 0..1 (blendshapes mouthSmile)
     fingersUp  : số ngón đang giơ (2 tay)
     indexX     : -1..1 vị trí ngón trỏ (null = không có tay)
     motion     : 0..1 mức chuyển động (so khung liên tiếp)
   Model dùng file LOCAL /models/* đã có trong public/models ✓
   ============================================================ */
import { useEffect, useRef, useState } from 'react';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const FACE_MODEL = '/models/face_landmarker.task';
const HAND_MODEL = '/models/hand_landmarker.task';
const TICK_MS = 120;

/* dùng chung detector giữa các lần mount (load model tốn kém) */
let sharedPromise = null;

async function loadDetectors() {
  if (sharedPromise) return sharedPromise;
  sharedPromise = (async () => {
    const { FaceLandmarker, HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    const face = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 2,
      outputFaceBlendshapes: true,
    });
    const hand = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: HAND_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    return { face, hand };
  })().catch((e) => { sharedPromise = null; throw e; });
  return sharedPromise;
}

/* đếm ngón tay giơ (heuristic chuẩn trên 21 điểm MediaPipe) */
function countFingers(lm) {
  const up = (tip, pip) => lm[tip].y < lm[pip].y - 0.02;
  let n = 0;
  if (up(8, 6)) n++;   // trỏ
  if (up(12, 10)) n++; // giữa
  if (up(16, 14)) n++; // áp út
  if (up(20, 18)) n++; // út
  // ngón cái: khoảng cách ngang giữa đầu ngón (4) và khớp (17) khá xa
  const dx = Math.abs(lm[4].x - lm[17].x);
  const dy = Math.abs(lm[4].y - lm[17].y);
  if (Math.hypot(dx, dy) > 0.18) n++;
  return n;
}

/* X vào "không gian mirror": +1 = BÊN TRÁI màn hình người dùng thấy */
const mirroredX = (x) => (1 - x - 0.5) * 2;

export function useGameCamera({ mode = 'faces', enabled = true } = {}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('idle');   // idle | loading | ready | error
  const [error, setError] = useState('');
  const [signals, setSignals] = useState({
    faces: 0, noseX: 0, noseY: 0.5, smile: 0, fingersUp: 0, indexX: null, motion: 0, handPresent: false,
    brow: 0, browDown: 0, jaw: 0, blink: 0, pucker: 0, wristY: null, spread: 0,
  });

  const detectorsRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const prevPixelsRef = useRef(null);
  const needFace = ['look', 'smile', 'lean', 'faces', 'hide', 'exercise', 'emotion', 'stare', 'squat'].includes(mode);
  const needHand = ['fingers', 'point', 'hands', 'exercise', 'clap'].includes(mode);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const video = videoRef.current;

    (async () => {
      try {
        setStatus('loading');
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Thiết bị không hỗ trợ camera.');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (video) { video.srcObject = stream; await video.play().catch(() => {}); }

        if (needFace || needHand) {
          const d = await loadDetectors();
          if (!alive) return;
          detectorsRef.current = d;
        }

        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = 64; diffCanvas.height = 48;
        const dctx = diffCanvas.getContext('2d', { willReadFrequently: true });

        let lastTs = -1;
        const tick = () => {
          if (!alive) return;
          const v = videoRef.current;
          if (v && v.readyState >= 2 && v.videoWidth > 0) {
            const ts = performance.now();
            const sig = { faces: 0, noseX: 0, smile: 0, fingersUp: 0, indexX: null, motion: 0, handPresent: false };

            const det = detectorsRef.current;
            if (det && lastTs !== ts) {
              lastTs = ts;
              try {
                if (needFace) {
                  const r = det.face.detectForVideo(v, ts);
                  const faces = r.faceLandmarks || [];
                  sig.faces = faces.length;
                  if (faces.length) {
                    const lm = faces[0];
                    sig.noseX = mirroredX(lm[1]?.x ?? 0.5);
                    sig.noseY = lm[1]?.y ?? 0.5;
                    const bs = r.faceBlendshapes?.[0]?.categories || [];
                    const get = (name) => { const c = bs.find((x) => x.categoryName === name); return c ? c.score : 0; };
                    sig.smile = (get('mouthSmileLeft') + get('mouthSmileRight')) / 2;
                    sig.brow = (get('browInnerUp') + get('browOuterUpLeft') + get('browOuterUpRight')) / 3;
                    sig.browDown = (get('browDownLeft') + get('browDownRight')) / 2;
                    sig.jaw = get('jawOpen');
                    sig.blink = (get('eyeBlinkLeft') + get('eyeBlinkRight')) / 2;
                    sig.pucker = get('mouthPucker');
                  }
                }
                if (needHand) {
                  const r = det.hand.detectForVideo(v, ts);
                  const hands = r.landmarks || [];
                  sig.handPresent = hands.length > 0;
                  let maxF = 0;
                  for (const lm of hands) {
                    maxF = Math.max(maxF, countFingers(lm));
                    const tip = lm[8];
                    if (sig.indexX == null) sig.indexX = mirroredX(tip.x);
                  }
                  sig.fingersUp = maxF;
                  if (hands.length) {
                    /* tay thấp nhất (wrist y nhỏ nhất = tay GIỮ CAO) + độ rộng 2 tay */
                    sig.wristY = Math.min(...hands.map((h) => h[0]?.y ?? 1));
                    if (hands.length >= 2) {
                      sig.spread = Math.abs(mirroredX(hands[0][0]?.x ?? 0.5) - mirroredX(hands[1][0]?.x ?? 0.5));
                    }
                  }
                }
              } catch { /* frame lỗi — bỏ qua tick này */ }
            }

            /* mức chuyển động (64×48, so khám trước) */
            try {
              dctx.drawImage(v, 0, 0, 64, 48);
              const px = dctx.getImageData(0, 0, 64, 48).data;
              const gray = new Uint8Array(64 * 48);
              for (let k = 0, p = 0; k < px.length; k += 4, p++) {
                gray[p] = (px[k] + px[k + 1] + px[k + 2]) / 3;
              }
              const prev = prevPixelsRef.current;
              if (prev) {
                let sum = 0;
                for (let k = 0; k < gray.length; k++) sum += Math.abs(gray[k] - prev[k]);
                sig.motion = Math.min(1, (sum / gray.length) / 40);
              }
              prevPixelsRef.current = gray;
            } catch { /* */ }

            setSignals(sig);
          }
          rafRef.current = window.setTimeout(tick, TICK_MS);
        };
        tick();
        setStatus('ready');
      } catch (e) {
        if (!alive) return;
        const m = String(e?.message || e?.name || e);
        setError(
          e?.name === 'NotAllowedError' ? 'Bạn đã CHẶN quyền camera. Hãy mở lại quyền trong trình duyệt (icon 🔒 trên thanh địa chỉ) rồi thử lại.'
            : e?.name === 'NotFoundError' ? 'Không tìm thấy camera trên thiết bị này.'
              : m
        );
        setStatus('error');
      }
    })();

    return () => {
      alive = false;
      clearTimeout(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      prevPixelsRef.current = null;
    };
  }, [enabled, mode]);

  return { videoRef, status, error, signals };
}
