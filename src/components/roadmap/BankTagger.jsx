/* ============================================================
   BankTagger.jsx — GẮN CHUYÊN ĐỀ CHO NGÂN HÀNG CÂU HỎI
   ------------------------------------------------------------
   Công cụ cho giáo viên/quản trị, mở ngay tại chỗ phát hiện vấn đề:
   câu hỏi chưa có `topic_id` thì Lộ trình và mọi thống kê theo chương
   đều trống.

   • Sửa từng câu (dropdown) hoặc chọn nhiều câu rồi gán hàng loạt.
   • Mọi thay đổi được gom lại, chỉ ghi khi bấm "Lưu thay đổi".
   • Ghi qua Supabase (xem ghi chú bảo mật ở lib/bankAdmin.js).
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHEM_TOPICS, topicGroups } from '../../data/chemTopics.js';
import { IconClose } from '../Icons.jsx';
import { chapterName } from '../../data/roadmap.js';
import { loadBankOverview, assignTopic, summarize } from '../../lib/bankAdmin.js';

/* Dùng tên hiển thị của Lộ trình để hai nơi không lệch nhau */
const labelOf = (t) => chapterName(t.id) || t.name;
const TOPIC_NAME = new Map(CHEM_TOPICS.map((t) => [t.id, labelOf(t)]));
const GROUPS = topicGroups();

const norm = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

