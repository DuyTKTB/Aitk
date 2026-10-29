/* ============================================================
   QuestionManager.jsx — Ngân hàng câu hỏi Admin (Lọc nâng cao + Sửa nhanh tại chỗ)
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import AdminShell, { Topbar, downloadCsv } from './AdminShell.jsx';
import { Modal, ConfirmDialog, useDebounced } from './AdminUI.jsx';
import {
  IconQuestion, IconRefresh, IconTrash, IconEye, IconEdit,
  IconChevron, IconBack, IconClose, IconCheck, IconSave, IconDownload,
} from './AdminIcons.jsx';
import { DIFFICULTIES, QUESTION_TYPES, diffColor, diffName, qTypeName } from './adminConstants.js';
import { escapeLike, friendlyError } from './adminUtils.js';

const PAGE_SIZE = 20;

const clamp2 = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export default function QuestionManager({ onOpenExam }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [subjectId, setSubjectId] = useState('all');
  const [qTypeFilter, setQTypeFilter] = useState('all');
  const [explainFilter, setExplainFilter] = useState('all'); // all | missing | has
  const [subjects, setSubjects] = useState([]);

  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [detail, setDetail] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);
  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const term = useDebounced(search.trim(), 350);
  const reqId = useRef(0);

  useEffect(() => {
    supabase.from('subjects').select('id, name').order('sort_order').then(({ data, error: e }) => {
      if (!e) setSubjects(data || []);
    });
  }, []);

  useEffect(() => { setPage(0); }, [term, difficulty, subjectId, qTypeFilter, explainFilter]);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('questions')
        .select(`
          id, question_number, content, explanation, difficulty, question_type, exam_id,
          exams!inner(id, title, subject_id, grade:grades(name), subject:subjects(name)),
          answers(id, label, content, is_correct, sort_order)
        `, { count: 'exact' })
        .order('exam_id', { ascending: false })
        .order('question_number', { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (term) q = q.ilike('content', `%${escapeLike(term)}%`);
      if (difficulty !== 'all') q = q.eq('difficulty', difficulty);
      if (subjectId !== 'all') q = q.eq('exams.subject_id', Number(subjectId));
      if (qTypeFilter !== 'all') q = q.eq('question_type', qTypeFilter);
      if (explainFilter === 'missing') q = q.or('explanation.is.null,explanation.eq.');
      if (explainFilter === 'has') q = q.not('explanation', 'is', null).neq('explanation', '');

      const { data, count, error: e } = await q;
      if (e) throw e;
      if (my !== reqId.current) return;
      setRows(data || []);
      setTotal(count ?? 0);
      setSelected(new Set());
    } catch (e) {
      if (my !== reqId.current) return;
      setError(friendlyError(e));
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, [page, term, difficulty, subjectId, qTypeFilter, explainFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetailModal = (q) => {
    setDetail(q);
    setEditDraft({
      id: q.id,
      content: q.content || '',
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      question_type: q.question_type || 'single_choice',
      answers: [...(q.answers || [])].sort((a, b) => a.sort_order - b.sort_order).map((a) => ({ ...a })),
    });
  };

  const handleSaveDetail = async () => {
    if (!editDraft) return;
    if (!editDraft.content.trim()) {
      say('Nội dung câu hỏi không được để trống.');
      return;
    }
    setSavingDetail(true);
    try {
      const { error: e1 } = await supabase
        .from('questions')
        .update({
          content: editDraft.content.trim(),
          explanation: editDraft.explanation?.trim() || null,
          difficulty: editDraft.difficulty,
        })
        .eq('id', editDraft.id);
      if (e1) throw e1;

      if (editDraft.answers?.length) {
        const updates = await Promise.all(
          editDraft.answers.map((a) =>
            supabase
              .from('answers')
              .update({ content: a.content.trim(), is_correct: !!a.is_correct })
              .eq('id', a.id),
          ),
        );
        const bad = updates.find((u) => u.error);
        if (bad) throw bad.error;
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === editDraft.id
            ? {
                ...r,
                content: editDraft.content.trim(),
                explanation: editDraft.explanation?.trim() || null,
                difficulty: editDraft.difficulty,
                answers: editDraft.answers,
              }
            : r,
        ),
      );
      setDetail(null);
      setEditDraft(null);
      say('Đã lưu chỉnh sửa câu hỏi');
    } catch (e) {
      say('Không lưu được: ' + friendlyError(e));
    } finally {
      setSavingDetail(false);
    }
  };

  const handleDelete = (q) => {
    setConfirm({
      title: 'Xóa câu hỏi',
      body: `Xóa câu ${q.question_number} khỏi đề "${q.exams?.title}"? Không thể hoàn tác.`,
      okLabel: 'Xóa câu',
      danger: true,
      onOk: async () => {
        setDeleting(q.id);
        try {
          const { error: e } = await supabase.from('questions').delete().eq('id', q.id);
          if (e) throw e;
          say('Đã xóa câu hỏi');
          setDetail(null);
          setEditDraft(null);
          if (rows.length === 1 && page > 0) setPage((p) => p - 1);
          else load();
        } catch (e) {
          say('Không xóa được: ' + friendlyError(e));
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const handleBulkDifficulty = async (newDiff) => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const { error: e } = await supabase.from('questions').update({ difficulty: newDiff }).in('id', ids);
      if (e) throw e;
      setRows((prev) => prev.map((r) => (selected.has(r.id) ? { ...r, difficulty: newDiff } : r)));
      setSelected(new Set());
      say(`Đã đổi độ khó cho ${ids.length} câu`);
    } catch (e) {
      say('Lỗi cập nhật: ' + friendlyError(e));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;
    setConfirm({
      title: `Xóa ${ids.length} câu hỏi đã chọn`,
      body: 'Các câu hỏi này sẽ bị xóa khỏi đề thi tương ứng. Không thể hoàn tác.',
      okLabel: `Xóa ${ids.length} câu`,
      danger: true,
      onOk: async () => {
        setBulkBusy(true);
        try {
          const { error: e } = await supabase.from('questions').delete().in('id', ids);
          if (e) throw e;
          setSelected(new Set());
          say(`Đã xóa ${ids.length} câu hỏi`);
          load();
        } catch (e) {
          say('Không xóa được: ' + friendlyError(e));
        } finally {
          setBulkBusy(false);
        }
      },
    });
  };

  const toggleSelect = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = term || difficulty !== 'all' || subjectId !== 'all' || qTypeFilter !== 'all' || explainFilter !== 'all';

  const handleExportCsv = () => {
    if (!rows.length) return say('Không có câu hỏi nào để xuất');
    const header = [
      'STT', 'Mã câu', 'Đề thi', 'Môn', 'Khối',
      'Loại câu', 'Độ khó', 'Nội dung câu hỏi',
      'Phương án', 'Đáp án đúng', 'Lời giải',
    ];
    const dataRows = rows.map((q, idx) => {
      const correctAns = (q.answers || []).filter((a) => a.is_correct).map((a) => a.label || a.content).join(', ') || '—';
      const answersText = (q.answers || []).map((a) => `${a.label || ''}. ${a.content}`).join(' | ');
      return [
        idx + 1,
        q.id,
        q.exams?.title || '—',
        q.exams?.subject?.name || '—',
        q.exams?.grade?.name || '—',
        qTypeName(q.question_type),
        diffName(q.difficulty),
        q.content || '',
        answersText,
        correctAns,
        q.explanation || '',
      ];
    });
    const filename = `ngan-hang-cau-hoi-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, [header, ...dataRows]);
    say(`Đã xuất CSV cho ${rows.length} câu hỏi`);
  };

  return (
    <AdminShell active="questions" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Ngân hàng câu hỏi"
        subtitle={`${total.toLocaleString('vi-VN')} câu hỏi từ mọi đề thi · Bấm vào câu bất kỳ để xem & sửa nhanh`}
        onSearch={setSearch}
        search={search}
        placeholder="Tìm trong nội dung câu hỏi…"
      />

      {/* Filter bar */}
      <div className="vt-card soft">
        <div className="vt-filter-bar">
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="vt-select-pill">
            <option value="all">Tất cả môn</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="vt-select-pill">
            <option value="all">Mọi độ khó</option>
            {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={qTypeFilter} onChange={(e) => setQTypeFilter(e.target.value)} className="vt-select-pill">
            <option value="all">Mọi loại câu</option>
            {QUESTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.short}</option>)}
          </select>
          <select value={explainFilter} onChange={(e) => setExplainFilter(e.target.value)} className="vt-select-pill">
            <option value="all">Tất cả lời giải</option>
            <option value="missing">Chưa có lời giải</option>
            <option value="has">Đã có lời giải</option>
          </select>

          <button type="button" className="vt-btn sm" onClick={handleExportCsv} disabled={loading || rows.length === 0} style={{ marginLeft: 'auto' }} title="Xuất danh sách câu hỏi đang xem ra file CSV">
            <IconDownload size={13} /> Xuất CSV
          </button>
          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
          {hasFilter && (
            <button
              type="button"
              className="vt-btn sm"
              onClick={() => {
                setSearch('');
                setDifficulty('all');
                setSubjectId('all');
                setQTypeFilter('all');
                setExplainFilter('all');
              }}
            >
              <IconClose size={12} /> Xóa lọc
            </button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="vt-bulk-bar">
            <span>Đã chọn <b>{selected.size}</b> câu</span>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                className="vt-btn sm"
                disabled={bulkBusy}
                onClick={() => handleBulkDifficulty(d.id)}
              >
                Đặt: {d.short}
              </button>
            ))}
            <button type="button" className="vt-btn sm danger" disabled={bulkBusy} onClick={handleBulkDelete}>
              <IconTrash size={13} /> Xóa {selected.size} câu
            </button>
            <button type="button" className="vt-btn sm" onClick={() => setSelected(new Set())}>
              <IconClose size={12} /> Bỏ chọn
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className="vt-empty">
          <span><IconQuestion size={30} /></span>
          <h3>Không tải được dữ liệu</h3>
          <p>{error}</p>
          <button type="button" className="vt-btn primary" onClick={load}>Thử lại</button>
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="vt-card">
          <div className="vt-skeleton-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="vt-skeleton-row">
                <div className="vt-skeleton-line" style={{ width: '8%' }} />
                <div className="vt-skeleton-line" style={{ width: '50%' }} />
                <div className="vt-skeleton-line" style={{ width: '20%' }} />
                <div className="vt-skeleton-line" style={{ width: '12%' }} />
              </div>
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="vt-empty">
          <span><IconQuestion size={30} /></span>
          <h3>{hasFilter ? 'Không có câu hỏi nào khớp bộ lọc' : 'Chưa có câu hỏi nào'}</h3>
          <p>{hasFilter ? 'Thử đổi từ khóa hoặc bỏ bớt bộ lọc.' : 'Câu hỏi xuất hiện ở đây sau khi bạn tạo đề.'}</p>
        </div>
      ) : (
        <div className="vt-card">
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((r) => selected.has(r.id))}
                      onChange={() => {
                        const all = rows.every((r) => selected.has(r.id));
                        setSelected(all ? new Set() : new Set(rows.map((r) => r.id)));
                      }}
                    />
                  </th>
                  <th style={{ width: 54 }}>Câu</th>
                  <th>Nội dung câu hỏi</th>
                  <th>Thuộc đề</th>
                  <th>Loại & Độ khó</th>
                  <th style={{ width: 130 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={q.id} className={selected.has(q.id) ? 'vt-row-selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(q.id)}
                        onChange={() => toggleSelect(q.id)}
                      />
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--mut)', fontWeight: 700 }}>{q.question_number}</td>
                    <td style={{ cursor: 'pointer' }} onClick={() => openDetailModal(q)}>
                      <b style={{ fontSize: '.88rem', ...clamp2 }}>
                        {q.content}
                      </b>
                      <small style={{ color: q.explanation ? 'var(--mut)' : 'var(--vt-amber)', fontSize: '.72rem' }}>
                        {q.answers?.length || 0} phương án · {q.explanation ? 'Đã có lời giải' : 'Chưa có lời giải'}
                      </small>
                    </td>
                    <td>
                      <b style={{ display: 'block', fontSize: '.84rem' }}>{q.exams?.title}</b>
                      <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>
                        {[q.exams?.subject?.name, q.exams?.grade?.name].filter(Boolean).join(' · ')}
                      </small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        <span className="vt-chip" style={{ background: diffColor(q.difficulty), color: '#fff' }}>
                          {diffName(q.difficulty)}
                        </span>
                        <span className="vt-chip closed">
                          {qTypeName(q.question_type)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="vt-row-actions">
                        <button type="button" className="vt-icon-btn" onClick={() => openDetailModal(q)} title="Xem & sửa nhanh">
                          <IconEye size={14} />
                        </button>
                        {onOpenExam && (
                          <button type="button" className="vt-icon-btn" onClick={() => onOpenExam(q.exam_id)} title="Mở đề chứa câu này">
                            <IconEdit size={14} />
                          </button>
                        )}
                        <button type="button" className="vt-icon-btn danger" onClick={() => handleDelete(q)} disabled={deleting === q.id} title="Xóa">
                          {deleting === q.id ? '…' : <IconTrash size={14} />}
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

      {total > PAGE_SIZE && !error && (
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <button type="button" className="vt-btn sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>
            <IconBack size={13} /> Trước
          </button>
          <span style={{ padding: '.4rem .9rem', background: 'var(--vt-tint)', borderRadius: 999, fontSize: '.85rem' }}>
            Trang <b>{page + 1}</b> / {pages}
          </span>
          <button type="button" className="vt-btn sm" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1 || loading}>
            Sau <IconChevron size={13} />
          </button>
        </div>
      )}

      {detail && editDraft && (
        <Modal
          title={`Câu ${detail.question_number} · Sửa nhanh tại chỗ`}
          subtitle={detail.exams?.title}
          onClose={() => { setDetail(null); setEditDraft(null); }}
          size="lg"
          foot={
            <>
              <button type="button" className="vt-btn danger" onClick={() => handleDelete(detail)} style={{ marginRight: 'auto' }}>
                <IconTrash size={14} /> Xóa câu
              </button>
              {onOpenExam && (
                <button type="button" className="vt-btn" onClick={() => { setDetail(null); setEditDraft(null); onOpenExam(detail.exam_id); }}>
                  <IconEdit size={14} /> Mở toàn bộ đề
                </button>
              )}
              <button type="button" className="vt-btn primary" onClick={handleSaveDetail} disabled={savingDetail}>
                <IconSave size={14} /> {savingDetail ? 'Đang lưu…' : 'Lưu câu hỏi'}
              </button>
            </>
          }
        >
          <div style={{ display: 'grid', gap: '.85rem' }}>
            <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="vt-chip closed">{qTypeName(editDraft.question_type)}</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', fontWeight: 600 }}>
                <span>Độ khó:</span>
                <select
                  value={editDraft.difficulty}
                  onChange={(e) => setEditDraft({ ...editDraft, difficulty: e.target.value })}
                  className="vt-select-pill"
                >
                  {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
            </div>

            <label className="vt-field">
              <span>Nội dung câu hỏi</span>
              <textarea
                value={editDraft.content}
                onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })}
                rows={3}
                style={{ padding: '.65rem .85rem', borderRadius: 12 }}
              />
            </label>

            <div>
              <span style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--mut)', marginBottom: '.4rem' }}>
                {editDraft.question_type === 'true_false'
                  ? 'Các mệnh đề Đúng / Sai (bấm nút bên phải để đổi Đúng/Sai)'
                  : editDraft.question_type === 'short_answer'
                    ? 'Đáp số trả lời ngắn'
                    : 'Các phương án trả lời (chọn nút tròn ở đáp án đúng)'}
              </span>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '.4rem' }}>
                {editDraft.answers.map((a, idx) => (
                  <li
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.6rem',
                      padding: '.45rem .75rem',
                      borderRadius: 10,
                      background: a.is_correct ? 'color-mix(in srgb, #16a34a 14%, transparent)' : 'var(--vt-tint)',
                      border: a.is_correct ? '1.5px solid #16a34a' : '1.5px solid transparent',
                    }}
                  >
                    {editDraft.question_type === 'single_choice' && (
                      <input
                        type="radio"
                        name="qm-correct"
                        checked={!!a.is_correct}
                        onChange={() =>
                          setEditDraft({
                            ...editDraft,
                            answers: editDraft.answers.map((x) => ({ ...x, is_correct: x.id === a.id })),
                          })
                        }
                        style={{ accentColor: '#16a34a' }}
                      />
                    )}
                    <b style={{ width: 24, textAlign: 'center' }}>{a.label}</b>
                    <input
                      type="text"
                      value={a.content}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditDraft({
                          ...editDraft,
                          answers: editDraft.answers.map((x, i) => (i === idx ? { ...x, content: val } : x)),
                        });
                      }}
                      style={{
                        flex: 1,
                        border: 0,
                        background: 'transparent',
                        color: 'var(--ink)',
                        font: '500 .88rem var(--sans)',
                        padding: '.25rem .4rem',
                      }}
                    />
                    {editDraft.question_type === 'true_false' && (
                      <button
                        type="button"
                        className={'vt-chip ' + (a.is_correct ? 'ready' : 'kicked')}
                        onClick={() =>
                          setEditDraft({
                            ...editDraft,
                            answers: editDraft.answers.map((x, i) => (i === idx ? { ...x, is_correct: !x.is_correct } : x)),
                          })
                        }
                        style={{ cursor: 'pointer' }}
                      >
                        {a.is_correct ? 'Đúng' : 'Sai'}
                      </button>
                    )}
                    {a.is_correct && editDraft.question_type !== 'true_false' && (
                      <IconCheck size={15} style={{ color: '#16a34a' }} />
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <label className="vt-field">
              <span>Lời giải chi tiết</span>
              <textarea
                value={editDraft.explanation}
                onChange={(e) => setEditDraft({ ...editDraft, explanation: e.target.value })}
                rows={3}
                placeholder="Nhập lời giải từng bước để học sinh xem sau khi nộp bài…"
                style={{ padding: '.65rem .85rem', borderRadius: 12 }}
              />
            </label>
          </div>
        </Modal>
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
