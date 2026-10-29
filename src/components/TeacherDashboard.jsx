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
  getSubmissionsByExam,
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
const pctOf = (s) => (s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0);
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
   MAIN
   ============================================================ */
export default function TeacherDashboard({ onExit } = {}) {
  const { user } = useAuth();



  const [section, setSection] = useState('overview');
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

  const [confirmState, setConfirmState] = useState(null);
  const [toast, setToast] = useState(null);
  const [toastTone, setToastTone] = useState('info');
  const [toastUndo, setToastUndo] = useState(null);
  const [startingId, setStartingId] = useState(null);

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
      setClasses(cls);
      setExams(ex);
      setSessions(sess);

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

      const priorityExams = ex.slice(0, 8);
      const subsMap = { ...subsCacheRef.current };
      await Promise.all(priorityExams.map(async (e) => {
        if (!subsMap[e.id]) {
          try {
            const s = await getSubmissionsByExam(e.id);
            subsMap[e.id] = s;
            subsCacheRef.current[e.id] = s;
          } catch {
            subsMap[e.id] = [];
          }
        }
      }));
      setSubmissionsMap({ ...subsMap });

      if (ex.length > 8) {
        const remaining = ex.slice(8);
        Promise.all(remaining.map(async (e) => {
          if (!subsCacheRef.current[e.id]) {
            try {
              const s = await getSubmissionsByExam(e.id);
              subsCacheRef.current[e.id] = s;
              return { id: e.id, subs: s };
            } catch {
              return { id: e.id, subs: [] };
            }
          }
          return { id: e.id, subs: subsCacheRef.current[e.id] };
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

  /* Realtime sessions */
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
      await createClass({
        name: newClassName.trim(),
        subject: newClassSubject,
        grade: newClassGrade,
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        requireApproval: true,
      });
      setNewClassName('');
      setShowCreateClass(false);
      await refresh();
      say(`Đã tạo lớp ${newClassName.trim()} (${newClassSubject} · Khối ${newClassGrade})`, 'success');
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
      const session = await createExamSession({
        examId: exam.id,
        examToken: exam.token,
        classId: exam.classId,
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        title: exam.title,
        duration: exam.duration,
      });
      setSessions((prev) => [session, ...prev]);
      say('Đã bắt đầu phòng thi!', 'success');
      goSection('sessions');
    } catch (e) {
      say('Không tạo được phòng thi: ' + e.message, 'error');
    } finally {
      setStartingId(null);
    }
  }, [user, say]);

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
     NAV ITEMS — PHÂN NHÓM 4 NGHIỆP VỤ RÕ RÀNG
     ============================================================ */
  const navItems = [
    /* Nhóm 1: Quản lý lớp */
    { key: 'overview', shortLabel: 'Tổng quan', label: 'Tổng quan', Icon: IcoGrid, group: 'Quản lý lớp' },
    {
      key: 'classes',
      shortLabel: 'Lớp học',
      label: 'Lớp học & Liên kết',
      Icon: IcoUsers,
      badge: totalPendingMembers > 0 ? totalPendingMembers : null,
      live: totalPendingMembers > 0,
      group: 'Quản lý lớp',
    },
    { key: 'analytics', shortLabel: 'Số liệu', label: 'Số liệu lớp', Icon: IcoChart, group: 'Quản lý lớp' },

    /* Nhóm 2: Biên soạn & Kho đề */
    { key: 'create', shortLabel: 'AI Tạo đề', label: 'AI Tạo đề', Icon: IcoSparkles, group: 'Biên soạn & Kho đề' },
    { key: 'bank', shortLabel: 'Ngân hàng', label: 'Ngân hàng câu hỏi', Icon: IcoLibrary, group: 'Biên soạn & Kho đề' },
    { key: 'exams', shortLabel: 'Đề thi', label: 'Kho đề thi', Icon: IcoBook, group: 'Biên soạn & Kho đề' },
    { key: 'simulator', shortLabel: 'Đảo đề', label: 'Mô phỏng & Đảo đề', Icon: IcoShuffle, group: 'Biên soạn & Kho đề' },

    /* Nhóm 3: Tổ chức thi & Chấm */
    {
      key: 'sessions',
      shortLabel: 'Phòng thi',
      label: 'Phòng thi LIVE',
      Icon: IcoVideo,
      badge: liveSessions.length || null,
      live: true,
      group: 'Tổ chức thi & Chấm',
    },
    { key: 'paper', shortLabel: 'Chấm A4', label: 'Chấm phiếu A4', Icon: IcoScan, group: 'Tổ chức thi & Chấm' },
    {
      key: 'retry',
      shortLabel: 'Thi lại',
      label: 'Xin thi lại',
      Icon: IcoBell,
      badge: totalPendingRetry > 0 ? totalPendingRetry : null,
      group: 'Tổ chức thi & Chấm',
    },

    /* Nhóm 4: Tài khoản & Hệ thống */
    { key: 'profile', shortLabel: 'Hồ sơ', label: 'Hồ sơ giáo viên', Icon: IcoUser, group: 'Tài khoản & Hệ thống' },
    { key: 'link', shortLabel: 'Giao chéo', label: 'Giao đề lớp khác', Icon: IcoKey, group: 'Tài khoản & Hệ thống' },
    ...(showAdminLink ? [{
      key: 'admin',
      shortLabel: 'Quản trị',
      label: 'Quản trị hệ thống',
      Icon: IcoMonitor,
      group: 'Tài khoản & Hệ thống',
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
      title: `Chào ${user?.displayName || user?.email || 'thầy cô'}`,
      subtitle: 'Tổng quan lớp học và phòng thi của bạn',
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
      autoHideNav={false}
      onOpenCommandPalette={() => {
        setCmdOpen(true);
        setCmdQuery('');
        setCmdIndex(0);
      }}
      exitLabel="Về ELEC AI"
      onExit={() => {
        if (onExit) onExit();
        else window.location.hash = 'home';
      }}
    >
      <Topbar
        {...topProps}
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

      {/* Thanh Liên Kết Luồng Biên Soạn & Tổ Chức Thi 1 Chạm */}
      {['create', 'bank', 'exams', 'simulator', 'sessions'].includes(section) && (
        <div className="t-workflow-bar" role="navigation" aria-label="Chuỗi quy trình khảo thí">
          <div className="t-workflow-steps">
            {[
              { key: 'create', num: 1, label: 'AI Tạo đề' },
              { key: 'bank', num: 2, label: 'Ngân hàng câu hỏi' },
              { key: 'exams', num: 3, label: `Kho Đề thi (${exams.length})` },
              { key: 'simulator', num: 4, label: 'Mô phỏng & Đảo đề' },
              { key: 'sessions', num: 5, label: `Phòng thi LIVE (${liveSessions.length})` },
            ].map((step, idx, arr) => (
              <div key={step.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  className={`t-workflow-step ${section === step.key ? 'active' : ''}`}
                  onClick={() => goSection(step.key)}
                >
                  <span className="t-workflow-step-num">{step.num}</span>
                  <span>{step.label}</span>
                </button>
                {idx < arr.length - 1 && <span className="t-workflow-arrow" aria-hidden="true">→</span>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {exams.length > 0 && (section === 'exams' || section === 'bank') && (
              <button
                type="button"
                className="vt-btn sm"
                onClick={handleSyncExamsToBank}
                disabled={syncingBank}
                title="Đẩy toàn bộ câu hỏi từ các đề thi hiện có vào Ngân hàng câu hỏi để tái sử dụng"
              >
                <IcoFolder size={13} /> {syncingBank ? 'Đang đồng bộ...' : 'Đồng bộ đề → Ngân hàng'}
              </button>
            )}
            {section !== 'create' && (
              <button type="button" className="vt-btn sm primary" onClick={() => openNewExam()}>
                <IcoSparkles size={13} /> + Soạn đề mới (Phím N)
              </button>
            )}
            {section === 'exams' && exams.length > 0 && (
              <button type="button" className="vt-btn sm" onClick={() => goSection('simulator')}>
                <IcoShuffle size={13} /> Đảo mã đề & In A4
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TỔNG QUAN — 12-COL DARK BENTO
         ============================================================ */}
      {section === 'overview' && (
        <div className="t-bento-12">
          <div className="t-col-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
            <SchedulePill
              time={liveSessions.length > 0 ? `${liveSessions.length} PHÒNG THI ĐANG MỞ` : 'Lịch thi hôm nay'}
              title={liveSessions[0]?.title || (recentExams[0]?.title ? `Gần nhất: ${recentExams[0].title}` : 'Sẵn sàng khảo thí')}
              avatars={classes.slice(0, 4).map((c) => ({ name: c.name }))}
              live={liveSessions.length > 0}
              onClick={() => goSection('sessions')}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', background: 'var(--t-surface-2)', border: '1px solid var(--t-border)', borderRadius: 999, padding: '0.2rem', gap: '0.2rem' }} role="group" aria-label="Khoảng thời gian thống kê">
                {[
                  { k: '7', label: '7 ngày' },
                  { k: '30', label: '30 ngày' },
                  { k: '90', label: '90 ngày' },
                  { k: 'all', label: 'Tất cả' },
                ].map((opt) => (
                  <button
                    key={opt.k}
                    type="button"
                    onClick={() => setRange(opt.k)}
                    style={{
                      padding: '0.32rem 0.72rem',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      background: range === opt.k ? 'var(--t-accent)' : 'transparent',
                      color: range === opt.k ? 'var(--t-accent-ink)' : 'var(--t-ink-muted)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={openNewExam}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--t-r-pill)',
                  background: 'var(--t-accent)',
                  color: 'var(--t-accent-ink)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: 'var(--t-shadow-lime)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <IcoSparkles size={16} /> Tạo đề mới cùng AI
              </button>
            </div>
          </div>

          <div className="t-col-4">
            <MemoBentoCard interactive onClick={() => goSection('exams')}>
              <MemoStatBig
                value={exams.length}
                label="Đề thi đã biên soạn"
                suffix=" đề"
                delta={countBy('ready')}
                deltaLabel="đã giao sẵn sàng"
              />
            </MemoBentoCard>
          </div>

          <div className="t-col-4">
            <MemoBentoCard interactive onClick={exportAllCsv}>
              <MemoStatBig
                value={subsInRange.length}
                label="Bài kiểm tra đã nộp"
                suffix=" bài"
                delta={passRate}
                deltaLabel="% đạt chuẩn (≥5.0)"
              />
            </MemoBentoCard>
          </div>

          <div className="t-col-4">
            <MemoBentoCard
              interactive
              tone={atRiskStudents.length > 0 ? 'dark' : 'default'}
              onClick={() => goSection('analytics')}
            >
              <MemoStatBig
                value={atRiskStudents.length}
                label="Học sinh cần kèm thêm"
                suffix=" HS"
                delta={atRiskStudents.length > 0 ? -atRiskStudents.length : 0}
                deltaLabel="dưới 50% điểm"
              />
            </MemoBentoCard>
          </div>

          <div className="t-col-8">
            <MemoBentoCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--t-ink)' }}>
                    Lớp học của tôi
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--t-ink-muted)' }}>
                    {classes.length} lớp học · Quản lý học sinh và tiến độ học tập
                  </p>
                </div>
                <button
                  type="button"
                  className="vt-btn sm"
                  onClick={() => goSection('classes')}
                  style={{ borderRadius: 'var(--t-r-pill)', fontSize: '0.78rem' }}
                >
                  Xem tất cả ({classes.length})
                </button>
              </div>

              {classes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--t-ink-muted)' }}>
                  <p>Chưa có lớp học nào. Hãy bấm "Tạo lớp mới" để bắt đầu.</p>
                  <button
                    type="button"
                    className="vt-btn sm primary"
                    onClick={() => { goSection('classes'); setShowCreateClass(true); }}
                  >
                    + Tạo lớp đầu tiên
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                  {classes.slice(0, 4).map((c) => {
                    const membersCount = c.members?.length || 0;
                    const classExams = exams.filter((e) => e.classId === c.id);
                    const dotLevel = Math.min(5, Math.max(1, Math.round((membersCount > 0 ? 3 : 1) + (classExams.length > 0 ? 1 : 0))));

                    return (
                      <MemoBentoCard
                        key={c.id}
                        notch
                        onNotchClick={() => setSelectedClass(c)}
                        style={{
                          background: 'var(--t-surface-2)',
                          border: '1px solid var(--t-border)',
                          padding: '1.15rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <MemoAvatar name={c.name} size={42} />
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--t-ink)' }}>
                              {c.name}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--t-ink-muted)' }}>
                              Mã lớp: <code style={{ color: 'var(--t-accent)', fontWeight: 700 }}>{c.key}</code>
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--t-border-subtle)' }}>
                          <span style={{ fontSize: '0.76rem', color: 'var(--t-ink-muted)' }}>
                            {membersCount} học sinh · {classExams.length} đề
                          </span>
                          <RatingDots value={dotLevel} max={5} tone="lime" size={7} />
                        </div>
                      </MemoBentoCard>
                    );
                  })}
                </div>
              )}
            </MemoBentoCard>
          </div>

          <div className="t-col-4">
            <MemoBentoCard tone="dark">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--t-ink)' }}>
                  Điểm trung bình
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--t-ink-muted)', background: 'var(--t-surface-2)', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                  {range === 'all' ? 'Tất cả' : `${range} ngày`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', padding: '0.85rem 0' }}>
                <Donut value={avgPct} size={132} stroke={12}>
                  <strong style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--t-ink)' }}>
                    {avgPct}<sup>%</sup>
                  </strong>
                  <small style={{ fontSize: '0.75rem', color: 'var(--t-ink-muted)' }}>{subsInRange.length} bài nộp</small>
                </Donut>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--t-border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--t-ink-muted)' }}>Xếp loại năng lực:</span>
                <strong style={{ color: 'var(--t-accent)' }}>{classHealthGrade.grade} ({classHealthGrade.label})</strong>
              </div>
            </MemoBentoCard>
          </div>

          <div className="t-col-8">
            <MemoBentoCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--t-ink)' }}>
                    Xu hướng điểm thi theo đề
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--t-ink-muted)' }}>
                    {trend.length} đề thi gần nhất có học sinh nộp bài
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className={`vt-btn sm ${chartMode === 'line' ? 'primary' : ''}`}
                    onClick={() => setChartMode('line')}
                    style={{ borderRadius: 8, padding: '0.3rem 0.6rem' }}
                  >
                    <IcoChart size={13} /> Đường
                  </button>
                  <button
                    type="button"
                    className={`vt-btn sm ${chartMode === 'bar' ? 'primary' : ''}`}
                    onClick={() => setChartMode('bar')}
                    style={{ borderRadius: 8, padding: '0.3rem 0.6rem' }}
                  >
                    <IcoGrid size={13} /> Cột
                  </button>
                </div>
              </div>

              <TrendChart points={trend} mode={chartMode} max={100} height={150} />
            </MemoBentoCard>
          </div>

          <div className="t-col-4">
            <MemoBentoCard tone={liveSessions.length > 0 ? 'lime' : 'default'}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: liveSessions.length > 0 ? 'var(--t-accent-ink)' : 'var(--t-ink)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {liveSessions.length > 0 ? (
                  <>
                    <IcoBolt size={16} />
                    Phòng thi LIVE đang mở
                  </>
                ) : (
                  'Nhiệm vụ cần xử lý'
                )}
              </h3>

              {liveSessions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--t-accent-ink)', fontWeight: 600 }}>
                    <strong>{liveSessions[0].title}</strong>
                    <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                      {roomStudents} học sinh đang làm bài · {roomViol} cảnh báo vi phạm
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingSessionId(liveSessions[0].id)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.55rem 1rem',
                      borderRadius: 'var(--t-r-pill)',
                      background: '#0e0e10',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    Vào giám sát camera ngay
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 12,
                      background: 'var(--t-surface-2)',
                      border: '1px solid var(--t-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => goSection('classes')}
                  >
                    <span style={{ fontSize: '0.84rem', color: 'var(--t-ink)' }}>Học sinh chờ duyệt vào lớp</span>
                    <span style={{ fontWeight: 800, color: totalPendingMembers > 0 ? 'var(--t-status-warn)' : 'var(--t-ink-muted)' }}>
                      {totalPendingMembers}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 12,
                      background: 'var(--t-surface-2)',
                      border: '1px solid var(--t-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => goSection('retry')}
                  >
                    <span style={{ fontSize: '0.84rem', color: 'var(--t-ink)' }}>Yêu cầu xin thi lại</span>
                    <span style={{ fontWeight: 800, color: totalPendingRetry > 0 ? 'var(--t-status-warn)' : 'var(--t-ink-muted)' }}>
                      {totalPendingRetry}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 12,
                      background: 'var(--t-surface-2)',
                      border: '1px solid var(--t-border)',
                      cursor: 'pointer',
                    }}
                    onClick={exportAllCsv}
                  >
                    <span style={{ fontSize: '0.84rem', color: 'var(--t-ink)' }}>Xuất bảng điểm tổng hợp</span>
                    <span style={{ color: 'var(--t-accent)', fontSize: '0.84rem', fontWeight: 700 }}>CSV</span>
                  </div>
                </div>
              )}
            </MemoBentoCard>
          </div>

          <div className="t-col-12" style={{ marginTop: '0.5rem' }}>
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
        </div>
      )}

      {/* ============================================================
          TRUNG TÂM LIÊN KẾT LỚP & GIAO ĐỀ LỚP KHÁC (HỢP NHẤT)
         ============================================================ */}
      {section === 'link' && renderUnifiedLinkedClassesHub()}

      {section === 'analytics' && (
        <ClassAnalytics
          classes={classes}
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
            {/* Thanh chuyển Tab giữa Lớp chủ nhiệm của tôi & Lớp liên kết / Giao đề lớp khác */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.9rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--soft)' }}>
              <div style={{ display: 'inline-flex', background: 'var(--vt-tint)', borderRadius: 999, padding: '0.25rem', gap: '0.25rem' }} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={classSectionTab === 'my'}
                  onClick={() => setClassSectionTab('my')}
                  style={{
                    padding: '0.42rem 0.95rem',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    background: classSectionTab === 'my' ? 'var(--acc)' : 'transparent',
                    color: classSectionTab === 'my' ? '#fff' : 'var(--ink)',
                  }}
                >
                  Lớp của tôi ({classes.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={classSectionTab === 'linked'}
                  onClick={() => setClassSectionTab('linked')}
                  style={{
                    padding: '0.42rem 0.95rem',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    background: classSectionTab === 'linked' ? 'var(--acc)' : 'transparent',
                    color: classSectionTab === 'linked' ? '#fff' : 'var(--ink)',
                  }}
                >
                  Lớp liên kết & Giao đề lớp khác ({linkedClasses.length})
                </button>
              </div>

              {classSectionTab === 'my' && (
                <button type="button" className="vt-btn sm primary" onClick={() => setShowCreateClass(true)}>
                  + Tạo lớp mới (Phím N)
                </button>
              )}
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

                <div className={classViewMode === 'list' ? 'vt-stackcards' : 'vt-grid'}>
                  <button type="button" className="vt-card vt-add-card" onClick={() => setShowCreateClass(true)}>
                    <span className="vt-fab static">+</span>
                    <b>Tạo lớp mới (Phím N)</b>
                    <small>Học sinh vào lớp bằng mã lớp</small>
                  </button>

                  {filteredClasses.map((cls) => {
                    const members = cls.members || [];
                    const classExams = exams.filter((e) => e.classId === cls.id);
                    const pendingCount = cls.pendingMembers?.length || 0;
                    return (
                      <article key={cls.id} className="vt-card vt-class vt-folder-card">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingBottom: '0.5rem',
                            marginBottom: '0.2rem',
                            borderBottom: '1px dashed var(--soft)',
                            fontSize: '0.73rem',
                            color: 'var(--mut)',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--acc)' }}>
                            <IcoFolder size={14} /> THƯ MỤC LỚP HỌC
                          </span>
                          <span>{classExams.length} đề · {members.length} HS</span>
                        </div>

                        <header style={{ cursor: 'pointer' }} onClick={() => setSelectedClass(cls)}>
                          <MemoAvatar name={cls.name} size={50} />
                          <div>
                            <h3>{cls.name}</h3>
                            <small>{cls.subject || 'Đa môn'} · {classExams.length} đề kiểm tra</small>
                          </div>
                          <i className="vt-count" title="Sĩ số lớp">{members.length}</i>
                        </header>

                        {pendingCount > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '.45rem',
                              padding: '.48rem .75rem',
                              borderRadius: 12,
                              background: 'color-mix(in srgb, #f59e0b 14%, var(--vt-tint))',
                              border: '1px solid color-mix(in srgb, #f59e0b 40%, transparent)',
                              color: '#b45309',
                              font: '700 .78rem var(--sans)',
                            }}
                          >
                            <IcoBell size={14} />
                            <span
                              style={{ flex: 1, cursor: 'pointer' }}
                              onClick={() => setSelectedClass(cls)}
                            >
                              {pendingCount} HS chờ duyệt
                            </span>
                            <button
                              type="button"
                              className="vt-btn sm primary"
                              style={{ padding: '0.22rem 0.55rem', fontSize: '0.72rem' }}
                              onClick={(e) => { e.stopPropagation(); handleApproveAll(cls); }}
                              title="Duyệt tất cả học sinh đang chờ vào lớp"
                            >
                              Duyệt tất cả
                            </button>
                          </div>
                        )}

                        <div className="vt-keybox">
                          <IcoKey size={15} />
                          <code title="Mã lớp dành cho học sinh">{cls.key}</code>
                          <button
                            type="button"
                            className="vt-icon-btn"
                            aria-label="Sao chép mã lớp"
                            onClick={() => copyText(cls.key, cls.id, 'Đã sao chép mã lớp')}
                            title="Sao chép mã lớp 1 chạm"
                          >
                            {copiedKey === cls.id ? <IcoCheckCircle size={15} /> : <IcoCopy size={15} />}
                          </button>
                          <button
                            type="button"
                            className="vt-icon-btn"
                            aria-label="Làm mới mã lớp"
                            onClick={() => handleRegenKey(cls)}
                            title="Làm mới / đổi mã lớp"
                          >
                            <IcoRefresh size={14} />
                          </button>
                          <button
                            type="button"
                            className="vt-icon-btn"
                            aria-label="Mở mã QR của lớp"
                            onClick={() => setShareClass(cls)}
                            title="Chia sẻ mã QR"
                          >
                            QR
                          </button>
                        </div>

                        {cls.announcement?.text && (
                          <div style={{
                            fontSize: '0.78rem',
                            color: 'var(--ink)',
                            background: 'color-mix(in srgb, var(--acc) 10%, var(--surface-2))',
                            padding: '0.4rem 0.65rem',
                            borderRadius: 10,
                            border: '1px solid color-mix(in srgb, var(--acc) 22%, transparent)',
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

                        <div className="vt-stack">
                          {members.slice(0, 5).map((m) => <MemoAvatar key={m.id} name={m.name} size={30} />)}
                          {members.length > 5 && <span className="vt-stack-more">+{members.length - 5}</span>}
                          {members.length === 0 && <small className="vt-muted">Chưa có học sinh tham gia</small>}
                        </div>

                        <footer>
                          <button type="button" className="vt-btn sm" onClick={() => setSelectedClass(cls)}>
                            <IcoUsers size={13} /> Chi tiết
                          </button>
                          <button
                            type="button"
                            className="vt-btn sm"
                            onClick={() => exportClassRosterCsv(cls)}
                            title="Xuất danh sách học sinh ra CSV"
                          >
                            <IcoDownload size={12} /> Xuất DS
                          </button>
                          <button
                            type="button"
                            className="vt-btn sm"
                            onClick={() => { setNoticeClass(cls); setNoticeDraft(cls.announcement?.text || ''); }}
                            title="Ghim thông báo cho lớp"
                          >
                            <IcoPin size={12} /> Ghim tin
                          </button>
                          <button
                            type="button"
                            className="vt-btn sm primary"
                            onClick={() => { setSelectedClass(cls); goSection('create'); }}
                          >
                            <IcoBook size={13} /> Tạo đề
                          </button>
                          <button type="button" className="vt-btn sm" onClick={() => handleDeleteClass(cls)}>
                            Xóa
                          </button>
                        </footer>
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

        /* ❗ Thẻ đề bóc thành hàm dùng chung — nhóm theo lớp và danh sách phẳng cùng dùng */
        const renderExamCard = ({ ex, liveSession, st }) => {
          const cls = classById[ex.classId];
          const subs = submissionsMap[ex.id] || [];
          const pcts = subs.map(pctOf);
          const avg = subs.length ? Math.round(avgOf(pcts)) : null;
          const best = subs.length ? Math.round(Math.max(...pcts)) : null;
          const link = `${window.location.origin}${window.location.pathname}#exam/${ex.token}`;
          const memberCount = cls?.members?.length || 0;
          const liveDoingCount = liveSession
            ? Math.max(0, (liveSession.stats?.joined || 0) - (liveSession.stats?.submitted || 0))
            : 0;
          const subject = (() => {
            const own = detectExamSubject(ex);
            if (own !== '—') return own;
            return cls?.subject || cls?._mySubject || '—';
          })();
          const isAi = isAiGeneratedExam(ex);
          const isPublic = ex.visibility === 'public';
          const mcqAllA = (ex.questions || []).length >= 2
            && (ex.questions || []).every((qItem) => (qItem.type || 'single_choice') !== 'single_choice'
              || qItem.correct === 0);
          const typeCount = (() => {
            const t = { single_choice: 0, true_false: 0, short_answer: 0 };
            (ex.questions || []).forEach((question) => {
              const k = question.type || 'single_choice';
              t[k] = (t[k] || 0) + 1;
            });
            return t;
          })();

          const opensMs = tsMs(ex.opensAt);
          const closesMs = tsMs(ex.closesAt);

          return (
            <article key={ex.id} className={'vt-card vt-exam' + (st.key === 'live' ? ' live' : '')}>
              <div className="vt-exam-main">
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className={'vt-chip ' + st.key}>
                    {st.key === 'live' && <IcoDot size={7} />} {st.label}
                  </span>
                  {liveSession && (
                    <span
                      className="vt-chip"
                      style={{
                        background: 'color-mix(in srgb, #10b981 18%, transparent)',
                        color: '#059669',
                        fontWeight: 800,
                      }}
                      title="Số học sinh đang làm bài trực tiếp trong phòng thi"
                    >
                      ● {liveDoingCount} HS đang làm trực tiếp
                    </span>
                  )}
                  {subject && subject !== '—' && (
                    <span className="vt-chip" style={{ background: 'color-mix(in srgb, #8b5cf6 12%, transparent)', color: '#7c3aed' }}>
                      <IcoSubject size={11} /> {subject}
                    </span>
                  )}
                  {isAi && (
                    <span className="vt-chip" style={{ background: 'color-mix(in srgb, #f59e0b 15%, transparent)', color: '#b45309' }}>
                      <IcoSparkles size={11} /> AI tạo
                    </span>
                  )}
                  {(opensMs > 0 || closesMs > 0) && (
                    <span
                      className="vt-chip"
                      onClick={() => openScheduleModal(ex)}
                      style={{
                        cursor: 'pointer',
                        background: 'color-mix(in srgb, #0284c7 12%, transparent)',
                        color: '#0369a1',
                      }}
                      title="Bấm để chỉnh lịch mở/đóng đề thi"
                    >
                      <IcoCalendar size={11} />
                      {opensMs > 0 ? `Mở: ${fmtClock(opensMs)}` : ''}
                      {opensMs > 0 && closesMs > 0 ? ' → ' : ''}
                      {closesMs > 0 ? `Đóng: ${fmtClock(closesMs)}` : ''}
                    </span>
                  )}
                  <button
                    type="button"
                    className="vt-chip"
                    title={isPublic
                      ? 'Đang công khai: ai có link cũng làm được. Bấm để chuyển sang riêng tư.'
                      : 'Đang riêng tư: chỉ thành viên lớp vào được. Bấm để công khai.'}
                    onClick={() => toggleVisibility(ex)}
                    disabled={savingVis === ex.id}
                    style={{
                      cursor: savingVis === ex.id ? 'wait' : 'pointer',
                      border: '1px solid ' + (isPublic ? 'rgba(16,185,129,.4)' : 'rgba(100,116,139,.35)'),
                      background: isPublic ? 'color-mix(in srgb, #10b981 14%, transparent)' : 'transparent',
                      color: isPublic ? '#047857' : 'var(--t-ink-muted)',
                      opacity: savingVis === ex.id ? 0.6 : 1,
                    }}
                  >
                    {isPublic ? 'Công khai' : 'Riêng tư'}
                  </button>
                  <button
                    type="button"
                    className="vt-chip"
                    title={ex.lockUntilStart
                      ? 'Đang khoá: học sinh thấy bảng chờ, chỉ vào thi khi bạn bấm “Bắt đầu thi”. Bấm để mở vào tự do.'
                      : 'Đang mở: học sinh vào thi bất cứ lúc nào. Bấm để khoá tới khi bạn bắt đầu.'}
                    onClick={() => toggleLock(ex)}
                    disabled={savingLock === ex.id}
                    style={{
                      cursor: savingLock === ex.id ? 'wait' : 'pointer',
                      border: '1px solid ' + (ex.lockUntilStart ? 'rgba(217,119,6,.45)' : 'rgba(100,116,139,.35)'),
                      background: ex.lockUntilStart ? 'color-mix(in srgb, #d97706 14%, transparent)' : 'transparent',
                      color: ex.lockUntilStart ? '#a45c05' : 'var(--t-ink-muted)',
                      opacity: savingLock === ex.id ? 0.6 : 1,
                    }}
                  >
                    {ex.lockUntilStart ? 'Khoá bài' : 'Vào tự do'}
                  </button>
                  {mcqAllA && (
                    <span
                      className="vt-chip"
                      title="Mọi câu trắc nghiệm đang có đáp án A. Đề nhập từ file có thể chưa nhận được đáp án đúng — mở “Chỉnh sửa” để kiểm tra trước khi cho học sinh làm."
                      style={{ background: 'rgba(220, 38, 38, 0.12)', color: '#b91c1c' }}
                    >
                      Kiểm tra đáp án
                    </span>
                  )}
                </div>
                <h3>{ex.title}</h3>
                <small>
                  <b>Lớp {cls?.name || '—'}</b>
                  {subject && subject !== '—' ? <> · Môn <b>{subject}</b></> : null}
                  {cls?.teacherName ? <> · GV chủ nhiệm: <b>{cls.teacherName}</b></> : null}
                  {` · ${(ex.questions || []).length} câu · ${ex.duration} phút`}
                  {typeCount.true_false > 0 && ` · ${typeCount.true_false} Đ/S`}
                  {typeCount.short_answer > 0 && ` · ${typeCount.short_answer} TLN`}
                </small>
                <div className="vt-linkbox">
                  <code title={link}>{link}</code>
                  <button
                    type="button"
                    className="vt-icon-btn"
                    aria-label="Sao chép liên kết đề thi"
                    onClick={() => copyText(link, ex.id, 'Đã chép link đề')}
                    title="Sao chép link"
                  >
                    {copiedKey === ex.id ? <IcoCheckCircle size={15} /> : <IcoCopy size={15} />}
                  </button>
                </div>
              </div>

              <div className="vt-exam-stats">
                <div>
                  <Donut value={memberCount ? subs.length : 0} max={memberCount || 1} size={74} stroke={8}>
                    <strong className="sm">{subs.length}</strong>
                  </Donut>
                  <small>{memberCount ? `/${memberCount} đã nộp` : 'bài nộp'}</small>
                </div>
                <div>
                  <b>{avg == null ? '—' : `${avg}%`}</b>
                  <small>điểm TB</small>
                </div>
                <div>
                  <b>{best == null ? '—' : `${best}%`}</b>
                  <small>cao nhất</small>
                </div>
              </div>

              <div className="vt-exam-actions">
                {liveSession ? (
                  <button type="button" className="vt-btn primary" onClick={() => setViewingSessionId(liveSession.id)}>
                    <IcoVideo size={14} /> Giám sát ({liveDoingCount} đang thi)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="vt-btn primary"
                    onClick={() => handleStartSession(ex)}
                    disabled={startingId === ex.id || st.key === 'closed'}
                  >
                    {startingId === ex.id ? 'Đang tạo...' : <><IcoPlay size={14} /> Bắt đầu thi</>}
                  </button>
                )}
                <div className="vt-exam-actions-row">
                  <button
                    type="button"
                    className="vt-btn sm"
                    style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                    onClick={() => setPreviewExam(ex)}
                    title="Mô phỏng thi, bản in A4 và đảo mã đề"
                  >
                    <IcoEye size={13} /> Xem trước & In A4
                  </button>
                  <button
                    type="button"
                    className="vt-btn sm"
                    onClick={() => openScheduleModal(ex)}
                    title="Đặt lịch giờ mở đề và đóng đề tự động"
                  >
                    <IcoCalendar size={13} /> Đặt lịch
                  </button>
                  <button
                    type="button"
                    className="vt-btn sm"
                    onClick={() => handleDuplicateExam(ex)}
                    title="Nhân bản đề thi này thành bản sao mới"
                  >
                    <IcoCopy size={13} /> Nhân bản
                  </button>
                  {(classes.length + linkedClasses.length) > 1 && (
                    <button
                      type="button"
                      className="vt-btn sm"
                      onClick={() => {
                        const allTargets = [...classes, ...linkedClasses];
                        const defaultCls = allTargets.find((c) => c.id !== ex.classId) || allTargets[0];
                        setCopyTargetClassId(defaultCls?.id || '');
                        setCopyExamTarget(ex);
                      }}
                      title="Giao đề thi này sang một lớp chủ nhiệm hoặc lớp liên kết khác"
                    >
                      <IcoSend size={13} /> Giao lớp khác
                    </button>
                  )}
                  <button type="button" className="vt-btn sm" onClick={() => setSelectedExam(ex)}>
                    <IcoChart size={13} /> Thống kê
                  </button>
                  <button
                    type="button"
                    className="vt-btn sm"
                    onClick={() => setEditingExam(ex)}
                    title="Sửa thông tin, câu hỏi, cấu hình camera & chống gian lận"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="vt-icon-btn"
                    aria-label="Xuất điểm CSV"
                    onClick={() => (subs.length ? exportExamCsv(ex, subs) : say('Chưa có bài nộp để xuất', 'error'))}
                    title="Xuất điểm CSV"
                  >
                    <IcoDownload size={15} />
                  </button>
                  <button
                    type="button"
                    className="vt-icon-btn danger"
                    aria-label="Xóa đề thi"
                    onClick={() => handleDeleteExam(ex)}
                    title="Xóa đề"
                  >
                    <IcoTrash size={15} />
                  </button>
                </div>
              </div>
            </article>
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
            <div className="vt-empty">
              <span><IcoBook size={30} /></span>
              <h3>Chưa có đề nào</h3>
              <p>Tạo đề cho một lớp để giao bài và mở phòng thi.</p>
              <button type="button" className="vt-btn primary" onClick={openNewExam}>Tạo đề đầu tiên</button>
            </div>
          );
        }

        return (
          <>
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
                <div className="vt-stackcards">
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
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.7rem .95rem', cursor: 'pointer', textAlign: 'left' }}
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
                                <div className="vt-stackcards">
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
          MÔ PHỎNG
         ============================================================ */}
      {section === 'simulator' && (
        <ErrorBoundary>
          <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải bộ mô phỏng...</p></div>}>
            <TeacherSimulatorHub
              teacherExams={exams}
              classes={classes}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* ============================================================
          NGÂN HÀNG
         ============================================================ */}
      {section === 'bank' && (
        <ErrorBoundary>
          <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải ngân hàng...</p></div>}>
            <QuestionBank
              classes={classes}
              onSoftExamCreated={() => refresh()}
              onOpenAiStudio={openNewExam}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* ============================================================
          CHẤM PHIẾU A4 (OMR)
         ============================================================ */}
      {section === 'paper' && (
        <ErrorBoundary>
          <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải chấm phiếu A4...</p></div>}>
            <PaperGrading classes={classes} exams={exams} />
          </Suspense>
        </ErrorBoundary>
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
                      const safePending = pendingInView.filter((r) => {
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
                  className="td-btn"
                  onClick={() => { setExtCreate(false); setExtClass(null); goSection('overview'); }}
                >
                  Huỷ
                </button>
              </div>
            )}
            <CreateExamPage
              /* Giáo viên bộ môn: khoá vào đúng lớp đã liên kết, không cho chọn lớp khác */
              classInfo={extCreate && extClass ? extClass : (selectedClass || classes[0])}
              classes={extCreate && extClass ? [extClass] : classes}
              classInsights={classInsights}
              initialPreset={aiPreset}
              grades={[]}
              subjects={[]}
              onDone={async (createdExam) => {
                subsCacheRef.current = {};
                await refresh();
                if (extCreate && extClass) {
                  /* Báo cho chủ nhiệm: có đề mới trong lớp của họ */
                  await notifyClassOwner({
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
                  });
                  say(`Đã giao đề cho lớp ${extClass.name || ''}`.trim(), 'success');
                }
                setSelectedClass(null);
                setExtClass(null);
                setExtCreate(false);
                setAiPreset(null);
                goSection('exams');
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
      )}

      {/* ============ GIAO ĐỀ CHO LỚP KHÁC (giáo viên bộ môn) ============ */}
      {extOpen && (
        <Modal title="Giao đề cho lớp khác" size="lg" onClose={() => { setExtOpen(false); setExtErr(''); }}>
          <p style={{ margin: '0 0 0.7rem', fontSize: '0.86rem', color: 'var(--mut)' }}>
            Đây là các lớp bạn đã liên kết bằng key của chủ nhiệm. Đề bạn tạo sẽ nằm trong lớp đó,
            ghi tên <b>bạn</b> là người giao và chủ nhiệm theo dõi được trong mục “Phân tích AI”.
          </p>

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

          <details style={{ marginTop: '0.9rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: 'var(--mut)' }}>
              Hoặc dùng mã lớp (không cần key)
            </summary>
            <p style={{ margin: '0.6rem 0', fontSize: '0.82rem', color: 'var(--mut)' }}>
              Nhập mã lớp do giáo viên chủ nhiệm gửi để giao đề nhanh mà không cần liên kết.
            </p>
            <input
              value={extKey}
              onChange={(e) => { setExtKey(e.target.value.toUpperCase()); setExtErr(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') findExternalClass(); }}
              placeholder="VD: 11A7-8KQ3ZM"
              style={{
                width: '100%', padding: '0.6rem 0.75rem', fontSize: '1rem', letterSpacing: '0.06em',
                borderRadius: 12, border: '1.5px solid var(--soft)', background: 'var(--surface, #fff)',
                color: 'var(--ink)', textTransform: 'uppercase',
              }}
            />
            {extErr && <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--acc)' }}>{extErr}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.7rem' }}>
              <button type="button" className="td-btn primary" onClick={findExternalClass} disabled={extBusy}>
                {extBusy ? 'Đang tìm…' : 'Tìm lớp'}
              </button>
            </div>
          </details>
        </Modal>
      )}

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
                className="td-btn"
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
                    <button type="button" className="td-btn" onClick={() => openNotice(n)}>Mở lớp</button>
                    {!n.read && (
                      <button
                        type="button"
                        className="td-btn"
                        style={{ background: 'transparent', border: '1px solid var(--soft)', color: 'var(--mut)' }}
                        onClick={async () => {
                          try { await markNoticeRead(n.id); } catch { /* bỏ qua */ }
                        }}
                      >
                        Đã đọc
                      </button>
                    )}
                    <button
                      type="button"
                      className="td-btn"
                      style={{ background: 'transparent', border: '1px solid var(--soft)', color: 'var(--mut)' }}
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
                <button type="button" className="td-btn" onClick={() => { setBellOpen(false); goSection('sessions'); }}>
                  {liveSessions.length} phòng thi đang mở
                </button>
              )}
              {totalPendingRetry > 0 && (
                <button type="button" className="td-btn" onClick={() => { setBellOpen(false); goSection('retry'); }}>
                  {totalPendingRetry} đơn xin thi lại
                </button>
              )}
              {totalPendingMembers > 0 && (
                <button type="button" className="td-btn" onClick={() => { setBellOpen(false); goSection('classes'); }}>
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
            onExport={() => exportExamCsv(selectedExam, submissionsMap[selectedExam.id] || [])}
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
    </DashFrame>
  );
}

/* ============================================================
   THỐNG KÊ ĐỀ + XEM BÀI LÀM CHI TIẾT TỪNG HỌC SINH
   ============================================================ */
function ExamStats({ exam, subs, onExport }) {
  const [inspectSub, setInspectSub] = useState(null);

  if (!subs || subs.length === 0) {
    return <p className="vt-muted">Chưa có bài nộp nào cho đề này.</p>;
  }

  const sorted = [...subs].sort((a, b) => b.score - a.score);
  const pcts = subs.map(pctOf);
  const avg = Math.round(avgOf(pcts));
  const bins = [0, 0, 0, 0, 0];
  pcts.forEach((p) => { bins[Math.min(4, Math.floor(p / 20))] += 1; });
  const maxBin = Math.max(...bins, 1);

  const perQ = (exam.questions || []).map((qq, i) => {
    const rated = subs.filter((s) => s.detail?.[i]);
    const ok = rated.filter((s) => s.detail[i].isCorrect).length;
    return { i, text: qq.q, type: qq.type || 'single_choice', rate: rated.length ? Math.round((ok / rated.length) * 100) : null };
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
          <button type="button" className="vt-btn sm" onClick={onExport}>
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