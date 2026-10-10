/* ============================================================
   StudentClass.jsx — Trang "Lớp học" cho học sinh (v2)
   ------------------------------------------------------------
   Đây là trang khi HS bấm "Lớp học" (route #classroom) nhưng
   KHÔNG phải giáo viên PRO / admin.
   Có 2 chế độ:
     1) Nếu chưa có lớp → nhập key để gửi yêu cầu vào lớp
     2) Nếu đã có lớp → hiện danh sách lớp + đề của lớp đang chọn
   ------------------------------------------------------------
   Điểm mới so với v1:
     • Sau khi nhập key: hiện thông báo "Đang chờ duyệt" thay vì
       "Đã tham gia lớp".
     • Danh sách "Lớp chờ duyệt" hiển thị riêng.
   ============================================================ */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getClassesByStudent,
  getPendingClassesByStudent,
  joinClassByKey,
  getExamsByClass,
  getSubmissionForStudent,
} from '../lib/classroom.js';
import '../styles/classroom.css';

/* ============ SVG ICONS ============ */
const IcoBook = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
    <path d="M4 20a2 2 0 0 0 2 1h13v-3" />
    <path d="M8 7h7" />
  </svg>
);
const IcoKey = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
);
const IcoUsers = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5S15 16.6 15.6 20" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16 14.5c2.4.3 4.3 2.1 4.8 4.8" />
  </svg>
);
const IcoCheckCircle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l3 3 5-6" />
  </svg>
);
const IcoHourglass = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2h12M6 22h12M6 2v4c0 3 3 5 6 6-3 1-6 3-6 6v4M18 2v4c0 3-3 5-6 6 3 1 6 3 6 6v4" />
  </svg>
);
const IcoAlert = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IcoPlay = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
  </svg>
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

const fmtDeadline = (deadline) => {
  if (!deadline) return null;
  const diff = tsMs(deadline) - Date.now();
  if (diff <= 0) return { text: 'Đã đóng', tone: 'over' };
  const h = Math.floor(diff / 3600000);
  if (h < 24) return { text: `Còn ${h} giờ`, tone: 'urgent' };
  const d = Math.floor(diff / 86400000);
  return { text: `Còn ${d} ngày`, tone: d < 3 ? 'soon' : 'normal' };
};

/* ============================================================
   MAIN
   ============================================================ */
