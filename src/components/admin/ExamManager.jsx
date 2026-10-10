/* ============================================================
   ExamManager.jsx — Quản lý đề thi (Vitality style)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import ExamEditor from './ExamEditor.jsx';
import AdminShell, { Topbar, Modal, ConfirmDialog, Donut, Avatar } from './AdminShell.jsx';
import {
  IconEdit, IconTrash, IconEye, IconEyeOff, IconPlus, IconExam, IconSearch, IconRefresh,
  IconClock, IconTrophy, IconQuestion, IconGrid, IconList, IconCopy, IconExternal,
  IconClose, IconBan, IconCheckCircle, IconDownload,
} from './AdminIcons.jsx';
import { DIFFICULTIES, diffColor, diffName } from './adminConstants.js';
import { friendlyError, formatDate } from './adminUtils.js';
import { duplicateExam } from './examService.js';

const PAGE = 24;
const questionCount = (e) => e.questions?.[0]?.count || 0;

export default function ExamManager({ onCreate, initialEditId = null }) {
  const [editingId, setEditingId] = useState(initialEditId);

  if (editingId) {
    return <ExamEditor examId={editingId} onBack={() => setEditingId(null)} />;
  }
  return <ExamList onEdit={setEditingId} onCreate={onCreate} />;
}

function ExamList({ onEdit, onCreate }) {
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

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);
  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

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

  /* Bộ lọc */
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
    if (q) arr = arr.filter((e) => (e.title || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q));
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
  const stats = useMemo(() => ({
    total: exams.length,
    published: exams.filter((e) => e.is_published).length,
    attempts: exams.reduce((s, e) => s + (e.attempt_count || 0), 0),
    questions: exams.reduce((s, e) => s + questionCount(e), 0),
  }), [exams]);

  /* Thao tác */
  const patchExam = (id, patch) => setExams((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const handleDelete = (exam) => {
    setConfirm({
      title: 'Xóa đề thi',
      body: `Xóa đề "${exam.title}" cùng ${questionCount(exam)} câu hỏi? Không thể hoàn tác.`,
      okLabel: 'Xóa đề',
      danger: true,
      onOk: async () => {
        try {
          const { error } = await supabase.from('exams').delete().eq('id', exam.id);
          if (error) throw error;
          setExams((es) => es.filter((e) => e.id !== exam.id));
          say('Đã xóa đề');
        } catch (e) {
          say('Không xóa được: ' + friendlyError(e));
        }
      },
    });
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;
    setConfirm({
      title: `Xóa ${ids.length} đề đã chọn`,
      body: 'Toàn bộ câu hỏi của các đề này cũng bị xóa. Không thể hoàn tác.',
      okLabel: `Xóa ${ids.length} đề`,
      danger: true,
      onOk: async () => {
        setBusy(true);
        try {
          const { error } = await supabase.from('exams').delete().in('id', ids);
          if (error) throw error;
          setExams((es) => es.filter((e) => !selected.has(e.id)));
          setSelected(new Set());
          say(`Đã xóa ${ids.length} đề`);
        } catch (e) {
          say('Không xóa được: ' + friendlyError(e));
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleBulkPublish = async (publish) => {
    const ids = [...selected];
    if (!ids.length) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('exams').update({ is_published: publish }).in('id', ids);
      if (error) throw error;
      setExams((es) => es.map((e) => (selected.has(e.id) ? { ...e, is_published: publish } : e)));
      say(`Đã ${publish ? 'hiện' : 'ẩn'} ${ids.length} đề`);
      setSelected(new Set());
    } catch (e) {
      say('Không cập nhật được: ' + friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePublish = async (exam) => {
    const next = !exam.is_published;
    if (next && questionCount(exam) === 0) {
      setConfirm({
        title: 'Đề chưa có câu hỏi',
        body: 'Hiện đề trống cho học sinh? Nên thêm câu hỏi trước khi hiện.',
        okLabel: 'Vẫn hiện',
        onOk: () => doTogglePublish(exam, next),
      });
      return;
    }
    doTogglePublish(exam, next);
  };

  const doTogglePublish = async (exam, next) => {
    patchExam(exam.id, { is_published: next });
    const { error } = await supabase.from('exams').update({ is_published: next }).eq('id', exam.id);
    if (error) {
      patchExam(exam.id, { is_published: !next });
      say('Không đổi được trạng thái: ' + friendlyError(error));
    }
  };

  const toggleSelect = (id) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

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
      say('Không đổi được tên: ' + friendlyError(error));
    } else {
      say('Đã đổi tên đề');
    }
  };

  const handleDuplicate = (exam) => {
    setConfirm({
      title: 'Nhân bản đề',
      body: `Tạo bản sao của "${exam.title}" (${questionCount(exam)} câu). Bản sao sẽ ở trạng thái ẩn.`,
      okLabel: 'Nhân bản',
      onOk: async () => {
        setDuplicatingId(exam.id);
        try {
          await duplicateExam(exam.id);
          say('Đã nhân bản đề');
          await load();
        } catch (e) {
          say('Không nhân bản được: ' + friendlyError(e));
        } finally {
          setDuplicatingId(null);
        }
      },
    });
  };

  const handleExport = () => {
    if (!filtered.length) { say('Chưa có đề để xuất'); return; }
    const rows = [['Tiêu đề', 'Lớp', 'Môn', 'Loại', 'Độ khó', 'Thời gian', 'Số câu', 'Lượt làm', 'Trạng thái', 'Ngày tạo']];
    filtered.forEach((e) => rows.push([
      e.title, e.grade?.name || '', e.subject?.name || '',
      e.exam_type || '', diffName(e.difficulty), e.duration || '',
      questionCount(e), e.attempt_count || 0,
      e.is_published ? 'Đang hiện' : 'Đã ẩn', formatDate(e.created_at),
    ]));
    // dùng downloadCsv từ AdminShell
    import('./AdminShell.jsx').then(({ downloadCsv }) => {
      downloadCsv(`de-thi-${new Date().toISOString().slice(0, 10)}.csv`, rows);
      say('Đã xuất ' + filtered.length + ' đề');
    });
  };

  const tabs = [
    { key: 'all', label: 'Tất cả', count: stats.total },
    { key: 'published', label: 'Đang hiện', count: stats.published },
    { key: 'draft', label: 'Đã ẩn', count: stats.total - stats.published },
    { key: 'empty', label: 'Chưa có câu', count: exams.filter((e) => questionCount(e) === 0).length },
  ];

  /* ============ RENDER ============ */
  return (
    <AdminShell active="exams" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Đề thi"
        subtitle={`${filtered.length} đề · ${stats.questions} câu hỏi`}
        onSearch={setSearch}
        search={search}
        placeholder="Tìm theo tiêu đề, mô tả…"
      />

      {/* ===== HERO ===== */}
      <div className="vt-row-hero">
        <div className="vt-hero">
          <div className="vt-hero-left">
            <span className="vt-hero-label">Tổng số đề</span>
            <div className="vt-hero-num">
              <b>{stats.total}</b>
              <span>đề</span>
            </div>
            <dl className="vt-hero-facts">
              <div><dt>Đang hiện</dt><dd>{stats.published}</dd></div>
              <div><dt>Tổng câu hỏi</dt><dd>{stats.questions}</dd></div>
              <div><dt>Lượt làm</dt><dd>{stats.attempts.toLocaleString('vi-VN')}</dd></div>
            </dl>
            <div className="vt-hero-btns">
              <button type="button" className="vt-hero-btn" onClick={onCreate}>
                <IconPlus size={14} /> Tạo đề mới
              </button>
              <button type="button" className="vt-hero-btn ghost" onClick={handleExport}>
                <IconDownload size={14} /> Xuất CSV
              </button>
            </div>
          </div>
          <div className="vt-hero-right">
            <div className="vt-hero-chart-head">
              <b>Trạng thái</b>
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginTop: '.5rem' }}>
              <Donut value={stats.published} max={Math.max(stats.total, 1)} size={130} stroke={12}>
                <strong>{stats.total ? Math.round((stats.published / stats.total) * 100) : 0}<sup>%</sup></strong>
                <small>đang hiện</small>
              </Donut>
              <ul className="vt-rank" style={{ flex: 1 }}>
                <li><span className="vt-rank-n r1">✓</span><b>Đang hiện</b><span className="vt-rank-score">{stats.published}</span></li>
                <li><span className="vt-rank-n">×</span><b>Đã ẩn</b><span className="vt-rank-score">{stats.total - stats.published}</span></li>
                <li><span className="vt-rank-n r2">!</span><b>Chưa có câu</b><span className="vt-rank-score">{exams.filter((e) => questionCount(e) === 0).length}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="vt-card soft">
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            style={{ padding: '.5rem .9rem', borderRadius: 999, border: '1px solid var(--soft)', background: 'var(--bg)', color: 'var(--ink)' }}
          >
            <option value="all">Tất cả môn</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            style={{ padding: '.5rem .9rem', borderRadius: 999, border: '1px solid var(--soft)', background: 'var(--bg)', color: 'var(--ink)' }}
          >
            <option value="all">Tất cả lớp</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '.5rem .9rem', borderRadius: 999, border: '1px solid var(--soft)', background: 'var(--bg)', color: 'var(--ink)' }}
          >
            <option value="all">Mọi trạng thái</option>
            <option value="published">Đang hiện</option>
            <option value="draft">Đã ẩn</option>
            <option value="empty">Chưa có câu hỏi</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '.5rem .9rem', borderRadius: 999, border: '1px solid var(--soft)', background: 'var(--bg)', color: 'var(--ink)' }}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="popular">Nhiều lượt làm</option>
            <option value="title">Tiêu đề A → Z</option>
          </select>

          <div className="vt-seg" role="group" aria-label="Kiểu hiển thị">
            <button type="button" className={viewMode === 'grid' ? 'on' : ''} onClick={() => setViewMode('grid')} title="Dạng lưới"><IconGrid size={15} /></button>
            <button type="button" className={viewMode === 'table' ? 'on' : ''} onClick={() => setViewMode('table')} title="Dạng bảng"><IconList size={15} /></button>
          </div>

          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
        </div>

        {selected.size > 0 && (
          <div style={{ marginTop: '.8rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '.85rem' }}>Đã chọn <b>{selected.size}</b> đề</span>
            <button type="button" className="vt-btn sm" disabled={busy} onClick={() => handleBulkPublish(true)}>
              <IconEye size={13} /> Hiện
            </button>
            <button type="button" className="vt-btn sm" disabled={busy} onClick={() => handleBulkPublish(false)}>
              <IconEyeOff size={13} /> Ẩn
            </button>
            <button type="button" className="vt-btn sm danger" disabled={busy} onClick={handleBulkDelete}>
              <IconTrash size={13} /> Xóa
            </button>
            <button type="button" className="vt-btn sm" onClick={() => setSelected(new Set())}>
              <IconClose size={12} /> Bỏ chọn
            </button>
          </div>
        )}
      </div>

      {/* ===== DANH SÁCH ===== */}
      {loadError ? (
        <div className="vt-empty">
          <span><IconExam size={30} /></span>
          <h3>Không tải được dữ liệu</h3>
          <p>{loadError}</p>
          <button type="button" className="vt-btn primary" onClick={load}>Thử lại</button>
        </div>
      ) : loading && exams.length === 0 ? (
        <div className="vt-loading">
          <div className="page-loader-spinner" />
          <p>Đang tải đề thi…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="vt-empty">
          <span><IconExam size={30} /></span>
          <h3>{exams.length === 0 ? 'Chưa có đề thi nào' : 'Không có đề phù hợp'}</h3>
          <p>{exams.length === 0 ? 'Bạn có thể tạo thủ công, import JSON hoặc để AI sinh câu hỏi.' : 'Thử đổi bộ lọc hoặc từ khóa.'}</p>
          {exams.length === 0 && (
            <button type="button" className="vt-btn primary" onClick={onCreate}>
              <IconPlus size={14} /> Tạo đề đầu tiên
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="vt-grid">
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
        <div className="vt-card">
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every((e) => selected.has(e.id))}
                      onChange={() => {
                        const all = filtered.every((e) => selected.has(e.id));
                        setSelected(all ? new Set() : new Set(filtered.map((e) => e.id)));
                      }}
                    />
                  </th>
                  <th>Tiêu đề</th>
                  <th>Lớp</th>
                  <th>Môn</th>
                  <th>Câu</th>
                  <th>Lượt làm</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 130 }} />
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} style={selected.has(e.id) ? { background: 'var(--vt-tint)' } : undefined}>
                    <td>
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} />
                    </td>
                    <td>
                      <b style={{ display: 'block', fontSize: '.92rem' }}>{e.title}</b>
                      {e.description && <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>{e.description}</small>}
                    </td>
                    <td>{e.grade?.name || '—'}</td>
                    <td>{e.subject?.name || '—'}</td>
                    <td style={{ color: questionCount(e) === 0 ? 'var(--vt-amber)' : undefined }}>{questionCount(e)}</td>
                    <td>{(e.attempt_count || 0).toLocaleString('vi-VN')}</td>
                    <td>
                      <button
                        type="button"
                        className={'vt-chip ' + (e.is_published ? 'ready' : 'closed')}
                        onClick={() => handleTogglePublish(e)}
                        style={{ border: 0, cursor: 'pointer' }}
                      >
                        {e.is_published ? 'Đang hiện' : 'Đã ẩn'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button type="button" className="vt-icon-btn" onClick={() => onEdit(e.id)} title="Sửa">
                          <IconEdit size={14} />
                        </button>
                        <button type="button" className="vt-icon-btn" onClick={() => handleDuplicate(e)} disabled={duplicatingId === e.id} title="Nhân bản">
                          <IconCopy size={14} />
                        </button>
                        <a className="vt-icon-btn" href={`#exam/${e.id}`} target="_blank" rel="noopener noreferrer" title="Xem trước">
                          <IconExternal size={14} />
                        </a>
                        <button type="button" className="vt-icon-btn danger" onClick={() => handleDelete(e)} title="Xóa">
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length > shown.length && (
        <div style={{ textAlign: 'center' }}>
          <button type="button" className="vt-btn" onClick={() => setVisible((v) => v + PAGE)}>
            Hiện thêm ({filtered.length - shown.length} đề)
          </button>
        </div>
      )}

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

/* ============================================================
   ExamCard
   ============================================================ */
function ExamCard({
  exam, selected, editing, quickTitle, quickRef, duplicating,
  onQuickTitle, onQuickKey, onQuickBlur, onStartQuickEdit,
  onToggleSelect, onEdit, onDuplicate, onDelete, onTogglePublish,
}) {
  const color = diffColor(exam.difficulty);
  const diff = DIFFICULTIES.find((d) => d.id === exam.difficulty);
  const qCount = questionCount(exam);

  return (
    <article
      className="vt-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '.7rem',
        position: 'relative',
        borderLeft: exam.is_published ? undefined : '4px dashed var(--mut)',
        boxShadow: selected ? '0 0 0 2px var(--acc)' : undefined,
      }}
    >
      {/* Header với diff + toggle hiện/ẩn */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
        <span
          className="vt-chip"
          style={{ background: color, color: '#fff' }}
        >
          {diff?.short || exam.difficulty || '—'}
        </span>
        <button
          type="button"
          className={'vt-chip ' + (exam.is_published ? 'ready' : 'closed')}
          onClick={onTogglePublish}
          style={{ border: 0, cursor: 'pointer' }}
          title={exam.is_published ? 'Đang hiện — bấm để ẩn' : 'Đang ẩn — bấm để hiện'}
        >
          {exam.is_published ? <IconEye size={12} /> : <IconBan size={12} />}
          <span>{exam.is_published ? 'Hiện' : 'Ẩn'}</span>
        </button>
      </div>

      {/* Checkbox chọn */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, display: selected ? 'block' : 'none' }}
        aria-label={`Chọn ${exam.title}`}
      />

      {/* Tiêu đề */}
      {editing ? (
        <input
          ref={quickRef}
          value={quickTitle}
          onChange={(e) => onQuickTitle(e.target.value)}
          onBlur={onQuickBlur}
          onKeyDown={onQuickKey}
          style={{
            padding: '.4rem .6rem',
            borderRadius: 8,
            border: '1.5px solid var(--acc)',
            background: 'var(--bg)',
            color: 'var(--ink)',
            font: '700 .95rem var(--sans)',
          }}
        />
      ) : (
        <h3
          onDoubleClick={onStartQuickEdit}
          title="Nhấn đôi để đổi tên"
          style={{
            margin: 0,
            font: '800 1.05rem var(--sans)',
            letterSpacing: '-.02em',
            cursor: 'text',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {exam.title}
        </h3>
      )}

      {exam.description && (
        <p className="vt-muted" style={{ margin: 0, fontSize: '.8rem', lineHeight: 1.4 }}>
          {exam.description}
        </p>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', fontSize: '.72rem', color: 'var(--mut)' }}>
        {[exam.grade?.name, exam.subject?.name, `${exam.duration || '—'} phút`].filter(Boolean).map((t, i) => (
          <span key={i} style={{ padding: '.15rem .5rem', background: 'var(--vt-tint)', borderRadius: 999 }}>{t}</span>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', paddingTop: '.5rem', borderTop: '1px solid var(--soft)' }}>
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center', flex: 1 }}>
          <IconQuestion size={13} style={{ color: qCount === 0 ? 'var(--vt-amber)' : 'var(--acc)' }} />
          <b style={{ font: '700 .85rem var(--sans)' }}>{qCount}</b>
          <small style={{ color: 'var(--mut)', fontSize: '.7rem' }}>câu</small>
        </div>
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center', flex: 1 }}>
          <IconTrophy size={13} style={{ color: 'var(--acc)' }} />
          <b style={{ font: '700 .85rem var(--sans)' }}>{(exam.attempt_count || 0).toLocaleString('vi-VN')}</b>
          <small style={{ color: 'var(--mut)', fontSize: '.7rem' }}>lượt</small>
        </div>
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center', color: 'var(--mut)', fontSize: '.7rem' }}>
          <IconClock size={12} />
          <span>{formatDate(exam.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '.4rem', marginTop: 'auto' }}>
        <button type="button" className="vt-btn sm primary" onClick={onEdit} style={{ flex: 1 }}>
          <IconEdit size={13} /> Sửa
        </button>
        <button type="button" className="vt-icon-btn" onClick={onDuplicate} disabled={duplicating} title="Nhân bản">
          {duplicating ? '…' : <IconCopy size={14} />}
        </button>
        <a className="vt-icon-btn" href={`#exam/${exam.id}`} target="_blank" rel="noopener noreferrer" title="Xem trước">
          <IconExternal size={14} />
        </a>
        <button type="button" className="vt-icon-btn danger" onClick={onDelete} title="Xóa">
          <IconTrash size={14} />
        </button>
      </div>
    </article>
  );
}