/* ============================================================
   ClassDetailModal.jsx — Modal chi tiết lớp học (Vitality) v2
   ------------------------------------------------------------
   Props:
     - classInfo: { id, name, subject, teacherName, key, members[],
                    memberIds[], pendingMembers[], pendingIds[],
                    requireApproval }
     - exams: mảng đề của lớp này
     - onClose: callback đóng modal
     - onExportCsv: callback xuất bảng điểm
     - onOpenExam: callback mở đề (chuyển sang tab Sửa đề)
     - onApprove, onReject, onApproveAll, onToggleApproval: duyệt HS
     - onOpenRetryTab: callback khi GV muốn xem yêu cầu thi lại
     - retryRequests: danh sách yêu cầu thi lại (đã lọc theo lớp)
     - onApproveRetry, onDenyRetry, onToggleAllowance: duyệt thi lại
     - allowances: { [studentId]: true/false } — quyền thi lại của từng HS
   ------------------------------------------------------------
   6 tab: Tổng quan · Thành viên · Chờ duyệt · Đề thi · Bảng điểm · Xin thi lại
   ============================================================ */
import { useMemo, useState, useEffect, useCallback } from 'react';
import { getSubmissionsByExam } from '../lib/classroom.js';
import { Avatar, Donut, TrendChart } from './DashShell.jsx';
import StudentModal from './StudentModal.jsx';
import '../styles/class-detail.css';

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

const IconClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5S15 16.6 15.6 20" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16 14.5c2.4.3 4.3 2.1 4.8 4.8" />
  </Svg>
);
const IconBook = (p) => (
  <Svg {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
    <path d="M4 20a2 2 0 0 0 2 1h13v-3" />
    <path d="M8 7h7" />
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
const IconTable = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M9 4v16M15 4v16" />
  </Svg>
);
const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Svg>
);
const IconDownload = (p) => (
  <Svg {...p}>
    <path d="M12 4v12M7 11l5 5 5-5" />
    <path d="M4 20h16" />
  </Svg>
);
const IconCheck = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l3 3 5-6" />
  </Svg>
);
const IconAlert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5" />
    <circle cx="12" cy="16.2" r=".6" fill="currentColor" />
  </Svg>
);
const IconTrendUp = (p) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Svg>
);
const IconChevron = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
const IconUserPlus = (p) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </Svg>
);
const IconX = (p) => (
  <Svg {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const IconBell = (p) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);
const IconUnlock = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 7.464-2" />
  </Svg>
);
const IconLock = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);
const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M9 7V4h6v3" />
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

