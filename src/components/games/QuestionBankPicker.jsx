import { useEffect, useState } from 'react';
import { topicGroups } from '../../data/chemTopics.js';
import {
  GAME_DIFFICULTIES, buildJeopardyCategories, fetchBankQuestions, pickRandom,
} from '../../lib/gameQuestionBank.js';

/* ============================================================
   QuestionBankPicker — chọn chuyên đề / độ khó / số câu từ ngân hàng
   mode="list"      → onApply(picked[], 'replace' | 'append')   (Chicken, Slingshot)
   mode="jeopardy"  → onApply(categories[])                     (Chọn ô may mắn)
   ============================================================ */

const COUNTS = [5, 10, 15, 20, 30];
const MAX_ANSWER_LEN = 24;     // ký tự — vừa với biển gà / bia bắn
const MAX_JEOPARDY_TOPICS = 6;

const label = {
  font: '700 .7rem var(--mono)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  color: 'var(--mut)',
  margin: '1rem 0 .4rem',
};

export default function QuestionBankPicker({ mode = 'list', maxCount = 30, onApply, onClose }) {
  const isJ = mode === 'jeopardy';
  const [topics, setTopics] = useState([]);
  const [diffs, setDiffs] = useState([]);
  const [count, setCount] = useState(Math.min(10, maxCount));
  const [shortOnly, setShortOnly] = useState(!isJ);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (list, setList, id, limit) => {
    setResult(null);
    if (list.includes(id)) setList(list.filter((x) => x !== id));
    else if (!limit || list.length < limit) setList([...list, id]);
  };

  const find = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { eligible, skipped, fetched } = await fetchBankQuestions({
        topicIds: topics,
        difficulties: isJ ? [] : diffs,
        maxAnswerLen: shortOnly ? MAX_ANSWER_LEN : 0,
      });
      if (isJ) {
        const { categories, dropped } = buildJeopardyCategories(eligible, topics);
        setResult({ categories, dropped, skipped, fetched });
      } else {
        setResult({ picked: pickRandom(eligible, count), eligible: eligible.length, skipped, fetched });
      }
    } catch (e) {
      console.error('[QuestionBankPicker]', e);
      setError('Không tải được câu hỏi từ ngân hàng. Kiểm tra mạng rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const canFind = !loading && (isJ ? topics.length >= 2 : true);
  const listOk = result?.picked?.length > 0;
  const jeoOk = result?.categories?.length >= 2;

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="card"
        role="dialog"
        aria-modal="true"
        aria-label="Lấy câu hỏi từ ngân hàng"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(700px, 94vw)', maxHeight: '88vh', overflow: 'auto' }}
      >
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '-.02em' }}>Lấy từ ngân hàng câu hỏi</h3>
          <button className="x" type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <p style={label}>
          Chuyên đề {isJ ? `(chọn 2–${MAX_JEOPARDY_TOPICS}, mỗi chuyên đề thành 1 cột)` : '(bỏ trống = tất cả)'}
        </p>
        {topicGroups().map((g) => (
          <div key={g.grade} style={{ marginBottom: '.5rem' }}>
            <small style={{ color: 'var(--mut)', fontFamily: 'var(--mono)' }}>{g.label}</small>
            <div className="row" style={{ flexWrap: 'wrap', gap: '.35rem', marginTop: '.25rem' }}>
              {g.topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={'chip' + (topics.includes(t.id) ? ' on' : '')}
                  onClick={() => toggle(topics, setTopics, t.id, isJ ? MAX_JEOPARDY_TOPICS : 0)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        ))}

        {!isJ && (
          <>
            <p style={label}>Độ khó (bỏ trống = tất cả)</p>
            <div className="row" style={{ flexWrap: 'wrap', gap: '.35rem' }}>
              {GAME_DIFFICULTIES.map((d) => (
                <button key={d.id} type="button" className={'chip' + (diffs.includes(d.id) ? ' on' : '')} onClick={() => toggle(diffs, setDiffs, d.id)}>
                  {d.name}
                </button>
              ))}
            </div>

            <p style={label}>Số câu</p>
            <div className="row" style={{ flexWrap: 'wrap', gap: '.35rem' }}>
              {COUNTS.filter((n) => n <= maxCount).map((n) => (
                <button key={n} type="button" className={'chip' + (count === n ? ' on' : '')} onClick={() => { setCount(n); setResult(null); }}>
                  {n} câu
                </button>
              ))}
            </div>
          </>
        )}

        <label className="row" style={{ marginTop: '1rem', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={shortOnly} onChange={(e) => { setShortOnly(e.target.checked); setResult(null); }} style={{ width: 'auto' }} />
          <span style={{ fontSize: '.9rem' }}>
            Chỉ lấy câu có đáp án ngắn (≤ {MAX_ANSWER_LEN} ký tự)
            {!isJ && <small style={{ color: 'var(--mut)' }}> — nên bật: biển gà và bia bắn chứa được ít chữ</small>}
          </span>
        </label>

        <div className="row" style={{ marginTop: '1.2rem', gap: '.5rem', alignItems: 'center' }}>
          <button className="btn primary" type="button" onClick={find} disabled={!canFind}>
            {loading ? 'Đang tìm…' : 'Tìm câu hỏi'}
          </button>
          {isJ && topics.length < 2 && <small style={{ color: 'var(--mut)' }}>Chọn ít nhất 2 chuyên đề.</small>}
        </div>

        {error && <p className="hint" role="alert" style={{ color: 'var(--alkali, #c0392b)' }}>{error}</p>}

        {result && !isJ && (
          <div style={{ marginTop: '1.2rem' }}>
            {listOk ? (
              <>
                <p className="hint">
                  Có <b>{result.eligible}</b> câu phù hợp, đã bốc ngẫu nhiên <b>{result.picked.length}</b>.
                  {result.skipped > 0 && <> Bỏ qua {result.skipped} câu không dùng được (nhiều đáp án đúng, thiếu đáp án sai hoặc đáp án quá dài).</>}
                </p>
                <ol style={{ paddingLeft: '1.2rem', margin: '.4rem 0', fontSize: '.85rem', color: 'var(--mut)' }}>
                  {result.picked.slice(0, 3).map((q) => (
                    <li key={q.question_id}>{q.question.length > 90 ? q.question.slice(0, 90) + '…' : q.question}</li>
                  ))}
                  {result.picked.length > 3 && <li style={{ listStyle: 'none' }}>… và {result.picked.length - 3} câu nữa</li>}
                </ol>
                <div className="row" style={{ gap: '.5rem', marginTop: '.8rem' }}>
                  <button className="btn primary" type="button" onClick={() => onApply?.(result.picked, 'replace')}>Thay danh sách hiện tại</button>
                  <button className="btn" type="button" onClick={() => onApply?.(result.picked, 'append')}>Thêm vào danh sách</button>
                </div>
              </>
            ) : (
              <p className="hint">
                Không có câu nào phù hợp ({result.fetched} câu được xét{result.skipped ? `, ${result.skipped} câu không dùng được` : ''}).
                Thử bỏ bớt bộ lọc, tắt “đáp án ngắn”, hoặc gán chuyên đề cho thêm câu trong Admin.
              </p>
            )}
          </div>
        )}

        {result && isJ && (
          <div style={{ marginTop: '1.2rem' }}>
            {result.dropped.length > 0 && (
              <p className="hint">
                Chuyên đề bị bỏ vì chưa đủ 5 câu: {result.dropped.map((d) => `${d.name} (${d.have})`).join(', ')}.
              </p>
            )}
            {jeoOk ? (
              <>
                <p className="hint">Bảng gồm <b>{result.categories.length}</b> cột: {result.categories.map((c) => c.name).join(' · ')}.</p>
                <div className="row" style={{ gap: '.5rem', marginTop: '.8rem' }}>
                  <button className="btn primary" type="button" onClick={() => onApply?.(result.categories)}>Dùng bộ câu hỏi này</button>
                </div>
              </>
            ) : (
              <p className="hint">Cần ít nhất 2 chuyên đề có đủ 5 câu. Thử tắt “đáp án ngắn” hoặc chọn chuyên đề có nhiều câu hơn.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
