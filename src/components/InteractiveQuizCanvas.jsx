/* ============================================================
   InteractiveQuizCanvas.jsx — BẢNG TRẮC NGHIỆM TƯƠNG TÁC AI (STUDIO PRO)
   ------------------------------------------------------------
   • Chuẩn cấu trúc 3 phần thi THPT Quốc gia 2025–2026:
       - Phần I  (mcq):   Trắc nghiệm 4 phương án A–D
       - Phần II (tf):    Đúng / Sai 4 ý (a, b, c, d — thang 0.1 / 0.25 / 0.5 / 1.0)
       - Phần III (short): Trả lời ngắn nhập số (chấp nhận cả ',' và '.')
   • Hero Cobalt ELEC AI + Linh vật phản ứng động theo từng câu trả lời
   • Thanh điều hướng câu dạng nút số (1, 2, 3...) + XP & thanh tiến trình
   • Hỗ trợ phím tắt A/B/C/D (hoặc 1–4) & mũi tên ← / →
   • Footer ghim chặt đáy Canvas + nút Hỏi ELEC AI giải thích sâu hơn
   ============================================================ */
import { useState, useMemo, useCallback, useEffect } from 'react';
import MathText from './MathText.jsx';
import { gradeShortAnswer, gradeTfQuestion } from '../lib/aiQuizParser.js';
import { recordWrongAnswers } from '../lib/wrongQuestionService.js';
import { recordGamificationResult } from '../hooks/useGamification.js';
import { recordActivity } from '../lib/progress.js';
import '../styles/interactive-quiz-canvas.css';

/* Vector SVG Icons sắc nét (Zero Emoji) */
const IconClose = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const IconShare = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IconCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevron = ({ size = 14, open = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconSparkles = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
  </svg>
);

const IconBulb = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z" />
  </svg>
);

const IconNotebook = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="14" y2="10" />
  </svg>
);

const IconArrowLeft = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconArrowRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconRefresh = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

function getQuestionType(q) {
  if (!q) return 'mcq';
  if (q.type === 'tf' || (Array.isArray(q.statements) && q.statements.length >= 2)) return 'tf';
  if (q.type === 'short' || (q.answer !== undefined && !Array.isArray(q.options))) return 'short';
  return 'mcq';
}

function getPartLabel(type) {
  if (type === 'tf') return 'Phần II · Đúng / Sai 4 ý';
  if (type === 'short') return 'Phần III · Trả lời ngắn';
  return 'Phần I · Trắc nghiệm A–D';
}

