import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { markMastered, unsaveQuestion, saveQuestion } from '../lib/examApi.js';
import {
  IcoBookOpen, IcoBookMark, IcoX, IcoCheck, IcoCheckCircle, IcoSearch,
  IcoClose, IcoTrash, IcoStar, IcoCopy, IcoDownload, IcoUpload, IcoSort,
  IcoGrid, IcoList, IcoShuffle, IcoPlay, IcoArrowUp, IcoSparkle,
  IcoBulb, IcoStats, IcoFire, IcoTag, IcoEye, IcoInfo,
} from './NotebookIcons.jsx';
import NotebookGuide from './NotebookGuide.jsx';
import { topicName, UNCLASSIFIED } from '../data/chemTopics.js';
import './notebook-v2.css';
import './notebook-guide.css';

const DIFFICULTIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'easy', label: 'Dễ', color: '#b7dc9a' },
  { id: 'medium', label: 'Trung bình', color: '#ffc46b' },
  { id: 'hard', label: 'Khó', color: '#ff9b85' },
  { id: 'extreme', label: 'Rất khó', color: '#f2b6c6' },
];

const DIFF_LABELS = { easy: 'Dễ', medium: 'TB', hard: 'Khó', extreme: 'Rất khó' };
const DIFF_COLORS = { easy: '#b7dc9a', medium: '#ffc46b', hard: '#ff9b85', extreme: '#f2b6c6' };

