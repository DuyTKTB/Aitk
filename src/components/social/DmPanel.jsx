/* ============================================================
   DmPanel.jsx — Nhắn tin 1:1 ELEC Messenger (Realtime · 100% SVG)
   ------------------------------------------------------------
   - Avatar ảnh thật Firestore/Google + Monogram ELEC chuẩn
   - Header 1 dòng gọn gàng (không cắt/xuống dòng tên), kèm nút Học chung
   - Bong bóng gom nhóm chuẩn Messenger × TikTok (không lặp tên ở chat 1:1)
   - Hiển thị thẻ tương tác đẹp mắt cho lời mời [HỌC CHUNG ELEC],
     trả lời [Trả lời Cap 24h] và Sticker linh vật Bé Elec độc quyền!
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import { db } from '../../lib/firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  getFriendStreakStatus,
  canNudgeFriend,
  recordFriendNudge,
} from '../../lib/chatStreak.js';
import { useToast } from '../../ui/index.jsx';
import {
  listenMyDms,
  listenDmMessages,
  listenFriends,
  listenFriendRequests,
  openDm,
  sendDmMessage,
  acceptFriendRequest,
  declineFriendRequest,
  findUsersByName,
  dmId,
  MAX_DM_CONVERSATIONS,
} from '../../lib/social.js';
import { saveStudyTogetherHandoff } from '../../lib/socialWall.js';
import StudentAvatar from '../StudentAvatar.jsx';
import './social.css';

/* ── Sticker Bé Elec độc quyền trong DM ── */
const DM_STICKERS = {
  elec_love:        { label: 'Thả tim',   src: '/img/elec/elec-love.png' },
  elec_hello:       { label: 'Chào bạn',  src: '/img/elec/elec-hello.png' },
  elec_fighting:    { label: 'Cố lên',    src: '/img/elec/elec-fighting.png' },
  elec_cool:        { label: 'Quá ngầu',  src: '/img/elec/elec-cool.png' },
  elec_happy:       { label: 'Vui quá',   src: '/img/elec/elec-happy.png' },
  elec_celebrate:   { label: 'Ăn mừng',   src: '/img/elec/elec-celebrate.png' },
  elec_think:       { label: 'Suy nghĩ',  src: '/img/elec/elec-think.png' },
  elec_super_saiyan:{ label: 'Bứt phá',   src: '/img/elec/elec-super-saiyan.png' },
};

/* ── Micro SVG (100% Vector, ZERO Emoji) ── */
const Svg = ({ d, size = 18, sw = 1.9, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke={filled ? 'none' : 'currentColor'}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0, display: 'inline-block' }}
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  back:   'M15 18l-6-6 6-6',
  send:   'M12 19V5M5 12l7-7 7 7',
  search: 'M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.2-4.2',
  check:  'M5 12.5l4.5 4.5L19 7.5',
  x:      'M6 6l12 12M18 6L6 18',
  chat:   'M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-4.9A8.5 8.5 0 1 1 21 11.5z',
  user:   'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  users:  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a3.5 3.5 0 0 1 0 6.75',
  flame:  'M12 2.5c1.6 3.2 5.5 4.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3 1.8-5.1 3.2-7.2.2 2 1.2 3 2.3 3.2-.2-2-.1-3.9 0-6z',
  clock:  'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-14v4l3 2',
  play:   'M7 5.2v13.6a1 1 0 0 0 1.52.85l10.6-6.8a1 1 0 0 0 0-1.7L8.52 4.35A1 1 0 0 0 7 5.2z',
  smile:  'M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19zM8.5 14.5c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2',
};

