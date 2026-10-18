/* ============================================================
   DmPanel.jsx — Apple-style private messaging
   Features: friend list, search, DM threads, friend requests,
             coloured avatars, day separators, unread badges
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import {
  listenMyDms, listenDmMessages, listenFriends, listenFriendRequests,
  openDm, sendDmMessage, acceptFriendRequest, declineFriendRequest,
  findUsersByName, dmId, MAX_DM_CONVERSATIONS,
} from '../../lib/social.js';
import './social.css';

/* ── Micro SVG ── */
const Svg = ({ d, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  back:   'M15 18l-6-6 6-6',
  send:   'M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z',
  search: 'M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.2-4.2',
  check:  'M5 12.5l4.5 4.5L19 7.5',
  x:      'M6 6l12 12M18 6L6 18',
  chat:   'M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-4.9A8.5 8.5 0 1 1 21 11.5z',
  user:   'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  people: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
};

const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const fmtDay  = (t) => {
  const d = new Date(t); const n = new Date();
  if (d.toDateString() === n.toDateString()) return 'Hôm nay';
  const y = new Date(); y.setDate(n.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN');
};

/* Colour from uid */
const GRAD = [
  ['#007aff','#5856d6'], ['#34c759','#30d158'],
  ['#ff9f0a','#ff6b00'], ['#ff375f','#ff2d55'],
  ['#5856d6','#af52de'], ['#32ade6','#007aff'],
  ['#ff6b00','#ff9f0a'], ['#af52de','#5856d6'],
];
const avatarGrad = (uid = '') => GRAD[(uid.charCodeAt(0) || 0) % GRAD.length];

function Avatar({ uid, name, size = 32, vip = false }) {
  const [c1, c2] = avatarGrad(uid);
  const letter = (name?.[0] || '?').toUpperCase();
  return (
    <span
      className={'sw-avatar sm' + (vip ? ' vip' : '')}
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg,${c1},${c2})`,
        fontSize: size * .38,
        flexShrink: 0,
      }}
      title={name}
    >
      <span>{letter}</span>
    </span>
  );
}

/* ── Conversation list + friend list + requests ── */
function DmList({ me, dms, friends, requests, unreadMap, onOpenThread, onOpenProfile, onAccept, onDecline }) {
  const [search, setSearch]     = useState('');
  const [results, setResults]   = useState(null);
  const [searching, setSearching] = useState(false);

  const doSearch = async (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) { setResults(null); return; }
    setSearching(true);
    const r = await findUsersByName(q);
    setResults(r.filter((x) => x.uid !== me.uid));
    setSearching(false);
  };

  return (
    <div className="sw-col">
      {/* Search */}
      <form className="sw-search" onSubmit={doSearch}>
        <Svg d={ICONS.search} size={14} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm bạn qua tên…"
          maxLength={40}
        />
        {searching && <span style={{ fontSize: '.68rem', color: 'var(--sw-ink3)' }}>…</span>}
      </form>

      {/* Friend requests */}
      {requests.length > 0 && (
        <div className="sw-group">
          <div className="sw-group-label">Lời mời kết bạn ({requests.length})</div>
          {requests.map((r) => (
            <div key={r.uid} className="sw-person">
              <Avatar uid={r.uid} name={r.name} size={32} />
              <b className="sw-person-name">{r.name || 'Học sinh'}</b>
              <span className="sw-person-actions">
                <button type="button" className="sw-mini ok" onClick={() => onAccept(r)} title="Chấp nhận">
                  <Svg d={ICONS.check} size={13} />
                </button>
                <button type="button" className="sw-mini" onClick={() => onDecline(r.uid)} title="Từ chối">
                  <Svg d={ICONS.x} size={13} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search results */}
      {results && (
        <div className="sw-group">
          <div className="sw-group-label">Kết quả tìm kiếm</div>
          {results.length === 0 && <p className="sw-empty">Không tìm thấy ai tên này.</p>}
          {results.map((r) => (
            <button
              key={r.uid}
              type="button"
              className="sw-person"
              style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 14 }}
              onClick={() => { setResults(null); setSearch(''); onOpenProfile(r.uid, r.name); }}
            >
              <Avatar uid={r.uid} name={r.name} size={32} vip={r.tier === 'vip'} />
              <b className="sw-person-name">{r.name}</b>
              {r.tier === 'vip' && <span className="sw-vip-chip">VIP</span>}
            </button>
          ))}
        </div>
      )}

      {/* Conversations */}
      <div className="sw-group">
        <div className="sw-group-label">
          Tin nhắn ({dms.length}/{MAX_DM_CONVERSATIONS})
        </div>
        {dms.length === 0 && (
          <p className="sw-empty">Chưa có hội thoại nào.<br />Kết bạn rồi nhắn tin nhé!</p>
        )}
        {dms.map((d) => {
          const otherUid  = (d.members || []).find((x) => x !== me.uid) || '';
          const otherName = d.names?.[otherUid] || 'Bạn học';
          const unread    = !!unreadMap?.[d.id];
          return (
            <button
              key={d.id}
              type="button"
              className={'sw-dm-row' + (unread ? ' unread' : '')}
              onClick={() => onOpenThread(d.id, otherUid, otherName)}
            >
              <Avatar uid={otherUid} name={otherName} size={38} />
              <span className="sw-dm-info">
                <b>{otherName}</b>
                <small>{d.lastText || 'Chưa có tin nhắn'}</small>
              </span>
              {unread && <span className="sw-unread-dot" aria-label="Chưa đọc" />}
              {d.lastAt && <small className="sw-dm-time">{fmtDay(d.lastAt)}</small>}
            </button>
          );
        })}
      </div>

      {/* Friends */}
      <div className="sw-group">
        <div className="sw-group-label">Bạn bè ({friends.length})</div>
        {friends.length === 0 && (
          <p className="sw-empty">
            Chưa có bạn bè —<br />
            tìm bằng tên ở trên hoặc bấm tên ai đó trong chat cộng đồng.
          </p>
        )}
        {friends.map((f) => (
          <div key={f.uid} className="sw-person">
            <button type="button" className="sw-person-btn" onClick={() => onOpenProfile(f.uid, f.name)}>
              <Avatar uid={f.uid} name={f.name} size={32} />
              <b className="sw-person-name">{f.name || 'Học sinh'}</b>
            </button>
            <span className="sw-person-actions">
              <button
                type="button"
                className="sw-mini primary"
                onClick={() => onOpenThread(dmId(me.uid, f.uid), f.uid, f.name || '')}
                title="Nhắn tin"
              >
                <Svg d={ICONS.chat} size={13} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── DM Thread (1-1 conversation) ── */
function DmThread({ me, thread, onBack, onOpenProfile }) {
  const [msgs, setMsgs]   = useState([]);
  const [text, setText]   = useState('');
  const listRef           = useRef(null);

  useEffect(() => listenDmMessages(thread.dmId, setMsgs), [thread.dmId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, thread.dmId]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    sendDmMessage(thread.dmId, me, t);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault(); send(e);
    }
  };

  return (
    <div className="sw-col">
      {/* Thread header */}
      <div className="sw-thread-head">
        <button type="button" className="sw-back" onClick={onBack} aria-label="Quay lại">
          <Svg d={ICONS.back} size={16} />
        </button>
        <button
          type="button"
          className="sw-thread-name"
          onClick={() => onOpenProfile(thread.peerUid, thread.peerName)}
        >
          <Avatar uid={thread.peerUid} name={thread.peerName} size={30} />
          <b>{thread.peerName || 'Bạn học'}</b>
        </button>
        {/* Online indicator placeholder */}
        <span style={{ marginLeft: 'auto', fontSize: '.68rem', color: 'var(--sw-ink3)' }}>
          Tin nhắn riêng
        </span>
      </div>

      {/* Messages */}
      <div className="sw-msgs" ref={listRef}>
        {msgs.length === 0 && (
          <p className="sw-empty">Chưa có tin nhắn —<br />nhắn trước đi! 👋</p>
        )}
        {msgs.map((m, i) => {
          const mine    = m.uid === me.uid;
          const prev    = msgs[i - 1];
          const head    = !prev || prev.uid !== m.uid;
          const showDay = !prev || fmtDay(prev.createdAt) !== fmtDay(m.createdAt);
          return (
            <div key={m.id || i} style={{ display: 'contents' }}>
              {showDay && <div className="sw-day">{fmtDay(m.createdAt)}</div>}
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
                <div style={{
                  display: 'flex', alignItems: 'flex-end', gap: '.35rem',
                  flexDirection: mine ? 'row-reverse' : 'row',
                }}>
                  {!mine && head && <Avatar uid={m.uid} name={m.name} size={26} />}
                  {!mine && !head && <span style={{ width: 26, flexShrink: 0 }} />}
                  <div className="sw-bubble">
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
          placeholder={`Nhắn ${thread.peerName || 'bạn'}…`}
          maxLength={500}
          autoFocus
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

/* ── Main panel ── */
export default function DmPanel({ me, thread, setThread, onOpenProfile, unreadMap }) {
  const [dms, setDms]         = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [err, setErr]         = useState('');

  useEffect(() => listenMyDms(me.uid, setDms), [me.uid]);
  useEffect(() => listenFriends(me.uid, setFriends), [me.uid]);
  useEffect(() => listenFriendRequests(me.uid, setRequests), [me.uid]);

  useEffect(() => {
    if (!err) return undefined;
    const t = setTimeout(() => setErr(''), 3500);
    return () => clearTimeout(t);
  }, [err]);

  const openThread = async (id, peerUid, peerName) => {
    try {
      await openDm(me, peerUid, peerName);
      setThread({ dmId: id, peerUid, peerName: peerName || '' });
      setErr('');
    } catch (e) {
      setErr(e.message || 'Lỗi mở hội thoại');
    }
  };

  return (
    <div className="sw-root">
      {err && <p className="sw-error">{err}</p>}
      {thread ? (
        <DmThread
          me={me}
          thread={thread}
          onBack={() => setThread(null)}
          onOpenProfile={onOpenProfile}
        />
      ) : (
        <DmList
          me={me}
          dms={dms}
          friends={friends}
          requests={requests}
          unreadMap={unreadMap}
          onOpenThread={openThread}
          onOpenProfile={onOpenProfile}
          onAccept={(r) => acceptFriendRequest(me, r)}
          onDecline={(uid) => declineFriendRequest(me, uid)}
        />
      )}
    </div>
  );
}