const fmtDate = (t) => {
  if (!t) return '—';
  const d = new Date(tsMs(t));
  return d.toLocaleDateString('vi-VN') + ' ' +
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const fmtTime = (sec) => {
  const t = Math.round(Number(sec) || 0);
  if (!t) return '—';
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}′`;
  return `${m}′${String(t % 60).padStart(2, '0')}″`;
};

const pctOf = (sub) => {
  if (!sub || !sub.totalPoints) return 0;
  return Math.round((sub.score / sub.totalPoints) * 100);
};

const timeAgoShort = (t) => {
  const ms = Date.now() - tsMs(t);
  if (ms < 60e3) return 'vừa xong';
  const m = Math.floor(ms / 60e3);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(tsMs(t)).toLocaleDateString('vi-VN');
};

/* ============================================================
   MAIN
   ============================================================ */
export default function ClassDetailModal({
  classInfo,
  exams = [],
  onClose,
  onExportCsv,
  onOpenExam,
  onApprove,
  onReject,
  onApproveAll,
  onToggleApproval,
  onRemoveMember,
  retryRequests = [],
  allowances = {},
  onApproveRetry,
  onDenyRetry,
  onToggleAllowance,
}) {
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [openStudent, setOpenStudent] = useState(null);

  const members = classInfo?.members || [];
  const pending = classInfo?.pendingMembers || [];
  const pendingRetry = useMemo(
    () => (retryRequests || []).filter((r) => r.status === 'pending'),
    [retryRequests]
  );

  /* ---- Load submissions của tất cả đề trong lớp ---- */
  const loadSubmissions = useCallback(async () => {
    if (!exams.length) { setLoadingSubs(false); return; }
    setLoadingSubs(true);
    try {
      const map = {};
      await Promise.all(exams.map(async (ex) => {
        try {
          const subs = await getSubmissionsByExam(ex.id);
          map[ex.id] = subs || [];
        } catch {
          map[ex.id] = [];
        }
      }));
      setSubmissionsMap(map);
    } catch (e) {
      console.warn('[ClassDetailModal] load submissions lỗi:', e);
    } finally {
      setLoadingSubs(false);
    }
  }, [exams]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  /* ---- Đóng khi bấm ESC ---- */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !openStudent) onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, openStudent]);

  /* ============================================================
     STATS TOÀN LỚP
     ============================================================ */
  const classStats = useMemo(() => {
    const allSubs = Object.values(submissionsMap).flat();
    const totalExams = exams.length;
    const totalStudents = members.length;
    const totalSubs = allSubs.length;

    const scores = allSubs
      .filter((s) => s.totalPoints > 0)
      .map((s) => (s.score / s.totalPoints) * 100);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    const passed = scores.filter((s) => s >= 50).length;
    const passRate = scores.length ? Math.round((passed / scores.length) * 100) : 0;

    const activeStudentIds = new Set(allSubs.map((s) => s.studentId));
    const completedRate = totalStudents
      ? Math.round((activeStudentIds.size / totalStudents) * 100)
      : 0;

    const totalViolations = allSubs.reduce((sum, s) => sum + (s.violationCount || 0), 0);

    return {
      totalExams,
      totalStudents,
      totalSubs,
      avgScore,
      passRate,
      completedRate,
      totalViolations,
    };
  }, [submissionsMap, exams.length, members.length]);

  /* ============================================================
     STATS THEO HỌC SINH
     ============================================================ */
  const studentsStats = useMemo(() => {
    return members.map((m) => {
      const mySubs = [];
      exams.forEach((ex) => {
        const subs = submissionsMap[ex.id] || [];
        // Lấy TẤT CẢ submission của HS cho đề này (để biết thi lại)
        const mySubsForExam = subs.filter((s) => s.studentId === m.id);
        mySubsForExam.forEach((sub) => {
          mySubs.push({
            ...sub,
            examTitle: ex.title,
            examId: ex.id,
            examDuration: ex.duration,
          });
        });
      });

      const doneCount = mySubs.length;
      const scores = mySubs
        .filter((s) => s.totalPoints > 0)
        .map((s) => (s.score / s.totalPoints) * 100);
      // Điểm TB lấy cao nhất (theo yêu cầu)
      const avg = scores.length ? Math.round(Math.max(...scores)) : null;

      const totalViolations = mySubs.reduce((sum, s) => sum + (s.violationCount || 0), 0);
      const lastSub = mySubs.reduce((latest, s) => {
        const t = tsMs(s.submittedAt);
        return t > tsMs(latest?.submittedAt) ? s : latest;
      }, null);

      return {
        ...m,
        doneCount,
        totalExams: exams.length,
        avgScore: avg,
        totalViolations,
        lastSubAt: lastSub?.submittedAt,
        submissions: mySubs,
      };
    });
  }, [members, exams, submissionsMap]);

  /* ---- Filter + search cho tab Thành viên ---- */
  const filteredStudents = useMemo(() => {
    let list = studentsStats;

    if (memberFilter === 'done') list = list.filter((s) => s.doneCount > 0);
    else if (memberFilter === 'no-do') list = list.filter((s) => s.doneCount === 0);
    else if (memberFilter === 'perfect') list = list.filter((s) => s.doneCount === s.totalExams && s.totalExams > 0);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      if (a.avgScore == null && b.avgScore != null) return 1;
      if (b.avgScore == null && a.avgScore != null) return -1;
      return (b.avgScore || 0) - (a.avgScore || 0);
    });
  }, [studentsStats, memberFilter, search]);

  /* ---- Trend chart 7 đề gần nhất ---- */
  const trendPoints = useMemo(() => {
    return exams
      .slice(-7)
      .map((ex) => {
        const subs = submissionsMap[ex.id] || [];
        const scores = subs.filter((s) => s.totalPoints > 0).map((s) => (s.score / s.totalPoints) * 100);
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return { label: ex.title, value: avg };
      });
  }, [exams, submissionsMap]);

  /* ============================================================
     TABS
     ============================================================ */
  const TABS = [
    { key: 'overview', label: 'Tổng quan', Icon: IconGrid },
    { key: 'members', label: 'Thành viên', Icon: IconUsers, badge: members.length },
    { key: 'pending', label: 'Chờ duyệt', Icon: IconUserPlus, badge: pending.length, danger: true },
    { key: 'exams', label: 'Đề thi', Icon: IconBook, badge: exams.length },
    { key: 'scores', label: 'Bảng điểm', Icon: IconTable },
    { key: 'retry', label: 'Xin thi lại', Icon: IconBell, badge: pendingRetry.length, danger: true },
  ];

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="vt-backdrop cd-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !openStudent && onClose?.()}>
      <div className="cd-modal vt-modal xl" role="dialog" aria-modal="true" aria-label={`Chi tiết lớp ${classInfo?.name}`}>
        {/* ============ HEADER ============ */}
        <header className="cd-head">
          <span className="cd-head-avatar">
            {String(classInfo?.name || '?')[0].toUpperCase()}
          </span>
          <div className="cd-head-info">
            <h2>{classInfo?.name || 'Lớp học'}</h2>
            <p>
              GV {classInfo?.teacherName || 'Giáo viên'}
              {classInfo?.subject && ` · ${classInfo.subject}`}
              {classInfo?.key && ` · Key ${classInfo.key}`}
            </p>
          </div>
          <button type="button" className="cd-close" onClick={onClose} aria-label="Đóng">
            <IconClose size={18} />
          </button>
        </header>

        {/* ============ TABS ============ */}
        <nav className="cd-tabs" role="tablist">
          {TABS.map((t) => {
            const I = t.Icon;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={'cd-tab' + (tab === t.key ? ' on' : '')}
                onClick={() => setTab(t.key)}
              >
                <I size={15} />
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <em style={t.danger ? { background: '#dc2626', color: '#fff' } : undefined}>
                    {t.badge}
                  </em>
                )}
              </button>
            );
          })}
        </nav>

        {/* ============ BODY ============ */}
        <div className="cd-body">
          {/* ---------- TAB: TỔNG QUAN ---------- */}
          {tab === 'overview' && (
            <div className="cd-overview">
              <div className="cd-stat-grid">
                <div className="cd-stat">
                  <span className="cd-stat-ico"><IconUsers size={20} /></span>
                  <div>
                    <small>Học sinh</small>
                    <b>{classStats.totalStudents}</b>
                  </div>
                </div>
                <div className="cd-stat">
                  <span className="cd-stat-ico"><IconBook size={20} /></span>
                  <div>
                    <small>Đề thi</small>
                    <b>{classStats.totalExams}</b>
                  </div>
                </div>
                <div className="cd-stat">
                  <span className="cd-stat-ico"><IconCheck size={20} /></span>
                  <div>
                    <small>Lượt nộp</small>
                    <b>{classStats.totalSubs}</b>
                  </div>
                </div>
                <div className="cd-stat">
                  <span className="cd-stat-ico warn"><IconAlert size={20} /></span>
                  <div>
                    <small>Vi phạm</small>
                    <b>{classStats.totalViolations}</b>
                  </div>
                </div>
              </div>

              <div className="cd-overview-cols">
                <div className="cd-card">
                  <h3>
                    <IconTrendUp size={15} /> Điểm TB lớp
                  </h3>
                  <div className="cd-overview-chart">
                    <Donut
                      value={classStats.avgScore || 0}
                      max={100}
                      size={140}
                      stroke={12}
                      tone={
                        classStats.avgScore == null ? 'acc'
                          : classStats.avgScore >= 70 ? 'acc'
                            : classStats.avgScore >= 50 ? 'warn'
                              : 'danger'
                      }
                    >
                      <strong>{classStats.avgScore == null ? '—' : classStats.avgScore}<sup>%</sup></strong>
                      <small>trung bình</small>
                    </Donut>
                    <ul className="cd-overview-facts">
                      <li>
                        <span>Tỷ lệ đạt ≥ 50%</span>
                        <b>{classStats.passRate}%</b>
                      </li>
                      <li>
                        <span>HS đã làm ít nhất 1 đề</span>
                        <b>{classStats.completedRate}%</b>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="cd-card">
                  <h3>
                    <IconTrendUp size={15} /> Xu hướng điểm
                  </h3>
                  {trendPoints.length > 0 ? (
                    <TrendChart points={trendPoints} mode="line" max={100} />
                  ) : (
                    <p className="cd-muted">Chưa có bài nộp nào</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------- TAB: THÀNH VIÊN ---------- */}
          {tab === 'members' && (
            <div className="cd-members">
              <div className="cd-toolbar">
                <label className="cd-search">
                  <IconSearch size={15} />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm học sinh…"
                    aria-label="Tìm học sinh"
                  />
                </label>
                <div className="cd-seg" role="group" aria-label="Lọc thành viên">
                  <button
                    type="button"
                    className={memberFilter === 'all' ? 'on' : ''}
                    onClick={() => setMemberFilter('all')}
                  >
                    Tất cả <em>{studentsStats.length}</em>
                  </button>
                  <button
                    type="button"
                    className={memberFilter === 'done' ? 'on' : ''}
                    onClick={() => setMemberFilter('done')}
                  >
                    Đã làm <em>{studentsStats.filter((s) => s.doneCount > 0).length}</em>
                  </button>
                  <button
                    type="button"
                    className={memberFilter === 'no-do' ? 'on' : ''}
                    onClick={() => setMemberFilter('no-do')}
                  >
                    Chưa làm <em>{studentsStats.filter((s) => s.doneCount === 0).length}</em>
                  </button>
                </div>
                <button
                  type="button"
                  className="vt-btn sm"
                  onClick={() => onExportCsv?.(classInfo, exams, submissionsMap)}
                  title="Xuất bảng điểm CSV"
                >
                  <IconDownload size={13} /> Xuất CSV
                </button>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="cd-empty">
                  <span><IconUsers size={30} /></span>
                  <h3>Không có học sinh nào</h3>
                  <p>Thử đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
                </div>
              ) : (
                <div className="cd-table-wrap">
                  <table className="cd-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Học sinh</th>
                        <th style={{ width: 100 }}>Đã làm</th>
                        <th style={{ width: 100 }}>Điểm TB</th>
                        <th style={{ width: 100 }}>Vi phạm</th>
                        <th style={{ width: 140 }}>Lần cuối</th>
                        <th style={{ width: 60 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, i) => (
                        <tr key={s.id} className="cd-row">
                          <td className="cd-idx">{i + 1}</td>
                          <td onClick={() => setOpenStudent(s)} style={{ cursor: 'pointer' }}>
                            <div className="cd-cell-student">
                              <Avatar name={s.name} size={36} />
                              <div>
                                <b>{s.name}</b>
                                <small>{s.email}</small>
                              </div>
                            </div>
                          </td>
                          <td onClick={() => setOpenStudent(s)} style={{ cursor: 'pointer' }}>
                            <span className="cd-badge">
                              <b>{s.doneCount}</b>/{s.totalExams}
                            </span>
                          </td>
                          <td onClick={() => setOpenStudent(s)} style={{ cursor: 'pointer' }}>
                            {s.avgScore == null ? (
                              <span className="cd-muted">—</span>
                            ) : (
                              <b
                                className="cd-score"
                                style={{
                                  color: s.avgScore >= 70 ? '#16a34a'
                                    : s.avgScore >= 50 ? '#f59e0b'
                                      : '#ef4444',
                                }}
                              >
                                {s.avgScore}%
                              </b>
                            )}
                          </td>
                          <td onClick={() => setOpenStudent(s)} style={{ cursor: 'pointer' }}>
                            {s.totalViolations === 0 ? (
                              <span className="cd-muted">0</span>
                            ) : (
                              <span className="cd-badge danger">
                                <IconAlert size={11} /> {s.totalViolations}
                              </span>
                            )}
                          </td>
                          <td className="cd-muted" style={{ fontSize: '.78rem' }}>
                            {s.lastSubAt ? fmtDate(s.lastSubAt) : '—'}
                          </td>
                          <td>
                            {onRemoveMember && (
                              <button
                                type="button"
                                className="vt-icon-btn danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveMember(classInfo, s);
                                }}
                                title="Xóa khỏi lớp"
                                aria-label={`Xóa ${s.name} khỏi lớp`}
                              >
                                <IconTrash size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ---------- TAB: CHỜ DUYỆT ---------- */}
          {tab === 'pending' && (
            <div className="cd-members">
              <div className="cd-toolbar">
                <label className="cd-check">
                  <input
                    type="checkbox"
                    checked={classInfo?.requireApproval !== false}
                    onChange={(e) => onToggleApproval?.(classInfo, e.target.checked)}
                  />
                  Học sinh phải được duyệt mới vào lớp
                </label>
                {pending.length > 0 && (
                  <button
                    type="button"
                    className="vt-btn sm primary"
                    onClick={() => onApproveAll?.(classInfo)}
                  >
                    <IconCheck size={13} /> Duyệt tất cả ({pending.length})
                  </button>
                )}
              </div>

              {pending.length === 0 ? (
                <div className="cd-empty">
                  <span><IconUserPlus size={30} /></span>
                  <h3>Không có yêu cầu nào</h3>
                  <p>Học sinh nhập key lớp sẽ xuất hiện ở đây để chờ duyệt.</p>
                </div>
              ) : (
                <ul className="cd-sub-list">
                  {pending.map((p) => (
                    <li key={p.id} className="cd-sub-item">
                      <Avatar name={p.name} size={40} />
                      <div className="cd-sub-main">
                        <h4>{p.name}</h4>
                        <p className="cd-sub-meta">
                          {p.email || '—'} · yêu cầu {timeAgoShort(p.requestedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="vt-btn sm primary"
                        onClick={() => onApprove?.(classInfo, p.id)}
                      >
                        <IconCheck size={13} /> Duyệt
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm danger"
                        onClick={() => onReject?.(classInfo, p.id)}
                      >
                        <IconX size={13} /> Từ chối
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ---------- TAB: ĐỀ THI ---------- */}
          {tab === 'exams' && (
            <div className="cd-exams">
              {exams.length === 0 ? (
                <div className="cd-empty">
                  <span><IconBook size={30} /></span>
                  <h3>Lớp chưa có đề nào</h3>
                  <p>Vào tab "Tạo đề" để giao bài cho lớp.</p>
                </div>
              ) : (
                <ul className="cd-exam-list">
                  {exams.map((ex) => {
                    const subs = submissionsMap[ex.id] || [];
                    const scores = subs.filter((s) => s.totalPoints > 0).map((s) => (s.score / s.totalPoints) * 100);
                    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                    return (
                      <li key={ex.id} className="cd-exam-card">
                        <div className="cd-exam-main">
                          <h4>{ex.title}</h4>
                          <p>
                            {ex.questions?.length || 0} câu · {ex.duration || '—'} phút · {ex.totalPoints || 0} điểm
                          </p>
                        </div>
                        <div className="cd-exam-stats">
                          <div>
                            <small>Đã nộp</small>
                            <b>{subs.length}/{members.length}</b>
                          </div>
                          <div>
                            <small>Điểm TB</small>
                            <b>{avg == null ? '—' : `${avg}%`}</b>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="vt-btn sm"
                          onClick={() => onOpenExam?.(ex.id)}
                        >
                          Mở đề
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* ---------- TAB: BẢNG ĐIỂM ---------- */}
          {tab === 'scores' && (
            <div className="cd-scores">
              {exams.length === 0 || members.length === 0 ? (
                <div className="cd-empty">
                  <span><IconTable size={30} /></span>
                  <h3>Chưa có dữ liệu</h3>
                  <p>Cần có ít nhất 1 đề và 1 học sinh.</p>
                </div>
              ) : (
                <>
                  <div className="cd-toolbar">
                    <button
                      type="button"
                      className="vt-btn sm"
                      onClick={() => onExportCsv?.(classInfo, exams, submissionsMap)}
                    >
                      <IconDownload size={13} /> Xuất CSV
                    </button>
                  </div>
                  <div className="cd-score-wrap">
                    <table className="cd-score-table">
                      <thead>
                        <tr>
                          <th className="cd-sticky-col">Học sinh</th>
                          {exams.map((ex, i) => (
                            <th key={ex.id} title={ex.title}>
                              Đề {i + 1}
                            </th>
                          ))}
                          <th>TB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsStats.map((s) => {
                          const totalPct = s.avgScore;
                          return (
                            <tr key={s.id}>
                              <td className="cd-sticky-col">
                                <div className="cd-cell-student compact">
                                  <Avatar name={s.name} size={26} />
                                  <b>{s.name}</b>
                                </div>
                              </td>
                              {exams.map((ex) => {
                                const sub = (submissionsMap[ex.id] || []).find((x) => x.studentId === s.id);
                                if (!sub) return <td key={ex.id} className="cd-score-cell empty">—</td>;
                                const pct = pctOf(sub);
                                return (
                                  <td
                                    key={ex.id}
                                    className="cd-score-cell"
                                    style={{
                                      background: `color-mix(in srgb, ${
                                        pct >= 70 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444'
                                      } ${Math.min(60, 15 + pct / 2)}%, var(--panel))`,
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => setOpenStudent(s)}
                                    title={`${fmtDate(sub.submittedAt)} · ${fmtTime(sub.timeSpent)}`}
                                  >
                                    {pct}%
                                  </td>
                                );
                              })}
                              <td className="cd-score-cell total">
                                {totalPct == null ? '—' : `${totalPct}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ---------- TAB: XIN THI LẠI ---------- */}
          {tab === 'retry' && (
            <div className="cd-members">
              {pendingRetry.length === 0 && Object.keys(allowances).filter((k) => allowances[k]).length === 0 ? (
                <div className="cd-empty">
                  <span><IconBell size={30} /></span>
                  <h3>Chưa có yêu cầu thi lại</h3>
                  <p>Khi học sinh bấm "Xin cô cho thi lại", yêu cầu sẽ xuất hiện ở đây.</p>
                </div>
              ) : (
                <>
                  {pendingRetry.length > 0 && (
                    <>
                      <h3 style={{ margin: '0 0 .7rem', font: '800 .95rem var(--sans)', color: 'var(--ink)' }}>
                        Yêu cầu chờ duyệt ({pendingRetry.length})
                      </h3>
                      <ul className="cd-sub-list" style={{ marginBottom: '1.2rem' }}>
                        {pendingRetry.map((r) => {
                          const examTitle = exams.find((e) => e.id === r.examId)?.title || 'Đề không xác định';
                          return (
                            <li key={r.id} className="cd-sub-item" style={{ flexWrap: 'wrap' }}>
                              <Avatar name={r.studentName} size={40} />
                              <div className="cd-sub-main" style={{ flex: '1 1 200px' }}>
                                <h4>{r.studentName}</h4>
                                <p className="cd-sub-meta">
                                  <b>{examTitle}</b>
                                </p>
                                <p className="cd-sub-meta">
                                  {r.reason ? `Lý do: "${r.reason}"` : 'Không có lý do'}
                                  {' · '}{timeAgoShort(r.requestedAt)}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="vt-btn sm primary"
                                onClick={() => onApproveRetry?.(r)}
                              >
                                <IconCheck size={13} /> Duyệt
                              </button>
                              <button
                                type="button"
                                className="vt-btn sm danger"
                                onClick={() => onDenyRetry?.(r)}
                              >
                                <IconX size={13} /> Từ chối
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}

                  <h3 style={{ margin: '1rem 0 .7rem', font: '800 .95rem var(--sans)', color: 'var(--ink)' }}>
                    Bật thi lại mọi đề cho từng HS
                  </h3>
                  <p className="cd-muted" style={{ margin: '0 0 .7rem', fontSize: '.82rem' }}>
                    Bật xong, HS đó có thể làm lại bất kỳ đề nào của lớp này mà không cần xin từng đề.
                  </p>
                  <ul className="cd-sub-list">
                    {members.map((m) => {
                      const allowed = !!allowances[m.id];
                      return (
                        <li key={m.id} className="cd-sub-item">
                          <Avatar name={m.name} size={40} />
                          <div className="cd-sub-main">
                            <h4>{m.name}</h4>
                            <p className="cd-sub-meta">{m.email || '—'}</p>
                          </div>
                          <button
                            type="button"
                            className={'vt-btn sm' + (allowed ? ' danger' : ' primary')}
                            onClick={() => onToggleAllowance?.(classInfo, m, !allowed)}
                          >
                            {allowed ? (
                              <><IconLock size={13} /> Khóa thi lại</>
                            ) : (
                              <><IconUnlock size={13} /> Cho thi lại mọi đề</>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ MODAL CHI TIẾT HỌC SINH ============ */}
      {openStudent && (
        <StudentModal
          student={openStudent}
          onClose={() => setOpenStudent(null)}
        />
      )}
    </div>
  );
}