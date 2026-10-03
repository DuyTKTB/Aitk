import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import ExamEditor from './ExamEditor.jsx';
import {
  IconEdit, IconTrash, IconEye, IconEyeOff, IconPlus, IconExam, IconSearch, IconRefresh,
  IconClock, IconTrophy, IconQuestion, IconGrid, IconList, IconCopy, IconExternal, IconClose, IconBan,
} from './AdminIcons.jsx';
import { EmptyState, ErrorState, PageLoader, Spinner, useConfirm, useToast } from './AdminUI.jsx';
import { DIFFICULTIES, diffColor } from './adminConstants.js';
import { friendlyError, formatDate } from './adminUtils.js';
import { duplicateExam } from './examService.js';

const PAGE = 24;

export default function ExamManager({ onCreate, initialEditId = null }) {
  const [editingId, setEditingId] = useState(initialEditId);

  if (editingId) {
    return <ExamEditor examId={editingId} onBack={() => setEditingId(null)} />;
  }
  return <ExamList onEdit={setEditingId} onCreate={onCreate} />;
}

const questionCount = (e) => e.questions?.[0]?.count || 0;

function ExamList({ onEdit, onCreate }) {
  const toast = useToast();
  const confirm = useConfirm();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState(() => new Set());

  const [quickEdit, setQuickEdit] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');
  const quickRef = useRef(null);
  const cancelQuick = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id, title, description, exam_type, duration, difficulty,
          source, attempt_count, is_published, created_at,
          grade:grades(id, name),
          subject:subjects(id, code, name),
          questions(count)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExams(data || []);
      setSelected(new Set());
    } catch (e) {
      console.error(e);
      setLoadError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setVisible(PAGE); }, [search, filterSubject, filterGrade, filterStatus, sortBy, viewMode]);

  /* ============ BỘ LỌC ============ */
  const subjects = useMemo(() => {
    const m = new Map();
    exams.forEach((e) => e.subject?.id != null && m.set(e.subject.id, e.subject.name));
    return [...m].map(([id, name]) => ({ id, name }));
  }, [exams]);

  const grades = useMemo(() => {
    const m = new Map();
    exams.forEach((e) => e.grade?.id != null && m.set(e.grade.id, e.grade.name));
    return [...m].map(([id, name]) => ({ id, name }));
  }, [exams]);

  const filtered = useMemo(() => {
    let arr = exams;
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (e) => (e.title || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q),
      );
    }
    if (filterSubject !== 'all') arr = arr.filter((e) => String(e.subject?.id) === filterSubject);
    if (filterGrade !== 'all') arr = arr.filter((e) => String(e.grade?.id) === filterGrade);
    if (filterStatus === 'published') arr = arr.filter((e) => e.is_published);
    if (filterStatus === 'draft') arr = arr.filter((e) => !e.is_published);
    if (filterStatus === 'empty') arr = arr.filter((e) => questionCount(e) === 0);

    const copy = [...arr];
    const byDate = (a, b) => new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'newest') copy.sort(byDate);
    if (sortBy === 'oldest') copy.sort((a, b) => -byDate(a, b));
    if (sortBy === 'popular') copy.sort((a, b) => (b.attempt_count || 0) - (a.attempt_count || 0));
    if (sortBy === 'title') copy.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'));
    return copy;
  }, [exams, search, filterSubject, filterGrade, filterStatus, sortBy]);

  const shown = filtered.slice(0, visible);
  const hasFilter = search || filterSubject !== 'all' || filterGrade !== 'all' || filterStatus !== 'all';
  const clearFilters = () => {
    setSearch(''); setFilterSubject('all'); setFilterGrade('all'); setFilterStatus('all');
  };

  const stats = useMemo(() => ({
    total: exams.length,
    published: exams.filter((e) => e.is_published).length,
    attempts: exams.reduce((s, e) => s + (e.attempt_count || 0), 0),
    questions: exams.reduce((s, e) => s + questionCount(e), 0),
  }), [exams]);

  /* ============ THAO TÁC ============ */
  const patchExam = (id, patch) => setExams((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const handleDelete = async (exam) => {
    const ok = await confirm({
      title: 'Xóa đề thi',
      message: `Xóa đề "${exam.title}" cùng ${questionCount(exam)} câu hỏi? Không thể hoàn tác.`,
      confirmText: 'Xóa đề',
      danger: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from('exams').delete().eq('id', exam.id);
      if (error) throw error;
      setExams((es) => es.filter((e) => e.id !== exam.id));
      setSelected((s) => { const n = new Set(s); n.delete(exam.id); return n; });
      toast.success('Đã xóa đề');
    } catch (e) {
      toast.error('Không xóa được đề: ' + friendlyError(e));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    const ok = await confirm({
      title: `Xóa ${ids.length} đề đã chọn`,
      message: 'Toàn bộ câu hỏi của các đề này cũng bị xóa. Không thể hoàn tác.',
      confirmText: `Xóa ${ids.length} đề`,
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('exams').delete().in('id', ids);
      if (error) throw error;
      setExams((es) => es.filter((e) => !selected.has(e.id)));
      setSelected(new Set());
      toast.success(`Đã xóa ${ids.length} đề`);
    } catch (e) {
      toast.error('Không xóa được: ' + friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleBulkPublish = async (publish) => {
    const ids = [...selected];
    if (!ids.length) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('exams').update({ is_published: publish }).in('id', ids);
      if (error) throw error;
      setExams((es) => es.map((e) => (selected.has(e.id) ? { ...e, is_published: publish } : e)));
      toast.success(`Đã ${publish ? 'hiện' : 'ẩn'} ${ids.length} đề`);
      setSelected(new Set());
    } catch (e) {
      toast.error('Không cập nhật được: ' + friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePublish = async (exam) => {
    const next = !exam.is_published;
    if (next && questionCount(exam) === 0) {
      const ok = await confirm({
        title: 'Đề chưa có câu hỏi',
        message: 'Hiện đề trống cho học sinh? Nên thêm câu hỏi trước khi hiện.',
        confirmText: 'Vẫn hiện',
      });
      if (!ok) return;
    }
    patchExam(exam.id, { is_published: next });
    const { error } = await supabase.from('exams').update({ is_published: next }).eq('id', exam.id);
    if (error) {
      patchExam(exam.id, { is_published: !next });
      toast.error('Không đổi được trạng thái: ' + friendlyError(error));
    }
  };

  const toggleSelect = (id) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const selectAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((e) => e.id)));

  /* ----- đổi tên nhanh (nhấn đôi tiêu đề) ----- */
  const startQuickEdit = (exam) => {
    cancelQuick.current = false;
    setQuickEdit(exam.id);
    setQuickTitle(exam.title);
    setTimeout(() => quickRef.current?.focus(), 30);
  };

  const finishQuickEdit = async () => {
    const id = quickEdit;
    if (!id) return;
    const title = quickTitle.trim();
    const original = exams.find((e) => e.id === id)?.title;
    setQuickEdit(null);
    if (cancelQuick.current || !title || title === original) return;
    patchExam(id, { title });
    const { error } = await supabase.from('exams').update({ title }).eq('id', id);
    if (error) {
      patchExam(id, { title: original });
      toast.error('Không đổi được tên: ' + friendlyError(error));
    } else {
      toast.success('Đã đổi tên đề');
    }
  };

  const handleDuplicate = async (exam) => {
    const ok = await confirm({
      title: 'Nhân bản đề',
      message: `Tạo bản sao của "${exam.title}" (${questionCount(exam)} câu). Bản sao sẽ ở trạng thái ẩn.`,
      confirmText: 'Nhân bản',
    });
    if (!ok) return;
    setDuplicatingId(exam.id);
    try {
      await duplicateExam(exam.id);
      toast.success('Đã nhân bản đề');
      await load();
    } catch (e) {
      console.error(e);
      toast.error('Không nhân bản được: ' + friendlyError(e));
    } finally {
      setDuplicatingId(null);
    }
  };

  /* ============ RENDER ============ */
  if (loading && exams.length === 0) return <PageLoader text="Đang tải đề thi…" />;
  if (loadError && exams.length === 0) return <ErrorState message={loadError} onRetry={load} />;

  return (
    <div className="adl-examlist">
      <section className="adl-stats adl-stats-compact" aria-label="Thống kê đề thi">
        <MiniStat Icon={IconExam} label="Tổng đề" value={stats.total} color="var(--post, #6fb35a)" />
        <MiniStat Icon={IconEye} label="Đang hiện" value={stats.published} color="var(--metalloid, #8a8f98)" />
        <MiniStat Icon={IconTrophy} label="Lượt làm" value={stats.attempts} color="var(--alkaline, #e0a43a)" />
        <MiniStat Icon={IconQuestion} label="Câu hỏi" value={stats.questions} color="var(--nonmetal, #3aa6c7)" />
      </section>

      <section className="adl-panel">
        <header className="adl-panel-head">
          <h3><IconExam size={16} /><span>Danh sách đề thi ({filtered.length})</span></h3>
          <div className="adl-list-actions">
            <div className="adl-view-toggle" role="group" aria-label="Kiểu hiển thị">
              <button type="button" className={viewMode === 'grid' ? 'on' : ''} onClick={() => setViewMode('grid')} title="Dạng lưới" aria-pressed={viewMode === 'grid'}><IconGrid size={15} /></button>
              <button type="button" className={viewMode === 'table' ? 'on' : ''} onClick={() => setViewMode('table')} title="Dạng bảng" aria-pressed={viewMode === 'table'}><IconList size={15} /></button>
            </div>
            <button type="button" className="adl-btn-icon" onClick={load} title="Làm mới" aria-label="Làm mới danh sách" disabled={loading}>
              {loading ? <Spinner size={16} /> : <IconRefresh size={16} />}
            </button>
            <button type="button" className="adl-btn-primary" onClick={onCreate}><IconPlus size={14} /> Tạo đề</button>
          </div>
        </header>

        <div className="adl-filter-bar">
          <label className="adl-search">
            <IconSearch size={14} />
            <input type="search" placeholder="Tìm theo tiêu đề, mô tả…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Tìm đề thi" />
          </label>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} aria-label="Lọc theo môn">
            <option value="all">Tất cả môn</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} aria-label="Lọc theo lớp">
            <option value="all">Tất cả lớp</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Lọc theo trạng thái">
            <option value="all">Mọi trạng thái</option>
            <option value="published">Đang hiện</option>
            <option value="draft">Đã ẩn</option>
            <option value="empty">Chưa có câu hỏi</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sắp xếp">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="popular">Nhiều lượt làm</option>
            <option value="title">Tiêu đề A → Z</option>
          </select>
          {hasFilter && (
            <button type="button" className="adl-btn-sm" onClick={clearFilters}><IconClose size={12} /> Xóa lọc</button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="adl-bulk-bar" role="region" aria-label="Thao tác hàng loạt">
            <span>Đã chọn <b>{selected.size}</b> đề</span>
            <div className="adl-bulk-actions">
              <button type="button" className="adl-btn-sm" disabled={busy} onClick={() => handleBulkPublish(true)}><IconEye size={13} /> Hiện</button>
              <button type="button" className="adl-btn-sm" disabled={busy} onClick={() => handleBulkPublish(false)}><IconEyeOff size={13} /> Ẩn</button>
              <button type="button" className="adl-btn-sm danger" disabled={busy} onClick={handleBulkDelete}><IconTrash size={13} /> Xóa</button>
              <button type="button" className="adl-btn-sm" onClick={() => setSelected(new Set())}><IconClose size={12} /> Bỏ chọn</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          hasFilter ? (
            <EmptyState Icon={IconSearch} title="Không có đề nào khớp bộ lọc" action={<button type="button" className="adl-btn-outline" onClick={clearFilters}>Xóa bộ lọc</button>} />
          ) : (
            <EmptyState Icon={IconExam} title="Chưa có đề thi nào" action={<button type="button" className="adl-btn-primary" onClick={onCreate}><IconPlus size={14} /> Tạo đề đầu tiên</button>}>
              Bạn có thể tạo thủ công, import từ JSON hoặc để AI sinh câu hỏi.
            </EmptyState>
          )
        ) : viewMode === 'grid' ? (
          <div className="adl-exam-grid">
            {shown.map((e) => (
              <ExamCard
                key={e.id}
                exam={e}
                selected={selected.has(e.id)}
                editing={quickEdit === e.id}
                quickTitle={quickTitle}
                quickRef={quickRef}
                duplicating={duplicatingId === e.id}
                onQuickTitle={setQuickTitle}
                onQuickKey={(ev) => {
                  if (ev.key === 'Enter') ev.currentTarget.blur();
                  if (ev.key === 'Escape') { cancelQuick.current = true; ev.currentTarget.blur(); }
                }}
                onQuickBlur={finishQuickEdit}
                onStartQuickEdit={() => startQuickEdit(e)}
                onToggleSelect={() => toggleSelect(e.id)}
                onEdit={() => onEdit(e.id)}
                onDuplicate={() => handleDuplicate(e)}
                onDelete={() => handleDelete(e)}
                onTogglePublish={() => handleTogglePublish(e)}
              />
            ))}
          </div>
        ) : (
          <div className="adl-table-wrap">
            <table className="adl-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={allSelected} onChange={selectAll} aria-label="Chọn tất cả" />
                  </th>
                  <th>Tiêu đề</th><th>Lớp</th><th>Môn</th><th>Câu</th><th>Lượt làm</th><th>Trạng thái</th><th><span className="adl-sr">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} className={selected.has(e.id) ? 'selected' : ''}>
                    <td><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} aria-label={`Chọn ${e.title}`} /></td>
                    <td className="adl-td-title"><b>{e.title}</b>{e.description && <small>{e.description}</small>}</td>
                    <td>{e.grade?.name || '—'}</td>
                    <td>{e.subject?.name || '—'}</td>
                    <td className={questionCount(e) === 0 ? 'adl-warn-text' : ''}>{questionCount(e)}</td>
                    <td>{(e.attempt_count || 0).toLocaleString('vi-VN')}</td>
                    <td>
                      <button type="button" className={'adl-pill ' + (e.is_published ? 'on' : 'off')} onClick={() => handleTogglePublish(e)}>
                        {e.is_published ? 'Đang hiện' : 'Đã ẩn'}
                      </button>
                    </td>
                    <td className="adl-td-actions">
                      <button type="button" className="adl-icon-btn-sm" onClick={() => onEdit(e.id)} title="Sửa" aria-label="Sửa"><IconEdit size={14} /></button>
                      <button type="button" className="adl-icon-btn-sm" onClick={() => handleDuplicate(e)} disabled={duplicatingId === e.id} title="Nhân bản" aria-label="Nhân bản">
                        {duplicatingId === e.id ? <Spinner size={13} /> : <IconCopy size={14} />}
                      </button>
                      <a className="adl-icon-btn-sm" href={`#exam/${e.id}`} target="_blank" rel="noopener noreferrer" title="Xem trước" aria-label="Xem trước"><IconExternal size={14} /></a>
                      <button type="button" className="adl-icon-btn-sm danger" onClick={() => handleDelete(e)} title="Xóa" aria-label="Xóa"><IconTrash size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > shown.length && (
          <div className="adl-more">
            <button type="button" className="adl-btn-outline" onClick={() => setVisible((v) => v + PAGE)}>
              Hiện thêm ({filtered.length - shown.length} đề)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function MiniStat({ Icon, label, value, color }) {
  return (
    <div className="adl-stat static" style={{ '--stat-color': color }}>
      <span className="adl-stat-ico"><Icon size={20} /></span>
      <div className="adl-stat-info">
        <small>{label}</small>
        <b>{value.toLocaleString('vi-VN')}</b>
      </div>
    </div>
  );
}

function ExamCard({
  exam, selected, editing, quickTitle, quickRef, duplicating,
  onQuickTitle, onQuickKey, onQuickBlur, onStartQuickEdit,
  onToggleSelect, onEdit, onDuplicate, onDelete, onTogglePublish,
}) {
  const color = diffColor(exam.difficulty);
  const diff = DIFFICULTIES.find((d) => d.id === exam.difficulty);
  const qCount = questionCount(exam);

  return (
    <article className={'adl-exam-card' + (selected ? ' selected' : '') + (exam.is_published ? '' : ' is-draft')}>
      <div className="adl-exam-banner" style={{ '--diff-color': color }}>
        <span className="adl-exam-banner-diff">{diff?.short || exam.difficulty || '—'}</span>
        <button
          type="button"
          className={'adl-exam-banner-pill ' + (exam.is_published ? 'on' : 'off')}
          onClick={onTogglePublish}
          title={exam.is_published ? 'Đang hiện — bấm để ẩn' : 'Đang ẩn — bấm để hiện'}
          aria-label={exam.is_published ? 'Ẩn đề' : 'Hiện đề'}
        >
          {exam.is_published ? <IconEye size={14} /> : <IconBan size={14} />}
          <span>{exam.is_published ? 'Hiện' : 'Ẩn'}</span>
        </button>
      </div>

      <input type="checkbox" className="adl-exam-check" checked={selected} onChange={onToggleSelect} aria-label={`Chọn ${exam.title}`} />

      <div className="adl-exam-title-wrap">
        {editing ? (
          <input
            ref={quickRef}
            className="adl-exam-title-input"
            value={quickTitle}
            onChange={(e) => onQuickTitle(e.target.value)}
            onBlur={onQuickBlur}
            onKeyDown={onQuickKey}
            aria-label="Tên đề"
          />
        ) : (
          <h3 className="adl-exam-title" onDoubleClick={onStartQuickEdit} title="Nhấn đôi để đổi tên">{exam.title}</h3>
        )}
      </div>

      {exam.description && <p className="adl-exam-desc">{exam.description}</p>}

      <div className="adl-exam-meta">
        {[exam.grade?.name, exam.subject?.name, `${exam.duration || '—'} phút`].filter(Boolean).map((t, i) => <span key={i}>{t}</span>)}
      </div>

      <div className="adl-exam-stats">
        <div className={qCount === 0 ? 'warn' : ''}><IconQuestion size={14} /><b>{qCount}</b><small>câu</small></div>
        <div><IconTrophy size={14} /><b>{(exam.attempt_count || 0).toLocaleString('vi-VN')}</b><small>lượt</small></div>
        <div><IconClock size={14} /><small>{formatDate(exam.created_at)}</small></div>
      </div>

      <div className="adl-exam-actions">
        <button type="button" className="adl-btn-sm primary" onClick={onEdit}><IconEdit size={13} /> Sửa</button>
        <button type="button" className="adl-btn-sm" onClick={onDuplicate} disabled={duplicating} title="Nhân bản" aria-label="Nhân bản">
          {duplicating ? <Spinner size={13} /> : <IconCopy size={13} />}
        </button>
        <a className="adl-btn-sm" href={`#exam/${exam.id}`} target="_blank" rel="noopener noreferrer" title="Xem trước" aria-label="Xem trước"><IconExternal size={13} /></a>
        <button type="button" className="adl-btn-sm danger" onClick={onDelete} title="Xóa" aria-label="Xóa"><IconTrash size={13} /></button>
      </div>
    </article>
  );
}
