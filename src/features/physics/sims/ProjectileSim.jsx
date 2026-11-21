import { useEffect, useMemo, useRef, useState } from 'react';
import { calcProjectile, GRAVITY_PRESETS } from '../physicsEngine.js';

export default function ProjectileSim({ onAskAI }) {
  const [v0, setV0] = useState(28);
  const [angleDeg, setAngleDeg] = useState(45);
  const [h0, setH0] = useState(0);
  const [planet, setPlanet] = useState('earth');
  const [drag, setDrag] = useState(0);
  const [showCompare, setShowCompare] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [running, setRunning] = useState(false);
  const [simT, setSimT] = useState(0);

  const canvasRef = useRef(null);
  const gVal = (GRAVITY_PRESETS.find((p) => p.id === planet) || GRAVITY_PRESETS[0]).g;

  const mainTraj = useMemo(
    () => calcProjectile({ v0, angleDeg, h0, g: gVal, drag }),
    [v0, angleDeg, h0, gVal, drag]
  );

  const ghost30 = useMemo(
    () => (showCompare ? calcProjectile({ v0, angleDeg: 30, h0, g: gVal, drag }) : null),
    [showCompare, v0, h0, gVal, drag]
  );
  const ghost60 = useMemo(
    () => (showCompare ? calcProjectile({ v0, angleDeg: 60, h0, g: gVal, drag }) : null),
    [showCompare, v0, h0, gVal, drag]
  );

  // Khi đổi thông số, đặt con trỏ về cuối quỹ đạo hoặc khởi chạy lại mượt mà
  useEffect(() => {
    setSimT(mainTraj.flightTime);
    setRunning(false);
  }, [mainTraj]);

  useEffect(() => {
    if (!running) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setSimT((prev) => {
        const next = prev + dt;
        if (next >= mainTraj.flightTime) {
          setRunning(false);
          return mainTraj.flightTime;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, mainTraj.flightTime]);

  const currentPt = useMemo(() => {
    const pts = mainTraj.points;
    if (!pts.length) return { t: 0, x: 0, y: h0, vx: 0, vy: 0 };
    if (simT >= mainTraj.flightTime) return pts[pts.length - 1];
    let lo = 0;
    let hi = pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].t < simT) lo = mid + 1;
      else hi = mid;
    }
    return pts[lo] || pts[pts.length - 1];
  }, [mainTraj, simT, h0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const padL = 52;
    const padR = 26;
    const padT = 26;
    const padB = 40;

    // Nền tối khoa học sắc nét
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#09122b');
    bg.addColorStop(1, '#101d42');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const maxX = Math.max(
      20,
      mainTraj.range,
      ghost30?.range || 0,
      ghost60?.range || 0
    ) * 1.12;
    const maxY = Math.max(
      12,
      mainTraj.maxHeight,
      ghost30?.maxHeight || 0,
      ghost60?.maxHeight || 0
    ) * 1.2;

    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const toX = (x) => padL + (x / maxX) * plotW;
    const toY = (y) => H - padB - (y / maxY) * plotH;

    // Lưới tọa độ
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle = '#94a3b8';

    for (let i = 0; i <= 5; i++) {
      const valX = (maxX * i) / 5;
      const px = toX(valX);
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, H - padB);
      ctx.stroke();
      ctx.fillText(`${valX.toFixed(0)}m`, px - 12, H - 14);
    }
    for (let j = 0; j <= 4; j++) {
      const valY = (maxY * j) / 4;
      const py = toY(valY);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(W - padR, py);
      ctx.stroke();
      ctx.fillText(`${valY.toFixed(0)}m`, 10, py + 4);
    }

    // Mặt đất
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, toY(0));
    ctx.lineTo(W - padR, toY(0));
    ctx.stroke();

    // Bệ phóng nếu h0 > 0
    if (h0 > 0) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.fillRect(padL - 12, toY(h0), 14, toY(0) - toY(h0));
    }

    const drawCurve = (pts, color, dashed = false, limitT = Infinity) => {
      if (!pts || pts.length < 2) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1.8 : 3;
      if (dashed) ctx.setLineDash([6, 5]);
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        if (p.t > limitT) break;
        const px = toX(p.x);
        const py = toY(p.y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    if (showCompare && ghost30) drawCurve(ghost30.points, 'rgba(52, 211, 153, 0.48)', true);
    if (showCompare && ghost60) drawCurve(ghost60.points, 'rgba(251, 191, 36, 0.48)', true);
    drawCurve(mainTraj.points, 'rgba(125, 179, 255, 0.22)', true);
    drawCurve(mainTraj.points, '#38bdf8', false, simT);

    // Đánh dấu đỉnh quỹ đạo
    const apexPt = mainTraj.points.reduce((best, p) => (p.y > best.y ? p : best), mainTraj.points[0]);
    if (apexPt && simT >= apexPt.t) {
      const ax = toX(apexPt.x);
      const ay = toY(apexPt.y);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax, toY(0));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#c4b5fd';
      ctx.fillText(`H_max = ${mainTraj.maxHeight.toFixed(1)}m`, Math.min(W - 125, ax + 6), Math.max(20, ay - 8));
    }

    // Vật chuyển động + Vectơ vận tốc
    const bx = toX(currentPt.x);
    const by = toY(currentPt.y);

    if (showVectors) {
      const vScale = 2.1;
      const drawArrow = (x1, y1, x2, y2, color, label) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
        if (label) {
          ctx.font = '700 11px ui-monospace, monospace';
          ctx.fillText(label, x2 + 4, y2 - 4);
        }
        ctx.restore();
      };
      drawArrow(bx, by, bx + currentPt.vx * vScale, by, '#34d399', 'vx');
      drawArrow(bx, by, bx, by - currentPt.vy * vScale, '#fbbf24', 'vy');
      drawArrow(bx, by, bx + currentPt.vx * vScale, by - currentPt.vy * vScale, '#f472b6', 'v');
    }

    ctx.beginPath();
    ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#2f6bff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Chú thích góc so sánh
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`— α = ${angleDeg}° (hiện tại)`, W - 165, 22);
    if (showCompare) {
      ctx.fillStyle = '#34d399';
      ctx.fillText('--- So sánh 30°', W - 165, 38);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('--- So sánh 60°', W - 165, 54);
    }
  }, [mainTraj, ghost30, ghost60, currentPt, simT, h0, angleDeg, showCompare, showVectors]);

  const handleLaunch = () => {
    setSimT(0);
    setRunning(true);
  };

  return (
    <div className="pl-sim-layout">
      <div className="pl-stage-card">
        <div className="pl-stage-head">
          <div>
            <h3>Mô phỏng Chuyển động Ném xiên</h3>
            <p>Khảo sát quỹ đạo parabol, tầm xa cực đại tại 45°, thành phần vận tốc (vₓ, vᵧ) và lực cản không khí.</p>
          </div>
          <div className="pl-stage-actions">
            <button type="button" className="pl-btn pl-btn-primary" onClick={handleLaunch}>
              Bắn mô phỏng
            </button>
            <button type="button" className="pl-btn" onClick={() => setRunning((r) => !r)}>
              {running ? 'Tạm dừng' : 'Tiếp tục'}
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} width={760} height={360} className="pl-canvas" />

        <div className="pl-metrics-grid">
          <div className="pl-metric is-accent">
            <span>Tầm xa L</span>
            <b>{mainTraj.range.toFixed(2)} <small>m</small></b>
          </div>
          <div className="pl-metric">
            <span>Độ cao cực đại H_max</span>
            <b>{mainTraj.maxHeight.toFixed(2)} <small>m</small></b>
          </div>
          <div className="pl-metric">
            <span>Thời gian bay t</span>
            <b>{mainTraj.flightTime.toFixed(2)} <small>s</small></b>
          </div>
          <div className="pl-metric">
            <span>Vận tốc chạm đất v</span>
            <b>{mainTraj.impactSpeed.toFixed(2)} <small>m/s</small></b>
          </div>
        </div>
      </div>

      <aside className="pl-ctrl-card">
        <h4>Thông số phóng</h4>
        <label className="pl-slider">
          <div><span>Vận tốc đầu v₀</span><b>{v0} m/s</b></div>
          <input type="range" min="5" max="60" step="1" value={v0} onChange={(e) => setV0(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Góc ném α</span><b>{angleDeg}°</b></div>
          <input type="range" min="5" max="85" step="1" value={angleDeg} onChange={(e) => setAngleDeg(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Độ cao ban đầu h₀</span><b>{h0} m</b></div>
          <input type="range" min="0" max="40" step="1" value={h0} onChange={(e) => setH0(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Hệ số cản không khí k</span><b>{drag.toFixed(3)}</b></div>
          <input type="range" min="0" max="0.03" step="0.002" value={drag} onChange={(e) => setDrag(Number(e.target.value))} />
        </label>

        <div className="pl-field-group">
          <span>Gia tốc trọng trường g</span>
          <div className="pl-chip-row">
            {GRAVITY_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`pl-chip${planet === p.id ? ' is-on' : ''}`}
                onClick={() => setPlanet(p.id)}
              >
                {p.name} ({p.g})
              </button>
            ))}
          </div>
        </div>

        <label className="pl-toggle">
          <input type="checkbox" checked={showCompare} onChange={(e) => setShowCompare(e.target.checked)} />
          <span>Hiện quỹ đạo so sánh góc 30° &amp; 60°</span>
        </label>
        <label className="pl-toggle">
          <input type="checkbox" checked={showVectors} onChange={(e) => setShowVectors(e.target.checked)} />
          <span>Hiển thị vectơ vận tốc (vₓ, vᵧ, v)</span>
        </label>

        <div className="pl-formula-note">
          <code>L = (v₀²·sin2α)/g · H = h₀ + (v₀·sinα)²/(2g)</code>
        </div>

        <button
          type="button"
          className="pl-btn pl-btn-ai"
          onClick={() =>
            onAskAI(
              `Giải thích bài toán ném xiên với v₀ = ${v0} m/s, góc α = ${angleDeg}°, h₀ = ${h0} m, g = ${gVal} m/s² (k cản = ${drag}). Tính chi tiết tầm xa L = ${mainTraj.range.toFixed(2)} m, độ cao cực đại H = ${mainTraj.maxHeight.toFixed(2)} m và giải thích vì sao góc 30° và 60° cùng tầm xa khi h₀ = 0.`
            )
          }
        >
          Hỏi ELEC AI phân tích thí nghiệm này
        </button>
      </aside>
    </div>
  );
}
