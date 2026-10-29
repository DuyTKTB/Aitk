/* ============================================================
   ExamManager.jsx — Quản lý đề thi (Compact & Full Actions)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import ExamEditor from './ExamEditor.jsx';
import AdminShell, { Topbar, downloadCsv } from './AdminShell.jsx';
import { Modal, ConfirmDialog } from './AdminUI.jsx';
import {
  IconEdit, IconTrash, IconEye, IconEyeOff, IconPlus, IconExam, IconRefresh,
  IconClock, IconTrophy, IconQuestion, IconGrid, IconList, IconCopy, IconExternal,
  IconClose, IconBan, IconDownload, IconCode, IconSparkle,
} from './AdminIcons.jsx';
import { DIFFICULTIES, diffColor, diffName } from './adminConstants.js';
import { downloadFile, friendlyError, formatDate } from './adminUtils.js';
import { duplicateExam, exportExamData } from './examService.js';
import {
  getAllVirtualExams,
  publishExamToVirtual,
  unpublishExamFromVirtual,
  isExamInVirtualRoom,
  getCustomVirtualExams,
} from '../../data/virtualExamsBank.js';

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
  const [exportingId, setExportingId] = useState(null);

  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState(() => new Set());

  const [virtualExams, setVirtualExams] = useState(() => getAllVirtualExams());
  const [publishModalExam, setPublishModalExam] = useState(null);
  const [createVirtualModalOpen, setCreateVirtualModalOpen] = useState(false);

  useEffect(() => {
    const syncVex = () => setVirtualExams(getAllVirtualExams());
    window.addEventListener('elec-virtual-exams-changed', syncVex);
    return () => window.removeEventListener('elec-virtual-exams-changed', syncVex);
  }, []);

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
    toastTimer.current = setTimeout(() => setToast(null), 2600);
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
    if (filterStatus === 'virtual') arr = arr.filter((e) => isExamInVirtualRoom(e.id));
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
  }, [exams, search, filterSubject, filterGrade, filterStatus, sortBy, virtualExams]);

  const shown = filtered.slice(0, visible);
  const stats = useMemo(() => ({
    total: exams.length,
    virtual: exams.filter((e) => isExamInVirtualRoom(e.id)).length,
    published: exams.filter((e) => e.is_published).length,
    empty: exams.filter((e) => questionCount(e) === 0).length,
    attempts: exams.reduce((s, e) => s + (e.attempt_count || 0), 0),
    questions: exams.reduce((s, e) => s + questionCount(e), 0),
  }), [exams, virtualExams]);

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

  const handleExportExamJson = async (exam) => {
    setExportingId(exam.id);
    try {
      const payload = await exportExamData(exam.id);
      const slug = String(exam.title || 'de-thi')
        .toLowerCase()
        .replace(/[^a-z0-9\u00C0-\u024f\u1e00-\u1eff]+/g, '-')
        .slice(0, 48);
      downloadFile(`${slug}-${exam.id}.json`, JSON.stringify(payload, null, 2));
      say(`Đã xuất JSON "${exam.title}"`);
    } catch (e) {
      say('Không xuất được JSON: ' + friendlyError(e));
    } finally {
      setExportingId(null);
    }
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
    downloadCsv(`de-thi-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    say('Đã xuất ' + filtered.length + ' đề');
  };

  const tabs = [
    { key: 'all',       label: 'Tất cả',          count: stats.total },
    { key: 'virtual',   label: '⭐ Phòng thi ảo',  count: stats.virtual },
    { key: 'published', label: 'Đang hiện',       count: stats.published },
    { key: 'draft',     label: 'Đã ẩn',           count: stats.total - stats.published },
    { key: 'empty',     label: 'Chưa có câu',     count: stats.empty },
  ];

  const handleOpenPublishModal = (exam) => setPublishModalExam(exam);

  const handleUnpublishVirtual = (exam) => {
    setConfirm({
      title: 'Gỡ khỏi Phòng thi ảo',
      body: `Gỡ đề "${exam.title}" khỏi Phòng thi ảo của học sinh? Đề trong kho hệ thống vẫn được giữ nguyên.`,
      okLabel: 'Gỡ đề',
      danger: true,
      onOk: () => {
        unpublishExamFromVirtual(exam.id);
        setVirtualExams(getAllVirtualExams());
        say('Đã gỡ đề khỏi Phòng thi ảo');
      },
    });
  };

  return (
    <AdminShell active="exams" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Quản lý Đề thi"
        subtitle={`${filtered.length} đề phù hợp · ${stats.virtual} đề Phòng thi ảo · ${stats.questions.toLocaleString('vi-VN')} câu hỏi`}
        tabs={tabs}
        active={filterStatus}
        onTab={setFilterStatus}
        onSearch={setSearch}
        search={search}
        placeholder="Tìm theo tiêu đề, mô tả…"
      />

      {/* ===== COMPACT KPI STRIP ===== */}
      <div className="ad-kpi-strip ad-kpi-strip--4">
        <div className="vt-card ad-mini-kpi">
          <span className="ad-mini-kpi-label">Tổng số đề</span>
          <b className="ad-mini-kpi-val">{stats.total}</b>
          <small className="ad-mini-kpi-sub">{stats.published} đang hiện · {stats.total - stats.published} đang ẩn</small>
        </div>
        <div className="vt-card ad-mini-kpi" style={{ borderLeft: '3px solid #7c3aed' }}>
          <span className="ad-mini-kpi-label" style={{ color: '#7c3aed' }}>⭐ Phòng thi ảo</span>
          <b className="ad-mini-kpi-val" style={{ color: '#7c3aed' }}>{stats.virtual}</b>
          <small className="ad-mini-kpi-sub">{stats.virtual > 0 ? `${stats.virtual} đề trực tuyến #virtual-exams` : 'Chưa có đề cấp'}</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span className="ad-mini-kpi-label">Tổng câu hỏi</span>
          <b className="ad-mini-kpi-val">{stats.questions.toLocaleString('vi-VN')}</b>
          <small className="ad-mini-kpi-sub">{stats.empty > 0 ? `${stats.empty} đề chưa có câu` : 'Mọi đề đều có câu'}</small>
        </div>
        <div className="vt-card ad-mini-kpi">
          <span className="ad-mini-kpi-label">Tổng lượt làm</span>
          <b className="ad-mini-kpi-val">{stats.attempts.toLocaleString('vi-VN')}</b>
          <small className="ad-mini-kpi-sub">Trung bình {stats.total ? Math.round(stats.attempts / stats.total) : 0} lượt/đề</small>
        </div>
      </div>

      {/* ===== FILTER BAR & ACTION TOOLBAR ===== */}
      <div className="vt-card soft" style={{ padding: '0.75rem 1rem' }}>
        <div className="vt-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="vt-btn sm primary"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 0, padding: '0.45rem 0.85rem' }}
            onClick={() => setCreateVirtualModalOpen(true)}
            title="Tạo đề thi mới và cấp trực tiếp vào Phòng thi ảo cho học sinh"
          >
            <IconSparkle size={13} /> ⭐ Cấp Đề Phòng Thi Ảo
          </button>
          <button type="button" className="vt-btn sm primary" onClick={onCreate}>
            <IconPlus size={13} /> Tạo đề hệ thống
          </button>

          <span style={{ width: 1, height: 22, background: 'var(--soft)', margin: '0 4px' }} />

          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="vt-select-pill">
            <option value="all">Tất cả môn</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="vt-select-pill">
            <option value="all">Tất cả lớp</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="vt-select-pill">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="popular">Nhiều lượt làm</option>
            <option value="title">Tiêu đề A → Z</option>
          </select>

          <button type="button" className="vt-btn sm" onClick={handleExport} style={{ marginLeft: 'auto' }}>
            <IconDownload size={13} /> Xuất CSV
          </button>

          <div className="vt-seg" role="group" aria-label="Kiểu hiển thị">
            <button type="button" className={viewMode === 'grid' ? 'on' : ''} onClick={() => setViewMode('grid')} title="Dạng lưới"><IconGrid size={15} /></button>
            <button type="button" className={viewMode === 'table' ? 'on' : ''} onClick={() => setViewMode('table')} title="Dạng bảng"><IconList size={15} /></button>
          </div>

          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? '…' : 'Làm mới'}
          </button>
        </div>

        {selected.size > 0 && (
          <div className="vt-bulk-bar">
            <span>Đã chọn <b>{selected.size}</b> đề</span>
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
        <div className="vt-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="vt-card vt-skeleton-card">
              <div className="vt-skeleton-line" style={{ width: '40%' }} />
              <div className="vt-skeleton-line" style={{ width: '80%', height: 20 }} />
              <div className="vt-skeleton-line" style={{ width: '60%' }} />
            </div>
          ))}
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
              exporting={exportingId === e.id}
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
              onExportJson={() => handleExportExamJson(e)}
              onDelete={() => handleDelete(e)}
              onTogglePublish={() => handleTogglePublish(e)}
              onPublishVirtual={() => handleOpenPublishModal(e)}
              onUnpublishVirtual={() => handleUnpublishVirtual(e)}
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
                  <th>Phòng ảo</th>
                  <th>Lớp</th>
                  <th>Môn</th>
                  <th>Câu</th>
                  <th>Lượt làm</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 220 }} />
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => {
                  const isVirtual = isExamInVirtualRoom(e.id);
                  const customVirtual = getCustomVirtualExams().find((v) => v.id === e.id || v.adminExamId === e.id);
                  const tier = customVirtual?.tier || 'PRO';

                  return (
                    <tr key={e.id} className={selected.has(e.id) ? 'vt-row-selected' : ''}>
                      <td><input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} /></td>
                      <td>
                        <b style={{ display: 'block', fontSize: '.9rem' }}>{e.title}</b>
                        {e.description && <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>{e.description}</small>}
                      </td>
                      <td>
                        {isVirtual ? (
                          <span className={`ad-vex-badge ad-vex-badge--${tier.toLowerCase()}`}>
                            ⭐ {tier}
                          </span>
                        ) : (
                          <span style={{ fontSize: '.72rem', color: 'var(--mut)' }}>Chưa cấp</span>
                        )}
                      </td>
                      <td>{e.grade?.name || '—'}</td>
                      <td>{e.subject?.name || '—'}</td>
                      <td style={{ color: questionCount(e) === 0 ? 'var(--vt-amber)' : undefined, fontWeight: 700 }}>{questionCount(e)}</td>
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
                        <div className="vt-row-actions" style={{ gap: 4 }}>
                          {isVirtual ? (
                            <button type="button" className="vt-btn sm" onClick={() => handleUnpublishVirtual(e)} style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', color: '#ef4444' }}>
                              Gỡ
                            </button>
                          ) : (
                            <button type="button" className="vt-btn sm" onClick={() => handleOpenPublishModal(e)} style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', color: '#7c3aed' }}>
                              ⭐ Cấp
                            </button>
                          )}
                          <button type="button" className="vt-icon-btn" onClick={() => onEdit(e.id)} title="Sửa"><IconEdit size={14} /></button>
                          <button type="button" className="vt-icon-btn" onClick={() => handleExportExamJson(e)} disabled={exportingId === e.id} title="Xuất JSON"><IconCode size={14} /></button>
                          <button type="button" className="vt-icon-btn" onClick={() => handleDuplicate(e)} disabled={duplicatingId === e.id} title="Nhân bản"><IconCopy size={14} /></button>
                          <a className="vt-icon-btn" href="#virtual-exams" title="Phòng thi ảo"><IconExternal size={14} /></a>
                          <button type="button" className="vt-icon-btn danger" onClick={() => handleDelete(e)} title="Xóa"><IconTrash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {publishModalExam && (
        <PublishToVirtualModal
          exam={publishModalExam}
          onClose={() => setPublishModalExam(null)}
          onPublished={(res) => {
            setPublishModalExam(null);
            setVirtualExams(getAllVirtualExams());
            say(`⭐ Đã cấp đề "${res.title}" lên Phòng thi ảo`);
          }}
        />
      )}

      {createVirtualModalOpen && (
        <CreateVirtualExamModal
          onClose={() => setCreateVirtualModalOpen(false)}
          onCreated={(created) => {
            setCreateVirtualModalOpen(false);
            setVirtualExams(getAllVirtualExams());
            say(`⭐ Đã tạo & cấp đề "${created.title}" lên Phòng thi ảo!`);
            load();
          }}
        />
      )}
    </AdminShell>
  );
}

