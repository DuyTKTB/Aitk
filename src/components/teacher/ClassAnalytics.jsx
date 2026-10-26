/* ============================================================
   ClassAnalytics.jsx — "Số liệu lớp" cho giáo viên
   ------------------------------------------------------------
   Gồm 4 khối:
     1. KPI lớp (TB, % đạt, Mastery TB, số em cần chú ý)
     2. Heatmap học sinh × chương (đỏ = yếu)
     3. Bảng học sinh: Mastery + chương yếu nhất + cờ cảnh báo
     4. Ngăn kéo hồ sơ 1 học sinh (5 thành phần Mastery, chương, bài gần nhất)

   Mọi con số đều tính từ bài nộp thật; thiếu dữ liệu thì ghi rõ
   "chưa đủ dữ liệu" chứ không hiển thị 0.
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { buildClassAnalytics, masteryLabel, rateTone, MASTERY_PARTS } from '../../lib/teacherAnalytics.js';
import { getExamsByClass, getSubmissionsByExam } from '../../lib/classroom.js';
import '../../styles/teacher-analytics.css';

/* Cache 5 phút: đổi lớp qua lại không phải tải lại toàn bộ đề + bài nộp */
const FEED_TTL = 5 * 60 * 1000;
const feedCache = new Map();

const RANGES = [
  { key: '30', label: '30 ngày' },
  { key: '90', label: '90 ngày' },
  { key: 'all', label: 'Tất cả' },
];

const fmtDate = (ms) => {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return '—';
  }
};

