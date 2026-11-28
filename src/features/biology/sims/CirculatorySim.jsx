import React, { useEffect, useRef, useState } from 'react';
import Heart3DViewer from '../../../components/Heart3DViewer.jsx';

const ACTIVITY_PRESETS = [
  { id: 'sleep', label: 'Ngủ sâu', bpm: 58, strokeMl: 68, bp: '108/68' },
  { id: 'rest', label: 'Nghỉ ngơi', bpm: 75, strokeMl: 70, bp: '120/80' },
  { id: 'walk', label: 'Đi bộ nhanh', bpm: 105, strokeMl: 85, bp: '132/82' },
  { id: 'sprint', label: 'Chạy nước rút', bpm: 165, strokeMl: 110, bp: '158/88' },
];

// Hàm tạo sóng điện tâm đồ P-QRS-T sinh lý theo pha chu kì [0..1]
function ecgWave(u) {
  const p = 0.16 * Math.exp(-Math.pow((u - 0.18) / 0.045, 2));
  const q = -0.18 * Math.exp(-Math.pow((u - 0.31) / 0.014, 2));
  const r = 1.0 * Math.exp(-Math.pow((u - 0.35) / 0.015, 2));
  const s = -0.28 * Math.exp(-Math.pow((u - 0.39) / 0.015, 2));
  const t = 0.32 * Math.exp(-Math.pow((u - 0.62) / 0.065, 2));
  return p + q + r + s + t;
}

