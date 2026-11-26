/* ============================================================================
   MessengerNotesBar.jsx — Thanh "Cap Messenger 24h" chuẩn Facebook Messenger × ELEC AI
   ----------------------------------------------------------------------------
   - Nằm ngay trên đầu cột Nhắn tin (và đồng bộ realtime 100% với cột Mạng xã hội)
   - Bong bóng suy nghĩ (thought cloud + 2 chấm tròn nổi) phía trên ảnh đại diện
   - Gắn linh vật Bé Elec bản quyền ELEC AI ngay trong bong bóng Cap Messenger
   - Bấm vào ô của mình → Mở khung soạn Cap Messenger 24h tức thì (optimistic 0ms)
   - Bấm vào ô bạn bè → Mở khung Trả lời nhanh thẳng vào tin nhắn DM hoặc Xem tường
   ============================================================================ */
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { openDm, sendDmMessage } from '../../lib/social.js';
import {
  NOTE_MASCOTS,
  getNoteMascotSrc,
  subscribeCommunityFeed,
  saveMessengerNote,
  saveStudyTogetherHandoff,
} from '../../lib/socialWall.js';

function getInitials(name = '') {
  const clean = String(name || '').trim();
  if (!clean) return 'E';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function NoteAvatar({ photoURL, name = '', size = 48 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [photoURL]);
  const valid = !failed && typeof photoURL === 'string' && photoURL.trim().length > 6 && !photoURL.includes('placeholder');
  return (
    <div
      className="emn-avatar"
      style={{ width: size, height: size, minWidth: size, fontSize: Math.max(13, Math.round(size * 0.36)) }}
    >
      {valid ? (
        <img src={photoURL.trim()} alt={name} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

export default function MessengerNotesBar({
  onOpenProfile,
  onOpenDm,
  onNavigateAway,
}) {
  const { user } = useAuth();
  const meUid = user?.uid || null;
  const meName = user?.displayName || 'Bạn';

  const [hub, setHub] = useState({ messengerNotes: [], mySocialProfile: {}, live: false });
  const [editingMine, setEditingMine] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [draftMascot, setDraftMascot] = useState('fighting');
  const [saving, setSaving] = useState(false);

  // Xem & Trả lời Cap của bạn khác
  const [viewingNote, setViewingNote] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!meUid) return undefined;
    return subscribeCommunityFeed(meUid, (data) => {
      setHub({
        messengerNotes: data.messengerNotes || [],
        mySocialProfile: data.mySocialProfile || {},
        live: Boolean(data.live),
      });
    });
  }, [meUid]);

  if (!meUid) return null;

  const mySp = hub.mySocialProfile || {};
  const myNoteActive =
    mySp.note24h && (!mySp.note24hAt || Date.now() - Number(mySp.note24hAt) < 24 * 3600 * 1000)
      ? mySp.note24h
      : '';
  const myNoteMascotSrc = getNoteMascotSrc(mySp.note24hMascot);

  const otherNotes = (hub.messengerNotes || []).filter((n) => n.uid !== meUid);

  const openMyEditor = () => {
    setViewingNote(null);
    setDraftNote(myNoteActive);
    setDraftMascot(mySp.note24hMascot || 'fighting');
    setEditingMine((v) => !v);
  };

  const handleSaveMyNote = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await saveMessengerNote(meUid, { note: draftNote, mascotId: draftMascot });
      setEditingMine(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClearMyNote = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveMessengerNote(meUid, { note: '', mascotId: '' });
      setDraftNote('');
      setEditingMine(false);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickReply = async (e) => {
    e.preventDefault();
    const txt = replyText.trim();
    if (!viewingNote || !txt || replying) return;
    setReplying(true);
    try {
      const { id } = await openDm(user, viewingNote.uid, viewingNote.name);
      const quote = viewingNote.note || viewingNote.liveTask || 'Cap 24h';
      await sendDmMessage(id, user, `[Trả lời Cap 24h: "${quote.slice(0, 42)}"] ${txt}`);
      setReplyText('');
      const target = viewingNote;
      setViewingNote(null);
      onOpenDm?.(id, target.uid, target.name);
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="emn-wrap" aria-label="Cap Messenger 24 giờ">
      <div className="emn-strip">
        {/* Ô CỦA CHÍNH BẠN — ĐĂNG CAP MESSENGER 24H */}
        <button
          type="button"
          className={`emn-item is-me ${editingMine ? 'is-open' : ''}`}
          onClick={openMyEditor}
          title={myNoteActive ? `Cap của bạn: ${myNoteActive}` : 'Đăng Cap Messenger 24h giống Facebook'}
        >
          <div className={`emn-bubble ${myNoteActive ? 'has-note' : 'is-empty'}`}>
            {myNoteActive && myNoteMascotSrc && (
              <img src={myNoteMascotSrc} alt="" className="emn-bubble-mascot" draggable={false} />
            )}
            <span>{myNoteActive || 'Cap 24h…'}</span>
          </div>
          <div className="emn-dots" aria-hidden="true">
            <i />
            <i />
          </div>
          <div className="emn-av-ring is-me">
            <NoteAvatar photoURL={user?.photoURL} name={meName} size={48} />
            <span className="emn-plus-badge" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </div>
          <span className="emn-name">Ghi chú của bạn</span>
        </button>

        {/* CAP MESSENGER CỦA CỘNG ĐỒNG & BẠN BÈ REAL-TIME */}
        {otherNotes.map((item) => {
          const mSrc = getNoteMascotSrc(item.mascotId);
          const bubbleText = item.note || (item.isLive ? item.liveTask : '');
          return (
            <button
              key={item.uid}
              type="button"
              className={`emn-item ${item.isLive ? 'is-live' : ''} ${viewingNote?.uid === item.uid ? 'is-open' : ''}`}
              onClick={() => {
                setEditingMine(false);
                setViewingNote((prev) => (prev?.uid === item.uid ? null : item));
                setReplyText('');
              }}
              title={`${item.name}: ${bubbleText}`}
            >
              <div className={`emn-bubble ${item.isLive && !item.note ? 'is-focus-bubble' : ''}`}>
                {mSrc ? (
                  <img src={mSrc} alt="" className="emn-bubble-mascot" draggable={false} />
                ) : item.isLive ? (
                  <img src="/img/elec/elec-fighting.png" alt="" className="emn-bubble-mascot" draggable={false} />
                ) : null}
                <span>{bubbleText}</span>
              </div>
              <div className="emn-dots" aria-hidden="true">
                <i />
                <i />
              </div>
              <div className={`emn-av-ring ${item.isLive ? 'is-live' : ''}`}>
                <NoteAvatar photoURL={item.photoURL} name={item.name} size={48} />
                {item.isLive && <span className="emn-live-dot" />}
              </div>
              <span className="emn-name">{item.name}</span>
            </button>
          );
        })}

        {/* Lời mời dễ thương kèm Bé Elec nếu chưa có bạn nào đăng cap */}
        {otherNotes.length === 0 && (
          <div className="emn-empty-hint">
            <img src="/img/elec/elec-hello.png" alt="Bé Elec" draggable={false} />
            <div>
              <b>Cap Messenger 24h</b>
              <span>Chạm vào ảnh đại diện của bạn để thả ghi chú nổi giống Facebook Messenger!</span>
            </div>
          </div>
        )}
      </div>

      {/* POPOVER SOẠN CAP MESSENGER 24H CỦA BẠN */}
      {editingMine && (
        <form className="emn-popover" onSubmit={handleSaveMyNote}>
          <div className="emn-pop-head">
            <div className="emn-pop-title">
              <img
                src={getNoteMascotSrc(draftMascot) || '/img/elec/elec-hello.png'}
                alt="Bé Elec"
                draggable={false}
              />
              <div>
                <strong>Cap Messenger 24h · ELEC AI</strong>
                <span>Hiển thị nổi trên đầu avatar trong 24 giờ cho toàn cộng đồng</span>
              </div>
            </div>
            <button type="button" className="emn-pop-x" onClick={() => setEditingMine(false)} aria-label="Đóng">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <input
            className="emn-pop-input"
            value={draftNote}
            maxLength={60}
            autoFocus
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Chia sẻ suy nghĩ ngắn (VD: Đang cày đề Hóa, ai học chung không?)…"
          />

          <div className="emn-mascot-row" role="group" aria-label="Chọn linh vật Bé Elec gắn vào Cap Messenger">
            {NOTE_MASCOTS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`emn-mascot-chip ${draftMascot === m.id ? 'is-active' : ''}`}
                onClick={() => setDraftMascot(m.id)}
                title={m.label}
              >
                <img src={m.src} alt={m.label} draggable={false} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="emn-pop-foot">
            <span className="emn-char-count">{draftNote.length}/60</span>
            <div className="emn-pop-acts">
              {myNoteActive && (
                <button type="button" className="emn-btn-ghost" onClick={handleClearMyNote} disabled={saving}>
                  Gỡ cap
                </button>
              )}
              <button type="submit" className="emn-btn-primary" disabled={saving || !draftNote.trim()}>
                {saving ? 'Đang chia sẻ…' : 'Chia sẻ 24h'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* POPOVER XEM & TRẢ LỜI CAP CỦA BẠN BÈ */}
      {viewingNote && (
        <div className="emn-popover is-view">
          <div className="emn-pop-head">
            <div className="emn-pop-title">
              <NoteAvatar photoURL={viewingNote.photoURL} name={viewingNote.name} size={34} />
              <div>
                <strong>{viewingNote.name}</strong>
                <span>{viewingNote.isLive ? 'Đang tập trung trực tiếp' : 'Cap Messenger 24h'}</span>
              </div>
            </div>
            <div className="emn-view-links">
              <button
                type="button"
                className="emn-link-pill"
                onClick={() => {
                  onOpenProfile?.(viewingNote.uid, viewingNote.name);
                  setViewingNote(null);
                }}
              >
                Xem tường
              </button>
              {viewingNote.isLive && (
                <button
                  type="button"
                  className="emn-link-pill is-study"
                  onClick={() => {
                    saveStudyTogetherHandoff({
                      partnerUid: viewingNote.uid,
                      partnerName: viewingNote.name,
                      topic: viewingNote.liveTask || 'Cùng tập trung ôn thi',
                      durationMin: 25,
                      openClassroom: true,
                    });
                    setViewingNote(null);
                    onNavigateAway?.();
                    window.location.hash = '#pomodoro';
                  }}
                >
                  Học chung
                </button>
              )}
              <button type="button" className="emn-pop-x" onClick={() => setViewingNote(null)} aria-label="Đóng">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="emn-view-quote">
            <img
              src={getNoteMascotSrc(viewingNote.mascotId) || '/img/elec/elec-fighting.png'}
              alt=""
              draggable={false}
            />
            <p>{viewingNote.note || viewingNote.liveTask}</p>
          </div>

          <form className="emn-reply-form" onSubmit={handleQuickReply}>
            <input
              className="emn-pop-input"
              value={replyText}
              maxLength={240}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Trả lời cap của ${viewingNote.name}…`}
            />
            <button type="submit" className="emn-btn-primary" disabled={replying || !replyText.trim()}>
              {replying ? '…' : 'Gửi'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
