import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  VIRTUAL_EXAMS,
  getAllVirtualExams,
  buildExamQuestionsForPaper,
  getFavoriteExamIds,
  toggleFavoriteExamId,
  getVirtualExamHistory,
  saveVirtualExamResult,
} from '../data/virtualExamsBank.js';
import { saveSession } from '../lib/roadmapStore.js';
import { recordAttemptScore, getAspirationProfile, ASPIRATION_CHANGE_EVENT } from '../lib/aspirationService.js';
import { recordWrongAnswers } from '../lib/wrongQuestionService.js';
import { recordActivity } from '../lib/progress.js';
import { recordDailyStreak } from '../hooks.js';
import { recordGamificationResult } from '../hooks/useGamification.js';
import { useExamGuard } from '../hooks/useExamGuard.js';
import useMobileGuard from '../hooks/useMobileGuard.js';
import ExamResult from './ExamResult.jsx';
import ViolationOverlay from './ViolationOverlay.jsx';
import MathText from './MathText.jsx';
import ExamPaperView, { PassageBox } from './ExamPaperView.jsx';
import QuestionAnswer, { isChoiceType, QuestionImage } from './QuestionAnswer.jsx';
import { isAnswered, countAnswered, packAnswers, scoreExam } from '../lib/examScoring.js';
import { buildLayout } from '../lib/examLayout.js';
import '../styles/classroom.css';
import '../styles/exam-types.css';
import '../styles/exam-pro.css';
import '../styles/exam-join-v6.css';
import '../styles/exam-paper.css';

/* ============================================================
   VirtualExamRoom.jsx — PHÒNG THI ẢO ELEC AI (100% SVG, KHÔNG EMOJI)
   ------------------------------------------------------------
   Gồm:
     1. Thanh Focus Mode (Đồng hồ Pomodoro 25:00 tập trung sâu)
     2. Thanh Tìm kiếm + Sắp xếp + Bộ lọc 2 cột
     3. Banner Cấu trúc đề thi môn Hóa học (Chương trình GDPT mới)
     4. 3 Phân khu đề thi: VIP · PRO · FREE
     5. Modal Phòng Thi Ảo Bấm Giờ Thật (căn giữa màn hình)
   ============================================================ */

/* ── Bộ Icon SVG sắc nét ── */
const SvgClock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SvgPlay = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const SvgPause = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const SvgExpand = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const SvgClose = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgCheck = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgDiamond = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 12L2 9Z" />
    <path d="M11 3 8 9l4 12 4-12-3-6" />
    <path d="M2 9h20" />
  </svg>
);

const SvgCrown = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const SvgGift = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const SvgFlame = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
  </svg>
);

const SvgDoc = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const SvgGradCap = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const SvgBuilding = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="22" x2="21" y2="22" />
    <line x1="6" y1="18" x2="6" y2="11" />
    <line x1="10" y1="18" x2="10" y2="11" />
    <line x1="14" y1="18" x2="14" y2="11" />
    <line x1="18" y1="18" x2="18" y2="11" />
    <polygon points="12 2 20 7 4 7" />
  </svg>
);

const SvgBookmark = ({ size = 15, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

const SvgDotsVertical = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const SvgShieldCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2f6bff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const SvgSparkle = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

const SvgAward = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const EXAM_TYPES = ['THPTQG', 'HSA', 'TSA', 'V-ACT', 'SPT', 'H-SCA'];
const TIER_FILTERS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'VIP', label: 'VIP' },
  { id: 'PRO', label: 'PRO' },
  { id: 'FREE', label: 'FREE' },
];
const GRADE_FILTERS = [
  { id: 'all', label: 'Hóa học (Tất cả)' },
  { id: '12', label: 'Hóa 12' },
  { id: '11', label: 'Hóa 11' },
  { id: '10', label: 'Hóa 10' },
];
const STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'todo', label: 'Chưa làm' },
  { id: 'done', label: 'Đã làm' },
  { id: 'fav', label: 'Đề yêu thích' },
];
const SOURCE_FILTERS = [
  { id: 'all', label: 'Tất cả nguồn' },
  { id: 'official', label: 'Đề chính thức' },
  { id: 'schools', label: 'Đề thi thử các Trường' },
  { id: 'exclusive', label: 'Đề độc quyền ELEC AI' },
];

const LETTERS = ['A', 'B', 'C', 'D'];

