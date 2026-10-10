/* ============================================================
   useProctorCamera — Giám sát camera khi thi (MediaPipe) — v2
   Sửa so với v1:
     1. Upload ảnh có timeout + hủy task (hết retry vô hạn / spam CORS)
     2. Circuit breaker: lỗi upload 2 lần liên tiếp → tắt upload, vẫn báo vi phạm
     3. Sự kiện không còn bị treo chờ upload
     4. Chống race khi StrictMode / stop() giữa lúc getUserMedia
     5. Vòng detect dùng setInterval (rAF bị dừng khi tab ẩn)
     6. "Tay gần mặt" dựa trên khung mặt thật, không dùng vùng cố định
     7. Load model: thử GPU rồi CPU, tự thử lại khi lỗi
     8. waitForVideo không dùng rAF; chặn emit sau khi unmount
   ============================================================ */
import { useEffect, useRef, useState, useCallback } from 'react';
import { storage } from '../lib/firebase.js';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

const NO_FACE_MS = 5000;
const MULTI_FACE_MS = 3000;
const LOOK_AWAY_MS = 5000;
const HAND_RAISE_MS = 1500;
const PHONE_LIKE_MS = 2000;
const DETECT_INTERVAL_MS = 600;
const COOLDOWN_MS = 15000;
const CAMERA_GRACE_MS = 12000;
const UPLOAD_TIMEOUT_MS = 6000;
const UPLOAD_MAX_FAILS = 2;
const MODEL_RETRY_MS = 10000;

/* Nên ghim đúng phiên bản đã cài (npm ls @mediapipe/tasks-vision), tránh @latest lệch bản */
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

/* Firebase tự retry upload tới 10 phút → giảm còn 8 giây */
if (storage) {
  try { storage.maxUploadRetryTime = 8000; } catch { /* bỏ qua */ }
}

/* Dùng chung toàn app */
let sharedFaceDetector = null;
let sharedHandDetector = null;
let sharedModelLoadPromise = null;
let lastModelFailAt = 0;
let uploadFails = 0; // circuit breaker, giữ qua các lần mount

async function createWithFallback(Cls, fileset, modelAssetPath, extra) {
  for (const delegate of ['GPU', 'CPU']) {
    try {
      return await Cls.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate },
        runningMode: 'VIDEO',
        ...extra,
      });
    } catch (e) {
      console.warn(`[proctor] ${Cls.name} delegate ${delegate} lỗi:`, e?.message);
      if (delegate === 'CPU') throw e;
    }
  }
  return null;
}

