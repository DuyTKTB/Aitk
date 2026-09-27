import { useMemo, useEffect, useState } from 'react';
import { useLocalStorage, liveStreak, dayKey } from '../hooks.js';

export const STAGES = [
  [0, 'Hạt mầm'],
  [1, 'Tinh thể nhỏ'],
  [3, 'Cụm thạch anh'],
  [7, 'Pha lê'],
  [14, 'Cụm pha lê lớn'],
  [30, 'Kim cương'],
];

const SHARDS = [
  [100, 120, 26, 0],
  [66, 80, 18, -14],
  [134, 90, 20, 12],
  [42, 55, 13, -24],
  [158, 62, 14, 22],
  [84, 44, 10, -6],
];
const B = 170;

const SKINS = [
  { from: '#99f6e4', mid: '#2dd4bf', to: '#818cf8', glow: '#5eead4' },
  { from: '#f9a8d4', mid: '#f472b6', to: '#a855f7', glow: '#f9a8d4' },
  { from: '#fde68a', mid: '#f59e0b', to: '#ef4444', glow: '#fbbf24' },
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

/* ============ FACE với chớp mắt ============ */
function Face({ mood, blink }) {
  const cx = 100;
  const cy = B - 65;
  const eyeGap = 8;

  if (blink || mood === 'hibernating' || mood === 'sleepy') {
    return (
      <>
        <path d={`M${cx - eyeGap - 4} ${cy} h8`} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M${cx + eyeGap - 4} ${cy} h8`} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        {mood !== 'hibernating' && <circle cx={cx} cy={cy + 8} r="2.5" fill="#0f172a" />}
      </>
    );
  }
  if (mood === 'sad') {
    return (
      <>
        <circle cx={cx - eyeGap} cy={cy} r="3" fill="#0f172a" />
        <circle cx={cx + eyeGap} cy={cy} r="3" fill="#0f172a" />
        <path d={`M${cx + eyeGap + 4} ${cy + 4} q-2 6 0 8 q2 -2 0 -8`} fill="#60a5fa" opacity=".8" />
        <path d={`M${cx - 5} ${cy + 10} q5 -5 10 0`} stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (mood === 'happy') {
    return (
      <>
        <path d={`M${cx - eyeGap - 3} ${cy} q3 -3 6 0`} stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={`M${cx + eyeGap - 3} ${cy} q3 -3 6 0`} stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d={`M${cx - 6} ${cy + 8} q6 8 12 0`} stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx={cx - 13} cy={cy + 6} r="3" fill="#f9a8d4" opacity=".7" />
        <circle cx={cx + 13} cy={cy + 6} r="3" fill="#f9a8d4" opacity=".7" />
      </>
    );
  }
  return (
    <>
      <circle cx={cx - eyeGap} cy={cy} r="3" fill="#0f172a" />
      <circle cx={cx + eyeGap} cy={cy} r="3" fill="#0f172a" />
      <path d={`M${cx - 5} ${cy + 8} q5 4 10 0`} stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

/* ============ PARTICLES theo mood ============ */
function Particles({ mood }) {
  const particles = useMemo(() => {
    const items = [];
    if (mood === 'happy') {
      for (let i = 0; i < 5; i++) {
        items.push({
          id: i,
          type: 'heart',
          x: 30 + Math.random() * 140,
          delay: Math.random() * 3,
          duration: 3 + Math.random() * 2,
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
      for (let i = 0; i < 4; i++) {
        items.push({
          id: i,
          type: 'leaf',
          x: 20 + Math.random() * 160,
          delay: Math.random() * 5,
          duration: 5 + Math.random() * 3,
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
                d={`M${p.x} 140 c-4 -6 -12 -8 -12 -14 c0 -4 3 -7 7 -7 c2 0 4 1 5 3 c1 -2 3 -3 5 -3 c4 0 7 3 7 7 c0 6 -8 8 -12 14z`}
                fill="#f472b6"
                opacity=".7"
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
              <ellipse cx={p.x} cy={130} rx="2.5" ry="4" fill="#60a5fa" opacity=".6" />
            </g>
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
              d={`M${p.x} 40 q4 -6 8 0 q-4 6 -8 0z`}
              fill="#b7dc9a"
              opacity=".6"
            />
          </g>
        );
      })}
    </>
  );
}

export default function Pet({ mini = false }) {
  const [s] = useLocalStorage('cs-streak', { last: '', n: 0, total: 0 });
  const [food] = useLocalStorage('cs-pet-food', 0);
  const [blink, setBlink] = useState(false);
  const [bounce, setBounce] = useState(0);

  const total = Math.max(s.total || 0, s.n || 0);
  const live = liveStreak(s);
  const fed = s.last === dayKey();

  let st = 0;
  STAGES.forEach(([t], i) => {
    if (total >= t) st = i;
  });
  const next = STAGES[st + 1];
  const pct = next ? ((total - STAGES[st][0]) / (next[0] - STAGES[st][0])) * 100 : 100;
  const shards = SHARDS.slice(0, Math.min(6, st + 1));
  const skin = getSkin(st);
  const mood = getMood(live, fed);

  /* Chớp mắt tự động */
  useEffect(() => {
    if (mood === 'hibernating' || mood === 'sleepy') return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [mood]);

  /* Nhún nhảy khi vui */
  useEffect(() => {
    if (mood !== 'happy') return;
    const interval = setInterval(() => {
      setBounce((b) => b + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [mood]);

  const gradientId = `cg-${mini ? 'mini' : 'full'}`;

  return (
    <div className={mini ? 'petmini' : 'card pet'}>
      <svg
        viewBox="0 0 200 190"
        className={'crystal crystal-' + mood}
        role="img"
        aria-label={`Crystal: ${STAGES[st][1]} — ${MOODS[mood]}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={skin.from} />
            <stop offset=".55" stopColor={skin.mid} />
            <stop offset="1" stopColor={skin.to} />
          </linearGradient>
          <radialGradient id={gradientId + '-glow'}>
            <stop offset="0" stopColor={skin.glow} stopOpacity=".6" />
            <stop offset="1" stopColor={skin.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        {mood === 'happy' && (
          <circle cx="100" cy={B - 60} r="80" fill={`url(#${gradientId}-glow)`} />
        )}

        <ellipse cx="100" cy="176" rx="70" ry="8" fill="rgba(0,0,0,.18)" />

        {/* Particles behind */}
        <Particles mood={mood} />

        {[...shards].reverse().map(([x, h, w, r], i, a) => {
          const main = i === a.length - 1;
          const hh = main && st === 0 ? h * 0.3 : h;
          const points = [
            [x, B],
            [x - w, B - hh * 0.25],
            [x - w * 0.7, B - hh * 0.85],
            [x, B - hh],
            [x + w * 0.7, B - hh * 0.85],
            [x + w, B - hh * 0.25],
          ].map((q) => q.join(',')).join(' ');

          return (
            <g
              key={x}
              transform={`rotate(${r} ${x} ${B})`}
              className={main && mood === 'happy' ? 'crystal-bounce' : ''}
            >
              <polygon
                points={points}
                fill={`url(#${gradientId})`}
                stroke="rgba(255,255,255,.7)"
                strokeWidth="1.5"
                opacity={main ? 1 : 0.85}
              />
              <polygon
                points={`${x},${B} ${x - w * 0.3},${B - hh * 0.9} ${x},${B - hh} ${x + w * 0.7},${B - hh * 0.85}`}
                fill="rgba(255,255,255,.22)"
              />
              {main && <Face mood={mood} blink={blink} />}
            </g>
          );
        })}

        {/* Sparkles khi happy */}
        {mood === 'happy' &&
          [
            [40, 60],
            [165, 40],
            [150, 110],
          ].map(([x, y], i) => (
            <circle
              key={i}
              className="spark"
              cx={x}
              cy={y}
              r="2.5"
              fill="#fff"
              style={{ animationDelay: i * 0.6 + 's' }}
            />
          ))}

        {/* Zzz khi ngủ */}
        {(mood === 'hibernating' || mood === 'sleepy') && (
          <>
            <text x="150" y="50" className="pet-zzz" style={{ animationDelay: '0s' }}>Z</text>
            <text x="160" y="35" className="pet-zzz" style={{ animationDelay: '0.4s' }}>Z</text>
            <text x="172" y="22" className="pet-zzz" style={{ animationDelay: '0.8s' }}>Z</text>
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