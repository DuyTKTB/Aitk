import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { isAdmin } from '../lib/isAdmin.js';
import { useCurrentSubject } from './SubjectSwitcher.jsx';
import {
  VIRTUAL_EXAMS,
  getAllVirtualExams,
  buildExamQuestionsForPaper,
  getFavoriteExamIds,
  toggleFavoriteExamId,
  getVirtualExamHistory,
  saveVirtualExamResult,
  getSubscriptionAndQuota,
  canAccessVirtualExam,
  consumeExamHeart,
  redeemActivationCode,
} from '../data/virtualExamsBank.js';
import PaymentPanel from './PaymentPanel.jsx';
import SubscriptionTiers from './SubscriptionTiers.jsx';
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
import DigitalOmrSheet from './exam/DigitalOmrSheet.jsx';
import ExamTrapReport from './exam/ExamTrapReport.jsx';
import ExamModeModal from './exam/ExamModeModal.jsx';
import { isAnswered, countAnswered, packAnswers, scoreExam } from '../lib/examScoring.js';
import { buildLayout } from '../lib/examLayout.js';
import '../styles/classroom.css';
import '../styles/exam-types.css';
import '../styles/exam-pro.css';
import '../styles/exam-join-v6.css';
import '../styles/exam-paper.css';
import '../styles/exam-mode-upgrade.css';

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
const SvgLock = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

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

const SvgLayers = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const SvgHeadphones = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SvgUsers = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SvgVolume = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
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

const SvgShuffle = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

