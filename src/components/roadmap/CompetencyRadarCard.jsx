/* ============================================================
   CompetencyRadarCard.jsx — BIỂU ĐỒ RADAR 6 CHIỀU & DẢI ĐIỂM GAUSSIAN
   ------------------------------------------------------------
   Chuẩn Apple VisionOS · 100% SVG thuần · 0 emoji
   Trực quan hóa đa chiều năng lực KHTN & dải xác suất trúng tuyển
   ============================================================ */

import { useState, useMemo } from 'react';
import {
  RADAR_AXES,
  computeCompetencyRadar,
  computeGaussianScoreDistribution,
} from '../../lib/competencyRadarEngine.js';
import '../../styles/competency-radar.css';

/* ── Bộ Icon SVG thuần (0 emoji) ── */
const IcoCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IcoBellCurve = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 20h18" />
    <path d="M4 19c3-1 6-7 8-15 2 8 5 14 8 15" />
  </svg>
);

const IcoSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
  </svg>
);

export default function CompetencyRadarCard({
  overview = {},
  chapters = [],
  events = [],
  activeAspiration = null,
  predictedScore = 24.5,
  targetScore = 26.0,
  examScale = 30,
}) {
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'gaussian'

  // Tính toán Radar 6 chiều
  const radarData = useMemo(() => {
    return computeCompetencyRadar({
      overview,
      chapters,
      events,
      activeAspiration,
    });
  }, [overview, chapters, events, activeAspiration]);

  // Tính toán Dải điểm Gaussian
  const gaussianData = useMemo(() => {
    return computeGaussianScoreDistribution({
      predictedScore,
      examScale,
      totalAnswers: radarData.totalAnswers,
      targetScore,
    });
  }, [predictedScore, examScale, radarData.totalAnswers, targetScore]);

  // Tọa độ hình học vẽ Radar SVG (Tâm 170, 150, Bán kính R = 100)
  const CX = 170;
  const CY = 145;
  const MAX_R = 95;
  const ANGLE_STEP = (2 * Math.PI) / 6;

  // Tọa độ các đỉnh của đa giác đồng tâm (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = gridLevels.map((lvl) => {
    const pts = [];
    for (let i = 0; i < 6; i += 1) {
      const angle = i * ANGLE_STEP - Math.PI / 2;
      const x = CX + MAX_R * lvl * Math.cos(angle);
      const y = CY + MAX_R * lvl * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  });

  // Tọa độ đa giác năng lực của học sinh
  const userPolygon = useMemo(() => {
    const pts = [];
    RADAR_AXES.forEach((axis, i) => {
      const score = Math.max(10, Math.min(100, radarData.scores[axis.key] || 50));
      const ratio = score / 100;
      const angle = i * ANGLE_STEP - Math.PI / 2;
      const x = CX + MAX_R * ratio * Math.cos(angle);
      const y = CY + MAX_R * ratio * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    });
    return pts.join(' ');
  }, [radarData.scores]);

  // Vị trí các nhãn đỉnh
  const labelPositions = useMemo(() => {
    return RADAR_AXES.map((axis, i) => {
      const angle = i * ANGLE_STEP - Math.PI / 2;
      const labelR = MAX_R + 24;
      const x = CX + labelR * Math.cos(angle);
      const y = CY + labelR * Math.sin(angle);
      const score = radarData.scores[axis.key] || 50;
      return {
        key: axis.key,
        name: axis.shortName,
        score,
        x,
        y: y + 4,
        anchor: Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end',
      };
    });
  }, [radarData.scores]);

  // Vẽ SVG Bell Curve (Đường cong Gauss)
  const bellSvgWidth = 580;
  const bellSvgHeight = 135;
  const padL = 36;
  const padR = 36;
  const padT = 18;
  const padB = 28;
  const plotW = bellSvgWidth - padL - padR;
  const plotH = bellSvgHeight - padT - padB;

  const bellPathData = useMemo(() => {
    const { points, minX, maxX } = gaussianData;
    if (!points || !points.length) return '';
    const span = Math.max(1, maxX - minX);

    const pathPts = points.map((p, idx) => {
      const xRatio = (p.score - minX) / span;
      const x = padL + xRatio * plotW;
      const y = padT + (1 - p.density) * plotH;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    return pathPts.join(' ');
  }, [gaussianData, plotW, plotH]);

  // Tọa độ các mốc dọc trên đường cong Gauss
  const xCoordForScore = (val) => {
    const { minX, maxX } = gaussianData;
    const span = Math.max(1, maxX - minX);
    const ratio = Math.max(0, Math.min(1, (val - minX) / span));
    return padL + ratio * plotW;
  };

  const xSafe = xCoordForScore(gaussianData.safeFloor);
  const xExpected = xCoordForScore(gaussianData.expected);
  const xPeak = xCoordForScore(gaussianData.peakPotential);
  const xTarget = xCoordForScore(gaussianData.target);

  return (
    <section className="comp-radar-container" aria-label="Phân tích Radar Năng lực & Dải điểm Gaussian">
      {/* ── HEADER & TABS ── */}
      <div className="comp-radar-top">
        <div className="comp-radar-title-wrap">
          <h4>
            <IcoCompass />
            <span>Chẩn đoán Năng lực KHTN & Dải xác suất</span>
          </h4>
          <p>Thuật toán đa biến đánh giá 6 trục năng lực và đường cong xác suất thực chiến</p>
        </div>
        <div className="comp-radar-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'radar'}
            className={`comp-radar-tab-btn ${activeTab === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveTab('radar')}
          >
            <IcoCompass />
            <span>Radar 6 Chiều</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'gaussian'}
            className={`comp-radar-tab-btn ${activeTab === 'gaussian' ? 'active' : ''}`}
            onClick={() => setActiveTab('gaussian')}
          >
            <IcoBellCurve />
            <span>Dải điểm Thi thật (Gauss)</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: RADAR 6 CHIỀU ── */}
      {activeTab === 'radar' && (
        <div className="comp-radar-grid">
          <div className="comp-radar-chart-box">
            <svg className="comp-radar-svg" viewBox="0 0 340 295" aria-hidden="true">
              <defs>
                {/* Gradient phát sáng cho vùng diện tích năng lực */}
                <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
                </radialGradient>
              </defs>

              {/* Lưới đa giác đồng tâm 5 tầng */}
              {gridPolygons.map((pts, i) => (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1.2"
                  strokeDasharray={i < 4 ? '3 3' : 'none'}
                />
              ))}

              {/* 6 Đường nan hoa từ tâm ra đỉnh */}
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = i * ANGLE_STEP - Math.PI / 2;
                const x = CX + MAX_R * Math.cos(angle);
                const y = CY + MAX_R * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={CX}
                    y1={CY}
                    x2={x.toFixed(1)}
                    y2={y.toFixed(1)}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Đa giác năng lực của học sinh */}
              <polygon
                points={userPolygon}
                fill="url(#radarAreaGradient)"
                stroke="#4f46e5"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />

              {/* Các điểm nút trên đỉnh đa giác năng lực */}
              {RADAR_AXES.map((axis, i) => {
                const score = Math.max(10, Math.min(100, radarData.scores[axis.key] || 50));
                const ratio = score / 100;
                const angle = i * ANGLE_STEP - Math.PI / 2;
                const x = CX + MAX_R * ratio * Math.cos(angle);
                const y = CY + MAX_R * ratio * Math.sin(angle);
                return (
                  <circle
                    key={axis.key}
                    cx={x.toFixed(1)}
                    cy={y.toFixed(1)}
                    r="4.2"
                    fill="#4f46e5"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}

              {/* Nhãn văn bản tại các đỉnh */}
              {labelPositions.map((pos) => (
                <text
                  key={pos.key}
                  x={pos.x.toFixed(1)}
                  y={pos.y.toFixed(1)}
                  textAnchor={pos.anchor}
                  fontSize="10.5"
                  fontWeight="700"
                  fill="#334155"
                >
                  {pos.name} ({pos.score})
                </text>
              ))}
            </svg>
          </div>

          {/* Cột danh sách 6 chỉ số chi tiết */}
          <div className="comp-axes-list">
            {RADAR_AXES.map((axis) => {
              const score = radarData.scores[axis.key] || 50;
              return (
                <div key={axis.key} className="comp-axis-row">
                  <div className="comp-axis-header">
                    <span className="comp-axis-name">{axis.name}</span>
                    <span className="comp-axis-score">{score} / 100</span>
                  </div>
                  <div className="comp-axis-bar" role="progressbar" aria-valuenow={score} aria-valuemin="0" aria-valuemax="100">
                    <div className="comp-axis-fill" style={{ width: `${score}%` }} />
                  </div>
                  <div className="comp-axis-benchmark">
                    <span>{axis.desc}</span>
                    <strong>{axis.targetBenchmark}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: DẢI ĐIỂM GAUSSIAN ── */}
      {activeTab === 'gaussian' && (
        <div className="comp-gaussian-wrap">
          {/* 3 Thẻ chỉ số P90 - P50 - P10 */}
          <div className="comp-gaussian-pills">
            <div className="comp-gauss-pill floor">
              <span className="comp-gauss-tag">Sàn An toàn (P90)</span>
              <div className="comp-gauss-val">
                {gaussianData.safeFloor} <small>/{examScale}</small>
              </div>
              <span className="comp-gauss-sub">90% khả năng điểm thật ≥ mức này</span>
            </div>
            <div className="comp-gauss-pill expected">
              <span className="comp-gauss-tag">Kỳ vọng Hiện tại (P50)</span>
              <div className="comp-gauss-val">
                {gaussianData.expected} <small>/{examScale}</small>
              </div>
              <span className="comp-gauss-sub">Sát với phong độ thực chiến nhất</span>
            </div>
            <div className="comp-gauss-pill peak">
              <span className="comp-gauss-tag">Tiềm năng Đỉnh cao (P10)</span>
              <div className="comp-gauss-val">
                {gaussianData.peakPotential} <small>/{examScale}</small>
              </div>
              <span className="comp-gauss-sub">Khi bứt phá trọn vẹn câu 9+</span>
            </div>
          </div>

          {/* Đồ thị hình chuông Bell Curve SVG */}
          <div className="comp-bell-box">
            <svg className="comp-bell-svg" viewBox={`0 0 ${bellSvgWidth} ${bellSvgHeight}`} aria-hidden="true">
              <defs>
                <linearGradient id="bellCurveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Trục hoành */}
              <line
                x1={padL}
                y1={padT + plotH}
                x2={padL + plotW}
                y2={padT + plotH}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* Diện tích dưới đường cong */}
              <path
                d={`${bellPathData} L ${padL + plotW} ${padT + plotH} L ${padL} ${padT + plotH} Z`}
                fill="url(#bellCurveFill)"
              />

              {/* Đường cong mật độ phân phối Gauss */}
              <path
                d={bellPathData}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Vạch P90: Sàn an toàn */}
              <line
                x1={xSafe}
                y1={padT}
                x2={xSafe}
                y2={padT + plotH}
                stroke="#10b981"
                strokeWidth="1.8"
                strokeDasharray="3 3"
              />
              <text x={xSafe} y={padT + plotH + 16} textAnchor="middle" fontSize="10" fontWeight="700" fill="#059669">
                P90 ({gaussianData.safeFloor})
              </text>

              {/* Vạch P50: Kỳ vọng trung bình */}
              <line
                x1={xExpected}
                y1={padT - 6}
                x2={xExpected}
                y2={padT + plotH}
                stroke="#2563eb"
                strokeWidth="2.2"
              />
              <circle cx={xExpected} cy={padT - 6} r="4" fill="#2563eb" />
              <text x={xExpected} y={padT + plotH + 16} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1d4ed8">
                P50 ({gaussianData.expected})
              </text>

              {/* Vạch P10: Thăng hoa */}
              <line
                x1={xPeak}
                y1={padT}
                x2={xPeak}
                y2={padT + plotH}
                stroke="#8b5cf6"
                strokeWidth="1.8"
                strokeDasharray="3 3"
              />
              <text x={xPeak} y={padT + plotH + 16} textAnchor="middle" fontSize="10" fontWeight="700" fill="#7c3aed">
                P10 ({gaussianData.peakPotential})
              </text>

              {/* Vạch Điểm Mục tiêu NV1 */}
              <line
                x1={xTarget}
                y1={padT - 10}
                x2={xTarget}
                y2={padT + plotH}
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <text x={xTarget} y={padT - 12} textAnchor="middle" fontSize="10" fontWeight="800" fill="#dc2626">
                Mục tiêu NV1 ({gaussianData.target})
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* ── LỜI KHUYÊN AI BỔ TRỢ ── */}
      <div className="comp-radar-advice-box">
        <div className="comp-radar-advice-icon" aria-hidden="true">
          <IcoSparkle />
        </div>
        <div>
          <strong>Chiến thuật tối ưu phong độ:</strong> {radarData.advice} (Trục cần đẩy mạnh nhất: <strong>{radarData.weakest.name}</strong>).
        </div>
      </div>
    </section>
  );
}
