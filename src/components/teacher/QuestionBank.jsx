/* ============================================================
   QuestionBank.jsx — Trang ngân hàng câu hỏi giáo viên
   ============================================================ */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import MathText from '../MathText.jsx';
import QuestionBankForm from './QuestionBankForm.jsx';
import { downloadCsv } from '../DashShell.jsx';
import {
  getQuestions, deleteQuestion, addQuestion, updateQuestion,
  getAllTags, findDuplicate, norm,
} from '../../lib/questionBank.js';
import { CHEM_TOPICS } from '../../data/chemTopics.js';
import '../../styles/question-bank.css';

/* ============ SVG ICONS ============ */
const Svg = ({ size = 18, sw = 1.8, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IcoPlus = (p) => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>;
const IcoSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.5" y2="16.5" /></Svg>;
const IcoLibrary = (p) => <Svg {...p}><path d="M4 4h6v16H4zM14 4h6v16h-6z" /></Svg>;
const IcoEdit = (p) => (
  <Svg {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);
const IcoTrash = (p) => (
  <Svg {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Svg>
);
const IcoRefresh = (p) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <polyline points="21 4 21 10 15 10" />
  </Svg>
);
const IcoCheck = (p) => <Svg {...p} sw={2.5}><polyline points="20 6 9 17 4 12" /></Svg>;

const LEVELS = ['', 'nhận biết', 'thông hiểu', 'vận dụng', 'vận dụng cao'];
const SUBJECTS = ['', 'Hóa học', 'Toán', 'Vật lí', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lí'];
const GRADES = [0, 6, 7, 8, 9, 10, 11, 12];

export default function QuestionBank() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState(0);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const [allTags, setAllTags] = useState([]);
  const [editing, setEditing] = useState(null); // question object hoặc null
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [formKey, setFormKey] = useState(0); // đổi key để làm trống form khi "Lưu và thêm tiếp"
  const toastTimer = useRef(null);

  const say = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current); // thông báo mới không bị timer của thông báo cũ tắt sớm
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [qs, tags] = await Promise.all([
        getQuestions({ teacherId: user.uid }),
        getAllTags(user.uid),
      ]);
      setList(qs);
      setAllTags(tags);
    } catch (e) {
      console.warn(e);
      say('Không tải được ngân hàng.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, say]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    let arr = list;
    if (filterSubject) arr = arr.filter((q) => q.subject === filterSubject);
    if (filterGrade) arr = arr.filter((q) => q.grade === filterGrade);
    if (filterTopic) arr = arr.filter((q) => q.topicId === filterTopic);
    if (filterLevel) arr = arr.filter((q) => q.level === filterLevel);
    if (filterTag) arr = arr.filter((q) => (q.tags || []).includes(filterTag));
    if (search.trim()) {
      // Tìm không phân biệt dấu: gõ "este" hay "ancol" vẫn ra "Este", "ancol"/"rượu"...
      const needle = norm(search);
      arr = arr.filter((q) => norm(q.q).includes(needle) || norm(q.explain).includes(needle));
    }
    return arr;
  }, [list, filterSubject, filterGrade, filterTopic, filterLevel, filterTag, search]);

  const stats = useMemo(() => {
    const byLevel = {};
    list.forEach((q) => { byLevel[q.level || '—'] = (byLevel[q.level || '—'] || 0) + 1; });
    return { total: list.length, byLevel };
  }, [list]);

  const handleAdd = async (data, opts = {}) => {
    // Cảnh báo khi thêm câu trùng hoàn toàn (cùng nội dung + đáp án)
    if (!editing && findDuplicate(list, data) &&
        !window.confirm('Câu này đã có trong ngân hàng. Vẫn thêm một bản nữa?')) {
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateQuestion(editing.id, data);
        say('Đã cập nhật câu hỏi');
      } else {
        await addQuestion({ ...data, teacherId: user.uid });
        say('Đã thêm câu hỏi');
      }
      if (opts.another && !editing) {
        setFormKey((k) => k + 1); // giữ hộp mở, làm trống form
      } else {
        setShowForm(false);
        setEditing(null);
      }
      await refresh();
    } catch (e) {
      say(e.message || 'Lỗi lưu câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  /* Xuất danh sách đang lọc ra CSV (mở bằng Excel) */
  const handleExport = () => {
    const rows = [['Môn', 'Lớp', 'Chuyên đề', 'Độ khó', 'Câu hỏi', 'A', 'B', 'C', 'D', 'E', 'F', 'Đáp án đúng', 'Lời giải', 'Điểm', 'Tag', 'Số lần dùng']];
    filtered.forEach((q) => {
      const topic = CHEM_TOPICS.find((t) => t.id === q.topicId);
      const opts = [0, 1, 2, 3, 4, 5].map((i) => q.options?.[i] ?? '');
      rows.push([
        q.subject || '', q.grade || '', topic?.name || q.topicId || '', q.level || '', q.q,
        ...opts, String.fromCharCode(65 + (q.correct || 0)), q.explain || '', q.points || 1,
        (q.tags || []).join('; '), q.usageCount || 0,
      ]);
    });
    downloadCsv(`ngan-hang-cau-hoi-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleDelete = async (q) => {
    if (!window.confirm(`Xóa câu này khỏi ngân hàng?`)) return;
    try {
      await deleteQuestion(q.id);
      setList((arr) => arr.filter((x) => x.id !== q.id));
      say('Đã xóa');
    } catch (e) {
      say(e.message || 'Lỗi xóa');
    }
  };

  return (
    <div className="qb">
      <header className="qb-head">
        <div>
          <div className="qb-head-title">
            <IcoLibrary size={20} />
            <span>Ngân hàng câu hỏi</span>
          </div>
          <div className="qb-head-count">
            {stats.total} câu
            {stats.byLevel && Object.keys(stats.byLevel).length > 0 && (
              <>
                {' · '}
                {Object.entries(stats.byLevel).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </>
            )}
          </div>
        </div>
        <div className="qb-head-actions">
          <button type="button" className="vt-btn sm" onClick={handleExport} disabled={loading || filtered.length === 0}>
            Xuất CSV ({filtered.length})
          </button>
          <button type="button" className="vt-btn sm" onClick={refresh} disabled={loading}>
            <IcoRefresh size={13} /> Làm mới
          </button>
          <button
            type="button"
            className="vt-btn sm primary"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <IcoPlus size={14} /> Thêm câu hỏi
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="qb-toolbar">
        <div className="qb-search-row">
          <label className="qb-search">
            <IcoSearch size={15} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm trong câu hỏi và lời giải..."
            />
          </label>
        </div>

        <div className="qb-filters">
          <span className="qb-filter-label">Môn</span>
          {SUBJECTS.map((s) => (
            <button
              key={s || 'all'}
              type="button"
              className={'qb-chip' + (filterSubject === s ? ' on' : '')}
              onClick={() => setFilterSubject(s)}
            >
              {s || 'Tất cả'}
            </button>
          ))}
        </div>

        <div className="qb-filters">
          <span className="qb-filter-label">Lớp</span>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              className={'qb-chip' + (filterGrade === g ? ' on' : '')}
              onClick={() => setFilterGrade(g)}
            >
              {g === 0 ? 'Tất cả' : `Lớp ${g}`}
            </button>
          ))}
        </div>

        <div className="qb-filters">
          <span className="qb-filter-label">Độ khó</span>
          {LEVELS.map((l) => (
            <button
              key={l || 'all'}
              type="button"
              className={'qb-chip' + (filterLevel === l ? ' on' : '')}
              onClick={() => setFilterLevel(l)}
            >
              {l || 'Tất cả'}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="qb-filters">
            <span className="qb-filter-label">Tag</span>
            <button
              type="button"
              className={'qb-chip' + (!filterTag ? ' on' : '')}
              onClick={() => setFilterTag('')}
            >
              Tất cả
            </button>
            {allTags.slice(0, 12).map((t) => (
              <button
                key={t}
                type="button"
                className={'qb-chip' + (filterTag === t ? ' on' : '')}
                onClick={() => setFilterTag(t)}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        <div className="qb-filters">
          <span className="qb-filter-label">Chuyên đề</span>
          <button
            type="button"
            className={'qb-chip' + (!filterTopic ? ' on' : '')}
            onClick={() => setFilterTopic('')}
          >
            Tất cả
          </button>
          {CHEM_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={'qb-chip' + (filterTopic === t.id ? ' on' : '')}
              onClick={() => setFilterTopic(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="page-loader-spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--mut)' }}>Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="qb-empty">
          <IcoLibrary size={36} />
          <h3>{list.length === 0 ? 'Ngân hàng trống' : 'Không có câu nào khớp'}</h3>
          <p>
            {list.length === 0
              ? 'Bấm "Thêm câu hỏi" để lưu câu hỏi đầu tiên vào ngân hàng.'
              : 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm.'}
          </p>
          {list.length === 0 && (
            <button
              type="button"
              className="vt-btn primary"
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <IcoPlus size={14} /> Thêm câu hỏi đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="qb-list">
          {filtered.map((q) => {
            const topic = CHEM_TOPICS.find((t) => t.id === q.topicId);
            return (
              <article key={q.id} className="qb-item">
                <div className="qb-item-body">
                  <MathText as="p" className="qb-item-q">{q.q}</MathText>
                  <div className="qb-item-opts">
                    {q.options.map((opt, i) => (
                      <span key={i} className={'qb-item-opt' + (i === q.correct ? ' correct' : '')}>
                        <b>{String.fromCharCode(65 + i)}.</b>
                        <MathText>{opt}</MathText>
                      </span>
                    ))}
                  </div>
                  <div className="qb-item-meta">
                    {q.subject && <span className="qb-meta-pill">{q.subject}</span>}
                    {q.grade > 0 && <span className="qb-meta-pill">Lớp {q.grade}</span>}
                    {topic && <span className="qb-meta-pill acc">{topic.name}</span>}
                    {q.level && <span className="qb-meta-pill">{q.level}</span>}
                    {q.usageCount > 0 && <span className="qb-meta-pill">Dùng {q.usageCount} lần</span>}
                    {q.tags?.map((t) => <span key={t} className="qb-meta-pill">#{t}</span>)}
                  </div>
                </div>
                <div className="qb-item-actions">
                  <button
                    type="button"
                    className="qb-icon-btn"
                    onClick={() => { setEditing(q); setShowForm(true); }}
                    title="Sửa"
                  >
                    <IcoEdit size={14} />
                  </button>
                  <button
                    type="button"
                    className="qb-icon-btn danger"
                    onClick={() => handleDelete(q)}
                    title="Xóa"
                  >
                    <IcoTrash size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="vt-toast success" role="status">{toast}</div>
      )}

      {showForm && (
        <QuestionBankForm
          key={editing?.id || 'new-' + formKey}
          initial={editing}
          defaultSubject={filterSubject}
          defaultGrade={filterGrade}
          saving={saving}
          onSave={handleAdd}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}