export default function InteractiveQuizCanvas({ quiz, onClose, onAskAi = null, uid = '' }) {
  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const [activeIdx, setActiveIdx] = useState(0);
  // { [idx]: { type, picked, isCorrect, score, rightCount, total } }
  const [userAnswers, setUserAnswers] = useState({});
  // Drafts chưa nộp cho Phần II (tf) và Phần III (short)
  const [tfDrafts, setTfDrafts] = useState({});
  const [shortDrafts, setShortDrafts] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [mascotPopKey, setMascotPopKey] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
    setUserAnswers({});
    setTfDrafts({});
    setShortDrafts({});
    setShowHint(false);
    setIsCompleted(false);
  }, [quiz]);

  const curQ = questions[activeIdx] || questions[0];
  const curType = getQuestionType(curQ);
  const curAns = userAnswers[activeIdx];
  const hasAnsweredCur = curAns !== undefined;

  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = useMemo(
    () => Object.values(userAnswers).filter((a) => a.isCorrect).length,
    [userAnswers]
  );
  const wrongCount = useMemo(
    () => Object.values(userAnswers).filter((a) => !a.isCorrect).length,
    [userAnswers]
  );
  const totalXp = useMemo(
    () => Object.values(userAnswers).reduce((sum, a) => sum + Math.round((a.score ?? (a.isCorrect ? 1 : 0)) * 10), 0),
    [userAnswers]
  );
  const accuracyPct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  const saveWrongNote = useCallback((q, userPickedLabel, correctLabel) => {
    try {
      recordWrongAnswers(uid || 'guest', [{
        question: {
          id: `ai_quiz_${Date.now()}_${activeIdx}`,
          content: q.question,
          options: q.options || (q.statements || []).map((s, idx) => `${String.fromCharCode(97 + idx)}) ${s.text}`),
          explanation: q.explanation,
          correctAnswer: correctLabel,
        },
        userPicked: userPickedLabel,
        isCorrect: false,
        examTitle: quiz.title || 'Bài tập AI',
        source: 'ai-interactive-quiz',
        topicId: quiz.subject || 'ai-quiz',
      }]);
    } catch (e) {
      console.warn('[InteractiveQuizCanvas] Lưu câu sai lỗi:', e);
    }
  }, [activeIdx, quiz, uid]);

  // Phần I: Trắc nghiệm A–D
  const handlePickOption = useCallback((optIdx) => {
    if (!curQ || hasAnsweredCur || curType !== 'mcq') return;

    const isCorrect = optIdx === curQ.correct;
    setUserAnswers((prev) => ({
      ...prev,
      [activeIdx]: { type: 'mcq', picked: optIdx, isCorrect, score: isCorrect ? 1 : 0 },
    }));
    setMascotPopKey((k) => k + 1);

    if (isCorrect) {
      showToast('Chính xác! +10 XP');
    } else {
      saveWrongNote(curQ, curQ.options[optIdx], curQ.options[curQ.correct] || curQ.correct);
      showToast('Chưa đúng — Đã lưu vào Sổ tay lỗi sai!');
    }
  }, [activeIdx, curQ, curType, hasAnsweredCur, saveWrongNote, showToast]);

  // Phần II: Đúng / Sai 4 ý
  const handleToggleTf = (stmtIdx, val) => {
    if (hasAnsweredCur) return;
    setTfDrafts((prev) => ({
      ...prev,
      [activeIdx]: { ...(prev[activeIdx] || {}), [stmtIdx]: val },
    }));
  };

  const handleSubmitTf = () => {
    if (!curQ || hasAnsweredCur || curType !== 'tf') return;
    const draft = tfDrafts[activeIdx] || {};
    const statements = curQ.statements || [];
    const graded = gradeTfQuestion(draft, statements);
    const isCorrect = graded.isAllCorrect;

    setUserAnswers((prev) => ({
      ...prev,
      [activeIdx]: {
        type: 'tf',
        picked: draft,
        isCorrect,
        score: graded.score,
        rightCount: graded.rightCount,
        total: graded.total,
      },
    }));
    setMascotPopKey((k) => k + 1);

    const xpEarned = Math.round(graded.score * 10);
    if (isCorrect) {
      showToast(`Đúng trọn ${graded.total}/${graded.total} ý! +10 XP`);
    } else {
      const pickedSummary = statements
        .map((_, i) => `${String.fromCharCode(97 + i)}:${draft[i] ? 'Đ' : 'S'}`)
        .join(' · ');
      const correctSummary = statements
        .map((s, i) => `${String.fromCharCode(97 + i)}:${s.correct ? 'Đ' : 'S'}`)
        .join(' · ');
      saveWrongNote(curQ, pickedSummary, correctSummary);
      showToast(`Đúng ${graded.rightCount}/${graded.total} ý (+${xpEarned} XP) — Đã lưu Sổ tay lỗi sai`);
    }
  };

  // Phần III: Trả lời ngắn
  const handleSubmitShort = (e) => {
    if (e) e.preventDefault();
    if (!curQ || hasAnsweredCur || curType !== 'short') return;
    const raw = (shortDrafts[activeIdx] || '').trim();
    if (!raw) return;

    const isCorrect = gradeShortAnswer(raw, curQ.answer, curQ.tolerance);
    setUserAnswers((prev) => ({
      ...prev,
      [activeIdx]: { type: 'short', picked: raw, isCorrect, score: isCorrect ? 1 : 0 },
    }));
    setMascotPopKey((k) => k + 1);

    if (isCorrect) {
      showToast('Đáp số chính xác! +10 XP');
    } else {
      saveWrongNote(curQ, raw, `${curQ.answer}${curQ.unit ? ` ${curQ.unit}` : ''}`);
      showToast('Chưa khớp đáp số — Đã lưu vào Sổ tay lỗi sai!');
    }
  };

  const handleFinish = useCallback(() => {
    setIsCompleted(true);
    try {
      recordGamificationResult(uid || 'guest', {
        correctCount,
        wrongCount: questions.length - correctCount,
      });
      recordActivity({
        type: 'quiz',
        title: quiz.title || 'Trắc nghiệm tương tác AI',
        hash: 'ai',
        count: 1,
      });
    } catch (e) {
      console.warn('[InteractiveQuizCanvas] Hoàn thành tích điểm lỗi:', e);
    }
  }, [correctCount, questions.length, quiz, uid]);

  // Phím tắt A-D / 1-4 (cho MCQ) & mũi tên ← →
  useEffect(() => {
    if (isCompleted || !curQ) return undefined;
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'arrowleft' && activeIdx > 0) {
        e.preventDefault();
        setActiveIdx((i) => i - 1);
        setShowHint(false);
      } else if (key === 'arrowright' && activeIdx < questions.length - 1) {
        e.preventDefault();
        setActiveIdx((i) => i + 1);
        setShowHint(false);
      } else if (!hasAnsweredCur && curType === 'mcq') {
        const letterMap = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
        if (key in letterMap && letterMap[key] < (curQ.options?.length || 0)) {
          e.preventDefault();
          handlePickOption(letterMap[key]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIdx, curQ, curType, handlePickOption, hasAnsweredCur, isCompleted, questions.length]);

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(
        `Bộ câu hỏi: ${quiz.title}\n${questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}`
      );
      setCopied(true);
      showToast('Đã sao chép bộ câu hỏi vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không sao chép được.');
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setTfDrafts({});
    setShortDrafts({});
    setActiveIdx(0);
    setIsCompleted(false);
    setShowHint(false);
  };

  const handleAskDeepExplain = () => {
    if (!onAskAi || !curQ) return;
    if (curType === 'tf') {
      const summary = (curQ.statements || [])
        .map((s, idx) => `${String.fromCharCode(97 + idx)}) ${s.text} [${s.correct ? 'Đúng' : 'Sai'}]`)
        .join('\n');
      onAskAi(`Hãy giải thích chi tiết từng ý Đúng/Sai và bẫy cần tránh cho câu hỏi:\n"${curQ.question}"\n${summary}`);
      return;
    }
    if (curType === 'short') {
      onAskAi(`Hãy giải thích chi tiết từng bước tính và bẫy đổi đơn vị cho câu trả lời ngắn:\n"${curQ.question}"\nĐáp số chuẩn: ${curQ.answer}${curQ.unit ? ` ${curQ.unit}` : ''}.`);
      return;
    }
    const correctLetter = String.fromCharCode(65 + (curQ.correct || 0));
    onAskAi(
      `Hãy giải thích sâu hơn và chỉ rõ bẫy cần tránh cho câu hỏi sau:\n"${curQ.question}"\nĐáp án đúng là ${correctLetter}: ${curQ.options?.[curQ.correct] || ''}.`
    );
  };

  const handleAskMoreQuiz = () => {
    if (!onAskAi) return;
    onAskAi(`Tạo thêm cho mình 5 câu luyện tập chuẩn THPT 2025 (gồm cả Trắc nghiệm A–D, Đúng/Sai 4 ý và Trả lời ngắn) xoay quanh chủ đề "${quiz.title || 'KHTN'}" kèm lời giải bẫy chi tiết.`);
  };

  if (!questions.length) return null;

  const headerMascot = isCompleted
    ? (accuracyPct >= 80
      ? { src: '/img/elec/elec-super-saiyan.png', mood: 'Xuất sắc! Phong độ đỉnh cao' }
      : accuracyPct >= 50
        ? { src: '/img/elec/elec-celebrate.png', mood: 'Khá tốt! Ôn lại vài câu sai nhé' }
        : { src: '/img/elec/elec-fighting.png', mood: 'Cố lên! Thử lại để bứt phá' })
    : hasAnsweredCur
      ? (curAns.isCorrect
        ? { src: '/img/elec/elec-celebrate.png', mood: 'Chuẩn xác! +10 XP' }
        : { src: '/img/elec/elec-plead.png', mood: 'Dính bẫy rồi! Xem lời giải bên dưới nhé' })
      : showHint
        ? { src: '/img/elec/elec-wink.png', mood: 'Mẹo nhỏ từ bé ELEC!' }
        : { src: '/img/elec/elec-think.png', mood: 'Đọc kỹ đề để tránh bẫy nhé!' };

  const curTfDraft = tfDrafts[activeIdx] || {};
  const tfAllPicked = curType === 'tf' && (curQ.statements || []).every((_, idx) => curTfDraft[idx] !== undefined);
  const curShortVal = shortDrafts[activeIdx] || '';

  return (
    <div className="iqc-shell" role="region" aria-label="Bảng trắc nghiệm tương tác ELEC AI">
      {/* 1. HEADER STUDIO + LINH VẬT ELEC */}
      <div className="iqc-header">
        <div className="iqc-header-left">
          <div className="iqc-mascot-wrap">
            <img
              key={mascotPopKey}
              src={headerMascot.src}
              alt="Linh vật ELEC AI"
              className={`iqc-mascot-img ${mascotPopKey > 0 ? 'is-pop' : ''}`}
              width="42"
              height="42"
            />
          </div>
          <div className="iqc-title-block">
            <div className="iqc-kicker-row">
              <span className="iqc-kicker">
                <IconSparkles size={11} />
                ELEC QUIZ CANVAS
              </span>
              <span className="iqc-mood-chip">{headerMascot.mood}</span>
            </div>
            <h2 className="iqc-title" title={quiz.title}>{quiz.title}</h2>
          </div>
        </div>

        <div className="iqc-header-actions">
          <button
            type="button"
            className={`iqc-ico-btn ${copied ? 'is-copied' : ''}`}
            onClick={handleShare}
            title="Sao chép bộ câu hỏi"
            aria-label="Sao chép bộ câu hỏi"
          >
            {copied ? <IconCheck size={16} /> : <IconShare size={16} />}
          </button>
          <button
            type="button"
            className="iqc-ico-btn"
            onClick={onClose}
            title="Đóng bảng trắc nghiệm"
            aria-label="Đóng bảng trắc nghiệm"
          >
            <IconClose size={17} />
          </button>
        </div>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG CÂU HỎI DẠNG PILL + ĐIỂM LIVE */}
      <div className="iqc-subbar">
        <div className="iqc-subbar-top">
          <div className="iqc-q-pills" role="tablist" aria-label="Chọn câu hỏi">
            {questions.map((qItem, qIdx) => {
              const ans = userAnswers[qIdx];
              const qType = getQuestionType(qItem);
              let cls = 'iqc-q-pill';
              if (ans !== undefined) cls += ans.isCorrect ? ' is-correct' : ' is-wrong';
              if (!isCompleted && qIdx === activeIdx) cls += ' is-active';
              return (
                <button
                  key={qIdx}
                  type="button"
                  role="tab"
                  aria-selected={!isCompleted && qIdx === activeIdx}
                  className={cls}
                  onClick={() => {
                    setIsCompleted(false);
                    setActiveIdx(qIdx);
                    setShowHint(false);
                  }}
                  title={`Câu ${qIdx + 1} (${getPartLabel(qType)})`}
                >
                  {qIdx + 1}
                </button>
              );
            })}
          </div>

          <div className="iqc-metrics">
            <span className="iqc-metric correct" title="Số câu làm đúng hoàn toàn">
              <IconCheck size={12} /> {correctCount}
            </span>
            <span className="iqc-metric wrong" title="Số câu cần ôn lại">
              <IconX size={12} /> {wrongCount}
            </span>
            <span className="iqc-metric xp" title="Kinh nghiệm tích lũy">
              +{totalXp} XP
            </span>
          </div>
        </div>

        <div className="iqc-progress-rail" aria-label={`Đã làm ${answeredCount}/${questions.length} câu`}>
          <div className="iqc-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* 3. NỘI DUNG CHÍNH */}
      {!isCompleted ? (
        <>
          <div className="iqc-body">
            <div key={activeIdx} className="iqc-stage">
              {/* Thẻ đề bài nổi sắc nét */}
              <div className="iqc-question-card">
                <div className="iqc-q-meta">
                  <div className="iqc-q-badges-group">
                    <span className="iqc-q-badge">
                      Câu {activeIdx + 1} / {questions.length}
                    </span>
                    <span className={`iqc-part-tag type-${curType}`}>
                      {getPartLabel(curType)}
                    </span>
                  </div>
                  <span
                    className={`iqc-q-status ${
                      hasAnsweredCur ? (curAns.isCorrect ? 'is-correct' : 'is-wrong') : ''
                    }`}
                  >
                    {hasAnsweredCur
                      ? (curType === 'tf'
                        ? `Đúng ${curAns.rightCount}/${curAns.total} ý · +${Math.round((curAns.score || 0) * 10)} XP`
                        : curAns.isCorrect
                          ? 'Chính xác · +10 XP'
                          : 'Chưa đúng · Đã lưu Sổ tay')
                      : curType === 'tf'
                        ? 'Chọn Đúng hoặc Sai cho cả 4 ý'
                        : curType === 'short'
                          ? 'Nhập đáp số rồi bấm Kiểm tra'
                          : 'Chọn 1 đáp án đúng nhất'}
                  </span>
                </div>

                <div className="iqc-question-text">
                  <MathText text={curQ.question} />
                </div>
              </div>

              {/* PHẦN I: 4 PHƯƠNG ÁN A, B, C, D */}
              {curType === 'mcq' && (
                <div className="iqc-options">
                  {curQ.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    let stateCls = '';

                    if (hasAnsweredCur) {
                      if (i === curQ.correct) stateCls = 'is-correct';
                      else if (i === curAns.picked) stateCls = 'is-wrong';
                      else stateCls = 'is-muted';
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        className={`iqc-opt ${stateCls}`}
                        onClick={() => handlePickOption(i)}
                        disabled={hasAnsweredCur}
                      >
                        <span className="iqc-opt-letter">{letter}</span>
                        <span className="iqc-opt-text">
                          <MathText text={opt} />
                        </span>
                        {hasAnsweredCur && i === curQ.correct && (
                          <span className="iqc-opt-result-pill is-correct">
                            <IconCheck size={12} /> Đáp án đúng
                          </span>
                        )}
                        {hasAnsweredCur && i === curAns.picked && !curAns.isCorrect && (
                          <span className="iqc-opt-result-pill is-wrong">
                            <IconX size={12} /> Bạn chọn
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PHẦN II: ĐÚNG / SAI 4 Ý (a, b, c, d) */}
              {curType === 'tf' && (
                <div className="iqc-tf-list">
                  {(curQ.statements || []).map((stmt, sIdx) => {
                    const letter = String.fromCharCode(97 + sIdx);
                    const picked = hasAnsweredCur ? curAns.picked?.[sIdx] : curTfDraft[sIdx];
                    const rowRight = hasAnsweredCur && picked === Boolean(stmt.correct);
                    const rowCls = hasAnsweredCur ? (rowRight ? 'is-correct' : 'is-wrong') : '';
                    return (
                      <div key={sIdx} className={`iqc-tf-row ${rowCls}`}>
                        <span className="iqc-tf-letter">{letter})</span>
                        <div className="iqc-tf-text">
                          <MathText text={stmt.text} />
                          {hasAnsweredCur && (
                            <small className={`iqc-tf-key ${rowRight ? 'is-ok' : 'is-err'}`}>
                              Đáp án chuẩn: {stmt.correct ? 'ĐÚNG' : 'SAI'}
                            </small>
                          )}
                        </div>
                        <div className="iqc-tf-toggles" role="group" aria-label={`Ý ${letter}`}>
                          <button
                            type="button"
                            className={`iqc-tf-btn ${picked === true ? 'is-picked' : ''} ${hasAnsweredCur && stmt.correct === true ? 'is-ans' : ''}`}
                            onClick={() => handleToggleTf(sIdx, true)}
                            disabled={hasAnsweredCur}
                          >
                            Đúng
                          </button>
                          <button
                            type="button"
                            className={`iqc-tf-btn ${picked === false ? 'is-picked' : ''} ${hasAnsweredCur && stmt.correct === false ? 'is-ans' : ''}`}
                            onClick={() => handleToggleTf(sIdx, false)}
                            disabled={hasAnsweredCur}
                          >
                            Sai
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {!hasAnsweredCur && (
                    <div className="iqc-tf-submit-row">
                      <span className="iqc-tf-scale-note">
                        Thang điểm GDPT 2025: 1 ý (0,1đ) · 2 ý (0,25đ) · 3 ý (0,5đ) · 4 ý (1,0đ)
                      </span>
                      <button
                        type="button"
                        className="iqc-btn primary"
                        onClick={handleSubmitTf}
                        disabled={!tfAllPicked}
                      >
                        <IconCheck size={14} />
                        Kiểm tra 4 ý
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PHẦN III: TRẢ LỜI NGẮN NHẬP SỐ */}
              {curType === 'short' && (
                <form className="iqc-short-card" onSubmit={handleSubmitShort}>
                  <label className="iqc-short-label" htmlFor={`iqc-short-${activeIdx}`}>
                    Nhập kết quả số của bạn (hỗ trợ cả dấu phẩy và dấu chấm):
                  </label>
                  <div className="iqc-short-input-row">
                    <input
                      id={`iqc-short-${activeIdx}`}
                      type="text"
                      inputMode="decimal"
                      className={`iqc-short-input ${hasAnsweredCur ? (curAns.isCorrect ? 'is-correct' : 'is-wrong') : ''}`}
                      value={hasAnsweredCur ? curAns.picked : curShortVal}
                      onChange={(e) => setShortDrafts((prev) => ({ ...prev, [activeIdx]: e.target.value }))}
                      placeholder="Ví dụ: 4,48 hoặc 12.5"
                      disabled={hasAnsweredCur}
                      autoComplete="off"
                    />
                    {curQ.unit && <span className="iqc-short-unit">{curQ.unit}</span>}
                    {!hasAnsweredCur && (
                      <button
                        type="submit"
                        className="iqc-btn primary"
                        disabled={!curShortVal.trim()}
                      >
                        Kiểm tra
                      </button>
                    )}
                  </div>
                  {hasAnsweredCur && (
                    <div className={`iqc-short-verdict ${curAns.isCorrect ? 'is-ok' : 'is-err'}`}>
                      {curAns.isCorrect ? <IconCheck size={14} /> : <IconX size={14} />}
                      <span>
                        {curAns.isCorrect
                          ? `Chính xác! Đáp số chuẩn: ${curQ.answer}${curQ.unit ? ` ${curQ.unit}` : ''}`
                          : `Chưa khớp — Đáp số chuẩn là: ${curQ.answer}${curQ.unit ? ` ${curQ.unit}` : ''}`}
                      </span>
                    </div>
                  )}
                </form>
              )}

              {/* Gợi ý từ bé ELEC */}
              {curQ.hint && (
                <div className="iqc-hint-wrap">
                  <button
                    type="button"
                    className="iqc-hint-btn"
                    onClick={() => setShowHint((v) => !v)}
                    aria-expanded={showHint}
                  >
                    <IconBulb size={14} />
                    <span>{showHint ? 'Ẩn gợi ý' : 'Xem gợi ý từ bé ELEC'}</span>
                    <IconChevron size={14} open={showHint} />
                  </button>
                  {showHint && (
                    <div className="iqc-hint-card">
                      <img src="/img/elec/elec-wink.png" alt="" aria-hidden="true" width="34" height="34" />
                      <div>
                        <MathText text={curQ.hint} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lời giải chi tiết sau khi trả lời */}
              {hasAnsweredCur && curQ.explanation && (
                <div className="iqc-explain-card">
                  <div className="iqc-explain-head">
                    <span className="iqc-explain-title">
                      <IconSparkles size={14} />
                      Lời giải chi tiết &amp; Soi bẫy
                    </span>
                  </div>
                  <div className="iqc-explain-body">
                    <MathText text={curQ.explanation} />
                  </div>
                  <div className="iqc-explain-foot">
                    {!curAns.isCorrect ? (
                      <span className="iqc-wrong-pill">
                        <IconNotebook size={13} />
                        Đã lưu tự động vào Sổ tay lỗi sai
                      </span>
                    ) : (
                      <span />
                    )}
                    {onAskAi && (
                      <button
                        type="button"
                        className="iqc-ask-ai-btn"
                        onClick={handleAskDeepExplain}
                      >
                        <IconSparkles size={13} />
                        Hỏi ELEC AI giải thích sâu hơn →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. FOOTER GHIM CHẶT ĐÁY CANVAS */}
          <div className="iqc-footer">
            <div className="iqc-footer-left">
              <span>Đã trả lời {answeredCount}/{questions.length} câu</span>
              <span className="iqc-kbd-hint">
                {curType === 'mcq' && <>· <kbd>A–D</kbd> chọn </>}
                · <kbd>←</kbd><kbd>→</kbd> chuyển câu
              </span>
            </div>

            <div className="iqc-footer-actions">
              <button
                type="button"
                className="iqc-btn secondary"
                onClick={() => {
                  if (activeIdx > 0) {
                    setActiveIdx(activeIdx - 1);
                    setShowHint(false);
                  }
                }}
                disabled={activeIdx === 0}
              >
                <IconArrowLeft size={14} />
                Quay lại
              </button>

              {activeIdx < questions.length - 1 ? (
                <button
                  type="button"
                  className="iqc-btn primary"
                  onClick={() => {
                    setActiveIdx(activeIdx + 1);
                    setShowHint(false);
                  }}
                >
                  Tiếp theo
                  <IconArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="iqc-btn primary"
                  onClick={handleFinish}
                >
                  <IconCheck size={14} />
                  Hoàn thành bài
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* 5. MÀN HÌNH HOÀN THÀNH VIP + LINH VẬT */
        <div className="iqc-completed">
          <div className="iqc-comp-card">
            <div className="iqc-comp-hero">
              <img
                src={headerMascot.src}
                alt="Linh vật ELEC chúc mừng"
                className="iqc-comp-mascot"
                width="92"
                height="92"
              />
              <h3>Hoàn thành bài trắc nghiệm!</h3>
              <p>{quiz.title}</p>
            </div>

            <div className="iqc-comp-body">
              <div className="iqc-comp-stats">
                <div className="iqc-comp-stat">
                  <b>{correctCount}/{questions.length}</b>
                  <span>Câu đúng</span>
                </div>
                <div className="iqc-comp-stat is-acc">
                  <b>{accuracyPct}%</b>
                  <span>Độ chính xác</span>
                </div>
                <div className="iqc-comp-stat is-xp">
                  <b>+{totalXp} XP</b>
                  <span>Điểm thưởng</span>
                </div>
              </div>

              <div className="iqc-review-strip">
                <small>Bấm vào số câu để xem lại lời giải chi tiết:</small>
                <div className="iqc-q-pills">
                  {questions.map((_, qIdx) => {
                    const ans = userAnswers[qIdx];
                    const cls = `iqc-q-pill ${ans ? (ans.isCorrect ? 'is-correct' : 'is-wrong') : ''}`;
                    return (
                      <button
                        key={qIdx}
                        type="button"
                        className={cls}
                        onClick={() => {
                          setIsCompleted(false);
                          setActiveIdx(qIdx);
                          setShowHint(false);
                        }}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {wrongCount > 0 && (
                <div className="iqc-comp-wrong-box">
                  <div className="iqc-comp-wb-left">
                    <IconNotebook size={17} />
                    <div>
                      <b>Đã lưu {wrongCount} câu cần ôn vào Sổ tay lỗi</b>
                      <span>Ôn lại ngay để vá lỗ hổng trước kỳ thi.</span>
                    </div>
                  </div>
                  <a href="#notebook" className="iqc-notebook-link" onClick={onClose}>
                    Mở Sổ tay →
                  </a>
                </div>
              )}

              <div className="iqc-comp-actions">
                <button type="button" className="iqc-btn secondary" onClick={handleReset}>
                  <IconRefresh size={14} />
                  Làm lại bộ đề
                </button>
                {onAskAi ? (
                  <button type="button" className="iqc-btn primary" onClick={handleAskMoreQuiz}>
                    <IconSparkles size={14} />
                    Tạo 5 câu chuẩn 2025 mới
                  </button>
                ) : (
                  <button type="button" className="iqc-btn primary" onClick={onClose}>
                    Quay lại chat AI
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NỔI */}
      {toastMsg && (
        <div className="iqc-toast" role="status">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
