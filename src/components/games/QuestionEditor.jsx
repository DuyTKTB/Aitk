import { useState } from 'react';
import { GAME_PRESETS } from '../../data/gamePresets';
import QuestionBankPicker from './QuestionBankPicker';

export default function QuestionEditor({
  game,
  questions,
  onChange,
  maxQuestions = 30,
}) {
  const [showBank, setShowBank] = useState(false);

  /* Nhận câu từ ngân hàng. Giữ question_id/topic_id để sau này ghi điểm + Sổ tay lỗi sai. */
  const applyBank = (picked, how) => {
    const clean = picked.map((q) => ({
      question: q.question,
      correct: q.correct,
      wrong: q.wrong,
      question_id: q.question_id,
      topic_id: q.topic_id,
      difficulty: q.difficulty,
      explanation: q.explanation,
    }));
    if (how === 'replace') {
      onChange(clean.slice(0, maxQuestions));
    } else {
      const have = new Set(questions.map((q) => q.question_id).filter(Boolean));
      onChange([...questions, ...clean.filter((q) => !have.has(q.question_id))].slice(0, maxQuestions));
    }
    setShowBank(false);
  };

  const addEmpty = () => {
    if (questions.length >= maxQuestions) return;
    onChange([...questions, { question: '', correct: '', wrong: ['', '', ''] }]);
  };

  const removeQ = (i) => onChange(questions.filter((_, j) => j !== i));

  const update = (i, key, val) =>
    onChange(questions.map((q, j) => (j === i ? { ...q, [key]: val } : q)));

  const loadPreset = () => {
    if (questions.length > 0 && !confirm('Ghi đè câu hỏi hiện tại bằng mẫu?')) return;
    onChange(GAME_PRESETS[game] || []);
  };

  const clearAll = () => {
    if (!confirm('Xóa toàn bộ câu hỏi?')) return;
    onChange([]);
  };

  const exportJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ game, questions }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chem-study-${game}-questions.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data.questions)) {
          onChange(data.questions);
          alert(`Đã nhập ${data.questions.length} câu hỏi.`);
        } else if (Array.isArray(data)) {
          onChange(data);
          alert(`Đã nhập ${data.length} câu hỏi.`);
        } else {
          alert('File không hợp lệ.');
        }
      } catch {
        alert('File không phải JSON hợp lệ.');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  return (
    <div className="card qeditor">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '-.02em' }}>
          Danh sách câu hỏi{' '}
          <span style={{ color: 'var(--mut)', fontWeight: 400, fontFamily: 'var(--mono)', fontSize: '.85rem' }}>
            {questions.length}/{maxQuestions}
          </span>
        </h3>
        <div className="row">
          <button className="btn sm" onClick={addEmpty} disabled={questions.length >= maxQuestions} type="button">
            + Thêm câu
          </button>
          <button className="btn sm" onClick={loadPreset} type="button">
            Tải mẫu
          </button>
          <button className="btn sm" onClick={() => setShowBank(true)} type="button">
            Từ ngân hàng
          </button>
          <label className="btn sm" style={{ cursor: 'pointer', margin: 0 }}>
            Nhập JSON
            <input type="file" accept=".json" hidden onChange={importJSON} />
          </label>
          <button className="btn sm" onClick={exportJSON} disabled={!questions.length} type="button">
            Xuất
          </button>
          <button className="btn sm" onClick={clearAll} disabled={!questions.length} type="button">
            Xóa hết
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="hint center" style={{ padding: '2rem 0' }}>
          Chưa có câu hỏi. Bấm <b>Tải mẫu</b> để có 10 câu mẫu, <b>Từ ngân hàng</b> để lấy câu theo chuyên đề, hoặc <b>+ Thêm câu</b> để tự nhập.
        </p>
      ) : (
        <div className="qlist">
          <div className="qhead">
            <span>#</span>
            <span>Câu hỏi</span>
            <span>Đáp án đúng</span>
            <span>Đáp án sai (phân cách bằng |)</span>
            <span></span>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="qrow">
              <span className="qnum">{String(i + 1).padStart(2, '0')}</span>
              <input
                className="qinput"
                value={q.question || ''}
                onChange={(e) => update(i, 'question', e.target.value)}
                placeholder="Vd: Ký hiệu của Natri?"
              />
              <input
                className="qinput qinput-correct"
                value={q.correct || ''}
                onChange={(e) => update(i, 'correct', e.target.value)}
                placeholder="Na"
              />
              <input
                className="qinput"
                value={(q.wrong || []).join(' | ')}
                onChange={(e) =>
                  update(i, 'wrong', e.target.value.split('|').map((s) => s.trim()).filter(Boolean))
                }
                placeholder="N | Ni | Np"
              />
              <button className="x" onClick={() => removeQ(i)} aria-label="Xóa" type="button">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showBank && (
        <QuestionBankPicker mode="list" maxCount={maxQuestions} onApply={applyBank} onClose={() => setShowBank(false)} />
      )}
    </div>
  );
}