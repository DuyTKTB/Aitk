import { useState } from 'react';
import '../styles/subscription-tiers.css';

/* ============================================================
   SVG ICONS THUẦN — 100% SVG, ZERO EMOJIS, ZERO ICON FONTS
   ============================================================ */
function SvgCheck() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ns9-feat-check">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SvgStudent() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function SvgTeacher() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
      <path d="M6 14h6" />
    </svg>
  );
}

function SvgTable() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

function SvgCrown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

/* ============================================================
   DỮ LIỆU BẢNG GIÁ CHUẨN 100% THEO HÌNH ẢNH YÊU CẦU
   ============================================================ */
export const PRICING_DATA = {
  student: {
    id: 'student',
    role: 'student',
    title: '1. HỌC SINH — ELEC AI Học Sinh',
    sub: 'Tự học thông minh, luyện thi THPT Quốc Gia, ĐGNL (HSA), ĐGTD (TSA) và hỏi bài AI không giới hạn.',
    badge: 'Phổ biến nhất',
    defaultDur: '12m',
    tiers: [
      { id: '1m', months: 1, duration: '1 tháng', fee: '79.000đ', price: 79000, rate: '79.000đ', save: '—', saveBadge: null },
      { id: '3m', months: 3, duration: '3 tháng', fee: '199.000đ', price: 199000, rate: '≈66.000đ', save: '16%', saveBadge: 'Tiết kiệm 16%' },
      { id: '6m', months: 6, duration: '6 tháng', fee: '349.000đ', price: 349000, rate: '≈58.000đ', save: '26%', saveBadge: 'Tiết kiệm 26%' },
      { id: '12m', months: 12, duration: '12 tháng', fee: '499.000đ', price: 499000, rate: '≈42.000đ', save: '47%', saveBadge: 'Tiết kiệm 47%', isBest: true },
    ],
    features: [
      'Toàn bộ đề thi miễn phí & độc quyền kỳ thi THPTQG, HSA, TSA chuẩn cấu trúc',
      'Buổi tổng ôn nhóm trực tiếp cùng giáo viên ELEC AI (qua Google Meet)',
      'Trợ lý AI giải thích từng bước & chỉ rõ lỗi sai chi tiết, không đưa đáp án suông',
      'Hỏi bài & phân tích ảnh chụp bài tập không giới hạn lượt 24/7',
      'Sổ lỗi sai thông minh, tự động phân loại theo môn, chuyên đề và dạng bài',
      'Đấu trường trắc nghiệm trực tuyến & Bảng xếp hạng học tập thời gian thực',
      'Dự đoán phổ điểm & phân tích cơ hội trúng tuyển nguyện vọng đại học',
    ],
  },
  teacher: {
    id: 'teacher',
    role: 'teacher',
    title: '2. GIÁO VIÊN — ELEC AI Giáo Viên PRO',
    sub: 'Biên soạn đề thi AI theo ma trận, tạo lớp học không giới hạn, chấm thi tự động và thống kê báo cáo chuyên sâu.',
    badge: 'Dành cho Thầy/Cô',
    defaultDur: '12m',
    tiers: [
      { id: '1m', months: 1, duration: '1 tháng', fee: '149.000đ', price: 149000, rate: '149.000đ', save: '—', saveBadge: null },
      { id: '6m', months: 6, duration: '6 tháng', fee: '590.000đ', price: 590000, rate: '≈98.000đ', save: '34%', saveBadge: 'Tiết kiệm 34%' },
      { id: '12m', months: 12, duration: '12 tháng', fee: '990.000đ', price: 990000, rate: '≈82.500đ', save: '45%', saveBadge: 'Tiết kiệm 45%', isBest: true },
    ],
    features: [
      'Quản lý không giới hạn số lượng lớp học và sĩ số học sinh tham gia',
      'Soạn đề 3 phương thức linh hoạt: Soạn tay, AI sinh đề ma trận chuẩn Bộ GD&ĐT, hoặc nạp từ file PDF/Word/Ảnh',
      'Hệ thống tự động chấm điểm bài thi & phiếu OMR ngay lập tức khi học sinh nộp',
      'Giám sát phòng thi trực tuyến: chống gian lận, camera proctoring, cảnh báo chuyển tab',
      'Báo cáo thống kê ma trận điểm, xếp loại Giỏi/Khá/TB/Yếu, xuất file Excel & CSV tiện lợi',
      'Đồng bộ quản lý giữa Giáo viên bộ môn & Giáo viên chủ nhiệm cùng một nơi',
    ],
  },
};