export default function CirculatorySim() {
  const [activity, setActivity] = useState('rest');
  const [bpm, setBpm] = useState(75);
  const [strokeMl, setStrokeMl] = useState(70);
  const [showLoop, setShowLoop] = useState('both'); // 'both' | 'small' | 'large'
  const canvasRef = useRef(null);

  const cycleSec = Math.round((60 / bpm) * 100) / 100;
  const cardiacOutput = Math.round(((bpm * strokeMl) / 1000) * 10) / 10; // L/phút

  const pickPreset = (p) => {
    setActivity(p.id);
    setBpm(p.bpm);
    setStrokeMl(p.strokeMl);
  };

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return undefined;
    const ctx = cvs.getContext('2d');
    let phase = 0;
    let ecgPhase = 0;
    let raf = 0;

    const draw = () => {
      const W = cvs.width, H = cvs.height;
      const step = (bpm / 75) * 0.013;
      phase = (phase + step) % 1;
      ecgPhase = (ecgPhase + step * 1.1) % 1;

      const gradBg = ctx.createRadialGradient(W / 2, H / 2 - 20, 20, W / 2, H / 2, 260);
      gradBg.addColorStop(0, '#0f2547');
      gradBg.addColorStop(1, '#050d1e');
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, W, H);

      const pulse = Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 4);

      // Mao mạch Phổi (trên)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(130, 14, 200, 42, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e0f2fe';
      ctx.font = '700 11.5px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('MAO MẠCH PHỔI (Nhận O₂ · Thải CO₂)', 230, 39);

      // Tim 4 ngăn ở giữa (co bóp theo BPM)
      const beatPad = pulse * 3;
      const chambers = [
        { x: 162 - beatPad, y: 112, w: 66 + beatPad, h: 40, label: 'Tâm nhĩ phải', col: '#2563eb' },
        { x: 162 - beatPad, y: 156, w: 66 + beatPad, h: 46 + beatPad * 0.6, label: 'Tâm thất phải', col: '#1d4ed8' },
        { x: 232, y: 112, w: 66 + beatPad, h: 40, label: 'Tâm nhĩ trái', col: '#ef4444' },
        { x: 232, y: 156, w: 66 + beatPad, h: 46 + beatPad * 0.6, label: 'Tâm thất trái', col: '#dc2626' },
      ];
      chambers.forEach((c) => {
        ctx.save();
        ctx.shadowColor = c.col;
        ctx.shadowBlur = 10 + pulse * 10;
        ctx.fillStyle = c.col;
        ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 9); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 9.5px system-ui';
        ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 3);
      });

      // Mao mạch Cơ quan (dưới)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.16)';
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(120, 248, 220, 42, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe4e6';
      ctx.font = '700 11.5px system-ui';
      ctx.fillText('MAO MẠCH CƠ QUAN (Giao O₂ · Nhận CO₂)', 230, 273);

      // Vẽ mạch máu phát sáng + tế bào hồng cầu chạy theo nhịp
      const drawVessel = (pts, color, active) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = active ? 0.92 : 0.16;
        ctx.lineWidth = active ? 5.5 : 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (active) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();

        if (active) {
          ctx.shadowBlur = 0;
          for (let k = 0; k < 5; k++) {
            const u = (phase + k * 0.2) % 1;
            const segCount = pts.length - 1;
            const segIdx = Math.min(segCount - 1, Math.floor(u * segCount));
            const localT = u * segCount - segIdx;
            const [x1, y1] = pts[segIdx];
            const [x2, y2] = pts[segIdx + 1];
            const px = x1 + (x2 - x1) * localT;
            const py = y1 + (y2 - y1) * localT;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, 3.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      };

      const smallOn = showLoop === 'both' || showLoop === 'small';
      const largeOn = showLoop === 'both' || showLoop === 'large';

      drawVessel([[160, 178], [86, 178], [86, 35], [130, 35]], '#3b82f6', smallOn);
      drawVessel([[330, 35], [374, 35], [374, 132], [300, 132]], '#ef4444', smallOn);
      drawVessel([[300, 182], [416, 182], [416, 269], [340, 269]], '#ef4444', largeOn);
      drawVessel([[120, 269], [44, 269], [44, 132], [160, 132]], '#3b82f6', largeOn);

      // Thanh ECG (Điện tâm đồ thời gian thực) dưới đáy canvas
      ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
      ctx.fillRect(14, 304, W - 28, 46);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 304, W - 28, 46);

      ctx.beginPath();
      const ecgW = W - 44;
      for (let x = 0; x <= ecgW; x += 2) {
        const u = ((x / ecgW) * 2.2 - ecgPhase + 10) % 1;
        const val = ecgWave(u);
        const py = 335 - val * 22;
        if (x === 0) ctx.moveTo(22 + x, py);
        else ctx.lineTo(22 + x, py);
      }
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.textAlign = 'left';
      ctx.font = '700 10px system-ui';
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText(`ECG · ${bpm} BPM`, 22, 318);
      ctx.fillStyle = '#93c5fd';
      ctx.fillText('● Nghèo O₂', 280, 318);
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('● Giàu O₂', 368, 318);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [bpm, showLoop]);

  return (
    <div className="bl-grid-2">
      <div className="bl-controls">
        <div className="bl-tabs">
          <button type="button" className={`bl-tab${showLoop === 'both' ? ' on' : ''}`} onClick={() => setShowLoop('both')}>Cả 2 vòng tuần hoàn</button>
          <button type="button" className={`bl-tab${showLoop === 'small' ? ' on' : ''}`} onClick={() => setShowLoop('small')}>Vòng tuần hoàn nhỏ (Phổi)</button>
          <button type="button" className={`bl-tab${showLoop === 'large' ? ' on' : ''}`} onClick={() => setShowLoop('large')}>Vòng tuần hoàn lớn (Cơ thể)</button>
        </div>

        <div className="bl-grid-equal">
          <div className="bl-3d-stage" style={{ padding: 10, minHeight: 356, display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 50% 35%, #230f29 0%, #071224 72%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fda4af', padding: '2px 4px 8px' }}>
              <span>Trái tim 3D Giải phẫu (GLB)</span>
              <span style={{ color: '#34d399' }}>● {bpm} BPM</span>
            </div>
            <div style={{ flex: 1, minHeight: 300 }}>
              <Heart3DViewer readiness={85} isPro />
            </div>
          </div>

          <div className="bl-canvas-box">
            <canvas ref={canvasRef} width={460} height={362} />
          </div>
        </div>
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>Trạng thái Hoạt động &amp; Nhịp tim</h4>
          <div className="bl-tabs">
            {ACTIVITY_PRESETS.map((p) => (
              <button key={p.id} type="button" className={`bl-tab${activity === p.id ? ' on' : ''}`} onClick={() => pickPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="bl-slider-row">
            <header><span>Nhịp tim (BPM)</span><b>{bpm} nhịp/phút</b></header>
            <input type="range" min={45} max={190} step={1} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
          </label>
          <label className="bl-slider-row" style={{ marginTop: 8 }}>
            <header><span>Thể tích tâm thu (Stroke Volume)</span><b>{strokeMl} mL/nhịp</b></header>
            <input type="range" min={50} max={130} step={2} value={strokeMl} onChange={(e) => setStrokeMl(Number(e.target.value))} />
          </label>
        </div>

        <div className="bl-kpi-grid">
          <div className="bl-kpi"><small>Chu kì tim</small><strong>{cycleSec} s</strong></div>
          <div className="bl-kpi"><small>Cung lượng tim</small><strong style={{ color: '#e11d48' }}>{cardiacOutput} L/phút</strong></div>
          <div className="bl-kpi"><small>Huyết áp chuẩn</small><strong>{ACTIVITY_PRESETS.find((x) => x.id === activity)?.bp || '120/80'} mmHg</strong></div>
        </div>

        <div className="bl-panel">
          <h4>Chu kì hoạt động của Tim (0,8 giây lúc nghỉ)</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.81rem', lineHeight: 1.6, color: 'var(--bl-mut)' }}>
            <li><b style={{ color: 'var(--bl-ink)' }}>Pha co tâm nhĩ (0,1 s):</b> đẩy máu qua van nhĩ–thất xuống tâm thất (sóng P trên ECG).</li>
            <li><b style={{ color: 'var(--bl-ink)' }}>Pha co tâm thất (0,3 s):</b> van nhĩ–thất đóng (tiếng “lub”), phức hợp QRS đẩy máu vào ĐM chủ &amp; ĐM phổi.</li>
            <li><b style={{ color: 'var(--bl-ink)' }}>Pha dãn chung (0,4 s):</b> van bán nguyệt đóng (tiếng “dub”), tim nghỉ và hút máu về (sóng T).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
