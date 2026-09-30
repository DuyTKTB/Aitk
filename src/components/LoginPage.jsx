import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { translateAuthError } from '../lib/firebase.js';
import AIMark from './AIMark.jsx';
import Glyph, { GoogleMark, pwStrength, STRENGTH_LABELS } from './AuthKit.jsx';
import './AuthProfile.css';

const FACTS = [
  'Điện phân nước thu được khí H₂ và O₂ theo tỉ lệ thể tích 2 : 1.',
  'Kim cương và than chì đều là cacbon, chỉ khác cách sắp xếp nguyên tử.',
  'Mỗi bậc trên thang pH ứng với nồng độ H⁺ chênh nhau 10 lần.',
  'Vàng (Au, Z = 79) gần như không bị oxi hóa trong không khí.',
  'Bảng tuần hoàn hiện có 118 nguyên tố, xếp thành 7 chu kì và 18 nhóm.',
];

/* Ô input có floating label */
function Field({ id, label, type = 'text', value, onChange, right, valid, tab = 0, ...rest }) {
  return (
    <div className={'lx-field' + (valid ? ' valid' : '')}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        tabIndex={tab}
        {...rest}
      />
      <label htmlFor={id}>{label}</label>
      {right && <div className="lx-right">{right}</div>}
    </div>
  );
}

