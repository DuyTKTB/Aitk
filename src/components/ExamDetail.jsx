import { useEffect, useState } from 'react';
import { fetchExamById, fetchExamQuestions } from '../lib/examApi.js';
import ExamTaking from './ExamTaking.jsx';

export default function ExamDetail({ examId, onBack }) {
  const [exam, setExam] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null); // 'practice' | 'exam'

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [e, qs] = await Promise.all([
          fetchExamById(examId),
          fetchExamQuestions(examId),
        ]);
        setExam(e);
        setQuestionCount(qs.length);
      } catch (err) {
        console.error(err);
        setError('Không tải được đề thi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  if (loading) {
    return <div className="eb-detail-loading">Đang tải đề thi…</div>;
  }

  if (error || !exam) {
    return (
      <div className="eb-empty">
        <p>{error || 'Không tìm thấy đề thi.'}</p>
        <button onClick={onBack}>Quay lại</button>
      </div>
    );
  }

  if (mode) {
    return (
      <ExamTaking
        exam={exam}
        mode={mode}
        onExit={() => setMode(null)}
      />
    );
  }

  return (
    <div className="eb-detail">
      <button className="eb-detail-back" onClick={onBack}>‹ Quay lại</button>

      <header className="eb-detail-head">
        <h1>{exam.title}</h1>
        {exam.description && <p>{exam.description}</p>}
      </header>

      <div className="eb-detail-meta">
        <div><b>{questionCount}</b><small>câu hỏi</small></div>
        <div><b>{exam.duration}</b><small>phút</small></div>
        <div><b>{exam.grade?.name}</b><small>lớp</small></div>
        <div><b>{exam.subject?.name}</b><small>môn</small></div>
      </div>

      <section className="eb-detail-modes">
        <h2>Chọn chế độ</h2>
        <div className="eb-mode-grid">
          <button className="eb-mode-card" onClick={() => setMode('practice')}>
            <b>Luyện tập</b>
            <span>Làm từng câu, xem đáp án & lời giải ngay sau khi trả lời</span>
          </button>
          <button className="eb-mode-card" onClick={() => setMode('exam')}>
            <b>Thi thử</b>
            <span>Có đồng hồ đếm ngược, không xem đáp án trong khi làm</span>
          </button>
        </div>
      </section>
    </div>
  );
}