export default function WrongNotebook() {
  const { user } = useAuth();
  const [wrongQs, setWrongQs] = useState([]);
  const [savedQs, setSavedQs] = useState([]);
  const [tab, setTab] = useState('wrong');
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('list');

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Modals
  const [detail, setDetail] = useState(null);
  const [quizMode, setQuizMode] = useState(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizPicked, setQuizPicked] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  // Guide
  const [guideOpen, setGuideOpen] = useState(false);

  // Feedback
  const [toast, setToast] = useState(null);

  const uid = user?.uid || user?.id;

  const showToast = (text, type = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2400);
  };

  const load = async () => {
    if (!uid) { setLoading(false); return; }
    try {
      setLoading(true);

      const [wrongRes, savedRes] = await Promise.all([
        supabase
          .from('wrong_questions')
          .select(`
            id, wrong_count, mastered, last_wrong_at,
            question:questions(
              id, question_number, content, explanation, difficulty, topic_id,
              exam:exams(id, title, subject:subjects(name)),
              answers:answers(id, label, content, is_correct)
            )
          `)
          .eq('user_id', uid)
          .eq('mastered', false)
          .order('last_wrong_at', { ascending: false }),

        supabase
          .from('saved_questions')
          .select(`
            id, note, saved_at,
            question:questions(
              id, question_number, content, explanation, difficulty, topic_id,
              exam:exams(id, title, subject:subjects(name)),
              answers:answers(id, label, content, is_correct)
            )
          `)
          .eq('user_id', uid)
          .order('saved_at', { ascending: false }),
      ]);

      setWrongQs(wrongRes.data || []);
      setSavedQs(savedRes.data || []);
    } catch (e) {
      console.error(e);
      showToast('Lỗi tải dữ liệu', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [uid]);

  /* ============ FILTER + SORT ============ */
  const items = tab === 'wrong' ? wrongQs : savedQs;

  /* Các chuyên đề có trong danh sách hiện tại, nhiều câu nhất lên đầu */
  const topicCounts = useMemo(() => {
    const m = new Map();
    for (const it of items) {
      const id = it.question?.topic_id || UNCLASSIFIED;
      m.set(id, (m.get(id) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    let arr = items;

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((it) => {
        const question = it.question;
        if (!question) return false;
        if (question.content?.toLowerCase().includes(q)) return true;
        if (question.explanation?.toLowerCase().includes(q)) return true;
        if (question.exam?.title?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    if (filterDiff !== 'all') {
      arr = arr.filter((it) => it.question?.difficulty === filterDiff);
    }

    if (filterTopic !== 'all') {
      arr = arr.filter((it) => (it.question?.topic_id || UNCLASSIFIED) === filterTopic);
    }

    arr = [...arr].sort((a, b) => {
      const qa = a.question;
      const qb = b.question;
      switch (sortBy) {
        case 'recent':
          return (b.last_wrong_at || b.saved_at || 0) - (a.last_wrong_at || a.saved_at || 0);
        case 'oldest':
          return (a.last_wrong_at || a.saved_at || 0) - (b.last_wrong_at || b.saved_at || 0);
        case 'wrongCount':
          return (b.wrong_count || 0) - (a.wrong_count || 0);
        case 'difficulty': {
          const order = { easy: 1, medium: 2, hard: 3, extreme: 4 };
          return (order[qb?.difficulty] || 0) - (order[qa?.difficulty] || 0);
        }
        default: return 0;
      }
    });

    return arr;
  }, [items, search, filterDiff, filterTopic, sortBy]);

  /* ============ STATS ============ */
  const stats = useMemo(() => {
    const totalWrong = wrongQs.length;
    const totalSaved = savedQs.length;
    const totalWrongCount = wrongQs.reduce((s, x) => s + (x.wrong_count || 0), 0);
    return { totalWrong, totalSaved, totalWrongCount };
  }, [wrongQs, savedQs]);

  /* ============ ACTIONS ============ */
  const handleMastered = async (questionId) => {
    try {
      await markMastered(uid, questionId);
      setWrongQs((qs) => qs.filter((q) => q.question.id !== questionId));
      showToast('Đã đánh dấu hiểu rồi');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const handleUnsave = async (questionId) => {
    try {
      await unsaveQuestion(uid, questionId);
      setSavedQs((qs) => qs.filter((q) => q.question.id !== questionId));
      showToast('Đã bỏ lưu');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const handleSave = async (questionId) => {
    try {
      await saveQuestion(uid, questionId);
      showToast('Đã lưu vào sổ tay');
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const handleBulkMastered = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Đánh dấu ${selected.size} câu đã hiểu?`)) return;
    const count = selected.size;
    try {
      await Promise.all([...selected].map((qid) => markMastered(uid, qid)));
      setWrongQs((qs) => qs.filter((q) => !selected.has(q.question.id)));
      setSelected(new Set());
      showToast(`Đã xử lý ${count} câu`);
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const handleBulkUnsave = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Bỏ lưu ${selected.size} câu?`)) return;
    const count = selected.size;
    try {
      await Promise.all([...selected].map((qid) => unsaveQuestion(uid, qid)));
      setSavedQs((qs) => qs.filter((q) => !selected.has(q.question.id)));
      setSelected(new Set());
      showToast(`Đã bỏ lưu ${count} câu`);
    } catch (e) {
      showToast('Lỗi: ' + e.message, 'err');
    }
  };

  const toggleSelect = (qid) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(qid)) n.delete(qid);
      else n.add(qid);
      return n;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((x) => x.question.id)));
  };

  /* ============ COPY / EXPORT / IMPORT ============ */
  const copyItem = async (item) => {
    const q = item.question;
    const text = `Câu hỏi: ${q.content}\n\n${q.answers?.map((a) => `${a.label}. ${a.content}${a.is_correct ? ' ✓' : ''}`).join('\n')}\n\nLời giải: ${q.explanation || '(không có)'}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Đã sao chép');
    } catch {
      showToast('Không sao chép được', 'err');
    }
  };

  const exportJSON = () => {
    const data = JSON.stringify({ wrong: wrongQs, saved: savedQs }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notebook-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải backup');
  };

  /* ============ QUIZ MODE ============ */
  const startQuiz = () => {
    const pool = filtered.filter((x) => x.question?.answers?.length > 0);
    if (pool.length < 1) {
      showToast('Không có câu nào để làm quiz', 'err');
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQuizMode(shuffled);
    setQuizIdx(0);
    setQuizPicked(null);
    setQuizScore(0);
  };

  const quizCurrent = quizMode?.[quizIdx];
  const quizDone = quizMode && quizIdx >= quizMode.length;

  const handleQuizPick = (answerId) => {
    if (quizPicked) return;
    setQuizPicked(answerId);
    const correct = quizCurrent.question.answers.find((a) => a.is_correct);
    if (answerId === correct?.id) setQuizScore((s) => s + 1);
  };

  const nextQuiz = () => {
    setQuizIdx((i) => i + 1);
    setQuizPicked(null);
  };

  const closeQuiz = () => {
    setQuizMode(null);
    setQuizIdx(0);
    setQuizPicked(null);
    setQuizScore(0);
  };

  /* ============ RENDER ============ */
  if (loading) {
    return (
      <div className="nb-loading">
        <div className="nb-loading-spinner" />
        <p>Đang tải sổ tay…</p>
      </div>
    );
  }

  return (
    <div className="nb">
      {/* ============ HEADER ============ */}
      <header className="nb-head">
        <div className="nb-head-l">
          <h1 className="nb-title">Sổ tay của tôi</h1>
          <p className="nb-sub">Ôn lại câu sai và câu đã lưu để nhớ lâu hơn</p>
        </div>

        <div className="nb-head-r">
          <button
            type="button"
            className="nb-btn nb-btn-ghost"
            onClick={() => setGuideOpen(true)}
            title="Xem hướng dẫn sử dụng"
          >
            <IcoInfo size={16} />
            <span>Hướng dẫn</span>
          </button>

          <button
            type="button"
            className="nb-btn nb-btn-ghost"
            onClick={exportJSON}
            title="Tải backup JSON"
          >
            <IcoDownload size={16} />
            <span>Backup</span>
          </button>

          <button
            type="button"
            className="nb-btn nb-btn-primary"
            onClick={startQuiz}
            disabled={filtered.length === 0}
          >
            <IcoPlay size={16} />
            <span>Luyện tập</span>
          </button>
        </div>
      </header>

      {/* ============ TABS ============ */}
      <nav className="nb-tabs">
        <button
          type="button"
          className={'nb-tab' + (tab === 'wrong' ? ' on' : '')}
          onClick={() => { setTab('wrong'); setSelected(new Set()); setFilterTopic('all'); }}
        >
          <IcoX size={16} />
          <span>Câu sai</span>
          <em>{wrongQs.length}</em>
        </button>
        <button
          type="button"
          className={'nb-tab' + (tab === 'saved' ? ' on' : '')}
          onClick={() => { setTab('saved'); setSelected(new Set()); setFilterTopic('all'); }}
        >
          <IcoStar size={16} filled />
          <span>Đã lưu</span>
          <em>{savedQs.length}</em>
        </button>
      </nav>

      {/* ============ STATS ============ */}
      <div className="nb-stats">
        <div className="nb-stat">
          <span className="nb-stat-ico"><IcoBookOpen size={18} /></span>
          <div>
            <b>{stats.totalWrong}</b>
            <small>Câu sai</small>
          </div>
        </div>
        <div className="nb-stat">
          <span className="nb-stat-ico"><IcoBookMark size={18} filled /></span>
          <div>
            <b>{stats.totalSaved}</b>
            <small>Đã lưu</small>
          </div>
        </div>
        <div className="nb-stat">
          <span className="nb-stat-ico"><IcoFire size={18} /></span>
          <div>
            <b>{stats.totalWrongCount}</b>
            <small>Lần sai</small>
          </div>
        </div>
        <div className="nb-stat">
          <span className="nb-stat-ico"><IcoStats size={18} /></span>
          <div>
            <b>{filtered.length}</b>
            <small>Đang xem</small>
          </div>
        </div>
      </div>

      {/* ============ TOOLBAR ============ */}
      <div className="nb-toolbar">
        <label className="nb-search">
          <IcoSearch size={16} />
          <input
            type="search"
            placeholder="Tìm câu hỏi, lời giải, tên đề…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Xóa">
              <IcoClose size={14} />
            </button>
          )}
        </label>

        <label className="nb-select">
          <IcoSort size={14} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="wrongCount">Sai nhiều</option>
            <option value="difficulty">Độ khó cao</option>
          </select>
        </label>

        <div className="nb-seg">
          <button
            type="button"
            className={viewMode === 'list' ? 'on' : ''}
            onClick={() => setViewMode('list')}
            title="Danh sách"
          >
            <IcoList size={15} />
          </button>
          <button
            type="button"
            className={viewMode === 'grid' ? 'on' : ''}
            onClick={() => setViewMode('grid')}
            title="Lưới"
          >
            <IcoGrid size={15} />
          </button>
        </div>
      </div>

      {/* ============ DIFFICULTY FILTERS ============ */}
      <div className="nb-filters">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            type="button"
            className={'nb-chip' + (filterDiff === d.id ? ' on' : '')}
            style={filterDiff === d.id && d.color ? { background: d.color, color: '#111', borderColor: 'transparent' } : undefined}
            onClick={() => setFilterDiff(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* ============ TOPIC FILTERS ============ */}
      {topicCounts.some(([id]) => id !== UNCLASSIFIED) && (
        <div className="nb-filters" aria-label="Lọc theo chuyên đề">
          <button
            type="button"
            className={'nb-chip' + (filterTopic === 'all' ? ' on' : '')}
            onClick={() => setFilterTopic('all')}
          >
            Mọi chuyên đề
          </button>
          {topicCounts.map(([id, n]) => (
            <button
              key={id}
              type="button"
              className={'nb-chip' + (filterTopic === id ? ' on' : '')}
              onClick={() => setFilterTopic(id)}
            >
              {topicName(id)} · {n}
            </button>
          ))}
        </div>
      )}

      {/* ============ BULK ACTIONS ============ */}
      {selected.size > 0 && (
        <div className="nb-bulk">
          <span className="nb-bulk-info">
            Đã chọn <b>{selected.size}</b> câu
          </span>
          <div className="nb-bulk-actions">
            {tab === 'wrong' && (
              <button className="nb-btn nb-btn-ghost" onClick={handleBulkMastered}>
                <IcoCheckCircle size={15} />
                Đã hiểu
              </button>
            )}
            {tab === 'saved' && (
              <button className="nb-btn nb-btn-ghost" onClick={handleBulkUnsave}>
                <IcoTrash size={15} />
                Bỏ lưu
              </button>
            )}
            <button
              className="nb-btn nb-btn-ghost"
              onClick={() => setSelected(new Set())}
            >
              <IcoClose size={15} />
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* ============ LIST ============ */}
      {filtered.length === 0 ? (
        <div className="nb-empty">
          <span className="nb-empty-ico">
            <IcoBookOpen size={32} />
          </span>
          <h3>
            {items.length === 0
              ? (tab === 'wrong' ? 'Chưa có câu sai nào' : 'Chưa có câu nào được lưu')
              : 'Không tìm thấy câu nào phù hợp'}
          </h3>
          <p>
            {items.length === 0
              ? (tab === 'wrong'
                  ? 'Làm bài để hệ thống ghi lại câu sai giúp bạn ôn lại.'
                  : 'Bấm biểu tượng ngôi sao trên câu hỏi để lưu vào đây.')
              : 'Thử xóa bộ lọc hoặc tìm từ khóa khác.'}
          </p>
          {items.length > 0 && (
            <button
              className="nb-btn nb-btn-ghost"
              onClick={() => { setSearch(''); setFilterDiff('all'); setFilterTopic('all'); }}
            >
              <IcoClose size={15} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="nb-selectall">
            <label>
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={selectAll}
              />
              <span>Chọn tất cả ({filtered.length})</span>
            </label>
          </div>

          <ul className={'nb-list ' + viewMode}>
            {filtered.map((item) => {
              const q = item.question;
              const isSelected = selected.has(q.id);
              const diff = q.difficulty || 'medium';

              return (
                <li
                  key={item.id}
                  className={'nb-card' + (isSelected ? ' selected' : '')}
                  style={{ '--nb-diff': DIFF_COLORS[diff] || '#c9c5b8' }}
                >
                  <header className="nb-card-head">
                    <label className="nb-check">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(q.id)}
                      />
                    </label>

                    <div className="nb-card-badges">
                      {tab === 'wrong' && item.wrong_count > 0 && (
                        <span className="nb-badge wrong">
                          <IcoX size={12} />
                          Sai {item.wrong_count} lần
                        </span>
                      )}
                      {tab === 'saved' && (
                        <span className="nb-badge saved">
                          <IcoStar size={12} filled />
                          Đã lưu
                        </span>
                      )}
                      <span className="nb-badge diff" style={{ background: DIFF_COLORS[diff] }}>
                        {DIFF_LABELS[diff] || diff}
                      </span>
                      {q.exam?.subject?.name && (
                        <span className="nb-badge subject">
                          {q.exam.subject.name}
                        </span>
                      )}
                      {q.topic_id && (
                        <span className="nb-badge subject">
                          {topicName(q.topic_id)}
                        </span>
                      )}
                    </div>

                    <div className="nb-card-actions">
                      <button
                        type="button"
                        className="nb-icon"
                        onClick={() => setDetail(item)}
                        title="Xem chi tiết"
                      >
                        <IcoEye size={14} />
                      </button>
                      <button
                        type="button"
                        className="nb-icon"
                        onClick={() => copyItem(item)}
                        title="Sao chép"
                      >
                        <IcoCopy size={14} />
                      </button>
                      {tab === 'wrong' && (
                        <button
                          type="button"
                          className="nb-icon success"
                          onClick={() => handleMastered(q.id)}
                          title="Đã hiểu"
                        >
                          <IcoCheckCircle size={14} />
                        </button>
                      )}
                      {tab === 'saved' && (
                        <button
                          type="button"
                          className="nb-icon danger"
                          onClick={() => handleUnsave(q.id)}
                          title="Bỏ lưu"
                        >
                          <IcoTrash size={14} />
                        </button>
                      )}
                    </div>
                  </header>

                  <div
                    className="nb-card-body"
                    onClick={() => setDetail(item)}
                  >
                    <p className="nb-q">{q.content}</p>

                    <div className="nb-answers">
                      {q.answers?.map((a) => (
                        <div
                          key={a.id}
                          className={'nb-answer' + (a.is_correct ? ' correct' : '')}
                        >
                          <b>{a.label}.</b>
                          <span>{a.content}</span>
                          {a.is_correct && (
                            <span className="nb-answer-check">
                              <IcoCheck size={12} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="nb-explain">
                        <IcoBulb size={14} />
                        <div>
                          <b>Lời giải</b>
                          <p>{q.explanation}</p>
                        </div>
                      </div>
                    )}

                    {q.exam?.title && (
                      <div className="nb-source">
                        <IcoTag size={13} />
                        {q.exam.title}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {detail && (
        <div className="nb-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
          <div className="nb-detail">
            <header className="nb-detail-head">
              <div className="nb-detail-badges">
                <span className="nb-badge diff" style={{ background: DIFF_COLORS[detail.question.difficulty] }}>
                  {DIFF_LABELS[detail.question.difficulty] || 'TB'}
                </span>
                {tab === 'wrong' && detail.wrong_count > 0 && (
                  <span className="nb-badge wrong">
                    <IcoX size={12} /> Sai {detail.wrong_count} lần
                  </span>
                )}
                {tab === 'saved' && (
                  <span className="nb-badge saved">
                    <IcoStar size={12} filled /> Đã lưu
                  </span>
                )}
              </div>
              <button
                type="button"
                className="nb-icon"
                onClick={() => setDetail(null)}
                aria-label="Đóng"
              >
                <IcoClose size={16} />
              </button>
            </header>

            <div className="nb-detail-body">
              <h2 className="nb-detail-q">{detail.question.content}</h2>

              <div className="nb-answers">
                {detail.question.answers?.map((a) => (
                  <div
                    key={a.id}
                    className={'nb-answer' + (a.is_correct ? ' correct' : '')}
                  >
                    <b>{a.label}.</b>
                    <span>{a.content}</span>
                    {a.is_correct && (
                      <span className="nb-answer-check">
                        <IcoCheck size={12} />
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {detail.question.explanation && (
                <div className="nb-explain">
                  <IcoBulb size={16} />
                  <div>
                    <b>Lời giải</b>
                    <p>{detail.question.explanation}</p>
                  </div>
                </div>
              )}

              {detail.question.exam?.title && (
                <div className="nb-source">
                  <IcoTag size={14} />
                  {detail.question.exam.title}
                </div>
              )}
            </div>

            <footer className="nb-detail-foot">
              <button
                type="button"
                className="nb-btn nb-btn-ghost"
                onClick={() => copyItem(detail)}
              >
                <IcoCopy size={15} />
                Sao chép
              </button>
              {tab === 'wrong' && (
                <button
                  type="button"
                  className="nb-btn nb-btn-primary"
                  onClick={() => {
                    handleMastered(detail.question.id);
                    setDetail(null);
                  }}
                >
                  <IcoCheckCircle size={15} />
                  Đã hiểu
                </button>
              )}
              {tab === 'saved' && (
                <button
                  type="button"
                  className="nb-btn nb-btn-danger"
                  onClick={() => {
                    handleUnsave(detail.question.id);
                    setDetail(null);
                  }}
                >
                  <IcoTrash size={15} />
                  Bỏ lưu
                </button>
              )}
            </footer>
          </div>
        </div>
      )}

      {/* ============ QUIZ MODE ============ */}
      {quizMode && (
        <div className="nb-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeQuiz()}>
          <div className="nb-quiz">
            {quizDone ? (
              <div className="nb-quiz-result">
                <span className="nb-quiz-result-ico">
                  <IcoSparkle size={48} />
                </span>
                <h2>Hoàn thành!</h2>
                <p className="nb-quiz-score">
                  Bạn trả lời đúng <b>{quizScore}</b> / <b>{quizMode.length}</b> câu
                </p>
                <div className="nb-quiz-actions">
                  <button className="nb-btn nb-btn-ghost" onClick={closeQuiz}>
                    Đóng
                  </button>
                  <button
                    className="nb-btn nb-btn-primary"
                    onClick={startQuiz}
                  >
                    <IcoShuffle size={15} />
                    Làm lại
                  </button>
                </div>
              </div>
            ) : (
              <>
                <header className="nb-quiz-head">
                  <div className="nb-quiz-progress">
                    <span>Câu {quizIdx + 1} / {quizMode.length}</span>
                    <div className="nb-quiz-bar">
                      <i style={{ width: `${((quizIdx + 1) / quizMode.length) * 100}%` }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="nb-icon"
                    onClick={closeQuiz}
                    aria-label="Đóng"
                  >
                    <IcoClose size={16} />
                  </button>
                </header>

                <div className="nb-quiz-body">
                  <p className="nb-quiz-q">{quizCurrent.question.content}</p>

                  <div className="nb-quiz-answers">
                    {quizCurrent.question.answers?.map((a) => {
                      const isCorrect = a.is_correct;
                      const isPicked = quizPicked === a.id;
                      let cls = 'nb-quiz-answer';
                      if (quizPicked) {
                        if (isCorrect) cls += ' correct';
                        else if (isPicked) cls += ' wrong';
                        else cls += ' dim';
                      }
                      return (
                        <button
                          key={a.id}
                          type="button"
                          className={cls}
                          disabled={!!quizPicked}
                          onClick={() => handleQuizPick(a.id)}
                        >
                          <b>{a.label}.</b>
                          <span>{a.content}</span>
                          {quizPicked && isCorrect && (
                            <span className="nb-quiz-answer-check">
                              <IcoCheck size={14} />
                            </span>
                          )}
                          {quizPicked && isPicked && !isCorrect && (
                            <span className="nb-quiz-answer-check wrong">
                              <IcoX size={14} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizPicked && quizCurrent.question.explanation && (
                    <div className="nb-explain">
                      <IcoBulb size={16} />
                      <div>
                        <b>Lời giải</b>
                        <p>{quizCurrent.question.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>

                {quizPicked && (
                  <footer className="nb-quiz-foot">
                    <button
                      type="button"
                      className="nb-btn nb-btn-primary"
                      onClick={nextQuiz}
                    >
                      {quizIdx === quizMode.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
                      <IcoArrowUp size={15} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                  </footer>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ============ TOAST ============ */}
      {toast && (
        <div className={'nb-toast ' + (toast.type === 'err' ? 'err' : 'ok')}>
          {toast.type === 'err' ? <IcoX size={14} /> : <IcoCheck size={14} />}
          {toast.text}
        </div>
      )}

      {/* ============ GUIDE ============ */}
      <NotebookGuide forceOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}