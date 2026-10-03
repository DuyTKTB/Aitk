/* ============================================================
   PetSkins.jsx — 3 nhân vật mới: Băng, Lá, Nước
   Cùng style với Pet.jsx (lửa) — có mood, particles, level
   ============================================================ */

const B = 172;
const CX = 100;
const CY = 100;
const FACE_Y = 124;
const INK = '#0f172a';

/* ---------- MẶT DÙNG CHUNG ---------- */
function Face({ mood, blink, lookX = 0, lookY = 0, ink = INK, blushColor = '#f9739b' }) {
  const cy = FACE_Y;
  const gap = 18;
  const stroke = { stroke: ink, fill: 'none', strokeLinecap: 'round' };
  const blush = (
    <>
      <ellipse cx={CX - 30} cy={cy + 8} rx="7" ry="4.5" fill={blushColor} opacity=".55" />
      <ellipse cx={CX + 30} cy={cy + 8} rx="7" ry="4.5" fill={blushColor} opacity=".55" />
    </>
  );

  if (blink || mood === 'hibernating') {
    return (
      <>
        <path d={`M${CX - gap - 6} ${cy} q6 5 12 0`} strokeWidth="2.6" {...stroke} />
        <path d={`M${CX + gap - 6} ${cy} q6 5 12 0`} strokeWidth="2.6" {...stroke} />
        {mood !== 'hibernating' && <path d={`M${CX - 6} ${cy + 10} q6 5 12 0`} strokeWidth="2.2" {...stroke} />}
        {blush}
      </>
    );
  }

  if (mood === 'sleepy') {
    return (
      <>
        <ellipse cx={CX - gap} cy={cy + 1} rx="5.5" ry="2.6" fill={ink} />
        <ellipse cx={CX + gap} cy={cy + 1} rx="5.5" ry="2.6" fill={ink} />
        <path d={`M${CX - 4} ${cy + 11} q4 2 8 0`} strokeWidth="2" {...stroke} />
        {blush}
      </>
    );
  }

  if (mood === 'sad') {
    return (
      <>
        <circle cx={CX - gap} cy={cy} r="5.5" fill={ink} />
        <circle cx={CX + gap} cy={cy} r="5.5" fill={ink} />
        <circle cx={CX - gap + 1.8} cy={cy - 1.8} r="1.9" fill="#fff" />
        <circle cx={CX + gap + 1.8} cy={cy - 1.8} r="1.9" fill="#fff" />
        <path d={`M${CX + gap + 5} ${cy + 4} q-3 6 0 9 q3 -3 0 -9`} fill="#60a5fa" opacity=".9" />
        <path d={`M${CX - 6} ${cy + 14} q6 -6 12 0`} strokeWidth="2.4" {...stroke} />
        {blush}
      </>
    );
  }

  if (mood === 'happy') {
    return (
      <>
        <path d={`M${CX - gap - 6} ${cy + 2} q6 -8 12 0`} strokeWidth="3" {...stroke} />
        <path d={`M${CX + gap - 6} ${cy + 2} q6 -8 12 0`} strokeWidth="3" {...stroke} />
        <path d={`M${CX - 9} ${cy + 9} q9 11 18 0 z`} fill={ink} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        {blush}
      </>
    );
  }

  return (
    <>
      <circle cx={CX - gap} cy={cy} r="6" fill={ink} />
      <circle cx={CX + gap} cy={cy} r="6" fill={ink} />
      <circle cx={CX - gap + 1.8 + lookX} cy={cy - 2 + lookY} r="2.1" fill="#fff" />
      <circle cx={CX + gap + 1.8 + lookX} cy={cy - 2 + lookY} r="2.1" fill="#fff" />
      <path d={`M${CX - 6} ${cy + 10} q6 6 12 0`} strokeWidth="2.4" {...stroke} />
      {blush}
    </>
  );
}

/* ============================================================
   1. BĂNG — viên băng lục giác, xanh ngọc
   ============================================================ */
