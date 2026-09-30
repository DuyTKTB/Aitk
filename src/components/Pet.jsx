import { useMemo, useEffect, useState, useRef } from 'react';
import { useLocalStorage, liveStreak, dayKey } from '../hooks.js';

export const STAGES = [
  [0, 'Hạt mầm'],
  [1, 'Tinh thể nhỏ'],
  [3, 'Cụm thạch anh'],
  [7, 'Pha lê'],
  [14, 'Cụm pha lê lớn'],
  [30, 'Kim cương'],
];

const B = 172;      // baseline (chân)
const CX = 100;     // tâm ngang
const CY = 100;     // tâm thân

const SKINS = [
  { from: '#c7f9f0', mid: '#5eead4', to: '#818cf8', glow: '#5eead4', accent: '#a5f3fc' }, // bạc hà
  { from: '#fbcfe8', mid: '#f472b6', to: '#a855f7', glow: '#f9a8d4', accent: '#fde68a' }, // hồng tím
  { from: '#fef3c7', mid: '#fbbf24', to: '#fb7185', glow: '#fbbf24', accent: '#fda4af' }, // vàng san hô
];
const getSkin = (stage) => (stage >= 4 ? SKINS[2] : stage >= 2 ? SKINS[1] : SKINS[0]);

const MOODS = {
  happy: '😊',
  normal: '🙂',
  sleepy: '😴',
  sad: '😢',
  hibernating: '💤',
};

function getMood(streak, fedToday) {
  if (streak === 0) return 'hibernating';
  if (streak >= 7 && fedToday) return 'happy';
  if (streak >= 3) return fedToday ? 'happy' : 'normal';
  if (streak >= 1) return fedToday ? 'normal' : 'sleepy';
  return 'sad';
}

/* ============================================================
   XÚC TU — vẽ bằng path bezier mềm, uốn éo theo thời gian
   ============================================================ */
const TENTACLES = [
  // [gốcX, gốcY, đỉnhX, đỉnhY, độ cong, pha, độ dày]
  { bx: 60,  by: 100, tx: 18,  ty: 62,  bend: -18, ph: 0.0, w: 9 },
  { bx: 140, by: 100, tx: 182, ty: 58,  bend: 18,  ph: 1.7, w: 9 },
  { bx: 62,  by: 128, tx: 20,  ty: 158, bend: -16, ph: 3.1, w: 8 },
  { bx: 138, by: 128, tx: 180, ty: 160, bend: 16,  ph: 4.4, w: 8 },
];

function tentaclePath(t, time, mood) {
  const speed = mood === 'happy' ? 2.6 : mood === 'sleepy' || mood === 'hibernating' ? 0.7 : 1.6;
  const amp = mood === 'happy' ? 8 : mood === 'sleepy' || mood === 'hibernating' ? 3 : 5;
  const wobbleX = Math.sin(time * speed + t.ph) * amp;
  const wobbleY = Math.cos(time * speed * 0.8 + t.ph) * amp * 0.6;
  const tx = t.tx + wobbleX;
  const ty = t.ty + wobbleY;

  const mx = (t.bx + tx) / 2;
  const my = (t.by + ty) / 2;
  const dx = tx - t.bx;
  const dy = ty - t.by;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * t.bend;
  const cy = my + ny * t.bend;

  const w = t.w;
  // tạo hình dạng xúc tu mềm: 2 mép song song
  const l1x = t.bx - nx * w;
  const l1y = t.by - ny * w;
  const l2x = tx - nx * (w * 0.6);
  const l2y = ty - ny * (w * 0.6);
  const r1x = t.bx + nx * w;
  const r1y = t.by + ny * w;
  const r2x = tx + nx * (w * 0.6);
  const r2y = ty + ny * (w * 0.6);

  return `
    M ${l1x} ${l1y}
    Q ${cx - nx * w} ${cy - ny * w} ${l2x} ${l2y}
    A ${w * 0.6} ${w * 0.6} 0 0 0 ${r2x} ${r2y}
    Q ${cx + nx * w} ${cy + ny * w} ${r1x} ${r1y}
    Z
  `;
}