export default function BankTagger({ onClose, onSaved }) {
  const [state, setState] = useState('loading');
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [exams, setExams] = useState([]);
  const [pending, setPending] = useState({});
  const [selected, setSelected] = useState([]);
  const [bulkTopic, setBulkTopic] = useState('');
  const [query, setQuery] = useState('');
  const [onlyUntagged, setOnlyUntagged] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const alive = useRef(true);

  const load = useCallback(() => {
    setState('loading');
    setError(null);
    loadBankOverview().then((r) => {
      if (!alive.current) return;
      if (r.error) { setError(r.error); setState('error'); return; }
      setRows(r.questions.map((q) => ({ ...q, examTitle: (r.exams.find((e) => e.id === q.exam_id) || {}).title || '—' })));
      setExams(r.exams);
      setPending({});
      setSelected([]);
      setState('ready');
    });
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; };
  }, [load]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stats = useMemo(() => summarize(rows), [rows]);

  const view = useMemo(() => {
    const q = norm(query).trim();
    return rows.filter((r) => {
      const topic = pending[r.id] !== undefined ? pending[r.id] : r.topic_id;
      if (onlyUntagged && topic) return false;
      if (!q) return true;
      return norm(r.content).includes(q) || norm(r.examTitle).includes(q);
    });
  }, [rows, pending, onlyUntagged, query]);

  const setTopicFor = (id, topic) => {
    setPending((p) => {
      const next = { ...p };
      next[id] = topic || null;
      return next;
    });
  };

  const toggle = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const allVisibleSelected = view.length > 0 && view.every((r) => selected.includes(r.id));
  const toggleAll = () => {
    setSelected(allVisibleSelected ? [] : view.map((r) => r.id));
  };

  const applyBulk = () => {
    if (!selected.length) { setToast({ kind: 'warn', text: 'Chọn ít nhất một câu trước khi gán.' }); return; }
    if (bulkTopic === '') { setToast({ kind: 'warn', text: 'Chọn chuyên đề cần gán.' }); return; }
    setPending((p) => {
      const next = { ...p };
      selected.forEach((id) => { next[id] = bulkTopic; });
      return next;
    });
    setToast({ kind: 'ok', text: `Đã đánh dấu ${selected.length} câu → ${TOPIC_NAME.get(bulkTopic) || bulkTopic}. Bấm "Lưu thay đổi".` });
  };

  const pendingEntries = Object.entries(pending).filter(([id, topic]) => {
    const row = rows.find((r) => r.id === id);
    return row && (row.topic_id || null) !== (topic || null);
  });

  const save = async () => {
    if (!pendingEntries.length) return;
    setSaving(true);
    setToast(null);
    const groups = {};
    pendingEntries.forEach(([id, topic]) => {
      const k = topic || '__none';
      if (!groups[k]) groups[k] = [];
      groups[k].push(id);
    });

    let done = 0;
    const failed = [];
    for (const [key, ids] of Object.entries(groups)) {
      const topic = key === '__none' ? null : key;
      // eslint-disable-next-line no-await-in-loop
      const r = await assignTopic(ids, topic);
      if (r.ok) done += r.count;
      else failed.push(`${topic || 'bỏ gắn'}: ${r.error}`);
    }
    setSaving(false);

    if (failed.length) {
      setToast({ kind: 'err', text: `Lưu được ${done} câu, lỗi: ${failed[0]}` });
      return;
    }
    setRows((prev) => prev.map((r) => (pending[r.id] !== undefined ? { ...r, topic_id: pending[r.id] } : r)));
    setPending({});
    setSelected([]);
    setToast({ kind: 'ok', text: `Đã lưu ${done} câu. Lộ trình sẽ cập nhật khi bạn tải lại.` });
    onSaved?.();
  };

  return createPortal(
    <div className="rm-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="rm-tagger"
        role="dialog"
        aria-modal="true"
        aria-label="Gắn chuyên đề cho ngân hàng câu hỏi"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rm-tagger-head">
          <div>
            <small>Công cụ giáo viên</small>
            <h2>Gắn chuyên đề cho câu hỏi</h2>
            <p className="rm-muted sm">
              Câu hỏi chưa có chuyên đề thì Lộ trình &amp; bản đồ nhiệt không tính được.
            </p>
          </div>
          <button type="button" className="rm-x" onClick={onClose} aria-label="Đóng" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={18} />
          </button>
        </header>

        {state === 'loading' && (
          <div className="rm-skel-wrap" role="status" aria-live="polite">
            <span className="rm-skel" style={{ height: 20, width: '55%' }} />
            <span className="rm-skel" style={{ height: 54 }} />
            <span className="rm-skel" style={{ height: 54 }} />
            <span className="rm-skel" style={{ height: 54 }} />
          </div>
        )}

        {state === 'error' && (
          <div className="rm-state err" role="alert">
            <b>Không tải được ngân hàng câu hỏi</b>
            <p>{error}</p>
            <button type="button" className="rm-btn" onClick={load}>Thử lại</button>
          </div>
        )}

        {state === 'ready' && rows.length === 0 && (
          <div className="rm-state">
            <b>Ngân hàng đang trống</b>
            <p>Chưa có câu hỏi nào trong Supabase. Dùng <code>npm run import:questions</code> để nhập đề đã gắn chuyên đề.</p>
          </div>
        )}

        {state === 'ready' && rows.length > 0 && (
          <>
            <div className="rm-tagger-progress">
              <div className="rm-bar">
                <i style={{ width: `${stats.total ? Math.round((stats.tagged / stats.total) * 100) : 0}%` }} />
              </div>
              <span>{stats.tagged}/{stats.total} câu đã gắn chuyên đề · còn {stats.untagged}</span>
            </div>

            <div className="rm-tagger-toolbar">
              <div className="rm-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm nội dung câu hỏi hoặc tên đề…"
                  aria-label="Tìm câu hỏi"
                />
              </div>
              <label className="rm-check">
                <input type="checkbox" checked={onlyUntagged} onChange={(e) => setOnlyUntagged(e.target.checked)} />
                Chỉ câu chưa gắn
              </label>
            </div>

            <div className="rm-bulk">
              <label className="rm-check">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} />
                Chọn tất cả ({view.length})
              </label>
              <select value={bulkTopic} onChange={(e) => setBulkTopic(e.target.value)} aria-label="Chuyên đề gán hàng loạt">
                <option value="">— Chọn chuyên đề —</option>
                {GROUPS.map((g) => (
                  <optgroup key={g.grade} label={g.label}>
                    {g.topics.map((t) => <option key={t.id} value={t.id}>{labelOf(t)}</option>)}
                  </optgroup>
                ))}
              </select>
              <button type="button" className="rm-btn sm" onClick={applyBulk} disabled={!selected.length}>
                Gán cho {selected.length} câu
              </button>
            </div>

            <ul className="rm-tagger-list">
              {view.length === 0 && (
                <li className="rm-tagger-empty">Không còn câu nào khớp bộ lọc.</li>
              )}
              {view.map((r) => {
                const topic = pending[r.id] !== undefined ? pending[r.id] : r.topic_id;
                const changed = pending[r.id] !== undefined && pending[r.id] !== r.topic_id;
                return (
                  <li key={r.id} className={changed ? 'is-changed' : ''}>
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label="Chọn câu này"
                    />
                    <div className="rm-tagger-row">
                      <p>{r.content}</p>
                      <small>
                        {r.examTitle} · {r.difficulty || 'chưa rõ độ khó'}
                        {r.explanation ? '' : ' · thiếu lời giải'}
                      </small>
                    </div>
                    <select
                      className="rm-tagger-select"
                      value={topic || ''}
                      onChange={(e) => setTopicFor(r.id, e.target.value)}
                      aria-label="Chọn chuyên đề cho câu này"
                    >
                      <option value="">— Chưa phân loại —</option>
                      {GROUPS.map((g) => (
                        <optgroup key={g.grade} label={g.label}>
                          {g.topics.map((t) => <option key={t.id} value={t.id}>{labelOf(t)}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>

            <footer className="rm-tagger-foot">
              {toast && <span className={`rm-toast ${toast.kind}`}>{toast.text}</span>}
              <div className="rm-tagger-actions">
                <button type="button" className="rm-btn" onClick={onClose}>Đóng</button>
                <button type="button" className="rm-btn primary" onClick={save} disabled={!pendingEntries.length || saving}>
                  {saving ? 'Đang lưu…' : `Lưu thay đổi (${pendingEntries.length})`}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
