/* ============================================================
   FlashcardSession.jsx — PHIÊN THẺ GHI NHỚ THEO CHƯƠNG
   ------------------------------------------------------------
   Mặt trước: câu hỏi. Mặt sau: đáp án đúng + giải thích (từ ngân hàng
   câu hỏi thật + bộ biên soạn). Học sinh tự đánh giá 3 mức; mỗi mức có
   chu kỳ ôn riêng nên lần sau thẻ quay lại đúng lúc cần.
   Phím: Space = lật, 1/2/3 = mức ghi nhớ, Enter = thẻ tiếp.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadPracticeQuestions, loadQuestionsByIds } from '../../lib/roadmapEvidence.js';
import { rateMany, LEVELS, readCards } from '../../lib/flashcardStore.js';
import { IconClose, IconCheck, IconZap } from '../Icons.jsx';

/* qids: nếu truyền vào → ôn đúng các thẻ đến hạn (có thể thuộc nhiều chương) thay vì lấy thẻ mới */
export default function FlashcardSession({
  chapterId, chapterName, uid, size = 10, qids = null, onClose, onDone,
}) {
  const qidKey = qids && qids.length ? [...qids].map(String).sort().join(',') : '';
  const [state, setState] = useState('loading');
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [priorMap, setPriorMap] = useState({});
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [result, setResult] = useState(null);
  const alive = useRef(true);

  const load = useCallback(() => {
    setState('loading');
    setError(null);
    setIdx(0);
    setFlipped(false);
    setRatings([]);
    setResult(null);
    const prev = readCards(uid).cards || {};
    setPriorMap(prev);
    const task = qidKey
      ? loadQuestionsByIds(qidKey.split(',').slice(0, size))
      : loadPracticeQuestions(chapterId, { limit: size });
    task
      .then((r) => {
        if (!alive.current) return;
        if (r.error && !r.questions.length) { setError(r.error); setState('error'); return; }
        if (!r.questions.length) { setState('empty'); return; }
        /* Thẻ chưa nhớ / đến hạn xếp trước */
        const sorted = qidKey ? r.questions : [...r.questions].sort((a, b) => {
          const ca = prev[a.id];
          const cb = prev[b.id];
          const pa = ca ? (ca.level === 1 ? 0 : ca.level === 2 ? 1 : 2) : 3;
          const pb = cb ? (cb.level === 1 ? 0 : cb.level === 2 ? 1 : 2) : 3;
          return pa - pb;
        });
        setCards(sorted);
        setState('run');
      })
      .catch((e) => {
        if (!alive.current) return;
        setError(e?.message || 'Lỗi không xác định');
        setState('error');
      });
  }, [chapterId, size, uid, qidKey]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; };
  }, [load]);

  const card = cards[idx] || null;
  const prevCard = card ? priorMap[card.id] : null;

  const rate = useCallback((level) => {
    if (!card || !flipped) return;
    const next = [...ratings, { qid: card.id, level, topicId: card.topicId || chapterId || null }];
    setRatings(next);
    if (idx + 1 < cards.length) {
      setIdx(idx + 1);
      setFlipped(false);
      return;
    }
    const saved = rateMany(uid, next);
    const counts = { 1: 0, 2: 0, 3: 0 };
    next.forEach((r) => { counts[r.level] += 1; });
    setResult({ counts, saved });
    setState('done');
    onDone?.(saved);
  }, [card, flipped, ratings, idx, cards.length, chapterId, uid, onDone]);

  useEffect(() => {
    const onKey = (e) => {
      if (state !== 'run') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      /* Focus đang ở một nút: Space/Enter đã kích hoạt nút đó rồi, xử lý nữa sẽ lật hai lần */
      const onButton = e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A');
      if (e.code === 'Space' || e.key === ' ') {
        if (onButton) return;
        e.preventDefault();
        setFlipped((v) => !v);
      } else if (e.key === 'Enter') {
        if (onButton) return;
        if (flipped) rate(3);
      } else if (['1', '2', '3'].includes(e.key)) {
        rate(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, flipped, rate]);

  return (
    <div className="rm-flash">
      <div className="rm-practice-head">
        <div>
          <small>{qidKey ? 'Ôn thẻ đến hạn' : `Thẻ ghi nhớ · ${chapterName}`}</small>
          {state === 'run' && <b>Thẻ {idx + 1}/{cards.length}</b>}
        </div>
        <button type="button" className="rm-x" onClick={onClose} aria-label="Đóng phiên thẻ" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconClose size={18} />
        </button>
      </div>

      {state === 'run' && (
        <div className="rm-flash-progress" role="progressbar" aria-valuemin={1} aria-valuemax={cards.length} aria-valuenow={idx + 1}>
          <i style={{ width: `${((idx + (flipped ? 0.5 : 0)) / cards.length) * 100}%` }} />
        </div>
      )}

      {state === 'loading' && (
        <div className="rm-skel-wrap" role="status" aria-live="polite">
          <span className="rm-skel" style={{ height: 120 }} />
          <span className="rm-hint">Đang lấy thẻ của chương…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="rm-state err" role="alert">
          <b>Không tải được thẻ</b>
          <p>{error}</p>
          <button type="button" className="rm-btn" onClick={load}>Thử lại</button>
        </div>
      )}

      {state === 'empty' && (
        <div className="rm-state">
          <b>Chương này chưa có câu hỏi để làm thẻ</b>
          <p>Hiện chương chưa có câu hỏi nào đủ điều kiện.</p>
          <button type="button" className="rm-btn" onClick={onClose}>Đóng</button>
        </div>
      )}

      {state === 'run' && card && (
        <>
          {prevCard && LEVELS[prevCard.level] && (
            <div className={`rm-flash-prev lv${prevCard.level}`}>
              Lần trước: <b>{LEVELS[prevCard.level].label}</b> · đã xem {prevCard.seen || 1} lần
            </div>
          )}
          <div className="rm-flash-stage">
            <button
              type="button"
              className={'rm-flip' + (flipped ? ' is-flipped' : '')}
              onClick={() => setFlipped((v) => !v)}
              aria-label={flipped ? 'Xem lại câu hỏi' : 'Lật thẻ để xem đáp án'}
            >
              <span className="rm-flip-inner">
                <span className="rm-flip-face front">
                  <small>Câu hỏi</small>
                  <b>{card.q}</b>
                  <em>Bấm hoặc Space để xem đáp án</em>
                </span>
                <span className="rm-flip-face back">
                  <small>Đáp án</small>
                  <b>{card.options[card.correct]}</b>
                  {card.explain && <span className="rm-flip-expl">{card.explain}</span>}
                  <em>Bấm hoặc Space để quay lại câu hỏi</em>
                </span>
              </span>
            </button>
          </div>

          <div className={'rm-flash-rate' + (flipped ? '' : ' is-locked')}>
            {[1, 2, 3].map((lv) => (
              <button
                key={lv}
                type="button"
                className={`rm-btn rm-rate-${lv}`}
                onClick={() => rate(lv)}
                disabled={!flipped}
              >
                {LEVELS[lv].label}
                <i>+{LEVELS[lv].days} ngày</i>
              </button>
            ))}
          </div>
          <p className="rm-hint">
            {flipped ? 'Phím 1 / 2 / 3 để chọn mức ghi nhớ · Enter = nhớ tốt' : 'Lật thẻ trước khi tự đánh giá'}
          </p>
        </>
      )}

      {state === 'done' && result && (
        <div className="rm-done">
          <div className="rm-done-score">
            <b>{result.counts[3]}/{ratings.length}</b>
            <span>thẻ nhớ tốt</span>
          </div>
          <div className="rm-done-delta">
            <span>
              Chưa nhớ <b>{result.counts[1]}</b> · một phần <b>{result.counts[2]}</b> · nhớ tốt <b>{result.counts[3]}</b>.
              {' '}Thẻ chưa nhớ sẽ quay lại sau 1 ngày; nhớ tốt giãn dần tới 60 ngày.
            </span>
          </div>

          <div className="rm-flash-done-groups">
            {[1, 2, 3].map((lv) => {
              const items = cards
                .map((c, i) => ({ card: c, saved: result.saved?.[i], rating: ratings[i] }))
                .filter((x) => x.rating && x.rating.level === lv);
              if (!items.length) return null;
              const icon = lv === 1 ? <IconClose size={13} /> : lv === 2 ? <IconZap size={13} /> : <IconCheck size={13} />;
              return (
                <div key={lv} className={`rm-flash-done-group lv${lv}`}>
                  <h4>{LEVELS[lv].label} ({items.length})</h4>
                  <ul className="rm-flash-done-list">
                    {items.map(({ card: c, saved }) => (
                      <li key={c.id}>
                        <span aria-hidden="true">{icon}</span>
                        <span className="rm-done-q">{c.q}</span>
                        <small>ôn sau {saved?.interval || LEVELS[lv].days} ngày</small>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="rm-quiz-foot">
            <button type="button" className="rm-btn" onClick={load}>Lật lại bộ thẻ</button>
            <button type="button" className="rm-btn primary" onClick={onClose}>Xong</button>
          </div>
        </div>
      )}
    </div>
  );
}
