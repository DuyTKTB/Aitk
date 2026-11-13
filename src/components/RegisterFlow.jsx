/* ============================================================
   RegisterFlow.jsx — Đăng ký tài khoản 3 bước (Google hoặc Email xác thực)
   ------------------------------------------------------------
   • Hỗ trợ cả "Đăng ký nhanh với Google" VÀ "Email + Mật khẩu"
     (cho người dùng quên mật khẩu Google hoặc dùng email khác).
   • Thu thập đầy đủ: Họ, Tên, Vai trò, Lớp, Trường, Xã/Phường,
     Quận/Huyện (tuỳ chọn), Tỉnh/Thành phố.
   • Khi tạo bằng Email/Mật khẩu: tự gửi email xác thực và chuyển
     sang cổng xác thực Email để chặn 100% Gmail ảo.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { translateAuthError } from '../lib/firebase.js';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  validateRegisterForm, validateEmail, validateName,
  passwordChecks, passwordScore, passwordStrengthLabel,
  mapAuthError, nextFailure, lockRemaining, formatDuration,
  emptyLockState, MIN_PASSWORD, joinNameParts,
} from '../lib/authValidation.js';
import { VIETNAM_PROVINCES, GRADES_LIST } from '../lib/userProfileService.js';
import '../styles/register-flow.css';

const LOCK_KEY = 'elec-register-lock';
const TOTAL_STEPS = 3;

function readLock() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCK_KEY) || 'null');
    return raw && typeof raw === 'object' ? raw : emptyLockState();
  } catch { return emptyLockState(); }
}

function saveLock(state) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(state)); } catch { /* bỏ qua */ }
}

function suggestPassword() {
  const sets = ['abcdefghjkmnpqrstuvwxyz', 'ABCDEFGHJKMNPQRSTUVWXYZ', '23456789', '!@#$%&*?'];
  const buf = [];
  const rnd = new Uint32Array(14);
  (globalThis.crypto || {}).getRandomValues?.(rnd);
  for (let i = 0; i < 14; i += 1) {
    const set = sets[i < 4 ? i : Math.floor((rnd[i] || i * 7) % 4)];
    buf.push(set[(rnd[i] || i * 13) % set.length]);
  }
  return buf.sort(() => 0.5 - ((rnd[0] || 1) % 2)).join('');
}

const Ico = {
  mail: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 7l9 6 9-6" />
    </svg>
  ),
  lock: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect x="4" y="10" width="16" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  user: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
  school: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" /><path d="M6 10v6c0 1.7 2.7 3 6 3s6-1.3 6-3v-6" />
    </svg>
  ),
  pin: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M12 2a7 7 0 0 0-7 7c0 4.8 7 12 7 12s7-7.2 7-12a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  eye: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.8" />
    </svg>
  ),
  eyeOff: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M3 3l18 18" /><path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-2.9 3.4" /><path d="M6.2 8.3A16.7 16.7 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 3.6-.7" />
    </svg>
  ),
  alert: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" {...p}>
      <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
    </svg>
  ),
  check: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  ),
  arrow: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M5 12h13" /><path d="M12 5l7 7-7 7" />
    </svg>
  ),
};

