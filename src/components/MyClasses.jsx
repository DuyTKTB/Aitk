/* ============================================================
   MyClasses.jsx — Trang "Lớp học của tôi" cho học sinh (v5 — lớp học 3D toàn màn hình)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getClassesByStudent,
  getPendingClassesByStudent,
  joinClassByKey,
  getExamsByClass,
  getSubmissionForStudent,
  getAttempt,
  requestRetry,
} from '../lib/classroom.js';
import RetryRequestModal from './RetryRequestModal.jsx';
import '../styles/my-classes.css';
import '../styles/my-classes-3d.css';
import '../styles/dash-vitality.css';

/* ============================================================
   SVG ICONS
   ============================================================ */
const Svg = ({ size = 18, sw = 1.8, children, title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : 'true'}
    focusable="false"
  >
    {children}
  </svg>
);

const IconBook = (p) => (
  <Svg {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
    <path d="M4 20a2 2 0 0 0 2 1h13v-3" />
    <path d="M8 7h7" />
  </Svg>
);
const IconKey = (p) => (
  <Svg {...p}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </Svg>
);
const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5S15 16.6 15.6 20" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16 14.5c2.4.3 4.3 2.1 4.8 4.8" />
  </Svg>
);
const IconPlay = (p) => (
  <Svg {...p}>
    <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
  </Svg>
);
const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
const IconCheckCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l3 3 5-6" />
  </Svg>
);
const IconBan = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6l12.8 12.8" />
  </Svg>
);
const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Svg>
);
const IconRefresh = (p) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.2L4 8.5M4 4v4.5h4.5" />
    <path d="M4 13a8 8 0 0 0 14.3 4.2L20 15.5M20 20v-4.5h-4.5" />
  </Svg>
);
const IconTrendUp = (p) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Svg>
);
const IconAlert = (p) => (
  <Svg {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="17.2" r=".6" fill="currentColor" />
  </Svg>
);
const IconChevron = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
const IconBell = (p) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);
const IconHourglass = (p) => (
  <Svg {...p}>
    <path d="M6 2h12M6 22h12M6 2v4c0 3 3 5 6 6-3 1-6 3-6 6v4M18 2v4c0 3-3 5-6 6 3 1 6 3 6 6v4" />
  </Svg>
);
const IconLock = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

const IconExpand = (p) => (
  <Svg {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Svg>
);
const IconShrink = (p) => (
  <Svg {...p}>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </Svg>
);
const IconCube = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </Svg>
);
const IconList = (p) => (
  <Svg {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </Svg>
);
const IconMedal = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="15" r="5" />
    <path d="M8.5 3l3.5 6 3.5-6M12 12.5v5" />
  </Svg>
);

/* ============================================================
   HELPERS
   ============================================================ */
const lsGet = (k, d) => {
  try { return localStorage.getItem(k) || d; } catch { return d; }
};
const lsSet = (k, v) => {
  try { localStorage.setItem(k, v); } catch { /* bỏ qua */ }
};

const tsMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (v?.seconds) return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const fmtDeadline = (deadline) => {
  if (!deadline) return null;
  const now = Date.now();
  const ms = tsMs(deadline);
  const diff = ms - now;

  if (diff <= 0) {
    const over = Math.floor(-diff / 86400000);
    return { text: over === 0 ? 'Quá hạn hôm nay' : `Quá hạn ${over} ngày`, tone: 'over' };
  }

  const h = Math.floor(diff / 3600000);
  if (h < 1) return { text: `Còn ${Math.max(1, Math.floor(diff / 60000))} phút`, tone: 'urgent' };
  if (h < 24) return { text: `Còn ${h} giờ`, tone: 'urgent' };

  const d = Math.floor(diff / 86400000);
  if (d < 3) return { text: `Còn ${d} ngày`, tone: 'soon' };
  return { text: `Còn ${d} ngày`, tone: 'normal' };
};

const subjectColor = (subject) => {
  const s = String(subject || '').toLowerCase();
  if (s.includes('hóa') || s.includes('hoá')) return '#6fb35a';
  if (s.includes('toán')) return '#3b82f6';
  if (s.includes('lý') || s.includes('lí') || s.includes('vật')) return '#8b5cf6';
  if (s.includes('sinh')) return '#16a34a';
  if (s.includes('văn')) return '#e2704f';
  if (s.includes('anh')) return '#0ea5e9';
  return '#7a6ad8';
};

