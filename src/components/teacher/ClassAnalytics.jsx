/* ============================================================
   ClassAnalytics.jsx — "Số liệu lớp" cho giáo viên (v2 Nâng cấp)
   ------------------------------------------------------------
   Gồm 6 khối:
     1. KPI lớp (TB, % đạt, Mastery TB, số em cần chú ý, chưa nộp)
     2. Biểu đồ xu hướng đề thi & phân bố chương (chuyển Đường / Cột)
     3. So sánh hai lớp trực quan (Side-by-side comparison)
     4. Heatmap học sinh × chương (đỏ = yếu)
     5. Danh sách học sinh (Tìm kiếm, lọc cờ, sắp xếp, Lưới/Danh sách, Xuất CSV)
     6. Ngăn kéo hồ sơ 1 học sinh (5 thành phần Mastery, chương, bài gần nhất)

   Mọi con số đều tính từ bài nộp thật; thiếu dữ liệu thì ghi rõ
   "chưa đủ dữ liệu" chứ không hiển thị 0.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildClassAnalytics, masteryLabel, rateTone, MASTERY_PARTS } from '../../lib/teacherAnalytics.js';
import { getExamsByClass, getSubmissionsByExam } from '../../lib/classroom.js';
import { computeStudentPeriodGrades, classifyExamGradeColumn, exportStyledWorkbook } from '../../lib/excelExport.js';
import { ElecFlaskBrandSvg, ElecMascot } from './ElecBrandMark.jsx';
import { IconClose } from '../Icons.jsx';
import '../../styles/teacher-analytics.css';

/* Cache 5 phút: đổi lớp qua lại không phải tải lại toàn bộ đề + bài nộp */
const FEED_TTL = 5 * 60 * 1000;
const feedCache = new Map();

const RANGES = [
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
  { key: '90', label: '90 ngày' },
  { key: 'all', label: 'Tất cả' },
  { key: 'custom', label: 'Khoảng ngày' },
];

const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  const p = Date.parse(v);
  return Number.isNaN(p) ? 0 : p;
};

const fmtDate = (ms) => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return '—';
  }
};

/* ---------- SVG Icons (18px, nét mảnh) ---------- */
const IcoDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IcoCompare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="7" height="16" rx="1.5" />
    <rect x="14" y="4" width="7" height="16" rx="1.5" />
  </svg>
);

const IcoBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IcoLineChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="15 7 21 7 21 13" />
  </svg>
);

const IcoRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <polyline points="21 4 21 10 15 10" />
  </svg>
);

function Kpi({ label, value, unit, hint, tone, diff, icon: iconType }) {
  return (
    <div className={`ta-kpi${tone ? ` is-${tone}` : ''}`}>
      <div className="ta-kpi-top">
        <span className="ta-kpi-label">{label}</span>
        {iconType && (
          <span className={`ta-kpi-icon tone-${iconType}`}>
            {iconType === 'trend' && <IcoLineChart />}
            {iconType === 'check' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            {iconType === 'award' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            )}
            {iconType === 'alert' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {iconType === 'clock' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )}
          </span>
        )}
      </div>
      <div className="ta-kpi-middle">
        <span className="ta-kpi-value">
          {value === null || value === undefined ? '—' : value}
          {unit && value !== null && value !== undefined ? <small>{unit}</small> : null}
        </span>
        {diff !== undefined && diff !== null && (
          <span className={`ta-kpi-diff-pill ${diff >= 0 ? 'up' : 'down'}`}>
            {diff >= 0 ? `+${diff}` : diff}{unit || ''}
          </span>
        )}
      </div>
      <span className="ta-kpi-hint">
        {hint}
      </span>
    </div>
  );
}

function MasteryBar({ score }) {
  const meta = masteryLabel(score);
  if (score === null) {
    return <span className="ta-mastery-na">chưa đủ dữ liệu</span>;
  }
  return (
    <span className="ta-mastery">
      <span className="ta-mastery-track">
        <i className={`ta-mastery-fill tone-${meta.tone}`} style={{ width: `${score}%` }} />
      </span>
      <b>{score}</b>
      <em className={`tone-${meta.tone}`}>{meta.label}</em>
    </span>
  );
}

function HeatCell({ rate }) {
  return (
    <td className={`ta-heat ta-heat-${rateTone(rate)}`} title={rate === null ? 'Chưa có dữ liệu' : `${rate}% đúng`}>
      {rate === null ? '–' : rate}
    </td>
  );
}

/* ---------- Biểu đồ Cột / Đường (Line / Bar SVG Chart) ---------- */
function TrendChart({ series = [], compareSeries = [], chartType = 'bar', primaryLabel = 'Lớp chính', compareLabel = 'Lớp so sánh' }) {
  if (!series.length) {
    return <p className="ta-note">Chưa có đề thi có bài nộp để hiển thị biểu đồ xu hướng.</p>;
  }
  const W = 640;
  const H = 172;
  const padL = 36;
  const padR = 20;
  const padT = 20;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = series.length;
  const slotW = innerW / Math.max(n, 1);

  const yOf = (val) => padT + innerH - (Math.max(0, Math.min(100, val || 0)) / 100) * innerH;

  return (
    <div className="ta-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="ta-chart-svg" role="img" aria-label="Biểu đồ xu hướng điểm trung bình">
        <defs>
          <linearGradient id="taBarGradPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="taBarGradCmp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="taAreaGradPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Đường lưới ngang */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.5">
                {v}%
              </text>
            </g>
          );
        })}

        {chartType === 'bar' ? (
          series.map((pt, i) => {
            const hasCmp = compareSeries.length > 0 && compareSeries[i]?.value !== null && compareSeries[i]?.value !== undefined;
            const barW = hasCmp ? Math.min(24, Math.max(12, slotW / 3)) : Math.min(44, Math.max(18, slotW * 0.48));
            const cx = padL + (i + 0.5) * slotW;
            const y = yOf(pt.value);
            const h = Math.max(4, padT + innerH - y);
            const cmpVal = hasCmp ? compareSeries[i].value : null;
            const cmpY = cmpVal !== null ? yOf(cmpVal) : 0;
            const cmpH = cmpVal !== null ? Math.max(4, padT + innerH - cmpY) : 0;

            return (
              <g key={pt.key || i} className="ta-chart-group">
                <rect
                  x={hasCmp ? cx - barW - 2 : cx - barW / 2}
                  y={y}
                  width={barW}
                  height={h}
                  rx="5"
                  fill="url(#taBarGradPrimary)"
                >
                  <title>{`${pt.label} (${primaryLabel}): ${pt.value}% (${pt.subCount || 0} bài)`}</title>
                </rect>
                <text
                  x={hasCmp ? cx - barW / 2 - 2 : cx}
                  y={Math.max(14, y - 5)}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="#1d4ed8"
                >
                  {pt.value}%
                </text>
                {hasCmp && (
                  <>
                    <rect
                      x={cx + 2}
                      y={cmpY}
                      width={barW}
                      height={cmpH}
                      rx="5"
                      fill="url(#taBarGradCmp)"
                    >
                      <title>{`${compareSeries[i].label || pt.label} (${compareLabel}): ${cmpVal}%`}</title>
                    </rect>
                    <text
                      x={cx + barW / 2 + 2}
                      y={Math.max(14, cmpY - 5)}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="800"
                      fill="#059669"
                    >
                      {cmpVal}%
                    </text>
                  </>
                )}
                <text
                  x={cx}
                  y={H - 12}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="600"
                  fill="currentColor"
                  opacity="0.8"
                >
                  {pt.shortLabel || pt.label.slice(0, 14)}
                </text>
              </g>
            );
          })
        ) : (
          <>
            {/* Vùng mờ dưới đường biểu diễn */}
            {series.length > 1 && (
              <polygon
                fill="url(#taAreaGradPrimary)"
                points={`${padL + 0.5 * slotW},${padT + innerH} ${series.map((pt, i) => `${padL + (i + 0.5) * slotW},${yOf(pt.value)}`).join(' ')} ${padL + (series.length - 0.5) * slotW},${padT + innerH}`}
              />
            )}
            {/* Đường chính */}
            {series.length > 1 && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={series.map((pt, i) => `${padL + (i + 0.5) * slotW},${yOf(pt.value)}`).join(' ')}
              />
            )}
            {/* Đường so sánh */}
            {compareSeries.length > 1 && (
              <polyline
                fill="none"
                stroke="#0f9d76"
                strokeWidth="2.4"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={compareSeries.map((pt, i) => `${padL + (i + 0.5) * slotW},${yOf(pt.value || 0)}`).join(' ')}
              />
            )}
            {series.map((pt, i) => {
              const cx = padL + (i + 0.5) * slotW;
              const cy = yOf(pt.value);
              return (
                <g key={pt.key || i}>
                  <circle cx={cx} cy={cy} r="4.5" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                  <text x={cx} y={Math.max(14, cy - 8)} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1d4ed8">
                    {pt.value}%
                  </text>
                  <text x={cx} y={H - 12} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="currentColor" opacity="0.8">
                    {pt.shortLabel || pt.label.slice(0, 14)}
                  </text>
                </g>
              );
            })}
            {compareSeries.map((pt, i) => {
              if (pt?.value === null || pt?.value === undefined) return null;
              const cx = padL + (i + 0.5) * slotW;
              const cy = yOf(pt.value);
              return (
                <circle key={`cmp-${i}`} cx={cx} cy={cy} r="4" fill="#0f9d76" stroke="#fff" strokeWidth="1.5">
                  <title>{`${compareLabel} — ${pt.label}: ${pt.value}%`}</title>
                </circle>
              );
            })}
          </>
        )}
      </svg>
      {compareSeries.length > 0 && (
        <div className="ta-chart-legend">
          <span><i style={{ background: '#2563eb' }} /> {primaryLabel}</span>
          <span><i style={{ background: '#0f9d76' }} /> {compareLabel}</span>
        </div>
      )}
    </div>
  );
}

