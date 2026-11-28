import React, { useEffect, useMemo, useRef, useState } from 'react';
import { simulateSirModel } from '../bioEngine.js';
import BioLiveChart from '../components/BioLiveChart.jsx';

const PARTICLE_COUNT = 120;

function createParticles(vaccinatedPct, speedScale) {
  const vacCount = Math.round((PARTICLE_COUNT * vaccinatedPct) / 100);
  const arr = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.65 + Math.random() * 0.9) * speedScale;
    let state = 'S';
    if (i < 3) state = 'I';
    else if (i < 3 + vacCount) state = 'R';
    arr.push({
      x: 16 + Math.random() * 448,
      y: 16 + Math.random() * 198,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      state,
      infectedFrames: 0,
    });
  }
  return arr;
}

export default function EpidemicSirSim({ onAskAI }) {
  const [beta, setBeta] = useState(0.38);
  const [gamma, setGamma] = useState(0.11);
  const [vaccinatedPct, setVaccinatedPct] = useState(15);
  const [distancing, setDistancing] = useState(0.25); // 0 = tự do, 0.85 = giãn cách chặt
  const [running, setRunning] = useState(true);
  const [liveCounts, setLiveCounts] = useState({ S: 99, I: 3, R: 18 });

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  // Điều chỉnh beta hiệu dụng theo mức giãn cách xã hội
  const effectiveBeta = useMemo(
    () => Math.max(0.04, Math.round(beta * (1 - distancing * 0.72) * 1000) / 1000),
    [beta, distancing]
  );

  const sirResult = useMemo(
    () =>
      simulateSirModel({
        population: 1000,
        initialInfected: 8,
        vaccinatedPct,
        beta: effectiveBeta,
        gamma,
        days: 90,
      }),
    [vaccinatedPct, effectiveBeta, gamma]
  );

  const resetParticles = () => {
    const speedScale = Math.max(0.18, 1.15 - distancing * 0.9);
    particlesRef.current = createParticles(vaccinatedPct, speedScale);
    const s = particlesRef.current.filter((p) => p.state === 'S').length;
    const inf = particlesRef.current.filter((p) => p.state === 'I').length;
    const r = particlesRef.current.filter((p) => p.state === 'R').length;
    setLiveCounts({ S: s, I: inf, R: r });
  };

  useEffect(() => {
    resetParticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccinatedPct, distancing]);

  useEffect(() => {
    let rafId = 0;
    let tick = 0;
    const infectRadius = 11 + beta * 14;
    const recoverFrames = Math.max(90, Math.round(28 / Math.max(0.04, gamma)));
    const transmitProb = Math.min(0.65, effectiveBeta * 0.55);

    const step = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      const pts = particlesRef.current;

      if (running) {
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 8 || p.x > W - 8) { p.vx *= -1; p.x = Math.max(8, Math.min(W - 8, p.x)); }
          if (p.y < 8 || p.y > H - 8) { p.vy *= -1; p.y = Math.max(8, Math.min(H - 8, p.y)); }
          if (p.state === 'I') {
            p.infectedFrames += 1;
            if (p.infectedFrames >= recoverFrames) {
              p.state = 'R';
            }
          }
        }
        // Kiểm tra lây nhiễm tiếp xúc gần
        const r2 = infectRadius * infectRadius;
        for (let i = 0; i < pts.length; i++) {
          if (pts[i].state !== 'I') continue;
          for (let j = 0; j < pts.length; j++) {
            if (pts[j].state !== 'S') continue;
            const dx = pts[i].x - pts[j].x;
            const dy = pts[i].y - pts[j].y;
            if (dx * dx + dy * dy < r2 && Math.random() < transmitProb * 0.14) {
              pts[j].state = 'I';
              pts[j].infectedFrames = 0;
            }
          }
        }
      }

      // Vẽ khung mô phỏng hạt
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.state === 'I') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, infectRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.13)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = p.state === 'I' ? '#ef4444' : p.state === 'R' ? '#10b981' : '#38bdf8';
        ctx.fill();
      }

      tick += 1;
      if (tick % 12 === 0) {
        let s = 0, inf = 0, r = 0;
        for (let i = 0; i < pts.length; i++) {
          if (pts[i].state === 'S') s++;
          else if (pts[i].state === 'I') inf++;
          else r++;
        }
        setLiveCounts({ S: s, I: inf, R: r });
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [running, beta, effectiveBeta, gamma]);

  const herdReached = vaccinatedPct >= sirResult.herdImmunityPct && sirResult.r0 > 1;

  return (
    <div className="bl-grid-2">
      <div className="bl-stage">
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
            <strong>Mô phỏng tiếp xúc cộng đồng ({PARTICLE_COUNT} cá thể)</strong>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: '#0284c7', fontWeight: 700 }}>● S: {liveCounts.S}</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>● I: {liveCounts.I}</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>● R: {liveCounts.R}</span>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={480}
            height={225}
            style={{ width: '100%', height: 'auto', borderRadius: 12, display: 'block', border: '1px solid rgba(148,163,184,0.28)' }}
          />
        </div>

        <BioLiveChart
          data={sirResult.series}
          xKey="day"
          xLabel="Ngày bùng dịch"
          yLabel="Số người (N = 1000)"
          maxY={1000}
          height={215}
          series={[
            { key: 'S', label: 'Chưa nhiễm (S)', color: '#0284c7' },
            { key: 'I', label: 'Đang nhiễm (I)', color: '#ef4444' },
            { key: 'R', label: 'Hồi phục / Vaccine (R)', color: '#10b981' },
          ]}
        />
      </div>

      <div className="bl-panel">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="bl-btn cobalt" onClick={() => setRunning((v) => !v)}>
            {running ? 'Tạm dừng hạt' : 'Tiếp tục chạy'}
          </button>
          <button type="button" className="bl-btn" onClick={resetParticles}>
            Thả lại ổ dịch mới
          </button>
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Hệ số lây nhiễm gốc (β)</label>
            <strong>{beta.toFixed(2)} (β hiệu dụng: {effectiveBeta})</strong>
          </div>
          <input type="range" className="bl-range" min="0.10" max="0.80" step="0.02" value={beta} onChange={(e) => setBeta(Number(e.target.value))} />
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Tỷ lệ hồi phục mỗi ngày (γ)</label>
            <strong>{gamma.toFixed(2)} (~{Math.round(1 / gamma)} ngày khỏi)</strong>
          </div>
          <input type="range" className="bl-range" min="0.05" max="0.30" step="0.01" value={gamma} onChange={(e) => setGamma(Number(e.target.value))} />
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Tỷ lệ tiêm chủng Vaccine ban đầu</label>
            <strong>{vaccinatedPct}%</strong>
          </div>
          <input type="range" className="bl-range" min="0" max="90" step="5" value={vaccinatedPct} onChange={(e) => setVaccinatedPct(Number(e.target.value))} />
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Mức giãn cách xã hội / Khẩu trang</label>
            <strong>{Math.round(distancing * 100)}%</strong>
          </div>
          <input type="range" className="bl-range" min="0" max="0.85" step="0.05" value={distancing} onChange={(e) => setDistancing(Number(e.target.value))} />
        </div>

        <div className="bl-kpis">
          <div className="bl-kpi">
            <span>Hệ số R₀ / R_eff</span>
            <strong style={{ color: sirResult.rEff > 1 ? '#dc2626' : '#059669' }}>
              {sirResult.r0} / {sirResult.rEff}
            </strong>
          </div>
          <div className="bl-kpi">
            <span>Ngưỡng miễn dịch cộng đồng</span>
            <strong>{sirResult.herdImmunityPct}%</strong>
          </div>
          <div className="bl-kpi">
            <span>Đỉnh dịch (Ngày {sirResult.peakDay})</span>
            <strong>{sirResult.peakInfected} ca</strong>
          </div>
        </div>

        <div className="bl-info-card">
          <h4>Đánh giá dịch tễ học</h4>
          <p>
            {sirResult.rEff <= 1 ? (
              <span className="bl-badge-ok">Dịch được kiểm soát (R_eff ≤ 1)</span>
            ) : (
              <span className="bl-badge-danger">Dịch đang lan rộng (R_eff &gt; 1)</span>
            )}{' '}
            {herdReached
              ? 'Tỷ lệ tiêm chủng đã vượt ngưỡng miễn dịch cộng đồng p_c = 1 − 1/R₀, cắt đứt chuỗi lây lan.'
              : `Cần tiêm chủng tối thiểu ${sirResult.herdImmunityPct}% hoặc tăng giãn cách để đưa R_eff xuống dưới 1.0 (làm phẳng đường cong dịch).`}
          </p>
        </div>

        <button
          type="button"
          className="bl-btn cobalt"
          onClick={() =>
            onAskAI?.(
              `Trong mô hình dịch tễ SIR với R₀ = ${sirResult.r0}, giải thích công thức ngưỡng miễn dịch cộng đồng p_c = 1 - 1/R₀ = ${sirResult.herdImmunityPct}% và ý nghĩa của việc "làm phẳng đường cong" (flattening the curve)!`
            )
          }
        >
          Hỏi Bé ELEC về Miễn dịch cộng đồng
        </button>
      </div>
    </div>
  );
}
