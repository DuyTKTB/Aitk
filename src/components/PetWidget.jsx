import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocalStorage, liveStreak, dayKey } from '../hooks.js';
import Pet, { STAGES } from './Pet.jsx';
import { SkinPet, PET_SKINS } from './PetSkins.jsx';
import {
  IconGem, IconFire, IconBook, IconApple, IconX,
  IconInfo, IconChat, IconHeart, IconCake, IconTrend, IconSparkle,
} from './PetIcons.jsx';

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

/* ============================================================
   SKIN PICKER
   ============================================================ */
function SkinPicker({ current, onPick }) {
  return (
    <div className="pet-skins">
      <p className="pet-skins-hint">Chọn nhân vật đồng hành cùng bạn</p>
      <div className="pet-skins-grid">
        {Object.values(PET_SKINS).map((s) => (
          <button
            key={s.key}
            type="button"
            className={'pet-skin-card' + (current === s.key ? ' on' : '')}
            onClick={() => onPick(s.key)}
            style={{ '--skin-color': s.color, '--skin-bg': s.bg }}
            aria-pressed={current === s.key}
            title={s.desc}
          >
            <span className="pet-skin-emoji" aria-hidden="true">{s.emoji}</span>
            <span className="pet-skin-name">{s.name}</span>
            {current === s.key && <span className="pet-skin-check" aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      <p className="pet-skins-current">
        Đang dùng: <b>{PET_SKINS[current]?.name || 'Lửa'}</b>
      </p>
    </div>
  );
}

/* Tên mặc định của mọi skin — để biết người dùng chưa tự đặt tên */
const DEFAULT_NAMES = Object.values(PET_SKINS).map((s) => s.defaultName);

/* ============================================================
   MAIN
   ============================================================ */
export default function PetWidget() {
  const [name, setName] = useLocalStorage('cs-petname', 'Ember');
  const [skin, setSkin] = useLocalStorage('cs-pet-skin', 'fire');
  const [s] = useLocalStorage('cs-streak', { last: '', n: 0, total: 0 });
  const [food, setFood] = useLocalStorage('cs-pet-food', 0);
  const [lastFed, setLastFed] = useLocalStorage('cs-pet-lastfed', '');
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState('');
  const [tab, setTab] = useState('info');
  const [justLeveledUp, setJustLeveledUp] = useState(false);

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
  }, []);

  const isMobile = windowSize.w <= 720;
  const fixedPos = useMemo(() => getFixedPos(windowSize.w), [windowSize.w]);

  const skinInfo = PET_SKINS[skin] || PET_SKINS.fire;
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

  const sendChat = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const reply = matchResponse(text, mood);
    setChatLog((c) => [...c, { role: 'user', text }, { role: 'pet', text: reply }]);
    setChatInput('');
    showBubble(reply);
  };

  const onClick = () => {
    showBubble(randomDialogue());
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

  const renderPet = () => {
    if (skin === 'fire') return <Pet mini />;
    return <SkinPet skin={skin} mood={mood} justLeveledUp={justLeveledUp} />;
  };

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
                {skinInfo.emoji}
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
            <button className={'pet-tab' + (tab === 'skins' ? ' on' : '')} onClick={() => setTab('skins')} type="button">
              <IconSparkle size={12} /><span>Nhân vật</span>
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

          {tab === 'skins' && (
            <div className="pet-tab-body pet-tab-body-compact">
              <SkinPicker current={skin} onPick={setSkin} />
            </div>
          )}

          {tab === 'chat' && (
            <div className="pet-chat pet-chat-compact">
              <div className="pet-chat-msgs">
                {chatLog.length === 0 && (
                  <p className="hint center" style={{ padding: '.6rem 0', fontSize: '.75rem' }}>
                    Hỏi {displayName} gì đó đi! Thử "chào", "khỏe không"...
                  </p>
                )}
                {chatLog.map((m, i) => (
                  <div key={i} className={'pet-chat-msg pet-chat-' + m.role}>{m.text}</div>
                ))}
                <div ref={chatEnd} />
              </div>

              <div className="pet-chat-suggest">
                {['Chào', 'Khỏe không', 'Học bài'].map((q) => (
                  <button
                    key={q}
                    className="pet-chat-chip"
                    onClick={() => {
                      const reply = matchResponse(q, mood);
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
                <span className="pet-memory-icon"><IconCake size={14} /></span>
                <div><b>Ngày bắt đầu</b><small>{milestones.firstDay || 'Chưa có'}</small></div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon"><IconFire size={14} /></span>
                <div><b>Streak cao nhất</b><small>{milestones.maxStreak} ngày</small></div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon"><IconGem size={14} /></span>
                <div><b>Cấp hiện tại</b><small>{stageName(st)}</small></div>
              </div>
              <div className="pet-memory">
                <span className="pet-memory-icon"><IconTrend size={14} /></span>
                <div><b>Số lần lên cấp</b><small>{(milestones.levelUps || []).length} lần</small></div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}