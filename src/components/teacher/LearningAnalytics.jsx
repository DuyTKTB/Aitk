/* ============================================================
   LearningAnalytics.jsx — AI LEARNING ANALYTICS
   TRUNG TÂM PHÂN TÍCH HỌC TẬP BẰNG AI (giáo viên chủ nhiệm)
   ------------------------------------------------------------
   4 khu vực:
     1. Tổng quan lớp học (KPI lấy từ dữ liệu thật)
     2. Hoạt động giáo viên bộ môn (bảng + tìm kiếm + bộ lọc + chi tiết)
     3. Biểu đồ phân tích (chỉ vẽ khi đủ dữ liệu hợp lệ)
     4. Báo cáo AI + EARLY WARNING + báo cáo riêng theo môn

   Số liệu: 100% từ learningAnalytics.js (tính bằng code).
   AI: chỉ diễn giải trên số liệu đó (learningAnalyticsAi.js).
   Không có dữ liệu → hiển thị trạng thái trống, không bịa số.
   ============================================================ */

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  buildTeacherActivity, listClassTeachers, getTeacherAccountStatus,
  listClassAudit, logTeacherEvent, AUDIT_LABEL, toMs,
} from '../../lib/classTeachers.js';
import {
  buildLearningAnalytics, resolveRange, RANGE_OPTIONS, fmtDay,
  BANDS, bandLabel, resolveBands,
} from '../../lib/learningAnalytics.js';
import { updateClass } from '../../lib/classroom.js';
import { generateLearningReport } from '../../lib/learningAnalyticsAi.js';
import {
  saveAnalyticsReport, getAnalyticsReport, savedReportStaleness,
} from '../../lib/analyticsReports.js';
import { Donut, TrendChart } from '../DashShell.jsx';
import { BarChart, HBarChart, StatValue } from './analyticsCharts.jsx';
import '../../styles/learning-analytics.css';

/* ---------- tiện ích ---------- */

const PRIORITY = {
  high: { label: 'Ưu tiên cao', tone: 'high' },
  medium: { label: 'Trung bình', tone: 'mid' },
  low: { label: 'Theo dõi', tone: 'low' },
};

/* Màu badge cho 4 mức xếp loại (dùng lại bảng màu la-badge sẵn có) */
const BAND_TONE = { gioi: 'ex', kha: 'low', tb: 'mid', yeu: 'bad' };

const pad2 = (n) => String(n).padStart(2, '0');

const dateInputToMs = (v, endOfDay = false) => {
  if (!v) return 0;
  const d = new Date(`${v}T${endOfDay ? '23:59:59' : '00:00:00'}`);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
};

const fmtDateTime = (ms) => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const timeAgo = (ms) => {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  if (diff < 60000) return 'vừa xong';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return fmtDay(ms);
};

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/* ---------- khối trình bày nhỏ ---------- */

