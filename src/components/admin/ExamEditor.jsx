/* ============================================================
   ExamEditor.jsx — Sửa đề thi (Hỗ trợ chuẩn THPT 2025 + Mục lục nhảy câu)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import AdminShell, { Topbar } from './AdminShell.jsx';
import { ConfirmDialog } from './AdminUI.jsx';
import {
  IconBack, IconPlus, IconTrash, IconEdit, IconSave, IconQuestion, IconCheck, IconWarning,
  IconCode, IconRefresh,
} from './AdminIcons.jsx';
import { ANSWER_LABELS, DIFFICULTIES, EXAM_TYPES, QUESTION_TYPES } from './adminConstants.js';
import { downloadFile, friendlyError, isTempId, newTempId } from './adminUtils.js';
import { exportExamData } from './examService.js';
import { topicGroups, gradeNumber } from '../../data/chemTopics.js';

/* <option> chuyên đề nhóm theo lớp */
function TopicOptions({ preferGrade }) {
  return topicGroups(preferGrade).map((g) => (
    <optgroup key={g.grade} label={g.label}>
      {g.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </optgroup>
  ));
}

const blankAnswers = (type = 'single_choice') => {
  if (type === 'short_answer') {
    return [{ id: newTempId(), label: 'ĐS', content: '', is_correct: true, sort_order: 0, _new: true }];
  }
  return ANSWER_LABELS.slice(0, 4).map((label, i) => ({
    id: newTempId(),
    label,
    content: '',
    is_correct: type === 'true_false' ? i % 2 === 0 : i === 0,
    sort_order: i,
    _new: true,
  }));
};

function validateQuestion(q) {
  const errs = [];
  if (!q.content?.trim()) errs.push('thiếu nội dung câu hỏi');
  const qType = q.question_type || 'single_choice';

  if (qType === 'short_answer') {
    const ans = q.answers?.[0]?.content?.trim();
    if (!ans) errs.push('chưa nhập đáp số trả lời ngắn');
    return errs;
  }

  if (qType === 'true_false') {
    if ((q.answers || []).length < 2) errs.push('cần ít nhất 2 mệnh đề Đúng/Sai');
    if ((q.answers || []).some((a) => !a.content?.trim())) errs.push('có mệnh đề bị bỏ trống');
    return errs;
  }

  if (q.answers.length < 2) errs.push('cần ít nhất 2 đáp án');
  if (q.answers.some((a) => !a.content?.trim())) errs.push('có đáp án bị bỏ trống');
  const correct = q.answers.filter((a) => a.is_correct).length;
  if (correct !== 1) errs.push(correct === 0 ? 'chưa chọn đáp án đúng' : 'có nhiều hơn 1 đáp án đúng');
  return errs;
}

/* ============================================================
   WRAPPER
   ============================================================ */
export default function ExamEditor({ examId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  if (loadError) {
    return (
      <AdminShell active="exams" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <Topbar title="Sửa đề" subtitle="Không tải được" />
        <div className="vt-empty">
          <span><IconQuestion size={30} /></span>
          <h3>Không tải được đề</h3>
          <p>{loadError}</p>
          <button type="button" className="vt-btn primary" onClick={onBack}>
            <IconBack size={14} /> Quay lại danh sách
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <ExamEditorInner
      examId={examId}
      onBack={onBack}
      loading={loading}
      onLoadingChange={setLoading}
      onError={setLoadError}
    />
  );
}

/* ============================================================
   INNER — logic chính
   ============================================================ */
function ExamEditorInner({ examId, onBack, loading, onLoadingChange, onError }) {
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examDirty, setExamDirty] = useState(false);
  const [savingExam, setSavingExam] = useState(false);
  const [savingQ, setSavingQ] = useState(() => new Set());
  const [qErrors, setQErrors] = useState({});
  const [bulkTopic, setBulkTopic] = useState('');
  const [qFilter, setQFilter] = useState('all'); // all | dirty | error | no_explain
  const [lastDeleted, setLastDeleted] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [topicUnsupported, setTopicUnsupported] = useState(false);
  const toastTimer = useRef(null);
  const isTopicIntError = (e) => /invalid input syntax for type integer/i.test(String(e?.message || ''));

  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const dirtyQuestions = useMemo(() => questions.filter((q) => q._dirty), [questions]);
  const unclassifiedCount = useMemo(() => questions.filter((q) => !q.topic_id).length, [questions]);
  const noExplainCount = useMemo(() => questions.filter((q) => !q.explanation?.trim()).length, [questions]);
  const anyDirty = examDirty || dirtyQuestions.length > 0;

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

  const patchExam = (patch) => { setExam((e) => ({ ...e, ...patch })); setExamDirty(true); };

  const patchQuestion = (id, fn) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...fn(q), _dirty: true } : q)));

  const changeQuestionType = (qid, nextType) =>
    patchQuestion(qid, (q) => {
      if ((q.question_type || 'single_choice') === nextType) return q;
      const oldIds = (q.answers || []).filter((a) => !isTempId(a.id)).map((a) => a.id);
      return {
        ...q,
        question_type: nextType,
        answers: blankAnswers(nextType),
        _removed: [...(q._removed || []), ...oldIds],
      };
    });

  const setCorrect = (qid, aid) =>
    patchQuestion(qid, (q) => ({ ...q, answers: q.answers.map((a) => ({ ...a, is_correct: a.id === aid })) }));

  const toggleTrueFalse = (qid, aid, val) =>
    patchQuestion(qid, (q) => ({
      ...q,
      answers: q.answers.map((a) => (a.id === aid ? { ...a, is_correct: val } : a)),
    }));

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
      if ((q.question_type || 'single_choice') === 'single_choice' && target?.is_correct && rest.length) {
        rest[0] = { ...rest[0], is_correct: true };
      }
      return {
        ...q,
        answers: rest,
        _removed: isTempId(aid) ? q._removed : [...q._removed, aid],
      };
    });

  const addQuestion = (qType = 'single_choice') => {
    const nextNumber = questions.reduce((m, q) => Math.max(m, q.question_number || 0), 0) + 1;
    const newId = newTempId();
    setQuestions((qs) => [...qs, {
      id: newId, exam_id: examId, question_number: nextNumber, content: '',
      explanation: '', difficulty: 'medium', question_type: qType, topic_id: null,
      answers: blankAnswers(qType), _removed: [], _new: true, _dirty: true,
    }]);
    setTimeout(() => {
      document.getElementById(`ad-q-${newId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const applyTopicToUnclassified = () => {
    if (!bulkTopic || unclassifiedCount === 0) return;
    setQuestions((qs) => qs.map((q) => (q.topic_id ? q : { ...q, topic_id: bulkTopic, _dirty: true })));
    say(`Đã gán chuyên đề cho ${unclassifiedCount} câu — bấm "Lưu tất cả" để ghi.`);
  };

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
        let res = await supabase
          .from('questions')
          .insert({ ...fields, exam_id: examId, question_number: q.question_number })
          .select('id')
          .single();
        if (res.error && fields.topic_id != null && isTopicIntError(res.error)) {
          setTopicUnsupported(true);
          res = await supabase
            .from('questions')
            .insert({ ...fields, topic_id: null, exam_id: examId, question_number: q.question_number })
            .select('id')
            .single();
        }
        const { data, error } = res;
        if (error) throw error;
        qid = data.id;
      } else {
        let res = await supabase.from('questions').update(fields).eq('id', q.id);
        if (res.error && fields.topic_id != null && isTopicIntError(res.error)) {
          setTopicUnsupported(true);
          res = await supabase.from('questions').update({ ...fields, topic_id: null }).eq('id', q.id);
        }
        const { error } = res;
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
    if (fail === 0) say(`Đã lưu hoàn tất (${ok} câu hỏi)`);
    else say(`${fail} câu chưa lưu được — xem thông báo đỏ ở từng câu.`);
  };

  const handleDeleteQuestion = (q, idx) => {
    if (q._new) {
      setLastDeleted(q);
      setQuestions((qs) => qs.filter((x) => x.id !== q.id));
      say('Đã xóa câu mới (có thể Hoàn tác)');
      return;
    }
    setConfirm({
      title: `Xóa câu ${idx + 1}`,
      body: 'Câu hỏi và các đáp án sẽ bị xóa khỏi đề. Bạn có thể bấm Hoàn tác ngay sau khi xóa.',
      okLabel: 'Xóa câu',
      danger: true,
      onOk: async () => {
        try {
          const { error } = await supabase.from('questions').delete().eq('id', q.id);
          if (error) throw error;
          setLastDeleted(q);
          setQuestions((qs) => qs.filter((x) => x.id !== q.id));
          say('Đã xóa câu hỏi');
        } catch (e) {
          say('Không xóa được câu hỏi: ' + friendlyError(e));
        }
      },
    });
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    const restored = {
      ...lastDeleted,
      id: newTempId(),
      _new: true,
      _dirty: true,
      answers: (lastDeleted.answers || []).map((a) => ({ ...a, id: newTempId(), _new: true })),
    };
    setQuestions((qs) => [...qs, restored]);
    setLastDeleted(null);
    say('Đã khôi phục câu hỏi — bấm "Lưu" để ghi vào đề');
  };

  const handleExportJson = async () => {
    try {
      const payload = await exportExamData(examId);
      downloadFile(`de-${examId}.json`, JSON.stringify(payload, null, 2));
      say('Đã xuất đề ra file JSON');
    } catch (e) {
      say('Không xuất được JSON: ' + friendlyError(e));
    }
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

  // FIX QUAN TRỌNG: Kiểm tra loading TRƯỚC khi kiểm tra !exam
  if (loading) {
    return (
      <AdminShell active="exams" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <Topbar title="Sửa đề" subtitle="Đang tải dữ liệu đề thi…" />
        <div className="vt-loading">
          <div className="page-loader-spinner" />
          <p>Đang tải đề thi và danh sách câu hỏi…</p>
        </div>
      </AdminShell>
    );
  }

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

  const visibleQuestions = questions.filter((q) => {
    if (qFilter === 'dirty') return q._dirty;
    if (qFilter === 'error') return !!qErrors[q.id];
    if (qFilter === 'no_explain') return !q.explanation?.trim();
    return true;
  });

  return (
    <AdminShell active="exams" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Sửa đề thi"
        subtitle={`${exam.title} · ${questions.length} câu hỏi`}
        right={
          <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="vt-btn sm" onClick={handleBack}>
              <IconBack size={13} /> Danh sách đề
            </button>
            <button type="button" className="vt-btn sm" onClick={handleExportJson}>
              <IconCode size={13} /> Xuất JSON
            </button>
            {anyDirty && (
              <span className="vt-chip soon">
                <IconWarning size={12} /> {dirtyQuestions.length + (examDirty ? 1 : 0)} mục chưa lưu
              </span>
            )}
            <button
              type="button"
              className="vt-btn sm primary"
              onClick={saveAll}
              disabled={!anyDirty || savingExam || savingQ.size > 0}
            >
              <IconSave size={13} /> {savingExam || savingQ.size > 0 ? 'Đang lưu…' : 'Lưu tất cả'}
            </button>
          </div>
        }
      />

      {lastDeleted && (
        <div className="vt-card soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.8rem', borderLeft: '4px solid var(--acc)' }}>
          <span style={{ fontSize: '.85rem' }}>
            Đã xóa câu hỏi: <b>{(lastDeleted.content || 'Câu hỏi mới').slice(0, 60)}</b>
          </span>
          <button type="button" className="vt-btn sm primary" onClick={handleUndoDelete}>
            <IconRefresh size={13} /> Hoàn tác xóa
          </button>
        </div>
      )}

      {/* ===== THÔNG TIN ĐỀ (GỌN GÀNG) ===== */}
      <div className="vt-card">
        <header className="vt-card-head">
          <h3 className="vt-card-title">
            <IconEdit size={16} className="vt-title-ico" />
            Thông tin chung của đề
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

        <div style={{ display: 'grid', gap: '.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '.75rem' }}>
            <label className="vt-field">
              <span>Tiêu đề đề thi</span>
              <input
                type="text"
                value={exam.title || ''}
                onChange={(e) => patchExam({ title: e.target.value })}
                maxLength={200}
              />
            </label>
            <label className="vt-field">
              <span>Nguồn đề</span>
              <input
                type="text"
                value={exam.source || ''}
                onChange={(e) => patchExam({ source: e.target.value })}
                placeholder="VD: Sở GD&ĐT, trường THPT…"
              />
            </label>
          </div>

          <label className="vt-field">
            <span>Mô tả ngắn</span>
            <input
              type="text"
              value={exam.description || ''}
              onChange={(e) => patchExam({ description: e.target.value })}
              placeholder="Phạm vi kiến thức, ghi chú cho học sinh…"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '.65rem', alignItems: 'end' }}>
            <label className="vt-field">
              <span>Lớp</span>
              <select
                value={exam.grade_id ?? ''}
                onChange={(e) => patchExam({ grade_id: Number(e.target.value) })}
                style={{ height: 40, padding: '0 .8rem', borderRadius: 10, border: '1px solid var(--soft)', background: 'var(--vt-tint2)', color: 'var(--ink)' }}
              >
                {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
            <label className="vt-field">
              <span>Môn</span>
              <select
                value={exam.subject_id ?? ''}
                onChange={(e) => patchExam({ subject_id: Number(e.target.value) })}
                style={{ height: 40, padding: '0 .8rem', borderRadius: 10, border: '1px solid var(--soft)', background: 'var(--vt-tint2)', color: 'var(--ink)' }}
              >
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="vt-field">
              <span>Loại đề</span>
              <select
                value={exam.exam_type || ''}
                onChange={(e) => patchExam({ exam_type: e.target.value })}
                style={{ height: 40, padding: '0 .8rem', borderRadius: 10, border: '1px solid var(--soft)', background: 'var(--vt-tint2)', color: 'var(--ink)' }}
              >
                {EXAM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="vt-field">
              <span>Độ khó</span>
              <select
                value={exam.difficulty || 'medium'}
                onChange={(e) => patchExam({ difficulty: e.target.value })}
                style={{ height: 40, padding: '0 .8rem', borderRadius: 10, border: '1px solid var(--soft)', background: 'var(--vt-tint2)', color: 'var(--ink)' }}
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
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '.55rem',
              height: 40,
              padding: '0 .85rem',
              background: exam.is_published ? 'color-mix(in srgb, var(--acc) 10%, var(--vt-tint))' : 'var(--vt-tint)',
              borderRadius: 10,
              cursor: 'pointer',
              font: '600 .84rem var(--sans)',
            }}>
              <input
                type="checkbox"
                checked={!!exam.is_published}
                onChange={(e) => patchExam({ is_published: e.target.checked })}
                style={{ accentColor: 'var(--acc)', width: 16, height: 16 }}
              />
              <span>Hiển thị công khai</span>
            </label>
          </div>
        </div>
      </div>

      {topicUnsupported && (
        <div className="vt-card" style={{ borderLeft: '3px solid var(--vt-amber)', padding: '.8rem 1rem', fontSize: '.84rem' }}>
          <b>Chuyên đề chưa lưu được vào database.</b> Cột <code>questions.topic_id</code> đang là số nguyên. Hãy chạy <code>supabase/migrations/003_topic_id_text.sql</code> trong Supabase SQL Editor.
        </div>
      )}

      {/* ===== MỤC LỤC CÂU HỎI & BỘ LỌC NHANH ===== */}
      <div className="vt-card">
        <header className="vt-card-head" style={{ flexWrap: 'wrap', gap: '.6rem' }}>
          <h3 className="vt-card-title">
            <IconQuestion size={16} className="vt-title-ico" />
            Danh sách câu hỏi ({questions.length})
          </h3>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            <button type="button" className="vt-btn sm primary" onClick={() => addQuestion('single_choice')}>
              <IconPlus size={13} /> + Câu Trắc nghiệm (Phần I)
            </button>
            <button type="button" className="vt-btn sm" onClick={() => addQuestion('true_false')}>
              <IconPlus size={13} /> + Câu Đúng/Sai (Phần II)
            </button>
            <button type="button" className="vt-btn sm" onClick={() => addQuestion('short_answer')}>
              <IconPlus size={13} /> + Câu Trả lời ngắn (Phần III)
            </button>
          </div>
        </header>

        {/* Thanh lọc trạng thái câu + Mục lục nhảy câu */}
        {questions.length > 0 && (
          <div className="ad-q-nav-box">
            <div className="vt-pills" style={{ marginBottom: '.65rem' }}>
              <button type="button" className={'vt-pill sm' + (qFilter === 'all' ? ' on' : '')} onClick={() => setQFilter('all')}>
                Tất cả <b>{questions.length}</b>
              </button>
              <button type="button" className={'vt-pill sm' + (qFilter === 'dirty' ? ' on' : '')} onClick={() => setQFilter('dirty')}>
                Chưa lưu <b>{dirtyQuestions.length}</b>
              </button>
              <button type="button" className={'vt-pill sm' + (qFilter === 'no_explain' ? ' on' : '')} onClick={() => setQFilter('no_explain')}>
                Chưa có lời giải <b>{noExplainCount}</b>
              </button>
              {Object.keys(qErrors).length > 0 && (
                <button type="button" className={'vt-pill sm' + (qFilter === 'error' ? ' on' : '')} onClick={() => setQFilter('error')}>
                  Báo lỗi <b>{Object.keys(qErrors).length}</b>
                </button>
              )}
            </div>

            <div className="ad-q-palette" aria-label="Nhảy nhanh tới câu hỏi">
              {questions.map((q, idx) => {
                const hasErr = !!qErrors[q.id];
                const cls = hasErr ? 'err' : q._dirty ? 'dirty' : 'ok';
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`ad-q-dot ${cls}`}
                    onClick={() => {
                      setQFilter('all');
                      setTimeout(() => {
                        document.getElementById(`ad-q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 20);
                    }}
                    title={`Câu ${idx + 1} (${hasErr ? 'Có lỗi' : q._dirty ? 'Chưa lưu' : 'Đã lưu'})`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {unclassifiedCount > 0 && (
          <div style={{
            display: 'flex',
            gap: '.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '.6rem .85rem',
            background: 'var(--vt-tint)',
            borderRadius: 12,
            marginBottom: '1rem',
          }}>
            <span style={{ font: '600 .8rem var(--sans)', color: 'var(--mut)' }}>
              {unclassifiedCount} câu chưa phân loại chuyên đề:
            </span>
            <select
              value={bulkTopic}
              onChange={(e) => setBulkTopic(e.target.value)}
              className="vt-select-pill"
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
            <p>Thêm thủ công theo từng phần cấu trúc đề 2025 hoặc quay lại tab Tạo đề để import/AI sinh câu hỏi.</p>
            <button type="button" className="vt-btn primary" onClick={() => addQuestion('single_choice')}>
              <IconPlus size={14} /> Thêm câu đầu tiên
            </button>
          </div>
        ) : visibleQuestions.length === 0 ? (
          <p className="vt-muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            Không có câu hỏi nào trong bộ lọc này.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '.8rem' }}>
            {visibleQuestions.map((q) => {
              const qIdx = questions.findIndex((x) => x.id === q.id);
              const saving = savingQ.has(q.id);
              const errs = qErrors[q.id];
              const qType = q.question_type || 'single_choice';

              return (
                <li
                  id={`ad-q-${q.id}`}
                  key={q.id}
                  style={{
                    padding: '1rem 1.1rem',
                    borderRadius: 16,
                    background: 'var(--vt-tint)',
                    borderLeft: errs ? '4px solid var(--vt-red)' : q._dirty ? '4px solid var(--vt-amber)' : '4px solid transparent',
                    boxShadow: q._dirty ? '0 0 0 1px color-mix(in srgb, var(--vt-amber) 30%, transparent)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', gap: '.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                      <b style={{ font: '800 .92rem var(--sans)' }}>Câu {qIdx + 1}</b>
                      <select
                        value={qType}
                        onChange={(e) => changeQuestionType(q.id, e.target.value)}
                        className="vt-select-pill"
                        style={{ padding: '.25rem 1.7rem .25rem .65rem', fontSize: '.75rem' }}
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      {q._new && <span className="vt-chip" style={{ fontSize: '.62rem' }}>Mới</span>}
                      {q._dirty && !q._new && <span className="vt-chip soon" style={{ fontSize: '.62rem' }}>Chưa lưu</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '.35rem' }}>
                      <button
                        type="button"
                        className="vt-btn sm primary"
                        onClick={() => saveQuestion(q)}
                        disabled={saving || !q._dirty}
                      >
                        <IconSave size={13} /> {saving ? 'Đang lưu…' : 'Lưu câu'}
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
                      padding: '.55rem .85rem',
                      background: 'color-mix(in srgb, var(--vt-red) 12%, var(--vt-tint))',
                      borderLeft: '3px solid var(--vt-red)',
                      borderRadius: 10,
                      fontSize: '.8rem',
                      color: 'var(--vt-red)',
                      marginBottom: '.75rem',
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

                  {/* PHẦN ĐÁP ÁN TÙY THEO LOẠI CÂU */}
                  {qType === 'short_answer' ? (
                    <div style={{ margin: '.7rem 0', padding: '.75rem .9rem', borderRadius: 12, background: 'var(--panel)', border: '1.5px solid #22c55e' }}>
                      <label className="vt-field">
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>Đáp số trả lời ngắn (Phần III — tối đa 4–6 ký tự, VD: 12,5 hoặc -4)</span>
                        <input
                          type="text"
                          value={q.answers?.[0]?.content || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            patchQuestion(q.id, (x) => ({
                              ...x,
                              answers: x.answers?.length
                                ? x.answers.map((a, idx) => (idx === 0 ? { ...a, content: val, is_correct: true } : a))
                                : [{ id: newTempId(), label: 'ĐS', content: val, is_correct: true, sort_order: 0, _new: true }],
                            }));
                          }}
                          placeholder="Nhập đáp số chính xác…"
                          style={{ maxWidth: 260, fontWeight: 800, fontFamily: 'var(--mono)' }}
                        />
                      </label>
                    </div>
                  ) : qType === 'true_false' ? (
                    <fieldset style={{ border: 0, padding: 0, margin: '.7rem 0' }}>
                      <legend style={{ font: '600 .72rem var(--sans)', color: 'var(--mut)', marginBottom: '.4rem' }}>
                        Phần II — Đúng / Sai: nhập 4 mệnh đề a, b, c, d và chọn Đúng hoặc Sai cho từng ý
                      </legend>
                      <div style={{ display: 'grid', gap: '.4rem' }}>
                        {q.answers.map((a, idx) => (
                          <div
                            key={a.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '.5rem',
                              padding: '.45rem .7rem',
                              borderRadius: 12,
                              background: 'var(--panel)',
                              border: '1px solid var(--soft)',
                            }}
                          >
                            <b style={{
                              width: 26,
                              height: 26,
                              borderRadius: 8,
                              background: 'var(--vt-tint2)',
                              display: 'grid',
                              placeItems: 'center',
                              font: '700 .78rem var(--mono)',
                              flexShrink: 0,
                            }}>
                              {String.fromCharCode(97 + idx)})
                            </b>
                            <input
                              type="text"
                              value={a.content || ''}
                              onChange={(e) => updateAnswer(q.id, a.id, e.target.value)}
                              placeholder={`Nội dung mệnh đề ${String.fromCharCode(97 + idx)}…`}
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
                            <div className="vt-seg" role="group" aria-label={`Chọn Đúng/Sai cho ý ${a.label}`}>
                              <button
                                type="button"
                                className={a.is_correct ? 'on' : ''}
                                onClick={() => toggleTrueFalse(q.id, a.id, true)}
                                style={a.is_correct ? { background: '#16a34a', color: '#fff' } : undefined}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                className={!a.is_correct ? 'on' : ''}
                                onClick={() => toggleTrueFalse(q.id, a.id, false)}
                                style={!a.is_correct ? { background: '#ef4444', color: '#fff' } : undefined}
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  ) : (
                    <fieldset style={{ border: 0, padding: 0, margin: '.7rem 0' }}>
                      <legend style={{ font: '600 .72rem var(--sans)', color: 'var(--mut)', marginBottom: '.4rem' }}>
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
                  )}

                  <label className="vt-field" style={{ marginTop: '.5rem' }}>
                    <span>Lời giải chi tiết</span>
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
                        className="vt-select-pill"
                        style={{ padding: '.3rem 1.7rem .3rem .7rem', fontSize: '.76rem' }}
                      >
                        {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', font: '600 .78rem var(--sans)' }}>
                      <span style={{ color: 'var(--mut)' }}>Chuyên đề</span>
                      <select
                        value={q.topic_id || ''}
                        onChange={(e) => patchQuestion(q.id, (x) => ({ ...x, topic_id: e.target.value || null }))}
                        className="vt-select-pill"
                        style={{ padding: '.3rem 1.7rem .3rem .7rem', fontSize: '.76rem' }}
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
