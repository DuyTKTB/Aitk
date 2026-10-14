/* ============================================================
   TeacherDashboard.jsx — Quản lý lớp học (Vitality) v6
   ------------------------------------------------------------
   HỖ TRỢ ĐA MÔN: filter theo môn, hiển thị badge môn, cột môn
                  trong danh sách đề.
   ------------------------------------------------------------
   v6 (đa môn + fix):
     • FIX #5: refresh insights (subsCacheRef) trước khi mở AI
       Studio → AI dùng dữ liệu mới nhất, không dùng cache cũ.
     • FIX #7: clear subsCacheRef khi tạo đề mới → tab "Đề thi"
       hiển thị đầy đủ.
     • MỚI: Filter theo môn trong tab Đề thi.
     • MỚI: Badge "AI tạo" cho đề sinh bằng AI (dựa meta.source).
     • MỚI: Nút "Sinh 3 đề phân hóa" cho lớp (mở AutoExamStudio
       chế độ phân hóa).
     • MỚI: Hiển thị môn trong thẻ đề + Bento lớp.
     • MỚI: Cảnh báo khi AI sinh thiếu câu (nối với onPartial).
     • Giữ nguyên v5: tab "Xin thi lại" có ô ghi chú; lazy-load
       bài nộp; SVG icons.
   ============================================================ */