const fmtTime = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const fmtDay = (t) => {
  const d = new Date(t);
  const n = new Date();
  if (d.toDateString() === n.toDateString()) return 'Hôm nay';
  const y = new Date();
  y.setDate(n.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN');
};

/* Phân tích tin nhắn đặc biệt (Học chung / Trả lời Cap 24h / Sticker Bé Elec) */
function parseSpecialDm(text = '') {
  const raw = String(text || '').trim();
  // 1. Sticker Bé Elec đơn lẻ
  if (/^:[a-z0-9_]+:$/.test(raw)) {
    const key = raw.slice(1, -1);
    if (DM_STICKERS[key]) return { type: 'sticker', sticker: DM_STICKERS[key] };
  }
  // 2. Thẻ mời Học chung ELEC
  if (raw.startsWith('[HỌC CHUNG ELEC]')) {
    const minsMatch = raw.match(/(\d+)\s*phút/i);
    const topicMatch = raw.match(/Chủ đề:\s*"([^"]+)"/i) || raw.match(/·\s*([^.)]+)/);
    return {
      type: 'study_invite',
      durationMin: minsMatch ? Number(minsMatch[1]) : 25,
      topic: topicMatch ? topicMatch[1].trim() : 'Cùng tập trung ôn thi',
      raw,
    };
  }
  // 3. Trả lời Cap Messenger 24h
  const capMatch = raw.match(/^\[Trả lời Cap 24h:\s*"([^"]+)"\]\s*(.*)$/s);
  if (capMatch) {
    return {
      type: 'cap_reply',
      quote: capMatch[1].trim(),
      body: capMatch[2].trim(),
    };
  }
  return { type: 'text', text: raw };
}

function formatPreviewText(raw = '') {
  const parsed = parseSpecialDm(raw);
  if (parsed.type === 'sticker') return `Sticker · ${parsed.sticker.label}`;
  if (parsed.type === 'study_invite') return `Lời mời Học chung · ${parsed.durationMin} phút`;
  if (parsed.type === 'cap_reply') return `Trả lời Cap: ${parsed.body || parsed.quote}`;
  return raw || 'Chưa có tin nhắn';
}

