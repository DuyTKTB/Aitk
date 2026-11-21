import { useEffect, useRef, useState } from 'react';

const BALL_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#fb7185'];

function makePresetBodies(preset) {
  if (preset === 'cradle') {
    return [
      { id: 1, x: 140, y: 185, vx: 230, vy: 0, r: 22, m: 2, color: '#38bdf8' },
      { id: 2, x: 360, y: 185, vx: 0, vy: 0, r: 22, m: 2, color: '#a78bfa' },
      { id: 3, x: 405, y: 185, vx: 0, vy: 0, r: 22, m: 2, color: '#34d399' },
      { id: 4, x: 450, y: 185, vx: 0, vy: 0, r: 22, m: 2, color: '#fbbf24' },
    ];
  }
  if (preset === 'inelastic') {
    return [
      { id: 1, x: 160, y: 185, vx: 190, vy: 0, r: 26, m: 3, color: '#38bdf8' },
      { id: 2, x: 560, y: 185, vx: -130, vy: 0, r: 22, m: 2, color: '#f472b6' },
    ];
  }
  if (preset === 'zeroG') {
    return [
      { id: 1, x: 180, y: 110, vx: 160, vy: 85, r: 20, m: 1.5, color: '#38bdf8' },
      { id: 2, x: 520, y: 140, vx: -140, vy: 110, r: 26, m: 3.0, color: '#a78bfa' },
      { id: 3, x: 350, y: 260, vx: 90, vy: -150, r: 18, m: 1.2, color: '#34d399' },
      { id: 4, x: 440, y: 90, vx: -110, vy: -80, r: 22, m: 2.0, color: '#fbbf24' },
    ];
  }
  // gravity rain
  return [
    { id: 1, x: 190, y: 80, vx: 90, vy: 0, r: 24, m: 2.5, color: '#38bdf8' },
    { id: 2, x: 360, y: 120, vx: -60, vy: -30, r: 20, m: 1.6, color: '#a78bfa' },
    { id: 3, x: 510, y: 70, vx: -110, vy: 20, r: 28, m: 3.5, color: '#34d399' },
  ];
}

