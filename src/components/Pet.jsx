import { useMemo, useEffect, useState, useRef } from 'react';
import { useLocalStorage, liveStreak, dayKey } from '../hooks.js';

export const STAGES = [
  [0, 'Tia lửa'],
  [1, 'Đốm lửa'],
  [3, 'Ngọn lửa nhỏ'],
  [7, 'Lửa trại'],
  [14, 'Lửa bập bùng'],
  [30, 'Lửa thiêng'],
];

const B = 172;      // đáy ngọn lửa
const CX = 100;     // tâm ngang
const CY = 100;     // tâm thân
const FACE_Y = 124; // cao độ khuôn mặt

/* Màu ngọn lửa theo cấp */
const SKINS = [
  { from: '#fef08a', mid: '#fdba74', to: '#f97316', edge: '#c2410c', glow: '#fdba74', accent: '#fde68a', atomN: '#3b82f6' }, // tia lửa
  { from: '#fef3c7', mid: '#fdba74', to: '#f97316', edge: '#b45309', glow: '#fb923c', accent: '#fde68a', atomN: '#3b82f6' }, // rực cam
  { from: '#fefce8', mid: '#fde047', to: '#f97316', edge: '#b45309', glow: '#fbbf24', accent: '#fef08a', atomN: '#2563eb' }, // vàng rực
];
const getSkin = (stage) => (stage >= 4 ? SKINS[2] : stage >= 2 ? SKINS[1] : SKINS[0]);
const getScale = (stage) => 0.78 + stage * 0.05; // 0.78 → 1.03

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
   PHÂN TỬ trên ngọn lửa — O (đỏ) và N (xanh), nối bằng liên kết
   ============================================================ */
const ATOMS = [
  { x: 58,  y: 128, t: 'O' }, { x: 66,  y: 106, t: 'N' }, { x: 60,  y: 84,  t: 'O' },
  { x: 80,  y: 66,  t: 'N' }, { x: 92,  y: 46,  t: 'O' }, { x: 114, y: 58,  t: 'N' },
  { x: 128, y: 78,  t: 'O' }, { x: 134, y: 104, t: 'N' }, { x: 146, y: 126, t: 'O' },
  { x: 140, y: 148, t: 'N' }, { x: 60,  y: 150, t: 'N' }, { x: 100, y: 84,  t: 'O' },
  { x: 84,  y: 100, t: 'O' }, { x: 118, y: 102, t: 'N' },
];
const BONDS = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[0,10],[3,11],[5,11],[1,12],[12,11],[11,13],[7,13]];
const ATOM_COUNT = [0, 4, 8, 11, 13, 14]; // số nguyên tử hiện theo cấp

/* ============================================================
   MẶT — mắt to tròn long lanh, má hồng, tự chớp
   ============================================================ */
const INK = '#2b1408';

