/* QuestionAnswer.jsx — ô trả lời cho câu Đúng/Sai (4 ý) và Trả lời ngắn
   Đặt tại: src/components/QuestionAnswer.jsx   (cùng thư mục ExamJoin.jsx)
   Đáp án lưu vào answers[qi]:
     - true_false   : { 0: true, 1: false, ... }  (object, không dùng mảng lồng mảng)
     - short_answer : 'chuỗi học sinh gõ'
   -------------------------------------------------------------------------- */
import { memo } from 'react';
import MathText from './MathText.jsx';
import { qType } from '../lib/examScoring.js';

/** Hình minh hoạ của câu hỏi (q.image: data URL hoặc đường dẫn) */
export const QuestionImage = memo(function QuestionImage({ q, onZoom }) {
  if (!q?.image) return null;
  const clickable = typeof onZoom === 'function';
  return (
    <figure className={'ep-q-fig' + (clickable ? ' is-zoomable' : '')}>
      <div
        className="ep-q-fig-frame"
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? 'Phóng to hình minh hoạ' : undefined}
        onClick={clickable ? () => onZoom(q.image, q.imageAlt || 'Hình minh hoạ') : undefined}
        onKeyDown={clickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onZoom(q.image, q.imageAlt || 'Hình minh hoạ');
          }
        } : undefined}
      >
        <img
          src={q.image}
          alt={q.imageAlt || 'Hình minh hoạ'}
          loading="lazy"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
        {clickable && (
          <span className="ep-q-fig-zoom-hint" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            Phóng to
          </span>
        )}
      </div>
    </figure>
  );
});

/** Câu trắc nghiệm A/B/C/D (giữ nguyên giao diện cũ) */
export const isChoiceType = (q) => {
  const t = qType(q);
  return t !== 'true_false' && t !== 'short_answer';
};

const TrueFalse = memo(function TrueFalse({ q, qi, picked, paused, onPick }) {
  const cur = picked && typeof picked === 'object' ? picked : {};
  const set = (k, v) => onPick(qi, { ...cur, [k]: v });
  return (
    <div className="ep-tf" role="group" aria-label="Chọn Đúng hoặc Sai cho từng ý">
      {(q.statements || []).map((st, k) => {
        const val = cur[k];
        return (
          <div className="ep-tf-row" key={k}>
            <div className="ep-tf-text">
              <b className="ep-tf-key">{String.fromCharCode(97 + k)})</b>
              <span><MathText>{st.text}</MathText></span>
            </div>
            <div className="ep-tf-btns" role="radiogroup" aria-label={`Ý ${String.fromCharCode(97 + k)}`}>
              <button
                type="button" role="radio" aria-checked={val === true} disabled={paused}
                className={'ep-tf-btn' + (val === true ? ' on' : '')}
                onClick={() => set(k, true)}
              >Đúng</button>
              <button
                type="button" role="radio" aria-checked={val === false} disabled={paused}
                className={'ep-tf-btn sai' + (val === false ? ' on' : '')}
                onClick={() => set(k, false)}
              >Sai</button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const ShortAnswer = memo(function ShortAnswer({ qi, picked, paused, onPick }) {
  return (
    <div className="ep-sa">
      <label className="ep-sa-label" htmlFor={`sa-${qi}`}>Đáp án của em</label>
      <input
        id={`sa-${qi}`}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={12}
        disabled={paused}
        value={typeof picked === 'string' ? picked : ''}
        placeholder="VD: 12,5"
        enterKeyHint="done"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
        onChange={(e) => onPick(qi, e.target.value)}
      />
      <small>Nhập số hoặc kết quả ngắn. Dấu phẩy và dấu chấm đều được (12,5 = 12.5).</small>
    </div>
  );
});

export default function QuestionAnswer({ q, qi, picked, paused, onPick }) {
  const t = qType(q);
  if (t === 'true_false') return <TrueFalse q={q} qi={qi} picked={picked} paused={paused} onPick={onPick} />;
  if (t === 'short_answer') return <ShortAnswer qi={qi} picked={picked} paused={paused} onPick={onPick} />;
  return null;
}