import { useState, useRef, useEffect } from 'react';
import { useLocalStorage, liveStreak, dayKey } from '../hooks.js';
import Pet, { STAGES } from './Pet.jsx';
import {
  IconGem, IconFire, IconBook, IconApple, IconX,
  IconInfo, IconChat, IconHeart, IconCake, IconTrend, IconSparkle,
} from './PetIcons.jsx';

const SIZE = 96;
const clamp = (p) => ({
  x: Math.min(innerWidth - SIZE, Math.max(0, p.x)),
  y: Math.min(innerHeight - SIZE, Math.max(0, p.y)),
});

const DIALOGUES = {
  happy: ['Hôm nay học giỏi lắm!', 'Cố lên! Mình đang lớn nè', 'Bạn là idol của mình', 'Wow, streak đỉnh quá!'],
  normal: ['Học thêm chút nữa đi nào~', 'Nhớ nghỉ ngơi giữa giờ nha!', 'Mình đợi bạn mở quiz', 'Hôm nay ôn gì thế?'],
  sleepy: ['Zzz... đói quá bạn ơi', 'Làm 1 quiz nhỏ cho mình tỉnh nhé!', 'Mình sắp ngủ mất rồi...'],
  sad: ['Buồn quá... lâu rồi bạn không học', 'Bỏ lỡ ngày nào cũng buồn ngày đó', 'Mình nhớ bạn lắm...'],
  hibernating: ['Zzz... (đang ngủ đông)', 'Đánh thức mình bằng 1 quiz nhé!', 'Ngủ đông rồi...'],
};

const CHAT_RESPONSES = {
  happy: {
    'chào': 'Chào bạn! Hôm nay vui quá',
    'khỏe': 'Mình khỏe lắm! Cảm ơn bạn',
    'học': 'Học đi nào! Mình sẽ cổ vũ bạn',
    'đói': 'Mình no rồi, cảm ơn bạn!',
    'chơi': 'Học xong rồi chơi nha!',
    default: 'Hihi, mình vui lắm! Hỏi gì nữa không?',
  },
  normal: {
    'chào': 'Chào bạn! Hôm nay học gì thế?',
    'khỏe': 'Mình ổn. Bạn khỏe không?',
    'học': 'Học là tốt! Cùng nhau cố gắng nhé',
    'đói': 'Hơi đói đó... có gì ăn không?',
    'chơi': 'Ừ, thư giãn chút cũng tốt!',
    default: 'Mình đang đợi bạn học cùng nè~',
  },
  sleepy: {
    'chào': 'Zzz... chào bạn...',
    'khỏe': 'Hơi mệt... cần năng lượng',
    'học': 'Học đi cho mình tỉnh táo với!',
    'đói': 'Đói lắm rồi! Cho ăn đi bạn',
    'chơi': 'Không chơi đâu... buồn ngủ lắm',
    default: 'Zzz... hmm... bạn nói gì?',
  },
  sad: {
    'chào': 'Hic... bạn đến rồi à?',
    'khỏe': 'Mình buồn lắm... lâu rồi không thấy bạn',
    'học': 'Bạn học lại đi, mình đợi',
    'đói': 'Buồn quá nên không muốn ăn...',
    'chơi': 'Không muốn chơi gì hết...',
    default: 'Hic... mình buồn quá...',
  },
  hibernating: {
    default: 'Zzz... (không phản hồi)',
  },
};

function getMood(streak, fedToday) {
  if (streak === 0) return 'hibernating';
  if (streak >= 7 && fedToday) return 'happy';
  if (streak >= 3) return fedToday ? 'happy' : 'normal';
  if (streak >= 1) return fedToday ? 'normal' : 'sleepy';
  return 'sad';
}

function matchResponse(input, mood) {
  const t = input.toLowerCase().trim();
  const bank = CHAT_RESPONSES[mood] || CHAT_RESPONSES.normal;
  for (const key of Object.keys(bank)) {
    if (key !== 'default' && t.includes(key)) return bank[key];
  }
  return bank.default;
}

