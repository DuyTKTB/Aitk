/* ============================================================
   CreateExamAI.jsx — Tab "Tạo bằng AI" (v3, MỌI MÔN)
   ------------------------------------------------------------
   Props: { grades, subjects, defaultSubject, onGenerated }
   onGenerated({ questions, meta, warnings }) — khớp CreateExamPage.

   Có:
     • Nút chọn môn (chip + ô gõ môn bất kỳ) trong thanh cấu hình
     • Cấu hình: lớp, số câu, độ khó, thời gian, lời giải, kiểm tra lại
     • 3 chế độ: Tạo đề mới | Số hóa đề có sẵn (file) | Chỉnh đề hiện tại
     • Bản nháp: xem, đổi đáp án, viết lại / xóa từng câu, trộn đáp án
     • AI giải lại độc lập để bắt đáp án sai
     • Tự lưu nháp, khôi phục khi tải lại trang
   ============================================================ */
import { useState, useRef, useEffect, useMemo } from 'react';
import MathText, { stripMath } from '../MathText.jsx';
import SubjectPicker from '../SubjectPicker.jsx';
import { readFile, validateFiles, fmtSize } from '../../lib/fileReader.js';
import {
  DIFFICULTIES, generateExam, digitizeExam, refineExam, regenerateQuestion, verifyExam,
  shuffleAllOptions, shuffleQuestionOrder, summarizeDraft, collectWarnings, countUnanswered,
  getFlags, saveDraft, loadDraft, clearDraft, examplePrompt, gradeLabel, letter, rid,
  VERIFY_PREFIX,
} from '../../lib/examAiUtils.js';
import './create-exam-ai.css';
import './create-exam-ai-chat.css';

/* ---------- Logo AI của web (nếu có) ---------- */
const markMods = import.meta.glob('../AIMark*.jsx', { eager: true });
const AIMarkComp = (() => {
  const m = Object.values(markMods)[0];
  return m ? (m.default || m.AIMark || null) : null;
})();

