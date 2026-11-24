/* ============================================================
   UniversityDetailModal.jsx — HỒ SƠ TOÀN DIỆN & ĐỀ ÁN TUYỂN SINH 105 TRƯỜNG ĐẠI HỌC
   ------------------------------------------------------------
   - Hiển thị ảnh khuôn viên thực tế cục bộ (/img/universities/<id>.webp) cho cả 105 trường
   - Cho phép chuyển đổi nhanh giữa 105 trường ĐH ngay trên thanh tiêu đề Modal
   - 6 Tab đầy đủ dữ liệu: Tổng quan · Ngành đào tạo · Đề án tuyển sinh ·
     Bảng điểm chuẩn 2024–2025 · Học phí & Học bổng · Thông tin liên hệ & Bản đồ
   - Hỗ trợ ghim trực tiếp từng ngành vào NV1 / NV2 / NV3 ngay trong bảng ngành & điểm chuẩn
   ============================================================ */

import { useState, useEffect, useMemo } from 'react';
import {
  getDetailedAdmissionScheme,
  getSchoolById,
  getSchools,
  getMajorsBySchool,
  getUserAspirationsState,
  subscribeAspirationChanges,
} from '../../lib/aspirationService.js';
import { pinMajorToAspirationSlot } from '../../lib/admissionCareerEngine.js';
import { getUniversityCover } from '../../data/universityCovers.js';
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
} from '../ui/AnimateDialog.jsx';
import '../../styles/university-detail.css';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'majors', label: 'Ngành đào tạo' },
  { id: 'methods', label: 'Đề án tuyển sinh' },
  { id: 'cutoffs', label: 'Điểm chuẩn 2024–2025' },
  { id: 'tuition', label: 'Học phí & Học bổng' },
  { id: 'info', label: 'Thông tin trường' },
];

