import { useMemo, useState } from 'react';
import { calcArchimedes, calcLinearRegression } from '../physicsEngine.js';

const MATERIALS = [
  { id: 'wood', name: 'Gỗ thông', rho: 650, color: '#d97706' },
  { id: 'ice', name: 'Nước đá', rho: 920, color: '#38bdf8' },
  { id: 'aluminum', name: 'Nhôm (Al)', rho: 2700, color: '#94a3b8' },
  { id: 'iron', name: 'Sắt (Fe)', rho: 7870, color: '#64748b' },
  { id: 'gold', name: 'Vàng (Au)', rho: 19300, color: '#eab308' },
];

const FLUIDS = [
  { id: 'oil', name: 'Dầu hỏa', rho: 800, color: 'rgba(250, 204, 21, 0.34)' },
  { id: 'water', name: 'Nước tinh khiết', rho: 1000, color: 'rgba(56, 189, 248, 0.34)' },
  { id: 'salt', name: 'Nước biển mặn', rho: 1030, color: 'rgba(14, 165, 233, 0.42)' },
  { id: 'mercury', name: 'Thủy ngân (Hg)', rho: 13600, color: 'rgba(148, 163, 184, 0.55)' },
];

export default function OlympiadLabSim({ onAskAI }) {
  const [exp, setExp] = useState('pendulum_g'); // 'pendulum_g' | 'ohm_ui' | 'archimedes'

  // === Bài 1: Đo g bằng con lắc đơn (T² theo l) ===
  const [lenM, setLenM] = useState(0.6);
  const [trueG] = useState(9.81);
  const [gSamples, setGSamples] = useState([
    { id: 1, x: 0.4, T: 1.274, y: 1.623 },
    { id: 2, x: 0.6, T: 1.549, y: 2.399 },
    { id: 3, x: 0.8, T: 1.798, y: 3.233 },
    { id: 4, x: 1.0, T: 2.002, y: 4.008 },
  ]);

  // === Bài 2: Khảo sát đặc tuyến U–I (Định luật Ôm) ===
  const [trueR] = useState(15.0);
  const [uVal, setUVal] = useState(6.0);
  const [ohmSamples, setOhmSamples] = useState([
    { id: 1, x: 0.2, y: 3.05 },
    { id: 2, x: 0.4, y: 5.96 },
    { id: 3, x: 0.6, y: 9.08 },
    { id: 4, x: 0.8, y: 11.92 },
  ]);

  // === Bài 3: Lực đẩy Archimedes (Lớp 8–10) ===
  const [matId, setMatId] = useState('wood');
  const [fluidId, setFluidId] = useState('water');
  const [volCm3, setVolCm3] = useState(300);

  const gReg = useMemo(() => calcLinearRegression(gSamples), [gSamples]);
  const measuredG = gReg && gReg.slope > 0 ? (4 * Math.PI * Math.PI) / gReg.slope : null;
  const gErrorPct = measuredG ? (Math.abs(measuredG - trueG) / trueG) * 100 : null;

  const ohmReg = useMemo(() => calcLinearRegression(ohmSamples), [ohmSamples]);
  const measuredR = ohmReg ? ohmReg.slope : null;
  const rErrorPct = measuredR ? (Math.abs(measuredR - trueR) / trueR) * 100 : null;

  const mat = MATERIALS.find((m) => m.id === matId) || MATERIALS[0];
  const fluid = FLUIDS.find((f) => f.id === fluidId) || FLUIDS[1];
  const arch = useMemo(
    () => calcArchimedes({ objDensity: mat.rho, fluidDensity: fluid.rho, volumeCm3: volCm3 }),
    [mat.rho, fluid.rho, volCm3]
  );

  const measurePendulum = () => {
    const exactT = 2 * Math.PI * Math.sqrt(lenM / trueG);
    // Sai số bấm giờ thực tế ±1.2%
    const noise = 1 + (Math.random() - 0.5) * 0.024;
    const T = Number((exactT * noise).toFixed(3));
    const T2 = Number((T * T).toFixed(3));
    setGSamples((prev) => [...prev.slice(-9), { id: Date.now(), x: Number(lenM.toFixed(2)), T, y: T2 }]);
  };

  const measureOhm = () => {
    const exactI = uVal / trueR;
    const noise = 1 + (Math.random() - 0.5) * 0.03;
    const I = Number((exactI * noise).toFixed(3));
    setOhmSamples((prev) => [...prev.slice(-9), { id: Date.now(), x: I, y: Number(uVal.toFixed(2)) }]);
  };

  const renderRegressionSvg = (pts, reg, xLabel, yLabel) => {
    const W = 700;
    const H = 290;
    const padL = 56;
    const padR = 24;
    const padT = 20;
    const padB = 42;
    const maxX = Math.max(1.2, ...pts.map((p) => p.x)) * 1.15;
    const maxY = Math.max(1.5, ...pts.map((p) => p.y)) * 1.18;
    const toX = (x) => padL + (x / maxX) * (W - padL - padR);
    const toY = (y) => H - padB - (y / maxY) * (H - padT - padB);

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="pl-svg-stage" role="img" aria-label="Đồ thị hồi quy tuyến tính thí nghiệm">
        <rect width={W} height={H} rx="14" fill="#09122b" />
        {/* Lưới */}
        {[0, 1, 2, 3, 4].map((k) => {
          const xv = (maxX * k) / 4;
          const yv = (maxY * k) / 4;
          return (
            <g key={k}>
              <line x1={toX(xv)} y1={padT} x2={toX(xv)} y2={H - padB} stroke="rgba(148,163,184,0.14)" />
              <line x1={padL} y1={toY(yv)} x2={W - padR} y2={toY(yv)} stroke="rgba(148,163,184,0.14)" />
              <text x={toX(xv) - 10} y={H - 22} fill="#94a3b8" fontSize="10.5" fontFamily="monospace">{xv.toFixed(2)}</text>
              <text x="8" y={toY(yv) + 4} fill="#94a3b8" fontSize="10.5" fontFamily="monospace">{yv.toFixed(2)}</text>
            </g>
          );
        })}

        {/* Trục tọa độ */}
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#38bdf8" strokeWidth="1.8" />
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#38bdf8" strokeWidth="1.8" />
        <text x={W - 140} y={H - 6} fill="#cbd5e1" fontSize="11.5" fontWeight="700">{xLabel}</text>
        <text x={padL + 8} y={padT + 10} fill="#cbd5e1" fontSize="11.5" fontWeight="700">{yLabel}</text>

        {/* Đường hồi quy OLS */}
        {reg && (
          <line
            x1={toX(0)}
            y1={toY(Math.max(0, reg.intercept))}
            x2={toX(maxX)}
            y2={toY(reg.slope * maxX + reg.intercept)}
            stroke="#34d399"
            strokeWidth="2.6"
          />
        )}

        {/* Các điểm đo thực nghiệm */}
        {pts.map((p) => (
          <g key={p.id}>
            <circle cx={toX(p.x)} cy={toY(p.y)} r="5.5" fill="#fbbf24" stroke="#09122b" strokeWidth="1.5" />
          </g>
        ))}

        {reg && (
          <text x={W - 245} y={36} fill="#34d399" fontSize="12" fontWeight="800" fontFamily="monospace">
            y = {reg.slope.toFixed(3)}x {reg.intercept >= 0 ? '+' : '−'} {Math.abs(reg.intercept).toFixed(3)} · R² = {reg.r2.toFixed(4)}
          </text>
        )}
      </svg>
    );
  };

  return (
    <div className="pl-sim-layout">
      <div className="pl-stage-card">
        <div className="pl-stage-head">
          <div>
            <h3>Phòng Thí Nghiệm Lớp 8–12 &amp; Phân tích Số liệu Olympiad</h3>
            <p>Đo đạc thực nghiệm có sai số ngẫu nhiên, vẽ đồ thị hồi quy tuyến tính OLS (R²) và đánh giá sai số đo.</p>
          </div>
          <div className="pl-seg-switch">
            <button type="button" className={exp === 'pendulum_g' ? 'is-on' : ''} onClick={() => setExp('pendulum_g')}>
              Đo g (Con lắc)
            </button>
            <button type="button" className={exp === 'ohm_ui' ? 'is-on' : ''} onClick={() => setExp('ohm_ui')}>
              Định luật Ôm U–I
            </button>
            <button type="button" className={exp === 'archimedes' ? 'is-on' : ''} onClick={() => setExp('archimedes')}>
              Archimedes 8–10
            </button>
          </div>
        </div>

        {exp === 'pendulum_g' && (
          <>
            {renderRegressionSvg(gSamples, gReg, 'Chiều dài dây l (m)', 'Bình phương chu kì T² (s²)')}
            <div className="pl-metrics-grid">
              <div className="pl-metric is-accent">
                <span>Gia tốc g đo được</span>
                <b>{measuredG ? `${measuredG.toFixed(3)} m/s²` : 'Cần ≥ 2 điểm'}</b>
              </div>
              <div className="pl-metric">
                <span>Sai số so với 9,81 m/s²</span>
                <b>{gErrorPct !== null ? `${gErrorPct.toFixed(2)}%` : '—'}</b>
              </div>
              <div className="pl-metric">
                <span>Hệ số góc a = 4π²/g</span>
                <b>{gReg ? gReg.slope.toFixed(3) : '—'} <small>s²/m</small></b>
              </div>
              <div className="pl-metric">
                <span>Độ khớp tuyến tính R²</span>
                <b>{gReg ? gReg.r2.toFixed(4) : '—'}</b>
              </div>
            </div>

            <div className="pl-data-table-wrap">
              <table className="pl-data-table">
                <thead>
                  <tr><th>Lần đo</th><th>Chiều dài l (m)</th><th>Chu kì đo T (s)</th><th>T² (s²)</th></tr>
                </thead>
                <tbody>
                  {gSamples.map((s, idx) => (
                    <tr key={s.id}>
                      <td>#{idx + 1}</td>
                      <td>{s.x.toFixed(2)}</td>
                      <td>{s.T.toFixed(3)}</td>
                      <td><b>{s.y.toFixed(3)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {exp === 'ohm_ui' && (
          <>
            {renderRegressionSvg(ohmSamples, ohmReg, 'Cường độ dòng I (A)', 'Hiệu điện thế U (V)')}
            <div className="pl-metrics-grid">
              <div className="pl-metric is-accent">
                <span>Điện trở R đo được</span>
                <b>{measuredR ? `${measuredR.toFixed(2)} Ω` : 'Cần ≥ 2 điểm'}</b>
              </div>
              <div className="pl-metric">
                <span>Sai số so với chuẩn (15 Ω)</span>
                <b>{rErrorPct !== null ? `${rErrorPct.toFixed(2)}%` : '—'}</b>
              </div>
              <div className="pl-metric">
                <span>Độ khớp tuyến tính R²</span>
                <b>{ohmReg ? ohmReg.r2.toFixed(4) : '—'}</b>
              </div>
              <div className="pl-metric">
                <span>Số điểm đo đã ghi</span>
                <b>{ohmSamples.length} <small>mẫu</small></b>
              </div>
            </div>
          </>
        )}

        {exp === 'archimedes' && (
          <>
            <svg viewBox="0 0 700 300" className="pl-svg-stage" role="img" aria-label="Thí nghiệm lực đẩy Archimedes">
              <rect width="700" height="300" rx="14" fill="#09122b" />
              {/* Bể chất lỏng */}
              <rect x="190" y="75" width="320" height="195" rx="12" fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth="2.5" />
              <rect x="192" y="130" width="316" height="138" rx="8" fill={fluid.color} />
              <line x1="192" y1="130" x2="508" y2="130" stroke="#38bdf8" strokeWidth="2" />

              {/* Khối vật đặt trong chất lỏng */}
              {(() => {
                const boxH = 62;
                const boxW = 76;
                const boxX = 350 - boxW / 2;
                const waterY = 130;
                const boxY = arch.floats
                  ? waterY - boxH * (1 - arch.submergedFraction)
                  : 266 - boxH;
                return (
                  <g>
                    {/* Lực kế treo vật nếu chìm */}
                    <line x1="350" y1="18" x2="350" y2={boxY} stroke="#cbd5e1" strokeWidth="2" strokeDasharray={arch.floats ? '4 4' : undefined} />
                    <rect x="305" y="14" width="90" height="32" rx="8" fill="#13224e" stroke="#38bdf8" strokeWidth="1.6" />
                    <text x="350" y="34" textAnchor="middle" fill="#fff" fontSize="11.5" fontWeight="800">
                      Lực kế: {arch.apparentWeightN.toFixed(2)} N
                    </text>

                    <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="8" fill={mat.color} stroke="#ffffff" strokeWidth="2" />
                    <text x="350" y={boxY + 35} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800">{mat.name}</text>

                    {/* Mũi tên Trọng lực P xuống & Lực đẩy F_A lên */}
                    <line x1="335" y1={boxY + boxH / 2} x2="335" y2={boxY + boxH / 2 + 42} stroke="#f43f5e" strokeWidth="3" />
                    <text x="275" y={boxY + boxH / 2 + 38} fill="#fb7185" fontSize="11.5" fontWeight="800">P = {arch.weightN.toFixed(2)}N</text>

                    <line x1="365" y1={boxY + boxH / 2} x2="365" y2={boxY + boxH / 2 - 42} stroke="#34d399" strokeWidth="3" />
                    <text x="376" y={boxY + boxH / 2 - 30} fill="#34d399" fontSize="11.5" fontWeight="800">F_A = {arch.buoyantForceN.toFixed(2)}N</text>
                  </g>
                );
              })()}
              <text x="206" y="256" fill="#e2e8f0" fontSize="12" fontWeight="700">
                {fluid.name} (ρ = {fluid.rho} kg/m³)
              </text>
            </svg>

            <div className="pl-metrics-grid">
              <div className="pl-metric is-accent">
                <span>Lực đẩy Archimedes F_A</span>
                <b>{arch.buoyantForceN.toFixed(3)} <small>N</small></b>
              </div>
              <div className="pl-metric">
                <span>Trọng lượng thật P</span>
                <b>{arch.weightN.toFixed(3)} <small>N</small></b>
              </div>
              <div className="pl-metric">
                <span>Số chỉ lực kế (P′)</span>
                <b>{arch.apparentWeightN.toFixed(3)} <small>N</small></b>
              </div>
              <div className="pl-metric">
                <span>Trạng thái cân bằng</span>
                <b className="pl-text-val">{arch.stateLabel}</b>
              </div>
            </div>
          </>
        )}
      </div>

      <aside className="pl-ctrl-card">
        {exp === 'pendulum_g' && (
          <>
            <h4>Thực hành đo g (Con lắc đơn)</h4>
            <label className="pl-slider">
              <div><span>Chiều dài dây treo l</span><b>{lenM.toFixed(2)} m</b></div>
              <input type="range" min="0.2" max="1.6" step="0.05" value={lenM} onChange={(e) => setLenM(Number(e.target.value))} />
            </label>
            <div className="pl-chip-row">
              <button type="button" className="pl-btn pl-btn-primary" onClick={measurePendulum}>
                + Đo &amp; Ghi số liệu
              </button>
              <button type="button" className="pl-btn" onClick={() => setGSamples([])}>
                Xóa bảng
              </button>
            </div>
            <div className="pl-formula-note">
              <code>T = 2π√(l/g) ⇒ T² = (4π²/g)·l · Hệ số góc a = 4π²/g</code>
            </div>
          </>
        )}

        {exp === 'ohm_ui' && (
          <>
            <h4>Thực hành khảo sát U–I</h4>
            <label className="pl-slider">
              <div><span>Hiệu điện thế nguồn U</span><b>{uVal.toFixed(1)} V</b></div>
              <input type="range" min="1.5" max="18" step="0.5" value={uVal} onChange={(e) => setUVal(Number(e.target.value))} />
            </label>
            <div className="pl-chip-row">
              <button type="button" className="pl-btn pl-btn-primary" onClick={measureOhm}>
                + Ghi điểm đo (I, U)
              </button>
              <button type="button" className="pl-btn" onClick={() => setOhmSamples([])}>
                Xóa bảng
              </button>
            </div>
            <div className="pl-formula-note">
              <code>U = R · I · Hệ số góc đường thẳng U(I) chính là điện trở R</code>
            </div>
          </>
        )}

        {exp === 'archimedes' && (
          <>
            <h4>Vật liệu &amp; Chất lỏng</h4>
            <div className="pl-field-group">
              <span>Chọn vật liệu khối (ρ_vật)</span>
              <div className="pl-chip-row">
                {MATERIALS.map((m) => (
                  <button key={m.id} type="button" className={`pl-chip${matId === m.id ? ' is-on' : ''}`} onClick={() => setMatId(m.id)}>
                    {m.name} ({m.rho})
                  </button>
                ))}
              </div>
            </div>
            <div className="pl-field-group">
              <span>Chọn chất lỏng (ρ_lỏng)</span>
              <div className="pl-chip-row">
                {FLUIDS.map((f) => (
                  <button key={f.id} type="button" className={`pl-chip${fluidId === f.id ? ' is-on' : ''}`} onClick={() => setFluidId(f.id)}>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
            <label className="pl-slider">
              <div><span>Thể tích khối vật V</span><b>{volCm3} cm³</b></div>
              <input type="range" min="50" max="800" step="25" value={volCm3} onChange={(e) => setVolCm3(Number(e.target.value))} />
            </label>
            <div className="pl-formula-note">
              <code>F_A = ρ_lỏng · g · V_chìm · Nổi khi ρ_vật &lt; ρ_lỏng</code>
            </div>
          </>
        )}

        <button
          type="button"
          className="pl-btn pl-btn-ai"
          onClick={() =>
            onAskAI(
              exp === 'pendulum_g'
                ? `Hướng dẫn xử lý số liệu thí nghiệm đo gia tốc trọng trường g bằng con lắc đơn (tuyến tính hóa đồ thị T² theo l). Kết quả hồi quy hiện tại cho hệ số góc a = ${gReg?.slope.toFixed(3) || '—'} s²/m, g_đo = ${measuredG?.toFixed(3) || '—'} m/s² (R² = ${gReg?.r2.toFixed(4) || '—'}). Nêu nguyên nhân gây sai số hệ thống và sai số ngẫu nhiên.`
                : exp === 'ohm_ui'
                  ? `Giải thích cách dùng phương pháp bình phương tối thiểu (OLS) trên đồ thị U theo I để xác định điện trở R_đo = ${measuredR?.toFixed(2) || '—'} Ω và ý nghĩa của hệ số tương quan R² = ${ohmReg?.r2.toFixed(4) || '—'}.`
                  : `Giải thích bài toán lực đẩy Archimedes khi thả khối ${mat.name} (ρ = ${mat.rho} kg/m³, V = ${volCm3} cm³) vào ${fluid.name} (ρ = ${fluid.rho} kg/m³): tính P = ${arch.weightN.toFixed(2)} N, F_A = ${arch.buoyantForceN.toFixed(2)} N và phần trăm thể tích chìm.`
            )
          }
        >
          Hỏi ELEC AI phân tích báo cáo thí nghiệm
        </button>
      </aside>
    </div>
  );
}
