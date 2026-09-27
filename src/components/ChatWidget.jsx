import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from '../hooks.js';

const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const URL_MSG = `${DB}/chat/messages.json`;
const URL_ONLINE = `${DB}/chat/online.json`;
const STREAM = `${URL_MSG}?orderBy=%22%24key%22&limitToLast=50`;
const KEEP = 100;
const rid = () => Math.random().toString(36).slice(2, 10);

const EMOJIS = ['😀','😄','😁','😅','😂','🤣','😊','😍','😘','😎','🤔','😐','😑','😴','🤯','🥳','😭','😢','😡','🤬','👍','👎','👏','🙏','💪','🤝','👋','✌️','❤️','💔','💯','🔥','✨','⭐','🎉','🎊','🧪','⚗️','🔬','📚'];
const REACTIONS = [
  { key: 'heart', icon: '❤️' },
  { key: 'like', icon: '👍' },
  { key: 'haha', icon: '😂' },
  { key: 'wow', icon: '😮' },
];

async function shrink(file) {
  const b = await createImageBitmap(file);
  const k = Math.min(1, 800 / Math.max(b.width, b.height));
  const c = document.createElement('canvas');
  c.width = Math.round(b.width * k);
  c.height = Math.round(b.height * k);
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

/* ============ LIGHTBOX ============ */
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="chat-lightbox" onClick={onClose}>
      <button className="chat-lightbox-close" onClick={onClose} type="button">×</button>
      <img src={src} alt="Ảnh phóng to" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState('');
  const [img, setImg] = useState(null);
  const [err, setErr] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [visibleCount, setVisibleCount] = useState(50);

  const [name, setName] = useLocalStorage('cs-chatname', 'Bạn ' + Math.floor(1000 + Math.random() * 9000));
  const [uid] = useLocalStorage('cs-uid', rid());
  const end = useRef(null);
  const last = useRef(0);
  const inputRef = useRef(null);

  /* ==== STREAM MESSAGES ==== */
  useEffect(() => {
    if (!DB || !open) return;

    const es = new EventSource(STREAM);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.addEventListener('put', (e) => {
      const { path, data } = JSON.parse(e.data);
      setMsgs((m) => {
        if (path === '/') {
          return data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
        }
        const id = path.slice(1);
        // reaction update: path = "msgId/reactions"
        if (id.includes('/')) {
          const [msgId, sub] = id.split('/');
          if (sub === 'reactions') {
            return m.map((x) => (x.id === msgId ? { ...x, reactions: data || {} } : x));
          }
          return m;
        }
        if (data === null) return m.filter((x) => x.id !== id);
        return m.some((x) => x.id === id) ? m : [...m.slice(-(KEEP - 1)), { id, ...data }];
      });
    });
    return () => es.close();
  }, [open]);

  /* ==== ONLINE POLLING (mỗi 10s) ==== */
  useEffect(() => {
    if (!DB || !open) return;

    const ping = async () => {
      try {
        await fetch(`${URL_ONLINE}/${uid}.json`, {
          method: 'PUT',
          body: JSON.stringify({ n: name.trim() || 'Ẩn danh', t: Date.now() }),
        });
      } catch {}
    };

    const fetchOnline = async () => {
      try {
        const r = await fetch(URL_ONLINE);
        const data = await r.json();
        const now = Date.now();
        const filtered = {};
        if (data) {
          for (const [u, v] of Object.entries(data)) {
            if (v && v.t && now - v.t < 45000) filtered[u] = v.n;
          }
        }
        setOnlineUsers(filtered);
      } catch {}
    };

    ping();
    fetchOnline();
    const pingId = setInterval(ping, 15000);
    const fetchId = setInterval(fetchOnline, 10000);

    return () => {
      clearInterval(pingId);
      clearInterval(fetchId);
      // Xóa khỏi online khi đóng
      fetch(`${URL_ONLINE}/${uid}.json`, { method: 'DELETE' }).catch(() => {});
    };
  }, [open, uid, name]);

  /* ==== Auto scroll ==== */
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [msgs, open]);

  const pickImg = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const d = await shrink(f);
      if (d.length > 300000) setErr('Ảnh quá lớn (>300KB sau nén).');
      else { setImg(d); setErr(''); }
    } catch { setErr('Không đọc được ảnh.'); }
  };

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim().slice(0, 500);
    if ((!t && !img) || Date.now() - last.current < 1200) return;
    last.current = Date.now();
    try {
      const payload = {
        name: (name.trim() || 'Ẩn danh').slice(0, 20),
        text: t,
        img: img || null,
        uid,
        t: Date.now(),
      };
      if (replyTo) {
        payload.reply = {
          id: replyTo.id,
          name: replyTo.name,
          text: (replyTo.text || '').slice(0, 60),
          img: !!replyTo.img,
        };
      }
      const r = await fetch(URL_MSG, { method: 'POST', body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      setText(''); setImg(null); setErr(''); setReplyTo(null); setShowEmoji(false);
    } catch {
      setErr('Gửi thất bại. Kiểm tra mạng.');
    }
  };

  const removeMsg = async (id) => {
    if (!confirm('Xóa tin nhắn này?')) return;
    try {
      await fetch(`${DB}/chat/messages/${id}.json`, { method: 'DELETE' });
    } catch { setErr('Xóa thất bại.'); }
  };

  const toggleReaction = async (msg, key) => {
    const reactions = { ...(msg.reactions || {}) };
    const users = { ...(reactions[key] || {}) };
    if (users[uid]) delete users[uid];
    else users[uid] = 1;
    if (Object.keys(users).length === 0) delete reactions[key];
    else reactions[key] = users;
    // Cập nhật local ngay
    setMsgs((m) => m.map((x) => (x.id === msg.id ? { ...x, reactions } : x)));
    try {
      await fetch(`${DB}/chat/messages/${msg.id}/reactions.json`, {
        method: 'PUT',
        body: JSON.stringify(reactions),
      });
    } catch {
      setErr('Cập nhật reaction thất bại.');
    }
  };

  const filtered = useMemo(() => {
    let list = msgs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        (m.text || '').toLowerCase().includes(q) ||
        (m.name || '').toLowerCase().includes(q)
      );
    }
    return list.slice(-visibleCount);
  }, [msgs, search, visibleCount]);

  const onlineCount = Object.keys(onlineUsers).length;
  const onlineNames = Object.values(onlineUsers).slice(0, 3).join(', ');

  const insertEmoji = (emoji) => {
    setText((t) => t + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <button
        className="btn primary chatfab"
        onClick={() => setOpen(!open)}
        type="button"
        aria-label="Mở chat"
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <div className="card chatpane chatpane-v2">
          {/* HEADER */}
          <div className="chat-header">
            <div>
              <b>Chat cộng đồng</b>
              {DB && (
                <small className="chat-status">
                  {connected ? '🟢' : '🔴'} {onlineCount} online
                  {onlineCount > 0 && onlineNames && (
                    <span className="chat-online-names"> · {onlineNames}</span>
                  )}
                </small>
              )}
            </div>
            <div className="row" style={{ gap: '.2rem' }}>
              <button
                className={'btn sm icon' + (showSearch ? ' primary' : '')}
                onClick={() => { setShowSearch((s) => !s); setSearch(''); }}
                title="Tìm kiếm"
                type="button"
              >
                🔍
              </button>
              <button className="btn sm icon" onClick={() => setOpen(false)} type="button">×</button>
            </div>
          </div>

          {/* SEARCH */}
          {showSearch && (
            <div className="chat-search">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tin nhắn..."
                autoFocus
              />
              {search && <span className="chat-search-count">{filtered.length}</span>}
            </div>
          )}

          {!DB ? (
            <div className="msgs hint" style={{ padding: '1rem' }}>
              <b>Chưa cấu hình Firebase.</b>
              <span>Tạo file <code>.env</code> với:</span>
              <code style={{ display: 'block', padding: '.3rem', background: 'var(--soft)', marginTop: '.3rem' }}>
                VITE_FIREBASE_DB_URL=https://...
              </code>
            </div>
          ) : (
            <>
              <div className="msgs">
                {msgs.length > visibleCount && !search && (
                  <button
                    className="btn sm chat-load-more"
                    onClick={() => setVisibleCount((c) => c + 50)}
                    type="button"
                  >
                    Tải thêm tin cũ
                  </button>
                )}

                {filtered.length === 0 && (
                  <p className="hint center" style={{ padding: '1rem' }}>
                    {search ? 'Không tìm thấy.' : 'Chưa có tin nhắn. Nói xin chào 👋'}
                  </p>
                )}

                {filtered.map((m) => {
                  const isMe = m.uid === uid;
                  const reactions = m.reactions || {};
                  const reactEntries = REACTIONS.map((r) => ({
                    ...r,
                    count: Object.keys(reactions[r.key] || {}).length,
                    mine: !!reactions[r.key]?.[uid],
                  })).filter((r) => r.count > 0);

                  return (
                    <div key={m.id} className={'msg' + (isMe ? ' me' : '')}>
                      {m.reply && (
                        <div className="msg-reply-quote">
                          <b>{m.reply.name}</b>
                          <span>{m.reply.text || (m.reply.img ? '[ảnh]' : '')}</span>
                        </div>
                      )}

                      <small className="msg-meta">
                        {String(m.name || '').slice(0, 20)} · {formatTime(m.t)}
                      </small>

                      {typeof m.text === 'string' && m.text && (
                        <div className="msg-text">{m.text}</div>
                      )}

                      {typeof m.img === 'string' && m.img.startsWith('data:image/') && (
                        <img
                          src={m.img}
                          alt="Ảnh"
                          loading="lazy"
                          className="msg-img"
                          onClick={() => setLightbox(m.img)}
                        />
                      )}

                      {reactEntries.length > 0 && (
                        <div className="msg-reactions">
                          {reactEntries.map((r) => (
                            <button
                              key={r.key}
                              className={'msg-react' + (r.mine ? ' mine' : '')}
                              onClick={() => toggleReaction(m, r.key)}
                              type="button"
                            >
                              {r.icon} {r.count}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="msg-actions">
                        {REACTIONS.map((r) => (
                          <button
                            key={r.key}
                            className="msg-action"
                            onClick={() => toggleReaction(m, r.key)}
                            title={r.key}
                            type="button"
                          >
                            {r.icon}
                          </button>
                        ))}
                        <button
                          className="msg-action"
                          onClick={() => { setReplyTo(m); inputRef.current?.focus(); }}
                          title="Trả lời"
                          type="button"
                        >
                          ↩
                        </button>
                        {isMe && (
                          <button
                            className="msg-action danger"
                            onClick={() => removeMsg(m.id)}
                            title="Xóa"
                            type="button"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={end} />
              </div>

              {err && (
                <p className="hint" style={{ margin: '0 .8rem', color: 'var(--acc)' }}>{err}</p>
              )}

              {replyTo && (
                <div className="chat-reply-preview">
                  <div>
                    <b>Trả lời {replyTo.name}</b>
                    <span>{replyTo.text || (replyTo.img ? '[ảnh]' : '')}</span>
                  </div>
                  <button className="x" onClick={() => setReplyTo(null)} type="button">×</button>
                </div>
              )}

              {img && (
                <div className="chat-img-preview">
                  <img src={img} alt="Xem trước" />
                  <button className="btn sm" onClick={() => setImg(null)} type="button">Bỏ</button>
                </div>
              )}

              {showEmoji && (
                <div className="chat-emoji-picker">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      className="emoji-btn"
                      onClick={() => insertEmoji(e)}
                      type="button"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}

              <form className="chatform" onSubmit={send}>
                <input
                  className="chatname"
                  value={name}
                  maxLength={20}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên bạn"
                />
                <div className="chat-input-row">
                  <button
                    className={'btn sm icon' + (showEmoji ? ' primary' : '')}
                    onClick={() => setShowEmoji((s) => !s)}
                    type="button"
                    title="Emoji"
                  >
                    😊
                  </button>
                  <label className="btn sm icon" style={{ cursor: 'pointer', margin: 0 }} title="Ảnh">
                    📷
                    <input type="file" accept="image/*" hidden onChange={pickImg} />
                  </label>
                  <input
                    ref={inputRef}
                    value={text}
                    maxLength={500}
                    placeholder="Nhắn gì đó…"
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => setShowEmoji(false)}
                  />
                  <button className="btn primary" type="submit">Gửi</button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}