/* MyClasses.jsx — Lớp học học sinh, chuẩn Apple HIG & visionOS Classroom Studio */
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
  leaveClass,
  cancelJoinRequest,
} from '../lib/classroom.js';
import RetryRequestModal from './RetryRequestModal.jsx';
import '../styles/class-apple.css';

/* ============ ICONS ============ */
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
  >
    {children}
  </svg>
);

const IconBook = (p) => <Svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" /><path d="M4 20a2 2 0 0 0 2 1h13v-3" /><path d="M8 7h7" /></Svg>;
const IconKey = (p) => <Svg {...p}><circle cx="7.5" cy="15.5" r="4.5" /><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" /></Svg>;
const IconUsers = (p) => <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5S15 16.6 15.6 20" /><circle cx="17" cy="9" r="2.6" /></Svg>;
const IconPlay = (p) => <Svg {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" /></Svg>;
const IconClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
const IconCheck = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></Svg>;
const IconBan = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></Svg>;
const IconSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Svg>;
const IconRefresh = (p) => <Svg {...p}><path d="M20 11a8 8 0 0 0-14.3-4.2L4 8.5M4 4v4.5h4.5" /><path d="M4 13a8 8 0 0 0 14.3 4.2L20 15.5M20 20v-4.5h-4.5" /></Svg>;
const IconAlert = (p) => <Svg {...p}><path d="M12 4l9 16H3z" /><path d="M12 10v4" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></Svg>;
const IconClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
const IconBell = (p) => <Svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>;
const IconHourglass = (p) => <Svg {...p}><path d="M6 2h12M6 22h12M6 2v4c0 3 3 5 6 6-3 1-6 3-6 6v4M18 2v4c0 3-3 5-6 6 3 1 6 3 6 6v4" /></Svg>;
const IconLock = (p) => <Svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>;
const IconSparkles = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" /></Svg>;
const IconPin = (p) => <Svg {...p}><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-2l-2-2V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8l-2 2z" /></Svg>;
const IconTrophy = (p) => <Svg {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H7" /><path d="M14 14.66V17c0 .55.45 1 1 1h2" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></Svg>;

/* ============ HELPERS ============ */
const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } };

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
  const diff = tsMs(deadline) - Date.now();
  if (diff <= 0) {
    const over = Math.floor(-diff / 86400000);
    return { text: over === 0 ? 'Quá hạn hôm nay' : `Quá hạn ${over} ngày`, tone: 'over', isUrgent: false };
  }
  const h = Math.floor(diff / 3600000);
  if (h < 1) return { text: `Còn ${Math.max(1, Math.floor(diff / 60000))} phút`, tone: 'urgent', isUrgent: true };
  if (h < 24) return { text: `Còn ${h} giờ`, tone: 'urgent', isUrgent: true };
  const d = Math.floor(diff / 86400000);
  return { text: `Còn ${d} ngày`, tone: d < 3 ? 'soon' : 'normal', isUrgent: false };
};

function readJoinKeyFromHash() {
  const h = (typeof window === 'undefined' ? '' : window.location.hash.slice(1));
  const m = h.match(/^(?:join|my-classes)\/([A-Z0-9-]{4,24})$/i);
  return m ? m[1].toUpperCase() : '';
}

