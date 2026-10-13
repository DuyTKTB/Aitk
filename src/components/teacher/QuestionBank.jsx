/* ============================================================
   QuestionBank.jsx — Trang ngân hàng câu hỏi giáo viên (v2)
   ------------------------------------------------------------
   v2:
     • MỚI: Đa môn — chuyên đề đổi theo môn
     • FIX: Bố cục filter đẹp (grid chuyên đề, divider giữa tầng)
     • FIX: Empty state có gợi ý + 2 nút
     • MỚI: Đếm câu trên mỗi chip filter
     • MỚI: Multi-select môn (chọn nhiều môn cùng lúc)
     • MỚI: Sticky filter bar khi scroll
   ============================================================ */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import MathText from '../MathText.jsx';
import QuestionBankForm from './QuestionBankForm.jsx';
import ExamImporter from './ExamImporter.jsx';
import { downloadCsv } from '../DashShell.jsx';
import {
  getQuestions, deleteQuestion, addQuestion, updateQuestion, addQuestionsBatch,
  getAllTags, findDuplicate, norm,
} from '../../lib/questionBank.js';
import { createExam } from '../../lib/classroom.js';
import {
  getTopicsForSubject,
  getTopicName,
  ALL_SUBJECTS_LIST,
} from '../../data/topicsBySubject.js';
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
const IcoSpark = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" /></Svg>;
const IcoRocket = (p) => <Svg {...p}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /></Svg>;
const IcoUpload = (p) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></Svg>;

const LEVELS = ['', 'nhận biết', 'thông hiểu', 'vận dụng', 'vận dụng cao'];
const LEVEL_SHORT = { '': 'Tất cả', 'nhận biết': 'NB', 'thông hiểu': 'TH', 'vận dụng': 'VD', 'vận dụng cao': 'VDC' };
const GRADES = [0, 6, 7, 8, 9, 10, 11, 12];

