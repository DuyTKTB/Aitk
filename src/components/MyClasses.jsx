/* ============================================================
   MyClasses.jsx — Trang "Lớp học của tôi" cho học sinh
   ------------------------------------------------------------
   Route: #my-classes
   - Nhập key lớp để tham gia
   - Danh sách lớp đã tham gia (sidebar)
   - Danh sách đề của lớp đang chọn (main)
   - Filter / Sort / Search đề
   - Đề sắp tới hạn
   - Trạng thái đề: chưa làm / đã làm / quá hạn / chưa mở / đang làm dở
   - Tất cả icon đều là SVG inline
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getClassesByStudent,
  joinClassByKey,
  getExamsByClass,
} from '../lib/classroom.js';
import { getSubmissionForStudent } from '../lib/classroom.js';
import '../styles/my-classes.css';

/* ============================================================
   SVG ICONS — không dùng icon font
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

const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c.7-4 3.5-6 7.5-6s6.8 2 7.5 6" />
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

const IconSparkle = (p) => (
  <Svg {...p}>
    <path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </Svg>
);

const IconGrid = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Svg>
);

const IconTrophy = (p) => (
  <Svg {...p}>
    <path d="M7 5h10v4a5 5 0 0 1-10 0z" />
    <path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3" />
    <path d="M9 18h6M12 14v4" />
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

/* ============================================================
   HELPERS
   ============================================================ */
const tsMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (v?.seconds) return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const daysLeft = (deadline) => {
  const ms = tsMs(deadline) - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86400000);
};