/* ============================================================
   MAIN
   ============================================================ */
export default function MyClasses({ onNavigate }) {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [pendingClasses, setPendingClasses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState(null);

  const [joinKey, setJoinKey] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinPendingMsg, setJoinPendingMsg] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState(() => lsGet('cs-mc-sort', 'deadline'));
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState(() => lsGet('cs-mc-view', 'room')); // room | flat
  const [isFs, setIsFs] = useState(false);
  const [, setTick] = useState(0);
  const pageRef = useRef(null);
  const searchRef = useRef(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const say = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const [retryExam, setRetryExam] = useState(null);
  const [retrySending, setRetrySending] = useState(false);
  const [retryError, setRetryError] = useState('');

  const loadClasses = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const [list, pending] = await Promise.all([
        getClassesByStudent(user.uid),
        getPendingClassesByStudent(user.uid),
      ]);
      setClasses(list);
      setPendingClasses(pending);
      if (list.length && !selectedId) {
        const saved = lsGet('cs-mc-class', '');
        setSelectedId((list.find((c) => c.id === saved) || list[0]).id);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Không tải được danh sách lớp.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedId]);

  useEffect(() => { loadClasses(); }, [user?.uid]); // eslint-disable-line

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedId) || null,
    [classes, selectedId]
  );

  const loadExams = useCallback(async (classId) => {
    if (!classId || !user?.uid) return;
    setLoadingExams(true);
    try {
      const list = await getExamsByClass(classId);
      setExams(list);

      const subsMap = {};
      const attMap = {};
      await Promise.all(list.map(async (ex) => {
        try {
          const sub = await getSubmissionForStudent(ex.id, user.uid);
          if (sub) subsMap[ex.id] = sub;
        } catch { /* chưa nộp */ }
        try {
          const att = await getAttempt({ examId: ex.id, studentId: user.uid });
          if (att && !att.submittedAt && att.startedAt) attMap[ex.id] = att;
        } catch { /* chưa có attempt */ }
      }));
      setSubmissions(subsMap);
      setAttempts(attMap);
    } catch (e) {
      console.error(e);
      say('Không tải được đề của lớp.');
    } finally {
      setLoadingExams(false);
    }
  }, [user?.uid, say]);

  useEffect(() => {
    if (selectedClass) loadExams(selectedClass.id);
  }, [selectedClass, loadExams]);

  const handleJoin = async (e) => {
    e?.preventDefault?.();
    const key = joinKey.trim().toUpperCase();
    if (!key) { setJoinError('Vui lòng nhập key lớp.'); return; }
    setJoinLoading(true);
    setJoinError('');
    setJoinPendingMsg('');
    try {
      const res = await joinClassByKey(key, {
        id: user.uid,
        name: user.displayName || user.email,
        email: user.email,
      });
      if (!res.ok) {
        setJoinError(res.error || 'Không vào được lớp.');
        return;
      }

      if (res.pending) {
        setJoinPendingMsg('Đã gửi yêu cầu vào lớp. Chờ giáo viên duyệt nhé!');
        say('Đã gửi yêu cầu. Chờ giáo viên duyệt nhé!');
      } else if (res.already && !res.pending) {
        say('Bạn đã ở trong lớp này rồi.');
      } else {
        say('Đã tham gia lớp!');
      }

      setJoinKey('');
      await loadClasses();
      if (!res.pending && res.class?.id) {
        setSelectedId(res.class.id);
        setTimeout(() => setShowJoin(false), 1200);
      }
    } catch (err) {
      setJoinError(err.message || 'Lỗi kết nối.');
    } finally {
      setJoinLoading(false);
    }
  };

  const getExamStatus = (exam) => {
    const now = Date.now();
    const opensAt = tsMs(exam.opensAt);
    const closesAt = tsMs(exam.closesAt);

    if (opensAt && now < opensAt) return { key: 'soon', label: 'Chưa mở', Icon: IconClock };
    const isClosed = !!(closesAt && now > closesAt);

    if (submissions[exam.id]) {
      if (isClosed) return { key: 'done', label: 'Đã làm · đã đóng', Icon: IconLock, locked: true, closed: true };
      if (exam.allowRetry) {
        return { key: 'done', label: 'Đã làm', Icon: IconCheckCircle, canRetry: true };
      }
      return { key: 'done', label: 'Đã làm · hết lượt', Icon: IconLock, locked: true };
    }

    if (isClosed) return { key: 'closed', label: 'Đã đóng', Icon: IconBan };

    if (attempts[exam.id]) return { key: 'doing', label: 'Đang làm dở', Icon: IconPlay };
    return { key: 'todo', label: 'Chưa làm', Icon: IconPlay };
  };

  const enrichedExams = useMemo(() => {
    return exams.map((ex) => {
      const st = getExamStatus(ex);
      const sub = submissions[ex.id];
      const att = attempts[ex.id];
      return { ...ex, _st: st, _sub: sub, _att: att };
    });
  }, [exams, submissions, attempts]); // eslint-disable-line

  const filteredExams = useMemo(() => {
    let list = enrichedExams;

    if (filter === 'todo') list = list.filter((e) => e._st.key === 'todo' || e._st.key === 'doing');
    else if (filter === 'done') list = list.filter((e) => e._st.key === 'done');
    else if (filter === 'overdue') list = list.filter((e) => e._st.key === 'closed' && !e._sub);

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) => (e.title || '').toLowerCase().includes(q));

    const copy = [...list];
    const dl = (e) => tsMs(e.closesAt) || Infinity;
    if (sort === 'deadline') {
      copy.sort((a, b) => {
        const aDone = a._st.key === 'done' ? 1 : 0;
        const bDone = b._st.key === 'done' ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return dl(a) - dl(b);
      });
    } else if (sort === 'newest') {
      copy.sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
    } else if (sort === 'score') {
      copy.sort((a, b) => {
        const sa = a._sub ? (a._sub.score / (a._sub.totalPoints || 1)) : -1;
        const sb = b._sub ? (b._sub.score / (b._sub.totalPoints || 1)) : -1;
        return sb - sa;
      });
    }
    return copy;
  }, [enrichedExams, filter, sort, search]);

  const upcoming = useMemo(() => {
    return enrichedExams
      .filter((e) => (e._st.key === 'todo' || e._st.key === 'doing') && e.closesAt)
      .map((e) => ({ ...e, _left: tsMs(e.closesAt) - Date.now() }))
      .filter((e) => e._left > 0)
      .sort((a, b) => a._left - b._left)
      .slice(0, 3);
  }, [enrichedExams]);

  const stats = useMemo(() => {
    const done = enrichedExams.filter((e) => e._sub).length;
    const scores = enrichedExams
      .filter((e) => e._sub && e._sub.totalPoints > 0)
      .map((e) => (e._sub.score / e._sub.totalPoints) * 100);
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    const pendingCount = enrichedExams.filter((e) => e._st.key === 'todo' || e._st.key === 'doing').length;
    return { total: enrichedExams.length, done, avg, pending: pendingCount };
  }, [enrichedExams]);

  const classStats = useMemo(() => {
    return classes.map((c) => ({
      ...c,
      _memberCount: c.members?.length || c.memberIds?.length || 0,
    }));
  }, [classes]);

  const openExam = (exam) => {
    if (exam._st.key === 'soon' || exam._st.key === 'closed') return;
    // hết lượt vẫn cho mở: ExamJoin hiện màn xin thi lại / vào thi nếu đã được duyệt
    if (exam._st.key === 'done' && exam._st.closed) return;
    const token = exam.token || exam.id;
    window.location.hash = `exam/${token}`;
  };

  const openResult = (exam) => {
    if (!exam._sub) return;
    window.location.hash = `exam/${exam.token || exam.id}`;
  };

  const openRetryModal = (exam) => {
    setRetryExam(exam);
    setRetryError('');
  };

  /* ============ GỬI YÊU CẦU THI LẠI ============ */
  const handleSubmitRetry = async (reason) => {
    if (!retryExam) return;
    setRetrySending(true);
    setRetryError('');
    try {
      const res = await requestRetry({
        examId: retryExam.id,
        classId: retryExam.classId,
        student: { id: user.uid, name: user.displayName || user.email },
        reason,
      });
      if (!res.ok) {
        setRetryError(res.error || 'Không gửi được yêu cầu.');
        return;
      }
      setRetryExam(null);
      say('Đã gửi yêu cầu. Chờ cô duyệt nhé!');
    } catch (e) {
      console.error('[MyClasses] requestRetry:', e);
      setRetryError(e.message || 'Lỗi gửi yêu cầu.');
    } finally {
      setRetrySending(false);
    }
  };

  /* ============ NHỚ LỰA CHỌN ============ */
  useEffect(() => { if (selectedId) lsSet('cs-mc-class', selectedId); }, [selectedId]);
  useEffect(() => { lsSet('cs-mc-view', viewMode); }, [viewMode]);
  useEffect(() => { lsSet('cs-mc-sort', sort); }, [sort]);

  /* ============ ĐỒNG HỒ: cập nhật "còn bao lâu" mỗi 30 giây ============ */
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  /* ============ TOÀN MÀN HÌNH ============ */
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFs = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    const el = pageRef.current;
    const p = el?.requestFullscreen?.();
    if (!p) { say('Trình duyệt này không hỗ trợ toàn màn hình.'); return; }
    p.catch(() => say('Không bật được toàn màn hình.'));
  };

  /* ============ PHÍM TẮT ============ */
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (showJoin || retryExam) return;
      const tag = (e.target?.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || e.target?.isContentEditable) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (classes.length < 2) return;
        e.preventDefault();
        const i = Math.max(0, classes.findIndex((c) => c.id === selectedId));
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + classes.length) % classes.length;
        setSelectedId(classes[n].id);
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFs();
      } else if (e.key === 'v' || e.key === 'V') {
        setViewMode((m) => (m === 'room' ? 'flat' : 'room'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line

  /* ============ DỮ LIỆU CHO BẢNG ĐEN ============ */
  const progressPct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  const trend = useMemo(() => (
    enrichedExams
      .filter((e) => e._sub && e._sub.totalPoints > 0)
      .map((e) => ({
        id: e.id,
        title: e.title,
        pct: Math.round((e._sub.score / e._sub.totalPoints) * 100),
        t: tsMs(e._sub.submittedAt) || tsMs(e.createdAt),
      }))
      .sort((a, b) => a.t - b.t)
      .slice(-8)
  ), [enrichedExams]);

  const badges = useMemo(() => {
    const best = trend.reduce((m, t) => Math.max(m, t.pct), 0);
    return [
      { key: 'start', label: 'Khởi động', hint: 'Làm xong 1 đề', on: stats.done >= 1 },
      { key: 'hard', label: 'Chăm chỉ', hint: 'Làm xong 3 đề', on: stats.done >= 3 },
      { key: 'ace', label: 'Điểm 90+', hint: 'Có 1 bài đạt từ 90%', on: best >= 90 },
      { key: 'clear', label: 'Hết nợ bài', hint: 'Không còn đề nào chưa làm', on: stats.total > 0 && stats.pending === 0 },
    ];
  }, [trend, stats]);

  const nextExam = useMemo(() => {
    const c = enrichedExams.filter((e) => e._st.key === 'todo' || e._st.key === 'doing');
    if (!c.length) return null;
    const far = 1e15;
    return [...c].sort((a, b) =>
      ((a._st.key === 'doing' ? 0 : 1) - (b._st.key === 'doing' ? 0 : 1)) ||
      ((tsMs(a.closesAt) || far) - (tsMs(b.closesAt) || far))
    )[0];
  }, [enrichedExams]);

  /* ============ HIỆU ỨNG 3D: nghiêng phòng học theo chuột ============ */
  const roomRef = useRef(null);
  const canTilt = () =>
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    window.matchMedia('(hover: hover)').matches;

  const onScenePointerMove = (e) => {
    if (viewMode === 'flat' || e.pointerType !== 'mouse' || !canTilt()) return;
    const el = roomRef.current;
    if (!el) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', (px * 4).toFixed(2) + 'deg');
    el.style.setProperty('--rx', (-py * 2).toFixed(2) + 'deg');
  };
  const onScenePointerLeave = () => {
    const el = roomRef.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  };

  /* đồng hồ + cửa sổ theo giờ thật */
  const clockNow = new Date();
  const hrFloat = clockNow.getHours() + clockNow.getMinutes() / 60;
  const minDeg = clockNow.getMinutes() * 6;
  const hourDeg = (clockNow.getHours() % 12) * 30 + clockNow.getMinutes() * 0.5;
  const tod = hrFloat < 5.5 || hrFloat >= 19 ? 'night' : hrFloat < 8 ? 'dawn' : hrFloat < 16.5 ? 'day' : 'dusk';
  const skyFrac = tod === 'night'
    ? ((hrFloat >= 19 ? hrFloat - 19 : hrFloat + 5) / 10.5)
    : Math.min(1, Math.max(0, (hrFloat - 5.5) / 13.5));
  const sky = {
    x: Math.round(14 + 72 * skyFrac),
    y: Math.round(78 - 56 * Math.sin(Math.PI * skyFrac)),
  };

  return (
    <div className={'mc mc3-page' + (isFs ? ' is-fs' : '')} ref={pageRef}>
      <header className="mc-header">
        <div className="mc-header-left">
          <span className="mc-header-ico"><IconBook size={22} /></span>
          <div>
            <h1>Lớp học của tôi</h1>
            <p>
              {classes.length} lớp · {stats.total} đề · Điểm TB{' '}
              <b>{stats.avg == null ? '—' : `${stats.avg}%`}</b>
            </p>
          </div>
        </div>
        <div className="mc-header-right">
          <div className="mc3-view" role="group" aria-label="Kiểu hiển thị">
            <button
              type="button"
              className={viewMode === 'room' ? 'on' : ''}
              onClick={() => setViewMode('room')}
              title="Lớp học 3D (V)"
              aria-pressed={viewMode === 'room'}
            >
              <IconCube size={15} /> 3D
            </button>
            <button
              type="button"
              className={viewMode === 'flat' ? 'on' : ''}
              onClick={() => setViewMode('flat')}
              title="Dạng phẳng, nhẹ máy (V)"
              aria-pressed={viewMode === 'flat'}
            >
              <IconList size={15} /> Phẳng
            </button>
          </div>
          <button
            type="button"
            className="mc-icon-btn mc3-fs"
            onClick={toggleFs}
            title={isFs ? 'Thoát toàn màn hình (F)' : 'Toàn màn hình (F)'}
            aria-label={isFs ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            aria-pressed={isFs}
          >
            {isFs ? <IconShrink size={16} /> : <IconExpand size={16} />}
          </button>
          <button
            type="button"
            className="mc-btn primary"
            onClick={() => { setShowJoin(true); setJoinError(''); setJoinPendingMsg(''); }}
          >
            <IconKey size={14} /> Vào lớp mới
          </button>
        </div>
      </header>

      {showJoin && (
        <div className="mc-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowJoin(false)}>
          <div className="mc-modal" role="dialog" aria-modal="true" aria-label="Vào lớp mới">
            <header className="mc-modal-head">
              <div className="mc-modal-head-ico"><IconKey size={20} /></div>
              <h2>Tham gia lớp học</h2>
              <button type="button" className="mc-modal-x" onClick={() => setShowJoin(false)} aria-label="Đóng">
                <IconClose size={16} />
              </button>
            </header>
            <p className="mc-modal-desc">
              Nhập key lớp do giáo viên cung cấp. Sau khi gửi yêu cầu, bạn sẽ chờ giáo viên duyệt.
            </p>
            <form onSubmit={handleJoin} className="mc-modal-form">
              <label className="mc-field">
                <span>Key lớp</span>
                <input
                  autoFocus
                  type="text"
                  value={joinKey}
                  onChange={(e) => { setJoinKey(e.target.value.toUpperCase()); setJoinError(''); setJoinPendingMsg(''); }}
                  placeholder="VD: 11A7-A3K9"
                  maxLength={20}
                  disabled={joinLoading}
                />
              </label>

              {joinError && (
                <p className="mc-field-error">
                  <IconAlert size={13} /> {joinError}
                </p>
              )}

              {joinPendingMsg && (
                <p className="mc-field-pending" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.5rem',
                  padding: '.65rem .9rem',
                  borderRadius: 12,
                  background: 'color-mix(in srgb, #f59e0b 12%, transparent)',
                  borderLeft: '3px solid #f59e0b',
                  color: '#b45309',
                  font: '600 .84rem/1.4 var(--sans)',
                  margin: '.4rem 0 0',
                }}>
                  <IconHourglass size={14} /> {joinPendingMsg}
                </p>
              )}

              <div className="mc-modal-actions">
                <button type="button" className="mc-btn" onClick={() => setShowJoin(false)} disabled={joinLoading}>
                  Hủy
                </button>
                <button type="submit" className="mc-btn primary" disabled={joinLoading || !joinKey.trim()}>
                  {joinLoading ? 'Đang gửi…' : <><IconKey size={14} /> Gửi yêu cầu</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!loading && classes.length === 0 && pendingClasses.length === 0 && (
        <div className="mc-empty">
          <span className="mc-empty-ico"><IconBook size={40} /></span>
          <h2>Bạn chưa tham gia lớp nào</h2>
          <p>Hỏi giáo viên để lấy key lớp, rồi bấm "Vào lớp mới" để gửi yêu cầu tham gia.</p>
          <button type="button" className="mc-btn primary" onClick={() => setShowJoin(true)}>
            <IconKey size={14} /> Nhập key lớp
          </button>
        </div>
      )}

      {loading && classes.length === 0 && pendingClasses.length === 0 && (
        <div className="mc-loading">
          <div className="mc-spinner" />
          <p>Đang tải lớp học…</p>
        </div>
      )}

      {!loading && (classes.length > 0 || pendingClasses.length > 0) && (
        <div
          className={'mc3' + (viewMode === 'flat' ? ' flat' : '')}
          data-tod={tod}
          onPointerMove={onScenePointerMove}
          onPointerLeave={onScenePointerLeave}
        >
          <div className="mc3-room" ref={roomRef}>
            {/* ================= TƯỜNG: biển lớp + bảng đen ================= */}
            <section className="mc3-wall" aria-label="Phòng học">
              <span className="mc3-rail" aria-hidden="true" />
              <span className="mc3-clock" aria-hidden="true">
                <i className="h" style={{ transform: `rotate(${hourDeg}deg)` }} />
                <i className="m" style={{ transform: `rotate(${minDeg}deg)` }} />
              </span>

              <span
                className="mc3-window"
                aria-hidden="true"
                style={{ '--cx': `${sky.x}%`, '--cy': `${sky.y}%` }}
              >
                <i className="orb" />
              </span>

              <ul className="mc3-signs" aria-label="Danh sách lớp">
                {classStats.map((c, i) => {
                  const isActive = c.id === selectedId;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={'mc3-sign' + (isActive ? ' active' : '')}
                        style={{ '--c': subjectColor(c.subject), animationDelay: `${i * 0.45}s` }}
                        onClick={() => setSelectedId(c.id)}
                        aria-pressed={isActive}
                      >
                        <span className="mc3-sign-ava">{String(c.name || '?')[0].toUpperCase()}</span>
                        <span className="mc3-sign-txt">
                          <b>{c.name}</b>
                          <small><IconUsers size={11} /> {c._memberCount} HS</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {pendingClasses.map((c, i) => (
                  <li key={c.id}>
                    <div
                      className="mc3-sign pending"
                      style={{ animationDelay: `${(classStats.length + i) * 0.45}s` }}
                    >
                      <span className="mc3-sign-ava"><IconHourglass size={15} /></span>
                      <span className="mc3-sign-txt">
                        <b>{c.name}</b>
                        <small>Chờ duyệt</small>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mc3-stage">
                <section
                  className="mc3-board"
                  style={{ '--c': subjectColor(selectedClass?.subject) }}
                  aria-label="Bảng lớp"
                >
                  <div className="mc3-board-frame">
                    <div className="mc3-board-surface">
                      {selectedClass ? (
                        <div className="mc3-board-grid">
                          <div className="mc3-board-main">
                            <p className="mc3-board-kicker">{selectedClass.subject || 'Lớp học'}</p>
                            <h2>{selectedClass.name}</h2>
                            <p className="mc3-board-sub">GV {selectedClass.teacherName || 'Giáo viên'}</p>

                            <div className="mc3-progress">
                              <div className="mc3-progress-row">
                                <span>Tiến độ làm bài</span>
                                <b>{progressPct}%</b>
                              </div>
                              <div
                                className="mc3-progress-bar"
                                role="progressbar"
                                aria-valuenow={progressPct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Tiến độ làm bài"
                              >
                                <i style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>

                            <ul className="mc3-chalk-stats">
                              <li><b>{stats.done}/{stats.total}</b><span>Đã làm</span></li>
                              <li><b>{stats.avg == null ? '—' : `${stats.avg}%`}</b><span>Điểm TB</span></li>
                              <li className={stats.pending > 0 ? 'hot' : ''}><b>{stats.pending}</b><span>Chưa làm</span></li>
                            </ul>
                          </div>

                          <div className="mc3-board-side">
                            {trend.length > 0 && (
                              <div className="mc3-trend">
                                <p className="mc3-side-title">Điểm các bài gần đây</p>
                                <ul>
                                  {trend.map((t) => (
                                    <li key={t.id} title={`${t.title}: ${t.pct}%`}>
                                      <i
                                        className={t.pct >= 70 ? 'hi' : t.pct >= 50 ? 'mid' : 'lo'}
                                        style={{ height: `${Math.max(8, t.pct)}%` }}
                                      >
                                        <small>{t.pct}</small>
                                      </i>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <p className="mc3-side-title mc3-side-title-2">Huy hiệu</p>
                            <ul className="mc3-badges">
                              {badges.map((b) => (
                                <li key={b.key} className={b.on ? 'on' : ''} title={b.hint}>
                                  <IconMedal size={14} /> {b.label}
                                </li>
                              ))}
                            </ul>

                            {nextExam ? (
                              <button type="button" className="mc3-next" onClick={() => openExam(nextExam)}>
                                <IconPlay size={13} />
                                <span>{nextExam._st.key === 'doing' ? 'Làm tiếp' : 'Vào thi ngay'}:</span>
                                <b>{nextExam.title}</b>
                              </button>
                            ) : stats.total > 0 ? (
                              <p className="mc3-allclear">Bạn đã làm hết bài của lớp này. Giỏi lắm!</p>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mc3-board-kicker">Lớp học</p>
                          <h2>Đang chờ giáo viên duyệt</h2>
                          <p className="mc3-board-sub">
                            Bạn có {pendingClasses.length} yêu cầu vào lớp. Khi được duyệt, lớp sẽ hiện trên tường.
                          </p>
                        </>
                      )}
                    </div>
                    <div className="mc3-ledge" aria-hidden="true"><i /><i /><i className="eraser" /></div>
                  </div>
                </section>

                {upcoming.length > 0 && (
                  <aside className="mc3-notes" aria-label="Sắp tới hạn">
                    <p className="mc3-notes-title"><IconAlert size={13} /> Sắp tới hạn</p>
                    {upcoming.map((e, i) => {
                      const dl = fmtDeadline(e.closesAt);
                      return (
                        <button
                          key={e.id}
                          type="button"
                          className={'mc3-note tone-' + (dl?.tone || 'normal')}
                          style={{ '--rot': `${[-2.2, 1.8, -1.2][i % 3]}deg` }}
                          onClick={() => openExam(e)}
                        >
                          <b>{e.title}</b>
                          <small><IconClock size={11} /> {dl?.text}</small>
                        </button>
                      );
                    })}
                  </aside>
                )}
              </div>
            </section>

            {/* ================= SÀN: bàn học = đề thi ================= */}
            <section className="mc3-floor">
              <span className="mc3-floor-plane" aria-hidden="true" />

              {classes.length > 0 && (
                <>
                  <div className="mc3-lectern">
                    <label className="mc-search">
                      <IconSearch size={15} />
                      <input
                        ref={searchRef}
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm đề…"
                        aria-label="Tìm đề"
                      />
                      {search && (
                        <button type="button" onClick={() => setSearch('')} aria-label="Xoá tìm kiếm">
                          <IconClose size={12} />
                        </button>
                      )}
                    </label>

                    <div className="mc-seg" role="group" aria-label="Lọc đề">
                      {[
                        ['all', 'Tất cả', stats.total],
                        ['todo', 'Chưa làm', stats.pending],
                        ['done', 'Đã làm', stats.done],
                        ['overdue', 'Quá hạn', enrichedExams.filter((e) => e._st.key === 'closed' && !e._sub).length],
                      ].map(([k, label, n]) => (
                        <button
                          key={k}
                          type="button"
                          className={filter === k ? 'on' : ''}
                          onClick={() => setFilter(k)}
                        >
                          {label}{n > 0 && <em>{n}</em>}
                        </button>
                      ))}
                    </div>

                    <select
                      className="mc-sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      aria-label="Sắp xếp"
                    >
                      <option value="deadline">Sắp tới hạn</option>
                      <option value="newest">Mới nhất</option>
                      <option value="score">Điểm cao nhất</option>
                    </select>

                    <button
                      type="button"
                      className="mc-icon-btn"
                      onClick={() => selectedClass && loadExams(selectedClass.id)}
                      disabled={loadingExams}
                      title="Làm mới"
                      aria-label="Làm mới"
                    >
                      <IconRefresh size={15} />
                    </button>

                    <span className="mc3-kbd" aria-hidden="true">
                      <kbd>←</kbd><kbd>→</kbd> đổi lớp · <kbd>/</kbd> tìm đề · <kbd>V</kbd> 3D/phẳng · <kbd>F</kbd> toàn màn hình
                    </span>
                  </div>

                  {loadingExams && exams.length === 0 ? (
                    <div className="mc-loading-inline mc3-msg">
                      <div className="mc-spinner" />
                      <p>Đang tải đề…</p>
                    </div>
                  ) : filteredExams.length === 0 ? (
                    <div className="mc-empty-inline mc3-msg">
                      <span><IconBook size={28} /></span>
                      <h3>Không có đề nào</h3>
                      <p>
                        {filter !== 'all' || search
                          ? 'Thử đổi bộ lọc hoặc xoá từ khoá tìm kiếm.'
                          : 'Lớp này chưa có đề nào. Chờ giáo viên giao bài nhé.'}
                      </p>
                    </div>
                  ) : (
                    <ul className="mc3-desks">
                      {filteredExams.map((ex) => {
                        const dl = fmtDeadline(ex.closesAt);
                        const st = ex._st;
                        const sub = ex._sub;
                        const StatusIcon = st.Icon;
                        const pct = sub && sub.totalPoints > 0
                          ? Math.round((sub.score / sub.totalPoints) * 100)
                          : null;
                        const tone = pct == null ? '' : pct >= 70 ? 'good' : pct >= 50 ? 'mid' : 'low';
                        return (
                          <li key={ex.id} className={'mc3-desk status-' + st.key}>
                            <div className="mc3-desk-top">
                              <div className="mc3-paper">
                                <span className="mc3-clip" aria-hidden="true" />
                                {pct != null && (
                                  <span className={'mc3-stamp ' + tone} aria-label={`Điểm ${sub.score}/${sub.totalPoints}`}>
                                    <b>{sub.score}</b>
                                    <small>/ {sub.totalPoints}</small>
                                  </span>
                                )}
                                <div className="mc-exam-top">
                                  <span className={'mc-exam-status st-' + st.key}>
                                    <StatusIcon size={11} /> {st.label}
                                  </span>
                                  {dl && st.key !== 'done' && (
                                    <span className={'mc-exam-deadline tone-' + dl.tone}>
                                      <IconClock size={11} /> {dl.text}
                                    </span>
                                  )}
                                </div>
                                <h3 className="mc3-title">{ex.title}</h3>
                                <p className="mc3-meta">
                                  {ex.questions?.length || 0} câu
                                  {' · '}{ex.duration || '—'} phút
                                  {' · '}{ex.totalPoints || 0} điểm
                                  {pct != null && <> · <b>{pct}%</b></>}
                                </p>

                                <div className="mc3-actions">
                                  {sub ? (
                                    <>
                                      <button type="button" className="mc-btn sm" onClick={() => openResult(ex)}>
                                        Xem lại
                                      </button>
                                      {ex.allowRetry ? (
                                        <button type="button" className="mc-btn sm primary" onClick={() => openExam(ex)}>
                                          Làm lại
                                        </button>
                                      ) : st.locked ? (
                                        <button
                                          type="button"
                                          className="mc-btn sm retry"
                                          onClick={() => openRetryModal(ex)}
                                          title="Gửi yêu cầu xin giáo viên cho thi lại"
                                        >
                                          <IconBell size={13} /> Xin thi lại
                                        </button>
                                      ) : null}
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      className={'mc-btn primary mc-exam-cta' + (st.key !== 'todo' && st.key !== 'doing' ? ' disabled' : '')}
                                      disabled={st.key !== 'todo' && st.key !== 'doing'}
                                      onClick={() => openExam(ex)}
                                    >
                                      {st.key === 'doing' ? (
                                        <><IconPlay size={13} /> Làm tiếp</>
                                      ) : st.key === 'soon' ? (
                                        <><IconClock size={13} /> Chưa mở</>
                                      ) : st.key === 'closed' ? (
                                        <><IconBan size={13} /> Đã đóng</>
                                      ) : (
                                        <><IconPlay size={13} /> Vào thi</>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="mc3-desk-front" aria-hidden="true" />
                            <span className="mc3-desk-shadow" aria-hidden="true" />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {toast && <div className="mc-toast" role="status">{toast}</div>}

      {retryExam && (
        <RetryRequestModal
          exam={retryExam}
          onClose={() => setRetryExam(null)}
          onSubmit={handleSubmitRetry}
          sending={retrySending}
          error={retryError}
        />
      )}
    </div>
  );
}