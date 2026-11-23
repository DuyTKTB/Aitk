/* ============================================================
   ExamJoin.jsx — Phòng thi học sinh (v6 - Theo HUONG_DAN_TICH_HOP)
   ============================================================ */
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { submitExamSafe } from '../lib/submitQueue.js';
import {
  getExamByToken,
  getClassById,
  submitExam,
  gradeAnswers,
  gradePracticeExam,
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
  listenLiveSessionForClass,
  listenLiveSessionForExam,
  listenSession,
  timeRemaining,
} from '../lib/examSession.js';
import { useExamGuard } from '../hooks/useExamGuard.js';
import useMobileGuard from '../hooks/useMobileGuard.js';
import { useProctorCamera, useCameraPreflight } from '../hooks/useProctorCamera.js';
import { useAudioGuard } from '../hooks/useAudioGuard.js';
import useMotionGuard, { requestMotionPermission } from '../hooks/useMotionGuard.js';
import { serverNow } from '../lib/serverClock.js';
import ExamResult from './ExamResult.jsx';
import ViolationOverlay, { unlockAlertAudio } from './ViolationOverlay.jsx';
import MathText, { MathTextConfigContext } from './MathText.jsx';
import { subjectUsesMath } from '../lib/subjects.js';
import RetryRequestModal from './RetryRequestModal.jsx';

// [1.1] Import theo hướng dẫn
import ExamPaperView, { PassageBox } from './ExamPaperView.jsx';
import QuestionAnswer, { isChoiceType, QuestionImage } from './QuestionAnswer.jsx';
import HighlightableMathText from './exam/HighlightableMathText.jsx';
import { isAnswered, countAnswered, packAnswers, qType } from '../lib/examScoring.js';
import { buildLayout, resolveMode } from '../lib/examLayout.js';
import { ElecFlaskBrandSvg } from './teacher/ElecBrandMark.jsx';
import '../styles/classroom.css';
import '../styles/exam-types.css';
import '../styles/exam-pro.css';
import '../styles/exam-join-v6.css';
import '../styles/exam-paper.css'; // <-- File CSS mới
import '../styles/exam-studio.css'; // <-- ELEC Exam Studio Pro (Flagship UI)
import { recordWrongAnswers } from '../lib/wrongQuestionService.js';
import { recordActivity } from '../lib/progress.js';
import { recordDailyStreak } from '../hooks.js';
import { recordGamificationResult } from '../hooks/useGamification.js';

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
const IcoChevronLeft = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IcoChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IcoChevronDown = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcoChevronUp = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IcoSun = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const IcoMoon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const IcoBook = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const IcoStrike = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="4" y1="12" x2="20" y2="12" />
    <path d="M16 6.5C15.4 5 13.9 4 12 4c-2.2 0-4 1.3-4 3.2 0 1.4.8 2.3 2.4 2.8" />
    <path d="M8.4 17.2C9.2 19 10.6 20 12.4 20c2.4 0 4.1-1.4 4.1-3.4 0-.7-.2-1.3-.6-1.8" />
  </svg>
);
const IcoKeyboard = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="6" y1="10" x2="6.01" y2="10" />
    <line x1="10" y1="10" x2="10.01" y2="10" />
    <line x1="14" y1="10" x2="14.01" y2="10" />
    <line x1="18" y1="10" x2="18.01" y2="10" />
    <line x1="7" y1="15" x2="17" y2="15" />
  </svg>
);
const IcoMic = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);
const IcoListChecks = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 6h11M10 12h11M10 18h11" />
    <path d="M3 6l1.5 1.5L7 5" />
    <path d="M3 12l1.5 1.5L7 11" />
    <path d="M3 18l1.5 1.5L7 17" />
  </svg>
);
const IcoAward = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);
const IcoEye = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IcoRefresh = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IcoHighlighter = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 11l-6 6v3h9l3-3" />
    <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
  </svg>
);

const Q_TYPE_LABEL = {
  single_choice: 'Trắc nghiệm 4 lựa chọn',
  true_false: 'Đúng / Sai (4 ý)',
  short_answer: 'Trả lời ngắn',
  essay: 'Tự luận / Mở',
};

