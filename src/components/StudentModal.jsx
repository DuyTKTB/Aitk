/* ============================================================
   StudentModal.jsx — Modal chi tiết 1 học sinh (v2)
   ------------------------------------------------------------
   v2: chỉ dùng SVG, không emoji.
   ============================================================ */
import { useMemo, useState, useEffect } from 'react';
import { Avatar, downloadCsv } from './DashShell.jsx';
import '../styles/class-detail.css';

const Svg = ({ size = 18, sw = 1.8, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const IconClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
const IconCheck = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l3 3 5-6" />
  </Svg>
);
const IconBook = (p) => (
  <Svg {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
    <path d="M4 20a2 2 0 0 0 2 1h13v-3" />
  </Svg>
);
const IconTrendUp = (p) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Svg>
);
const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
const IconAlert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5" />
    <circle cx="12" cy="16.2" r=".6" fill="currentColor" />
  </Svg>
);
const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
const IconTrophy = (p) => (
  <Svg {...p}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
  </Svg>
);

const tsMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (v?.seconds) return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const fmtDateTime = (t) => {
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
  if (h > 0) return `${h}h ${m}p`;
  return `${m}p ${String(t % 60).padStart(2, '0')}s`;
};

const pctOf = (sub) => {
  if (!sub || !sub.totalPoints) return 0;
  return Math.round((sub.score / sub.totalPoints) * 100);
};