function Section({ id, title, sub, actions, children }) {
  return (
    <section className="la-section" id={id}>
      <header className="la-section-head">
        <div>
          <h3>{title}</h3>
          {sub && <p className="la-sub">{sub}</p>}
        </div>
        {actions && <div className="la-section-actions">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="la-empty">{children}</p>;
}

function Badge({ tone = 'na', children }) {
  return <span className={`la-badge tone-${tone}`}>{children}</span>;
}

/* ============================================================
   COMPONENT CHÍNH
   ============================================================ */

export default function LearningAnalytics({
  classInfo = {}, exams = [], submissionsMap = {}, loadingSubmissions = false,
}) {
  const classId = classInfo?.id || '';
  const members = classInfo?.members || [];
  const ownerId = classInfo?.teacherId || '';

  const [rangeKey, setRangeKey] = useState('30');
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState(todayInput());
  const [showCustom, setShowCustom] = useState(false);

  const [teachers, setTeachers] = useState([]);
  const [accounts, setAccounts] = useState({});
  const [audit, setAudit] = useState([]);
  const [metaState, setMetaState] = useState({ loading: true, error: '' });

  const [focusSubject, setFocusSubject] = useState('');
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [openTeacher, setOpenTeacher] = useState('');
  const [warnFilter, setWarnFilter] = useState('all');

  const [saved, setSaved] = useState(null);
  const [savedLoading, setSavedLoading] = useState(false);
  const [live, setLive] = useState(null);
  const [gen, setGen] = useState({ status: 'idle', error: '', engine: '' });
  const abortRef = useRef(null);

  /* ---------- tải giáo viên bộ môn + trạng thái tài khoản + nhật ký ---------- */
  const loadMeta = useCallback(async () => {
    if (!classId) return;
    setMetaState({ loading: true, error: '' });
    try {
      const list = await listClassTeachers(classId);
      setTeachers(list);

      const [acc, log] = await Promise.all([
        getTeacherAccountStatus(list.map((t) => t.teacherId)),
        listClassAudit(classId, 30),
      ]);
      setAccounts(acc || {});
      setAudit(log || []);
      setMetaState({ loading: false, error: '' });
    } catch (e) {
      setMetaState({ loading: false, error: e?.message || 'Không tải được danh sách giáo viên bộ môn.' });
    }
  }, [classId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  /* ---------- khoảng thời gian ---------- */
  const range = useMemo(() => resolveRange(rangeKey, {
    from: dateInputToMs(fromInput),
    to: dateInputToMs(toInput, true),
  }), [rangeKey, fromInput, toInput]);

  const rangeInvalid = Boolean(range.invalid);

  /* ---------- ngưỡng xếp loại riêng của lớp ---------- */
  const [bands, setBands] = useState(() => resolveBands(classInfo?.bandThresholds));
  const [bandDraft, setBandDraft] = useState(() => resolveBands(classInfo?.bandThresholds));
  const [savingBands, setSavingBands] = useState(false);
  const [bandMsg, setBandMsg] = useState('');

  const saveBands = async () => {
    const next = resolveBands(bandDraft);
    setSavingBands(true);
    setBandMsg('');
    try {
      await updateClass(classId, { bandThresholds: next });
      setBands(next);
      setBandDraft(next);
      setBandMsg('Đã lưu — áp dụng cho cả trang của học sinh.');
    } catch (e) {
      setBandMsg(`Không lưu được: ${e?.message || e}`);
    } finally {
      setSavingBands(false);
    }
  };

  /* ---------- xuất bảng điểm/xếp loại theo môn ---------- */
  const exportCsv = () => {
    const head = [
      'Môn', 'Học sinh', 'Email', 'Bài đã làm', 'Số đề của môn',
      'Điểm TB (%)', 'Cao nhất (%)', 'Thấp nhất (%)', 'Xếp loại',
    ];
    const lines = [head];
    (subjects || []).forEach((s) => {
      const rows = [...((analytics.subjectDetails?.[s.subject]?.students) || [])]
        .sort((a, b) => {
          if (a.avgPct === null) return 1;
          if (b.avgPct === null) return -1;
          return b.avgPct - a.avgPct;
        });
      if (!rows.length) {
        lines.push([s.subject, '(chưa có học sinh)', '', '', s.exams, '', '', '', '']);
        return;
      }
      rows.forEach((st) => lines.push([
        s.subject,
        st.name,
        st.email || '',
        st.attempts,
        st.expected,
        st.avgPct ?? '',
        st.bestPct ?? '',
        st.worstPct ?? '',
        st.band ? bandLabel(st.band) : 'Chưa đủ dữ liệu',
      ]));
    });

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + lines.map((r) => r.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    const safeName = String(classInfo?.name || classId || 'lop').replace(/[^\p{L}\p{N}]+/gu, '-');
    a.href = url;
    a.download = `xep-loai-theo-mon-${safeName}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* ---------- hoạt động giáo viên (số liệu) ---------- */
  const teacherRows = useMemo(() => {
    const nowMs = Date.now();
    return buildTeacherActivity({
      classId,
      exams,
      submissionsMap,
      linkedTeachers: teachers,
      rangeDays: range.key === 'all' ? 'all' : (range.days ? String(range.days) : 'all'),
      // Khoảng tương đối luôn tính tới hiện tại; khoảng tuỳ chọn tôn trọng mốc kết thúc.
      rangeTo: range.key === 'custom' ? range.to : 0,
      students: members.length,
      accountStatus: accounts,
      now: nowMs,
      ownerId: ownerId || '',
      ownerName: classInfo?.teacherName || '',
      ownerSubject: classInfo?.subject || '',
    }).rows;
  }, [classId, exams, submissionsMap, teachers, accounts, range.key, range.days, range.to, members.length, ownerId, classInfo?.teacherName, classInfo?.subject]);

  /* ---------- phân tích tổng hợp ---------- */
  const analytics = useMemo(() => {
    const nowMs = Date.now();
    const effRange = range.key === 'custom' ? range : { ...range, to: nowMs };
    return buildLearningAnalytics({
      classInfo,
      exams,
      submissionsMap,
      teachers,
      teacherRows,
      range: effRange,
      now: nowMs,
      bandThresholds: bands,
    });
  }, [classInfo, exams, submissionsMap, teachers, teacherRows, range, bands]);

  const { overview, subjects, timeline, distribution, topics, students, warnings, dataQuality } = analytics;

  /* ---------- bảng giáo viên đã lọc ---------- */
  const filteredTeachers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teacherRows.filter((r) => {
      if (subjectFilter !== 'all' && (r.subject || '') !== subjectFilter) return false;
      if (!q) return true;
      return `${r.teacherName} ${r.email} ${r.subject}`.toLowerCase().includes(q);
    });
  }, [teacherRows, query, subjectFilter]);

  /* ---------- cảnh báo đã lọc ---------- */
  const filteredWarnings = useMemo(() => (
    warnFilter === 'all' ? warnings : warnings.filter((w) => w.priority === warnFilter)
  ), [warnings, warnFilter]);

  const warningCounts = useMemo(() => ({
    all: warnings.length,
    high: warnings.filter((w) => w.priority === 'high').length,
    medium: warnings.filter((w) => w.priority === 'medium').length,
    low: warnings.filter((w) => w.priority === 'low').length,
  }), [warnings]);

  /* ---------- báo cáo đã lưu ---------- */
  const loadSaved = useCallback(async () => {
    if (!classId || rangeInvalid) { setSaved(null); return; }
    setSavedLoading(true);
    try {
      const doc = await getAnalyticsReport({ classId, range, focusSubject });
      setSaved(doc || null);
    } catch {
      setSaved(null);
    } finally {
      setSavedLoading(false);
    }
  }, [classId, range.key, range.from, range.to, focusSubject, rangeInvalid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadSaved(); }, [loadSaved]);

  /* Đổi phạm vi phân tích → bỏ báo cáo vừa tạo của phạm vi cũ để tránh
     hiểu nhầm số liệu của khoảng/môn khác. */
  useEffect(() => {
    setLive(null);
    setGen({ status: 'idle', error: '', engine: '' });
  }, [range.key, range.from, range.to, focusSubject]);

  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  /* ---------- tạo báo cáo ---------- */
  const canGenerate = overview.submissions > 0 && !rangeInvalid && gen.status !== 'generating';

  const generate = async () => {
    if (!canGenerate) return;
    setGen({ status: 'generating', error: '', engine: '' });
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const result = await generateLearningReport({
        analytics,
        focusSubject,
        signal: ctrl.signal,
      });

      setLive(result);

      /* Lưu báo cáo — lỗi lưu không được làm mất nội dung vừa tạo */
      try {
        const savedInfo = await saveAnalyticsReport({
          classId,
          range,
          focusSubject,
          result,
          analytics,
          userId: ownerId,
          userName: classInfo?.teacherName || '',
        });
        setSaved({
          id: savedInfo.id,
          classId,
          rangeKey: range.key,
          rangeLabel: range.label,
          focusSubject,
          dataFingerprint: analytics.meta.fingerprint,
          engine: result.engine,
          version: savedInfo.version,
          report: result.report,
          metrics: {
            submissions: overview.submissions,
            exams: overview.exams,
            students: overview.students,
            avgPct: overview.avgPct,
          },
          generatedAtMs: Date.now(),
          generatedAt: { seconds: Math.floor(Date.now() / 1000) },
        });
      } catch (e) {
        setGen({
          status: 'done',
          engine: result.engine,
          error: `Đã tạo báo cáo nhưng chưa lưu được vào Firestore: ${e?.message || e}`,
        });
      }

      if (!result.error) {
        setGen({ status: 'done', engine: result.engine, error: '' });
      } else {
        /* AI lỗi → vẫn có báo cáo bằng luật, nhưng nói rõ lý do */
        setGen({ status: 'done', engine: result.engine, error: result.error });
      }

      await logTeacherEvent({
        classId,
        action: 'report_generate',
        actorId: ownerId,
        actorName: classInfo?.teacherName || '',
        subject: focusSubject || '',
        detail: `${result.engine === 'ai' ? 'AI' : 'Thống kê'} · ${range.label} · ${overview.submissions} bài nộp`,
      });
    } catch (e) {
      if (e?.name === 'AbortError') {
        setGen({ status: 'idle', error: '', engine: '' });
      } else {
        setGen({ status: 'error', error: e?.message || 'Không tạo được báo cáo.', engine: '' });
      }
    } finally {
      abortRef.current = null;
    }
  };

  const stopGenerate = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  /* ---------- báo cáo đang hiển thị ---------- */
  const shownReport = live?.report ? live : (saved?.report ? {
    report: saved.report,
    engine: saved.engine || 'rule',
    meta: { generatedAt: toMs(saved.generatedAt) || saved.generatedAtMs || 0, schemaVersion: saved.schemaVersion },
    error: saved.aiError || '',
    fromSaved: true,
    version: saved.version,
  } : null);

  const staleness = saved ? savedReportStaleness(saved, analytics) : { stale: false, reason: '' };

  const subjectsForSelect = useMemo(
    () => [...new Set([...subjects.map((s) => s.subject), ...teachers.map((t) => t.subject).filter(Boolean)])],
    [subjects, teachers],
  );

  const deep = focusSubject ? analytics.subjectDetails?.[focusSubject] : null;

  /* Tên giáo viên bộ môn đã liên kết theo từng môn (để bảng tổng quan có ngữ cảnh) */
  const namesBySubject = useMemo(() => {
    const map = {};
    (teachers || []).forEach((t) => {
      const subj = String(t.subject || '').trim();
      if (!subj) return;
      if (!map[subj]) map[subj] = [];
      const name = t.teacherName || t.email || 'Giáo viên bộ môn';
      if (!map[subj].includes(name)) map[subj].push(name);
    });
    return map;
  }, [teachers]);

  /* Học sinh của môn đang chọn, sắp theo điểm TB giảm dần (chưa có bài xuống cuối) */
  const subjectStudentRows = useMemo(() => {
    const list = [...((deep && deep.students) || [])];
    return list.sort((a, b) => {
      if (a.avgPct === null && b.avgPct === null) return a.name.localeCompare(b.name, 'vi');
      if (a.avgPct === null) return 1;
      if (b.avgPct === null) return -1;
      return b.avgPct - a.avgPct;
    });
  }, [deep]);

  if (metaState.loading && !teachers.length) {
    return <div className="la"><p className="la-state">Đang tải dữ liệu phân tích…</p></div>;
  }

  return (
    <div className="la">
      {/* ================= HEADER / BỘ LỌC ================= */}
      <div className="la-head">
        <div>
          <h2 className="la-title">
            AI LEARNING ANALYTICS
            <span>Trung tâm phân tích học tập bằng AI</span>
          </h2>
          <p className="la-meta-line">
            Nguồn: {overview.exams} đề · {overview.submissions} bài nộp ·
            {' '}{overview.students} học sinh · tính trực tiếp từ Firestore
          </p>
        </div>

        <div className="la-range">
          <div className="la-seg" role="group" aria-label="Khoảng thời gian">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.key}
                type="button"
                className={rangeKey === r.key ? 'on' : ''}
                onClick={() => {
                  setRangeKey(r.key);
                  setShowCustom(r.key === 'custom');
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          {showCustom && (
            <div className="la-custom-range">
              <label>
                Từ
                <input type="date" value={fromInput} max={toInput} onChange={(e) => setFromInput(e.target.value)} />
              </label>
              <label>
                Đến
                <input type="date" value={toInput} min={fromInput} onChange={(e) => setToInput(e.target.value)} />
              </label>
              {rangeInvalid && <span className="la-hint bad">Khoảng thời gian chưa hợp lệ</span>}
            </div>
          )}
        </div>
      </div>

      {(metaState.error || loadingSubmissions) && (
        <p className={metaState.error ? 'la-error' : 'la-hint'}>
          {metaState.error || 'Đang tải bài nộp của lớp…'}
        </p>
      )}

      {/* ================= 1. TỔNG QUAN ================= */}
      <Section
        id="la-overview"
        title="1. Tổng quan lớp học"
        sub={`Khoảng đang xem: ${range.label}${range.from ? ` (từ ${fmtDay(range.from)})` : ''}`}
      >
        <div className="la-kpis">
          <div className="la-kpi">
            <small>Học sinh</small>
            <StatValue value={overview.students} />
            <span>{overview.activeStudents} em đã làm ít nhất 1 bài</span>
          </div>
          <div className="la-kpi">
            <small>Giáo viên bộ môn</small>
            <StatValue value={overview.teachers} />
            <span>{overview.teachersActive} đã giao đề trong khoảng này</span>
          </div>
          <div className="la-kpi">
            <small>Đề đã giao</small>
            <StatValue value={overview.exams} />
            <span>{overview.scoredExams} đề có kết quả chấm</span>
          </div>
          <div className="la-kpi">
            <small>Lượt làm bài</small>
            <StatValue value={overview.submissions} />
            <span>trên {overview.expectedAttempts} lượt mong đợi</span>
          </div>
          <div className="la-kpi">
            <small>Tỷ lệ hoàn thành</small>
            <StatValue value={overview.completionRate} unit="%" />
            <span>lượt nộp ÷ (số đề × số học sinh)</span>
          </div>
          <div className="la-kpi">
            <small>Điểm trung bình</small>
            <StatValue value={overview.avgPct} unit="%" />
            <span>{overview.passRate === null ? 'chưa có dữ liệu điểm' : `${overview.passRate}% bài đạt ≥50%`}</span>
          </div>
        </div>

        {subjects.some((s) => s.avgPct !== null) ? (
          <div className="la-subject-avg">
            <h4>Điểm trung bình theo môn</h4>
            <HBarChart
              ariaLabel="Điểm trung bình theo môn"
              data={subjects.filter((s) => s.avgPct !== null).map((s) => ({ label: s.subject, value: s.avgPct }))}
              max={100}
            />
            <p className="la-note">
              Mỗi cột là trung bình phần trăm điểm của tất cả bài nộp môn đó; môn chưa có bài nộp không được tính.
            </p>
          </div>
        ) : (
          <Empty>
            Chưa có bài nộp nào trong khoảng đang xem nên chưa tính được điểm trung bình theo môn.
            Giao một đề ngắn 8–10 câu để có dữ liệu.
          </Empty>
        )}
      </Section>

      {/* ================= 2. HOẠT ĐỘNG GIÁO VIÊN BỘ MÔN ================= */}
      <Section
        id="la-teachers"
        title="2. Hoạt động giáo viên bộ môn"
        sub={`${overview.teachers} giáo viên đã liên kết · ${teacherRows.length} dòng số liệu`}
        actions={(
          <div className="la-filters">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm giáo viên…"
              aria-label="Tìm giáo viên"
            />
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} aria-label="Lọc theo môn">
              <option value="all">Tất cả môn</option>
              {subjectsForSelect.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      >
        {filteredTeachers.length === 0 ? (
          <Empty>
            Chưa có giáo viên bộ môn nào liên kết với lớp (hoặc không khớp bộ lọc).
            Tạo key ở tab “Giáo viên bộ môn” rồi gửi cho giáo viên.
          </Empty>
        ) : (
          <div className="la-scroll">
            <table className="la-table">
              <thead>
                <tr>
                  <th>Giáo viên</th>
                  <th>Môn học</th>
                  <th className="num">Số đề</th>
                  <th className="num">Lượt làm bài</th>
                  <th className="num">Tham gia</th>
                  <th className="num">Điểm TB</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((r) => (
                  <FragmentRow
                    key={r.teacherId}
                    row={r}
                    open={openTeacher === r.teacherId}
                    onToggle={() => setOpenTeacher(openTeacher === r.teacherId ? '' : r.teacherId)}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Tổng</th>
                  <th />
                  <th className="num">{filteredTeachers.reduce((a, r) => a + r.examCount, 0)}</th>
                  <th className="num">{filteredTeachers.reduce((a, r) => a + r.submissions, 0)}</th>
                  <th colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="la-note">
          Trạng thái tài khoản lấy từ hồ sơ người dùng trong hệ thống. Số đề chỉ phản ánh hoạt động
          kiểm tra, <b>không dùng để đánh giá năng lực giảng dạy</b> của giáo viên.
        </p>
      </Section>

      {/* ================= 3. BIỂU ĐỒ ================= */}
      <Section id="la-charts" title="3. Biểu đồ phân tích" sub="Chỉ hiển thị khi dữ liệu đủ để tính hợp lệ">
        <div className="la-chart-grid">
          <div className="la-card">
            <h4>Số đề giao theo thời gian</h4>
            {overview.exams > 0 ? (
              <>
                <BarChart
                  ariaLabel="Số đề giao theo thời gian"
                  data={timeline.map((b) => ({ label: b.label, value: b.exams }))}
                  unit=" đề"
                />
                <p className="la-note">
                  Độ chia: {analytics.meta.granularity === 'day' ? 'theo ngày' : analytics.meta.granularity === 'week' ? 'theo tuần' : 'theo tháng'}.
                </p>
              </>
            ) : <Empty>Chưa có đề nào trong khoảng đang xem.</Empty>}
          </div>

          <div className="la-card">
            <h4>Số đề theo từng môn</h4>
            {subjects.length ? (
              <HBarChart
                ariaLabel="Số đề theo môn"
                data={subjects.map((s) => ({ label: s.subject, value: s.exams }))}
                max={Math.max(1, ...subjects.map((s) => s.exams))}
                unit=" đề"
                valueLabel={(v) => `${v} đề`}
              />
            ) : <Empty>Chưa có môn nào có đề.</Empty>}
          </div>

          <div className="la-card">
            <h4>Tỷ lệ hoàn thành bài kiểm tra</h4>
            {overview.completionRate === null ? (
              <Empty>Cần có đề và học sinh mới tính được tỷ lệ.</Empty>
            ) : (
              <div className="la-donut-wrap">
                <Donut
                  value={overview.completionRate}
                  max={100}
                  size={132}
                  stroke={12}
                  tone={overview.completionRate >= 80 ? 'acc' : overview.completionRate >= 50 ? 'warn' : 'danger'}
                >
                  <strong>{overview.completionRate}<sup>%</sup></strong>
                  <small>hoàn thành</small>
                </Donut>
                <ul className="la-facts">
                  <li><span>Lượt nộp</span><b>{overview.submissions}</b></li>
                  <li><span>Lượt mong đợi</span><b>{overview.expectedAttempts}</b></li>
                  <li><span>Tỷ lệ tham gia</span><b>{overview.participationRate ?? '—'}%</b></li>
                </ul>
              </div>
            )}
          </div>

          <div className="la-card">
            <h4>Xu hướng điểm trung bình</h4>
            {timeline.some((b) => b.avgPct !== null) ? (
              <TrendChart
                points={timeline.filter((b) => b.avgPct !== null).map((b) => ({ label: b.label, value: b.avgPct }))}
                max={100}
                mode="line"
                height={150}
              />
            ) : <Empty>Chưa có bài nộp nào có điểm.</Empty>}
          </div>

          <div className="la-card">
            <h4>Phân bố điểm</h4>
            {overview.submissions > 0 ? (
              <BarChart
                ariaLabel="Phân bố điểm"
                data={distribution.map((d) => ({ label: d.label, value: d.count }))}
                unit=" bài"
              />
            ) : <Empty>Chưa có bài nộp nào.</Empty>}
          </div>

          <div className="la-card">
            <h4>Tỷ lệ trả lời đúng theo chủ đề</h4>
            {topics.rows.length ? (
              <>
                <HBarChart
                  ariaLabel="Tỷ lệ trả lời đúng theo chủ đề"
                  data={topics.rows.slice(0, 10).map((t) => ({ label: t.topic, value: t.rate }))}
                  max={100}
                  tone="alt"
                />
                <p className="la-note">
                  {topics.coverage === null
                    ? 'Chưa có metadata chủ đề trên câu hỏi.'
                    : `${topics.coverage}% câu hỏi có gắn chủ đề (${topics.taggedQuestions}/${topics.totalQuestions}).`}
                </p>
              </>
            ) : <Empty>Chưa có dữ liệu trả lời từng câu để tính theo chủ đề.</Empty>}
          </div>
        </div>
      </Section>

      {/* ================= 4. BÁO CÁO RIÊNG THEO MÔN ================= */}
      <Section
        id="la-subject"
        title="4. Báo cáo chuyên sâu theo môn"
        sub="Chọn một môn để xem số liệu riêng và dùng làm trọng tâm cho báo cáo AI"
        actions={(
          <select
            className="la-select"
            value={focusSubject}
            onChange={(e) => setFocusSubject(e.target.value)}
            aria-label="Chọn môn phân tích"
          >
            <option value="">Toàn lớp (mọi môn)</option>
            {subjectsForSelect.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      >
        {/* Tổng quan mọi môn: điểm TB + số học sinh từng mức xếp loại */}
        {subjects.length === 0 ? (
          <Empty>Chưa có môn nào có đề trong khoảng đang xem.</Empty>
        ) : (
          <div className="la-card">
            <div className="la-ov-head">
              <h4>Tổng quan theo môn — điểm và xếp loại học sinh</h4>
              <button type="button" className="la-btn" onClick={exportCsv}>
                Xuất CSV
              </button>
            </div>

            <details className="la-band-cfg">
              <summary>Ngưỡng xếp loại của lớp</summary>
              <div className="la-band-cfg-row">
                <label>
                  Giỏi ≥
                  <input
                    type="number" min="1" max="100" value={bandDraft.gioi}
                    onChange={(e) => setBandDraft({ ...bandDraft, gioi: e.target.value })}
                  />%
                </label>
                <label>
                  Khá ≥
                  <input
                    type="number" min="1" max="100" value={bandDraft.kha}
                    onChange={(e) => setBandDraft({ ...bandDraft, kha: e.target.value })}
                  />%
                </label>
                <label>
                  Trung bình ≥
                  <input
                    type="number" min="0" max="100" value={bandDraft.tb}
                    onChange={(e) => setBandDraft({ ...bandDraft, tb: e.target.value })}
                  />%
                </label>
                <button type="button" className="la-btn" onClick={saveBands} disabled={savingBands}>
                  {savingBands ? 'Đang lưu…' : 'Lưu'}
                </button>
                {bandMsg && <span className="la-muted">{bandMsg}</span>}
              </div>
              <p className="la-note">
                Mặc định 80 / 65 / 50 (tức 8.0 / 6.5 / 5.0 trên thang 10). Ngưỡng được lưu vào
                hồ sơ lớp và dùng chung cho trang của học sinh.
              </p>
            </details>

            <div className="la-scroll">
              <table className="la-table sm">
                <thead>
                  <tr>
                    <th>Môn</th>
                    <th>Giáo viên bộ môn</th>
                    <th className="num">Đề</th>
                    <th className="num">Lượt nộp</th>
                    <th className="num">Điểm TB</th>
                    <th className="num">Giỏi</th>
                    <th className="num">Khá</th>
                    <th className="num">TB</th>
                    <th className="num">Yếu</th>
                    <th className="num">Chưa có bài</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => {
                    const b = analytics.subjectDetails?.[s.subject]?.bands || {};
                    const names = namesBySubject[s.subject] || [];
                    return (
                      <tr key={s.subject} className={focusSubject === s.subject ? 'is-open' : ''}>
                        <td><b>{s.subject}</b></td>
                        <td>
                          {names.length
                            ? names.join(', ')
                            : <span className="la-muted">chưa liên kết</span>}
                        </td>
                        <td className="num">{s.exams}</td>
                        <td className="num">{s.submissions}</td>
                        <td className="num">{s.avgPct === null ? '—' : `${s.avgPct}%`}</td>
                        <td className="num">{b.gioi ?? 0}</td>
                        <td className="num">{b.kha ?? 0}</td>
                        <td className="num">{b.tb ?? 0}</td>
                        <td className="num">{b.yeu ?? 0}</td>
                        <td className="num">{b.nodata ?? 0}</td>
                        <td>
                          <button type="button" className="la-link" onClick={() => setFocusSubject(s.subject)}>
                            Xem học sinh
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="la-note">
              Xếp loại tính trên điểm % của các bài <b>đã làm</b> trong khoảng đang xem:
              Giỏi ≥ {bands.gioi}% · Khá {bands.kha}–{bands.gioi - 1}% ·
              Trung bình {bands.tb}–{bands.kha - 1}% · Yếu &lt; {bands.tb}%.
              Học sinh chưa làm bài nào được ghi “chưa có bài”, <b>không mặc định là Yếu</b>.
            </p>
          </div>
        )}

        {!focusSubject ? (
          <Empty>Đang phân tích toàn lớp. Chọn một môn để xem báo cáo riêng.</Empty>
        ) : !deep ? (
          <Empty>Môn “{focusSubject}” chưa có dữ liệu đề/bài nộp trong khoảng đang xem.</Empty>
        ) : (
          <div className="la-subject-detail">
            <div className="la-facts-row">
              <div><small>Đề của môn</small><b>{deep.exams.length}</b></div>
              <div><small>Bài nộp</small><b>{deep.exams.reduce((a, e) => a + e.submissions, 0)}</b></div>
              <div>
                <small>Điểm TB</small>
                <b>{(() => {
                  const p = deep.exams.map((e) => e.avgPct).filter((n) => n !== null);
                  return p.length ? `${Math.round(p.reduce((a, b) => a + b, 0) / p.length)}%` : '—';
                })()}</b>
              </div>
              <div><small>Gắn chủ đề</small><b>{deep.topicCoverage === null ? '—' : `${deep.topicCoverage}%`}</b></div>
            </div>

            {deep.trend.length >= 2 ? (
              <div className="la-card">
                <h4>Tiến bộ qua các đề có thể so sánh</h4>
                <TrendChart points={deep.trend} max={100} mode="line" height={140} />
              </div>
            ) : (
              <Empty>Cần ít nhất 2 đề có bài nộp để so sánh xu hướng.</Empty>
            )}

            {deep.exams.length > 0 && (
              <div className="la-scroll">
                <table className="la-table sm">
                  <thead>
                    <tr>
                      <th>Đề</th>
                      <th>Giáo viên</th>
                      <th className="num">Giao lúc</th>
                      <th className="num">Bài nộp</th>
                      <th className="num">Tham gia</th>
                      <th className="num">Điểm TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deep.exams.map((e) => (
                      <tr key={e.id}>
                        <td>{e.title}</td>
                        <td>{e.teacherName || '—'}</td>
                        <td className="num">{fmtDateTime(e.opensAt)}</td>
                        <td className="num">{e.submissions}</td>
                        <td className="num">{e.participation === null ? '—' : `${e.participation}%`}</td>
                        <td className="num">{e.avgPct === null ? '—' : `${e.avgPct}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="la-card">
              <h4>Xếp loại học sinh — môn {deep.subject}</h4>

              <div className="la-bands">
                {BANDS.map((b) => (
                  <span key={b.key} className={`la-band band-${b.key}`}>
                    {b.label} <b>{deep.bands?.[b.key] ?? 0}</b>
                  </span>
                ))}
                <span className="la-band band-nodata">
                  Chưa có bài <b>{deep.bands?.nodata ?? 0}</b>
                </span>
                <span className="la-muted">/ {deep.bands?.total ?? 0} học sinh</span>
              </div>

              {subjectStudentRows.length === 0 ? (
                <Empty>Lớp chưa có học sinh nào.</Empty>
              ) : (
                <div className="la-scroll">
                  <table className="la-table sm">
                    <thead>
                      <tr>
                        <th>Học sinh</th>
                        <th className="num">Bài đã làm</th>
                        <th className="num">Điểm TB</th>
                        <th className="num">Cao nhất</th>
                        <th className="num">Thấp nhất</th>
                        <th className="num">Bài gần nhất</th>
                        <th>Xếp loại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectStudentRows.map((st) => (
                        <tr key={st.id}>
                          <td>
                            <b>{st.name}</b>
                            {st.email ? <small className="la-muted"> · {st.email}</small> : null}
                          </td>
                          <td className="num">{st.attempts}/{st.expected}</td>
                          <td className="num">{st.avgPct === null ? '—' : `${st.avgPct}%`}</td>
                          <td className="num">{st.bestPct === null ? '—' : `${st.bestPct}%`}</td>
                          <td className="num">{st.worstPct === null ? '—' : `${st.worstPct}%`}</td>
                          <td className="num">{st.lastAt ? fmtDay(st.lastAt) : '—'}</td>
                          <td>
                            {st.band ? (
                              <Badge tone={BAND_TONE[st.band]}>
                                {bandLabel(st.band)}{st.lowConfidence ? ' · ít dữ liệu' : ''}
                              </Badge>
                            ) : (
                              <Badge tone="na">Chưa đủ dữ liệu</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="la-note">
                Có bài mới được xếp loại: học sinh chưa làm bài nào nằm ở nhóm “Chưa có bài”,
                không bị coi là Yếu. Một bài là quá ít để kết luận nên được gắn “ít dữ liệu”.
                Đây là mô tả kết quả kiểm tra, <b>không phải kết luận về năng lực hay thái độ</b> của học sinh.
              </p>
            </div>

            <div className="la-card">
              <h4>Chủ đề cần ưu tiên ôn tập</h4>
              {deep.topics.filter((t) => t.rate !== null).length === 0 ? (
                <Empty>
                  Chưa có dữ liệu trả lời từng câu. Hãy bổ sung metadata “chủ đề/mức độ” khi soạn đề
                  để phân tích này chính xác hơn.
                </Empty>
              ) : (
                <HBarChart
                  ariaLabel="Tỷ lệ đúng theo chủ đề của môn"
                  data={deep.topics.filter((t) => t.rate !== null).slice(0, 10).map((t) => ({ label: t.topic, value: t.rate }))}
                  max={100}
                  tone="alt"
                />
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ================= 5. EARLY WARNING ================= */}
      <Section
        id="la-warnings"
        title="5. EARLY WARNING — Cảnh báo học tập"
        sub={`${warnings.length} cảnh báo tính từ dữ liệu thực tế${warnings.length ? ` · ${warningCounts.high} ưu tiên cao` : ''}`}
        actions={(
          <div className="la-seg sm" role="group" aria-label="Lọc mức ưu tiên">
            {[
              ['all', `Tất cả (${warningCounts.all})`],
              ['high', `Cao (${warningCounts.high})`],
              ['medium', `TB (${warningCounts.medium})`],
              ['low', `Theo dõi (${warningCounts.low})`],
            ].map(([k, label]) => (
              <button key={k} type="button" className={warnFilter === k ? 'on' : ''} onClick={() => setWarnFilter(k)}>
                {label}
              </button>
            ))}
          </div>
        )}
      >
        {filteredWarnings.length === 0 ? (
          <Empty>
            {warnings.length === 0
              ? 'Chưa phát hiện vấn đề nào vượt ngưỡng cảnh báo với dữ liệu hiện có.'
              : 'Không có cảnh báo ở mức ưu tiên này.'}
          </Empty>
        ) : (
          <ul className="la-warns">
            {filteredWarnings.slice(0, 30).map((w) => {
              const p = PRIORITY[w.priority] || PRIORITY.medium;
              return (
                <li key={w.id} className={`la-warn prio-${w.priority}`}>
                  <div className="la-warn-head">
                    <Badge tone={p.tone}>{p.label}</Badge>
                    <b>{w.title}</b>
                    <em>{fmtDateTime(w.detectedAt)}</em>
                  </div>
                  <dl>
                    <dt>Dữ liệu căn cứ</dt><dd>{w.evidence}</dd>
                    <dt>Vì sao cần chú ý</dt><dd>{w.why}</dd>
                    <dt>Đề xuất xử lý</dt><dd>{w.action}</dd>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
        <p className="la-note">
          Cảnh báo mang tính hỗ trợ, <b>không thay thế đánh giá của giáo viên</b> và không tự xếp loại học sinh.
        </p>
      </Section>

      {/* ================= 6. BÁO CÁO AI ================= */}
      <Section
        id="la-ai"
        title="6. Báo cáo AI"
        sub="Diễn giải trên số liệu đã tính sẵn — có dẫn chứng và nêu rõ giới hạn"
        actions={(
          <div className="la-ai-actions">
            {gen.status === 'generating' ? (
              <button type="button" className="la-btn ghost" onClick={stopGenerate}>Dừng</button>
            ) : (
              <button
                type="button"
                className="la-btn primary"
                onClick={generate}
                disabled={!canGenerate}
                title={!canGenerate ? 'Cần có ít nhất một bài nộp để phân tích' : ''}
              >
                {shownReport ? 'Tạo lại báo cáo' : 'Tạo báo cáo AI'}
              </button>
            )}
          </div>
        )}
      >
        {!canGenerate && gen.status !== 'generating' && (
          <p className="la-hint">
            Chưa thể tạo báo cáo: cần ít nhất 1 bài nộp trong khoảng đang xem.
            {rangeInvalid ? ' Khoảng thời gian tuỳ chọn chưa hợp lệ.' : ''}
          </p>
        )}

        {gen.status === 'generating' && (
          <div className="la-generating">
            <span className="la-spinner" aria-hidden="true" />
            <div>
              <b>Đang phân tích…</b>
              <p>
                Đã tính xong {overview.submissions} bài nộp. AI đang diễn giải số liệu
                {focusSubject ? ` cho môn ${focusSubject}` : ' toàn lớp'}.
              </p>
            </div>
          </div>
        )}

        {savedLoading && gen.status !== 'generating' && (
          <p className="la-hint">Đang tải báo cáo đã lưu cho phạm vi này…</p>
        )}

        {gen.status === 'error' && <p className="la-error">{gen.error}</p>}

        {staleness.stale && saved && (
          <p className="la-hint warn">
            Báo cáo đang hiển thị được tạo lúc {fmtDateTime(toMs(saved.generatedAt) || saved.generatedAtMs)} —
            {' '}{staleness.reason}. Bấm “Tạo lại báo cáo” để cập nhật.
          </p>
        )}

        {!shownReport && gen.status !== 'generating' && (
          <Empty>
            Chưa có báo cáo cho {range.label.toLowerCase()}{focusSubject ? ` · môn ${focusSubject}` : ''}.
            Bấm “Tạo báo cáo AI” để phân tích {overview.submissions} bài nộp hiện có.
          </Empty>
        )}

        {shownReport && (
          <div className="la-report">
            <div className="la-report-bar">
              <Badge tone={shownReport.engine === 'ai' ? 'ex' : 'mid'}>
                {shownReport.engine === 'ai' ? 'Phân tích AI' : 'Báo cáo thống kê (không gọi AI)'}
              </Badge>
              <span>Tạo lúc {fmtDateTime(toMs(shownReport.meta?.generatedAt) || shownReport.meta?.generatedAt)}</span>
              <span>Phạm vi: {range.label}{focusSubject ? ` · môn ${focusSubject}` : ''}</span>
              {shownReport.version && <span>Phiên bản #{shownReport.version}</span>}
              {shownReport.fromSaved && <span>Dữ liệu lúc tạo: {saved?.metrics?.submissions ?? '—'} bài nộp</span>}
            </div>

            {shownReport.error && (
              <p className="la-hint bad">
                Không gọi được AI ({shownReport.error}). Nội dung dưới đây do hệ thống thống kê tạo,
                không phải nhận định của AI.
              </p>
            )}

            <p className="la-summary">{shownReport.report.summary}</p>

            {shownReport.report.findings?.length > 0 && (
              <div className="la-block">
                <h4>Phát hiện đáng chú ý</h4>
                <ul className="la-findings">
                  {shownReport.report.findings.map((f, i) => (
                    <li key={i}>
                      <b>{f.title}</b>
                      {f.detail && <p>{f.detail}</p>}
                      {f.evidence && <small>Dẫn chứng: {f.evidence}</small>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {shownReport.report.risks?.length > 0 && (
              <div className="la-block">
                <h4>Vấn đề cần ưu tiên</h4>
                <ul className="la-risks">
                  {shownReport.report.risks.map((r, i) => (
                    <li key={i}>
                      <Badge tone={PRIORITY[r.priority]?.tone || 'mid'}>
                        {PRIORITY[r.priority]?.label || 'Trung bình'}
                      </Badge>
                      <b>{r.title}</b>
                      {r.detail && <p>{r.detail}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {shownReport.report.recommendations?.length > 0 && (
              <div className="la-block">
                <h4>Khuyến nghị cho giáo viên chủ nhiệm</h4>
                <ol className="la-recos">
                  {shownReport.report.recommendations.map((r, i) => (
                    <li key={i}>
                      <b>{r.action}</b>
                      <div className="la-reco-meta">
                        {r.target && <span>Đối tượng: {r.target}</span>}
                        {r.timeframe && <span>Thời điểm: {r.timeframe}</span>}
                        {r.basedOn && <span>Căn cứ: {r.basedOn}</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {shownReport.report.perSubject?.length > 0 && (
              <div className="la-block">
                <h4>Phân tích riêng theo môn</h4>
                <ul className="la-persubject">
                  {shownReport.report.perSubject.map((s, i) => (
                    <li key={i}>
                      <b>{s.subject}</b>
                      <p>{s.summary}</p>
                      {s.weakTopics?.length > 0 && (
                        <small>Chủ đề yếu: {s.weakTopics.join(' · ')}</small>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {shownReport.report.evidence?.length > 0 && (
              <div className="la-block">
                <h4>Dữ liệu làm căn cứ</h4>
                <ul className="la-evidence">
                  {shownReport.report.evidence.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {shownReport.report.limitations?.length > 0 && (
              <div className="la-limits">
                <h4>Giới hạn của phân tích này</h4>
                <ul>
                  {shownReport.report.limitations.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            )}

            <p className="la-note">
              Nguồn dữ liệu: đề, bài nộp và danh sách học sinh của lớp trong Firestore ·
              Khoảng: {range.label}{range.from ? ` (từ ${fmtDay(range.from)})` : ''} ·
              Học sinh được ẩn danh (HS01, HS02…) khi gửi AI.
            </p>
          </div>
        )}
      </Section>

      {/* ================= 7. CHẤT LƯỢNG DỮ LIỆU + NHẬT KÝ ================= */}
      <Section id="la-quality" title="Chất lượng dữ liệu & nhật ký">
        <div className="la-two-cols">
          <div className="la-card">
            <h4>Độ đầy đủ của dữ liệu</h4>
            <p className={dataQuality.sufficient.ok ? 'la-badge tone-ex' : 'la-badge tone-mid'}>
              {dataQuality.sufficient.label}
            </p>
            {!dataQuality.sufficient.ok && (
              <ul className="la-evidence">
                {dataQuality.sufficient.missing.map((m, i) => <li key={i}>Cần bổ sung: {m}</li>)}
              </ul>
            )}
            {dataQuality.notes.length > 0 ? (
              <ul className="la-evidence">
                {dataQuality.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            ) : (
              <p className="la-note">Không phát hiện thiếu hụt dữ liệu đáng kể.</p>
            )}
            <p className="la-note">
              Điều kiện tối thiểu để gọi AI: ≥5 bài nộp, ≥2 đề có kết quả, ≥3 học sinh.
            </p>
          </div>

          <div className="la-card">
            <h4>Nhật ký hoạt động gần đây</h4>
            {audit.length === 0 ? (
              <Empty>Chưa có hoạt động nào được ghi nhận.</Empty>
            ) : (
              <ul className="la-audit">
                {audit.slice(0, 12).map((a) => (
                  <li key={a.id}>
                    <Badge tone="na">{AUDIT_LABEL[a.action] || a.action}</Badge>
                    <span>{a.actorName || a.teacherName || '—'}</span>
                    {a.detail && <small>{a.detail}</small>}
                    <em>{timeAgo(toMs(a.at) || a.atMs)}</em>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      {/* ---------- bảng học sinh thu gọn (dữ liệu cho cảnh báo) ---------- */}
      <details className="la-students">
        <summary>Xem số liệu từng học sinh ({students.length})</summary>
        <div className="la-scroll">
          <table className="la-table sm">
            <thead>
              <tr>
                <th>Học sinh</th>
                <th className="num">Đã nộp</th>
                <th className="num">Còn thiếu</th>
                <th className="num">Điểm TB</th>
                <th>Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {[...students].sort((a, b) => (a.avgPct ?? 999) - (b.avgPct ?? 999)).map((s) => (
                <tr key={s.id}>
                  <td>{s.name}{s.email && <small className="la-mail">{s.email}</small>}</td>
                  <td className="num">{s.submissions}/{s.expected}</td>
                  <td className="num">{s.missing}</td>
                  <td className="num">{s.avgPct === null ? '—' : `${s.avgPct}%`}</td>
                  <td>
                    {s.trend === 'down' ? <Badge tone="bad">Giảm {s.delta}%</Badge>
                      : s.trend === 'up' ? <Badge tone="ex">Tăng +{s.delta}%</Badge>
                        : s.trend === 'flat' ? <Badge tone="na">Ổn định</Badge>
                          : <Badge tone="na">Chưa đủ dữ liệu</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="la-note">
          “Xu hướng” so sánh nửa đầu và nửa cuối chuỗi bài đã nộp (cần ≥3 bài). Chỉ là tín hiệu tham khảo.
        </p>
      </details>
    </div>
  );
}

/* ---------- dòng giáo viên có mở rộng chi tiết ---------- */
function FragmentRow({ row, open, onToggle }) {
  return (
    <>
      <tr className={open ? 'is-open' : ''}>
        <td>
          <button type="button" className="la-name" onClick={onToggle} aria-expanded={open}>
            {row.teacherName}
            {row.isOwner && <em>chủ nhiệm</em>}
          </button>
          {row.email && <small className="la-mail">{row.email}</small>}
        </td>
        <td>{row.subject || <span className="la-muted">chưa ghi</span>}</td>
        <td className="num"><b>{row.examCount}</b></td>
        <td className="num">{row.submissions}</td>
        <td className="num">{row.participation === null ? '—' : `${row.participation}%`}</td>
        <td className="num">{row.avgPct === null ? '—' : `${row.avgPct}%`}</td>
        <td><Badge tone={row.status.tone}>{row.status.label}</Badge></td>
        <td className="num">
          <button type="button" className="la-btn ghost" onClick={onToggle}>
            {open ? 'Thu gọn' : 'Chi tiết'}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="la-detail">
          <td colSpan={8}>
            {row.exams.length === 0 ? (
              <p className="la-empty sm">Chưa giao đề nào cho lớp trong khoảng này.</p>
            ) : (
              <table className="la-table xs">
                <thead>
                  <tr>
                    <th>Đề</th>
                    <th>Môn</th>
                    <th className="num">Câu</th>
                    <th className="num">Giao lúc</th>
                    <th className="num">Bài nộp</th>
                    <th className="num">Điểm TB</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {row.exams.map((e) => (
                    <tr key={e.id}>
                      <td>{e.title}</td>
                      <td>{e.subject || '—'}</td>
                      <td className="num">{e.questions}</td>
                      <td className="num">{fmtDateTime(e.opensAt || e.createdAt)}</td>
                      <td className="num">{e.submissions}</td>
                      <td className="num">{e.avgPct === null ? '—' : `${e.avgPct}%`}</td>
                      <td><Badge tone={e.status.code === 'open' ? 'ex' : e.status.code === 'off' ? 'bad' : 'na'}>{e.status.label}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}


