import React, { useEffect, useRef, useState } from 'react';

const SPECIMENS = [
  {
    id: 'onion',
    name: 'Biểu bì vảy hành tây',
    stain: 'Nhuộm Iodine',
    idealFocus: 52,
    scaleNote: 'Tế bào hình chữ nhật xếp khít, có thành cellulose dày & nhân tròn rõ',
    summary: 'Mẫu tiêu bản kinh điển Sinh học 10: quan sát rõ thành tế bào thực vật, tế bào chất và nhân bắt màu vàng nâu của Iodine.',
  },
  {
    id: 'cheek',
    name: 'Tế bào niêm mạc má người',
    stain: 'Xanh Methylen',
    idealFocus: 48,
    scaleNote: 'Tế bào động vật không có thành cứng, hình đa giác mềm, nhân bắt màu xanh đậm',
    summary: 'Cho thấy sự khác biệt rõ rệt với tế bào thực vật: không có thành cellulose, không có không bào trung tâm hay lục lạp.',
  },
  {
    id: 'rbc',
    name: 'Tiêu bản máu — Hồng cầu người',
    stain: 'Giemsa',
    idealFocus: 62,
    scaleNote: 'Đĩa lõm 2 mặt (~7.5 µm), không nhân, kèm vài bạch cầu có nhân tím',
    summary: 'Hình đĩa lõm 2 mặt giúp tăng diện tích tiếp xúc khí O₂ và dễ dàng biến dạng chui qua mao mạch siêu nhỏ.',
  },
  {
    id: 'elodea',
    name: 'Lá rong đuôi chó (Lục lạp)',
    stain: 'Tiêu bản tươi',
    idealFocus: 55,
    scaleNote: 'Hàng chục lục lạp xanh lục chuyển động dòng tế bào chất quanh không bào',
    summary: 'Quan sát trực tiếp hiện tượng chuyển động dòng tế bào chất (cyclosis) mang lục lạp đón ánh sáng.',
  },
  {
    id: 'paramecium',
    name: 'Trùng giày (Paramecium)',
    stain: 'Tiêu bản sống',
    idealFocus: 44,
    scaleNote: 'Động vật nguyên sinh có lông bơi, không bào co bóp hình hoa thị & nhân lớn',
    summary: 'Sinh vật đơn bào nhân thực sống nước ngọt, di chuyển linh hoạt nhờ hàng nghìn tiêm mao rung nhịp nhàng.',
  },
  {
    id: 'euglena',
    name: 'Trùng roi xanh (Euglena)',
    stain: 'Tiêu bản sống',
    idealFocus: 50,
    scaleNote: 'Cơ thể hình thoi, chứa lục lạp xanh, điểm mắt đỏ và roi bơi phía trước',
    summary: 'Sinh vật trung gian thú vị: vừa tự dưỡng quang hợp khi có ánh sáng, vừa dị dưỡng trong bóng tối.',
  },
  {
    id: 'ecoli',
    name: 'Vi khuẩn E. coli (Nhân sơ)',
    stain: 'Nhuộm Gram âm',
    idealFocus: 74,
    scaleNote: 'Trực khuẩn hình que siêu nhỏ (~2 µm), nên dùng vật kính 40x hoặc 100x',
    summary: 'Tế bào nhân sơ không có màng nhân, bắt màu hồng đỏ trong phương pháp nhuộm Gram (Gram âm).',
  },
  {
    id: 'root-mitosis',
    name: 'Đỉnh sinh trưởng rễ hành (Nguyên phân)',
    stain: 'Carmine acetat',
    idealFocus: 66,
    scaleNote: 'Quan sát đồng thời các tế bào ở Kì đầu, Kì giữa (xếp 1 hàng), Kì sau (tách 2 cực)',
    summary: 'Bài thực hành trọng tâm Sinh học 10: nhận diện nhanh các kì nguyên phân qua hình thái nhiễm sắc thể.',
  },
];

const OBJECTIVES = [
  { mag: 4, total: 40, label: '4× (40×)', scaleUm: 250, color: '#ef4444' },
  { mag: 10, total: 100, label: '10× (100×)', scaleUm: 100, color: '#eab308' },
  { mag: 40, total: 400, label: '40× (400×)', scaleUm: 25, color: '#3b82f6' },
  { mag: 100, total: 1000, label: '100× Dầu (1000×)', scaleUm: 10, color: '#f8fafc' },
];