export default function StudentClass() {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [pendingClasses, setPendingClasses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);

  const [joinKey, setJoinKey] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinToast, setJoinToast] = useState('');

  const toastTimer = useRef(null);
  const say = useCallback((msg, ms = 2600) => {
    clearTimeout(toastTimer.current);
    setJoinToast(msg);
    toastTimer.current = setTimeout(() => setJoinToast(''), ms);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ============ LOAD LỚP ============ */
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
      if (list.length && !selectedId) setSelectedId(list[0].id);
    } catch (e) {
      console.error(e);
      say('Không tải được danh sách lớp.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedId, say]);

  useEffect(() => { loadClasses(); }, [user?.uid]); // eslint-disable-line

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedId) || null,
    [classes, selectedId]
  );

  /* ============ LOAD ĐỀ ============ */
  const loadExams = useCallback(async (classId) => {
    if (!classId || !user?.uid) return;
    setLoadingExams(true);
    try {
      const list = await getExamsByClass(classId);
      setExams(list);

      const subsMap = {};
      await Promise.all(list.map(async (ex) => {
        try {
          const sub = await getSubmissionForStudent(ex.id, user.uid);
          if (sub) subsMap[ex.id] = sub;
        } catch { /* chưa nộp */ }
      }));
      setSubmissions(subsMap);
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

  /* ============ JOIN ============ */
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

      setJoinKey('');

      if (res.pending) {
        say('Đã gửi yêu cầu vào lớp. Chờ giáo viên duyệt nhé!', 3200);
      } else if (res.already && !res.pending) {
        say('Bạn đã ở trong lớp này rồi.');
      } else {
        say('Đã tham gia lớp!');
      }

      await loadClasses();
    } catch (err) {
      setJoinError(err.message || 'Lỗi kết nối.');
    } finally {
      setJoinLoading(false);
    }
  };

  const openExam = (exam) => {
    const now = Date.now();
    const opensAt = tsMs(exam.opensAt);
    const closesAt = tsMs(exam.closesAt);
    if (opensAt && now < opensAt) return;
    if (closesAt && now > closesAt) return;
    window.location.hash = `exam/${exam.token || exam.id}`;
  };

  /* ============ RENDER ============ */
  if (loading) {
    return (
      <div className="sc-page">
        <div className="page-loader-spinner" />
        <p style={{ color: 'var(--mut)' }}>Đang tải lớp học…</p>
      </div>
    );
  }

  /* ----- MÀN CHƯA CÓ LỚP + CHƯA CHỜ DUYỆT ----- */
  if (classes.length === 0 && pendingClasses.length === 0) {
    return (
      <div className="sc-page">
        <div className="sc-keybox">
          <div className="sc-key-ico"><IcoKey size={36} /></div>
          <h1>Nhập key lớp</h1>
          <p className="sc-desc">
            Hỏi giáo viên để lấy key lớp (dạng <b>11A7-A3K9</b>).
            Sau khi nhập, bạn sẽ chờ giáo viên duyệt mới vào lớp được.
          </p>
          <form onSubmit={handleJoin}>
            <div className="sc-input-row">
              <input
                type="text"
                value={joinKey}
                onChange={(e) => { setJoinKey(e.target.value.toUpperCase()); setJoinError(''); }}
                placeholder="11A7-A3K9"
                maxLength={20}
                disabled={joinLoading}
                autoFocus
              />
              <button
                type="submit"
                className="td-btn primary"
                disabled={joinLoading || !joinKey.trim()}
              >
                {joinLoading ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </button>
            </div>
            {joinError && <p className="sc-error"><IcoAlert size={13} /> {joinError}</p>}
          </form>
          <p className="sc-note">
            <b>Lưu ý:</b> Giáo viên sẽ duyệt yêu cầu của bạn. Khi được duyệt, lớp sẽ xuất hiện trong danh sách.
          </p>
        </div>

        {joinToast && <div className="mc-toast" role="status">{joinToast}</div>}
      </div>
    );
  }

  /* ----- MÀN CÓ LỚP HOẶC ĐANG CHỜ DUYỆT ----- */
  return (
    <div className="sc-page-wide">
      <div className="sc-header">
        <h2>Lớp học</h2>
        {joinToast && (
          <span className="sc-toast-ok" role="status">
            <IcoCheckCircle size={14} /> {joinToast}
          </span>
        )}
      </div>

      {/* Nhập key để vào lớp mới */}
      <form onSubmit={handleJoin} className="sc-input-row sc-input-row-small">
        <input
          type="text"
          value={joinKey}
          onChange={(e) => { setJoinKey(e.target.value.toUpperCase()); setJoinError(''); }}
          placeholder="Nhập key lớp mới (VD: 11A7-A3K9)"
          maxLength={20}
          disabled={joinLoading}
        />
        <button
          type="submit"
          className="td-btn primary"
          disabled={joinLoading || !joinKey.trim()}
        >
          {joinLoading ? 'Đang gửi…' : 'Gửi yêu cầu'}
        </button>
      </form>

      {joinError && <p className="sc-error"><IcoAlert size={13} /> {joinError}</p>}

      {/* Lớp đang chờ duyệt */}
      {pendingClasses.length > 0 && (
        <>
          <h3 className="sc-section-title">
            <IcoHourglass size={16} /> Đang chờ duyệt ({pendingClasses.length})
          </h3>
          <div className="sc-class-list">
            {pendingClasses.map((c) => (
              <div key={c.id} className="sc-class-item" style={{ opacity: .8, cursor: 'default' }}>
                <span className="sc-class-ico">
                  <IcoHourglass size={20} />
                </span>
                <div className="sc-class-info">
                  <b>{c.name}</b>
                  <small>GV {c.teacherName || 'Giáo viên'} · đang chờ duyệt</small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lớp đã vào */}
      {classes.length > 0 && (
        <>
          <h3 className="sc-section-title">
            <IcoBook size={16} /> Lớp đã vào ({classes.length})
          </h3>
          <div className="sc-class-list">
            {classes.map((c) => {
              const isActive = c.id === selectedId;
              const memberCount = c.members?.length || c.memberIds?.length || 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={'sc-class-item' + (isActive ? ' active' : '')}
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className="sc-class-ico">
                    {String(c.name || '?')[0].toUpperCase()}
                  </span>
                  <div className="sc-class-info">
                    <b>{c.name}</b>
                    <small>GV {c.teacherName || 'Giáo viên'}</small>
                    <small><IcoUsers size={11} /> {memberCount} học sinh</small>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Đề của lớp đang chọn */}
          {selectedClass && (
            <>
              <h3 className="sc-section-title">
                <IcoBook size={16} /> Đề của lớp {selectedClass.name}
              </h3>

              {loadingExams && exams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="page-loader-spinner" />
                  <p style={{ color: 'var(--mut)' }}>Đang tải đề…</p>
                </div>
              ) : exams.length === 0 ? (
                <div className="sc-empty">
                  Lớp này chưa có đề nào. Chờ giáo viên giao bài nhé.
                </div>
              ) : (
                <div className="sc-exam-list">
                  {exams.map((ex) => {
                    const sub = submissions[ex.id];
                    const dl = fmtDeadline(ex.closesAt);
                    const opensAt = tsMs(ex.opensAt);
                    const closesAt = tsMs(ex.closesAt);
                    const now = Date.now();
                    const notOpen = opensAt && now < opensAt;
                    const closed = closesAt && now > closesAt;

                    let status;
                    if (sub) status = { key: 'done', label: 'Đã làm' };
                    else if (notOpen) status = { key: 'soon', label: 'Chưa mở' };
                    else if (closed) status = { key: 'closed', label: 'Đã đóng' };
                    else status = { key: 'todo', label: 'Chưa làm' };

                    return (
                      <div key={ex.id} className="sc-exam-item">
                        <div className="sc-exam-info">
                          <b>{ex.title}</b>
                          <small>
                            {ex.questions?.length || 0} câu · {ex.duration || '—'} phút
                            {dl && ` · ${dl.text}`}
                          </small>
                        </div>
                        <div className="sc-exam-actions">
                          {sub ? (
                            <span className="sc-toast-ok" style={{ padding: '.4rem .8rem' }}>
                              <IcoCheckCircle size={13} /> Đã làm
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="td-btn primary"
                              onClick={() => openExam(ex)}
                              disabled={notOpen || closed}
                            >
                              <IcoPlay size={13} /> {status.label}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}