export function IcePet({ mood = 'normal', time = 0, blink = false, look = { x: 0, y: 0 }, scale = 1, justLeveledUp = false }) {
  const gid = 'ice-pet';
  const sway = Math.sin(time * 1.5) * 2;

  return (
    <svg viewBox="0 0 200 190" className={'crystal crystal-ice crystal-' + mood}>
      <defs>
        <linearGradient id={gid + '-body'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="0.5" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <radialGradient id={gid + '-shine'}>
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gid + '-aura'}>
          <stop offset="0" stopColor="#7dd3fc" stopOpacity=".5" />
          <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hào quang */}
      <circle cx={CX} cy={CY + 14} r="90" fill={`url(#${gid}-aura)`} className="crystal-aura" />

      {/* Bóng */}
      <ellipse cx={CX} cy={188} rx="60" ry="5" fill="rgba(15,23,42,.18)" />

      {/* Thân băng — lục giác */}
      <g className={'crystal-body' + (mood === 'happy' ? ' crystal-body-bounce' : '')} style={{ transformOrigin: `${CX}px ${B}px` }}>
        <g transform={`translate(${sway} 0) scale(${scale})`}>
          <polygon
            points="100,20 145,55 165,110 145,165 100,185 55,165 35,110 55,55"
            fill={`url(#${gid}-body)`}
            stroke="#0369a1"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Highlight bên trái */}
          <path d="M60 60 L75 45 L95 35 L92 65 L70 85 Z" fill={`url(#${gid}-shine)`} opacity=".7" />
          {/* Vệt sáng dọc */}
          <path d="M100 30 L100 180" stroke="#fff" strokeWidth="1.5" opacity=".3" />
          {/* Tinh thể nhỏ bên trong */}
          <polygon points="85,80 95,72 105,80 95,95" fill="#fff" opacity=".35" />
          <polygon points="110,120 120,115 125,128 115,135" fill="#fff" opacity=".25" />
          {/* Mặt */}
          <Face mood={mood} blink={blink} lookX={look.x} lookY={look.y} blushColor="#bae6fd" />
        </g>
      </g>

      {/* Level up */}
      {justLeveledUp && (
        <g className="crystal-levelup-ring">
          <circle cx={CX} cy={CY} r="60" fill="none" stroke="#7dd3fc" strokeWidth="3" opacity=".9" />
        </g>
      )}

      {/* Zzz */}
      {mood === 'hibernating' && (
        <>
          <text x="152" y="52" className="pet-zzz" style={{ animationDelay: '0s' }}>Z</text>
          <text x="162" y="36" className="pet-zzz" style={{ animationDelay: '0.4s' }}>Z</text>
          <text x="174" y="22" className="pet-zzz" style={{ animationDelay: '0.8s' }}>Z</text>
        </>
      )}
    </svg>
  );
}

/* ============================================================
   2. LÁ — sinh vật lá xanh, tròn như hạt đậu
   ============================================================ */
export function LeafPet({ mood = 'normal', time = 0, blink = false, look = { x: 0, y: 0 }, scale = 1, justLeveledUp = false }) {
  const gid = 'leaf-pet';
  const sway = Math.sin(time * 1.2) * 3;

  return (
    <svg viewBox="0 0 200 190" className={'crystal crystal-leaf crystal-' + mood}>
      <defs>
        <radialGradient id={gid + '-body'} cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#d9f99d" />
          <stop offset="0.5" stopColor="#84cc16" />
          <stop offset="1" stopColor="#3f6212" />
        </radialGradient>
        <radialGradient id={gid + '-aura'}>
          <stop offset="0" stopColor="#a3e635" stopOpacity=".5" />
          <stop offset="1" stopColor="#a3e635" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hào quang */}
      <circle cx={CX} cy={CY + 14} r="88" fill={`url(#${gid}-aura)`} className="crystal-aura" />

      {/* Bóng */}
      <ellipse cx={CX} cy="188" rx="58" ry="5" fill="rgba(15,23,42,.18)" />

      {/* Cuống lá trên đầu */}
      <path d="M100 22 Q105 10 118 5" stroke="#3f6212" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Thân — lá tròn nghiêng */}
      <g className={'crystal-body' + (mood === 'happy' ? ' crystal-body-bounce' : '')} style={{ transformOrigin: `${CX}px ${B}px` }}>
        <g transform={`translate(${sway} 0) scale(${scale})`}>
          {/* Lá chính */}
          <path
            d="M100 30 C 150 30, 175 80, 170 120 C 165 165, 130 185, 100 185 C 70 185, 35 165, 30 120 C 25 80, 50 30, 100 30 Z"
            fill={`url(#${gid}-body)`}
            stroke="#365314"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Gân lá giữa */}
          <path d="M100 40 Q100 110 100 180" stroke="#365314" strokeWidth="1.8" opacity=".5" fill="none" />
          {/* Gân phụ */}
          <path d="M100 80 Q80 70 60 72" stroke="#365314" strokeWidth="1.4" opacity=".4" fill="none" />
          <path d="M100 80 Q120 70 140 72" stroke="#365314" strokeWidth="1.4" opacity=".4" fill="none" />
          <path d="M100 120 Q80 115 55 120" stroke="#365314" strokeWidth="1.4" opacity=".4" fill="none" />
          <path d="M100 120 Q120 115 145 120" stroke="#365314" strokeWidth="1.4" opacity=".4" fill="none" />
          {/* Highlight */}
          <ellipse cx="75" cy="65" rx="20" ry="14" fill="#fff" opacity=".25" transform="rotate(-25 75 65)" />
          {/* Mặt */}
          <Face mood={mood} blink={blink} lookX={look.x} lookY={look.y} ink="#1a2e05" blushColor="#fca5a5" />
        </g>
      </g>

      {justLeveledUp && (
        <g className="crystal-levelup-ring">
          <circle cx={CX} cy={CY} r="60" fill="none" stroke="#a3e635" strokeWidth="3" opacity=".9" />
        </g>
      )}

      {mood === 'hibernating' && (
        <>
          <text x="152" y="52" className="pet-zzz" style={{ animationDelay: '0s' }}>Z</text>
          <text x="162" y="36" className="pet-zzz" style={{ animationDelay: '0.4s' }}>Z</text>
          <text x="174" y="22" className="pet-zzz" style={{ animationDelay: '0.8s' }}>Z</text>
        </>
      )}
    </svg>
  );
}