export default function SubscriptionTiers({ onUpgrade }) {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'teacher' | 'all'
  const [selectedStudentDur, setSelectedStudentDur] = useState('12m');
  const [selectedTeacherDur, setSelectedTeacherDur] = useState('12m');

  const curStudentTier = PRICING_DATA.student.tiers.find((t) => t.id === selectedStudentDur) || PRICING_DATA.student.tiers[3];
  const curTeacherTier = PRICING_DATA.teacher.tiers.find((t) => t.id === selectedTeacherDur) || PRICING_DATA.teacher.tiers[2];

  const handleCheckout = (role, tier) => {
    const isStudent = role === 'student';
    onUpgrade?.({
      tierId: isStudent ? 'student-vip' : 'teacher-pro',
      tierName: isStudent ? 'ELEC AI Học Sinh' : 'ELEC AI Giáo Viên PRO',
      role,
      months: tier.months,
      amount: tier.price,
      label: `${isStudent ? 'ELEC AI Học Sinh' : 'ELEC AI Giáo Viên PRO'} — ${tier.duration}`,
    });
  };

  const renderTableSection = (data, selectedDur, setSelectedDur) => {
    const curTier = data.tiers.find((t) => t.id === selectedDur) || data.tiers[data.tiers.length - 1];

    return (
      <div className="ns9-plan-box" key={data.id}>
        <div className="ns9-plan-header">
          <div className="ns9-plan-header-left">
            <div className="ns9-plan-title-row">
              <h3 className="ns9-plan-title">{data.title}</h3>
              {data.badge && (
                <span className={`ns9-plan-badge ${data.role === 'teacher' ? 'orange' : ''}`}>
                  {data.badge}
                </span>
              )}
            </div>
            <p className="ns9-plan-sub">{data.sub}</p>
          </div>
        </div>

        {/* Bảng giá học phí theo đúng cột của hình ảnh */}
        <div className="ns9-table-container">
          <table className="ns9-price-table">
            <thead>
              <tr>
                <th>Thời hạn</th>
                <th>Học phí</th>
                <th>/tháng</th>
                <th>Tiết kiệm</th>
                <th style={{ textAlign: 'right' }}>Chọn gói</th>
              </tr>
            </thead>
            <tbody>
              {data.tiers.map((t) => {
                const isSelected = selectedDur === t.id;
                return (
                  <tr
                    key={t.id}
                    className={isSelected ? 'is-selected' : ''}
                    onClick={() => setSelectedDur(t.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ns9-col-dur">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {t.duration}
                        {t.isBest && (
                          <span className="ns9-save-badge" style={{ background: '#34c759', color: '#fff', fontSize: '0.72rem' }}>
                            Khuyên dùng
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="ns9-col-fee">{t.fee}</td>
                    <td className="ns9-col-rate">{t.rate}</td>
                    <td className="ns9-col-save">
                      {t.saveBadge ? (
                        <span className="ns9-save-badge">{t.save}</span>
                      ) : (
                        <span>{t.save}</span>
                      )}
                    </td>
                    <td className="ns9-col-action">
                      <button
                        type="button"
                        className={`ns9-table-btn ${isSelected ? 'is-active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDur(t.id);
                        }}
                      >
                        {isSelected ? '✓ Đang chọn' : 'Chọn'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Khối tóm tắt & danh sách tính năng */}
        <div className="ns9-plan-action-row">
          <div className="ns9-features-wrap">
            <h4 className="ns9-features-title">Đặc quyền bao gồm trong gói:</h4>
            <ul className="ns9-features-list">
              {data.features.map((feat, idx) => (
                <li key={idx} className="ns9-feat-item">
                  <SvgCheck />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="ns9-checkout-summary">
            <div className="ns9-cs-info">
              <span className="ns9-cs-label">Gói bạn đang chọn</span>
              <span className="ns9-cs-name">{data.title.split('—')[1]?.trim() || data.title} — {curTier.duration}</span>
              <div className="ns9-cs-price-row">
                <span className="ns9-cs-price">{curTier.fee}</span>
                <span className="ns9-cs-rate">({curTier.rate}/tháng)</span>
              </div>
              {curTier.saveBadge && (
                <span style={{ fontSize: '0.82rem', color: '#ff9500', fontWeight: 600 }}>
                  Tiết kiệm {curTier.save} so với mua lẻ từng tháng
                </span>
              )}
            </div>

            <button
              type="button"
              className="ns9-cs-cta-btn"
              onClick={() => handleCheckout(data.role, curTier)}
            >
              <SvgCrown />
              Nâng cấp ngay — {curTier.fee}
            </button>
            <p className="ns9-cs-note">
              Chuyển khoản QR một lần · Không tự động trừ tiền · Kích hoạt tức thì
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ns9-tiers-wrap">
      {/* Banner tiêu đề & câu trích dẫn chuẩn hình ảnh */}
      <div className="ns9-tiers-hero">
        <div className="ns9-tiers-hero-tag">
          <SvgCrown />
          <span>BẢNG GIÁ NIÊM YẾT CHÍNH THỨC</span>
        </div>
        <h2 className="ns9-tiers-hero-title">Bảng giá dịch vụ ELEC AI</h2>
        <p className="ns9-tiers-hero-quote">
          “Giảm mạnh và cắt đúng chỗ tốn tiền (buổi ôn live riêng → buổi tổng ôn nhóm) là cách hạ giá mà không lỗ:”
        </p>
      </div>

      {/* Segmented Control chuyển đổi chuẩn Apple */}
      <div className="ns9-tiers-segmented-wrap">
        <div className="ns9-tiers-segmented">
          <button
            type="button"
            className={`ns9-seg-btn ${activeTab === 'student' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <SvgStudent />
            <span>1. Học Sinh</span>
          </button>

          <button
            type="button"
            className={`ns9-seg-btn ${activeTab === 'teacher' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('teacher')}
          >
            <SvgTeacher />
            <span>2. Giáo Viên PRO</span>
          </button>

          <button
            type="button"
            className={`ns9-seg-btn ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <SvgTable />
            <span>Xem cả 2 bảng</span>
          </button>
        </div>
      </div>

      {/* Nội dung theo Tab được chọn */}
      <div className="ns9-plan-section">
        {(activeTab === 'student' || activeTab === 'all') && (
          renderTableSection(PRICING_DATA.student, selectedStudentDur, setSelectedStudentDur)
        )}

        {(activeTab === 'teacher' || activeTab === 'all') && (
          renderTableSection(PRICING_DATA.teacher, selectedTeacherDur, setSelectedTeacherDur)
        )}
      </div>
    </div>
  );
}
