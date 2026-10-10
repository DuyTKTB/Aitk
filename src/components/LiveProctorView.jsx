/* ============================================================
   LiveProctorView.jsx — Giám sát trực tiếp (Vitality)
   ------------------------------------------------------------
   Sidebar: Camera | Nhật ký | Danh sách | Báo cáo
   Quản lý camera mới:
     • Lọc: Tất cả / Online / Vi phạm / Mất hình / Đã nộp
     • Sắp xếp: ưu tiên rủi ro / tên / tiến độ + Ghim HS
     • Cỡ ô camera S / M / L
     • Thanh sức khỏe camera
     • "Cần chú ý": xếp hạng HS theo điểm rủi ro
     • Âm báo khi có vi phạm nặng mới
     • Nhắc cả phòng, lời nhắc nhanh, chuyển HS trước/sau (← →)
     • Báo cáo CSV: danh sách + chi tiết vi phạm
     • [MỚI] Nút "Cảnh báo nghiêm trọng" + "Yêu cầu tạm dừng"
   ============================================================ */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  listenSession,
  listenSessionStudents,
  endExamSession,
  kickStudent,
  warnStudent,
  isStudentOnline,
  timeRemaining,
  shortName,
  latestViolation,
  secondsSinceUpdate,
} from '../lib/examSession.js';
import {
  IcoDot, IcoBroadcast, IcoCameraOff, IcoVideo, IcoAlert, IcoShield,
  IcoStop, IcoDownload, IcoUserKick, IcoBell, IcoClock, IcoUsers,
  IcoCheckCircle, IcoChart, IcoChevronRight,
  IcoArrowLeft, IcoWifiOff, IcoGrid,
  violationMeta, statusIcon,
} from '../lib/sessionIcons.jsx';
import {
  DashFrame, Topbar, Modal, Donut, TrendChart, Avatar,
  fmtMMSS, fmtClock, downloadCsv,
} from './DashShell.jsx';

/* ============================================================
   HELPERS
   ============================================================ */
const STALE_SEC = 12;

const QUICK_WARNS = [
  'Hãy tự làm bài của mình.',
  'Giữ khuôn mặt trong khung hình.',
  'Quay lại màn hình làm bài.',
  'Còn ít thời gian, kiểm tra lại bài.',
];

const SEVERE_WARN = '⚠ CẢNH BÁO NGHIÊM TRỌNG: Bạn đã vi phạm quy chế thi. Vi phạm thêm sẽ bị mời ra khỏi phòng.';
const PAUSE_MSG = '⏸ Giáo viên yêu cầu bạn TẠM DỪNG làm bài. Vui lòng ngồi yên và chờ hướng dẫn.';

function hardCount(st) {
  return (st.violations || []).filter((v) => v.severity === 'hard').length;
}
function softCount(st) {
  return (st.violations || []).filter((v) => v.severity !== 'hard').length;
}
function riskOf(st, now) {
  if (st.status === 'submitted' || st.status === 'kicked') return 0;
  const online = isStudentOnline(st, now);
  const stale = secondsSinceUpdate(st, now) > STALE_SEC;
  return hardCount(st) * 3 + softCount(st) + (!online ? 2 : 0) + (online && stale ? 1 : 0);
}
function camState(st, now) {
  if (st.status === 'submitted' || st.status === 'kicked') return 'done';
  if (!isStudentOnline(st, now)) return 'off';
  if (!st.thumbnail) return 'none';
  return secondsSinceUpdate(st, now) > STALE_SEC ? 'stale' : 'ok';
}

function useBeep(enabled) {
  const ctxRef = useRef(null);
  return useCallback(() => {
    if (!enabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ctxRef.current = ctxRef.current || new Ctx();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      o.start();
      o.stop(ctx.currentTime + 0.36);
    } catch { /* */ }
  }, [enabled]);
}

/* ============================================================
   CAM CARD
   ============================================================ */
