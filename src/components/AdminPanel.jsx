import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  fetchGrades, fetchSubjects, fetchExams,
  createExam, updateExam, deleteExam,
  importExamFromJson,
} from '../lib/examApi.js';
import { supabase } from '../lib/supabase.js';
import PromptBuilder from './admin/PromptBuilder.jsx';
import QuestionReview from './admin/QuestionReview.jsx';

const TABS = [
  { id: 'list', name: 'Danh sách đề' },
  { id: 'create', name: 'Tạo đề thủ công' },
  { id: 'import', name: 'Import JSON' },
  { id: 'prompt', name: '🎯 Tạo câu hỏi với AI' },
];

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

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('list');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [generatedQs, setGeneratedQs] = useState(null);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  useEffect(() => {
    if (!user) { setChecking(false); return; }
    (async () => {
      const uid = user.uid || user.id || user.email;
      console.log('🔍 Check admin cho:', { uid, email: user.email });

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .maybeSingle();

      console.log('📋 Profile từ DB:', data, error);
      setIsAdmin(data?.role === 'admin');
      setChecking(false);
    })();
  }, [user]);
  useEffect(() => {
    if (tab !== 'prompt') return;
    Promise.all([fetchGrades(), fetchSubjects()])
      .then(([g, s]) => { setGrades(g); setSubjects(s); })
      .catch(console.error);
  }, [tab]);

  if (checking) {
    return <div className="ad-loading">Đang kiểm tra quyền…</div>;
  }

  if (!user) {
    return (
      <div className="ad-denied">
        <h2>Chưa đăng nhập</h2>
        <p>Bạn cần đăng nhập để vào trang quản trị.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="ad-denied">
        <h2>Không có quyền truy cập</h2>
        <p>Tài khoản <b>{user.email}</b> chưa được cấp quyền admin.</p>
        <p style={{ fontSize: '.8rem', opacity: .7, marginTop: '1rem' }}>
          UID của bạn: <code>{user.uid || user.id}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="ad">
      <header className="ad-head">
        <h1>Quản trị đề thi</h1>
        <p>Xin chào, <b>{user.displayName || user.email}</b></p>
      </header>

      <nav className="ad-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'ad-tab' + (tab === t.id ? ' on' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.name}
          </button>
        ))}
      </nav>

      {tab === 'list' && <ExamList />}
      {tab === 'create' && <ExamCreate onDone={() => setTab('list')} />}
      {tab === 'import' && <ExamImport onDone={() => setTab('list')} />}

      {/* ============ TAB PROMPT BUILDER ============ */}
      {tab === 'prompt' && !generatedQs && (
        <PromptBuilder
          grades={grades}
          subjects={subjects}
          onImportJson={(jsonText) => {
            try {
              const data = JSON.parse(jsonText);
              const qs = data.questions || data;
              if (Array.isArray(qs) && qs.length > 0) {
                console.log('✅ Đã parse', qs.length, 'câu hỏi từ AI');
                setGeneratedQs(qs);
              }
            } catch (e) {
            }
          }}
        />
      )}

      {tab === 'prompt' && generatedQs && (
        <QuestionReview
          questions={generatedQs}
          onBack={() => setGeneratedQs(null)}
          onSave={async (qs) => {
            try {
              const defaultGrade = grades[0]?.id;
              const defaultSubject = subjects[0]?.id;

              if (!defaultGrade || !defaultSubject) {
                alert('Cần có ít nhất 1 lớp và 1 môn trong DB');
                return;
              }

              const result = await saveQuestionsToNewExam(qs, {
                gradeId: defaultGrade,
                subjectId: defaultSubject,
              });

              alert(`✅ Đã lưu ${qs.length} câu vào đề mới!`);
              setGeneratedQs(null);
              setTab('list');
            } catch (e) {
              console.error(e);
              alert('Lỗi: ' + e.message);
            }
          }}
        />
      )}
    </div>
  );
}
async function saveQuestionsToNewExam(questions, { gradeId, subjectId, title }) {
  const examTitle = title || `Đề AI tạo ${new Date().toLocaleDateString('vi-VN')}`;
  const { data: exam, error: e1 } = await supabase
    .from('exams')
    .insert({
      title: examTitle,
      description: `Đề tạo tự động bởi AI (${questions.length} câu)`,
      grade_id: gradeId,
      subject_id: subjectId,
      exam_type: 'giua_ky',
      duration: 45,
      difficulty: 'medium',
      source: 'AI Generated',
      is_published: true,
    })
    .select()
    .single();

  if (e1) throw e1;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const { data: question, error: e2 } = await supabase
      .from('questions')
      .insert({
        exam_id: exam.id,
        question_number: i + 1,
        content: q.content,
        question_type: q.type || 'single_choice',
        explanation: q.explanation || null,
        difficulty: q.difficulty || 'medium',
      })
      .select()
      .single();

    if (e2) throw e2;

    if (Array.isArray(q.options) && q.options.length) {
      const answers = q.options.map((opt, idx) => ({
        question_id: question.id,
        label: opt.label,
        content: opt.content,
        is_correct: q.correctAnswer === opt.label,
        sort_order: idx,
      }));

      const { error: e3 } = await supabase.from('answers').insert(answers);
      if (e3) throw e3;
    }
  }

  return exam;
}
function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchExams({ page: 1, pageSize: 200 });
      setExams(data);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Xóa đề "${title}"? Hành động không thể hoàn tác.`)) return;
    try {
      await deleteExam(id);
      load();
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleTogglePublish = async (exam) => {
    try {
      await updateExam(exam.id, { is_published: !exam.is_published });
      load();
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  if (loading) return <div className="ad-loading">Đang tải…</div>;
  if (error) return <div className="ad-error">{error}</div>;

  return (
    <div className="ad-list">
      <div className="ad-list-head">
        <p>Tổng <b>{exams.length}</b> đề</p>
        <button className="ad-btn" onClick={load}>↻ Làm mới</button>
      </div>

      {exams.length === 0 ? (
        <div className="ad-empty">
          <p>Chưa có đề nào. Sang tab <b>Import JSON</b> hoặc <b>🎯 Tạo câu hỏi với AI</b> để tạo đề đầu tiên.</p>
        </div>
      ) : (
        <table className="ad-table">
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
            {exams.map((e) => (
              <tr key={e.id}>
                <td className="ad-td-title">{e.title}</td>
                <td>{e.grade?.name}</td>
                <td>{e.subject?.name}</td>
                <td>{EXAM_TYPES.find((t) => t.id === e.exam_type)?.name || e.exam_type}</td>
                <td>{(e.attempt_count || 0).toLocaleString('vi-VN')}</td>
                <td>
                  <span className={'ad-pill ' + (e.is_published ? 'on' : 'off')}>
                    {e.is_published ? 'Đang hiện' : 'Đã ẩn'}
                  </span>
                </td>
                <td className="ad-td-actions">
                  <button
                    className="ad-icon-btn"
                    onClick={() => handleTogglePublish(e)}
                    title={e.is_published ? 'Ẩn đề' : 'Hiện đề'}
                  >
                    {e.is_published ? '👁' : '🚫'}
                  </button>
                  <button
                    className="ad-icon-btn danger"
                    onClick={() => handleDelete(e.id, e.title)}
                    title="Xóa đề"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
function ExamCreate({ onDone }) {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    grade_id: '',
    subject_id: '',
    exam_type: 'giua_ky',
    duration: 45,
    difficulty: 'medium',
    source: '',
    is_published: true,
  });

  useEffect(() => {
    Promise.all([fetchGrades(), fetchSubjects()]).then(([g, s]) => {
      setGrades(g);
      setSubjects(s);
      if (g[0]) setForm((f) => ({ ...f, grade_id: g[0].id }));
      if (s[0]) setForm((f) => ({ ...f, subject_id: s[0].id }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Chưa nhập tiêu đề'); return; }
    try {
      setSaving(true);
      setErr(null);
      await createExam({
        ...form,
        grade_id: Number(form.grade_id),
        subject_id: Number(form.subject_id),
        duration: Number(form.duration),
      });
      onDone();
    } catch (e) {
      console.error(e);
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="ad-form" onSubmit={handleSubmit}>
      <h2>Tạo đề mới</h2>

      <label>
        <span>Tiêu đề *</span>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="VD: Đề thi giữa kỳ 1 - Hóa học 11"
          required
        />
      </label>

      <label>
        <span>Mô tả</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Mô tả ngắn về đề…"
        />
      </label>

      <div className="ad-form-row">
        <label>
          <span>Lớp *</span>
          <select
            value={form.grade_id}
            onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
          >
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>

        <label>
          <span>Môn *</span>
          <select
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
          >
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </div>

      <div className="ad-form-row">
        <label>
          <span>Loại đề *</span>
          <select
            value={form.exam_type}
            onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
          >
            {EXAM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>

        <label>
          <span>Độ khó</span>
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>

        <label>
          <span>Thời gian (phút)</span>
          <input
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            min={1}
          />
        </label>
      </div>

      <label>
        <span>Nguồn đề</span>
        <input
          type="text"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
          placeholder="VD: Trường THPT Chuyên"
        />
      </label>

      <label className="ad-checkbox">
        <input
          type="checkbox"
          checked={form.is_published}
          onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
        />
        <span>Hiển thị cho học sinh</span>
      </label>

      {err && <p className="ad-err">{err}</p>}

      <div className="ad-form-actions">
        <button type="submit" className="ad-btn primary" disabled={saving}>
          {saving ? 'Đang lưu…' : 'Tạo đề'}
        </button>
      </div>

      <p className="ad-hint">
        Sau khi tạo đề, sang tab <b>Import JSON</b> để thêm câu hỏi.
      </p>
    </form>
  );
}
const SAMPLE_JSON = `{
  "title": "Đề thi thử giữa kỳ 1 - Hóa học 11",
  "description": "Đề minh họa 3 câu hỏi",
  "grade_id": 6,
  "subject_id": 12,
  "exam_type": "giua_ky",
  "duration": 45,
  "difficulty": "medium",
  "source": "Admin tạo",
  "questions": [
    {
      "content": "Dung dịch nào sau đây có pH > 7?",
      "type": "single_choice",
      "options": [
        { "label": "A", "content": "NaCl" },
        { "label": "B", "content": "NaOH" },
        { "label": "C", "content": "HCl" },
        { "label": "D", "content": "H2SO4" }
      ],
      "correctAnswer": "B",
      "explanation": "NaOH là bazơ mạnh, pH > 7.",
      "difficulty": "easy"
    },
    {
      "content": "Trộn 100ml HCl 0,1M với 100ml NaOH 0,1M. pH dung dịch sau phản ứng là:",
      "type": "single_choice",
      "options": [
        { "label": "A", "content": "1" },
        { "label": "B", "content": "7" },
        { "label": "C", "content": "12" },
        { "label": "D", "content": "13" }
      ],
      "correctAnswer": "B",
      "explanation": "nHCl = nNaOH = 0,01 mol, phản ứng vừa đủ → NaCl trung tính → pH = 7.",
      "difficulty": "medium"
    },
    {
      "content": "Số oxi hóa của S trong H2SO4 là:",
      "type": "single_choice",
      "options": [
        { "label": "A", "content": "-2" },
        { "label": "B", "content": "+4" },
        { "label": "C", "content": "+6" },
        { "label": "D", "content": "+2" }
      ],
      "correctAnswer": "C",
      "explanation": "Trong H2SO4: 2(+1) + x + 4(-2) = 0 → x = +6.",
      "difficulty": "easy"
    }
  ]
}`;

function ExamImport({ onDone }) {
  const [json, setJson] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parseErr, setParseErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    Promise.all([fetchGrades(), fetchSubjects()]).then(([g, s]) => {
      setGrades(g);
      setSubjects(s);
    });
  }, []);

  useEffect(() => {
    if (!json.trim()) { setParsed(null); setParseErr(null); return; }
    try {
      const data = JSON.parse(json);
      setParsed(data);
      setParseErr(null);
    } catch (e) {
      setParsed(null);
      setParseErr(e.message);
    }
  }, [json]);

  const handleSample = () => setJson(SAMPLE_JSON);
  const handleClear = () => { setJson(''); setParsed(null); setParseErr(null); };

  const handleImport = async () => {
    if (!parsed) return;
    try {
      setSaving(true);
      setSaveErr(null);

      if (!parsed.title) throw new Error('Thiếu "title"');
      if (!parsed.grade_id) throw new Error('Thiếu "grade_id"');
      if (!parsed.subject_id) throw new Error('Thiếu "subject_id"');
      if (!Array.isArray(parsed.questions) || !parsed.questions.length) {
        throw new Error('Thiếu "questions" (mảng câu hỏi)');
      }

      await importExamFromJson({
        ...parsed,
        grade_id: Number(parsed.grade_id),
        subject_id: Number(parsed.subject_id),
        duration: Number(parsed.duration || 45),
      });

      alert('✅ Import thành công!');
      onDone();
    } catch (e) {
      console.error(e);
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const canImport = parsed && !parseErr && !saving;

  return (
    <div className="ad-import">
      {/* NÚT IMPORT FLOATING */}
      <button
        onClick={handleImport}
        type="button"
        disabled={!canImport}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          padding: '1rem 2rem',
          fontSize: '1.05rem',
          fontWeight: 700,
          fontFamily: 'inherit',
          background: canImport ? '#ff4d1a' : '#999',
          color: '#ffffff',
          border: '2.5px solid #111',
          borderRadius: '999px',
          cursor: canImport ? 'pointer' : 'not-allowed',
          boxShadow: '6px 6px 0 #111',
          opacity: canImport ? 1 : 0.5,
        }}
      >
        {saving ? '⏳ Đang import...' : '🚀 Import đề'}
      </button>

      <div className="ad-import-sticky">
        <div>
          <h2>Import đề từ JSON</h2>
          <p className="ad-hint">
            Paste JSON theo format mẫu. Nhấn <b>Load mẫu</b> để xem cú pháp.
          </p>
        </div>
        <div className="ad-import-sticky-actions">
          <button className="ad-btn" onClick={handleSample} type="button">
            📋 Load mẫu
          </button>
          <button className="ad-btn" onClick={handleClear} type="button">
            🗑 Xóa
          </button>
        </div>
      </div>

      {!json.trim() && (
        <div className="ad-status ad-status-info">
          💡 Chưa có JSON. Nhấn <b>Load mẫu</b> để bắt đầu.
        </div>
      )}

      {parseErr && (
        <div className="ad-status ad-status-error">
          ❌ <b>Lỗi JSON:</b> {parseErr}
        </div>
      )}

      {parsed && !parseErr && (
        <div className="ad-status ad-status-success">
          ✅ <b>JSON hợp lệ</b> — {parsed.title} ({parsed.questions?.length || 0} câu)
        </div>
      )}

      <textarea
        className="ad-import-textarea"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={18}
        spellCheck={false}
        placeholder="Paste JSON vào đây…"
      />

      {parsed && !parseErr && (
        <div className="ad-preview">
          <b>📋 Thông tin đề</b>
          <ul>
            <li>Tiêu đề: <b>{parsed.title || '—'}</b></li>
            <li>
              Lớp ID: <b>{parsed.grade_id}</b> —{' '}
              {grades.find((g) => g.id === Number(parsed.grade_id))?.name || '⚠ không tìm thấy'}
            </li>
            <li>
              Môn ID: <b>{parsed.subject_id}</b> —{' '}
              {subjects.find((s) => s.id === Number(parsed.subject_id))?.name || '⚠ không tìm thấy'}
            </li>
            <li>Loại: <b>{parsed.exam_type || '—'}</b></li>
            <li>Thời gian: <b>{parsed.duration || 45} phút</b></li>
            <li>Số câu hỏi: <b>{parsed.questions?.length || 0}</b></li>
          </ul>
        </div>
      )}

      {saveErr && (
        <div className="ad-status ad-status-error">
          ❌ <b>Lỗi lưu:</b> {saveErr}
        </div>
      )}

      <div className="ad-form-actions">
        <button
          className="ad-btn primary"
          onClick={handleImport}
          disabled={!canImport}
          type="button"
          style={{ fontSize: '1rem', padding: '.9rem 2rem' }}
        >
          {saving ? '⏳ Đang import…' : '🚀 Import đề'}
        </button>
      </div>

      <details className="ad-hint-details">
        <summary>📖 Hướng dẫn lấy grade_id và subject_id</summary>
        <p>
          Vào Supabase → Table Editor → bảng <code>grades</code> / <code>subjects</code>{' '}
          → xem cột <code>id</code>.
        </p>
        <p><b>Lớp:</b></p>
        <ul>
          {grades.map((g) => (
            <li key={g.id}>Lớp <b>{g.name}</b> — grade_id = <code>{g.id}</code></li>
          ))}
        </ul>
        <p><b>Môn:</b></p>
        <ul>
          {subjects.map((s) => (
            <li key={s.id}><b>{s.name}</b> — subject_id = <code>{s.id}</code></li>
          ))}
        </ul>
      </details>
    </div>
  );
}