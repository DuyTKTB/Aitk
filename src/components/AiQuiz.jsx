import { useState, useEffect } from 'react';
import useAsk from '../hooks/useAsk.js';
import VipGate from './VipGate.jsx';
import Icon from './Icon.jsx';

const TOPICS = [
  'Cấu hình electron & Obitan (s, p, d, f)',
  'Độ âm điện, bán kính & xu hướng tuần hoàn',
  'Số oxi hóa & Quy luật hóa trị',
  'Tính chất Kim loại kiềm – Kiềm thổ – Halogen',
  'Kim loại chuyển tiếp & Ứng dụng đời sống',
  'Nhận biết nguyên tố qua màu ngọn lửa & phản ứng',
];

const LEVELS = [
  { id: 'basic', label: 'Thông hiểu (Hóa 10)' },
  { id: 'exam', label: 'Vận dụng (THPT QG)' },
  { id: 'hard', label: 'Vận dụng cao (9+)' },
];

export default function AiQuiz({ vip, onClose }) {
  const { loading, error, vipNeeded, ask } = useAsk();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [level, setLevel] = useState('exam');
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
    let parsedQuestions = null;
    const levelLabel = LEVELS.find((l) => l.id === level)?.label || 'THPT QG';
    const raw = await ask(
      `Tạo ${n} câu trắc nghiệm Hóa học GDPT 2018 mức độ "${levelLabel}" về chủ đề "${topic}" liên quan Bảng tuần hoàn các nguyên tố hóa học. ` +
      `Câu hỏi phải rõ ràng, chính xác tuyệt đối, giải thích dễ hiểu. ` +
      `CHỈ trả về JSON thuần, không markdown, dạng: [{"q":"...","options":["A","B","C","D"],"answer":0,"explain":"..."}] ` +
      `(answer là chỉ số 0-3 của đáp án đúng).`,
      {
        validate: (ansText) => {
          const cleaned = String(ansText || '').replace(/```json|```/g, '').trim();
          const startIdx = cleaned.indexOf('[');
          const endIdx = cleaned.lastIndexOf(']');
          const jsonStr = startIdx >= 0 && endIdx > startIdx ? cleaned.slice(startIdx, endIdx + 1) : cleaned;
          const j = JSON.parse(jsonStr);
          const ok = Array.isArray(j)
            ? j.filter((x) => x.q && Array.isArray(x.options) && x.options.length >= 2 && Number.isInteger(x.answer))
            : [];
          if (!ok.length) throw new Error('AI trả về định dạng câu hỏi chưa hợp lệ (ELEC Credit đã được hoàn trả).');
          parsedQuestions = ok.slice(0, n);
        },
      }
    );
    if (!raw) return;
    if (parsedQuestions) {
      setQs(parsedQuestions);
      setI(0);
      setPick(null);
      setScore(0);
    } else {
      setBad(true);
    }
  };

  const q = qs?.[i];
  const done = qs && i >= qs.length;
  const choose = (k) => {
    if (pick !== null) return;
    setPick(k);
    if (k === q.answer) setScore((s) => s + 1);
  };

  return (
    <div className="backdrop" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="modal quiz-modal" role="dialog" aria-modal="true" aria-label="AI Quiz Bảng tuần hoàn">
        <h2 className="quiz-title"><Icon name="sparkle" size={20} /> AI Quiz Bảng Tuần Hoàn <span className="vip-badge">PRO</span></h2>
        {(!vip || vipNeeded) ? (
          <VipGate text="Nâng cấp VIP để AI tạo đề trắc nghiệm cá nhân hóa chuẩn GDPT 2018." />
        ) : !qs ? (
          <div className="quiz-setup">
            <label>Chủ đề ôn luyện
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Độ khó
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </label>
            <label>Số câu hỏi
              <select value={n} onChange={(e) => setN(+e.target.value)}>
                {[3, 5, 10].map((x) => <option key={x} value={x}>{x} câu</option>)}
              </select>
            </label>
            <button className="btn primary" disabled={loading} onClick={start}>
              {loading ? 'ELEC AI đang biên soạn đề…' : 'Tạo đề luyện tập'}
            </button>
            {(error || bad) && <p className="ai-state err">{error || 'AI trả về sai định dạng, bạn bấm Tạo đề lại nhé.'}</p>}
          </div>
        ) : done ? (
          <div className="quiz-setup">
            <p className="quiz-score">{score}/{qs.length}</p>
            <p className="ai-state">
              {score === qs.length
                ? 'Xuất sắc! Bạn đã nắm chắc chủ đề này!'
                : 'Rất tốt! Xem kỹ lời giải rồi thử mức độ cao hơn nhé.'}
            </p>
            <button className="btn primary" onClick={() => setQs(null)}>Làm đề mới</button>
          </div>
        ) : (
          <div className="quiz-body">
            <div className="quiz-prog">
              <span style={{ width: `${((i + 1) / qs.length) * 100}%` }} />
            </div>
            <p className="ai-state">Câu {i + 1}/{qs.length} · Điểm: {score}</p>
            <h3 className="quiz-q">{q.q}</h3>
            {q.options.map((o, k) => (
              <button
                key={k}
                onClick={() => choose(k)}
                className={'quiz-opt' + (pick !== null ? (k === q.answer ? ' right' : k === pick ? ' wrong' : '') : '')}
              >
                {o}
              </button>
            ))}
            {pick !== null && (
              <>
                {q.explain && <div className="ai-answer">{q.explain}</div>}
                <button className="btn primary" onClick={() => { setI(i + 1); setPick(null); }}>
                  {i + 1 < qs.length ? 'Câu tiếp theo' : 'Xem kết quả'}
                </button>
              </>
            )}
          </div>
        )}
        <button className="btn" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
