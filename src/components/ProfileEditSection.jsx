import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getUserProfile,
  saveUserProfile,
  validateProfileFields,
  VIETNAM_PROVINCES,
  GRADES_LIST,
} from '../lib/userProfileService.js';
import { joinNameParts } from '../lib/authValidation.js';
import { getSubscriptionAndQuota, getUserReports } from '../data/virtualExamsBank.js';
import UserAvatar from './UserAvatar.jsx';
import '../styles/profile-edit-section.css';

/* Linh vật ELEC AI tách nền cao cấp nằm trong note */
function ChibiMascot() {
  return (
    <img
      src="/img/elec/elec-wink.png"
      alt="ELEC AI Note"
      className="ns9-pe-note-img"
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
      }}
    />
  );
}

export default function ProfileEditSection({
  onBack,
  onOpenAvatarModal,
  initialSubTab,
  subQuota: propSubQuota,
  identCode: propIdentCode,
  reports: propReports,
  onAddReport,
  onRefreshData,
}) {
  const {
    user,
    updateDisplayName,
    changePassword,
    sendVerifyEmail,
  } = useAuth();

  const uid = user?.uid;
  const isGoogle = user?.providerData?.some((p) => p.providerId === 'google.com');

  // Sub tab hiện tại của cột trái: info | invoice | billing | reports | referral | notifications | security
  const [activeSubTab, setActiveSubTab] = useState(() => initialSubTab || 'info');

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    const handleHash = () => {
      const h = typeof window !== 'undefined' ? window.location.hash || '' : '';
      const qIdx = h.indexOf('?');
      if (qIdx >= 0) {
        const raw = new URLSearchParams(h.slice(qIdx + 1)).get('tab');
        if (['info', 'invoice', 'notifications', 'security', 'billing', 'reports', 'referral'].includes(raw)) {
          setActiveSubTab(raw);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const subData = propSubQuota || getSubscriptionAndQuota(uid);
  const txList = subData?.transactions || [];
  const reportList = propReports || getUserReports(uid);
  const referralCode = propIdentCode || (uid ? `ELECAI-${uid.slice(0, 6).toUpperCase()}` : 'VIP2026');

  // Form State thông tin cá nhân (khởi tạo rỗng, tuyệt đối không dùng dữ liệu giả)
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [grade, setGrade] = useState('');
  const [highSchool, setHighSchool] = useState('');
  const [surveyState, setSurveyState] = useState(null);
  const [formErr, setFormErr] = useState('');

  // Invoice state
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [invoiceEmail, setInvoiceEmail] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState({
    dailyStreak: true,
    examRoomAlerts: true,
    newExamAlerts: true,
    weeklyReport: true,
  });

  // Security state
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Status
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Load data & lắng nghe đồng bộ từ cloud / khảo sát
  useEffect(() => {
    if (!uid) return undefined;
    const applyProfile = () => {
      const prof = getUserProfile(uid, user);
      setLastName(prof.lastName || '');
      setFirstName(prof.firstName || '');
      setEmail(user?.email || '');
      setBirthDate(prof.birthDate || '');
      setPhone(prof.phone || '');
      setProvince(prof.province || '');
      setWard(prof.ward || '');
      setAddressDetail(prof.addressDetail || '');
      setGrade(prof.grade || '');
      setHighSchool(prof.highSchool || '');
      setSurveyState(prof.survey || null);

      if (prof.invoice) {
        setBuyerName(prof.invoice.buyerName || user?.displayName || '');
        setBuyerAddress(prof.invoice.address || '');
        setCompanyName(prof.invoice.companyName || '');
        setTaxCode(prof.invoice.taxCode || '');
        setInvoiceEmail(prof.invoice.invoiceEmail || user?.email || '');
      }

      if (prof.notifications) {
        setNotifications(prof.notifications);
      }
    };

    applyProfile();
    window.addEventListener('elec-user-profile-change', applyProfile);
    return () => window.removeEventListener('elec-user-profile-change', applyProfile);
  }, [uid, user]);

  const showToast = (text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fullName = joinNameParts(lastName, firstName);

  // Lưu thông tin cá nhân
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!firstName.trim()) {
      setFormErr('Vui lòng nhập Tên của bạn.');
      return;
    }
    const check = validateProfileFields({ fullName, birthDate, phone });
    if (!check.ok) {
      const firstErr = Object.values(check.errors)[0];
      setFormErr(firstErr);
      return;
    }

    setSaving(true);
    try {
      saveUserProfile(uid, {
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        fullName: check.cleaned.fullName,
        birthDate: check.cleaned.birthDate,
        phone: check.cleaned.phone,
        province,
        ward: ward.trim(),
        addressDetail: addressDetail.trim(),
        grade,
        highSchool: highSchool.trim(),
      });

      // Đồng bộ vào Auth Display Name nếu khác
      if (check.cleaned.fullName !== (user?.displayName || '')) {
        await updateDisplayName(check.cleaned.fullName);
      }

      showToast('Đã lưu thay đổi hồ sơ thành công!');
    } catch (err) {
      setFormErr('Lỗi lưu thông tin: ' + (err?.message || 'Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  // Lưu thông tin hóa đơn
  const handleSaveInvoice = (e) => {
    e.preventDefault();
    saveUserProfile(uid, {
      invoice: {
        buyerName: buyerName.trim(),
        address: buyerAddress.trim(),
        companyName: companyName.trim(),
        taxCode: taxCode.trim(),
        invoiceEmail: invoiceEmail.trim(),
      },
    });
    showToast('Đã cập nhật thông tin xuất hóa đơn!');
  };

  // Lưu cài đặt thông báo
  const handleSaveNotifications = (e) => {
    e.preventDefault();
    saveUserProfile(uid, {
      notifications,
    });
    showToast('Đã lưu tùy chọn thông báo học tập!');
  };

  // Đổi mật khẩu
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) {
      alert('Mật khẩu mới phải từ 6 ký tự.');
      return;
    }
    if (newPw !== confirmPw) {
      alert('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(oldPw, newPw);
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
      showToast('Đổi mật khẩu thành công!');
    } catch (err) {
      alert('Lỗi đổi mật khẩu: ' + (err?.message || 'Mật khẩu cũ không đúng.'));
    } finally {
      setSaving(false);
    }
  };

  const initial = (fullName.trim().charAt(0) || user?.displayName?.charAt(0) || 'N').toUpperCase();

  return (
    <div className="ns9-pe-container">
      {/* Toast thông báo nổi */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: '#10b981',
          color: '#ffffff',
          padding: '12px 22px',
          borderRadius: 999,
          fontWeight: 700,
          fontSize: '0.88rem',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toastMsg}
        </div>
      )}

      {/* ── THANH TIÊU ĐỀ TRÊN CÙNG (Khớp Ảnh 1) ── */}
      <div className="ns9-pe-top-bar">
        <button
          type="button"
          className="ns9-pe-back-btn"
          onClick={onBack}
          aria-label="Quay lại"
          title="Quay lại trang cá nhân"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="ns9-pe-heading-wrap">
          <h1 className="ns9-pe-title">Chỉnh sửa hồ sơ</h1>
          <p className="ns9-pe-subtitle">Cập nhật thông tin cá nhân và mục tiêu học tập</p>
        </div>
      </div>

      {/* ── BỐ CỤC 2 CỘT (Khớp 100% Ảnh 1) ── */}
      <div className="ns9-pe-layout">
        {/* ============================================================
           CỘT TRÁI: AVATAR CARD + MENU ĐIỀU HƯỚNG + BANNER NOTE
           ============================================================ */}
        <div className="ns9-pe-col-left">
          {/* Thẻ 1: Avatar & Tên */}
          <div className="ns9-pe-card-user">
            <div className="ns9-pe-avatar-box">
              <div className="ns9-pe-avatar-circle" style={{ background: 'transparent', boxShadow: 'none' }}>
                <UserAvatar user={user} size={86} title={fullName} />
              </div>
              <button
                type="button"
                className="ns9-pe-avatar-camera"
                onClick={onOpenAvatarModal}
                title="Thay đổi ảnh đại diện"
                aria-label="Thay đổi ảnh đại diện"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>

            <h3 className="ns9-pe-user-name">{fullName}</h3>
            <p className="ns9-pe-user-school">{highSchool || 'Chưa cập nhật trường lớp'}</p>
          </div>

          {/* Thẻ 2: Menu điều hướng dọc đầy đủ các mục (Chuẩn 100% chức năng) */}
          <div className="ns9-pe-nav-card">
            {/* Thông tin cá nhân */}
            <button
              type="button"
              className={`ns9-pe-nav-item ${activeSubTab === 'info' ? 'is-active' : ''}`}
              onClick={() => setActiveSubTab('info')}
            >
              <span className="ns9-pe-nav-ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span>Thông tin cá nhân</span>
            </button>

            {/* Xuất hóa đơn */}
            <button
              type="button"
              className={`ns9-pe-nav-item ${activeSubTab === 'invoice' ? 'is-active' : ''}`}
              onClick={() => setActiveSubTab('invoice')}
            >
              <span className="ns9-pe-nav-ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </span>
              <span>Xuất hóa đơn</span>
            </button>

            {/* Lịch sử thanh toán & Gói */}
            <button
              type="button"
              className={`ns9-pe-nav-item ${activeSubTab === 'billing' ? 'is-active' : ''}`}
              onClick={() => setActiveSubTab('billing')}
            >
              <span className="ns9-pe-nav-ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </span>
              <span>Lịch sử thanh toán</span>
            </button>

            {/* Báo lỗi & Góp ý của tôi */}
            <button
              type="button"
              className={`ns9-pe-nav-item ${activeSubTab === 'reports' ? 'is-active' : ''}`}
              onClick={() => setActiveSubTab('reports')}
            >
              <span className="ns9-pe-nav-ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </span>
              <span>Báo lỗi của tôi</span>
            </button>

            {/* Chiêu mộ & hoa hồng */}
            <button
              type="button"
              className={`ns9-pe-nav-item ${activeSubTab === 'referral' ? 'is-active' : ''}`}
              onClick={() => setActiveSubTab('referral')}
            >
              <span className="ns9-pe-nav-ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" rx="1" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </span>
              <span>Chiêu mộ &amp; hoa hồng</span>
            </button>

            {/* Thông báo */}
            <button
              type="button"
              className={`ns9-pe-nav-item ${activeSubTab === 'notifications' ? 'is-active' : ''}`}
              onClick={() => setActiveSubTab('notifications')}
            >
              <span className="ns9-pe-nav-ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <span>Thông báo</span>
            </button>

            {/* Bảo mật & thiết bị */}
            <button
              type="button"
              className={`ns9-pe-nav-item ${activeSubTab === 'security' ? 'is-active' : ''}`}
              onClick={() => setActiveSubTab('security')}
            >
              <span className="ns9-pe-nav-ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <span>Bảo mật &amp; thiết bị</span>
            </button>
          </div>

          {/* Thẻ 3: ELEC AI NOTE */}
          <div className="ns9-pe-note-card">
            <div className="ns9-pe-note-badge">
              <span className="ns9-pe-note-dot" />
              ELEC AI NOTE
            </div>
            <p className="ns9-pe-note-text">
              Lưu hồ sơ ELEC AI để cá nhân hoá lộ trình cho em.
            </p>
            <div className="ns9-pe-note-mascot">
              <ChibiMascot />
            </div>
          </div>
        </div>

        {/* ============================================================
           CỘT PHẢI: FORM CHÍNH THEO TAB CHỌN
           ============================================================ */}
        <div className="ns9-pe-col-right">
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeSubTab === 'info' && (
            <form onSubmit={handleSaveInfo}>
              <div className="ns9-pe-form-header">
                <div className="ns9-pe-form-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className="ns9-pe-form-title">Thông tin cá nhân</h2>
                  <p className="ns9-pe-form-sub">Dùng để cá nhân hoá lộ trình và xếp hạng theo trường, tỉnh.</p>
                </div>
              </div>

              {isGoogle && (!birthDate || !phone || !province || !highSchool) && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.22)',
                  marginBottom: 16,
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  color: '#1e40af',
                }}>
                  <b>Lưu ý tài khoản Google:</b> Google chỉ tự động cung cấp Họ tên, Email và Ảnh đại diện.
                  Các thông tin còn lại (Ngày sinh, SĐT, Tỉnh/TP, Lớp, Trường) hiện đang để trống để bạn tự điền chính xác.
                </div>
              )}

              {formErr && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#dc2626',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: 14,
                }}>
                  {formErr}
                </div>
              )}

              <div className="ns9-pe-form-grid">
                {/* Hàng 1: Họ & Tên */}
                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Họ &amp; tên đệm
                  </label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="VD: Nguyễn Văn"
                    maxLength={40}
                  />
                </div>

                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Tên <span className="ns9-pe-req">*</span>
                  </label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="VD: An"
                    maxLength={20}
                    required
                  />
                </div>

                {/* Hàng 2: Email & Ngày tháng năm sinh */}
                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Email {user?.emailVerified ? '(Đã xác thực)' : '(Chưa xác thực)'}
                  </label>
                  <input
                    type="email"
                    className="ns9-pe-input"
                    value={email}
                    disabled
                    readOnly
                  />
                </div>

                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Ngày tháng năm sinh
                  </label>
                  <div className="ns9-pe-input-box">
                    <input
                      type="date"
                      className="ns9-pe-input"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Hàng 3: Số điện thoại & Lớp */}
                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Số điện thoại
                  </label>
                  <div className="ns9-pe-input-box">
                    <span className="ns9-pe-input-ico">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      className="ns9-pe-input has-ico"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0912345678 (tuỳ chọn)"
                    />
                  </div>
                </div>

                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Lớp / Đối tượng
                  </label>
                  <select
                    className="ns9-pe-input"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="">Chọn lớp / vai trò</option>
                    {GRADES_LIST.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Hàng 4: Tỉnh / Thành phố & Phường / Xã / Đặc khu */}
                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Tỉnh / Thành phố
                  </label>
                  <div className="ns9-pe-input-box">
                    <span className="ns9-pe-input-ico">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <select
                      className="ns9-pe-input has-ico"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                    >
                      <option value="">Chọn tỉnh / thành phố</option>
                      {VIETNAM_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Phường / Xã / Đặc khu
                  </label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="VD: Phường Dịch Vọng / Xã Tân Lập"
                    maxLength={60}
                  />
                </div>

                {/* Hàng 5: Thôn / Xóm / Số nhà & Trường */}
                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Thôn / Xóm / Số nhà (tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="VD: Số 12, Thôn Đông"
                    maxLength={120}
                  />
                </div>

                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">
                    Trường THPT đang học / công tác
                  </label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={highSchool}
                    onChange={(e) => setHighSchool(e.target.value)}
                    placeholder="Nhập tên trường (VD: THPT Lê Quý Đôn)"
                  />
                </div>
              </div>

              {/* Khối trạng thái Khảo sát cá nhân hóa AI */}
              <div style={{
                marginTop: 18,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(15, 23, 42, 0.03)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <strong style={{ fontSize: '0.88rem', display: 'block' }}>
                    Khảo sát cá nhân hóa Gia sư AI
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {surveyState?.completed
                      ? 'Đã hoàn thành khảo sát — ELEC AI đang điều chỉnh câu trả lời theo mục tiêu của bạn.'
                      : 'Chưa làm khảo sát — dành 30 giây để AI hiểu trình độ và phong cách học của bạn.'}
                  </span>
                </div>
                <button
                  type="button"
                  className="ns9-pe-back-btn"
                  style={{ width: 'auto', height: 38, padding: '0 14px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700 }}
                  onClick={() => window.dispatchEvent(new CustomEvent('elec-open-onboarding-survey', { detail: { force: true } }))}
                >
                  {surveyState?.completed ? 'Cập nhật khảo sát AI' : 'Làm khảo sát ngay'}
                </button>
              </div>

              {/* Dưới cùng: Ghi chú & Nút lưu thay đổi */}
              <div className="ns9-pe-form-footer">
                <span className="ns9-pe-footer-note">
                  Hồ sơ được đồng bộ an toàn lên đám mây theo tài khoản của bạn.
                </span>
                <button
                  type="submit"
                  className="ns9-pe-save-btn"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: XUẤT HÓA ĐƠN */}
          {activeSubTab === 'invoice' && (
            <form onSubmit={handleSaveInvoice}>
              <div className="ns9-pe-form-header">
                <div className="ns9-pe-form-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className="ns9-pe-form-title">Thông tin xuất hóa đơn</h2>
                  <p className="ns9-pe-form-sub">Dùng để xuất hóa đơn GTGT điện tử khi nạp ELEC AI Credit hoặc gói ôn thi.</p>
                </div>
              </div>

              <div className="ns9-pe-form-grid">
                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">Họ tên người mua / Người đại diện</label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">Tên cơ quan / Công ty (nếu có)</label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Công ty / Trường học"
                  />
                </div>

                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">Mã số thuế (nếu có)</label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="0101234567"
                  />
                </div>

                <div className="ns9-pe-field">
                  <label className="ns9-pe-label">Email nhận hóa đơn</label>
                  <input
                    type="email"
                    className="ns9-pe-input"
                    value={invoiceEmail}
                    onChange={(e) => setInvoiceEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="ns9-pe-field is-full">
                  <label className="ns9-pe-label">Địa chỉ đầy đủ</label>
                  <input
                    type="text"
                    className="ns9-pe-input"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                  />
                </div>
              </div>

              <div className="ns9-pe-form-footer">
                <span className="ns9-pe-footer-note">Thông tin được bảo mật và mã hóa an toàn.</span>
                <button type="submit" className="ns9-pe-save-btn">
                  Lưu thông tin hóa đơn
                </button>
              </div>
            </form>
          )}

          {/* TAB: LỊCH SỬ THANH TOÁN & GÓI */}
          {activeSubTab === 'billing' && (
            <div>
              <div className="ns9-pe-form-header">
                <div className="ns9-pe-form-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3 className="ns9-pe-form-title">Lịch sử thanh toán &amp; Gói dịch vụ</h3>
                  <p className="ns9-pe-form-desc">Quản lý trạng thái gói tài khoản và theo dõi các giao dịch nạp điểm.</p>
                </div>
              </div>

              {/* Thông tin gói hiện tại */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(59,130,246,0.02))',
                border: '1px solid rgba(37,99,235,0.15)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 0 3px rgba(16,185,129,0.2)'
                    }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Gói đang kích hoạt
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                    {subData?.planName === 'VIP' ? 'ELEC AI Học Sinh VIP' : subData?.planName === 'PRO' ? 'ELEC AI Giáo Viên PRO' : 'Gói Miễn Phí (Standard Free)'}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Thời hạn: <b>{subData?.durationLabel || 'Trọn mùa thi'}</b> • Quyền truy cập: <b>{subData?.examAccessLabel || 'Toàn bộ đề thi'}</b>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="ns9-pe-save-btn"
                    style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                    onClick={() => {
                      window.location.hash = '#profile?tab=vip';
                    }}
                  >
                    Nâng cấp / Gia hạn gói
                  </button>
                  <button
                    type="button"
                    className="ns9-pe-back-btn"
                    style={{ width: 'auto', height: 42, padding: '0 16px', borderRadius: 12, fontSize: '0.86rem', fontWeight: 600 }}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('elec-open-credit-topup'));
                    }}
                  >
                    Nạp thêm Credit
                  </button>
                </div>
              </div>

              {/* Bảng danh sách giao dịch */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Danh sách giao dịch</h4>
              {txList.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: 14, border: '1px dashed #cbd5e1' }}>
                  <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '0.9rem' }}>Chưa có giao dịch thanh toán hoặc nạp điểm nào.</p>
                  <button
                    type="button"
                    className="ns9-pe-save-btn"
                    style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                    onClick={() => window.dispatchEvent(new CustomEvent('elec-open-credit-topup'))}
                  >
                    Nạp ELEC AI Credit ngay
                  </button>
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Mã GD</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Nội dung</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Số tiền / Điểm</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Thời gian</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txList.map((tx, idx) => (
                        <tr key={tx.id || idx} style={{ borderBottom: idx < txList.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>{tx.id}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 500 }}>{tx.title}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{tx.amount}</td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.82rem' }}>{tx.at}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: 980,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: 'rgba(16,185,129,0.1)',
                              color: '#10b981'
                            }}>
                              {tx.status || 'Thành công'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: BÁO LỖI & GÓP Ý */}
          {activeSubTab === 'reports' && (
            <div>
              <div className="ns9-pe-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="ns9-pe-form-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="ns9-pe-form-title">Báo lỗi &amp; Góp ý của tôi</h3>
                    <p className="ns9-pe-form-desc">Theo dõi các phản hồi, góp ý và báo lỗi đã gửi tới đội ngũ ELEC AI.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="ns9-pe-save-btn"
                  style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                  onClick={() => window.dispatchEvent(new CustomEvent('elec-open-feedback-modal'))}
                >
                  + Gửi góp ý mới
                </button>
              </div>

              {reportList.length === 0 ? (
                <div style={{ padding: '42px 24px', textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0e7ff', color: '#3b82f6', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '0.92rem', fontWeight: 500 }}>
                    Bạn chưa gửi góp ý hay báo lỗi nào. Mọi ý kiến của bạn đều giúp ELEC AI hoàn thiện hơn!
                  </p>
                  <button
                    type="button"
                    className="ns9-pe-save-btn"
                    onClick={() => window.dispatchEvent(new CustomEvent('elec-open-feedback-modal'))}
                  >
                    Gửi góp ý ngay
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reportList.map((rp, i) => (
                    <div
                      key={rp.id || i}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 980,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: rp.kind === 'report' ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)',
                            color: rp.kind === 'report' ? '#ef4444' : '#2563eb'
                          }}>
                            {rp.category || (rp.kind === 'report' ? 'Báo lỗi đề thi' : 'Góp ý tính năng')}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{rp.at}</span>
                        </div>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 980,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: rp.status === 'Đã giải quyết' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: rp.status === 'Đã giải quyết' ? '#10b981' : '#f59e0b'
                        }}>
                          {rp.status || 'Đã tiếp nhận'}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.5 }}>
                        {rp.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CHIÊU MỘ & HOA HỒNG */}
          {activeSubTab === 'referral' && (
            <div>
              <div className="ns9-pe-form-header">
                <div className="ns9-pe-form-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" rx="1" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="ns9-pe-form-title">Chiêu mộ &amp; Hoa hồng giới thiệu</h3>
                  <p className="ns9-pe-form-desc">Mời bạn bè cùng học tập và nhận thưởng ELEC AI Credit không giới hạn.</p>
                </div>
              </div>

              {/* Thẻ mã giới thiệu */}
              <div style={{
                padding: '24px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(245,158,11,0.06))',
                border: '1px solid rgba(37,99,235,0.18)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Mã giới thiệu độc quyền của bạn
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', letterSpacing: '0.05em', marginTop: 4 }}>
                    {referralCode}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Chia sẻ mã này cho bạn bè. Khi bạn bè nhập mã tại trang Cá nhân, cả hai sẽ nhận ngay <b>+15 điểm AI</b>!
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="ns9-pe-save-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      showToast('Đã sao chép mã giới thiệu!');
                    }}
                  >
                    Sao chép mã
                  </button>
                  <button
                    type="button"
                    className="ns9-pe-back-btn"
                    style={{ width: 'auto', height: 44, padding: '0 16px', borderRadius: 12, fontSize: '0.86rem', fontWeight: 600 }}
                    onClick={() => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}#profile?ref=${referralCode}`;
                      navigator.clipboard.writeText(shareUrl);
                      showToast('Đã sao chép liên kết giới thiệu!');
                    }}
                  >
                    Sao chép link
                  </button>
                </div>
              </div>

              {/* Lợi ích */}
              <div className="ns9-pe-form-grid" style={{ marginBottom: 20 }}>
                <div style={{ padding: '16px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: '0.92rem', color: '#2563eb', display: 'block', marginBottom: 4 }}>+15 điểm cho mỗi bạn</strong>
                  <span style={{ fontSize: '0.83rem', color: '#64748b' }}>Cộng ngay vào số dư Credit AI khả dụng để giải bài tập, dịch đề và hỏi gia sư.</span>
                </div>
                <div style={{ padding: '16px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: '0.92rem', color: '#10b981', display: 'block', marginBottom: 4 }}>Không giới hạn lượt mời</strong>
                  <span style={{ fontSize: '0.83rem', color: '#64748b' }}>Mời càng nhiều bạn bè tham gia học tập, điểm thưởng tích lũy càng lớn.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THÔNG BÁO */}
          {activeSubTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications}>
              <div className="ns9-pe-form-header">
                <div className="ns9-pe-form-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h2 className="ns9-pe-form-title">Cài đặt thông báo</h2>
                  <p className="ns9-pe-form-sub">Tùy chỉnh thông báo nhắc nhở giữ chuỗi học tập và kết quả thi thử.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'dailyStreak', title: 'Nhắc nhở chuỗi học tập hàng ngày', desc: 'Nhắc em ôn bài đúng giờ để không đứt chuỗi Streak ngọn lửa.' },
                  { key: 'examRoomAlerts', title: 'Thông báo phòng thi thử trực tuyến', desc: 'Nhận thông báo khi phòng thi LIVE mở cửa và khi có bảng xếp hạng.' },
                  { key: 'newExamAlerts', title: 'Cập nhật đề thi mới từ các trường Chuyên', desc: 'Thông báo khi ngân hàng đề tải lên các đề thi thử mới nhất toàn quốc.' },
                  { key: 'weeklyReport', title: 'Báo cáo năng lực học tập tuần', desc: 'Tổng kết điểm số, dạng bài sai nhiều nhất và gợi ý lộ trình cải thiện.' },
                ].map((item) => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ paddingRight: 16 }}>
                      <strong style={{ fontSize: '0.88rem', display: 'block', color: 'inherit' }}>{item.title}</strong>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>{item.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(notifications[item.key])}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2563eb' }}
                    />
                  </label>
                ))}
              </div>

              <div className="ns9-pe-form-footer">
                <span className="ns9-pe-footer-note">Cập nhật ngay vào hệ thống push &amp; email.</span>
                <button type="submit" className="ns9-pe-save-btn">
                  Lưu tùy chọn thông báo
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: BẢO MẬT & THIẾT BỊ */}
          {activeSubTab === 'security' && (
            <div>
              <div className="ns9-pe-form-header">
                <div className="ns9-pe-form-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h2 className="ns9-pe-form-title">Bảo mật &amp; Thiết bị</h2>
                  <p className="ns9-pe-form-sub">Đổi mật khẩu, quản lý phiên đăng nhập và bảo vệ tài khoản.</p>
                </div>
              </div>

              {isGoogle ? (
                <div style={{ padding: '16px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 18 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    Tài khoản của em liên kết trực tiếp qua Google OAuth. Mật khẩu được Google bảo vệ an toàn, không cần đổi tại đây.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSavePassword} style={{ marginBottom: 24 }}>
                  <div className="ns9-pe-form-grid">
                    <div className="ns9-pe-field is-full">
                      <label className="ns9-pe-label">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        className="ns9-pe-input"
                        placeholder="••••••••"
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        required
                      />
                    </div>
                    <div className="ns9-pe-field">
                      <label className="ns9-pe-label">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                      <input
                        type="password"
                        className="ns9-pe-input"
                        placeholder="••••••••"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        required
                      />
                    </div>
                    <div className="ns9-pe-field">
                      <label className="ns9-pe-label">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        className="ns9-pe-input"
                        placeholder="••••••••"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="ns9-pe-form-footer">
                    <span className="ns9-pe-footer-note">Nên dùng kết hợp chữ hoa, chữ thường và chữ số.</span>
                    <button type="submit" className="ns9-pe-save-btn" disabled={saving || !oldPw || !newPw}>
                      {saving ? 'Đang đổi…' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              )}

              {/* Trạng thái xác thực email */}
              <div style={{
                padding: '16px',
                borderRadius: 14,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <strong style={{ fontSize: '0.88rem', display: 'block' }}>Xác thực Email tài khoản</strong>
                  <span style={{ fontSize: '0.78rem', color: user?.emailVerified ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {user?.emailVerified ? 'Email đã được xác thực an toàn' : 'Email chưa xác thực'}
                  </span>
                </div>
                {!user?.emailVerified && (
                  <button
                    type="button"
                    className="ns9-pe-save-btn"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    onClick={async () => {
                      try {
                        await sendVerifyEmail();
                        showToast('Đã gửi email xác thực! Kiểm tra hộp thư của em nhé.');
                      } catch (err) {
                        alert(err?.message || 'Không thể gửi email xác thực.');
                      }
                    }}
                  >
                    Gửi email xác thực
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NÚT LINH VẬT NỔI Ở GÓC PHẢI DƯỚI (Khớp 100% Ảnh 1) ── */}
      <button
        type="button"
        className="ns9-pe-float-mascot-btn"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('elec-open-feedback-modal'));
        }}
        title="Chạm vô để góp ý hoặc hỏi trợ lý ELEC AI"
      >
        <span className="ns9-pe-float-mascot-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </span>
        <span>Chạm vô ELEC AI nè ^^</span>
      </button>
    </div>
  );
}
