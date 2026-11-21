import { useState } from 'react';
import MathText from './MathText.jsx';

export function parseCheckpointFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return { cleanText: rawText || '', checkpoint: null };
  const match = rawText.match(/```checkpoint\s*([\s\S]*?)\s*```/i);
  if (!match) return { cleanText: rawText, checkpoint: null };
  try {
    const data = JSON.parse(match[1].trim());
    if (!data || !data.question) return { cleanText: rawText, checkpoint: null };
    const cleanText = rawText.replace(match[0], '').trim();
    return { cleanText, checkpoint: data };
  } catch {
    return { cleanText: rawText, checkpoint: null };
  }
}

const normAns = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');

export default function SocraticCheckpointCard({ checkpoint, onContinue }) {
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState('idle'); // idle | right | wrong
  const [showHint, setShowHint] = useState(false);

  if (!checkpoint) return null;
  const hasOptions = Array.isArray(checkpoint.options) && checkpoint.options.length > 0;

  const chooseOption = (idx) => {
    setPicked(idx);
    if (Number(idx) === Number(checkpoint.correct)) {
      setStatus('right');
    } else {
      setStatus('wrong');
      setShowHint(true);
    }
  };

  const checkTyped = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    const expected = normAns(checkpoint.answer);
    const got = normAns(typed);
    if (expected && (got === expected || got.includes(expected) || expected.includes(got))) {
      setStatus('right');
    } else {
      setStatus('wrong');
      setShowHint(true);
    }
  };

  return (
    <div className={`elec-socratic-card is-${status}`} role="region" aria-label="Kiểm tra nhanh bước học chủ động">
      <div className="elec-soc-head">
        <span className="elec-soc-badge">STUDY MODE · TỰ KIỂM TRA BƯỚC NÀY</span>
        {status === 'right' && <span className="elec-soc-ok">Chính xác!</span>}
      </div>

      <div className="elec-soc-q">
        <MathText text={checkpoint.question} />
      </div>

      {hasOptions ? (
        <div className="elec-soc-opts">
          {checkpoint.options.map((opt, idx) => {
            const isPicked = picked === idx;
            const isRight = status === 'right' && idx === Number(checkpoint.correct);
            const isWrong = isPicked && status === 'wrong';
            return (
              <button
                key={idx}
                type="button"
                className={`elec-soc-opt${isRight ? ' is-right' : ''}${isWrong ? ' is-wrong' : ''}`}
                onClick={() => chooseOption(idx)}
              >
                <span className="elec-soc-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="elec-soc-opt-txt"><MathText text={String(opt)} /></span>
              </button>
            );
          })}
        </div>
      ) : (
        <form className="elec-soc-input-row" onSubmit={checkTyped}>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Nhập kết quả bước này của bạn..."
            aria-label="Nhập kết quả bước này"
          />
          <button type="submit" className="elec-soc-check-btn">Kiểm tra</button>
        </form>
      )}

      {showHint && checkpoint.hint && (
        <div className="elec-soc-hint">
          <b>Gợi ý:</b> <MathText text={checkpoint.hint} />
        </div>
      )}

      <div className="elec-soc-foot">
        {!showHint && checkpoint.hint && status !== 'right' && (
          <button type="button" className="elec-soc-link" onClick={() => setShowHint(true)}>
            Xem gợi ý nhẹ
          </button>
        )}
        {status === 'right' && onContinue && (
          <button
            type="button"
            className="elec-soc-next"
            onClick={() => onContinue(checkpoint.nextPrompt || 'Mình đã làm đúng bước này! Hãy dẫn dắt bước tiếp theo.')}
          >
            <span>Mở bước tiếp theo</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
