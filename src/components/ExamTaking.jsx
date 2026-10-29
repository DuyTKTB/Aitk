import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchExamQuestions, createAttempt, saveUserAnswer, submitAttempt } from '../lib/examApi.js';
import { useAuth } from '../hooks/useAuth.jsx';

const IconStar = ({ size = 14, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function ExamTaking({ exam, mode = 'practice', onExit }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [flags, setFlags] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState((exam?.duration || 45) * 60);
  const [startedAt] = useState(Date.now());
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const qs = await fetchExamQuestions(exam.id);
        if (!alive) return;
        setQuestions(qs);
        const uid = user?.uid || user?.id;
        if (uid) {
          try {
            const attempt = await createAttempt(exam.id, mode, uid);
            if (!alive) return;
            setAttemptId(attempt.id);
          } catch (err) {
            console.error('Tạo lượt làm bài lỗi:', err);
            if (alive) setSaveError('Chưa lưu được bài làm này vào thống kê. Bạn vẫn làm bài bình thường.');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [exam.id, mode, user?.id, user?.uid]);

  const total = questions.length;
  const q = questions[current];
  const answeredCount = Object.keys(answers).length;

  const timeFormat = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [timeLeft]);

  /* ============ SUBMIT (useCallback để tránh stale closure) ============ */
  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

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
        setSaveError('Chưa lưu được kết quả. Kiểm tra mạng rồi bấm "Nộp bài" lại, hoặc thoát nếu không cần lưu.');
        setSubmitted(false);
        return;
      }
    }

    onExit?.();
  }, [submitted, startedAt, questions, answers, total, attemptId, onExit]);
  useEffect(() => {
    if (mode !== 'exam' || !questions.length) return undefined;
    if (submitted) return undefined;

    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setTimeout(() => handleSubmit(), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, questions.length, handleSubmit, submitted]);

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
        <button className="et-submit" onClick={handleSubmit} disabled={submitted}>
          {submitted ? 'Đang nộp…' : 'Nộp bài'}
        </button>
      </div>

      {saveError && (
        <div role="alert" style={{ margin: '.6rem 1rem 0', padding: '.6rem .9rem', borderRadius: 14, background: 'rgba(245,158,11,.14)', border: '1px solid rgba(245,158,11,.35)', color: '#92400e', fontSize: '.82rem', fontWeight: 600 }}>
          {saveError}
        </div>
      )}

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
              type="button"
            >
              <IconStar size={13} filled={flags.has(current)} />
              {flags.has(current) ? 'Đã đánh dấu' : 'Đánh dấu'}
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
                  type="button"
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
              type="button"
            >‹ Câu trước</button>
            <button
              className="et-nav-btn primary"
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              disabled={current === total - 1}
              type="button"
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
                  type="button"
                >{i + 1}</button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}