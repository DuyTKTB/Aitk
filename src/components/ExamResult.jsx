import { useMemo } from 'react';

export default function ExamResult({ result, onRetry, onClose }) {
  const { exam, details, correct, total, score, timeSpent } = result;

  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  const blank = details.filter((d) => !d.userAnswerId).length;
  const wrong = total - correct - blank;

  const grade = useMemo(() => {
    if (score >= 9) return { label: 'Xuất sắc', cls: 'excellent' };
    if (score >= 7) return { label: 'Khá', cls: 'good' };
    if (score >= 5) return { label: 'Trung bình', cls: 'average' };
    return { label: 'Cần cố gắng', cls: 'poor' };
  }, [score]);

  return (
    <div className="er">
      <button className="er-back" onClick={onClose}>‹ Quay lại danh sách</button>

      <div className={'er-hero grade-' + grade.cls}>
        <div className="er-hero-content">
          <p className="er-hero-label">Kết quả</p>
          <b className="er-hero-score">{score.toFixed(1)}<i>/10</i></b>
          <p className="er-hero-grade">{grade.label}</p>
        </div>
        <div className="er-hero-stats">
          <div><b>{correct}/{total}</b><small>câu đúng</small></div>
          <div><b>{wrong}</b><small>câu sai</small></div>
          <div><b>{blank}</b><small>bỏ trống</small></div>
          <div><b>{minutes}′{String(seconds).padStart(2, '0')}″</b><small>thời gian</small></div>
        </div>
      </div>

      <h3 className="er-title">Chi tiết từng câu</h3>

      <div className="er-list">
        {details.map((d, i) => (
          <div key={i} className={'er-item' + (d.isCorrect ? ' ok' : ' bad')}>
            <div className="er-item-head">
              <span className="er-item-num">Câu {i + 1}</span>
              <span className={'er-item-status' + (d.isCorrect ? ' ok' : ' bad')}>
                {d.isCorrect ? '✓ Đúng' : d.userAnswerId ? '✗ Sai' : '— Bỏ trống'}
              </span>
            </div>
            <p className="er-item-q">{d.question.content}</p>
            <div className="er-item-answers">
              {d.userAnswerId ? (
                <div>
                  <span className="er-item-label">Bạn chọn</span>
                  <b className={d.isCorrect ? 'ok' : 'bad'}>
                    {d.userAnswer?.label}. {d.userAnswer?.content}
                  </b>
                </div>
              ) : (
                <div><span className="er-item-label">Bạn chưa trả lời</span></div>
              )}
              {!d.isCorrect && d.correctAnswer && (
                <div>
                  <span className="er-item-label">Đáp án đúng</span>
                  <b className="ok">
                    {d.correctAnswer.label}. {d.correctAnswer.content}
                  </b>
                </div>
              )}
            </div>
            {d.question.explanation && (
              <div className="er-item-explain">
                <span className="er-item-label">Lời giải</span>
                <p>{d.question.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="er-actions">
        <button className="er-btn primary" onClick={onRetry}>Làm lại</button>
        <button className="er-btn" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}