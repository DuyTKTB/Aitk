import { useEffect, useId, useRef } from 'react';

/*
  AIMark — logo AI sống động (v2.1)
  - Thân: vòng tròn giữa + 4 xúc tu lò xo vật lý, đã cân đối lại.
  - viewBox vuông vức hơn (620x500) → hiển thị đẹp trên mọi kích thước.
  - Đồng tử: nhìn theo chuột, chớp mắt, co giãn theo cảm xúc, glow nhẹ.
  - Mí mắt: hạ xuống khi chớp, tạo biểu cảm.
  - mode: 'idle' | 'think' (xoay tròn, vung nhanh) | 'talk' (đập nhịp, rung).
  - look: theo chuột + click để "chọc" (startle + recoil xúc tu).
  - animate={false}: tĩnh (dùng cho avatar nhỏ).
*/

const [CX, CY] = [330, 270];

const ARMS = [
  { b: [220, 185], t: [75, 75],    w0: 110, w1: 15, ro: 30, ri: 13, bend: -28, ph: 0.0 },
  { b: [440, 185], t: [600, 90],   w0: 90,  w1: 26, ro: 44, ri: 22, bend: 10,  ph: 1.7 },
  { b: [470, 270], t: [640, 270],  w0: 115, w1: 15, ro: 30, ri: 13, bend: 22,  ph: 3.1 },
  { b: [220, 360], t: [90, 455],   w0: 100, w1: 15, ro: 30, ri: 13, bend: -22, ph: 4.4 },
];

const BODY =
  'M158 270a172 172 0 1 0 344 0a172 172 0 1 0-344 0ZM218 270a112 112 0 1 0 224 0a112 112 0 1 0-224 0Z';

const MODES = {
  idle:  { sp: 1.0, amp: 12, breath: 1.6, breathAmp: 0.016, pupil: 46 },
  talk:  { sp: 2.4, amp: 22, breath: 6.0, breathAmp: 0.024, pupil: 48 },
  think: { sp: 3.4, amp: 30, breath: 5.0, breathAmp: 0.032, pupil: 32 },
};

const VB = [20, 20, 620, 500];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Nhiễu mượt không lặp (dùng sin tổng hợp — rẻ và đủ tự nhiên)
const noise = (t, seed) =>
  Math.sin(t * 0.9 + seed) * 0.5 +
  Math.sin(t * 1.7 + seed * 1.7) * 0.3 +
  Math.sin(t * 3.1 + seed * 2.3) * 0.2;

function armPath(a, ox, oy, vx, vy, t, tension = 0) {
  const [bx, by] = a.b;
  const tx = a.t[0] + ox;
  const ty = a.t[1] + oy;
  const len = Math.hypot(tx - bx, ty - by) || 1;
  const ux = (tx - bx) / len;
  const uy = (ty - by) / len;
  const ex = tx - ux * (a.ro - 4);
  const ey = ty - uy * (a.ro - 4);
  const nx = -uy;
  const ny = ux;
  const bend =
    a.bend +
    clamp(-(vx * nx + vy * ny) * 0.05, -35, 35) +
    Math.sin(t * 2 + a.ph) * 5 +
    noise(t, a.ph * 3.1) * 4 +
    tension * 14;
  const cx = (bx + ex) / 2 + nx * bend;
  const cy = (by + ey) / 2 + ny * bend;
  const L = [];
  const R = [];
  for (let i = 0; i <= 14; i++) {
    const s = i / 14;
    const u = 1 - s;
    const px = u * u * bx + 2 * u * s * cx + s * s * ex;
    const py = u * u * by + 2 * u * s * cy + s * s * ey;
    const dx = 2 * u * (cx - bx) + 2 * s * (ex - cx);
    const dy = 2 * u * (cy - by) + 2 * s * (ey - cy);
    const dl = Math.hypot(dx, dy) || 1;
    const w = (a.w1 + (a.w0 - a.w1) * Math.pow(u, 2.4)) / 2;
    L.push([px - (dy / dl) * w, py + (dx / dl) * w]);
    R.push([px + (dy / dl) * w, py - (dx / dl) * w]);
  }
  return (
    'M' +
    L.concat(R.reverse())
      .map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1))
      .join('L') +
    'Z'
  );
}