function ensureModels() {
  if (sharedFaceDetector && sharedHandDetector) return Promise.resolve(true);
  if (sharedModelLoadPromise) return sharedModelLoadPromise;
  if (Date.now() - lastModelFailAt < MODEL_RETRY_MS) return Promise.resolve(false);

  console.log('[proctor] Bắt đầu load model MediaPipe...');
  sharedModelLoadPromise = (async () => {
    const { FaceLandmarker, HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    if (!sharedFaceDetector) {
      sharedFaceDetector = await createWithFallback(
        FaceLandmarker, fileset, '/models/face_landmarker.task', { numFaces: 2 }
      );
      console.log('[proctor] FaceLandmarker OK');
    }
    if (!sharedHandDetector) {
      // Tay là tính năng phụ: lỗi thì vẫn chạy phần mặt
      try {
        sharedHandDetector = await createWithFallback(
          HandLandmarker, fileset, '/models/hand_landmarker.task', { numHands: 2 }
        );
        console.log('[proctor] HandLandmarker OK');
      } catch (e) {
        console.warn('[proctor] Không load được HandLandmarker, bỏ qua check tay:', e?.message);
      }
    }
    return true;
  })()
    .catch((e) => {
      console.error('[proctor] Load model lỗi:', e);
      lastModelFailAt = Date.now();
      return false;
    })
    .finally(() => { sharedModelLoadPromise = null; });
  return sharedModelLoadPromise;
}

export function useProctorCamera({ active, examId, studentId, config, onEvent }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const mountedRef = useRef(true);
  const runIdRef = useRef(0);
  const onEventRef = useRef(onEvent);
  const configRef = useRef(config);
  const startTimeRef = useRef(0);
  const everSawFaceRef = useRef(false);
  const streamStableRef = useRef(false);
  const stableTimerRef = useRef(null);

  const stateRef = useRef({
    noFaceSince: 0,
    multiFaceSince: 0,
    lookAwaySince: 0,
    handRaiseSince: 0,
    phoneLikeSince: 0,
    lastFireAt: {},
    snapshotCount: 0,
    uploading: false,
  });

  const [status, setStatus] = useState('idle');
  const [faces, setFaces] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const inGrace = () =>
    startTimeRef.current > 0 && (Date.now() - startTimeRef.current) < CAMERA_GRACE_MS;

  const shouldFire = (type) => {
    const now = Date.now();
    const last = stateRef.current.lastFireAt[type] || 0;
    if (now - last < COOLDOWN_MS) return false;
    stateRef.current.lastFireAt[type] = now;
    return true;
  };

  const emitEvent = useCallback((type, severity, meta = {}) => {
    if (!mountedRef.current) return;
    try { onEventRef.current?.({ type, severity, meta, at: Date.now() }); } catch { /* */ }
  }, []);

  /* Upload ảnh vi phạm — không bao giờ treo quá UPLOAD_TIMEOUT_MS */
  const captureSnapshot = useCallback(async (eventType) => {
    const st = stateRef.current;
    try {
      const cfg = configRef.current;
      if (!cfg?.snapshotOnEvent) return null;
      if (!storage || !examId || !studentId) return null;
      if (uploadFails >= UPLOAD_MAX_FAILS) return null; // storage đang hỏng → bỏ qua
      if (st.uploading) return null;                    // đang upload ảnh khác
      if (st.snapshotCount >= (cfg.maxSnapshots || 10)) return null;

      const v = videoRef.current;
      if (!v || !v.videoWidth || !v.videoHeight || v.readyState < 2) return null;

      const w = 320;
      const h = Math.round((v.videoHeight / v.videoWidth) * w) || 240;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(v, 0, 0, w, h);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.5));
      if (!blob) return null;

      st.uploading = true;
      const ref = storageRef(storage, `proctor/${examId}/${studentId}/${Date.now()}_${eventType}.jpg`);
      const task = uploadBytesResumable(ref, blob, { contentType: 'image/jpeg' });

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          try { task.cancel(); } catch { /* */ }
          reject(new Error('upload timeout'));
        }, UPLOAD_TIMEOUT_MS);
        task.on(
          'state_changed',
          null,
          (err) => { clearTimeout(timer); reject(err); },
          () => { clearTimeout(timer); resolve(); }
        );
      });

      const url = await getDownloadURL(ref);
      st.snapshotCount += 1;
      uploadFails = 0;
      return url;
    } catch (e) {
      uploadFails += 1;
      console.warn(
        `[proctor] snapshot lỗi (${uploadFails}/${UPLOAD_MAX_FAILS}):`, e?.code || e?.message,
        uploadFails >= UPLOAD_MAX_FAILS ? '→ tắt upload ảnh, kiểm tra CORS/Rules của Storage' : ''
      );
      return null;
    } finally {
      st.uploading = false;
    }
  }, [examId, studentId]);

  const fireEvent = useCallback(async (type, severity, meta = {}) => {
    if (inGrace()) {
      console.log('[proctor] Grace period — bỏ qua sự kiện:', type);
      return;
    }
    if (!shouldFire(type)) return;
    const snapshotUrl = await captureSnapshot(type);
    emitEvent(type, severity, { ...meta, snapshotUrl });
  }, [captureSnapshot, emitEvent]);

  const waitForVideo = (timeoutMs = 3000) =>
    new Promise((resolve) => {
      const startAt = Date.now();
      const check = () => {
        if (videoRef.current) return resolve(videoRef.current);
        if (Date.now() - startAt > timeoutMs) return resolve(null);
        setTimeout(check, 50);
        return undefined;
      };
      check();
    });

  const releaseStream = (stream) => {
    try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
  };

  const start = useCallback(async () => {
    if (streamRef.current) return true;

    const myRun = ++runIdRef.current;
    const stale = () => !mountedRef.current || myRun !== runIdRef.current;

    startTimeRef.current = Date.now();
    everSawFaceRef.current = false;
    streamStableRef.current = false;
    clearTimeout(stableTimerRef.current);

    setStatus('starting');
    setErrorMsg('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      if (stale()) { releaseStream(stream); return false; }
      streamRef.current = stream;

      const v = await waitForVideo(3000);
      if (stale()) { releaseStream(stream); if (streamRef.current === stream) streamRef.current = null; return false; }
      if (!v) {
        setStatus('error');
        setErrorMsg('Không tìm thấy thẻ video.');
        releaseStream(stream);
        streamRef.current = null;
        return false;
      }

      v.srcObject = stream;
      v.muted = true;
      v.playsInline = true;
      try {
        await v.play();
      } catch (playErr) {
        console.warn('[proctor] video.play() lỗi:', playErr?.name);
      }
      if (stale()) { releaseStream(stream); if (streamRef.current === stream) streamRef.current = null; return false; }

      stableTimerRef.current = setTimeout(() => { streamStableRef.current = true; }, 2000);

      const track = stream.getVideoTracks()[0];
      if (track) {
        track.addEventListener('ended', () => {
          if (!mountedRef.current || myRun !== runIdRef.current) return;
          if (!streamStableRef.current) {
            console.log('[proctor] Track ended trong grace — bỏ qua');
            return;
          }
          setStatus('lost');
          fireEvent('camera_lost', 'hard');
        });
      }

      setStatus('ok');
      return true;
    } catch (e) {
      console.warn('[proctor] getUserMedia lỗi:', e?.name, e?.message);
      if (stale()) return false;
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
        setStatus('denied');
        setErrorMsg('Bạn đã từ chối quyền camera.');
      } else if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError') {
        setStatus('unavailable');
        setErrorMsg('Không tìm thấy camera.');
      } else {
        setStatus('error');
        setErrorMsg(e.message || 'Không mở được camera.');
      }
      return false;
    }
  }, [fireEvent]);

  const stop = useCallback(() => {
    runIdRef.current += 1; // vô hiệu mọi start() đang chờ
    clearTimeout(stableTimerRef.current);
    releaseStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch { /* */ }
    }
    lastVideoTimeRef.current = -1;
    everSawFaceRef.current = false;
    streamStableRef.current = false;
    if (mountedRef.current) {
      setStatus('idle');
      setFaces(0);
    }
  }, []);

  /* Load model sớm khi bật */
  useEffect(() => {
    if (active) ensureModels().then((ok) => {
      if (!ok && mountedRef.current) setErrorMsg('Không tải được model nhận diện.');
    });
  }, [active]);

  /* Vòng detect — setInterval (không bị dừng khi tab ẩn như rAF) */
  useEffect(() => {
    if (!active || status !== 'ok') return undefined;

    const detect = () => {
      if (!sharedFaceDetector) { ensureModels(); return; }

      const v = videoRef.current;
      if (!v || v.readyState < 2 || !v.videoWidth) return;
      if (v.currentTime === lastVideoTimeRef.current) return;
      lastVideoTimeRef.current = v.currentTime;

      const now = performance.now();
      const nowMs = Date.now();
      const checks = configRef.current?.cameraChecks
        || { noFace: true, multiFace: true, lookAway: true, handRaise: true, phoneLike: true };
      const st = stateRef.current;
      const grace = inGrace();

      let faceCount = 0;
      let lookAway = false;
      let faceBox = null;

      try {
        const res = sharedFaceDetector.detectForVideo(v, now);
        faceCount = res?.faceLandmarks?.length || 0;
        if (mountedRef.current) setFaces(faceCount);
        if (faceCount > 0) everSawFaceRef.current = true;
        if (faceCount >= 1) faceBox = boxOf(res.faceLandmarks[0]);
        if (faceCount === 1 && checks.lookAway) lookAway = isLookingAway(res.faceLandmarks[0]);
      } catch { /* bỏ qua lỗi từng frame */ }

      // no_face — chỉ báo khi đã từng thấy mặt
      if (checks.noFace && everSawFaceRef.current && !grace) {
        if (faceCount === 0) {
          if (!st.noFaceSince) st.noFaceSince = nowMs;
          else if (nowMs - st.noFaceSince >= NO_FACE_MS) {
            fireEvent('no_face', 'hard', { duration: NO_FACE_MS });
            st.noFaceSince = nowMs;
          }
        } else st.noFaceSince = 0;
      } else st.noFaceSince = 0;

      // multi_face
      if (checks.multiFace && !grace) {
        if (faceCount > 1) {
          if (!st.multiFaceSince) st.multiFaceSince = nowMs;
          else if (nowMs - st.multiFaceSince >= MULTI_FACE_MS) {
            fireEvent('multi_face', 'hard', { count: faceCount });
            st.multiFaceSince = nowMs;
          }
        } else st.multiFaceSince = 0;
      } else st.multiFaceSince = 0;

      // look_away
      if (checks.lookAway && !grace) {
        if (lookAway) {
          if (!st.lookAwaySince) st.lookAwaySince = nowMs;
          else if (nowMs - st.lookAwaySince >= LOOK_AWAY_MS) {
            fireEvent('look_away', 'soft');
            st.lookAwaySince = nowMs;
          }
        } else st.lookAwaySince = 0;
      } else st.lookAwaySince = 0;

      // Tay gần mặt (dựa trên khung mặt thật)
      let handNearFace = false;
      if (sharedHandDetector && faceBox && (checks.handRaise || checks.phoneLike) && !grace) {
        try {
          const hands = sharedHandDetector.detectForVideo(v, now)?.landmarks || [];
          handNearFace = hands.some((h) => isHandNearFace(h, faceBox));
        } catch { /* */ }
      }

      if (checks.handRaise && !grace) {
        if (handNearFace) {
          if (!st.handRaiseSince) st.handRaiseSince = nowMs;
          else if (nowMs - st.handRaiseSince >= HAND_RAISE_MS) {
            fireEvent('hand_raise', 'soft');
            st.handRaiseSince = nowMs;
          }
        } else st.handRaiseSince = 0;
      } else st.handRaiseSince = 0;

      if (checks.phoneLike && !grace) {
        if (handNearFace) {
          if (!st.phoneLikeSince) st.phoneLikeSince = nowMs;
          else if (nowMs - st.phoneLikeSince >= PHONE_LIKE_MS) {
            fireEvent('phone_like', 'soft');
            st.phoneLikeSince = nowMs;
          }
        } else st.phoneLikeSince = 0;
      } else st.phoneLikeSince = 0;
    };

    const id = setInterval(() => { try { detect(); } catch { /* */ } }, DETECT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, status, fireEvent]);

  useEffect(() => {
    if (active) start();
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return {
    videoRef,
    status,
    faces,
    errorMsg,
    start,
    stop,
    snapshotCount: stateRef.current.snapshotCount,
  };
}

/* ============ HÌNH HỌC ============ */
function boxOf(lm) {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const p of lm) {
    if (p.x < x0) x0 = p.x;
    if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.y > y1) y1 = p.y;
  }
  const w = x1 - x0;
  const h = y1 - y0;
  // nới 50% mỗi phía, toạ độ chuẩn hoá 0..1
  return { x0: x0 - w * 0.5, x1: x1 + w * 0.5, y0: y0 - h * 0.5, y1: y1 + h * 0.5 };
}

function isLookingAway(lm) {
  if (!lm || lm.length < 468) return false;
  const nose = lm[1];
  const leftCheek = lm[234];
  const rightCheek = lm[454];
  const chin = lm[152];
  const leftEye = lm[159];
  if (!nose || !leftCheek || !rightCheek || !chin || !leftEye) return false;

  const dx = (rightCheek.x - leftCheek.x) || 1e-6;
  const yawOff = Math.abs((nose.x - leftCheek.x) / dx - 0.5);

  const faceH = Math.abs(chin.y - leftEye.y) || 1e-6;
  const pitchOff = Math.abs((chin.y - nose.y) / faceH - 0.28);

  return yawOff > 0.18 || pitchOff > 0.18;
}

function isHandNearFace(hand, box) {
  if (!hand || !hand.length) return false;
  let hit = 0;
  for (const p of hand) {
    if (p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1) {
      hit++;
      if (hit >= 5) return true;
    }
  }
  return false;
}