/* ============================================================
   ExamCreateForm.jsx — Form tạo đề thủ công (v3)
   ------------------------------------------------------------
   v3:
     • Nút "Chọn từ ngân hàng" — mở ExamPickerFromBank
     • Autosave nháp vào localStorage mỗi 2 giây
     • Khôi phục nháp khi mở lại
     • Cảnh báo beforeunload nếu có dữ liệu chưa lưu
     • Chỉ dùng SVG, không emoji
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import ExamPickerFromBank from './teacher/ExamPickerFromBank.jsx';
import { bumpUsage } from '../lib/questionBank.js';

const DRAFT_KEY = 'cs-exam-manual-draft:v1';

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
const IcoDoc = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const IcoWarn = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l10 18H2z" />
    <path d="M12 10v5M12 18v.5" />
  </svg>
);
const IcoSave = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const IcoLibrary = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h6v16H4zM14 4h6v16h-6z" />
  </svg>
);

const emptyQuestion = () => ({
  q: '',
  options: ['', '', '', ''],
  correct: 0,
  points: 1,
  explain: '',
  warns: [],
});

const MAX_OPTS = 6;
const ANSWERS = ['A', 'B', 'C', 'D', 'E', 'F'];

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
    correct,
    points: q.points || 1,
    explain: q.explain || q.explanation || '',
    warns: Array.isArray(q.warns) ? q.warns : [],
    topic: q.topic || '',
    level: q.level || '',
    _bankId: q._bankId || q.id || null,
  };
};

const localToIso = (v) => (v ? new Date(v).toISOString() : null);

function loadManualDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || !d.questions?.length) return null;
    return d;
  } catch { return null; }
}

function clearManualDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }
}

export default function ExamCreateForm({
  initial = null,
  onDirty,
  classInfo,
  onSave,
  onCancel,
  saving = false,
}) {
  const { user } = useAuth();
  const saved = useRef(loadManualDraft()).current;
  const startData = initial || saved;

  const [title, setTitle] = useState(startData?.title || '');
  const [description, setDescription] = useState(startData?.description || '');
  const [duration, setDuration] = useState(startData?.duration || 15);
  const [questions, setQuestions] = useState(
    startData?.questions?.length
      ? startData.questions.map(toFormQuestion)
      : [emptyQuestion()]
  );
  const [showAnswerAfter, setShowAnswerAfter] = useState(startData?.showAnswerAfter ?? true);
  const [allowRetry, setAllowRetry] = useState(startData?.allowRetry ?? false);
  const [shuffle, setShuffle] = useState(startData?.shuffle ?? false);
  const [opensAt, setOpensAt] = useState(startData?.opensAt || '');
  const [closesAt, setClosesAt] = useState(startData?.closesAt || '');
  const [error, setError] = useState('');
  const [restoredBanner, setRestoredBanner] = useState(!!saved && !initial);
  const [showPicker, setShowPicker] = useState(false);

  const [proctor, setProctor] = useState(startData?.proctor || {
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

  const autosaveTimer = useRef(null);

  useEffect(() => {
    const isDirty = !!title.trim() || questions.some((q) => q.q.trim() || q.options.some((o) => o.trim()));
    onDirty?.(isDirty);

    clearTimeout(autosaveTimer.current);
    if (!isDirty) return;

    autosaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title, description, duration, questions,
          showAnswerAfter, allowRetry, shuffle,
          opensAt, closesAt, proctor,
          savedAt: Date.now(),
        }));
      } catch { /* */ }
    }, 2000);

    return () => clearTimeout(autosaveTimer.current);
  }, [title, description, duration, questions, showAnswerAfter, allowRetry, shuffle, opensAt, closesAt, proctor, onDirty]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      const isDirty = !!title.trim() || questions.some((q) => q.q.trim() || q.options.some((o) => o.trim()));
      if (!isDirty || saving) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [title, questions, saving]);

  const updateQ = (i, patch) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

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

  /* ============ PICK FROM BANK ============ */
  const handlePickFromBank = (selected) => {
    if (!selected?.length) return;
    const newOnes = selected.map((q) => ({
      q: q.q,
      options: [...q.options],
      correct: q.correct,
      points: q.points || 1,
      explain: q.explain || '',
      warns: [],
      topic: q.topicId || '',
      level: q.level || '',
      _bankId: q.id,
    }));
    setQuestions((qs) => {
      const cleaned = qs.filter((q) => q.q.trim() || q.options.some((o) => o.trim()));
      return [...cleaned, ...newOnes];
    });
    setShowPicker(false);
  };

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
        ...(q.topic ? { topic: q.topic } : {}),
        ...(q.level ? { level: q.level } : {}),
      };
    });

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    clearManualDraft();

    const bankIds = questions.map((q) => q._bankId).filter(Boolean);
    if (bankIds.length > 0 && user?.uid) {
      bumpUsage(bankIds).catch(() => {});
    }

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

  const handleCancel = () => {
    const isDirty = !!title.trim() || questions.some((q) => q.q.trim() || q.options.some((o) => o.trim()));
    if (isDirty && !saving) {
      const ok = window.confirm('Bạn có nội dung chưa lưu. Vẫn hủy?');
      if (!ok) return;
    }
    clearManualDraft();
    onCancel?.();
  };

  const handleClearDraft = () => {
    if (!window.confirm('Xóa toàn bộ nội dung đang soạn?')) return;
    clearManualDraft();
    setTitle('');
    setDescription('');
    setQuestions([emptyQuestion()]);
    setRestoredBanner(false);
  };

  return (
    <div className="cep">
      {restoredBanner && (
        <div className="cep-alert info">
          <IcoSave size={16} />
          <span>
            Đã khôi phục bản nháp trước đó. Bấm <b>Lưu đề</b> để hoàn tất hoặc <b>Xóa nháp</b> để bắt đầu lại.
          </span>
          <button type="button" className="cep-add-btn" onClick={handleClearDraft} style={{ marginLeft: 'auto' }}>
            <IcoX size={12} /> Xóa nháp
          </button>
        </div>
      )}

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
              placeholder="VD: Ôn tập chương 1, sự điện li"
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
              Chặn sao chép và dán
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
                <span>Camera chỉ bật khi học sinh đồng ý. Không ghi video, chỉ chụp ảnh nhỏ khi có sự kiện, tự xóa sau {proctor.retentionDays} ngày.</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="cep-card">
        <header className="cep-card-head">
          <h3 className="cep-card-title">
            Câu hỏi ({questions.length})
          </h3>
          <button
            type="button"
            className="cep-add-btn"
            onClick={() => setShowPicker(true)}
            style={{ alignSelf: 'center' }}
          >
            <IcoLibrary size={14} /> Chọn từ ngân hàng
          </button>
        </header>

        <div className="cep-qlist">
          {questions.map((q, qi) => (
            <div key={qi} className={'cep-qitem' + (q.correct < 0 || q.warns.length ? ' invalid' : '')}>
              <div className="cep-qhead">
                <span className="cep-qnum">Câu {qi + 1}</span>
                {q._bankId && <span className="cep-qbadge" style={{ background: 'color-mix(in srgb, #22c55e 18%, var(--vt-tint2))', color: '#15803d' }}>Từ ngân hàng</span>}
                {q.correct < 0 && <span className="cep-qbadge warn">Chưa chọn đáp án đúng</span>}
                {q.warns.filter((w) => !/chưa xác định được đáp án/i.test(w)).map((w, wi) => (
                  <span key={wi} className="cep-qbadge warn" title={w}><IcoWarn size={11} /> {w.length > 48 ? w.slice(0, 46) + '...' : w}</span>
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
                  Đáp án, chọn nút tròn ở đáp án đúng
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
                <span>Lời giải (tùy chọn, hiện cho học sinh sau khi nộp nếu bật "Hiện đáp án")</span>
                <textarea
                  placeholder="Giải thích vì sao đáp án đó đúng..."
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

      <div className="cep-actions">
        <div className="cep-actions-left">
          <button type="button" className="vt-btn" onClick={handleCancel} disabled={saving}>
            Hủy
          </button>
        </div>
        <button type="button" className="vt-btn primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Đang lưu...' : (<><IcoCheck size={14} /> Lưu đề</>)}
        </button>
      </div>

      {showPicker && (
        <ExamPickerFromBank
          teacherId={user?.uid}
          defaultSubject={classInfo?.subject || ''}
          defaultGrade={0}
          onPick={handlePickFromBank}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}