/* Hình minh họa Banner Hóa học (Bình tam giác, ống nghiệm, ô nguyên tố Carbon) */
function ChemCardBanner({ exam }) {
  const isVip = exam.tier === 'VIP';
  const isPro = exam.tier === 'PRO';

  return (
    <div className={`ns9-vex-banner is-${exam.tier.toLowerCase()}`}>
      <div className="ns9-vex-banner-top">
        <div className="ns9-vex-badges-left">
          <span className="ns9-vex-year-pill">{exam.year}</span>
          {isVip && (
            <span className="ns9-vex-tier-pill is-vip">
              <SvgDiamond size={11} /> VIP
            </span>
          )}
          {isPro && (
            <span className="ns9-vex-tier-pill is-pro">
              <SvgCrown size={11} /> PRO
            </span>
          )}
          {!isVip && !isPro && (
            <span className="ns9-vex-tier-pill is-free">
              <SvgGift size={11} /> FREE
            </span>
          )}
        </div>
        {exam.isHot && (
          <span className="ns9-vex-hot-pill">
            <SvgFlame size={11} /> Đề hot
          </span>
        )}
      </div>

      <div className="ns9-vex-banner-art">
        <div className="ns9-vex-banner-text">
          <span className="ns9-vex-subj-chip">HOÁ HỌC</span>
          <strong className="ns9-vex-exam-sub">
            {isVip ? 'KỲ THI THPT QUỐC GIA' : `Kỳ thi ${exam.examType}`}
          </strong>
          {isVip && (
            <small className="ns9-vex-team-line">
              Đội ngũ PGS.TS và Thầy/Cô THPT Chuyên
            </small>
          )}
        </div>

        <svg
          className="ns9-vex-chem-svg"
          viewBox="0 0 140 96"
          fill="none"
          aria-hidden="true"
        >
          <g transform="translate(8, 6) rotate(-10)">
            <rect x="0" y="0" width="34" height="38" rx="5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" fill="rgba(255,255,255,0.08)" />
            <text x="5" y="10" fill="rgba(255,255,255,0.8)" fontSize="6.5" fontWeight="700">6</text>
            <text x="11" y="24" fill="#ffffff" fontSize="14" fontWeight="800">C</text>
            <text x="5" y="33" fill="rgba(255,255,255,0.75)" fontSize="5.5">12.011</text>
          </g>
          <g stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
            <line x1="88" y1="16" x2="106" y2="24" />
            <line x1="106" y1="24" x2="122" y2="14" />
            <circle cx="88" cy="16" r="4.5" fill="rgba(255,255,255,0.85)" />
            <circle cx="106" cy="24" r="6" fill="rgba(167,243,208,0.9)" />
            <circle cx="122" cy="14" r="4" fill="rgba(255,255,255,0.85)" />
          </g>
          <g stroke="rgba(255,255,255,0.82)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M58 38v12a16 16 0 1 0 12 0V38" fill="rgba(255,255,255,0.1)" />
            <line x1="55" y1="38" x2="73" y2="38" />
            <path d="M50 68c4-3 12 3 18 0" stroke="rgba(167,243,208,0.8)" strokeWidth="1.4" />
            <path d="M96 40v12l-13 28a4 4 0 0 0 3.6 5.7h30.8a4 4 0 0 0 3.6-5.7L108 52V40" fill="rgba(255,255,255,0.12)" />
            <line x1="93" y1="40" x2="111" y2="40" />
            <path d="M87 74h29" stroke="rgba(167,243,208,0.75)" strokeWidth="1.4" />
          </g>
        </svg>
      </div>
    </div>
  );
}

