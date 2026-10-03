import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconBolt, IconBook, IconClock, IconTarget, IconCheck, IconUpload, IconFileText, IconCopy,
  IconTrash, IconSparkle, IconPlus, IconEdit, IconInfo, IconAlert,
} from './AdminIcons.jsx';
import { InlineAlert, Spinner, useDebounced, useToast } from './AdminUI.jsx';
import { DIFFICULTIES, EXAM_TYPES } from './adminConstants.js';
import {
  extractExamMeta, friendlyError, normalizeQuestions, parseLooseJson, resolveByName, summarizeProblems,
} from './adminUtils.js';
import { createExamWithQuestions } from './examService.js';
import PromptBuilder from './PromptBuilder.jsx';
import QuestionReview from './QuestionReview.jsx';

const TEMPLATES = [
  { id: 'quick', name: 'Đề nhanh', Icon: IconBolt, desc: '45 phút · Trung bình', data: { duration: 45, difficulty: 'medium', exam_type: 'giua_ky' } },
  { id: 'full', name: 'Đề đầy đủ', Icon: IconBook, desc: '90 phút · Trung bình', data: { duration: 90, difficulty: 'medium', exam_type: 'thpt' } },
  { id: 'mini', name: 'Kiểm tra 15 phút', Icon: IconClock, desc: '15 phút · Dễ', data: { duration: 15, difficulty: 'easy', exam_type: 'khao_sat' } },
  { id: 'practice', name: 'Luyện tập', Icon: IconTarget, desc: '60 phút · Khó', data: { duration: 60, difficulty: 'hard', exam_type: 'chuyen_de' } },
];

const SAMPLE_JSON = `{
  "title": "Đề thi thử giữa kỳ 1 - Hóa học 11",
  "description": "Đề minh họa",
  "exam_type": "giua_ky",
  "duration": 45,
  "difficulty": "medium",
  "questions": [
    {
      "content": "Dung dịch nào sau đây có pH > 7?",
      "options": [
        { "label": "A", "content": "NaCl" },
        { "label": "B", "content": "NaOH" },
        { "label": "C", "content": "HCl" },
        { "label": "D", "content": "H₂SO₄" }
      ],
      "correctAnswer": "B",
      "explanation": "NaOH là bazơ mạnh nên dung dịch có pH > 7.",
      "difficulty": "easy"
    }
  ]
}`;

const TABS = [
  { id: 'ai', name: 'Tạo với AI', Icon: IconSparkle },
  { id: 'import', name: 'Import JSON', Icon: IconUpload },
  { id: 'manual', name: 'Tạo thủ công', Icon: IconEdit },
];

