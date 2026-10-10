/* ============================================================
   ExamJoin.jsx — Phòng thi học sinh (v3.3 — Force Fullscreen)
   ------------------------------------------------------------
   Tích hợp:
     • ViolationOverlay full-screen khi vi phạm hard
     • Strict mode: 1 vi phạm đã cảnh báo đỏ
     • Banner đỏ nhắc vào lại fullscreen nếu bị thoát
     • Tạm dừng bởi GV (pause overlay)
     • Beep sound khi vi phạm
     • Adaptive thumbnail + burst snapshot
     • Camera AI: no_face, multi_face, look_away, phone_like
     • Listen lệnh từ GV: kick / warn / pause
     • Log chi tiết để debug
   ============================================================ */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getExamByToken,
  submitExam,
  startAttempt,
  saveAttemptAnswers,
  appendAttemptEvents,
} from '../lib/classroom.js';
import {
  joinExamSession,
  heartbeat,
  uploadThumbnailV2,
  uploadBurst,
  reportViolation,
  markStudentSubmitted,
  listenMySessionDoc,
  getLiveSessionForClass,
} from '../lib/examSession.js';
import { useExamGuard } from '../hooks/useExamGuard.js';
import { useProctorCamera } from '../hooks/useProctorCamera.js';
import ExamResult from './ExamResult.jsx';
import ViolationOverlay from './ViolationOverlay.jsx';
import '../styles/classroom.css';
import '../styles/exam-pro.css';

/* ============ SVG ICONS ============ */
const IcoWarning = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IcoClock = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IcoSend = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
const IcoCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoX = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoFullscreen = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);
const IcoShield = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
  </svg>
);
const IcoCam = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
);
const IcoFlag = ({ size = 14, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 22V4M4 4h13l-2 4 2 4H4" />
  </svg>
);
const IcoPanel = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="15" y1="4" x2="15" y2="20" />
  </svg>
);
const IcoMinimize = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoDrag = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" />
  </svg>
);
const IcoBell = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IcoLogout = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IcoPause = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="7" y="5" width="3.5" height="14" rx="1" />
    <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
  </svg>
);

/* ============================================================
   DIALOG XÁC NHẬN NỘP
   ============================================================ */