export default function UniversityDetailModal({
  open,
  schoolId = 'NEU',
  onClose,
  uid = 'guest',
}) {
  const [currentSchoolId, setCurrentSchoolId] = useState(schoolId || 'NEU');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState('overview-quick');
  const [aspState, setAspState] = useState(() => getUserAspirationsState(uid));
  const [pinNotice, setPinNotice] = useState('');

  useEffect(() => {
    if (schoolId) setCurrentSchoolId(schoolId);
  }, [schoolId]);

  useEffect(() => {
    setAspState(getUserAspirationsState(uid));
    return subscribeAspirationChanges(() => {
      setAspState(getUserAspirationsState(uid));
    });
  }, [uid]);

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

  const allSchools = useMemo(() => getSchools(), []);
  const scheme = useMemo(() => getDetailedAdmissionScheme(currentSchoolId), [currentSchoolId]);
  const school = useMemo(
    () => getSchoolById(currentSchoolId) || getSchoolById(scheme?.schoolId),
    [currentSchoolId, scheme]
  );
  const majors = useMemo(
    () => getMajorsBySchool(school?.id || currentSchoolId),
    [school, currentSchoolId]
  );

  if (!open || !scheme) return null;

  const coverUrl = getUniversityCover(school?.id || school?.code || currentSchoolId);
  const avatarText =
    school?.code?.slice(0, 3) || scheme.admissionCode?.slice(0, 3) || 'ĐH';

  const scrollToSection = (secId) => {
    setActiveSection(secId);
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePinMajor = (mj, priority = 1) => {
    const c24 = mj.cutoffs?.find((c) => c.examId === 'THPTQG' && c.year === 2024)?.score ?? null;
    const c25 =
      mj.cutoffs?.find((c) => c.examId === 'THPTQG' && c.year === 2025)?.score ??
      c24 ??
      25.0;

    const next = pinMajorToAspirationSlot(
      uid,
      {
        id: mj.id,
        schoolId: school?.id || scheme.schoolId,
        code: school?.code || scheme.admissionCode,
        uni: scheme.schoolName,
        city: school?.city || scheme.city || 'Hà Nội',
        major: mj.name,
        majorCode: mj.majorCode,
        combo: (mj.blocks || ['A00']).join('/'),
        s2024: c24,
        s2025: c25,
      },
      priority,
      'THPTQG'
    );
    if (next) setAspState(next);
    setPinNotice(`Đã lưu "${mj.name} — ${scheme.schoolName}" vào Nguyện vọng ${priority} (NV${priority})!`);
    setTimeout(() => setPinNotice(''), 3500);
  };

  const handleSelectAspirationPriority = (priority) => {
    const firstMajor = majors[0];
    if (!firstMajor) return;
    handlePinMajor(firstMajor, priority);
  };

  const isCurrentAspPriority = (p) => {
    return aspState?.aspirations?.some(
      (a) =>
        (a.schoolId === school?.id ||
          a.school?.code === school?.code ||
          a.schoolId === scheme.schoolId) &&
        a.priority === p
    );
  };

  const isMajorPinnedAt = (mj, p) => {
    return aspState?.aspirations?.some(
      (a) => a.priority === p && (a.majorId === mj.id || (a.school?.code === school?.code && a.major?.name === mj.name))
    );
  };

  return (
    <DialogRoot open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          from="top"
          size="full"
          className="udm-animate-modal"
          aria-label={`Đề án tuyển sinh ${scheme.schoolName}`}
        >
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

          {/* ── 1. BANNER KHUÔN VIÊN TRƯỜNG THỰC TẾ ── */}
          <div className="udm-banner-wrap">
            <img
              src={coverUrl}
              alt={`Ảnh khuôn viên ${scheme.schoolName}`}
              className="udm-banner-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/img/universities/neu.webp';
              }}
            />
            <div className="udm-banner-overlay" />
          </div>

          {/* ── 2. CARD TIÊU ĐỀ + BỘ CHUYỂN NHANH 105 TRƯỜNG ĐẠI HỌC ── */}
          <div className="udm-title-card">
            <div className="udm-title-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2>{scheme.schoolName}</h2>
                <span
                  style={{
                    padding: '0.22rem 0.65rem',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  {scheme.type || 'Công lập'} · Thành lập {scheme.foundedYear || 1960}
                </span>
              </div>
              <div className="udm-title-meta">
                <span>Địa chỉ: {scheme.contact?.address || school?.city || 'Việt Nam'}</span>
                <span>• Mã trường: <b>{scheme.admissionCode}</b></span>
                <span>• Quy mô: <b>{scheme.studentScale || '15.000+ SV'}</b></span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              <select
                value={school?.id || currentSchoolId}
                onChange={(e) => setCurrentSchoolId(e.target.value)}
                aria-label="Chuyển đổi xem trường đại học khác"
                style={{
                  padding: '0.52rem 0.85rem',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.32)',
                  background: 'rgba(15, 23, 42, 0.35)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  maxWidth: 270,
                  outline: 'none',
                }}
              >
                {allSchools.map((s) => (
                  <option key={s.id} value={s.id} style={{ color: '#0f172a', background: '#ffffff' }}>
                    {s.code} — {s.name} ({s.city})
                  </option>
                ))}
              </select>

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
          </div>

          {/* Thông báo khi ghim NV thành công */}
          {pinNotice && (
            <div
              role="status"
              style={{
                margin: '0 1.5rem 0.75rem',
                padding: '0.68rem 1rem',
                borderRadius: 12,
                background: '#dcfce7',
                border: '1px solid #86efac',
                color: '#166534',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              ✓ {pinNotice}
            </div>
          )}

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
                {t.id === 'majors' ? ` (${majors.length})` : ''}
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

              {/* Cột phải: Nội dung toàn diện đủ 6 mục */}
              <main className="udm-main-col">
                {/* MỤC 1: Card Tóm tắt + KPI */}
                <div className="udm-summary-card" id="overview-quick">
                  <div className="udm-summary-head">
                    <div className="udm-avatar-badge">{avatarText}</div>
                    <div>
                      <div className="udm-summary-title">{scheme.schoolName}</div>
                      <small style={{ color: 'var(--mut, #64748b)', fontSize: '0.8rem' }}>
                        {scheme.group} · {scheme.contact?.address}
                      </small>
                    </div>
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

                  {/* Hàng chỉ số mở rộng: Năm thành lập · Quy mô · Việc làm */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                      gap: '0.65rem',
                      marginTop: '0.75rem',
                      padding: '0.75rem 0.9rem',
                      borderRadius: 14,
                      background: 'var(--surface-2, #f8fafc)',
                      border: '1px solid var(--line, rgba(100,120,180,0.16))',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--mut, #64748b)', display: 'block', fontSize: '0.71rem' }}>
                        Năm thành lập:
                      </span>
                      <b>{scheme.foundedYear || 1960}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--mut, #64748b)', display: 'block', fontSize: '0.71rem' }}>
                        Quy mô đào tạo:
                      </span>
                      <b>{scheme.studentScale || '15.000+ sinh viên'}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--mut, #64748b)', display: 'block', fontSize: '0.71rem' }}>
                        Tỷ lệ việc làm:
                      </span>
                      <b style={{ color: '#059669' }}>{scheme.employmentRate || '97.2% có việc làm'}</b>
                    </div>
                  </div>

                  {/* Banner Thông báo điểm + CTA Phòng thi ảo */}
                  <div className="udm-banner-notice" style={{ marginTop: '0.85rem' }}>
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
                    <span className="udm-asp-label">Đặt trường làm mục tiêu:</span>
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

                {/* MỤC 2: Giới thiệu & Lịch sử */}
                <section className="udm-section-block" id="intro-history">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Giới thiệu, Lịch sử &amp; Vị thế Đào tạo
                  </h3>
                  <p>{scheme.intro}</p>
                  {Array.isArray(scheme.highlights) && scheme.highlights.length > 0 && (
                    <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.25rem', lineHeight: 1.65, fontSize: '0.88rem' }}>
                      {scheme.highlights.map((hl, idx) => (
                        <li key={idx} style={{ marginBottom: '0.35rem' }}>{hl}</li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* MỤC 3: Đề án tuyển sinh năm 2026 */}
                <section className="udm-section-block" id="admissions-2026">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                      <path d="M6 6h10" />
                      <path d="M6 10h10" />
                    </svg>
                    Đề án &amp; Phương thức tuyển sinh năm {scheme.yearPlan}
                  </h3>
                  <div className="udm-methods-list">
                    {(scheme.methods || []).map((m, idx) => (
                      <div key={idx} className="udm-method-item">
                        <div className="udm-method-head">
                          <span className="udm-method-code">{m.code}</span>
                          <span className="udm-method-quota">Tỷ trọng chỉ tiêu: {m.quotaPercent}</span>
                        </div>
                        <div className="udm-method-name">{m.name}</div>
                        <p className="udm-method-desc">{m.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* MỤC 4: Ngành đào tạo & Tổ hợp mũi nhọn */}
                <section className="udm-section-block" id="major-training">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <h3 style={{ margin: 0 }}>
                      Ngành đào tạo mũi nhọn &amp; Điểm chuẩn ({majors.length} ngành tiêu biểu)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cutoffs')}
                      style={{
                        padding: '0.38rem 0.85rem',
                        borderRadius: 999,
                        border: '1px solid #2563eb',
                        background: 'rgba(37,99,235,0.08)',
                        color: '#2563eb',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Xem bảng điểm chuẩn đầy đủ →
                    </button>
                  </div>
                  <div className="udm-methods-list">
                    {majors.slice(0, 6).map((mj) => {
                      const c25 =
                        mj.cutoffs?.find((c) => c.examId === 'THPTQG' && c.year === 2025)?.score ??
                        mj.cutoffs?.find((c) => c.examId === 'THPTQG')?.score ??
                        null;
                      return (
                        <div key={mj.id} className="udm-method-item" style={{ borderLeftColor: '#059669' }}>
                          <div className="udm-method-head" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span className="udm-method-code" style={{ background: '#059669' }}>{mj.majorCode}</span>
                              <b style={{ fontSize: '0.94rem' }}>{mj.name}</b>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {c25 != null && (
                                <span className="udm-method-quota" style={{ fontWeight: 800, color: '#059669' }}>
                                  Chuẩn: {c25}đ
                                </span>
                              )}
                              {[1, 2, 3].map((p) => {
                                const pinned = isMajorPinnedAt(mj, p);
                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => handlePinMajor(mj, p)}
                                    style={{
                                      padding: '0.22rem 0.52rem',
                                      borderRadius: 7,
                                      border: '1px solid rgba(37,99,235,0.3)',
                                      background: pinned ? '#2563eb' : '#fff',
                                      color: pinned ? '#fff' : '#2563eb',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {pinned ? `✓ NV${p}` : `+NV${p}`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <p className="udm-method-desc" style={{ marginTop: 4 }}>
                            Tổ hợp: <b>{(mj.blocks || []).join(', ')}</b> · Chỉ tiêu: <b>{mj.quota || 180}</b> · Học phí: <b>{mj.tuitionPerYear || 'Theo quy định'}</b>
                          </p>
                          {mj.career && (
                            <p className="udm-method-desc" style={{ marginTop: 2, color: '#475569' }}>
                              Cơ hội việc làm: {mj.career}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* MỤC 5: Lưu ý thí sinh khi đăng ký nguyện vọng */}
                <section className="udm-section-block" id="student-notes">
                  <h3>Lưu ý quan trọng cho thí sinh đăng ký vào {scheme.admissionCode}</h3>
                  <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.25rem', lineHeight: 1.68, fontSize: '0.88rem' }}>
                    <li>
                      <b>Nguyên tắc lọc ảo Bộ GD&amp;ĐT:</b> Các nguyện vọng được xét bình đẳng theo điểm từ cao xuống thấp, không phân biệt thứ tự NV1 hay NV2 trừ trường hợp bằng điểm ở cuối danh sách chỉ tiêu.
                    </li>
                    <li>
                      <b>Quy đổi chứng chỉ &amp; Điểm ưu tiên:</b> Thí sinh đạt tổng điểm từ <b>22.50 điểm</b> trở lên (thang 30) sẽ áp dụng công thức giảm tuyến tính điểm ưu tiên: <code>Điểm ƯT = [(30 - Tổng điểm)/7.5] × Mức ƯT</code>.
                    </li>
                    <li>
                      <b>Kết hợp đa phương thức:</b> Nên đăng ký đồng thời cả phương thức Điểm thi THPT và Đánh giá năng lực (HSA / TSA / V-ACT / SPT) hoặc Xét kết hợp IELTS để tối đa hóa cơ hội trúng tuyển vào {scheme.schoolName}.
                    </li>
                  </ul>
                </section>

                {/* MỤC 6: Chi phí & Học phí */}
                <section className="udm-section-block" id="tuition-fees">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Chi phí, Học phí, Học bổng &amp; Ký túc xá
                  </h3>
                  <p><b>Hệ chuẩn / đại trà:</b> {scheme.tuition?.standard}</p>
                  <p><b>Hệ chất lượng cao / tiên tiến:</b> {scheme.tuition?.advanced}</p>
                  <p><b>Học bổng &amp; hỗ trợ tài chính:</b> {scheme.tuition?.scholarships}</p>
                  <p><b>Ký túc xá &amp; sinh hoạt:</b> {scheme.tuition?.dormitory}</p>
                </section>

                {/* Linh vật Elec góc dưới phải */}
                <div
                  className="udm-mascot-fab"
                  onClick={() => {
                    window.location.hash = 'ai';
                    onClose?.();
                  }}
                  title="Hỏi trợ lý ELEC AI về trường này"
                >
                  <img
                    src="/img/elec/elec-default.png"
                    alt="ELEC AI Mascot"
                    className="udm-mascot-img"
                  />
                  <span className="udm-mascot-text">Hỏi ELEC AI về {scheme.admissionCode}</span>
                </div>
              </main>
            </div>
          )}

          {/* TAB 2: NGÀNH ĐÀO TẠO CHI TIẾT */}
          {activeTab === 'majors' && (
            <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="udm-section-block">
                <h3>Danh mục Ngành đào tạo, Tổ hợp, Chỉ tiêu &amp; Cơ hội việc làm ({majors.length} ngành)</h3>
                <div className="udm-methods-list">
                  {majors.map((mj) => (
                    <div key={mj.id} className="udm-method-item" style={{ borderLeftColor: '#059669' }}>
                      <div className="udm-method-head" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="udm-method-code" style={{ background: '#059669' }}>{mj.majorCode}</span>
                          <span className="udm-method-name" style={{ margin: 0 }}>{mj.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="udm-method-quota">Chỉ tiêu: {mj.quota || 180} SV</span>
                          {[1, 2, 3].map((p) => {
                            const pinned = isMajorPinnedAt(mj, p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => handlePinMajor(mj, p)}
                                style={{
                                  padding: '0.26rem 0.6rem',
                                  borderRadius: 8,
                                  border: '1px solid rgba(37,99,235,0.35)',
                                  background: pinned ? '#2563eb' : '#ffffff',
                                  color: pinned ? '#ffffff' : '#2563eb',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                {pinned ? `✓ NV${p}` : `+ Đặt NV${p}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <p className="udm-method-desc" style={{ marginTop: 6 }}>
                        Tổ hợp xét tuyển: <b>{(mj.blocks || []).join(', ')}</b> · Học phí dự kiến: <b>{mj.tuitionPerYear || 'Theo quy định'}</b>
                      </p>
                      {mj.career && (
                        <p className="udm-method-desc" style={{ marginTop: 4 }}>
                          <b>Vị trí nghề nghiệp sau tốt nghiệp:</b> {mj.career}
                        </p>
                      )}
                      {mj.note && (
                        <p className="udm-method-desc" style={{ marginTop: 2, color: '#64748b' }}>
                          Ghi chú: {mj.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ĐỀ ÁN TUYỂN SINH */}
          {activeTab === 'methods' && (
            <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="udm-section-block">
                <h3>Các phương thức xét tuyển chính thức năm {scheme.yearPlan} — {scheme.schoolName}</h3>
                <div className="udm-methods-list">
                  {(scheme.methods || []).map((m, idx) => (
                    <div key={idx} className="udm-method-item">
                      <div className="udm-method-head">
                        <span className="udm-method-code">{m.code}</span>
                        <span className="udm-method-quota">Tỷ trọng chỉ tiêu: {m.quotaPercent}</span>
                      </div>
                      <div className="udm-method-name">{m.name}</div>
                      <p className="udm-method-desc">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BẢNG ĐIỂM CHUẨN CHI TIẾT 2024 – 2025 */}
          {activeTab === 'cutoffs' && (
            <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="udm-section-block">
                <h3>Bảng điểm chuẩn trúng tuyển chi tiết các ngành — {scheme.schoolName}</h3>
                <p>
                  Khoảng điểm chuẩn toàn trường: <b>{scheme.cutoffRange}</b> · Bấm <b>+NV1 / +NV2 / +NV3</b> ở từng ngành để lưu vào Rổ Nguyện vọng của bạn.
                </p>

                <div style={{ overflowX: 'auto', marginTop: '0.9rem' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.84rem',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr style={{ background: 'var(--surface-2, #f1f5f9)', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Mã ngành</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Tên ngành đào tạo</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Tổ hợp</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Chuẩn 2024</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Chuẩn 2025</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>ĐGNL (HSA/TSA/V-ACT)</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Đặt Nguyện vọng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {majors.map((mj) => {
                        const c24 = mj.cutoffs?.find((c) => c.examId === 'THPTQG' && c.year === 2024)?.score ?? null;
                        const c25 =
                          mj.cutoffs?.find((c) => c.examId === 'THPTQG' && c.year === 2025)?.score ??
                          c24 ??
                          null;
                        const hsa = mj.cutoffs?.find((c) => c.examId === 'HSA')?.score;
                        const tsa = mj.cutoffs?.find((c) => c.examId === 'TSA')?.score;
                        const vact = mj.cutoffs?.find((c) => c.examId === 'V-ACT')?.score;
                        const dgnlText =
                          [
                            hsa ? `HSA: ${hsa}` : null,
                            tsa ? `TSA: ${tsa}` : null,
                            vact ? `V-ACT: ${vact}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Xét quy đổi';

                        return (
                          <tr key={mj.id} style={{ borderBottom: '1px solid var(--line, #e2e8f0)' }}>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <code>{mj.majorCode}</code>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{mj.name}</td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>{(mj.blocks || []).join(', ')}</td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>{c24 ?? '—'}</td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#2563eb' }}>
                              {c25 ?? '—'}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#64748b' }}>{dgnlText}</td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                {[1, 2, 3].map((p) => {
                                  const pinned = isMajorPinnedAt(mj, p);
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => handlePinMajor(mj, p)}
                                      style={{
                                        padding: '0.24rem 0.5rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(37,99,235,0.35)',
                                        background: pinned ? '#2563eb' : 'transparent',
                                        color: pinned ? '#fff' : '#2563eb',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {pinned ? `✓ NV${p}` : `NV${p}`}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="udm-banner-notice" style={{ marginTop: 18 }}>
                  <span>Luyện các bộ đề chuẩn cấu trúc THPT &amp; ĐGNL của {scheme.schoolName}:</span>
                  <a href="#virtual-exams" className="udm-banner-cta" onClick={onClose}>
                    Vào Phòng thi ảo →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HỌC PHÍ & HỌC BỔNG */}
          {activeTab === 'tuition' && (
            <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="udm-section-block">
                <h3>Thông tin Học phí, Quỹ Học bổng &amp; Ký túc xá — {scheme.schoolName}</h3>
                <div className="udm-methods-list">
                  <div className="udm-method-item">
                    <div className="udm-method-name">1. Học phí Chương trình Chuẩn / Đại trà</div>
                    <p className="udm-method-desc">{scheme.tuition?.standard}</p>
                  </div>
                  <div className="udm-method-item">
                    <div className="udm-method-name">2. Học phí Chương trình Tiên tiến / Chất lượng cao / Quốc tế</div>
                    <p className="udm-method-desc">{scheme.tuition?.advanced}</p>
                  </div>
                  <div className="udm-method-item">
                    <div className="udm-method-name">3. Chính sách Học bổng &amp; Miễn giảm học phí</div>
                    <p className="udm-method-desc">{scheme.tuition?.scholarships}</p>
                  </div>
                  <div className="udm-method-item">
                    <div className="udm-method-name">4. Ký túc xá &amp; Chi phí sinh hoạt sinh viên</div>
                    <p className="udm-method-desc">{scheme.tuition?.dormitory}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: THÔNG TIN TRƯỜNG & LIÊN HỆ */}
          {activeTab === 'info' && (
            <div className="udm-content-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="udm-section-block">
                <h3>Hồ sơ Pháp lý &amp; Thông tin Liên hệ Tuyển sinh — {scheme.schoolName}</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '0.85rem',
                    marginTop: '0.8rem',
                  }}
                >
                  <div className="udm-method-item">
                    <div className="udm-method-name">Thông tin định danh</div>
                    <p className="udm-method-desc"><b>Tên trường:</b> {scheme.schoolName}</p>
                    <p className="udm-method-desc"><b>Mã tuyển sinh Bộ GD&amp;ĐT:</b> {scheme.admissionCode}</p>
                    <p className="udm-method-desc"><b>Loại hình:</b> Đại học {scheme.type || 'Công lập'}</p>
                    <p className="udm-method-desc"><b>Năm thành lập:</b> {scheme.foundedYear || 1960}</p>
                    <p className="udm-method-desc"><b>Quy mô sinh viên:</b> {scheme.studentScale}</p>
                    <p className="udm-method-desc"><b>Tỷ lệ có việc làm:</b> {scheme.employmentRate}</p>
                  </div>

                  <div className="udm-method-item">
                    <div className="udm-method-name">Địa chỉ &amp; Kênh liên hệ chính thức</div>
                    <p className="udm-method-desc"><b>Địa chỉ trụ sở chính:</b> {scheme.contact?.address}</p>
                    <p className="udm-method-desc"><b>Hotline Tuyển sinh:</b> {scheme.contact?.hotline}</p>
                    <p className="udm-method-desc"><b>Email Tuyển sinh:</b> {scheme.contact?.email}</p>
                    <p className="udm-method-desc">
                      <b>Website chính thức:</b>{' '}
                      <a href={scheme.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>
                        {scheme.website}
                      </a>
                    </p>
                    <div style={{ marginTop: '0.65rem' }}>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${scheme.schoolName} ${scheme.contact?.address || ''}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.9rem',
                          borderRadius: 10,
                          background: '#2563eb',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        Xem vị trí Khuôn viên trên Google Maps ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
