import { useState, useEffect, useMemo } from 'react';
import { fetchExamQuestions, createAttempt, saveUserAnswer, submitAttempt } from '../lib/examApi.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ExamTaking({ exam, mode = 'practice', onExit }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [flags, setFlags] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(exam?.duration * 60 || 0);
  const [startedAt] = useState(Date.now());

  // Load questions + tạo attempt
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const qs = await fetchExamQuestions(exam.id);
        setQuestions(qs);
        const attempt = await createAttempt(exam.id, mode, user?.id);
        setAttemptId(attempt.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [exam.id, mode, user?.id]);

  // Countdown timer cho chế độ thi
  useEffect(() => {
    if (mode !== 'exam' || !questions.length) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, questions.length]);

  const total = questions.length;
  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  const timeFormat = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [timeLeft]);

  const toggleFlag = (id) => {
    setFlags((f) => {
      const n = new Set(f);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleAnswer = async (optionId) => {
    if (!q) return;
    const isCorrect = q.answers.find((a) => a.id === optionId)?.is_correct ?? false;
    const newAnswer = { selectedAnswerId: optionId, isCorrect };

    setAnswers((a) => ({ ...a, [current]: optionId }));

    if (attemptId) {
      try {
        await saveUserAnswer(attemptId, q.id, newAnswer);
      } catch (e) {
        console.error('Lưu câu trả lời lỗi:', e);
      }
    }
  };

  const handleSubmit = async () => {
    const timeSpent = Math.floor((Date.now() - startedAt) / 1000);
    let correct = 0, wrong = 0, blank = 0;

    questions.forEach((question, idx) => {
      const userAnswerId = answers[idx];
      if (!userAnswerId) {
        blank++;
      } else {
        const isCorrect = question.answers.find((a) => a.id === userAnswerId)?.is_correct;
        if (isCorrect) correct++; else wrong++;
      }
    });

    const score = total > 0 ? (correct / total) * 10 : 0;

    if (attemptId) {
      try {
        await submitAttempt(attemptId, { score, correct, wrong, blank, total, timeSpent });
      } catch (e) {
        console.error('Nộp bài lỗi:', e);
      }
    }

    onExit?.();
  };

  if (loading) return <div className="eb-loading">Đang tải câu hỏi…</div>;
  if (!q) return <div className="eb-empty"><p>Đề thi chưa có câu hỏi.</p></div>;

  return (
    <div className="et">
      <div className="et-head">
        <button className="et-back" onClick={onExit}>‹ Thoát</button>
        <div className="et-info">
          <span className="et-info-title">{exam.title}</span>
          <span className="et-info-mode">{mode === 'exam' ? 'Thi thử' : 'Luyện tập'}</span>
        </div>
        {mode === 'exam' && (
          <div className={'et-timer' + (timeLeft < 60 ? ' urgent' : '')}>
            <b>{timeFormat}</b>
          </div>
        )}
        <button className="et-submit" onClick={handleSubmit}>Nộp bài</button>
      </div>

      <div className="et-progress">
        <div className="et-progress-bar">
          <i style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
        <span className="et-progress-text">
          Đã trả lời <b>{answeredCount}</b> / <b>{total}</b> câu
        </span>
      </div>

      <div className="et-body">
        <div className="et-question">
          <div className="et-q-head">
            <span className="et-q-num">Câu {current + 1} / {total}</span>
            <button
              className={'et-flag' + (flags.has(current) ? ' on' : '')}
              onClick={() => toggleFlag(current)}
            >
              {flags.has(current) ? '★ Đã đánh dấu' : '☆ Đánh dấu'}
            </button>
          </div>

          <p className="et-q-text">{q.content}</p>

          {q.image_url && <img src={q.image_url} alt="" className="et-q-img" />}

          <div className="et-options">
            {q.answers.map((opt) => {
              const selected = answers[current] === opt.id;
              let cls = 'et-option';
              if (selected) cls += ' on';
              if (mode === 'practice' && selected) {
                cls += opt.is_correct ? ' correct' : ' wrong';
              }
              return (
                <button
                  key={opt.id}
                  className={cls}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={mode === 'practice' && selected}
                >
                  <span className="et-option-key">{opt.label}</span>
                  <span className="et-option-text">{opt.content}</span>
                </button>
              );
            })}
          </div>

          {mode === 'practice' && answers[current] && q.explanation && (
            <div className="et-explain">
              <b>Lời giải:</b>
              <p>{q.explanation}</p>
            </div>
          )}

          <div className="et-nav">
            <button
              className="et-nav-btn"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
            >‹ Câu trước</button>
            <button
              className="et-nav-btn primary"
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              disabled={current === total - 1}
            >Câu tiếp ›</button>
          </div>
        </div>

        <aside className="et-map">
          <p className="et-map-label">Bảng câu hỏi</p>
          <div className="et-map-grid">
            {questions.map((_, i) => {
              const isAnswered = answers[i] !== undefined;
              const isFlagged = flags.has(i);
              const isCurrent = i === current;
              return (
                <button
                  key={i}
                  className={
                    'et-map-cell' +
                    (isAnswered ? ' done' : '') +
                    (isFlagged ? ' flagged' : '') +
                    (isCurrent ? ' current' : '')
                  }
                  onClick={() => setCurrent(i)}
                >{i + 1}</button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}