/* ============================================================
   AspirationRoadmapHub.jsx — THẺ "LỘ TRÌNH CỦA EM" & BIỂU ĐỒ ĐIỂM/ELO
   (Chuẩn ELEC AI — Gọn gàng, thực tế, dễ hiểu ngay trong 5 giây)
   ------------------------------------------------------------
   1. Banner Nguyện vọng đang chọn: Trường + Ngành + Tổ hợp + Điểm mục tiêu
      (Đồng bộ trực tiếp với nút chọn Nguyện vọng trên thanh điều hướng).
   2. Thẻ "Lộ trình của em" gồm 4 chỉ số trên 1 hàng:
      • Điểm dự đoán (thang 10 môn Hóa & quy đổi thang kỳ thi)
      • Điểm mục tiêu (từ điểm chuẩn nguyện vọng + biên an toàn)
      • Tiến độ ("Cần tăng tốc" / "Đúng tiến độ" / "Vượt tiến độ" + chênh lệch điểm)
      • Điểm năng lực (Elo)
   3. Biểu đồ đường SVG tương tác:
      • Chuyển đổi Điểm dự đoán | Điểm Elo
      • Zoom 7 ngày / 14 ngày / 30 ngày, rê chuột xem chi tiết từng ngày, ghim mốc mục tiêu
   4. Một dòng gợi ý hành động duy nhất + Nút chính nổi bật "Luyện tập ngay".
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import {
  subscribeAspirationChanges,
} from '../../lib/aspirationService.js';
import {
  buildAutoRoadmapData,
  saveScheduleConfig,
} from '../../lib/autoRoadmapEngine.js';
import {
  localProgressCommentary,
  getProgressCommentaryWithAI,
} from '../../lib/aiTutorService.js';
import ElecTutorOnboardingModal from '../aspiration/ElecTutorOnboardingModal.jsx';
import AspirationAiStrategyModal from '../aspiration/AspirationAiStrategyModal.jsx';
import AspirationPortfolioModal from '../aspiration/AspirationPortfolioModal.jsx';
import CompetencyRadarCard from './CompetencyRadarCard.jsx';
import UserAvatar from '../UserAvatar.jsx';
import { useCurrentSubject } from '../SubjectSwitcher.jsx';
import { getUniversityCover } from '../../data/universityCovers.js';
import { getUserProfile } from '../../lib/userProfileService.js';
import { useAuth } from '../../hooks/useAuth.jsx';

/* ── Bộ biểu tượng SVG sắc nét ── */
const IcoGradCap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IcoMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IcoTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IcoBolt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);

const IcoClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IcoPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
  </svg>
);

const IcoPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const IcoSparkle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
  </svg>
);

const IcoScale = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h18" />
  </svg>
);

