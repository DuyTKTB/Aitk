/* ============================================================
   ClassChat.jsx — Apple-style Class Community Chat
   Firestore: classes/{classId}/chat  (realtime onSnapshot)
   Features: class picker, avatars, emoji reactions, timestamps
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import { db } from '../../lib/firebase.js';
import { doc, onSnapshot, addDoc, collection } from 'firebase/firestore';
import {
  getClassStreakStatus,
  canNudgeClassMember,
  recordClassMemberNudge,
  fireStreakConfetti,
  getVietnamDateKey,
} from '../../lib/chatStreak.js';
import { useToast } from '../../ui/index.jsx';
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
  const [liveClassDoc, setLiveClassDoc] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const listRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (!classId) return undefined;
    return onSnapshot(doc(db, 'classes', classId), (snap) => {
      if (snap.exists()) setLiveClassDoc({ id: snap.id, ...snap.data() });
    });
  }, [classId]);

  /* Confetti khi lớp đạt mốc chuỗi */
  useEffect(() => {
    if (!msgs.length) return;
    const latest = msgs[msgs.length - 1];
    if (latest?.isMilestone && Date.now() - (latest.createdAt || 0) < 15000) {
      fireStreakConfetti();
    }
  }, [msgs]);

  /* Cảnh báo khi còn < 3 giờ mà chưa đủ chuỗi lớp */
  useEffect(() => {
    if (!liveClassDoc?.id || !user?.uid) return;
    const st = getClassStreakStatus(liveClassDoc, user.uid);
    const today = getVietnamDateKey();
    const warnKey = `cs_class_urgent_warn_${liveClassDoc.id}_${today}`;
    if (st.urgent && !st.completedToday) {
      try {
        if (!localStorage.getItem(warnKey)) {
          localStorage.setItem(warnKey, '1');
          sendClassMessage(
            liveClassDoc.id,
            { uid: 'system', displayName: 'Hệ thống' },
            `⏳ Lớp chỉ còn ${st.remainingTimeStr} để giữ chuỗi! Còn thiếu ${st.remainingNeeded} bạn nữa, cùng nhau cố lên nhé! 🔥`
          );
        }
      } catch { /* ignore */ }
    }
  }, [liveClassDoc?.id, liveClassDoc?.streak?.lastDate]);

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
  const targetClass = liveClassDoc || currentClass;
  const streakStatus = getClassStreakStatus(targetClass, user?.uid);
  const allMembers = Array.isArray(targetClass?.members) ? targetClass.members : [];
  const pendingMembers = allMembers.filter(
    (m) => m?.id && m.id !== user?.uid && !streakStatus.activeMembers.includes(m.id)
  );

  const handleNudgeMember = async (member) => {
    if (!canNudgeClassMember(member.id, classId)) return;
    recordClassMemberNudge(member.id, classId);
    try {
      await sendClassMessage(
        classId,
        user,
        `@${member.name || 'bạn'} ơi, vào chat hoặc làm bài để cùng lớp giữ chuỗi hôm nay nhé! 🔥`
      );
      toast(`Đã gửi lời nhắc giữ chuỗi tới ${member.name}`);
    } catch {
      toast('Không gửi được lời nhắc');
    }
  };

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
        {targetClass && (
          <span style={{ fontSize: '.68rem', color: 'var(--sw-ink3)', flexShrink: 0 }}>
            {targetClass.memberCount ? `${targetClass.memberCount} thành viên` : ''}
          </span>
        )}
      </div>

      {/* Pinned Class Streak Card */}
      {targetClass && (
        <div className="sw-class-pinned">
          <div
            className="sw-class-pinned-head"
            onClick={() => setCollapsed((c) => !c)}
            role="button"
            tabIndex={0}
            aria-expanded={!collapsed}
          >
            <div className="sw-class-pinned-title">
              <span>🔥 Chuỗi {streakStatus.count} ngày</span>
              {streakStatus.record > streakStatus.count && (
                <small style={{ color: 'var(--sw-ink3)', fontWeight: 500 }}>(Kỷ lục: {streakStatus.record})</small>
              )}
              <span style={{ fontSize: '.7rem', color: 'var(--sw-ink2)' }}>
                · Hôm nay: {streakStatus.activeCount}/{streakStatus.target} bạn
              </span>
            </div>
            <button
              type="button"
              className="sw-class-toggle-btn"
              aria-label={collapsed ? 'Mở rộng thẻ chuỗi' : 'Thu gọn thẻ chuỗi'}
            >
              <Svg d={collapsed ? ICONS.chevron : 'M18 15l-6-6-6 6'} size={14} />
            </button>
          </div>

          {!collapsed && (
            <div className="sw-class-pinned-body">
              {/* Progress Bar */}
              <div className="sw-class-progress-wrap">
                <div className="sw-class-progress-labels">
                  <span>
                    {streakStatus.completedToday
                      ? '🎉 Đã đạt mục tiêu giữ chuỗi hôm nay!'
                      : `Cần thêm ${streakStatus.remainingNeeded} bạn tham gia`}
                  </span>
                  {streakStatus.urgent && !streakStatus.completedToday && (
                    <span className="sw-streak-urgent">⏳ Còn {streakStatus.remainingTimeStr}</span>
                  )}
                </div>
                <div className="sw-class-progress-bar">
                  <div
                    className={`sw-class-progress-fill ${streakStatus.completedToday ? 'done' : ''}`}
                    style={{
                      width: `${Math.min(100, Math.round((streakStatus.activeCount / streakStatus.target) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Pending Members */}
              {pendingMembers.length > 0 && !streakStatus.completedToday && (
                <div className="sw-class-members-list">
                  <div style={{ fontSize: '.66rem', color: 'var(--sw-ink3)', fontWeight: 600 }}>
                    Chưa tham gia hôm nay ({pendingMembers.length}):
                  </div>
                  {pendingMembers.slice(0, 6).map((m) => {
                    const canNudge = canNudgeClassMember(m.id, classId);
                    return (
                      <div key={m.id} className="sw-class-member-item">
                        <span className="sw-class-member-name">{m.name || 'Thành viên'}</span>
                        <button
                          type="button"
                          className="sw-class-mini-nudge"
                          disabled={!canNudge}
                          onClick={() => handleNudgeMember(m)}
                          title={canNudge ? 'Nhắc bạn này tham gia giữ chuỗi' : 'Đã nhắc hôm nay'}
                        >
                          {canNudge ? 'Nhắc' : 'Đã nhắc'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="sw-class-pinned-footer">
                <span style={{ fontSize: '.68rem', color: 'var(--sw-ink3)' }}>
                  {streakStatus.iAmActive ? '✓ Bạn đã tính điểm hôm nay' : '• Nhắn tin để tính điểm chuỗi'}
                </span>
                <a href="#leaderboard" className="sw-class-leaderboard-link">
                  🏆 BXH Chuỗi →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="sw-msgs grow" ref={listRef}>
        {msgs.length === 0 && (
          <p className="sw-empty">Lớp chưa chat gì —<br />mở lời đầu tiên đi! 🎉</p>
        )}
        {msgs.map((m, i) => {
          if (m.isSystem || m.uid === 'system') {
            return (
              <div key={m.id || i} className="sw-class-sys-msg">
                {m.text}
              </div>
            );
          }
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