function Kpi({ label, value, unit, hint, tone }) {
  return (
    <div className={`ta-kpi${tone ? ` is-${tone}` : ''}`}>
      <span className="ta-kpi-label">{label}</span>
      <span className="ta-kpi-value">
        {value === null || value === undefined ? '—' : value}
        {unit && value !== null && value !== undefined ? <small>{unit}</small> : null}
      </span>
      <span className="ta-kpi-hint">{hint}</span>
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
          <button type="button" className="ta-drawer-x" onClick={onClose} aria-label="Đóng">✕</button>
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
                <small>{fmtDate(s.submittedAt?.toMillis ? s.submittedAt.toMillis() : s.submittedAt)}</small>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

export default function ClassAnalytics({ classes = [], exams = [], submissionsMap = {}, loading = false }) {
  /* Khởi tạo ngay từ props: nếu để '' rồi mới set trong useEffect thì
     render đầu tiên cls = null → data = null → crash (đã xảy ra thật). */
  const [classId, setClassId] = useState(() => (classes[0] ? classes[0].id : ''));
  const [range, setRange] = useState('all');
  const [drawerId, setDrawerId] = useState(null);
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [feed, setFeed] = useState({ exams: [], submissionsMap: {}, loading: false, error: '' });

  useEffect(() => {
    if (!classId && classes.length) setClassId(classes[0].id);
  }, [classes, classId]);

  const cls = useMemo(() => classes.find((c) => c.id === classId) || null, [classes, classId]);

  /* Tự tải MỌI đề của lớp (kể cả của giáo viên bộ môn khác) + bài nộp.
     Nhờ vậy chủ nhiệm thấy được bài giao của giáo viên khác trong lớp mình. */
  useEffect(() => {
    if (!classId) return undefined;
    const hit = feedCache.get(classId);
    if (hit && Date.now() - hit.t < FEED_TTL) {
      setFeed({ ...hit.data, loading: false, error: '' });
      return undefined;
    }

    let alive = true;
    setFeed((f) => ({ ...f, loading: true, error: '' }));

    (async () => {
      try {
        const list = await getExamsByClass(classId);
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
        feedCache.set(classId, { t: Date.now(), data });
        if (alive) setFeed({ ...data, loading: false, error: '' });
      } catch (err) {
        if (alive) {
          setFeed({ exams: [], submissionsMap: {}, loading: false, error: err?.message || 'Không tải được đề của lớp' });
        }
      }
    })();

    return () => { alive = false; };
  }, [classId]);

  /* Ưu tiên dữ liệu tự tải; props của dashboard chỉ dùng khi chưa tải xong */
  const feedExams = feed.exams.length ? feed.exams : exams;
  const feedSubs = feed.exams.length ? feed.submissionsMap : submissionsMap;

  const data = useMemo(
    () => (cls ? buildClassAnalytics({
      cls, exams: feedExams, submissionsMap: feedSubs, rangeDays: range, teacherFilter,
    }) : null),
    [cls, feedExams, feedSubs, range, teacherFilter],
  );

  const drawerStudent = useMemo(
    () => (data ? data.students.find((s) => s.id === drawerId) || null : null),
    [data, drawerId],
  );

  const heatTopics = useMemo(() => (data ? data.classTopics.slice(0, 10) : []), [data]);

  if (loading || (feed.loading && !feed.exams.length)) {
    return <div className="ta-state">Đang tải đề và bài nộp của lớp…</div>;
  }

  if (feed.error) {
    return (
      <div className="ta-state">
        <b>Không tải được dữ liệu lớp</b>
        <p>{feed.error}</p>
      </div>
    );
  }

  if (!classes.length) {
    return (
      <div className="ta-state">
        <b>Chưa có lớp nào</b>
        <p>Tạo lớp ở mục “Lớp học” trước, rồi học sinh vào bằng mã lớp.</p>
      </div>
    );
  }

  /* Chốt chặn: mọi trường hợp chưa xác định được lớp đều không được đọc data.kpi */
  if (!data) {
    return <div className="ta-state">Đang chuẩn bị số liệu lớp…</div>;
  }

  const kpi = data.kpi;
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
            <select className="ta-select" value={classId} onChange={(e) => { setClassId(e.target.value); setDrawerId(null); }}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
        </div>
      </header>

      <div className="ta-kpis">
        <Kpi label="Điểm TB lớp" value={kpi.avgPct} unit="%" hint={`${kpi.submitted} bài nộp`} />
        <Kpi label="Tỷ lệ đạt" value={kpi.passRate} unit="%" hint="từ 50% trở lên" />
        <Kpi label="Mastery TB" value={kpi.masteryAvg} unit="/100" hint={`${kpi.dataCoverage}% em đủ dữ liệu`} />
        <Kpi label="Cần chú ý" value={kpi.atRisk} unit=" em" hint="Mastery dưới 40" tone={kpi.atRisk ? 'bad' : undefined} />
        <Kpi label="Chưa nộp" value={kpi.noSub} unit=" em" hint="trong khoảng đang xem" tone={kpi.noSub ? 'mid' : undefined} />
      </div>

      {data.teachers.length > 0 && (
        <div className="ta-card">
          <div className="ta-card-head">
            <h3>Giáo viên bộ môn trong lớp</h3>
            <span className="ta-card-sub">
              Chủ nhiệm thấy toàn bộ đề của {data.teachers.length} giáo viên đã giao cho lớp này
            </span>
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
                    <span><small>Bài nộp</small>{t.submissions}</span>
                    <span><small>TB</small>{t.pctAvg === null ? '—' : `${t.pctAvg}%`}</span>
                    <span><small>Mastery</small>{t.masteryAvg === null ? '—' : t.masteryAvg}</span>
                  </span>
                  <span className="ta-tcard-foot">
                    <span className="ta-tcard-track"><i style={{ width: `${t.coverage || 0}%` }} /></span>
                    <small>{t.students}/{kpi.students} em đã làm · {meta.label}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {noData ? (
        <div className="ta-state">
          <b>Chưa có bài nộp trong khoảng này</b>
          <p>
            Giao đề cho lớp rồi học sinh nộp bài — số liệu sẽ tự hiện.
            {kpi.topics.length === 0 && ' Lưu ý: đề hiện tại chưa gắn chương nên chưa có heatmap theo chương.'}
          </p>
        </div>
      ) : (
        <>
          {data.teachers.length > 1 && (
            <div className="ta-card">
              <div className="ta-card-head">
                <h3>Ai làm bài của giáo viên nào</h3>
                <span className="ta-card-sub">Số bài · % trung bình — ô trống là chưa làm bài nào của GV đó</span>
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

          <div className="ta-card">
            <div className="ta-card-head">
              <h3>Heatmap theo chương</h3>
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
            {data.classTopics.length > 10 && (
              <p className="ta-note">Đang hiện 10 chương yếu nhất; còn {data.classTopics.length - 10} chương khác.</p>
            )}
          </div>

          <div className="ta-card">
            <div className="ta-card-head">
              <h3>Học sinh</h3>
              <span className="ta-card-sub">Sắp xếp theo Mastery tăng dần — em cần giúp ở trên</span>
            </div>
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
                  {data.students.map((s) => (
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
          </div>

          {data.hardest.length > 0 && (
            <div className="ta-card">
              <div className="ta-card-head">
                <h3>Câu hỏi khó nhất</h3>
                <span className="ta-card-sub">Dưới 30% đúng thường là câu mơ hồ hoặc đề sai</span>
              </div>
              <ul className="ta-hardest">
                {data.hardest.map((q) => (
                  <li key={q.key}>
                    <span className={`ta-hard-rate tone-${rateTone(q.rate)}`}>{q.rate}%</span>
                    <span className="ta-hard-text">
                      {q.text.length > 120 ? `${q.text.slice(0, 120)}…` : q.text}
                      <small>{q.examTitle}{q.topic ? ` · ${q.topic}` : ''} · {q.ok}/{q.rated} em đúng</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {drawerStudent && <StudentDrawer student={drawerStudent} onClose={() => setDrawerId(null)} />}
    </section>
  );
}
