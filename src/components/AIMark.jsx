import { useEffect, useId, useRef, useState } from 'react';

/* ============================================================
   AIMark.jsx — logo ELEC AI (bình hóa học + nguyên tử + sách mở)

   Props:
   size (px chiều rộng) · mode 'idle' | 'think' | 'talk' | 'success' | 'error' | 'orbit'
   look (parallax theo con trỏ) · animate · className
   effects 'full' | 'lite'  (mặc định: size < 56 → 'lite', còn lại 'full')

   Mode mới:
   • orbit — quả cầu phát sáng với electron quay xung quanh (dùng cho empty state)

   Hiệu ứng:
   • Chất lỏng đổi màu theo mode
   • Hạt nhân phát sáng + electron có đuôi sao chổi
   • Khói bốc từ miệng bình + vệt sáng quét qua kính
   • Ký hiệu hóa học bay lên từ sách
   • Chạm / click → sóng + tia sáng bắn ra
   ============================================================ */

const VB_W = 620;
const VB_H = 500;
const CX = 310;
const CY = 250;
const AY = CY - 20;
const MAX = 10;

const PALETTE = {
  idle: ['#8fd3ff', '#4a9bff', '#2f6bff'],
  think: ['#d2b8ff', '#9a74ff', '#5b3df0'],
  talk: ['#9af2ff', '#32c8f2', '#1f8fe0'],
  success: ['#a6f3c0', '#3fcf7a', '#1fa85a'],
  error: ['#ffc2c2', '#ff6b6b', '#e03a3a'],
  orbit: ['#b8d8ff', '#6aa8ff', '#3b82f6'],
};

const orbitPath = (rx, ry) =>
  `M${rx} 0A${rx} ${ry} 0 1 1 ${-rx} 0A${rx} ${ry} 0 1 1 ${rx} 0Z`;

const ORBITS = [
  { rx: 215, ry: 74, rot: 32, r: 15, dur: 11, begin: -2 },
  { rx: 215, ry: 74, rot: -32, r: 11, dur: 14, begin: -7 },
  { rx: 78, ry: 170, rot: 8, r: 9, dur: 17, begin: -10 },
];

/* Quỹ đạo tròn cho chế độ orbit */
const ORBIT_SPHERES = [
  { rx: 190, ry: 190, rot: 0, r: 8, dur: 9, begin: 0 },
  { rx: 190, ry: 190, rot: 0, r: 6, dur: 9, begin: -3 },
  { rx: 190, ry: 190, rot: 0, r: 5, dur: 9, begin: -6 },
  { rx: 240, ry: 240, rot: 0, r: 5, dur: 13, begin: -2 },
  { rx: 240, ry: 240, rot: 0, r: 4, dur: 13, begin: -8 },
];

const SYMBOLS = [
  { s: 'H₂O', x: 188, d: 5.2 },
  { s: 'π', x: 252, d: 4.6 },
  { s: 'Σ', x: 368, d: 5.6 },
  { s: 'e⁻', x: 432, d: 4.9 },
];

const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { dx: Math.cos(a) * 170, dy: Math.sin(a) * 130 };
});

const comet = (R, n, span, phase) =>
  Array.from({ length: n }, (_, i) => {
    const f = i / (n - 1);
    const a = phase + (f - 1) * span;
    return {
      x: CX + R * Math.cos(a),
      y: AY + R * Math.sin(a),
      r: 2.5 + f * 7.5,
      o: 0.1 + f * 0.9,
    };
  });

const THINK_RINGS = [
  { R: 168, dur: 2.8, dir: 1, parts: comet(168, 12, 1.5 * Math.PI * 0.55, 0) },
  { R: 168, dur: 2.8, dir: 1, parts: comet(168, 12, 1.5 * Math.PI * 0.55, Math.PI) },
  { R: 118, dur: 3.6, dir: -1, parts: comet(118, 9, Math.PI * 0.7, Math.PI / 2) },
];

