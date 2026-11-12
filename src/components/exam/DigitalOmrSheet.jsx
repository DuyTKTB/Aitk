/* ============================================================
   DigitalOmrSheet.jsx — PHIẾU TÔ TRẮC NGHIỆM OMR 1:1 CHUẨN BỘ GD&ĐT
   ------------------------------------------------------------
   Chuẩn Apple VisionOS · 100% SVG thuần · 0 emoji
   Rèn luyện kỹ năng tô phiếu trắc nghiệm A-B-C-D chống tô lệch dòng
   ============================================================ */

import '../../styles/digital-omr.css';

/* ── Bộ Icon SVG thuần (0 emoji) ── */
const IcoSheet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IcoFlag = ({ filled = false }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const LETTERS = ['A', 'B', 'C', 'D'];

export default function DigitalOmrSheet({
  questions = [],
  answers = {},
  flags = {},
  currentQ = 0,
  onSelectAnswer,
  onToggleFlag,
  onJumpToQuestion,
}) {
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== null).length;
  const flaggedCount = Object.values(flags).filter(Boolean).length;
  const remainCount = Math.max(0, totalQ - answeredCount);

  return (
    <aside className="omr-panel" aria-label="Phiếu tô trắc nghiệm OMR điện tử">
      {/* ── HEADER PHIẾU OMR ── */}
      <div className="omr-header">
        <div className="omr-header-title">
          <IcoSheet />
          <span>Phiếu tô OMR chuẩn</span>
        </div>
        <div className="omr-stats-pills">
          <span className="omr-stat-chip done" title="Số câu đã tô chì">
            Đã tô: {answeredCount}/{totalQ}
          </span>
          {remainCount > 0 && (
            <span className="omr-stat-chip remain" title="Số câu chưa tô">
              Còn: {remainCount}
            </span>
          )}
          {flaggedCount > 0 && (
            <span className="omr-stat-chip flag" title="Số câu phân vân">
              Cờ: {flaggedCount}
            </span>
          )}
        </div>
      </div>

      {/* ── DANH SÁCH HÀNG TÔ CHÌ ── */}
      <div className="omr-scroll-area">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentQ;
          const isFlagged = Boolean(flags[idx]);
          const currentAnswer = answers[idx] ?? answers[q.id];

          return (
            <div
              key={q.id || idx}
              className={`omr-row ${isCurrent ? 'active' : ''}`}
            >
              <div className="omr-q-num-wrap">
                <button
                  type="button"
                  className={`omr-flag-btn ${isFlagged ? 'flagged' : ''}`}
                  onClick={() => onToggleFlag?.(idx)}
                  title={isFlagged ? 'Bỏ đánh dấu phân vân' : 'Đánh dấu phân vân'}
                >
                  <IcoFlag filled={isFlagged} />
                </button>
                <span
                  className="omr-q-num"
                  onClick={() => onJumpToQuestion?.(idx)}
                  title={`Nhảy tới Câu ${idx + 1}`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>

              {/* 4 Nút tròn tô chì A, B, C, D */}
              <div className="omr-bubbles-group" role="radiogroup" aria-label={`Đáp án câu ${idx + 1}`}>
                {LETTERS.map((letter, optIdx) => {
                  const isFilled = Number(currentAnswer) === optIdx;
                  return (
                    <button
                      key={letter}
                      type="button"
                      role="radio"
                      aria-checked={isFilled}
                      className={`omr-bubble ${isFilled ? 'filled' : ''}`}
                      onClick={() => onSelectAnswer?.(idx, optIdx)}
                      title={`Tô đáp án ${letter} cho Câu ${idx + 1}`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
