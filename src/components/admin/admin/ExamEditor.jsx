import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  IconBack, IconPlus, IconTrash, IconEdit, IconSave, IconQuestion, IconCheck, IconWarning,
} from './AdminIcons.jsx';
import {
  EmptyState, ErrorState, InlineAlert, PageLoader, Spinner, useConfirm, useToast, useUnsavedWarning,
} from './AdminUI.jsx';
import { ANSWER_LABELS, DIFFICULTIES, EXAM_TYPES } from './adminConstants.js';
import { friendlyError, isTempId, newTempId } from './adminUtils.js';

const blankAnswers = () => ANSWER_LABELS.slice(0, 4).map((label, i) => ({
  id: newTempId(), label, content: '', is_correct: i === 0, sort_order: i, _new: true,
}));

/* Kiểm tra một câu trước khi lưu → mảng lỗi */
function validateQuestion(q) {
  const errs = [];
  if (!q.content?.trim()) errs.push('thiếu nội dung câu hỏi');
  if (q.answers.length < 2) errs.push('cần ít nhất 2 đáp án');
  if (q.answers.some((a) => !a.content?.trim())) errs.push('có đáp án bị bỏ trống');
  const correct = q.answers.filter((a) => a.is_correct).length;
  if (correct !== 1) errs.push(correct === 0 ? 'chưa chọn đáp án đúng' : 'có nhiều hơn 1 đáp án đúng');
  return errs;
}

