/* ============================================================
   AspirationPortfolioModal.jsx — MODAL TỐI ƯU HÓA RỔ NGUYỆN VỌNG & SO SÁNH TRƯỜNG
   ------------------------------------------------------------
   Chuẩn Apple VisionOS · 100% SVG thuần · 0 emoji
   Kiểm tra sức khỏe danh mục nguyện vọng (Reach - Target - Safety) & So sánh đối đầu
   ============================================================ */

import { useState, useMemo } from 'react';
import {
  evaluatePortfolioHealth,
  compareMajorsHeadToHead,
} from '../../lib/aspirationPortfolioOptimizer.js';
import { getSchools } from '../../lib/aspirationService.js';
import referenceData from '../../data/admissionsReference.json';
import '../../styles/aspiration-portfolio.css';

/* ── Bộ Icon SVG thuần (0 emoji) ── */
const IcoShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IcoScale = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h18" />
  </svg>
);

const IcoClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcoAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function AspirationPortfolioModal({
  isOpen = false,
  onClose,
  aspirations = [],
  predictedScore = 24.5,
  examScale = 30,
}) {
  const [activeTab, setActiveTab] = useState('health'); // 'health' | 'compare'

  // Phân tích sức khỏe danh mục nguyện vọng
  const portfolioAnalysis = useMemo(() => {
    return evaluatePortfolioHealth(aspirations, predictedScore, examScale);
  }, [aspirations, predictedScore, examScale]);

  // Danh sách các ngành có sẵn để so sánh đối đầu
  const allMajors = useMemo(() => referenceData.majors || [], []);
  const [compareIdA, setCompareIdA] = useState(() => aspirations[0]?.majorId || 'bka-tdh');
  const [compareIdB, setCompareIdB] = useState(() => aspirations[1]?.majorId || 'neu-cntt');

  const comparisonData = useMemo(() => {
    return compareMajorsHeadToHead([compareIdA, compareIdB]);
  }, [compareIdA, compareIdB]);

  if (!isOpen) return null;

  return (
    <div
      className="port-opt-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="port-opt-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="port-opt-modal">
        {/* ── HEADER ── */}
        <header className="port-opt-header">
          <div className="port-opt-title-group">
            <div className="port-opt-icon-badge" aria-hidden="true">
              <IcoShield />
            </div>
            <div className="port-opt-header-text">
              <h2 id="port-opt-title">Tối ưu hóa Danh mục Nguyện vọng & So sánh Đối đầu</h2>
              <p>Mô hình rổ nguyện vọng 3 tầng (Mơ ước – Vừa sức – Bảo hiểm) theo chuẩn Bộ GD&ĐT</p>
            </div>
          </div>
          <button
            type="button"
            className="port-opt-close-btn"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            <IcoClose />
          </button>
        </header>

        {/* ── TABS CHUYỂN ĐỔI ── */}
        <div className="port-opt-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'health'}
            className={`port-opt-tab ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            <IcoShield />
            <span>Sức khỏe Danh mục ({portfolioAnalysis.healthScore}/100)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'compare'}
            className={`port-opt-tab ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <IcoScale />
            <span>So sánh Đối đầu Song song</span>
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="port-opt-body">
          {/* TAB 1: SỨC KHỎE RỔ NGUYỆN VỌNG */}
          {activeTab === 'health' && (
            <>
              {/* Thẻ chỉ số tổng quan */}
              <div className="port-health-overview-card">
                <div className="port-health-score-box">
                  <div className={`port-health-score-circle tone-${portfolioAnalysis.statusTone}`}>
                    {portfolioAnalysis.healthScore}
                  </div>
                  <div className="port-health-score-info">
                    <h3>Độ an toàn hồ sơ: {portfolioAnalysis.statusLabel}</h3>
                    <p>
                      Điểm dự đoán hiện tại: <strong>{predictedScore}/{examScale}</strong> · Đã đăng ký {aspirations.length}/3 nguyện vọng
                    </p>
                  </div>
                </div>
              </div>

              {/* Các cảnh báo rủi ro nếu có */}
              {portfolioAnalysis.warnings.length > 0 && (
                <div className="port-warning-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <IcoAlert />
                    <strong>Cảnh báo chiến thuật tuyển sinh:</strong>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {portfolioAnalysis.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Danh sách 3 tầng nguyện vọng */}
              <div className="port-tiers-stack">
                {portfolioAnalysis.analyzedList.map((item) => (
                  <div key={item.id} className="port-tier-card">
                    <div className="port-tier-card-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ color: '#2563eb' }}>NV{item.priority}</strong>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.school?.code} · {item.school?.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({item.major?.name})</span>
                      </div>
                      <span className={`port-tier-badge tone-${item.classification.tierTone}`}>
                        {item.classification.tierLabel}
                      </span>
                    </div>
                    <div className="port-tier-headline">
                      Điểm chuẩn: <strong>{item.cutoffScore}</strong> · Chênh lệch: <strong>{item.classification.diff >= 0 ? `+${item.classification.diff}` : item.classification.diff}đ</strong> so với dự đoán
                    </div>
                    <p className="port-tier-desc">{item.classification.desc}</p>
                  </div>
                ))}
              </div>

              {/* Khuyến nghị chiến lược */}
              {portfolioAnalysis.recommendations.length > 0 && (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.84rem', color: '#166534', lineHeight: 1.5 }}>
                  <strong>Chiến lược từ ELEC AI:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                    {portfolioAnalysis.recommendations.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* TAB 2: SO SÁNH ĐỐI ĐẦU SONG SONG */}
          {activeTab === 'compare' && (
            <>
              {/* Chọn 2 ngành để so sánh */}
              <div className="port-compare-controls">
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>
                    Ngành A:
                  </label>
                  <select
                    className="port-compare-select"
                    value={compareIdA}
                    onChange={(e) => setCompareIdA(e.target.value)}
                  >
                    {allMajors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.schoolId} — {m.name} ({m.majorCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>
                    Ngành B:
                  </label>
                  <select
                    className="port-compare-select"
                    value={compareIdB}
                    onChange={(e) => setCompareIdB(e.target.value)}
                  >
                    {allMajors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.schoolId} — {m.name} ({m.majorCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bảng so sánh 2 cột */}
              {comparisonData.length === 2 && (
                <table className="port-compare-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>Tiêu chí so sánh</th>
                      <th style={{ width: '36%' }}>{comparisonData[0].school.code} · {comparisonData[0].majorName}</th>
                      <th style={{ width: '36%' }}>{comparisonData[1].school.code} · {comparisonData[1].majorName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Trường Đại học</td>
                      <td><strong>{comparisonData[0].school.name}</strong> ({comparisonData[0].school.city})</td>
                      <td><strong>{comparisonData[1].school.name}</strong> ({comparisonData[1].school.city})</td>
                    </tr>
                    <tr>
                      <td>Mã ngành & Khoa</td>
                      <td><code>{comparisonData[0].majorCode}</code> · {comparisonData[0].faculty}</td>
                      <td><code>{comparisonData[1].majorCode}</code> · {comparisonData[1].faculty}</td>
                    </tr>
                    <tr>
                      <td>Tổ hợp xét tuyển</td>
                      <td>{comparisonData[0].blocks.join(', ')}</td>
                      <td>{comparisonData[1].blocks.join(', ')}</td>
                    </tr>
                    <tr>
                      <td>Điểm chuẩn THPT 2024</td>
                      <td className="highlight">{comparisonData[0].cutoffs.thpt2024}</td>
                      <td className="highlight">{comparisonData[1].cutoffs.thpt2024}</td>
                    </tr>
                    <tr>
                      <td>Điểm chuẩn THPT 2025</td>
                      <td className="highlight">{comparisonData[0].cutoffs.thpt2025}</td>
                      <td className="highlight">{comparisonData[1].cutoffs.thpt2025}</td>
                    </tr>
                    <tr>
                      <td>Điểm ĐGNL (HSA / TSA)</td>
                      <td>TSA: {comparisonData[0].cutoffs.tsa} · HSA: {comparisonData[0].cutoffs.hsa}</td>
                      <td>TSA: {comparisonData[1].cutoffs.tsa} · HSA: {comparisonData[1].cutoffs.hsa}</td>
                    </tr>
                    <tr>
                      <td>Chỉ tiêu tuyển sinh</td>
                      <td>{comparisonData[0].quota} sinh viên</td>
                      <td>{comparisonData[1].quota} sinh viên</td>
                    </tr>
                    <tr>
                      <td>Học phí dự kiến</td>
                      <td>{comparisonData[0].tuition}</td>
                      <td>{comparisonData[1].tuition}</td>
                    </tr>
                    <tr>
                      <td>Cơ hội nghề nghiệp</td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>{comparisonData[0].career}</td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>{comparisonData[1].career}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
