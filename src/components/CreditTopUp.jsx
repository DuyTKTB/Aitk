import { useState, useEffect, useRef } from 'react';
import {
  CREDIT_PACKAGES,
  BANK_INFO,
  createPaymentOrder,
  getCredits,
  onCreditsChange,
  onOrderPaid,
  getTransactionHistory,
  claimWelcomeBonus,
  checkWelcomeClaimed,
} from '../lib/creditService.js';
import VipStatusCard from './VipStatusCard.jsx';
import './CreditTopUp.css';

/* ============================================================
   ICONS — SVG nét
   ============================================================ */
const IcoZap = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IcoGift = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const IcoCopy = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IcoCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IcoHistory = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IcoRefresh = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IcoArrowLeft = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IcoQr = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="14" y1="14" x2="21" y2="21" />
    <line x1="14" y1="21" x2="21" y2="14" />
  </svg>
);

const IcoAlert = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ============================================================
   Transaction type → SVG icon + label
   ============================================================ */
const TX_TYPES = {
  signup_bonus: { label: 'Quà đăng ký', icon: IcoGift, color: 'blue' },
  daily_free:   { label: 'Miễn phí',     icon: IcoGift, color: 'green' },
  purchase:     { label: 'Nạp tiền',     icon: IcoZap,  color: 'green' },
  referral:     { label: 'Giới thiệu bạn', icon: IcoGift, color: 'green' },
  ai_text:      { label: 'Hỏi AI',        icon: IcoZap,  color: 'red' },
  ai_image:     { label: 'Gửi ảnh AI',    icon: IcoZap,  color: 'red' },
  refund:       { label: 'Hoàn điểm',     icon: IcoRefresh, color: 'green' },
  admin_grant:  { label: 'Admin cấp',     icon: IcoGift, color: 'green' },
  admin_deduct: { label: 'Admin trừ',     icon: IcoAlert, color: 'red' },
};