function drawSpecimen(ctx, id, zoom, panX, panY, timeSec) {
  ctx.save();
  ctx.translate(220 + panX * zoom, 220 + panY * zoom);
  ctx.scale(zoom, zoom);

  if (id === 'onion') {
    for (let r = -4; r <= 4; r++) {
      for (let c = -3; c <= 3; c++) {
        const x = c * 74 + (r % 2 ? 36 : 0);
        const y = r * 36;
        ctx.fillStyle = 'rgba(254, 243, 199, 0.55)';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(x - 35, y - 16, 70, 32, 4);
        ctx.fill();
        ctx.stroke();
        // Nhân tế bào
        ctx.beginPath();
        ctx.arc(x + ((c * 11 + r * 7) % 16) - 6, y + ((r * 5) % 6) - 2, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#b45309';
        ctx.fill();
      }
    }
  } else if (id === 'cheek') {
    const cells = [
      [-65, -40, 26], [30, -55, 29], [80, 15, 25], [-18, 22, 31],
      [-90, 48, 24], [45, 72, 27], [0, -100, 24], [-110, -25, 22],
    ];
    cells.forEach(([cx, cy, rad], idx) => {
      ctx.beginPath();
      for (let a = 0; a < 10; a++) {
        const ang = (a / 10) * Math.PI * 2;
        const rr = rad * (0.86 + 0.18 * Math.sin(a * 2.3 + idx));
        const px = cx + Math.cos(ang) * rr;
        const py = cy + Math.sin(ang) * rr;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(147, 197, 253, 0.48)';
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 3, cy - 2, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = '#1e3a8a';
      ctx.fill();
    });
  } else if (id === 'rbc') {
    for (let i = 0; i < 42; i++) {
      const ang = i * 2.39996;
      const dist = 16 + Math.sqrt(i) * 24;
      const x = Math.cos(ang) * dist;
      const y = Math.sin(ang) * dist;
      if (i % 13 === 4) {
        // Bạch cầu
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(216, 180, 254, 0.72)';
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - 3, y - 1, 4.2, 0, Math.PI * 2);
        ctx.arc(x + 3.5, y + 2, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = '#581c87';
        ctx.fill();
      } else {
        // Hồng cầu đĩa lõm
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 3.3, 0, Math.PI * 2);
        ctx.fillStyle = '#fca5a5';
        ctx.fill();
      }
    }
  } else if (id === 'elodea') {
    for (let r = -3; r <= 3; r++) {
      for (let c = -3; c <= 3; c++) {
        const x = c * 62;
        const y = r * 40;
        ctx.fillStyle = 'rgba(220, 252, 231, 0.55)';
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(x - 29, y - 18, 58, 36);
        ctx.fillRect(x - 29, y - 18, 58, 36);
        // Lục lạp chuyển động vòng quanh thành tế bào
        for (let k = 0; k < 8; k++) {
          const ph = timeSec * 0.6 + k * 0.78 + r + c;
          const cx = x + Math.cos(ph) * 20;
          const cy = y + Math.sin(ph) * 11;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 4.2, 2.5, ph, 0, Math.PI * 2);
          ctx.fillStyle = '#16a34a';
          ctx.fill();
        }
      }
    }
  } else if (id === 'paramecium') {
    const swimmers = [
      { bx: -24, by: -18, spd: 0.7, rot: 0.35 },
      { bx: 52, by: 42, spd: -0.55, rot: -0.7 },
    ];
    swimmers.forEach((sw) => {
      const px = sw.bx + Math.sin(timeSec * sw.spd) * 26;
      const py = sw.by + Math.cos(timeSec * sw.spd * 0.8) * 18;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(sw.rot + Math.sin(timeSec * 0.5) * 0.15);
      // Cơ thể hình đế giày
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 15, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      // Nhân lớn
      ctx.beginPath();
      ctx.ellipse(-4, -1, 10, 5.5, 0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      // Không bào co bóp
      const pulse = 3.5 + 1.5 * Math.sin(timeSec * 3.2);
      ctx.beginPath();
      ctx.arc(-26, 0, pulse, 0, Math.PI * 2);
      ctx.arc(24, 0, pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#0ea5e9';
      ctx.stroke();
      ctx.restore();
    });
  } else if (id === 'euglena') {
    const units = [[-36, -24, 0.4], [28, 12, -0.5], [-10, 56, 1.1]];
    units.forEach(([ux, uy, ang], idx) => {
      const px = ux + Math.cos(timeSec * 0.9 + idx) * 16;
      const py = uy + Math.sin(timeSec * 0.8 + idx) * 12;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang + Math.sin(timeSec + idx) * 0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 8.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(74, 222, 128, 0.72)';
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
      // Điểm mắt đỏ
      ctx.beginPath();
      ctx.arc(17, -2, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      // Roi bơi uốn lượn
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.quadraticCurveTo(38, Math.sin(timeSec * 8 + idx) * 8, 48, 0);
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
  } else if (id === 'ecoli') {
    for (let i = 0; i < 65; i++) {
      const ang = i * 2.39996;
      const dist = 8 + Math.sqrt(i) * 19;
      const x = Math.cos(ang) * dist;
      const y = Math.sin(ang) * dist;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(i * 0.85);
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.roundRect(-4.5, -1.6, 9, 3.2, 1.6);
      ctx.fill();
      ctx.restore();
    }
  } else if (id === 'root-mitosis') {
    const phases = ['inter', 'pro', 'meta', 'ana', 'telo'];
    for (let r = -2; r <= 2; r++) {
      for (let c = -3; c <= 3; c++) {
        const x = c * 52;
        const y = r * 52;
        const ph = phases[Math.abs(r * 3 + c) % phases.length];
        ctx.fillStyle = 'rgba(255, 228, 230, 0.65)';
        ctx.strokeStyle = '#9f1239';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x - 24, y - 24, 48, 48);
        ctx.fillRect(x - 24, y - 24, 48, 48);

        ctx.strokeStyle = '#881337';
        ctx.fillStyle = '#881337';
        ctx.lineWidth = 2;
        if (ph === 'inter') {
          ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        } else if (ph === 'pro') {
          for (let k = 0; k < 5; k++) {
            ctx.beginPath();
            ctx.moveTo(x - 8 + k * 4, y - 7);
            ctx.lineTo(x - 5 + k * 3, y + 6);
            ctx.stroke();
          }
        } else if (ph === 'meta') {
          for (let k = -2; k <= 2; k++) {
            ctx.beginPath();
            ctx.moveTo(x + k * 5, y - 5);
            ctx.lineTo(x + k * 5, y + 5);
            ctx.stroke();
          }
        } else if (ph === 'ana') {
          for (let k = -2; k <= 2; k++) {
            ctx.beginPath();
            ctx.moveTo(x + k * 4, y - 14); ctx.lineTo(x + k * 4, y - 7);
            ctx.moveTo(x + k * 4, y + 7); ctx.lineTo(x + k * 4, y + 14);
            ctx.stroke();
          }
        } else {
          ctx.beginPath(); ctx.arc(x, y - 11, 5.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x, y + 11, 5.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
      }
    }
  }
  ctx.restore();
}

export default function VirtualMicroscopeSim({ onAskAI }) {
  const [specimenId, setSpecimenId] = useState('onion');
  const [objIdx, setObjIdx] = useState(1); // default 10x (100x)
  const [coarseFocus, setCoarseFocus] = useState(46);
  const [fineFocus, setFineFocus] = useState(0);
  const [lightPct, setLightPct] = useState(82);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const canvasRef = useRef(null);
  const spec = SPECIMENS.find((s) => s.id === specimenId) || SPECIMENS[0];
  const obj = OBJECTIVES[objIdx] || OBJECTIVES[1];

  const actualFocus = coarseFocus + fineFocus * 0.25;
  const focusError = Math.abs(actualFocus - spec.idealFocus);
  // Độ nét tăng độ nhạy ở vật kính lớn
  const blurPx = Math.min(14, Math.max(0, (focusError - 1.2) * (0.28 + objIdx * 0.14)));
  const isSharp = blurPx < 0.8;

  useEffect(() => {
    let rafId = 0;
    const render = (ts) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Nền ngoài thị trường (đen quang học)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);

      // Cắt tròn thị trường kính hiển vi
      ctx.save();
      ctx.beginPath();
      ctx.arc(220, 220, 198, 0, Math.PI * 2);
      ctx.clip();

      // Ánh sáng tụ quang
      const lum = Math.round(140 + (lightPct / 100) * 112);
      ctx.fillStyle = `rgb(${lum}, ${Math.min(255, lum + 2)}, ${Math.max(120, lum - 6)})`;
      ctx.fillRect(0, 0, W, H);

      const zoomFactor = [0.65, 1.15, 2.25, 3.6][objIdx] || 1.15;
      drawSpecimen(ctx, specimenId, zoomFactor, panX, panY, ts * 0.001);

      // Thước chữ thập thị kính (reticle)
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(220, 30); ctx.lineTo(220, 410);
      ctx.moveTo(30, 220); ctx.lineTo(410, 220);
      ctx.stroke();

      // Vignette viền thị kính
      const grad = ctx.createRadialGradient(220, 220, 150, 220, 220, 200);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.42)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Viền tròn thị kính + Thanh tỉ lệ µm
      ctx.beginPath();
      ctx.arc(220, 220, 198, 0, Math.PI * 2);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Thanh đo kích thước (Scale bar)
      ctx.fillStyle = 'rgba(15,23,42,0.78)';
      ctx.fillRect(298, 386, 114, 28);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(310, 405);
      ctx.lineTo(366, 405);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${obj.scaleUm} µm`, 372, 409);

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [specimenId, objIdx, lightPct, panX, panY, obj.scaleUm]);

  const autoFocus = () => {
    setCoarseFocus(spec.idealFocus);
    setFineFocus(0);
  };

  return (
    <div className="bl-grid-2">
      <div className="bl-stage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
          <canvas
            ref={canvasRef}
            width={440}
            height={440}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 16,
              display: 'block',
              filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
              transition: 'filter 0.08s linear',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'rgba(15,23,42,0.82)',
              color: '#fff',
              padding: '5px 10px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {obj.total}× · {isSharp ? 'Nét chuẩn' : `Lệch tiêu cự (${blurPx.toFixed(1)}px)`}
          </div>
        </div>

        <div className="bl-info-card" style={{ width: '100%', marginTop: 12 }}>
          <h4>Tiêu bản: {spec.name} ({spec.stain})</h4>
          <p>{spec.summary}</p>
          <p style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>
            <strong>Đặc điểm nhận diện:</strong> {spec.scaleNote}
          </p>
        </div>
      </div>

      <div className="bl-panel">
        <div className="bl-ctrl">
          <label>Chọn tiêu bản sinh học (8 mẫu chuẩn SGK)</label>
          <div className="bl-toggle-grid">
            {SPECIMENS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`bl-toggle-chip${specimenId === s.id ? ' on' : ''}`}
                onClick={() => {
                  setSpecimenId(s.id);
                  setPanX(0);
                  setPanY(0);
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bl-ctrl">
          <label>Mâm xoay vật kính (Thị kính 10× × Vật kính)</label>
          <div className="bl-seg">
            {OBJECTIVES.map((o, i) => (
              <button
                key={o.mag}
                type="button"
                className={objIdx === i ? 'active' : ''}
                onClick={() => setObjIdx(i)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Ốc sơ cấp (Chỉnh nét thô)</label>
            <strong>{coarseFocus} (Chuẩn mẫu: {spec.idealFocus})</strong>
          </div>
          <input type="range" className="bl-range" min="10" max="90" step="1" value={coarseFocus} onChange={(e) => setCoarseFocus(Number(e.target.value))} />
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Ốc vi cấp (Chỉnh nét tinh)</label>
            <strong>{fineFocus > 0 ? `+${fineFocus}` : fineFocus}</strong>
          </div>
          <input type="range" className="bl-range" min="-16" max="16" step="1" value={fineFocus} onChange={(e) => setFineFocus(Number(e.target.value))} />
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Đèn tụ quang (Cường độ sáng)</label>
            <strong>{lightPct}%</strong>
          </div>
          <input type="range" className="bl-range" min="25" max="100" step="5" value={lightPct} onChange={(e) => setLightPct(Number(e.target.value))} />
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>Dịch chuyển bàn kính (Trục X / Y)</label>
            <strong>X:{panX} · Y:{panY}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input type="range" className="bl-range" min="-80" max="80" step="5" value={panX} onChange={(e) => setPanX(Number(e.target.value))} />
            <input type="range" className="bl-range" min="-80" max="80" step="5" value={panY} onChange={(e) => setPanY(Number(e.target.value))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="bl-btn" onClick={autoFocus}>
            Lấy nét tự động
          </button>
          <button
            type="button"
            className="bl-btn cobalt"
            onClick={() =>
              onAskAI?.(
                `Hướng dẫn quy trình thao tác kính hiển vi quang học đúng chuẩn khi soi mẫu "${spec.name}" ở độ phóng đại ${obj.total}× (tại sao không được dùng ốc sơ cấp khi đang ở vật kính 40×/100×)?`
              )
            }
          >
            Hỏi Bé ELEC quy trình soi kính
          </button>
        </div>
      </div>
    </div>
  );
}
