/* ============================================================
   ExamCreateForm.jsx — Form tạo đề thủ công
   (Dùng class .cep-* cho giao diện đồng bộ trang Tạo đề)
   ============================================================ */
import { useState } from 'react';

/* ============ SVG ICONS ============ */
const IcoPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoX = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoCalendar = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </svg>
);
const IcoShield = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
  </svg>
);
const IcoCam = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
);
const IcoDoc = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);

const IcoWarn = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l10 18H2z" />
    <path d="M12 10v5M12 18v.5" />
  </svg>
);

/* ============ DATA HELPERS ============ */
const blankAnswers = () => [
  { label: 'A', content: '', is_correct: true, sort_order: 0 },
  { label: 'B', content: '', is_correct: false, sort_order: 1 },
  { label: 'C', content: '', is_correct: false, sort_order: 2 },
  { label: 'D', content: '', is_correct: false, sort_order: 3 },
];

const emptyQuestion = () => ({
  q: '',
  options: ['', '', '', ''],
  correct: 0,
  points: 1,
  explain: '',
  warns: [],
});

/* Nạp câu hỏi từ `initial`.
   BUG CŨ: đoạn findIndex(o => o.is_correct ...) chạy trên option dạng chuỗi
   nên luôn ra -1 → mọi đề AI đều mất đáp án đúng. Nay ưu tiên số `correct`
   đã tính sẵn; chỉ dùng nhánh cũ khi dữ liệu dạng {label, is_correct}. */
const MAX_OPTS = 6;
const toFormQuestion = (q) => {
  const raw = q.options || q.answers || [];
  const options = raw.map((o) => (typeof o === 'string' ? o : o.content || ''));
  let correct = typeof q.correct === 'number' ? q.correct : -1;
  if (correct < 0 && raw.some((o) => typeof o === 'object')) {
    correct = raw.findIndex((o) => o.is_correct || (q.correctAnswer && o.label === q.correctAnswer));
  }
  return {
    q: q.q || q.content || '',
    options,
    correct, // -1 = chưa chọn → form báo lỗi thay vì âm thầm chọn A
    points: q.points || 1,
    explain: q.explain || q.explanation || '',
    warns: Array.isArray(q.warns) ? q.warns : [],
  };
};

