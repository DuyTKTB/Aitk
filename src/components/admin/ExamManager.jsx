import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import AdminPanel from '../AdminPanel.jsx';
import ExamEditor from './ExamEditor.jsx';
import { IconEdit, IconTrash, IconEye, IconPlus, IconExam } from './AdminIcons.jsx';

export default function ExamManager() {
  const [view, setView] = useState('list'); // 'list' | 'editor' | 'create'
  const [editingId, setEditingId] = useState(null);

  const openEditor = (id) => {
    setEditingId(id);
    setView('editor');
  };

  if (view === 'editor' && editingId) {
    return <ExamEditor examId={editingId} onBack={() => setView('list')} />;
  }

  if (view === 'create') {
    return <AdminPanel />; // AdminPanel cũ có tab tạo đề
  }

  return <ExamList onEdit={openEditor} onCreate={() => setView('create')} />;
}

// ============================================================
// DANH SÁCH ĐỀ với nút Sửa / Nhân bản / Xóa / Preview
// ============================================================
function ExamList({ onEdit, onCreate }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id, title, description, exam_type, duration, difficulty,
          source, attempt_count, is_published, created_at,
          grade:grades(id, name),
          subject:subjects(id, code, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Xóa đề "${title}"? Toàn bộ câu hỏi cũng bị xóa.`)) return;
    try {
      await supabase.from('exams').delete().eq('id', id);
      setExams((es) => es.filter((e) => e.id !== id));
      setMsg('✅ Đã xóa đề');
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleTogglePublish = async (exam) => {
    try {
      await supabase
        .from('exams')
        .update({ is_published: !exam.is_published })
        .eq('id', exam.id);
      setExams((es) =>
        es.map((e) => (e.id === exam.id ? { ...e, is_published: !e.is_published } : e))
      );
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleDuplicate = async (exam) => {
    if (!confirm(`Nhân bản đề "${exam.title}"?`)) return;
    try {
      setMsg('⏳ Đang nhân bản…');

      // 1. Copy exam
      const { data: newExam, error: e1 } = await supabase
        .from('exams')
        .insert({
          title: `${exam.title} (bản sao)`,
          description: exam.description,
          grade_id: exam.grade?.id,
          subject_id: exam.subject?.id,
          exam_type: exam.exam_type,
          duration: exam.duration,
          difficulty: exam.difficulty,
          source: exam.source,
          is_published: false,
        })
        .select()
        .single();

      if (e1) throw e1;

      // 2. Copy questions + answers
      const { data: questions } = await supabase
        .from('questions')
        .select('*, answers:answers(id, label, content, is_correct, sort_order)')
        .eq('exam_id', exam.id);

      for (const q of questions || []) {
        const { data: newQ, error: e2 } = await supabase
          .from('questions')
          .insert({
            exam_id: newExam.id,
            question_number: q.question_number,
            content: q.content,
            question_type: q.question_type,
            image_url: q.image_url,
            latex: q.latex,
            explanation: q.explanation,
            difficulty: q.difficulty,
          })
          .select()
          .single();

        if (e2) throw e2;

        if (q.answers?.length) {
          const answers = q.answers.map((a) => ({
            question_id: newQ.id,
            label: a.label,
            content: a.content,
            is_correct: a.is_correct,
            sort_order: a.sort_order,
          }));
          await supabase.from('answers').insert(answers);
        }
      }

      setMsg('✅ Đã nhân bản đề');
      setTimeout(() => setMsg(null), 2000);
      load();
    } catch (e) {
      console.error(e);
      alert('Lỗi nhân bản: ' + e.message);
      setMsg(null);
    }
  };

  const filtered = search.trim()
    ? exams.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    : exams;

  if (loading) return <div className="adl-loading">Đang tải đề thi…</div>;

  return (
    <div className="adl-examlist">
      {msg && <div className="adl-toast">{msg}</div>}

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3>
            <IconExam size={16} />
            <span>Tất cả đề thi ({filtered.length})</span>
          </h3>
          <div className="adl-list-actions">
            <input
              type="search"
              placeholder="Tìm đề…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="adl-search-input"
            />
            <button className="adl-btn-primary" onClick={onCreate}>
              <IconPlus size={14} /> Tạo đề
            </button>
          </div>
        </header>

        {filtered.length === 0 ? (
          <p className="adl-empty">Chưa có đề nào. Nhấn "Tạo đề" để bắt đầu.</p>
        ) : (
          <table className="adl-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Lớp</th>
                <th>Môn</th>
                <th>Loại</th>
                <th>Lượt làm</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="adl-td-title">
                    <b>{e.title}</b>
                    {e.description && <small>{e.description}</small>}
                  </td>
                  <td>{e.grade?.name}</td>
                  <td>{e.subject?.name}</td>
                  <td>{e.exam_type}</td>
                  <td>{(e.attempt_count || 0).toLocaleString('vi-VN')}</td>
                  <td>
                    <button
                      className={'adl-pill ' + (e.is_published ? 'on' : 'off')}
                      onClick={() => handleTogglePublish(e)}
                      title="Click để đổi trạng thái"
                    >
                      {e.is_published ? 'Đang hiện' : 'Đã ẩn'}
                    </button>
                  </td>
                  <td className="adl-td-actions">
                    <button
                      className="adl-icon-btn-sm"
                      onClick={() => onEdit(e.id)}
                      title="Sửa đề"
                    >
                      <IconEdit size={14} />
                    </button>
                    <button
                      className="adl-icon-btn-sm"
                      onClick={() => handleDuplicate(e)}
                      title="Nhân bản"
                    >
                      📋
                    </button>
                    <a
                      className="adl-icon-btn-sm"
                      href={`#exam/${e.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Xem trước"
                    >
                      <IconEye size={14} />
                    </a>
                    <button
                      className="adl-icon-btn-sm danger"
                      onClick={() => handleDelete(e.id, e.title)}
                      title="Xóa"
                    >
                      <IconTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}