/* ============================================================
   TeacherDashboard.jsx — Quản lý lớp học (Vitality) v7
   ------------------------------------------------------------
   v7 (fix + tối ưu):
     • FIX #1: Nút "Xem trước & In A4" chuẩn hóa dữ liệu exam
       trước khi truyền vào ExamPreviewSimulator.
     • FIX: classInsights không tính lại mỗi giây khi có live session.
     • FIX: Bọc Suspense trong ErrorBoundary.
     • MỚI: Skeleton loading.
     • MỚI: Memo cho các component nặng.
   ============================================================ */
import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense, memo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { isAdmin as checkAdmin } from '../lib/isAdmin.js';
import { buildClassInsights } from '../lib/classInsights.js';
import { listMyLinkedClasses } from '../lib/classTeachers.js';
import { addQuestionsBatch } from '../lib/questionBank.js';
import { notifyClassOwner } from '../lib/notices.js';
import {
  groupNotices, unreadCount, noticeSummary,
} from '../lib/noticesCore.js';
import {
  subscribeNotices as watchNotices, markNoticeRead, markAllNoticesRead, deleteNotice,
} from '../lib/notices.js';
import {
  getClassesByTeacher,
  getExamsByTeacher,
  getExamsByClass,
  getSubmissionsByExam,
  listenSubmissions,
  listenSubmissionsByClass,
  listenExamsByTeacher,
  listenClassesByTeacher,
  createClass,
  createExam,
  updateExam,
  removeClassMember,
  deleteExam as deleteExamFs,
  updateClass,
  setExamVisibility,
  setExamLock,
  regenerateClassKey,
  deleteClass,
  classJoinUrl,
  approveMember,
  rejectMember,
  approveAllMembers,
  setClassApproval,
  getClassById,
  approveRetry,
  denyRetry,
  setStudentRetryAllowance,
  listenRetryRequestsByClasses,
  listenRetryRequestsByTeacher,
  getClassAllowances,
  findClassByKey,
} from '../lib/classroom.js';
import {
  createExamSession,
  endExamSession,
  deleteExamSession,
  listenSession,
  listenSessionsByTeacher,
  getSessionsByTeacher,
  timeRemaining,
} from '../lib/examSession.js';
import ExamCreate from './ExamCreate.jsx';
import ClassDetailModal from './ClassDetailModal.jsx';
import LinkedClassesPanel from './teacher/LinkedClassesPanel.jsx';
import {
  BentoCard,
  StatBig,
  SchedulePill,
  RatingDots,
  AvatarStack,
  SidePanel,
  PillTabs,
  Chip,
} from './teacher/ui/index.js';
import ExamEditModal from './teacher/ExamEditModal.jsx';
import ClassAnalytics from './teacher/ClassAnalytics.jsx';
import LinkClassPanel from './teacher/LinkClassPanel.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

const LiveProctorView = lazy(() => import('./LiveProctorView.jsx'));
const CreateExamPage = lazy(() => import('./teacher/CreateExamPage.jsx'));
const QuestionBank = lazy(() => import('./teacher/QuestionBank.jsx'));
const PaperGrading = lazy(() => import('./teacher/PaperGrading.jsx'));
const TeacherSimulatorHub = lazy(() => import('./teacher/TeacherSimulatorHub.jsx'));
const ExamPreviewSimulator = lazy(() => import('./teacher/ExamPreviewSimulator.jsx'));
const InsightPanel = lazy(() => import('./teacher/InsightPanel.jsx'));
const TeacherProfileSection = lazy(() => import('./teacher/TeacherProfileSection.jsx'));
const ExamImporter = lazy(() => import('./teacher/ExamImporter.jsx'));
const WordDocxEditor = lazy(() => import('./teacher/WordDocxEditor.jsx'));
import TeacherFloatingChat from './teacher/TeacherFloatingChat.jsx';

/* ============ SVG ICONS (NO EMOJI) ============ */
const Svg = ({ size = 18, sw = 2, children }) => (
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
  >
    {children}
  </svg>
);

const IcoScan = (p) => (
  <Svg {...p}>
    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </Svg>
);

const IcoShuffle = (p) => (
  <Svg {...p}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </Svg>
);

const IcoFileDoc = (p) => (
  <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </Svg>
);

