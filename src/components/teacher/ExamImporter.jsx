/* ============================================================
   ExamImporter.jsx — Upload → extract → regex/AI → preview → lưu  (v2)
   Pipeline:
     Bước 1: Upload file (PDF/Word/Ảnh/TXT, tới 500 trang)
     Bước 2: Client-side extraction (pdfjs / mammoth / Tesseract / FileReader)
     Bước 3: Regex parser (≥80% → preview nhanh; không → AI fallback)
     Bước 4: Preview UI (grid câu, sửa, chọn/bỏ)
     Bước 5: Lưu vào Ngân hàng hoặc tạo Đề mềm
   ============================================================ */
import { useState, useRef, useCallback } from 'react';
import MathText from '../MathText.jsx';
import { parseExamFile } from '../../lib/examParser.js';
import { ALL_SUBJECTS_LIST } from '../../data/topicsBySubject.js';
import sound from '../../lib/gameSound.js';
import '../../styles/exam-importer.css';

/* ── Icons ── */
const Svg = ({ size = 18, sw = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const IcoUpload   = (p) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Svg>;
const IcoCheck    = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>;
const IcoClose    = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>;
const IcoFile     = (p) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Svg>;
const IcoWarn     = (p) => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
const IcoEdit     = (p) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
const IcoTrash    = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Svg>;
const IcoSpark    = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"/></Svg>;
const IcoBook     = (p) => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Svg>;

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const PIPELINE_STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Đọc file' },
  { id: 3, label: 'Tách câu' },
  { id: 4, label: 'Preview' },
  { id: 5, label: 'Lưu' },
];

function StepBar({ current }) {
  return (
    <div className="ei-stepbar">
      {PIPELINE_STEPS.map((s, idx) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className={'ei-step' + (done ? ' done' : active ? ' active' : '')}>
            <div className="ei-step-dot">
              {done ? <IcoCheck size={11} /> : <span>{s.id}</span>}
            </div>
            <span className="ei-step-label">{s.label}</span>
            {idx < PIPELINE_STEPS.length - 1 && <div className="ei-step-line" />}
          </div>
        );
      })}
    </div>
  );
}

function FileTypeIcon({ name }) {
  const ext = (name || '').split('.').pop().toLowerCase();
  const colors = { pdf: '#dc2626', docx: '#2563eb', txt: '#059669', md: '#059669', jpg: '#d97706', jpeg: '#d97706', png: '#d97706', webp: '#d97706' };
  const color = colors[ext] || 'var(--mut)';
  return (
    <div className="ei-filetype-badge" style={{ '--ftc': color }}>
      <IcoFile size={28} />
      <span>{ext.toUpperCase()}</span>
    </div>
  );
}

