import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/subscription-tiers.css';

/* ============================================================
   SVG ICONS THUẦN — 100% SVG, ZERO EMOJIS, ZERO ICON FONTS
   ============================================================ */
function SvgCheck({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ns9-feat-check">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SvgCrown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function SvgRadioCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ns9-opt-radio-ico">
      <circle cx="12" cy="12" r="10" stroke="#2563eb" fill="none" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="5" fill="#2563eb" stroke="none" />
    </svg>
  );
}

function SvgRadioEmpty() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ns9-opt-radio-ico">
      <circle cx="12" cy="12" r="9.5" stroke="rgba(148, 163, 184, 0.7)" />
    </svg>
  );
}

/* ============================================================
   DỮ LIỆU BẢNG GIÁ 3 CỘT BENTO CHUẨN 9STUDY
   (HỌC BÁ - TINH ANH - VỀ ĐÍCH KHTN/TSA)
   ============================================================ */
export const PRICING_PACKAGES = {
  student: [
    {
      id: 'hoc-ba',
      name: 'Học Bá',
      badge: null,
      mascot: '/img/elec/elec-happy.png',
      mascotAlt: 'Elec Học Bá',
      desc: 'Full quyền lợi của 01 kỳ thi bất kỳ tự chọn (THPTQG/HSA/TSA/V-ACT)',
      defaultTierId: '1y',
      tiers: [
        { id: '3m', months: 3, label: '3 tháng', fee: '399.000đ', rate: '≈133.000đ/tháng', amount: 399000, save: null },
        { id: '6m', months: 6, label: '6 tháng', fee: '499.000đ', origFee: '798.000đ', rate: '≈83.167đ/tháng', amount: 499000, save: 'Tiết kiệm 37%' },
        { id: '1y', months: 12, label: '1 năm', fee: '699.000đ', origFee: '1.596.000đ', rate: '≈58.250đ/tháng', amount: 699000, save: 'Tiết kiệm 56%', isBest: true },
      ],
      features: [
        'Toàn bộ đề thi miễn phí và độc quyền VIP/PRO của 01 kỳ thi bất kỳ tự chọn (THPTQG/TSA/HSA/V-ACT/...)',
        '10 buổi tổng ôn trực tiếp cùng đội ngũ giáo viên ELEC AI (qua Meet)',
        'Lý thuyết và luyện tập đầy đủ của các kỳ thi đã chọn',
        'Sổ lỗi sai không giới hạn, phân loại theo môn, chủ đề, dạng bài',
        'AI hạn mức cao & Báo cáo Radar năng lực chi tiết',
        'ELEC tutor thông minh bám sát mục tiêu nguyện vọng 1',
        'Thách đấu đấu trường không giới hạn',
        '50.000 ELEC AI Credits thưởng vào ví',
      ],
      ctaText: 'Nâng cấp gói Học Bá',
      tone: 'blue',
    },
    {
      id: 'tinh-anh',
      name: 'Tinh Anh',
      badge: 'Bán chạy',
      badgeType: 'crown',
      badgeColor: 'pink',
      mascot: '/img/elec/elec-wink.png',
      mascotAlt: 'Elec Tinh Anh',
      desc: 'Full quyền lợi của 02 kỳ thi bất kỳ tự chọn (Ví dụ: THPTQG và HSA, TSA & V-ACT,...)',
      defaultTierId: '1y',
      isPopular: true,
      tiers: [
        { id: '3m', months: 3, label: '3 tháng', fee: '599.000đ', rate: '≈199.667đ/tháng', amount: 599000, save: null },
        { id: '6m', months: 6, label: '6 tháng', fee: '699.000đ', origFee: '1.198.000đ', rate: '≈116.500đ/tháng', amount: 699000, save: 'Tiết kiệm 42%' },
        { id: '1y', months: 12, label: '1 năm', fee: '899.000đ', origFee: '2.396.000đ', rate: '≈74.917đ/tháng', amount: 899000, save: 'Tiết kiệm 62%', isBest: true },
      ],
      features: [
        'Toàn bộ đề thi miễn phí và độc quyền VIP/PRO của 02 kỳ thi bất kỳ (Ví dụ: THPTQG và HSA, TSA và V-ACT,...)',
        '10 buổi tổng ôn trực tiếp cùng đội ngũ giáo viên ELEC AI (qua Meet)',
        'Lý thuyết và luyện tập đầy đủ của các kỳ thi đã chọn',
        'Sổ lỗi sai không giới hạn, phân loại theo môn, chủ đề, dạng bài',
        'AI hạn mức cao & Định hướng ngành nghề chi tiết',
        'ELEC tutor thông minh bám sát mục tiêu nguyện vọng 1',
        'Thách đấu đấu trường không giới hạn',
        '150.000 ELEC AI Credits thưởng vào ví',
      ],
      ctaText: 'Nâng cấp gói Tinh Anh',
      tone: 'gradient-blue',
    },
    {
      id: 've-dich-tsa',
      name: 'Về Đích TSA',
      badge: 'Hot',
      badgeType: 'flame',
      badgeColor: 'orange',
      mascot: '/img/elec/elec-super-saiyan.png',
      mascotAlt: 'Elec Về Đích',
      desc: '60 ngày nước rút trước kỳ thi',
      tag: 'Dành cho kỳ thi TSA & THPTQG',
      defaultTierId: 'until-exam',
      tiers: [
        { id: 'until-exam', months: 3, label: 'Đến hết ngày thi', fee: '299.000đ', origFee: '459.000đ', rate: 'Dùng tới hết 16/07/2027', amount: 299000, save: 'Tiết kiệm 35%', isBest: true },
        { id: 'full-pack', months: 12, label: 'Trọn gói thi 2026–2027', fee: '499.000đ', origFee: '899.000đ', rate: 'Bao trọn các đợt thi', amount: 499000, save: 'Tiết kiệm 45%' },
      ],
      features: [
        'Mở kỳ thi trong 60–90 ngày nước rút',
        'Bộ đề tổng hợp riêng cho giai đoạn nước rút',
        '10 buổi tổng ôn trực tiếp cùng đội ngũ giáo viên ELEC AI (qua Meet)',
        'Luyện theo chương, dạng bài và điểm yếu',
        'Sổ lỗi sai đầy đủ, thách đấu không giới hạn',
        'Trợ lý ELEC AI phân tích ma trận bẫy đề thi 24/7',
        '80.000 ELEC AI Credits thưởng vào ví',
      ],
      ctaText: 'Nâng cấp gói Về Đích',
      tone: 'orange',
    },
  ],

  teacher: [
    {
      id: 'gv-khoi-dau',
      name: 'Giáo Viên Khởi Đầu',
      badge: null,
      mascot: '/img/elec/elec-hello.png',
      mascotAlt: 'Elec Chào Thầy Cô',
      desc: 'Trải nghiệm biên soạn đề thi AI, quản lý 02 lớp học và chấm điểm OMR tự động',
      defaultTierId: '1m',
      tiers: [
        { id: '1m', months: 1, label: '1 tháng', fee: '149.000đ', rate: '149.000đ/tháng', amount: 149000, save: null, isBest: true },
      ],
      features: [
        'Quản lý tối đa 02 lớp học trực tuyến với 80 học sinh',
        'Soạn đề thi AI cơ bản theo ma trận chuẩn Bộ GD&ĐT',
        'Chấm thi trắc nghiệm OMR tự động với camera & phiếu thi',
        'Thống kê điểm số và phân loại học sinh cơ bản',
      ],
      ctaText: 'Chọn gói Khởi Đầu',
      tone: 'blue',
    },
    {
      id: 'gv-chuyen-nghiep',
      name: 'Giáo Viên Chuyên Nghiệp',
      badge: 'Bán chạy',
      badgeType: 'crown',
      badgeColor: 'pink',
      mascot: '/img/elec/elec-think.png',
      mascotAlt: 'Elec Giáo Viên Chuyên Nghiệp',
      desc: 'Quản lý không giới hạn lớp học, ngân hàng câu hỏi riêng và giám sát phòng thi',
      defaultTierId: '6m',
      isPopular: true,
      tiers: [
        { id: '6m', months: 6, label: '6 tháng', fee: '590.000đ', origFee: '894.000đ', rate: '≈98.000đ/tháng', amount: 590000, save: 'Tiết kiệm 34%', isBest: true },
      ],
      features: [
        'Quản lý KHÔNG GIỚI HẠN số lớp và học sinh',
        'Soạn đề AI 3 phương thức: Soạn tay, AI sinh đề ma trận, nhập Word/PDF',
        'Hệ thống tự động chấm điểm bài thi & phiếu OMR ngay lập tức',
        'Giám sát phòng thi trực tuyến: chống gian lận, camera proctoring',
        'Xuất báo cáo thống kê ma trận điểm file Excel & CSV',
      ],
      ctaText: 'Chọn gói Chuyên Nghiệp',
      tone: 'gradient-blue',
    },
    {
      id: 'gv-toan-nang',
      name: 'Giáo Viên PRO Toàn Năng',
      badge: 'Tiết kiệm 45%',
      badgeType: 'flame',
      badgeColor: 'orange',
      mascot: '/img/elec/elec-cool.png',
      mascotAlt: 'Elec Giáo Viên Toàn Năng',
      desc: 'Trọn bộ công cụ sư phạm AI cao cấp nhất cho Giáo viên bộ môn & Luyện thi 12 tháng',
      defaultTierId: '1y',
      tiers: [
        { id: '1y', months: 12, label: '1 năm (12 tháng)', fee: '990.000đ', origFee: '1.788.000đ', rate: '≈82.500đ/tháng', amount: 990000, save: 'Tiết kiệm 45%', isBest: true },
      ],
      features: [
        'Toàn bộ đặc quyền của gói Chuyên Nghiệp trong 12 tháng',
        'Ưu tiên kết nối máy chủ AI siêu tốc, không giới hạn số đề tạo',
        'Ngân hàng đề thi KHTN chuẩn GDPT 2025–2027 cập nhật liên tục',
        'Hỗ trợ kỹ thuật 1:1 qua Zalo & Google Meet đào tạo ứng dụng AI',
        'Đồng bộ quản lý giữa Giáo viên bộ môn & Giáo viên chủ nhiệm',
      ],
      ctaText: 'Nâng cấp gói Toàn Năng',
      tone: 'orange',
    },
  ],
};

