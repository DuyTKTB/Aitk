import React, { useEffect, useRef, useState } from 'react';

const MITOSIS_STAGES = [
  { id: 'interphase', short: 'Trung gian', title: 'Kì trung gian (Pha S)', nst: '2n kép (4)', chromatid: '4n (8)', dna: '4C', desc: 'DNA và NST nhân đôi thành NST kép gồm 2 chromatid chị em dính nhau ở tâm động; trung thể nhân đôi chuẩn bị phân bào.' },
  { id: 'prophase', short: 'Kì đầu', title: 'Kì đầu', nst: '2n kép (4)', chromatid: '4n (8)', dna: '4C', desc: 'NST kép co xoắn dần rõ rệt; màng nhân và nhân con tiêu biến; 2 trung thể tiến về 2 cực tạo thoi phân bào.' },
  { id: 'metaphase', short: 'Kì giữa', title: 'Kì giữa', nst: '2n kép (4)', chromatid: '4n (8)', dna: '4C', desc: 'NST kép co xoắn cực đại, xếp thành 1 HÀNG ngay ngắn trên mặt phẳng xích đạo; sợi thoi bám 2 phía tâm động.' },
  { id: 'anaphase', short: 'Kì sau', title: 'Kì sau', nst: '4n đơn (8)', chromatid: '0', dna: '4C', desc: 'Từng NST kép tách đôi ở tâm động thành 2 NST đơn, được sợi thoi co rút kéo đồng đều về 2 cực tế bào.' },
  { id: 'telophase', short: 'Kì cuối', title: 'Kì cuối & Phân chia tế bào chất', nst: '2n đơn / tb (4)', chromatid: '0', dna: '2C / tb', desc: 'Màng tế bào thắt eo chia đôi tế bào chất, màng nhân tái lập tạo 2 tế bào con giống hệt nhau và giống tế bào mẹ (2n).' },
];

const MEIOSIS_STAGES = [
  { id: 'interphase', short: 'Trung gian', title: 'Kì trung gian (Pha S)', nst: '2n kép (4)', chromatid: '4n (8)', dna: '4C', desc: 'DNA chỉ nhân đôi 1 lần duy nhất trước khi bước vào 2 lần phân bào liên tiếp (Giảm phân I & II).' },
  { id: 'pro1', short: 'Kì đầu I', title: 'Kì đầu I (Tiếp hợp & Trao đổi chéo)', nst: '2n kép (4)', chromatid: '4n (8)', dna: '4C', desc: 'Các NST kép trong cặp tương đồng bắt đôi tiếp hợp và trao đổi chéo đoạn chromatid tạo biến dị tổ hợp.' },
  { id: 'meta1', short: 'Kì giữa I', title: 'Kì giữa I', nst: '2n kép (4)', chromatid: '4n (8)', dna: '4C', desc: 'Các cặp NST tương đồng kép xếp thành 2 HÀNG song song trên mặt phẳng xích đạo của thoi phân bào.' },
  { id: 'ana1', short: 'Kì sau I', title: 'Kì sau I', nst: '2n kép (4)', chromatid: '4n (8)', dna: '4C', desc: 'Mỗi NST kép trong cặp tương đồng phân li độc lập về 2 cực tế bào (KHÔNG tách tâm động).' },
  { id: 'telo1', short: 'Kì cuối I', title: 'Kì cuối I (2 tế bào con n kép)', nst: 'n kép / tb (2)', chromatid: '2n (4)', dna: '2C / tb', desc: 'Tạo 2 tế bào con có bộ NST đơn bội kép (n NST kép), số lượng NST giảm đi một nửa.' },
  { id: 'meta2', short: 'Kì giữa II', title: 'Kì giữa II', nst: 'n kép / tb (2)', chromatid: '2n (4)', dna: '2C / tb', desc: 'Ở mỗi tế bào con, n NST kép xếp thành 1 hàng trên mặt phẳng xích đạo (tương tự nguyên phân).' },
  { id: 'ana2', short: 'Kì sau II', title: 'Kì sau II', nst: '2n đơn / tb (4)', chromatid: '0', dna: '2C / tb', desc: 'Tâm động tách đôi, các NST đơn phân li về 2 cực của từng tế bào con.' },
  { id: 'telo2', short: 'Kì cuối II', title: 'Kì cuối II (4 tế bào đơn bội n)', nst: 'n đơn / tb (2)', chromatid: '0', dna: '1C / tb', desc: 'Hình thành 4 tế bào con đơn bội (n), hàm lượng DNA giảm còn 1C làm cơ sở tạo giao tử.' },
];

