import { useEffect, useRef, useState } from 'react';
import { calcDoublePendulumEnergy, stepDoublePendulum } from '../physicsEngine.js';

export default function DoublePendulumSim({ onAskAI }) {
  const [m1, setM1] = useState(2.0);
  const [m2, setM2] = useState(1.5);
  const [L1, setL1] = useState(1.1);
  const [L2, setL2] = useState(1.0);
  const [initDeg1, setInitDeg1] = useState(125);
  const [initDeg2, setInitDeg2] = useState(145);
  const [butterfly, setButterfly] = useState(true);
  const [running, setRunning] = useState(true);
  const [energy, setEnergy] = useState({ kinetic: 0, potential: 0, total: 0 });

  const canvasRef = useRef(null);
  const state1Ref = useRef([(125 * Math.PI) / 180, 0, (145 * Math.PI) / 180, 0]);
  const state2Ref = useRef([(125.1 * Math.PI) / 180, 0, (145 * Math.PI) / 180, 0]);
  const trail1Ref = useRef([]);
  const trail2Ref = useRef([]);

  const resetPendulum = (d1 = initDeg1, d2 = initDeg2) => {
    state1Ref.current = [(d1 * Math.PI) / 180, 0, (d2 * Math.PI) / 180, 0];
    state2Ref.current = [((d1 + 0.1) * Math.PI) / 180, 0, (d2 * Math.PI) / 180, 0];
    trail1Ref.current = [];
    trail2Ref.current = [];
  };

  useEffect(() => {
    resetPendulum(initDeg1, initDeg2);
  }, [initDeg1, initDeg2, m1, m2, L1, L2]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const ox = W / 2;
    const oy = 115;
    const scale = 92;
    const params = { m1, m2, L1, L2, g: 9.81 };

    let raf = 0;
    let frame = 0;

    const tick = () => {
      if (running) {
        // 4 bước nhỏ RK4 mỗi frame để bảo toàn năng lượng cực chính xác
        const subDt = 0.004;
        for (let s = 0; s < 4; s++) {
          state1Ref.current = stepDoublePendulum(state1Ref.current, params, subDt);
          if (butterfly) {
            state2Ref.current = stepDoublePendulum(state2Ref.current, params, subDt);
          }
        }
      }

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#09122b');
      bg.addColorStop(1, '#111c44');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Trục treo
      ctx.strokeStyle = 'rgba(148,163,184,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox - 55, oy);
      ctx.lineTo(ox + 55, oy);
      ctx.stroke();

      const getPos = ([th1, , th2]) => {
        const x1 = ox + L1 * scale * Math.sin(th1);
        const y1 = oy + L1 * scale * Math.cos(th1);
        const x2 = x1 + L2 * scale * Math.sin(th2);
        const y2 = y1 + L2 * scale * Math.cos(th2);
        return { x1, y1, x2, y2 };
      };

      const p1 = getPos(state1Ref.current);
      const p2 = getPos(state2Ref.current);

      if (running) {
        trail1Ref.current.push([p1.x2, p1.y2]);
        if (trail1Ref.current.length > 260) trail1Ref.current.shift();
        if (butterfly) {
          trail2Ref.current.push([p2.x2, p2.y2]);
          if (trail2Ref.current.length > 260) trail2Ref.current.shift();
        }
      }

      const drawTrail = (pts, rgb) => {
        for (let i = 1; i < pts.length; i++) {
          const alpha = (i / pts.length) * 0.85;
          ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(2)})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
          ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
        }
      };

      if (butterfly) {
        drawTrail(trail2Ref.current, '244, 114, 182');
        // Con lắc thứ 2 (lệch +0.1° — Hiệu ứng Cánh bướm)
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(p2.x1, p2.y1);
        ctx.lineTo(p2.x2, p2.y2);
        ctx.stroke();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(p2.x1, p2.y1, 6, 0, Math.PI * 2);
        ctx.arc(p2.x2, p2.y2, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      drawTrail(trail1Ref.current, '56, 189, 248');

      // Con lắc chính
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(p1.x1, p1.y1);
      ctx.lineTo(p1.x2, p1.y2);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ox, oy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(p1.x1, p1.y1, 7 + m1 * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a78bfa';
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p1.x2, p1.y2, 7 + m2 * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Chú thích
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`● Con lắc 1 (θ₁ = ${initDeg1}°)`, 16, 24);
      if (butterfly) {
        ctx.fillStyle = '#f472b6';
        ctx.fillText(`● Con lắc 2 (θ₁ = ${(initDeg1 + 0.1).toFixed(1)}° — lệch 0,1°)`, 16, 42);
      }

      frame++;
      if (frame % 8 === 0) {
        setEnergy(calcDoublePendulumEnergy(state1Ref.current, params));
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [m1, m2, L1, L2, butterfly, running, initDeg1]);

  return (
    <div className="pl-sim-layout">
      <div className="pl-stage-card">
        <div className="pl-stage-head">
          <div>
            <h3>Con lắc kép &amp; Hệ động lực Hỗn loạn (Double Pendulum RK4)</h3>
            <p>Giải phương trình Euler–Lagrange bằng RK4 bậc 4. Bật chế độ Cánh bướm để thấy sai lệch 0,1° tạo ra quỹ đạo hoàn toàn khác biệt!</p>
          </div>
          <div className="pl-stage-actions">
            <button type="button" className="pl-btn pl-btn-primary" onClick={() => setRunning((r) => !r)}>
              {running ? 'Tạm dừng' : 'Tiếp tục'}
            </button>
            <button type="button" className="pl-btn" onClick={() => resetPendulum()}>
              Thả lại
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} width={740} height={380} className="pl-canvas" />

        <div className="pl-metrics-grid">
          <div className="pl-metric is-accent">
            <span>Cơ năng bảo toàn W</span>
            <b>{energy.total.toFixed(2)} <small>J</small></b>
          </div>
          <div className="pl-metric">
            <span>Động năng W_đ</span>
            <b>{energy.kinetic.toFixed(2)} <small>J</small></b>
          </div>
          <div className="pl-metric">
            <span>Thế năng W_t</span>
            <b>{energy.potential.toFixed(2)} <small>J</small></b>
          </div>
          <div className="pl-metric">
            <span>Tích phân số</span>
            <b className="pl-text-val">Runge-Kutta bậc 4</b>
          </div>
        </div>
      </div>

      <aside className="pl-ctrl-card">
        <h4>Tham số con lắc kép</h4>
        <label className="pl-slider">
          <div><span>Góc thả ban đầu θ₁</span><b>{initDeg1}°</b></div>
          <input type="range" min="20" max="175" step="1" value={initDeg1} onChange={(e) => setInitDeg1(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Góc thả ban đầu θ₂</span><b>{initDeg2}°</b></div>
          <input type="range" min="20" max="175" step="1" value={initDeg2} onChange={(e) => setInitDeg2(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Khối lượng m₁</span><b>{m1.toFixed(1)} kg</b></div>
          <input type="range" min="0.5" max="4.0" step="0.1" value={m1} onChange={(e) => setM1(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Khối lượng m₂</span><b>{m2.toFixed(1)} kg</b></div>
          <input type="range" min="0.5" max="4.0" step="0.1" value={m2} onChange={(e) => setM2(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Chiều dài thanh L₁</span><b>{L1.toFixed(2)} m</b></div>
          <input type="range" min="0.5" max="1.4" step="0.05" value={L1} onChange={(e) => setL1(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Chiều dài thanh L₂</span><b>{L2.toFixed(2)} m</b></div>
          <input type="range" min="0.5" max="1.4" step="0.05" value={L2} onChange={(e) => setL2(Number(e.target.value))} />
        </label>

        <label className="pl-toggle">
          <input type="checkbox" checked={butterfly} onChange={(e) => setButterfly(e.target.checked)} />
          <span>Hiệu ứng Cánh bướm (so sánh +0,1°)</span>
        </label>

        <div className="pl-formula-note">
          <code>L = T − V · Hệ bảo toàn cơ năng nhưng hỗn loạn với góc lớn</code>
        </div>

        <button
          type="button"
          className="pl-btn pl-btn-ai"
          onClick={() =>
            onAskAI(
              `Giải thích vì sao con lắc kép vẫn tuân theo định luật bảo toàn cơ năng (W = W_đ + W_t = const) nhưng lại có chuyển động hỗn loạn (chaos) và cực kỳ nhạy cảm với điều kiện ban đầu (hiệu ứng cánh bướm lệch 0,1°)?`
            )
          }
        >
          Hỏi ELEC AI về lý thuyết hỗn loạn
        </button>
      </aside>
    </div>
  );
}
