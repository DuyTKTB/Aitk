import { useState, useEffect } from 'react';
import useAsk from '../hooks/useAsk.js';
import VipGate from './VipGate.jsx';
import Icon from './Icon.jsx';

const TOPICS = ['Cấu hình electron', 'Độ âm điện và xu hướng', 'Số oxi hóa', 'Tính chất các nhóm A', 'Kim loại, phi kim, á kim'];

export default function AiQuiz({ vip, onClose }) {
  const { loading, error, vipNeeded, ask } = useAsk();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [n, setN] = useState(5);
  const [qs, setQs] = useState(null);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);
  const [bad, setBad] = useState(false);

  useEffect(() => {
    const onKey = (ev) => ev.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  const start = async () => {
    setBad(false);
    const raw = await ask(
      `Tạo ${n} câu trắc nghiệm Hóa học lớp 10-12 về chủ đề "${topic}" liên quan bảng tuần hoàn. ` +
      `CHỈ trả về JSON thuần, không markdown, dạng: [{"q":"...","options":["A","B","C","D"],"answer":0,"explain":"..."}] ` +
      `(answer là chỉ số 0-3 của đáp án đúng).`
    );
    if (!raw) return;
    try {
      const j = JSON.parse(raw.replace(/```json|```/g, '').trim());
      const ok = j.filter((x) => x.q && Array.isArray(x.options) && x.options.length >= 2 && Number.isInteger(x.answer));
      if (!ok.length) throw new Error();
      setQs(ok.slice(0, n)); setI(0); setPick(null); setScore(0);
    } catch { setBad(true); }
  };

  const q = qs?.[i];
  const done = qs && i >= qs.length;
  const choose = (k) => { if (pick !== null) return; setPick(k); if (k === q.answer) setScore((s) => s + 1); };

  return (
    <div className="backdrop" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="modal quiz-modal" role="dialog" aria-modal="true" aria-label="AI Quiz">
        <h2 className="quiz-title"><Icon name="sparkle" size={20} /> AI Quiz <span className="vip-badge">VIP</span></h2>
        {(!vip || vipNeeded) ? <VipGate text="Nâng cấp VIP để AI tạo câu hỏi ôn tập riêng cho bạn." /> : !qs ? (
          <div className="quiz-setup">
            <label>Chủ đề
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Số câu
              <select value={n} onChange={(e) => setN(+e.target.value)}>
                {[3, 5, 10].map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
            <button className="btn primary" disabled={loading} onClick={start}>{loading ? 'AI đang soạn đề…' : 'Tạo đề'}</button>
            {(error || bad) && <p className="ai-state err">{error || 'AI trả về sai định dạng, bạn bấm Tạo đề lại nhé.'}</p>}
          </div>
        ) : done ? (
          <div className="quiz-setup">
            <p className="quiz-score">{score}/{qs.length}</p>
            <p className="ai-state">{score === qs.length ? 'Tuyệt vời!' : 'Xem lại các câu sai rồi thử đề mới nhé.'}</p>
            <button className="btn primary" onClick={() => setQs(null)}>Làm đề mới</button>
          </div>
        ) : (
          <div className="quiz-body">
            <p className="ai-state">Câu {i + 1}/{qs.length}</p>
            <h3 className="quiz-q">{q.q}</h3>
            {q.options.map((o, k) => (
              <button key={k} onClick={() => choose(k)}
                className={'quiz-opt' + (pick !== null ? (k === q.answer ? ' right' : k === pick ? ' wrong' : '') : '')}>{o}</button>
            ))}
            {pick !== null && (
              <>
                {q.explain && <div className="ai-answer">{q.explain}</div>}
                <button className="btn primary" onClick={() => { setI(i + 1); setPick(null); }}>{i + 1 < qs.length ? 'Câu tiếp' : 'Xem kết quả'}</button>
              </>
            )}
          </div>
        )}
        <button className="btn" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}