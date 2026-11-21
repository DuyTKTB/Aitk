import { useEffect, useMemo, useRef, useState } from 'react';
import { calcWaveInterference } from '../physicsEngine.js';

export default function WaveInterferenceSim({ onAskAI }) {
  const [lam, setLam] = useState(2.2);
  const [dist, setDist] = useState(10.0);
  const [freq, setFreq] = useState(2.0);
  const [samePhase, setSamePhase] = useState(true);
  const [running, setRunning] = useState(true);

  const canvasRef = useRef(null);
  const phaseRef = useRef(0);

  const counts = useMemo(
    () => calcWaveInterference({ lam, dist, samePhase }),
    [lam, dist, samePhase]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const W = canvas.width; // 320 (hi-perf pixel buffer scaled smoothly by CSS)
    const H = canvas.height; // 180
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;

    const pxPerCm = 16;
    const s1x = W / 2 - (dist * pxPerCm) / 2;
    const s2x = W / 2 + (dist * pxPerCm) / 2;
    const sy = H / 2;
    const kWave = (2 * Math.PI) / (lam * pxPerCm);
    const dPhi = samePhase ? 0 : Math.PI;

    let raf = 0;
    let last = performance.now();

    const renderFrame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (running) {
        phaseRef.current += dt * freq * Math.PI * 2;
      }
      const wt = phaseRef.current;

      let idx = 0;
      for (let y = 0; y < H; y++) {
        const dy = y - sy;
        const dy2 = dy * dy;
        for (let x = 0; x < W; x++) {
          const dx1 = x - s1x;
          const dx2 = x - s2x;
          const r1 = Math.sqrt(dx1 * dx1 + dy2);
          const r2 = Math.sqrt(dx2 * dx2 + dy2);

          // Suy giảm biên độ nhẹ theo r cho tự nhiên như bể sóng thật
          const a1 = 1 / (1 + r1 * 0.0045);
          const a2 = 1 / (1 + r2 * 0.0045);
          const u = a1 * Math.cos(wt - kWave * r1) + a2 * Math.cos(wt - kWave * r2 + dPhi);
          // Chuẩn hóa u trong [-2, 2] → bảng màu khoa học Deep Cobalt / Cyan / Violet
          const norm = Math.max(-1, Math.min(1, u * 0.55));
          if (norm >= 0) {
            // Đỉnh sóng (Cyan sáng)
            data[idx++] = Math.round(14 + norm * 65);
            data[idx++] = Math.round(30 + norm * 205);
            data[idx++] = Math.round(78 + norm * 177);
          } else {
            // Hõm sóng (Chàm đậm → Tím nhẹ)
            const t = -norm;
            data[idx++] = Math.round(12 + t * 88);
            data[idx++] = Math.round(20 + t * 24);
            data[idx++] = Math.round(52 + t * 125);
          }
          data[idx++] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Vẽ hai nguồn sóng S1, S2 sắc nét
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(s1x, sy, 4, 0, Math.PI * 2);
      ctx.arc(s2x, sy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 10px ui-monospace, monospace';
      ctx.fillText('S₁', s1x - 6, sy - 8);
      ctx.fillText('S₂', s2x - 6, sy - 8);

      if (running) {
        raf = requestAnimationFrame(renderFrame);
      }
    };

    raf = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(raf);
  }, [lam, dist, freq, samePhase, running]);

  return (
    <div className="pl-sim-layout">
      <div className="pl-stage-card">
        <div className="pl-stage-head">
          <div>
            <h3>Bể sóng 2D &amp; Giao thoa Hai Nguồn Kết Hợp (Wave Simulator)</h3>
            <p>Mô phỏng chồng chất sóng 2 chiều thời gian thực: vân cực đại sáng rõ xen kẽ vân cực tiểu đứng yên.</p>
          </div>
          <div className="pl-stage-actions">
            <button type="button" className="pl-btn pl-btn-primary" onClick={() => setRunning((r) => !r)}>
              {running ? 'Tạm dừng sóng' : 'Chạy sóng'}
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} width={320} height={180} className="pl-canvas pl-canvas-wave" />

        <div className="pl-metrics-grid">
          <div className="pl-metric is-accent">
            <span>Số cực đại trên S₁S₂</span>
            <b>{counts.maxima} <small>đường</small></b>
          </div>
          <div className="pl-metric">
            <span>Số cực tiểu trên S₁S₂</span>
            <b>{counts.minima} <small>đường</small></b>
          </div>
          <div className="pl-metric">
            <span>Tốc độ truyền sóng v = λ·f</span>
            <b>{(lam * freq).toFixed(2)} <small>cm/s</small></b>
          </div>
          <div className="pl-metric">
            <span>Trạng thái hai nguồn</span>
            <b className="pl-text-val">{samePhase ? 'Cùng pha (Δφ = 0)' : 'Ngược pha (Δφ = π)'}</b>
          </div>
        </div>
      </div>

      <aside className="pl-ctrl-card">
        <h4>Tham số nguồn sóng</h4>
        <div className="pl-chip-row">
          <button type="button" className={`pl-chip${samePhase ? ' is-on' : ''}`} onClick={() => setSamePhase(true)}>
            Hai nguồn cùng pha
          </button>
          <button type="button" className={`pl-chip${!samePhase ? ' is-on' : ''}`} onClick={() => setSamePhase(false)}>
            Hai nguồn ngược pha
          </button>
        </div>

        <label className="pl-slider">
          <div><span>Bước sóng λ</span><b>{lam.toFixed(1)} cm</b></div>
          <input type="range" min="1.0" max="5.0" step="0.1" value={lam} onChange={(e) => setLam(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Khoảng cách S₁S₂</span><b>{dist.toFixed(1)} cm</b></div>
          <input type="range" min="3.0" max="16.0" step="0.5" value={dist} onChange={(e) => setDist(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Tần số dao động f</span><b>{freq.toFixed(1)} Hz</b></div>
          <input type="range" min="0.5" max="4.0" step="0.2" value={freq} onChange={(e) => setFreq(Number(e.target.value))} />
        </label>

        <div className="pl-formula-note">
          <code>
            {samePhase
              ? 'Cùng pha: Cực đại d₂ − d₁ = kλ · Cực tiểu = (k + 0,5)λ'
              : 'Ngược pha: Cực đại d₂ − d₁ = (k + 0,5)λ · Cực tiểu = kλ'}
          </code>
        </div>

        <button
          type="button"
          className="pl-btn pl-btn-ai"
          onClick={() =>
            onAskAI(
              `Trong thí nghiệm giao thoa sóng cơ với hai nguồn S₁, S₂ cách nhau ${dist} cm dao động ${samePhase ? 'cùng pha' : 'ngược pha'}, bước sóng λ = ${lam} cm. Hãy chứng minh trên đoạn S₁S₂ có đúng ${counts.maxima} điểm cực đại và ${counts.minima} điểm cực tiểu.`
            )
          }
        >
          Hỏi ELEC AI giải bài toán giao thoa này
        </button>
      </aside>
    </div>
  );
}
