/* ============================================================
   AspirationAiStrategyModal.jsx — MODAL CHIẾN LƯỢC AI PHÂN TÍCH NGUYỆN VỌNG & LỘ TRÌNH
   ------------------------------------------------------------
   Chuẩn Apple VisionOS kính mờ · 100% SVG thuần · 0 emoji
   Tích hợp trọn vẹn 3 trụ cột nâng cấp:
   1. AI Lộ trình 3 Giai đoạn & Xác suất trúng tuyển định lượng
   2. Radar Năng lực KHTN 6 Chiều & Phân phối chuẩn Gaussian
   3. Tối ưu hóa Rổ Nguyện vọng 3 Tầng (Reach - Target - Safety) & So sánh Đối đầu
   ============================================================ */

import { useState, useMemo } from 'react';
import {
  buildComprehensiveAiStrategy,
  applyAiStrategyToRoadmap,
} from '../../lib/aspirationAiEngine.js';
import CompetencyRadarCard from '../roadmap/CompetencyRadarCard.jsx';
import {
  evaluatePortfolioHealth,
  compareMajorsHeadToHead,
} from '../../lib/aspirationPortfolioOptimizer.js';
import referenceData from '../../data/admissionsReference.json';
import '../../styles/aspiration-ai-strategy.css';

/* ── Bộ Icon SVG thuần (0 emoji) ── */
const IcoSparkles = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
  </svg>
);

const IcoClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcoCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IcoCompass = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IcoScale = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h18" />
  </svg>
);

const IcoShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IcoAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoMessage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default function AspirationAiStrategyModal({
  isOpen = false,
  onClose,
  uid = 'guest',
  activeAspiration,
  aspirations = [],
  progress,
  schedule,
  chapters = [],
  dueByTopic = {},
  overview = {},
  events = [],
  predictedScore = 24.5,
  targetScore = 26.0,
  examScale = 30,
  onAskAiTutor,
  onStrategyApplied,
}) {
  const [modalTab, setModalTab] = useState('strategy'); // 'strategy' | 'radar' | 'portfolio'
  const [isApplied, setIsApplied] = useState(false);

  // Sinh phân tích AI toàn diện
  const strategy = useMemo(() => {
    if (!isOpen) return null;
    return buildComprehensiveAiStrategy({
      uid,
      activeAspiration,
      progress,
      schedule,
      chapters,
      dueByTopic,
    });
  }, [isOpen, uid, activeAspiration, progress, schedule, chapters, dueByTopic]);

  // Phân tích sức khỏe danh mục nguyện vọng
  const portfolioAnalysis = useMemo(() => {
    const list = aspirations && aspirations.length ? aspirations : (activeAspiration ? [activeAspiration] : []);
    return evaluatePortfolioHealth(list, predictedScore, examScale);
  }, [aspirations, activeAspiration, predictedScore, examScale]);

  // So sánh đối đầu 2 trường
  const allMajors = useMemo(() => referenceData.majors || [], []);
  const [compareIdA, setCompareIdA] = useState(() => aspirations[0]?.majorId || activeAspiration?.majorId || 'bka-tdh');
  const [compareIdB, setCompareIdB] = useState(() => aspirations[1]?.majorId || 'neu-cntt');

  const comparisonData = useMemo(() => {
    return compareMajorsHeadToHead([compareIdA, compareIdB]);
  }, [compareIdA, compareIdB]);

  if (!isOpen || !strategy) return null;

  const {
    school,
    major,
    exam,
    probability,
    subjectBreakdown,
    strategicRoadmap,
    keyRecommendations,
  } = strategy;

  const handleApply = () => {
    const ok = applyAiStrategyToRoadmap(uid, strategy);
    if (ok) {
      setIsApplied(true);
      if (onStrategyApplied) onStrategyApplied(strategy);
      setTimeout(() => {
        setIsApplied(false);
        if (onClose) onClose();
      }, 1200);
    }
  };

  const handleConsultDeep = () => {
    if (onAskAiTutor) {
      const prompt = `Em đang hướng tới mục tiêu trúng tuyển NV1: ${school.code} - ${school.name} (Ngành ${major.name}, Khối ${major.blockCode}). Điểm chuẩn tham chiếu là ${major.cutoffScore}/${exam.scale}, Điểm mục tiêu của em là ${major.targetScore}. Hiện tại xác suất trúng tuyển theo AI là ${probability.probabilityPct}% (${probability.levelLabel}). Em muốn Gia sư AI phân tích sâu chiến thuật bứt phá 3 môn và cách phân bổ thời gian hàng ngày giúp em.`;
      onAskAiTutor(prompt);
      if (onClose) onClose();
    }
  };

  return (
    <div
      className="ai-strat-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-strat-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="ai-strat-modal">
        {/* ── 1. HEADER KÍNH MỜ ── */}
        <header className="ai-strat-header">
          <div className="ai-strat-title-group">
            <div className="ai-strat-sparkle-icon" aria-hidden="true">
              <IcoSparkles />
            </div>
            <div className="ai-strat-header-text">
              <h2 id="ai-strat-title">AI Phân tích Chiến lược & Lộ trình Mục tiêu</h2>
              <p>Chuẩn Đề án tuyển sinh 105 trường ĐH &amp; Ma trận đề thi KHTN mới nhất</p>
            </div>
          </div>
          <button
            type="button"
            className="ai-strat-close-btn"
            onClick={onClose}
            aria-label="Đóng cửa sổ phân tích"
          >
            <IcoClose />
          </button>
        </header>

        {/* ── THANH CHỌN TAB NÂNG CAO (1 - 2 - 3) ── */}
        <div className="ai-strat-nav-tabs" role="tablist" aria-label="Các góc nhìn phân tích AI">
          <button
            type="button"
            role="tab"
            aria-selected={modalTab === 'strategy'}
            className={`ai-strat-tab-btn ${modalTab === 'strategy' ? 'active' : ''}`}
            onClick={() => setModalTab('strategy')}
          >
            <IcoCompass />
            <span>1. Lộ trình AI &amp; Xác suất đỗ</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modalTab === 'radar'}
            className={`ai-strat-tab-btn ${modalTab === 'radar' ? 'active' : ''}`}
            onClick={() => setModalTab('radar')}
          >
            <IcoTarget />
            <span>2. Radar 6 Chiều &amp; Dải Gaussian</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modalTab === 'portfolio'}
            className={`ai-strat-tab-btn ${modalTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setModalTab('portfolio')}
          >
            <IcoScale />
            <span>3. Tối ưu Rổ NV &amp; So sánh Trường</span>
          </button>
        </div>

        {/* ── 2. BODY CUỘN NỘI DUNG ── */}
        <div className="ai-strat-body">
          {/* TAB 1: LỘ TRÌNH CHIẾN LƯỢC & XÁC SUẤT ĐỖ */}
          {modalTab === 'strategy' && (
            <>
              {/* Card thông tin nguyện vọng đang phân tích */}
              <section className="ai-strat-target-card" aria-label="Mục tiêu xét tuyển">
                <div className="ai-strat-target-meta">
                  <span className="ai-strat-school-badge">{school.code}</span>
                  <div className="ai-strat-target-info">
                    <h3>{school.name}</h3>
                    <p>
                      Ngành <strong>{major.name}</strong> · Mã: <code>{major.code || 'Chuẩn'}</code> · Khối: <strong>{major.blockCode}</strong>
                    </p>
                  </div>
                </div>
                <div className="ai-strat-target-scores">
                  <div className="ai-strat-score-item">
                    <span className="ai-strat-score-label">Điểm chuẩn tham khảo</span>
                    <span className="ai-strat-score-val">{major.cutoffScore}</span>
                  </div>
                  <div className="ai-strat-score-item">
                    <span className="ai-strat-score-label">Điểm mục tiêu</span>
                    <span className="ai-strat-score-val highlight">{major.targetScore}</span>
                  </div>
                </div>
              </section>

              {/* Thước đo xác suất trúng tuyển (Probability Gauge) */}
              <section className="ai-strat-prob-card" aria-label="Xác suất trúng tuyển">
                <div className="ai-strat-prob-top">
                  <span className="ai-strat-prob-label">
                    <IcoCompass />
                    <span>Đánh giá cơ hội trúng tuyển định lượng</span>
                  </span>
                  <span className={`ai-strat-prob-badge tone-${probability.levelTone}`}>
                    {probability.probabilityPct}% · {probability.levelLabel} ({probability.deltaLabel})
                  </span>
                </div>
                <div className="ai-strat-gauge-bar" role="progressbar" aria-valuenow={probability.probabilityPct} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className={`ai-strat-gauge-fill tone-${probability.levelTone}`}
                    style={{ width: `${Math.min(100, Math.max(8, probability.probabilityPct))}%` }}
                  />
                </div>
                <p className="ai-strat-prob-summary">{probability.summary}</p>
              </section>

              {/* Bảng phân bổ điểm từng môn theo tổ hợp chuẩn ban */}
              <section aria-label="Phân bổ điểm 3 môn trong tổ hợp">
                <h3 className="ai-strat-section-title">
                  <IcoTarget />
                  <span>Phân bổ điểm thành phần tổ hợp {major.blockCode} (Tổng mục tiêu: {major.targetScore}đ)</span>
                </h3>
                <div className="ai-strat-subjects-grid">
                  {subjectBreakdown.map((item) => (
                    <div key={item.subjectName} className="ai-strat-subject-box">
                      <div className="ai-strat-subj-top">
                        <span className="ai-strat-subj-name">{item.subjectName}</span>
                        <span className="ai-strat-subj-role">{item.role}</span>
                      </div>
                      <div className="ai-strat-subj-score">
                        {item.targetScore} <small>/ 10 điểm ({item.sharePct}%)</small>
                      </div>
                      <p className="ai-strat-subj-desc">{item.strategy}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Lộ trình chiến lược 3 giai đoạn */}
              <section aria-label="Lộ trình 3 giai đoạn">
                <h3 className="ai-strat-section-title">
                  <IcoCompass />
                  <span>Lộ trình chiến lược 3 giai đoạn cá nhân hóa</span>
                </h3>
                <div className="ai-strat-phases-wrap">
                  {strategicRoadmap.map((phase) => (
                    <div key={phase.phaseId} className="ai-strat-phase-card">
                      <div className="ai-strat-phase-header">
                        <div className="ai-strat-phase-title-row">
                          <span className="ai-strat-phase-num">{phase.phaseId}</span>
                          <strong className="ai-strat-phase-name">{phase.phaseName}</strong>
                        </div>
                        <div className="ai-strat-phase-meta">
                          <span className="ai-strat-phase-duration">{phase.durationLabel}</span>
                          <span className={`ai-strat-phase-badge tone-${phase.badgeTone}`}>
                            {phase.badge}
                          </span>
                        </div>
                      </div>
                      <div className="ai-strat-phase-target">
                        Mục tiêu: <strong>{phase.targetMilestone}</strong> — {phase.focusDesc}
                      </div>
                      <div className="ai-strat-phase-topics">
                        {(phase.recommendedTopics || []).map((top) => (
                          <span key={top.id || top.name} className="ai-strat-topic-pill">
                            <span>{top.name}</span>
                            {top.examShare && <strong>({top.examShare})</strong>}
                            {top.gain && <span className="ai-strat-topic-gain">{top.gain}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Khuyến nghị AI cốt lõi */}
              <section className="ai-strat-prob-card" style={{ background: '#f8fafc' }} aria-label="Khuyến nghị cốt lõi">
                <h3 className="ai-strat-section-title" style={{ margin: '0 0 8px' }}>
                  <IcoSparkles />
                  <span>Lời khuyên từ ELEC AI</span>
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  {keyRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {/* TAB 2: RADAR 6 CHIỀU & PHÂN PHỐI CHUẨN GAUSSIAN */}
          {modalTab === 'radar' && (
            <section className="ai-strat-tab-pane" aria-label="Phân tích Radar & Gaussian">
              <CompetencyRadarCard
                overview={overview}
                chapters={chapters}
                events={events}
                activeAspiration={activeAspiration}
                predictedScore={predictedScore}
                targetScore={targetScore}
                examScale={examScale}
              />
            </section>
          )}

          {/* TAB 3: TỐI ƯU RỔ NGUYỆN VỌNG & SO SÁNH TRƯỜNG */}
          {modalTab === 'portfolio' && (
            <section className="ai-strat-tab-pane" aria-label="Tối ưu rổ nguyện vọng">
              {/* Sức khỏe danh mục nguyện vọng */}
              <div className="ai-strat-port-summary">
                <div className="ai-strat-port-score-box">
                  <div className="ai-strat-port-score-circle">
                    <strong>{portfolioAnalysis.healthScore}</strong>
                    <small>/100</small>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>
                      Độ bền vững rổ nguyện vọng: <b>{portfolioAnalysis.statusLabel}</b>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                      {portfolioAnalysis.warnings?.[0] || portfolioAnalysis.recommendations?.[0] || 'Danh mục nguyện vọng của bạn đang ở trạng thái tốt.'}
                    </p>
                  </div>
                </div>

                {/* Cảnh báo nghịch đảo thứ tự nếu có */}
                {portfolioAnalysis.hasInversion && (
                  <div className="ai-strat-alert-box warning">
                    <IcoAlert />
                    <div>
                      <strong>Cảnh báo nghịch đảo thứ tự nguyện vọng!</strong>
                      <p>Nguyện vọng sau có điểm chuẩn cao hơn nguyện vọng trước. Bạn nên xếp trường có điểm chuẩn cao hơn lên NV1 để tối đa cơ hội trúng tuyển.</p>
                    </div>
                  </div>
                )}

                {/* 3 Tầng nguyện vọng: Mơ ước - Vừa sức - An toàn */}
                <div className="ai-strat-tier-grid">
                  <div className="ai-strat-tier-col reach">
                    <div className="ai-strat-tier-header">
                      <span className="ai-strat-tier-dot reach" />
                      <strong>Vươn tầm (Mơ ước)</strong>
                      <span className="ai-strat-tier-cnt">{(portfolioAnalysis?.reachAspirations || []).length}</span>
                    </div>
                    <div className="ai-strat-tier-list">
                      {(portfolioAnalysis?.reachAspirations || []).length ? (
                        portfolioAnalysis.reachAspirations.map((a) => (
                          <div key={a.id} className="ai-strat-tier-item">
                            <b>NV{a.priority}: {a.school?.code}</b> · {a.major?.name} ({a.targetScore}đ)
                          </div>
                        ))
                      ) : (
                        <div className="ai-strat-tier-empty">Chưa có nguyện vọng mơ ước</div>
                      )}
                    </div>
                  </div>

                  <div className="ai-strat-tier-col target">
                    <div className="ai-strat-tier-header">
                      <span className="ai-strat-tier-dot target" />
                      <strong>Vừa sức (Mục tiêu)</strong>
                      <span className="ai-strat-tier-cnt">{(portfolioAnalysis?.targetAspirations || []).length}</span>
                    </div>
                    <div className="ai-strat-tier-list">
                      {(portfolioAnalysis?.targetAspirations || []).length ? (
                        portfolioAnalysis.targetAspirations.map((a) => (
                          <div key={a.id} className="ai-strat-tier-item">
                            <b>NV{a.priority}: {a.school?.code}</b> · {a.major?.name} ({a.targetScore}đ)
                          </div>
                        ))
                      ) : (
                        <div className="ai-strat-tier-empty">Chưa có nguyện vọng vừa sức</div>
                      )}
                    </div>
                  </div>

                  <div className="ai-strat-tier-col safety">
                    <div className="ai-strat-tier-header">
                      <span className="ai-strat-tier-dot safety" />
                      <strong>An toàn (Bảo hiểm)</strong>
                      <span className="ai-strat-tier-cnt">{(portfolioAnalysis?.safetyAspirations || []).length}</span>
                    </div>
                    <div className="ai-strat-tier-list">
                      {(portfolioAnalysis?.safetyAspirations || []).length ? (
                        portfolioAnalysis.safetyAspirations.map((a) => (
                          <div key={a.id} className="ai-strat-tier-item">
                            <b>NV{a.priority}: {a.school?.code}</b> · {a.major?.name} ({a.targetScore}đ)
                          </div>
                        ))
                      ) : (
                        <div className="ai-strat-tier-empty">Chưa có nguyện vọng an toàn</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* So sánh đối đầu 2 ngành */}
              <div className="ai-strat-compare-section">
                <h3 className="ai-strat-section-title">
                  <IcoScale />
                  <span>So sánh đối đầu trực quan giữa 2 ngành</span>
                </h3>
                <div className="ai-strat-compare-selectors">
                  <select
                    value={compareIdA}
                    onChange={(e) => setCompareIdA(e.target.value)}
                    className="ai-strat-select"
                  >
                    {allMajors.map((m) => {
                      const sCode = (referenceData.schools || []).find((s) => s.id === m.schoolId)?.code || m.schoolId || '';
                      const cutoff = (m.cutoffs || []).find((c) => c.examId === 'THPTQG' && c.year === 2025)?.score
                        ?? (m.cutoffs || []).find((c) => c.examId === 'THPTQG')?.score
                        ?? m.cutoffs?.[0]?.score
                        ?? '—';
                      return (
                        <option key={`a-${m.id}`} value={m.id}>
                          {sCode} — {m.name} ({cutoff}đ)
                        </option>
                      );
                    })}
                  </select>
                  <span className="ai-strat-vs-badge">VS</span>
                  <select
                    value={compareIdB}
                    onChange={(e) => setCompareIdB(e.target.value)}
                    className="ai-strat-select"
                  >
                    {allMajors.map((m) => {
                      const sCode = (referenceData.schools || []).find((s) => s.id === m.schoolId)?.code || m.schoolId || '';
                      const cutoff = (m.cutoffs || []).find((c) => c.examId === 'THPTQG' && c.year === 2025)?.score
                        ?? (m.cutoffs || []).find((c) => c.examId === 'THPTQG')?.score
                        ?? m.cutoffs?.[0]?.score
                        ?? '—';
                      return (
                        <option key={`b-${m.id}`} value={m.id}>
                          {sCode} — {m.name} ({cutoff}đ)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {Array.isArray(comparisonData) && comparisonData.length > 0 && (
                  <div className="ai-strat-compare-grid">
                    {comparisonData.map((item) => {
                      const cutoffVal = item.cutoffs?.thpt2025 !== '—'
                        ? item.cutoffs.thpt2025
                        : (item.cutoffs?.thpt2024 !== '—' ? item.cutoffs.thpt2024 : (item.cutoffs?.hsa !== '—' ? item.cutoffs.hsa : item.cutoffs?.tsa));
                      const careerList = String(item.career || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      return (
                        <div key={item.majorId} className="ai-strat-comp-card">
                          <div className="ai-strat-comp-top">
                            <span className="ai-strat-school-badge">{item.school?.code}</span>
                            <strong>{item.school?.name}</strong>
                          </div>
                          <h4 style={{ margin: '8px 0 4px', fontSize: '0.96rem', color: '#0f172a' }}>{item.majorName}</h4>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
                            Khối: <b>{item.blocks?.join(', ')}</b> · Học phí: <b>{item.tuition}</b>
                          </div>
                          <div className="ai-strat-comp-score-row">
                            <span>Điểm chuẩn:</span>
                            <b>{cutoffVal !== '—' && cutoffVal !== undefined ? `${cutoffVal} điểm` : 'Chưa công bố'}</b>
                          </div>
                          <div className="ai-strat-comp-tags">
                            {careerList.map((cp, cIdx) => (
                              <span key={cIdx} className="ai-strat-comp-pill">{cp}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── 3. CHÂN TRANG CTA HÀNH ĐỘNG ── */}
        <footer className="ai-strat-footer">
          <div className="ai-strat-footer-note">
            <IcoSparkles />
            <span>Chiến lược được tự động cập nhật mỗi khi bạn hoàn thành bài tập mới.</span>
          </div>
          <div className="ai-strat-footer-actions">
            {onAskAiTutor && (
              <button
                type="button"
                className="ai-strat-btn-secondary"
                onClick={handleConsultDeep}
              >
                <IcoMessage />
                <span>Hỏi sâu Gia sư AI</span>
              </button>
            )}
            <button
              type="button"
              className={`ai-strat-btn-primary ${isApplied ? 'applied' : ''}`}
              onClick={handleApply}
              disabled={isApplied}
            >
              {isApplied ? (
                <>
                  <IcoCheck />
                  <span>Đã áp dụng vào Lộ trình!</span>
                </>
              ) : (
                <>
                  <IcoCheck />
                  <span>Áp dụng vào Lộ trình của em</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

