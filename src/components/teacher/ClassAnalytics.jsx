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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildClassAnalytics, masteryLabel, rateTone, MASTERY_PARTS } from '../../lib/teacherAnalytics.js';
import { getExamsByClass, getSubmissionsByExam } from '../../lib/classroom.js';
import { downloadCsv } from '../DashShell.jsx';
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

function Kpi({ label, value, unit, hint, tone, diff }) {
  return (
    <div className={`ta-kpi${tone ? ` is-${tone}` : ''}`}>
      <span className="ta-kpi-label">{label}</span>
      <span className="ta-kpi-value">
        {value === null || value === undefined ? '—' : value}
        {unit && value !== null && value !== undefined ? <small>{unit}</small> : null}
      </span>
      <span className="ta-kpi-hint">
        {hint}
        {diff !== undefined && diff !== null && (
          <strong className={`ta-kpi-diff ${diff >= 0 ? 'up' : 'down'}`}>
            {' '}({diff >= 0 ? `+${diff}` : diff}{unit || ''})
          </strong>
        )}
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
  const H = 168;
  const padL = 34;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = series.length;
  const stepX = n > 1 ? innerW / (n - 1) : innerW / 2;

  const yOf = (val) => padT + innerH - (Math.max(0, Math.min(100, val || 0)) / 100) * innerH;

  return (
    <div className="ta-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="ta-chart-svg" role="img" aria-label="Biểu đồ xu hướng điểm trung bình">
        {/* Đường lưới ngang */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" strokeOpacity="0.09" strokeDasharray="3 3" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.55">
                {v}%
              </text>
            </g>
          );
        })}

        {chartType === 'bar' ? (
          series.map((pt, i) => {
            const groupW = Math.min(54, innerW / Math.max(n, 1) - 10);
            const hasCmp = compareSeries.length > 0 && compareSeries[i]?.value !== null && compareSeries[i]?.value !== undefined;
            const barW = hasCmp ? Math.max(10, groupW / 2 - 2) : Math.max(14, groupW);
            const cx = n === 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW;
            const y = yOf(pt.value);
            const h = Math.max(3, padT + innerH - y);
            const cmpVal = hasCmp ? compareSeries[i].value : null;
            const cmpY = cmpVal !== null ? yOf(cmpVal) : 0;
            const cmpH = cmpVal !== null ? Math.max(3, padT + innerH - cmpY) : 0;

            return (
              <g key={pt.key || i}>
                <rect
                  x={hasCmp ? cx - barW - 1 : cx - barW / 2}
                  y={y}
                  width={barW}
                  height={h}
                  rx="5"
                  fill="#2563eb"
                >
                  <title>{`${pt.label} (${primaryLabel}): ${pt.value}% (${pt.subCount || 0} bài)`}</title>
                </rect>
                <text
                  x={hasCmp ? cx - barW / 2 - 1 : cx}
                  y={Math.max(12, y - 5)}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#2563eb"
                >
                  {pt.value}%
                </text>
                {hasCmp && (
                  <>
                    <rect
                      x={cx + 1}
                      y={cmpY}
                      width={barW}
                      height={cmpH}
                      rx="5"
                      fill="#0f9d76"
                      opacity="0.85"
                    >
                      <title>{`${compareSeries[i].label || pt.label} (${compareLabel}): ${cmpVal}%`}</title>
                    </rect>
                    <text
                      x={cx + barW / 2 + 1}
                      y={Math.max(12, cmpY - 5)}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#0f9d76"
                    >
                      {cmpVal}%
                    </text>
                  </>
                )}
                <text
                  x={cx}
                  y={H - 14}
                  textAnchor="middle"
                  fontSize="10.5"
                  fill="currentColor"
                  opacity="0.75"
                >
                  {pt.shortLabel || pt.label.slice(0, 14)}
                </text>
              </g>
            );
          })
        ) : (
          <>
            {/* Đường chính */}
            {series.length > 1 && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={series.map((pt, i) => `${n === 1 ? padL + innerW / 2 : padL + i * stepX},${yOf(pt.value)}`).join(' ')}
              />
            )}
            {/* Đường so sánh */}
            {compareSeries.length > 1 && (
              <polyline
                fill="none"
                stroke="#0f9d76"
                strokeWidth="2.2"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={compareSeries.map((pt, i) => `${compareSeries.length === 1 ? padL + innerW / 2 : padL + (i / (Math.max(n, compareSeries.length) - 1)) * innerW},${yOf(pt.value || 0)}`).join(' ')}
              />
            )}
            {series.map((pt, i) => {
              const cx = n === 1 ? padL + innerW / 2 : padL + i * stepX;
              const cy = yOf(pt.value);
              return (
                <g key={pt.key || i}>
                  <circle cx={cx} cy={cy} r="4.5" fill="#2563eb" stroke="#fff" strokeWidth="1.5">
                    <title>{`${pt.label}: ${pt.value}%`}</title>
                  </circle>
                  <text x={cx} y={Math.max(12, cy - 8)} textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563eb">
                    {pt.value}%
                  </text>
                  <text x={cx} y={H - 14} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.75">
                    {pt.shortLabel || pt.label.slice(0, 14)}
                  </text>
                </g>
              );
            })}
            {compareSeries.map((pt, i) => {
              if (pt?.value === null || pt?.value === undefined) return null;
              const cx = compareSeries.length === 1 ? padL + innerW / 2 : padL + (i / (Math.max(n, compareSeries.length) - 1)) * innerW;
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
            {[...student.subs].slice(-5).reverse().map((s) => (
              <li key={`${s.examId}-${s.id || s.studentId}`}>
                <span>{s.examTitle || 'Đề'}</span>
                <b>{Math.round((Number(s.score) / (Number(s.totalPoints) || 1)) * 100)}%</b>
                <small>{fmtDate(toMs(s.submittedAt))}</small>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

export default function ClassAnalytics({ classes = [], exams = [], submissionsMap = {}, loading = false }) {
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

  const feedExams = feed.exams.length ? feed.exams : exams.filter((e) => e.classId === classId);
  const feedSubs = feed.exams.length ? feed.submissionsMap : submissionsMap;

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

  /* Lọc và sắp xếp danh sách học sinh */
  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const q = studentQuery.trim().toLowerCase();
    let list = data.students.filter((s) => {
      if (q && !`${s.name || ''} ${s.email || ''}`.toLowerCase().includes(q)) return false;
      if (studentFilter === 'risk') return (s.mastery !== null && s.mastery < 40) || s.flags.length > 0;
      if (studentFilter === 'nosub') return s.count === 0;
      if (studentFilter === 'good') return s.mastery !== null && s.mastery >= 75;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (studentSort === 'mastery-desc') return (b.mastery ?? -1) - (a.mastery ?? -1);
      if (studentSort === 'acc-desc') return (b.accuracy ?? -1) - (a.accuracy ?? -1);
      if (studentSort === 'subs-desc') return (b.count || 0) - (a.count || 0);
      return (a.mastery ?? 999) - (b.mastery ?? 999);
    });
    return list;
  }, [data, studentQuery, studentFilter, studentSort]);

  /* Xuất CSV số liệu lớp */
  const handleExportCsv = () => {
    if (!data || !cls) return;
    const rows = [
      ['Lớp', 'Học sinh', 'Email', 'Số bài nộp', 'Điểm TB (%)', 'Mastery (/100)', 'Xếp loại Mastery', 'Chương yếu nhất', 'Tỉ lệ chương yếu (%)', 'Cờ cảnh báo', 'Nộp gần nhất'],
    ];
    data.students.forEach((s) => {
      const meta = masteryLabel(s.mastery);
      rows.push([
        cls.name,
        s.name || 'Học sinh',
        s.email || '',
        s.count || 0,
        s.count ? `${s.accuracy}%` : '—',
        s.mastery === null ? '—' : s.mastery,
        meta.label,
        s.weakest ? s.weakest.topic : '—',
        s.weakest ? `${s.weakest.rate}%` : '—',
        s.flags.length ? s.flags.map((f) => f.label).join('; ') : 'Ổn',
        s.lastAt ? new Date(s.lastAt).toLocaleString('vi-VN') : '—',
      ]);
    });
    downloadCsv(`so-lieu-lop-${(cls.name || 'lop').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
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
        <div className="ta-head-titles">
          <h2>Số liệu lớp</h2>
          <p>
            {cls?.name} · {kpi.students} học sinh · {kpi.exams} đề
            {kpi.teachers > 1 ? ` của ${kpi.teachers} giáo viên` : ''} · {kpi.submitted} bài nộp
            {kpi.topics.length === 0 && ' · chưa có câu nào gắn chương'}
          </p>
        </div>
        <div className="ta-head-controls">
          {classes.length > 1 && (
            <select
              className="ta-select"
              value={classId}
              aria-label="Chọn lớp học"
              onChange={(e) => { setClassId(e.target.value); setDrawerId(null); }}
            >
              {classes.map((c) => <option key={c.id} value={c.id}>Lớp {c.name}</option>)}
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
              {classes.filter((c) => c.id !== classId).map((c) => (
                <option key={c.id} value={c.id}>Đối chiếu: Lớp {c.name}</option>
              ))}
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
            className="ta-btn primary"
            onClick={handleExportCsv}
            title="Xuất bảng số liệu lớp ra file CSV (Excel)"
          >
            <IcoDownload /> Xuất CSV
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

      <div className="ta-kpis">
        <Kpi
          label="Điểm TB lớp"
          value={kpi.avgPct}
          unit="%"
          hint={`${kpi.submitted} bài nộp`}
          diff={cmpKpi && kpi.avgPct !== null && cmpKpi.avgPct !== null ? kpi.avgPct - cmpKpi.avgPct : null}
        />
        <Kpi
          label="Tỷ lệ đạt"
          value={kpi.passRate}
          unit="%"
          hint="từ 50% trở lên"
          diff={cmpKpi && kpi.passRate !== null && cmpKpi.passRate !== null ? kpi.passRate - cmpKpi.passRate : null}
        />
        <Kpi
          label="Mastery TB"
          value={kpi.masteryAvg}
          unit="/100"
          hint={`${kpi.dataCoverage}% em đủ dữ liệu`}
          diff={cmpKpi && kpi.masteryAvg !== null && cmpKpi.masteryAvg !== null ? kpi.masteryAvg - cmpKpi.masteryAvg : null}
        />
        <Kpi
          label="Cần chú ý"
          value={kpi.atRisk}
          unit=" em"
          hint="Mastery dưới 40"
          tone={kpi.atRisk ? 'bad' : undefined}
        />
        <Kpi
          label="Chưa nộp"
          value={kpi.noSub}
          unit=" em"
          hint="trong khoảng đang xem"
          tone={kpi.noSub ? 'mid' : undefined}
        />
      </div>

      {/* BẢNG SO SÁNH HAI LỚP (KHI BẬT SO SÁNH) */}
      {compareMode && compareCls && cmpKpi && (
        <div className="ta-card ta-compare-card">
          <div className="ta-card-head">
            <div>
              <h3>So sánh trực tiếp: Lớp {cls?.name} và Lớp {compareCls.name}</h3>
              <span className="ta-card-sub">Đối chiếu các chỉ số học tập trọng tâm trong cùng khoảng thời gian</span>
            </div>
          </div>
          <div className="ta-scroll">
            <table className="ta-compare-table">
              <thead>
                <tr>
                  <th>Chỉ số</th>
                  <th className="num">Lớp {cls?.name}</th>
                  <th className="num">Lớp {compareCls.name}</th>
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
      <div className="ta-subtabs" role="tablist" aria-label="Chế độ xem số liệu lớp">
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
              </div>
              {data.hardest.length === 0 ? (
                <p className="ta-note">Chưa có dữ liệu câu hỏi hay sai trong khoảng thời gian này.</p>
              ) : (
                <ul className="ta-hardest">
                  {data.hardest.slice(0, 4).map((q) => (
                    <li key={q.key}>
                      <span className={`ta-hard-rate tone-${rateTone(q.rate)}`}>{q.rate}%</span>
                      <span className="ta-hard-text">
                        {q.text.length > 95 ? `${q.text.slice(0, 95)}…` : q.text}
                        <small>{q.examTitle}{q.topic ? ` · ${q.topic}` : ''} · {q.ok}/{q.rated} đúng</small>
                      </span>
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
              <h3>Danh sách học sinh ({filteredStudents.length}/{data.students.length})</h3>
              <span className="ta-card-sub">Bấm vào học sinh để xem hồ sơ năng lực 5 thành phần</span>
            </div>
            <div className="ta-student-toolbar">
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
                <option value="risk">Cần chú ý ({kpi.atRisk})</option>
                <option value="nosub">Chưa nộp ({kpi.noSub})</option>
                <option value="good">Đạt tốt (≥75)</option>
              </select>
              <select
                className="ta-select"
                value={studentSort}
                onChange={(e) => setStudentSort(e.target.value)}
                aria-label="Sắp xếp học sinh"
              >
                <option value="mastery-asc">Mastery: Thấp → Cao</option>
                <option value="mastery-desc">Mastery: Cao → Thấp</option>
                <option value="acc-desc">Điểm TB: Cao → Thấp</option>
                <option value="subs-desc">Số bài: Nhiều → Ít</option>
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
                    <th>Mastery</th>
                    <th className="ta-num">Bài</th>
                    <th className="ta-num">TB</th>
                    <th>Chương yếu nhất</th>
                    <th>Cờ</th>
                    <th className="ta-num">Nộp gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} tabIndex={0} onClick={() => setDrawerId(s.id)} onKeyDown={(e) => { if (e.key === 'Enter') setDrawerId(s.id); }}>
                      <td className="ta-strong">{s.name}</td>
                      <td><MasteryBar score={s.mastery} /></td>
                      <td className="ta-num">{s.count}</td>
                      <td className="ta-num">{s.count ? `${s.accuracy}%` : '—'}</td>
                      <td>{s.weakest ? `${s.weakest.topic} · ${s.weakest.rate}%` : '—'}</td>
                      <td>
                        {s.flags.length === 0 ? <span className="ta-flag-ok">ổn</span> : s.flags.map((f) => (
                          <span key={f.key} className={`ta-flag flag-${f.key}`}>{f.label}</span>
                        ))}
                      </td>
                      <td className="ta-num">{fmtDate(s.lastAt)}</td>
                    </tr>
                  ))}
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
