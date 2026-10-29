/* ============================================================
   PracticeRunner.jsx — PHIÊN LUYỆN / ÔN TẬP THEO CHƯƠNG
   ------------------------------------------------------------
   Hai chế độ:
     • fresh  — luyện câu mới trong chương (ngân hàng giáo viên + bộ biên soạn)
     • review — ôn lại ĐÚNG những câu từng trả lời sai (lấy từ lịch sử
                phiên luyện trên thiết bị), thiếu thì bù bằng câu cùng chương.
   Hỗ trợ lọc theo mức độ: 'all' | 'nb' (Nhận biết) | 'th' (Thông hiểu) | 'vd' (Vận dụng).
   Kết quả ghi vào roadmapStore và hiển thị ngay mức thay đổi điểm
   thành thạo trước/sau + phân tích chi tiết từng câu.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPracticeQuestions, loadReviewQuestions, loadQuestionsByIds } from '../../lib/roadmapEvidence.js';
import { readStore, saveSession, sessionsToEvents } from '../../lib/roadmapStore.js';
import { masteryOf, questionStats, reviewQueue, summarizeEvents } from '../../lib/roadmapEngine.js';
import { LEVEL_META } from '../../data/roadmapExercises.js';
import { recordWrongAnswers } from '../../lib/wrongQuestionService.js';
import { recordActivity } from '../../lib/progress.js';
import { recordGamificationResult } from '../../hooks/useGamification.js';
import { IconClose, IconPin, IconBook, IconBulb, IconTrophy } from '../Icons.jsx';

const fmtTimer = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export default function PracticeRunner({
  chapterId, chapterName, uid, onDone, onClose, onAi,
  mode = 'fresh', size = 10, level = 'all',
}) {
  const [state, setState] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [priorStats, setPriorStats] = useState({});
  const [beforeScore, setBeforeScore] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);
  const startedAt = useRef(Date.now());
  const alive = useRef(true);
  const saved = useRef(false);   // chặn ghi phiên hai lần (Enter vừa chạy phím tắt vừa kích hoạt nút)
  const runId = useRef(0);

  const load = useCallback((customIds = null) => {
    runId.current += 1;
    const myRun = runId.current;
    setState('loading');
    setError(null);
    setIdx(0);
    setPicked(null);
    setAnswers([]);
    setResult(null);
    setConfirmClose(false);
    setElapsedSec(0);
    saved.current = false;
    startedAt.current = Date.now();

    const sessions = readStore(uid).sessions || [];
    const events = sessionsToEvents(sessions);
    const stats = questionStats(events);
    setPriorStats(stats);
    const before = summarizeEvents(events)[chapterId];
    setBeforeScore(masteryOf(before).score);

    const task = Array.isArray(customIds) && customIds.length
      ? loadQuestionsByIds(customIds)
      : mode === 'review'
        ? (() => {
          const queue = reviewQueue(stats, { topicId: chapterId, limit: size });
          return loadReviewQuestions(chapterId, { wrongIds: queue.map((q) => q.qid), limit: size, level });
        })()
        : loadPracticeQuestions(chapterId, { limit: size, seenIds: new Set(Object.keys(stats)), level });

    task
      .then((r) => {
        if (!alive.current || myRun !== runId.current) return;
        if (r.error && !r.questions.length) { setError(r.error); setState('error'); return; }
        if (!r.questions.length) { setState('empty'); return; }
        setQuestions(r.questions);
        startedAt.current = Date.now();
        setState('run');
      })
      .catch((e) => {
        if (!alive.current || myRun !== runId.current) return;
        setError(e?.message || 'Lỗi không xác định');
        setState('error');
      });
  }, [chapterId, mode, size, level, uid]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; };
  }, [load]);

  /* Đồng hồ đếm thời gian làm bài */
  useEffect(() => {
    if (state !== 'run') return undefined;
    const t = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  const q = questions[idx] || null;

  const pick = useCallback((optionIndex) => {
    if (picked !== null || !q) return;
    setPicked(optionIndex);
    setAnswers((prev) => [...prev, { qid: q.id, ok: optionIndex === q.correct, picked: optionIndex }]);
  }, [picked, q]);

  const next = useCallback(() => {
    if (picked === null || saved.current) return;
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setPicked(null);
      return;
    }
    saved.current = true;
    const correct = answers.filter((a) => a.ok).length;
    const durationMs = Date.now() - startedAt.current;
    const rec = saveSession(uid, {
      topicId: chapterId,
      total: questions.length,
      correct,
      durationMs,
      source: mode === 'review' ? 'review' : 'practice',
      answers: answers.map((a) => ({ qid: a.qid, ok: a.ok })),
    });

    /* Lưu các câu sai vào Sổ tay lỗi dùng chung (WrongNotebook) */
    try {
      const wrongItems = questions.map((q, i) => {
        const a = answers[i];
        return {
          question: q,
          userPicked: a ? a.picked : null,
          isCorrect: a ? a.ok : false,
          examTitle: `Luyện chuyên đề (${chapterId})`,
          examId: chapterId,
          source: `roadmap:${chapterId}`,
          topicId: chapterId,
        };
      }).filter((it) => !it.isCorrect);
      recordWrongAnswers(uid, wrongItems);
    } catch (err) {
      console.warn('[PracticeRunner] recordWrongAnswers error:', err);
    }

    /* Ghi nhận hoạt động vào Trang chủ & Gamification XP */
    try {
      recordActivity({ type: 'practice', title: `Luyện ${chapterId}`, hash: 'roadmap', count: 1 });
      recordGamificationResult(uid, {
        correctCount: correct,
        wrongCount: Math.max(0, questions.length - correct),
      });
    } catch { /* ignore */ }

    /* Điểm thành thạo sau khi ghi — dùng chính dữ liệu vừa lưu */
    const after = masteryOf(summarizeEvents(sessionsToEvents(readStore(uid).sessions))[chapterId]).score;

    setResult({ correct, total: questions.length, durationMs, rec, before: beforeScore, after });
    setState('done');
    onDone?.(rec);
  }, [picked, idx, questions.length, answers, uid, chapterId, mode, beforeScore, onDone]);

  /* Phím tắt: 1–9 chọn đáp án, Enter sang câu tiếp (có dependency array chuẩn tránh leak) */
  useEffect(() => {
    if (state !== 'run') return undefined;
    const onKey = (e) => {
      if (confirmClose) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target && e.target.tagName;
      if (e.key === 'Enter' && (tag === 'BUTTON' || tag === 'A')) return;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (/^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (q && i < q.options.length) pick(i);
      } else if (e.key === 'Enter' && picked !== null) {
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, confirmClose, q, picked, pick, next]);

  const handleRequestClose = () => {
    if (state === 'run' && answers.length > 0) {
      setConfirmClose(true);
      return;
    }
    onClose?.();
  };

  const delta = result && result.before !== null && result.after !== null
    ? result.after - result.before
    : null;

  const wrongIdsInSession = questions
    .filter((_, i) => answers[i] && !answers[i].ok)
    .map((item) => item.id);

  const lvMeta = q ? LEVEL_META[q.level || q.difficulty] : null;
  const qHistory = q ? priorStats[q.id] : null;

  return (
    <div className="rm-practice" style={{ position: 'relative' }}>
      {confirmClose && (
        <div className="rm-confirm-overlay" role="alertdialog" aria-modal="true" aria-label="Xác nhận thoát phiên luyện">
          <div className="rm-confirm-box">
            <p><b>Bạn đang làm dở ({answers.length}/{questions.length} câu)</b></p>
            <small>Đóng bây giờ sẽ không lưu kết quả của phiên này. Bạn chắc chắn muốn thoát?</small>
            <div className="rm-confirm-actions">
              <button type="button" className="rm-btn" onClick={() => setConfirmClose(false)}>Làm tiếp</button>
              <button type="button" className="rm-btn primary" onClick={onClose}>Thoát</button>
            </div>
          </div>
        </div>
      )}

      <div className="rm-practice-head ns9-practice-head">
        <div>
          <small>
            {mode === 'review' ? 'Ôn câu từng sai · ' : 'Phòng luyện tập chuyên sâu · '}
            {chapterName}
            {level && level !== 'all' && LEVEL_META[level] ? ` · ${LEVEL_META[level].label}` : ''}
          </small>
          {state === 'run' && <b>Câu hỏi {idx + 1} / {questions.length}</b>}
          {state === 'loading' && <b>Đang chuẩn bị đề…</b>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {state === 'run' && (
            <span className="rm-session-timer ns9-timer-pill" aria-label="Thời gian đã làm">⏱ {fmtTimer(elapsedSec)}</span>
          )}
          <button type="button" className="rm-x ns9-quiz-exit-btn" onClick={handleRequestClose} aria-label="Đóng phần luyện tập" title="Quay lại">
            <IconClose size={18} />
          </button>
        </div>
      </div>

      {state === 'run' && (
        <>
          <div className="rm-practice-progress" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={idx + 1}>
            <i style={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>
          <div className="ns9-q-dots" aria-label="Tiến trình câu hỏi">
            {questions.map((item, qIndex) => {
              const ans = answers[qIndex];
              let dotCls = 'ns9-q-dot';
              if (qIndex === idx) dotCls += ' is-cur';
              if (ans) dotCls += ans.ok ? ' is-ok' : ' is-bad';
              return (
                <span key={item.id || qIndex} className={dotCls}>
                  {qIndex + 1}
                </span>
              );
            })}
          </div>
        </>
      )}

      {state === 'loading' && (
        <div className="rm-skel-wrap" role="status" aria-live="polite">
          <span className="rm-skel" style={{ height: 18, width: '70%' }} />
          <span className="rm-skel" style={{ height: 44 }} />
          <span className="rm-skel" style={{ height: 44 }} />
          <span className="rm-skel" style={{ height: 44 }} />
          <span className="rm-hint">Đang lấy câu hỏi của chương…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="rm-state err" role="alert">
          <b>Không tải được câu hỏi</b>
          <p>{error}</p>
          <button type="button" className="rm-btn" onClick={() => load()}>Thử lại</button>
        </div>
      )}

      {state === 'empty' && (
        <div className="rm-state">
          <b>{mode === 'review' ? 'Chưa có câu nào cần ôn ở chương này' : 'Không có câu hỏi phù hợp bộ lọc'}</b>
          <p>
            {mode === 'review'
              ? 'Bạn chưa từng trả lời sai câu nào thuộc chương này trên thiết bị này.'
              : 'Thử chọn mức độ "Tất cả" để lấy toàn bộ câu hỏi của chương.'}
          </p>
          <div className="rm-quiz-foot">
            <button type="button" className="rm-btn" onClick={onClose}>Đóng</button>
          </div>
        </div>
      )}

      {state === 'run' && q && (
        <div className="rm-quiz ns9-quiz-card">
          <div className="rm-quiz-history ns9-quiz-meta-row">
            {lvMeta && (
              <span className={`rm-badge tone-${lvMeta.tone} ns9-lv-pill`}>
                {lvMeta.label}
                {q.level === 'nb' ? ' · Mức 5.0–6.5đ' : q.level === 'th' ? ' · Mức 7.0–8.0đ' : q.level === 'vd' ? ' · Mức 8.5–10đ' : ''}
              </span>
            )}
            {q.tag && (
              <span className="ns9-q-skill-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IconPin size={12} /> {q.tag}
              </span>
            )}
            {qHistory && (
              <span className="ns9-q-hist-tag">Đã làm {qHistory.total} lần · Sai {qHistory.wrong} lần</span>
            )}
            {qHistory?.wrong > 0 && (
              <span className="rm-quiz-tag">↻ Từng sai {qHistory.wrong} lần</span>
            )}
          </div>

          <div className="ns9-quiz-qbox">
            <p className="rm-quiz-q ns9-quiz-q">{q.q}</p>
          </div>

          <div className="rm-quiz-opts ns9-quiz-opts" role="radiogroup" aria-label="Chọn đáp án">
            {q.options.map((text, i) => {
              const isPicked = picked === i;
              const isRight = picked !== null && i === q.correct;
              const cls = 'rm-quiz-opt ns9-quiz-opt'
                + (isPicked ? ' is-picked' : '')
                + (isRight ? ' is-right' : '')
                + (isPicked && i !== q.correct ? ' is-wrong' : '');
              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  role="radio"
                  aria-checked={isPicked}
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                >
                  <span className="rm-quiz-key ns9-quiz-key">{String.fromCharCode(65 + i)}</span>
                  <span className="ns9-opt-txt">{text}</span>
                  {isRight && <span className="rm-quiz-mark ok" aria-hidden="true">✓ Đúng</span>}
                  {isPicked && i !== q.correct && <span className="rm-quiz-mark bad" aria-hidden="true">✕ Sai</span>}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className={'rm-quiz-feedback ns9-quiz-solution' + (picked === q.correct ? ' ok' : ' bad')} role="status">
              <div className="ns9-sol-head">
                <b>{picked === q.correct ? '✓ Chính xác! Bạn nắm rất vững bản chất câu này' : '✕ Chưa chính xác'}</b>
                {picked !== q.correct && (
                  <span className="ns9-sol-correct-ans">
                    Đáp án đúng: <b>{String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}</b>
                  </span>
                )}
              </div>

              {q.explain && (
                <div className="ns9-sol-steps">
                  <span className="ns9-sol-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <IconBook size={14} /> Phân tích &amp; Lời giải chi tiết:
                  </span>
                  {String(q.explain)
                    .split(/\n|(?=• )/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((step, sIdx) => (
                      <p key={sIdx} className="ns9-sol-step-line">{step}</p>
                    ))}
                </div>
              )}

              {q.tip && (
                <div className="ns9-sol-tip">
                  <b style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <IconBulb size={14} /> Mẹo giải nhanh &amp; Bẫy cần tránh:
                  </b> <span>{q.tip}</span>
                </div>
              )}

              {onAi && (
                <div className="ns9-sol-actions">
                  <button
                    type="button"
                    className="rm-btn-ai-explain ns9-ai-deep-btn"
                    onClick={() => onAi('explain', q)}
                  >
                    ✦ Hỏi Gia sư ELEC AI phân tích sâu từng bước câu này
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="rm-quiz-foot ns9-quiz-foot">
            <span className="rm-hint">⌨ Phím <b>1–{Math.min(9, q.options.length)}</b> để chọn đáp án · Nhấn <b>Enter</b> để sang câu tiếp</span>
            <button type="button" className="rm-btn primary ns9-next-q-btn" onClick={next} disabled={picked === null}>
              {idx + 1 < questions.length ? 'Câu tiếp theo →' : 'Hoàn thành & Xem điểm →'}
            </button>
          </div>
        </div>
      )}

      {state === 'done' && result && (
        <div className="rm-done">
          {result.correct === result.total ? (
            <>
              <div className="rm-done-celebrate" aria-hidden="true" style={{ color: 'var(--amber, #f59e0b)' }}>
                <IconTrophy size={48} />
              </div>
              <p className="rm-done-msg perfect">Tuyệt đối! Bạn làm đúng cả {result.total} câu.</p>
            </>
          ) : result.correct / result.total >= 0.7 ? (
            <p className="rm-done-msg good">Rất tốt! Xem lại các câu sai bên dưới để đạt 100% ở lần tới.</p>
          ) : (
            <p className="rm-done-msg struggle">Đừng nản! Đọc kỹ giải thích từng câu sai rồi bấm &ldquo;Ôn ngay câu vừa sai&rdquo;.</p>
          )}

          <div className="rm-done-score">
            <b>{result.correct}/{result.total}</b>
            <span>câu đúng · {fmtTimer(Math.round(result.durationMs / 1000))}</span>
          </div>

          <div className="rm-done-delta">
            {result.after === null ? (
              <span>Đã ghi nhận {result.total} câu trả lời — cần tối thiểu 5 câu để tính điểm thành thạo.</span>
            ) : result.before === null ? (
              <span>Bằng chứng đầu tiên của chương: điểm thành thạo <b>{result.after}%</b>.</span>
            ) : (
              <span>
                Điểm thành thạo <b>{result.before}% → {result.after}%</b>
                {' '}
                <i className={delta > 0 ? 'up' : delta < 0 ? 'down' : ''}>
                  ({delta > 0 ? '+' : ''}{delta}%)
                </i>
              </span>
            )}
          </div>

          <ul className="rm-done-list">
            {questions.map((item, i) => {
              const a = answers[i];
              const pickedText = a && Number.isFinite(a.picked) ? item.options[a.picked] : null;
              const rightText = item.options[item.correct];
              return (
                <li key={item.id} className={a?.ok ? 'ok' : 'bad'}>
                  <div className="rm-done-q">
                    <span aria-hidden="true">{a?.ok ? '✓ ' : '✕ '}</span>
                    {item.q}
                  </div>
                  <div className="rm-done-ans">
                    {!a?.ok && pickedText && (
                      <span className="picked">Bạn chọn: {pickedText}</span>
                    )}
                    <span className="correct">Đáp án đúng: {rightText}</span>
                  </div>
                  {item.explain && (
                    <div className="rm-done-expl">{item.explain}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="rm-hint">
            Kết quả đã ghi vào tiến độ trên thiết bị này và dùng ngay cho mức thành thạo + lịch ôn.
          </p>
          <div className="rm-quiz-foot">
            {wrongIdsInSession.length > 0 && (
              <button
                type="button"
                className="rm-done-review-btn"
                onClick={() => load(wrongIdsInSession)}
              >
                ↻ Ôn ngay {wrongIdsInSession.length} câu vừa sai
              </button>
            )}
            <button type="button" className="rm-btn" onClick={() => load()}>Làm đề khác</button>
            <button type="button" className="rm-btn primary" onClick={onClose}>Xong</button>
          </div>
        </div>
      )}
    </div>
  );
}