export default function PetWidget() {
  const [name, setName] = useLocalStorage('cs-petname', 'Ember');
  const [pos, setPos] = useLocalStorage('cs-petpos', null);
  const [s, setS] = useLocalStorage('cs-streak', { last: '', n: 0, total: 0 });
  const [food, setFood] = useLocalStorage('cs-pet-food', 0);
  const [lastFed, setLastFed] = useLocalStorage('cs-pet-lastfed', '');
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState('');
  const [tab, setTab] = useState('info');

  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const [milestones, setMilestones] = useLocalStorage('cs-pet-milestones', {
    firstDay: '',
    maxStreak: 0,
    levelUps: [],
  });

  const drag = useRef(null);
  const bubbleTimer = useRef(null);
  const chatEnd = useRef(null);

  const p = clamp(pos || { x: 16, y: innerHeight - SIZE - 16 });
  const total = Math.max(s.total || 0, s.n || 0);

  let st = 0;
  STAGES.forEach(([t], i) => {
    if (total >= t) st = i;
  });
  const next = STAGES[st + 1];
  const fed = s.last === dayKey();
  const live = liveStreak(s);
  const mood = getMood(live, fed);

  useEffect(() => {
    if (!milestones.firstDay) {
      setMilestones({ ...milestones, firstDay: dayKey() });
    }
  }, []);

  useEffect(() => {
    if (live > milestones.maxStreak) {
      setMilestones({ ...milestones, maxStreak: live });
    }
  }, [live]);

  useEffect(() => {
    if (st > 0 && !milestones.levelUps.includes(st)) {
      setMilestones({ ...milestones, levelUps: [...milestones.levelUps, st] });
    }
  }, [st]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const showBubble = (text) => {
    setBubble(text);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(''), 3500);
  };

  const randomDialogue = () => {
    const list = DIALOGUES[mood] || DIALOGUES.normal;
    return list[Math.floor(Math.random() * list.length)];
  };

  const feed = () => {
    if (food <= 0) {
      showBubble('Hết thức ăn rồi! Học quiz để kiếm thêm');
      return;
    }
    if (lastFed === dayKey()) {
      showBubble('Hôm nay ăn rồi, để dành mai nhé!');
      return;
    }
    setFood((f) => f - 1);
    setLastFed(dayKey());
    showBubble('Ngon quá! Cảm ơn bạn');
  };

  const sendChat = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const reply = matchResponse(text, mood);
    setChatLog((c) => [...c, { role: 'user', text }, { role: 'pet', text: reply }]);
    setChatInput('');
    showBubble(reply);
  };

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: false };
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (d.moved) setPos(clamp({ x: d.ox + dx, y: d.oy + dy }));
  };

  const up = () => {
    if (drag.current && !drag.current.moved) {
      showBubble(randomDialogue());
      setOpen((o) => !o);
    }
    drag.current = null;
  };

  const below = p.y < innerHeight / 2;
  const paneStyle = {
    left: Math.min(p.x, innerWidth - 380),
    [below ? 'top' : 'bottom']: below ? p.y + SIZE + 8 : innerHeight - p.y + 8,
  };

  const pct = next
    ? Math.min(100, Math.max(0, ((total - STAGES[st][0]) / (next[0] - STAGES[st][0])) * 100))
    : 100;

  return (
    <>
      <div
        className={'petw petw-' + mood}
        style={{ left: p.x, top: p.y }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onMouseEnter={() => !bubble && showBubble(randomDialogue())}
        role="button"
        tabIndex={0}
        aria-label={`${name} — bấm để xem thông tin`}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen((o) => !o)}
      >
        <Pet mini />
        {bubble && <div className={'pet-bubble pet-bubble-' + mood}>{bubble}</div>}
      </div>

      {open && (
        <div className="card pane pet-pane pet-pane-v2" style={paneStyle}>
          {/* ============ HEADER ============ */}
          <div className="pet-head">
            <div className="pet-head-left">
              <span className="pet-head-icon">
                <IconFire size={18} />
              </span>
              <h3 className="pet-head-name">{name}</h3>
            </div>
            <button
              className="pet-head-close"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              type="button"
            >
              <IconX size={18} />
            </button>
          </div>

          {/* ============ TABS ============ */}
          <div className="pet-tabs">
            <button
              className={'pet-tab' + (tab === 'info' ? ' on' : '')}
              onClick={() => setTab('info')}
              type="button"
            >
              <IconInfo size={13} />
              <span>Thông tin</span>
            </button>
            <button
              className={'pet-tab' + (tab === 'chat' ? ' on' : '')}
              onClick={() => setTab('chat')}
              type="button"
            >
              <IconChat size={13} />
              <span>Nói chuyện</span>
            </button>
            <button
              className={'pet-tab' + (tab === 'memories' ? ' on' : '')}
              onClick={() => setTab('memories')}
              type="button"
            >
              <IconHeart size={13} />
              <span>Kỷ niệm</span>
            </button>
          </div>

          {/* ============ TAB INFO ============ */}
          {tab === 'info' && (
            <div className="pet-tab-body">

              {/* Tên */}
              <div className="pet-field">
                <label className="pet-field-label">Đổi tên</label>
                <input
                  className="pet-field-input"
                  value={name}
                  maxLength={16}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => !name.trim() && setName('Ember')}
                  placeholder="Ember"
                />
              </div>

              {/* 3 stat cards */}
              <div className="pet-stat-grid">
                <div className="pet-stat-card">
                  <div className="pet-stat-card-icon pet-stat-icon-fire">
                    <IconFire size={16} />
                  </div>
                  <div className="pet-stat-card-num">{live}</div>
                  <div className="pet-stat-card-label">Streak</div>
                </div>
                <div className="pet-stat-card">
                  <div className="pet-stat-card-icon pet-stat-icon-book">
                    <IconBook size={16} />
                  </div>
                  <div className="pet-stat-card-num">{total}</div>
                  <div className="pet-stat-card-label">Tổng ngày</div>
                </div>
                <div className="pet-stat-card">
                  <div className="pet-stat-card-icon pet-stat-icon-apple">
                    <IconApple size={16} />
                  </div>
                  <div className="pet-stat-card-num">{food}</div>
                  <div className="pet-stat-card-label">Thức ăn</div>
                </div>
              </div>

              {/* Nút cho ăn */}
              <button
                className="pet-feed-btn-v2"
                onClick={feed}
                disabled={food <= 0 || lastFed === dayKey()}
                type="button"
              >
                <IconApple size={16} />
                <span>
                  {lastFed === dayKey()
                    ? 'Đã ăn hôm nay'
                    : food > 0
                    ? 'Cho ăn'
                    : 'Hết thức ăn'}
                </span>
              </button>

              {/* Thanh tiến độ */}
              <div className="pet-progress-block">
                <div className="pet-progress-head">
                  <span className="pet-progress-label">
                    <IconSparkle size={12} />
                    Cấp hiện tại
                  </span>
                  <span className="pet-progress-value">{STAGES[st][1]}</span>
                </div>
                <div className="pet-progress-bar">
                  <i style={{ width: pct + '%' }} />
                </div>
                <div className="pet-progress-hint">
                  {next
                    ? `Còn ${next[0] - total} ngày nữa lên "${next[1]}"`
                    : 'Đã đạt cấp cao nhất!'}
                </div>
              </div>

              {/* Hướng dẫn */}
              <div className="pet-guide">
                <div className="pet-guide-title">Cách nuôi</div>
                <ul className="pet-guide-list">
                  <li>
                    <IconBook size={13} />
                    <span>Làm quiz hoặc Pomodoro để nhận thức ăn</span>
                  </li>
                  <li>
                    <IconFire size={13} />
                    <span>Học liên tiếp để giữ chuỗi streak</span>
                  </li>
                  <li>
                    <IconApple size={13} />
                    <span>Cho ăn mỗi ngày để {name} vui vẻ</span>
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* ============ TAB CHAT ============ */}
          {tab === 'chat' && (
            <div className="pet-chat">
              <div className="pet-chat-msgs">
                {chatLog.length === 0 && (
                  <p className="hint center" style={{ padding: '1rem 0' }}>
                    Hỏi {name} gì đó đi! Thử "chào", "khỏe không", "học bài"...
                  </p>
                )}
                {chatLog.map((m, i) => (
                  <div key={i} className={'pet-chat-msg pet-chat-' + m.role}>
                    {m.text}
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>

              <div className="pet-chat-suggest">
                {['Chào', 'Khỏe không', 'Học bài', 'Đói chưa'].map((q) => (
                  <button
                    key={q}
                    className="pet-chat-chip"
                    onClick={() => {
                      const reply = matchResponse(q, mood);
                      setChatLog((c) => [...c, { role: 'user', text: q }, { role: 'pet', text: reply }]);
                      showBubble(reply);
                    }}
                    type="button"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form className="pet-chat-form" onSubmit={sendChat}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Nhắn cho ${name}...`}
                  maxLength={80}
                />
                <button className="btn primary sm" type="submit">Gửi</button>
              </form>
            </div>
          )}

          {/* ============ TAB MEMORIES ============ */}
          {tab === 'memories' && (
            <div className="pet-memories">
              <div className="pet-memory">
                <span className="pet-memory-icon"><IconCake size={16} /></span>
                <div>
                  <b>Ngày bắt đầu nuôi</b>
                  <small>{milestones.firstDay || 'Chưa có'}</small>
                </div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon"><IconFire size={16} /></span>
                <div>
                  <b>Streak cao nhất</b>
                  <small>{milestones.maxStreak} ngày</small>
                </div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon"><IconGem size={16} /></span>
                <div>
                  <b>Cấp hiện tại</b>
                  <small>{STAGES[st][1]}</small>
                </div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon"><IconTrend size={16} /></span>
                <div>
                  <b>Số lần lên cấp</b>
                  <small>{milestones.levelUps.length} lần</small>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}