const hoursLeft = (deadline) => {
  const ms = tsMs(deadline) - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 3600000);
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
  if (h < 1) return { text: 'Còn dưới 1 giờ', tone: 'urgent' };
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
  if (s.includes('sử')) return '#a16207';
  if (s.includes('địa')) return '#0891b2';
  return '#7a6ad8';
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function MyClasses({ onNavigate }) {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState({}); // examId -> submission
  const [attempts, setAttempts] = useState({}); // examId -> attempt (đang làm dở)
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState(null);

  const [joinKey, setJoinKey] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const [filter, setFilter] = useState('all'); // all | todo | done | overdue
  const [sort, setSort] = useState('deadline'); // deadline | newest | score
  const [search, setSearch] = useState('');

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const say = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ============ LOAD LỚP ============ */
  const loadClasses = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getClassesByStudent(user.uid);
      setClasses(list);
      if (list.length && !selectedId) setSelectedId(list[0].id);
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

  /* ============ LOAD ĐỀ CỦA LỚP ============ */
  const loadExams = useCallback(async (classId) => {
    if (!classId || !user?.uid) return;
    setLoadingExams(true);
    try {
      const list = await getExamsByClass(classId);

      // Lọc bỏ đề đã xoá, sắp xếp mặc định theo hạn
      setExams(list);

      // Lấy bài nộp + attempt đang làm dở của HS cho từng đề
      const subsMap = {};
      const attMap = {};
      await Promise.all(list.map(async (ex) => {
        try {
          const sub = await getSubmissionForStudent(ex.id, user.uid);
          if (sub) subsMap[ex.id] = sub;
        } catch { /* chưa nộp */ }
        try {
          const att = await getAttempt({ examId: ex.id, studentId: user.uid });
          if (att && !att.submitted && att.startedAt) attMap[ex.id] = att;
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

  /* ============ JOIN LỚP ============ */
  const handleJoin = async (e) => {
    e?.preventDefault?.();
    const key = joinKey.trim().toUpperCase();
    if (!key) { setJoinError('Vui lòng nhập key lớp.'); return; }
    setJoinLoading(true);
    setJoinError('');
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
      say(res.already ? 'Bạn đã ở trong lớp này' : 'Đã tham gia lớp!');
      setJoinKey('');
      setShowJoin(false);
      await loadClasses();
      if (res.class?.id) setSelectedId(res.class.id);
    } catch (err) {
      setJoinError(err.message || 'Lỗi kết nối.');
    } finally {
      setJoinLoading(false);
    }
  };

  /* ============ TRẠNG THÁI ĐỀ ============ */
  const getExamStatus = (exam) => {
    const now = Date.now();
    const opensAt = tsMs(exam.opensAt);
    const closesAt = tsMs(exam.closesAt);

    if (opensAt && now < opensAt) return { key: 'soon', label: 'Chưa mở', Icon: IconClock };
    if (closesAt && now > closesAt) return { key: 'closed', label: 'Đã đóng', Icon: IconBan };
    if (submissions[exam.id]) {
      return exam.allowRetry
        ? { key: 'done', label: 'Đã làm', Icon: IconCheckCircle, canRetry: true }
        : { key: 'done', label: 'Đã làm', Icon: IconCheckCircle };
    }
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

  /* ============ FILTER + SORT + SEARCH ============ */
  const filteredExams = useMemo(() => {
    let list = enrichedExams;

    // Filter
    if (filter === 'todo') list = list.filter((e) => e._st.key === 'todo' || e._st.key === 'doing');
    else if (filter === 'done') list = list.filter((e) => e._st.key === 'done');
    else if (filter === 'overdue') list = list.filter((e) => e._st.key === 'closed' && !e._sub);

    // Search
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) => (e.title || '').toLowerCase().includes(q));

    // Sort
    const copy = [...list];
    const dl = (e) => tsMs(e.closesAt) || Infinity;
    if (sort === 'deadline') {
      copy.sort((a, b) => {
        // Đề chưa làm lên trước
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

  /* ============ ĐỀ SẮP TỚI HẠN ============ */
  const upcoming = useMemo(() => {
    return enrichedExams
      .filter((e) => (e._st.key === 'todo' || e._st.key === 'doing') && e.closesAt)
      .map((e) => ({ ...e, _left: tsMs(e.closesAt) - Date.now() }))
      .filter((e) => e._left > 0)
      .sort((a, b) => a._left - b._left)
      .slice(0, 3);
  }, [enrichedExams]);

  /* ============ THỐNG KÊ ============ */
  const stats = useMemo(() => {
    const done = enrichedExams.filter((e) => e._sub).length;
    const scores = enrichedExams
      .filter((e) => e._sub && e._sub.totalPoints > 0)
      .map((e) => (e._sub.score / e._sub.totalPoints) * 100);
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    const pending = enrichedExams.filter((e) => e._st.key === 'todo' || e._st.key === 'doing').length;
    return { total: enrichedExams.length, done, avg, pending };
  }, [enrichedExams]);

  const classStats = useMemo(() => {
    return classes.map((c) => ({
      ...c,
      _memberCount: c.members?.length || c.memberIds?.length || 0,
    }));
  }, [classes]);

  /* ============ ACTIONS ============ */
  const openExam = (exam) => {
    if (exam._st.key === 'soon' || exam._st.key === 'closed') return;
    const token = exam.token || exam.id;
    window.location.hash = `exam/${token}`;
  };

  const openResult = (exam) => {
    if (!exam._sub) return;
    window.location.hash = `exam/${exam.token || exam.id}`;
  };

  /* ============ RENDER ============ */
  return (
    <div className="mc">
      {/* ===== HEADER ===== */}
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
          <button
            type="button"
            className="mc-btn primary"
            onClick={() => setShowJoin(true)}
          >
            <IconKey size={14} /> Vào lớp mới
          </button>
        </div>
      </header>

      {/* ===== JOIN MODAL ===== */}
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
              Nhập key lớp do giáo viên cung cấp để tham gia.
              Key thường có dạng <code>11A7-XXXX</code>.
            </p>
            <form onSubmit={handleJoin} className="mc-modal-form">
              <label className="mc-field">
                <span>Key lớp</span>
                <input
                  autoFocus
                  type="text"
                  value={joinKey}
                  onChange={(e) => { setJoinKey(e.target.value.toUpperCase()); setJoinError(''); }}
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
              <div className="mc-modal-actions">
                <button type="button" className="mc-btn" onClick={() => setShowJoin(false)} disabled={joinLoading}>
                  Hủy
                </button>
                <button type="submit" className="mc-btn primary" disabled={joinLoading || !joinKey.trim()}>
                  {joinLoading ? 'Đang vào…' : <><IconKey size={14} /> Vào lớp</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EMPTY STATE — CHƯA CÓ LỚP ===== */}
      {!loading && classes.length === 0 && (
        <div className="mc-empty">
          <span className="mc-empty-ico"><IconBook size={40} /></span>
          <h2>Bạn chưa tham gia lớp nào</h2>
          <p>Hỏi giáo viên để lấy key lớp, rồi bấm "Vào lớp mới" để tham gia.</p>
          <button type="button" className="mc-btn primary" onClick={() => setShowJoin(true)}>
            <IconKey size={14} /> Nhập key lớp
          </button>
        </div>
      )}

      {/* ===== LOADING ===== */}
      {loading && classes.length === 0 && (
        <div className="mc-loading">
          <div className="mc-spinner" />
          <p>Đang tải lớp học…</p>
        </div>
      )}

      {/* ===== MAIN LAYOUT ===== */}
      {!loading && classes.length > 0 && (
        <div className="mc-layout">
          {/* ---- SIDEBAR LỚP ---- */}
          <aside className="mc-side">
            <div className="mc-side-head">
              <h2>Lớp của tôi</h2>
              <span className="mc-side-count">{classes.length}</span>
            </div>

            <ul className="mc-class-list">
              {classStats.map((c) => {
                const isActive = c.id === selectedId;
                const color = subjectColor(c.subject);
                const memberCount = c._memberCount;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={'mc-class-item' + (isActive ? ' active' : '')}
                      onClick={() => setSelectedId(c.id)}
                      style={{ '--c': color }}
                    >
                      <span className="mc-class-avatar">
                        {String(c.name || '?')[0].toUpperCase()}
                      </span>
                      <div className="mc-class-info">
                        <b>{c.name}</b>
                        <small>GV {c.teacherName || 'Giáo viên'}</small>
                        <span className="mc-class-meta">
                          <IconUsers size={11} /> {memberCount} HS
                        </span>
                      </div>
                      {isActive && <IconChevron size={16} className="mc-class-chev" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mc-summary">
              <h3>Tổng quan</h3>
              <dl className="mc-summary-list">
                <div>
                  <dt><IconBook size={12} /> Đã làm</dt>
                  <dd>{stats.done}/{stats.total}</dd>
                </div>
                <div>
                  <dt><IconTrendUp size={12} /> Điểm TB</dt>
                  <dd>{stats.avg == null ? '—' : `${stats.avg}%`}</dd>
                </div>
                <div>
                  <dt><IconAlert size={12} /> Chưa làm</dt>
                  <dd className={stats.pending > 0 ? 'danger' : ''}>{stats.pending}</dd>
                </div>
              </dl>
            </div>
          </aside>

          {/* ---- MAIN ---- */}
          <main className="mc-main">
            {/* Đề sắp tới hạn */}
            {upcoming.length > 0 && (
              <section className="mc-upcoming">
                <header className="mc-upcoming-head">
                  <IconAlert size={15} />
                  <b>Sắp tới hạn ({upcoming.length})</b>
                </header>
                <ul className="mc-upcoming-list">
                  {upcoming.map((e) => {
                    const dl = fmtDeadline(e.closesAt);
                    return (
                      <li key={e.id}>
                        <button type="button" onClick={() => openExam(e)}>
                          <span className={'mc-upcoming-dot ' + (dl?.tone || 'normal')} />
                          <div className="mc-upcoming-info">
                            <b>{e.title}</b>
                            <small className={'mc-upcoming-time tone-' + (dl?.tone || 'normal')}>
                              <IconClock size={11} /> {dl?.text}
                            </small>
                          </div>
                          <IconChevron size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Toolbar */}
            <section className="mc-toolbar">
              <div className="mc-toolbar-left">
                <label className="mc-search">
                  <IconSearch size={15} />
                  <input
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
              </div>
              <div className="mc-toolbar-right">
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
              </div>
            </section>

            {/* Header lớp đang chọn */}
            {selectedClass && (
              <div className="mc-class-banner" style={{ '--c': subjectColor(selectedClass.subject) }}>
                <span className="mc-class-banner-avatar">
                  {String(selectedClass.name || '?')[0].toUpperCase()}
                </span>
                <div className="mc-class-banner-info">
                  <h2>{selectedClass.name}</h2>
                  <p>
                    GV {selectedClass.teacherName || 'Giáo viên'}
                    {selectedClass.subject && ` · ${selectedClass.subject}`}
                  </p>
                </div>
              </div>
            )}

            {/* Danh sách đề */}
            {loadingExams && exams.length === 0 ? (
              <div className="mc-loading-inline">
                <div className="mc-spinner" />
                <p>Đang tải đề…</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="mc-empty-inline">
                <span><IconBook size={28} /></span>
                <h3>Không có đề nào</h3>
                <p>
                  {filter !== 'all' || search
                    ? 'Thử đổi bộ lọc hoặc xoá từ khoá tìm kiếm.'
                    : 'Lớp này chưa có đề nào. Chờ giáo viên giao bài nhé.'}
                </p>
              </div>
            ) : (
              <ul className="mc-exam-list">
                {filteredExams.map((ex) => {
                  const dl = fmtDeadline(ex.closesAt);
                  const st = ex._st;
                  const sub = ex._sub;
                  const StatusIcon = st.Icon;
                  const pct = sub && sub.totalPoints > 0
                    ? Math.round((sub.score / sub.totalPoints) * 100)
                    : null;
                  return (
                    <li
                      key={ex.id}
                      className={'mc-exam-card status-' + st.key}
                    >
                      <div className="mc-exam-main">
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
                        <h3 className="mc-exam-title">{ex.title}</h3>
                        <p className="mc-exam-meta">
                          {ex.questions?.length || 0} câu
                          {' · '}{ex.duration || '—'} phút
                          {' · '}{ex.totalPoints || 0} điểm
                        </p>
                      </div>

                      <div className="mc-exam-side">
                        {sub ? (
                          <>
                            <div className="mc-exam-score">
                              <b>{sub.score}</b>
                              <small>/ {sub.totalPoints}</small>
                              {pct != null && <em>{pct}%</em>}
                            </div>
                            <div className="mc-exam-actions">
                              <button
                                type="button"
                                className="mc-btn sm"
                                onClick={() => openResult(ex)}
                              >
                                Xem lại
                              </button>
                              {ex.allowRetry && (
                                <button
                                  type="button"
                                  className="mc-btn sm primary"
                                  onClick={() => openExam(ex)}
                                >
                                  Làm lại
                                </button>
                              )}
                            </div>
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
                    </li>
                  );
                })}
              </ul>
            )}
          </main>
        </div>
      )}

      {toast && <div className="mc-toast" role="status">{toast}</div>}
    </div>
  );
}