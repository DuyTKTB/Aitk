/* ============================================================
   RegisterFlow.jsx — đăng ký tài khoản 3 bước, có kiểm tra bảo mật
   ------------------------------------------------------------
   Bước 1: họ tên, vai trò, trường (giáo viên), email
   Bước 2: mật khẩu + nhập lại, thang đo độ mạnh, checklist tiêu chí
   Bước 3: xem lại, đồng ý điều khoản → tạo tài khoản
   Sau khi tạo: gửi email xác thực + nhắc kiểm tra hộp thư.
   Mọi kiểm tra dùng lib/authValidation.js (có test riêng).
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  validateRegisterForm, validateEmail, validateName,
  passwordChecks, passwordScore, passwordStrengthLabel,
  mapAuthError, nextFailure, lockRemaining, formatDuration,
  emptyLockState, MIN_PASSWORD,
} from '../lib/authValidation.js';
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

/* Mật khẩu gợi ý: 14 ký tự, đủ 4 nhóm, loại bỏ ký tự dễ nhầm */
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
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', role: 'student', school: '',
    password: '', confirm: '', terms: false,
  });
  const [fieldErr, setFieldErr] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [caps, setCaps] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [lock, setLock] = useState(readLock);
  const [now, setNow] = useState(Date.now());
  const nameRef = useRef(null);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErr('');
    setFieldErr({});
  };

  /* Đếm ngược khoá thử + nút gửi lại email */
  useEffect(() => {
    if (!lockRemaining(lock, now) && resendIn <= 0) return undefined;
    const t = setInterval(() => {
      setNow(Date.now());
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [lock, now, resendIn]);

  useEffect(() => { if (step === 1) nameRef.current?.focus(); }, [step]);

  const checks = useMemo(() => passwordChecks(form.password), [form.password]);
  const score = useMemo(() => passwordScore(form.password), [form.password]);
  const strength = passwordStrengthLabel(score);
  const lockedMs = lockRemaining(lock, now);

  const goStep2 = () => {
    const e = {};
    const n = validateName(form.name);
    const m = validateEmail(form.email);
    if (!n.ok) e.name = n.error;
    if (!m.ok) e.email = m.error;
    if (form.role === 'teacher' && String(form.school).trim().length < 2) {
      e.school = 'Nhập tên trường của bạn.';
    }
    if (!['student', 'teacher'].includes(form.role)) e.role = 'Chọn vai trò.';
    setFieldErr(e);
    if (!Object.keys(e).length) setStep(2);
  };

  const goStep3 = () => {
    const res = validateRegisterForm({ ...form, terms: true });
    const e = {};
    if (res.errors.password) e.password = res.errors.password;
    if (res.errors.confirm) e.confirm = res.errors.confirm;
    setFieldErr(e);
    if (!Object.keys(e).length) setStep(3);
  };

  const submit = async () => {
    const res = validateRegisterForm(form);
    if (!res.ok) { setFieldErr(res.errors); return; }
    if (lockedMs > 0) return;

    setBusy(true);
    setErr('');
    try {
      const user = await register(res.normalized.email, form.password, res.normalized.name, {
        role: res.normalized.role,
        school: res.normalized.school,
        termsAcceptedAt: Date.now(),
      });

      /* Gửi email xác thực — không chặn đăng ký nếu bước này lỗi */
      try {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser);
        setSentTo(res.normalized.email);
      } catch (e) {
        console.warn('[register] không gửi được email xác thực:', e?.code || e?.message);
        setSentTo('');
      }

      saveLock(emptyLockState());
      setLock(emptyLockState());
      setStep(4);
      if (user?.uid) setResendIn(60);
    } catch (e) {
      const st = nextFailure(lock, Date.now());
      saveLock(st);
      setLock(st);
      setErr(mapAuthError(e?.code || e?.message));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    try {
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
      setResendIn(60);
      setErr('');
    } catch (e) {
      setErr(e?.code === 'auth/too-many-requests'
        ? 'Bạn vừa yêu cầu gửi lại. Đợi một lát rồi thử lại.'
        : 'Không gửi lại được email xác thực.');
    }
  };

  /* ---------- màn hình sau khi tạo tài khoản ---------- */
  if (step === 4) {
    return (
      <div className="rf">
        <header className="rf-head">
          <span className="rf-badge ok"><Ico.check /> Đã tạo tài khoản</span>
          <h1>Kiểm tra hộp thư của bạn</h1>
          <p>
            {sentTo
              ? <>Đã gửi email xác thực tới <b>{sentTo}</b>. Bấm vào link trong email để kích hoạt đầy đủ.</>
              : 'Tài khoản đã tạo. Chưa gửi được email xác thực — bạn có thể gửi lại sau khi vào ứng dụng.'}
          </p>
        </header>

        <ul className="rf-tips">
          <li>Không thấy email? Kiểm tra mục <b>Spam/Quảng cáo</b>.</li>
          <li>Link xác thực chỉ dùng một lần và hết hạn sau vài giờ.</li>
          <li>Chúng tôi <b>không bao giờ</b> hỏi mật khẩu qua chat hay email.</li>
        </ul>

        <div className="rf-actions">
          <button type="button" className="rf-btn primary" onClick={() => onDone?.()}>
            Vào ứng dụng <Ico.arrow />
          </button>
          <button type="button" className="rf-btn" onClick={resend} disabled={resendIn > 0}>
            {resendIn > 0 ? `Gửi lại sau ${resendIn}s` : 'Gửi lại email xác thực'}
          </button>
        </div>

        {err && <p className="rf-msg err"><Ico.alert /> {err}</p>}
      </div>
    );
  }

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
          {step === 1 ? 'Thông tin của bạn' : step === 2 ? 'Tạo mật khẩu' : 'Xác nhận và tạo tài khoản'}
        </h1>
        <p>
          {step === 1 ? 'Dùng tên thật để giáo viên nhận ra bạn trong lớp.'
            : step === 2 ? `Mật khẩu tối thiểu ${MIN_PASSWORD} ký tự, nên có chữ hoa, số và ký tự đặc biệt.`
              : 'Kiểm tra lại một lần trước khi tạo.'}
        </p>
      </header>

      {step === 1 && (
        <>
          <label className="rf-field">
            <span className="rf-ic"><Ico.user /></span>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') goStep2(); }}
              placeholder="Họ và tên (VD: Nguyễn Văn An)"
              autoComplete="name"
              maxLength={60}
            />
          </label>
          {fieldErr.name && <p className="rf-err">{fieldErr.name}</p>}

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

          {form.role === 'teacher' && (
            <>
              <label className="rf-field">
                <span className="rf-ic"><Ico.school /></span>
                <input
                  type="text"
                  value={form.school}
                  onChange={(e) => set({ school: e.target.value })}
                  placeholder="Tên trường (VD: THPT Lê Quý Đôn)"
                  maxLength={80}
                />
              </label>
              {fieldErr.school && <p className="rf-err">{fieldErr.school}</p>}
            </>
          )}

          <label className="rf-field">
            <span className="rf-ic"><Ico.mail /></span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') goStep2(); }}
              placeholder="Email"
              autoComplete="email"
              inputMode="email"
            />
          </label>
          {fieldErr.email && <p className="rf-err">{fieldErr.email}</p>}

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
            <span className="rf-ic"><Ico.lock /></span>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') || false)}
              placeholder="Mật khẩu"
              autoComplete="new-password"
              autoFocus
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
            <div><dt>Họ tên</dt><dd>{form.name || '—'}</dd></div>
            <div><dt>Email</dt><dd>{form.email || '—'}</dd></div>
            <div><dt>Vai trò</dt><dd>{form.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</dd></div>
            {form.role === 'teacher' && <div><dt>Trường</dt><dd>{form.school || '—'}</dd></div>}
            <div><dt>Mật khẩu</dt><dd>{'•'.repeat(Math.min(form.password.length, 10))} ({strength.label})</dd></div>
          </dl>

          <label className="rf-terms">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => set({ terms: e.target.checked })}
            />
            <span>
              Tôi đồng ý với <b>Điều khoản sử dụng</b> và <b>Chính sách riêng tư</b>; dữ liệu học tập
              của tôi được dùng để tạo báo cáo cho lớp.
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
              {busy ? <span className="rf-spinner" aria-hidden="true" /> : <>Tạo tài khoản <Ico.arrow /></>}
            </button>
            <button type="button" className="rf-btn ghost" onClick={() => setStep(2)} disabled={busy}>
              Quay lại
            </button>
          </div>

          <p className="rf-hint">
            Mật khẩu chỉ được Firebase lưu dưới dạng băm — ứng dụng không đọc được mật khẩu của bạn.
          </p>
        </>
      )}

      {step === 1 && err && <p className="rf-msg err"><Ico.alert /> {err}</p>}

      <footer className="rf-foot">
        Bảo vệ tài khoản: mật khẩu mạnh, email xác thực, tạm khoá khi thử quá nhiều lần.
      </footer>
    </div>
  );
}
