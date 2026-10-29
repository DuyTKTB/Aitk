import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  CREDIT_PACKAGES,
  BANK_INFO,
  createPaymentOrder,
  onOrderPaid,
} from '../lib/creditService.js';
import { activateProKey } from '../lib/proKeyApi.js';
import './out-of-credits-modal.css';

/* ============================================================
   ICONS SVG SẮC NÉT
   ============================================================ */
const SvgZap = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SvgClose = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SvgCopy = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const SvgCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgKey = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L10 10l1.5 1.5L9 14l-1.5-1.5L5 15l1.5 1.5L4 19l-2 3 3-2 2.5-2.5L11 19l2.5-2.5L16 19l2.5-2.5L21 19l1-1-6-6 4-4z" />
    <circle cx="7.5" cy="7.5" r="2.5" />
  </svg>
);

const SvgQr = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="14" y1="14" x2="21" y2="21" />
    <line x1="14" y1="21" x2="21" y2="14" />
  </svg>
);

export default function OutOfCreditsModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [needed, setNeeded] = useState(1);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'key'

  // QR state
  const [selectedPkg, setSelectedPkg] = useState(CREDIT_PACKAGES[1] || CREDIT_PACKAGES[0]); // default 25k (275 pts)
  const [orderInfo, setOrderInfo] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Key state
  const [keyCode, setKeyCode] = useState('');
  const [keyActivating, setKeyActivating] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState(null);

  // Lắng nghe sự kiện toàn cục 'elec-out-of-credits'
  useEffect(() => {
    const handleOutOfCredits = (e) => {
      const b = Number(e.detail?.balance) || 0;
      const n = Number(e.detail?.needed) || 1;
      setBalance(b);
      setNeeded(n);
      setIsOpen(true);
      setOrderSuccess(false);
      setKeyFeedback(null);
    };

    window.addEventListener('elec-out-of-credits', handleOutOfCredits);
    return () => window.removeEventListener('elec-out-of-credits', handleOutOfCredits);
  }, []);

  // Lắng nghe phím Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Tạo đơn hàng khi đổi gói hoặc mở tab QR
  useEffect(() => {
    if (!isOpen || activeTab !== 'qr' || !user?.uid) return;
    let cancel = false;

    async function makeOrder() {
      setCreatingOrder(true);
      try {
        const orderData = await createPaymentOrder(user.uid, selectedPkg.amount);
        if (!cancel) {
          setOrderInfo(orderData);
        }
      } catch (e) {
        console.warn('[OutOfCreditsModal] create order fail:', e);
      } finally {
        if (!cancel) setCreatingOrder(false);
      }
    }

    makeOrder();
    return () => { cancel = true; };
  }, [isOpen, activeTab, selectedPkg, user?.uid]);

  // Lắng nghe Realtime khi đơn hàng thanh toán thành công
  useEffect(() => {
    if (!orderInfo?.order?.id) return;
    const cleanup = onOrderPaid(orderInfo.order.id, () => {
      setOrderSuccess(true);
      try {
        window.dispatchEvent(new CustomEvent('cs-credit-update', {
          detail: { balance: balance + orderInfo.credits },
        }));
      } catch { /* */ }
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    });
    return cleanup;
  }, [orderInfo, balance]);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch { /* */ }
  };

  const handleActivateKey = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      setKeyFeedback({ ok: false, msg: 'Vui lòng đăng nhập tài khoản trước khi nạp key.' });
      return;
    }
    const clean = keyCode.trim().toUpperCase();
    if (!clean) {
      setKeyFeedback({ ok: false, msg: 'Vui lòng nhập mã key.' });
      return;
    }
    setKeyActivating(true);
    setKeyFeedback(null);
    try {
      const res = await activateProKey(user.uid, clean);
      if (res.ok) {
        setKeyFeedback({
          ok: true,
          msg: res.message || 'Kích hoạt thành công! Điểm đã được cộng vào tài khoản.',
        });
        setKeyCode('');
        setTimeout(() => {
          setIsOpen(false);
        }, 2200);
      } else {
        setKeyFeedback({ ok: false, msg: res.error || 'Mã key không hợp lệ hoặc đã qua sử dụng.' });
      }
    } catch (err) {
      setKeyFeedback({ ok: false, msg: err?.message || 'Lỗi kết nối khi nạp key.' });
    } finally {
      setKeyActivating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ooc-backdrop" onClick={() => setIsOpen(false)}>
      <div
        className="ooc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ooc-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng góc phải */}
        <button
          type="button"
          className="ooc-close-btn"
          onClick={() => setIsOpen(false)}
          aria-label="Đóng bảng thông báo"
        >
          <SvgClose size={16} />
        </button>

        {/* Header nổi bật */}
        <div className="ooc-head">
          <div className="ooc-icon-glow">
            <SvgZap size={24} />
          </div>
          <span className="ooc-badge">CẢNH BÁO TÍN DỤNG AI</span>
          <h2 id="ooc-title" className="ooc-title">
            Bạn đã hết credit
          </h2>
          <p className="ooc-desc">
            Vui lòng nạp để có thể tiếp tục sử dụng tất cả tính năng AI trong web.
          </p>

          <div className="ooc-balance-strip">
            <div className="ooc-balance-box">
              <span>Số dư hiện tại</span>
              <strong className="text-danger">{balance.toLocaleString('vi-VN')} ⚡</strong>
            </div>
            <div className="ooc-divider" />
            <div className="ooc-balance-box">
              <span>Yêu cầu tối thiểu</span>
              <strong>{needed.toLocaleString('vi-VN')} ⚡</strong>
            </div>
          </div>
        </div>

        {/* Tabs chuyển đổi giữa VietQR & Mã Key */}
        <div className="ooc-tabs">
          <button
            type="button"
            className={`ooc-tab ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <SvgQr size={15} />
            <span>Nạp siêu tốc (VietQR)</span>
          </button>
          <button
            type="button"
            className={`ooc-tab ${activeTab === 'key' ? 'active' : ''}`}
            onClick={() => setActiveTab('key')}
          >
            <SvgKey size={15} />
            <span>Nhập mã thẻ nạp / Key</span>
          </button>
        </div>

        {/* Nội dung Tab 1: VietQR */}
        {activeTab === 'qr' && (
          <div className="ooc-tab-body">
            {orderSuccess ? (
              <div className="ooc-success-box">
                <div className="ooc-success-ico">
                  <SvgCheck size={28} />
                </div>
                <h3>Nạp điểm thành công!</h3>
                <p>Hệ thống đã tự động cộng +{orderInfo?.credits?.toLocaleString('vi-VN')} điểm AI vào tài khoản của bạn.</p>
              </div>
            ) : (
              <>
                <div className="ooc-packages-grid">
                  {CREDIT_PACKAGES.slice(0, 4).map((pkg) => {
                    const isSelected = selectedPkg.amount === pkg.amount;
                    return (
                      <button
                        key={pkg.amount}
                        type="button"
                        className={`ooc-pkg-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedPkg(pkg)}
                      >
                        <div className="ooc-pkg-pts">
                          <b>+{pkg.total.toLocaleString('vi-VN')}</b>
                          <small>credit</small>
                        </div>
                        <div className="ooc-pkg-price">{pkg.label}</div>
                        {pkg.badge && <span className="ooc-pkg-tag">{pkg.badge}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="ooc-qr-area">
                  <div className="ooc-qr-image-wrap">
                    {creatingOrder ? (
                      <div className="ooc-qr-loader">Đang tạo mã QR…</div>
                    ) : orderInfo?.qrUrl ? (
                      <img src={orderInfo.qrUrl} alt="Mã thanh toán VietQR" className="ooc-qr-img" />
                    ) : (
                      <div className="ooc-qr-loader">Chưa thể tải mã QR</div>
                    )}
                  </div>

                  <div className="ooc-bank-details">
                    <div className="ooc-bank-row">
                      <span>Ngân hàng:</span>
                      <strong>{BANK_INFO.bankName}</strong>
                    </div>
                    <div className="ooc-bank-row">
                      <span>Số tài khoản:</span>
                      <div className="ooc-copy-inline">
                        <code>{BANK_INFO.accountNo}</code>
                        <button
                          type="button"
                          className="ooc-copy-btn"
                          onClick={() => copyToClipboard(BANK_INFO.accountNo, 'acc')}
                          title="Sao chép số tài khoản"
                        >
                          {copiedField === 'acc' ? <SvgCheck size={12} /> : <SvgCopy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="ooc-bank-row">
                      <span>Chủ tài khoản:</span>
                      <strong>{BANK_INFO.accountName}</strong>
                    </div>
                    <div className="ooc-bank-row ooc-highlight-row">
                      <span>Nội dung CK:</span>
                      <div className="ooc-copy-inline">
                        <code className="text-highlight">{orderInfo?.transferContent || 'Đang tạo…'}</code>
                        <button
                          type="button"
                          className="ooc-copy-btn"
                          onClick={() => copyToClipboard(orderInfo?.transferContent, 'content')}
                          title="Sao chép nội dung chuyển tiền"
                        >
                          {copiedField === 'content' ? <SvgCheck size={12} /> : <SvgCopy size={12} />}
                        </button>
                      </div>
                    </div>
                    <p className="ooc-auto-note">
                      ⚡ Quét QR bằng app ngân hàng để điền sẵn số tiền và nội dung. Tiền vào là hệ thống tự động cộng điểm ngay.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Nội dung Tab 2: Nhập Key Nạp */}
        {activeTab === 'key' && (
          <div className="ooc-tab-body">
            <form onSubmit={handleActivateKey} className="ooc-key-form">
              <label className="ooc-field-label">
                <span>Nhập mã thẻ nạp / Key (Ví dụ: CREDIT-xxxx, PRO-xxxx, VIP-xxxx)</span>
                <input
                  type="text"
                  value={keyCode}
                  onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
                  placeholder="CREDIT-XXXX-XXXX"
                  className="ooc-key-input"
                  autoFocus
                />
              </label>

              {keyFeedback && (
                <div className={`ooc-feedback ${keyFeedback.ok ? 'success' : 'error'}`}>
                  {keyFeedback.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={keyActivating || !keyCode.trim()}
                className="ooc-submit-key-btn"
              >
                {keyActivating ? 'Đang kích hoạt…' : 'Kích hoạt mã nạp'}
              </button>
            </form>

            <div className="ooc-key-tips">
              <b>💡 Làm thế nào để có mã thẻ nạp?</b>
              <p>
                Mã nạp điểm Credit do Quản trị viên (Admin) hoặc Thầy/Cô giáo phát hành qua sự kiện thi đua, hoặc được tặng thưởng khi đạt thứ hạng cao trên Bảng xếp hạng.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="ooc-footer">
          <a
            href="#profile?tab=upgrade"
            className="ooc-full-page-link"
            onClick={() => setIsOpen(false)}
          >
            Xem chi tiết bảng giá &amp; lịch sử giao dịch →
          </a>
          <button
            type="button"
            className="ooc-close-action-btn"
            onClick={() => setIsOpen(false)}
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