/* ============================================================
   3. NƯỚC — giọt nước trong suốt, xanh biển
   ============================================================ */
export function WaterPet({ mood = 'normal', time = 0, blink = false, look = { x: 0, y: 0 }, scale = 1, justLeveledUp = false }) {
  const gid = 'water-pet';
  const sway = Math.sin(time * 1.8) * 2;

  return (
    <svg viewBox="0 0 200 190" className={'crystal crystal-water crystal-' + mood}>
      <defs>
        <radialGradient id={gid + '-body'} cx="0.4" cy="0.3">
          <stop offset="0" stopColor="#cffafe" />
          <stop offset="0.4" stopColor="#67e8f9" />
          <stop offset="0.8" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#0e7490" />
        </radialGradient>
        <radialGradient id={gid + '-aura'}>
          <stop offset="0" stopColor="#67e8f9" stopOpacity=".5" />
          <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gid + '-shine'}>
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hào quang */}
      <circle cx={CX} cy={CY + 14} r="90" fill={`url(#${gid}-aura)`} className="crystal-aura" />

      {/* Bóng */}
      <ellipse cx={CX} cy="188" rx="55" ry="5" fill="rgba(15,23,42,.15)" />

      {/* Thân — giọt nước */}
      <g className={'crystal-body' + (mood === 'happy' ? ' crystal-body-bounce' : '')} style={{ transformOrigin: `${CX}px ${B}px` }}>
        <g transform={`translate(${sway} 0) scale(${scale})`}>
          <path
            d="M100 25 C 100 25, 40 95, 40 135 C 40 168, 68 185, 100 185 C 132 185, 160 168, 160 135 C 160 95, 100 25, 100 25 Z"
            fill={`url(#${gid}-body)`}
            stroke="#0e7490"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Highlight */}
          <ellipse cx="75" cy="120" rx="16" ry="26" fill={`url(#${gid}-shine)`} opacity=".7" />
          {/* Sóng lăn tăn */}
          <path d="M55 145 Q70 140 85 145" stroke="#fff" strokeWidth="1.5" opacity=".4" fill="none" strokeLinecap="round" />
          <path d="M60 155 Q75 150 90 155" stroke="#fff" strokeWidth="1.5" opacity=".3" fill="none" strokeLinecap="round" />
          {/* Bọt khí nhỏ */}
          <circle cx="130" cy="80" r="3" fill="#fff" opacity=".5" />
          <circle cx="140" cy="95" r="2" fill="#fff" opacity=".4" />
          <circle cx="120" cy="70" r="1.8" fill="#fff" opacity=".5" />
          {/* Mặt */}
          <Face mood={mood} blink={blink} lookX={look.x} lookY={look.y} ink="#083344" blushColor="#a5f3fc" />
        </g>
      </g>

      {justLeveledUp && (
        <g className="crystal-levelup-ring">
          <circle cx={CX} cy={CY} r="60" fill="none" stroke="#67e8f9" strokeWidth="3" opacity=".9" />
        </g>
      )}

      {mood === 'hibernating' && (
        <>
          <text x="152" y="52" className="pet-zzz" style={{ animationDelay: '0s' }}>Z</text>
          <text x="162" y="36" className="pet-zzz" style={{ animationDelay: '0.4s' }}>Z</text>
          <text x="174" y="22" className="pet-zzz" style={{ animationDelay: '0.8s' }}>Z</text>
        </>
      )}
    </svg>
  );
}

/* ============================================================
   CONFIG — Metadata cho 4 nhân vật
   ============================================================ */
export const PET_SKINS = {
  fire: {
    key: 'fire',
    name: 'Lửa',
    emoji: '🔥',
    color: '#f97316',
    bg: '#fff7ed',
    desc: 'Ấm áp, mạnh mẽ, tỏa sáng',
  },
  ice: {
    key: 'ice',
    name: 'Băng',
    emoji: '❄️',
    color: '#0ea5e9',
    bg: '#f0f9ff',
    desc: 'Lạnh lùng, tinh khôi, bình tĩnh',
  },
  leaf: {
    key: 'leaf',
    name: 'Lá',
    emoji: '🍃',
    color: '#84cc16',
    bg: '#f7fee7',
    desc: 'Tươi mát, kiên nhẫn, sinh sôi',
  },
  water: {
    key: 'water',
    name: 'Nước',
    emoji: '💧',
    color: '#06b6d4',
    bg: '#ecfeff',
    desc: 'Mềm mại, uyển chuyển, sâu sắc',
  },
};