/* Trung tâm tạo đề: 3 cách, cùng đi qua màn hình duyệt trước khi lưu */
export default function CreateExam({ grades, subjects, onDone }) {
  const toast = useToast();
  const [tab, setTab] = useState('ai');
  const [review, setReview] = useState(null); // { questions, meta, source }
  const [saving, setSaving] = useState(false);

  const handleSave = async (meta, questions) => {
    setSaving(true);
    try {
      const exam = await createExamWithQuestions({ ...meta, source: meta.source || 'AI Generated' }, questions);
      toast.success(`Đã tạo đề "${exam.title}" với ${questions.length} câu`);
      setReview(null);
      onDone(exam.id);
    } catch (e) {
      console.error(e);
      toast.error('Không lưu được đề: ' + friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  if (review) {
    return (
      <QuestionReview
        questions={review.questions}
        meta={review.meta}
        grades={grades}
        subjects={subjects}
        saving={saving}
        onSave={handleSave}
        onBack={() => setReview(null)}
      />
    );
  }

  return (
    <div className="adl-create">
      <nav className="adl-tabs" role="tablist" aria-label="Cách tạo đề">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={'adl-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
            <t.Icon size={15} /> {t.name}
          </button>
        ))}
      </nav>

      {tab === 'ai' && <PromptBuilder grades={grades} subjects={subjects} onReview={(r) => setReview(r)} />}
      {tab === 'import' && <ImportJson onReview={(r) => setReview(r)} />}
      {tab === 'manual' && <ManualCreate grades={grades} subjects={subjects} onDone={onDone} />}
    </div>
  );
}

/* ============================================================
   IMPORT JSON
   ============================================================ */
function ImportJson({ onReview }) {
  const toast = useToast();
  const [json, setJson] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const debounced = useDebounced(json, 300);

  const analysis = useMemo(() => {
    if (!debounced.trim()) return null;
    const parsed = parseLooseJson(debounced);
    if (parsed.error) return { error: parsed.error };
    const { questions, warnings } = normalizeQuestions(parsed.data);
    if (!questions.length) return { error: warnings[0] || 'JSON không có câu hỏi nào.' };
    return { questions, warnings, meta: extractExamMeta(parsed.data), problems: summarizeProblems(questions), repaired: !!parsed.repaired };
  }, [debounced]);

  const readFile = async (file) => {
    if (!file) return;
    if (!/\.json$|\.txt$/i.test(file.name) && file.type !== 'application/json') return toast.error('Chỉ nhận file .json hoặc .txt');
    if (file.size > 10 * 1024 * 1024) return toast.error('File quá lớn (tối đa 10 MB).');
    try {
      setJson(await file.text());
    } catch (e) {
      toast.error('Không đọc được file: ' + e.message);
    }
  };

  return (
    <section className="adl-panel adl-import">
      <header className="adl-panel-head">
        <h3><IconUpload size={16} /><span>Import đề từ JSON</span></h3>
        <div className="adl-list-actions">
          <button type="button" className="adl-btn-sm" onClick={() => setJson(SAMPLE_JSON)}><IconFileText size={13} /> Dùng mẫu</button>
          <button type="button" className="adl-btn-sm" onClick={() => fileRef.current?.click()}><IconUpload size={13} /> Chọn file</button>
          {json && <button type="button" className="adl-btn-sm danger" onClick={() => setJson('')}><IconTrash size={13} /> Xóa</button>}
          <input ref={fileRef} type="file" accept=".json,.txt,application/json" hidden onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </header>

      <div
        className={'adl-dropzone' + (dragging ? ' on' : '')}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files?.[0]); }}
      >
        <textarea className="adl-import-textarea" value={json} onChange={(e) => setJson(e.target.value)} rows={16} spellCheck={false} placeholder="Dán JSON vào đây hoặc kéo thả file .json vào khung này…" aria-label="Nội dung JSON" />
        {dragging && <div className="adl-dropzone-overlay"><span>Thả file để đọc</span></div>}
      </div>

      {!json.trim() ? (
        <p className="adl-hint"><IconInfo size={14} /><span>Chấp nhận JSON dạng <code>{'{"questions":[…]}'}</code> hoặc một mảng câu hỏi. Dán cả câu trả lời của AI cũng được.</span></p>
      ) : !analysis ? null : analysis.error ? (
        <InlineAlert type="error"><b>Chưa đọc được JSON.</b> {analysis.error}</InlineAlert>
      ) : (
        <div className="adl-pb-result">
          <InlineAlert type={analysis.problems.length ? 'warn' : 'success'}>
            <b>Đọc được {analysis.questions.length} câu hỏi.</b>{' '}
            {analysis.problems.length ? `${analysis.problems.length} câu cần chỉnh ở bước duyệt.` : 'Tất cả hợp lệ.'}
            {analysis.repaired && ' Đã tự sửa lỗi cú pháp nhỏ.'}
          </InlineAlert>
          {analysis.warnings.slice(0, 4).map((w) => <p key={w} className="adl-warn-text">{w}</p>)}
          <button type="button" className="adl-btn-primary" onClick={() => onReview({ questions: analysis.questions, meta: analysis.meta, warnings: analysis.warnings })}>
            <IconSparkle size={15} /> Duyệt {analysis.questions.length} câu và lưu
          </button>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   TẠO THỦ CÔNG — tạo đề trống rồi sang trình sửa để thêm câu
   ============================================================ */
function ManualCreate({ grades, subjects, onDone }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [tpl, setTpl] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', grade_id: grades[0]?.id || '', subject_id: subjects[0]?.id || '',
    exam_type: 'giua_ky', duration: 45, difficulty: 'medium', source: '', is_published: false,
  });

  useEffect(() => {
    setForm((f) => ({ ...f, grade_id: f.grade_id || grades[0]?.id || '', subject_id: f.subject_id || subjects[0]?.id || '' }));
  }, [grades, subjects]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const dur = Number(form.duration);
    if (!form.title.trim()) return setErr('Vui lòng nhập tiêu đề đề thi.');
    if (!form.grade_id || !form.subject_id) return setErr('Hãy chọn lớp và môn (nếu danh sách trống, thêm dữ liệu vào bảng grades/subjects).');
    if (!Number.isInteger(dur) || dur < 1 || dur > 300) return setErr('Thời gian làm bài phải từ 1 đến 300 phút.');
    setSaving(true);
    setErr(null);
    try {
      const { supabase } = await import('../../lib/supabase.js');
      const { data, error } = await supabase.from('exams').insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        grade_id: Number(form.grade_id),
        subject_id: Number(form.subject_id),
        exam_type: form.exam_type,
        duration: dur,
        difficulty: form.difficulty,
        source: form.source.trim() || null,
        is_published: form.is_published,
      }).select('id').single();
      if (error) throw error;
      toast.success('Đã tạo đề. Hãy thêm câu hỏi.');
      onDone(data.id);
    } catch (e2) {
      setErr(friendlyError(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adl-manual">
      <section className="adl-panel">
        <header className="adl-panel-head"><h3><IconBolt size={16} /><span>Mẫu cấu hình nhanh</span></h3></header>
        <div className="adl-tpl-grid">
          {TEMPLATES.map((t) => (
            <button key={t.id} type="button" className={'adl-tpl-card' + (tpl === t.id ? ' on' : '')} onClick={() => { setTpl(t.id); setForm((f) => ({ ...f, ...t.data })); }}>
              <span className="adl-tpl-icon"><t.Icon size={20} /></span>
              <b>{t.name}</b>
              <small>{t.desc}</small>
              {tpl === t.id && <span className="adl-tpl-check"><IconCheck size={14} /></span>}
            </button>
          ))}
        </div>
      </section>

      <form className="adl-panel adl-form" onSubmit={submit} noValidate>
        <header className="adl-panel-head"><h3><IconEdit size={16} /><span>Thông tin đề thi</span></h3></header>

        <label className="adl-field">
          <span>Tiêu đề *</span>
          <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="VD: Đề thi giữa kỳ 1 - Hóa học 11" maxLength={200} />
        </label>
        <label className="adl-field">
          <span>Mô tả ngắn</span>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Phạm vi kiến thức, lưu ý khi làm bài…" />
        </label>

        <div className="adl-form-row">
          <label className="adl-field">
            <span>Lớp *</span>
            <select value={form.grade_id} onChange={(e) => set('grade_id', e.target.value)}>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="adl-field">
            <span>Môn *</span>
            <select value={form.subject_id} onChange={(e) => set('subject_id', e.target.value)}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="adl-field">
            <span>Loại đề</span>
            <select value={form.exam_type} onChange={(e) => set('exam_type', e.target.value)}>
              {EXAM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="adl-field">
            <span>Thời gian (phút)</span>
            <input type="number" min={1} max={300} value={form.duration} onChange={(e) => set('duration', e.target.value)} />
          </label>
        </div>

        <div className="adl-field">
          <span>Độ khó</span>
          <div className="adl-diff-btns">
            {DIFFICULTIES.map((d) => (
              <button key={d.id} type="button" className={'adl-diff-btn' + (form.difficulty === d.id ? ' on' : '')} style={{ '--diff-color': d.color }} onClick={() => set('difficulty', d.id)}>{d.name}</button>
            ))}
          </div>
        </div>

        <label className="adl-field">
          <span>Nguồn đề</span>
          <input type="text" value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="VD: Sở GD&ĐT, trường THPT…" />
        </label>

        <label className="adl-checkbox">
          <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
          <span>Hiển thị cho học sinh ngay (nên để ẩn cho tới khi thêm đủ câu hỏi)</span>
        </label>

        {err && <InlineAlert type="error">{err}</InlineAlert>}

        <div className="adl-form-actions">
          <button type="submit" className="adl-btn-primary" disabled={saving}>
            {saving ? <Spinner size={14} /> : <IconPlus size={14} />} Tạo đề và thêm câu hỏi
          </button>
        </div>
      </form>
    </div>
  );
}
