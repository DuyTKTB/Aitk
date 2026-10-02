import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { IconBack, IconPlus, IconTrash, IconEdit } from './AdminIcons.jsx';

const EXAM_TYPES = [
  { id: 'giua_ky', name: 'Giữa kỳ' },
  { id: 'cuoi_ky', name: 'Cuối kỳ' },
  { id: 'thpt', name: 'THPT Quốc gia' },
  { id: 'chuyen_de', name: 'Chuyên đề' },
  { id: 'khao_sat', name: 'Khảo sát' },
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Dễ' },
  { id: 'medium', name: 'Trung bình' },
  { id: 'hard', name: 'Khó' },
  { id: 'extreme', name: 'Rất khó' },
];

export default function ExamEditor({ examId, onBack }) {
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const load = async () => {
    try {
      setLoading(true);

      const [examRes, questionsRes, gradesRes, subjectsRes] = await Promise.all([
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

      setExam(examRes.data);
      setQuestions(
        (questionsRes.data || []).map((q) => ({
          ...q,
          answers: (q.answers || []).sort((a, b) => a.sort_order - b.sort_order),
        }))
      );
      setGrades(gradesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (e) {
      console.error(e);
      alert('Không tải được đề: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('exams')
        .update({
          title: exam.title,
          description: exam.description,
          duration: Number(exam.duration),
          difficulty: exam.difficulty,
          exam_type: exam.exam_type,
          grade_id: exam.grade_id,
          subject_id: exam.subject_id,
          source: exam.source,
          is_published: exam.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exam.id);

      if (error) throw error;
      setMsg('✅ Đã lưu đề');
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      await supabase.from('questions').delete().eq('id', questionId);
      setQuestions((qs) => qs.filter((q) => q.id !== questionId));
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleSaveQuestion = async (q) => {
    try {
      setSaving(true);
      // Update question
      await supabase
        .from('questions')
        .update({
          content: q.content,
          explanation: q.explanation,
          difficulty: q.difficulty,
          question_type: q.question_type,
        })
        .eq('id', q.id);

      // Update answers
      for (const ans of q.answers) {
        await supabase
          .from('answers')
          .update({
            content: ans.content,
            is_correct: ans.is_correct,
          })
          .eq('id', ans.id);
      }

      setMsg('✅ Đã lưu câu hỏi');
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions((qs) =>
      qs.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateAnswer = (qIdx, aIdx, field, value) => {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          answers: q.answers.map((a, j) => (j === aIdx ? { ...a, [field]: value } : a)),
        };
      })
    );
  };

  const setCorrectAnswer = (qIdx, answerId) => {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          answers: q.answers.map((a) => ({ ...a, is_correct: a.id === answerId })),
        };
      })
    );
  };

  if (loading) return <div className="adl-loading">Đang tải đề…</div>;
  if (!exam) return <div className="adl-empty">Không tìm thấy đề</div>;

  return (
    <div className="adl-editor">
      {msg && <div className="adl-toast">{msg}</div>}

      <button className="adl-btn-outline" onClick={onBack}>
        <IconBack size={14} /> Quay lại danh sách
      </button>

      {/* ============ THÔNG TIN ĐỀ ============ */}
      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3>
            <IconEdit size={16} />
            <span>Thông tin đề</span>
          </h3>
          <button
            className="adl-btn-primary"
            onClick={handleSaveExam}
            disabled={saving}
          >
            {saving ? 'Đang lưu…' : '💾 Lưu đề'}
          </button>
        </header>

        <div className="adl-form">
          <label className="adl-field">
            <span>Tiêu đề</span>
            <input
              type="text"
              value={exam.title || ''}
              onChange={(e) => setExam({ ...exam, title: e.target.value })}
            />
          </label>

          <label className="adl-field">
            <span>Mô tả</span>
            <textarea
              value={exam.description || ''}
              onChange={(e) => setExam({ ...exam, description: e.target.value })}
              rows={2}
            />
          </label>

          <div className="adl-form-row">
            <label className="adl-field">
              <span>Lớp</span>
              <select
                value={exam.grade_id}
                onChange={(e) => setExam({ ...exam, grade_id: Number(e.target.value) })}
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </label>

            <label className="adl-field">
              <span>Môn</span>
              <select
                value={exam.subject_id}
                onChange={(e) => setExam({ ...exam, subject_id: Number(e.target.value) })}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <label className="adl-field">
              <span>Loại</span>
              <select
                value={exam.exam_type}
                onChange={(e) => setExam({ ...exam, exam_type: e.target.value })}
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>

            <label className="adl-field">
              <span>Độ khó</span>
              <select
                value={exam.difficulty}
                onChange={(e) => setExam({ ...exam, difficulty: e.target.value })}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>

            <label className="adl-field">
              <span>Thời gian (phút)</span>
              <input
                type="number"
                value={exam.duration}
                onChange={(e) => setExam({ ...exam, duration: e.target.value })}
                min={1}
              />
            </label>
          </div>

          <label className="adl-checkbox">
            <input
              type="checkbox"
              checked={exam.is_published}
              onChange={(e) => setExam({ ...exam, is_published: e.target.checked })}
            />
            <span>Hiển thị cho học sinh</span>
          </label>
        </div>
      </section>

      {/* ============ CÂU HỎI ============ */}
      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3>
            <span>Câu hỏi ({questions.length})</span>
          </h3>
        </header>

        {questions.length === 0 ? (
          <p className="adl-empty">Đề chưa có câu hỏi nào</p>
        ) : (
          <ul className="adl-qedit-list">
            {questions.map((q, qIdx) => (
              <li key={q.id} className="adl-qedit-item">
                <div className="adl-qedit-head">
                  <b>Câu {qIdx + 1}</b>
                  <div className="adl-qedit-actions">
                    <button
                      className="adl-btn-sm"
                      onClick={() => handleSaveQuestion(q)}
                    >
                      💾 Lưu
                    </button>
                    <button
                      className="adl-icon-btn-sm danger"
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Xóa câu"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>

                <label className="adl-field">
                  <span>Nội dung câu hỏi</span>
                  <textarea
                    value={q.content || ''}
                    onChange={(e) => updateQuestion(qIdx, 'content', e.target.value)}
                    rows={2}
                  />
                </label>

                <div className="adl-qedit-opts">
                  <span className="adl-qedit-label">
                    Đáp án (chọn radio = đáp án đúng)
                  </span>
                  {q.answers.map((a, aIdx) => (
                    <div key={a.id} className="adl-qedit-opt">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={a.is_correct}
                        onChange={() => setCorrectAnswer(qIdx, a.id)}
                      />
                      <b>{a.label}</b>
                      <input
                        type="text"
                        value={a.content || ''}
                        onChange={(e) => updateAnswer(qIdx, aIdx, 'content', e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <label className="adl-field">
                  <span>Lời giải</span>
                  <textarea
                    value={q.explanation || ''}
                    onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                    rows={2}
                  />
                </label>

                <div className="adl-qedit-meta">
                  <label className="adl-field adl-field-inline">
                    <span>Độ khó</span>
                    <select
                      value={q.difficulty || 'medium'}
                      onChange={(e) => updateQuestion(qIdx, 'difficulty', e.target.value)}
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}