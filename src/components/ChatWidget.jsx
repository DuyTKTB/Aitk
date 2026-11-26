import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useLocalStorage, useLiveStreak, recordDailyStreak } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../ui/index.jsx';
import { isValidStreakMessage } from '../lib/chatStreak.js';
import { isAdmin } from '../lib/isAdmin.js';
import {
  hasEveryoneMention,
  MENTION_SPLIT_RE,
  checkEveryoneCooldown,
  markEveryoneCooldown,
  broadcastEveryoneMention,
} from '../lib/mentionPush.js';
import { syncMyPublicStats, getProfile } from '../lib/social.js';
import { getTopStreakClasses } from '../lib/classroom.js';
import VerifiedBadge from './VerifiedBadge.jsx';
import SocialFeedPanel from './social/SocialFeedPanel.jsx';
import MessengerNotesBar from './social/MessengerNotesBar.jsx';
import ClassChat from './social/ClassChat.jsx';
import DmPanel from './social/DmPanel.jsx';
import StudentAvatar from './StudentAvatar.jsx';
import './chat-widget.css';
import '../styles/elec-messenger.css';
import '../styles/elec-social-hub.css';

/* ============ CẤU HÌNH ============ */
const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
const URL_MSG = `${DB}/chat/messages.json`;
const URL_ONLINE = `${DB}/chat/online.json`;
const QUERY = 'orderBy=%22%24key%22';
const STREAM = `${URL_MSG}?${QUERY}&limitToLast=50`;
const PAGE = 30;
const MAX_TEXT = 500;
const MAX_IMG = 300000;
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

