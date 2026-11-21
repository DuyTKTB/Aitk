/* ============================================================
   SquadStudyRoomModal.jsx — Phòng Tự Học Quân Đoàn NV1
   - Không gian gắn kết đồng đội cùng mục tiêu trường Đại học:
     1. Tab Thảo luận & Check-in mục tiêu ngày (có nút khích lệ +1)
     2. Tab Bình chọn Poll tuần (bỏ phiếu trực tiếp, biểu đồ % mượt, tạo poll mới)
   - Thanh mục tiêu chung 300 giờ tự học của Quân đoàn
   ============================================================ */
import React, { useEffect, useState } from 'react';
import '../styles/student-v9-upgrades.css';

const STORAGE_PREFIX = 'elec_squad_room_v1_';

function defaultRoomData(code, uni) {
  return {
    hoursDone: 148,
    hoursGoal: 300,
    messages: [
      {
        id: 'm1',
        author: 'Minh Khôi · 12A1',
        role: 'Đội trưởng',
        time: '12 phút trước',
        text: `Tối nay team ${code} chốt 1 đề chuẩn GDPT 2025 bấm giờ 50 phút rồi so lại Phần II Đúng/Sai nhé mọi người!`,
        cheers: 9,
        cheered: false,
      },
      {
        id: 'm2',
        author: 'Thảo Vy · 12 Hóa',
        role: 'Thành viên',
        time: '38 phút trước',
        text: `Mình vừa dọn sạch 8 câu sai phần Este – Pin điện hóa, tăng được +120 Lực chiến cho Quân đoàn ${uni}.`,
        cheers: 14,
        cheered: false,
      },
    ],
    polls: [
      {
        id: 'p1',
        question: 'Tuần này Quân đoàn ưu tiên cày mạnh chuyên đề nào?',
        votedIdx: null,
        options: [
          { label: 'Phần II Đúng/Sai chuẩn GDPT 2025', votes: 24 },
          { label: 'Đề ĐGNL (HSA / TSA) tổng hợp', votes: 18 },
          { label: 'Dọn Sổ lỗi sai & tăng tốc độ < 60s/câu', votes: 15 },
        ],
      },
      {
        id: 'p2',
        question: 'Khung giờ Study With Me chung hiệu quả nhất?',
        votedIdx: null,
        options: [
          { label: '20:00 – 21:30 (2 phiên Deep Work)', votes: 31 },
          { label: '05:30 – 06:30 (Sáng tinh mơ)', votes: 12 },
          { label: '22:00 – 23:00 (Cú đêm tăng tốc)', votes: 19 },
        ],
      },
    ],
  };
}