export default function AIMark({
  size = 64,
  mode = 'idle',
  look = false,
  animate = true,
  effects,
  className = '',
  style,
  onPointerDown,
  ...rest
}) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef(null);
  const atomRef = useRef(null);
  const flaskRef = useRef(null);
  const [burst, setBurst] = useState(null);
  const [modeT, setModeT] = useState(0);

  const isOrbit = mode === 'orbit';
  const full = (effects ? effects === 'full' : size >= 56) && animate;

  const now = () => {
    try {
      return svgRef.current?.getCurrentTime?.() ?? 0;
    } catch {
      return 0;
    }
  };

  const fire = () => {
    if (!animate) return;
    setBurst((b) => ({ n: (b?.n ?? 0) + 1, t0: now() }));
  };

  useEffect(() => {
    setModeT(now());
    if (mode === 'success') fire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* Parallax */
  useEffect(() => {
    if (!look || !animate || typeof window === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const cur = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };
    let raf = 0;
    let timer = 0;

    const paint = () => {
      raf = 0;
      cur.x += (tgt.x - cur.x) * 0.16;
      cur.y += (tgt.y - cur.y) * 0.16;
      atomRef.current?.setAttribute('transform', `translate(${cur.x.toFixed(2)} ${cur.y.toFixed(2)})`);
      flaskRef.current?.setAttribute(
        'transform',
        `translate(${(cur.x * -0.3).toFixed(2)} ${(cur.y * -0.3).toFixed(2)})`
      );
      if (Math.abs(tgt.x - cur.x) > 0.05 || Math.abs(tgt.y - cur.y) > 0.05) raf = requestAnimationFrame(paint);
    };

    const aim = (x, y) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const d = Math.hypot(x, y) || 1;
      const s = Math.min(d, MAX) / d;
      tgt.x = x * s;
      tgt.y = y * s;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      if (r.width < 2) return;
      const dx = e.clientX - (r.left + (r.width * CX) / VB_W);
      const dy = e.clientY - (r.top + (r.height * CY) / VB_H);
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, d / 300) * MAX;
      aim((dx / d) * f, (dy / d) * f);
    };

    if (!coarse) {
      window.addEventListener('pointermove', onMove, { passive: true });
    } else {
      timer = window.setInterval(() => {
        aim((Math.random() - 0.5) * 2 * 8, (Math.random() - 0.5) * 2 * 6);
      }, 2800);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.clearInterval(timer);
      cancelAnimationFrame(raf);
    };
  }, [look, animate]);

  const fast = mode === 'talk';
  const busy = mode === 'think' || fast;
  const k = fast ? 0.45 : busy ? 0.65 : 1;
  const t = (s) => `${(s * k).toFixed(2)}s`;
  const pal = PALETTE[mode] || PALETTE.idle;

  const h = Math.round((size * VB_H) / VB_W);
  const id = (n) => `${uid}-${n}`;
  const stopStyle = (c) => ({ stopColor: c, transition: 'stop-color .7s ease' });

  const flaskPath =
    'M291 108V206L218 322C205 344 213 366 238 372C275 382 345 382 382 372C407 366 415 344 402 322L329 206V108Z';

  const orbitsToRender = isOrbit ? ORBIT_SPHERES : ORBITS;

  const Wing = () => (
    <>
      <path
        d="M70 410C72 403 100 402 114 408L152 462C161 474 178 473 195 468C238 454 280 454 306 476L300 480C270 464 232 464 198 476C172 484 142 488 128 477C105 452 86 430 70 410Z"
        fill={`url(#${id('cover')})`}
      />
      <path
        d="M308 478C276 430 222 396 140 384C154 406 170 426 186 442C232 434 276 442 308 478Z"
        fill={`url(#${id('page')})`}
      />
      <path
        d="M140 384C175 392 215 408 250 430"
        fill="none"
        stroke="#fff"
        strokeOpacity=".55"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  );

  return (
    <svg
      ref={svgRef}
      className={`ai-mark${look ? ' look' : ''}${className ? ' ' + className : ''}`}
      width={size}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Trợ lý AI"
      style={{ overflow: 'hidden', touchAction: 'manipulation', ...style }}
      onPointerDown={(e) => {
        fire();
        onPointerDown?.(e);
      }}
      {...rest}
    >
      <defs>
        <linearGradient id={id('liquid')} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" style={stopStyle(pal[0])} />
          <stop offset="50%" style={stopStyle(pal[1])} />
          <stop offset="100%" style={stopStyle(pal[2])} />
        </linearGradient>
        <linearGradient id={id('glass')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".85" />
          <stop offset="100%" stopColor="#cfe4ff" stopOpacity=".35" />
        </linearGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b9d8ff" />
          <stop offset="100%" stopColor="#7fb0ff" />
        </linearGradient>
        <linearGradient id={id('page')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7fd0ff" />
          <stop offset="55%" stopColor="#4a9bff" />
          <stop offset="100%" stopColor="#2f78f0" />
        </linearGradient>
        <linearGradient id={id('cover')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c3d3ff" />
          <stop offset="100%" stopColor="#8fb0ff" />
        </linearGradient>
        <radialGradient id={id('ball')} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#bfe0ff" />
          <stop offset="55%" stopColor="#4f9bff" />
          <stop offset="100%" stopColor="#2f6bff" />
        </radialGradient>
        <radialGradient id={id('glow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5aa5ff" stopOpacity=".28" />
          <stop offset="100%" stopColor="#5aa5ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('nuc')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={stopStyle(pal[0])} stopOpacity=".95" />
          <stop offset="100%" style={stopStyle(pal[1])} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('floor')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={stopStyle(pal[1])} stopOpacity=".45" />
          <stop offset="100%" style={stopStyle(pal[1])} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('orbCore')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset="30%" style={stopStyle(pal[0])} stopOpacity=".7" />
          <stop offset="100%" style={stopStyle(pal[2])} stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('clip')}>
          <path d={flaskPath} />
        </clipPath>
      </defs>

      {/* Quầng sáng nền — to hơn khi orbit */}
      <circle cx={CX} cy={CY} r={isOrbit ? 280 : 230} fill={`url(#${id('glow')})`}>
        {animate && <animate attributeName="opacity" values=".65;1;.65" dur={t(isOrbit ? 3.5 : 5)} repeatCount="indefinite" />}
      </circle>

      {/* Quả cầu năng lượng cho mode orbit */}
      {isOrbit && (
        <circle cx={CX} cy={AY} r="120" fill={`url(#${id('orbCore')})`} opacity=".6">
          {animate && (
            <animate attributeName="r" values="110;130;110" dur="3.5s" repeatCount="indefinite" />
          )}
        </circle>
      )}

      {/* Nguyên tử */}
      <g ref={atomRef}>
        <g transform={`translate(${CX} ${AY})`}>
          {orbitsToRender.map((o, i) => (
            <g key={i} transform={`rotate(${o.rot})`}>
              {!isOrbit && (
                <ellipse rx={o.rx} ry={o.ry} fill="none" stroke="#6aa8ff" strokeOpacity=".5" strokeWidth="3" />
              )}
              {isOrbit && (
                <ellipse rx={o.rx} ry={o.ry} fill="none" stroke={pal[1]} strokeOpacity=".15" strokeWidth="1.5" strokeDasharray="3 6" />
              )}
              {full && !isOrbit &&
                [3, 2, 1].map((j) => (
                  <circle key={j} r={Math.max(2, o.r * (1 - j * 0.2))} fill={`url(#${id('ball')})`} opacity={0.42 - j * 0.09}>
                    <animateMotion
                      path={orbitPath(o.rx, o.ry)}
                      dur={t(o.dur)}
                      begin={`${(o.begin + j * 0.22).toFixed(2)}s`}
                      repeatCount="indefinite"
                      rotate="0"
                    />
                  </circle>
                ))}
              <circle
                r={o.r}
                fill={`url(#${id('ball')})`}
                opacity={isOrbit ? 0.85 : 0.92}
              >
                {animate && (
                  <animateMotion
                    path={orbitPath(o.rx, o.ry)}
                    dur={`${o.dur}s`}
                    begin={`${o.begin}s`}
                    repeatCount="indefinite"
                    rotate="0"
                  />
                )}
              </circle>
            </g>
          ))}

          {/* Hạt nhân phát sáng */}
          <circle r={isOrbit ? 42 : 34} fill={`url(#${id('nuc')})`}>
            {animate && (
              <animate
                attributeName="r"
                values={isOrbit ? '36;50;36' : '26;42;26'}
                dur={t(2.2)}
                repeatCount="indefinite"
              />
            )}
          </circle>
        </g>

        {/* Hạt nhỏ trôi */}
        {[
          [78, 288, 9, 4],
          [548, 268, 8, 5],
          [122, 196, 7, 6],
          [500, 340, 5, 4.5],
        ].map(([x, y, r, d], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id('ball')})`} opacity=".75">
            {animate && (
              <animate attributeName="cy" values={`${y};${y - 8};${y}`} dur={t(d)} begin={`${-i}s`} repeatCount="indefinite" />
            )}
          </circle>
        ))}
      </g>

      {/* Bình hóa học */}
      <g ref={flaskRef}>
        <g>
          {animate && mode === 'error' && (
            <animateTransform
              key={`shake-${modeT}`}
              attributeName="transform"
              type="translate"
              values="0 0;-5 0;5 0;-4 0;4 0;-2 0;0 0"
              dur=".5s"
              begin={`${modeT}s`}
              repeatCount="3"
            />
          )}
          <g>
            {animate && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0;0 -5;0 0"
                dur={t(5.5)}
                repeatCount="indefinite"
              />
            )}

            {full &&
              [0, 1, 2].map((i) => (
                <circle key={i} cx={310 + (i - 1) * 6} cy="90" r="8" fill="#cfe4ff" opacity="0">
                  <animate attributeName="cy" values="90;24" dur={t(3.6)} begin={`${-i * 1.2}s`} repeatCount="indefinite" />
                  <animate attributeName="r" values="7;24" dur={t(3.6)} begin={`${-i * 1.2}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;.4;0" dur={t(3.6)} begin={`${-i * 1.2}s`} repeatCount="indefinite" />
                </circle>
              ))}

            <path d={flaskPath} fill={`url(#${id('glass')})`} />

            <g clipPath={`url(#${id('clip')})`}>
              <path
                fill={`url(#${id('liquid')})`}
                d="M190 292C235 274 268 288 300 304C336 322 366 288 430 280V400H190Z"
              >
                {animate && (
                  <animate
                    attributeName="d"
                    dur={t(4)}
                    repeatCount="indefinite"
                    values="M190 292C235 274 268 288 300 304C336 322 366 288 430 280V400H190Z;
                            M190 284C232 296 268 308 300 296C340 282 368 304 430 290V400H190Z;
                            M190 292C235 274 268 288 300 304C336 322 366 288 430 280V400H190Z"
                  />
                )}
              </path>
              <ellipse cx="272" cy="344" rx="34" ry="12" fill="#fff" opacity=".18" />

              {[
                [285, 330, 12, 3.2],
                [330, 345, 9, 2.6],
                [305, 360, 7, 3.8],
                ...(full ? [[262, 352, 6, 2.9], [352, 336, 5, 3.4]] : []),
              ].map(([x, y, r, d], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity=".85">
                  {animate && (
                    <>
                      <animate attributeName="cy" values={`${y};${y - 38};${y}`} dur={t(d)} begin={`${-i * 0.9}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values=".85;.35;.85" dur={t(d)} begin={`${-i * 0.9}s`} repeatCount="indefinite" />
                    </>
                  )}
                </circle>
              ))}
            </g>

            {[
              [296, 252, 6],
              [322, 228, 5],
              [308, 196, 4],
            ].map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} fill="#8fc2ff" opacity=".8">
                {animate && (
                  <>
                    <animate attributeName="cy" values={`${y};${y - 46};${y}`} dur={t(3 + i * 0.7)} begin={`${-i * 1.1}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values=".8;0;.8" dur={t(3 + i * 0.7)} begin={`${-i * 1.1}s`} repeatCount="indefinite" />
                  </>
                )}
              </circle>
            ))}

            {full && (
              <g clipPath={`url(#${id('clip')})`}>
                <polygon points="0,90 26,90 -8,390 -34,390" fill="#fff" opacity=".4">
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="160 0;160 0;470 0"
                    keyTimes="0;.55;1"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </polygon>
              </g>
            )}

            <path d={flaskPath} fill="none" stroke={`url(#${id('rim')})`} strokeWidth="6" strokeLinejoin="round" />
            <rect x="278" y="92" width="64" height="16" rx="8" fill="#eaf3ff" stroke={`url(#${id('rim')})`} strokeWidth="5" />
            <path d="M300 118V196" stroke="#fff" strokeOpacity=".8" strokeWidth="5" strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* Think mode — hạt bay vòng */}
      {animate && mode === 'think' && (
        <g key={`think-${modeT}`} pointerEvents="none" opacity="0">
          <animate attributeName="opacity" values="0;1" dur=".5s" begin={`${modeT}s`} fill="freeze" />
          <circle cx={CX} cy={AY} r="168" fill="none" stroke={pal[1]} strokeOpacity=".18" strokeWidth="2" strokeDasharray="4 10" />
          <circle cx={CX} cy={AY} r="118" fill="none" stroke={pal[1]} strokeOpacity=".14" strokeWidth="2" strokeDasharray="3 9" />
          {THINK_RINGS.map((ring, ri) => (
            <g key={ri}>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={ring.dir > 0 ? `0 ${CX} ${AY};360 ${CX} ${AY}` : `360 ${CX} ${AY};0 ${CX} ${AY}`}
                dur={`${ring.dur}s`}
                repeatCount="indefinite"
              />
              {ring.parts.map((p, i) => (
                <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={p.r.toFixed(1)} fill={pal[ri === 2 ? 0 : 1]} opacity={p.o.toFixed(2)} />
              ))}
              <circle
                cx={ring.parts[ring.parts.length - 1].x.toFixed(1)}
                cy={ring.parts[ring.parts.length - 1].y.toFixed(1)}
                r="15"
                fill={pal[0]}
                opacity=".28"
              />
            </g>
          ))}
        </g>
      )}

      <ellipse cx={CX} cy="482" rx="150" ry="14" fill={`url(#${id('floor')})`}>
        {animate && <animate attributeName="opacity" values=".6;1;.6" dur={t(4)} repeatCount="indefinite" />}
      </ellipse>

      {full &&
        SYMBOLS.map((s, i) => (
          <text
            key={s.s}
            x={s.x}
            y="430"
            textAnchor="middle"
            fontSize="26"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
            fill="#4a9bff"
            opacity="0"
          >
            {s.s}
            <animate attributeName="y" values="430;340" dur={t(s.d)} begin={`${-i * 1.3}s`} repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0;.85;0"
              keyTimes="0;.35;1"
              dur={t(s.d)}
              begin={`${-i * 1.3}s`}
              repeatCount="indefinite"
            />
          </text>
        ))}

      {/* Sách mở */}
      <g>
        <Wing />
        <g transform={`translate(${CX * 2} 0) scale(-1 1)`}>
          <Wing />
        </g>
      </g>

      {/* Burst */}
      {animate && burst && (
        <g key={burst.n} pointerEvents="none">
          {[0, 0.18].map((dl, i) => (
            <circle key={i} cx={CX} cy={AY} r="20" fill="none" stroke={pal[1]} strokeWidth="5" opacity="0">
              <animate attributeName="r" values="20;210" dur=".9s" begin={`${burst.t0 + dl}s`} fill="freeze" />
              <animate attributeName="opacity" values=".7;0" dur=".9s" begin={`${burst.t0 + dl}s`} fill="freeze" />
            </circle>
          ))}
          {SPARKS.map((p, i) => (
            <circle key={i} cx={CX} cy={AY} r="7" fill={pal[0]} opacity="0">
              <animate attributeName="cx" values={`${CX};${CX + p.dx}`} dur=".8s" begin={`${burst.t0}s`} fill="freeze" />
              <animate attributeName="cy" values={`${AY};${AY + p.dy}`} dur=".8s" begin={`${burst.t0}s`} fill="freeze" />
              <animate attributeName="opacity" values="1;0" dur=".8s" begin={`${burst.t0}s`} fill="freeze" />
              <animate attributeName="r" values="8;2" dur=".8s" begin={`${burst.t0}s`} fill="freeze" />
            </circle>
          ))}
        </g>
      )}
    </svg>
  );
}