const IcChat = mk(<><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-4.9A8.5 8.5 0 1 1 21 11.5Z" />{dot(8.5, 11.5)}{dot(12.5, 11.5)}{dot(16.5, 11.5)}</>);
const IcClose = mk(<path d="M6 6l12 12M18 6L6 18" />);
const IcSearch = mk(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>);
const IcImage = mk(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 9" /></>);
const IcReply = mk(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v3" /></>);
const IcTrash = mk(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
const IcDown = mk(<path d="M12 5v14M6 13l6 6 6-6" />);
const IcUp = mk(<path d="M6 15l6-6 6 6" />);
const IcSmile = mk(<><circle cx="12" cy="12" r="9.5" /><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" /><path d="M8.5 14.5c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2" /></>);
const IcEdit = mk(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>);

const IcSvgFlame = ({ size = 13, color = '#f97316' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2c1.2 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-7 0 2 1 3 2 3 0-2 0-4 0-6z" />
  </svg>
);

/* ============ STICKER ĐỘC QUYỀN ELEC AI + EMOJI CHUẨN MESSENGER/TIKTOK ============ */
const ELEC_STICKERS = {
  elec_hello:       { label: 'Chào bạn',    src: '/img/elec/elec-hello.png' },
  elec_love:        { label: 'Thả tim',     src: '/img/elec/elec-love.png' },
  elec_cool:        { label: 'Quá ngầu',    src: '/img/elec/elec-cool.png' },
  elec_fighting:    { label: 'Quyết tâm',   src: '/img/elec/elec-fighting.png' },
  elec_happy:       { label: 'Vui quá',     src: '/img/elec/elec-happy.png' },
  elec_celebrate:   { label: 'Ăn mừng',     src: '/img/elec/elec-celebrate.png' },
  elec_super_saiyan:{ label: 'Bứt phá',     src: '/img/elec/elec-super-saiyan.png' },
  elec_heart_eyes:  { label: 'Mê chữ ê',    src: '/img/elec/elec-heart-eyes.png' },
  elec_think:       { label: 'Suy nghĩ',    src: '/img/elec/elec-think.png' },
  elec_wink:        { label: 'Nháy mắt',    src: '/img/elec/elec-wink.png' },
  elec_shocked:     { label: 'Bất ngờ',     src: '/img/elec/elec-shocked.png' },
  elec_shy:         { label: 'Ngại quá',    src: '/img/elec/elec-shy.png' },
  elec_plead:       { label: 'Năn nỉ',      src: '/img/elec/elec-plead.png' },
  elec_crying:      { label: 'Hu hu',       src: '/img/elec/elec-crying.png' },
  elec_angry:       { label: 'Căng rồi',    src: '/img/elec/elec-angry.png' },
  elec_sleepy:      { label: 'Buồn ngủ',    src: '/img/elec/elec-sleepy.png' },
};

/* Tương thích ngược toàn bộ token cũ (:smile:, :heart:, ...) nhưng hiển thị emoji màu sắc nét */
const LEGACY_EMOJI = {
  smile:   { label: 'Cười',        emoji: '😊' },
  grin:    { label: 'Cười tươi',   emoji: '😄' },
  laugh:   { label: 'Haha',        emoji: '😂' },
  wink:    { label: 'Nháy mắt',    emoji: '😉' },
  cool:    { label: 'Ngầu',        emoji: '😎' },
  think:   { label: 'Suy nghĩ',    emoji: '🤔' },
  neutral: { label: 'Bình thường', emoji: '😐' },
  sleepy:  { label: 'Buồn ngủ',    emoji: '😴' },
  cry:     { label: 'Khóc',        emoji: '😭' },
  angry:   { label: 'Giận',        emoji: '😤' },
  wow:     { label: 'Wow',         emoji: '😮' },
  heart:   { label: 'Tim',         emoji: '❤️' },
  like:    { label: 'Thích',       emoji: '👍' },
  dislike: { label: 'Không thích', emoji: '👎' },
  fire:    { label: 'Cháy quá',    emoji: '🔥' },
  star:    { label: 'Xuất sắc',    emoji: '⭐' },
  flask:   { label: 'Hóa học',     emoji: '🧪' },
  book:    { label: 'Ôn bài',      emoji: '📚' },
};

const REACTIONS = [
  { key: 'heart', label: 'Yêu thích', emoji: '❤️' },
  { key: 'haha',  label: 'Haha',      emoji: '😂' },
  { key: 'wow',   label: 'Wow',       emoji: '😮' },
  { key: 'fire',  label: 'Đỉnh',      emoji: '🔥' },
  { key: 'like',  label: 'Thích',     emoji: '👍' },
];

const ICEBREAKERS = [
  { label: 'Hỏi bài Hóa · Lý', text: 'Có bạn nào giúp mình câu Hóa / Lý này với!' },
  { label: 'Tìm bạn học 27+',  text: 'Tìm bạn đồng hành giữ chuỗi mục tiêu 27+ năm nay 🔥' },
  { label: 'Mẹo bấm Casio',    text: 'Chia sẻ mẹo giải nhanh & bấm máy Casio đi mọi người!' },
];

/* ============ TIỆN ÍCH ============ */
const TOKEN = /(:[a-z0-9_]+:|https?:\/\/[^\s<>"']+)/g;

const isOnlyStickerMessage = (t = '') => {
  const s = t.trim();
  if (!s) return false;
  const parts = s.split(/\s+/);
  if (parts.length > 3) return false;
  return parts.every((p) => {
    if (!/^:[a-z0-9_]+:$/.test(p)) return false;
    const key = p.slice(1, -1);
    return !!(ELEC_STICKERS[key] || LEGACY_EMOJI[key]);
  });
};

function Rich({ text, solo = false }) {
  return text.split(TOKEN).map((p, i) => {
    if (!p) return null;
    if (/^:[a-z0-9_]+:$/.test(p)) {
      const key = p.slice(1, -1);
      if (ELEC_STICKERS[key]) {
        const st = ELEC_STICKERS[key];
        return (
          <img
            key={i}
            src={st.src}
            alt={st.label}
            title={`Sticker ELEC AI · ${st.label}`}
            className={solo ? 'ec-elec-sticker' : 'ec-elec-sticker-inline'}
            draggable={false}
          />
        );
      }
      if (LEGACY_EMOJI[key]) {
        const em = LEGACY_EMOJI[key];
        return (
          <span key={i} className={solo ? 'ec-emoji-solo' : 'ec-emoji-inline'} title={em.label}>
            {em.emoji}
          </span>
        );
      }
    }
    if (/^https?:\/\//.test(p)) {
      return <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow">{p}</a>;
    }
    return p.split(MENTION_SPLIT_RE).map((seg, sIdx) => {
      if (MENTION_SPLIT_RE.test(seg)) {
        MENTION_SPLIT_RE.lastIndex = 0;
        return (
          <span key={`${i}-m-${sIdx}`} className="elec-mention-pill">
            {seg}
          </span>
        );
      }
      return seg;
    });
  });
}

const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const dayKey = (t) => new Date(t).toDateString();
const dayStampLabel = (t) => {
  const d = new Date(t);
  const n = new Date();
  const y = new Date();
  y.setDate(n.getDate() - 1);
  const hm = fmtTime(t);
  if (d.toDateString() === n.toDateString()) return `Hôm nay · ${hm}`;
  if (d.toDateString() === y.toDateString()) return `Hôm qua · ${hm}`;
  return `${d.toLocaleDateString('vi-VN')} · ${hm}`;
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

/* ============ MỘT TIN NHẮN (CHUẨN MESSENGER × TIKTOK × ELEC AI) ============ */
function Message({
  m,
  prev,
  next,
  uid,
  user,
  userProfileMap = {},
  active,
  armed,
  onToggle,
  onReact,
  onReply,
  onDel,
  onImg,
  onJump,
  onImgLoad,
  onOpenProfile,
}) {
  const [heartPop, setHeartPop] = useState(false);

  const isMe = m.uid === uid || (m.name && user?.displayName && m.name === user.displayName);
  const t = Number(m.t) || 0;
  const pt = prev ? Number(prev.t) || 0 : 0;
  const nt = next ? Number(next.t) || 0 : 0;

  const showTimeSep = !prev || dayKey(pt) !== dayKey(t) || t - pt > 900000; // >15 phút hoặc sang ngày mới
  const isFirstInGroup = showTimeSep || !prev || prev.uid !== m.uid || t - pt > 180000;
  const isLastInGroup =
    !next ||
    dayKey(nt) !== dayKey(t) ||
    next.uid !== m.uid ||
    nt - t > 180000;

  const reactions = m.reactions || {};
  const chips = REACTIONS.map((r) => ({
    ...r,
    count: Object.keys(reactions[r.key] || {}).length,
    mine: !!reactions[r.key]?.[uid],
  })).filter((r) => r.count > 0);

  const text = typeof m.text === 'string' ? m.text : '';
  const hasImg = typeof m.img === 'string' && m.img.startsWith('data:image/');
  const stickerOnly = !hasImg && isOnlyStickerMessage(text);
  const imageOnly = hasImg && !text.trim();

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onReact(m, 'heart');
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 700);
  };

  return (
    <>
      {showTimeSep && (
        <div className="ec-time-sep">
          <span>{dayStampLabel(t)}</span>
        </div>
      )}

      <div
        id={'cw-m-' + m.id}
        className={[
          'ec-msg',
          isMe ? 'is-me' : '',
          isFirstInGroup ? 'is-first' : '',
          isLastInGroup ? 'is-last' : '',
          active ? 'is-active' : '',
          chips.length > 0 ? 'has-chips' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Avatar chỉ hiện ở tin cuối nhóm của người khác (chuẩn Messenger/TikTok) */}
        {!isMe && (
          <div className="ec-avatar-slot">
            {isLastInGroup && (
              <button
                type="button"
                className="ec-avatar-btn"
                onClick={() => onOpenProfile?.(m.uid, m.name)}
                title={m.name || 'Học sinh'}
              >
                <StudentAvatar
                  name={m.name}
                  uid={m.uid}
                  photoURL={m.photoURL || userProfileMap?.[m.uid] || null}
                  size={28}
                  title={m.name}
                />
              </button>
            )}
          </div>
        )}

        <div className="ec-msg-col">
          {/* Tên người gửi nằm NGOÀI phía trên bong bóng đầu nhóm */}
          {!isMe && isFirstInGroup && (
            <div className="ec-sender-meta">
              <button
                type="button"
                className="ec-sender-btn"
                onClick={() => onOpenProfile?.(m.uid, m.name)}
                title="Xem hồ sơ"
              >
                <span>{String(m.name || 'Học sinh').slice(0, 22)}</span>
                <VerifiedBadge uid={m.uid} size={12} />
              </button>
              {Number(m.streak) >= 3 && (
                <span className="ec-streak-tag" title={`Chuỗi ${m.streak} ngày học`}>
                  <IcSvgFlame size={10} /> {m.streak}
                </span>
              )}
            </div>
          )}

          {/* Reply quote kiểu Messenger phía trên bong bóng */}
          {m.reply && (
            <button
              type="button"
              className="ec-reply-preview"
              onClick={(e) => {
                e.stopPropagation();
                onJump(m.reply.id);
              }}
            >
              <b>Trả lời {String(m.reply.name || '').slice(0, 20)}</b>
              <span>{String(m.reply.text || '') || (m.reply.img ? '📷 Hình ảnh' : '')}</span>
            </button>
          )}

          <div className="ec-bubble-row">
            <div
              className={[
                'ec-bubble',
                stickerOnly ? 'is-sticker-only' : '',
                imageOnly ? 'is-image-only' : '',
              ].filter(Boolean).join(' ')}
              onClick={onToggle}
              onDoubleClick={handleDoubleClick}
              title={`Nhấp đúp để thả tim · ${fmtTime(t)}`}
            >
              {heartPop && <span className="ec-doubletap-heart" aria-hidden="true">❤️</span>}

              {text && <Rich text={text} solo={stickerOnly} />}

              {hasImg && (
                <img
                  className="ec-msg-img"
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
            </div>

            {/* Thanh thả cảm xúc + trả lời + giờ nổi bên cạnh kiểu Messenger/TikTok */}
            <div
              className="ec-hover-actions"
              role="toolbar"
              aria-label="Thao tác tin nhắn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ec-hover-pill">
                {REACTIONS.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className={'ec-act-btn' + (reactions[r.key]?.[uid] ? ' is-mine' : '')}
                    onClick={() => onReact(m, r.key)}
                    title={r.label}
                    aria-label={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="ec-act-btn"
                  onClick={() => onReply(m)}
                  title="Trả lời"
                  aria-label="Trả lời"
                >
                  <IcReply width="13" height="13" />
                </button>
                {isMe && (
                  <button
                    type="button"
                    className={'ec-act-btn is-danger' + (armed ? ' is-armed' : '')}
                    onClick={() => onDel(m.id)}
                    title={armed ? 'Bấm lần nữa để xóa' : 'Thu hồi / Xóa'}
                    aria-label={armed ? 'Xác nhận xóa' : 'Xóa'}
                  >
                    {armed ? 'Xóa?' : <IcTrash width="13" height="13" />}
                  </button>
                )}
              </div>
              <span className="ec-hover-time">{fmtTime(t)}</span>
            </div>
          </div>

          {/* Reaction pills nổi chồng góc dưới bong bóng */}
          {chips.length > 0 && (
            <div className="ec-react-pills">
              {chips.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={'ec-react-chip' + (r.mine ? ' is-mine' : '')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact(m, r.key);
                  }}
                  aria-pressed={r.mine}
                  title={`${r.label}: ${r.count}`}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span>{r.count}</span>}
                </button>
              ))}
            </div>
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
  const [pickerTab, setPickerTab] = useState('elec'); // 'elec' | 'emoji'
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [delArm, setDelArm] = useState(null);
  const [loadingOld, setLoadingOld] = useState(false);
  const [noMore, setNoMore] = useState(false);
  const [newBelow, setNewBelow] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('community'); // 'community' | 'class' | 'friends'
  const [activeDmThread, setActiveDmThread] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);
  const [showSocialPane, setShowSocialPane] = useState(true);
  const [mobilePane, setMobilePane] = useState('social'); // 'social' | 'chat'
  const [topClasses, setTopClasses] = useState([]);
  const [showMentionPop, setShowMentionPop] = useState(false);

  const openUserProfile = (tUid, tName) => {
    if (!tUid) return;
    setProfileTarget({ uid: tUid, name: tName });
    setShowSocialPane(true);
    setMobilePane('social');
  };

  const { count: streakCount, isToday } = useLiveStreak();
  const toast = useToast();
  const lastSentText = useRef('');

  useEffect(() => {
    const handleOpenChat = (e) => {
      const targetTab = e?.detail?.tab;
      if (targetTab) {
        setOpen(true);
        if (targetTab === 'class' || targetTab === 'community' || targetTab === 'friends') {
          setActiveTab(targetTab);
        }
        setMobilePane(targetTab === 'feed' ? 'social' : 'chat');
      } else {
        setOpen((prev) => !prev);
      }
    };
    const handleOpenDm = (e) => {
      const detail = e?.detail;
      setOpen(true);
      setActiveTab('friends');
      setMobilePane('chat');
      if (detail?.peerUid) {
        setActiveDmThread({
          dmId: detail.dmId,
          peerUid: detail.peerUid,
          peerName: detail.peerName || 'Bạn học',
        });
      }
    };
    window.addEventListener('elec-open-community-chat', handleOpenChat);
    window.addEventListener('elec-open-dm', handleOpenDm);
    return () => {
      window.removeEventListener('elec-open-community-chat', handleOpenChat);
      window.removeEventListener('elec-open-dm', handleOpenDm);
    };
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

    let es = null;
    let reconnectTimer = null;
    let fallbackPoll = null;
    let closed = false;

    const applySnapshot = (data) => {
      const fresh = data ? sortById(Object.entries(data).map(([id, v]) => ({ id, ...v }))) : [];
      const first = fresh[0]?.id;
      setMsgs((m) => (first ? [...m.filter((x) => x.id < first), ...fresh] : []));
    };

    const syncOnce = async () => {
      try {
        const r = await fetch(STREAM);
        if (!r.ok) return;
        const data = await r.json();
        if (!closed) applySnapshot(data);
      } catch { /* ignore */ }
    };

    const connect = () => {
      if (closed) return;
      try { es?.close(); } catch { /* ignore */ }
      es = new EventSource(STREAM);
      es.onopen = () => {
        if (!closed) setConnected(true);
      };
      es.onerror = () => {
        if (closed) return;
        setConnected(false);
        try { es?.close(); } catch { /* ignore */ }
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          syncOnce();
          connect();
        }, 4000);
      };
      es.addEventListener('cancel', () => {
        if (!closed) setConnected(false);
      });
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
      es.addEventListener('patch', (e) => {
        let p;
        try { p = JSON.parse(e.data); } catch { return; }
        const { path, data } = p;
        if (!data || typeof data !== 'object') return;
        if (path === '/') {
          setMsgs((m) => {
            const map = new Map(m.map((x) => [x.id, x]));
            for (const [id, v] of Object.entries(data)) {
              if (v === null) map.delete(id);
              else map.set(id, { ...(map.get(id) || {}), id, ...v });
            }
            return sortById([...map.values()]);
          });
        } else {
          const [id] = path.slice(1).split('/');
          setMsgs((m) => m.map((x) => (x.id === id ? { ...x, ...data } : x)));
        }
      });
    };

    connect();

    const onVis = () => {
      if (document.visibilityState === 'visible') syncOnce();
    };
    document.addEventListener('visibilitychange', onVis);
    fallbackPoll = setInterval(() => {
      if (!es || es.readyState !== 1) syncOnce();
    }, 10000);

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      clearInterval(fallbackPoll);
      document.removeEventListener('visibilitychange', onVis);
      try { es?.close(); } catch { /* ignore */ }
    };
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
  }, [open, activeTab]);

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

  const handleChatTextChange = (val) => {
    setText(val);
    const match = val.match(/(?:^|\s)@([^\s@]{0,14})$/);
    if (match) {
      const q = match[1].toLowerCase();
      setShowMentionPop(
        !q || 'mọi người'.startsWith(q) || 'moinguoi'.startsWith(q) || 'everyone'.startsWith(q) || 'all'.startsWith(q)
      );
    } else {
      setShowMentionPop(false);
    }
  };

  const insertChatMentionEveryone = () => {
    setText((prev) => {
      const cleaned = prev.replace(/@[^\s@]*$/, '');
      const sep = cleaned && !/\s$/.test(cleaned) ? ' ' : '';
      return `${cleaned}${sep}@mọi người `.slice(0, MAX_TEXT);
    });
    setShowMentionPop(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendPayloadText = async (overrideText = null) => {
    const raw = overrideText !== null ? overrideText : text;
    const t = String(raw || '').trim().slice(0, MAX_TEXT);
    const attachedImg = overrideText !== null ? null : img;
    if ((!t && !attachedImg) || sending) return;
    if (Date.now() - lastSend.current < 450) { setErr('Gửi chậm lại một chút nhé.'); return; }
    const isMentionAll = hasEveryoneMention(t);
    if (isMentionAll) {
      const cd = checkEveryoneCooldown(uid, 'community_chat', isAdmin(user));
      if (!cd.ok) {
        setErr(`Đợi ${cd.waitSec} giây nữa trước khi nhắc @mọi người tiếp nhé.`);
        return;
      }
    }
    lastSend.current = Date.now();
    setSending(true);
    try {
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
        img: attachedImg || null,
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
      const resp = await r.json().catch(() => null);
      if (resp?.name) {
        const newId = resp.name;
        setMsgs((prev) =>
          prev.some((x) => x.id === newId)
            ? prev
            : sortById([...prev, { id: newId, ...payload }])
        );
      }
      stick.current = true;
      if (isMentionAll) {
        markEveryoneCooldown(uid, 'community_chat');
        broadcastEveryoneMention({
          channel: 'community_chat',
          channelName: 'Chat Cộng đồng ELEC',
          authorUid: uid,
          authorName: (name.trim() || 'Thành viên ELEC').slice(0, 28),
          authorPhoto: user?.photoURL || '',
          text: t,
        }).catch(() => {});
        toast('Đã gửi tin & thông báo đẩy tới @mọi người!');
      }
      if (overrideText === null) {
        setText('');
        setImg(null);
      }
      setErr('');
      setReplyTo(null);
      setShowPicker(false);
      setShowMentionPop(false);
    } catch {
      setErr('Gửi thất bại. Kiểm tra mạng.');
    } finally {
      setSending(false);
    }
  };

  const send = (e) => {
    e?.preventDefault();
    sendPayloadText(null);
  };

  const onKeyDown = (e) => {
    if (showMentionPop && (e.key === 'Tab' || e.key === 'Enter')) {
      e.preventDefault();
      insertChatMentionEveryone();
      return;
    }
    if (showMentionPop && e.key === 'Escape') {
      setShowMentionPop(false);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      send();
    }
  };

  useEffect(() => { if (open && activeTab === 'community') inputRef.current?.focus(); }, [open, activeTab]);

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

  const onPaneKey = (e) => {
    if (e.key !== 'Escape' || lightbox) return;
    e.stopPropagation();
    if (showPicker) setShowPicker(false);
    else if (showNameEdit) setShowNameEdit(false);
    else if (showSearch) { setShowSearch(false); setSearch(''); }
    else if (replyTo) setReplyTo(null);
    else { setOpen(false); fabRef.current?.focus(); }
  };

  const onlineCount = Math.max(Object.keys(onlineUsers).length, connected ? 1 : 0);
  const channelTitle =
    activeTab === 'community'
      ? 'ELEC Cộng Đồng'
      : activeTab === 'class'
      ? 'Lớp học ELEC'
      : 'Tin nhắn & Bạn bè';

  const channelStatus =
    activeTab === 'community'
      ? connected
        ? `${onlineCount} bạn đang hoạt động`
        : 'Đang kết nối kênh ELEC…'
      : activeTab === 'class'
      ? 'Thảo luận & giữ chuỗi cùng lớp'
      : 'Nhắn tin 1:1 trực tiếp';

  return (
    <>
      <button
        ref={fabRef}
        className={'cw-fab' + (open ? ' is-open' : '')}
        onClick={() => setOpen((o) => !o)}
        type="button"
        aria-label={open ? 'Đóng chat' : 'Mở ELEC Messenger'}
        aria-expanded={open}
      >
        <IcChat className="cw-i-chat" width="26" height="26" />
        <IcClose className="cw-i-close" width="24" height="24" strokeWidth="2.4" />
      </button>

      {open && (
        <div
          className="ec-chat-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className={`esh-split-frame ${!showSocialPane ? 'is-chat-only' : ''} ${isExpanded ? 'is-expanded' : ''} ${mobilePane === 'social' ? 'mob-show-social' : 'mob-show-chat'}`}
            role="dialog"
            aria-label="ELEC Social & Messenger"
            onKeyDown={onPaneKey}
          >
            {/* THANH CHUYỂN NHANH TRÊN MOBILE (<920px) */}
            {showSocialPane && (
              <div className="esh-mobile-bar" role="tablist" aria-label="Chuyển Mạng xã hội và Nhắn tin">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mobilePane === 'social'}
                  className={`esh-mob-tab ${mobilePane === 'social' ? 'is-active' : ''}`}
                  onClick={() => setMobilePane('social')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                    <rect x="3" y="4" width="18" height="16" rx="3" />
                    <path d="M7 9h10M7 13h7" />
                  </svg>
                  <span>Mạng xã hội</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mobilePane === 'chat'}
                  className={`esh-mob-tab ${mobilePane === 'chat' ? 'is-active' : ''}`}
                  onClick={() => setMobilePane('chat')}
                >
                  <IcChat width="14" height="14" />
                  <span>Nhắn tin</span>
                </button>
              </div>
            )}

            {/* BÊN TRÁI: TRANG MẠNG XÃ HỘI ELEC AI (BẢNG TIN · HỌC CHUNG · TRANG CÁ NHÂN) */}
            {showSocialPane && (
              <SocialFeedPanel
                profileTarget={profileTarget}
                onSelectProfile={(t) => setProfileTarget(t)}
                onClearProfile={() => setProfileTarget(null)}
                onOpenDm={(dmIdStr, peerUid, peerName) => {
                  setActiveTab('friends');
                  setActiveDmThread({ dmId: dmIdStr, peerUid, peerName });
                  setMobilePane('chat');
                }}
                onNavigateAway={() => setOpen(false)}
              />
            )}

            {/* BÊN PHẢI: NHẮN TIN ELEC MESSENGER */}
            <div
              className="ec-chat-shell is-in-split"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
              }}
              onDrop={onDrop}
            >
            {/* 1. MESSENGER × TIKTOK HEADER CÓ BẢN QUYỀN ELEC AI */}
            <header className="ec-head">
              <div className="ec-head-brand">
                <div className="ec-brand-avatar">
                  <img src="/img/elec/elec-hello.png" alt="ELEC AI" draggable={false} />
                  <span className={`ec-live-dot ${connected ? '' : 'is-off'}`} />
                </div>
                <div className="ec-brand-meta">
                  <div className="ec-brand-title-row">
                    <span className="ec-brand-title">{channelTitle}</span>
                    <span className="ec-verified-chip">ELEC AI</span>
                  </div>
                  <span className="ec-brand-status">{channelStatus}</span>
                </div>
              </div>

              <div className="ec-head-actions">
                <button
                  type="button"
                  className={`ec-icon-btn ${showSocialPane ? 'is-active' : ''}`}
                  onClick={() => setShowSocialPane((v) => !v)}
                  title={showSocialPane ? 'Ẩn cột Mạng xã hội (chỉ xem Nhắn tin)' : 'Hiện 2 cột: Mạng xã hội + Nhắn tin'}
                  aria-label={showSocialPane ? 'Ẩn cột Mạng xã hội' : 'Hiện cột Mạng xã hội'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2.5" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </button>

                {user?.uid && (
                  <button
                    type="button"
                    className="ec-icon-btn"
                    onClick={() =>
                      openUserProfile(user.uid, user.displayName || name || 'Trang cá nhân')
                    }
                    title="Trang cá nhân & Đăng cap của tôi"
                    aria-label="Trang cá nhân của tôi"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="3.6" />
                      <path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
                    </svg>
                  </button>
                )}

                {activeTab === 'community' && (
                  <>
                    <button
                      type="button"
                      className={`ec-icon-btn ${showSearch ? 'is-active' : ''}`}
                      onClick={() => {
                        setShowSearch((s) => !s);
                        setShowNameEdit(false);
                      }}
                      title="Tìm kiếm tin nhắn"
                      aria-label="Tìm kiếm tin nhắn"
                    >
                      <IcSearch width="17" height="17" />
                    </button>
                    <button
                      type="button"
                      className={`ec-icon-btn ${showNameEdit ? 'is-active' : ''}`}
                      onClick={() => {
                        setShowNameEdit((p) => !p);
                        setShowSearch(false);
                      }}
                      title="Đổi tên hiển thị"
                      aria-label="Đổi tên hiển thị"
                    >
                      <IcEdit width="16" height="16" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="ec-icon-btn"
                  onClick={() => setIsExpanded((e) => !e)}
                  title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                  aria-label={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                >
                  {isExpanded ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className="ec-icon-btn"
                  onClick={() => setOpen(false)}
                  title="Đóng"
                  aria-label="Đóng chat"
                >
                  <IcClose width="18" height="18" strokeWidth="2.3" />
                </button>
              </div>

              {showNameEdit && (
                <form
                  className="ec-name-popover"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShowNameEdit(false);
                    toast('Đã cập nhật tên hiển thị!');
                  }}
                >
                  <label htmlFor="ec-nick-input">Tên hiển thị của bạn trong kênh ELEC</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      id="ec-nick-input"
                      value={name}
                      maxLength={20}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tên của bạn…"
                      autoFocus
                    />
                    <button
                      type="submit"
                      style={{
                        height: 34,
                        padding: '0 12px',
                        borderRadius: 10,
                        border: 0,
                        background: '#0084ff',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Lưu
                    </button>
                  </div>
                </form>
              )}
            </header>

            {/* 2. THANH CHUYỂN KÊNH GỌN KIỂU TIKTOK / MESSENGER */}
            <nav className="ec-tabs" aria-label="Kênh trò chuyện">
              <button
                type="button"
                className={`ec-tab ${activeTab === 'community' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('community')}
              >
                Cộng đồng
              </button>
              <button
                type="button"
                className={`ec-tab ${activeTab === 'class' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('class')}
              >
                Lớp
              </button>
              <button
                type="button"
                className={`ec-tab ${activeTab === 'friends' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                Bạn bè
              </button>

              <button
                type="button"
                className="ec-tab-ai"
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent('elec-open-companion-modal'));
                }}
                title="Mở Trợ lý học tập ELEC AI"
              >
                <img src="/img/elec/elec-cool.png" alt="" />
                <span>Trợ lý AI</span>
              </button>
            </nav>

            {/* THANH CAP MESSENGER 24H GIỐNG FACEBOOK MESSENGER */}
            {!(activeTab === 'friends' && activeDmThread) && (
              <MessengerNotesBar
                onOpenProfile={(tUid, tName) => openUserProfile(tUid, tName)}
                onOpenDm={(dmIdStr, peerUid, peerName) => {
                  setActiveTab('friends');
                  setActiveDmThread({ dmId: dmIdStr, peerUid, peerName });
                }}
                onNavigateAway={() => setOpen(false)}
              />
            )}

            {/* Thanh tìm kiếm */}
            {showSearch && activeTab === 'community' && (
              <div className="ec-searchbar">
                <IcSearch width="15" height="15" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tin nhắn hoặc tên bạn học…"
                  autoFocus
                />
                {search && <small>{filtered.length} kết quả</small>}
              </div>
            )}

            {activeTab === 'class' && (
              <ClassChat onOpenProfile={(tUid, tName) => openUserProfile(tUid, tName)} />
            )}

            {activeTab === 'friends' && (
              user?.uid ? (
                <DmPanel
                  me={user}
                  thread={activeDmThread}
                  setThread={setActiveDmThread}
                  onOpenProfile={(tUid, tName) => openUserProfile(tUid, tName)}
                  onNavigateAway={() => setOpen(false)}
                  unreadMap={{}}
                />
              ) : (
                <div style={{ padding: '2.5rem 1.2rem', textAlign: 'center', color: 'var(--ec-ink-2)', fontSize: '13.5px' }}>
                  Vui lòng đăng nhập để kết bạn và nhắn tin riêng trên ELEC AI.
                </div>
              )
            )}

            {activeTab === 'community' && (
              <>
                <div className="ec-stream" ref={listRef} onScroll={onScroll}>
                  {/* Channel Intro kiểu Messenger/TikTok — Gọn, chính chủ ELEC AI */}
                  {!search && (
                    <div className="ec-channel-hero">
                      <div className="ec-hero-badge">
                        <img src="/img/elec/elec-hello.png" alt="ELEC AI" draggable={false} />
                      </div>
                      <h3 className="ec-hero-title">
                        <span>Cộng đồng ELEC AI · 2026</span>
                        <span className="ec-verified-chip">CHÍNH CHỦ</span>
                      </h3>
                      <p className="ec-hero-sub">
                        Chào {name || 'bạn'}! Nơi hỏi bài nhanh, giữ chuỗi học tập & thả sticker linh vật ELEC độc quyền.
                      </p>

                      {filtered.length < 4 && (
                        <div className="ec-icebreakers">
                          {ICEBREAKERS.map((chip) => (
                            <button
                              key={chip.label}
                              type="button"
                              className="ec-ice-chip"
                              onClick={() => {
                                setText(chip.text);
                                inputRef.current?.focus();
                              }}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dải BXH chuỗi lớp siêu gọn 1 dòng */}
                  {topClasses.length > 0 && !search && (
                    <div className="ec-streak-strip">
                      <span className="ec-streak-label">
                        <IcSvgFlame size={13} /> Top chuỗi lớp
                      </span>
                      {topClasses.map((cls, idx) => (
                        <span key={cls.id || idx} className="ec-streak-pill">
                          #{idx + 1} {cls.name || 'Lớp'} <b>{cls.streak?.count || 0}🔥</b>
                        </span>
                      ))}
                    </div>
                  )}

                  {msgs.length >= 50 && !search && !noMore && (
                    <button className="ec-load-old" type="button" onClick={loadOlder} disabled={loadingOld}>
                      <IcUp width="14" height="14" /> {loadingOld ? 'Đang tải…' : 'Xem tin cũ hơn'}
                    </button>
                  )}

                  {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--ec-ink-3)', fontSize: 13 }}>
                      {search ? 'Không tìm thấy tin nhắn nào.' : 'Chưa có tin nhắn. Nhấn gửi Sticker ELEC để mở lời ngay!'}
                    </div>
                  )}

                  {filtered.map((m, i) => (
                    <Message
                      key={m.id}
                      m={m}
                      prev={filtered[i - 1]}
                      next={filtered[i + 1]}
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
                      onOpenProfile={(tUid, tName) => openUserProfile(tUid, tName)}
                    />
                  ))}
                </div>

                {newBelow > 0 && (
                  <button className="ec-jump-down" type="button" onClick={() => { toBottom(true); setNewBelow(0); }}>
                    <IcDown width="14" height="14" /> {newBelow} tin mới
                  </button>
                )}

                {dragging && (
                  <div className="ec-drop-overlay">
                    <span><IcImage width="18" height="18" /> Thả ảnh vào đây để gửi</span>
                  </div>
                )}

                {err && <p className="ec-err-toast" role="alert">{err}</p>}

                {/* 3. KHAY REPLY / ẢNH / STICKER ĐỘC QUYỀN ELEC + COMPOSER MESSENGER */}
                <div style={{ position: 'relative' }}>
                  {replyTo && (
                    <div className="ec-attach-bar">
                      <IcReply width="16" height="16" />
                      <div className="ec-attach-info">
                        <b>Đang trả lời {String(replyTo.name || '').slice(0, 20)}</b>
                        <span>{replyTo.text || (replyTo.img ? '📷 Hình ảnh' : '')}</span>
                      </div>
                      <button className="ec-icon-btn" onClick={() => setReplyTo(null)} type="button" aria-label="Hủy trả lời">
                        <IcClose width="15" height="15" />
                      </button>
                    </div>
                  )}

                  {img && (
                    <div className="ec-attach-bar">
                      <img src={img} alt="Ảnh đính kèm" />
                      <div className="ec-attach-info">
                        <b>Ảnh đính kèm</b>
                        <span>Nhấn gửi để chia sẻ vào kênh</span>
                      </div>
                      <button className="ec-icon-btn" onClick={() => setImg(null)} type="button" aria-label="Bỏ ảnh">
                        <IcClose width="15" height="15" />
                      </button>
                    </div>
                  )}

                  {showPicker && (
                    <div className="ec-sticker-tray" role="group" aria-label="Sticker ELEC AI và Emoji">
                      <div className="ec-tray-tabs">
                        <button
                          type="button"
                          className={`ec-tray-tab ${pickerTab === 'elec' ? 'is-active' : ''}`}
                          onClick={() => setPickerTab('elec')}
                        >
                          Sticker ELEC
                        </button>
                        <button
                          type="button"
                          className={`ec-tray-tab ${pickerTab === 'emoji' ? 'is-active' : ''}`}
                          onClick={() => setPickerTab('emoji')}
                        >
                          Biểu cảm
                        </button>
                        <span className="ec-tray-hint">
                          {pickerTab === 'elec' ? 'Chạm để gửi ngay' : 'Chạm để chèn'}
                        </span>
                        <button
                          type="button"
                          className="ec-icon-btn"
                          style={{ width: 26, height: 26 }}
                          onClick={() => setShowPicker(false)}
                          aria-label="Đóng khay sticker"
                        >
                          <IcClose width="14" height="14" />
                        </button>
                      </div>

                      {pickerTab === 'elec' ? (
                        <div className="ec-elec-grid">
                          {Object.entries(ELEC_STICKERS).map(([k, st]) => (
                            <button
                              key={k}
                              type="button"
                              className="ec-elec-item"
                              onClick={() => sendPayloadText(`:${k}:`)}
                              title={`Gửi sticker ${st.label}`}
                            >
                              <img src={st.src} alt={st.label} loading="lazy" draggable={false} />
                              <span>{st.label}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="ec-emoji-grid">
                          {Object.entries(LEGACY_EMOJI).map(([k, em]) => (
                            <button
                              key={k}
                              type="button"
                              className="ec-emoji-btn"
                              onClick={() => {
                                setText((prevText) => (prevText + em.emoji).slice(0, MAX_TEXT));
                                inputRef.current?.focus();
                              }}
                              title={em.label}
                            >
                              {em.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {showMentionPop && (
                    <div className="elec-mention-pop is-above" role="listbox" aria-label="Nhắc mọi người">
                      <button
                        type="button"
                        className="elec-mention-opt"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          insertChatMentionEveryone();
                        }}
                      >
                        <span className="elec-mention-ico">@</span>
                        <span className="elec-mention-copy">
                          <b>@mọi người</b>
                          <small>Gửi thông báo đẩy tới tất cả thành viên ELEC AI</small>
                        </span>
                      </button>
                    </div>
                  )}

                  <form className="ec-composer" onSubmit={send}>
                    <label className="ec-tool-btn" title="Gửi ảnh" aria-label="Gửi ảnh">
                      <IcImage width="19" height="19" />
                      <input type="file" accept="image/*" hidden onChange={onPickInput} />
                    </label>

                    <button
                      type="button"
                      className={`ec-tool-btn ${showPicker ? 'is-active' : ''}`}
                      onClick={() => setShowPicker((p) => !p)}
                      title="Sticker ELEC AI & Emoji"
                      aria-label="Sticker ELEC AI và Emoji"
                    >
                      <IcSmile width="19" height="19" />
                    </button>

                    <button
                      type="button"
                      className={`ec-tool-btn ${hasEveryoneMention(text) ? 'is-active' : ''}`}
                      onClick={insertChatMentionEveryone}
                      title="Nhắc @mọi người (gửi thông báo đẩy)"
                      aria-label="Nhắc mọi người"
                      style={{ fontWeight: 800, fontSize: 15 }}
                    >
                      @
                    </button>

                    <div className="ec-input-pill">
                      <input
                        ref={inputRef}
                        type="text"
                        value={text}
                        maxLength={MAX_TEXT}
                        placeholder="Nhắn tin… (gõ @mọi người để đẩy thông báo)"
                        className="ec-input"
                        onChange={(e) => handleChatTextChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        onPaste={onPaste}
                      />
                    </div>

                    {text.trim() || img ? (
                      <button
                        type="submit"
                        className="ec-send-btn"
                        disabled={sending}
                        aria-label="Gửi tin nhắn"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ec-quick-like"
                        disabled={sending}
                        onClick={() => sendPayloadText(':elec_love:')}
                        title="Gửi nhanh Sticker Thả tim ELEC AI"
                        aria-label="Gửi nhanh Sticker Thả tim ELEC AI"
                      >
                        ❤️
                      </button>
                    )}
                  </form>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}