const IcoBarChart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IcoCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IcoTrending = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IcoCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IcoEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IcoInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/* ── Biểu đồ đường SVG tương tác (Điểm dự đoán | Elo, Zoom 7/14/30 ngày, Ghim mốc) ── */
function InteractiveProgressChart({
  eloHistory = [],
  predictedChem10 = 5.5,
  targetChem10 = 8.5,
  elo = 1200,
}) {
  const { subject } = useCurrentSubject?.() || { subject: 'all' };
  const subjectShort = subject === 'ly' ? 'Lí' : subject === 'sinh' ? 'Sinh' : subject === 'hoa' ? 'Hóa' : 'KHTN';

  const [metricMode, setMetricMode] = useState('score'); // 'score' | 'elo'
  const [rangeDays, setRangeDays] = useState(14); // 7 | 14 | 30
  const [pinTarget, setPinTarget] = useState(true);
  const [hoverIdx, setHoverIdx] = useState(null);

  const safePredictedChem10 = Number.isFinite(predictedChem10) ? predictedChem10 : 5.5;
  const safeTargetChem10 = Number.isFinite(targetChem10) ? targetChem10 : 8.5;

  const series = useMemo(() => {
    const raw = (eloHistory || []).slice(-rangeDays);
    if (!raw.length) return [];
    return raw.map((pt, idx) => {
      // Quy đổi Elo sang điểm thang 10 mượt mà
      const safeElo = Number.isFinite(pt.elo) ? pt.elo : 1150;
      const score10 = Math.min(10, Math.max(3.5, Math.round(((safeElo - 900) / 100) * 10) / 10));
      const safeScore = Number.isFinite(score10) ? score10 : 5.5;
      return {
        date: pt.date || `day-${idx}`,
        shortDate: pt.date ? (pt.date.slice(8, 10) + '/' + pt.date.slice(5, 7)) : 'Hôm nay',
        elo: safeElo,
        score: idx === raw.length - 1 ? safePredictedChem10 : safeScore,
        count: pt.count || 0,
      };
    });
  }, [eloHistory, rangeDays, safePredictedChem10]);

  if (!series.length) {
    return (
      <div className="ns9-chart-empty-state">
        <p>Chưa có lịch sử đo và biểu đồ.</p>
      </div>
    );
  }

  const W = 680;
  const H = 195;
  const PAD_L = 42;
  const PAD_R = 20;
  const PAD_T = 22;
  const PAD_B = 30;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const targetVal = metricMode === 'score'
    ? safeTargetChem10
    : Math.round(950 + safeTargetChem10 * 85);

  const values = series.map((s) => (metricMode === 'score' ? s.score : s.elo)).filter(Number.isFinite);
  const allVals = (pinTarget ? [...values, targetVal] : values).filter(Number.isFinite);
  const safeVals = allVals.length ? allVals : (metricMode === 'score' ? [5.5, 8.5] : [1100, 1400]);

  const minVal = metricMode === 'score'
    ? Math.max(0, Math.floor(Math.min(...safeVals) - 1))
    : Math.max(900, Math.floor((Math.min(...safeVals) - 80) / 50) * 50);
  const maxVal = metricMode === 'score'
    ? Math.min(10, Math.ceil(Math.max(...safeVals) + 0.6))
    : Math.ceil((Math.max(...safeVals) + 80) / 50) * 50;

  const span = Math.max(1, maxVal - minVal);
  const xOf = (i) => PAD_L + (series.length <= 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
  const yOf = (v) => PAD_T + plotH - (((Number.isFinite(v) ? v : minVal) - minVal) / span) * plotH;

  const points = series.map((s, i) => ({
    ...s,
    x: xOf(i),
    y: yOf(metricMode === 'score' ? s.score : s.elo),
    val: metricMode === 'score' ? s.score : s.elo,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(PAD_T + plotH).toFixed(1)} L${points[0].x.toFixed(1)},${(PAD_T + plotH).toFixed(1)} Z`;

  const targetY = yOf(targetVal);
  const activePoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : points[points.length - 1];

  return (
    <div className="ns9-chart-block">
      <div className="ns9-chart-toolbar">
        <div className="ns9-chart-seg" role="tablist" aria-label="Chuyển đổi chỉ số biểu đồ">
          <button
            type="button"
            role="tab"
            aria-selected={metricMode === 'score'}
            className={metricMode === 'score' ? 'on' : ''}
            onClick={() => setMetricMode('score')}
          >
            Điểm {subjectShort} (Thang 10)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metricMode === 'elo'}
            className={metricMode === 'elo' ? 'on' : ''}
            onClick={() => setMetricMode('elo')}
          >
            Điểm năng lực (Elo)
          </button>
        </div>

        <div className="ns9-chart-controls">
          <div className="ns9-chart-seg sm" role="group" aria-label="Khoảng thời gian">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                className={rangeDays === d ? 'on' : ''}
                onClick={() => { setRangeDays(d); setHoverIdx(null); }}
              >
                {d} ngày
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`ns9-pin-btn ${pinTarget ? 'on' : ''}`}
            onClick={() => setPinTarget((v) => !v)}
            title="Ghim mốc mục tiêu trên biểu đồ"
          >
            <IcoPin />
            <span>Mốc mục tiêu ({metricMode === 'score' ? `${targetChem10}đ` : `${targetVal}`})</span>
          </button>
        </div>
      </div>

      <div className="ns9-svg-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="ns9-chart-svg"
          role="img"
          aria-label={`Biểu đồ tiến độ ${metricMode === 'score' ? 'Điểm dự đoán' : 'Điểm Elo'} trong ${rangeDays} ngày qua`}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="ns9AreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f6bff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2f6bff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Lưới ngang */}
          {[0, 0.5, 1].map((t, idx) => {
            const val = minVal + span * (1 - t);
            const y = PAD_T + plotH * t;
            return (
              <g key={idx}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} className="ns9-grid-line" />
                <text x={PAD_L - 8} y={y + 4} textAnchor="end" className="ns9-axis-txt">
                  {metricMode === 'score' ? val.toFixed(1) : Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Đường ghim mốc mục tiêu */}
          {pinTarget && targetY >= PAD_T && targetY <= PAD_T + plotH && (
            <g>
              <line
                x1={PAD_L}
                y1={targetY}
                x2={W - PAD_R}
                y2={targetY}
                className="ns9-target-line"
              />
              <text x={W - PAD_R - 4} y={targetY - 6} textAnchor="end" className="ns9-target-label">
                Mục tiêu {metricMode === 'score' ? `${targetChem10}đ` : `${targetVal} Elo`}
              </text>
            </g>
          )}

          {/* Vùng màu & Đường tiến độ */}
          <path d={areaPath} fill="url(#ns9AreaGrad)" />
          <path d={linePath} fill="none" stroke="#2f6bff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

          {/* Các điểm dữ liệu theo ngày */}
          {points.map((p, idx) => {
            const isHover = activePoint && activePoint.date === p.date;
            const showLabel = idx === 0 || idx === points.length - 1 || idx % Math.ceil(points.length / 5) === 0;
            return (
              <g
                key={p.date}
                className="ns9-pt-group"
                onMouseEnter={() => setHoverIdx(idx)}
                onClick={() => setHoverIdx(idx)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHover ? 5.5 : 3.5}
                  className={`ns9-pt ${isHover ? 'is-active' : ''}`}
                />
                <rect
                  x={p.x - plotW / Math.max(2, points.length * 2)}
                  y={PAD_T}
                  width={plotW / Math.max(1, points.length)}
                  height={plotH}
                  fill="transparent"
                />
                {showLabel && (
                  <text x={p.x} y={H - 8} textAnchor="middle" className="ns9-axis-txt">
                    {p.shortDate}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {activePoint && (
          <div className="ns9-chart-tooltip">
            <span>Ngày <b>{activePoint.shortDate}</b>:</span>
            <b>
              {metricMode === 'score'
                ? `${activePoint.score} / 10 điểm ${subjectShort}`
                : `${activePoint.elo} Elo`}
            </b>
            <span>({activePoint.count > 0 ? `Đã làm ${activePoint.count} câu` : 'Điểm duy trì'})</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AspirationRoadmapHub({
  uid,
  overview,
  chapters = [],
  dueTotal = 0,
  cardsDue = 0,
  events = [],
  now = Date.now(),
  hideTopBanner = false,
  hideQuickNavTrio = false,
  onOpenChapter,
  onPracticeChapter,
  onReviewChapter,
  onAiStrategy,
  onOpenDiagnostic,
  onTabSelect,
}) {
  const { user } = useAuth?.() || {};
  const [profile, setProfile] = useState(() => getUserProfile(uid, user));
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  const [aiComment, setAiComment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { subject } = useCurrentSubject?.() || { subject: 'all' };
  const subjectShort = subject === 'ly' ? 'Lí' : subject === 'sinh' ? 'Sinh' : subject === 'hoa' ? 'Hóa' : 'KHTN';

  useEffect(() => {
    setProfile(getUserProfile(uid, user));
  }, [uid, user, syncTick]);

  useEffect(() => subscribeAspirationChanges(() => {
    setSyncTick((n) => n + 1);
  }), []);

  const data = useMemo(
    () => buildAutoRoadmapData({
      uid,
      overview,
      chapters,
      events,
      dueTotal,
      cardsDue,
      now,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, overview, chapters, events, dueTotal, cardsDue, now, syncTick],
  );

  const tutorComment = useMemo(
    () => aiComment || localProgressCommentary(data),
    [aiComment, data],
  );

  const handleRefreshAiComment = async () => {
    setAiLoading(true);
    try {
      const res = await getProgressCommentaryWithAI(data);
      setAiComment(res);
    } finally {
      setAiLoading(false);
    }
  };

  const {
    activeExam,
    activeAsp,
    schedule,
    daysUntilExam,
    hasEvidence,
    predictedChem10,
    targetChem10,
    chemGap10,
    predictedExamScore,
    targetExamScore,
    examScale,
    elo,
    eloHistory,
    paceStatus,
    paceTone,
    paceAdvice,
    primaryAction,
  } = data;

  const handleUpdateFreeHours = (hours) => {
    saveScheduleConfig(uid, { weeklyFreeHours: hours });
    setSyncTick((n) => n + 1);
  };

  const handleUpdateExamDate = (dateStr) => {
    if (!dateStr) return;
    saveScheduleConfig(uid, { examDate: dateStr });
    setSyncTick((n) => n + 1);
  };

  const handlePrimaryAction = () => {
    if (!primaryAction) return;
    if (primaryAction.mode === 'review') {
      onReviewChapter?.(primaryAction.chapterId);
    } else if (primaryAction.chapterId) {
      onPracticeChapter?.(primaryAction.chapterId);
    } else if (chapters[0]?.chapter?.id) {
      onOpenChapter?.(chapters[0].chapter.id);
    }
  };

  const studentName = profile?.fullName || user?.displayName || 'Nguyễn Duy TK';
  const studentEmail = profile?.invoice?.invoiceEmail || user?.email || 'duyfamobo@gmail.com';

  const campusCover = useMemo(() => {
    return getUniversityCover(activeAsp?.school?.code);
  }, [activeAsp?.school?.code]);

  const cleanMajorName = activeAsp?.major?.name
    ? activeAsp.major.name.replace(/^ngành\s+/i, '')
    : '';

  const actionButtons = (
    <div className="ns9-banner-actions">
      {onOpenDiagnostic && (
        <button
          type="button"
          className="ns9-btn-ai"
          onClick={onOpenDiagnostic}
          title={`Làm 12 câu kiểm tra nhanh để đo chính xác Điểm ${subjectShort} dự đoán & Elo`}
        >
          <IcoBolt />
          <span>{hasEvidence ? 'Đo lại năng lực (12 câu)' : 'Test đầu vào (12 câu)'}</span>
        </button>
      )}
      <button
        type="button"
        className="ns9-btn-outline"
        onClick={() => setScheduleEditorOpen((v) => !v)}
      >
        <IcoClock />
        <span>{schedule.weeklyFreeHours}h/tuần · Còn {daysUntilExam} ngày</span>
      </button>
      <button
        type="button"
        className="ns9-btn-outline"
        onClick={() => setTutorModalOpen(true)}
      >
        <IcoTarget />
        <span>{activeAsp ? 'Đổi nguyện vọng' : 'Chọn nguyện vọng'}</span>
      </button>
      <button
        type="button"
        className="ns9-btn-ai"
        onClick={() => setAiModalOpen(true)}
        title="AI tự động phân tích cơ hội trúng tuyển & đưa ra lộ trình 3 giai đoạn theo đúng nguyện vọng"
      >
        <IcoSparkle />
        <span>AI Phân tích Lộ trình</span>
      </button>
    </div>
  );

  return (
    <section className="ns9-hub" aria-label="Bảng điều khiển Lộ trình của em">
      {/* ── 1. BANNER CÁ NHÂN & KHUÔN VIÊN TRƯỜNG ĐẠI HỌC (CHUẨN DASHBOARD ELEC AI) ── */}
      {!hideTopBanner && (
        <div className="ns9-banner-hero-card">
          <div className="ns9-bh-left">
            <div className="ns9-bh-user-row">
              <div className="ns9-bh-avatar" aria-hidden="true" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                <UserAvatar user={user} size={48} title={studentName} />
              </div>
              <div className="ns9-bh-user-meta">
                <h2 className="ns9-bh-user-name">{studentName}</h2>
                <span className="ns9-bh-user-email">{studentEmail}</span>
              </div>
            </div>

            <div className="ns9-bh-wish-pills">
              {activeAsp ? (
                <>
                  <div className="ns9-bh-pill school" title={activeAsp.school.name}>
                    <IcoGradCap />
                    <span>{activeAsp.school.code} · {activeAsp.school.name}</span>
                  </div>
                  <div className="ns9-bh-pill major" title={activeAsp.major?.name}>
                    <IcoMapPin />
                    <span>Ngành {cleanMajorName} (Tổ hợp {activeAsp.block})</span>
                  </div>
                </>
              ) : (
                <div className="ns9-bh-pill empty">
                  <IcoTarget />
                  <span>Chưa chọn trường mục tiêu — Hãy chọn để cá nhân hoá lộ trình</span>
                </div>
              )}
            </div>

            {actionButtons}
          </div>

          {/* Phía phải: Ảnh khuôn viên trường đại học thực tế */}
          {activeAsp && (
            <div className="ns9-bh-right-campus">
              <img
                src={campusCover}
                alt={`Khuôn viên ${activeAsp.school.name}`}
                className="ns9-bh-campus-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/img/universities/bka.webp';
                }}
              />
              <div className="ns9-bh-campus-badge">
                <span className="school-code">{activeAsp.school.code}</span>
                <span className="target-score">Mục tiêu: {Number.isFinite(targetExamScore) ? targetExamScore : (activeAsp.targetScore ?? 24.75)}đ</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Thanh chỉnh nhanh Thời gian rảnh mỗi tuần & Ngày thi (chỉ hỏi 1 lần hoặc mở khi bấm) */}
      {scheduleEditorOpen && (
        <div className="ns9-schedule-bar" role="region" aria-label="Thiết lập thời gian rảnh mỗi tuần và ngày thi">
          <div className="ns9-sched-group">
            <span>Thời gian bạn dành cho các môn KHTN mỗi tuần:</span>
            <div className="ns9-hour-pills">
              {[
                [3, '3 giờ/tuần (~25p/ngày)'],
                [4.5, '4.5 giờ/tuần (~40p/ngày)'],
                [6, '6 giờ/tuần (~50p/ngày)'],
                [8, '8 giờ/tuần (Cấp tốc)'],
              ].map(([h, label]) => (
                <button
                  key={h}
                  type="button"
                  className={schedule.weeklyFreeHours === h ? 'on' : ''}
                  onClick={() => handleUpdateFreeHours(h)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="ns9-sched-group">
            <label htmlFor="ns9-exam-date-input">Ngày thi dự kiến:</label>
            <input
              id="ns9-exam-date-input"
              type="date"
              value={schedule.examDate}
              onChange={(e) => handleUpdateExamDate(e.target.value)}
            />
            <button type="button" className="ns9-sched-done" onClick={() => setScheduleEditorOpen(false)}>
              Xong
            </button>
          </div>
        </div>
      )}

      {/* ── 2. THẺ "LỘ TRÌNH CỦA EM": 4 CHỈ SỐ TRÊN 1 HÀNG + BIỂU ĐỒ + 1 CTA CHÍNH ── */}
      <div className="ns9-roadmap-card">
        <div className="ns9-card-top">
          <div className="ns9-ct-left">
            <div className="ns9-ct-title-row">
              <h3>Lộ trình của em</h3>
              <span className="ns9-header-badge">{(activeExam?.name || 'THPTQG').replace(/^Thi\s+/i, '')}</span>
            </div>
            <p className="ns9-ct-sub">
              {activeAsp?.school?.code ? (
                <>— Đường đua tới <b>{activeAsp.school.code}</b> ({activeAsp.school.name})</>
              ) : (
                <>— Hãy chọn trường mục tiêu để bắt đầu lộ trình cá nhân hóa</>
              )}
            </p>
          </div>
          <div className="ns9-card-top-right">
            <button
              type="button"
              className="ns9-countdown-pill-btn"
              onClick={() => setScheduleEditorOpen((v) => !v)}
              title="Bấm để chỉnh ngày thi & giờ học tuần"
            >
              <IcoCalendar />
              <span>{`T5/${schedule.examDate ? new Date(schedule.examDate).getFullYear() : '2027'} · Còn ${Math.max(1, Math.round(daysUntilExam / 30))} tháng tới ngày thi`}</span>
              <IcoEdit />
            </button>
          </div>
        </div>

        {/* 4 CHỈ SỐ TRÊN MỘT HÀNG (CHUẨN 100% ELEC AI DASHBOARD) */}
        <div className="ns9-metrics-row">
          {/* 1. Điểm dự đoán */}
          <div className="ns9-metric-box">
            <div className="ns9-mb-head">
              <IcoBarChart />
              <span className="ns9-metric-label">Điểm dự đoán</span>
            </div>
            <div className="ns9-metric-value">
              {hasEvidence && Number.isFinite(predictedChem10) ? (
                <>
                  <strong>{predictedChem10}</strong>
                  <small>/ 10 điểm</small>
                </>
              ) : (
                <button
                  type="button"
                  className="ns9-mb-starter-btn"
                  onClick={onOpenDiagnostic}
                  title="Làm bài test 5 phút xác định điểm khởi đầu"
                >
                  <span className="ns9-mb-starter-val">Đo sau 1 bài test</span>
                  <span className="ns9-mb-starter-tag">Test 5p ↗</span>
                </button>
              )}
            </div>
            <span className="ns9-metric-sub">
              {hasEvidence && predictedExamScore !== null && Number.isFinite(predictedExamScore)
                ? `Quy đổi ${activeExam?.name || 'Kỳ thi'}: ${predictedExamScore}/${examScale || 30}`
                : 'Làm bài test ngắn để AI mở khoá đường điểm'}
            </span>
          </div>

          {/* 2. Mục tiêu */}
          <div className="ns9-metric-box">
            <div className="ns9-mb-head">
              <IcoTarget />
              <span className="ns9-metric-label">Mục tiêu</span>
            </div>
            <div className="ns9-metric-value target">
              {activeAsp ? (
                <>
                  <strong>{Number.isFinite(targetExamScore) ? targetExamScore : (activeAsp.targetScore ?? 26)}</strong>
                  <small>/ {examScale || 30}</small>
                </>
              ) : (
                <button
                  type="button"
                  className="ns9-mb-starter-btn"
                  onClick={() => onAiStrategy ? onAiStrategy() : setPortfolioModalOpen(true)}
                  title="Chọn trường Đại học mục tiêu"
                >
                  <span className="ns9-mb-starter-val">Chưa khóa mốc</span>
                  <span className="ns9-mb-starter-tag">Chọn ngay +</span>
                </button>
              )}
            </div>
            <span className="ns9-metric-sub">
              {activeAsp?.school?.code ? activeAsp.school.code : 'Ví dụ: BKA 24.75đ · FTU 27.5đ'}
            </span>
          </div>

          {/* 3. Tiến độ */}
          <div className="ns9-metric-box">
            <div className="ns9-mb-head">
              <IcoCheckCircle />
              <span className="ns9-metric-label">Tiến độ</span>
            </div>
            <div className="ns9-metric-value">
              {hasEvidence ? (
                <span className={`ns9-status-tag tone-${paceTone}`}>{paceStatus}</span>
              ) : (
                <span className="ns9-status-tag tone-neutral">Sẵn sàng xuất phát</span>
              )}
            </div>
            <span className="ns9-metric-sub">
              {hasEvidence ? 'So với lộ trình lý tưởng' : 'Lộ trình 7 ngày đầu cùng ELEC AI'}
            </span>
          </div>

          {/* 4. Elo hiện tại */}
          <div className="ns9-metric-box">
            <div className="ns9-mb-head">
              <div className="ns9-mb-head-left">
                <IcoTrending />
                <span className="ns9-metric-label">Elo hiện tại</span>
                <span className="ns9-mb-info-icon" title="Điểm Elo phản ánh năng lực thực chiến theo độ khó câu hỏi">
                  <IcoInfo />
                </span>
              </div>
              <button
                type="button"
                className="ns9-mb-radar-btn"
                onClick={() => setAiModalOpen(true)}
                title="Mở Radar Năng lực 6 Chiều"
              >
                Radar &rsaquo;
              </button>
            </div>
            <div className="ns9-metric-value elo">
              <strong>{hasEvidence && Number.isFinite(elo) ? elo : 1000}</strong>
              {!hasEvidence && <small className="ns9-mb-elo-starter">Khởi điểm</small>}
            </div>
            <span className="ns9-metric-sub">
              {hasEvidence && Number.isFinite(elo)
                ? (elo >= 1600 ? 'Hạng Bứt phá (8.5+)' : elo >= 1380 ? 'Hạng Khá vững (7.0+)' : 'Hạng Nền tảng')
                : 'Hạng Nền tảng · Tăng sau mỗi đề'}
            </span>
          </div>
        </div>

        {/* BIỂU ĐỒ ĐƯỜNG ĐIỂM DỰ ĐOÁN | ELO */}
        <InteractiveProgressChart
          eloHistory={eloHistory}
          predictedChem10={predictedChem10}
          targetChem10={targetChem10}
          elo={elo}
        />

        {/* NHẬN XÉT TIẾN ĐỘ TỪ GIA SƯ AI (CÓ KIỂM TRA SCHEMA + FALLBACK CỤC BỘ) */}
        <div className="ns9-ai-commentary" role="region" aria-label="Nhận xét tiến độ từ Gia sư AI">
          <div className="ns9-ai-comm-head">
            <span className="ns9-cta-badge">
              <IcoSparkle />
              <span>Gia sư ELEC AI nhận xét tiến độ</span>
            </span>
            <button
              type="button"
              className="ns9-pin-btn"
              onClick={handleRefreshAiComment}
              disabled={aiLoading}
            >
              {aiLoading ? 'Đang phân tích...' : '✦ Làm mới bằng AI'}
            </button>
          </div>
          <p className="ns9-ai-comm-headline">{tutorComment.headline}</p>
          <p className="ns9-ai-comm-next">{tutorComment.nextAction}</p>
        </div>

        {/* DÒNG GỢI Ý HÀNH ĐỘNG DUY NHẤT + NÚT "LUYỆN TẬP NGAY" */}
        {primaryAction && (
          <div className="ns9-primary-cta-bar">
            <div className="ns9-cta-info">
              <span className="ns9-cta-badge">
                <IcoBolt />
                <span>{!hasEvidence ? 'Bước khởi đầu đề xuất' : 'Đề xuất tiếp theo cho bạn'}</span>
              </span>
              <b>
                {!hasEvidence
                  ? 'Làm 12 câu Đánh giá năng lực đầu vào để mở khóa Điểm dự đoán & Elo'
                  : primaryAction.headline}
              </b>
              <small>{primaryAction.subline} · {paceAdvice}</small>
            </div>
            <div className="ns9-cta-btns-group">
              {!hasEvidence && onOpenDiagnostic && (
                <button
                  type="button"
                  className="ns9-primary-cta-btn"
                  onClick={onOpenDiagnostic}
                >
                  <IcoPlay />
                  <span>Đánh giá đầu vào (12 câu)</span>
                </button>
              )}
              <button
                type="button"
                className={!hasEvidence && onOpenDiagnostic ? 'ns9-btn-outline' : 'ns9-primary-cta-btn'}
                onClick={handlePrimaryAction}
              >
                <IcoPlay />
                <span>{primaryAction.buttonLabel}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. BA KHỐI ĐIỀU HƯỚNG NHANH + LINH VẬT ELEC AI (CHUẨN DASHBOARD) ── */}
      {!hideQuickNavTrio && (
        <div className="ns9-quick-nav-trio" role="region" aria-label="Lối tắt tính năng lộ trình">
          <div
            className="ns9-qn-card"
            onClick={() => (onTabSelect ? onTabSelect('subjects') : onOpenChapter?.(chapters[0]?.chapter?.id))}
            role="button"
            tabIndex={0}
          >
            <div className="ns9-qn-icon target">
              <IcoTarget />
            </div>
            <div className="ns9-qn-body">
              <h4>Lộ trình mục tiêu</h4>
              <p>Xem chi tiết các mốc, phân tích khoảng cách tới mục tiêu {activeAsp?.school?.code || 'Đại học'}.</p>
            </div>
            <span className="ns9-qn-link">Xem ngay &rarr;</span>
          </div>

          <div
            className="ns9-qn-card"
            onClick={() => (onTabSelect ? onTabSelect('timeline') : setScheduleEditorOpen(true))}
            role="button"
            tabIndex={0}
          >
            <div className="ns9-qn-icon calendar">
              <IcoCalendar />
            </div>
            <div className="ns9-qn-body">
              <h4>Lộ trình cá nhân hóa</h4>
              <p>Kế hoạch cá nhân hóa theo ngày, tuần, tháng bám sát quỹ thời gian {schedule.weeklyFreeHours}h/tuần.</p>
            </div>
            <span className="ns9-qn-link">Xem ngay &rarr;</span>
          </div>

          <div
            className="ns9-qn-card"
            onClick={() => (onTabSelect ? onTabSelect('study') : handlePrimaryAction())}
            role="button"
            tabIndex={0}
          >
            <div className="ns9-qn-icon ai">
              <IcoSparkle />
            </div>
            <div className="ns9-qn-body">
              <h4>Luyện tập ELEC AI</h4>
              <p>Phân tích điểm mạnh, điểm yếu và gợi ý cải thiện kiến thức chuyên sâu.</p>
            </div>
            <span className="ns9-qn-link">Luyện tập ngay &rarr;</span>
          </div>

          {/* Linh vật ELEC AI đứng trang trí thân thiện góc dưới */}
          <div className="ns9-mascot-companion" title="ELEC AI luôn sẵn sàng đồng hành cùng bạn!">
            <img
              src="/img/elec/elec-wink.png"
              alt="Linh vật ELEC AI"
              className="ns9-mascot-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/img/elec/elec-hello.png';
              }}
            />
          </div>
        </div>
      )}

      <ElecTutorOnboardingModal
        open={tutorModalOpen}
        uid={uid}
        onClose={() => setTutorModalOpen(false)}
        onCompleted={() => setSyncTick((n) => n + 1)}
        onStartDiagnostic={() => {
          setTutorModalOpen(false);
          onOpenDiagnostic?.();
        }}
      />

      <AspirationAiStrategyModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        uid={uid}
        activeAspiration={activeAsp}
        aspirations={data.aspirations || []}
        progress={data}
        schedule={schedule}
        chapters={chapters}
        dueByTopic={{}}
        overview={overview}
        events={events}
        predictedScore={predictedExamScore || (predictedChem10 ? predictedChem10 * (examScale / 10) : 24.5)}
        targetScore={activeAsp?.targetScore || 24.5}
        examScale={examScale || 30}
        onAskAiTutor={onAiStrategy ? (prompt) => onAiStrategy({ ...data, customPrompt: prompt }) : null}
        onStrategyApplied={() => setSyncTick((n) => n + 1)}
      />

      <AspirationPortfolioModal
        isOpen={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        aspirations={data.aspirations || []}
        predictedScore={predictedExamScore || (predictedChem10 ? predictedChem10 * (examScale / 10) : 24.5)}
        examScale={examScale || 30}
      />
    </section>
  );
}
