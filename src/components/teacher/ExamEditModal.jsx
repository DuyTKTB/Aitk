/* ============================================================
   ExamEditModal.jsx — GV chỉnh sửa đề ĐÃ TẠO
   ------------------------------------------------------------
   Sửa được:
     • Thông tin: tiêu đề, mô tả, thời gian, lớp, hạn mở/đóng,
       hiện đáp án sau thi, cho thi lại, xáo trộn câu hỏi
     • Câu hỏi: nội dung, các phương án, đáp án đúng, điểm — thêm/xoá câu
     • Giám sát: BẮT BUỘC CAMERA hay không, phát hiện rời mặt/nhiều mặt/
       nhìn xa/nâng tay/điện thoại, khoá toàn màn hình, giới hạn chuyển tab,
       chặn copy, chặn DevTools, chụp ảnh khi vi phạm...
   Lưu vào Firestore exam doc (proctor: defaultProctor() shape).
   ============================================================ */
import { useMemo, useRef, useState } from 'react';
import { updateTeacherExam } from '../../lib/classroom.js';

/* ============================================================
   THANH KÝ HIỆU — chèn dấu/đoạn công thức vào vị trí con trỏ
   • Nhóm "LaTeX" tự bọc $...$ (nội dung đề render bằng MathText)
   • Nhóm Unicode dùng được mọi nơi (cả câu hỏi Hóa: → ⇌ ↑ ↓ ²⁺ ₂)
   • Chèn vào Ô ĐƯỢC FOCUS CUỐI (nội dung câu hoặc bất kỳ phương án nào)
   ============================================================ */
const SYM_GROUPS = [
  {
    name: 'Công thức (LaTeX $…$)',
    items: [
      { l: 'a/b', t: '$\\frac{a}{b}$', a: 7, b: 8, title: 'Phân số — gõ tử số đè lên "a"' },
      { l: '√x', t: '$\\sqrt{x}$', a: 7, b: 8, title: 'Căn bậc hai' },
      { l: 'x²', t: '$x^{2}$', a: 4, b: 5, title: 'Bình phương' },
      { l: 'xⁿ', t: '$x^{}$', a: 4, b: 4, title: 'Lũy thừa — gõ số mũ vào chỗ trống' },
      { l: 'x₁', t: '$x_{}$', a: 4, b: 4, title: 'Chỉ số dưới' },
      { l: '(a;b)', t: '$\\left(a; b\\right)$', a: 8, b: 8, title: 'Khoảng' },
      { l: 'sin', t: '$\\sin x$', a: 6, b: 6, title: 'Sin' },
      { l: 'cos', t: '$\\cos x$', a: 6, b: 6, title: 'Cos' },
      { l: 'lim', t: '$\\lim\_{x\\to 0}$', a: 6, b: 6, title: 'Giới hạn' },
    ],
  },
  {
    name: 'Hy Lạp',
    items: [
      { l: 'α', t: 'α' }, { l: 'β', t: 'β' }, { l: 'γ', t: 'γ' }, { l: 'δ', t: 'δ' },
      { l: 'θ', t: 'θ' }, { l: 'λ', t: 'λ' }, { l: 'μ', t: 'μ' }, { l: 'π', t: 'π' },
      { l: 'σ', t: 'σ' }, { l: 'φ', t: 'φ' }, { l: 'ω', t: 'ω' }, { l: 'Δ', t: 'Δ' },
      { l: 'Σ', t: 'Σ' }, { l: 'Ω', t: 'Ω' },
    ],
  },
  {
    name: 'So sánh & tập hợp',
    items: [
      { l: '≠', t: '≠' }, { l: '≈', t: '≈' }, { l: '≤', t: '≤' }, { l: '≥', t: '≥' },
      { l: '±', t: '±' }, { l: '×', t: '×' }, { l: '÷', t: '÷' }, { l: '°', t: '°' },
      { l: '∈', t: '∈' }, { l: '∉', t: '∉' }, { l: '⊂', t: '⊂' }, { l: '∪', t: '∪' },
      { l: '∩', t: '∩' }, { l: '∅', t: '∅' }, { l: 'ℝ', t: 'ℝ' }, { l: 'ℕ', t: 'ℕ' },
      { l: 'ℤ', t: 'ℤ' }, { l: '∞', t: '∞' }, { l: '⇒', t: '⇒' }, { l: '⇔', t: '⇔' },
    ],
  },
  {
    name: 'Hóa học',
    items: [
      { l: '→', t: '→' }, { l: '⇌', t: '⇌' }, { l: '↑', t: '↑' }, { l: '↓', t: '↓' },
      { l: '₂', t: '₂' }, { l: '₃', t: '₃' }, { l: '₄', t: '₄' },
      { l: '⁺', t: '⁺' }, { l: '⁻', t: '⁻' }, { l: '²⁺', t: '²⁺' }, { l: '³⁺', t: '³⁺' },
      { l: '²⁻', t: '²⁻' }, { l: '³⁻', t: '³⁻' }, { l: '⊥', t: '⊥' },
    ],
  },
  {
    name: 'Mũ & chỉ số',
    items: [
      { l: '²', t: '²' }, { l: '³', t: '³' }, { l: '⁴', t: '⁴' }, { l: 'ⁿ', t: 'ⁿ' },
      { l: '₀', t: '₀' }, { l: '₁', t: '₁' }, { l: '½', t: '½' }, { l: '¼', t: '¼' },
      { l: '⅓', t: '⅓' }, { l: '‰', t: '‰' },
    ],
  },
];

