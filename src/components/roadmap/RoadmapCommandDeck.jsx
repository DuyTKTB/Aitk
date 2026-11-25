/* ============================================================
   RoadmapCommandDeck.jsx — BÀN ĐIỀU KHIỂN THỦ KHOA (3-GIÂY HIỂU NGAY)
   ------------------------------------------------------------
   Thay thế 5 tầng điều hướng rối mắt bằng 1 Command Deck siêu gọn:
     • Trái: Nguyện vọng 1 + Tổ hợp xét tuyển + Đếm ngược ngày thi
       + Điểm dự đoán THPT 2025–2026 tách rõ 3 phần (Phần I · II · III)
     • Phải: Thẻ "Nhiệm vụ hôm nay" duy nhất (1 nút CTA chạy ngay)
       + Gợi ý Adaptive Detour nếu phát hiện lỗ hổng gốc
       + Nút mở biểu đồ phân tích sâu & Đánh giá năng lực
   ============================================================ */

import { formatMathAndChemSymbols } from '../../lib/chemFormulaFormatter.js';

const SvgIcon = ({ size = 15, className = '', children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

const IcoTarget = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </SvgIcon>
);

const IcoPlay = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
  </SvgIcon>
);

const IcoShieldCheck = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <path d="M12 3 4.5 6.2v5.4c0 4.7 3.2 8.2 7.5 9.6 4.3-1.4 7.5-4.9 7.5-9.6V6.2z" />
    <path d="m9 12.2 2 2 4-4.2" />
  </SvgIcon>
);

const IcoChart = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <path d="M3 3v18h18" />
    <path d="m7 14 4-4 3 3 5-6" />
  </SvgIcon>
);

const IcoClock = ({ size = 13 }) => (
  <SvgIcon size={size}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15.5 14" />
  </SvgIcon>
);

const IcoDetour = ({ size = 13 }) => (
  <SvgIcon size={size}>
    <path d="M9 14 4 9l5-5" />
    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </SvgIcon>
);

