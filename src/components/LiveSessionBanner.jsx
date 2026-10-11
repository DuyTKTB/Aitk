/* ============================================================
   LiveSessionBanner.jsx — v4
   ------------------------------------------------------------
   Thông báo "Phòng thi đang mở" cho học sinh.

   v4:
     • Giao diện mới: thẻ nổi có vòng đếm ngược (còn bao nhiêu % thời gian),
       tiêu đề, lớp · giáo viên, nút "Vào thi ngay". Xem live-session-banner.css.
     • SỬA LỖI HS không thấy thông báo: bản cũ ẩn banner nếu HS đã từng nộp
       ĐỀ ĐÓ ở bất kỳ phiên nào. Khi GV mở lại cùng một đề (như 7 phiên cùng
       đề trong ảnh chụp) thì HS đã làm trước đó sẽ không bao giờ thấy banner
       nữa. Nay chỉ ẩn khi bài nộp thuộc CHÍNH phiên này
       (submittedAtMs >= startedAtMs của phiên).
     • Không hiện banner cho chính giáo viên tạo phiên (họ đã có nút "Giám sát").
     • Giữ các sửa lỗi v3 (kiểm tra "đã nộp" lại khi rời trang thi, đồng hồ
       chỉ chạy khi có phòng, dọn mục ẩn cũ).
   ============================================================ */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { listenLiveSessionForClass, timeRemaining } from '../lib/examSession.js';
import { getClassesByStudent, getSubmissionForStudent } from '../lib/classroom.js';
import { IcoClock, IcoUsers, IcoUser, IcoPlay, IcoClose } from '../lib/sessionIcons.jsx';
import '../styles/live-session-banner.css';

const CLASS_REFRESH_MS = 30000;
const URGENT_SECONDS = 300;

const subMs = (sub) =>
  sub?.submittedAtMs ?? sub?.submittedAt?.toMillis?.() ?? (typeof sub?.submittedAt === 'number' ? sub.submittedAt : 0);