const QuestionCard = memo(function QuestionCard({
  q, qi, num, total, picked, flagged, paused, eliminatedMap,
  highlightActive, highlightedMap,
  onPick, onFlag, onToggleEliminate, onToggleHighlightMode, onToggleHighlightWord, onClearHighlights, onZoom,
}) {
  const type = qType(q);
  const longOpts = (q.options || []).some((o) => String(o ?? '').length > 34);
  const hasAnswer = isAnswered(q, picked);
  const pickedLetter = type === 'single_choice' && typeof picked === 'number'
    ? String.fromCharCode(65 + picked)
    : null;
  const hasLit = highlightedMap && Object.values(highlightedMap).some(Boolean);

  return (
    <div className="ep-q-card">
      <div className="ep-q-head">
        <div className="ep-q-meta-left">
          <span className="ep-q-num">Câu {String(num).padStart(2, '0')} / {total}</span>
          <span className="ep-q-chip">{Q_TYPE_LABEL[type] || 'Trắc nghiệm'}</span>
          {q.points != null && Number(q.points) > 0 && (
            <span className="ep-q-chip">{q.points} điểm</span>
          )}
          {hasAnswer && (
            <span className="ep-q-chip answered">
              <IcoCheck size={12} /> {pickedLetter ? `Đã chọn ${pickedLetter}` : 'Đã trả lời'}
            </span>
          )}
        </div>
        <div className="ep-q-actions">
          <button
            className={'ep-hl-btn' + (highlightActive ? ' on' : '')}
            onClick={onToggleHighlightMode}
            type="button"
            aria-pressed={highlightActive}
            disabled={paused}
            title="Bật/tắt bút dạ quang tô từ khóa đề bài (phím H)"
          >
            <IcoHighlighter size={13} />
            {highlightActive ? 'Đang tô' : 'Tô từ khóa'}
          </button>
          <button
            className={'ep-flag-btn' + (flagged ? ' on' : '')}
            onClick={() => onFlag(qi)}
            type="button"
            aria-pressed={flagged}
            disabled={paused}
            title="Đánh dấu câu cần xem lại (phím F)"
          >
            <IcoFlag size={13} filled={flagged} />
            {flagged ? 'Đang đánh dấu' : 'Đánh dấu'}
          </button>
        </div>
      </div>

      {highlightActive && (
        <div className="ep-hl-banner" role="status">
          <span className="ep-hl-banner-left">
            <IcoHighlighter size={14} />
            Nhấn vào từng từ trong câu hỏi để tô vàng từ khóa quan trọng (VD: không đúng, ở đkc).
          </span>
          <span className="ep-hl-banner-btns">
            {hasLit && (
              <button
                type="button"
                className="ep-hl-mini-btn"
                onClick={() => onClearHighlights?.(qi)}
              >
                Xóa màu
              </button>
            )}
            <button
              type="button"
              className="ep-hl-mini-btn done"
              onClick={onToggleHighlightMode}
            >
              Xong
            </button>
          </span>
        </div>
      )}

      {/* [1.3] Hiện bài đọc trong QuestionCard */}
      {(q.passage || q.instruction) && <PassageBox instruction={q.instruction} passage={q.passage} />}

      <HighlightableMathText
        text={q.q || (q.passage ? '(Điền vào chỗ trống / trả lời theo ngữ liệu trên)' : '')}
        className="ep-q-text"
        active={highlightActive}
        highlightedMap={highlightedMap}
        onToggleWord={(wIdx) => onToggleHighlightWord?.(qi, wIdx)}
      />
      <QuestionImage q={q} onZoom={onZoom} />

      {!isChoiceType(q) && <QuestionAnswer q={q} qi={qi} picked={picked} paused={paused} onPick={onPick} />}
      {isChoiceType(q) && (
        <div className={'ep-opts' + (longOpts ? ' one' : '')}>
          {q.options.map((opt, i) => {
            const isPicked = picked === i;
            const isElim = !!eliminatedMap?.[i] && !isPicked;
            return (
              <div key={i} className={'ep-opt-row' + (isElim ? ' eliminated' : '')}>
                <button
                  type="button"
                  className={'ep-opt' + (isPicked ? ' picked' : '')}
                  onClick={() => onPick(qi, i)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isPicked) onToggleEliminate?.(qi, i);
                  }}
                  aria-pressed={isPicked}
                  disabled={paused}
                >
                  <span className="ep-opt-key">{String.fromCharCode(65 + i)}</span>
                  <span className="ep-opt-text"><MathText>{opt}</MathText></span>
                  {isPicked && <span className="ep-opt-check"><IcoCheck size={13} /></span>}
                </button>
                {!isPicked && (
                  <button
                    type="button"
                    className="ep-opt-strike"
                    disabled={paused}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEliminate?.(qi, i);
                    }}
                    aria-label={isElim ? `Bỏ gạch đáp án ${String.fromCharCode(65 + i)}` : `Gạch loại trừ đáp án ${String.fromCharCode(65 + i)}`}
                    title={isElim ? 'Bỏ gạch loại trừ' : 'Gạch bỏ đáp án loại trừ (hoặc chuột phải)'}
                  >
                    <IcoStrike size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const QuestionGrid = memo(function QuestionGrid({
  total, order, questions, answers, flags, currentQ, paused, filter = 'all', onJump,
}) {
  const items = [];
  for (let i = 0; i < total; i++) {
    const oi = order[i] ?? i;
    const done = isAnswered(questions?.[oi], answers[oi]);
    const isFlagged = !!flags[oi];
    if (filter === 'todo' && done) continue;
    if (filter === 'flagged' && !isFlagged) continue;
    items.push({ i, done, isFlagged });
  }

  return (
    <div className="ep-sidebar-grid">
      {items.length === 0 ? (
        <div className="ep-sidebar-empty">
          {filter === 'flagged'
            ? 'Chưa có câu nào được đánh dấu.'
            : 'Tuyệt vời! Bạn đã làm hết tất cả câu hỏi.'}
        </div>
      ) : items.map(({ i, done, isFlagged }) => {
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

function ConfirmSubmit({ open, total, answered, flagged, submitting, onCancel, onConfirm }) {
  const dlgRef = useRef(null);
  useEffect(() => {
    const d = dlgRef.current;
    if (!d) return;
    try {
      if (open && !d.open) d.showModal();
      if (!open && d.open) d.close();
    } catch { /* ignore */ }
  }, [open]);

  const unanswered = total - answered;

  return (
    <dialog
      ref={dlgRef}
      className="ep-dialog ep-studio-dialog"
      onClose={() => { if (!submitting) onCancel(); }}
      onClick={(e) => {
        const rect = dlgRef.current?.getBoundingClientRect();
        if (rect && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
          if (!submitting) onCancel();
        }
      }}
    >
      {open && (
        <>
          <div className="ep-dialog-head">
            <IcoSend size={22} />
            <h3>Xác nhận nộp bài?</h3>
          </div>
          <div className="ep-studio-dialog-grid">
            <div className="ep-studio-dialog-stat ok">
              <b>{answered}/{total}</b>
              <span>Đã trả lời</span>
            </div>
            <div className={'ep-studio-dialog-stat' + (unanswered > 0 ? ' warn' : '')}>
              <b>{unanswered}</b>
              <span>Chưa làm</span>
            </div>
            <div className={'ep-studio-dialog-stat' + (flagged > 0 ? ' warn' : '')}>
              <b>{flagged}</b>
              <span>Đánh dấu</span>
            </div>
          </div>
          <p className="ep-dialog-note">
            {unanswered > 0
              ? `Bạn vẫn còn ${unanswered} câu chưa trả lời. Sau khi nộp sẽ không thể sửa lại đáp án.`
              : 'Bạn đã hoàn thành toàn bộ câu hỏi. Sau khi nộp sẽ không thể sửa lại đáp án.'}
          </p>
          <div className="ep-dialog-actions">
            <button className="td-btn" onClick={onCancel} type="button" disabled={submitting}>Kiểm tra lại</button>
            <button className="td-btn primary" onClick={onConfirm} type="button" disabled={submitting}>
              {submitting ? (
                <>Đang nộp bài...</>
              ) : (
                <><IcoCheck size={14} /> Xác nhận nộp bài</>
              )}
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

function OutOfAttemptsScreen({ exam, prevSubmission, onExit, onRequestRetry, sending, onViewResult }) {
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
        {prevSubmission && onViewResult && (
          <button className="td-btn" onClick={onViewResult} type="button">
            👁 Xem lại bài làm
          </button>
        )}
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

/* Sự kiện cần chụp nhanh burst / lưu bằng chứng gửi giáo viên */
const EVIDENCE_TYPES = new Set([
  'phone_like', 'phone_detected', 'hand_raise', 'multi_face', 'no_face',
  'look_away', 'device_lifted', 'camera_lost', 'camera_covered', 'camera_frozen',
  'voice_detected', 'multi_device', 'devtools_open',
]);

/* Mỗi tab trình duyệt giữ 1 lockToken riêng trong sessionStorage (giữ nguyên khi F5, khác tab/máy sẽ khác token) */
function getOrCreateTabLockToken(examId) {
  if (!examId) return null;
  try {
    const key = `elec_tab_lock_${examId}`;
    let tok = sessionStorage.getItem(key);
    if (!tok) {
      tok = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, tok);
    }
    return tok;
  } catch {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getDeviceLabel() {
  if (typeof navigator === 'undefined') return 'unknown';
  const mob = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');
  const w = typeof window !== 'undefined' ? window.innerWidth : 0;
  return `${mob ? 'mobile' : 'desktop'}_${w}w`;
}

function WatermarkOverlay({ studentName, studentId }) {
  const [stamp, setStamp] = useState(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const id = setInterval(() => {
      setStamp(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(id);
  }, []);
  const text = `${studentName || 'Thí sinh'} · ${(studentId || '').slice(-6)} · ${stamp}`;
  return (
    <div className="ep-watermark" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i}>{text}</span>
      ))}
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
  const { user, ready } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('confirm');
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  /* Đề riêng tư của lớp mình không thuộc → chặn ở client (rules đọc đang mở) */
  const [blocked, setBlocked] = useState(false);
  /* Đề đang khoá: học sinh thấy bảng "chờ giáo viên mở"; chỉ khi tự bấm
     "Luyện tập trước" mới vào chế độ luyện tập (không tính điểm). */
  const [practiceOptIn, setPracticeOptIn] = useState(false);
  const [cameraConsent, setCameraConsent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [camMinimized, setCamMinimized] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [camPos, setCamPos] = useState({ x: 16, y: null });

  // ELEC Exam Studio Pro UI controls (local visual aids only — zero effect on scoring/anti-cheat)
  const [examSurface, setExamSurface] = useState(() => {
    try {
      const saved = localStorage.getItem('elec_exam_surface');
      if (saved === 'default' || saved === 'warm' || saved === 'dark') return saved;
      return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';
    } catch {
      return 'default';
    }
  });
  const [fontScale, setFontScale] = useState(() => {
    try {
      const saved = localStorage.getItem('elec_exam_font');
      return saved === 'sm' || saved === 'md' || saved === 'lg' ? saved : 'md';
    } catch {
      return 'md';
    }
  });
  const [navFilter, setNavFilter] = useState('all');
  const [eliminated, setEliminated] = useState({});
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState({});
  const [zoomImg, setZoomImg] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 1024
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 1024px)');
    const onChange = (e) => setIsCompactViewport(e.matches);
    setIsCompactViewport(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joinReady, setJoinReady] = useState(false);
  const [teacherWarning, setTeacherWarning] = useState(null);
  const [kickReason, setKickReason] = useState('');
  const [paused, setPaused] = useState(false);
  const [multiDeviceLocked, setMultiDeviceLocked] = useState(false);
  const [typing, setTyping] = useState(false); // đang gõ vào ô trả lời → bàn phím ảo đang mở
  const typingUntilRef = useRef(0);
  const [camReady, setCamReady] = useState(undefined); // camera đã chạy ổn → guard rút ngắn thời gian miễn trừ

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
  const lastClosesAtRef = useRef(0);
  const pendingHydrateRef = useRef(null);
  const multiDeviceReportedRef = useRef(false);
  const rapidPickWindowRef = useRef([]);
  const tabLockToken = useMemo(() => getOrCreateTabLockToken(exam?.id), [exam?.id]);

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
        const cleanToken = String(token || '').split('?')[0].trim();
        const ex = await getExamByToken(cleanToken);
        setExam(ex);
        if (ex) {
          setTimeLeft(ex.duration * 60);

          /* Đề RIÊNG TƯ: chỉ thành viên lớp / giáo viên phụ trách mới vào được.
             Rules để đọc mở (vì query theo token), nên chặn ở đây. */
          if (ex.visibility !== 'public' && ex.classId && user?.uid && user.uid !== ex.teacherId) {
            try {
              const cls = await getClassById(ex.classId);
              const ids = cls?.memberIds || [];
              const inMembers = ids.includes(user.uid)
                || (cls?.members || []).some((m) => (m?.id || m?.uid) === user.uid);
              const isOwner = cls?.teacherId === user.uid;
              if (!inMembers && !isOwner) setBlocked(true);
            } catch (e) {
              console.warn('[ExamJoin] không kiểm tra được lớp:', e?.message);
            }
          }

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

              // Nếu trên URL có view=result và đã có bài nộp trước đó -> chuyển sang xem lại ngay
              const isViewResult = window.location.href.includes('view=result') || String(token || '').includes('view=result');
              if (isViewResult && prev) {
                setResult(prev);
                setStage('result');
              }

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

  /* Giáo viên mở phòng thi SAU khi học sinh đã tải đề → vẫn tự nhận phòng theo thời gian thực (không cần F5) */
  useEffect(() => {
    if ((!exam?.id && !exam?.classId) || session || submittedRef.current) return undefined;
    if (stage !== 'confirm' && stage !== 'exam') return undefined;

    // Ưu tiên 1: Lắng nghe chính xác theo mã đề thi (Realtime trực tiếp)
    if (exam?.id) {
      const unsub = listenLiveSessionForExam(exam.id, (live) => {
        if (live) setSession(live);
      });
      return () => unsub?.();
    }

    // Ưu tiên 2: Lắng nghe theo lớp nếu đề có gắn classId
    if (exam?.classId) {
      return listenLiveSessionForClass(exam.classId, (live) => {
        if (live && (!live.examId || live.examId === exam.id)) setSession(live);
      });
    }
  }, [exam?.id, exam?.classId, session, stage]);

  /* LUYỆN TẬP: đề bật "khoá bài" nhưng giáo viên CHƯA bấm Bắt đầu thi
     → chấm tại chỗ, không ghi bài nộp, không tính vi phạm. */
  const lockWaiting = !!exam?.lockUntilStart && !session && !sessionId && !practiceOptIn;
  const practiceMode = !!exam?.lockUntilStart && !session && !sessionId && practiceOptIn;

  const finishExam = useCallback(async (opts = {}) => {
    if (!exam || submittedRef.current) return;
    if (!user) {
      alert('Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại để nộp bài.');
      return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    guardRef.current?.stop?.(); // đã nộp → ngừng ghi vi phạm (thoát fullscreen sau nộp không bị tính)
    if (opts.auto) console.warn('[ExamJoin] TỰ ĐỘNG NỘP — lý do:', opts.reason || 'violation', opts);

    const arr = packAnswers(exam.questions, answersRef.current);

    /* Luyện tập: đề Mức 2 (secureAnswerKey) chấm trên server để không lộ đáp án; đề cũ chấm tại chỗ */
    if (practiceMode) {
      try {
        const g = exam.secureAnswerKey
          ? await gradePracticeExam({ examId: exam.id, answers: arr })
          : (gradeAnswers(exam.questions, arr) || {});
        if (exam.secureAnswerKey && !g?.ok) {
          throw new Error(g?.error || 'Không chấm được bài luyện tập trên máy chủ.');
        }
        const detail = g.detail || [];
        setResult({
          score: g.score ?? null,
          totalPoints: g.totalPoints ?? exam.totalPoints,
          correct: g.correct ?? g.correctCount ?? detail.filter((d) => d.isCorrect).length,
          total: g.total ?? (detail.length || exam.questions.length),
          detail,
          answers: arr,
          practice: true,
          autoSubmitted: false,
          autoReason: '',
        });
      } catch (e) {
        setResult({
          score: null, totalPoints: exam.totalPoints, correct: 0,
          total: exam.questions.length, detail: [], practice: true,
          saveError: e?.message || 'Không chấm được bài luyện tập',
        });
      }
      setSubmitting(false);
      setConfirmOpen(false);
      setStage('result');
      return;
    }

    const payload = {
      examId: exam.id,
      student: { id: user.uid, name: user.displayName || user.email },
      answers: arr,
      timeSpent: Math.round((serverNow() - (startTimeRef.current || serverNow())) / 1000),
      attemptMeta: {
        autoSubmitted: !!opts.auto,
        violationCount: opts.violationCount || 0,
        cameraStatus: opts.cameraStatus || 'off',
        isRetry: !!prevSubmission,
        permitId: retryPermit?.permit?.id || null,
        sessionId: sessionId || session?.id || null,
      },
    };

    try {
      const res = await submitExamSafe(payload);

      const activeSid = sessionId || session?.id;
      if (activeSid) {
        markStudentSubmitted({ sessionId: activeSid, studentId: user.uid }).catch(() => {});
      }

      guardRef.current?.exitFullscreen?.();
      setConfirmOpen(false);

      if (res.ok || res.queued) {
        /* Ghi nhận câu sai vào Sổ tay lỗi dùng chung (WrongNotebook) */
        try {
          const detailList = res.detail || [];
          const wrongItems = exam.questions.map((q, i) => {
            const d = detailList[i];
            const isOk = d ? d.isCorrect : false;
            return {
              question: q,
              userPicked: arr[i],
              isCorrect: isOk,
              examTitle: exam.title,
              examId: exam.id,
              source: `class-exam:${exam.id}`,
              topicId: q.topicId || q.topic_id,
            };
          }).filter((it) => !it.isCorrect);
          recordWrongAnswers(user.uid, wrongItems);
        } catch (err) {
          console.warn('[ExamJoin] recordWrongAnswers error:', err);
        }

        /* Ghi nhận hoạt động vào Trang chủ & Chuỗi ngày học (Streak) & Gamification XP */
        try {
          recordActivity({ type: 'exam', title: exam.title, hash: 'exam', count: 1 });
          recordDailyStreak();
          recordGamificationResult(user?.uid, {
            correctCount: res.correct,
            wrongCount: Math.max(0, (res.total || 0) - (res.correct || 0)),
          });
          localStorage.setItem('cs-last-submission-ts', String(Date.now()));
          window.dispatchEvent(new CustomEvent('cs-submission-created', { detail: { examId: exam.id, subId: res.id } }));
        } catch { /* ignore */ }

        setResult({
          ...res,
          answers: arr,
          rawPayload: payload,
          autoSubmitted: !!opts.auto,
          autoReason: opts.auto ? (opts.reason || 'violation') : ''
        });
        setStage('result');
      } else {
        // Lưu thất bại nhưng vẫn có kết quả điểm để xem và có nút Nộp lại
        setResult({
          score: res.score ?? null,
          totalPoints: exam.totalPoints,
          correct: res.correct ?? 0,
          total: exam.questions.length,
          detail: res.detail || [],
          answers: arr,
          rawPayload: payload,
          saveError: res.saveError || res.error || 'Không lưu được bài lên hệ thống',
          autoSubmitted: !!opts.auto,
          autoReason: opts.auto ? (opts.reason || 'violation') : '',
        });
        setStage('result');
      }
    } catch (e) {
      console.error('[finishExam] lỗi:', e);
      setConfirmOpen(false);
      setResult({
        score: null,
        totalPoints: exam.totalPoints,
        correct: 0,
        total: exam.questions.length,
        detail: [],
        answers: arr,
        rawPayload: payload,
        saveError: e.message || 'Lỗi không xác định',
        autoSubmitted: !!opts.auto,
        autoReason: opts.auto ? (opts.reason || 'violation') : '',
      });
      setStage('result');
    } finally {
      setSubmitting(false);
    }
  }, [exam, user, sessionId, session, retryPermit, prevSubmission, practiceMode]);

  const handleRetrySubmit = useCallback(async () => {
    if (!result?.rawPayload || submitting) return;
    setSubmitting(true);
    try {
      const res = await submitExamSafe(result.rawPayload);
      if (res.ok) {
        setResult((prev) => ({
          ...prev,
          id: res.id,
          saveError: null,
          queued: false,
        }));
        alert('Đã lưu bài nộp lên hệ thống thành công!');
      } else if (res.queued) {
        setResult((prev) => ({
          ...prev,
          queued: true,
          saveError: null,
        }));
      } else {
        alert('Vẫn chưa lưu được: ' + (res.error || res.saveError || 'Lỗi kết nối mạng.'));
      }
    } catch (e) {
      alert('Lỗi: ' + (e.message || 'Không thể kết nối'));
    } finally {
      setSubmitting(false);
    }
  }, [result, submitting]);

  const handleAutoSubmit = useCallback((count) => {
    finishExam({ auto: true, reason: 'violation', violationCount: count ?? guardRef.current?.violations ?? 0 });
  }, [finishExam]);

  const guard = useExamGuard({
    active: stage === 'exam' && !practiceMode,
    onAutoSubmit: handleAutoSubmit,
    /* Mặc định bật, nhưng NẾU giáo viên đã tắt trong "Chỉnh sửa đề" thì tôn trọng lựa chọn đó */
    config: proctorConfig ? {
      strictMode: true,
      fullscreenLock: true,
      blockCopyPaste: true,
      ...proctorConfig,
      cameraReady: camReady,
    } : null,
    onEvent: (evt) => {
      if (!exam || !user?.uid) return;

      eventQueueRef.current.push(evt);
      clearTimeout(eventTimerRef.current);
      eventTimerRef.current = setTimeout(() => {
        const batch = eventQueueRef.current.splice(0);
        if (!batch.length) return;
        appendAttemptEvents({
          examId: exam.id,
          studentId: user.uid,
          events: batch,
          violationCount: guardRef.current?.violations ?? 0,
        }).catch(() => {});
      }, 650);

      if (sessionId && joinReadyRef.current) {
        const severity = evt.severity || 'hard';
        const snapshotUrl = evt.meta?.snapshotUrl || evt.meta?.inlineThumb || null;
        reportViolation({
          sessionId,
          studentId: user.uid,
          studentName: user.displayName || user.email,
          type: evt.type,
          severity,
          snapshotUrl,
          meta: evt.meta || {},
        }).catch((e) => {
          console.warn('[ExamJoin] reportViolation fail:', e.message);
        });

        if ((severity === 'hard' || EVIDENCE_TYPES.has(evt.type)) && burstHandlerRef.current) {
          try { burstHandlerRef.current(evt); } catch { /* */ }
        }
      }
    },
  });

  guardRef.current = guard;

  /* Khôi phục số vi phạm đã tích luỹ sau khi guard đã bật active (chống F5 reset về 0) */
  useEffect(() => {
    if (stage !== 'exam' || !pendingHydrateRef.current) return;
    const h = pendingHydrateRef.current;
    pendingHydrateRef.current = null;
    guard.hydrateState?.(h.count, h.events);
  }, [stage, guard]);

  /* Giám sát âm thanh cục bộ (nếu GV bật audioMonitor hoặc chế độ Lockdown) */
  const audioGuard = useAudioGuard({
    active: stage === 'exam' && !practiceMode && !paused && !multiDeviceLocked,
    enabled: !!proctorConfig?.audioMonitor,
    onViolation: (type, severity, meta) => guardRef.current?.pushEvent?.(type, severity, meta),
  });

  // Chống gian lận bổ sung trên điện thoại / máy tính bảng (xoay màn hình, split view, zoom, Back, giữ-chạm…)
  /* Bàn phím ảo (khi gõ câu Trả lời ngắn) làm thay đổi kích thước viewport → KHÔNG được tính là vi phạm */
  const mobilePush = useCallback((type, severity, meta) => {
    const typingNow = Date.now() < typingUntilRef.current;
    if (typingNow && /resize|viewport|orient|zoom|split|keyboard|layout|size|shrunk|shrink/i.test(String(type))) return undefined;
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
    /* Tắt trackHidden ở lớp mobile vì useExamGuard đã bắt visibilitychange (tab_hidden);
       giữ pagehide/freeze/orientation/split-view/pinch-zoom để tránh đếm trùng 2 lỗi cho 1 lần rời app. */
    trackHidden: false,
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

  /* TEST CAMERA trước khi vào thi: chỉ cho bắt đầu khi nhận diện được khuôn mặt */
  const wantCamForPre = !!proctorConfig?.camera && proctorConfig.camera !== 'off';
  const pre = useCameraPreflight({
    active: stage === 'confirm' && wantCamForPre && cameraConsent && !!exam,
    requireAiModel: !!(proctorConfig?.requireAiModel || proctorConfig?.lockdown),
  });

  useEffect(() => {
    setCamReady(cameraEnabled && proctor.status === 'ok' ? true : undefined);
  }, [cameraEnabled, proctor.status]);

  const camBlocked =
    cameraEnabled &&
    proctorConfig?.camera === 'required' &&
    ['denied', 'unavailable', 'error', 'lost'].includes(proctor.status);

  useEffect(() => {
    if (!camBlocked) return undefined;
    const t = setTimeout(() => {
      guardRef.current?.pushEvent('camera_lost', 'hard', { reason: proctor.status });
    }, 9000);
    return () => clearTimeout(t);
  }, [camBlocked, proctor.status]);

  useEffect(() => {
    if (stage !== 'exam') return undefined;
    if (paused || multiDeviceLocked) return undefined;
    /* Tính theo đồng hồ thật: khoá màn hình / chuyển tab trên điện thoại làm setInterval bị đóng băng,
       nếu chỉ trừ 1 giây mỗi nhịp thì học sinh được "lời" thời gian. */
    /* Chống chỉnh đồng hồ máy: lấy MAX(đồng hồ đơn điệu, đồng hồ hệ thống).
       Lùi giờ hệ thống → performance.now vẫn chạy; máy ngủ/khoá màn hình → Date.now bù đủ. */
    let lastD = Date.now();
    let lastP = performance.now();
    const tick = () => {
      const elapsed = Math.max(Date.now() - lastD, performance.now() - lastP);
      const d = Math.floor(elapsed / 1000);
      if (d <= 0) return;
      lastD += d * 1000;
      lastP += d * 1000;
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
  }, [stage, paused, multiDeviceLocked]);

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
      clearTimeout(eventTimerRef.current);
      const pendingBatch = eventQueueRef.current.splice(0);
      appendAttemptEvents({
        examId: exam.id,
        studentId: user.uid,
        events: pendingBatch,
        violationCount: guardRef.current?.violations ?? 0,
      }).catch(() => {});
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

  /* Chặn mở đồng thời 2 tab trên cùng trình duyệt (chỉ báo khi tabLockToken khác nhau; F5 giữ nguyên token nên không nhầm) */
  useEffect(() => {
    if (stage !== 'exam' || practiceMode || !exam?.id || !user?.uid || !tabLockToken) return undefined;
    if (proctorConfig?.singleDeviceLock === false) return undefined;
    if (typeof BroadcastChannel === 'undefined') return undefined;

    const ch = new BroadcastChannel(`elec_exam_lock_${exam.id}_${user.uid}`);
    ch.postMessage({ type: 'HELLO', tabId: tabLockToken, at: Date.now() });

    ch.onmessage = (ev) => {
      const msg = ev?.data;
      if (!msg || !msg.tabId || msg.tabId === tabLockToken) return;
      if (msg.type === 'HELLO') {
        ch.postMessage({ type: 'CONFLICT', tabId: tabLockToken });
        setMultiDeviceLocked(true);
        if (!multiDeviceReportedRef.current) {
          multiDeviceReportedRef.current = true;
          guardRef.current?.pushEvent?.('multi_device', 'hard', { source: 'same_browser_tab' });
        }
      } else if (msg.type === 'CONFLICT') {
        setMultiDeviceLocked(true);
      }
    };

    return () => { try { ch.close(); } catch { /* */ } };
  }, [stage, practiceMode, exam?.id, user?.uid, tabLockToken, proctorConfig?.singleDeviceLock]);

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
      lockToken: tabLockToken,
      deviceLabel: getDeviceLabel(),
    })
      .then((res) => {
        setJoinReady(true);
        if (res?.tookOverActive && proctorConfig?.singleDeviceLock !== false && !multiDeviceReportedRef.current) {
          multiDeviceReportedRef.current = true;
          guardRef.current?.pushEvent?.('multi_device', 'hard', {
            source: 'device_takeover',
            previousDeviceLabel: res.previousDeviceLabel,
          });
        }
      })
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
  }, [stage, session?.id, user?.uid, tabLockToken, proctorConfig?.singleDeviceLock]);

  useEffect(() => {
    if (stage !== 'exam' || !session?.id || !user?.uid) return undefined;

    const unsub = listenMySessionDoc(session.id, user.uid, (doc) => {
      if (!doc) return;

      if (doc.status === 'kicked') {
        setKickReason(doc.kickReason || '');
        submittedRef.current = true;
        guardRef.current?.stop?.();
        guardRef.current?.exitFullscreen?.();
        setStage('kicked');
        return;
      }

      if (doc.forceSubmit && !submittedRef.current) {
        finishExam({
          auto: true,
          reason: 'teacher_forced',
          violationCount: guardRef.current?.violations ?? 0,
        });
        return;
      }

      if (
        proctorConfig?.singleDeviceLock !== false &&
        doc.activeLockToken &&
        tabLockToken &&
        doc.activeLockToken !== tabLockToken
      ) {
        setMultiDeviceLocked(true);
        if (!multiDeviceReportedRef.current) {
          multiDeviceReportedRef.current = true;
          guardRef.current?.pushEvent?.('multi_device', 'hard', { source: 'other_device_takeover' });
        }
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
  }, [stage, session?.id, user?.uid, tabLockToken, proctorConfig?.singleDeviceLock, finishExam]);

  useEffect(() => {
    if (stage !== 'exam' || !session?.id) return undefined;
    let first = true;
    return listenSession(session.id, (s) => {
      if (!s) return;
      if (s.status === 'ended') {
        /* Chỉ bỏ qua nếu phòng đã kết thúc TRƯỚC lúc thí sinh bắt đầu làm bài */
        const endedAtMs = s.endedAt?.toMillis?.() ?? s.endedAtMs ?? 0;
        const endedBeforeJoin = first && !attemptRef.current?.restored && endedAtMs > 0 && endedAtMs < (startTimeRef.current || serverNow());
        first = false;
        if (!submittedRef.current && !endedBeforeJoin) {
          finishExam({ auto: true, reason: 'teacher_ended', violationCount: guardRef.current?.violations ?? 0 });
        } else if (endedBeforeJoin) {
          console.warn('[ExamJoin] Phòng thi đã kết thúc từ trước — bỏ qua tín hiệu tự nộp.');
        }
        return;
      }
      const currentEnd = s.closesAt?.toMillis?.() ?? s.closesAtMs ?? 0;
      if (first) {
        first = false;
        lastClosesAtRef.current = currentEnd;
        const rem = timeRemaining(s);
        if (s.status === 'live' && rem > 0) setTimeLeft((t) => Math.min(t, rem));
      } else if (currentEnd > (lastClosesAtRef.current || 0)) {
        const diffSec = Math.round((currentEnd - lastClosesAtRef.current) / 1000);
        lastClosesAtRef.current = currentEnd;
        const rem = timeRemaining(s);
        if (s.status === 'live' && rem > 0) {
          setTimeLeft((t) => Math.max(t + diffSec, rem));
        }
      }
    });
  }, [stage, session?.id, finishExam]);

  useEffect(() => {
    if (stage !== 'exam' || !sessionId || !user?.uid) return undefined;
    if (!joinReady) return undefined;

    const send = () => {
      if (multiDeviceLocked) return;
      heartbeat({
        sessionId,
        studentId: user.uid,
        studentName: user.displayName || user.email,
        currentQuestion: currentQRef.current,
        answered: answeredRef.current,
        status: pausedRef.current ? 'paused' : 'examining',
        lockToken: tabLockToken,
      }).catch(() => {});
    };

    send();
    heartbeatTimerRef.current = setInterval(send, 15000);

    return () => {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    };
  }, [stage, sessionId, user?.uid, paused, joinReady, tabLockToken, multiDeviceLocked]);

  useEffect(() => {
    if (stage !== 'exam' || sessionId == null || !user?.uid) return undefined;
    if (!joinReady || multiDeviceLocked) return undefined;
    const timer = setTimeout(() => {
      heartbeat({
        sessionId,
        studentId: user.uid,
        studentName: user.displayName || user.email,
        currentQuestion: currentQ,
        answered: countAnswered(exam?.questions, answers),
        status: paused ? 'paused' : 'examining',
        lockToken: tabLockToken,
      }).catch(() => {});
    }, 8000);
    return () => clearTimeout(timer);
  }, [currentQ, answers, stage, sessionId, user?.uid, paused, joinReady, tabLockToken, multiDeviceLocked, exam?.questions]);

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
      const interval = isActive ? 8000 : 20000;

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
      if (evt?.severity !== 'hard' && !EVIDENCE_TYPES.has(evt?.type)) return;
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
    if (!guard.fullscreenLock) {
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
  }, [stage, overlayOpen, paused, guard.fullscreenLock]);

  const needCamForStart = proctorConfig?.camera === 'required';
  const startExam = async () => {
    if (!user?.uid) {
      setError('Bạn cần đăng nhập tài khoản để bắt đầu thi.');
      return;
    }
    if (needCamForStart && !(cameraConsent && pre.ready)) return; // chưa qua test camera (chỉ chặn khi camera bắt buộc)
    pre.release(); // nhả camera test để phòng thi dùng lại
    unlockAlertAudio(); // mở khoá Web Audio API ngay trong thao tác bấm nút (iOS/Safari)
    requestMotionPermission(); // iOS: phải gọi trong lúc bấm nút (không await để không mất quyền vào fullscreen)
    // Xin quyền micro trước khi vào fullscreen nếu bật audioMonitor để Chrome không thoát fullscreen giữa giờ thi
    if (proctorConfig?.audioMonitor && !practiceMode && navigator.mediaDevices?.getUserMedia) {
      try {
        let micState = 'prompt';
        if (navigator.permissions?.query) {
          const st = await navigator.permissions.query({ name: 'microphone' });
          micState = st.state;
        }
        if (micState === 'prompt') {
          const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
          ms.getTracks().forEach((t) => t.stop());
        }
      } catch { /* bỏ qua nếu bị từ chối hoặc thiếu micro */ }
    }
    const fsOk = guard.fullscreenLock ? await guard.enterFullscreen() : true;
    if (!fsOk) {
      console.warn('[ExamJoin] Không vào fullscreen ngay, banner sẽ nhắc lại');
    }

    startTimeRef.current = serverNow();
    submittedRef.current = false;
    joinStartedRef.current = false;
    multiDeviceReportedRef.current = false;
    setMultiDeviceLocked(false);

    try {
      const att = await startAttempt({
        examId: exam.id,
        student: { id: user.uid, name: user.displayName || user.email },
        forceNew: !!(prevSubmission && retryPermit?.canRetry),
        lockToken: tabLockToken,
        retryPermitId: retryPermit?.permit?.id || null,
      });

      if (att.submitted && !retryPermit?.canRetry) {
        setStage('out-of-attempts');
        guard.exitFullscreen();
        return;
      }

      attemptRef.current = att;
      guard.reset();
      if (!att.submitted && att.restored && (att.violationCount > 0 || att.events?.length)) {
        pendingHydrateRef.current = {
          count: att.violationCount || 0,
          events: att.events || [],
        };
      } else {
        pendingHydrateRef.current = null;
      }

      if (!att.submitted && att.answers && typeof att.answers === 'object') setAnswers(att.answers);
      if (!att.submitted && att.startedAt) {
        startTimeRef.current = att.startedAt;
        const elapsed = Math.floor(Math.max(0, serverNow() - att.startedAt) / 1000);
        setTimeLeft(Math.max(0, exam.duration * 60 - elapsed));
      }
      setStage('exam');
    } catch (e) {
      console.warn('Không tạo được attempt:', e);
      guard.reset();
      setStage('exam');
    }
  };

  const handleReenterFullscreen = () => {
    guard.enterFullscreen();
  };

  const pickAnswer = useCallback((qIdx, optIdx) => {
    if (paused) return;
    // Phát hiện bot / extension điền tự động (>= 8 câu khác nhau trong 3.5 giây)
    if (!practiceMode) {
      const now = Date.now();
      const recent = rapidPickWindowRef.current.filter((x) => now - x.t <= 3500);
      if (!recent.some((x) => x.q === qIdx)) {
        recent.push({ q: qIdx, t: now });
      }
      rapidPickWindowRef.current = recent;
      if (recent.length >= 8) {
        rapidPickWindowRef.current = [];
        guardRef.current?.pushEvent?.('rapid_answer_bot', 'hard', { burstCount: 8, windowMs: 3500 });
      }
    }
    // Nếu đáp án đang bị gạch loại trừ mà học sinh chọn lại -> tự bỏ gạch
    if (typeof optIdx === 'number') {
      setEliminated((prev) => (prev[qIdx]?.[optIdx] ? { ...prev, [qIdx]: { ...prev[qIdx], [optIdx]: false } } : prev));
    }
    setAnswers((a) => {
      if (a[qIdx] === optIdx) return a;
      const next = { ...a, [qIdx]: optIdx };
      persistAnswers(next);
      return next;
    });
  }, [paused, practiceMode, persistAnswers]);

  const toggleFlag = useCallback((qIdx) => {
    if (paused) return;
    setFlags((f) => ({ ...f, [qIdx]: !f[qIdx] }));
  }, [paused]);

  const toggleEliminate = useCallback((qIdx, optIdx) => {
    if (paused) return;
    setEliminated((prev) => {
      const cur = prev[qIdx] || {};
      return { ...prev, [qIdx]: { ...cur, [optIdx]: !cur[optIdx] } };
    });
  }, [paused]);

  const toggleHighlightMode = useCallback(() => {
    if (paused) return;
    setHighlightMode((v) => !v);
  }, [paused]);

  const toggleHighlightWord = useCallback((qIdx, wordIdx) => {
    if (paused) return;
    setHighlights((prev) => {
      const cur = prev[qIdx] || {};
      return { ...prev, [qIdx]: { ...cur, [wordIdx]: !cur[wordIdx] } };
    });
  }, [paused]);

  const clearHighlights = useCallback((qIdx) => {
    setHighlights((prev) => {
      if (!prev[qIdx]) return prev;
      const next = { ...prev };
      delete next[qIdx];
      return next;
    });
  }, []);

  const cycleSurface = useCallback(() => {
    setExamSurface((cur) => {
      const next = cur === 'default' ? 'warm' : cur === 'warm' ? 'dark' : 'default';
      try { localStorage.setItem('elec_exam_surface', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const stepFont = useCallback((dir) => {
    setFontScale((cur) => {
      const orderScale = ['sm', 'md', 'lg'];
      const idx = orderScale.indexOf(cur);
      const next = orderScale[Math.max(0, Math.min(orderScale.length - 1, idx + dir))];
      try { localStorage.setItem('elec_exam_font', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleZoomImage = useCallback((src, alt) => {
    if (!src) return;
    setZoomImg({ src, alt: alt || 'Hình minh hoạ' });
  }, []);

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

  // Phím tắt phòng thi (Desktop): A–D / 1–4 chọn đáp án, ← → chuyển câu, F đánh dấu, Esc đóng phóng to
  useEffect(() => {
    if (stage !== 'exam' || paused || confirmOpen || submitting) return undefined;
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;

      if (e.key === 'Escape') {
        if (zoomImg) { e.preventDefault(); setZoomImg(null); return; }
        if (helpOpen) { e.preventDefault(); setHelpOpen(false); return; }
        return;
      }
      if (zoomImg || helpOpen) return;

      const curQi = order[currentQ] ?? currentQ;
      const curQ = exam?.questions?.[curQi];
      if (!curQ) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFlag(curQi);
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setHighlightMode((v) => !v);
        return;
      }
      if (mode === 'paper') return;

      if (e.key === 'ArrowLeft') {
        if (currentQ > 0) { e.preventDefault(); setCurrentQ((i) => Math.max(0, i - 1)); }
        return;
      }
      if (e.key === 'ArrowRight') {
        if (currentQ < totalQ - 1) { e.preventDefault(); setCurrentQ((i) => Math.min(totalQ - 1, i + 1)); }
        return;
      }
      if (isChoiceType(curQ)) {
        const keyMap = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
        const idx = keyMap[String(e.key || '').toLowerCase()];
        if (idx != null && idx < (curQ.options?.length || 0)) {
          e.preventDefault();
          pickAnswer(curQi, idx);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage, paused, confirmOpen, submitting, zoomImg, helpOpen, mode, currentQ, totalQ, order, exam?.questions, pickAnswer, toggleFlag]);

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

  if (!ready || loading || (user?.uid && !permitChecked)) {
    return (
      <div className="ej-notfound">
        <div className="page-loader-spinner" />
        <p>{!ready ? 'Đang kiểm tra đăng nhập...' : 'Đang tải đề...'}</p>
      </div>
    );
  }

  if (ready && !user) {
    return (
      <div className="ej-notfound">
        <IcoWarning size={56} />
        <h2>Yêu cầu đăng nhập</h2>
        <p>
          Bạn cần đăng nhập tài khoản học sinh để làm bài và nộp bài kiểm tra này.
        </p>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
          <button
            className="td-btn primary"
            type="button"
            onClick={() => {
              sessionStorage.setItem('cs_auth_redirect', `exam/${token}`);
              window.location.hash = 'login';
            }}
          >
            Đăng nhập ngay
          </button>
          <button className="td-btn" type="button" onClick={onExit}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="ej-notfound">
        <IcoWarning size={56} />
        <h2>Đề này là đề riêng tư</h2>
        <p>
          Đề chỉ dành cho học sinh của lớp. Hãy nhập <b>key lớp</b> để tham gia lớp trước,
          hoặc xin giáo viên chuyển đề sang chế độ công khai.
        </p>
        <button className="td-btn" type="button" onClick={onExit}>Về trang chủ</button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="ej-notfound">
        <IcoWarning size={56} />
        <h2>Không mở được đề này</h2>
        <p>
          Link có thể đã hết hạn, đề đã bị xoá, hoặc đây là <b>đề riêng tư</b> của lớp
          mà bạn chưa tham gia. Hãy nhập key lớp để vào lớp trước, hoặc xin giáo viên
          chuyển đề sang chế độ công khai.
        </p>
        <button className="td-btn primary" onClick={onExit} type="button">Về trang chủ</button>
      </div>
    );
  }

  /* Đề bị khoá và giáo viên CHƯA bấm "Bắt đầu thi" → chờ, không vào làm */
  if (lockWaiting) {
    return (
      <div className="ej-notfound">
        <IcoClock size={56} />
        <h2>Chưa đến giờ thi</h2>
        <p>
          Giáo viên <b>chưa bắt đầu</b> bài này. Trang sẽ <b>tự chuyển sang bài thi</b>
          ngay khi giáo viên bấm “Bắt đầu thi” — bạn không cần tải lại.
        </p>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem', margin: '.2rem 0 .9rem',
            padding: '.3rem .7rem', borderRadius: 999, fontSize: '.74rem', fontWeight: 700,
            background: 'rgba(217, 119, 6, 0.12)', color: '#a45c05',
          }}
        >
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%', background: '#d97706',
              animation: 'ej-pulse 1.4s ease-in-out infinite',
            }}
          />
          Đang chờ giáo viên mở phòng thi
        </div>
        <p style={{ fontSize: '.82rem', opacity: 0.8 }}>
          {exam.title || 'Bài kiểm tra'}
          {exam.classId ? ` · ${exam.questions?.length || 0} câu · ${exam.duration} phút` : ''}
        </p>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '.6rem' }}>
          <button className="td-btn primary" type="button" onClick={() => setPracticeOptIn(true)}>
            Luyện tập trước (không tính điểm)
          </button>
          <button className="td-btn" type="button" onClick={onExit}>Về trang chủ</button>
        </div>
        <p style={{ marginTop: '.7rem', fontSize: '.76rem', opacity: 0.7 }}>
          Luyện tập không lưu điểm, không tính vi phạm và không hiện trong bảng điểm của lớp.
        </p>
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
          onViewResult={prevSubmission ? () => { setResult(prevSubmission); setStage('result'); } : undefined}
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
    const canStart = needCamera ? (cameraConsent && pre.ready) : true;

    if (prevSubmission && !retryPermit?.canRetry) {
      return (
        <>
          <OutOfAttemptsScreen
            exam={exam}
            prevSubmission={prevSubmission}
            onExit={onExit}
            onRequestRetry={openRetryModal}
            sending={sendingRetry}
            onViewResult={() => { setResult(prevSubmission); setStage('result'); }}
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
      <div className="ej-confirm ej-studio-confirm">
        <div className="ej-confirm-card">
          <div className="ej-studio-head">
            <div>
              <span className="ej-studio-brand-row">
                <ElecFlaskBrandSvg size={20} />
                ELEC AI · Phòng thi bảo mật
              </span>
              <h1>{isRetry ? 'Chuẩn bị thi lại' : exam.title}</h1>
              <p className="ej-confirm-sub">
                {isRetry
                  ? exam.title
                  : 'Kiểm tra thông tin đề thi và thiết bị trước khi bước vào chế độ làm bài tập trung.'}
              </p>
            </div>
          </div>

          {isRetry && (
            <p className="ej-session-note" style={{ borderLeftColor: '#16a34a', background: 'color-mix(in srgb, #16a34a 10%, var(--bg))', borderColor: 'color-mix(in srgb, #16a34a 35%, var(--bg))' }}>
              <IcoCheck size={14} /> Bạn đã được giáo viên duyệt cho phép thi lại bài này.
            </p>
          )}

          {session && (
            <p className="ej-session-note">
              <IcoBell size={14} /> Giáo viên đang mở phòng thi trực tuyến — hệ thống giám sát đang hoạt động.
            </p>
          )}

          <div className="ej-studio-metrics">
            <div className="ej-studio-metric">
              <span className="ej-studio-metric-ico"><IcoClock size={18} /></span>
              <div>
                <small>Thời gian làm bài</small>
                <b>{exam.duration} phút</b>
              </div>
            </div>
            <div className="ej-studio-metric">
              <span className="ej-studio-metric-ico"><IcoListChecks size={18} /></span>
              <div>
                <small>Số lượng câu hỏi</small>
                <b>{exam.questions.length} câu</b>
              </div>
            </div>
            <div className="ej-studio-metric">
              <span className="ej-studio-metric-ico"><IcoAward size={18} /></span>
              <div>
                <small>Thang điểm tối đa</small>
                <b>{exam.totalPoints} điểm</b>
              </div>
            </div>
          </div>

          <div className="ej-studio-rules-box">
            <h3 className="ej-studio-rules-title">
              <IcoShield size={16} /> Quy định phòng thi
            </h3>
            <ul className="ej-studio-rules-list">
              {guard.fullscreenLock && (
                <li><IcoCheck size={14} /> Giữ chế độ toàn màn hình trong suốt quá trình làm bài.</li>
              )}
              <li><IcoCheck size={14} /> Không chuyển tab, mở cửa sổ khác hoặc chia đôi màn hình.</li>
              <li><IcoCheck size={14} /> <span><b>Chế độ nghiêm ngặt:</b> vi phạm ngay từ lần đầu sẽ hiển thị cảnh báo đỏ.</span></li>
              {proctorConfig?.audioMonitor && (
                <li><IcoCheck size={14} /> <span><b>Giám sát âm thanh cục bộ:</b> phát hiện trao đổi kéo dài (không ghi âm hay tải lên máy chủ).</span></li>
              )}
              <li><IcoCheck size={14} /> <span>Vi phạm đủ <b>{proctorConfig?.tabSwitchLimit ?? 3} lần</b> hệ thống sẽ tự động thu bài.</span></li>
            </ul>
          </div>

          {wantCamera && (
            <div className="ej-privacy">
              <div className="ej-privacy-head">
                <IcoCam size={18} />
                <b>Camera giám sát AI</b>
              </div>
              <p>
                Camera dùng để phát hiện khuôn mặt, hướng nhìn và cử chỉ bất thường trên máy của bạn.
                <b> Không ghi video.</b> Giáo viên có thể xem ảnh chụp nhỏ định kỳ trong phiên thi.
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
              {cameraConsent && (
                <div style={{ marginTop: '.75rem', display: 'grid', gap: '.5rem', justifyItems: 'center' }}>
                  <div style={{ width: 'min(100%, 320px)', aspectRatio: '4 / 3', borderRadius: 14, overflow: 'hidden', background: '#050918', border: '2px solid ' + (pre.ready ? '#16a34a' : '#f59e0b') }}>
                    <video ref={pre.videoRef} muted playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  </div>
                  <p style={{ margin: 0, textAlign: 'center', fontWeight: 700, fontSize: '.86rem', color: pre.ready ? '#16a34a' : '#b45309' }}>
                    {pre.message}
                  </p>
                  {['denied', 'unavailable', 'error'].includes(pre.status) && (
                    <button className="td-btn" type="button" onClick={pre.retry}>Thử lại camera</button>
                  )}
                </div>
              )}
              {needCamera && !cameraConsent && (
                <p className="ej-privacy-warn">
                  Đề này yêu cầu bật camera. Bạn cần đồng ý để bắt đầu.
                </p>
              )}
            </div>
          )}

          {error && <p className="ej-confirm-error">{error}</p>}

          {needCamera && !canStart && (
            <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.95rem', borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', color: '#b45309', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', lineHeight: 1.4 }}>
              <IcoWarning size={18} />
              <span>
                {!cameraConsent
                  ? 'Vui lòng tích chọn “Tôi đồng ý bật camera” phía trên để mở nút Bắt đầu thi.'
                  : (pre.message || 'Đang chuẩn bị camera... Vui lòng hướng mặt vào khung hình để bắt đầu.')}
              </span>
            </div>
          )}

          <div className="ej-confirm-actions">
            {isRetry && prevSubmission && (
              <button
                className="td-btn"
                onClick={() => { setResult(prevSubmission); setStage('result'); }}
                type="button"
              >
                <IcoEye size={15} /> Xem lại bài trước
              </button>
            )}
            <button className="td-btn" onClick={onExit} type="button">Quay lại</button>
            <button className="td-btn primary big" onClick={startExam} type="button" disabled={!canStart}>
              <IcoFullscreen size={17} /> {isRetry ? 'Bắt đầu thi lại' : 'Bắt đầu làm bài'}
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
      teacher_forced: 'Giáo viên đã thực hiện thu bài ngay lập tức.',
    };
    return (
      <>
        {retryPermit?.canRetry && (
          <div style={{ position: 'sticky', top: 0, zIndex: 201, background: '#ecfdf5', color: '#065f46', padding: '.7rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid #10b981', boxShadow: '0 2px 8px rgba(16,185,129,0.15)' }}>
            <span><b>Thông báo:</b> Bạn đã được giáo viên duyệt cho phép thi lại bài này.</span>
            <button
              type="button"
              className="td-btn primary sm"
              onClick={() => { setStage('confirm'); }}
            >
              <IcoRefresh size={14} /> Bắt đầu thi lại ngay
            </button>
          </div>
        )}
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
          onRetrySubmit={handleRetrySubmit}
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

  const showProctorChip = !practiceMode && !!proctorConfig;
  const showMonitor =
    proctorConfig?.camera &&
    proctorConfig.camera !== 'off' &&
    cameraConsent &&
    cameraEnabled;

  let curtainTitle = '';
  let curtainDesc = '';
  let curtainAction = null;
  if (stage === 'exam' && !practiceMode && !confirmOpen && !submitting) {
    if (multiDeviceLocked) {
      curtainTitle = 'Phát hiện mở đề trên tab / thiết bị khác';
      curtainDesc = 'Phiên làm bài này đã bị khoá để chống gian lận đa thiết bị. Không thể tiếp tục làm bài trên cửa sổ này.';
    } else if (guard.devtoolsOpen && (proctorConfig?.strictMode || proctorConfig?.lockdown)) {
      curtainTitle = 'Công cụ kiểm tra (DevTools) đang mở';
      curtainDesc = 'Đề thi tạm ẩn cho đến khi bạn đóng DevTools / Console.';
    } else if (guard.multiScreen && proctorConfig?.blockMultiScreen !== false) {
      curtainTitle = 'Phát hiện nhiều màn hình mở rộng';
      curtainDesc = 'Vui lòng ngắt kết nối màn hình phụ hoặc chuyển về chế độ 1 màn hình duy nhất.';
    } else if (camBlocked) {
      curtainTitle = 'Camera giám sát bị ngắt';
      curtainDesc = 'Đề thi yêu cầu camera hoạt động liên tục. Hãy bật lại camera để tiếp tục làm bài.';
    } else if (showFsBanner && (proctorConfig?.strictMode || proctorConfig?.lockdown)) {
      curtainTitle = 'Bắt buộc chế độ toàn màn hình';
      curtainDesc = 'Bạn đã thoát khỏi toàn màn hình. Đề thi được làm mờ cho tới khi bạn quay lại toàn màn hình.';
      curtainAction = { label: 'Vào toàn màn hình ngay', onClick: handleReenterFullscreen };
    } else if ((proctorConfig?.blurOnFocusLost !== false) && !guard.windowFocused && !paused && !overlayOpen) {
      curtainTitle = 'Cửa sổ làm bài mất tiêu điểm';
      curtainDesc = 'Nội dung đề thi tạm ẩn khi bạn rời khỏi hoặc chuyển tiêu điểm cửa sổ.';
      curtainAction = { label: 'Quay lại làm bài', onClick: () => { try { window.focus(); } catch { /* */ } } };
    }
  }

  const isMobileViewport = isCompactViewport;
  const mobileCamDragStyle = isMobileViewport && !camMinimized && camPos.y != null
    ? { left: camPos.x, top: camPos.y, bottom: 'auto' }
    : undefined;

  const proctorStatusText =
    proctor.status === 'ok' && proctor.faces > 0 ? 'AI đang giám sát'
      : proctor.status === 'ok' && proctor.faces === 0 ? 'Không thấy mặt'
        : proctor.status === 'starting' ? 'Đang bật camera...'
          : proctor.status === 'denied' ? 'Chưa cấp quyền'
            : proctor.status === 'unavailable' ? 'Không có camera'
              : proctor.status === 'lost' ? 'Mất tín hiệu'
                : proctor.status === 'error' ? 'Lỗi camera'
                  : 'Đang chờ';

  const camOk = proctor.status === 'ok' && proctor.faces > 0;
  const violRatio = guard.maxViolations > 0 ? guard.violations / guard.maxViolations : 0;
  const proctorPillClass =
    guard.violations >= Math.max(1, guard.maxViolations - 1) && guard.violations > 0
      ? ' danger'
      : violRatio > 0
        ? ' warn'
        : '';

  const completionPct = exam.questions.length > 0
    ? Math.round((answered / exam.questions.length) * 100)
    : 0;
  const unansweredCount = Math.max(0, exam.questions.length - answered);

  const surfaceMeta =
    examSurface === 'warm'
      ? { label: 'Chế độ giấy ấm (bảo vệ mắt)', icon: <IcoBook size={15} /> }
      : examSurface === 'dark'
        ? { label: 'Chế độ nền tối tập trung', icon: <IcoMoon size={15} /> }
        : { label: 'Chế độ nền sáng ELEC', icon: <IcoSun size={15} /> };

  return (
    <>
      <div
        className={
          'ep-exam ep-studio' +
          (typing ? ' kbd' : '') +
          (mode === 'paper' ? ' is-paper' : '') +
          (proctorConfig?.blockCopyPaste !== false ? ' no-select' : '') +
          (curtainTitle ? ' is-blurred' : '')
        }
        data-surface={examSurface}
        data-font={fontScale}
      >
        {proctorConfig?.watermark !== false && stage === 'exam' && (
          <WatermarkOverlay studentName={user?.displayName || user?.email} studentId={user?.uid} />
        )}
        {curtainTitle && (
          <div className="ep-privacy-curtain" role="alert" aria-live="assertive">
            <div className="ep-privacy-card">
              <div className="ep-privacy-icon"><IcoShield size={28} /></div>
              <h3>{curtainTitle}</h3>
              <p>{curtainDesc}</p>
              {curtainAction && (
                <button
                  type="button"
                  className="td-btn primary"
                  onClick={curtainAction.onClick}
                >
                  {curtainAction.label}
                </button>
              )}
            </div>
          </div>
        )}
        {showFsBanner && (
          <div className="ep-warning danger" role="alert" style={{
            background: '#dc2626',
            color: '#fff',
            borderColor: '#dc2626',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '.72rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '.75rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.38)',
          }}>
            <IcoWarning size={20} />
            <span style={{ flex: 1, fontSize: '.9rem' }}>
              Bạn đang KHÔNG ở chế độ toàn màn hình. Đây là vi phạm!
            </span>
            <button
              type="button"
              onClick={handleReenterFullscreen}
              style={{
                background: '#fff',
                color: '#dc2626',
                border: 0,
                padding: '.46rem .95rem',
                borderRadius: '999px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem',
                fontSize: '.82rem',
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
              aria-label="Danh sách câu hỏi"
            >
              <IcoPanel size={18} />
            </button>
            <div className="ep-brand-badge">
              <ElecFlaskBrandSvg size={30} />
            </div>
            <span className="ep-brand-divider" aria-hidden="true" />
            <div className="ep-header-title">
              <h2 title={exam.title}>{exam.title}</h2>
              <span className="ep-header-sub">
                Câu {currentQ + 1}/{exam.questions.length} · Đã làm {answered}/{exam.questions.length}
                {practiceMode && <span className="ep-practice-tag">Luyện tập</span>}
                {showProctorChip && (
                  <span className="ep-mviol"> · Vi phạm {guard.violations}/{guard.maxViolations}</span>
                )}
              </span>
            </div>
          </div>

          {/* Giữ trống tuyệt đối vùng giữa topbar để không bao giờ đụng nút (X) thoát Fullscreen của Chrome/Edge */}
          <div className="ep-header-safe-center" aria-hidden="true" />

          <div className="ep-header-right">
            <div className="ep-tools-group" role="group" aria-label="Tùy chỉnh giao diện đọc đề">
              <button
                type="button"
                className="ep-tool-btn"
                onClick={cycleSurface}
                title={`Đổi giao diện đọc (${surfaceMeta.label})`}
                aria-label={surfaceMeta.label}
              >
                {surfaceMeta.icon}
              </button>
              <button
                type="button"
                className={'ep-tool-btn' + (fontScale === 'sm' ? ' active' : '')}
                onClick={() => stepFont(-1)}
                disabled={fontScale === 'sm'}
                title="Thu nhỏ cỡ chữ"
                aria-label="Thu nhỏ cỡ chữ"
              >
                A-
              </button>
              <button
                type="button"
                className={'ep-tool-btn' + (fontScale === 'lg' ? ' active' : '')}
                onClick={() => stepFont(1)}
                disabled={fontScale === 'lg'}
                title="Phóng to cỡ chữ"
                aria-label="Phóng to cỡ chữ"
              >
                A+
              </button>
              <button
                type="button"
                className={'ep-tool-btn ep-tool-help' + (helpOpen ? ' active' : '')}
                onClick={() => setHelpOpen((v) => !v)}
                title="Phím tắt phòng thi"
                aria-label="Phím tắt phòng thi"
              >
                <IcoKeyboard size={15} />
              </button>
            </div>

            {showProctorChip && (
              <div className={'ep-proctor-pill' + proctorPillClass}>
                {showMonitor ? <IcoCam size={14} /> : <IcoShield size={14} />}
                <span>Vi phạm {guard.violations}/{guard.maxViolations}</span>
                {session && joinReady && (
                  <span className="ep-live-tag">
                    <span className="ep-live-dot" aria-hidden="true" /> GV đang xem
                  </span>
                )}
                {joinError && (
                  <span className="ep-live-tag err">
                    <span className="ep-live-dot" aria-hidden="true" /> Mất kết nối GV
                  </span>
                )}
                {audioGuard.status === 'listening' && (
                  <span className="ep-mic-tag" title="Đang giám sát âm thanh cục bộ">
                    <IcoMic size={11} /> Mic
                  </span>
                )}
                {paused && (
                  <span className="ep-practice-tag">
                    <IcoPause size={11} /> Tạm dừng
                  </span>
                )}
              </div>
            )}

            <div className={'ep-timer' + timerClass} role="timer" aria-live="polite">
              <IcoClock size={15} />
              <b>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</b>
            </div>

            <button
              className="ep-submit-btn"
              onClick={() => setConfirmOpen(true)}
              type="button"
              disabled={paused || submitting}
            >
              <IcoSend size={14} /> {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </div>

          <div className="ep-header-progress" aria-hidden="true">
            <div className="ep-header-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {guard.warning && guard.warning.type === 'warn-soft' && (
          <div className="ep-warning soft" role="alert">
            <IcoWarning size={18} />
            <span style={{ flex: 1, fontSize: '.84rem', lineHeight: 1.4 }}>{guard.warning.text}</span>
            <button className="ep-warning-close" onClick={guard.clearWarning} type="button">
              Đóng
            </button>
          </div>
        )}

        {joinError && (
          <div className="ep-warning conn-err" role="alert">
            <IcoWarning size={18} />
            <span style={{ flex: 1, fontSize: '.8rem', lineHeight: 1.4 }}>
              Không kết nối được với giáo viên ({joinError.code}). Bài làm vẫn được lưu cục bộ.
            </span>
          </div>
        )}

        <div className={'ep-body' + (cameraEnabled ? '' : ' no-cam')}>
          <div className="ep-main-col">
            <MathTextConfigContext.Provider value={{ disableChemFormat: Boolean(exam?.subject) && !subjectUsesMath(exam?.subject) }}>
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
                    onZoom={handleZoomImage}
                    rootRef={mainRef}
                  />
                ) : (
                  <>
                    <QuestionCard
                      q={q}
                      qi={qi}
                      num={currentQ + 1}
                      total={exam.questions.length}
                      picked={answers[qi]}
                      flagged={!!flags[qi]}
                      paused={paused}
                      eliminatedMap={eliminated[qi]}
                      highlightActive={highlightMode}
                      highlightedMap={highlights[qi]}
                      onPick={pickAnswer}
                      onFlag={toggleFlag}
                      onToggleEliminate={toggleEliminate}
                      onToggleHighlightMode={toggleHighlightMode}
                      onToggleHighlightWord={toggleHighlightWord}
                      onClearHighlights={clearHighlights}
                      onZoom={handleZoomImage}
                    />
                    <p className="ep-swipe-hint">Vuốt trái / phải để chuyển câu</p>
                  </>
                )}
              </main>
            </MathTextConfigContext.Provider>

            {mode !== 'paper' && (
              <div className="ep-nav-dock">
                <div className="ep-nav">
                  <button
                    className="ep-nav-btn"
                    disabled={currentQ === 0 || paused}
                    onClick={() => setCurrentQ((i) => i - 1)}
                    type="button"
                  >
                    <IcoChevronLeft size={16} /> Câu trước
                  </button>

                  <div className="ep-nav-center">
                    <span>Đã làm <b>{answered}/{exam.questions.length}</b></span>
                    {unansweredCount > 0 && <span>· Còn <b>{unansweredCount}</b> câu</span>}
                  </div>

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
                      Câu tiếp <IcoChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      className="ep-nav-btn primary"
                      onClick={() => setConfirmOpen(true)}
                      type="button"
                      disabled={paused || submitting}
                    >
                      <IcoSend size={14} /> {submitting ? 'Đang nộp...' : 'Hoàn thành & Nộp bài'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode === 'paper' && (
              <div className="ep-pbar">
                <button type="button" className="ep-pbar-list" onClick={() => setSidebarOpen(true)} disabled={paused}>
                  <IcoPanel size={16} /> {answered}/{exam.questions.length} câu
                </button>
                <button type="button" className="ep-pbar-submit" onClick={() => setConfirmOpen(true)} disabled={paused || submitting}>
                  <IcoSend size={14} /> {submitting ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            )}
          </div>

          {cameraEnabled && (
            <div
              className={'ep-cam-dock' + (camMinimized ? ' is-mini' : '')}
              style={mobileCamDragStyle}
            >
              <div className={'ep-cam-card ' + (camOk ? 'ok' : 'warn')}>
                <div
                  className="ep-cam-bar"
                  onPointerDown={isMobileViewport ? onCamDragStart : undefined}
                  onPointerMove={isMobileViewport ? onCamDragMove : undefined}
                  onPointerUp={isMobileViewport ? onCamDragEnd : undefined}
                  onPointerCancel={isMobileViewport ? onCamDragEnd : undefined}
                  onClick={camMinimized ? () => setCamMinimized(false) : undefined}
                  role={isMobileViewport || camMinimized ? 'button' : undefined}
                  tabIndex={isMobileViewport || camMinimized ? 0 : undefined}
                  aria-label={camMinimized ? 'Mở khung camera giám sát' : 'Thanh trạng thái camera giám sát'}
                >
                  <span className="ep-cam-drag-ico"><IcoDrag size={12} /></span>
                  <span className="ep-cam-status-dot" aria-hidden="true" />
                  <span className="ep-cam-status-txt">{proctorStatusText}</span>
                  {proctor.faces > 0 && (
                    <span className="ep-cam-face-pill">{proctor.faces} mặt</span>
                  )}
                  <button
                    className="ep-cam-toggle"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCamMinimized((v) => !v); }}
                    aria-label={camMinimized ? 'Mở rộng camera' : 'Thu gọn camera'}
                    title={camMinimized ? 'Hiện khung hình camera' : 'Thu gọn khung hình camera'}
                  >
                    {camMinimized ? <IcoChevronDown size={13} /> : <IcoChevronUp size={13} />}
                  </button>
                </div>

                {/* Luôn giữ <video> mounted và kích thước không dùng display:none để MediaPipe luôn chạy mượt */}
                <div className={'ep-cam-viewport' + (camMinimized ? ' collapsed' : '')}>
                  <video
                    ref={proctor.videoRef}
                    className="ep-cam-video"
                    muted
                    playsInline
                    autoPlay
                  />
                  <div className="ep-cam-hud" aria-hidden="true" />
                </div>
              </div>
            </div>
          )}

          <aside className={'ep-sidebar' + (sidebarOpen ? ' open' : '')}>
            <div className="ep-sidebar-head">
              <div className="ep-sidebar-head-left">
                <b>Danh sách câu hỏi</b>
                <span className="ep-sidebar-pct">{completionPct}%</span>
              </div>
              <button
                className="ep-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                type="button"
                aria-label="Đóng danh sách câu"
              >
                <IcoX size={16} />
              </button>
            </div>

            <div className="ep-sidebar-stats">
              <div className="ep-stat-tile done">
                <b>{answered}</b>
                <span><i /> Đã làm</span>
              </div>
              <div className="ep-stat-tile flagged">
                <b>{flaggedCount}</b>
                <span><i /> Đánh dấu</span>
              </div>
              <div className="ep-stat-tile todo">
                <b>{unansweredCount}</b>
                <span><i /> Chưa làm</span>
              </div>
            </div>

            <div className="ep-sidebar-filters" role="tablist" aria-label="Lọc danh sách câu hỏi">
              <button
                type="button"
                role="tab"
                aria-selected={navFilter === 'all'}
                className={'ep-filter-btn' + (navFilter === 'all' ? ' on' : '')}
                onClick={() => setNavFilter('all')}
              >
                Tất cả ({exam.questions.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={navFilter === 'todo'}
                className={'ep-filter-btn' + (navFilter === 'todo' ? ' on' : '')}
                onClick={() => setNavFilter('todo')}
              >
                Chưa làm ({unansweredCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={navFilter === 'flagged'}
                className={'ep-filter-btn' + (navFilter === 'flagged' ? ' on' : '')}
                onClick={() => setNavFilter('flagged')}
              >
                Đánh dấu ({flaggedCount})
              </button>
            </div>

            <QuestionGrid
              total={exam.questions.length}
              order={order}
              questions={exam.questions}
              answers={answers}
              flags={flags}
              currentQ={currentQ}
              paused={paused}
              filter={navFilter}
              onJump={jumpTo}
            />

            <div className="ep-sidebar-foot">
              <div className="ep-mobile-tools">
                <span className="ep-mobile-tools-label">Hiển thị</span>
                <div className="ep-tools-group" role="group" aria-label="Tùy chỉnh giao diện đọc đề">
                  <button
                    type="button"
                    className="ep-tool-btn"
                    onClick={cycleSurface}
                    title={surfaceMeta.label}
                    aria-label={surfaceMeta.label}
                  >
                    {surfaceMeta.icon}
                  </button>
                  <button
                    type="button"
                    className={'ep-tool-btn' + (fontScale === 'sm' ? ' active' : '')}
                    onClick={() => stepFont(-1)}
                    disabled={fontScale === 'sm'}
                    aria-label="Thu nhỏ cỡ chữ"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    className={'ep-tool-btn' + (fontScale === 'lg' ? ' active' : '')}
                    onClick={() => stepFont(1)}
                    disabled={fontScale === 'lg'}
                    aria-label="Phóng to cỡ chữ"
                  >
                    A+
                  </button>
                </div>
              </div>
              <div className="ep-kbd-hints">
                <span><kbd>A-D</kbd> Chọn</span>
                <span><kbd>←</kbd><kbd>→</kbd> Chuyển</span>
                <span><kbd>F</kbd> Đánh dấu</span>
              </div>
            </div>
          </aside>

          {sidebarOpen && <div className="ep-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        </div>

        {zoomImg && (
          <div
            className="ep-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Phóng to hình minh hoạ"
            onClick={() => setZoomImg(null)}
          >
            <div className="ep-lightbox-bar" onClick={(e) => e.stopPropagation()}>
              <span>{zoomImg.alt || 'Hình minh hoạ câu hỏi'}</span>
              <button type="button" className="ep-lightbox-close" onClick={() => setZoomImg(null)}>
                <IcoX size={15} /> Đóng (Esc)
              </button>
            </div>
            <img
              src={zoomImg.src}
              alt={zoomImg.alt}
              className="ep-lightbox-img"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {helpOpen && (
          <div className="ep-help-pop" role="dialog" aria-label="Phím tắt phòng thi">
            <div className="ep-help-pop-head">
              <span>Phím tắt & Mẹo làm bài</span>
              <button
                type="button"
                className="ep-tool-btn"
                onClick={() => setHelpOpen(false)}
                aria-label="Đóng"
              >
                <IcoX size={14} />
              </button>
            </div>
            <ul>
              <li><span>Chọn đáp án A–D</span><span><kbd>A</kbd>–<kbd>D</kbd></span></li>
              <li><span>Chuyển câu trước / sau</span><span><kbd>←</kbd> <kbd>→</kbd></span></li>
              <li><span>Đánh dấu xem lại</span><span><kbd>F</kbd></span></li>
              <li><span>Bật/tắt bút dạ quang</span><span><kbd>H</kbd></span></li>
              <li><span>Gạch loại trừ đáp án sai</span><span>Chuột phải / Nút S</span></li>
              <li><span>Phóng to hình đề thi</span><span>Nhấn vào hình</span></li>
            </ul>
          </div>
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
          submitting={submitting}
          onCancel={() => { if (!submitting) setConfirmOpen(false); }}
          onConfirm={() => {
            finishExam({
              violationCount: guardRef.current?.violations ?? 0,
              cameraStatus: proctor.status,
            });
          }}
        />

        {submitting && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(3, 7, 24, 0.72)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#fff', gap: '1rem',
          }}>
            <div className="page-loader-spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
            <h3 style={{ margin: 0, fontSize: '1.18rem', color: '#fff' }}>Đang nộp bài và chấm điểm trên máy chủ...</h3>
            <p style={{ margin: 0, opacity: 0.85, fontSize: '.88rem' }}>Vui lòng không tắt hoặc tải lại trang.</p>
          </div>
        )}

        <TeacherWarning warning={teacherWarning} onClose={() => setTeacherWarning(null)} />
      </div>

      {/* Chế độ luyện tập trên màn hình kết quả (trong lúc thi đã có badge trên topbar, tránh đụng nút X fullscreen) */}
      {practiceMode && stage === 'result' && (
        <div
          style={{
            position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9100, pointerEvents: 'none',
            background: 'rgba(245, 158, 11, 0.95)', color: '#3b2606',
            fontSize: '0.74rem', fontWeight: 700, lineHeight: 1.4,
            padding: '0.35rem 0.85rem', borderRadius: 999, maxWidth: '92vw', textAlign: 'center',
          }}
        >
          Chế độ luyện tập — không tính điểm, giáo viên chưa bắt đầu giờ thi.
        </div>
      )}

      {/* iPhone Safari không có Fullscreen API → nói rõ đang dùng chế độ thay thế,
          để học sinh không tưởng là không bị giám sát */}
      {guard.noFullscreenFallback && stage === 'exam' && (
        <div
          style={{
            position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
            zIndex: 100020, pointerEvents: 'none',
            background: 'rgba(10, 18, 48, 0.92)', color: '#fff',
            fontSize: '0.72rem', lineHeight: 1.4, padding: '0.35rem 0.8rem',
            borderRadius: 999, maxWidth: '92vw', textAlign: 'center',
          }}
        >
          Thiết bị này không hỗ trợ toàn màn hình — bài thi đang được giám sát bằng chế độ thay thế.
        </div>
      )}

      <ViolationOverlay
        warning={guard.warning}
        strict
        onDismiss={async () => {
          try {
            if (guard.fullscreenLock && !guard.isFullscreen) {
              await guard.enterFullscreen();
            }
          } finally {
            guard.clearWarning();
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