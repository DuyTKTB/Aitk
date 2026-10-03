import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconFileText, IconBulb, IconCamera, IconExam, IconShield, IconCopy, IconCheck, IconEye, IconEyeOff,
  IconStar, IconSave, IconClose, IconExternal, IconImage, IconAlert, IconCheckCircle, IconWarning,
  IconSparkle, IconInfo, IconTrash,
} from './AdminIcons.jsx';
import { InlineAlert, useDebounced, useToast } from './AdminUI.jsx';
import { DIFFICULTIES, EXAM_TYPES } from './adminConstants.js';
import {
  copyText, extractExamMeta, normalizeQuestions, parseLooseJson, summarizeProblems,
} from './adminUtils.js';
import {
  buildPrompt, DIFFICULTY_PLANS, estimateTokens, missingInput, splitCount, TEMPLATES,
} from './promptLibrary.js';

const TEMPLATE_ICONS = {
  fromText: IconFileText, fromTopic: IconBulb, fromImage: IconCamera, fullExam: IconExam, reviewJson: IconShield,
};

const COUNT_PRESETS = [5, 10, 15, 20, 30, 40];

const AI_TARGETS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', color: '#10a37f' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com', color: '#4285f4' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', color: '#c96442' },
  { id: 'grok', name: 'Grok', url: 'https://grok.com', color: '#1d9bf0' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', color: '#4d6bfe' },
];

const STORAGE_KEY = 'cs-pb-presets-v2';
const MAX_TEXT = 15000;

const clampCount = (v) => Math.max(1, Math.min(100, parseInt(v, 10) || 1));

