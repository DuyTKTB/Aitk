/* ============================================================
   LiveProctorView.jsx — Giám sát trực tiếp (Vitality) v2
   ------------------------------------------------------------
   Sidebar: Camera | Nhật ký | Danh sách | Báo cáo
   Quản lý camera:
     • Lọc: Tất cả / Online / Vi phạm / Mất hình / Đã nộp
     • Sắp xếp: rủi ro / tên / tiến độ + Ghim HS
     • Cỡ ô camera S / M / L
     • Thanh sức khỏe camera
     • "Cần chú ý": xếp hạng HS theo điểm rủi ro
     • Âm báo khi có vi phạm nặng mới
     • Nhắc cả phòng, lời nhắc nhanh, chuyển HS trước/sau (← →)
     • Báo cáo CSV: danh sách + chi tiết vi phạm
   ------------------------------------------------------------
   THAY ĐỔI v2:
     • StudentModal dùng setStudentPaused (field boolean) thay
       vì gửi tin nhắn regex "TẠM DỪNG".
     • Nút đổi thành toggle "Tạm dừng HS này" / "Cho làm tiếp".
   ============================================================ */
import { ElecFlaskBrandSvg, ElecMascot } from './teacher/ElecBrandMark.jsx';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  listenSession,
  listenSessionStudents,
  endExamSession,
  extendExamSession,
  kickStudent,
  warnStudent,
  setStudentPaused,
  setStudentForceSubmit,
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
  fmtMMSS, fmtClock,
} from './DashShell.jsx';
import { exportStyledWorkbook } from '../lib/excelExport.js';

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

const SEVERE_WARN = '[CẢNH BÁO NGHIÊM TRỌNG] Bạn đã vi phạm quy chế thi. Vi phạm thêm sẽ bị đình chỉ thi.';

function hardCount(st) {
  return (st.violations || []).filter((v) => v.severity === 'hard').length;
}
function softCount(st) {
  return (st.violations || []).filter((v) => v.severity !== 'hard').length;
}
function riskOf(st, now, { cameraEnabled = false, isEnded = false } = {}) {
  const baseViol = hardCount(st) * 3 + softCount(st);
  if (isEnded) return baseViol;
  if (st.status === 'submitted' || st.status === 'kicked') return 0;
  const online = isStudentOnline(st, now);
  const stale = cameraEnabled && secondsSinceUpdate(st, now) > STALE_SEC;
  return baseViol + (!online ? 2 : 0) + (online && stale ? 1 : 0);
}

