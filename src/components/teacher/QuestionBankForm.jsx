/* ============================================================
   QuestionBankForm.jsx — Modal thêm / sửa câu hỏi ngân hàng
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import MathText from '../MathText.jsx';
import { CHEM_TOPICS } from '../../data/chemTopics.js';
import '../../styles/question-bank.css';

const IcoX = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

const ANSWERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_OPTS = 6;

const LEVELS = ['', 'nhận biết', 'thông hiểu', 'vận dụng', 'vận dụng cao'];
const SUBJECTS = ['Hóa học', 'Toán', 'Vật lí', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lí'];

export default function QuestionBankForm({
  initial = null,
  defaultSubject = '',
  defaultGrade = 0,
  onSave,
  onClose,
  saving = false,
}) {
  const [q, setQ] = useState(initial?.q || '');
  const [options, setOptions] = useState(initial?.options?.length ? initial.options : ['', '', '', '']);
  const [correct, setCorrect] = useState(typeof initial?.correct === 'number' ? initial.correct : 0);
  const [explain, setExplain] = useState(initial?.explain || '');
  const [points, setPoints] = useState(initial?.points || 1);
  const [subject, setSubject] = useState(initial?.subject || defaultSubject);
  const [grade, setGrade] = useState(initial?.grade || defaultGrade || 0);
  const [topicId, setTopicId] = useState(initial?.topicId || '');
  const [level, setLevel] = useState(initial?.level || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(initial?.tags || []);
  const [error, setError] = useState('');

  const textareaRef = useRef(null);

  useEffect(() => {
    if (!initial) textareaRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [initial, onClose, saving]);

  const updateOption = (i, val) => {
    setOptions((opts) => opts.map((o, k) => (k === i ? val : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTS) return;
    setOptions((opts) => [...opts, '']);
  };

  const removeOption = (i) => {
    if (options.length <= 2) return;
    setOptions((opts) => opts.filter((_, k) => k !== i));
    setCorrect((c) => (c === i ? 0 : c > i ? c - 1 : c));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTags((arr) => [...arr, t]);
    setTagInput('');
  };

  const removeTag = (t) => setTags((arr) => arr.filter((x) => x !== t));

  /* another = true → lưu rồi giữ hộp mở để nhập câu tiếp (chỉ khi thêm mới) */
  const handleSubmit = (another = false) => {
    if (!q.trim()) { setError('Chưa có nội dung câu hỏi.'); return; }
    if (options.filter((o) => o.trim()).length < 2) { setError('Cần ít nhất 2 đáp án.'); return; }
    if (!options[correct]?.trim()) { setError('Đáp án đúng chưa có nội dung.'); return; }

    const kept = [];
    let newCorrect = -1;
    options.forEach((opt, i) => {
      if (!opt.trim()) return;
      if (i === correct) newCorrect = kept.length;
      kept.push(opt.trim());
    });

    setError('');
    onSave?.({
      q: q.trim(),
      options: kept,
      correct: newCorrect >= 0 ? newCorrect : 0,
      explain: explain.trim(),
      points: Number(points) || 1,
      subject: subject.trim(),
      grade: Number(grade) || 0,
      topicId: topicId.trim(),
      level: level.trim(),
      tags,
    }, { another: another === true });
  };

  return (
    <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose?.()}>
      <div className="qb-form-modal" role="dialog" aria-modal="true" aria-label={initial ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}>
        <header className="qb-form-head">
          <h2>{initial ? 'Sửa câu hỏi' : 'Thêm câu hỏi vào ngân hàng'}</h2>
          <button type="button" className="qb-icon-btn" onClick={onClose} disabled={saving} aria-label="Đóng">
            <IcoX size={16} />
          </button>
        </header>

        <div className="qb-form-body">
          {/* Thông tin phân loại */}
          <div className="qb-row-3">
            <label className="qb-field">
              <span>Môn</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} disabled={saving}>
                <option value="">Chưa chọn</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                {subject && !SUBJECTS.includes(subject) && <option value={subject}>{subject}</option>}
              </select>
            </label>
            <label className="qb-field">
              <span>Lớp</span>
              <input
                type="number"
                min={6}
                max={12}
                value={grade || ''}
                onChange={(e) => setGrade(Number(e.target.value) || 0)}
                placeholder="0 = mọi lớp"
                disabled={saving}
              />
            </label>
            <label className="qb-field">
              <span>Độ khó</span>
              <select value={level} onChange={(e) => setLevel(e.target.value)} disabled={saving}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l || 'Chưa phân loại'}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="qb-field">
            <span>Chuyên đề</span>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={saving}>
              <option value="">Chưa phân loại</option>
              {CHEM_TOPICS.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
              {topicId && !CHEM_TOPICS.some((tp) => tp.id === topicId) && (
                <option value={topicId}>{topicId} (mã cũ)</option>
              )}
            </select>
          </label>

          {/* Câu hỏi */}
          <label className="qb-field">
            <span>Nội dung câu hỏi</span>
            <textarea
              ref={textareaRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nhập nội dung câu hỏi. Có thể dùng LaTeX trong $...$"
              rows={3}
              disabled={saving}
            />
          </label>

          {q.trim() && (
            <div style={{ padding: '.6rem .9rem', background: 'var(--soft)', borderRadius: 10, fontSize: '.85rem' }}>
              <small style={{ color: 'var(--mut)', display: 'block', marginBottom: '.3rem' }}>Xem trước:</small>
              <MathText>{q}</MathText>
            </div>
          )}

          {/* Đáp án */}
          <div className="qb-field">
            <span>Đáp án (chọn nút tròn làm đáp án đúng)</span>
            {options.map((opt, i) => (
              <div key={i} className={'qb-opt-row' + (correct === i ? ' correct' : '')}>
                <input
                  type="radio"
                  name="qb-correct"
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  disabled={saving}
                  aria-label={`Đáp án ${ANSWERS[i]} là đáp án đúng`}
                />
                <span className="qb-opt-key">{ANSWERS[i]}</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Đáp án ${ANSWERS[i]}`}
                  disabled={saving}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="qb-icon-btn danger"
                    onClick={() => removeOption(i)}
                    disabled={saving}
                    aria-label={`Xóa đáp án ${ANSWERS[i]}`}
                  >
                    <IcoTrash size={12} />
                  </button>
                )}
              </div>
            ))}
            {options.length < MAX_OPTS && (
              <button
                type="button"
                className="qb-chip"
                onClick={addOption}
                disabled={saving}
                style={{ alignSelf: 'flex-start', marginTop: '.3rem' }}
              >
                <IcoPlus size={12} /> Thêm đáp án
              </button>
            )}
          </div>

          {/* Lời giải */}
          <label className="qb-field">
            <span>Lời giải (không bắt buộc)</span>
            <textarea
              value={explain}
              onChange={(e) => setExplain(e.target.value)}
              placeholder="Giải thích vì sao đáp án đúng..."
              rows={2}
              disabled={saving}
            />
          </label>

          {/* Điểm */}
          <label className="qb-field" style={{ maxWidth: 180 }}>
            <span>Điểm câu này</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              disabled={saving}
            />
          </label>

          {/* Tags */}
          <div className="qb-field">
            <span>Tag (tối đa 10)</span>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="VD: este, luyện tập, khó..."
                disabled={saving || tags.length >= 10}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="qb-chip"
                onClick={addTag}
                disabled={saving || !tagInput.trim() || tags.length >= 10}
              >
                <IcoPlus size={12} /> Thêm
              </button>
            </div>
            {tags.length > 0 && (
              <div className="qb-tags" style={{ marginTop: '.4rem' }}>
                {tags.map((t) => (
                  <span key={t} className="qb-tag">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} disabled={saving} aria-label={`Xóa tag ${t}`}>
                      <IcoX size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" style={{
              margin: 0,
              padding: '.6rem .9rem',
              borderRadius: 10,
              background: 'color-mix(in srgb, #dc2626 10%, var(--panel))',
              borderLeft: '3px solid #dc2626',
              color: '#dc2626',
              font: '600 .84rem/1.4 var(--sans)',
            }}>
              {error}
            </p>
          )}
        </div>

        <footer className="qb-form-foot">
          <button type="button" className="vt-btn" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          {!initial && (
            <button type="button" className="vt-btn" onClick={() => handleSubmit(true)} disabled={saving}>
              <IcoPlus size={14} /> Lưu và thêm tiếp
            </button>
          )}
          <button type="button" className="vt-btn primary" onClick={() => handleSubmit(false)} disabled={saving}>
            {saving ? 'Đang lưu...' : (<><IcoCheck size={14} /> {initial ? 'Lưu thay đổi' : 'Thêm câu'}</>)}
          </button>
        </footer>
      </div>
    </div>
  );
}