function SymbolBar({ onInsert }) {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Mở bảng ký hiệu & công thức"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '.35rem', cursor: 'pointer',
          padding: '.3rem .6rem', borderRadius: 'var(--t-r-sm)', border: '1px dashed var(--t-border)',
          background: 'transparent', color: 'var(--t-ink-muted)', font: '600 .72rem var(--t-font-sans)',
          margin: '0 0 .4rem',
        }}
      >
        ∑ Ký hiệu & công thức
      </button>
    );
  }
  return (
    <div style={{
      border: '1px solid var(--t-border)', borderRadius: 'var(--t-r-md)',
      background: 'var(--t-surface-3)', padding: '.45rem .55rem', margin: '0 0 .45rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
        <small style={{ font: '700 .66rem var(--t-font-sans)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t-ink-muted)' }}>
          Chèn vào vị trí con trỏ
        </small>
        <button
          type="button"
          onClick={() => setOpen(false)}
          title="Thu gọn"
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-ink-muted)', font: '600 .72rem var(--t-font-sans)' }}
        >
          thu gọn ▴
        </button>
      </div>
      <div style={{ maxHeight: 150, overflowY: 'auto', display: 'grid', gap: '.4rem' }}>
        {SYM_GROUPS.map((g) => (
          <div key={g.name}>
            <div style={{ font: '700 .64rem var(--t-font-sans)', color: 'var(--t-ink-faint)', margin: '0 0 .2rem' }}>{g.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.22rem' }}>
              {g.items.map((it) => (
                <button
                  key={it.l}
                  type="button"
                  title={it.title || `Chèn ${it.l}`}
                  onClick={() => onInsert(it)}
                  style={{
                    minWidth: 34, padding: '.22rem .4rem', borderRadius: 8,
                    border: '1px solid var(--t-border)', background: 'var(--t-surface-2)',
                    color: 'var(--t-ink)', font: '600 .78rem var(--t-font-sans)',
                    cursor: 'pointer', transition: 'background .12s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--t-accent-subtle)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--t-surface-2)'; }}
                >
                  {it.l}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const P = { /* style dùng chung */
  card: { background: 'var(--t-surface-2)', border: '1px solid var(--t-border)', borderRadius: 'var(--t-r-lg)', padding: '1rem 1.1rem' },
  label: { display: 'block', font: '700 .68rem var(--t-font-sans)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t-ink-muted)', margin: '0 0 .35rem' },
  input: { width: '100%', padding: '.6rem .75rem', borderRadius: 'var(--t-r-md)', border: '1px solid var(--t-border)', background: 'var(--t-surface-3)', color: 'var(--t-ink)', font: '600 .9rem var(--t-font-sans)' },
  btn: { padding: '.55rem 1.1rem', borderRadius: 'var(--t-r-pill)', border: 'none', cursor: 'pointer', font: '700 .82rem var(--t-font-sans)', display: 'inline-flex', alignItems: 'center', gap: '.4rem' },
};

const Row = ({ children }) => (
  <div style={{ display: 'grid', gap: '.7rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>{children}</div>
);

const Switch = ({ label, checked, onChange, hint }) => (
  <label style={{ display: 'flex', gap: '.55rem', alignItems: 'flex-start', cursor: 'pointer', padding: '.45rem .6rem', borderRadius: 'var(--t-r-md)', background: 'var(--t-surface-3)' }}>
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--t-accent)' }} />
    <span>
      <b style={{ font: '600 .82rem var(--t-font-sans)', color: 'var(--t-ink)', display: 'block' }}>{label}</b>
      {hint && <small style={{ font: '500 .72rem var(--t-font-sans)', color: 'var(--t-ink-muted)' }}>{hint}</small>}
    </span>
  </label>
);

export default function ExamEditModal({ exam, classes = [], onClose, onSaved }) {
  const [title, setTitle] = useState(exam.title || '');
  const [description, setDescription] = useState(exam.description || '');
  const [duration, setDuration] = useState(exam.duration || 15);
  const [classId, setClassId] = useState(exam.classId || '');
  const [showAnswerAfter, setShowAnswerAfter] = useState(exam.showAnswerAfter ?? true);
  const [allowRetry, setAllowRetry] = useState(exam.allowRetry ?? false);
  const [shuffle, setShuffle] = useState(exam.shuffle ?? false);
  const [opensAt, setOpensAt] = useState(exam.opensAt?.seconds ? toLocalInput(exam.opensAt) : '');
  const [closesAt, setClosesAt] = useState(exam.closesAt?.seconds ? toLocalInput(exam.closesAt) : '');

  const [proctor, setProctor] = useState(() => ({
    fullscreenLock: true, tabSwitchLimit: 3, blockCopyPaste: true, strictMode: true,
    camera: 'off',
    snapshotOnEvent: true, maxSnapshots: 10, retentionDays: 30,
    blockDevTools: true, blockPrintScreen: true, blockLongBlur: true, allowPauseByTeacher: true,
    ...(exam.proctor || {}),
    cameraChecks: { noFace: true, multiFace: true, lookAway: true, handRaise: true, phoneLike: true, ...(exam.proctor?.cameraChecks || {}) },
  }));

  const [questions, setQuestions] = useState(() => (exam.questions || []).map((q) => ({ ...q })));
  const [openQ, setOpenQ] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  /* ===== THANH KÝ HIỆU: nhớ Ô ĐƯỢC FOCUS CUỐI (nội dung câu hoặc 1 phương án) ===== */
  const fieldRef = useRef(null);
  const targetRef = useRef({ type: 'q', i: 0 });
  const insertSym = (it) => {
    const el = fieldRef.current;
    if (!el) return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? s;
    const next = el.value.slice(0, s) + it.t + el.value.slice(e);
    const a = s + (it.a ?? it.t.length);
    const b = s + (it.b ?? it.a ?? it.t.length);
    const tgt = targetRef.current;
    if (tgt.type === 'opt') {
      setQuestions((qs) => qs.map((qq, k) => (
        k === tgt.i ? { ...qq, options: (qq.options || []).map((o, k2) => (k2 === tgt.oi ? next : o)) } : qq
      )));
    } else {
      patchQ(tgt.i, { q: next });
    }
    requestAnimationFrame(() => {
      try { el.focus(); el.setSelectionRange(a, b); } catch { /* */ }
    });
  };

  const totalPoints = useMemo(() => questions.reduce((s, q) => s + (Number(q.points) || 1), 0), [questions]);
  const setP = (patch) => setProctor((p) => ({ ...p, ...patch }));
  const setPC = (patch) => setProctor((p) => ({ ...p, cameraChecks: { ...p.cameraChecks, ...patch } }));

  const patchQ = (i, patch) => setQuestions((qs) => qs.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const addQ = () => setQuestions((qs) => [...qs, { q: '', options: ['', '', '', ''], correct: 0, points: 1 }]);
  const delQ = (i) => setQuestions((qs) => qs.filter((_, k) => k !== i));

  const validate = () => {
    if (!title.trim()) return 'Tiêu đề không được để trống.';
    if (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 300) return 'Thời gian làm bài từ 1 đến 300 phút.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!String(q.q || '').trim()) return `Câu ${i + 1}: thiếu nội dung câu hỏi.`;
      const opts = (q.options || []).filter((o) => String(o).trim());
      if (opts.length < 2) return `Câu ${i + 1}: cần ít nhất 2 phương án.`;
      if (q.correct == null || q.correct < 0 || q.correct >= (q.options || []).length) return `Câu ${i + 1}: chưa chọn đáp án đúng.`;
    }
    return '';
  };

  const save = async () => {
    const v = validate();
    if (v) { setErr(v); return; }
    setSaving(true);
    setErr('');
    try {
      const cleaned = questions.map((q) => ({
        q: String(q.q || '').trim(),
        options: (q.options || []).map((o) => String(o).trim()).filter(Boolean),
        correct: Math.max(0, Math.min(Number(q.correct) || 0, (q.options || []).length - 1)),
        points: Number(q.points) || 1,
      }));
      await updateTeacherExam(exam.id, {
        title: title.trim(),
        description: description.trim(),
        duration: Number(duration),
        classId: classId || '',
        showAnswerAfter,
        allowRetry,
        shuffle,
        opensAt: opensAt ? new Date(opensAt) : null,
        closesAt: closesAt ? new Date(closesAt) : null,
        proctor,
        questions: cleaned,
        totalPoints: cleaned.reduce((s, q) => s + q.points, 0),
      });
      onSaved?.({
        ...exam,
        title: title.trim(), description: description.trim(), duration: Number(duration),
        classId: classId || '', showAnswerAfter, allowRetry, shuffle, proctor,
        questions: cleaned, totalPoints,
      });
      onClose?.();
    } catch (e) {
      setErr(e.message || 'Không lưu được đề.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(4, 6, 16, .62)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: '1rem' }}
    >
      <div style={{
        width: 'min(880px, 100%)', maxHeight: '92dvh', overflowY: 'auto',
        background: 'var(--t-bg)', border: '1px solid var(--t-border)',
        borderRadius: 'var(--t-r-card)', boxShadow: 'var(--t-shadow-float)', padding: '1.2rem 1.3rem',
        fontFamily: 'var(--t-font-sans)',
      }}>
        {/* HEAD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.8rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, font: '800 1.15rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Chỉnh sửa đề</h2>
            <small style={{ color: 'var(--t-ink-muted)', font: '500 .78rem var(--t-font-sans)' }}>
              {exam.token ? `Mã đề: ${exam.token}` : ''} · {questions.length} câu · {totalPoints} điểm
            </small>
          </div>
          <button type="button" onClick={onClose} style={{ ...P.btn, background: 'var(--t-surface-3)', color: 'var(--t-ink-muted)' }}>✕</button>
        </div>

        {err && (
          <div style={{ ...P.card, borderColor: 'var(--t-status-err)', color: 'var(--t-status-err)', font: '600 .84rem var(--t-font-sans)', padding: '.7rem .9rem', marginBottom: '.9rem' }}>
            {err}
          </div>
        )}

        {/* ===== THÔNG TIN ===== */}
        <section style={{ ...P.card, marginBottom: '.9rem' }}>
          <h3 style={{ margin: '0 0 .7rem', font: '800 .85rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Thông tin đề</h3>
          <label style={P.label}>Tiêu đề</label>
          <input style={{ ...P.input, marginBottom: '.7rem' }} value={title} onChange={(e) => setTitle(e.target.value)} />
          <label style={P.label}>Mô tả</label>
          <textarea style={{ ...P.input, marginBottom: '.7rem', minHeight: 60, resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Row>
            <div>
              <label style={P.label}>Thời gian (phút)</label>
              <input type="number" min="1" max="300" style={P.input} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <label style={P.label}>Lớp áp dụng</label>
              <select style={P.input} value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">— Không gắn lớp —</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={P.label}>Mở đề từ</label>
              <input type="datetime-local" style={P.input} value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
            </div>
            <div>
              <label style={P.label}>Đóng đề lúc</label>
              <input type="datetime-local" style={P.input} value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
            </div>
          </Row>
          <div style={{ display: 'grid', gap: '.45rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: '.7rem' }}>
            <Switch label="Hiện đáp án sau khi nộp" checked={showAnswerAfter} onChange={setShowAnswerAfter} />
            <Switch label="Cho phép xin thi lại" checked={allowRetry} onChange={setAllowRetry} />
            <Switch label="Xáo trộn câu hỏi" checked={shuffle} onChange={setShuffle} hint="Mỗi học sinh thấy thứ tự khác nhau" />
          </div>
        </section>

        {/* ===== GIÁM SÁT ===== */}
        <section style={{ ...P.card, marginBottom: '.9rem' }}>
          <h3 style={{ margin: '0 0 .7rem', font: '800 .85rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Giám sát &amp; chống gian lận</h3>

          <label style={P.label}>Camera học sinh</label>
          <select style={{ ...P.input, marginBottom: '.8rem' }} value={proctor.camera} onChange={(e) => setP({ camera: e.target.value })}>
            <option value="off">Tắt — không dùng camera</option>
            <option value="optional">Cho phép bật (không bắt buộc)</option>
            <option value="required">⚠️ BẮT BUỘC bật camera mới được vào thi</option>
          </select>

          {proctor.camera !== 'off' && (
            <div style={{ display: 'grid', gap: '.45rem', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginBottom: '.8rem' }}>
              <Switch label="Phát hiện không có mặt" checked={proctor.cameraChecks.noFace} onChange={(v) => setPC({ noFace: v })} hint="Rời khỏi khung hình quá lâu" />
              <Switch label="Phát hiện nhiều người" checked={proctor.cameraChecks.multiFace} onChange={(v) => setPC({ multiFace: v })} />
              <Switch label="Phát hiện nhìn ra ngoài" checked={proctor.cameraChecks.lookAway} onChange={(v) => setPC({ lookAway: v })} />
              <Switch label="Phát hiện giơ tay" checked={proctor.cameraChecks.handRaise} onChange={(v) => setPC({ handRaise: v })} />
              <Switch label="Phát hiện điện thoại" checked={proctor.cameraChecks.phoneLike} onChange={(v) => setPC({ phoneLike: v })} />
            </div>
          )}

          <div style={{ display: 'grid', gap: '.45rem', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            <Switch label="Khoá toàn màn hình" checked={proctor.fullscreenLock} onChange={(v) => setP({ fullscreenLock: v })} />
            <Switch label="Chặn sao chép / dán" checked={proctor.blockCopyPaste} onChange={(v) => setP({ blockCopyPaste: v })} />
            <Switch label="Chặn DevTools (F12)" checked={proctor.blockDevTools} onChange={(v) => setP({ blockDevTools: v })} />
            <Switch label="Chặn PrintScreen" checked={proctor.blockPrintScreen} onChange={(v) => setP({ blockPrintScreen: v })} />
            <Switch label="Chặn màn hình mờ (che bài)" checked={proctor.blockLongBlur} onChange={(v) => setP({ blockLongBlur: v })} />
            <Switch label="Chụp ảnh khi có vi phạm" checked={proctor.snapshotOnEvent} onChange={(v) => setP({ snapshotOnEvent: v })} />
            <Switch label="Cho phép tạm dừng bởi GV" checked={proctor.allowPauseByTeacher} onChange={(v) => setP({ allowPauseByTeacher: v })} />
            <Switch label="Chế độ nghiêm ngặt" checked={proctor.strictMode} onChange={(v) => setP({ strictMode: v })} hint="Vi phạm nặng sẽ bị đá khỏi phòng" />
          </div>

          <Row>
            <div>
              <label style={P.label}>Giới hạn chuyển tab (lần)</label>
              <input type="number" min="1" max="20" style={P.input} value={proctor.tabSwitchLimit} onChange={(e) => setP({ tabSwitchLimit: Number(e.target.value) || 3 })} />
            </div>
            <div>
              <label style={P.label}>Số ảnh chụp tối đa</label>
              <input type="number" min="3" max="50" style={P.input} value={proctor.maxSnapshots} onChange={(e) => setP({ maxSnapshots: Number(e.target.value) || 10 })} />
            </div>
            <div>
              <label style={P.label}>Giữ ảnh (ngày)</label>
              <input type="number" min="1" max="90" style={P.input} value={proctor.retentionDays} onChange={(e) => setP({ retentionDays: Number(e.target.value) || 30 })} />
            </div>
          </Row>
        </section>

        {/* ===== CÂU HỎI ===== */}
        <section style={{ ...P.card, marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.7rem' }}>
            <h3 style={{ margin: 0, font: '800 .85rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Câu hỏi ({questions.length})</h3>
            <button type="button" onClick={addQ} style={{ ...P.btn, background: 'var(--t-accent)', color: 'var(--t-accent-ink)' }}>+ Thêm câu</button>
          </div>

          <div style={{ display: 'grid', gap: '.55rem' }}>
            {questions.map((q, i) => (
              <div key={i} style={{ border: '1px solid var(--t-border)', borderRadius: 'var(--t-r-md)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setOpenQ(openQ === i ? -1 : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem .75rem', background: 'var(--t-surface-3)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <b style={{ font: '800 .78rem var(--t-font-sans)', color: 'var(--t-accent)', minWidth: 34 }}>{i + 1}.</b>
                  <span style={{ flex: 1, font: '600 .84rem var(--t-font-sans)', color: 'var(--t-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(q.q || '(câu trống)').slice(0, 80)}
                  </span>
                  <small style={{ color: 'var(--t-ink-muted)', font: '600 .72rem var(--t-font-sans)' }}>{q.points || 1} đ</small>
                </button>

                {openQ === i && (
                  <div style={{ padding: '.75rem' }}>
                    <label style={P.label}>Nội dung câu hỏi</label>
                    <SymbolBar onInsert={insertSym} />
                    <textarea
                      style={{ ...P.input, minHeight: 56, marginBottom: '.6rem', resize: 'vertical' }}
                      value={q.q || ''}
                      onChange={(e) => patchQ(i, { q: e.target.value })}
                      onFocus={(e) => { fieldRef.current = e.target; targetRef.current = { type: 'q', i }; }}
                    />
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', gap: '.45rem', alignItems: 'center', marginBottom: '.4rem' }}>
                        <input
                          type="radio"
                          name={`correct-${i}`}
                          checked={Number(q.correct) === oi}
                          onChange={() => patchQ(i, { correct: oi })}
                          title="Chọn làm đáp án đúng"
                          style={{ width: 15, height: 15, accentColor: 'var(--t-status-ok)', flexShrink: 0 }}
                        />
                        <input
                          style={P.input}
                          value={opt}
                          placeholder={`Phương án ${String.fromCharCode(65 + oi)}`}
                          onChange={(e) => {
                            const next = [...(q.options || [])];
                            next[oi] = e.target.value;
                            patchQ(i, { options: next });
                          }}
                          onFocus={(e) => { fieldRef.current = e.target; targetRef.current = { type: 'opt', i, oi }; }}
                        />
                        {(q.options || []).length > 2 && (
                          <button
                            type="button"
                            title="Xoá phương án"
                            onClick={() => {
                              const next = (q.options || []).filter((_, k) => k !== oi);
                              patchQ(i, { options: next, correct: q.correct >= next.length ? next.length - 1 : (q.correct > oi ? q.correct - 1 : q.correct) });
                            }}
                            style={{ ...P.btn, padding: '.4rem .55rem', background: 'var(--t-surface-3)', color: 'var(--t-status-err)' }}
                          >✕</button>
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '.5rem' }}>
                      {(q.options || []).length < 6 && (
                        <button type="button" onClick={() => patchQ(i, { options: [...(q.options || []), ''] })} style={{ ...P.btn, background: 'var(--t-surface-3)', color: 'var(--t-ink)' }}>
                          + Phương án
                        </button>
                      )}
                      <label style={{ ...P.label, margin: 0, display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                        Điểm
                        <input type="number" min="1" max="100" style={{ ...P.input, width: 76 }} value={q.points ?? 1} onChange={(e) => patchQ(i, { points: Number(e.target.value) || 1 })} />
                      </label>
                      <button
                        type="button"
                        onClick={() => delQ(i)}
                        style={{ ...P.btn, marginLeft: 'auto', background: 'color-mix(in srgb, var(--t-status-err) 14%, transparent)', color: 'var(--t-status-err)' }}
                      >
                        Xoá câu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===== ACTIONS ===== */}
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: 'var(--t-bg)', padding: '.7rem 0 .2rem', borderTop: '1px solid var(--t-border)' }}>
          <button type="button" onClick={onClose} style={{ ...P.btn, background: 'var(--t-surface-3)', color: 'var(--t-ink-muted)' }}>Huỷ</button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{ ...P.btn, background: 'var(--t-accent)', color: 'var(--t-accent-ink)', boxShadow: 'var(--t-shadow-lime)', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Đang lưu…' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* datetime-local ↔ Firestore Timestamp */
function toLocalInput(ts) {
  try {
    const d = typeof ts?.toMillis === 'function' ? new Date(ts.toMillis()) : new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}