export default function ExamEditor({ examId, onBack }) {
  const toast = useToast();
  const confirm = useConfirm();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [examDirty, setExamDirty] = useState(false);
  const [savingExam, setSavingExam] = useState(false);
  const [savingQ, setSavingQ] = useState(() => new Set());
  const [qErrors, setQErrors] = useState({});

  const dirtyQuestions = useMemo(() => questions.filter((q) => q._dirty), [questions]);
  const anyDirty = examDirty || dirtyQuestions.length > 0;
  useUnsavedWarning(anyDirty);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [examRes, qRes, gRes, sRes] = await Promise.all([
        supabase.from('exams').select('*').eq('id', examId).single(),
        supabase
          .from('questions')
          .select('*, answers:answers(id, label, content, is_correct, sort_order)')
          .eq('exam_id', examId)
          .order('question_number'),
        supabase.from('grades').select('*').order('sort_order'),
        supabase.from('subjects').select('*').order('sort_order'),
      ]);
      if (examRes.error) throw examRes.error;
      if (qRes.error) throw qRes.error;
      if (gRes.error) throw gRes.error;
      if (sRes.error) throw sRes.error;

      setExam(examRes.data);
      setQuestions(
        (qRes.data || []).map((q) => ({
          ...q,
          answers: [...(q.answers || [])].sort((a, b) => a.sort_order - b.sort_order),
          _removed: [],
        })),
      );
      setGrades(gRes.data || []);
      setSubjects(sRes.data || []);
      setExamDirty(false);
      setQErrors({});
    } catch (e) {
      console.error(e);
      setLoadError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  /* ============ THAO TÁC TRÊN STATE ============ */
  const patchExam = (patch) => { setExam((e) => ({ ...e, ...patch })); setExamDirty(true); };

  const patchQuestion = (id, fn) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...fn(q), _dirty: true } : q)));

  const setCorrect = (qid, aid) =>
    patchQuestion(qid, (q) => ({ ...q, answers: q.answers.map((a) => ({ ...a, is_correct: a.id === aid })) }));

  const updateAnswer = (qid, aid, content) =>
    patchQuestion(qid, (q) => ({ ...q, answers: q.answers.map((a) => (a.id === aid ? { ...a, content } : a)) }));

  const addAnswer = (qid) =>
    patchQuestion(qid, (q) => {
      if (q.answers.length >= ANSWER_LABELS.length) return q;
      return {
        ...q,
        answers: [...q.answers, {
          id: newTempId(), label: ANSWER_LABELS[q.answers.length], content: '',
          is_correct: false, sort_order: q.answers.length, _new: true,
        }],
      };
    });

  const removeAnswer = (qid, aid) =>
    patchQuestion(qid, (q) => {
      if (q.answers.length <= 2) return q;
      const target = q.answers.find((a) => a.id === aid);
      const rest = q.answers.filter((a) => a.id !== aid).map((a, i) => ({ ...a, label: ANSWER_LABELS[i], sort_order: i }));
      if (target?.is_correct && rest.length) rest[0] = { ...rest[0], is_correct: true };
      return {
        ...q,
        answers: rest,
        _removed: isTempId(aid) ? q._removed : [...q._removed, aid],
      };
    });

  const addQuestion = () => {
    const nextNumber = questions.reduce((m, q) => Math.max(m, q.question_number || 0), 0) + 1;
    setQuestions((qs) => [...qs, {
      id: newTempId(), exam_id: examId, question_number: nextNumber, content: '',
      explanation: '', difficulty: 'medium', question_type: 'single_choice',
      answers: blankAnswers(), _removed: [], _new: true, _dirty: true,
    }]);
    setTimeout(() => document.querySelector('.adl-qedit-item:last-child textarea')?.focus(), 60);
  };

  /* ============ LƯU ============ */
  const handleSaveExam = async () => {
    const title = exam.title?.trim();
    const duration = Number(exam.duration);
    if (!title) return toast.error('Tiêu đề đề thi không được để trống.');
    if (!Number.isInteger(duration) || duration < 1 || duration > 300) return toast.error('Thời gian làm bài phải từ 1 đến 300 phút.');
    if (!exam.grade_id || !exam.subject_id) return toast.error('Hãy chọn lớp và môn.');

    setSavingExam(true);
    try {
      const { error } = await supabase.from('exams').update({
        title,
        description: exam.description?.trim() || null,
        duration,
        difficulty: exam.difficulty,
        exam_type: exam.exam_type,
        grade_id: Number(exam.grade_id),
        subject_id: Number(exam.subject_id),
        source: exam.source?.trim() || null,
        is_published: !!exam.is_published,
        updated_at: new Date().toISOString(),
      }).eq('id', exam.id);
      if (error) throw error;
      setExam((e) => ({ ...e, title, duration }));
      setExamDirty(false);
      toast.success('Đã lưu thông tin đề');
    } catch (e) {
      toast.error('Không lưu được đề: ' + friendlyError(e));
    } finally {
      setSavingExam(false);
    }
  };

  /* Lưu một câu: question + answers (thêm / sửa / xóa). Trả về true nếu thành công */
  const saveQuestion = async (q, { silent = false } = {}) => {
    const errs = validateQuestion(q);
    if (errs.length) {
      setQErrors((m) => ({ ...m, [q.id]: errs }));
      if (!silent) toast.error(`Câu ${questions.findIndex((x) => x.id === q.id) + 1}: ${errs.join(', ')}.`);
      return false;
    }
    setQErrors((m) => { const n = { ...m }; delete n[q.id]; return n; });
    setSavingQ((s) => new Set(s).add(q.id));

    try {
      let qid = q.id;
      const fields = {
        content: q.content.trim(),
        explanation: q.explanation?.trim() || null,
        difficulty: q.difficulty || 'medium',
        question_type: q.question_type || 'single_choice',
      };

      if (q._new) {
        const { data, error } = await supabase
          .from('questions')
          .insert({ ...fields, exam_id: examId, question_number: q.question_number })
          .select('id')
          .single();
        if (error) throw error;
        qid = data.id;
      } else {
        const { error } = await supabase.from('questions').update(fields).eq('id', q.id);
        if (error) throw error;
      }

      if (q._removed?.length) {
        const { error } = await supabase.from('answers').delete().in('id', q._removed);
        if (error) throw error;
      }

      const toInsert = q.answers.filter((a) => a._new || isTempId(a.id));
      const toUpdate = q.answers.filter((a) => !a._new && !isTempId(a.id));

      let inserted = [];
      if (toInsert.length) {
        const { data, error } = await supabase
          .from('answers')
          .insert(toInsert.map((a) => ({
            question_id: qid, label: a.label, content: a.content.trim(), is_correct: a.is_correct, sort_order: a.sort_order,
          })))
          .select('id, sort_order');
        if (error) throw error;
        inserted = data || [];
      }

      const results = await Promise.all(toUpdate.map((a) => supabase.from('answers').update({
        label: a.label, content: a.content.trim(), is_correct: a.is_correct, sort_order: a.sort_order,
      }).eq('id', a.id)));
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;

      setQuestions((qs) => qs.map((x) => {
        if (x.id !== q.id) return x;
        const idBySort = new Map(inserted.map((r) => [r.sort_order, r.id]));
        return {
          ...x,
          id: qid,
          _new: false,
          _dirty: false,
          _removed: [],
          answers: x.answers.map((a) => (a._new || isTempId(a.id)
            ? { ...a, id: idBySort.get(a.sort_order) ?? a.id, _new: false }
            : a)),
        };
      }));
      if (!silent) toast.success('Đã lưu câu hỏi');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Không lưu được câu hỏi: ' + friendlyError(e));
      return false;
    } finally {
      setSavingQ((s) => { const n = new Set(s); n.delete(q.id); return n; });
    }
  };

  const saveAll = async () => {
    let ok = 0;
    for (const q of dirtyQuestions) {
      // eslint-disable-next-line no-await-in-loop
      if (await saveQuestion(q, { silent: true })) ok += 1;
    }
    if (examDirty) await handleSaveExam();
    const fail = dirtyQuestions.length - ok;
    if (fail === 0) toast.success(`Đã lưu ${ok} câu hỏi`);
    else toast.error(`${fail} câu chưa lưu được — xem thông báo đỏ ở từng câu.`);
  };

  const handleDeleteQuestion = async (q, idx) => {
    if (q._new) {
      setQuestions((qs) => qs.filter((x) => x.id !== q.id));
      return;
    }
    const ok = await confirm({
      title: `Xóa câu ${idx + 1}`,
      message: 'Câu hỏi và các đáp án sẽ bị xóa khỏi đề. Không thể hoàn tác.',
      confirmText: 'Xóa câu',
      danger: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from('questions').delete().eq('id', q.id);
      if (error) throw error;
      setQuestions((qs) => qs.filter((x) => x.id !== q.id));
      toast.success('Đã xóa câu hỏi');
    } catch (e) {
      toast.error('Không xóa được câu hỏi: ' + friendlyError(e));
    }
  };

  const handleBack = async () => {
    if (anyDirty) {
      const ok = await confirm({
        title: 'Có thay đổi chưa lưu',
        message: 'Rời khỏi trang sẽ mất các chỉnh sửa chưa lưu.',
        confirmText: 'Rời đi',
        cancelText: 'Ở lại',
        danger: true,
      });
      if (!ok) return;
    }
    onBack();
  };

  /* ============ RENDER ============ */
  if (loading) return <PageLoader text="Đang tải đề…" />;
  if (loadError) {
    return (
      <div>
        <button type="button" className="adl-btn-outline" onClick={onBack}><IconBack size={14} /> Quay lại danh sách</button>
        <ErrorState message={loadError} onRetry={load} />
      </div>
    );
  }
  if (!exam) return <EmptyState Icon={IconQuestion} title="Không tìm thấy đề" action={<button type="button" className="adl-btn-outline" onClick={onBack}>Quay lại</button>} />;

  return (
    <div className="adl-editor">
      <div className="adl-editor-bar">
        <button type="button" className="adl-btn-outline" onClick={handleBack}><IconBack size={14} /> Danh sách đề</button>
        <div className="adl-editor-bar-right">
          {anyDirty && <span className="adl-dirty"><IconWarning size={14} /> Có thay đổi chưa lưu</span>}
          <button type="button" className="adl-btn-primary" onClick={saveAll} disabled={!anyDirty || savingExam || savingQ.size > 0}>
            {savingExam || savingQ.size > 0 ? <Spinner size={14} /> : <IconSave size={14} />} Lưu tất cả
          </button>
        </div>
      </div>

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3><IconEdit size={16} /><span>Thông tin đề</span></h3>
          <button type="button" className="adl-btn-sm primary" onClick={handleSaveExam} disabled={!examDirty || savingExam}>
            {savingExam ? <Spinner size={13} /> : <IconSave size={13} />} Lưu thông tin
          </button>
        </header>

        <div className="adl-form">
          <label className="adl-field">
            <span>Tiêu đề</span>
            <input type="text" value={exam.title || ''} onChange={(e) => patchExam({ title: e.target.value })} maxLength={200} />
          </label>
          <label className="adl-field">
            <span>Mô tả</span>
            <textarea value={exam.description || ''} onChange={(e) => patchExam({ description: e.target.value })} rows={2} />
          </label>

          <div className="adl-form-row">
            <label className="adl-field">
              <span>Lớp</span>
              <select value={exam.grade_id ?? ''} onChange={(e) => patchExam({ grade_id: Number(e.target.value) })}>
                {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label className="adl-field">
              <span>Môn</span>
              <select value={exam.subject_id ?? ''} onChange={(e) => patchExam({ subject_id: Number(e.target.value) })}>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="adl-field">
              <span>Loại đề</span>
              <select value={exam.exam_type || ''} onChange={(e) => patchExam({ exam_type: e.target.value })}>
                {EXAM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="adl-field">
              <span>Độ khó</span>
              <select value={exam.difficulty || 'medium'} onChange={(e) => patchExam({ difficulty: e.target.value })}>
                {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="adl-field">
              <span>Thời gian (phút)</span>
              <input type="number" value={exam.duration ?? ''} onChange={(e) => patchExam({ duration: e.target.value })} min={1} max={300} />
            </label>
          </div>

          <label className="adl-field">
            <span>Nguồn đề</span>
            <input type="text" value={exam.source || ''} onChange={(e) => patchExam({ source: e.target.value })} placeholder="VD: Sở GD&ĐT, trường THPT…" />
          </label>

          <label className="adl-checkbox">
            <input type="checkbox" checked={!!exam.is_published} onChange={(e) => patchExam({ is_published: e.target.checked })} />
            <span>Hiển thị cho học sinh</span>
          </label>
          {exam.is_published && questions.length === 0 && (
            <InlineAlert type="warn">Đề đang hiện nhưng chưa có câu hỏi nào. Hãy thêm câu hỏi bên dưới.</InlineAlert>
          )}
        </div>
      </section>

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3><IconQuestion size={16} /><span>Câu hỏi ({questions.length})</span></h3>
          <button type="button" className="adl-btn-sm primary" onClick={addQuestion}><IconPlus size={13} /> Thêm câu hỏi</button>
        </header>

        {questions.length === 0 ? (
          <EmptyState Icon={IconQuestion} title="Đề chưa có câu hỏi" action={<button type="button" className="adl-btn-primary" onClick={addQuestion}><IconPlus size={14} /> Thêm câu đầu tiên</button>}>
            Thêm thủ công tại đây, hoặc quay lại tab Tạo đề để import/AI sinh câu hỏi.
          </EmptyState>
        ) : (
          <ul className="adl-qedit-list">
            {questions.map((q, qIdx) => {
              const saving = savingQ.has(q.id);
              const errs = qErrors[q.id];
              return (
                <li key={q.id} className={'adl-qedit-item' + (q._dirty ? ' dirty' : '') + (errs ? ' invalid' : '')}>
                  <div className="adl-qedit-head">
                    <b>Câu {qIdx + 1}{q._new && <em className="adl-tag">Mới</em>}{q._dirty && !q._new && <em className="adl-tag warn">Chưa lưu</em>}</b>
                    <div className="adl-qedit-actions">
                      <button type="button" className="adl-btn-sm" onClick={() => saveQuestion(q)} disabled={saving || !q._dirty}>
                        {saving ? <Spinner size={13} /> : <IconSave size={13} />} Lưu
                      </button>
                      <button type="button" className="adl-icon-btn-sm danger" onClick={() => handleDeleteQuestion(q, qIdx)} title="Xóa câu" aria-label={`Xóa câu ${qIdx + 1}`}>
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {errs && <InlineAlert type="error">Chưa lưu được: {errs.join(', ')}.</InlineAlert>}

                  <label className="adl-field">
                    <span>Nội dung câu hỏi</span>
                    <textarea value={q.content || ''} onChange={(e) => patchQuestion(q.id, (x) => ({ ...x, content: e.target.value }))} rows={2} />
                  </label>

                  <fieldset className="adl-qedit-opts">
                    <legend>Đáp án — chọn nút tròn ở đáp án đúng</legend>
                    {q.answers.map((a) => (
                      <div key={a.id} className={'adl-qedit-opt' + (a.is_correct ? ' correct' : '')}>
                        <input type="radio" name={`correct-${q.id}`} checked={!!a.is_correct} onChange={() => setCorrect(q.id, a.id)} aria-label={`Đáp án ${a.label} là đáp án đúng`} />
                        <b>{a.label}</b>
                        <input type="text" value={a.content || ''} onChange={(e) => updateAnswer(q.id, a.id, e.target.value)} aria-label={`Nội dung đáp án ${a.label}`} />
                        <button type="button" className="adl-icon-btn-sm" onClick={() => removeAnswer(q.id, a.id)} disabled={q.answers.length <= 2} title="Xóa đáp án" aria-label={`Xóa đáp án ${a.label}`}>
                          <IconTrash size={13} />
                        </button>
                      </div>
                    ))}
                    {q.answers.length < ANSWER_LABELS.length && (
                      <button type="button" className="adl-btn-sm" onClick={() => addAnswer(q.id)}><IconPlus size={12} /> Thêm đáp án</button>
                    )}
                  </fieldset>

                  <label className="adl-field">
                    <span>Lời giải</span>
                    <textarea value={q.explanation || ''} onChange={(e) => patchQuestion(q.id, (x) => ({ ...x, explanation: e.target.value }))} rows={2} />
                  </label>

                  <div className="adl-qedit-meta">
                    <label className="adl-field adl-field-inline">
                      <span>Độ khó</span>
                      <select value={q.difficulty || 'medium'} onChange={(e) => patchQuestion(q.id, (x) => ({ ...x, difficulty: e.target.value }))}>
                        {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </label>
                    {!errs && !q._dirty && <span className="adl-ok-text"><IconCheck size={14} /> Đã lưu</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
