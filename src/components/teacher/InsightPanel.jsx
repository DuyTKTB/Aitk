/* ============================================================
   InsightPanel.jsx — Panel Phân Tích Sư Phạm ELEC AI (GDPT 2018)
   Ảnh 1 (Dark Bento) + Ảnh 3 (Glass pastel, HexStat, Sparkline, KDE curve)
   ============================================================ */

import { useState, useEffect, useMemo } from 'react';
import { generatePedagogicalInsights } from '../../lib/insightAi.js';
import {
  BentoCard,
  Chip,
  HexStat,
  Sparkline,
  Orb,
  Skeleton,
} from './ui/index.js';

const Svg = ({ size = 18, sw = 2, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoSparkles = (p) => (
  <Svg {...p}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </Svg>
);

const IcoRefresh = (p) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </Svg>
);

const IcoCheck = (p) => (
  <Svg {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);

const IcoAlertCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

const IcoArrowRight = (p) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Svg>
);

const IcoClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Svg>
);

export default function InsightPanel({
  insightsData,
  className = 'Lớp học',
  subject = 'Hóa học',
  onOpenAiStudio,
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [copiedActionIdx, setCopiedActionIdx] = useState(null);

  const loadInsights = async (force = false) => {
    setLoading(true);
    try {
      const res = await generatePedagogicalInsights({
        insightsData,
        className,
        subject,
        forceRefresh: force,
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights(false);
  }, [insightsData, className, subject]);

  // Phổ điểm thực tế theo 5 dải điểm: 0-2, 2-4, 4-6, 6-8, 8-10 (nếu chưa có bài nộp thì hiển thị đường chuẩn tham khảo)
  const scoreBuckets = useMemo(() => {
    const bins = Array.isArray(insightsData?.scoreBins) ? insightsData.scoreBins : null;
    const total = bins ? bins.reduce((a, b) => a + b, 0) : 0;
    if (bins && total > 0) {
      return bins.map((cnt) => Math.round((cnt / total) * 100));
    }
    const base = [
      Math.max(2, Math.round((100 - (insightsData?.avgPct || 50)) * 0.1)),
      Math.max(4, Math.round((insightsData?.atRisk?.length || 2) * 1.5)),
      Math.max(8, Math.round(((insightsData?.submissionCount || 10) * 0.35))),
      Math.max(12, Math.round(((insightsData?.avgPct || 50) * 0.3))),
      Math.max(5, Math.round((insightsData?.passRate || 50) * 0.18)),
    ];
    const maxVal = Math.max(...base, 1);
    return base.map((val) => Math.round((val / maxVal) * 100));
  }, [insightsData]);

  const handleCreateRemedialExam = () => {
    if (onOpenAiStudio && data?.suggestedRemedialPlan) {
      onOpenAiStudio({
        title: data.suggestedRemedialPlan.title,
        topics: data.suggestedRemedialPlan.topics,
        count: data.suggestedRemedialPlan.questionCount || 10,
        hint: `Tập trung củng cố học sinh lớp ${className}. Trọng tâm: ${data.suggestedRemedialPlan.topics?.join(', ')}. Tỷ lệ: ${data.suggestedRemedialPlan.difficultyRatio}.`,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Banner AI Hero Header (Lấy cảm hứng từ Ảnh 2 & 3) */}
      <BentoCard
        style={{
          background: 'linear-gradient(135deg, var(--t-surface-1) 0%, rgba(91, 108, 255, 0.08) 100%)',
          border: '1px solid var(--t-border-strong)',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0, flex: 1 }}>
            <Orb size={54} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--t-accent)',
                    background: 'var(--t-accent-subtle)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--t-r-pill)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <IcoSparkles size={12} /> ELEC AI Pedagogical Insight
                </span>
                {data?.isAiGenerated ? (
                  <Chip tone="lime" size="sm">Gemini GDPT 2018</Chip>
                ) : (
                  <Chip tone="default" size="sm">Thuật toán quy nạp</Chip>
                )}
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '380px', marginTop: '0.5rem' }}>
                  <Skeleton width="90%" height="22px" />
                  <Skeleton width="65%" height="15px" />
                </div>
              ) : (
                <>
                  <h2 style={{ margin: 0, fontSize: '1.28rem', fontWeight: 800, color: 'var(--t-ink)', letterSpacing: '-0.02em' }}>
                    {data?.headline || `Báo Cáo Sư Phạm Lớp ${className}`}
                  </h2>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.86rem', color: 'var(--t-ink-2)', lineHeight: 1.55, maxWidth: '820px' }}>
                    {data?.summary}
                  </p>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => loadInsights(true)}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--t-r-pill)',
                background: 'var(--t-surface-2)',
                color: 'var(--t-ink)',
                border: '1px solid var(--t-border)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <IcoRefresh size={14} className={loading ? 'vt-blink' : ''} />
              {loading ? 'Đang phân tích…' : 'Phân tích lại cùng AI'}
            </button>
          </div>
        </div>
      </BentoCard>

      {/* Grid 4 thẻ Bento Chi Tiết */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Thẻ 1: Phổ điểm & Năng lực (Ảnh 3: Đường cong KDE + HexStats) */}
        <BentoCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--t-ink)' }}>
                Phổ điểm & Xu hướng
              </h3>
              <small style={{ color: 'var(--t-ink-muted)', fontSize: '0.76rem' }}>
                Phân bố điểm số theo thang điểm 10.0
              </small>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--t-accent)' }}>
              ĐTB: {(insightsData?.avgPct ? (insightsData.avgPct / 10).toFixed(1) : '—')}/10
            </span>
          </div>

          {/* Biểu đồ cột phổ điểm mượt mà */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '110px', padding: '0.5rem 0.5rem 0', gap: '0.6rem', borderBottom: '1px solid var(--t-border-subtle)' }}>
            {scoreBuckets.map((pct, idx) => {
              const ranges = ['0–2', '2–4', '4–6', '6–8', '8–10'];
              const isPassing = idx >= 2;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--t-ink-muted)', marginBottom: '0.25rem' }}>
                    {pct}%
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${Math.max(12, pct)}%`,
                      borderRadius: '8px 8px 3px 3px',
                      background: isPassing
                        ? 'linear-gradient(180deg, var(--t-accent) 0%, rgba(200, 245, 66, 0.45) 100%)'
                        : 'linear-gradient(180deg, var(--t-status-err) 0%, rgba(239, 68, 68, 0.45) 100%)',
                      transition: 'height 0.6s var(--t-ease-smooth)',
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--t-ink-muted)', marginTop: '0.45rem' }}>
                    {ranges[idx]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 3 Viên sỏi HexStat (Ảnh 3) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginTop: '1.25rem' }}>
            <HexStat
              value={`${insightsData?.avgPct ?? 0}%`}
              label="Điểm TB Lớp"
            />
            <HexStat
              value={`${insightsData?.passRate ?? 0}%`}
              label="Tỷ Lệ Đạt"
            />
            <HexStat
              value={`${(insightsData?.atRisk || []).length} HS`}
              label="Cần Kèm Gấp"
            />
          </div>
        </BentoCard>

        {/* Thẻ 2: Nguyên nhân cốt lõi học sinh mắc lỗi (Causes) */}
        <BentoCard>
          <div style={{ marginBottom: '1.1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--t-ink)' }}>
              Nguyên nhân gốc rễ học sinh sai
            </h3>
            <small style={{ color: 'var(--t-ink-muted)', fontSize: '0.76rem' }}>
              Phân tích các lỗ hổng nhận thức và bẫy đề thi
            </small>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Skeleton height="56px" />
              <Skeleton height="56px" />
              <Skeleton height="56px" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(data?.causes || []).map((item, idx) => {
                const isHigh = item.severity === 'high';
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--t-r-md)',
                      background: 'var(--t-surface-2)',
                      border: '1px solid var(--t-border)',
                      borderLeft: `4px solid ${isHigh ? 'var(--t-status-err)' : 'var(--t-status-warn)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--t-ink)' }}>
                        {item.topic}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: 999,
                          background: isHigh ? 'var(--t-status-err-subtle)' : 'var(--t-status-warn-subtle)',
                          color: isHigh ? 'var(--t-status-err)' : 'var(--t-status-warn)',
                        }}
                      >
                        {isHigh ? 'Cần can thiệp' : 'Cần lưu ý'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--t-ink-2)', lineHeight: 1.45 }}>
                      {item.cause}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>

        {/* Thẻ 3: Giải pháp hành động cho thầy cô (Actions) */}
        <BentoCard>
          <div style={{ marginBottom: '1.1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--t-ink)' }}>
              Việc giáo viên nên làm cụ thể
            </h3>
            <small style={{ color: 'var(--t-ink-muted)', fontSize: '0.76rem' }}>
              Các biện pháp sư phạm khắc phục ngay trong tuần
            </small>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Skeleton height="60px" />
              <Skeleton height="60px" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(data?.actions || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--t-r-md)',
                    background: 'var(--t-surface-2)',
                    border: '1px solid var(--t-border)',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--t-accent-subtle)',
                      color: 'var(--t-accent)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 0.35rem', fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-ink)', lineHeight: 1.4 }}>
                      {item.action}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--t-ink-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <IcoAlertCircle size={12} /> {item.target}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--t-accent)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <IcoClock size={12} /> {item.timeframe}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BentoCard>

        {/* Thẻ 4: Tiết Dạy Tới & Tạo Đề Ôn Ngay (Action Hub) */}
        <BentoCard tone="lime">
          <div style={{ marginBottom: '1.1rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t-accent-ink)' }}>
              Kế hoạch tiết dạy tới
            </span>
            <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.12rem', fontWeight: 800, color: 'var(--t-accent-ink)' }}>
              {data?.nextLessonPlan?.focus || 'Ôn tập 10 phút đầu giờ'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(14, 14, 16, 0.08)', padding: '0.75rem 0.95rem', borderRadius: 'var(--t-r-md)' }}>
              <strong style={{ fontSize: '0.8rem', color: 'var(--t-accent-ink)', display: 'block', marginBottom: '0.2rem' }}>
                Hoạt động khởi động:
              </strong>
              <span style={{ fontSize: '0.82rem', color: 'rgba(14, 14, 16, 0.85)' }}>
                {data?.nextLessonPlan?.quickActivity || 'Mini-quiz 3 câu phân loại nhanh'}
              </span>
            </div>

            <div style={{ background: 'rgba(14, 14, 16, 0.08)', padding: '0.75rem 0.95rem', borderRadius: 'var(--t-r-md)' }}>
              <strong style={{ fontSize: '0.8rem', color: 'var(--t-accent-ink)', display: 'block', marginBottom: '0.2rem' }}>
                Dạng bài then chốt:
              </strong>
              <span style={{ fontSize: '0.82rem', color: 'rgba(14, 14, 16, 0.85)' }}>
                {data?.nextLessonPlan?.keyQuestionType || 'Dạng câu hỏi lý thuyết vận dụng'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid rgba(14, 14, 16, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(14, 14, 16, 0.8)' }}>
                Đề xuất: {data?.suggestedRemedialPlan?.questionCount || 10} câu ôn bù hổng
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(14, 14, 16, 0.7)' }}>
                {data?.suggestedRemedialPlan?.difficultyRatio || '60% NB-TH, 40% VD'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCreateRemedialExam}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--t-r-pill)',
                background: 'var(--t-accent-ink)',
                color: 'var(--t-accent)',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                transition: 'transform 0.15s ease',
              }}
            >
              <IcoSparkles size={16} /> Tạo đề ôn này cùng AI Studio <IcoArrowRight size={16} />
            </button>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
