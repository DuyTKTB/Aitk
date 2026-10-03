import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from '../hooks.js';
import {
  IcoPlus, IcoSearch, IcoHeart, IcoEdit, IcoTrash, IcoClose, IcoCheck,
  IcoPin, IcoCopy, IcoShare, IcoDownload, IcoUpload, IcoFilter, IcoSort,
  IcoGrid, IcoList, IcoUser, IcoClock, IcoFlame, IcoSparkle, IcoTag,
  IcoStats, IcoEye, IcoInfo,
} from './NoteIcons.jsx';
import './notes-v2.css';

const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const URL_NOTES = `${DB}/notes.json`;
const STREAM_NOTES = `${URL_NOTES}?orderBy=%22%24key%22&limitToLast=100`;

const SUBJECTS = [
  { key: 'all', label: 'Tất cả', color: 'var(--ink)' },
  { key: 'hoa', label: 'Hóa học', color: '#8fd6c4' },
  { key: 'ly', label: 'Vật lí', color: '#a7c4f2' },
  { key: 'toan', label: 'Toán', color: '#f3e27a' },
  { key: 'sinh', label: 'Sinh học', color: '#b7dc9a' },
  { key: 'van', label: 'Ngữ văn', color: '#ffc46b' },
  { key: 'anh', label: 'Tiếng Anh', color: '#e6b3e0' },
  { key: 'khac', label: 'Khác', color: '#c9c5b8' },
];

