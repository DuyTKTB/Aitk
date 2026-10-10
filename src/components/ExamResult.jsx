/* ============================================================
   ExamResult.jsx — Màn hình kết quả cho học sinh (v3)
   ------------------------------------------------------------
   Giữ nguyên props: { exam, result, showAnswer, onExit }
   Mới:
     • Hiển thị công thức (MathText) ở đề, đáp án, lời giải
     • Bộ lọc: Tất cả / Câu sai / Bỏ trống → ôn nhanh phần chưa vững
     • Thống kê đúng – sai – bỏ trống
     • Kết quả theo chủ đề (nếu câu hỏi có topic)
     • Lời giải dùng class CSS thay vì style inline
   ============================================================ */
import { useMemo, useState } from 'react';
import MathText from './MathText.jsx';
import '../styles/classroom.css';
import '../styles/exam-result-plus.css';

const IcoCheck = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoX = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const gradeOf = (pct) =>
  pct >= 90 ? { label: 'Xuất sắc', color: '#16a34a' }
  : pct >= 70 ? { label: 'Tốt', color: '#2563eb' }
  : pct >= 50 ? { label: 'Trung bình', color: '#f59e0b' }
  : { label: 'Cần cố gắng', color: '#dc2626' };

export default function ExamResult({ exam, result, showAnswer, onExit }) {
  const [filter, setFilter] = useState('all'); // all | wrong | skipped

  const noScore = result.score == null;
  const pct = !noScore && result.totalPoints > 0
    ? Math.round((result.score / result.totalPoints) * 100)
    : 0;
  const grade = gradeOf(pct);

  const details = result.detail || [];
  const stats = useMemo(() => {
    let right = 0, wrong = 0, skipped = 0;
    details.forEach((d) => {
      if (d.picked === -1) skipped++;
      else if (d.isCorrect) right++;
      else wrong++;
    });
    return { right, wrong, skipped };
  }, [details]);

  /* Kết quả theo chủ đề — chỉ khi đề có gắn topic */
  const topics = useMemo(() => {
    const map = new Map();
    (exam.questions || []).forEach((q, i) => {
      const t = (q.topic || '').trim();
      const d = details[i];
      if (!t || !d) return;
      const cur = map.get(t) || { topic: t, right: 0, total: 0 };
      cur.total++;
      if (d.isCorrect) cur.right++;
      map.set(t, cur);
    });
    return [...map.values()].sort((a, b) => a.right / a.total - b.right / b.total);
  }, [exam.questions, details]);

  const visible = (exam.questions || [])
    .map((q, i) => ({ q, i, d: details[i] }))
    .filter(({ d }) => {
      if (!d) return false;
      if (filter === 'wrong') return !d.isCorrect && d.picked !== -1;
      if (filter === 'skipped') return d.picked === -1;
      return true;
    });

  const tabs = [
    { key: 'all', label: 'Tất cả', n: details.length },
    { key: 'wrong', label: 'Câu sai', n: stats.wrong },
    { key: 'skipped', label: 'Bỏ trống', n: stats.skipped },
  ];

  return (
    <div className="er-page">
      <div className="er-card">
        {/* ---------- Điểm ---------- */}
        <div className="er-hero" style={{ '--grade-color': grade.color }}>
          <span className="er-label">{result.autoSubmitted ? 'TỰ ĐỘNG NỘP' : 'KẾT QUẢ'}</span>
          {noScore ? (
            <>
              <div className="er-score"><b>—</b></div>
              <p className="er-sub">Chưa lưu được bài của bạn. Hãy chụp màn hình và báo giáo viên.</p>
              {result.saveError && <p className="er-err">{result.saveError}</p>}
            </>
          ) : (
            <>
              <div className="er-score">
                <b>{result.score}</b>
                <span>/ {result.totalPoints}</span>
              </div>
              <div className="er-grade" style={{ background: grade.color }}>{grade.label}</div>
              <p className="er-sub">Đúng {result.correct}/{result.total} câu · {pct}%</p>
              {result.saveError && <p className="er-err">Điểm đã chấm nhưng chưa lưu lên hệ thống: {result.saveError}</p>}
            </>
          )}
        </div>

        {/* ---------- Thống kê ---------- */}
        {!noScore && details.length > 0 && (
          <>
            <div className="erp-stats" role="group" aria-label="Thống kê bài làm">
              <div className="erp-stat ok"><b>{stats.right}</b><span>Đúng</span></div>
              <div className="erp-stat no"><b>{stats.wrong}</b><span>Sai</span></div>
              <div className="erp-stat skip"><b>{stats.skipped}</b><span>Bỏ trống</span></div>
            </div>

            {topics.length > 0 && (
              <section className="erp-topics" aria-label="Kết quả theo chủ đề">
                <h3 className="er-h3">Theo chủ đề</h3>
                <ul>
                  {topics.map((t) => {
                    const p = Math.round((t.right / t.total) * 100);
                    return (
                      <li key={t.topic}>
                        <div className="erp-topic-row">
                          <span className="erp-topic-name">{t.topic}</span>
                          <span className="erp-topic-val">{t.right}/{t.total}</span>
                        </div>
                        <div
                          className="erp-bar"
                          role="progressbar"
                          aria-valuenow={p}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${t.topic}: ${p}%`}
                        >
                          <i className={p >= 70 ? 'hi' : p >= 50 ? 'mid' : 'lo'} style={{ width: `${p}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}

        {/* ---------- Chi tiết ---------- */}
        {showAnswer && details.length > 0 && (
          <>
            <div className="erp-head">
              <h3 className="er-h3">Chi tiết bài làm</h3>
              <div className="erp-filter" role="tablist" aria-label="Lọc câu hỏi">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={filter === t.key}
                    className={'erp-chip' + (filter === t.key ? ' on' : '')}
                    onClick={() => setFilter(t.key)}
                    disabled={t.key !== 'all' && t.n === 0}
                  >
                    {t.label} <em>{t.n}</em>
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="erp-empty">Không có câu nào trong mục này.</p>
            ) : (
              <ol className="er-list">
                {visible.map(({ q, i, d }) => (
                  <li key={i} className={d.isCorrect ? 'ok' : 'no'}>
                    <div className="er-list-head">
                      <span className="er-mark">{d.isCorrect ? <IcoCheck /> : <IcoX />}</span>
                      <b>Câu {i + 1}</b>
                      <span className="er-points">+{d.isCorrect ? (q.points || 1) : 0} điểm</span>
                    </div>
                    <MathText as="p" className="er-q">{q.q}</MathText>
                    <div className="er-opts">
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === d.correct;
                        const isPicked = oi === d.picked;
                        return (
                          <div
                            key={oi}
                            className={
                              'er-opt' +
                              (isCorrect ? ' correct' : '') +
                              (isPicked && !isCorrect ? ' wrong' : '')
                            }
                          >
                            <span className="er-opt-key">{String.fromCharCode(65 + oi)}</span>
                            <MathText>{opt}</MathText>
                            {isPicked && <em>Bạn chọn</em>}
                          </div>
                        );
                      })}
                      {d.picked === -1 && <p className="er-skipped">Bạn chưa trả lời câu này</p>}
                    </div>
                    {q.explain && (
                      <div className="erp-explain">
                        <b>Lời giải</b>
                        <MathText as="p">{q.explain}</MathText>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        <div className="er-actions">
          <button className="td-btn primary big" onClick={onExit} type="button">Về trang chủ</button>
        </div>
      </div>
    </div>
  );
}