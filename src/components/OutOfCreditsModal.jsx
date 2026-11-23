import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  CREDIT_PACKAGES,
  MIN_CREDIT_TOPUP_VND,
  BANK_INFO,
  createPaymentOrder,
  resolveCreditOrderAmount,
  onOrderPaid,
  formatCredits,
} from '../lib/creditService.js';
import { activateProKey } from '../lib/proKeyApi.js';
import './out-of-credits-modal.css';

/* ============================================================
   VECTOR ICONS SẮC NÉT (ZERO EMOJI)
   ============================================================ */
const SvgZap = ({ size = 14 }) => (
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

const SvgShieldCheck = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

function getCompactBadge(pkg) {
  if (!pkg?.badge) return null;
  if (pkg.popular) return 'PHỔ BIẾN';
  return pkg.badge;
}

export default function OutOfCreditsModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [needed, setNeeded] = useState(100);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'key'

  // QR state — mặc định gói từ 10.000đ trở lên (PRO 1: 10.000đ = 10.000 Credit)
  const [selectedPkg, setSelectedPkg] = useState(CREDIT_PACKAGES[0] || CREDIT_PACKAGES[1]);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [customAmountError, setCustomAmountError] = useState('');
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
      const b = Math.max(0, Number(e.detail?.balance) || 0);
      const n = Math.max(1, Number(e.detail?.needed) || 100);
      const forceOpen = Boolean(e.detail?.forceOpen);
      const needLogin = Boolean(e.detail?.needLogin);

      // Chặn mở nhầm popup hết credit nếu số dư thực tế vẫn đủ
      if (!forceOpen && !needLogin && b >= n) return;

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
      }, 2600);
    });
    return cleanup;
  }, [orderInfo, balance]);

  const copyToClipboard = async (text, field) => {
    if (!text) return;
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
          msg: res.message || 'Kích hoạt thành công! Credit đã được cộng vào tài khoản.',
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

  const missing = Math.max(0, needed - balance);
  const heroMascot = orderSuccess
    ? { src: '/img/elec/elec-celebrate.png', alt: 'Linh vật ELEC ăn mừng nạp thành công', mood: 'Đã tiếp năng lượng thành công!' }
    : activeTab === 'key'
      ? { src: '/img/elec/elec-cool.png', alt: 'Linh vật ELEC VIP', mood: 'Nhập mã thẻ / Key kích hoạt ngay!' }
      : { src: '/img/elec/elec-plead.png', alt: 'Linh vật ELEC hết năng lượng', mood: 'Tiếp thêm năng lượng cho ELEC nhé!' };

  return (
    <div className="ooc-backdrop" onClick={() => setIsOpen(false)}>
      <div
        className="ooc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ooc-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HERO BANNER ELEC AI + LINH VẬT */}
        <div className="ooc-hero">
          <button
            type="button"
            className="ooc-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng bảng thông báo"
          >
            <SvgClose size={16} />
          </button>

          <div className="ooc-hero-top">
            <div className="ooc-mascot-stage">
              <div className="ooc-mascot-halo" aria-hidden="true" />
              <img
                src={heroMascot.src}
                alt={heroMascot.alt}
                className={`ooc-mascot-img ${orderSuccess ? 'is-celebrate' : ''}`}
                width="86"
                height="86"
              />
            </div>

            <div className="ooc-hero-copy">
              <span className="ooc-badge">
                <SvgZap size={11} />
                ELEC AI CREDIT · NẠP TỪ 10.000Đ (1 CREDIT = 1 Đ)
              </span>
              <h2 id="ooc-title" className="ooc-title">
                {orderSuccess ? 'Nạp năng lượng thành công!' : 'ELEC AI cần thêm Credit'}
              </h2>
              <p className="ooc-desc">{heroMascot.mood}</p>
            </div>
          </div>

          <div className="ooc-balance-strip">
            <div className="ooc-balance-box">
              <span>Số dư hiện tại</span>
              <strong className="ooc-val-current">
                <SvgZap size={13} />
                {formatCredits(balance)}
              </strong>
            </div>
            <div className="ooc-divider" />
            <div className="ooc-balance-box">
              <span>Cần cho lượt này</span>
              <strong className="ooc-val-needed">
                <SvgZap size={13} />
                {formatCredits(needed)}
              </strong>
            </div>
            {missing > 0 && (
              <>
                <div className="ooc-divider" />
                <div className="ooc-balance-box">
                  <span>Còn thiếu</span>
                  <strong className="ooc-val-missing">-{formatCredits(missing)}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="ooc-body">
          {/* Tabs chuyển đổi giữa VietQR & Mã Key */}
          <div className="ooc-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'qr'}
              className={`ooc-tab ${activeTab === 'qr' ? 'active' : ''}`}
              onClick={() => setActiveTab('qr')}
            >
              <SvgQr size={15} />
              <span>Nạp siêu tốc (VietQR)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'key'}
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
                  <img
                    src="/img/elec/elec-celebrate.png"
                    alt="ELEC chúc mừng"
                    className="ooc-success-mascot"
                    width="82"
                    height="82"
                  />
                  <h3>Nạp Credit thành công!</h3>
                  <p>
                    Hệ thống đã tự động cộng{' '}
                    <b>+{formatCredits(orderInfo?.credits)} Credit</b> vào tài khoản của bạn.
                  </p>
                </div>
              ) : (
                <>
                  <div className="ooc-packages-grid">
                    {CREDIT_PACKAGES.slice(0, 4).map((pkg) => {
                      const isSelected = selectedPkg.amount === pkg.amount && !customAmountInput;
                      const badge = getCompactBadge(pkg);
                      return (
                        <button
                          key={pkg.amount}
                          type="button"
                          className={`ooc-pkg-card ${isSelected ? 'selected' : ''} ${pkg.popular ? 'is-popular' : ''}`}
                          onClick={() => {
                            setCustomAmountInput('');
                            setCustomAmountError('');
                            setSelectedPkg(pkg);
                          }}
                        >
                          {badge && <span className="ooc-pkg-tag">{badge}</span>}
                          <span className="ooc-pkg-tier">{pkg.name}</span>
                          <div className="ooc-pkg-pts">
                            <b>+{formatCredits(pkg.total)}</b>
                            <small>credit</small>
                          </div>
                          <div className="ooc-pkg-price">{pkg.label}</div>
                        </button>
                      );
                    })}
                  </div>

                  <form
                    className="ooc-custom-amount-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const res = resolveCreditOrderAmount(customAmountInput);
                      if (!res.ok) {
                        setCustomAmountError(res.error);
                        return;
                      }
                      setCustomAmountError('');
                      setSelectedPkg({
                        amount: res.amount,
                        credits: res.credits,
                        total: res.total,
                        name: res.name,
                        label: `${res.amount.toLocaleString('vi-VN')} đ`,
                      });
                    }}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customAmountInput}
                      onChange={(e) => {
                        setCustomAmountInput(e.target.value.replace(/[^\d]/g, ''));
                        if (customAmountError) setCustomAmountError('');
                      }}
                      placeholder={`Hoặc nhập số tiền từ ${MIN_CREDIT_TOPUP_VND.toLocaleString('vi-VN')}đ trở lên...`}
                      className="ooc-custom-amount-input"
                    />
                    <button type="submit" className="ooc-custom-amount-btn">
                      Tạo QR
                    </button>
                  </form>
                  {customAmountError && (
                    <div className="ooc-custom-amount-err">{customAmountError}</div>
                  )}

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
                        <span>Ngân hàng</span>
                        <strong>{BANK_INFO.bankName}</strong>
                      </div>
                      <div className="ooc-bank-row">
                        <span>Số tài khoản</span>
                        <div className="ooc-copy-inline">
                          <code>{BANK_INFO.accountNo}</code>
                          <button
                            type="button"
                            className={`ooc-copy-btn ${copiedField === 'acc' ? 'is-copied' : ''}`}
                            onClick={() => copyToClipboard(BANK_INFO.accountNo, 'acc')}
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'acc' ? <SvgCheck size={12} /> : <SvgCopy size={12} />}
                          </button>
                        </div>
                      </div>
                      <div className="ooc-bank-row">
                        <span>Chủ tài khoản</span>
                        <strong>{BANK_INFO.accountName}</strong>
                      </div>
                      <div className="ooc-bank-row ooc-highlight-row">
                        <span>Nội dung CK</span>
                        <div className="ooc-copy-inline">
                          <code className="text-highlight">{orderInfo?.transferContent || 'Đang tạo…'}</code>
                          <button
                            type="button"
                            className={`ooc-copy-btn ${copiedField === 'content' ? 'is-copied' : ''}`}
                            onClick={() => copyToClipboard(orderInfo?.transferContent, 'content')}
                            title="Sao chép nội dung chuyển tiền"
                          >
                            {copiedField === 'content' ? <SvgCheck size={12} /> : <SvgCopy size={12} />}
                          </button>
                        </div>
                      </div>

                      <div className="ooc-auto-note">
                        <img
                          src="/img/elec/elec-super-saiyan.png"
                          alt=""
                          aria-hidden="true"
                          className="ooc-note-mascot"
                          width="28"
                          height="28"
                        />
                        <span>
                          <SvgShieldCheck size={13} />
                          Quét QR bằng app ngân hàng để tự điền số tiền &amp; nội dung — cộng Credit tự động trong 5 giây.
                        </span>
                      </div>
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
                  <span>Nhập mã thẻ nạp / Key (CREDIT-xxxx, PRO-xxxx, VIP-xxxx)</span>
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
                  {keyActivating ? 'Đang kích hoạt…' : 'Kích hoạt mã nạp ngay'}
                </button>
              </form>

              <div className="ooc-key-tips">
                <img
                  src="/img/elec/elec-wink.png"
                  alt="Linh vật ELEC gợi ý"
                  className="ooc-tips-mascot"
                  width="42"
                  height="42"
                />
                <div>
                  <b>Làm thế nào để nhận mã thẻ nạp ELEC?</b>
                  <p>
                    Mã nạp Credit được phát hành bởi Admin hoặc Thầy/Cô qua sự kiện thi đua, hoặc tặng thưởng khi bạn đạt thứ hạng cao trên Bảng xếp hạng.
                  </p>
                </div>
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
              Xem bảng giá &amp; lịch sử giao dịch →
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
    </div>
  );
}
