import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { translateAuthError } from '../lib/firebase.js';
import Glyph, { pwStrength, STRENGTH_LABELS } from './AuthKit.jsx';
import './AuthProfile.css';

const PW_RULES = [
  ['Từ 6 ký tự', (p) => p.length >= 6],
  ['Có chữ hoa và chữ thường', (p) => /[a-z]/.test(p) && /[A-Z]/.test(p)],
  ['Có chữ số', (p) => /\d/.test(p)],
  ['Có ký tự đặc biệt', (p) => /[^A-Za-z0-9]/.test(p)],
];

const FACTS = [
  'Nước là hợp chất phổ biến nhất trên Trái Đất.',
  'Vàng là kim loại có thể kéo thành sợi mỏng hơn tóc người.',
  'Heli là nguyên tố duy nhất không đông đặc ở 0K.',
  'Kim cương và than chì đều làm từ Cacbon.',
];

export default function LoginPage() {
  const { login, register, loginWithGoogle, loginFacebook, resetPassword } = useAuth();

  const [mode, setMode] = useState('login');           // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [caps, setCaps] = useState(false);
  const [fact, setFact] = useState(0);
  const [shake, setShake] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const forgotRef = useRef(null);

  const isRegister = mode === 'register';
  const pwScore = pwStrength(password);

  useEffect(() => {
    const t = setInterval(() => setFact((f) => (f + 1) % FACTS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const d = forgotRef.current;
    if (!d) return;
    if (forgotOpen && !d.open) d.showModal();
    if (!forgotOpen && d.open) d.close();
  }, [forgotOpen]);

  const fail = (msg) => {
    setErr(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setInfo('');

    if (isRegister) {
      if (!firstName.trim() || !lastName.trim()) return fail('Vui lòng nhập họ và tên.');
      if (password.length < 6) return fail('Mật khẩu phải từ 6 ký tự.');
      if (password !== confirm) return fail('Mật khẩu xác nhận không khớp.');
      if (!agree) return fail('Bạn cần đồng ý với điều khoản sử dụng.');
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, firstName.trim(), lastName.trim(), remember);
        setInfo('Đăng ký thành công! Kiểm tra email để xác thực tài khoản.');
      } else {
        await login(email.trim(), password, remember);
      }
    } catch (x) {
      fail(x.code ? translateAuthError(x.code) : (x.message || 'Có lỗi xảy ra.'));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setErr('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (x) {
      fail(x.code ? translateAuthError(x.code) : (x.message || 'Đăng nhập Google thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  const onFacebook = async () => {
    setErr('');
    setLoading(true);
    try {
      await loginFacebook();
    } catch (x) {
      fail(x.code ? translateAuthError(x.code) : (x.message || 'Đăng nhập Facebook thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      await resetPassword(forgotEmail.trim());
      setInfo('Đã gửi link khôi phục. Kiểm tra hộp thư (cả Spam).');
      setForgotOpen(false);
      setForgotEmail('');
    } catch (x) {
      fail(x.code ? translateAuthError(x.code) : (x.message || 'Không gửi được email.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setErr('');
    setInfo('');
  };

  return (
    <div className="lx-page">
      <div className="lx-shell">
        {/* ==== PANEL TRÁI ==== */}
        <div className="lx-hero">
          <div className="lx-hero-glow" aria-hidden="true" />

          <header className="lx-hero-head">
            <span className="lx-hero-dot" />
            <span className="lx-hero-brand">A7 K60 DTA</span>
          </header>

          <div className="lx-hero-body">
            <h1 className="lx-hero-title">
              Học Hóa học
              <em>thông minh hơn.</em>
            </h1>
            <p className="lx-hero-sub">
              Trợ lý AI, bảng tuần hoàn tương tác, quiz thông minh — tất cả trong một.
            </p>
          </div>

          <footer className="lx-hero-foot">
            <div className="lx-fact-wrap">
              <small>Bạn có biết?</small>
              <p className="lx-fact" key={fact}>{FACTS[fact]}</p>
            </div>
            <div className="lx-dots" aria-hidden="true">
              {FACTS.map((_, i) => <span key={i} className={i === fact ? 'on' : ''} />)}
            </div>
          </footer>
        </div>

        {/* ==== PANEL PHẢI ==== */}
        <div className="lx-card">
          <div className={'lx-inner' + (shake ? ' shake' : '')}>
            <div className="lx-topbar">
              <span className="lx-lang">VI</span>
            </div>

            <div className="lx-welcome">
              <h2>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</h2>
              <p>{isRegister ? 'Miễn phí, không cần thẻ tín dụng.' : 'Chào mừng trở lại!'}</p>
            </div>

            <div className="lx-social">
              <button type="button" className="lx-social-btn" onClick={onGoogle} disabled={loading}>
                <Glyph name="google" size={16} />
                Google
              </button>
              <button type="button" className="lx-social-btn" onClick={onFacebook} disabled={loading}>
                <Glyph name="facebook" size={16} />
                Facebook
              </button>
            </div>

            <div className="lx-divider"><span>hoặc</span></div>

            <form className="lx-form" onSubmit={onSubmit} noValidate>
              {isRegister && (
                <div className="lx-name-row">
                  <div className="lx-field">
                    <input
                      id="lx-last"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder=" "
                      autoComplete="family-name"
                    />
                    <label htmlFor="lx-last">Họ</label>
                  </div>
                  <div className="lx-field">
                    <input
                      id="lx-first"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder=" "
                      autoComplete="given-name"
                    />
                    <label htmlFor="lx-first">Tên</label>
                  </div>
                </div>
              )}

              <div className="lx-field">
                <input
                  id="lx-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  autoComplete="email"
                  required
                />
                <label htmlFor="lx-email">Email</label>
              </div>

              <div className="lx-field">
                <input
                  id="lx-pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCaps(!!e.getModifierState?.('CapsLock'))}
                  onBlur={() => setCaps(false)}
                  placeholder=" "
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                />
                <label htmlFor="lx-pw">Mật khẩu</label>
                <div className="lx-right">
                  <button
                    type="button"
                    className="lx-eye"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <Glyph name={showPw ? 'eyeOff' : 'eye'} size={17} />
                  </button>
                </div>
              </div>

              {caps && (
                <p className="lx-hint"><Glyph name="alert" size={12} /> Caps Lock đang bật</p>
              )}

              {isRegister && (
                <div className="lx-collapse open">
                  <div>
                    <div className="lx-field">
                      <input
                        id="lx-confirm"
                        type={showPw ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder=" "
                        autoComplete="new-password"
                      />
                      <label htmlFor="lx-confirm">Nhập lại mật khẩu</label>
                    </div>

                    {password && (
                      <div className="lx-strength">
                        <div className="lx-meter" data-s={pwScore}>
                          <i /><i /><i /><i />
                        </div>
                        <span className="lx-meter-label">{STRENGTH_LABELS[pwScore]}</span>
                      </div>
                    )}

                    <ul className="pf-rules" style={{ marginTop: '.6rem' }}>
                      {PW_RULES.map(([t, f]) => (
                        <li key={t} className={f(password) ? 'ok' : ''}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {!isRegister && (
                <div className="lx-row-between">
                  <label className="lx-checkbox">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Ghi nhớ đăng nhập
                  </label>
                  <button
                    type="button"
                    className="lx-link"
                    onClick={() => setForgotOpen(true)}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {isRegister && (
                <label className="lx-checkbox lx-checkbox-terms">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <span>
                    Tôi đồng ý với <a href="#terms">Điều khoản</a> và <a href="#privacy">Chính sách bảo mật</a>.
                  </span>
                </label>
              )}

              {err && (
                <p className="lx-err"><Glyph name="alert" size={15} />{err}</p>
              )}
              {info && (
                <p className="lx-info"><Glyph name="check" size={15} />{info}</p>
              )}

              <button type="submit" className="lx-submit" disabled={loading}>
                {loading ? (
                  <><Glyph name="spinner" size={16} className="spin" /> Đang xử lý…</>
                ) : (
                  <>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'} <span className="lx-arrow">→</span></>
                )}
              </button>
            </form>

            <p className="lx-switch">
              {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
              <button type="button" onClick={toggleMode}>
                {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
              </button>
            </p>

            <p className="lx-note">
              Bằng cách tiếp tục, bạn đồng ý với Điều khoản & Chính sách của A7 K60 DTA.
            </p>
          </div>
        </div>
      </div>

      {/* ==== DIALOG QUÊN MẬT KHẨU ==== */}
      <dialog
        ref={forgotRef}
        className="pf-dialog"
        onClose={() => setForgotOpen(false)}
        onClick={(e) => e.target === forgotRef.current && setForgotOpen(false)}
      >
        <h3>Quên mật khẩu?</h3>
        <p>Nhập email đã đăng ký — chúng mình sẽ gửi link khôi phục.</p>
        <form onSubmit={onForgot}>
          <input
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="Email của bạn"
            autoFocus
            required
          />
          <div className="pf-actions flat" style={{ marginTop: '.8rem' }}>
            <button type="button" className="pf-btn" onClick={() => setForgotOpen(false)}>Hủy</button>
            <button type="submit" className="pf-btn primary" disabled={loading}>Gửi link</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}