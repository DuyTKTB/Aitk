/* ============================================================
   InteractiveQuizCanvas.jsx — Bảng Canvas Trắc Nghiệm Tương Tác AI
   ------------------------------------------------------------
   Chuẩn giao diện Google Gemini Canvas & Apple Glassmorphism:
     1. Khung hiển thị câu hỏi trắc nghiệm tương tác trực tiếp
     2. Tự động chấm điểm thời gian thực (✓ đúng / ✕ sai)
     3. TỰ ĐỘNG TÍCH ĐIỂM GAMIFICATION (+10 XP mỗi câu đúng)
     4. TỰ ĐỘNG LƯU CÂU LÀM SAI VÀO SỔ TAY LỖI SAI (Wrong Notebook)
     5. Hỗ trợ KaTeX / MathText cho công thức Toán & Hóa học
     6. Accordion "Gợi ý ∨" và "Lời giải chi tiết"
   ============================================================ */
import { useState, useMemo, useCallback } from 'react';
import MathText from './MathText.jsx';
import { recordWrongAnswers } from '../lib/wrongQuestionService.js';
import { recordGamificationResult } from '../hooks/useGamification.js';
import { recordActivity } from '../lib/progress.js';

/* Icon SVG 100% nét mảnh */
const IconClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const IconShare = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IconChevron = ({ size = 14, open = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconSparkles = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
  </svg>
);

const IconNotebook = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="10" x2="6.01" y2="10" />
    <line x1="6" y1="14" x2="6.01" y2="14" />
  </svg>
);

