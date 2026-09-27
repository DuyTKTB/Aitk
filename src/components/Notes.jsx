import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks.js';

const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const URL_NOTES = `${DB}/notes.json`;
const STREAM_NOTES = `${URL_NOTES}?orderBy=%22%24key%22&limitToLast=100`;

const SUBJECTS = [
  { key: 'all', label: 'Tất cả', color: 'var(--ink)' },
  { key: 'hoa', label: '🧪 Hóa', color: 'var(--metalloid)' },
  { key: 'ly', label: '⚛️ Lý', color: 'var(--nonmetal)' },
  { key: 'toan', label: '📐 Toán', color: 'var(--transition)' },
  { key: 'sinh', label: '🧬 Sinh', color: 'var(--post)' },
  { key: 'van', label: '📖 Văn', color: 'var(--alkaline)' },
  { key: 'anh', label: '🌐 Anh', color: 'var(--noble)' },
  { key: 'khac', label: '📌 Khác', color: 'var(--actinide)' },
];

const rid = () => Math.random().toString(36).slice(2, 10);
const MAX_LEN = 500;
const CARD_W = 260;
const CARD_H = 160;

// Vị trí ngẫu nhiên trong canvas (tránh chồng quá nhiều)
function randomPos(index, total) {
  const cols = Math.max(3, Math.floor((window.innerWidth - 80) / (CARD_W + 20)));
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: 40 + col * (CARD_W + 20) + Math.random() * 20,
    y: 40 + row * (CARD_H + 20) + Math.random() * 20,
  };
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // note đang sửa
  const [form, setForm] = useState({ subject: 'hoa', title: '', body: '', name: '' });
  const [myVotes, setMyVotes] = useLocalStorage('cs-note-votes', {});
  const [name, setName] = useLocalStorage('cs-note-name', 'Bạn ' + Math.floor(1000 + Math.random() * 9000));
  const [uid] = useLocalStorage('cs-uid', rid());
  const [dragMode, setDragMode] = useLocalStorage('cs-notes-dragmode', false);
  const [online, setOnline] = useState(false);
  const [err, setErr] = useState('');
  const [dragging, setDragging] = useState(null);
  const dragRef = useRef(null);

  const localMode = !DB;

  // Load notes
  useEffect(() => {
    if (localMode) {
      try {
        const raw = localStorage.getItem('cs-notes-local');
        if (raw) setNotes(JSON.parse(raw));
      } catch {}
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

  // Persist local
  useEffect(() => {
    if (localMode) {
      try { localStorage.setItem('cs-notes-local', JSON.stringify(notes)); } catch {}
    }
  }, [notes, localMode]);

  // Submit (tạo hoặc sửa)
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

    // Sửa note cũ
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
      setForm({ subject: 'hoa', title: '', body: '', name: '' });
      setShowForm(false);
      return;
    }

    // Tạo note mới
    const pos = randomPos(notes.length, notes.length + 1);
    const note = { ...base, t: Date.now(), votes: 0, x: pos.x, y: pos.y };

    if (localMode) {
      setNotes((n) => [...n, { ...note, id: rid() }]);
      setForm({ subject: 'hoa', title: '', body: '', name: '' });
      setShowForm(false);
      return;
    }

    try {
      const r = await fetch(URL_NOTES, { method: 'POST', body: JSON.stringify(note) });
      if (!r.ok) throw new Error();
      setForm({ subject: 'hoa', title: '', body: '', name: '' });
      setShowForm(false);
      setErr('');
    } catch {
      setErr('Gửi thất bại. Kiểm tra mạng hoặc quy tắc Firebase.');
    }
  };

  const vote = async (note) => {
    const id = note.id;
    const already = myVotes[id];
    const delta = already ? -1 : 1;

    setNotes((n) =>
      n.map((x) => (x.id === id ? { ...x, votes: (x.votes || 0) + delta } : x))
    );
    setMyVotes({ ...myVotes, [id]: !already });

    if (localMode) return;
    try {
      const newCount = (note.votes || 0) + delta;
      await fetch(`${DB}/notes/${id}/votes.json`, {
        method: 'PUT',
        body: JSON.stringify(newCount),
      });
    } catch {
      setNotes((n) =>
        n.map((x) => (x.id === id ? { ...x, votes: (x.votes || 0) - delta } : x))
      );
      setMyVotes({ ...myVotes, [id]: already });
    }
  };

  const remove = async (note) => {
    if (note.uid !== uid) return;
    if (!confirm('Xóa ghi chú này?')) return;
    setNotes((n) => n.filter((x) => x.id !== note.id));
    if (localMode) return;
    try {
      await fetch(`${DB}/notes/${note.id}.json`, { method: 'DELETE' });
    } catch {}
  };

  const startEdit = (note) => {
    setEditing(note);
    setForm({
      subject: note.subject,
      title: note.title || '',
      body: note.body,
      name: note.name,
    });
    setShowForm(true);
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Drag handlers
  const onPointerDown = (e, note) => {
    if (!dragMode) return;
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      id: note.id,
      sx: e.clientX,
      sy: e.clientY,
      ox: note.x || 0,
      oy: note.y || 0,
      moved: false,
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;

    // Cập nhật local state ngay để mượt
    setNotes((n) =>
      n.map((x) =>
        x.id === d.id
          ? { ...x, x: Math.max(0, d.ox + dx), y: Math.max(0, d.oy + dy) }
          : x
      )
    );
    setDragging(d.id);
  };

  const onPointerUp = async (e, note) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || !d.moved) return;
    setDragging(null);

    // Tìm note đã cập nhật
    const updated = notes.find((x) => x.id === d.id);
    if (!updated) return;

    if (localMode) return;
    try {
      await fetch(`${DB}/notes/${d.id}.json`, {
        method: 'PATCH',
        body: JSON.stringify({ x: updated.x, y: updated.y }),
      });
    } catch {
      // rollback không cần — lần sau mở lại sẽ đồng bộ từ server
    }
  };

  const filtered = useMemo(() => {
    let list = notes;
    if (filter !== 'all') list = list.filter((n) => n.subject === filter);
    if (sort === 'hot') {
      list = [...list].sort((a, b) => (b.votes || 0) - (a.votes || 0) || b.t - a.t);
    } else {
      list = [...list].sort((a, b) => b.t - a.t);
    }
    return list;
  }, [notes, filter, sort]);

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
    <section className="wrap notes-page">
      <div className="notes-header">
        <div>
          <h1>Ghi chú cộng đồng</h1>
          <p className="lead" style={{ fontSize: '1rem', margin: 0 }}>
            {dragMode
              ? '🔓 Chế độ di chuyển: kéo thả note tự do'
              : '🔒 Note cố định. Bật di chuyển để sắp xếp.'}
          </p>
        </div>
        <div className="row">
          <button
            className={'btn' + (dragMode ? ' primary' : '')}
            onClick={() => setDragMode(!dragMode)}
            title={dragMode ? 'Khoá vị trí note' : 'Cho phép kéo thả note'}
          >
            {dragMode ? '🔓 Đang mở' : '🔒 Đang khoá'}
          </button>
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null);
              setForm({ subject: 'hoa', title: '', body: '', name });
              setShowForm(true);
            }}
          >
            + Đăng ghi chú
          </button>
        </div>
      </div>

      <div className="row notes-filter">
        <div className="chips">
          {SUBJECTS.map((s) => (
            <button
              key={s.key}
              className={'chip' + (filter === s.key ? ' on' : '')}
              onClick={() => setFilter(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="chips">
          <button className={'chip' + (sort === 'new' ? ' on' : '')} onClick={() => setSort('new')}>
            🕐 Mới
          </button>
          <button className={'chip' + (sort === 'hot' ? ' on' : '')} onClick={() => setSort('hot')}>
            🔥 Hot
          </button>
        </div>
      </div>

      <p className="hint">
        {filtered.length} ghi chú
        {!localMode && (online ? ' · 🟢 trực tuyến' : ' · 🔴 mất kết nối')}
        {dragMode && ' · kéo note để di chuyển'}
      </p>

      {/* Canvas */}
      {filtered.length === 0 ? (
        <p className="hint center" style={{ padding: '3rem 0' }}>
          Chưa có ghi chú nào. Bấm "+ Đăng ghi chú" để bắt đầu!
        </p>
      ) : (
        <div className={'notes-canvas' + (dragMode ? ' drag-on' : '')}>
          {filtered.map((n) => {
            const s = subjectMeta(n.subject);
            const voted = myVotes[n.id];
            const isDragging = dragging === n.id;
            return (
              <article
                key={n.id}
                className={'note-card' + (isDragging ? ' dragging' : '')}
                style={{
                  left: (n.x || 0) + 'px',
                  top: (n.y || 0) + 'px',
                  borderTopColor: s.color,
                  cursor: dragMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
                }}
                onPointerDown={(e) => onPointerDown(e, n)}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => onPointerUp(e, n)}
              >
                <div className="note-head">
                  <span className="badge" style={{ background: s.color, color: '#111' }}>
                    {s.label}
                  </span>
                  {n.uid === uid && (
                    <div className="row" style={{ gap: '.2rem' }}>
                      <button className="x" onClick={() => startEdit(n)} aria-label="Sửa" title="Sửa">✏️</button>
                      <button className="x" onClick={() => remove(n)} aria-label="Xóa" title="Xóa">×</button>
                    </div>
                  )}
                </div>

                {n.title && <h3 className="note-title">{n.title}</h3>}
                <p className="note-body">{n.body}</p>

                <div className="note-foot">
                  <small className="hint">
                    <b>{n.name}</b> · {timeAgo(n.t)}
                  </small>
                  <button
                    className={'vote-btn' + (voted ? ' voted' : '')}
                    onClick={(e) => { e.stopPropagation(); vote(n); }}
                    aria-label="Thích"
                  >
                    ♥ {n.votes || 0}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div
          className="backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && (setShowForm(false), setEditing(null))}
        >
          <form className="modal noteform" onSubmit={submit} style={{ padding: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{editing ? '✏️ Sửa ghi chú' : '📝 Đăng ghi chú mới'}</h2>

            <label style={{ marginTop: '1rem' }}>
              Tên bạn
              <input
                value={form.name || name}
                maxLength={20}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setName(e.target.value);
                }}
                placeholder="Ẩn danh"
              />
            </label>

            <div className="chips" style={{ marginTop: '1rem' }}>
              {SUBJECTS.filter((s) => s.key !== 'all').map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={'chip' + (form.subject === s.key ? ' on' : '')}
                  onClick={() => setForm({ ...form, subject: s.key })}
                  style={form.subject === s.key ? { background: s.color, color: '#111' } : undefined}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <label style={{ marginTop: '1rem' }}>
              Tiêu đề (không bắt buộc)
              <input
                value={form.title}
                maxLength={80}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Vd: Mẹo cân bằng PTHH nhanh"
              />
            </label>

            <label style={{ marginTop: '1rem' }}>
              Nội dung
              <textarea
                value={form.body}
                maxLength={MAX_LEN}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Chia sẻ cách học, công thức, mẹo hay..."
                rows={5}
                autoFocus
              />
            </label>

            <div className="row" style={{ justifyContent: 'space-between', marginTop: '.6rem' }}>
              <small className="hint">{form.body.length}/{MAX_LEN} ký tự</small>
              <div className="row">
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                >
                  Huỷ
                </button>
                <button className="btn primary" type="submit" disabled={!form.body.trim()}>
                  {editing ? '💾 Lưu' : '📤 Đăng'}
                </button>
              </div>
            </div>

            {err && <p className="hint" style={{ color: 'var(--acc)' }}>{err}</p>}
          </form>
        </div>
      )}
    </section>
  );
}