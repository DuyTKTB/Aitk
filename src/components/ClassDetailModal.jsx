/* ============================================================
   ClassDetailModal.jsx — Modal chi tiết lớp học (Vitality)
   ------------------------------------------------------------
   Props:
     - classInfo: { id, name, subject, teacherName, key, members[], memberIds[] }
     - exams: mảng đề của lớp này
     - onClose: callback đóng modal
     - onExportCsv: callback xuất bảng điểm
     - onOpenExam: callback mở đề (chuyển sang tab Sửa đề)
   ------------------------------------------------------------
   4 tab: Tổng quan · Thành viên · Đề thi · Bảng điểm
   Tab Thành viên có bảng HS → bấm vào mở StudentModal
   ============================================================ */
import { useMemo, useState, useEffect, useCallback } from 'react';
import { getSubmissionsByExam } from '../lib/classroom.js';
import { Avatar, Donut, TrendChart } from './DashShell.jsx';
import StudentModal from './StudentModal.jsx';
import '../styles/class-detail.css';

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
const IconTrophy = (p) => (
  <Svg {...p}>
    <path d="M7 5h10v4a5 5 0 0 1-10 0z" />
    <path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3" />
    <path d="M9 18h6M12 14v4" />
  </Svg>
);
const IconChevron = (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;

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

/* ============================================================
   TABS
   ============================================================ */
const TABS = [
  { key: 'overview', label: 'Tổng quan', Icon: IconGrid },
  { key: 'members', label: 'Thành viên', Icon: IconUsers },
  { key: 'exams', label: 'Đề thi', Icon: IconBook },
  { key: 'scores', label: 'Bảng điểm', Icon: IconTable },
];

/* ============================================================
   MAIN
   ============================================================ */
export default function ClassDetailModal({ classInfo, exams = [], onClose, onExportCsv, onOpenExam }) {
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [openStudent, setOpenStudent] = useState(null);

  const members = classInfo?.members || [];

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

    // Điểm TB lớp
    const scores = allSubs
      .filter((s) => s.totalPoints > 0)
      .map((s) => (s.score / s.totalPoints) * 100);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // Tỷ lệ đạt (>= 50%)
    const passed = scores.filter((s) => s >= 50).length;
    const passRate = scores.length ? Math.round((passed / scores.length) * 100) : 0;

    // Tỷ lệ hoàn thành (HS đã làm ít nhất 1 đề)
    const activeStudentIds = new Set(allSubs.map((s) => s.studentId));
    const completedRate = totalStudents
      ? Math.round((activeStudentIds.size / totalStudents) * 100)
      : 0;

    // Vi phạm
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
      // Tìm các submission của HS này
      const mySubs = [];
      exams.forEach((ex) => {
        const subs = submissionsMap[ex.id] || [];
        const sub = subs.find((s) => s.studentId === m.id);
        if (sub) {
          mySubs.push({ ...sub, examTitle: ex.title, examId: ex.id, examDuration: ex.duration });
        }
      });

      const doneCount = mySubs.length;
      const scores = mySubs
        .filter((s) => s.totalPoints > 0)
        .map((s) => (s.score / s.totalPoints) * 100);
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

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
      // Ưu tiên: có điểm TB cao lên đầu, HS chưa làm xuống cuối
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
                {t.key === 'members' && (
                  <em>{members.length}</em>
                )}
                {t.key === 'exams' && (
                  <em>{exams.length}</em>
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
                        <th style={{ width: 40 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, i) => (
                        <tr
                          key={s.id}
                          className="cd-row"
                          onClick={() => setOpenStudent(s)}
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenStudent(s)}
                        >
                          <td className="cd-idx">{i + 1}</td>
                          <td>
                            <div className="cd-cell-student">
                              <Avatar name={s.name} size={36} />
                              <div>
                                <b>{s.name}</b>
                                <small>{s.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="cd-badge">
                              <b>{s.doneCount}</b>/{s.totalExams}
                            </span>
                          </td>
                          <td>
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
                          <td>
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
                            <IconChevron size={14} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
        </div>
      </div>

      {/* ============ MODAL CHI TIẾT HỌC SINH (chồng lên) ============ */}
      {openStudent && (
        <StudentModal
          student={openStudent}
          onClose={() => setOpenStudent(null)}
        />
      )}
    </div>
  );
}