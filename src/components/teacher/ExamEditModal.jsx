/* ============================================================
   ExamEditModal.jsx — GV chỉnh sửa đề ĐÃ TẠO (v2 - Theo HD)
   ============================================================ */
import { useMemo, useRef, useState } from 'react';
import { updateTeacherExam } from '../../lib/classroom.js';

/* ---- 3 dạng câu chuẩn THPT 2025 ---- */
const normType = (q) => {
  const t = q?.type;
  if (t === 'true_false' || t === 'short_answer') return t;
  return 'single_choice'; // 'mcq' | 'multiple_choice' | undefined → trắc nghiệm
};
const round2 = (n) => Math.round(n * 100) / 100;
const ptsOf = (q) => {
  const v = Number(q?.points);
  return Number.isFinite(v) && v > 0 ? v : 1;
};
const blankQ = (type) => {
  if (type === 'true_false') {
    return { type, q: '', statements: [0, 1, 2, 3].map(() => ({ text: '', answer: true })), options: [], correct: -1, points: 1 };
  }
  if (type === 'short_answer') {
    return { type, q: '', answer: '', accepted: [], options: [], correct: -1, points: 0.25 };
  }
  return { type: 'single_choice', q: '', options: ['', '', '', ''], correct: 0, points: 0.25 };
};
const TYPE_LABEL = { single_choice: 'Trắc nghiệm', true_false: 'Đúng/Sai', short_answer: 'Trả lời ngắn' };

