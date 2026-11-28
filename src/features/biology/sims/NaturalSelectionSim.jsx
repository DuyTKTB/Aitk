import React, { useCallback, useEffect, useRef, useState } from 'react';
import BioLiveChart from '../components/BioLiveChart.jsx';

function makePopulation(n = 80) {
  return Array.from({ length: n }, () => ({
    x: 20 + Math.random() * 480,
    y: 20 + Math.random() * 220,
    // 0 = sáng (aa), 1 = trung gian (Aa), 2 = tối (AA)
    shade: Math.random() < 0.5 ? 0.15 + Math.random() * 0.2 : 0.65 + Math.random() * 0.3,
  }));
}

export default function NaturalSelectionSim() {
  const [envDarkness, setEnvDarkness] = useState(0.8); // 0 = bạch dương sáng, 1 = vỏ cây tối
  const [predation, setPredation] = useState(0.45);
  const [mutationRate, setMutationRate] = useState(0.08);
  const [gen, setGen] = useState(0);
  const [pop, setPop] = useState(() => makePopulation(80));
  const [history, setHistory] = useState([{ gen: 0, light: 40, dark: 40, avgShade: 50 }]);
  const [running, setRunning] = useState(false);
  const canvasRef = useRef(null);

  const stepGeneration = useCallback(() => {
    setPop((prev) => {
      // Xác suất sống sót phụ thuộc độ khớp màu sắc với môi trường (ngụy trang)
      const scored = prev.map((org) => {
        const mismatch = Math.abs(org.shade - envDarkness);
        const surviveProb = Math.max(0.08, 1 - predation * (0.25 + mismatch * 1.45));
        return { org, alive: Math.random() < surviveProb };
      });
      let survivors = scored.filter((x) => x.alive).map((x) => x.org);
      if (survivors.length < 8) survivors = prev.slice(0, 8);

      // Sinh sản hồi phục về 80 cá thể kèm biến dị ngẫu nhiên
      const next = [];
      for (let i = 0; i < 80; i++) {
        const parent = survivors[Math.floor(Math.random() * survivors.length)];
        let nextShade = parent.shade;
        if (Math.random() < mutationRate * 3) {
          nextShade = Math.max(0.05, Math.min(0.95, nextShade + (Math.random() - 0.5) * 0.28));
        }
        next.push({
          x: 20 + Math.random() * 480,
          y: 20 + Math.random() * 220,
          shade: nextShade,
        });
      }

      const darkCount = next.filter((o) => o.shade >= 0.5).length;
      const lightCount = next.length - darkCount;
      const avgShade = Math.round((next.reduce((s, o) => s + o.shade, 0) / next.length) * 100);

      setGen((g) => {
        const ng = g + 1;
        setHistory((h) => [...h.slice(-39), { gen: ng, light: lightCount, dark: darkCount, avgShade }]);
        return ng;
      });
      return next;
    });
  }, [envDarkness, predation, mutationRate]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(stepGeneration, 650);
    return () => clearInterval(t);
  }, [running, stepGeneration]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const W = cvs.width, H = cvs.height;
    const bgLum = Math.round((1 - envDarkness) * 215 + 22);
    ctx.fillStyle = `rgb(${bgLum}, ${Math.round(bgLum * 0.98)}, ${Math.round(bgLum * 0.93)})`;
    ctx.fillRect(0, 0, W, H);

    // Vẽ vân vỏ cây
    ctx.strokeStyle = envDarkness > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)';
    for (let y = 18; y < H; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + 6);
      ctx.stroke();
    }

    pop.forEach((o) => {
      const lum = Math.round((1 - o.shade) * 235 + 15);
      ctx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(o.x - 5, o.y, 7, 4.5, -0.3, 0, Math.PI * 2);
      ctx.ellipse(o.x + 5, o.y, 7, 4.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [pop, envDarkness]);

  const latest = history[history.length - 1] || { light: 40, dark: 40, avgShade: 50 };

  const reset = () => {
    setRunning(false);
    setGen(0);
    const p = makePopulation(80);
    setPop(p);
    const dark = p.filter((o) => o.shade >= 0.5).length;
    setHistory([{ gen: 0, light: 80 - dark, dark, avgShade: 50 }]);
  };

  return (
    <div className="bl-grid-2">
      <div className="bl-controls">
        <div className="bl-canvas-box">
          <canvas ref={canvasRef} width={520} height={260} />
        </div>
        <BioLiveChart
          data={history}
          xKey="gen"
          xLabel="Thế hệ (F)"
          yLabel="Số cá thể"
          series={[
            { key: 'dark', label: 'Bướm màu tối', color: '#3b82f6' },
            { key: 'light', label: 'Bướm màu sáng', color: '#f59e0b' },
          ]}
          height={185}
          maxY={85}
        />
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>Điều kiện Môi trường &amp; Áp lực Chọn lọc</h4>
          <div className="bl-tabs">
            <button type="button" className="bl-btn primary" onClick={() => setRunning((r) => !r)}>
              {running ? 'Tạm dừng' : 'Chạy chọn lọc'}
            </button>
            <button type="button" className="bl-btn" onClick={stepGeneration}>+1 Thế hệ</button>
            <button type="button" className="bl-btn" onClick={reset}>Đặt lại</button>
          </div>

          <div className="bl-controls">
            <label className="bl-slider-row">
              <header><span>Màu vỏ cây (Môi trường)</span><b>{envDarkness > 0.6 ? 'Tối (Khói bụi)' : envDarkness < 0.4 ? 'Sáng (Bạch dương)' : 'Trung gian'}</b></header>
              <input type="range" min={0} max={1} step={0.05} value={envDarkness} onChange={(e) => setEnvDarkness(Number(e.target.value))} />
            </label>
            <label className="bl-slider-row">
              <header><span>Áp lực chim ăn sâu</span><b>{Math.round(predation * 100)}%</b></header>
              <input type="range" min={0.1} max={0.85} step={0.05} value={predation} onChange={(e) => setPredation(Number(e.target.value))} />
            </label>
            <label className="bl-slider-row">
              <header><span>Tỉ lệ biến dị / đột biến</span><b>{Math.round(mutationRate * 100)}%</b></header>
              <input type="range" min={0.01} max={0.3} step={0.01} value={mutationRate} onChange={(e) => setMutationRate(Number(e.target.value))} />
            </label>
          </div>
        </div>

        <div className="bl-kpi-grid">
          <div className="bl-kpi"><small>Thế hệ hiện tại</small><strong>F{gen}</strong></div>
          <div className="bl-kpi"><small>Cá thể màu tối</small><strong style={{ color: '#2f6bff' }}>{latest.dark}/80</strong></div>
          <div className="bl-kpi"><small>Cá thể màu sáng</small><strong style={{ color: '#d97706' }}>{latest.light}/80</strong></div>
          <div className="bl-kpi"><small>Độ sẫm TB</small><strong>{latest.avgShade}%</strong></div>
        </div>
      </div>
    </div>
  );
}