import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { isAdmin as checkAdmin } from '../lib/isAdmin.js';
import { buildClassInsights } from '../lib/classInsights.js';
import {
  getClassesByTeacher,
  getExamsByTeacher,
  getSubmissionsByExam,
  createClass,
  removeClassMember,
  deleteExam as deleteExamFs,
  updateClass,
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
  getClassAllowances,
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

const LiveProctorView = lazy(() => import('./LiveProctorView.jsx'));
const CreateExamPage = lazy(() => import('./teacher/CreateExamPage.jsx'));
const QuestionBank = lazy(() => import('./teacher/QuestionBank.jsx'));
const PaperGrading = lazy(() => import('./teacher/PaperGrading.jsx'));
const TeacherSimulatorHub = lazy(() => import('./teacher/TeacherSimulatorHub.jsx'));
const ExamPreviewSimulator = lazy(() => import('./teacher/ExamPreviewSimulator.jsx'));
const InsightPanel = lazy(() => import('./teacher/InsightPanel.jsx'));

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

const IcoSun = (p) => (
  <Svg {...p} sw={2}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Svg>
);

const IcoMoon = (p) => (
  <Svg {...p} sw={2}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);

const IcoBolt = (p) => (
  <Svg {...p} sw={2}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Svg>
);

const IcoTarget = (p) => (
  <Svg {...p} sw={1.8}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </Svg>
);

const IcoSubject = (p) => (
  <Svg {...p} sw={1.8}>
    <path d="M4 4h16v16H4z" />
    <path d="M4 9h16M9 4v16" />
  </Svg>
);

import {
  DashFrame, Topbar, Modal, ConfirmDialog, Donut, TrendChart, Avatar,
  tsMs, fmtMMSS, fmtClock, downloadCsv,
} from './DashShell.jsx';
import {
  IcoPlay, IcoStop, IcoRefresh, IcoUsers, IcoBook, IcoChart, IcoClock,
  IcoCheckCircle, IcoCopy, IcoTrash, IcoVideo, IcoDot, IcoGrid,
  IcoDownload, IcoChevronRight, IcoAlert, IcoUserPlus, IcoKey, IcoMonitor,
  IcoBell, IcoLibrary,
} from '../lib/sessionIcons.jsx';
import '../styles/teacher-ds.css';
import '../styles/teacher-mobile-fix.css';

/* ============================================================
   HELPERS
   ============================================================ */
const pctOf = (s) => (s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0);
const avgOf = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

function examStatus(ex, liveSession, now) {
  if (liveSession) return { key: 'live', label: 'Đang thi' };
  if (ex.opensAt && now < new Date(ex.opensAt).getTime()) return { key: 'soon', label: 'Chưa mở' };
  if (ex.closesAt && now > new Date(ex.closesAt).getTime()) return { key: 'closed', label: 'Đã đóng' };
  return { key: 'ready', label: 'Sẵn sàng' };
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

/* MỚI: Detect môn của đề dựa vào câu hỏi hoặc meta */
function detectExamSubject(exam) {
  if (exam.subject) return exam.subject;
  const q = exam.questions?.[0];
  if (q?.subject) return q.subject;
  return '—';
}

/* MỚI: Kiểm tra đề có phải do AI tạo không */
function isAiGeneratedExam(exam) {
  if (exam.source === 'ai' || exam.aiGenerated) return true;
  const firstQ = exam.questions?.[0];
  return Boolean(firstQ?.topic && firstQ?.level && firstQ?.qualityScore !== undefined);
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

  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [now, setNow] = useState(Date.now());

  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [shareClass, setShareClass] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [noticeClass, setNoticeClass] = useState(null);
  const [noticeDraft, setNoticeDraft] = useState('');
  const [noticeSaving, setNoticeSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamCreate, setShowExamCreate] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState(null);
  const [previewExam, setPreviewExam] = useState(null);

  const [confirmState, setConfirmState] = useState(null);
  const [toast, setToast] = useState(null);
  const [toastTone, setToastTone] = useState('info');
  const [startingId, setStartingId] = useState(null);

  const [allRetryRequests, setRetryRequests] = useState([]);
  const retryRequests = useMemo(
    () => allRetryRequests.filter((r) => classes.some((c) => c.id === r.classId)),
    [allRetryRequests, classes]
  );

  const [allowances, setAllowances] = useState({});
  const [retryNotes, setRetryNotes] = useState({});
  const [retryActioning, setRetryActioning] = useState(null);

  const toastTimer = useRef(null);
  const say = useCallback((text, tone = 'info') => {
    clearTimeout(toastTimer.current);
    setToast(text);
    setToastTone(tone);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const showAdminLink = checkAdmin(user);

  useEffect(() => {
    const hasLive = sessions.some((s) => s.status === 'live');
    if (!hasLive) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sessions]);

  const goSection = (key) => {
    setSection(key);
    setSubTab('all');
    setSearch('');
  };

  /* ---------- LOAD ---------- */
  const subsCacheRef = useRef({});

  const ensureExamSubmissions = useCallback(async (examId) => {
    if (!examId) return [];
    if (subsCacheRef.current[examId]) return subsCacheRef.current[examId];
    try {
      const subs = await getSubmissionsByExam(examId);
      subsCacheRef.current[examId] = subs;
      setSubmissionsMap((prev) => ({ ...prev, [examId]: subs }));
      return subs;
    } catch (err) {
      console.warn('[TeacherDashboard] load subs lỗi cho đề', examId, err);
      return [];
    }
  }, []);

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

  /* ============================================================
     FIX #5: Refresh trước khi mở AI Studio
     ============================================================ */
  const openNewExam = async () => {
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
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        requireApproval: true,
      });
      setNewClassName('');
      setShowCreateClass(false);
      await refresh();
      say('Đã tạo lớp mới', 'success');
    } catch (e) {
      say('Lỗi: ' + e.message, 'error');
    }
  };

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
      body: `Đề "${exam.title}" và toàn bộ bài nộp sẽ bị xóa. Không thể hoàn tác.`,
      okLabel: 'Xóa',
      danger: true,
      onOk: async () => {
        try {
          await deleteExamFs(exam.id);
          setExams((prev) => prev.filter((e) => e.id !== exam.id));
          delete subsCacheRef.current[exam.id];
          say('Đã xóa đề', 'success');
        } catch (e) {
          say('Lỗi: ' + e.message, 'error');
        }
      },
    });
  }, [say]);

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

  const reloadClass = async (id) => {
    const fresh = await getClassById(id);
    setSelectedClass(fresh);
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

  /* ============ DUYỆT THI LẠI ============ */
  const handleApproveRetry = async (req) => {
    const note = (retryNotes[req.id] || '').trim();
    setRetryActioning(req.id);
    const r = await approveRetry({
      permitId: req.id,
      teacherId: user.uid,
      note,
    });
    say(r.ok ? `Đã duyệt cho ${req.studentName} thi lại` : r.error, r.ok ? 'success' : 'error');
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
    say(r.ok ? `Đã từ chối ${req.studentName}` : r.error, r.ok ? 'success' : 'error');
    if (r.ok) {
      setRetryNotes((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
    }
    setRetryActioning(null);
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
    () => subsAll.filter((s) => (tsMs(s.submittedAt) || now) >= cutoff),
    [subsAll, cutoff, now]
  );

  const avgPct = Math.round(avgOf(subsInRange.map(pctOf)));
  const passRate = subsInRange.length
    ? Math.round((subsInRange.filter((s) => pctOf(s) >= 50).length / subsInRange.length) * 100)
    : 0;

  const classHealthGrade = useMemo(() => {
    if (!subsInRange.length) return { grade: 'A', label: 'Chưa có bài nộp' };
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

  const classInsights = useMemo(
    () => buildClassInsights({ exams, submissionsMap, rangeDays: range, now }),
    [exams, submissionsMap, range, now]
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

  const classById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);

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
      <Suspense fallback={<div className="vt"><div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải phòng giám sát...</p></div></div>}>
        <LiveProctorView
          sessionId={viewingSessionId}
          className={classById[vs?.classId]?.name}
          totalQuestions={vExam?.questions?.length || 0}
          onBack={() => setViewingSessionId(null)}
        />
      </Suspense>
    );
  }

  if (loading) {
    return (
      <div className="vt"><div className="vt-loading">
        <div className="page-loader-spinner" />
        <p>Đang tải...</p>
      </div></div>
    );
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
     NAV ITEMS — 5 MỤC CHÍNH CHO BOTTOM NAV MOBILE
     ------------------------------------------------------------
     Thứ tự: Tổng quan - Lớp học - Đề thi - Phòng thi - AI Tạo đề
     Các mục còn lại (Mô phỏng, Ngân hàng, Chấm phiếu, Xin thi lại,
     Quản trị) nằm trong extraNav — chỉ hiển thị trên desktop.
     ============================================================ */
  const navItems = [
    { key: 'overview', label: 'Tổng quan', Icon: IcoGrid },
    {
      key: 'classes',
      label: 'Lớp học',
      Icon: IcoUsers,
      badge: totalPendingMembers > 0 ? totalPendingMembers : null,
      live: totalPendingMembers > 0,
    },
    { key: 'exams', label: 'Đề thi', Icon: IcoBook },
    {
      key: 'sessions',
      label: 'Phòng thi',
      Icon: IcoVideo,
      badge: liveSessions.length || null,
      live: true,
    },
    { key: 'create', label: 'AI Tạo đề', Icon: IcoSparkles },
  ];

  /* Các mục phụ — chỉ hiển thị trên desktop */
  const extraNav = (
    <>
      <button
        type="button"
        className="t-rail-btn"
        onClick={() => goSection('simulator')}
        title="Mô phỏng & Đảo đề"
      >
        <span className="t-rail-btn-icon"><IcoShuffle size={20} /></span>
        <span className="t-rail-btn-label">Mô phỏng & Đảo đề</span>
      </button>
      <button
        type="button"
        className="t-rail-btn"
        onClick={() => goSection('bank')}
        title="Ngân hàng câu hỏi"
      >
        <span className="t-rail-btn-icon"><IcoLibrary size={20} /></span>
        <span className="t-rail-btn-label">Ngân hàng</span>
      </button>
      <button
        type="button"
        className="t-rail-btn"
        onClick={() => goSection('paper')}
        title="Chấm phiếu A4"
      >
        <span className="t-rail-btn-icon"><IcoScan size={20} /></span>
        <span className="t-rail-btn-label">Chấm phiếu A4</span>
      </button>
      <button
        type="button"
        className="t-rail-btn"
        onClick={() => goSection('retry')}
        title="Xin thi lại"
      >
        <span className="t-rail-btn-icon"><IcoBell size={20} /></span>
        <span className="t-rail-btn-label">Xin thi lại</span>
        {totalPendingRetry > 0 && <span className="t-rail-btn-badge">{totalPendingRetry}</span>}
      </button>
      {showAdminLink && (
        <button
          type="button"
          className="t-rail-btn"
          onClick={() => { window.location.hash = 'admin'; }}
          title="Sang trang quản trị hệ thống"
        >
          <span className="t-rail-btn-icon"><IcoMonitor size={20} /></span>
          <span className="t-rail-btn-label">Quản trị</span>
        </button>
      )}
    </>
  );

  const examsWithStatus = exams.map((ex) => {
    const liveSession = sessions.find((s) => s.examId === ex.id && s.status === 'live');
    return { ex, liveSession, st: examStatus(ex, liveSession, now) };
  });
  const countBy = (k) => examsWithStatus.filter((x) => x.st.key === k).length;

  const examTabs = [
    { key: 'all', label: 'Tất cả', count: exams.length },
    { key: 'live', label: 'Đang thi', count: countBy('live') },
    { key: 'ready', label: 'Sẵn sàng', count: countBy('ready') },
    { key: 'soon', label: 'Chưa mở', count: countBy('soon') },
    { key: 'closed', label: 'Đã đóng', count: countBy('closed') },
  ];
  const sessionTabs = [
    { key: 'all', label: 'Tất cả', count: sessions.length },
    { key: 'live', label: 'LIVE', count: sessions.filter((s) => s.status === 'live').length },
    { key: 'ended', label: 'Đã kết thúc', count: sessions.filter((s) => s.status === 'ended').length },
  ];

  const topProps = {
    overview: {
      title: `Chào ${user?.displayName || user?.email || 'thầy cô'}`,
      subtitle: 'Tổng quan lớp học và phòng thi của bạn',
    },
    classes: {
      title: 'Lớp học của tôi',
      subtitle: `${classes.length} lớp · ${classes.reduce((a, c) => a + (c.members?.length || 0), 0)} học sinh`,
      onSearch: setSearch,
      placeholder: 'Tìm lớp hoặc key...',
    },
    exams: {
      tabs: examTabs, active: subTab, onTab: setSubTab,
      onSearch: setSearch, placeholder: 'Tìm đề thi...',
    },
    sessions: {
      tabs: sessionTabs, active: subTab, onTab: setSubTab,
      onSearch: setSearch, placeholder: 'Tìm phiên thi...',
    },
    create: {
      title: 'AutoExam AI Studio',
      subtitle: 'Trợ lý AI tạo đề đa môn & Lập ma trận chuẩn Bộ GD&ĐT 2025',
    },
    simulator: {
      title: 'Bộ Xem Trước, Mô Phỏng & Đảo Đề',
      subtitle: 'Trải nghiệm thi như học sinh, xuất bản in A4 và tự động hoán vị 4 mã đề',
    },
    bank: {
      title: 'Ngân hàng câu hỏi',
      subtitle: 'Lưu trữ và tái sử dụng câu hỏi',
    },
    paper: {
      title: 'Chấm phiếu trắc nghiệm A4',
      subtitle: 'Nhận dạng phiếu tự động bằng Camera hoặc ảnh chụp',
    },
    retry: {
      title: 'Yêu cầu thi lại',
      subtitle: `${totalPendingRetry} yêu cầu đang chờ duyệt`,
    },
  }[section] || {};

  const goBell = () => {
    if (liveSessions.length === 1) setViewingSessionId(liveSessions[0].id);
    else goSection('sessions');
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <DashFrame
      items={navItems}
      active={section}
      onChange={goSection}
      fullscreen
      exitLabel="Về ELEC AI"
      onExit={() => {
        if (onExit) onExit();
        else window.location.hash = 'home';
      }}
      extraNav={extraNav}
    >
      <Topbar
        {...topProps}
        search={section !== 'create' && section !== 'simulator' && section !== 'retry' && section !== 'bank' ? search : undefined}
        bell={section !== 'create' && section !== 'bank' ? {
          on: liveSessions.length > 0 || totalPendingRetry > 0 || totalPendingMembers > 0,
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
            <BentoCard interactive onClick={() => goSection('exams')}>
              <StatBig
                value={exams.length}
                label="Đề thi đã biên soạn"
                suffix=" đề"
                delta={countBy('ready')}
                deltaLabel="sẵn sàng mở"
              />
            </BentoCard>
          </div>

          <div className="t-col-4">
            <BentoCard interactive onClick={exportAllCsv}>
              <StatBig
                value={subsInRange.length}
                label="Bài kiểm tra đã nộp"
                suffix=" bài"
                delta={passRate}
                deltaLabel="% đạt chuẩn (≥5.0)"
              />
            </BentoCard>
          </div>

          <div className="t-col-4">
            <BentoCard
              interactive
              tone={atRiskStudents.length > 0 ? 'dark' : 'default'}
              onClick={() => goSection('classes')}
            >
              <StatBig
                value={atRiskStudents.length}
                label="Học sinh cần kèm thêm"
                suffix=" HS"
                delta={atRiskStudents.length > 0 ? -atRiskStudents.length : 0}
                deltaLabel="dưới 50% điểm"
              />
            </BentoCard>
          </div>

          <div className="t-col-8">
            <BentoCard>
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
                      <BentoCard
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
                          <Avatar name={c.name} size={42} />
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--t-ink)' }}>
                              {c.name}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--t-ink-muted)' }}>
                              Key: <code style={{ color: 'var(--t-accent)', fontWeight: 700 }}>{c.key}</code>
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--t-border-subtle)' }}>
                          <span style={{ fontSize: '0.76rem', color: 'var(--t-ink-muted)' }}>
                            {membersCount} học sinh · {classExams.length} đề
                          </span>
                          <RatingDots count={5} filled={dotLevel} tone="lime" />
                        </div>
                      </BentoCard>
                    );
                  })}
                </div>
              )}
            </BentoCard>
          </div>

          <div className="t-col-4">
            <BentoCard tone="dark">
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
            </BentoCard>
          </div>

          <div className="t-col-8">
            <BentoCard>
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
            </BentoCard>
          </div>

          <div className="t-col-4">
            <BentoCard tone={liveSessions.length > 0 ? 'lime' : 'default'}>
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
                    onClick={goBell}
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
            </BentoCard>
          </div>

          <div className="t-col-12" style={{ marginTop: '0.5rem' }}>
            <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang chuẩn bị báo cáo AI sư phạm…</p></div>}>
              <InsightPanel
                insightsData={classInsights}
                className={classes[0]?.name || 'Toàn bộ lớp học'}
                subject="Hóa học"
                onOpenAiStudio={() => openNewExam()}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* ============================================================
          LỚP HỌC
         ============================================================ */}
      {section === 'classes' && (
        <div className="vt-grid">
          <button type="button" className="vt-card vt-add-card" onClick={() => setShowCreateClass(true)}>
            <span className="vt-fab static">+</span>
            <b>Tạo lớp mới</b>
            <small>Học sinh vào lớp bằng key</small>
          </button>

          {classes
            .filter((c) => !q || c.name?.toLowerCase().includes(q) || c.key?.toLowerCase().includes(q))
            .map((cls) => {
              const members = cls.members || [];
              const classExams = exams.filter((e) => e.classId === cls.id);
              const pendingCount = cls.pendingMembers?.length || 0;
              return (
                <article key={cls.id} className="vt-card vt-class">
                  <header>
                    <Avatar name={cls.name} size={52} />
                    <div>
                      <h3>{cls.name}</h3>
                      <small>{cls.subject} · {classExams.length} đề</small>
                    </div>
                    <i className="vt-count">{members.length}</i>
                  </header>

                  {pendingCount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.5rem',
                        padding: '.5rem .8rem',
                        borderRadius: 12,
                        background: 'color-mix(in srgb, #f59e0b 14%, var(--vt-tint))',
                        border: '1px solid color-mix(in srgb, #f59e0b 40%, transparent)',
                        color: '#b45309',
                        font: '700 .78rem var(--sans)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedClass(cls)}
                    >
                      <IcoBell size={14} />
                      <span style={{ flex: 1 }}>{pendingCount} học sinh chờ duyệt</span>
                      <IcoChevronRight size={14} />
                    </div>
                  )}

                  <div className="vt-keybox">
                    <IcoKey size={15} />
                    <code>{cls.key}</code>
                    <button
                      type="button"
                      className="vt-icon-btn"
                      onClick={() => copyText(cls.key, cls.id, 'Đã chép mã lớp')}
                      title="Sao chép mã"
                    >
                      {copiedKey === cls.id ? <IcoCheckCircle size={15} /> : <IcoCopy size={15} />}
                    </button>
                    <button
                      type="button"
                      className="vt-icon-btn"
                      onClick={() => setShareClass(cls)}
                      title="Mã QR"
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
                    {members.slice(0, 5).map((m) => <Avatar key={m.id} name={m.name} size={30} />)}
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
      )}

      {/* ============================================================
          ĐỀ THI — CÓ FILTER MÔN + BADGE AI
         ============================================================ */}
      {section === 'exams' && (() => {
        const list = examsWithStatus.filter(({ ex, st }) => {
          if (subTab !== 'all' && st.key !== subTab) return false;
          if (subjectFilter && detectExamSubject(ex) !== subjectFilter) return false;
          if (q && !ex.title?.toLowerCase().includes(q)) return false;
          return true;
        });

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
              <div className="vt-stackcards">
                {list.map(({ ex, liveSession, st }) => {
                  const cls = classById[ex.classId];
                  const subs = submissionsMap[ex.id] || [];
                  const pcts = subs.map(pctOf);
                  const avg = subs.length ? Math.round(avgOf(pcts)) : null;
                  const best = subs.length ? Math.round(Math.max(...pcts)) : null;
                  const link = `${window.location.origin}${window.location.pathname}#exam/${ex.token}`;
                  const memberCount = cls?.members?.length || 0;
                  const subject = detectExamSubject(ex);
                  const isAi = isAiGeneratedExam(ex);
                  const typeCount = (() => {
                    const t = { single_choice: 0, true_false: 0, short_answer: 0 };
                    (ex.questions || []).forEach((q) => {
                      const k = q.type || 'single_choice';
                      t[k] = (t[k] || 0) + 1;
                    });
                    return t;
                  })();

                  return (
                    <article key={ex.id} className={'vt-card vt-exam' + (st.key === 'live' ? ' live' : '')}>
                      <div className="vt-exam-main">
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span className={'vt-chip ' + st.key}>
                            {st.key === 'live' && <IcoDot size={7} />} {st.label}
                          </span>
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
                        </div>
                        <h3>{ex.title}</h3>
                        <small>
                          Lớp {cls?.name || '—'} · {ex.questions.length} câu · {ex.duration} phút
                          {typeCount.true_false > 0 && ` · ${typeCount.true_false} Đ/S`}
                          {typeCount.short_answer > 0 && ` · ${typeCount.short_answer} TLN`}
                        </small>
                        <div className="vt-linkbox">
                          <code title={link}>{link}</code>
                          <button
                            type="button"
                            className="vt-icon-btn"
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
                            <IcoVideo size={14} /> Giám sát
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
                            title="Mô phỏng thi, bản in A4 và đảo 4 mã đề"
                          >
                            <IcoEye size={13} /> Xem trước & In A4
                          </button>
                          <button type="button" className="vt-btn sm" onClick={() => setSelectedExam(ex)}>
                            <IcoChart size={13} /> Thống kê
                          </button>
                          <button
                            type="button"
                            className="vt-icon-btn"
                            onClick={() => (subs.length ? exportExamCsv(ex, subs) : say('Chưa có bài nộp để xuất', 'error'))}
                            title="Xuất điểm CSV"
                          >
                            <IcoDownload size={15} />
                          </button>
                          <button
                            type="button"
                            className="vt-icon-btn danger"
                            onClick={() => handleDeleteExam(ex)}
                            title="Xóa đề"
                          >
                            <IcoTrash size={15} />
                          </button>
                        </div>
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
          PHÒNG THI
         ============================================================ */}
      {section === 'sessions' && (() => {
        const list = sessions.filter((s) =>
          (subTab === 'all' || s.status === subTab) && (!q || s.title?.toLowerCase().includes(q))
        );
        return (
          <>
            <div className="vt-range">
              <h2>Phiên thi</h2>
              <button type="button" className="vt-btn sm" onClick={refresh}>
                <IcoRefresh size={13} /> Làm mới
              </button>
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
              <div className="vt-grid">
                {list.map((s) => {
                  const exam = exams.find((e) => e.id === s.examId);
                  const remaining = timeRemaining(s, now);
                  const isLive = s.status === 'live';
                  const expired = isLive && remaining <= 0;
                  const total = (s.duration || 1) * 60;
                  const joined = s.stats?.joined || 0;
                  const submitted = s.stats?.submitted || 0;
                  const viol = s.stats?.violationCount || 0;
                  const tone = remaining < 60 ? 'danger' : remaining < 300 ? 'warn' : 'acc';
                  return (
                    <article key={s.id} className={'vt-card vt-session' + (isLive ? ' live' : ' ended')}>
                      <header>
                        <span className={'vt-chip ' + (isLive ? (expired ? 'closed' : 'live') : 'closed')}>
                          <IcoDot size={7} /> {isLive ? (expired ? 'Hết giờ' : 'LIVE') : 'Đã kết thúc'}
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
                        </div>
                      </div>

                      <dl className="vt-mini-stats">
                        <div><dd>{joined}</dd><dt>Đã vào</dt></div>
                        <div><dd>{submitted}</dd><dt>Đã nộp</dt></div>
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
          MÔ PHỎNG, BẢN IN A4 & ĐẢO 4 MÃ ĐỀ
         ============================================================ */}
      {section === 'simulator' && (
        <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải bộ mô phỏng...</p></div>}>
          <TeacherSimulatorHub
            teacherExams={exams}
            classes={classes}
          />
        </Suspense>
      )}

      {/* ============================================================
          NGÂN HÀNG
         ============================================================ */}
      {section === 'bank' && (
        <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải ngân hàng...</p></div>}>
          <QuestionBank classes={classes} onSoftExamCreated={() => refresh()} />
        </Suspense>
      )}

      {/* ============================================================
          CHẤM PHIẾU A4 (OMR)
         ============================================================ */}
      {section === 'paper' && (
        <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải chấm phiếu A4...</p></div>}>
          <PaperGrading classes={classes} exams={exams} />
        </Suspense>
      )}

      {/* ============================================================
          XIN THI LẠI
         ============================================================ */}
      {section === 'retry' && (() => {
        const pending = retryRequests.filter((r) => r.status === 'pending');
        return (
          <>
            <div className="vt-range">
              <h2>Yêu cầu thi lại</h2>
              <button type="button" className="vt-btn sm" onClick={() => say('Đã làm mới', 'success')}>
                <IcoRefresh size={13} /> Làm mới
              </button>
            </div>

            {pending.length === 0 ? (
              <div className="vt-empty">
                <span><IcoBell size={30} /></span>
                <h3>Không có yêu cầu nào</h3>
                <p>Khi học sinh bấm "Xin cô cho thi lại", yêu cầu sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              <div className="vt-stackcards">
                {pending.map((r) => {
                  const exam = exams.find((e) => e.id === r.examId);
                  const cls = classById[r.classId];
                  const isActing = retryActioning === r.id;
                  return (
                    <article key={r.id} className="vt-card">
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <Avatar name={r.studentName} size={48} />
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h3 style={{ margin: 0, font: '800 1.05rem var(--sans)', letterSpacing: '-.02em' }}>
                            {r.studentName}
                          </h3>
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
                              {r.reason}
                            </p>
                          )}
                          <p style={{ margin: '.5rem 0 0', color: 'var(--mut)', font: '500 .74rem var(--sans)' }}>
                            Gửi cách đây {Math.round((Date.now() - (r.requestedAtMs || tsMs(r.requestedAt))) / 60000)} phút
                          </p>

                          <input
                            type="text"
                            placeholder="Ghi chú gửi học sinh (không bắt buộc)"
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
                        </div>
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
        <Suspense fallback={<div className="vt-loading"><div className="page-loader-spinner" /><p>Đang tải AI Studio...</p></div>}>
          <CreateExamPage
            classInfo={selectedClass || classes[0]}
            classes={classes}
            classInsights={classInsights}
            grades={[]}
            subjects={[]}
            onDone={async () => {
              subsCacheRef.current = {};
              await refresh();
              setSelectedClass(null);
              goSection('exams');
            }}
            onCancel={() => {
              setSelectedClass(null);
              goSection('overview');
            }}
          />
        </Suspense>
      )}

      {/* ============ TOAST ============ */}
      {toast && (
        <div
          className={'vt-toast' + (toastTone === 'error' ? ' error' : toastTone === 'success' ? ' success' : '')}
          role="status"
        >
          {toast}
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
          <label className="vt-field">
            <span>Tên lớp</span>
            <input
              autoFocus
              placeholder="VD: 10A1"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
              maxLength={20}
            />
          </label>
          <p className="vt-muted">
            Sau khi tạo, bạn sẽ có key để gửi cho học sinh. Học sinh nhập key sẽ chờ bạn duyệt mới vào lớp.
          </p>
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
                  <Avatar name={c.name} size={44} />
                  <div><b>{c.name}</b><small>{c.members?.length || 0} học sinh</small></div>
                  <IcoChevronRight size={14} />
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* ============ CHI TIẾT LỚP ============ */}
      {selectedClass && !showExamCreate && section !== 'create' && (
        <ClassDetailModal
          classInfo={selectedClass}
          exams={exams.filter((e) => e.classId === selectedClass.id)}
          onClose={() => setSelectedClass(null)}
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

      {/* ============ MODAL XEM TRƯỚC ============ */}
      {previewExam && (
        <Suspense fallback={null}>
          <ExamPreviewSimulator
            exam={previewExam}
            questions={previewExam.questions || []}
            onClose={() => setPreviewExam(null)}
          />
        </Suspense>
      )}
    </DashFrame>
  );
}

/* ============================================================
   THỐNG KÊ ĐỀ
   ============================================================ */
function ExamStats({ exam, subs, onExport }) {
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
          <h4><IcoAlert size={14} /> Cần xem lại ({flagged.length})</h4>
          <ul className="vt-flag">
            {flagged.map((s) => (
              <li key={s.id}>
                <Avatar name={s.studentName} size={30} />
                <b>{s.studentName}</b>
                <span>{s.violationCount || 0} vi phạm{s.autoSubmitted ? ' · tự động nộp' : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <header className="vt-card-head">
          <h4>Bảng xếp hạng</h4>
          <button type="button" className="vt-btn sm" onClick={onExport}>
            <IcoDownload size={13} /> Xuất CSV
          </button>
        </header>
        <ol className="vt-rank">
          {sorted.map((s, i) => (
            <li key={s.id}>
              <span className={'vt-rank-n r' + (i < 3 ? i + 1 : 0)}>{i + 1}</span>
              <Avatar name={s.studentName} size={32} />
              <b>{s.studentName}</b>
              <small>{s.correctCount}/{s.totalQuestions} đúng</small>
              <span className="vt-rank-score">{s.score}/{s.totalPoints}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}