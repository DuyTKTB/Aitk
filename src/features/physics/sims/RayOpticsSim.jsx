import { useMemo, useState } from 'react';
import { OPTICAL_MEDIA, solveSnell, solveThinLens } from '../physicsEngine.js';

export default function RayOpticsSim({ onAskAI }) {
  const [mode, setMode] = useState('lens'); // 'lens' | 'snell'

  // State Thấu kính
  const [lensType, setLensType] = useState('convex'); // 'convex' | 'concave'
  const [fMag, setFMag] = useState(14);
  const [dObj, setDObj] = useState(26);
  const [hObj, setHObj] = useState(4.5);

  // State Khúc xạ Snell
  const [n1, setN1] = useState(1.5);
  const [n2, setN2] = useState(1.0);
  const [iDeg, setIDeg] = useState(35);

  const fSigned = lensType === 'convex' ? fMag : -fMag;
  const lensRes = useMemo(() => solveThinLens({ f: fSigned, d: dObj, h: hObj }), [fSigned, dObj, hObj]);
  const snellRes = useMemo(() => solveSnell({ n1, n2, iDeg }), [n1, n2, iDeg]);

  // Tọa độ vẽ Thấu kính trên SVG 740x360
  const cx = 370;
  const cy = 185;
  const pxPerCm = 6.2;

  const objX = cx - dObj * pxPerCm;
  const objTopY = cy - hObj * pxPerCm * 2.1;
  const f1X = cx - fSigned * pxPerCm;
  const f2X = cx + fSigned * pxPerCm;

  const imgX = !lensRes.isAtFocus ? cx + lensRes.dPrime * pxPerCm : null;
  const imgTopY = !lensRes.isAtFocus ? cy - lensRes.hPrime * pxPerCm * 2.1 : null;

  // Tọa độ vẽ Snell trên SVG 740x360
  const sCx = 370;
  const sCy = 180;
  const rayLen = 155;
  const iRad = (iDeg * Math.PI) / 180;
  const incX = sCx - Math.sin(iRad) * rayLen;
  const incY = sCy - Math.cos(iRad) * rayLen;
  const reflX = sCx + Math.sin(iRad) * rayLen;
  const reflY = sCy - Math.cos(iRad) * rayLen;
  const refrRad = snellRes.rDeg !== null ? (snellRes.rDeg * Math.PI) / 180 : null;
  const refrX = refrRad !== null ? sCx + Math.sin(refrRad) * rayLen : sCx;
  const refrY = refrRad !== null ? sCy + Math.cos(refrRad) * rayLen : sCy;

  return (
    <div className="pl-sim-layout">
      <div className="pl-stage-card">
        <div className="pl-stage-head">
          <div>
            <h3>Quang hình học: Thấu kính, Phản xạ &amp; Khúc xạ (Ray Optics)</h3>
            <p>
              {mode === 'lens'
                ? 'Vẽ chuẩn 3 tia sáng đặc biệt qua thấu kính hội tụ/phân kì, tự động phân biệt ảnh thật & ảnh ảo.'
                : 'Khảo sát Định luật khúc xạ Snell n₁·sin(i) = n₂·sin(r) và hiện tượng Phản xạ toàn phần.'}
            </p>
          </div>
          <div className="pl-seg-switch">
            <button type="button" className={mode === 'lens' ? 'is-on' : ''} onClick={() => setMode('lens')}>
              Thấu kính mỏng
            </button>
            <button type="button" className={mode === 'snell' ? 'is-on' : ''} onClick={() => setMode('snell')}>
              Khúc xạ &amp; PXTP
            </button>
          </div>
        </div>

        {mode === 'lens' ? (
          <>
            <svg viewBox="0 0 740 360" className="pl-svg-stage" role="img" aria-label="Sơ đồ tia sáng qua thấu kính">
              <defs>
                <linearGradient id="pl-opt-bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#09122b" />
                  <stop offset="100%" stopColor="#121e46" />
                </linearGradient>
              </defs>
              <rect width="740" height="360" rx="14" fill="url(#pl-opt-bg)" />

              {/* Trục chính */}
              <line x1="20" y1={cy} x2="720" y2={cy} stroke="rgba(148,163,184,0.38)" strokeWidth="1.5" strokeDasharray="6 4" />
              <text x="692" y={cy - 8} fill="#94a3b8" fontSize="11" fontWeight="700">Δ</text>

              {/* Thấu kính */}
              {lensType === 'convex' ? (
                <path
                  d={`M ${cx} ${cy - 125} Q ${cx + 22} ${cy} ${cx} ${cy + 125} Q ${cx - 22} ${cy} ${cx} ${cy - 125} Z`}
                  fill="rgba(56, 189, 248, 0.22)"
                  stroke="#38bdf8"
                  strokeWidth="2.4"
                />
              ) : (
                <path
                  d={`M ${cx - 14} ${cy - 125} Q ${cx - 2} ${cy} ${cx - 14} ${cy + 125} L ${cx + 14} ${cy + 125} Q ${cx + 2} ${cy} ${cx + 14} ${cy - 125} Z`}
                  fill="rgba(167, 139, 250, 0.22)"
                  stroke="#a78bfa"
                  strokeWidth="2.4"
                />
              )}
              <circle cx={cx} cy={cy} r="3.5" fill="#ffffff" />
              <text x={cx + 8} y={cy + 16} fill="#cbd5e1" fontSize="11" fontWeight="700">O</text>

              {/* Tiêu điểm F và F' */}
              <circle cx={f1X} cy={cy} r="4" fill="#fbbf24" />
              <text x={f1X - 4} y={cy + 18} fill="#fbbf24" fontSize="11.5" fontWeight="800">F</text>
              <circle cx={f2X} cy={cy} r="4" fill="#fbbf24" />
              <text x={f2X - 5} y={cy + 18} fill="#fbbf24" fontSize="11.5" fontWeight="800">F′</text>

              {/* Tia 1: Song song trục chính → đi qua F' (hoặc đường kéo dài qua F') */}
              <line x1={objX} y1={objTopY} x2={cx} y2={objTopY} stroke="#38bdf8" strokeWidth="2.2" />
              {(() => {
                const dx = f2X - cx;
                const dy = cy - objTopY;
                const len = Math.hypot(dx, dy) || 1;
                const ux = (dx / len) * (lensType === 'convex' ? 1 : -1);
                const uy = (dy / len) * (lensType === 'convex' ? 1 : -1);
                return (
                  <>
                    <line x1={cx} y1={objTopY} x2={cx + ux * 380} y2={objTopY + uy * 380} stroke="#38bdf8" strokeWidth="2.2" />
                    {(lensRes.isVirtual || lensType === 'concave') && (
                      <line x1={cx} y1={objTopY} x2={cx - ux * 360} y2={objTopY - uy * 360} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.7" />
                    )}
                  </>
                );
              })()}

              {/* Tia 2: Đi qua quang tâm O truyền thẳng */}
              {(() => {
                const dx = cx - objX;
                const dy = cy - objTopY;
                const len = Math.hypot(dx, dy) || 1;
                const ux = dx / len;
                const uy = dy / len;
                return (
                  <>
                    <line x1={objX} y1={objTopY} x2={cx + ux * 380} y2={cy + uy * 380} stroke="#34d399" strokeWidth="2.2" />
                    {lensRes.isVirtual && (
                      <line x1={objX} y1={objTopY} x2={objX - ux * 340} y2={objTopY - uy * 340} stroke="#34d399" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.7" />
                    )}
                  </>
                );
              })()}

              {/* Vật sáng AB */}
              <line x1={objX} y1={cy} x2={objX} y2={objTopY} stroke="#f472b6" strokeWidth="4" strokeLinecap="round" />
              <polygon points={`${objX},${objTopY - 6} ${objX - 6},${objTopY + 6} ${objX + 6},${objTopY + 6}`} fill="#f472b6" />
              <text x={objX - 10} y={objTopY - 12} fill="#f472b6" fontSize="12" fontWeight="800">B</text>
              <text x={objX - 8} y={cy + 16} fill="#f472b6" fontSize="12" fontWeight="800">A</text>

              {/* Ảnh A'B' */}
              {imgX !== null && imgX > 15 && imgX < 725 && (
                <g>
                  <line
                    x1={imgX}
                    y1={cy}
                    x2={imgX}
                    y2={Math.max(18, Math.min(342, imgTopY))}
                    stroke="#fbbf24"
                    strokeWidth="4"
                    strokeDasharray={lensRes.isVirtual ? '6 4' : undefined}
                    strokeLinecap="round"
                  />
                  <circle cx={imgX} cy={Math.max(18, Math.min(342, imgTopY))} r="5" fill="#fbbf24" />
                  <text x={imgX + 8} y={Math.max(22, Math.min(338, imgTopY))} fill="#fbbf24" fontSize="12" fontWeight="800">
                    B′ ({lensRes.isVirtual ? 'Ảnh ảo' : 'Ảnh thật'})
                  </text>
                </g>
              )}
            </svg>

            <div className="pl-metrics-grid">
              <div className="pl-metric is-accent">
                <span>Vị trí ảnh d′</span>
                <b>{lensRes.isAtFocus ? '∞' : `${lensRes.dPrime.toFixed(2)} cm`}</b>
              </div>
              <div className="pl-metric">
                <span>Độ phóng đại k</span>
                <b>{lensRes.isAtFocus ? '∞' : lensRes.k.toFixed(2)}</b>
              </div>
              <div className="pl-metric pl-span-2">
                <span>Tính chất ảnh</span>
                <b className="pl-text-val">{lensRes.nature}</b>
              </div>
            </div>
          </>
        ) : (
          <>
            <svg viewBox="0 0 740 360" className="pl-svg-stage" role="img" aria-label="Sơ đồ khúc xạ ánh sáng Snell">
              <rect width="740" height="180" fill="#09122b" />
              <rect y="180" width="740" height="180" fill="rgba(14, 165, 233, 0.22)" />
              <rect y="180" width="740" height="180" fill="#0b1c3f" opacity="0.72" />

              {/* Mặt phân cách & Pháp tuyến */}
              <line x1="20" y1={sCy} x2="720" y2={sCy} stroke="#38bdf8" strokeWidth="2.2" />
              <line x1={sCx} y1="18" x2={sCx} y2="342" stroke="rgba(226,232,240,0.45)" strokeWidth="1.5" strokeDasharray="6 4" />
              <text x={sCx + 8} y="30" fill="#cbd5e1" fontSize="11.5" fontWeight="700">Pháp tuyến N</text>

              <text x="24" y="34" fill="#93c5fd" fontSize="12.5" fontWeight="800">Môi trường 1: n₁ = {n1.toFixed(3)}</text>
              <text x="24" y="342" fill="#67e8f9" fontSize="12.5" fontWeight="800">Môi trường 2: n₂ = {n2.toFixed(3)}</text>

              {/* Tia tới */}
              <line x1={incX} y1={incY} x2={sCx} y2={sCy} stroke="#fbbf24" strokeWidth="3.2" />
              <text x={incX - 18} y={incY - 8} fill="#fbbf24" fontSize="12" fontWeight="800">Tia tới (i = {iDeg}°)</text>

              {/* Tia phản xạ */}
              <line
                x1={sCx}
                y1={sCy}
                x2={reflX}
                y2={reflY}
                stroke={snellRes.isTIR ? '#f43f5e' : 'rgba(251, 191, 36, 0.45)'}
                strokeWidth={snellRes.isTIR ? 3.5 : 2}
                strokeDasharray={snellRes.isTIR ? undefined : '5 4'}
              />
              <text x={reflX - 45} y={reflY - 8} fill={snellRes.isTIR ? '#fb7185' : '#fde68a'} fontSize="12" fontWeight="800">
                {snellRes.isTIR ? 'PHẢN XẠ TOÀN PHẦN!' : `Phản xạ (i′ = ${iDeg}°)`}
              </text>

              {/* Tia khúc xạ (nếu không PXTP) */}
              {!snellRes.isTIR && (
                <>
                  <line x1={sCx} y1={sCy} x2={refrX} y2={refrY} stroke="#34d399" strokeWidth="3.2" />
                  <text x={refrX + 8} y={refrY} fill="#34d399" fontSize="12" fontWeight="800">
                    Tia khúc xạ (r = {snellRes.rDeg.toFixed(1)}°)
                  </text>
                </>
              )}

              <circle cx={sCx} cy={sCy} r="4.5" fill="#ffffff" />
            </svg>

            <div className="pl-metrics-grid">
              <div className="pl-metric is-accent">
                <span>Góc khúc xạ r</span>
                <b>{snellRes.isTIR ? 'PXTP (100%)' : `${snellRes.rDeg.toFixed(2)}°`}</b>
              </div>
              <div className="pl-metric">
                <span>Góc giới hạn i_gh</span>
                <b>{snellRes.criticalDeg ? `${snellRes.criticalDeg.toFixed(2)}°` : 'Không có (n₁ ≤ n₂)'}</b>
              </div>
              <div className="pl-metric">
                <span>Góc lệch tia sáng D</span>
                <b>{snellRes.deviationDeg.toFixed(2)}°</b>
              </div>
              <div className="pl-metric">
                <span>Trạng thái truyền sáng</span>
                <b className="pl-text-val">{snellRes.isTIR ? 'Phản xạ toàn phần' : 'Khúc xạ qua mặt phân cách'}</b>
              </div>
            </div>
          </>
        )}
      </div>

      <aside className="pl-ctrl-card">
        {mode === 'lens' ? (
          <>
            <h4>Cấu hình Thấu kính</h4>
            <div className="pl-chip-row">
              <button type="button" className={`pl-chip${lensType === 'convex' ? ' is-on' : ''}`} onClick={() => setLensType('convex')}>
                Hội tụ (f &gt; 0)
              </button>
              <button type="button" className={`pl-chip${lensType === 'concave' ? ' is-on' : ''}`} onClick={() => setLensType('concave')}>
                Phân kì (f &lt; 0)
              </button>
            </div>
            <label className="pl-slider">
              <div><span>Độ lớn tiêu cự |f|</span><b>{fMag} cm</b></div>
              <input type="range" min="6" max="30" step="1" value={fMag} onChange={(e) => setFMag(Number(e.target.value))} />
            </label>
            <label className="pl-slider">
              <div><span>Khoảng cách vật d</span><b>{dObj} cm</b></div>
              <input type="range" min="4" max="50" step="0.5" value={dObj} onChange={(e) => setDObj(Number(e.target.value))} />
            </label>
            <label className="pl-slider">
              <div><span>Chiều cao vật h</span><b>{hObj.toFixed(1)} cm</b></div>
              <input type="range" min="1.5" max="8" step="0.5" value={hObj} onChange={(e) => setHObj(Number(e.target.value))} />
            </label>
            <div className="pl-formula-note">
              <code>1/f = 1/d + 1/d′ · k = −d′/d = h′/h</code>
            </div>
          </>
        ) : (
          <>
            <h4>Cấu hình Môi trường</h4>
            <label className="pl-slider">
              <div><span>Góc tới i</span><b>{iDeg}°</b></div>
              <input type="range" min="0" max="88" step="1" value={iDeg} onChange={(e) => setIDeg(Number(e.target.value))} />
            </label>
            <label className="pl-slider">
              <div><span>Chiết suất n₁ (tới)</span><b>{n1.toFixed(3)}</b></div>
              <input type="range" min="1.0" max="2.45" step="0.01" value={n1} onChange={(e) => setN1(Number(e.target.value))} />
            </label>
            <div className="pl-chip-row">
              {OPTICAL_MEDIA.map((m) => (
                <button key={`n1-${m.id}`} type="button" className={`pl-chip${Math.abs(n1 - m.n) < 0.02 ? ' is-on' : ''}`} onClick={() => setN1(m.n)}>
                  n₁: {m.name}
                </button>
              ))}
            </div>
            <label className="pl-slider">
              <div><span>Chiết suất n₂ (khúc xạ)</span><b>{n2.toFixed(3)}</b></div>
              <input type="range" min="1.0" max="2.45" step="0.01" value={n2} onChange={(e) => setN2(Number(e.target.value))} />
            </label>
            <div className="pl-chip-row">
              {OPTICAL_MEDIA.map((m) => (
                <button key={`n2-${m.id}`} type="button" className={`pl-chip${Math.abs(n2 - m.n) < 0.02 ? ' is-on' : ''}`} onClick={() => setN2(m.n)}>
                  n₂: {m.name}
                </button>
              ))}
            </div>
            <div className="pl-formula-note">
              <code>n₁·sin(i) = n₂·sin(r) · sin(i_gh) = n₂/n₁</code>
            </div>
          </>
        )}

        <button
          type="button"
          className="pl-btn pl-btn-ai"
          onClick={() =>
            onAskAI(
              mode === 'lens'
                ? `Giải thích cách dựng ảnh và tính toán cho ${lensType === 'convex' ? 'thấu kính hội tụ' : 'thấu kính phân kì'} có f = ${fSigned} cm, vật đặt cách thấu kính d = ${dObj} cm. Xác nhận d′ = ${lensRes.isAtFocus ? 'vô cực' : lensRes.dPrime.toFixed(2) + ' cm'}, k = ${lensRes.isAtFocus ? '∞' : lensRes.k.toFixed(2)} (${lensRes.nature}).`
                : `Giải thích hiện tượng khúc xạ ánh sáng khi tia sáng truyền từ môi trường n₁ = ${n1} sang n₂ = ${n2} với góc tới i = ${iDeg}°. Tính góc giới hạn phản xạ toàn phần i_gh và giải thích điều kiện xảy ra PXTP.`
            )
          }
        >
          Hỏi ELEC AI giải thích hiện tượng quang học
        </button>
      </aside>
    </div>
  );
}
