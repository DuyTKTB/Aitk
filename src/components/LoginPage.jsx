import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
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

/* ============================================================
   MAIN
   ============================================================ */
export default function LoginPage({ initialMode = 'login', onDone }) {
  const { login, register, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [tick, setTick] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    const t = setTimeout(() => firstRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [mode]);

  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot';

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (isForgot) {
        await resetPassword(email);
        setInfo('Đã gửi link đặt lại mật khẩu tới email của bạn.');
      } else if (isLogin) {
        await login(email, pass);
        onDone?.();
      } else {
        await register(email, pass, name);
        onDone?.();
      }
    } catch (e2) {
      const msg = String(e2?.code || e2?.message || '');
      setErr(
        msg.includes('invalid-credential') || msg.includes('wrong-password') ? 'Email hoặc mật khẩu không đúng.'
        : msg.includes('user-not-found') ? 'Tài khoản không tồn tại.'
        : msg.includes('email-already-in-use') ? 'Email này đã được đăng ký.'
        : msg.includes('weak-password') ? 'Mật khẩu cần ít nhất 6 ký tự.'
        : msg.includes('invalid-email') ? 'Email không hợp lệ.'
        : msg.includes('too-many-requests') ? 'Quá nhiều lần thử. Vui lòng đợi vài phút.'
        : 'Có lỗi xảy ra, vui lòng thử lại.'
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setErr(''); setBusy(true);
    try { await loginWithGoogle(); onDone?.(); }
    catch { setErr('Không đăng nhập được bằng Google.'); }
    finally { setBusy(false); }
  };

  const switchMode = (m) => {
    setMode(m); setErr(''); setInfo(''); setTick((t) => !t);
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
            <b>A7 K60 DTA</b>
          </div>
          <h2>
            Học Hóa học<br />
            <em>thông minh hơn</em>
          </h2>
          <p>Trợ lý AI, bảng tuần hoàn, cân bằng PTHH và 6 trò chơi học Hóa — tất cả trong một tài khoản.</p>
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
          <header className="lg-head">
            <h1>
              {isForgot ? 'Đặt lại mật khẩu'
                : isLogin ? 'Chào mừng trở lại'
                : 'Tạo tài khoản mới'}
            </h1>
            <p>
              {isForgot ? 'Nhập email để nhận link đặt lại.'
                : isLogin ? 'Đăng nhập để tiếp tục học.'
                : 'Miễn phí, chỉ mất vài giây.'}
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
                <span>Tiếp tục với Google</span>
              </button>
              <div className="lg-divider"><span>hoặc</span></div>
            </>
          )}

          <form className="lg-form" onSubmit={submit} key={tick}>
            {!isLogin && !isForgot && (
              <label className="lg-field">
                <span className="lg-field-ic"><IcoUser /></span>
                <input
                  ref={firstRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên hiển thị"
                  autoComplete="name"
                />
              </label>
            )}

            <label className="lg-field">
              <span className="lg-field-ic"><IcoMail /></span>
              <input
                ref={!isLogin || isForgot ? undefined : firstRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                required
              />
            </label>

            {!isForgot && (
              <label className="lg-field">
                <span className="lg-field-ic"><IcoLock /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Mật khẩu"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
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

            {isLogin && (
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
                  {isForgot ? 'Gửi link đặt lại'
                    : isLogin ? 'Đăng nhập'
                    : 'Tạo tài khoản'}
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
            ) : isLogin ? (
              <p>
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => switchMode('register')}>Đăng ký</button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => switchMode('login')}>Đăng nhập</button>
              </p>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}