export default function PromptBuilder({ grades = [], subjects = [], onReview }) {
  const toast = useToast();
  const rootRef = useRef(null);

  const [template, setTemplate] = useState('fromText');
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [extra, setExtra] = useState('');
  const [countText, setCountText] = useState('10');
  const [grade, setGrade] = useState('Lớp 11');
  const [subject, setSubject] = useState('Hóa học');
  const [difficulty, setDifficulty] = useState('medium');
  const [examType, setExamType] = useState('giua_ky');
  const [duration, setDuration] = useState(45);

  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [jsonInput, setJsonInput] = useState('');
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [namingPreset, setNamingPreset] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [image, setImage] = useState(null); // { name, url }

  const count = clampCount(countText);

  /* ---- đọc preset đã lưu ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) setPresets(list);
      }
    } catch { /* localStorage bị chặn hoặc dữ liệu hỏng → bỏ qua */ }
  }, []);

  /* ---- chỉ đặt mặc định khi giá trị hiện tại không còn trong danh sách (không ghi đè lựa chọn của người dùng) ---- */
  useEffect(() => {
    if (grades.length && !grades.some((g) => g.name === grade)) {
      setGrade((grades.find((g) => /11/.test(g.name)) || grades[0]).name);
    }
  }, [grades, grade]);
  useEffect(() => {
    if (subjects.length && !subjects.some((s) => s.name === subject)) {
      setSubject((subjects.find((s) => /hóa|hoá/i.test(s.name)) || subjects[0]).name);
    }
  }, [subjects, subject]);

  /* ---- ảnh xem trước: dọn object URL ---- */
  useEffect(() => () => { if (image?.url) URL.revokeObjectURL(image.url); }, [image]);

  const gradeId = grades.find((g) => g.name === grade)?.id;
  const subjectId = subjects.find((s) => s.name === subject)?.id;
  const opts = { text, topic, extra, count, grade, subject, difficulty, examType, duration, gradeId, subjectId };

  const prompt = useMemo(() => buildPrompt(template, opts), [template, text, topic, extra, count, grade, subject, difficulty, examType, duration, gradeId, subjectId]); // eslint-disable-line react-hooks/exhaustive-deps
  const missing = missingInput(template, opts);
  const tokens = estimateTokens(prompt);
  const plan = useMemo(() => splitCount(count, DIFFICULTY_PLANS[difficulty].mix), [count, difficulty]);

  /* ============ COPY / MỞ AI ============ */
  const doCopy = async () => {
    if (missing) { toast.error(missing); return false; }
    const ok = await copyText(prompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Không copy tự động được. Hãy bôi đen prompt ở khung xem trước và copy thủ công.');
    }
    return ok;
  };

  const openAI = async (target) => {
    if (!(await doCopy())) return;
    window.open(target.url, '_blank', 'noopener,noreferrer');
    toast.info(`Đã copy prompt. Dán vào ${target.name} (Ctrl+V) rồi gửi.`);
  };

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.target.closest('[data-pb-json]')) {
      e.preventDefault();
      doCopy();
    }
  };

  /* ============ PRESET ============ */
  const persist = (next) => {
    setPresets(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { toast.error('Trình duyệt không cho lưu preset (localStorage bị chặn).'); }
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return toast.error('Hãy đặt tên cho preset.');
    persist([...presets.filter((p) => p.name !== name), {
      name, template, count, grade, subject, difficulty, examType, duration, topic, extra,
    }].slice(-12));
    setPresetName('');
    setNamingPreset(false);
    toast.success('Đã lưu preset');
  };

  const applyPreset = (p) => {
    setTemplate(p.template); setCountText(String(p.count)); setGrade(p.grade); setSubject(p.subject);
    setDifficulty(p.difficulty); setExamType(p.examType || 'giua_ky'); setDuration(p.duration || 45);
    setTopic(p.topic || ''); setExtra(p.extra || '');
  };

  /* ============ ẢNH ============ */
  const takeImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Chỉ nhận file ảnh (JPG, PNG, WebP…).');
    if (file.size > 20 * 1024 * 1024) return toast.error('Ảnh quá lớn (tối đa 20 MB).');
    setImage({ name: file.name, url: URL.createObjectURL(file) });
  };

  /* ============ PHÂN TÍCH JSON TỪ AI ============ */
  const debouncedJson = useDebounced(jsonInput, 300);
  const analysis = useMemo(() => {
    if (!debouncedJson.trim()) return null;
    const parsed = parseLooseJson(debouncedJson);
    if (parsed.error) return { error: parsed.error };
    const { questions, warnings } = normalizeQuestions(parsed.data);
    if (questions.length === 0) return { error: warnings[0] || 'JSON không có câu hỏi nào.' };
    return {
      questions,
      warnings,
      meta: extractExamMeta(parsed.data),
      problems: summarizeProblems(questions),
      repaired: !!parsed.repaired,
    };
  }, [debouncedJson]);

  const goReview = () => {
    if (!analysis || analysis.error) return;
    onReview?.({ questions: analysis.questions, meta: analysis.meta, warnings: analysis.warnings });
  };

  const needsTopic = template === 'fromTopic' || template === 'fullExam';
  const needsText = template === 'fromText' || template === 'reviewJson';
  const isExam = template === 'fullExam';
  const isReview = template === 'reviewJson';

  return (
    <div className="adl-pb" ref={rootRef} onKeyDown={onKeyDown}>
      <header className="adl-pb-head">
        <div>
          <h2>Tạo câu hỏi bằng AI</h2>
          <p>Cấu hình → copy prompt → dán vào AI → dán JSON kết quả về đây → duyệt → lưu thành đề.</p>
        </div>
        <button type="button" className="adl-btn-outline" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? <IconEyeOff size={14} /> : <IconEye size={14} />} {showPreview ? 'Ẩn prompt' : 'Xem prompt'}
        </button>
      </header>

      <div className="adl-pb-layout">
        {/* ============ CỘT TRÁI ============ */}
        <div className="adl-pb-col">
          {presets.length > 0 && (
            <section className="adl-pb-card">
              <h3 className="adl-pb-title"><IconStar size={15} /> Preset đã lưu</h3>
              <div className="adl-pb-presets">
                {presets.map((p) => (
                  <div key={p.name} className="adl-pb-preset">
                    <button type="button" onClick={() => applyPreset(p)} title="Áp dụng preset">
                      <b>{p.name}</b>
                      <small>{p.grade} · {p.subject} · {p.count} câu</small>
                    </button>
                    <button type="button" className="x" onClick={() => persist(presets.filter((x) => x.name !== p.name))} aria-label={`Xóa preset ${p.name}`}>
                      <IconClose size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="adl-pb-card">
            <h3 className="adl-pb-title"><span className="adl-step">1</span> Chọn kiểu prompt</h3>
            <div className="adl-pb-templates" role="radiogroup" aria-label="Kiểu prompt">
              {TEMPLATES.map((t) => {
                const Icon = TEMPLATE_ICONS[t.id];
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={template === t.id}
                    className={'adl-pb-tpl' + (template === t.id ? ' on' : '')}
                    onClick={() => setTemplate(t.id)}
                  >
                    <span className="adl-pb-tpl-ico"><Icon size={18} /></span>
                    <span><b>{t.name}</b><small>{t.desc}</small></span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="adl-pb-card">
            <h3 className="adl-pb-title"><span className="adl-step">2</span> Cấu hình</h3>

            <div className="adl-form-row">
              <label className="adl-field">
                <span>Lớp</span>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  {grades.length
                    ? grades.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)
                    : ['Lớp 10', 'Lớp 11', 'Lớp 12'].map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>
              <label className="adl-field">
                <span>Môn</span>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {subjects.length
                    ? subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)
                    : ['Hóa học', 'Toán', 'Vật lí', 'Sinh học'].map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>
            </div>

            {!isReview && (
              <div className="adl-field">
                <span>Số câu hỏi</span>
                <div className="adl-chips">
                  {COUNT_PRESETS.map((n) => (
                    <button key={n} type="button" className={'adl-chip' + (count === n ? ' on' : '')} onClick={() => setCountText(String(n))}>{n} câu</button>
                  ))}
                  <input
                    type="number"
                    className="adl-count-input"
                    value={countText}
                    min={1}
                    max={100}
                    onChange={(e) => setCountText(e.target.value)}
                    onBlur={() => setCountText(String(count))}
                    aria-label="Số câu tùy chọn"
                  />
                </div>
                {count > 25 && (
                  <InlineAlert type="warn">AI thường giảm chất lượng khi sinh hơn 25 câu một lần. Nên chia 2–3 lượt (mỗi lượt tối đa 20 câu) rồi Import lần lượt.</InlineAlert>
                )}
              </div>
            )}

            {!isReview && (
              <div className="adl-field">
                <span>Mức độ tổng thể</span>
                <div className="adl-diff-btns">
                  {Object.entries(DIFFICULTY_PLANS).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      className={'adl-diff-btn' + (difficulty === k ? ' on' : '')}
                      style={{ '--diff-color': DIFFICULTIES.find((d) => d.id === k)?.color || 'var(--noble, #7a6ad8)' }}
                      onClick={() => setDifficulty(k)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <p className="adl-pb-plan">
                  Cơ cấu gửi cho AI: nhận biết <b>{plan[0]}</b> · thông hiểu <b>{plan[1]}</b> · vận dụng <b>{plan[2]}</b> · vận dụng cao <b>{plan[3]}</b>
                </p>
              </div>
            )}

            {isExam && (
              <div className="adl-form-row">
                <label className="adl-field">
                  <span>Loại đề</span>
                  <select value={examType} onChange={(e) => { setExamType(e.target.value); setDuration(EXAM_TYPES.find((t) => t.id === e.target.value)?.duration || 45); }}>
                    {EXAM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
                <label className="adl-field">
                  <span>Thời gian (phút)</span>
                  <input type="number" min={5} max={180} value={duration} onChange={(e) => setDuration(Math.max(5, Math.min(180, Number(e.target.value) || 45)))} />
                </label>
              </div>
            )}

            {needsTopic && (
              <label className="adl-field">
                <span>{isExam ? 'Phạm vi / chủ đề (tùy chọn)' : 'Chủ đề'}</span>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="VD: Sự điện li, pH; Phản ứng oxi hóa – khử…" />
              </label>
            )}

            {needsText && (
              <label className="adl-field">
                <span>{isReview ? 'JSON cần rà soát' : 'Nội dung bài học / đề thi'}</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={9}
                  spellCheck={false}
                  placeholder={isReview ? '{"questions": [ … ]}' : 'Dán nội dung bài học hoặc đề thi vào đây…'}
                />
                <small className={'adl-count-note' + (text.length > MAX_TEXT ? ' bad' : '')}>
                  {text.length.toLocaleString('vi-VN')} ký tự{text.length > MAX_TEXT ? ' — quá dài, AI có thể bỏ sót; nên chia theo từng bài.' : ''}
                </small>
              </label>
            )}

            {template === 'fromImage' && (
              <div
                className={'adl-dropzone adl-pb-drop' + (dragging ? ' on' : '')}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); takeImage(e.dataTransfer.files?.[0]); }}
              >
                {image ? (
                  <div className="adl-pb-img">
                    <img src={image.url} alt="Ảnh đề đã chọn" />
                    <div>
                      <b>{image.name}</b>
                      <small>Ảnh chỉ xem trước tại đây — bạn cần tự đính kèm ảnh vào khung chat của AI.</small>
                      <button type="button" className="adl-btn-sm" onClick={() => setImage(null)}><IconTrash size={12} /> Bỏ ảnh</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="adl-pb-drop-ico"><IconImage size={28} /></span>
                    <b>Kéo thả ảnh đề vào đây để xem trước</b>
                    <label className="adl-btn-outline adl-file-btn">
                      Chọn ảnh từ máy
                      <input type="file" accept="image/*" hidden onChange={(e) => { takeImage(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                  </>
                )}
                <ol className="adl-pb-drop-steps">
                  <li>Copy prompt ở bước 3</li>
                  <li>Mở AI, dán prompt và đính kèm ảnh</li>
                  <li>Dán JSON nhận được ở bước 4</li>
                </ol>
              </div>
            )}

            <label className="adl-field">
              <span>Yêu cầu bổ sung (tùy chọn)</span>
              <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={2} placeholder="VD: Ưu tiên bài tập tính pH; mỗi câu lý thuyết kèm một ví dụ thực tế…" />
            </label>
          </section>
        </div>

        {/* ============ CỘT PHẢI ============ */}
        <div className="adl-pb-col">
          {showPreview && (
            <section className="adl-pb-card adl-pb-preview-card">
              <h3 className="adl-pb-title">
                <span className="adl-step">3</span> Copy prompt
                <span className="adl-pb-stats">{prompt.length.toLocaleString('vi-VN')} ký tự · ~{tokens.toLocaleString('vi-VN')} token</span>
              </h3>

              {missing && <InlineAlert type="warn">{missing}</InlineAlert>}

              <pre className="adl-pb-preview" tabIndex={0}>{prompt}</pre>

              <div className="adl-pb-actions">
                <button type="button" className={'adl-btn-primary adl-pb-copy' + (copied ? ' copied' : '')} onClick={doCopy} disabled={!!missing}>
                  {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                  {copied ? 'Đã copy' : 'Copy prompt'}
                  <kbd>Ctrl ↵</kbd>
                </button>
                <button type="button" className="adl-btn-outline" onClick={() => setNamingPreset((v) => !v)}><IconSave size={14} /> Lưu preset</button>
              </div>

              {namingPreset && (
                <div className="adl-pb-name">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); savePreset(); } }}
                    placeholder="Tên preset, VD: Hóa 11 – 20 câu khó"
                    maxLength={40}
                    autoFocus
                  />
                  <button type="button" className="adl-btn-sm primary" onClick={savePreset}>Lưu</button>
                </div>
              )}

              <div className="adl-pb-open">
                <span>Copy rồi mở:</span>
                {AI_TARGETS.map((t) => (
                  <button key={t.id} type="button" className="adl-ai-btn" style={{ '--ai-color': t.color }} onClick={() => openAI(t)} disabled={!!missing} title={`Copy prompt và mở ${t.name}`}>
                    {t.name} <IconExternal size={12} />
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="adl-pb-card">
            <h3 className="adl-pb-title"><span className="adl-step">4</span> Dán JSON AI trả về</h3>

            <textarea
              data-pb-json
              className="adl-pb-json"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={9}
              spellCheck={false}
              placeholder='Dán cả khối ```json … ``` hoặc chỉ phần JSON — hệ thống tự làm sạch.'
              aria-label="JSON do AI trả về"
            />

            {!jsonInput.trim() ? (
              <p className="adl-hint"><IconInfo size={14} /><span>Có thể dán nguyên câu trả lời của AI, kể cả lời dẫn và dấu ```json — phần thừa sẽ được loại bỏ.</span></p>
            ) : !analysis ? (
              <p className="adl-hint"><span>Đang kiểm tra…</span></p>
            ) : analysis.error ? (
              <InlineAlert type="error"><b>Chưa đọc được JSON.</b> {analysis.error}</InlineAlert>
            ) : (
              <div className="adl-pb-result">
                <InlineAlert type={analysis.problems.length ? 'warn' : 'success'}>
                  <b>Đọc được {analysis.questions.length} câu hỏi.</b>{' '}
                  {analysis.problems.length
                    ? `${analysis.problems.length} câu cần chỉnh (thiếu đáp án đúng, đáp án trống…) — bạn sửa ở bước duyệt.`
                    : 'Tất cả đều hợp lệ.'}
                  {analysis.repaired && ' Đã tự sửa lỗi cú pháp nhỏ.'}
                  {analysis.meta.title && <> Đề: <i>{analysis.meta.title}</i>.</>}
                </InlineAlert>
                {analysis.warnings.length > 0 && (
                  <ul className="adl-pb-warnings">
                    {analysis.warnings.slice(0, 4).map((w) => <li key={w}><IconWarning size={13} /> {w}</li>)}
                  </ul>
                )}
                <button type="button" className="adl-btn-primary" onClick={goReview}>
                  <IconSparkle size={15} /> Duyệt {analysis.questions.length} câu và lưu
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
