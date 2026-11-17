import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/subscription-tiers.css';

/* ============================================================
   SVG ICONS THUẦN — 100% SVG, ZERO EMOJIS
   ============================================================ */
function SvgCheck({ size = 14 }) {
  return (
    <span className="ns9-feat-check-badge" aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function SvgCrown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function SvgFlame({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M12 2c-.8 2.2-2.5 4.3-4.2 6.1C6.1 9.9 5 12 5 14.5 5 18.6 8.1 22 12 22s7-3.4 7-7.5c0-3.3-2-6.2-4.5-8.5-.7-.6-1.5-1.2-2.2-1.9C12.1 3.5 12 2.7 12 2zm0 16c-1.7 0-3-1.3-3-3 0-1.2.7-2.3 1.7-3.3.4-.4.9-.8 1.3-1.2.4.4.9.8 1.3 1.2 1 1 1.7 2.1 1.7 3.3 0 1.7-1.3 3-3 3z" />
    </svg>
  );
}

function SvgSparkle({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function SvgGradCap({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  );
}

function SvgBriefcase({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

/* ============================================================
   DỮ LIỆU BẢNG GIÁ CHÍNH THỨC ELEC AI 2026
   ============================================================ */
export const PRICING_PACKAGES = {
  student: [
    {
      id: 'hoc-ba',
      name: 'Học Bá',
      eyebrow: 'Khởi động linh hoạt',
      badge: 'Chuẩn 199k/tháng',
      badgeType: 'sparkle',
      badgeColor: 'blue',
      desc: 'Full đặc quyền Học sinh VIP trong 1 hoặc 3 tháng linh hoạt',
      defaultTierId: '1m',
      tiers: [
        { id: '1m', pkgKey: 'hs-1m', months: 1, label: '1 tháng', fee: '199.000đ', origFee: '249.000đ', rate: '199.000đ/tháng', amount: 199000, save: null, isBest: true },
        { id: '3m', pkgKey: 'hs-3m', months: 3, label: '3 tháng', fee: '399.000đ', origFee: '597.000đ', rate: '≈133.000đ/tháng', amount: 399000, save: 'Tiết kiệm 33%' },
      ],
      features: [
        'Mở khóa 100% đề thi thử PRO & VIP (THPTQG, ĐGNL, TSA, V-ACT)',
        '99 tim luyện tập/ngày & bảng thống kê Phòng thi ảo không giới hạn',
        'AI Chẩn đoán lỗ hổng kiến thức & Đơn thuốc ôn tập sau mỗi đề thi',
        'Studio Soạn Đề & Tài liệu thông minh từ PDF / Word / Ảnh',
        'Gia sư Giọng nói AI trong Bài giảng 3D & Tư vấn Hướng nghiệp AI',
      ],
      ctaText: 'Đăng ký Học Bá',
      tone: 'blue',
    },
    {
      id: 'tinh-anh',
      name: 'Tinh Anh',
      eyebrow: 'Phổ biến nhất',
      badge: 'Tiết kiệm đến 58%',
      badgeType: 'crown',
      badgeColor: 'pink',
      desc: 'Full toàn bộ quyền lợi Học sinh VIP trọn học kỳ hoặc cả năm học',
      defaultTierId: '6m',
      isPopular: true,
      tiers: [
        { id: '6m', pkgKey: 'hs-6m', months: 6, label: '6 tháng', fee: '699.000đ', origFee: '1.194.000đ', rate: '≈116.500đ/tháng', amount: 699000, save: 'Tiết kiệm 41%', isBest: true },
        { id: '1y', pkgKey: 'hs-12m', months: 12, label: '12 tháng', fee: '999.000đ', origFee: '2.388.000đ', rate: '≈83.250đ/tháng', amount: 999000, save: 'Tiết kiệm 58%' },
      ],
      features: [
        'Mở khóa 100% kho đề PRO & VIP mọi kỳ thi suốt 6–12 tháng',
        'Tặng kèm 320 – 700 Credit AI dùng cho Gia sư & AI Tạo Đề',
        'Lộ trình KHTN, Chiến lược Nguyện vọng & Sổ lỗi sai đồng bộ liên tục',
        'AI Chẩn đoán sau thi, Gia sư giọng nói 3D & Hướng nghiệp AI toàn diện',
        'So sánh không giới hạn công cụ & Trợ lý AI Bảng tuần hoàn',
      ],
      ctaText: 'Nâng cấp Tinh Anh',
      tone: 'gradient-blue',
    },
    {
      id: 've-dich-tsa',
      name: 'Về Đích Ôn Thi',
      eyebrow: 'Nước rút THPTQG & TSA',
      badge: 'Hot',
      badgeType: 'flame',
      badgeColor: 'orange',
      desc: 'Tăng tốc nước rút & ôn tổng lực chuẩn THPTQG, HSA, TSA',
      tag: 'Phù hợp ôn cấp tốc 3–12 tháng',
      defaultTierId: '3m',
      tiers: [
        { id: '3m', pkgKey: 'hs-3m', months: 3, label: '3 tháng', fee: '399.000đ', origFee: '597.000đ', rate: '≈133.000đ/tháng', amount: 399000, save: 'Tiết kiệm 33%', isBest: true },
        { id: '1y', pkgKey: 'hs-12m', months: 12, label: '12 tháng', fee: '999.000đ', origFee: '2.388.000đ', rate: '≈83.250đ/tháng', amount: 999000, save: 'Tiết kiệm 58%' },
      ],
      features: [
        'Mở toàn bộ đề tổng ôn giai đoạn nước rút THPTQG, HSA, TSA',
        '99 tim luyện đề/ngày, làm lại không giới hạn để rà bẫy kiến thức',
        'AI Chẩn đoán câu sai từng chuyên đề Nhận biết -> Vận dụng cao',
        'Studio AI tách câu hỏi & tóm tắt tài liệu PDF/Ảnh trong vài giây',
        'Tặng kèm 150 – 700 Credit AI hỗ trợ giải bài 24/7',
      ],
      ctaText: 'Chọn gói Về Đích',
      tone: 'orange',
    },
  ],

  teacher: [
    {
      id: 'gv-1m',
      pkgKey: 'gv-1m',
      name: 'Giáo Viên VIP · 1 Tháng',
      eyebrow: 'Phổ biến nhất',
      badge: 'Chuẩn 399k/tháng',
      badgeType: 'crown',
      badgeColor: 'pink',
      desc: 'Mở khóa toàn bộ hệ sinh thái giảng dạy AI, OMR & Giám sát thi',
      defaultTierId: '1m',
      isPopular: true,
      tiers: [
        { id: '1m', months: 1, label: '1 tháng', fee: '399.000đ', origFee: '499.000đ', rate: '399.000đ/tháng', amount: 399000, save: null, isBest: true },
      ],
      features: [
        'Không giới hạn số lớp học & sĩ số học sinh (Free: 1 lớp / 40 HS)',
        'Không giới hạn nhập Word (.docx) & soạn thủ công (Free: 10 Word · 30 thủ công)',
        'Mở khóa AI Tạo Đề theo ma trận & tách đề từ file PDF / Ảnh OCR',
        'Ngân hàng câu hỏi không giới hạn + 4 công cụ AI giải, gắn tag, kiểm định',
        'Quét chấm phiếu OMR A4 không giới hạn & Giám sát thi LIVE Camera AI',
      ],
      ctaText: 'Đăng ký VIP 1 Tháng',
      tone: 'gradient-blue',
    },
    {
      id: 'gv-6m',
      pkgKey: 'gv-6m',
      name: 'Giáo Viên VIP · 6 Tháng',
      eyebrow: 'Trọn 1 học kỳ',
      badge: 'Tiết kiệm 17%',
      badgeType: 'sparkle',
      badgeColor: 'blue',
      desc: 'Đồng hành trọn vẹn 1 học kỳ, tối ưu chi phí hơn gia hạn từng tháng',
      defaultTierId: '6m',
      tiers: [
        { id: '6m', months: 6, label: '6 tháng', fee: '1.990.000đ', origFee: '2.394.000đ', rate: '≈331.000đ/tháng', amount: 1990000, save: 'Tiết kiệm 17%', isBest: true },
      ],
      features: [
        'Toàn bộ đặc quyền Giáo Viên VIP trong 180 ngày liên tục',
        'Tặng kèm 350 Credit AI cho AI Copilot, sinh đề & phân tích lớp',
        'Kết nối GVBM đa lớp & chia sẻ tài nguyên Tổ bộ môn',
        'Giám sát phòng thi trực tuyến chế độ Siêu chặt & Camera/Audio AI',
        'Báo cáo phổ điểm, cảnh báo học sinh yếu & xuất bảng điểm Excel',
      ],
      ctaText: 'Chọn gói 6 Tháng',
      tone: 'blue',
    },
    {
      id: 'gv-12m',
      pkgKey: 'gv-12m',
      name: 'Giáo Viên VIP · 12 Tháng',
      eyebrow: 'Tối ưu cả năm',
      badge: 'Tiết kiệm 25%',
      badgeType: 'flame',
      badgeColor: 'orange',
      desc: 'Trọn gói 1 năm học cho Giáo viên bộ môn, chủ nhiệm & trung tâm luyện thi',
      defaultTierId: '1y',
      tiers: [
        { id: '1y', months: 12, label: '12 tháng', fee: '3.590.000đ', origFee: '4.788.000đ', rate: '≈299.000đ/tháng', amount: 3590000, save: 'Tiết kiệm 25%', isBest: true },
      ],
      features: [
        'Toàn bộ đặc quyền Giáo Viên VIP suốt 365 ngày',
        'Tặng kèm 800 Credit AI ưu tiên xử lý tác vụ biên soạn nặng',
        'Chấm OMR hàng loạt, xuất Excel & đồng bộ điểm thẳng vào lớp',
        'Mở khóa Phòng thí nghiệm & Mô phỏng trình chiếu trực tiếp',
        'Hỗ trợ ưu tiên 1:1 & sao lưu toàn bộ ngân hàng đề riêng',
      ],
      ctaText: 'Nâng cấp 12 Tháng',
      tone: 'orange',
    },
  ],
};

export default function SubscriptionTiers({
  onUpgrade,
  onClose,
  isModal = Boolean(onClose),
  exam = null,
  onRedeemVoucher = null,
  lockedRole = null,
}) {
  const effectiveLockedRole = lockedRole === 'teacher' || lockedRole === 'student' ? lockedRole : null;
  const [roleTab, setRoleTab] = useState(effectiveLockedRole || 'student');
  useEffect(() => {
    if (effectiveLockedRole) setRoleTab(effectiveLockedRole);
  }, [effectiveLockedRole]);

  const [selectedTiers, setSelectedTiers] = useState({
    'hoc-ba': '1m',
    'tinh-anh': '6m',
    've-dich-tsa': '3m',
    'gv-1m': '1m',
    'gv-6m': '6m',
    'gv-12m': '1y',
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherMsg, setVoucherMsg] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [showVoucherInput, setShowVoucherInput] = useState(false);

  useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onClose]);

  const currentPackages = PRICING_PACKAGES[roleTab] || PRICING_PACKAGES.student;

  const handleSelectOption = (cardId, tierId) => {
    setSelectedTiers((prev) => ({ ...prev, [cardId]: tierId }));
  };

  const handleCheckout = (card) => {
    const chosenTierId = selectedTiers[card.id] || card.defaultTierId;
    const tier = card.tiers.find((t) => t.id === chosenTierId) || card.tiers[0];
    const isStudent = roleTab === 'student';
    const resolvedKey = tier.pkgKey || card.pkgKey || (
      isStudent
        ? (tier.months >= 12 ? 'hs-12m' : tier.months >= 6 ? 'hs-6m' : tier.months >= 3 ? 'hs-3m' : 'hs-1m')
        : (tier.months >= 12 ? 'gv-12m' : tier.months >= 6 ? 'gv-6m' : 'gv-1m')
    );

    onUpgrade?.({
      key: resolvedKey,
      id: resolvedKey,
      tierId: isStudent ? `student-${card.id}` : `teacher-${card.id}`,
      tierName: `ELEC AI ${card.name}`,
      role: roleTab,
      lockedRole: effectiveLockedRole || undefined,
      months: tier.months,
      amount: tier.amount,
      label: `ELEC AI ${card.name} — ${tier.label}`,
    });
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim() || !onRedeemVoucher) return;
    setVoucherLoading(true);
    setVoucherMsg(null);
    try {
      const res = await onRedeemVoucher(voucherCode.trim());
      setVoucherMsg(res);
    } catch (err) {
      setVoucherMsg({ ok: false, text: err?.message || 'Lỗi xử lý voucher' });
    } finally {
      setVoucherLoading(false);
    }
  };

  const cardContent = (
    <div className={`ns9-9study-pricing-wrap ${isModal ? 'is-in-modal' : ''}`}>
      <div className="ns9-9s-modal-card" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button
            type="button"
            className="ns9-9s-close-btn"
            onClick={onClose}
            aria-label="Đóng bảng giá"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <header className="ns9-9s-header">
          <div className="ns9-9s-eyebrow-pill">
            <SvgSparkle size={13} />
            <span>ELEC AI · Bảng giá nâng cấp 2026</span>
          </div>
          <h2 className="ns9-9s-main-title">
            {roleTab === 'teacher'
              ? 'Nâng tầm giảng dạy với Giáo Viên VIP'
              : 'Mở khóa toàn bộ hệ sinh thái ôn thi ELEC AI'}
          </h2>
          <p className="ns9-9s-sub-title">
            {roleTab === 'teacher'
              ? 'AI tạo đề, tách PDF/Ảnh OCR, trộn mã đề A4 & giám sát thi chỉ từ 399.000đ/tháng.'
              : 'Học sinh VIP chỉ từ 199.000đ/tháng — luyện mọi bộ đề PRO & chẩn đoán AI 24/7.'}
          </p>

          {exam && (
            <div className="ns9-9s-target-exam-bar">
              <span className="ns9-9s-target-badge">
                <SvgSparkle size={13} />
                Mở khóa đề {exam.tier || 'VIP'}
              </span>
              <div className="ns9-9s-target-details">
                <strong className="ns9-9s-target-title">{exam.title}</strong>
                <span className="ns9-9s-target-meta">
                  {exam.examType || 'KHTN'} · {exam.questionCount || 28} câu · {exam.durationMinutes || 50} phút
                </span>
              </div>
            </div>
          )}

          {!effectiveLockedRole ? (
            <div className="ns9-9s-role-tabs" role="tablist" aria-label="Chọn đối tượng gói cước">
              <button
                type="button"
                role="tab"
                aria-selected={roleTab === 'student'}
                className={`ns9-9s-role-tab ${roleTab === 'student' ? 'is-active' : ''}`}
                onClick={() => setRoleTab('student')}
              >
                <SvgGradCap size={16} />
                <span>Học sinh VIP (Từ 199k/tháng)</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={roleTab === 'teacher'}
                className={`ns9-9s-role-tab ${roleTab === 'teacher' ? 'is-active' : ''}`}
                onClick={() => setRoleTab('teacher')}
              >
                <SvgBriefcase size={16} />
                <span>Giáo viên VIP (Từ 399k/tháng)</span>
              </button>
            </div>
          ) : (
            <div className="ns9-9s-role-locked-pill">
              {effectiveLockedRole === 'teacher' ? <SvgBriefcase size={15} /> : <SvgGradCap size={15} />}
              <span>
                {effectiveLockedRole === 'teacher'
                  ? 'Gói cước Giáo Viên VIP · Chuẩn 399.000đ/tháng'
                  : 'Gói cước Học Sinh VIP · Chỉ từ 199.000đ/tháng'}
              </span>
            </div>
          )}
        </header>

        {/* Tóm tắt quyền lợi gói Free hiện có */}
        <div className="ns9-9s-free-strip">
          <span className="ns9-9s-free-tag">Gói Free (0đ)</span>
          <span className="ns9-9s-free-copy">
            {roleTab === 'teacher'
              ? 'Bao gồm 1 lớp / 40 HS · Dùng thử 10 lần nhập file Word (.docx) · 30 lần nhập thủ công · 5 lượt chấm OMR'
              : 'Miễn phí Lộ trình KHTN, Chiến lược Nguyện vọng AI, Sổ tay lỗi sai SRS, Lớp học của tôi & 5 tim/ngày'}
          </span>
        </div>

        {/* ── GRID 3 THẺ GÓI CƯỚC HIỆN ĐẠI ── */}
        <div className="ns9-9s-cards-grid">
          {currentPackages.map((card) => {
            const activeTierId = selectedTiers[card.id] || card.defaultTierId;
            const chosenTier = card.tiers.find((t) => t.id === activeTierId) || card.tiers[0];

            return (
              <article
                key={card.id}
                className={`ns9-9s-col-card tone-${card.tone} ${card.isPopular ? 'is-popular-card' : ''}`}
              >
                <div className="ns9-9s-card-top-row">
                  <span className="ns9-9s-card-eyebrow">{card.eyebrow}</span>
                  {card.badge && (
                    <span className={`ns9-9s-pill-badge badge-${card.badgeColor || 'blue'}`}>
                      {card.badgeType === 'crown' ? <SvgCrown size={12} /> : card.badgeType === 'flame' ? <SvgFlame size={12} /> : <SvgSparkle size={12} />}
                      <span>{card.badge}</span>
                    </span>
                  )}
                </div>

                <div className="ns9-9s-card-head">
                  <h3 className="ns9-9s-card-title">{card.name}</h3>
                  <p className="ns9-9s-card-desc">{card.desc}</p>
                </div>

                {/* Giá nổi bật của mốc đang chọn */}
                <div className="ns9-9s-price-hero">
                  <div className="ns9-9s-price-main">
                    <strong>{chosenTier.fee}</strong>
                    <span className="ns9-9s-price-unit">/ {chosenTier.label}</span>
                  </div>
                  <div className="ns9-9s-price-meta">
                    <span className="ns9-9s-price-rate">{chosenTier.rate}</span>
                    {chosenTier.origFee && (
                      <span className="ns9-9s-opt-orig-price">{chosenTier.origFee}</span>
                    )}
                    {chosenTier.save && (
                      <span className="ns9-9s-opt-save-badge">{chosenTier.save}</span>
                    )}
                  </div>
                </div>

                {/* Bộ chọn thời hạn dạng Segment Pills khi gói có nhiều mốc */}
                {card.tiers.length > 1 && (
                  <div className="ns9-9s-duration-switch" role="radiogroup" aria-label={`Chọn thời hạn ${card.name}`}>
                    {card.tiers.map((tier) => {
                      const isSelected = activeTierId === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`ns9-9s-dur-btn ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectOption(card.id, tier.id)}
                        >
                          <span>{tier.label}</span>
                          {tier.save && <small>{tier.save.replace('Tiết kiệm ', '-')}</small>}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="ns9-9s-features-box">
                  <ul className="ns9-9s-feat-list">
                    {card.features.map((feat, fIdx) => (
                      <li key={fIdx} className="ns9-9s-feat-item">
                        <SvgCheck size={12} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="ns9-9s-card-footer">
                  <button
                    type="button"
                    className={`ns9-9s-card-cta-btn ${card.isPopular ? 'btn-popular' : ''}`}
                    onClick={() => handleCheckout(card)}
                  >
                    <span>{card.ctaText} · {chosenTier.fee}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Voucher / Mã kích hoạt */}
        {onRedeemVoucher && (
          <div className="ns9-9s-voucher-bar">
            {!showVoucherInput ? (
              <button
                type="button"
                className="ns9-9s-voucher-toggle-btn"
                onClick={() => setShowVoucherInput(true)}
              >
                <SvgSparkle size={14} />
                <span>Bạn có mã voucher ưu đãi hoặc mã kích hoạt gói? Nhập tại đây</span>
              </button>
            ) : (
              <form className="ns9-9s-voucher-form" onSubmit={handleVoucherSubmit}>
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi hoặc mã kích hoạt..."
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="ns9-9s-voucher-input"
                  autoFocus
                />
                <button
                  type="submit"
                  className="ns9-9s-voucher-submit-btn"
                  disabled={!voucherCode.trim() || voucherLoading}
                >
                  {voucherLoading ? 'Đang kiểm tra...' : 'Kích hoạt'}
                </button>
                <button
                  type="button"
                  className="ns9-9s-voucher-close-btn"
                  onClick={() => {
                    setShowVoucherInput(false);
                    setVoucherMsg(null);
                  }}
                  aria-label="Hủy nhập mã"
                >
                  ✕
                </button>
              </form>
            )}
            {voucherMsg && (
              <div className={`ns9-9s-voucher-alert ${voucherMsg.ok ? 'is-success' : 'is-error'}`}>
                {voucherMsg.text}
              </div>
            )}
          </div>
        )}

        <footer className="ns9-9s-trust-foot">
          <span>Kích hoạt tự động 30 giây qua VietQR · Bảo mật theo tài khoản · Hỗ trợ 24/7</span>
        </footer>
      </div>
    </div>
  );

  if (isModal) {
    const modalMarkup = (
      <div
        className="ns9-9s-modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Bảng giá nâng cấp ELEC AI"
      >
        <div className="ns9-9s-modal-overlay-inner" onClick={(e) => e.stopPropagation()}>
          {cardContent}
        </div>
      </div>
    );

    if (typeof document !== 'undefined' && document.body) {
      return createPortal(modalMarkup, document.body);
    }
    return modalMarkup;
  }

  return cardContent;
}