export default function ExamImporter({
  variant = 'modal',
  onClose,
  onSaveToBank,
  onCreateSoftExam,
  classes = [],
  classInfo = null,
  defaultSubject = '',
  defaultGrade = 0,
  allowBank = true,
  allowSoftExam = true,
}) {
  const [stage, setStage] = useState('idle'); // idle | processing | preview
  const [pipeStep, setPipeStep] = useState(1);
  const [progress, setProgress] = useState({ percent: 0, message: '' });
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState(defaultGrade || 0);
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(45);
  const [classId, setClassId] = useState(classInfo?.id || '');
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState('');

  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  /* ── Stage → pipeline step mapping ── */
  const progressToPipeStep = useCallback((percent) => {
    if (percent < 30) setPipeStep(2);
    else if (percent < 55) setPipeStep(3);
    else if (percent < 95) setPipeStep(3);
    else setPipeStep(4);
  }, []);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setError(`File quá lớn (>${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB).`);
      return;
    }
    setFile(f);
    setStage('processing');
    setPipeStep(2);
    setError('');
    setProgress({ percent: 0, message: 'Đang mở file...' });
    abortRef.current = new AbortController();
    if (!examTitle) {
      setExamTitle(String(f.name || '').replace(/\.[^.]+$/, '') || 'Đề mềm từ file');
    }

    try {
      const result = await parseExamFile(f, {
        onProgress: (p) => {
          const pct = Math.min(100, p.percent || 0);
          progressToPipeStep(pct);
          setProgress({
            percent: pct,
            message: p.message || stageLabel(p.stage),
          });
        },
        signal: abortRef.current.signal,
      });

      setQuestions(result.questions);
      setStats(result.stats);
      setSelected(new Set(result.questions.map((_, i) => i)));
      setStage('preview');
      setPipeStep(4);
      if (result.stats?.warning) setError(result.stats.warning);
      sound.cheer?.();
    } catch (e) {
      if (e?.name === 'AbortError') { setStage('idle'); setPipeStep(1); return; }
      console.error('[ExamImporter]', e);
      setError(e.message || 'Không parse được file.');
      setStage('idle');
      setPipeStep(1);
    }
  }, [examTitle, progressToPipeStep]);

  function stageLabel(s) {
    return { extracting: 'Đang mở file...', reading: 'Đang trích xuất nội dung...', regex: 'Tách câu hỏi (regex)...', ai: 'AI đang bổ sung câu thiếu...', done: 'Hoàn tất!' }[s] || 'Đang xử lý...';
  }

  /* ── Edit ── */
  const startEdit = (idx) => {
    setEditingIdx(idx);
    const q = questions[idx];
    setEditForm({ q: q.q, options: [...(q.options || [])], correct: q.correct || 0, explain: q.explain || '' });
  };
  const saveEdit = () => {
    if (!editForm) return;
    setQuestions((prev) => prev.map((q, i) => i === editingIdx ? { ...q, ...editForm, _needsAnswer: false, _ok: true } : q));
    setEditingIdx(null); setEditForm(null);
    sound.ding?.();
  };
  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setSelected((prev) => { const next = new Set(); prev.forEach((i) => { if (i < idx) next.add(i); else if (i > idx) next.add(i - 1); }); return next; });
    if (editingIdx === idx) { setEditingIdx(null); setEditForm(null); }
  };
  const toggleSelect = (idx) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };

  const picked = () => questions
    .filter((_, i) => selected.has(i))
    .map((q) => ({ q: q.q, options: q.options, correct: q.correct, explain: q.explain || '', level: q.level || '', points: q.points || 1, subject, grade: Number(grade) || 0 }));

  const runSave = async (kind) => {
    const list = picked();
    if (!list.length) { setError('Chưa chọn câu nào.'); return; }
    setSaving(kind); setError('');
    try {
      setPipeStep(5);
      if (kind === 'bank') {
        await onSaveToBank?.(list);
      } else {
        await onCreateSoftExam?.({
          title: examTitle.trim() || `Đề mềm — ${file?.name || 'file'}`,
          duration: Number(duration) || 45,
          classId: classId || classInfo?.id || '',
          subject, grade: Number(grade) || 0, questions: list, sourceFile: file?.name || '',
        });
      }
      sound.cheer?.();
    } catch (e) {
      setError(e.message || 'Không lưu được.');
      setPipeStep(4);
    } finally { setSaving(''); }
  };

  const handleCancel = () => { abortRef.current?.abort(); onClose?.(); };
  const resetToIdle  = () => { setStage('idle'); setQuestions([]); setStats(null); setError(''); setPipeStep(1); setEditingIdx(null); setEditForm(null); };

  /* ── Shell ── */
  const shellClass = variant === 'page' ? 'ei-page' : 'ei-modal';
  const inner = (
    <div className={shellClass} onClick={(e) => e.stopPropagation()}>

      {/* Header */}
      <header className="ei-head">
        <div className="ei-head-left">
          <IcoUpload size={18} />
          <h2>Nhập đề từ file</h2>
        </div>
        <StepBar current={pipeStep} />
        {onClose && (
          <button type="button" className="ei-close" onClick={handleCancel} aria-label="Đóng">
            <IcoClose size={16} />
          </button>
        )}
      </header>

      {/* ── STAGE: IDLE ── */}
      {stage === 'idle' && (
        <div className="ei-body">
          {/* Drop zone */}
          <div
            className={'ei-drop' + (dragging ? ' on' : '')}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <div className="ei-drop-icon">
              <IcoUpload size={40} />
            </div>
            <h3>Kéo thả hoặc bấm để chọn file</h3>
            <p>PDF · DOCX · JPG / PNG · TXT</p>
            <div className="ei-drop-chips">
              {['PDF gõ', 'Word', 'PDF scan (OCR)', 'Ảnh (OCR)', 'TXT'].map((t) => (
                <span key={t} className="ei-drop-chip">{t}</span>
              ))}
            </div>
            <small>Tối đa 50MB · tới 500 trang · tách đề tự động</small>
          </div>

          {/* Pipeline info */}
          <div className="ei-pipeline-info">
            <div className="ei-pi-title">Quy trình tách đề</div>
            <div className="ei-pi-steps">
              {[
                { icon: <IcoUpload size={14}/>, text: 'Upload file' },
                { icon: <IcoFile size={14}/>, text: 'pdfjs / mammoth / OCR trích xuất text' },
                { icon: <IcoSpark size={14}/>, text: 'Regex tách câu · AI bổ sung nếu cần' },
                { icon: <IcoEdit size={14}/>, text: 'Preview & sửa từng câu' },
                { icon: <IcoBook size={14}/>, text: 'Lưu ngân hàng hoặc tạo đề mềm' },
              ].map((s, i) => (
                <div key={i} className="ei-pi-step">
                  <span className="ei-pi-num">{i + 1}</span>
                  <span className="ei-pi-ico">{s.icon}</span>
                  <span className="ei-pi-txt">{s.text}</span>
                </div>
              ))}
            </div>
            <div className="ei-pi-tip">
              <b>Tip:</b> File nên có dạng <code>Câu 1:</code> + <code>A. B. C. D.</code> + <code>Đáp án: A</code> để tách nhanh nhất.
            </div>
          </div>

          {error && <div className="ei-error"><IcoWarn size={16}/><span>{error}</span></div>}
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.bmp" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        </div>
      )}

      {/* ── STAGE: PROCESSING ── */}
      {stage === 'processing' && (
        <div className="ei-body ei-processing">
          <FileTypeIcon name={file?.name} />
          <h3 className="ei-processing-name">{file?.name}</h3>

          {/* Step indicators during processing */}
          <div className="ei-proc-steps">
            {['Mở file', 'Trích xuất', 'Tách câu (Regex)', 'AI bổ sung'].map((s, i) => {
              const stepPct = [0, 30, 55, 80][i];
              const done = progress.percent > stepPct + 20;
              const active = progress.percent >= stepPct && !done;
              return (
                <div key={i} className={'ei-proc-step' + (done ? ' done' : active ? ' active' : '')}>
                  <div className="ei-proc-dot">
                    {done ? <IcoCheck size={10}/> : active ? <div className="ei-proc-spin"/> : <span>{i + 1}</span>}
                  </div>
                  <span>{s}</span>
                </div>
              );
            })}
          </div>

          <div className="ei-progress">
            <div className="ei-progress-track">
              <div className="ei-progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
            <span>{progress.percent}%</span>
          </div>
          <p className="ei-processing-msg">{progress.message}</p>
          <button type="button" className="ei-btn-cancel" onClick={handleCancel}>Hủy xử lý</button>
        </div>
      )}

      {/* ── STAGE: PREVIEW ── */}
      {stage === 'preview' && (
        <>
          <div className="ei-body ei-preview">

            {/* Stats bar */}
            <div className="ei-stats-bar">
              <div className="ei-stat ei-stat--primary">
                <b>{questions.length}</b><span>câu tách được</span>
              </div>
              <div className="ei-stat">
                <b>{stats?.successRate ?? 0}%</b><span>tỷ lệ</span>
              </div>
              {stats?.fromRegex > 0 && <div className="ei-stat"><b>{stats.fromRegex}</b><span>regex</span></div>}
              {stats?.fromAI    > 0 && <div className="ei-stat ei-stat--ai"><b>{stats.fromAI}</b><span>AI (nên rà)</span></div>}
              {stats?.pages     > 0 && <div className="ei-stat"><b>{stats.pages}</b><span>trang</span></div>}
            </div>

            {/* Phân loại + Đề mềm metadata */}
            <div className="ei-meta-section">
              <div className="ei-classify">
                <label>
                  <span>Môn học</span>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option value="">Chưa chọn</option>
                    {ALL_SUBJECTS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  <span>Lớp</span>
                  <select value={grade} onChange={(e) => setGrade(Number(e.target.value) || 0)}>
                    {[0, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>{g === 0 ? 'Mọi lớp' : `Lớp ${g}`}</option>
                    ))}
                  </select>
                </label>
              </div>

              {allowSoftExam && (
                <div className="ei-soft-meta">
                  <label>
                    <span>Tên đề mềm</span>
                    <input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="VD: Đề giữa kỳ Hóa 11"/>
                  </label>
                  <label>
                    <span>Thời gian (phút)</span>
                    <input type="number" min={5} max={180} value={duration} onChange={(e) => setDuration(e.target.value)}/>
                  </label>
                  {classes.length > 0 && (
                    <label>
                      <span>Giao lớp</span>
                      <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                        <option value="">Chưa giao</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                      </select>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Preview toolbar */}
            <div className="ei-preview-toolbar">
              <button type="button" className="ei-btn-toggle" onClick={() => {
                if (selected.size === questions.length) setSelected(new Set());
                else setSelected(new Set(questions.map((_, i) => i)));
              }}>
                {selected.size === questions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <span>
                Đã chọn <b>{selected.size}/{questions.length}</b>
                {' · '}
                <span className="ei-toolbar-hint">bấm ✏️ để sửa câu trước khi lưu</span>
              </span>
            </div>

            {error && <div className="ei-error"><IcoWarn size={16}/><span>{error}</span></div>}

            {/* Question grid */}
            <div className="ei-q-grid">
              {questions.map((q, idx) => {
                const isSelected = selected.has(idx);
                const isEditing  = editingIdx === idx;
                return (
                  <article key={idx} className={'ei-q-item' + (isSelected ? ' selected' : ' off') + (q._needsAnswer ? ' needs-ans' : '')}>
                    <div className="ei-q-head">
                      <input className="ei-check" type="checkbox" checked={isSelected} onChange={() => toggleSelect(idx)}/>
                      <span className="ei-q-num">Câu {q.num || idx + 1}</span>
                      {q._source === 'ai' && <span className="ei-q-badge ai">AI</span>}
                      {q._needsAnswer && <span className="ei-q-badge warn">chưa rõ ĐA</span>}
                      <div className="ei-q-actions">
                        <button type="button" className="ei-icon-btn" onClick={() => startEdit(idx)} title="Sửa câu">
                          <IcoEdit size={12}/>
                        </button>
                        <button type="button" className="ei-icon-btn danger" onClick={() => removeQuestion(idx)} title="Xóa câu">
                          <IcoTrash size={12}/>
                        </button>
                      </div>
                    </div>

                    {isEditing && editForm ? (
                      <div className="ei-edit">
                        <textarea rows={3} value={editForm.q}
                          onChange={(e) => setEditForm({ ...editForm, q: e.target.value })}
                          placeholder="Nội dung câu hỏi..."/>
                        {editForm.options.map((opt, i) => (
                          <div key={i} className="ei-edit-opt">
                            <input type="radio" name={`ei-c-${idx}`}
                              checked={editForm.correct === i}
                              onChange={() => setEditForm({ ...editForm, correct: i })}/>
                            <span className="ei-edit-opt-key">{String.fromCharCode(65 + i)}</span>
                            <input type="text" value={opt}
                              onChange={(e) => { const opts = [...editForm.options]; opts[i] = e.target.value; setEditForm({ ...editForm, options: opts }); }}
                              placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}/>
                          </div>
                        ))}
                        <div className="ei-edit-actions">
                          <button type="button" className="ei-btn-cancel" onClick={() => { setEditingIdx(null); setEditForm(null); }}>Hủy</button>
                          <button type="button" className="ei-btn-upload" onClick={saveEdit}><IcoCheck size={12}/> Lưu câu</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MathText as="p" className="ei-q-stem">{q.q}</MathText>
                        <div className="ei-q-opts">
                          {(q.options || []).map((opt, i) => (
                            <span key={i} className={'ei-q-opt' + (i === q.correct ? ' correct' : '')}>
                              <b>{String.fromCharCode(65 + i)}.</b> {opt}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <footer className="ei-foot">
            <button type="button" className="ei-btn-cancel" onClick={resetToIdle}>
              ← Chọn file khác
            </button>
            <div className="ei-foot-actions">
              {allowBank && onSaveToBank && (
                <button type="button" className="ei-foot-btn"
                  disabled={!!saving || selected.size === 0}
                  onClick={() => runSave('bank')}>
                  <IcoBook size={14}/>
                  {saving === 'bank' ? 'Đang lưu...' : `Lưu ${selected.size} câu vào Ngân hàng`}
                </button>
              )}
              {allowSoftExam && onCreateSoftExam && (
                <button type="button" className="ei-foot-btn primary"
                  disabled={!!saving || selected.size === 0}
                  onClick={() => runSave('soft')}>
                  <IcoCheck size={14}/>
                  {saving === 'soft' ? 'Đang tạo...' : `Tạo Đề mềm (${selected.size} câu)`}
                </button>
              )}
            </div>
          </footer>
        </>
      )}
    </div>
  );

  if (variant === 'page') return inner;
  return (
    <div className="ei-backdrop" onClick={handleCancel}>
      {inner}
    </div>
  );
}
