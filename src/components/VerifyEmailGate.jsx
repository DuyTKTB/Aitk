import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  OTP_LENGTH,
  requestEmailOtp,
  sanitizeOtpInput,
  verifyEmailOtpCode,
} from '../lib/emailOtp.js';
import '../styles/verify-email-gate.css';

export default function VerifyEmailGate() {
  const { user, sendVerifyEmail, refreshUser, logout } = useAuth();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState(null); // { type: 'ok' | 'err', text: string }
  const [linkFallbackMode, setLinkFallbackMode] = useState(false);

  const inputRefs = useRef([]);
  const autoSentRef = useRef(false);

  const email = user?.email || '';
  const uid = user?.uid || '';
  const isGmail = email.toLowerCase().endsWith('@gmail.com');

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = useCallback(async ({ isAuto = false } = {}) => {
    if (!uid || sending) return;
    setSending(true);
    if (!isAuto) setStatus(null);

    try {
      const res = await requestEmailOtp();
      if (res?.alreadyVerified) {
        await refreshUser(true);
        return;
      }
      setCooldown(60);
      setLinkFallbackMode(false);
      setStatus({
        type: 'ok',
        text: `Đã gửi mã xác thực 6 số tới ${email}. Kiểm tra cả mục Spam/Quảng cáo nếu chưa thấy.`,
      });
    } catch (e) {
      const code = String(e?.code || '');
      if (
        code === 'OTP_PROVIDER_NOT_CONFIGURED' ||
        code === 'HTTP_404' ||
        code === 'HTTP_503'
      ) {
        setLinkFallbackMode(true);
        try {
          await sendVerifyEmail();
          setCooldown(60);
          setStatus({
            type: 'ok',
            text: `Đã gửi liên kết xác thực tới ${email}. Hãy mở hộp thư (cả mục Spam/Quảng cáo) và bấm vào link kích hoạt.`,
          });
        } catch (e2) {
          if (!isAuto || e2?.code === 'auth/too-many-requests') {
            setStatus({
              type: 'err',
              text: e2?.code === 'auth/too-many-requests'
                ? 'Bạn vừa yêu cầu gửi email xác thực. Hãy kiểm tra hộp thư hoặc đợi 1–2 phút rồi thử lại.'
                : (e2?.message || 'Không gửi được email xác thực.'),
            });
          }
        }
      } else if (code === 'OTP_COOLDOWN' && e?.retryAfterSec) {
        setCooldown(Number(e.retryAfterSec) || 60);
        if (!isAuto) setStatus({ type: 'err', text: e.message });
      } else if (!isAuto) {
        setStatus({ type: 'err', text: e?.message || 'Không gửi được mã OTP.' });
      }
    } finally {
      setSending(false);
    }
  }, [uid, email, sending, refreshUser, sendVerifyEmail]);

  useEffect(() => {
    if (!uid || autoSentRef.current) return;
    const guardKey = `elec-otp-autosent:${uid}`;
    try {
      if (sessionStorage.getItem(guardKey)) {
        autoSentRef.current = true;
        return;
      }
      sessionStorage.setItem(guardKey, String(Date.now()));
    } catch { /* ignore */ }
    autoSentRef.current = true;
    sendOtp({ isAuto: true });
  }, [uid, sendOtp]);

  const code = digits.join('');

  const handleDigitChange = (index, rawVal) => {
    const clean = sanitizeOtpInput(rawVal);
    if (!clean) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (clean.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < OTP_LENGTH; i += 1) {
        next[i] = clean[i] || '';
      }
      setDigits(next);
      const focusIdx = Math.min(clean.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData('text') || '';
    const clean = sanitizeOtpInput(text);
    if (!clean) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < OTP_LENGTH; i += 1) {
      next[i] = clean[i] || '';
    }
    setDigits(next);
    const focusIdx = Math.min(clean.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (code.length !== OTP_LENGTH) {
      setStatus({ type: 'err', text: 'Vui lòng nhập đủ 6 chữ số trong email.' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await verifyEmailOtpCode(code);
      await refreshUser(true);
    } catch (err) {
      setStatus({ type: 'err', text: err?.message || 'Mã xác thực không đúng.' });
    } finally {
      setBusy(false);
    }
  };

  const handleCheckLink = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const updated = await refreshUser(true);
      if (!updated?.emailVerified) {
        setStatus({
          type: 'err',
          text: 'Email vẫn chưa được xác thực. Hãy mở hộp thư, bấm vào liên kết xác thực rồi thử lại.',
        });
      }
    } catch (err) {
      setStatus({ type: 'err', text: err?.message || 'Không kiểm tra được trạng thái xác thực.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="veg-wrap">
      <div className="veg-card">
        <div className="veg-top">
          <div className="veg-brand">
            <img
              src="/img/logo.png"
              alt=""
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span>ELEC AI</span>
          </div>
          <span className="veg-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 7l9 6 9-6" />
            </svg>
            {linkFallbackMode ? 'Xác thực Gmail' : 'Xác thực Gmail · OTP 6 số'}
          </span>
        </div>

        <header className="veg-head">
          <h1>{linkFallbackMode ? 'Kiểm tra hộp thư của bạn' : 'Nhập mã xác thực'}</h1>
          <p>
            {linkFallbackMode ? (
              <>
                Chúng tôi đã gửi liên kết kích hoạt tới <span className="veg-email-pill">{email}</span>.
              </>
            ) : (
              <>
                Mã xác thực 6 chữ số được gửi tới <span className="veg-email-pill">{email}</span> (hiệu lực 10 phút).
              </>
            )}
          </p>
        </header>

        {!linkFallbackMode ? (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="veg-otp-grid" onPaste={handlePaste}>
              {digits.map((d, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  maxLength={6}
                  value={d}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  aria-label={`Chữ số thứ ${idx + 1}`}
                  className={`veg-otp-box ${d ? 'filled' : ''}`}
                />
              ))}
            </div>

            {status && (
              <div className={`veg-msg ${status.type}`}>{status.text}</div>
            )}

            <button
              type="submit"
              disabled={busy || code.length < OTP_LENGTH}
              className="veg-primary-btn"
            >
              {busy ? 'Đang kiểm tra mã…' : 'Xác nhận mã & Vào ứng dụng'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ol className="veg-steps">
              <li>Mở hộp thư đến Gmail (kiểm tra thêm mục <b>Spam / Quảng cáo</b>).</li>
              <li>Bấm vào liên kết kích hoạt tài khoản từ <b>ELEC AI</b>.</li>
              <li>Quay lại đây và bấm nút <b>Tôi đã bấm link xác thực</b> bên dưới.</li>
            </ol>

            {status && (
              <div className={`veg-msg ${status.type}`}>{status.text}</div>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={handleCheckLink}
              className="veg-primary-btn"
            >
              {busy ? 'Đang kiểm tra…' : 'Tôi đã bấm link xác thực → Vào ứng dụng'}
            </button>
          </div>
        )}

        <div className="veg-actions-row">
          {isGmail && (
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="veg-sec-btn"
            >
              Mở Gmail ngay
            </a>
          )}
          <button
            type="button"
            disabled={sending || cooldown > 0}
            onClick={() => sendOtp({ isAuto: false })}
            className="veg-sec-btn"
          >
            {sending
              ? 'Đang gửi…'
              : cooldown > 0
                ? `Gửi lại sau ${cooldown}s`
                : linkFallbackMode
                  ? 'Gửi lại link xác thực'
                  : 'Gửi lại mã 6 số'}
          </button>
        </div>

        <footer className="veg-foot">
          <span>Nhập nhầm email?</span>
          <button
            type="button"
            onClick={() => logout()}
            className="veg-link-btn"
          >
            Đăng xuất &amp; dùng tài khoản khác
          </button>
        </footer>
      </div>
    </div>
  );
}
