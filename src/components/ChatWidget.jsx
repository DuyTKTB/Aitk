import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import './chat-widget.css';
import VerifiedBadge from './VerifiedBadge.jsx';

/* ============ CẤU HÌNH ============ */
const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const URL_MSG = `${DB}/chat/messages.json`;
const URL_ONLINE = `${DB}/chat/online.json`;
const QUERY = 'orderBy=%22%24key%22';
const STREAM = `${URL_MSG}?${QUERY}&limitToLast=50`;
const PAGE = 30;
const MAX_TEXT = 500;
const MAX_IMG = 300000;
const rid = () => Math.random().toString(36).slice(2, 10);
const sortById = (a) => a.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));

/* ============ ICON SVG ============ */
const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true, focusable: 'false',
};
const mk = (body) => function Icon(props) {
  return <svg {...base} {...props}>{body}</svg>;
};
const dot = (x, y) => <circle cx={x} cy={y} r="1.1" fill="currentColor" stroke="none" />;
const eyes = <>{dot(8.8, 10)}{dot(15.2, 10)}</>;
const ring = <circle cx="12" cy="12" r="9.5" />;
const openMouth = <path d="M7.8 13.5h8.4c0 2.6-1.9 4.2-4.2 4.2s-4.2-1.6-4.2-4.2Z" />;