export default function StudentModal({ student, onClose }) {
  const [detailSub, setDetailSub] = useState(null);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape' && !detailSub) onClose?.();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, detailSub]);

  const stats = useMemo(() => {
    const subs = student?.submissions || [];
    const totalTime = subs.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    const totalViolations = subs.reduce((sum, s) => sum + (s.violationCount || 0), 0);
    const autoSubmitted = subs.filter((s) => s.autoSubmitted).length;
    const best = subs.reduce((max, s) => {
      const p = pctOf(s);
      return p > max ? p : max;
    }, 0);
    return {
      doneCount: subs.length,
      totalTime,
      totalViolations,
      autoSubmitted,
      best,
    };
  }, [student]);

  if (!student) return null;

  /* Nâng cấp: xuất toàn bộ bài làm của HS ra CSV (mở được bằng Excel) */
  const exportCsv = () => {
    const subs = [...(student.submissions || [])].sort((a, b) => tsMs(b.submittedAt) - tsMs(a.submittedAt));
    const rows = [['Đề', 'Điểm', 'Tổng điểm', 'Tỷ lệ (%)', 'Số câu đúng', 'Thời gian (giây)', 'Nộp lúc', 'Vi phạm', 'Tự động nộp']];
    subs.forEach((s) => rows.push([
      s.examTitle || '', s.score ?? '', s.totalPoints ?? '', pctOf(s),
      s.correctCount ?? '', Math.round(Number(s.timeSpent) || 0), fmtDateTime(s.submittedAt),
      s.violationCount || 0, s.autoSubmitted ? 'Có' : 'Không',
    ]));
    const safe = String(student.name || 'hoc-sinh').replace(/[\\/:*?"<>|]/g, '').trim() || 'hoc-sinh';
    downloadCsv(`${safe}-ket-qua.csv`, rows);
  };

  return (
    <div
      className="vt-backdrop cd-backdrop cd-backdrop-2"
      onMouseDown={(e) => e.target === e.currentTarget && !detailSub && onClose?.()}
    >
      <div className="cd-modal vt-modal md" role="dialog" aria-modal="true" aria-label={`Chi tiết ${student.name}`}>
        <header className="cd-head">
          <Avatar name={student.name} size={52} />
          <div className="cd-head-info">
            <h2>{student.name}</h2>
            <p>{student.email || 'Chưa có email'}</p>
          </div>
          <button type="button" className="cd-close" onClick={onClose} aria-label="Đóng">
            <IconClose size={18} />
          </button>
        </header>

        <div className="cd-body student-body">
          <div className="cd-stat-grid-4">
            <div className="cd-stat-card">
              <span className="cd-stat-card-ico acc"><IconCheck size={18} /></span>
              <b>{stats.doneCount}/{student.totalExams ?? stats.doneCount}</b>
              <small>Đã làm</small>
            </div>
            <div className="cd-stat-card">
              <span className="cd-stat-card-ico green"><IconTrendUp size={18} /></span>
              <b>{student.avgScore == null ? '—' : `${student.avgScore}%`}</b>
              <small>Điểm TB</small>
            </div>
            <div className="cd-stat-card">
              <span className="cd-stat-card-ico blue"><IconClock size={18} /></span>
              <b>{fmtTime(stats.totalTime)}</b>
              <small>Tổng thời gian</small>
            </div>
            <div className={'cd-stat-card' + (stats.totalViolations > 0 ? ' danger' : '')}>
              <span className="cd-stat-card-ico red"><IconAlert size={18} /></span>
              <b>{stats.totalViolations}</b>
              <small>Vi phạm</small>
            </div>
          </div>

          {stats.autoSubmitted > 0 && (
            <div className="cd-alert danger">
              <IconAlert size={14} />
              <span>Có <b>{stats.autoSubmitted}</b> bài tự động nộp do vi phạm.</span>
            </div>
          )}

          <section className="cd-section">
            <header className="cd-section-head">
              <h3>
                <IconBook size={16} /> Các bài kiểm tra đã làm
              </h3>
              <span className="cd-count">{student.submissions?.length || 0} bài</span>
              {(student.submissions?.length || 0) > 0 && (
                <button type="button" className="vt-btn sm" onClick={exportCsv}>Xuất CSV</button>
              )}
            </header>

            {(!student.submissions || student.submissions.length === 0) ? (
              <div className="cd-empty sm">
                <span><IconBook size={24} /></span>
                <p>Học sinh này chưa làm bài kiểm tra nào.</p>
              </div>
            ) : (
              <ul className="cd-sub-list">
                {[...student.submissions]
                  .sort((a, b) => tsMs(b.submittedAt) - tsMs(a.submittedAt))
                  .map((sub, i) => {
                    const pct = pctOf(sub);
                    const tone = pct >= 70 ? 'green' : pct >= 50 ? 'amber' : 'red';
                    return (
                      <li key={sub.id || i} className="cd-sub-item">
                        <div className="cd-sub-badge" style={{ '--tone': tone }}>
                          <b>{pct}%</b>
                          <small>{sub.score}/{sub.totalPoints}</small>
                        </div>
                        <div className="cd-sub-main">
                          <h4>{sub.examTitle || `Đề ${i + 1}`}</h4>
                          <p className="cd-sub-meta">
                            <span>
                              <IconClock size={11} /> {fmtTime(sub.timeSpent)}
                            </span>
                            <span>·</span>
                            <span>{fmtDateTime(sub.submittedAt)}</span>
                            {sub.violationCount > 0 && (
                              <>
                                <span>·</span>
                                <span className="cd-sub-warn">
                                  <IconAlert size={11} /> {sub.violationCount} vi phạm
                                </span>
                              </>
                            )}
                            {sub.autoSubmitted && (
                              <>
                                <span>·</span>
                                <span className="cd-sub-warn">Tự động nộp</span>
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="cd-sub-view"
                          onClick={() => setDetailSub(sub)}
                          title="Xem chi tiết"
                        >
                          <IconEye size={14} />
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>

          {stats.best > 0 && (
            <div className="cd-best">
              <span className="cd-best-ico"><IconTrophy size={20} /></span>
              <div>
                <small>Điểm cao nhất</small>
                <b>{stats.best}%</b>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailSub && (
        <SubmissionDetailModal
          submission={detailSub}
          studentName={student.name}
          onClose={() => setDetailSub(null)}
        />
      )}
    </div>
  );
}

function SubmissionDetailModal({ submission, studentName, onClose }) {
  const detail = submission.detail || [];
  const correctCount = submission.correctCount || detail.filter((d) => d.isCorrect).length;
  const totalQ = submission.totalQuestions || detail.length;
  const pct = pctOf(submission);

  // v3: hộp chi tiết bài làm đóng được bằng phím Esc (trước đây không có)
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="vt-backdrop cd-backdrop cd-backdrop-3" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="cd-modal vt-modal lg" role="dialog" aria-modal="true" aria-label={`Chi tiết bài làm của ${studentName}`}>
        <header className="cd-head">
          <span className="cd-head-avatar small" aria-hidden="true">
            <IconBook size={20} />
          </span>
          <div className="cd-head-info">
            <h2>{submission.examTitle || 'Chi tiết bài làm'}</h2>
            <p>{studentName} · Nộp lúc {fmtDateTime(submission.submittedAt)}</p>
          </div>
          <button type="button" className="cd-close" onClick={onClose} aria-label="Đóng">
            <IconClose size={18} />
          </button>
        </header>

        <div className="cd-body">
          <div className="cd-stat-grid-4">
            <div className="cd-stat-card">
              <b>{submission.score}/{submission.totalPoints}</b>
              <small>Điểm</small>
            </div>
            <div className="cd-stat-card">
              <b>{correctCount}/{totalQ}</b>
              <small>Đúng</small>
            </div>
            <div className="cd-stat-card">
              <b>{pct}%</b>
              <small>Tỷ lệ</small>
            </div>
            <div className="cd-stat-card">
              <b>{fmtTime(submission.timeSpent)}</b>
              <small>Thời gian</small>
            </div>
          </div>

          {detail.length === 0 ? (
            <p className="cd-muted" style={{ padding: '2rem 0', textAlign: 'center' }}>
              Không có chi tiết bài làm cho lượt này.
            </p>
          ) : (
            <ul className="cd-detail-list">
              {detail.map((d, i) => (
                <li
                  key={i}
                  className={'cd-detail-item ' + (d.isCorrect ? 'ok' : d.picked === -1 ? 'skip' : 'bad')}
                >
                  <div className="cd-detail-head">
                    <b>Câu {i + 1}</b>
                    <span className={'cd-verdict ' + (d.isCorrect ? 'ok' : d.picked === -1 ? 'skip' : 'bad')}>
                      {d.isCorrect ? 'Đúng' : d.picked === -1 ? 'Bỏ trống' : 'Sai'}
                    </span>
                  </div>
                  <p className="cd-detail-ans">
                    Chọn: <b>{d.picked === -1 ? '—' : String.fromCharCode(65 + d.picked)}</b>
                    {' · '}
                    Đáp án đúng: <b>{String.fromCharCode(65 + d.correct)}</b>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}