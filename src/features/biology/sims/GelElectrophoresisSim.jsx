import React, { useEffect, useRef, useState } from 'react';
import { calcGelMigrationFraction, DNA_LADDER_BP } from '../bioEngine.js';

const GEL_SCENARIOS = {
  restriction: {
    title: 'Cắt Plasmid (5.000 bp) bằng Enzyme giới hạn',
    lanes: [
      { name: 'Thang chuẩn', bands: DNA_LADDER_BP, isLadder: true },
      { name: 'Plasmid gốc', bands: [5000] },
      { name: 'EcoRI', bands: [3200, 1800] },
      { name: 'HindIII', bands: [4100, 900] },
      { name: 'EcoRI+HindIII', bands: [2300, 1800, 900] },
    ],
    note: 'Cắt kép EcoRI + HindIII chia đoạn 3.200 bp thành 2.300 bp + 900 bp → xác định được bản đồ vị trí cắt giới hạn trên plasmid.',
  },
  forensic: {
    title: 'Phân tích ADN Pháp y (Truy tìm dấu vết)',
    lanes: [
      { name: 'Thang chuẩn', bands: DNA_LADDER_BP, isLadder: true },
      { name: 'Hiện trường', bands: [4000, 1500, 750, 250] },
      { name: 'Nghi phạm A', bands: [6000, 2000, 1000] },
      { name: 'Nghi phạm B', bands: [4000, 1500, 750, 250] },
      { name: 'Nghi phạm C', bands: [3000, 1500, 500] },
    ],
    note: 'Mẫu Nghi phạm B cho hệ băng DNA trùng khớp 100% ở cả 4 kích thước (4000, 1500, 750, 250 bp) với mẫu hiện trường.',
  },
  paternity: {
    title: 'Xét nghiệm Huyết thống (Mẹ – Con – Cha giả định)',
    lanes: [
      { name: 'Thang chuẩn', bands: DNA_LADDER_BP, isLadder: true },
      { name: 'Mẹ', bands: [3000, 1000] },
      { name: 'Con', bands: [3000, 2000, 500] },
      { name: 'Cha giả định 1', bands: [2000, 500] },
      { name: 'Cha giả định 2', bands: [4000, 750] },
    ],
    note: 'Con nhận băng 3.000 bp từ Mẹ; hai băng còn lại (2.000 bp & 500 bp) trùng khớp hoàn toàn với Cha giả định 1.',
  },
};