/* ============================================================
   MẶT — mắt to tròn long lanh, tự chớp, có highlight
   ============================================================ */
function Face({ mood, blink, lookX = 0, lookY = 0 }) {
  const cy = CY - 6;
  const eyeGap = 14;

  // Mắt nhắm (chớp / ngủ)
  if (blink || mood === 'hibernating') {
    return (
      <>
        <path
          d={`M${CX - eyeGap - 5} ${cy} q5 4 10 0`}
          stroke="#0f172a"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M${CX + eyeGap - 5} ${cy} q5 4 10 0`}
          stroke="#0f172a"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        {mood !== 'hibernating' && (
          <path
            d={`M${CX - 6} ${cy + 12} q6 5 12 0`}
            stroke="#0f172a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </>
    );
  }

  // Mắt buồn ngủ (mí nặng)
  if (mood === 'sleepy') {
    return (
      <>
        <ellipse cx={CX - eyeGap} cy={cy + 1} rx="4.5" ry="2.4" fill="#0f172a" />
        <ellipse cx={CX + eyeGap} cy={cy + 1} rx="4.5" ry="2.4" fill="#0f172a" />
        <path
          d={`M${CX - 5} ${cy + 12} q5 2 10 0`}
          stroke="#0f172a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  // Mắt buồn
  if (mood === 'sad') {
    return (
      <>
        <circle cx={CX - eyeGap} cy={cy} r="4" fill="#0f172a" />
        <circle cx={CX + eyeGap} cy={cy} r="4" fill="#0f172a" />
        {/* long lanh */}
        <circle cx={CX - eyeGap + 1.4} cy={cy - 1.4} r="1.3" fill="#fff" />
        <circle cx={CX + eyeGap + 1.4} cy={cy - 1.4} r="1.3" fill="#fff" />
        {/* giọt nước mắt */}
        <path
          d={`M${CX + eyeGap + 6} ${cy + 2} q-2 5 0 7 q2 -2 0 -7`}
          fill="#60a5fa"
          opacity=".85"
        />
        {/* miệng buồn */}
        <path
          d={`M${CX - 6} ${cy + 14} q6 -5 12 0`}
          stroke="#0f172a"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      </>
    );
  }

  // Mắt vui (cười cong)
  if (mood === 'happy') {
    return (
      <>
        <path
          d={`M${CX - eyeGap - 5} ${cy + 2} q5 -6 10 0`}
          stroke="#0f172a"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M${CX + eyeGap - 5} ${cy + 2} q5 -6 10 0`}
          stroke="#0f172a"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        {/* miệng cười to */}
        <path
          d={`M${CX - 8} ${cy + 10} q8 10 16 0`}
          stroke="#0f172a"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        {/* má hồng */}
        <circle cx={CX - 20} cy={cy + 8} r="3.5" fill="#f9a8d4" opacity=".75" />
        <circle cx={CX + 20} cy={cy + 8} r="3.5" fill="#f9a8d4" opacity=".75" />
      </>
    );
  }

  // Mắt normal — to tròn, nhìn theo lookX/lookY
  return (
    <>
      <circle cx={CX - eyeGap} cy={cy} r="5" fill="#0f172a" />
      <circle cx={CX + eyeGap} cy={cy} r="5" fill="#0f172a" />
      {/* con ngươi sáng nhìn theo hướng */}
      <circle cx={CX - eyeGap + lookX} cy={cy + lookY} r="1.8" fill="#fff" />
      <circle cx={CX + eyeGap + lookX} cy={cy + lookY} r="1.8" fill="#fff" />
      {/* long lanh phụ */}
      <circle cx={CX - eyeGap + 1.5} cy={cy - 1.5} r="1" fill="#fff" opacity=".85" />
      <circle cx={CX + eyeGap + 1.5} cy={cy - 1.5} r="1" fill="#fff" opacity=".85" />
      <path
        d={`M${CX - 5} ${cy + 11} q5 5 10 0`}
        stroke="#0f172a"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

/* ============================================================
   PARTICLES theo mood
   ============================================================ */
function Particles({ mood }) {
  const particles = useMemo(() => {
    const items = [];
    if (mood === 'happy') {
      for (let i = 0; i < 6; i++) {
        items.push({
          id: i,
          type: 'heart',
          x: 40 + Math.random() * 120,
          delay: Math.random() * 3,
          duration: 3 + Math.random() * 2,
          size: 6 + Math.random() * 4,
        });
      }
      for (let i = 0; i < 4; i++) {
        items.push({
          id: 's' + i,
          type: 'sparkle',
          x: 30 + Math.random() * 140,
          y: 30 + Math.random() * 80,
          delay: Math.random() * 2,
          duration: 1.5 + Math.random() * 1,
        });
      }
    } else if (mood === 'sad') {
      for (let i = 0; i < 3; i++) {
        items.push({
          id: i,
          type: 'drop',
          x: 60 + Math.random() * 80,
          delay: Math.random() * 4,
          duration: 4 + Math.random() * 2,
        });
      }
    } else if (mood === 'hibernating') {
      for (let i = 0; i < 5; i++) {
        items.push({
          id: i,
          type: 'leaf',
          x: 20 + Math.random() * 160,
          delay: Math.random() * 5,
          duration: 5 + Math.random() * 3,
        });
      }
    } else if (mood === 'sleepy') {
      for (let i = 0; i < 3; i++) {
        items.push({
          id: i,
          type: 'zzz',
          x: 130 + Math.random() * 30,
          delay: i * 0.8,
          duration: 3,
        });
      }
    }
    return items;
  }, [mood]);

  if (!particles.length) return null;

  return (
    <>
      {particles.map((p) => {
        if (p.type === 'heart') {
          return (
            <g
              key={p.id}
              className="pet-particle pet-particle-heart"
              style={{
                animationDelay: p.delay + 's',
                animationDuration: p.duration + 's',
              }}
            >
              <path
                d={`M${p.x} 130
                    c-${p.size} -${p.size * 1.4} -${p.size * 2.4} -${p.size * 2} -${p.size * 2.4} -${p.size * 2.8}
                    c0 -${p.size * 0.9} ${p.size * 0.6} -${p.size * 1.5} ${p.size * 1.5} -${p.size * 1.5}
                    c${p.size * 0.4} 0 ${p.size * 0.8} ${p.size * 0.2} ${p.size * 0.9} ${p.size * 0.6}
                    c${p.size * 0.1} -${p.size * 0.4} ${p.size * 0.5} -${p.size * 0.6} ${p.size * 0.9} -${p.size * 0.6}
                    c${p.size * 0.9} 0 ${p.size * 1.5} ${p.size * 0.6} ${p.size * 1.5} ${p.size * 1.5}
                    c0 ${p.size * 0.8} -${p.size * 2.4} ${p.size * 1.4} -${p.size * 2.4} ${p.size * 2.8}z`}
                fill="#f472b6"
                opacity=".75"
              />
            </g>
          );
        }
        if (p.type === 'sparkle') {
          return (
            <g
              key={p.id}
              className="pet-particle pet-particle-sparkle"
              style={{
                animationDelay: p.delay + 's',
                animationDuration: p.duration + 's',
              }}
            >
              <path
                d={`M${p.x} ${p.y - 4} L${p.x + 1} ${p.y - 1} L${p.x + 4} ${p.y} L${p.x + 1} ${p.y + 1}
                    L${p.x} ${p.y + 4} L${p.x - 1} ${p.y + 1} L${p.x - 4} ${p.y} L${p.x - 1} ${p.y - 1} Z`}
                fill="#fef3c7"
              />
            </g>
          );
        }
        if (p.type === 'drop') {
          return (
            <g
              key={p.id}
              className="pet-particle pet-particle-drop"
              style={{
                animationDelay: p.delay + 's',
                animationDuration: p.duration + 's',
              }}
            >
              <ellipse cx={p.x} cy={130} rx="2.5" ry="4.5" fill="#60a5fa" opacity=".7" />
            </g>
          );
        }
        if (p.type === 'zzz') {
          return (
            <text
              key={p.id}
              x={p.x}
              y={60}
              className="pet-particle pet-particle-zzz"
              style={{
                animationDelay: p.delay + 's',
                animationDuration: p.duration + 's',
                font: '700 14px JetBrains Mono, monospace',
                fill: '#0f172a',
                opacity: 0,
              }}
            >
              Z
            </text>
          );
        }
        return (
          <g
            key={p.id}
            className="pet-particle pet-particle-leaf"
            style={{
              animationDelay: p.delay + 's',
              animationDuration: p.duration + 's',
            }}
          >
            <path
              d={`M${p.x} 40 q5 -7 10 0 q-5 7 -10 0z`}
              fill="#b7dc9a"
              opacity=".65"
            />
          </g>
        );
      })}
    </>
  );
}

/* ============================================================
   PET CHÍNH
   ============================================================ */
export default function Pet({ mini = false }) {
  const [s] = useLocalStorage('cs-streak', { last: '', n: 0, total: 0 });
  const [food] = useLocalStorage('cs-pet-food', 0);
  const [blink, setBlink] = useState(false);
  const [time, setTime] = useState(0);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const wrapRef = useRef(null);
  const prevStageRef = useRef(null);

  const total = Math.max(s.total || 0, s.n || 0);
  const live = liveStreak(s);
  const fed = s.last === dayKey();

  let st = 0;
  STAGES.forEach(([t], i) => {
    if (total >= t) st = i;
  });
  const next = STAGES[st + 1];
  const pct = next ? ((total - STAGES[st][0]) / (next[0] - STAGES[st][0])) * 100 : 100;
  const skin = getSkin(st);
  const mood = getMood(live, fed);

  /* Animation frame — chạy liên tục để xúc tu uốn éo */
  useEffect(() => {
    let raf;
    let start = performance.now();
    const tick = (now) => {
      setTime((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Chớp mắt */
  useEffect(() => {
    if (mood === 'hibernating' || mood === 'sleepy') return;
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 160);
        schedule();
      }, 2800 + Math.random() * 3200);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [mood]);

  /* Nhìn theo chuột */
  useEffect(() => {
    if (mini) return;
    const onMove = (e) => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 300);
      setLook({ x: (dx / d) * k * 1.2, y: (dy / d) * k * 1.2 });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [mini]);

  /* Detect level up */
  useEffect(() => {
    if (prevStageRef.current !== null && st > prevStageRef.current) {
      setJustLeveledUp(true);
      setTimeout(() => setJustLeveledUp(false), 2200);
    }
    prevStageRef.current = st;
  }, [st]);

  const gradientId = `cg-${mini ? 'mini' : 'full'}`;

  return (
    <div className={mini ? 'petmini' : 'card pet'} ref={wrapRef}>
      <svg
        viewBox="0 0 200 190"
        className={
          'crystal crystal-' + mood + (justLeveledUp ? ' crystal-levelup' : '')
        }
        role="img"
        aria-label={`Crystal: ${STAGES[st][1]} — ${MOODS[mood]}`}
      >
        <defs>
          <radialGradient id={gradientId + '-body'} cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor={skin.from} />
            <stop offset="0.55" stopColor={skin.mid} />
            <stop offset="1" stopColor={skin.to} />
          </radialGradient>
          <radialGradient id={gradientId + '-glow'}>
            <stop offset="0" stopColor={skin.glow} stopOpacity=".65" />
            <stop offset="1" stopColor={skin.glow} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={gradientId + '-aura'}>
            <stop offset="0" stopColor={skin.accent} stopOpacity=".5" />
            <stop offset="0.7" stopColor={skin.accent} stopOpacity=".08" />
            <stop offset="1" stopColor={skin.accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Aura glow phía sau */}
        <circle cx={CX} cy={CY} r="92" fill={`url(#${gradientId}-aura)`} className="crystal-aura" />

        {/* Vòng sáng khi happy */}
        {mood === 'happy' && (
          <circle cx={CX} cy={CY} r="80" fill={`url(#${gradientId}-glow)`} />
        )}

        {/* Bóng đổ dưới */}
        <ellipse cx={CX} cy={B + 6} rx="56" ry="7" fill="rgba(15,23,42,.16)" />

        {/* Particles phía sau thân */}
        <Particles mood={mood} />

        {/* ==== 4 XÚC TU ==== */}
        <g className="crystal-tentacles">
          {TENTACLES.map((t, i) => (
            <path
              key={i}
              d={tentaclePath(t, time, mood)}
              fill={`url(#${gradientId}-body)`}
              stroke="rgba(255,255,255,.55)"
              strokeWidth="0.9"
              opacity="0.92"
            />
          ))}
        </g>

        {/* ==== THÂN PHA LÊ ==== */}
        <g
          className={
            'crystal-body' +
            (mood === 'happy' ? ' crystal-body-bounce' : '') +
            (justLeveledUp ? ' crystal-body-levelup' : '')
          }
          style={{ transformOrigin: `${CX}px ${B}px` }}
        >
          {/* Thân ngoài — hình giọt nước / oval hơi nhọn trên */}
          <path
            d={`M${CX} 38
                C ${CX + 40} 40, ${CX + 56} 78, ${CX + 56} 118
                C ${CX + 56} 152, ${CX + 32} ${B}, ${CX} ${B}
                C ${CX - 32} ${B}, ${CX - 56} 152, ${CX - 56} 118
                C ${CX - 56} 78, ${CX - 40} 40, ${CX} 38 Z`}
            fill={`url(#${gradientId}-body)`}
            stroke="rgba(255,255,255,.75)"
            strokeWidth="1.4"
          />

          {/* Highlight chéo trên trái */}
          <path
            d={`M${CX - 30} 62 C ${CX - 18} 54, ${CX - 6} 58, ${CX - 2} 72
                C ${CX - 12} 70, ${CX - 24} 70, ${CX - 30} 62 Z`}
            fill="rgba(255,255,255,.55)"
          />
          {/* Highlight nhỏ */}
          <ellipse cx={CX + 22} cy={80} rx="4" ry="6" fill="rgba(255,255,255,.45)" />

          {/* Mặt */}
          <Face mood={mood} blink={blink} lookX={look.x} lookY={look.y} />
        </g>

        {/* ==== HIỆU ỨNG LEVEL UP ==== */}
        {justLeveledUp && (
          <g className="crystal-levelup-ring">
            <circle cx={CX} cy={CY} r="60" fill="none" stroke={skin.glow} strokeWidth="3" opacity=".9" />
            <circle cx={CX} cy={CY} r="60" fill="none" stroke={skin.from} strokeWidth="2" opacity=".7" />
          </g>
        )}

        {/* Zzz to khi ngủ đông */}
        {mood === 'hibernating' && (
          <>
            <text x="152" y="52" className="pet-zzz" style={{ animationDelay: '0s' }}>Z</text>
            <text x="162" y="36" className="pet-zzz" style={{ animationDelay: '0.4s' }}>Z</text>
            <text x="174" y="22" className="pet-zzz" style={{ animationDelay: '0.8s' }}>Z</text>
          </>
        )}
      </svg>

      {!mini && (
        <div className="petinfo">
          <h3>
            💎 Crystal — {STAGES[st][1]}{' '}
            <span className="pet-mood-badge" title={`Tâm trạng: ${mood}`}>
              {MOODS[mood]}
            </span>
          </h3>

          <p className="hint">
            {fed
              ? 'Hôm nay Crystal đã được nuôi 💖'
              : live
              ? 'Làm 1 quiz hoặc 1 phiên Pomodoro để giữ chuỗi!'
              : 'Crystal đang ngủ đông. Học hôm nay để đánh thức nó.'}
          </p>

          <div className="row" style={{ flexWrap: 'wrap', gap: '.4rem' }}>
            <span className="badge">🔥 {live} ngày liên tiếp</span>
            <span className="badge">📚 {total} ngày đã học</span>
            <span className="badge">🍎 {food} thức ăn</span>
          </div>

          <div className="bar" aria-label="Tiến độ lên cấp">
            <i style={{ width: pct + '%' }} />
          </div>
          <small className="hint">
            {next ? `Còn ${next[0] - total} ngày nữa để lên "${next[1]}"` : 'Đã đạt cấp cao nhất!'}
          </small>
        </div>
      )}
    </div>
  );
}