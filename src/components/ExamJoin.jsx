/* ============================================================
   ExamJoin.jsx — Phòng thi học sinh (v6 - Theo HUONG_DAN_TICH_HOP)
   ============================================================ */
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getExamByToken,
  submitExam,
  startAttempt,
  saveAttemptAnswers,
  appendAttemptEvents,
  getSubmissionForStudent,
  checkRetryPermit,
  markPermitUsed,
  requestRetry,
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
  listenSession,
  timeRemaining,
} from '../lib/examSession.js';
import { useExamGuard } from '../hooks/useExamGuard.js';
import useMobileGuard from '../hooks/useMobileGuard.js';
import { useProctorCamera } from '../hooks/useProctorCamera.js';
import useMotionGuard, { requestMotionPermission } from '../hooks/useMotionGuard.js';
import ExamResult from './ExamResult.jsx';
import ViolationOverlay from './ViolationOverlay.jsx';
import MathText from './MathText.jsx';
import RetryRequestModal from './RetryRequestModal.jsx';

// [1.1] Import theo hướng dẫn
import ExamPaperView, { PassageBox } from './ExamPaperView.jsx';
import QuestionAnswer, { isChoiceType, QuestionImage } from './QuestionAnswer.jsx';
import { isAnswered, countAnswered, packAnswers } from '../lib/examScoring.js';
import { buildLayout, resolveMode } from '../lib/examLayout.js';
import '../styles/classroom.css';
import '../styles/exam-types.css';
import '../styles/exam-pro.css';
import '../styles/exam-join-v6.css';
import '../styles/exam-paper.css'; // <-- File CSS mới

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

const QuestionCard = memo(function QuestionCard({ q, qi, num, picked, flagged, paused, onPick, onFlag }) {
  const longOpts = (q.options || []).some((o) => String(o ?? '').length > 48);
  return (
    <div className="ep-q-card">
      <div className="ep-q-head">
        <span className="ep-q-num">Câu {num}</span>
        <button
          className={'ep-flag-btn' + (flagged ? ' on' : '')}
          onClick={() => onFlag(qi)}
          type="button"
          aria-pressed={flagged}
          disabled={paused}
        >
          <IcoFlag size={13} filled={flagged} />
          {flagged ? 'Bỏ đánh dấu' : 'Đánh dấu'}
        </button>
      </div>

      {/* [1.3] Hiện bài đọc trong QuestionCard */}
      {(q.passage || q.instruction) && <PassageBox instruction={q.instruction} passage={q.passage} />}

      <MathText as="p" className="ep-q-text">{q.q}</MathText>
      <QuestionImage q={q} />

      {!isChoiceType(q) && <QuestionAnswer q={q} qi={qi} picked={picked} paused={paused} onPick={onPick} />}
      {isChoiceType(q) && (
      <div className={'ep-opts' + (longOpts ? ' one' : '')}>
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={'ep-opt' + (picked === i ? ' picked' : '')}
            onClick={() => onPick(qi, i)}
            aria-pressed={picked === i}
            disabled={paused}
          >
            <span className="ep-opt-key">{String.fromCharCode(65 + i)}</span>
            <span className="ep-opt-text"><MathText>{opt}</MathText></span>
            {picked === i && <span className="ep-opt-check"><IcoCheck /></span>}
          </button>
        ))}
      </div>
      )}
    </div>
  );
});