const IconTrophy = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default function InteractiveQuizCanvas({ quiz, onClose, uid = '' }) {
  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [idx]: { picked: number, isCorrect: boolean } }
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const curQ = questions[activeIdx] || questions[0];
  const curAns = userAnswers[activeIdx];
  const hasAnsweredCur = curAns !== undefined;

  // Điểm số thời gian thực
  const correctCount = useMemo(
    () => Object.values(userAnswers).filter((a) => a.isCorrect).length,
    [userAnswers]
  );
  const wrongCount = useMemo(
    () => Object.values(userAnswers).filter((a) => !a.isCorrect).length,
    [userAnswers]
  );

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  // Xử lý khi học sinh chọn một đáp án
  const handlePickOption = (optIdx) => {
    if (hasAnsweredCur) return;

    const isCorrect = optIdx === curQ.correct;
    const nextAnswers = {
      ...userAnswers,
      [activeIdx]: { picked: optIdx, isCorrect },
    };
    setUserAnswers(nextAnswers);

    if (isCorrect) {
      showToast('✓ Chính xác! +10 XP');
    } else {
      // TỰ ĐỘNG LƯU VÀO SỔ TAY LỖI SAI NGAY LẬP TỨC
      try {
        recordWrongAnswers(uid || 'guest', [{
          question: {
            id: `ai_quiz_${Date.now()}_${activeIdx}`,
            content: curQ.question,
            options: curQ.options,
            explanation: curQ.explanation,
            correctAnswer: curQ.options[curQ.correct] || curQ.correct,
          },
          userPicked: curQ.options[optIdx],
          isCorrect: false,
          examTitle: quiz.title || 'Bài tập AI',
          source: 'ai-interactive-quiz',
          topicId: quiz.subject || 'ai-quiz',
        }]);
        showToast('✕ Chưa đúng — Đã tự động lưu vào Sổ tay lỗi sai!');
      } catch (e) {
        console.warn('[InteractiveQuizCanvas] Lưu câu sai lỗi:', e);
      }
    }
  };

  // Hoàn thành toàn bộ bài thi & tự động tích điểm
  const handleFinish = () => {
    setIsCompleted(true);
    try {
      // 1. Tự động cộng điểm kinh nghiệm Gamification
      recordGamificationResult(uid || 'guest', {
        correctCount,
        wrongCount: questions.length - correctCount,
      });

      // 2. Ghi nhận hoạt động vào Trang chủ & Streak
      recordActivity({
        type: 'quiz',
        title: quiz.title || 'Trắc nghiệm tương tác AI',
        hash: 'ai',
        count: 1,
      });
    } catch (e) {
      console.warn('[InteractiveQuizCanvas] Hoàn thành tích điểm lỗi:', e);
    }
  };

  // Chia sẻ bộ câu hỏi
  const handleShare = () => {
    try {
      navigator.clipboard.writeText(
        `Bộ câu hỏi trắc nghiệm: ${quiz.title}\n${questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}`
      );
      setCopied(true);
      showToast('Đã sao chép nội dung bộ câu hỏi vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Không sao chép được.');
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setActiveIdx(0);
    setIsCompleted(false);
    setShowHint(false);
  };

  if (!questions.length) return null;

  return (
    <div className="ds-quiz-canvas" role="region" aria-label="Bảng trắc nghiệm tương tác">
      {/* 1. HEADER CANVAS — PHONG CÁCH GEMINI CANVAS */}
      <div className="ds-qc-header">
        <h2 className="ds-qc-title" title={quiz.title}>{quiz.title}</h2>
        <div className="ds-qc-actions">
          <button
            type="button"
            className="ds-qc-btn-icon"
            onClick={handleShare}
            title="Chia sẻ hoặc sao chép bộ câu hỏi"
            aria-label="Chia sẻ"
          >
            <IconShare size={18} />
          </button>
          <button
            type="button"
            className="ds-qc-btn-icon"
            onClick={onClose}
            title="Đóng canvas và quay lại trò chuyện"
            aria-label="Đóng"
          >
            <IconClose size={20} />
          </button>
        </div>
      </div>

      {/* 2. THANH TIẾN TRÌNH DẠNG SEGMENT & BỘ ĐẾM GEMINI */}
      <div className="ds-qc-subbar">
        <div className="ds-qc-segments" role="tablist" aria-label="Danh sách câu hỏi">
          {questions.map((_, qIdx) => {
            let segCls = 'ds-qc-seg';
            if (userAnswers[qIdx] !== undefined) {
              segCls += userAnswers[qIdx].isCorrect ? ' is-correct' : ' is-wrong';
            } else if (qIdx === activeIdx) {
              segCls += ' is-active';
            }
            return (
              <button
                key={qIdx}
                type="button"
                className={segCls}
                onClick={() => {
                  setActiveIdx(qIdx);
                  setShowHint(false);
                }}
                title={`Chuyển đến câu ${qIdx + 1}`}
                aria-label={`Câu ${qIdx + 1}`}
              />
            );
          })}
        </div>

        <div className="ds-qc-metrics">
          <span className="ds-qc-counter">
            {activeIdx + 1}/{questions.length}
          </span>
          <span className="ds-qc-pill wrong" title="Số câu làm sai (đã tự động lưu vào Sổ tay)">
            ✕ {wrongCount}
          </span>
          <span className="ds-qc-pill correct" title="Số câu làm đúng (+10 XP)">
            ✓ {correctCount}
          </span>
        </div>
      </div>

      {/* 3. NỘI DUNG CHÍNH (CÂU HỎI HOẶC MÀN HÌNH HOÀN THÀNH) */}
      {!isCompleted ? (
        <div className="ds-qc-body">
          <div key={activeIdx} className="ds-qc-q-fade">
            <div className="ds-qc-qnum">Câu hỏi {activeIdx + 1}</div>
            <div className="ds-qc-question">
              <MathText text={curQ.question} />
            </div>

            {/* DANH SÁCH 4 PHƯƠNG ÁN A, B, C, D */}
            <div className="ds-qc-options">
              {curQ.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                let stateCls = '';

                if (hasAnsweredCur) {
                  if (i === curQ.correct) {
                    stateCls = 'is-correct';
                  } else if (i === curAns.picked) {
                    stateCls = 'is-wrong';
                  } else {
                    stateCls = 'is-muted';
                  }
                }

                return (
                  <button
                    key={i}
                    type="button"
                    className={`ds-qc-opt ${stateCls}`}
                    onClick={() => handlePickOption(i)}
                    disabled={hasAnsweredCur}
                  >
                    <span className="ds-qc-opt-letter">{letter}.</span>
                    <span className="ds-qc-opt-text">
                      <MathText text={opt} />
                    </span>
                    {hasAnsweredCur && i === curQ.correct && (
                      <span className="ds-qc-opt-badge check">✓</span>
                    )}
                    {hasAnsweredCur && i === curAns.picked && !curAns.isCorrect && (
                      <span className="ds-qc-opt-badge cross">✕</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* GỢI Ý ∨ (PHONG CÁCH TỐI GIẢN GEMINI) */}
            {curQ.hint && (
              <div className="ds-qc-hint-wrap">
                <button
                  type="button"
                  className="ds-qc-hint-btn"
                  onClick={() => setShowHint((v) => !v)}
                  aria-expanded={showHint}
                >
                  <span>Gợi ý</span>
                  <IconChevron size={14} open={showHint} />
                </button>
                {showHint && (
                  <div className="ds-qc-hint-box">
                    <MathText text={curQ.hint} />
                  </div>
                )}
              </div>
            )}

            {/* LỜI GIẢI CHI TIẾT (HIỂN THỊ SAU KHI ĐÃ TRẢ LỜI) */}
            {hasAnsweredCur && curQ.explanation && (
              <div className="ds-qc-explain-box">
                <div className="ds-qc-explain-head">
                  <span>Lời giải chi tiết:</span>
                </div>
                <div className="ds-qc-explain-body">
                  <MathText text={curQ.explanation} />
                </div>
                {!curAns.isCorrect && (
                  <div className="ds-qc-wrong-notice">
                    <IconNotebook size={14} />
                    <span>Đã tự động lưu vào Sổ tay lỗi sai của bạn.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER ĐIỀU HƯỚNG — 2 NÚT PILL BÊN GÓC PHẢI CHUẨN GEMINI */}
          <div className="ds-qc-footer">
            <div className="ds-qc-footer-right">
              <button
                type="button"
                className="ds-qc-btn secondary"
                onClick={() => {
                  if (activeIdx > 0) {
                    setActiveIdx(activeIdx - 1);
                    setShowHint(false);
                  }
                }}
                disabled={activeIdx === 0}
              >
                Quay lại
              </button>

              {activeIdx < questions.length - 1 ? (
                <button
                  type="button"
                  className="ds-qc-btn primary"
                  onClick={() => {
                    setActiveIdx(activeIdx + 1);
                    setShowHint(false);
                  }}
                >
                  Tiếp theo
                </button>
              ) : (
                <button
                  type="button"
                  className="ds-qc-btn primary"
                  onClick={handleFinish}
                >
                  Hoàn thành bài
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* MÀN HÌNH TỔNG KẾT & TỰ ĐỘNG TÍCH ĐIỂM */
        <div className="ds-qc-completed">
          <div className="ds-qc-comp-card">
            <div className="ds-qc-comp-icon"><IconTrophy size={36} /></div>
            <h3 className="ds-qc-comp-title">Hoàn thành bài trắc nghiệm!</h3>
            <p className="ds-qc-comp-sub">
              Bộ câu hỏi: <b>{quiz.title}</b>
            </p>

            <div className="ds-qc-comp-stats">
              <div className="ds-qc-comp-stat">
                <b>{correctCount}/{questions.length}</b>
                <span>Câu đúng ({Math.round((correctCount / questions.length) * 100)}%)</span>
              </div>
              <div className="ds-qc-comp-stat xp">
                <b>+{correctCount * 10} XP</b>
                <span>Điểm tích lũy</span>
              </div>
            </div>

            {wrongCount > 0 && (
              <div className="ds-qc-comp-wrong-box">
                <div className="ds-qc-comp-wb-left">
                  <IconNotebook size={18} />
                  <div>
                    <b>Đã lưu {wrongCount} câu làm sai vào Sổ tay lỗi</b>
                    <p>Bạn có thể vào Sổ tay để xem lại phương pháp giải và làm lại các câu này.</p>
                  </div>
                </div>
                <a
                  href="#notebook"
                  className="ds-qc-btn-link"
                  onClick={onClose}
                >
                  Mở Sổ tay lỗi sai →
                </a>
              </div>
            )}

            <div className="ds-qc-comp-actions">
              <button type="button" className="ds-qc-btn secondary" onClick={handleReset}>
                Làm lại bộ đề này
              </button>
              <button type="button" className="ds-qc-btn primary" onClick={onClose}>
                Quay lại đoạn chat AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NỔI */}
      {toastMsg && (
        <div className="ds-qc-toast" role="status">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
