import { useState, useMemo, useEffect } from 'react';
import '../styles/payment-apple.css';

/* ============================================================
   SVG ICONS THUẦN — ZERO EMOJIS, ZERO ICON FONTS
   ============================================================ */
function SvgCheck({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SvgAlert({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function SvgSpinner({ size = 20, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function SvgCopy({ size = 13, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function SvgCrown({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

/* ============================================================
   CẤU HÌNH NGÂN HÀNG — MB BANK
   ============================================================ */
const BANK_INFO = {
  bankId: '970422',
  bankName: 'MBBANK',
  accountNo: '999988882010',
  accountName: 'NGUYEN THE DUY',
  template: 'compact2',
};

/* Bảng giá chuẩn 100% theo yêu cầu của người dùng */
const ALL_PACKAGES = {
  // 1. HỌC SINH — ELEC AI Học Sinh
  'hs-12m': { id: 'hs-12m', role: 'student', label: 'ELEC AI Học Sinh — 12 tháng', months: 12, amount: 499000, badge: 'Tiết kiệm 47%' },
  'hs-6m':  { id: 'hs-6m',  role: 'student', label: 'ELEC AI Học Sinh — 6 tháng', months: 6, amount: 349000, badge: 'Tiết kiệm 26%' },
  'hs-3m':  { id: 'hs-3m',  role: 'student', label: 'ELEC AI Học Sinh — 3 tháng', months: 3, amount: 199000, badge: 'Tiết kiệm 16%' },
  'hs-1m':  { id: 'hs-1m',  role: 'student', label: 'ELEC AI Học Sinh — 1 tháng', months: 1, amount: 79000, badge: null },

  // 2. GIÁO VIÊN — ELEC AI Giáo Viên PRO
  'gv-12m': { id: 'gv-12m', role: 'teacher', label: 'ELEC AI Giáo Viên PRO — 12 tháng', months: 12, amount: 990000, badge: 'Tiết kiệm 45%' },
  'gv-6m':  { id: 'gv-6m',  role: 'teacher', label: 'ELEC AI Giáo Viên PRO — 6 tháng', months: 6, amount: 590000, badge: 'Tiết kiệm 34%' },
  'gv-1m':  { id: 'gv-1m',  role: 'teacher', label: 'ELEC AI Giáo Viên PRO — 1 tháng', months: 1, amount: 149000, badge: null },
};

export default function PaymentPanel({ identCode, onPaymentSuccess, onClose, customPackage }) {
  const [panelRole, setPanelRole] = useState(() => customPackage?.role || 'student');
  const [selected, setSelected] = useState(() => customPackage?.key || (panelRole === 'student' ? 'hs-12m' : 'gv-12m'));
  const [step, setStep] = useState(() => (customPackage ? 'qr' : 'select'));
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [copiedField, setCopiedField] = useState(null);

  const pkg = customPackage || ALL_PACKAGES[selected] || ALL_PACKAGES['hs-12m'];

  const transferContent = useMemo(() => {
    const cleanId = String(identCode || '').replace(/^ELECAI-?/i, '');
    return `ELEC ${cleanId || 'VIP2026'}`;
  }, [identCode]);

  const qrUrl = useMemo(() => {
    const params = new URLSearchParams({
      amount: String(pkg.amount),
      addInfo: transferContent,
      accountName: BANK_INFO.accountName,
    });
    return `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-${BANK_INFO.template}.png?${params.toString()}`;
  }, [pkg.amount, transferContent]);

  /* Đếm ngược 5 phút khi ở bước waiting */
  useEffect(() => {
    if (step !== 'waiting') return undefined;
    setCountdown(300);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  /* Tự động kiểm tra mỗi 15 giây khi đang chờ */
  useEffect(() => {
    if (step !== 'waiting') return undefined;
    const t = setInterval(() => {
      checkStatus(true);
    }, 15000);
    return () => clearInterval(t);
  }, [step]);

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      alert(`Sao chép: ${text}`);
    }
  };

  const checkStatus = async (silent = false) => {
    if (!silent) setChecking(true);
    try {
      const result = await onPaymentSuccess?.(pkg);
      if (result?.isVip || result?.isPro || result?.ok) {
        alert('Chúc mừng! Tài khoản của bạn đã được nâng cấp thành công.');
        onClose?.();
        return;
      }
      if (!silent) {
        alert('Hệ thống chưa ghi nhận giao dịch.\nVui lòng đợi thêm 15-30 giây và bấm lại.');
      }
    } catch (e) {
      if (!silent) alert('Lỗi kiểm tra: ' + (e?.message || 'Không xác định'));
    } finally {
      if (!silent) setChecking(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const filteredPackages = Object.entries(ALL_PACKAGES).filter(
    ([, p]) => p.role === panelRole
  );

  return (
    <div className="apl-pay-wrap">
      {/* ============================================================
         BƯỚC 1: CHỌN GÓI (Chuẩn Apple HIG — Progressive Disclosure)
         ============================================================ */}
      {step === 'select' && (
        <>
          <div className="apl-pay-head-select">
            <h3 className="apl-pay-title">Nâng cấp tài khoản ELEC AI</h3>
            <p className="apl-pay-sub">
              “Giảm mạnh và cắt đúng chỗ tốn tiền (buổi ôn live riêng → buổi tổng ôn nhóm) là cách hạ giá mà không lỗ:”
            </p>
          </div>

          {/* Toggle Học Sinh / Giáo Viên */}
          <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.05)', padding: 3, borderRadius: 980, gap: 4, width: 'fit-content' }}>
            <button
              type="button"
              className={`ns9-seg-btn ${panelRole === 'student' ? 'is-active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={() => {
                setPanelRole('student');
                setSelected('hs-12m');
              }}
            >
              1. Học Sinh
            </button>
            <button
              type="button"
              className={`ns9-seg-btn ${panelRole === 'teacher' ? 'is-active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              onClick={() => {
                setPanelRole('teacher');
                setSelected('gv-12m');
              }}
            >
              2. Giáo Viên PRO
            </button>
          </div>

          <div className="apl-pay-options" style={{ gridTemplateColumns: panelRole === 'student' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)' }}>
            {filteredPackages.map(([key, p]) => (
              <button
                key={key}
                type="button"
                className={`apl-pay-opt-card ${selected === key ? 'is-active' : ''}`}
                onClick={() => setSelected(key)}
              >
                {p.badge && <span className="apl-pay-badge">{p.badge}</span>}
                <span className="apl-pay-opt-name">{p.label.split('—')[1]?.trim() || p.label}</span>
                <span className="apl-pay-opt-price">{p.amount.toLocaleString('vi-VN')}đ</span>
              </button>
            ))}
          </div>

          <ul className="apl-pay-features">
            {panelRole === 'student' ? (
              <>
                <li><SvgCheck size={14} /> Toàn bộ đề thi miễn phí & độc quyền kỳ thi THPTQG, HSA, TSA</li>
                <li><SvgCheck size={14} /> Buổi tổng ôn nhóm trực tiếp cùng giáo viên ELEC AI qua Meet</li>
                <li><SvgCheck size={14} /> Trợ lý AI giải thích từng bước & chỉ rõ lỗi sai chi tiết</li>
                <li><SvgCheck size={14} /> Hỏi bài và phân tích ảnh chụp đề không giới hạn 24/7</li>
              </>
            ) : (
              <>
                <li><SvgCheck size={14} /> Quản lý không giới hạn lớp học và học sinh tham gia</li>
                <li><SvgCheck size={14} /> Soạn đề AI theo ma trận chuẩn Bộ GD&ĐT & nạp từ PDF/Ảnh</li>
                <li><SvgCheck size={14} /> Chấm thi tự động & quét phiếu OMR tức thời khi học sinh nộp</li>
                <li><SvgCheck size={14} /> Báo cáo phổ điểm, cảnh báo học sinh yếu, xuất Excel/CSV</li>
              </>
            )}
          </ul>

          <button
            type="button"
            className="apl-pay-btn-primary"
            onClick={() => setStep('qr')}
          >
            <SvgCrown size={16} />
            Mở khoá — {pkg.amount.toLocaleString('vi-VN')}đ
          </button>
        </>
      )}

      {/* ============================================================
         BƯỚC 2: THANH TOÁN QR (Chuẩn Apple Pay Sheet)
         ============================================================ */}
      {step === 'qr' && (
        <>
          <div className="apl-pay-qr-header">
            {!customPackage && (
              <button
                type="button"
                className="apl-pay-back-btn"
                onClick={() => setStep('select')}
              >
                ← Chọn gói khác
              </button>
            )}
            <span style={{ fontWeight: 600, fontSize: '0.88rem', marginLeft: 'auto' }}>
              {pkg.label}
            </span>
          </div>

          <div className="apl-pay-qr-card">
            <img src={qrUrl} alt={`QR ${pkg.label}`} width={210} height={210} />
            <p className="apl-pay-qr-price">
              Số tiền cần chuyển: <b>{pkg.amount.toLocaleString('vi-VN')}đ</b>
            </p>
          </div>

          <div className="apl-pay-inset-group">
            <div className="apl-pay-row">
              <span className="apl-pay-label">Ngân hàng</span>
              <span className="apl-pay-val">{BANK_INFO.bankName}</span>
            </div>

            <div className="apl-pay-row">
              <span className="apl-pay-label">Số tài khoản</span>
              <div className="apl-pay-val-wrap">
                <span className="apl-pay-val">{BANK_INFO.accountNo}</span>
                <button
                  type="button"
                  className="apl-pay-copy-btn"
                  onClick={() => copyToClipboard(BANK_INFO.accountNo, 'stk')}
                >
                  <SvgCopy size={11} />
                  {copiedField === 'stk' ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="apl-pay-row">
              <span className="apl-pay-label">Chủ tài khoản</span>
              <span className="apl-pay-val">{BANK_INFO.accountName}</span>
            </div>

            <div className="apl-pay-row">
              <span className="apl-pay-label">Nội dung chuyển khoản</span>
              <div className="apl-pay-val-wrap">
                <span className="apl-pay-val" style={{ fontFamily: 'monospace', color: '#0071e3' }}>
                  {transferContent}
                </span>
                <button
                  type="button"
                  className="apl-pay-copy-btn"
                  onClick={() => copyToClipboard(transferContent, 'content')}
                >
                  <SvgCopy size={11} />
                  {copiedField === 'content' ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="apl-pay-row">
              <span className="apl-pay-label">Số tiền chính xác</span>
              <div className="apl-pay-val-wrap">
                <span className="apl-pay-val" style={{ color: '#0071e3' }}>
                  {pkg.amount.toLocaleString('vi-VN')}đ
                </span>
                <button
                  type="button"
                  className="apl-pay-copy-btn"
                  onClick={() => copyToClipboard(String(pkg.amount), 'amount')}
                >
                  <SvgCopy size={11} />
                  {copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>

          <div className="apl-pay-alert">
            <SvgAlert size={16} />
            <span>
              Ghi <b>chính xác nội dung chuyển khoản</b> để hệ thống tự động kích hoạt tài khoản ngay lập tức sau 30-60 giây.
            </span>
          </div>

          <button
            type="button"
            className="apl-pay-btn-primary"
            onClick={() => setStep('waiting')}
          >
            <SvgCheck size={16} />
            Tôi đã chuyển khoản
          </button>
        </>
      )}

      {/* ============================================================
         BƯỚC 3: CHỜ XÁC THỰC GIAO DỊCH
         ============================================================ */}
      {step === 'waiting' && (
        <div className="apl-pay-waiting-card">
          <SvgSpinner size={36} className="apl-pay-spinner-svg" />
          <h3 className="apl-pay-wait-title">Đang xác nhận giao dịch</h3>
          <p className="apl-pay-wait-sub">
            Hệ thống đang kiểm tra giao dịch tự động.<br />
            Thời gian tự động kiểm tra sau: <b>{formatTime(countdown)}</b>
          </p>

          <div className="apl-pay-steps">
            <div className="apl-pay-step-item is-done">
              <SvgCheck size={14} /> 1. Đã nhận lệnh chuyển khoản
            </div>
            <div className="apl-pay-step-item is-active">
              <SvgSpinner size={14} className="apl-pay-spinner-svg" /> 2. Đang đối soát với ngân hàng
            </div>
            <div className="apl-pay-step-item">
              <SvgCheck size={14} /> 3. Kích hoạt tài khoản VIP & Lộ trình
            </div>
          </div>

          <button
            type="button"
            className="apl-pay-btn-primary"
            onClick={() => checkStatus(false)}
            disabled={checking}
          >
            {checking ? <SvgSpinner size={16} className="apl-pay-spinner-svg" /> : <SvgCheck size={16} />}
            {checking ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
          </button>

          <button
            type="button"
            className="apl-pay-btn-subtle"
            onClick={() => setStep('qr')}
          >
            ← Quay lại mã QR
          </button>
        </div>
      )}
    </div>
  );
}