/* Thẻ Đề Thi chuẩn 9Study (100% SVG) */
function VirtualExamCard({ exam, isFav, isDone, lastScore, onStart, onToggleFav }) {
  const isVip = exam.tier === 'VIP';

  return (
    <article className={`ns9-vex-card tier-${exam.tier.toLowerCase()}`}>
      <ChemCardBanner exam={exam} />

      <div className="ns9-vex-body">
        <div className="ns9-vex-subrow">
          <span className="ns9-vex-exam-code">{exam.examType}</span>
          <span className={`ns9-vex-badge-tag is-${exam.tier.toLowerCase()}`}>
            {isVip && <SvgSparkle size={11} />}
            <span>{exam.badgeLabel}</span>
          </span>
          {isDone && (
            <span className="ns9-vex-done-pill" title="Bạn đã hoàn thành đề này">
              <SvgCheck size={11} /> Đã làm {lastScore != null ? `(${lastScore}đ)` : ''}
            </span>
          )}
        </div>

        <h4 className="ns9-vex-title" onClick={() => onStart(exam)}>
          {exam.title}
        </h4>

        <div className="ns9-vex-stats">
          <span>{(exam.attemptsCount || 2000).toLocaleString('vi-VN')} lượt làm bài</span>
          <span>·</span>
          <span className="ns9-vex-qcount"><SvgDoc size={13} /> {exam.questionCount} câu</span>
        </div>

        <div className="ns9-vex-meta-lines">
          {exam.author && (
            <div className={`ns9-vex-author is-${exam.tier.toLowerCase()}`}>
              {isVip ? <SvgGradCap size={13} /> : <SvgCrown size={13} />}
              <span>{exam.author}</span>
            </div>
          )}
          {exam.institution && (
            <div className="ns9-vex-inst">
              <SvgBuilding size={13} />
              <span>{exam.institution}</span>
            </div>
          )}
        </div>

        <div className="ns9-vex-foot">
          <button
            type="button"
            className={'ns9-vex-more-btn' + (isFav ? ' is-fav' : '')}
            onClick={() => onToggleFav(exam.id)}
            aria-label={isFav ? 'Bỏ lưu đề yêu thích' : 'Lưu vào đề yêu thích'}
            title={isFav ? 'Đã lưu trong Đề yêu thích (Bấm để bỏ lưu)' : 'Lưu vào Đề yêu thích'}
          >
            {isFav ? <SvgBookmark size={15} filled /> : <SvgDotsVertical size={15} />}
          </button>

          <button
            type="button"
            className={`ns9-vex-start-btn is-${exam.tier.toLowerCase()}`}
            onClick={() => onStart(exam)}
          >
            {isDone ? 'Làm lại đề' : 'Làm bài ngay'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   PHÒNG THI CHUẨN EXAMJOIN (GIỐNG HỆT PHÒNG THI ĐÃ TẠO)
   • KHÔNG DÙNG CAMERA (camera: 'off')
   • MỨC ĐỘ NGHIÊM NGẶT CAO (strictMode: true, fullscreenLock: true,
     blockCopyPaste: true, tabSwitchLimit: 3, ViolationOverlay đỏ)
   ============================================================ */

const IcoWarning = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoSend = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
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
              {picked === i && <span className="ep-opt-check"><SvgCheck size={16} /></span>}
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
              <SvgCheck size={14} /> Nộp bài
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

function VirtualStrictExamSession({ exam: rawExam, uid, onClose, onCompleted }) {
  /* Khi vào phòng thi: ẩn hoàn toàn thanh Nav trên/dưới, linh vật, nút chat nổi & footer */
  useEffect(() => {
    document.body.dataset.virtualExamActive = '1';
    window.dispatchEvent(new CustomEvent('elec-virtual-exam-mode', { detail: { active: true } }));
    window.scrollTo(0, 0);
    return () => {
      delete document.body.dataset.virtualExamActive;
      window.dispatchEvent(new CustomEvent('elec-virtual-exam-mode', { detail: { active: false } }));
    };
  }, []);

  const questions = useMemo(() => {
    const list = buildExamQuestionsForPaper(rawExam);
    const ptsPerQ = Number((10 / Math.max(1, list.length)).toFixed(4));
    return list.map((q) => ({
      ...q,
      points: ptsPerQ,
      explanation: q.explain || q.explanation || '',
    }));
  }, [rawExam]);

  const exam = useMemo(() => ({
    id: rawExam.id,
    title: rawExam.title,
    duration: rawExam.durationMinutes || 50,
    totalPoints: 10,
    questions,
    showAnswerAfter: true,
    shuffle: false,
    proctor: {
      strictMode: true,
      fullscreenLock: true,
      blockCopyPaste: true,
      tabSwitchLimit: 3,
      camera: 'off',
    },
  }), [rawExam, questions]);

  const [stage, setStage] = useState('confirm');
  const [mode, setMode] = useState('single'); // 'single' | 'paper'
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typing, setTyping] = useState(false);

  const startTimeRef = useRef(null);
  const submittedRef = useRef(false);
  const answersRef = useRef({});
  const guardRef = useRef(null);
  const typingUntilRef = useRef(0);
  const mainRef = useRef(null);
  const swipeRef = useRef(null);

  useEffect(() => { answersRef.current = answers; }, [answers]);

  const layout = useMemo(() => buildLayout(exam, uid), [exam, uid]);
  const order = layout.order;

  const finishExam = useCallback((opts = {}) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    guardRef.current?.stop?.();
    guardRef.current?.exitFullscreen?.();

    const arr = packAnswers(exam.questions, answersRef.current);
    const g = scoreExam(exam.questions, arr);
    const detail = g.detail || [];
    const correctCount = g.correctCount ?? detail.filter((d) => d.isCorrect).length;
    const score10 = Number(((correctCount / Math.max(1, exam.questions.length)) * 10).toFixed(2));
    const timeSpent = Math.max(1, Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000));

    /* Lưu thống kê vào Lộ trình theo chuyên đề */
    const topicBuckets = {};
    exam.questions.forEach((q, i) => {
      const isOk = answersRef.current[i] === q.correct;
      const tid = q.topicId || 'c12-ester';
      if (!topicBuckets[tid]) topicBuckets[tid] = [];
      topicBuckets[tid].push({ questionId: q.id, correct: isOk });
    });

    Object.entries(topicBuckets).forEach(([topicId, ansList]) => {
      const okInTopic = ansList.filter((a) => a.correct).length;
      saveSession(uid, {
        topicId,
        total: ansList.length,
        correct: okInTopic,
        source: `virtual-exam:${exam.id}`,
        answers: ansList,
      });
    });

    /* Lưu điểm vào Nguyện vọng & Lịch sử Phòng thi ảo */
    const asp = getAspirationProfile(uid);
    const scaleFactor = asp.selectedExamId === 'THPTQG' ? 3 : 1;
    recordAttemptScore(uid, Number((score10 * scaleFactor).toFixed(1)));

    /* Lưu câu sai vào Sổ tay lỗi dùng chung (WrongNotebook) */
    try {
      const wrongItems = exam.questions.map((q, i) => {
        const d = detail[i];
        return {
          question: q,
          userPicked: arr[i],
          isCorrect: d ? d.isCorrect : false,
          examTitle: exam.title,
          examId: exam.id,
          source: `virtual-exam:${exam.id}`,
          topicId: q.topicId || q.topic_id,
        };
      }).filter((it) => !it.isCorrect);
      recordWrongAnswers(uid, wrongItems);
    } catch (e) {
      console.warn('[VirtualExamRoom] recordWrongAnswers error:', e);
    }

    /* Ghi nhận hoạt động vào Trang chủ & Chuỗi ngày học (Streak) & Gamification XP */
    try {
      recordActivity({ type: 'exam', title: exam.title, hash: 'quiz', count: 1 });
      recordDailyStreak();
      recordGamificationResult(uid, {
        correctCount,
        wrongCount: Math.max(0, exam.questions.length - correctCount),
      });
    } catch { /* ignore */ }

    const saved = saveVirtualExamResult(uid, {
      examId: exam.id,
      examTitle: exam.title,
      tier: rawExam.tier,
      examType: rawExam.examType,
      total: exam.questions.length,
      correct: correctCount,
      score10,
      durationUsedSec: timeSpent,
    });

    setResult({
      score: score10,
      totalPoints: 10,
      correct: correctCount,
      total: exam.questions.length,
      detail,
      answers: arr,
      timeSpent,
      autoSubmitted: !!opts.auto,
      autoReason: opts.auto ? (opts.reason || 'violation') : '',
    });
    setStage('result');
    onCompleted?.(saved);
  }, [exam, rawExam, uid, onCompleted]);

  const handleAutoSubmit = useCallback((count) => {
    finishExam({ auto: true, reason: 'violation', violationCount: count ?? guardRef.current?.violations ?? 0 });
  }, [finishExam]);

  /* Kích hoạt bộ giám sát nghiêm ngặt cao (KHÔNG CAMERA) giống hệt ExamJoin */
  const guard = useExamGuard({
    active: stage === 'exam',
    onAutoSubmit: handleAutoSubmit,
    config: {
      strictMode: true,
      fullscreenLock: true,
      blockCopyPaste: true,
      tabSwitchLimit: 3,
      camera: 'off',
    },
  });

  guardRef.current = guard;

  const mobilePush = useCallback((type, severity, meta) => {
    const typingNow = Date.now() < typingUntilRef.current;
    if (typingNow && /resize|viewport|orient|zoom|split|keyboard|layout|size|shrunk|shrink/i.test(String(type))) return undefined;
    return guardRef.current?.pushEvent?.(type, severity, meta);
  }, []);

  useMobileGuard({
    active: stage === 'exam',
    pushEvent: mobilePush,
    trackHidden: true,
  });

  /* Đồng hồ đếm ngược chống gian lận chỉnh giờ máy */
  useEffect(() => {
    if (stage !== 'exam') return undefined;
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
  }, [stage]);

  useEffect(() => {
    if (stage === 'exam' && timeLeft === 0) {
      finishExam({ auto: true, reason: 'time', violationCount: guardRef.current?.violations ?? 0 });
    }
  }, [stage, timeLeft, finishExam]);

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
      typingUntilRef.current = Date.now() + 1500;
      setTyping(false);
    };
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, [stage]);

  const overlayOpen = guard.warning?.type === 'violation'
    || guard.warning?.type === 'violation-strict'
    || guard.warning?.type === 'auto-submit';

  const [showFsBanner, setShowFsBanner] = useState(false);

  useEffect(() => {
    if (stage !== 'exam' || !guard.fullscreenLock) {
      setShowFsBanner(false);
      return undefined;
    }
    const check = () => {
      const fs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      setShowFsBanner(!fs && !overlayOpen);
    };
    check();
    const evs = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'];
    evs.forEach((n) => document.addEventListener(n, check));
    const id = setInterval(check, 3000);
    return () => {
      evs.forEach((n) => document.removeEventListener(n, check));
      clearInterval(id);
    };
  }, [stage, overlayOpen, guard.fullscreenLock]);

  const startExam = async () => {
    await guard.enterFullscreen();
    startTimeRef.current = Date.now();
    submittedRef.current = false;
    setTimeLeft(exam.duration * 60);
    setStage('exam');
    guard.reset();
  };

  const handleExitRoom = () => {
    guardRef.current?.stop?.();
    guardRef.current?.exitFullscreen?.();
    onClose?.();
  };

  const pickAnswer = useCallback((qIdx, optIdx) => {
    setAnswers((a) => (a[qIdx] === optIdx ? a : { ...a, [qIdx]: optIdx }));
  }, []);

  const toggleFlag = useCallback((qIdx) => {
    setFlags((f) => ({ ...f, [qIdx]: !f[qIdx] }));
  }, []);

  const totalQ = exam.questions.length;

  const jumpTo = useCallback((i) => {
    setSidebarOpen(false);
    if (mode === 'paper') {
      document.getElementById(`pq-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setCurrentQ(i);
  }, [mode]);

  const onTouchStart = useCallback((e) => {
    if (mode === 'paper' || e.touches.length !== 1) { swipeRef.current = null; return; }
    if (e.target.closest?.('.katex-display, .ep-scrollx, input, textarea, .ep-tf, .ep-sa')) { swipeRef.current = null; return; }
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, [mode]);

  const onTouchEnd = useCallback((e) => {
    if (mode === 'paper') return;
    const st = swipeRef.current;
    swipeRef.current = null;
    if (!st) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - st.x;
    const dy = t.clientY - st.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - st.t > 700) return;
    setCurrentQ((c) => (dx < 0 ? Math.min(c + 1, totalQ - 1) : Math.max(c - 1, 0)));
  }, [totalQ, mode]);

  useEffect(() => {
    if (mode === 'paper') return;
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [currentQ, mode]);

  /* ── MÀN 1: XÁC NHẬN TRƯỚC KHI VÀO THI (GIỐNG HỆT EXAMJOIN, KHÔNG CÓ CAMERA) ── */
  if (stage === 'confirm') {
    return (
      <div className="ej-confirm">
        <div className="ej-confirm-card">
          <div className="ej-warn-ico"><IcoShield size={56} /></div>
          <h1>Bạn sắp vào chế độ thi</h1>
          <p className="ej-confirm-sub">{exam.title}</p>

          <p className="ej-session-note">
            <IcoShield size={14} /> Phòng thi ảo nghiêm ngặt cao · Không sử dụng Camera · Giám sát chống gian lận toàn màn hình
          </p>

          <ul className="ej-rules">
            <li><b>Thời gian:</b> {exam.duration} phút</li>
            <li><b>Số câu:</b> {exam.questions.length}</li>
            <li><b>Tổng điểm:</b> {exam.totalPoints}</li>
            <li>Không thoát màn hình thi (Khóa toàn màn hình Fullscreen)</li>
            <li>Chuyển tab, rời cửa sổ hoặc thoát toàn màn hình bị tính vi phạm</li>
            <li><b>Chế độ nghiêm ngặt cao (Không bật Camera):</b> vi phạm 1 lần đã cảnh báo đỏ, chặn sao chép / dán / chuột phải / DevTools</li>
            <li>Vi phạm {guard.maxViolations} lần sẽ tự động nộp bài</li>
          </ul>

          <div className="ej-confirm-actions">
            <button className="td-btn" onClick={handleExitRoom} type="button">Hủy</button>
            <button className="td-btn primary big" onClick={startExam} type="button">
              <IcoFullscreen /> Bắt đầu thi
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MÀN 3: KẾT QUẢ BÀI THI (DÙNG EXAMRESULT GIỐNG HỆT EXAMJOIN) ── */
  if (stage === 'result' && result) {
    const REASONS = {
      time: 'Hết giờ làm bài.',
      violation: `Đạt ngưỡng vi phạm tối đa (${guardRef.current?.violations ?? '?'}/${guardRef.current?.maxViolations ?? 3}).`,
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
          order={order}
          showAnswer={true}
          onExit={handleExitRoom}
        />
      </>
    );
  }

  /* ── MÀN 2: PHÒNG THI CHÍNH (.ep-exam GIỐNG HỆT EXAMJOIN) ── */
  const qi = order[currentQ] ?? currentQ;
  const q = exam.questions[qi];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answered = countAnswered(exam.questions, answers);
  const flaggedCount = Object.values(flags).filter(Boolean).length;
  const progress = exam.questions.length > 0 ? (answered / exam.questions.length) * 100 : 0;

  const timerClass =
    timeLeft < 60 ? ' critical'
      : timeLeft < 300 ? ' urgent'
        : '';

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
              onClick={() => guard.enterFullscreen()}
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
                <span className="ep-mviol"> · Vi phạm {guard.violations}/{guard.maxViolations}</span>
              </span>
            </div>
          </div>

          <div className="ep-header-center">
            <div className="ep-progress-mini" aria-hidden="true">
              <div className="ep-progress-mini-bar" style={{ width: `${progress}%` }} />
            </div>
            <span className="ep-monitor-chip">
              <IcoShield size={13} /> Giám sát nghiêm ngặt · Vi phạm {guard.violations}/{guard.maxViolations}
            </span>
            <button
              type="button"
              className="ep-monitor-chip"
              onClick={() => setMode((m) => (m === 'single' ? 'paper' : 'single'))}
              style={{ cursor: 'pointer' }}
              title="Đổi chế độ hiển thị Từng câu / Đề giấy"
            >
              <SvgDoc size={13} /> {mode === 'single' ? 'Xem dạng Đề giấy' : 'Xem Từng câu'}
            </button>
          </div>

          <div className="ep-header-right">
            <div className={'ep-timer' + timerClass} role="timer" aria-live="polite">
              <SvgClock size={16} />
              <b>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</b>
            </div>
            <button className="ep-submit-btn" onClick={() => setConfirmOpen(true)} type="button">
              <IcoSend size={14} /> Nộp bài
            </button>
            <button
              className="ep-header-btn"
              onClick={handleExitRoom}
              type="button"
              title="Thoát phòng thi"
              aria-label="Thoát phòng thi"
            >
              <SvgClose size={16} />
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

        <div className="ep-mprog" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>

        <div className="ep-body">
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
                paused={false}
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
                  paused={false}
                  onPick={pickAnswer}
                  onFlag={toggleFlag}
                />

                <div className="ep-nav">
                  <button
                    className="ep-nav-btn"
                    disabled={currentQ === 0}
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
                    >
                      Câu tiếp
                    </button>
                  ) : (
                    <button
                      className="ep-nav-btn primary"
                      onClick={() => setConfirmOpen(true)}
                      type="button"
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
              <button type="button" className="ep-pbar-list" onClick={() => setSidebarOpen(true)}>
                <IcoPanel size={16} /> {answered}/{exam.questions.length} câu
              </button>
              <button type="button" className="ep-pbar-submit" onClick={() => setConfirmOpen(true)}>
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
                <SvgClose size={16} />
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
              paused={false}
              onJump={jumpTo}
            />
          </aside>

          {sidebarOpen && <div className="ep-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        </div>

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
            });
          }}
        />
      </div>

      <ViolationOverlay
        warning={guard.warning}
        strict
        onDismiss={() => {
          guard.clearWarning();
          if (guard.fullscreenLock && !guard.isFullscreen) {
            guard.enterFullscreen();
          }
        }}
      />
    </>
  );
}

export default function VirtualExamRoom({ onSwitchToLegacyQuiz }) {
  const { user } = useAuth();
  const uid = user?.uid;

  /* ── Focus Mode (Pomodoro bar) ── */
  const [showFocusBar, setShowFocusBar] = useState(true);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);

  useEffect(() => {
    if (!focusRunning) return undefined;
    const timer = setInterval(() => {
      setFocusSeconds((s) => {
        if (s <= 1) {
          setFocusRunning(false);
          return 25 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [focusRunning]);

  const fmtFocus = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  /* ── Filters & Search ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [selectedExamType, setSelectedExamType] = useState(() => {
    const asp = getAspirationProfile(uid);
    return asp?.selectedExamId || 'THPTQG';
  });
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  /* ── Favorites & History ── */
  const [favIds, setFavIds] = useState(() => getFavoriteExamIds(uid));
  const [historyList, setHistoryList] = useState(() => getVirtualExamHistory(uid));
  const [activeExam, setActiveExam] = useState(null);

  useEffect(() => {
    setFavIds(getFavoriteExamIds(uid));
    setHistoryList(getVirtualExamHistory(uid));
  }, [uid]);

  useEffect(() => {
    const onAspChange = () => {
      const asp = getAspirationProfile(uid);
      if (asp?.selectedExamId) setSelectedExamType(asp.selectedExamId);
    };
    window.addEventListener(ASPIRATION_CHANGE_EVENT, onAspChange);
    return () => window.removeEventListener(ASPIRATION_CHANGE_EVENT, onAspChange);
  }, [uid]);

  const [allVirtualExams, setAllVirtualExams] = useState(() => getAllVirtualExams());

  useEffect(() => {
    const onExamsChanged = () => setAllVirtualExams(getAllVirtualExams());
    window.addEventListener('elec-virtual-exams-changed', onExamsChanged);
    return () => window.removeEventListener('elec-virtual-exams-changed', onExamsChanged);
  }, []);

  const doneMap = useMemo(() => {
    const m = new Map();
    historyList.forEach((h) => {
      if (!m.has(h.examId)) m.set(h.examId, h.score10);
    });
    return m;
  }, [historyList]);

  const handleToggleFav = (examId) => {
    const next = toggleFavoriteExamId(uid, examId);
    setFavIds(next);
  };

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allVirtualExams.filter((ex) => {
      if (selectedExamType && ex.examType !== selectedExamType && selectedExamType !== 'ALL') {
        if (ex.examType !== selectedExamType) return false;
      }
      if (selectedTier !== 'ALL' && ex.tier !== selectedTier) return false;
      if (selectedGrade !== 'all' && ex.gradeScope !== 'all' && ex.gradeScope !== selectedGrade) return false;
      if (selectedSource !== 'all' && ex.sourceType !== selectedSource) return false;
      if (selectedYear !== 'all' && String(ex.year) !== String(selectedYear)) return false;

      const isDone = doneMap.has(ex.id);
      const isFav = favIds.includes(ex.id);
      if (selectedStatus === 'todo' && isDone) return false;
      if (selectedStatus === 'done' && !isDone) return false;
      if (selectedStatus === 'fav' && !isFav) return false;

      if (q) {
        const hay = `${ex.title} ${ex.author} ${ex.institution} ${ex.examType} ${ex.tier}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'popular') {
      return [...list].sort((a, b) => (b.attemptsCount || 0) - (a.attemptsCount || 0));
    }
    if (sortBy === 'newest') {
      return [...list].sort((a, b) => b.year - a.year);
    }
    return list;
  }, [
    searchQuery,
    sortBy,
    selectedExamType,
    selectedTier,
    selectedGrade,
    selectedStatus,
    selectedSource,
    selectedYear,
    doneMap,
    favIds,
    allVirtualExams,
  ]);

  const vipExams = useMemo(() => filteredExams.filter((e) => e.tier === 'VIP'), [filteredExams]);
  const proExams = useMemo(() => filteredExams.filter((e) => e.tier === 'PRO'), [filteredExams]);
  const freeExams = useMemo(() => filteredExams.filter((e) => e.tier === 'FREE'), [filteredExams]);

  if (activeExam) {
    return (
      <div
        className="ns9-strict-exam-wrapper"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999998,
          background: 'var(--bg, #0f172a)',
          overflowY: 'auto',
          width: '100vw',
          height: '100vh',
        }}
      >
        <VirtualStrictExamSession
          exam={activeExam}
          uid={uid}
          onClose={() => {
            setActiveExam(null);
            delete document.body.dataset.virtualExamActive;
            window.dispatchEvent(new CustomEvent('elec-virtual-exam-mode', { detail: { active: false } }));
          }}
          onCompleted={() => {
            setHistoryList(getVirtualExamHistory(uid));
          }}
        />
      </div>
    );
  }

  return (
    <div className="ns9-vex-page">
      {/* ── 1. THANH FOCUS MODE (POMODORO BAR, 100% SVG) ── */}
      {showFocusBar && (
        <div className="ns9-focus-bar" role="region" aria-label="Chế độ tập trung Focus Mode">
          <div className="ns9-focus-inner">
            <div className="ns9-focus-left">
              <span className="ns9-focus-icon" aria-hidden="true">
                <SvgClock size={13} />
              </span>
              <strong>Focus Mode</strong>
              <span className="ns9-focus-hint">
                Bấm nút Play để bắt đầu tính giờ tập trung
              </span>
            </div>

            <div className="ns9-focus-right">
              <button
                type="button"
                className="ns9-focus-clock-pill"
                onClick={() => {
                  if (!focusRunning) {
                    setFocusSeconds((prev) => (prev === 25 * 60 ? 50 * 60 : 25 * 60));
                  }
                }}
                title="Bấm để đổi 25 phút / 50 phút"
              >
                <span>Tập trung</span>
                <b>{fmtFocus(focusSeconds)}</b>
              </button>

              <button
                type="button"
                className={'ns9-focus-play-btn' + (focusRunning ? ' is-running' : '')}
                onClick={() => setFocusRunning((r) => !r)}
              >
                {focusRunning ? <><SvgPause size={11} /> <span>Tạm dừng</span></> : <><SvgPlay size={11} /> <span>Bắt đầu</span></>}
              </button>

              <button
                type="button"
                className="ns9-focus-ico-btn"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen?.().catch(() => {});
                  } else {
                    document.exitFullscreen?.().catch(() => {});
                  }
                }}
                title="Toàn màn hình tập trung"
                aria-label="Toàn màn hình"
              >
                <SvgExpand size={14} />
              </button>

              <button
                type="button"
                className="ns9-focus-ico-btn"
                onClick={() => setShowFocusBar(false)}
                title="Ẩn thanh Focus Mode"
                aria-label="Đóng thanh Focus Mode"
              >
                <SvgClose size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ns9-vex-container">
        {/* ── 2. THANH TÌM KIẾM & SẮP XẾP ── */}
        <div className="ns9-vex-search-row">
          <div className="ns9-vex-search-box">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm đề thi Hóa học..."
              aria-label="Tìm đề thi Hóa học"
            />
          </div>

          <div className="ns9-vex-sort-wrap">
            <label htmlFor="ns9-vex-sort">Sắp xếp:</label>
            <select
              id="ns9-vex-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="priority">Ưu tiên</option>
              <option value="popular">Nhiều lượt làm nhất</option>
              <option value="newest">Mới nhất (2027)</option>
            </select>
          </div>
        </div>

        {/* ── 3. BẢNG BỘ LỌC 2 CỘT CHUẨN ── */}
        <section className="ns9-vex-filter-grid" aria-label="Bộ lọc đề thi">
          <div className="ns9-vex-filter-col">
            <div className="ns9-vex-filter-line">
              <span className="ns9-vex-flabel">KỲ THI</span>
              <div className="ns9-vex-fpills">
                {EXAM_TYPES.map((exId) => {
                  const active = selectedExamType === exId;
                  return (
                    <button
                      key={exId}
                      type="button"
                      className={'ns9-vex-fpill' + (active ? ' on' : '')}
                      onClick={() => setSelectedExamType(exId)}
                    >
                      {active && <SvgCheck size={11} />}
                      <span>{exId}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ns9-vex-filter-line">
              <span className="ns9-vex-flabel">HẠNG ĐỀ</span>
              <div className="ns9-vex-fpills">
                {TIER_FILTERS.map((t) => {
                  const active = selectedTier === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={'ns9-vex-fpill' + (active ? ' on' : '')}
                      onClick={() => setSelectedTier(t.id)}
                    >
                      {active && <SvgCheck size={11} />}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ns9-vex-filter-line">
              <span className="ns9-vex-flabel">MÔN THI</span>
              <div className="ns9-vex-fpills">
                {GRADE_FILTERS.map((g) => {
                  const active = selectedGrade === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={'ns9-vex-fpill' + (active ? ' on' : '')}
                      onClick={() => setSelectedGrade(g.id)}
                    >
                      {active && <SvgCheck size={11} />}
                      <span>{g.label}</span>
                    </button>
                  );
                })}
                {onSwitchToLegacyQuiz && (
                  <button
                    type="button"
                    className="ns9-vex-fpill is-special"
                    onClick={onSwitchToLegacyQuiz}
                    title="Chuyển sang chế độ Phản xạ Bảng tuần hoàn & AI Tạo đề"
                  >
                    <SvgSparkle size={12} />
                    <span>Phản xạ Nguyên tố &amp; AI Tạo đề</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="ns9-vex-filter-col is-right">
            <div className="ns9-vex-filter-line">
              <span className="ns9-vex-flabel">TRẠNG THÁI</span>
              <div className="ns9-vex-fpills">
                {STATUS_FILTERS.map((st) => {
                  const active = selectedStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      className={'ns9-vex-fpill' + (active ? ' on' : '')}
                      onClick={() => setSelectedStatus(st.id)}
                    >
                      {active && <SvgCheck size={11} />}
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ns9-vex-filter-line">
              <span className="ns9-vex-flabel">NGUỒN ĐỀ</span>
              <div className="ns9-vex-fpills">
                {SOURCE_FILTERS.map((src) => {
                  const active = selectedSource === src.id;
                  return (
                    <button
                      key={src.id}
                      type="button"
                      className={'ns9-vex-fpill' + (active ? ' on' : '')}
                      onClick={() => setSelectedSource(src.id)}
                    >
                      {active && <SvgCheck size={11} />}
                      <span>{src.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ns9-vex-filter-line">
              <span className="ns9-vex-flabel">NĂM</span>
              <div className="ns9-vex-fpills">
                <select
                  className="ns9-vex-year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  aria-label="Chọn năm đề thi"
                >
                  <option value="all">Tất cả</option>
                  <option value="2027">2027</option>
                  <option value="2026">2026</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. BANNER CẤU TRÚC ĐỀ THI MÔN HÓA HỌC (100% SVG) ── */}
        <section className="ns9-vex-struct-banner">
          <div className="ns9-vex-struct-top">
            <div className="ns9-vex-struct-title">
              <SvgShieldCheck size={17} />
              <strong>Cấu trúc đề thi môn Hóa học ({selectedExamType === 'THPTQG' ? 'Thi Tốt nghiệp THPT' : `Kỳ thi ${selectedExamType}`})</strong>
            </div>

            <div className="ns9-vex-struct-pills">
              <span><SvgClock size={13} /> Bấm giờ thi thật</span>
              <span><SvgSparkle size={13} /> AI chấm điểm &amp; lưu sổ lỗi sai</span>
              <span><SvgAward size={13} /> Đáp án &amp; lời giải chi tiết</span>
            </div>
          </div>
          <p className="ns9-vex-struct-desc">
            Hệ thống đề thi thử và đề thi chính thức môn Hóa học tại <b>ELEC AI</b> được biên soạn bám sát cấu trúc mới nhất của Bộ GD&amp;ĐT theo định dạng <b>Chương trình GDPT mới</b>. Học sinh có thể làm bài thi trắc nghiệm trực tuyến có bấm giờ, nhận kết quả chấm điểm tức thì và được AI phân tích chi tiết từng dạng bài để tối ưu hóa điểm số.
          </p>
        </section>

        {/* ── 5. BA PHÂN KHU BỘ ĐỀ: VIP · PRO · FREE ── */}
        {vipExams.length > 0 && (
          <section className="ns9-vex-section">
            <div className="ns9-vex-sec-head">
              <h3>Bộ đề VIP môn Hóa học độc quyền ELEC AI – 2027</h3>
              <span>{vipExams.length} đề thi</span>
            </div>
            <div className="ns9-vex-cards-grid">
              {vipExams.map((exam) => (
                <VirtualExamCard
                  key={exam.id}
                  exam={exam}
                  isFav={favIds.includes(exam.id)}
                  isDone={doneMap.has(exam.id)}
                  lastScore={doneMap.get(exam.id)}
                  onStart={setActiveExam}
                  onToggleFav={handleToggleFav}
                />
              ))}
            </div>
          </section>
        )}

        {proExams.length > 0 && (
          <section className="ns9-vex-section">
            <div className="ns9-vex-sec-head">
              <h3>Bộ đề PRO môn Hóa học độc quyền ELEC AI – 2027</h3>
              <span>{proExams.length} đề thi</span>
            </div>
            <div className="ns9-vex-cards-grid">
              {proExams.map((exam) => (
                <VirtualExamCard
                  key={exam.id}
                  exam={exam}
                  isFav={favIds.includes(exam.id)}
                  isDone={doneMap.has(exam.id)}
                  lastScore={doneMap.get(exam.id)}
                  onStart={setActiveExam}
                  onToggleFav={handleToggleFav}
                />
              ))}
            </div>
          </section>
        )}

        {freeExams.length > 0 && (
          <section className="ns9-vex-section">
            <div className="ns9-vex-sec-head">
              <h3>Ngân hàng đề luyện {selectedExamType} môn Hóa học miễn phí – 2026</h3>
              <span>{freeExams.length} đề thi</span>
            </div>
            <div className="ns9-vex-cards-grid">
              {freeExams.map((exam) => (
                <VirtualExamCard
                  key={exam.id}
                  exam={exam}
                  isFav={favIds.includes(exam.id)}
                  isDone={doneMap.has(exam.id)}
                  lastScore={doneMap.get(exam.id)}
                  onStart={setActiveExam}
                  onToggleFav={handleToggleFav}
                />
              ))}
            </div>
          </section>
        )}

        {filteredExams.length === 0 && (
          <div className="ns9-empty-state">
            <p>Không tìm thấy đề thi nào khớp với bộ lọc hiện tại.</p>
            <button
              type="button"
              className="ns9-ch-btn-primary"
              onClick={() => {
                setSearchQuery('');
                setSelectedExamType('THPTQG');
                setSelectedTier('ALL');
                setSelectedGrade('all');
                setSelectedStatus('all');
                setSelectedSource('all');
                setSelectedYear('all');
              }}
            >
              Đặt lại bộ lọc mặc định
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