/* Câu nói linh vật khi click tương tác ở góc phải */
const ELEC_CHEERS = [
  'Chạm vô Elec nè ^^',
  'Cố lên bạn ơi, Bách Khoa đang đợi!',
  'Luyện thi cùng Elec mỗi ngày điểm tăng vù vù!',
  'Hôm nay bạn đã ôn tập bao nhiêu câu rồi?',
  'Quyết tâm đỗ Nguyện vọng 1 nhé!',
];

export default function SubscriptionTiers({
  onUpgrade,
  onClose,
  isModal = Boolean(onClose),
  exam = null,
  onRedeemVoucher = null,
}) {
  const [roleTab, setRoleTab] = useState('student'); // 'student' | 'teacher'
  const [selectedTiers, setSelectedTiers] = useState({
    'hoc-ba': '1y',
    'tinh-anh': '1y',
    've-dich-tsa': 'until-exam',
    'gv-khoi-dau': '1m',
    'gv-chuyen-nghiep': '6m',
    'gv-toan-nang': '1y',
  });
  const [cheerIdx, setCheerIdx] = useState(0);
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

    onUpgrade?.({
      tierId: isStudent ? `student-${card.id}` : `teacher-${card.id}`,
      tierName: `ELEC AI ${card.name}`,
      role: roleTab,
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
      {/* ── 1. CONTAINER MODAL CHUẨN 9STUDY ── */}
      <div className="ns9-9s-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Linh vật vẫy chào ở góc trên bên trái (chuẩn ảnh 9study) */}
        <div className="ns9-9s-mascot-top-left" title="Chào mừng bạn đến với ELEC AI!">
          <img
            src="/img/elec/elec-hello.png"
            alt="Elec Waving"
            className="ns9-9s-mascot-img-tl"
            loading="lazy"
          />
        </div>

        {/* Nút đóng nếu được gọi dưới dạng modal */}
        {onClose && (
          <button
            type="button"
            className="ns9-9s-close-btn"
            onClick={onClose}
            aria-label="Đóng bảng giá"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Header tiêu đề chuẩn ảnh 9study */}
        <div className="ns9-9s-header">
          <h2 className="ns9-9s-main-title">Tiến độ hiện tại của bạn đang chững...</h2>
          <p className="ns9-9s-sub-title">Nâng cấp gói để tạo đà bứt phá.</p>

          {/* Target Exam Info nếu được mở khi bấm vào đề thi VIP/PRO */}
          {exam && (
            <div className="ns9-9s-target-exam-bar">
              <span className="ns9-9s-target-badge">
                <SvgSparkle size={13} />
                Mở khóa đề thi {exam.tier || 'VIP'}
              </span>
              <div className="ns9-9s-target-details">
                <strong className="ns9-9s-target-title">{exam.title}</strong>
                <span className="ns9-9s-target-meta">
                  Kỳ thi {exam.examType || 'KHTN'} · {exam.questionCount || 28} câu · {exam.durationMinutes || 50} phút · {exam.author || 'ELEC AI'}
                </span>
              </div>
            </div>
          )}

          {/* Role Segmented Tabs (Học sinh vs Giáo viên) có kèm linh vật sinh động */}
          <div className="ns9-9s-role-tabs">
            <button
              type="button"
              className={`ns9-9s-role-tab ${roleTab === 'student' ? 'is-active' : ''}`}
              onClick={() => setRoleTab('student')}
            >
              <img src="/img/elec/elec-cool.png" alt="Elec Student" className="ns9-9s-tab-mascot" />
              <span>Gói Học Sinh (Học Bá, Tinh Anh, Về Đích)</span>
            </button>

            <button
              type="button"
              className={`ns9-9s-role-tab ${roleTab === 'teacher' ? 'is-active' : ''}`}
              onClick={() => setRoleTab('teacher')}
            >
              <img src="/img/elec/elec-think.png" alt="Elec Teacher" className="ns9-9s-tab-mascot" />
              <span>Gói Giáo Viên PRO (Biên soạn đề & Quản lý lớp)</span>
            </button>
          </div>
        </div>

        {/* ── 2. GRID 3 CỘT GÓI CƯỚC BENTO HIỆN ĐẠI (CHUẨN ẢNH 9STUDY) ── */}
        <div className="ns9-9s-cards-grid">
          {currentPackages.map((card) => {
            const activeTierId = selectedTiers[card.id] || card.defaultTierId;
            const chosenTier = card.tiers.find((t) => t.id === activeTierId) || card.tiers[0];

            return (
              <div
                key={card.id}
                className={`ns9-9s-col-card tone-${card.tone} ${card.isPopular ? 'is-popular-card' : ''}`}
              >
                {/* Ribbon badge đỉnh card (👑 Bán chạy / 🔥 Hot) */}
                {card.badge && (
                  <div className={`ns9-9s-top-ribbon badge-${card.badgeColor || 'pink'}`}>
                    {card.badgeType === 'crown' ? <SvgCrown size={13} /> : <SvgFlame size={13} />}
                    <span>{card.badge}</span>
                  </div>
                )}

                {/* Linh vật nhô ra ở góc trên bên phải card (chuẩn ảnh 9study) */}
                {card.mascot && (
                  <div className="ns9-9s-card-peaking-mascot" title={card.mascotAlt || 'Elec Mascot'}>
                    <img src={card.mascot} alt={card.mascotAlt || 'Elec'} className="ns9-9s-peaking-img" />
                  </div>
                )}

                {/* Tiêu đề & Mô tả ngắn của gói */}
                <div className="ns9-9s-card-head">
                  <h3 className="ns9-9s-card-title">{card.name}</h3>
                  <p className="ns9-9s-card-desc">{card.desc}</p>
                  {card.tag && (
                    <span className="ns9-9s-card-tag">{card.tag}</span>
                  )}
                </div>

                {/* Danh sách các mốc thời gian lựa chọn (Radio Box) */}
                <div className="ns9-9s-options-list">
                  {card.tiers.map((tier) => {
                    const isSelected = activeTierId === tier.id;

                    return (
                      <div
                        key={tier.id}
                        className={`ns9-9s-option-row ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectOption(card.id, tier.id)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                      >
                        <div className="ns9-9s-opt-left">
                          <span className="ns9-9s-radio-wrap">
                            {isSelected ? <SvgRadioCheck /> : <SvgRadioEmpty />}
                          </span>
                          <div className="ns9-9s-opt-meta">
                            <strong className="ns9-9s-opt-dur">{tier.label}</strong>
                            <span className="ns9-9s-opt-rate">{tier.rate}</span>
                          </div>
                        </div>

                        <div className="ns9-9s-opt-right">
                          <span className="ns9-9s-opt-price">{tier.fee}</span>
                          {tier.origFee && (
                            <span className="ns9-9s-opt-orig-price">{tier.origFee}</span>
                          )}
                          {tier.save && (
                            <span className="ns9-9s-opt-save-badge">{tier.save}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Danh sách quyền lợi bao gồm trong gói (Checklist) */}
                <div className="ns9-9s-features-box">
                  <ul className="ns9-9s-feat-list">
                    {card.features.map((feat, fIdx) => (
                      <li key={fIdx} className="ns9-9s-feat-item">
                        <SvgCheck size={15} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nút nâng cấp / thanh toán ngay dưới mỗi cột */}
                <div className="ns9-9s-card-footer">
                  <button
                    type="button"
                    className={`ns9-9s-card-cta-btn ${card.isPopular ? 'btn-popular' : ''}`}
                    onClick={() => handleCheckout(card)}
                  >
                    <span>{card.ctaText} — {chosenTier.fee}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 2.5 VOUCHER / MÃ KÍCH HOẠT NHANH (NẾU CÓ) ── */}
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

        {/* ── 3. LINH VẬT TRANG TRÍ 2 BÊN GÓC DƯỚI (NHƯ ẢNH 9STUDY) ── */}
        <div className="ns9-9s-bottom-mascot-row">
          {/* Góc dưới bên trái: Elec cầm cúp vàng vinh quang */}
          <div className="ns9-9s-mascot-trophy-wrap" title="Cúp vinh quang thủ khoa KHTN">
            <img
              src="/img/elec/elec-celebrate.png"
              alt="Elec Trophy"
              className="ns9-9s-mascot-trophy-img"
              loading="lazy"
            />
          </div>

          {/* Góc dưới bên phải: Elec đội mũ tốt nghiệp có bong bóng thoại tương tác */}
          <div
            className="ns9-9s-mascot-tutor-wrap"
            onClick={() => setCheerIdx((prev) => (prev + 1) % ELEC_CHEERS.length)}
            title="Bấm vào Elec để đổi lời chúc học tập!"
          >
            <div className="ns9-9s-tutor-speech">
              <span>{ELEC_CHEERS[cheerIdx]}</span>
            </div>
            <img
              src="/img/elec/elec-cool.png"
              alt="Elec Graduation"
              className="ns9-9s-mascot-tutor-img"
              loading="lazy"
            />
          </div>
        </div>
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