export default function GelElectrophoresisSim() {
  const [scenario, setScenario] = useState('restriction');
  const [voltage, setVoltage] = useState(110);
  const [gelPct, setGelPct] = useState(1.0);
  const [minutes, setMinutes] = useState(42);
  const [running, setRunning] = useState(false);
  const [uvMode, setUvMode] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null); // { y, bp, laneName }
  const canvasRef = useRef(null);

  const sc = GEL_SCENARIOS[scenario];
  const gelX = 64, gelY = 48, gelW = 560 - 92, gelH = 352 - 84;

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => {
      setMinutes((m) => {
        if (m >= 75) {
          setRunning(false);
          return 75;
        }
        return m + 1;
      });
    }, 95);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return undefined;
    const ctx = cvs.getContext('2d');
    let raf = 0;
    let tick = 0;

    const render = () => {
      tick += 0.08;
      const W = cvs.width;
      const H = cvs.height;

      ctx.fillStyle = uvMode ? '#040714' : '#edf2f7';
      ctx.fillRect(0, 0, W, H);

      // Vỏ buồng điện di trong suốt & thanh điện cực Bạch kim (−) / (+)
      ctx.fillStyle = uvMode ? '#0c162d' : '#dbe4f0';
      ctx.beginPath(); ctx.roundRect(gelX - 10, gelY - 12, gelW + 20, gelH + 24, 12); ctx.fill();
      ctx.strokeStyle = uvMode ? 'rgba(99, 102, 241, 0.35)' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Thanh điện cực âm (Đen) trên & cực dương (Đỏ) dưới
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(gelX - 4, gelY - 9, gelW + 8, 5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(gelX - 4, gelY + gelH + 4, gelW + 8, 5);

      // Bọt khí điện phân sủi dọc 2 thanh điện cực khi đang chạy nguồn!
      if (running) {
        for (let b = 0; b < 14; b++) {
          const bx = gelX + ((b * 37 + tick * 6) % gelW);
          const r = 1.6 + (b % 3) * 0.7;
          ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
          ctx.beginPath(); ctx.arc(bx, gelY - 5 + Math.sin(tick + b) * 2, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(bx, gelY + gelH + 5 + Math.cos(tick + b) * 2, r, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Bản gel Agarose bên trong (có độ trong theo % agarose)
      const gelGrad = ctx.createLinearGradient(gelX, gelY, gelX, gelY + gelH);
      if (uvMode) {
        gelGrad.addColorStop(0, '#111c3a');
        gelGrad.addColorStop(0.5, '#0b142c');
        gelGrad.addColorStop(1, '#141e3e');
      } else {
        gelGrad.addColorStop(0, '#f8fafc');
        gelGrad.addColorStop(1, '#e2e8f0');
      }
      ctx.fillStyle = gelGrad;
      ctx.fillRect(gelX, gelY, gelW, gelH);
      ctx.strokeStyle = uvMode ? 'rgba(125, 211, 252, 0.22)' : '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gelX, gelY, gelW, gelH);

      // Nhãn cực âm / cực dương
      ctx.textAlign = 'left';
      ctx.fillStyle = uvMode ? '#f87171' : '#dc2626';
      ctx.font = '800 11px system-ui';
      ctx.fillText('Cực (−)', 8, gelY + 14);
      ctx.fillStyle = uvMode ? '#34d399' : '#059669';
      ctx.fillText('Cực (+)', 8, gelY + gelH - 4);

      // Vạch thuốc nhuộm chỉ thị xanh chạy trước (Bromophenol Blue Loading Dye Front)
      if (minutes > 0) {
        const dyeFrac = Math.min(0.97, calcGelMigrationFraction(120, { voltage, minutes, gelPct }) * 1.04);
        const dyeY = gelY + 24 + dyeFrac * (gelH - 34);
        ctx.save();
        ctx.strokeStyle = uvMode ? 'rgba(59, 130, 246, 0.42)' : 'rgba(37, 99, 235, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(gelX + 4, dyeY); ctx.lineTo(gelX + gelW - 4, dyeY); ctx.stroke();
        ctx.restore();
      }

      const laneW = gelW / sc.lanes.length;
      sc.lanes.forEach((lane, li) => {
        const cx = gelX + laneW * li + laneW / 2;

        // Giếng nạp mẫu 3D lõm
        ctx.fillStyle = uvMode ? '#1e293b' : '#cbd5e1';
        ctx.beginPath(); ctx.roundRect(cx - 24, gelY + 8, 48, 10, 3); ctx.fill();
        ctx.strokeStyle = uvMode ? '#475569' : '#64748b';
        ctx.stroke();

        // Tên giếng mẫu phía trên buồng
        ctx.fillStyle = uvMode ? '#e2e8f0' : '#0f172a';
        ctx.font = '700 10.5px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(lane.name, cx, gelY - 20);

        // Các băng DNA phát huỳnh quang SYBR Safe / Ethidium Bromide
        lane.bands.forEach((bp) => {
          const frac = calcGelMigrationFraction(bp, { voltage, minutes, gelPct });
          const by = gelY + 24 + frac * (gelH - 34);
          const isMatchedHover = hoverInfo && hoverInfo.bp === bp && hoverInfo.laneIdx === li;
          ctx.save();
          if (uvMode) {
            ctx.shadowColor = isMatchedHover ? '#facc15' : lane.isLadder ? '#38bdf8' : '#22c55e';
            ctx.shadowBlur = isMatchedHover ? 16 : 11;
            ctx.fillStyle = isMatchedHover ? '#fef08a' : lane.isLadder ? '#7dd3fc' : '#86efac';
          } else {
            ctx.fillStyle = isMatchedHover ? '#d97706' : lane.isLadder ? '#1d4ed8' : '#047857';
          }
          ctx.beginPath();
          ctx.roundRect(cx - 22, by - 2.6, 44, isMatchedHover ? 6.2 : 5.2, 2.5);
          ctx.fill();
          ctx.restore();

          if (lane.isLadder && [10000, 3000, 1500, 1000, 500, 100].includes(bp)) {
            ctx.fillStyle = uvMode ? '#94a3b8' : '#334155';
            ctx.font = '700 9.5px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${bp >= 1000 ? `${bp / 1000}kb` : `${bp}bp`}`, gelX - 13, by + 3);
          }
        });
      });

      // Thước laser UV gióng ngang khi rê chuột lên băng DNA
      if (hoverInfo) {
        ctx.save();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(gelX, hoverInfo.y);
        ctx.lineTo(gelX + gelW, hoverInfo.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const boxW = 196;
        const boxX = Math.min(W - boxW - 10, Math.max(gelX + 8, hoverInfo.x + 12));
        const boxY = Math.max(gelY + 6, hoverInfo.y - 32);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, 24, 7); ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.font = '700 10.5px system-ui';
        ctx.textAlign = 'left';
        ctx.fillText(`${hoverInfo.laneName}: ${hoverInfo.bp.toLocaleString('vi-VN')} bp`, boxX + 8, boxY + 15.5);
        ctx.restore();
      }

      ctx.textAlign = 'left';
      if (running) raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [sc, voltage, gelPct, minutes, uvMode, running, hoverInfo, gelX, gelY, gelW, gelH]);

  const handleMouseMove = (e) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * cvs.width;
    const my = ((e.clientY - rect.top) / rect.height) * cvs.height;

    const laneW = gelW / sc.lanes.length;
    let best = null;
    let bestDist = 14;
    sc.lanes.forEach((lane, li) => {
      const cx = gelX + laneW * li + laneW / 2;
      if (Math.abs(mx - cx) > laneW * 0.5) return;
      lane.bands.forEach((bp) => {
        const frac = calcGelMigrationFraction(bp, { voltage, minutes, gelPct });
        const by = gelY + 24 + frac * (gelH - 34);
        const d = Math.abs(my - by);
        if (d < bestDist) {
          bestDist = d;
          best = { x: mx, y: by, bp, laneName: lane.name, laneIdx: li };
        }
      });
    });
    setHoverInfo(best);
  };

  return (
    <div className="bl-grid-2">
      <div>
        <div className="bl-tabs">
          {Object.entries(GEL_SCENARIOS).map(([k, v]) => (
            <button key={k} type="button" className={`bl-tab${scenario === k ? ' on' : ''}`} onClick={() => setScenario(k)}>
              {v.title.split(' (')[0]}
            </button>
          ))}
        </div>

        <div className="bl-canvas-box">
          <canvas
            ref={canvasRef}
            width={560}
            height={352}
            style={{ cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverInfo(null)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="bl-btn primary" onClick={() => { if (minutes >= 75) setMinutes(0); setRunning((r) => !r); }}>
            {running ? 'Dừng điện di' : '⚡ Bật nguồn chạy điện di'}
          </button>
          <button type="button" className="bl-btn" onClick={() => { setRunning(false); setMinutes(0); }}>
            Nạp lại giếng (0 phút)
          </button>
          <button type="button" className={`bl-btn${uvMode ? ' is-on' : ''}`} onClick={() => setUvMode((u) => !u)}>
            {uvMode ? 'Đèn UV huỳnh quang: Bật' : 'Chế độ nhuộm xanh'}
          </button>
          <span style={{ fontSize: '0.73rem', color: 'var(--bl-mut)' }}>Rê chuột lên băng DNA để đo kích thước (bp)</span>
        </div>
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>Thông số Buồng Điện Di Gel Agarose</h4>
          <div className="bl-controls">
            <label className="bl-slider-row">
              <header><span>Hiệu điện thế nguồn (U)</span><b>{voltage} V</b></header>
              <input type="range" min={50} max={160} step={10} value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} />
            </label>
            <label className="bl-slider-row">
              <header><span>Nồng độ Gel Agarose</span><b>{gelPct.toFixed(1)}%</b></header>
              <input type="range" min={0.6} max={2.2} step={0.2} value={gelPct} onChange={(e) => setGelPct(Number(e.target.value))} />
            </label>
            <label className="bl-slider-row">
              <header><span>Thời gian chạy điện di</span><b>{minutes} phút</b></header>
              <input type="range" min={0} max={75} step={1} value={minutes} onChange={(e) => { setRunning(false); setMinutes(Number(e.target.value)); }} />
            </label>
          </div>
        </div>

        <div className="bl-panel bl-highlight-card" style={{ '--card-accent': '#38bdf8' }}>
          <h4>Phân tích Kết quả Bản Gel UV</h4>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.52, color: 'var(--bl-mut)' }}>{sc.note}</p>
          <table className="bl-table">
            <thead>
              <tr><th>Giếng mẫu</th><th>Các băng DNA (bp)</th></tr>
            </thead>
            <tbody>
              {sc.lanes.filter((l) => !l.isLadder).map((l) => (
                <tr key={l.name}>
                  <td><strong>{l.name}</strong></td>
                  <td style={{ fontFamily: 'monospace' }}>{l.bands.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