export default function RoadmapCommandDeck({
  autoRoadmap,
  subjectMeta,
  masteredCount = 0,
  totalCount = 0,
  dueTotal = 0,
  showHubOverview = false,
  onToggleHubOverview,
  onStartMission,
  onJumpDetour,
  onOpenDiagnostic,
}) {
  const weighted = autoRoadmap?.weightedExam || {
    hasEvidence: false,
    total10: 5.5,
    part1: 2.75,
    part2: 2.0,
    part3: 0.75,
  };
  const asp = autoRoadmap?.activeAsp;
  const target10 = autoRoadmap?.targetSubject10 ?? 8.5;
  const predicted10 = autoRoadmap?.predictedSubject10 ?? weighted.total10;
  const gap10 = autoRoadmap?.subjectGap10 ?? Math.max(0, Math.round((target10 - predicted10) * 100) / 100);
  const primary = autoRoadmap?.primaryAction;
  const detour = autoRoadmap?.primaryDetour;

  const p1Pct = Math.round((weighted.part1 / 4.5) * 100);
  const p2Pct = Math.round((weighted.part2 / 4.0) * 100);
  const p3Pct = Math.round((weighted.part3 / 1.5) * 100);
  const completionPct = totalCount ? Math.round((masteredCount / totalCount) * 100) : 0;

  return (
    <section className="rm-pro-deck" aria-label="Bàn điều khiển lộ trình học tập">
      {/* Cột trái: Nguyện vọng + Điểm dự đoán 3 phần đề 2025-2026 */}
      <div className="rm-pro-deck-left">
        <div className="rm-pro-deck-eyebrow">
          <span className="rm-pro-asp-pill">
            <IcoTarget size={13} />
            <span>
              {asp
                ? `${asp.school?.code || 'NV1'} · ${asp.major?.name || 'Mục tiêu ĐH'} (${asp.block || 'KHTN'})`
                : `Lộ trình ${subjectMeta?.name || 'KHTN'} · Chuẩn GDPT 2018`}
            </span>
          </span>
          <span className="rm-pro-countdown">
            <IcoClock size={12} />
            <span>Còn {autoRoadmap?.daysUntilExam || 120} ngày tới kỳ thi THPT</span>
          </span>
        </div>

        <div className="rm-pro-score-row">
          <div className="rm-pro-score-main">
            <div className="rm-pro-score-num">
              <strong>{weighted.hasEvidence ? predicted10.toFixed(2) : '—'}</strong>
              <span>/ 10đ {subjectMeta?.shortName || 'KHTN'}</span>
            </div>
            <div className="rm-pro-score-sub">
              <span>Mục tiêu: <b>{target10}đ</b></span>
              <i className="rm-pro-dot" aria-hidden="true" />
              <span className={`rm-pro-pace tone-${autoRoadmap?.paceTone || 'muted'}`}>
                {autoRoadmap?.paceStatus || 'Chưa đo điểm'}
                {weighted.hasEvidence && gap10 > 0 ? ` (−${gap10}đ)` : ''}
              </span>
              <i className="rm-pro-dot" aria-hidden="true" />
              <span><b>{masteredCount}/{totalCount}</b> chuyên đề vững ({completionPct}%)</span>
            </div>
            <div className="rm-pro-deck-tools">
              <button
                type="button"
                className={`rm-pro-ghost-btn ${showHubOverview ? 'is-on' : ''}`}
                onClick={onToggleHubOverview}
                title="Mở biểu đồ tiến bộ Điểm / Elo và quản lý Nguyện vọng"
              >
                <IcoChart size={14} />
                <span>{showHubOverview ? 'Ẩn biểu đồ' : 'Biểu đồ & NV'}</span>
              </button>
              <button
                type="button"
                className="rm-pro-ghost-btn"
                onClick={onOpenDiagnostic}
                title="Làm bài đánh giá năng lực 12 câu để hiệu chỉnh lộ trình"
              >
                <IcoShieldCheck size={14} />
                <span>Đo năng lực</span>
              </button>
            </div>
          </div>

          <div className="rm-pro-deck-mascot" aria-hidden="true">
            <img
              src={
                completionPct >= 65
                  ? '/img/elec/elec-celebrate.png'
                  : weighted.hasEvidence && gap10 > 2
                    ? '/img/elec/elec-super-saiyan.png'
                    : '/img/elec/elec-cool.png'
              }
              alt="Bé Elec đồng hành lộ trình"
              draggable={false}
            />
          </div>
        </div>

        {/* Phân rã 3 Phần chuẩn đề thi Bộ GD&ĐT 2025-2026 */}
        <div className="rm-pro-parts-grid" aria-label="Dự báo điểm theo 3 phần đề thi THPT 2025-2026">
          <div className="rm-pro-part-chip">
            <div className="rm-pro-part-head">
              <span>Phần I · 4 chọn 1</span>
              <b>{weighted.hasEvidence ? `${weighted.part1.toFixed(2)}` : '—'} / 4.5đ</b>
            </div>
            <div className="rm-pro-part-bar">
              <i className="p1" style={{ width: `${weighted.hasEvidence ? Math.max(6, p1Pct) : 0}%` }} />
            </div>
          </div>

          <div className="rm-pro-part-chip">
            <div className="rm-pro-part-head">
              <span>Phần II · Đúng/Sai</span>
              <b>{weighted.hasEvidence ? `${weighted.part2.toFixed(2)}` : '—'} / 4.0đ</b>
            </div>
            <div className="rm-pro-part-bar">
              <i className="p2" style={{ width: `${weighted.hasEvidence ? Math.max(6, p2Pct) : 0}%` }} />
            </div>
          </div>

          <div className="rm-pro-part-chip">
            <div className="rm-pro-part-head">
              <span>Phần III · Điền số</span>
              <b>{weighted.hasEvidence ? `${weighted.part3.toFixed(2)}` : '—'} / 1.5đ</b>
            </div>
            <div className="rm-pro-part-bar">
              <i className="p3" style={{ width: `${weighted.hasEvidence ? Math.max(6, p3Pct) : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải: Thẻ Nhiệm vụ hôm nay duy nhất (1-Click CTA + Bé Elec cổ vũ) */}
      <div className="rm-pro-mission-card">
        <img
          src={dueTotal > 0 || detour ? '/img/elec/elec-fighting.png' : '/img/elec/elec-hello.png'}
          alt=""
          className="rm-pro-mission-mascot"
          aria-hidden="true"
        />
        <div className="rm-pro-mission-top">
          <span className="rm-pro-mission-kicker">NHIỆM VỤ ƯU TIÊN HÔM NAY</span>
          {dueTotal > 0 && (
            <span className="rm-pro-due-pill">{dueTotal} câu đến hạn ôn</span>
          )}
        </div>

        <h2 className="rm-pro-mission-title">
          {primary
            ? formatMathAndChemSymbols(primary.chapterName)
            : `Khởi động lộ trình ${subjectMeta?.name || 'KHTN'}`}
        </h2>

        <p className="rm-pro-mission-sub">
          {primary
            ? formatMathAndChemSymbols(primary.subline)
            : 'Làm bài đánh giá nhanh 12 câu để hệ thống mở khóa điểm dự đoán và lộ trình riêng.'}
        </p>

        {detour && (
          <button
            type="button"
            className="rm-pro-detour-pill"
            onClick={() => onJumpDetour?.(detour.rootId)}
            title={detour.reason}
          >
            <img src="/img/elec/elec-think.png" alt="" className="rm-pro-mini-sticker" aria-hidden="true" />
            <IcoDetour size={13} />
            <span>
              Gốc cần vá trước: <b>{formatMathAndChemSymbols(detour.rootName)}</b> (Lớp {detour.rootGrade})
            </span>
          </button>
        )}

        <div className="rm-pro-mission-actions">
          <button
            type="button"
            className="rm-pro-cta-primary"
            onClick={() => {
              if (primary?.chapterId) {
                onStartMission?.(primary.chapterId, primary.mode || 'fresh');
              } else {
                onOpenDiagnostic?.();
              }
            }}
          >
            <IcoPlay size={13} />
            <span>{primary?.buttonLabel || 'Bắt đầu ngay'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