function aiSeverityOf(st) {
  const hard = hardCount(st);
  const total = (st.violations || []).length;
  if (hard >= 1 || total >= 3) return { level: 'high', label: 'Nghiêm trọng', color: '#ef4444' };
  if (total >= 1) return { level: 'med', label: 'Trung bình', color: '#f59e0b' };
  return { level: 'low', label: 'An toàn / Nhẹ', color: '#10b981' };
}
function camState(st, now, cameraEnabled = false) {
  if (st.status === 'submitted' || st.status === 'kicked') return 'done';
  if (!isStudentOnline(st, now)) return 'off';
  if (!cameraEnabled) return 'disabled';
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
function CamCard({ st, now, total, pinned, highlight, cameraEnabled = true, isEnded = false, onOpen, onPin }) {
  const online = !isEnded && isStudentOnline(st, now);
  const viol = latestViolation(st);
  const hard = viol?.severity === 'hard';
  const meta = viol ? violationMeta(viol.type) : null;
  const StatusIcon = statusIcon(st.status);
  const state = camState(st, now, cameraEnabled);
  const since = secondsSinceUpdate(st, now);
  const burstFresh = Array.isArray(st.burst?.frames) && st.burst.frames.length > 0 && now - (st.burst.at || 0) < 30000;
  const progress = total > 0 ? Math.min(100, Math.round(((st.answered || 0) / total) * 100)) : null;

  // Khi phòng thi KHÔNG bật camera → hiển thị thẻ thí sinh gọn sạch thay cho hộp camera gạch chéo vô lý
  if (!cameraEnabled) {
    const statusLabel = st.status === 'submitted'
      ? 'Đã nộp bài'
      : st.status === 'kicked'
        ? 'Đã mời ra'
        : st.paused
          ? 'Đang tạm dừng'
          : isEnded
            ? 'Kết thúc chưa nộp'
            : online
              ? 'Đang làm bài'
              : 'Mất kết nối';
    const violCount = (st.violations || []).length;
    return (
      <button
        type="button"
        className={`lp-student-card${hard && st.status !== 'submitted' ? ' is-alert' : ''}${st.status === 'submitted' ? ' is-done' : ''}${highlight ? ' hl' : ''}`}
        onClick={() => onOpen(st)}
      >
        <div className="lp-sc-top">
          <Avatar name={st.studentName} size={38} />
          <div className="lp-sc-info">
            <b title={st.studentName}>{st.studentName}</b>
            <small>{statusLabel}</small>
          </div>
          {violCount > 0 && (
            <span className="lp-sc-viol" title={meta?.label || 'Vi phạm'}>
              {violCount} vi phạm
            </span>
          )}
        </div>
        <div className="lp-kpi-bar">
          <i style={{ width: `${progress ?? 0}%`, background: st.status === 'submitted' ? '#10b981' : '#2563eb' }} />
        </div>
        <div className="lp-sc-badges">
          <span>Tiến độ: {st.answered || 0}{total > 0 ? `/${total} câu` : ' câu'}</span>
          <span>{progress !== null ? `${progress}%` : '—'}</span>
        </div>
      </button>
    );
  }

  const cls = [
    'vt-cam',
    hard && st.status !== 'submitted' ? 'alert' : '',
    st.status === 'submitted' ? 'done' : '',
    st.status === 'kicked' ? 'kicked' : '',
    !online && st.status !== 'submitted' ? 'offline' : '',
    highlight ? 'hl' : '',
    pinned ? 'pinned' : '',
    st.paused ? 'paused' : '',
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

          {st.paused && st.status !== 'submitted' && (
            <span className="vt-cam-viol" style={{ background: '#f59e0b' }}>
              <IcoClock size={12} /> Tạm dừng
            </span>
          )}

          {hard && meta && st.status !== 'submitted' && !st.paused && (
            <span className="vt-cam-viol" title={meta.label}><meta.Icon size={12} /> {hardCount(st)}</span>
          )}
          {st.status !== 'submitted' && st.status !== 'kicked' && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                left: 60,
                padding: '2px 7px',
                borderRadius: 999,
                fontSize: '0.66rem',
                fontWeight: 800,
                background: aiSeverityOf(st).color,
                color: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                zIndex: 2,
              }}
              title={`Đánh giá AI: Mức độ ${aiSeverityOf(st).label}`}
            >
              AI: {aiSeverityOf(st).label}
            </span>
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
function StudentModal({ student, total, cameraEnabled = false, isEnded = false, onClose, onKick, onWarn, onTogglePause, onPrev, onNext, index, count, requestKick, requestForceSubmit, actioning }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const online = isStudentOnline(student);
  const violations = student.violations || [];
  const progress = total > 0 ? Math.min(100, Math.round(((student.answered || 0) / total) * 100)) : null;
  const paused = !!student.paused;
  const quickWarns = cameraEnabled
    ? QUICK_WARNS
    : QUICK_WARNS.filter((w) => !w.includes('khuôn mặt'));
  const showCamShot = cameraEnabled || Boolean(student.thumbnail);

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
    student.status === 'examining' ? (paused ? 'Đang tạm dừng' : 'Đang làm bài')
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
            <small>
              <IcoDot size={7} />{' '}
              {isEnded ? statusText : `${online ? 'Online' : 'Mất kết nối'} · ${statusText}`}
            </small>
          </span>
        </span>
      }
    >
      <div className="vt-sm">
        <div className="vt-sm-left">
          {showCamShot ? (
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
          ) : (
            <div className="lp-sm-nocam">
              <div className="lp-sm-nocam-body">
                <span className="lp-sm-nocam-ico"><IcoShield size={24} /></span>
                <b>Phòng thi không bật camera</b>
                <p>Hệ thống chỉ giám sát hành vi chuyển tab, thoát toàn màn hình và tiến độ làm bài.</p>
              </div>
              <div className="lp-sm-nocam-nav">
                <button type="button" className="vt-icon-btn" onClick={onPrev} aria-label="Học sinh trước"><IcoArrowLeft size={16} /></button>
                <span>Thí sinh {index + 1}/{count}</span>
                <button type="button" className="vt-icon-btn" onClick={onNext} aria-label="Học sinh sau"><IcoChevronRight size={16} /></button>
              </div>
            </div>
          )}

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

          {/* Đánh giá AI Giám thị & Độ trung thực */}
          <div style={{
            background: aiSeverityOf(student).level === 'high' ? '#fef2f2' : aiSeverityOf(student).level === 'med' ? '#fffbeb' : '#f0fdf4',
            border: `1px solid ${aiSeverityOf(student).level === 'high' ? '#fecaca' : aiSeverityOf(student).level === 'med' ? '#fde68a' : '#bbf7d0'}`,
            borderRadius: 14,
            padding: '10px 14px',
            marginBottom: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: aiSeverityOf(student).color }}>
                  Đánh giá AI Giám thị: Mức độ {aiSeverityOf(student).label}
                </span>
                <span style={{ fontSize: '0.74rem', background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: 99, fontWeight: 700, color: '#0f172a' }}>
                  Độ tin cậy bài làm: {Math.max(10, 100 - hardCount(student) * 25 - softCount(student) * 10)}%
                </span>
              </div>
              <small style={{ color: '#475569', fontSize: '0.75rem', marginTop: 3, display: 'block' }}>
                {hardCount(student) >= 1
                  ? 'Khuyến nghị: Phát hiện vi phạm nặng hoặc nhiều lần. Giáo viên nên rà soát lại bài làm.'
                  : softCount(student) >= 1
                  ? 'Khuyến nghị: Thí sinh có 1-2 lần rời màn hình nhẹ.'
                  : 'Khuyến nghị: Thí sinh làm bài nghiêm túc, không phát hiện dấu hiệu gian lận.'}
              </small>
            </div>
            {!isEnded && online && (
              <button
                type="button"
                className="vt-btn sm"
                onClick={() => send(`[Giám thị AI] Thí sinh ${student.studentName} vui lòng giữ nghiêm túc và tập trung làm bài thi.`)}
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
              >
                AI Nhắc nhở ngay
              </button>
            )}
          </div>

          <section className="vt-sm-viol">
            <h4><IcoAlert size={14} /> Lịch sử vi phạm</h4>
            {previewImg && (
              <div style={{ marginBottom: '.65rem', padding: '.5rem', borderRadius: 10, background: 'rgba(15,23,42,.06)', border: '1px solid rgba(15,23,42,.12)', textAlign: 'center' }}>
                <img src={previewImg} alt="Bằng chứng vi phạm" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, display: 'block', margin: '0 auto .4rem' }} />
                <button type="button" className="vt-btn sm" onClick={() => setPreviewImg(null)}>Đóng ảnh</button>
              </div>
            )}
            {violations.length === 0 ? (
              <p className="vt-muted"><IcoShield size={14} /> Chưa có vi phạm nào.</p>
            ) : (
              <ul>
                {[...violations].reverse().map((v, i) => {
                  const m = violationMeta(v.type);
                  const imgSrc = v.snapshotUrl || v.meta?.inlineThumb || null;
                  return (
                    <li key={i} className={'sev-' + v.severity}>
                      <span className="t">{fmtClock(v.at)}</span>
                      <span className="i"><m.Icon size={13} /></span>
                      <span className="l">{m.label}</span>
                      {imgSrc && (
                        <button type="button" className="vt-pill sm" style={{ padding: '1px 7px', fontSize: '.7rem' }} onClick={() => setPreviewImg(imgSrc)}>Xem ảnh</button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {!isEnded ? (
            <>
              <section className="vt-sm-warn">
                <h4><IcoBell size={14} /> Nhắc học sinh</h4>
                <div className="vt-quick-warns">
                  {quickWarns.map((w) => (
                    <button
                      key={w}
                      type="button"
                      className="vt-pill sm"
                      onClick={() => send(w)}
                      disabled={!online || actioning}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '.7rem' }}>
                  <button
                    type="button"
                    className="vt-btn danger block"
                    onClick={() => send(SEVERE_WARN)}
                    disabled={!online || actioning}
                  >
                    <IcoAlert size={14} /> Cảnh báo nghiêm trọng
                  </button>
                </div>

                {/* Nút toggle Tạm dừng / Cho làm tiếp */}
                <div style={{ marginTop: '.5rem' }}>
                  <button
                    type="button"
                    className="vt-btn block"
                    onClick={() => onTogglePause(student.id, !paused)}
                    disabled={!online || actioning || student.status === 'submitted' || student.status === 'kicked'}
                    style={{
                      background: paused ? '#16a34a' : '#f59e0b',
                      color: '#fff',
                      borderColor: paused ? '#16a34a' : '#f59e0b',
                    }}
                  >
                    {paused ? (
                      <><IcoVideo size={14} /> Cho làm tiếp</>
                    ) : (
                      <><IcoClock size={14} /> Tạm dừng học sinh này</>
                    )}
                  </button>
                </div>

                {paused && (
                  <p className="vt-muted" style={{ margin: '.5rem 0 0', fontSize: '.78rem' }}>
                    Học sinh đang thấy màn hình "Bài làm đã tạm dừng". Đồng hồ đã dừng.
                  </p>
                )}

                <div className="vt-warn-row" style={{ marginTop: '.7rem' }}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder="Nhập lời nhắc riêng…"
                    maxLength={200}
                    aria-label="Lời nhắc"
                    disabled={actioning}
                  />
                  <button
                    type="button"
                    className="vt-btn primary"
                    onClick={() => send()}
                    disabled={!text.trim() || actioning}
                  >
                    {sent ? <><IcoCheckCircle size={14} /> Đã gửi</> : 'Gửi'}
                  </button>
                </div>
              </section>

              <div style={{ display: 'grid', gap: '.45rem' }}>
                <button
                  type="button"
                  className="vt-btn block"
                  onClick={() => requestForceSubmit(student)}
                  disabled={actioning || student.status === 'submitted' || student.status === 'kicked'}
                  style={{ background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }}
                >
                  <IcoStop size={14} /> Thu bài ngay (cưỡng chế)
                </button>
                <button
                  type="button"
                  className="vt-btn danger block"
                  onClick={() => requestKick(student)}
                  disabled={actioning || student.status === 'submitted' || student.status === 'kicked'}
                >
                  <IcoUserKick size={14} /> Mời ra khỏi phòng
                </button>
              </div>
            </>
          ) : (
            <p className="vt-muted" style={{ margin: '0.4rem 0 0', fontSize: '0.8rem' }}>
              Phiên thi đã kết thúc — đang ở chế độ xem lại hồ sơ thi của thí sinh.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function LiveProctorView({ sessionId, onBack, className: classNameProp, totalQuestions = 0, cameraMode = 'off' }) {
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
  const [showChart, setShowChart] = useState(false);
  const [logFilter, setLogFilter] = useState('all');

  /* AI Giám thị thông minh & Tự động nhắc nhở */
  const [aiAutoWarn, setAiAutoWarn] = useState(true);
  const [aiDiagOpen, setAiDiagOpen] = useState(false);
  const [aiProctorFeed, setAiProctorFeed] = useState([]);
  const lastWarnTimeMap = useRef({});

  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [forceTarget, setForceTarget] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [projectorOpen, setProjectorOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [toast, setToast] = useState(null);
  const [actioning, setActioning] = useState(false);

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
    return () => {
      clearInterval(t);
      clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    seenViolRef.current = new Map();
    loadedRef.current = false;
    setLogs([]);
    setAiProctorFeed([]);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    return listenSession(sessionId, (s) => setSession(s));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    return listenSessionStudents(sessionId, (list) => setStudents(list));
  }, [sessionId]);

  const remaining = session ? timeRemaining(session, now) : 0;
  const isEnded = session?.status === 'ended';
  const cameraEnabled = (cameraMode && cameraMode !== 'off') || students.some((s) => Boolean(s.thumbnail));
  const cameraModeLabel = cameraMode === 'required'
    ? 'Camera bắt buộc'
    : cameraMode === 'optional'
      ? 'Camera tùy chọn'
      : cameraEnabled
        ? 'Đang nhận camera'
        : 'Không bật camera · Chống chuyển tab';

  useEffect(() => {
    const fresh = [];
    const nowMs = Date.now();
    for (const st of students) {
      const vs = st.violations || [];
      const seen = seenViolRef.current.get(st.id) || 0;
      if (vs.length > seen) {
        for (let i = seen; i < vs.length; i++) {
          const viol = vs[i];
          const rawSeverity = viol.severity === 'hard' ? 'hard' : 'soft';
          const aiSeverity = (rawSeverity === 'hard' || vs.length >= 3)
            ? 'high'
            : (viol.type === 'window_blur' || viol.type === 'tab_hidden')
              ? 'med'
              : 'low';

          fresh.push({
            ...viol,
            id: `${st.id}-${i}`,
            studentId: st.id,
            studentName: st.studentName,
            severity: rawSeverity,
            aiSeverity,
          });

          // AI Tự động gửi nhắc nhở khi phát hiện vi phạm MỚI theo thời gian thực (chỉ khi phòng còn đang LIVE)
          if (!isEnded && loadedRef.current && aiAutoWarn && st.status === 'examining') {
            const lastWarn = lastWarnTimeMap.current[st.id] || 0;
            if (nowMs - lastWarn > 15000) {
              lastWarnTimeMap.current[st.id] = nowMs;
              let msg = '';
              if (aiSeverity === 'high') {
                msg = `[CẢNH BÁO GIÁM THỊ AI] Thí sinh ${st.studentName} đã vi phạm quy chế nghiêm trọng (lần thứ ${vs.length}). Giáo viên đang theo dõi trực tiếp bài làm của em!`;
              } else if (aiSeverity === 'med') {
                msg = `[Giám thị AI] Thí sinh ${st.studentName} vừa chuyển tab làm bài (lần thứ ${vs.length}). Hệ thống đã lưu vết, vui lòng tập trung làm bài!`;
              } else {
                msg = cameraEnabled
                  ? `[Giám thị AI] Thí sinh ${st.studentName} chú ý giữ khuôn mặt trong góc camera và không rời màn hình thi.`
                  : `[Giám thị AI] Thí sinh ${st.studentName} chú ý giữ nguyên màn hình làm bài và không chuyển cửa sổ khác.`;
              }

              warnStudent({ sessionId, studentId: st.id, message: msg }).catch(() => {});

              setAiProctorFeed((prev) => [
                {
                  id: `ai-${nowMs}-${st.id}`,
                  time: fmtClock(nowMs),
                  studentName: st.studentName,
                  severity: aiSeverity,
                  messageSent: msg,
                },
                ...prev.slice(0, 30),
              ]);
            }
          }
        }
        seenViolRef.current.set(st.id, vs.length);
      }
    }
    if (fresh.length > 0) {
      setLogs((prev) => [...fresh, ...prev].sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 200));
      if (!isEnded && loadedRef.current && fresh.some((f) => f.severity === 'hard' || f.aiSeverity === 'high')) beep();
    }
    if (students.length > 0) loadedRef.current = true;
  }, [students, aiAutoWarn, isEnded, cameraEnabled, sessionId, beep]);

  const stats = useMemo(() => {
    const online = isEnded
      ? 0
      : students.filter((s) => isStudentOnline(s, now) && s.status !== 'submitted' && s.status !== 'kicked').length;
    const submitted = students.filter((s) => s.status === 'submitted').length;
    const violators = students.filter((s) => hardCount(s) > 0).length;
    const camBad = (!isEnded && cameraEnabled)
      ? students.filter((s) => ['stale', 'none'].includes(camState(s, now, true))).length
      : 0;
    const offline = isEnded
      ? 0
      : students.filter((s) => camState(s, now, cameraEnabled) === 'off').length;
    const camOk = (!isEnded && cameraEnabled)
      ? students.filter((s) => camState(s, now, true) === 'ok').length
      : 0;
    const paused = students.filter((s) => s.paused).length;
    const active = students.filter((s) => s.status !== 'submitted' && s.status !== 'kicked');
    return { online, submitted, violators, camBad, offline, camOk, active, paused };
  }, [students, now, isEnded, cameraEnabled]);

  const filterDefs = [
    { key: 'all', label: 'Tất cả', test: () => true },
    ...(!isEnded ? [{ key: 'online', label: 'Online', test: (s) => isStudentOnline(s, now) && s.status !== 'submitted' && s.status !== 'kicked' }] : []),
    { key: 'viol', label: 'Vi phạm', test: (s) => hardCount(s) > 0 },
    ...(!isEnded && cameraEnabled ? [{ key: 'cam', label: 'Mất hình', test: (s) => ['stale', 'none', 'off'].includes(camState(s, now, true)) && s.status !== 'submitted' && s.status !== 'kicked' }] : []),
    ...(stats.paused > 0 ? [{ key: 'paused', label: 'Tạm dừng', test: (s) => !!s.paused }] : []),
    { key: 'done', label: 'Đã nộp', test: (s) => s.status === 'submitted' },
  ];
  const filterTabs = filterDefs.map((f) => ({ key: f.key, label: f.label, count: students.filter(f.test).length }));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const def = filterDefs.find((f) => f.key === filter) || filterDefs[0];
    const list = students.filter((s) => def.test(s) && (!q || s.studentName?.toLowerCase().includes(q)));
    const cmp = {
      risk: (a, b) => riskOf(b, now, { cameraEnabled, isEnded }) - riskOf(a, now, { cameraEnabled, isEnded }),
      name: (a, b) => shortName(a.studentName).localeCompare(shortName(b.studentName), 'vi'),
      progress: (a, b) => (a.answered || 0) - (b.answered || 0),
    }[sort];
    return [...list].sort((a, b) => {
      const pa = pinned.has(a.id) ? 1 : 0;
      const pb = pinned.has(b.id) ? 1 : 0;
      return pb - pa || cmp(a, b);
    });
  }, [students, filter, search, sort, pinned, now, cameraEnabled, isEnded]); // eslint-disable-line

  const attention = useMemo(
    () => students
      .map((s) => ({ s, r: riskOf(s, now, { cameraEnabled, isEnded }) }))
      .filter((x) => x.r > 0)
      .sort((a, b) => b.r - a.r)
      .slice(0, 5),
    [students, now, cameraEnabled, isEnded]
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

  const handleExtendTime = async (mins = 5) => {
    if (extending || isEnded) return;
    setExtending(true);
    try {
      await extendExamSession(sessionId, mins);
      say(`Đã cộng thêm ${mins} phút cho cả phòng thi`);
    } catch (e) {
      say('Không cộng thêm giờ được: ' + (e.message || e));
    } finally {
      setExtending(false);
    }
  };

  const handleKick = useCallback(async (studentId, reason) => {
    await kickStudent({ sessionId, studentId, reason });
  }, [sessionId]);

  const handleWarn = useCallback(async (studentId, message) => {
    await warnStudent({ sessionId, studentId, message });
  }, [sessionId]);

  const handleTogglePause = useCallback(async (studentId, paused) => {
    setActioning(true);
    try {
      await setStudentPaused({ sessionId, studentId, paused });
      const st = students.find((x) => x.id === studentId);
      say(paused ? `Đã tạm dừng ${shortName(st?.studentName)}` : `Đã cho ${shortName(st?.studentName)} làm tiếp`);
    } catch (e) {
      say('Không đổi được trạng thái: ' + e.message);
    } finally {
      setActioning(false);
    }
  }, [sessionId, students, say]);

  const handleForceSubmit = useCallback(async (studentId) => {
    setActioning(true);
    try {
      await setStudentForceSubmit({ sessionId, studentId });
      const st = students.find((x) => x.id === studentId);
      say(`Đã gửi lệnh thu bài ngay cho ${shortName(st?.studentName)}`);
    } catch (e) {
      say('Không thu được bài: ' + e.message);
    } finally {
      setActioning(false);
    }
  }, [sessionId, students, say]);

  const sendBroadcast = async () => {
    const m = broadcastText.trim();
    if (!m) return;
    const targets = stats.active;
    if (!targets.length) {
      say('Hiện chưa có thí sinh nào đang làm bài để gửi thông báo.');
      setBroadcastOpen(false);
      return;
    }
    setActioning(true);
    try {
      const results = await Promise.allSettled(
        targets.map((s) => warnStudent({ sessionId, studentId: s.id, message: m }))
      );
      const okCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - okCount;
      setBroadcastOpen(false);
      setBroadcastText('');
      if (failCount > 0) {
        say(`Đã gửi nhắc tới ${okCount}/${results.length} thí sinh (${failCount} gửi thất bại).`);
      } else {
        say(`Đã nhắc ${okCount} học sinh`);
      }
    } catch (e) {
      say('Không gửi được thông báo phòng thi: ' + (e?.message || e));
    } finally {
      setActioning(false);
    }
  };

  /* Điểm minh bạch toàn phòng & chẩn đoán AI thời gian thực */
  const roomDiagnostics = useMemo(() => {
    const flagged = students.filter((s) => {
      if (isEnded) return (s.violations || []).length > 0;
      if (s.status !== 'examining') return false;
      const vs = s.violations || [];
      const cs = camState(s, now, cameraEnabled);
      const camOrNetIssue = cameraEnabled ? ['stale', 'none', 'off'].includes(cs) : cs === 'off';
      return vs.length > 0 || camOrNetIssue;
    });
    const hardViolators = flagged.filter((s) =>
      (s.violations || []).some((v) => v.severity === 'hard') || (s.violations || []).length >= 3
    );
    const stalled = isEnded
      ? []
      : students.filter((s) => s.status === 'examining' && !s.paused && Number(s.answered || 0) === 0);
    const total = Math.max(1, students.length);
    const penalty = hardViolators.length * 14 + Math.max(0, flagged.length - hardViolators.length) * 6 + stats.offline * 3;
    const integrityPct = students.length === 0 ? 100 : Math.max(20, Math.min(100, Math.round(100 - (penalty / total) * 2)));
    return { flagged, hardViolators, stalled, integrityPct };
  }, [students, stats.offline, now, isEnded, cameraEnabled]);

  const handleWarnFlaggedGroup = async () => {
    const targets = roomDiagnostics.flagged;
    if (!targets.length) {
      say('Phòng thi hiện tại chưa ghi nhận nhóm cần nhắc nhở.');
      return;
    }
    setActioning(true);
    try {
      await Promise.all(
        targets.map((st) =>
          warnStudent({
            sessionId,
            studentId: st.id,
            message: cameraEnabled
              ? `[ELEC AI Giám thị] Em ${st.studentName} vui lòng giữ camera rõ mặt và không rời khỏi màn hình làm bài thi!`
              : `[ELEC AI Giám thị] Em ${st.studentName} vui lòng giữ nguyên màn hình làm bài và không chuyển tab!`,
          })
        )
      );
      say(`Đã gửi nhắc nhở đồng loạt tới ${targets.length} thí sinh cần chú ý`);
    } catch (e) {
      say(e?.message || 'Không gửi được nhắc nhở nhóm');
    } finally {
      setActioning(false);
    }
  };

  const exportReport = async () => {
    if (!session || students.length === 0) { say('Chưa có học sinh để xuất'); return; }
    try {
      const safe = (session.title || 'phong-thi').replace(/[^\p{L}\p{N}]+/gu, '-');
      const startStr = session.startedAtMs ? new Date(session.startedAtMs).toLocaleString('vi-VN') : '—';
      const endStr = isEnded ? new Date(session.endedAtMs || Date.now()).toLocaleString('vi-VN') : 'Đang diễn ra';
      const typeCount = {};
      logs.forEach((l) => { typeCount[l.type] = (typeCount[l.type] || 0) + 1; });
      const violationTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);

      await exportStyledWorkbook({
        filename: `bao-cao-giam-thi-${safe}.xlsx`,
        mascot: 'cool',
        sheets: [
          {
            name: 'Nhật ký Giám sát',
            mascot: 'cool',
            title: `BIÊN BẢN GIÁM SÁT PHÒNG THI — ${(session.title || '').toUpperCase()}`,
            subtitle: `Lớp ${classNameProp || session.classId} · GV coi thi: ${session.teacherName || 'Giáo viên'}`,
            meta: [
              { label: 'Bắt đầu', value: startStr },
              { label: 'Kết thúc', value: endStr },
              { label: 'Thí sinh', value: `${students.length} em` },
              { label: 'Vi phạm ghi nhận', value: `${logs.length} sự kiện` },
            ],
            columns: [
              { header: 'STT', key: 'stt', align: 'center', width: 8 },
              { header: 'Họ và tên thí sinh', key: 'name', align: 'left', width: 26 },
              { header: 'Trạng thái', key: 'status', align: 'center', isScoreBand: true, width: 15 },
              { header: 'Đã trả lời', key: 'answered', align: 'center', width: 12 },
              { header: 'Tạm dừng', key: 'paused', align: 'center', width: 12 },
              { header: 'Vi phạm nặng', key: 'hard', align: 'center', width: 14 },
              { header: 'Vi phạm nhẹ', key: 'soft', align: 'center', width: 14 },
              { header: 'Mức liêm chính', key: 'integrity', align: 'center', isScoreBand: true, width: 18 },
              { header: 'Vào phòng', key: 'joined', align: 'center', width: 13 },
              { header: 'Chi tiết vi phạm', key: 'detail', align: 'left', width: 38, wrapText: true },
            ],
            rows: students.map((st, idx) => {
              const hard = hardCount(st);
              const soft = softCount(st);
              const detail = (st.violations || [])
                .map((v) => `${fmtClock(v.at)} ${violationMeta(v.type).label}`)
                .join(' | ');
              const integrity = hard > 0 ? 'Cảnh báo nặng' : (soft > 0 ? 'Cần chú ý' : 'Liêm chính cao');
              return {
                stt: idx + 1,
                name: st.studentName,
                status: st.status,
                answered: st.answered || 0,
                paused: st.paused ? 'Có' : 'Không',
                hard,
                soft,
                integrity,
                joined: fmtClock(st.joinedAtMs),
                detail: detail || 'Không có vi phạm',
              };
            }),
            summaryRow: {
              labelCol: 1,
              label: `TỔNG KẾT PHÒNG THI (${students.length} thí sinh)`,
              cells: {
                hard: ({ dataStartRow, dataEndRow }) => ({ formula: `SUM(F${dataStartRow}:F${dataEndRow})` }),
                soft: ({ dataStartRow, dataEndRow }) => ({ formula: `SUM(G${dataStartRow}:G${dataEndRow})` }),
              },
            },
          },
          ...(violationTypes.length > 0 ? [{
            name: 'Phân loại Vi phạm',
            mascot: 'think',
            title: `THỐNG KÊ LOẠI VI PHẠM — ${(session.title || '').toUpperCase()}`,
            subtitle: `Tổng hợp ${logs.length} cảnh báo bất thường trong phiên thi`,
            columns: [
              { header: 'STT', key: 'stt', align: 'center', width: 8 },
              { header: 'Loại vi phạm', key: 'label', align: 'left', width: 32 },
              { header: 'Mức độ', key: 'severity', align: 'center', isScoreBand: true, width: 16 },
              { header: 'Số lần ghi nhận', key: 'count', align: 'center', width: 16 },
            ],
            rows: violationTypes.map(([t, n], idx) => {
              const m = violationMeta(t);
              return {
                stt: idx + 1,
                label: m.label,
                severity: m.severity === 'hard' ? 'Vi phạm nặng' : 'Vi phạm nhẹ',
                count: n,
              };
            }),
          }] : []),
        ],
      });
      say('Đã xuất biên bản giám thị Excel (.xlsx)');
    } catch (e) {
      say(e?.message || 'Không xuất được file Excel');
    }
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
    { key: 'camera', label: cameraEnabled ? 'Camera' : 'Phòng thi', Icon: cameraEnabled ? IcoVideo : IcoUsers },
    { key: 'log', label: 'Nhật ký', Icon: IcoAlert, badge: logs.filter((l) => l.severity === 'hard').length || null },
    { key: 'list', label: 'Danh sách', Icon: IcoUsers },
    { key: 'report', label: 'Báo cáo', Icon: IcoChart },
  ];

  const timerTone = remaining < 60 ? 'danger' : remaining < 300 ? 'warn' : 'acc';
  const submittedPct = students.length ? Math.round((stats.submitted / students.length) * 100) : 0;

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
        title={isEnded ? 'Báo cáo phiên thi' : 'Giám sát trực tiếp'}
        subtitle={`${session.title} · Lớp ${classNameProp || session.classId}`}
        tabs={topTabs}
        active={filter}
        onTab={setFilter}
        search={search}
        onSearch={view === 'camera' || view === 'list' ? setSearch : undefined}
        placeholder="Tìm học sinh…"
        bell={!isEnded ? {
          on: sound,
          pressed: sound,
          onClick: () => setSound((v) => !v),
          title: sound ? 'Âm báo vi phạm: đang bật' : 'Âm báo vi phạm: đang tắt',
        } : undefined}
      />

      {/* THANH ĐIỀU HÀNH GỌN 1 HÀNG — THÍCH NGHI THEO LIVE / ĐÃ KẾT THÚC & CHẾ ĐỘ CAMERA */}
      <section className="lp-command-bar" aria-label="Điều hành phòng thi">
        <div className="lp-cmd-left">
          <span className={`lp-status-pill ${isEnded ? 'is-ended' : 'is-live'}`}>
            <IcoDot size={7} /> {isEnded ? 'Đã kết thúc' : 'Đang thi LIVE'}
          </span>

          {!isEnded ? (
            <span className={`lp-timer-chip ${timerTone === 'danger' ? 'is-danger' : timerTone === 'warn' ? 'is-warn' : ''}`}>
              <IcoClock size={14} /> {fmtMMSS(remaining)}
            </span>
          ) : (
            <span className="lp-mode-chip">
              <IcoClock size={13} /> Mở lúc {fmtClock(session.startedAtMs)} · {session.duration || 0} phút
            </span>
          )}

          <span className={`lp-mode-chip ${cameraEnabled ? 'is-cam-on' : ''}`}>
            {cameraEnabled ? <IcoVideo size={13} /> : <IcoShield size={13} />}
            {cameraModeLabel}
          </span>
        </div>

        <div className="lp-cmd-right">
          {!isEnded ? (
            <>
              <button type="button" className="vt-btn sm primary" onClick={() => setBroadcastOpen(true)}>
                <IcoBell size={13} /> Nhắc cả phòng
              </button>
              <button
                type="button"
                className="vt-btn sm"
                onClick={() => handleExtendTime(5)}
                disabled={extending}
                title="Cộng thêm 5 phút làm bài cho toàn bộ học sinh trong phòng"
              >
                +5p
              </button>
              <button
                type="button"
                className="vt-btn sm"
                onClick={() => handleExtendTime(10)}
                disabled={extending}
                title="Cộng thêm 10 phút làm bài cho toàn bộ học sinh trong phòng"
              >
                +10p
              </button>
              <button
                type="button"
                className="vt-btn sm"
                onClick={() => setProjectorOpen(true)}
                title="Mở màn hình đồng hồ lớn & mã QR chiếu lên bảng/TV lớp học"
              >
                Chiếu TV
              </button>
              <label className="lp-auto-toggle" title="Tự động gửi cảnh báo nhẹ cho học sinh khi phát hiện vi phạm mới">
                <input
                  type="checkbox"
                  checked={aiAutoWarn}
                  onChange={(e) => setAiAutoWarn(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: '#2563eb' }}
                />
                <span>AI tự nhắc</span>
              </label>
              <button type="button" className="vt-btn sm danger" onClick={() => setConfirmEnd(true)}>
                <IcoStop size={13} /> Kết thúc
              </button>
            </>
          ) : (
            <button
              type="button"
              className="vt-btn sm primary"
              onClick={exportReport}
              disabled={students.length === 0}
            >
              <IcoDownload size={13} /> Xuất Excel biên bản
            </button>
          )}

          <button
            type="button"
            className={`vt-btn sm ${aiDiagOpen ? 'primary' : ''}`}
            onClick={() => setAiDiagOpen((v) => !v)}
          >
            <ElecFlaskBrandSvg size={13} variant={aiDiagOpen ? 'current' : 'gradient'} />
            <span>{aiDiagOpen ? 'Ẩn rà soát' : 'Rà soát AI'}</span>
          </button>
        </div>
      </section>

      {/* 4 THẺ KPI TỔNG QUAN SẮC NÉT — KHÔNG CHÓI MẮT, ĐỘ TƯƠNG PHẢN CAO */}
      <section className="lp-kpi-row" aria-label="Chỉ số phòng thi">
        <div className="lp-kpi-card">
          <div className="lp-kpi-head">
            <span>Thí sinh đã vào</span>
          </div>
          <div className="lp-kpi-val">{students.length}</div>
          <div className="lp-kpi-sub">
            {isEnded
              ? `${stats.submitted} đã nộp · ${Math.max(0, students.length - stats.submitted)} chưa nộp`
              : `${stats.online} đang online${stats.offline > 0 ? ` · ${stats.offline} offline` : ''}${stats.paused > 0 ? ` · ${stats.paused} tạm dừng` : ''}`}
          </div>
        </div>

        <div className="lp-kpi-card">
          <div className="lp-kpi-head">
            <span>Đã nộp bài</span>
            <b>{submittedPct}%</b>
          </div>
          <div className="lp-kpi-val">
            {stats.submitted}/{students.length || 0}
          </div>
          <div className="lp-kpi-bar">
            <i style={{ width: `${submittedPct}%`, background: submittedPct === 100 && students.length > 0 ? '#10b981' : '#2563eb' }} />
          </div>
        </div>

        <div className="lp-kpi-card">
          <div className="lp-kpi-head">
            <span>Minh bạch phòng thi</span>
          </div>
          <div className={`lp-kpi-val ${roomDiagnostics.integrityPct < 70 ? 'is-danger' : roomDiagnostics.integrityPct < 90 ? 'is-warn' : 'is-ok'}`}>
            {roomDiagnostics.integrityPct}%
          </div>
          <div className="lp-kpi-sub">
            {stats.violators > 0 ? `${stats.violators} thí sinh có vi phạm nặng` : 'Không có vi phạm nghiêm trọng'}
          </div>
        </div>

        <div className="lp-kpi-card">
          <div className="lp-kpi-head">
            <span>Tiến độ làm bài</span>
            {students.length > 0 && (
              <button
                type="button"
                className="vt-link"
                style={{ fontSize: '0.72rem' }}
                onClick={() => setShowChart((v) => !v)}
              >
                {showChart ? 'Ẩn biểu đồ' : 'Biểu đồ'}
              </button>
            )}
          </div>
          <div className="lp-kpi-val">
            {avgProgress}{totalQuestions > 0 ? '%' : ' câu'}
          </div>
          <div className="lp-kpi-sub">
            {students.length > 0
              ? `Trung bình trên ${students.length} thí sinh`
              : 'Chưa có dữ liệu bài làm'}
          </div>
        </div>
      </section>

      {showChart && students.length > 0 && (
        <div className="lp-chart-panel">
          <div className="lp-chart-head">
            <b>Biểu đồ tiến độ làm bài ({totalQuestions > 0 ? '%' : 'số câu'}) · TB {avgProgress}{totalQuestions > 0 ? '%' : ' câu'}</b>
            <div className="vt-seg" role="group" aria-label="Kiểu biểu đồ">
              <button type="button" className={chartMode === 'line' ? 'on' : ''} onClick={() => setChartMode('line')} aria-label="Đường"><IcoChart size={14} /></button>
              <button type="button" className={chartMode === 'bar' ? 'on' : ''} onClick={() => setChartMode('bar')} aria-label="Cột"><IcoGrid size={14} /></button>
            </div>
          </div>
          <TrendChart points={progressPoints} mode={chartMode} max={progressMax} unit={totalQuestions > 0 ? '%' : ' câu'} />
        </div>
      )}

      {aiDiagOpen && (
        <section className="t-proctor-diag-panel" aria-label="AI Rà soát toàn phòng" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ElecFlaskBrandSvg size={17} variant="gradient" />
              <strong style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>
                Báo cáo rà soát phòng thi ({students.length} thí sinh)
              </strong>
            </div>
            {!isEnded && roomDiagnostics.flagged.length > 0 && (
              <button
                type="button"
                className="vt-btn sm primary"
                disabled={actioning}
                onClick={handleWarnFlaggedGroup}
              >
                <IcoBell size={13} /> Nhắc đồng loạt {roomDiagnostics.flagged.length} em cần chú ý
              </button>
            )}
          </div>

          <div className="t-proctor-diag-grid">
            <div className="t-proctor-diag-item">
              <strong>Vi phạm mức cao / Lặp lại ({roomDiagnostics.hardViolators.length})</strong>
              <p>
                {roomDiagnostics.hardViolators.length > 0
                  ? roomDiagnostics.hardViolators.map((x) => shortName(x.studentName)).slice(0, 4).join(', ')
                  : 'Chưa phát hiện hành vi rời màn hình nhiều lần hoặc DevTools.'}
              </p>
            </div>
            <div className="t-proctor-diag-item">
              <strong>
                {cameraEnabled ? `Mất camera / Tín hiệu yếu (${stats.camBad + stats.offline})` : `Mất kết nối (${stats.offline})`}
              </strong>
              <p>
                {cameraEnabled
                  ? (stats.camBad + stats.offline > 0
                    ? `${stats.camBad} thí sinh mất camera, ${stats.offline} mất kết nối tạm thời.`
                    : 'Toàn bộ thí sinh online đều giữ kết nối & camera ổn định.')
                  : (stats.offline > 0
                    ? `${stats.offline} thí sinh đang mất kết nối tạm thời (phòng thi không dùng camera).`
                    : 'Kết nối ổn định (đề thi không yêu cầu bật camera).')}
              </p>
            </div>
            <div className="t-proctor-diag-item">
              <strong>Chưa ghi nhận câu trả lời ({roomDiagnostics.stalled.length})</strong>
              <p>
                {roomDiagnostics.stalled.length > 0
                  ? `${roomDiagnostics.stalled.length} em đang mở đề nhưng chưa chọn đáp án nào.`
                  : (isEnded ? 'Phiên thi đã kết thúc.' : 'Tất cả thí sinh đang làm bài đều có tiến độ trả lời.')}
              </p>
            </div>
          </div>

          {aiProctorFeed.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <small style={{ fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Nhật ký cảnh báo AI gần nhất
              </small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {aiProctorFeed.slice(0, 4).map((item) => (
                  <span
                    key={item.id}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      background: 'var(--vt-tint)',
                      color: 'var(--ink)',
                      border: '1px solid var(--soft)',
                    }}
                  >
                    <b>{item.time}</b> · {item.studentName}: {item.messageSent}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* VIEW: PHÒNG THI / CAMERA */}
      {view === 'camera' && (
        <div className="vt-cols cams lp-workspace">
          <div className="vt-col">
            <div className="vt-cam-toolbar">
              <div className="vt-cam-title">
                <h2>{cameraEnabled ? 'Camera học sinh' : 'Thí sinh trong phòng'}</h2>
                <span className="vt-count-text"><b>{visible.length}</b>/{students.length}</span>
              </div>

              {cameraEnabled ? (
                <div className="vt-health" aria-label="Sức khỏe camera">
                  <span className="ok"><i /> {stats.camOk} tốt</span>
                  <span className="warn"><i /> {stats.camBad} mất hình</span>
                  <span className="off"><i /> {stats.offline} offline</span>
                </div>
              ) : (
                <div className="vt-health" aria-label="Trạng thái phòng thi">
                  <span className="ok"><i /> {stats.submitted} đã nộp</span>
                  {!isEnded && <span className="off"><i /> {stats.online} đang làm</span>}
                </div>
              )}

              <div className="vt-toolbar-ctrl">
                <div className="vt-seg" role="group" aria-label="Sắp xếp">
                  {[['risk', 'Rủi ro'], ['name', 'Tên'], ['progress', 'Tiến độ']].map(([k, l]) => (
                    <button key={k} type="button" className={sort === k ? 'on txt' : 'txt'} onClick={() => setSort(k)}>{l}</button>
                  ))}
                </div>
                {cameraEnabled && (
                  <div className="vt-seg" role="group" aria-label="Cỡ ô camera">
                    {[['s', 'S'], ['m', 'M'], ['l', 'L']].map(([k, l]) => (
                      <button key={k} type="button" className={size === k ? 'on txt' : 'txt'} onClick={() => setSize(k)} aria-label={`Cỡ ${l}`}>{l}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="vt-empty">
                <span><IcoUsers size={30} /></span>
                <h3>
                  {students.length === 0
                    ? (isEnded ? 'Phiên thi không có thí sinh tham gia' : 'Chưa có học sinh nào vào phòng')
                    : 'Không có học sinh phù hợp'}
                </h3>
                <p>
                  {students.length === 0
                    ? (isEnded
                      ? 'Ca thi này đã kết thúc mà chưa ghi nhận lượt vào phòng nào.'
                      : cameraEnabled
                        ? 'Khung camera học sinh sẽ tự động xuất hiện ngay khi các em mở đề thi.'
                        : 'Danh sách thí sinh và tiến độ làm bài sẽ cập nhật tức thì khi các em vào phòng (đề đang tắt camera).')
                    : 'Thử đổi bộ lọc hoặc từ khóa.'}
                </p>
              </div>
            ) : (
              <div className={cameraEnabled ? ('vt-cams size-' + size) : 'lp-student-grid'}>
                {visible.map((st) => (
                  <CamCard
                    key={st.id}
                    st={st}
                    now={now}
                    total={totalQuestions}
                    pinned={pinned.has(st.id)}
                    highlight={selectedId === st.id}
                    cameraEnabled={cameraEnabled}
                    isEnded={isEnded}
                    onOpen={(s) => setSelectedId(s.id)}
                    onPin={togglePin}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="vt-col side lp-side-panel">
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
                        <Avatar name={s.studentName} size={40} />
                        <div>
                          <b>{shortName(s.studentName)}</b>
                          <small>{m ? m.label : (!isStudentOnline(s, now) ? 'Mất kết nối' : (cameraEnabled ? 'Mất hình' : 'Cần kiểm tra'))}</small>
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
                <tr><th>Học sinh</th><th>Trạng thái</th><th>Tiến độ</th><th>Vi phạm</th><th>{cameraEnabled ? 'Camera' : 'Kết nối'}</th><th /></tr>
              </thead>
              <tbody>
                {students
                  .filter((s) => !search.trim() || s.studentName?.toLowerCase().includes(search.trim().toLowerCase()))
                  .sort((a, b) => riskOf(b, now, { cameraEnabled, isEnded }) - riskOf(a, now, { cameraEnabled, isEnded }))
                  .map((s) => {
                    const prog = totalQuestions > 0 ? Math.min(100, Math.round(((s.answered || 0) / totalQuestions) * 100)) : null;
                    const cs = isEnded ? 'done' : camState(s, now, cameraEnabled);
                    const csLabel = isEnded
                      ? (s.status === 'submitted' ? 'Đã nộp' : 'Kết thúc')
                      : ({ ok: 'Tốt', stale: 'Mất hình', off: 'Offline', none: 'Chưa có', done: '—', disabled: 'Online' }[cs] || '—');
                    return (
                      <tr key={s.id}>
                        <td><span className="vt-td-name"><Avatar name={s.studentName} size={32} /><b>{s.studentName}</b>{s.paused && <i className="vt-chip soon" style={{ fontSize: '.62rem' }}>Tạm dừng</i>}</span></td>
                        <td><span className={'vt-chip st-' + s.status}>{{ examining: 'Đang làm', submitted: 'Đã nộp', kicked: 'Bị mời ra', joined: 'Đã vào' }[s.status] || s.status}</span></td>
                        <td>
                          <div className="vt-td-prog">
                            <div className="vt-bar"><i style={{ width: `${prog ?? 0}%` }} /></div>
                            <small>{s.answered || 0}{totalQuestions ? `/${totalQuestions}` : ' câu'}</small>
                          </div>
                        </td>
                        <td><b className={hardCount(s) ? 'danger-text' : ''}>{hardCount(s)}</b><small className="vt-muted"> nặng · {softCount(s)} nhẹ</small></td>
                        <td><span className={'vt-cam-dot ' + cs}>{csLabel}</span></td>
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
                  <button type="button" className="vt-btn primary" onClick={exportReport}><IcoDownload size={14} /> Xuất Excel (.xlsx)</button>
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
          cameraEnabled={cameraEnabled}
          isEnded={isEnded}
          index={Math.max(0, navIndex)}
          count={navList.length}
          onClose={() => setSelectedId(null)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onKick={handleKick}
          onWarn={handleWarn}
          onTogglePause={handleTogglePause}
          requestKick={setKickTarget}
          requestForceSubmit={setForceTarget}
          actioning={actioning}
        />
      )}

      {/* XÁC NHẬN THU BÀI NGAY */}
      {forceTarget && (
        <Modal
          title="Thu bài học sinh ngay?"
          size="sm"
          onClose={() => setForceTarget(null)}
          foot={
            <>
              <button type="button" className="vt-btn" onClick={() => setForceTarget(null)}>Hủy</button>
              <button
                type="button"
                className="vt-btn danger"
                onClick={async () => {
                  await handleForceSubmit(forceTarget.id);
                  setForceTarget(null);
                  setSelectedId(null);
                }}
              >
                <IcoStop size={14} /> Thu bài ngay
              </button>
            </>
          }
        >
          <p className="vt-confirm-text">
            Hệ thống sẽ buộc <b>{forceTarget.studentName}</b> nộp bài làm hiện tại ngay lập tức và khóa tiếp tục sửa bài.
          </p>
        </Modal>
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
                  try {
                    await handleKick(kickTarget.id, 'Giáo viên yêu cầu');
                    say(`Đã mời ${shortName(kickTarget.studentName)} ra`);
                    setKickTarget(null);
                    setSelectedId(null);
                  } catch (err) {
                    say('Không mời được học sinh ra: ' + (err?.message || err), 'error');
                  }
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

      {/* CHẾ ĐỘ TRÌNH CHIẾU MÁY CHIẾU / TV LỚP HỌC (PROJECTOR MODE) */}
      {projectorOpen && (
        <Modal
          title={`Màn hình Trình chiếu Phòng thi · ${session.title}`}
          size="xl"
          onClose={() => setProjectorOpen(false)}
          foot={
            <>
              {!isEnded && (
                <>
                  <button type="button" className="vt-btn" onClick={() => handleExtendTime(5)} disabled={extending}>
                    <IcoClock size={14} /> +5 phút
                  </button>
                  <button type="button" className="vt-btn" onClick={() => setBroadcastOpen(true)}>
                    <IcoBell size={14} /> Nhắc cả phòng
                  </button>
                </>
              )}
              <button type="button" className="vt-btn primary" onClick={() => setProjectorOpen(false)}>
                Đóng màn hình trình chiếu
              </button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center', padding: '1rem 0.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1.5rem', borderRadius: 24, background: 'var(--vt-tint, rgba(15,23,42,0.06))', border: '1px solid var(--soft)' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mut)' }}>
                {isEnded ? 'CA THI ĐÃ KẾT THÚC' : 'THỜI GIAN LÀM BÀI CÒN LẠI'}
              </span>
              <div style={{ fontSize: 'clamp(3.2rem, 8vw, 5.5rem)', fontWeight: 900, lineHeight: 1.1, margin: '0.6rem 0', fontVariantNumeric: 'tabular-nums', color: remaining < 300 && !isEnded ? '#ef4444' : 'var(--ink)' }}>
                {isEnded ? '00:00' : fmtMMSS(remaining)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '1.6rem', display: 'block', color: 'var(--ink)' }}>{students.length}</strong>
                  <small style={{ color: 'var(--mut)', fontWeight: 700 }}>Học sinh đã vào</small>
                </div>
                <div>
                  <strong style={{ fontSize: '1.6rem', display: 'block', color: '#10b981' }}>{stats.submitted}</strong>
                  <small style={{ color: 'var(--mut)', fontWeight: 700 }}>Đã nộp bài</small>
                </div>
                <div>
                  <strong style={{ fontSize: '1.6rem', display: 'block', color: '#3b82f6' }}>{Math.max(0, students.length - stats.submitted)}</strong>
                  <small style={{ color: 'var(--mut)', fontWeight: 700 }}>Đang làm bài</small>
                </div>
              </div>
            </div>

            {session.examToken && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem', padding: '1.25rem', borderRadius: 24, border: '1px solid var(--soft)' }}>
                <b style={{ fontSize: '0.95rem' }}>Quét mã QR để vào phòng thi</b>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}#exam/${session.examToken}`)}&margin=1`}
                  width={190}
                  height={190}
                  alt="QR vào phòng thi"
                  style={{ borderRadius: 14, border: '1px solid var(--soft)', background: '#fff', padding: 8 }}
                />
                <code style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', borderRadius: 8, background: 'var(--vt-tint)', color: 'var(--acc)', fontWeight: 700 }}>
                  {`${window.location.origin}${window.location.pathname}#exam/${session.examToken}`}
                </code>
                <small style={{ color: 'var(--mut)' }}>
                  Giữ chế độ toàn màn hình và không chuyển tab trong suốt thời gian làm bài.
                </small>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashFrame>
  );
}