function StudentDrawer({ student, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!student) return null;
  const meta = masteryLabel(student.mastery);

  return (
    <div className="ta-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="ta-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Hồ sơ ${student.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ta-drawer-head">
          <div>
            <b>{student.name}</b>
            <span>{student.email || `${student.count} bài đã nộp`}</span>
          </div>
          <button type="button" className="ta-drawer-x" onClick={onClose} aria-label="Đóng" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={16} />
          </button>
        </header>

        <div className={`ta-drawer-score tone-${meta.tone}`}>
          <strong>{student.mastery === null ? '—' : student.mastery}</strong>
          <span>{meta.label}</span>
        </div>

        {student.mastery === null && (
          <p className="ta-note">
            Cần tối thiểu 3 bài nộp và 20 câu đã làm để xếp loại. Hiện có {student.count} bài.
          </p>
        )}

        <h4 className="ta-drawer-title">5 thành phần</h4>
        <ul className="ta-parts">
          {MASTERY_PARTS.map((p) => {
            const v = student[p.key];
            return (
              <li key={p.key} title={p.hint}>
                <span className="ta-parts-label">{p.label}<small>{Math.round(p.weight * 100)}%</small></span>
                <span className="ta-parts-track">
                  <i style={{ width: `${v === null ? 0 : v}%` }} />
                </span>
                <b>{v === null ? '–' : v}</b>
              </li>
            );
          })}
        </ul>

        <h4 className="ta-drawer-title">Theo giáo viên bộ môn</h4>
        {student.byTeacher.length === 0 ? (
          <p className="ta-note">Chưa làm bài của giáo viên nào.</p>
        ) : (
          <ul className="ta-tlist">
            {student.byTeacher.map((t) => {
              const m = masteryLabel(t.mastery);
              return (
                <li key={t.key}>
                  <span className="ta-tlist-name">
                    {t.teacherName}
                    <small>{t.subject || 'bộ môn'}</small>
                  </span>
                  <span className="ta-tlist-num">{t.count} bài</span>
                  <b className={`tone-${m.tone}`}>{t.pctAvg === null ? '—' : `${t.pctAvg}%`}</b>
                </li>
              );
            })}
          </ul>
        )}

        <h4 className="ta-drawer-title">Theo chương</h4>
        {student.topics.length === 0 ? (
          <p className="ta-note">Chưa có câu nào được gắn chương. Gắn chương khi tạo đề để thấy mục này.</p>
        ) : (
          <ul className="ta-topicbars">
            {student.topics.map((t) => (
              <li key={t.topic}>
                <span>{t.topic}<small>{t.ok}/{t.rated}</small></span>
                <span className="ta-topicbars-track">
                  <i className={`tone-${rateTone(t.rate)}`} style={{ width: `${t.rate}%` }} />
                </span>
                <b>{t.rate}%</b>
              </li>
            ))}
          </ul>
        )}

        <h4 className="ta-drawer-title">Bài nộp gần nhất</h4>
        {student.subs.length === 0 ? (
          <p className="ta-note">Chưa nộp bài nào.</p>
        ) : (
          <ul className="ta-sublist">
            {[...student.subs].slice(-8).reverse().map((s) => {
              const isOmr = !!(s.isPaperOmr || s.source === 'paper-omr');
              return (
                <li key={`${s.examId}-${s.id || s.studentId}`}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {s.examTitle || 'Đề'}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '1px 6px',
                        borderRadius: 999,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: isOmr ? 'var(--t-warn-soft, rgba(217, 119, 6, 0.14))' : 'var(--t-accent-soft, rgba(37, 99, 235, 0.12))',
                        color: isOmr ? 'var(--t-warn, #b45309)' : 'var(--t-accent, #1d4ed8)',
                      }}
                    >
                      {isOmr ? 'Phiếu A4 OMR' : 'Online'}
                    </span>
                  </span>
                  <b>{Math.round((Number(s.score) / (Number(s.totalPoints) || 1)) * 100)}%</b>
                  <small>{fmtDate(toMs(s.submittedAt))}</small>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}

const fmtClassLabel = (name) => {
  const s = String(name || '').trim();
  if (!s) return '—';
  return /^lớp\s+/i.test(s) ? s : `Lớp ${s}`;
};

export default function ClassAnalytics({
  classes = [],
  exams = [],
  submissionsMap = {},
  loading = false,
  onCreateRemedialExam = null,
}) {
  const [classId, setClassId] = useState(() => (classes[0] ? classes[0].id : ''));
  const [range, setRange] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [drawerId, setDrawerId] = useState(null);
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [feed, setFeed] = useState({ exams: [], submissionsMap: {}, loading: false, error: '' });
  const [reloadNonce, setReloadNonce] = useState(0);

  /* Tính năng nâng cấp D4: Biểu đồ đường/cột + So sánh 2 lớp + Lọc/Sắp xếp/Lưới học sinh + Tab thu gọn */
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'heatmap'
  const studentsTabRef = useRef(null);
  const jumpToStudentsFilter = (filterVal) => {
    setStudentFilter((prev) => (prev === filterVal ? 'all' : filterVal));
    setActiveTab('students');
    setTimeout(() => {
      studentsTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'
  const [chartSource, setChartSource] = useState('exams'); // 'exams' | 'topics'
  const [compareMode, setCompareMode] = useState(false);
  const [compareClassId, setCompareClassId] = useState('');
  const [compareFeed, setCompareFeed] = useState({ exams: [], submissionsMap: {}, loading: false });

  const [studentQuery, setStudentQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('all'); // 'all' | 'risk' | 'nosub' | 'good'
  const [studentSort, setStudentSort] = useState('mastery-asc'); // 'mastery-asc' | 'mastery-desc' | 'acc-desc' | 'subs-desc'
  const [studentView, setStudentView] = useState('list'); // 'list' | 'grid'

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0].id);
  }, [classes, classId]);

  useEffect(() => {
    if (compareMode && !compareClassId && classes.length > 1) {
      const second = classes.find((c) => c.id !== classId) || classes[0];
      if (second) setCompareClassId(second.id);
    }
  }, [compareMode, compareClassId, classes, classId]);

  const cls = useMemo(() => classes.find((c) => c.id === classId) || null, [classes, classId]);
  const compareCls = useMemo(
    () => (compareMode && compareClassId ? classes.find((c) => c.id === compareClassId) || null : null),
    [compareMode, compareClassId, classes],
  );

  const fetchClassData = useCallback(async (targetId, bypassCache = false) => {
    if (!targetId) return { exams: [], submissionsMap: {} };
    if (!bypassCache) {
      const hit = feedCache.get(targetId);
      if (hit && Date.now() - hit.t < FEED_TTL) return hit.data;
    }
    const list = await getExamsByClass(targetId);
    const entries = await Promise.all(
      list.map(async (e) => {
        try {
          const subs = await getSubmissionsByExam(e.id);
          return [e.id, subs || []];
        } catch {
          return [e.id, []];
        }
      }),
    );
    const map = Object.fromEntries(entries);
    const data = { exams: list, submissionsMap: map };
    feedCache.set(targetId, { t: Date.now(), data });
    return data;
  }, []);

  /* Tự tải MỌI đề của lớp (kể cả của giáo viên bộ môn khác) + bài nộp. */
  useEffect(() => {
    if (!classId) return undefined;
    let alive = true;
    setFeed((f) => ({ ...f, loading: true, error: '' }));

    fetchClassData(classId, reloadNonce > 0)
      .then((data) => {
        if (alive) setFeed({ ...data, loading: false, error: '' });
      })
      .catch((err) => {
        if (alive) {
          setFeed({
            exams: [],
            submissionsMap: {},
            loading: false,
            error: err?.message || 'Không tải được đề và bài nộp của lớp. Vui lòng kiểm tra kết nối mạng.',
          });
        }
      });

    return () => { alive = false; };
  }, [classId, reloadNonce, fetchClassData]);

  /* Tải dữ liệu lớp thứ 2 khi bật So sánh hai lớp */
  useEffect(() => {
    if (!compareMode || !compareClassId) return undefined;
    let alive = true;
    setCompareFeed((f) => ({ ...f, loading: true }));
    fetchClassData(compareClassId)
      .then((data) => {
        if (alive) setCompareFeed({ ...data, loading: false });
      })
      .catch(() => {
        if (alive) setCompareFeed({ exams: [], submissionsMap: {}, loading: false });
      });
    return () => { alive = false; };
  }, [compareMode, compareClassId, fetchClassData]);

  const feedExams = useMemo(() => {
    const base = feed.exams.length ? [...feed.exams] : exams.filter((e) => e.classId === classId);
    const seen = new Set(base.map((e) => e.id));
    exams.filter((e) => e.classId === classId && !seen.has(e.id)).forEach((e) => {
      seen.add(e.id);
      base.push(e);
    });
    Object.entries(submissionsMap || {}).forEach(([exId, list]) => {
      if (seen.has(exId) || !Array.isArray(list) || !list.length) return;
      const clsSubs = list.filter((s) => s.classId === classId);
      if (!clsSubs.length) return;
      const first = clsSubs[0];
      seen.add(exId);
      base.push({
        id: exId,
        classId,
        title: first.examTitle || 'Phiếu chấm A4 (OMR)',
        subject: first.subject || cls?.subject || '',
        teacherId: first.teacherId || cls?.teacherId || '',
        teacherName: first.teacherName || '',
        isPaperOmr: !!(first.isPaperOmr || first.source === 'paper-omr'),
        createdAt: first.submittedAt || null,
      });
    });
    return base;
  }, [feed.exams, exams, classId, submissionsMap, cls]);

  const feedSubs = useMemo(() => {
    if (!feed.exams.length) return submissionsMap;
    const merged = { ...(feed.submissionsMap || {}) };
    feedExams.forEach((ex) => {
      const baseList = merged[ex.id] || [];
      const liveList = (submissionsMap?.[ex.id] || []).filter((s) => !s.classId || s.classId === classId);
      if (!liveList.length) return;
      const byId = new Map();
      baseList.forEach((s, idx) => byId.set(s.id || `b-${idx}`, s));
      liveList.forEach((s, idx) => byId.set(s.id || `l-${idx}`, s));
      merged[ex.id] = Array.from(byId.values());
    });
    return merged;
  }, [feed.exams.length, feed.submissionsMap, feedExams, submissionsMap, classId]);

  /* Áp dụng bộ lọc khoảng ngày tuỳ chỉnh (nếu range === 'custom') */
  const filteredSubsMap = useMemo(() => {
    if (range !== 'custom' || (!dateFrom && !dateTo)) return feedSubs;
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : 0;
    const toLimitMs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
    const next = {};
    Object.entries(feedSubs || {}).forEach(([exId, subs]) => {
      next[exId] = (subs || []).filter((s) => {
        const t = toMs(s.submittedAt);
        if (!t) return false;
        return t >= fromMs && t <= toLimitMs;
      });
    });
    return next;
  }, [feedSubs, range, dateFrom, dateTo]);

  const effectiveRangeDays = range === 'custom' ? 'all' : range;

  const data = useMemo(
    () => (cls ? buildClassAnalytics({
      cls, exams: feedExams, submissionsMap: filteredSubsMap, rangeDays: effectiveRangeDays, teacherFilter,
    }) : null),
    [cls, feedExams, filteredSubsMap, effectiveRangeDays, teacherFilter],
  );

  const compareData = useMemo(() => {
    if (!compareMode || !compareCls) return null;
    const cExams = compareFeed.exams.length ? compareFeed.exams : exams.filter((e) => e.classId === compareCls.id);
    const cSubs = compareFeed.exams.length ? compareFeed.submissionsMap : submissionsMap;
    return buildClassAnalytics({
      cls: compareCls,
      exams: cExams,
      submissionsMap: cSubs,
      rangeDays: effectiveRangeDays,
      teacherFilter: 'all',
    });
  }, [compareMode, compareCls, compareFeed, exams, submissionsMap, effectiveRangeDays]);

  /* Dữ liệu chuỗi cho Biểu đồ Cột / Đường */
  const chartSeries = useMemo(() => {
    if (!data) return [];
    if (chartSource === 'topics' && data.classTopics.length > 0) {
      return data.classTopics.slice(0, 8).map((t) => ({
        key: t.topic,
        label: t.topic,
        shortLabel: t.topic.length > 12 ? `${t.topic.slice(0, 12)}…` : t.topic,
        value: t.rate || 0,
        subCount: t.rated || 0,
      }));
    }
    /* Mặc định: theo các đề thi của lớp */
    const classExList = feedExams.filter((e) => !e.classId || e.classId === classId);
    const pts = [];
    classExList.forEach((ex) => {
      const subs = filteredSubsMap[ex.id] || [];
      if (!subs.length) return;
      const avg = Math.round(
        subs.reduce((acc, s) => acc + ((Number(s.score) || 0) / Math.max(1, Number(s.totalPoints) || 1)) * 100, 0) / subs.length,
      );
      pts.push({
        key: ex.id,
        label: ex.title || 'Đề kiểm tra',
        shortLabel: (ex.title || 'Đề').length > 13 ? `${(ex.title || 'Đề').slice(0, 13)}…` : (ex.title || 'Đề'),
        value: avg,
        subCount: subs.length,
      });
    });
    return pts.slice(-8);
  }, [data, chartSource, feedExams, classId, filteredSubsMap]);

  const compareChartSeries = useMemo(() => {
    if (!compareMode || !compareData) return [];
    if (chartSource === 'topics' && compareData.classTopics.length > 0) {
      return chartSeries.map((pt) => {
        const hit = compareData.classTopics.find((t) => t.topic === pt.key);
        return { key: pt.key, label: pt.label, value: hit ? hit.rate : 0 };
      });
    }
    const cExams = compareFeed.exams.length ? compareFeed.exams : exams.filter((e) => e.classId === compareClassId);
    const cSubs = compareFeed.exams.length ? compareFeed.submissionsMap : submissionsMap;
    const pts = [];
    cExams.forEach((ex) => {
      const subs = cSubs[ex.id] || [];
      if (!subs.length) return;
      const avg = Math.round(
        subs.reduce((acc, s) => acc + ((Number(s.score) || 0) / Math.max(1, Number(s.totalPoints) || 1)) * 100, 0) / subs.length,
      );
      pts.push({
        key: ex.id,
        label: ex.title || 'Đề',
        value: avg,
      });
    });
    return pts.slice(-8);
  }, [compareMode, compareData, chartSource, chartSeries, compareFeed, exams, compareClassId, submissionsMap]);

  const drawerStudent = useMemo(
    () => (data ? data.students.find((s) => s.id === drawerId) || null : null),
    [data, drawerId],
  );

  const heatTopics = useMemo(() => (data ? data.classTopics.slice(0, 10) : []), [data]);

  /* Phổ điểm 4 mức độ chuẩn Bộ GD&ĐT (Thang điểm 10) */
  const scoreDist = useMemo(() => {
    if (!data) return { gioi: 0, kha: 0, tb: 0, yeu: 0, total: 0, pcts: { gioi: 0, kha: 0, tb: 0, yeu: 0 } };
    const validSubs = Object.values(filteredSubsMap || {}).flat();
    const scores = validSubs.map((s) => {
      const tot = Number(s.totalPoints) || 10;
      const sc = Number(s.score) || 0;
      return (sc / tot) * 10;
    });
    const sample = scores.length
      ? scores
      : data.students.filter((s) => s.count > 0).map((s) => ((s.accuracy || 0) / 10));
    const total = sample.length || 1;
    const gioi = sample.filter((s) => s >= 8.0).length;
    const kha = sample.filter((s) => s >= 6.5 && s < 8.0).length;
    const tb = sample.filter((s) => s >= 5.0 && s < 6.5).length;
    const yeu = sample.filter((s) => s < 5.0).length;

    return {
      gioi,
      kha,
      tb,
      yeu,
      total: sample.length,
      pcts: {
        gioi: Math.round((gioi / total) * 100),
        kha: Math.round((kha / total) * 100),
        tb: Math.round((tb / total) * 100),
        yeu: Math.round((yeu / total) * 100),
      },
    };
  }, [data, filteredSubsMap]);

  /* Lọc và sắp xếp danh sách học sinh */
  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const q = studentQuery.trim().toLowerCase();
    let list = data.students.filter((s) => {
      if (q && !`${s.name || ''} ${s.email || ''}`.toLowerCase().includes(q)) return false;
      if (studentFilter === 'gioi') return s.accuracy >= 80;
      if (studentFilter === 'kha') return s.accuracy >= 65 && s.accuracy < 80;
      if (studentFilter === 'tb') return s.accuracy >= 50 && s.accuracy < 65;
      if (studentFilter === 'yeu' || studentFilter === 'risk') return s.accuracy < 50 || s.flags.length > 0;
      if (studentFilter === 'nosub') return s.count === 0;
      if (studentFilter === 'good') return s.accuracy >= 65;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (studentSort === 'acc-desc') return (b.accuracy ?? -1) - (a.accuracy ?? -1);
      if (studentSort === 'acc-asc') return (a.accuracy ?? 999) - (b.accuracy ?? 999);
      if (studentSort === 'subs-desc') return (b.count || 0) - (a.count || 0);
      if (studentSort === 'name-asc') return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
      return (b.accuracy ?? -1) - (a.accuracy ?? -1);
    });
    return list;
  }, [data, studentQuery, studentFilter, studentSort]);

  const [exportingExcel, setExportingExcel] = useState(false);

  /* Xuất Excel (.xlsx) báo cáo chi tiết đa sheet kèm Mascot ELEC & bản quyền */
  const handleExportExcel = async () => {
    if (!data || !cls || exportingExcel) return;
    setExportingExcel(true);
    try {
      const classLabel = cls.name || 'Lớp';
      const dateStr = new Date().toISOString().slice(0, 10);
      const classExList = feedExams.filter((e) => !e.classId || e.classId === classId);
      const safeAvgPct = data.kpi?.avgPct ?? 0;

      const atRiskRows = data.students
        .filter((s) => (s.mastery !== null && s.mastery < 50) || (s.flags && s.flags.length > 0))
        .map((s, idx) => ({
          stt: idx + 1,
          name: s.name || 'Học sinh',
          email: s.email || '',
          count: s.count || 0,
          score10: s.count ? Math.round((s.accuracy / 10) * 10) / 10 : null,
          mastery: s.mastery ?? '',
          weakTopic: s.weakest ? s.weakest.topic : 'Chưa xác định',
          weakRate: s.weakest ? s.weakest.rate / 100 : null,
          flags: s.flags.map((f) => f.label).join(' · ') || 'Cần theo dõi',
        }));

      const sheets = [
        {
          name: 'Tổng hợp Học lực',
          mascot: 'cool',
          title: `BÁO CÁO SỐ LIỆU & PHỔ ĐIỂM — ${classLabel.toUpperCase()}`,
          subtitle: `Phân tích năng lực học sinh · ${data.kpi.students} học sinh · ${data.kpi.exams} đề kiểm tra · TB lớp ${safeAvgPct}%`,
          meta: [
            { label: 'Lớp học', value: classLabel },
            { label: 'Sĩ số', value: `${data.kpi.students} HS` },
            { label: 'Tổng bài nộp', value: `${data.kpi.submitted} lượt` },
            { label: 'Tỉ lệ đạt (≥5.0)', value: data.kpi.passRate !== null ? `${data.kpi.passRate}%` : '—' },
            { label: 'Mastery TB', value: data.kpi.masteryAvg !== null ? `${data.kpi.masteryAvg}/100` : '—' },
          ],
          statsStrip: ({ dataStartRow, dataEndRow }) => [
            { value: 'Tổng số HS:' },
            { value: { formula: `COUNTA(B${dataStartRow}:B${dataEndRow})`, result: data.students.length }, align: 'center' },
            { value: 'Điểm TB lớp (/10):' },
            { value: { formula: `IFERROR(ROUND(AVERAGE(F${dataStartRow}:F${dataEndRow}),1),"—")`, result: safeAvgPct ? Math.round((safeAvgPct / 10) * 10) / 10 : 0 }, align: 'center', numFmt: '0.0' },
            { value: 'HS Giỏi:' },
            { value: { formula: `COUNTIF(H${dataStartRow}:H${dataEndRow},"Giỏi")`, result: data.students.filter((s) => s.accuracy >= 80).length }, fill: 'FFDCFCE7', color: 'FF166534' },
            { value: 'Cần kèm (<5.0):' },
            { value: { formula: `COUNTIF(F${dataStartRow}:F${dataEndRow},"<5")`, result: data.students.filter((s) => s.count > 0 && s.accuracy < 50).length }, fill: 'FFFEE2E2', color: 'FF991B1B' },
          ],
          columns: [
            { header: 'STT', key: 'stt', align: 'center', width: 8 },
            { header: 'Họ và tên học sinh', key: 'name', align: 'left', width: 26 },
            { header: 'Email', key: 'email', align: 'left', width: 28 },
            { header: 'Số bài nộp', key: 'count', align: 'center', width: 12 },
            { header: 'Điểm TB (%)', key: 'pct', align: 'center', numFmt: '0%', width: 14 },
            { header: 'Thang 10', key: 'score10', align: 'center', numFmt: '0.0', isScore10: true, width: 12 },
            { header: 'Mastery (/100)', key: 'mastery', align: 'center', width: 14 },
            { header: 'Xếp loại', key: 'rank', align: 'center', isScoreBand: true, width: 16 },
            { header: 'Chương yếu nhất', key: 'weakTopic', align: 'left', width: 24 },
            { header: 'Đúng chương yếu', key: 'weakRate', align: 'center', numFmt: '0%', width: 16 },
            { header: 'Cờ cảnh báo', key: 'flags', align: 'left', width: 24, wrapText: true },
            { header: 'Nộp gần nhất', key: 'lastAt', align: 'center', width: 16 },
          ],
          rows: data.students.map((s, idx) => {
            const grades = computeStudentPeriodGrades(s, classExList, filteredSubsMap);
            return {
              stt: idx + 1,
              name: s.name || 'Học sinh',
              email: s.email || '',
              count: s.count || 0,
              pct: s.count ? Math.round(s.accuracy) / 100 : null,
              score10: grades.tb,
              mastery: s.mastery ?? '',
              rank: grades.status,
              weakTopic: s.weakest ? s.weakest.topic : 'Không phát hiện lỗ hổng',
              weakRate: s.weakest ? s.weakest.rate / 100 : null,
              flags: s.flags.map((f) => f.label).join(' · ') || 'Bình thường',
              lastAt: s.lastAt ? new Date(s.lastAt).toLocaleDateString('vi-VN') : 'Chưa nộp',
            };
          }),
          summaryRow: {
            labelCol: 1,
            label: 'TRUNG BÌNH TOÀN LỚP',
            cells: {
              count: ({ dataStartRow, dataEndRow }) => ({ formula: `SUM(D${dataStartRow}:D${dataEndRow})` }),
              pct: ({ dataStartRow, dataEndRow }) => ({ formula: `IFERROR(AVERAGE(E${dataStartRow}:E${dataEndRow}),0)` }),
              score10: ({ dataStartRow, dataEndRow }) => ({ formula: `IFERROR(ROUND(AVERAGE(F${dataStartRow}:F${dataEndRow}),1),"")` }),
              mastery: ({ dataStartRow, dataEndRow }) => ({ formula: `IFERROR(ROUND(AVERAGE(G${dataStartRow}:G${dataEndRow}),0),"")` }),
            },
          },
        },
        {
          name: 'Phân tích Chuyên đề',
          mascot: 'think',
          title: `BẢN ĐỒ CHUYÊN ĐỀ & LỖ HỔNG KIẾN THỨC — ${classLabel.toUpperCase()}`,
          subtitle: 'Thống kê tỉ lệ trả lời đúng theo từng chương GDPT 2025 (Xếp từ yếu nhất tới vững nhất)',
          columns: [
            { header: 'STT', key: 'stt', align: 'center', width: 8 },
            { header: 'Chuyên đề / Chương', key: 'topic', align: 'left', width: 34 },
            { header: 'Số câu đúng', key: 'ok', align: 'center', width: 14 },
            { header: 'Tổng lượt trả lời', key: 'rated', align: 'center', width: 18 },
            { header: 'Tỉ lệ đúng (%)', key: 'rate', align: 'center', numFmt: '0%', width: 16 },
            { header: 'Đánh giá ưu tiên', key: 'level', align: 'center', isScoreBand: true, width: 22 },
          ],
          rows: data.classTopics.map((t, idx) => ({
            stt: idx + 1,
            topic: t.topic,
            ok: t.ok,
            rated: t.rated,
            rate: (t.rate || 0) / 100,
            level: t.rate < 50 ? 'Cần kèm ngay' : (t.rate < 70 ? 'Cần ôn tập' : 'Đã vững'),
          })),
        },
      ];

      if (atRiskRows.length > 0) {
        sheets.push({
          name: 'HS Cần phụ đạo',
          mascot: 'think',
          title: `DANH SÁCH HỌC SINH CẦN KÈM CẶP — ${classLabel.toUpperCase()}`,
          subtitle: `Phát hiện ${atRiskRows.length} học sinh có Mastery < 50 hoặc có cờ cảnh báo cần hỗ trợ sớm`,
          columns: [
            { header: 'STT', key: 'stt', align: 'center', width: 8 },
            { header: 'Họ và tên học sinh', key: 'name', align: 'left', width: 26 },
            { header: 'Email', key: 'email', align: 'left', width: 28 },
            { header: 'Số bài nộp', key: 'count', align: 'center', width: 12 },
            { header: 'Thang 10', key: 'score10', align: 'center', numFmt: '0.0', isScore10: true, width: 12 },
            { header: 'Mastery', key: 'mastery', align: 'center', width: 12 },
            { header: 'Chương yếu nhất', key: 'weakTopic', align: 'left', width: 24 },
            { header: 'Đúng chương yếu', key: 'weakRate', align: 'center', numFmt: '0%', width: 16 },
            { header: 'Cảnh báo', key: 'flags', align: 'left', width: 26, isScoreBand: true },
          ],
          rows: atRiskRows,
        });
      }

      if (data.teachers && data.teachers.length > 0) {
        sheets.push({
          name: 'Phân công GVBM',
          mascot: 'happy',
          title: `HOẠT ĐỘNG GIÁO VIÊN BỘ MÔN — ${classLabel.toUpperCase()}`,
          subtitle: `Tổng hợp ${data.teachers.length} giáo viên đang giảng dạy và giao đề tại lớp ${classLabel}`,
          columns: [
            { header: 'STT', key: 'stt', align: 'center', width: 8 },
            { header: 'Giáo viên', key: 'name', align: 'left', width: 26 },
            { header: 'Bộ môn', key: 'subject', align: 'left', width: 18 },
            { header: 'Số đề đã giao', key: 'exams', align: 'center', width: 15 },
            { header: 'Lượt nộp bài', key: 'subs', align: 'center', width: 15 },
            { header: 'Độ phủ HS (%)', key: 'cov', align: 'center', numFmt: '0%', width: 16 },
            { header: 'Điểm TB (%)', key: 'avg', align: 'center', numFmt: '0%', width: 15 },
          ],
          rows: data.teachers.map((t, idx) => ({
            stt: idx + 1,
            name: t.teacherName,
            subject: t.subject || 'Chưa gắn môn',
            exams: t.examCount || 0,
            subs: t.submissions || 0,
            cov: t.coverage !== null && t.coverage !== undefined ? t.coverage / 100 : null,
            avg: t.pctAvg !== null && t.pctAvg !== undefined ? t.pctAvg / 100 : null,
          })),
        });
      }

      await exportStyledWorkbook({
        filename: `bao-cao-lop-${classLabel.replace(/\s+/g, '-')}-${dateStr}.xlsx`,
        mascot: 'cool',
        sheets,
      });
    } finally {
      setExportingExcel(false);
    }
  };

  /* Xuất Bảng điểm vnEdu / SMAS (.xlsx) chuẩn Thông tư 22 (tách TX / ĐGK / CKK thật + công thức ĐTB) */
  const handleExportVnEdu = async () => {
    if (!data || !cls || exportingExcel) return;
    setExportingExcel(true);
    try {
      const classLabel = cls.name || 'Lớp';
      const dateStr = new Date().toISOString().slice(0, 10);
      const classExList = feedExams.filter((e) => !e.classId || e.classId === classId);
      const bucketCounts = classExList.reduce((acc, ex) => {
        const k = classifyExamGradeColumn(ex);
        acc[k] += 1;
        return acc;
      }, { tx: 0, dgk: 0, ckk: 0 });

      const enrichedStudents = data.students.map((s) => ({
        student: s,
        grades: computeStudentPeriodGrades(s, classExList, filteredSubsMap),
      }));

      const examDetailCols = [
        { header: 'STT', key: 'stt', align: 'center', width: 8 },
        { header: 'Họ và tên học sinh', key: 'name', align: 'left', width: 26 },
        { header: 'Lớp', key: 'clsName', align: 'center', width: 12 },
        ...classExList.slice(0, 18).map((ex) => {
          const tag = classifyExamGradeColumn(ex).toUpperCase();
          const shortTitle = (ex.title || 'Đề').slice(0, 26);
          return {
            header: `[${tag}] ${shortTitle}`,
            key: `ex_${ex.id}`,
            align: 'center',
            numFmt: '0.0',
            isScore10: true,
            width: 18,
          };
        }),
      ];

      await exportStyledWorkbook({
        filename: `bang-diem-vnEdu-SMAS-${classLabel.replace(/\s+/g, '-')}-${dateStr}.xlsx`,
        mascot: 'celebrate',
        sheets: [
          {
            name: 'Bảng điểm vnEdu - SMAS',
            mascot: 'celebrate',
            title: `BẢNG ĐIỂM TỔNG HỢP VNEDU / SMAS — ${classLabel.toUpperCase()}`,
            subtitle: `Chuẩn Thông tư 22 · Hệ số thực: ${bucketCounts.tx} đề TX (HS1) · ${bucketCounts.dgk} đề ĐGK (HS2) · ${bucketCounts.ckk} đề CKK (HS3)`,
            meta: [
              { label: 'Lớp', value: classLabel },
              { label: 'Sĩ số', value: `${data.students.length} học sinh` },
              { label: 'Quy đổi TB', value: 'Tự động tính bằng công thức Excel theo hệ số TX(1) · ĐGK(2) · CKK(3)' },
            ],
            statsStrip: ({ dataStartRow, dataEndRow }) => [
              { value: 'Giỏi (≥8.0):' },
              {
                value: { formula: `COUNTIF(I${dataStartRow}:I${dataEndRow},"Giỏi")`, result: enrichedStudents.filter((x) => x.grades.status === 'Giỏi').length },
                fill: 'FFDCFCE7',
                color: 'FF166534',
              },
              { value: 'Khá (6.5–7.9):' },
              {
                value: { formula: `COUNTIF(I${dataStartRow}:I${dataEndRow},"Khá")`, result: enrichedStudents.filter((x) => x.grades.status === 'Khá').length },
                fill: 'FFDBEAFE',
                color: 'FF1E40AF',
              },
              { value: 'Đạt (5.0–6.4):' },
              {
                value: { formula: `COUNTIF(I${dataStartRow}:I${dataEndRow},"Đạt")`, result: enrichedStudents.filter((x) => x.grades.status === 'Đạt').length },
                fill: 'FFFEF3C7',
                color: 'FF92400E',
              },
              { value: 'Chưa đạt (<5.0):' },
              {
                value: { formula: `COUNTIF(I${dataStartRow}:I${dataEndRow},"Chưa đạt")`, result: enrichedStudents.filter((x) => x.grades.status === 'Chưa đạt').length },
                fill: 'FFFEE2E2',
                color: 'FF991B1B',
              },
              { value: 'Chưa thi:' },
              {
                value: { formula: `COUNTIF(I${dataStartRow}:I${dataEndRow},"Chưa thi")`, result: enrichedStudents.filter((x) => x.grades.status === 'Chưa thi').length },
                fill: 'FFF1F5F9',
                color: 'FF64748B',
              },
            ],
            columns: [
              { header: 'STT', key: 'stt', align: 'center', width: 8 },
              { header: 'Họ và tên học sinh', key: 'name', align: 'left', width: 26 },
              { header: 'Email', key: 'email', align: 'left', width: 28 },
              { header: 'Lớp', key: 'clsName', align: 'center', width: 12 },
              { header: 'Điểm TX (HS1)', key: 'tx', align: 'center', numFmt: '0.0', isScore10: true, width: 14 },
              { header: 'Điểm ĐGK (HS2)', key: 'dgk', align: 'center', numFmt: '0.0', isScore10: true, width: 15 },
              { header: 'Điểm CKK (HS3)', key: 'ckk', align: 'center', numFmt: '0.0', isScore10: true, width: 15 },
              {
                header: 'Điểm TB',
                key: 'tbFormula',
                align: 'center',
                numFmt: '0.0',
                isScore10: true,
                width: 13,
                getValue: (row, _idx, excelRow) => ({
                  formula: `IF(AND(E${excelRow}="",F${excelRow}="",G${excelRow}=""),"",ROUND((IF(ISNUMBER(E${excelRow}),E${excelRow},0)+IF(ISNUMBER(F${excelRow}),F${excelRow}*2,0)+IF(ISNUMBER(G${excelRow}),G${excelRow}*3,0))/(IF(ISNUMBER(E${excelRow}),1,0)+IF(ISNUMBER(F${excelRow}),2,0)+IF(ISNUMBER(G${excelRow}),3,0)),1))`,
                  result: row.tb !== null ? row.tb : '',
                }),
              },
              {
                header: 'Đánh giá học lực',
                key: 'statusFormula',
                align: 'center',
                isScoreBand: true,
                width: 18,
                getValue: (row, _idx, excelRow) => ({
                  formula: `IF(H${excelRow}="","Chưa thi",IF(H${excelRow}>=8,"Giỏi",IF(H${excelRow}>=6.5,"Khá",IF(H${excelRow}>=5,"Đạt","Chưa đạt"))))`,
                  result: row.status,
                }),
              },
              { header: 'Số bài nộp', key: 'subCount', align: 'center', width: 12 },
              { header: 'Nhận xét sư phạm', key: 'note', align: 'left', width: 26 },
            ],
            rows: enrichedStudents.map(({ student: s, grades }, idx) => ({
              stt: idx + 1,
              name: s.name || 'Học sinh',
              email: s.email || '',
              clsName: classLabel,
              tx: grades.tx,
              dgk: grades.dgk,
              ckk: grades.ckk,
              tb: grades.tb,
              status: grades.status,
              subCount: grades.subCount,
              note: s.weakest ? `Cần ôn: ${s.weakest.topic}` : (grades.subCount > 0 ? 'Tiến độ ổn định' : 'Chưa phát sinh bài nộp'),
            })),
            summaryRow: {
              labelCol: 1,
              label: 'ĐIỂM TRUNG BÌNH TOÀN LỚP',
              cells: {
                tx: ({ dataStartRow, dataEndRow }) => ({ formula: `IFERROR(ROUND(AVERAGE(E${dataStartRow}:E${dataEndRow}),1),"")` }),
                dgk: ({ dataStartRow, dataEndRow }) => ({ formula: `IFERROR(ROUND(AVERAGE(F${dataStartRow}:F${dataEndRow}),1),"")` }),
                ckk: ({ dataStartRow, dataEndRow }) => ({ formula: `IFERROR(ROUND(AVERAGE(G${dataStartRow}:G${dataEndRow}),1),"")` }),
                tbFormula: ({ dataStartRow, dataEndRow }) => ({ formula: `IFERROR(ROUND(AVERAGE(H${dataStartRow}:H${dataEndRow}),1),"")` }),
                subCount: ({ dataStartRow, dataEndRow }) => ({ formula: `SUM(J${dataStartRow}:J${dataEndRow})` }),
              },
            },
          },
          ...(classExList.length > 0 ? [{
            name: 'Chi tiết theo Đề',
            mascot: 'happy',
            title: `CHI TIẾT ĐIỂM TỪNG BÀI KIỂM TRA — ${classLabel.toUpperCase()}`,
            subtitle: 'Thang điểm 10 cho từng đề đã giao (Cột trống = học sinh chưa nộp đề đó)',
            columns: examDetailCols,
            rows: data.students.map((s, idx) => {
              const rowObj = { stt: idx + 1, name: s.name || 'Học sinh', clsName: classLabel };
              classExList.slice(0, 18).forEach((ex) => {
                const sub = (s.subs || []).find((x) => x.examId === ex.id);
                rowObj[`ex_${ex.id}`] = sub
                  ? Math.round((Math.max(0, Number(sub.score) || 0) / Math.max(1, Number(sub.totalPoints) || 10)) * 100) / 10
                  : null;
              });
              return rowObj;
            }),
          }] : []),
        ],
      });
    } finally {
      setExportingExcel(false);
    }
  };

  const handleRetryLoad = () => {
    if (classId) feedCache.delete(classId);
    setReloadNonce((n) => n + 1);
  };

  if (loading || (feed.loading && !feed.exams.length)) {
    return (
      <div className="ta">
        <div className="ta-skeleton-grid" aria-busy="true" aria-label="Đang tải số liệu lớp">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="ta-skel-kpi" />)}
        </div>
        <div className="ta-skel-block" />
        <div className="ta-skel-block" />
      </div>
    );
  }

  if (feed.error) {
    return (
      <div className="ta">
        <div className="ta-state ta-state--error" role="alert">
          <b>Không tải được dữ liệu số liệu lớp</b>
          <p>{feed.error}</p>
          <button type="button" className="ta-btn primary" onClick={handleRetryLoad}>
            <IcoRefresh /> Thử lại ngay
          </button>
        </div>
      </div>
    );
  }

  if (!classes.length) {
    return (
      <div className="ta-state">
        <b>Chưa có lớp học nào</b>
        <p>Hãy tạo lớp ở mục “Lớp học” trước, sau đó gửi mã lớp cho học sinh tham gia.</p>
      </div>
    );
  }

  if (!data) {
    return <div className="ta-state">Đang chuẩn bị số liệu lớp…</div>;
  }

  const kpi = data.kpi;
  const cmpKpi = compareData?.kpi || null;
  const noData = kpi.submitted === 0;

  return (
    <section className="ta">
      <header className="ta-head">
        <div className="ta-head-brand">
          <div className="ta-head-mascot" aria-hidden="true">
            <ElecMascot mood="cool" size={44} />
          </div>
          <div className="ta-head-titles">
            <h2><ElecFlaskBrandSvg size={18} /> Số liệu &amp; Phổ điểm lớp</h2>
            <p>
              {fmtClassLabel(cls?.name)} · {kpi.students} HS chính thức
              {data.students.length > kpi.students ? ` (+${data.students.length - kpi.students} ngoài DS)` : ''} · {kpi.exams} đề
              {kpi.teachers > 1 ? ` của ${kpi.teachers} giáo viên` : ''} · {kpi.submitted} bài nộp
              {kpi.topics.length === 0 && ' · chưa có câu nào gắn chương'}
            </p>
          </div>
        </div>
        <div className="ta-head-controls">
          {classes.length > 1 && (
            <select
              className="ta-select"
              value={classId}
              aria-label="Chọn lớp học"
              onChange={(e) => { setClassId(e.target.value); setDrawerId(null); }}
            >
              {classes.map((c) => {
                const rawName = String(c.name || '').trim();
                const displayName = rawName.toLowerCase().startsWith('lớp') ? rawName : `Lớp ${rawName}`;
                return <option key={c.id} value={c.id}>{displayName}</option>;
              })}
            </select>
          )}
          {classes.length > 1 && (
            <button
              type="button"
              className={`ta-btn${compareMode ? ' active' : ''}`}
              onClick={() => setCompareMode((v) => !v)}
              title="So sánh trực tiếp 2 lớp học"
            >
              <IcoCompare /> {compareMode ? 'Đang so sánh 2 lớp' : 'So sánh 2 lớp'}
            </button>
          )}
          {compareMode && classes.length > 1 && (
            <select
              className="ta-select ta-select--compare"
              value={compareClassId}
              aria-label="Chọn lớp đối chiếu"
              onChange={(e) => setCompareClassId(e.target.value)}
            >
              {classes.filter((c) => c.id !== classId).map((c) => {
                const rawName = String(c.name || '').trim();
                const displayName = rawName.toLowerCase().startsWith('lớp') ? rawName : `Lớp ${rawName}`;
                return <option key={c.id} value={c.id}>Đối chiếu: {displayName}</option>;
              })}
            </select>
          )}
          {data.teachers.length > 1 && (
            <select
              className="ta-select"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              title="Chỉ xem bài của một giáo viên"
            >
              <option value="all">Tất cả giáo viên ({data.teachers.length})</option>
              {data.teachers.map((t) => (
                <option key={t.key} value={t.key}>{t.teacherName}{t.subject ? ` · ${t.subject}` : ''}</option>
              ))}
            </select>
          )}
          <div className="ta-ranges" role="tablist" aria-label="Khoảng thời gian">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={range === r.key}
                className={`ta-range${range === r.key ? ' active' : ''}`}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ta-btn ta-btn--excel-vnedu primary"
            disabled={exportingExcel}
            onClick={handleExportVnEdu}
            title="Xuất bảng điểm Excel (.xlsx) chuẩn vnEdu / SMAS có Mascot ELEC & công thức Thông tư 22"
          >
            <IcoDownload /> {exportingExcel ? 'Đang tạo Excel…' : 'Xuất Excel vnEdu (.xlsx)'}
          </button>
          <button
            type="button"
            className="ta-btn ta-btn--excel-detail"
            disabled={exportingExcel}
            onClick={handleExportExcel}
            title="Xuất báo cáo số liệu lớp đa sheet Excel (.xlsx) kèm biểu bảng & danh sách cần phụ đạo"
          >
            <IcoDownload /> {exportingExcel ? 'Đang xuất…' : 'Xuất Báo cáo (.xlsx)'}
          </button>
        </div>
      </header>

      {/* Bộ lọc khoảng ngày tuỳ chỉnh */}
      {range === 'custom' && (
        <div className="ta-date-bar">
          <label>
            <span>Từ ngày</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label>
            <span>Đến ngày</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          {(dateFrom || dateTo) && (
            <button type="button" className="ta-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Xóa lọc ngày
            </button>
          )}
        </div>
      )}

      {/* 4 THẺ KPI CHUẨN SƯ PHẠM BỘ GD&ĐT */}
      <div className="ta-kpis">
        <Kpi
          label="Điểm TB (Thang 10)"
          value={kpi.avgPct !== null ? (kpi.avgPct / 10).toFixed(1) : '—'}
          unit="/10"
          hint={`${kpi.submitted} bài đã nộp`}
          icon="trend"
          diff={cmpKpi && kpi.avgPct !== null && cmpKpi.avgPct !== null ? Number(((kpi.avgPct - cmpKpi.avgPct) / 10).toFixed(1)) : null}
        />
        <Kpi
          label="Tỷ lệ trên TB (≥5.0)"
          value={kpi.passRate}
          unit="%"
          hint={`${scoreDist.gioi + scoreDist.kha + scoreDist.tb} em đạt chuẩn`}
          icon="check"
          diff={cmpKpi && kpi.passRate !== null && cmpKpi.passRate !== null ? kpi.passRate - cmpKpi.passRate : null}
        />
        <Kpi
          label="Học lực Khá - Giỏi"
          value={scoreDist.pcts.gioi + scoreDist.pcts.kha}
          unit="%"
          hint={`${scoreDist.gioi + scoreDist.kha} học sinh (≥6.5 điểm)`}
          icon="award"
        />
        <Kpi
          label="Cần phụ đạo (<5.0)"
          value={scoreDist.yeu}
          unit=" em"
          hint={scoreDist.yeu > 0 ? `${scoreDist.pcts.yeu}% học sinh yếu` : 'Không có học sinh yếu'}
          icon="alert"
          tone={scoreDist.yeu > 0 ? 'bad' : undefined}
          onClick={() => { setStudentFilter('yeu'); setActiveTab('students'); }}
        />
        <Kpi
          label="Chưa nộp bài"
          value={kpi.noSub}
          unit=" em"
          hint="Cần đôn đốc nộp bài"
          icon="clock"
          tone={kpi.noSub > 0 ? 'mid' : undefined}
          onClick={() => { setStudentFilter('nosub'); setActiveTab('students'); }}
        />
      </div>

      {/* THANH PHỔ ĐIỂM 4 MỨC ĐỘ CHUẨN BỘ GD&ĐT */}
      <div className="ta-card" style={{ marginBottom: '1.1rem' }}>
        <div className="ta-card-head" style={{ marginBottom: '0.4rem' }}>
          <div>
            <h3>Phổ điểm lớp chuẩn Bộ GD&amp;ĐT (Thang điểm 10)</h3>
            <span className="ta-card-sub">Phân bố năng lực: Giỏi (8.0 - 10) · Khá (6.5 - 7.9) · Trung bình (5.0 - 6.4) · Yếu (&lt; 5.0)</span>
          </div>
        </div>

        <div className="ta-score-distribution">
          <div className="ta-score-bar-track">
            {scoreDist.pcts.gioi > 0 && (
              <div className="ta-score-seg gioi" style={{ width: `${scoreDist.pcts.gioi}%` }} title={`Giỏi: ${scoreDist.gioi} HS (${scoreDist.pcts.gioi}%)`}>
                {scoreDist.pcts.gioi >= 8 ? `${scoreDist.pcts.gioi}%` : ''}
              </div>
            )}
            {scoreDist.pcts.kha > 0 && (
              <div className="ta-score-seg kha" style={{ width: `${scoreDist.pcts.kha}%` }} title={`Khá: ${scoreDist.kha} HS (${scoreDist.pcts.kha}%)`}>
                {scoreDist.pcts.kha >= 8 ? `${scoreDist.pcts.kha}%` : ''}
              </div>
            )}
            {scoreDist.pcts.tb > 0 && (
              <div className="ta-score-seg tb" style={{ width: `${scoreDist.pcts.tb}%` }} title={`Trung bình: ${scoreDist.tb} HS (${scoreDist.pcts.tb}%)`}>
                {scoreDist.pcts.tb >= 8 ? `${scoreDist.pcts.tb}%` : ''}
              </div>
            )}
            {scoreDist.pcts.yeu > 0 && (
              <div className="ta-score-seg yeu" style={{ width: `${scoreDist.pcts.yeu}%` }} title={`Yếu / Cần phụ đạo: ${scoreDist.yeu} HS (${scoreDist.pcts.yeu}%)`}>
                {scoreDist.pcts.yeu >= 8 ? `${scoreDist.pcts.yeu}%` : ''}
              </div>
            )}
          </div>

          <div className="ta-score-cards">
            <div
              className={`ta-score-card ${studentFilter === 'gioi' ? 'is-active' : ''}`}
              onClick={() => { setStudentFilter(studentFilter === 'gioi' ? 'all' : 'gioi'); setActiveTab('students'); }}
              title="Bấm để lọc danh sách học sinh Giỏi"
            >
              <div className="ta-score-card-top">
                <span className="ta-score-dot gioi" />
                <span>Giỏi &amp; Xuất sắc (8 - 10)</span>
              </div>
              <span className="ta-score-card-val">{scoreDist.gioi} <small style={{ fontSize: '0.74rem', fontWeight: 500 }}>em</small></span>
              <span className="ta-score-card-pct">{scoreDist.pcts.gioi}% sĩ số</span>
            </div>

            <div
              className={`ta-score-card ${studentFilter === 'kha' ? 'is-active' : ''}`}
              onClick={() => { setStudentFilter(studentFilter === 'kha' ? 'all' : 'kha'); setActiveTab('students'); }}
              title="Bấm để lọc danh sách học sinh Khá"
            >
              <div className="ta-score-card-top">
                <span className="ta-score-dot kha" />
                <span>Khá (6.5 - 7.9)</span>
              </div>
              <span className="ta-score-card-val">{scoreDist.kha} <small style={{ fontSize: '0.74rem', fontWeight: 500 }}>em</small></span>
              <span className="ta-score-card-pct">{scoreDist.pcts.kha}% sĩ số</span>
            </div>

            <div
              className={`ta-score-card ${studentFilter === 'tb' ? 'is-active' : ''}`}
              onClick={() => { setStudentFilter(studentFilter === 'tb' ? 'all' : 'tb'); setActiveTab('students'); }}
              title="Bấm để lọc danh sách học sinh Trung bình"
            >
              <div className="ta-score-card-top">
                <span className="ta-score-dot tb" />
                <span>Trung bình (5 - 6.4)</span>
              </div>
              <span className="ta-score-card-val">{scoreDist.tb} <small style={{ fontSize: '0.74rem', fontWeight: 500 }}>em</small></span>
              <span className="ta-score-card-pct">{scoreDist.pcts.tb}% sĩ số</span>
            </div>

            <div
              className={`ta-score-card ${studentFilter === 'yeu' ? 'is-active' : ''}`}
              onClick={() => { setStudentFilter(studentFilter === 'yeu' ? 'all' : 'yeu'); setActiveTab('students'); }}
              title="Bấm để lọc danh sách học sinh Yếu cần kèm"
            >
              <div className="ta-score-card-top">
                <span className="ta-score-dot yeu" />
                <span>Yếu / Cần kèm (&lt;5)</span>
              </div>
              <span className="ta-score-card-val" style={{ color: scoreDist.yeu > 0 ? '#ef4444' : undefined }}>
                {scoreDist.yeu} <small style={{ fontSize: '0.74rem', fontWeight: 500 }}>em</small>
              </span>
              <span className="ta-score-card-pct">{scoreDist.pcts.yeu}% sĩ số</span>
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG SO SÁNH HAI LỚP (KHI BẬT SO SÁNH) */}
      {compareMode && compareCls && cmpKpi && (
        <div className="ta-card ta-compare-card">
          <div className="ta-card-head">
            <div>
              <h3>So sánh trực tiếp: {fmtClassLabel(cls?.name)} và {fmtClassLabel(compareCls.name)}</h3>
              <span className="ta-card-sub">Đối chiếu các chỉ số học tập trọng tâm trong cùng khoảng thời gian</span>
            </div>
          </div>
          <div className="ta-scroll">
            <table className="ta-compare-table">
              <thead>
                <tr>
                  <th>Chỉ số</th>
                  <th className="num">{fmtClassLabel(cls?.name)}</th>
                  <th className="num">{fmtClassLabel(compareCls.name)}</th>
                  <th className="num">Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Sĩ số học sinh', a: kpi.students, b: cmpKpi.students, unit: ' em' },
                  { label: 'Số đề đã giao', a: kpi.exams, b: cmpKpi.exams, unit: ' đề' },
                  { label: 'Tổng lượt bài nộp', a: kpi.submitted, b: cmpKpi.submitted, unit: ' bài' },
                  { label: 'Điểm trung bình', a: kpi.avgPct, b: cmpKpi.avgPct, unit: '%' },
                  { label: 'Tỷ lệ đạt (≥ 50%)', a: kpi.passRate, b: cmpKpi.passRate, unit: '%' },
                  { label: 'Chỉ số Mastery TB', a: kpi.masteryAvg, b: cmpKpi.masteryAvg, unit: '/100' },
                  { label: 'Học sinh cần kèm (Mastery < 40)', a: kpi.atRisk, b: cmpKpi.atRisk, unit: ' em', invert: true },
                ].map((row) => {
                  const hasBoth = row.a !== null && row.a !== undefined && row.b !== null && row.b !== undefined;
                  const diff = hasBoth ? row.a - row.b : null;
                  const goodDiff = diff === null || diff === 0 ? '' : (row.invert ? (diff < 0 ? 'tone-ex' : 'tone-bad') : (diff > 0 ? 'tone-ex' : 'tone-bad'));
                  return (
                    <tr key={row.label}>
                      <td><b>{row.label}</b></td>
                      <td className="num">{row.a === null || row.a === undefined ? '—' : `${row.a}${row.unit}`}</td>
                      <td className="num">{row.b === null || row.b === undefined ? '—' : `${row.b}${row.unit}`}</td>
                      <td className={`num ${goodDiff}`}>
                        {diff === null ? '—' : diff === 0 ? 'Ngang nhau' : `${diff > 0 ? '+' : ''}${diff}${row.unit}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* THANH CHUYỂN TAB GỌN GÀNG */}
      <div ref={studentsTabRef} className="ta-subtabs" role="tablist" aria-label="Chế độ xem số liệu lớp">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`ta-subtab${activeTab === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Biểu đồ &amp; Tổng quan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'students'}
          className={`ta-subtab${activeTab === 'students' ? ' active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Danh sách học sinh ({filteredStudents.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'heatmap'}
          className={`ta-subtab${activeTab === 'heatmap' ? ' active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          Bản đồ nhiệt &amp; Ma trận ({heatTopics.length} chương)
        </button>
      </div>

      {/* TAB 1: BIỂU ĐỒ & TỔNG QUAN (GỌN 2 CỘT) */}
      {activeTab === 'overview' && (
        <>
          <div className="ta-overview-grid">
            <div className="ta-card" style={{ marginBottom: 0 }}>
              <div className="ta-card-head">
                <div>
                  <h3>Xu hướng kết quả ({chartSource === 'exams' ? 'Theo đề' : 'Theo chương'})</h3>
                  <span className="ta-card-sub">Chuyển Cột / Đường để xem biến động điểm</span>
                </div>
                <div className="ta-chart-controls">
                  <div className="ta-ranges" role="group" aria-label="Nguồn dữ liệu biểu đồ">
                    <button
                      type="button"
                      className={`ta-range${chartSource === 'exams' ? ' active' : ''}`}
                      onClick={() => setChartSource('exams')}
                    >
                      Theo đề
                    </button>
                    <button
                      type="button"
                      className={`ta-range${chartSource === 'topics' ? ' active' : ''}`}
                      onClick={() => setChartSource('topics')}
                    >
                      Theo chương
                    </button>
                  </div>
                  <div className="ta-ranges" role="group" aria-label="Loại biểu đồ">
                    <button
                      type="button"
                      className={`ta-range${chartType === 'bar' ? ' active' : ''}`}
                      onClick={() => setChartType('bar')}
                      title="Biểu đồ cột"
                    >
                      <IcoBarChart /> Cột
                    </button>
                    <button
                      type="button"
                      className={`ta-range${chartType === 'line' ? ' active' : ''}`}
                      onClick={() => setChartType('line')}
                      title="Biểu đồ đường"
                    >
                      <IcoLineChart /> Đường
                    </button>
                  </div>
                </div>
              </div>
              <TrendChart
                series={chartSeries}
                compareSeries={compareChartSeries}
                chartType={chartType}
                primaryLabel={`Lớp ${cls?.name || ''}`}
                compareLabel={compareCls ? `Lớp ${compareCls.name}` : 'Lớp đối chiếu'}
              />
            </div>

            <div className="ta-card" style={{ marginBottom: 0 }}>
              <div className="ta-card-head">
                <div>
                  <h3>Câu hỏi hay sai nhất</h3>
                  <span className="ta-card-sub">Các câu tỉ lệ đúng thấp cần chữa trên lớp</span>
                </div>
                {onCreateRemedialExam && data.hardest.length > 0 && (
                  <button
                    type="button"
                    className="ta-btn primary"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => {
                      const weakTopics = [...new Set(data.hardest.map((q) => q.topic).filter(Boolean))].slice(0, 3);
                      onCreateRemedialExam({
                        classId,
                        subject: cls?.subject || exams.find((e) => e.classId === classId)?.subject || '',
                        title: `Ôn tập củng cố — Lớp ${cls?.name || ''}`,
                        topics: weakTopics.length ? weakTopics : ['Trọng tâm cần ôn tập'],
                        count: 10,
                        gradeType: 'tx',
                        hint: `Tập trung bù hổng kiến thức từ ${data.hardest.slice(0, 3).length} câu hỏi hay sai nhất lớp ${cls?.name || ''}.`,
                        remedialStudents: data.students.filter((s) => s.count > 0 && s.accuracy < 50).map((s) => s.name),
                      });
                    }}
                    title="Tạo ngay đề ôn tập 10 câu tập trung vào các chuyên đề học sinh hay sai nhất"
                  >
                    <ElecFlaskBrandSvg size={14} variant="white" /> Tạo đề ôn AI
                  </button>
                )}
              </div>
              {data.hardest.length === 0 ? (
                <p className="ta-note">Chưa có dữ liệu câu hỏi hay sai trong khoảng thời gian này.</p>
              ) : (
                <ul className="ta-hardest">
                  {data.hardest.slice(0, 4).map((q, idx) => (
                    <li key={q.key} className="ta-hard-item">
                      <div className="ta-hard-badge-wrap">
                        <span className={`ta-hard-rate tone-${rateTone(q.rate)}`}>
                          {q.rate}% đúng
                        </span>
                        <span className="ta-hard-rank">#{idx + 1}</span>
                      </div>
                      <div className="ta-hard-text">
                        <p className="ta-hard-q-title">{q.text.length > 110 ? `${q.text.slice(0, 110)}…` : q.text}</p>
                        <div className="ta-hard-meta">
                          <span className="ta-hard-exam-tag">{q.examTitle}</span>
                          {q.topic ? <span className="ta-hard-topic-tag">{q.topic}</span> : null}
                          <span className="ta-hard-stats">{q.ok}/{q.rated} em đúng</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {data.teachers.length > 0 && (
            <div className="ta-card" style={{ marginTop: '0.65rem' }}>
              <div className="ta-card-head">
                <h3>Giáo viên bộ môn trong lớp ({data.teachers.length})</h3>
                <span className="ta-card-sub">Bấm vào thẻ giáo viên để lọc riêng đề của giáo viên đó</span>
              </div>
              <div className="ta-teachers">
                {data.teachers.map((t) => {
                  const meta = masteryLabel(t.masteryAvg);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className={`ta-tcard${teacherFilter === t.key ? ' is-active' : ''}`}
                      onClick={() => setTeacherFilter(teacherFilter === t.key ? 'all' : t.key)}
                      title={t.examTitles.join(' · ') || t.teacherName}
                    >
                      <span className="ta-tcard-top">
                        <b>{t.teacherName}</b>
                        {t.subject ? <em>{t.subject}</em> : null}
                      </span>
                      <span className="ta-tcard-grid">
                        <span><small>Đề</small>{t.examCount}</span>
                        <span><small>Bài</small>{t.submissions}</span>
                        <span><small>TB</small>{t.pctAvg === null ? '—' : `${t.pctAvg}%`}</span>
                        <span><small>Mastery</small>{t.masteryAvg === null ? '—' : t.masteryAvg}</span>
                      </span>
                      <span className="ta-tcard-foot">
                        <span className="ta-tcard-track"><i style={{ width: `${t.coverage || 0}%` }} /></span>
                        <small>{t.students}/{kpi.students} em · {meta.label}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: DANH SÁCH HỌC SINH */}
      {activeTab === 'students' && (
        <div className="ta-card">
          <div className="ta-card-head">
            <div>
              <h3>
                Danh sách học sinh ({filteredStudents.length}/{data.students.length}
                {data.students.length > kpi.students ? ` · gồm ${kpi.students} thành viên + ${data.students.length - kpi.students} ngoài DS` : ''})
              </h3>
              <span className="ta-card-sub">Bấm vào học sinh để xem hồ sơ năng lực 5 thành phần</span>
            </div>
            <div className="ta-student-toolbar">
              {onCreateRemedialExam && scoreDist.yeu > 0 && (
                <button
                  type="button"
                  className="ta-btn primary"
                  onClick={() => {
                    const yeuStudents = data.students.filter((s) => s.count > 0 && s.accuracy < 50);
                    const weakTopics = [...new Set(yeuStudents.map((s) => s.weakest?.topic).filter(Boolean))].slice(0, 3);
                    onCreateRemedialExam({
                      classId,
                      subject: cls?.subject || exams.find((e) => e.classId === classId)?.subject || '',
                      title: `Phụ đạo củng cố (${yeuStudents.length} HS) — Lớp ${cls?.name || ''}`,
                      topics: weakTopics.length ? weakTopics : ['Kiến thức nền tảng trọng tâm'],
                      count: 10,
                      gradeType: 'tx',
                      hint: `Đề ôn dành riêng cho ${yeuStudents.length} học sinh dưới 5.0 của lớp ${cls?.name || ''}.`,
                      remedialStudents: yeuStudents.map((s) => s.name),
                    });
                  }}
                >
                  <ElecFlaskBrandSvg size={14} variant="white" /> Tạo đề phụ đạo AI ({scoreDist.yeu} HS)
                </button>
              )}
              <input
                type="search"
                className="ta-search-input"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Tìm tên hoặc email…"
                aria-label="Tìm học sinh"
              />
              <select
                className="ta-select"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                aria-label="Lọc nhóm học sinh"
              >
                <option value="all">Tất cả ({data.students.length})</option>
                <option value="gioi">Giỏi &amp; Xuất sắc ({scoreDist.gioi})</option>
                <option value="kha">Khá ({scoreDist.kha})</option>
                <option value="tb">Trung bình ({scoreDist.tb})</option>
                <option value="yeu">Yếu / Cần phụ đạo ({scoreDist.yeu})</option>
                <option value="nosub">Chưa nộp bài ({kpi.noSub})</option>
              </select>
              <select
                className="ta-select"
                value={studentSort}
                onChange={(e) => setStudentSort(e.target.value)}
                aria-label="Sắp xếp học sinh"
              >
                <option value="acc-desc">Điểm TB: Cao → Thấp</option>
                <option value="acc-asc">Điểm TB: Thấp → Cao (Ưu tiên HS yếu)</option>
                <option value="subs-desc">Số bài: Nhiều → Ít</option>
                <option value="name-asc">Họ tên: A → Z</option>
              </select>
              <div className="ta-ranges" role="group" aria-label="Chế độ xem học sinh">
                <button
                  type="button"
                  className={`ta-range${studentView === 'list' ? ' active' : ''}`}
                  onClick={() => setStudentView('list')}
                >
                  Bảng
                </button>
                <button
                  type="button"
                  className={`ta-range${studentView === 'grid' ? ' active' : ''}`}
                  onClick={() => setStudentView('grid')}
                >
                  Thẻ
                </button>
              </div>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="ta-state">
              <b>Không có học sinh nào khớp bộ lọc</b>
              <p>Thử xóa từ khóa tìm kiếm hoặc chuyển bộ lọc về “Tất cả”.</p>
            </div>
          ) : studentView === 'grid' ? (
            <div className="ta-student-grid">
              {filteredStudents.map((s) => (
                <article
                  key={s.id}
                  className="ta-student-card"
                  tabIndex={0}
                  role="button"
                  onClick={() => setDrawerId(s.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerId(s.id); } }}
                >
                  <div className="ta-student-card-head">
                    <b>{s.name}</b>
                    <span>{s.count} bài · TB {s.count ? `${s.accuracy}%` : '—'}</span>
                  </div>
                  <MasteryBar score={s.mastery} />
                  <div className="ta-student-card-meta">
                    <small>Chương yếu: <b>{s.weakest ? `${s.weakest.topic} (${s.weakest.rate}%)` : '—'}</b></small>
                    <div>
                      {s.flags.length === 0 ? (
                        <span className="ta-flag-ok">Ổn định</span>
                      ) : (
                        s.flags.map((f) => <span key={f.key} className={`ta-flag flag-${f.key}`}>{f.label}</span>)
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ta-scroll">
              <table className="ta-student-table">
                <thead>
                  <tr>
                    <th>Học sinh</th>
                    <th className="ta-num">Điểm TB (10)</th>
                    <th>Xếp loại học lực</th>
                    <th className="ta-num">Bài nộp</th>
                    <th>Chương cần ôn</th>
                    <th>Cảnh báo</th>
                    <th className="ta-num">Nộp gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const sc10 = s.count ? (s.accuracy / 10).toFixed(1) : '—';
                    const rankLabel = s.count === 0 ? 'Chưa nộp' : (s.accuracy >= 80 ? 'Giỏi' : s.accuracy >= 65 ? 'Khá' : s.accuracy >= 50 ? 'Trung bình' : 'Yếu / Cần kèm');
                    const rankTone = s.count === 0 ? 'na' : (s.accuracy >= 80 ? 'ex' : s.accuracy >= 65 ? 'good' : s.accuracy >= 50 ? 'mid' : 'bad');
                    return (
                      <tr key={s.id} tabIndex={0} onClick={() => setDrawerId(s.id)} onKeyDown={(e) => { if (e.key === 'Enter') setDrawerId(s.id); }}>
                        <td className="ta-strong">{s.name}</td>
                        <td className="ta-num" style={{ fontWeight: 800, fontSize: '0.94rem' }}>{sc10}</td>
                        <td>
                          <span className={`ta-rank-badge tone-${rankTone}`} style={{
                            padding: '2px 8px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 800,
                            background: rankTone === 'ex' ? '#dcfce7' : rankTone === 'good' ? '#dbeafe' : rankTone === 'mid' ? '#fef3c7' : rankTone === 'bad' ? '#fee2e2' : '#f3f4f6',
                            color: rankTone === 'ex' ? '#15803d' : rankTone === 'good' ? '#1d4ed8' : rankTone === 'mid' ? '#b45309' : rankTone === 'bad' ? '#b91c1c' : '#4b5563',
                          }}>
                            {rankLabel}
                          </span>
                        </td>
                        <td className="ta-num">{s.count}</td>
                        <td>{s.weakest ? `${s.weakest.topic} (${s.weakest.rate}%)` : '—'}</td>
                        <td>
                          {s.flags.length === 0 ? <span className="ta-flag-ok">Ổn định</span> : s.flags.map((f) => (
                            <span key={f.key} className={`ta-flag flag-${f.key}`}>{f.label}</span>
                          ))}
                        </td>
                        <td className="ta-num">{fmtDate(s.lastAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BẢN ĐỒ NHIỆT & MA TRẬN */}
      {activeTab === 'heatmap' && (
        <>
          <div className="ta-card">
            <div className="ta-card-head">
              <h3>Heatmap học sinh theo chương</h3>
              <div className="ta-legend">
                <span><i className="ta-dot ex" />≥80%</span>
                <span><i className="ta-dot good" />60–79%</span>
                <span><i className="ta-dot mid" />40–59%</span>
                <span><i className="ta-dot bad" />&lt;40%</span>
                <span><i className="ta-dot na" />chưa có</span>
              </div>
            </div>

            {heatTopics.length === 0 ? (
              <p className="ta-note">
                Chưa có câu hỏi nào được gắn chương. Mở đề → sửa câu hỏi → chọn “Chương” để bật heatmap.
              </p>
            ) : (
              <div className="ta-scroll">
                <table className="ta-heat-table">
                  <thead>
                    <tr>
                      <th className="ta-sticky">Học sinh</th>
                      {heatTopics.map((t) => (
                        <th key={t.topic} title={`${t.topic} — ${t.rate}% đúng (${t.rated} câu)`}>
                          {t.topic}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.filter((s) => s.subs.length).map((s) => (
                      <tr key={s.id}>
                        <th className="ta-sticky">
                          <button type="button" className="ta-name-btn" onClick={() => setDrawerId(s.id)}>
                            {s.name}
                          </button>
                        </th>
                        {heatTopics.map((t) => {
                          const hit = s.topics.find((x) => x.topic === t.topic);
                          return <HeatCell key={t.topic} rate={hit ? hit.rate : null} />;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data.teachers.length > 1 && (
            <div className="ta-card">
              <div className="ta-card-head">
                <h3>Ma trận học sinh × Giáo viên bộ môn</h3>
                <span className="ta-card-sub">Số bài · % trung bình theo từng giáo viên</span>
              </div>
              <div className="ta-scroll">
                <table className="ta-matrix">
                  <thead>
                    <tr>
                      <th className="ta-sticky">Học sinh</th>
                      {data.teachers.map((t) => (
                        <th key={t.key} title={t.subject || t.teacherName}>{t.teacherName}</th>
                      ))}
                      <th className="ta-num">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.matrix.map((row) => (
                      <tr key={row.studentId}>
                        <th className="ta-sticky">
                          <button type="button" className="ta-name-btn" onClick={() => setDrawerId(row.studentId)}>
                            {row.studentName}
                          </button>
                        </th>
                        {row.cells.map((c, i) => (
                          <td
                            key={data.teachers[i].key}
                            className={`ta-cell ta-heat-${rateTone(c ? c.pct : null)}`}
                            title={c ? `${c.count} bài · ${c.pct}%` : 'chưa làm'}
                          >
                            {c ? <><b>{c.count}</b><small>{c.pct}%</small></> : '–'}
                          </td>
                        ))}
                        <td className="ta-num">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {drawerStudent && <StudentDrawer student={drawerStudent} onClose={() => setDrawerId(null)} />}
    </section>
  );
}