function Face({ mood, blink, lookX = 0, lookY = 0 }) {
  const cy = FACE_Y;
  const eyeGap = 18;
  const stroke = { stroke: INK, fill: 'none', strokeLinecap: 'round' };
  const blush = (
    <>
      <ellipse cx={CX - 30} cy={cy + 8} rx="7" ry="4.5" fill="#f9739b" opacity=".55" />
      <ellipse cx={CX + 30} cy={cy + 8} rx="7" ry="4.5" fill="#f9739b" opacity=".55" />
    </>
  );

  if (blink || mood === 'hibernating') {
    return (
      <>
        <path d={`M${CX - eyeGap - 6} ${cy} q6 5 12 0`} strokeWidth="2.6" {...stroke} />
        <path d={`M${CX + eyeGap - 6} ${cy} q6 5 12 0`} strokeWidth="2.6" {...stroke} />
        {mood !== 'hibernating' && <path d={`M${CX - 6} ${cy + 10} q6 5 12 0`} strokeWidth="2.2" {...stroke} />}
        {blush}
      </>
    );
  }

  if (mood === 'sleepy') {
    return (
      <>
        <ellipse cx={CX - eyeGap} cy={cy + 1} rx="5.5" ry="2.6" fill={INK} />
        <ellipse cx={CX + eyeGap} cy={cy + 1} rx="5.5" ry="2.6" fill={INK} />
        <path d={`M${CX - 4} ${cy + 11} q4 2 8 0`} strokeWidth="2" {...stroke} />
        {blush}
      </>
    );
  }

  if (mood === 'sad') {
    return (
      <>
        <circle cx={CX - eyeGap} cy={cy} r="5.5" fill={INK} />
        <circle cx={CX + eyeGap} cy={cy} r="5.5" fill={INK} />
        <circle cx={CX - eyeGap + 1.8} cy={cy - 1.8} r="1.9" fill="#fff" />
        <circle cx={CX + eyeGap + 1.8} cy={cy - 1.8} r="1.9" fill="#fff" />
        <path d={`M${CX + eyeGap + 5} ${cy + 4} q-3 6 0 9 q3 -3 0 -9`} fill="#60a5fa" opacity=".9" />
        <path d={`M${CX - 6} ${cy + 14} q6 -6 12 0`} strokeWidth="2.4" {...stroke} />
        {blush}
      </>
    );
  }

  if (mood === 'happy') {
    return (
      <>
        <path d={`M${CX - eyeGap - 6} ${cy + 2} q6 -8 12 0`} strokeWidth="3" {...stroke} />
        <path d={`M${CX + eyeGap - 6} ${cy + 2} q6 -8 12 0`} strokeWidth="3" {...stroke} />
        <path d={`M${CX - 9} ${cy + 9} q9 11 18 0 z`} fill="#7c2d12" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d={`M${CX - 4} ${cy + 15} q4 -3 8 0`} stroke="#f87171" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {blush}
      </>
    );
  }
  return (
    <>
      <circle cx={CX - eyeGap} cy={cy} r="6" fill={INK} />
      <circle cx={CX + eyeGap} cy={cy} r="6" fill={INK} />
      <circle cx={CX - eyeGap + 1.8 + lookX} cy={cy - 2 + lookY} r="2.1" fill="#fff" />
      <circle cx={CX + eyeGap + 1.8 + lookX} cy={cy - 2 + lookY} r="2.1" fill="#fff" />
      <circle cx={CX - eyeGap - 1.6} cy={cy + 2} r="1" fill="#fff" opacity=".8" />
      <circle cx={CX + eyeGap - 1.6} cy={cy + 2} r="1" fill="#fff" opacity=".8" />
      <path d={`M${CX - 6} ${cy + 10} q6 6 12 0`} strokeWidth="2.4" {...stroke} />
      {blush}
    </>
  );
}

/* ============================================================
   THÂN LỬA — đường viền bập bùng theo thời gian
   ============================================================ */
function flamePath(time, mood) {
  const calm = mood === 'sleepy' || mood === 'hibernating';
  const speed = mood === 'happy' ? 4.2 : calm ? 1.2 : 2.6;
  const amp = mood === 'happy' ? 1.5 : calm ? 0.5 : 1;
  const tipX = CX + Math.sin(time * speed) * 4 * amp;
  const tipY = 26 + Math.sin(time * speed * 1.3) * 3 * amp;
  const lt = Math.sin(time * speed * 1.7 + 1) * 3 * amp; // lưỡi trái
  const rt = Math.sin(time * speed * 1.5 + 2) * 3 * amp; // lưỡi phải

  return `
    M ${CX} ${B}
    C 64 ${B}, 42 150, 42 122
    C 42 110, 46 102, 50 ${96 + lt}
    C 54 ${102 + lt}, 58 108, 62 110
    C 58 84, 74 62, 90 46
    C 96 40, ${tipX - 2} ${tipY + 8}, ${tipX} ${tipY}
    C ${tipX + 4} ${tipY + 10}, 116 44, 122 54
    C 134 70, 140 88, 138 104
    C 142 102, 148 ${94 + rt}, 152 ${88 + rt}
    C 160 108, 160 136, 148 152
    C 138 166, 120 ${B}, ${CX} ${B} Z
  `;
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
                fill="#fbbf24"
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
              fill="#a8a29e"
              opacity=".65"
            />
          </g>
        );
      })}
    </>
  );
}

/* ============================================================
   KHÚC GỖ — chỗ ngọn lửa ngồi
   ============================================================ */
