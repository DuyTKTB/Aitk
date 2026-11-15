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
const UPLOAD_COOLDOWN_MS = 45000;
const MODEL_RETRY_MS = 8000;
const NEVER_SEEN_MS = 12000;
const COVERED_MS = 4000;
const FROZEN_TIME_MS = 5000;
const STATIC_FEED_MS = 7000;

/* Ưu tiên WASM cục bộ trong /models để tránh phụ thuộc CDN; fallback CDN khi thiếu */
const WASM_SOURCES = [
  '/models',
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
];

/* Firebase tự retry upload tới 10 phút → giảm còn 8 giây */
if (storage) {
  try { storage.maxUploadRetryTime = 8000; } catch { /* bỏ qua */ }
}

/* Dùng chung toàn app */
let sharedFaceDetector = null;
let sharedHandDetector = null;
let sharedObjectDetector = null; // tuỳ chọn: nhận diện 'cell phone' thật (cần /models/efficientdet_lite0.tflite)
let objectTried = false;
let sharedModelLoadPromise = null;
let lastModelFailAt = 0;
let uploadFails = 0;
let lastUploadFailAt = 0;

async function resolveVisionFileset(FilesetResolver) {
  let lastErr;
  for (const src of WASM_SOURCES) {
    try {
      return await FilesetResolver.forVisionTasks(src);
    } catch (e) {
      lastErr = e;
      console.warn(`[proctor] Fileset WASM (${src}) lỗi:`, e?.message);
    }
  }
  throw lastErr || new Error('Không tải được WASM MediaPipe.');
}

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
    const { FaceLandmarker, HandLandmarker, ObjectDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await resolveVisionFileset(FilesetResolver);
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
    // Nhận diện điện thoại bằng mô hình vật thể — tuỳ chọn: thiếu file model thì bỏ qua, không ảnh hưởng phần còn lại
    if (!sharedObjectDetector && !objectTried && ObjectDetector) {
      objectTried = true;
      try {
        sharedObjectDetector = await createWithFallback(
          ObjectDetector, fileset, '/models/efficientdet_lite0.tflite',
          { scoreThreshold: 0.45, maxResults: 5, categoryAllowlist: ['cell phone'] }
        );
        console.log('[proctor] ObjectDetector OK');
      } catch (e) {
        console.warn('[proctor] Không load được ObjectDetector (thiếu /models/efficientdet_lite0.tflite?):', e?.message);
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
  const muteTimerRef = useRef(null);
  const probeRef = useRef({ canvas: null, ctx: null, prevLuma: null });

  const stateRef = useRef({
    noFaceSince: 0,
    multiFaceSince: 0,
    lookAwaySince: 0,
    handRaiseSince: 0,
    phoneLikeSince: 0,
    coveredSince: 0,
    frozenSince: 0,
    stalledSince: 0,
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

  /* Upload ảnh vi phạm (kèm fallback inlineThumb gọn nếu Storage lỗi/chờ cooldown) */
  const captureSnapshot = useCallback(async (eventType) => {
    const st = stateRef.current;
    try {
      const cfg = configRef.current;
      if (!cfg?.snapshotOnEvent) return { snapshotUrl: null, inlineThumb: null };
      if (!examId || !studentId) return { snapshotUrl: null, inlineThumb: null };
      if (st.snapshotCount >= (cfg.maxSnapshots || 15)) return { snapshotUrl: null, inlineThumb: null };

      const v = videoRef.current;
      if (!v || !v.videoWidth || !v.videoHeight || v.readyState < 2) {
        return { snapshotUrl: null, inlineThumb: null };
      }

      const w = 320;
      const h = Math.round((v.videoHeight / v.videoWidth) * w) || 240;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { snapshotUrl: null, inlineThumb: null };
      ctx.drawImage(v, 0, 0, w, h);

      // Tạo thumbnail dự phòng nhỏ (~3-5KB) để GV luôn xem được ảnh kể cả khi Storage bị CORS/offline
      let inlineThumb = null;
      try {
        const tw = 160;
        const th = Math.round((v.videoHeight / v.videoWidth) * tw) || 120;
        const tc = document.createElement('canvas');
        tc.width = tw;
        tc.height = th;
        tc.getContext('2d')?.drawImage(canvas, 0, 0, tw, th);
        inlineThumb = tc.toDataURL('image/jpeg', 0.4);
      } catch { /* */ }

      const canUploadStorage = Boolean(
        storage &&
        !st.uploading &&
        (uploadFails < UPLOAD_MAX_FAILS || Date.now() - lastUploadFailAt >= UPLOAD_COOLDOWN_MS)
      );
      if (!canUploadStorage) {
        if (inlineThumb) st.snapshotCount += 1;
        return { snapshotUrl: null, inlineThumb };
      }

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.52));
      if (!blob) return { snapshotUrl: null, inlineThumb };

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
      return { snapshotUrl: url, inlineThumb: null };
    } catch (e) {
      uploadFails += 1;
      lastUploadFailAt = Date.now();
      console.warn(
        `[proctor] snapshot lỗi (${uploadFails}/${UPLOAD_MAX_FAILS}):`, e?.code || e?.message
      );
      return { snapshotUrl: null, inlineThumb: null };
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
    const { snapshotUrl, inlineThumb } = await captureSnapshot(type);
    emitEvent(type, severity, { ...meta, snapshotUrl, inlineThumb });
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
        track.addEventListener('mute', () => {
          clearTimeout(muteTimerRef.current);
          muteTimerRef.current = setTimeout(() => {
            if (!mountedRef.current || myRun !== runIdRef.current) return;
            if (track.muted || track.readyState === 'ended') {
              fireEvent('camera_lost', 'hard', { reason: 'track_muted' });
            }
          }, 2500);
        });
        track.addEventListener('unmute', () => {
          clearTimeout(muteTimerRef.current);
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
    clearTimeout(muteTimerRef.current);
    releaseStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch { /* */ }
    }
    lastVideoTimeRef.current = -1;
    everSawFaceRef.current = false;
    streamStableRef.current = false;
    probeRef.current.prevLuma = null;
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
      const v = videoRef.current;
      if (!v || v.readyState < 2 || !v.videoWidth) return;

      const nowMs = Date.now();
      const st = stateRef.current;
      const grace = inGrace();
      const cfg = configRef.current || {};

      // Kiểm tra đứng hình / nguồn video ngừng cập nhật kể cả khi MediaPipe chưa sẵn sàng
      if (v.currentTime === lastVideoTimeRef.current) {
        if (!grace) {
          if (!st.stalledSince) st.stalledSince = nowMs;
          else if (nowMs - st.stalledSince >= FROZEN_TIME_MS) {
            fireEvent('camera_frozen', 'hard', { reason: 'video_stalled' });
            st.stalledSince = nowMs;
          }
        }
        return;
      }
      st.stalledSince = 0;
      lastVideoTimeRef.current = v.currentTime;

      // Kiểm tra độ sáng, đồng nhất khung hình (che camera) & ảnh tĩnh giả lập
      const liveness = analyzeFrameLiveness(v, probeRef.current);
      if (liveness && !grace) {
        const isCovered = (liveness.meanLuma < 14 && liveness.lumaStd < 8) || liveness.lumaStd < 2.2;
        if (isCovered) {
          if (!st.coveredSince) st.coveredSince = nowMs;
          else if (nowMs - st.coveredSince >= COVERED_MS) {
            fireEvent('camera_covered', 'hard', {
              meanLuma: Math.round(liveness.meanLuma),
              lumaStd: Number(liveness.lumaStd.toFixed(1)),
            });
            st.coveredSince = nowMs;
          }
        } else {
          st.coveredSince = 0;
        }

        if (liveness.frameDiff !== null && liveness.frameDiff < 0.18 && !isCovered) {
          if (!st.frozenSince) st.frozenSince = nowMs;
          else if (nowMs - st.frozenSince >= STATIC_FEED_MS) {
            fireEvent('camera_frozen', 'hard', {
              reason: 'static_feed',
              frameDiff: Number(liveness.frameDiff.toFixed(2)),
            });
            st.frozenSince = nowMs;
          }
        } else {
          st.frozenSince = 0;
        }
      } else {
        st.coveredSince = 0;
        st.frozenSince = 0;
      }

      if (!sharedFaceDetector) { ensureModels(); return; }

      const now = performance.now();
      const checks = cfg.cameraChecks
        || { noFace: true, multiFace: true, lookAway: true, handRaise: true, phoneLike: true };

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

      // no_face — nếu camera bắt buộc / lockdown / strictMode, chưa từng thấy mặt sau NEVER_SEEN_MS vẫn tính 'hard'
      const neverSeen = !everSawFaceRef.current && nowMs - startTimeRef.current > NEVER_SEEN_MS;
      const neverSeenSeverity = (cfg.camera === 'required' || cfg.lockdown || cfg.strictMode) ? 'hard' : 'soft';
      if (checks.noFace && (everSawFaceRef.current || neverSeen) && !grace) {
        if (faceCount === 0) {
          if (!st.noFaceSince) st.noFaceSince = nowMs;
          else if (nowMs - st.noFaceSince >= NO_FACE_MS) {
            fireEvent('no_face', neverSeen ? neverSeenSeverity : 'hard', { duration: NO_FACE_MS, neverSeen });
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

      // Điện thoại THẬT trong khung hình (mô hình vật thể) — 3 lần liên tiếp mới báo, tránh nhận nhầm
      if (sharedObjectDetector && checks.phoneLike && !grace && nowMs - (st.lastObjAt || 0) > 1500) {
        st.lastObjAt = nowMs;
        try {
          const dets = sharedObjectDetector.detectForVideo(v, now)?.detections || [];
          const hit = dets.some((d) => (d.categories || []).some((c) => c.categoryName === 'cell phone' && c.score >= 0.5));
          if (hit) {
            st.phoneObjHits = (st.phoneObjHits || 0) + 1;
            if (st.phoneObjHits >= 3) { fireEvent('phone_detected', 'hard', { source: 'object' }); st.phoneObjHits = 0; }
          } else st.phoneObjHits = 0;
        } catch { /* */ }
      }

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

/* Phân tích độ sáng + chênh lệch frame trên canvas 24x18 để bắt che ống kính & camera giả tĩnh */
function analyzeFrameLiveness(video, probe) {
  try {
    if (!probe.canvas) {
      const c = document.createElement('canvas');
      c.width = 24;
      c.height = 18;
      probe.canvas = c;
      probe.ctx = c.getContext('2d', { willReadFrequently: true });
    }
    const ctx = probe.ctx;
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 24, 18);
    const { data } = ctx.getImageData(0, 0, 24, 18);
    const n = 24 * 18;
    const luma = new Float32Array(n);
    let sum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      luma[p] = y;
      sum += y;
    }
    const meanLuma = sum / n;
    let varSum = 0;
    let diffSum = 0;
    const prev = probe.prevLuma;
    for (let p = 0; p < n; p++) {
      const d = luma[p] - meanLuma;
      varSum += d * d;
      if (prev) diffSum += Math.abs(luma[p] - prev[p]);
    }
    const lumaStd = Math.sqrt(varSum / n);
    const frameDiff = prev ? diffSum / n : null;
    probe.prevLuma = luma;
    return { meanLuma, lumaStd, frameDiff };
  } catch {
    return null;
  }
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
/* ============================================================
   useCameraPreflight — TEST CAMERA trước khi vào thi
   • Bật camera, nhận diện khuôn mặt; thấy đúng 1 mặt liên tục (~1,6s) → ready = true
   • Không tải được model nhận diện → degraded: vẫn cho vào (không chặn oan) nhưng báo rõ
   • release() phải gọi trước khi vào phòng thi để nhả camera cho useProctorCamera
   ============================================================ */
export function useCameraPreflight({ active, requireAiModel = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const okCountRef = useRef(0);
  const runRef = useRef(0);
  const [status, setStatus] = useState('idle');
  const [faces, setFaces] = useState(0);
  const [ready, setReady] = useState(false);
  const [modelOk, setModelOk] = useState(null);

  const release = useCallback(() => {
    runRef.current += 1;
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* */ }
    streamRef.current = null;
    if (videoRef.current) { try { videoRef.current.srcObject = null; } catch { /* */ } }
  }, []);

  const start = useCallback(async () => {
    release();
    const myRun = runRef.current;
    okCountRef.current = 0;
    setReady(false);
    setFaces(0);
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }, audio: false,
      });
      if (myRun !== runRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      let v = null;
      for (let i = 0; i < 60 && !v; i++) {
        v = videoRef.current;
        // eslint-disable-next-line no-await-in-loop
        if (!v) await new Promise((r) => setTimeout(r, 50));
      }
      if (!v || myRun !== runRef.current) { release(); return; }
      v.srcObject = stream;
      v.muted = true;
      v.playsInline = true;
      try { await v.play(); } catch { /* */ }
      setStatus('ok');
    } catch (e) {
      if (myRun !== runRef.current) return;
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') setStatus('denied');
      else if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') setStatus('unavailable');
      else setStatus('error');
    }
  }, [release]);

  useEffect(() => {
    if (active) start(); else { release(); setStatus('idle'); setReady(false); setFaces(0); }
    return () => release();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    ensureModels().then((ok) => { if (alive) setModelOk(!!ok && !!sharedFaceDetector); });
    return () => { alive = false; };
  }, [active]);

  const degraded = status === 'ok' && modelOk === false;
  useEffect(() => {
    if (degraded && !requireAiModel) setReady(true);
  }, [degraded, requireAiModel]);

  useEffect(() => {
    if (!active || status !== 'ok') return undefined;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 2 || !v.videoWidth || !sharedFaceDetector) return;
      try {
        const n = sharedFaceDetector.detectForVideo(v, performance.now())?.faceLandmarks?.length || 0;
        setFaces(n);
        if (n === 1) {
          okCountRef.current += 1;
          if (okCountRef.current >= 4) setReady(true);
        } else okCountRef.current = 0;
      } catch { /* */ }
    }, 400);
    return () => clearInterval(id);
  }, [active, status]);

  let message = '';
  if (status === 'starting') message = 'Đang bật camera…';
  else if (status === 'denied') message = 'Bạn chưa cho phép camera. Bấm biểu tượng ổ khoá cạnh thanh địa chỉ → cho phép camera → bấm "Thử lại".';
  else if (status === 'unavailable') message = 'Không tìm thấy camera trên thiết bị này.';
  else if (status === 'error') message = 'Không mở được camera. Hãy đóng ứng dụng khác đang dùng camera rồi bấm "Thử lại".';
  else if (status === 'ok') {
    if (degraded && requireAiModel) message = 'Chưa tải được AI nhận diện khuôn mặt — không thể bỏ qua ở chế độ giám sát chặt. Hãy tắt chặn nội dung hoặc bấm "Thử lại".';
    else if (degraded) message = 'Không tải được bộ nhận diện khuôn mặt — tạm cho phép vào thi.';
    else if (ready) message = 'Đã nhận diện được khuôn mặt — bạn có thể bắt đầu thi.';
    else if (modelOk === null) message = 'Đang tải bộ nhận diện khuôn mặt…';
    else if (faces > 1) message = 'Có nhiều hơn 1 khuôn mặt trong khung hình. Chỉ mình bạn được ngồi trước camera.';
    else if (faces === 1) message = 'Đã thấy khuôn mặt — giữ yên một chút…';
    else message = 'Chưa thấy khuôn mặt. Hãy ngồi thẳng, nhìn vào camera và đảm bảo đủ sáng.';
  }

  return { videoRef, status, faces, ready, degraded, message, retry: start, release };
}