function TxLabel({ type }) {
  const config = TX_TYPES[type] || { label: type, icon: IcoZap };
  const Icon = config.icon;
  return (
    <span className="ctu-history-type">
      <Icon size={14} />
      {config.label}
    </span>
  );
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function CreditTopUp({ userId, onCreditUpdate, onUpgrade }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState(50000);
  const [step, setStep] = useState('select');
  const [orderData, setOrderData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [claimed, setClaimed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const unsubOrderRef = useRef(null);

  const pkg = CREDIT_PACKAGES.find((p) => p.amount === selectedPkg) || CREDIT_PACKAGES[2];

  /* Load credits ban đầu */
  useEffect(() => {
    if (!userId) return;
    let off = false;
    getCredits(userId).then((c) => {
      if (!off) {
        setBalance(c.balance);
        setLoading(false);
      }
    });
    return () => { off = true; };
  }, [userId]);

  /* Check đã nhận 5 điểm chào mừng chưa */
  useEffect(() => {
    if (!userId) { setChecking(false); return; }
    let off = false;
    setChecking(true);
    checkWelcomeClaimed(userId)
      .then((done) => { if (!off) setClaimed(done); })
      .finally(() => { if (!off) setChecking(false); });
    return () => { off = true; };
  }, [userId]);

  /* Realtime credits change */
  useEffect(() => {
    if (!userId) return;
    const unsub = onCreditsChange(userId, (newData) => {
      setBalance(newData.balance);
      onCreditUpdate?.(newData.balance);
    });
    return () => unsub();
  }, [userId, onCreditUpdate]);

  /* Countdown timer */
  useEffect(() => {
    if (step !== 'waiting' && step !== 'qr') return;
    if (!orderData?.expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(orderData.expiresAt) - Date.now()) / 1000));
      setCountdown(left);
      if (left <= 0) clearInterval(t);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [step, orderData]);

  useEffect(() => () => unsubOrderRef.current?.(), []);

  const handleClaim = async () => {
    if (claimed || claimLoading) return;
    setClaimLoading(true);
    const result = await claimWelcomeBonus(userId);
    if (result.ok) {
      setBalance(result.balance);
      setClaimed(true);
      onCreditUpdate?.(result.balance);
    } else if (result.reason === 'already_claimed') {
      setClaimed(true);
    }
    setClaimLoading(false);
  };

  const handleCreateOrder = async () => {
    setCreating(true);
    try {
      const data = await createPaymentOrder(userId, selectedPkg);
      setOrderData(data);
      setStep('qr');

      unsubOrderRef.current?.();
      unsubOrderRef.current = onOrderPaid(data.order.id, () => {
        setStep('success');
        getCredits(userId).then((c) => {
          setBalance(c.balance);
          onCreditUpdate?.(c.balance);
        });
      });
    } catch (e) {
      alert('Lỗi tạo đơn: ' + (e.message || 'Thử lại sau'));
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Copy thủ công: ' + text);
    }
  };

  const loadHistory = async () => {
    if (history.length > 0) {
      setShowHistory((s) => !s);
      return;
    }
    const data = await getTransactionHistory(userId);
    setHistory(data);
    setShowHistory(true);
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const fmtDate = (d) => new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  if (loading) {
    return (
      <div className="ctu-wrap">
        <div className="ctu-loading">
          <div className="ctu-spinner" />
          <p>Đang tải…</p>
        </div>
      </div>
    );
  }

  const claimDisabled = claimed || claimLoading || checking;

  return (
    <div className="ctu-wrap">

      {/* ============ VIP STATUS ============ */}
      <VipStatusCard onUpgrade={onUpgrade} />

      {/* ============ BALANCE ============ */}
      <div className="ctu-balance">
        <div className="ctu-balance-content">
          <div className="ctu-balance-icon">
            <IcoZap size={26} />
          </div>
          <div className="ctu-balance-info">
            <div className="ctu-balance-num">
              {balance?.toLocaleString('vi-VN') ?? 0}
              <span className="ctu-balance-unit">điểm</span>
            </div>
            <div className="ctu-balance-sub">1.000đ = 10 điểm · Chat: 1đ/lần · Tạo đề: 5–20đ</div>
          </div>
        </div>
        <button
          type="button"
          className={'ctu-daily' + (claimed ? ' claimed' : '')}
          onClick={handleClaim}
          disabled={claimDisabled}
        >
          <IcoGift size={15} />
          <span>
            {checking ? 'Đang kiểm tra…'
              : claimLoading ? 'Đang nhận…'
              : claimed ? 'Đã nhận'
              : 'Nhận 5 điểm'}
          </span>
        </button>
      </div>

      {/* ============ STEP: SELECT ============ */}
      {step === 'select' && (
        <div className="ctu-card">
          <div className="ctu-card-head">
            <h3 className="ctu-title">Nạp điểm</h3>
            <p className="ctu-desc">Chọn mệnh giá · Nạp nhiều được bonus thêm</p>
          </div>

          <div className="ctu-pkg-grid">
            {CREDIT_PACKAGES.map((p) => (
              <button
                key={p.amount}
                type="button"
                className={'ctu-pkg' + (selectedPkg === p.amount ? ' on' : '') + (p.popular ? ' popular' : '')}
                onClick={() => setSelectedPkg(p.amount)}
              >
                {p.popular && <span className="ctu-pkg-popular">⭐ Phổ biến</span>}
                {p.badge && <span className="ctu-pkg-badge">{p.badge}</span>}
                <b className="ctu-pkg-amount">{p.label}</b>
                <span className="ctu-pkg-credits">
                  <IcoZap size={11} />
                  {p.total.toLocaleString('vi-VN')}
                </span>
              </button>
            ))}
          </div>

          <div className="ctu-receive">
            <div className="ctu-receive-l">
              <span className="ctu-receive-label">Bạn sẽ nhận</span>
              <span className="ctu-receive-amount">
                <IcoZap size={16} />
                {pkg.total.toLocaleString('vi-VN')} điểm
              </span>
            </div>
            {pkg.bonus > 0 && (
              <span className="ctu-receive-bonus">+{pkg.bonus} bonus</span>
            )}
          </div>

          <button
            type="button"
            className="ctu-btn primary"
            onClick={handleCreateOrder}
            disabled={creating}
          >
            {creating ? (
              <><div className="ctu-spinner sm" /><span>Đang tạo…</span></>
            ) : (
              <><IcoQr size={17} /><span>Tạo mã chuyển khoản</span></>
            )}
          </button>
        </div>
      )}

      {/* ============ STEP: QR ============ */}
      {step === 'qr' && orderData && (
        <div className="ctu-card">
          <div className="ctu-card-head row">
            <button type="button" className="ctu-back" onClick={() => setStep('select')}>
              <IcoArrowLeft size={16} />
              <span>Chọn gói khác</span>
            </button>
            <span className="ctu-head-badge">{pkg.label}</span>
          </div>

          <div className="ctu-qr-box">
            <img src={orderData.qrUrl} alt="QR thanh toán" className="ctu-qr-img" />
            <div className="ctu-qr-hint">Quét mã bằng app ngân hàng</div>
          </div>

          <div className="ctu-info-list">
            <div className="ctu-info-row">
              <span className="ctu-info-label">Ngân hàng</span>
              <span className="ctu-info-value">{BANK_INFO.bankName}</span>
            </div>
            <div className="ctu-info-row">
              <span className="ctu-info-label">Số tài khoản</span>
              <span className="ctu-info-value">{BANK_INFO.accountNo}</span>
            </div>
            <div className="ctu-info-row">
              <span className="ctu-info-label">Chủ tài khoản</span>
              <span className="ctu-info-value">{BANK_INFO.accountName}</span>
            </div>
            <div className="ctu-info-row">
              <span className="ctu-info-label">Số tiền</span>
              <span className="ctu-info-value highlight">{pkg.amount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="ctu-info-row">
              <span className="ctu-info-label">Nội dung</span>
              <span className="ctu-info-value">
                <b className="ctu-code">{orderData.transferContent}</b>
                <button
                  type="button"
                  className={'ctu-copy' + (copied ? ' copied' : '')}
                  onClick={() => handleCopy(orderData.transferContent)}
                  aria-label="Copy nội dung"
                >
                  {copied ? <IcoCheck size={13} /> : <IcoCopy size={13} />}
                </button>
              </span>
            </div>
          </div>

          <div className="ctu-warning">
            <span className="ctu-warning-icon">
              <IcoAlert size={18} />
            </span>
            <div>
              <b>Ghi đúng nội dung chuyển khoản</b>
              <p>Hệ thống tự động cộng điểm sau 1-2 phút. Sai nội dung sẽ phải chờ Admin xử lý thủ công.</p>
            </div>
          </div>

          <button type="button" className="ctu-btn primary" onClick={() => setStep('waiting')}>
            <IcoCheck size={16} />
            <span>Tôi đã chuyển khoản</span>
          </button>

          {countdown > 0 && (
            <div className="ctu-countdown">
              Đơn hết hạn sau <b>{fmtTime(countdown)}</b>
            </div>
          )}
        </div>
      )}

      {/* ============ STEP: WAITING ============ */}
      {step === 'waiting' && (
        <div className="ctu-card">
          <div className="ctu-card-head row">
            <button type="button" className="ctu-back" onClick={() => setStep('qr')}>
              <IcoArrowLeft size={16} />
              <span>Quay lại QR</span>
            </button>
          </div>

          <div className="ctu-waiting">
            <div className="ctu-spinner lg" />
            <h3 className="ctu-waiting-title">Đang kiểm tra giao dịch</h3>
            <p className="ctu-waiting-desc">
              Hệ thống đang xác minh chuyển khoản của bạn.<br />
              Thường mất <b>1-2 phút</b>.
            </p>

            {countdown > 0 && (
              <div className="ctu-waiting-timer">
                <IcoRefresh size={14} />
                <span>Tự động kiểm tra · <b>{fmtTime(countdown)}</b></span>
              </div>
            )}

            <button
              type="button"
              className="ctu-btn primary"
              onClick={() => {
                getCredits(userId).then((c) => {
                  if (c.balance > (balance || 0)) {
                    setBalance(c.balance);
                    setStep('success');
                    onCreditUpdate?.(c.balance);
                  } else {
                    alert('Chưa ghi nhận giao dịch. Vui lòng đợi thêm 1-2 phút.');
                  }
                });
              }}
            >
              <IcoRefresh size={15} />
              <span>Kiểm tra ngay</span>
            </button>

            <p className="ctu-help">
              Sau 5 phút chưa được cộng điểm?{' '}
              <a href="https://www.facebook.com/nguyentheduytk" target="_blank" rel="noopener noreferrer">
                Liên hệ Admin
              </a>{' '}
              kèm ảnh biên lai.
            </p>
          </div>
        </div>
      )}

      {/* ============ STEP: SUCCESS ============ */}
      {step === 'success' && (
        <div className="ctu-card success">
          <div className="ctu-success-emoji">
            <IcoCheck size={56} />
          </div>
          <h3 className="ctu-success-title">Nạp thành công!</h3>
          <div className="ctu-success-amount">
            +{orderData?.credits?.toLocaleString('vi-VN')} điểm
          </div>
          <p className="ctu-success-sub">
            Số dư hiện tại: <b>{balance?.toLocaleString('vi-VN')} điểm</b>
          </p>
          <button
            type="button"
            className="ctu-btn primary"
            onClick={() => { setStep('select'); setOrderData(null); }}
          >
            <IcoCheck size={16} />
            <span>Xong</span>
          </button>
        </div>
      )}

      {/* ============ HISTORY ============ */}
      <div className="ctu-card">
        <button type="button" className="ctu-history-toggle" onClick={loadHistory}>
          <IcoHistory size={15} />
          <span>{showHistory ? 'Ẩn lịch sử' : 'Xem lịch sử điểm'}</span>
        </button>

        {showHistory && (
          <div className="ctu-history-list">
            {history.length === 0 ? (
              <div className="ctu-history-empty">Chưa có giao dịch nào.</div>
            ) : (
              history.slice(0, 20).map((tx) => (
                <div key={tx.id} className="ctu-history-item">
                  <div className="ctu-history-info">
                    <TxLabel type={tx.type} />
                    <span className="ctu-history-date">{fmtDate(tx.created_at)}</span>
                  </div>
                  <span className={'ctu-history-amt' + (tx.amount > 0 ? ' pos' : ' neg')}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
}