function ConfirmSubmit({ open, total, answered, flagged, onCancel, onConfirm }) {
  const dlgRef = useRef(null);
  useEffect(() => {
    const d = dlgRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const unanswered = total - answered;

  return (
    <dialog
      ref={dlgRef}
      className="ep-dialog"
      onClose={onCancel}
      onClick={(e) => e.target === dlgRef.current && onCancel()}
    >
      {open && (
        <>
          <div className="ep-dialog-head">
            <IcoSend size={22} />
            <h3>Nộp bài?</h3>
          </div>
          <p className="ep-dialog-body">
            Bạn đã trả lời <b>{answered}</b>/{total} câu.
            {flagged > 0 && <> Có <b>{flagged}</b> câu đang đánh dấu.</>}
            {unanswered > 0 && <> Còn <b>{unanswered}</b> câu chưa làm.</>}
          </p>
          <p className="ep-dialog-note">Sau khi nộp, bạn không thể sửa lại đáp án.</p>
          <div className="ep-dialog-actions">
            <button className="td-btn" onClick={onCancel} type="button">Hủy</button>
            <button className="td-btn primary" onClick={onConfirm} type="button">
              <IcoCheck size={14} /> Nộp bài
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

/* ============================================================
   DIALOG CẢNH BÁO TỪ CÔ GIÁO
   ============================================================ */
function TeacherWarning({ warning, onClose }) {
  if (!warning) return null;
  return (
    <div className="ep-teacher-warn" role="alert">
      <div className="ep-teacher-warn-card">
        <div className="ep-teacher-warn-icon">
          <IcoBell size={20} />
        </div>
        <div>
          <b>Cảnh báo từ giáo viên</b>
          <p>{warning.message}</p>
        </div>
        <button className="ep-teacher-warn-close" onClick={onClose} type="button" aria-label="Đóng">
          <IcoX size={14} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   MÀN HÌNH BỊ KICK
   ============================================================ */
function KickedScreen({ reason, onExit }) {
  return (
    <div className="ej-notfound">
      <IcoLogout size={56} />
      <h2>Bạn đã được mời ra khỏi phòng thi</h2>
      <p>{reason || 'Giáo viên đã kết thúc phiên làm bài của bạn.'}</p>
      <p style={{ color: 'var(--mut)', fontSize: '.85rem' }}>
        Vui lòng liên hệ giáo viên để biết thêm chi tiết.
      </p>
      <button className="td-btn primary" onClick={onExit} type="button">
        Về trang chủ
      </button>
    </div>
  );
}

/* ============================================================
   MÀN HÌNH TẠM DỪNG
   ============================================================ */
function PausedScreen({ onResume }) {
  return (
    <div className="ep-pause-overlay">
      <div className="ep-pause-card">
        <IcoPause size={56} />
        <h2>Bài làm đã tạm dừng</h2>
        <p>Giáo viên yêu cầu bạn tạm dừng làm bài. Vui lòng chờ hướng dẫn tiếp theo.</p>
        <button className="td-btn primary" type="button" onClick={onResume} style={{ marginTop: '1rem' }}>
          <IcoCheck size={14} /> Tôi đã hiểu
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */
const makeThumbnail = (video, max = 160) => {
  if (!video || !video.videoWidth || video.readyState < 2) return null;
  try {
    const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.max(1, Math.round(video.videoWidth * scale));
    const h = Math.max(1, Math.round(video.videoHeight * scale));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.55);
  } catch {
    return null;
  }
};

/* ============================================================
   MAIN
   ============================================================ */
export default function ExamJoin({ token, onExit }) {
  const { user } = useAuth();

  /* ---------- 1. STATE ---------- */
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('confirm');
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraConsent, setCameraConsent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [camMinimized, setCamMinimized] = useState(false);
  const [camPos, setCamPos] = useState({ x: 16, y: null });

  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joinReady, setJoinReady] = useState(false);
  const [teacherWarning, setTeacherWarning] = useState(null);
  const [kickReason, setKickReason] = useState('');
  const [paused, setPaused] = useState(false);
  const [pausedReason, setPausedReason] = useState('');

  /* ---------- 2. REF ---------- */
  const startTimeRef = useRef(null);
  const submittedRef = useRef(false);
  const answersRef = useRef({});
  const saveTimerRef = useRef(null);
  const eventTimerRef = useRef(null);
  const eventQueueRef = useRef([]);
  const attemptRef = useRef(null);
  const guardRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const heartbeatTimerRef = useRef(null);
  const currentQRef = useRef(0);
  const answeredRef = useRef(0);
  const warningSeenRef = useRef(0);
  const activeUntilRef = useRef(0);
  const burstHandlerRef = useRef(null);
  const pausedRef = useRef(false);
  const joinReadyRef = useRef(false);
  const fullscreenRetryRef = useRef(0);

  /* ---------- 3. SYNC REF ---------- */
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { joinReadyRef.current = joinReady; }, [joinReady]);
  useEffect(() => {
    answeredRef.current = Object.keys(answers).length;
  }, [answers]);

  /* ---------- 4. MEMO ---------- */
  const proctorConfig = useMemo(() => exam?.proctor || null, [exam?.id]); // eslint-disable-line

  /* ---------- 5. ORDER ---------- */
  const order = useMemo(() => {
    const n = exam?.questions?.length || 0;
    const idx = Array.from({ length: n }, (_, i) => i);
    if (!exam?.shuffle || !user?.uid) return idx;
    let h = 2166136261;
    for (const ch of `${exam?.id || ''}:${user.uid || ''}`) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    let s = h >>> 0;
    const rnd = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [exam?.id, exam?.shuffle, user?.uid]);

  /* ---------- 6. LOAD EXAM + SESSION ---------- */
  useEffect(() => {
    (async () => {
      try {
        const ex = await getExamByToken(token);
        setExam(ex);
        if (ex) {
          setTimeLeft(ex.duration * 60);
          if (ex.classId) {
            try {
              const live = await getLiveSessionForClass(ex.classId);
              if (live) {
                console.log('[ExamJoin] Tìm thấy live session:', live.id);
                setSession(live);
              }
            } catch (e) {
              console.warn('[ExamJoin] không tìm được session:', e.message);
            }
          }
        }
      } catch (e) {
        console.error('[ExamJoin] Lỗi load exam:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ---------- 7. finishExam ---------- */
  const finishExam = useCallback(async (opts = {}) => {
    if (!exam || !user || submittedRef.current) return;
    submittedRef.current = true;

    const arr = exam.questions.map((_, i) => answersRef.current[i] ?? -1);
    try {
      const res = await submitExam({
        examId: exam.id,
        student: { id: user.uid, name: user.displayName || user.email },
        answers: arr,
        timeSpent: Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000),
        attemptMeta: {
          autoSubmitted: !!opts.auto,
          violationCount: opts.violationCount || 0,
          cameraStatus: opts.cameraStatus || 'off',
        },
      });

      if (sessionId) {
        markStudentSubmitted({ sessionId, studentId: user.uid }).catch(() => {});
      }

      guardRef.current?.exitFullscreen?.();
      if (res.ok) {
        setResult({ ...res, autoSubmitted: !!opts.auto });
        setStage('result');
      } else {
        setResult({
          score: null,
          totalPoints: exam.totalPoints,
          correct: 0,
          total: exam.questions.length,
          detail: [],
          saveError: res.error || 'Không lưu được bài',
          autoSubmitted: !!opts.auto,
        });
        setStage('result');
      }
    } catch (e) {
      console.error('[finishExam] lỗi:', e);
      setResult({
        score: null,
        totalPoints: exam.totalPoints,
        correct: 0,
        total: exam.questions.length,
        detail: [],
        saveError: e.message || 'Lỗi không xác định',
        autoSubmitted: !!opts.auto,
      });
      setStage('result');
    }
  }, [exam, user, sessionId]);

  /* ---------- 8. handleAutoSubmit ---------- */
  const handleAutoSubmit = useCallback((count) => {
    finishExam({ auto: true, violationCount: count ?? guardRef.current?.violations ?? 0 });
  }, [finishExam]);

  /* ---------- 9. GUARD (STRICT MODE) ---------- */
  const guard = useExamGuard({
    active: stage === 'exam',
    onAutoSubmit: handleAutoSubmit,
    config: proctorConfig ? {
      ...proctorConfig,
      strictMode: true,
      fullscreenLock: true,
      blockCopyPaste: true,
    } : null,
    onEvent: (evt) => {
      if (!exam || !user?.uid) return;

      eventQueueRef.current.push(evt);
      clearTimeout(eventTimerRef.current);
      eventTimerRef.current = setTimeout(() => {
        const batch = eventQueueRef.current.splice(0);
        if (!batch.length) return;
        appendAttemptEvents({ examId: exam.id, studentId: user.uid, events: batch }).catch(() => {});
      }, 1000);

      if (sessionId && joinReadyRef.current) {
        const severity = evt.severity || 'hard';
        reportViolation({
          sessionId,
          studentId: user.uid,
          studentName: user.displayName || user.email,
          type: evt.type,
          severity,
          meta: evt.meta || {},
        }).catch((e) => {
          console.warn('[ExamJoin] reportViolation fail:', e.message);
        });

        if (severity === 'hard' && burstHandlerRef.current) {
          try { burstHandlerRef.current(evt); } catch { /* */ }
        }
      }
    },
  });

  guardRef.current = guard;

  /* ---------- 10. CAMERA ---------- */
  const cameraEnabled =
    stage === 'exam' &&
    cameraConsent &&
    proctorConfig?.camera &&
    proctorConfig.camera !== 'off';

  const proctor = useProctorCamera({
    active: cameraEnabled,
    examId: exam?.id,
    studentId: user?.uid,
    config: proctorConfig,
    onEvent: (evt) => {
      guard.pushEvent(evt.type, evt.severity, evt.meta);
    },
  });

  /* ---------- 11. CAMERA BẮT BUỘC ---------- */
  const camBlocked =
    cameraEnabled &&
    proctorConfig?.camera === 'required' &&
    ['denied', 'unavailable', 'error'].includes(proctor.status);

  useEffect(() => {
    if (!camBlocked) return undefined;
    const t = setTimeout(() => {
      guardRef.current?.pushEvent('camera_lost', 'hard', { reason: proctor.status });
    }, 9000);
    return () => clearTimeout(t);
  }, [camBlocked, proctor.status]);

  /* ---------- 12. COUNTDOWN ---------- */
  useEffect(() => {
    if (stage !== 'exam') return undefined;
    if (paused) return undefined;
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [stage, paused]);

  useEffect(() => {
    if (stage === 'exam' && timeLeft === 0 && exam && !paused) {
      finishExam({
        auto: true,
        violationCount: guardRef.current?.violations ?? 0,
        cameraStatus: proctor.status,
      });
    }
  }, [stage, timeLeft, exam, finishExam, proctor.status, paused]);

  /* ---------- 13. persistAnswers ---------- */
  const persistAnswers = useCallback((next) => {
    if (!exam || !user?.uid) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveAttemptAnswers({ examId: exam.id, studentId: user.uid, answers: next }).catch(() => {});
    }, 1500);
  }, [exam, user?.uid]);

  /* ============================================================
     14. SESSION: JOIN
     ============================================================ */
  useEffect(() => {
    if (stage !== 'exam' || !session?.id || !user?.uid) return undefined;
    if (joinReady) return undefined;

    console.log('[ExamJoin] ═══════════════════════════════════════');
    console.log('[ExamJoin] BẮT ĐẦU JOIN SESSION');
    console.log('[ExamJoin] sessionId:', session.id);
    console.log('[ExamJoin] studentId:', user.uid);
    console.log('[ExamJoin] ═══════════════════════════════════════');

    setSessionId(session.id);
    setJoinError(null);

    joinExamSession({
      sessionId: session.id,
      studentId: user.uid,
      studentName: user.displayName || user.email || 'Học sinh',
    })
      .then((res) => {
        console.log('[ExamJoin] ✅ Join session OK:', res);
        setJoinReady(true);
      })
      .catch((e) => {
        console.error('[ExamJoin] ❌ Join session FAIL!');
        console.error('[ExamJoin] code:', e.code);
        console.error('[ExamJoin] message:', e.message);

        setJoinError({
          code: e.code || 'unknown',
          message: e.message || 'Không join được session',
          sessionId: session.id,
          studentId: user.uid,
        });
      });

    const unsub = listenMySessionDoc(session.id, user.uid, (doc) => {
      if (!doc) return;

      if (doc.status === 'kicked') {
        if (stage !== 'kicked') {
          setKickReason(doc.kickReason || '');
          submittedRef.current = true;
          guardRef.current?.exitFullscreen?.();
          setStage('kicked');
        }
        return;
      }

      const w = doc.warning;
      if (w && w.at && w.at > warningSeenRef.current) {
        warningSeenRef.current = w.at;
        setTeacherWarning(w);

        if (w.message && /TẠM DỪNG|tạm dừng|tạm ngưng/i.test(w.message)) {
          setPaused(true);
          setPausedReason(w.message);
        }

        if (w.message && /fullscreen|toàn màn hình/i.test(w.message)) {
          guardRef.current?.enterFullscreen?.();
        }

        setTimeout(() => setTeacherWarning(null), 8000);
      }
    });

    return () => {
      unsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, session?.id, user?.uid, joinReady]);

  /* ============================================================
     15. HEARTBEAT
     ============================================================ */
  useEffect(() => {
    if (stage !== 'exam' || !sessionId || !user?.uid) return undefined;
    if (!joinReady) return undefined;

    const send = () => {
      heartbeat({
        sessionId,
        studentId: user.uid,
        studentName: user.displayName || user.email,
        currentQuestion: currentQRef.current,
        answered: answeredRef.current,
        status: pausedRef.current ? 'paused' : 'examining',
      }).catch(() => {});
    };

    send();
    heartbeatTimerRef.current = setInterval(send, 15000);

    return () => {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    };
  }, [stage, sessionId, user?.uid, paused, joinReady]);

  useEffect(() => {
    if (stage !== 'exam' || !sessionId || !user?.uid) return;
    if (!joinReady) return;
    heartbeat({
      sessionId,
      studentId: user.uid,
      studentName: user.displayName || user.email,
      currentQuestion: currentQ,
      answered: Object.keys(answers).length,
      status: paused ? 'paused' : 'examining',
    }).catch(() => {});
  }, [currentQ, answers, stage, sessionId, user?.uid, paused, joinReady]);

  /* ============================================================
     16. ĐÁNH DẤU ACTIVE
     ============================================================ */
  useEffect(() => {
    if (stage !== 'exam' || paused) return;
    activeUntilRef.current = Date.now() + 5000;
  }, [currentQ, answers, stage, paused]);

  /* ============================================================
     16b. ADAPTIVE THUMBNAIL UPLOAD
     ============================================================ */
  useEffect(() => {
    if (stage !== 'exam' || !sessionId || !user?.uid) return undefined;
    if (!cameraEnabled) return undefined;
    if (!joinReady) return undefined;

    const video = proctor.videoRef?.current;
    if (!video) return undefined;

    console.log('[ExamJoin] 🎥 Bắt đầu upload thumbnail camera');

    let stopped = false;
    let lastFrameData = null;
    let lastUploadAt = 0;
    let intervalId = null;
    let warmupId = null;

    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = 40;
    diffCanvas.height = 30;
    const diffCtx = diffCanvas.getContext('2d', { willReadFrequently: true });

    const grabDiffFrame = () => {
      if (!video || video.readyState < 2) return null;
      try {
        diffCtx.drawImage(video, 0, 0, 40, 30);
        return diffCtx.getImageData(0, 0, 40, 30).data;
      } catch {
        return null;
      }
    };

    const computeMotion = (a, b) => {
      if (!a || !b || a.length !== b.length) return 0;
      let diff = 0;
      const step = 4;
      for (let i = 0; i < a.length; i += step) {
        const dr = Math.abs(a[i] - b[i]);
        const dg = Math.abs(a[i + 1] - b[i + 1]);
        const db = Math.abs(a[i + 2] - b[i + 2]);
        if (dr + dg + db > 45) diff++;
      }
      return diff / (a.length / step);
    };

    const tick = () => {
      if (stopped) return;
      if (!joinReadyRef.current) return;
      const now = Date.now();

      const frame = grabDiffFrame();
      let motion = 0;
      if (frame && lastFrameData) motion = computeMotion(lastFrameData, frame);
      lastFrameData = frame;

      if (motion > 0.04) {
        activeUntilRef.current = now + 5000;
      }

      const isActive = now < activeUntilRef.current;
      const interval = isActive ? 2500 : 8000;

      if (now - lastUploadAt >= interval) {
        lastUploadAt = now;
        const dataUrl = makeThumbnail(video, 160);
        if (dataUrl) {
          uploadThumbnailV2({
            sessionId,
            studentId: user.uid,
            dataUrl,
            motion: isActive,
          }).catch(() => {});
        }
      }
    };

    warmupId = setTimeout(() => {
      if (stopped) return;
      tick();
      intervalId = setInterval(tick, 1000);
    }, 1500);

    return () => {
      stopped = true;
      clearTimeout(warmupId);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, sessionId, user?.uid, cameraEnabled, joinReady]);

  /* ============================================================
     16c. BURST
     ============================================================ */
  useEffect(() => {
    if (stage !== 'exam' || !sessionId || !user?.uid) return undefined;
    if (!cameraEnabled) return undefined;
    if (!joinReady) return undefined;

    const handler = (evt) => {
      if (evt?.severity !== 'hard') return;
      if (!joinReadyRef.current) return;
      const video = proctor.videoRef?.current;
      if (!video || video.readyState < 2) return;

      const frames = [];
      let i = 0;
      const snap = () => {
        if (i >= 5) {
          uploadBurst({
            sessionId,
            studentId: user.uid,
            frames,
            reason: evt.type,
          }).catch(() => {});
          return;
        }
        const dataUrl = makeThumbnail(video, 160);
        if (dataUrl) frames.push(dataUrl);
        i++;
        setTimeout(snap, 400);
      };
      snap();
    };

    burstHandlerRef.current = handler;
    return () => { burstHandlerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, sessionId, user?.uid, cameraEnabled, joinReady]);

  /* ============================================================
     16d. AUTO RE-ENTER FULLSCREEN
     Chạy mỗi khi mất fullscreen trong lúc thi
     ============================================================ */
  const overlayOpen = guard.warning?.type === 'violation'
    || guard.warning?.type === 'violation-strict'
    || guard.warning?.type === 'auto-submit';

  useEffect(() => {
    if (overlayOpen) return undefined;
    if (stage !== 'exam') return undefined;
    if (paused) return undefined;
    if (!proctorConfig?.fullscreenLock) return undefined;
    if (guard.isFullscreen) return undefined;

    // Thử vào lại fullscreen sau 400ms
    const t = setTimeout(() => {
      console.log('[ExamJoin] 🔄 Thử vào lại fullscreen...');
      guard.enterFullscreen().then((ok) => {
        if (!ok) {
          fullscreenRetryRef.current += 1;
          console.warn('[ExamJoin] Không vào được fullscreen, lần thử:', fullscreenRetryRef.current);
        } else {
          fullscreenRetryRef.current = 0;
        }
      });
    }, 400);
    return () => clearTimeout(t);
  }, [overlayOpen, stage, guard, proctorConfig, paused]);

  /* ============================================================
     16e. LISTEN FULLSCREEN CHANGE — hiện banner nếu không ở FS
     ============================================================ */
  const [showFsBanner, setShowFsBanner] = useState(false);

  useEffect(() => {
    if (stage !== 'exam') {
      setShowFsBanner(false);
      return undefined;
    }
    if (!proctorConfig?.fullscreenLock) {
      setShowFsBanner(false);
      return undefined;
    }

    const check = () => {
      const fs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      setShowFsBanner(!fs && !overlayOpen && !paused);
    };

    check();
    const id = setInterval(check, 800);
    return () => clearInterval(id);
  }, [stage, proctorConfig, overlayOpen, paused]);

  /* ---------- 17. Handlers ---------- */
  const startExam = async () => {
    console.log('[ExamJoin] ▶ Bắt đầu thi — thử vào fullscreen...');
    const fsOk = await guard.enterFullscreen();
    console.log('[ExamJoin] Kết quả fullscreen:', fsOk ? '✅ OK' : '❌ Fail');

    if (!fsOk) {
      // Không vào được fullscreen — vẫn cho thi nhưng banner sẽ nhắc
      console.warn('[ExamJoin] Không vào fullscreen ngay, sẽ retry sau khi vào stage exam');
    }

    startTimeRef.current = Date.now();
    submittedRef.current = false;
    setStage('exam');
    guard.reset();

    // Retry sau khi vào stage exam (đề phòng Chrome block lần đầu)
    if (!fsOk) {
      setTimeout(() => {
        console.log('[ExamJoin] 🔄 Retry fullscreen lần 2...');
        guard.enterFullscreen();
      }, 800);
    }

    try {
      const att = await startAttempt({
        examId: exam.id,
        student: { id: user.uid, name: user.displayName || user.email },
      });
      attemptRef.current = att;

      if (!att.submitted && att.answers && typeof att.answers === 'object') setAnswers(att.answers);
      if (!att.submitted && att.startedAt) {
        startTimeRef.current = att.startedAt;
        const elapsed = Math.floor((Date.now() - att.startedAt) / 1000);
        setTimeLeft(Math.max(0, exam.duration * 60 - elapsed));
      }
    } catch (e) {
      console.warn('Không tạo được attempt:', e);
    }
  };

  const handleReenterFullscreen = () => {
    console.log('[ExamJoin] User bấm vào lại fullscreen');
    guard.enterFullscreen();
  };

  const pickAnswer = (qIdx, optIdx) => {
    if (paused) return;
    setAnswers((a) => {
      const next = { ...a, [qIdx]: optIdx };
      persistAnswers(next);
      return next;
    });
  };

  const toggleFlag = (qIdx) => {
    if (paused) return;
    setFlags((f) => ({ ...f, [qIdx]: !f[qIdx] }));
  };

  const onCamDragStart = (e) => {
    if (camMinimized) return;
    const target = e.currentTarget;
    target.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: camPos.x,
      origY: camPos.y ?? window.innerHeight - 260,
    };
  };
  const onCamDragMove = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nx = Math.max(8, Math.min(window.innerWidth - 160, dragRef.current.origX + dx));
    const ny = Math.max(8, Math.min(window.innerHeight - 160, dragRef.current.origY + dy));
    setCamPos({ x: nx, y: ny });
  };
  const onCamDragEnd = (e) => {
    dragRef.current.dragging = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  /* ============================================================
     EARLY RETURN
     ============================================================ */
  if (loading) {
    return (
      <div className="ej-notfound">
        <div className="page-loader-spinner" />
        <p>Đang tải đề…</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="ej-notfound">
        <IcoWarning size={56} />
        <h2>Đề không tồn tại</h2>
        <p>Link có thể đã hết hạn hoặc bị xóa.</p>
        <button className="td-btn primary" onClick={onExit} type="button">Về trang chủ</button>
      </div>
    );
  }

  if (exam.status && exam.status !== 'ok') {
    const isNotOpen = exam.status === 'not-open';
    return (
      <div className="ej-notfound">
        <IcoClock size={56} />
        <h2>{isNotOpen ? 'Đề chưa mở' : 'Đề đã đóng'}</h2>
        <p>
          {isNotOpen && exam.opensAt
            ? `Mở lúc ${new Date(exam.opensAt).toLocaleString('vi-VN')}`
            : exam.closesAt
              ? `Đã đóng lúc ${new Date(exam.closesAt).toLocaleString('vi-VN')}`
              : 'Đề hiện không nhận bài.'}
        </p>
        <button className="td-btn primary" onClick={onExit} type="button">Về trang chủ</button>
      </div>
    );
  }

  if (stage === 'kicked') {
    return <KickedScreen reason={kickReason} onExit={onExit} />;
  }

  if (stage === 'confirm') {
    const needCamera = proctorConfig?.camera === 'required';
    const wantCamera = proctorConfig?.camera && proctorConfig.camera !== 'off';
    const canStart = !needCamera || cameraConsent;

    return (
      <div className="ej-confirm">
        <div className="ej-confirm-card">
          <div className="ej-warn-ico"><IcoShield size={56} /></div>
          <h1>Bạn sắp vào chế độ thi</h1>
          <p className="ej-confirm-sub">{exam.title}</p>

          {session && (
            <p className="ej-session-note">
              <IcoBell size={14} /> Giáo viên đang mở phòng thi — bạn có thể vào bất cứ lúc nào.
            </p>
          )}

          <ul className="ej-rules">
            <li><b>Thời gian:</b> {exam.duration} phút</li>
            <li><b>Số câu:</b> {exam.questions.length}</li>
            <li><b>Tổng điểm:</b> {exam.totalPoints}</li>
            {proctorConfig?.fullscreenLock && <li>Không thoát màn hình thi</li>}
            <li>Chuyển tab / thoát toàn màn hình bị tính vi phạm</li>
            <li><b>Chế độ nghiêm ngặt:</b> vi phạm 1 lần đã cảnh báo đỏ</li>
            <li>Vi phạm {proctorConfig?.tabSwitchLimit ?? 3} lần sẽ tự động nộp bài</li>
          </ul>

          {wantCamera && (
            <div className="ej-privacy">
              <div className="ej-privacy-head">
                <IcoCam size={18} />
                <b>Camera giám sát</b>
              </div>
              <p>
                Camera sẽ bật trong lúc làm bài để phát hiện khuôn mặt, hướng nhìn và cử chỉ bất thường.
                <b> Không ghi video.</b> Giáo viên có thể thấy ảnh chụp nhỏ định kỳ để giám sát trực tiếp.
                Ảnh tự động xoá sau {proctorConfig?.retentionDays ?? 30} ngày.
              </p>
              <label className="ec-check ej-consent">
                <input
                  type="checkbox"
                  checked={cameraConsent}
                  onChange={(e) => setCameraConsent(e.target.checked)}
                />
                Tôi đồng ý bật camera trong lúc làm bài
              </label>
              {needCamera && !cameraConsent && (
                <p className="ej-privacy-warn">
                  Đề này yêu cầu bật camera. Bạn cần đồng ý để bắt đầu.
                </p>
              )}
            </div>
          )}

          {error && <p className="ej-confirm-error">{error}</p>}

          <div className="ej-confirm-actions">
            <button className="td-btn" onClick={onExit} type="button">Hủy</button>
            <button className="td-btn primary big" onClick={startExam} type="button" disabled={!canStart}>
              <IcoFullscreen /> Bắt đầu thi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'result' && result) {
    return (
      <ExamResult
        exam={exam}
        result={result}
        showAnswer={exam.showAnswerAfter}
        onExit={onExit}
      />
    );
  }

  /* ---------- EXAM ---------- */
  const qi = order[currentQ] ?? currentQ;
  const q = exam.questions[qi];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answered = Object.keys(answers).length;
  const flaggedCount = Object.values(flags).filter(Boolean).length;
  const progress = (exam.questions.length > 0) ? (answered / exam.questions.length) * 100 : 0;

  const timerClass =
    timeLeft < 60 ? ' critical'
      : timeLeft < 300 ? ' urgent'
        : '';

  const showMonitor =
    proctorConfig?.camera &&
    proctorConfig.camera !== 'off' &&
    cameraConsent &&
    cameraEnabled;

  const camStyle = camMinimized
    ? { position: 'fixed', left: 16, bottom: 96, zIndex: 60 }
    : camPos.y == null
      ? { position: 'fixed', left: camPos.x, bottom: 96, zIndex: 60 }
      : { position: 'fixed', left: camPos.x, top: camPos.y, zIndex: 60 };

  return (
    <>
      <div className="ep-exam">
        {/* ============ BANNER FULLSCREEN ============ */}
        {showFsBanner && (
          <div className="ep-warning danger" role="alert" style={{
            background: '#dc2626',
            color: '#fff',
            borderColor: '#dc2626',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '.8rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '.8rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
          }}>
            <IcoWarning size={22} />
            <span style={{ flex: 1, fontSize: '.95rem' }}>
              ⚠ Bạn đang KHÔNG ở chế độ toàn màn hình. Đây là vi phạm!
            </span>
            <button
              type="button"
              onClick={handleReenterFullscreen}
              style={{
                background: '#fff',
                color: '#dc2626',
                border: 0,
                padding: '.5rem 1rem',
                borderRadius: '999px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem',
                fontSize: '.85rem',
              }}
            >
              <IcoFullscreen size={14} /> Vào lại ngay
            </button>
          </div>
        )}

        <header className="ep-header">
          <div className="ep-header-left">
            <button
              className="ep-header-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              type="button"
              aria-label="Danh sách câu"
            >
              <IcoPanel size={18} />
            </button>
            <div className="ep-header-title">
              <h2>{exam.title}</h2>
              <span className="ep-header-sub">Câu {currentQ + 1} / {exam.questions.length}</span>
            </div>
          </div>

          <div className="ep-header-center">
            <div className="ep-progress-mini" aria-hidden="true">
              <div className="ep-progress-mini-bar" style={{ width: `${progress}%` }} />
            </div>
            {showMonitor && (
              <span className="ep-monitor-chip">
                <IcoCam size={13} /> Giám sát · Vi phạm {guard.violations}/{guard.maxViolations}
              </span>
            )}
            {session && joinReady && (
              <span className="ep-monitor-chip live">
                <IcoBell size={13} /> Cô đang xem
              </span>
            )}
            {joinError && (
              <span className="ep-monitor-chip" style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>
                ⚠ Không kết nối được GV
              </span>
            )}
            {paused && (
              <span className="ep-monitor-chip" style={{ background: '#f59e0b', color: '#fff', borderColor: '#f59e0b' }}>
                <IcoPause size={13} /> Tạm dừng
              </span>
            )}
          </div>

          <div className="ep-header-right">
            <div className={'ep-timer' + timerClass} role="timer" aria-live="polite">
              <IcoClock size={16} />
              <b>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</b>
            </div>
            <button className="ep-submit-btn" onClick={() => setConfirmOpen(true)} type="button" disabled={paused}>
              <IcoSend size={14} /> Nộp bài
            </button>
          </div>
        </header>

        {guard.warning && guard.warning.type === 'warn-soft' && (
          <div className="ep-warning soft" role="alert">
            <IcoWarning size={18} />
            <span>{guard.warning.text}</span>
            <button className="ep-warning-close" onClick={guard.clearWarning} type="button">
              Đóng
            </button>
          </div>
        )}

        {joinError && (
          <div className="ep-warning danger" role="alert">
            <IcoWarning size={18} />
            <span>
              Không kết nối được với giáo viên ({joinError.code}). Bài làm vẫn được lưu nhưng GV không thấy bạn trong phòng giám sát.
            </span>
          </div>
        )}

        <div className="ep-body">
          <main className="ep-main">
            <div className="ep-q-card">
              <div className="ep-q-head">
                <span className="ep-q-num">Câu {currentQ + 1}</span>
                <button
                  className={'ep-flag-btn' + (flags[qi] ? ' on' : '')}
                  onClick={() => toggleFlag(qi)}
                  type="button"
                  aria-pressed={!!flags[qi]}
                  disabled={paused}
                >
                  <IcoFlag size={13} filled={!!flags[qi]} />
                  {flags[qi] ? 'Bỏ đánh dấu' : 'Đánh dấu'}
                </button>
              </div>

              <p className="ep-q-text">{q.q}</p>

              <div className="ep-opts">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={'ep-opt' + (answers[qi] === i ? ' picked' : '')}
                    onClick={() => pickAnswer(qi, i)}
                    aria-pressed={answers[qi] === i}
                    disabled={paused}
                  >
                    <span className="ep-opt-key">{String.fromCharCode(65 + i)}</span>
                    <span className="ep-opt-text">{opt}</span>
                    {answers[qi] === i && <span className="ep-opt-check"><IcoCheck /></span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="ep-nav">
              <button
                className="ep-nav-btn"
                disabled={currentQ === 0 || paused}
                onClick={() => setCurrentQ((i) => i - 1)}
                type="button"
              >
                Câu trước
              </button>
              {currentQ < exam.questions.length - 1 ? (
                <button
                  className="ep-nav-btn primary"
                  onClick={() => setCurrentQ((i) => i + 1)}
                  type="button"
                  disabled={paused}
                >
                  Câu tiếp
                </button>
              ) : (
                <button
                  className="ep-nav-btn primary"
                  onClick={() => setConfirmOpen(true)}
                  type="button"
                  disabled={paused}
                >
                  <IcoSend size={14} /> Nộp bài
                </button>
              )}
            </div>
          </main>

          <aside className={'ep-sidebar' + (sidebarOpen ? ' open' : '')}>
            <div className="ep-sidebar-head">
              <b>Danh sách câu</b>
              <button
                className="ep-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                type="button"
                aria-label="Đóng"
              >
                <IcoX size={16} />
              </button>
            </div>

            <div className="ep-sidebar-stats">
              <span><i className="dot done" /> Đã làm <b>{answered}</b></span>
              <span><i className="dot flagged" /> Đánh dấu <b>{flaggedCount}</b></span>
              <span><i className="dot todo" /> Chưa làm <b>{exam.questions.length - answered}</b></span>
            </div>

            <div className="ep-sidebar-grid">
              {exam.questions.map((_, i) => {
                const oi = order[i] ?? i;
                const isAnswered = answers[oi] !== undefined;
                const isFlagged = !!flags[oi];
                const isCurrent = i === currentQ;
                const cls =
                  'ep-sidebar-cell' +
                  (isAnswered ? ' done' : '') +
                  (isFlagged ? ' flagged' : '') +
                  (isCurrent ? ' cur' : '');
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls}
                    onClick={() => {
                      if (paused) return;
                      setCurrentQ(i);
                      setSidebarOpen(false);
                    }}
                    aria-label={`Câu ${i + 1}`}
                    disabled={paused}
                  >
                    {i + 1}
                    {isFlagged && <span className="ep-sidebar-flag" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {sidebarOpen && <div className="ep-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        </div>

        {cameraEnabled && (
          <>
            {camMinimized && (
              <button
                className={'ep-cam-mini ' + (proctor.status === 'ok' && proctor.faces > 0 ? 'ok' : 'warn')}
                onClick={() => setCamMinimized(false)}
                type="button"
                aria-label="Mở camera"
                style={camStyle}
              >
                <IcoCam size={18} />
                <span className="ep-cam-mini-dot" />
              </button>
            )}
            <div
              className={'ep-cam ' + (proctor.status === 'ok' && proctor.faces > 0 ? 'ok' : 'warn')}
              style={camMinimized ? { ...camStyle, display: 'none' } : camStyle}
            >
              <div
                className="ep-cam-head"
                onPointerDown={onCamDragStart}
                onPointerMove={onCamDragMove}
                onPointerUp={onCamDragEnd}
                onPointerCancel={onCamDragEnd}
                role="button"
                tabIndex={0}
                aria-label="Kéo để di chuyển camera"
              >
                <IcoDrag size={14} />
                <span className="ep-cam-dot" aria-hidden="true" />
                <span className="ep-cam-status">
                  {proctor.status === 'ok' && proctor.faces > 0 && 'Đang giám sát'}
                  {proctor.status === 'ok' && proctor.faces === 0 && 'Không thấy mặt'}
                  {proctor.status === 'starting' && 'Đang bật…'}
                  {proctor.status === 'denied' && 'Chưa cho phép'}
                  {proctor.status === 'unavailable' && 'Không có camera'}
                  {proctor.status === 'lost' && 'Mất camera'}
                  {proctor.status === 'error' && 'Lỗi camera'}
                  {proctor.status === 'idle' && 'Đang chờ'}
                </span>
                <button
                  className="ep-cam-btn"
                  onClick={(e) => { e.stopPropagation(); setCamMinimized(true); }}
                  type="button"
                  aria-label="Thu gọn"
                >
                  <IcoMinimize size={12} />
                </button>
              </div>
              <video
                ref={proctor.videoRef}
                className="ep-cam-video"
                muted
                playsInline
                autoPlay
              />
              {proctor.faces > 0 && (
                <div className="ep-cam-foot">
                  <span>{proctor.faces} khuôn mặt</span>
                </div>
              )}
            </div>
          </>
        )}

        {camBlocked && (
          <div className="ep-cam-block" role="alertdialog" aria-live="assertive">
            <div className="ep-cam-block-card">
              <IcoCam size={44} />
              <h3>Cần bật camera để tiếp tục</h3>
              <p>
                Đề này bắt buộc camera giám sát. Hãy cho phép trình duyệt dùng camera
                (biểu tượng ổ khoá cạnh thanh địa chỉ) rồi bấm "Thử lại". Đồng hồ vẫn đang chạy.
              </p>
              <button className="td-btn primary" type="button" onClick={() => proctor.start()}>
                Thử lại
              </button>
            </div>
          </div>
        )}

        <ConfirmSubmit
          open={confirmOpen}
          total={exam.questions.length}
          answered={answered}
          flagged={flaggedCount}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            finishExam({
              violationCount: guardRef.current?.violations ?? 0,
              cameraStatus: proctor.status,
            });
          }}
        />

        <TeacherWarning warning={teacherWarning} onClose={() => setTeacherWarning(null)} />
      </div>

      <ViolationOverlay
        warning={guard.warning}
        strict
        onDismiss={() => {
          guard.clearWarning();
          if (proctorConfig?.fullscreenLock && !guard.isFullscreen) {
            guard.enterFullscreen();
          }
        }}
      />

      {paused && (
        <PausedScreen onResume={() => setPaused(false)} />
      )}
    </>
  );
}