export default function AIMark({
  size = 40,
  mode = 'idle',
  animate = true,
  look = false,
  className = '',
  title = 'Trợ lý AI',
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef(null);
  const rootRef = useRef(null);   // g xoay theo hướng nhìn
  const bodyRef = useRef(null);
  const pupilRef = useRef(null);
  const lidRef = useRef(null);
  const haloRef = useRef(null);
  const armRefs = useRef([]);
  const ringRefs = useRef([]);
  const modeRef = useRef(mode);
  const pokeRef = useRef(0);
  const hoverRef = useRef(false);
  modeRef.current = mode;

  const goo = size >= 56;

  useEffect(() => {
    const st = ARMS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, tension: 0 }));
    const lk = { x: 0, y: 0, tx: 0, ty: 0, on: false };
    let raf;
    let last = performance.now();
    let t = 0;
    let blinkAt = 1.5 + Math.random() * 2;
    let blinkPhase = -1;       // -1 = không chớp
    let startle = 0;           // 0..1, giảm dần
    let doubleBlink = 0;       // số lần chớp liên tiếp
    let frameDt = 1 / 60;      // dt của frame hiện tại (giây)
    let io;                    // theo dõi có đang hiển thị không
    const vis = { on: true };

    const paint = () => {
      const m = modeRef.current;
      const cfg = MODES[m] || MODES.idle;

      // Xúc tu
      ARMS.forEach((a, i) => {
        const s = st[i];
        armRefs.current[i]?.setAttribute(
          'd',
          armPath(a, s.x, s.y, s.vx, s.vy, t, s.tension)
        );
        ringRefs.current[i]?.setAttribute('cx', a.t[0] + s.x);
        ringRefs.current[i]?.setAttribute('cy', a.t[1] + s.y);
        // phình nhẹ đầu xúc tu theo tension
        ringRefs.current[i]?.setAttribute(
          'r',
          (a.ro + a.ri) / 2 + s.tension * 3
        );
      });

      // Thân: nhịp thở + squash khi talk + startle
      const breathe = 1 + cfg.breathAmp * Math.sin(t * cfg.breath);
      const talkWobble = m === 'talk' ? 0.012 * Math.sin(t * 22) : 0;
      const k = breathe + talkWobble + startle * 0.08;
      const kx = 1 / Math.sqrt(k); // squash & stretch nhẹ
      bodyRef.current?.setAttribute(
        'transform',
        `translate(${CX} ${CY}) scale(${k * kx} ${k * (2 - kx)}) translate(${-CX} ${-CY})`
      );

      // Xoay toàn bộ theo hướng nhìn
      const rot = lk.x * 6 + lk.y * 2;
      rootRef.current?.setAttribute(
        'transform',
        `rotate(${rot} ${CX} ${CY})`
      );

      // Đồng tử
      let px, py, pr = cfg.pupil;
      if (m === 'think') {
        const r = 38;
        px = Math.cos(t * 4.5) * r;
        py = Math.sin(t * 4.5) * r;
        pr = 32 + Math.sin(t * 9) * 2;
      } else {
        px = lk.x * 50 + (lk.on ? 0 : Math.sin(t * 0.7) * 14 + noise(t, 1) * 6);
        py = lk.y * 50 + (lk.on ? 0 : Math.cos(t * 0.5) * 10 + noise(t, 2) * 5);
        if (m === 'talk') pr = 46 + Math.sin(t * 10) * 5;
        if (hoverRef.current && lk.on) pr -= 4; // focus
      }
      // startle: đồng tử co lại
      pr *= 1 - startle * 0.25;

      // Chớp mắt
      let sy = 1;
      if (blinkPhase >= 0) {
        const b = blinkPhase;
        sy = 1 - Math.sin(Math.min(1, b / 0.16) * Math.PI) * 0.92;
        if (b >= 0.18) {
          blinkPhase = -1;
          if (doubleBlink > 0) {
            doubleBlink--;
            blinkPhase = 0;
          } else {
            blinkAt = t + 2.2 + Math.random() * 3.5;
          }
        } else {
          blinkPhase = b + frameDt;
        }
      } else if (t >= blinkAt) {
        blinkPhase = 0;
        // 15% cơ hội chớp đôi
        if (Math.random() < 0.15) doubleBlink = 1;
      }

      pupilRef.current?.setAttribute(
        'transform',
        `translate(${CX + px} ${CY + py}) scale(1 ${sy})`
      );
      pupilRef.current?.setAttribute('r', pr);

      // Mí mắt
      const lidOpen = 1 - (1 - sy) * 0.9;
      lidRef.current?.setAttribute(
        'transform',
        `translate(${CX + px * 0.6} ${CY + py * 0.6}) scale(1 ${lidOpen})`
      );
      lidRef.current?.setAttribute('opacity', (1 - sy) * 0.9 + 0.15);

      // Halo khi think
      haloRef.current?.setAttribute(
        'opacity',
        m === 'think' ? 0.25 + 0.15 * Math.sin(t * 3) : 0
      );
    };

    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      // ẩn (display:none / ngoài màn hình) → không mô phỏng, đỡ tốn CPU
      if (!vis.on) { raf = requestAnimationFrame(frame); return; }
      frameDt = dt;
      t += dt;
      const cfg = MODES[modeRef.current] || MODES.idle;

      // Làm mượt look
      lk.x += (lk.tx - lk.x) * 0.12;
      lk.y += (lk.ty - lk.y) * 0.12;

      // Startle giảm dần
      startle = Math.max(0, startle - dt * 2.2);

      // Poke → xung lực ngẫu nhiên + startle + chớp mắt
      if (pokeRef.current > 0) {
        const n = pokeRef.current;
        pokeRef.current = 0;
        for (let i = 0; i < n; i++) {
          st.forEach((s) => {
            const ang = Math.random() * Math.PI * 2;
            const mag = 900 + Math.random() * 700;
            s.vx += Math.cos(ang) * mag;
            s.vy += Math.sin(ang) * mag;
            s.tension = 1;
          });
        }
        startle = 1;
        blinkPhase = 0;
        doubleBlink = 1;
      }

      // Xúc tu lò xo + nhiễu
      ARMS.forEach((a, i) => {
        const s = st[i];
        const localT = t * cfg.sp * (0.9 + i * 0.13);
        const nAmp = modeRef.current === 'idle' ? 6 : 3;
        const tx =
          Math.sin(localT + a.ph) * cfg.amp +
          noise(t * 0.5, a.ph) * nAmp +
          lk.x * 16;
        const ty =
          Math.cos(localT * 0.8 + a.ph * 1.3) * cfg.amp +
          noise(t * 0.5 + 10, a.ph * 1.4) * nAmp +
          lk.y * 16;
        s.vx += (90 * (tx - s.x) - 8 * s.vx) * dt;
        s.vy += (90 * (ty - s.y) - 8 * s.vy) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        // tension giảm dần
        s.tension = Math.max(0, s.tension - dt * 2.5);
        // thêm tension theo vận tốc
        const spd = Math.hypot(s.vx, s.vy);
        if (spd > 300) s.tension = Math.min(1, s.tension + (spd - 300) / 1500);
      });

      paint();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      const r = svgRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 220);
      lk.tx = (dx / d) * k;
      lk.ty = (dy / d) * k;
      lk.on = true;
    };
    const onEnter = () => { hoverRef.current = true; };
    const onLeave = () => { hoverRef.current = false; };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    paint();
    if (!animate || reduce) return undefined;

    raf = requestAnimationFrame(frame);
    if (svgRef.current && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => { vis.on = e.isIntersecting; });
      io.observe(svgRef.current);
    }
    if (look && svgRef.current) {
      window.addEventListener('pointermove', onMove);
      svgRef.current.addEventListener('pointerenter', onEnter);
      svgRef.current.addEventListener('pointerleave', onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener('pointermove', onMove);
      svgRef.current?.removeEventListener('pointerenter', onEnter);
      svgRef.current?.removeEventListener('pointerleave', onLeave);
    };
  }, [animate, look]);

  const filterId = `goo${uid}`;
  const glowId = `glow${uid}`;

  return (
    <svg
      ref={svgRef}
      className={'ai-mark' + (look ? ' look' : '') + (className ? ' ' + className : '')}
      viewBox={VB.join(' ')}
      style={{ width: size }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title}
      onClick={look ? () => { pokeRef.current += 1; } : undefined}
    >
      <defs>
        {goo && (
          <filter
            id={filterId}
            filterUnits="userSpaceOnUse"
            x={VB[0]}
            y={VB[1]}
            width={VB[2]}
            height={VB[3]}
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={size >= 96 ? 7 : 5} result="b" />
            <feColorMatrix
              in="b"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
            />
          </filter>
        )}
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Halo mờ khi think */}
      <circle
        ref={haloRef}
        cx={CX}
        cy={CY}
        r="150"
        fill="var(--acc)"
        opacity="0"
        style={{ filter: 'blur(30px)', transition: 'opacity .4s' }}
      />

      <g ref={rootRef}>
        <g fill="currentColor" filter={goo ? `url(#${filterId})` : undefined}>
          <g ref={bodyRef}>
            <path d={BODY} fillRule="evenodd" />
            <rect x="430" y="335" width="52" height="100" />
          </g>
          {ARMS.map((a, i) => (
            <path
              key={'a' + i}
              ref={(el) => { armRefs.current[i] = el; }}
              d={armPath(a, 0, 0, 0, 0, 0)}
            />
          ))}
          {ARMS.map((a, i) => (
            <circle
              key={'r' + i}
              ref={(el) => { ringRefs.current[i] = el; }}
              cx={a.t[0]}
              cy={a.t[1]}
              r={(a.ro + a.ri) / 2}
              fill="none"
              stroke="currentColor"
              strokeWidth={a.ro - a.ri}
            />
          ))}
        </g>

        {/* Mí mắt — hai cung mảnh, chỉ hiện khi chớp */}
        <g ref={lidRef} transform={`translate(${CX} ${CY})`} opacity="0.15">
          <path
            d={`M${CX - 60} ${CY - 4} Q${CX} ${CY - 70} ${CX + 60} ${CY - 4}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d={`M${CX - 60} ${CY + 4} Q${CX} ${CY + 70} ${CX + 60} ${CY + 4}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        {/* Đồng tử có glow */}
        <circle
          ref={pupilRef}
          r="46"
          fill="var(--acc)"
          transform={`translate(${CX} ${CY})`}
          filter={`url(#${glowId})`}
        />
      </g>
    </svg>
  );
}