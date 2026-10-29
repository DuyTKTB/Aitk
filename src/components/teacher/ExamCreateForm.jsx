/* ============================================================
   ExamCreateForm.jsx — Form tạo đề thủ công chuẩn THPT 2025 (v3)
   ------------------------------------------------------------
   Nâng cấp toàn diện:
     • FIX NGHIÊM TRỌNG: Bọc forwardRef + useImperativeHandle để expose
       replaceContent() cho CreateExamPage khi chuyển đề từ AI Studio sang.
     • Hỗ trợ đầy đủ 3 dạng câu chuẩn Bộ GD&ĐT 2025:
         1. Trắc nghiệm nhiều lựa chọn (single_choice)
         2. Trắc nghiệm Đúng / Sai 4 mệnh đề a, b, c, d (true_false)
         3. Trả lời ngắn / Điền đáp số (short_answer)
     • Tích hợp Thanh công thức LaTeX & Ký hiệu Toán - Lý - Hóa (SymbolBar).
     • Tích hợp Đính kèm ảnh minh họa cho từng câu hỏi (nén JPEG tự động).
     • Tích hợp nút "Lấy câu hỏi từ Ngân hàng" (ExamPickerFromBank).
     • Bộ chia điểm nhanh: Chuẩn THPT 2025 hoặc Chia đều tổng 10 điểm.
   ============================================================ */
import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import ExamPickerFromBank from './ExamPickerFromBank.jsx';

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
const IcoLibrary = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IcoImage = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

/* ============ HELPERS & CONSTANTS ============ */
const MAX_OPTS = 6;
const ANSWERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STMT_KEYS = ['a', 'b', 'c', 'd'];
const round2 = (n) => Math.round(n * 100) / 100;

const normType = (q) => {
  const t = q?.type;
  if (t === 'true_false' || t === 'short_answer') return t;
  return 'single_choice';
};

const emptyQuestion = (type = 'single_choice') => {
  if (type === 'true_false') {
    return {
      type: 'true_false',
      q: '',
      options: [],
      correct: -1,
      statements: [0, 1, 2, 3].map(() => ({ text: '', answer: true })),
      points: 1,
      explain: '',
      warns: [],
      topic: '',
      level: '',
    };
  }
  if (type === 'short_answer') {
    return {
      type: 'short_answer',
      q: '',
      options: [],
      correct: -1,
      answer: '',
      accepted: [],
      points: 0.25,
      explain: '',
      warns: [],
      topic: '',
      level: '',
    };
  }
  return {
    type: 'single_choice',
    q: '',
    options: ['', '', '', ''],
    correct: 0,
    points: 0.25,
    explain: '',
    warns: [],
    topic: '',
    level: '',
  };
};

const toFormQuestion = (q) => {
  const type = normType(q);
  const base = {
    ...(q.id ? { id: q.id } : {}),
    type,
    q: q.q || q.content || '',
    points: Number(q.points) > 0 ? Number(q.points) : (type === 'true_false' ? 1 : 0.25),
    explain: q.explain || q.explanation || '',
    warns: Array.isArray(q.warns) ? q.warns : [],
    topic: q.topic || '',
    level: q.level || '',
    ...(q.image ? { image: q.image } : {}),
    ...(q.passage ? { passage: q.passage } : {}),
    ...(q.instruction ? { instruction: q.instruction } : {}),
    ...(q.passageId != null ? { passageId: q.passageId } : {}),
  };

  if (type === 'true_false') {
    const rawStmts = Array.isArray(q.statements) && q.statements.length >= 2
      ? q.statements
      : [0, 1, 2, 3].map((i) => ({ text: q.options?.[i] || '', answer: i === 0 }));
    return {
      ...base,
      options: [],
      correct: -1,
      statements: rawStmts.map((s) => (
        typeof s === 'string'
          ? { text: s, answer: true }
          : { text: s?.text || s?.content || '', answer: s?.answer !== false }
      )),
    };
  }

  if (type === 'short_answer') {
    const ans = String(q.answer ?? (typeof q.correct === 'string' ? q.correct : '')).trim();
    return {
      ...base,
      options: [],
      correct: -1,
      answer: ans,
      accepted: Array.isArray(q.accepted) ? q.accepted : [],
    };
  }

  const raw = q.options || q.answers || [];
  const options = raw.length >= 2
    ? raw.map((o) => (typeof o === 'string' ? o : o.content || ''))
    : ['', '', '', ''];
  let correct = typeof q.correct === 'number' ? q.correct : -1;
  if (correct < 0 && raw.some((o) => typeof o === 'object')) {
    correct = raw.findIndex((o) => o.is_correct || (q.correctAnswer && o.label === q.correctAnswer));
  }
  return {
    ...base,
    options,
    correct,
  };
};

