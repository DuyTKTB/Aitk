import React, { useEffect, useMemo, useRef, useState } from 'react';
import { calcPhotosynthesisRate, LIGHT_SPECTRUM_EFF } from '../bioEngine.js';
import BioLiveChart from '../components/BioLiveChart.jsx';

export default function PhotosynthesisSim() {
  const [light, setLight] = useState(900);
  const [co2, setCo2] = useState(480);
  const [temp, setTemp] = useState(26);
  const [spectrum, setSpectrum] = useState('white');
  const [plantType, setPlantType] = useState('C3');
  const canvasRef = useRef(null);

  const stats = useMemo(
    () => calcPhotosynthesisRate({ light, co2, temp, spectrum, plantType }),
    [light, co2, temp, spectrum, plantType]
  );

  const lightCurve = useMemo(() => {
    const pts = [];
    for (let l = 0; l <= 2000; l += 125) {
      pts.push({
        light: l,
        C3: calcPhotosynthesisRate({ light: l, co2, temp, spectrum, plantType: 'C3' }).rateO2,
        C4: calcPhotosynthesisRate({ light: l, co2, temp, spectrum, plantType: 'C4' }).rateO2,
      });
    }
    return pts;
  }, [co2, temp, spectrum]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return undefined;
    const ctx = cvs.getContext('2d');
    const bubbles = Array.from({ length: 28 }, (_, i) => ({
      x: 204 + (Math.random() - 0.5) * 16,
      y: 230 - i * 7,
      r: 2 + Math.random() * 2.8,
      speed: 0.7 + Math.random() * 0.9,
    }));
    const photons = Array.from({ length: 14 }, (_, i) => ({
      u: i / 14,
      lane: (i % 5) - 2,
    }));

    let raf = 0;
    let t = 0;
    let collectedO2 = 12;

    const draw = () => {
      t += 0.025;
      const W = cvs.width;
      const H = cvs.height;

      const bg = ctx.createRadialGradient(210, 150, 20, 210, 150, 340);
      bg.addColorStop(0, '#0e2444');
      bg.addColorStop(1, '#040a18');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const specColor = LIGHT_SPECTRUM_EFF[spectrum]?.color || '#ffffff';
      const lightAlpha = Math.min(0.42, (light / 2000) * 0.42);

      // Chùm sáng đèn chiếu dạng nón gradient mượt
      if (light > 10) {
        ctx.save();
        const beamGrad = ctx.createLinearGradient(52, 110, 285, 195);
        beamGrad.addColorStop(0, specColor);
        beamGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = beamGrad;
        ctx.globalAlpha = lightAlpha;
        ctx.beginPath();
        ctx.moveTo(54, 86);
        ctx.lineTo(278, 96);
        ctx.lineTo(278, 256);
        ctx.lineTo(54, 140);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Hạt photon bay từ đèn tới lá rong
        photons.forEach((p) => {
          p.u = (p.u + 0.012 + (light / 2000) * 0.018) % 1;
          const px = 58 + p.u * 155;
          const py = 112 + p.lane * 16 + p.u * (p.lane * 10 + 38);
          ctx.save();
          ctx.shadowColor = specColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = specColor;
          ctx.globalAlpha = (1 - p.u) * 0.85;
          ctx.beginPath();
          ctx.arc(px, py, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // Chân & Chụp đèn phòng thí nghiệm
      ctx.fillStyle = '#334155';
      ctx.fillRect(22, 145, 10, 115);
      ctx.fillRect(10, 255, 40, 8);
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.roundRect(14, 82, 36, 62, 8); ctx.fill();
      ctx.fillStyle = light > 20 ? specColor : '#1e293b';
      ctx.beginPath(); ctx.roundRect(46, 86, 9, 54, 4); ctx.fill();

      // Cốc Beaker thủy tinh đựng nước giàu CO2
      const waterGrad = ctx.createLinearGradient(132, 92, 132, 260);
      waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
      waterGrad.addColorStop(1, 'rgba(14, 165, 233, 0.14)');
      ctx.fillStyle = waterGrad;
      ctx.beginPath(); ctx.roundRect(132, 96, 144, 164, [0, 0, 12, 12]); ctx.fill();

      // Cành rong đuôi chó 3 nhánh đung đưa theo nước
      const sway = Math.sin(t * 1.6) * 4;
      [-16, 0, 16].forEach((ox, brIdx) => {
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(204 + ox * 0.5, 254);
        ctx.quadraticCurveTo(200 + ox + sway * 0.6, 215, 204 + ox + sway, 168 + brIdx * 5);
        ctx.stroke();
        for (let ly = 180; ly <= 244; ly += 13) {
          const lsway = sway * ((255 - ly) / 90);
          ctx.fillStyle = brIdx === 1 ? '#22c55e' : '#16a34a';
          ctx.beginPath();
          ctx.ellipse(192 + ox + lsway, ly, 12, 3.8, -0.35, 0, Math.PI * 2);
          ctx.ellipse(216 + ox + lsway, ly - 3, 12, 3.8, 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Phễu thủy tinh úp ngược + Ống nghiệm chia vạch thu khí O2 phía trên
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(156, 252); ctx.lineTo(194, 152); ctx.lineTo(194, 120);
      ctx.moveTo(252, 252); ctx.lineTo(214, 152); ctx.lineTo(214, 120);
      ctx.stroke();

      // Ống nghiệm úp ngược thu khí O2 ở đỉnh phễu
      collectedO2 = Math.min(46, collectedO2 + stats.rateO2 * 0.0028);
      if (collectedO2 >= 45.8) collectedO2 = 12;
      ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
      ctx.beginPath(); ctx.roundRect(189, 34, 30, 102, [14, 14, 0, 0]); ctx.fill();
      // Khoang khí O2 tích tụ trên đỉnh ống nghiệm
      ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.beginPath(); ctx.roundRect(190, 35, 28, collectedO2, [13, 13, 0, 0]); ctx.fill();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
      ctx.beginPath(); ctx.roundRect(189, 34, 30, 102, [14, 14, 0, 0]); ctx.stroke();
      // Vạch chia thể tích ống nghiệm
      for (let vy = 48; vy <= 120; vy += 12) {
        ctx.beginPath(); ctx.moveTo(190, vy); ctx.lineTo(197, vy); ctx.stroke();
      }
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '800 9.5px system-ui';
      ctx.fillText('O₂', 198, 52);

      // Viền cốc Beaker + điểm phản quang thủy tinh
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(132, 82, 144, 178, [0, 0, 12, 12]); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(140, 95); ctx.lineTo(140, 246); ctx.stroke();

      // Bọt khí O2 bay vào ống nghiệm
      const activeCount = Math.min(bubbles.length, Math.round((stats.rateO2 / 46) * bubbles.length));
      const speedMul = Math.max(0.28, stats.rateO2 / 14);
      for (let i = 0; i < activeCount; i++) {
        const b = bubbles[i];
        b.y -= b.speed * speedMul;
        if (b.y < 36 + collectedO2) {
          b.y = 215 - Math.random() * 35;
          b.x = 204 + (Math.random() - 0.5) * 18;
        }
        const bx = b.y < 152 ? 204 + (b.x - 204) * 0.45 : b.x;
        ctx.beginPath();
        ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167, 243, 208, 0.9)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // Bảng Lục lạp (Pha sáng <-> Chu trình Calvin) bên phải
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath(); ctx.roundRect(298, 22, 224, 244, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.42)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = '800 12px system-ui';
      ctx.fillText('1. PHA SÁNG (Màng Tilacoit)', 312, 46);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px system-ui';
      ctx.fillText('H₂O + Photon → O₂↑ + ATP + NADPH', 312, 65);

      // Thanh năng lượng ATP/NADPH chuyển sang Calvin
      const energyPulse = (t * (0.4 + stats.rateO2 / 40)) % 1;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(324, 78); ctx.lineTo(324, 108); ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(324, 78 + energyPulse * 30, 4, 0, Math.PI * 2); ctx.fill();
      ctx.font = '700 10px system-ui';
      ctx.fillText('ATP · NADPH ↓', 336, 97);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 12px system-ui';
      ctx.fillText('2. CHU TRÌNH CALVIN (Stroma)', 312, 126);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px system-ui';
      ctx.fillText(`CO₂ (${co2} ppm) + ATP → C₆H₁₂O₆`, 312, 145);

      // Đồng hồ đo trực tiếp
      ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
      ctx.beginPath(); ctx.roundRect(310, 162, 200, 92, 10); ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.font = '800 12.5px system-ui';
      ctx.fillText(`O₂: ${stats.rateO2} µmol/m²·s (${stats.bubblesPerMin} bọt/ph)`, 320, 185);
      ctx.fillStyle = '#93c5fd';
      ctx.font = '700 11.5px system-ui';
      ctx.fillText(`Nhóm cây: Thực vật ${plantType} · ${temp}°C`, 320, 208);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 11px system-ui';
      ctx.fillText(`Nhân tố giới hạn: ${stats.limitingFactor}`, 320, 232);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [light, co2, temp, spectrum, plantType, stats]);

  return (
    <div className="bl-grid-2">
      <div className="bl-controls">
        <div className="bl-canvas-box">
          <canvas ref={canvasRef} width={540} height={286} />
        </div>
        <BioLiveChart
          data={lightCurve}
          xKey="light"
          xLabel="Cường độ ánh sáng (µmol/m²·s)"
          yLabel="Tốc độ O₂"
          series={[
            { key: 'C3', label: 'Thực vật C3 (Lúa, Đậu)', color: '#10b981' },
            { key: 'C4', label: 'Thực vật C4 (Ngô, Mía)', color: '#f59e0b' },
          ]}
          height={198}
        />
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>Điều chỉnh Nhân tố Ngoại cảnh</h4>
          <div className="bl-tabs">
            {['C3', 'C4'].map((pt) => (
              <button key={pt} type="button" className={`bl-tab${plantType === pt ? ' on' : ''}`} onClick={() => setPlantType(pt)}>
                Cây {pt} {pt === 'C3' ? '(Lúa, Đậu)' : '(Ngô, Mía)'}
              </button>
            ))}
          </div>
          <div className="bl-controls">
            <label className="bl-slider-row">
              <header><span>Cường độ ánh sáng</span><b>{light} µmol/m²·s</b></header>
              <input type="range" min={0} max={2000} step={25} value={light} onChange={(e) => setLight(Number(e.target.value))} />
            </label>
            <label className="bl-slider-row">
              <header><span>Nồng độ CO₂</span><b>{co2} ppm</b></header>
              <input type="range" min={0} max={1200} step={20} value={co2} onChange={(e) => setCo2(Number(e.target.value))} />
            </label>
            <label className="bl-slider-row">
              <header><span>Nhiệt độ môi trường</span><b>{temp} °C</b></header>
              <input type="range" min={5} max={48} step={1} value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
            </label>
          </div>

          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>Bước sóng ánh sáng chiếu vào rong:</div>
            <div className="bl-tabs" style={{ marginBottom: 0 }}>
              {Object.entries(LIGHT_SPECTRUM_EFF).map(([k, v]) => (
                <button key={k} type="button" className={`bl-tab${spectrum === k ? ' on' : ''}`} onClick={() => setSpectrum(k)}>
                  {v.label.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bl-kpi-grid">
          <div className="bl-kpi"><small>Tốc độ tạo O₂</small><strong style={{ color: '#059669' }}>{stats.rateO2} µmol/m²s</strong></div>
          <div className="bl-kpi"><small>Số bọt khí</small><strong>{stats.bubblesPerMin}/phút</strong></div>
          <div className="bl-kpi"><small>Tạo Glucose</small><strong>{stats.glucoseRate} µmol/m²s</strong></div>
          <div className="bl-kpi"><small>Hiệu suất nhiệt</small><strong>{stats.fTemp}%</strong></div>
        </div>
      </div>
    </div>
  );
}