const localToIso = (v) => (v ? new Date(v).toISOString() : null);
const ANSWERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function ExamCreateForm({
  initial = null,
  classInfo,
  onSave,
  onCancel,
  saving = false,
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [duration, setDuration] = useState(initial?.duration || 15);
  const [questions, setQuestions] = useState(
    initial?.questions?.length
      ? initial.questions.map(toFormQuestion)
      : [emptyQuestion()]
  );
  const [showAnswerAfter, setShowAnswerAfter] = useState(initial?.showAnswerAfter ?? true);
  const [allowRetry, setAllowRetry] = useState(initial?.allowRetry ?? false);
  const [shuffle, setShuffle] = useState(initial?.shuffle ?? false);
  const [opensAt, setOpensAt] = useState(initial?.opensAt || '');
  const [closesAt, setClosesAt] = useState(initial?.closesAt || '');
  const [error, setError] = useState('');

  /* Proctor config */
  const [proctor, setProctor] = useState(initial?.proctor || {
    fullscreenLock: true,
    tabSwitchLimit: 3,
    blockCopyPaste: true,
    camera: 'off',
    cameraChecks: {
      noFace: true,
      multiFace: true,
      lookAway: false,
      handRaise: true,
      phoneLike: true,
    },
    snapshotOnEvent: true,
    maxSnapshots: 10,
    retentionDays: 30,
  });

  /* ============ QUESTION ACTIONS ============ */
  const updateQ = (i, patch) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  /* Chọn đáp án đúng → bỏ cảnh báo liên quan đáp án */
  const chooseCorrect = (qi, oi) => {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === qi
          ? { ...q, correct: oi, warns: q.warns.filter((w) => !/đáp án/i.test(w)) }
          : q
      )
    );
  };

  const addOption = (qi) => {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === qi && q.options.length < MAX_OPTS ? { ...q, options: [...q.options, ''] } : q
      )
    );
  };

  const removeOption = (qi, oi) => {
    setQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, k) => k !== oi);
        let correct = q.correct;
        if (correct === oi) correct = -1;
        else if (correct > oi) correct -= 1;
        return { ...q, options, correct };
      })
    );
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

  const setProctorField = (k, v) => setProctor((p) => ({ ...p, [k]: v }));
  const setCameraCheck = (k, v) => setProctor((p) => ({ ...p, cameraChecks: { ...p.cameraChecks, [k]: v } }));

  /* ============ VALIDATE ============ */
  const validate = () => {
    if (!title.trim()) return 'Vui lòng nhập tên đề.';
    if (!questions.length) return 'Cần ít nhất 1 câu hỏi.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.q.trim()) return `Câu ${i + 1}: chưa có nội dung.`;
      const filled = q.options.filter((o) => o.trim()).length;
      if (filled < 2) return `Câu ${i + 1}: cần ít nhất 2 đáp án.`;
      if (q.correct < 0) return `Câu ${i + 1}: chưa chọn đáp án đúng.`;
      if (!q.options[q.correct]?.trim()) return `Câu ${i + 1}: đáp án đúng chưa có nội dung.`;
    }
    if (opensAt && closesAt && new Date(opensAt) >= new Date(closesAt)) {
      return 'Giờ đóng phải sau giờ mở.';
    }
    return '';
  };

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
        ...(q.explain?.trim() ? { explain: q.explain.trim() } : {}),
      };
    });

  const handleSubmit = () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    onSave?.({
      title: title.trim(),
      description: description.trim(),
      duration: Number(duration) || 15,
      questions: cleanQuestions(),
      showAnswerAfter,
      allowRetry,
      shuffle,
      opensAt: localToIso(opensAt),
      closesAt: localToIso(closesAt),
      proctor,
    });
  };

  /* ============ RENDER ============ */
  return (
    <div className="cep">
      {/* ===== THÔNG TIN ĐỀ ===== */}
      <div className="cep-card">
        <header className="cep-card-head">
          <h3 className="cep-card-title">
            <IcoDoc size={16} /> Thông tin đề thi
          </h3>
        </header>

        <div className="cep-form">
          <div className="cep-row">
            <label className="cep-field">
              <span>Tên đề</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kiểm tra 15p Chương 1"
                maxLength={80}
              />
            </label>
            <label className="cep-field">
              <span>Thời gian (phút)</span>
              <input
                type="number"
                min="1"
                max="180"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </label>
          </div>

          <label className="cep-field">
            <span>Mô tả (tùy chọn)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Ôn tập chương 1 — sự điện li"
              maxLength={120}
            />
          </label>

          <div className="cep-row">
            <label className="cep-field">
              <span>Mở lúc (tùy chọn)</span>
              <input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
              />
            </label>
            <label className="cep-field">
              <span>Đóng lúc (tùy chọn)</span>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
              />
            </label>
          </div>

          <div className="cep-chips">
            <label className={'cep-check' + (showAnswerAfter ? ' on' : '')}>
              <input
                type="checkbox"
                checked={showAnswerAfter}
                onChange={(e) => setShowAnswerAfter(e.target.checked)}
              />
              Hiện đáp án sau khi nộp
            </label>
            <label className={'cep-check' + (allowRetry ? ' on' : '')}>
              <input
                type="checkbox"
                checked={allowRetry}
                onChange={(e) => setAllowRetry(e.target.checked)}
              />
              Cho phép làm lại
            </label>
            <label className={'cep-check' + (shuffle ? ' on' : '')}>
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
              />
              Xáo trộn câu hỏi
            </label>
          </div>
        </div>
      </div>

      {/* ===== GIÁM SÁT ===== */}
      <div className="cep-card">
        <header className="cep-card-head">
          <h3 className="cep-card-title">
            <IcoShield size={16} /> Giám sát khi thi
          </h3>
        </header>

        <div className="cep-form">
          <div className="cep-chips">
            <label className={'cep-check' + (proctor.fullscreenLock ? ' on' : '')}>
              <input
                type="checkbox"
                checked={proctor.fullscreenLock}
                onChange={(e) => setProctorField('fullscreenLock', e.target.checked)}
              />
              Bắt buộc toàn màn hình
            </label>
            <label className={'cep-check' + (proctor.blockCopyPaste ? ' on' : '')}>
              <input
                type="checkbox"
                checked={proctor.blockCopyPaste}
                onChange={(e) => setProctorField('blockCopyPaste', e.target.checked)}
              />
              Chặn sao chép / dán
            </label>
          </div>

          <label className="cep-field" style={{ maxWidth: 280 }}>
            <span>Ngưỡng tự động nộp (số lần vi phạm)</span>
            <input
              type="number"
              min="1"
              max="10"
              value={proctor.tabSwitchLimit}
              onChange={(e) => setProctorField('tabSwitchLimit', Math.max(1, Math.min(10, Number(e.target.value) || 3)))}
            />
          </label>

          <div className="cep-field">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
              <IcoCam size={13} /> Camera giám sát
            </span>
            <div className="cep-chips">
              {[
                ['off', 'Không dùng'],
                ['optional', 'Khuyến khích'],
                ['required', 'Bắt buộc'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={'cep-chip' + (proctor.camera === val ? ' on' : '')}
                  onClick={() => setProctorField('camera', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {proctor.camera !== 'off' && (
            <div className="cep-field">
              <span>Phát hiện hành vi</span>
              <div className="cep-chips">
                <label className={'cep-check' + (proctor.cameraChecks.noFace ? ' on' : '')}>
                  <input type="checkbox" checked={proctor.cameraChecks.noFace} onChange={(e) => setCameraCheck('noFace', e.target.checked)} />
                  Không thấy mặt
                </label>
                <label className={'cep-check' + (proctor.cameraChecks.multiFace ? ' on' : '')}>
                  <input type="checkbox" checked={proctor.cameraChecks.multiFace} onChange={(e) => setCameraCheck('multiFace', e.target.checked)} />
                  Nhiều khuôn mặt
                </label>
                <label className={'cep-check' + (proctor.cameraChecks.lookAway ? ' on' : '')}>
                  <input type="checkbox" checked={proctor.cameraChecks.lookAway} onChange={(e) => setCameraCheck('lookAway', e.target.checked)} />
                  Nhìn ra ngoài
                </label>
                <label className={'cep-check' + (proctor.cameraChecks.handRaise ? ' on' : '')}>
                  <input type="checkbox" checked={proctor.cameraChecks.handRaise} onChange={(e) => setCameraCheck('handRaise', e.target.checked)} />
                  Cử chỉ tay
                </label>
                <label className={'cep-check' + (proctor.cameraChecks.phoneLike ? ' on' : '')}>
                  <input type="checkbox" checked={proctor.cameraChecks.phoneLike} onChange={(e) => setCameraCheck('phoneLike', e.target.checked)} />
                  Vật thể lạ
                </label>
              </div>
              <p className="cep-alert info" style={{ marginTop: '.3rem' }}>
                <span>Camera chỉ bật khi học sinh đồng ý. Không ghi video — chỉ chụp ảnh nhỏ khi có sự kiện, tự xóa sau {proctor.retentionDays} ngày.</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== CÂU HỎI ===== */}
      <div className="cep-card">
        <header className="cep-card-head">
          <h3 className="cep-card-title">
            Câu hỏi ({questions.length})
          </h3>
        </header>

        <div className="cep-qlist">
          {questions.map((q, qi) => (
            <div key={qi} className={'cep-qitem' + (q.correct < 0 || q.warns.length ? ' invalid' : '')}>
              <div className="cep-qhead">
                <span className="cep-qnum">Câu {qi + 1}</span>
                {q.correct < 0 && <span className="cep-qbadge warn">Chưa chọn đáp án đúng</span>}
                {q.warns.filter((w) => !/chưa xác định được đáp án/i.test(w)).map((w, wi) => (
                  <span key={wi} className="cep-qbadge warn" title={w}><IcoWarn size={11} /> {w.length > 48 ? w.slice(0, 46) + '…' : w}</span>
                ))}
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="cep-iconbtn danger"
                    onClick={() => removeQuestion(qi)}
                    title="Xóa câu"
                    aria-label={`Xóa câu ${qi + 1}`}
                  >
                    <IcoX size={14} />
                  </button>
                )}
              </div>

              <label className="cep-field" style={{ marginBottom: '.6rem' }}>
                <span>Nội dung câu hỏi</span>
                <textarea
                  placeholder="Nhập nội dung câu hỏi..."
                  value={q.q}
                  onChange={(e) => updateQ(qi, { q: e.target.value })}
                  rows={2}
                />
              </label>

              <div style={{ marginBottom: '.5rem' }}>
                <span style={{ font: '700 .78rem var(--sans)', color: 'var(--mut)', display: 'block', marginBottom: '.4rem' }}>
                  Đáp án — chọn nút tròn ở đáp án đúng
                </span>
                {q.options.map((opt, oi) => (
                  <div key={oi} className={'cep-opt-row' + (q.correct === oi ? ' correct' : '')}>
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correct === oi}
                      onChange={() => chooseCorrect(qi, oi)}
                      style={{ accentColor: '#22c55e', width: 18, height: 18, flexShrink: 0 }}
                      aria-label={`Đáp án ${ANSWERS[oi]} là đáp án đúng`}
                    />
                    <span className="cep-opt-key">{ANSWERS[oi]}</span>
                    <input
                      className="cep-opt-input"
                      placeholder={`Nội dung đáp án ${ANSWERS[oi]}`}
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        className="cep-iconbtn danger"
                        onClick={() => removeOption(qi, oi)}
                        title="Xóa đáp án này"
                        aria-label={`Xóa đáp án ${ANSWERS[oi]}`}
                      >
                        <IcoX size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < MAX_OPTS && (
                  <button type="button" className="cep-add-btn" style={{ marginTop: '.3rem' }} onClick={() => addOption(qi)}>
                    <IcoPlus size={12} /> Thêm đáp án
                  </button>
                )}
              </div>

              <label className="cep-field" style={{ marginBottom: '.6rem' }}>
                <span>Lời giải (tùy chọn — hiện cho học sinh sau khi nộp nếu bật "Hiện đáp án")</span>
                <textarea
                  placeholder="Giải thích vì sao đáp án đó đúng…"
                  value={q.explain || ''}
                  onChange={(e) => updateQ(qi, { explain: e.target.value })}
                  rows={2}
                />
              </label>

              <label className="cep-field" style={{ maxWidth: 200 }}>
                <span>Điểm câu này</span>
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

        <div className="cep-add-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="cep-add-btn" onClick={addQuestion}>
            <IcoPlus size={14} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {error && (
        <div className="cep-alert error">
          <IcoX size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ===== ACTIONS ===== */}
      <div className="cep-actions">
        <div className="cep-actions-left">
          <button type="button" className="vt-btn" onClick={onCancel} disabled={saving}>
            Hủy
          </button>
        </div>
        <button type="button" className="vt-btn primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Đang lưu…' : (<><IcoCheck size={14} /> Lưu đề</>)}
        </button>
      </div>
    </div>
  );
}