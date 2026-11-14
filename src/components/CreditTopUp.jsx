import { useState, useEffect, useRef, useMemo } from 'react';
import {
  CREDIT_PACKAGES,
  BANK_INFO,
  createPaymentOrder,
  getCredits,
  onOrderPaid,
  checkOrderStatus,
  claimWelcomeBonus,
  checkWelcomeClaimed,
  grantActivationCredits,
} from '../lib/creditService.js';
import { activateProKey } from '../lib/proKeyApi.js';
import { getUserProfile, saveUserProfile } from '../lib/userProfileService.js';
import './CreditTopUp.css';

/* ============================================================
   SVG ICONS & COIN GRAPHICS (100% SVG thuần — Không dùng emoji)
   ============================================================ */

/* 1 Đồng Coin Vàng */
function CoinSingleSvg({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="goldGrad1" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <filter id="coinShadow1" x="0" y="2" width="64" height="62" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#b45309" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#coinShadow1)">
        <circle cx="32" cy="31" r="24" fill="url(#goldGrad1)" stroke="#d97706" strokeWidth="2" />
        <circle cx="32" cy="31" r="19" stroke="#fef9c3" strokeWidth="1.5" strokeOpacity="0.8" />
        <text x="32" y="38" textAnchor="middle" fill="#78350f" fontSize="20" fontWeight="900" fontFamily="system-ui, sans-serif">C</text>
      </g>
    </svg>
  );
}

/* 2 Đồng Coin Vàng Xếp Chồng */
function CoinDoubleSvg({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 76 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="goldGrad2" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Coin sau */}
      <circle cx="28" cy="30" r="22" fill="url(#goldGrad2)" stroke="#b45309" strokeWidth="2" opacity="0.9" />
      <circle cx="28" cy="30" r="17" stroke="#fef9c3" strokeWidth="1.2" strokeOpacity="0.7" />
      <text x="28" y="37" textAnchor="middle" fill="#78350f" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif">C</text>

      {/* Coin trước */}
      <circle cx="48" cy="33" r="22" fill="url(#goldGrad2)" stroke="#d97706" strokeWidth="2" />
      <circle cx="48" cy="33" r="17" stroke="#fef9c3" strokeWidth="1.5" strokeOpacity="0.8" />
      <text x="48" y="40" textAnchor="middle" fill="#78350f" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif">C</text>
    </svg>
  );
}

/* 3 Đồng Coin Vàng Xếp Chồng (PREMIUM) */
function CoinTripleSvg({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 84 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="goldGrad3" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Sparkles */}
      <path d="M12 18l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#f59e0b" />
      <path d="M72 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#fbbf24" />

      {/* Coin 1 */}
      <circle cx="26" cy="33" r="20" fill="url(#goldGrad3)" stroke="#b45309" strokeWidth="1.8" opacity="0.85" />
      <text x="26" y="39" textAnchor="middle" fill="#78350f" fontSize="16" fontWeight="900" fontFamily="system-ui, sans-serif">C</text>

      {/* Coin 2 */}
      <circle cx="44" cy="27" r="20" fill="url(#goldGrad3)" stroke="#d97706" strokeWidth="1.8" />
      <text x="44" y="33" textAnchor="middle" fill="#78350f" fontSize="16" fontWeight="900" fontFamily="system-ui, sans-serif">C</text>

      {/* Coin 3 */}
      <circle cx="58" cy="36" r="20" fill="url(#goldGrad3)" stroke="#d97706" strokeWidth="2" />
      <circle cx="58" cy="36" r="16" stroke="#fef9c3" strokeWidth="1.2" strokeOpacity="0.8" />
      <text x="58" y="42" textAnchor="middle" fill="#78350f" fontSize="17" fontWeight="900" fontFamily="system-ui, sans-serif">C</text>
    </svg>
  );
}

/* Linh vật ELEC AI tách nền cầm cúp / sách cao cấp */
function StudyMascot() {
  return (
    <img
      src="/img/elec/elec-cool.png"
      alt="ELEC AI"
      className="ns9-cr-header-img"
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        filter: 'drop-shadow(0 10px 22px rgba(37,99,235,0.22))',
      }}
    />
  );
}

/* ============================================================
   MAIN COMPONENT — MUA ELEC AI CREDIT
   ============================================================ */