const EXAM_TYPES = ['THPTQG', 'HSA', 'TSA', 'V-ACT', 'SPT', 'H-SCA'];
const TIER_FILTERS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'VIP', label: 'VIP' },
  { id: 'PRO', label: 'PRO' },
  { id: 'FREE', label: 'FREE' },
];
const SUBJECT_FILTERS = [
  { id: 'all', label: 'Tất cả KHTN' },
  { id: 'ly', label: 'Vật lí' },
  { id: 'hoa', label: 'Hóa học' },
  { id: 'sinh', label: 'Sinh học' },
];
const GRADE_FILTERS = [
  { id: 'all', label: 'Tất cả khối' },
  { id: '12', label: 'Khối 12' },
  { id: '11', label: 'Khối 11' },
  { id: '10', label: 'Khối 10' },
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

/* ============================================================
   ẢNH BÌA ĐỀ THI THỬ KHOA HỌC TỰ NHIÊN (CHUẨN BỘ ẢNH THỰC TẾ)
   - Hóa học: /img/nenthithu/hoahoc.jpg
   - Vật lí: /img/nenthithu/vatli.jpg
   - Sinh học: /img/nenthithu/sinhhoc.jpg
   - KHTN tích hợp: /img/nenthithu/khtntichhop.jpg
   ============================================================ */
const SUBJ_COVERS = {
  hoa: '/img/nenthithu/hoahoc.jpg',
  ly: '/img/nenthithu/vatli.jpg',
  sinh: '/img/nenthithu/sinhhoc.jpg',
  all: '/img/nenthithu/khtntichhop.jpg',
};

function getExamCoverUrl(exam) {
  if (exam?.coverUrl) return exam.coverUrl;
  if (exam?.coverImg) return exam.coverImg;

  const rawSubj = String(exam?.subject || '').toLowerCase().trim();
  const title = String(exam?.title || '').toLowerCase();

  // 1. Ưu tiên kiểm tra KHTN Tích hợp trước (vì đề tích hợp thường chứa tên cả 3 môn trong tiêu đề)
  if (
    rawSubj === 'all' ||
    rawSubj === 'khtn' ||
    rawSubj === 'tich-hop' ||
    rawSubj === 'tonghop' ||
    title.includes('tích hợp') ||
    title.includes('khtn') ||
    title.includes('đánh giá năng lực') ||
    title.includes('dgnl') ||
    title.includes('tsa')
  ) {
    return SUBJ_COVERS.all;
  }

  // 2. Môn Vật lí
  if (
    rawSubj === 'ly' ||
    rawSubj === 'vatly' ||
    rawSubj === 'vat-li' ||
    rawSubj === 'physics' ||
    title.includes('vật lí') ||
    title.includes('vật lý')
  ) {
    return SUBJ_COVERS.ly;
  }

  // 3. Môn Sinh học
  if (
    rawSubj === 'sinh' ||
    rawSubj === 'sinhhoc' ||
    rawSubj === 'sinh-hoc' ||
    rawSubj === 'biology' ||
    title.includes('sinh học')
  ) {
    return SUBJ_COVERS.sinh;
  }

  // 4. Môn Hóa học (hoặc mặc định)
  if (
    rawSubj === 'hoa' ||
    rawSubj === 'hoahoc' ||
    rawSubj === 'hoa-hoc' ||
    rawSubj === 'chemistry' ||
    title.includes('hóa học') ||
    title.includes('hoá học')
  ) {
    return SUBJ_COVERS.hoa;
  }
  return SUBJ_COVERS.hoa;
}

function ChemCardBanner({ exam, canAccess = true }) {
  const isVip = exam.tier === 'VIP';
  const isPro = exam.tier === 'PRO';
  const subj = exam.subject || 'hoa';
  const coverUrl = getExamCoverUrl(exam);

  return (
    <div className={`ns9-vex-banner is-${exam.tier.toLowerCase()} subj-${subj}`}>
      {/* 1. Nền ảnh bìa đề thi thử chuẩn độ nét cao theo môn */}
      <img
        src={coverUrl}
        alt={`Bìa ${exam.title || 'Đề thi thử'}`}
        className="ns9-vex-banner-cover-img"
        loading="lazy"
      />
      {/* 2. Lớp phủ vignette nhẹ nhàng để các badge hiển thị sắc nét */}
      <div className="ns9-vex-banner-overlay" />

      {/* 3. Huy hiệu Năm, Hạng (VIP/PRO/FREE), Hot & Khóa */}
      <div className="ns9-vex-banner-top">
        <div className="ns9-vex-badges-left">
          <span className="ns9-vex-year-pill">{exam.year || '2027'}</span>
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
          {!canAccess && (
            <span className="ns9-vex-lock-chip" title="Cần nâng cấp để mở khóa">
              <SvgLock size={10} /> Khóa
            </span>
          )}
        </div>
        {exam.isHot && (
          <span className="ns9-vex-hot-pill">
            <SvgFlame size={11} /> Đề hot
          </span>
        )}
      </div>
    </div>
  );
}

/* Thẻ Đề Thi chuẩn ELEC AI (100% SVG) */
function VirtualExamCard({ exam, isFav, isDone, lastScore, canAccess = true, onStart, onToggleFav, onRequireUpgrade }) {
  const isVip = exam.tier === 'VIP';

  const handleAction = () => {
    if (canAccess) {
      onStart(exam);
    } else {
      onRequireUpgrade(exam);
    }
  };

  return (
    <article className={`ns9-vex-card tier-${exam.tier.toLowerCase()} ${!canAccess ? 'is-locked' : ''}`}>
      <ChemCardBanner exam={exam} canAccess={canAccess} />

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

        <h4 className="ns9-vex-title" onClick={handleAction}>
          {exam.title}
        </h4>

        <div className="ns9-vex-stats">
          <span>{(exam.attemptsCount || 2000).toLocaleString('vi-VN')} lượt làm bài</span>
          <span>·</span>
          <span className="ns9-vex-qcount"><SvgDoc size={13} /> {exam.questionCount} câu</span>
          {Array.isArray(exam.variants) && exam.variants.length > 1 && (
            <>
              <span>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--pri, #2563eb)' }} title={`Gồm ${exam.variants.length} mã đề chuẩn hóa`}>
                <SvgLayers size={11} /> {exam.variants.length} mã đề
              </span>
            </>
          )}
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

          {!canAccess ? (
            <button
              type="button"
              className={`ns9-vex-start-btn is-${exam.tier.toLowerCase()} is-locked`}
              onClick={handleAction}
              title={`Nội dung ${exam.tier} — Bấm để mở khóa`}
            >
              <SvgLock size={12} />
              <span>Mở khóa {exam.tier}</span>
            </button>
          ) : (
            <button
              type="button"
              className={`ns9-vex-start-btn is-${exam.tier.toLowerCase()}`}
              onClick={handleAction}
            >
              {isDone ? 'Làm lại đề' : 'Làm bài ngay'}
            </button>
          )}
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
    try {
      if (open && !d.open) d.showModal();
      if (!open && d.open) d.close();
    } catch { /* ignore */ }
  }, [open]);

  const unanswered = total - answered;

  return (
    <dialog
      ref={dlgRef}
      className="ep-dialog"
      onClose={onCancel}
      onClick={(e) => {
        const rect = dlgRef.current?.getBoundingClientRect();
        if (rect && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
          onCancel();
        }
      }}
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

  const isPractice = Boolean(rawExam.practiceMode);

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
    practiceMode: isPractice,
    viewMode: rawExam.viewMode || 'single',
    proctor: {
      strictMode: !isPractice,
      fullscreenLock: !isPractice,
      blockCopyPaste: !isPractice,
      tabSwitchLimit: isPractice ? 999 : 3,
      camera: 'off',
    },
  }), [rawExam, questions, isPractice]);

  const [stage, setStage] = useState(isPractice ? 'exam' : 'confirm');
  const [mode, setMode] = useState(rawExam.viewMode === 'paper' ? 'paper' : 'single'); // 'single' | 'paper'
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [practiceRevealed, setPracticeRevealed] = useState({});

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
    active: stage === 'exam' && !isPractice,
    onAutoSubmit: handleAutoSubmit,
    config: {
      strictMode: !isPractice,
      fullscreenLock: !isPractice,
      blockCopyPaste: !isPractice,
      tabSwitchLimit: isPractice ? 999 : 3,
      camera: 'off',
    },
  });

  guardRef.current = guard;

  const mobilePush = useCallback((type, severity, meta) => {
    if (isPractice) return undefined;
    const typingNow = Date.now() < typingUntilRef.current;
    if (typingNow && /resize|viewport|orient|zoom|split|keyboard|layout|size|shrunk|shrink/i.test(String(type))) return undefined;
    return guardRef.current?.pushEvent?.(type, severity, meta);
  }, [isPractice]);

  useMobileGuard({
    active: stage === 'exam' && !isPractice,
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
    if (stage === 'exam' && timeLeft === 0 && !isPractice) {
      finishExam({ auto: true, reason: 'time', violationCount: guardRef.current?.violations ?? 0 });
    }
  }, [stage, timeLeft, finishExam, isPractice]);

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
    if (stage !== 'exam' || !guard.fullscreenLock || isPractice) {
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
  }, [stage, overlayOpen, guard.fullscreenLock, isPractice]);

  const startExam = async () => {
    if (!isPractice) {
      await guard.enterFullscreen();
    }
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
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 16px 32px' }}>
          <ExamTrapReport
            questions={exam.questions}
            answers={answers}
            detail={result.detail || []}
          />
        </div>
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
            {isPractice ? (
              <span className="ep-monitor-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <IcoSparkle size={13} /> Chế độ Luyện tập tự do
              </span>
            ) : (
              <span className="ep-monitor-chip">
                <IcoShield size={13} /> Giám sát nghiêm ngặt · Vi phạm {guard.violations}/{guard.maxViolations}
              </span>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, padding: 3, gap: 2 }}>
              <button
                type="button"
                className={'ep-monitor-chip' + (mode === 'single' ? ' is-on' : '')}
                onClick={() => setMode('single')}
                style={{ cursor: 'pointer', background: mode === 'single' ? '#3b82f6' : 'transparent', color: mode === 'single' ? '#fff' : undefined }}
                title="Xem từng câu"
              >
                Từng câu
              </button>
              <button
                type="button"
                className={'ep-monitor-chip' + (mode === 'paper' ? ' is-on' : '')}
                onClick={() => setMode('paper')}
                style={{ cursor: 'pointer', background: mode === 'paper' ? '#3b82f6' : 'transparent', color: mode === 'paper' ? '#fff' : undefined }}
                title="Xem dạng đề giấy cuộn"
              >
                <SvgDoc size={12} /> Đề giấy
              </button>
              <button
                type="button"
                className={'ep-monitor-chip' + (mode === 'omr' ? ' is-on' : '')}
                onClick={() => setMode('omr')}
                style={{ cursor: 'pointer', background: mode === 'omr' ? '#2563eb' : 'transparent', color: mode === 'omr' ? '#fff' : undefined, fontWeight: mode === 'omr' ? 700 : undefined }}
                title="Chế độ Phiếu tô OMR 1:1 chuẩn Bộ GD&ĐT"
              >
                Phiếu OMR 1:1
              </button>
            </div>
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

                {/* Chế độ Luyện tập: Nút kiểm tra đáp án & lời giải 4 tầng tức thì */}
                {isPractice && (
                  <div className="ns9-practice-check-box" style={{ margin: '14px 0' }}>
                    {!practiceRevealed[qi] ? (
                      <button
                        type="button"
                        className="ns9-practice-check-btn"
                        onClick={() => setPracticeRevealed((prev) => ({ ...prev, [qi]: true }))}
                        disabled={answers[qi] === undefined}
                        title={answers[qi] === undefined ? 'Vui lòng chọn đáp án trước khi kiểm tra' : 'Xem đáp án và lời giải'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Kiểm tra đáp án & Xem lời giải chi tiết</span>
                      </button>
                    ) : (
                      <div className="ns9-practice-sol-card">
                        <div className={`ns9-practice-sol-header ${answers[qi] === q.correct ? 'is-correct' : 'is-wrong'}`}>
                          {answers[qi] === q.correct ? (
                            <>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <b>Chính xác! Đáp án đúng là {q.correct}</b>
                            </>
                          ) : (
                            <>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                              <b>Chưa chính xác! Bạn chọn {answers[qi] || 'trống'} — Đáp án đúng là {q.correct}</b>
                            </>
                          )}
                        </div>
                        {q.explanation && (
                          <div className="ns9-practice-sol-body">
                            <span className="ns9-practice-sol-lbl">HƯỚNG DẪN GIẢI CHI TIẾT:</span>
                            <MathText text={q.explanation} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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

          {mode === 'omr' && (
            <div style={{ width: 310, flexShrink: 0, padding: '12px 16px 16px 0', height: 'calc(100vh - 120px)', position: 'sticky', top: 60, zIndex: 10 }}>
              <DigitalOmrSheet
                questions={exam.questions}
                answers={answers}
                flags={flags}
                currentQ={currentQ}
                onSelectAnswer={(idx, optIdx) => pickAnswer(idx, optIdx)}
                onToggleFlag={(idx) => toggleFlag(idx)}
                onJumpToQuestion={(idx) => setCurrentQ(idx)}
              />
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
  const pro = useTeacherPro();
  const uid = user?.uid;

  /* ── Phân quyền và Gói sử dụng ── */
  const [subQuota, setSubQuota] = useState(() => getSubscriptionAndQuota(uid));
  const [upgradeModalExam, setUpgradeModalExam] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentPkg, setPaymentPkg] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherMsg, setVoucherMsg] = useState(null);

  useEffect(() => {
    setSubQuota(getSubscriptionAndQuota(uid));
    const onQuota = (e) => {
      setSubQuota(e.detail || getSubscriptionAndQuota(uid));
    };
    window.addEventListener('elec-quota-changed', onQuota);
    return () => window.removeEventListener('elec-quota-changed', onQuota);
  }, [uid]);

  const isAdminUser = Boolean(isAdmin(user));
  const isTeacher = Boolean(pro.isPro || user?.role === 'teacher');
  const isVipUser = Boolean(subQuota?.planName === 'VIP' || pro?.plan === 'VIP' || user?.tier === 'vip');

  const userPlan = useMemo(() => {
    if (isAdminUser) return 'ADMIN';
    if (isTeacher) return 'PRO';
    if (isVipUser) return 'VIP';
    if (subQuota?.planName === 'PRO') return 'PRO';
    return 'FREE';
  }, [isAdminUser, isTeacher, isVipUser, subQuota]);

  /* ── Filters & Search ── */
  const { subject: globalSubject, setSubject: setGlobalSubject } = useCurrentSubject();
  const [selectedSubject, setSelectedSubject] = useState(globalSubject || 'all');

  useEffect(() => {
    if (globalSubject && globalSubject !== selectedSubject) {
      setSelectedSubject(globalSubject);
    }
  }, [globalSubject, selectedSubject]);

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
  const [variantPickerExam, setVariantPickerExam] = useState(null);
  const [modeModalExam, setModeModalExam] = useState(null);

  const handleStartExam = (exam, chosenVariant = null) => {
    const allowed = canAccessVirtualExam(userPlan, exam.tier);
    if (!allowed) {
      setUpgradeModalExam(exam);
      return;
    }

    // Nếu đề có nhiều mã đề và học sinh chưa chọn mã đề -> Mở modal chọn mã đề
    if (Array.isArray(exam.variants) && exam.variants.length > 1 && !chosenVariant) {
      setVariantPickerExam(exam);
      return;
    }

    if (userPlan === 'FREE') {
      const hearts = subQuota.hearts != null ? subQuota.hearts : 5;
      if (hearts <= 0) {
        alert('Bạn đã sử dụng hết 5/5 mạng luyện tập hôm nay.\nVui lòng nạp thêm ELEC AI Credit hoặc nâng cấp VIP để thi không giới hạn!');
        setUpgradeModalExam(exam);
        return;
      }
    }

    consumeExamHeart(uid);
    setVariantPickerExam(null);
    const preparedExam = chosenVariant
      ? {
          ...exam,
          selectedCode: chosenVariant,
          title: `${exam.title} - Mã đề ${chosenVariant}`,
        }
      : exam;

    // Mở Modal tùy chọn Chế độ làm bài (Thi thật vs Thi thử/Ôn luyện)
    setModeModalExam(preparedExam);
  };

  const handleConfirmStartExamMode = ({ practiceMode, viewMode }) => {
    if (!modeModalExam) return;
    setActiveExam({
      ...modeModalExam,
      practiceMode,
      viewMode,
    });
    setModeModalExam(null);
  };

  const handleOpenPayment = (tier) => {
    const custom = tier === 'VIP'
      ? { key: 'hs-12m', role: 'student', label: 'ELEC AI VIP — 12 tháng', amount: 499000 }
      : { key: 'hs-1m', role: 'student', label: 'ELEC AI Học Sinh — 1 tháng', amount: 79000 };
    setPaymentPkg(custom);
    setUpgradeModalExam(null);
    setShowPayment(true);
  };

  const handleRedeemVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    try {
      const res = await redeemActivationCode(uid, voucherCode.trim());
      if (res.ok) {
        if (res.isDiscount) {
          setVoucherMsg({ ok: true, text: res.message || 'Mã ưu đãi hợp lệ! Đang mở bảng thanh toán...' });
          setTimeout(() => {
            const custom = upgradeModalExam?.accessTier === 'VIP'
              ? { key: 'hs-12m', role: 'student', label: 'ELEC AI VIP — 12 tháng', amount: 499000, initialDiscountCode: voucherCode.trim() }
              : { key: 'hs-1m', role: 'student', label: 'ELEC AI Học Sinh — 1 tháng', amount: 79000, initialDiscountCode: voucherCode.trim() };
            setPaymentPkg(custom);
            setUpgradeModalExam(null);
            setShowPayment(true);
            setVoucherMsg(null);
            setVoucherCode('');
          }, 1200);
          return;
        }
        setVoucherMsg({ ok: true, text: `Kích hoạt thành công gói ${res.data?.planName || 'VIP'}!` });
        setSubQuota(res.data);
        setTimeout(() => {
          setUpgradeModalExam(null);
          setVoucherMsg(null);
          setVoucherCode('');
        }, 1400);
      } else {
        setVoucherMsg({ ok: false, text: res.message });
      }
    } catch (err) {
      setVoucherMsg({ ok: false, text: err?.message || 'Không thể xác thực mã.' });
    }
  };

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
      if (selectedSubject !== 'all') {
        const s = ex.subject || 'hoa';
        if (s !== selectedSubject && s !== 'all') return false;
      }
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
    selectedSubject,
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
      <div className="ns9-vex-container">
        {/* ── 1. THANH TÌM KIẾM & SẮP XẾP ── */}
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
              placeholder="Tìm kiếm đề thi KHTN (Vật lí, Hóa học, Sinh học)..."
              aria-label="Tìm kiếm đề thi Khoa học Tự nhiên"
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
              <span className="ns9-vex-flabel">PHÂN MÔN</span>
              <div className="ns9-vex-fpills">
                {SUBJECT_FILTERS.map((s) => {
                  const active = selectedSubject === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={'ns9-vex-fpill' + (active ? ' on' : '')}
                      onClick={() => {
                        setSelectedSubject(s.id);
                        setGlobalSubject(s.id);
                      }}
                    >
                      {active && <SvgCheck size={11} />}
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ns9-vex-filter-line">
              <span className="ns9-vex-flabel">KHỐI LỚP</span>
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

        {/* ── 4. BANNER CẤU TRÚC ĐỀ THI KHTN (100% SVG) ── */}
        <section className="ns9-vex-struct-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ flex: 1 }}>
            <div className="ns9-vex-struct-top">
              <div className="ns9-vex-struct-title">
                <SvgShieldCheck size={17} />
                <strong>Cấu trúc đề thi Khoa học Tự nhiên ({selectedExamType === 'THPTQG' ? 'Thi Tốt nghiệp THPT' : `Kỳ thi ${selectedExamType}`})</strong>
              </div>

              <div className="ns9-vex-struct-pills">
                <span><SvgClock size={13} /> Bấm giờ thi thật</span>
                <span><SvgSparkle size={13} /> AI chấm điểm &amp; lưu sổ lỗi sai</span>
                <span><SvgAward size={13} /> Đáp án &amp; lời giải chi tiết</span>
              </div>
            </div>
            <p className="ns9-vex-struct-desc">
              Hệ thống đề thi thử và đề thi chính thức môn Khoa học Tự nhiên tại <b>ELEC AI</b> được biên soạn bám sát cấu trúc mới nhất của Bộ GD&amp;ĐT theo định dạng <b>Chương trình GDPT mới</b>. Học sinh có thể làm bài thi trắc nghiệm trực tuyến có bấm giờ, nhận kết quả chấm điểm tức thì và được AI phân tích chi tiết từng dạng bài để tối ưu hóa điểm số.
            </p>
          </div>
          <div className="ns9-vex-banner-mascot" title="Elec Chinh Phục Phòng Thi" style={{ flexShrink: 0, width: 88, height: 88 }}>
            <img
              src="/img/elec/elec-fighting.png"
              alt="Elec Fighting"
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 18px rgba(37, 99, 235, 0.3))' }}
            />
          </div>
        </section>

        {/* ── 5. BA PHÂN KHU BỘ ĐỀ: VIP · PRO · FREE ── */}
        {vipExams.length > 0 && (
          <section className="ns9-vex-section">
            <div className="ns9-vex-sec-head">
              <h3>Bộ đề VIP môn Hóa học (Trường Chuyên, Sở GD&ĐT & Độc quyền ELEC AI)</h3>
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
                  canAccess={canAccessVirtualExam(userPlan, exam.tier)}
                  onStart={handleStartExam}
                  onRequireUpgrade={setUpgradeModalExam}
                  onToggleFav={handleToggleFav}
                />
              ))}
            </div>
          </section>
        )}

        {proExams.length > 0 && (
          <section className="ns9-vex-section">
            <div className="ns9-vex-sec-head">
              <h3>Bộ đề PRO môn Hóa học (Thi thử các Trường, Cụm trường & Trọng điểm)</h3>
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
                  canAccess={canAccessVirtualExam(userPlan, exam.tier)}
                  onStart={handleStartExam}
                  onRequireUpgrade={setUpgradeModalExam}
                  onToggleFav={handleToggleFav}
                />
              ))}
            </div>
          </section>
        )}

        {freeExams.length > 0 && (
          <section className="ns9-vex-section">
            <div className="ns9-vex-sec-head">
              <h3>Ngân hàng đề luyện {selectedExamType} môn Hóa học Miễn phí (FREE)</h3>
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
                  canAccess={canAccessVirtualExam(userPlan, exam.tier)}
                  onStart={handleStartExam}
                  onRequireUpgrade={setUpgradeModalExam}
                  onToggleFav={handleToggleFav}
                />
              ))}
            </div>
          </section>
        )}

        {filteredExams.length === 0 && (
          <div className="ns9-empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <img
              src="/img/elec/elec-shy.png"
              alt="Elec Ngại Ngùng"
              style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(37, 99, 235, 0.25))', marginBottom: 12 }}
            />
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>Không tìm thấy đề thi nào khớp với bộ lọc hiện tại.</p>
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

      {/* ── 6. MODAL NÂNG CẤP GÓI KHI BẤM ĐỀ BỊ KHÓA (CHUẨN BENTO 3 CỘT 9STUDY) ── */}
      {upgradeModalExam && (
        <SubscriptionTiers
          isModal={true}
          exam={upgradeModalExam}
          onClose={() => setUpgradeModalExam(null)}
          onUpgrade={(pack) => {
            const custom = {
              key: pack.tierId || (upgradeModalExam.tier === 'VIP' ? 'hs-12m' : 'hs-1m'),
              role: pack.role || 'student',
              label: pack.label || `ELEC AI ${pack.tierName}`,
              amount: pack.amount || (upgradeModalExam.tier === 'VIP' ? 499000 : 79000),
            };
            setPaymentPkg(custom);
            setUpgradeModalExam(null);
            setShowPayment(true);
          }}
          onRedeemVoucher={async (code) => {
            const res = await redeemActivationCode(uid, code);
            if (res.ok) {
              if (res.isDiscount) {
                const custom = {
                  key: upgradeModalExam.tier === 'VIP' ? 'hs-12m' : 'hs-1m',
                  role: 'student',
                  label: 'ELEC AI VIP — 12 tháng',
                  amount: 499000,
                  initialDiscountCode: code,
                };
                setPaymentPkg(custom);
                setUpgradeModalExam(null);
                setShowPayment(true);
                return { ok: true, text: res.message || 'Mã ưu đãi hợp lệ! Đang mở thanh toán...' };
              }
              setSubQuota(res.data);
              setTimeout(() => setUpgradeModalExam(null), 1200);
              return { ok: true, text: `Kích hoạt thành công gói ${res.data?.planName || 'VIP'}!` };
            }
            return { ok: false, text: res.message };
          }}
        />
      )}

      {/* ── MODAL CHỌN MÃ ĐỀ THI (KHI BỘ ĐỀ CÓ NHIỀU MÃ ĐỀ) ── */}
      {variantPickerExam && (
        <div
          className="ns9-upg-dialog-backdrop"
          onClick={() => setVariantPickerExam(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="ns9-upg-dialog-card" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="ns9-upg-dialog-head">
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: variantPickerExam.tier === 'VIP' ? '#7c3aed' : (variantPickerExam.tier === 'PRO' ? '#ea580c' : '#0284c7'),
                  background: variantPickerExam.tier === 'VIP' ? 'rgba(124, 58, 237, 0.1)' : (variantPickerExam.tier === 'PRO' ? 'rgba(234, 88, 12, 0.1)' : 'rgba(2, 132, 199, 0.1)'),
                  padding: '3px 10px',
                  borderRadius: 999,
                  marginBottom: 8,
                }}>
                  <SvgLayers size={13} />
                  BỘ ĐỀ GỒM {variantPickerExam.variants.length} MÃ ĐỀ
                </span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink, #0f172a)' }}>
                  Chọn mã đề bạn muốn làm thử sức
                </h3>
              </div>
              <button
                type="button"
                className="ns9-cr-close-btn"
                onClick={() => setVariantPickerExam(null)}
                aria-label="Đóng"
                style={{ position: 'relative', top: 'auto', right: 'auto' }}
              >
                <SvgClose size={16} />
              </button>
            </div>

            <div className="ns9-upg-dialog-body" style={{ padding: '16px 20px 24px' }}>
              <div className="ns9-upg-preview-box" style={{ marginBottom: 16 }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--ink, #0f172a)', display: 'block', lineHeight: 1.4 }}>
                  {variantPickerExam.title}
                </strong>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.8rem', color: 'var(--mut, #64748b)' }}>
                  <span><SvgDoc size={12} /> {variantPickerExam.questionCount} câu</span>
                  <span><SvgClock size={12} /> {variantPickerExam.durationMinutes || 50} phút</span>
                  <span>{variantPickerExam.institution || variantPickerExam.author}</span>
                </div>
              </div>

              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink, #0f172a)' }}>
                  Danh sách mã đề ({variantPickerExam.variants.length} mã):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const rnd = variantPickerExam.variants[Math.floor(Math.random() * variantPickerExam.variants.length)];
                    handleStartExam(variantPickerExam, rnd);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--pri, #2563eb)',
                    color: 'var(--pri, #2563eb)',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <SvgShuffle size={14} />
                  <span>Chọn ngẫu nhiên mã đề</span>
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                gap: 8,
                maxHeight: 260,
                overflowY: 'auto',
                padding: '4px',
              }}>
                {variantPickerExam.variants.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleStartExam(variantPickerExam, code)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: '1.5px solid var(--border, #e2e8f0)',
                      background: 'var(--card-bg, #fff)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--pri, #2563eb)';
                      e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border, #e2e8f0)';
                      e.currentTarget.style.background = 'var(--card-bg, #fff)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--mut, #64748b)', fontWeight: 600 }}>Mã đề</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ink, #0f172a)' }}>{code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. MODAL THANH TOÁN VIETQR TRỰC TIẾP ── */}
      {showPayment && (
        <div className="ns9-cr-backdrop" onClick={() => setShowPayment(false)} role="dialog" aria-modal="true">
          <div className="ns9-cr-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, padding: '24px 28px' }}>
            <button
              type="button"
              className="ns9-cr-close-btn"
              onClick={() => setShowPayment(false)}
              aria-label="Đóng"
            >
              <SvgClose size={18} />
            </button>
            <PaymentPanel
              identCode={user?.email ? 'ELECAI-' + user.email.split('@')[0] : 'VIP2027'}
              customPackage={paymentPkg}
              onPaymentSuccess={(pkg) => {
                const updated = {
                  ...subQuota,
                  planName: pkg?.role === 'teacher' ? 'PRO' : 'VIP',
                  durationLabel: 'Trọn mùa thi 2027',
                  hearts: 99,
                  maxHearts: 99,
                };
                try {
                  localStorage.setItem(`elec_sub_quota_v1_${uid || 'guest'}`, JSON.stringify(updated));
                  localStorage.setItem(`cs-user-subscription:${uid}`, JSON.stringify(updated));
                } catch {}
                setSubQuota(updated);
                setShowPayment(false);
                if (uid) {
                  import('../lib/creditService.js').then(({ grantActivationCredits }) => {
                    grantActivationCredits(uid, 1000, 'VIP_UPGRADE').catch(() => {});
                  });
                }
                alert(`Nâng cấp thành công gói ${pkg?.label || 'VIP'}! Toàn bộ đề thi VIP đã được mở khóa và bạn được tặng +1.000 điểm Credit AI.`);
              }}
              onClose={() => setShowPayment(false)}
            />
          </div>
        </div>
      )}
      {/* ── 8. MODAL CHỌN CHẾ ĐỘ LÀM BÀI (THI THẬT vs THI THỬ/ÔN LUYỆN) ── */}
      {modeModalExam && (
        <ExamModeModal
          exam={modeModalExam}
          onStart={handleConfirmStartExamMode}
          onClose={() => setModeModalExam(null)}
        />
      )}
    </div>
  );
}
