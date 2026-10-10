import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  joinClassByKey,
  getClassesByStudent,
  getExamsByClass,
} from '../lib/classroom.js';
import '../styles/classroom.css';

/* ============ SVG ICONS ============ */
const IcoKey = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
);
const IcoCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoLink = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IcoDoc = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IcoUsers = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);

export default function StudentClass() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [joinedClass, setJoinedClass] = useState(null);
  const [myClasses, setMyClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user?.uid) return;
    try {
      const list = await getClassesByStudent(user.uid);
      setMyClasses(list);
      if (list.length > 0) {
        const current = activeClass || list[0];
        setActiveClass(current);
        const clsExams = await getExamsByClass(current.id);
        setExams(clsExams);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.uid]);

  const handleSubmit = async () => {
    const raw = input.trim();
    if (!raw) return;

    if (raw.includes('#exam/')) {
      const token = raw.split('#exam/')[1].split(/[?&#]/)[0];
      if (token) {
        window.location.hash = `exam/${token}`;
        return;
      }
    }

    try {
      const res = await joinClassByKey(raw, {
        id: user.uid,
        name: user.displayName || user.email,
        email: user.email,
      });

      if (res.ok) {
        setStatus('ok');
        setJoinedClass(res.class);
        setError('');
        setInput('');
        await refresh();
        if (res.already) setStatus('already');
      } else {
        setStatus('error');
        setError(res.error || 'Key không đúng.');
      }
    } catch (e) {
      setStatus('error');
      setError('Lỗi kết nối: ' + e.message);
    }
  };

  const selectClass = async (cls) => {
    setActiveClass(cls);
    try {
      const clsExams = await getExamsByClass(cls.id);
      setExams(clsExams);
    } catch (e) {
      console.error(e);
    }
    setStatus(null);
    setJoinedClass(null);
  };

  const copyExamLink = (exam) => {
    const link = `${window.location.origin}${window.location.pathname}#exam/${exam.token}`;
    try { navigator.clipboard.writeText(link); } catch {}
  };

  if (loading) {
    return (
      <div className="sc-page">
        <div className="page-loader-spinner" />
      </div>
    );
  }

  /* ============ CHƯA VÀO LỚP NÀO ============ */
  if (myClasses.length === 0 && !joinedClass) {
    return (
      <div className="sc-page">
        <div className="sc-keybox">
          <div className="sc-key-ico"><IcoKey /></div>
          <h1>Nhập key lớp học</h1>
          <p className="sc-desc">
            Dán <b>key lớp</b> (VD: LOP10A-X7K9) để vào lớp,
            hoặc dán <b>link đề</b> cô gửi để vào thi luôn.
          </p>

          <div className="sc-input-row">
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); setStatus(null); setError(''); }}
              placeholder="LOP10A-X7K9 hoặc link đề..."
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <button
              className="td-btn primary"
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              Tham gia
            </button>
          </div>

          {status === 'error' && (
            <p className="sc-error">{error}</p>
          )}

          <p className="sc-note">
            Tài khoản của bạn vẫn là <b>Free</b>, chỉ được làm đề riêng cô giáo giao.
          </p>
        </div>
      </div>
    );
  }

  /* ============ ĐÃ VÀO LỚP ============ */
  return (
    <div className="sc-page sc-page-wide">
      <div className="sc-header">
        <h2>Lớp học của tôi</h2>
        {joinedClass && status && (
          <div className="sc-toast-ok">
            <IcoCheck size={14} />
            <span>Đã tham gia lớp {joinedClass.name}!</span>
          </div>
        )}
      </div>

      <div className="sc-input-row sc-input-row-small">
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setStatus(null); setError(''); }}
          placeholder="Dán key lớp hoặc link đề khác..."
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          className="td-btn primary"
          onClick={handleSubmit}
          disabled={!input.trim()}
        >
          <IcoLink size={14} /> Vào
        </button>
      </div>

      {status === 'error' && <p className="sc-error">{error}</p>}

      <h3 className="sc-section-title">Các lớp đã tham gia ({myClasses.length})</h3>
      <div className="sc-class-list">
        {myClasses.map((cls) => (
          <button
            key={cls.id}
            className={'sc-class-item' + (activeClass?.id === cls.id ? ' active' : '')}
            onClick={() => selectClass(cls)}
          >
            <div className="sc-class-ico"><IcoUsers size={18} /></div>
            <div className="sc-class-info">
              <b>{cls.name}</b>
              <small>GV: {cls.teacherName} · {cls.members?.length || 0} HS</small>
            </div>
          </button>
        ))}
      </div>

      {activeClass && (
        <>
          <h3 className="sc-section-title">
            <IcoDoc size={16} /> Đề của lớp {activeClass.name} ({exams.length})
          </h3>
          {exams.length === 0 ? (
            <div className="sc-empty">Cô chưa giao đề nào cho lớp này.</div>
          ) : (
            <div className="sc-exam-list">
              {exams.map((ex) => {
                const link = `${window.location.origin}${window.location.pathname}#exam/${ex.token}`;
                return (
                  <div key={ex.id} className="sc-exam-item">
                    <div className="sc-exam-info">
                      <b>{ex.title}</b>
                      <small>{ex.questions.length} câu · {ex.duration} phút · {ex.totalPoints} điểm</small>
                    </div>
                    <div className="sc-exam-actions">
                      <button
                        className="td-btn sm"
                        onClick={() => copyExamLink(ex)}
                        title="Sao chép link"
                      >
                        <IcoLink size={13} />
                      </button>
                      <a className="td-btn sm primary" href={'#exam/' + ex.token}>
                        Vào thi
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}