/* ============ APPLE ACTIVITY RINGS ============ */
function AppleActivityRings({ completionPct = 0, avgPct = 0, onTimePct = 100 }) {
  const size = 104;
  const stroke = 7;
  const center = size / 2;

  const r1 = 42;
  const c1 = 2 * Math.PI * r1;
  const p1 = Math.min(1, Math.max(0, completionPct / 100));

  const r2 = 32;
  const c2 = 2 * Math.PI * r2;
  const p2 = Math.min(1, Math.max(0, avgPct / 100));

  const r3 = 22;
  const c3 = 2 * Math.PI * r3;
  const p3 = Math.min(1, Math.max(0, onTimePct / 100));

  return (
    <div className="ap-rings-box">
      <svg className="ap-rings-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Track 1 (Blue) */}
        <circle cx={center} cy={center} r={r1} stroke="#0071e3" strokeWidth={stroke} fill="none" opacity="0.18" />
        <circle
          cx={center}
          cy={center}
          r={r1}
          stroke="#0071e3"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c1 * p1} ${c1}`}
        />

        {/* Track 2 (Purple) */}
        <circle cx={center} cy={center} r={r2} stroke="#af52de" strokeWidth={stroke} fill="none" opacity="0.18" />
        <circle
          cx={center}
          cy={center}
          r={r2}
          stroke="#af52de"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c2 * p2} ${c2}`}
        />

        {/* Track 3 (Amber) */}
        <circle cx={center} cy={center} r={r3} stroke="#ff9500" strokeWidth={stroke} fill="none" opacity="0.18" />
        <circle
          cx={center}
          cy={center}
          r={r3}
          stroke="#ff9500"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c3 * p3} ${c3}`}
        />
      </svg>

      <div className="ap-rings-legend">
        <div className="ap-ring-item">
          <span className="ap-ring-label">
            <i className="ap-ring-dot blue" /> Hoàn thành đề
          </span>
          <b className="ap-ring-val">{Math.round(completionPct)}%</b>
        </div>
        <div className="ap-ring-item">
          <span className="ap-ring-label">
            <i className="ap-ring-dot purple" /> Điểm TB (GPA)
          </span>
          <b className="ap-ring-val">{Math.round(avgPct)}%</b>
        </div>
        <div className="ap-ring-item">
          <span className="ap-ring-label">
            <i className="ap-ring-dot amber" /> Nộp đúng hạn
          </span>
          <b className="ap-ring-val">{Math.round(onTimePct)}%</b>
        </div>
      </div>
    </div>
  );
}

/* ============ MAIN COMPONENT ============ */
export default function MyClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [pendingClasses, setPendingClasses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [joinKey, setJoinKey] = useState(() => readJoinKeyFromHash());
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinPendingMsg, setJoinPendingMsg] = useState('');
  const [showJoin, setShowJoin] = useState(() => !!readJoinKeyFromHash());
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState(() => lsGet('cs-mc-sort', 'deadline'));
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);
  const searchRef = useRef(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [retryExam, setRetryExam] = useState(null);
  const [retrySending, setRetrySending] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [busyLeave, setBusyLeave] = useState(false);

  const say = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadClasses = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
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
      say(e.message || 'Không tải được danh sách lớp.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedId, say]);

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
        } catch { /* */ }
        try {
          const att = await getAttempt({ examId: ex.id, studentId: user.uid });
          if (att && !att.submittedAt && att.startedAt) attMap[ex.id] = att;
        } catch { /* */ }
      }));
      setSubmissions(subsMap);
      setAttempts(attMap);
    } catch {
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
    if (!key) { setJoinError('Vui lòng nhập mã lớp.'); return; }
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
        setJoinPendingMsg('Đã gửi yêu cầu. Chờ giáo viên duyệt.');
        say('Đã gửi yêu cầu vào lớp.');
      } else if (res.already && !res.pending) {
        say('Bạn đã ở trong lớp này.');
      } else {
        say('Đã tham gia lớp thành công.');
      }
      setJoinKey('');
      await loadClasses();
      if (!res.pending && res.class?.id) {
        setSelectedId(res.class.id);
        setTimeout(() => setShowJoin(false), 700);
      }
    } catch (err) {
      setJoinError(err.message || 'Lỗi kết nối.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!selectedClass || busyLeave) return;
    if (!window.confirm(`Rời lớp “${selectedClass.name}”? Bạn sẽ không còn thấy đề của lớp.`)) return;
    setBusyLeave(true);
    try {
      const r = await leaveClass(selectedClass.id, user.uid);
      if (!r.ok) { say(r.error || 'Không rời được lớp.'); return; }
      say('Đã rời lớp.');
      setSelectedId(null);
      await loadClasses();
    } finally {
      setBusyLeave(false);
    }
  };

  const handleCancelPending = async (cls) => {
    const r = await cancelJoinRequest(cls.id, user.uid);
    if (!r.ok) { say(r.error || 'Không hủy được.'); return; }
    say('Đã hủy yêu cầu.');
    await loadClasses();
  };

  const getExamStatus = (exam) => {
    const now = Date.now();
    const opensAt = tsMs(exam.opensAt);
    const closesAt = tsMs(exam.closesAt);
    if (opensAt && now < opensAt) return { key: 'soon', label: 'Chưa mở', Icon: IconClock };
    const isClosed = !!(closesAt && now > closesAt);
    if (submissions[exam.id]) {
      if (isClosed) return { key: 'done', label: 'Đã hoàn thành · Đã đóng', Icon: IconLock, locked: true, closed: true };
      if (exam.allowRetry) return { key: 'done', label: 'Đã hoàn thành', Icon: IconCheck, canRetry: true };
      return { key: 'done', label: 'Đã hoàn thành', Icon: IconCheck, locked: true };
    }
    if (isClosed) return { key: 'closed', label: 'Đã đóng', Icon: IconBan };
    if (attempts[exam.id]) return { key: 'doing', label: 'Đang làm dở', Icon: IconPlay };
    return { key: 'todo', label: 'Chưa làm', Icon: IconPlay };
  };

  const enrichedExams = useMemo(() => exams.map((ex) => ({
    ...ex, _st: getExamStatus(ex), _sub: submissions[ex.id], _att: attempts[ex.id],
  })), [exams, submissions, attempts]); // eslint-disable-line

  const filteredExams = useMemo(() => {
    let list = enrichedExams;
    if (filter === 'todo') list = list.filter((e) => e._st.key === 'todo' || e._st.key === 'doing');
    else if (filter === 'done') list = list.filter((e) => e._st.key === 'done');
    else if (filter === 'urgent') list = list.filter((e) => {
      const dl = fmtDeadline(e.closesAt);
      return dl?.isUrgent && (e._st.key === 'todo' || e._st.key === 'doing');
    });
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) => (e.title || '').toLowerCase().includes(q));
    const copy = [...list];
    const dl = (e) => tsMs(e.closesAt) || Infinity;
    if (sort === 'deadline') {
      copy.sort((a, b) => ((a._st.key === 'done' ? 1 : 0) - (b._st.key === 'done' ? 1 : 0)) || (dl(a) - dl(b)));
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

  const stats = useMemo(() => {
    const done = enrichedExams.filter((e) => e._sub).length;
    const scores = enrichedExams.filter((e) => e._sub?.totalPoints > 0).map((e) => (e._sub.score / e._sub.totalPoints) * 100);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const pendingCount = enrichedExams.filter((e) => e._st.key === 'todo' || e._st.key === 'doing').length;

    // Tỷ lệ nộp đúng hạn
    let onTimeCount = 0;
    enrichedExams.forEach((e) => {
      if (e._sub) {
        const subTime = tsMs(e._sub.submittedAt);
        const deadline = tsMs(e.closesAt);
        if (!deadline || subTime <= deadline) onTimeCount++;
      }
    });
    const onTimePct = done > 0 ? Math.round((onTimeCount / done) * 100) : 100;

    return { total: enrichedExams.length, done, avg, pending: pendingCount, onTimePct };
  }, [enrichedExams]);

  /* ============ ELEC AI DIAGNOSTIC ============ */
  const aiDiagnostic = useMemo(() => {
    const completedSubs = enrichedExams.filter((e) => e._sub && e._sub.totalPoints > 0);
    if (!completedSubs.length) return null;

    // Tìm các bài điểm thấp nhất (< 70%)
    const weakExams = completedSubs
      .map((e) => ({
        title: e.title,
        pct: Math.round((e._sub.score / e._sub.totalPoints) * 100),
      }))
      .filter((e) => e.pct < 75)
      .sort((a, b) => a.pct - b.pct);

    if (weakExams.length > 0) {
      const topWeak = weakExams[0];
      return {
        status: 'need_review',
        topic: topWeak.title,
        pct: topWeak.pct,
        recommendation: `AI phát hiện bạn cần củng cố chủ đề "${topWeak.topic || topWeak.title}" (${topWeak.pct}%). Hãy nhờ ELEC AI giải thích phương pháp giải nhé!`,
      };
    }

    return {
      status: 'excellent',
      topic: 'Toàn diện',
      pct: stats.avg || 100,
      recommendation: `Phong độ rất tốt! Bạn đã đạt điểm TB ${stats.avg || 90}%. Hãy tiếp tục giữ vững nhé!`,
    };
  }, [enrichedExams, stats.avg]);

  const handleAskAITutor = (topic) => {
    const prompt = `Chào ELEC AI, mình đang học lớp "${selectedClass?.name || 'Hóa học'}". Mình cần ôn tập và củng cố lại chủ đề "${topic}". Bạn hãy hướng dẫn tóm tắt lý thuyết cốt lõi, các bẫy thường gặp và đưa ra 3 câu trắc nghiệm minh họa có lời giải chi tiết giúp mình nhé!`;
    try {
      localStorage.setItem('cs-ai-draft', prompt);
    } catch { /* */ }
    window.location.hash = 'ai';
  };

  const openExam = (exam) => {
    if (exam._st.key === 'soon' || exam._st.key === 'closed') return;
    if (exam._st.key === 'done' && exam._st.closed) return;
    window.location.hash = `exam/${exam.token || exam.id}`;
  };

  const handleSubmitRetry = async (reason) => {
    if (!retryExam) return;
    setRetrySending(true);
    setRetryError('');
    try {
      const res = await requestRetry({
        examId: retryExam.id,
        classId: retryExam.classId,
        teacherId: retryExam.created_by || retryExam.teacherId || null,
        student: { id: user.uid, name: user.displayName || user.email },
        reason,
      });
      if (!res.ok) { setRetryError(res.error || 'Không gửi được yêu cầu.'); return; }
      setRetryExam(null);
      say('Đã gửi yêu cầu thi lại.');
    } catch (e) {
      setRetryError(e.message || 'Lỗi gửi yêu cầu.');
    } finally {
      setRetrySending(false);
    }
  };

  useEffect(() => { if (selectedId) lsSet('cs-mc-class', selectedId); }, [selectedId]);
  useEffect(() => { lsSet('cs-mc-sort', sort); }, [sort]);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const progressPct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const empty = !loading && classes.length === 0 && pendingClasses.length === 0;
  const firstName = (user?.displayName || user?.email || '').trim().split(/\s+/).pop() || '';

  return (
    <div className="ap-class">
      <div className="ap-class-ambient" aria-hidden="true" />

      {/* HEADER */}
      <header className="ap-head">
        <div>
          <h1>Lớp học của tôi</h1>
          <p>
            {classes.length} lớp tham gia
            {stats.total ? ` · ${stats.total} bài tập/đề thi` : ''}
            {stats.avg != null ? ` · Điểm TB ${stats.avg}%` : ''}
          </p>
        </div>
        <div className="ap-actions">
          <button
            type="button"
            className="ap-btn primary"
            onClick={() => { setShowJoin(true); setJoinError(''); setJoinPendingMsg(''); }}
          >
            <IconKey size={15} /> Tham gia lớp mới
          </button>
        </div>
      </header>

      {/* THÔNG BÁO GHIM CỦA LỚP TỪ GIÁO VIÊN */}
      {selectedClass?.announcement?.text && (
        <div className="ap-notice" role="alert">
          <div className="ap-notice-icon">
            <IconPin size={17} />
          </div>
          <div className="ap-notice-body">
            <div className="ap-notice-kicker">Thông báo từ GV {selectedClass.teacherName || 'bộ môn'}</div>
            <div className="ap-notice-text">{selectedClass.announcement.text}</div>
          </div>
        </div>
      )}

      {loading && empty && (
        <div className="ap-loading">
          <div className="ap-spinner" />
          <p>Đang đồng bộ dữ liệu lớp học…</p>
        </div>
      )}

      {empty && !loading && (
        <div className="ap-card ap-empty">
          <IconBook size={40} />
          <h2>Bạn chưa vào lớp nào</h2>
          <p>Nhận mã lớp (VD: 11A7-X8K9) từ giáo viên của bạn để tham gia làm bài.</p>
          <button type="button" className="ap-btn primary" onClick={() => setShowJoin(true)}>
            <IconKey size={14} /> Nhập mã lớp ngay
          </button>
        </div>
      )}

      {!loading && (classes.length > 0 || pendingClasses.length > 0) && (
        <>
          {/* CLASS CAPSULE DOCK */}
          <div className="ap-chip-row" role="tablist" aria-label="Danh sách lớp">
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                className={'ap-chip' + (c.id === selectedId ? ' on' : '')}
                onClick={() => setSelectedId(c.id)}
                aria-pressed={c.id === selectedId}
              >
                <span className="ap-ava">{String(c.name || '?')[0].toUpperCase()}</span>
                <span>
                  {c.name}
                  <small><IconUsers size={10} /> {c.members?.length || c.memberIds?.length || 0} học sinh</small>
                </span>
              </button>
            ))}
            {pendingClasses.map((c) => (
              <span key={c.id} className="ap-chip pending">
                <span className="ap-ava"><IconHourglass size={13} /></span>
                <span>
                  {c.name}
                  <small>Chờ giáo viên duyệt</small>
                </span>
              </span>
            ))}
          </div>

          <div className="ap-grid">
            {/* ASIDE BENTO CARDS */}
            <aside className="ap-aside">
              {selectedClass ? (
                <>
                  {/* BENTO CARD 1: LỚP HỌC & ACTIVITY RINGS */}
                  <div className="ap-card">
                    <p className="ap-kicker">
                      <IconBook size={13} /> {selectedClass.subject || 'Hóa học'} ·  Verified Class
                    </p>
                    {firstName && <p className="ap-sub">Xin chào, {firstName}</p>}
                    <h2>{selectedClass.name}</h2>
                    <p className="ap-sub">GV phụ trách: {selectedClass.teacherName || 'Giáo viên'}</p>

                    {/* VÒNG NĂNG LƯỢNG APPLE FITNESS RINGS */}
                    <AppleActivityRings
                      completionPct={progressPct}
                      avgPct={stats.avg || 0}
                      onTimePct={stats.onTimePct}
                    />

                    <div className="ap-stats">
                      <div className="ap-stat">
                        <b>{stats.done}/{stats.total}</b>
                        <span>Đã làm</span>
                      </div>
                      <div className="ap-stat">
                        <b>{stats.avg == null ? '—' : `${stats.avg}%`}</b>
                        <span>Điểm TB</span>
                      </div>
                      <div className="ap-stat">
                        <b>{stats.pending}</b>
                        <span>Chưa làm</span>
                      </div>
                    </div>

                    <div className="ap-foot-actions">
                      <button
                        type="button"
                        className="ap-btn ghost sm danger"
                        onClick={handleLeave}
                        disabled={busyLeave}
                      >
                        Rời lớp
                      </button>
                    </div>
                  </div>

                  {/* BENTO CARD 2: ELEC AI DIAGNOSTIC RADAR */}
                  {aiDiagnostic && (
                    <div className="ap-card ap-ai-card">
                      <div className="ap-ai-badge">
                        <IconSparkles size={13} /> ELEC AI Diagnostic
                      </div>
                      <p className="ap-kicker">Chẩn đoán năng lực</p>
                      <div className="ap-ai-topic">
                        <div>
                          <div className="ap-ai-topic-name">{aiDiagnostic.topic}</div>
                          <small style={{ color: 'var(--mut)' }}>Hiệu suất: {aiDiagnostic.pct}%</small>
                        </div>
                        <span className="ap-ai-topic-tag">
                          {aiDiagnostic.status === 'need_review' ? 'Cần ôn thêm' : 'Nắm vững'}
                        </span>
                      </div>
                      <p style={{ margin: '0.4rem 0 0.8rem', fontSize: '0.8rem', color: 'var(--mut)', lineHeight: 1.4 }}>
                        {aiDiagnostic.recommendation}
                      </p>
                      {aiDiagnostic.status === 'need_review' && (
                        <div className="ap-ai-cta">
                          <button
                            type="button"
                            className="ap-btn sm primary"
                            onClick={() => handleAskAITutor(aiDiagnostic.topic)}
                          >
                            <IconSparkles size={12} /> Nhờ ELEC AI hướng dẫn
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BENTO CARD 3: THÀNH TÍCH & VINH DANH CÁ NHÂN */}
                  <div className="ap-card ap-honor-card">
                    <p className="ap-kicker">
                      <IconTrophy size={13} /> Thành tích của bạn
                    </p>
                    <ul className="ap-honor-list">
                      <li className="ap-honor-item me">
                        <span className="ap-honor-rank gold">★</span>
                        <span className="ap-honor-name">
                          {user.displayName || user.email}
                          <small style={{ display: 'block', color: 'var(--mut)', fontWeight: 500 }}>
                            {stats.done >= stats.total && stats.total > 0 ? 'Chiến binh xuất sắc' : 'Đang tích cực ôn luyện'}
                          </small>
                        </span>
                        <span className="ap-honor-score">
                          {stats.avg != null ? `${stats.avg}%` : 'Chưa thi'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="ap-card">
                  <p className="ap-kicker">Chờ duyệt</p>
                  <h2>Yêu cầu đang gửi</h2>
                  <p className="ap-sub">{pendingClasses.length} lớp đang chờ giáo viên xác nhận.</p>
                  <div className="ap-foot-actions">
                    {pendingClasses.map((c) => (
                      <button key={c.id} type="button" className="ap-btn sm" onClick={() => handleCancelPending(c)}>
                        Hủy yêu cầu {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* MAIN EXAM LIST SECTION */}
            <section className="ap-card">
              {classes.length > 0 && (
                <div className="ap-toolbar">
                  <label className="ap-search">
                    <IconSearch size={15} />
                    <input
                      ref={searchRef}
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm kiếm đề thi theo tên..."
                      aria-label="Tìm đề"
                    />
                  </label>

                  {/* SEGMENTED FILTER */}
                  <div className="ap-seg" role="group">
                    {[
                      ['all', 'Tất cả', stats.total],
                      ['todo', 'Chưa làm', stats.pending],
                      ['urgent', 'Sắp hết hạn', enrichedExams.filter((e) => fmtDeadline(e.closesAt)?.isUrgent && (e._st.key === 'todo' || e._st.key === 'doing')).length],
                      ['done', 'Đã làm', stats.done],
                    ].map(([k, label, n]) => (
                      <button key={k} type="button" className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
                        {label}{n > 0 && <em>{n}</em>}
                      </button>
                    ))}
                  </div>

                  {/* SORT SELECT */}
                  <select className="ap-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sắp xếp">
                    <option value="deadline">Sắp tới hạn</option>
                    <option value="newest">Mới giao</option>
                    <option value="score">Điểm cao</option>
                  </select>

                  <button
                    type="button"
                    className="ap-btn sm ghost"
                    onClick={() => selectedClass && loadExams(selectedClass.id)}
                    disabled={loadingExams}
                    aria-label="Làm mới danh sách"
                  >
                    <IconRefresh size={14} />
                  </button>
                </div>
              )}

              {loadingExams && exams.length === 0 ? (
                <div className="ap-loading">
                  <div className="ap-spinner" />
                  <p>Đang tải danh sách bài tập…</p>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="ap-empty" style={{ padding: '2.5rem 0.5rem' }}>
                  <h3>Không tìm thấy đề thi</h3>
                  <p>{filter !== 'all' || search ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Lớp này hiện chưa có bài tập nào. Chờ giáo viên giao đề nhé!'}</p>
                </div>
              ) : (
                /* TITANIUM BENTO EXAM CARDS */
                <ul className="ap-exams">
                  {filteredExams.map((ex) => {
                    const dl = fmtDeadline(ex.closesAt);
                    const st = ex._st;
                    const sub = ex._sub;
                    const StatusIcon = st.Icon;
                    const pct = sub?.totalPoints > 0 ? Math.round((sub.score / sub.totalPoints) * 100) : null;

                    return (
                      <li key={ex.id} className="ap-exam">
                        <div>
                          <div className="ap-exam-top">
                            <span className={'ap-pill ' + st.key}>
                              <StatusIcon size={12} /> {st.label}
                            </span>
                            {dl && st.key !== 'done' && (
                              <span className={'ap-pill ' + dl.tone}>
                                <IconClock size={11} /> {dl.text}
                              </span>
                            )}
                          </div>
                          <h3>{ex.title}</h3>
                          <p>
                            <span>{ex.questions?.length || 0} câu hỏi</span>
                            <span>·</span>
                            <span>{ex.duration || '—'} phút</span>
                            <span>·</span>
                            <span>{ex.totalPoints || 0} điểm</span>
                            {pct != null && (
                              <>
                                <span>·</span>
                                <b style={{ color: 'var(--ok)' }}>
                                  Điểm: {sub.score}/{sub.totalPoints} ({pct}%)
                                </b>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="ap-exam-cta">
                          {sub ? (
                            <>
                              <button
                                type="button"
                                className="ap-btn sm"
                                onClick={() => { window.location.hash = `exam/${ex.token || ex.id}`; }}
                              >
                                Xem lại bài
                              </button>
                              {ex.allowRetry ? (
                                <button
                                  type="button"
                                  className="ap-btn sm primary"
                                  onClick={() => openExam(ex)}
                                >
                                  Làm lại
                                </button>
                              ) : st.locked ? (
                                <button
                                  type="button"
                                  className="ap-btn sm"
                                  onClick={() => { setRetryExam(ex); setRetryError(''); }}
                                >
                                  <IconBell size={13} /> Xin thi lại
                                </button>
                              ) : null}
                            </>
                          ) : (
                            <button
                              type="button"
                              className="ap-btn sm primary"
                              disabled={st.key !== 'todo' && st.key !== 'doing'}
                              onClick={() => openExam(ex)}
                            >
                              {st.key === 'doing' ? (
                                <><IconPlay size={13} /> Tiếp tục làm</>
                              ) : st.key === 'soon' ? (
                                <><IconClock size={13} /> Chưa mở</>
                              ) : st.key === 'closed' ? (
                                <><IconBan size={13} /> Đã hết hạn</>
                              ) : (
                                <><IconPlay size={13} /> Vào thi ngay</>
                              )}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      {/* MODAL NHẬP MÃ LỚP (APPLE SHEET) */}
      {showJoin && (
        <div className="ap-sheet-bg" onMouseDown={(e) => e.target === e.currentTarget && setShowJoin(false)}>
          <form className="ap-sheet" role="dialog" aria-modal="true" aria-label="Tham gia lớp" onSubmit={handleJoin}>
            <header>
              <h2>Tham gia lớp học</h2>
              <button type="button" className="ap-x" onClick={() => setShowJoin(false)} aria-label="Đóng">
                <IconClose size={16} />
              </button>
            </header>
            <p>Nhập mã lớp do giáo viên cung cấp (ví dụ: 11A7-X8K9). Bạn sẽ thấy toàn bộ đề thi của lớp sau khi tham gia.</p>
            <label className="ap-field">
              <span>Mã lớp học (Code)</span>
              <input
                autoFocus
                type="text"
                value={joinKey}
                maxLength={24}
                disabled={joinLoading}
                placeholder="VD: 10A7-K9X2"
                onChange={(e) => { setJoinKey(e.target.value.toUpperCase()); setJoinError(''); setJoinPendingMsg(''); }}
              />
            </label>
            {joinError && <p className="ap-err"><IconAlert size={14} /> {joinError}</p>}
            {joinPendingMsg && <p className="ap-ok"><IconHourglass size={14} /> {joinPendingMsg}</p>}
            <div className="ap-sheet-actions">
              <button type="button" className="ap-btn" onClick={() => setShowJoin(false)} disabled={joinLoading}>
                Hủy
              </button>
              <button type="submit" className="ap-btn primary" disabled={joinLoading || !joinKey.trim()}>
                {joinLoading ? 'Đang gửi…' : 'Tham gia lớp'}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="ap-toast" role="status">{toast}</div>}
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
