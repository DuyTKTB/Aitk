/* ============================================================
   AspirationRoadmapHub.jsx — THẺ "LỘ TRÌNH CỦA EM" & BIỂU ĐỒ ĐIỂM/ELO
   (Chuẩn tinh thần 9Study — Gọn gàng, thực tế, dễ hiểu ngay trong 5 giây)
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

/* ── Bộ biểu tượng SVG sắc nét ── */
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

/* ── Biểu đồ đường SVG tương tác (Điểm dự đoán | Elo, Zoom 7/14/30 ngày, Ghim mốc) ── */
function InteractiveProgressChart({
  eloHistory = [],
  predictedChem10 = 5.5,
  targetChem10 = 8.5,
  elo = 1200,
}) {
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
      // Quy đổi Elo sang điểm Hóa thang 10 mượt mà
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

  if (!series.length) return null;

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
            Điểm Hóa (Thang 10)
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
                ? `${activePoint.score} / 10 điểm Hóa`
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
  onOpenChapter,
  onPracticeChapter,
  onReviewChapter,
  onAiStrategy,
  onOpenDiagnostic,
}) {
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  const [aiComment, setAiComment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

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
          title="Làm 12 câu kiểm tra nhanh để đo chính xác Điểm Hóa dự đoán & Elo"
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
      {onAiStrategy && (
        <button
          type="button"
          className="ns9-btn-ai"
          onClick={() => onAiStrategy(data)}
        >
          <IcoSparkle />
          <span>AI Tư vấn</span>
        </button>
      )}
    </div>
  );

  return (
    <section className="ns9-hub" aria-label="Bảng điều khiển Lộ trình của em">
      {/* ── 1. BANNER CÁ NHÂN & CHIP NGUYỆN VỌNG ĐANG CHỌN (NHƯ ẢNH 9 & 10) ── */}
      {!hideTopBanner && (
        <div className="ns9-banner">
          <div className="ns9-banner-left">
            <span className="ns9-eyebrow">MỤC TIÊU ĐẠI HỌC ĐANG THEO ĐUỔI</span>
            {activeAsp ? (
              <div className="ns9-wish-pill-bar">
                <span className="ns9-wish-badge">NV{activeAsp.priority}</span>
                <h2 className="ns9-wish-headline">
                  <b>{activeAsp.school.code}</b>
                  <span> · {activeAsp.school.name}</span>
                  <em> — Ngành {cleanMajorName}</em>
                </h2>
                <span className="ns9-block-tag">Tổ hợp {activeAsp.block}</span>
              </div>
            ) : (
              <div className="ns9-wish-pill-bar">
                <h2 className="ns9-wish-headline">
                  <b>Chưa chọn trường Nguyện vọng 1</b>
                  <span> — Hãy chọn trường để cá nhân hóa mốc điểm Hóa cần đạt</span>
                </h2>
              </div>
            )}
          </div>

          {actionButtons}
        </div>
      )}

      {/* Thanh chỉnh nhanh Thời gian rảnh mỗi tuần & Ngày thi (chỉ hỏi 1 lần hoặc mở khi bấm) */}
      {scheduleEditorOpen && (
        <div className="ns9-schedule-bar" role="region" aria-label="Thiết lập thời gian rảnh mỗi tuần và ngày thi">
          <div className="ns9-sched-group">
            <span>Thời gian bạn dành cho môn Hóa mỗi tuần:</span>
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
          <div>
            <h3>Lộ trình của em</h3>
            <p>
              Kỳ thi <b>{activeExam.name}</b> · Quy đổi thực tế từ độ chính xác và tốc độ làm bài môn Hóa
            </p>
          </div>
          <div className="ns9-card-top-right">
            {hideTopBanner && actionButtons}
            <span className={`ns9-pace-pill tone-${paceTone}`}>
              {paceStatus}
            </span>
          </div>
        </div>

        {/* 4 CHỈ SỐ TRÊN MỘT HÀNG (NHƯ ẢNH 9 & 10 CỦA 9STUDY) */}
        <div className="ns9-metrics-row">
          <div className="ns9-metric-box">
            <span className="ns9-metric-label">Điểm Hóa dự đoán</span>
            <div className="ns9-metric-value">
              <strong>{hasEvidence && Number.isFinite(predictedChem10) ? predictedChem10 : '—'}</strong>
              <small>/ 10 điểm</small>
            </div>
            <span className="ns9-metric-sub">
              {hasEvidence && predictedExamScore !== null && Number.isFinite(predictedExamScore)
                ? `Quy đổi ${activeExam?.name || 'Kỳ thi'}: ${predictedExamScore}/${examScale || 30}`
                : 'Làm 10 câu đầu tiên để mở khóa'}
            </span>
          </div>

          <div className="ns9-metric-box">
            <span className="ns9-metric-label">Điểm mục tiêu</span>
            <div className="ns9-metric-value target">
              <strong>{Number.isFinite(targetChem10) ? targetChem10 : 8.5}</strong>
              <small>/ 10 điểm</small>
            </div>
            <span className="ns9-metric-sub">
              Tổng kỳ thi: <b>{Number.isFinite(targetExamScore) ? targetExamScore : (activeAsp?.targetScore ?? 24.5)}/{examScale || 30}</b> {activeAsp?.school?.code ? `(${activeAsp.school.code})` : ''}
            </span>
          </div>

          <div className="ns9-metric-box">
            <span className="ns9-metric-label">Tiến độ hiện tại</span>
            <div className="ns9-metric-value">
              <span className={`ns9-status-tag tone-${paceTone}`}>{paceStatus}</span>
            </div>
            <span className="ns9-metric-sub">
              {!hasEvidence || !Number.isFinite(chemGap10)
                ? `Mục tiêu cần đạt: ${Number.isFinite(targetChem10) ? targetChem10 : 8.5}/10đ`
                : chemGap10 > 0
                  ? `Cần tăng thêm +${chemGap10} điểm Hóa`
                  : `Đã vượt mục tiêu +${Math.abs(chemGap10)} điểm Hóa`}
            </span>
          </div>

          <div className="ns9-metric-box">
            <span className="ns9-metric-label">Điểm năng lực (Elo)</span>
            <div className="ns9-metric-value elo">
              <strong>{Number.isFinite(elo) ? elo : 1000}</strong>
              <small>Elo</small>
            </div>
            <span className="ns9-metric-sub">
              {(Number.isFinite(elo) ? elo : 1000) >= 1600
                ? 'Hạng Bứt phá (8.5+)'
                : (Number.isFinite(elo) ? elo : 1000) >= 1380
                  ? 'Hạng Khá vững (7.0+)'
                  : 'Hạng Nền tảng · Đang tích lũy'}
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

      <ElecTutorOnboardingModal
        open={tutorModalOpen}
        uid={uid}
        onClose={() => setTutorModalOpen(false)}
        onCompleted={() => setSyncTick((n) => n + 1)}
      />
    </section>
  );
}
