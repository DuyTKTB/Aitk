import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocalStorage, liveStreak, dayKey } from '../hooks.js';
import { STAGES } from './Pet.jsx';
import { SkinPet, PET_SKINS, LEGACY_DEFAULT_NAMES } from './PetSkins.jsx';
import { rankReply, myBestRank } from '../lib/petRank.js';
import { randomAction } from '../lib/elecActions.js';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  IconGem, IconFire, IconBook, IconApple, IconX,
  IconInfo, IconChat, IconHeart, IconCake, IconTrend, IconSparkle,
} from './PetIcons.jsx';
import './pet-widget.css';


const SIZE = 96;

/* ============================================================
   VỊ TRÍ CỐ ĐỊNH — GÓC TRÁI, KHÔNG KÉO THẢ
   ============================================================ */
const getFixedPos = (w) => {
  const isMobile = w <= 720;
  if (isMobile) return { left: 14, bottom: 180 };
  return { left: 24, bottom: 150 };
};

const DIALOGUES = {
  happy: ['Hôm nay học giỏi lắm!', 'Cố lên! Mình đang lớn nè', 'Bạn là idol của mình', 'Wow, streak đỉnh quá!'],
  normal: ['Học thêm chút nữa đi nào~', 'Nhớ nghỉ ngơi giữa giờ nha!', 'Mình đợi bạn mở quiz', 'Hôm nay ôn gì thế?'],
  sleepy: ['Zzz... đói quá bạn ơi', 'Làm 1 quiz nhỏ cho mình tỉnh nhé!', 'Mình sắp ngủ mất rồi...'],
  sad: ['Buồn quá... lâu rồi bạn không học', 'Bỏ lỡ ngày nào cũng buồn ngày đó', 'Mình nhớ bạn lắm...'],
  hibernating: ['Zzz... (đang ngủ đông)', 'Đánh thức mình bằng 1 quiz nhé!', 'Ngủ đông rồi...'],
};

