/* ============================================================
   ExamResult.jsx — v2
   • Dùng <MathText /> cho câu hỏi, đáp án, lời giải (hết hiện $\frac{1}{2}$ thô)
   • Vòng điểm, thống kê đúng / sai / bỏ qua, lọc theo trạng thái
   • Báo rõ khi bài đang chờ nộp (rớt mạng) thay vì "chưa lưu được"
   ============================================================ */
import { useMemo, useState } from 'react';
import MathText from './MathText.jsx';
import '../styles/classroom.css';
import '../styles/exam-result-v2.css';

const IcoCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
);
const IcoX = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const IcoMinus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="6" y1="12" x2="18" y2="12" /></svg>
);
const IcoCloud = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 10a6 6 0 0 0-11.5-1.5A4.5 4.5 0 0 0 7 17h11a3.5 3.5 0 0 0 0-7z" /></svg>
);

const gradeOf = (pct) =>
  pct >= 90 ? { label: 'Xuất sắc', color: '#16a34a' }
  : pct >= 70 ? { label: 'Tốt', color: '#2563eb' }
  : pct >= 50 ? { label: 'Trung bình', color: '#f59e0b' }
  : { label: 'Cần cố gắng', color: '#dc2626' };

const fmtDur = (s) => {
  const n = Math.max(0, Math.round(Number(s) || 0));
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};

function ScoreRing({ pct, color, children }) {
  const size = 148; const stroke = 12;
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (
    <div className="erx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" className="erx-ring-bg" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" stroke={color}
          strokeLinecap="round" strokeDasharray={`${(c * Math.min(100, pct)) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="erx-ring-fg"
        />
      </svg>
      <div className="erx-ring-in">{children}</div>
    </div>
  );
}

export default function ExamResult({ exam, result, showAnswer, onExit }) {
  const [filter, setFilter] = useState('all');
  const queued = !!result.queued;
  const noScore = result.score == null;
  const pct = !noScore && result.totalPoints > 0 ? Math.round((result.score / result.totalPoints) * 100) : 0;
  const grade = gradeOf(pct);

  const rows = useMemo(() => {
    if (!showAnswer || !result.detail) return [];
    return exam.questions.map((q, i) => {
      const d = result.detail[i];
      if (!d) return null;
      const status = d.picked === -1 ? 'skip' : d.isCorrect ? 'ok' : 'no';
      return { q, d, i, status };
    }).filter(Boolean);
  }, [exam, result, showAnswer]);

  const counts = useMemo(() => ({
    ok: rows.filter((r) => r.status === 'ok').length,
    no: rows.filter((r) => r.status === 'no').length,
    skip: rows.filter((r) => r.status === 'skip').length,
  }), [rows]);

  const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="er-page erx">
      <div className="er-card erx-card">
        <div className="erx-hero" style={{ '--grade-color': grade.color }}>
          <span className="erx-tag">{result.autoSubmitted ? 'TỰ ĐỘNG NỘP' : 'KẾT QUẢ'}</span>
          <p className="erx-exam">{exam?.title}</p>

          {queued ? (
            <div className="erx-notice warn" role="status">
              <IcoCloud />
              <div>
                <b>Bài đã được lưu trên máy</b>
                <span>Mất kết nối mạng. Bài sẽ tự động nộp khi có mạng — đừng xóa dữ liệu trình duyệt.</span>
              </div>
            </div>
          ) : noScore ? (
            <>
              <ScoreRing pct={0} color="#94a3b8"><b className="erx-score">—</b></ScoreRing>
              <p className="erx-sub">Chưa lưu được bài của bạn. Hãy chụp màn hình và báo giáo viên.</p>
              {result.saveError && <p className="er-err">{result.saveError}</p>}
            </>
          ) : (
            <>
              <ScoreRing pct={pct} color={grade.color}>
                <b className="erx-score">{result.score}</b>
                <span className="erx-of">/ {result.totalPoints}</span>
              </ScoreRing>
              <div className="erx-grade" style={{ background: grade.color }}>{grade.label} · {pct}%</div>
              {result.saveError && <p className="er-err">Điểm đã chấm nhưng chưa lưu lên hệ thống: {result.saveError}</p>}
            </>
          )}

          {!queued && !noScore && (
            <ul className="erx-stats" aria-label="Thống kê bài làm">
              <li className="ok"><b>{result.correct}</b><span>Đúng</span></li>
              <li className="no"><b>{result.total - result.correct - counts.skip}</b><span>Sai</span></li>
              {rows.length > 0 && <li className="skip"><b>{counts.skip}</b><span>Bỏ qua</span></li>}
              {result.timeSpent ? <li><b>{fmtDur(result.timeSpent)}</b><span>Thời gian</span></li> : null}
            </ul>
          )}
        </div>

        {showAnswer && rows.length > 0 && (
          <>
            <div className="erx-bar">
              <h3 className="er-h3">Chi tiết bài làm</h3>
              <div className="erx-filter" role="tablist" aria-label="Lọc câu hỏi">
                {[['all', 'Tất cả', rows.length], ['no', 'Sai', counts.no], ['skip', 'Bỏ qua', counts.skip], ['ok', 'Đúng', counts.ok]].map(([k, label, n]) => (
                  <button key={k} type="button" role="tab" aria-selected={filter === k}
                    className={'erx-chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>
                    {label} <em>{n}</em>
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 && <p className="erx-empty">Không có câu nào ở mục này 🎉</p>}

            <ol className="er-list erx-list">
              {visible.map(({ q, d, i, status }) => (
                <li key={i} className={'erx-item ' + status}>
                  <div className="er-list-head">
                    <span className={'erx-mark ' + status}>
                      {status === 'ok' ? <IcoCheck /> : status === 'no' ? <IcoX /> : <IcoMinus />}
                    </span>
                    <b>Câu {i + 1}</b>
                    <span className="er-points">+{d.isCorrect ? (q.points || 1) : 0} điểm</span>
                  </div>

                  <MathText as="p" className="er-q">{q.q}</MathText>

                  <div className="er-opts">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === d.correct;
                      const isPicked = oi === d.picked;
                      return (
                        <div key={oi}
                          className={'er-opt' + (isCorrect ? ' correct' : '') + (isPicked && !isCorrect ? ' wrong' : '')}>
                          <span className="er-opt-key">{String.fromCharCode(65 + oi)}</span>
                          <MathText>{opt}</MathText>
                          {isPicked && <em>Bạn chọn</em>}
                          {isCorrect && !isPicked && <em className="erx-right">Đáp án đúng</em>}
                        </div>
                      );
                    })}
                    {d.picked === -1 && <p className="er-skipped">Bạn chưa trả lời câu này</p>}
                  </div>

                  {q.explain && (
                    <div className="erx-explain">
                      <b>Lời giải</b>
                      <MathText as="div">{q.explain}</MathText>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="er-actions">
          <button className="td-btn primary big" onClick={onExit} type="button">Về trang chủ</button>
        </div>
      </div>
    </div>
  );
}
