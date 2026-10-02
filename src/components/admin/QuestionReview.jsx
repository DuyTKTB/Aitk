import { useState } from 'react';

export default function QuestionReview({ questions, onSave, onBack }) {
  const [edited, setEdited] = useState(questions);

  const update = (idx, field, value) => {
    setEdited((qs) => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const remove = (idx) => {
    if (!confirm('Xóa câu này?')) return;
    setEdited((qs) => qs.filter((_, i) => i !== idx));
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    setEdited((qs) => qs.map((q, i) => {
      if (i !== qIdx) return q;
      return {
        ...q,
        options: q.options.map((o, j) => j === oIdx ? { ...o, [field]: value } : o),
      };
    }));
  };

  const addOption = (qIdx) => {
    setEdited((qs) => qs.map((q, i) => {
      if (i !== qIdx) return q;
      const nextLabel = String.fromCharCode(65 + q.options.length);
      return {
        ...q,
        options: [...q.options, { label: nextLabel, content: '' }],
      };
    }));
  };

  return (
    <div className="ad-review">
      <div className="ad-review-head">
        <h2>📝 Duyệt {edited.length} câu hỏi</h2>
        <div>
          <button className="ad-btn" onClick={onBack}>← Quay lại</button>
          <button className="ad-btn primary" onClick={() => onSave(edited)}>
            💾 Lưu {edited.length} câu
          </button>
        </div>
      </div>

      <p className="ad-hint">
        💡 Chỉnh sửa nội dung, đáp án, đánh dấu đáp án đúng. Nhấn <b>Lưu</b> để tạo đề mới.
      </p>

      {edited.map((q, qIdx) => (
        <div key={qIdx} className="ad-review-card">
          <div className="ad-review-card-head">
            <b>Câu {qIdx + 1}</b>
            <button className="ad-icon-btn danger" onClick={() => remove(qIdx)} title="Xóa câu">
              🗑
            </button>
          </div>

          <label>
            <span>Nội dung câu hỏi</span>
            <textarea
              value={q.content}
              onChange={(e) => update(qIdx, 'content', e.target.value)}
              rows={2}
            />
          </label>

          <div className="ad-review-options">
            <span className="ad-review-label">Đáp án (chọn radio = đáp án đúng)</span>
            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className="ad-review-opt">
                <input
                  type="radio"
                  name={`correct-${qIdx}`}
                  checked={q.correctAnswer === opt.label}
                  onChange={() => update(qIdx, 'correctAnswer', opt.label)}
                />
                <b>{opt.label}</b>
                <input
                  type="text"
                  value={opt.content}
                  onChange={(e) => updateOption(qIdx, oIdx, 'content', e.target.value)}
                />
              </div>
            ))}
            {q.options.length < 6 && (
              <button
                type="button"
                className="ad-btn"
                onClick={() => addOption(qIdx)}
                style={{ fontSize: '.75rem', padding: '.4rem .8rem' }}
              >
                + Thêm đáp án
              </button>
            )}
          </div>

          <label>
            <span>Lời giải</span>
            <textarea
              value={q.explanation || ''}
              onChange={(e) => update(qIdx, 'explanation', e.target.value)}
              rows={2}
            />
          </label>

          <div className="ad-review-meta">
            <span>Độ khó: <b>{q.difficulty || 'medium'}</b></span>
            <span>Chủ đề: <b>{q.topic || '—'}</b></span>
            <span>Đáp án đúng: <b>{q.correctAnswer}</b></span>
          </div>
        </div>
      ))}

      <div className="ad-form-actions">
        <button className="ad-btn" onClick={onBack}>← Quay lại</button>
        <button className="ad-btn primary" onClick={() => onSave(edited)}>
          💾 Lưu {edited.length} câu
        </button>
      </div>
    </div>
  );
}