const rid = () => Math.random().toString(36).slice(2, 10);
const MAX_LEN = 500;
const STORAGE_KEY = 'cs-notes-local-v2';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [search, setSearch] = useState('');
  const [filterMine, setFilterMine] = useState(false);
  const [onlyVoted, setOnlyVoted] = useState(false);
  const [viewMode, setViewMode] = useLocalStorage('cs-notes-view', 'grid');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ subject: 'hoa', title: '', body: '', name: '' });
  const [myVotes, setMyVotes] = useLocalStorage('cs-note-votes-v2', {});
  const [name, setName] = useLocalStorage('cs-note-name', 'Bạn ' + Math.floor(1000 + Math.random() * 9000));
  const [uid] = useLocalStorage('cs-uid', rid());
  const [online, setOnline] = useState(false);
  const [err, setErr] = useState('');
  const [undoNote, setUndoNote] = useState(null);
  const [toast, setToast] = useState(null);
  const [detailNote, setDetailNote] = useState(null);
  const fileRef = useRef(null);

  const localMode = !DB;

  const showToast = (text, type = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* ---------- Load + realtime ---------- */
  useEffect(() => {
    if (localMode) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setNotes(JSON.parse(raw));
      } catch { /* */ }
      return;
    }
    const es = new EventSource(STREAM_NOTES);
    es.onopen = () => setOnline(true);
    es.onerror = () => setOnline(false);
    es.addEventListener('put', (e) => {
      const { path, data } = JSON.parse(e.data);
      setNotes((n) => {
        if (path === '/') {
          return data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
        }
        const id = path.slice(1);
        if (id.includes('/')) return n;
        if (data === null) return n.filter((x) => x.id !== id);
        return n.some((x) => x.id === id) ? n : [...n, { id, ...data }];
      });
    });
    return () => es.close();
  }, [localMode]);

  useEffect(() => {
    if (localMode) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch { /* */ }
    }
  }, [notes, localMode]);

  /* ---------- Save ---------- */
  const submit = async (e) => {
    e.preventDefault();
    const title = form.title.trim().slice(0, 80);
    const body = form.body.trim().slice(0, MAX_LEN);
    if (!body) return;

    const base = {
      subject: form.subject,
      title,
      body,
      name: (form.name.trim() || name).slice(0, 20),
      uid,
    };

    if (editing) {
      if (localMode) {
        setNotes((n) => n.map((x) => (x.id === editing.id ? { ...x, ...base } : x)));
      } else {
        try {
          await fetch(`${DB}/notes/${editing.id}.json`, {
            method: 'PATCH',
            body: JSON.stringify(base),
          });
        } catch {
          setErr('Sửa thất bại.');
          return;
        }
      }
      setEditing(null);
      setForm({ subject: 'hoa', title: '', body: '', name });
      setShowForm(false);
      showToast('Đã cập nhật ghi chú');
      return;
    }

    const note = {
      ...base,
      t: Date.now(),
      votes: 0,
      pinned: false,
    };

    if (localMode) {
      setNotes((n) => [...n, { ...note, id: rid() }]);
      setForm({ subject: 'hoa', title: '', body: '', name });
      setShowForm(false);
      showToast('Đã đăng ghi chú');
      return;
    }

    try {
      const r = await fetch(URL_NOTES, { method: 'POST', body: JSON.stringify(note) });
      if (!r.ok) throw new Error();
      setForm({ subject: 'hoa', title: '', body: '', name });
      setShowForm(false);
      setErr('');
      showToast('Đã đăng ghi chú');
    } catch {
      setErr('Gửi thất bại. Kiểm tra mạng hoặc quy tắc Firebase.');
    }
  };

  /* ---------- Vote ---------- */
  const vote = async (note) => {
    const id = note.id;
    const already = myVotes[id];
    const delta = already ? -1 : 1;

    setNotes((n) => n.map((x) => (x.id === id ? { ...x, votes: (x.votes || 0) + delta } : x)));
    setMyVotes({ ...myVotes, [id]: !already });

    if (localMode) return;
    try {
      const newCount = (note.votes || 0) + delta;
      await fetch(`${DB}/notes/${id}/votes.json`, {
        method: 'PUT',
        body: JSON.stringify(newCount),
      });
    } catch {
      setNotes((n) => n.map((x) => (x.id === id ? { ...x, votes: (x.votes || 0) - delta } : x)));
      setMyVotes({ ...myVotes, [id]: already });
    }
  };

  /* ---------- Pin toggle ---------- */
  const togglePin = async (note) => {
    const next = !note.pinned;
    setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, pinned: next } : x)));
    if (localMode) return;
    try {
      await fetch(`${DB}/notes/${note.id}.json`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: next }),
      });
    } catch { /* */ }
  };

  /* ---------- Delete + Undo ---------- */
  const remove = async (note) => {
    if (note.uid !== uid) return;
    if (!confirm('Xóa ghi chú này?')) return;
    setNotes((n) => n.filter((x) => x.id !== note.id));
    setUndoNote(note);
    setTimeout(() => setUndoNote(null), 5000);

    if (localMode) return;
    try {
      await fetch(`${DB}/notes/${note.id}.json`, { method: 'DELETE' });
    } catch { /* */ }
  };

  const undoDelete = () => {
    if (!undoNote) return;
    setNotes((n) => [...n, undoNote]);
    setUndoNote(null);
    showToast('Đã hoàn tác');
  };

  /* ---------- Edit ---------- */
  const startEdit = (note) => {
    setEditing(note);
    setForm({
      subject: note.subject,
      title: note.title || '',
      body: note.body,
      name: note.name,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------- Copy ---------- */
  const copyNote = async (note) => {
    const text = `${note.title ? note.title + '\n\n' : ''}${note.body}\n\n— ${note.name}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Đã sao chép');
    } catch {
      showToast('Không sao chép được', 'err');
    }
  };

  /* ---------- Export / Import ---------- */
  const exportJSON = () => {
    const data = JSON.stringify(notes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải backup');
  };

  const importJSON = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('File không hợp lệ');
      const count = data.length;
      if (!confirm(`Nhập ${count} ghi chú? Ghi chú hiện tại sẽ bị ghi đè.`)) return;
      setNotes(data);
      showToast(`Đã nhập ${count} ghi chú`);
    } catch (e) {
      showToast('Import thất bại: ' + e.message, 'err');
    }
  };

  /* ---------- Filter + Sort ---------- */
  const filtered = useMemo(() => {
    let list = notes;

    if (filter !== 'all') list = list.filter((n) => n.subject === filter);
    if (filterMine) list = list.filter((n) => n.uid === uid);
    if (onlyVoted) list = list.filter((n) => myVotes[n.id]);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          (n.name || '').toLowerCase().includes(q)
      );
    }

    // Sort: pinned trước
    list = [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (sort === 'hot') return (b.votes || 0) - (a.votes || 0) || b.t - a.t;
      return b.t - a.t;
    });

    return list;
  }, [notes, filter, sort, search, filterMine, onlyVoted, myVotes, uid]);

  const stats = useMemo(() => {
    const total = notes.length;
    const mine = notes.filter((n) => n.uid === uid).length;
    const totalVotes = notes.reduce((s, n) => s + (n.votes || 0), 0);
    const pinned = notes.filter((n) => n.pinned).length;
    return { total, mine, totalVotes, pinned };
  }, [notes, uid]);

  const subjectMeta = (key) => SUBJECTS.find((s) => s.key === key) || SUBJECTS[SUBJECTS.length - 1];

  const timeAgo = (t) => {
    const diff = Date.now() - t;
    if (diff < 60e3) return 'vừa xong';
    if (diff < 36e5) return Math.floor(diff / 60e3) + ' phút';
    if (diff < 864e5) return Math.floor(diff / 36e5) + ' giờ';
    if (diff < 7 * 864e5) return Math.floor(diff / 864e5) + ' ngày';
    return new Date(t).toLocaleDateString('vi-VN');
  };

  return (
    <section className="wrap notes-page-v2">
      {/* ============ HEADER ============ */}
      <header className="nt-header">
        <div className="nt-header-l">
          <h1 className="nt-title">Ghi chú cộng đồng</h1>
          <p className="nt-sub">
            Chia sẻ cách học, công thức, mẹo hay với mọi người
            {!localMode && (
              <span className={'nt-status ' + (online ? 'on' : 'off')}>
                <i />
                {online ? 'Trực tuyến' : 'Mất kết nối'}
              </span>
            )}
          </p>
        </div>

        <div className="nt-header-r">
          <button
            type="button"
            className="nt-btn nt-btn-ghost"
            onClick={exportJSON}
            title="Tải backup JSON"
          >
            <IcoDownload size={16} />
            <span>Backup</span>
          </button>

          <label className="nt-btn nt-btn-ghost" style={{ cursor: 'pointer' }}>
            <IcoUpload size={16} />
            <span>Nhập</span>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              hidden
              onChange={(e) => importJSON(e.target.files[0])}
            />
          </label>

          <button
            type="button"
            className="nt-btn nt-btn-primary"
            onClick={() => {
              setEditing(null);
              setForm({ subject: 'hoa', title: '', body: '', name });
              setShowForm(true);
            }}
          >
            <IcoPlus size={16} />
            <span>Đăng ghi chú</span>
          </button>
        </div>
      </header>

      {/* ============ STATS ============ */}
      <div className="nt-stats">
        <div className="nt-stat">
          <span className="nt-stat-ico"><IcoStats size={18} /></span>
          <div>
            <b>{stats.total}</b>
            <small>Tổng ghi chú</small>
          </div>
        </div>
        <div className="nt-stat">
          <span className="nt-stat-ico"><IcoUser size={18} /></span>
          <div>
            <b>{stats.mine}</b>
            <small>Của bạn</small>
          </div>
        </div>
        <div className="nt-stat">
          <span className="nt-stat-ico"><IcoHeart size={18} /></span>
          <div>
            <b>{stats.totalVotes}</b>
            <small>Lượt thích</small>
          </div>
        </div>
        <div className="nt-stat">
          <span className="nt-stat-ico"><IcoPin size={18} /></span>
          <div>
            <b>{stats.pinned}</b>
            <small>Đã ghim</small>
          </div>
        </div>
      </div>

      {/* ============ TOOLBAR ============ */}
      <div className="nt-toolbar">
        <label className="nt-search">
          <IcoSearch size={16} />
          <input
            type="text"
            placeholder="Tìm ghi chú theo tiêu đề, nội dung, tác giả…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">
              <IcoClose size={14} />
            </button>
          )}
        </label>

        <div className="nt-toolbar-group">
          <label className="nt-select">
            <IcoSort size={14} />
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Mới nhất</option>
              <option value="hot">Nhiều thích</option>
            </select>
          </label>

          <div className="nt-seg">
            <button
              type="button"
              className={viewMode === 'grid' ? 'on' : ''}
              onClick={() => setViewMode('grid')}
              title="Lưới"
            >
              <IcoGrid size={15} />
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'on' : ''}
              onClick={() => setViewMode('list')}
              title="Danh sách"
            >
              <IcoList size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ============ FILTER CHIPS ============ */}
      <div className="nt-filters">
        {SUBJECTS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={'nt-chip' + (filter === s.key ? ' on' : '')}
            style={filter === s.key && s.key !== 'all' ? { background: s.color, color: '#111', borderColor: 'transparent' } : undefined}
            onClick={() => setFilter(s.key)}
          >
            {s.label}
          </button>
        ))}

        <span className="nt-divider" />

        <button
          type="button"
          className={'nt-chip' + (filterMine ? ' on' : '')}
          onClick={() => setFilterMine(!filterMine)}
        >
          <IcoUser size={13} /> Của tôi
        </button>

        <button
          type="button"
          className={'nt-chip' + (onlyVoted ? ' on' : '')}
          onClick={() => setOnlyVoted(!onlyVoted)}
        >
          <IcoHeart size={13} /> Đã thích
        </button>
      </div>

      <p className="nt-count">
        <b>{filtered.length}</b> ghi chú
        {search && <> · tìm "<b>{search}</b>"</>}
      </p>

      {/* ============ CONTENT ============ */}
      {filtered.length === 0 ? (
        <div className="nt-empty">
          <span className="nt-empty-ico">
            <IcoSparkle size={32} />
          </span>
          <h3>
            {notes.length === 0
              ? 'Chưa có ghi chú nào'
              : 'Không tìm thấy ghi chú phù hợp'}
          </h3>
          <p>
            {notes.length === 0
              ? 'Chia sẻ cách học, công thức hoặc mẹo hay đầu tiên!'
              : 'Thử xóa bộ lọc hoặc tìm từ khác.'}
          </p>
          {notes.length === 0 ? (
            <button
              className="nt-btn nt-btn-primary"
              onClick={() => setShowForm(true)}
            >
              <IcoPlus size={15} /> Đăng ghi chú đầu tiên
            </button>
          ) : (
            <button
              className="nt-btn nt-btn-ghost"
              onClick={() => {
                setSearch('');
                setFilter('all');
                setFilterMine(false);
                setOnlyVoted(false);
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className={'nt-notes ' + viewMode}>
          {filtered.map((n) => {
            const s = subjectMeta(n.subject);
            const voted = myVotes[n.id];
            const isMine = n.uid === uid;
            return (
              <article
                key={n.id}
                className={'nt-note' + (n.pinned ? ' pinned' : '')}
                style={{ '--nt-color': s.color }}
              >
                {n.pinned && (
                  <span className="nt-note-pin" title="Đã ghim">
                    <IcoPin size={12} filled />
                  </span>
                )}

                <header className="nt-note-head">
                  <span className="nt-note-tag" style={{ background: s.color }}>
                    {s.label}
                  </span>
                  {isMine && (
                    <div className="nt-note-actions">
                      <button
                        type="button"
                        className={'nt-icon' + (n.pinned ? ' on' : '')}
                        onClick={() => togglePin(n)}
                        title={n.pinned ? 'Bỏ ghim' : 'Ghim'}
                      >
                        <IcoPin size={14} filled={n.pinned} />
                      </button>
                      <button
                        type="button"
                        className="nt-icon"
                        onClick={() => startEdit(n)}
                        title="Sửa"
                      >
                        <IcoEdit size={14} />
                      </button>
                      <button
                        type="button"
                        className="nt-icon danger"
                        onClick={() => remove(n)}
                        title="Xóa"
                      >
                        <IcoTrash size={14} />
                      </button>
                    </div>
                  )}
                </header>

                {n.title && <h3 className="nt-note-title">{n.title}</h3>}
                <p className="nt-note-body">{n.body}</p>

                <footer className="nt-note-foot">
                  <div className="nt-note-meta">
                    <span className="nt-note-author">
                      <IcoUser size={13} />
                      <b>{n.name}</b>
                    </span>
                    <span className="nt-note-time">
                      <IcoClock size={13} />
                      {timeAgo(n.t)}
                    </span>
                  </div>

                  <div className="nt-note-actions-r">
                    <button
                      type="button"
                      className="nt-icon"
                      onClick={() => copyNote(n)}
                      title="Sao chép"
                    >
                      <IcoCopy size={14} />
                    </button>
                    <button
                      type="button"
                      className="nt-icon"
                      onClick={() => setDetailNote(n)}
                      title="Xem chi tiết"
                    >
                      <IcoEye size={14} />
                    </button>
                    <button
                      type="button"
                      className={'nt-vote' + (voted ? ' voted' : '')}
                      onClick={() => vote(n)}
                      title={voted ? 'Bỏ thích' : 'Thích'}
                    >
                      <IcoHeart size={14} filled={voted} />
                      <span>{n.votes || 0}</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* ============ UNDO TOAST ============ */}
      {undoNote && (
        <div className="nt-undo">
          <span>Đã xóa ghi chú</span>
          <button type="button" onClick={undoDelete}>
            <IcoCheck size={14} />
            Hoàn tác
          </button>
        </div>
      )}

      {/* ============ TOAST ============ */}
      {toast && (
        <div className={'nt-toast ' + (toast.type === 'err' ? 'err' : 'ok')}>
          <IcoCheck size={14} />
          {toast.text}
        </div>
      )}

      {/* ============ MODAL FORM ============ */}
      {showForm && (
        <div
          className="nt-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditing(null);
            }
          }}
        >
          <form className="nt-modal" onSubmit={submit}>
            <header className="nt-modal-head">
              <h2>
                {editing ? <><IcoEdit size={18} /> Sửa ghi chú</> : <><IcoPlus size={18} /> Đăng ghi chú</>}
              </h2>
              <button
                type="button"
                className="nt-modal-x"
                onClick={() => { setShowForm(false); setEditing(null); }}
                aria-label="Đóng"
              >
                <IcoClose size={16} />
              </button>
            </header>

            <div className="nt-modal-body">
              <label className="nt-field">
                <span>Tên bạn</span>
                <input
                  type="text"
                  value={form.name || name}
                  maxLength={20}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setName(e.target.value);
                  }}
                  placeholder="Ẩn danh"
                />
              </label>

              <div className="nt-field">
                <span>Môn học</span>
                <div className="nt-subject-picker">
                  {SUBJECTS.filter((s) => s.key !== 'all').map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      className={'nt-subject' + (form.subject === s.key ? ' on' : '')}
                      style={form.subject === s.key ? { background: s.color, borderColor: 'transparent', color: '#111' } : undefined}
                      onClick={() => setForm({ ...form, subject: s.key })}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="nt-field">
                <span>Tiêu đề (không bắt buộc)</span>
                <input
                  type="text"
                  value={form.title}
                  maxLength={80}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Mẹo cân bằng PTHH nhanh"
                />
              </label>

              <label className="nt-field">
                <span>Nội dung</span>
                <textarea
                  value={form.body}
                  maxLength={MAX_LEN}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Chia sẻ cách học, công thức, mẹo hay…"
                  rows={6}
                  autoFocus
                />
                <small className="nt-field-hint">
                  {form.body.length}/{MAX_LEN} ký tự
                </small>
              </label>

              {err && <p className="nt-err">{err}</p>}
            </div>

            <footer className="nt-modal-foot">
              <button
                type="button"
                className="nt-btn nt-btn-ghost"
                onClick={() => { setShowForm(false); setEditing(null); }}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="nt-btn nt-btn-primary"
                disabled={!form.body.trim()}
              >
                {editing ? <><IcoCheck size={15} /> Lưu</> : <><IcoUpload size={15} /> Đăng</>}
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {detailNote && (
        <div
          className="nt-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setDetailNote(null)}
        >
          <div className="nt-detail">
            <header className="nt-detail-head">
              <span
                className="nt-note-tag"
                style={{ background: subjectMeta(detailNote.subject).color }}
              >
                {subjectMeta(detailNote.subject).label}
              </span>
              <button
                type="button"
                className="nt-modal-x"
                onClick={() => setDetailNote(null)}
              >
                <IcoClose size={16} />
              </button>
            </header>

            {detailNote.title && (
              <h2 className="nt-detail-title">{detailNote.title}</h2>
            )}

            <p className="nt-detail-body">{detailNote.body}</p>

            <footer className="nt-detail-foot">
              <span className="nt-note-author">
                <IcoUser size={14} />
                <b>{detailNote.name}</b>
              </span>
              <span className="nt-note-time">
                <IcoClock size={14} />
                {new Date(detailNote.t).toLocaleString('vi-VN')}
              </span>
            </footer>

            <div className="nt-detail-actions">
              <button
                type="button"
                className="nt-btn nt-btn-ghost"
                onClick={() => copyNote(detailNote)}
              >
                <IcoCopy size={15} /> Sao chép
              </button>
              <button
                type="button"
                className={'nt-btn nt-btn-primary' + (myVotes[detailNote.id] ? ' voted' : '')}
                onClick={() => vote(detailNote)}
              >
                <IcoHeart size={15} filled={myVotes[detailNote.id]} />
                {detailNote.votes || 0} thích
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}