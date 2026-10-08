import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  IconQuestion, IconSearch, IconRefresh, IconTrash, IconEye, IconEdit, IconChevron, IconBack, IconClose, IconCheck,
} from './AdminIcons.jsx';
import {
  EmptyState, ErrorState, Modal, PageLoader, Spinner, useConfirm, useDebounced, useToast,
} from './AdminUI.jsx';
import { DIFFICULTIES, diffColor, diffName } from './adminConstants.js';
import { escapeLike, friendlyError } from './adminUtils.js';
import { topicGroups, topicName, UNCLASSIFIED } from '../../data/chemTopics.js';

const PAGE_SIZE = 20;

/* <option> chuyên đề nhóm theo lớp */
function TopicOptions() {
  return topicGroups().map((g) => (
    <optgroup key={g.grade} label={g.label}>
      {g.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </optgroup>
  ));
}

/* Ngân hàng câu hỏi: tìm kiếm / lọc / xem / xóa câu hỏi của mọi đề.
   (Trước đây file này là bản sao lỗi của ExamManager và import vòng sang AdminPanel.) */
export default function QuestionManager({ onOpenExam }) {
  const toast = useToast();
  const confirm = useConfirm();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [subjectId, setSubjectId] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [savingTopic, setSavingTopic] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const term = useDebounced(search.trim(), 350);
  const reqId = useRef(0);

  useEffect(() => {
    supabase.from('subjects').select('id, name').order('sort_order').then(({ data, error: e }) => {
      if (e) console.warn('[Questions] không tải được danh sách môn:', e.message);
      else setSubjects(data || []);
    });
  }, []);

  useEffect(() => { setPage(0); }, [term, difficulty, subjectId, topicFilter]);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('questions')
        .select(`
          id, question_number, content, explanation, difficulty, question_type, topic_id, exam_id,
          exams!inner(id, title, subject_id, grade:grades(name), subject:subjects(name)),
          answers(id, label, content, is_correct, sort_order)
        `, { count: 'exact' })
        .order('exam_id', { ascending: false })
        .order('question_number', { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (term) q = q.ilike('content', `%${escapeLike(term)}%`);
      if (difficulty !== 'all') q = q.eq('difficulty', difficulty);
      if (subjectId !== 'all') q = q.eq('exams.subject_id', Number(subjectId));
      if (topicFilter === UNCLASSIFIED) q = q.is('topic_id', null);
      else if (topicFilter !== 'all') q = q.eq('topic_id', topicFilter);

      const { data, count, error: e } = await q;
      if (e) throw e;
      if (my !== reqId.current) return; // đã có yêu cầu mới hơn
      setRows(data || []);
      setTotal(count ?? 0);
    } catch (e) {
      if (my !== reqId.current) return;
      console.error(e);
      setError(friendlyError(e));
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, [page, term, difficulty, subjectId, topicFilter]);

  useEffect(() => { load(); }, [load]);

  /* Đổi chuyên đề của một câu ngay trong ngân hàng câu hỏi */
  const handleTopicChange = async (q, value) => {
    const next = value || null;
    setSavingTopic(true);
    try {
      const { error: e } = await supabase.from('questions').update({ topic_id: next }).eq('id', q.id);
      if (e) throw e;
      setRows((rs) => rs.map((r) => (r.id === q.id ? { ...r, topic_id: next } : r)));
      setDetail((d) => (d && d.id === q.id ? { ...d, topic_id: next } : d));
      toast.success('Đã cập nhật chuyên đề');
    } catch (e) {
      toast.error('Không cập nhật được chuyên đề: ' + friendlyError(e));
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDelete = async (q) => {
    const ok = await confirm({
      title: 'Xóa câu hỏi',
      message: `Xóa câu ${q.question_number} khỏi đề "${q.exams?.title}"? Không thể hoàn tác.`,
      confirmText: 'Xóa câu',
      danger: true,
    });
    if (!ok) return;
    setDeleting(q.id);
    try {
      const { error: e } = await supabase.from('questions').delete().eq('id', q.id);
      if (e) throw e;
      toast.success('Đã xóa câu hỏi');
      setDetail(null);
      if (rows.length === 1 && page > 0) setPage((p) => p - 1);
      else load();
    } catch (e) {
      toast.error('Không xóa được: ' + friendlyError(e));
    } finally {
      setDeleting(null);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = term || difficulty !== 'all' || subjectId !== 'all' || topicFilter !== 'all';

  return (
    <div className="adl-panel">
      <header className="adl-panel-head">
        <h3><IconQuestion size={16} /><span>Ngân hàng câu hỏi ({total.toLocaleString('vi-VN')})</span></h3>
        <button type="button" className="adl-btn-icon" onClick={load} disabled={loading} title="Làm mới" aria-label="Làm mới">
          {loading ? <Spinner size={16} /> : <IconRefresh size={16} />}
        </button>
      </header>

      <div className="adl-filter-bar">
        <label className="adl-search">
          <IconSearch size={14} />
          <input type="search" placeholder="Tìm trong nội dung câu hỏi…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Tìm câu hỏi" />
        </label>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label="Lọc theo môn">
          <option value="all">Tất cả môn</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Lọc theo độ khó">
          <option value="all">Mọi độ khó</option>
          {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} aria-label="Lọc theo chuyên đề">
          <option value="all">Mọi chuyên đề</option>
          <option value={UNCLASSIFIED}>Chưa phân loại</option>
          <TopicOptions />
        </select>
        {hasFilter && (
          <button type="button" className="adl-btn-sm" onClick={() => { setSearch(''); setDifficulty('all'); setSubjectId('all'); setTopicFilter('all'); }}>
            <IconClose size={12} /> Xóa lọc
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && rows.length === 0 ? (
        <PageLoader text="Đang tải câu hỏi…" />
      ) : rows.length === 0 ? (
        <EmptyState Icon={IconQuestion} title={hasFilter ? 'Không có câu hỏi nào khớp bộ lọc' : 'Chưa có câu hỏi nào'}>
          {hasFilter ? 'Thử đổi từ khóa hoặc bỏ bớt bộ lọc.' : 'Câu hỏi xuất hiện ở đây sau khi bạn tạo đề.'}
        </EmptyState>
      ) : (
        <div className={'adl-table-wrap' + (loading ? ' is-loading' : '')}>
          <table className="adl-table">
            <thead>
              <tr><th style={{ width: 54 }}>Câu</th><th>Nội dung</th><th>Thuộc đề</th><th>Độ khó</th><th><span className="adl-sr">Thao tác</span></th></tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id}>
                  <td className="adl-table-id">{q.question_number}</td>
                  <td className="adl-td-title">
                    <b className="adl-clamp">{q.content}</b>
                    <small>{q.answers?.length || 0} đáp án{q.explanation ? ' · có lời giải' : ' · chưa có lời giải'} · {topicName(q.topic_id)}</small>
                  </td>
                  <td className="adl-td-title">
                    <b className="adl-clamp-1">{q.exams?.title}</b>
                    <small>{[q.exams?.subject?.name, q.exams?.grade?.name].filter(Boolean).join(' · ')}</small>
                  </td>
                  <td><span className="adl-diff" style={{ '--diff-color': diffColor(q.difficulty) }}>{diffName(q.difficulty)}</span></td>
                  <td className="adl-td-actions">
                    <button type="button" className="adl-icon-btn-sm" onClick={() => setDetail(q)} title="Xem chi tiết" aria-label="Xem chi tiết"><IconEye size={14} /></button>
                    {onOpenExam && (
                      <button type="button" className="adl-icon-btn-sm" onClick={() => onOpenExam(q.exam_id)} title="Mở đề để sửa" aria-label="Mở đề để sửa"><IconEdit size={14} /></button>
                    )}
                    <button type="button" className="adl-icon-btn-sm danger" onClick={() => handleDelete(q)} disabled={deleting === q.id} title="Xóa" aria-label="Xóa câu hỏi">
                      {deleting === q.id ? <Spinner size={13} /> : <IconTrash size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && !error && (
        <nav className="adl-pager" aria-label="Phân trang">
          <button type="button" className="adl-btn-sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}><IconBack size={13} /> Trước</button>
          <span>Trang <b>{page + 1}</b> / {pages}</span>
          <button type="button" className="adl-btn-sm" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1 || loading}>Sau <IconChevron size={13} /></button>
        </nav>
      )}

      {detail && (
        <Modal
          title={`Câu ${detail.question_number} — ${detail.exams?.title || ''}`}
          subtitle={`${diffName(detail.difficulty)} · ${[detail.exams?.subject?.name, detail.exams?.grade?.name].filter(Boolean).join(' · ')}`}
          onClose={() => setDetail(null)}
        >
          <p className="adl-detail-q">{detail.content}</p>
          <label className="adl-field adl-field-inline">
            <span>Chuyên đề</span>
            <select value={detail.topic_id || ''} disabled={savingTopic} onChange={(e) => handleTopicChange(detail, e.target.value)}>
              <option value="">Chưa phân loại</option>
              <TopicOptions />
            </select>
          </label>
          <ul className="adl-answer-list">
            {[...(detail.answers || [])].sort((a, b) => a.sort_order - b.sort_order).map((a) => (
              <li key={a.id} className={a.is_correct ? 'correct' : ''}>
                <b>{a.label}</b>
                <span>{a.content}</span>
                {a.is_correct && <IconCheck size={15} />}
              </li>
            ))}
          </ul>
          {detail.explanation ? (
            <div className="adl-explain"><small>Lời giải</small><p>{detail.explanation}</p></div>
          ) : (
            <p className="adl-hint">Câu này chưa có lời giải.</p>
          )}
          <div className="adl-modal-actions">
            {onOpenExam && <button type="button" className="adl-btn-outline" onClick={() => onOpenExam(detail.exam_id)}><IconEdit size={14} /> Mở đề để sửa</button>}
            <button type="button" className="adl-btn-danger" onClick={() => handleDelete(detail)}><IconTrash size={14} /> Xóa câu</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
