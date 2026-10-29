import { useState, useEffect, useMemo, useRef } from 'react';
import {
  getDetailedAdmissionScheme,
  getSchoolById,
  getMajorsBySchool,
  getUserAspirationsState,
  upsertAspiration,
} from '../../lib/aspirationService.js';
import '../../styles/university-detail.css';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'majors', label: 'Ngành đào tạo' },
  { id: 'methods', label: 'Đề án tuyển sinh' },
  { id: 'cutoffs', label: 'Điểm chuẩn 2025' },
  { id: 'tuition', label: 'Học phí và học bổng' },
  { id: 'info', label: 'Thông tin trường' },
];

export default function UniversityDetailModal({
  open,
  schoolId = 'NEU',
  onClose,
  uid,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState('overview-quick');
  const [aspState, setAspState] = useState(() => getUserAspirationsState(uid));
  const modalRef = useRef(null);

  // Đóng khi nhấn phím Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [open]);

  // Lấy dữ liệu đề án và trường
  const scheme = useMemo(() => getDetailedAdmissionScheme(schoolId), [schoolId]);
  const school = useMemo(() => getSchoolById(schoolId) || getSchoolById(scheme?.schoolId), [schoolId, scheme]);
  const majors = useMemo(() => getMajorsBySchool(school?.id || schoolId), [school, schoolId]);

  if (!open || !scheme) return null;

  // Lấy chữ viết tắt avatar (VD: KH cho Kinh Tế Quốc Dân, BK cho Bách Khoa)
  const avatarText = school?.code?.slice(0, 2) || scheme.admissionCode?.slice(0, 2) || 'ĐH';

  const scrollToSection = (secId) => {
    setActiveSection(secId);
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectAspirationPriority = (priority) => {
    if (!uid) return;
    const firstMajor = majors[0];
    if (!firstMajor) return;
    const newState = upsertAspiration(uid, {
      schoolId: school?.id || scheme.schoolId,
      majorId: firstMajor.id,
      examId: 'THPTQG',
      priority,
    });
    setAspState(newState);
  };

  const isCurrentAspPriority = (p) => {
    return aspState?.aspirations?.some(
      (a) => (a.schoolId === school?.id || a.schoolId === scheme.schoolId) && a.priority === p
    );
  };

  return (
    <div
      className="udm-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Đề án tuyển sinh ${scheme.schoolName}`}
    >
      <div className="udm-modal" ref={modalRef}>
        {/* Nút đóng */}
        <button
          type="button"
          className="udm-close-btn"
          onClick={onClose}
          aria-label="Đóng đề án tuyển sinh"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── 1. BANNER TRƯỜNG ── */}
        <div className="udm-banner-wrap">
          <img
            src={scheme.cover || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80'}
            alt={`Ảnh khuôn viên ${scheme.schoolName}`}
            className="udm-banner-img"
          />
          <div className="udm-banner-overlay" />
        </div>

        {/* ── 2. CARD TIÊU ĐỀ XANH DƯƠNG RỘNG (NHƯ ẢNH MẪU 9STUDY) ── */}
        <div className="udm-title-card">
          <div className="udm-title-info">
            <h2>{scheme.schoolName}</h2>
            <div className="udm-title-meta">
              <span>Địa chỉ: {school?.city || 'Việt Nam'}</span>
              <span>• Mã trường: <b>{scheme.admissionCode}</b></span>
            </div>
          </div>
          {scheme.website && (
            <a
              href={scheme.website}
              target="_blank"
              rel="noopener noreferrer"
              className="udm-web-btn"
            >
              <span>Website trường</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          )}
        </div>

        {/* ── 3. THANH 6 TAB ĐIỀU HƯỚNG ── */}
        <nav className="udm-tabs-nav" aria-label="Các phần đề án tuyển sinh">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`udm-tab-btn ${activeTab === t.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* ── 4. NỘI DUNG TỪNG TAB ── */}
        {activeTab === 'overview' && (
          <div className="udm-content-grid">
            {/* Cột trái: Menu sticky "TRONG TỔNG QUAN" */}
            <aside className="udm-side-menu" aria-label="Mục lục tổng quan">
              <p className="udm-side-title">Trong tổng quan</p>
              {(scheme.sections || []).map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`udm-side-link ${activeSection === sec.id ? 'is-active' : ''}`}
                  onClick={() => scrollToSection(sec.id)}
                >
                  {sec.title}
                </button>
              ))}
            </aside>

            {/* Cột phải: 4 KPI + Banner Notice + Nội dung chi tiết */}
            <main className="udm-main-col">
              {/* Card Tóm tắt + 4 KPI */}
              <div className="udm-summary-card" id="overview-quick">
                <div className="udm-summary-head">
                  <div className="udm-avatar-badge">{avatarText}</div>
                  <div className="udm-summary-title">{scheme.schoolName}</div>
                </div>

                <div className="udm-kpi-grid">
                  {(scheme.stats || []).map((st, idx) => (
                    <div className="udm-kpi-box" key={idx}>
                      <span className="udm-kpi-label">{st.label}</span>
                      <strong className={`udm-kpi-val ${idx === 2 ? 'is-orange' : idx === 3 ? 'is-green' : ''}`}>
                        {st.value}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* Banner Thông báo điểm + CTA Phòng thi ảo */}
                <div className="udm-banner-notice">
                  <span>{scheme.bannerNotice}</span>
                  <a
                    href="#virtual-exams"
                    className="udm-banner-cta"
                    onClick={() => onClose?.()}
                  >
                    <span>{scheme.virtualExamCta}</span>
                  </a>
                </div>

                {/* Chọn Nguyện vọng 1 - 2 - 3 trực tiếp */}
                <div className="udm-aspiration-bar">
                  <span className="udm-asp-label">Chọn làm mục tiêu:</span>
                  <div className="udm-asp-btns">
                    {[1, 2, 3].map((p) => {
                      const active = isCurrentAspPriority(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          className={`udm-asp-choice-btn ${active ? 'is-active' : ''}`}
                          onClick={() => handleSelectAspirationPriority(p)}
                        >
                          <span>{active ? '✓ Nguyện vọng' : '+ Nguyện vọng'} {p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Giới thiệu & Lịch sử */}
              <section className="udm-section-block" id="intro-history">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Giới thiệu và Lịch sử
                </h3>
                <p>{scheme.intro}</p>
                <p>
                  Trường có đội ngũ giảng viên đầu ngành, cơ sở vật chất giảng dạy chuẩn quốc tế, mạng lưới kết nối hàng trăm doanh nghiệp và viện nghiên cứu trên toàn thế giới.
                </p>
              </section>

              {/* Ngành tuyển sinh 2026 */}
              <section className="udm-section-block" id="admissions-2026">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10" />
                    <path d="M6 10h10" />
                  </svg>
                  Đề án tuyển sinh năm {scheme.yearPlan}
                </h3>
                <div className="udm-methods-list">
                  {(scheme.methods || []).map((m, idx) => (
                    <div key={idx} className="udm-method-item">
                      <div className="udm-method-head">
                        <span className="udm-method-code">{m.code}</span>
                        <span className="udm-method-quota">Chỉ tiêu: {m.quotaPercent}</span>
                      </div>
                      <div className="udm-method-name">{m.name}</div>
                      <p className="udm-method-desc">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Chi phí & Học phí */}
              <section className="udm-section-block" id="tuition-fees">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Chi phí & Học phí năm học
                </h3>
                <p><b>Hệ chuẩn / đại trà:</b> {scheme.tuition?.standard || 'Theo quy định hiện hành của Bộ GD&ĐT.'}</p>
                <p><b>Hệ chất lượng cao / tiên tiến:</b> {scheme.tuition?.advanced || 'Mức thu tương ứng với chương trình đào tạo.'}</p>
                <p><b>Học bổng & hỗ trợ:</b> {scheme.tuition?.scholarships || 'Chính sách học bổng khuyến khích học tập dành cho sinh viên xuất sắc.'}</p>
              </section>

              {/* Linh vật Elec màu xanh góc dưới phải (Lấy từ /img/elec/elec-default.svg trong public) */}
              <div
                className="udm-mascot-fab"
                onClick={() => {
                  window.location.hash = 'ai';
                  onClose?.();
                }}
                title="Hỏi trợ lý ELEC AI về trường này"
              >
                <img
                  src="/img/elec/elec-default.svg"
                  alt="ELEC AI Mascot"
                  className="udm-mascot-img"
                  onError={(e) => {
                    // Fallback an toàn nếu đường dẫn khác
                    e.currentTarget.src = '/elec.svg';
                  }}
                />
                <span className="udm-mascot-text">Hỏi ELEC AI về {scheme.admissionCode}</span>
              </div>
            </main>
          </div>
        )}

        {/* Tab Ngành đào tạo */}
        {activeTab === 'majors' && (
          <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="udm-section-block">
              <h3>Danh sách ngành đào tạo & Chỉ tiêu</h3>
              <div className="udm-methods-list">
                {majors.length > 0 ? (
                  majors.map((mj) => (
                    <div key={mj.id} className="udm-method-item" style={{ borderLeftColor: '#059669' }}>
                      <div className="udm-method-head">
                        <span className="udm-method-code" style={{ background: '#059669' }}>{mj.majorCode}</span>
                        <span className="udm-method-quota">Chỉ tiêu: {mj.quota || 'Theo đề án'}</span>
                      </div>
                      <div className="udm-method-name">{mj.name}</div>
                      <p className="udm-method-desc">
                        Tổ hợp môn: <b>{(mj.blocks || []).join(', ')}</b> · Học phí: <b>{mj.tuitionPerYear || 'Theo quy định'}</b>
                      </p>
                      {mj.career && <p className="udm-method-desc" style={{ marginTop: 4 }}>Cơ hội nghề nghiệp: {mj.career}</p>}
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--mut, #64748b)' }}>Đang cập nhật danh mục toàn bộ các chuyên ngành chi tiết cho trường này.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Đề án tuyển sinh */}
        {activeTab === 'methods' && (
          <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="udm-section-block">
              <h3>Các phương thức xét tuyển chi tiết</h3>
              <div className="udm-methods-list">
                {(scheme.methods || []).map((m, idx) => (
                  <div key={idx} className="udm-method-item">
                    <div className="udm-method-head">
                      <span className="udm-method-code">{m.code}</span>
                      <span className="udm-method-quota">{m.quotaPercent}</span>
                    </div>
                    <div className="udm-method-name">{m.name}</div>
                    <p className="udm-method-desc">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Điểm chuẩn */}
        {activeTab === 'cutoffs' && (
          <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="udm-section-block">
              <h3>Điểm chuẩn trúng tuyển tham khảo các năm</h3>
              <p>Khoảng điểm trúng tuyển của trường: <b>{scheme.cutoffRange}</b>.</p>
              <div className="udm-banner-notice" style={{ marginTop: 16 }}>
                <span>Luyện các bộ đề chuẩn cấu trúc THPT & ĐGNL của trường này:</span>
                <a href="#virtual-exams" className="udm-banner-cta" onClick={onClose}>
                  Vào Phòng thi ảo →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab Học phí & Học bổng */}
        {activeTab === 'tuition' && (
          <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="udm-section-block">
              <h3>Thông tin Học phí & Quỹ học bổng</h3>
              <p><b>Chương trình chuẩn:</b> {scheme.tuition?.standard}</p>
              <p><b>Chương trình nâng cao / CLC:</b> {scheme.tuition?.advanced}</p>
              <p><b>Học bổng:</b> {scheme.tuition?.scholarships}</p>
            </div>
          </div>
        )}

        {/* Tab Thông tin trường */}
        {activeTab === 'info' && (
          <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="udm-section-block">
              <h3>Thông tin liên hệ & Tuyển sinh</h3>
              <p><b>Địa chỉ:</b> {scheme.contact?.address || school?.city}</p>
              <p><b>Hotline:</b> {scheme.contact?.hotline || 'Xem trên website trường'}</p>
              <p><b>Email tuyển sinh:</b> {scheme.contact?.email || 'tuyensinh@edu.vn'}</p>
              <p><b>Website chính thức:</b> <a href={scheme.website} target="_blank" rel="noreferrer" style={{ color: '#2f6bff' }}>{scheme.website}</a></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
