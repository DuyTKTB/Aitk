import React, { useMemo, useState } from 'react';
import { simulatePopulationCurve } from '../bioEngine.js';
import BioLiveChart from '../components/BioLiveChart.jsx';

export default function PopulationGrowthSim({ onAskAI }) {
  const [mode, setMode] = useState('logistic'); // 'exponential' | 'logistic' | 'lotka'
  const [n0, setN0] = useState(25);
  const [r, setR] = useState(0.28);
  const [K, setK] = useState(500);
  const [pred0, setPred0] = useState(12);
  const [beta, setBeta] = useState(0.015);
  const [compareFoodCut, setCompareFoodCut] = useState(true);

  const primarySeries = useMemo(
    () =>
      simulatePopulationCurve({
        mode,
        n0,
        r,
        K,
        pred0,
        beta,
        steps: 64,
        dt: 0.5,
      }),
    [mode, n0, r, K, pred0, beta]
  );

  // So sánh kịch bản nguồn thức ăn giảm 50% (K/2) cho mô hình Logistic
  const mergedData = useMemo(() => {
    if (mode !== 'logistic' || !compareFoodCut) return primarySeries;
    const halfKSeries = simulatePopulationCurve({
      mode: 'logistic',
      n0,
      r,
      K: Math.max(40, Math.round(K * 0.5)),
      steps: 64,
      dt: 0.5,
    });
    return primarySeries.map((pt, i) => ({
      ...pt,
      N_halfK: halfKSeries[i]?.N ?? 0,
    }));
  }, [mode, compareFoodCut, primarySeries, n0, r, K]);

  const chartSeries = useMemo(() => {
    if (mode === 'lotka') {
      return [
        { key: 'prey', label: 'Con mồi (Thỏ)', color: '#10b981' },
        { key: 'predator', label: 'Vật ăn thịt (Cáo)', color: '#ef4444' },
      ];
    }
    if (mode === 'logistic' && compareFoodCut) {
      return [
        { key: 'N', label: `Môi trường chuẩn (K = ${K})`, color: '#0284c7' },
        { key: 'N_halfK', label: `Giảm 50% thức ăn (K = ${Math.round(K * 0.5)})`, color: '#f59e0b' },
      ];
    }
    return [
      {
        key: 'N',
        label: mode === 'exponential' ? 'Tăng trưởng tiềm năng (Chữ J)' : `Tăng trưởng thực tế (Chữ S, K=${K})`,
        color: mode === 'exponential' ? '#8b5cf6' : '#0284c7',
      },
    ];
  }, [mode, compareFoodCut, K]);

  const finalPoint = primarySeries[primarySeries.length - 1] || {};
  const maxGrowthRate = Math.round((r * K) / 4); // dN/dt max đạt tại N = K/2

  return (
    <div className="bl-grid-2">
      <div className="bl-stage">
        <BioLiveChart
          data={mergedData}
          xKey="t"
          xLabel="Thời gian (thế hệ)"
          yLabel="Số lượng cá thể (N)"
          series={chartSeries}
          height={280}
        />

        <div className="bl-kpis" style={{ marginTop: 12 }}>
          {mode === 'lotka' ? (
            <>
              <div className="bl-kpi">
                <span>Con mồi cuối kỳ</span>
                <strong style={{ color: '#059669' }}>{Math.round(finalPoint.prey || 0)}</strong>
              </div>
              <div className="bl-kpi">
                <span>Vật ăn thịt cuối kỳ</span>
                <strong style={{ color: '#dc2626' }}>{Math.round(finalPoint.predator || 0)}</strong>
              </div>
              <div className="bl-kpi">
                <span>Kiểu biến động</span>
                <strong>Dao động chu kỳ</strong>
              </div>
            </>
          ) : (
            <>
              <div className="bl-kpi">
                <span>N(cuối)</span>
                <strong>{Math.round(finalPoint.N || 0)} cá thể</strong>
              </div>
              <div className="bl-kpi">
                <span>Tốc độ cực đại (tại K/2)</span>
                <strong>{mode === 'logistic' ? `${maxGrowthRate} ct/thế hệ` : 'Không giới hạn'}</strong>
              </div>
              <div className="bl-kpi">
                <span>Sức chứa K</span>
                <strong>{mode === 'logistic' ? `${K} cá thể` : '∞ (Lý tưởng)'}</strong>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bl-panel">
        <div className="bl-ctrl">
          <label>Chọn mô hình toán học quần thể</label>
          <div className="bl-seg">
            {[
              { id: 'exponential', label: 'Tiềm năng (Chữ J)' },
              { id: 'logistic', label: 'Thực tế (Chữ S)' },
              { id: 'lotka', label: 'Con mồi – Vật ăn thịt' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                className={mode === m.id ? 'active' : ''}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bl-ctrl">
          <div className="bl-ctrl-row">
            <label>{mode === 'lotka' ? 'Số con mồi ban đầu (x₀)' : 'Kích thước quần thể ban đầu (N₀)'}</label>
            <strong>{n0} cá thể</strong>
          </div>
          <input type="range" className="bl-range" min="5" max="200" step="5" value={n0} onChange={(e) => setN0(Number(e.target.value))} />
        </div>

        {mode !== 'lotka' ? (
          <>
            <div className="bl-ctrl">
              <div className="bl-ctrl-row">
                <label>Tốc độ tăng trưởng nội tại (r)</label>
                <strong>{r.toFixed(2)}</strong>
              </div>
              <input type="range" className="bl-range" min="0.06" max="0.60" step="0.02" value={r} onChange={(e) => setR(Number(e.target.value))} />
            </div>

            {mode === 'logistic' && (
              <>
                <div className="bl-ctrl">
                  <div className="bl-ctrl-row">
                    <label>Sức chứa môi trường / Nguồn thức ăn (K)</label>
                    <strong>{K} cá thể</strong>
                  </div>
                  <input type="range" className="bl-range" min="150" max="1200" step="50" value={K} onChange={(e) => setK(Number(e.target.value))} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={compareFoodCut} onChange={(e) => setCompareFoodCut(e.target.checked)} />
                  <span>So sánh trực tiếp khi nguồn thức ăn giảm 50% (K/2)</span>
                </label>
              </>
            )}
          </>
        ) : (
          <>
            <div className="bl-ctrl">
              <div className="bl-ctrl-row">
                <label>Số vật ăn thịt ban đầu (y₀)</label>
                <strong>{pred0} cá thể</strong>
              </div>
              <input type="range" className="bl-range" min="4" max="60" step="2" value={pred0} onChange={(e) => setPred0(Number(e.target.value))} />
            </div>

            <div className="bl-ctrl">
              <div className="bl-ctrl-row">
                <label>Tỷ lệ săn mồi (β)</label>
                <strong>{beta.toFixed(3)}</strong>
              </div>
              <input type="range" className="bl-range" min="0.006" max="0.032" step="0.002" value={beta} onChange={(e) => setBeta(Number(e.target.value))} />
            </div>
          </>
        )}

        <div className="bl-info-card">
          <h4>Phương trình vi phân đang giải (RK4)</h4>
          {mode === 'exponential' && (
            <p>
              <strong>dN/dt = r·N</strong> — Xảy ra khi nguồn sống hoàn toàn dồi dào, không có giới hạn môi trường (thường chỉ tồn tại ngắn hạn ở pha đầu của vi sinh vật hoặc loài ngoại lai xâm lấn).
            </p>
          )}
          {mode === 'logistic' && (
            <p>
              <strong>dN/dt = r·N·(1 − N/K)</strong> — Tốc độ tăng trưởng đạt cực đại tại <strong>N = K/2 ({Math.round(K / 2)} cá thể)</strong>. Đây là cơ sở khai thác thủy sản bền vững trong Sinh học 12!
            </p>
          )}
          {mode === 'lotka' && (
            <p>
              <strong>Hệ Lotka–Volterra:</strong> Quần thể vật ăn thịt luôn đạt đỉnh <em>trễ pha</em> sau quần thể con mồi — minh họa cơ chế khống chế sinh học tự nhiên.
            </p>
          )}
        </div>

        <button
          type="button"
          className="bl-btn cobalt"
          onClick={() =>
            onAskAI?.(
              `Giải thích sự khác nhau giữa đường cong tăng trưởng chữ J và chữ S (Logistic), và vì sao nên khai thác quần thể ở mức N = K/2 để đạt năng suất bền vững cao nhất?`
            )
          }
        >
          Hỏi Bé ELEC về khai thác bền vững K/2
        </button>
      </div>
    </div>
  );
}
