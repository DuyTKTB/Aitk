import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useLocalStorage, useLiveStreak } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../ui/index.jsx';
import { isValidStreakMessage } from '../lib/chatStreak.js';
import { syncMyPublicStats, getProfile } from '../lib/social.js';
import { getTopStreakClasses } from '../lib/classroom.js';
import VerifiedBadge from './VerifiedBadge.jsx';
import ProfileCard from './social/ProfileCard.jsx';
import ClassChat from './social/ClassChat.jsx';
import DmPanel from './social/DmPanel.jsx';
import UserAvatar from './UserAvatar.jsx';
import StudentAvatar from './StudentAvatar.jsx';
import './chat-widget.css';
import './pet-widget.css';

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
const IcSvgSchool = mk(<><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>);
const IcSvgFlame = ({ size = 14, color = '#f97316' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2c1.2 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-7 0 2 1 3 2 3 0-2 0-4 0-6z" />
  </svg>
);
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

const BG_PALETTE = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
];

function getAvatarBg(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % BG_PALETTE.length;
  return BG_PALETTE[idx];
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'E';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

/* ============ MỘT TIN NHẮN (CHUẨN GIAO DIỆN HỘI THOẠI CỘT 3) ============ */
function Message({ m, prev, uid, user, userProfileMap = {}, active, armed, onToggle, onReact, onReply, onDel, onImg, onJump, onImgLoad, onOpenProfile }) {
  const isMe = m.uid === uid || (m.name && user?.displayName && m.name === user.displayName);
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
      {newDay && (
        <div className="ns9-chat-day-divider">
          <span>{dayLabel(t)}</span>
        </div>
      )}
      <div
        id={'cw-m-' + m.id}
        className={`ns9-msg-line ${isMe ? 'is-user-line' : 'is-ai-line'} ${active ? 'is-active' : ''}`}
      >
        {!isMe && (
          <div
            className="ns9-c-avatar-circle"
            style={{
              background: 'transparent',
              padding: 0,
              overflow: 'hidden',
              boxShadow: 'none',
              border: 'none',
            }}
            onClick={() => onOpenProfile?.(m.uid, m.name)}
            title={m.name || 'Học sinh'}
          >
            <StudentAvatar
              name={m.name}
              uid={m.uid}
              photoURL={m.photoURL || userProfileMap?.[m.uid] || null}
              size={32}
              title={m.name}
            />
          </div>
        )}

        <div className="ns9-msg-bubble" onClick={onToggle}>
          {!isMe && head && (
            <div className="ns9-msg-sender-row">
              <button
                type="button"
                className="cw-author-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile?.(m.uid, m.name);
                }}
                title="Bấm để xem hồ sơ"
              >
                <AuthorName name={m.name} uid={m.uid} />
              </button>
              {Number(m.streak) >= 3 && (
                <span className="cw-streak-badge" title={`Chuỗi ${m.streak} ngày học liên tiếp`}>
                  <IcSvgFlame size={12} /> {m.streak}
                </span>
              )}
              <span className="ns9-msg-time">{fmtTime(t)}</span>
            </div>
          )}

          {m.reply && (
            <button
              type="button"
              className="cw-quote"
              onClick={(e) => {
                e.stopPropagation();
                onJump(m.reply.id);
              }}
            >
              <b>
                {String(m.reply.name || '').slice(0, 20)}
                {m.reply.uid && <VerifiedBadge uid={m.reply.uid} size={11} />}
              </b>
              <span>{String(m.reply.text || '') || (m.reply.img ? 'Ảnh' : '')}</span>
            </button>
          )}

          {text && (
            <div className={`ns9-msg-text ${onlyStickers(text) ? 'is-only-stickers' : ''}`}>
              <Rich text={text} />
            </div>
          )}

          {hasImg && (
            <img
              className="ns9-chat-attached-img"
              src={m.img}
              alt="Ảnh đã gửi"
              loading="lazy"
              onLoad={onImgLoad}
              onClick={(e) => {
                e.stopPropagation();
                onImg(m.img);
              }}
            />
          )}

          {chips.length > 0 && (
            <div className="cw-chips">
              {chips.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={'cw-chip' + (r.mine ? ' mine' : '')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact(m, r.key);
                  }}
                  aria-pressed={r.mine}
                  aria-label={`${r.label}: ${r.count}`}
                >
                  <r.Icon /> {r.count}
                </button>
              ))}
            </div>
          )}

          <div className="cw-tools" role="toolbar" aria-label="Thao tác tin nhắn" onClick={(e) => e.stopPropagation()}>
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

          {isMe && <span className="ns9-msg-time-me">{fmtTime(t)}</span>}
        </div>

        {isMe && (
          <UserAvatar user={user} size={32} title="Bạn" />
        )}
      </div>
    </>
  );
}

