/* ============================================================
   ExamEditor.jsx — Sửa đề thi (Vitality)
   ------------------------------------------------------------
   Logic giữ nguyên từ bản cũ, chỉ đổi:
     • Bọc trong AdminShell
     • Đổi class .adl-* → .vt-* cho giao diện đồng bộ
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import AdminShell, { Topbar, ConfirmDialog } from './AdminShell.jsx';
import {
  IconBack, IconPlus, IconTrash, IconEdit, IconSave, IconQuestion, IconCheck, IconWarning,
} from './AdminIcons.jsx';
import { ANSWER_LABELS, DIFFICULTIES, EXAM_TYPES } from './adminConstants.js';
import { friendlyError, isTempId, newTempId } from './adminUtils.js';
import { topicGroups, gradeNumber } from '../../data/chemTopics.js';

/* <option> chuyên đề nhóm theo lớp */
function TopicOptions({ preferGrade }) {
  return topicGroups(preferGrade).map((g) => (
    <optgroup key={g.grade} label={g.label}>
      {g.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </optgroup>
  ));
}

const blankAnswers = () => ANSWER_LABELS.slice(0, 4).map((label, i) => ({
  id: newTempId(), label, content: '', is_correct: i === 0, sort_order: i, _new: true,
}));

function validateQuestion(q) {
  const errs = [];
  if (!q.content?.trim()) errs.push('thiếu nội dung câu hỏi');
  if (q.answers.length < 2) errs.push('cần ít nhất 2 đáp án');
  if (q.answers.some((a) => !a.content?.trim())) errs.push('có đáp án bị bỏ trống');
  const correct = q.answers.filter((a) => a.is_correct).length;
  if (correct !== 1) errs.push(correct === 0 ? 'chưa chọn đáp án đúng' : 'có nhiều hơn 1 đáp án đúng');
  return errs;
}

/* ============================================================
   WRAPPER — xử lý loading / error / empty
   ============================================================ */
export default function ExamEditor({ examId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  if (loading || loadError) {
    return (
      <AdminShell active="exams" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <Topbar
          title="Sửa đề"
          subtitle={loadError ? 'Không tải được' : 'Đang tải…'}
        />
        {loadError ? (
          <div className="vt-empty">
            <span><IconQuestion size={30} /></span>
            <h3>Không tải được đề</h3>
            <p>{loadError}</p>
            <button type="button" className="vt-btn primary" onClick={onBack}>
              <IconBack size={14} /> Quay lại danh sách
            </button>
          </div>
        ) : (
          <div className="vt-loading">
            <div className="page-loader-spinner" />
            <p>Đang tải đề…</p>
          </div>
        )}
      </AdminShell>
    );
  }

  return (
    <ExamEditorInner
      examId={examId}
      onBack={onBack}
      onLoadingChange={setLoading}
      onError={setLoadError}
    />
  );
}

/* ============================================================
   INNER — logic chính
   ============================================================ */
function ExamEditorInner({ examId, onBack, onLoadingChange, onError }) {
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examDirty, setExamDirty] = useState(false);
  const [savingExam, setSavingExam] = useState(false);
  const [savingQ, setSavingQ] = useState(() => new Set());
  const [qErrors, setQErrors] = useState({});
  const [bulkTopic, setBulkTopic] = useState('');

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const say = useCallback((t) => {
    setToast(t);
    setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 2400);
  }, []);

  const dirtyQuestions = useMemo(() => questions.filter((q) => q._dirty), [questions]);
  const unclassifiedCount = useMemo(() => questions.filter((q) => !q.topic_id).length, [questions]);
  const anyDirty = examDirty || dirtyQuestions.length > 0;

  /* Cảnh báo rời trang */
  useEffect(() => {
    if (!anyDirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [anyDirty]);

  const load = useCallback(async () => {
    onLoadingChange?.(true);
    onError?.(null);
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
      onError?.(friendlyError(e));
    } finally {
      onLoadingChange?.(false);
    }
  }, [examId, onLoadingChange, onError]);

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
      explanation: '', difficulty: 'medium', question_type: 'single_choice', topic_id: null,
      answers: blankAnswers(), _removed: [], _new: true, _dirty: true,
    }]);
  };

  const applyTopicToUnclassified = () => {
    if (!bulkTopic || unclassifiedCount === 0) return;
    setQuestions((qs) => qs.map((q) => (q.topic_id ? q : { ...q, topic_id: bulkTopic, _dirty: true })));
    say(`Đã gán chuyên đề cho ${unclassifiedCount} câu — bấm "Lưu tất cả" để ghi.`);
  };

  /* ============ LƯU ============ */
  const handleSaveExam = async () => {
    const title = exam.title?.trim();
    const duration = Number(exam.duration);
    if (!title) { say('Tiêu đề đề thi không được để trống.'); return; }
    if (!Number.isInteger(duration) || duration < 1 || duration > 300) { say('Thời gian làm bài phải từ 1 đến 300 phút.'); return; }
    if (!exam.grade_id || !exam.subject_id) { say('Hãy chọn lớp và môn.'); return; }

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
      say('Đã lưu thông tin đề');
    } catch (e) {
      say('Không lưu được đề: ' + friendlyError(e));
    } finally {
      setSavingExam(false);
    }
  };

  const saveQuestion = async (q, { silent = false } = {}) => {
    const errs = validateQuestion(q);
    if (errs.length) {
      setQErrors((m) => ({ ...m, [q.id]: errs }));
      if (!silent) say(`Câu ${questions.findIndex((x) => x.id === q.id) + 1}: ${errs.join(', ')}.`);
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
        topic_id: q.topic_id || null,
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
      if (!silent) say('Đã lưu câu hỏi');
      return true;
    } catch (e) {
      console.error(e);
      say('Không lưu được câu hỏi: ' + friendlyError(e));
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
    if (fail === 0) say(`Đã lưu ${ok} câu hỏi`);
    else say(`${fail} câu chưa lưu được — xem thông báo đỏ ở từng câu.`);
  };

  const handleDeleteQuestion = (q, idx) => {
    if (q._new) {
      setQuestions((qs) => qs.filter((x) => x.id !== q.id));
      return;
    }
    setConfirm({
      title: `Xóa câu ${idx + 1}`,
      body: 'Câu hỏi và các đáp án sẽ bị xóa khỏi đề. Không thể hoàn tác.',
      okLabel: 'Xóa câu',
      danger: true,
      onOk: async () => {
        try {
          const { error } = await supabase.from('questions').delete().eq('id', q.id);
          if (error) throw error;
          setQuestions((qs) => qs.filter((x) => x.id !== q.id));
          say('Đã xóa câu hỏi');
        } catch (e) {
          say('Không xóa được câu hỏi: ' + friendlyError(e));
        }
      },
    });
  };

  const handleBack = () => {
    if (anyDirty) {
      setConfirm({
        title: 'Có thay đổi chưa lưu',
        body: 'Rời khỏi trang sẽ mất các chỉnh sửa chưa lưu.',
        okLabel: 'Rời đi',
        cancelLabel: 'Ở lại',
        danger: true,
        onOk: onBack,
      });
      return;
    }
    onBack();
  };

  if (!exam) {
    return (
      <AdminShell active="exams" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <Topbar title="Sửa đề" subtitle="Không tìm thấy đề" />
        <div className="vt-empty">
          <span><IconQuestion size={30} /></span>
          <h3>Không tìm thấy đề</h3>
          <p>Đề có thể đã bị xóa hoặc ID không đúng.</p>
          <button type="button" className="vt-btn primary" onClick={onBack}>
            <IconBack size={14} /> Quay lại danh sách
          </button>
        </div>
      </AdminShell>
    );
  }

  const examGrade = gradeNumber(grades.find((g) => g.id === exam.grade_id)?.name);

  return (
    <AdminShell active="exams" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Sửa đề"
        subtitle={exam.title}
        right={
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            {anyDirty && (
              <span style={{
                padding: '.3rem .7rem',
                background: 'color-mix(in srgb, var(--vt-amber) 20%, transparent)',
                borderRadius: 999,
                font: '700 .72rem var(--sans)',
                color: '#a16207',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.3rem',
              }}>
                <IconWarning size={12} /> Có thay đổi chưa lưu
              </span>
            )}
            <button
              type="button"
              className="vt-btn primary"
              onClick={saveAll}
              disabled={!anyDirty || savingExam || savingQ.size > 0}
            >
              <IconSave size={14} /> {savingExam || savingQ.size > 0 ? 'Đang lưu…' : 'Lưu tất cả'}
            </button>
          </div>
        }
      />

      {/* ===== NÚT QUAY LẠI ===== */}
      <button
        type="button"
        className="vt-btn sm"
        onClick={handleBack}
        style={{ alignSelf: 'flex-start' }}
      >
        <IconBack size={14} /> Danh sách đề
      </button>

      {/* ===== THÔNG TIN ĐỀ ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconEdit size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            Thông tin đề
          </h3>
          <button
            type="button"
            className="vt-btn sm primary"
            onClick={handleSaveExam}
            disabled={!examDirty || savingExam}
          >
            <IconSave size={13} /> {savingExam ? 'Đang lưu…' : 'Lưu thông tin'}
          </button>
        </header>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <label className="vt-field">
            <span>Tiêu đề</span>
            <input
              type="text"
              value={exam.title || ''}
              onChange={(e) => patchExam({ title: e.target.value })}
              maxLength={200}
            />
          </label>

          <label className="vt-field">
            <span>Mô tả</span>
            <textarea
              value={exam.description || ''}
              onChange={(e) => patchExam({ description: e.target.value })}
              rows={2}
              style={{ padding: '.7rem .9rem', borderRadius: 14, minHeight: 'auto' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '.7rem' }}>
            <label className="vt-field">
              <span>Lớp</span>
              <select
                value={exam.grade_id ?? ''}
                onChange={(e) => patchExam({ grade_id: Number(e.target.value) })}
                style={{ height: 42, padding: '0 .8rem', borderRadius: 12, border: '1px solid var(--soft)', background: 'var(--vt-tint2)', color: 'var(--ink)' }}
              >
                {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label className="vt-field">
              <span>Môn</span>
              <select
                value={exam.subject_id ?? ''}
                onChange={(e) => patchExam({ subject_id: Number(e.target.value) })}
                style={{ height: 42, padding: '0 .8rem', borderRadius: 12, border: '1px solid var(--soft)', background: 'var(--vt-tint2)', color: 'var(--ink)' }}
              >
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="vt-field">
              <span>Loại đề</span>
              <select
                value={exam.exam_type || ''}
                onChange={(e) => patchExam({ exam_type: e.target.value })}
                style={{ height: 42, padding: '0 .8rem', borderRadius: 12, border: '1px solid var(--soft)', background: 'var(--vt-tint2)', color: 'var(--ink)' }}
              >
                {EXAM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="vt-field">
              <span>Độ khó</span>
              <select
                value={exam.difficulty || 'medium'}
                onChange={(e) => patchExam({ difficulty: e.target.value })}
                style={{ height: 42, padding: '0 .8rem', borderRadius: 12, border: '1px solid var(--soft)', background: 'var(--vt-tint2)', color: 'var(--ink)' }}
              >
                {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="vt-field">
              <span>Thời gian (phút)</span>
              <input
                type="number"
                value={exam.duration ?? ''}
                onChange={(e) => patchExam({ duration: e.target.value })}
                min={1}
                max={300}
              />
            </label>
          </div>

          <label className="vt-field">
            <span>Nguồn đề</span>
            <input
              type="text"
              value={exam.source || ''}
              onChange={(e) => patchExam({ source: e.target.value })}
              placeholder="VD: Sở GD&ĐT, trường THPT…"
            />
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '.6rem',
            padding: '.6rem .8rem',
            background: exam.is_published ? 'color-mix(in srgb, var(--acc) 8%, var(--vt-tint))' : 'var(--vt-tint)',
            borderRadius: 12,
            cursor: 'pointer',
            font: '600 .88rem var(--sans)',
          }}>
            <input
              type="checkbox"
              checked={!!exam.is_published}
              onChange={(e) => patchExam({ is_published: e.target.checked })}
              style={{ accentColor: 'var(--acc)', width: 18, height: 18 }}
            />
            <span>Hiển thị cho học sinh</span>
          </label>

          {exam.is_published && questions.length === 0 && (
            <div style={{
              padding: '.7rem 1rem',
              background: 'color-mix(in srgb, var(--vt-amber) 15%, var(--vt-tint))',
              borderLeft: '3px solid var(--vt-amber)',
              borderRadius: 10,
              fontSize: '.85rem',
              color: 'var(--ink)',
            }}>
              Đề đang hiện nhưng chưa có câu hỏi nào. Hãy thêm câu hỏi bên dưới.
            </div>
          )}
        </div>
      </div>

      {/* ===== CÂU HỎI ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconQuestion size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            Câu hỏi ({questions.length})
          </h3>
          <button type="button" className="vt-btn sm primary" onClick={addQuestion}>
            <IconPlus size={13} /> Thêm câu hỏi
          </button>
        </header>

        {/* Bulk topic assign */}
        {unclassifiedCount > 0 && (
          <div style={{
            display: 'flex',
            gap: '.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '.7rem .9rem',
            background: 'var(--vt-tint)',
            borderRadius: 14,
            marginBottom: '1rem',
          }}>
            <span style={{ font: '600 .82rem var(--sans)', color: 'var(--mut)' }}>
              {unclassifiedCount} câu chưa có chuyên đề
            </span>
            <select
              value={bulkTopic}
              onChange={(e) => setBulkTopic(e.target.value)}
              style={{
                padding: '.4rem .7rem',
                borderRadius: 999,
                border: '1px solid var(--soft)',
                background: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: '.82rem',
              }}
              aria-label="Chọn chuyên đề để gán hàng loạt"
            >
              <option value="">Chọn chuyên đề…</option>
              <TopicOptions preferGrade={examGrade} />
            </select>
            <button
              type="button"
              className="vt-btn sm"
              onClick={applyTopicToUnclassified}
              disabled={!bulkTopic}
            >
              Gán cho {unclassifiedCount} câu
            </button>
          </div>
        )}

        {questions.length === 0 ? (
          <div className="vt-empty">
            <span><IconQuestion size={30} /></span>
            <h3>Đề chưa có câu hỏi</h3>
            <p>Thêm thủ công tại đây, hoặc quay lại tab Tạo đề để import/AI sinh câu hỏi.</p>
            <button type="button" className="vt-btn primary" onClick={addQuestion}>
              <IconPlus size={14} /> Thêm câu đầu tiên
            </button>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '.8rem' }}>
            {questions.map((q, qIdx) => {
              const saving = savingQ.has(q.id);
              const errs = qErrors[q.id];
              return (
                <li
                  key={q.id}
                  style={{
                    padding: '1rem 1.1rem',
                    borderRadius: 16,
                    background: 'var(--vt-tint)',
                    borderLeft: errs ? '4px solid var(--vt-red)' : q._dirty ? '4px solid var(--vt-amber)' : '4px solid transparent',
                    boxShadow: q._dirty ? '0 0 0 1px color-mix(in srgb, var(--vt-amber) 30%, transparent)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.8rem', gap: '.5rem' }}>
                    <b style={{ font: '700 .9rem var(--sans)', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                      Câu {qIdx + 1}
                      {q._new && (
                        <span className="vt-chip" style={{ fontSize: '.62rem' }}>Mới</span>
                      )}
                      {q._dirty && !q._new && (
                        <span className="vt-chip soon" style={{ fontSize: '.62rem' }}>Chưa lưu</span>
                      )}
                    </b>
                    <div style={{ display: 'flex', gap: '.3rem' }}>
                      <button
                        type="button"
                        className="vt-btn sm"
                        onClick={() => saveQuestion(q)}
                        disabled={saving || !q._dirty}
                      >
                        <IconSave size={13} /> {saving ? 'Đang lưu…' : 'Lưu'}
                      </button>
                      <button
                        type="button"
                        className="vt-icon-btn danger"
                        onClick={() => handleDeleteQuestion(q, qIdx)}
                        title="Xóa câu"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {errs && (
                    <div style={{
                      padding: '.6rem .9rem',
                      background: 'color-mix(in srgb, var(--vt-red) 12%, var(--vt-tint))',
                      borderLeft: '3px solid var(--vt-red)',
                      borderRadius: 10,
                      fontSize: '.8rem',
                      color: 'var(--vt-red)',
                      marginBottom: '.8rem',
                    }}>
                      Chưa lưu được: {errs.join(', ')}.
                    </div>
                  )}

                  <label className="vt-field">
                    <span>Nội dung câu hỏi</span>
                    <textarea
                      value={q.content || ''}
                      onChange={(e) => patchQuestion(q.id, (x) => ({ ...x, content: e.target.value }))}
                      rows={2}
                      style={{ padding: '.6rem .8rem', borderRadius: 12, minHeight: 'auto' }}
                    />
                  </label>

                  <fieldset style={{
                    border: 0,
                    padding: 0,
                    margin: '.7rem 0',
                  }}>
                    <legend style={{
                      font: '600 .72rem var(--sans)',
                      color: 'var(--mut)',
                      marginBottom: '.4rem',
                    }}>
                      Đáp án — chọn nút tròn ở đáp án đúng
                    </legend>
                    <div style={{ display: 'grid', gap: '.35rem' }}>
                      {q.answers.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '.5rem',
                            padding: '.45rem .7rem',
                            borderRadius: 12,
                            background: a.is_correct ? 'color-mix(in srgb, #22c55e 15%, var(--vt-tint))' : 'var(--panel)',
                            border: a.is_correct ? '1.5px solid #22c55e' : '1.5px solid transparent',
                          }}
                        >
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={!!a.is_correct}
                            onChange={() => setCorrect(q.id, a.id)}
                            style={{ accentColor: '#22c55e' }}
                            aria-label={`Đáp án ${a.label} là đáp án đúng`}
                          />
                          <b style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: a.is_correct ? '#22c55e' : 'var(--vt-tint2)',
                            color: a.is_correct ? '#fff' : 'var(--ink)',
                            display: 'grid',
                            placeItems: 'center',
                            font: '700 .78rem var(--sans)',
                            flexShrink: 0,
                          }}>
                            {a.label}
                          </b>
                          <input
                            type="text"
                            value={a.content || ''}
                            onChange={(e) => updateAnswer(q.id, a.id, e.target.value)}
                            aria-label={`Nội dung đáp án ${a.label}`}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: '.4rem .6rem',
                              borderRadius: 8,
                              border: 0,
                              background: 'transparent',
                              color: 'var(--ink)',
                              font: '500 .88rem var(--sans)',
                            }}
                          />
                          <button
                            type="button"
                            className="vt-icon-btn"
                            onClick={() => removeAnswer(q.id, a.id)}
                            disabled={q.answers.length <= 2}
                            title="Xóa đáp án"
                            style={{ width: 26, height: 26 }}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      ))}
                      {q.answers.length < ANSWER_LABELS.length && (
                        <button
                          type="button"
                          className="vt-btn sm"
                          onClick={() => addAnswer(q.id)}
                          style={{ justifySelf: 'start' }}
                        >
                          <IconPlus size={12} /> Thêm đáp án
                        </button>
                      )}
                    </div>
                  </fieldset>

                  <label className="vt-field" style={{ marginTop: '.5rem' }}>
                    <span>Lời giải</span>
                    <textarea
                      value={q.explanation || ''}
                      onChange={(e) => patchQuestion(q.id, (x) => ({ ...x, explanation: e.target.value }))}
                      rows={2}
                      style={{ padding: '.6rem .8rem', borderRadius: 12, minHeight: 'auto' }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '.5rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', font: '600 .78rem var(--sans)' }}>
                      <span style={{ color: 'var(--mut)' }}>Độ khó</span>
                      <select
                        value={q.difficulty || 'medium'}
                        onChange={(e) => patchQuestion(q.id, (x) => ({ ...x, difficulty: e.target.value }))}
                        style={{
                          padding: '.35rem .7rem',
                          borderRadius: 999,
                          border: '1px solid var(--soft)',
                          background: 'var(--bg)',
                          color: 'var(--ink)',
                          fontSize: '.78rem',
                        }}
                      >
                        {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', font: '600 .78rem var(--sans)' }}>
                      <span style={{ color: 'var(--mut)' }}>Chuyên đề</span>
                      <select
                        value={q.topic_id || ''}
                        onChange={(e) => patchQuestion(q.id, (x) => ({ ...x, topic_id: e.target.value || null }))}
                        style={{
                          padding: '.35rem .7rem',
                          borderRadius: 999,
                          border: '1px solid var(--soft)',
                          background: 'var(--bg)',
                          color: 'var(--ink)',
                          fontSize: '.78rem',
                        }}
                      >
                        <option value="">Chưa phân loại</option>
                        <TopicOptions preferGrade={examGrade} />
                      </select>
                    </label>
                    {!errs && !q._dirty && (
                      <span style={{ color: '#16a34a', font: '600 .78rem var(--sans)', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                        <IconCheck size={13} /> Đã lưu
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        okLabel={confirm?.okLabel}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const fn = confirm?.onOk;
          setConfirm(null);
          fn?.();
        }}
      />

      {toast && <div className="vt-toast" role="status">{toast}</div>}
    </AdminShell>
  );
}