export default function QuestionBank({ classes = [], onSoftExamCreated } = {}) {
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
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [topicQuery, setTopicQuery] = useState('');
  const [toast, setToast] = useState('');
  const [formKey, setFormKey] = useState(0);
  const toastTimer = useRef(null);

  const say = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
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

  const availableTopics = useMemo(() => {
    if (filterSubject) return getTopicsForSubject(filterSubject);
    const used = new Map();
    list.forEach((q) => {
      if (!q.topicId) return;
      if (!used.has(q.topicId)) {
        used.set(q.topicId, { id: q.topicId, name: getTopicName(q.topicId, q.subject) });
      }
    });
    return [...used.values()];
  }, [filterSubject, list]);

  /* Reset chuyên đề khi đổi môn */
  useEffect(() => {
    if (filterTopic) {
      const stillValid = availableTopics.some((t) => t.id === filterTopic);
      if (!stillValid) setFilterTopic('');
    }
  }, [filterSubject, filterTopic, availableTopics]);

  /* Đếm số câu cho từng filter */
  const counts = useMemo(() => {
    const bySubject = {};
    const byGrade = {};
    const byLevel = {};
    const byTopic = {};
    list.forEach((q) => {
      if (q.subject) bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
      if (q.grade) byGrade[q.grade] = (byGrade[q.grade] || 0) + 1;
      if (q.level) byLevel[q.level] = (byLevel[q.level] || 0) + 1;
      if (q.topicId) byTopic[q.topicId] = (byTopic[q.topicId] || 0) + 1;
    });
    return { bySubject, byGrade, byLevel, byTopic };
  }, [list]);

  const filtered = useMemo(() => {
    let arr = list;
    if (filterSubject) arr = arr.filter((q) => q.subject === filterSubject);
    if (filterGrade) arr = arr.filter((q) => q.grade === filterGrade);
    if (filterTopic) arr = arr.filter((q) => q.topicId === filterTopic);
    if (filterLevel) arr = arr.filter((q) => q.level === filterLevel);
    if (filterTag) arr = arr.filter((q) => (q.tags || []).includes(filterTag));
    if (search.trim()) {
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

  const hasActiveFilter = filterSubject || filterGrade || filterTopic || filterLevel || filterTag || search.trim();

  const handleClearFilters = () => {
    setFilterSubject('');
    setFilterGrade(0);
    setFilterTopic('');
    setFilterLevel('');
    setFilterTag('');
    setSearch('');
  };

  const handleAdd = async (data, opts = {}) => {
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
        setFormKey((k) => k + 1);
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

  const handleExport = () => {
    const rows = [['Môn', 'Lớp', 'Chuyên đề', 'Độ khó', 'Câu hỏi', 'A', 'B', 'C', 'D', 'E', 'F', 'Đáp án đúng', 'Lời giải', 'Điểm', 'Tag', 'Số lần dùng']];
    filtered.forEach((q) => {
      const opts = [0, 1, 2, 3, 4, 5].map((i) => q.options?.[i] ?? '');
      const topicName = q.topicId || '';
      rows.push([
        q.subject || '', q.grade || '', topicName, q.level || '', q.q,
        ...opts, String.fromCharCode(65 + (q.correct || 0)), q.explain || '', q.points || 1,
        (q.tags || []).join('; '), q.usageCount || 0,
      ]);
    });
    downloadCsv(`ngan-hang-cau-hoi-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const visibleTopics = useMemo(() => {
    const q = topicQuery.trim().toLowerCase();
    if (!q) return availableTopics;
    return availableTopics.filter((t) =>
      (t.name || '').toLowerCase().includes(q) || (t.id || '').toLowerCase().includes(q)
    );
  }, [availableTopics, topicQuery]);

  const handleImportToBank = async (qs) => {
    const res = await addQuestionsBatch({ teacherId: user.uid, questions: qs });
    say(`Đã lưu ${res.count} câu vào ngân hàng` + (res.skipped ? ` (bỏ trùng ${res.skipped})` : ''));
    setShowImporter(false);
    await refresh();
  };

  const handleCreateSoftExam = async ({ title, duration, classId, subject, grade, questions: qs, sourceFile }) => {
    const exam = await createExam({
      teacherId: user.uid,
      teacherName: user.displayName || user.email,
      classId,
      title,
      description: sourceFile ? `Nhập từ file ${sourceFile}` : 'Đề mềm nhập từ file',
      duration,
      questions: qs,
      showAnswerAfter: true,
      allowRetry: false,
      shuffle: false,
      source: 'file-import',
      kind: 'soft',
      subject,
      grade,
    });
    say(`Đã tạo đề mềm “${exam.title}” (${qs.length} câu)`);
    setShowImporter(false);
    onSoftExamCreated?.(exam);
  };

  const handleDelete = async (q) => {
    if (!window.confirm('Xóa câu này khỏi ngân hàng?')) return;
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
      {/* HEADER */}
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
            className="vt-btn sm"
            onClick={() => setShowImporter(true)}
          >
            <IcoUpload size={14} /> Nhập đề từ file
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

      {/* TOOLBAR — STICKY */}
      <div className="qb-toolbar">
        {/* Search */}
        <div className="qb-search-row">
          <label className="qb-search">
            <IcoSearch size={15} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm trong câu hỏi và lời giải..."
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Xóa tìm kiếm"
                style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--mut)' }}
              >
                ×
              </button>
            )}
          </label>

          {/* Filter summary + Clear */}
          {hasActiveFilter && (
            <div className="qb-filter-summary">
              <span>Bộ lọc đang bật</span>
              <button
                type="button"
                className="qb-clear-btn"
                onClick={handleClearFilters}
              >
                × Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* Filter tầng 1: MÔN */}
        <div className="qb-filter-row">
          <span className="qb-filter-label">Môn</span>
          <div className="qb-filter-chips">
            <button
              type="button"
              className={'qb-chip' + (!filterSubject ? ' on' : '')}
              onClick={() => setFilterSubject('')}
            >
              Tất cả ({list.length})
            </button>
            {ALL_SUBJECTS_LIST.map((s) => {
              const count = counts.bySubject[s] || 0;
              return (
                <button
                  key={s}
                  type="button"
                  className={'qb-chip' + (filterSubject === s ? ' on' : '')}
                  onClick={() => setFilterSubject(s)}
                  disabled={count === 0 && filterSubject !== s}
                >
                  {s} {count > 0 && <span className="qb-chip-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter tầng 2: LỚP */}
        <div className="qb-filter-row">
          <span className="qb-filter-label">Lớp</span>
          <div className="qb-filter-chips">
            {GRADES.map((g) => {
              const count = g === 0 ? list.length : (counts.byGrade[g] || 0);
              return (
                <button
                  key={g}
                  type="button"
                  className={'qb-chip' + (filterGrade === g ? ' on' : '')}
                  onClick={() => setFilterGrade(g)}
                  disabled={count === 0 && filterGrade !== g}
                >
                  {g === 0 ? 'Tất cả' : `Lớp ${g}`}
                  {count > 0 && g !== 0 && <span className="qb-chip-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter tầng 3: ĐỘ KHÓ */}
        <div className="qb-filter-row">
          <span className="qb-filter-label">Độ khó</span>
          <div className="qb-filter-chips">
            {LEVELS.map((l) => {
              const count = l === '' ? list.length : (counts.byLevel[l] || 0);
              return (
                <button
                  key={l || 'all'}
                  type="button"
                  className={'qb-chip' + (filterLevel === l ? ' on' : '')}
                  onClick={() => setFilterLevel(l)}
                  title={l || 'Tất cả'}
                >
                  {LEVEL_SHORT[l]}
                  {count > 0 && l !== '' && <span className="qb-chip-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter tầng 4: TAG */}
        {allTags.length > 0 && (
          <div className="qb-filter-row">
            <span className="qb-filter-label">Tag</span>
            <div className="qb-filter-chips">
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
          </div>
        )}

        <div className="qb-filter-row qb-filter-row--topics">
          <span className="qb-filter-label">Chuyên đề</span>
          <div className="qb-topic-wrap">
            <div className="qb-topic-tools">
              <input
                className="qb-topic-search"
                type="search"
                value={topicQuery}
                onChange={(e) => setTopicQuery(e.target.value)}
                placeholder={filterSubject ? `Lọc chuyên đề ${filterSubject}...` : 'Chọn môn, hoặc tìm chuyên đề đang có...'}
              />
              {availableTopics.length > 10 && (
                <button type="button" className="qb-topic-more" onClick={() => setTopicsOpen((v) => !v)}>
                  {topicsOpen ? 'Thu gọn' : `Mở rộng (${availableTopics.length})`}
                </button>
              )}
            </div>
            <div className={'qb-topic-grid' + (topicsOpen ? ' is-open' : '')}>
              <button
                type="button"
                className={'qb-chip' + (!filterTopic ? ' on' : '')}
                onClick={() => setFilterTopic('')}
              >
                Tất cả
              </button>
              {visibleTopics.length === 0 ? (
                <span className="qb-topic-empty-inline">
                  {filterSubject ? 'Chưa có chuyên đề cho môn này.' : 'Chọn một môn để xem chuyên đề gọn hơn.'}
                </span>
              ) : (
                visibleTopics.map((t) => {
                  const count = counts.byTopic[t.id] || 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={'qb-chip' + (filterTopic === t.id ? ' on' : '')}
                      onClick={() => setFilterTopic(t.id)}
                      title={t.name}
                    >
                      {t.name}
                      {count > 0 && <span className="qb-chip-count">{count}</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="qb-loading">
          <div className="page-loader-spinner" />
          <p>Đang tải ngân hàng...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="qb-empty">
          <IcoLibrary size={48} />
          <h3>{list.length === 0 ? 'Ngân hàng trống' : 'Không có câu nào khớp bộ lọc'}</h3>
          <p>
            {list.length === 0
              ? 'Bắt đầu xây dựng ngân hàng câu hỏi cá nhân theo 3 cách bên dưới.'
              : 'Thử đổi bộ lọc hoặc xóa từ khóa tìm kiếm để xem thêm câu hỏi.'}
          </p>

          {list.length === 0 ? (
            <div className="qb-empty-steps">
              <div className="qb-empty-step">
                <div className="qb-empty-step-num">1</div>
                <b>Thêm thủ công</b>
                <small>Tạo câu hỏi đầu tiên bằng nút bên dưới</small>
              </div>
              <div className="qb-empty-step">
                <div className="qb-empty-step-num">2</div>
                <b>Sinh đề bằng AI</b>
                <small>Vào AutoExam Studio → Sinh đề → Lưu ngân hàng</small>
              </div>
              <div className="qb-empty-step">
                <div className="qb-empty-step-num">3</div>
                <b>Nhập đề từ file</b>
                <small>PDF / Word / ảnh → tách câu → đề mềm</small>
              </div>
            </div>
          ) : null}

          <div className="qb-empty-actions">
            {list.length === 0 ? (
              <>
                <button
                  type="button"
                  className="vt-btn primary"
                  onClick={() => { setEditing(null); setShowForm(true); }}
                >
                  <IcoPlus size={14} /> Thêm câu hỏi đầu tiên
                </button>
                <button
                  type="button"
                  className="vt-btn"
                  onClick={() => setShowImporter(true)}
                >
                  <IcoUpload size={14} /> Nhập đề từ file
                </button>
                <button
                  type="button"
                  className="vt-btn"
                  onClick={() => { window.location.hash = 'classroom'; }}
                >
                  <IcoRocket size={14} /> Sinh đề bằng AI
                </button>
              </>
            ) : (
              <button
                type="button"
                className="vt-btn primary"
                onClick={handleClearFilters}
              >
                × Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="qb-list">
          {filtered.map((q) => (
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
                  {q.topicId && <span className="qb-meta-pill acc">{getTopicName(q.topicId, q.subject)}</span>}
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
          ))}
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

      {showImporter && (
        <ExamImporter
          onClose={() => setShowImporter(false)}
          onSaveToBank={handleImportToBank}
          onCreateSoftExam={handleCreateSoftExam}
          classes={classes}
          defaultSubject={filterSubject}
          defaultGrade={filterGrade}
        />
      )}
    </div>
  );
}