export default function RegisterFlow({ onDone, onBack }) {
  const { register, loginWithGoogle } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    role: 'student',
    grade: 'Lớp 12',
    school: '',
    province: '',
    ward: '',
    email: '',
    password: '',
    confirm: '',
    terms: false,
  });
  const [fieldErr, setFieldErr] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [caps, setCaps] = useState(false);
  const [lock, setLock] = useState(readLock);
  const [now, setNow] = useState(Date.now());
  const firstInputRef = useRef(null);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErr('');
    setFieldErr({});
  };

  useEffect(() => {
    if (!lockRemaining(lock, now)) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lock, now]);

  useEffect(() => {
    if (step === 1) firstInputRef.current?.focus();
  }, [step]);

  const fullName = useMemo(
    () => joinNameParts(form.lastName, form.firstName),
    [form.lastName, form.firstName]
  );

  const checks = useMemo(() => passwordChecks(form.password), [form.password]);
  const score = useMemo(() => passwordScore(form.password), [form.password]);
  const strength = passwordStrengthLabel(score);
  const lockedMs = lockRemaining(lock, now);

  const goStep2 = () => {
    const e = {};
    if (!String(form.lastName).trim()) e.lastName = 'Nhập họ và tên đệm.';
    if (!String(form.firstName).trim()) e.firstName = 'Nhập tên của bạn.';
    const n = validateName(fullName);
    if (!n.ok && !e.lastName && !e.firstName) e.firstName = n.error;
    if (!['student', 'teacher'].includes(form.role)) e.role = 'Chọn vai trò.';
    if (!form.province) e.province = 'Chọn Tỉnh / Thành phố.';
    if (!String(form.ward).trim()) e.ward = 'Nhập Phường / Xã / Thị trấn.';
    if (String(form.school).trim().length < 2) {
      e.school = form.role === 'teacher' ? 'Nhập tên trường bạn đang công tác.' : 'Nhập tên trường bạn đang học.';
    }
    setFieldErr(e);
    if (!Object.keys(e).length) setStep(2);
  };

  const goStep3 = () => {
    const res = validateRegisterForm({
      ...form,
      name: fullName,
      terms: true,
    });
    const e = {};
    const m = validateEmail(form.email);
    if (!m.ok) e.email = m.error;
    if (res.errors.password) e.password = res.errors.password;
    if (res.errors.confirm) e.confirm = res.errors.confirm;
    setFieldErr(e);
    if (!Object.keys(e).length) setStep(3);
  };

  const submit = async () => {
    const res = validateRegisterForm({ ...form, name: fullName });
    if (!res.ok) { setFieldErr(res.errors); return; }
    if (lockedMs > 0) return;

    setBusy(true);
    setErr('');
    try {
      await register(res.normalized.email, form.password, res.normalized.name, {
        role: res.normalized.role,
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        school: res.normalized.school,
        province: form.province,
        ward: form.ward.trim(),
        grade: form.role === 'teacher' ? 'Sinh viên / Giáo viên' : form.grade,
        termsAcceptedAt: Date.now(),
      });

      saveLock(emptyLockState());
      setLock(emptyLockState());
      onDone?.();
    } catch (e) {
      const st = nextFailure(lock, Date.now());
      saveLock(st);
      setLock(st);
      setErr(mapAuthError(e?.code || e?.message));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleQuick = async () => {
    setErr('');
    setBusy(true);
    try {
      await loginWithGoogle({ role: form.role, school: form.school.trim(), termsAcceptedAt: Date.now() });
      onDone?.();
    } catch (e2) {
      const code = String(e2?.code || '');
      setErr(code ? translateAuthError(code) : 'Không đăng ký được bằng Google.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rf">
      <header className="rf-head">
        <div className="rf-steps" aria-label={`Bước ${step} trên ${TOTAL_STEPS}`}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={'rf-dot' + (step === i ? ' on' : '') + (step > i ? ' done' : '')}>
              {step > i ? <Ico.check /> : i}
            </span>
          ))}
        </div>
        <h1>
          {step === 1 ? 'Thông tin cá nhân & Trường lớp'
            : step === 2 ? 'Email xác thực & Mật khẩu'
            : 'Xác nhận và tạo tài khoản'}
        </h1>
        <p>
          {step === 1 ? 'Nhập đúng Họ, Tên, Trường, Xã và Tỉnh để đồng bộ hồ sơ chuẩn xác.'
            : step === 2 ? `Dùng email thật để nhận link kích hoạt. Mật khẩu tối thiểu ${MIN_PASSWORD} ký tự.`
            : 'Kiểm tra lại toàn bộ thông tin trước khi tạo.'}
        </p>
      </header>

      {step === 1 && (
        <>
          <button
            type="button"
            className="lg-google"
            disabled={busy}
            onClick={handleGoogleQuick}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C41.9 35 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
            </svg>
            <span>Đăng ký nhanh với Google</span>
          </button>
          <div className="lg-divider"><span>hoặc nhập thông tin &amp; email riêng</span></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr', gap: 8 }}>
            <div>
              <label className="rf-field">
                <span className="rf-ic"><Ico.user /></span>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set({ lastName: e.target.value })}
                  placeholder="Họ & tên đệm (VD: Nguyễn Văn)"
                  autoComplete="family-name"
                  maxLength={40}
                />
              </label>
              {fieldErr.lastName && <p className="rf-err">{fieldErr.lastName}</p>}
            </div>
            <div>
              <label className="rf-field">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set({ firstName: e.target.value })}
                  placeholder="Tên (VD: An)"
                  autoComplete="given-name"
                  maxLength={20}
                />
              </label>
              {fieldErr.firstName && <p className="rf-err">{fieldErr.firstName}</p>}
            </div>
          </div>

          <div className="rf-role">
            {[
              { key: 'student', label: 'Học sinh', hint: 'Tham gia lớp, làm bài' },
              { key: 'teacher', label: 'Giáo viên', hint: 'Tạo lớp, giao đề' },
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                className={'rf-role-btn' + (form.role === r.key ? ' on' : '')}
                onClick={() => set({ role: r.key })}
              >
                <b>{r.label}</b>
                <small>{r.hint}</small>
              </button>
            ))}
          </div>

          {form.role === 'student' && (
            <label className="rf-field">
              <span className="rf-ic"><Ico.school /></span>
              <select
                value={form.grade}
                onChange={(e) => set({ grade: e.target.value })}
                aria-label="Lớp đang học"
                style={{
                  flex: 1,
                  border: 0,
                  background: 'transparent',
                  color: 'inherit',
                  font: 'inherit',
                  padding: '0.62rem 0.25rem',
                  outline: 'none',
                }}
              >
                {GRADES_LIST.map((g) => (
                  <option key={g} value={g} style={{ color: '#0f172a' }}>{g}</option>
                ))}
              </select>
            </label>
          )}

          <label className="rf-field">
            <span className="rf-ic"><Ico.school /></span>
            <input
              type="text"
              value={form.school}
              onChange={(e) => set({ school: e.target.value })}
              placeholder={form.role === 'teacher' ? 'Trường công tác (VD: THPT Lê Quý Đôn)' : 'Trường đang học (VD: THPT Lê Quý Đôn)'}
              maxLength={80}
            />
          </label>
          {fieldErr.school && <p className="rf-err">{fieldErr.school}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="rf-field">
                <span className="rf-ic"><Ico.pin /></span>
                <select
                  value={form.province}
                  onChange={(e) => set({ province: e.target.value })}
                  aria-label="Tỉnh / Thành phố"
                  style={{
                    flex: 1,
                    border: 0,
                    background: 'transparent',
                    color: 'inherit',
                    font: 'inherit',
                    padding: '0.62rem 0.25rem',
                    outline: 'none',
                    minWidth: 0,
                  }}
                >
                  <option value="" style={{ color: '#0f172a' }}>Tỉnh / Thành phố *</option>
                  {VIETNAM_PROVINCES.map((p) => (
                    <option key={p} value={p} style={{ color: '#0f172a' }}>{p}</option>
                  ))}
                </select>
              </label>
              {fieldErr.province && <p className="rf-err">{fieldErr.province}</p>}
            </div>

            <div>
              <label className="rf-field">
                <input
                  type="text"
                  value={form.ward}
                  onChange={(e) => set({ ward: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') goStep2(); }}
                  placeholder="Phường / Xã / Đặc khu *"
                  maxLength={60}
                />
              </label>
              {fieldErr.ward && <p className="rf-err">{fieldErr.ward}</p>}
            </div>
          </div>

          <div className="rf-actions">
            <button type="button" className="rf-btn primary" onClick={goStep2}>
              Tiếp tục <Ico.arrow />
            </button>
            <button type="button" className="rf-btn ghost" onClick={() => onBack?.()}>
              Đã có tài khoản
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <label className="rf-field">
            <span className="rf-ic"><Ico.mail /></span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="Email thật để nhận link xác thực"
              autoComplete="email"
              inputMode="email"
              autoFocus
            />
          </label>
          {fieldErr.email && <p className="rf-err">{fieldErr.email}</p>}

          <label className="rf-field">
            <span className="rf-ic"><Ico.lock /></span>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') || false)}
              placeholder="Mật khẩu"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="rf-eye"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPass ? <Ico.eyeOff /> : <Ico.eye />}
            </button>
          </label>

          {form.password && (
            <div className="rf-strength" data-tone={strength.tone}>
              <div className="rf-meter"><span style={{ width: `${(score + 1) * 20}%` }} /></div>
              <span className="rf-strength-label">Độ mạnh: <b>{strength.label}</b></span>
            </div>
          )}

          <ul className="rf-checks">
            <li className={checks.length ? 'ok' : ''}>{checks.length ? <Ico.check /> : <span className="rf-dotx" />} Ít nhất {MIN_PASSWORD} ký tự</li>
            <li className={checks.upper && checks.lower ? 'ok' : ''}>{(checks.upper && checks.lower) ? <Ico.check /> : <span className="rf-dotx" />} Có chữ hoa và chữ thường</li>
            <li className={checks.digit ? 'ok' : ''}>{checks.digit ? <Ico.check /> : <span className="rf-dotx" />} Có chữ số</li>
            <li className={checks.special ? 'ok' : ''}>{checks.special ? <Ico.check /> : <span className="rf-dotx" />} Có ký tự đặc biệt (!@#$…)</li>
          </ul>

          <label className="rf-field">
            <span className="rf-ic"><Ico.lock /></span>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.confirm}
              onChange={(e) => set({ confirm: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') goStep3(); }}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
            />
          </label>
          {fieldErr.password && <p className="rf-err">{fieldErr.password}</p>}
          {fieldErr.confirm && <p className="rf-err">{fieldErr.confirm}</p>}
          {caps && <p className="rf-hint">Caps Lock đang bật.</p>}

          <button
            type="button"
            className="rf-link"
            onClick={() => {
              const p = suggestPassword();
              set({ password: p, confirm: p });
              setShowPass(true);
            }}
          >
            Gợi ý mật khẩu mạnh
          </button>

          <div className="rf-actions">
            <button type="button" className="rf-btn primary" onClick={goStep3}>
              Tiếp tục <Ico.arrow />
            </button>
            <button type="button" className="rf-btn ghost" onClick={() => setStep(1)}>Quay lại</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <dl className="rf-summary">
            <div><dt>Họ &amp; Tên</dt><dd>{fullName || '—'}</dd></div>
            <div><dt>Email</dt><dd>{form.email || '—'}</dd></div>
            <div><dt>Vai trò</dt><dd>{form.role === 'teacher' ? 'Giáo viên' : `Học sinh (${form.grade})`}</dd></div>
            <div><dt>Trường</dt><dd>{form.school || '—'}</dd></div>
            <div>
              <dt>Địa chỉ</dt>
              <dd>{[form.ward, form.province].filter(Boolean).join(', ') || '—'}</dd>
            </div>
            <div><dt>Mật khẩu</dt><dd>{'•'.repeat(Math.min(form.password.length, 10))} ({strength.label})</dd></div>
          </dl>

          <label className="rf-terms">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => set({ terms: e.target.checked })}
            />
            <span>
              Tôi đồng ý với <b>Điều khoản sử dụng</b> và <b>Chính sách riêng tư</b>; tôi cam kết dùng email thật để xác thực tài khoản.
            </span>
          </label>
          {fieldErr.terms && <p className="rf-err">{fieldErr.terms}</p>}

          {err && <p className="rf-msg err"><Ico.alert /> {err}</p>}
          {lockedMs > 0 && (
            <p className="rf-msg err">
              <Ico.alert /> Bị tạm khoá do thử nhiều lần. Thử lại sau {formatDuration(lockedMs)}.
            </p>
          )}

          <div className="rf-actions">
            <button type="button" className="rf-btn primary" onClick={submit} disabled={busy || lockedMs > 0}>
              {busy ? <span className="rf-spinner" aria-hidden="true" /> : <>Tạo tài khoản &amp; Xác thực Email <Ico.arrow /></>}
            </button>
            <button type="button" className="rf-btn ghost" onClick={() => setStep(2)} disabled={busy}>
              Quay lại
            </button>
          </div>

          <p className="rf-hint">
            Sau khi tạo, hệ thống sẽ yêu cầu xác thực qua hộp thư trước khi mở khóa Credit miễn phí và lớp học (chặn Gmail ảo).
          </p>
        </>
      )}

      {step === 1 && err && <p className="rf-msg err"><Ico.alert /> {err}</p>}

      <footer className="rf-foot">
        Hỗ trợ cả Google lẫn Email cá nhân có xác thực link thật • Bảo vệ tài khoản 2 lớp.
      </footer>
    </div>
  );
}