function Log({ id }) {
  return (
    <g>
      <rect x="42" y="158" width="118" height="28" rx="13" fill={`url(#${id}-wood)`} stroke="#6b3f1d" strokeWidth="1.6" />
      <path d="M70 166 q10 -3 22 0 M108 176 q14 3 28 -1 M120 164 q8 -2 18 0" stroke="#7a4a22" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".6" />
      {/* mặt cắt có vân tròn */}
      <ellipse cx="46" cy="172" rx="12" ry="15" fill="#f0c58a" stroke="#6b3f1d" strokeWidth="1.6" />
      <path d="M46 172 m0 0 a2 2 0 1 1 3 2 a5 5 0 1 1 -7 -4 a8 8 0 1 1 10 8" fill="none" stroke="#a5672f" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

/* ============================================================
   PHÂN TỬ GLUCOSE — ngọn lửa ôm trước ngực
   ============================================================ */
function Molecule({ x, y }) {
  const r = 9;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  });
  const colors = ['#ef4444', '#5b8fa8', '#5b8fa8', '#5b8fa8', '#5b8fa8', '#5b8fa8'];
  return (
    <g>
      <circle cx={x} cy={y} r="15" fill="#fff" opacity=".35" />
      <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#5b8fa8" strokeWidth="1.6" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === 0 ? 2.6 : 2.2} fill={colors[i]} stroke="#fff" strokeWidth=".6" />
      ))}
      <line x1={pts[3][0]} y1={pts[3][1]} x2={pts[3][0] - 3} y2={pts[3][1] + 6} stroke="#5b8fa8" strokeWidth="1.2" />
      <line x1={pts[5][0]} y1={pts[5][1]} x2={pts[5][0] + 3} y2={pts[5][1] - 7} stroke="#5b8fa8" strokeWidth="1.2" />
    </g>
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
  const moodK = mood === 'hibernating' ? 0.72 : mood === 'sleepy' ? 0.88 : mood === 'sad' ? 0.94 : 1;
  const scale = getScale(st) * moodK;
  const atomN = mood === 'hibernating' ? Math.min(ATOM_COUNT[st], 4) : ATOM_COUNT[st];

  /* Animation frame — ngọn lửa bập bùng */
  useEffect(() => {
    let raf;
    const start = performance.now();
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
      setLook({ x: (dx / d) * k * 1.4, y: (dy / d) * k * 1.4 });
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

  const gid = `fl-${mini ? 'mini' : 'full'}`;
  const dropY = Math.sin(time * 2.2) * 3;
  const flameTf = `translate(${CX} ${B}) scale(${scale}) translate(${-CX} ${-B})`;
  const glowing = mood !== 'hibernating';

  return (
    <div className={mini ? 'petmini' : 'card pet'} ref={wrapRef}>
      <svg
        viewBox="0 0 200 190"
        className={'crystal crystal-' + mood + (justLeveledUp ? ' crystal-levelup' : '')}
        role="img"
        aria-label={`Ember: ${STAGES[st][1]} — ${MOODS[mood]}`}
      >
        <defs>
          <radialGradient id={gid + '-body'} cx="0.5" cy="0.62" r="0.62">
            <stop offset="0" stopColor={skin.from} />
            <stop offset="0.5" stopColor={skin.mid} />
            <stop offset="1" stopColor={skin.to} />
          </radialGradient>
          <radialGradient id={gid + '-core'}>
            <stop offset="0" stopColor="#fffbeb" stopOpacity=".9" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={gid + '-aura'}>
            <stop offset="0" stopColor={skin.glow} stopOpacity=".55" />
            <stop offset="0.65" stopColor={skin.accent} stopOpacity=".12" />
            <stop offset="1" stopColor={skin.accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={gid + '-wood'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c98a4b" />
            <stop offset="1" stopColor="#8a552a" />
          </linearGradient>
        </defs>

        {/* Hào quang */}
        {glowing && (
          <circle cx={CX} cy={CY + 14} r="94" fill={`url(#${gid}-aura)`} className="crystal-aura" />
        )}

        {/* Bóng đổ */}
        <ellipse cx={CX} cy={188} rx="66" ry="5" fill="rgba(15,23,42,.18)" />

        {/* Particles */}
        <Particles mood={mood} />

        {/* ==== NGỌN LỬA ==== */}
        <g className={'crystal-body' + (mood === 'happy' ? ' crystal-body-bounce' : '') + (justLeveledUp ? ' crystal-body-levelup' : '')}
           style={{ transformOrigin: `${CX}px ${B}px` }}>
          <g transform={flameTf}>
            {/* giọt lửa nhỏ bay bên cạnh */}
            {mood !== 'hibernating' && st >= 1 && (
              <path
                d={`M62 ${58 + dropY} q-9 -12 2 -26 q1 10 7 14 q4 6 -9 12 z`}
                fill={skin.to}
                stroke={skin.edge}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            )}

            {/* thân */}
            <path
              d={flamePath(time, mood)}
              fill={`url(#${gid}-body)`}
              stroke={skin.edge}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* lõi sáng */}
            <ellipse cx={CX} cy={128} rx="44" ry="38" fill={`url(#${gid}-core)`} />
            {/* highlight */}
            <path d="M74 78 C 80 66, 88 60, 92 58 C 90 68, 84 76, 74 78 Z" fill="#fff" opacity=".45" />

            {/* mạng phân tử */}
            {atomN > 0 && (
              <g>
                {BONDS.map(([a, b], i) =>
                  a < atomN && b < atomN ? (
                    <line key={i} x1={ATOMS[a].x} y1={ATOMS[a].y} x2={ATOMS[b].x} y2={ATOMS[b].y}
                      stroke="#7c4a2a" strokeWidth="1.3" opacity=".7" />
                  ) : null
                )}
                {ATOMS.slice(0, atomN).map((a, i) =>
                  a.t === 'O' ? (
                    <circle key={i} cx={a.x} cy={a.y} r="5.2" fill="#ef4444" stroke="#991b1b" strokeWidth="1.6" />
                  ) : (
                    <g key={i}>
                      <circle cx={a.x} cy={a.y} r="4.6" fill={skin.atomN} stroke="#1e3a8a" strokeWidth="1.4" />
                      <text x={a.x} y={a.y + 2} textAnchor="middle" style={{ font: '700 5.5px system-ui, sans-serif', fill: '#fff' }}>N</text>
                    </g>
                  )
                )}
                {st >= 3 && mood !== 'hibernating' && (
                  <>
                    <text x="74" y="96" style={{ font: '600 7px system-ui, sans-serif', fill: '#7c2d12', opacity: .75 }}>CO₂</text>
                    <text x="106" y="108" style={{ font: '600 7px system-ui, sans-serif', fill: '#7c2d12', opacity: .75 }}>H₂O</text>
                  </>
                )}
              </g>
            )}

            {/* mặt */}
            <Face mood={mood} blink={blink} lookX={look.x} lookY={look.y} />
          </g>
        </g>

        {/* ==== KHÚC GỖ ==== */}
        <Log id={gid} />

        {/* ==== TAY ÔM PHÂN TỬ ==== */}
        {st >= 1 && mood !== 'hibernating' && (
          <g>
            <path d="M74 146 Q 84 158 92 156" stroke={skin.edge} strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M126 146 Q 116 158 108 156" stroke={skin.edge} strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M74 146 Q 84 158 92 156" stroke={skin.to} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M126 146 Q 116 158 108 156" stroke={skin.to} strokeWidth="4" fill="none" strokeLinecap="round" />
            <Molecule x={CX} y={156} />
          </g>
        )}

        {/* ==== LEVEL UP ==== */}
        {justLeveledUp && (
          <g className="crystal-levelup-ring">
            <circle cx={CX} cy={CY} r="60" fill="none" stroke={skin.glow} strokeWidth="3" opacity=".9" />
            <circle cx={CX} cy={CY} r="60" fill="none" stroke={skin.from} strokeWidth="2" opacity=".7" />
          </g>
        )}

        {/* Zzz khi ngủ đông */}
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
            🔥 Ember — {STAGES[st][1]}{' '}
            <span className="pet-mood-badge" title={`Tâm trạng: ${mood}`}>
              {MOODS[mood]}
            </span>
          </h3>

          <p className="hint">
            {fed
              ? 'Hôm nay Ember đã được nuôi 💖'
              : live
              ? 'Làm 1 quiz hoặc 1 phiên Pomodoro để giữ chuỗi!'
              : 'Ember đang ngủ đông. Học hôm nay để thắp lại ngọn lửa.'}
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