/* ---------- Icon ---------- */
const Ico = ({ size = 16, children, sw = 1.9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcoSpark = (p) => <Ico {...p}><path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></Ico>;
const IcoSend = (p) => <Ico {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></Ico>;
const IcoPlus = (p) => <Ico {...p}><path d="M12 5v14M5 12h14" /></Ico>;
const IcoChev = (p) => <Ico {...p}><path d="M6 9l6 6 6-6" /></Ico>;
const IcoTrash = (p) => <Ico {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></Ico>;
const IcoCheck = (p) => <Ico {...p} sw={2.6}><path d="M20 6L9 17l-5-5" /></Ico>;
const IcoWarn = (p) => <Ico {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></Ico>;
const IcoRefresh = (p) => <Ico {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Ico>;
const IcoStop = (p) => <Ico {...p}><rect x="6" y="6" width="12" height="12" rx="2" /></Ico>;
const IcoClose = (p) => <Ico {...p}><path d="M18 6L6 18M6 6l12 12" /></Ico>;

const DEFAULT_GRADES = ['6', '7', '8', '9', '10', '11', '12'];
const toOption = (g) =>
  g && typeof g === 'object'
    ? { value: String(g.value ?? g.id ?? g.label), label: String(g.label ?? g.name ?? g.value) }
    : { value: String(g), label: gradeLabel(g) };

const FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.docx,.xlsx,.xls,.txt,.md,.csv';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || lo));

const MODES = [
  { key: 'create', label: 'Tạo đề mới' },
  { key: 'digitize', label: 'Số hóa đề có sẵn' },
  { key: 'edit', label: 'Chỉnh đề hiện tại' },
];

const QUICK = [
  'Khó hơn', 'Dễ hơn', 'Thêm 5 câu', 'Thêm câu vận dụng',
  'Rút gọn lời giải', 'Đổi các câu nhận biết thành thông hiểu',
];

/* ============================================================
   MAIN
   ============================================================ */
export default function CreateExamAI({ grades = [], defaultSubject = '', onGenerated }) {
  const gradeOpts = useMemo(
    () => (grades.length ? grades : DEFAULT_GRADES).map(toOption),
    [grades]
  );
  const saved = useMemo(() => loadDraft(), []);

  const [cfg, setCfg] = useState(() => ({
    subject: saved?.subject || defaultSubject || 'Hóa học',
    grade: gradeOpts.find((g) => g.value === '11')?.value || gradeOpts[0]?.value || '11',
    count: 10,
    difficulty: 'medium',
    duration: 45,
    optionsCount: 4,
    explain: true,
    verify: true,
  }));
  const patch = (p) => setCfg((c) => ({ ...c, ...p }));

  const [cfgOpen, setCfgOpen] = useState(!saved);
  const [mode, setMode] = useState(saved ? 'edit' : 'create');
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState('');
  const [draft, setDraft] = useState(saved ? { meta: saved.meta, questions: saved.questions } : null);
  const [openQ, setOpenQ] = useState(null);
  const [regenText, setRegenText] = useState({});
  const [messages, setMessages] = useState(() => {
    const m = [{
      id: rid(), role: 'ai',
      text:
        'Chào thầy/cô! Tôi là trợ lý tạo đề, soạn được đề cho mọi môn.\n\n' +
        '• Mở thanh cấu hình phía trên để chọn môn, lớp, số câu, độ khó\n' +
        '• Đính kèm ảnh/PDF/Word/Excel (nút +) — tôi ra đề từ nội dung đó hoặc số hóa đề có sẵn\n' +
        '• Có đề rồi, thầy/cô nhắn tiếp để chỉnh: "khó hơn", "thêm 5 câu", "đổi câu 3 sang dạng tính toán"…\n\n' +
        `Ví dụ: "${examplePrompt(saved?.subject || defaultSubject || 'Hóa học')}"`,
    }];
    if (saved?.questions?.length) {
      m.push({
        id: rid(), role: 'ai',
        text: `Đã khôi phục bản nháp trước đó (${saved.questions.length} câu). Thầy/cô có thể xem, sửa hoặc nhắn tiếp để chỉnh đề.`,
      });
    }
    return m;
  });

  const abortRef = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const say = (role, text, extra = {}) =>
    setMessages((m) => [...m, { id: rid(), role, text, ...extra }]);

  /* ---- Tự lưu nháp ---- */
  useEffect(() => {
    if (draft?.questions?.length) saveDraft({ ...draft, subject: cfg.subject });
  }, [draft, cfg.subject]);

  /* ---- Cuộn xuống cuối ---- */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy, draft?.questions?.length]);

  const stats = useMemo(() => (draft ? summarizeDraft(draft.questions) : null), [draft]);
  const unanswered = draft ? countUnanswered(draft.questions) : 0;

  /* ============================================================
     CHẠY TÁC VỤ AI (có nút Dừng)
     ============================================================ */
  const run = async (label, fn) => {
    if (busy) return;
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(label);
    try {
      await fn(ac.signal);
    } catch (e) {
      if (e?.name === 'AbortError') {
        say('ai', 'Đã dừng. Bản nháp hiện tại được giữ nguyên.');
      } else {
        console.error(e);
        say('ai', `Không thực hiện được: ${e?.message || 'lỗi không xác định'}`, { error: true });
      }
    } finally {
      setBusy('');
      abortRef.current = null;
    }
  };
  const stop = () => abortRef.current?.abort();

  const common = { subject: cfg.subject, grade: cfg.grade, optionsCount: cfg.optionsCount, explain: cfg.explain };

  /* ---- Kiểm tra lại đáp án (dùng chung) ---- */
  const doVerify = async (questions, signal) => {
    setBusy('Đang kiểm tra đáp án…');
    return verifyExam({ questions, subject: cfg.subject, signal });
  };

  /* ============================================================
     GỬI
     ============================================================ */
  const send = (textArg, modeArg) => {
    const text = (textArg ?? input).trim();
    const m = modeArg || mode;
    if (busy) return;
    if (m === 'edit' && !draft) { say('ai', 'Chưa có bản nháp để chỉnh. Hãy tạo đề trước.'); return; }
    if (m === 'edit' && !text) return;
    if (m === 'digitize' && files.length === 0) {
      say('ai', 'Hãy đính kèm ảnh/PDF/Word/Excel chứa đề cần số hóa (nút + bên trái ô nhập).');
      return;
    }
    if (m === 'create' && !text && files.length === 0) {
      say('ai', `Hãy mô tả đề ${cfg.subject} cần tạo, ví dụ: "${examplePrompt(cfg.subject)}".`);
      return;
    }

    const usedFiles = files;
    say('user', text || (m === 'digitize' ? `Số hóa file: ${usedFiles.map((f) => f.name).join(', ')}` : `Tạo đề từ file: ${usedFiles.map((f) => f.name).join(', ')}`));
    setInput('');
    setCfgOpen(false);

    run(m === 'edit' ? 'Đang chỉnh đề…' : m === 'digitize' ? 'Đang đọc và số hóa…' : 'Đang soạn đề…', async (signal) => {
      /* ----- Chỉnh đề ----- */
      if (m === 'edit') {
        const before = draft.questions.length;
        const res = await refineExam({ draft, instruction: text, ...common, signal });
        setDraft({ meta: res.meta, questions: res.questions });
        setOpenQ(null);
        const flagged = res.questions.filter((q) => getFlags(q).length).length;
        say('ai', `Đã cập nhật đề: ${before} → ${res.questions.length} câu.${flagged ? ` ${flagged} câu đang có cảnh báo.` : ''}`);
        return;
      }

      /* ----- Tạo mới / Số hóa ----- */
      const res = m === 'digitize'
        ? await digitizeExam({ files: usedFiles, note: text, duration: cfg.duration, ...common, signal })
        : await generateExam({
            ...common,
            difficulty: cfg.difficulty,
            count: cfg.count,
            duration: cfg.duration,
            prompt: text,
            files: usedFiles,
            signal,
            onProgress: (d, t) => t > 1 && setBusy(`Đang soạn đề (đợt ${d}/${t})…`),
          });

      let questions = res.questions;
      let verifyNote = '';
      if (cfg.verify) {
        try {
          const v = await doVerify(questions, signal);
          questions = v.questions;
          verifyNote = v.diff + v.unsure === 0
            ? ' AI giải lại và khớp toàn bộ đáp án.'
            : ` AI giải lại thấy ${v.diff + v.unsure} câu cần xem lại.`;
        } catch (e) {
          verifyNote = e?.name === 'AbortError'
            ? ' Đã bỏ qua bước kiểm tra đáp án.'
            : ' Chưa kiểm tra lại được đáp án (có thể bấm "Kiểm tra đáp án" sau).';
        }
      }

      setDraft({ meta: res.meta, questions });
      setMode('edit');
      setFiles([]);
      setOpenQ(null);
      const flagged = questions.filter((q) => getFlags(q).length).length;
      say(
        'ai',
        `Đã ${m === 'digitize' ? 'số hóa' : 'tạo'} ${questions.length} câu môn ${cfg.subject}.` +
        verifyNote +
        (flagged ? ` Có ${flagged} câu đánh dấu vàng — thầy/cô nên xem trước khi lưu.` : '') +
        ' Bấm vào từng câu để xem, đổi đáp án hoặc viết lại; nhắn tiếp để chỉnh cả đề.'
      );
    });
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
  };

  /* ============================================================
     FILE ĐÍNH KÈM
     ============================================================ */
  const onPickFiles = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    const shim = [...files.map((f) => ({ name: f.name, type: f.mimeType || '' })), ...picked];
    const errs = validateFiles(shim);
    if (errs.length) { say('ai', errs.join('\n'), { error: true }); return; }
    const added = [];
    for (const f of picked) {
      try { added.push(await readFile(f)); }
      catch (err) { say('ai', err.message, { error: true }); }
    }
    if (added.length) setFiles((cur) => [...cur, ...added]);
  };
  const removeFile = (id) => setFiles((cur) => cur.filter((f) => f.id !== id));

  /* ============================================================
     THAO TÁC TRÊN BẢN NHÁP
     ============================================================ */
  const updateQ = (i, fn) =>
    setDraft((d) => d && { ...d, questions: d.questions.map((q, k) => (k === i ? fn(q) : q)) });

  const chooseAnswer = (i, oi) =>
    updateQ(i, (q) => ({
      ...q,
      correct: oi,
      verified: undefined,
      warns: (q.warns || []).filter((w) => !w.startsWith(VERIFY_PREFIX)),
    }));

  const removeQ = (i) => {
    setDraft((d) => {
      if (!d) return d;
      const questions = d.questions.filter((_, k) => k !== i);
      if (!questions.length) { clearDraft(); return null; }
      return { ...d, questions };
    });
    setOpenQ(null);
  };

  const regenQ = (i) =>
    run(`Đang viết lại câu ${i + 1}…`, async (signal) => {
      const nq = await regenerateQuestion({
        question: draft.questions[i], instruction: regenText[i] || '', ...common, signal,
      });
      updateQ(i, () => nq);
      setRegenText((r) => ({ ...r, [i]: '' }));
      say('ai', `Đã viết lại câu ${i + 1}.`);
    });

  const reverify = () =>
    run('Đang kiểm tra đáp án…', async (signal) => {
      const v = await doVerify(draft.questions, signal);
      setDraft((d) => d && { ...d, questions: v.questions });
      say('ai', v.diff + v.unsure === 0
        ? `Đã kiểm tra ${v.ok} câu: AI giải lại khớp toàn bộ đáp án.`
        : `Đã kiểm tra: ${v.ok} câu khớp, ${v.diff} câu AI ra đáp án khác, ${v.unsure} câu AI không chắc. Các câu này được đánh dấu vàng.`);
    });

  const discard = () => {
    if (!window.confirm('Xóa bản nháp này?')) return;
    clearDraft();
    setDraft(null);
    setMode('create');
    setOpenQ(null);
  };

  const apply = () => {
    if (!draft?.questions.length || unanswered) return;
    onGenerated?.({
      questions: draft.questions,
      meta: { ...draft.meta, duration: cfg.duration },
      warnings: collectWarnings(draft.questions),
    });
  };

  /* ============================================================
     RENDER
     ============================================================ */
  const gradeText = gradeOpts.find((g) => g.value === cfg.grade)?.label || gradeLabel(cfg.grade);
  const diffLabel = DIFFICULTIES.find((d) => d.key === cfg.difficulty)?.label;
  const placeholder =
    mode === 'edit' ? 'Nhắn để chỉnh đề: "khó hơn", "thêm 5 câu", "đổi câu 3 sang dạng tính toán"… (Ctrl+Enter để gửi)'
    : mode === 'digitize' ? 'Ghi chú thêm cho việc số hóa (không bắt buộc)… (Ctrl+Enter để gửi)'
    : `Mô tả đề ${cfg.subject} cần tạo… (Ctrl+Enter để gửi)`;

  return (
    <div className="cai">
      {/* ===== THANH CẤU HÌNH ===== */}
      <div className={'cai-cfg' + (cfgOpen ? ' open' : '')}>
        <button
          type="button"
          className="cai-cfg-bar"
          onClick={() => setCfgOpen((o) => !o)}
          aria-expanded={cfgOpen}
        >
          <IcoSpark size={15} />
          <span className="cai-cfg-sum">
            <b>{cfg.subject}</b> · {gradeText} · {cfg.count} câu · Trắc nghiệm {cfg.optionsCount} đáp án · {diffLabel} · {cfg.duration} phút
          </span>
          <span className="cai-cfg-chev"><IcoChev size={16} /></span>
        </button>

        {cfgOpen && (
          <div className="cai-cfg-panel">
            <div className="cai-field">
              <span className="cai-label">Môn học</span>
              <SubjectPicker value={cfg.subject} onChange={(s) => patch({ subject: s })} disabled={!!busy} />
            </div>

            <div className="cai-grid">
              <label className="cai-field">
                <span className="cai-label">Khối lớp</span>
                <select value={cfg.grade} onChange={(e) => patch({ grade: e.target.value })}>
                  {gradeOpts.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </label>
              <label className="cai-field">
                <span className="cai-label">Số câu (1–60)</span>
                <input type="number" min={1} max={60} value={cfg.count}
                  onChange={(e) => patch({ count: clamp(e.target.value, 1, 60) })} />
              </label>
              <label className="cai-field">
                <span className="cai-label">Độ khó</span>
                <select value={cfg.difficulty} onChange={(e) => patch({ difficulty: e.target.value })}>
                  {DIFFICULTIES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </label>
              <label className="cai-field">
                <span className="cai-label">Thời gian (phút)</span>
                <input type="number" min={5} max={240} value={cfg.duration}
                  onChange={(e) => patch({ duration: clamp(e.target.value, 5, 240) })} />
              </label>
              <label className="cai-field">
                <span className="cai-label">Số đáp án mỗi câu</span>
                <select value={cfg.optionsCount} onChange={(e) => patch({ optionsCount: Number(e.target.value) })}>
                  <option value={3}>3 đáp án</option>
                  <option value={4}>4 đáp án</option>
                  <option value={5}>5 đáp án</option>
                </select>
              </label>
            </div>

            <div className="cai-toggles">
              <label className={'cea-toggle' + (cfg.explain ? ' on' : '')}>
                <input type="checkbox" checked={cfg.explain} onChange={(e) => patch({ explain: e.target.checked })} />
                Kèm lời giải chi tiết
              </label>
              <label className={'cea-toggle' + (cfg.verify ? ' on' : '')}>
                <input type="checkbox" checked={cfg.verify} onChange={(e) => patch({ verify: e.target.checked })} />
                AI giải lại để kiểm tra đáp án
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ===== HỘI THOẠI ===== */}
      <div className="cai-feed" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={'cai-msg ' + m.role + (m.error ? ' error' : '')}>
            {m.role === 'ai' && (
              <span className="cai-ava" aria-hidden="true">
                {AIMarkComp ? <AIMarkComp size={26} /> : <IcoSpark size={16} />}
              </span>
            )}
            <div className="cai-bubble">{m.text}</div>
          </div>
        ))}

        {/* ----- Bản nháp ----- */}
        {draft && stats && (
          <div className="cea-draft">
            <div className="cea-draft-head">
              <div className="cea-draft-title">
                <b>{stripMath(draft.meta?.title) || `Đề ${cfg.subject}`}</b>
                <span>{cfg.subject} · {gradeText} · {cfg.duration} phút</span>
              </div>
              <button type="button" className="cea-icon-btn danger" onClick={discard}
                disabled={!!busy} title="Xóa bản nháp" aria-label="Xóa bản nháp">
                <IcoTrash size={14} />
              </button>
            </div>

            <div className="cea-draft-stats">
              <span className="cea-stat"><b>{stats.total}</b> câu · <b>{stats.points}</b> điểm</span>
              {Object.keys(stats.levels).length > 0 && (
                <span className="cea-stat">
                  {Object.entries(stats.levels).map(([k, v]) => <em key={k}>{k} {v}</em>)}
                </span>
              )}
              {stats.unanswered > 0 && <span className="cea-stat warn"><IcoWarn size={13} /> {stats.unanswered} câu chưa có đáp án</span>}
              {stats.flagged > 0 && <span className="cea-stat warn"><IcoWarn size={13} /> {stats.flagged} câu cần xem lại</span>}
              {stats.flagged === 0 && stats.unanswered === 0 && <span className="cea-stat ok"><IcoCheck size={13} /> Không có cảnh báo</span>}
            </div>

            <div className="cea-draft-actions">
              <button type="button" className="cea-act" onClick={reverify} disabled={!!busy}>
                <IcoCheck size={13} /> Kiểm tra đáp án
              </button>
              <button type="button" className="cea-act" disabled={!!busy}
                onClick={() => setDraft((d) => ({ ...d, questions: shuffleAllOptions(d.questions) }))}>
                <IcoRefresh size={13} /> Trộn vị trí đáp án
              </button>
              <button type="button" className="cea-act" disabled={!!busy}
                onClick={() => setDraft((d) => ({ ...d, questions: shuffleQuestionOrder(d.questions) }))}>
                <IcoRefresh size={13} /> Trộn thứ tự câu
              </button>
            </div>

            <ol className="cea-qs">
              {draft.questions.map((q, i) => {
                const flags = getFlags(q);
                const open = openQ === i;
                return (
                  <li key={q.id || i} className={'cea-q' + (flags.length ? ' flag' : q.verified === 'ok' ? ' ok' : '')}>
                    <button type="button" className="cea-q-head" onClick={() => setOpenQ(open ? null : i)} aria-expanded={open}>
                      <span className="cea-q-num">Câu {i + 1}</span>
                      <span className="cea-q-text">{stripMath(q.q)}</span>
                      {q.level && <span className="cea-badge">{q.level}</span>}
                      {q.correct >= 0
                        ? <span className="cea-badge ans">Đáp án {letter(q.correct)}</span>
                        : <span className="cea-badge warn">Chưa có đáp án</span>}
                      {flags.length > 0 && q.correct >= 0 && <span className="cea-badge warn"><IcoWarn size={11} /> {flags.length}</span>}
                      {q.verified === 'ok' && !flags.length && <span className="cea-badge okb"><IcoCheck size={11} /> Đã kiểm</span>}
                    </button>

                    {open && (
                      <div className="cea-q-body">
                        <MathText as="p" className="cea-q-full">{q.q}</MathText>
                        {q.topic && <span className="cea-badge">{q.topic}</span>}

                        <div className="cea-q-opts">
                          {q.options.map((opt, oi) => (
                            <button key={oi} type="button"
                              className={'cea-q-opt' + (q.correct === oi ? ' correct' : '')}
                              onClick={() => chooseAnswer(i, oi)}
                              disabled={!!busy}
                              aria-pressed={q.correct === oi}
                              title="Bấm để chọn làm đáp án đúng">
                              <span className="cea-q-key">{letter(oi)}</span>
                              <MathText>{opt}</MathText>
                              {q.correct === oi && <IcoCheck size={15} />}
                            </button>
                          ))}
                        </div>

                        {flags.map((w, k) => (
                          <p key={k} className="cea-q-note warn"><IcoWarn size={13} /> {w}</p>
                        ))}

                        {q.explain && (
                          <div className="cea-q-explain">
                            <b>Lời giải</b>
                            <MathText as="p">{q.explain}</MathText>
                          </div>
                        )}

                        <div className="cea-q-tools">
                          <input className="cea-q-regen-input" value={regenText[i] || ''}
                            onChange={(e) => setRegenText((r) => ({ ...r, [i]: e.target.value }))}
                            placeholder="Yêu cầu riêng cho câu này (không bắt buộc)…"
                            disabled={!!busy} />
                          <button type="button" className="cea-act" onClick={() => regenQ(i)} disabled={!!busy}>
                            <IcoRefresh size={13} /> Viết lại câu
                          </button>
                          <button type="button" className="cea-act danger" onClick={() => removeQ(i)} disabled={!!busy}>
                            <IcoTrash size={13} /> Xóa câu
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <button type="button" className="cai-primary" onClick={apply}
              disabled={!!busy || !draft.questions.length || unanswered > 0}>
              Dùng đề này để soạn và lưu
            </button>
            {unanswered > 0 && (
              <p className="cai-hint">Còn {unanswered} câu chưa chọn đáp án đúng — bấm vào câu đó rồi chọn đáp án để tiếp tục.</p>
            )}
          </div>
        )}

        {busy && (
          <div className="cai-msg ai">
            <span className="cai-ava" aria-hidden="true">
              {AIMarkComp ? <AIMarkComp size={26} /> : <IcoSpark size={16} />}
            </span>
            <div className="cai-bubble cai-busy">
              <span className="cai-dots" aria-hidden="true"><i /><i /><i /></span>
              {busy}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ===== THAO TÁC NHANH ===== */}
      {draft && mode === 'edit' && !busy && (
        <div className="cea-quick">
          {QUICK.map((t) => (
            <button key={t} type="button" className="cea-quick-btn" onClick={() => send(t, 'edit')}>{t}</button>
          ))}
          {stats?.flagged > 0 && (
            <button type="button" className="cea-quick-btn"
              onClick={() => send('Xem lại và sửa các câu đang có cảnh báo', 'edit')}>
              Sửa các câu cần xem lại
            </button>
          )}
        </div>
      )}

      {/* ===== CHẾ ĐỘ GỬI ===== */}
      <div className="cea-mode" role="group" aria-label="Chế độ gửi">
        {MODES.map((m) => (
          <button key={m.key} type="button"
            className={'cea-mode-btn' + (mode === m.key ? ' on' : '')}
            aria-pressed={mode === m.key}
            disabled={(m.key === 'digitize' && files.length === 0) || (m.key === 'edit' && !draft)}
            onClick={() => setMode(m.key)}>
            {m.label}
          </button>
        ))}
        {files.length > 0 && (
          <div className="cai-files">
            {files.map((f) => (
              <span key={f.id} className="cai-file">
                <span className="cai-file-name">{f.name}</span>
                <small>{fmtSize(f.size)}</small>
                <button type="button" onClick={() => removeFile(f.id)} aria-label={`Bỏ file ${f.name}`}>
                  <IcoClose size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        {files.length > 0 && mode === 'create' && (
          <span className="cea-files-note">AI dùng file làm tài liệu để ra đề mới. Chọn "Số hóa đề có sẵn" nếu file đã là một đề hoàn chỉnh.</span>
        )}
        {files.length > 0 && mode === 'digitize' && (
          <span className="cea-files-note">AI giữ nguyên nội dung câu hỏi trong file và chuyển thành đề.</span>
        )}
      </div>

      {/* ===== Ô NHẬP ===== */}
      <div className="cai-input">
        <input ref={fileRef} type="file" hidden multiple accept={FILE_ACCEPT} onChange={onPickFiles} />
        <button type="button" className="cai-round" onClick={() => fileRef.current?.click()}
          disabled={!!busy} title="Đính kèm ảnh, PDF, Word, Excel" aria-label="Đính kèm file">
          <IcoPlus size={18} />
        </button>
        <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown} placeholder={placeholder} disabled={!!busy}
          aria-label="Nội dung gửi cho AI" />
        {busy ? (
          <button type="button" className="cai-round send stop" onClick={stop} aria-label="Dừng">
            <IcoStop size={16} />
          </button>
        ) : (
          <button type="button" className="cai-round send" onClick={() => send()} aria-label="Gửi">
            <IcoSend size={16} />
          </button>
        )}
      </div>
    </div>
  );
}