/* ============================================================
   ExamCard
   ============================================================ */
function ExamCard({
  exam, selected, editing, quickTitle, quickRef, duplicating, exporting,
  onQuickTitle, onQuickKey, onQuickBlur, onStartQuickEdit,
  onToggleSelect, onEdit, onDuplicate, onExportJson, onDelete, onTogglePublish,
  onPublishVirtual, onUnpublishVirtual,
}) {
  const color = diffColor(exam.difficulty);
  const diff = DIFFICULTIES.find((d) => d.id === exam.difficulty);
  const qCount = questionCount(exam);
  const isVirtual = isExamInVirtualRoom(exam.id);
  const customVirtual = getCustomVirtualExams().find((v) => v.id === exam.id || v.adminExamId === exam.id);
  const tier = customVirtual?.tier || 'PRO';

  return (
    <article
      className={'vt-card ad-exam-card' + (selected ? ' is-selected' : '')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '.65rem',
        position: 'relative',
        borderLeft: isVirtual ? '4px solid #7c3aed' : (exam.is_published ? undefined : '4px dashed var(--mut)'),
        boxShadow: selected ? '0 0 0 2px var(--acc)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.4rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Chọn ${exam.title}`}
              style={{ accentColor: 'var(--acc)', width: 15, height: 15, cursor: 'pointer' }}
            />
            <span className="vt-chip" style={{ background: color, color: '#fff' }}>
              {diff?.short || exam.difficulty || '—'}
            </span>
          </label>
          {isVirtual && (
            <span className={`ad-vex-badge ad-vex-badge--${tier.toLowerCase()}`} title="Đề đang mở trong Phòng thi ảo">
              ⭐ Phòng ảo · {tier}
            </span>
          )}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
          {isVirtual ? (
            <button
              type="button"
              className="vt-btn sm"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={onUnpublishVirtual}
              title="Gỡ khỏi Phòng thi ảo"
            >
              Gỡ Phòng ảo
            </button>
          ) : (
            <button
              type="button"
              className="vt-btn sm"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#7c3aed', background: 'rgba(124, 58, 237, 0.08)', borderColor: 'rgba(124, 58, 237, 0.3)' }}
              onClick={onPublishVirtual}
              title="Cấp đề này lên Phòng thi ảo"
            >
              ⭐ Cấp Phòng ảo
            </button>
          )}

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
      </div>

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
          title="Nhấn đôi để đổi tên nhanh"
          style={{
            margin: 0,
            font: '800 1rem var(--sans)',
            letterSpacing: '-.02em',
            cursor: 'text',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.35,
            minHeight: '2.7em',
          }}
        >
          {exam.title}
        </h3>
      )}

      {exam.description && (
        <p className="vt-muted" style={{ margin: 0, fontSize: '.78rem', lineHeight: 1.4 }}>
          {exam.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', fontSize: '.72rem', color: 'var(--mut)' }}>
        {[exam.grade?.name, exam.subject?.name, `${exam.duration || '—'} phút`].filter(Boolean).map((t, i) => (
          <span key={i} style={{ padding: '.15rem .5rem', background: 'var(--vt-tint)', borderRadius: 999 }}>{t}</span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '.8rem', paddingTop: '.45rem', borderTop: '1px solid var(--soft)' }}>
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center', flex: 1 }}>
          <IconQuestion size={13} style={{ color: qCount === 0 ? 'var(--vt-amber)' : 'var(--acc)' }} />
          <b style={{ font: '700 .84rem var(--sans)' }}>{qCount}</b>
          <small style={{ color: 'var(--mut)', fontSize: '.7rem' }}>câu</small>
        </div>
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center', flex: 1 }}>
          <IconTrophy size={13} style={{ color: 'var(--acc)' }} />
          <b style={{ font: '700 .84rem var(--sans)' }}>{(exam.attempt_count || 0).toLocaleString('vi-VN')}</b>
          <small style={{ color: 'var(--mut)', fontSize: '.7rem' }}>lượt</small>
        </div>
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center', color: 'var(--mut)', fontSize: '.7rem' }}>
          <IconClock size={12} />
          <span>{formatDate(exam.created_at)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.35rem', marginTop: 'auto' }}>
        <button type="button" className="vt-btn sm primary" onClick={onEdit} style={{ flex: 1 }}>
          <IconEdit size={13} /> Sửa đề
        </button>
        <button type="button" className="vt-icon-btn" onClick={onExportJson} disabled={exporting} title="Xuất file JSON">
          {exporting ? '…' : <IconCode size={14} />}
        </button>
        <button type="button" className="vt-icon-btn" onClick={onDuplicate} disabled={duplicating} title="Nhân bản">
          {duplicating ? '…' : <IconCopy size={14} />}
        </button>
        <a className="vt-icon-btn" href="#virtual-exams" title="Thử nghiệm trên Phòng thi ảo">
          <IconExternal size={14} />
        </a>
        <button type="button" className="vt-icon-btn danger" onClick={onDelete} title="Xóa">
          <IconTrash size={14} />
        </button>
      </div>
    </article>
  );
}

/* ============================================================
   MODAL 1: CẤP ĐỀ HIỆN CÓ LÊN PHÒNG THI ẢO
   ============================================================ */
function PublishToVirtualModal({ exam, onClose, onPublished }) {
  const [tier, setTier] = useState('PRO');
  const [examType, setExamType] = useState(exam?.exam_type || 'THPTQG');
  const [duration, setDuration] = useState(exam?.duration || 50);
  const [year, setYear] = useState(new Date().getFullYear());
  const [author, setAuthor] = useState('Đội ngũ giáo viên ELEC AI');
  const [isHot, setIsHot] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = publishExamToVirtual({
        ...exam,
        tier,
        examType,
        durationMinutes: Number(duration) || 50,
        year: Number(year) || 2026,
        author,
        isHot,
      });
      onPublished(res);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="⭐ Cấp Đề Lên Phòng Thi Ảo"
      subtitle={`Đề: ${exam.title}`}
      onClose={onClose}
      size="md"
      foot={
        <>
          <button type="button" className="vt-btn" onClick={onClose}>Hủy</button>
          <button type="button" className="vt-btn primary" onClick={handleSubmit} disabled={submitting} style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 0 }}>
            {submitting ? 'Đang cấp…' : '⭐ Xác nhận cấp lên Phòng thi ảo'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phân hạng đề (Tier)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'VIP', label: 'VIP (Độc quyền)', desc: 'Mở cho gói VIP 2027', color: '#7c3aed' },
              { id: 'PRO', label: 'PRO (Thành viên)', desc: 'Mở cho học sinh PRO', color: '#2563eb' },
              { id: 'FREE', label: 'FREE (Miễn phí)', desc: 'Mở cho tất cả học sinh', color: '#16a34a' },
            ].map((t) => (
              <label
                key={t.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: 10,
                  borderRadius: 10,
                  border: `1.5px solid ${tier === t.id ? t.color : 'var(--line)'}`,
                  background: tier === t.id ? `${t.color}15` : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="pub_tier"
                    value={t.id}
                    checked={tier === t.id}
                    onChange={() => setTier(t.id)}
                  />
                  <b style={{ color: t.color, fontSize: 13 }}>{t.id}</b>
                </div>
                <small style={{ fontSize: 11, color: 'var(--mut)' }}>{t.desc}</small>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Kỳ thi áp dụng</label>
            <select
              className="vt-select-pill"
              style={{ width: '100%' }}
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
            >
              <option value="THPTQG">Thi THPTQG</option>
              <option value="HSA">ĐGNL HSA (ĐHQG Hà Nội)</option>
              <option value="TSA">ĐGTD TSA (ĐH Bách Khoa)</option>
              <option value="V-ACT">ĐGNL V-ACT (ĐHQG TP.HCM)</option>
              <option value="SPT">ĐGNL SPT (ĐH Sư Phạm HN)</option>
              <option value="H-SCA">ĐGNL H-SCA (ĐH Ngân Hàng)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Thời gian làm bài (phút)</label>
            <input
              type="number"
              min="5"
              max="180"
              className="vt-search-input"
              style={{ width: '100%' }}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Năm thi</label>
            <input
              type="number"
              className="vt-search-input"
              style={{ width: '100%' }}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Tác giả / Nguồn đề</label>
            <input
              type="text"
              className="vt-search-input"
              style={{ width: '100%' }}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
          <input
            type="checkbox"
            checked={isHot}
            onChange={(e) => setIsHot(e.target.checked)}
          />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Gắn huy hiệu Đề HOT nổi bật ở đầu trang</span>
        </label>
      </form>
    </Modal>
  );
}

/* ============================================================
   MODAL 2: TẠO MỚI & CẤP ĐỀ PHÒNG THI ẢO
   ============================================================ */
function CreateVirtualExamModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('THPTQG');
  const [tier, setTier] = useState('PRO');
  const [year, setYear] = useState(2027);
  const [duration, setDuration] = useState(50);
  const [questionCount, setQuestionCount] = useState(28);
  const [gradeScope, setGradeScope] = useState('12');
  const [author, setAuthor] = useState('PGS. TS Nguyễn Mậu Đức & Hội đồng ELEC AI');
  const [institution, setInstitution] = useState('Hội đồng chuyên môn Hóa học THPT');
  const [sourceType, setSourceType] = useState('exclusive');
  const [isHot, setIsHot] = useState(true);
  const [questionSource, setQuestionSource] = useState('bank');
  const [customJson, setCustomJson] = useState('');
  const [error, setError] = useState(null);

  const handleSave = () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề đề thi.');
      return;
    }
    setError(null);
    let parsedQuestions = [];
    if (questionSource === 'custom' && customJson.trim()) {
      try {
        parsedQuestions = JSON.parse(customJson);
        if (!Array.isArray(parsedQuestions)) throw new Error('Dữ liệu JSON phải là mảng câu hỏi.');
      } catch (e) {
        setError('Lỗi định dạng JSON câu hỏi: ' + e.message);
        return;
      }
    }

    const created = publishExamToVirtual({
      title: title.trim(),
      examType,
      tier,
      year: Number(year) || 2027,
      durationMinutes: Number(duration) || 50,
      questionCount: parsedQuestions.length > 0 ? parsedQuestions.length : (Number(questionCount) || 28),
      gradeScope,
      author,
      institution,
      sourceType,
      isHot,
      customQuestions: parsedQuestions,
    });

    onCreated(created);
  };

  return (
    <Modal
      title="⭐ Tạo & Cấp Đề Phòng Thi Ảo Mới"
      subtitle="Đề tạo sẽ ngay lập tức đồng bộ vào Hệ thống Phòng thi ảo (#virtual-exams)"
      onClose={onClose}
      size="lg"
      wide={true}
      foot={
        <>
          <button type="button" className="vt-btn" onClick={onClose}>Hủy</button>
          <button type="button" className="vt-btn primary" onClick={handleSave} style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 0 }}>
            ⭐ Tạo & Cấp Lên Phòng Thi Ảo Ngay
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 8 }}>{error}</div>}

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Tiêu đề đề thi (*)</label>
          <input
            type="text"
            className="vt-search-input"
            style={{ width: '100%', fontSize: 14, fontWeight: 600 }}
            placeholder="Ví dụ: Đề thi thử tốt nghiệp THPTQG 2027 môn Hóa học - Đề thi thử Chuyên Sư Phạm Hà Nội"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phân loại kỳ thi</label>
            <select className="vt-select-pill" style={{ width: '100%' }} value={examType} onChange={(e) => setExamType(e.target.value)}>
              <option value="THPTQG">Thi THPTQG (Tốt nghiệp)</option>
              <option value="HSA">ĐGNL HSA (ĐHQG Hà Nội)</option>
              <option value="TSA">ĐGTD TSA (ĐH Bách Khoa HN)</option>
              <option value="V-ACT">ĐGNL V-ACT (ĐHQG TP.HCM)</option>
              <option value="SPT">ĐGNL SPT (ĐH Sư Phạm HN)</option>
              <option value="H-SCA">ĐGNL H-SCA (ĐH Ngân Hàng)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phân hạng (Tier)</label>
            <select className="vt-select-pill" style={{ width: '100%' }} value={tier} onChange={(e) => setTier(e.target.value)}>
              <option value="VIP">VIP (Độc quyền VIP 2027)</option>
              <option value="PRO">PRO (Thành viên PRO)</option>
              <option value="FREE">FREE (Luyện thi Miễn phí)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Nguồn đề</label>
            <select className="vt-select-pill" style={{ width: '100%' }} value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              <option value="exclusive">Độc quyền ELEC AI</option>
              <option value="official">Đề chuẩn Bộ / ĐHQG</option>
              <option value="schools">Sở GD&ĐT / Trường Chuyên</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Năm đề thi</label>
            <input type="number" className="vt-search-input" style={{ width: '100%' }} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Thời gian (phút)</label>
            <input type="number" className="vt-search-input" style={{ width: '100%' }} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Số câu hỏi</label>
            <input type="number" className="vt-search-input" style={{ width: '100%' }} value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Khối lớp</label>
            <select className="vt-select-pill" style={{ width: '100%' }} value={gradeScope} onChange={(e) => setGradeScope(e.target.value)}>
              <option value="all">Toàn cấp THPT</option>
              <option value="12">Lớp 12</option>
              <option value="11">Lớp 11</option>
              <option value="10">Lớp 10</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Tác giả / Người biên soạn</label>
            <input type="text" className="vt-search-input" style={{ width: '100%' }} value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Đơn vị / Trường / Tổ chuyên môn</label>
            <input type="text" className="vt-search-input" style={{ width: '100%' }} value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Nguồn câu hỏi cho bài thi</label>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <input type="radio" name="q_source" checked={questionSource === 'bank'} onChange={() => setQuestionSource('bank')} />
              <span>Tự động sinh 28 câu chuẩn GDPT 2018 theo chuyên đề trọng tâm</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <input type="radio" name="q_source" checked={questionSource === 'custom'} onChange={() => setQuestionSource('custom')} />
              <span>Nhập / Dán danh sách câu hỏi tùy chỉnh (JSON)</span>
            </label>
          </div>

          {questionSource === 'custom' && (
            <textarea
              className="vt-search-input"
              rows={5}
              style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12 }}
              placeholder='[{"question": "Câu 1: Cho các chất sau...", "options": ["A", "B", "C", "D"], "correct": 0, "explain": "Lời giải chi tiết..."}]'
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
            />
          )}
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={isHot} onChange={(e) => setIsHot(e.target.checked)} />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Hiển thị nhãn HOT nổi bật trên Phòng thi ảo</span>
        </label>
      </div>
    </Modal>
  );
}