const CHAT_RESPONSES = {
  happy: {
    'chào': ['Chào bạn! Hôm nay vui quá', 'Chào chào! Mình đang phấn khích nè'],
    'khỏe': ['Mình khỏe lắm! Cảm ơn bạn', 'Khỏe re luôn, bạn thì sao?'],
    'học': ['Học đi nào! Mình sẽ cổ vũ bạn', 'Mình ở đây cổ vũ bạn học nè!'],
    'đói': ['Mình no rồi, cảm ơn bạn!', 'No căng bụng luôn á!'],
    'chơi': ['Học xong rồi chơi nha!', 'Chơi game cũng là học mà, đúng không?'],
    default: ['Hihi, mình vui lắm! Hỏi gì nữa không?', 'Hỏi tiếp đi, mình thích trò chuyện với bạn!'],
  },
  normal: {
    'chào': ['Chào bạn! Hôm nay học gì thế?', 'Chào! Hôm nay thế nào?'],
    'khỏe': ['Mình ổn. Bạn khỏe không?', 'Bình thường thôi, còn bạn?'],
    'học': ['Học là tốt! Cùng nhau cố gắng nhé', 'Chọn một môn rồi bắt đầu nào!'],
    'đói': ['Hơi đói đó... có gì ăn không?', 'Bụng mình hơi réo rồi...'],
    'chơi': ['Ừ, thư giãn chút cũng tốt!', 'Chơi một ván rồi học tiếp nhé!'],
    default: ['Mình đang đợi bạn học cùng nè~', 'Ừm... kể mình nghe thêm đi!'],
  },
  sleepy: {
    'chào': ['Zzz... chào bạn...', 'Hmm... ai đó chào mình à...'],
    'khỏe': ['Hơi mệt... cần năng lượng', 'Mệt quá... cho mình ăn đi'],
    'học': ['Học đi cho mình tỉnh táo với!', 'Làm một quiz nhỏ đánh thức mình nhé'],
    'đói': ['Đói lắm rồi! Cho ăn đi bạn', 'Bụng kêu ọc ọc rồi nè...'],
    'chơi': ['Không chơi đâu... buồn ngủ lắm', 'Để mình ngủ thêm chút đã...'],
    default: ['Zzz... hmm... bạn nói gì?', 'Hả... mình lơ mơ quá...'],
  },
  sad: {
    'chào': ['Hic... bạn đến rồi à?', 'Bạn đến rồi... mình mừng lắm'],
    'khỏe': ['Mình buồn lắm... lâu rồi không thấy bạn', 'Không khỏe lắm... mình nhớ bạn'],
    'học': ['Bạn học lại đi, mình đợi', 'Học cùng mình đi, mình sẽ vui lên'],
    'đói': ['Buồn quá nên không muốn ăn...', 'Chưa muốn ăn đâu...'],
    'chơi': ['Không muốn chơi gì hết...', 'Học một chút thôi cũng được...'],
    default: ['Hic... mình buồn quá...', 'Bạn ở lại với mình nhé...'],
  },
  hibernating: {
    default: ['Zzz... (không phản hồi)'],
  },
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* ---- Hiệu ứng bay quanh linh vật (SVG-only) ---- */
function FxGlyph({ fx }) {
  switch (fx) {
    case 'hearts': return <path d="M12 20.5C8.2 17 4 13.6 4 9.7A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.7c0 3.9-4.2 7.3-8 10.8z" fill="#f472b6" stroke="none" />;
    case 'sparkles': return <path d="M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2z" fill="#fbbf24" stroke="none" />;
    case 'sweat': return <path d="M12 3s6 7.2 6 11a6 6 0 0 1-12 0c0-3.8 6-11 6-11z" fill="#60a5fa" stroke="none" />;
    case 'zzz': return <text x="3" y="18" fontSize="16" fontWeight="800" fill="#64748b" stroke="none">Z</text>;
    case 'notes': return <path d="M9 19V6.5L19 4v11.5M9 19a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" fill="none" stroke="#8b5cf6" strokeWidth="1.8" />;
    case 'bolts': return <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill="#facc15" stroke="none" />;
    case 'question': return <text x="5" y="18" fontSize="16" fontWeight="800" fill="#2563eb" stroke="none">?</text>;
    case 'stars': return <path d="M12 3l2.4 5.4 5.6.6-4.2 3.9 1.2 5.6L12 15.6 7.4 18.5l1.2-5.6L4.4 9l5.6-.6z" fill="#fbbf24" stroke="none" />;
    case 'exclaim': return <text x="8" y="18" fontSize="16" fontWeight="800" fill="#ef4444" stroke="none">!</text>;
    case 'bulb': return <path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.5 10.9c-.6.5-1 1.3-1 2.1h-5c0-.8-.4-1.6-1-2.1A6 6 0 0 1 12 3z" fill="none" stroke="#facc15" strokeWidth="1.8" />;
    default: return null;
  }
}

const FX_SPOTS = [
  { left: '6%', top: '18%', delay: 0 },
  { left: '78%', top: '10%', delay: 0.35 },
  { left: '82%', top: '52%', delay: 0.7 },
  { left: '10%', top: '58%', delay: 1.05 },
];

function ActionFx({ fx }) {
  if (!fx) return null;
  return (
    <div className="elec-fx" aria-hidden="true">
      {FX_SPOTS.map((s, i) => (
        <svg key={i} className="elec-fx-item" viewBox="0 0 24 24" width="20" height="20"
          style={{ left: s.left, top: s.top, animationDelay: s.delay + 's' }}>
          <FxGlyph fx={fx} />
        </svg>
      ))}
    </div>
  );
}

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
    if (key !== 'default' && t.includes(key)) return pick(bank[key]);
  }
  return pick(bank.default);
}

/* Tên mặc định (hiện tại + cũ) — để biết người dùng chưa tự đặt tên */
const DEFAULT_NAMES = [
  ...Object.values(PET_SKINS).map((s) => s.defaultName),
  ...LEGACY_DEFAULT_NAMES,
];

/* ============================================================
   MAIN
   ============================================================ */
