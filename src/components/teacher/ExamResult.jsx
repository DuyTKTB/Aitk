import '../styles/classroom.css';

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

export default function ExamResult({ exam, result, showAnswer, onExit }) {
  const noScore = result.score == null;
  const pct = !noScore && result.totalPoints > 0
    ? Math.round((result.score / result.totalPoints) * 100)
    : 0;
  const grade =
    pct >= 90 ? { label: 'Xuất sắc', color: '#16a34a' }
    : pct >= 70 ? { label: 'Tốt', color: '#2563eb' }
    : pct >= 50 ? { label: 'Trung bình', color: '#f59e0b' }
    : { label: 'Cần cố gắng', color: '#dc2626' };

  return (
    <div className="er-page">
      <div className="er-card">
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

        {showAnswer && result.detail && (
          <>
            <h3 className="er-h3">Chi tiết bài làm</h3>
            <ol className="er-list">
              {exam.questions.map((q, i) => {
                const d = result.detail[i];
                if (!d) return null;
                return (
                  <li key={i} className={d.isCorrect ? 'ok' : 'no'}>
                    <div className="er-list-head">
                      <span className="er-mark">{d.isCorrect ? <IcoCheck /> : <IcoX />}</span>
                      <b>Câu {i + 1}</b>
                      <span className="er-points">+{d.isCorrect ? (q.points || 1) : 0} điểm</span>
                    </div>
                    <p className="er-q">{q.q}</p>
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
                            <span>{opt}</span>
                            {isPicked && <em>Bạn chọn</em>}
                          </div>
                        );
                      })}
                      {d.picked === -1 && <p className="er-skipped">Bạn chưa trả lời câu này</p>}
                    </div>
                    {q.explain && (
                      <div
                        className="er-explain"
                        style={{
                          marginTop: '.6rem',
                          padding: '.65rem .85rem',
                          borderRadius: 12,
                          background: 'color-mix(in srgb, #2563eb 8%, transparent)',
                          borderLeft: '3px solid #2563eb',
                          fontSize: '.86rem',
                          lineHeight: 1.55,
                        }}
                      >
                        <b style={{ display: 'block', marginBottom: 2 }}>Lời giải</b>
                        <span style={{ whiteSpace: 'pre-wrap' }}>{q.explain}</span>
                      </div>
                    )}
                  </li>
                );
              })}
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