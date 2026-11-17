import { TEACHER_VIP_PRICE_TEXT, TEACHER_VIP_HIGHLIGHTS } from '../../lib/entitlements.js';

const Svg = ({ size = 18, children }) => (
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
  >
    {children}
  </svg>
);

const IcoCrown = (p) => (
  <Svg {...p}>
    <path d="M2 18h20l-2-10-5 4-3-6-3 6-5-4-2 10z" />
    <line x1="2" y1="21" x2="22" y2="21" />
  </Svg>
);

const IcoLock = (p) => (
  <Svg {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const IcoCheck = (p) => (
  <Svg {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);

function defaultUpgradeNav() {
  if (typeof window !== 'undefined') {
    window.location.hash = 'profile?tab=vip';
  }
}

export default function TeacherVipLock({
  title = 'Tính năng dành riêng cho Giáo viên VIP',
  description = 'Nâng cấp gói Giáo viên VIP để mở khóa toàn bộ công cụ giảng dạy thông minh, AI soạn đề, OMR không giới hạn và giám sát phòng thi.',
  quotaText = '',
  highlights = null,
  onUpgrade = null,
  compact = false,
  actionLabel = '',
}) {
  const handleUpgrade = onUpgrade || defaultUpgradeNav;
  const list = Array.isArray(highlights) && highlights.length ? highlights : TEACHER_VIP_HIGHLIGHTS.slice(0, 4);
  const btnText = actionLabel || `Nâng cấp Giáo viên VIP — ${TEACHER_VIP_PRICE_TEXT}/tháng`;

  if (compact) {
    return (
      <div
        role="region"
        aria-label={title}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.05rem',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(59,130,246,0.08))',
          border: '1.5px solid rgba(245,158,11,0.38)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: '1 1 260px' }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              color: '#fff',
            }}
          >
            <IcoLock size={16} />
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--t-ink, #0f172a)' }}>
              {title}
              {quotaText ? (
                <span
                  style={{
                    marginLeft: 8,
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(239,68,68,0.14)',
                    color: 'var(--t-bad, #dc2626)',
                  }}
                >
                  {quotaText}
                </span>
              ) : null}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--t-ink-2, #475569)', lineHeight: 1.45 }}>
              {description}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleUpgrade}
          className="vt-btn sm primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            border: 'none',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          <IcoCrown size={14} /> {btnText}
        </button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={title}
      style={{
        maxWidth: 680,
        margin: '1.5rem auto',
        padding: '1.6rem 1.5rem',
        borderRadius: 20,
        background: 'var(--t-surface-0, var(--surface, #ffffff))',
        border: '1.5px solid rgba(245, 158, 11, 0.35)',
        boxShadow: 'var(--t-shadow-sm, 0 14px 36px rgba(15, 23, 42, 0.08))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 6px 16px rgba(245, 158, 11, 0.3)',
          }}
        >
          <IcoCrown size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.03em',
                background: 'rgba(245,158,11,0.16)',
                color: 'var(--t-warn, #b45309)',
              }}
            >
              GIÁO VIÊN VIP · {TEACHER_VIP_PRICE_TEXT}/THÁNG
            </span>
            {quotaText ? (
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(239,68,68,0.12)',
                  color: 'var(--t-bad, #dc2626)',
                }}
              >
                {quotaText}
              </span>
            ) : null}
          </div>
          <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.12rem', fontWeight: 800, color: 'var(--t-ink, #0f172a)' }}>
            {title}
          </h3>
        </div>
      </div>

      <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--t-ink-2, #475569)' }}>
        {description}
      </p>

      <div
        style={{
          display: 'grid',
          gap: '0.45rem',
          padding: '0.9rem 1rem',
          borderRadius: 14,
          background: 'var(--t-surface-2, var(--soft, #f8fafc))',
          border: '1px solid var(--t-border, rgba(148,163,184,0.2))',
          marginBottom: '1.1rem',
        }}
      >
        {list.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: 'var(--t-ink, #1e293b)',
              lineHeight: 1.45,
            }}
          >
            <span style={{ color: 'var(--t-ok, #16a34a)', marginTop: 2, flexShrink: 0 }}>
              <IcoCheck size={14} />
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--t-ink-2, var(--t-ink-muted, #64748b))' }}>
          Chỉ <strong style={{ color: 'var(--t-warn, #d97706)', fontSize: '0.96rem' }}>{TEACHER_VIP_PRICE_TEXT}</strong> / 1 tháng · Kích hoạt ngay lập tức
        </div>
        <button
          type="button"
          onClick={handleUpgrade}
          className="vt-btn primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0.62rem 1.25rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            border: 'none',
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.28)',
          }}
        >
          <IcoCrown size={16} /> {btnText}
        </button>
      </div>
    </div>
  );
}
