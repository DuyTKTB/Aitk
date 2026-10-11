/* ============================================================
   LiveSessionBanner v2 — Banner "Phòng thi đang mở" cho học sinh
   ------------------------------------------------------------
   Sửa so với v1:
   • ẨN khi học sinh đã nộp bài của phòng thi đó (trước đây vẫn hiện "Vào thi ngay")
   • Tự tải lại danh sách lớp (mỗi 60s, khi quay lại tab, khi có mạng) →
     lớp mới được duyệt không cần reload trang
   • Có CHUÔNG để xem lại các phòng thi đã ẩn (nút ẩn ghi "bấm vào chuông" nhưng v1 không có chuông)
   ============================================================ */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { listenLiveSessionForClass, timeRemaining } from '../lib/examSession.js';
import { serverNow } from '../lib/serverClock.js';
import { getClassesByStudent, getSubmissionForStudent } from '../lib/classroom.js';
import {
  IcoDot, IcoClock, IcoUsers, IcoPlay, IcoClose, IcoBroadcast, IcoBell,
} from '../lib/sessionIcons.jsx';
import '../styles/live-session-banner.css';

const LS_KEY = 'cs-dismissed-sessions';
const DAY = 24 * 3600 * 1000;
const CLASS_REFRESH_MS = 60 * 1000;

const loadDismissed = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    const now = Date.now();
    // dọn các mục cũ hơn 1 ngày để localStorage không phình
    return Object.fromEntries(Object.entries(raw).filter(([, t]) => now - t < DAY));
  } catch { return {}; }
};

function fmtTime(seconds) {
  const s0 = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s0 / 3600);
  const m = Math.floor((s0 % 3600) / 60);
  const s = s0 % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function LiveSessionBanner() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [now, setNow] = useState(serverNow);
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [submittedMap, setSubmittedMap] = useState({}); // { [examId]: true }
  const [onExamPage, setOnExamPage] = useState(() => location.hash.startsWith('#exam/'));

  /* ---- Đồng hồ 1s ---- */
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ---- Danh sách lớp: tải lại định kỳ / khi quay lại tab / khi có mạng ---- */
  const loadClasses = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const list = await getClassesByStudent(user.uid);
      setClasses((prev) => {
        const a = prev.map((c) => c.id).sort().join(',');
        const b = list.map((c) => c.id).sort().join(',');
        return a === b ? prev : list; // không đổi → không kích hoạt lại listener
      });
    } catch (e) {
      console.warn('[LiveSessionBanner] load classes fail:', e.message);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadClasses();
    const id = setInterval(loadClasses, CLASS_REFRESH_MS);
    const onVis = () => { if (!document.hidden) loadClasses(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', loadClasses);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', loadClasses);
    };
  }, [loadClasses]);

  /* ---- Nghe phiên thi live của từng lớp ---- */
  useEffect(() => {
    if (classes.length === 0) { setSessions([]); return undefined; }
    const map = new Map();
    const unsubs = classes.map((cls) =>
      listenLiveSessionForClass(cls.id, (session) => {
        if (session) map.set(cls.id, { ...session, _class: cls });
        else map.delete(cls.id);
        setSessions(Array.from(map.values()));
      })
    );
    return () => unsubs.forEach((u) => u && u());
  }, [classes]);

  /* ---- Kiểm tra đã nộp chưa (mỗi examId kiểm tra 1 lần) ---- */
  useEffect(() => {
    if (!user?.uid) return;
    const todo = sessions.map((s) => s.examId).filter((id) => id && submittedMap[id] === undefined);
    if (!todo.length) return;
    let alive = true;
    (async () => {
      const entries = await Promise.all(todo.map(async (examId) => {
        try { return [examId, !!(await getSubmissionForStudent(examId, user.uid))]; }
        catch { return [examId, false]; }
      }));
      if (alive) setSubmittedMap((m) => ({ ...m, ...Object.fromEntries(entries) }));
    })();
    return () => { alive = false; };
  }, [sessions, user?.uid, submittedMap]);

  /* ---- Ẩn khi đang trong phòng thi ---- */
  useEffect(() => {
    const check = () => setOnExamPage(location.hash.startsWith('#exam/'));
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  /* ---- Handlers ---- */
  const persist = (next) => {
    setDismissed(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* */ }
  };
  const handleDismiss = useCallback((id) => persist({ ...dismissed, [id]: Date.now() }), [dismissed]);
  const handleRestore = useCallback(() => persist({}), []);
  const handleEnter = useCallback((s) => {
    const key = s.examToken || s.examId;
    if (key) location.hash = `exam/${key}`;
  }, []);

  /* ---- Lọc ---- */
  const { visible, hiddenCount } = useMemo(() => {
    const open = sessions.filter((s) => timeRemaining(s, now) > 0 && !submittedMap[s.examId]);
    return {
      visible: open.filter((s) => !dismissed[s.id]).sort((a, b) => timeRemaining(a, now) - timeRemaining(b, now)),
      hiddenCount: open.filter((s) => dismissed[s.id]).length,
    };
  }, [sessions, now, dismissed, submittedMap]);

  if (onExamPage) return null;
  if (visible.length === 0 && hiddenCount === 0) return null;

  return (
    <div className="lsb-wrap" role="region" aria-label="Phòng thi đang mở">
      {visible.map((s) => {
        const remaining = timeRemaining(s, now);
        const urgent = remaining < 300;
        return (
          <div key={s.id} className={'lsb-banner' + (urgent ? ' urgent' : '')} role="alert">
            <span className="lsb-dot" aria-hidden="true"><IcoDot size={9} /></span>
            <span className="lsb-ico" aria-hidden="true"><IcoBroadcast size={22} /></span>

            <div className="lsb-body">
              <div className="lsb-title-row">
                <b className="lsb-title">{s.title}</b>
                <span className="lsb-live-tag">LIVE</span>
              </div>
              <p className="lsb-meta">
                <span><IcoUsers size={12} /> {s._class?.name || 'Lớp học'}</span>
                <span className="lsb-sep">·</span>
                <span>GV {s.teacherName || 'Giáo viên'}</span>
                <span className="lsb-sep">·</span>
                <span className={urgent ? 'lsb-time urgent' : 'lsb-time'}>
                  <IcoClock size={12} /> Còn {fmtTime(remaining)}
                </span>
              </p>
              {urgent && <p className="lsb-urgent-note">Sắp hết giờ vào phòng thi!</p>}
            </div>

            <div className="lsb-actions">
              <button type="button" className="lsb-btn lsb-btn-enter" onClick={() => handleEnter(s)}>
                <IcoPlay size={14} /><span>Vào thi ngay</span>
              </button>
              <button type="button" className="lsb-btn lsb-btn-close" onClick={() => handleDismiss(s.id)}
                aria-label="Ẩn thông báo này" title="Ẩn (bấm chuông để xem lại)">
                <IcoClose size={14} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Chuông: xem lại phòng thi đã ẩn */}
      {visible.length === 0 && hiddenCount > 0 && (
        <button type="button" className="lsb-bell" onClick={handleRestore}
          aria-label={`Có ${hiddenCount} phòng thi đang mở. Bấm để hiện lại`}>
          <IcoBell size={16} />
          <span>{hiddenCount} phòng thi đang mở</span>
          <i className="lsb-bell-dot" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
