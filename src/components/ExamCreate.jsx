import { useState } from 'react';
import { createExam, defaultProctor } from '../lib/classroom.js';

/* ============ SVG ICONS ============ */
const IcoPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoX = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoCalendar = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
const IcoShield = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
  </svg>
);
const IcoCam = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
);

const emptyQuestion = () => ({
  q: '',
  options: ['', '', '', ''],
  correct: 0,
  points: 1,
});

const localToIso = (v) => (v ? new Date(v).toISOString() : null);

export default function ExamCreate({ classInfo, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [showAnswerAfter, setShowAnswerAfter] = useState(true);
  const [allowRetry, setAllowRetry] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Proctor config
  const [proctor, setProctor] = useState(defaultProctor);

  const updateQ = (i, patch) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };
  const updateOption = (qi, oi, val) => {
    setQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== qi) return q;
        const opts = [...q.options];
        opts[oi] = val;
        return { ...q, options: opts };
      })
    );
  };
  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestion = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const setProctorField = (k, v) =>
    setProctor((p) => ({ ...p, [k]: v }));
  const setCameraCheck = (k, v) =>
    setProctor((p) => ({ ...p, cameraChecks: { ...p.cameraChecks, [k]: v } }));

  const validate = () => {
    if (!title.trim()) return 'Vui lòng nhập tên đề.';
    if (!questions.length) return 'Cần ít nhất 1 câu hỏi.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.q.trim()) return `Câu ${i + 1}: chưa có nội dung.`;
      const filled = q.options.filter((o) => o.trim()).length;
      if (filled < 2) return `Câu ${i + 1}: cần ít nhất 2 đáp án.`;
      if (!q.options[q.correct]?.trim()) return `Câu ${i + 1}: đáp án đúng chưa có nội dung.`;
    }
    if (opensAt && closesAt && new Date(opensAt) >= new Date(closesAt)) {
      return 'Giờ đóng phải sau giờ mở.';
    }
    return '';
  };

  /**
   * Lọc đáp án rỗng NHƯNG giữ đúng chỉ số đáp án đúng.
   * Bản cũ sai: sau khi filter, `correct` giữ nguyên chỉ số cũ → lệch.
   */
  const cleanQuestions = () =>
    questions.map((q) => {
      const kept = [];
      let newCorrect = -1;
      q.options.forEach((opt, idx) => {
        const val = opt.trim();
        if (!val) return;
        if (idx === q.correct) newCorrect = kept.length;
        kept.push(val);
      });
      return {
        q: q.q.trim(),
        options: kept,
        correct: newCorrect >= 0 ? newCorrect : 0,
        points: Number(q.points) || 1,
      };
    });

  const handleSave = async () => {
    const err = validate();
    if (err) return setError(err);

    setSaving(true);
    setError('');
    try {
      const cleaned = cleanQuestions();
      const exam = await createExam({
        teacherId: classInfo.teacherId,
        teacherName: classInfo.teacherName,
        classId: classInfo.id,
        title: title.trim(),
        description: description.trim(),
        duration: Number(duration) || 15,
        questions: cleaned,
        showAnswerAfter,
        allowRetry,
        shuffle,
        opensAt: localToIso(opensAt),
        closesAt: localToIso(closesAt),
        proctor,
      });
      onCreated?.(exam);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Không lưu được đề.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="td-modal-backdrop" onClick={onClose}>
      <div className="td-modal wide ec-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Tạo đề cho lớp {classInfo.name}</h3>

        <div className="ec-row">
          <label>
            Tên đề
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Kiểm tra 15p Chương 1" maxLength={80} />
          </label>
          <label>
            Thời gian (phút)
            <input type="number" min="1" max="180" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </label>
        </div>

        <label className="ec-full">
          Mô tả (tùy chọn)
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ôn tập chương 1" maxLength={120} />
        </label>

        <div className="ec-row">
          <label>
            <span className="ec-label-row"><IcoCalendar /> Mở lúc (tùy chọn)</span>
            <input type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
          </label>
          <label>
            <span className="ec-label-row"><IcoCalendar /> Đóng lúc (tùy chọn)</span>
            <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </label>
        </div>

        <div className="ec-options">
          <label className="ec-check">
            <input type="checkbox" checked={showAnswerAfter} onChange={(e) => setShowAnswerAfter(e.target.checked)} />
            Hiện đáp án sau khi nộp
          </label>
          <label className="ec-check">
            <input type="checkbox" checked={allowRetry} onChange={(e) => setAllowRetry(e.target.checked)} />
            Cho phép làm lại
          </label>
          <label className="ec-check">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
            Xáo trộn câu hỏi
          </label>
        </div>

        {/* ============ NHÓM GIÁM SÁT ============ */}
        <div className="ec-proctor">
          <h4 className="ec-proctor-title">
            <IcoShield /> Giám sát khi thi
          </h4>

          <div className="ec-proctor-grid">
            <label className="ec-check">
              <input
                type="checkbox"
                checked={proctor.fullscreenLock}
                onChange={(e) => setProctorField('fullscreenLock', e.target.checked)}
              />
              Bắt buộc toàn màn hình
            </label>

            <label className="ec-check">
              <input
                type="checkbox"
                checked={proctor.blockCopyPaste}
                onChange={(e) => setProctorField('blockCopyPaste', e.target.checked)}
              />
              Chặn sao chép / dán
            </label>

            <label className="ec-field-inline">
              <span>Ngưỡng tự nộp</span>
              <input
                type="number"
                min="1"
                max="10"
                value={proctor.tabSwitchLimit}
                onChange={(e) => setProctorField('tabSwitchLimit', Math.max(1, Math.min(10, Number(e.target.value) || 3)))}
              />
              <small>lần vi phạm</small>
            </label>
          </div>

          <div className="ec-proctor-cam">
            <span className="ec-proctor-label"><IcoCam /> Camera giám sát</span>
            <div className="ec-cam-modes" role="radiogroup" aria-label="Chế độ camera">
              {[
                ['off', 'Không dùng'],
                ['optional', 'Khuyến khích'],
                ['required', 'Bắt buộc'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={proctor.camera === val}
                  className={'ec-cam-btn' + (proctor.camera === val ? ' on' : '')}
                  onClick={() => setProctorField('camera', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {proctor.camera !== 'off' && (
            <div className="ec-proctor-checks">
              <span className="ec-proctor-label">Phát hiện</span>
              <div className="ec-proctor-grid">
                <label className="ec-check">
                  <input type="checkbox" checked={proctor.cameraChecks.noFace} onChange={(e) => setCameraCheck('noFace', e.target.checked)} />
                  Không thấy mặt
                </label>
                <label className="ec-check">
                  <input type="checkbox" checked={proctor.cameraChecks.multiFace} onChange={(e) => setCameraCheck('multiFace', e.target.checked)} />
                  Nhiều khuôn mặt
                </label>
                <label className="ec-check">
                  <input type="checkbox" checked={proctor.cameraChecks.lookAway} onChange={(e) => setCameraCheck('lookAway', e.target.checked)} />
                  Nhìn ra ngoài (có thể báo nhầm)
                </label>
                <label className="ec-check">
                  <input type="checkbox" checked={proctor.cameraChecks.handRaise} onChange={(e) => setCameraCheck('handRaise', e.target.checked)} />
                  Tay giơ lên ngang mặt
                </label>
                <label className="ec-check">
                  <input type="checkbox" checked={proctor.cameraChecks.phoneLike} onChange={(e) => setCameraCheck('phoneLike', e.target.checked)} />
                  Vật thể lạ trước mặt
                </label>
              </div>
              <p className="ec-proctor-note">
                Camera chỉ bật khi học sinh đồng ý. Không ghi video. Chỉ chụp ảnh nhỏ khi có sự kiện và tự xoá sau {proctor.retentionDays} ngày. Cần thông báo trước cho học sinh và phụ huynh.
              </p>
            </div>
          )}
        </div>

        <h4 className="td-subtitle">Câu hỏi ({questions.length})</h4>

        <div className="ec-questions">
          {questions.map((q, qi) => (
            <div key={qi} className="ec-q">
              <div className="ec-q-head">
                <span className="ec-q-num">Câu {qi + 1}</span>
                {questions.length > 1 && (
                  <button className="ec-q-del" onClick={() => removeQuestion(qi)} title="Xóa câu" type="button"><IcoX /></button>
                )}
              </div>

              <input
                className="ec-q-input"
                placeholder="Nội dung câu hỏi..."
                value={q.q}
                onChange={(e) => updateQ(qi, { q: e.target.value })}
              />

              <div className="ec-opts">
                {q.options.map((opt, oi) => (
                  <label key={oi} className={'ec-opt' + (q.correct === oi ? ' correct' : '')}>
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correct === oi}
                      onChange={() => updateQ(qi, { correct: oi })}
                    />
                    <span className="ec-opt-key">{String.fromCharCode(65 + oi)}</span>
                    <input
                      className="ec-opt-input"
                      placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                    />
                  </label>
                ))}
              </div>

              <label className="ec-points">
                Điểm:
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={q.points}
                  onChange={(e) => updateQ(qi, { points: Number(e.target.value) || 1 })}
                />
              </label>
            </div>
          ))}
        </div>

        <button className="ec-add" onClick={addQuestion} type="button">
          <IcoPlus /> Thêm câu hỏi
        </button>

        {error && <p className="ec-error">{error}</p>}

        <div className="ec-actions">
          <button className="td-btn" onClick={onClose} type="button" disabled={saving}>Hủy</button>
          <button className="td-btn primary" onClick={handleSave} type="button" disabled={saving}>
            <IcoCheck /> {saving ? 'Đang lưu…' : 'Lưu đề'}
          </button>
        </div>
      </div>
    </div>
  );
}