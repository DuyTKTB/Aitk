/* ============================================================
   QuestionManager.jsx — Ngân hàng câu hỏi (Vitality)
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import AdminShell, { Topbar, Modal, ConfirmDialog } from './AdminShell.jsx';
import {
  IconQuestion, IconSearch, IconRefresh, IconTrash, IconEye, IconEdit,
  IconChevron, IconBack, IconClose, IconCheck,
} from './AdminIcons.jsx';
import { DIFFICULTIES, diffColor, diffName } from './adminConstants.js';
import { escapeLike, friendlyError } from './adminUtils.js';

const PAGE_SIZE = 20;

/* Style dùng chung cho đoạn văn bản bị cắt 2 dòng */
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
  const [subjects, setSubjects] = useState([]);
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);
  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const term = useDebounced(search.trim(), 350);
  const reqId = useRef(0);

  useEffect(() => {
    supabase.from('subjects').select('id, name').order('sort_order').then(({ data, error: e }) => {
      if (!e) setSubjects(data || []);
    });
  }, []);

  useEffect(() => { setPage(0); }, [term, difficulty, subjectId]);

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

      const { data, count, error: e } = await q;
      if (e) throw e;
      if (my !== reqId.current) return;
      setRows(data || []);
      setTotal(count ?? 0);
    } catch (e) {
      if (my !== reqId.current) return;
      setError(friendlyError(e));
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, [page, term, difficulty, subjectId]);

  useEffect(() => { load(); }, [load]);

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

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = term || difficulty !== 'all' || subjectId !== 'all';

  return (
    <AdminShell active="questions" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Ngân hàng câu hỏi"
        subtitle={`${total.toLocaleString('vi-VN')} câu hỏi từ mọi đề`}
        onSearch={setSearch}
        search={search}
        placeholder="Tìm trong nội dung câu hỏi…"
      />

      {/* Filter bar */}
      <div className="vt-card soft">
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            style={{ padding: '.5rem .9rem', borderRadius: 999, border: '1px solid var(--soft)', background: 'var(--bg)', color: 'var(--ink)' }}
          >
            <option value="all">Tất cả môn</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ padding: '.5rem .9rem', borderRadius: 999, border: '1px solid var(--soft)', background: 'var(--bg)', color: 'var(--ink)' }}
          >
            <option value="all">Mọi độ khó</option>
            {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="button" className="vt-btn sm" onClick={load} disabled={loading}>
            <IconRefresh size={13} /> {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
          {hasFilter && (
            <button type="button" className="vt-btn sm" onClick={() => { setSearch(''); setDifficulty('all'); setSubjectId('all'); }}>
              <IconClose size={12} /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="vt-empty">
          <span><IconQuestion size={30} /></span>
          <h3>Không tải được dữ liệu</h3>
          <p>{error}</p>
          <button type="button" className="vt-btn primary" onClick={load}>Thử lại</button>
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="vt-loading">
          <div className="page-loader-spinner" />
          <p>Đang tải câu hỏi…</p>
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
                  <th style={{ width: 54 }}>Câu</th>
                  <th>Nội dung</th>
                  <th>Thuộc đề</th>
                  <th>Độ khó</th>
                  <th style={{ width: 130 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--mut)' }}>{q.question_number}</td>
                    <td>
                      <b style={{ fontSize: '.88rem', ...clamp2 }}>
                        {q.content}
                      </b>
                      <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>
                        {q.answers?.length || 0} đáp án{q.explanation ? ' · có lời giải' : ' · chưa có lời giải'}
                      </small>
                    </td>
                    <td>
                      <b style={{ display: 'block', fontSize: '.85rem' }}>{q.exams?.title}</b>
                      <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>
                        {[q.exams?.subject?.name, q.exams?.grade?.name].filter(Boolean).join(' · ')}
                      </small>
                    </td>
                    <td>
                      <span
                        className="vt-chip"
                        style={{ background: diffColor(q.difficulty), color: '#fff' }}
                      >
                        {diffName(q.difficulty)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button type="button" className="vt-icon-btn" onClick={() => setDetail(q)} title="Xem chi tiết">
                          <IconEye size={14} />
                        </button>
                        {onOpenExam && (
                          <button type="button" className="vt-icon-btn" onClick={() => onOpenExam(q.exam_id)} title="Mở đề để sửa">
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

      {detail && (
        <Modal
          title={`Câu ${detail.question_number}`}
          onClose={() => setDetail(null)}
          size="md"
          foot={
            <>
              {onOpenExam && (
                <button type="button" className="vt-btn" onClick={() => { setDetail(null); onOpenExam(detail.exam_id); }}>
                  <IconEdit size={14} /> Mở đề
                </button>
              )}
              <button type="button" className="vt-btn danger" onClick={() => handleDelete(detail)}>
                <IconTrash size={14} /> Xóa
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '.8rem', fontSize: '.82rem', color: 'var(--mut)' }}>
            {detail.exams?.title} · {diffName(detail.difficulty)}
          </div>
          <p style={{ font: '500 .95rem/1.6 var(--sans)', margin: '0 0 1rem' }}>{detail.content}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'grid', gap: '.4rem' }}>
            {[...(detail.answers || [])].sort((a, b) => a.sort_order - b.sort_order).map((a) => (
              <li
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.7rem',
                  padding: '.55rem .8rem',
                  borderRadius: 10,
                  background: a.is_correct ? 'color-mix(in srgb, #16a34a 15%, transparent)' : 'var(--vt-tint)',
                  border: a.is_correct ? '1.5px solid #16a34a' : '1.5px solid transparent',
                }}
              >
                <b style={{ width: 24, textAlign: 'center' }}>{a.label}</b>
                <span style={{ flex: 1 }}>{a.content}</span>
                {a.is_correct && <IconCheck size={15} style={{ color: '#16a34a' }} />}
              </li>
            ))}
          </ul>
          {detail.explanation ? (
            <div style={{ padding: '.8rem 1rem', background: 'var(--vt-tint)', borderRadius: 12, borderLeft: '3px solid var(--acc)' }}>
              <small style={{ color: 'var(--mut)', display: 'block', marginBottom: '.3rem', textTransform: 'uppercase', fontSize: '.7rem', fontWeight: 700 }}>Lời giải</small>
              <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.5 }}>{detail.explanation}</p>
            </div>
          ) : (
            <p className="vt-muted">Câu này chưa có lời giải.</p>
          )}
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

/* Hook useDebounced nội bộ */
function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}