const IcoEye = (p) => (
  <Svg {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

const IcoSparkles = (p) => (
  <Svg {...p} sw={1.8}>
    <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
  </Svg>
);

const IcoPin = (p) => (
  <Svg {...p} sw={1.8}>
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-2l-2-2V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8l-2 2z" />
  </Svg>
);

const IcoBolt = (p) => (
  <Svg {...p} sw={2}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Svg>
);

const IcoSubject = (p) => (
  <Svg {...p} sw={1.8}>
    <path d="M4 4h16v16H4z" />
    <path d="M4 9h16M9 4v16" />
  </Svg>
);

const IcoUser = (p) => (
  <Svg {...p} sw={1.8}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

const IcoCalendar = (p) => (
  <Svg {...p} sw={1.8}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const IcoFolder = (p) => (
  <Svg {...p} sw={1.8}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </Svg>
);

const IcoSend = (p) => (
  <Svg {...p} sw={1.8}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Svg>
);

const IcoGlobe = (p) => (
  <Svg {...p} sw={1.8}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

const IcoLock = (p) => (
  <Svg {...p} sw={1.8}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

import {
  DashFrame, Topbar, Modal, ConfirmDialog, Donut, TrendChart, Avatar,
  tsMs, fmtMMSS, fmtClock, downloadCsv,
} from './DashShell.jsx';
import {
  IcoPlay, IcoStop, IcoRefresh, IcoUsers, IcoBook, IcoChart, IcoClock,
  IcoCheckCircle, IcoCopy, IcoTrash, IcoVideo, IcoDot, IcoGrid,
  IcoDownload, IcoChevronRight, IcoAlert, IcoKey, IcoMonitor,
   IcoBell, IcoLibrary,
} from '../lib/sessionIcons.jsx';
/* 🎨 CSS bây giờ lazy-loaded trong useEffect. */

/* ============================================================
   HELPERS
   ============================================================ */
const pctOf = (s) => {
  if (!s) return 0;
  if (typeof s.percentage === 'number' && !Number.isNaN(s.percentage)) return s.percentage;
  if (s.totalPoints > 0 && typeof s.score === 'number' && !Number.isNaN(s.score)) {
    return (s.score / s.totalPoints) * 100;
  }
  if (s.totalQuestions > 0 && typeof s.correctCount === 'number' && !Number.isNaN(s.correctCount)) {
    return (s.correctCount / s.totalQuestions) * 100;
  }
  const n = Number(s.score);
  return Number.isNaN(n) ? 0 : n;
};
const avgOf = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

function examStatus(ex, liveSession, now) {
  if (liveSession) return { key: 'live', label: 'Đang thi' };
  if (ex.isDraft || ex.status === 'draft' || ex.kind === 'draft') return { key: 'draft', label: 'Nháp' };
  if (ex.opensAt && now < new Date(ex.opensAt).getTime()) return { key: 'soon', label: 'Chưa mở' };
  if (ex.closesAt && now > new Date(ex.closesAt).getTime()) return { key: 'closed', label: 'Đã kết thúc' };
  return { key: 'ready', label: 'Đã giao' };
}

/**
 * FIX #1: Chuẩn hóa cấu trúc exam trước khi truyền vào ExamPreviewSimulator.
 */
function normalizeExamForPreview(exam) {
  if (!exam) return null;
  const questions = (exam.questions || []).map((q) => ({
    ...q,
    q: q.q ?? q.content ?? '',
    options: q.options ?? q.answers?.map((o) => (typeof o === 'string' ? o : o.content || '')) ?? [],
    correct: typeof q.correct === 'number' ? q.correct : -1,
    explain: q.explain ?? q.explanation ?? '',
    points: q.points ?? 1,
    level: q.level || '',
    topic: q.topic || '',
    type: q.type || 'single_choice',
  }));
  return {
    ...exam,
    title: exam.title || 'Đề kiểm tra',
    duration: exam.duration || 45,
    subject: exam.subject || 'Hóa học',
    grade: exam.grade || exam.classGrade || '12',
    questions,
  };
}

function exportExamCsv(exam, subs) {
  const sorted = [...subs].sort((a, b) => b.score - a.score);
  const rows = [['Hạng', 'Họ tên', 'Điểm', 'Tổng điểm', '%', 'Câu đúng', 'Tổng câu', 'Thời gian (phút)', 'Số vi phạm', 'Tự động nộp']];
  sorted.forEach((s, i) => {
    rows.push([
      i + 1, s.studentName, s.score, s.totalPoints, Math.round(pctOf(s)),
      s.correctCount, s.totalQuestions, Math.round((s.timeSpent || 0) / 60),
      s.violationCount || 0, s.autoSubmitted ? 'Có' : 'Không',
    ]);
  });
  const safe = (exam.title || 'de-thi').replace(/[^\p{L}\p{N}]+/gu, '-');
  downloadCsv(`diem-${safe}.csv`, rows);
}

function detectExamSubject(exam) {
  if (exam.subject) return exam.subject;
  const q = exam.questions?.[0];
  if (q?.subject) return q.subject;
  return '—';
}

function isAiGeneratedExam(exam) {
  if (exam.source === 'ai' || exam.aiGenerated) return true;
  const firstQ = exam.questions?.[0];
  return Boolean(firstQ?.topic && firstQ?.level && firstQ?.qualityScore !== undefined);
}

/* ============================================================
   MEMOIZED COMPONENTS
   ============================================================ */
const MemoAvatar = memo(Avatar);
const MemoBentoCard = memo(BentoCard);
const MemoStatBig = memo(StatBig);

/* ============================================================
   SKELETON LOADERS
   ============================================================ */
function DashboardSkeleton() {
  return (
    <div className="vt" style={{ padding: '2rem' }}>
      <div className="t-skeleton" style={{ height: 60, marginBottom: 20, borderRadius: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="t-skeleton" style={{ height: 140, borderRadius: 20 }} />
        <div className="t-skeleton" style={{ height: 140, borderRadius: 20 }} />
        <div className="t-skeleton" style={{ height: 140, borderRadius: 20 }} />
        <div className="t-skeleton" style={{ height: 140, borderRadius: 20 }} />
      </div>
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="t-skeleton" style={{ height: 320, borderRadius: 24 }} />
  );
}

/* ============================================================
   FLOE-STYLE SAAS VISUAL COMPONENTS (CARDS, STACKS, COVERS)
   ============================================================ */
function FloeAvatarStack({ count = 35, names = [] }) {
  const displayNames = names.length > 0 ? names.slice(0, 3) : ['A', 'B', 'C'];
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
  return (
    <div className="t-avatar-stack" title={`${count} học sinh`}>
      {displayNames.map((n, i) => (
        <span
          key={i}
          className="t-avatar-circle"
          style={{ background: colors[i % colors.length] }}
        >
          {String(n || 'H').charAt(0).toUpperCase()}
        </span>
      ))}
      {count > 3 && (
        <span className="t-avatar-circle more">
          +{count - 3}
        </span>
      )}
    </div>
  );
}

function getSubjectGradClass(subject) {
  const s = String(subject || '').toLowerCase();
  if (s.includes('hóa') || s.includes('chem')) return 'grad-chem';
  if (s.includes('lý') || s.includes('vật lí') || s.includes('phys')) return 'grad-phys';
  if (s.includes('sinh') || s.includes('bio')) return 'grad-bio';
  if (s.includes('toán') || s.includes('math')) return 'grad-math';
  if (s.includes('khtn') || s.includes('khoa học')) return 'grad-khtn';
  return 'grad-default';
}

function FloeWorkflowCard({
  exam,
  liveSession,
  cls,
  submissions = [],
  onStart,
  onViewLive,
  onDetail,
  starting = false,
}) {
  const pcts = submissions.map(pctOf);
  const avg = submissions.length ? Math.round(avgOf(pcts)) : null;
  const memberCount = cls?.members?.length || 40;
  const subCount = submissions.length;
  const subPct = memberCount > 0 ? Math.min(100, Math.round((subCount / memberCount) * 100)) : 0;
  const liveCount = liveSession
    ? Math.max(0, (liveSession.stats?.joined || 0) - (liveSession.stats?.submitted || 0))
    : 0;

  const subject = exam.subject || cls?.subject || 'Hóa học';
  const gradClass = getSubjectGradClass(subject);

  return (
    <article className="t-workflow-card" onClick={() => onDetail(exam)}>
      <div className={`t-workflow-cover ${gradClass}`}>
        <div className={`t-workflow-status-notch ${liveSession ? 'live' : ''}`}>
          {liveSession ? (
            <>
              <span className="pulse-dot" />
              <span>● Đang thi ({liveCount} HS)</span>
            </>
          ) : exam.isDraft ? (
            <span>Nháp</span>
          ) : (
            <span>Đã giao</span>
          )}
        </div>

        <button
          type="button"
          className="t-workflow-cover-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDetail(exam);
          }}
          title="Xem chi tiết & thao tác"
        >
          ···
        </button>
      </div>

      <div className="t-workflow-body">
        <div className="t-workflow-meta">
          <span>{exam.duration || 45} phút</span>
          <span>•</span>
          <span>{(exam.questions || []).length || 40} câu</span>
          <span>•</span>
          <span style={{ fontWeight: 600, color: 'var(--t-accent)' }}>
            Lớp {cls?.name || 'Chung'}
          </span>
        </div>

        <h3 className="t-workflow-title" title={exam.title}>
          {exam.title}
        </h3>

        <div className="t-workflow-progress">
          <div className="t-workflow-progress-info">
            <span>{subCount > 0 ? `${subCount}/${memberCount} đã nộp` : 'Chưa có bài nộp'}</span>
            <span>{avg != null ? `Điểm TB: ${avg}%` : `${subPct}%`}</span>
          </div>
          <div className="t-workflow-progress-track">
            <div className="t-workflow-progress-bar" style={{ width: `${Math.max(6, subPct)}%` }} />
          </div>
        </div>

        <div className="t-workflow-footer" onClick={(e) => e.stopPropagation()}>
          <FloeAvatarStack count={memberCount} names={cls?.members?.map((m) => m.name || m.studentName || '')} />

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {liveSession ? (
              <button
                type="button"
                className="vt-btn sm primary"
                style={{ background: '#059669', borderColor: '#059669', fontSize: '0.74rem', padding: '0.3rem 0.75rem' }}
                onClick={() => onViewLive(liveSession.id)}
              >
                Giám sát LIVE ({liveCount})
              </button>
            ) : (
              <button
                type="button"
                className="vt-btn sm primary"
                style={{ fontSize: '0.74rem', padding: '0.3rem 0.75rem' }}
                onClick={() => onStart(exam)}
                disabled={starting}
              >
                {starting ? 'Đang mở...' : 'Bắt đầu thi'}
              </button>
            )}
            <button
              type="button"
              className="vt-btn sm"
              style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}
              onClick={() => onDetail(exam)}
            >
              Chi tiết
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function TeacherDashboard({ onExit } = {}) {
  const { user } = useAuth();



  const [section, setSection] = useState(() => {
    try {
      const searchCode = new URLSearchParams(window.location.search || '').get('shareCode');
      if (searchCode) return 'profile';
      const hash = window.location.hash || '';
      const qIdx = hash.indexOf('?');
      if (qIdx !== -1 && new URLSearchParams(hash.slice(qIdx + 1)).get('shareCode')) {
        return 'profile';
      }
    } catch {
      /* ignore URL parse errors */
    }
    return 'overview';
  });
  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('30');
  const [chartMode, setChartMode] = useState('line');
  const [subjectFilter, setSubjectFilter] = useState('');
  /* ❗ MỚI: xem đề dạng NHÓM THEO LỚP (thư mục gập/mở) hay danh sách phẳng */
  const [examGroupMode, setExamGroupMode] = useState('class');
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const toggleGroup = (key) => setOpenGroups((prev) => {
    const n = new Set(prev);
    if (n.has(key)) n.delete(key); else n.add(key);
    return n;
  });

  const [classes, setClasses] = useState([]);
  /* Lớp đã liên kết (giáo viên bộ môn) — để thẻ đề hiện đúng tên lớp, môn, chủ nhiệm */
  const [linkedClasses, setLinkedClasses] = useState([]);

  /* Chuông thông báo (notices: liên kết mới / gỡ liên kết / đề mới) */
  /* Đề đang lưu chế độ công khai (chặn bấm nhiều lần) */
  const [savingVis, setSavingVis] = useState('');
  /* Đề đang lưu chế độ khoá bài */
  const [savingLock, setSavingLock] = useState('');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [importerModalOpen, setImporterModalOpen] = useState(false);
  const [wordEditorOpen, setWordEditorOpen] = useState(false);
  const [wordEditorExam, setWordEditorExam] = useState(null);

  const [bellOpen, setBellOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [noticesErr, setNoticesErr] = useState('');
  const [detailTab, setDetailTab] = useState('overview');
  const [exams, setExams] = useState([]);
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [now, setNow] = useState(Date.now());

  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('Hóa học');
  const [newClassGrade, setNewClassGrade] = useState('12');
  const [aiPreset, setAiPreset] = useState(null);
  const [copyExamTarget, setCopyExamTarget] = useState(null);
  const [copyTargetClassId, setCopyTargetClassId] = useState('');
  const [copyExamBusy, setCopyExamBusy] = useState(false);
  const [syncingBank, setSyncingBank] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [shareClass, setShareClass] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [noticeClass, setNoticeClass] = useState(null);
  const [noticeDraft, setNoticeDraft] = useState('');
  const [noticeSaving, setNoticeSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState(null);

  /* Giáo viên bộ môn: giao đề vào lớp của chủ nhiệm khác bằng mã lớp */
  const [extOpen, setExtOpen] = useState(false);
  const [extKey, setExtKey] = useState('');
  const [extBusy, setExtBusy] = useState(false);
  const [extErr, setExtErr] = useState('');
  const [extClass, setExtClass] = useState(null);
  /* true = đang tạo đề cho lớp đã liên kết (dùng đúng trang 3 tab như mục "AI Tạo đề") */
  const [extCreate, setExtCreate] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamCreate, setShowExamCreate] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState(null);
  const [previewExam, setPreviewExam] = useState(null);
  const [detailExamModal, setDetailExamModal] = useState(null);

  const [confirmState, setConfirmState] = useState(null);
  const [toast, setToast] = useState(null);
  const [toastTone, setToastTone] = useState('info');
  const [toastUndo, setToastUndo] = useState(null);
  const [startingId, setStartingId] = useState(null);
  const [simulatorInitialExam, setSimulatorInitialExam] = useState(null);

  /* Trạng thái nâng cấp Mục C & D4: Lọc, Sắp xếp, Chế độ Lưới/Danh sách, Đặt lịch, Duyệt hàng loạt */
  const [classSectionTab, setClassSectionTab] = useState('my'); // 'my' | 'linked'
  const [classViewMode, setClassViewMode] = useState('grid'); // 'grid' | 'list'
  const [classSort, setClassSort] = useState('name'); // 'name' | 'members' | 'exams'
  const [classFilter, setClassFilter] = useState('all'); // 'all' | 'pending' | 'hasExams'

  /* Bảng Tìm Kiếm & Lệnh Nhanh Toàn Cục (Ctrl+K Command Palette) */
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);

  const [examSort, setExamSort] = useState('newest'); // 'newest' | 'title' | 'subs'
  const [scheduleExamModal, setScheduleExamModal] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ opensAt: '', closesAt: '' });
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const [sessionViewMode, setSessionViewMode] = useState('grid'); // 'grid' | 'list'
  const [sessionSort, setSessionSort] = useState('newest'); // 'newest' | 'active'

  const [retryStatusFilter, setRetryStatusFilter] = useState('pending'); // 'pending' | 'resolved' | 'all'
  const [retryClassFilter, setRetryClassFilter] = useState('all');
  const [selectedRetryIds, setSelectedRetryIds] = useState(() => new Set());
  const [bulkRetryBusy, setBulkRetryBusy] = useState(false);
  const [bulkRetryNote, setBulkRetryNote] = useState('');

  const [allRetryRequests, setRetryRequests] = useState([]);
  /* Yêu cầu theo NGƯỜI TẠO ĐỀ (bắt cả đề không gắn lớp — trước đây bị mất) */
  const [teacherRetryRequests, setTeacherRetryRequests] = useState([]);
  const retryRequests = useMemo(() => {
    const byId = new Map();
    for (const r of [...allRetryRequests, ...teacherRetryRequests]) byId.set(r.id, r);
    return [...byId.values()].filter(
      (r) => r.teacherId === user?.uid || classes.some((c) => c.id === r.classId)
    );
  }, [allRetryRequests, teacherRetryRequests, classes, user?.uid]);

  /* ❗ MỚI: sửa đề đã tạo (thông tin + câu hỏi + camera/chống gian lận) */
  const [editingExam, setEditingExam] = useState(null);

  const [allowances, setAllowances] = useState({});
  const [retryNotes, setRetryNotes] = useState({});
  const [retryActioning, setRetryActioning] = useState(null);

  const toastTimer = useRef(null);
  const say = useCallback((text, tone = 'info', opts = {}) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    setToastTone(tone);
    const hasUndo = typeof opts?.onUndo === 'function';
    setToastUndo(hasUndo ? { label: opts.undoLabel || 'Hoàn tác', onUndo: opts.onUndo } : null);
    toastTimer.current = setTimeout(() => {
      setToast(null);
      setToastUndo(null);
    }, hasUndo ? 6000 : 3000);
  }, []);

  /* Phím tắt toàn cục Khu vực Giáo viên: Ctrl+K mở Bảng lệnh nhanh, "/" tìm kiếm, "N" tạo mới, "Esc" đóng cửa sổ */
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
        setCmdQuery('');
        setCmdIndex(0);
        return;
      }
      const tag = (e.target?.tagName || '').toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
      if (e.key === 'Escape') {
        if (aiChatOpen) { setAiChatOpen(false); return; }
        if (cmdOpen) { setCmdOpen(false); return; }
        if (confirmState) { setConfirmState(null); return; }
        if (copyExamTarget) { setCopyExamTarget(null); return; }
        if (scheduleExamModal) { setScheduleExamModal(null); return; }
        if (showCreateClass) { setShowCreateClass(false); return; }
        if (showClassPicker) { setShowClassPicker(false); return; }
        if (shareClass) { setShareClass(null); return; }
        if (noticeClass) { setNoticeClass(null); return; }
        if (bellOpen) { setBellOpen(false); return; }
        if (extOpen) { setExtOpen(false); return; }
        if (selectedExam) { setSelectedExam(null); return; }
        if (editingExam) { setEditingExam(null); return; }
        if (previewExam) { setPreviewExam(null); return; }
        if (selectedClass) { setSelectedClass(null); return; }
        return;
      }
      if (isInput || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') {
        const searchEl = document.querySelector('.vt-search-input, .vt-search input, .ta-search-input, .qb-search input, .st-search');
        if (searchEl) {
          e.preventDefault();
          searchEl.focus();
        } else {
          e.preventDefault();
          setCmdOpen(true);
          setCmdQuery('');
          setCmdIndex(0);
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (section === 'classes') setShowCreateClass(true);
        else goSection('create');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    cmdOpen, confirmState, scheduleExamModal, showCreateClass, showClassPicker,
    shareClass, noticeClass, bellOpen, extOpen, selectedExam,
    editingExam, previewExam, selectedClass, section,
  ]);

  const showAdminLink = checkAdmin(user);

  /* Live timer — chỉ chạy khi có session live */
  const hasLiveSessions = useMemo(
    () => sessions.some((s) => s.status === 'live'),
    [sessions]
  );
  useEffect(() => {
    if (!hasLiveSessions) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasLiveSessions]);

  /* Thông báo: chỉ nghe đúng hộp thư của mình; lỗi quyền không làm hỏng dashboard */
  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = watchNotices(
      user.uid,
      (list) => { setNotices(list); setNoticesErr(''); },
      (err) => {
        setNotices([]);
        setNoticesErr(err?.code === 'permission-denied'
          ? 'Chưa có quyền đọc thông báo — cần deploy firestore.rules (mục notices).'
          : 'Không tải được thông báo.');
      },
    );
    return () => unsub?.();
  }, [user?.uid]);

  const unreadNotices = useMemo(() => unreadCount(notices), [notices]);
  const noticeGroups = useMemo(() => groupNotices(notices), [notices]);

  const openNotice = async (n) => {
    setBellOpen(false);
    if (!n.read) { try { await markNoticeRead(n.id); } catch { /* bỏ qua */ } }
    const cls = classById[n.classId];
    if (!cls) {
      say('Lớp này không còn trong danh sách của bạn (có thể đã bị xoá hoặc bạn đã gỡ liên kết).', 'error');
      return;
    }
    setDetailTab(n.tab || 'teachers');
    setSelectedClass(cls);
  };

  const goSection = (key) => {
    setSection(key);
    setSubTab('all');
    setSearch('');
    /* Rời trang tạo đề → bỏ khoá lớp của luồng "giao đề lớp khác",
       tránh lần sau vào "AI Tạo đề" vẫn bị ghim vào lớp cũ. */
    if (key !== 'create') {
      setExtCreate(false);
      setExtClass(null);
    }
  };

  /* Tìm lớp theo mã để giao đề (dùng cho giáo viên bộ môn không phải chủ nhiệm) */
  const findExternalClass = async () => {
    const key = extKey.trim().toUpperCase();
    if (!key) { setExtErr('Nhập mã lớp trước đã.'); return; }
    setExtBusy(true);
    setExtErr('');
    try {
      const found = await findClassByKey(key);
      if (!found) {
        setExtErr('Không tìm thấy lớp nào với mã này. Nhờ chủ nhiệm gửi lại mã lớp.');
        return;
      }
      setExtClass(found);
      setExtOpen(false);
      setExtKey('');
    } catch (e) {
      setExtErr(e?.message || 'Không tìm được lớp.');
    } finally {
      setExtBusy(false);
    }
  };

  /* ---------- LOAD ---------- */
  const subsCacheRef = useRef({});

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    setLoadError('');
    try {
      const [cls, ex, sess] = await Promise.all([
        getClassesByTeacher(user.uid),
        getExamsByTeacher(user.uid),
        getSessionsByTeacher(user.uid),
      ]);

      /* Lấy thêm các đề do GV bộ môn (GVBM) giao vào các lớp chủ nhiệm của tôi */
      let combinedExams = [...ex];
      try {
        const classExamArrays = await Promise.all(
          cls.map((c) => getExamsByClass(c.id).catch(() => []))
        );
        const seenIds = new Set(combinedExams.map((e) => e.id));
        classExamArrays.flat().forEach((ce) => {
          if (ce && ce.id && !seenIds.has(ce.id)) {
            seenIds.add(ce.id);
            combinedExams.push(ce);
          }
        });
      } catch (e) {
        console.warn('[TeacherDashboard] Không tải được đề của lớp chủ nhiệm:', e);
      }

      setClasses((prev) => {
        const map = new Map(cls.map((c) => [c.id, c]));
        prev.forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
        return Array.from(map.values());
      });
      setExams((prev) => {
        const map = new Map(combinedExams.map((e) => [e.id, e]));
        prev.forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
        const res = Array.from(map.values());
        res.sort((a, b) => (tsMs(b.createdAt) || 0) - (tsMs(a.createdAt) || 0));
        return res;
      });
      setSessions((prev) => {
        const map = new Map(sess.map((s) => [s.id, s]));
        prev.forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
        const res = Array.from(map.values());
        res.sort((a, b) => (b.startedAtMs || 0) - (a.startedAtMs || 0));
        return res;
      });
      setLoading(false); // Dashboard hiển thị ngay lập tức, không để giáo viên chờ lâu

      /* Lớp đã liên kết bằng key (GVBM) — đề giao cho lớp đó cần tên lớp/môn/chủ nhiệm
         để hiển thị đúng thay vì "Lớp —". Lỗi quyền (chưa deploy rules) không được
         làm hỏng phần còn lại của dashboard. */
      try {
        const links = await listMyLinkedClasses(user.uid);
        const docs = await Promise.all(links.map(async (l) => {
          try {
            const c = await getClassById(l.classId);
            return c ? { ...c, _linked: true, _mySubject: l.subject || '' } : null;
          } catch {
            return null;
          }
        }));
        setLinkedClasses(docs.filter(Boolean));
      } catch {
        setLinkedClasses([]);
      }

      const priorityExams = combinedExams.slice(0, 8);
      const subsMap = { ...submissionsMap };
      await Promise.all(priorityExams.map(async (e) => {
        try {
          const s = await getSubmissionsByExam(e.id);
          subsMap[e.id] = s;
        } catch {
          if (!subsMap[e.id]) subsMap[e.id] = [];
        }
      }));
      setSubmissionsMap({ ...subsMap });

      if (combinedExams.length > 8) {
        const remaining = combinedExams.slice(8);
        Promise.all(remaining.map(async (e) => {
          try {
            const s = await getSubmissionsByExam(e.id);
            return { id: e.id, subs: s };
          } catch {
            return { id: e.id, subs: subsMap[e.id] || [] };
          }
        })).then((results) => {
          setSubmissionsMap((prev) => {
            const next = { ...prev };
            results.forEach((r) => { next[r.id] = r.subs; });
            return next;
          });
        });
      }
    } catch (err) {
      console.error('[TeacherDashboard] load error:', err);
      setLoadError(err.message || 'Không tải được dữ liệu lớp học.');
      say('Không tải được dữ liệu. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, say]);

  useEffect(() => { refresh(); }, [refresh]);

  /* Realtime: Lắng nghe toàn bộ phiên thi của giáo viên theo thời gian thực */
  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = listenSessionsByTeacher(user.uid, (freshList) => {
      setSessions((prev) => {
        const freshMap = new Map(freshList.map((s) => [s.id, s]));
        const merged = [...freshList];
        prev.forEach((p) => {
          if (!freshMap.has(p.id)) merged.push(p);
        });
        merged.sort((a, b) => (b.startedAtMs || 0) - (a.startedAtMs || 0));
        return merged;
      });
    });
    return () => unsub?.();
  }, [user?.uid]);

  /* Realtime: Lắng nghe toàn bộ đề thi của giáo viên theo thời gian thực (tạo/nhân bản đề xuất hiện ngay) */
  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = listenExamsByTeacher(user.uid, (freshExams) => {
      setExams((prev) => {
        const freshMap = new Map(freshExams.map((e) => [e.id, e]));
        const others = prev.filter((e) => e.teacherId && e.teacherId !== user.uid);
        const combined = [...freshExams, ...others];
        combined.sort((a, b) => (tsMs(b.createdAt) || 0) - (tsMs(a.createdAt) || 0));
        return combined;
      });
    });
    return () => unsub?.();
  }, [user?.uid]);

  /* Realtime: Lắng nghe danh sách lớp của giáo viên theo thời gian thực */
  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = listenClassesByTeacher(user.uid, (freshClasses) => {
      setClasses(freshClasses);
    });
    return () => unsub?.();
  }, [user?.uid]);

  /* Realtime live session progress / proctoring */
  const liveIdsKey = sessions.filter((s) => s.status === 'live').map((s) => s.id).join(',');
  useEffect(() => {
    if (!liveIdsKey) return undefined;
    const unsubs = liveIdsKey.split(',').map((id) =>
      listenSession(id, (updated) => {
        if (!updated) return;
        setSessions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      })
    );
    return () => unsubs.forEach((u) => u && u());
  }, [liveIdsKey]);

  /* Realtime retry requests */
  const classIdsKey = classes.map((c) => c.id).sort().join(',');
  useEffect(() => {
    if (!user?.uid) return undefined;
    const ids = classIdsKey ? classIdsKey.split(',') : [];
    const unsub = listenRetryRequestsByClasses(
      ids,
      (list) => setRetryRequests(list || []),
      (err) => say(`Không đọc được yêu cầu thi lại (${err.code || 'lỗi'}).`, 'error')
    );
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, classIdsKey]);

  /* ❗ MỚI: lắng nghe yêu cầu theo NGƯỜI TẠO ĐỀ — đề Supabase không có classId,
     nên trước đây mọi yêu cầu thi lại của loại đề này không bao giờ tới giáo viên */
  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = listenRetryRequestsByTeacher(
      user.uid,
      (list) => setTeacherRetryRequests(list || []),
      (err) => say(`Không đọc được yêu cầu thi lại (${err.code || 'lỗi'}).`, 'error')
    );
    return () => unsub?.();
  }, [user?.uid]);

  /* Realtime submissions: Tự động cập nhật bài nộp của học sinh ngay khi vừa nộp */
  const allClassIdsKey = [...classes, ...linkedClasses].map((c) => c.id).filter(Boolean).sort().join(',');
  useEffect(() => {
    if (!allClassIdsKey) return undefined;
    const ids = allClassIdsKey.split(',');
    const unsubs = ids.map((cid) =>
      listenSubmissionsByClass(cid, (list) => {
        if (!list || !list.length) return;
        setSubmissionsMap((prev) => {
          const next = { ...prev };
          list.forEach((sub) => {
            if (!sub.examId) return;
            if (!next[sub.examId]) next[sub.examId] = [];
            const idx = next[sub.examId].findIndex((x) => x.id === sub.id);
            if (idx >= 0) next[sub.examId][idx] = sub;
            else next[sub.examId] = [sub, ...next[sub.examId]];
          });
          return next;
        });
      })
    );
    return () => unsubs.forEach((u) => u && u());
  }, [allClassIdsKey]);

  /* Lắng nghe nộp bài mới từ học sinh trong cùng trình duyệt (storage event giữa các tab) */
  useEffect(() => {
    const handleSubChange = () => {
      subsCacheRef.current = {};
      refresh().catch(() => {});
    };
    const onStorageEvent = (e) => {
      if (e.key === 'cs-last-submission-ts' || e.key === 'cs-submit-queue-v1') {
        handleSubChange();
      }
    };
    window.addEventListener('storage', onStorageEvent);
    window.addEventListener('cs-submission-created', handleSubChange);
    return () => {
      window.removeEventListener('storage', onStorageEvent);
      window.removeEventListener('cs-submission-created', handleSubChange);
    };
  }, [refresh]);

  /* Load allowances khi chọn lớp */
  useEffect(() => {
    if (!selectedClass?.id) {
      setAllowances({});
      return;
    }
    (async () => {
      try {
        const fresh = await getClassById(selectedClass.id);
        setSelectedClass(fresh);
        setAllowances(await getClassAllowances(selectedClass.id));
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [selectedClass?.id]);

  /* FIX #5: Refresh trước khi mở AI Studio + hỗ trợ truyền Preset từ InsightPanel */
  const openNewExam = async (presetOrEvent = null) => {
    const validPreset = (presetOrEvent && typeof presetOrEvent === 'object' && !presetOrEvent.nativeEvent && !presetOrEvent.target)
      ? presetOrEvent
      : null;
    setAiPreset(validPreset);

    if (classes.length === 0) {
      say('Hãy tạo lớp trước khi tạo đề', 'error');
      goSection('classes');
      return;
    }

    try {
      subsCacheRef.current = {};
      const freshExams = await getExamsByTeacher(user.uid);
      const freshSubs = {};
      await Promise.all(
        freshExams.slice(0, 8).map(async (e) => {
          try {
            const subs = await getSubmissionsByExam(e.id);
            freshSubs[e.id] = subs;
            subsCacheRef.current[e.id] = subs;
          } catch {
            freshSubs[e.id] = [];
          }
        })
      );
      setExams(freshExams);
      setSubmissionsMap(freshSubs);
    } catch (e) {
      console.warn('[TeacherDashboard] refresh trước AI Studio lỗi:', e);
    }

    if (classes.length === 1) {
      setSelectedClass(classes[0]);
      goSection('create');
      return;
    }
    setShowClassPicker(true);
  };

  /* ---------- ACTIONS ---------- */
  const copyText = useCallback(async (text, keyId, msg = 'Đã sao chép') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      say(msg, 'success');
      setTimeout(() => setCopiedKey(null), 1400);
    } catch {
      say('Không sao chép được', 'error');
    }
  }, [say]);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const createdCls = await createClass({
        name: newClassName.trim(),
        subject: newClassSubject,
        grade: newClassGrade,
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        requireApproval: true,
      });
      if (createdCls?.id) {
        setClasses((prev) => [createdCls, ...prev]);
      }
      setNewClassName('');
      setShowCreateClass(false);
      say(`Đã tạo lớp ${newClassName.trim()} (${newClassSubject} · Khối ${newClassGrade})`, 'success');
      refresh().catch(() => {});
    } catch (e) {
      say('Lỗi: ' + e.message, 'error');
    }
  };

  /* Giao / Nhân bản đề có sẵn sang một lớp khác (bao gồm cả lớp liên kết) */
  const handleCopyExamToClass = async () => {
    if (!copyExamTarget || !copyTargetClassId) return;
    const targetCls = [...classes, ...linkedClasses].find((c) => c.id === copyTargetClassId);
    setCopyExamBusy(true);
    try {
      const cloned = await createExam({
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        classId: copyTargetClassId,
        title: copyExamTarget.title || 'Đề kiểm tra',
        description: copyExamTarget.description || '',
        duration: copyExamTarget.duration || 45,
        questions: copyExamTarget.questions || [],
        showAnswerAfter: copyExamTarget.showAnswerAfter ?? true,
        allowRetry: copyExamTarget.allowRetry ?? false,
        shuffle: copyExamTarget.shuffle ?? true,
        proctor: copyExamTarget.proctor,
        subject: copyExamTarget.subject || targetCls?._mySubject || targetCls?.subject || '',
        grade: copyExamTarget.grade || targetCls?.grade || '',
        source: copyExamTarget.source || 'assigned-copy',
      });
      setExams((prev) => [cloned, ...prev]);
      if (targetCls?._linked && targetCls?.teacherId && targetCls.teacherId !== user.uid) {
        try {
          await notifyClassOwner({
            type: 'exam_assigned',
            toUid: targetCls.teacherId,
            actorId: user.uid,
            actorName: user.displayName || user.email || 'Giáo viên',
            classId: targetCls.id,
            className: targetCls.name,
            subject: cloned.subject || '',
            title: cloned.title,
            body: `vừa giao đề “${cloned.title}” sang lớp ${targetCls.name || ''}.`,
            tab: 'exams',
          });
        } catch { /* ignore */ }
      }
      setCopyExamTarget(null);
      say(`Đã giao đề “${cloned.title}” sang lớp ${targetCls?.name || copyTargetClassId}`, 'success', {
        undoLabel: 'Hoàn tác',
        onUndo: async () => {
          try {
            await deleteExamFs(cloned.id);
            setExams((prev) => prev.filter((e) => e.id !== cloned.id));
            say('Đã thu hồi đề vừa giao sang lớp khác', 'info');
          } catch { /* ignore */ }
        },
      });
    } catch (e) {
      say('Không giao được đề sang lớp khác: ' + (e.message || e), 'error');
    } finally {
      setCopyExamBusy(false);
    }
  };

  /* Đồng bộ toàn bộ câu hỏi từ Kho đề thi vào Ngân hàng câu hỏi */
  const handleSyncExamsToBank = useCallback(async () => {
    if (!exams.length || syncingBank) return;
    setSyncingBank(true);
    try {
      const batch = [];
      for (const ex of exams) {
        const qs = Array.isArray(ex.questions) ? ex.questions : [];
        for (const q of qs) {
          if (!q?.q) continue;
          batch.push({
            ...q,
            subject: q.subject || ex.subject || 'Hóa học',
            grade: String(q.grade || ex.grade || '12'),
            topic: q.topic || ex.title || 'Tổng hợp',
            difficulty: q.difficulty || 'thông hiểu',
            source: 'exam-sync',
          });
        }
      }
      if (!batch.length) {
        say('Các đề hiện tại chưa có câu hỏi nào để đồng bộ.', 'error');
        return;
      }
      const res = await addQuestionsBatch(batch, user?.uid);
      const addedCount = Array.isArray(res) ? res.length : (res?.added ?? batch.length);
      say(`Đã đồng bộ ${addedCount} câu hỏi từ ${exams.length} đề thi vào Ngân hàng câu hỏi!`, 'success');
    } catch (e) {
      say('Không đồng bộ được vào Ngân hàng: ' + (e.message || e), 'error');
    } finally {
      setSyncingBank(false);
    }
  }, [exams, syncingBank, user?.uid, say]);

  const handleStartSession = useCallback(async (exam) => {
    setStartingId(exam.id);
    try {
      const targetClassId = exam.classId || classes[0]?.id || linkedClasses[0]?.id || '';
      if (!targetClassId) {
        throw new Error('Đề thi chưa được gán vào lớp học nào. Hãy chọn hoặc tạo lớp trước.');
      }
      const session = await createExamSession({
        examId: exam.id,
        examToken: exam.token,
        classId: targetClassId,
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        title: exam.title,
        duration: exam.duration,
      });
      // Cập nhật state phòng thi ngay lập tức trong thời gian thực
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
      say('Đã mở phòng thi trực tiếp!', 'success');
      goSection('sessions');
    } catch (e) {
      say('Không mở được phòng thi: ' + (e?.message || e), 'error');
    } finally {
      setStartingId(null);
    }
  }, [user, classes, linkedClasses, say]);

  const handleEndSession = useCallback((session) => {
    setConfirmState({
      title: 'Kết thúc phòng thi?',
      body: `Tất cả HS đang làm bài "${session.title}" sẽ được yêu cầu nộp bài ngay.`,
      okLabel: 'Kết thúc',
      danger: true,
      onOk: async () => {
        try {
          await endExamSession(session.id);
          setSessions((prev) =>
            prev.map((s) => (s.id === session.id ? { ...s, status: 'ended', endedAtMs: Date.now() } : s))
          );
          say('Đã kết thúc phòng thi', 'success');
        } catch (e) {
          say('Không kết thúc được: ' + e.message, 'error');
        }
      },
    });
  }, [say]);

  const handleDeleteSession = useCallback((s) => {
    setConfirmState({
      title: 'Xóa phiên thi?',
      body: `Phiên "${s.title}" và dữ liệu giám sát sẽ bị xóa khỏi danh sách.`,
      okLabel: 'Xóa',
      danger: true,
      onOk: async () => {
        try {
          await deleteExamSession(s.id);
          setSessions((prev) => prev.filter((x) => x.id !== s.id));
          say('Đã xóa phiên', 'success');
        } catch (e) {
          say('Không xóa được: ' + e.message, 'error');
        }
      },
    });
  }, [say]);

  const handleDeleteExam = useCallback((exam) => {
    setConfirmState({
      title: 'Xóa đề thi?',
      body: `Đề "${exam.title}" sẽ bị xóa khỏi danh sách. Bạn có thể bấm Hoàn tác trong 6 giây sau khi xóa.`,
      okLabel: 'Xóa đề',
      danger: true,
      onOk: async () => {
        const snapshot = { ...exam };
        try {
          await deleteExamFs(exam.id);
          setExams((prev) => prev.filter((e) => e.id !== exam.id));
          delete subsCacheRef.current[exam.id];
          say(`Đã xóa đề “${exam.title}”`, 'success', {
            undoLabel: 'Hoàn tác',
            onUndo: async () => {
              try {
                const { id: _id, token: _token, ...rest } = snapshot;
                const recreated = await createExam({
                  ...rest,
                  teacherId: user.uid,
                  teacherName: user.displayName || user.email,
                });
                setExams((prev) => [recreated, ...prev]);
                say(`Đã khôi phục đề “${snapshot.title}”`, 'success');
              } catch (err) {
                say('Không khôi phục được đề: ' + (err.message || err), 'error');
              }
            },
          });
        } catch (e) {
          say('Lỗi: ' + e.message, 'error');
        }
      },
    });
  }, [say, user]);

  /* Nhân bản đề thi (Mục D4) */
  const handleDuplicateExam = useCallback(async (exam) => {
    try {
      const copyTitle = `${exam.title || 'Đề kiểm tra'} (Bản sao)`;
      const duplicated = await createExam({
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        classId: exam.classId,
        title: copyTitle,
        description: exam.description || '',
        duration: exam.duration || 45,
        questions: exam.questions || [],
        showAnswerAfter: exam.showAnswerAfter ?? true,
        allowRetry: exam.allowRetry ?? false,
        shuffle: exam.shuffle ?? true,
        proctor: exam.proctor,
        subject: exam.subject,
        grade: exam.grade,
        source: exam.source || 'duplicate',
      });
      setExams((prev) => [duplicated, ...prev]);
      say(`Đã nhân bản đề “${copyTitle}”`, 'success', {
        undoLabel: 'Hoàn tác',
        onUndo: async () => {
          try {
            await deleteExamFs(duplicated.id);
            setExams((prev) => prev.filter((e) => e.id !== duplicated.id));
            say('Đã hủy bản nhân bản', 'info');
          } catch { /* ignore */ }
        },
      });
    } catch (e) {
      say('Không nhân bản được đề: ' + (e.message || e), 'error');
    }
  }, [user, say]);

  /* Đặt lịch mở / đóng đề thi (Mục D4) */
  const openScheduleModal = useCallback((exam) => {
    const toLocalInput = (val) => {
      if (!val) return '';
      const ms = tsMs(val);
      if (!ms) return '';
      const d = new Date(ms - new Date().getTimezoneOffset() * 60000);
      return d.toISOString().slice(0, 16);
    };
    setScheduleExamModal(exam);
    setScheduleForm({
      opensAt: toLocalInput(exam.opensAt),
      closesAt: toLocalInput(exam.closesAt),
    });
  }, []);

  const handleSaveSchedule = async () => {
    if (!scheduleExamModal) return;
    const prevOpens = scheduleExamModal.opensAt || null;
    const prevCloses = scheduleExamModal.closesAt || null;
    const nextOpens = scheduleForm.opensAt ? new Date(scheduleForm.opensAt).toISOString() : null;
    const nextCloses = scheduleForm.closesAt ? new Date(scheduleForm.closesAt).toISOString() : null;
    if (nextOpens && nextCloses && new Date(nextOpens) >= new Date(nextCloses)) {
      say('Thời gian đóng đề phải sau thời gian mở đề.', 'error');
      return;
    }
    setScheduleSaving(true);
    try {
      const targetId = scheduleExamModal.id;
      await updateExam(targetId, { opensAt: nextOpens, closesAt: nextCloses });
      setExams((prev) => prev.map((e) => (
        e.id === targetId ? { ...e, opensAt: nextOpens, closesAt: nextCloses } : e
      )));
      setScheduleExamModal(null);
      say('Đã lưu lịch mở/đóng đề thi', 'success', {
        undoLabel: 'Hoàn tác',
        onUndo: async () => {
          await updateExam(targetId, { opensAt: prevOpens, closesAt: prevCloses });
          setExams((prev) => prev.map((e) => (
            e.id === targetId ? { ...e, opensAt: prevOpens, closesAt: prevCloses } : e
          )));
          say('Đã khôi phục lịch đề thi cũ', 'info');
        },
      });
    } catch (e) {
      say('Không lưu được lịch: ' + (e.message || e), 'error');
    } finally {
      setScheduleSaving(false);
    }
  };

  /* Xuất danh sách học sinh của 1 lớp ra CSV (Mục D4) */
  const exportClassRosterCsv = useCallback((cls) => {
    const members = cls?.members || [];
    const pending = cls?.pendingMembers || [];
    if (!members.length && !pending.length) {
      say('Lớp chưa có học sinh nào để xuất danh sách', 'error');
      return;
    }
    const rows = [['STT', 'Họ và tên', 'Email', 'Trạng thái', 'Mã lớp']];
    members.forEach((m, idx) => {
      rows.push([idx + 1, m.name || 'Học sinh', m.email || '', 'Chính thức', cls.key || '']);
    });
    pending.forEach((m, idx) => {
      rows.push([members.length + idx + 1, m.name || 'Học sinh', m.email || '', 'Chờ duyệt', cls.key || '']);
    });
    const safe = (cls.name || 'lop').replace(/[^\p{L}\p{N}]+/gu, '-');
    downloadCsv(`danh-sach-hoc-sinh-${safe}.csv`, rows);
    say(`Đã xuất danh sách ${members.length} học sinh lớp ${cls.name}`, 'success');
  }, [say]);

  const reloadClass = async (id) => {
    const fresh = await getClassById(id);
    setSelectedClass(fresh);
  };

  const handleRemoveMember = (cls, m) => {
    setConfirmState({
      title: 'Xóa khỏi lớp?',
      body: `${m.name} sẽ không còn thấy đề của lớp ${cls.name}.`,
      okLabel: 'Xóa',
      danger: true,
      onOk: async () => {
        try {
          await removeClassMember(cls.id, m.id);
          await refresh();
          await reloadClass(cls.id);
          say('Đã xóa thành viên', 'success');
        } catch (e) {
          say('Lỗi: ' + e.message, 'error');
        }
      },
    });
  };

  const handleApprove = async (cls, sid) => {
    const r = await approveMember(cls.id, sid);
    say(r.ok ? 'Đã duyệt vào lớp' : r.error, r.ok ? 'success' : 'error');
    if (r.ok) { await reloadClass(cls.id); await refresh(); }
  };

  const handleReject = async (cls, sid) => {
    const r = await rejectMember(cls.id, sid);
    say(r.ok ? 'Đã từ chối' : r.error, r.ok ? 'success' : 'error');
    if (r.ok) { await reloadClass(cls.id); await refresh(); }
  };

  const handleApproveAll = async (cls) => {
    const r = await approveAllMembers(cls.id);
    say(r.ok ? `Đã duyệt ${r.count || 0} yêu cầu` : r.error, r.ok ? 'success' : 'error');
    if (r.ok) { await reloadClass(cls.id); await refresh(); }
  };

  const handleToggleApproval = async (cls, v) => {
    await setClassApproval(cls.id, v);
    await reloadClass(cls.id);
    await refresh();
    say(v ? 'Bật duyệt thành viên' : 'Tắt duyệt thành viên', 'success');
  };

  const handleRenameClass = async (cls, name) => {
    const next = (name || renameDraft).trim();
    if (!next) return;
    const r = await updateClass(cls.id, { name: next });
    say(r.ok ? 'Đã đổi tên lớp' : r.error, r.ok ? 'success' : 'error');
    if (r.ok) { setRenameDraft(''); await reloadClass(cls.id); await refresh(); }
  };

  const handleSaveNotice = async () => {
    if (!noticeClass) return;
    setNoticeSaving(true);
    try {
      const text = noticeDraft.trim();
      const r = await updateClass(noticeClass.id, {
        announcement: text ? { text, updatedAt: Date.now() } : null,
      });
      if (r.ok) {
        say(text ? 'Đã ghim thông báo lên lớp' : 'Đã xóa thông báo', 'success');
        setNoticeClass(null);
        await refresh();
      } else {
        say(r.error || 'Lỗi lưu thông báo', 'error');
      }
    } catch (e) {
      say(e.message || 'Lỗi kết nối', 'error');
    } finally {
      setNoticeSaving(false);
    }
  };

  const handleRegenKey = (cls) => {
    setConfirmState({
      title: 'Đổi mã lớp?',
      body: 'Mã cũ sẽ không dùng được nữa. Học sinh mới phải nhập mã mới.',
      okLabel: 'Đổi mã',
      danger: true,
      onOk: async () => {
        const r = await regenerateClassKey(cls.id);
        if (!r.ok) { say(r.error, 'error'); return; }
        say(`Mã mới: ${r.key}`, 'success');
        await reloadClass(cls.id);
        await refresh();
        setShareClass({ ...cls, key: r.key });
      },
    });
  };

  const handleDeleteClass = (cls) => {
    setConfirmState({
      title: 'Xóa lớp?',
      body: `Lớp "${cls.name}", đề và bài nộp của lớp sẽ bị xóa. Không hoàn tác được.`,
      okLabel: 'Xóa lớp',
      danger: true,
      onOk: async () => {
        const r = await deleteClass(cls.id);
        if (!r.ok) { say(r.error, 'error'); return; }
        setSelectedClass(null);
        say('Đã xóa lớp', 'success');
        await refresh();
      },
    });
  };

  /* ============ DUYỆT THI LẠI (ĐƠN LẺ & HÀNG LOẠT — MỤC D4) ============ */
  const handleApproveRetry = async (req) => {
    const note = (retryNotes[req.id] || '').trim();
    setRetryActioning(req.id);
    const r = await approveRetry({
      permitId: req.id,
      teacherId: user.uid,
      note,
    });
    say(r.ok ? `Đã duyệt cho ${req.studentName} thi lại` : r.error, r.ok ? 'success' : 'error', r.ok ? {
      undoLabel: 'Hoàn tác (Từ chối lại)',
      onUndo: async () => {
        await denyRetry({ permitId: req.id, teacherId: user.uid, note: 'Hoàn tác duyệt' });
        say(`Đã hoàn tác duyệt của ${req.studentName}`, 'info');
      },
    } : {});
    if (r.ok) {
      setRetryNotes((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
    }
    setRetryActioning(null);
  };

  const handleDenyRetry = async (req) => {
    const note = (retryNotes[req.id] || '').trim();
    setRetryActioning(req.id);
    const r = await denyRetry({
      permitId: req.id,
      teacherId: user.uid,
      note,
    });
    say(r.ok ? `Đã từ chối ${req.studentName}` : r.error, r.ok ? 'success' : 'error', r.ok ? {
      undoLabel: 'Hoàn tác (Duyệt lại)',
      onUndo: async () => {
        await approveRetry({ permitId: req.id, teacherId: user.uid, note: 'Hoàn tác từ chối' });
        say(`Đã duyệt lại cho ${req.studentName}`, 'success');
      },
    } : {});
    if (r.ok) {
      setRetryNotes((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
    }
    setRetryActioning(null);
  };

  const handleBulkRetryAction = async (mode = 'approve') => {
    const ids = [...selectedRetryIds];
    if (!ids.length) return;
    const targets = retryRequests.filter((r) => ids.includes(r.id) && r.status === 'pending');
    if (!targets.length) {
      say('Các yêu cầu đã chọn đều đã được xử lý.', 'error');
      return;
    }
    setBulkRetryBusy(true);
    const note = bulkRetryNote.trim();
    let okCount = 0;
    for (const req of targets) {
      try {
        const res = mode === 'approve'
          ? await approveRetry({ permitId: req.id, teacherId: user.uid, note: note || retryNotes[req.id] || '' })
          : await denyRetry({ permitId: req.id, teacherId: user.uid, note: note || retryNotes[req.id] || 'Không đủ điều kiện thi lại' });
        if (res?.ok) okCount += 1;
      } catch { /* ignore individual failure */ }
    }
    setBulkRetryBusy(false);
    setSelectedRetryIds(new Set());
    setBulkRetryNote('');
    say(
      mode === 'approve'
        ? `Đã duyệt hàng loạt ${okCount}/${targets.length} yêu cầu thi lại`
        : `Đã từ chối hàng loạt ${okCount}/${targets.length} yêu cầu`,
      'success',
    );
  };

  const handleToggleAllowance = async (cls, m, allowed) => {
    const r = await setStudentRetryAllowance({
      classId: cls.id,
      studentId: m.id,
      allowed,
      teacherId: user.uid,
    });
    if (r.ok) {
      setAllowances((prev) => ({ ...prev, [m.id]: allowed }));
      say(allowed ? `Đã bật thi lại cho ${m.name}` : `Đã khóa thi lại của ${m.name}`, 'success');
    } else {
      say(r.error || 'Lỗi', 'error');
    }
  };

  /* ---------- DERIVED ---------- */
  const q = search.trim().toLowerCase();

  const liveSessions = useMemo(
    () => sessions.filter((s) => s.status === 'live' && timeRemaining(s, now) > 0),
    [sessions, now]
  );

  const subsAll = useMemo(
    () => Object.entries(submissionsMap).flatMap(([examId, list]) => list.map((s) => ({ ...s, examId }))),
    [submissionsMap]
  );

  const cutoff = range === 'all' ? 0 : now - Number(range) * 86400000;
  const subsInRange = useMemo(
    () => subsAll.filter((s) => {
      if (range === 'all') return true;
      const t = tsMs(s.submittedAt);
      return t > 0 && t >= cutoff;
    }),
    [subsAll, cutoff, range]
  );

  const avgPct = Math.round(avgOf(subsInRange.map(pctOf)));
  const passRate = subsInRange.length
    ? Math.round((subsInRange.filter((s) => pctOf(s) >= 50).length / subsInRange.length) * 100)
    : 0;
  const avgScore10 = (avgPct / 10).toFixed(1);

  const scoreDistOverview = useMemo(() => {
    if (!subsInRange.length) return { gioi: 0, kha: 0, tb: 0, yeu: 0, pcts: { gioi: 0, kha: 0, tb: 0, yeu: 0 } };
    const total = subsInRange.length;
    const gioi = subsInRange.filter((s) => pctOf(s) >= 80).length;
    const kha = subsInRange.filter((s) => pctOf(s) >= 65 && pctOf(s) < 80).length;
    const tb = subsInRange.filter((s) => pctOf(s) >= 50 && pctOf(s) < 65).length;
    const yeu = subsInRange.filter((s) => pctOf(s) < 50).length;
    return {
      gioi,
      kha,
      tb,
      yeu,
      total,
      pcts: {
        gioi: Math.round((gioi / total) * 100),
        kha: Math.round((kha / total) * 100),
        tb: Math.round((tb / total) * 100),
        yeu: Math.round((yeu / total) * 100),
      },
    };
  }, [subsInRange]);

  const classHealthGrade = useMemo(() => {
    if (!subsInRange.length) return { grade: '—', label: 'Chưa có bài nộp' };
    if (avgPct >= 85 && passRate >= 90) return { grade: 'A+', label: 'Xuất sắc' };
    if (avgPct >= 75 && passRate >= 80) return { grade: 'A', label: 'Tốt' };
    if (avgPct >= 65 && passRate >= 70) return { grade: 'B+', label: 'Khá' };
    if (avgPct >= 50) return { grade: 'B', label: 'Đạt chuẩn' };
    return { grade: 'C', label: 'Cần hỗ trợ' };
  }, [subsInRange.length, avgPct, passRate]);

  const atRiskStudents = useMemo(() => {
    const map = {};
    subsInRange.forEach((s) => {
      const p = pctOf(s);
      if (p < 50) {
        if (!map[s.studentId] || map[s.studentId].pct > p) {
          map[s.studentId] = { studentId: s.studentId, studentName: s.studentName, pct: Math.round(p) };
        }
      }
    });
    return Object.values(map);
  }, [subsInRange]);

  /* FIX: classInsights dùng Date.now() thay vì `now` để tránh recalc mỗi giây */
  const classInsights = useMemo(
    () => buildClassInsights({
      exams,
      submissionsMap,
      rangeDays: range,
      now: Date.now(),
    }),
    [exams, submissionsMap, range]
  );

  const trend = useMemo(() => {
    return [...exams]
      .sort((a, b) => tsMs(a.createdAt) - tsMs(b.createdAt))
      .map((e) => {
        const subs = submissionsMap[e.id] || [];
        if (!subs.length) return null;
        return { label: e.title, value: Math.round(avgOf(subs.map(pctOf))) };
      })
      .filter(Boolean)
      .slice(-8);
  }, [exams, submissionsMap]);

  const roomStudents = liveSessions.reduce(
    (a, s) => a + Math.max(0, (s.stats?.joined || 0) - (s.stats?.submitted || 0)), 0
  );
  const roomViol = liveSessions.reduce((a, s) => a + (s.stats?.violationCount || 0), 0);

  const recentExams = useMemo(
    () => [...exams].sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)).slice(0, 4),
    [exams]
  );

  /* Gồm cả lớp đã liên kết (GVBM) để thẻ đề/phiên thi hiện đúng tên lớp + chủ nhiệm */
  const classById = useMemo(() => {
    const map = Object.fromEntries(classes.map((c) => [c.id, c]));
    linkedClasses.forEach((c) => {
      if (c?.id && !map[c.id]) map[c.id] = c;
    });
    return map;
  }, [classes, linkedClasses]);

  const totalPendingMembers = useMemo(
    () => classes.reduce((sum, c) => sum + (c.pendingMembers?.length || 0), 0),
    [classes]
  );
  const totalPendingRetry = useMemo(
    () => retryRequests.filter((r) => r.status === 'pending').length,
    [retryRequests]
  );
  const retryRequestsForClass = useMemo(() => {
    if (!selectedClass?.id) return [];
    return retryRequests.filter((r) => r.classId === selectedClass.id);
  }, [retryRequests, selectedClass?.id]);

  const availableSubjects = useMemo(() => {
    const set = new Set();
    exams.forEach((e) => {
      const s = detectExamSubject(e);
      if (s && s !== '—') set.add(s);
    });
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [exams]);

  const exportAllCsv = () => {
    if (subsInRange.length === 0) { say('Chưa có bài nộp để xuất', 'error'); return; }
    const examTitle = Object.fromEntries(exams.map((e) => [e.id, e.title]));
    const rows = [['Đề', 'Họ tên', 'Điểm', 'Tổng điểm', '%', 'Câu đúng', 'Tổng câu', 'Vi phạm']];
    subsInRange.forEach((s) => rows.push([
      examTitle[s.examId] || s.examId, s.studentName, s.score, s.totalPoints,
      Math.round(pctOf(s)), s.correctCount, s.totalQuestions, s.violationCount || 0,
    ]));
    downloadCsv('bang-diem-tong-hop.csv', rows);
    say('Đã xuất bảng điểm', 'success');
  };

  const exportClassCsv = useCallback((cls, clsExams, subsMap) => {
    if (!cls || !clsExams?.length) { say('Chưa có dữ liệu để xuất', 'error'); return; }
    const members = cls.members || [];
    const header = ['Học sinh', 'Email', ...clsExams.map((e, i) => `Đề ${i + 1}`), 'Điểm TB', 'Cao nhất'];
    const rows = [header];

    members.forEach((m) => {
      const row = [m.name, m.email || ''];
      const scores = [];
      clsExams.forEach((ex) => {
        const sub = (subsMap[ex.id] || []).find((x) => x.studentId === m.id);
        if (sub) {
          const pct = Math.round((sub.score / (sub.totalPoints || 1)) * 100);
          row.push(`${pct}%`);
          scores.push(pct);
        } else {
          row.push('');
        }
      });
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '';
      const best = scores.length ? Math.max(...scores) : '';
      row.push(avg === '' ? '' : `${avg}%`);
      row.push(best === '' ? '' : `${best}%`);
      rows.push(row);
    });

    const safe = cls.name.replace(/[^\p{L}\p{N}]+/gu, '-');
    downloadCsv(`bang-diem-${safe}.csv`, rows);
    say('Đã xuất bảng điểm lớp ' + cls.name, 'success');
  }, [say]);

  /* ---------- EARLY RETURN ---------- */
  if (viewingSessionId) {
    const vs = sessions.find((s) => s.id === viewingSessionId);
    const vExam = exams.find((e) => e.id === vs?.examId);
    return (
      <ErrorBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          <LiveProctorView
            sessionId={viewingSessionId}
            className={classById[vs?.classId]?.name}
            totalQuestions={vExam?.questions?.length || 0}
            onBack={() => setViewingSessionId(null)}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (loadError) {
    return (
      <div className="vt"><div className="vt-loading">
        <p style={{ color: 'var(--acc)', fontWeight: 600 }}>{loadError}</p>
        <button type="button" className="vt-btn primary" onClick={refresh}>Thử lại</button>
      </div></div>
    );
  }

  /* ============================================================
     NAV ITEMS — 5 TRUNG TÂM NGHIỆP VỤ SƯ PHẠM TINH GỌN
     ============================================================ */
  const navItems = [
    /* 1. Tổng quan */
    {
      key: 'overview',
      shortLabel: 'Tổng quan',
      label: 'Tổng quan',
      Icon: IcoGrid,
      group: 'Lớp học & Giảng dạy',
    },

    /* 2. Quản lý Lớp học (Chủ nhiệm & Bộ môn) */
    {
      key: 'classes',
      matchKeys: ['classes', 'link'],
      shortLabel: 'Lớp học',
      label: 'Quản lý Lớp học',
      Icon: IcoUsers,
      badge: totalPendingMembers > 0 ? totalPendingMembers : null,
      live: totalPendingMembers > 0,
      group: 'Lớp học & Giảng dạy',
    },

    /* 3. Biên soạn & Kho đề (AI Tạo đề, Kho đề, Ngân hàng, Đảo đề) */
    {
      key: 'exams',
      matchKeys: ['exams', 'create', 'bank', 'simulator'],
      shortLabel: 'Kho đề',
      label: 'Biên soạn & Kho đề',
      Icon: IcoBook,
      group: 'Biên soạn & Khảo thí',
    },

    /* 4. Khảo thí & Chấm thi (Phòng thi LIVE, Chấm A4, Xin thi lại) */
    {
      key: 'sessions',
      matchKeys: ['sessions', 'paper', 'retry'],
      shortLabel: 'Khảo thí',
      label: 'Khảo thí & Chấm thi',
      Icon: IcoVideo,
      badge: (liveSessions.length + totalPendingRetry) || null,
      live: liveSessions.length > 0,
      group: 'Biên soạn & Khảo thí',
    },

    /* 5. Số liệu & Phổ điểm (Phổ điểm 4 mức độ Bộ GD&ĐT) */
    {
      key: 'analytics',
      shortLabel: 'Số liệu',
      label: 'Số liệu & Phổ điểm',
      Icon: IcoChart,
      group: 'Báo cáo & Hồ sơ',
    },

    /* 6. Hồ sơ giáo viên */
    {
      key: 'profile',
      shortLabel: 'Hồ sơ',
      label: 'Hồ sơ giáo viên',
      Icon: IcoUser,
      group: 'Báo cáo & Hồ sơ',
    },

    ...(showAdminLink ? [{
      key: 'admin',
      shortLabel: 'Quản trị',
      label: 'Quản trị hệ thống',
      Icon: IcoMonitor,
      group: 'Báo cáo & Hồ sơ',
      onClick: () => { window.location.hash = 'admin'; },
    }] : []),
  ];

  /* Môn dạy chính tự động lấy từ Hồ sơ giáo viên hoặc lớp/đề hiện có */
  const primarySubject = (() => {
    try {
      const raw = localStorage.getItem(`cs-teacher-profile-v1:${user?.uid || 'guest'}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.mainSubject) return parsed.mainSubject;
      }
    } catch { /* ignore */ }
    return classes[0]?.subject || availableSubjects[0] || 'Hóa học';
  })();

  const examsWithStatus = exams.map((ex) => {
    const liveSession = sessions.find((s) => s.examId === ex.id && s.status === 'live');
    return { ex, liveSession, st: examStatus(ex, liveSession, now) };
  });
  const countBy = (k) => examsWithStatus.filter((x) => x.st.key === k).length;

  const examTabs = [
    { key: 'all', label: 'Tất cả', count: exams.length },
    { key: 'draft', label: 'Nháp', count: countBy('draft') },
    { key: 'ready', label: 'Đã giao', count: countBy('ready') },
    { key: 'live', label: 'Đang thi', count: countBy('live') },
    { key: 'soon', label: 'Chưa mở', count: countBy('soon') },
    { key: 'closed', label: 'Đã kết thúc', count: countBy('closed') },
  ];
  const sessionTabs = [
    { key: 'all', label: 'Tất cả', count: sessions.length },
    { key: 'live', label: 'Đang thi (LIVE)', count: sessions.filter((s) => s.status === 'live').length },
    { key: 'ended', label: 'Đã kết thúc', count: sessions.filter((s) => s.status === 'ended').length },
  ];

  const topProps = {
    overview: {
      title: 'Tổng quan Giảng dạy',
      subtitle: `Thầy/Cô ${user?.displayName || user?.email?.split('@')[0] || 'Giáo viên'}`,
    },
    analytics: {
      title: 'Số liệu & Phân tích lớp học',
      subtitle: 'Biểu đồ xu hướng, so sánh hai lớp, lọc theo ngày và theo dõi học sinh cần kèm',
    },
    link: {
      title: 'Trung tâm Liên kết lớp & Giao đề chéo',
      subtitle: 'Nhập key liên kết từ giáo viên chủ nhiệm hoặc giao đề nhanh vào lớp khác',
    },
    classes: {
      title: 'Lớp học & Lớp liên kết',
      subtitle: `${classes.length} lớp chủ nhiệm · ${linkedClasses.length} lớp liên kết · ${classes.reduce((a, c) => a + (c.members?.length || 0), 0)} học sinh`,
      onSearch: setSearch,
      placeholder: 'Tìm lớp hoặc mã lớp (phím /)...',
    },
    exams: {
      tabs: examTabs, active: subTab, onTab: setSubTab,
      onSearch: setSearch, placeholder: 'Tìm đề thi (phím /)...',
    },
    sessions: {
      tabs: sessionTabs, active: subTab, onTab: setSubTab,
      onSearch: setSearch, placeholder: 'Tìm phiên thi (phím /)...',
    },
    create: {
      title: 'AutoExam AI Studio',
      subtitle: 'Trợ lý AI tạo đề đa môn & Lập ma trận chuẩn Bộ GD&ĐT 2025',
    },
    simulator: {
      title: 'Bộ Xem Trước, Mô Phỏng & Đảo Đề',
      subtitle: 'Quy trình 4 bước: Chọn đề gốc → Cấu hình đảo → Xem trước & Thi thử → Xuất & Giao đề',
    },
    bank: {
      title: 'Ngân hàng câu hỏi',
      subtitle: 'Cây thư mục chuyên đề, tìm kiếm toàn văn tiếng Việt, phát hiện trùng & AI hỗ trợ',
    },
    paper: {
      title: 'Chấm phiếu trắc nghiệm A4',
      subtitle: 'Nhận dạng phiếu tự động bằng Camera hoặc ảnh chụp, cảnh báo ô nghi ngờ',
    },
    retry: {
      title: 'Yêu cầu xin thi lại',
      subtitle: `${totalPendingRetry} yêu cầu đang chờ duyệt`,
      onSearch: setSearch,
      placeholder: 'Tìm học sinh hoặc lý do...',
    },
    profile: {
      title: 'Hồ sơ giáo viên bộ môn',
      subtitle: 'Thông tin giảng dạy, bảng điều khiển theo môn, thành tựu & cài đặt cá nhân',
    },
  }[section] || {};

  /* Công khai ⇄ riêng tư. Công khai phải xác nhận qua hộp thoại nội bộ + có Hoàn tác */
  const applyVisibilityChange = async (exam, next) => {
    const prev = exam.visibility || 'private';
    setSavingVis(exam.id);
    try {
      await setExamVisibility(exam.id, next);
      setExams((cur) => cur.map((e) => (e.id === exam.id ? { ...e, visibility: next } : e)));
      say(
        next === 'public' ? 'Đề đã chuyển sang Công khai' : 'Đề đã chuyển sang Riêng tư',
        'success',
        {
          undoLabel: 'Hoàn tác',
          onUndo: async () => {
            await setExamVisibility(exam.id, prev);
            setExams((cur) => cur.map((e) => (e.id === exam.id ? { ...e, visibility: prev } : e)));
            say('Đã hoàn tác chế độ hiển thị đề', 'info');
          },
        },
      );
    } catch (e) {
      say(e?.message || 'Không đổi được chế độ công khai', 'error');
    } finally {
      setSavingVis('');
    }
  };

  const toggleVisibility = (exam) => {
    const next = exam.visibility === 'public' ? 'private' : 'public';
    if (next === 'public') {
      setConfirmState({
        title: 'Công khai đề thi này?',
        body: 'Ai có liên kết cũng mở và làm bài được, kể cả học sinh ngoài lớp. Bài nộp của các em vẫn được ghi nhận.',
        okLabel: 'Công khai đề',
        danger: false,
        onOk: () => applyVisibilityChange(exam, next),
      });
      return;
    }
    applyVisibilityChange(exam, next);
  };

  /* Bật/tắt khoá bài qua hộp thoại nội bộ + Hoàn tác */
  const applyLockChange = async (exam, next) => {
    const prev = !!exam.lockUntilStart;
    setSavingLock(exam.id);
    try {
      await setExamLock(exam.id, next);
      setExams((cur) => cur.map((e) => (e.id === exam.id ? { ...e, lockUntilStart: next } : e)));
      say(
        next ? 'Đã khoá bài: học sinh chỉ luyện tập cho tới khi bạn bắt đầu' : 'Đã mở: học sinh vào thi được ngay',
        'success',
        {
          undoLabel: 'Hoàn tác',
          onUndo: async () => {
            await setExamLock(exam.id, prev);
            setExams((cur) => cur.map((e) => (e.id === exam.id ? { ...e, lockUntilStart: prev } : e)));
            say('Đã hoàn tác chế độ khoá bài', 'info');
          },
        },
      );
    } catch (e) {
      say(e?.message || 'Không đổi được chế độ khoá bài', 'error');
    } finally {
      setSavingLock('');
    }
  };

  const toggleLock = (exam) => {
    const next = !exam.lockUntilStart;
    if (next) {
      setConfirmState({
        title: 'Bật khoá bài cho đến khi bắt đầu?',
        body: 'Học sinh mở liên kết sẽ thấy bảng “Chưa đến giờ thi — đang chờ giáo viên”, chỉ vào thi thật khi bạn bấm “Bắt đầu thi”.',
        okLabel: 'Bật khoá bài',
        danger: false,
        onOk: () => applyLockChange(exam, next),
      });
      return;
    }
    applyLockChange(exam, next);
  };

  const goBell = () => setBellOpen(true);

  /* Header thanh điều hướng nhóm con: Biên soạn & Kho đề */
  const renderExamHubNav = () => (
    <div className="t-hub-subnav-bar">
      <div className="t-hub-subnav-info">
        <h2 className="t-hub-subnav-title">Biên soạn &amp; Kho đề</h2>
        <span className="t-hub-subnav-desc">Tạo đề AI chuẩn GDPT 2025, Ngân hàng câu hỏi ma trận &amp; Quản lý đề thi</span>
      </div>
      <div className="t-hub-subnav-pills" role="tablist" aria-label="Nhóm biên soạn &amp; kho đề">
        <button
          type="button"
          role="tab"
          aria-selected={section === 'create'}
          className={`t-hub-subnav-pill ${section === 'create' ? 'active' : ''}`}
          onClick={() => goSection('create')}
        >
          AI Tạo đề &amp; Word
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'exams'}
          className={`t-hub-subnav-pill ${section === 'exams' ? 'active' : ''}`}
          onClick={() => goSection('exams')}
        >
          Kho đề thi ({exams.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'bank'}
          className={`t-hub-subnav-pill ${section === 'bank' ? 'active' : ''}`}
          onClick={() => goSection('bank')}
        >
          Ngân hàng câu hỏi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'simulator'}
          className={`t-hub-subnav-pill ${section === 'simulator' ? 'active' : ''}`}
          onClick={() => goSection('simulator')}
        >
          Mô phỏng &amp; Đảo đề
        </button>
      </div>
    </div>
  );

  /* Header thanh điều hướng nhóm con: Khảo thí & Chấm thi */
  const renderAssessmentHubNav = () => (
    <div className="t-hub-subnav-bar">
      <div className="t-hub-subnav-info">
        <h2 className="t-hub-subnav-title">Khảo thí &amp; Chấm thi</h2>
        <span className="t-hub-subnav-desc">Phòng thi trực tuyến, Chấm phiếu trắc nghiệm A4 &amp; Duyệt xin thi lại</span>
      </div>
      <div className="t-hub-subnav-pills" role="tablist" aria-label="Nhóm khảo thí &amp; chấm thi">
        <button
          type="button"
          role="tab"
          aria-selected={section === 'sessions'}
          className={`t-hub-subnav-pill ${section === 'sessions' ? 'active' : ''}`}
          onClick={() => goSection('sessions')}
        >
          Phòng thi trực tuyến {liveSessions.length > 0 && <span className="t-pill-badge-live">{liveSessions.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'paper'}
          className={`t-hub-subnav-pill ${section === 'paper' ? 'active' : ''}`}
          onClick={() => goSection('paper')}
        >
          Chấm phiếu trắc nghiệm A4
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'retry'}
          className={`t-hub-subnav-pill ${section === 'retry' ? 'active' : ''}`}
          onClick={() => goSection('retry')}
        >
          Duyệt xin thi lại {totalPendingRetry > 0 && <span className="t-pill-badge-warn">{totalPendingRetry}</span>}
        </button>
      </div>
    </div>
  );

  /* Khối Giao diện Hợp nhất: Liên kết lớp & Giao đề lớp khác (dùng chung cho tab trong Lớp học và mục Giao đề lớp khác) */
  const renderUnifiedLinkedClassesHub = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <div className="vt-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Danh sách lớp đã liên kết ({linkedClasses.length})</h3>
              <p className="vt-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                Bấm “Giao đề” để mở trình tạo đề AI/thủ công gắn thẳng vào lớp đó, hoặc “Giám sát” khi lớp đang thi.
              </p>
            </div>
          </div>

          <LinkedClassesPanel
            user={user}
            onSay={say}
            onAssign={(classInfo) => {
              setExtOpen(false);
              setExtClass(classInfo);
              setExtCreate(true);
              goSection('create');
            }}
            onMonitor={(session) => {
              setSessions((prev) => (
                prev.some((s) => s.id === session.id) ? prev : [session, ...prev]
              ));
              setExtOpen(false);
              setViewingSessionId(session.id);
            }}
          />
        </div>

        <div className="vt-card">
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Giao đề nhanh bằng Mã lớp (Không cần Key)</h3>
          <p className="vt-muted" style={{ margin: '0.3rem 0 0.75rem', fontSize: '0.82rem' }}>
            Nếu bạn chỉ cần giao 1 đề kiểm tra đột xuất vào lớp của đồng nghiệp, hãy nhập trực tiếp mã lớp của học sinh tại đây:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              value={extKey}
              onChange={(e) => { setExtKey(e.target.value.toUpperCase()); setExtErr(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') findExternalClass(); }}
              placeholder="VD: 11A7-8KQ3ZM"
              style={{
                flex: '1 1 200px',
                padding: '0.6rem 0.85rem',
                fontSize: '0.92rem',
                letterSpacing: '0.06em',
                borderRadius: 12,
                border: '1.5px solid var(--soft)',
                background: 'var(--vt-tint)',
                color: 'var(--ink)',
                textTransform: 'uppercase',
              }}
            />
            <button
              type="button"
              className="vt-btn sm primary"
              onClick={async () => {
                await findExternalClass();
                if (extKey.trim()) {
                  setExtCreate(true);
                }
              }}
              disabled={extBusy}
            >
              {extBusy ? 'Đang tìm…' : 'Tìm lớp & Giao đề'}
            </button>
          </div>
          {extErr && <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--vt-red)', fontWeight: 600 }}>{extErr}</p>}
          {extClass && (
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                Đã tìm thấy lớp <b>{extClass.name}</b> {extClass.teacherName ? `(GVCN: ${extClass.teacherName})` : ''}
              </span>
              <button
                type="button"
                className="vt-btn sm primary"
                onClick={() => {
                  setExtCreate(true);
                  goSection('create');
                }}
              >
                Soạn đề cho lớp {extClass.name} →
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <LinkClassPanel />
      </div>
    </div>
  );

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <DashFrame
      items={navItems}
      active={section}
      onChange={goSection}
      fullscreen
      onOpenCommandPalette={() => {
        setCmdOpen(true);
        setCmdQuery('');
        setCmdIndex(0);
      }}
      onOpenAiCopilot={() => setAiDrawerOpen(true)}
      exitLabel="Về ELEC AI"
      onExit={() => {
        if (onExit) onExit();
        else window.location.hash = 'home';
      }}
    >
      <Topbar
        {...topProps}
        onOpenAiCopilot={() => setAiChatOpen((v) => !v)}
        search={section !== 'create' && section !== 'simulator' && section !== 'bank' && section !== 'profile' && section !== 'analytics' && section !== 'link' ? search : undefined}
        bell={section !== 'create' && section !== 'bank' ? {
          on: liveSessions.length > 0 || totalPendingRetry > 0 || totalPendingMembers > 0 || unreadNotices > 0,
          onClick: () => {
            if (totalPendingRetry > 0) goSection('retry');
            else if (totalPendingMembers > 0) goSection('classes');
            else goBell();
          },
          title: [
            liveSessions.length ? `${liveSessions.length} phòng LIVE` : '',
            totalPendingRetry ? `${totalPendingRetry} yêu cầu thi lại` : '',
            totalPendingMembers ? `${totalPendingMembers} HS chờ duyệt` : '',
          ].filter(Boolean).join(' · ') || 'Không có thông báo mới',
        } : undefined}
      />

      {/* ============================================================
          TỔNG QUAN — KHÔNG GIAN SƯ PHẠM FLOE-STYLE GỌN GÀNG & TIỆN LỢI
         ============================================================ */}
      {section === 'overview' && (
        <div className="t-workspace-container">
          {/* HEADER CHÍNH: LỜI CHÀO & PHÂN ĐỊNH VAI TRÒ */}
          <div className="t-header-row">
            <div>
              <h1 className="t-header-title">
                Xin chào, Thầy/Cô {user?.displayName || user?.email?.split('@')[0] || 'Giáo viên'}
              </h1>
              <p className="t-header-sub">
                Chủ nhiệm <b>{classes.length} lớp</b> ({classes.reduce((sum, c) => sum + (c.members?.length || 0), 0)} học sinh) · Dạy bộ môn: <b>{linkedClasses.length} lớp</b> {primarySubject ? `(Môn: ${primarySubject})` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="t-range-pills" role="group" aria-label="Khoảng thời gian thống kê">
                {[
                  { k: '7', label: '7 ngày' },
                  { k: '30', label: '30 ngày' },
                  { k: '90', label: '90 ngày' },
                  { k: 'all', label: 'Cả năm' },
                ].map((opt) => (
                  <button
                    key={opt.k}
                    type="button"
                    className={`t-range-pill ${range === opt.k ? 'active' : ''}`}
                    onClick={() => setRange(opt.k)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* HÀNG PHÍM TẮT THAO TÁC NHANH (TIỆN LỢI 1-CHẠM) */}
          <div className="t-quick-actions-bar">
            <button type="button" className="t-quick-btn primary" onClick={openNewExam}>
              + Tạo đề mới (N)
            </button>
            <button type="button" className="t-quick-btn" onClick={() => goSection('create')}>
              Nhập từ Word
            </button>
            <button type="button" className="t-quick-btn" onClick={() => goSection('sessions')}>
              Phòng thi trực tuyến
            </button>
            <button type="button" className="t-quick-btn" onClick={() => goSection('paper')}>
              Chấm phiếu A4
            </button>
            <button type="button" className="t-quick-btn" onClick={() => { goSection('classes'); setShowCreateClass(true); }}>
              + Tạo lớp mới
            </button>
          </div>

          {/* BẢNG NHẮC VIỆC CẦN LÀM NGAY (CHỈ HIỆN KHI CÓ NHIỆM VỤ THẬT) */}
          {(totalPendingMembers > 0 || totalPendingRetry > 0 || liveSessions.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {totalPendingMembers > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1.15rem', borderRadius: 14,
                  background: 'color-mix(in srgb, #f59e0b 12%, var(--t-surface-1))',
                  border: '1.5px solid #f59e0b', gap: '0.75rem',
                }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#b45309' }}>{totalPendingMembers} Học sinh chờ duyệt vào lớp</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>Cần phê duyệt để học sinh vào làm bài thi</p>
                  </div>
                  <button type="button" className="vt-btn sm primary" onClick={() => goSection('classes')}>Duyệt ngay</button>
                </div>
              )}
              {totalPendingRetry > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1.15rem', borderRadius: 14,
                  background: 'color-mix(in srgb, #8b5cf6 12%, var(--t-surface-1))',
                  border: '1.5px solid #8b5cf6', gap: '0.75rem',
                }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#7c3aed' }}>{totalPendingRetry} Học sinh xin thi lại</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>Học sinh gặp sự cố mạng hoặc nộp nhầm</p>
                  </div>
                  <button type="button" className="vt-btn sm" onClick={() => goSection('retry')} style={{ background: '#8b5cf6', color: '#fff' }}>Xem yêu cầu</button>
                </div>
              )}
              {liveSessions.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1.15rem', borderRadius: 14,
                  background: 'color-mix(in srgb, #10b981 12%, var(--t-surface-1))',
                  border: '1.5px solid #10b981', gap: '0.75rem',
                }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#059669' }}>{liveSessions.length} Phòng thi trực tuyến đang mở</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>{liveSessions[0]?.title} đang diễn ra</p>
                  </div>
                  <button type="button" className="vt-btn sm" onClick={() => goSection('sessions')} style={{ background: '#10b981', color: '#fff' }}>Vào giám sát</button>
                </div>
              )}
            </div>
          )}

          {/* 4 THẺ CHỈ SỐ SƯ PHẠM (FLOE STYLE: ICON PASTEL, TREND & TABULAR NUMS) */}
          <div className="t-kpi-grid">
            <div className="t-kpi-card tone-blue" onClick={() => goSection('classes')}>
              <div className="t-kpi-head">
                <span className="t-kpi-label">Tổng học sinh</span>
                <div className="t-kpi-icon-badge">
                  <IcoUsers size={19} />
                </div>
              </div>
              <span className="t-kpi-num">{classes.reduce((sum, c) => sum + (c.members?.length || 0), 0)}</span>
              <div className="t-kpi-meta">
                <span>{classes.length} lớp chủ nhiệm · {linkedClasses.length} bộ môn</span>
                <span className="t-kpi-trend-pill ok">● Đang học</span>
              </div>
            </div>

            <div className="t-kpi-card tone-violet" onClick={() => goSection('exams')}>
              <div className="t-kpi-head">
                <span className="t-kpi-label">Kho đề thi đã soạn</span>
                <div className="t-kpi-icon-badge">
                  <IcoBook size={19} />
                </div>
              </div>
              <span className="t-kpi-num">{exams.length}</span>
              <div className="t-kpi-meta">
                <span>{countBy('ready')} đề đã giao vào lớp</span>
                <span className="t-kpi-trend-pill ok">GDPT 2025</span>
              </div>
            </div>

            <div className="t-kpi-card tone-emerald" onClick={() => goSection('analytics')}>
              <div className="t-kpi-head">
                <span className="t-kpi-label">Điểm trung bình lớp</span>
                <div className="t-kpi-icon-badge">
                  <IcoChart size={19} />
                </div>
              </div>
              <span className="t-kpi-num">{subsInRange.length ? `${avgScore10} / 10` : '—'}</span>
              <div className="t-kpi-meta">
                <span>{passRate}% học sinh đạt chuẩn</span>
                <span className="t-kpi-trend-pill ok">≥ 5.0 điểm</span>
              </div>
            </div>

            <div
              className="t-kpi-card tone-rose"
              onClick={() => goSection('analytics')}
            >
              <div className="t-kpi-head">
                <span className="t-kpi-label" style={{ color: atRiskStudents.length > 0 ? '#e11d48' : undefined }}>
                  Học sinh cần phụ đạo
                </span>
                <div className="t-kpi-icon-badge">
                  <IcoAlert size={19} />
                </div>
              </div>
              <span className="t-kpi-num" style={{ color: atRiskStudents.length > 0 ? '#e11d48' : undefined }}>
                {atRiskStudents.length}
              </span>
              <div className="t-kpi-meta">
                <span>{atRiskStudents.length > 0 ? `${atRiskStudents.length} em dưới 5.0 điểm` : 'Tất cả đạt chuẩn'}</span>
                <span className={`t-kpi-trend-pill ${atRiskStudents.length > 0 ? 'warn' : 'ok'}`}>
                  {atRiskStudents.length > 0 ? 'Cần kèm cặp' : 'Tốt'}
                </span>
              </div>
            </div>
          </div>

          {/* KHỐI FOLDERS: LỚP HỌC PHỤ TRÁCH (THIẾT KẾ DẠNG FOLDER CARD NHƯ FLOE) */}
          <div className="t-folders-section">
            <div className="t-folders-header">
              <div className="t-folders-title-wrap">
                <h2 className="t-folders-title">Lớp học của tôi</h2>
                <span className="t-badge-count">{classes.length + linkedClasses.length}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="vt-btn sm"
                  onClick={() => goSection('link')}
                >
                  Nhận lớp bộ môn
                </button>
                <button
                  type="button"
                  className="vt-btn sm primary"
                  onClick={() => { goSection('classes'); setShowCreateClass(true); }}
                >
                  + Tạo lớp mới
                </button>
              </div>
            </div>

            {classes.length === 0 && linkedClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--t-surface-1)', borderRadius: 20, border: '1px solid var(--t-border)' }}>
                <p style={{ margin: '0 0 1rem', color: 'var(--t-ink-muted)' }}>Chưa có lớp học nào. Bắt đầu tạo lớp học đầu tiên ngay:</p>
                <button type="button" className="vt-btn primary" onClick={() => { goSection('classes'); setShowCreateClass(true); }}>
                  + Tạo lớp chủ nhiệm
                </button>
              </div>
            ) : (
              <div className="t-folders-grid">
                {classes.map((c, idx) => {
                  const tints = ['tint-lavender', 'tint-sky', 'tint-peach', 'tint-mint'];
                  const tint = tints[idx % tints.length];
                  const classExams = exams.filter((e) => e.classId === c.id);
                  const members = c.members || [];
                  const membersCount = members.length;
                  return (
                    <div
                      key={c.id}
                      className={`t-folder-card ${tint}`}
                      onClick={() => { setSelectedClass(c); setDetailTab('overview'); goSection('classes'); }}
                    >
                      <div className="t-folder-top">
                        <span className="t-role-badge homeroom">Chủ nhiệm</span>
                        <span
                          className="t-folder-code"
                          onClick={(e) => { e.stopPropagation(); copyText(c.key, c.id, 'Đã sao chép mã lớp'); }}
                          title="Bấm để sao chép mã lớp"
                        >
                          Mã: <code style={{ fontWeight: 700 }}>{c.key}</code>
                        </span>
                      </div>

                      <h3 className="t-folder-name">{c.name}</h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>
                        {c.subject || 'Đa môn'} {c.grade ? `· Khối ${c.grade}` : ''} · <b>{classExams.length}</b> đề
                      </span>

                      <div className="t-folder-foot" onClick={(e) => e.stopPropagation()}>
                        <FloeAvatarStack count={membersCount} names={members.map((m) => m.name || m.studentName || '')} />
                        <button
                          type="button"
                          className="vt-btn sm primary"
                          style={{ padding: '0.28rem 0.75rem', fontSize: '0.74rem' }}
                          onClick={() => {
                            setSelectedClass(c);
                            goSection('create');
                          }}
                        >
                          Giao đề →
                        </button>
                      </div>
                    </div>
                  );
                })}

                {linkedClasses.map((c, idx) => {
                  const tints = ['tint-sky', 'tint-mint', 'tint-lavender', 'tint-peach'];
                  const tint = tints[(idx + 2) % tints.length];
                  const classExams = exams.filter((e) => e.classId === c.id);
                  const members = c.members || [];
                  return (
                    <div
                      key={c.id}
                      className={`t-folder-card ${tint}`}
                      onClick={() => { setSelectedClass(c); setDetailTab('overview'); goSection('classes'); }}
                    >
                      <div className="t-folder-top">
                        <span className="t-role-badge subject">Bộ môn: {c.subject || primarySubject}</span>
                        <span className="t-folder-code">CN: {c.ownerName || c.teacherName || 'Đồng nghiệp'}</span>
                      </div>

                      <h3 className="t-folder-name">{c.name}</h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>
                        Môn {c.subject || primarySubject} · <b>{classExams.length}</b> đề
                      </span>

                      <div className="t-folder-foot" onClick={(e) => e.stopPropagation()}>
                        <FloeAvatarStack count={members.length} names={members.map((m) => m.name || m.studentName || '')} />
                        <button
                          type="button"
                          className="vt-btn sm primary"
                          style={{ padding: '0.28rem 0.75rem', fontSize: '0.74rem' }}
                          onClick={() => {
                            setSelectedClass(c);
                            goSection('create');
                          }}
                        >
                          Giao đề →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* KHỐI WORKFLOWS: ĐỀ THI NỔI BẬT & PHIÊN KHẢO THÍ (PHONG CÁCH FLOE WORKFLOWS 7) */}
          <div className="t-workflows-section">
            <div className="t-workflows-header">
              <div className="t-folders-title-wrap">
                <h2 className="t-folders-title">Đề thi nổi bật &amp; Khảo thí</h2>
                <span className="t-badge-count">{exams.length}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="vt-btn sm"
                  onClick={() => goSection('exams')}
                >
                  Xem toàn bộ kho đề ({exams.length}) →
                </button>
                <button
                  type="button"
                  className="vt-btn sm primary"
                  onClick={openNewExam}
                >
                  + Soạn đề mới (N)
                </button>
              </div>
            </div>

            {exams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--t-surface-1)', borderRadius: 20, border: '1px solid var(--t-border)' }}>
                <p style={{ margin: '0 0 1rem', color: 'var(--t-ink-muted)' }}>Chưa có đề thi nào trong kho. Hãy bắt đầu tạo đề kiểm tra đầu tiên:</p>
                <button type="button" className="vt-btn primary" onClick={openNewExam}>
                  + Tạo đề thi AI chuẩn GDPT 2025
                </button>
              </div>
            ) : (
              <div className="t-workflows-grid">
                {exams.slice(0, 6).map((ex) => {
                  const live = liveSessions.find((s) => s.examId === ex.id);
                  const cls = classById[ex.classId];
                  const subs = submissionsMap[ex.id] || [];
                  return (
                    <FloeWorkflowCard
                      key={ex.id}
                      exam={ex}
                      liveSession={live}
                      cls={cls}
                      submissions={subs}
                      onStart={handleStartSession}
                      onViewLive={(sid) => setViewingSessionId(sid)}
                      onDetail={(e) => setDetailExamModal(e)}
                      starting={startingId === ex.id}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* 2 CỘT CÂN ĐỐI: PHỔ ĐIỂM BỘ GD&ĐT & TOP CÂU HỎI SAI */}
          <div className="t-split-grid">
            {/* CỘT 1: PHỔ ĐIỂM */}
            <div className="t-split-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--t-ink)' }}>
                    Phổ điểm học lực chuẩn Bộ GD&amp;ĐT
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>
                    Thang điểm 10 · {subsInRange.length} bài nộp ({range === 'all' ? 'toàn bộ thời gian' : `${range} ngày qua`})
                  </p>
                </div>
                <button type="button" className="vt-btn sm" onClick={() => goSection('analytics')}>
                  Chi tiết
                </button>
              </div>

              <div className="ta-score-distribution">
                <div className="ta-score-bar-track">
                  {scoreDistOverview.pcts.gioi > 0 && (
                    <div className="ta-score-seg gioi" style={{ width: `${scoreDistOverview.pcts.gioi}%` }} title={`Giỏi: ${scoreDistOverview.gioi} HS (${scoreDistOverview.pcts.gioi}%)`} />
                  )}
                  {scoreDistOverview.pcts.kha > 0 && (
                    <div className="ta-score-seg kha" style={{ width: `${scoreDistOverview.pcts.kha}%` }} title={`Khá: ${scoreDistOverview.kha} HS (${scoreDistOverview.pcts.kha}%)`} />
                  )}
                  {scoreDistOverview.pcts.tb > 0 && (
                    <div className="ta-score-seg tb" style={{ width: `${scoreDistOverview.pcts.tb}%` }} title={`Trung bình: ${scoreDistOverview.tb} HS (${scoreDistOverview.pcts.tb}%)`} />
                  )}
                  {scoreDistOverview.pcts.yeu > 0 && (
                    <div className="ta-score-seg yeu" style={{ width: `${scoreDistOverview.pcts.yeu}%` }} title={`Yếu: ${scoreDistOverview.yeu} HS (${scoreDistOverview.pcts.yeu}%)`} />
                  )}
                </div>

                <div className="ta-score-cards">
                  <div className="ta-score-card" onClick={() => goSection('analytics')}>
                    <div className="ta-score-card-top">
                      <span className="ta-score-dot gioi" />
                      <span>Giỏi (8 - 10)</span>
                    </div>
                    <span className="ta-score-card-val">{scoreDistOverview.gioi} <small style={{ fontSize: '0.72rem' }}>em</small></span>
                    <span className="ta-score-card-pct">{scoreDistOverview.pcts.gioi}%</span>
                  </div>

                  <div className="ta-score-card" onClick={() => goSection('analytics')}>
                    <div className="ta-score-card-top">
                      <span className="ta-score-dot kha" />
                      <span>Khá (6.5 - 7.9)</span>
                    </div>
                    <span className="ta-score-card-val">{scoreDistOverview.kha} <small style={{ fontSize: '0.72rem' }}>em</small></span>
                    <span className="ta-score-card-pct">{scoreDistOverview.pcts.kha}%</span>
                  </div>

                  <div className="ta-score-card" onClick={() => goSection('analytics')}>
                    <div className="ta-score-card-top">
                      <span className="ta-score-dot tb" />
                      <span>TB (5 - 6.4)</span>
                    </div>
                    <span className="ta-score-card-val">{scoreDistOverview.tb} <small style={{ fontSize: '0.72rem' }}>em</small></span>
                    <span className="ta-score-card-pct">{scoreDistOverview.pcts.tb}%</span>
                  </div>

                  <div className="ta-score-card" onClick={() => goSection('analytics')}>
                    <div className="ta-score-card-top">
                      <span className="ta-score-dot yeu" />
                      <span>Yếu (&lt; 5.0)</span>
                    </div>
                    <span className="ta-score-card-val" style={{ color: scoreDistOverview.yeu > 0 ? '#ef4444' : undefined }}>
                      {scoreDistOverview.yeu} <small style={{ fontSize: '0.72rem' }}>em</small>
                    </span>
                    <span className="ta-score-card-pct">{scoreDistOverview.pcts.yeu}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT 2: TOP CÂU HỎI SAI */}
            <div className="t-split-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--t-ink)' }}>
                    Câu hỏi học sinh sai nhiều nhất
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>
                    Lỗ hổng kiến thức cần chữa bài trên lớp
                  </p>
                </div>
                <button type="button" className="vt-btn sm" onClick={() => goSection('analytics')}>
                  Xem tất cả
                </button>
              </div>

              {(!classInsights?.hardest || classInsights.hardest.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--t-ink-muted)', fontSize: '0.84rem' }}>
                  Chưa có câu hỏi nào bị sai nhiều. Lớp làm bài rất tốt!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {classInsights.hardest.slice(0, 3).map((q, idx) => {
                    const rawTitle = q.questionText || q.topic || `Câu hỏi #${idx + 1}`;
                    const cleanTitle = rawTitle.replace(/^(ĐỀ[-_\s]KIỂM[-_\s]TRA[^\n]+?)(Câu\s*\d+|Bài\s*\d+|$)/i, '$2').trim() || rawTitle;
                    return (
                      <div key={idx} style={{
                        padding: '0.75rem 0.95rem',
                        borderRadius: 12,
                        background: 'var(--t-surface-2)',
                        border: '1px solid var(--t-border)',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                      }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                          background: '#fee2e2', color: '#b91c1c', flexShrink: 0,
                        }}>
                          {100 - (q.pctCorrect || 0)}% sai
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rawTitle}>
                            {cleanTitle}
                          </p>
                          <span style={{ fontSize: '0.74rem', color: 'var(--t-ink-muted)' }}>
                            {q.examTitle ? `${q.examTitle.slice(0, 32)}... · ` : ''}{q.correctCount}/{q.totalAttempts} em đúng
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* TRỢ LÝ PHÂN TÍCH AI (COLLAPSIBLE TỰ NHIÊN) */}
          <details
            style={{
              background: 'var(--t-surface-1)',
              border: '1px solid var(--t-border)',
              borderRadius: 18,
              padding: '0.85rem 1.15rem',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.92rem',
                color: 'var(--t-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                listStyle: 'none',
              }}
            >
              <span>Trợ lý Phân tích AI &amp; Gợi ý khắc phục lỗ hổng kiến thức ({classes[0]?.name || 'Toàn bộ lớp'})</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--t-accent)', fontWeight: 600 }}>
                Mở rộng / Thu gọn ▾
              </span>
            </summary>
            <div style={{ marginTop: '0.85rem' }}>
              <ErrorBoundary>
                <Suspense fallback={<InsightSkeleton />}>
                  <InsightPanel
                    insightsData={classInsights}
                    className={classes[0]?.name || 'Toàn bộ lớp học'}
                    subject={primarySubject}
                    onOpenAiStudio={(preset) => openNewExam(preset)}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          </details>
        </div>
      )}

      {/* ============================================================
          TRUNG TÂM LIÊN KẾT LỚP & GIAO ĐỀ LỚP KHÁC (HỢP NHẤT)
         ============================================================ */}
      {section === 'link' && renderUnifiedLinkedClassesHub()}

      {section === 'analytics' && (
        <ClassAnalytics
          classes={linkedClasses.length ? [...classes, ...linkedClasses] : classes}
          exams={exams}
          submissionsMap={submissionsMap}
          loading={loading}
          onRetry={refresh}
        />
      )}

      {section === 'classes' && (() => {
        const filteredClasses = classes
          .filter((c) => {
            if (q && !c.name?.toLowerCase().includes(q) && !c.key?.toLowerCase().includes(q)) return false;
            if (classFilter === 'pending') return (c.pendingMembers?.length || 0) > 0;
            if (classFilter === 'hasExams') return exams.some((e) => e.classId === c.id);
            return true;
          })
          .sort((a, b) => {
            if (classSort === 'members') return (b.members?.length || 0) - (a.members?.length || 0);
            if (classSort === 'exams') {
              const ea = exams.filter((e) => e.classId === a.id).length;
              const eb = exams.filter((e) => e.classId === b.id).length;
              return eb - ea;
            }
            return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
          });

        return (
          <>
            {/* TOOLBAR CHUYỂN ĐỔI VAI TRÒ CHỦ NHIỆM - BỘ MÔN */}
            <div className="t-classes-toolbar">
              <div className="t-classes-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={classSectionTab === 'my'}
                  className={`t-classes-tab ${classSectionTab === 'my' ? 'active' : ''}`}
                  onClick={() => setClassSectionTab('my')}
                >
                  Lớp chủ nhiệm ({classes.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={classSectionTab === 'linked'}
                  className={`t-classes-tab ${classSectionTab === 'linked' ? 'active' : ''}`}
                  onClick={() => setClassSectionTab('linked')}
                >
                  Lớp dạy bộ môn ({linkedClasses.length})
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {classSectionTab === 'my' ? (
                  <button type="button" className="vt-btn sm primary" onClick={() => setShowCreateClass(true)}>
                    + Tạo lớp mới (N)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="vt-btn sm primary"
                    onClick={() => {
                      const el = document.querySelector('input[placeholder*="11A7"]');
                      if (el) el.focus();
                    }}
                  >
                    Nhập mã nhận lớp
                  </button>
                )}
              </div>
            </div>

            {classSectionTab === 'linked' ? (
              renderUnifiedLinkedClassesHub()
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                      { k: 'all', label: `Tất cả (${classes.length})` },
                      { k: 'pending', label: `Có HS chờ duyệt (${classes.filter((c) => (c.pendingMembers?.length || 0) > 0).length})` },
                      { k: 'hasExams', label: `Đang có đề (${classes.filter((c) => exams.some((e) => e.classId === c.id)).length})` },
                    ].map((f) => (
                      <button
                        key={f.k}
                        type="button"
                        className={`vt-btn sm ${classFilter === f.k ? 'primary' : ''}`}
                        onClick={() => setClassFilter(f.k)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      aria-label="Sắp xếp lớp học"
                      value={classSort}
                      onChange={(e) => setClassSort(e.target.value)}
                      style={{
                        padding: '0.4rem 0.7rem',
                        borderRadius: 10,
                        border: '1px solid var(--soft)',
                        background: 'var(--panel)',
                        color: 'var(--ink)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      <option value="name">Sắp xếp: Tên lớp A → Z</option>
                      <option value="members">Sắp xếp: Sĩ số giảm dần</option>
                      <option value="exams">Sắp xếp: Số đề giảm dần</option>
                    </select>

                    <div style={{ display: 'inline-flex', background: 'var(--vt-tint)', borderRadius: 10, padding: '0.2rem', gap: '0.2rem' }} role="group" aria-label="Chế độ hiển thị lớp học">
                      <button
                        type="button"
                        onClick={() => setClassViewMode('grid')}
                        aria-label="Chế độ lưới"
                        style={{
                          padding: '0.32rem 0.65rem',
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          background: classViewMode === 'grid' ? 'var(--acc)' : 'transparent',
                          color: classViewMode === 'grid' ? '#fff' : 'var(--ink)',
                        }}
                      >
                        Lưới
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassViewMode('list')}
                        aria-label="Chế độ danh sách"
                        style={{
                          padding: '0.32rem 0.65rem',
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          background: classViewMode === 'list' ? 'var(--acc)' : 'transparent',
                          color: classViewMode === 'list' ? '#fff' : 'var(--ink)',
                        }}
                      >
                        Danh sách
                      </button>
                    </div>
                  </div>
                </div>

                <div className={classViewMode === 'list' ? 'vt-stackcards' : 't-folders-grid'}>
                  <button
                    type="button"
                    className="t-folder-card"
                    style={{
                      border: '2px dashed var(--t-border)',
                      background: 'var(--t-surface-1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: 180,
                    }}
                    onClick={() => setShowCreateClass(true)}
                  >
                    <span style={{ fontSize: '2rem', color: 'var(--t-accent)', lineHeight: 1 }}>+</span>
                    <b style={{ color: 'var(--t-ink)', fontSize: '0.95rem' }}>Tạo lớp mới (Phím N)</b>
                    <small style={{ color: 'var(--t-ink-muted)' }}>Cấp mã lớp cho học sinh tự tham gia</small>
                  </button>

                  {filteredClasses.map((cls, idx) => {
                    const members = cls.members || [];
                    const classExams = exams.filter((e) => e.classId === cls.id);
                    const pendingCount = cls.pendingMembers?.length || 0;
                    const tints = ['tint-lavender', 'tint-sky', 'tint-peach', 'tint-mint'];
                    const tint = tints[idx % tints.length];
                    return (
                      <article
                        key={cls.id}
                        className={`t-folder-card ${tint}`}
                        onClick={() => { setSelectedClass(cls); setDetailTab('overview'); }}
                      >
                        <div className="t-folder-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className="t-role-badge homeroom">Chủ nhiệm</span>
                            {pendingCount > 0 && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                                ● {pendingCount} chờ duyệt
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                            <span
                              className="t-folder-code"
                              onClick={() => copyText(cls.key, cls.id, 'Đã sao chép mã lớp')}
                              title="Bấm để sao chép mã lớp"
                              style={{ cursor: 'pointer' }}
                            >
                              Mã: <code style={{ fontWeight: 700 }}>{cls.key}</code>
                            </span>
                            <button
                              type="button"
                              className="vt-icon-btn"
                              aria-label="Chia sẻ mã QR"
                              onClick={() => setShareClass(cls)}
                              title="Chia sẻ mã QR"
                            >
                              QR
                            </button>
                          </div>
                        </div>

                        <h3 className="t-folder-name" style={{ fontSize: '1.2rem' }}>{cls.name}</h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>
                          {cls.subject || 'Đa môn'} {cls.grade ? `· Khối ${cls.grade}` : ''} · <b>{classExams.length}</b> đề thi
                        </span>

                        {pendingCount > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '.45rem',
                              padding: '.45rem .75rem',
                              borderRadius: 12,
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              color: '#b45309',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{pendingCount} học sinh chờ vào lớp</span>
                            <button
                              type="button"
                              className="vt-btn sm primary"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
                              onClick={() => handleApproveAll(cls)}
                              title="Duyệt tất cả học sinh đang chờ"
                            >
                              Duyệt tất cả
                            </button>
                          </div>
                        )}

                        {cls.announcement?.text && (
                          <div style={{
                            fontSize: '0.76rem',
                            color: 'var(--ink)',
                            background: 'rgba(255, 255, 255, 0.7)',
                            padding: '0.35rem 0.6rem',
                            borderRadius: 10,
                            border: '1px solid var(--t-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}>
                            <IcoPin size={13} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {cls.announcement.text}
                            </span>
                          </div>
                        )}

                        <div className="t-folder-foot" onClick={(e) => e.stopPropagation()}>
                          <FloeAvatarStack count={members.length} names={members.map((m) => m.name || m.studentName || '')} />
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="vt-btn sm"
                              onClick={() => { setDetailTab('teachers'); setSelectedClass(cls); }}
                              title="Mời GV Bộ môn"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            >
                              GV Bộ môn
                            </button>
                            <button
                              type="button"
                              className="vt-btn sm primary"
                              onClick={() => { setSelectedClass(cls); goSection('create'); }}
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
                            >
                              Giao đề →
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </>
        );
      })()}

      {/* ============================================================
          ĐỀ THI — LỌC TRẠNG THÁI, NHÂN BẢN, ĐẶT LỊCH, THEO DÕI TRỰC TIẾP
         ============================================================ */}
      {section === 'exams' && (() => {
        const list = examsWithStatus
          .filter(({ ex, st }) => {
            if (subTab !== 'all' && st.key !== subTab) return false;
            if (subjectFilter && detectExamSubject(ex) !== subjectFilter) return false;
            if (q && !ex.title?.toLowerCase().includes(q)) return false;
            return true;
          })
          .sort((a, b) => {
            if (examSort === 'title') return String(a.ex.title || '').localeCompare(String(b.ex.title || ''), 'vi');
            if (examSort === 'subs') {
              return (submissionsMap[b.ex.id]?.length || 0) - (submissionsMap[a.ex.id]?.length || 0);
            }
            return tsMs(b.ex.createdAt) - tsMs(a.ex.createdAt);
          });

        /* ❗ Thẻ đề Floe Workflow Cards phong cách hiện đại */
        const renderExamCard = ({ ex, liveSession, st }) => {
          const cls = classById[ex.classId];
          const subs = submissionsMap[ex.id] || [];
          return (
            <FloeWorkflowCard
              key={ex.id}
              exam={ex}
              liveSession={liveSession}
              cls={cls}
              submissions={subs}
              onStart={handleStartSession}
              onViewLive={(sid) => setViewingSessionId(sid)}
              onDetail={(e) => setDetailExamModal(e)}
              starting={startingId === ex.id}
            />
          );
        };

        /* ❗ MỚI: gom đề theo LỚP → môn (thư mục). Nhóm có phòng LIVE tự mở. */
        const groups = (() => {
          const map = new Map();
          for (const item of list) {
            const cid = item.ex.classId || '__none__';
            if (!map.has(cid)) map.set(cid, { key: cid, cls: classById[cid] || null, items: [], mons: [] });
            map.get(cid).items.push(item);
          }
          const arr = [...map.values()];
          for (const g of arr) {
            const monMap = new Map();
            for (const it of g.items) {
              const mon = detectExamSubject(it.ex) || 'Khác';
              if (!monMap.has(mon)) monMap.set(mon, []);
              monMap.get(mon).push(it);
            }
            g.mons = [...monMap.entries()].map(([name, items]) => ({ name, items }));
            g.live = g.items.filter((it) => it.liveSession).length;
          }
          arr.sort((a, b) => (b.live - a.live)
            || ((a.key === '__none__') - (b.key === '__none__'))
            || String(a.cls?.name || '').localeCompare(String(b.cls?.name || ''), 'vi'));
          return arr;
        })();

        if (exams.length === 0) {
          return (
            <>
              {renderExamHubNav()}
              <div className="vt-empty">
                <span><IcoBook size={30} /></span>
                <h3>Chưa có đề nào trong kho</h3>
                <p>Tạo đề bằng AI hoặc nhập từ Word để giao bài cho học sinh.</p>
                <button type="button" className="vt-btn primary" onClick={openNewExam}>+ Tạo đề đầu tiên cùng AI</button>
              </div>
            </>
          );
        }

        return (
          <>
            {renderExamHubNav()}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  aria-label="Sắp xếp đề thi"
                  value={examSort}
                  onChange={(e) => setExamSort(e.target.value)}
                  style={{
                    padding: '0.4rem 0.7rem',
                    borderRadius: 10,
                    border: '1px solid var(--soft)',
                    background: 'var(--panel)',
                    color: 'var(--ink)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="newest">Sắp xếp: Mới tạo gần đây</option>
                  <option value="title">Sắp xếp: Tên đề A → Z</option>
                  <option value="subs">Sắp xếp: Nhiều bài nộp nhất</option>
                </select>
                {roomStudents > 0 && (
                  <span style={{ padding: '0.32rem 0.75rem', borderRadius: 999, background: 'rgba(16,185,129,0.14)', color: '#059669', fontSize: '0.76rem', fontWeight: 800 }}>
                    ● {roomStudents} học sinh đang làm bài trực tiếp
                  </span>
                )}
              </div>

              <div style={{ display: 'inline-flex', background: 'var(--vt-tint)', borderRadius: 999, padding: '.25rem', gap: '.25rem' }}>
                <button
                  type="button"
                  onClick={() => setExamGroupMode('class')}
                  style={{ padding: '.35rem .8rem', borderRadius: 999, border: 'none', cursor: 'pointer', font: '700 .76rem var(--t-font-sans)', background: examGroupMode === 'class' ? 'var(--acc)' : 'transparent', color: examGroupMode === 'class' ? '#fff' : 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" /></svg>
                  Nhóm theo lớp
                </button>
                <button
                  type="button"
                  onClick={() => setExamGroupMode('flat')}
                  style={{ padding: '.35rem .8rem', borderRadius: 999, border: 'none', cursor: 'pointer', font: '700 .76rem var(--t-font-sans)', background: examGroupMode === 'flat' ? 'var(--acc)' : 'transparent', color: examGroupMode === 'flat' ? '#fff' : 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                  Danh sách
                </button>
              </div>
            </div>
            {availableSubjects.length > 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Môn:
                </span>
                <button
                  type="button"
                  className={'vt-chip' + (!subjectFilter ? ' active' : '')}
                  onClick={() => setSubjectFilter('')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: 999,
                    border: '1.5px solid ' + (!subjectFilter ? 'var(--acc)' : 'var(--soft)'),
                    background: !subjectFilter ? 'var(--acc)' : 'var(--panel)',
                    color: !subjectFilter ? '#fff' : 'var(--ink)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  Tất cả ({exams.length})
                </button>
                {availableSubjects.map((s) => {
                  const count = exams.filter((e) => detectExamSubject(e) === s).length;
                  const active = subjectFilter === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      className={'vt-chip' + (active ? ' active' : '')}
                      onClick={() => setSubjectFilter(s)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: 999,
                        border: '1.5px solid ' + (active ? 'var(--acc)' : 'var(--soft)'),
                        background: active ? 'var(--acc)' : 'var(--panel)',
                        color: active ? '#fff' : 'var(--ink)',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {s} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {list.length === 0 ? (
              <div className="vt-empty">
                <span><IcoBook size={30} /></span>
                <h3>Không có đề phù hợp</h3>
                <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                {subjectFilter && (
                  <button type="button" className="vt-btn" onClick={() => setSubjectFilter('')}>
                    Xóa bộ lọc môn
                  </button>
                )}
              </div>
            ) : (
              examGroupMode === 'flat' ? (
                <div className="t-workflows-grid">
                  {list.map(renderExamCard)}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '.6rem' }}>
                  {groups.map((g) => {
                    const open = openGroups.has(g.key) || g.live > 0;
                    return (
                      <div key={g.key} style={{ display: 'grid', gap: '.55rem' }}>
                        <button
                          type="button"
                          onClick={() => toggleGroup(g.key)}
                          className="vt-card"
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.7rem .95rem', cursor: 'pointer', textAlign: 'left', borderRadius: 16 }}
                        >
                          <span style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--t-accent-subtle)', color: 'var(--t-accent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" /></svg>
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <b style={{ font: '800 .95rem var(--t-font-sans)', color: 'var(--t-ink)', display: 'block' }}>{g.cls?.name || 'Chưa gắn lớp'}</b>
                            <small style={{ color: 'var(--t-ink-muted)', font: '600 .74rem var(--t-font-sans)', display: 'block' }}>
                              {g.mons.map((m) => m.name).join(', ') || '—'}
                              {` · ${g.items.length} đề`}
                              {g.cls?.teacherName ? ` · GV chủ nhiệm: ${g.cls.teacherName}` : ''}
                              {g.cls?.members?.length ? ` · ${g.cls.members.length} HS` : ''}
                            </small>
                          </span>
                          {g.live > 0 && (
                            <span style={{ padding: '.25rem .6rem', borderRadius: 999, background: 'var(--t-status-ok-subtle)', color: 'var(--t-status-ok)', font: '800 .7rem var(--t-font-sans)' }}>● LIVE {g.live}</span>
                          )}
                          <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease', color: 'var(--t-ink-muted)', display: 'grid' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                          </span>
                        </button>
                        {open && (
                          <div style={{ display: 'grid', gap: '.7rem', paddingLeft: '.3rem' }}>
                            {g.mons.map((m) => (
                              <div key={m.name}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', margin: '.1rem 0 .45rem' }}>
                                  <b style={{ font: '800 .7rem var(--t-font-sans)', letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--t-ink-muted)' }}>{m.name}</b>
                                  <span style={{ height: 1, flex: 1, background: 'var(--soft)' }} />
                                  <small style={{ color: 'var(--t-ink-muted)', font: '600 .72rem var(--t-font-sans)' }}>{m.items.length} đề</small>
                                </div>
                                <div className="t-workflows-grid">
                                  {m.items.map(renderExamCard)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        );
      })()}

      {/* ============================================================
          PHÒNG THI — THEO DÕI TRỰC TIẾP SỐ HỌC SINH ĐANG LÀM
         ============================================================ */}
      {section === 'sessions' && (() => {
        const list = sessions
          .filter((s) => (subTab === 'all' || s.status === subTab) && (!q || s.title?.toLowerCase().includes(q)))
          .sort((a, b) => {
            if (sessionSort === 'active') {
              const aa = Math.max(0, (a.stats?.joined || 0) - (a.stats?.submitted || 0));
              const bb = Math.max(0, (b.stats?.joined || 0) - (b.stats?.submitted || 0));
              return bb - aa;
            }
            return (b.startedAtMs || 0) - (a.startedAtMs || 0);
          });

        return (
          <>
            {renderAssessmentHubNav()}
            <div className="vt-range" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>Phiên thi</h2>
                {roomStudents > 0 && (
                  <span style={{ padding: '0.28rem 0.7rem', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#059669', fontSize: '0.76rem', fontWeight: 800 }}>
                    ● {roomStudents} học sinh đang làm bài trực tiếp
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <select
                  aria-label="Sắp xếp phiên thi"
                  value={sessionSort}
                  onChange={(e) => setSessionSort(e.target.value)}
                  style={{
                    padding: '0.38rem 0.65rem',
                    borderRadius: 10,
                    border: '1px solid var(--soft)',
                    background: 'var(--panel)',
                    color: 'var(--ink)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="newest">Sắp xếp: Mới mở gần đây</option>
                  <option value="active">Sắp xếp: Đông học sinh đang làm nhất</option>
                </select>

                <div style={{ display: 'inline-flex', background: 'var(--vt-tint)', borderRadius: 10, padding: '0.2rem', gap: '0.2rem' }} role="group" aria-label="Chế độ hiển thị phiên thi">
                  <button
                    type="button"
                    onClick={() => setSessionViewMode('grid')}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: sessionViewMode === 'grid' ? 'var(--acc)' : 'transparent',
                      color: sessionViewMode === 'grid' ? '#fff' : 'var(--ink)',
                    }}
                  >
                    Lưới
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionViewMode('list')}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: sessionViewMode === 'list' ? 'var(--acc)' : 'transparent',
                      color: sessionViewMode === 'list' ? '#fff' : 'var(--ink)',
                    }}
                  >
                    Danh sách
                  </button>
                </div>

                <button type="button" className="vt-btn sm" onClick={refresh}>
                  <IcoRefresh size={13} /> Làm mới
                </button>
              </div>
            </div>

            {list.length === 0 ? (
              <div className="vt-empty">
                <span><IcoVideo size={30} /></span>
                <h3>Chưa có phiên thi nào</h3>
                <p>Vào mục Đề thi và bấm "Bắt đầu thi" để mở phòng.</p>
                <button type="button" className="vt-btn primary" onClick={() => goSection('exams')}>
                  Đến mục Đề thi
                </button>
              </div>
            ) : (
              <div className={sessionViewMode === 'list' ? 'vt-stackcards' : 'vt-grid'}>
                {list.map((s) => {
                  const exam = exams.find((e) => e.id === s.examId);
                  const remaining = timeRemaining(s, now);
                  const isLive = s.status === 'live';
                  const expired = isLive && remaining <= 0;
                  const total = (s.duration || 1) * 60;
                  const joined = s.stats?.joined || 0;
                  const submitted = s.stats?.submitted || 0;
                  const doingNow = Math.max(0, joined - submitted);
                  const viol = s.stats?.violationCount || 0;
                  const tone = remaining < 60 ? 'danger' : remaining < 300 ? 'warn' : 'acc';
                  return (
                    <article key={s.id} className={'vt-card vt-session' + (isLive ? ' live' : ' ended')}>
                      <header>
                        <span className={'vt-chip ' + (isLive ? (expired ? 'closed' : 'live') : 'closed')}>
                          <IcoDot size={7} /> {isLive ? (expired ? 'Hết giờ' : 'Đang thi (LIVE)') : 'Đã kết thúc'}
                        </span>
                        <small>{fmtClock(s.startedAtMs)}</small>
                      </header>

                      <div className="vt-session-body">
                        <Donut
                          value={isLive ? remaining : submitted}
                          max={isLive ? total : Math.max(joined, 1)}
                          size={92}
                          stroke={9}
                          tone={isLive ? tone : 'acc'}
                        >
                          {isLive
                            ? <strong className="sm"><IcoClock size={12} /> {fmtMMSS(remaining)}</strong>
                            : <strong className="sm">{submitted}/{joined}</strong>}
                        </Donut>
                        <div>
                          <h3>{s.title}</h3>
                          <small>{exam?.questions?.length || 0} câu · {s.duration} phút</small>
                          {isLive && (
                            <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>
                              ● {doingNow} học sinh đang làm bài
                            </div>
                          )}
                        </div>
                      </div>

                      <dl className="vt-mini-stats">
                        <div><dd>{doingNow}</dd><dt>Đang làm</dt></div>
                        <div><dd>{submitted}/{joined}</dd><dt>Đã nộp</dt></div>
                        <div className={viol > 0 ? 'danger' : ''}><dd>{viol}</dd><dt>Vi phạm</dt></div>
                      </dl>

                      <footer>
                        {isLive ? (
                          <>
                            <button type="button" className="vt-btn sm primary" onClick={() => setViewingSessionId(s.id)}>
                              <IcoMonitor size={13} /> Giám sát
                            </button>
                            <button type="button" className="vt-btn sm danger" onClick={() => handleEndSession(s)}>
                              <IcoStop size={13} /> Kết thúc
                            </button>
                          </>
                        ) : (
                          <button type="button" className="vt-btn sm" onClick={() => setViewingSessionId(s.id)}>
                            <IcoChart size={13} /> Xem lại
                          </button>
                        )}
                        <button
                          type="button"
                          className="vt-icon-btn danger"
                          aria-label="Xóa phiên thi"
                          onClick={() => handleDeleteSession(s)}
                          title="Xóa phiên"
                        >
                          <IcoTrash size={15} />
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        );
      })()}

      {/* ============================================================
          MÔ PHỎNG & ĐẢO ĐỀ
         ============================================================ */}
      {section === 'simulator' && (
        <>
          {renderExamHubNav()}
          <ErrorBoundary>
            <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải bộ mô phỏng...</p></div>}>
              <TeacherSimulatorHub
                teacherExams={exams}
                classes={classes}
                initialImportedExam={simulatorInitialExam}
                onImportPreset={async (presetData) => {
                  try {
                    const targetClassId = presetData?.classId || classes[0]?.id || linkedClasses[0]?.id || '';
                    const created = await createExam({
                      teacherId: user.uid,
                      teacherName: user.displayName || user.email,
                      classId: targetClassId,
                      title: presetData?.title || 'Đề kiểm tra từ Word',
                      description: presetData?.description || 'Nhập từ bộ Trộn Đề Thi',
                      duration: Number(presetData?.duration) || 45,
                      questions: presetData?.questions || [],
                      subject: presetData?.subject || 'Hóa học',
                      grade: presetData?.grade || '12',
                      shuffle: true,
                      showAnswerAfter: true,
                      source: 'word-mixer',
                    });
                    if (created?.id) {
                      setExams((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
                    }
                    say(`Đã lưu đề “${created.title}” vào Kho đề thi!`, 'success');
                  } catch (err) {
                    say('Không lưu được đề: ' + (err?.message || err), 'error');
                  }
                }}
                onAssignShuffled={async (assignPayload) => {
                  try {
                    const targetClassId = assignPayload?.classId || classes[0]?.id || linkedClasses[0]?.id || '';
                    const created = await createExam({
                      teacherId: user.uid,
                      teacherName: user.displayName || user.email,
                      classId: targetClassId,
                      title: assignPayload?.title || 'Đề thi đã trộn mã',
                      description: assignPayload?.description || '',
                      duration: Number(assignPayload?.duration) || 45,
                      questions: assignPayload?.questions || [],
                      subject: assignPayload?.subject || 'Hóa học',
                      grade: assignPayload?.grade || '12',
                      shuffle: true,
                      showAnswerAfter: assignPayload?.showAnswerAfter ?? true,
                      source: 'shuffled-assign',
                    });
                    if (created?.id) {
                      setExams((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
                    }
                    say(`Đã giao đề “${created.title}” thành công!`, 'success');
                  } catch (err) {
                    say('Không giao được đề: ' + (err?.message || err), 'error');
                  }
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </>
      )}

      {/* ============================================================
          NGÂN HÀNG CÂU HỎI
         ============================================================ */}
      {section === 'bank' && (
        <>
          {renderExamHubNav()}
          <ErrorBoundary>
            <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải ngân hàng...</p></div>}>
              <QuestionBank
                classes={classes}
                onSoftExamCreated={(exam) => {
                  if (exam?.id) {
                    setExams((prev) => [exam, ...prev.filter((x) => x.id !== exam.id)]);
                  }
                  refresh().catch(() => {});
                }}
                onOpenAiStudio={openNewExam}
              />
            </Suspense>
          </ErrorBoundary>
        </>
      )}

      {/* ============================================================
          CHẤM PHIẾU A4 (OMR)
         ============================================================ */}
      {section === 'paper' && (
        <>
          {renderAssessmentHubNav()}
          <ErrorBoundary>
            <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải chấm phiếu A4...</p></div>}>
              <PaperGrading classes={classes} exams={exams} />
            </Suspense>
          </ErrorBoundary>
        </>
      )}

      {/* ============================================================
          HỒ SƠ GIÁO VIÊN BỘ MÔN (MỤC D3)
         ============================================================ */}
      {section === 'profile' && (
        <ErrorBoundary>
          <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải hồ sơ giáo viên...</p></div>}>
            <TeacherProfileSection
              user={user}
              classes={classes}
              exams={exams}
              submissionsMap={submissionsMap}
              onNavigate={(sec, cls) => {
                if (cls) setSelectedClass(cls);
                goSection(sec);
              }}
              onExamImported={(exam) => {
                if (exam?.id) {
                  setExams((prev) => [exam, ...prev.filter((x) => x.id !== exam.id)]);
                }
                refresh().catch(() => {});
              }}
              onSay={say}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* ============================================================
          XIN THI LẠI — DUYỆT/TỪ CHỐI KÈM LÝ DO & DUYỆT HÀNG LOẠT (MỤC D4)
         ============================================================ */}
      {section === 'retry' && (() => {
        const filteredRetries = retryRequests.filter((r) => {
          if (retryStatusFilter === 'pending' && r.status !== 'pending') return false;
          if (retryStatusFilter === 'resolved' && r.status === 'pending') return false;
          if (retryClassFilter !== 'all' && r.classId !== retryClassFilter) return false;
          if (q && !r.studentName?.toLowerCase().includes(q) && !r.reason?.toLowerCase().includes(q)) return false;
          return true;
        });
        const pendingFiltered = filteredRetries.filter((r) => r.status === 'pending');
        const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every((r) => selectedRetryIds.has(r.id));

        const toggleSelectOne = (id) => {
          setSelectedRetryIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        };

        const toggleSelectAllPending = () => {
          if (allPendingSelected) {
            setSelectedRetryIds(new Set());
          } else {
            setSelectedRetryIds(new Set(pendingFiltered.map((r) => r.id)));
          }
        };

        return (
          <>
            {renderAssessmentHubNav()}
            <div className="vt-range" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { k: 'pending', label: `Chờ duyệt (${retryRequests.filter((r) => r.status === 'pending').length})` },
                  { k: 'resolved', label: `Đã xử lý (${retryRequests.filter((r) => r.status !== 'pending').length})` },
                  { k: 'all', label: `Tất cả (${retryRequests.length})` },
                ].map((tab) => (
                  <button
                    key={tab.k}
                    type="button"
                    className={`vt-btn sm ${retryStatusFilter === tab.k ? 'primary' : ''}`}
                    onClick={() => setRetryStatusFilter(tab.k)}
                  >
                    {tab.label}
                  </button>
                ))}

                <select
                  aria-label="Lọc yêu cầu theo lớp"
                  value={retryClassFilter}
                  onChange={(e) => setRetryClassFilter(e.target.value)}
                  style={{
                    padding: '0.38rem 0.65rem',
                    borderRadius: 10,
                    border: '1px solid var(--soft)',
                    background: 'var(--panel)',
                    color: 'var(--ink)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="all">Tất cả lớp</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>Lớp {c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="vt-btn sm"
                onClick={async () => {
                  await refresh();
                  say('Đã tải lại danh sách yêu cầu thi lại', 'success');
                }}
              >
                <IcoRefresh size={13} /> Làm mới
              </button>
            </div>

            {pendingFiltered.length > 0 && (
              <div
                className="vt-card"
                style={{
                  marginBottom: '0.85rem',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  background: 'var(--vt-tint)',
                }}
              >
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleSelectAllPending}
                  />
                  Chọn tất cả ({selectedRetryIds.size}/{pendingFiltered.length} yêu cầu chờ duyệt)
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    placeholder="Lý do / ghi chú chung khi duyệt hoặc từ chối hàng loạt..."
                    value={bulkRetryNote}
                    onChange={(e) => setBulkRetryNote(e.target.value)}
                    style={{
                      minWidth: 220,
                      flex: '1 1 220px',
                      maxWidth: 360,
                      padding: '0.45rem 0.75rem',
                      borderRadius: 10,
                      border: '1px solid var(--soft)',
                      background: 'var(--panel)',
                      color: 'var(--ink)',
                      fontSize: '0.8rem',
                    }}
                  />
                  <button
                    type="button"
                    className="vt-btn sm primary"
                    disabled={selectedRetryIds.size === 0 || bulkRetryBusy}
                    onClick={() => handleBulkRetryAction('approve')}
                  >
                    <IcoCheckCircle size={13} /> Duyệt hàng loạt ({selectedRetryIds.size})
                  </button>
                  <button
                    type="button"
                    className="vt-btn sm"
                    disabled={bulkRetryBusy}
                    onClick={async () => {
                      const safePending = pendingFiltered.filter((r) => {
                        const prevSubs = submissionsMap[r.examId] || [];
                        const prev = prevSubs.find((s) => s.studentId === r.studentId || s.studentName === r.studentName);
                        if (!prev) return true;
                        const pct = pctOf(prev);
                        return pct < 50 && (prev.violationCount || 0) === 0;
                      });
                      if (!safePending.length) {
                        say('Không có đơn chờ duyệt nào thỏa tiêu chí (<50% điểm & 0 vi phạm).', 'info');
                        return;
                      }
                      setBulkRetryBusy(true);
                      let ok = 0;
                      for (const req of safePending) {
                        try {
                          const res = await approveRetry({
                            permitId: req.id,
                            teacherId: user.uid,
                            note: bulkRetryNote.trim() || 'Duyệt tự động: Điểm dưới 50% & 0 vi phạm quy chế',
                          });
                          if (res?.ok) ok += 1;
                        } catch { /* ignore */ }
                      }
                      setBulkRetryBusy(false);
                      say(`Đã duyệt nhanh ${ok}/${safePending.length} đơn hợp lệ (<50% & 0 vi phạm)`, 'success');
                    }}
                    title="Tự động duyệt ngay các đơn mà bài thi lần trước dưới 50% điểm và không có vi phạm gian lận"
                  >
                    <IcoSparkles size={13} /> Duyệt nhanh (&lt;50% &amp; 0 vi phạm)
                  </button>
                  <button
                    type="button"
                    className="vt-btn sm danger"
                    disabled={selectedRetryIds.size === 0 || bulkRetryBusy}
                    onClick={() => handleBulkRetryAction('deny')}
                  >
                    Từ chối hàng loạt ({selectedRetryIds.size})
                  </button>
                </div>
              </div>
            )}

            {filteredRetries.length === 0 ? (
              <div className="vt-empty">
                <span><IcoBell size={30} /></span>
                <h3>Không có yêu cầu nào</h3>
                <p>Khi học sinh gửi đơn xin thi lại, yêu cầu sẽ xuất hiện tại đây để bạn duyệt hoặc từ chối.</p>
              </div>
            ) : (
              <div className="vt-stackcards">
                {filteredRetries.map((r) => {
                  const exam = exams.find((e) => e.id === r.examId);
                  const cls = classById[r.classId];
                  const isActing = retryActioning === r.id;
                  const isPending = r.status === 'pending';
                  const prevSub = (submissionsMap[r.examId] || []).find(
                    (s) => s.studentId === r.studentId || s.studentName === r.studentName
                  );
                  return (
                    <article key={r.id} className="vt-card">
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {isPending && (
                          <input
                            type="checkbox"
                            aria-label={`Chọn yêu cầu của ${r.studentName}`}
                            checked={selectedRetryIds.has(r.id)}
                            onChange={() => toggleSelectOne(r.id)}
                            style={{ marginTop: '0.85rem', width: 17, height: 17, cursor: 'pointer' }}
                          />
                        )}
                        <MemoAvatar name={r.studentName} size={48} />
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, font: '800 1.05rem var(--sans)', letterSpacing: '-.02em' }}>
                              {r.studentName}
                            </h3>
                            <span className={'vt-chip ' + (isPending ? 'soon' : r.status === 'approved' ? 'ready' : 'closed')}>
                              {isPending ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                            </span>
                            {prevSub && (
                              <span
                                className="vt-chip"
                                style={{
                                  background: (prevSub.violationCount || 0) > 0 ? 'rgba(239, 68, 68, 0.14)' : 'rgba(14, 165, 233, 0.14)',
                                  color: (prevSub.violationCount || 0) > 0 ? '#ef4444' : '#38bdf8',
                                  fontWeight: 700,
                                }}
                              >
                                Lần trước: {prevSub.score}/{prevSub.totalPoints} ({Math.round(pctOf(prevSub))}%) · {prevSub.violationCount || 0} vi phạm
                                {prevSub.timeTaken ? ` · ${Math.max(1, Math.round(prevSub.timeTaken / 60))} phút` : ''}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '.2rem 0 0', color: 'var(--mut)', font: '500 .82rem var(--sans)' }}>
                            Lớp {cls?.name || '—'} · Đề {exam?.title || '—'}
                          </p>
                          {r.reason && (
                            <p style={{
                              margin: '.7rem 0 0',
                              padding: '.6rem .9rem',
                              borderRadius: 10,
                              background: 'var(--vt-tint)',
                              color: 'var(--ink)',
                              font: '500 .85rem/1.5 var(--sans)',
                            }}>
                              Lý do xin thi lại: “{r.reason}”
                            </p>
                          )}
                          <p style={{ margin: '.5rem 0 0', color: 'var(--mut)', font: '500 .74rem var(--sans)' }}>
                            Gửi cách đây {Math.max(1, Math.round((Date.now() - (r.requestedAtMs || tsMs(r.requestedAt))) / 60000))} phút
                            {r.note ? ` · Phản hồi GV: “${r.note}”` : ''}
                          </p>

                          {isPending && (
                            <input
                              type="text"
                              placeholder="Lý do duyệt / từ chối gửi học sinh (không bắt buộc)"
                              value={retryNotes[r.id] || ''}
                              onChange={(e) => setRetryNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              maxLength={200}
                              disabled={isActing}
                              style={{
                                marginTop: '.7rem',
                                width: '100%',
                                padding: '.55rem .85rem',
                                borderRadius: 10,
                                border: '1.5px solid var(--soft)',
                                background: 'var(--vt-tint)',
                                color: 'var(--ink)',
                                font: '500 .82rem var(--sans)',
                                outline: 0,
                              }}
                            />
                          )}
                        </div>
                        {isPending && (
                          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                            <button
                              type="button"
                              className="vt-btn primary"
                              onClick={() => handleApproveRetry(r)}
                              disabled={isActing}
                            >
                              <IcoCheckCircle size={14} /> {isActing ? 'Đang xử lý...' : 'Duyệt'}
                            </button>
                            <button
                              type="button"
                              className="vt-btn danger"
                              onClick={() => handleDenyRetry(r)}
                              disabled={isActing}
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        );
      })()}

      {/* ============================================================
          TẠO ĐỀ (AUTOEXAM AI STUDIO)
         ============================================================ */}
      {section === 'create' && (
        <>
          {renderExamHubNav()}
          <ErrorBoundary>
            <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải AI Studio...</p></div>}>
              {extCreate && extClass && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem',
                  flexWrap: 'wrap', margin: '0 0 0.6rem', padding: '0.5rem 0.75rem', borderRadius: 12,
                  border: '1px solid rgba(37, 99, 235, 0.35)', background: 'rgba(37, 99, 235, 0.08)',
                  fontSize: '0.82rem', color: 'var(--ink)',
                }}>
                  <span>
                    Đang giao đề cho lớp <b>{extClass.name || extClass.id}</b>
                    {extClass.teacherName ? <> · GV chủ nhiệm: <b>{extClass.teacherName}</b></> : null}
                  </span>
                  <button
                    type="button"
                    className="vt-btn sm"
                    onClick={() => { setExtCreate(false); setExtClass(null); goSection('overview'); }}
                  >
                    Huỷ
                  </button>
                </div>
              )}
              <CreateExamPage
                /* Giáo viên bộ môn / chủ nhiệm: hỗ trợ cả lớp chủ nhiệm và lớp đã liên kết */
                classInfo={extCreate && extClass ? extClass : (selectedClass || classes[0] || linkedClasses[0])}
                classes={extCreate && extClass ? [extClass] : (linkedClasses.length ? [...classes, ...linkedClasses] : classes)}
                classInsights={classInsights}
                initialPreset={aiPreset}
                grades={[]}
                subjects={[]}
                onDone={async (createdExam) => {
                  subsCacheRef.current = {};
                  if (createdExam?.id) {
                    setExams((prev) => {
                      if (prev.some((x) => x.id === createdExam.id)) return prev;
                      return [createdExam, ...prev];
                    });
                  }
                  // Chuyển ngay lập tức sang Kho Đề thi (Realtime UI phản hồi lập tức)
                  setSelectedClass(null);
                  setExtClass(null);
                  setExtCreate(false);
                  setAiPreset(null);
                  goSection('exams');

                  if (extCreate && extClass) {
                    /* Báo cho chủ nhiệm: có đề mới trong lớp của họ */
                    notifyClassOwner({
                      type: 'exam_assigned',
                      toUid: extClass.teacherId,
                      actorId: user.uid,
                      actorName: user.displayName || user.email || 'Giáo viên',
                      classId: extClass.id,
                      className: extClass.name,
                      subject: createdExam?.subject || extClass.subject || '',
                      title: createdExam?.title || 'Đề mới',
                      body: `vừa giao đề “${createdExam?.title || 'Đề mới'}” cho lớp ${extClass.name || ''}.`,
                      tab: 'exams',
                    }).catch(() => {});
                    say(`Đã giao đề cho lớp ${extClass.name || ''}`.trim(), 'success');
                  }
                  // Đồng bộ nền, không chặn giao diện và không đè mất đề vừa tạo
                  refresh().catch(() => {});
                }}
                onCancel={() => {
                  setSelectedClass(null);
                  setExtClass(null);
                  setExtCreate(false);
                  setAiPreset(null);
                  goSection('overview');
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </>
      )}

      {/* ============ MODAL CHI TIẾT ĐỀ THI ("ẤN VÀO LÀ HIỆN RA") ============ */}
      {detailExamModal && (() => {
        const ex = detailExamModal;
        const cls = classById[ex.classId];
        const subs = submissionsMap[ex.id] || [];
        const pcts = subs.map(pctOf);
        const avg = subs.length ? Math.round(avgOf(pcts)) : null;
        const best = subs.length ? Math.round(Math.max(...pcts)) : null;
        const link = `${window.location.origin}${window.location.pathname}#exam/${ex.token}`;
        const memberCount = cls?.members?.length || 0;
        const subject = detectExamSubject(ex) || cls?.subject || '—';
        const isPublic = ex.visibility === 'public';
        const liveSession = sessions.find((s) => s.examId === ex.id && s.status === 'live');
        const liveDoingCount = liveSession
          ? Math.max(0, (liveSession.stats?.joined || 0) - (liveSession.stats?.submitted || 0))
          : 0;

        return (
          <Modal
            title={`Chi tiết đề thi: ${ex.title}`}
            size="lg"
            onClose={() => setDetailExamModal(null)}
            foot={
              <>
                <button
                  type="button"
                  className="vt-btn"
                  onClick={() => setDetailExamModal(null)}
                >
                  Đóng
                </button>
                {liveSession ? (
                  <button
                    type="button"
                    className="vt-btn primary"
                    onClick={() => { setDetailExamModal(null); setViewingSessionId(liveSession.id); }}
                  >
                    <IcoVideo size={14} /> Giám sát phòng LIVE ({liveDoingCount})
                  </button>
                ) : (
                  <button
                    type="button"
                    className="vt-btn primary"
                    onClick={() => { setDetailExamModal(null); handleStartSession(ex); }}
                    disabled={startingId === ex.id}
                  >
                    <IcoPlay size={14} /> Mở phòng thi ngay
                  </button>
                )}
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* 2 thẻ lớn: Link & Cấu hình + Tình hình nộp bài */}
              <div className="vt-edm-grid">
                <div className="vt-edm-card">
                  <h4 className="vt-edm-card-title">
                    <IcoBook size={14} /> Link làm bài &amp; Thông tin đề
                  </h4>
                  <div className="vt-edm-link-row">
                    <input
                      type="text"
                      readOnly
                      value={link}
                      className="vt-edm-link-input"
                      title={link}
                    />
                    <button
                      type="button"
                      className="vt-btn sm primary"
                      onClick={() => copyText(link, ex.id, 'Đã sao chép liên kết đề!')}
                    >
                      {copiedKey === ex.id ? <><IcoCheckCircle size={14} /> Đã chép</> : <><IcoCopy size={14} /> Chép link</>}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--mut)' }}>
                    <span>Lớp: <b style={{ color: 'var(--ink)' }}>{cls?.name || '—'}</b></span>
                    <span>•</span>
                    <span>Môn: <b style={{ color: 'var(--ink)' }}>{subject}</b></span>
                    <span>•</span>
                    <span>{(ex.questions || []).length} câu</span>
                    <span>•</span>
                    <span>{ex.duration} phút</span>
                    <span>•</span>
                    <button
                      type="button"
                      className="vt-chip"
                      style={{ cursor: 'pointer', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => toggleVisibility(ex)}
                      title="Bấm để chuyển đổi giữa Riêng tư và Công khai"
                    >
                      {isPublic ? <><IcoGlobe size={12} /> Công khai</> : <><IcoLock size={12} /> Riêng tư</>}
                    </button>
                  </div>
                </div>

                <div className="vt-edm-card">
                  <h4 className="vt-edm-card-title">
                    <IcoChart size={14} /> Tình hình nộp bài
                  </h4>
                  <div className="vt-edm-stats-row">
                    <Donut value={memberCount ? subs.length : 0} max={memberCount || 1} size={64} stroke={7}>
                      <strong className="sm">{subs.length}</strong>
                    </Donut>
                    <div className="vt-edm-stats-stat">
                      <b>{subs.length} <small style={{ fontSize: '0.8rem', fontWeight: 600 }}>/{memberCount || '?'} HS</small></b>
                      <small>đã nộp bài</small>
                    </div>
                    <div className="vt-edm-stats-stat">
                      <b>{avg == null ? '—' : `${avg}%`}</b>
                      <small>điểm TB</small>
                    </div>
                    <div className="vt-edm-stats-stat">
                      <b>{best == null ? '—' : `${best}%`}</b>
                      <small>cao nhất</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lưới công cụ thao tác */}
              <div>
                <h4 style={{ margin: '0 0 0.65rem', fontSize: '0.84rem', fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Công cụ &amp; Thao tác
                </h4>
                <div className="vt-edm-tools-grid">
                  <button
                    type="button"
                    className="vt-edm-tool-btn"
                    onClick={() => { setDetailExamModal(null); setPreviewExam(ex); }}
                    title="Mô phỏng thi, in đề A4 và đảo mã đề"
                  >
                    <IcoEye size={15} /> Xem trước &amp; In A4
                  </button>
                  <button
                    type="button"
                    className="vt-edm-tool-btn"
                    onClick={() => {
                      setDetailExamModal(null);
                      setWordEditorExam(ex);
                      setWordEditorOpen(true);
                    }}
                    title="Mở trong trình soạn thảo Word Office 365 (Casual Docs)"
                  >
                    <IcoFileDoc size={15} /> Mở trong Word Office 365
                  </button>
                  <button
                    type="button"
                    className="vt-edm-tool-btn"
                    onClick={() => { setDetailExamModal(null); setEditingExam(ex); }}
                    title="Chỉnh sửa nội dung câu hỏi, đáp án, cấu hình thi"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
                    Chỉnh sửa đề
                  </button>
                  <button
                    type="button"
                    className="vt-edm-tool-btn"
                    onClick={() => { setDetailExamModal(null); openScheduleModal(ex); }}
                    title="Đặt lịch giờ mở đề và đóng đề tự động"
                  >
                    <IcoCalendar size={15} /> Đặt lịch mở/đóng
                  </button>
                  <button
                    type="button"
                    className="vt-edm-tool-btn"
                    onClick={() => { setDetailExamModal(null); handleDuplicateExam(ex); }}
                    title="Nhân bản đề thi này thành bản sao mới"
                  >
                    <IcoCopy size={15} /> Nhân bản đề
                  </button>
                  {(classes.length + linkedClasses.length) > 1 && (
                    <button
                      type="button"
                      className="vt-edm-tool-btn"
                      onClick={() => {
                        const allTargets = [...classes, ...linkedClasses];
                        const defaultCls = allTargets.find((c) => c.id !== ex.classId) || allTargets[0];
                        setCopyTargetClassId(defaultCls?.id || '');
                        setCopyExamTarget(ex);
                        setDetailExamModal(null);
                      }}
                      title="Giao đề thi này sang một lớp khác"
                    >
                      <IcoSend size={15} /> Giao lớp khác
                    </button>
                  )}
                  <button
                    type="button"
                    className="vt-edm-tool-btn"
                    onClick={() => { setDetailExamModal(null); setSelectedExam(ex); }}
                    title="Bảng điểm chi tiết & phân tích phổ điểm từng học sinh"
                  >
                    <IcoChart size={15} /> Thống kê chi tiết
                  </button>
                  <button
                    type="button"
                    className="vt-edm-tool-btn"
                    onClick={() => (subs.length ? exportExamCsv(ex, subs) : say('Chưa có bài nộp để xuất CSV', 'error'))}
                    title="Xuất bảng điểm ra file CSV"
                  >
                    <IcoDownload size={15} /> Xuất điểm CSV
                  </button>
                  <button
                    type="button"
                    className="vt-edm-tool-btn danger"
                    onClick={() => { setDetailExamModal(null); handleDeleteExam(ex); }}
                    title="Xóa vĩnh viễn đề thi này"
                  >
                    <IcoTrash size={15} /> Xóa đề thi
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ============ MODAL ĐẶT LỊCH ĐỀ THI (MỤC D4) ============ */}
      {scheduleExamModal && (
        <Modal
          title={`Đặt lịch mở/đóng đề: ${scheduleExamModal.title}`}
          size="sm"
          onClose={() => setScheduleExamModal(null)}
          foot={
            <>
              {(scheduleForm.opensAt || scheduleForm.closesAt) && (
                <button
                  type="button"
                  className="vt-btn danger"
                  onClick={() => setScheduleForm({ opensAt: '', closesAt: '' })}
                  disabled={scheduleSaving}
                >
                  Xóa lịch
                </button>
              )}
              <button type="button" className="vt-btn" onClick={() => setScheduleExamModal(null)} disabled={scheduleSaving}>
                Hủy
              </button>
              <button type="button" className="vt-btn primary" onClick={handleSaveSchedule} disabled={scheduleSaving}>
                <IcoCheckCircle size={14} /> {scheduleSaving ? 'Đang lưu...' : 'Lưu lịch thi'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p className="vt-muted" style={{ margin: 0 }}>
              Thiết lập khung giờ tự động mở đề và đóng đề cho học sinh. Để trống nếu muốn mở tự do.
            </p>
            <label className="vt-field">
              <span>Thời điểm mở đề (Học sinh bắt đầu vào làm được)</span>
              <input
                type="datetime-local"
                value={scheduleForm.opensAt}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, opensAt: e.target.value }))}
              />
            </label>
            <label className="vt-field">
              <span>Thời điểm đóng đề (Hạn chót nộp bài)</span>
              <input
                type="datetime-local"
                value={scheduleForm.closesAt}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, closesAt: e.target.value }))}
              />
            </label>
          </div>
        </Modal>
      )}

      {/* ============ TOAST KÈM NÚT HOÀN TÁC (MỤC B) ============ */}
      {toast && (
        <div
          className={'vt-toast' + (toastTone === 'error' ? ' error' : toastTone === 'success' ? ' success' : '')}
          role="status"
          aria-live="polite"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <span>{toast}</span>
          {toastUndo && (
            <button
              type="button"
              onClick={async () => {
                const fn = toastUndo.onUndo;
                setToast(null);
                setToastUndo(null);
                clearTimeout(toastTimer.current);
                await fn?.();
              }}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {toastUndo.label || 'Hoàn tác'}
            </button>
          )}
        </div>
      )}

      {/* ============ TẠO LỚP ============ */}
      {showCreateClass && (
        <Modal
          title="Tạo lớp mới"
          size="sm"
          onClose={() => setShowCreateClass(false)}
          foot={
            <>
              <button type="button" className="vt-btn" onClick={() => setShowCreateClass(false)}>Hủy</button>
              <button
                type="button"
                className="vt-btn primary"
                onClick={handleCreateClass}
                disabled={!newClassName.trim()}
              >
                <IcoCheckCircle size={14} /> Tạo lớp
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="vt-field">
              <span>Tên lớp</span>
              <input
                autoFocus
                placeholder="VD: 12A1 — Chuyên Hóa"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
                maxLength={32}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <label className="vt-field">
                <span>Môn học chính</span>
                <select
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                >
                  {['Hóa học', 'Toán', 'Vật lý', 'Sinh học', 'Tiếng Anh', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tin học', 'GDKT & PL'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="vt-field">
                <span>Khối lớp</span>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                >
                  {['12', '11', '10', '9', '8', '7', '6'].map((g) => (
                    <option key={g} value={g}>Khối {g}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="vt-muted" style={{ margin: 0 }}>
              Sau khi tạo, hệ thống sẽ cấp mã lớp và mã QR để học sinh tham gia. Môn và khối lớp sẽ được tự động điền khi bạn tạo đề cho lớp này.
            </p>
          </div>
        </Modal>
      )}

      {/* ============ GIAO ĐỀ CÓ SẴN SANG LỚP KHÁC ============ */}
      {copyExamTarget && (
        <Modal
          title={`Giao đề sang lớp khác: ${copyExamTarget.title}`}
          size="sm"
          onClose={() => setCopyExamTarget(null)}
          foot={
            <>
              <button type="button" className="vt-btn" onClick={() => setCopyExamTarget(null)} disabled={copyExamBusy}>
                Hủy
              </button>
              <button
                type="button"
                className="vt-btn primary"
                onClick={handleCopyExamToClass}
                disabled={!copyTargetClassId || copyExamBusy}
              >
                <IcoSend size={14} /> {copyExamBusy ? 'Đang giao...' : 'Giao đề ngay'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="vt-muted" style={{ margin: 0 }}>
              Chọn lớp chủ nhiệm hoặc lớp liên kết mà bạn muốn giao bản sao của đề <b>{copyExamTarget.title}</b> ({(copyExamTarget.questions || []).length} câu · {copyExamTarget.duration} phút):
            </p>
            <label className="vt-field">
              <span>Chọn lớp nhận đề</span>
              <select
                value={copyTargetClassId}
                onChange={(e) => setCopyTargetClassId(e.target.value)}
              >
                {[...classes, ...linkedClasses].map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c._linked ? `(Lớp liên kết · Môn ${c._mySubject || 'GVBM'})` : `(${c.members?.length || 0} HS)`}
                    {c.id === copyExamTarget.classId ? ' — Lớp hiện tại' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      )}

      {/* ============ CHỌN LỚP ĐỂ TẠO ĐỀ ============ */}
      {showClassPicker && (
        <Modal title="Tạo đề cho lớp nào?" size="sm" onClose={() => setShowClassPicker(false)}>
          <ul className="vt-group picker">
            {classes.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setShowClassPicker(false);
                    setSelectedClass(c);
                    goSection('create');
                  }}
                >
                  <MemoAvatar name={c.name} size={44} />
                  <div><b>{c.name}</b><small>{c.members?.length || 0} học sinh</small></div>
                  <IcoChevronRight size={14} />
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* ============ THÔNG BÁO (chuông) ============ */}
      {bellOpen && (
        <Modal title="Thông báo" size="md" onClose={() => setBellOpen(false)}>
          {noticesErr && <p className="st-error">{noticesErr}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--mut)' }}>
              {unreadNotices} chưa đọc · {notices.length} thông báo
            </span>
            {unreadNotices > 0 && (
              <button
                type="button"
                className="vt-btn sm"
                onClick={async () => {
                  try { await markAllNoticesRead(notices); } catch { /* bỏ qua */ }
                }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {notices.length === 0 ? (
            <p className="st-empty">
              Chưa có thông báo nào. Khi giáo viên bộ môn liên kết hoặc giao đề, thông báo sẽ hiện ở đây.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '55vh', overflowY: 'auto' }}>
              {[...noticeGroups.unread, ...noticeGroups.read].map((n) => (
                <li
                  key={n.id}
                  style={{
                    border: '1px solid var(--soft)',
                    borderRadius: 12,
                    padding: '0.55rem 0.7rem',
                    background: n.read ? 'transparent' : 'rgba(37, 99, 235, 0.07)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
                    <b style={{ fontSize: '0.84rem' }}>{n.title || 'Thông báo'}</b>
                    <small style={{ color: 'var(--mut)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      {n.createdAtMs
                        ? new Date(n.createdAtMs).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })
                        : ''}
                    </small>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', lineHeight: 1.45 }}>
                    {noticeSummary(n)}
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <button type="button" className="vt-btn sm primary" onClick={() => openNotice(n)}>Mở lớp</button>
                    {!n.read && (
                      <button
                        type="button"
                        className="vt-btn sm"
                        onClick={async () => {
                          try { await markNoticeRead(n.id); } catch { /* bỏ qua */ }
                        }}
                      >
                        Đã đọc
                      </button>
                    )}
                    <button
                      type="button"
                      className="vt-btn sm"
                      onClick={async () => {
                        try { await deleteNotice(n.id); } catch { /* bỏ qua */ }
                      }}
                    >
                      Xoá
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {(liveSessions.length > 0 || totalPendingRetry > 0 || totalPendingMembers > 0) && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid var(--soft)' }}>
              {liveSessions.length > 0 && (
                <button type="button" className="vt-btn sm" onClick={() => { setBellOpen(false); goSection('sessions'); }}>
                  {liveSessions.length} phòng thi đang mở
                </button>
              )}
              {totalPendingRetry > 0 && (
                <button type="button" className="vt-btn sm" onClick={() => { setBellOpen(false); goSection('retry'); }}>
                  {totalPendingRetry} đơn xin thi lại
                </button>
              )}
              {totalPendingMembers > 0 && (
                <button type="button" className="vt-btn sm" onClick={() => { setBellOpen(false); goSection('classes'); }}>
                  {totalPendingMembers} thành viên chờ duyệt
                </button>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ============ CHI TIẾT LỚP ============ */}
      {selectedClass && !showExamCreate && section !== 'create' && (
        <ClassDetailModal
          classInfo={selectedClass}
          initialTab={detailTab}
          exams={exams.filter((e) => e.classId === selectedClass.id)}
          onClose={() => { setSelectedClass(null); setDetailTab('overview'); }}
          onExportCsv={exportClassCsv}
          onOpenExam={(examId) => {
            setSelectedClass(null);
            const ex = exams.find((e) => e.id === examId);
            if (ex) setSelectedExam(ex);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onApproveAll={handleApproveAll}
          onToggleApproval={handleToggleApproval}
          onRemoveMember={handleRemoveMember}
          retryRequests={retryRequestsForClass}
          allowances={allowances}
          onRename={handleRenameClass}
          onRegenKey={handleRegenKey}
          onDeleteClass={handleDeleteClass}
          onShareKey={(cls) => setShareClass(cls)}
          onApproveRetry={handleApproveRetry}
          onDenyRetry={handleDenyRetry}
          onToggleAllowance={handleToggleAllowance}
        />
      )}

      {/* ============ MODAL TẠO ĐỀ CŨ ============ */}
      {showExamCreate && selectedClass && (
        <ExamCreate
          classInfo={selectedClass}
          onClose={() => { setShowExamCreate(false); setSelectedClass(null); }}
          onCreated={async () => {
            subsCacheRef.current = {};
            await refresh();
            setShowExamCreate(false);
            setSelectedClass(null);
            say('Đã tạo đề', 'success');
          }}
        />
      )}

      {/* ============ THỐNG KÊ ============ */}
      {selectedExam && (
        <Modal title={`Thống kê: ${selectedExam.title}`} size="lg" onClose={() => setSelectedExam(null)}>
          <ExamStats
            exam={selectedExam}
            subs={submissionsMap[selectedExam.id] || []}
            onExport={(freshSubs) => exportExamCsv(selectedExam, freshSubs || submissionsMap[selectedExam.id] || [])}
          />
        </Modal>
      )}

      {shareClass && (
        <Modal title={`Chia sẻ lớp ${shareClass.name}`} size="sm" onClose={() => setShareClass(null)}>
          <div className="ap-qr-modal">
            <div className="ap-qr-img-box">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(classJoinUrl(shareClass.key))}&margin=1`}
                width={200}
                height={200}
                alt={`QR mã lớp ${shareClass.key}`}
              />
            </div>
            <div className="ap-qr-code-pill">{shareClass.key}</div>
            <p className="vt-muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              Học sinh quét mã QR hoặc nhập mã lớp để tham gia lớp học.
            </p>
            <div className="ap-class-tools" style={{ justifyContent: 'center', width: '100%' }}>
              <button type="button" className="vt-btn sm primary" onClick={() => copyText(shareClass.key, shareClass.id, 'Đã chép mã lớp')}>
                <IcoCopy size={13} /> Chép mã lớp
              </button>
              <button type="button" className="vt-btn sm" onClick={() => copyText(classJoinUrl(shareClass.key), `${shareClass.id}-url`, 'Đã chép liên kết')}>
                Chép link mời
              </button>
              <button type="button" className="vt-btn sm" onClick={() => handleRegenKey(shareClass)}>
                Đổi mã mới
              </button>
            </div>

            <ul className="ap-qr-steps">
              <li><b>1</b> Học sinh mở ELEC AI và vào mục <strong>Lớp học</strong></li>
              <li><b>2</b> Bấm <strong>Vào lớp</strong> và dán mã lớp <strong>{shareClass.key}</strong></li>
              <li><b>3</b> Đợi giáo viên duyệt hoặc bắt đầu làm bài thi trực tiếp</li>
            </ul>
          </div>
        </Modal>
      )}

      {noticeClass && (
        <Modal title={`Ghim thông báo: ${noticeClass.name}`} size="sm" onClose={() => setNoticeClass(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.2rem 0' }}>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--mut)', lineHeight: 1.45 }}>
              Thông báo này sẽ được ghim nổi bật ngay đầu trang "Lớp học của tôi" của toàn bộ học sinh trong lớp {noticeClass.name}.
            </p>
            <textarea
              autoFocus
              rows={4}
              value={noticeDraft}
              onChange={(e) => setNoticeDraft(e.target.value)}
              placeholder="Ví dụ: Nhớ ôn tập chương Este - Lipit trước giờ kiểm tra thứ Năm nhé các em!"
              style={{
                width: '100%',
                padding: '0.75rem 0.9rem',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--panel)',
                color: 'var(--ink)',
                font: '500 0.9rem var(--sans)',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.4rem' }}>
              {noticeClass.announcement?.text && (
                <button
                  type="button"
                  className="vt-btn sm danger"
                  onClick={() => { setNoticeDraft(''); setTimeout(handleSaveNotice, 0); }}
                  disabled={noticeSaving}
                >
                  Gỡ thông báo
                </button>
              )}
              <button type="button" className="vt-btn sm" onClick={() => setNoticeClass(null)} disabled={noticeSaving}>
                Hủy
              </button>
              <button type="button" className="vt-btn sm primary" onClick={handleSaveNotice} disabled={noticeSaving}>
                {noticeSaving ? 'Đang lưu…' : 'Ghim thông báo'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============ CONFIRM ============ */}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        body={confirmState?.body}
        okLabel={confirmState?.okLabel}
        danger={confirmState?.danger}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          const fn = confirmState?.onOk;
          setConfirmState(null);
          fn?.();
        }}
      />

      {/* ============ MODAL XEM TRƯỚC — FIX #1 ============ */}
      {previewExam && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <ExamPreviewSimulator
              exam={normalizeExamForPreview(previewExam)}
              questions={normalizeExamForPreview(previewExam)?.questions || []}
              onClose={() => setPreviewExam(null)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* ❗ MỚI: modal sửa đề (thông tin + câu hỏi + camera/chống gian lận) */}
      {editingExam && (
        <ExamEditModal
          exam={editingExam}
          classes={classes}
          onClose={() => setEditingExam(null)}
          onSaved={(updated) => {
            setExams((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
            say('Đã lưu thay đổi đề thi.');
          }}
        />
      )}

      {/* ============ BẢNG TÌM KIẾM & LỆNH NHANH TOÀN CỤC (CTRL + K) ============ */}
      {cmdOpen && (() => {
        const normVi = (str) => String(str || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/gi, 'd')
          .toLowerCase()
          .trim();
        const kq = normVi(cmdQuery);

        const quickActions = [
          { id: 'act-create-exam', group: 'Lệnh nhanh', title: 'Tạo đề mới cùng AI Studio', sub: 'Phím tắt N · Lập ma trận & sinh câu hỏi tự động', run: () => openNewExam() },
          { id: 'act-create-class', group: 'Lệnh nhanh', title: 'Tạo lớp học mới', sub: 'Tạo mã lớp để học sinh tham gia', run: () => { goSection('classes'); setClassSectionTab('my'); setShowCreateClass(true); } },
          { id: 'act-shuffle', group: 'Lệnh nhanh', title: 'Mở Mô phỏng & Đảo mã đề (4 bước)', sub: 'Đảo 2–8 mã đề, xem song song & in A4', run: () => goSection('simulator') },
          { id: 'act-bank', group: 'Lệnh nhanh', title: 'Mở Ngân hàng câu hỏi 3 vùng', sub: 'Tìm kiếm toàn văn, phát hiện câu trùng & AI giải chi tiết', run: () => goSection('bank') },
          { id: 'act-paper', group: 'Lệnh nhanh', title: 'Chấm phiếu trắc nghiệm A4 bằng Camera/Ảnh', sub: 'Quét phiếu OMR & kiểm tra ô nghi ngờ', run: () => goSection('paper') },
          { id: 'act-export-csv', group: 'Lệnh nhanh', title: 'Xuất bảng điểm tổng hợp toàn bộ lớp (CSV)', sub: `${subsInRange.length} bài nộp trong khoảng đang chọn`, run: () => exportAllCsv() },
          ...navItems.map((it) => ({
            id: `nav-${it.key}`,
            group: `Chuyển trang · ${it.group || 'Điều hướng'}`,
            title: it.label,
            sub: `Mở trang ${it.label}`,
            run: () => {
              if (it.onClick) it.onClick();
              else goSection(it.key);
            },
          })),
        ];

        const classItems = classes.map((c) => ({
          id: `cls-${c.id}`,
          group: 'Lớp học của tôi',
          title: `Lớp ${c.name}`,
          sub: `Mã lớp: ${c.key} · ${c.members?.length || 0} học sinh`,
          run: () => {
            goSection('classes');
            setClassSectionTab('my');
            setSelectedClass(c);
          },
        }));

        const examItems = exams.slice(0, 30).map((ex) => ({
          id: `ex-${ex.id}`,
          group: 'Đề thi',
          title: ex.title || 'Đề kiểm tra',
          sub: `${(ex.questions || []).length} câu · ${ex.duration || 45} phút · Lớp ${classById[ex.classId]?.name || '—'}`,
          run: () => {
            goSection('exams');
            setPreviewExam(ex);
          },
        }));

        const studentItems = classes.flatMap((c) =>
          (c.members || []).map((m) => ({
            id: `stu-${c.id}-${m.id}`,
            group: 'Học sinh',
            title: m.name || 'Học sinh',
            sub: `Lớp ${c.name}${m.email ? ` · ${m.email}` : ''}`,
            run: () => {
              goSection('classes');
              setClassSectionTab('my');
              setSelectedClass(c);
            },
          }))
        );

        const allEntries = [...quickActions, ...classItems, ...examItems, ...studentItems];
        const matched = kq
          ? allEntries.filter((item) => normVi(`${item.title} ${item.sub} ${item.group}`).includes(kq)).slice(0, 18)
          : [...quickActions.slice(0, 8), ...classItems.slice(0, 4), ...examItems.slice(0, 4)];

        const safeIdx = matched.length ? Math.min(cmdIndex, matched.length - 1) : 0;

        return (
          <div
            className="t-cmd-backdrop"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setCmdOpen(false); }}
            role="presentation"
          >
            <div className="t-cmd-modal" role="dialog" aria-modal="true" aria-label="Tìm kiếm và lệnh nhanh">
              <div className="t-cmd-head">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  autoFocus
                  value={cmdQuery}
                  onChange={(e) => {
                    setCmdQuery(e.target.value);
                    setCmdIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setCmdIndex((i) => (matched.length ? (i + 1) % matched.length : 0));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setCmdIndex((i) => (matched.length ? (i - 1 + matched.length) % matched.length : 0));
                    } else if (e.key === 'Enter' && matched[safeIdx]) {
                      e.preventDefault();
                      setCmdOpen(false);
                      matched[safeIdx].run();
                    }
                  }}
                  placeholder="Gõ tên lớp, đề thi, tên học sinh hoặc lệnh nhanh (không cần dấu)..."
                />
                <button
                  type="button"
                  className="vt-btn sm"
                  onClick={() => setCmdOpen(false)}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                >
                  Esc
                </button>
              </div>

              <div className="t-cmd-body">
                {matched.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--t-ink-muted)', fontSize: '0.86rem' }}>
                    Không tìm thấy kết quả nào khớp với “{cmdQuery}”.
                  </div>
                ) : (
                  matched.map((item, idx) => {
                    const prevGroup = idx > 0 ? matched[idx - 1].group : null;
                    return (
                      <div key={item.id}>
                        {item.group !== prevGroup && (
                          <div className="t-cmd-group-title">{item.group}</div>
                        )}
                        <button
                          type="button"
                          className={`t-cmd-item ${idx === safeIdx ? 'selected' : ''}`}
                          onMouseEnter={() => setCmdIndex(idx)}
                          onClick={() => {
                            setCmdOpen(false);
                            item.run();
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--t-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--t-ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.sub}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--t-accent)', flexShrink: 0 }}>
                            Mở ↵
                          </span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="t-cmd-foot">
                <span>↑↓ để di chuyển · Enter để chọn · Esc để đóng</span>
                <span>{classes.length} lớp · {exams.length} đề thi</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================
          MODAL NHẬP ĐỀ THI TỪ FILE WORD / PDF (EXAM IMPORTER V4.0)
          ============================================================ */}
      {importerModalOpen && (
        <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải trình nhập đề...</p></div>}>
          <ExamImporter
            isModal={true}
            classes={classes}
            defaultSubject={classes[0]?.subject || 'Hóa học'}
            defaultGrade={classes[0]?.grade || '12'}
            onClose={() => setImporterModalOpen(false)}
            onSendToMixer={(data) => {
              setImporterModalOpen(false);
              setSimulatorInitialExam(data);
              goSection('simulator');
            }}
            onCreateSoftExam={async (examData) => {
              setImporterModalOpen(false);
              try {
                const created = await createExam({
                  teacherId: user.uid,
                  teacherName: user.displayName || user.email,
                  classId: examData.classId || classes[0]?.id || '',
                  title: examData.title || 'Đề nhập từ file Word',
                  duration: Number(examData.duration) || 45,
                  questions: examData.questions || [],
                  subject: examData.subject || 'Hóa học',
                  grade: examData.grade || '12',
                  shuffle: true,
                  showAnswerAfter: true,
                  source: 'word-importer',
                });
                if (created?.id) {
                  setExams((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
                }
                say('Đã lưu đề vào Kho Đề Lớp thành công!', 'success');
              } catch (e) {
                say(e.message || 'Lỗi lưu đề', 'err');
              }
            }}
          />
        </Suspense>
      )}

      {/* ============================================================
          TRÌNH SOẠN THẢO WORD OFFICE 365 (CASUAL DOCS V1.4.2)
          ============================================================ */}
      {wordEditorOpen && (
        <Suspense fallback={null}>
          <WordDocxEditor
            open={wordEditorOpen}
            onClose={() => setWordEditorOpen(false)}
            initialExam={wordEditorExam || (exams && exams[0]) || null}
            classes={classes}
            onSaveToClass={async (newExam) => {
              try {
                const targetClassId = newExam?.classId || classes[0]?.id || linkedClasses[0]?.id || '';
                const created = await createExam({
                  teacherId: user.uid,
                  teacherName: user.displayName || user.email,
                  classId: targetClassId,
                  title: newExam.title || 'Đề soạn từ Word Office 365',
                  questions: newExam.questions || [],
                  duration: Number(newExam.duration || newExam.timeLimitMinutes) || 45,
                  allowRetake: Boolean(newExam.allowRetake),
                  subject: newExam.subject || 'Hóa học',
                  grade: newExam.grade || '12',
                  source: 'word-editor-365',
                });
                if (created?.id) {
                  setExams((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
                }
                say(`Đã lưu đề "${newExam.title || 'Mới'}" vào kho thành công!`, 'success');
                setWordEditorOpen(false);
              } catch (err) {
                say(err.message || 'Lỗi khi lưu đề thi', 'err');
              }
            }}
            onSay={(msg, type) => say(msg, type === 'error' ? 'err' : 'success')}
          />
        </Suspense>
      )}

      {/* ============================================================
          AI CHATBOT ĐỒNG HÀNH LUÔN HIỆN DIỆN (SÁT THỰC TẾ WEB)
          ============================================================ */}
      <TeacherFloatingChat
        user={user}
        classes={linkedClasses.length ? [...classes, ...linkedClasses] : classes}
        exams={exams}
        submissionsMap={submissionsMap}
        liveSessions={liveSessions}
        activeSection={section}
        activeSubTab={subTab}
        selectedClass={selectedClass}
        selectedExam={detailExamModal || selectedExam}
        viewingSessionId={viewingSessionId}
        wordEditorOpen={wordEditorOpen}
        wordEditorExam={wordEditorExam}
        onOpenSimulator={(simExam) => {
          if (simExam) {
            setSimulatorInitialExam(simExam);
          }
          goSection('simulator');
        }}
        onCreateExam={async (newExam) => {
          try {
            const targetClassId = newExam?.classId || classes[0]?.id || linkedClasses[0]?.id || '';
            const created = await createExam({
              teacherId: user.uid,
              teacherName: user.displayName || user.email,
              classId: targetClassId,
              title: newExam?.title || 'Đề thi từ AI Trợ lý',
              duration: Number(newExam?.duration) || 45,
              questions: newExam?.questions || [],
              subject: newExam?.subject || 'Hóa học',
              grade: newExam?.grade || '12',
              shuffle: true,
              showAnswerAfter: true,
              source: 'ai-assistant',
            });
            if (created?.id) {
              setExams((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
            }
            say(`Đã lưu đề "${newExam.title}" vào Kho Đề Lớp!`, 'success');
            goSection('exams');
          } catch (e) {
            say(e.message || 'Lỗi khi lưu đề', 'err');
          }
        }}
        onOpenImporter={() => setImporterModalOpen(true)}
        onCreateClass={async ({ name, subject, grade }) => {
          try {
            const createdCls = await createClass({
              name: (name || 'Lớp mới').trim(),
              subject: subject || newClassSubject || 'Hóa học',
              grade: String(grade || newClassGrade || '12'),
              teacherId: user.uid,
              teacherName: user.displayName || user.email,
              requireApproval: true,
            });
            if (createdCls?.id) {
              setClasses((prev) => [createdCls, ...prev]);
              say(`Đã tạo thành công lớp ${createdCls.name}!`, 'success');
              refresh().catch(() => {});
            }
            return createdCls;
          } catch (e) {
            say('Lỗi tạo lớp: ' + (e.message || e), 'err');
            return null;
          }
        }}
        onNavigate={(sec) => goSection(sec)}
        onSay={say}
        isOpen={aiChatOpen}
        onToggleOpen={setAiChatOpen}
      />
    </DashFrame>
  );
}

/* ============================================================
   THỐNG KÊ ĐỀ + XEM BÀI LÀM CHI TIẾT TỪNG HỌC SINH
   ============================================================ */
function ExamStats({ exam, subs: initialSubs = [], onExport }) {
  const [subs, setSubs] = useState(initialSubs || []);
  const [loading, setLoading] = useState(!initialSubs || initialSubs.length === 0);
  const [inspectSub, setInspectSub] = useState(null);

  useEffect(() => {
    if (!exam?.id) return;
    setLoading(true);
    const unsub = listenSubmissions(exam.id, (fresh) => {
      setSubs(fresh || []);
      setLoading(false);
    });
    return () => unsub?.();
  }, [exam?.id]);

  const reloadSubmissions = async () => {
    if (!exam?.id) return;
    setLoading(true);
    try {
      const fresh = await getSubmissionsByExam(exam.id);
      setSubs(fresh || []);
    } catch (e) {
      console.warn('[ExamStats] Lỗi tải bài nộp:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && (!subs || subs.length === 0)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="vt-muted">Đang tải danh sách bài nộp...</p>
      </div>
    );
  }

  if (!subs || subs.length === 0) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <p className="vt-muted" style={{ marginBottom: '1rem' }}>Chưa có bài nộp nào cho đề này.</p>
        <button type="button" className="vt-btn sm" onClick={reloadSubmissions}>
          <IcoRefresh size={13} /> Tải lại dữ liệu
        </button>
      </div>
    );
  }

  const sorted = [...subs].sort((a, b) => b.score - a.score);
  const pcts = subs.map(pctOf);
  const avg = Math.round(avgOf(pcts));
  const bins = [0, 0, 0, 0, 0];
  pcts.forEach((p) => { bins[Math.min(4, Math.floor(p / 20))] += 1; });
  const maxBin = Math.max(...bins, 1);

  const perQ = (exam.questions || []).map((qq, i) => {
    const rated = subs.filter((s) => s.detail?.[i]);
    if (!rated.length) return { i, text: qq.q, type: qq.type || 'single_choice', rate: null };
    const maxPts = Number(qq.points) > 0 ? Number(qq.points) : 1;
    let totalRatio = 0;
    rated.forEach((s) => {
      const d = s.detail[i] || {};
      if ((qq.type || 'single_choice') === 'true_false') {
        const earned = typeof d.earned === 'number' ? d.earned : (d.isCorrect ? maxPts : 0);
        totalRatio += Math.min(1, Math.max(0, earned / maxPts));
      } else {
        totalRatio += d.isCorrect ? 1 : 0;
      }
    });
    return { i, text: qq.q, type: qq.type || 'single_choice', rate: Math.round((totalRatio / rated.length) * 100) };
  }).filter((x) => x.rate != null);
  const hardest = [...perQ].sort((a, b) => a.rate - b.rate).slice(0, 5);

  const flagged = subs.filter((s) => (s.violationCount || 0) > 0 || s.autoSubmitted);

  if (inspectSub) {
    const questions = exam.questions || [];
    const detail = inspectSub.detail || [];
    return (
      <div className="vt-stats">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingBottom: '0.6rem', borderBottom: '1px solid var(--soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <MemoAvatar name={inspectSub.studentName} size={40} />
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Bài làm của {inspectSub.studentName}</h4>
              <small style={{ color: 'var(--mut)' }}>
                Điểm: <b>{inspectSub.score}/{inspectSub.totalPoints}</b> ({Math.round(pctOf(inspectSub))}%) · Đúng {inspectSub.correctCount}/{inspectSub.totalQuestions} câu · {inspectSub.violationCount || 0} vi phạm
              </small>
            </div>
          </div>
          <button type="button" className="vt-btn sm" onClick={() => setInspectSub(null)}>
            ← Quay lại bảng thống kê
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '58vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {questions.map((q, idx) => {
            const d = detail[idx] || {};
            const isOk = !!d.isCorrect;
            const type = q.type || 'single_choice';
            return (
              <div
                key={idx}
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: 12,
                  border: `1px solid ${isOk ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                  background: isOk ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 700 }}>
                  <span>
                    Câu {idx + 1} ({type === 'true_false' ? 'Đúng/Sai 4 ý' : type === 'short_answer' ? 'Trả lời ngắn' : 'Trắc nghiệm'})
                  </span>
                  <span style={{ color: isOk ? '#10b981' : '#ef4444' }}>
                    {isOk ? '✓ Chính xác' : '✕ Sai / Chưa trọn vẹn'} ({d.earned ?? (isOk ? (q.points || 1) : 0)}/{q.points || 1} đ)
                  </span>
                </div>
                <p style={{ margin: '0 0 0.45rem', fontSize: '0.86rem', fontWeight: 600 }}>{q.q}</p>
                {type === 'single_choice' && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--mut)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>HS chọn: <b style={{ color: isOk ? '#10b981' : '#ef4444' }}>{d.picked != null ? `${String.fromCharCode(65 + Number(d.picked))}. ${q.options?.[d.picked] || ''}` : 'Bỏ trống'}</b></span>
                    <span>Đáp án đúng: <b style={{ color: '#10b981' }}>{String.fromCharCode(65 + Number(q.correct || 0))}. {q.options?.[q.correct || 0] || ''}</b></span>
                  </div>
                )}
                {type === 'short_answer' && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--mut)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>HS điền: <b style={{ color: isOk ? '#10b981' : '#ef4444' }}>{d.answerText || d.picked || 'Bỏ trống'}</b></span>
                    <span>Đáp án chuẩn: <b style={{ color: '#10b981' }}>{q.answer}</b></span>
                  </div>
                )}
                {type === 'true_false' && Array.isArray(q.statements) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.35rem', fontSize: '0.78rem' }}>
                    {q.statements.map((st, si) => {
                      const pickedVal = d.picked?.[st.key] ?? d.picked?.[si];
                      const match = pickedVal === st.correct;
                      return (
                        <div key={st.key || si} style={{ padding: '0.3rem 0.5rem', borderRadius: 8, background: 'rgba(15,23,42,0.2)' }}>
                          <b>{st.key || String.fromCharCode(97 + si)})</b> {st.text}{' '}
                          <span style={{ color: match ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                            [HS: {pickedVal === true ? 'Đ' : pickedVal === false ? 'S' : '—'} | Chuẩn: {st.correct ? 'Đ' : 'S'}]
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="vt-stats">
      <div className="vt-stat-tiles">
        <div><b>{subs.length}</b><span>bài nộp</span></div>
        <div><b>{avg}%</b><span>điểm TB</span></div>
        <div><b>{Math.round(Math.max(...pcts))}%</b><span>cao nhất</span></div>
        <div><b>{Math.round(Math.min(...pcts))}%</b><span>thấp nhất</span></div>
      </div>

      <section>
        <h4>Phổ điểm</h4>
        <div className="vt-hist">
          {bins.map((n, i) => (
            <div key={i} className="vt-hist-col">
              <span className="vt-hist-n">{n}</span>
              <i style={{ height: `${Math.max(6, (n / maxBin) * 100)}%` }} />
              <small>{i * 20}-{i === 4 ? 100 : i * 20 + 19}%</small>
            </div>
          ))}
        </div>
      </section>

      {hardest.length > 0 && (
        <section>
          <h4>Câu sai nhiều nhất</h4>
          <ul className="vt-hard">
            {hardest.map((h) => (
              <li key={h.i}>
                <span className="vt-hard-n">Câu {h.i + 1}</span>
                <p title={h.text}>{h.text}</p>
                <div className="vt-bar">
                  <i style={{ width: `${h.rate}%` }} className={h.rate < 40 ? 'low' : ''} />
                </div>
                <b>{h.rate}% đúng</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      {flagged.length > 0 && (
        <section>
          <h4><IcoAlert size={14} /> Cần xem lại ({flagged.length}) — Bấm vào HS để xem bài làm</h4>
          <ul className="vt-flag">
            {flagged.map((s) => (
              <li key={s.id} onClick={() => setInspectSub(s)} style={{ cursor: 'pointer' }} title="Bấm để xem chi tiết từng câu của học sinh này">
                <MemoAvatar name={s.studentName} size={30} />
                <b>{s.studentName}</b>
                <span>{s.violationCount || 0} vi phạm{s.autoSubmitted ? ' · tự động nộp' : ''} · Xem bài →</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <header className="vt-card-head">
          <h4>Bảng xếp hạng (Bấm vào học sinh để xem bài làm chi tiết)</h4>
          <button type="button" className="vt-btn sm" onClick={() => onExport?.(subs)}>
            <IcoDownload size={13} /> Xuất CSV
          </button>
        </header>
        <ol className="vt-rank">
          {sorted.map((s, i) => (
            <li key={s.id} onClick={() => setInspectSub(s)} style={{ cursor: 'pointer' }} title="Bấm để xem bài làm chi tiết từng câu">
              <span className={'vt-rank-n r' + (i < 3 ? i + 1 : 0)}>{i + 1}</span>
              <MemoAvatar name={s.studentName} size={32} />
              <b>{s.studentName}</b>
              <small>{s.correctCount}/{s.totalQuestions} đúng · Xem bài →</small>
              <span className="vt-rank-score">{s.score}/{s.totalPoints}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}