/* Icon giao diện */
const IcChat = mk(<><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-4.9A8.5 8.5 0 1 1 21 11.5Z" />{dot(8.5, 11.5)}{dot(12.5, 11.5)}{dot(16.5, 11.5)}</>);
const IcClose = mk(<path d="M6 6l12 12M18 6L6 18" />);
const IcSearch = mk(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>);
const IcImage = mk(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 9" /></>);
const IcSend = mk(<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7Z" />);
const IcReply = mk(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v3" /></>);
const IcTrash = mk(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
const IcUsers = mk(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5a3.2 3.2 0 0 1 0 6M18 14.4c1.8.8 3 2.6 3 5.6" /></>);
const IcUser = mk(<><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" /></>);
const IcCheck = mk(<path d="M5 12.5l4.5 4.5L19 7.5" />);
const IcDown = mk(<path d="M12 5v14M6 13l6 6 6-6" />);
const IcUp = mk(<path d="M6 15l6-6 6 6" />);
const IcHeart = mk(<path d="M12 20.5S3.5 15.4 3.5 9.2A4.7 4.7 0 0 1 12 6.8a4.7 4.7 0 0 1 8.5 2.4c0 6.2-8.5 11.3-8.5 11.3Z" />);
const thumb = 'M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z';
const IcLike = mk(<path d={thumb} />);
const IcDislike = mk(<g transform="rotate(180 12 12)"><path d={thumb} /></g>);

/* Sticker */
const S = {
  smile: ['Cười', mk(<>{ring}{eyes}<path d="M8 14.2c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4" /></>)],
  grin: ['Cười tươi', mk(<>{ring}{eyes}{openMouth}</>)],
  laugh: ['Cười lớn', mk(<>{ring}<path d="M7.5 10.6q1.3-1.8 2.6 0M13.9 10.6q1.3-1.8 2.6 0" />{openMouth}</>)],
  wink: ['Nháy mắt', mk(<>{ring}{dot(8.8, 10)}<path d="M13.9 10.4q1.3-1.6 2.6 0" /><path d="M8 14.2c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4" /></>)],
  cool: ['Ngầu', mk(<>{ring}<path d="M6 9h5v3H6zM13 9h5v3h-5zM11 10.4h2" /><path d="M8.5 15c1 1.4 2.1 2 3.5 2s2.5-.6 3.5-2" /></>)],
  think: ['Suy nghĩ', mk(<>{ring}{eyes}<path d="M9 15.8c1.2-.8 2.4.6 3.6 0s1.6-.4 2.4-.2" /></>)],
  neutral: ['Bình thường', mk(<>{ring}{eyes}<path d="M8.8 15.5h6.4" /></>)],
  sleepy: ['Buồn ngủ', mk(<>{ring}<path d="M7.5 10q1.3 1.6 2.6 0M13.9 10q1.3 1.6 2.6 0" /><path d="M10.6 15.6h2.8" /></>)],
  cry: ['Khóc', mk(<>{ring}{eyes}<path d="M8.2 16.6c1-1.4 2.4-2 3.8-2s2.8.6 3.8 2" /><path d="M8.8 12.4c-.7 1-1 1.6-1 2a1 1 0 0 0 2 0c0-.4-.3-1-1-2Z" /></>)],
  angry: ['Giận', mk(<>{ring}<path d="M7 8l3.2 1.4M17 8l-3.2 1.4" />{dot(9, 11.4)}{dot(15, 11.4)}<path d="M8.6 16.6c1-1.2 2.2-1.8 3.4-1.8s2.4.6 3.4 1.8" /></>)],
  wow: ['Wow', mk(<>{ring}{eyes}<circle cx="12" cy="15.8" r="1.8" /></>)],
  heart: ['Tim', IcHeart],
  like: ['Thích', IcLike],
  dislike: ['Không thích', IcDislike],
  fire: ['Lửa', mk(<path d="M12 3c.5 3-2 4.5-3.5 6.5A6 6 0 0 0 7 13.5a5 5 0 0 0 10 0c0-2-1-3.5-2-4.5-.3 1.2-.9 2-1.8 2.4C13.6 8.6 13 5.5 12 3Z" />)],
  star: ['Sao', mk(<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8Z" />)],
  flask: ['Hóa học', mk(<><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3" /><path d="M7.5 15h9" /></>)],
  book: ['Sách', mk(<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />)],
};
const STICKERS = Object.fromEntries(Object.entries(S).map(([k, [label, Icon]]) => [k, { label, Icon }]));

const REACTIONS = [
  { key: 'heart', label: 'Yêu thích', Icon: IcHeart },
  { key: 'like', label: 'Thích', Icon: IcLike },
  { key: 'haha', label: 'Haha', Icon: STICKERS.laugh.Icon },
  { key: 'wow', label: 'Wow', Icon: STICKERS.wow.Icon },
];

/* ============ TIỆN ÍCH ============ */
const TOKEN = /(:[a-z]+:|https?:\/\/[^\s<>"']+)/g;

function Rich({ text }) {
  return text.split(TOKEN).map((p, i) => {
    if (!p) return null;
    if (/^:[a-z]+:$/.test(p) && STICKERS[p.slice(1, -1)]) {
      const { Icon, label } = STICKERS[p.slice(1, -1)];
      return <span key={i} className="cw-st" title={label}><Icon width="100%" height="100%" /></span>;
    }
    if (/^https?:\/\//.test(p)) {
      return <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow">{p}</a>;
    }
    return p;
  });
}

const onlyStickers = (t) => {
  const s = t.trim();
  if (!/^(:[a-z]+:\s*){1,3}$/.test(s)) return false;
  return s.match(/:[a-z]+:/g).every((k) => STICKERS[k.slice(1, -1)]);
};

const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const dayKey = (t) => new Date(t).toDateString();
const dayLabel = (t) => {
  const d = new Date(t);
  const n = new Date();
  const y = new Date();
  y.setDate(n.getDate() - 1);
  if (d.toDateString() === n.toDateString()) return 'Hôm nay';
  if (d.toDateString() === y.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN');
};

async function shrink(file) {
  const b = await createImageBitmap(file);
  const k = Math.min(1, 800 / Math.max(b.width, b.height));
  const c = document.createElement('canvas');
  c.width = Math.round(b.width * k);
  c.height = Math.round(b.height * k);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(b, 0, 0, c.width, c.height);
  b.close?.();
  for (const q of [0.85, 0.72, 0.6, 0.48]) {
    const d = c.toDataURL('image/jpeg', q);
    if (d.length <= MAX_IMG) return d;
  }
  return null;
}

/* ============================================================
   AuthorName — Tên tác giả kèm tick xanh nếu VIP
   ============================================================ */
function AuthorName({ name, uid, className = '' }) {
  return (
    <span className={'cw-author ' + className}>
      {String(name || '').slice(0, 20)}
      <VerifiedBadge uid={uid} size={12} />
    </span>
  );
}

/* ============ LIGHTBOX ============ */
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cw-lightbox" onClick={onClose} role="dialog" aria-label="Ảnh phóng to">
      <button onClick={onClose} type="button" aria-label="Đóng ảnh"><IcClose /></button>
      <img src={src} alt="Ảnh phóng to" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

/* ============ MỘT TIN NHẮN ============ */
function Message({ m, prev, uid, active, armed, onToggle, onReact, onReply, onDel, onImg, onJump, onImgLoad }) {
  const isMe = m.uid === uid;
  const t = Number(m.t) || 0;
  const pt = prev ? Number(prev.t) || 0 : 0;
  const newDay = !prev || dayKey(pt) !== dayKey(t);
  const head = newDay || prev.uid !== m.uid || t - pt > 300000;
  const reactions = m.reactions || {};
  const chips = REACTIONS.map((r) => ({
    ...r,
    count: Object.keys(reactions[r.key] || {}).length,
    mine: !!reactions[r.key]?.[uid],
  })).filter((r) => r.count > 0);
  const text = typeof m.text === 'string' ? m.text : '';
  const hasImg = typeof m.img === 'string' && m.img.startsWith('data:image/');

  return (
    <>
      {newDay && <div className="cw-day">{dayLabel(t)}</div>}
      <div id={'cw-m-' + m.id} className={'cw-msg' + (isMe ? ' me' : '') + (head ? ' head' : '') + (active ? ' active' : '')}>
        {head && (
          <small className="cw-meta">
            {isMe ? (
              <span className="cw-author">Bạn</span>
            ) : (
              <AuthorName name={m.name} uid={m.uid} />
            )}
            {' · '}{fmtTime(t)}
          </small>
        )}

        {m.reply && (
          <button type="button" className="cw-quote" onClick={() => onJump(m.reply.id)}>
            <b>
              {String(m.reply.name || '').slice(0, 20)}
              {m.reply.uid && <VerifiedBadge uid={m.reply.uid} size={11} />}
            </b>
            <span>{String(m.reply.text || '') || (m.reply.img ? 'Ảnh' : '')}</span>
          </button>
        )}

        {text && (
          <div className={'cw-bubble' + (onlyStickers(text) ? ' big' : '')} onClick={onToggle}>
            <Rich text={text} />
          </div>
        )}

        {hasImg && (
          <img className="cw-img" src={m.img} alt="Ảnh đã gửi" loading="lazy" onLoad={onImgLoad} onClick={() => onImg(m.img)} />
        )}

        {chips.length > 0 && (
          <div className="cw-chips">
            {chips.map((r) => (
              <button
                key={r.key}
                type="button"
                className={'cw-chip' + (r.mine ? ' mine' : '')}
                onClick={() => onReact(m, r.key)}
                aria-pressed={r.mine}
                aria-label={`${r.label}: ${r.count}`}
              >
                <r.Icon /> {r.count}
              </button>
            ))}
          </div>
        )}

        <div className="cw-tools" role="toolbar" aria-label="Thao tác tin nhắn">
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              className={'cw-tool' + (reactions[r.key]?.[uid] ? ' mine' : '')}
              onClick={() => onReact(m, r.key)}
              title={r.label}
              aria-label={r.label}
            >
              <r.Icon />
            </button>
          ))}
          <button type="button" className="cw-tool" onClick={() => onReply(m)} title="Trả lời" aria-label="Trả lời">
            <IcReply />
          </button>
          {isMe && (
            <button
              type="button"
              className={'cw-tool danger' + (armed ? ' armed' : '')}
              onClick={() => onDel(m.id)}
              title={armed ? 'Bấm lần nữa để xóa' : 'Xóa'}
              aria-label={armed ? 'Xác nhận xóa' : 'Xóa'}
            >
              {armed ? 'Xóa?' : <IcTrash />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ============ WIDGET ============ */
export default function ChatWidget() {
  const { user } = useAuth();

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
  const [showPicker, setShowPicker] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [delArm, setDelArm] = useState(null);
  const [loadingOld, setLoadingOld] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [newBelow, setNewBelow] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);

  const [name, setName] = useLocalStorage(
    'cs-chatname',
    user?.displayName || 'Bạn ' + Math.floor(1000 + Math.random() * 9000)
  );
  const uid = user?.uid || 'anonymous';

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const stick = useRef(true);
  const lastSend = useRef(0);
  const prevLast = useRef(null);
  const keep = useRef(null);
  const armTimer = useRef(0);
  const nameRef = useRef(name);
  nameRef.current = name;

  useEffect(() => {
    if (!err) return undefined;
    const t = setTimeout(() => setErr(''), 4000);
    return () => clearTimeout(t);
  }, [err]);

  useEffect(() => {
    if (!DB || !open) return undefined;

    const es = new EventSource(STREAM);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.addEventListener('cancel', () => setConnected(false));
    es.addEventListener('put', (e) => {
      let p;
      try { p = JSON.parse(e.data); } catch { return; }
      const { path, data } = p;

      setMsgs((m) => {
        if (path === '/') {
          const fresh = data ? sortById(Object.entries(data).map(([id, v]) => ({ id, ...v }))) : [];
          const first = fresh[0]?.id;
          return first ? [...m.filter((x) => x.id < first), ...fresh] : [];
        }
        const [id, sub] = path.slice(1).split('/');
        if (sub === undefined) {
          if (data === null) return m.filter((x) => x.id !== id);
          return m.some((x) => x.id === id)
            ? m.map((x) => (x.id === id ? { id, ...data } : x))
            : sortById([...m, { id, ...data }]);
        }
        if (sub === 'reactions') {
          return m.map((x) => (x.id === id ? { ...x, reactions: data || {} } : x));
        }
        return m;
      });
    });
    return () => es.close();
  }, [open]);

  useEffect(() => {
    if (!DB || !open) return undefined;

    const ping = () =>
      fetch(`${URL_ONLINE.replace('.json', '')}/${uid}.json`, {
        method: 'PUT',
        body: JSON.stringify({ n: (nameRef.current || '').trim() || 'Ẩn danh', t: Date.now() }),
      }).catch(() => {});

    const bye = () =>
      fetch(`${URL_ONLINE.replace('.json', '')}/${uid}.json`, { method: 'DELETE', keepalive: true }).catch(() => {});

    const fetchOnline = async () => {
      try {
        const data = await (await fetch(URL_ONLINE)).json();
        const now = Date.now();
        const out = {};
        if (data) for (const [u, v] of Object.entries(data)) if (v && v.t && now - v.t < 45000) out[u] = v.n;
        setOnlineUsers(out);
      } catch { /* bỏ qua */ }
    };

    ping();
    fetchOnline();
    const a = setInterval(ping, 15000);
    const b = setInterval(fetchOnline, 10000);
    window.addEventListener('pagehide', bye);
    return () => {
      clearInterval(a);
      clearInterval(b);
      window.removeEventListener('pagehide', bye);
      bye();
    };
  }, [open, uid]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return msgs;
    return msgs.filter((m) => (m.text || '').toLowerCase().includes(q) || (m.name || '').toLowerCase().includes(q));
  }, [msgs, search]);
  const lastMsg = filtered[filtered.length - 1];
  const lastId = lastMsg?.id;

  const toBottom = (smooth) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  useLayoutEffect(() => {
    if (open) { stick.current = true; prevLast.current = null; toBottom(false); }
  }, [open]);

  useEffect(() => {
    if (!lastId) return;
    if (stick.current || lastMsg?.uid === uid) {
      toBottom(prevLast.current !== null);
      setNewBelow(0);
    } else if (prevLast.current !== null && prevLast.current !== lastId) {
      setNewBelow((n) => n + 1);
    }
    prevLast.current = lastId;
  }, [lastId]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && keep.current !== null) {
      el.scrollTop = el.scrollHeight - keep.current;
      keep.current = null;
    }
  }, [msgs]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = near;
    if (near) setNewBelow(0);
  };

  const loadOlder = async () => {
    const first = msgs[0];
    if (!first || loadingOld) return;
    setLoadingOld(true);
    try {
      const r = await fetch(`${URL_MSG}?${QUERY}&endAt=%22${first.id}%22&limitToLast=${PAGE + 1}`);
      const data = await r.json();
      const arr = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })).filter((x) => x.id !== first.id) : [];
      if (arr.length < PAGE) setNoMore(true);
      const el = listRef.current;
      if (el) keep.current = el.scrollHeight - el.scrollTop;
      setMsgs((m) => sortById([...arr.filter((x) => !m.some((y) => y.id === x.id)), ...m]));
    } catch {
      setErr('Không tải được tin cũ.');
    } finally {
      setLoadingOld(false);
    }
  };

  const pickFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErr('Chỉ gửi được file ảnh.'); return; }
    try {
      const d = await shrink(f);
      if (!d) setErr('Ảnh quá lớn, hãy chọn ảnh nhỏ hơn.');
      else { setImg(d); setErr(''); }
    } catch {
      setErr('Không đọc được ảnh.');
    }
  };
  const onPickInput = (e) => { const f = e.target.files[0]; e.target.value = ''; pickFile(f); };
  const onPaste = (e) => {
    const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
    if (f) { e.preventDefault(); pickFile(f); }
  };
  const onDrop = (e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); };

  const send = async (e) => {
    e?.preventDefault();
    const t = text.trim().slice(0, MAX_TEXT);
    if ((!t && !img) || sending) return;
    if (Date.now() - lastSend.current < 1200) { setErr('Gửi chậm lại một chút nhé.'); return; }
    lastSend.current = Date.now();
    setSending(true);
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
          uid: replyTo.uid,
          text: (replyTo.text || '').slice(0, 60),
          img: !!replyTo.img,
        };
      }
      const r = await fetch(URL_MSG, { method: 'POST', body: JSON.stringify(payload) });
      if (!r.ok) throw new Error();
      stick.current = true;
      setText(''); setImg(null); setErr(''); setReplyTo(null); setShowPicker(false);
    } catch {
      setErr('Gửi thất bại. Kiểm tra mạng.');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      send();
    }
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 110) + 'px';
  }, [text, open]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const removeMsg = async (id) => {
    try {
      const r = await fetch(`${DB}/chat/messages/${id}.json`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
    } catch {
      setErr('Xóa thất bại.');
    }
  };
  const onDel = (id) => {
    clearTimeout(armTimer.current);
    if (delArm !== id) {
      setDelArm(id);
      armTimer.current = setTimeout(() => setDelArm(null), 3000);
      return;
    }
    setDelArm(null);
    removeMsg(id);
  };

  const toggleReaction = async (msg, key) => {
    const before = msg.reactions || {};
    const reactions = { ...before };
    const users = { ...(reactions[key] || {}) };
    if (users[uid]) delete users[uid]; else users[uid] = 1;
    if (Object.keys(users).length === 0) delete reactions[key]; else reactions[key] = users;

    setMsgs((m) => m.map((x) => (x.id === msg.id ? { ...x, reactions } : x)));
    try {
      const r = await fetch(`${DB}/chat/messages/${msg.id}/reactions.json`, { method: 'PUT', body: JSON.stringify(reactions) });
      if (!r.ok) throw new Error();
    } catch {
      setMsgs((m) => m.map((x) => (x.id === msg.id ? { ...x, reactions: before } : x)));
      setErr('Cập nhật cảm xúc thất bại.');
    }
  };

  const startReply = (m) => { setReplyTo(m); setActiveId(null); inputRef.current?.focus(); };

  const jumpTo = (id) => {
    const el = document.getElementById('cw-m-' + id);
    if (!el) { setErr('Tin nhắn gốc chưa được tải.'); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1400);
  };

  const addSticker = (k) => {
    setText((t) => (t + (t && !/\s$/.test(t) ? ' ' : '') + `:${k}: `).slice(0, MAX_TEXT));
    inputRef.current?.focus();
  };

  const onPaneKey = (e) => {
    if (e.key !== 'Escape' || lightbox) return;
    e.stopPropagation();
    if (showPicker) setShowPicker(false);
    else if (showSearch) { setShowSearch(false); setSearch(''); }
    else if (replyTo) setReplyTo(null);
    else { setOpen(false); fabRef.current?.focus(); }
  };

  const onlineCount = Object.keys(onlineUsers).length;
  const onlineNames = Object.values(onlineUsers).join(', ');

  return (
    <>
      <button
        ref={fabRef}
        className={'cw-fab' + (open ? ' is-open' : '')}
        onClick={() => setOpen((o) => !o)}
        type="button"
        aria-label={open ? 'Đóng chat' : 'Mở chat cộng đồng'}
        aria-expanded={open}
      >
        <IcChat className="cw-i-chat" width="26" height="26" />
        <IcClose className="cw-i-close" width="24" height="24" strokeWidth="2.4" />
      </button>

      {open && (
        <div
          className="cw-pane"
          role="dialog"
          aria-label="Chat cộng đồng"
          onKeyDown={onPaneKey}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
          onDrop={onDrop}
        >
          <div className="cw-head">
            <div className="cw-head-main">
              <b className="cw-title">Chat cộng đồng</b>
              {DB && (
                <small className="cw-status" title={onlineNames || undefined}>
                  <span className={'cw-dot' + (connected ? ' on' : '')} aria-hidden="true" />
                  {connected ? `${onlineCount} online` : 'Đang kết nối…'}
                  {connected && onlineNames && <span> · {onlineNames}</span>}
                </small>
              )}
            </div>
            <button
              className={'cw-ib' + (showSearch ? ' on' : '')}
              onClick={() => { setShowSearch((s) => !s); setSearch(''); }}
              title="Tìm tin nhắn"
              aria-label="Tìm tin nhắn"
              aria-pressed={showSearch}
              type="button"
            >
              <IcSearch />
            </button>
            <button className="cw-ib" onClick={() => setOpen(false)} title="Đóng" aria-label="Đóng chat" type="button">
              <IcClose />
            </button>
          </div>

          {showSearch && (
            <div className="cw-search">
              <IcSearch width="16" height="16" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tin nhắn…" aria-label="Tìm tin nhắn" autoFocus />
              {search && <small>{filtered.length} kết quả</small>}
            </div>
          )}

          {!DB ? (
            <div className="cw-setup">
              <b>Chưa cấu hình Firebase.</b>
              <div>Tạo file <code>.env</code> với dòng:</div>
              <code>VITE_FIREBASE_DB_URL=https://...</code>
            </div>
          ) : (
            <>
              <div className="cw-body">
                <div className="cw-list" ref={listRef} onScroll={onScroll} role="log" aria-live="polite" aria-label="Tin nhắn">
                  {msgs.length >= 50 && !search && !noMore && (
                    <button className="cw-more" type="button" onClick={loadOlder} disabled={loadingOld}>
                      <IcUp width="14" height="14" /> {loadingOld ? 'Đang tải…' : 'Tải tin cũ hơn'}
                    </button>
                  )}

                  {filtered.length === 0 && (
                    <div className="cw-empty">
                      <STICKERS.smile.Icon width="32" height="32" />
                      {search ? 'Không tìm thấy tin nhắn nào.' : 'Chưa có tin nhắn. Hãy là người mở lời đầu tiên.'}
                    </div>
                  )}

                  {filtered.map((m, i) => (
                    <Message
                      key={m.id}
                      m={m}
                      prev={filtered[i - 1]}
                      uid={uid}
                      active={activeId === m.id}
                      armed={delArm === m.id}
                      onToggle={() => setActiveId((a) => (a === m.id ? null : m.id))}
                      onReact={toggleReaction}
                      onReply={startReply}
                      onDel={onDel}
                      onImg={setLightbox}
                      onJump={jumpTo}
                      onImgLoad={() => stick.current && toBottom(false)}
                    />
                  ))}
                </div>

                {newBelow > 0 && (
                  <button className="cw-jump" type="button" onClick={() => { toBottom(true); setNewBelow(0); }}>
                    <IcDown width="14" height="14" /> {newBelow} tin mới
                  </button>
                )}

                {dragging && <div className="cw-drop"><span><IcImage /> Thả ảnh để gửi</span></div>}
              </div>

              {err && <p className="cw-err" role="alert">{err}</p>}

              {replyTo && (
                <div className="cw-attach">
                  <IcReply width="16" height="16" />
                  <div>
                    <b>Trả lời {String(replyTo.name || '').slice(0, 20)}</b>
                    <span>{replyTo.text || (replyTo.img ? 'Ảnh' : '')}</span>
                  </div>
                  <button className="cw-ib ghost" onClick={() => setReplyTo(null)} type="button" aria-label="Hủy trả lời">
                    <IcClose width="16" height="16" />
                  </button>
                </div>
              )}

              {img && (
                <div className="cw-attach">
                  <img src={img} alt="Ảnh sắp gửi" />
                  <div><b>Ảnh đính kèm</b><span>Sẽ gửi cùng tin nhắn</span></div>
                  <button className="cw-ib ghost" onClick={() => setImg(null)} type="button" aria-label="Bỏ ảnh">
                    <IcClose width="16" height="16" />
                  </button>
                </div>
              )}

              {showPicker && (
                <div className="cw-picker" role="group" aria-label="Chọn sticker">
                  {Object.entries(STICKERS).map(([k, { Icon, label }]) => (
                    <button key={k} className="cw-st-btn" type="button" onClick={() => addSticker(k)} title={label} aria-label={label}>
                      <Icon width="100%" height="100%" />
                    </button>
                  ))}
                </div>
              )}

              <form className="cw-form" onSubmit={send}>
                <label className="cw-name">
                  <IcUser />
                  <input
                    value={name}
                    maxLength={20}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên hiển thị"
                    aria-label="Tên hiển thị"
                  />
                  {text.length > 400 && (
                    <span className={'cw-count' + (text.length >= MAX_TEXT ? ' warn' : '')}>{text.length}/{MAX_TEXT}</span>
                  )}
                </label>

                <div className="cw-row">
                  <button
                    className={'cw-ib' + (showPicker ? ' on' : '')}
                    onClick={() => setShowPicker((s) => !s)}
                    type="button"
                    title="Sticker"
                    aria-label="Chọn sticker"
                    aria-pressed={showPicker}
                  >
                    <STICKERS.smile.Icon />
                  </button>
                  <label className="cw-ib" style={{ cursor: 'pointer' }} title="Gửi ảnh">
                    <IcImage />
                    <input type="file" accept="image/*" hidden onChange={onPickInput} />
                  </label>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={text}
                    maxLength={MAX_TEXT}
                    placeholder="Nhắn gì đó…"
                    aria-label="Nội dung tin nhắn"
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    onFocus={() => setShowPicker(false)}
                  />
                  <button className="cw-send" type="submit" disabled={sending || (!text.trim() && !img)} aria-label="Gửi">
                    <IcSend />
                  </button>
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