export default function CreditTopUp({ userId, onCreditUpdate, onClose, isOpen: propIsOpen }) {
  const [isOpen, setIsOpen] = useState(Boolean(propIsOpen ?? false));
  const [balance, setBalance] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(100000); // Mặc định gói Premium 100.000đ
  const [step, setStep] = useState('select'); // 'select' | 'qr'
  const [orderData, setOrderData] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(1800); // 30 phút

  // Thông tin xuất hóa đơn
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [invoiceError, setInvoiceError] = useState('');

  // Mã kích hoạt / Voucher
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activatingCode, setActivatingCode] = useState(false);
  const [activationMsg, setActivationMsg] = useState(null);

  const unsubOrderRef = useRef(null);

  // Lắng nghe sự kiện mở / đóng modal toàn cục
  useEffect(() => {
    const handleGlobalOpen = () => {
      setIsOpen(true);
      setStep('select');
    };
    const handleGlobalClose = () => {
      setIsOpen(false);
    };
    window.addEventListener('elec-open-credit-topup', handleGlobalOpen);
    window.addEventListener('elec-close-credit-topup', handleGlobalClose);
    return () => {
      window.removeEventListener('elec-open-credit-topup', handleGlobalOpen);
      window.removeEventListener('elec-close-credit-topup', handleGlobalClose);
    };
  }, []);

  useEffect(() => {
    if (propIsOpen !== undefined) setIsOpen(propIsOpen);
  }, [propIsOpen]);

  // Tải số dư và profile
  useEffect(() => {
    if (!userId) return;
    getCredits(userId).then((c) => {
      setBalance(c.balance);
    });

    const prof = getUserProfile(userId);
    setBuyerName(prof.invoice?.buyerName || prof.fullName || '');
    setBuyerAddress(prof.invoice?.address || '');
  }, [userId]);

  // Các gói chính hiển thị theo Ảnh 4: PRO 2 (30k), PRO 3 (60k), PREMIUM (100k)
  const displayPackages = useMemo(() => {
    return CREDIT_PACKAGES.filter((p) => [30000, 60000, 100000].includes(p.amount));
  }, []);

  const selectedPkg = useMemo(() => {
    return (
      CREDIT_PACKAGES.find((p) => p.amount === selectedAmount) ||
      displayPackages[2] ||
      CREDIT_PACKAGES[1]
    );
  }, [selectedAmount, displayPackages]);

  // Đếm ngược QR
  useEffect(() => {
    if (step !== 'qr') return;
    setCountdown(1800);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Tự động Polling kiểm tra trạng thái đơn hàng khi ở màn hình QR (3 giây / lần)
  useEffect(() => {
    if (step !== 'qr' || !orderData?.order?.id) return;
    const interval = setInterval(async () => {
      try {
        const order = await checkOrderStatus(orderData.order.id);
        if (order?.status === 'paid') {
          clearInterval(interval);
          const effectiveUserId = userId || 'guest_user';
          const fresh = await getCredits(effectiveUserId);
          setBalance(fresh.balance);
          onCreditUpdate?.(fresh.balance);
          alert('Thanh toán thành công! ELEC AI Credit đã được cộng ngay vào tài khoản của em.');
          handleClose();
        }
      } catch { /* im lặng tiếp tục polling */ }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, orderData?.order?.id, userId]);

  // Cleanup subscription
  useEffect(() => {
    return () => {
      if (unsubOrderRef.current) unsubOrderRef.current();
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleRedeemCode = async (e) => {
    e.preventDefault();
    const clean = activationCode.trim().toUpperCase();
    if (!clean) return;
    setActivatingCode(true);
    setActivationMsg(null);
    try {
      const effectiveUserId = userId || 'guest_user';
      // Thử kích hoạt qua ProKey trước
      const res = await activateProKey(effectiveUserId, clean);
      if (res.ok) {
        const fresh = await getCredits(effectiveUserId);
        setBalance(fresh.balance);
        onCreditUpdate?.(fresh.balance);
        setActivationMsg({ ok: true, text: res.message || 'Kích hoạt thành công!' });
        setActivationCode('');
      } else {
        setActivationMsg({ ok: false, text: res.error || 'Mã kích hoạt không đúng hoặc đã qua sử dụng.' });
      }
    } catch (err) {
      setActivationMsg({ ok: false, text: err?.message || 'Lỗi khi kích hoạt mã. Vui lòng thử lại.' });
    } finally {
      setActivatingCode(false);
    }
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      alert(`Không thể sao chép. Vui lòng chép tay: ${text}`);
    }
  };

  // Tạo đơn hàng thanh toán
  const handleProceedPayment = async () => {
    if (!buyerName.trim()) {
      setInvoiceError('Vui lòng nhập họ tên đầy đủ để xuất hóa đơn.');
      return;
    }
    if (!buyerAddress.trim()) {
      setInvoiceError('Vui lòng nhập địa chỉ đầy đủ (số nhà, đường, phường/xã, tỉnh/thành) để xuất hóa đơn.');
      return;
    }

    setInvoiceError('');
    const effectiveUserId = userId || 'guest_user';

    // Lưu lại thông tin hóa đơn vào profile
    saveUserProfile(effectiveUserId, {
      invoice: {
        buyerName: buyerName.trim(),
        address: buyerAddress.trim(),
      },
    });

    setCreating(true);
    try {
      const order = await createPaymentOrder(effectiveUserId, selectedPkg.amount);
      setOrderData(order);
      setStep('qr');

      // Lắng nghe SePay / VietQR webhook hoàn tất đơn hàng thời gian thực
      if (order?.order?.id) {
        unsubOrderRef.current = onOrderPaid(order.order.id, async () => {
          const fresh = await getCredits(effectiveUserId);
          setBalance(fresh.balance);
          onCreditUpdate?.(fresh.balance);
          alert('Thanh toán thành công! ELEC AI Credit đã được cộng ngay vào tài khoản của em.');
          handleClose();
        });
      }
    } catch (err) {
      alert('Không thể tạo đơn hàng: ' + (err?.message || 'Vui lòng thử lại sau.'));
    } finally {
      setCreating(false);
    }
  };

  const handleCheckStatus = async () => {
    const effectiveUserId = userId || 'guest_user';
    setChecking(true);
    try {
      if (orderData?.order?.id) {
        const order = await checkOrderStatus(orderData.order.id);
        if (order?.status === 'paid') {
          const fresh = await getCredits(effectiveUserId);
          setBalance(fresh.balance);
          onCreditUpdate?.(fresh.balance);
          alert('Thanh toán thành công! ELEC AI Credit đã được cộng ngay vào tài khoản của em.');
          handleClose();
          return;
        }
      }
      const fresh = await getCredits(effectiveUserId);
      setBalance(fresh.balance);
      onCreditUpdate?.(fresh.balance);
      alert(`Đang chờ ngân hàng xác nhận giao dịch (${orderData?.transferContent || 'ELEC'}).\nSố dư hiện tại: ${fresh.balance.toLocaleString('vi-VN')} ELEC Credit.`);
    } catch {
      alert('Hệ thống đang kiểm tra, vui lòng đợi 15-30 giây.');
    } finally {
      setChecking(false);
    }
  };

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="ns9-cr-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="ns9-cr-modal" onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng */}
        <button
          type="button"
          className="ns9-cr-close-btn"
          onClick={handleClose}
          aria-label="Đóng"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── BƯỚC 1: CHỌN GÓI & THÔNG TIN HÓA ĐƠN (Khớp 100% Ảnh 4) ── */}
        {step === 'select' && (
          <div className="ns9-cr-content">
            {/* Header */}
            <div className="ns9-cr-header">
              <div className="ns9-cr-header-left">
                <div className="ns9-cr-logo-row">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span className="ns9-cr-brand">ELEC AI</span>
                </div>
                <h2 className="ns9-cr-title">Mua ELEC AI Credit</h2>
                <p className="ns9-cr-subtitle">
                  Tiếp sức học tập cùng Trợ lý ELEC AI. ELEC Credit mua thêm giữ đến khi dùng hết.
                </p>

                {/* Pill số dư */}
                <div className="ns9-cr-balance-badge">
                  <span>Số dư:</span>
                  <b>{balance != null ? balance.toLocaleString('vi-VN') : '0'} ELEC Credit</b>
                </div>
              </div>

              {/* Linh vật đọc sách góc phải */}
              <div className="ns9-cr-header-mascot">
                <StudyMascot />
              </div>
            </div>

            {/* Bố cục 2 cột */}
            <div className="ns9-cr-grid">
              {/* CỘT TRÁI: CHỌN GÓI */}
              <div className="ns9-cr-col-left">
                <h3 className="ns9-cr-col-heading">Chọn gói phù hợp với bạn</h3>

                <div className="ns9-cr-cards-row">
                  {displayPackages.map((p) => {
                    const isSelected = selectedAmount === p.amount;
                    return (
                      <div
                        key={p.amount}
                        className={`ns9-cr-pkg-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setSelectedAmount(p.amount)}
                      >
                        {p.badge && (
                          <div className="ns9-cr-pkg-ribbon">
                            {p.badge}
                          </div>
                        )}

                        <div className="ns9-cr-radio-wrap">
                          <div className={`ns9-cr-radio-circle ${isSelected ? 'checked' : ''}`} />
                        </div>

                        {/* Icon Coin */}
                        <div className="ns9-cr-coin-visual">
                          {p.amount === 30000 && <CoinSingleSvg size={54} />}
                          {p.amount === 60000 && <CoinDoubleSvg size={58} />}
                          {p.amount === 100000 && <CoinTripleSvg size={64} />}
                        </div>

                        <span className="ns9-cr-pkg-name">{p.name}</span>
                        <div className="ns9-cr-credits-row">
                          <b className="ns9-cr-credits-val">{p.credits.toLocaleString('vi-VN')}</b>
                          <span className="ns9-cr-credits-unit">Credit</span>
                        </div>
                        <span className="ns9-cr-pkg-rate">{p.rate || '~1đ / credit'}</span>
                        <b className="ns9-cr-pkg-price">{p.amount.toLocaleString('vi-VN')} đ</b>
                      </div>
                    );
                  })}
                </div>

                {/* Nhập mã kích hoạt / Voucher */}
                <div style={{
                  marginTop: 18,
                  padding: '12px 16px',
                  background: 'var(--surface, #f8fafc)',
                  border: '1px dashed var(--border-color, #e2e8f0)',
                  borderRadius: 14,
                }}>
                  <div
                    onClick={() => setShowCodeBox(!showCodeBox)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--primary, #2563eb)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L10 10l1.5 1.5L9 14l-1.5-1.5L5 15l1.5 1.5L4 19l-2 3 3-2 2.5-2.5L11 19l2.5-2.5L16 19l2.5-2.5L21 19l1-1-6-6 4-4z" />
                        <circle cx="7.5" cy="7.5" r="2.5" />
                      </svg>
                      <span>Bạn có Mã kích hoạt / Voucher tặng điểm?</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{showCodeBox ? 'Thu gọn' : 'Nhập mã'}</span>
                  </div>

                  {showCodeBox && (
                    <form onSubmit={handleRedeemCode} style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhập mã (VD: ELEC-VIP, PRO...)"
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: 10,
                          fontSize: '0.82rem',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={activatingCode || !activationCode.trim()}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {activatingCode ? 'Đang nạp…' : 'Kích hoạt'}
                      </button>
                    </form>
                  )}

                  {activationMsg && (
                    <div style={{
                      marginTop: 8,
                      fontSize: '0.8rem',
                      color: activationMsg.ok ? '#16a34a' : '#dc2626',
                      fontWeight: 500,
                    }}>
                      {activationMsg.text}
                    </div>
                  )}
                </div>
              </div>

              {/* CỘT PHẢI: THÔNG TIN XUẤT HÓA ĐƠN & THANH TOÁN */}
              <div className="ns9-cr-col-right">
                <div className="ns9-cr-invoice-box">
                  <h4 className="ns9-cr-invoice-title">Thông tin xuất hóa đơn</h4>
                  <p className="ns9-cr-invoice-sub">
                    Bắt buộc để ELEC AI xuất hóa đơn cho đơn này.
                  </p>

                  <div className="ns9-cr-field">
                    <label className="ns9-cr-label">Họ tên đầy đủ</label>
                    <input
                      type="text"
                      className={`ns9-cr-input ${invoiceError && !buyerName.trim() ? 'ns9-cr-input-err' : ''}`}
                      placeholder="Nguyễn Văn A"
                      value={buyerName}
                      onChange={(e) => {
                        setBuyerName(e.target.value);
                        if (invoiceError) setInvoiceError('');
                      }}
                    />
                  </div>

                  <div className="ns9-cr-field">
                    <label className="ns9-cr-label">Địa chỉ đầy đủ</label>
                    <input
                      type="text"
                      className={`ns9-cr-input ${invoiceError && !buyerAddress.trim() ? 'ns9-cr-input-err' : ''}`}
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                      value={buyerAddress}
                      onChange={(e) => {
                        setBuyerAddress(e.target.value);
                        if (invoiceError) setInvoiceError('');
                      }}
                    />
                  </div>

                  {invoiceError && (
                    <div style={{
                      marginTop: 6,
                      marginBottom: 8,
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 10,
                      color: '#dc2626',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{invoiceError}</span>
                    </div>
                  )}

                  <div className="ns9-cr-summary-row">
                    <span className="ns9-cr-summary-name">{selectedPkg.name}</span>
                    <span className="ns9-cr-summary-credits">
                      {selectedPkg.credits.toLocaleString('vi-VN')} ELEC Credit
                    </span>
                  </div>

                  <div className="ns9-cr-total-row">
                    <span className="ns9-cr-total-label">Tổng thanh toán</span>
                    <span className="ns9-cr-total-val">
                      {selectedPkg.amount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <button
                    type="button"
                    className="ns9-cr-pay-btn"
                    onClick={handleProceedPayment}
                    disabled={creating}
                  >
                    {creating ? 'Đang tạo đơn QR…' : `Thanh toán ${selectedPkg.amount.toLocaleString('vi-VN')} đ`}
                  </button>

                  <p className="ns9-cr-caption">
                    Chuyển khoản QR · ELEC Credit cộng ngay khi xác nhận
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BƯỚC 2: QUÉT MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG ── */}
        {step === 'qr' && orderData && (
          <div className="ns9-cr-content ns9-cr-qr-view">
            <button
              type="button"
              className="ns9-cr-back-link"
              onClick={() => setStep('select')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Chọn gói khác
            </button>

            <div className="ns9-cr-qr-card">
              <div className="ns9-cr-qr-left">
                <div className="ns9-cr-qr-img-box">
                  <img
                    src={orderData.qrUrl}
                    alt="VietQR Chuyển khoản"
                    className="ns9-cr-qr-img"
                  />
                  <span className="ns9-cr-qr-timer">
                    Mã QR hết hạn sau: <b>{formatCountdown(countdown)}</b>
                  </span>
                </div>
              </div>

              <div className="ns9-cr-qr-right">
                <h3 className="ns9-cr-qr-title">Quét mã QR để cộng ELEC Credit</h3>
                <p className="ns9-cr-qr-desc">
                  Mở ứng dụng ngân hàng bất kỳ (MBBank, Vietcombank, Momo...) và quét mã bên trái.
                </p>

                <div className="ns9-cr-qr-detail-list">
                  {/* Ngân hàng */}
                  <div className="ns9-cr-qr-row">
                    <span className="ns9-cr-qr-label">Ngân hàng</span>
                    <strong className="ns9-cr-qr-val">{BANK_INFO.bankName}</strong>
                  </div>

                  {/* Số tài khoản */}
                  <div className="ns9-cr-qr-row">
                    <span className="ns9-cr-qr-label">Số tài khoản</span>
                    <div className="ns9-cr-qr-val-copy">
                      <strong>{BANK_INFO.accountNo}</strong>
                      <button
                        type="button"
                        className="ns9-cr-copy-chip"
                        onClick={() => copyToClipboard(BANK_INFO.accountNo, 'acc')}
                      >
                        {copiedField === 'acc' ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  {/* Tên chủ tài khoản */}
                  <div className="ns9-cr-qr-row">
                    <span className="ns9-cr-qr-label">Chủ tài khoản</span>
                    <strong className="ns9-cr-qr-val">{BANK_INFO.accountName}</strong>
                  </div>

                  {/* Số tiền */}
                  <div className="ns9-cr-qr-row">
                    <span className="ns9-cr-qr-label">Số tiền</span>
                    <div className="ns9-cr-qr-val-copy">
                      <strong style={{ color: '#2563eb' }}>
                        {orderData.amount.toLocaleString('vi-VN')} đ
                      </strong>
                      <button
                        type="button"
                        className="ns9-cr-copy-chip"
                        onClick={() => copyToClipboard(String(orderData.amount), 'amount')}
                      >
                        {copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  {/* Nội dung chuyển khoản (QUAN TRỌNG) */}
                  <div className="ns9-cr-qr-row highlight">
                    <span className="ns9-cr-qr-label">Nội dung CK</span>
                    <div className="ns9-cr-qr-val-copy">
                      <strong style={{ color: '#dc2626', fontSize: '1rem' }}>
                        {orderData.transferContent}
                      </strong>
                      <button
                        type="button"
                        className="ns9-cr-copy-chip"
                        onClick={() => copyToClipboard(orderData.transferContent, 'content')}
                      >
                        {copiedField === 'content' ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ns9-cr-qr-actions">
                  <button
                    type="button"
                    className="ns9-cr-check-btn"
                    onClick={handleCheckStatus}
                    disabled={checking}
                  >
                    {checking ? 'Đang kiểm tra…' : 'Kiểm tra trạng thái'}
                  </button>
                  <span className="ns9-cr-qr-note">
                    ELEC Credit sẽ tự động cộng sau 5–15 giây kể từ lúc giao dịch hoàn tất.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
