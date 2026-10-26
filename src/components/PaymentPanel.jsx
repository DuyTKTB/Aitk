import { useState, useMemo, useEffect } from 'react';
import { IcoCrown, IcoSpinner, IcoCheck, IcoQr } from './ProfileIcons.jsx';

/* ============================================================
   CẤU HÌNH NGÂN HÀNG — SỬA THÔNG TIN CỦA BẠN Ở ĐÂY
   ============================================================ */
const BANK_INFO = {
  bankId: '970422',              // Vietcombank. Đổi mã BIN theo ngân hàng của bạn
  bankName: 'MBBANK',
  accountNo: '999988882010',       // SỐ TÀI KHOẢN CỦA BẠN
  accountName: 'NGUYEN THE DUY', // TÊN CHỦ TK (không dấu, viết hoa)
  template: 'compact2',
};

/* Các gói VIP */
const VIP_PACKAGES = {
  'vip-1m': { label: 'VIP 1 tháng', months: 1, amount: 50000, badge: null },
  'vip-6m': { label: 'VIP 6 tháng', months: 6, amount: 250000, badge: 'Tiết kiệm 17%' },
  'vip-1y': { label: 'VIP 1 năm', months: 12, amount: 450000, badge: 'Tiết kiệm 25%' },
};

export default function PaymentPanel({ identCode, onPaymentSuccess, onClose }) {
  const [selected, setSelected] = useState('vip-6m');
  const [step, setStep] = useState('select');
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [copied, setCopied] = useState(false);

  const pkg = VIP_PACKAGES[selected];

  const transferContent = useMemo(
    () => `ELECAI VIP ${identCode}`,
    [identCode]
  );

  const qrUrl = useMemo(() => {
    const params = new URLSearchParams({
      amount: String(pkg.amount),
      addInfo: transferContent,
      accountName: BANK_INFO.accountName,
    });
    return `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-${BANK_INFO.template}.png?${params.toString()}`;
  }, [pkg.amount, transferContent]);

  /* Đếm ngược khi ở bước waiting */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goToQr = () => setStep('qr');
  const confirmPaid = () => setStep('waiting');

  const checkStatus = async (silent = false) => {
    if (!silent) setChecking(true);
    try {
      const result = await onPaymentSuccess?.();
      if (result?.isVip) {
        // Parent sẽ tự đóng modal qua useEffect theo dõi tier
        return;
      }
      if (!silent) {
        alert('Hệ thống chưa ghi nhận giao dịch.\nVui lòng đợi thêm 1-2 phút và thử lại.');
      }
    } catch (e) {
      if (!silent) alert('Lỗi kiểm tra: ' + (e?.message || 'Không xác định'));
    } finally {
      if (!silent) setChecking(false);
    }
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(transferContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Không thể copy. Vui lòng copy thủ công:\n' + transferContent);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="pf-payment">

      {/* ============ BƯỚC 1: CHỌN GÓI ============ */}
      {step === 'select' && (
        <>
          <h3 className="pf-payment-title">Học Hóa không còn bị chặn ở “hết lượt”</h3>
          <p className="pf-payment-sub">
            Hỏi AI thả ga, chụp đề là có lời giải từng bước — mở khoá ngay trong 1 phút.
          </p>

          <div className="pf-payment-options">
            {Object.entries(VIP_PACKAGES).map(([key, p]) => (
              <button
                key={key}
                type="button"
                className={selected === key ? 'on' : ''}
                onClick={() => setSelected(key)}
              >
                {p.badge && <em className="pf-pkg-badge">{p.badge}</em>}
                <b>{p.label}</b>
                <span>{p.amount.toLocaleString('vi-VN')}đ</span>
              </button>
            ))}
          </div>

          <ul className="pf-payment-features">
            <li><IcoCheck size={14} /> Hỏi AI <b>không giới hạn lượt</b> — học lúc nào cũng có người trả lời</li>
            <li><IcoCheck size={14} /> Chụp đề, chụp vở: <b>30 ảnh/ngày</b>, AI đọc và giải ngay</li>
            <li><IcoCheck size={14} /> Giải thích <b>từng bước</b> và chỉ đúng chỗ bạn sai, không đưa đáp án trống</li>
            <li><IcoCheck size={14} /> <b>Ưu tiên phản hồi</b> khi hệ thống đông người</li>
            <li><IcoCheck size={14} /> Lưu toàn bộ hội thoại để <b>ôn lại trước khi thi</b></li>
          </ul>

          <button type="button" className="pf-btn primary" onClick={goToQr}>
            <IcoCrown size={16} />
            Mở khoá VIP — {pkg.amount.toLocaleString('vi-VN')}đ
          </button>

          <p className="pf-payment-sub" style={{ marginTop: '0.55rem', textAlign: 'center' }}>
            Chuyển khoản một lần · không tự động trừ tiền · cần tư vấn trước khi mua thì nhắn Admin
          </p>
        </>
      )}

      {/* ============ BƯỚC 2: HIỂN THỊ QR ============ */}
      {step === 'qr' && (
        <>
          <div className="pf-payment-head">
            <button type="button" className="pf-back" onClick={() => setStep('select')}>
              ← Chọn gói khác
            </button>
            <span className="pf-pkg-label">{pkg.label}</span>
          </div>

          <div className="pf-payment-qr">
            <img src={qrUrl} alt={`QR ${pkg.label}`} width={240} height={240} />
            <p className="pf-qr-amount">
              Chuyển khoản <b>{pkg.amount.toLocaleString('vi-VN')}đ</b>
            </p>
          </div>

          <div className="pf-payment-info">
            <div><span>Ngân hàng</span><b>{BANK_INFO.bankName}</b></div>
            <div><span>Số tài khoản</span><b>{BANK_INFO.accountNo}</b></div>
            <div><span>Chủ tài khoản</span><b>{BANK_INFO.accountName}</b></div>
            <div>
              <span>Nội dung</span>
              <b
                className={'pf-copy-content' + (copied ? ' copied' : '')}
                onClick={copyContent}
                title="Bấm để copy"
              >
                {copied ? '✓ Đã copy' : transferContent}
              </b>
            </div>
          </div>

          <div className="pf-payment-note">
            <b>⚠️ Quan trọng</b>
            <p>
              Ghi <b>đúng nội dung</b> chuyển khoản để hệ thống tự động cộng VIP.
              Sai nội dung sẽ phải chờ Admin xử lý thủ công.
            </p>
          </div>

          <button type="button" className="pf-btn primary" onClick={confirmPaid}>
            <IcoCheck size={16} />
            Tôi đã chuyển khoản
          </button>
        </>
      )}

      {/* ============ BƯỚC 3: CHỜ XỬ LÝ ============ */}
      {step === 'waiting' && (
        <>
          <div className="pf-waiting">
            <div className="pf-waiting-spinner">
              <IcoSpinner size={40} className="pf-spin" />
            </div>
            <h3>Đang xử lý giao dịch</h3>
            <p>
              Hệ thống đang kiểm tra giao dịch của bạn.<br />
              Quá trình này thường mất <b>1-2 phút</b>.
            </p>

            <div className="pf-waiting-countdown">
              <IcoQr size={16} />
              <span>Tự động kiểm tra sau: <b>{formatTime(countdown)}</b></span>
            </div>

            <div className="pf-waiting-steps">
              <div className="done"><IcoCheck size={14} /> Đã nhận thông tin</div>
              <div className="active"><IcoSpinner size={14} className="pf-spin" /> Đang xác minh chuyển khoản</div>
              <div>Kích hoạt VIP</div>
            </div>

            <button
              type="button"
              className="pf-btn primary"
              onClick={() => checkStatus(false)}
              disabled={checking}
            >
              {checking ? <IcoSpinner size={15} className="pf-spin" /> : <IcoCheck size={15} />}
              {checking ? 'Đang kiểm tra…' : 'Kiểm tra ngay'}
            </button>

            <button
              type="button"
              className="pf-btn"
              onClick={() => setStep('qr')}
              style={{ marginTop: '.5rem' }}
            >
              ← Quay lại QR
            </button>

            <p className="pf-waiting-help">
              Sau 5 phút chưa được cộng VIP?<br />
              Liên hệ Admin qua{' '}
              <a href="https://www.facebook.com/nguyentheduytk" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>{' '}
              kèm ảnh biên lai.
            </p>
          </div>
        </>
      )}
    </div>
  );
}