export default function LiveSessionBanner() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [submittedAt, setSubmittedAt] = useState({}); // examId -> thời điểm nộp gần nhất (ms)
  const [dismissed, setDismissed] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('cs-dismissed-sessions') || '{}');
      const cutoff = Date.now() - 7 * 864e5;
      return Object.fromEntries(Object.entries(raw).filter(([, at]) => at > cutoff));
    } catch { return {}; }
  });

  const classIdsRef = useRef('');

  /* Đồng hồ 1s — chỉ chạy khi có phòng thi */
  const hasSessions = sessions.length > 0;
  useEffect(() => {
    if (!hasSessions) return undefined;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasSessions]);

  /* Danh sách lớp của HS (tải lại mỗi 30s để bắt lớp mới được duyệt) */
  useEffect(() => {
    if (!user?.uid) return undefined;
    let alive = true;
    const load = async () => {
      try {
        const list = await getClassesByStudent(user.uid);
        if (!alive) return;
        const key = list.map((c) => c.id).sort().join(',');
        if (key !== classIdsRef.current) {
          classIdsRef.current = key;
          setClasses(list);
        }
      } catch (e) {
        console.warn('[LiveSessionBanner] load classes fail:', e.message);
      }
    };
    load();
    const t = setInterval(load, CLASS_REFRESH_MS);
    return () => { alive = false; clearInterval(t); };
  }, [user?.uid]);

  /* Nghe phòng thi đang mở của từng lớp */
  useEffect(() => {
    if (classes.length === 0) { setSessions([]); return undefined; }
    const unsubs = [];
    const sessionMap = new Map();
    classes.forEach((cls) => {
      const unsub = listenLiveSessionForClass(cls.id, (session) => {
        if (session) sessionMap.set(cls.id, { ...session, _class: cls });
        else sessionMap.delete(cls.id);
        setSessions(Array.from(sessionMap.values()));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u && u());
  }, [classes]);

  const [onExamPage, setOnExamPage] = useState(() => location.hash.startsWith('#exam/'));
  useEffect(() => {
    const check = () => setOnExamPage(location.hash.startsWith('#exam/'));
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  /* Lấy thời điểm HS nộp từng đề; tải lại mỗi khi HS rời trang thi */
  const sessionExamKey = sessions.map((s) => s.examId).filter(Boolean).sort().join(',');
  useEffect(() => {
    if (!user?.uid || !sessionExamKey || onExamPage) return undefined;
    let alive = true;
    (async () => {
      const found = {};
      await Promise.all(sessionExamKey.split(',').map(async (examId) => {
        try {
          const sub = await getSubmissionForStudent(examId, user.uid);
          if (sub) found[examId] = subMs(sub) || Date.now();
        } catch { /* */ }
      }));
      if (alive && Object.keys(found).length) setSubmittedAt((prev) => ({ ...prev, ...found }));
    })();
    return () => { alive = false; };
  }, [sessionExamKey, user?.uid, onExamPage]);

  const handleDismiss = useCallback((sessionId) => {
    setDismissed((prev) => {
      const next = { ...prev, [sessionId]: Date.now() };
      try { localStorage.setItem('cs-dismissed-sessions', JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }, []);

  const handleEnter = useCallback((session) => {
    const token = session.examToken || session.examId;
    if (token) location.hash = `exam/${token}`;
  }, []);

  if (onExamPage || sessions.length === 0) return null;

  const visible = sessions.filter((s) => {
    if (s.teacherId && s.teacherId === user?.uid) return false; // GV chủ phiên không cần banner
    if (dismissed[s.id]) return false;
    const mine = submittedAt[s.examId];
    if (mine && mine >= (s.startedAtMs || 0)) return false; // đã nộp TRONG phiên này
    return timeRemaining(s, now) > 0;
  });

  if (visible.length === 0) return null;

  return (
    <div className="lsb-wrap" role="region" aria-label="Phòng thi đang mở">
      {visible.map((s) => {
        const remaining = timeRemaining(s, now);
        const urgent = remaining < URGENT_SECONDS;
        const total =
          (Number(s.duration) || 0) * 60 ||
          Math.max(1, Math.round(((s.closesAtMs || 0) - (s.startedAtMs || 0)) / 1000));
        const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
        const earlier = submittedAt[s.examId] && submittedAt[s.examId] < (s.startedAtMs || 0);

        return (
          <div key={s.id} className={'lsb-banner' + (urgent ? ' urgent' : '')}>
            <div className="lsb-ring" style={{ '--p': pct }} aria-hidden="true">
              <span className="lsb-ring-time">{fmtTime(remaining)}</span>
            </div>

            <div className="lsb-body">
              <div className="lsb-title-row">
                <span className="lsb-live-tag"><i aria-hidden="true" />Đang thi</span>
                <b className="lsb-title" title={s.title}>{s.title}</b>
              </div>
              <p className="lsb-meta">
                <span><IcoUsers size={12} /> {s._class?.name || 'Lớp học'}</span>
                <span className="lsb-sep" aria-hidden="true" />
                <span><IcoUser size={12} /> {s.teacherName || 'Giáo viên'}</span>
                <span className="lsb-sep" aria-hidden="true" />
                <span className={'lsb-time' + (urgent ? ' urgent' : '')}>
                  <IcoClock size={12} /> Còn {fmtLeft(remaining)}
                </span>
              </p>
              {earlier && <p className="lsb-note">Bạn đã làm đề này ở phiên trước.</p>}
            </div>

            <div className="lsb-actions">
              <button type="button" className="lsb-btn lsb-btn-enter" onClick={() => handleEnter(s)}>
                <IcoPlay size={13} />
                <span>Vào thi ngay</span>
              </button>
              <button
                type="button"
                className="lsb-btn lsb-btn-close"
                onClick={() => handleDismiss(s.id)}
                aria-label="Ẩn thông báo này"
                title="Ẩn thông báo phòng thi này"
              >
                <IcoClose size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* "4 phút 41 giây" / "58 giây" — dễ đọc hơn mm:ss cho dòng chữ */
function fmtLeft(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} phút ${String(s).padStart(2, '0')} giây` : `${s} giây`;
}