/* Nén ảnh minh hoạ về JPEG ≤ 1000px để nhẹ bộ nhớ Firestore */
const fileToDataUrl = (file, maxW = 1000, quality = 0.76) => new Promise((resolve, reject) => {
  if (!file || !/^image\//.test(file.type)) { reject(new Error('File không phải là ảnh hợp lệ.')); return; }
  if (file.size > 10 * 1024 * 1024) { reject(new Error('Ảnh quá lớn (tối đa 10MB).')); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const r = Math.min(1, maxW / img.width);
    const w = Math.max(1, Math.round(img.width * r));
    const h = Math.max(1, Math.round(img.height * r));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
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

const SYM_GROUPS = [
  {
    name: 'Công thức (LaTeX $…$)',
    items: [
      { l: 'a/b', t: '$\\frac{a}{b}$', a: 7, b: 8, title: 'Phân số' },
      { l: '√x', t: '$\\sqrt{x}$', a: 7, b: 8, title: 'Căn bậc hai' },
      { l: 'x²', t: '$x^{2}$', a: 4, b: 5, title: 'Bình phương' },
      { l: 'xⁿ', t: '$x^{}$', a: 4, b: 4, title: 'Lũy thừa' },
      { l: 'x₁', t: '$x_{}$', a: 4, b: 4, title: 'Chỉ số dưới' },
      { l: '∫', t: '$\\int_{a}^{b}$', a: 6, b: 7, title: 'Tích phân' },
      { l: 'lim', t: '$\\lim_{x\\to 0}$', a: 6, b: 6, title: 'Giới hạn' },
    ],
  },
  {
    name: 'Hóa học & Vật lý',
    items: [
      { l: '→', t: '→' }, { l: '⇌', t: '⇌' }, { l: '↑', t: '↑' }, { l: '↓', t: '↓' },
      { l: '₂', t: '₂' }, { l: '₃', t: '₃' }, { l: '₄', t: '₄' },
      { l: '⁺', t: '⁺' }, { l: '⁻', t: '⁻' }, { l: '²⁺', t: '²⁺' }, { l: '³⁺', t: '³⁺' },
      { l: 'Δ', t: 'Δ' }, { l: 'λ', t: 'λ' }, { l: 'Ω', t: 'Ω' }, { l: '°C', t: '°C' },
    ],
  },
  {
    name: 'Toán & Tập hợp',
    items: [
      { l: '≠', t: '≠' }, { l: '≈', t: '≈' }, { l: '≤', t: '≤' }, { l: '≥', t: '≥' },
      { l: '±', t: '±' }, { l: '×', t: '×' }, { l: '÷', t: '÷' }, { l: '∞', t: '∞' },
      { l: '∈', t: '∈' }, { l: '⊂', t: '⊂' }, { l: '∪', t: '∪' }, { l: '∩', t: '∩' },
      { l: '⇒', t: '⇒' }, { l: '⇔', t: '⇔' }, { l: 'π', t: 'π' }, { l: 'α', t: 'α' },
    ],
  },
];

const localToIso = (v) => (v ? new Date(v).toISOString() : null);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const ExamCreateForm = forwardRef(function ExamCreateForm({
  initial = null,
  onDirty,
  onSnapshot,
  classInfo,
  onSave,
  onCancel,
  saving = false,
}, ref) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [duration, setDuration] = useState(initial?.duration || 45);
  const [questions, setQuestions] = useState(
    initial?.questions?.length
      ? initial.questions.map(toFormQuestion)
      : [emptyQuestion('single_choice')]
  );
  const [showAnswerAfter, setShowAnswerAfter] = useState(initial?.showAnswerAfter ?? true);
  const [allowRetry, setAllowRetry] = useState(initial?.allowRetry ?? false);
  const [shuffle, setShuffle] = useState(initial?.shuffle ?? true);
  const [opensAt, setOpensAt] = useState(initial?.opensAt || '');
  const [closesAt, setClosesAt] = useState(initial?.closesAt || '');
  const [error, setError] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showSymBar, setShowSymBar] = useState(true);
  const [imgBusyIdx, setImgBusyIdx] = useState(-1);

  /* Con trỏ ô đang nhập để chèn công thức LaTeX / ký hiệu */
  const activeInputRef = useRef(null);
  const activeTargetRef = useRef({ qi: 0, field: 'q', subIdx: -1 });

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

  /* Expose replaceContent() cho CreateExamPage (khi nhận đề từ AI Studio hoặc khôi phục nháp) */
  useImperativeHandle(ref, () => ({
    replaceContent(data = {}) {
      if (data.title !== undefined) setTitle(data.title);
      if (data.description !== undefined) setDescription(data.description);
      if (data.duration !== undefined) setDuration(data.duration);
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions.map(toFormQuestion));
      }
      setError('');
    },
  }), []);

  /* Đồng bộ lại khi initial thay đổi (VD bấm Khôi phục bản nháp) */
  useEffect(() => {
    if (!initial) return;
    if (initial.title !== undefined) setTitle(initial.title || '');
    if (initial.description !== undefined) setDescription(initial.description || '');
    if (initial.duration !== undefined) setDuration(initial.duration || 45);
    if (Array.isArray(initial.questions) && initial.questions.length > 0) {
      setQuestions(initial.questions.map(toFormQuestion));
    }
  }, [initial]);

  /* Báo cho trang cha biết form đang có nội dung */
  useEffect(() => {
    onDirty?.(
      !!title.trim() ||
      questions.some((q) => q.q.trim() || (q.options || []).some((o) => o.trim()) || String(q.answer || '').trim())
    );
  }, [title, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Autosave sau 800ms */
  useEffect(() => {
    if (!onSnapshot) return undefined;
    const t = setTimeout(() => {
      onSnapshot({
        title, description, duration, questions, showAnswerAfter, allowRetry, shuffle, opensAt, closesAt, proctor,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [title, description, duration, questions, showAnswerAfter, allowRetry, shuffle, opensAt, closesAt, proctor]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPoints = useMemo(
    () => round2(questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)),
    [questions]
  );

  const typeCounts = useMemo(() => {
    const c = { single_choice: 0, true_false: 0, short_answer: 0 };
    questions.forEach((q) => { c[normType(q)] += 1; });
    return c;
  }, [questions]);

  /* ============ QUESTION ACTIONS ============ */
  const updateQ = (i, patch) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const changeQuestionType = (qi, nextType) => {
    setQuestions((qs) => qs.map((q, idx) => {
      if (idx !== qi) return q;
      const template = emptyQuestion(nextType);
      return {
        ...template,
        q: q.q,
        explain: q.explain,
        topic: q.topic,
        level: q.level,
        image: q.image,
      };
    }));
  };

  const chooseCorrect = (qi, oi) => {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === qi
          ? { ...q, correct: oi, warns: (q.warns || []).filter((w) => !/đáp án/i.test(w)) }
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

  const updateStatement = (qi, si, patch) => {
    setQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== qi) return q;
        const stmts = [...(q.statements || [])];
        stmts[si] = { ...stmts[si], ...patch };
        return { ...q, statements: stmts };
      })
    );
  };

  const addQuestion = (type = 'single_choice') => {
    setQuestions((qs) => [...qs, emptyQuestion(type)]);
  };

  const removeQuestion = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  /* Đính kèm ảnh vào câu hỏi */
  const handleAttachImage = async (qi, file) => {
    if (!file) return;
    setImgBusyIdx(qi);
    setError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      updateQ(qi, { image: dataUrl });
    } catch (e) {
      setError(`Câu ${qi + 1}: ${e.message || 'Không tải được ảnh'}`);
    } finally {
      setImgBusyIdx(-1);
    }
  };

  /* Chèn ký hiệu / LaTeX vào ô đang đặt con trỏ */
  const handleInsertSymbol = (sym) => {
    const el = activeInputRef.current;
    const { qi, field, subIdx } = activeTargetRef.current;
    if (!el || qi < 0 || qi >= questions.length) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const nextVal = el.value.slice(0, start) + sym.t + el.value.slice(end);
    const selStart = start + (sym.a ?? sym.t.length);
    const selEnd = start + (sym.b ?? sym.a ?? sym.t.length);

    if (field === 'q') updateQ(qi, { q: nextVal });
    else if (field === 'explain') updateQ(qi, { explain: nextVal });
    else if (field === 'answer') updateQ(qi, { answer: nextVal });
    else if (field === 'opt' && subIdx >= 0) updateOption(qi, subIdx, nextVal);
    else if (field === 'stmt' && subIdx >= 0) updateStatement(qi, subIdx, { text: nextVal });

    requestAnimationFrame(() => {
      try {
        el.focus();
        el.setSelectionRange(selStart, selEnd);
      } catch { /* ignore */ }
    });
  };

  /* Chia điểm nhanh chuẩn THPT 2025 hoặc Chia đều tổng 10 điểm */
  const applyThpt2025Points = () => {
    setQuestions((qs) => qs.map((q) => {
      const t = normType(q);
      if (t === 'true_false') return { ...q, points: 1 };
      return { ...q, points: 0.25 };
    }));
  };

  const applyEvenTenPoints = () => {
    if (!questions.length) return;
    const each = round2(10 / questions.length);
    setQuestions((qs) => qs.map((q, idx) => ({
      ...q,
      points: idx === qs.length - 1 ? round2(Math.max(0.05, 10 - each * (qs.length - 1))) : each,
    })));
  };

  const setProctorField = (k, v) => setProctor((p) => ({ ...p, [k]: v }));
  const setCameraCheck = (k, v) => setProctor((p) => ({ ...p, cameraChecks: { ...p.cameraChecks, [k]: v } }));

  /* ============ VALIDATE & SUBMIT ============ */
  const validate = () => {
    if (!title.trim()) return 'Vui lòng nhập tên đề thi.';
    if (!questions.length) return 'Đề thi cần ít nhất 1 câu hỏi.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!String(q.q || '').trim()) return `Câu ${i + 1}: chưa có nội dung câu hỏi.`;
      const t = normType(q);
      if (t === 'true_false') {
        const st = q.statements || [];
        if (st.length < 2) return `Câu ${i + 1} (Đúng/Sai): cần ít nhất 2 mệnh đề.`;
        if (st.some((x) => !String(x.text || '').trim())) return `Câu ${i + 1} (Đúng/Sai): có mệnh đề chưa nhập nội dung.`;
        continue;
      }
      if (t === 'short_answer') {
        if (!String(q.answer ?? '').trim()) return `Câu ${i + 1} (Trả lời ngắn): chưa nhập đáp án đúng.`;
        continue;
      }
      const filled = (q.options || []).filter((o) => String(o).trim()).length;
      if (filled < 2) return `Câu ${i + 1}: cần ít nhất 2 phương án trả lời.`;
      if (q.correct < 0) return `Câu ${i + 1}: chưa chọn đáp án đúng (A/B/C/D).`;
      if (!q.options[q.correct]?.trim()) return `Câu ${i + 1}: đáp án đang chọn làm đáp án đúng chưa có nội dung.`;
    }
    if (opensAt && closesAt && new Date(opensAt) >= new Date(closesAt)) {
      return 'Thời điểm đóng đề phải sau thời điểm mở đề.';
    }
    return '';
  };

  const cleanQuestions = () =>
    questions.map((q) => {
      const t = normType(q);
      const base = {
        ...(q.id ? { id: q.id } : {}),
        type: t,
        q: String(q.q || '').trim(),
        points: Number(q.points) || (t === 'true_false' ? 1 : 0.25),
        ...(q.explain?.trim() ? { explain: q.explain.trim() } : {}),
        ...(q.topic ? { topic: q.topic } : {}),
        ...(q.level ? { level: q.level } : {}),
        ...(q.image ? { image: q.image } : {}),
        ...(q.passage ? { passage: q.passage } : {}),
        ...(q.instruction ? { instruction: q.instruction } : {}),
        ...(q.passageId != null ? { passageId: q.passageId } : {}),
      };

      if (t === 'true_false') {
        return {
          ...base,
          options: [],
          correct: -1,
          statements: (q.statements || []).map((s) => ({
            text: String(s.text || '').trim(),
            answer: s.answer === true,
          })),
        };
      }

      if (t === 'short_answer') {
        const vi = String(q.answer ?? '').trim().replace('.', ',');
        return {
          ...base,
          options: [],
          correct: -1,
          answer: vi,
          accepted: [...new Set([vi, vi.replace(',', '.'), ...(q.accepted || [])])].filter(Boolean),
        };
      }

      const kept = [];
      let newCorrect = -1;
      (q.options || []).forEach((opt, idx) => {
        const val = String(opt || '').trim();
        if (!val) return;
        if (idx === q.correct) newCorrect = kept.length;
        kept.push(val);
      });
      return {
        ...base,
        options: kept,
        correct: newCorrect >= 0 ? newCorrect : 0,
      };
    });

  const handleSubmit = () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    onSave?.({
      title: title.trim(),
      description: description.trim(),
      duration: Number(duration) || 45,
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
                placeholder="VD: Kiểm tra 45 phút Chương Este - Lipit"
                maxLength={100}
              />
            </label>
            <label className="cep-field">
              <span>Thời gian (phút)</span>
              <input
                type="number"
                min="1"
                max="300"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </label>
          </div>

          <label className="cep-field">
            <span>Mô tả / Ghi chú cho học sinh (tùy chọn)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Đề gồm 3 phần chuẩn cấu trúc THPT 2025 — Học sinh không dùng tài liệu"
              maxLength={160}
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
              Hiện đáp án & lời giải sau khi nộp
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
              Xáo trộn câu hỏi khi thi
            </label>
          </div>
        </div>
      </div>

      {/* ===== GIÁM SÁT ===== */}
      <div className="cep-card">
        <header className="cep-card-head">
          <h3 className="cep-card-title">
            <IcoShield size={16} /> Giám sát & Chống gian lận khi thi
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
            <span>Ngưỡng tự động nộp (số lần chuyển tab/rời màn hình)</span>
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
              <IcoCam size={13} /> Camera giám sát AI
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
              <span>Phát hiện hành vi bất thường qua Camera</span>
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
                  Vật thể lạ (điện thoại)
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== CÂU HỎI & THANH CÔNG THỨC ===== */}
      <div className="cep-card">
        <header className="cep-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <h3 className="cep-card-title" style={{ margin: 0 }}>
              Danh sách câu hỏi ({questions.length} câu · Tổng {totalPoints} điểm)
            </h3>
            <small style={{ color: 'var(--mut)', fontSize: '0.76rem' }}>
              Phần I (Trắc nghiệm): {typeCounts.single_choice} · Phần II (Đúng/Sai): {typeCounts.true_false} · Phần III (Trả lời ngắn): {typeCounts.short_answer}
            </small>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="cep-chip"
              onClick={applyThpt2025Points}
              title="Trắc nghiệm & Trả lời ngắn: 0.25đ/câu · Đúng/Sai: 1.0đ/câu"
            >
              Chia điểm chuẩn THPT 2025
            </button>
            <button
              type="button"
              className="cep-chip"
              onClick={applyEvenTenPoints}
              title="Chia đều các câu để tổng điểm đúng bằng 10"
            >
              Chia đều tổng 10đ
            </button>
            <button
              type="button"
              className="cep-chip on"
              onClick={() => setShowBankPicker(true)}
            >
              <IcoLibrary size={13} /> + Lấy câu từ Ngân hàng
            </button>
          </div>
        </header>

        {/* Thanh chèn công thức LaTeX & Ký hiệu */}
        <div style={{ margin: '0.5rem 0 1rem', padding: '0.6rem 0.75rem', borderRadius: 12, background: 'var(--vt-tint, rgba(148,163,184,0.08))', border: '1px solid var(--soft, rgba(148,163,184,0.2))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showSymBar ? '0.45rem' : 0 }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--mut)' }}>
              ∑ Thanh chèn nhanh Công thức LaTeX & Ký hiệu Toán - Lý - Hóa (bấm vào ô nhập rồi chọn ký hiệu)
            </span>
            <button
              type="button"
              onClick={() => setShowSymBar((v) => !v)}
              style={{ border: 'none', background: 'transparent', color: 'var(--acc)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {showSymBar ? 'Thu gọn ▴' : 'Mở bảng ký hiệu ▾'}
            </button>
          </div>

          {showSymBar && (
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {SYM_GROUPS.map((g) => (
                <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <small style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--mut)', minWidth: 115 }}>{g.name}:</small>
                  {g.items.map((it) => (
                    <button
                      key={it.l}
                      type="button"
                      title={it.title || `Chèn ${it.l}`}
                      onMouseDown={(e) => {
                        e.preventDefault(); // giữ focus ở ô đang nhập
                        handleInsertSymbol(it);
                      }}
                      style={{
                        padding: '0.2rem 0.48rem',
                        borderRadius: 7,
                        border: '1px solid var(--soft, rgba(148,163,184,0.28))',
                        background: 'var(--panel, #fff)',
                        color: 'var(--ink)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {it.l}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cep-qlist">
          {questions.map((q, qi) => {
            const qType = normType(q);
            const isInvalid =
              (qType === 'single_choice' && q.correct < 0) ||
              (qType === 'short_answer' && !String(q.answer ?? '').trim()) ||
              (q.warns && q.warns.length > 0);

            return (
              <div key={qi} className={'cep-qitem' + (isInvalid ? ' invalid' : '')}>
                <div className="cep-qhead" style={{ flexWrap: 'wrap', gap: '0.45rem' }}>
                  <span className="cep-qnum">Câu {qi + 1}</span>

                  {/* Chọn loại câu hỏi chuẩn THPT 2025 */}
                  <select
                    aria-label={`Loại câu hỏi ${qi + 1}`}
                    value={qType}
                    onChange={(e) => changeQuestionType(qi, e.target.value)}
                    style={{
                      padding: '0.22rem 0.55rem',
                      borderRadius: 8,
                      border: '1px solid var(--soft)',
                      background: 'var(--panel)',
                      color: 'var(--ink)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    <option value="single_choice">Phần I · Trắc nghiệm 4 lựa chọn</option>
                    <option value="true_false">Phần II · Đúng / Sai (4 ý a, b, c, d)</option>
                    <option value="short_answer">Phần III · Trả lời ngắn (Điền đáp số)</option>
                  </select>

                  {q.topic && (
                    <span className="cep-qbadge" style={{ background: 'rgba(59,130,246,0.12)', color: '#2563eb' }}>
                      {q.topic}
                    </span>
                  )}
                  {q.level && (
                    <span className="cep-qbadge" style={{ background: 'rgba(139,92,246,0.12)', color: '#7c3aed' }}>
                      {q.level}
                    </span>
                  )}

                  {qType === 'single_choice' && q.correct < 0 && (
                    <span className="cep-qbadge warn">Chưa chọn đáp án đúng</span>
                  )}
                  {qType === 'short_answer' && !String(q.answer ?? '').trim() && (
                    <span className="cep-qbadge warn">Chưa nhập đáp số</span>
                  )}

                  {(q.warns || []).filter((w) => !/chưa xác định được đáp án/i.test(w)).map((w, wi) => (
                    <span key={wi} className="cep-qbadge warn" title={w}>
                      <IcoWarn size={11} /> {w.length > 48 ? w.slice(0, 46) + '…' : w}
                    </span>
                  ))}

                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <label
                      className="cep-chip"
                      style={{ cursor: 'pointer', padding: '0.22rem 0.55rem', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      title="Đính kèm hình ảnh minh họa cho câu hỏi này"
                    >
                      <IcoImage size={13} />
                      {imgBusyIdx === qi ? 'Đang nén…' : q.image ? 'Đổi ảnh' : '+ Ảnh'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAttachImage(qi, file);
                          e.target.value = '';
                        }}
                      />
                    </label>

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
                </div>

                <label className="cep-field" style={{ marginBottom: '.6rem' }}>
                  <span>Nội dung câu hỏi (hỗ trợ công thức LaTeX $...$)</span>
                  <textarea
                    placeholder="Nhập đề bài hoặc bấm thanh công thức phía trên..."
                    value={q.q}
                    onFocus={(e) => {
                      activeInputRef.current = e.target;
                      activeTargetRef.current = { qi, field: 'q', subIdx: -1 };
                    }}
                    onChange={(e) => updateQ(qi, { q: e.target.value })}
                    rows={2}
                  />
                </label>

                {q.image && (
                  <div style={{ marginBottom: '0.65rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <img
                      src={q.image}
                      alt={`Hình minh họa câu ${qi + 1}`}
                      style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, border: '1px solid var(--soft)' }}
                    />
                    <button
                      type="button"
                      className="cep-iconbtn danger"
                      onClick={() => updateQ(qi, { image: undefined })}
                      title="Gỡ ảnh minh họa"
                    >
                      <IcoX size={13} />
                    </button>
                  </div>
                )}

                {/* DẠNG 1: TRẮC NGHIỆM 4 LỰA CHỌN */}
                {qType === 'single_choice' && (
                  <div style={{ marginBottom: '.5rem' }}>
                    <span style={{ font: '700 .78rem var(--sans)', color: 'var(--mut)', display: 'block', marginBottom: '.4rem' }}>
                      Phương án lựa chọn — tích tròn ở đáp án đúng
                    </span>
                    {(q.options || []).map((opt, oi) => (
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
                          onFocus={(e) => {
                            activeInputRef.current = e.target;
                            activeTargetRef.current = { qi, field: 'opt', subIdx: oi };
                          }}
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
                        <IcoPlus size={12} /> Thêm phương án
                      </button>
                    )}
                  </div>
                )}

                {/* DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI 4 Ý (a, b, c, d) */}
                {qType === 'true_false' && (
                  <div style={{ marginBottom: '.65rem' }}>
                    <span style={{ font: '700 .78rem var(--sans)', color: 'var(--mut)', display: 'block', marginBottom: '.4rem' }}>
                      4 mệnh đề Đúng / Sai (a, b, c, d) — bấm nút Đúng hoặc Sai cho từng mệnh đề
                    </span>
                    <div style={{ display: 'grid', gap: '0.45rem' }}>
                      {(q.statements || []).map((stmt, si) => (
                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="cep-opt-key" style={{ fontWeight: 800 }}>{STMT_KEYS[si] || si + 1})</span>
                          <input
                            className="cep-opt-input"
                            style={{ flex: 1 }}
                            placeholder={`Nội dung mệnh đề ${STMT_KEYS[si] || si + 1})`}
                            value={stmt.text || ''}
                            onFocus={(e) => {
                              activeInputRef.current = e.target;
                              activeTargetRef.current = { qi, field: 'stmt', subIdx: si };
                            }}
                            onChange={(e) => updateStatement(qi, si, { text: e.target.value })}
                          />
                          <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--soft)', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => updateStatement(qi, si, { answer: true })}
                              style={{
                                padding: '0.32rem 0.65rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: stmt.answer !== false ? '#10b981' : 'transparent',
                                color: stmt.answer !== false ? '#fff' : 'var(--mut)',
                              }}
                            >
                              Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatement(qi, si, { answer: false })}
                              style={{
                                padding: '0.32rem 0.65rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: stmt.answer === false ? '#ef4444' : 'transparent',
                                color: stmt.answer === false ? '#fff' : 'var(--mut)',
                              }}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DẠNG 3: TRẢ LỜI NGẮN (ĐIỀN ĐÁP SỐ) */}
                {qType === 'short_answer' && (
                  <div style={{ marginBottom: '.65rem' }}>
                    <label className="cep-field" style={{ maxWidth: 340 }}>
                      <span>Đáp số đúng (chấp nhận cả dấu phẩy và dấu chấm thập phân, VD: 12,5 hoặc 12.5)</span>
                      <input
                        placeholder="VD: 24,5"
                        value={q.answer ?? ''}
                        onFocus={(e) => {
                          activeInputRef.current = e.target;
                          activeTargetRef.current = { qi, field: 'answer', subIdx: -1 };
                        }}
                        onChange={(e) => updateQ(qi, { answer: e.target.value })}
                      />
                    </label>
                  </div>
                )}

                <div className="cep-row" style={{ alignItems: 'flex-start' }}>
                  <label className="cep-field" style={{ flex: 1 }}>
                    <span>Lời giải chi tiết (tùy chọn — hiện sau khi học sinh nộp bài)</span>
                    <textarea
                      placeholder="Giải thích từng bước vì sao chọn đáp án đó…"
                      value={q.explain || ''}
                      onFocus={(e) => {
                        activeInputRef.current = e.target;
                        activeTargetRef.current = { qi, field: 'explain', subIdx: -1 };
                      }}
                      onChange={(e) => updateQ(qi, { explain: e.target.value })}
                      rows={2}
                    />
                  </label>

                  <label className="cep-field" style={{ maxWidth: 150 }}>
                    <span>Điểm câu này</span>
                    <input
                      type="number"
                      min="0.05"
                      step="0.25"
                      value={q.points}
                      onChange={(e) => updateQ(qi, { points: Number(e.target.value) || 0.25 })}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hàng nút thêm nhanh 3 dạng câu + lấy từ Ngân hàng */}
        <div className="cep-add-row" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="cep-add-btn" onClick={() => addQuestion('single_choice')}>
            <IcoPlus size={14} /> + Câu Trắc nghiệm (Phần I)
          </button>
          <button type="button" className="cep-add-btn" onClick={() => addQuestion('true_false')}>
            <IcoPlus size={14} /> + Câu Đúng/Sai 4 ý (Phần II)
          </button>
          <button type="button" className="cep-add-btn" onClick={() => addQuestion('short_answer')}>
            <IcoPlus size={14} /> + Câu Trả lời ngắn (Phần III)
          </button>
          <button type="button" className="cep-add-btn" onClick={() => setShowBankPicker(true)}>
            <IcoLibrary size={14} /> + Chọn từ Ngân hàng câu hỏi
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
          {saving ? 'Đang lưu…' : (<><IcoCheck size={14} /> Lưu đề ({questions.length} câu · {totalPoints}đ)</>)}
        </button>
      </div>

      {/* Modal chọn câu hỏi từ Ngân hàng */}
      {showBankPicker && (
        <ExamPickerFromBank
          teacherId={user?.uid}
          defaultSubject={classInfo?.subject || ''}
          excludeIds={questions.map((q) => q.id).filter(Boolean)}
          onClose={() => setShowBankPicker(false)}
          onPick={(pickedList) => {
            setShowBankPicker(false);
            if (!pickedList?.length) return;
            const mapped = pickedList.map(toFormQuestion);
            setQuestions((prev) => {
              // Nếu chỉ có 1 câu rỗng ban đầu thì thay thế luôn
              if (prev.length === 1 && !prev[0].q.trim() && (prev[0].options || []).every((o) => !o.trim())) {
                return mapped;
              }
              return [...prev, ...mapped];
            });
          }}
        />
      )}
    </div>
  );
});

export default ExamCreateForm;