export default function LoginPage() {
  const { register, login, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('cs-last-email') || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [errKey, setErrKey] = useState(0);
  const [info, setInfo] = useState('');
  const [shake, setShake] = useState(false);
  const [factIdx, setFactIdx] = useState(0);

  const pageRef = useRef(null);

  const isReg = mode === 'register';
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const strength = pwStrength(password);

  /* Xoay fact mỗi 5.2s */
  useEffect(() => {
    const t = setInterval(() => setFactIdx((i) => (i + 1) % FACTS.length), 5200);
    return () => clearInterval(t);
  }, []);

  /* Parallax nhẹ theo con trỏ */
  const onMove = (e) => {
    const el = pageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };

  const fail = (msg) => {
    setInfo('');
    setErr(msg);
    setErrKey((k) => k + 1);
    setShake(true);
    setTimeout(() => setShake(false), 520);
  };
  const clear = () => { setErr(''); setInfo(''); };
  const switchMode = (m) => { setMode(m); setShowPw(false); setCaps(false); clear(); };

  const submit = async (e) => {
    e.preventDefault();
    clear();
    setLoading(true);
    try {
      if (isReg) {
        if (!name.trim()) throw new Error('Vui lòng nhập tên hiển thị.');
        if (name.trim().length < 2) throw new Error('Tên phải từ 2 ký tự.');
        if (password.length < 6) throw new Error('Mật khẩu phải từ 6 ký tự.');
        await register(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      try { localStorage.setItem('cs-last-email', email.trim()); } catch { /* ignore */ }
    } catch (e) {
      fail(e.code ? translateAuthError(e.code) : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    clear();
    setLoading(true);
    try { await loginWithGoogle(); }
    catch (e) { fail(e.code ? translateAuthError(e.code) : e.message); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    clear();
    if (!emailOk) return fail('Nhập email hợp lệ vào ô Email, rồi bấm lại.');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setInfo('Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư (cả mục Spam).');
    } catch (e) {
      fail(e.code ? translateAuthError(e.code) : e.message);
    } finally {
      setLoading(false);
    }
  };

  const capsCheck = (e) => setCaps(!!e.getModifierState?.('CapsLock'));

  return (
    <div className="lx-page" ref={pageRef} onPointerMove={onMove}>
      {/* ============ KHUNG 2 PANEL ============ */}
      <div className="lx-shell">
        {/* ---------- PANEL TRÁI: ĐEN + AIMARK ---------- */}
        <aside className="lx-hero">
          <div className="lx-hero-glow" aria-hidden="true" />

          <header className="lx-hero-head">
            <span className="lx-hero-dot" aria-hidden="true" />
            <span className="lx-hero-brand">A7 K60 DTA</span>
          </header>

          <div className="lx-hero-body">
            <h1 className="lx-hero-title">
              Học Hóa
              <em>nhẹ như khí hiđro.</em>
            </h1>
            <p className="lx-hero-sub">
              Trợ lý AI, bảng tuần hoàn, quiz, phòng lab ảo — tất cả trong một.
            </p>

            <div className="lx-hero-mark">
              <AIMark size={260} look />
            </div>
          </div>

          <footer className="lx-hero-foot">
            <div className="lx-fact-wrap">
              <small>Bạn có biết?</small>
              <p key={factIdx} className="lx-fact">{FACTS[factIdx]}</p>
            </div>
            <div className="lx-dots">
              {FACTS.map((f, i) => (
                <span key={f} className={i === factIdx ? 'on' : ''} />
              ))}
            </div>
          </footer>
        </aside>

        {/* ---------- PANEL PHẢI: TRẮNG + FORM ---------- */}
        <main className="lx-card">
          <div className={'lx-inner' + (shake ? ' shake' : '')}>
            {/* Topbar giả lập ngôn ngữ */}
            <div className="lx-topbar">
              <span className="lx-lang">VN <Glyph name="chevronDown" size={12} /></span>
            </div>

            <div className="lx-welcome" key={mode}>
              <h2>{isReg ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h2>
              <p>
                {isReg
                  ? 'Mất chưa đến một phút để bắt đầu học.'
                  : 'Đăng nhập để tiếp tục chuỗi ngày học của bạn.'}
              </p>
            </div>

            {/* Social */}
            <div className="lx-social">
              <button
                type="button"
                className="lx-social-btn"
                onClick={handleGoogle}
                disabled={loading}
              >
                <GoogleMark size={18} />
                <span>Đăng nhập với Google</span>
              </button>
              <button
                type="button"
                className="lx-social-btn"
                disabled
                title="Sắp ra mắt"
              >
                <Glyph name="facebook" size={18} />
                <span>Đăng nhập với Facebook</span>
              </button>
            </div>

            <div className="lx-divider"><span>hoặc</span></div>

            <form className="lx-form" onSubmit={submit}>
              <div className={'lx-collapse' + (isReg ? ' open' : '')} aria-hidden={!isReg}>
                <div>
                  <Field
                    id="lx-name"
                    label="Tên hiển thị *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={30}
                    autoComplete="name"
                    tab={isReg ? 0 : -1}
                    valid={name.trim().length >= 2}
                    right={name.trim().length >= 2 && <span className="lx-ok"><Glyph name="check" size={18} /></span>}
                  />
                </div>
              </div>

              <Field
                id="lx-email"
                label="Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                valid={emailOk}
                right={emailOk && <span className="lx-ok"><Glyph name="check" size={18} /></span>}
              />

              <Field
                id="lx-pw"
                label={isReg ? 'Mật khẩu * (tối thiểu 6 ký tự)' : 'Mật khẩu *'}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={capsCheck}
                onKeyDown={capsCheck}
                onBlur={() => setCaps(false)}
                autoComplete={isReg ? 'new-password' : 'current-password'}
                required
                right={
                  <button
                    type="button"
                    className="lx-eye"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPw}
                  >
                    <Glyph name={showPw ? 'eyeOff' : 'eye'} size={19} />
                  </button>
                }
              />

              {caps && (
                <p className="lx-hint">
                  <Glyph name="alert" size={14} /> Caps Lock đang bật
                </p>
              )}

              {isReg && password && (
                <div className="lx-strength">
                  <div className="lx-meter" data-s={strength}>
                    {[0, 1, 2, 3].map((i) => (
                      <i key={i} className={i < strength ? 'on' : ''} />
                    ))}
                  </div>
                  <span className="lx-meter-label">{STRENGTH_LABELS[strength]}</span>
                </div>
              )}

              {!isReg && typeof resetPassword === 'function' && (
                <button type="button" className="lx-link" onClick={handleReset} disabled={loading}>
                  Quên mật khẩu?
                </button>
              )}

              {err && (
                <p key={errKey} className="lx-err" role="alert">
                  <Glyph name="alert" size={17} />
                  <span>{err}</span>
                </p>
              )}
              {info && (
                <p className="lx-info" role="status">
                  <Glyph name="mail" size={17} />
                  <span>{info}</span>
                </p>
              )}

              <button className="lx-submit" type="submit" disabled={loading}>
                <span>{loading ? 'Đang xử lý' : isReg ? 'Tạo tài khoản' : 'Đăng nhập'}</span>
                {loading
                  ? <Glyph name="spinner" size={18} className="spin" />
                  : <Glyph name="arrow" size={18} className="lx-arrow" />}
              </button>
            </form>

            <p className="lx-switch">
              {isReg ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
              <button type="button" onClick={() => switchMode(isReg ? 'login' : 'register')}>
                {isReg ? 'Đăng nhập' : 'Đăng ký ngay'}
              </button>
            </p>

            <p className="lx-note">
              Bằng việc tiếp tục, bạn đồng ý sử dụng app cho mục đích học tập.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}