export default function MitosisMeiosisSim() {
  const [mode, setMode] = useState('mitosis');
  const [stageIdx, setStageIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(1900);
  const canvasRef = useRef(null);

  const stages = mode === 'mitosis' ? MITOSIS_STAGES : MEIOSIS_STAGES;
  const cur = stages[Math.min(stageIdx, stages.length - 1)];

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => {
      setStageIdx((i) => (i + 1) % stages.length);
    }, speedMs);
    return () => clearInterval(t);
  }, [running, speedMs, stages.length]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return undefined;
    const ctx = cvs.getContext('2d');
    let raf = 0;
    const startTs = performance.now();

    const drawFluorescentChrom = (x, y, color, size = 18, single = false, swapped = false, angle = 0) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 5.2;
      ctx.lineCap = 'round';
      if (single) {
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.72);
        ctx.quadraticCurveTo(size * 0.14, 0, 0, size * 0.72);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-size * 0.44, -size * 0.78);
        ctx.quadraticCurveTo(0, 0, size * 0.44, size * 0.78);
        ctx.moveTo(size * 0.44, -size * 0.78);
        ctx.quadraticCurveTo(0, 0, -size * 0.44, size * 0.78);
        ctx.stroke();
        if (swapped) {
          const swapCol = color === '#38bdf8' ? '#fb7185' : '#38bdf8';
          ctx.shadowColor = swapCol;
          ctx.strokeStyle = swapCol;
          ctx.beginPath();
          ctx.moveTo(size * 0.22, size * 0.38);
          ctx.lineTo(size * 0.44, size * 0.78);
          ctx.stroke();
        }
      }
      // Tâm động phát sáng vàng trắng
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawCell = (cx, cy, rx, ry, pinch = 0, showNucleus = false, dashedNucleus = false) => {
      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy - ry * 0.2, rx * 0.12, cx, cy, Math.max(rx, ry));
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
      grad.addColorStop(0.75, 'rgba(6, 182, 212, 0.1)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.04)');

      ctx.beginPath();
      if (pinch > 0.01) {
        // Màng tế bào thắt eo (Cleavage furrow)
        const waist = ry * (1 - pinch * 0.65);
        ctx.moveTo(cx, cy - waist);
        ctx.bezierCurveTo(cx + rx * 0.55, cy - ry * 1.12, cx + rx, cy - ry * 0.5, cx + rx, cy);
        ctx.bezierCurveTo(cx + rx, cy + ry * 0.5, cx + rx * 0.55, cy + ry * 1.12, cx, cy + waist);
        ctx.bezierCurveTo(cx - rx * 0.55, cy + ry * 1.12, cx - rx, cy + ry * 0.5, cx - rx, cy);
        ctx.bezierCurveTo(cx - rx, cy - ry * 0.5, cx - rx * 0.55, cy - ry * 1.12, cx, cy - waist);
      } else {
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      }
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (showNucleus) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.48, ry * 0.54, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.14)';
        ctx.fill();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        if (dashedNucleus) ctx.setLineDash([6, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    };

    const drawSpindle = (cx, cy, spanX, t) => {
      ctx.save();
      [-52, -26, 0, 26, 52].forEach((dy) => {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(cx - spanX, cy);
        ctx.quadraticCurveTo(cx, cy + dy * 1.35, cx + spanX, cy);
        ctx.stroke();
      });
      // Hai trung thể phát tia sao vô sắc xoay nhẹ
      [-spanX, spanX].forEach((dx) => {
        const px = cx + dx;
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2 + t * 0.5;
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(px, cy);
          ctx.lineTo(px + Math.cos(ang) * 14, cy + Math.sin(ang) * 14);
          ctx.stroke();
        }
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(px, cy, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.restore();
    };

    const render = (now) => {
      const W = cvs.width;
      const H = cvs.height;
      const t = (now - startTs) / 1000;
      const ease = Math.min(1, t / 0.65);
      const smooth = 1 - Math.pow(1 - ease, 3);
      const breath = Math.sin(t * 2.4) * 2.5;

      // Nền kính hiển vi huỳnh quang tối sâu + lưới micromet mờ
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 310);
      bgGrad.addColorStop(0, '#0d1f3d');
      bgGrad.addColorStop(1, '#040a17');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 32) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 32) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      const id = cur.id;
      const colors = ['#38bdf8', '#fb7185', '#34d399', '#f59e0b'];

      if (id === 'interphase' || id === 'prophase') {
        drawCell(W / 2, H / 2, 152, 114, 0, true, id === 'prophase');
        if (id === 'prophase') drawSpindle(W / 2, H / 2, 122, t);
        [[-26, -24], [26, -22], [-24, 24], [26, 22]].forEach(([dx, dy], i) => {
          drawFluorescentChrom(W / 2 + dx, H / 2 + dy + Math.sin(t * 2 + i) * 2, colors[i], 16, false, false, Math.sin(t + i) * 0.14);
        });
      } else if (id === 'metaphase') {
        drawCell(W / 2, H / 2, 162, 114);
        drawSpindle(W / 2, H / 2, 134, t);
        // Đường mặt phẳng xích đạo nét đứt
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(W / 2, H / 2 - 92); ctx.lineTo(W / 2, H / 2 + 92); ctx.stroke();
        ctx.restore();
        [-62, -20, 20, 62].forEach((dy, i) => {
          const curX = W / 2 + (1 - smooth) * ((i % 2 === 0 ? -24 : 24));
          drawFluorescentChrom(curX, H / 2 + dy, colors[i], 16, false, false, 0);
        });
      } else if (id === 'anaphase') {
        drawCell(W / 2, H / 2, 184, 108, smooth * 0.42);
        drawSpindle(W / 2, H / 2, 154, t);
        const pull = 28 + smooth * 58;
        [-52, -17, 17, 52].forEach((dy, i) => {
          drawFluorescentChrom(W / 2 - pull, H / 2 + dy, colors[i], 15, true, false, -0.2);
          drawFluorescentChrom(W / 2 + pull, H / 2 + dy, colors[i], 15, true, false, 0.2);
        });
      } else if (id === 'telophase') {
        const sep = 62 + smooth * 52;
        drawCell(W / 2 - sep, H / 2, 94, 86, 0, true, false);
        drawCell(W / 2 + sep, H / 2, 94, 86, 0, true, false);
        [-32, -11, 11, 32].forEach((dy, i) => {
          drawFluorescentChrom(W / 2 - sep + (i % 2 === 0 ? -16 : 16), H / 2 + dy * 0.72, colors[i], 13, true);
          drawFluorescentChrom(W / 2 + sep + (i % 2 === 0 ? -16 : 16), H / 2 + dy * 0.72, colors[i], 13, true);
        });
      } else if (id === 'pro1') {
        drawCell(W / 2, H / 2, 158, 114, 0, true, true);
        drawSpindle(W / 2, H / 2, 126, t);
        // Hiệu ứng phát sáng vùng trao đổi chéo (Chiasma)
        ctx.save();
        ctx.fillStyle = `rgba(250, 204, 21, ${0.22 + 0.16 * Math.sin(t * 5)})`;
        ctx.beginPath(); ctx.arc(W / 2, H / 2 - 24, 18, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        drawFluorescentChrom(W / 2 - 12, H / 2 - 34, colors[0], 17, false, true);
        drawFluorescentChrom(W / 2 + 12, H / 2 - 34, colors[1], 17, false, true);
        drawFluorescentChrom(W / 2 - 12, H / 2 + 34, colors[2], 15, false, false);
        drawFluorescentChrom(W / 2 + 12, H / 2 + 34, colors[3], 15, false, false);
      } else if (id === 'meta1') {
        drawCell(W / 2, H / 2, 166, 114);
        drawSpindle(W / 2, H / 2, 136, t);
        const gap = 14 + smooth * 12;
        drawFluorescentChrom(W / 2 - gap, H / 2 - 34, colors[0], 17, false, true);
        drawFluorescentChrom(W / 2 + gap, H / 2 - 34, colors[1], 17, false, true);
        drawFluorescentChrom(W / 2 - gap, H / 2 + 34, colors[2], 15, false, false);
        drawFluorescentChrom(W / 2 + gap, H / 2 + 34, colors[3], 15, false, false);
      } else if (id === 'ana1') {
        drawCell(W / 2, H / 2, 186, 108, smooth * 0.45);
        drawSpindle(W / 2, H / 2, 156, t);
        const pull = 30 + smooth * 56;
        drawFluorescentChrom(W / 2 - pull, H / 2 - 32, colors[0], 17, false, true);
        drawFluorescentChrom(W / 2 - pull, H / 2 + 32, colors[2], 15, false, false);
        drawFluorescentChrom(W / 2 + pull, H / 2 - 32, colors[1], 17, false, true);
        drawFluorescentChrom(W / 2 + pull, H / 2 + 32, colors[3], 15, false, false);
      } else if (id === 'telo1' || id === 'meta2') {
        [W / 2 - 118, W / 2 + 118].forEach((cx, cellI) => {
          drawCell(cx, H / 2, 98, 90, 0, id === 'telo1', false);
          if (id === 'meta2') drawSpindle(cx, H / 2, 78, t);
          drawFluorescentChrom(cx, H / 2 - 24 + breath * 0.4, colors[cellI === 0 ? 0 : 1], 15, false, true);
          drawFluorescentChrom(cx, H / 2 + 24 - breath * 0.4, colors[cellI === 0 ? 2 : 3], 13, false, false);
        });
      } else if (id === 'ana2') {
        [W / 2 - 122, W / 2 + 122].forEach((cx, cellI) => {
          drawCell(cx, H / 2, 104, 86, smooth * 0.4);
          drawSpindle(cx, H / 2, 84, t);
          const pull = 18 + smooth * 28;
          [-pull, pull].forEach((dx) => {
            drawFluorescentChrom(cx + dx, H / 2 - 22, colors[cellI === 0 ? 0 : 1], 13, true);
            drawFluorescentChrom(cx + dx, H / 2 + 22, colors[cellI === 0 ? 2 : 3], 12, true);
          });
        });
      } else if (id === 'telo2') {
        const pos = [
          [W * 0.24, H * 0.34, 0, 2],
          [W * 0.24, H * 0.72, 0, 2],
          [W * 0.76, H * 0.34, 1, 3],
          [W * 0.76, H * 0.72, 1, 3],
        ];
        pos.forEach(([cx, cy, c1, c2]) => {
          drawCell(cx, cy, 74, 48, 0, true, false);
          drawFluorescentChrom(cx - 16, cy, colors[c1], 12, true);
          drawFluorescentChrom(cx + 16, cy, colors[c2], 11, true);
        });
      }

      // Huy hiệu góc trên kính hiển vi huỳnh quang
      ctx.fillStyle = 'rgba(6, 15, 34, 0.72)';
      ctx.beginPath(); ctx.roundRect(12, 10, W - 24, 28, 99); ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = '800 11.5px system-ui, sans-serif';
      ctx.fillText(`● ${mode === 'mitosis' ? 'NGUYÊN PHÂN' : 'GIẢM PHÂN'} (2n = 4)  ·  ${cur.title}`, 24, 28);

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [cur, mode]);

  return (
    <div className="bl-grid-2">
      <div>
        <div className="bl-tabs">
          <button
            type="button"
            className={`bl-tab${mode === 'mitosis' ? ' on' : ''}`}
            onClick={() => { setMode('mitosis'); setStageIdx(0); setRunning(false); }}
          >
            Nguyên phân (1 → 2 tế bào 2n)
          </button>
          <button
            type="button"
            className={`bl-tab${mode === 'meiosis' ? ' on' : ''}`}
            onClick={() => { setMode('meiosis'); setStageIdx(0); setRunning(false); }}
          >
            Giảm phân (1 → 4 tế bào n)
          </button>
        </div>

        <div className="bl-canvas-box">
          <canvas ref={canvasRef} width={560} height={330} />
        </div>

        {/* Timeline tiến trình kỳ phân bào */}
        <div style={{ display: 'flex', gap: 5, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {stages.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => { setRunning(false); setStageIdx(idx); }}
              style={{
                flex: '1 0 auto',
                padding: '6px 9px',
                borderRadius: 10,
                border: idx === stageIdx ? '1.5px solid #10b981' : '1px solid var(--bl-border)',
                background: idx === stageIdx ? 'rgba(16,185,129,0.16)' : idx < stageIdx ? 'rgba(16,185,129,0.06)' : 'var(--bl-surface)',
                color: 'var(--bl-ink)',
                fontSize: '0.73rem',
                fontWeight: idx === stageIdx ? 800 : 600,
                cursor: 'pointer',
              }}
            >
              {idx + 1}. {st.short}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
          <button type="button" className="bl-btn primary" onClick={() => setRunning((r) => !r)}>
            {running ? 'Tạm dừng' : '▶ Chạy tự động'}
          </button>
          <button
            type="button"
            className="bl-btn"
            onClick={() => { setRunning(false); setStageIdx((i) => Math.max(0, i - 1)); }}
            disabled={stageIdx === 0}
          >
            ← Bước trước
          </button>
          <button
            type="button"
            className="bl-btn"
            onClick={() => { setRunning(false); setStageIdx((i) => Math.min(stages.length - 1, i + 1)); }}
            disabled={stageIdx === stages.length - 1}
          >
            Bước tiếp →
          </button>
          <button type="button" className="bl-btn" onClick={() => { setRunning(false); setStageIdx(0); }}>
            Đặt lại
          </button>
        </div>
      </div>

      <div className="bl-controls">
        <div className="bl-panel bl-highlight-card" style={{ '--card-accent': '#10b981' }}>
          <h4>{cur.title} ({stageIdx + 1}/{stages.length})</h4>
          <p style={{ margin: 0, fontSize: '0.83rem', lineHeight: 1.58, color: 'var(--bl-mut)' }}>{cur.desc}</p>
          <div className="bl-kpi-grid">
            <div className="bl-kpi"><small>Số NST</small><strong>{cur.nst}</strong></div>
            <div className="bl-kpi"><small>Số Chromatid</small><strong>{cur.chromatid}</strong></div>
            <div className="bl-kpi"><small>Hàm lượng DNA</small><strong>{cur.dna}</strong></div>
          </div>
        </div>

        <div className="bl-panel">
          <h4>Tốc độ &amp; So sánh nhanh</h4>
          <label className="bl-slider-row">
            <header><span>Tốc độ chuyển kỳ tự động</span><b>{(speedMs / 1000).toFixed(1)} s/kỳ</b></header>
            <input type="range" min={900} max={3200} step={200} value={speedMs} onChange={(e) => setSpeedMs(Number(e.target.value))} />
          </label>
          <div className="bl-info-card">
            <p>
              <strong>Nguyên phân:</strong> 1 lần nhân đôi, 1 lần phân bào → 2 tế bào con <strong>2n</strong> giống hệt nhau.<br />
              <strong>Giảm phân:</strong> 1 lần nhân đôi, 2 lần phân bào → 4 tế bào con <strong>n</strong> có biến dị tổ hợp (nhờ trao đổi chéo ở Kì đầu I &amp; phân li độc lập ở Kì sau I).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