export default function Mechanics2DSim({ onAskAI }) {
  const [gravity, setGravity] = useState(0);
  const [restitution, setRestitution] = useState(1.0);
  const [running, setRunning] = useState(true);
  const [preset, setPreset] = useState('cradle');
  const [telemetry, setTelemetry] = useState({ px: 0, py: 0, ke: 0, count: 4 });

  const canvasRef = useRef(null);
  const bodiesRef = useRef(makePresetBodies('cradle'));
  const dragRef = useRef(null);
  const idCounterRef = useRef(10);

  const loadPreset = (name) => {
    setPreset(name);
    if (name === 'cradle') {
      setGravity(0);
      setRestitution(1.0);
    } else if (name === 'inelastic') {
      setGravity(0);
      setRestitution(0.15);
    } else if (name === 'zeroG') {
      setGravity(0);
      setRestitution(1.0);
    } else {
      setGravity(420);
      setRestitution(0.84);
    }
    bodiesRef.current = makePresetBodies(name);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    let raf = 0;
    let last = performance.now();
    let frameCount = 0;

    const tick = (now) => {
      const dt = Math.min(0.025, (now - last) / 1000);
      last = now;
      const bodies = bodiesRef.current;

      if (running) {
        // Cập nhật vị trí + tường bao
        for (const b of bodies) {
          b.vy += gravity * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.x - b.r < 8) {
            b.x = 8 + b.r;
            b.vx = Math.abs(b.vx) * restitution;
          } else if (b.x + b.r > W - 8) {
            b.x = W - 8 - b.r;
            b.vx = -Math.abs(b.vx) * restitution;
          }
          if (b.y - b.r < 8) {
            b.y = 8 + b.r;
            b.vy = Math.abs(b.vy) * restitution;
          } else if (b.y + b.r > H - 8) {
            b.y = H - 8 - b.r;
            b.vy = -Math.abs(b.vy) * restitution;
            if (Math.abs(b.vy) < 6 && gravity > 0) b.vy = 0;
          }
        }

        // Giải va chạm đàn hồi/mềm giữa các quả cầu (bảo toàn động lượng)
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i];
            const b = bodies[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = a.r + b.r;
            if (dist > 0.001 && dist < minDist) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;
              const invM1 = 1 / a.m;
              const invM2 = 1 / b.m;
              const invSum = invM1 + invM2;

              // Tách vị trí chống lún
              a.x -= nx * overlap * (invM1 / invSum);
              a.y -= ny * overlap * (invM1 / invSum);
              b.x += nx * overlap * (invM2 / invSum);
              b.y += ny * overlap * (invM2 / invSum);

              // Vận tốc tương đối theo pháp tuyến
              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;
              if (velAlongNormal < 0) {
                const jImp = (-(1 + restitution) * velAlongNormal) / invSum;
                const impX = jImp * nx;
                const impY = jImp * ny;
                a.vx -= impX * invM1;
                a.vy -= impY * invM1;
                b.vx += impX * invM2;
                b.vy += impY * invM2;
              }
            }
          }
        }
      }

      // Vẽ sân khấu 2D
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#09122b');
      bg.addColorStop(1, '#0f1d45');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Lưới nền
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 40; gy < H; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      // Viền khung đàn hồi
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, W - 16, H - 16);

      // Vẽ quả cầu + vectơ vận tốc
      let pxSum = 0;
      let pySum = 0;
      let keSum = 0;
      for (const b of bodies) {
        pxSum += b.m * (b.vx / 50);
        pySum += b.m * (b.vy / 50);
        keSum += 0.5 * b.m * ((b.vx / 50) ** 2 + (b.vy / 50) ** 2);

        // Quả cầu bóng 3D
        const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, b.x, b.y, b.r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.28, b.color);
        grad.addColorStop(1, '#0c1b44');
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Nhãn khối lượng
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 11px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${b.m.toFixed(1)}kg`, b.x, b.y + 4);
        ctx.textAlign = 'start';

        // Vectơ vận tốc
        if (Math.hypot(b.vx, b.vy) > 15) {
          ctx.strokeStyle = 'rgba(255,255,255,0.68)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x + b.vx * 0.22, b.y + b.vy * 0.22);
          ctx.stroke();
        }
      }

      // Dây kéo bắn bi nếu người dùng đang kéo trên canvas
      if (dragRef.current) {
        const d = dragRef.current;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(d.startX, d.startY);
        ctx.lineTo(d.curX, d.curY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(d.startX, d.startY, 16, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
      }

      frameCount++;
      if (frameCount % 8 === 0) {
        setTelemetry({ px: pxSum, py: pySum, ke: keSum, count: bodies.length });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gravity, restitution, running]);

  const toCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasRef.current.width,
      y: ((e.clientY - rect.top) / rect.height) * canvasRef.current.height,
    };
  };

  const handlePointerDown = (e) => {
    const pt = toCanvasCoords(e);
    dragRef.current = { startX: pt.x, startY: pt.y, curX: pt.x, curY: pt.y };
  };
  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const pt = toCanvasCoords(e);
    dragRef.current.curX = pt.x;
    dragRef.current.curY = pt.y;
  };
  const handlePointerUp = () => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    dragRef.current = null;
    if (bodiesRef.current.length >= 14) return;
    const vx = (d.startX - d.curX) * 2.4;
    const vy = (d.startY - d.curY) * 2.4;
    const m = 1.5 + Math.round(Math.random() * 20) / 10;
    const id = ++idCounterRef.current;
    bodiesRef.current = [
      ...bodiesRef.current,
      {
        id,
        x: Math.max(30, Math.min(710, d.startX)),
        y: Math.max(30, Math.min(330, d.startY)),
        vx,
        vy,
        r: 14 + m * 3.5,
        m,
        color: BALL_COLORS[id % BALL_COLORS.length],
      },
    ];
  };

  return (
    <div className="pl-sim-layout">
      <div className="pl-stage-card">
        <div className="pl-stage-head">
          <div>
            <h3>Cơ học 2D &amp; Bảo toàn Động lượng (Physics Playground)</h3>
            <p>Kéo chuột trực tiếp trên sân khấu để bắn thêm quả cầu mới, kiểm chứng va chạm đàn hồi (e = 1) và va chạm mềm.</p>
          </div>
          <div className="pl-stage-actions">
            <button type="button" className="pl-btn pl-btn-primary" onClick={() => setRunning((r) => !r)}>
              {running ? 'Tạm dừng' : 'Tiếp tục'}
            </button>
            <button type="button" className="pl-btn" onClick={() => loadPreset(preset)}>
              Đặt lại
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={740}
          height={360}
          className="pl-canvas pl-canvas-grab"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <div className="pl-metrics-grid">
          <div className="pl-metric is-accent">
            <span>Tổng động lượng |Σp|</span>
            <b>{Math.hypot(telemetry.px, telemetry.py).toFixed(2)} <small>kg·m/s</small></b>
          </div>
          <div className="pl-metric">
            <span>Tổng động năng ΣW_đ</span>
            <b>{telemetry.ke.toFixed(2)} <small>J</small></b>
          </div>
          <div className="pl-metric">
            <span>Hệ số đàn hồi e</span>
            <b>{restitution.toFixed(2)}</b>
          </div>
          <div className="pl-metric">
            <span>Số vật thể trong hệ</span>
            <b>{telemetry.count} <small>/ 14</small></b>
          </div>
        </div>
      </div>

      <aside className="pl-ctrl-card">
        <h4>Kịch bản thí nghiệm mẫu</h4>
        <div className="pl-chip-col">
          {[
            ['cradle', 'Va chạm đàn hồi 1D (Newton)'],
            ['inelastic', 'Va chạm mềm (tiêu hao động năng)'],
            ['zeroG', 'Không trọng lực 2D (g = 0)'],
            ['rain', 'Rơi tự do & nảy trọng trường'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`pl-chip${preset === id ? ' is-on' : ''}`}
              onClick={() => loadPreset(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="pl-slider">
          <div><span>Hệ số đàn hồi e</span><b>{restitution.toFixed(2)}</b></div>
          <input type="range" min="0" max="1" step="0.05" value={restitution} onChange={(e) => setRestitution(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Trọng trường mô phỏng g</span><b>{(gravity / 42).toFixed(1)} m/s²</b></div>
          <input type="range" min="0" max="600" step="20" value={gravity} onChange={(e) => setGravity(Number(e.target.value))} />
        </label>

        <div className="pl-formula-note">
          <code>m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′ · Đàn hồi: ΣW_đ bảo toàn</code>
        </div>

        <button
          type="button"
          className="pl-btn pl-btn-ai"
          onClick={() =>
            onAskAI(
              `Giải thích sự khác nhau giữa va chạm đàn hồi (hệ số e = 1) và va chạm mềm (e = 0) về Định luật bảo toàn động lượng và Bảo toàn cơ năng trong Vật lí 10, kèm ví dụ 2 vật khối lượng 2kg và 3kg va chạm trực diện.`
            )
          }
        >
          Hỏi ELEC AI về va chạm &amp; động lượng
        </button>
      </aside>
    </div>
  );
}