function loadRoom(code, uni) {
  if (typeof window === 'undefined' || !window.localStorage) return defaultRoomData(code, uni);
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${code}`);
    if (!raw) return defaultRoomData(code, uni);
    return JSON.parse(raw);
  } catch {
    return defaultRoomData(code, uni);
  }
}

export default function SquadStudyRoomModal({
  open,
  onClose,
  squadCode = 'BKA',
  squadUni = 'ĐH Bách Khoa Hà Nội',
  memberCount = 12,
  userName = 'Bạn',
}) {
  const [tab, setTab] = useState('chat'); // 'chat' | 'polls'
  const [room, setRoom] = useState(() => loadRoom(squadCode, squadUni));
  const [msgInput, setMsgInput] = useState('');

  useEffect(() => {
    if (open) setRoom(loadRoom(squadCode, squadUni));
  }, [open, squadCode, squadUni]);

  const persist = (next) => {
    setRoom(next);
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${squadCode}`, JSON.stringify(next));
    } catch { /* ignore */ }
  };

  if (!open) return null;

  const hoursPct = Math.min(100, Math.round((room.hoursDone / Math.max(1, room.hoursGoal)) * 100));

  const sendCheckin = (e) => {
    e.preventDefault();
    const txt = msgInput.trim();
    if (!txt) return;
    const next = {
      ...room,
      hoursDone: room.hoursDone + 1,
      messages: [
        {
          id: `m_${Date.now()}`,
          author: userName,
          role: 'Bạn',
          time: 'Vừa xong',
          text: txt,
          cheers: 1,
          cheered: true,
        },
        ...room.messages,
      ].slice(0, 30),
    };
    setMsgInput('');
    persist(next);
  };

  const toggleCheer = (id) => {
    const next = {
      ...room,
      messages: room.messages.map((m) =>
        m.id === id
          ? { ...m, cheered: !m.cheered, cheers: m.cheered ? Math.max(0, m.cheers - 1) : m.cheers + 1 }
          : m
      ),
    };
    persist(next);
  };

  const votePoll = (pollId, optIdx) => {
    const next = {
      ...room,
      polls: room.polls.map((p) => {
        if (p.id !== pollId) return p;
        const nextOpts = p.options.map((o, i) => {
          let v = o.votes;
          if (p.votedIdx === i) v = Math.max(0, v - 1);
          if (i === optIdx) v += 1;
          return { ...o, votes: v };
        });
        return { ...p, votedIdx: optIdx, options: nextOpts };
      }),
    };
    persist(next);
  };

  return (
    <div className="s9-srm-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="s9-srm-modal" role="dialog" aria-label={`Phòng tự học Quân đoàn ${squadCode}`}>
        <header className="s9-srm-head">
          <div className="s9-srm-head-l">
            <div className="s9-srm-code">{squadCode}</div>
            <div>
              <span className="s9-srm-eyebrow">PHÒNG TỰ HỌC QUÂN ĐOÀN · {memberCount} SĨ TỬ</span>
              <h3>{squadUni}</h3>
            </div>
          </div>
          <button type="button" className="s9-srm-close" onClick={onClose} aria-label="Đóng">✕</button>
        </header>

        {/* Collective 300h Campaign Bar */}
        <div className="s9-srm-campaign">
          <div className="s9-srm-campaign-top">
            <span>Mục tiêu học chung tháng này (mở khóa Huy hiệu Quân đoàn)</span>
            <b>{room.hoursDone}h / {room.hoursGoal}h ({hoursPct}%)</b>
          </div>
          <div className="s9-srm-bar">
            <i style={{ width: `${hoursPct}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="s9-srm-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'chat'}
            className={`s9-srm-tab ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => setTab('chat')}
          >
            Thảo luận &amp; Check-in ({room.messages.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'polls'}
            className={`s9-srm-tab ${tab === 'polls' ? 'active' : ''}`}
            onClick={() => setTab('polls')}
          >
            Bình chọn tuần ({room.polls.length})
          </button>
        </div>

        {tab === 'chat' ? (
          <div className="s9-srm-body">
            <form className="s9-srm-form" onSubmit={sendCheckin}>
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Check-in mục tiêu hôm nay để góp +1h cho Quân đoàn..."
                maxLength={220}
              />
              <button type="submit" disabled={!msgInput.trim()}>Gửi</button>
            </form>

            <div className="s9-srm-feed">
              {room.messages.map((m) => (
                <article key={m.id} className="s9-srm-msg">
                  <div className="s9-srm-msg-top">
                    <div>
                      <strong>{m.author}</strong>
                      <span className="s9-srm-role">{m.role}</span>
                    </div>
                    <small>{m.time}</small>
                  </div>
                  <p>{m.text}</p>
                  <button
                    type="button"
                    className={`s9-srm-cheer ${m.cheered ? 'on' : ''}`}
                    onClick={() => toggleCheer(m.id)}
                  >
                    Tiếp lửa · {m.cheers}
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="s9-srm-body">
            <div className="s9-srm-polls">
              {room.polls.map((poll) => {
                const totalVotes = Math.max(1, poll.options.reduce((s, o) => s + o.votes, 0));
                return (
                  <article key={poll.id} className="s9-srm-poll-card">
                    <h4>{poll.question}</h4>
                    <div className="s9-srm-poll-opts">
                      {poll.options.map((opt, idx) => {
                        const pct = Math.round((opt.votes / totalVotes) * 100);
                        const chosen = poll.votedIdx === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`s9-srm-poll-opt ${chosen ? 'chosen' : ''}`}
                            onClick={() => votePoll(poll.id, idx)}
                          >
                            <i className="s9-srm-poll-fill" style={{ width: `${pct}%` }} />
                            <span className="s9-srm-poll-lbl">{opt.label}</span>
                            <b className="s9-srm-poll-pct">{pct}%</b>
                          </button>
                        );
                      })}
                    </div>
                    <small>{totalVotes} lượt bình chọn trong Quân đoàn</small>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
