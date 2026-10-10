/* ============================================================
   LiveSessionBanner — Banner "Phòng thi đang mở" cho học sinh
   ------------------------------------------------------------
   • Tự động hiện khi cô giáo bắt đầu phiên thi cho lớp của HS
   • Hiển thị: tên đề, GV, thời gian còn lại, số bạn đã vào
   • Bấm "Vào thi ngay" → chuyển tới #exam/{token}
   • Ẩn khi: HS đã ở trong phòng thi / đã nộp / đề kết thúc
   ============================================================ */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  listenLiveSessionForClass,
  timeRemaining,
} from '../lib/examSession.js';
import { getClassesByStudent } from '../lib/classroom.js';
import {
  IcoDot, IcoBell, IcoClock, IcoUsers, IcoPlay,
  IcoArrowLeft, IcoClose, IcoBroadcast, IcoCheckCircle,
} from '../lib/sessionIcons.jsx';
import '../styles/live-session-banner.css';

/* ============================================================
   MAIN
   ============================================================ */
export default function LiveSessionBanner() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]); // nhiều lớp → nhiều session
  const [classes, setClasses] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cs-dismissed-sessions') || '{}'); }
    catch { return {}; }
  });

  /* ---- Clock 1s để cập nhật thời gian còn lại ---- */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ---- Load danh sách lớp của HS ---- */
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const list = await getClassesByStudent(user.uid);
        setClasses(list);
      } catch (e) {
        console.warn('[LiveSessionBanner] load classes fail:', e.message);
      }
    })();
  }, [user?.uid]);

  /* ---- Listen session live của từng lớp ---- */
  useEffect(() => {
    if (classes.length === 0) return undefined;

    const unsubs = [];
    const sessionMap = new Map();

    classes.forEach((cls) => {
      const unsub = listenLiveSessionForClass(cls.id, (session) => {
        if (session) {
          sessionMap.set(cls.id, { ...session, _class: cls });
        } else {
          sessionMap.delete(cls.id);
        }
        setSessions(Array.from(sessionMap.values()));
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u && u());
  }, [classes]);

  /* ---- Ẩn banner khi đang ở trong phòng thi ---- */
  const [onExamPage, setOnExamPage] = useState(false);
  useEffect(() => {
    const check = () => setOnExamPage(location.hash.startsWith('#exam/'));
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  /* ---- Handlers ---- */
  const handleDismiss = useCallback((sessionId) => {
    const next = { ...dismissed, [sessionId]: Date.now() };
    setDismissed(next);
    try { localStorage.setItem('cs-dismissed-sessions', JSON.stringify(next)); } catch {}
  }, [dismissed]);

  const handleEnter = useCallback((session) => {
    // Chuyển sang trang thi
    if (session.examToken) {
      location.hash = `exam/${session.examToken}`;
    } else if (session.examId) {
      // Nếu không có token (legacy), dùng examId
      location.hash = `exam/${session.examId}`;
    }
  }, []);

  /* ---- Không có gì để hiện ---- */
  if (onExamPage) return null;
  if (sessions.length === 0) return null;

  /* ---- Lọc: ẩn session đã dismissed, đã hết giờ ---- */
  const visible = sessions.filter((s) => {
    if (dismissed[s.id]) return false;
    const remaining = timeRemaining(s, now);
    if (remaining <= 0) return false;
    return true;
  });

  if (visible.length === 0) return null;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="lsb-wrap" role="region" aria-label="Phòng thi đang mở">
      {visible.map((s) => {
        const remaining = timeRemaining(s, now);
        const urgent = remaining < 300; // < 5 phút
        return (
          <div
            key={s.id}
            className={'lsb-banner' + (urgent ? ' urgent' : '')}
          >
            {/* Chấm LIVE nhấp nháy */}
            <span className="lsb-dot" aria-hidden="true">
              <IcoDot size={9} />
            </span>

            {/* Icon loa */}
            <span className="lsb-ico" aria-hidden="true">
              <IcoBroadcast size={22} />
            </span>

            {/* Nội dung */}
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
            </div>

            {/* Actions */}
            <div className="lsb-actions">
              <button
                type="button"
                className="lsb-btn lsb-btn-enter"
                onClick={() => handleEnter(s)}
              >
                <IcoPlay size={14} />
                <span>Vào thi ngay</span>
              </button>
              <button
                type="button"
                className="lsb-btn lsb-btn-close"
                onClick={() => handleDismiss(s.id)}
                aria-label="Ẩn thông báo này"
                title="Ẩn (bấm vào chuông để xem lại)"
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

/* ============================================================
   HELPERS
   ============================================================ */
function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}