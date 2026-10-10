/* ============================================================
   TeacherDashboard.jsx — Quản lý lớp học (Vitality) v2
   ------------------------------------------------------------
   Sidebar: Tổng quan | Lớp học | Đề thi | Phòng thi | Tạo đề
   Nút "Quản trị" chỉ hiện nếu user là admin.
   ------------------------------------------------------------
   Tích hợp:
     • ClassDetailModal v2 (tab Chờ duyệt + Xin thi lại)
     • LiveProctorView
     • CreateExamPage
     • Duyệt thành viên lớp (pending members)
     • Duyệt thi lại (retry requests) + bật allowance
   ============================================================ */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { getUserRole } from '../lib/userRole.js';
import {
  getClassesByTeacher,
  getExamsByTeacher,
  getSubmissionsByExam,
  createClass,
  removeClassMember,
  deleteExam as deleteExamFs,
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
import LiveProctorView from './LiveProctorView.jsx';
import CreateExamPage from './teacher/CreateExamPage.jsx';
import ClassDetailModal from './ClassDetailModal.jsx';
import {
  DashFrame, Topbar, Modal, ConfirmDialog, Donut, TrendChart, Avatar,
  tsMs, fmtMMSS, fmtClock, downloadCsv,
} from './DashShell.jsx';
import {
  IcoPlay, IcoStop, IcoRefresh, IcoUsers, IcoBook, IcoChart, IcoClock,
  IcoCheckCircle, IcoCopy, IcoTrash, IcoVideo, IcoDot, IcoGrid,
  IcoDownload, IcoChevronRight, IcoAlert, IcoUserPlus, IcoKey, IcoMonitor,
  IcoBell,
} from '../lib/sessionIcons.jsx';
import '../styles/classroom.css';

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

/* ============================================================
   MAIN
   ============================================================ */
export default function TeacherDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState('overview');
  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('30');
  const [chartMode, setChartMode] = useState('line');

  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamCreate, setShowExamCreate] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState(null);

  const [confirmState, setConfirmState] = useState(null);
  const [toast, setToast] = useState(null);
  const [startingId, setStartingId] = useState(null);

  /* Retry requests realtime */
  const [allRetryRequests, setRetryRequests] = useState([]);
  // listenRetryRequests trả về yêu cầu của MỌI giáo viên → chỉ giữ lớp của mình
  const retryRequests = useMemo(
    () => allRetryRequests.filter((r) => classes.some((c) => c.id === r.classId)),
    [allRetryRequests, classes]
  );

  /* Allowances cho lớp đang chọn */
  const [allowances, setAllowances] = useState({});

  const toastTimer = useRef(null);
  const say = useCallback((text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  /* ---------- CHECK ADMIN ---------- */
  const isAdmin = useMemo(() => getUserRole(user) === 'admin', [user]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const goSection = (key) => {
    setSection(key);
    setSubTab('all');
    setSearch('');
  };

  /* ---------- LOAD ---------- */
  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const [cls, ex, sess] = await Promise.all([
        getClassesByTeacher(user.uid),
        getExamsByTeacher(user.uid),
        getSessionsByTeacher(user.uid),
      ]);
      setClasses(cls);
      setExams(ex);
      setSessions(sess);

      const subsMap = {};
      await Promise.all(ex.map(async (e) => {
        subsMap[e.id] = await getSubmissionsByExam(e.id);
      }));
      setSubmissionsMap(subsMap);
    } catch (err) {
      console.error('[TeacherDashboard] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

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

  /* Realtime retry requests — chỉ các lớp của giáo viên này */
  const classIdsKey = classes.map((c) => c.id).sort().join(',');
  useEffect(() => {
    if (!user?.uid) return undefined;
    const ids = classIdsKey ? classIdsKey.split(',') : [];
    const unsub = listenRetryRequestsByClasses(
      ids,
      (list) => setRetryRequests(list || []),
      (err) => say(`Không đọc được yêu cầu thi lại (${err.code || 'lỗi'}). Kiểm tra Firestore Rules.`)
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

  /* ---------- ACTIONS ---------- */
  const copyText = useCallback(async (text, keyId, msg = 'Đã sao chép') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      say(msg);
      setTimeout(() => setCopiedKey(null), 1400);
    } catch {
      say('Không sao chép được');
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
      say('Đã tạo lớp mới');
    } catch (e) {
      say('Lỗi: ' + e.message);
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
      say('Đã bắt đầu phòng thi!');
      goSection('sessions');
    } catch (e) {
      say('Không tạo được phòng thi: ' + e.message);
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
          say('Đã kết thúc phòng thi');
        } catch (e) {
          say('Lỗi: ' + e.message);
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
        try { await deleteExamSession(s.id); } catch { /* */ }
        setSessions((prev) => prev.filter((x) => x.id !== s.id));
        say('Đã xóa phiên');
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
          say('Đã xóa đề');
        } catch (e) {
          say('Lỗi: ' + e.message);
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
          say('Đã xóa thành viên');
        } catch (e) {
          say('Lỗi: ' + e.message);
        }
      },
    });
  };

  /* ============ DUYỆT THÀNH VIÊN ============ */
  const reloadClass = async (id) => {
    const fresh = await getClassById(id);
    setSelectedClass(fresh);
  };

  const handleApprove = async (cls, sid) => {
    const r = await approveMember(cls.id, sid);
    say(r.ok ? 'Đã duyệt vào lớp' : r.error);
    if (r.ok) { await reloadClass(cls.id); await refresh(); }
  };

  const handleReject = async (cls, sid) => {
    const r = await rejectMember(cls.id, sid);
    say(r.ok ? 'Đã từ chối' : r.error);
    if (r.ok) { await reloadClass(cls.id); await refresh(); }
  };

  const handleApproveAll = async (cls) => {
    const r = await approveAllMembers(cls.id);
    say(r.ok ? `Đã duyệt ${r.count || ''} yêu cầu` : r.error);
    if (r.ok) { await reloadClass(cls.id); await refresh(); }
  };

  const handleToggleApproval = async (cls, v) => {
    await setClassApproval(cls.id, v);
    await reloadClass(cls.id);
    await refresh();
    say(v ? 'Bật duyệt thành viên' : 'Tắt duyệt thành viên');
  };

  /* ============ DUYỆT THI LẠI ============ */
  const handleApproveRetry = async (req) => {
    const r = await approveRetry({
      permitId: req.id,
      teacherId: user.uid,
      note: '',
    });
    say(r.ok ? `Đã duyệt cho ${req.studentName} thi lại` : r.error);
    if (r.ok) {
      // refresh requests
      /* listener realtime tự cập nhật */
    }
  };

  const handleDenyRetry = async (req) => {
    const r = await denyRetry({
      permitId: req.id,
      teacherId: user.uid,
      note: '',
    });
    say(r.ok ? `Đã từ chối ${req.studentName}` : r.error);
    if (r.ok) {
      /* listener realtime tự cập nhật */
    }
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
      say(allowed ? `Đã bật thi lại cho ${m.name}` : `Đã khóa thi lại của ${m.name}`);
    } else {
      say(r.error || 'Lỗi');
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

  /* Tổng số yêu cầu chờ duyệt (cả lớp + thi lại) */
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

  const openNewExam = () => {
    if (classes.length === 0) { say('Hãy tạo lớp trước khi tạo đề'); goSection('classes'); return; }
    if (classes.length === 1) { setSelectedClass(classes[0]); goSection('create'); return; }
    setShowClassPicker(true);
  };

  const exportAllCsv = () => {
    if (subsInRange.length === 0) { say('Chưa có bài nộp để xuất'); return; }
    const examTitle = Object.fromEntries(exams.map((e) => [e.id, e.title]));
    const rows = [['Đề', 'Họ tên', 'Điểm', 'Tổng điểm', '%', 'Câu đúng', 'Tổng câu', 'Vi phạm']];
    subsInRange.forEach((s) => rows.push([
      examTitle[s.examId] || s.examId, s.studentName, s.score, s.totalPoints,
      Math.round(pctOf(s)), s.correctCount, s.totalQuestions, s.violationCount || 0,
    ]));
    downloadCsv('bang-diem-tong-hop.csv', rows);
    say('Đã xuất bảng điểm');
  };

  const exportClassCsv = useCallback((cls, clsExams, subsMap) => {
    if (!cls || !clsExams?.length) { say('Chưa có dữ liệu để xuất'); return; }
    const members = cls.members || [];
    const header = ['Học sinh', 'Email', ...clsExams.map((e, i) => `Đề ${i + 1}`), 'Điểm TB'];
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
      const avg = scores.length ? Math.round(Math.max(...scores)) : '';
      row.push(avg === '' ? '' : `${avg}%`);
      rows.push(row);
    });

    const safe = cls.name.replace(/[^\p{L}\p{N}]+/gu, '-');
    downloadCsv(`bang-diem-${safe}.csv`, rows);
    say('Đã xuất bảng điểm lớp ' + cls.name);
  }, [say]);

  /* ---------- EARLY RETURN ---------- */
  if (viewingSessionId) {
    const vs = sessions.find((s) => s.id === viewingSessionId);
    const vExam = exams.find((e) => e.id === vs?.examId);
    return (
      <LiveProctorView
        sessionId={viewingSessionId}
        className={classById[vs?.classId]?.name}
        totalQuestions={vExam?.questions?.length || 0}
        onBack={() => setViewingSessionId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="vt"><div className="vt-loading">
        <div className="page-loader-spinner" />
        <p>Đang tải…</p>
      </div></div>
    );
  }

  /* ---------- NAV ---------- */
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
    { key: 'sessions', label: 'Phòng thi', Icon: IcoVideo, badge: liveSessions.length || null, live: true },
    { key: 'create', label: 'Tạo đề', Icon: IcoBook },
    {
      key: 'retry',
      label: 'Xin thi lại',
      Icon: IcoBell,
      badge: totalPendingRetry > 0 ? totalPendingRetry : null,
      live: totalPendingRetry > 0,
    },
  ];

  const extraNav = isAdmin ? (
    <button
      type="button"
      className="vt-nav-item"
      onClick={() => { window.location.hash = 'admin'; }}
      title="Sang trang quản trị hệ thống"
    >
      <IcoMonitor size={18} />
      <span>Quản trị</span>
    </button>
  ) : null;

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
      placeholder: 'Tìm lớp hoặc key…',
    },
    exams: {
      tabs: examTabs, active: subTab, onTab: setSubTab,
      onSearch: setSearch, placeholder: 'Tìm đề thi…',
    },
    sessions: {
      tabs: sessionTabs, active: subTab, onTab: setSubTab,
      onSearch: setSearch, placeholder: 'Tìm phiên thi…',
    },
    create: {
      title: 'Tạo đề mới',
      subtitle: 'Thủ công hoặc để AI sinh từ ảnh, PDF, Word, Excel',
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
      onExit={() => { window.location.hash = ''; }}
      extraNav={extraNav}
    >
      <Topbar
        {...topProps}
        search={section !== 'create' && section !== 'retry' ? search : undefined}
        bell={section !== 'create' ? {
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
          TỔNG QUAN
         ============================================================ */}
      {section === 'overview' && (
        <>
          <div className="vt-row-hero">
            <div className="vt-hero">
              <div className="vt-hero-left">
                <span className="vt-hero-label">Phòng thi LIVE</span>
                <div className="vt-hero-num">
                  <b>{liveSessions.length}</b>
                  <span>phiên</span>
                </div>
                <dl className="vt-hero-facts">
                  <div><dt>Đang làm bài</dt><dd>{roomStudents} HS</dd></div>
                  <div><dt>Vi phạm</dt><dd>{roomViol}</dd></div>
                </dl>
                {liveSessions.length > 0 && (
                  <button type="button" className="vt-hero-btn" onClick={goBell}>
                    <IcoVideo size={14} /> Vào giám sát
                  </button>
                )}
              </div>
              <div className="vt-hero-right">
                <div className="vt-hero-chart-head">
                  <b>Xu hướng điểm TB theo đề</b>
                  <div className="vt-seg" role="group">
                    <button type="button" className={chartMode === 'line' ? 'on' : ''} onClick={() => setChartMode('line')}>
                      <IcoChart size={14} />
                    </button>
                    <button type="button" className={chartMode === 'bar' ? 'on' : ''} onClick={() => setChartMode('bar')}>
                      <IcoGrid size={14} />
                    </button>
                  </div>
                </div>
                <TrendChart points={trend} mode={chartMode} max={100} />
                <p className="vt-hero-foot">{trend.length} đề gần nhất có bài nộp</p>
              </div>
            </div>

            <div className="vt-card vt-ring-card">
              <header><b>Điểm trung bình</b><small>{range === 'all' ? 'Tất cả' : `${range} ngày`}</small></header>
              <Donut value={avgPct} size={138} stroke={13}>
                <strong>{avgPct}<sup>%</sup></strong>
                <small>{subsInRange.length} bài</small>
              </Donut>
              <footer>
                <span>Đạt ≥ 50%</span><b>{passRate}%</b>
              </footer>
            </div>
          </div>

          <div className="vt-range">
            <h2>Xem theo thời gian</h2>
            <div className="vt-pills">
              {[['7', '7 ngày'], ['30', '30 ngày'], ['all', 'Tất cả']].map(([k, l]) => (
                <button key={k} type="button" className={'vt-pill' + (range === k ? ' on' : '')} onClick={() => setRange(k)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="vt-cols">
            <div className="vt-col">
              <div className="vt-card soft">
                <h3 className="vt-card-title">Tạo nhanh</h3>
                <div className="vt-quick">
                  <button type="button" className="vt-qa" onClick={() => { goSection('classes'); setShowCreateClass(true); }}>
                    <span><IcoUserPlus size={22} /></span><small>Lớp mới</small>
                  </button>
                  <button type="button" className="vt-qa" onClick={openNewExam}>
                    <span><IcoBook size={22} /></span><small>Tạo đề</small>
                  </button>
                  <button type="button" className="vt-qa" onClick={() => goSection('sessions')}>
                    <span><IcoVideo size={22} /></span><small>Phòng thi</small>
                  </button>
                  <button type="button" className="vt-qa" onClick={exportAllCsv}>
                    <span><IcoDownload size={22} /></span><small>Xuất điểm</small>
                  </button>
                  <button type="button" className="vt-fab" onClick={openNewExam} aria-label="Tạo đề mới">+</button>
                </div>
              </div>

              <div className="vt-card soft">
                <header className="vt-card-head">
                  <h3 className="vt-card-title">Đề thi gần đây</h3>
                  <button type="button" className="vt-link" onClick={() => goSection('exams')}>
                    Xem tất cả <IcoChevronRight size={12} />
                  </button>
                </header>
                {recentExams.length === 0 ? (
                  <p className="vt-muted">Chưa có đề nào. Bấm dấu + để tạo đề đầu tiên.</p>
                ) : (
                  <ul className="vt-list">
                    {recentExams.map((ex) => {
                      const subs = submissionsMap[ex.id] || [];
                      const live = sessions.find((s) => s.examId === ex.id && s.status === 'live');
                      return (
                        <li key={ex.id}>
                          <span className="vt-list-ico"><IcoBook size={18} /></span>
                          <div className="vt-list-main">
                            <b>{ex.title}</b>
                            <small>Lớp {classById[ex.classId]?.name || '—'} · {subs.length} bài nộp</small>
                          </div>
                          {live ? (
                            <button type="button" className="vt-btn sm primary" onClick={() => setViewingSessionId(live.id)}>
                              <IcoVideo size={13} /> Giám sát
                            </button>
                          ) : (
                            <button type="button" className="vt-btn sm" onClick={() => setSelectedExam(ex)}>
                              <IcoChart size={13} /> Thống kê
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <aside className="vt-col side">
              <header className="vt-group-head">
                <h2>Lớp của tôi</h2>
                <button type="button" className="vt-icon-btn" onClick={() => goSection('classes')}>
                  <IcoChevronRight size={14} />
                </button>
              </header>
              {classes.length === 0 ? (
                <p className="vt-muted">Chưa có lớp nào.</p>
              ) : (
                <ul className="vt-group">
                  {[...classes]
                    .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))
                    .slice(0, 6)
                    .map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => setSelectedClass(c)}>
                          <Avatar name={c.name} size={46} />
                          <div>
                            <b>{c.name}</b>
                            <small>Key {c.key}</small>
                          </div>
                          <i className="vt-count">{c.members?.length || 0}</i>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </aside>
          </div>
        </>
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

                  {/* Badge chờ duyệt */}
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
                      onClick={() => copyText(cls.key, cls.id, 'Đã chép key lớp')}
                      title="Sao chép key"
                    >
                      {copiedKey === cls.id ? <IcoCheckCircle size={15} /> : <IcoCopy size={15} />}
                    </button>
                  </div>

                  <div className="vt-stack">
                    {members.slice(0, 5).map((m) => <Avatar key={m.id} name={m.name} size={30} />)}
                    {members.length > 5 && <span className="vt-stack-more">+{members.length - 5}</span>}
                    {members.length === 0 && <small className="vt-muted">Chưa có học sinh tham gia</small>}
                  </div>

                  <footer>
                    <button type="button" className="vt-btn sm" onClick={() => setSelectedClass(cls)}>
                      <IcoUsers size={13} /> Xem chi tiết
                    </button>
                    <button
                      type="button"
                      className="vt-btn sm primary"
                      onClick={() => { setSelectedClass(cls); goSection('create'); }}
                    >
                      <IcoBook size={13} /> Tạo đề
                    </button>
                  </footer>
                </article>
              );
            })}
        </div>
      )}

      {/* ============================================================
          ĐỀ THI
         ============================================================ */}
      {section === 'exams' && (() => {
        const list = examsWithStatus.filter(({ ex, st }) =>
          (subTab === 'all' || st.key === subTab) && (!q || ex.title?.toLowerCase().includes(q))
        );
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
        if (list.length === 0) {
          return (
            <div className="vt-empty">
              <span><IcoBook size={30} /></span>
              <h3>Không có đề phù hợp</h3>
              <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          );
        }
        return (
          <div className="vt-stackcards">
            {list.map(({ ex, liveSession, st }) => {
              const cls = classById[ex.classId];
              const subs = submissionsMap[ex.id] || [];
              const pcts = subs.map(pctOf);
              const avg = subs.length ? Math.round(avgOf(pcts)) : null;
              const best = subs.length ? Math.round(Math.max(...pcts)) : null;
              const link = `${window.location.origin}${window.location.pathname}#exam/${ex.token}`;
              const memberCount = cls?.members?.length || 0;
              return (
                <article key={ex.id} className={'vt-card vt-exam' + (st.key === 'live' ? ' live' : '')}>
                  <div className="vt-exam-main">
                    <span className={'vt-chip ' + st.key}>
                      {st.key === 'live' && <IcoDot size={7} />} {st.label}
                    </span>
                    <h3>{ex.title}</h3>
                    <small>Lớp {cls?.name || '—'} · {ex.questions.length} câu · {ex.duration} phút</small>
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
                        {startingId === ex.id ? 'Đang tạo…' : <><IcoPlay size={14} /> Bắt đầu thi</>}
                      </button>
                    )}
                    <div className="vt-exam-actions-row">
                      <button type="button" className="vt-btn sm" onClick={() => setSelectedExam(ex)}>
                        <IcoChart size={13} /> Thống kê
                      </button>
                      <button
                        type="button"
                        className="vt-icon-btn"
                        onClick={() => (subs.length ? exportExamCsv(ex, subs) : say('Chưa có bài nộp để xuất'))}
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
          XIN THI LẠI — GV duyệt
         ============================================================ */}
      {section === 'retry' && (() => {
        const pending = retryRequests.filter((r) => r.status === 'pending');
        return (
          <>
            <div className="vt-range">
              <h2>Yêu cầu thi lại</h2>
              <button type="button" className="vt-btn sm" onClick={async () => {
                /* listener realtime tự cập nhật */
                say('Đã làm mới');
              }}>
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
                              "{r.reason}"
                            </p>
                          )}
                          <p style={{ margin: '.5rem 0 0', color: 'var(--mut)', font: '500 .74rem var(--sans)' }}>
                            Gửi cách đây {Math.round((Date.now() - (r.requestedAtMs || tsMs(r.requestedAt))) / 60000)} phút
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="vt-btn primary"
                            onClick={() => handleApproveRetry(r)}
                          >
                            <IcoCheckCircle size={14} /> Duyệt
                          </button>
                          <button
                            type="button"
                            className="vt-btn danger"
                            onClick={() => handleDenyRetry(r)}
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
          TẠO ĐỀ
         ============================================================ */}
      {section === 'create' && (
        classes.length > 1 && !selectedClass ? (
          <div className="vt-empty">
            <span><IcoBook size={30} /></span>
            <h3>Chọn lớp để tạo đề</h3>
            <p>Bạn có nhiều lớp — chọn 1 lớp trước khi tạo đề.</p>
            <button
              type="button"
              className="vt-btn primary"
              onClick={() => setShowClassPicker(true)}
            >
              <IcoUsers size={14} /> Chọn lớp
            </button>
          </div>
        ) : (
          <CreateExamPage
            classInfo={selectedClass || classes[0]}
            grades={[]}
            subjects={[]}
            onDone={async () => {
              await refresh();
              setSelectedClass(null);
              goSection('exams');
            }}
            onCancel={() => {
              setSelectedClass(null);
              goSection('overview');
            }}
          />
        )
      )}

      {/* ============ TOAST ============ */}
      {toast && <div className="vt-toast" role="status">{toast}</div>}

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
            await refresh();
            setShowExamCreate(false);
            setSelectedClass(null);
            say('Đã tạo đề');
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
    return { i, text: qq.q, rate: rated.length ? Math.round((ok / rated.length) * 100) : null };
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
              <small>{i * 20}–{i === 4 ? 100 : i * 20 + 19}%</small>
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