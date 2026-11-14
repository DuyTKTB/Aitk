import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { translateAuthError } from '../lib/firebase.js';
import {
  requestResetPasswordOtp,
  verifyResetPasswordOtp,
  sanitizeOtpInput,
} from '../lib/emailOtp.js';
import { BRAND_EMAIL } from '../lib/emailTemplates.js';
import { validatePassword } from '../lib/authValidation.js';
import RegisterFlow from './RegisterFlow.jsx';
import './login-page.css';

/* ============================================================
   SVG ICONS
   ============================================================ */
const IcoGoogle = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C41.9 35 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
  </svg>
);

const IcoMail = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const IcoLock = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const IcoUser = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const IcoEye = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IcoEyeOff = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a18.45 18.45 0 0 1 4.06-4.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" />
  </svg>
);

const IcoArrow = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IcoAlert = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const IcoStudent = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IcoTeacher = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
);

/* ============================================================
   MAIN
   ============================================================ */
export default function LoginPage({ initialMode = 'login', onDone }) {
  const { login, loginWithGoogle, resetPassword, authRedirectError, clearAuthRedirectError } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [tick, setTick] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    setMode(initialMode);
    setForgotStep('email');
  }, [initialMode]);

  useEffect(() => {
    if (!authRedirectError) return;
    setErr(translateAuthError(authRedirectError));
    clearAuthRedirectError?.();
  }, [authRedirectError, clearAuthRedirectError]);

  useEffect(() => {
    if (mode === 'register') return undefined;
    const t = setTimeout(() => firstRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [mode, forgotStep]);

  const isForgot = mode === 'forgot';

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (isForgot && forgotStep === 'email') {
        try {
          await requestResetPasswordOtp(email);
          setForgotStep('otp');
          setInfo(`Đã gửi mã OTP 6 số từ ${BRAND_EMAIL} tới ${email}. Kiểm tra hộp thư (cả mục Spam).`);
        } catch (otpErr) {
          const code = String(otpErr?.code || '');
          if (code === 'HTTP_404' || code === 'OTP_PROVIDER_NOT_CONFIGURED') {
            // Dự phòng chỉ khi môi trường chưa có route/provider /api/email-otp
            await resetPassword(email);
            setInfo('Đã gửi liên kết đặt lại mật khẩu tới email của bạn.');
          } else {
            throw otpErr;
          }
        }
      } else if (isForgot && forgotStep === 'otp') {
        const check = validatePassword(newPass, { email });
        if (!check.ok) {
          setErr(check.errors[0]);
          setBusy(false);
          return;
        }
        if (newPass !== confirmNewPass) {
          setErr('Mật khẩu nhập lại không khớp.');
          setBusy(false);
          return;
        }
        await verifyResetPasswordOtp({ email, code: otpCode, newPassword: newPass });
        setMode('login');
        setForgotStep('email');
        setOtpCode('');
        setNewPass('');
        setConfirmNewPass('');
        setPass('');
        setInfo('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      } else {
        await login(email, pass);
        onDone?.();
      }
    } catch (e2) {
      const msg = String(e2?.code || e2?.message || '');
      setErr(
        msg.includes('invalid-credential') || msg.includes('wrong-password') ? 'Email hoặc mật khẩu không đúng.'
        : msg.includes('user-not-found') ? 'Tài khoản không tồn tại.'
        : msg.includes('invalid-email') ? 'Email không hợp lệ.'
        : msg.includes('too-many-requests') ? 'Quá nhiều lần thử. Vui lòng đợi vài phút.'
        : (e2?.message && !msg.startsWith('auth/')) ? e2.message
        : 'Có lỗi xảy ra, vui lòng thử lại.'
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setErr(''); setBusy(true);
    try {
      const signedInUser = await loginWithGoogle();
      if (signedInUser) onDone?.();
    } catch (e2) {
      const code = String(e2?.code || '');
      setErr(code ? translateAuthError(code) : 'Không đăng nhập được bằng Google.');
    }
    finally { setBusy(false); }
  };

  const switchMode = (m) => {
    setMode(m); setForgotStep('email'); setErr(''); setInfo(''); setTick((t) => !t);
  };

  return (
    <div className="lg-wrap" data-mode={mode}>
      {/* ===== Cột trái: branding ===== */}
      <aside className="lg-aside" aria-hidden="true">
        <div className="lg-aside-bg">
          <span className="lg-aside-orb a" />
          <span className="lg-aside-orb b" />
          <span className="lg-aside-orb c" />
        </div>
        <div className="lg-aside-content">
          <div className="lg-brand">
            <img
              src="/img/logo.png"
              alt=""
              width="40"
              height="40"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <b>ELEC AI</b>
          </div>
          <h2>
            Chinh phục KHTN<br />
            <em>thông minh hơn</em>
          </h2>
          <p>Trợ lý AI 3 môn Lý — Hóa — Sinh, ma trận đề thi chuẩn Bộ GD&ĐT và công cụ giải nhanh — tất cả trong một tài khoản.</p>
          <ul className="lg-points">
            <li>Giải đề từ ảnh chụp, từng bước</li>
            <li>Sinh quiz, sổ câu sai tự động</li>
            <li>Miễn phí cho học sinh 10–12</li>
          </ul>
        </div>
      </aside>

      {/* ===== Cột phải: form ===== */}
      <div className="lg-main">
        <div className="lg-card">
          {mode === 'register' ? (
            <RegisterFlow
              onDone={onDone}
              onBack={() => switchMode('login')}
            />
          ) : (
            <>
          <header className="lg-head">
            <h1>
              {isForgot ? (forgotStep === 'otp' ? 'Nhập mã OTP 6 số' : 'Đặt lại mật khẩu') : 'Chào mừng trở lại'}
            </h1>
            <p>
              {isForgot
                ? (forgotStep === 'otp'
                  ? `Nhập mã 6 số vừa gửi tới ${email} và mật khẩu mới của bạn.`
                  : 'Nhập email để nhận mã OTP 6 số đặt lại mật khẩu ngay tại đây.')
                : 'Đăng nhập bằng Google hoặc Email đã xác thực để tiếp tục học.'}
            </p>
          </header>

          {!isForgot && (
            <>
              <button
                type="button"
                className="lg-google"
                onClick={google}
                disabled={busy}
              >
                <IcoGoogle size={20} />
                <span>{busy ? 'Đang kết nối Google…' : 'Tiếp tục với Google'}</span>
              </button>
              <div className="lg-divider"><span>hoặc đăng nhập bằng Email</span></div>
            </>
          )}

          <form className="lg-form" onSubmit={submit} key={tick}>
            {(!isForgot || forgotStep === 'email') && (
              <label className="lg-field">
                <span className="lg-field-ic"><IcoMail /></span>
                <input
                  ref={firstRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  required
                />
              </label>
            )}

            {isForgot && forgotStep === 'otp' && (
              <>
                <label className="lg-field">
                  <span className="lg-field-ic"><IcoMail /></span>
                  <input
                    ref={firstRef}
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(sanitizeOtpInput(e.target.value))}
                    placeholder="Mã OTP 6 chữ số"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    style={{ letterSpacing: '0.2em', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                </label>

                <label className="lg-field">
                  <span className="lg-field-ic"><IcoLock /></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Mật khẩu mới (≥ 8 ký tự)"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPass ? <IcoEyeOff /> : <IcoEye />}
                  </button>
                </label>

                <label className="lg-field">
                  <span className="lg-field-ic"><IcoLock /></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
              </>
            )}

            {!isForgot && (
              <label className="lg-field">
                <span className="lg-field-ic"><IcoLock /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPass ? <IcoEyeOff /> : <IcoEye />}
                </button>
              </label>
            )}

            {!isForgot && (
              <button
                type="button"
                className="lg-forgot"
                onClick={() => switchMode('forgot')}
              >
                Quên mật khẩu?
              </button>
            )}

            {err && (
              <p className="lg-msg err" role="alert">
                <IcoAlert /> {err}
              </p>
            )}
            {info && (
              <p className="lg-msg ok" role="status">{info}</p>
            )}

            <button type="submit" className="lg-submit" disabled={busy}>
              {busy ? (
                <span className="lg-spinner" aria-hidden="true" />
              ) : (
                <>
                  {isForgot
                    ? (forgotStep === 'otp' ? 'Xác nhận & Đổi mật khẩu' : 'Gửi mã OTP 6 số')
                    : 'Đăng nhập'}
                  <IcoArrow />
                </>
              )}
            </button>
          </form>

          <footer className="lg-foot">
            {isForgot ? (
              <button type="button" onClick={() => switchMode('login')}>
                Quay lại đăng nhập
              </button>
            ) : (
              <p>
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => switchMode('register')}>Đăng ký</button>
              </p>
            )}
          </footer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}