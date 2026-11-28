import React, { useEffect, useMemo, useRef, useState } from 'react';
import { calcCellularRespiration } from '../bioEngine.js';

export default function CellularRespirationSim() {
  const [glucose, setGlucose] = useState(1);
  const [oxygenPresent, setOxygenPresent] = useState(true);
  const [fermentationType, setFermentationType] = useState('lactic');
  const [activeStage, setActiveStage] = useState('etc');
  const canvasRef = useRef(null);

  const res = useMemo(
    () => calcCellularRespiration({ glucose, oxygenPresent, fermentationType }),
    [glucose, oxygenPresent, fermentationType]
  );

  const stageObj = res.stages.find((s) => s.id === activeStage) || res.stages[0];

  // Sân khấu hoạt họa Ti thể cắt dọc 60fps: Đường phân -> Vòng xoay Krebs -> Chuỗi ETC + ATP Synthase
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return undefined;
    const ctx = cvs.getContext('2d');
    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 0.025;
      const W = cvs.width;
      const H = cvs.height;

      const bg = ctx.createRadialGradient(W * 0.62, H * 0.5, 25, W * 0.62, H * 0.5, 320);
      bg.addColorStop(0, oxygenPresent ? '#1a2344' : '#1b1b2f');
      bg.addColorStop(1, '#050b19');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Vùng 1: Tế bào chất (bên trái)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.beginPath(); ctx.roundRect(12, 14, 152, H - 28, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.stroke();
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '800 11px system-ui';
      ctx.fillText('TẾ BÀO CHẤT', 24, 34);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 11px system-ui';
      ctx.fillText('1. Đường phân', 24, 54);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10.5px system-ui';
      ctx.fillText(`${glucose} Glucose → ${2 * glucose} Pyruvate`, 24, 72);
      ctx.fillStyle = '#facc15';
      ctx.font = '800 11px system-ui';
      ctx.fillText(`+${2 * glucose} ATP · +${2 * glucose} NADH`, 24, 92);

      // Hạt phân tử Glucose / Pyruvate chạy từ trái sang phải
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.45 + i * 0.33) % 1;
        const px = 30 + u * 124;
        const py = 122 + Math.sin(u * Math.PI * 2) * 10;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
      }

      if (!oxygenPresent) {
        // Nhánh Lên men kị khí ngay trong tế bào chất
        ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
        ctx.beginPath(); ctx.roundRect(22, 154, 132, 76, 11); ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();
        ctx.fillStyle = '#fcd34d';
        ctx.font = '800 11px system-ui';
        ctx.fillText(fermentationType === 'ethanol' ? 'LÊN MEN RƯỢU' : 'LÊN MEN LACTIC', 32, 176);
        ctx.fillStyle = '#fef3c7';
        ctx.font = '10.5px system-ui';
        ctx.fillText(fermentationType === 'ethanol' ? `→ ${2 * glucose} Ethanol + ${2 * glucose} CO₂` : `→ ${2 * glucose} Acid Lactic`, 32, 198);
        ctx.fillText('Tổng chỉ có 2 ATP/Glc', 32, 218);
      }

      // Vùng 2: Ti thể cắt dọc (bên phải)
      ctx.save();
      ctx.globalAlpha = oxygenPresent ? 1 : 0.25;
      // Màng ngoài ti thể
      ctx.fillStyle = 'rgba(234, 88, 12, 0.18)';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(184, 22, 344, H - 44, 72);
      ctx.fill();
      ctx.stroke();

      // Màng trong gấp nếp hình mào Cristae
      ctx.fillStyle = 'rgba(251, 146, 60, 0.14)';
      ctx.strokeStyle = '#fdba74';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(200, 38, 312, H - 76, 56);
      ctx.fill();
      ctx.stroke();

      // Vòng xoay Chu trình Krebs (ở nửa trái ti thể)
      const kx = 285, ky = H / 2 + 4, kr = 44;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(kx, ky, kr, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const ang = t * 1.3 + (k / 4) * Math.PI * 2;
        ctx.fillStyle = k % 2 === 0 ? '#6ee7b7' : '#93c5fd';
        ctx.beginPath();
        ctx.arc(kx + Math.cos(ang) * kr, ky + Math.sin(ang) * kr, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '800 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('KREBS', kx, ky - 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px system-ui';
      ctx.fillText(`+${2 * glucose} ATP`, kx, ky + 14);

      // Chuỗi truyền Electron (ETC) + Tuabin ATP Synthase (nửa phải ti thể)
      const etcX = 372;
      ['I', 'II', 'III', 'IV'].forEach((lbl, idx) => {
        const cx = etcX + idx * 24;
        const cy = H / 2 - 22;
        ctx.fillStyle = '#2563eb';
        ctx.beginPath(); ctx.roundRect(cx - 8, cy - 14, 16, 28, 6); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 9px system-ui';
        ctx.fillText(lbl, cx, cy + 3);
      });
      // Hạt electron chạy dọc I -> IV
      const eU = (t * 0.9) % 1;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath(); ctx.arc(etcX + eU * 72, H / 2 - 22, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Tuabin ATP Synthase xoay tạo mưa hạt ATP vàng óng!
      const sx = 478, sy = H / 2 + 12;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(oxygenPresent ? t * 3.4 : 0);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      for (let b = 0; b < 6; b++) {
        const a = (b / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.stroke();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#fde047';
      ctx.font = '800 10.5px system-ui';
      ctx.fillText(`ATP Synthase`, sx - 6, sy + 36);
      ctx.fillText(`+${28 * glucose} ATP`, sx - 6, sy + 50);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fdba74';
      ctx.font = '800 11px system-ui';
      ctx.fillText(oxygenPresent ? 'TI THỂ — HÔ HẤP HIẾU KHÍ (Cần O₂)' : 'TI THỂ TẠM NGỪNG (THIẾU O₂)', 244, 58);
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [glucose, oxygenPresent, fermentationType]);

  return (
    <div className="bl-grid-2">
      <div className="bl-controls">
        <div className="bl-canvas-box">
          <canvas ref={canvasRef} width={540} height={252} />
        </div>

        <div className="bl-panel" style={{ background: '#071224', color: '#e2e8f0' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399', marginBottom: 4 }}>
            {res.mode}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {res.stages.map((st) => {
              const isOn = stageObj?.id === st.id;
              const pct = res.totals.atp > 0 ? Math.max(8, Math.round((st.atp / res.totals.atp) * 100)) : 0;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStage(st.id)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: isOn ? '1.5px solid #10b981' : '1px solid rgba(148,163,184,0.22)',
                    background: isOn ? 'rgba(16,185,129,0.16)' : 'rgba(15,23,42,0.75)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700, fontSize: '0.84rem' }}>
                    <span>{st.name}</span>
                    <span style={{ color: '#fbbf24' }}>+{st.atp} ATP</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: 4 }}>{st.note}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.72rem', marginTop: 6, color: '#93c5fd' }}>
                    <span>NADH: <b>{st.nadh}</b></span>
                    <span>FADH₂: <b>{st.fadh2}</b></span>
                    <span>CO₂: <b>{st.co2}</b></span>
                  </div>
                  {st.atp > 0 && (
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', marginTop: 7, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #10b981)' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>Điều kiện Môi trường &amp; Cơ chất</h4>
          <div className="bl-tabs">
            <button type="button" className={`bl-tab${oxygenPresent ? ' on' : ''}`} onClick={() => setOxygenPresent(true)}>
              Có O₂ (Hiếu khí)
            </button>
            <button type="button" className={`bl-tab${!oxygenPresent && fermentationType === 'lactic' ? ' on' : ''}`} onClick={() => { setOxygenPresent(false); setFermentationType('lactic'); }}>
              Không O₂ (Lên men Lactic)
            </button>
            <button type="button" className={`bl-tab${!oxygenPresent && fermentationType === 'ethanol' ? ' on' : ''}`} onClick={() => { setOxygenPresent(false); setFermentationType('ethanol'); }}>
              Không O₂ (Lên men Rượu)
            </button>
          </div>
          <label className="bl-slider-row">
            <header><span>Số phân tử Glucose đầu vào</span><b>{glucose} phân tử</b></header>
            <input type="range" min={1} max={10} step={1} value={glucose} onChange={(e) => setGlucose(Number(e.target.value))} />
          </label>
        </div>

        <div className="bl-kpi-grid">
          <div className="bl-kpi"><small>Tổng ATP thu được</small><strong style={{ color: '#059669' }}>{res.totals.atp} ATP</strong></div>
          <div className="bl-kpi"><small>Tổng NADH sinh ra</small><strong>{res.totals.nadhProduced ?? 0}</strong></div>
          <div className="bl-kpi"><small>Tổng FADH₂ sinh ra</small><strong>{res.totals.fadh2Produced ?? 0}</strong></div>
          <div className="bl-kpi"><small>CO₂ giải phóng</small><strong>{res.totals.co2} phân tử</strong></div>
          <div className="bl-kpi"><small>O₂ tiêu thụ</small><strong>{res.totals.o2Consumed} phân tử</strong></div>
          <div className="bl-kpi"><small>H₂O tạo thành</small><strong>{res.totals.h2oProduced} phân tử</strong></div>
        </div>

        <div className="bl-panel bl-highlight-card" style={{ '--card-accent': '#f59e0b' }}>
          <h4>So sánh Hiệu suất Năng lượng</h4>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.56, color: 'var(--bl-mut)' }}>
            Hô hấp hiếu khí tạo ra <b style={{ color: 'var(--bl-ink)' }}>{32 * glucose} ATP</b> — cao gấp <b style={{ color: '#059669' }}>16 lần</b> so với lên men kị khí (<b style={{ color: 'var(--bl-ink)' }}>{2 * glucose} ATP</b>), vì glucose được oxi hóa hoàn toàn đến CO₂ và H₂O trong ti thể nhờ chuỗi truyền electron &amp; tuabin ATP Synthase.
          </p>
        </div>
      </div>
    </div>
  );
}