/* ============ WIDGET ============ */
export default function ChatWidget() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
  const [activeTab, setActiveTab] = useState('community'); // 'community' | 'class' | 'friends'
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [activeDmThread, setActiveDmThread] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);
  const [topClasses, setTopClasses] = useState([]);

  const { count: streakCount, isToday } = useLiveStreak();
  const toast = useToast();
  const lastSentText = useRef('');

  useEffect(() => {
    const handleOpenChat = () => setOpen((prev) => !prev);
    window.addEventListener('elec-open-community-chat', handleOpenChat);
    return () => window.removeEventListener('elec-open-community-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    getTopStreakClasses(3).then((list) => {
      if (alive && list?.length) setTopClasses(list);
    }).catch(() => {});
    return () => { alive = false; };
  }, [open]);

  const [name, setName] = useLocalStorage(
    'cs-chatname',
    user?.displayName || 'Bạn ' + Math.floor(1000 + Math.random() * 9000)
  );
  const uid = user?.uid || 'anonymous';
  const [userProfileMap, setUserProfileMap] = useState({});

  useEffect(() => {
    if (!msgs || !msgs.length) return;
    const missingUids = msgs
      .map((m) => m.uid)
      .filter((id) => id && id !== uid && !userProfileMap[id]);
    const uniqueUids = [...new Set(missingUids)];
    if (!uniqueUids.length) return;

    uniqueUids.forEach((authorUid) => {
      getProfile(authorUid)
        .then((prof) => {
          if (prof?.photoURL) {
            setUserProfileMap((prev) => ({ ...prev, [authorUid]: prof.photoURL }));
          }
        })
        .catch(() => {});
    });
  }, [msgs, uid, userProfileMap]);

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
      // Đánh giá tin nhắn hợp lệ để giữ chuỗi cá nhân hôm nay
      const isStreakMsg = isValidStreakMessage(t, lastSentText.current);
      if (isStreakMsg) {
        lastSentText.current = t;
        if (!isToday) {
          const next = recordDailyStreak();
          toast('Đã duy trì chuỗi học tập hôm nay');
          if (user?.uid) {
            syncMyPublicStats(user.uid, {
              displayName: name,
              streak: next.n,
            });
          }
        }
      }

      const payload = {
        name: (name.trim() || 'Ẩn danh').slice(0, 20),
        text: t,
        img: img || null,
        uid,
        photoURL: user?.photoURL || null,
        t: Date.now(),
        streak: streakCount || 0,
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
          className="ns9-comm-overlay-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className={`ns9-pcol ns9-pcol-chat ns9-comm-card ${isExpanded ? 'is-expanded' : ''}`}
            role="dialog"
            aria-label="Chat cộng đồng"
            onKeyDown={onPaneKey}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
            }}
            onDrop={onDrop}
          >
            {/* 1. Header Bar matching Image 3 Column 3 */}
            <div className="ns9-chat-header-bar">
              <button
                type="button"
                className="ns9-chat-action-icon"
                onClick={() => {
                  setText('');
                  setReplyTo(null);
                  setImg(null);
                  inputRef.current?.focus();
                }}
                title="Tạo tin mới / Làm mới đoạn chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              <div className="ns9-chat-title-dropdown">
                <button
                  type="button"
                  className="ns9-chat-title-btn"
                  onClick={() => setShowChannelDropdown((p) => !p)}
                >
                  <span>
                    {activeTab === 'community'
                      ? 'Chat cộng đồng'
                      : activeTab === 'class'
                      ? 'Lớp học của tôi'
                      : 'Bạn bè & Tin riêng'}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showChannelDropdown && (
                  <div className="ns9-comm-channel-popover">
                    <div className="ns9-popover-title">Chọn phòng trò chuyện:</div>
                    <button
                      type="button"
                      className={`ns9-comm-channel-item ${activeTab === 'community' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setActiveTab('community');
                        setShowChannelDropdown(false);
                      }}
                    >
                      <span className="ns9-chan-icon"><IcChat width="18" height="18" /></span>
                      <div className="ns9-chan-info">
                        <span className="ns9-chan-name">Kênh chung cộng đồng</span>
                        <span className="ns9-chan-desc">1.428 bạn đang online thảo luận</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`ns9-comm-channel-item ${activeTab === 'class' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setActiveTab('class');
                        setShowChannelDropdown(false);
                      }}
                    >
                      <span className="ns9-chan-icon"><IcSvgSchool width="18" height="18" /></span>
                      <div className="ns9-chan-info">
                        <span className="ns9-chan-name">Lớp học của tôi</span>
                        <span className="ns9-chan-desc">Trao đổi cùng bạn bè trong lớp</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`ns9-comm-channel-item ${activeTab === 'friends' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setActiveTab('friends');
                        setShowChannelDropdown(false);
                      }}
                    >
                      <span className="ns9-chan-icon"><IcUsers width="18" height="18" /></span>
                      <div className="ns9-chan-info">
                        <span className="ns9-chan-name">Bạn bè & Tin riêng</span>
                        <span className="ns9-chan-desc">Nhắn tin trực tiếp 1:1</span>
                      </div>
                    </button>

                    <div style={{ height: 1, background: 'rgba(226, 232, 240, 0.8)', margin: '6px 0' }} />

                    <button
                      type="button"
                      className="ns9-comm-channel-item"
                      onClick={() => {
                        setShowChannelDropdown(false);
                        setShowSearch((s) => !s);
                      }}
                    >
                      <span className="ns9-chan-icon"><IcSearch width="18" height="18" /></span>
                      <div className="ns9-chan-info">
                        <span className="ns9-chan-name">Tìm kiếm tin nhắn</span>
                        <span className="ns9-chan-desc">Tra cứu nội dung cũ trong nhóm</span>
                      </div>
                    </button>

                    <div className="ns9-pop-name-edit">
                      <span style={{ fontSize: 11, color: '#64748b' }}>Tên bạn:</span>
                      <input
                        value={name}
                        maxLength={20}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tên hiển thị..."
                        className="ns9-pop-name-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="ns9-chat-header-right">
                <button
                  type="button"
                  className="ns9-chat-action-icon"
                  onClick={() => setIsExpanded((e) => !e)}
                  title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                >
                  {isExpanded ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className="ns9-chat-action-icon ns9-close-x"
                  onClick={() => setOpen(false)}
                  title="Đóng chat cộng đồng"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Horizontal Sub-tabs matching Image 3: [Cộng đồng] [Lớp] [Bạn bè] [Trợ lý AI] */}
            <div className="ns9-chat-subtabs-bar">
              <button
                type="button"
                className={`ns9-subtab-btn ${activeTab === 'community' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('community')}
              >
                Cộng đồng
              </button>
              <button
                type="button"
                className={`ns9-subtab-btn ${activeTab === 'class' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('class')}
              >
                Lớp
              </button>
              <button
                type="button"
                className={`ns9-subtab-btn ${activeTab === 'friends' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                Bạn bè
              </button>
              <button
                type="button"
                className="ns9-subtab-btn is-ai-pill"
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent('elec-open-companion-modal'));
                }}
                title="Mở Trợ lý ELEC AI"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="ns9-ai-sparkle">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                <span>Trợ lý AI</span>
              </button>
            </div>

            {/* Search row if opened */}
            {showSearch && (
              <div className="cw-search">
                <IcSearch width="16" height="16" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tin nhắn…"
                  autoFocus
                />
                {search && <small>{filtered.length} kết quả</small>}
              </div>
            )}

            {activeTab === 'class' && (
              <ClassChat onOpenProfile={(tUid, tName) => setProfileTarget({ uid: tUid, name: tName })} />
            )}

            {activeTab === 'friends' && (
              <DmPanel
                me={user || { uid: 'anonymous', displayName: name }}
                thread={activeDmThread}
                setThread={setActiveDmThread}
                onOpenProfile={(tUid, tName) => setProfileTarget({ uid: tUid, name: tName })}
                unreadMap={{}}
              />
            )}

            {activeTab === 'community' && (
              <>
                {/* 2. Scroll Area matching Image 3 Column 3 */}
                <div className="ns9-chat-scroll-area" ref={listRef} onScroll={onScroll}>
                  {/* Mascot greeting row */}
                  <div className="ns9-chat-ai-row">
                    <img src="/img/elec/elec-hello.png" alt="ELEC AI" className="ns9-c-avatar" />
                    <div className="ns9-c-bubble-group">
                      <div className="ns9-c-persona-badge">
                        <span className="ns9-c-name">ELEC AI</span>
                        <span className="ns9-c-mood-tag">Cộng đồng học sinh 2026</span>
                      </div>
                      <div className="ns9-c-speech-card">
                        <div className="ns9-c-speech-txt">
                          Chào buổi tối, {name || 'Duyyy'} nè! Chào mừng bạn đến với kênh Chat Cộng Đồng ELEC AI. Cùng nhau trao đổi bài tập khó và chia sẻ kinh nghiệm ôn thi nhé.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5 Quick Action suggestion pills matching Image 3 */}
                  <div className="ns9-quick-pills-container">
                    <button
                      type="button"
                      className="ns9-pill-item-btn"
                      onClick={() => {
                        setText('Thảo luận phương pháp giải nhanh bài tập Hóa / Lý 2026');
                        inputRef.current?.focus();
                      }}
                    >
                      <span className="ns9-pill-dot" style={{ background: '#3b82f6' }} />
                      <span className="ns9-pill-txt">Gợi ý một việc vừa sức để bắt đầu</span>
                    </button>
                    <button
                      type="button"
                      className="ns9-pill-item-btn"
                      onClick={() => {
                        setText('Có bạn nào đang vướng bài tập phần Este - Lipit này không?');
                        inputRef.current?.focus();
                      }}
                    >
                      <span className="ns9-pill-dot" style={{ background: '#10b981' }} />
                      <span className="ns9-pill-txt">Giải chậm một bài mình đang vướng</span>
                    </button>
                    <button
                      type="button"
                      className="ns9-pill-item-btn"
                      onClick={() => {
                        setText('Tìm bạn cùng tiến target 27+ Bách Khoa / Y Hà Nội');
                        inputRef.current?.focus();
                      }}
                    >
                      <span className="ns9-pill-dot" style={{ background: '#f59e0b' }} />
                      <span className="ns9-pill-txt">Lập kế hoạch nhẹ nhàng hôm nay</span>
                    </button>
                    <button
                      type="button"
                      className="ns9-pill-item-btn"
                      onClick={() => {
                        setText('Chia sẻ kinh nghiệm tránh bẫy câu hỏi lý thuyết THPT 2026');
                        inputRef.current?.focus();
                      }}
                    >
                      <span className="ns9-pill-dot" style={{ background: '#ef4444' }} />
                      <span className="ns9-pill-txt">Phân tích Sổ lỗi sai & Khắc phục</span>
                    </button>
                    <button
                      type="button"
                      className="ns9-pill-item-btn"
                      onClick={() => {
                        setText('Hỏi đáp phương pháp giải nhanh & kỹ thuật Casio');
                        inputRef.current?.focus();
                      }}
                    >
                      <span className="ns9-pill-dot" style={{ background: '#8b5cf6' }} />
                      <span className="ns9-pill-txt">Cân bằng PTHH & Tính toán khoa học</span>
                    </button>
                  </div>

                  {/* Top streak classes if any */}
                  {topClasses.length > 0 && !search && (
                    <div className="cw-top-classes-card">
                      <div className="cw-top-head">
                        <span><IcSvgFlame size={14} /> Lớp có chuỗi dài nhất hôm nay</span>
                        <a href="#leaderboard" className="cw-top-link">
                          BXH Chuỗi →
                        </a>
                      </div>
                      {topClasses.map((cls, idx) => (
                        <div key={cls.id || idx} className="cw-top-row">
                          <span className="cw-top-rank">#{idx + 1}</span>
                          <span className="cw-top-name">{cls.name || 'Lớp học'}</span>
                          <span className="cw-top-fire"><IcSvgFlame size={12} /> {cls.streak?.count || 0} ngày</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msgs.length >= 50 && !search && !noMore && (
                    <button className="cw-more" type="button" onClick={loadOlder} disabled={loadingOld}>
                      <IcUp width="14" height="14" /> {loadingOld ? 'Đang tải…' : 'Tải tin cũ hơn'}
                    </button>
                  )}

                  {filtered.length === 0 && (
                    <div className="cw-empty">
                      <STICKERS.smile.Icon width="32" height="32" />
                      {search ? 'Không tìm thấy tin nhắn nào.' : 'Chưa có tin nhắn. Hãy là người mở lời đầu tiên!'}
                    </div>
                  )}

                  {filtered.map((m, i) => (
                    <Message
                      key={m.id}
                      m={m}
                      prev={filtered[i - 1]}
                      uid={uid}
                      user={user}
                      userProfileMap={userProfileMap}
                      active={activeId === m.id}
                      armed={delArm === m.id}
                      onToggle={() => setActiveId((a) => (a === m.id ? null : m.id))}
                      onReact={toggleReaction}
                      onReply={startReply}
                      onDel={onDel}
                      onImg={setLightbox}
                      onJump={jumpTo}
                      onImgLoad={() => stick.current && toBottom(false)}
                      onOpenProfile={(tUid, tName) => setProfileTarget({ uid: tUid, name: tName })}
                    />
                  ))}
                </div>

                {newBelow > 0 && (
                  <button className="cw-jump" type="button" onClick={() => { toBottom(true); setNewBelow(0); }}>
                    <IcDown width="14" height="14" /> {newBelow} tin mới
                  </button>
                )}

                {dragging && (
                  <div className="cw-drop">
                    <span><IcImage /> Thả ảnh để gửi</span>
                  </div>
                )}

                {err && <p className="cw-err" role="alert">{err}</p>}

                {/* 3. Footer Bar matching Image 3 Column 3 */}
                <div style={{ position: 'relative' }}>
                  {replyTo && (
                    <div className="cw-attach">
                      <IcReply width="16" height="16" />
                      <div>
                        <b>Trả lời {String(replyTo.name || '').slice(0, 20)}</b>
                        <span>{replyTo.text || (replyTo.img ? 'Ảnh' : '')}</span>
                      </div>
                      <button className="cw-ib ghost" onClick={() => setReplyTo(null)} type="button">
                        <IcClose width="16" height="16" />
                      </button>
                    </div>
                  )}

                  {img && (
                    <div className="cw-attach">
                      <img src={img} alt="Ảnh đính kèm" />
                      <div><b>Ảnh đính kèm</b><span>Sẽ gửi cùng tin nhắn</span></div>
                      <button className="cw-ib ghost" onClick={() => setImg(null)} type="button">
                        <IcClose width="16" height="16" />
                      </button>
                    </div>
                  )}

                  {showPicker && (
                    <div className="cw-picker" role="group">
                      <div className="ns9-popover-title" style={{ padding: '6px 8px 4px', fontWeight: 700 }}>Chọn Sticker & Biểu cảm:</div>
                      <div className="cw-picker-grid">
                        {Object.entries(STICKERS).map(([k, { Icon, label }]) => (
                          <button key={k} className="cw-st-btn" type="button" onClick={() => addSticker(k)} title={label}>
                            <Icon width="100%" height="100%" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form className="ns9-chat-footer-bar" onSubmit={send}>
                    <button
                      type="button"
                      className="ns9-cf-tool-btn"
                      onClick={() => setShowPicker((p) => !p)}
                      title="Thêm sticker hoặc biểu cảm"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>

                    <label className="ns9-cf-tool-btn" style={{ cursor: 'pointer' }} title="Gửi ảnh bài tập">
                      <IcImage width="18" height="18" />
                      <input type="file" accept="image/*" hidden onChange={onPickInput} />
                    </label>

                    <input
                      ref={inputRef}
                      type="text"
                      value={text}
                      maxLength={MAX_TEXT}
                      placeholder='Gõ câu hỏi bài tập, hoặc ấn "+" để gửi ảnh...'
                      className="ns9-cf-input"
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={onKeyDown}
                      onPaste={onPaste}
                    />

                    <button
                      type="submit"
                      className="ns9-cf-send-btn"
                      disabled={sending || (!text.trim() && !img)}
                      aria-label="Gửi tin nhắn"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {profileTarget && (
        <ProfileCard
          targetUid={profileTarget.uid}
          fallbackName={profileTarget.name}
          onClose={() => setProfileTarget(null)}
          onOpenDm={(dmId) => {
            setProfileTarget(null);
            setActiveTab('friends');
            setActiveDmThread({ dmId, peerUid: profileTarget.uid, peerName: profileTarget.name });
          }}
        />
      )}
    </>
  );
}