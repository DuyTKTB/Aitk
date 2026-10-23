/* ExamPaperView.jsx — Chế độ "đề giấy": cuộn liên tục, bài đọc nằm cạnh/ghim trên các câu của nó
   Đặt tại: src/components/ExamPaperView.jsx   (cùng thư mục với ExamJoin.jsx)
   -------------------------------------------------------------------------- */
import { memo, useEffect, useState } from 'react';
import MathText from './MathText.jsx';
import QuestionAnswer, { isChoiceType, QuestionImage } from './QuestionAnswer.jsx';

const IcoPin = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 17v5M9 3h6l-1 7 3 3H7l3-3-1-7z" />
  </svg>
);
const IcoFlag = ({ size = 13, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 22V4M4 4h13l-2 4 2 4H4" />
  </svg>
);

/* Hộp bài đọc — dùng chung cho chế độ đề giấy và chế độ từng câu */
export const PassageBox = memo(function PassageBox({ instruction, passage, pinnable = false, pinned = false, onTogglePin }) {
  if (!instruction && !passage) return null;
  return (
    <div className={'pp-passage' + (pinned ? ' pinned' : '')}>
      {pinnable && passage && (
        <button type="button" className={'pp-pin' + (pinned ? ' on' : '')} onClick={onTogglePin} aria-pressed={pinned}>
          <IcoPin /> {pinned ? 'Đang ghim bài đọc' : 'Ghim bài đọc'}
        </button>
      )}
      {instruction && <MathText as="p" className="pp-instr">{instruction}</MathText>}
      {passage && <MathText as="div" className="pp-passage-text">{passage}</MathText>}
    </div>
  );
});

const PaperQuestion = memo(function PaperQuestion({ q, qi, pos, picked, flagged, paused, onPick, onFlag }) {
  const short = (q.options || []).every((o) => String(o ?? '').length <= 22);
  return (
    <article className="pp-q" id={`pq-${pos}`} data-pos={pos}>
      <div className="pp-q-head">
        <span className="pp-q-num">Câu {pos + 1}</span>
        <button
          type="button"
          className={'pp-flag' + (flagged ? ' on' : '')}
          onClick={() => onFlag(qi)}
          disabled={paused}
          aria-pressed={flagged}
          aria-label="Đánh dấu"
        >
          <IcoFlag filled={flagged} />
        </button>
      </div>
      <MathText as="p" className="pp-q-text">{q.q}</MathText>
      <QuestionImage q={q} />
      {!isChoiceType(q) && <QuestionAnswer q={q} qi={qi} picked={picked} paused={paused} onPick={onPick} />}
      {isChoiceType(q) && (
      <div className={'pp-opts' + (short ? ' row' : '')} role="radiogroup">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={picked === i}
            className={'pp-opt' + (picked === i ? ' picked' : '')}
            onClick={() => onPick(qi, i)}
            disabled={paused}
          >
            <span className="pp-bubble">{String.fromCharCode(65 + i)}</span>
            <span className="pp-opt-text"><MathText>{opt}</MathText></span>
          </button>
        ))}
      </div>
      )}
    </article>
  );
});

function PaperBlock({ block, questions, answers, flags, paused, onPick, onFlag }) {
  const hasPassage = !!block.passage;
  const [pinned, setPinned] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 900);

  return (
    <section className={'pp-block' + (hasPassage ? ' has-passage' : '')}>
      {(hasPassage || block.instruction) && (
        <PassageBox
          instruction={block.instruction}
          passage={block.passage}
          pinnable={hasPassage}
          pinned={hasPassage && pinned}
          onTogglePin={() => setPinned((v) => !v)}
        />
      )}
      <div className="pp-qs">
        {block.items.map(({ qi, pos }) => (
          <PaperQuestion
            key={qi}
            q={questions[qi]}
            qi={qi}
            pos={pos}
            picked={answers[qi]}
            flagged={!!flags[qi]}
            paused={paused}
            onPick={onPick}
            onFlag={onFlag}
          />
        ))}
      </div>
    </section>
  );
}

export default function ExamPaperView({ layout, questions, answers, flags, paused, onPick, onFlag, onVisible, onSubmit, rootRef }) {
  /* Theo dõi câu đang ở đầu màn hình → cập nhật "Câu x/y" và heartbeat gửi cho giáo viên */
  useEffect(() => {
    const root = rootRef?.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) onVisible?.(Number(e.target.dataset.pos));
      },
      { root, rootMargin: '-8% 0px -75% 0px' },
    );
    root.querySelectorAll('.pp-q').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [layout, rootRef, onVisible]);

  return (
    <div className="pp-wrap">
      {layout.blocks.map((b, i) => (
        <PaperBlock
          key={`${b.key ?? 'q'}-${b.idx[0]}-${i}`}
          block={b}
          questions={questions}
          answers={answers}
          flags={flags}
          paused={paused}
          onPick={onPick}
          onFlag={onFlag}
        />
      ))}
      <div className="pp-end">
        <button type="button" className="ep-submit-btn" onClick={onSubmit} disabled={paused}>
          Nộp bài
        </button>
      </div>
    </div>
  );
}