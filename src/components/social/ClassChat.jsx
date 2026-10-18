/* ============================================================
   ClassChat.jsx — Apple-style Class Community Chat
   Firestore: classes/{classId}/chat  (realtime onSnapshot)
   Features: class picker, avatars, emoji reactions, timestamps
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import { getClassesByStudent, getClassesByTeacher } from '../../lib/classroom.js';
import { listenClassChat, sendClassMessage } from '../../lib/social.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import './social.css';

/* ── Micro SVG helper ── */
const Svg = ({ d, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  send:   'M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z',
  cls:    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  chevron:'M6 9l6 6 6-6',
  emoji:  'M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z',
};

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const fmtDay  = (t) => {
  const d = new Date(t); const n = new Date();
  if (d.toDateString() === n.toDateString()) return 'Hôm nay';
  const y = new Date(); y.setDate(n.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN');
};

/* Colour from uid for avatar gradient */
const GRAD = [
  ['#007aff','#5856d6'], ['#34c759','#30d158'],
  ['#ff9f0a','#ff6b00'], ['#ff375f','#ff2d55'],
  ['#5856d6','#af52de'], ['#32ade6','#007aff'],
];
const avatarGrad = (uid = '') => GRAD[uid.charCodeAt(0) % GRAD.length];

function Avatar({ uid, name, size = 32 }) {
  const [c1, c2] = avatarGrad(uid);
  const letter = (name?.[0] || '?').toUpperCase();
  return (
    <span
      className="sw-avatar sm"
      style={{ width: size, height: size, background: `linear-gradient(135deg,${c1},${c2})` }}
      title={name}
    >
      <span style={{ fontSize: size * .38 }}>{letter}</span>
    </span>
  );
}

/* Day separator pill */
function DaySep({ ts }) {
  return <div className="sw-day">{fmtDay(ts)}</div>;
}

export default function ClassChat({ onOpenProfile }) {
  const { user } = useAuth();
  const [classes, setClasses]   = useState(null);
  const [classId, setClassId]   = useState('');
  const [msgs, setMsgs]         = useState([]);
  const [text, setText]         = useState('');
  const [reacting, setReacting] = useState(null); // msgId showing picker
  const listRef = useRef(null);

  /* Load classes */
  useEffect(() => {
    if (!user?.uid) { setClasses([]); return undefined; }
    let alive = true;
    (async () => {
      try {
        const [mine, teaching] = await Promise.all([
          getClassesByStudent(user.uid),
          getClassesByTeacher(user.uid),
        ]);
        if (!alive) return;
        const seen = new Set();
        const all = [...mine, ...teaching].filter((c) => {
          if (!c?.id || seen.has(c.id)) return false;
          seen.add(c.id); return true;
        });
        setClasses(all);
        if (all.length && !classId) setClassId(all[0].id);
      } catch {
        if (alive) setClasses([]);
      }
    })();
    return () => { alive = false; };
  }, [user?.uid]); // eslint-disable-line

  useEffect(() => listenClassChat(classId, setMsgs), [classId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, classId]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    sendClassMessage(classId, user, t);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault(); send(e);
    }
  };

  /* ── Guards ── */
  if (!user)           return <p className="sw-empty">Đăng nhập để chat với lớp học của bạn.</p>;
  if (classes === null) return <p className="sw-empty">Đang tải lớp học…</p>;
  if (!classes.length)  return (
    <p className="sw-empty">
      Bạn chưa tham gia lớp nào —<br />
      vào mục <b>Lớp học</b> để tham gia hoặc tạo lớp nhé!
    </p>
  );

  const currentClass = classes.find((c) => c.id === classId);

  return (
    <div className="sw-root">
      {/* Class picker header */}
      <div className="sw-class-picker">
        <Svg d={ICONS.cls} size={15} />
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          aria-label="Chọn lớp"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name || 'Lớp học'}</option>
          ))}
        </select>
        {currentClass && (
          <span style={{ fontSize: '.68rem', color: 'var(--sw-ink3)', flexShrink: 0 }}>
            {currentClass.memberCount ? `${currentClass.memberCount} thành viên` : ''}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="sw-msgs grow" ref={listRef}>
        {msgs.length === 0 && (
          <p className="sw-empty">Lớp chưa chat gì —<br />mở lời đầu tiên đi! 🎉</p>
        )}
        {msgs.map((m, i) => {
          const mine = m.uid === user.uid;
          const prev = msgs[i - 1];
          const head = !prev || prev.uid !== m.uid;
          const showDay = !prev || fmtDay(prev.createdAt) !== fmtDay(m.createdAt);
          return (
            <div key={m.id || i} style={{ display: 'contents' }}>
              {showDay && <DaySep ts={m.createdAt} />}
              <div className={'sw-msg' + (mine ? ' me' : '')}>
                {!mine && head && (
                  <button
                    type="button"
                    className="sw-msg-name"
                    onClick={() => onOpenProfile(m.uid, m.name)}
                  >
                    {m.name}
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.35rem', flexDirection: mine ? 'row-reverse' : 'row' }}>
                  {!mine && head && <Avatar uid={m.uid} name={m.name} size={28} />}
                  {!mine && !head && <span style={{ width: 28, flexShrink: 0 }} />}
                  <div className="sw-bubble" style={{ position: 'relative' }}>
                    <span>{m.text}</span>
                    <small>{fmtTime(m.createdAt)}</small>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compose */}
      <form className="sw-form" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Nhắn cho cả lớp…"
          maxLength={500}
        />
        <button
          type="submit"
          className="sw-send"
          disabled={!text.trim()}
          aria-label="Gửi"
        >
          <Svg d={ICONS.send} size={15} />
        </button>
      </form>
    </div>
  );
}