/* ── Conversation list + friend list + requests ── */
function DmList({ me, dms, friends, requests, unreadMap, onOpenThread, onOpenProfile, onAccept, onDecline }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const doSearch = async (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) {
      setResults(null);
      return;
    }
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
          placeholder="Tìm bạn học theo tên hoặc email…"
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
              <StudentAvatar uid={r.uid} name={r.name} size={36} />
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
              className="sw-person clickable"
              onClick={() => {
                setResults(null);
                setSearch('');
                onOpenProfile(r.uid, r.name);
              }}
            >
              <StudentAvatar uid={r.uid} name={r.name} photoURL={r.photoURL} size={36} />
              <b className="sw-person-name">{r.name}</b>
              {r.tier === 'vip' && <span className="sw-vip-chip">VIP</span>}
            </button>
          ))}
        </div>
      )}

      {/* Conversations */}
      <div className="sw-group">
        <div className="sw-group-label">
          Đoạn chat ({dms.length}/{MAX_DM_CONVERSATIONS})
        </div>
        {dms.length === 0 && (
          <p className="sw-empty">Chưa có hội thoại nào.<br />Kết bạn hoặc bấm Nhắn tin trên bảng tin nhé!</p>
        )}
        {dms.map((d) => {
          const otherUid = (d.members || []).find((x) => x !== me.uid) || '';
          const otherName = d.names?.[otherUid] || 'Bạn học';
          const unread = !!unreadMap?.[d.id];
          const st = getFriendStreakStatus(d.streak, me.uid, otherUid, otherName);
          return (
            <button
              key={d.id}
              type="button"
              className={'sw-dm-row' + (unread ? ' unread' : '')}
              onClick={() => onOpenThread(d.id, otherUid, otherName)}
            >
              <StudentAvatar uid={otherUid} name={otherName} size={42} />
              <span className="sw-dm-info">
                <span className="sw-dm-name-row">
                  <b>{otherName}</b>
                  {st.count >= 1 && (
                    <span className="sw-streak-pill is-mini">
                      <Svg d={ICONS.flame} size={10} filled />
                      <span>{st.count}</span>
                    </span>
                  )}
                  {st.urgent && !st.bothDone && (
                    <span title="Chuỗi sắp hết hạn (< 3h)" className="sw-urgent-ico">
                      <Svg d={ICONS.clock} size={11} sw={2} />
                    </span>
                  )}
                </span>
                <small>{formatPreviewText(d.lastText)}</small>
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
            tìm bằng tên ở trên hoặc bấm vào tên bạn học bên bảng tin.
          </p>
        )}
        {friends.map((f) => (
          <div key={f.uid} className="sw-person">
            <button type="button" className="sw-person-btn" onClick={() => onOpenProfile(f.uid, f.name)}>
              <StudentAvatar uid={f.uid} name={f.name} size={36} />
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

/* ── DM Thread (1-1 conversation — ELEC Messenger Pro) ── */
function DmThread({ me, thread, onBack, onOpenProfile, onNavigateAway }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [dmMeta, setDmMeta] = useState(null);
  const [peerDoc, setPeerDoc] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [nudgeAllowed, setNudgeAllowed] = useState(() => canNudgeFriend(thread.peerUid));
  const listRef = useRef(null);
  const toast = useToast();

  useEffect(() => listenDmMessages(thread.dmId, setMsgs), [thread.dmId]);

  useEffect(() => {
    if (!thread.dmId) return undefined;
    return onSnapshot(doc(db, 'dms', thread.dmId), (snap) => {
      if (snap.exists()) setDmMeta(snap.data());
    });
  }, [thread.dmId]);

  /* Lắng nghe thời gian thực hồ sơ bạn chat (lấy ảnh đại diện thật + tên đầy đủ + trạng thái Đang tập trung) */
  useEffect(() => {
    if (!thread.peerUid) return undefined;
    return onSnapshot(
      doc(db, 'users', thread.peerUid),
      (snap) => {
        setPeerDoc(snap.exists() ? snap.data() || {} : null);
      },
      () => {}
    );
  }, [thread.peerUid]);

  useEffect(() => {
    setNudgeAllowed(canNudgeFriend(thread.peerUid));
  }, [thread.peerUid]);

  const peerName = peerDoc?.displayName || peerDoc?.name || thread.peerName || 'Bạn học';
  const peerPhoto = peerDoc?.photoURL || null;
  const isPeerFocusing = Boolean(
    peerDoc?.focusLive?.lastPingAt && Date.now() - Number(peerDoc.focusLive.lastPingAt) < 5 * 60 * 1000
  );
  const peerFocusTask = peerDoc?.focusLive?.task || 'Đang tập trung';

  const streakStatus = getFriendStreakStatus(dmMeta?.streak, me.uid, thread.peerUid, peerName);

  const handleNudgeFriend = async () => {
    if (!canNudgeFriend(thread.peerUid)) return;
    recordFriendNudge(thread.peerUid);
    setNudgeAllowed(false);
    const nudgeMsg = `${peerName} ơi, vào nhắn tin để cùng giữ chuỗi học tập hôm nay nhé! Còn ${streakStatus.remainingTimeStr} nữa thôi!`;
    try {
      await sendDmMessage(thread.dmId, me, nudgeMsg);
      toast(`Đã gửi lời nhắc giữ chuỗi tới ${peerName}`);
    } catch {
      toast('Không gửi được lời nhắc');
    }
  };

  const handleInviteStudy = async () => {
    const topic = isPeerFocusing ? peerFocusTask : 'Cùng tập trung ôn thi';
    try {
      await sendDmMessage(
        thread.dmId,
        me,
        `[HỌC CHUNG ELEC] Mời ${peerName} học chung 25 phút — Chủ đề: "${topic}". Vào Phòng Tập Trung (#pomodoro) cùng mình nhé!`
      );
    } catch { /* ignore */ }
    saveStudyTogetherHandoff({
      partnerUid: thread.peerUid,
      partnerName: peerName,
      topic,
      durationMin: 25,
      openClassroom: true,
    });
    onNavigateAway?.();
    window.location.hash = '#pomodoro';
  };

  const handleJoinStudyCard = (invite) => {
    saveStudyTogetherHandoff({
      partnerUid: thread.peerUid,
      partnerName: peerName,
      topic: invite.topic || 'Cùng tập trung ôn thi',
      durationMin: invite.durationMin || 25,
      openClassroom: true,
    });
    onNavigateAway?.();
    window.location.hash = '#pomodoro';
  };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, thread.dmId]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    setShowStickers(false);
    sendDmMessage(thread.dmId, me, t);
  };

  const sendSticker = (key) => {
    setShowStickers(false);
    sendDmMessage(thread.dmId, me, `:${key}:`);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(e);
    }
  };

  /* Gỡ emoji lửa khỏi text chuỗi để giữ 100% Vector SVG sắc nét */
  const cleanStreakText = String(streakStatus.statusText || '').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim();

  return (
    <div className="sw-col sw-dm-thread-root">
      {/* Header 1 dòng gọn gàng chuẩn Messenger */}
      <div className="sw-thread-head">
        <button type="button" className="sw-back" onClick={onBack} aria-label="Quay lại">
          <Svg d={ICONS.back} size={17} sw={2.2} />
        </button>

        <button
          type="button"
          className="sw-thread-peer"
          onClick={() => onOpenProfile(thread.peerUid, peerName)}
          title={`Xem trang cá nhân của ${peerName}`}
        >
          <div className="sw-peer-av-wrap">
            <StudentAvatar uid={thread.peerUid} name={peerName} photoURL={peerPhoto} size={36} />
            {isPeerFocusing && <span className="sw-peer-live-dot" />}
          </div>
          <div className="sw-peer-meta">
            <b>{peerName}</b>
            <span className={isPeerFocusing ? 'is-live' : ''}>
              {isPeerFocusing ? `Đang học · ${peerFocusTask}` : 'Nhắn tin riêng · ELEC AI'}
            </span>
          </div>
        </button>

        <div className="sw-thread-actions">
          <button
            type="button"
            className="sw-head-pill-btn is-study"
            onClick={handleInviteStudy}
            title={`Mời ${peerName} vào Học chung (#pomodoro)`}
          >
            <Svg d={ICONS.users} size={14} />
            <span>Học chung</span>
          </button>
        </div>
      </div>

      {/* Thanh Chuỗi bạn bè gọn 1 dòng (100% Vector SVG) */}
      <div className="sw-friend-streak-bar">
        <div className="sw-streak-info">
          <span className="sw-streak-pill" title={`Kỷ lục chuỗi của 2 bạn: ${streakStatus.record} ngày`}>
            <Svg d={ICONS.flame} size={11} filled />
            <span>{streakStatus.count} ngày</span>
          </span>
          <span className="sw-streak-text" title={cleanStreakText}>
            {cleanStreakText}
          </span>
        </div>
        {streakStatus.urgent && (
          <span className="sw-streak-urgent" title="Sắp kết thúc ngày (UTC+7)">
            <Svg d={ICONS.clock} size={11} sw={2} />
            <span>{streakStatus.remainingTimeStr}</span>
          </span>
        )}
        {nudgeAllowed && !streakStatus.peerDone && (
          <button type="button" className="sw-nudge-btn" onClick={handleNudgeFriend}>
            Nhắc bạn
          </button>
        )}
      </div>

      {/* Luồng tin nhắn 1:1 chuẩn Messenger */}
      <div className="sw-msgs" ref={listRef}>
        {msgs.length === 0 && (
          <div className="sw-dm-empty-hero">
            <StudentAvatar uid={thread.peerUid} name={peerName} photoURL={peerPhoto} size={58} />
            <b>{peerName}</b>
            <span>Gửi lời chào hoặc một Sticker Bé Elec để bắt đầu trò chuyện nhé!</span>
          </div>
        )}
        {msgs.map((m, i) => {
          const mine = m.uid === me.uid;
          const prev = msgs[i - 1];
          const next = msgs[i + 1];
          const samePrev = prev && prev.uid === m.uid && fmtDay(prev.createdAt) === fmtDay(m.createdAt);
          const sameNext = next && next.uid === m.uid && fmtDay(next.createdAt) === fmtDay(m.createdAt);
          const showDay = !prev || fmtDay(prev.createdAt) !== fmtDay(m.createdAt);
          const showAvatar = !mine && !sameNext;
          const posClass = !samePrev && !sameNext ? 'is-solo' : !samePrev ? 'is-first' : !sameNext ? 'is-last' : 'is-mid';

          const parsed = parseSpecialDm(m.text);

          return (
            <div key={m.id || i} style={{ display: 'contents' }}>
              {showDay && <div className="sw-day">{fmtDay(m.createdAt)}</div>}
              <div className={`sw-msg ${mine ? 'me' : 'other'} ${posClass}`}>
                <div className="sw-msg-line">
                  {!mine && (
                    showAvatar ? (
                      <button
                        type="button"
                        className="sw-msg-av-btn"
                        onClick={() => onOpenProfile(thread.peerUid, peerName)}
                        title={peerName}
                      >
                        <StudentAvatar uid={thread.peerUid} name={peerName} photoURL={peerPhoto} size={28} />
                      </button>
                    ) : (
                      <span className="sw-msg-av-spacer" />
                    )
                  )}

                  {parsed.type === 'sticker' ? (
                    <div className="sw-dm-sticker-wrap" title={`Sticker ELEC AI · ${parsed.sticker.label}`}>
                      <img src={parsed.sticker.src} alt={parsed.sticker.label} className="sw-dm-sticker" draggable={false} />
                      <span className="sw-sticker-time">{fmtTime(m.createdAt)}</span>
                    </div>
                  ) : parsed.type === 'study_invite' ? (
                    <div className={`sw-dm-study-card ${mine ? 'is-me' : ''}`}>
                      <div className="sw-dm-study-top">
                        <img src="/img/elec/elec-fighting.png" alt="Bé Elec" draggable={false} />
                        <div className="sw-dm-study-info">
                          <span className="sw-dm-study-kicker">
                            <Svg d={ICONS.users} size={11} />
                            <span>HỌC CHUNG ELEC · {parsed.durationMin} PHÚT</span>
                          </span>
                          <strong>{parsed.topic}</strong>
                        </div>
                      </div>
                      <div className="sw-dm-study-foot">
                        <button
                          type="button"
                          className="sw-dm-study-btn"
                          onClick={() => handleJoinStudyCard(parsed)}
                        >
                          <Svg d={ICONS.play} size={11} filled />
                          <span>Vào phòng học chung</span>
                        </button>
                        <small>{fmtTime(m.createdAt)}</small>
                      </div>
                    </div>
                  ) : parsed.type === 'cap_reply' ? (
                    <div className="sw-cap-reply-wrap">
                      <div className="sw-cap-quote">
                        <span>Trả lời Cap 24h: “{parsed.quote}”</span>
                      </div>
                      <div className="sw-bubble">
                        <span>{parsed.body}</span>
                        <small>{fmtTime(m.createdAt)}</small>
                      </div>
                    </div>
                  ) : (
                    <div className="sw-bubble">
                      <span>{parsed.text}</span>
                      <small>{fmtTime(m.createdAt)}</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Khay chọn nhanh Sticker Bé Elec */}
      {showStickers && (
        <div className="sw-dm-sticker-tray">
          {Object.entries(DM_STICKERS).map(([k, st]) => (
            <button
              key={k}
              type="button"
              className="sw-dm-st-opt"
              onClick={() => sendSticker(k)}
              title={`Gửi sticker ${st.label}`}
            >
              <img src={st.src} alt={st.label} draggable={false} />
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Composer chuẩn ELEC Messenger */}
      <form className="sw-form" onSubmit={send}>
        <button
          type="button"
          className={`sw-st-toggle ${showStickers ? 'is-active' : ''}`}
          onClick={() => setShowStickers((s) => !s)}
          title="Sticker Bé Elec"
          aria-label="Sticker Bé Elec"
        >
          <Svg d={ICONS.smile} size={19} />
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={`Nhắn tin tới ${peerName}…`}
          maxLength={500}
          autoFocus
        />

        {text.trim() ? (
          <button type="submit" className="sw-send" aria-label="Gửi">
            <Svg d={ICONS.send} size={16} sw={2.4} />
          </button>
        ) : (
          <button
            type="button"
            className="sw-quick-elec"
            onClick={() => sendSticker('elec_love')}
            title="Gửi nhanh Sticker Bé Elec Thả tim"
            aria-label="Gửi nhanh Sticker Bé Elec Thả tim"
          >
            <img src="/img/elec/elec-love.png" alt="Thả tim" draggable={false} />
          </button>
        )}
      </form>
    </div>
  );
}

/* ── Main panel ── */
export default function DmPanel({ me, thread, setThread, onOpenProfile, unreadMap, onNavigateAway }) {
  const [dms, setDms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [err, setErr] = useState('');

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
          onNavigateAway={onNavigateAway}
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