function CamCard({ st, now, total, pinned, highlight, onOpen, onPin }) {
  const online = isStudentOnline(st, now);
  const viol = latestViolation(st);
  const hard = viol?.severity === 'hard';
  const meta = viol ? violationMeta(viol.type) : null;
  const StatusIcon = statusIcon(st.status);
  const state = camState(st, now);
  const since = secondsSinceUpdate(st, now);
  const burstFresh = Array.isArray(st.burst?.frames) && st.burst.frames.length > 0 && now - (st.burst.at || 0) < 30000;
  const progress = total > 0 ? Math.min(100, Math.round(((st.answered || 0) / total) * 100)) : null;

  const cls = [
    'vt-cam',
    hard && st.status !== 'submitted' ? 'alert' : '',
    st.status === 'submitted' ? 'done' : '',
    st.status === 'kicked' ? 'kicked' : '',
    !online && st.status !== 'submitted' ? 'offline' : '',
    highlight ? 'hl' : '',
    pinned ? 'pinned' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <button type="button" className="vt-cam-open" onClick={() => onOpen(st)} aria-label={`${st.studentName} — ${st.status}`}>
        <div className="vt-cam-thumb">
          {st.thumbnail ? (
            <img key={st.thumbnailAtMs || 0} src={st.thumbnail} alt="" />
          ) : (
            <div className="vt-cam-none"><IcoCameraOff size={24} /></div>
          )}

          <span className={'vt-cam-live' + (online ? ' on' : '')}>
            <IcoDot size={7} /> {online ? 'LIVE' : 'OFF'}
          </span>

          {hard && meta && st.status !== 'submitted' && (
            <span className="vt-cam-viol" title={meta.label}><meta.Icon size={12} /> {hardCount(st)}</span>
          )}
          {burstFresh && (
            <span className="vt-cam-burst"><IcoBroadcast size={11} /> {st.burst.frames.length}</span>
          )}
          {state === 'stale' && (
            <div className="vt-cam-stale"><IcoCameraOff size={18} /><span>Mất hình {since}s</span></div>
          )}
          {state === 'off' && st.thumbnail && (
            <div className="vt-cam-stale"><IcoWifiOff size={18} /><span>Mất kết nối</span></div>
          )}
        </div>

        <div className="vt-cam-foot">
          <Avatar name={st.studentName} size={30} />
          <div className="vt-cam-name">
            <b title={st.studentName}>{shortName(st.studentName)}</b>
            {progress != null ? (
              <div className="vt-bar sm"><i style={{ width: `${progress}%` }} /></div>
            ) : (
              <small>{st.answered || 0} câu</small>
            )}
          </div>
          <span className={'vt-cam-st st-' + st.status}><StatusIcon size={13} /></span>
        </div>
      </button>

      <button
        type="button"
        className={'vt-cam-pin' + (pinned ? ' on' : '')}
        onClick={() => onPin(st.id)}
        aria-pressed={pinned}
        title={pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
        aria-label={pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
      >
        <IcoDot size={9} />
      </button>
    </div>
  );
}

/* ============================================================
   STUDENT MODAL
   ============================================================ */
function StudentModal({ student, total, onClose, onKick, onWarn, onPrev, onNext, index, count, requestKick }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const online = isStudentOnline(student);
  const violations = student.violations || [];
  const progress = total > 0 ? Math.min(100, Math.round(((student.answered || 0) / total) * 100)) : null;

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onPrev, onNext]);

  const send = async (msg) => {
    const m = (msg ?? text).trim();
    if (!m) return;
    await onWarn(student.id, m);
    setText('');
    setSent(true);
    setTimeout(() => setSent(false), 1600);
  };

  const statusText =
    student.status === 'examining' ? 'Đang làm bài'
      : student.status === 'submitted' ? 'Đã nộp bài'
        : student.status === 'kicked' ? 'Đã bị mời ra'
          : 'Đã vào phòng';

  return (
    <Modal
      size="xl"
      onClose={onClose}
      title={
        <span className="vt-sm-title">
          <Avatar name={student.studentName} size={36} />
          <span>
            <b>{student.studentName}</b>
            <small><IcoDot size={7} /> {online ? 'Online' : 'Mất kết nối'} · {statusText}</small>
          </span>
        </span>
      }
    >
      <div className="vt-sm">
        <div className="vt-sm-left">
          <div className="vt-sm-shot">
            {student.thumbnail ? <img src={student.thumbnail} alt="" /> : (
              <div className="vt-cam-none big"><IcoCameraOff size={44} /><p>Chưa có ảnh từ camera</p></div>
            )}
            {student.thumbnailAtMs && (
              <span className="vt-sm-time"><IcoClock size={11} /> {fmtClock(student.thumbnailAtMs)}</span>
            )}
            <div className="vt-sm-nav">
              <button type="button" className="vt-icon-btn" onClick={onPrev} aria-label="Học sinh trước"><IcoArrowLeft size={16} /></button>
              <span>{index + 1}/{count}</span>
              <button type="button" className="vt-icon-btn" onClick={onNext} aria-label="Học sinh sau"><IcoChevronRight size={16} /></button>
            </div>
          </div>

          {Array.isArray(student.burst?.frames) && student.burst.frames.length > 0 && (
            <div className="vt-burst">
              <header><IcoBroadcast size={14} /><b>Diễn biến lúc vi phạm</b><small>{fmtClock(student.burst.at)}</small></header>
              <div>
                {student.burst.frames.map((f, i) => <img key={i} src={f} alt={`Khung ${i + 1}`} />)}
              </div>
            </div>
          )}
        </div>

        <div className="vt-sm-right">
          <div className="vt-sm-facts">
            <div>
              <Donut value={progress ?? 0} size={78} stroke={8}>
                <strong className="sm">{student.answered || 0}{total ? `/${total}` : ''}</strong>
              </Donut>
              <small>đã trả lời</small>
            </div>
            <div><b>{(student.currentQuestion || 0) + 1}</b><small>câu hiện tại</small></div>
            <div className={hardCount(student) ? 'danger' : ''}><b>{violations.length}</b><small>vi phạm</small></div>
            <div><b>{fmtClock(student.joinedAtMs)}</b><small>vào phòng</small></div>
          </div>

          <section className="vt-sm-viol">
            <h4><IcoAlert size={14} /> Lịch sử vi phạm</h4>
            {violations.length === 0 ? (
              <p className="vt-muted"><IcoShield size={14} /> Chưa có vi phạm nào.</p>
            ) : (
              <ul>
                {[...violations].reverse().map((v, i) => {
                  const m = violationMeta(v.type);
                  return (
                    <li key={i} className={'sev-' + v.severity}>
                      <span className="t">{fmtClock(v.at)}</span>
                      <span className="i"><m.Icon size={13} /></span>
                      <span className="l">{m.label}</span>
                      {v.snapshotUrl && <a href={v.snapshotUrl} target="_blank" rel="noopener noreferrer">Ảnh</a>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="vt-sm-warn">
            <h4><IcoBell size={14} /> Nhắc học sinh</h4>
            <div className="vt-quick-warns">
              {QUICK_WARNS.map((w) => (
                <button key={w} type="button" className="vt-pill sm" onClick={() => send(w)}>{w}</button>
              ))}
            </div>

            {/* Nút cảnh báo nghiêm trọng */}
            <div style={{ marginTop: '.7rem' }}>
              <button
                type="button"
                className="vt-btn danger block"
                onClick={() => send(SEVERE_WARN)}
                disabled={!online}
              >
                <IcoAlert size={14} /> Cảnh báo nghiêm trọng
              </button>
            </div>

            {/* Nút yêu cầu tạm dừng */}
            <div style={{ marginTop: '.5rem' }}>
              <button
                type="button"
                className="vt-btn warning block"
                onClick={() => send(PAUSE_MSG)}
                disabled={!online}
                style={{ background: '#f59e0b', color: '#fff', borderColor: '#f59e0b' }}
              >
                <IcoClock size={14} /> Yêu cầu tạm dừng
              </button>
            </div>

            <div className="vt-warn-row" style={{ marginTop: '.7rem' }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Nhập lời nhắc riêng…"
                maxLength={200}
                aria-label="Lời nhắc"
              />
              <button type="button" className="vt-btn primary" onClick={() => send()} disabled={!text.trim()}>
                {sent ? <><IcoCheckCircle size={14} /> Đã gửi</> : 'Gửi'}
              </button>
            </div>
          </section>

          <button type="button" className="vt-btn danger block" onClick={() => requestKick(student)}>
            <IcoUserKick size={14} /> Mời ra khỏi phòng
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function LiveProctorView({ sessionId, onBack, className: classNameProp, totalQuestions = 0 }) {
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [now, setNow] = useState(Date.now());

  const [view, setView] = useState('camera');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('risk');
  const [size, setSize] = useState('m');
  const [search, setSearch] = useState('');
  const [pinned, setPinned] = useState(() => new Set());
  const [sound, setSound] = useState(true);
  const [chartMode, setChartMode] = useState('line');
  const [logFilter, setLogFilter] = useState('all');

  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [toast, setToast] = useState(null);

  const seenViolRef = useRef(new Map());
  const loadedRef = useRef(false);
  const toastTimer = useRef(null);
  const beep = useBeep(sound);

  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sessionId) return undefined;
    return listenSession(sessionId, (s) => setSession(s));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    return listenSessionStudents(sessionId, (list) => setStudents(list));
  }, [sessionId]);

  useEffect(() => {
    const fresh = [];
    for (const st of students) {
      const vs = st.violations || [];
      const seen = seenViolRef.current.get(st.id) || 0;
      if (vs.length > seen) {
        for (let i = seen; i < vs.length; i++) {
          fresh.push({ id: `${st.id}-${i}`, studentId: st.id, studentName: st.studentName, ...vs[i] });
        }
        seenViolRef.current.set(st.id, vs.length);
      }
    }
    if (fresh.length > 0) {
      setLogs((prev) => [...fresh, ...prev].sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 200));
      if (loadedRef.current && fresh.some((f) => f.severity === 'hard')) beep();
    }
    if (students.length > 0) loadedRef.current = true;
  }, [students]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- DERIVED ---------- */
  const remaining = session ? timeRemaining(session, now) : 0;
  const isEnded = session?.status === 'ended';
  const duration = (session?.duration || 1) * 60;

  const stats = useMemo(() => {
    const online = students.filter((s) => isStudentOnline(s, now) && s.status !== 'submitted' && s.status !== 'kicked').length;
    const submitted = students.filter((s) => s.status === 'submitted').length;
    const violators = students.filter((s) => hardCount(s) > 0).length;
    const camBad = students.filter((s) => ['stale', 'none'].includes(camState(s, now))).length;
    const offline = students.filter((s) => camState(s, now) === 'off').length;
    const camOk = students.filter((s) => camState(s, now) === 'ok').length;
    const active = students.filter((s) => s.status !== 'submitted' && s.status !== 'kicked');
    return { online, submitted, violators, camBad, offline, camOk, active };
  }, [students, now]);

  const filterDefs = [
    { key: 'all', label: 'Tất cả', test: () => true },
    { key: 'online', label: 'Online', test: (s) => isStudentOnline(s, now) && s.status !== 'submitted' && s.status !== 'kicked' },
    { key: 'viol', label: 'Vi phạm', test: (s) => hardCount(s) > 0 },
    { key: 'cam', label: 'Mất hình', test: (s) => ['stale', 'none', 'off'].includes(camState(s, now)) && s.status !== 'submitted' && s.status !== 'kicked' },
    { key: 'done', label: 'Đã nộp', test: (s) => s.status === 'submitted' },
  ];
  const filterTabs = filterDefs.map((f) => ({ key: f.key, label: f.label, count: students.filter(f.test).length }));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const def = filterDefs.find((f) => f.key === filter) || filterDefs[0];
    const list = students.filter((s) => def.test(s) && (!q || s.studentName?.toLowerCase().includes(q)));
    const cmp = {
      risk: (a, b) => riskOf(b, now) - riskOf(a, now),
      name: (a, b) => shortName(a.studentName).localeCompare(shortName(b.studentName), 'vi'),
      progress: (a, b) => (a.answered || 0) - (b.answered || 0),
    }[sort];
    return [...list].sort((a, b) => {
      const pa = pinned.has(a.id) ? 1 : 0;
      const pb = pinned.has(b.id) ? 1 : 0;
      return pb - pa || cmp(a, b);
    });
  }, [students, filter, search, sort, pinned, now]); // eslint-disable-line

  const attention = useMemo(
    () => students
      .map((s) => ({ s, r: riskOf(s, now) }))
      .filter((x) => x.r > 0)
      .sort((a, b) => b.r - a.r)
      .slice(0, 5),
    [students, now]
  );

  const progressPoints = useMemo(
    () => students.map((s) => ({
      label: s.studentName,
      value: totalQuestions > 0 ? Math.round(((s.answered || 0) / totalQuestions) * 100) : (s.answered || 0),
    })),
    [students, totalQuestions]
  );
  const progressMax = totalQuestions > 0 ? 100 : Math.max(1, ...progressPoints.map((p) => p.value));
  const avgProgress = progressPoints.length
    ? Math.round(progressPoints.reduce((a, b) => a + b.value, 0) / progressPoints.length)
    : 0;

  const selected = selectedId ? students.find((s) => s.id === selectedId) : null;
  const selIndex = selected ? visible.findIndex((s) => s.id === selected.id) : -1;
  const navList = selIndex >= 0 ? visible : students;
  const navIndex = selIndex >= 0 ? selIndex : navList.findIndex((s) => s.id === selectedId);
  const step = (d) => {
    if (navList.length === 0) return;
    const next = (Math.max(0, navIndex) + d + navList.length) % navList.length;
    setSelectedId(navList[next].id);
  };

  /* ---------- ACTIONS ---------- */
  const togglePin = (id) => setPinned((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const handleEnd = async () => {
    try {
      await endExamSession(sessionId);
      setConfirmEnd(false);
      say('Đã kết thúc phòng thi');
    } catch (e) {
      say('Không kết thúc được: ' + e.message);
    }
  };

  const handleKick = useCallback(async (studentId, reason) => {
    await kickStudent({ sessionId, studentId, reason });
  }, [sessionId]);

  const handleWarn = useCallback(async (studentId, message) => {
    await warnStudent({ sessionId, studentId, message });
  }, [sessionId]);

  const sendBroadcast = async () => {
    const m = broadcastText.trim();
    if (!m) return;
    const targets = stats.active;
    await Promise.all(targets.map((s) => warnStudent({ sessionId, studentId: s.id, message: m })));
    setBroadcastOpen(false);
    setBroadcastText('');
    say(`Đã nhắc ${targets.length} học sinh`);
  };

  const exportReport = () => {
    if (!session || students.length === 0) { say('Chưa có học sinh để xuất'); return; }
    const rows = [
      ['BÁO CÁO PHÒNG THI', session.title],
      ['Lớp', classNameProp || session.classId],
      ['Giáo viên', session.teacherName],
      ['Bắt đầu', session.startedAtMs ? new Date(session.startedAtMs).toLocaleString('vi-VN') : ''],
      ['Kết thúc', isEnded ? new Date(session.endedAtMs || Date.now()).toLocaleString('vi-VN') : 'Chưa kết thúc'],
      [],
      ['Học sinh', 'Trạng thái', 'Đã trả lời', 'Vi phạm nặng', 'Vi phạm nhẹ', 'Vào phòng', 'Chi tiết vi phạm'],
    ];
    students.forEach((st) => {
      const detail = (st.violations || [])
        .map((v) => `${fmtClock(v.at)} ${violationMeta(v.type).label}`)
        .join(' | ');
      rows.push([st.studentName, st.status, st.answered || 0, hardCount(st), softCount(st), fmtClock(st.joinedAtMs), detail]);
    });
    const safe = (session.title || 'phong-thi').replace(/[^\p{L}\p{N}]+/gu, '-');
    downloadCsv(`bao-cao-${safe}.csv`, rows);
    say('Đã xuất báo cáo');
  };

  /* ---------- LOADING ---------- */
  if (!session) {
    return (
      <div className="vt"><div className="vt-loading">
        <div className="page-loader-spinner" />
        <p>Đang tải phòng thi…</p>
      </div></div>
    );
  }

  const navItems = [
    { key: 'camera', label: 'Camera', Icon: IcoVideo },
    { key: 'log', label: 'Nhật ký', Icon: IcoAlert, badge: logs.filter((l) => l.severity === 'hard').length || null },
    { key: 'list', label: 'Danh sách', Icon: IcoUsers },
    { key: 'report', label: 'Báo cáo', Icon: IcoChart },
  ];

  const timerTone = remaining < 60 ? 'danger' : remaining < 300 ? 'warn' : 'acc';

  const sideNote = (
    <div className="vt-side-note">
      <span className={'vt-live-pill' + (isEnded ? ' ended' : '')}><IcoDot size={7} /> {isEnded ? 'Đã kết thúc' : 'LIVE'}</span>
      <b title={session.title}>{session.title}</b>
      <small>Lớp {classNameProp || session.classId}</small>
    </div>
  );

  const topTabs = view === 'camera' ? filterTabs : null;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <DashFrame
      items={navItems}
      active={view}
      onChange={setView}
      onExit={onBack}
      exitLabel="Về quản lý lớp"
      sideNote={sideNote}
    >
      <Topbar
        title="Giám sát trực tiếp"
        subtitle={`${session.title} · Lớp ${classNameProp || session.classId}`}
        tabs={topTabs}
        active={filter}
        onTab={setFilter}
        search={search}
        onSearch={view === 'camera' || view === 'list' ? setSearch : undefined}
        placeholder="Tìm học sinh…"
        bell={{
          on: sound,
          pressed: sound,
          onClick: () => setSound((v) => !v),
          title: sound ? 'Âm báo vi phạm: đang bật' : 'Âm báo vi phạm: đang tắt',
        }}
      />

      {/* HERO */}
      <div className="vt-row-hero">
        <div className="vt-hero">
          <div className="vt-hero-left">
            <span className="vt-hero-label">{isEnded ? 'Đã kết thúc' : 'Thời gian còn lại'}</span>
            <div className="vt-hero-num time">
              <b>{isEnded ? '--:--' : fmtMMSS(remaining)}</b>
            </div>
            <dl className="vt-hero-facts">
              <div><dt>Đã vào</dt><dd>{students.length}</dd></div>
              <div><dt>Đã nộp</dt><dd>{stats.submitted}</dd></div>
            </dl>
            {!isEnded && (
              <div className="vt-hero-btns">
                <button type="button" className="vt-hero-btn" onClick={() => setBroadcastOpen(true)}>
                  <IcoBell size={14} /> Nhắc cả phòng
                </button>
                <button type="button" className="vt-hero-btn ghost" onClick={() => setConfirmEnd(true)}>
                  <IcoStop size={13} /> Kết thúc
                </button>
              </div>
            )}
          </div>
          <div className="vt-hero-right">
            <div className="vt-hero-chart-head">
              <b>Tiến độ làm bài{totalQuestions > 0 ? ' (%)' : ' (số câu)'}</b>
              <div className="vt-seg" role="group" aria-label="Kiểu biểu đồ">
                <button type="button" className={chartMode === 'line' ? 'on' : ''} onClick={() => setChartMode('line')} aria-label="Đường"><IcoChart size={14} /></button>
                <button type="button" className={chartMode === 'bar' ? 'on' : ''} onClick={() => setChartMode('bar')} aria-label="Cột"><IcoGrid size={14} /></button>
              </div>
            </div>
            <TrendChart points={progressPoints} mode={chartMode} max={progressMax} unit={totalQuestions > 0 ? '%' : ' câu'} />
            <p className="vt-hero-foot">Mỗi điểm là một học sinh · TB {avgProgress}{totalQuestions > 0 ? '%' : ' câu'}</p>
          </div>
        </div>

        <div className="vt-card vt-ring-card">
          <header><b>Đã nộp bài</b><small>{stats.submitted}/{students.length || 0}</small></header>
          <Donut value={stats.submitted} max={Math.max(students.length, 1)} size={138} stroke={13} tone={isEnded ? 'acc' : timerTone}>
            <strong>{students.length ? Math.round((stats.submitted / students.length) * 100) : 0}<sup>%</sup></strong>
            <small>{stats.online} đang online</small>
          </Donut>
          <footer>
            <span className={stats.violators ? 'danger' : ''}>Có vi phạm</span>
            <b className={stats.violators ? 'danger' : ''}>{stats.violators}</b>
          </footer>
        </div>
      </div>

      {/* VIEW: CAMERA */}
      {view === 'camera' && (
        <div className="vt-cols cams">
          <div className="vt-col">
            <div className="vt-cam-toolbar">
              <div className="vt-cam-title">
                <h2>Camera học sinh</h2>
                <span className="vt-count-text"><b>{visible.length}</b>/{students.length}</span>
              </div>

              <div className="vt-health" aria-label="Sức khỏe camera">
                <span className="ok"><i /> {stats.camOk} tốt</span>
                <span className="warn"><i /> {stats.camBad} mất hình</span>
                <span className="off"><i /> {stats.offline} offline</span>
              </div>

              <div className="vt-toolbar-ctrl">
                <div className="vt-seg" role="group" aria-label="Sắp xếp">
                  {[['risk', 'Rủi ro'], ['name', 'Tên'], ['progress', 'Tiến độ']].map(([k, l]) => (
                    <button key={k} type="button" className={sort === k ? 'on txt' : 'txt'} onClick={() => setSort(k)}>{l}</button>
                  ))}
                </div>
                <div className="vt-seg" role="group" aria-label="Cỡ ô camera">
                  {[['s', 'S'], ['m', 'M'], ['l', 'L']].map(([k, l]) => (
                    <button key={k} type="button" className={size === k ? 'on txt' : 'txt'} onClick={() => setSize(k)} aria-label={`Cỡ ${l}`}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="vt-empty">
                <span><IcoUsers size={30} /></span>
                <h3>{students.length === 0 ? 'Chưa có học sinh nào' : 'Không có học sinh phù hợp'}</h3>
                <p>{students.length === 0 ? 'Camera sẽ hiện khi học sinh vào phòng thi.' : 'Thử đổi bộ lọc hoặc từ khóa.'}</p>
              </div>
            ) : (
              <div className={'vt-cams size-' + size}>
                {visible.map((st) => (
                  <CamCard
                    key={st.id}
                    st={st}
                    now={now}
                    total={totalQuestions}
                    pinned={pinned.has(st.id)}
                    highlight={selectedId === st.id}
                    onOpen={(s) => setSelectedId(s.id)}
                    onPin={togglePin}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="vt-col side">
            <header className="vt-group-head">
              <h2>Cần chú ý</h2>
              <span className="vt-count-text">{attention.length}</span>
            </header>
            {attention.length === 0 ? (
              <div className="vt-calm"><IcoShield size={22} /><p>Mọi thứ đang ổn</p></div>
            ) : (
              <ul className="vt-group">
                {attention.map(({ s, r }) => {
                  const v = latestViolation(s);
                  const m = v ? violationMeta(v.type) : null;
                  return (
                    <li key={s.id}>
                      <button type="button" onClick={() => setSelectedId(s.id)}>
                        <Avatar name={s.studentName} size={44} />
                        <div>
                          <b>{shortName(s.studentName)}</b>
                          <small>{m ? m.label : (!isStudentOnline(s, now) ? 'Mất kết nối' : 'Mất hình')}</small>
                        </div>
                        <i className={'vt-count' + (hardCount(s) ? ' danger' : '')} title={`Điểm rủi ro ${r}`}>{r}</i>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <header className="vt-group-head second">
              <h2>Mới nhất</h2>
              <button type="button" className="vt-link" onClick={() => setView('log')}>Tất cả <IcoChevronRight size={12} /></button>
            </header>
            {logs.length === 0 ? (
              <p className="vt-muted">Chưa có sự kiện nào.</p>
            ) : (
              <ul className="vt-feed">
                {logs.slice(0, 6).map((log) => {
                  const m = violationMeta(log.type);
                  return (
                    <li key={log.id} className={'sev-' + log.severity}>
                      <button type="button" onClick={() => setSelectedId(log.studentId)}>
                        <span className="ico"><m.Icon size={13} /></span>
                        <span className="txt"><b>{shortName(log.studentName)}</b><small>{m.label}</small></span>
                        <time>{fmtClock(log.at)}</time>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      )}

      {/* VIEW: NHẬT KÝ */}
      {view === 'log' && (
        <div className="vt-card">
          <header className="vt-card-head">
            <h3 className="vt-card-title">Nhật ký vi phạm</h3>
            <div className="vt-pills">
              {[['all', 'Tất cả'], ['hard', 'Nặng'], ['soft', 'Nhẹ']].map(([k, l]) => (
                <button key={k} type="button" className={'vt-pill sm' + (logFilter === k ? ' on' : '')} onClick={() => setLogFilter(k)}>{l}</button>
              ))}
              {logs.length > 0 && <button type="button" className="vt-btn sm" onClick={() => setLogs([])}>Xóa nhật ký</button>}
            </div>
          </header>
          {(() => {
            const list = logs.filter((l) => logFilter === 'all' || (logFilter === 'hard' ? l.severity === 'hard' : l.severity !== 'hard'));
            if (list.length === 0) return <div className="vt-calm"><IcoShield size={22} /><p>Chưa có vi phạm nào</p></div>;
            return (
              <ul className="vt-feed full">
                {list.map((log) => {
                  const m = violationMeta(log.type);
                  return (
                    <li key={log.id} className={'sev-' + log.severity}>
                      <button type="button" onClick={() => setSelectedId(log.studentId)}>
                        <Avatar name={log.studentName} size={34} />
                        <span className="txt"><b>{log.studentName}</b><small>{m.label}</small></span>
                        <span className="ico"><m.Icon size={14} /></span>
                        <time>{fmtClock(log.at)}</time>
                      </button>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </div>
      )}

      {/* VIEW: DANH SÁCH */}
      {view === 'list' && (
        <div className="vt-card">
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr><th>Học sinh</th><th>Trạng thái</th><th>Tiến độ</th><th>Vi phạm</th><th>Camera</th><th /></tr>
              </thead>
              <tbody>
                {students
                  .filter((s) => !search.trim() || s.studentName?.toLowerCase().includes(search.trim().toLowerCase()))
                  .sort((a, b) => riskOf(b, now) - riskOf(a, now))
                  .map((s) => {
                    const prog = totalQuestions > 0 ? Math.min(100, Math.round(((s.answered || 0) / totalQuestions) * 100)) : null;
                    const cs = camState(s, now);
                    return (
                      <tr key={s.id}>
                        <td><span className="vt-td-name"><Avatar name={s.studentName} size={32} /><b>{s.studentName}</b></span></td>
                        <td><span className={'vt-chip st-' + s.status}>{{ examining: 'Đang làm', submitted: 'Đã nộp', kicked: 'Bị mời ra', joined: 'Đã vào' }[s.status] || s.status}</span></td>
                        <td>
                          <div className="vt-td-prog">
                            <div className="vt-bar"><i style={{ width: `${prog ?? 0}%` }} /></div>
                            <small>{s.answered || 0}{totalQuestions ? `/${totalQuestions}` : ' câu'}</small>
                          </div>
                        </td>
                        <td><b className={hardCount(s) ? 'danger-text' : ''}>{hardCount(s)}</b><small className="vt-muted"> nặng · {softCount(s)} nhẹ</small></td>
                        <td><span className={'vt-cam-dot ' + cs}>{{ ok: 'Tốt', stale: 'Mất hình', off: 'Offline', none: 'Chưa có', done: '—' }[cs]}</span></td>
                        <td><button type="button" className="vt-btn sm" onClick={() => setSelectedId(s.id)}>Xem</button></td>
                      </tr>
                    );
                  })}
                {students.length === 0 && (
                  <tr><td colSpan={6} className="vt-muted center">Chưa có học sinh nào vào phòng.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: BÁO CÁO */}
      {view === 'report' && (() => {
        const typeCount = {};
        logs.forEach((l) => { typeCount[l.type] = (typeCount[l.type] || 0) + 1; });
        const types = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
        const maxT = Math.max(1, ...types.map((t) => t[1]));
        return (
          <div className="vt-cols">
            <div className="vt-col">
              <div className="vt-card">
                <header className="vt-card-head">
                  <h3 className="vt-card-title">Tổng kết phòng thi</h3>
                  <button type="button" className="vt-btn primary" onClick={exportReport}><IcoDownload size={14} /> Xuất CSV</button>
                </header>
                <div className="vt-stat-tiles">
                  <div><b>{students.length}</b><span>đã vào</span></div>
                  <div><b>{stats.submitted}</b><span>đã nộp</span></div>
                  <div className={stats.violators ? 'danger' : ''}><b>{stats.violators}</b><span>có vi phạm nặng</span></div>
                  <div><b>{logs.length}</b><span>sự kiện</span></div>
                </div>
              </div>

              <div className="vt-card">
                <h3 className="vt-card-title">Loại vi phạm hay gặp</h3>
                {types.length === 0 ? (
                  <div className="vt-calm"><IcoShield size={22} /><p>Chưa có vi phạm nào</p></div>
                ) : (
                  <ul className="vt-hard">
                    {types.map(([t, n]) => {
                      const m = violationMeta(t);
                      return (
                        <li key={t}>
                          <span className="vt-hard-n"><m.Icon size={13} /></span>
                          <p>{m.label}</p>
                          <div className="vt-bar"><i style={{ width: `${(n / maxT) * 100}%` }} className={m.severity === 'hard' ? 'low' : ''} /></div>
                          <b>{n} lần</b>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <aside className="vt-col side">
              <header className="vt-group-head"><h2>Học sinh vi phạm nhiều</h2></header>
              {students.filter((s) => (s.violations || []).length > 0).length === 0 ? (
                <div className="vt-calm"><IcoShield size={22} /><p>Không có ai</p></div>
              ) : (
                <ul className="vt-group">
                  {[...students]
                    .filter((s) => (s.violations || []).length > 0)
                    .sort((a, b) => (b.violations || []).length - (a.violations || []).length)
                    .slice(0, 6)
                    .map((s) => (
                      <li key={s.id}>
                        <button type="button" onClick={() => setSelectedId(s.id)}>
                          <Avatar name={s.studentName} size={44} />
                          <div><b>{shortName(s.studentName)}</b><small>{hardCount(s)} nặng · {softCount(s)} nhẹ</small></div>
                          <i className={'vt-count' + (hardCount(s) ? ' danger' : '')}>{(s.violations || []).length}</i>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </aside>
          </div>
        );
      })()}

      {toast && <div className="vt-toast" role="status">{toast}</div>}

      {/* MODAL CHI TIẾT HS */}
      {selected && (
        <StudentModal
          student={selected}
          total={totalQuestions}
          index={Math.max(0, navIndex)}
          count={navList.length}
          onClose={() => setSelectedId(null)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onKick={handleKick}
          onWarn={handleWarn}
          requestKick={setKickTarget}
        />
      )}

      {/* XÁC NHẬN MỜI RA */}
      {kickTarget && (
        <Modal
          title="Mời ra khỏi phòng thi?"
          size="sm"
          onClose={() => setKickTarget(null)}
          foot={
            <>
              <button type="button" className="vt-btn" onClick={() => setKickTarget(null)}>Hủy</button>
              <button
                type="button"
                className="vt-btn danger"
                onClick={async () => {
                  await handleKick(kickTarget.id, 'Giáo viên yêu cầu');
                  say(`Đã mời ${shortName(kickTarget.studentName)} ra`);
                  setKickTarget(null);
                  setSelectedId(null);
                }}
              >
                <IcoUserKick size={14} /> Mời ra
              </button>
            </>
          }
        >
          <p className="vt-confirm-text"><b>{kickTarget.studentName}</b> sẽ bị đưa ra khỏi phòng thi ngay lập tức.</p>
        </Modal>
      )}

      {/* NHẮC CẢ PHÒNG */}
      {broadcastOpen && (
        <Modal
          title="Nhắc cả phòng"
          size="sm"
          onClose={() => setBroadcastOpen(false)}
          foot={
            <>
              <button type="button" className="vt-btn" onClick={() => setBroadcastOpen(false)}>Hủy</button>
              <button type="button" className="vt-btn primary" onClick={sendBroadcast} disabled={!broadcastText.trim()}>
                <IcoBell size={14} /> Gửi tới {stats.active.length} HS
              </button>
            </>
          }
        >
          <div className="vt-quick-warns">
            {['Còn 5 phút, hãy kiểm tra lại bài.', 'Giữ khuôn mặt trong khung hình.', 'Giữ trật tự và tự làm bài.'].map((w) => (
              <button key={w} type="button" className="vt-pill sm" onClick={() => setBroadcastText(w)}>{w}</button>
            ))}
          </div>
          <label className="vt-field">
            <span>Nội dung</span>
            <input
              autoFocus
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendBroadcast()}
              placeholder="Nhập thông báo gửi cho cả phòng…"
              maxLength={200}
            />
          </label>
        </Modal>
      )}

      {/* KẾT THÚC */}
      {confirmEnd && (
        <Modal
          title="Kết thúc phòng thi?"
          size="sm"
          onClose={() => setConfirmEnd(false)}
          foot={
            <>
              <button type="button" className="vt-btn" onClick={() => setConfirmEnd(false)}>Ở lại</button>
              <button type="button" className="vt-btn danger" onClick={handleEnd}><IcoStop size={14} /> Kết thúc</button>
            </>
          }
        >
          <p className="vt-confirm-text">Tất cả học sinh đang làm bài sẽ được yêu cầu nộp bài ngay. Hành động này không thể hoàn tác.</p>
        </Modal>
      )}
    </DashFrame>
  );
}