/* ---- Ảnh minh hoạ: nén về JPEG ≤1000px để vừa giới hạn 1MB/tài liệu của Firestore ---- */
const fileToDataUrl = (file, maxW = 1000, quality = 0.75) => new Promise((resolve, reject) => {
  if (!file || !/^image\//.test(file.type)) { reject(new Error('File không phải là ảnh.')); return; }
  if (file.size > 10 * 1024 * 1024) { reject(new Error('Ảnh quá lớn (tối đa 10MB).')); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const r = Math.min(1, maxW / img.width);
    const w = Math.max(1, Math.round(img.width * r));
    const h = Math.max(1, Math.round(img.height * r));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    resolve(c.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh này.')); };
  img.src = url;
});
const IMG_BUDGET = 850 * 1024; // ~ngưỡng an toàn cho cả tài liệu đề (Firestore tối đa 1MB)
const kb = (n) => `${Math.round(n / 1024)} KB`;

/* Làm tròn 2 số lẻ và bù chênh lệch vào câu cuối để tổng đúng bằng target */
const fitTotal = (pts, target) => {
  const r = pts.map((p) => round2(p));
  if (!r.length) return r;
  const diff = round2(target - r.reduce((a, b) => a + b, 0));
  if (diff) r[r.length - 1] = round2(Math.max(0.01, r[r.length - 1] + diff));
  return r;
};

const SYM_GROUPS = [
  // ... (Giữ nguyên toàn bộ mảng SYM_GROUPS trong file gốc của bạn)
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
      { l: 'lim', t: '$\\lim_{x\\to 0}$', a: 6, b: 6, title: 'Giới hạn' },
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

const P = {
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

/* onUploadImage (tuỳ chọn): async (file) => url — nếu có (VD: Firebase Storage) sẽ dùng thay cho lưu ảnh nhúng. */
export default function ExamEditModal({ exam, classes = [], onClose, onSaved, onUploadImage }) {
  const [title, setTitle] = useState(exam.title || '');
  const [description, setDescription] = useState(exam.description || '');
  const [duration, setDuration] = useState(exam.duration || 15);
  const [classId, setClassId] = useState(exam.classId || '');
  const [showAnswerAfter, setShowAnswerAfter] = useState(exam.showAnswerAfter ?? true);
  const [allowRetry, setAllowRetry] = useState(exam.allowRetry ?? false);
  const [shuffle, setShuffle] = useState(exam.shuffle ?? false);
  // [2.1] Thêm state displayMode
  const [displayMode, setDisplayMode] = useState(exam.displayMode || 'auto');

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

  const [questions, setQuestions] = useState(() => (exam.questions || []).map((q) => ({ ...q, type: normType(q) })));
  const [openQ, setOpenQ] = useState(0);
  const [imgBusy, setImgBusy] = useState(-1);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [typePts, setTypePts] = useState({ single_choice: '0.25', true_false: '1', short_answer: '0.25' });
  const [targetTotal, setTargetTotal] = useState('10');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

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

  const totalPoints = useMemo(() => round2(questions.reduce((s, q) => s + ptsOf(q), 0)), [questions]);
  const setP = (patch) => setProctor((p) => ({ ...p, ...patch }));
  const setPC = (patch) => setProctor((p) => ({ ...p, cameraChecks: { ...p.cameraChecks, ...patch } }));

  const patchQ = (i, patch) => setQuestions((qs) => qs.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const addQ = (type = 'single_choice') => {
    setQuestions((qs) => [...qs, blankQ(type)]);
    setOpenQ(questions.length);
  };
  const delQ = (i) => setQuestions((qs) => qs.filter((_, k) => k !== i));

  /* ----- Ảnh minh hoạ ----- */
  const attachImage = async (i, file) => {
    setErr('');
    setImgBusy(i);
    try {
      const src = onUploadImage ? await onUploadImage(file) : await fileToDataUrl(file);
      patchQ(i, { image: src });
    } catch (e) {
      setErr(`Câu ${i + 1}: ${e.message || 'không thêm được ảnh.'}`);
    } finally {
      setImgBusy(-1);
    }
  };
  const imgBytes = useMemo(
    () => questions.reduce((s2, q) => s2 + (typeof q.image === 'string' && q.image.startsWith('data:') ? q.image.length : 0), 0),
    [questions],
  );

  /* ----- Chấm điểm nhanh ----- */
  const counts = useMemo(() => {
    const c = { single_choice: 0, true_false: 0, short_answer: 0 };
    questions.forEach((q) => { c[normType(q)] += 1; });
    return c;
  }, [questions]);
  const subtotal = (t) => round2(questions.reduce((s2, q) => s2 + (normType(q) === t ? ptsOf(q) : 0), 0));
  const applyTypePts = (map = typePts) => {
    setQuestions((qs) => qs.map((q) => {
      const v = Number(String(map[normType(q)]).replace(',', '.'));
      return Number.isFinite(v) && v > 0 ? { ...q, points: v } : q;
    }));
  };
  const presetTHPT = () => {
    const m = { single_choice: '0.25', true_false: '1', short_answer: '0.25' };
    setTypePts(m);
    applyTypePts(m);
  };
  const tNum = Number(String(targetTotal).replace(',', '.'));
  const tOk = Number.isFinite(tNum) && tNum > 0;
  const evenTotal = () => {
    if (!tOk || !questions.length) return;
    const pts = fitTotal(questions.map(() => tNum / questions.length), tNum);
    setQuestions((qs) => qs.map((q, i) => ({ ...q, points: pts[i] })));
  };
  const scaleTotal = () => {
    if (!tOk || !questions.length) return;
    const cur = questions.reduce((s2, q) => s2 + ptsOf(q), 0);
    const pts = fitTotal(questions.map((q) => (ptsOf(q) * tNum) / cur), tNum);
    setQuestions((qs) => qs.map((q, i) => ({ ...q, points: pts[i] })));
  };

  const validate = () => {
    if (!title.trim()) return 'Tiêu đề không được để trống.';
    if (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 300) return 'Thời gian làm bài từ 1 đến 300 phút.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!String(q.q || '').trim()) return `Câu ${i + 1}: thiếu nội dung câu hỏi.`;
      const t = normType(q);
      if (t === 'true_false') {
        const st = q.statements || [];
        if (st.length < 2) return `Câu ${i + 1} (Đúng/Sai): cần ít nhất 2 ý.`;
        if (st.some((x) => !String(x.text || '').trim())) return `Câu ${i + 1} (Đúng/Sai): có ý bị bỏ trống.`;
        continue;
      }
      if (t === 'short_answer') {
        if (!String(q.answer ?? '').trim()) return `Câu ${i + 1} (Trả lời ngắn): chưa nhập đáp án.`;
        continue;
      }
      const opts = (q.options || []).filter((o) => String(o).trim());
      if (opts.length < 2) return `Câu ${i + 1}: cần ít nhất 2 phương án.`;
      if (q.correct == null || q.correct < 0 || q.correct >= (q.options || []).length) return `Câu ${i + 1}: chưa chọn đáp án đúng.`;
    }
    if (imgBytes > IMG_BUDGET) return `Các ảnh nhúng đang nặng ${kb(imgBytes)} (tối đa ~${kb(IMG_BUDGET)} cho cả đề). Hãy xoá bớt ảnh hoặc dùng ảnh nhỏ hơn.`;
    return '';
  };

  const save = async () => {
    const v = validate();
    if (v) { setErr(v); return; }
    setSaving(true);
    setErr('');
    try {
      // [2.4] LỖI QUAN TRỌNG: Fix lỗi xóa bài đọc (passage)
      const cleaned = questions.map((q) => {
        const t = normType(q);
        /* Giữ MỌI trường gốc (explain, topic, level, image…) rồi chỉ ghi đè phần cần chuẩn hoá */
        const base = {
          ...q,
          type: t,
          q: String(q.q || '').trim(),
          points: ptsOf(q),
        };
        if (!base.image) { delete base.image; delete base.imageAlt; }
        if (!base.passage) delete base.passage;
        if (!base.instruction) delete base.instruction;
        if (base.passageId == null) delete base.passageId;
        if (t === 'true_false') {
          return {
            ...base,
            options: [],
            correct: -1,
            statements: (q.statements || []).map((x) => ({ text: String(x.text || '').trim(), answer: x.answer === true })),
          };
        }
        if (t === 'short_answer') {
          const vi = String(q.answer ?? '').trim().replace('.', ',');
          return {
            ...base,
            options: [],
            correct: -1,
            answer: vi,
            accepted: [...new Set([vi, vi.replace(',', '.')])].filter(Boolean),
          };
        }
        const options = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
        return {
          ...base,
          options,
          correct: Math.max(0, Math.min(Number(q.correct) || 0, options.length - 1)),
        };
      });
      const sumPoints = round2(cleaned.reduce((s, q) => s + q.points, 0));

      await updateTeacherExam(exam.id, {
        title: title.trim(),
        description: description.trim(),
        duration: Number(duration),
        classId: classId || '',
        showAnswerAfter,
        allowRetry,
        shuffle,
        displayMode, // [2.3] Lưu displayMode
        opensAt: opensAt ? new Date(opensAt) : null,
        closesAt: closesAt ? new Date(closesAt) : null,
        proctor,
        questions: cleaned,
        totalPoints: sumPoints,
      });
      onSaved?.({
        ...exam,
        title: title.trim(), description: description.trim(), duration: Number(duration),
        classId: classId || '', showAnswerAfter, allowRetry, shuffle, displayMode, proctor,
        questions: cleaned, totalPoints: sumPoints,
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
      style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(4, 6, 16, .62)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 'clamp(.4rem, 1.5vw, 1.2rem)' }}
    >
      <div style={{
        width: 'min(1320px, 100%)', height: 'min(96dvh, 1100px)', maxHeight: '96dvh', overflowY: 'auto',
        background: 'var(--t-bg)', border: '1px solid var(--t-border)',
        borderRadius: 'var(--t-r-card)', boxShadow: 'var(--t-shadow-float)', padding: 'clamp(.9rem, 2vw, 1.6rem)',
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

          {/* [2.2] Ô chọn chế độ */}
          <div style={{ marginTop: '.7rem' }}>
            <label style={P.label}>Giao diện làm bài của học sinh</label>
            <select style={P.input} value={displayMode} onChange={(e) => setDisplayMode(e.target.value)}>
              <option value="auto">Tự động (có bài đọc → đề giấy, ngược lại → từng câu)</option>
              <option value="single">Từng câu A, B, C, D (mỗi lần 1 câu, có Trước / Tiếp)</option>
              <option value="paper">Đề giấy — cuộn liên tục, chọn đáp án liên tục</option>
            </select>
          </div>

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
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
              {['single_choice', 'true_false', 'short_answer'].map((t) => (
                <button key={t} type="button" onClick={() => addQ(t)} style={{ ...P.btn, background: 'var(--t-accent)', color: 'var(--t-accent-ink)' }}>
                  + {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {imgBytes > 0 && (
            <small style={{ display: 'block', margin: '0 0 .5rem', color: imgBytes > IMG_BUDGET ? 'var(--t-status-err)' : 'var(--t-ink-muted)', font: '600 .72rem var(--t-font-sans)' }}>
              🖼 Ảnh nhúng: {kb(imgBytes)} / ~{kb(IMG_BUDGET)} cho phép
            </small>
          )}

          {/* ===== CHẤM ĐIỂM NHANH ===== */}
          <div style={{ ...P.card, background: 'var(--t-surface-3)', marginBottom: '.7rem', padding: '.7rem .9rem' }}>
            <button
              type="button"
              onClick={() => setScoreOpen((v) => !v)}
              style={{ all: 'unset', cursor: 'pointer', display: 'flex', width: '100%', alignItems: 'center', gap: '.6rem', font: '800 .85rem var(--t-font-sans)', color: 'var(--t-ink)' }}
            >
              <span>⚖ Chấm điểm nhanh</span>
              <small style={{ marginLeft: 'auto', font: '700 .78rem var(--t-font-sans)', color: tOk && Math.abs(totalPoints - tNum) < 0.005 ? 'var(--t-status-ok)' : 'var(--t-ink-muted)' }}>
                Tổng hiện tại: {totalPoints} điểm
              </small>
              <span aria-hidden="true">{scoreOpen ? '▲' : '▼'}</span>
            </button>

            {scoreOpen && (
              <div style={{ display: 'grid', gap: '.8rem', marginTop: '.8rem' }}>
                <div>
                  <label style={P.label}>1. Điểm mỗi câu theo dạng</label>
                  <div style={{ display: 'grid', gap: '.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    {['single_choice', 'true_false', 'short_answer'].map((t) => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.45rem .6rem', borderRadius: 'var(--t-r-md)', background: 'var(--t-surface-2)', border: '1px solid var(--t-border)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ display: 'block', font: '700 .8rem var(--t-font-sans)', color: 'var(--t-ink)' }}>{TYPE_LABEL[t]}</b>
                          <small style={{ color: 'var(--t-ink-muted)', font: '500 .7rem var(--t-font-sans)' }}>{counts[t]} câu · {subtotal(t)} đ</small>
                        </div>
                        <input
                          type="number" min="0.05" step="0.05" disabled={!counts[t]}
                          style={{ ...P.input, width: 78 }}
                          value={typePts[t]}
                          onChange={(e) => setTypePts((m) => ({ ...m, [t]: e.target.value }))}
                        />
                        <small style={{ color: 'var(--t-ink-muted)' }}>đ/câu</small>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
                    <button type="button" onClick={() => applyTypePts()} style={{ ...P.btn, background: 'var(--t-accent)', color: 'var(--t-accent-ink)' }}>Áp dụng theo dạng</button>
                    <button type="button" onClick={presetTHPT} style={{ ...P.btn, background: 'var(--t-surface-2)', color: 'var(--t-ink)', border: '1px solid var(--t-border)' }}>
                      Chuẩn THPT 2025 (0,25 · 1 · 0,25)
                    </button>
                  </div>
                </div>

                <div>
                  <label style={P.label}>2. Đưa tổng điểm về một con số</label>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="number" min="0.5" step="0.5" style={{ ...P.input, width: 90 }}
                      value={targetTotal} onChange={(e) => setTargetTotal(e.target.value)}
                    />
                    <small style={{ color: 'var(--t-ink-muted)' }}>điểm</small>
                    <button type="button" disabled={!tOk} onClick={scaleTotal} style={{ ...P.btn, background: 'var(--t-surface-2)', color: 'var(--t-ink)', border: '1px solid var(--t-border)' }}>
                      Co giãn (giữ tỉ lệ giữa các câu)
                    </button>
                    <button type="button" disabled={!tOk} onClick={evenTotal} style={{ ...P.btn, background: 'var(--t-surface-2)', color: 'var(--t-ink)', border: '1px solid var(--t-border)' }}>
                      Chia đều cho mọi câu
                    </button>
                  </div>
                  <small style={{ display: 'block', marginTop: '.4rem', color: 'var(--t-ink-muted)', font: '500 .72rem var(--t-font-sans)' }}>
                    Điểm làm tròn 2 số lẻ; phần chênh lệch được bù vào câu cuối để tổng đúng bằng con số bạn nhập. Từng câu vẫn sửa riêng được trong ô "Điểm" của câu đó.
                  </small>
                </div>
              </div>
            )}
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
                  {q.image && <small title="Câu có hình minh hoạ" style={{ font: '700 .7rem var(--t-font-sans)' }}>🖼</small>}
                  {normType(q) !== 'single_choice' && (
                    <small style={{ color: 'var(--t-accent)', font: '700 .66rem var(--t-font-sans)', background: 'color-mix(in srgb, var(--t-accent) 14%, transparent)', padding: '.15rem .45rem', borderRadius: 999, whiteSpace: 'nowrap' }}>
                      {TYPE_LABEL[normType(q)]}
                    </small>
                  )}
                  {(q.passage || q.instruction) && (
                    <small
                      title="Câu này thuộc 1 bài đọc/đoạn văn chung — giữ nguyên khi sửa để màn làm bài không bị xáo trộn"
                      style={{ color: 'var(--t-accent)', font: '700 .66rem var(--t-font-sans)', background: 'color-mix(in srgb, var(--t-accent) 14%, transparent)', padding: '.15rem .45rem', borderRadius: 999, whiteSpace: 'nowrap' }}
                    >
                      📖 Bài đọc
                    </small>
                  )}
                  <small style={{ color: 'var(--t-ink-muted)', font: '600 .72rem var(--t-font-sans)' }}>{round2(ptsOf(q))} đ</small>
                </button>

                {openQ === i && (
                  <div style={{ padding: '.75rem' }}>
                    {(q.passage || q.instruction) && (
                      <div style={{ border: '1px dashed var(--t-accent)', borderRadius: 'var(--t-r-md)', padding: '.6rem .7rem', marginBottom: '.7rem', background: 'color-mix(in srgb, var(--t-accent) 6%, transparent)' }}>
                        <label style={P.label}>Hướng dẫn chung (instruction)</label>
                        <textarea
                          style={{ ...P.input, minHeight: 36, marginBottom: '.5rem', resize: 'vertical' }}
                          value={q.instruction || ''}
                          onChange={(e) => patchQ(i, { instruction: e.target.value })}
                        />
                        <label style={P.label}>Bài đọc / đoạn văn dùng chung</label>
                        <textarea
                          style={{ ...P.input, minHeight: 80, resize: 'vertical' }}
                          value={q.passage || ''}
                          onChange={(e) => patchQ(i, { passage: e.target.value })}
                        />
                        <small style={{ display: 'block', marginTop: '.35rem', color: 'var(--t-ink-muted)', font: '500 .68rem var(--t-font-sans)' }}>
                          Các câu liền nhau có cùng nội dung bài đọc này sẽ tự gom chung 1 khối ở màn làm bài. Để tách câu này khỏi bài đọc, xoá trống cả 2 ô trên.
                        </small>
                      </div>
                    )}
                    <label style={P.label}>Nội dung câu hỏi</label>
                    <SymbolBar onInsert={insertSym} />
                    <textarea
                      style={{ ...P.input, minHeight: 56, marginBottom: '.6rem', resize: 'vertical' }}
                      value={q.q || ''}
                      onChange={(e) => patchQ(i, { q: e.target.value })}
                      onFocus={(e) => { fieldRef.current = e.target; targetRef.current = { type: 'q', i }; }}
                      onPaste={(e) => {
                        const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
                        if (f) { e.preventDefault(); attachImage(i, f); }
                      }}
                    />

                    {/* ===== Hình minh hoạ ===== */}
                    <div style={{ border: '1px dashed var(--t-border)', borderRadius: 'var(--t-r-md)', padding: '.6rem .7rem', marginBottom: '.7rem', background: 'var(--t-surface-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                        <label style={{ ...P.btn, background: 'var(--t-accent)', color: 'var(--t-accent-ink)', cursor: 'pointer', opacity: imgBusy === i ? 0.6 : 1 }}>
                          🖼 {q.image ? 'Đổi ảnh' : 'Thêm hình minh hoạ'}
                          <input
                            type="file" accept="image/*" hidden disabled={imgBusy === i}
                            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) attachImage(i, f); }}
                          />
                        </label>
                        {q.image && (
                          <button type="button" onClick={() => patchQ(i, { image: '', imageAlt: '' })} style={{ ...P.btn, background: 'color-mix(in srgb, var(--t-status-err) 14%, transparent)', color: 'var(--t-status-err)' }}>
                            Xoá ảnh
                          </button>
                        )}
                        <small style={{ color: 'var(--t-ink-muted)', font: '500 .72rem var(--t-font-sans)' }}>
                          {imgBusy === i ? 'Đang xử lý ảnh…' : 'Chọn file, hoặc bấm vào ô nội dung rồi dán (Ctrl+V) ảnh chụp màn hình.'}
                        </small>
                      </div>
                      {q.image && (
                        <div style={{ marginTop: '.6rem', display: 'grid', gap: '.5rem' }}>
                          <img src={q.image} alt={q.imageAlt || 'Hình minh hoạ'} style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--t-border)', background: '#fff', justifySelf: 'start' }} />
                          <input
                            style={P.input}
                            value={q.imageAlt || ''}
                            placeholder="Mô tả ngắn cho ảnh (không bắt buộc)"
                            onChange={(e) => patchQ(i, { imageAlt: e.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    {normType(q) === 'true_false' && (
                      <div style={{ display: 'grid', gap: '.4rem' }}>
                        {(q.statements || []).map((st, k) => (
                          <div key={k} style={{ display: 'flex', gap: '.45rem', alignItems: 'center' }}>
                            <b style={{ font: '800 .78rem var(--t-font-sans)', minWidth: 22 }}>{String.fromCharCode(97 + k)})</b>
                            <input
                              style={P.input}
                              value={st.text || ''}
                              placeholder={`Nhận định ${String.fromCharCode(97 + k)}`}
                              onChange={(e) => patchQ(i, { statements: q.statements.map((x, j) => (j === k ? { ...x, text: e.target.value } : x)) })}
                            />
                            <select
                              style={{ ...P.input, width: 84, flexShrink: 0 }}
                              value={st.answer === true ? 'Đ' : 'S'}
                              onChange={(e) => patchQ(i, { statements: q.statements.map((x, j) => (j === k ? { ...x, answer: e.target.value === 'Đ' } : x)) })}
                            >
                              <option value="Đ">Đúng</option>
                              <option value="S">Sai</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    {normType(q) === 'short_answer' && (
                      <div>
                        <label style={P.label}>Đáp án (số / chữ ngắn)</label>
                        <input
                          style={P.input}
                          value={q.answer ?? ''}
                          placeholder="VD: 12,5"
                          onChange={(e) => patchQ(i, { answer: e.target.value })}
                        />
                        <small style={{ display: 'block', marginTop: '.3rem', color: 'var(--t-ink-muted)', font: '500 .68rem var(--t-font-sans)' }}>
                          Hệ thống tự chấp nhận cả dấu phẩy và dấu chấm (12,5 = 12.5).
                        </small>
                      </div>
                    )}
                    {normType(q) === 'single_choice' && (
                      <>
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
                      </>
                    )}
                    <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '.5rem' }}>
                      {normType(q) === 'single_choice' && (q.options || []).length < 6 && (
                        <button type="button" onClick={() => patchQ(i, { options: [...(q.options || []), ''] })} style={{ ...P.btn, background: 'var(--t-surface-3)', color: 'var(--t-ink)' }}>
                          + Phương án
                        </button>
                      )}
                      <label style={{ ...P.label, margin: 0, display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                        Điểm
                        <input type="number" min="0.05" max="100" step="0.05" style={{ ...P.input, width: 76 }} value={q.points ?? 1} onChange={(e) => patchQ(i, { points: e.target.value === '' ? '' : Number(e.target.value) })} />
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

function toLocalInput(ts) {
  try {
    const d = typeof ts?.toMillis === 'function' ? new Date(ts.toMillis()) : new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}