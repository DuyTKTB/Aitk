import { useEffect, useMemo, useState } from 'react';
import { solveDcCircuit } from '../physicsEngine.js';

const TOPOLOGIES = [
  { id: 'series', label: 'Mạch nối tiếp (R₁ nt R₂ nt R₃)' },
  { id: 'parallel', label: 'Mạch song song (R₁ // R₂ // R₃)' },
  { id: 'mixed', label: 'Hỗn hợp R₁ nt (R₂ // R₃)' },
];

export default function CircuitSim({ onAskAI }) {
  const [topology, setTopology] = useState('mixed');
  const [E, setE] = useState(12);
  const [r, setR] = useState(1);
  const [R1, setR1] = useState(4);
  const [R2, setR2] = useState(6);
  const [R3, setR3] = useState(12);
  const [closed, setClosed] = useState(true);
  const [phase, setPhase] = useState(0);

  const res = useMemo(
    () => solveDcCircuit({ topology, E, r, R1, R2, R3, closed }),
    [topology, E, r, R1, R2, R3, closed]
  );

  // Hoạt ảnh chuyển động dòng điện tỉ lệ cường độ I
  useEffect(() => {
    if (!closed || res.Itotal <= 0.001) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setPhase((p) => (p + dt * Math.min(8, 1.4 + res.Itotal * 2.2)) % 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [closed, res.Itotal]);

  const b1 = res.branches[0];
  const b2 = res.branches[1];
  const b3 = res.branches[2];
  const dashOffset = -(phase * 6);

  const glowAlpha = (power) => Math.min(0.95, 0.08 + power / 18);

  return (
    <div className="pl-sim-layout">
      <div className="pl-stage-card">
        <div className="pl-stage-head">
          <div>
            <h3>Lắp ráp &amp; Tính toán Mạch điện DC (OpenCircuit)</h3>
            <p>Khảo sát Định luật Ôm toàn mạch, phân nhánh Kirchhoff, hiệu suất nguồn và độ sáng tải theo công suất P.</p>
          </div>
          <div className="pl-stage-actions">
            <button
              type="button"
              className={`pl-btn ${closed ? 'pl-btn-emerald' : 'pl-btn-danger'}`}
              onClick={() => setClosed((c) => !c)}
            >
              Khóa K: {closed ? 'ĐANG ĐÓNG' : 'ĐANG MỞ'}
            </button>
          </div>
        </div>

        {/* Sơ đồ mạch SVG trực quan có dòng điện chuyển động + đồng hồ đo */}
        <svg viewBox="0 0 740 340" className="pl-svg-stage" role="img" aria-label="Sơ đồ mạch điện tương tác">
          <defs>
            <linearGradient id="pl-circ-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#09122b" />
              <stop offset="100%" stopColor="#101d42" />
            </linearGradient>
          </defs>
          <rect width="740" height="340" rx="14" fill="url(#pl-circ-bg)" />

          {/* Nguồn điện bên trái (E, r) */}
          <g transform="translate(88, 170)">
            <rect x="-36" y="-58" width="72" height="116" rx="12" fill="rgba(47,107,255,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="-18" y1="-16" x2="18" y2="-16" stroke="#fbbf24" strokeWidth="4" />
            <line x1="-10" y1="10" x2="10" y2="10" stroke="#94a3b8" strokeWidth="3" />
            <text x="0" y="-34" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">+ E = {E}V</text>
            <text x="0" y="34" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="700">r = {r} Ω</text>
            <text x="0" y="50" textAnchor="middle" fill="#94a3b8" fontSize="10">− Cực âm</text>
          </g>

          {/* Dây dẫn chính trên và dưới */}
          <path
            d="M 88 112 L 88 52 L 660 52 L 660 288 L 88 288 L 88 228"
            fill="none"
            stroke="#334155"
            strokeWidth="4"
          />
          {closed && (
            <path
              d="M 88 112 L 88 52 L 660 52 L 660 288 L 88 288 L 88 228"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              strokeDasharray="8 12"
              strokeDashoffset={dashOffset}
            />
          )}

          {/* Khóa K phía dưới */}
          <g transform="translate(215, 288)" style={{ cursor: 'pointer' }} onClick={() => setClosed((c) => !c)}>
            <rect x="-32" y="-18" width="64" height="36" rx="8" fill="#0f172a" stroke="#475569" />
            <circle cx="-18" cy="0" r="4" fill="#fbbf24" />
            <circle cx="18" cy="0" r="4" fill="#fbbf24" />
            <line
              x1="-18"
              y1="0"
              x2={closed ? '18' : '12'}
              y2={closed ? '0' : '-16'}
              stroke={closed ? '#34d399' : '#f87171'}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <text x="0" y="28" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700">Khóa K (bấm đóng/mở)</text>
          </g>

          {/* Ampe kế tổng (A) */}
          <g transform="translate(470, 288)">
            <circle cx="0" cy="0" r="22" fill="#0c1b44" stroke="#34d399" strokeWidth="2.5" />
            <text x="0" y="-2" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="900">A</text>
            <text x="0" y="12" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="700">{res.Itotal.toFixed(2)}A</text>
          </g>

          {/* Vôn kế mạch ngoài (V) */}
          <g transform="translate(185, 170)">
            <line x1="0" y1="-118" x2="0" y2="-24" stroke="rgba(167,139,250,0.55)" strokeDasharray="4 4" />
            <line x1="0" y1="24" x2="0" y2="118" stroke="rgba(167,139,250,0.55)" strokeDasharray="4 4" />
            <circle cx="0" cy="0" r="24" fill="#17123d" stroke="#a78bfa" strokeWidth="2.5" />
            <text x="0" y="-3" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="900">V</text>
            <text x="0" y="12" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="700">{res.Uext.toFixed(1)}V</text>
          </g>

          {/* KHỐI ĐIỆN TRỞ THEO CẤU TRÚC ĐÃ CHỌN */}
          {topology === 'series' && (
            <g>
              {[
                { x: 300, b: b1, color: '#38bdf8' },
                { x: 440, b: b2, color: '#fbbf24' },
                { x: 580, b: b3, color: '#f472b6' },
              ].map(({ x, b, color }) => (
                <g key={b.id} transform={`translate(${x}, 52)`}>
                  <circle cx="0" cy="0" r="30" fill={color} opacity={closed ? glowAlpha(b.P) * 0.28 : 0} />
                  <rect x="-42" y="-17" width="84" height="34" rx="8" fill="#13224e" stroke={color} strokeWidth="2.2" />
                  <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">{b.id} = {b.R}Ω</text>
                  <text x="0" y="34" textAnchor="middle" fill={color} fontSize="11" fontWeight="700">
                    U={b.U.toFixed(1)}V · P={b.P.toFixed(1)}W
                  </text>
                </g>
              ))}
            </g>
          )}

          {topology === 'parallel' && (
            <g>
              {[
                { y: 105, b: b1, color: '#38bdf8' },
                { y: 170, b: b2, color: '#fbbf24' },
                { y: 235, b: b3, color: '#f472b6' },
              ].map(({ y, b, color }) => (
                <g key={b.id}>
                  <line x1="290" y1="52" x2="290" y2="235" stroke="#334155" strokeWidth="3.5" />
                  <line x1="590" y1="52" x2="590" y2="235" stroke="#334155" strokeWidth="3.5" />
                  <line x1="290" y1={y} x2="590" y2={y} stroke="#334155" strokeWidth="3.5" />
                  {closed && (
                    <line
                      x1="290"
                      y1={y}
                      x2="590"
                      y2={y}
                      stroke={color}
                      strokeWidth="2.6"
                      strokeDasharray="6 10"
                      strokeDashoffset={-(phase * (2 + b.I * 3))}
                    />
                  )}
                  <g transform={`translate(440, ${y})`}>
                    <rect x="-56" y="-16" width="112" height="32" rx="8" fill="#13224e" stroke={color} strokeWidth="2.2" />
                    <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="11.5" fontWeight="800">
                      {b.id}={b.R}Ω · I={b.I.toFixed(2)}A
                    </text>
                  </g>
                </g>
              ))}
            </g>
          )}

          {topology === 'mixed' && (
            <g>
              {/* R1 nối tiếp trên nhánh chính */}
              <g transform="translate(310, 52)">
                <circle cx="0" cy="0" r="28" fill="#38bdf8" opacity={closed ? glowAlpha(b1.P) * 0.3 : 0} />
                <rect x="-46" y="-17" width="92" height="34" rx="8" fill="#13224e" stroke="#38bdf8" strokeWidth="2.2" />
                <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">R₁ = {b1.R}Ω</text>
                <text x="0" y="34" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
                  U₁={b1.U.toFixed(1)}V · I₁={b1.I.toFixed(2)}A
                </text>
              </g>

              {/* Cụm R2 // R3 bên phải */}
              <line x1="435" y1="52" x2="435" y2="210" stroke="#334155" strokeWidth="3.5" />
              <line x1="660" y1="52" x2="660" y2="210" stroke="#334155" strokeWidth="3.5" />
              {[
                { y: 126, b: b2, color: '#fbbf24' },
                { y: 204, b: b3, color: '#f472b6' },
              ].map(({ y, b, color }) => (
                <g key={b.id}>
                  <line x1="435" y1={y} x2="660" y2={y} stroke="#334155" strokeWidth="3.5" />
                  {closed && (
                    <line
                      x1="435"
                      y1={y}
                      x2="660"
                      y2={y}
                      stroke={color}
                      strokeWidth="2.6"
                      strokeDasharray="6 10"
                      strokeDashoffset={-(phase * (2 + b.I * 3.5))}
                    />
                  )}
                  <g transform={`translate(548, ${y})`}>
                    <circle cx="0" cy="0" r="26" fill={color} opacity={closed ? glowAlpha(b.P) * 0.25 : 0} />
                    <rect x="-54" y="-16" width="108" height="32" rx="8" fill="#13224e" stroke={color} strokeWidth="2.2" />
                    <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="11.5" fontWeight="800">
                      {b.id}={b.R}Ω · I={b.I.toFixed(2)}A
                    </text>
                  </g>
                </g>
              ))}
            </g>
          )}
        </svg>

        <div className="pl-metrics-grid">
          <div className="pl-metric is-accent">
            <span>Điện trở tương đương R_N</span>
            <b>{res.Req.toFixed(2)} <small>Ω</small></b>
          </div>
          <div className="pl-metric">
            <span>Dòng mạch chính I</span>
            <b>{res.Itotal.toFixed(3)} <small>A</small></b>
          </div>
          <div className="pl-metric">
            <span>Hiệu điện thế mạch ngoài U_N</span>
            <b>{res.Uext.toFixed(2)} <small>V</small></b>
          </div>
          <div className="pl-metric">
            <span>Công suất ngoài &amp; Hiệu suất</span>
            <b>{res.Pext.toFixed(2)}W <small>({res.efficiency.toFixed(1)}%)</small></b>
          </div>
        </div>
      </div>

      <aside className="pl-ctrl-card">
        <h4>Sơ đồ &amp; Linh kiện</h4>
        <div className="pl-chip-col">
          {TOPOLOGIES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`pl-chip${topology === t.id ? ' is-on' : ''}`}
              onClick={() => setTopology(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="pl-slider">
          <div><span>Suất điện động nguồn E</span><b>{E} V</b></div>
          <input type="range" min="3" max="36" step="1" value={E} onChange={(e) => setE(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Điện trở trong nguồn r</span><b>{r.toFixed(1)} Ω</b></div>
          <input type="range" min="0" max="6" step="0.5" value={r} onChange={(e) => setR(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Điện trở R₁</span><b>{R1} Ω</b></div>
          <input type="range" min="1" max="30" step="1" value={R1} onChange={(e) => setR1(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Điện trở R₂</span><b>{R2} Ω</b></div>
          <input type="range" min="1" max="30" step="1" value={R2} onChange={(e) => setR2(Number(e.target.value))} />
        </label>
        <label className="pl-slider">
          <div><span>Điện trở R₃</span><b>{R3} Ω</b></div>
          <input type="range" min="1" max="30" step="1" value={R3} onChange={(e) => setR3(Number(e.target.value))} />
        </label>

        <div className="pl-formula-note">
          <code>I = E / (R_N + r) · U_N = E − I·r · H = R_N/(R_N + r)</code>
        </div>

        <button
          type="button"
          className="pl-btn pl-btn-ai"
          onClick={() =>
            onAskAI(
              `Giải chi tiết mạch điện DC kiểu "${TOPOLOGIES.find((t) => t.id === topology)?.label}" gồm E = ${E}V, r = ${r}Ω, R₁ = ${R1}Ω, R₂ = ${R2}Ω, R₃ = ${R3}Ω. Xác nhận R_N = ${res.Req.toFixed(2)}Ω, I = ${res.Itotal.toFixed(3)}A, U_N = ${res.Uext.toFixed(2)}V và hiệu suất nguồn H = ${res.efficiency.toFixed(1)}%.`
            )
          }
        >
          Hỏi ELEC AI giải chi tiết mạch này
        </button>
      </aside>
    </div>
  );
}