const QuestionGrid = memo(function QuestionGrid({ total, order, questions, answers, flags, currentQ, paused, onJump }) {
  return (
    <div className="ep-sidebar-grid">
      {Array.from({ length: total }, (_, i) => {
        const oi = order[i] ?? i;
        const done = isAnswered(questions?.[oi], answers[oi]);
        const isFlagged = !!flags[oi];
        const cls =
          'ep-sidebar-cell' +
          (done ? ' done' : '') +
          (isFlagged ? ' flagged' : '') +
          (i === currentQ ? ' cur' : '');
        return (
          <button
            key={i}
            type="button"
            className={cls}
            onClick={() => onJump(i)}
            aria-label={`Câu ${i + 1}`}
            disabled={paused}
          >
            {i + 1}
            {isFlagged && <span className="ep-sidebar-flag" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
});

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
const IcoLock = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

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

function PausedScreen() {
  return (
    <div className="ep-pause-overlay">
      <div className="ep-pause-card">
        <IcoPause size={56} />
        <h2>Bài làm đã tạm dừng</h2>
        <p>Giáo viên yêu cầu bạn tạm dừng làm bài. Vui lòng ngồi yên và chờ hướng dẫn tiếp theo. Đồng hồ đã dừng.</p>
      </div>
    </div>
  );
}

function OutOfAttemptsScreen({ exam, prevSubmission, onExit, onRequestRetry, sending }) {
  return (
    <div className="ej-notfound">
      <IcoLock size={56} />
      <h2>Bạn đã làm bài này rồi</h2>
      <p style={{ color: 'var(--ink)', fontSize: '1rem' }}>
        Đề <b>{exam.title}</b> chỉ cho phép làm 1 lần.
      </p>
      {prevSubmission && (
        <p style={{ fontSize: '.92rem' }}>
          Điểm lần trước: <b>{prevSubmission.score}/{prevSubmission.totalPoints}</b>
          {prevSubmission.autoSubmitted && ' (tự động nộp)'}
        </p>
      )}
      <p style={{ color: 'var(--mut)', fontSize: '.85rem', maxWidth: '42ch' }}>
        Nếu muốn làm lại, hãy gửi yêu cầu cho giáo viên. Khi cô duyệt, bạn có thể vào lại.
      </p>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '.6rem' }}>
        <button
          className="td-btn primary"
          onClick={onRequestRetry}
          type="button"
          disabled={sending}
        >
          <IcoBell size={14} /> {sending ? 'Đang gửi...' : 'Xin cô cho thi lại'}
        </button>
        <button className="td-btn" onClick={onExit} type="button">Về trang chủ</button>
      </div>
    </div>
  );
}

const makeThumbnail = (video, max = 160, quality = 0.55) => {
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
    return c.toDataURL('image/jpeg', quality);
  } catch {
    return null;
  }
};

export default function ExamJoin({ token, onExit }) {
  const { user } = useAuth();

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
  const [camMinimized, setCamMinimized] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [camPos, setCamPos] = useState({ x: 16, y: null });

  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joinReady, setJoinReady] = useState(false);
  const [teacherWarning, setTeacherWarning] = useState(null);
  const [kickReason, setKickReason] = useState('');
  const [paused, setPaused] = useState(false);
  const [typing, setTyping] = useState(false); // đang gõ vào ô trả lời → bàn phím ảo đang mở
  const typingUntilRef = useRef(0);

  const [prevSubmission, setPrevSubmission] = useState(null);
  const [retryPermit, setRetryPermit] = useState(null);
  const [permitChecked, setPermitChecked] = useState(false);
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [sendingRetry, setSendingRetry] = useState(false);

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
  const joinStartedRef = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { joinReadyRef.current = joinReady; }, [joinReady]);
  useEffect(() => {
    answeredRef.current = countAnswered(exam?.questions, answers);
  }, [answers, exam]);

  // Vào phòng thi trên màn hình nhỏ (hoặc xoay/đổi cỡ) → thu camera thành nút tròn, khỏi che bài
  useEffect(() => {
    if (stage !== 'exam') return undefined;
    const fit = () => { if (window.innerWidth < 768) setCamMinimized(true); };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [stage]);

  const proctorConfig = useMemo(() => exam?.proctor || null, [exam?.id]); // eslint-disable-line

  // [1.2] Thay thế logic đảo câu cũ bằng buildLayout
  const mode = useMemo(() => resolveMode(exam), [exam]);
  const layout = useMemo(() => buildLayout(exam, user?.uid), [exam, user?.uid]);
  const order = layout.order;

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
              if (live) setSession(live);
            } catch (e) {
              console.warn('[ExamJoin] không tìm được session:', e.message);
            }
          }

          if (user?.uid) {
            try {
              const prev = await getSubmissionForStudent(ex.id, user.uid);
              setPrevSubmission(prev || null);

              if (prev) {
                if (ex.allowRetry) {
                  setRetryPermit({ canRetry: true, source: 'allowRetry' });
                } else {
                  const permit = await checkRetryPermit({
                    examId: ex.id,
                    classId: ex.classId,
                    studentId: user.uid,
                  });
                  setRetryPermit(permit);
                }
              } else {
                setRetryPermit({ canRetry: true, source: 'first-time' });
              }
            } catch (e) {
              console.warn('[ExamJoin] check permit lỗi:', e.message);
              setRetryPermit({ canRetry: true, source: 'error-fallback' });
            }
            setPermitChecked(true);
          }
        }
      } catch (e) {
        console.error('[ExamJoin] Lỗi load exam:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user?.uid]);

  const finishExam = useCallback(async (opts = {}) => {
    if (!exam || !user || submittedRef.current) return;
    submittedRef.current = true;
    if (opts.auto) console.warn('[ExamJoin] TỰ ĐỘNG NỘP — lý do:', opts.reason || 'violation', opts);

    const arr = packAnswers(exam.questions, answersRef.current);
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
          isRetry: !!prevSubmission,
          permitId: retryPermit?.permit?.id || null,
        },
      });

      if (sessionId) {
        markStudentSubmitted({ sessionId, studentId: user.uid }).catch(() => {});
      }

      guardRef.current?.exitFullscreen?.();
      if (res.ok) {
        setResult({ ...res, autoSubmitted: !!opts.auto, autoReason: opts.auto ? (opts.reason || 'violation') : '' });
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
          autoReason: opts.auto ? (opts.reason || 'violation') : '',
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
        autoReason: opts.auto ? (opts.reason || 'violation') : '',
      });
      setStage('result');
    }
  }, [exam, user, sessionId, retryPermit, prevSubmission]);

  const handleAutoSubmit = useCallback((count) => {
    finishExam({ auto: true, reason: 'violation', violationCount: count ?? guardRef.current?.violations ?? 0 });
  }, [finishExam]);

  const guard = useExamGuard({
    active: stage === 'exam',
    onAutoSubmit: handleAutoSubmit,
    /* Mặc định bật, nhưng NẾU giáo viên đã tắt trong "Chỉnh sửa đề" thì tôn trọng lựa chọn đó */
    config: proctorConfig ? {
      strictMode: true,
      fullscreenLock: true,
      blockCopyPaste: true,
      ...proctorConfig,
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

  // Chống gian lận bổ sung trên điện thoại / máy tính bảng (xoay màn hình, split view, zoom, Back, giữ-chạm…)
  /* Bàn phím ảo (khi gõ câu Trả lời ngắn) làm thay đổi kích thước viewport → KHÔNG được tính là vi phạm */
  const mobilePush = useCallback((type, severity, meta) => {
    const typingNow = Date.now() < typingUntilRef.current;
    if (typingNow && /resize|viewport|orient|zoom|split|keyboard|layout|size/i.test(String(type))) return undefined;
    return guardRef.current?.pushEvent?.(type, severity, meta);
  }, []);

  /* Nhấc / giơ / lắc điện thoại → ghi vi phạm 'hard' → tự chụp ảnh camera gửi giáo viên xem xét */
  useMotionGuard({
    active: stage === 'exam' && !paused && proctorConfig?.motionGuard !== false,
    onLift: (info) => guardRef.current?.pushEvent?.('device_lifted', 'hard', info),
  });

  useMobileGuard({
    active: stage === 'exam' && !paused,
    pushEvent: mobilePush,
    trackHidden: false, // đổi thành true nếu useExamGuard chưa tự bắt visibilitychange
  });

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

  useEffect(() => {
    if (stage !== 'exam') return undefined;
    if (paused) return undefined;
    /* Tính theo đồng hồ thật: khoá màn hình / chuyển tab trên điện thoại làm setInterval bị đóng băng,
       nếu chỉ trừ 1 giây mỗi nhịp thì học sinh được "lời" thời gian. */
    let last = Date.now();
    const tick = () => {
      const d = Math.floor((Date.now() - last) / 1000);
      if (d <= 0) return;
      last += d * 1000;
      setTimeLeft((t) => (t > 0 ? Math.max(0, t - d) : 0));
    };
    const timer = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    window.addEventListener('pageshow', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
      window.removeEventListener('pageshow', tick);
    };
  }, [stage, paused]);

  /* Giữ màn hình sáng: màn hình tự tắt = tab bị ẩn = bị tính vi phạm oan */
  useEffect(() => {
    if (stage !== 'exam' || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let dead = false;
    const acquire = async () => {
      try {
        if (dead || document.visibilityState !== 'visible') return;
        lock = await navigator.wakeLock.request('screen');
      } catch { /* trình duyệt từ chối — bỏ qua */ }
    };
    const onVis = () => { if (document.visibilityState === 'visible') acquire(); };
    acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      dead = true;
      document.removeEventListener('visibilitychange', onVis);
      try { lock?.release?.(); } catch { /* */ }
    };
  }, [stage]);

  /* Lưu ngay bài làm khi ẩn tab / đóng trang (điện thoại hay tự đóng tab nền) + hỏi lại khi vô tình thoát */
  useEffect(() => {
    if (stage !== 'exam' || !exam || !user?.uid) return undefined;
    const flush = () => {
      if (submittedRef.current) return;
      clearTimeout(saveTimerRef.current);
      saveAttemptAnswers({ examId: exam.id, studentId: user.uid, answers: answersRef.current }).catch(() => {});
    };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    const onUnload = (e) => {
      if (submittedRef.current) return;
      flush();
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [stage, exam, user?.uid]);

  /* Chống kéo-để-tải-lại (pull-to-refresh) làm mất bài khi đang cuộn trên điện thoại */
  useEffect(() => {
    if (stage !== 'exam') return undefined;
    const h = document.documentElement;
    const b = document.body;
    const prev = [h.style.overscrollBehaviorY, b.style.overscrollBehaviorY];
    h.style.overscrollBehaviorY = 'none';
    b.style.overscrollBehaviorY = 'none';
    return () => { h.style.overscrollBehaviorY = prev[0]; b.style.overscrollBehaviorY = prev[1]; };
  }, [stage]);

  /* Theo dõi ô nhập đang focus → ẩn thanh điều hướng dưới đáy khi bàn phím mở */
  useEffect(() => {
    if (stage !== 'exam') return undefined;
    const isField = (el) => el && /^(INPUT|TEXTAREA)$/.test(el.tagName) && !['checkbox', 'radio', 'button'].includes(el.type);
    const onIn = (e) => {
      if (!isField(e.target)) return;
      typingUntilRef.current = Date.now() + 3600000;
      setTyping(true);
    };
    const onOut = (e) => {
      if (!isField(e.target)) return;
      typingUntilRef.current = Date.now() + 1500; // bàn phím đóng lại cũng gây resize
      setTyping(false);
    };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === 'exam' && timeLeft === 0 && exam && !paused) {
      finishExam({
        auto: true,
        /* resume_expired: mở lại một lần làm bài cũ chưa nộp (đã quá giờ từ lâu) */
        reason: attemptRef.current?.restored ? 'resume_expired' : 'time',
        violationCount: guardRef.current?.violations ?? 0,
        cameraStatus: proctor.status,
      });
    }
  }, [stage, timeLeft, exam, finishExam, proctor.status, paused]);

  const persistAnswers = useCallback((next) => {
    if (!exam || !user?.uid) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveAttemptAnswers({ examId: exam.id, studentId: user.uid, answers: next }).catch(() => {});
    }, 1500);
  }, [exam, user?.uid]);

  useEffect(() => {
    if (stage !== 'exam' || !session?.id || !user?.uid) return undefined;
    if (joinStartedRef.current) return undefined;
    joinStartedRef.current = true;

    setSessionId(session.id);
    setJoinError(null);

    joinExamSession({
      sessionId: session.id,
      studentId: user.uid,
      studentName: user.displayName || user.email || 'Học sinh',
    })
      .then(() => setJoinReady(true))
      .catch((e) => {
        console.error('[ExamJoin] Join session FAIL:', e.code, e.message);
        joinStartedRef.current = false;
        setJoinError({
          code: e.code || 'unknown',
          message: e.message || 'Không join được session',
          sessionId: session.id,
          studentId: user.uid,
        });
      });

    return undefined;
  }, [stage, session?.id, user?.uid]);

  useEffect(() => {
    if (stage !== 'exam' || !session?.id || !user?.uid) return undefined;

    const unsub = listenMySessionDoc(session.id, user.uid, (doc) => {
      if (!doc) return;

      if (doc.status === 'kicked') {
        setKickReason(doc.kickReason || '');
        submittedRef.current = true;
        guardRef.current?.exitFullscreen?.();
        setStage('kicked');
        return;
      }

      setPaused(!!doc.paused);

      const w = doc.warning;
      if (w && w.at && w.at > warningSeenRef.current) {
        warningSeenRef.current = w.at;
        setTeacherWarning(w);

        if (w.message && /fullscreen|toàn màn hình/i.test(w.message)) {
          guardRef.current?.enterFullscreen?.();
        }

        setTimeout(() => setTeacherWarning(null), 8000);
      }
    });

    return () => {
      unsub?.();
    };
  }, [stage, session?.id, user?.uid]);

  useEffect(() => {
    if (stage !== 'exam' || !session?.id) return undefined;
    let first = true;
    return listenSession(session.id, (s) => {
      if (!s) return;
      if (s.status === 'ended') {
        /* Phòng đã đóng TRƯỚC khi em vào (bản ghi cũ) → không nộp bài trắng thay em */
        const endedBeforeJoin = first && !attemptRef.current?.restored && Date.now() - (startTimeRef.current || 0) < 15000;
        first = false;
        if (!submittedRef.current && !endedBeforeJoin) {
          finishExam({ auto: true, reason: 'teacher_ended', violationCount: guardRef.current?.violations ?? 0 });
        } else if (endedBeforeJoin) {
          console.warn('[ExamJoin] Phòng thi đã kết thúc từ trước — bỏ qua tín hiệu tự nộp.');
        }
        return;
      }
      if (first) {
        first = false;
        const rem = timeRemaining(s);
        if (s.status === 'live' && rem > 0) setTimeLeft((t) => Math.min(t, rem));
      }
    });
  }, [stage, session?.id, finishExam]);

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
      answered: countAnswered(exam?.questions, answers),
      status: paused ? 'paused' : 'examining',
    }).catch(() => {});
  }, [currentQ, answers, stage, sessionId, user?.uid, paused, joinReady]);

  useEffect(() => {
    if (stage !== 'exam' || paused) return;
    activeUntilRef.current = Date.now() + 5000;
  }, [currentQ, answers, stage, paused]);

  useEffect(() => {
    if (stage !== 'exam' || !sessionId || !user?.uid) return undefined;
    if (!cameraEnabled) return undefined;
    if (!joinReady) return undefined;

    const video = proctor.videoRef?.current;
    if (!video) return undefined;

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

  useEffect(() => {
    if (stage !== 'exam' || !sessionId || !user?.uid) return undefined;
    if (!cameraEnabled) return undefined;
    if (!joinReady) return undefined;

    let lastBurstAt = 0;
    const handler = (evt) => {
      if (evt?.severity !== 'hard') return;
      if (!joinReadyRef.current) return;
      const video = proctor.videoRef?.current;
      if (!video || video.readyState < 2) return;
      /* Giơ/nhấc điện thoại, phát hiện điện thoại… cần ảnh rõ: 400px, chụp ngay khung đầu tiên */
      const now = Date.now();
      if (now - lastBurstAt < 3000) return; // tránh gửi dồn dập
      lastBurstAt = now;

      const frames = [];
      let i = 0;
      const snap = () => {
        const dataUrl = makeThumbnail(video, 400, 0.65);
        if (dataUrl) frames.push(dataUrl);
        i++;
        if (i >= 5) {
          uploadBurst({
            sessionId,
            studentId: user.uid,
            frames,
            reason: evt.type,
          }).catch(() => {});
          return;
        }
        setTimeout(snap, 350);
      };
      snap();
    };

    burstHandlerRef.current = handler;
    return () => { burstHandlerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, sessionId, user?.uid, cameraEnabled, joinReady]);

  const overlayOpen = guard.warning?.type === 'violation'
    || guard.warning?.type === 'violation-strict'
    || guard.warning?.type === 'auto-submit';

  const [showFsBanner, setShowFsBanner] = useState(false);

  useEffect(() => {
    if (stage !== 'exam') {
      setShowFsBanner(false);
      return undefined;
    }
    if (!proctorConfig?.fullscreenLock || !guard.fsSupported) {
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
    const evs = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'];
    evs.forEach((n) => document.addEventListener(n, check));
    const id = setInterval(check, 3000); // dự phòng
    return () => {
      evs.forEach((n) => document.removeEventListener(n, check));
      clearInterval(id);
    };
  }, [stage, proctorConfig, overlayOpen, paused, guard.fsSupported]);

  const startExam = async () => {
    requestMotionPermission(); // iOS: phải gọi trong lúc bấm nút (không await để không mất quyền vào fullscreen)
    const fsOk = await guard.enterFullscreen();
    if (!fsOk) {
      console.warn('[ExamJoin] Không vào fullscreen ngay, banner sẽ nhắc lại');
    }

    startTimeRef.current = Date.now();
    submittedRef.current = false;
    joinStartedRef.current = false;

    try {
      const att = await startAttempt({
        examId: exam.id,
        student: { id: user.uid, name: user.displayName || user.email },
        forceNew: !!(prevSubmission && retryPermit?.canRetry),
      });

      if (att.submitted && !retryPermit?.canRetry) {
        setStage('out-of-attempts');
        guard.exitFullscreen();
        return;
      }

      attemptRef.current = att;
      setStage('exam');
      guard.reset();

      if (!att.submitted && att.answers && typeof att.answers === 'object') setAnswers(att.answers);
      if (!att.submitted && att.startedAt) {
        startTimeRef.current = att.startedAt;
        const elapsed = Math.floor((Date.now() - att.startedAt) / 1000);
        setTimeLeft(Math.max(0, exam.duration * 60 - elapsed));
      }
    } catch (e) {
      console.warn('Không tạo được attempt:', e);
      setStage('exam');
      guard.reset();
    }
  };

  const handleReenterFullscreen = () => {
    guard.enterFullscreen();
  };

  const pickAnswer = useCallback((qIdx, optIdx) => {
    if (paused) return;
    setAnswers((a) => {
      if (a[qIdx] === optIdx) return a;
      const next = { ...a, [qIdx]: optIdx };
      persistAnswers(next);
      return next;
    });
  }, [paused, persistAnswers]);

  const toggleFlag = useCallback((qIdx) => {
    if (paused) return;
    setFlags((f) => ({ ...f, [qIdx]: !f[qIdx] }));
  }, [paused]);

  const mainRef = useRef(null);
  const swipeRef = useRef(null);
  const totalQ = exam?.questions?.length || 0;

  // [1.4] Nâng cấp hàm jumpTo
  const jumpTo = useCallback((i) => {
    if (paused) return;
    setSidebarOpen(false);
    if (mode === 'paper') {
      document.getElementById(`pq-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setCurrentQ(i);
  }, [paused, mode]);

  // [1.5] Tắt vuốt chuyển câu ở chế độ đề giấy
  const onTouchStart = useCallback((e) => {
    if (mode === 'paper') { swipeRef.current = null; return; }
    if (e.touches.length !== 1) { swipeRef.current = null; return; }
    if (e.target.closest?.('.katex-display, .ep-scrollx, input, textarea, .ep-tf, .ep-sa')) { swipeRef.current = null; return; }
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, [mode]);

  const onTouchEnd = useCallback((e) => {
    if (mode === 'paper') return;
    const st = swipeRef.current;
    swipeRef.current = null;
    if (!st || paused) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - st.x;
    const dy = t.clientY - st.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - st.t > 700) return;
    setCurrentQ((c) => (dx < 0 ? Math.min(c + 1, totalQ - 1) : Math.max(c - 1, 0)));
  }, [paused, totalQ, mode]);

  // [1.5] Tắt cuộn lên đầu khi ở chế độ đề giấy
  useEffect(() => {
    if (mode === 'paper') return;
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [currentQ, mode]);

  const openRetryModal = () => setRetryModalOpen(true);

  const handleSubmitRetry = async (reason) => {
    setSendingRetry(true);
    try {
      const res = await requestRetry({
        examId: exam.id,
        classId: exam.classId,
        teacherId: exam.created_by || exam.teacherId || null,
        student: { id: user.uid, name: user.displayName || user.email },
        reason,
      });

      if (!res.ok) {
        setError(res.error || 'Không gửi được yêu cầu.');
        if (res.duplicate) setRetryModalOpen(false);
      } else {
        setRetryModalOpen(false);
        setError('');
        setStage('pending-retry');
      }
    } catch (e) {
      setError(e.message || 'Lỗi gửi yêu cầu.');
    } finally {
      setSendingRetry(false);
    }
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

  if (loading || (user?.uid && !permitChecked)) {
    return (
      <div className="ej-notfound">
        <div className="page-loader-spinner" />
        <p>Đang tải đề...</p>
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

  if (stage === 'out-of-attempts') {
    return (
      <>
        <OutOfAttemptsScreen
          exam={exam}
          prevSubmission={prevSubmission}
          onExit={onExit}
          onRequestRetry={openRetryModal}
          sending={sendingRetry}
        />
        {retryModalOpen && (
          <RetryRequestModal
            exam={exam}
            onClose={() => setRetryModalOpen(false)}
            onSubmit={handleSubmitRetry}
            sending={sendingRetry}
            error={error}
          />
        )}
      </>
    );
  }

  if (stage === 'pending-retry') {
    return (
      <div className="ej-notfound">
        <IcoBell size={56} />
        <h2>Đã gửi yêu cầu</h2>
        <p>Yêu cầu xin thi lại của bạn đã được gửi tới giáo viên.</p>
        <p style={{ color: 'var(--mut)', fontSize: '.85rem', maxWidth: '42ch' }}>
          Vui lòng chờ cô duyệt. Khi được duyệt, bạn có thể vào lại link này để thi.
        </p>
        <button className="td-btn primary" onClick={onExit} type="button">Về trang chủ</button>
      </div>
    );
  }

  if (stage === 'confirm') {
    const needCamera = proctorConfig?.camera === 'required';
    const wantCamera = proctorConfig?.camera && proctorConfig.camera !== 'off';
    const canStart = !needCamera || cameraConsent;

    if (prevSubmission && !retryPermit?.canRetry) {
      return (
        <>
          <OutOfAttemptsScreen
            exam={exam}
            prevSubmission={prevSubmission}
            onExit={onExit}
            onRequestRetry={openRetryModal}
            sending={sendingRetry}
          />
          {retryModalOpen && (
            <RetryRequestModal
              exam={exam}
              onClose={() => setRetryModalOpen(false)}
              onSubmit={handleSubmitRetry}
              sending={sendingRetry}
              error={error}
            />
          )}
        </>
      );
    }

    const isRetry = prevSubmission && retryPermit?.canRetry;

    return (
      <div className="ej-confirm">
        <div className="ej-confirm-card">
          <div className="ej-warn-ico"><IcoShield size={56} /></div>
          <h1>{isRetry ? 'Thi lại bài' : 'Bạn sắp vào chế độ thi'}</h1>
          <p className="ej-confirm-sub">{exam.title}</p>

          {isRetry && (
            <p className="ej-session-note" style={{ borderLeftColor: '#16a34a', background: 'color-mix(in srgb, #16a34a 10%, var(--bg))', borderColor: 'color-mix(in srgb, #16a34a 35%, var(--bg))' }}>
              <IcoCheck size={14} /> Bạn đã được cô cho phép thi lại bài này.
            </p>
          )}

          {session && (
            <p className="ej-session-note">
              <IcoBell size={14} /> Giáo viên đang mở phòng thi, bạn có thể vào bất cứ lúc nào.
            </p>
          )}

          <ul className="ej-rules">
            <li><b>Thời gian:</b> {exam.duration} phút</li>
            <li><b>Số câu:</b> {exam.questions.length}</li>
            <li><b>Tổng điểm:</b> {exam.totalPoints}</li>
            {proctorConfig?.fullscreenLock && guard.fsSupported && <li>Không thoát màn hình thi</li>}
            <li>Chuyển tab hoặc thoát toàn màn hình bị tính vi phạm</li>
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
                Ảnh tự động xóa sau {proctorConfig?.retentionDays ?? 30} ngày.
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
              <IcoFullscreen /> {isRetry ? 'Bắt đầu thi lại' : 'Bắt đầu thi'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'result' && result) {
    const REASONS = {
      time: 'Hết giờ làm bài.',
      resume_expired: 'Lần làm bài trước chưa được nộp và đã quá thời gian — hệ thống nộp bài đã lưu.',
      violation: `Đạt ngưỡng vi phạm tối đa (${guardRef.current?.violations ?? '?'}/${guardRef.current?.maxViolations ?? '?'}).`,
      teacher_ended: 'Giáo viên đã kết thúc phòng thi.',
    };
    return (
      <>
        {result.autoSubmitted && REASONS[result.autoReason] && (
          <div style={{ position: 'sticky', top: 0, zIndex: 200, background: '#fef3c7', color: '#92400e', padding: '.6rem 1rem', font: '600 .85rem system-ui, sans-serif', textAlign: 'center', borderBottom: '1px solid #f59e0b' }}>
            Bài được nộp tự động — lý do: {REASONS[result.autoReason]}
          </div>
        )}
        <ExamResult
          exam={exam}
          result={result}
          order={order} // [1.8] Truyền order vào ExamResult
          showAnswer={exam.showAnswerAfter}
          onExit={onExit}
        />
      </>
    );
  }

  const qi = order[currentQ] ?? currentQ;
  const q = exam.questions[qi];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answered = countAnswered(exam.questions, answers);
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
      <div className={'ep-exam' + (typing ? ' kbd' : '') + (mode === 'paper' ? ' is-paper' : '')}>
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
              Bạn đang KHÔNG ở chế độ toàn màn hình. Đây là vi phạm!
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
              <span className="ep-header-sub">
                Câu {currentQ + 1} / {exam.questions.length}
                {showMonitor && <span className="ep-mviol"> · Vi phạm {guard.violations}/{guard.maxViolations}</span>}
              </span>
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
                Không kết nối được GV
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

        <div className="ep-mprog" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>

        <div className="ep-body">
          {/* [1.6] Thay thế nội dung thẻ main bằng logic chia mode */}
          <main
            className={'ep-main' + (mode === 'paper' ? ' paper' : '')}
            ref={mainRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {mode === 'paper' ? (
              <ExamPaperView
                layout={layout}
                questions={exam.questions}
                answers={answers}
                flags={flags}
                paused={paused}
                onPick={pickAnswer}
                onFlag={toggleFlag}
                onVisible={setCurrentQ}
                onSubmit={() => setConfirmOpen(true)}
                rootRef={mainRef}
              />
            ) : (
              <>
                <QuestionCard
                  q={q}
                  qi={qi}
                  num={currentQ + 1}
                  picked={answers[qi]}
                  flagged={!!flags[qi]}
                  paused={paused}
                  onPick={pickAnswer}
                  onFlag={toggleFlag}
                />

                <div className="ep-nav">
                  <button
                    className="ep-nav-btn"
                    disabled={currentQ === 0 || paused}
                    onClick={() => setCurrentQ((i) => i - 1)}
                    type="button"
                  >
                    Câu trước
                  </button>

                  <button
                    className="ep-nav-list"
                    onClick={() => setSidebarOpen(true)}
                    type="button"
                    aria-label="Mở danh sách câu"
                  >
                    {currentQ + 1}/{exam.questions.length}
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
                <p className="ep-swipe-hint">Vuốt trái / phải để chuyển câu</p>
              </>
            )}
          </main>

          {mode === 'paper' && (
            <div className="ep-pbar">
              <button type="button" className="ep-pbar-list" onClick={() => setSidebarOpen(true)} disabled={paused}>
                <IcoPanel size={16} /> {answered}/{exam.questions.length} câu
              </button>
              <button type="button" className="ep-pbar-submit" onClick={() => setConfirmOpen(true)} disabled={paused}>
                <IcoSend size={14} /> Nộp bài
              </button>
            </div>
          )}

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

            <QuestionGrid
              total={exam.questions.length}
              order={order}
              questions={exam.questions}
              answers={answers}
              flags={flags}
              currentQ={currentQ}
              paused={paused}
              onJump={jumpTo}
            />
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
                  {proctor.status === 'starting' && 'Đang bật...'}
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
          if (proctorConfig?.fullscreenLock && guard.fsSupported && !guard.isFullscreen) {
            guard.enterFullscreen();
          }
        }}
      />

      {paused && <PausedScreen />}

      {retryModalOpen && (
        <RetryRequestModal
          exam={exam}
          onClose={() => setRetryModalOpen(false)}
          onSubmit={handleSubmitRetry}
          sending={sendingRetry}
          error={error}
        />
      )}
    </>
  );
}