export default function PetWidget() {
  const { user } = useAuth();
  const [name, setName] = useLocalStorage('cs-petname', 'Elec');
  const skin = 'elec'; /* ELEC AI là linh vật duy nhất — vĩnh viễn */
  const [s] = useLocalStorage('cs-streak', { last: '', n: 0, total: 0 });
  const [food, setFood] = useLocalStorage('cs-pet-food', 0);
  const [lastFed, setLastFed] = useLocalStorage('cs-pet-lastfed', '');
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState('');
  const [tab, setTab] = useState('info');
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [action, setAction] = useState(null);
  const actionTimer = useRef(null);

  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const [milestones, setMilestones] = useLocalStorage('cs-pet-milestones', {
    firstDay: '',
    maxStreak: 0,
    levelUps: [],
  });

  const bubbleTimer = useRef(null);
  const levelTimer = useRef(null);
  const prevStage = useRef(null);
  const chatEnd = useRef(null);
  const paneRef = useRef(null);
  const petRef = useRef(null);

  const [windowSize, setWindowSize] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  useEffect(() => {
    const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* dọn timer khi unmount */
  useEffect(() => () => {
    clearTimeout(bubbleTimer.current);
    clearTimeout(levelTimer.current);
    clearTimeout(actionTimer.current);
  }, []);

  const isMobile = windowSize.w <= 720;
  const fixedPos = useMemo(() => getFixedPos(windowSize.w), [windowSize.w]);

  const skinInfo = PET_SKINS[skin] || PET_SKINS.elec;
  /* Chưa tự đặt tên → hiện tên riêng của skin */
  const displayName = DEFAULT_NAMES.includes(name) ? skinInfo.defaultName : name;

  const total = Math.max(s.total || 0, s.n || 0);

  let st = 0;
  STAGES.forEach(([t], i) => {
    if (total >= t) st = i;
  });
  const next = STAGES[st + 1];
  const fed = s.last === dayKey();
  const live = liveStreak(s);
  const mood = getMood(live, fed);

  /* Tên cấp theo skin (lửa dùng tên gốc) */
  const stageName = (i) => skinInfo.stages?.[i] || STAGES[i][1];

  /* ---- Cột mốc: GỘP 1 effect, không ghi đè lẫn nhau ---- */
  useEffect(() => {
    const nextM = { ...milestones };
    let changed = false;
    if (!nextM.firstDay) { nextM.firstDay = dayKey(); changed = true; }
    if (live > (nextM.maxStreak || 0)) { nextM.maxStreak = live; changed = true; }
    const lv = nextM.levelUps || [];
    if (st > 0 && !lv.includes(st)) { nextM.levelUps = [...lv, st]; changed = true; }
    if (changed) setMilestones(nextM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, st]);

  /* ---- Phát hiện lên cấp → hiệu ứng ---- */
  useEffect(() => {
    if (prevStage.current !== null && st > prevStage.current) {
      setJustLeveledUp(true);
      clearTimeout(levelTimer.current);
      levelTimer.current = setTimeout(() => setJustLeveledUp(false), 2200);
    }
    prevStage.current = st;
  }, [st]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  /* Bấm ra ngoài hoặc nhấn Esc để đóng panel */
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (paneRef.current?.contains(e.target)) return;
      if (petRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const showBubble = useCallback((text) => {
    setBubble(text);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(''), 3500);
  }, []);

  const randomDialogue = useCallback(() => {
    const base = DIALOGUES[mood] || DIALOGUES.normal;
    /* thêm câu đặc trưng của skin khi pet đang vui/bình thường */
    const extra = mood === 'happy' || mood === 'normal' ? skinInfo.lines || [] : [];
    return pick([...base, ...extra]);
  }, [mood, skinInfo]);

  const feed = () => {
    if (food <= 0) {
      showBubble('Hết thức ăn rồi! Học quiz để kiếm thêm');
      return;
    }
    if (lastFed === dayKey()) {
      showBubble('Hôm nay ăn rồi, để dành mai nhé!');
      return;
    }
    setFood(food - 1);
    setLastFed(dayKey());
    showBubble('Ngon quá! Cảm ơn bạn');
  };

  /* ---- Chat nối bảng xếp hạng: hỏi về hạng → ELEC AI đọc điểm game trả lời ---- */
  const userName = user?.displayName || (user?.email ? user.email.split('@')[0] : '') || displayName;
  const bestRank = myBestRank(userName);

  /* Liên kết nhanh tới các phần của web */
  const QUICK_LINKS = [
    { h: '#quiz', label: 'Ôn tập', d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20' },
    { h: '#games', label: 'Trò chơi', d: 'M6 12h4M8 10v4M15.5 13h.01M18.5 11h.01M17.3 5H6.7a4.7 4.7 0 0 0-4.62 5.6l1 5.4a2.4 2.4 0 0 0 4.1 1.1L9 15h6l1.82 2.1a2.4 2.4 0 0 0 4.1-1.1l1-5.4A4.7 4.7 0 0 0 17.3 5z' },
    { h: '#ai', label: 'Hỏi AI', d: 'M12 8V4M8 4h8M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM9 13h.01M15 13h.01' },
  ];
  const go = (h) => { window.location.hash = h; setOpen(false); };
  const replyFor = (text) => {
    const t = text.toLowerCase().trim();
    if (/(xếp hạng|thứ hạng|hạng mấy|bảng xếp hạng|top|rank|điểm cao)/.test(t)) return rankReply(userName);
    return matchResponse(text, mood);
  };

  const sendChat = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const reply = replyFor(text);
    setChatLog((c) => [...c, { role: 'user', text }, { role: 'pet', text: reply }]);
    setChatInput('');
    showBubble(reply);
  };

  /* Bấm → ELEC AI diễn 1 trong 40 biểu cảm/hành động ngẫu nhiên */
  const onClick = () => {
    const a = randomAction(action?.id);
    setAction(a);
    showBubble(a ? pick(a.say) : randomDialogue());
    clearTimeout(actionTimer.current);
    actionTimer.current = setTimeout(() => setAction(null), 3000);
    setOpen((o) => !o);
  };

  const panelWidth = isMobile ? Math.min(320, windowSize.w - 24) : 340;
  const panelLeft = fixedPos.left;
  const panelBottom = fixedPos.bottom + SIZE + 8;

  const paneStyle = useMemo(() => ({
    left: panelLeft,
    bottom: panelBottom,
    right: 'auto',
    top: 'auto',
    width: panelWidth,
    maxWidth: 'calc(100vw - 24px)',
  }), [panelLeft, panelBottom, panelWidth]);

  const pct = next
    ? Math.min(100, Math.max(0, ((total - STAGES[st][0]) / (next[0] - STAGES[st][0])) * 100))
    : 100;

  const renderPet = () => (
    <div className={'elec-act' + (action ? ' elec-anim-' + action.anim : '')}>
      <SkinPet mood={mood} imgKey={action?.img} justLeveledUp={justLeveledUp} />
    </div>
  );

  return (
    <>
      <div
        ref={petRef}
        className={'petw petw-' + mood + ' petw-skin-' + skin}
        style={{
          position: 'fixed',
          left: fixedPos.left + 'px',
          bottom: fixedPos.bottom + 'px',
          right: 'auto',
          top: 'auto',
          width: SIZE + 'px',
          height: SIZE + 'px',
          zIndex: 250,
          cursor: 'pointer',
        }}
        onClick={onClick}
        onMouseEnter={() => !bubble && showBubble(randomDialogue())}
        role="button"
        tabIndex={0}
        aria-label={`${displayName} — bấm để xem thông tin`}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      >
        {renderPet()}
        {action && <ActionFx fx={action.fx} />}
        {bubble && !open && <div className={'pet-bubble pet-bubble-' + mood}>{bubble}</div>}
      </div>

      {open && (
        <div
          className="card pane pet-pane pet-pane-compact"
          style={paneStyle}
          ref={(el) => {
            paneRef.current = el;
            /* CSS cũ đặt z-index: 46 !important nên main (z-index 100) đè lên panel.
               Inline !important thắng stylesheet !important. */
            if (el) el.style.setProperty('z-index', '9996', 'important');
          }}
        >
          <div className="pet-head">
            <div className="pet-head-left">
              <span className="pet-head-icon" style={{ background: skinInfo.bg, color: skinInfo.color }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={skinInfo.icon} /></svg>
              </span>
              <h3 className="pet-head-name">{displayName}</h3>
            </div>
            <button className="pet-head-close" onClick={() => setOpen(false)} aria-label="Đóng" type="button">
              <IconX size={16} />
            </button>
          </div>

          <div className="pet-tabs">
            <button className={'pet-tab' + (tab === 'info' ? ' on' : '')} onClick={() => setTab('info')} type="button">
              <IconInfo size={12} /><span>Thông tin</span>
            </button>
            <button className={'pet-tab' + (tab === 'chat' ? ' on' : '')} onClick={() => setTab('chat')} type="button">
              <IconChat size={12} /><span>Nói chuyện</span>
            </button>
            <button className={'pet-tab' + (tab === 'memories' ? ' on' : '')} onClick={() => setTab('memories')} type="button">
              <IconHeart size={12} /><span>Kỷ niệm</span>
            </button>
          </div>

          {tab === 'info' && (
            <div className="pet-tab-body pet-tab-body-compact">
              <div className="pet-field">
                <label className="pet-field-label" htmlFor="pet-name">Đổi tên</label>
                <input
                  id="pet-name"
                  className="pet-field-input"
                  value={displayName}
                  maxLength={16}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => !name.trim() && setName(skinInfo.defaultName)}
                  placeholder={skinInfo.defaultName}
                />
              </div>

              <div className="pet-stat-grid">
                <div className="pet-stat-card">
                  <div className="pet-stat-card-icon pet-stat-icon-fire"><IconFire size={14} /></div>
                  <div className="pet-stat-card-num">{live}</div>
                  <div className="pet-stat-card-label">Streak</div>
                </div>
                <div className="pet-stat-card">
                  <div className="pet-stat-card-icon pet-stat-icon-book"><IconBook size={14} /></div>
                  <div className="pet-stat-card-num">{total}</div>
                  <div className="pet-stat-card-label">Tổng</div>
                </div>
                <div className="pet-stat-card">
                  <div className="pet-stat-card-icon pet-stat-icon-apple"><IconApple size={14} /></div>
                  <div className="pet-stat-card-num">{food}</div>
                  <div className="pet-stat-card-label">Thức ăn</div>
                </div>
              </div>

              <button
                className="pet-feed-btn-v2"
                onClick={feed}
                disabled={food <= 0 || lastFed === dayKey()}
                type="button"
              >
                <IconApple size={14} />
                <span>{lastFed === dayKey() ? 'Đã ăn hôm nay' : food > 0 ? 'Cho ăn' : 'Hết thức ăn'}</span>
              </button>

              {/* Liên kết nhanh tới các phần của web */}
              <div className="pet-quick-grid">
                {QUICK_LINKS.map((q) => (
                  <button key={q.h} type="button" className="pet-quick" onClick={() => go(q.h)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={q.d} /></svg>
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>

              {bestRank && (
                <button type="button" className="pet-rank-card" onClick={() => go('#games')} title="Xem bảng xếp hạng">
                  <span className="pet-rank-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>
                  </span>
                  <span className="pet-rank-text">
                    <b>Hạng #{bestRank.rank}/{bestRank.total}</b>
                    <small>{bestRank.label} — {bestRank.score} điểm</small>
                  </span>
                  <small className="pet-rank-go">Xem</small>
                </button>
              )}

              <div className="pet-progress-block">
                <div className="pet-progress-head">
                  <span className="pet-progress-label"><IconSparkle size={11} />Cấp</span>
                  <span className="pet-progress-value">{stageName(st)}</span>
                </div>
                <div className="pet-progress-bar"><i style={{ width: pct + '%' }} /></div>
                <div className="pet-progress-hint">
                  {next ? `Còn ${next[0] - total} ngày → "${stageName(st + 1)}"` : 'Đã đạt cấp cao nhất!'}
                </div>
              </div>
            </div>
          )}

          {tab === 'chat' && (
            <div className="pet-chat pet-chat-compact">
              <div className="pet-chat-msgs">
                {chatLog.length === 0 && (
                  <p className="hint center" style={{ padding: '.6rem 0', fontSize: '.75rem' }}>
                    Hỏi {displayName} gì đó đi! Thử "chào", "xếp hạng của tôi"...
                  </p>
                )}
                {chatLog.map((m, i) => (
                  <div key={i} className={'pet-chat-msg pet-chat-' + m.role}>{m.text}</div>
                ))}
                <div ref={chatEnd} />
              </div>

              <div className="pet-chat-suggest">
                {['Chào', 'Xếp hạng của tôi', 'Học bài'].map((q) => (
                  <button
                    key={q}
                    className="pet-chat-chip"
                    onClick={() => {
                      const reply = replyFor(q);
                      setChatLog((c) => [...c, { role: 'user', text: q }, { role: 'pet', text: reply }]);
                      showBubble(reply);
                    }}
                    type="button"
                  >{q}</button>
                ))}
              </div>

              <form className="pet-chat-form" onSubmit={sendChat}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Nhắn cho ${displayName}...`}
                  maxLength={80}
                />
                <button className="btn primary sm" type="submit">Gửi</button>
              </form>
            </div>
          )}

          {tab === 'memories' && (
            <div className="pet-memories pet-memories-compact">
              <div className="pet-memory">
                <span className="pet-memory-icon" style={{ background: 'rgba(255,159,10,.12)', color: '#ff9f0a' }}><IconCake size={16} /></span>
                <div><b>Ngày bắt đầu</b><small>{milestones.firstDay || 'Chưa có'}</small></div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon" style={{ background: 'rgba(255,59,48,.12)', color: '#ff3b30' }}><IconFire size={16} /></span>
                <div><b>Streak cao nhất</b><small>{milestones.maxStreak} ngày</small></div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon" style={{ background: 'rgba(88,86,214,.12)', color: '#5856d6' }}><IconGem size={16} /></span>
                <div><b>Cấp hiện tại</b><small>{stageName(st)}</small></div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon" style={{ background: 'rgba(52,199,89,.12)', color: '#34c759' }}><IconTrend size={16} /></span>
                <div><b>Số lần lên cấp</b><small>{(milestones.levelUps || []).length} lần</small></div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}